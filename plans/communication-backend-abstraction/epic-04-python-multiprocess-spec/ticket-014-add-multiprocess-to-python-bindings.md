# ticket-014 Add Multi-Process Execution Sections to python-bindings.md

## Context

### Background

Epics 01-03 established the full communication backend abstraction: the `Communicator` and `SharedMemoryProvider` traits, four backend implementations (ferrompi, local, TCP, shm), and a two-level backend selection mechanism. The TCP backend (`backend-tcp.md`) and shm backend (`backend-shm.md`) were specifically designed to enable multi-process SDDP execution without MPI -- a key enabler for Python users. The shm backend already includes a Python multi-process usage example (`backend-shm.md` SS7.3, lines 666-695) using `multiprocessing.Process`.

The current Python bindings spec (`python-bindings.md`) defines `cobre-python` as strictly single-process (SS1.1, line 17: "Single-process. No MPI"), with SS7.1 (lines 1080-1085) explicitly marking `multiprocessing` as unsupported. SS7.3 (lines 1097-1124) recommends `subprocess` + CLI as the only distributed execution path. This ticket updates the spec to document multi-process execution via TCP or shm backends while preserving the MPI prohibition.

### Relation to Epic

This is the foundation ticket for Epic 04 (Python Multi-Process Execution Specification). It establishes the execution model, updates the execution mode table, revises the MPI prohibition rationale to clarify that MPI -- not distributed execution -- is prohibited, and adds new sections documenting multi-process architecture. Ticket-015 builds on these sections to define the detailed worker coordination API. Ticket-016 adds a brief cross-reference to the MCP server spec.

### Current State

`src/specs/interfaces/python-bindings.md` (1288 lines) has the following structure relevant to this ticket:

- **SS1.1** (lines 9-21): Crate Type and Dependencies table. The "Execution mode" row reads "Single-process. No MPI." The "MPI relationship" row reads "MUST NOT depend on ferrompi. MUST NOT initialize MPI. Python users needing distributed execution use subprocess".
- **SS1.2** (lines 37-51): Single-Process Execution. Table shows 8 initialization steps, all from the single-process perspective.
- **SS7.1** (lines 1079-1085): Execution Mode Table. Four rows: single-thread (yes), OpenMP (yes/default), MPI (no), multiprocessing (no/unsupported, citing "Fork-safety concerns with OpenMP").
- **SS7.2** (lines 1087-1095): MPI Prohibition Rationale. Three independent technical reasons (MPI_Init_thread timing conflict, GIL vs MPI_THREAD_MULTIPLE deadlock, dual-FFI-layer fragility).
- **SS7.3** (lines 1097-1124): Distributed Execution Workflow. Shows `subprocess.run(["mpiexec", ...])` as the recommended distributed path.
- **Purpose paragraph** (line 5): Describes "single-process-only execution mode with the rationale for prohibiting MPI from Python".
- **Cross-References** (lines 1275-1288): 11 cross-reference entries, none referencing backend-tcp.md or backend-shm.md.

## Specification

### Requirements

1. **Update SS1.1 table**: Change the "Execution mode" row to acknowledge multi-process capability via TCP/shm backends. Change the "MPI relationship" row to clarify that MPI specifically is prohibited, not distributed execution.

2. **Update SS1.2**: Add a new SS1.2a subsection after SS1.2 documenting the multi-process initialization sequence. Each worker process runs the same initialization steps as SS1.2, but with a `Communicator` backend (TCP or shm) instead of `LocalBackend`. Reference `hybrid-parallelism.md SS1.0a` for single-process mode context.

3. **Update SS7.1 Execution Mode Table**: Change the `multiprocessing` row from "No (unsupported)" to "Yes (optional)" with appropriate caveats. Add a fifth row for multi-process via TCP/shm.

4. **Rewrite SS7.2 MPI Prohibition Rationale**: Preserve all three technical reasons verbatim, but add an opening paragraph clarifying that the prohibition is on MPI specifically -- not on distributed execution. Multi-process execution is supported via the TCP and shm backends, which avoid all three MPI-specific problems.

5. **Replace SS7.3**: Replace the `subprocess` + CLI workflow with a new subsection documenting multi-process execution via `multiprocessing.Process`. The `subprocess` + CLI workflow should be preserved as a secondary option (e.g., SS7.3a) for users who specifically need MPI (multi-node cluster) execution. The primary example should use shm (single-node, the common Python use case) and cross-reference `backend-shm.md SS7.3` rather than duplicating the code example.

6. **Add new SS7.4 Multi-Process Architecture**: Document the architecture where Python spawns worker processes using `multiprocessing.Process`, each worker loads the `cobre` extension module and creates its own `Communicator` instance. Key points:
   - Each worker process has its own Python interpreter and GIL -- no GIL contention between workers
   - Each worker calls into PyO3 which creates a backend-specific `Communicator`
   - The parent process is the orchestrator; it does not participate in SDDP computation
   - Workers communicate via the selected backend (TCP or shm), not via Python IPC

7. **Add new SS7.5 Backend Selection from Python**: Document the `backend` parameter semantics:
   - `"auto"` (default): when `num_workers > 1`, selects shm for single-node, TCP if `COBRE_TCP_COORDINATOR` is set
   - `"shm"`: forces shm backend (single-node only)
   - `"tcp"`: forces TCP backend (requires coordinator address)
   - `"local"`: forces local backend (single-process, ignores num_workers)
   - Cross-reference `backend-selection.md SS2.2` for the full auto-detection algorithm

8. **Update Purpose paragraph** (line 5): Replace "single-process-only execution mode with the rationale for prohibiting MPI from Python" with language acknowledging multi-process capability.

9. **Update Cross-References section**: Add cross-references to `backend-tcp.md`, `backend-shm.md`, `backend-selection.md`, and `communicator-trait.md`.

### Key Design Decisions

- Python uses `multiprocessing.Process` to spawn workers (Python manages processes). Each worker calls into the Rust PyO3 extension which creates its own `Communicator` instance.
- `cobre.train()` accepts an optional `backend` parameter (default: `"auto"`) and an optional `num_workers` parameter (default: `1`, meaning single-process). When `num_workers > 1`, the library spawns worker processes internally.
- Backend auto-detection in Python: when `num_workers > 1` and backend is `"auto"`, use shm for single-node and TCP for multi-node if explicitly configured.
- Each worker process has its own GIL, so there is no GIL contention between workers.
- The existing `backend-shm.md SS7.3` and `backend-tcp.md SS8.1` Python examples should be referenced, not duplicated.

### Error Handling

- No new error types are introduced in this ticket. The existing `CommError` variants from `communicator-trait.md SS1.4` and `BackendError` from `backend-selection.md SS6.2` apply to multi-process failures.
- Worker process crashes are documented architecturally here; detailed error propagation is specified in ticket-015.

## Acceptance Criteria

- [ ] Given the updated `python-bindings.md`, when reading SS1.1, then the "Execution mode" row acknowledges multi-process capability via TCP/shm backends alongside the single-process default.
- [ ] Given the updated `python-bindings.md`, when reading SS1.1, then the "MPI relationship" row clarifies that MPI specifically is prohibited, not distributed execution generally.
- [ ] Given the updated `python-bindings.md`, when reading SS7.1, then the Execution Mode Table includes rows for multi-process via `multiprocessing.Process` with TCP and shm backends, marked as supported.
- [ ] Given the updated `python-bindings.md`, when reading SS7.2, then the MPI prohibition rationale is preserved in full (all three technical reasons intact) with a new opening paragraph clarifying that multi-process execution via non-MPI backends is supported.
- [ ] Given the updated `python-bindings.md`, when reading SS7.3, then the primary distributed execution example uses `multiprocessing.Process` with shm backend, cross-referencing `backend-shm.md SS7.3` for the complete code example.
- [ ] Given the updated `python-bindings.md`, when reading SS7.3, then the `subprocess` + CLI workflow is preserved as a secondary option for MPI execution.
- [ ] Given the updated `python-bindings.md`, when reading SS7.4, then the multi-process architecture section explains that each worker has its own GIL, creates its own `Communicator` instance via PyO3, and workers communicate via the backend (not Python IPC).
- [ ] Given the updated `python-bindings.md`, when reading SS7.5, then backend selection semantics are documented: `"auto"` default, shm for single-node, TCP for explicit multi-node, with a cross-reference to `backend-selection.md SS2.2`.
- [ ] Given the updated `python-bindings.md`, when reading the Purpose paragraph, then it reflects multi-process capability (no longer says "single-process-only").
- [ ] Given the updated `python-bindings.md`, when reading Cross-References, then `backend-tcp.md`, `backend-shm.md`, `backend-selection.md`, and `communicator-trait.md` are listed with section-level granularity.
- [ ] Given the updated `python-bindings.md`, when searching for the old "Fork-safety concerns with OpenMP" text in SS7.1, then it is either removed or replaced with an accurate explanation (fork-safety is not a concern when using `multiprocessing.Process` with `start_method="spawn"`).
- [ ] The additive-only rule is respected: no existing section numbers are renumbered; new sections are added as SS7.4, SS7.5, or as subsections (SS1.2a, SS7.3a).

## Implementation Guide

### Suggested Approach

1. **Update the Purpose paragraph** (line 5): Replace "single-process-only execution mode with the rationale for prohibiting MPI from Python" with "multi-process execution support via TCP and shared-memory backends with the rationale for prohibiting MPI from Python".

2. **Update SS1.1 table** (lines 13-20):
   - "Execution mode" row: "Single-process (default) or multi-process via TCP/shm backends. No MPI. OpenMP threads per worker for computation. GIL released during all Rust computation"
   - "MPI relationship" row: "MUST NOT depend on `ferrompi`. MUST NOT initialize MPI. Multi-process execution uses TCP or shm backends instead"

3. **Add SS1.2a after SS1.2** (after line 51): Document multi-process initialization. Each worker process executes the same steps as SS1.2 but creates a `TcpBackend` or `ShmBackend` instead of `LocalBackend`. Reference `hybrid-parallelism.md SS1.0a`.

4. **Update SS7.1 Execution Mode Table** (lines 1079-1085):
   - Change "Multi-process via Python multiprocessing" row to "Yes (optional)" with "Multi-worker SDDP via `multiprocessing.Process`" use case
   - Add a note about `start_method="spawn"` requirement (not `"fork"`, to avoid OpenMP fork-safety issues)

5. **Update SS7.2** (lines 1087-1095): Add opening paragraph before the three reasons, clarifying that multi-process execution via TCP/shm is supported. Keep all three MPI-specific reasons verbatim.

6. **Rewrite SS7.3** (lines 1097-1124): Replace `subprocess` + CLI example with multi-process architecture overview. Move `subprocess` example to SS7.3a as a secondary option.

7. **Add SS7.4 Multi-Process Architecture**: GIL isolation per worker, PyO3 `Communicator` creation per worker, no Python IPC between workers.

8. **Add SS7.5 Backend Selection from Python**: `backend` parameter semantics, auto-detection rules, cross-reference to `backend-selection.md SS2.2`.

9. **Update Cross-References** (lines 1275-1288): Add four new entries for the HPC backend specs.

### Key Files to Modify

- `src/specs/interfaces/python-bindings.md` -- Primary target. All changes in this ticket modify this file.

### Patterns to Follow

- **Section reference convention**: Use `SS` notation (not `§`) because this file is in `src/specs/interfaces/`, following the convention from learnings: "files in `src/specs/architecture/` use `SS`".
- **Additive-only rule**: Never delete or renumber existing sections. Add new sections (SS7.4, SS7.5) or subsections (SS1.2a, SS7.3a).
- **Cross-reference link format**: For interfaces-to-HPC links: `[Target SS#](../hpc/target-file.md)`.
- **Table format**: Follow the existing Execution Mode Table format (SS7.1) with columns: Execution Mode, Supported, Thread Count, GIL State During Computation, Use Case.

### Pitfalls to Avoid

- Do NOT duplicate the Python multiprocessing code example from `backend-shm.md SS7.3`. Cross-reference it instead.
- Do NOT remove or weaken the MPI prohibition rationale. All three reasons must remain intact.
- Do NOT use the `§` section symbol. This file uses `SS`.
- Do NOT renumber existing sections. SS1 through SS10 are established; new content goes into subsections or new top-level sections after SS10.
- Do NOT change the `cobre.train()` function signature in this ticket. The signature update (adding `backend` and `num_workers` parameters) is part of ticket-015, which specifies the detailed API.

## Testing Requirements

### Review Checks

- Verify all cross-references resolve to correct targets (no broken links to `backend-tcp.md`, `backend-shm.md`, etc.)
- Verify the MPI prohibition reasons are preserved verbatim
- Verify the `SS` section reference convention is used consistently (not `§`)
- Verify the additive-only rule is respected: no sections deleted or renumbered
- Verify the Purpose paragraph accurately reflects the updated execution model

### Consistency Checks

- The Execution Mode Table in SS7.1 must be consistent with the SS1.1 table
- The backend selection description in SS7.5 must be consistent with `backend-selection.md SS2.2`
- The multi-process architecture in SS7.4 must be consistent with `backend-shm.md SS7.3` and `backend-tcp.md SS8.1`

## Dependencies

- **Blocked By**: ticket-007 (TCP backend spec, completed), ticket-008 (shm backend spec, completed), ticket-009 (refactored hybrid-parallelism.md, completed)
- **Blocks**: ticket-015 (Python worker coordination API), ticket-016 (MCP server update)

## Effort Estimate

**Points**: 3
**Confidence**: High
