# Epic 05 Learnings: Testing and Determinism Verification Specification

**Plan**: communication-backend-abstraction
**Epic**: epic-05-testing-determinism-spec
**Tickets**: ticket-017, ticket-018
**Updated**: 2026-02-25

---

## Patterns That Worked Well

### Two-ticket split: conformance foundation first, determinism extension second

Splitting the testing spec into (1) conformance + interchangeability + performance (ticket-017) and (2) determinism verification (ticket-018) worked cleanly because ticket-018 explicitly reused the reference test case from §2.1 rather than defining a new one. The sequential dependency was correct: §4 of `backend-testing.md` references §2.1's reference case properties and the comparison criteria from §2.3 without redundancy. This split avoided a single overloaded ticket and kept each section's concerns separate.
Observable at: `src/specs/hpc/backend-testing.md` §2.1 (reference case) and §4.3 (reuse note: "The determinism tests use the same reference test case defined in §2.1").

### Test naming convention as a single-line anchor

Establishing `test_{backend}_{method}_{scenario}` as the naming convention at the top of §1 meant that every table row in §1.1–§1.7 could use `{backend}` as a placeholder, keeping tables backend-agnostic. Future implementors parameterize the name by substituting `local`, `ferrompi`, `tcp`, or `shm`. This avoids duplicating rows per backend in the conformance table while remaining unambiguous.
Observable at: `src/specs/hpc/backend-testing.md` §1 (test naming convention paragraph) and all subsection tables in §1.1–§1.7.

### Per-backend notes subsection separates what from how

The §1.9 backend-specific conformance notes section captured behavioral differences (local: infallible; ferrompi: delegated validation; tcp: `mpi_error_code=0`; shm: two-barrier implicit test) without scattering those caveats into every error-case table row. Each notes entry cross-references the upstream backend spec for rationale, keeping the testing spec additive rather than duplicating backend behavior documentation.
Observable at: `src/specs/hpc/backend-testing.md` §1.9.1–§1.9.4.

### Interchangeability vs. determinism distinction made explicit in §4 intro

The §4 introduction explicitly distinguishes the two properties: "While the interchangeability tests (§2) verify that swapping backends produces equivalent results, the determinism tests verify a stronger property: that the same backend produces bit-for-bit identical results across different rank counts, thread counts, and repeated executions." This sentence prevented the two concepts from collapsing into each other across both tickets. It became the anchor that ticket-018's implementation guide explicitly listed under "Pitfalls to Avoid."
Observable at: `src/specs/hpc/backend-testing.md` §4 (opening paragraph).

### D10 (run-twice ferrompi) tests MPI library determinism, not just implementation correctness

Including a run-twice reproducibility test (D10) for ferrompi specifically addressed the risk that MPI implementations use non-deterministic collective algorithms. The test matrix makes a clean distinction: D8/D9 compare ferrompi vs. local (upper bound unconstrained), while D10 compares ferrompi vs. itself (all quantities bit-for-bit). This distinction is non-obvious without the test matrix's comparison-mode table.
Observable at: `src/specs/hpc/backend-testing.md` §4.3 (D10 row and the "Notes on comparison modes" D10 paragraph).

### Python test coverage in §4.4 directly consumed the Epic 04 handoff notes

Every item in the Epic 04 Recommendations for Epic 05 section was addressed in §4.4: fork rejection (§4.4.1), both `WorkerError` propagation variants (§4.4.2 A and B), run-twice reproducibility via `cobre.train()` (§4.4.3), `ProgressEvent.worker_id` multiplexing (§4.4.4), and TCP auto-detection via `COBRE_TCP_COORDINATOR` (§4.4.5). The handoff notes were specific enough to map 1:1 to spec subsections.
Observable at: `src/specs/hpc/backend-testing.md` §4.4.1–§4.4.5 and `plans/communication-backend-abstraction/epic-04-python-multiprocess-spec/learnings.md` (Recommendations for Epic 05).

---

## Pitfalls Encountered

### Spec defines requirements, not test code — distinction requires active enforcement

The ticket explicitly listed "Do NOT write executable test code" as a pitfall. This distinction is easy to blur when writing conformance tables: the natural impulse is to write Rust-like pseudocode. The spec consistently used English prose for the "Expected Observable Behavior" column and avoided `assert_eq!` or similar constructs. Future testing spec tickets must reinforce this separation in their pitfalls sections.
Documented in: `plans/communication-backend-abstraction/epic-05-testing-determinism-spec/ticket-017-specify-backend-conformance-testing.md` (Pitfalls to Avoid).

### CommError::AllocationFailed semantics differ by backend class (HeapFallback vs. true shared memory)

The `test_{backend}_shared_region_excessive_size` test (§1.8.5) must distinguish between backends that return `CommError::AllocationFailed` (ferrompi, shm — true shared memory with bounded allocation) and HeapFallback backends (local, TCP) that follow Rust's standard OOM abort behavior. This distinction was captured in the test's "Expected Observable Behavior" cell, citing `communicator-trait.md §4.6`. Missing this nuance would have made the test incorrect for HeapFallback backends.
Observable at: `src/specs/hpc/backend-testing.md` §1.8.5.

### Upper bound tolerance is backend-dependent, not uniformly ~1e-12

The first reading of the interchangeability criteria might suggest a single `~1e-12 relative error` tolerance for all backends. The spec distinguishes: TCP and shm produce bit-for-bit identical upper bounds (fixed rank-order reduction), while ferrompi vs. local comparisons are unconstrained for upper bound (different reduction tree shape). The `§2.3` comparison criteria table and `§4.3` comparison-mode notes both reinforce this. A single-tolerance statement would have been technically incorrect.
Observable at: `src/specs/hpc/backend-testing.md` §2.3 (upper bound row) and §4.3 (D6–D7 notes vs. D8–D9 notes).

### `SharedMemoryProvider` lifecycle tests cover `HeapFallback` differently

The `test_{backend}_shared_region_is_leader` and `test_{backend}_split_local_rank_size` tests (§1.7) have backend-specific expected behavior: for ferrompi and shm, `is_leader()` returns `true` for exactly one rank; for local and TCP (HeapFallback), `is_leader()` always returns `true` on all ranks. This difference was captured in the Expected Observable Behavior cells rather than in a separate backend-notes subsection, because it is essential to interpreting test pass/fail. Ticket-017 explicitly referenced `communicator-trait.md §4.4` as the source of this behavior.
Observable at: `src/specs/hpc/backend-testing.md` §1.7.

---

## Conventions Established

### Testing spec document structure: §1 Conformance, §2 Interchangeability, §3 Performance, §4 Determinism

The four-section structure of `backend-testing.md` establishes the canonical pattern for future testing specification documents in this codebase. The structure mirrors the concerns of the plan: contract verification (§1), semantic equivalence (§2), overhead proof (§3), reproducibility (§4). Any future `*-testing.md` spec should follow this structure unless there is a documented reason to deviate.
Observable at: `src/specs/hpc/backend-testing.md` (top-level section list).

### Compound conformance test captures multi-operation sequencing

§1.6 (`test_{backend}_collective_sequence`) establishes the pattern of a compound test that verifies collective interleaving — not just individual method correctness. This is necessary because the SDDP training loop interleaves `allgatherv`, `allreduce`, and `barrier` across iterations, and a backend that passes individual method tests can still fail due to shared-buffer state corruption between operations. Future backend testing specs should include at least one compound sequencing test.
Observable at: `src/specs/hpc/backend-testing.md` §1.6.

### Error-case tests organized by CommError variant (not by method)

§1.8 organizes error-case tests by `CommError` variant rather than by method. This structure makes it easy to verify that all variants are covered and to understand the backend-specific behavior for each variant. The alternative (error cases appended to each method subsection) would have scattered backend-specific notes and made it harder to see which variants are covered.
Observable at: `src/specs/hpc/backend-testing.md` §1.8.1–§1.8.5.

### Determinism test matrix D-ID format for referencing test configurations

The `D1`–`D10` test ID notation in §4.3 provides stable, short identifiers for referencing specific configurations in prose. The "Notes on comparison modes" section that follows the matrix table uses D-IDs to group backends by comparison method (D2–D5 for local/shm, D6–D7 for tcp, D8–D9 for ferrompi vs. local, D10 for ferrompi self-comparison). This notation should be used in future determinism verification specs when a test matrix is needed.
Observable at: `src/specs/hpc/backend-testing.md` §4.3.

### §4.5 relationship note: "verification spec, not a replacement of invariant definition"

When a testing spec specifies how to verify a property that is defined in another document, §4.5 establishes the pattern: explicitly state that the invariant is defined elsewhere, cite the authoritative sections, and state that this section provides only the verification plan. This prevents the testing spec from becoming a second source of truth for the invariant definition and eliminates the need to modify the defining document.
Observable at: `src/specs/hpc/backend-testing.md` §4.5.

---

## Cross-Reference Inventory

The following cross-references were newly established in `src/specs/hpc/backend-testing.md`. Any future modification to the target files must verify that these references remain valid.

### Outgoing references from `backend-testing.md`

| From Section | Target                         | Section Referenced           |
| ------------ | ------------------------------ | ---------------------------- |
| §1.1 (table) | `communicator-trait.md`        | §2.1 (allgatherv contract)   |
| §1.2 (table) | `communicator-trait.md`        | §2.2 (allreduce contract)    |
| §1.2 (table) | `backend-local.md`             | §2.1 (identity semantics)    |
| §1.3 (table) | `communicator-trait.md`        | §2.3 (broadcast contract)    |
| §1.4 (table) | `communicator-trait.md`        | §2.4 (barrier contract)      |
| §1.4 (table) | `backend-shm.md`               | §1.4 (generation counter)    |
| §1.5 (table) | `communicator-trait.md`        | §2.5 (rank/size contract)    |
| §1.6 (table) | `backend-shm.md`               | §3.5 (collective_seq)        |
| §1.7 (table) | `communicator-trait.md`        | §4 (SharedMemoryProvider)    |
| §1.7 (table) | `communicator-trait.md`        | §4.2 (lifecycle)             |
| §1.7 (table) | `communicator-trait.md`        | §4.4 (HeapFallback)          |
| §1.8.1       | `communicator-trait.md`        | §2.2 (precondition)          |
| §1.8.2       | `communicator-trait.md`        | §1.4 (CommError variants)    |
| §1.8.3       | `backend-tcp.md`               | §5.3 (mpi_error_code=0)      |
| §1.8.3       | `backend-shm.md`               | §1.4 (generation counter)    |
| §1.8.4       | `communicator-trait.md`        | §1.4 (InvalidCommunicator)   |
| §1.8.5       | `communicator-trait.md`        | §4.6 (AllocationFailed)      |
| §1.9.1       | `backend-local.md`             | §1.2 (infallibility)         |
| §1.9.2       | `backend-ferrompi.md`          | §1.2 (delegated checks)      |
| §1.9.2       | `backend-ferrompi.md`          | §5.2 (error conversion)      |
| §1.9.3       | `backend-tcp.md`               | §5.3 (mpi_error_code=0)      |
| §1.9.4       | `backend-shm.md`               | §3.2 (two-barrier allreduce) |
| §2.3         | `shared-memory-aggregation.md` | §3.4 (verification criteria) |
| §2.3         | `communicator-trait.md`        | §2.2 (FP non-determinism)    |
| §2.4         | `python-bindings.md`           | SS2.1a (worker lifecycle)    |
| §2.4         | `python-bindings.md`           | SS2.7 (WorkerInfo)           |
| §2.4         | `python-bindings.md`           | SS6.1a (WorkerError)         |
| §3.1         | `backend-selection.md`         | §1.4 (monomorphization)      |
| §3.1         | `backend-ferrompi.md`          | §4.1 (zero-cost abstraction) |
| §3.2 (table) | `communication-patterns.md`    | §3.1 (587 MB/iteration)      |
| §4.1         | `shared-memory-aggregation.md` | §3.1 (invariant definition)  |
| §4.1         | `shared-memory-aggregation.md` | §3.2 (mechanisms)            |
| §4.2         | `backend-local.md`             | §5 (determinism)             |
| §4.2         | `backend-tcp.md`               | §3.2 (fixed reduction order) |
| §4.2         | `backend-shm.md`               | §3.2 (rank 0 reduction)      |
| §4.2         | `communicator-trait.md`        | §2.2 (MPI tree shape)        |
| §4.4.1       | `python-bindings.md`           | SS2.1a (fork rejection)      |
| §4.4.2       | `python-bindings.md`           | SS6.1a (WorkerError props)   |
| §4.4.4       | `python-bindings.md`           | SS2.9 (ProgressEvent)        |
| §4.4.5       | `python-bindings.md`           | SS7.5 (TCP auto-detection)   |
| §4.5         | `shared-memory-aggregation.md` | §3.1–§3.4 (full invariant)   |

### No existing files were modified

`backend-testing.md` is an entirely new file. No existing spec files were modified by this epic. All cross-references are outgoing from the new file only.

---

## Plan Completion Notes

Epic 05 is the final epic of the communication-backend-abstraction plan. The plan produced the following deliverables across all five epics:

### Epic 01 — Communicator Trait and Backend Selection

- `src/specs/hpc/communicator-trait.md` — Full trait contract with method preconditions, postconditions, `CommError`, and `SharedMemoryProvider`
- `src/specs/hpc/backend-selection.md` — Two-level selection (feature flags + env var), `CommBackend` enum, factory, `BackendError`
- `src/crates/comm.md` — Crate spec with public API, dependency graph, feature matrix

### Epic 02 — Backend Implementation Specifications

- `src/specs/hpc/backend-ferrompi.md` — Zero-cost delegation, MPI error mapping, persistent collectives
- `src/specs/hpc/backend-local.md` — ZST, identity/no-op semantics, `HeapRegion<T>` definition
- `src/specs/hpc/backend-tcp.md` — Coordinator pattern, handshake, wire format (10 operation tags), failure detection
- `src/specs/hpc/backend-shm.md` — POSIX shm, `ControlRegion`, two-barrier allreduce, generation counter

### Epic 03 — Spec Refactoring

- `hybrid-parallelism.md`, `communication-patterns.md`, `training-loop.md`, `synchronization.md`, `work-distribution.md`, `shared-memory-aggregation.md` — All refactored to use `Communicator` trait terminology
- `src/crates/overview.md`, `src/SUMMARY.md`, `src/specs/cross-reference-index.md` — Updated for the six new HPC specs

### Epic 04 — Python Multi-Process Execution Specification

- `src/specs/interfaces/python-bindings.md` — Extended with SS1.2a, SS2.1a/b, SS2.7, SS2.9, SS3.2a, SS6.1a, SS7.1–SS7.5
- `src/specs/interfaces/mcp-server.md` — SS1.1a future capability note added

### Epic 05 — Testing and Determinism Verification

- `src/specs/hpc/backend-testing.md` — Complete testing specification: §1 conformance suite, §2 interchangeability tests, §3 performance regression tests, §4 determinism verification

### Architectural invariants validated across all five epics

1. **Zero-cost abstraction**: `train<C: Communicator>` compiles to direct calls with no dynamic dispatch overhead (enforced in §3.1 as a < 1% overhead threshold)
2. **Reproducibility**: bit-for-bit identical lower bound, cut pool, policy, and convergence iteration across all backends and parallelism configurations (formalized in §4.1 and tested in D1–D10)
3. **Interchangeability**: swapping backends produces equivalent SDDP results (verified in §2 comparison matrix)
4. **Additive-only**: no existing spec sections were deleted or renumbered in any epic; all additions used lettered subsections or new top-level sections appended after existing content
5. **Single source of truth**: `shared-memory-aggregation.md §3` remains the authoritative reproducibility invariant; `backend-testing.md §4` is only the verification plan
