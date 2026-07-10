# mdBook Retirement & `docs.cobre-rs.dev` Cutover — Runbook

**Status:** Steps 1–3 **EXECUTED** on the branches (2026-07-10); only Step 4
(DNS + GitHub-Pages flip + merge) and the next-release Step 5 remain — operator
actions. **Prepared:** 2026-07-10 (post cobre v0.10.0 sync).

This is the operator runbook for the final cutover: point the unified Starlight
site at `docs.cobre-rs.dev`, retire the `cobre/book/` mdBook, and relocate the
generated JSON schemas so nothing breaks. Two repos are involved — **cobre-docs**
(this repo) and **cobre**. Do the steps in order; each is idempotent and
`git revert`-able.

> **Executed on the branches (held local, not merged):**
>
> - **cobre-docs `feat/docs-unification`** — full cutover config (site, CNAME,
>   redirects, `$schema` URLs → `docs.cobre-rs.dev/schemas/`), governance,
>   burndown, schema refresh. 37 commits.
> - **cobre `docs/unification-t-code`** — the mdBook is **deleted** (commit
>   `9e8c42b9`): schemas relocated `book/src/schemas/` → `schemas/`, all ~510
>   `$schema` URLs repointed to cobre's own `raw.githubusercontent.com/.../schemas/`
>   (self-contained — refined from the earlier `docs.cobre-rs.dev` choice so cobre
>   does not depend on the docs deploy), `book/` + the mdBook Pages deploy
>   (`docs.yml`) removed, and the `book/`-scanning CI doc-gates refactored to keep
>   their non-book coverage (`check_doc_counts` removed as mdBook-only;
>   `check-docs-examples` kept as a CLI structural-invariant gate). Freshness gate,
>   all kept gates, `cli_schema` (4/0) and `init` `$schema` (8/0) tests pass with
>   `book/` gone. 7 commits.
>
> **What remains for the operator:** review + merge both branches, then Step 4
> below (DNS + Pages custom-domain flip). Step 5 (`refresh-schemas.mjs`
> `SCHEMAS_SUBPATH` → `schemas`) applies only from the first post-merge cobre tag —
> v0.10.0 and earlier still carry `book/src/schemas`.

## What is already prepared (no action needed)

**cobre-docs** (branch `feat/docs-unification`, commits held local for review):

- Site targets `docs.cobre-rs.dev`: `astro.config.mjs` `site` set; the deploy
  workflow writes `docs.cobre-rs.dev` to `dist/CNAME`.
- Redirects for the retired mdBook paths (`/guide/*`, `/tutorial/*`,
  `/reference/*`, `/examples/*`) → their unified twins are in `astro.config.mjs`
  (`check:links` verifies all targets resolve; crate-internal paths 404 to the
  GitHub READMEs by design).
- Every example `$schema` URL points at the site's own served copy
  (`https://docs.cobre-rs.dev/schemas/<name>.schema.json`) — decoupled from
  cobre's `book/`.
- Vendored schemas (`public/schemas/`) are refreshed to v0.10.0.
- `CLAUDE.md`, `README.md`, and `dev-strategy.md` describe the unified state.

**cobre** (branch `docs/unification-t-code`, commits held local):

- Every crate has a substantive `README.md`; `ARCHITECTURE.md` exists — the
  developer/crate content the mdBook used to carry is preserved next to the code,
  so deleting `book/` loses nothing.
- The two book→methodology links repointed to the crate READMEs / ARCHITECTURE.
- `CONTRIBUTING.md` documents the schema vendoring/freshness contract.

## Step 1 — Relocate the generated schemas out of `book/` (cobre repo)

The 18 JSON schemas live in `book/src/schemas/` and are referenced from ~40
places (the freshness gate, CLI templates, rustdoc examples, test fixtures, and
the mdBook chapters). Deleting `book/` would orphan them. Move them to a
repo-root `schemas/` (the surviving canonical committed location) and repoint the
non-book references.

```bash
cd ~/git/cobre
git mv book/src/schemas schemas

# a) Decouple every `$schema` URL from book/ — point them at the served copy.
#    (Covers CLI templates, rustdoc examples in cobre-io/src, test fixtures.)
grep -rl 'refs/heads/main/book/src/schemas/' --include='*.json' --include='*.rs' \
  --include='*.md' . | xargs sed -i \
  's#https://raw.githubusercontent.com/cobre-rs/cobre/refs/heads/main/book/src/schemas/#https://docs.cobre-rs.dev/schemas/#g'

# b) The freshness gate + the schema-export test read the committed dir directly:
sed -i 's#book/src/schemas#schemas#g' scripts/ci/check_schemas.sh
sed -i 's#\.\./\.\./book/src/schemas#../../schemas#g' crates/cobre-cli/tests/cli_schema.rs
sed -i 's#book/src/schemas#schemas#g' CONTRIBUTING.md   # the vendoring note

cargo build --release --bin cobre
./target/release/cobre schema export --output-dir schemas   # regenerate in place
git diff --stat schemas/                                    # expect no drift
scripts/ci/check_schemas.sh                                 # must print ✓
cargo test -p cobre-cli --test cli_schema                   # must pass
```

> **Note.** `crates/cobre-cli/src/commands/init.rs` may emit the `$schema` URL for
> generated cases — confirm step (a) rewrote it (grep `init.rs` for `book/src`).

## Step 2 — Delete the mdBook (cobre repo)

```bash
cd ~/git/cobre
git rm -r book/
# Disable the mdBook's Pages deploy so it can never race the Starlight deploy:
#   remove/neutralise .github/workflows/deploy.yml (the mdBook `push:[main]` job)
#   and any `book` job in ci.yml. (starlight-deploy.yml in cobre-docs already
#   owns the docs.cobre-rs.dev Pages path — see its header comment.)
```

Search-and-fix any remaining `book/` references (`grep -rn 'book/' --include='*.yml'
--include='*.md' --include='*.toml' .`); the CHANGELOG/README may link the old
book — repoint to `docs.cobre-rs.dev`.

## Step 3 — Point the schema-refresh at the new location (cobre-docs repo)

Only after Step 1 lands in a **tagged** cobre release: update the vendoring script
so future refreshes read the moved dir.

```bash
cd ~/git/cobre-docs
sed -i 's#book/src/schemas#schemas#' scripts/refresh-schemas.mjs   # SCHEMAS_SUBPATH
node scripts/refresh-schemas.mjs --ref <new-tag> --check           # verify
```

(For refreshing from v0.10.0 or earlier, leave `SCHEMAS_SUBPATH` as `book/src/schemas`
— those tags predate the move.)

## Step 4 — Flip the domain (GitHub settings + DNS — operator action)

1. **DNS:** add/point a `CNAME` for `docs.cobre-rs.dev` → `cobre-rs.github.io`
   (the cobre-docs Pages host). Keep `methodology.cobre-rs.dev` pointing at the
   same host so GitHub Pages 301s it to the primary domain (or add a DNS-level
   301).
2. **GitHub Pages (cobre-docs repo):** set the custom domain to
   `docs.cobre-rs.dev` (matches the CNAME the deploy writes).
3. **Merge** `feat/docs-unification` → `main` in cobre-docs. The push triggers
   `starlight-deploy.yml`, which builds, gates, writes `dist/CNAME =
docs.cobre-rs.dev`, and publishes.
4. **Merge** `docs/unification-t-code` → the cobre default branch (`main`).

## Step 5 — Verify after cutover

- `https://docs.cobre-rs.dev/` serves the unified site; `check:links` was already
  green (0 broken across 149 pages including the redirect stubs).
- Old mdBook URLs 301: e.g. `docs.cobre-rs.dev/guide/configuration.html` →
  `/running/configuration/`; `…/reference/schemas.html` → `/reference/json-schemas/`.
- `methodology.cobre-rs.dev/math/lp-formulation/` → redirects to
  `docs.cobre-rs.dev/…` (from the DNS/Pages primary-domain 301).
- `https://docs.cobre-rs.dev/schemas/hydros.schema.json` resolves (served vendored
  copy) — this is where every example `$schema` now points.

## Rollback

Each step is a `git revert`. The cobre-docs deploy header documents the
mdBook-vs-Starlight Pages ownership and its own rollback. If the domain flip
misbehaves, revert the CNAME/`site` commit and restore the previous Pages custom
domain.
