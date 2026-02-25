# Python Bindings

## Purpose

This spec defines the `cobre-python` crate: a PyO3-based `cdylib` that exposes Cobre's SDDP hydrothermal dispatch solver to Python as the `cobre` module. It covers the complete Python API surface with type-annotated signatures for all public classes and functions, the 6-point GIL management contract that governs the Python/Rust boundary, zero-copy data paths via NumPy and Arrow FFI, single-process and multi-process execution modes (the latter via TCP or shared-memory backends -- never MPI) with the rationale for prohibiting MPI from Python, the Python exception hierarchy mapped from the structured error kind registry ([Structured Output](./structured-output.md) SS2.3), optional async support via `asyncio`, the FlatBuffers policy access API, memory ownership rules at the boundary, and build/distribution via maturin.

## 1. Crate Architecture

### 1.1 Crate Type and Dependencies

`cobre-python` is a `cdylib` crate that compiles to a shared library (`.so` / `.dylib` / `.pyd`) loadable by the Python interpreter. It is a leaf crate in the Cobre dependency graph: no internal crate depends on it.

| Attribute             | Value                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crate type**        | `cdylib` (PyO3 shared library)                                                                                                                              |
| **Module name**       | `import cobre`                                                                                                                                              |
| **Execution mode**    | Single-process (default) or multi-process via TCP/shm backends. No MPI. OpenMP threads per worker for computation. GIL released during all Rust computation |
| **What it owns**      | PyO3 class/function definitions, Python-to-Rust type conversions, zero-copy NumPy/Arrow bridge, async wrappers                                              |
| **What it delegates** | All computation to `cobre-sddp`; all I/O to `cobre-io`; all data model types from `cobre-core`                                                              |
| **MPI relationship**  | MUST NOT depend on `ferrompi`. MUST NOT initialize MPI. Multi-process execution uses TCP or shm backends instead                                            |

**Dependency graph**:

```
cobre-python [cdylib, PyO3]
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core

ferrompi: NOT a dependency of cobre-python
```

### 1.2 Single-Process Execution

`cobre-python` invokes `cobre-sddp` in single-rank mode. The initialization sequence from [Hybrid Parallelism](../hpc/hybrid-parallelism.md) SS6 is modified:

| Standard Step (SS6)                       | Python Mode                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Step 1 -- MPI initialization              | **Skipped**. No MPI in the process                                                      |
| Step 2 -- Topology detection              | **Skipped**. No scheduler or rank detection                                             |
| Step 3 -- Shared memory communicator      | **Skipped**. No MPI windows                                                             |
| Step 4 -- OpenMP configuration            | **Active**. Reads `OMP_NUM_THREADS` from environment; defaults to physical core count   |
| Step 5 -- LP solver threading suppression | **Active**. Validates `HIGHS_PARALLEL=false`, `MKL_NUM_THREADS=1`                       |
| Step 6 -- NUMA allocation policy          | **Active** on Linux. Local allocation via `libnuma` if available                        |
| Step 7 -- Workspace allocation            | **Active**. Thread-local solver workspaces allocated with first-touch NUMA placement    |
| Step 8 -- Startup logging                 | **Modified**. Logs to Python's `logging` module instead of stdout; reports thread count |

### 1.2a Multi-Process Execution

When `num_workers > 1` is requested (or when a non-local backend is explicitly selected), `cobre-python` operates in multi-process mode. The parent Python process spawns `num_workers` child processes via `multiprocessing.Process` (with `start_method="spawn"`). Each worker process is a fully independent Python interpreter that executes the same initialization steps as SS1.2 above, with the following differences:

| Standard Step (SS6)                       | Multi-Process Worker Mode                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1 -- MPI initialization              | **Replaced**. Creates a `TcpBackend` or `ShmBackend` instead of `LocalBackend`, depending on the selected backend (see SS7.5)         |
| Step 2 -- Topology detection              | **Replaced**. Rank and size are assigned by the parent process via function arguments, not by a scheduler                             |
| Step 3 -- Shared memory communicator      | **Replaced**. For `ShmBackend`, the POSIX shared memory segment provides true shared memory. For `TcpBackend`, `HeapFallback` is used |
| Step 4 -- OpenMP configuration            | **Active**. Each worker reads `OMP_NUM_THREADS` independently; defaults to physical core count divided by `num_workers`               |
| Step 5 -- LP solver threading suppression | **Active**. Same as single-process mode                                                                                               |
| Step 6 -- NUMA allocation policy          | **Active** on Linux. Each worker process has its own NUMA allocation policy                                                           |
| Step 7 -- Workspace allocation            | **Active**. Each worker allocates its own thread-local solver workspaces                                                              |
| Step 8 -- Startup logging                 | **Modified**. Each worker logs to Python's `logging` module with its rank prefix; parent process aggregates status                    |

This maps to the single-process mode described in [Hybrid Parallelism](../hpc/hybrid-parallelism.md) SS1.0a, extended to multiple cooperating processes that communicate via a non-MPI backend. The parent process is the orchestrator: it spawns workers, waits for completion, and collects results. It does not participate in the SDDP computation.

### 1.3 OpenMP Thread Control

Users control the thread count via environment variable or Python API:

```python
import os
os.environ["OMP_NUM_THREADS"] = "16"  # Before first cobre call

import cobre
cobre.set_threads(16)   # Alternative: runtime setter (calls omp_set_num_threads)
print(cobre.get_threads())  # Query active thread count
```

The `set_threads()` call must occur before the first `train()` or `simulate()` invocation. Calling it after computation has begun is a no-op with a warning logged.

## 2. Python API Surface

All public APIs are exposed under the top-level `cobre` module. No submodules are required for the initial release; the flat namespace keeps imports simple.

### 2.1 Top-Level Functions

#### `cobre.train()`

Trains an SDDP policy for a loaded case.

```python
def train(
    case: Case,
    config_overrides: dict | None = None,
    progress_callback: Callable[[ProgressEvent], None] | None = None,
    backend: str = "auto",
    num_workers: int = 1,
) -> TrainingResult:
    """Train an SDDP policy.

    Loads the case data, builds the LP subproblems, and runs the SDDP
    training loop until a stopping rule fires. The GIL is released during
    all Rust computation (see SS3).

    When num_workers > 1, the library spawns num_workers child processes
    via multiprocessing.Process (with start_method="spawn") and
    coordinates them using the selected communication backend. Each
    worker process runs the full SDDP training loop independently,
    communicating via the backend's transport (TCP sockets or POSIX
    shared memory). The parent process does not participate in
    computation -- it is a pure orchestrator. See SS2.1a for the
    complete worker lifecycle and SS7.4 for the multi-process
    architecture.

    When num_workers == 1 (the default), no child processes are spawned
    and the local backend is used regardless of the backend parameter.

    Args:
        case: A loaded case object returned by CaseLoader.load().
        config_overrides: Optional dictionary of configuration overrides.
            Keys match the config.json schema fields. Example:
            {"stopping_rules": {"bound_stalling": {"tolerance": 0.001}}}.
        progress_callback: Optional callable invoked once per iteration
            with a ProgressEvent. The GIL is briefly reacquired for each
            callback invocation (see SS3 point 4). In multi-process mode,
            progress events from all workers are multiplexed into this
            single callback with worker_id disambiguation (see SS2.9).
        backend: Communication backend for multi-process execution.
            Accepted values: "auto", "shm", "tcp", "local". See SS7.5
            for the full backend selection table and auto-detection
            logic. When num_workers == 1, this parameter is ignored.
        num_workers: Number of worker processes for parallel SDDP
            execution. Must be >= 1. When 1 (default), runs in
            single-process mode. When > 1, spawns num_workers child
            processes (start_method="spawn"); the parent is the
            orchestrator and does not participate in SDDP computation.

    Returns:
        TrainingResult containing the trained policy and convergence history.
        In multi-process mode, the result is collected from rank 0
        (see SS2.1b).

    Raises:
        cobre.ValidationError: If config_overrides contain invalid values.
        cobre.SolverError: If an LP solve fails during training.
        cobre.WorkerError: If a worker process fails during multi-process
            training. Contains the rank, exit code, and inner error of the
            first failed worker (see SS6.1a).
        cobre.CobreError: If backend is not a recognized value, if
            num_workers < 1, or if start_method is set to "fork" when
            num_workers > 1. Also raised for unexpected internal errors.
    """
    ...
```

#### `cobre.simulate()`

Evaluates a trained policy on a scenario set.

```python
def simulate(
    case: Case,
    policy: Policy,
    config_overrides: dict | None = None,
    progress_callback: Callable[[ProgressEvent], None] | None = None,
    backend: str = "auto",
    num_workers: int = 1,
) -> SimulationResult:
    """Simulate a trained SDDP policy.

    Replays the policy on a configurable number of scenario trajectories
    and produces per-scenario, per-stage results.

    When num_workers > 1, the library spawns num_workers child processes
    to evaluate scenarios in parallel. Each worker evaluates a contiguous
    block of scenarios using the same policy. The parent process
    orchestrates spawning and result collection. See SS2.1a for the
    worker lifecycle.

    Args:
        case: A loaded case object returned by CaseLoader.load().
        policy: A trained policy from TrainingResult.policy or Policy.load().
        config_overrides: Optional dictionary of simulation configuration
            overrides. Example: {"simulation": {"scenarios": 5000}}.
        progress_callback: Optional callable invoked periodically with
            simulation progress. In multi-process mode, progress events
            from all workers are multiplexed into this single callback
            with worker_id disambiguation (see SS2.9).
        backend: Communication backend for multi-process execution.
            Accepted values: "auto", "shm", "tcp", "local". See SS7.5
            for the full backend selection table and auto-detection
            logic. When num_workers == 1, this parameter is ignored.
        num_workers: Number of worker processes for parallel simulation.
            Must be >= 1. When 1 (default), runs in single-process mode.
            When > 1, spawns num_workers child processes
            (start_method="spawn").

    Returns:
        SimulationResult containing simulation outputs and summary statistics.

    Raises:
        cobre.ValidationError: If config_overrides contain invalid values.
        cobre.SolverError: If an LP solve fails during simulation.
        cobre.WorkerError: If a worker process fails during multi-process
            simulation (see SS6.1a).
        cobre.CobreError: If backend is not a recognized value, if
            num_workers < 1, or if start_method is set to "fork" when
            num_workers > 1. Also raised for unexpected internal errors.
    """
    ...
```

#### SS2.1a Worker Lifecycle

When `num_workers > 1` is passed to `cobre.train()` or `cobre.simulate()`, the library executes the following lifecycle within the calling process (the parent/orchestrator):

1. **Validate parameters.** The library checks that `num_workers >= 1`, that `backend` is one of `"auto"`, `"shm"`, `"tcp"`, or `"local"`, and that `multiprocessing.get_start_method()` is not `"fork"`. If `start_method` has not been set, the library calls `multiprocessing.set_start_method("spawn")`. If it is already set to `"fork"`, the library raises `cobre.CobreError` with `kind="IncompatibleSettings"` and a message explaining that `"fork"` is prohibited (see SS7.1 for the rationale).

2. **Resolve backend.** If `backend="auto"`, the library applies the auto-detection logic from SS7.5: if `COBRE_TCP_COORDINATOR` is set in the environment, select `"tcp"`; otherwise select `"shm"`.

3. **Generate backend-specific configuration.** The library generates the transport parameters that workers will use to find each other:
   - For `"shm"`: generates a unique POSIX shared memory segment name (e.g., `/cobre_comm_<random_hex>`).
   - For `"tcp"`: starts a TCP coordinator listener on an ephemeral port and records the coordinator address and port separately (`COBRE_TCP_COORDINATOR=127.0.0.1`, `COBRE_TCP_PORT=<port>`; see [TCP Backend](../hpc/backend-tcp.md) §8.1).

4. **Spawn worker processes.** The library spawns `num_workers` child processes via `multiprocessing.Process(target=_worker_entry, args=(rank, ...))`. Each child process receives its rank (0 through `num_workers - 1`), the backend-specific configuration from step 3, the case data, and a reference to a `multiprocessing.Queue` for result collection.

5. **Each worker initializes.** Inside the child process, the worker:
   - Imports the `cobre` module (fresh Python interpreter due to `"spawn"`).
   - Creates a backend-specific `Communicator` for its assigned rank (e.g., `ShmBackend` with the shared segment name, or `TcpBackend` connecting to the coordinator address).
   - Runs the SDDP training loop (or simulation loop) with the `Communicator` handling all inter-worker collective operations.
   - On completion, rank 0 places the `TrainingResult` (or `SimulationResult`) onto the `multiprocessing.Queue`.

6. **Parent waits for completion.** The parent process calls `Process.join()` on each worker process. If any worker process exits with a non-zero exit code or raises an exception, the parent terminates remaining workers via `Process.terminate()` and raises `cobre.WorkerError` (see SS6.1a).

7. **Parent collects result.** The parent reads the result from the `multiprocessing.Queue` (placed there by rank 0 in step 5) and returns it to the caller.

The per-rank worker invocation pattern for the `"shm"` backend -- including `multiprocessing.Process` spawn, rank assignment, and shared memory segment naming -- is demonstrated in [Shared Memory Backend](../hpc/backend-shm.md) SS7.3. `cobre.train()` performs steps 1-7 internally, automating the boilerplate shown in that example.

#### SS2.1b Multi-Process Result Collection

When `num_workers > 1`, the result returned by `cobre.train()` or `cobre.simulate()` is collected from rank 0 only. The rationale and semantics are:

1. **Rank 0's result is authoritative.** All ranks converge to the same SDDP policy (identical cut pools after `allgatherv` synchronization at each iteration). The `TrainingResult` from any rank would contain the same policy and the same final bounds. Rank 0 is chosen by convention, consistent with the coordinator role in both the TCP backend ([TCP Backend](../hpc/backend-tcp.md) SS1.1) and the shm backend.

2. **`convergence_history` comes from rank 0.** The Arrow table in `TrainingResult.convergence_history` is produced by rank 0's convergence monitoring loop. All ranks compute identical lower bounds (from the same first-stage LP) and contribute to the same upper bound statistics (aggregated via `allreduce`), so rank 0's history is representative of the global convergence trajectory.

3. **`workers` metadata is available.** When `num_workers > 1`, the `TrainingResult.workers` property returns a list of `WorkerInfo` dataclass instances (one per worker) containing per-worker metadata. See SS2.7 for the property definition.

#### `cobre.validate()`

Validates a case directory without executing the solver.

```python
def validate(path: str | os.PathLike) -> ValidationResult:
    """Validate a case directory.

    Runs the 5-layer validation pipeline (structural, schema, referential,
    dimensional, semantic) and returns all errors and warnings.

    Args:
        path: Path to the case directory.

    Returns:
        ValidationResult with errors and warnings lists.

    Raises:
        cobre.IOError: If the path does not exist or is not readable.
    """
    ...
```

#### `cobre.set_threads()` / `cobre.get_threads()`

```python
def set_threads(n: int) -> None:
    """Set the number of OpenMP threads for computation.

    Must be called before the first train() or simulate() call.
    Calls omp_set_num_threads(n) on the Rust side.

    Args:
        n: Number of threads. Must be >= 1.
    """
    ...

def get_threads() -> int:
    """Return the current OpenMP thread count."""
    ...
```

### 2.2 CaseLoader

```python
class CaseLoader:
    """Loads and validates a Cobre case directory.

    The loader reads the directory structure, parses JSON and Parquet input
    files, resolves cascaded defaults, validates cross-references, and
    produces a Case object ready for training or simulation.
    """

    @staticmethod
    def load(path: str | os.PathLike) -> Case:
        """Load a case directory.

        Runs the full input loading pipeline including validation.

        Args:
            path: Path to the case directory containing config.json.

        Returns:
            A validated Case object.

        Raises:
            cobre.ValidationError: If validation fails (errors found).
            cobre.IOError: If required files are missing or unreadable.
        """
        ...
```

### 2.3 Case

```python
class Case:
    """An immutable, validated Cobre case.

    Provides read-only access to the resolved internal structures:
    system entities, configuration, scenario parameters, and topology.
    """

    @property
    def config(self) -> dict:
        """Case configuration as a dictionary (matching config.json schema)."""
        ...

    @property
    def stages(self) -> int:
        """Number of stages in the study."""
        ...

    @property
    def hydros(self) -> list[HydroPlant]:
        """List of hydro plant entities."""
        ...

    @property
    def thermals(self) -> list[ThermalUnit]:
        """List of thermal unit entities."""
        ...

    @property
    def buses(self) -> list[Bus]:
        """List of bus entities."""
        ...

    @property
    def lines(self) -> list[Line]:
        """List of transmission line entities."""
        ...

    @property
    def topology(self) -> dict:
        """System topology as adjacency data.

        Returns a dict with keys 'buses', 'lines', 'cascade' describing
        the network connectivity and hydro cascade structure.
        """
        ...

    @property
    def par_model(self) -> PARModel:
        """The periodic autoregressive model for this case."""
        ...
```

### 2.4 Entity Classes

All entity classes are read-only `#[pyclass]` wrappers. Fields are exposed as Python attributes via `#[pyo3(get)]`.

```python
class HydroPlant:
    """Read-only hydro plant entity."""
    id: str
    name: str
    bus_id: str
    storage_min: float          # hm3
    storage_max: float          # hm3
    initial_storage: float      # hm3
    turbine_min: float          # m3/s
    turbine_max: float          # m3/s
    spillage_cost: float
    downstream_hydro_id: str | None
    water_travel_time: int      # stages
    fpha_coefficients: numpy.ndarray  # FPHA hyperplane coefficients (not 'gamma')
    productivity: float         # MW/(m3/s), constant model
    # ... additional fields per input-system-entities.md

class ThermalUnit:
    """Read-only thermal unit entity."""
    id: str
    name: str
    bus_id: str
    generation_min: float       # MW
    generation_max: float       # MW
    cost: float                 # $/MWh (or per-stage array)
    # ... additional fields per input-system-entities.md

class Bus:
    """Read-only bus entity."""
    id: str
    name: str
    subsystem: str
    # ... additional fields per input-system-entities.md

class Line:
    """Read-only transmission line entity."""
    id: str
    name: str
    from_bus_id: str
    to_bus_id: str
    capacity_forward: float     # MW
    capacity_backward: float    # MW
    # ... additional fields per input-system-entities.md
```

> **Note on naming**: The `fpha_coefficients` attribute uses a descriptive name to avoid ambiguity with the pumping power rate, which also uses the symbol $\gamma$ in the mathematical formulation. Python-facing names always prefer clarity over brevity.

### 2.5 PARModel

```python
class PARModel:
    """Periodic autoregressive model for inflow generation.

    Wraps the PAR(p) model from cobre-stochastic with NumPy interfaces
    for parameters and noise sampling.
    """

    @property
    def order(self) -> int:
        """Maximum AR order across all entities and seasons."""
        ...

    @property
    def n_entities(self) -> int:
        """Number of entities (hydro plants) in the model."""
        ...

    @property
    def n_seasons(self) -> int:
        """Number of seasons (typically 12 for monthly)."""
        ...

    def seasonal_means(self, entity_index: int) -> numpy.ndarray:
        """Return seasonal means for a given entity.

        Args:
            entity_index: Zero-based entity index.

        Returns:
            numpy.ndarray of shape (n_seasons,) with seasonal mean inflows.
            Zero-copy: backed by the Rust contiguous array.
        """
        ...

    def ar_coefficients(self, entity_index: int, season: int) -> numpy.ndarray:
        """Return AR coefficients for a given entity and season.

        Args:
            entity_index: Zero-based entity index.
            season: Zero-based season index.

        Returns:
            numpy.ndarray of shape (order,) with AR coefficients phi_1, ..., phi_p.
            Zero-copy: backed by the Rust contiguous array.
        """
        ...

    def correlation_matrix(self, season: int) -> numpy.ndarray:
        """Return the spatial correlation matrix for a season.

        Args:
            season: Zero-based season index.

        Returns:
            numpy.ndarray of shape (n_entities, n_entities).
            Zero-copy: backed by the Rust contiguous array.
        """
        ...
```

### 2.6 Stochastic Functions

```python
def sample_noise(
    n_samples: int,
    correlation_matrix: numpy.ndarray,
    rng_seed: int | None = None,
) -> numpy.ndarray:
    """Sample correlated noise vectors.

    Generates n_samples correlated noise vectors using the Cholesky
    decomposition of the correlation matrix.

    Args:
        n_samples: Number of samples to generate.
        correlation_matrix: numpy.ndarray of shape (n_entities, n_entities).
        rng_seed: Optional random seed for reproducibility.

    Returns:
        numpy.ndarray of shape (n_samples, n_entities).
    """
    ...

class OpeningTree:
    """Read-only opening tree for backward pass scenarios.

    The opening tree is a 3D array of noise realizations used in the
    backward pass to evaluate the expected future cost function.
    """

    @property
    def data(self) -> numpy.ndarray:
        """The opening tree as a NumPy array.

        Returns:
            numpy.ndarray of shape (n_openings, n_stages, n_entities).
            Zero-copy: backed by the Rust contiguous 3D array.
        """
        ...

    @property
    def n_openings(self) -> int:
        """Number of openings (backward scenarios)."""
        ...

    @property
    def n_stages(self) -> int:
        """Number of stages."""
        ...

    @property
    def n_entities(self) -> int:
        """Number of entities."""
        ...

def load_external_scenarios(path: str | os.PathLike) -> pyarrow.Table:
    """Load external scenario data from a Parquet file.

    Reads a Parquet file containing externally generated scenario data
    and returns it as an Arrow table (zero-copy via Arrow FFI).

    Args:
        path: Path to the Parquet file.

    Returns:
        pyarrow.Table with scenario data columns.

    Raises:
        cobre.IOError: If the file does not exist or is unreadable.
    """
    ...
```

### 2.7 TrainingResult

```python
class TrainingResult:
    """Result of an SDDP training run."""

    @property
    def policy(self) -> Policy:
        """The trained policy (cut collection)."""
        ...

    @property
    def convergence_history(self) -> pyarrow.Table:
        """Convergence history as an Arrow table.

        Columns match the per-iteration output record from
        convergence-monitoring.md SS2.4:
        iteration, lower_bound, upper_bound, upper_bound_std,
        ci_95, gap, wall_time_ms, iteration_time_ms.

        Zero-copy: transferred via Arrow FFI.
        """
        ...

    @property
    def iterations(self) -> int:
        """Total number of training iterations completed."""
        ...

    @property
    def final_lower_bound(self) -> float:
        """Final lower bound value."""
        ...

    @property
    def final_upper_bound(self) -> float:
        """Final upper bound value."""
        ...

    @property
    def final_gap(self) -> float:
        """Final relative convergence gap."""
        ...

    @property
    def termination_reason(self) -> str:
        """Stopping rule that triggered termination.

        One of: 'bound_stalling', 'simulation', 'iteration_limit',
        'time_limit', 'shutdown'.
        """
        ...

    @property
    def total_cuts(self) -> int:
        """Total Benders cuts generated across all stages."""
        ...

    @property
    def workers(self) -> list[WorkerInfo] | None:
        """Per-worker metadata for multi-process training runs.

        Returns a list of WorkerInfo instances (one per worker, ordered
        by rank) when the training run used num_workers > 1. Returns
        None when num_workers == 1 (single-process mode).
        """
        ...


class WorkerInfo:
    """Metadata for a single worker process in a multi-process run.

    Instances are created by the library during result collection
    (SS2.1b) and are read-only.
    """

    @property
    def rank(self) -> int:
        """Worker rank index (0-based), as assigned during spawning (SS2.1a step 4)."""
        ...

    @property
    def wall_time_ms(self) -> int:
        """Wall-clock time for this worker in milliseconds.

        Measured from the start of the worker's SDDP computation
        (after Communicator initialization) to the end of its
        training loop. Does not include process spawn overhead.
        """
        ...

    @property
    def backend(self) -> str:
        """Communication backend used by this worker.

        One of: 'shm', 'tcp', 'local'. Reflects the actual
        backend selected after auto-detection resolution.
        """
        ...
```

### 2.8 SimulationResult

```python
class SimulationResult:
    """Result of an SDDP simulation run."""

    @property
    def scenarios(self) -> int:
        """Number of simulation scenarios evaluated."""
        ...

    @property
    def output_directory(self) -> str:
        """Path to the output directory containing Parquet files.

        Users can read simulation results directly from the Parquet files
        using polars or pyarrow:
            import polars as pl
            costs = pl.read_parquet(f"{result.output_directory}/simulation/costs.parquet")
        """
        ...

    @property
    def output_files(self) -> list[str]:
        """List of output Parquet file paths (relative to output_directory)."""
        ...

    @property
    def mean_cost(self) -> float:
        """Mean total cost across all simulation scenarios."""
        ...

    @property
    def std_cost(self) -> float:
        """Standard deviation of total costs across scenarios."""
        ...

    @property
    def wall_time_ms(self) -> int:
        """Simulation wall-clock time in milliseconds."""
        ...
```

### 2.9 Progress Callbacks

```python
class ProgressEvent:
    """Progress event emitted during training or simulation.

    Training events carry convergence data matching the per-iteration
    record from convergence-monitoring.md SS2.4. Simulation events carry
    scenario completion counts.
    """

    @property
    def phase(self) -> str:
        """Phase: 'training' or 'simulation'."""
        ...

    # Training-phase fields (None during simulation)
    @property
    def iteration(self) -> int | None:
        """Current iteration (1-based). None during simulation."""
        ...

    @property
    def lower_bound(self) -> float | None:
        """Current lower bound. None during simulation."""
        ...

    @property
    def upper_bound(self) -> float | None:
        """Current upper bound. None during simulation."""
        ...

    @property
    def gap(self) -> float | None:
        """Current relative gap. None during simulation."""
        ...

    @property
    def wall_time_ms(self) -> int:
        """Cumulative wall-clock time in milliseconds."""
        ...

    @property
    def iteration_time_ms(self) -> int | None:
        """Time for this iteration in milliseconds. None during simulation."""
        ...

    # Simulation-phase fields (None during training)
    @property
    def scenarios_complete(self) -> int | None:
        """Scenarios completed so far. None during training."""
        ...

    @property
    def scenarios_total(self) -> int | None:
        """Total scenarios to simulate. None during training."""
        ...

    # Multi-process fields
    @property
    def worker_id(self) -> int | None:
        """Worker rank (0-based) that emitted this event.

        None in single-process mode. In multi-process mode, progress
        events from all workers are multiplexed into the single
        progress_callback stream; this field disambiguates the source.
        Events are delivered in arrival order across workers; events
        from the same worker are in iteration order.
        """
        ...
```

### 2.10 ValidationResult

```python
class ValidationResult:
    """Result of a case directory validation."""

    @property
    def valid(self) -> bool:
        """True if no errors were found (warnings are allowed)."""
        ...

    @property
    def errors(self) -> list[ValidationRecord]:
        """List of validation error records."""
        ...

    @property
    def warnings(self) -> list[ValidationRecord]:
        """List of validation warning records."""
        ...

    @property
    def layers_completed(self) -> int:
        """Number of validation layers fully completed (1-5)."""
        ...


class ValidationRecord:
    """A single validation error or warning.

    Fields match the structured error schema from structured-output.md SS2.1.
    """

    @property
    def kind(self) -> str:
        """Error kind identifier from the registry."""
        ...

    @property
    def message(self) -> str:
        """Human-readable error description."""
        ...

    @property
    def context(self) -> dict:
        """Structured context data (file, entity_id, field, etc.)."""
        ...

    @property
    def suggestion(self) -> str | None:
        """Actionable remediation hint, or None."""
        ...
```

### 2.11 API Surface Summary

| Source Crate     | Python Classes / Functions                                                                             | Exposed? |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| cobre-core       | `HydroPlant`, `ThermalUnit`, `Bus`, `Line`, `Case` (read-only entities and topology)                   | Yes      |
| cobre-io         | `CaseLoader.load()`, `validate()`, `ValidationResult`, `ValidationRecord`                              | Yes      |
| cobre-stochastic | `PARModel`, `OpeningTree`, `sample_noise()`, `load_external_scenarios()`                               | Yes      |
| cobre-sddp       | `train()`, `simulate()`, `Policy`, `TrainingResult`, `SimulationResult`, `ProgressEvent`, `WorkerInfo` | Yes      |
| cobre-python     | `WorkerError` (exception class, see SS6.1a)                                                            | Yes      |
| cobre-solver     | (none)                                                                                                 | **No**   |
| ferrompi         | (none)                                                                                                 | **No**   |

## 3. GIL Management Contract

The Global Interpreter Lock (GIL) is the central concurrency constraint at the Python/Rust boundary. The following 6-point contract governs all interactions between Python and Cobre's Rust computation.

### 3.1 The 6-Point GIL Contract

1. **GIL acquired to receive Python call and validate arguments.** When Python calls a PyO3-wrapped function (e.g., `train()`), the GIL is held. PyO3 validates and converts arguments from Python objects to Rust types.

2. **Thread state detached via `py.allow_threads()` before entering Rust computation.** Before invoking any Rust computation (LP solves, cut generation, scenario sampling), the binding code calls `py.allow_threads(|| { ... })` to detach from the Python runtime. On GIL-enabled builds, this releases the GIL, allowing other Python threads to execute. On free-threaded builds (see SS7.5a), this detaches the thread state, preventing the thread from blocking stop-the-world synchronization events (GC, tracing). The same code is correct on both build types.

3. **No Rust thread within an OpenMP parallel region ever acquires the GIL.** OpenMP threads spawned during the training or simulation loop are pure Rust/C threads. They never call back into Python, never acquire the GIL, and never touch `PyObject` references. This is guaranteed by construction: the OpenMP callback trampoline pattern ([Hybrid Parallelism](../hpc/hybrid-parallelism.md) SS5.3) calls Rust closures that have no access to `Python<'_>` tokens.

4. **GIL reacquired to convert results to Python objects on return.** When Rust computation completes, `py.allow_threads()` returns, reacquiring the GIL. The binding code converts Rust results to Python objects (NumPy arrays, dicts, PyO3 class instances).

5. **No Python callbacks into the hot loop.** All customization is via configuration (`config_overrides` dict), not runtime callbacks. The optional `progress_callback` is invoked only at iteration boundaries (outside the LP solve parallel regions) with the GIL briefly reacquired.

6. **In multi-process mode, each worker process has its own Python interpreter and GIL.** Every worker spawned via `multiprocessing.Process` with `start_method="spawn"` runs a fresh Python interpreter with an independent GIL. The GIL contract (points 1-5) applies independently within each worker process. There is no GIL contention between workers because they are separate OS processes -- each worker releases its own GIL before entering Rust computation, and no GIL state is shared across process boundaries.

### 3.2 GIL State Transitions During `train()`

The following timeline shows GIL state transitions during a complete `train()` call:

```
Python thread                     Rust / OpenMP threads
=============                     =====================

train(case, config)
  |
  +-- [GIL HELD] --------+
  |   Validate arguments  |
  |   Convert Python args |
  |   to Rust types       |
  +-- py.allow_threads() -+
  |                        \
  |   [GIL RELEASED]       +-- Initialize training loop
  |                        |   Allocate solver workspaces
  |                        |
  |                        +-- for iteration = 1..N:
  |                        |     |
  |                        |     +-- [OpenMP] Forward pass
  |                        |     |   (parallel LP solves, no GIL)
  |                        |     |
  |                        |     +-- Forward sync (local, no MPI)
  |                        |     |
  |                        |     +-- [OpenMP] Backward pass
  |                        |     |   (parallel LP solves, no GIL)
  |                        |     |
  |                        |     +-- Convergence check
  |                        |     |
  |                        |     +-- [if callback] ----+
  |   [GIL REACQUIRED]  <-|-----+   Reacquire GIL     |
  |   Invoke callback     -|-----+   Call Python fn    |
  |   [GIL RELEASED]    ->|-----+   Release GIL       |
  |                        |     +---------------------+
  |                        |     |
  |                        |     +-- [if converged] break
  |                        |
  |                        +-- Collect results
  +-- [GIL REACQUIRED] ---/
  |   Convert results to  |
  |   Python objects       |
  +------------------------+
  |
  return TrainingResult
```

### 3.2a GIL State Transitions During Multi-Process `train()`

When `num_workers > 1`, the parent process spawns child processes and waits for results. Each child process follows the single-process GIL flow from SS3.2 independently. The following timeline shows the parent and worker GIL state transitions:

```
Parent Process                    Worker Processes (spawned)
==============                    =========================

train(case, num_workers=N)
  |
  +-- [GIL HELD] -----------+
  |   Validate arguments     |
  |   Check start_method     |
  |   Resolve backend        |
  |   Generate backend config|
  +-- [GIL HELD] -----------+
  |   Spawn N workers via    |
  |   multiprocessing.Process|
  +--------------------------+
  |                           \
  |                            +---> Worker 0           Worker 1  ...  Worker N-1
  |                            |     ==========         ==========     ==========
  |                            |
  |                            |     [NEW INTERPRETER]  [NEW INTERPRETER]
  |                            |     [OWN GIL]          [OWN GIL]
  |                            |       |                  |
  |                            |     [GIL HELD]         [GIL HELD]
  |                            |     Import cobre       Import cobre
  |                            |     Create Communicator Create Communicator
  |                            |       |                  |
  |                            |     py.allow_threads() py.allow_threads()
  |                            |       |                  |
  |                            |     [GIL RELEASED]     [GIL RELEASED]
  |                            |     SDDP loop          SDDP loop
  |                            |     (SS3.2 flow)       (SS3.2 flow)
  |                            |     allgatherv <------> allgatherv
  |                            |     allreduce  <------> allreduce
  |                            |       |                  |
  |  [GIL HELD]                |     [if callback]      [if callback]
  |  Process.join() blocks     |     Reacquire own GIL  Reacquire own GIL
  |  (waiting for workers)     |     Call callback      Call callback
  |                            |     (worker_id=0)      (worker_id=1)
  |                            |     Release own GIL    Release own GIL
  |                            |       |                  |
  |                            |     [if converged]     [if converged]
  |                            |     Put result on Q    (no result)
  |                            |     Process exits      Process exits
  |                            |       |                  |
  +-- join() returns ----------+-------+------------------+
  |   [GIL HELD]               |
  |   Read result from Queue   |
  |   Build TrainingResult     |
  |   Attach WorkerInfo list   |
  +----------------------------+
  |
  return TrainingResult
```

**Key observations:**

- Each worker has its own Python interpreter and its own GIL. Releasing one worker's GIL has no effect on other workers or the parent.
- Worker-to-worker communication (allgatherv, allreduce) occurs entirely in Rust within the GIL-released section of each worker. No Python objects cross process boundaries during SDDP computation.
- Progress callbacks are invoked by each worker independently; the parent multiplexes them via `multiprocessing.Queue` with a `worker_id` field (see SS2.9).

### 3.3 Progress Callback GIL Protocol

When a `progress_callback` is provided, the GIL is reacquired at each iteration boundary -- **outside** any OpenMP parallel region -- to invoke the callback. The sequence per iteration is:

1. All OpenMP threads complete the backward pass and join (implicit barrier).
2. The main Rust thread reacquires the GIL via `Python::with_gil(|py| { ... })`.
3. The `ProgressEvent` is constructed as a Python object.
4. The callback is invoked with the event.
5. The GIL is released again before the next iteration begins.

This ensures that callback execution is serialized and does not interfere with parallel computation. The overhead is one GIL acquire/release pair per iteration, which is negligible compared to the iteration's computation time.

> **Invariant**: The progress callback is the only code path that reacquires the GIL during a `train()` or `simulate()` call. If no callback is provided, the GIL remains released for the entire computation.

## 4. Zero-Copy Data Paths

Zero-copy transfer avoids duplicating large arrays when passing data between Rust and Python. Cobre uses two mechanisms: PyO3's `numpy` crate for contiguous `f64` arrays, and Arrow FFI for tabular data.

### 4.1 Zero-Copy Mechanisms

| Data                   | Rust Type                                   | Python Type                           | Mechanism              | Copy Required? |
| ---------------------- | ------------------------------------------- | ------------------------------------- | ---------------------- | -------------- |
| Scenario noise vectors | `Vec<f64>` (contiguous)                     | `numpy.ndarray`                       | PyO3 `numpy` crate     | **No**         |
| Opening tree           | 3D contiguous `f64` array                   | `numpy.ndarray`                       | PyO3 `numpy` crate     | **No**         |
| Cut coefficients       | `Vec<f64>` per stage                        | `numpy.ndarray`                       | PyO3 `numpy` crate     | **No**         |
| PAR parameters         | Contiguous `f64` arrays                     | `numpy.ndarray`                       | PyO3 `numpy` crate     | **No**         |
| Convergence history    | `Vec<ConvergenceRecord>` (struct-of-arrays) | `pyarrow.Table`                       | Arrow FFI (`arrow-rs`) | **No**         |
| Simulation results     | Parquet files on disk                       | `polars.DataFrame` or `pyarrow.Table` | Python reads directly  | **No** (disk)  |

### 4.2 NumPy Zero-Copy Details

For contiguous `f64` arrays, the PyO3 `numpy` crate creates a `numpy.ndarray` that directly references the Rust-owned memory. The Rust `Vec<f64>` is moved into a `PyArray` that takes ownership, ensuring the backing memory lives as long as the Python object.

```rust
// Rust side (illustrative)
fn cuts_coefficients(py: Python<'_>, stage: usize) -> PyResult<Py<PyArray2<f64>>> {
    let coeffs: Vec<f64> = self.inner.cut_coefficients(stage);
    let n_cuts = self.inner.cut_count(stage);
    let n_states = self.inner.state_dimension();
    let array = PyArray2::from_vec2(py, &coeffs, [n_cuts, n_states])?;
    Ok(array.into())
}
```

**Lifetime rule**: Once a NumPy array is created from Rust data, the Rust `Vec` is consumed. The Python garbage collector manages the array's lifetime. No Rust lifetimes cross the Python boundary.

### 4.3 Arrow FFI Details

For tabular data (convergence history), Cobre uses the Arrow FFI bridge between `arrow-rs` (Rust) and `pyarrow` (Python). This transfers Arrow `RecordBatch` objects without copying column data.

```rust
// Rust side (illustrative)
fn convergence_history(py: Python<'_>) -> PyResult<PyObject> {
    let batches: Vec<RecordBatch> = self.inner.convergence_batches();
    // Export via Arrow FFI (C Data Interface)
    let py_table = arrow_to_pyarrow(py, &batches)?;
    Ok(py_table)
}
```

**Column mapping**: The Arrow table columns correspond to the [Convergence Monitoring](../architecture/convergence-monitoring.md) SS2.4 per-iteration record fields:

| Arrow Column        | Data Type | Description                         |
| ------------------- | --------- | ----------------------------------- |
| `iteration`         | `Int32`   | Iteration index (1-based)           |
| `lower_bound`       | `Float64` | Lower bound value                   |
| `upper_bound`       | `Float64` | Upper bound value (mean forward)    |
| `upper_bound_std`   | `Float64` | Standard deviation of forward costs |
| `ci_95`             | `Float64` | 95% confidence interval half-width  |
| `gap`               | `Float64` | Relative gap                        |
| `wall_time_ms`      | `Int64`   | Cumulative wall-clock time (ms)     |
| `iteration_time_ms` | `Int64`   | Iteration wall-clock time (ms)      |

### 4.4 Simulation Results: Python Reads Directly

Simulation outputs are written as Hive-partitioned Parquet files to disk. Python users read these directly with their preferred Parquet library. No Rust-to-Python data transfer is needed.

```python
result = cobre.simulate(case, policy)

# Read with polars (recommended for performance)
import polars as pl
costs = pl.read_parquet(f"{result.output_directory}/simulation/costs.parquet")

# Read with pyarrow
import pyarrow.parquet as pq
hydros = pq.read_table(f"{result.output_directory}/simulation/hydros.parquet")
```

This approach avoids keeping large simulation datasets in Rust memory and leverages Python's mature Parquet ecosystem.

## 5. FlatBuffers Policy Access

The `Policy` class provides a high-level Python API for inspecting SDDP policies stored in FlatBuffers format. FlatBuffers internals are not exposed to Python users.

### 5.1 Policy Class

```python
class Policy:
    """Trained SDDP policy (cut collection).

    Provides read-only access to the piecewise-linear future cost function
    approximation stored as Benders cuts. Internally backed by FlatBuffers
    binary data, but the Python API exposes only Python-native types.
    """

    @staticmethod
    def load(path: str | os.PathLike) -> Policy:
        """Load a policy from a directory.

        Reads the FlatBuffers policy files from the given directory
        (the 'policy/' subdirectory of a training output).

        Args:
            path: Path to the policy directory.

        Returns:
            A Policy object.

        Raises:
            cobre.IOError: If the path does not exist or files are corrupted.
        """
        ...

    def summary(self) -> dict:
        """Return policy summary statistics.

        Returns:
            Dictionary with keys:
            - 'stages': int -- Number of stages.
            - 'state_dimension': int -- Number of state variables (hydro plants).
            - 'total_cuts': int -- Total cuts across all stages.
            - 'cuts_per_stage': list[int] -- Cut count per stage.
            - 'active_cuts': int -- Number of active (non-dominated) cuts.
        """
        ...

    def cuts(self, stage: int) -> dict:
        """Return cut data for a specific stage.

        Args:
            stage: Stage index (1-based, matching SDDP convention).

        Returns:
            Dictionary with keys:
            - 'intercepts': numpy.ndarray of shape (n_cuts,)
                  The alpha_k coefficients (RHS constants).
                  Zero-copy: backed by Rust memory.
            - 'coefficients': numpy.ndarray of shape (n_cuts, n_states)
                  The beta_k coefficient matrix.
                  Row k contains the subgradient for cut k.
                  Zero-copy: backed by Rust memory.
            - 'active': numpy.ndarray of shape (n_cuts,), dtype=bool
                  Whether each cut is currently active.

        Raises:
            IndexError: If stage is out of range.
        """
        ...

    def evaluate(self, state: numpy.ndarray) -> float:
        """Evaluate the future cost function at a given state.

        Computes max_k { alpha_k + beta_k^T * state } over all cuts.

        Args:
            state: numpy.ndarray of shape (n_states,) representing
                reservoir volumes (in hm3).

        Returns:
            The FCF value (maximum of all affine cut functions).

        Raises:
            ValueError: If state has incorrect dimension.
        """
        ...
```

### 5.2 Design Rationale

FlatBuffers are not exposed directly for several reasons:

1. **Usability**: Python users expect dicts, NumPy arrays, and simple types, not binary buffer protocols.
2. **Stability**: The FlatBuffers schema is an internal implementation detail subject to change. The `Policy` class provides a stable API.
3. **Safety**: Direct `memoryview` access to mmap'd FlatBuffers files could lead to use-after-free if the file is modified externally. The `Policy` class manages file lifetimes correctly.

For advanced users who need raw FlatBuffers access (e.g., for custom tooling), the underlying bytes can be exported:

```python
raw_bytes: bytes = policy.raw_bytes(stage=5)  # Copy of the FlatBuffers data
```

This returns a Python `bytes` object (a copy, not zero-copy) to avoid lifetime issues.

## 6. Error Handling

### 6.1 Exception Hierarchy

Cobre Python exceptions map from the structured error kind registry defined in [Structured Output](./structured-output.md) SS2.3. The hierarchy is:

```
Exception (Python built-in)
  +-- cobre.CobreError (base for all Cobre exceptions)
        +-- cobre.ValidationError
        +-- cobre.SolverError
        +-- cobre.IOError
        +-- cobre.WorkerError
```

### 6.1a Worker Error Handling

The `WorkerError` exception is raised by the parent process when a worker process fails during multi-process execution (`num_workers > 1`). It is a subclass of `CobreError` and carries information about the failed worker.

```python
class WorkerError(CobreError):
    """Raised when a worker process fails during multi-process execution.

    Wraps information about the first failure detected. Raised by the
    parent (orchestrator) process; remaining live workers are terminated.
    """

    @property
    def rank(self) -> int:
        """Rank of the failed worker (0-based).

        The rank of the first worker whose failure was detected by the
        parent process (rank assigned during spawning, SS2.1a step 4).
        """
        ...

    @property
    def exit_code(self) -> int | None:
        """Exit code of the failed worker process.

        The OS exit code returned by the worker process. None if the
        worker was terminated by a signal (e.g., SIGKILL, SIGSEGV)
        rather than exiting normally with a non-zero code.
        """
        ...

    @property
    def inner(self) -> CobreError | None:
        """The original exception from the failed worker, if available.

        When a worker raises a CobreError (or subclass) during execution,
        the exception is serialized via multiprocessing.Queue and attached
        here. None if the worker crashed without raising a Python-level
        exception (e.g., segfault, OOM kill, or a Rust panic that could
        not be translated).
        """
        ...
```

**Error propagation protocol:**

1. Each worker process runs inside a `try/except` block that catches all `CobreError` subclasses.
2. If a worker catches an exception, it places the exception onto a shared error `multiprocessing.Queue` along with its rank, then exits with a non-zero exit code.
3. The parent process monitors worker processes via `Process.join()`. When a worker exits with a non-zero exit code (or is terminated by a signal), the parent:
   a. Reads the error from the error queue (if available).
   b. Calls `Process.terminate()` on all remaining live workers.
   c. Calls `Process.join()` on all terminated workers (with a timeout) to clean up OS resources.
   d. Raises `cobre.WorkerError` with the `rank`, `exit_code`, and `inner` fields populated from the first detected failure.
4. If multiple workers fail concurrently, only the first detected failure is reported in the `WorkerError`. The `message` field notes that additional workers may have failed.

### 6.2 Exception Class Definitions

```python
class CobreError(Exception):
    """Base exception for all Cobre errors.

    All Cobre exceptions carry the structured error fields from the
    error schema (structured-output.md SS2.1).
    """

    @property
    def kind(self) -> str:
        """Error kind identifier from the registry."""
        ...

    @property
    def message(self) -> str:
        """Human-readable error description."""
        ...

    @property
    def context(self) -> dict:
        """Structured context data."""
        ...

    @property
    def suggestion(self) -> str | None:
        """Actionable remediation hint, or None."""
        ...

class ValidationError(CobreError):
    """Raised when input validation fails.

    Corresponds to the 14 validation error kinds from
    structured-output.md SS2.3.1: MissingFile, ParseError,
    SchemaViolation, TypeMismatch, OutOfRange, InvalidEnum,
    DuplicateId, MissingReference, CoverageMismatch, StageMismatch,
    IncompatibleSettings, PhysicalConstraint, CapacityViolation,
    PenaltyConsistency.

    When multiple validation errors are found, the exception carries
    the first error. The full list is available in ValidationResult.
    """
    ...

class SolverError(CobreError):
    """Raised when an LP solver fails during training or simulation.

    Corresponds to the 'SolverFailure' runtime error kind from
    structured-output.md SS2.3.2.
    """

    @property
    def stage(self) -> int | None:
        """Stage where the solver failed, if available."""
        ...

    @property
    def iteration(self) -> int | None:
        """Iteration where the solver failed, if available."""
        ...

    @property
    def solver_status(self) -> str | None:
        """Solver status string (e.g., 'infeasible', 'unbounded')."""
        ...

class IOError(CobreError):
    """Raised when I/O operations fail.

    Corresponds to 'OutputCorrupted' and 'OutputNotFound' runtime
    error kinds from structured-output.md SS2.3.2.

    Note: This is cobre.IOError, not the built-in Python IOError.
    The full qualified name avoids shadowing.
    """
    ...
```

### 6.3 Error Kind to Exception Mapping

| Error Kind (structured-output.md SS2.3) | Python Exception        | Notes                                   |
| --------------------------------------- | ----------------------- | --------------------------------------- |
| `MissingFile`                           | `cobre.ValidationError` | Missing input file                      |
| `ParseError`                            | `cobre.ValidationError` | Malformed JSON/Parquet                  |
| `SchemaViolation`                       | `cobre.ValidationError` | Schema mismatch                         |
| `TypeMismatch`                          | `cobre.ValidationError` | Wrong data type                         |
| `OutOfRange`                            | `cobre.ValidationError` | Numeric value out of bounds             |
| `InvalidEnum`                           | `cobre.ValidationError` | Invalid enum string                     |
| `DuplicateId`                           | `cobre.ValidationError` | Duplicate entity ID                     |
| `MissingReference`                      | `cobre.ValidationError` | Broken foreign key                      |
| `CoverageMismatch`                      | `cobre.ValidationError` | Incomplete dimensional coverage         |
| `StageMismatch`                         | `cobre.ValidationError` | Stage-related inconsistency             |
| `IncompatibleSettings`                  | `cobre.ValidationError` | Mutually incompatible settings          |
| `PhysicalConstraint`                    | `cobre.ValidationError` | Domain rule violation                   |
| `CapacityViolation`                     | `cobre.ValidationError` | Inconsistent capacity bounds            |
| `PenaltyConsistency`                    | `cobre.ValidationError` | Penalty ordering violation              |
| `SolverFailure`                         | `cobre.SolverError`     | LP solver returned unexpected status    |
| `MpiError`                              | `cobre.CobreError`      | Not applicable in Python (no MPI)       |
| `CheckpointFailed`                      | `cobre.CobreError`      | Checkpoint read/write failure           |
| `OutputCorrupted`                       | `cobre.IOError`         | Output file exists but is unreadable    |
| `OutputNotFound`                        | `cobre.IOError`         | Required output file missing            |
| `IncompatibleRuns`                      | `cobre.CobreError`      | Compared runs have incompatible configs |
| `WorkerFailed`                          | `cobre.WorkerError`     | Worker process failed (see SS6.1a)      |

### 6.4 Rust Panic Handling

If a Rust panic occurs during GIL-released computation (e.g., an OpenMP thread panics), the panic is caught at the Rust boundary by PyO3's panic-catching mechanism and translated to a `cobre.CobreError` with:

- `kind`: `"InternalPanic"`
- `message`: The panic message string
- `context`: `{"location": "<file>:<line>"}` if available
- `suggestion`: `"This is an internal error. Please report it with the full traceback."`

> **Invariant**: No Rust panic ever propagates across the FFI boundary as undefined behavior. PyO3 converts all panics to Python exceptions.

### 6.5 GIL Release Failure

A failure to release the GIL (i.e., `py.allow_threads()` failing) should never happen with correct PyO3 usage. If it occurs, it indicates a programming error in the binding code. This case is not a runtime-recoverable error; it manifests as a `pyo3::PanicException` with a diagnostic message.

## 7. Threading Model

### 7.1 Execution Mode Table

| Execution Mode                              | Supported         | Thread Count                   | GIL State During Computation      | Use Case                                        |
| ------------------------------------------- | ----------------- | ------------------------------ | --------------------------------- | ----------------------------------------------- |
| Single-process, single-thread               | Yes               | `OMP_NUM_THREADS=1`            | Released                          | Small problems, debugging                       |
| Single-process, OpenMP threads              | **Yes (default)** | `OMP_NUM_THREADS=N`            | Released                          | Production use from Python                      |
| Multi-process via `multiprocessing.Process` | Yes (optional)    | `OMP_NUM_THREADS=N` per worker | Released (per-worker independent) | Multi-worker SDDP via `multiprocessing.Process` |
| Multi-process via MPI                       | **No**            | --                             | --                                | Use `cobre` CLI via subprocess                  |

**`start_method` requirement:** Multi-process execution MUST use `multiprocessing.set_start_method("spawn")`. The `"fork"` start method is prohibited because `fork()` in a process with active OpenMP threads causes undefined behavior (POSIX fork-safety rules). The `"spawn"` method creates a fresh Python interpreter per worker, avoiding all fork-safety issues with OpenMP, POSIX locks, and GPU driver state.

### 7.2 MPI Prohibition Rationale

Multi-process SDDP execution from Python is fully supported via the TCP and shared-memory backends (see SS7.3, SS7.4, SS7.5). These backends provide inter-process communication without any MPI dependency, using standard OS primitives (TCP sockets, POSIX shared memory) that are fully compatible with Python's process model. The prohibition below applies exclusively to MPI -- not to distributed execution in general.

Python bindings MUST NOT initialize MPI. The prohibition rests on three independent technical reasons:

1. **`MPI_Init_thread` timing conflict.** ferrompi requires `MPI_Init_thread(MPI_THREAD_MULTIPLE)` as the very first MPI call ([Hybrid Parallelism](../hpc/hybrid-parallelism.md) SS6, Step 1). In a Python process, the interpreter initializes first. If the Python process attempts to initialize MPI via ferrompi, the MPI runtime may conflict with Python's signal handlers, thread state, and memory allocator. Some MPI implementations (OpenMPI, MPICH) are incompatible with being initialized after a Python interpreter is already running with threads.

2. **GIL vs `MPI_THREAD_MULTIPLE` deadlock risk.** `MPI_THREAD_MULTIPLE` means any thread can call MPI at any time. Python's GIL means only one thread can execute Python code at a time. When PyO3 holds the GIL to return results to Python, all other threads that might need to call MPI collective operations (e.g., `MPI_Allreduce`, `MPI_Allgatherv`) are blocked if they need to interact with Python. This creates a deadlock risk: MPI collectives require all ranks to participate, but the GIL serializes execution through Python.

3. **Dual-FFI-layer fragility.** Combining mpi4py (Python MPI bindings) with ferrompi (Rust MPI bindings) in the same process requires both to share the same `MPI_Comm` handle. Having two independent MPI FFI layers addressing the same MPI runtime is fragile and untested. The risk of ABI conflicts, double-free of communicators, or inconsistent threading levels is high.

### 7.3 Multi-Process Execution via Python

The recommended approach for multi-process SDDP from Python uses `multiprocessing.Process` with the shm or TCP backend. Each worker process is a separate Python interpreter that calls `cobre.train()` with backend-specific parameters. The workers communicate via the selected backend (TCP sockets or POSIX shared memory) -- not via Python IPC mechanisms.

**Architecture overview:**

```
  Parent Process (orchestrator)
  |
  |  multiprocessing.Process(target=run_rank, args=(rank,))
  |  start_method="spawn"
  |
  +---> Worker 0 (rank 0)    --+
  +---> Worker 1 (rank 1)    --+-- communicate via shm or TCP
  +---> Worker 2 (rank 2)    --+   (not Python IPC)
  +---> Worker 3 (rank 3)    --+
  |
  |  p.join() for all workers
  v
  Results available on disk (Parquet/FlatBuffers)
```

The complete Python code example for multi-process execution with the shm backend is provided in [Shared Memory Backend](../hpc/backend-shm.md) §7.3. That example demonstrates the high-level `cobre.train(num_workers=N, backend="shm")` call and the internal worker lifecycle.

For the TCP backend, the calling convention is identical: `cobre.train(case, num_workers=N, backend="tcp")`. The library auto-generates the TCP coordinator address and port internally. See [TCP Backend](../hpc/backend-tcp.md) §8.1 for the environment variables used by the library when configuring worker processes.

### 7.3a Subprocess + CLI Workflow (Secondary Option)

For users who need MPI-based distributed execution (multi-node with InfiniBand), or who prefer process isolation from the Python interpreter, the CLI subprocess workflow remains available:

```python
import subprocess
import polars as pl

# Step 1: Prepare case directory from Python
case_dir = "/data/my_study"
# ... write config.json, entity registries, scenario data ...

# Step 2: Launch distributed training via CLI
result = subprocess.run(
    ["mpiexec", "-n", "8", "cobre", "run", case_dir,
     "--output-format", "json"],
    capture_output=True, text=True, check=True,
)
import json
output = json.loads(result.stdout)

# Step 3: Read results from Parquet files
output_dir = output["data"]["output_directory"]
convergence = pl.read_parquet(f"{output_dir}/training/convergence.parquet")
costs = pl.read_parquet(f"{output_dir}/simulation/costs.parquet")
```

This workflow provides full MPI parallelism without any GIL/MPI interaction, and leverages the structured output protocol ([Structured Output](./structured-output.md) SS1) for programmatic result parsing. It is the only option for multi-node execution with MPI and InfiniBand interconnects.

### 7.4 Multi-Process Architecture

Each worker process in the multi-process execution model (SS7.3) has the following properties:

1. **Independent Python interpreter and GIL.** Every worker spawned via `multiprocessing.Process` with `start_method="spawn"` runs its own Python interpreter with its own GIL. There is zero GIL contention between workers -- each worker releases its own GIL independently before entering Rust computation.

2. **Per-worker `Communicator` instance.** Each worker calls into the PyO3 layer, which creates a backend-specific `Communicator` (either `TcpBackend` or `ShmBackend`). The `Communicator` is owned by the Rust side within the worker process. No `Communicator` state crosses the Python/Rust boundary.

3. **Parent process is orchestrator only.** The parent Python process spawns workers, waits for them to complete via `p.join()`, and reads results from disk. It does not participate in the SDDP computation and does not hold a `Communicator` instance.

4. **Workers communicate via the selected backend, not via Python IPC.** All inter-worker communication (cut sharing via `allgatherv`, bound synchronization via `allreduce`, barrier synchronization) occurs within the Rust layer through the backend's transport (TCP sockets or POSIX shared memory). Python's `multiprocessing.Queue`, `multiprocessing.Pipe`, and `multiprocessing.Value` are not used for SDDP data exchange.

5. **Independent OpenMP thread pools.** Each worker process has its own OpenMP runtime with its own thread pool. If the user sets `OMP_NUM_THREADS=N` before spawning, each worker creates `N` OpenMP threads. For optimal CPU utilization, the total thread count across all workers should not exceed the physical core count: `num_workers * OMP_NUM_THREADS <= num_physical_cores`.

### 7.5 Backend Selection from Python

The `backend` parameter in multi-process mode controls which communication backend each worker creates. The following values are accepted:

| `backend` Value | Behavior                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"auto"`        | **Default.** When `num_workers > 1`: selects `"shm"` for single-node execution; selects `"tcp"` if the `COBRE_TCP_COORDINATOR` environment variable is set                                         |
| `"shm"`         | Forces the shared-memory backend. Requires all workers on the same physical node. Each worker opens the same POSIX shared memory segment. See [Shared Memory Backend](../hpc/backend-shm.md) SS7.1 |
| `"tcp"`         | Forces the TCP backend. Requires a coordinator address (passed as a parameter or via `COBRE_TCP_COORDINATOR`). See [TCP Backend](../hpc/backend-tcp.md) SS8.1                                      |
| `"local"`       | Forces the local backend. Single-process mode; the `num_workers` parameter is ignored. All computation runs in the calling process                                                                 |

**Auto-detection logic** (when `backend="auto"` and `num_workers > 1`):

1. If `COBRE_TCP_COORDINATOR` is set in the environment, select `"tcp"`.
2. Otherwise, select `"shm"` (assumes single-node execution).

This is the Python-side equivalent of the priority chain defined in [Backend Registration and Selection](../hpc/backend-selection.md) SS2.2, simplified for the Python context where MPI is never available. The full auto-detection algorithm (including MPI detection) is documented in that section.

### 7.5a Future: Free-Threaded Python (PEP 703)

CPython 3.14 (October 2025) introduced officially supported free-threaded builds ([PEP 779](https://peps.python.org/pep-0779/)) where the GIL can be disabled, allowing true multi-threaded parallelism within a single Python process. This section documents the impact on Cobre's Python bindings and the conditions under which the design may evolve.

**Current status (Phase II):** Free-threaded Python is available as an optional, separate build (`python3.14t`). It is not the default. Importing a C extension not marked as free-thread-safe automatically re-enables the GIL for the process lifetime. The GIL-disabled default (Phase III) is estimated for Python ~3.17-3.18 (2028-2030) and requires a separate PEP.

**Impact on the 6-point GIL contract (SS3.1):** All six contract points remain correct on both GIL-enabled and free-threaded builds. On free-threaded builds, `py.allow_threads()` (PyO3 `detach()`) detaches the calling thread from the Python runtime instead of releasing the GIL. This detachment is still necessary: free-threaded CPython triggers stop-the-world synchronization during garbage collection and tracing, and a thread that stays attached while performing pure Rust computation would block these events. The same code works correctly on both build types without conditional compilation.

**Impact on MPI prohibition (SS7.2):** Free-threaded Python resolves the GIL/`MPI_THREAD_MULTIPLE` deadlock risk (SS7.2 point 2) because threads can truly execute concurrently. However, the remaining two prohibition reasons -- `MPI_Init_thread` timing conflict (point 1) and dual-FFI-layer fragility (point 3) -- are independent of the GIL and remain valid. The MPI prohibition therefore stands regardless of GIL state. mpi4py 4.1.1 ships free-threaded wheels (`cp314t`) and requests `MPI_THREAD_MULTIPLE` by default, but this benefits direct mpi4py usage, not Cobre's PyO3 layer which avoids MPI entirely.

**Impact on multi-process design (SS7.3-7.4):** The current `multiprocessing.Process`-based multi-worker design remains the recommended approach. A future alternative -- spawning worker threads instead of processes within a single free-threaded Python interpreter -- becomes architecturally viable when: (1) free-threading is the CPython default, (2) all Cobre dependencies in the Python wheel are free-thread-safe, and (3) PyO3's `#[pyclass]` types satisfy the `Sync` requirement (already the case for Cobre's types, which do not hold Python objects across the Rust boundary). This threading-based mode would eliminate `multiprocessing` serialization overhead and shared-memory segment management, but requires careful evaluation of OpenMP thread pool interaction within a single-process multi-worker model. This extension is deferred pending ecosystem maturity.

**PyO3 requirements for free-threading:** Since PyO3 0.23, `#[pyclass]` types must implement `Sync`. Since PyO3 0.28, modules default to thread-safe (`Py_MOD_GIL_NOT_USED`). At implementation time, the `cobre-python` crate should: (1) audit all `#[pyclass]` types for `Sync` compliance, (2) avoid `GILProtected<T>` (removed in current PyO3), (3) use `pyo3::sync::critical_section` for any shared mutable state, and (4) set `gil_used = true` as a temporary escape hatch only if thread-safety audit is incomplete.

## 8. Memory Model

### 8.1 Ownership Rules at the Python/Rust Boundary

Data crossing the Python/Rust boundary follows strict ownership rules to prevent use-after-free and data races.

| Data Direction           | Ownership Transfer                                                                                       | Lifetime                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Python -> Rust (args)    | PyO3 borrows or copies Python objects. Borrows are valid only during the GIL-held validation phase       | Duration of the function call             |
| Rust -> Python (returns) | Rust data is either consumed (moved into `PyArray`) or converted (serialized to Python dict/list)        | Python garbage collector manages lifetime |
| Zero-copy NumPy          | Rust `Vec<f64>` is moved into `PyArray`. Rust no longer owns the data. Python GC frees when refcount = 0 | Python object lifetime                    |
| Zero-copy Arrow          | Arrow `RecordBatch` exported via C Data Interface. Ownership transferred to `pyarrow`                    | Python object lifetime                    |
| Wrapped Rust objects     | `#[pyclass]` structs are owned by Python. The Rust struct lives inside the Python object                 | Python object lifetime                    |

### 8.2 No Rust Lifetimes Cross the Boundary

All PyO3 classes use owned data, not references. This means:

- `Case` owns a clone of the resolved internal structures (or an `Arc<InternalStructures>`)
- `Policy` owns the loaded FlatBuffers data (or an `Arc<PolicyData>`)
- `TrainingResult` owns the convergence history and policy reference

No Python object holds a Rust `&'a T` reference. This eliminates lifetime-related safety issues at the FFI boundary.

### 8.3 Memory Categories in Single-Process Mode

The [Memory Architecture](../hpc/memory-architecture.md) SS1.1 ownership categories apply with the following modifications for single-process (no MPI) mode:

| Category (SS1.1)         | Single-Process Behavior                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Shared read-only**     | Regular per-process allocation (no `SharedWindow`). The Python process owns all read-only data directly |
| **Thread-local mutable** | Unchanged. OpenMP threads own their solver workspaces with first-touch NUMA placement                   |
| **Rank-local growing**   | Single-rank: the cut pool grows in the one process. No MPI synchronization needed                       |
| **Temporary**            | Unchanged. Pre-allocated in workspace, reused per LP solve                                              |

## 9. Async Support

> **Status: OPTIONAL.** This section documents the recommended async approach per architecture-021 SS6.1 Q-4. Async wrappers are optional and may be deferred to a later release. This design is flagged for user review.

### 9.1 Motivation

Long-running operations (`train()`, `simulate()`) block the Python event loop in async applications (web servers, Jupyter notebooks with async cells, agent frameworks). Async wrappers allow these operations to run without blocking.

### 9.2 Recommended Approach: `run_in_executor`

The async wrappers delegate to a thread pool executor, which calls the synchronous functions. Since the GIL is released during Rust computation (SS3, point 2), the executor thread does not block other Python coroutines.

```python
import asyncio

async def train_async(
    case: Case,
    config_overrides: dict | None = None,
    progress_callback: Callable[[ProgressEvent], None] | None = None,
) -> TrainingResult:
    """Async wrapper for train().

    Runs train() in a thread pool executor so that the calling
    coroutine yields control to the event loop during computation.

    OPTIONAL: This function may not be available in all builds.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,  # Default executor
        lambda: train(case, config_overrides, progress_callback),
    )

async def simulate_async(
    case: Case,
    policy: Policy,
    config_overrides: dict | None = None,
    progress_callback: Callable[[ProgressEvent], None] | None = None,
) -> SimulationResult:
    """Async wrapper for simulate().

    Runs simulate() in a thread pool executor so that the calling
    coroutine yields control to the event loop during computation.

    OPTIONAL: This function may not be available in all builds.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        lambda: simulate(case, policy, config_overrides, progress_callback),
    )
```

### 9.3 Why `run_in_executor` (Not Native Async)

A native async implementation would require the Rust training loop to yield cooperatively at iteration boundaries. This adds complexity to the core algorithm with no performance benefit -- the GIL is already released, so the Python event loop is free to schedule other coroutines. The `run_in_executor` approach achieves the same concurrency without modifying the Rust core.

### 9.4 Progress Callbacks in Async Context

When using `train_async()` with a progress callback, the callback runs on the executor thread (not the event loop thread). If the callback needs to update async state, it should use `loop.call_soon_threadsafe()`:

```python
async def monitor_training():
    loop = asyncio.get_running_loop()
    progress_queue = asyncio.Queue()

    def on_progress(event: ProgressEvent):
        loop.call_soon_threadsafe(progress_queue.put_nowait, event)

    result = await train_async(case, progress_callback=on_progress)
```

## 10. Build and Distribution

### 10.1 Build System

`cobre-python` uses [maturin](https://github.com/PyO3/maturin) for building Python wheels from the Rust `cdylib` crate.

```toml
# Cargo.toml excerpt
[lib]
name = "cobre"
crate-type = ["cdylib"]

[dependencies]
pyo3 = { version = "0.22", features = ["extension-module"] }
numpy = "0.22"                    # PyO3 NumPy integration
arrow = { version = "53", features = ["ffi"] }  # Arrow FFI for pyarrow
```

### 10.2 Platform Support

| Platform       | Support Level | Notes                                                 |
| -------------- | ------------- | ----------------------------------------------------- |
| Linux x86_64   | Primary       | Full support. OpenMP via system GCC/ICC runtime       |
| Linux aarch64  | Primary       | Full support. OpenMP via system GCC runtime           |
| macOS x86_64   | Secondary     | OpenMP requires `brew install libomp`                 |
| macOS aarch64  | Secondary     | Apple Silicon. OpenMP requires `brew install libomp`  |
| Windows x86_64 | Optional      | May require MSVC + Intel OpenMP or pre-built binaries |

### 10.3 Wheel Contents

The wheel contains:

- The compiled `cobre` shared library (`.so` / `.dylib` / `.pyd`)
- The OpenMP runtime library (statically linked or bundled)
- Type stub file (`cobre.pyi`) for IDE autocompletion and `mypy` support
- No MPI libraries (ferrompi is not a dependency)
- No FlatBuffers Python package (policy access is via the Rust layer)

### 10.4 Python Version Support

Minimum Python version: 3.9 (matching PyO3's minimum supported version). Wheels are built for Python 3.9, 3.10, 3.11, 3.12, 3.13, and 3.14. Free-threaded builds (`cp313t`, `cp314t`) are supported when the `cobre-python` crate passes the PyO3 free-threading audit (see SS7.5a); until then, importing `cobre` on a free-threaded interpreter will re-enable the GIL via the `gil_used = true` module flag.

## Cross-References

- [Structured Output](./structured-output.md) -- Error schema (SS2) and error kind registry (SS2.3) that define the exception hierarchy (SS6)
- [Convergence Monitoring](../architecture/convergence-monitoring.md) -- Per-iteration output record (SS2.4) that defines progress event fields and Arrow table columns (SS2.7, SS4.3)
- [Hybrid Parallelism](../hpc/hybrid-parallelism.md) -- OpenMP threading model (SS5), initialization sequence (SS6), OpenMP C FFI strategy (SS5.3) that guarantees GIL contract point 3
- [Memory Architecture](../hpc/memory-architecture.md) -- Data ownership categories (SS1.1) adapted for single-process mode (SS8.3); NUMA allocation principles (SS3) that apply to OpenMP workspaces
- [Design Principles](../overview/design-principles.md) -- Format selection criteria (SS1), agent-readability rules (SS6.2)
- [Validation Architecture](../architecture/validation-architecture.md) -- 5-layer validation pipeline (SS2) invoked by `validate()` and `CaseLoader.load()`
- [Input System Entities](../data-model/input-system-entities.md) -- Entity field definitions for `HydroPlant`, `ThermalUnit`, `Bus`, `Line` Python classes
- [Binary Formats](../data-model/binary-formats.md) -- FlatBuffers schemas for policy data accessed by the `Policy` class
- [Output Schemas](../data-model/output-schemas.md) -- Parquet output column definitions for simulation results read by Python directly
- [TCP Backend](../hpc/backend-tcp.md) -- TCP-based multi-process communication backend (SS8.1 for environment variables, SS8.2 for invocation examples) used by Python multi-process mode (SS7.3, SS7.5)
- [Shared Memory Backend](../hpc/backend-shm.md) -- POSIX shared-memory multi-process backend (SS7.3 for the Python multiprocessing code example) used by Python multi-process mode (SS7.3, SS7.5)
- [Backend Registration and Selection](../hpc/backend-selection.md) -- Auto-detection algorithm (SS2.2) and feature flag matrix (SS1.2) governing backend availability in Python wheel builds (SS7.5)
- [Communicator Trait](../hpc/communicator-trait.md) -- `Communicator` trait definition (SS1) that each worker's backend implements; `SharedMemoryProvider` (SS4) for shm backend shared regions
- [Backend Testing](../hpc/backend-testing.md) -- Conformance test suite (§1) and determinism verification (§4) that validate backend interchangeability for multi-process execution modes (SS7.3-7.5)
- [PEP 703](https://peps.python.org/pep-0703/) -- Making the Global Interpreter Lock Optional in CPython (referenced in SS7.5a)
- [PEP 779](https://peps.python.org/pep-0779/) -- Criteria for Supported Status for Free-Threaded CPython (referenced in SS7.5a)
- Architecture-021 SS2.2 -- `cobre-python` crate responsibility boundaries and API surface table
- Architecture-021 SS6.1 Q-4 -- Async support assumption (optional, `run_in_executor`)
- Architecture-021 SS6.3 -- 5 hard constraints from GIL/MPI analysis
