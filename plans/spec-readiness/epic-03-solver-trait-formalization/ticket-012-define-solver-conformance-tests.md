# ticket-012 Define SolverInterface Conformance Test Spec

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create a conformance test specification for the SolverInterface trait, covering all 8 operations from solver-abstraction.md SS4.1. The test spec should follow the backend-testing.md pattern with requirements tables. It must verify that both HiGHS and CLP implementations satisfy the same behavioral contract, establishing the solver-agnostic property. Test cases should cover the LP lifecycle: load template, add cuts, patch RHS, solve, extract solution, warm-start from basis, and reset.

## Anticipated Scope

- **Files likely to be modified**: Create `src/specs/architecture/solver-interface-testing.md`
- **Key decisions needed**: Test case complexity (how large should test LPs be?); whether to include dual normalization tests (solver-abstraction.md SS8) or defer to solver-specific test specs; whether to test retry logic externally or leave it as solver-internal
- **Open questions**: Should the conformance tests include cross-solver equivalence tests (same LP gives same primal/dual up to tolerance)? What tolerance for numerical comparison?

## Dependencies

- **Blocked By**: ticket-011
- **Blocks**: ticket-013

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
