# Epic 02 Learnings: Spec-to-Crate Mapping Audit

**Epic**: epic-02-spec-crate-mapping
**Completed**: 2026-02-24
**Auditor**: sddp-specialist (automated 4-ticket methodology)
**Scope**: 7 crate doc pages + 50 spec files, 4 tickets

---

## What Epic 02 Accomplished

Epic 02 audited two separate concerns in parallel:

1. **Crate documentation page completeness** (ticket-006): Verified that each of the 7 crate doc pages in `/home/rogerio/git/cobre-docs/src/crates/` correctly cross-references the formal specs that define its behavior. This produced 14 HIGH and 11 MEDIUM findings -- the most significant quality debt discovered across all epics so far.

2. **Spec-to-crate section placement** (tickets 007, 008, 009): Verified that each of the 50 spec files is located in the mdBook section that correctly reflects its primary implementation target crate. This produced 0 CRITICAL, 0 HIGH, 1 MEDIUM, and 6 LOW findings. All 50 files are correctly placed.

3. **Master spec-to-crate mapping table** (ticket-009): Produced a complete 50-row table in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` (section 5), covering primary crate, secondary crates, and section placement for every spec file.

**Result: All 50 spec files are correctly placed. The crate doc pages are the outstanding gap.**

---

## Severity Distribution

### Ticket-006: Crate Doc Page Audit

| Crate              |  HIGH  | MEDIUM | Verdict |
| ------------------ | :----: | :----: | ------- |
| `cobre-core`       |   2    |   1    | FAIL    |
| `cobre-io`         |   2    |   1    | FAIL    |
| `cobre-sddp`       |   8    |   7    | FAIL    |
| `cobre-cli`        |   1    |   0    | FAIL    |
| `cobre-stochastic` |   0    |   0    | PASS    |
| `cobre-solver`     |   0    |   0    | PASS    |
| `ferrompi`         |   1    |   2    | FAIL    |
| **Total**          | **14** | **11** |         |

### Tickets 007, 008, 009: Section Placement Audit

| Severity | Count | Details                                                                                    |
| -------- | :---: | ------------------------------------------------------------------------------------------ |
| CRITICAL |   0   | No spec in a wrong section; no spec missing from SUMMARY.md                                |
| HIGH     |   0   | All primary crate assignments correct                                                      |
| MEDIUM   |   1   | `synchronization.md` -- ticket context had primary/secondary swapped; corrected by auditor |
| LOW      |   6   | Dual-crate documentation suggestions; 1 deployment-spec note; 1 config dual-nature note    |

---

## The cobre-sddp Crate Doc Gap Pattern

The most significant finding in the epic is that `cobre-sddp` -- the most spec-intensive crate with 22 primary and 16 secondary mappings -- links only 4 of its 12 primary specs from its crate doc page at `/home/rogerio/git/cobre-docs/src/crates/sddp.md`.

**8 HIGH gaps in cobre-sddp**:

- `specs/math/sddp-algorithm.md` -- foundational Bellman recursion and forward/backward pass theory
- `specs/math/lp-formulation.md` -- complete LP subproblem structure
- `specs/math/system-elements.md` -- all system element variables and constraints
- `specs/math/block-formulations.md` -- multi-block stage structure
- `specs/math/hydro-production-models.md` -- FPHA and production models used in LP construction
- `specs/math/cut-management.md` -- mathematical cut generation theory
- `specs/math/risk-measures.md` -- risk measure abstraction
- `specs/math/stopping-rules.md` -- convergence stopping criteria mathematics

**Pattern**: The `sddp.md` crate doc page was written summarizing implementation behavior but links only architecture-level specs (training loop, convergence monitoring, simulation architecture, cut management impl). The underlying mathematical specifications that define what the architecture implements are absent. The crate doc page references concepts from every missing spec (e.g., "piecewise-linear approximation of the expected future cost function" from `sddp-algorithm.md`, "risk measure" from `risk-measures.md`) without linking the formal definition.

**Implication**: A developer reading `sddp.md` cannot navigate to the mathematical foundation of what they are implementing. This is the primary quality deficit in the cobre-docs crate reference section.

---

## Architecture Placement Decisions Documented

Three specs in `specs/architecture/` were pre-identified in the epic overview as placement ambiguities. All three were resolved as "keep in current section" by ticket-008.

### D1: `specs/architecture/input-loading-pipeline.md` -- Keep in Architecture

- **Primary crate**: `cobre-io`
- **Alternative considered**: Move to `specs/data-model/` alongside other `cobre-io` specs
- **Decision**: Keep in `specs/architecture/`. The spec defines loading _orchestration_ (rank-0 centric pattern, 30+ file loading sequence with dependency order, conditional loading, sparse time-series expansion, broadcast strategy) -- not data schemas. The orchestration pattern is an architectural concern.
- **Source**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-008-audit-report.md` (Decision D1)

### D2: `specs/architecture/validation-architecture.md` -- Keep in Architecture

- **Primary crate**: `cobre-io` (implements validation); secondary: `cobre-cli` (orchestrates five-layer pipeline)
- **Alternative considered**: Move to `specs/data-model/` or split between cobre-io and cobre-cli sections
- **Decision**: Keep in `specs/architecture/`. The spec defines the validation _pipeline_ and _architecture_ (five layers), not data formats. A cobre-io placement would obscure its cross-crate architectural significance.
- **Source**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-008-audit-report.md` (Decision D2)

### D3: `specs/architecture/scenario-generation.md` -- Keep in Architecture

- **Primary crate**: `cobre-stochastic` (not `cobre-sddp` as might be assumed)
- **Alternative considered**: Move to a `specs/stochastic/` section (which does not exist) or classify primary as `cobre-sddp`
- **Decision**: Keep in `specs/architecture/`. The spec defines the scenario generation _implementation pipeline_, not the mathematical stochastic model (which is in `specs/math/par-inflow-model.md`). The architectural section correctly houses it. Primary crate confirmed as `cobre-stochastic`.
- **Source**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-008-audit-report.md` (Decision D3)

---

## Key Crate Mapping Facts from Master Table

The 50-row master table is the authoritative record. Key facts for downstream epics:

- `cobre-sddp`: 22 primary specs, 16 secondary. Dominates the math and HPC sections. The only crate with zero primary specs in the data-model/overview sections (expected: it is a consumer of data, not a definer).
- `cobre-core`: 6 primary specs, 11 secondary. Primary specs are concentrated in data-model and math sections (entity types, internal structures, penalty system).
- `cobre-io`: 8 primary specs, 10 secondary. All 8 primary specs are in data-model and architecture sections.
- `ferrompi`: 1 primary spec (`communication-patterns.md`), 9 secondary. Infrastructure crate -- consumed extensively but defines little in formal specs.
- `cobre-stochastic`: 3 primary specs (`input-scenarios.md`, `par-inflow-model.md`, `scenario-generation.md`), 8 secondary.
- `cobre-solver`: 4 primary specs (`solver-abstraction.md`, `solver-highs-impl.md`, `solver-clp-impl.md`, `solver-workspaces.md`), 6 secondary. All 4 primary specs are in `specs/architecture/`.
- `cobre-cli`: 3 primary specs (`cli-and-lifecycle.md`, `slurm-deployment.md`, `configuration-reference.md`), 5 secondary.
- No crate has zero coverage. No gaps detected.

**Full table**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md`, section 5.

---

## Dual-Crate Spec Pattern

Four math specs share content across two crate boundaries in a consistent pattern. This pattern is not an error -- it reflects the design split between entity model ownership (`cobre-core`) and LP construction ownership (`cobre-sddp`):

- `specs/math/system-elements.md`: entity definitions owned by `cobre-core`; LP variable/constraint usage owned by `cobre-sddp`
- `specs/math/hydro-production-models.md`: FPHA hyperplane data and geometry owned by `cobre-core`; LP constraint construction owned by `cobre-sddp`
- `specs/math/equipment-formulations.md`: entity field data owned by `cobre-core`; LP constraint assembly owned by `cobre-sddp`
- `specs/architecture/scenario-generation.md`: implementation pipeline owned by `cobre-stochastic`; consumed by `cobre-sddp` training loop

Both crate doc pages (`core.md` and `sddp.md`) should cross-reference all four of these specs. Current state: the cross-references are absent or indirect in both pages (see ticket-006 findings CORE-2, SDDP-3, SDDP-5, SDDP-14).

---

## One Primary Assignment Correction Made During Audit

`specs/hpc/synchronization.md` was pre-assigned in the ticket context as `ferrompi` primary, `cobre-sddp` secondary. After reading the spec, the auditor corrected this:

- **Correct assignment**: `cobre-sddp` primary, `ferrompi` secondary
- **Reason**: The spec defines SDDP algorithm synchronization semantics (when to synchronize, what data to exchange, per-stage barrier rationale) rather than MPI primitive specifications. `ferrompi` provides the primitives; `cobre-sddp` orchestrates when they are called.
- **Impact**: No file was moved; the correction only affects the master mapping table.
- **Source**: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md` (finding F-2, MEDIUM)

---

## Observations for Subsequent Epics

### For Epic 03 (Cross-Reference Coherence)

The crate doc gap findings from ticket-006 directly predict cross-reference coherence issues:

- `sddp.md` describes concepts from `sddp-algorithm.md`, `lp-formulation.md`, `risk-measures.md`, and `stopping-rules.md` without linking them. Epic 03 ticket-013 (glossary and crate cross-references) should verify whether these forward-reference descriptions are semantically accurate against the formal specs they paraphrase.
- `core.md` describes "canonical order" and "declaration order invariance" (sourced from `design-principles.md`) and "every system element" (sourced from `system-elements.md`) without linking. These indirect descriptions are candidates for coherence drift.
- The MEDIUM finding for `overview.md` dependency graph (D-1: `cobre-stochastic` likely depends on `cobre-core` but the graph omits this edge) should be investigated in Epic 03 when the actual dependency graph is evaluated.

### For Epic 05 (Cross-Reference Index)

The master 50-row spec-to-crate table in ticket-009 is the primary input for the cross-reference index. Key outputs from this epic that Epic 05 should consume:

- The primary and secondary crate assignments for all 50 specs (use the master table in ticket-009-audit-report.md section 5 directly as the source of truth)
- The dual-crate specs (4 files identified above) require bidirectional index entries
- `deferred.md`'s 21 per-feature crate assignments (ticket-009-audit-report.md section 2.2) should produce individual index entries per deferred feature, not a single entry for the whole file

### For Epic 06 (Remediation)

Epic 06 ticket-019 (Fix All HIGH Findings) has 14 HIGH findings from this epic to address, all in the crate doc pages. Each crate doc page requires specific spec links to be added:

**`/home/rogerio/git/cobre-docs/src/crates/sddp.md`** -- 8 HIGH gaps:

- Add links to: `specs/math/sddp-algorithm.md`, `specs/math/lp-formulation.md`, `specs/math/system-elements.md`, `specs/math/block-formulations.md`, `specs/math/hydro-production-models.md`, `specs/math/cut-management.md`, `specs/math/risk-measures.md`, `specs/math/stopping-rules.md`

**`/home/rogerio/git/cobre-docs/src/crates/core.md`** -- 2 HIGH gaps:

- Add links to: `specs/overview/design-principles.md`, `specs/math/system-elements.md`

**`/home/rogerio/git/cobre-docs/src/crates/io.md`** -- 2 HIGH gaps:

- Add links to: `specs/architecture/input-loading-pipeline.md`, `specs/architecture/validation-architecture.md`

**`/home/rogerio/git/cobre-docs/src/crates/cli.md`** -- 1 HIGH gap:

- Add link to: `specs/configuration/configuration-reference.md`

**`/home/rogerio/git/cobre-docs/src/crates/ferrompi.md`** -- 1 HIGH gap (from ticket-006, ferrompi section):

- Verify findings from ticket-006 ferrompi section

The 11 MEDIUM findings (CORE-3, IO-3, SDDP-9 through SDDP-15) are candidates for Epic 06 ticket-020.

---

## Methodology Insights

### What Worked Well

- **Separating crate doc audit from section placement audit**: Ticket-006 (crate doc completeness) and tickets 007-009 (spec section placement) ask fundamentally different questions and produce different types of findings. Running them as separate tickets with separate check protocols prevented confusion between "is this spec in the right section?" and "does the crate doc page reference this spec?".
- **Master table built incrementally**: Building the master table in three slices (13 rows in ticket-007, 14+13=27 rows in ticket-008, 10 rows in ticket-009) allowed each ticket to produce a self-contained deliverable while feeding the final 50-row synthesis. The incremental approach also caught the `synchronization.md` primary assignment correction before it propagated into the final table.
- **M3 ambiguity resolution protocol**: Documenting each placement decision with a named decision ID (D1, D2, D3), stating the alternative considered, and providing a one-paragraph justification creates a durable record that prevents the same question from being re-litigated in later epics.
- **Reading each spec's Purpose section**: The most reliable signal for crate assignment was the spec's own explicit Purpose statement. In all 50 cases, the Purpose statement contained the primary crate (or its domain) either explicitly or by clear implication.

### What Should Be Adjusted for Later Epics

- **Ticket-006 scope was too wide**: Auditing all 7 crate doc pages in a single ticket produced a very long audit report. For future crate doc audits, splitting into 2 tickets (infrastructure crates: ferrompi, cobre-solver, cobre-stochastic; and domain crates: cobre-core, cobre-io, cobre-sddp, cobre-cli) would produce more manageable deliverables.
- **Pre-reading the spec before writing ticket acceptance criteria**: The `synchronization.md` primary/secondary swap (F-2, MEDIUM) was caught by the auditor but was introduced by a ticket context error. Future ticket writers should read the target spec's Purpose section before authoring the crate assignment in the acceptance criteria.
- **Crate doc pages should be audited after the spec corpus is verified**: Ticket-006 correctly ran after ticket-001 through ticket-005 (content integrity). Had it run earlier, the crate doc gap findings could have been confounded by uncertainty about whether the missing specs had correct content.
