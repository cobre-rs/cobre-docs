# ticket-018 Specify Determinism Verification Across Backends

## Context

### Background

Ticket-017 established the conformance test suite (§1), interchangeability tests (§2), and performance regression tests (§3) in `src/specs/hpc/backend-testing.md`. That ticket defined _which quantities_ must be identical across backends (lower bound trace, final cut pool, policy output) and which may differ (upper bound mean). It also introduced the reference test case used for interchangeability verification.

This ticket adds **§4 Determinism Verification** to the same document. While ticket-017's §2 tests that backends are _interchangeable_ (same results given the same inputs), §4 specifies the deeper property: **reproducibility** -- that the SDDP pipeline produces bit-for-bit identical results across runs with different rank counts, thread counts, and execution timing, for any single backend. This extends the reproducibility invariant from `shared-memory-aggregation.md` §3 to cover all four communication backends explicitly, and adds the Python multi-process execution path as a testing surface.

The reproducibility invariant is a cornerstone of Cobre's correctness model. It ensures that training results are deterministic given the same seed, regardless of how the parallelism is configured. The invariant was originally stated for the ferrompi/MPI backend in `shared-memory-aggregation.md` §3.1; this ticket formalizes it for all backends and specifies the test matrix to verify it.

### Relation to Epic

This is the second and final ticket of Epic 05 (Testing and Determinism Verification). It completes the testing specification by addressing the determinism dimension. Ticket-017 asks "do backends produce the same results as each other?" while ticket-018 asks "does a single backend produce the same results across different parallelism configurations?"

### Current State

- `src/specs/hpc/backend-testing.md` is created by ticket-017 with §1-§3. This ticket appends §4.
- `shared-memory-aggregation.md` §3 defines the existing reproducibility invariant:
  - §3.1: bit-for-bit identical results independent of rank count, thread count, execution timing.
  - §3.2: component-level reproducibility mechanisms (deterministic seeding, contiguous block distribution, deterministic cut slots, rank-ordered allgatherv).
  - §3.3: floating-point considerations (allreduce Sum tree shape, OpenMP thread-local accumulation with fixed merge order).
  - §3.4: verification table (lower bound trace bit-for-bit, upper bound mean within ~1e-12, final cut pool bit-for-bit, policy output bit-for-bit).
- Backend-specific determinism properties documented so far:
  - `backend-local.md` §5: trivially satisfies all reproducibility requirements (single rank, no communication non-determinism).
  - `backend-tcp.md` §3.2: fixed rank-order sequential reduction (rank 0, 1, ..., R-1) -- stricter than MPI.
  - `backend-shm.md` §3.2: rank 0 performs reduction in fixed sequential order -- matches TCP's strictness.
  - `backend-ferrompi.md` §1.2: delegates to ferrompi, which uses MPI's implementation-defined reduction tree for allreduce Sum.
  - `communicator-trait.md` §2.1: rank-ordered receive postcondition for allgatherv.
  - `communicator-trait.md` §2.2: floating-point non-determinism disclaimer for allreduce Sum.
- Python multi-process path documented in `python-bindings.md` SS2.1a-SS2.1b (worker lifecycle), SS7.4 (multi-process architecture), SS7.5 (backend selection from Python).

## Specification

### Requirements

1. Append **§4 Determinism Verification** to `src/specs/hpc/backend-testing.md` (after §3, before `## Cross-References`).

2. **§4.1 Reproducibility Invariant**: Formally restate the invariant from `shared-memory-aggregation.md` §3.1 in the context of all backends. The invariant states:

   > Given the same inputs and random seed, Cobre produces bit-for-bit identical results regardless of: (a) the number of ranks, (b) the number of OpenMP threads per rank, (c) execution timing and OS scheduling.

   Specify which quantities are covered by "bit-for-bit identical":
   - Lower bound trace (exact, all backends).
   - Final cut pool coefficients (exact, all backends).
   - Policy output / FlatBuffers file (exact, all backends).
   - Convergence termination iteration number (exact, all backends -- if the lower bound trace is identical, the stopping criterion triggers at the same iteration).

   And which quantities are exempt:
   - Upper bound mean/variance (floating-point differences due to allreduce Sum tree shape -- applicable to ferrompi; TCP and shm produce identical upper bounds across runs because their reduction order is fixed).
   - Wall-clock timing metrics (non-deterministic by nature).
   - Per-rank timing breakdowns (non-deterministic by nature).

3. **§4.2 Per-Backend Determinism Properties**: Create a table documenting the determinism properties of each backend's collective operations:

   | Backend  | allgatherv                                           | allreduce Sum                                                                              | allreduce Min                           | broadcast             | barrier               |
   | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------- | --------------------- | --------------------- |
   | local    | Identity copy (deterministic)                        | Identity copy (deterministic)                                                              | Identity copy (deterministic)           | No-op (deterministic) | No-op (deterministic) |
   | tcp      | Rank-ordered assembly by coordinator (deterministic) | Fixed sequential reduction rank 0..R-1 (deterministic)                                     | Min is comparison-based (deterministic) | Deterministic         | Deterministic         |
   | shm      | Rank-ordered writes to shared buffer (deterministic) | Rank 0 reduces sequentially rank 0..R-1 (deterministic)                                    | Min is comparison-based (deterministic) | Deterministic         | Deterministic         |
   | ferrompi | Rank-ordered per MPI spec (deterministic)            | Implementation-defined tree shape (non-deterministic across MPI libraries and rank counts) | Min is comparison-based (deterministic) | Deterministic         | Deterministic         |

   The key insight: all four backends produce deterministic allgatherv results (rank-ordered). For allreduce, local/tcp/shm produce deterministic Sum results, but ferrompi may not (MPI spec allows implementation-defined reduction tree). Min is deterministic for all backends because it is comparison-based (no arithmetic, no associativity issue).

4. **§4.3 Determinism Test Matrix**: Define the test configurations that must be run to verify the reproducibility invariant. The matrix combines backends, rank counts, and thread counts:

   | Test ID | Backend  | Ranks | Threads/Rank  | Purpose                                                           |
   | ------- | -------- | ----- | ------------- | ----------------------------------------------------------------- |
   | D1      | local    | 1     | 1             | Baseline: single-rank, single-thread                              |
   | D2      | local    | 1     | 4             | Thread independence: same result with different thread count      |
   | D3      | shm      | 2     | 1             | Multi-rank: 2 ranks match single-rank result                      |
   | D4      | shm      | 4     | 1             | Rank scaling: 4 ranks match single-rank result                    |
   | D5      | shm      | 2     | 4             | Combined: multi-rank + multi-thread                               |
   | D6      | tcp      | 2     | 1             | TCP backend: 2 ranks match single-rank result                     |
   | D7      | tcp      | 4     | 1             | TCP rank scaling: 4 ranks match single-rank result                |
   | D8      | ferrompi | 2     | 1             | MPI backend: 2 ranks match single-rank on exact quantities        |
   | D9      | ferrompi | 4     | 2             | MPI combined: 4 ranks, 2 threads                                  |
   | D10     | ferrompi | 2     | 1 (run twice) | MPI reproducibility: same config run twice, bit-for-bit identical |

   For each test, specify:
   - Which reference result to compare against (D1 for all tests except D10, which compares two runs to itself).
   - Which quantities are compared bit-for-bit vs. with tolerance.
   - The tolerance for upper bound mean: `|ub_test - ub_ref| / |ub_ref| < 1e-12` for tcp/shm (deterministic reduction), no constraint for ferrompi vs local (different reduction tree).
   - Note: ferrompi tests D8/D9 may show upper bound differences vs D1 (local) due to MPI reduction tree shape. The lower bound, cut pool, and policy must still be bit-for-bit identical.

5. **§4.4 Python Multi-Process Determinism Tests**: Specify determinism tests that exercise the Python orchestration layer:
   - **Fork rejection test**: `start_method="fork"` + `num_workers=2` must raise `CobreError(kind="IncompatibleSettings")`. Reference: `python-bindings.md` SS2.1a step 1.
   - **Worker error propagation tests**:
     - Worker raises `CobreError` -> `WorkerError.inner` is populated with the original `CobreError`. Remaining workers are terminated (not left as zombie processes). Reference: `python-bindings.md` SS6.1a.
     - Worker crashes at OS level (e.g., SIGSEGV simulation) -> `WorkerError.inner` is `None`, `WorkerError.exit_code` is the signal-based exit code. Remaining workers are terminated.
   - **Determinism via Python API**: Run `cobre.train(num_workers=2, backend="shm")` twice with the same seed. Compare lower bound traces bit-for-bit. This tests that the Python spawn + Communicator creation + result collection path does not introduce non-determinism.
   - **Progress event multiplexing**: With `num_workers=2` and a `progress_callback`, verify that:
     - Both `worker_id=0` and `worker_id=1` events arrive.
     - Events from the same `worker_id` arrive in iteration order (iteration N before iteration N+1).
     - The total number of events equals `2 * num_iterations` (one per worker per iteration).
       Reference: `python-bindings.md` SS2.9 (`ProgressEvent.worker_id`).
   - **TCP auto-detection**: Set `COBRE_TCP_COORDINATOR=127.0.0.1:<port>` + `backend="auto"` + `num_workers=2`. Verify that the TCP backend is selected by checking `WorkerInfo.backend == "tcp"` on the returned `TrainingResult.workers` list. Reference: `python-bindings.md` SS7.5.

6. **§4.5 Extending the Reproducibility Invariant**: Specify how `shared-memory-aggregation.md` §3 should be cross-referenced from this document. The existing §3.1-§3.4 remain the authoritative statement of the invariant; §4 in `backend-testing.md` specifies the _verification_ of that invariant across all backends. Document this relationship explicitly with a note: "The reproducibility invariant is defined in [Shared Memory Aggregation §3.1](./shared-memory-aggregation.md). This section specifies the test matrix for verifying that invariant across all communication backends."

   Do NOT modify `shared-memory-aggregation.md` itself (additive-only rule; the existing invariant statement is sufficient and already generic).

7. Update the `## Cross-References` section at the end of `backend-testing.md` (created by ticket-017) to include the additional cross-references introduced by §4.

### Key Design Decisions

- **The reproducibility invariant from `shared-memory-aggregation.md` §3 is not duplicated or replaced.** §4 references it and specifies the _test matrix_ for verification. This avoids having two sources of truth for the invariant definition.
- **Upper bound tolerance is backend-dependent.** TCP and shm backends use fixed rank-order reduction, so their upper bound is deterministic given the same rank count. Ferrompi's upper bound may differ due to MPI's implementation-defined reduction tree. The test matrix captures this distinction.
- **Python tests use `cobre.train(num_workers=N)`, not manual per-rank invocations.** The learnings from Epic 04 explicitly state this: "Determinism tests: use `cobre.train(num_workers=N, backend='shm')` -- not manual per-rank env var invocations -- the library's auto-generation is the surface under test."
- **Fork rejection is a negative test, not an acceptance test.** It verifies that an incorrect configuration is detected and rejected with a clear error message, not that it somehow works.
- **D10 (run-twice reproducibility) is critical for ferrompi.** Since ferrompi delegates to the MPI implementation, we need to verify that the same MPI library produces the same results given the same inputs across runs. This catches MPI implementations that use non-deterministic collective algorithms.

### Inputs/Props

The determinism test matrix uses the reference test case defined in ticket-017's §2.1. No new test case is defined.

### Outputs/Behavior

The ticket appends §4 (and its subsections §4.1-§4.5) to the existing `src/specs/hpc/backend-testing.md` file and updates the `## Cross-References` section at the end of the file.

### Error Handling

§4.4 specifies error-path determinism tests:

- Fork rejection: `CobreError(kind="IncompatibleSettings")`.
- Worker error with inner exception: `WorkerError` with populated `.inner` (a `CobreError` subclass).
- Worker crash without inner exception: `WorkerError` with `.inner = None` and populated `.exit_code`.
- All error tests verify that remaining workers are terminated (no zombie processes).

## Acceptance Criteria

- [ ] `src/specs/hpc/backend-testing.md` contains §4 titled "Determinism Verification" with subsections §4.1 through §4.5.
- [ ] §4.1 restates the reproducibility invariant with explicit lists of bit-for-bit quantities and exempt quantities.
- [ ] §4.2 contains a per-backend determinism properties table covering all four backends and all five collective operations.
- [ ] §4.3 contains a determinism test matrix with at least 10 test configurations (D1-D10) covering all four backends, multiple rank counts (1, 2, 4), and multiple thread counts (1, 2, 4).
- [ ] §4.3 specifies which reference result each test compares against and which comparison mode (bit-for-bit vs tolerance) applies to each quantity.
- [ ] §4.4 contains Python multi-process determinism tests including: fork rejection, worker error propagation (with and without inner exception), run-twice reproducibility via `cobre.train(num_workers=2)`, progress event multiplexing verification, and TCP auto-detection verification.
- [ ] §4.5 contains a cross-reference note to `shared-memory-aggregation.md` §3.1 and explicitly states that §4 is the verification spec, not a replacement of the invariant definition.
- [ ] The `## Cross-References` section includes links to `shared-memory-aggregation.md`, `python-bindings.md`, and all backend specs.
- [ ] The only file modified is `src/specs/hpc/backend-testing.md` (appending §4 and updating cross-references).
- [ ] Given [the reference test case from §2.1], when [run with configurations D1 through D10], then [lower bound trace and policy output are bit-for-bit identical for all tests; upper bound mean is within tolerance for tcp/shm tests and unconstrained for ferrompi vs local comparisons].
- [ ] Given [`start_method="fork"` + `num_workers=2`], when [`cobre.train()` is called], then [`CobreError(kind="IncompatibleSettings")` is raised].

## Implementation Guide

### Suggested Approach

1. Open `src/specs/hpc/backend-testing.md` (created by ticket-017).
2. After §3 and before `## Cross-References`, insert `## 4. Determinism Verification`.
3. Write **§4.1 Reproducibility Invariant**:
   - Open with the cross-reference note to `shared-memory-aggregation.md` §3.1.
   - List the bit-for-bit quantities in a table.
   - List the exempt quantities with rationale.
4. Write **§4.2 Per-Backend Determinism Properties**:
   - Create the 5-column table (backend x operation).
   - Add prose explaining the key insight about allreduce Sum determinism.
5. Write **§4.3 Determinism Test Matrix**:
   - Create the test configuration table (D1-D10).
   - Add a comparison criteria table: for each test, which quantities are bit-for-bit vs tolerance vs unconstrained.
   - Add the tolerance formula: `|ub_test - ub_ref| / |ub_ref| < 1e-12`.
6. Write **§4.4 Python Multi-Process Determinism Tests**:
   - Fork rejection test.
   - Worker error propagation tests (two variants: with inner, without inner).
   - Run-twice reproducibility test.
   - Progress event multiplexing test.
   - TCP auto-detection test.
7. Write **§4.5 Extending the Reproducibility Invariant**:
   - Cross-reference note explaining the relationship between §3 of `shared-memory-aggregation.md` and §4 of `backend-testing.md`.
8. Update `## Cross-References` at the end of the file to include all new references.

### Key Files to Modify

- **Modify**: `src/specs/hpc/backend-testing.md` (append §4, update cross-references)

### Patterns to Follow

- Use `§` notation for all section references within the HPC spec directory.
- Use `SS` notation when referencing `python-bindings.md` sections (interfaces directory convention).
- Follow the table-heavy format used in §1-§3 (established by ticket-017).
- The determinism test matrix table follows the same format as the conformance test table from §1.
- Cross-reference the existing invariant rather than restating it (additive-only; avoid duplication).

### Pitfalls to Avoid

- Do NOT modify `shared-memory-aggregation.md`. The existing invariant in §3 is sufficient. §4 of `backend-testing.md` is the verification spec, not a replacement.
- Do NOT confuse interchangeability (§2, ticket-017) with determinism (§4, this ticket). Interchangeability = "backends produce the same results as each other." Determinism = "a single backend produces the same results across runs with different parallelism configurations."
- Do NOT specify a numeric tolerance for ferrompi upper bound vs local upper bound. The MPI reduction tree shape is implementation-defined; the upper bound difference is expected and unbounded by spec. Only lower bound, cut pool, and policy must match.
- Do NOT write `cobre.train(backend="shm", rank=0, size=2)` -- the Python multi-process API is `cobre.train(num_workers=2, backend="shm")` where the library handles rank assignment internally (SS2.1a).
- Do NOT include tests for `num_workers > 4`. The spec tests correctness, not scalability. Rank counts 1, 2, and 4 are sufficient for verifying the reproducibility invariant.

## Testing Requirements

### Review Checks

- §4.1 invariant statement is consistent with `shared-memory-aggregation.md` §3.1 (same quantities, same independence claims).
- §4.2 per-backend properties are consistent with the determinism notes in each backend spec.
- §4.3 test matrix covers all four backends with at least two rank count variations per multi-rank backend.
- §4.4 Python tests cover all handoff points identified in the Epic 04 learnings.
- §4.5 cross-reference note correctly states the relationship between the invariant definition and the verification spec.

### Consistency Checks

- The bit-for-bit quantities in §4.1 match those in `shared-memory-aggregation.md` §3.4 and in ticket-017's §2.3.
- The upper bound tolerance in §4.3 matches the `~1e-12 relative error` stated in `shared-memory-aggregation.md` §3.4 and `communicator-trait.md` §2.2.
- The Python API signatures in §4.4 match `python-bindings.md` SS2.1 (`cobre.train(num_workers=N, backend=...)`).
- The error types in §4.4 match `python-bindings.md` SS6.1a (`WorkerError.rank`, `.exit_code`, `.inner`) and SS6.2 (`CobreError` hierarchy).
- The progress event properties in §4.4 match `python-bindings.md` SS2.9 (`ProgressEvent.worker_id`).
- TCP auto-detection logic in §4.4 matches `python-bindings.md` SS7.5 (if `COBRE_TCP_COORDINATOR` set, select "tcp").

## Dependencies

- **Blocked By**: ticket-017 (§1-§3 must exist before §4 is appended; the reference test case from §2.1 is reused)
- **Blocks**: None (this is the final ticket in the plan)

## Effort Estimate

**Points**: 3
**Confidence**: High
