# ticket-018 Specify Determinism Verification Across Backends

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add Section 4 (Determinism Verification) to `src/specs/hpc/backend-testing.md` that extends the reproducibility invariant from `shared-memory-aggregation.md` SS3 to all communication backends. This section must specify: (1) the exact quantities that must be bit-for-bit identical across backends (lower bound trace, final cut pool, policy output), (2) the quantities that may have floating-point differences (upper bound mean, due to reduction tree shape), (3) the test matrix of backend combinations and rank counts to verify, and (4) the relationship to existing reproducibility requirements.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/hpc/backend-testing.md` (add Section 4)
- **Key decisions needed**:
  - Whether to extend shared-memory-aggregation.md SS3.1's invariant table or create a new one that subsumes it
  - The exact test matrix: which backend pairs, which rank counts, which reference cases
  - Whether floating-point tolerance for upper bound mean should be specified numerically (e.g., ~1e-12 relative error) or qualitatively
- **Open questions**:
  - Should the determinism guarantee extend to the TCP backend's allreduce (which may have a different reduction tree shape than MPI's)?
  - For the local backend (size=1), how do you verify determinism against multi-rank backends (size>1)? (Answer: you run the multi-rank backend with the same total forward passes and compare the mathematical outputs, not the communication patterns.)
  - Should the test spec reference or update shared-memory-aggregation.md SS3?

## Dependencies

- **Blocked By**: ticket-017 (conformance tests must exist first; determinism builds on conformance)
- **Blocks**: None (this is the final ticket in the plan)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
