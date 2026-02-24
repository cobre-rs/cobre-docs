# Accumulated Learnings: Epics 01, 02, and 03

**Plan**: spec-migration-audit
**Through Epic**: epic-03-cross-reference-coherence
**Updated**: 2026-02-24

---

## Audit State After Three Epics

- All 50 spec files pass content integrity (Epic 01), section placement (Epic 02), and semantic cross-reference (Epic 03) checks
- Zero CRITICAL findings across all three epics
- 7 HIGH findings from Epic 03: all are wrong section numbers misdirecting readers to incorrect content (see F-1, F-5, F-6, F-7, F-8, F-9, F-11 below)
- 19 MEDIUM findings from Epic 03: asymmetric reference gaps (6), algorithm page notation/link gaps (3), glossary omissions (9) -- none affect factual correctness
- 1 LOW finding from Epic 03: legacy pre-migration "DATA_MODEL S3.x.x" references in `deferred.md`
- 14 HIGH findings from Epic 02 (ticket-006) still outstanding: missing spec cross-reference links from `src/crates/*.md` pages, concentrated in `cobre-sddp` (8 HIGH) -- not resolved by Epic 03

---

## Patterns Established

- **6-check content integrity protocol** (frontmatter, brand terms, headings, formula count, table/code count, path resolution): verified sufficient for migration audits. See `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-01-content-integrity/learnings.md`.
- **4-check crate mapping protocol** (M1 section assignment, M2 SUMMARY.md, M3 ambiguity, M4 coverage gap): demonstrated in tickets 007-009.
- **Section-number reference table format** (file, line, ref text, target section, heading, PASS/FAIL): effective for catching mismatch at scale; audited 534 section references across 55 files in Epic 03.
- **Bidirectional pair checks**: each pair reveals asymmetric gaps invisible to unidirectional audits; 15 pairs checked in Epic 03, yielding 6 MEDIUM findings.
- **Root cause grouping at end of finding list**: connects related findings (e.g., F-6, F-7, F-8, F-11 are all consequences of a single solver-abstraction.md renumbering event), which is more actionable for remediation than treating them as independent bugs.
- **Formula-by-formula verification table** (formula in algorithm page vs. counterpart in formal spec): cleared all 19 formulas in Epic 03 with zero contradictions.

---

## Architectural Decisions Recorded

- `specs/architecture/input-loading-pipeline.md` stays in architecture (loading orchestration, not data schemas) -- primary: `cobre-io`
- `specs/architecture/validation-architecture.md` stays in architecture -- primary: `cobre-io`, secondary: `cobre-cli`
- `specs/architecture/scenario-generation.md` stays in architecture -- primary: `cobre-stochastic`
- `specs/hpc/synchronization.md` -- primary is `cobre-sddp`, NOT `ferrompi`
- `specs/data-model/binary-formats.md`, `internal-structures.md`, `output-infrastructure.md` stay in data-model despite apparent architectural content -- see ticket-007 section 2
- Algorithm reference pages (`src/algorithms/`) use simplified notation intentionally distinct from formal spec notation in some cases (e.g., `benders.md` uses matrix form $E_{t+1}^\top \pi^*$ vs. spec's direct-dual $\beta^v_h = \pi^{wb}_h$); this is a notation choice, not a contradiction

---

## Key Files and Their Roles

- `/home/rogerio/git/cobre-docs/src/crates/sddp.md` -- has 8 HIGH missing spec links from Epic 02; needs math spec links added in Epic 06; all 4 existing links verified semantically accurate in Epic 03
- `/home/rogerio/git/cobre-docs/src/crates/core.md` -- has 2 HIGH missing spec links from Epic 02
- `/home/rogerio/git/cobre-docs/src/crates/io.md` -- has 2 HIGH missing spec links from Epic 02
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md` -- source of 4 HIGH findings (F-6, F-7, F-8, F-11); section renumbering event not propagated to cross-references
- `/home/rogerio/git/cobre-docs/src/specs/architecture/extension-points.md` -- has F-5 (phantom S18 reference) and F-6 (wrong S2 for compile-time selection)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/penalty-system.md` -- has F-9 (phantom S5.0, S5.8 references) and MEDIUM Unicode finding from Epic 01
- `/home/rogerio/git/cobre-docs/src/reference/glossary.md` -- 72 terms, 85% coverage; 9 MEDIUM gaps (F-19 to F-27) targeting math and risk measure concepts
- `/home/rogerio/git/cobre-docs/src/SUMMARY.md` -- all 50 specs verified present under correct section headings (Epic 02)

---

## Crate Coverage Facts (Master Table)

- `cobre-sddp`: 22 primary + 16 secondary specs; dominant across math and HPC sections
- `cobre-core`: 6 primary + 11 secondary; concentrated in data-model and math sections
- `cobre-io`: 8 primary + 10 secondary; all primaries in data-model and architecture
- `ferrompi`: 1 primary + 9 secondary; sole primary is `communication-patterns.md`
- No crate has zero coverage
- Master 50-row table: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` section 5

---

## Conventions Adopted

- **Severity definitions**: CRITICAL = information loss; HIGH = wrong section number, broken link, or missing required spec reference; MEDIUM = missing secondary reference, notation inconsistency, or glossary gap; LOW = cosmetic or historical artifact
- **Per-file placement verdict**: "CORRECT" or "INCORRECT" plus one-paragraph justification for ambiguous cases (M3 protocol)
- **Primary vs. secondary crate distinction**: Primary = the crate implementing the spec's behavior; Secondary = crates consuming it; dual primaries allowed when a spec covers two crate responsibilities equally
- **Algorithm reference page standards**: Formula simplification and prose restatement are acceptable; notation convention differences from formal spec are acceptable if mathematically equivalent; factual contradictions are not acceptable (none found in Epic 03)
- **Glossary threshold**: Terms absent from the glossary are LOW if they are standard domain knowledge (false sharing, cache line, autocorrelation); MEDIUM if they are named methods, domain-specific overloads of common words, or Cobre-specific acronyms

---

## Epic 03 Finding Inventory (Full List for Remediation Planning)

Outstanding from Epic 02 (ticket-006, 14 HIGH still unresolved):

- `cobre-sddp`: missing links to `sddp-algorithm.md`, `lp-formulation.md`, `system-elements.md`, `block-formulations.md`, `hydro-production-models.md`, `cut-management.md`, `risk-measures.md`, `stopping-rules.md` (8 HIGH)
- `cobre-core`: missing links to `design-principles.md`, `system-elements.md` (2 HIGH)
- `cobre-io`: missing links to `input-loading-pipeline.md`, `validation-architecture.md` (2 HIGH)
- `cobre-cli`: missing link to `configuration-reference.md` (1 HIGH)
- `ferrompi`: 1 HIGH missing spec link (see ticket-006 ferrompi section)

Epic 03 findings (F-1 through F-27, 26 unique remediations):

- F-1 / HIGH: `sddp-algorithm.md` line 164 references Equipment Formulations S3 for GNL thermals; correct is S1.2
- F-2 / MEDIUM: `equipment-formulations.md` missing reverse link to `sddp-algorithm.md`
- F-3 / MEDIUM: `cut-management.md` missing reverse link to `block-formulations.md`
- F-5 / HIGH: `extension-points.md` line 267 references `configuration-reference.md` S18.6-S18.8 (nonexistent); correct is S5, S6.2-S6.3
- F-6 / HIGH: `extension-points.md` lines 228, 268 reference Solver Abstraction S2 for compile-time selection; correct is S10
- F-7 / HIGH: `solver-abstraction.md` line 388 footer mislabels S8 ("stage transitions") and S11 ("dual-solver validation")
- F-8 / HIGH: `solver-abstraction.md` line 190 self-reference uses S10 for LP rebuild strategy; correct is S11
- F-9 / HIGH: `penalty-system.md` line 339 references LP Formulation S5.0 and S5.8 (nonexistent); correct is S1 and S9
- F-10 / LOW: `deferred.md` lines 70, 167, 220, 814 contain legacy "DATA_MODEL S3.x.x" pre-migration references
- F-11 / HIGH: `design-principles.md` line 139 references Solver Abstraction S9 for compile-time selection; correct is S10
- F-12 / MEDIUM: `training-loop.md` missing link to `synchronization.md` for barrier semantics
- F-13 / MEDIUM: `cut-management.md` missing link to `cut-management-impl.md`
- F-14 / MEDIUM: `configuration-reference.md` missing reverse link to `solver-abstraction.md`
- F-15 / MEDIUM: `internal-structures.md` and `lp-formulation.md` have no cross-references to each other
- F-16 / MEDIUM: `algorithms/benders.md` line 35 uses matrix notation vs. direct-dual convention; add clarifying note
- F-17 / MEDIUM: `algorithms/forward-backward.md` missing link to `solver-workspaces.md` in "Related topics"
- F-18 / MEDIUM: `algorithms/cvar.md` missing link to `cut-management.md` in "Further reading"
- F-19 / MEDIUM: `glossary.md` missing term "Epigraph variable"
- F-20 / MEDIUM: `glossary.md` missing term "Relatively complete recourse"
- F-21 / MEDIUM: `glossary.md` missing term "Yule-Walker equations"
- F-22 / MEDIUM: `glossary.md` missing term "Innovation" (stochastic modeling)
- F-23 / MEDIUM: `glossary.md` missing term "Discount factor"
- F-24 / MEDIUM: `glossary.md` missing term "EAVaR"
- F-25 / MEDIUM: `glossary.md` missing term "Block" (intra-stage time period, patamar)
- F-26 / MEDIUM: `glossary.md` missing term "Coherent risk measure"
- F-27 / MEDIUM: `glossary.md` missing term "Outer approximation"

Definition text for all glossary additions is in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-013-audit-report.md` sections F-19 through F-27.

---

## Surprises and Deviations from Plan

- **Zero formula contradictions**: Epic 03 expected to find formula inconsistencies between algorithm reference pages and formal specs. None were found across 19 formulas and 8 factual claims. The algorithm reference layer is mathematically sound.
- **All 35 existing crate doc links are semantically accurate**: Epic 02 found 14 HIGH missing crate doc links; Epic 03 confirmed that the links which do exist are well-crafted. The gap is coverage, not accuracy.
- **solver-abstraction.md renumbering is the dominant HIGH finding cluster**: 4 of 7 HIGH findings (F-6, F-7, F-8, F-11) trace to a single renumbering event in solver-abstraction.md. Remediating these 4 together is more efficient than treating them independently.
- **Glossary term count discrepancy**: Ticket 013 background stated 78 terms in 9 categories; actual count is 72 terms in 10 categories. Criteria derived from earlier-epic estimates without re-reading the file cause scope drift. Read the target file before writing acceptance criteria.
- **F-4 duplication**: Ticket 010 pre-identified penalty-system.md as informational/out-of-scope (F-4), and ticket 011 independently found and confirmed the same issue as F-9. Cross-ticket handoff should assign identified out-of-scope issues directly to the downstream ticket's acceptance criteria.

---

## Recommendations for Future Epics

- **Epic 04 (LaTeX rendering)**: Zero formula errors found; if a formula renders incorrectly, the root cause is a rendering bug, not an authoring error. The F-16 notation difference in `benders.md` ($E_{t+1}^\top \pi^*$ vs. direct-dual) is intentional -- do not "fix" it during rendering passes.
- **Epic 05 (Cross-Reference Index)**: Resolve all 7 HIGH findings before or during index construction to avoid indexing wrong section numbers. The 6 asymmetric reference gaps (F-2, F-3, F-12, F-13, F-14, F-15) should generate bidirectional index entries even if source files are not yet patched. The 21 deferred features in `deferred.md` (ticket-009 section 2.2) each need an individual index entry. Use the master 50-row crate table from ticket-009 section 5 as the base.
- **Epic 06 (Remediation)**: Four highest-priority clusters: (1) solver-abstraction.md renumbering: fix F-6, F-7, F-8, F-11 together (4 HIGH, same root cause, 3 files); (2) phantom section references: fix F-5, F-9 (2 HIGH, different files, quick mechanical fixes); (3) 14 HIGH crate doc missing links from Epic 02 (see per-crate breakdown in epic-02-summary.md); (4) 9 glossary additions F-19 to F-27 (all self-contained, definition text in ticket-013 report). Ticket sizing for Epic 06 should group HIGH findings by file cluster, not by source ticket.
- **Write acceptance criteria after reading the target file**: This was flagged in Epic 02 and confirmed again in Epic 03. Never use counts or section numbers from memory or prior ticket estimates.
