# Decision Log

This file records architectural and design decisions that affect two or more specification files. Each entry is assigned a unique `DEC-NNN` identifier and is cited by the relevant specs wherever the decision has observable consequences for behavior, data layout, or API contracts.

> **Status**: The decision summaries and affected specs below are drawn from citations in the specification corpus. Full rationale for each decision is pending documentation.

## Index

| ID                  | Decision Summary                                                                                                          | Status | Affected Specs                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| [DEC-001](#dec-001) | StageLpCache as LP construction baseline (one pre-assembled LP per stage in CSC format)                                   | Active | solver-abstraction, binary-formats                                                                   |
| [DEC-002](#dec-002) | `postcard` for MPI broadcast serialization of the `System` struct                                                         | Active | binary-formats, cross-reference-index                                                                |
| [DEC-003](#dec-003) | FlatBuffers for policy data persistence (cuts, states, vertices, checkpoint data)                                         | Active | binary-formats                                                                                       |
| [DEC-004](#dec-004) | Parquet for all tabular input data (entity registries, stage-varying overrides, time series)                              | Active | binary-formats, cross-reference-index                                                                |
| [DEC-005](#dec-005) | Compile-time solver selection via Cargo feature flags; exactly one solver active per binary                               | Active | solver-abstraction                                                                                   |
| [DEC-006](#dec-006) | `Box<dyn Trait>` rejected for all closed variant sets; enum dispatch for algorithm variants                               | Active | solver-interface-trait                                                                               |
| [DEC-007](#dec-007) | Selective cut addition baseline: only active cuts are loaded into the solver LP                                           | Active | solver-abstraction                                                                                   |
| [DEC-008](#dec-008) | LP scaling delegated to solver backend (`SolverAuto`); Cobre does not apply its own scaling                               | Active | solver-abstraction                                                                                   |
| [DEC-009](#dec-009) | 60 stages is the production-scale reference baseline for all capacity planning and performance targets                    | Active | production-scale-reference, communication-patterns, communicator-trait, backend-tcp, backend-testing |
| [DEC-010](#dec-010) | NUMA-interleaved allocation (`mbind(MPOL_INTERLEAVE)`) for the SharedRegion holding the StageLpCache                      | Active | memory-architecture                                                                                  |
| [DEC-011](#dec-011) | One MPI rank per NUMA domain is the recommended deployment model                                                          | Active | memory-architecture                                                                                  |
| [DEC-012](#dec-012) | 6-point GIL management contract; MPI prohibited from Python bindings for 3 independent reasons                            | Active | python-bindings                                                                                      |
| [DEC-013](#dec-013) | C API only for solver integration; no C++ solver APIs                                                                     | Active | design-principles                                                                                    |
| [DEC-014](#dec-014) | Enlarged `unsafe` boundary: all performance-critical memory operations interacting with solver data                       | Active | design-principles                                                                                    |
| [DEC-015](#dec-015) | `SolverError` hard-stop vs. proceed-with-partial mapping                                                                  | Active | solver-abstraction                                                                                   |
| [DEC-016](#dec-016) | Cut selection uses deferred parallel execution with DeactivationSet allgatherv and leader-only SharedRegion write         | Active | cut-selection-trait, cut-selection-testing, cut-management-impl, training-loop, synchronization      |
| [DEC-017](#dec-017) | Communication-free parallel noise generation via deterministic SipHash-1-3 seed derivation                                | Active | scenario-generation, sampling-scheme-trait                                                           |
| [DEC-018](#dec-018) | MPI/HPC parameters removed from config.json; all are auto-detected implementation details                                 | Active | configuration-reference, input-directory-structure                                                   |
| [DEC-019](#dec-019) | Rationale to be documented                                                                                                | Active | —                                                                                                    |
| [DEC-020](#dec-020) | Input file stores standardized AR coefficients and `residual_std_ratio`; runtime conversion to original-unit coefficients | Active | scenario-generation, input-scenarios                                                                 |

---

## Entries

### DEC-001 {#dec-001}

**Decision**: StageLpCache as LP construction baseline: one complete pre-assembled LP per stage in CSC format, loaded via `passModel`/`loadProblem`, replacing the previous per-thread memory model.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Solver Abstraction](../architecture/solver-abstraction.md), [Binary Formats](../data-model/binary-formats.md)

---

### DEC-002 {#dec-002}

**Decision**: `postcard` for MPI broadcast serialization of the `System` struct from rank 0 to all worker ranks. Replaces earlier `rkyv` decision.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Binary Formats](../data-model/binary-formats.md)

---

### DEC-003 {#dec-003}

**Decision**: FlatBuffers for policy data persistence (cuts, states, vertices, checkpoint data). Chosen for zero-copy deserialization and SIMD-friendly layout.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Binary Formats](../data-model/binary-formats.md)

---

### DEC-004 {#dec-004}

**Decision**: Parquet for all tabular input data (entity registries, stage-varying overrides, time series, scenario parameters).

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Binary Formats](../data-model/binary-formats.md)

---

### DEC-005 {#dec-005}

**Decision**: Compile-time solver selection via Cargo feature flags; exactly one solver active per binary; HiGHS and CLP are first-class reference implementations.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Solver Abstraction](../architecture/solver-abstraction.md)

---

### DEC-006 {#dec-006}

**Decision**: `Box<dyn Trait>` rejected for all closed variant sets. Enum dispatch used for algorithm variants (`RiskMeasure`, `HorizonMode`, `SamplingScheme`, `CutSelectionStrategy`, `StoppingRuleSet`). Compile-time monomorphization reserved for FFI-wrapping traits.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Solver Interface Trait](../architecture/solver-interface-trait.md)

---

### DEC-007 {#dec-007}

**Decision**: Selective cut addition is the baseline for cut loading: only active cuts are loaded into the solver LP; no inactive rows are parked in the LP.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Solver Abstraction](../architecture/solver-abstraction.md)

---

### DEC-008 {#dec-008}

**Decision**: LP scaling delegated to the solver backend (`SolverAuto`); Cobre does not apply its own scaling in the minimal viable solver.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Solver Abstraction](../architecture/solver-abstraction.md)

---

### DEC-009 {#dec-009}

**Decision**: 60 stages is the production-scale reference baseline for all capacity planning, memory budgets, and performance targets across the corpus. References to 120 stages in individual specs are explicitly labeled as "worst-case" or "hypothetical maximum."

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Production Scale Reference](./production-scale-reference.md), [Communication Patterns](../hpc/communication-patterns.md), [Communicator Trait](../hpc/communicator-trait.md), [TCP Backend](../hpc/backend-tcp.md), [Backend Testing](../hpc/backend-testing.md)

---

### DEC-010 {#dec-010}

**Decision**: NUMA-interleaved allocation (`mbind(MPOL_INTERLEAVE)`) for the SharedRegion holding the StageLpCache. Distributes pages round-robin across all NUMA domains.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Memory Architecture](../hpc/memory-architecture.md)

---

### DEC-011 {#dec-011}

**Decision**: One MPI rank per NUMA domain is the recommended deployment model; confines each Rayon thread pool to a single NUMA domain.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Memory Architecture](../hpc/memory-architecture.md)

---

### DEC-012 {#dec-012}

**Decision**: 6-point GIL management contract governs the Python/Rust boundary. MPI is prohibited from Python bindings for 3 independent reasons: `MPI_Init_thread` timing conflict, GIL vs `MPI_THREAD_MULTIPLE` deadlock risk, and dual-FFI-layer fragility.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Python Bindings](../interfaces/python-bindings.md)

---

### DEC-013 {#dec-013}

**Decision**: C API only for solver integration; Cobre does not use C++ solver APIs to maintain Rust FFI compatibility and cross-solver portability.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Design Principles](./design-principles.md)

---

### DEC-014 {#dec-014}

**Decision**: Enlarged `unsafe` boundary: all performance-critical memory operations interacting with solver data are `unsafe`, not just FFI call sites.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Design Principles](./design-principles.md)

---

### DEC-015 {#dec-015}

**Decision**: `SolverError` hard-stop vs. proceed-with-partial mapping. `Infeasible`, `Unbounded`, `InternalError` are hard-stops; `NumericalDifficulty`, `TimeLimitExceeded`, `IterationLimit` permit partial results.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Solver Abstraction](../architecture/solver-abstraction.md)

---

### DEC-016 {#dec-016}

**Decision**: Cut selection uses deferred parallel execution — stages distributed across ranks and threads, with DeactivationSet allgatherv and leader-only SharedRegion write.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Cut Selection Strategy Trait](../architecture/cut-selection-trait.md), [Cut Selection Testing](../architecture/cut-selection-testing.md), [Cut Management Implementation](../architecture/cut-management-impl.md), [Training Loop](../architecture/training-loop.md), [Synchronization](../hpc/synchronization.md)

---

### DEC-017 {#dec-017}

**Decision**: Communication-free parallel noise generation — every rank and thread independently derives identical noise via deterministic SipHash-1-3 seed derivation, eliminating MPI broadcast or gather for scenario noise.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Scenario Generation](../architecture/scenario-generation.md), [Sampling Scheme Trait](../architecture/sampling-scheme-trait.md)

---

### DEC-018 {#dec-018}

**Decision**: MPI/HPC parameters removed from `config.json` — all are auto-detected implementation details or contradicted by approved architecture.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Configuration Reference](../configuration/configuration-reference.md), [Input Directory Structure](../data-model/input-directory-structure.md)

---

### DEC-019 {#dec-019}

**Decision**: Reserved. No decision recorded.

**Status**: Void

---

### DEC-020 {#dec-020}

**Decision**: The input file stores standardized AR coefficients (`ψ*`, the direct Yule-Walker output) and `residual_std_ratio` — not original-unit coefficients and not `σ_m` directly. Runtime conversion to original-unit coefficients uses conditioning stats. This separates swappable seasonal conditioning from fixed model dynamics.

**Status**: Active

**Rationale to be documented.**

**Affected specs**: [Scenario Generation](../architecture/scenario-generation.md), [Input Scenarios](../data-model/input-scenarios.md)
