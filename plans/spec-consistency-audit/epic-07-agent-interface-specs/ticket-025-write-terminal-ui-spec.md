# ticket-025 Write terminal-ui.md Spec

## Context

### Background

Epic 06 produced a comprehensive TUI assessment (findings-020 SS3) covering the training loop event model, convergence plot data source, 5 monitoring views, 5 interactive features, and the relationship to structured output. The architecture document (architecture-021.md SS2.3) defines the `cobre-tui` crate's responsibility boundaries, and SS5.4 defines the exact scope for this spec. The event stream architecture (architecture-021.md SS3) defines the shared event types that the TUI consumes alongside the CLI JSON-lines writer, MCP progress notifications, and Parquet writer.

### Relation to Epic

This is one of three interface layer specs (alongside ticket-023 and ticket-024) that can proceed in parallel once ticket-022 (structured output) is complete. The TUI spec depends on the structured output spec because the TUI consumes the same event types defined in the structured output JSON-lines protocol. ticket-026 depends on this spec for cross-reference integration and new crate documentation.

### Current State

- No file exists at `src/specs/interfaces/terminal-ui.md` and the `src/specs/interfaces/` directory does not exist yet (ticket-022 creates it).
- `findings-020.md` SS3.1 defines the 7-step training loop event model with event names and payload shapes.
- `findings-020.md` SS3.2 defines the convergence plot data source (exact mapping from convergence-monitoring.md SS2.4 fields to plot axes).
- `findings-020.md` SS3.3 defines 5 monitoring views with primary data sources and update frequencies.
- `findings-020.md` SS3.4 defines 5 interactive features with mechanisms and training loop impact.
- `findings-020.md` SS3.5 describes the relationship to structured output (same event stream, TUI is an additional subscriber).
- `architecture-021.md` SS2.3 provides the crate responsibility table, consumption modes (co-hosted and standalone pipe), and monitoring view list.
- `architecture-021.md` SS3 defines the complete event stream architecture with event types, payload shapes, Rust struct definitions, and consumer registration pattern.
- `architecture-021.md` SS6.1 Q-2 documents the resolved assumption: TUI is both a library crate consumed by `cobre-cli` (feature flag `tui`) and can be compiled as a standalone binary for pipe mode.

## Specification

### Requirements

Create the file `src/specs/interfaces/terminal-ui.md` containing a complete, implementation-ready specification for the Cobre terminal UI. The spec must cover all six areas defined in architecture-021.md SS5.4:

1. **Event consumption model** -- Both modes per findings-020 SS3.5 and architecture-021.md SS2.3:
   - **Co-hosted mode**: In-process `broadcast` channel subscription within the `cobre` binary. Activated via `cobre run --tui`. TUI runs on a separate thread, receives events via channel, renders to the terminal.
   - **Standalone pipe mode**: Reads JSON-lines from stdin. Activated via `mpiexec cobre run --output-format json-lines | cobre-tui` or `cobre-tui < progress.jsonl`. Deserializes JSON-lines events using the same event types from `cobre-core`.

   Document the event type deserialization for pipe mode, backpressure handling (dropped events per architecture-021.md SS3.4), and gap tolerance (TUI must handle missing events gracefully).

2. **View specifications** -- Layout and data sources for all 5 monitoring views per findings-020 SS3.3:

   | View             | Primary Data Source                              | Update Frequency    |
   | ---------------- | ------------------------------------------------ | ------------------- |
   | Convergence Plot | `ConvergenceUpdate` events                       | Once per iteration  |
   | Iteration Detail | `IterationSummary` events                        | Once per iteration  |
   | Cut Statistics   | `CutSyncComplete` events                         | Once per iteration  |
   | Resource Usage   | OS-level telemetry + MPI rank timing             | Continuous (polled) |
   | Communication    | `ForwardSyncComplete` + `CutSyncComplete` events | Once per iteration  |

   For each view, provide: ASCII layout mockup, data field-to-widget mapping, rendering approach (ratatui widget type suggestions), and update logic.

3. **Convergence plot data model** -- Mapping from `ConvergenceUpdate` event fields to plot axes per findings-020 SS3.2:
   - X-axis: `iteration` (primary) or `wall_time` (alternative time-based view)
   - Y-axis primary series: `lower_bound` (monotonically non-decreasing), `upper_bound` (with error bars from `ci_95`)
   - Y-axis secondary: `gap` (annotation or separate axis)
   - Error bars: derived from `upper_bound_std` and `ci_95`
   - Scale options: linear or logarithmic Y-axis

4. **Interactive features** -- All 5 features per findings-020 SS3.4, with the iteration-boundary constraint:
   - **Pause/resume**: Set pause flag checked at iteration boundary (between Step 7 and Step 1 of next iteration). Training blocks until resume.
   - **Cut inspection**: Read-only access to in-memory cut pool for a selected stage. Requires pause or snapshot at iteration boundary.
   - **Scenario comparison**: Side-by-side forward pass results for selected scenario indices. Read-only access to visited states.
   - **Stopping rule adjustment**: Modify stopping rule parameters (tolerance, iteration limit) at runtime. Convergence monitor reads updated parameters at each iteration.
   - **Snapshot export**: Write current convergence history and cut pool to files using existing checkpoint mechanism.

   Document the iteration-boundary constraint explicitly: interactive features that read training state MUST operate between iterations, never mid-iteration.

5. **Keyboard shortcuts and navigation** -- Key bindings table for:
   - View switching (e.g., `1`-`5` for views, `Tab` for cycling)
   - Scrolling within views
   - Interactive command triggers (e.g., `p` for pause, `e` for export)
   - Help overlay toggle
   - Quit

6. **Rendering requirements** -- Minimum terminal size, color support (16-color minimum, 256-color preferred, truecolor optional), Unicode requirements (box-drawing characters for plot borders), graceful degradation on undersized terminals.

### Inputs/Props

| Source Document             | Relevant Sections                  | What to Extract                                            |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `findings-020.md`           | SS3.1 (event model, 7+4 events)    | Event names, payload shapes, lifecycle                     |
| `findings-020.md`           | SS3.2 (convergence plot data)      | Field-to-axis mapping                                      |
| `findings-020.md`           | SS3.3 (5 monitoring views)         | View table with data sources and frequencies               |
| `findings-020.md`           | SS3.4 (5 interactive features)     | Feature mechanisms and training loop impact                |
| `findings-020.md`           | SS3.5 (structured output relation) | Event stream architecture diagram                          |
| `architecture-021.md`       | SS2.3 (cobre-tui boundaries)       | Crate type, consumption modes, monitoring views            |
| `architecture-021.md`       | SS3 (event stream)                 | Event types, payloads, consumer registration, backpressure |
| `architecture-021.md`       | SS5.4 (scope definition)           | Must-contain, must-NOT-contain boundaries                  |
| `architecture-021.md`       | SS6.1 Q-2                          | TUI as library + standalone binary                         |
| `convergence-monitoring.md` | SS2.4 (per-iteration record)       | Canonical fields for convergence plot                      |

### Outputs/Behavior

A single markdown file at `src/specs/interfaces/terminal-ui.md` that:

- Follows the style and depth of existing architecture specs
- Contains ASCII mockups for all 5 monitoring views showing layout structure
- Contains the convergence plot data model with field-to-axis mapping
- Contains the keyboard shortcut table
- Contains the rendering requirements and terminal compatibility matrix
- Is self-contained enough for a developer to implement the ratatui TUI without reading the assessment documents

### Error Handling

- The spec must define what happens when the event channel drops events (backpressure): TUI renders the last received state and shows a "lagging" indicator, does not crash
- The spec must define behavior when pipe input ends unexpectedly: TUI enters "replay complete" mode showing the last known state
- The spec must define behavior when terminal is resized below minimum dimensions: show a "terminal too small" message instead of corrupted rendering

## Acceptance Criteria

- [ ] Given the file `src/specs/interfaces/terminal-ui.md` does not exist, when the ticket is completed, then the file exists with complete content
- [ ] Given the spec exists, when reading the event consumption section, then both co-hosted (broadcast channel) and standalone (JSON-lines pipe) modes are documented with deserialization and backpressure handling
- [ ] Given the spec exists, when reading the view specifications section, then all 5 views have ASCII mockups, data field-to-widget mappings, and update logic
- [ ] Given the spec exists, when reading the convergence plot section, then the field-to-axis mapping table covers all 8 fields from `ConvergenceUpdate` with axis assignment and rendering notes
- [ ] Given the spec exists, when reading the interactive features section, then all 5 features are documented with mechanisms, training loop impact, and the iteration-boundary constraint is stated explicitly
- [ ] Given the spec exists, when reading the keyboard shortcuts section, then a complete keybinding table exists for view switching, scrolling, interactive commands, help, and quit
- [ ] Given the spec exists, when reading the rendering requirements section, then minimum terminal size, color support levels, Unicode requirements, and graceful degradation are documented
- [ ] Given the spec exists, when checking cross-references, then it references: `structured-output.md`, `convergence-monitoring.md` SS2.4, `training-loop.md` SS2.1, `architecture-021.md` SS2.3 and SS3, `checkpointing.md`
- [ ] Given the spec exists, when checking must-NOT-contain boundaries, then it does NOT contain CLI protocol details, MCP protocol definitions, or Python API specifications
- [ ] Given `mdbook build` is run from the repo root, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Verify `src/specs/interfaces/` directory exists (ticket-022 creates it; if running in parallel, create it if absent).
2. Create `src/specs/interfaces/terminal-ui.md` with the following section structure:
   - **Purpose** -- 1-paragraph summary: ratatui-based TUI for interactive monitoring of SDDP training runs
   - **1. Crate Architecture** -- Library crate consumed by `cobre-cli` (feature flag `tui`), optional standalone binary for pipe mode. Dependency: `cobre-core` only (for event type deserialization). External dependencies: `ratatui`, `crossterm`
   - **2. Event Consumption** -- SS2.1 Co-hosted mode (broadcast channel), SS2.2 Standalone pipe mode (JSON-lines stdin), SS2.3 Backpressure and gap tolerance
   - **3. Monitoring Views** -- SS3.1 through SS3.5 with ASCII mockup for each view
   - **4. Convergence Plot Data Model** -- Field-to-axis mapping table, scale options, error bar rendering
   - **5. Interactive Features** -- SS5.1 through SS5.5 with mechanism and constraint for each
   - **6. Keyboard Shortcuts** -- Keybinding table
   - **7. Rendering Requirements** -- Terminal size, color, Unicode, graceful degradation
   - **8. Offline Mode** -- Browse results from completed studies by reading `convergence.parquet` and rendering the convergence plot without a live event stream
   - **Cross-References** -- Links to source specs

3. For ASCII mockups, create simple box-drawing layouts showing the relative position of widgets within each view. The mockups should be 60-80 characters wide and 15-25 lines tall.
4. For the convergence plot, show a sample rendering using ASCII characters (e.g., `*` for data points, `-` for axes) to illustrate the intended visualization.

### Key Files to Modify

| File                                  | Action                                 |
| ------------------------------------- | -------------------------------------- |
| `src/specs/interfaces/terminal-ui.md` | **CREATE** -- The entire spec document |

No existing files are modified by this ticket.

### Patterns to Follow

- **Spec structure pattern**: Follow `convergence-monitoring.md` for Purpose + numbered sections + cross-references
- **View specification pattern**: For each view, provide: purpose, data source, update frequency, ASCII mockup, widget mapping
- **Interactive feature pattern**: Follow findings-020 SS3.4 table format: Feature, Mechanism, Impact on Training Loop
- **Event type reference pattern**: Reference event types by name (e.g., `ConvergenceUpdate`, `IterationSummary`) and link to architecture-021.md SS3.2 for definitions rather than duplicating the full payload schemas

### Pitfalls to Avoid

- Do NOT define CLI structured output protocol details -- reference `structured-output.md` for event type serialization
- Do NOT define MCP protocol details or Python API specifications
- Do NOT propose mid-iteration inspection -- findings-020 SS3.4 explicitly states the iteration-boundary constraint
- Do NOT make the TUI depend on `cobre-sddp` directly -- in co-hosted mode, the `cobre-cli` binary mediates the connection; in pipe mode, the TUI reads JSON-lines and depends only on `cobre-core` for type definitions
- Do NOT forget the Resource Usage view's polling-based update (it is the only view that does not update per-iteration from events; it polls OS-level telemetry)
- Do NOT make the convergence plot data model require any fields beyond what `convergence-monitoring.md` SS2.4 already defines -- the TUI consumes the exact same record, no extensions needed

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-022 (structured output spec -- shared event type definitions)
- **Blocks**: ticket-026

## Effort Estimate

**Points**: 3
**Confidence**: High
