# Master Plan: Specification Documentation Deep Consistency Audit

## Executive Summary

This plan performs a deep consistency audit of the Cobre specification corpus (50 documents, ~14,588 lines), going beyond the structural migration audit already completed. It verifies internal mathematical consistency across specs, validates external bibliography references, hardens the production scale reference with traceable sizing data, and builds a defensible wall-clock time model for the production target (50 iterations, 192 forward passes, AMD EPYC, under 2 hours). It also reviews documentation organization, cleans up deferred NEWAVE migration content, and assesses the impact of a future PyO3 Python API on the existing spec corpus.

## Goals & Non-Goals

### Goals

1. **Internal formula consistency**: Every mathematical symbol, formula, and parameter value used in any spec matches its canonical definition in `notation-conventions.md` and is used consistently across all 50 specs.
2. **External reference accuracy**: All 13 bibliography entries have correct metadata (authors, year, title, journal, DOI/URL), DOIs resolve, and each citation in the corpus is used in a contextually correct way.
3. **Production scale traceability**: Every numeric value in `production-scale-reference.md` is traceable to the LP sizing calculator (`powers/scripts/lp_sizing.py`), the formulas in the spec match the calculator code exactly, and the forward pass count is updated from 200 to 192.
4. **Wall-clock time feasibility**: A documented timing model proves (or identifies gaps in proving) that 50 iterations with 192 forward passes on 64 AMD EPYC ranks can complete under 2 hours.
5. **Documentation organization**: The spec organization is formally reviewed for coherence, NEWAVE migration stubs are removed, and NEWAVE/CEPEL references are cleaned up per a defined keep/update/remove policy.
6. **Python API impact assessment**: The impact of a future PyO3 Python API on existing specs is assessed, and an outline specification for the `cobre-python` crate is produced.

### Non-Goals

- Rewriting specs for style or readability (out of scope)
- Verifying code implementations against specs (implementation audit, separate plan)
- Adding new specs or new sections to existing specs (except cobre-python outline)
- Changing the LP sizing calculator code
- Implementing the PyO3 Python API (this plan only assesses spec impact)
- Implementing NEWAVE file parsing (deferred to future work)

## Architecture Overview

### Current State

The specification corpus has been structurally validated (spec-migration-audit, 21 tickets completed). Content integrity, cross-references, LaTeX rendering, and spec-to-crate mappings are verified. However, the **semantic content** has not been audited for internal mathematical consistency, the bibliography has not been verified against actual publications, and the production-scale values carry a disclaimer ("non-binding estimates pending solver benchmarking").

Additionally, the mdBook contains 6 stub files in `src/migration/` for NEWAVE migration documentation that has not been written, and 31 files reference NEWAVE/CEPEL/DECOMP/DESSEM with varying levels of relevance. No Python API exists and no spec documents address PyO3 bindings.

### Target State

- All formulas across the 14 math specs, 8 HPC specs, and 13 architecture specs use symbols consistently with `notation-conventions.md`
- All parameter values (dimensions, typical sizes) are consistent across specs
- All 13 bibliography entries are verified correct; each citation in the corpus matches the referenced paper's actual content
- `production-scale-reference.md` values are provably traceable to the calculator
- A wall-clock time model with explicit assumptions replaces the "aspirational" timing targets
- Forward pass count updated to 192 throughout the corpus
- Spec organization formally reviewed with documented rationale
- NEWAVE migration stubs removed; NEWAVE references cleaned up per policy
- Python API surface defined; spec impact assessed; cobre-python outline spec drafted

### Key Design Decisions

1. **Read-only audit first, fixes second**: Each ticket first produces a findings report. Fixes are applied within the same ticket for clear, localized issues. Systemic issues are flagged for follow-up.
2. **Calculator is the source of truth**: The LP sizing calculator defines the correct numeric values; the spec documentation must match.
3. **Progressive planning**: Epics 1-2 are fully detailed (they require only reading and comparing documents). Epics 3-6 are outlined because they depend on findings from earlier epics or require external tool interaction and domain design decisions.
4. **NEWAVE deferral policy**: Strategic and domain-modeling NEWAVE references stay; file format specifics and parser documentation are removed or deferred.
5. **Python API is assessment-only**: Epic 06 produces spec documents, not code. Implementation is a separate future plan.

## Technical Approach

### Tech Stack

- **Primary**: Markdown documentation in mdBook
- **Tools**: Python LP sizing calculator, web browser for DOI verification, mathematical reasoning
- **Specialist**: `sddp-specialist` for domain-specific mathematical auditing

### Component/Module Breakdown

| Epic    | Focus                                        | Specs Involved                                                        | Estimated Tickets |
| ------- | -------------------------------------------- | --------------------------------------------------------------------- | ----------------- |
| Epic 01 | Internal formula & value consistency         | All 50 specs, primarily 14 math + notation-conventions                | 5                 |
| Epic 02 | External reference verification              | bibliography.md + all specs with citations                            | 4                 |
| Epic 03 | Production scale reference hardening         | production-scale-reference.md + LP sizing calculator                  | 3                 |
| Epic 04 | Wall-clock time model                        | production-scale-reference.md + HPC specs                             | 3                 |
| Epic 05 | Documentation organization & NEWAVE deferral | All 50 specs, SUMMARY.md, src/migration/, 31 NEWAVE-referencing files | 3                 |
| Epic 06 | PyO3 Python API impact assessment            | All 7 crate docs, architecture specs, data-model specs                | 3                 |

### Data Flow

```
notation-conventions.md ──────────────────┐
                                          ├──→ Epic 01: Cross-check formulas
14 math specs ────────────────────────────┘
13 architecture specs ────────────────────┘
8 HPC specs ──────────────────────────────┘

bibliography.md ──────────────────────────┐
                                          ├──→ Epic 02: Verify references
All specs with [citations] ───────────────┘

LP sizing calculator ─────────────────────┐
                                          ├──→ Epic 03: Harden sizing values
production-scale-reference.md ────────────┘

HPC specs (work-distribution, hybrid-parallelism, ├──→ Epic 04: Build timing model
communication-patterns, memory-architecture) ─────┘
production-scale-reference.md ────────────────────┘

SUMMARY.md, 6 section container pages ────┐
50 spec files, cross-reference-index ─────├──→ Epic 05: Organization & NEWAVE cleanup
src/migration/ (6 stubs) ────────────────┘
31 NEWAVE-referencing files ──────────────┘

7 crate docs ─────────────────────────────┐
architecture specs (lifecycle, validation) ├──→ Epic 06: Python API impact
HPC specs (parallelism, memory) ──────────┘
data-model specs (output, input) ─────────┘
```

### Testing Strategy

Each ticket produces a structured findings report. Validation is through:

1. Manual review of findings by domain expert
2. mdBook build passes after any fixes (`mdbook build` exits 0)
3. For Epic 03: running the LP sizing calculator and comparing output
4. For Epic 05: mdBook builds cleanly after migration removal and reference cleanup
5. For Epic 06: review of deliverable documents for completeness and accuracy

## Phases & Milestones

| Phase | Epic    | Milestone                     | Criteria                                                                       |
| ----- | ------- | ----------------------------- | ------------------------------------------------------------------------------ |
| 1     | Epic 01 | Internal consistency verified | All formula/value inconsistencies documented and fixed                         |
| 2     | Epic 02 | External references verified  | All 13 bibliography entries confirmed; citation usage validated                |
| 3     | Epic 03 | Production values hardened    | All values traceable to calculator; forward passes updated to 192              |
| 4     | Epic 04 | Timing model complete         | Documented model with explicit assumptions proves < 2h feasibility             |
| 5     | Epic 05 | Documentation organized       | Spec organization reviewed; NEWAVE stubs removed; references cleaned           |
| 6     | Epic 06 | Python API impact assessed    | API surface defined; spec impact report complete; cobre-python outline drafted |

## Risk Analysis

| Risk                                                     | Likelihood | Impact | Mitigation                                                    |
| -------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| Inconsistencies cascade across many specs                | Medium     | High   | Epic 01 produces a comprehensive report before any fixes      |
| Bibliography DOIs unreachable                            | Low        | Low    | Note unreachable DOIs; verify title/author via Google Scholar |
| Calculator defaults diverge from spec assumptions        | Low        | Medium | Run calculator with exact spec parameters                     |
| Timing model reveals infeasibility                       | Low        | High   | Document the gap and required parameter changes               |
| NEWAVE reference cleanup has unintended scope            | Low        | Medium | Clear keep/update/remove policy with per-file inventory       |
| Python API surface design requires upstream spec changes | Medium     | Medium | Epic 06 is assessment-only; changes deferred to future plan   |

## Success Metrics

1. Zero unresolved formula inconsistencies across the spec corpus
2. All 13 bibliography entries verified or annotated with corrections
3. Every numeric value in production-scale-reference.md has a traceable source
4. Wall-clock time model with explicit, reviewable assumptions
5. mdBook builds cleanly after all changes
6. NEWAVE migration stubs removed; all remaining NEWAVE references justified per policy
7. Python API surface document, spec impact report, and cobre-python outline spec delivered
