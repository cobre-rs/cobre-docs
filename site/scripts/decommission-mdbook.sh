#!/usr/bin/env bash
#
# decommission-mdbook.sh — the deferred mdBook/Python removal phase of the E9
# (M4) decommission. Authored under the migration's author-files / defer-execution
# mode: it is a *ready-to-run* artifact the USER invokes ONLY AFTER performing the
# E8 cutover and confirming Starlight is live and stable in production. It is a
# guaranteed no-op against the current (pre-cutover) repo:
#
#   * default (dry-run): prints the removal plan, changes nothing, exits 0;
#   * --execute today:   the cutover guard fails (the cutover has not happened),
#                        so it exits non-zero WITHOUT removing anything.
#
# It removes ONLY an explicit allow-list of mdBook artifacts via `git rm` (so
# history is preserved) plus the gitignored built `book/` via a guarded `rm -rf`.
# It NEVER touches anything on the DO-NOT-DELETE allow-list (the permanent
# Starlight artifacts), and asserts at startup that the two lists never overlap.
#
# Full procedure: see
#   plans/starlight-migration/epic-09-decommission/decommission-runbook.md
#
# Conventions: repo infra shell standards (set -euo pipefail, quoted expansions,
# [[ ]], local, readonly, trap, command -v guards). Lints clean under shellcheck.

set -euo pipefail

readonly RUNBOOK_REL="plans/starlight-migration/epic-09-decommission/decommission-runbook.md"
readonly PROG="${0##*/}"

# ---------------------------------------------------------------------------
# trap diagnostic — make a partial/aborted --execute run obvious. On any
# non-zero exit the handler prints the failing line; re-running --execute is
# idempotent (absent targets are skipped) so it resumes cleanly. $LINENO is
# captured at trap time; the guard/usage paths exit with their own messages
# already printed, so this is the backstop for an UNEXPECTED failure mid-removal.
# ---------------------------------------------------------------------------
on_error() {
  local code=$?
  echo "${PROG}: ERROR — aborted at line ${1} (exit ${code})." >&2
  echo "${PROG}: any removals already applied are committed to the index; re-run with --execute to resume (idempotent), or inspect with 'git status'." >&2
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
# Workflow files used by the cutover guard (repo-root-relative).
# ---------------------------------------------------------------------------
readonly MDBOOK_DEPLOY=".github/workflows/deploy.yml"
readonly STARLIGHT_DEPLOY=".github/workflows/starlight-deploy.yml"

# ---------------------------------------------------------------------------
# REMOVE allow-list — the EXACT tracked paths to `git rm` (repo-root-relative).
# An explicit list, NOT a glob/wildcard: a broad pattern (e.g.
# .github/workflows/*.yml) could catch a DO-NOT-DELETE path. 14 entries.
# ---------------------------------------------------------------------------
readonly REMOVE_TARGETS=(
  "book.toml"
  "src/SUMMARY.md"
  "src/introduction.md"
  "src/specs"
  "src/images"
  "theme"
  "mermaid.min.js"
  "mermaid-init.js"
  "Makefile"
  "diagrams"
  "pyproject.toml"
  "uv.lock"
  ".github/workflows/ci.yml"
  ".github/workflows/deploy.yml"
)

# Gitignored built output — removed with a guarded `rm -rf`, NOT `git rm`
# (git rm errors on an untracked path).
readonly GITIGNORED_REMOVE=(
  "book"
)

# ---------------------------------------------------------------------------
# DO-NOT-DELETE allow-list — permanent Starlight artifacts the script must
# NEVER reference as a removal target. Encoded so the overlap assertion can
# fail fast if a REMOVE target ever collides with one of these.
# ---------------------------------------------------------------------------
readonly DO_NOT_DELETE=(
  "site"
  "LICENSE"
  "LICENSE-docs"
  ".github/workflows/starlight-ci.yml"
  ".github/workflows/starlight-staging.yml"
  ".github/workflows/starlight-deploy.yml"
)

# ---------------------------------------------------------------------------
# Startup safety assertion: no REMOVE target (tracked or gitignored) may also
# be a DO-NOT-DELETE entry. Fail fast (exit 1) on any overlap — a guardrail
# against a future edit accidentally listing a permanent artifact for removal.
# ---------------------------------------------------------------------------
assert_no_overlap() {
  local remove not_delete
  for remove in "${REMOVE_TARGETS[@]}" "${GITIGNORED_REMOVE[@]}"; do
    for not_delete in "${DO_NOT_DELETE[@]}"; do
      if [[ "${remove}" == "${not_delete}" ]]; then
        echo "${PROG}: FATAL — REMOVE target '${remove}' is also on the DO-NOT-DELETE list. Refusing to run." >&2
        exit 1
      fi
    done
  done
}

# ---------------------------------------------------------------------------
# Presence helpers (read-only; never mutate the tree).
# ---------------------------------------------------------------------------

# True iff a path is tracked by git (so `git rm` would act on it).
is_tracked() {
  local target="$1"
  git -C "${REPO_ROOT}" ls-files --error-unmatch -- "${target}" >/dev/null 2>&1
}

# True iff a path exists on disk under the repo root (for the untracked book/).
exists_on_disk() {
  local target="$1"
  [[ -e "${REPO_ROOT}/${target}" ]]
}

# ---------------------------------------------------------------------------
# Dry-run body: print exactly what --execute WOULD do, one line per target,
# marked present / skip (absent). Zero filesystem changes. Exits 0 via main.
# ---------------------------------------------------------------------------
print_plan() {
  local target present=0 absent=0

  echo "${PROG}: DRY-RUN — no changes will be made. Pass --execute (post-cutover) to remove."
  echo "${PROG}: repo root: ${REPO_ROOT}"
  echo ""
  echo "Tracked targets (would 'git rm -r', history-preserving):"
  for target in "${REMOVE_TARGETS[@]}"; do
    if is_tracked "${target}"; then
      printf '  git rm -r  %-40s present\n' "${target}"
      present=$((present + 1))
    else
      printf '  git rm -r  %-40s skip (absent)\n' "${target}"
      absent=$((absent + 1))
    fi
  done

  echo ""
  echo "Gitignored built output (would 'rm -rf', NOT git rm):"
  for target in "${GITIGNORED_REMOVE[@]}"; do
    if exists_on_disk "${target}"; then
      printf '  rm -rf     %-40s present\n' "${target}"
      present=$((present + 1))
    else
      printf '  rm -rf     %-40s skip (absent)\n' "${target}"
      absent=$((absent + 1))
    fi
  done

  echo ""
  echo "${PROG}: plan summary — ${present} present, ${absent} absent (of $(( ${#REMOVE_TARGETS[@]} + ${#GITIGNORED_REMOVE[@]} )) targets)."
  echo "${PROG}: this was a dry run; nothing was removed. See ${RUNBOOK_REL} for the full M4 procedure."
}

# ---------------------------------------------------------------------------
# Cutover guard — refuses to --execute until the E8 cutover has been performed.
# Requires BOTH an environment signal AND a repo-state signal so the script is
# a guaranteed no-op today even if someone exports the env var by mistake. The
# guard only READS the workflows (plain grep); it never edits them.
#
#   env signal:   COBRE_CUTOVER_CONFIRMED == 1
#   repo signal:  starlight-deploy.yml has a push/branches:[main] trigger
#                 (the runbook FLIP promoted it to the active deploy)  AND
#                 deploy.yml no longer owns push:[main]  (a missing deploy.yml,
#                 already removed by a prior --execute run, counts as satisfied).
#
# Each unmet signal exits non-zero naming the precise failure and pointing at
# the runbook.
# ---------------------------------------------------------------------------

# True iff a workflow file declares a `push:` trigger on `branches: [main]`.
# Matches the two-line YAML structure
#     push:
#       branches: [main]
# tolerating arbitrary inner whitespace. -z reads the whole file so the regex
# can span the two lines.
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
  # A missing deploy.yml (already removed by a prior --execute) is satisfied.
  if [[ -f "${mdbook_deploy_abs}" ]] && has_push_main_trigger "${mdbook_deploy_abs}"; then
    echo "${PROG}: cutover guard FAILED — repo-state signal: ${MDBOOK_DEPLOY} STILL owns a 'push: [main]' trigger (the mdBook deploy is still live)." >&2
    echo "${PROG}: the cutover FLIP must remove push:[main] from deploy.yml before decommission." >&2
    echo "${PROG}: see ${RUNBOOK_REL}" >&2
    exit 2
  fi

  echo "${PROG}: cutover guard PASSED — env + repo-state signals confirm the cutover is live."
}

# ---------------------------------------------------------------------------
# Execute body — the deferred USER step (NOT exercised by this ticket). Guarded
# by cutover_guard. History-preserving (git rm) + idempotent (skip absent).
# ---------------------------------------------------------------------------
execute() {
  local target removed=0 skipped=0

  cutover_guard

  echo "${PROG}: EXECUTE — removing mdBook artifacts (git rm, history-preserving)."
  for target in "${REMOVE_TARGETS[@]}"; do
    if is_tracked "${target}"; then
      git -C "${REPO_ROOT}" rm -r --quiet -- "${target}"
      echo "  removed  ${target}"
      removed=$((removed + 1))
    else
      echo "  skipped  ${target} (absent)"
      skipped=$((skipped + 1))
    fi
  done

  for target in "${GITIGNORED_REMOVE[@]}"; do
    if exists_on_disk "${target}"; then
      rm -rf -- "${REPO_ROOT:?}/${target}"
      echo "  removed  ${target} (gitignored built output)"
      removed=$((removed + 1))
    else
      echo "  skipped  ${target} (absent)"
      skipped=$((skipped + 1))
    fi
  done

  echo ""
  echo "${PROG}: done — ${removed} removed, ${skipped} skipped."
  echo "${PROG}: review 'git status', then continue the runbook: promote site/ (ticket-037), swap draft docs (ticket-038), commit. See ${RUNBOOK_REL}"
}

# ---------------------------------------------------------------------------
# Usage.
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
${PROG} — deferred mdBook/Python decommission (E9 / M4 removal phase).

USAGE:
  ${PROG}              Dry-run (default): print the removal plan, change nothing, exit 0.
  ${PROG} --execute    Perform removals — ONLY after the cutover (guarded; see below).
  ${PROG} --help       Show this help.

ENVIRONMENT:
  COBRE_CUTOVER_CONFIRMED=1   Required for --execute (one of two cutover signals).

--execute is gated by a cutover guard requiring BOTH:
  1. env  COBRE_CUTOVER_CONFIRMED == 1, AND
  2. repo-state: ${STARLIGHT_DEPLOY} promoted to 'push: [main]' AND
     ${MDBOOK_DEPLOY} no longer owns 'push: [main]'.
Until the cutover is performed, --execute exits non-zero and removes nothing.

Full procedure: ${RUNBOOK_REL}
EOF
}

# ---------------------------------------------------------------------------
# Main — arg parse (single recognised flag), then dispatch.
# ---------------------------------------------------------------------------
main() {
  assert_no_overlap

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
