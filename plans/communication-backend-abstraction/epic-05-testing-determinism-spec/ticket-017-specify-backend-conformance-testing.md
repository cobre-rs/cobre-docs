# ticket-017 Specify Backend Conformance and Interchangeability Testing

## Context

### Background

Epics 01-04 produced a complete `Communicator` trait ([communicator-trait.md §1](../../src/specs/hpc/communicator-trait.md)), four backend implementations (ferrompi, local, TCP, shm), a two-level backend selection mechanism, and a Python multi-process orchestration layer. The trait contract defines method preconditions, postconditions, determinism guarantees, and error semantics -- but there is no specification for _testing_ that backends conform to these contracts. Without a testing specification, backend implementors have no reference for what to test, no shared vocabulary for conformance, and no documented performance baselines.

This ticket creates the first three sections of a new spec document `src/specs/hpc/backend-testing.md`:

- **§1 Conformance Test Suite** -- method-level tests that every `Communicator` implementation must pass.
- **§2 Interchangeability Tests** -- verify that switching backends does not change SDDP results.
- **§3 Performance Regression Tests** -- document performance baselines for the ferrompi backend to detect trait-abstraction overhead.

### Relation to Epic

Epic 05 (Testing and Determinism Verification) has two goals: (1) define conformance and interchangeability testing (this ticket), and (2) define determinism verification across backends (ticket-018). This ticket lays the foundation by establishing the test vocabulary, the test case reference problem, and the conformance matrix. Ticket-018 builds on §2 by adding the deeper determinism analysis and extending the reproducibility invariant from `shared-memory-aggregation.md` §3.

### Current State

- `src/specs/hpc/backend-testing.md` does not exist yet. This ticket creates it.
- The `Communicator` trait is fully specified in `communicator-trait.md` §1-§2 with method contracts (preconditions, postconditions, error semantics) for `allgatherv`, `allreduce`, `broadcast`, `barrier`, `rank`, and `size`.
- The `SharedMemoryProvider` trait is specified in `communicator-trait.md` §4 with `create_shared_region`, `split_local`, `is_leader`, and the `SharedRegion<T>` sub-trait (`as_slice`, `as_mut_slice`, `fence`).
- Four backend specs exist:
  - `backend-ferrompi.md` -- wraps ferrompi/MPI, §4 documents zero-cost monomorphization, §5 documents error mapping.
  - `backend-local.md` -- ZST, identity/no-op semantics, §2 has the behavior comparison table and postcondition verification table.
  - `backend-tcp.md` -- coordinator star topology, §3 defines the four collective protocols, §5 documents timeout-based failure detection.
  - `backend-shm.md` -- POSIX shared memory, §3 defines collective protocols with two-barrier allreduce, §1.4 documents the barrier algorithm with generation counter.
- `shared-memory-aggregation.md` §3 defines the reproducibility invariant (bit-for-bit independent of rank count, thread count, timing).
- `python-bindings.md` SS2.1a defines the multi-process worker lifecycle, SS6.1a defines `WorkerError`, SS7.5 defines Python backend auto-detection.

## Specification

### Requirements

1. Create `src/specs/hpc/backend-testing.md` with `# Backend Testing and Conformance`, `## Purpose`, and three numbered top-level sections (§1, §2, §3).

2. **§1 Conformance Test Suite**: Define a method-level conformance test matrix covering every `Communicator` and `SharedMemoryProvider` trait method. For each method, specify:
   - Test name (following `test_{backend}_{method}_{scenario}` naming convention).
   - Rank counts to test: 1 (local), 2 (minimum multi-rank), 4 (tests offset arithmetic).
   - Input scenarios: normal case, boundary cases (empty buffers, single element), and error cases (invalid root, buffer size mismatch).
   - Expected observable behavior (postcondition to assert).
   - Error cases: expected `CommError` variant for each precondition violation.

3. **§1 Conformance tests must cover** (at minimum):
   - `allgatherv`: rank-ordered receive with heterogeneous send sizes (rank 0 sends 3 elements, rank 1 sends 5), identity on size=1, empty send buffer (`counts[r]=0` for one rank).
   - `allreduce`: `ReduceOp::Sum` and `ReduceOp::Min` correctness, identity on size=1, single-element buffer.
   - `broadcast`: root=0 (common case), root=last_rank (non-zero root), data integrity (all ranks have identical buffer after call).
   - `barrier`: all-ranks-must-enter semantics (verifiable by sequencing: write before barrier, read after barrier).
   - `rank` and `size`: `rank()` in `0..size()`, all ranks report same `size()`, no two ranks return same `rank()`.
   - `SharedMemoryProvider`: `create_shared_region` + `as_mut_slice` (leader) + `fence` + `as_slice` (follower) lifecycle, `is_leader` returns `true` for local rank 0, `split_local` returns communicator with appropriate rank/size.

4. **§1 Backend-specific conformance notes**:
   - `local`: all error cases return `Ok(())` (infallible, see `backend-local.md` §1.2 paragraph on infallibility).
   - `ferrompi`: precondition checks delegated to ferrompi layer (see `backend-ferrompi.md` §1.2).
   - `tcp`: `mpi_error_code` field is always `0` for `CommError::CollectiveFailed` (see `backend-tcp.md` §5.3).
   - `shm`: two-barrier allreduce protocol -- specify a test that validates rank 0 performs the reduction (see `backend-shm.md` §3.2).

5. **§2 Interchangeability Tests**: Define tests that verify identical SDDP results across backends given the same inputs and rank count. Requirements:
   - Define a **reference test case**: a small but non-trivial SDDP problem (2-3 stages, 2 hydro plants, 10 forward passes, 5 iterations) that completes in under 5 seconds on a single core.
   - Specify the **comparison matrix**: run the reference case with `{local size=1, shm size=2, tcp size=2, ferrompi size=2}` and compare outputs.
   - Specify **which quantities must be identical** across backends: lower bound trace (bit-for-bit), final cut pool (bit-for-bit), policy output (bit-for-bit). Cross-reference `shared-memory-aggregation.md` §3.4.
   - Specify **which quantities may differ**: upper bound mean (floating-point tolerance ~1e-12 relative error due to allreduce tree shape, see `communicator-trait.md` §2.2). Note: TCP and shm backends use fixed rank-order reduction (stricter than MPI), so only ferrompi may diverge from TCP/shm.
   - The local backend (size=1) produces a reference result. Multi-rank backends must match on lower bound and policy. Upper bound comparison uses tolerance.

6. **§2 Python multi-process interchangeability**: Specify an additional interchangeability test run through the Python `cobre.train(num_workers=N, backend="shm")` API surface (not manual per-rank invocations). This tests the full orchestration lifecycle from `python-bindings.md` SS2.1a:
   - Spawn, communicator creation, SDDP execution, result collection from rank 0, worker join.
   - Compare result against single-process `cobre.train(num_workers=1)`.
   - Verify `TrainingResult.workers` returns a list of `N` `WorkerInfo` instances with distinct ranks and identical `backend` values.

7. **§3 Performance Regression Tests**: Document performance baselines for the ferrompi backend to ensure the trait abstraction does not degrade MPI performance. Requirements:
   - Define the baseline: direct ferrompi API calls (without the `Communicator` trait wrapper) at production scale (R=16, 587 MB/iteration).
   - Define the metric: overhead ratio = `(trait_time - direct_time) / direct_time`.
   - Define the threshold: < 1% overhead. Rationale: monomorphization should eliminate all abstraction cost; any measurable overhead indicates a missed optimization (boxing, dynamic dispatch leak, unnecessary copies).
   - Specify what to measure: per-operation timing for `allgatherv` (the dominant operation at ~587 MB/iteration) and `allreduce` (the latency-sensitive operation at 32 bytes).
   - Note that local, TCP, and shm backends do not have a "direct call" baseline to compare against -- their performance tests are integration-level (wall-clock training time within expected bounds).

8. **§3 Python multi-process performance**: Specify wall-clock regression test for `cobre.train(num_workers=N)`:
   - Reference: `cobre.train(num_workers=1)` wall clock time.
   - Expected: `cobre.train(num_workers=2, backend="shm")` completes in < 70% of the single-worker wall clock (super-linear not expected, but communication overhead should not dominate).
   - This is a smoke test, not a microbenchmark.

9. Add a `## Cross-References` section at the end of the file linking back to all referenced specifications.

### Key Design Decisions

- **Conformance tests are specified as requirements, not as executable test code.** The spec defines _what_ to test (scenario, expected behavior, assertion). The implementation test suite (future Rust `#[cfg(test)]` modules) implements these requirements. This keeps the spec backend-agnostic while enabling any test framework.
- **The reference test case is defined by properties (stages, entities, iterations), not by a specific input dataset.** This allows the test to be generated programmatically. A concrete example dataset may be added to the repository later; the spec defines the constraints.
- **Performance thresholds are documented as spec requirements.** If a code change causes the ferrompi backend to exceed 1% overhead, the spec is violated -- this makes performance regression a specification concern, not just a CI concern.
- **Rank count 2 is the minimum for multi-rank tests.** Two ranks are sufficient to verify correctness of all collective operations (allgatherv needs at least 2 to test data exchange, allreduce needs at least 2 for a non-trivial reduction). Rank count 4 tests offset arithmetic edge cases (non-power-of-2 send sizes, displacement calculation with 4 contributors).

### Outputs/Behavior

The ticket produces one new file: `src/specs/hpc/backend-testing.md` with §1-§3 (§4 is added by ticket-018).

The file uses `§` section references (HPC spec convention), follows the standard spec structure (`# Title`, `## Purpose`, numbered sections, `## Cross-References`), and uses tables for the conformance matrix and performance baselines.

### Error Handling

§1 must specify error-case tests for each `CommError` variant:

- `CommError::InvalidBufferSize` -- triggered by `send.len() != recv.len()` in `allreduce`, or `recv` too small in `allgatherv`.
- `CommError::InvalidRoot` -- triggered by `root >= size()` in `broadcast`.
- `CommError::CollectiveFailed` -- triggered by timeout, rank crash, or MPI failure. For TCP: detectable via `COBRE_TCP_TIMEOUT_SECS=2` with a deliberately killed worker. For shm: detectable via a process that never reaches the barrier.
- `CommError::InvalidCommunicator` -- triggered by using a finalized communicator (MPI-specific).
- `CommError::AllocationFailed` -- triggered by requesting an excessively large `SharedRegion`.

## Acceptance Criteria

- [ ] File `src/specs/hpc/backend-testing.md` exists with `# Backend Testing and Conformance`, `## Purpose`, §1, §2, §3, and `## Cross-References`.
- [ ] §1 contains a conformance test table with rows for every `Communicator` method (`allgatherv`, `allreduce`, `broadcast`, `barrier`, `rank`, `size`) and every `SharedMemoryProvider`/`SharedRegion` method, with test scenarios, rank counts, and expected behavior.
- [ ] §1 contains error-case tests for `CommError::InvalidBufferSize`, `CommError::InvalidRoot`, `CommError::CollectiveFailed`, `CommError::InvalidCommunicator`, and `CommError::AllocationFailed`.
- [ ] §1 contains backend-specific notes for local (infallible), ferrompi (delegated validation), tcp (`mpi_error_code=0`), and shm (two-barrier test).
- [ ] §2 defines a reference test case with stated properties (stages, entities, forward passes, iterations, expected completion time).
- [ ] §2 specifies the backend comparison matrix (local size=1, shm size=2, tcp size=2, ferrompi size=2) with explicit bit-for-bit and tolerance comparisons.
- [ ] §2 includes a Python multi-process interchangeability test using `cobre.train(num_workers=N, backend="shm")` and validates `TrainingResult.workers` metadata.
- [ ] §3 specifies ferrompi performance regression thresholds (< 1% overhead vs direct API calls) with per-operation measurements.
- [ ] §3 includes a Python multi-process smoke test comparing `num_workers=1` vs `num_workers=2` wall clock time.
- [ ] `## Cross-References` links to `communicator-trait.md`, all four backend specs, `shared-memory-aggregation.md`, `backend-selection.md`, and `python-bindings.md`.
- [ ] No existing files are modified by this ticket.

## Implementation Guide

### Suggested Approach

1. Create `src/specs/hpc/backend-testing.md`.
2. Write `# Backend Testing and Conformance` and a `## Purpose` paragraph summarizing the three concerns (conformance, interchangeability, performance regression).
3. Write **§1 Conformance Test Suite**:
   - Start with a summary table: rows = methods, columns = test scenario + rank count + expected result.
   - Then expand each method into a subsection (§1.1 through §1.7) with detailed test case descriptions.
   - Include a subsection for `SharedMemoryProvider` lifecycle tests (§1.7 or §1.8).
   - End §1 with a subsection on error-case tests organized by `CommError` variant.
   - Add a backend-specific notes subsection documenting per-backend behavioral differences in error handling.
4. Write **§2 Interchangeability Tests**:
   - §2.1 defines the reference test case properties.
   - §2.2 defines the comparison matrix table.
   - §2.3 defines the comparison criteria (bit-for-bit vs tolerance, which quantities).
   - §2.4 defines the Python multi-process interchangeability test.
5. Write **§3 Performance Regression Tests**:
   - §3.1 defines the ferrompi overhead baseline methodology.
   - §3.2 defines the per-operation measurement and threshold table.
   - §3.3 defines the Python multi-process smoke test.
6. Write `## Cross-References` with links following the `[Target §N](./file.md)` convention for HPC-to-HPC links.

### Key Files to Modify

- **Create**: `src/specs/hpc/backend-testing.md`

### Patterns to Follow

- Use `§` notation for sections within `src/specs/hpc/` files (established convention from learnings).
- Use the table-heavy format established in the backend specs: precondition/postcondition tables, comparison matrices, per-backend behavior tables.
- Follow the spec document structure: `# Title`, `## Purpose` (one paragraph), numbered sections, `## Cross-References`.
- Cross-reference format: `[Communicator Trait §2.1](./communicator-trait.md)` for HPC-to-HPC links; `[Python Bindings SS2.1a](../interfaces/python-bindings.md)` for HPC-to-interfaces links.

### Pitfalls to Avoid

- Do NOT write executable test code. This is a specification document, not a Rust test module. Describe test _requirements_ (what to test, what to assert), not test _implementations_.
- Do NOT modify any existing spec files. This ticket only creates the new `backend-testing.md` file.
- Do NOT include §4 (Determinism Verification) -- that is ticket-018's scope.
- Do NOT define test infrastructure (test harness, CI pipeline, fixtures). The spec defines _what_ to test; how to run it is an implementation concern.
- Avoid specifying exact numeric values for the reference test case's expected results (lower bound, upper bound). The spec defines the problem _properties_; the exact numerical results depend on the implementation.

## Testing Requirements

### Review Checks

- Every `Communicator` method has at least one normal-case and one error-case test specified.
- Every `SharedMemoryProvider`/`SharedRegion` method has a lifecycle test.
- The reference test case properties are sufficient to enable programmatic generation.
- Performance thresholds are documented with rationale.
- All cross-references resolve to existing spec sections.

### Consistency Checks

- §1 test scenarios cover all preconditions and postconditions listed in `communicator-trait.md` §2.1 through §2.5.
- §2 comparison criteria match the reproducibility invariant from `shared-memory-aggregation.md` §3.4.
- §2 Python test uses the `cobre.train(num_workers=N, backend=...)` signature from `python-bindings.md` SS2.1.
- §3 performance thresholds are consistent with the zero-cost abstraction claims in `backend-ferrompi.md` §4.1 and `backend-selection.md` §1.4.
- Backend-specific error notes in §1 are consistent with error mapping tables in `backend-ferrompi.md` §5, `backend-tcp.md` §5.3, and `backend-local.md` §1.2.

## Dependencies

- **Blocked By**: ticket-001 (trait defines contract), ticket-005 through ticket-008 (backends define what to test), ticket-011 (refactored specs define expected behavior), ticket-014 (Python multi-process surface to test)
- **Blocks**: ticket-018 (determinism verification builds on the conformance test infrastructure and reference test case defined here)

## Effort Estimate

**Points**: 3
**Confidence**: High
