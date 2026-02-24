# Accumulated Learnings: Epics 01 and 02

**Plan**: spec-migration-audit
**Through Epic**: epic-02-spec-crate-mapping
**Updated**: 2026-02-24

---

## Audit State After Two Epics

- All 50 spec files pass content integrity (Epic 01) and section placement (Epic 02) checks
- Zero CRITICAL or HIGH findings against spec content or section placement
- 14 HIGH findings exist against the 7 crate doc pages in `src/crates/` -- all are missing spec cross-reference links
- 11 MEDIUM findings against crate doc pages (additional missing links, lower priority)
- 1 MEDIUM finding against spec content: Unicode-to-ASCII in `penalty-system.md` unit annotations
- 28 LOW findings against spec content: emoji removal, Unicode normalization, deferred anchor loss, redirected non-existent file references

---

## Patterns Established

- **6-check content integrity protocol**: frontmatter removal, brand term replacement, heading inventory, formula count, table/code count, cross-reference path resolution. Verified sufficient for migration audits. Reuse verbatim for any future doc migrations. See `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-01-content-integrity/learnings.md`.
- **4-check crate mapping protocol** (M1 section assignment, M2 SUMMARY.md presence, M3 ambiguity resolution, M4 coverage gap): sufficient for spec-to-crate placement audits. Demonstrated in tickets 007-009.
- **Crate doc page audit** (Check D dependency graph, per-crate spec link completeness): separate check from section placement audit; runs against `src/crates/*.md` files not spec files. Demonstrated in ticket-006.
- **Dual-crate spec pattern**: `system-elements.md`, `hydro-production-models.md`, `equipment-formulations.md` share content between `cobre-core` (entity data) and `cobre-sddp` (LP usage). Both crate doc pages should cross-reference each of these files. The split is by design and documented in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-008-audit-report.md`.

---

## Architectural Decisions Recorded

- `specs/architecture/input-loading-pipeline.md` stays in architecture (loading orchestration, not data schemas) -- primary: `cobre-io`
- `specs/architecture/validation-architecture.md` stays in architecture (pipeline design, not data formats) -- primary: `cobre-io`, secondary: `cobre-cli`
- `specs/architecture/scenario-generation.md` stays in architecture (implementation pipeline, not math model) -- primary: `cobre-stochastic`
- `specs/hpc/synchronization.md` -- primary is `cobre-sddp` (algorithm sync semantics), NOT `ferrompi` (which supplies primitives only)
- `specs/data-model/binary-formats.md`, `internal-structures.md`, `output-infrastructure.md` all stay in data-model despite apparent architectural content -- justified in ticket-007-audit-report.md section 2

---

## Crate Coverage Facts (Master Table)

- `cobre-sddp`: 22 primary + 16 secondary specs; dominant across math and HPC sections
- `cobre-core`: 6 primary + 11 secondary; concentrated in data-model and math sections
- `cobre-io`: 8 primary + 10 secondary; all primaries in data-model and architecture
- `ferrompi`: 1 primary + 9 secondary; sole primary is `communication-patterns.md`
- No crate has zero coverage
- Master 50-row table: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` section 5

---

## Key Files and Their Roles

- `/home/rogerio/git/cobre-docs/src/crates/sddp.md` -- has 8 HIGH missing spec links; needs math spec links added in Epic 06
- `/home/rogerio/git/cobre-docs/src/crates/core.md` -- has 2 HIGH missing spec links (`design-principles.md`, `system-elements.md`)
- `/home/rogerio/git/cobre-docs/src/crates/io.md` -- has 2 HIGH missing spec links (`input-loading-pipeline.md`, `validation-architecture.md`)
- `/home/rogerio/git/cobre-docs/src/crates/cli.md` -- has 1 HIGH missing spec link (`configuration-reference.md`)
- `/home/rogerio/git/cobre-docs/src/crates/ferrompi.md` -- has 1 HIGH missing spec link (see ticket-006 ferrompi section)
- `/home/rogerio/git/cobre-docs/src/SUMMARY.md` -- all 50 specs verified present under correct section headings
- `/home/rogerio/git/cobre-docs/src/specs/data-model/penalty-system.md` -- MEDIUM: ~50 Unicode-to-ASCII unit annotation conversions

---

## Conventions Adopted

- **Severity definitions**: CRITICAL = information loss; HIGH = incorrect mapping or broken link or missing required spec reference; MEDIUM = missing secondary reference or minor inaccuracy; LOW = cosmetic. Apply consistently across all audit epics.
- **Per-file placement verdict**: "CORRECT" or "INCORRECT" plus a one-paragraph justification for any ambiguous case (M3 protocol). Do not leave ambiguities undocumented.
- **Primary vs. secondary crate distinction**: Primary = the crate that implements the behavior described by the spec. Secondary = crates that consume or depend on that behavior. A spec may have dual primaries when its content covers two crate responsibilities at equal depth.
- **Deployment specs are distinct**: `slurm-deployment.md` is a deployment/operations spec; its "crate" is the binary artifact (`cobre-cli`), not an implementation target. Label such specs explicitly in crate doc pages.

---

## Surprises and Deviations from Plan

- **No section placement errors found**: The epic overview pre-identified 6 potentially misplaced specs. All 6 were confirmed correct after analysis. The ambiguity was in the ticket specs, not the actual placement.
- **cobre-sddp crate doc is severely under-linked**: The epic overview did not forecast that the most implementation-heavy crate would have 8 HIGH gaps. The spec corpus is mature; the crate doc pages were not updated to track spec additions. This imbalance is the most actionable finding from the epic.
- **Cargo.toml stubs prevent dependency graph verification**: All individual crate `Cargo.toml` files are placeholder stubs with no `[dependencies]` sections. The dependency graph in `overview.md` cannot be verified against actual manifests -- it represents intended design only. Epic 03 and Epic 06 should not attempt Cargo.toml-based verification.
- **deferred.md maps 21 features, not 18**: The epic overview referenced 18 deferred features (C.1-C.18). The actual spec contains 21 features: 18 numbered plus 3 additional algorithm variants (Objective States, Belief States, Duality Handlers). Per-feature crate assignments are in ticket-009-audit-report.md section 2.2.

---

## Recommendations for Future Epics

- **Epic 03 (Cross-Reference Coherence)**: Ticket-013 (glossary and crate cross-references) should audit whether `sddp.md`, `core.md`, and `io.md` accurately describe concepts from the specs they do not link -- paraphrasing without citation creates semantic drift risk. Prioritize `sddp.md` (8 un-linked specs, 7 MEDIUM gaps).
- **Epic 05 (Cross-Reference Index)**: Use the master 50-row table from ticket-009-audit-report.md section 5 as the direct input. The 4 dual-crate specs need bidirectional index entries. The 21 deferred features in ticket-009-audit-report.md section 2.2 should each get an individual index entry.
- **Epic 06 (Remediation)**: Ticket-019 addresses the 14 HIGH crate doc gaps. Use the per-crate breakdown in the Epic 02 learnings as the work list. Ticket-020 addresses the 11 MEDIUM crate doc gaps plus the `penalty-system.md` Unicode finding and the 28 LOW spec content findings from Epic 01.
- **Ticket sizing**: Target 7-10 spec files per ticket for section placement audits (tickets 007-009 sized well at 13, 27, 10). For crate doc audits, split infrastructure crates from domain crates to keep reports manageable.
- **Write acceptance criteria after reading the target files**: The `synchronization.md` primary/secondary swap (corrected in ticket-009 F-2) and the config key name mismatches from Epic 01 both resulted from criteria written from memory. Read the actual file Purpose section before authoring acceptance criteria.
