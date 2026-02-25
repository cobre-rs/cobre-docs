# ticket-024 Write python-bindings.md Spec

## Context

### Background

Epic 06 produced a comprehensive Python bindings assessment (findings-020 SS2) covering the crate-by-crate API surface, the GIL/MPI incompatibility analysis (the most architecturally significant finding), zero-copy data paths, and FlatBuffers policy access. The architecture document (architecture-021.md SS2.2) defines the `cobre-python` crate's responsibility boundaries, and SS5.3 defines the exact scope for this spec. The GIL contract (5-point invariant from findings-020 SS2.2) and the single-process-only execution mode are non-negotiable hard constraints (architecture-021.md SS6.3).

### Relation to Epic

This is one of three interface layer specs (alongside ticket-023 and ticket-025) that can proceed in parallel once ticket-022 (structured output) is complete. The Python bindings spec depends on the structured output spec because Python exceptions map to the same error kinds defined in the structured output error registry. ticket-026 depends on this spec for cross-reference integration and new crate documentation.

### Current State

- No file exists at `src/specs/interfaces/python-bindings.md` and the `src/specs/interfaces/` directory does not exist yet (ticket-022 creates it).
- `findings-020.md` SS2.1 defines the per-crate Python API mapping tables for cobre-core, cobre-io, cobre-stochastic, cobre-sddp, cobre-solver (not exposed), and ferrompi (not exposed).
- `findings-020.md` SS2.2 contains the three-part GIL analysis (MPI coexistence: No; thread-local workspaces: Safe; recommended execution mode: Single-process).
- `findings-020.md` SS2.3 defines 6 zero-copy data paths with Rust type -> Python type -> mechanism.
- `findings-020.md` SS2.4 defines FlatBuffers policy access patterns (summary, cuts, raw bytes, comparison).
- `findings-020.md` SS2.5 confirms: no MPI from Python, `cobre-python` MUST NOT depend on ferrompi.
- `architecture-021.md` SS2.2 provides the crate responsibility table, Python API surface table, and the 5-point GIL contract.
- `architecture-021.md` SS6.1 Q-4 documents the open assumption about async support: optional, using `run_in_executor`.
- `architecture-021.md` SS6.3 lists 5 hard constraints from GIL/MPI analysis.
- The `$\gamma$ overloading` issue (FPHA coefficients vs pumping power rate) from learnings may affect parameter naming.

## Specification

### Requirements

Create the file `src/specs/interfaces/python-bindings.md` containing a complete, implementation-ready specification for the Cobre Python bindings. The spec must cover all seven areas defined in architecture-021.md SS5.3:

1. **Python API surface** -- Complete function/class signatures for all public APIs exposed from each source crate, per findings-020 SS2.1:
   - **cobre-core**: Read-only entity objects (`HydroPlant`, `ThermalUnit`, `Bus`, `Line`, etc.), topology data, PAR parameters as NumPy arrays
   - **cobre-io**: `CaseLoader.load(path)` returning `Case` object, `validate(path)` returning `ValidationResult`
   - **cobre-stochastic**: `PARModel` class, `sample_noise()` function, `OpeningTree` read-only object, `load_external_scenarios(path)`
   - **cobre-sddp**: `train(case, config_overrides=None)` returning `TrainingResult`, `simulate(case, policy, config_overrides=None)` returning `SimulationResult`, `Policy` class with `cuts(stage)`, `summary()`, `evaluate(state)` methods

   Include Python type annotations (`-> TrainingResult`, `case: Case`, etc.) for all signatures. Document which parameters are required vs optional.

2. **GIL management contract** -- The 5-point GIL contract from findings-020 SS2.2 / architecture-021.md SS2.2, reproduced verbatim:
   1. GIL acquired to receive Python call and validate arguments
   2. GIL released via `py.allow_threads()` before entering Rust computation
   3. No Rust thread within an OpenMP parallel region ever acquires the GIL
   4. GIL reacquired to convert results to Python objects on return
   5. No Python callbacks into the hot loop (all customization via configuration)

   Include a timing diagram or sequence description showing GIL state transitions during a `train()` call.

3. **Zero-copy data paths** -- All 6 zero-copy mechanisms from findings-020 SS2.3:
   - Scenario noise vectors: `Vec<f64>` -> `numpy.ndarray` via PyO3 numpy crate
   - Opening tree: 3D contiguous array -> `numpy.ndarray` shape `(O, S, E)`
   - Convergence history: `Vec<ConvergenceRecord>` -> `pyarrow.Table` via Arrow FFI
   - Simulation results: Parquet files on disk -> `polars.DataFrame` or `pyarrow.Table` (Python reads directly)
   - Cut coefficients: `Vec<f64>` per stage -> `numpy.ndarray`
   - PAR parameters: Contiguous f64 arrays -> `numpy.ndarray`

   Document which data types use zero-copy and which require conversion.

4. **Execution mode specification** -- Single-process only, no MPI, OpenMP threads. The explicit prohibition on MPI from Python with the three-layer rationale from findings-020 SS2.2:
   - `MPI_Init_thread` timing conflict
   - GIL vs `MPI_THREAD_MULTIPLE` deadlock risk
   - Dual-FFI-layer fragility (mpi4py + ferrompi)

   Document the recommended workflow for users needing distributed execution: Python prepares case -> subprocess `mpiexec cobre` -> Python reads Parquet results.

5. **Error handling** -- Python exception hierarchy mapping from Rust error kinds. Define exception classes:
   - `cobre.CobreError` (base)
   - `cobre.ValidationError` (from the 14 validation error kinds)
   - `cobre.SolverError` (from `SolverFailure` kind)
   - `cobre.IOError` (from `OutputCorrupted`, `OutputNotFound` kinds)

   Each exception carries the structured error fields (`kind`, `message`, `context`, `suggestion`) from the structured-output.md error schema.

6. **Async support** -- Document the recommended approach (`asyncio.get_event_loop().run_in_executor()` wrapper) per Q-4 resolution. Mark as optional in the spec. Describe `train_async()` and `simulate_async()` wrapper signatures if provided.

7. **FlatBuffers policy access** -- Python API for policy inspection per findings-020 SS2.4:
   - `Policy.summary()` -> dict (cut counts, state dimension)
   - `Policy.cuts(stage)` -> dict with `intercepts: numpy.ndarray`, `coefficients: numpy.ndarray`
   - `Policy.evaluate(state)` -> float (FCF value at given state vector)
   - No direct FlatBuffers exposure to Python users

### Inputs/Props

| Source Document                     | Relevant Sections                   | What to Extract                           |
| ----------------------------------- | ----------------------------------- | ----------------------------------------- |
| `findings-020.md`                   | SS2.1 (per-crate mapping, 6 tables) | API surface for each crate                |
| `findings-020.md`                   | SS2.2 (GIL analysis, 3 parts)       | GIL contract, MPI prohibition rationale   |
| `findings-020.md`                   | SS2.3 (zero-copy, 6 paths)          | Data type mapping table                   |
| `findings-020.md`                   | SS2.4 (FlatBuffers access)          | Policy access patterns                    |
| `findings-020.md`                   | SS2.5 (MPI recommendation)          | Single-process justification              |
| `architecture-021.md`               | SS2.2 (cobre-python boundaries)     | Crate type, execution mode, module name   |
| `architecture-021.md`               | SS5.3 (scope definition)            | Must-contain, must-NOT-contain boundaries |
| `architecture-021.md`               | SS6.1 Q-4                           | Async support assumption                  |
| `architecture-021.md`               | SS6.3 (hard constraints)            | 5 non-negotiable GIL/MPI constraints      |
| `structured-output.md` (ticket-022) | Error schema, error kind registry   | Exception hierarchy mapping               |

### Outputs/Behavior

A single markdown file at `src/specs/interfaces/python-bindings.md` that:

- Follows the style and depth of existing architecture specs
- Contains complete Python API signatures with type annotations for all public classes and functions
- Contains the 5-point GIL contract reproduced verbatim
- Contains the zero-copy data path table with mechanism details
- Contains the three-layer MPI prohibition rationale
- Is self-contained enough for a developer to implement the PyO3 bindings without reading the assessment documents

### Error Handling

- The spec must define which Python exceptions map to which Rust error kinds
- The spec must define what happens when GIL release fails (should never happen with correct PyO3 usage; document as a programming error)
- The spec must define behavior on OpenMP thread panic during GIL-released computation: the panic is caught at the Rust boundary and translated to a Python `CobreError` exception

## Acceptance Criteria

- [ ] Given the file `src/specs/interfaces/python-bindings.md` does not exist, when the ticket is completed, then the file exists with complete content
- [ ] Given the spec exists, when reading the API surface section, then all public classes and functions from cobre-core, cobre-io, cobre-stochastic, and cobre-sddp have Python signatures with type annotations
- [ ] Given the spec exists, when reading the GIL section, then the 5-point contract is present verbatim with timing diagram
- [ ] Given the spec exists, when reading the zero-copy section, then all 6 data paths are documented with Rust type, Python type, and mechanism
- [ ] Given the spec exists, when reading the execution mode section, then single-process-only is stated, MPI prohibition rationale includes all 3 layers, and the subprocess workflow is documented
- [ ] Given the spec exists, when reading the error handling section, then the exception hierarchy is defined with mappings to error kinds from structured-output.md
- [ ] Given the spec exists, when reading the async section, then `train_async()` and `simulate_async()` are documented as optional with `run_in_executor` mechanism
- [ ] Given the spec exists, when reading the FlatBuffers section, then `Policy.summary()`, `Policy.cuts(stage)`, and `Policy.evaluate(state)` are defined with return types
- [ ] Given the spec exists, when checking cross-references, then it references: `structured-output.md`, `convergence-monitoring.md` SS2.4, `architecture-021.md` SS2.2 and SS6.3, `hybrid-parallelism.md`, `memory-architecture.md`
- [ ] Given the spec exists, when checking must-NOT-contain boundaries, then it does NOT contain CLI protocol details, MCP protocol definitions, or TUI rendering specifications
- [ ] Given `mdbook build` is run from the repo root, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Verify `src/specs/interfaces/` directory exists (ticket-022 creates it; if running in parallel, create it if absent).
2. Create `src/specs/interfaces/python-bindings.md` with the following section structure:
   - **Purpose** -- 1-paragraph summary: PyO3-based Python module for programmatic Cobre access
   - **1. Module Structure** -- `import cobre` top-level, submodules, module name (`cobre`)
   - **2. Python API Surface** -- Subsection per source crate (SS2.1 core, SS2.2 io, SS2.3 stochastic, SS2.4 sddp) with class/function signatures in Python syntax
   - **3. GIL Management Contract** -- The 5-point invariant, timing diagram, `py.allow_threads()` pattern
   - **4. Zero-Copy Data Paths** -- Table of 6 paths, per-path mechanism details, which require conversion vs zero-copy
   - **5. Execution Mode** -- Single-process only, MPI prohibition with 3-layer rationale, subprocess workflow for distributed execution
   - **6. Error Handling** -- Exception hierarchy, kind-to-exception mapping table, structured error field access
   - **7. Async Support** -- Optional `train_async()`/`simulate_async()` with `run_in_executor`, marked as OPTIONAL
   - **8. FlatBuffers Policy Access** -- `Policy` class methods, return types, no FlatBuffers internals exposed
   - **9. Build System** -- maturin build, wheel distribution, platform support (Linux, macOS; Windows optional)
   - **10. Crate Architecture** -- `cobre-python` as `cdylib`, dependency graph, no ferrompi dependency
   - **Cross-References** -- Links to source specs

3. For API signatures, use Python stub file (`.pyi`) syntax for clarity. Include both the function signature and a brief docstring for each public API.
4. For the GIL timing diagram, use a simple ASCII timeline showing: Python call -> GIL held (validation) -> GIL released (Rust computation) -> GIL reacquired (result conversion) -> Python return.

### Key Files to Modify

| File                                      | Action                                 |
| ----------------------------------------- | -------------------------------------- |
| `src/specs/interfaces/python-bindings.md` | **CREATE** -- The entire spec document |

No existing files are modified by this ticket.

### Patterns to Follow

- **Spec structure pattern**: Follow `convergence-monitoring.md` for Purpose + numbered sections + cross-references
- **API signature pattern**: Use Python type hint syntax (`def train(case: Case, config_overrides: dict | None = None) -> TrainingResult`)
- **Constraint documentation pattern**: Follow `architecture-021.md` SS6.3 for the hard constraint list format
- **Forward reference pattern**: Use `(planned)` annotation for references to specs not yet written

### Pitfalls to Avoid

- Do NOT expose `cobre-solver` internals to Python -- findings-020 SS2.1 cobre-solver table explicitly recommends against it
- Do NOT expose `ferrompi` to Python -- hard constraint C-10 from findings-020 SS6.2
- Do NOT propose Python callbacks into the SDDP hot loop -- hard constraint #5 from architecture-021.md SS6.3
- Do NOT define MCP protocol details or CLI structured output protocol
- Do NOT use the outline ticket's class names (`cobre.Study`, `cobre.Results`, `cobre.Config`, `cobre.Validator`) without checking against the assessment; findings-020 SS2.1 uses `train()` / `simulate()` functions and `CaseLoader` / `Policy` / `PARModel` classes
- Be aware of the `$\gamma$` overloading issue (learnings): FPHA coefficients vs pumping power rate. In the Python API, use descriptive parameter names that disambiguate (e.g., `fpha_coefficients` not `gamma`)
- Mark async support as OPTIONAL per architecture-021.md SS6.1 Q-4

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-022 (structured output spec -- error schema reuse for exception mapping)
- **Blocks**: ticket-026

## Effort Estimate

**Points**: 5
**Confidence**: High
