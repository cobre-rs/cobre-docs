# ticket-025 Write terminal-ui.md Spec

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Write a full implementation-ready specification for the Cobre terminal UI. This spec defines: the `cobre-tui` ratatui-based crate, monitoring views (convergence, iteration detail, resource usage), interactive features (pause, inspect, compare), the event/progress stream consumption pattern, and the relationship to structured CLI output.

## Anticipated Scope

- **File to create**: `src/specs/architecture/terminal-ui.md`
- **Spec sections**:
  1. Purpose: interactive monitoring and exploration of running or completed studies
  2. Architecture: `cobre-tui` crate using ratatui, consuming JSON-lines progress stream
  3. Invocation patterns:
     - `cobre tui /path/to/case` — Monitor a running or completed study
     - `cobre run --tui /path/to/case` — Run with live TUI
  4. Monitoring views:
     - **Convergence view**: Live upper/lower bound plot, gap evolution, iteration markers
     - **Iteration detail view**: Per-iteration timing, cuts added/removed, stage breakdown
     - **Resource view**: Memory per rank, CPU utilization, communication overhead
     - **Cut pool view**: Cut statistics, selection activity, memory usage
  5. Interactive features:
     - Pause/resume training (sends signal to solver process)
     - Inspect cuts at specific iteration
     - Compare convergence of two runs side-by-side
     - Export current view to file (SVG, CSV)
  6. Event stream protocol: same JSON-lines format as structured output progress events
  7. Offline mode: browse results from completed studies without running solver
  8. Crate architecture: dependency on shared event types, no dependency on solver crates
  9. Accessibility: keyboard navigation, screen reader compatibility, color theming
- **Key decisions**: Uses findings from ticket-020 impact assessment
- **Spec depth**: Concrete view layouts (ASCII mockups), event type schemas, keybinding tables

## Dependencies

- **Blocked By**: ticket-022 (TUI consumes the structured output event stream)
- **Blocks**: ticket-026

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
