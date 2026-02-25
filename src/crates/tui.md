# cobre-tui

<span class="status-experimental">experimental</span>

## Overview

cobre-tui is a library crate (consumed by `cobre-cli`) that provides an
interactive terminal UI for real-time training monitoring, convergence
visualization, cut inspection, and simulation progress tracking. It uses
`ratatui` and `crossterm` for terminal rendering.

The TUI operates in two consumption modes: **co-hosted** (in-process
broadcast channel subscription within the `cobre` binary, activated by
`cobre run --tui`) and **standalone pipe** (reads JSON-lines from stdin,
e.g., `mpiexec cobre run ... --output-format json-lines | cobre-tui`). Both
modes consume the same event types defined in `cobre-core`.

In co-hosted mode, the TUI runs on rank 0 only and renders alongside the
training loop. It subscribes to the same event channel as the text logger
and Parquet writer. Interactive features (pause, inspect, adjust stopping
rules) operate at iteration boundaries only -- the training loop is not
designed for mid-iteration inspection.

## Key Concepts

- **Ratatui rendering** -- Terminal-based UI using `ratatui` for layout and
  `crossterm` for terminal control. Supports convergence plot (LB/UB lines
  with CI bands), iteration detail, cut statistics, resource usage, and
  communication breakdown views.
  See [Terminal UI](../specs/interfaces/terminal-ui.md).

- **Event consumption** -- Subscribes to the shared event stream from the
  training loop. Seven iteration-scoped event types (`ForwardPassComplete`
  through `IterationSummary`) plus lifecycle events (`TrainingStarted`,
  `TrainingFinished`, `SimulationProgress`, `SimulationFinished`).
  See [Terminal UI](../specs/interfaces/terminal-ui.md).

- **Co-hosted and standalone modes** -- Co-hosted mode uses an in-process
  broadcast channel for zero-copy event delivery. Standalone mode reads
  JSON-lines from stdin, enabling monitoring of remote or already-running
  jobs without process co-location.
  See [Terminal UI](../specs/interfaces/terminal-ui.md).

- **Interactive features** -- Pause/resume training at iteration boundary,
  read-only cut inspection, scenario comparison, stopping rule adjustment,
  and snapshot export. All interactive operations that read training state
  operate at iteration boundaries.
  See [Terminal UI](../specs/interfaces/terminal-ui.md).

- **Keyboard navigation** -- Tab-based view switching, arrow key scrolling,
  keyboard shortcuts for all interactive features. Minimum terminal size
  and color support requirements documented.
  See [Terminal UI](../specs/interfaces/terminal-ui.md).

## Dependencies

```
cobre-cli
  +-- cobre-tui
  |     +-- cobre-core (event type definitions only)
  +-- cobre-sddp
  +-- cobre-io
  +-- cobre-core
```

In standalone pipe mode:

```
cobre-tui (standalone binary)
  +-- cobre-core (event types for deserialization)
```

cobre-tui does NOT depend on `ferrompi`, `cobre-io`, `cobre-solver`, or
`cobre-stochastic`. It depends only on `cobre-core` for shared event type
definitions.

## Status

cobre-tui is in the **design phase**. The terminal UI spec linked above is
the authoritative reference for implementation. No Rust code has been
published yet; the crate placeholder exists in the Cargo workspace to
reserve the module boundary.
