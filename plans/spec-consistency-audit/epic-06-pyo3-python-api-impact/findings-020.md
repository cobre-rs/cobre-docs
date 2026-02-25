# findings-020: MCP Server, Python Bindings, and TUI Impact Assessment

## Summary

This report assesses the impact of three new interface layers -- MCP server (`cobre-mcp`), Python bindings (`cobre-python`), and terminal UI (`cobre-tui`) -- on the existing 6-crate + ferrompi Cobre architecture. Each layer introduces a new crate that integrates with existing public APIs, imposes architectural constraints, and requires modifications to existing spec sections.

**Key findings**:

1. **MCP server** maps cleanly to existing operations: 10 tools, 6 resource types, 4 prompts. Transport is stdio for local, SSE/streamable-HTTP for remote. All operations are single-process.
2. **Python bindings** face a fundamental GIL/MPI tension. The recommended execution mode is **single-process only** -- no MPI from Python. The GIL must be released during all Rust computation. Thread-local solver workspaces are safe because PyO3 releases the GIL before entering Rust parallel regions.
3. **TUI** consumes the same per-iteration record defined in convergence-monitoring.md SS2.4. All 7 training-loop iteration lifecycle steps emit observable data, producing 7 distinct TUI event types.
4. **16 existing spec sections** require modification across the three layers; 3 new crate documentation pages are needed.

---

## 1. MCP Server Assessment (`cobre-mcp`)

### 1.1 Operation-to-Tool Mapping

Each MCP tool corresponds to an existing Cobre operation. Tools are single-process -- they invoke the Rust library API directly without MPI.

| #   | Proposed Tool Name        | Source Crate(s)            | Input Schema Shape                                                                  | Output Schema Shape                                                                           | Notes                                                                                             |
| --- | ------------------------- | -------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `cobre/validate`          | cobre-io, cobre-core       | `{ case_dir: string }`                                                              | `{ valid: bool, errors: ValidationError[], warnings: ValidationWarning[] }`                   | Maps to `--validate-only` mode. Runs the 5-layer validation pipeline (validation-architecture.md) |
| 2   | `cobre/run`               | cobre-sddp, cobre-solver   | `{ case_dir: string, phases: ("training" \| "simulation" \| "both")[] }`            | `{ status: string, iterations: int, lower_bound: f64, upper_bound: f64, output_dir: string }` | Single-process training/simulation. No MPI. Uses 1 rank with OpenMP threads                       |
| 3   | `cobre/query-results`     | cobre-io                   | `{ output_dir: string, entity_type: string, filters: FilterSpec }`                  | `{ columns: string[], rows: JsonValue[][] }`                                                  | Reads Hive-partitioned Parquet output (output-schemas.md)                                         |
| 4   | `cobre/query-convergence` | cobre-io                   | `{ output_dir: string, iteration_range?: [int, int] }`                              | `{ iterations: ConvergenceRecord[] }`                                                         | Reads convergence.parquet (output-schemas.md SS6.1)                                               |
| 5   | `cobre/inspect-policy`    | cobre-io                   | `{ policy_dir: string, stage?: int }`                                               | `{ stages: int, cuts_per_stage: int[], total_cuts: int, state_dimension: int }`               | Reads FlatBuffers policy data (binary-formats.md)                                                 |
| 6   | `cobre/compare-policies`  | cobre-io                   | `{ policy_dirs: string[], metrics: string[] }`                                      | `{ comparison: PolicyComparison }`                                                            | Cross-study comparison of cut pools and convergence                                               |
| 7   | `cobre/inspect-case`      | cobre-io, cobre-core       | `{ case_dir: string }`                                                              | `{ config: JsonValue, entities: EntitySummary, stages: int, hydros: int, thermals: int }`     | Read-only case introspection without full validation                                              |
| 8   | `cobre/list-scenarios`    | cobre-io, cobre-stochastic | `{ case_dir: string }`                                                              | `{ scenario_source: string, count: int, stages: int, entities: int }`                         | Scenario metadata without loading full data                                                       |
| 9   | `cobre/export-results`    | cobre-io                   | `{ output_dir: string, format: ("csv" \| "json" \| "arrow"), entity_type: string }` | `{ file_path: string, rows: int }`                                                            | Convert Parquet results to agent-friendly formats                                                 |
| 10  | `cobre/get-config-schema` | cobre-cli                  | `{}`                                                                                | `{ schema: JsonSchema }`                                                                      | Returns the config.json JSON schema for agent-assisted configuration                              |

### 1.2 Data Artifact-to-Resource Mapping

MCP resources provide read-only access to Cobre data artifacts. Resources use URI templates.

| #   | Resource URI Template                               | Data Source              | MIME Type          | Notes                                                        |
| --- | --------------------------------------------------- | ------------------------ | ------------------ | ------------------------------------------------------------ |
| 1   | `cobre://case/{case_dir}/config`                    | `config.json`            | `application/json` | Case configuration                                           |
| 2   | `cobre://case/{case_dir}/entities/{entity_type}`    | System JSON registries   | `application/json` | Entity registry data (hydros, thermals, buses, etc.)         |
| 3   | `cobre://case/{case_dir}/scenarios/{entity_id}`     | Scenario Parquet files   | `application/json` | Scenario data for a specific entity (converted from Parquet) |
| 4   | `cobre://output/{output_dir}/convergence`           | `convergence.parquet`    | `application/json` | Training convergence log                                     |
| 5   | `cobre://output/{output_dir}/results/{entity_type}` | Hive-partitioned Parquet | `application/json` | Simulation results by entity type                            |
| 6   | `cobre://output/{output_dir}/policy/summary`        | FlatBuffers policy dir   | `application/json` | Policy summary (cut counts, state dimension)                 |

### 1.3 MCP Prompts

Prompts provide guided interaction patterns for AI agents.

| #   | Prompt Name                  | Arguments                                                     | Purpose                                                                                    |
| --- | ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | `cobre/setup-study`          | `{ description: string }`                                     | Guide agent through case directory creation: config.json, entity registries, scenario data |
| 2   | `cobre/diagnose-convergence` | `{ output_dir: string }`                                      | Analyze convergence.parquet, identify stalling, suggest parameter adjustments              |
| 3   | `cobre/compare-runs`         | `{ output_dirs: string[] }`                                   | Compare multiple training/simulation runs for policy quality assessment                    |
| 4   | `cobre/explain-results`      | `{ output_dir: string, entity_type: string, metric: string }` | Explain simulation results in domain terms (water value, marginal cost, deficit patterns)  |

### 1.4 Transport Recommendation

| Deployment                          | Transport                          | Rationale                                                                             |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| Local (same machine as agent)       | **stdio**                          | Lowest latency, simplest setup, standard for Claude Desktop / agent CLI tools         |
| Remote (agent on different machine) | **Streamable HTTP** (SSE fallback) | HTTP-based, firewall-friendly, supports progress streaming for long `cobre/run` calls |

For the `cobre/run` tool, which may take minutes to hours, the server MUST support progress notifications via the MCP progress reporting mechanism. This maps to the structured training log (convergence-monitoring.md SS4) -- each iteration emits a progress notification with the per-iteration record fields.

### 1.5 Security Model

| Category       | Operations                                                                                                                                    | Policy                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Read-only**  | `validate`, `query-results`, `query-convergence`, `inspect-policy`, `compare-policies`, `inspect-case`, `list-scenarios`, `get-config-schema` | Default mode. No filesystem writes. Safe for untrusted agent access                                             |
| **Read-write** | `run`, `export-results`                                                                                                                       | Writes output files. Requires explicit opt-in via `--allow-write` flag or server configuration                  |
| **Sandboxing** | All operations                                                                                                                                | Case directory and output directory paths must be within a configured allowlist. No arbitrary filesystem access |

### 1.6 Affected Specs

| Spec File                    | Section(s)                                        | Required Change                                                       |
| ---------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `cli-and-lifecycle.md`       | SS1 Design Philosophy, SS2 Invocation, SS5 Phases | Add library-mode execution path (no MPI init, no scheduler detection) |
| `output-schemas.md`          | SS1 Directory Structure, all entity schemas       | Add JSON serialization requirements for MCP resource exposure         |
| `binary-formats.md`          | (all)                                             | Add read-only access API requirements for FlatBuffers policy data     |
| `convergence-monitoring.md`  | SS2.4 Per-Iteration Record, SS4 Training Log      | Add structured JSON output for MCP progress notifications             |
| `validation-architecture.md` | SS5 Error Reporting                               | Already has JSON error structure; confirm MCP compatibility           |
| `cross-reference-index.md`   | SS1 Mapping Table, SS2 Reading Lists              | Add `cobre-mcp` entries                                               |

---

## 2. Python Bindings Assessment (`cobre-python`)

### 2.1 Crate API-to-Python Mapping

For each existing Rust crate, the following public API surfaces are candidates for Python exposure.

#### cobre-core (Data Model)

| Rust Concept                                                 | Python Exposure                              | Data Type Mapping                                   |
| ------------------------------------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| Entity registries (HydroPlant, ThermalUnit, Bus, Line, etc.) | Read-only dataclass-like objects             | Struct fields -> Python attributes via `#[pyclass]` |
| Internal structures (resolved per-entity, per-stage values)  | Read-only dictionary or typed objects        | Nested structs -> nested Python objects             |
| System topology (bus connectivity, cascade)                  | Adjacency data or networkx-compatible format | Graph structures -> dict-of-lists or networkx       |
| PAR parameters (seasonal means, AR coefficients)             | NumPy arrays (zero-copy via PyO3)            | Contiguous f64 arrays -> `numpy.ndarray`            |

#### cobre-io (File I/O)

| Rust Concept              | Python Exposure                             | Data Type Mapping                                                       |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Case directory loader     | `CaseLoader` class with `load(path)` method | Returns a `Case` Python object wrapping the internal structures         |
| Parquet reader/writer     | Expose via Arrow (zero-copy)                | `pyarrow.Table` for DataFrames, avoids Parquet re-parsing               |
| FlatBuffers policy reader | `PolicyReader` class                        | Returns Python-friendly summary; raw FlatBuffers bytes via `memoryview` |
| JSON config parser        | Not needed -- Python has native JSON        | Document schema; let users use `json.load()`                            |
| Validation pipeline       | `validate(path)` function                   | Returns `ValidationResult` with errors/warnings lists                   |

#### cobre-stochastic (Scenario Generation)

| Rust Concept                | Python Exposure                                | Data Type Mapping                                             |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| PAR(p) model evaluation     | `PARModel` class                               | Accept NumPy arrays for lags, return NumPy arrays for inflows |
| Correlated noise sampling   | `sample_noise(n, correlation_matrix)` function | NumPy arrays in, NumPy arrays out                             |
| Opening tree                | `OpeningTree` read-only object                 | NumPy array of shape `(n_openings, n_stages, n_entities)`     |
| External scenario injection | `load_external_scenarios(path)`                | Returns Arrow table                                           |

#### cobre-solver (LP Solver)

| Rust Concept               | Python Exposure                            | Data Type Mapping                                         |
| -------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Solver trait interface     | **Not directly exposed**                   | Too low-level; Python users interact via cobre-sddp       |
| Solver workspace lifecycle | **Not exposed**                            | Thread-local workspaces are internal to the training loop |
| LP model construction      | **Optional**: `LPModel` for advanced users | Sparse matrix (scipy.sparse) + vectors                    |

**Recommendation**: cobre-solver internals should NOT be exposed to Python. The solver is an implementation detail of the training loop. Python users call `train()` or `simulate()` and receive results.

#### cobre-sddp (Algorithm)

| Rust Concept              | Python Exposure                                      | Data Type Mapping                                                        |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Training entry point      | `train(case, config_overrides?)` function            | Returns `TrainingResult` with convergence history, policy reference      |
| Simulation entry point    | `simulate(case, policy, config_overrides?)` function | Returns `SimulationResult` with Arrow tables per entity type             |
| Convergence monitor state | Read-only `ConvergenceHistory`                       | List of per-iteration records (same as convergence-monitoring.md SS2.4)  |
| Cut pool inspection       | `Policy.cuts(stage)` method                          | Returns structured data: intercepts (NumPy), coefficients (NumPy matrix) |
| FCF evaluation            | `Policy.evaluate(state_vector)` function             | NumPy array in, f64 out                                                  |

#### cobre-cli (Binary)

| Rust Concept            | Python Exposure                                | Notes                                          |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------- |
| CLI argument parsing    | **Not exposed**                                | Python users call library functions directly   |
| Exit codes              | **Not applicable**                             | Python uses exceptions                         |
| Lifecycle orchestration | Partially exposed via `train()` / `simulate()` | Simplified lifecycle without MPI init/finalize |

#### ferrompi (MPI Bindings)

| Rust Concept       | Python Exposure | Notes                                               |
| ------------------ | --------------- | --------------------------------------------------- |
| All MPI operations | **Not exposed** | Python bindings are single-process only (see SS2.2) |

### 2.2 GIL Interaction Analysis

This is the most architecturally significant finding of this assessment. The analysis addresses three specific sub-questions.

#### (a) Can Python bindings coexist with MPI in the same process?

**Answer: No. Python bindings MUST NOT initialize MPI.**

The technical reasons are:

1. **MPI_Init_thread timing**: ferrompi requires `MPI_Init_thread(MPI_THREAD_MULTIPLE)` as the very first MPI call (hybrid-parallelism.md SS6, Step 1). In a Python process, the Python interpreter initializes first. If the Python process attempts to initialize MPI via ferrompi, the MPI runtime may conflict with Python's signal handlers, thread state, and memory allocator. Some MPI implementations (OpenMPI, MPICH) are incompatible with being initialized after a Python interpreter is already running with threads.

2. **GIL and MPI_THREAD_MULTIPLE conflict**: `MPI_THREAD_MULTIPLE` means any thread can call MPI at any time. Python's GIL means only one thread can execute Python code at a time. When PyO3 holds the GIL to return results to Python, all other threads that might need to call MPI collective operations (e.g., `MPI_Allreduce`, `MPI_Allgatherv`) are blocked if they need to interact with Python. This creates a deadlock risk: MPI collectives require all ranks to participate, but the GIL serializes execution through Python.

3. **mpi4py coexistence**: While mpi4py manages its own `MPI_Init_thread` call, combining mpi4py with ferrompi in the same process would require both to share the same `MPI_Comm` handle. ferrompi is a separate Rust crate with its own FFI bindings to the MPI C library. Having two independent MPI FFI layers (mpi4py's C extension and ferrompi's Rust FFI) in the same process addressing the same MPI runtime is fragile and untested. The risk of ABI conflicts, double-free of communicators, or inconsistent threading levels is high.

**Conclusion**: Python bindings operate in single-process mode. The execution path is: Python -> PyO3 -> cobre-sddp (single-rank, no ferrompi) -> cobre-solver (OpenMP threads) -> results back to Python.

#### (b) How do thread-local solver workspaces interact with the GIL?

**Answer: Safe, provided the GIL is released during Rust computation.**

The interaction model:

1. **Python calls `train()` or `simulate()`**: PyO3 acquires the GIL to receive the Python call, validates arguments, then **releases the GIL** via `py.allow_threads(|| { ... })` before entering the Rust training loop.

2. **Inside the Rust training loop**: OpenMP parallel regions spawn threads. Each thread creates and owns its solver workspace (memory-architecture.md SS1.1, "Thread-local mutable" category). These workspaces are:
   - Allocated by the owning thread (first-touch NUMA placement)
   - Accessed exclusively by the owning thread
   - Cache-line padded to prevent false sharing (memory-architecture.md SS3.3)
   - Never touched by Python or the GIL

3. **GIL state during computation**: The GIL is released for the entire duration of `train()` / `simulate()`. OpenMP threads are pure Rust/C threads -- they never call back into Python, never acquire the GIL, and never touch `PyObject` references. The thread-local workspaces are invisible to Python's garbage collector.

4. **Return to Python**: When the Rust computation completes, PyO3 reacquires the GIL and converts results to Python objects (NumPy arrays, Python dicts, etc.).

**Key invariant**: No Rust thread executing within an OpenMP parallel region ever acquires the GIL. This is guaranteed by construction -- the OpenMP callback trampoline pattern (hybrid-parallelism.md SS5.3) calls Rust closures that have no access to `Python<'_>` tokens.

**Risk area**: If future code adds Python callbacks from within the training loop (e.g., a Python-defined risk measure or custom stopping rule), the GIL would need to be reacquired per-callback, serializing all threads through the callback. This would destroy parallel performance. **Recommendation**: Do not support Python callbacks into the hot loop. All customization should be via configuration, not runtime callbacks.

#### (c) Recommended execution mode

**Recommendation: Single-process only. No MPI support from Python.**

| Execution Mode                 | Supported               | Rationale                                                                                        |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Single-process, single-thread  | Yes                     | Simplest. Good for small problems, scripting, Jupyter                                            |
| Single-process, OpenMP threads | Yes (recommended)       | Full intra-node parallelism. GIL released during computation. Best performance/complexity ratio  |
| Multi-process via mpi4py       | **No**                  | GIL/MPI deadlock risk, dual FFI layer fragility, minimal benefit for Python use cases            |
| Multi-process via subprocess   | Possible (out of scope) | Python launches `mpiexec cobre ...` as subprocess, reads Parquet results. Not a bindings concern |

For users who need distributed (multi-node) execution, the recommended workflow is:

1. Use Python to prepare the case directory and configuration
2. Launch `mpiexec cobre /path/to/case` as a subprocess
3. Use Python to read and analyze the Parquet output files

### 2.3 Zero-Copy Data Paths

| Data                   | Rust Type                | Python Type                           | Zero-Copy Mechanism                                               |
| ---------------------- | ------------------------ | ------------------------------------- | ----------------------------------------------------------------- |
| Scenario noise vectors | `Vec<f64>` (contiguous)  | `numpy.ndarray`                       | PyO3 `numpy` crate: expose Rust slice as NumPy array without copy |
| Opening tree           | 3D contiguous array      | `numpy.ndarray` shape `(O, S, E)`     | Same as above                                                     |
| Convergence history    | `Vec<ConvergenceRecord>` | `pyarrow.Table` or list of dicts      | Arrow FFI (`arrow-rs` -> `pyarrow`) for zero-copy table transfer  |
| Simulation results     | Parquet files on disk    | `polars.DataFrame` or `pyarrow.Table` | No copy: Python reads Parquet directly using polars/pyarrow       |
| Cut coefficients       | `Vec<f64>` per stage     | `numpy.ndarray`                       | PyO3 `numpy` crate                                                |
| PAR parameters         | Contiguous f64 arrays    | `numpy.ndarray`                       | PyO3 `numpy` crate                                                |

**Key insight**: The largest data artifacts (simulation results, scenario data) are already on disk in Parquet format. Python can read them directly without going through Rust at all. The zero-copy paths through PyO3 are for in-memory data that exists only during a Python-driven training/simulation session.

### 2.4 FlatBuffers Policy Access from Python

FlatBuffers policy data (binary-formats.md) stores cuts, visited states, vertices, and solver basis caches. From Python:

| Access Pattern                                   | Implementation                                       | Notes                                                                    |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Summary statistics (cut counts, state dimension) | Rust reads FlatBuffers, returns Python dict          | Lightweight, no zero-copy needed                                         |
| Cut coefficient extraction                       | Rust reads FlatBuffers, returns NumPy arrays         | Zero-copy for the f64 coefficient arrays                                 |
| Raw FlatBuffers bytes                            | `memoryview` of the mmap'd file                      | For advanced users who want to use `flatbuffers` Python package directly |
| Policy comparison                                | Rust function compares two policies, returns summary | Higher-level API, avoids exposing FlatBuffers internals                  |

**Recommendation**: Do not expose FlatBuffers internals to Python. Provide a `Policy` class with methods like `cuts(stage)`, `summary()`, `evaluate(state)` that internally read FlatBuffers and return Python-native types.

### 2.5 MPI Recommendation

**Do not support MPI from Python.** The Python bindings crate (`cobre-python`) MUST NOT depend on ferrompi.

Justification:

- GIL/MPI deadlock risk (SS2.2a above)
- Python use cases (scripting, Jupyter, agent frameworks) do not benefit from multi-node execution
- Users needing MPI should use the native `cobre` binary
- Removing ferrompi from the Python path eliminates a complex build dependency (MPI headers, runtime libraries)

### 2.6 Affected Specs

| Spec File                   | Section(s)                              | Required Change                                                                                                                                         |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cli-and-lifecycle.md`      | SS1, SS5.2                              | Add library-mode lifecycle (no MPI init, no scheduler detection, no signal handlers)                                                                    |
| `hybrid-parallelism.md`     | SS1, SS6                                | Document single-process execution mode: OpenMP without MPI. Initialization sequence must support skipping Steps 1-3 (MPI init, topology, shared memory) |
| `memory-architecture.md`    | SS1.1 Ownership Categories              | Document that in single-process mode, "Shared read-only" via SharedWindow is replaced by regular per-process allocation. No MPI windows                 |
| `solver-workspaces.md`      | (implied by cobre-solver.md)            | Document that workspace allocation works identically in single-process mode (OpenMP threads still own workspaces)                                       |
| `training-loop.md`          | SS2.1 Iteration Lifecycle, SS4.3, SS6.3 | Document single-rank variants: Steps 2 and 4 (MPI synchronization) become no-ops. Forward/backward distribution uses only OpenMP                        |
| `convergence-monitoring.md` | SS3.1 Cross-Rank Aggregation            | Document single-rank case: no MPI_Allreduce needed, statistics computed locally                                                                         |
| `output-schemas.md`         | SS6.3 MPI Rank Timing                   | In single-process mode, only rank 0 row exists                                                                                                          |
| `cross-reference-index.md`  | SS1 Mapping Table, SS2 Reading Lists    | Add `cobre-python` entries                                                                                                                              |

---

## 3. TUI Assessment (`cobre-tui`)

### 3.1 Training Loop Event Model

Each of the 7 steps in the training-loop.md SS2.1 iteration lifecycle produces observable data that the TUI consumes as events.

| Step | Lifecycle Phase         | TUI Event Name         | Payload Shape                                                                                                                                                                         | Observable Data                                                                                            |
| ---- | ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | Forward pass            | `ForwardPassComplete`  | `{ iteration: i32, scenarios: i32, lb_candidate: f64, ub_mean: f64, ub_std: f64, elapsed_ms: i64 }`                                                                                   | Per-scenario costs, visited states count, lower bound candidate from stage-1 LP                            |
| 2    | Forward synchronization | `ForwardSyncComplete`  | `{ iteration: i32, global_lb: f64, global_ub_mean: f64, global_ub_std: f64, sync_time_ms: i64 }`                                                                                      | Aggregated bound statistics after MPI_Allreduce                                                            |
| 3    | Backward pass           | `BackwardPassComplete` | `{ iteration: i32, cuts_generated: i32, stages_processed: i32, elapsed_ms: i64 }`                                                                                                     | Number of new cuts generated, per-stage timing breakdown                                                   |
| 4    | Cut synchronization     | `CutSyncComplete`      | `{ iteration: i32, cuts_distributed: i32, cuts_active: i64, cuts_removed: i32, sync_time_ms: i64 }`                                                                                   | Cut pool statistics after MPI_Allgatherv and cut selection                                                 |
| 5    | Convergence update      | `ConvergenceUpdate`    | `{ iteration: i32, lower_bound: f64, upper_bound: f64, upper_bound_std: f64, gap: f64, rules_evaluated: RuleResult[] }`                                                               | Same fields as convergence-monitoring.md SS2.4 per-iteration record, plus stopping rule evaluation results |
| 6    | Checkpoint              | `CheckpointComplete`   | `{ iteration: i32, checkpoint_path: string, elapsed_ms: i64 }`                                                                                                                        | Checkpoint written (only emitted when checkpoint interval triggers)                                        |
| 7    | Logging                 | `IterationSummary`     | `{ iteration: i32, lower_bound: f64, upper_bound: f64, gap: f64, wall_time_ms: i64, iteration_time_ms: i64, forward_ms: i64, backward_ms: i64, lp_solves: i64, memory_peak_mb: i64 }` | Full iteration summary matching convergence.parquet schema (output-schemas.md SS6.1)                       |

**Additional non-iteration events**:

| Event                | Payload Shape                                                                                                          | Source                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `TrainingStarted`    | `{ case_name: string, stages: i32, hydros: i32, thermals: i32, ranks: i32, threads_per_rank: i32, timestamp: string }` | Training orchestrator startup (matches convergence-monitoring.md SS4 header)                 |
| `TrainingFinished`   | `{ reason: string, iterations: i32, final_lb: f64, final_ub: f64, total_time_ms: i64, total_cuts: i64 }`               | Training orchestrator completion (matches convergence-monitoring.md SS4 termination summary) |
| `SimulationProgress` | `{ scenarios_complete: i32, scenarios_total: i32, elapsed_ms: i64 }`                                                   | Simulation phase progress                                                                    |
| `SimulationFinished` | `{ scenarios: i32, output_dir: string, elapsed_ms: i64 }`                                                              | Simulation phase completion                                                                  |

### 3.2 Convergence Plot Data Source

**The TUI convergence plot consumes the exact same per-iteration record defined in convergence-monitoring.md SS2.4.**

Specifically:

| Convergence-monitoring.md SS2.4 Field | TUI Convergence Plot Usage                           |
| ------------------------------------- | ---------------------------------------------------- |
| `iteration`                           | X-axis                                               |
| `lower_bound`                         | Primary Y-axis series (monotonically non-decreasing) |
| `upper_bound`                         | Primary Y-axis series (with error bars from `ci_95`) |
| `upper_bound_std`                     | Error bar computation                                |
| `ci_95`                               | Error bar half-width on upper bound                  |
| `gap`                                 | Secondary Y-axis or annotation                       |
| `wall_time`                           | Alternative X-axis (time-based view)                 |
| `iteration_time`                      | Per-bar in timing breakdown view                     |

The convergence plot does NOT require any data beyond what SS2.4 already defines. The TUI subscribes to `ConvergenceUpdate` events (Step 5) and accumulates the history in memory for rendering.

### 3.3 Monitoring Views

| View                 | Primary Data Source                              | Update Frequency    | Notes                                                                                 |
| -------------------- | ------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------- |
| **Convergence Plot** | `ConvergenceUpdate` events (SS2.4 record)        | Once per iteration  | LB/UB lines with CI bands, gap annotation, log or linear scale                        |
| **Iteration Detail** | `IterationSummary` events                        | Once per iteration  | Timing breakdown (forward/backward/sync/checkpoint), LP solve count, memory           |
| **Cut Statistics**   | `CutSyncComplete` events                         | Once per iteration  | Active/total/removed cuts, per-stage distribution bar chart                           |
| **Resource Usage**   | OS-level telemetry + MPI rank timing             | Continuous (polled) | Memory per rank, CPU utilization, MPI idle time (from mpi_ranks.parquet schema SS6.3) |
| **Communication**    | `ForwardSyncComplete` + `CutSyncComplete` events | Once per iteration  | MPI time breakdown: allreduce vs allgatherv, sync overhead ratio                      |

### 3.4 Interactive Features

| Feature                   | Mechanism                                                                                    | Impact on Training Loop                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Pause training**        | Set a pause flag checked at iteration boundary (between Step 7 and Step 1 of next iteration) | Training loop checks flag after logging; blocks until resume. No mid-iteration pause (iterations are atomic)                         |
| **Inspect cuts**          | Read the FCF cut pool for a selected stage                                                   | Read-only access to in-memory cut pool. Safe because TUI reads between iterations (pause required or snapshot at iteration boundary) |
| **Compare scenarios**     | Select scenario indices and display side-by-side forward pass results                        | Requires forward pass state recording (training-loop.md SS5). Read-only access to visited states                                     |
| **Adjust stopping rules** | Modify stopping rule parameters (tolerance, iteration limit) at runtime                      | Convergence monitor reads parameters at each iteration; runtime override is safe                                                     |
| **Export snapshot**       | Write current convergence history and cut pool to files                                      | Uses existing checkpoint mechanism (checkpointing.md). No new code path                                                              |

**Important constraint**: Interactive features that read training state MUST operate at iteration boundaries. The training loop is not designed for mid-iteration inspection -- solver workspaces and cut pools are in flux during forward/backward passes.

### 3.5 Relationship to Structured Output

**The TUI consumes the same event stream as the structured CLI JSON-lines output.**

The architecture is:

```
Training Loop
    |
    v
Event Emitter (channel-based)
    |
    +---> JSON-lines Writer (structured CLI output, findings-019 SS2)
    |
    +---> TUI Renderer (ratatui)
    |
    +---> MCP Progress Notifications (SSE/stdio)
```

All three consumers subscribe to the same event types. The event emitter is a Rust `mpsc` or `broadcast` channel. The TUI renderer is an additional subscriber, not a replacement for structured output. When `--output-format json` is used without TUI, only the JSON-lines writer subscribes. When TUI is active, both subscribe.

**Key design implication**: The event type definitions must be shared across `cobre-sddp` (emitter), `cobre-cli` (JSON-lines writer), `cobre-tui` (renderer), and `cobre-mcp` (progress notifications). This suggests the event types belong in `cobre-core` or a new `cobre-events` module within `cobre-sddp`.

### 3.6 Affected Specs

| Spec File                   | Section(s)                                   | Required Change                                                                                          |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `training-loop.md`          | SS2.1 Iteration Lifecycle                    | Define event emission points at each of the 7 steps                                                      |
| `convergence-monitoring.md` | SS2.4 Per-Iteration Record, SS4 Training Log | Formalize the per-iteration record as a shared event type consumed by TUI, CLI, and MCP                  |
| `cli-and-lifecycle.md`      | SS5.2 Phase Responsibilities                 | Add TUI lifecycle: TUI attaches to an already-running training process or is co-hosted in the CLI binary |
| `output-schemas.md`         | SS6.1 Convergence Log                        | Confirm that the convergence.parquet schema matches the TUI event payload                                |
| `cross-reference-index.md`  | SS1 Mapping Table, SS2 Reading Lists         | Add `cobre-tui` entries                                                                                  |

---

## 4. Impact Inventory Table

Each row identifies an existing spec section that requires modification. Entries are tagged with the interface layer(s) driving the change.

| #   | Spec File                   | Section                      | Interface Layer  | Current State                                                      | Required Change                                                                                                                                                                                                                                              | Severity    | Notes                                                                |
| --- | --------------------------- | ---------------------------- | ---------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------- |
| 1   | `cli-and-lifecycle.md`      | SS1 Design Philosophy        | MCP, Python, TUI | Single-entrypoint MPI-only design                                  | Add library-mode execution concept: skip MPI init, no scheduler detection, optional signal handlers                                                                                                                                                          | REQUIRED    | Foundational change enabling all three non-MPI interface layers      |
| 2   | `cli-and-lifecycle.md`      | SS2 Invocation Pattern       | MCP, Python      | Only `mpiexec cobre CASE_DIR`                                      | Add subcommand invocation (`cobre validate`, `cobre run`, `cobre serve`) per findings-019; library-mode has no invocation pattern (it is a Rust function call)                                                                                               | REQUIRED    | Prerequisite for MCP `serve` subcommand                              |
| 3   | `cli-and-lifecycle.md`      | SS5.2 Phase Responsibilities | MCP, Python, TUI | All phases require MPI ranks                                       | Document which phases apply in library mode: Startup (no MPI), Validation (identical), Initialization (no broadcast), Training (single-rank), Simulation (single-rank)                                                                                       | REQUIRED    | Phase table needs a "Library Mode" column                            |
| 4   | `hybrid-parallelism.md`     | SS1 Architecture Overview    | Python           | Only describes ferrompi + OpenMP hybrid                            | Add "Single-Process Mode" subsection: OpenMP threads without MPI. Initialization skips Steps 1-3 (MPI init, topology, shared memory communicator)                                                                                                            | REQUIRED    | Python and MCP paths never touch MPI                                 |
| 5   | `hybrid-parallelism.md`     | SS6 Initialization Sequence  | Python           | 8-step sequence starting with MPI init                             | Document alternative initialization for library mode: skip Steps 1-3, start at Step 4 (OpenMP configuration). Step 5 (LP solver suppression) and Steps 6-7 (NUMA, workspace) remain identical                                                                | REQUIRED    | Without this, there is no documented path for non-MPI initialization |
| 6   | `memory-architecture.md`    | SS1.1 Ownership Categories   | Python           | SharedWindow for shared read-only data                             | Add note: in single-process mode, shared read-only data is regular per-process allocation (no MPI windows). Memory savings from SS2.2 do not apply                                                                                                           | RECOMMENDED | Clarification; does not change behavior                              |
| 7   | `memory-architecture.md`    | SS2.2 SharedWindow Savings   | Python           | Assumes multi-rank deployment                                      | Add note: savings table is MPI-only. Single-process mode replicates all data in one process                                                                                                                                                                  | RECOMMENDED | Informational; no code change                                        |
| 8   | `training-loop.md`          | SS2.1 Iteration Lifecycle    | TUI, MCP         | 7-step lifecycle with no event emission                            | Define event emission at each step boundary. Each step produces a typed event consumed by TUI, JSON-lines writer, and MCP progress notifications                                                                                                             | REQUIRED    | Core change enabling all runtime monitoring                          |
| 9   | `training-loop.md`          | SS4.3 Parallel Distribution  | Python           | MPI rank distribution + OpenMP                                     | Document single-rank variant: all scenarios on one rank, OpenMP threads only. MPI_Allreduce becomes local computation                                                                                                                                        | RECOMMENDED | Training loop code must handle rank_count=1 gracefully               |
| 10  | `training-loop.md`          | SS6.3 Parallel Distribution  | Python           | MPI cut synchronization                                            | Document single-rank variant: MPI_Allgatherv becomes no-op (all cuts are local). Stage synchronization barrier reduces to OpenMP barrier only                                                                                                                | RECOMMENDED | Symmetric with SS4.3 change                                          |
| 11  | `convergence-monitoring.md` | SS2.4 Per-Iteration Record   | TUI, MCP         | Record defined as table; consumed only by text log                 | Formalize as a shared event type (struct) that is consumed by: (1) text logger, (2) JSON-lines writer, (3) TUI renderer, (4) MCP progress notifications, (5) convergence.parquet writer                                                                      | REQUIRED    | Single source of truth for all consumers                             |
| 12  | `convergence-monitoring.md` | SS3.1 Cross-Rank Aggregation | Python           | MPI_Allreduce of 3 doubles                                         | Add note: in single-process mode, aggregation is trivial (single-rank statistics are global statistics)                                                                                                                                                      | RECOMMENDED | Clarification for library-mode implementers                          |
| 13  | `convergence-monitoring.md` | SS4 Training Log             | TUI, MCP         | Text-only format (header, per-iteration line, termination summary) | Add structured JSON variant per findings-019. TUI and MCP consume the structured form, not the text form                                                                                                                                                     | REQUIRED    | Already identified in findings-019; reinforced here                  |
| 14  | `output-schemas.md`         | SS6.1 Convergence Log        | TUI              | Parquet schema for convergence.parquet                             | Confirm that convergence.parquet columns are a superset of the TUI ConvergenceUpdate event payload. Currently true -- SS6.1 includes all fields from SS2.4 plus `cuts_added`, `cuts_removed`, `cuts_active`, `memory_peak_mb`, `forward_passes`, `lp_solves` | OPTIONAL    | No schema change needed; add cross-reference to TUI event type       |
| 15  | `output-schemas.md`         | SS1 Directory Structure      | MCP              | Parquet-only outputs                                               | Add JSON serialization guidance for MCP resource exposure. MCP resources serve entity results as JSON; the conversion from Parquet column types to JSON types must be documented                                                                             | RECOMMENDED | MCP resources need JSON representations of Parquet data              |
| 16  | `cross-reference-index.md`  | SS1 Spec-to-Crate Mapping    | Multiple         | 50 specs mapped to 7 crates                                        | Add rows for `cobre-mcp`, `cobre-python`, `cobre-tui` crate documentation pages and any new specs they introduce                                                                                                                                             | REQUIRED    | Index must remain complete                                           |

**Severity summary**: 7 REQUIRED, 6 RECOMMENDED, 3 OPTIONAL = 16 total affected sections.

---

## 5. New Crate Documentation Inventory

Three new crate documentation pages are needed in `src/crates/`.

### 5.1 `cobre-mcp` (MCP Server)

| Field                  | Value                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **File**               | `src/crates/mcp.md`                                                                                                  |
| **Dependencies**       | `cobre-core`, `cobre-io`, `cobre-sddp`, `cobre-stochastic`                                                           |
| **Does NOT depend on** | `ferrompi` (single-process only), `cobre-cli` (library mode, no CLI parsing)                                         |
| **Responsibility**     | MCP protocol server exposing Cobre operations as tools, data artifacts as resources, and guided workflows as prompts |
| **Transport**          | stdio (local), SSE/streamable-HTTP (remote)                                                                          |

**Proposed dependency graph position**:

```
cobre-mcp
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core
```

### 5.2 `cobre-python` (Python Bindings)

| Field                  | Value                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **File**               | `src/crates/python.md`                                                                                               |
| **Dependencies**       | `cobre-core`, `cobre-io`, `cobre-sddp`, `cobre-stochastic`                                                           |
| **Build dependencies** | PyO3, `numpy` (PyO3 crate), `arrow` (for Arrow FFI)                                                                  |
| **Does NOT depend on** | `ferrompi` (single-process only), `cobre-cli` (library mode)                                                         |
| **Responsibility**     | PyO3-based Python module (`import cobre`) exposing case loading, validation, training, simulation, and result access |
| **Execution mode**     | Single-process with OpenMP threads. GIL released during Rust computation                                             |

**Proposed dependency graph position**:

```
cobre-python
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core
```

### 5.3 `cobre-tui` (Terminal UI)

| Field                     | Value                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **File**                  | `src/crates/tui.md`                                                                                                              |
| **Dependencies**          | `cobre-core` (event types), `cobre-sddp` (event emission, only if co-hosted)                                                     |
| **External dependencies** | `ratatui`, `crossterm`                                                                                                           |
| **Does NOT depend on**    | `ferrompi`, `cobre-io`, `cobre-solver`, `cobre-stochastic`                                                                       |
| **Responsibility**        | Interactive terminal UI for real-time training monitoring, convergence plotting, cut inspection, and simulation progress         |
| **Execution mode**        | Either co-hosted in the `cobre` binary (subscribes to in-process event channel) or standalone (reads JSON-lines from stdin pipe) |

**Proposed dependency graph position** (co-hosted mode):

```
cobre-cli
  +-- cobre-tui
  |     +-- cobre-core (event types only)
  +-- cobre-sddp
  +-- cobre-io
  +-- cobre-core
```

**Alternative** (standalone pipe mode):

```
cobre-tui (standalone binary)
  +-- cobre-core (event types for deserialization)
```

### 5.4 Updated Dependency Graph

```
cobre-cli
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-tui          [NEW]
  |     +-- cobre-core
  +-- cobre-core

cobre-mcp                [NEW, standalone server binary]
  +-- cobre-sddp
  +-- cobre-io
  +-- cobre-core

cobre-python             [NEW, PyO3 cdylib]
  +-- cobre-sddp
  +-- cobre-io
  +-- cobre-core
```

**Key property**: Neither `cobre-mcp` nor `cobre-python` depends on `ferrompi`. They share the same dependency subgraph (cobre-sddp + cobre-io + cobre-core) but not the MPI layer.

---

## 6. Architectural Constraint Summary

### 6.1 Constraints Imposed by MCP Server

| #   | Constraint                                                                                                  | Rationale                                                                                              | Affected Specs                                          |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| C-1 | **Single-process execution**: MCP server MUST NOT initialize MPI                                            | MCP runs as a local or network server; MPI launchers are incompatible with long-lived server processes | cli-and-lifecycle.md, hybrid-parallelism.md             |
| C-2 | **Library-mode lifecycle**: cobre-sddp must support execution without MPI init/finalize                     | MCP calls Rust library functions directly; there is no `mpiexec` wrapper                               | cli-and-lifecycle.md SS5                                |
| C-3 | **JSON serialization for all outputs**: every Parquet schema must have a documented JSON representation     | MCP resources serve data as JSON, not Parquet                                                          | output-schemas.md                                       |
| C-4 | **Progress streaming**: long-running operations must emit progress events                                   | MCP progress notifications require per-iteration updates during training                               | training-loop.md SS2.1, convergence-monitoring.md SS2.4 |
| C-5 | **Sandboxed file access**: case directory and output directory paths must be validated against an allowlist | MCP security model prevents arbitrary filesystem access                                                | New concern; no existing spec                           |

### 6.2 Constraints Imposed by Python Bindings

| #    | Constraint                                                                                       | Rationale                                                                                   | Affected Specs                            |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| C-6  | **Single-process execution**: Python bindings MUST NOT initialize MPI                            | GIL/MPI_THREAD_MULTIPLE deadlock risk; dual FFI layer fragility (SS2.2a)                    | hybrid-parallelism.md                     |
| C-7  | **GIL release during computation**: all Rust computation must run with GIL released              | OpenMP threads and solver workspaces must not be blocked by GIL contention (SS2.2b)         | hybrid-parallelism.md SS5                 |
| C-8  | **No Python callbacks in hot loop**: customization via configuration only, not runtime callbacks | GIL reacquisition per callback would serialize all threads and destroy parallel performance | training-loop.md SS3                      |
| C-9  | **Zero-copy data paths**: NumPy/Arrow interfaces for large arrays                                | Copying hundreds of MB of scenario data or results through Python would be unacceptable     | output-schemas.md, scenario-generation.md |
| C-10 | **No ferrompi dependency**: cobre-python must not link against MPI libraries                     | Removes complex build dependency; Python users do not need MPI headers                      | crates/overview.md dependency graph       |

### 6.3 Constraints Imposed by TUI

| #    | Constraint                                                                                                                                            | Rationale                                                                                                                                         | Affected Specs                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| C-11 | **Event emission at iteration boundaries**: training loop must emit typed events after each of the 7 lifecycle steps                                  | TUI renders real-time progress; without events, TUI has no data source                                                                            | training-loop.md SS2.1                       |
| C-12 | **Shared event type definitions**: event structs must be defined in a crate accessible to all consumers (cobre-sddp, cobre-cli, cobre-tui, cobre-mcp) | Four different consumers of the same event data must use the same types                                                                           | convergence-monitoring.md SS2.4              |
| C-13 | **Iteration-boundary-only interaction**: interactive features (pause, inspect) operate between iterations, never mid-iteration                        | Solver workspaces and cut pools are in flux during forward/backward passes; mid-iteration reads would require synchronization that does not exist | training-loop.md SS2.1, solver-workspaces.md |
| C-14 | **Dual consumption mode**: TUI can either co-host with the training process or consume JSON-lines from a pipe                                         | Supports both interactive (co-hosted) and monitoring (pipe) use cases                                                                             | cli-and-lifecycle.md                         |

### 6.4 Cross-Cutting Constraints

| #    | Constraint                                                                                                                                                  | Rationale                                                                 | Affected Specs                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| C-15 | **Backward compatibility**: existing `mpiexec cobre CASE_DIR` invocation MUST continue to work unchanged                                                    | New interface layers are additive; they do not replace the HPC batch mode | cli-and-lifecycle.md SS2                    |
| C-16 | **Schema-first design**: all MCP tool inputs/outputs, Python function signatures, and TUI event payloads must have documented schemas before implementation | Epic-06 design constraint from 00-epic-overview.md                        | All new crate specs                         |
| C-17 | **Unified event architecture**: a single event emission mechanism in cobre-sddp serves all consumers (text log, JSON-lines, TUI, MCP)                       | Avoids divergent output paths that could become inconsistent              | convergence-monitoring.md, training-loop.md |

---

## 7. Open Questions

| #   | Question                                                            | Context                                                                                                                                                                                                                                                           | Blocking?                                             |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Q-1 | Where should event type definitions live?                           | Options: (a) `cobre-core` (available to all crates), (b) `cobre-sddp` (where events are emitted), (c) new `cobre-events` crate. Option (a) is simplest but adds non-data-model types to cobre-core. Option (b) creates a dependency from cobre-tui on cobre-sddp. | No -- can be resolved during Epic 07 spec authoring   |
| Q-2 | Should the TUI be a separate binary or a feature flag in cobre-cli? | Co-hosted (feature flag) is simpler for interactive use. Standalone binary supports monitoring without rebuilding. Both modes should be supported                                                                                                                 | No -- architecture decision for Epic 07               |
| Q-3 | What is the MCP server's long-running operation model?              | MCP does not natively support hours-long tool calls. Options: (a) background task with polling, (b) progress notifications during the call, (c) separate `run-async` / `get-status` tool pair                                                                     | No -- MCP spec evolving; decide during implementation |
| Q-4 | Should cobre-python support async (asyncio) for training?           | `train()` blocks the calling thread (GIL released). For Jupyter, `asyncio` wrapper with `run_in_executor` would keep the notebook responsive. PyO3 supports this                                                                                                  | No -- API design detail for Epic 07                   |
