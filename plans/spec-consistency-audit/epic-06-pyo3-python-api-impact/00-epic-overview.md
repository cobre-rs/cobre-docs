# Epic 06: PyO3 Python API Spec Impact Assessment

## Goals

1. **Define the Python API surface** — Map each of the 7 existing Rust crates' public APIs to a Python interface design, covering case loading, SDDP training, simulation, result access, configuration, and validation.
2. **Assess impact on existing specs** — Identify which of the 50 existing spec documents contain assumptions incompatible with a Python embedding (MPI-only lifecycle, thread-local solver patterns, etc.) and document required changes.
3. **Draft the cobre-python specification outline** — Produce an outline specification for the new `cobre-python` crate, defining its purpose, public types, execution model, GIL strategy, and zero-copy data patterns.

## Scope

This epic is an **impact assessment and specification planning** exercise, not an implementation effort. No code is written. The deliverables are:

- A Python API surface document mapping Rust APIs to Python interfaces
- An impact report identifying which specs need modification
- An outline specification for the cobre-python crate

## Key Design Constraints

| Constraint             | Detail                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| No MPI in Python layer | ferrompi uses C MPI FFI; Python wrapper is single-process or uses mpi4py separately                                 |
| Memory management      | Thread-local solver workspaces use NUMA-aware allocation; Python needs GIL-compatible patterns                      |
| Zero-copy data         | PyO3 can expose NumPy arrays for scenario data and results                                                          |
| Serialization          | Policy persistence uses FlatBuffers; Python needs deserialization path                                              |
| Validation pipeline    | 5-layer validation should be accessible from Python                                                                 |
| New crate              | A `cobre-python` crate wrapping `cobre-sddp`, `cobre-stochastic`, `cobre-solver`, `cobre-io`, `cobre-core` via PyO3 |

## Tickets

| Ticket     | Title                                         | Detail Level |
| ---------- | --------------------------------------------- | ------------ |
| ticket-019 | Define Python API surface from existing specs | Outline      |
| ticket-020 | Assess impact on existing spec designs        | Outline      |
| ticket-021 | Draft cobre-python specification outline      | Outline      |

## Dependencies

- No hard dependencies on Epics 01-05
- Epic 06 tickets have internal ordering: ticket-019 informs ticket-020, both inform ticket-021
- Findings from Epic 01 (notation) and Epic 05 (organization) would improve the quality of the Python API spec

## Estimated Duration

2-3 weeks
