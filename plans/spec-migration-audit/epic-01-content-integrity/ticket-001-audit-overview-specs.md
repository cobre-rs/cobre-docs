# ticket-001 Audit Content Integrity of Overview Spec Files

## Context

### Background

The 50 SDDP specification documents were migrated from `powers-rs` to `cobre-docs`. The previous migration plan (39 tickets, all completed) reported all 50 files as PASS in the epic revision reports. This audit is an independent verification pass — it does not trust the previous reports and re-checks from first principles with higher scrutiny on semantic content, not just structural counts.

The 3 overview spec files form the foundation for every other spec. `design-principles.md` defines the format selection framework, declaration order invariance, and LP subproblem reference. `notation-conventions.md` defines all index sets, parameters, decision variables, and dual variables used across 49 other files. `production-scale-reference.md` defines the Brazilian system scale targets that all performance and memory specs are calibrated against. Any information loss in these files would propagate errors across the entire spec corpus.

### Relation to Epic

This ticket covers the first 3 of 50 files in Epic 01 (Content Integrity Verification). It establishes the audit methodology and pass/fail reporting format that tickets 002-005 follow.

### Current State

The migration was previously validated structurally. The target files exist at:

- `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` (204 lines)
- `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md` (367 lines)
- `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` (227 lines)

The source files are at:

- `/home/rogerio/git/powers/docs/specs/00-overview/design-principles.md` (221 lines)
- `/home/rogerio/git/powers/docs/specs/00-overview/notation-conventions.md` (383 lines)
- `/home/rogerio/git/powers/docs/specs/00-overview/production-scale-reference.md` (242 lines)

The Epic 01 revision report confirmed heading counts, table row counts, and formula counts match. This ticket goes deeper: verify actual paragraph content, verify that the `notation-conventions.md` symbol tables are complete, and confirm that cross-reference links in these files point to the correct subsections in the target structure.

## Specification

### Requirements

For each of the 3 files, perform the following checks:

**Check 1 — Frontmatter Removal**: Confirm the target file does NOT begin with `---` (YAML frontmatter). The source files have 14-17 lines of frontmatter (`status`, `review_priority`, `source_sections`, `last_reviewed`, `reviewed_by`, `review_notes`, `change_log`) that must be absent from the target.

**Check 2 — Brand Term Audit**: Search the target file for any occurrence of: `POWE.RS`, `powers-core`, `powers-io`, `powers-sddp`, `powers-solver`, `powers-stochastic`, `powers-cli`, `powers-rs`, `powers_`, `ferroMPI` (capital M). All occurrences must be zero.

**Check 3 — Heading Inventory**: Extract every line starting with `#` from source and target. Compare lists. Missing headings indicate information loss.

**Check 4 — Symbol Table Completeness** (notation-conventions.md only): The source `notation-conventions.md` defines symbol tables organized by category (Index Sets, Parameters, Decision Variables, Dual Variables, etc.). Verify that every symbol defined in the source is present in the target. Pay particular attention to:

- Index sets: $\mathcal{H}$, $\mathcal{T}$, $\mathcal{B}$, $\mathcal{L}$, $t$, $k$, $m$, $\ell$, $r$
- State variable symbols: $v_{h,t}$, $a_{h,t,\ell}$
- Dual variable symbols that feed cut coefficients: $\pi_{b,k,t}$, $\lambda_{h,t}$, $\mu_{h,t,\ell}$

**Check 5 — Production Scale Figures** (production-scale-reference.md only): The source defines specific numerical targets (e.g., "160 hydro plants", "2000 state dimensions", "500 scenarios", specific memory budgets). Verify each target figure appears in the migrated file.

**Check 6 — Cross-Reference Path Accuracy**: Extract all markdown links matching `[...](...)`. For each link containing a path component:

- Verify the path has been translated from numbered to named directories (e.g., `../01-math/` → `../math/`, `../02-data-model/` → `../data-model/`)
- Verify the linked file actually exists on disk at the resolved path relative to the target file's location
- Verify the link target still represents the same conceptual destination as in the source

**Check 7 — Design Principles Subsection Completeness** (design-principles.md only): The source has sections on: (1) Format Selection Criteria, (2) Key Design Goals, (3) Declaration Order Invariance, (4) LP Subproblem Formulation Reference, (5) Implementation Language and FFI Strategy. Verify each section is present in the target with its content intact.

### Inputs

- Source directory: `/home/rogerio/git/powers/docs/specs/00-overview/`
- Target directory: `/home/rogerio/git/cobre-docs/src/specs/overview/`
- Files: `design-principles.md`, `notation-conventions.md`, `production-scale-reference.md`

### Outputs

A structured audit report with one sub-section per file, containing:

- A check-by-check results table (Check 1 through Check 6/7)
- A severity-classified findings list (CRITICAL/HIGH/MEDIUM/LOW)
- A final PASS/FAIL verdict for the file

### Error Handling

- If a heading is present in the source but absent from the target: CRITICAL finding
- If a symbol is missing from the notation table: HIGH finding (may break other specs that reference it)
- If a cross-reference path is wrong but the file exists: MEDIUM finding
- If a cross-reference path resolves to a non-existent file: HIGH finding
- If a brand term is found: HIGH finding (consistency issue)

## Acceptance Criteria

- [ ] Given `design-principles.md` source and target, when all 7 checks are run, then no CRITICAL or HIGH findings are reported and the file is marked PASS
- [ ] Given `notation-conventions.md` source and target, when symbol table completeness is verified, then every symbol defined in the source appears in the target
- [ ] Given `production-scale-reference.md` source and target, when all numerical scale targets are compared, then all figures from the source are present in the target
- [ ] Given all 3 target files, when searched for YAML frontmatter (`---` at line 1), then none have frontmatter
- [ ] Given all 3 target files, when searched for prohibited brand terms, then zero matches are found
- [ ] Given all 3 target files, when all markdown links are resolved, then every link points to an existing file
- [ ] The audit produces a summary table: `| File | Frontmatter | Brands | Headings | Symbols/Content | Cross-refs | Verdict |`

## Implementation Guide

### Suggested Approach

Step 1: For each file, run a diff between source and target to understand the full delta:

```bash
diff /home/rogerio/git/powers/docs/specs/00-overview/design-principles.md \
     /home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md
```

The expected delta is only: (a) YAML frontmatter removal, (b) brand name replacements, (c) cross-reference path translations. Any other diff lines are potential content gaps.

Step 2: Check frontmatter:

```bash
head -1 /home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md
# Must be: # Design Principles
```

Step 3: Check brand terms:

```bash
grep -n "POWE\.RS\|powers-\|powers_\|ferroMPI" \
     /home/rogerio/git/cobre-docs/src/specs/overview/*.md
```

Step 4: Compare heading inventories:

```bash
grep "^#" /home/rogerio/git/powers/docs/specs/00-overview/notation-conventions.md
grep "^#" /home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md
```

Step 5: For notation-conventions.md, extract all `$\mathcal{...}$`, `$\bar{...}$`, `$\hat{...}$`, and standalone `$x_{...}$` patterns from the source, confirm each is present in the target.

Step 6: Extract all markdown links and verify them:

```bash
grep -o '\[.*\]([^)]*\.md[^)]*)' \
     /home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md
```

For each link, check that the resolved path exists.

### Key Files to Modify

No files are modified in this ticket. The audit is read-only. Findings are recorded in the audit report that is the deliverable of this ticket. Actual fixes happen in Epic 06.

### Patterns to Follow

The Epic 01-03 revision reports in `/home/rogerio/git/cobre/plans/sddp-spec-migration/learnings/` use the same methodology but are less granular. This ticket goes deeper on semantic content, specifically the symbol tables in `notation-conventions.md`.

### Pitfalls to Avoid

- Line count differences alone do not indicate information loss — the frontmatter removal accounts for all expected line count deltas
- The `diff` output will show brand name replacements as changes; filter these before flagging as content gaps
- Some cross-references in `design-principles.md` use section anchors (e.g., `#3-declaration-order-invariance`) — verify the anchor still matches a heading in the target

## Testing Requirements

### Unit Tests

Not applicable — this is an audit ticket, not a code change.

### Integration Tests

The final deliverable (the audit report) is the integration test. A reviewer must be able to read the report and verify each check independently.

### E2E Tests

After this ticket and tickets 002-005 are complete, run `mdbook build` in `/home/rogerio/git/cobre-docs/` to confirm the build still exits 0.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-006 (Epic 02 audit depends on Epic 01 completing for the overview files), ticket-017 (remediation cannot start until all audits are done)

## Effort Estimate

**Points**: 2
**Confidence**: High
