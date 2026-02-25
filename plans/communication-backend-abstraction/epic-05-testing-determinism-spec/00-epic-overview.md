# Epic 05: Testing and Determinism Verification Specification

## Goals

1. Specify backend interchangeability tests: given the same inputs and rank count, all backends produce identical results
2. Extend the reproducibility invariant from shared-memory-aggregation.md §3 to all backends
3. Define a conformance test matrix for verifying that new backends correctly implement the Communicator trait
4. Specify performance regression tests for the ferrompi backend
5. Specify Python multi-process determinism tests (fork rejection, worker error propagation, progress event multiplexing, TCP auto-detection)

## Scope

This epic produces one new spec document:

- `src/specs/hpc/backend-testing.md` -- Conformance tests (§1), interchangeability tests (§2), performance baselines (§3), determinism verification (§4)

## Tickets

| Ticket     | Title                                                      | Status  | Detail Level |
| ---------- | ---------------------------------------------------------- | ------- | ------------ |
| ticket-017 | Specify backend conformance and interchangeability testing | pending | Refined      |
| ticket-018 | Specify determinism verification across backends           | pending | Refined      |

## Dependencies

- **Blocked By**: Epic 01 (trait defines the contract), Epic 02 (backends define what to test), Epic 03 (refactored specs define expected behavior), Epic 04 (Python multi-process surface to test)
- **Blocks**: None (this is the final epic)

## Success Criteria

- A testing spec document defines conformance tests for the Communicator trait
- The reproducibility invariant is explicitly extended to cover all four backends
- Performance regression criteria are documented for the ferrompi backend
- The test matrix covers: single-process, multi-process same-node, multi-node (ferrompi and TCP)
- Python multi-process determinism tests cover the full orchestration lifecycle
