# ticket-018: Define TrainingEvent Enum in cobre-core (GAP-013)

## Context

### Background

Training Loop SS2.1a lists event types (`ForwardPassComplete`, `BackwardPassComplete`, `ConvergenceUpdate`, etc.) with payload summaries in a table but provides no Rust type definitions. The spec says "Event types are defined in `cobre-core`" but no cobre-core spec contains these definitions. The events are needed for convergence monitoring, logging, JSON-lines streaming (Convergence Monitoring SS4.1), TUI rendering, and MCP progress notifications.

### Relation to Epic

This ticket resolves GAP-013 (High severity). It adds the concrete type definitions that the training loop event emission spec references. Without these types, an implementer cannot write the event channel or any downstream consumer.

### Current State

- **Training Loop SS2.1a**: Table with 7 per-iteration event types and 4 lifecycle event types, each with "Payload Summary" column.
- **Training Loop SS2.1a**: States `Option<broadcast::Sender<TrainingEvent>>` pattern.
- **Convergence Monitoring SS4.1**: Defines the JSON-lines schema matching the payload fields.
- **Internal Structures**: No event types defined (event types are runtime constructs, not data model).

## Specification

### Requirements

1. Add a new subsection SS2.1b "TrainingEvent Type Definitions" to `training-loop.md` immediately after SS2.1a.
2. Define the `TrainingEvent` enum with one variant per event type from the SS2.1a tables (7 per-iteration + 4 lifecycle = 11 variants total).
3. For each variant, define a payload struct with typed fields matching the "Payload Summary" column in the SS2.1a table. Use concrete Rust types (`u64` for iteration, `f64` for bounds, `Duration` or `u64` for milliseconds, `String` for case name/paths, `Vec<StoppingRuleResult>` for rules).
4. Specify that the enum lives in cobre-core (not cobre-sddp), consistent with SS2.1a's statement. The rationale is that event types are consumed by cobre-cli, cobre-tui, and cobre-mcp — all of which depend on cobre-core but not on cobre-sddp.
5. Specify that `TrainingEvent` derives `Clone` and `Debug`. It does NOT need `Send + Sync` because the event channel transfers ownership (the sender moves events into the channel).
6. Specify that events do NOT carry wall-clock timestamps. The consumer (logger, JSON-lines writer) is responsible for timestamping upon receipt. This avoids clock overhead in the hot path.
7. Add a `StoppingRuleResult` helper struct for the `ConvergenceUpdate` variant's `rules_evaluated` field:
   ```rust
   pub struct StoppingRuleResult {
       pub rule_type: String,  // "iteration_limit", "time_limit", etc.
       pub triggered: bool,
       pub detail: String,     // human-readable detail, e.g., "42/500 iterations"
   }
   ```
8. Add a cross-reference from SS2.1b to Convergence Monitoring SS4.1 (JSON-lines schema) and to Structured Output (for the streaming protocol).
9. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-013 as resolved.

### Inputs/Props

- Event type table from Training Loop SS2.1a
- JSON-lines schema from Convergence Monitoring SS4.1

### Outputs/Behavior

Concrete Rust enum and struct definitions that an implementer can use to build the event channel and all downstream consumers.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `training-loop.md`, when looking between SS2.1a and SS2.2, then a subsection SS2.1b "TrainingEvent Type Definitions" exists.
- [ ] Given SS2.1b, when counting the enum variants, then exactly 11 variants are defined (7 per-iteration + 4 lifecycle).
- [ ] Given SS2.1b, when checking the `ForwardPassComplete` variant, then it has typed fields for iteration (`u64`), scenarios (`u32`), lb_candidate (`f64`), ub_mean (`f64`), ub_std (`f64`), elapsed_ms (`u64`).
- [ ] Given SS2.1b, when checking the crate assignment, then it states the enum lives in cobre-core.
- [ ] Given SS2.1b, when checking derive traits, then `Clone` and `Debug` are listed.
- [ ] Given SS2.1b, when checking timestamps, then it explicitly states events do not carry timestamps.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-013 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/training-loop.md` and locate SS2.1a.
2. Insert subsection `### 2.1b TrainingEvent Type Definitions` after SS2.1a.
3. Write the enum definition with all 11 variants. For each variant, either inline the fields or define a separate payload struct (choose based on field count — variants with > 4 fields get a payload struct).
4. Add the crate assignment note, derive note, timestamp note, and cross-references.
5. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
6. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` — Add SS2.1b subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-013 resolution row to Section 7 table

### Patterns to Follow

- **Rust enum definition**: Follow the `SolverError` pattern in Solver Interface Trait SS3 — enum with doc comments per variant, struct variants for complex payloads.
- **Subsection numbering**: "2.1b" follows the "2.1a" pattern.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT place the enum in cobre-sddp. It must be in cobre-core because downstream crates (cobre-cli, cobre-tui, cobre-mcp) consume events.
- Do NOT add `Send + Sync` derives. The event channel transfers ownership via move semantics; `Clone` is needed for broadcast channels (multiple consumers).
- Do NOT add timestamps to events. Timestamping is the consumer's responsibility.
- Do NOT resolve the event channel implementation (GAP-032, Low severity). This ticket defines the event types only. The channel choice (`crossbeam` vs `tokio::broadcast`) is a separate concern.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: None (independent of LP layout and state vector work)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
