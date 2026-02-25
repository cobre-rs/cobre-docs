# Epic 01: Internal Formula & Value Consistency

## Goals

Verify that all mathematical notation, formulas, parameter values, and behavioral descriptions are used consistently across the entire Cobre specification corpus. The canonical source of truth for notation is `notation-conventions.md` (364 lines). Every symbol used in any other spec must match its definition there. Parameter values (system dimensions, typical sizes) must be consistent across `production-scale-reference.md`, `notation-conventions.md`, and individual spec tables.

## Scope

### In Scope

- Cross-checking all symbols in `notation-conventions.md` sections 1-5 against their usage in all 14 math specs
- Verifying parameter values (index set sizes, typical counts) are consistent across overview specs and individual math specs
- Checking that the cut coefficient notation uses pi (not beta) consistently after the epic-06 migration
- Verifying behavioral descriptions (e.g., "forward pass solves N LPs per stage") are consistent between algorithm, architecture, and HPC specs
- Verifying dimensional consistency of formulas (units match across equations)

### Out of Scope

- Verifying formulas are mathematically correct (that would require domain peer review)
- Checking code implementations against specs
- Rewriting specs for style

## Tickets

| ID         | Title                                                                      | Scope                                                                                                                                                                                       | Estimate |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ticket-001 | Audit notation-conventions symbol usage in math specs (part 1)             | notation-conventions sections 1-3 vs sddp-algorithm, lp-formulation, system-elements, block-formulations, hydro-production-models, cut-management                                           | 3 points |
| ticket-002 | Audit notation-conventions symbol usage in math specs (part 2)             | notation-conventions sections 4-5 vs discount-rate, infinite-horizon, risk-measures, inflow-nonnegativity, par-inflow-model, equipment-formulations, stopping-rules, upper-bound-evaluation | 3 points |
| ticket-003 | Audit parameter value consistency across overview and math specs           | Cross-check typical sizes, dimension values, and formulas between production-scale-reference, notation-conventions, and all math specs                                                      | 3 points |
| ticket-004 | Audit behavioral description consistency across architecture and HPC specs | Cross-check behavioral claims about forward/backward pass, parallelism, and LP solving between algorithm specs, architecture specs, and HPC specs                                           | 3 points |
| ticket-005 | Apply fixes for Epic 01 findings                                           | Fix all inconsistencies found in tickets 001-004, verify mdBook build                                                                                                                       | 2 points |

## Dependencies

- None (this is the first epic)

## Success Criteria

- All symbol usages across the 50 specs are verified consistent with notation-conventions.md
- All parameter values are verified consistent across specs
- All behavioral descriptions are verified consistent across spec categories
- Findings report produced with exact file:line references
- All fixes applied and mdBook builds cleanly
