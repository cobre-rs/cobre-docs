# Epic 01 Learnings: Content Integrity Verification

**Epic**: epic-01-content-integrity
**Completed**: 2026-02-24
**Auditor**: sddp-specialist (automated 6-check methodology)
**Scope**: 50 spec files, 5 tickets, independent per-file verification

---

## What Epic 01 Accomplished

Epic 01 performed an independent, file-by-file content integrity audit across all 50 spec files migrated from `powers-rs` (`/home/rogerio/git/powers/docs/specs/`) to `cobre-docs` (`/home/rogerio/git/cobre-docs/src/specs/`). Every file was verified against six checks: frontmatter removal, brand term replacement, heading inventory, formula/symbol completeness, table and code block counts, and cross-reference path accuracy. No file was sampled or skipped.

**Result: ALL 50 FILES PASS. Zero information loss. The migration is content-complete.**

---

## Severity Distribution

| Severity | Count | Files Affected           |
| -------- | ----- | ------------------------ |
| CRITICAL | 0     | --                       |
| HIGH     | 0     | --                       |
| MEDIUM   | 1     | `penalty-system.md` only |
| LOW      | 28    | 18 of 50 files           |

The single MEDIUM finding (`penalty-system.md`: systematic Unicode-to-ASCII conversion of unit annotation characters such as `hm³`->`hm3`, `≥`->`>=`, `∞`->`Inf`) is a display-only difference with no semantic impact. All LOW findings are cosmetic with no content loss.

---

## Patterns Observed Across LOW Findings

The 28 LOW findings cluster into exactly five categories. Every LOW finding in the entire audit falls into one of these:

1. **Emoji removal** (~6 findings): Warning emojis (`⚠️`, `🚧`) stripped from callout blocks and section headings. The descriptive text (`"DEFERRED"`, warning prose) is always preserved. Affected files: `input-directory-structure.md`, `input-scenarios.md`, `input-constraints.md`, `output-schemas.md`. See ticket-004-audit-report.md for details.

2. **Unicode character normalization** (~9 findings): The `§` (U+00A7 SECTION SIGN) replaced with `&sect;` HTML entity in link text. Accent character `è` in author name `Leclere` dropped to ASCII. En-dash `–` in page ranges replaced with hyphen. Affected files: `discount-rate.md`, `infinite-horizon.md`, `upper-bound-evaluation.md`. See ticket-002-audit-report.md and ticket-003-audit-report.md.

3. **Deferred features link simplification** (~7 findings): When `../06-deferred/deferred-features.md` was consolidated to `../deferred.md`, some section-specific anchors (`#c3-multi-cut-formulation`) or descriptive link text suffixes were dropped. The target file and anchors still exist. Affected files: `sddp-algorithm.md`, `training-loop.md`, `hydro-production-models.md`. See ticket-002-audit-report.md and ticket-005-audit-report.md.

4. **SOLVER_ARCHITECTURE_DECISIONS.md redirects** (~4 findings): A planned file that was never created in `powers-rs` was referenced from 4 architecture files. The migration correctly redirected these to `./solver-abstraction.md` (which does exist and covers the material). Affected files: `solver-abstraction.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md`. See ticket-005-audit-report.md.

5. **CHANGE_TRACKER.md generalization** (1 finding): `hydro-production-models.md` referenced a `CHANGE_TRACKER.md` file with the anchor text "Future Modeling Observations"; this was replaced with a link to `../deferred.md`. The migration decision is appropriate; the specific section name was generalized. See ticket-002-audit-report.md.

---

## Observations Relevant to Subsequent Epics

### For Epic 02 (Spec-to-Crate Mapping)

The 50 files map to crates according to the master plan's table. The audit reveals no spec-placement anomalies; all files are in the section that aligns with their primary crate. However, several files are shared across crate boundaries:

- `specs/math/system-elements.md` and `specs/math/equipment-formulations.md` are co-owned by `cobre-core` and `cobre-sddp` (the master plan assigns them to `cobre-core` as data-model anchors).
- `specs/data-model/` files are split between `cobre-core` (entity definitions) and `cobre-io` (serialization formats). `binary-formats.md` and `output-schemas.md` belong to `cobre-io`; the other 8 data-model files to `cobre-core`.
- `specs/architecture/scenario-generation.md` belongs to `cobre-stochastic`, not `cobre-sddp`, despite living in the architecture section.
- The FlatBuffers table names in `binary-formats.md` differ from the names the ticket-004 acceptance criteria assumed (`BendersCut` not `CutEntry`, `StageCuts` not `CutPool`, `PolicyMetadata` not `CheckpointManifest`). Epic 02 ticket writers should use the actual names when authoring crate-mapping acceptance criteria.

### For Epic 03 (Cross-Reference Coherence)

All 1,000+ cross-reference links in the 50 files resolve to existing files on disk. The audit found zero broken links. However, two categories of links warrant closer inspection in Epic 03:

- **Deferred anchor specificity**: Several deferred-feature links (7 total) had their section anchors dropped during migration. The link `../deferred.md#c3-multi-cut-formulation` was reduced to `../deferred.md`. Epic 03 should verify whether these anchors still work in the rendered mdBook (the headings exist, but anchor generation depends on mdBook's slug rules). Affected files noted in ticket-002-audit-report.md and ticket-005-audit-report.md.
- **Non-existent source file redirected**: `SOLVER_ARCHITECTURE_DECISIONS.md` was referenced in 4 architecture files in the source but never existed. The migration redirected these to `solver-abstraction.md`. Epic 03 should confirm that the substitute cross-references point to sections with the specific content that was intended.
- **Unresolved ticket-specified links**: Two ticket acceptance criteria specified cross-references that do not exist in either source or target: `output-infrastructure.md -> ../architecture/cli-and-lifecycle.md` and `stopping-rules.md -> ../architecture/convergence-monitoring.md`. These are ticket drafting errors (see below), not real links to verify.

### For Epic 04 (LaTeX Rendering)

The `$$` formula counts across all math-heavy files match exactly between source and target. No formula was dropped, duplicated, or structurally altered. Key formula densities by file (targets for Epic 04 LaTeX rendering verification):

- `lp-formulation.md`: 56 `$$`-lines -- highest formula density in the corpus
- `equipment-formulations.md`: 28 `$$`-lines
- `upper-bound-evaluation.md`: 36 `$$`-lines
- `hydro-production-models.md`: 38 `$$`-lines
- `risk-measures.md`: 26 `$$`-lines + 3 inline
- `par-inflow-model.md`: 26 `$$`-lines + 4 inline (includes full Yule-Walker matrix system)
- `deferred.md`: 28 `$$`-lines (unexpectedly high -- deferred content includes substantial mathematical depth)

The MEDIUM finding in `penalty-system.md` (Unicode-to-ASCII in unit annotations such as `hm³`->`hm3`) is not a LaTeX issue -- it affects prose table cells, not `$$` blocks. Epic 04 should not expect LaTeX rendering problems in `penalty-system.md` from this finding.

The `notation-conventions.md` file uses extensively inline `$...$` notation (not `$$...$$`) throughout its symbol tables. If Epic 04 uses `$$` count as a proxy for formula density, it will undercount this file's mathematical content. A dedicated inline-formula scan is advisable for `notation-conventions.md`.

### For Epic 06 (Remediation)

The complete findings list requiring attention in remediation is as follows:

**MEDIUM (1 finding -- fix recommended for visual polish)**

| File                                 | Finding                                                                                                                                                                                                                | Ticket     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `specs/data-model/penalty-system.md` | ~50 occurrences of Unicode-to-ASCII conversion in unit annotations: `hm³`->`hm3`, `m³/s`->`m3/s`, `Σ_`->`Sigma_`, `×`->`x`, `≥`->`>=`, `≤`->`<=`, `∞`->`Inf`, `−∞`->`-Inf`. No semantic loss; visual quality degraded. | ticket-004 |

**LOW (28 findings -- fix at discretion)**

| Category                         | Files                                                                                             | Description                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Emoji removal                    | `input-directory-structure.md`, `input-scenarios.md`, `input-constraints.md`, `output-schemas.md` | `⚠️`, `🚧`, `✅`, `❌` removed from callouts and reproducibility table. Text preserved.                                                                      |
| Unicode normalization            | `discount-rate.md`, `infinite-horizon.md`, `upper-bound-evaluation.md`                            | `§`->`&sect;`, accent dropped from `Leclere`, en-dash replaced with hyphen.                                                                                  |
| Deferred anchor loss             | `sddp-algorithm.md`, `training-loop.md`, `hydro-production-models.md`                             | Section-specific anchors or descriptive link text dropped from deferred-features links.                                                                      |
| SOLVER_ARCHITECTURE_DECISIONS.md | `solver-abstraction.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md`     | References to a non-existent planned file redirected to `solver-abstraction.md`. Semantically correct; no action needed unless the original file is created. |
| CHANGE_TRACKER.md generalization | `hydro-production-models.md`                                                                      | Section-specific link text "Future Modeling Observations" generalized to `Deferred Features`.                                                                |

The SOLVER_ARCHITECTURE_DECISIONS.md category requires no remediation action unless the planned file is eventually created. All other LOW findings in the above table are candidates for cleanup in ticket-020.

---

## Methodology Insights

### What Worked Well

- **6-check protocol is sufficient and complete**: No content defects were missed by the six checks. The checks (frontmatter removal, brand terms, heading inventory, formula count, table/code count, cross-reference paths) are the right set for migration verification. The protocol should be reused verbatim for any future migration audits.
- **Diff-as-primary-evidence discipline**: Grounding each verdict in the observable diff between source and target (rather than spot checks alone) prevented false negatives. The expected diff categories (frontmatter removal, brand replacements, path rewrites) provided a clean null hypothesis.
- **Per-file severity classification**: Classifying each finding by severity (CRITICAL/HIGH/MEDIUM/LOW) rather than pass/fail only enabled Epic 06 to triage remediation work. This should be retained in all future audit epics.
- **Counting pipe-lines as table proxy**: Using `|`-line counts as a table row proxy proved reliable for files with many tables (e.g., `input-system-entities.md` at 195 pipe-lines, `output-schemas.md` at 218). This technique is faster than full semantic table comparison and sufficient for migration integrity.

### What Should Be Adjusted for Later Epics

- **Formula counting misses inline math**: The `$$`-line count check only captures display math blocks. Files like `notation-conventions.md` with heavy `$...$` inline notation are not fully covered. Epic 04 (LaTeX rendering) should add an inline `$...$` scan for files known to use it extensively.
- **The 6-check protocol does not verify semantic correctness**: It verifies structural equivalence. Checks 1-6 confirm that content was not lost, but do not confirm that content was correct in the source. This is by design (the source is treated as ground truth), but Epic 03 and Epic 04 operate at a higher semantic layer.
- **Ticket-size imbalance**: ticket-005 covered 22 files versus 3 for ticket-001 and 7 each for tickets 002-003. The audit work for ticket-005 was disproportionately large. Future audits should target 7-10 files per ticket for consistent effort sizing.

---

## Ticket Specification Errors (Not Migration Defects)

Two acceptance criteria in the ticket specifications described file attributes that do not exist in either source or target. These are errors in how the tickets were drafted, not findings against the migration:

**ticket-003, C2 (`upper-bound-evaluation.md` statistical test formulas)**
The criterion asked to verify "t-test and confidence interval formulas" in `upper-bound-evaluation.md`. This file does not contain t-test or chi-squared formulas in either source or target. It defines deterministic upper bounds via SIDP inner approximation with a gap computation formula. The statistical stopping rules are in `stopping-rules.md`. The ticket criterion was based on a mischaracterization of the file's content; it was correctly resolved as "consistent between source and target" with no information loss.

**ticket-005, C2 (`configuration-reference.md` config key names)**
The criterion asked to spot-check keys `max_iterations`, `forward_scenarios`, and `checkpoint_interval`. None of these key names exist in the spec. The actual key names are `iteration_limit.limit`, `forward_passes`, and checkpointing is documented in `../hpc/checkpointing.md` (not in the config reference at all). The ticket used naming conventions that differ from the actual config schema. The auditor correctly reconciled this against the actual file content; all sections are present and consistent.

**Implication for Epic 02-06 ticket drafting**: Acceptance criteria for future tickets should be written after reading the actual target files, not from memory or assumption about what keys/names/types are used. The reconciliation tables in ticket-004-audit-report.md (for FlatBuffers schema names) and ticket-005-audit-report.md (for config key names) are a good model for handling mismatches between expected and actual names.
