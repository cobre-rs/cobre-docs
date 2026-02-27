# ticket-010 Replace Event Channel with std::sync::mpsc

## Context

### Background

GAP-032 identified that `training-loop.md` SS2.1a uses `Option<broadcast::Sender<TrainingEvent>>` for the event channel, but `broadcast` is not a standard library type -- it implies `tokio::sync::broadcast`, which introduces an async runtime dependency inappropriate for a synchronous MPI binary. The stakeholder design review decided to use `std::sync::mpsc` for the synchronous CLI binding, reserving `tokio::sync::broadcast` for deferred async interfaces (Python, MCP). This ticket replaces the `broadcast::Sender` reference in the spec and adds a design note explaining the channel architecture.

### Relation to Epic

Epic 04 resolves the five remaining gaps. This ticket resolves GAP-032 by specifying the event channel mechanism in the training loop spec. The gap inventory resolution log (section 7) records this ticket as the closer and cites `cli-and-lifecycle.md` as the target for the event channel specification.

### Current State

- `src/specs/architecture/training-loop.md` SS2.1a line 67 currently reads: `The event channel uses an Option<broadcast::Sender<TrainingEvent>> pattern: when None, no events are emitted (zero overhead for library-mode callers). When Some(sender), events are emitted at each step boundary. Consumers are additive -- multiple can subscribe simultaneously.`
- The same section ends with a note (line 274): `GAP-032 (event channel implementation): The channel type and backpressure policy are not specified here. GAP-032 remains open for the channel mechanism design.`
- `src/specs/interfaces/terminal-ui.md` references `broadcast::Sender<TrainingEvent>` in its co-hosted mode description (lines 53, 59, 66, 101, 510, 513).
- `src/specs/interfaces/mcp-server.md` line 1470 references the `broadcast` event channel.
- The gap inventory section 7 resolution log already records: "Event channel uses `std::sync::mpsc`; no tokio or crossbeam dependency. See [CLI and Lifecycle](../architecture/cli-and-lifecycle.md)."

## Specification

### Requirements

1. In `training-loop.md` SS2.1a, replace the `Option<broadcast::Sender<TrainingEvent>>` pattern description with `Option<std::sync::mpsc::Sender<TrainingEvent>>`.
2. Replace the "Consumers are additive -- multiple can subscribe simultaneously" sentence with an explanation of the single-consumer model: the `mpsc` channel has one consumer (the event dispatcher thread or the CLI logger). Multiple output sinks (text logger, JSON-lines writer, TUI, Parquet writer) are handled by the single consumer fanning out internally, not by multiple channel subscribers.
3. Remove the GAP-032 open note at line 274 (the gap is now resolved).
4. Add a design note paragraph explaining:
   - `std::sync::mpsc` is chosen because the training loop is synchronous (no tokio runtime).
   - No external dependency (crossbeam, tokio) is needed.
   - For deferred async interfaces (`cobre-python`, `cobre-mcp`), `tokio::sync::broadcast` or an equivalent async channel may be used in those crate-specific event bridges -- but the core training loop channel is `std::sync::mpsc`.
   - Backpressure policy: the channel is unbounded (`mpsc::channel()` not `sync_channel`). Events are small (< 1 KB) and emitted at most once per iteration step, so unbounded is acceptable. If memory becomes a concern, `sync_channel(capacity)` can replace it.

### Inputs/Props

- The current SS2.1a text in `training-loop.md`.
- The `TrainingEvent` enum definition in SS2.1b (unchanged -- it remains `Clone + Debug`).

### Outputs/Behavior

SS2.1a describes the event channel using `std::sync::mpsc::Sender<TrainingEvent>`, with a design note on why `mpsc` was chosen and how multiple consumers are handled by a single dispatcher.

### Error Handling

Not applicable (documentation ticket).

### Out of Scope

- Modifying `terminal-ui.md` or `mcp-server.md` -- those files describe deferred interfaces that may use different channel types. They are not part of the minimal viable spec content.
- Defining the event dispatcher thread architecture (that is a CLI/lifecycle concern, not a training loop concern).
- Changing the `TrainingEvent` type definitions in SS2.1b.

## Acceptance Criteria

- [ ] Given `src/specs/architecture/training-loop.md` SS2.1a, when the section is read, then the phrase `broadcast::Sender<TrainingEvent>` does not appear anywhere in the file.
- [ ] Given `src/specs/architecture/training-loop.md` SS2.1a, when the section is read, then `std::sync::mpsc::Sender<TrainingEvent>` appears as the channel type.
- [ ] Given `src/specs/architecture/training-loop.md`, when searching for "GAP-032", then no open/unresolved note appears (the GAP-032 note has been removed or replaced with a resolved reference).
- [ ] Given `src/specs/architecture/training-loop.md` SS2.1a, when the section is read, then a design note explains why `std::sync::mpsc` was chosen (synchronous binary, no tokio dependency) and how multiple output sinks are served by a single consumer.
- [ ] Given the modified file, when `mdbook build` is run, then it completes with exit code 0 and no new warnings.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/training-loop.md` SS2.1a (lines 44-67 and the GAP-032 note near line 274).
2. In the paragraph at line 67, replace:
   - `Option<broadcast::Sender<TrainingEvent>>` with `Option<std::sync::mpsc::Sender<TrainingEvent>>`
   - "Consumers are additive -- multiple can subscribe simultaneously" with: "The channel has a single receiver. Multiple output sinks (text logger, JSON-lines writer, TUI renderer, Parquet convergence writer) are served by a single consumer thread that dispatches each received event to all registered sinks. This fan-out is internal to the consumer, not a property of the channel."
3. After the modified paragraph, add a design note:
   > **Design note (GAP-032).** The event channel uses `std::sync::mpsc` from the Rust standard library. This avoids introducing `tokio` or `crossbeam` as dependencies in `cobre-sddp` or `cobre-core`. The training loop is synchronous -- it runs inside an MPI process with no async runtime. The channel is unbounded (`mpsc::channel()`) because events are small (< 1 KB each) and emitted at most 7 times per iteration (one per lifecycle step in SS2.1a), so memory pressure from buffered events is negligible. Deferred async interface crates (`cobre-python`, `cobre-mcp`) may bridge to `tokio::sync::broadcast` or equivalent async channels in their own event adapters.
4. Remove the GAP-032 open note near line 274 entirely.
5. Run `mdbook build` to verify.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` (SS2.1a paragraph and GAP-032 note only)

### Patterns to Follow

- Design note format: `> **Design note (GAP-NNN).**` followed by the rationale paragraph -- consistent with how other design decisions are documented inline in architecture specs (see SS2.1b timestamp policy note for style reference).
- When removing the GAP-032 open note, do not leave orphaned blank lines.

### Pitfalls to Avoid

- Do NOT modify `terminal-ui.md` or `mcp-server.md` -- those files describe deferred interface crates and may legitimately use `broadcast` in their own context.
- Do NOT change the `TrainingEvent` derive traits in SS2.1b. The note says events do not require `Send + Sync` "because the event channel transfers ownership" -- this is still correct for `mpsc`.
- Do NOT add `Send + Sync` bounds to `TrainingEvent` -- the existing `Clone + Debug` derives are sufficient.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Run `mdbook build` from the repo root; verify exit code 0.
- Run `grep 'broadcast::Sender' src/specs/architecture/training-loop.md` and verify no matches.
- Run `grep 'GAP-032.*open\|GAP-032.*remains' src/specs/architecture/training-loop.md` and verify no matches.
- Run `grep 'std::sync::mpsc' src/specs/architecture/training-loop.md` and verify at least one match.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
