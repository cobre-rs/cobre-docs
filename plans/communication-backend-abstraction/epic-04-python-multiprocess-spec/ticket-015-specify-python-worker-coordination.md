# ticket-015 Specify Python Worker Coordination API

## Context

### Background

Ticket-014 establishes the architectural foundation for multi-process Python SDDP execution: the execution mode table, the MPI prohibition clarification, the multi-process architecture (GIL isolation, per-worker `Communicator` instances), and the backend selection semantics. This ticket builds on that foundation to define the complete Python API surface for multi-process training: the updated `cobre.train()` signature, worker process lifecycle management, result collection from workers, error propagation, and progress reporting across workers.

The key design decisions driving this API are:

- `cobre.train()` accepts optional `backend` (default: `"auto"`) and `num_workers` (default: `1`) parameters
- When `num_workers > 1`, the library internally spawns worker processes using `multiprocessing.Process`
- The parent/orchestrator process does not participate in SDDP computation; it manages worker lifecycle
- Each worker process has its own GIL and creates its own `Communicator` via PyO3

The backend specs already contain the low-level Python usage patterns: `backend-shm.md SS7.3` (lines 666-695) shows per-rank `cobre.train()` calls with backend-specific parameters, and `backend-tcp.md SS8.1` (lines 535-549) documents the TCP environment variables each worker needs.

### Relation to Epic

This is the second ticket in Epic 04, building directly on ticket-014's architectural sections. Where ticket-014 defines the "what" and "why" of multi-process Python execution, this ticket defines the "how": the concrete API that Python users call. Ticket-016 (MCP server) depends on this ticket establishing the API pattern it will reference.

### Current State

`src/specs/interfaces/python-bindings.md` (1288 lines, will be longer after ticket-014) has the following relevant API sections:

- **SS2.1** (lines 67-107): `cobre.train()` signature. Current signature: `def train(case: Case, config_overrides: dict | None = None, progress_callback: Callable[[ProgressEvent], None] | None = None) -> TrainingResult`. No `backend` or `num_workers` parameters.
- **SS2.9** (lines 561-618): `ProgressEvent` class. Fields: `phase`, `iteration`, `lower_bound`, `upper_bound`, `gap`, `wall_time_ms`, `iteration_time_ms`, `scenarios_complete`, `scenarios_total`. No `rank` or `worker_id` field.
- **SS2.7** (lines 459-516): `TrainingResult` class. Properties: `policy`, `convergence_history`, `iterations`, `final_lower_bound`, `final_upper_bound`, `final_gap`, `termination_reason`, `total_cuts`. No multi-worker aggregation fields.
- **SS3.1** (lines 689-699): The 5-Point GIL Contract. All five points are written from the single-process perspective.
- **SS3.2** (lines 701-747): GIL State Transitions During `train()`. The timeline diagram shows a single-process flow.
- **SS6.1** (lines 946-955): Exception Hierarchy. Three exception classes: `CobreError`, `ValidationError`, `SolverError`, `IOError`. No `WorkerError` or multi-process error class.

After ticket-014 completes, the file will have new sections SS7.4 (Multi-Process Architecture) and SS7.5 (Backend Selection from Python) that this ticket extends with API specifics.

## Specification

### Requirements

1. **Update `cobre.train()` signature in SS2.1**: Add two optional parameters:
   - `backend: str = "auto"` -- Backend selection. Values: `"auto"`, `"shm"`, `"tcp"`, `"local"`. When `"auto"` and `num_workers > 1`, selects shm for single-node. Cross-reference `backend-selection.md SS2.2`.
   - `num_workers: int = 1` -- Number of SDDP worker processes. When `1`, single-process execution (current behavior). When `> 1`, spawns worker processes using `multiprocessing.Process`.
   - Update the docstring to document these parameters and their interaction.

2. **Update `cobre.simulate()` signature in SS2.1**: Add the same `backend` and `num_workers` parameters. Simulation also benefits from multi-process execution (parallel scenario evaluation).

3. **Add SS2.1a Worker Lifecycle**: Document the worker process lifecycle when `num_workers > 1`:
   - Parent process calls `cobre.train(case, num_workers=4, backend="shm")`
   - Library sets `multiprocessing.set_start_method("spawn")` if not already set
   - Library generates backend-specific configuration (shm segment name, TCP coordinator address)
   - Library spawns `num_workers` child processes via `multiprocessing.Process`
   - Each child process: imports `cobre`, creates a `Communicator` for its rank, runs the SDDP training loop
   - Parent process waits for all children via `Process.join()`
   - Parent process collects the `TrainingResult` from rank 0 (the coordinator/leader)
   - Result transfer from worker to parent uses `multiprocessing.Queue` or the worker writes to disk and parent reads

4. **Add SS2.1b Multi-Process Result Collection**: Document how `TrainingResult` is returned when `num_workers > 1`:
   - Only rank 0's `TrainingResult` is returned to the parent (all ranks converge to the same policy)
   - The `convergence_history` Arrow table comes from rank 0
   - The `policy` is the same across all ranks (SDDP guarantee)
   - Add a `workers` property to `TrainingResult` reporting per-worker metadata (rank, wall_time_ms, backend)

5. **Update SS2.9 ProgressEvent**: Add a `worker_id: int | None` field to `ProgressEvent`. When `num_workers > 1`, progress events carry the rank of the reporting worker. When `num_workers == 1`, `worker_id` is `None` (backward compatible). Document that progress events from all workers are multiplexed into the single `progress_callback` stream.

6. **Add SS6.1a Worker Error Handling**: Document error propagation from worker processes:
   - Add `cobre.WorkerError(CobreError)` to the exception hierarchy
   - `WorkerError` carries: `rank: int`, `exit_code: int | None`, `inner: CobreError | None` (the original error from the worker, if available)
   - If any worker raises an exception, the parent attempts to terminate remaining workers (via `Process.terminate()`) and raises `WorkerError` with the first failure
   - If a worker process crashes (non-zero exit code without a structured error), `WorkerError.inner` is `None` and `WorkerError.message` reports the exit code

7. **Update SS3.1 GIL Contract**: Add a 6th point specific to multi-process mode:
   - Point 6: "In multi-process mode, each worker process has its own Python interpreter and GIL. The GIL contract (points 1-5) applies independently within each worker process. There is no GIL contention between workers because they are separate OS processes."

8. **Add SS3.2a GIL State Transitions During Multi-Process `train()`**: Add a second timeline diagram showing the parent process spawning workers, each worker running the SS3.2 single-process flow independently, and the parent collecting results.

9. **Document `start_method` requirement**: The library requires `multiprocessing.set_start_method("spawn")`. The `"fork"` method is not safe because OpenMP threads in the Rust extension are not fork-safe. If the start method is already set to `"fork"`, `cobre.train()` with `num_workers > 1` raises `cobre.CobreError` with a clear message.

### Key Design Decisions

- The `cobre.train()` function -- not a separate `cobre.train_distributed()` -- handles multi-process execution. The `num_workers` parameter is the switch. This keeps the API simple: users upgrade from single-process to multi-process by adding `num_workers=4`.
- No `DistributedTrainer` class. The functional API is sufficient for the use case.
- The parent process does not participate in SDDP computation. It is purely an orchestrator.
- Progress events from all workers are multiplexed into a single callback. The `worker_id` field disambiguates. This avoids requiring users to manage per-worker callback streams.
- Backend-specific parameters (shm segment name, TCP coordinator address) are auto-generated by the library when `num_workers > 1`. Users do not need to set `COBRE_SHM_NAME` or `COBRE_TCP_COORDINATOR` manually -- the library handles this. Advanced users can override via environment variables.
- Heterogeneous workers (different thread counts per worker) are NOT supported in the initial API. All workers use the same `OMP_NUM_THREADS`.
- Checkpointing in multi-process mode follows the same checkpoint protocol as single-process. Rank 0 writes checkpoints. Checkpoint interaction details are out of scope for this ticket.

### Inputs/Props

Updated `cobre.train()` signature:

```python
def train(
    case: Case,
    config_overrides: dict | None = None,
    progress_callback: Callable[[ProgressEvent], None] | None = None,
    backend: str = "auto",
    num_workers: int = 1,
) -> TrainingResult:
```

Updated `cobre.simulate()` signature:

```python
def simulate(
    case: Case,
    policy: Policy,
    config_overrides: dict | None = None,
    progress_callback: Callable[[ProgressEvent], None] | None = None,
    backend: str = "auto",
    num_workers: int = 1,
) -> SimulationResult:
```

### Outputs/Behavior

- When `num_workers == 1`: identical behavior to current spec. No worker processes spawned. `backend` parameter is respected (default `"auto"` resolves to `local`).
- When `num_workers > 1`: spawns workers, runs distributed SDDP, returns rank 0's `TrainingResult`.
- `ProgressEvent.worker_id` is `None` when `num_workers == 1`, `int` (0-based rank) when `num_workers > 1`.

### Error Handling

- `cobre.ValidationError` raised before spawning workers if `case` or `config_overrides` are invalid.
- `cobre.CobreError` raised if `num_workers < 1`, `backend` is not one of `"auto"`, `"shm"`, `"tcp"`, `"local"`, or if `start_method` is `"fork"`.
- `cobre.WorkerError` raised if any worker process fails during execution.

## Acceptance Criteria

- [ ] Given the updated `python-bindings.md`, when reading SS2.1, then `cobre.train()` has `backend: str = "auto"` and `num_workers: int = 1` parameters with full docstring documentation.
- [ ] Given the updated `python-bindings.md`, when reading SS2.1, then `cobre.simulate()` has the same `backend` and `num_workers` parameters.
- [ ] Given the updated `python-bindings.md`, when reading SS2.1a, then the worker lifecycle is documented: spawn via `multiprocessing.Process`, per-worker `Communicator` creation, parent collects rank 0's result.
- [ ] Given the updated `python-bindings.md`, when reading SS2.1b, then result collection is documented: only rank 0's `TrainingResult` is returned, with a `workers` metadata property.
- [ ] Given the updated `python-bindings.md`, when reading SS2.9, then `ProgressEvent` has a `worker_id: int | None` property documented as `None` for single-process and 0-based rank for multi-process.
- [ ] Given the updated `python-bindings.md`, when reading SS6.1a, then `cobre.WorkerError` is defined with `rank`, `exit_code`, and `inner` properties, and the error propagation strategy is documented.
- [ ] Given the updated `python-bindings.md`, when reading SS3.1, then point 6 documents GIL isolation per worker process.
- [ ] Given the updated `python-bindings.md`, when reading SS3.2a, then a timeline diagram shows the parent-spawns-workers-collects-results flow.
- [ ] Given the updated `python-bindings.md`, when the `start_method` is documented, then `"spawn"` is required and `"fork"` raises `CobreError`.
- [ ] Given the updated `python-bindings.md`, when `num_workers=1` and `backend="auto"`, then behavior is identical to the pre-change spec (backward compatible).
- [ ] The `cobre.train()` example from `backend-shm.md SS7.3` (lines 670-695) is referenced, not duplicated, in the API documentation.
- [ ] No existing section numbers are renumbered. New sections use subsection notation (SS2.1a, SS2.1b, SS3.2a, SS6.1a).

## Implementation Guide

### Suggested Approach

1. **Update SS2.1 `cobre.train()` signature** (starts at line 73): Add `backend` and `num_workers` parameters after `progress_callback`. Update the docstring with parameter documentation, behavior for `num_workers > 1`, and error conditions.

2. **Update SS2.1 `cobre.simulate()` signature** (starts at line 113): Add the same two parameters. Update the docstring.

3. **Add SS2.1a Worker Lifecycle** after the `cobre.simulate()` definition (after line 142): Document the step-by-step lifecycle. Include a note about `multiprocessing.set_start_method("spawn")`. Reference `backend-shm.md SS7.3` for the per-rank invocation pattern.

4. **Add SS2.1b Multi-Process Result Collection** after SS2.1a: Document rank 0 result return, `workers` metadata property on `TrainingResult`.

5. **Update SS2.7 TrainingResult** (starts at line 459): Add a `workers` property returning `list[WorkerInfo] | None`. Define `WorkerInfo` as a simple dataclass with `rank: int`, `wall_time_ms: int`, `backend: str`. `None` when `num_workers == 1`.

6. **Update SS2.9 ProgressEvent** (starts at line 564): Add `worker_id: int | None` property with docstring.

7. **Update SS3.1** (line 689): Add point 6 about GIL isolation in multi-process mode.

8. **Add SS3.2a** after SS3.2 (after line 747): Add multi-process GIL timeline diagram showing parent and N worker processes.

9. **Add SS6.1a Worker Error Handling** after SS6.1 (after line 955): Define `WorkerError`, document error propagation.

10. **Update SS2.11 API Surface Summary** (line 674): Add `WorkerInfo` and `WorkerError` to the table.

### Key Files to Modify

- `src/specs/interfaces/python-bindings.md` -- The sole target file. All changes are in this file.

### Patterns to Follow

- **Function signature format**: Follow the existing `cobre.train()` and `cobre.simulate()` docstring pattern (Args section with type annotations, Returns, Raises).
- **Exception class format**: Follow the existing `SolverError` pattern in SS6.2 (lines 1002-1017) with typed properties.
- **Timeline diagram format**: Follow the existing SS3.2 diagram format (lines 706-747) using ASCII art with `[GIL HELD]`/`[GIL RELEASED]` annotations.
- **Subsection numbering**: Use `SS2.1a`, `SS2.1b` (not SS2.12, SS2.13) to avoid confusion with existing section numbers.
- **Section reference convention**: Use `SS` notation (not `§`).
- **Cross-reference format**: `[Target SS#](../hpc/target-file.md)` for interfaces-to-HPC links.

### Pitfalls to Avoid

- Do NOT add `backend` or `num_workers` to `cobre.validate()`. Validation is always single-process.
- Do NOT duplicate the `backend-shm.md SS7.3` code example. Reference it.
- Do NOT design a `DistributedTrainer` class. The functional API with `num_workers` parameter is the design decision.
- Do NOT support `start_method="fork"`. It is unsafe with OpenMP. Document this clearly.
- Do NOT introduce per-worker progress callbacks. All events go through the single `progress_callback` with `worker_id` disambiguation.
- Do NOT renumber existing sections. Use subsection notation.
- Do NOT change the `TrainingResult.convergence_history` schema. It remains rank 0's history.

## Testing Requirements

### Review Checks

- Verify the updated `cobre.train()` signature is backward-compatible: calling `cobre.train(case)` without `backend` or `num_workers` must produce identical behavior to the pre-change spec
- Verify `WorkerError` fits correctly in the exception hierarchy (subclass of `CobreError`)
- Verify the GIL contract point 6 does not contradict points 1-5
- Verify all cross-references to `backend-shm.md SS7.3` and `backend-tcp.md SS8.1` are correct
- Verify the `SS` section convention is used consistently

### Consistency Checks

- The `backend` parameter values (`"auto"`, `"shm"`, `"tcp"`, `"local"`) must match the `COBRE_COMM_BACKEND` values from `backend-selection.md SS2.1`
- The worker lifecycle must be consistent with the multi-process architecture from ticket-014's SS7.4
- The `ProgressEvent.worker_id` semantics must be consistent with the rank numbering in `communicator-trait.md SS1.1` (`rank()` returns 0-based index)

## Dependencies

- **Blocked By**: ticket-014 (multi-process execution sections must exist first)
- **Blocks**: ticket-016 (MCP server references the Python multi-process API)

## Effort Estimate

**Points**: 3
**Confidence**: High
