# Epic 04 Learnings: Python Multi-Process Execution Specification

**Plan**: communication-backend-abstraction
**Epic**: epic-04-python-multiprocess-spec
**Tickets**: ticket-014, ticket-015, ticket-016
**Updated**: 2026-02-25

---

## Patterns That Worked Well

### Single-function extension pattern (`num_workers` as the gate)

Adding `num_workers: int = 1` and `backend: str = "auto"` as optional keyword arguments to the existing `cobre.train()` and `cobre.simulate()` signatures preserved 100% backward compatibility while enabling multi-process execution. Users upgrade from single-process to multi-process by adding one keyword argument. No new top-level API surface (`DistributedTrainer`, `train_distributed()`) was needed.
Observable at: `src/specs/interfaces/python-bindings.md` SS2.1 (lines 95-101, 168-174).

### Subsection notation as the non-breaking extension mechanism

New spec content was inserted as lettered subsections (`SS1.2a`, `SS2.1a`, `SS2.1b`, `SS3.2a`, `SS6.1a`) rather than renumbering existing sections. This allowed six substantial new sections to be added to a 1288-line file without invalidating any existing cross-reference or section anchor across the 16+ files that cite `python-bindings.md`.
Observable at: `src/specs/interfaces/python-bindings.md` throughout.

### Preceding-section cross-reference rather than code duplication

The multi-process Python usage example was not duplicated from `backend-shm.md SS7.3`. Instead, SS7.3 in `python-bindings.md` provides an architecture diagram and the sentence "The complete Python code example... is provided in [Shared Memory Backend](../hpc/backend-shm.md) SS7.3." This keeps the single code example authoritative and eliminates a future maintenance surface.
Observable at: `src/specs/interfaces/python-bindings.md` SS7.3 (lines 1408-1432).

### Parent-as-orchestrator framing simplifies the process model

Defining the parent process as a pure orchestrator (no SDDP computation, no `Communicator` instance) produced a clean architectural boundary. The parent's only responsibilities are: validate, generate backend config, spawn, join, collect from queue. This framing was used consistently across SS2.1a (lifecycle), SS3.2a (GIL timeline), SS7.3 (architecture diagram), and SS7.4 (architecture enumeration), making the four sections mutually reinforcing without repetition.
Observable at: `src/specs/interfaces/python-bindings.md` SS2.1a (line 221), SS3.2a (line 933), SS7.3 (line 1417), SS7.4 (lines 1465-1475).

### Additive-only approach to the exception hierarchy

`WorkerError` was added to the existing hierarchy (`CobreError > WorkerError`) with a new SS6.1a section, leaving the existing SS6.1 text unchanged. The hierarchy diagram in SS6.1 was updated to include the new leaf, but no existing entries were modified. This avoids breaking any code that catches `CobreError` or its existing subclasses.
Observable at: `src/specs/interfaces/python-bindings.md` SS6.1 (lines 1192-1203) and SS6.1a (lines 1205-1261).

---

## Pitfalls Encountered

### The `SS` vs `§` symbol rule in `src/specs/interfaces/` files

The section reference symbol in `src/specs/interfaces/` files is `SS` (not `§`). This distinction was established in Epic 03 and is critical: `§` is for HPC files, `SS` is for interfaces files. Ticket-014 explicitly listed this in its pitfalls section, which prevented the error from occurring. Future tickets modifying files in `src/specs/interfaces/` must follow the `SS` convention.
Documented in: `plans/communication-backend-abstraction/epic-04-python-multiprocess-spec/ticket-014-add-multiprocess-to-python-bindings.md` (Pitfalls to Avoid).

### `"fork"` start method prohibition requires explicit documentation, not just a warning

The `start_method="fork"` prohibition is non-obvious (fork-safety with OpenMP is a subtle constraint). Both the SS7.1 table note and the SS2.1a step 1 lifecycle document this explicitly, including the `kind="IncompatibleSettings"` error. The implementation guide included this as a required behavior, not an implementation detail, which ensures future spec readers understand why the restriction exists.
Observable at: `src/specs/interfaces/python-bindings.md` SS7.1 (lines 1394) and SS2.1a (line 223).

### `WorkerInfo` as a separate dataclass (not embedded in `TrainingResult`)

The ticket spec defined `WorkerInfo` as a separate, named dataclass in the API surface rather than an anonymous dict or inline tuple. This was specified explicitly because the simpler approach (returning raw dicts) would weaken the type contract and make future extension harder. The spec addresses this by defining `WorkerInfo` as a full class alongside `TrainingResult` in SS2.7.
Observable at: `src/specs/interfaces/python-bindings.md` SS2.7 (lines 639-675).

### Progress callback multiplexing decision documented at the point of use

The design decision to multiplex all worker progress events into a single `progress_callback` (rather than N per-worker callbacks) needed to be documented both in the `worker_id` field docstring (SS2.9) and in the SS3.2a key observations block. Users encountering `worker_id` for the first time in an event have the full rationale available without needing to navigate to a separate design section.
Observable at: `src/specs/interfaces/python-bindings.md` SS2.9 (lines 778-796) and SS3.2a (line 993).

---

## Conventions Established

### `SS` subsection lettering for non-breaking additions to interfaces specs

When adding new content to an existing section that cannot be appended at the end, use lettered subsection notation: `SS2.1a`, `SS2.1b`, `SS3.2a`, `SS6.1a`. Do not use `SS2.12`, `SS2.13` (confusable with `SS2.1 + digit`). This convention was validated across this epic's three tickets.
Applies to: all files in `src/specs/interfaces/`.

### Cross-reference link format for interfaces-to-HPC (confirmed)

From `src/specs/interfaces/` to `src/specs/hpc/`, use: `[Target Name](../hpc/target-file.md) SSN.M`. The `../hpc/` relative path is required; the `SS` section reference notation is required. This was established in Epic 03 and confirmed across 8 new cross-references in this epic.
Observable at: `src/specs/interfaces/python-bindings.md` Cross-References (lines 1644-1662).

### `backend` parameter values are lowercase strings matching `COBRE_COMM_BACKEND` env var values

The four valid `backend` parameter values (`"auto"`, `"shm"`, `"tcp"`, `"local"`) match the `COBRE_COMM_BACKEND` environment variable values from `backend-selection.md SS2.1`. This consistency rule was enforced in ticket-015's consistency check and must be maintained in future tickets that touch either the Python API or the env var table.
Documented in: `src/specs/interfaces/python-bindings.md` SS7.5 and `src/specs/hpc/backend-selection.md` SS2.1.

### Future-capability note pattern for deferred features

When a spec needs to acknowledge a capability that is architecturally possible but intentionally deferred, use the pattern established in `mcp-server.md SS1.1a`: (1) state the current mode as the default/recommended, (2) acknowledge the capability with a cross-reference to where it is fully specified, (3) state the deferral and the condition for revisiting it. Keep to 5-15 lines. Do not add dependencies or schema changes for deferred features.
Observable at: `src/specs/interfaces/mcp-server.md` SS1.1a (lines 20-27).

### `WorkerInfo` metadata as an optional `None`-returning property

When multi-process metadata only exists in multi-process runs, the property returns `list[WorkerInfo] | None` (not an empty list). `None` clearly signals "this was a single-process run" vs an empty list which could indicate "workers ran but no metadata was collected." The same `T | None` pattern is used for `ProgressEvent.worker_id`.
Observable at: `src/specs/interfaces/python-bindings.md` SS2.7 (line 629) and SS2.9 (line 780).

---

## Cross-Reference Inventory

The following new cross-references were established by this epic. Future tickets that modify any target file must verify these references remain valid.

### New outgoing references from `python-bindings.md`

| From Section              | Target                  | Section                                     |
| ------------------------- | ----------------------- | ------------------------------------------- |
| SS2.1a                    | `backend-shm.md`        | SS7.3 (Python multiprocessing code example) |
| SS2.1b                    | `backend-tcp.md`        | SS1.1 (coordinator role)                    |
| SS2.7 (`WorkerInfo.rank`) | `communicator-trait.md` | SS1.1 (`rank()` method)                     |
| SS2.9 (`worker_id`)       | `communicator-trait.md` | SS1.1 (rank numbering)                      |
| SS7.3                     | `backend-shm.md`        | SS7.3 (Python multiprocessing code example) |
| SS7.3                     | `backend-tcp.md`        | SS8.1 (TCP environment variables)           |
| SS7.5                     | `backend-shm.md`        | SS7.1 (shm env var reference)               |
| SS7.5                     | `backend-tcp.md`        | SS8.1 (TCP env var reference)               |
| SS7.5                     | `backend-selection.md`  | SS2.2 (auto-detection algorithm)            |
| SS1.2a                    | `hybrid-parallelism.md` | SS1.0a (single-process mode context)        |

### New outgoing references from `mcp-server.md`

| From Section     | Target               | Section                                     |
| ---------------- | -------------------- | ------------------------------------------- |
| SS1.1a           | `python-bindings.md` | SS7.4 (Multi-Process Architecture)          |
| SS1.1a           | `python-bindings.md` | SS2.1 (multi-process `train()` API pattern) |
| Cross-References | `python-bindings.md` | SS1.2, SS7.4, SS2.1                         |

### New incoming references pointing at `python-bindings.md`

- `mcp-server.md` SS1.1a, line 41, and Cross-References now reference `python-bindings.md` SS7.4 and SS2.1 (new anchors created by this epic)

---

## Recommendations for Epic 05

Epic 05 covers testing and determinism verification. Based on what was established in Epic 04, the following guidance should inform ticket refinement.

### T17 (Backend Conformance Testing) should cover the multi-process Python lifecycle

The `cobre.train(num_workers=N)` path spawns real OS processes. Conformance tests for the shm and TCP backends must verify the full lifecycle from `python-bindings.md SS2.1a`: spawn, communicator creation per rank, result collection from rank 0, and `WorkerError` propagation when a worker fails. These tests differ in kind from unit tests of the `allgatherv`/`allreduce` protocols: they test the Python orchestration layer, not the Rust backend layer.
Reference: `src/specs/interfaces/python-bindings.md` SS2.1a.

### `WorkerError` propagation requires a dedicated test case

The error propagation protocol in SS6.1a (worker places exception on error queue, parent terminates remaining workers, parent raises `WorkerError`) is complex enough to merit its own test. The test should verify: (1) `WorkerError.inner` is populated when the worker raises a `CobreError`; (2) `WorkerError.inner` is `None` when the worker crashes without a Python exception; (3) remaining workers are terminated, not left as zombies.
Reference: `src/specs/interfaces/python-bindings.md` SS6.1a.

### `start_method="fork"` must be tested as a negative case

The prohibition on `start_method="fork"` (SS7.1, SS2.1a step 1) must be verified by a test that sets `multiprocessing.set_start_method("fork")` and then calls `cobre.train(num_workers=2)`, asserting that `CobreError` with `kind="IncompatibleSettings"` is raised. This is easy to write but easy to forget.
Reference: `src/specs/interfaces/python-bindings.md` SS2.1a (line 223).

### Determinism verification must use the `backend` parameter, not env vars alone

The `python-bindings.md` spec documents that backend-specific configuration (shm segment name, TCP coordinator address) is auto-generated by the library when `num_workers > 1`. This means determinism tests should use the high-level `cobre.train(num_workers=N, backend="shm")` path, not manually constructed per-rank invocations. The library's auto-generation is the surface under test; testing the lower-level env var path would bypass it.
Reference: `src/specs/interfaces/python-bindings.md` SS2.1a steps 3-4.

### `ProgressEvent.worker_id` multiplexing should be verified by an integration test

SS2.9 specifies that progress events from all workers arrive on a single callback with `worker_id` set. A conformance test should verify that with `num_workers=2`, callback invocations include events with both `worker_id=0` and `worker_id=1`, and that events from the same worker arrive in iteration order (though no cross-worker ordering guarantee exists).
Reference: `src/specs/interfaces/python-bindings.md` SS2.9 (lines 788-795).

### TCP backend Python path requires `COBRE_TCP_COORDINATOR` env var test coverage

The `backend="auto"` auto-detection in SS7.5 selects `"tcp"` when `COBRE_TCP_COORDINATOR` is set. This is a branch in the auto-detection logic that must be exercised. The test should set `COBRE_TCP_COORDINATOR=127.0.0.1:<ephemeral_port>` before calling `cobre.train(num_workers=2, backend="auto")` and verify TCP is selected (observable from `WorkerInfo.backend` values).
Reference: `src/specs/interfaces/python-bindings.md` SS7.5 (lines 1488-1491) and `src/specs/hpc/backend-tcp.md` SS8.1.
