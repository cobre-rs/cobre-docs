# Epic 03: Production Scale Reference Hardening

## Goals

Make every numeric value in `production-scale-reference.md` provably traceable to the LP sizing calculator, ensure the counting formulas in the spec exactly match the calculator code, update the forward pass count from 200 to 192 throughout the corpus, and propagate all dependent value changes (communication payload sizes, memory estimates, etc.) caused by the forward pass update.

## Scope

### In Scope

- Running the LP sizing calculator and cross-checking every output value against production-scale-reference.md
- Line-by-line comparison of counting formulas in section 3.3 against the calculator code
- Updating forward passes from 200 to 192 in production-scale-reference.md and all other specs
- Updating all values that depend on forward pass count (communication payloads, memory estimates, parallelism arithmetic)
- Adding traceability annotations to production-scale-reference.md linking each value to the calculator

### Out of Scope

- Modifying the LP sizing calculator code
- Adding new sections to production-scale-reference.md
- Changing hardware assumptions

## Tickets

| ID         | Title                                                      | Scope                                                             | Estimate |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| ticket-010 | Cross-check sizing calculator output against spec values   | Run calculator, compare every value against spec sections 3.1-3.4 | 2 points |
| ticket-011 | Update forward pass count from 200 to 192                  | Change forward passes everywhere, update dependent values         | 3 points |
| ticket-012 | Add traceability annotations to production-scale-reference | Link each value to calculator with verification commands          | 2 points |

## Dependencies

- **Depends on**: Epic 01 ticket-003 findings (parameter value locations already cataloged)

## Success Criteria

- Every value in production-scale-reference.md sections 3.1-3.4 matches calculator output (or has an explained deviation)
- Forward pass count is 192 everywhere in the spec corpus
- All dependent values (communication payloads, memory estimates, parallelism arithmetic) are updated
- Traceability annotations allow any reader to reproduce the values
- mdBook builds cleanly
