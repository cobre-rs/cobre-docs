# ticket-014 Add Multi-Process Execution Sections to python-bindings.md

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add new sections to `src/specs/interfaces/python-bindings.md` that document multi-process SDDP execution from Python using the TCP or shared-memory backends. This removes the restriction that Python users must use subprocess + CLI for distributed execution (SS7.3), while preserving the MPI prohibition (SS7). The new sections should define the Python API for launching multi-worker training, the interaction between Python's `multiprocessing` module and the Rust communication backends, and the GIL management implications.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/interfaces/python-bindings.md` -- Add new SS (e.g., SS9 or SS10) for multi-process execution
- **Key decisions needed**:
  - Whether the Python API uses `multiprocessing.Process` to spawn workers (Python manages processes) or expects the user to launch separate Python processes externally (user manages processes)
  - Whether the `cobre.train()` API signature changes (e.g., new `backend` parameter) or multi-process training uses a separate function (e.g., `cobre.train_distributed()`)
  - How the GIL interacts with the TCP/shm backends: since each process has its own GIL, there is no GIL contention between workers (unlike MPI in a single process)
- **Open questions**:
  - Should the API support both TCP and shm, or default to shm for single-node and TCP for multi-node?
  - What is the lifecycle of worker processes? Who starts and stops them?
  - Should there be a `cobre.launch_workers(n)` convenience function that handles process spawning?

## Dependencies

- **Blocked By**: ticket-007 (TCP backend spec), ticket-008 (shm backend spec), ticket-009 (refactored hybrid-parallelism.md)
- **Blocks**: ticket-015, ticket-017

## Effort Estimate

**Points**: 4
**Confidence**: Low (will be re-estimated during refinement)
