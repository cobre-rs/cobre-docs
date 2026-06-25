#!/usr/bin/env bash
#
# promote-site-to-root.sh — the deferred `site/` → repo-root promotion phase of the
# E9 (M4) decommission. Authored under the migration's author-files /
# defer-execution mode: it is a *ready-to-run* artifact the USER invokes ONLY AFTER
# (1) performing + confirming the E8 cutover, AND (2) running ticket-036's removal
# phase (decommission-mdbook.sh --execute, which frees the root `src/` name). It is
# a guaranteed no-op against the current (pre-cutover, pre-removal) repo:
#
#   * default (dry-run): prints the `git mv` plan + the full path-rewrite map,
#                        changes nothing, exits 0;
#   * --execute today:   the cutover guard fails (the cutover has not happened) and
#                        the removal-done guard fails (root src/specs + book.toml
#                        still exist), so it exits non-zero WITHOUT moving anything.
#
# It moves ONLY the tracked top-level tree under site/ via `git mv` (history-
# preserving). It deliberately does NOT move the untracked, regenerated dirs
# (node_modules/, dist/, .astro/, public/d2/) — `git mv` errors on untracked paths
# and they rebuild from source. After the moves it applies a small, EXPLICIT set of
# path rewrites (the only files that hard-code the `site/` prefix) — see the rewrite
# map below; it never broadly seds `site/`, which would corrupt the workflows'
# explanatory banners.
#
# Full procedure: see
#   plans/starlight-migration/epic-09-decommission/decommission-runbook.md
#
# Conventions: repo infra shell standards (set -euo pipefail, quoted expansions,
# [[ ]], local, readonly, trap, command -v guards). Lints clean under shellcheck.
# The cutover-guard logic + dry-run/--execute shape are IDENTICAL to ticket-036's
# decommission-mdbook.sh on purpose (one pattern for a future reader).

set -euo pipefail

readonly RUNBOOK_REL="plans/starlight-migration/epic-09-decommission/decommission-runbook.md"
readonly PROG="${0##*/}"

# ---------------------------------------------------------------------------
# trap diagnostic — make a partial/aborted --execute run obvious. On any
# non-zero exit the handler prints the failing line; re-running --execute is
# idempotent (already-moved sources are skipped) so it resumes cleanly. $LINENO
# is captured at trap time; the guard/usage paths exit with their own messages
# already printed, so this is the backstop for an UNEXPECTED failure mid-move.
# ---------------------------------------------------------------------------
on_error() {
  local code=$?
  echo "${PROG}: ERROR — aborted at line ${1} (exit ${code})." >&2
  echo "${PROG}: any moves already applied are staged in the index; re-run with --execute to resume (idempotent), or inspect with 'git status'." >&2
}
trap 'on_error "${LINENO}"' ERR

# ---------------------------------------------------------------------------
# Prerequisite: git. Resolve the repo root so the script works from any cwd
# (mirrors the Node helpers' path-resolution convention).
# ---------------------------------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
  echo "${PROG}: 'git' not found on PATH — this script requires git." >&2
  exit 1
fi

# Declared then assigned separately so the command substitution's exit status is
# not masked by `readonly` (shellcheck SC2155): a failing `git rev-parse` (e.g.
# run outside a work tree) trips `set -e` here instead of silently yielding "".
REPO_ROOT="$(git rev-parse --show-toplevel)"
readonly REPO_ROOT

# ---------------------------------------------------------------------------
# Workflow files used by the cutover guard (repo-root-relative). IDENTICAL to
# decommission-mdbook.sh.
# ---------------------------------------------------------------------------
readonly MDBOOK_DEPLOY=".github/workflows/deploy.yml"
readonly STARLIGHT_DEPLOY=".github/workflows/starlight-deploy.yml"

# ---------------------------------------------------------------------------
# Removal-done sentinels — the EXACT root paths ticket-036's removal phase
# deletes that PROVE the removal has run. Promotion must never precede removal
# (the live mdBook root `src/` would collide with `git mv site/src src`), so
# --execute asserts these are gone. (We assert the two unambiguous mdBook-only
# roots: `src/specs` and `book.toml`.)
# ---------------------------------------------------------------------------
readonly REMOVAL_SENTINELS=(
  "src/specs"
  "book.toml"
)

# ---------------------------------------------------------------------------
# Untracked / regenerated dirs under site/ that must NOT be moved (git mv errors
# on untracked paths; these rebuild from source). Recorded so a reader sees the
# omission is deliberate, not an oversight.
# ---------------------------------------------------------------------------
readonly SKIP_UNTRACKED=(
  "node_modules"
  "dist"
  ".astro"
  "public/d2"
)

# ---------------------------------------------------------------------------
# Top-level entries that are NOT `git mv`-moved because they are owned by a
# rewrite-map step instead. `.gitignore` is the only one: a root .gitignore
# already exists post-removal (ticket-036 does NOT delete it — it carries the
# surviving plans/ + .playwright-mcp/ ignores), so a `git mv site/.gitignore
# .gitignore` would collide / clobber the survivors. Instead the rewrite map's
# .gitignore MERGE entry combines site/.gitignore's Astro ignores INTO the
# existing root file, preserving the survivors (Option A, user-approved). The
# dry-run plan still LISTS .gitignore (annotated) so a reviewer sees the full
# top-level inventory.
# ---------------------------------------------------------------------------
readonly MERGE_NOT_MOVE=(
  ".gitignore"
)

# ---------------------------------------------------------------------------
# Optional Node rewrite helper (sibling). If present, --execute shells out to it
# for the surgical, anchor-scoped path rewrites (robust against corrupting the
# workflows' explanatory `site/` prose). If absent, --execute still applies the
# rewrites via the in-script line-anchored sed fallback. Either path is exercised
# ONLY post-cutover/post-removal — never today.
# ---------------------------------------------------------------------------
readonly REWRITE_HELPER_REL="scripts/apply-promotion-rewrites.mjs"

# ===========================================================================
# PATH-REWRITE MAP — the complete, verified inventory of files that hard-code
# the `site/` prefix (grep-verified on disk 2026-06-25). Each entry is
#     file|anchor|old token|new token
# where `anchor` is a line-unique substring scoping the edit (so the swap is
# surgical and never touches the explanatory banners that also say `site/`).
# This array is BOTH printed in dry-run AND consumed by --execute, so the map a
# reviewer reads is exactly what gets applied (single source of truth). The
# test fixture parses this array straight out of the source.
#
# NB the load-bearing, non-obvious entry: build-versions.mjs's worktree build
# root `.src-<slug>/site` → `.src-<slug>`. After promotion the worktree IS the
# Astro project root; a missed rewrite silently breaks tagged-release builds.
# ===========================================================================
readonly REWRITE_MAP=(
  # (1) starlight-ci.yml
  ".github/workflows/starlight-ci.yml|working-directory: site|working-directory: site|working-directory: .|drop the site/ working dir (root is the Astro project)"
  ".github/workflows/starlight-ci.yml|cache-dependency-path: site/package-lock.json|site/package-lock.json|package-lock.json|lockfile now at root"
  # (2) starlight-staging.yml
  ".github/workflows/starlight-staging.yml|working-directory: site|working-directory: site|working-directory: .|drop the site/ working dir (root is the Astro project)"
  ".github/workflows/starlight-staging.yml|cache-dependency-path: site/package-lock.json|site/package-lock.json|package-lock.json|lockfile now at root"
  ".github/workflows/starlight-staging.yml|path: site/dist|path: site/dist|path: dist|upload-artifact path now at root"
  # (3) starlight-deploy.yml
  ".github/workflows/starlight-deploy.yml|working-directory: site|working-directory: site|working-directory: .|drop the site/ working dir (root is the Astro project)"
  ".github/workflows/starlight-deploy.yml|cache-dependency-path: site/package-lock.json|site/package-lock.json|package-lock.json|lockfile now at root"
  ".github/workflows/starlight-deploy.yml|path: site/dist|path: site/dist|path: dist|upload-pages-artifact path now at root"
  ".github/workflows/starlight-deploy.yml|TODO(D5|site/astro.config.mjs|astro.config.mjs|TODO banner comment names the now-root config file"
  # (4) build-versions.mjs — THE load-bearing one (worktree build root)
  "site/build-versions.mjs|[\"--root\", \`.src-\${v.slug}/site\`]|.src-\${v.slug}/site|.src-\${v.slug}|worktree IS the Astro root post-promotion (functional)"
  "site/build-versions.mjs|astro build --root .src-<slug>/site|.src-<slug>/site|.src-<slug>|explanatory comment (block lines ~20-22) follows the code"
  "site/build-versions.mjs|--root points at|.src-<slug>/site|.src-<slug>|explanatory comment (block lines ~20-22) follows the code"
  # (5) root .gitignore — a MERGE, not a token swap (see merge_gitignore note below)
  ".gitignore|<MERGE>|merge site/.gitignore Astro ignores (dist/ .dist-* .src-* .astro/ public/d2/ node_modules/)|preserve surviving plans/ + .playwright-mcp/|the mdBook/Python lines are removed by the runbook once ticket-036 ran"
)

# ---------------------------------------------------------------------------
# Presence helpers (read-only; never mutate the tree).
# ---------------------------------------------------------------------------

# True iff a path is tracked by git (so `git mv` would act on it).
is_tracked() {
  local target="$1"
  git -C "${REPO_ROOT}" ls-files --error-unmatch -- "${target}" >/dev/null 2>&1
}

# True iff a path exists on disk under the repo root.
exists_on_disk() {
  local target="$1"
  [[ -e "${REPO_ROOT}/${target}" ]]
}

# True iff a top-level entry is owned by a rewrite-map step (merged, not moved).
is_merge_not_move() {
  local target="$1" entry
  for entry in "${MERGE_NOT_MOVE[@]}"; do
    [[ "${target}" == "${entry}" ]] && return 0
  done
  return 1
}

# ---------------------------------------------------------------------------
# plan_moves — enumerate the tracked top-level entries under site/. The move
# set is exactly the tracked tree: `git ls-files site/` reduced to its first
# path segment (so site/.gitignore, site/src/**, site/public/** collapse to
# .gitignore, src, public, …). Untracked/regenerated dirs are intentionally
# excluded (see SKIP_UNTRACKED). Echoes the entry names (one per line) on stdout
# so callers can both print and iterate; diagnostics go to stderr.
# ---------------------------------------------------------------------------
tracked_toplevel_entries() {
  # `git ls-files site/` lists every tracked file under site/ (incl. dotfiles
  # like site/.gitignore). Strip the leading `site/`, keep the first segment,
  # de-dup, stable sort. No globbing, no untracked paths.
  git -C "${REPO_ROOT}" ls-files -- "site/" \
    | sed 's#^site/##' \
    | cut -d/ -f1 \
    | LC_ALL=C sort -u
}

# ---------------------------------------------------------------------------
# Dry-run body: print exactly what --execute WOULD do — the `git mv` plan for
# every tracked top-level site/ entry, the explicit untracked-skip list, and the
# COMPLETE path-rewrite map (file → old token → new token). Zero filesystem
# changes. Exits 0 via main.
# ---------------------------------------------------------------------------
print_plan() {
  local entry moves=0 line file anchor old new note

  echo "${PROG}: DRY-RUN — no changes will be made. Pass --execute (post-cutover, post-removal) to promote."
  echo "${PROG}: repo root: ${REPO_ROOT}"
  echo ""
  echo "Planned moves (would 'git mv', history-preserving) — tracked top-level site/ entries:"
  while IFS= read -r entry; do
    [[ -n "${entry}" ]] || continue
    if is_merge_not_move "${entry}"; then
      # Listed for inventory completeness, but NOT moved — owned by the rewrite
      # map's MERGE step (a root .gitignore already exists post-removal).
      printf '  git mv  site/%-22s %s  -> superseded by .gitignore MERGE (see rewrite map)\n' "${entry}" "${entry}"
    else
      printf '  git mv  site/%-22s %s\n' "${entry}" "${entry}"
      moves=$((moves + 1))
    fi
  done < <(tracked_toplevel_entries)

  echo ""
  echo "NOT moved (untracked / regenerated — git mv errors on these; they rebuild):"
  for entry in "${SKIP_UNTRACKED[@]}"; do
    printf '  skip    site/%s\n' "${entry}"
  done

  echo ""
  echo "Path-rewrite map (applied by --execute; file | old token -> new token):"
  for line in "${REWRITE_MAP[@]}"; do
    IFS='|' read -r file anchor old new note <<<"${line}"
    if [[ "${anchor}" == "<MERGE>" ]]; then
      printf '  %-42s MERGE:  %s\n' "${file}" "${old}"
      printf '  %-42s        + %s\n' "" "${new}"
      printf '  %-42s        (%s)\n' "" "${note}"
    else
      printf '  %-42s %s  ->  %s\n' "${file}" "${old}" "${new}"
      printf '  %-42s   (%s)\n' "" "${note}"
    fi
  done

  echo ""
  echo "${PROG}: plan summary — ${moves} tracked top-level entries to move, ${#REWRITE_MAP[@]} rewrite-map entries."
  echo "${PROG}: this was a dry run; nothing was moved or rewritten. See ${RUNBOOK_REL} for the full M4 procedure."
}

# ---------------------------------------------------------------------------
# Cutover guard — refuses to --execute until the E8 cutover has been performed.
# IDENTICAL to decommission-mdbook.sh: requires BOTH an env signal AND a repo-
# state signal so the script is a guaranteed no-op today even if someone exports
# the env var by mistake. The guard only READS the workflows (plain grep).
#
#   env signal:   COBRE_CUTOVER_CONFIRMED == 1
#   repo signal:  starlight-deploy.yml has a push/branches:[main] trigger  AND
#                 deploy.yml no longer owns push:[main]  (a missing deploy.yml,
#                 already removed by ticket-036, counts as satisfied).
#
# Each unmet signal exits non-zero naming the precise failure + pointing at the
# runbook.
# ---------------------------------------------------------------------------

# True iff a workflow file declares a `push:` trigger on `branches: [main]`.
# Matches the two-line YAML structure
#     push:
#       branches: [main]
# tolerating arbitrary inner whitespace. -z reads the whole file so the regex
# can span the two lines. (Verbatim from decommission-mdbook.sh.)
has_push_main_trigger() {
  local file="$1"
  [[ -f "${file}" ]] || return 1
  grep -Pzoq 'push:[[:space:]]*\n[[:space:]]*branches:[[:space:]]*\[[[:space:]]*main[[:space:]]*\]' "${file}"
}

cutover_guard() {
  local mdbook_deploy_abs="${REPO_ROOT}/${MDBOOK_DEPLOY}"
  local starlight_deploy_abs="${REPO_ROOT}/${STARLIGHT_DEPLOY}"

  # --- env signal ----------------------------------------------------------
  if [[ "${COBRE_CUTOVER_CONFIRMED:-}" != "1" ]]; then
    echo "${PROG}: cutover guard FAILED — env signal COBRE_CUTOVER_CONFIRMED is not '1'." >&2
    echo "${PROG}: the cutover must be performed and confirmed first. Re-invoke as:" >&2
    echo "${PROG}:   COBRE_CUTOVER_CONFIRMED=1 ${PROG} --execute" >&2
    echo "${PROG}: see ${RUNBOOK_REL}" >&2
    exit 2
  fi

  # --- repo-state signal A: starlight-deploy.yml promoted to push:[main] ---
  if ! has_push_main_trigger "${starlight_deploy_abs}"; then
    echo "${PROG}: cutover guard FAILED — repo-state signal: ${STARLIGHT_DEPLOY} has NOT been promoted to a 'push: [main]' trigger (still workflow_dispatch-only)." >&2
    echo "${PROG}: the cutover FLIP (runbook §FLIP) has not been applied; production is still on mdBook." >&2
    echo "${PROG}: see ${RUNBOOK_REL}" >&2
    exit 2
  fi

  # --- repo-state signal B: deploy.yml no longer owns push:[main] ----------
  # A missing deploy.yml (already removed by ticket-036) is satisfied.
  if [[ -f "${mdbook_deploy_abs}" ]] && has_push_main_trigger "${mdbook_deploy_abs}"; then
    echo "${PROG}: cutover guard FAILED — repo-state signal: ${MDBOOK_DEPLOY} STILL owns a 'push: [main]' trigger (the mdBook deploy is still live)." >&2
    echo "${PROG}: the cutover FLIP must remove push:[main] from deploy.yml before decommission." >&2
    echo "${PROG}: see ${RUNBOOK_REL}" >&2
    exit 2
  fi

  echo "${PROG}: cutover guard PASSED — env + repo-state signals confirm the cutover is live."
}

# ---------------------------------------------------------------------------
# removal_done_guard — asserts ticket-036's removal phase has ALREADY run, so
# promotion cannot precede removal (the live mdBook root `src/` would otherwise
# collide with `git mv site/src src`). The proof: the mdBook-only roots
# `src/specs` and `book.toml` are gone. If either still exists, exit 1.
# ---------------------------------------------------------------------------
removal_done_guard() {
  local sentinel still_present=()
  for sentinel in "${REMOVAL_SENTINELS[@]}"; do
    if exists_on_disk "${sentinel}"; then
      still_present+=("${sentinel}")
    fi
  done
  if [[ ${#still_present[@]} -gt 0 ]]; then
    echo "${PROG}: removal-done guard FAILED — the mdBook removal phase (ticket-036) has NOT run: still present: ${still_present[*]}." >&2
    echo "${PROG}: promotion must NOT precede removal — the live mdBook root 'src/' would collide with 'git mv site/src src'." >&2
    echo "${PROG}: run the removal first:  COBRE_CUTOVER_CONFIRMED=1 bash scripts/decommission-mdbook.sh --execute" >&2
    echo "${PROG}: see ${RUNBOOK_REL}" >&2
    exit 1
  fi
  echo "${PROG}: removal-done guard PASSED — mdBook root src/ + book.toml are gone; the root 'src' name is free."
}

# ---------------------------------------------------------------------------
# apply_rewrites — apply the path-rewrite map post-move. Prefers the sibling
# Node helper (anchor-scoped, robust; handles every entry). Falls back to
# in-script line-anchored sed, which covers only sed-safe entries: non-sed-safe
# anchors (e.g. the build-versions.mjs --root, with `[ ]`/backticks) and the
# <MERGE> warn-and-continue rather than abort. NOT exercised today (only reached
# from execute() after both guards pass; the Node helper is always present here).
# ---------------------------------------------------------------------------
apply_rewrites() {
  local helper_abs="${REPO_ROOT}/${REWRITE_HELPER_REL}"
  if [[ -f "${helper_abs}" ]] && command -v node >/dev/null 2>&1; then
    echo "${PROG}: applying path rewrites via ${REWRITE_HELPER_REL} (anchor-scoped)."
    # execFileSync-equivalent: node with an args array, no shell string.
    node "${helper_abs}" --execute
    return
  fi

  echo "${PROG}: applying path rewrites via in-script line-anchored sed (Node helper absent)."
  local line file anchor old new note abs
  for line in "${REWRITE_MAP[@]}"; do
    IFS='|' read -r file anchor old new note <<<"${line}"
    abs="${REPO_ROOT}/${file}"
    if [[ "${anchor}" == "<MERGE>" ]]; then
      # A .gitignore MERGE is not a safe sed token-swap. The Node helper does it
      # robustly; this fallback cannot, so warn LOUDLY (stderr) rather than leave
      # it silently undone. In practice the helper is always present (this is a
      # Node/Astro repo), so this branch is defense-in-depth only.
      echo "${PROG}: WARNING — ${file} MERGE not applied (Node helper absent). Apply it per the runbook: merge site/.gitignore's Astro ignores into root .gitignore, preserving plans/ + .playwright-mcp/." >&2
      continue
    fi
    [[ -f "${abs}" ]] || { echo "  skip   ${file} (absent)"; continue; }
    # The in-script sed fallback handles only sed-safe tokens. Some map entries
    # are NOT valid in a sed regex address / s### command and would make sed exit
    # non-zero — aborting this loop under `set -e`. The build-versions.mjs --root
    # anchor is the concrete case: it contains `[ ]` (a sed char-class) and
    # backticks. Detect any anchor/token carrying regex/delimiter metachars and
    # warn-and-continue (same posture as the <MERGE> branch) instead of aborting.
    # The Node helper applies these robustly and is always present on this
    # Node/Astro repo, so this fallback branch is defense-in-depth only.
    case "${anchor}${old}${new}" in
      *'['* | *']'* | *'`'* | *'#'* | *'&'*)
        echo "${PROG}: WARNING — ${file} rewrite ('${old}' -> '${new}') is not sed-safe (regex/delimiter metachars). Apply it via ${REWRITE_HELPER_REL} or per the runbook." >&2
        continue
        ;;
    esac
    # Line-anchored: only rewrite the FIRST line containing the unique anchor,
    # swapping just the old token → new token on it. Never a global s###g on the
    # bare token, which would corrupt the explanatory `site/` prose.
    sed -i "0,\#${anchor}#{s#${old}#${new}#}" "${abs}"
    echo "  rewrote ${file}: '${old}' -> '${new}'"
  done
}

# ---------------------------------------------------------------------------
# Execute body — the deferred USER step (NOT exercised by this ticket). Guarded
# by cutover_guard + removal_done_guard. History-preserving (git mv) + idempotent
# (skip already-moved sources) + collision-safe (exit 1 rather than clobber).
# ---------------------------------------------------------------------------
execute() {
  local entry moved=0 skipped=0 src dst

  cutover_guard
  removal_done_guard

  echo "${PROG}: EXECUTE — promoting tracked site/ tree to repo root (git mv, history-preserving)."
  local merged=0
  while IFS= read -r entry; do
    [[ -n "${entry}" ]] || continue
    src="site/${entry}"
    dst="${entry}"

    # Merge-owned (not moved): .gitignore is combined into the existing root file
    # by the rewrite-map MERGE step below, NOT git mv'd (the root .gitignore
    # survives ticket-036 with the plans/ + .playwright-mcp/ ignores; a move would
    # collide / clobber them). Skip the move here BEFORE the collision guard so the
    # expected pre-existing root .gitignore never trips it, then `git rm` the now-
    # redundant source (its ignores are baked into the merge step). Idempotent: a
    # source already gone (a resumed run) is silently fine.
    if is_merge_not_move "${entry}"; then
      if is_tracked "${src}"; then
        git -C "${REPO_ROOT}" rm -q -- "${src}"
        echo "  merge    ${src} -> ${dst} (content merged in the rewrite step; redundant source git-rm'd, survivors preserved)"
      else
        echo "  merge    ${src} -> ${dst} (source already removed; merge handled in the rewrite step)"
      fi
      merged=$((merged + 1))
      continue
    fi

    # Idempotent: a source already gone (a prior interrupted run moved it) is skipped.
    if ! is_tracked "${src}" && ! exists_on_disk "${src}"; then
      echo "  skipped  ${src} (already moved / absent)"
      skipped=$((skipped + 1))
      continue
    fi

    # Collision safety: never clobber an existing root path. If the destination
    # already exists, ticket-036's removal did NOT free the name — abort loudly.
    if exists_on_disk "${dst}"; then
      echo "${PROG}: FATAL — destination '${dst}' already exists at root; refusing to clobber." >&2
      echo "${PROG}: ticket-036's removal did not free this name. Resolve manually; see ${RUNBOOK_REL}" >&2
      exit 1
    fi

    git -C "${REPO_ROOT}" mv -- "${src}" "${dst}"
    echo "  moved    ${src} -> ${dst}"
    moved=$((moved + 1))
  done < <(tracked_toplevel_entries)

  echo ""
  echo "${PROG}: moved ${moved}, skipped ${skipped}, merged ${merged}. Applying path rewrites…"
  apply_rewrites

  echo ""
  echo "${PROG}: done. Review 'git status', then continue the runbook: swap draft docs (ticket-038), verify the root build (npm ci && npm run build:versions), commit. See ${RUNBOOK_REL}"
}

# ---------------------------------------------------------------------------
# Usage.
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
${PROG} — deferred site/ → repo-root promotion (E9 / M4 promotion phase).

USAGE:
  ${PROG}              Dry-run (default): print the git mv plan + rewrite map, change nothing, exit 0.
  ${PROG} --execute    Promote site/ → root — ONLY after the cutover AND ticket-036 removal (guarded).
  ${PROG} --help       Show this help.

ENVIRONMENT:
  COBRE_CUTOVER_CONFIRMED=1   Required for --execute (one of two cutover signals).

--execute is gated by TWO guards (each must pass):
  1. cutover guard (same as decommission-mdbook.sh):
       env  COBRE_CUTOVER_CONFIRMED == 1, AND
       repo-state: ${STARLIGHT_DEPLOY} promoted to 'push: [main]' AND
       ${MDBOOK_DEPLOY} no longer owns 'push: [main]'.
  2. removal-done guard: ticket-036's removal ran — root 'src/specs' and
     'book.toml' are absent (else promotion would collide with the live mdBook src/).
Until both hold, --execute exits non-zero and moves nothing.

Full procedure: ${RUNBOOK_REL}
EOF
}

# ---------------------------------------------------------------------------
# Main — arg parse (single recognised flag), then dispatch. IDENTICAL shape to
# decommission-mdbook.sh.
# ---------------------------------------------------------------------------
main() {
  local mode="dry-run"
  case "${1:-}" in
    "")
      mode="dry-run"
      ;;
    --execute)
      mode="execute"
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "${PROG}: unknown argument '${1}'." >&2
      usage >&2
      exit 1
      ;;
  esac

  if [[ $# -gt 1 ]]; then
    echo "${PROG}: too many arguments (expected at most one flag)." >&2
    usage >&2
    exit 1
  fi

  if [[ "${mode}" == "execute" ]]; then
    execute
  else
    print_plan
  fi
}

main "$@"
