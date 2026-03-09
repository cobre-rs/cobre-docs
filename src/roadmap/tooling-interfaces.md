# Tooling & Interfaces

This page covers planned additions to the tooling ecosystem around the Cobre solver: validation tooling for trained policies, and the three interface crates that expose Cobre to different consumer contexts (AI agents via MCP, Python workflows via PyO3, and interactive terminal monitoring via ratatui).

---

## C.9 Policy Compatibility Validation

When the solver runs in simulation-only mode, warm-start mode, or resumes from a checkpoint, it must validate that the current input data is compatible with the previously trained policy. The policy (cut coefficients) encodes LP structural information: the number of state variables, the constraint topology, the block configuration, the penalty values. If any of these change between training and simulation, the cuts become invalid and produce silently incorrect results.

The planned mechanism has two components:

1. **Policy metadata record** — During training, the solver persists a metadata record alongside the cut data, capturing all input properties that affect LP structure. The record is versioned for forward compatibility.
2. **Validation phase** — At the start of simulation or warm-start, the current input is compared against the metadata. Any mismatch produces a hard error with a clear description of what changed.

Properties that must be validated include: block mode and block count per stage, number of hydro plants and their AR orders, cascade topology, bus and line count, thermal and contract counts, production model per hydro, and penalty configuration. Some properties may allow controlled relaxation in the future (for example, adding a new thermal plant at the end of the generator list might be compatible if the state variable dimensions are unchanged), but the initial implementation validates everything strictly.

**Why it is deferred**: This is a cross-cutting concern touching training, simulation, checkpointing, and input loading. All prerequisite specs are now approved, and C.9 is unblocked pending a dedicated specification that defines the complete property list, the metadata format, the validation algorithm, and the error reporting format.

**Prerequisites** (all now met):

- Training loop architecture finalized — [Training Loop](../specs/architecture/training-loop.md) approved
- Checkpoint format defined — [Checkpointing](../specs/hpc/checkpointing.md) and [Binary Formats §3-§4](../specs/data-model/binary-formats.md) approved
- Simulation architecture finalized — [Simulation Architecture](../specs/architecture/simulation-architecture.md) approved
- Input loading pipeline defined — [Input Loading Pipeline](../specs/architecture/input-loading-pipeline.md) approved

**Estimated effort**: Medium (2-3 weeks). Primarily specification and testing; implementation is straightforward once the property list is defined.

**See also**: [Deferred Features §C.9](../specs/deferred.html#c9-policy-compatibility-validation), [Binary Formats](../specs/data-model/binary-formats.md)

---

## MCP Server (`cobre-mcp`)

The MCP server exposes Cobre as a first-class tool for AI coding agents via the Model Context Protocol. It runs as a standalone binary (`cobre-mcp`) or as a `cobre serve` subcommand, in single-process mode without MPI. Computation is delegated to `cobre-sddp`; all tool responses use the structured output envelope defined in [Structured Output](../specs/interfaces/structured-output.md).

The server exposes Cobre's run, validate, and report capabilities as MCP tools, with streaming progress updates for long-running training jobs. Multi-process execution via TCP or shared memory backends is architecturally possible but deferred pending demonstrated demand from MCP-based agent workflows.

The full specification is in [MCP Server](../specs/interfaces/mcp-server.md).

---

## Python Bindings (`cobre-python`)

The Python bindings expose Cobre's solver to Python workflows as the `cobre` module via PyO3. The module compiles to a shared library (`cdylib`) that is installed and imported like any other Python package.

Key design points: the GIL is released during all Rust computation; NumPy and Arrow FFI provide zero-copy data paths; MPI is prohibited from the Python interface (multi-process execution uses TCP or shared memory backends instead). The Python exception hierarchy maps to Cobre's structured error kind registry.

The full specification is in [Python Bindings](../specs/interfaces/python-bindings.md).

---

## Terminal UI (`cobre-tui`)

The terminal UI provides real-time monitoring of SDDP training runs in the terminal. It is built on ratatui and renders convergence plots, iteration timing breakdowns, cut statistics, resource usage, and MPI communication metrics.

The TUI operates in two modes: co-hosted within the `cobre` binary via an in-process broadcast channel (sharing the same process as the solver), or standalone reading JSON-lines from stdin for monitoring remote or already-running jobs. Interactive features — pause/resume, cut inspection, scenario comparison, stopping rule adjustment — all operate at iteration boundaries to preserve training loop atomicity.

The full specification is in [Terminal UI](../specs/interfaces/terminal-ui.md).
