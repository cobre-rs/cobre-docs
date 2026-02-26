# ticket-020: Specify Simulation-Based Stopping Rule Interaction (GAP-015)

## Context

### Background

The simulation-based stopping rule (Stopping Rules SS5) requires running Monte Carlo simulations during training to assess policy stability. Convergence Monitoring SS2.3 step 4 references the rule but the interaction with the main training loop is underspecified: whether simulation reuses the training LP infrastructure, whether it blocks the training loop, thread consumption, and scenario source.

### Relation to Epic

This ticket resolves GAP-015 (High severity). It specifies how the simulation check integrates with the training loop's iteration lifecycle, which is critical for both correctness (the simulation must use the current policy) and performance (the simulation must not dominate wall-clock time).

### Current State

- **Stopping Rules SS5**: Algorithm: (1) check bound stability, (2) if stable, run `replications` Monte Carlo simulations, (3) compare per-stage costs to previous simulation. Config: `period`, `replications`, `bound_window`, `distance_tol`, `bound_tol`.
- **Convergence Monitoring SS2.3 step 4**: "If the check period has elapsed: test bound stability, then run Monte Carlo simulations and compare to previous; if both stable, report converged."
- **Training Loop SS2.1 step 5**: "Convergence update -- Update bound estimates, evaluate stopping rules."
- **Solver Workspaces SS1**: Thread-local solver instances with per-stage basis caches. Workspaces are allocated at initialization and persist for the training run.

## Specification

### Requirements

1. Add a new subsection SS2.3a "Simulation-Based Stopping Rule Integration" to `convergence-monitoring.md` immediately after SS2.3.
2. Specify that the simulation check runs **synchronously** — it blocks the training loop iteration. The simulation check replaces the normal convergence evaluation at every `period`-th iteration: the check iteration takes longer, but the training loop resumes normally afterward.
3. Specify that the simulation reuses the same solver workspaces as the training forward pass. No separate LP instances are needed. The simulation is essentially a forward pass with a different set of scenarios and without recording visited states for the backward pass.
4. Specify the scenario source: the simulation uses **fresh InSample draws** from the fixed opening tree with a separate seed derived from `base_seed + iteration` (via the seed derivation function from ticket-019). The simulation scenarios are independent of the training forward pass scenarios at the same iteration.
5. Specify the number of simulation scenarios: `replications` from the stopping rule config (typically 100). These are distributed across ranks using the same contiguous block assignment as the training forward pass (Training Loop SS4.3).
6. Specify thread consumption: all OpenMP threads participate in the simulation forward pass. The simulation forward pass is structurally identical to the training forward pass (same solver workspaces, same stage loop), differing only in the scenario set and the absence of state recording for the backward pass.
7. Specify the comparison metric: per-stage mean costs from the `replications` simulations are compared to the per-stage mean costs from the previous simulation check (stored in the convergence monitor). The normalized distance formula is from Stopping Rules SS5 step 2.
8. Specify what happens on the first check: if no previous simulation costs exist (first time the check period elapses), the simulation runs, stores the per-stage costs, but does not trigger convergence (there is no previous result to compare against). The next check period will have a comparison baseline.
9. Add a performance note: at production scale ($T=120$ stages, 100 replications, 16 ranks), the simulation check performs $120 \times \lceil 100/16 \rceil = 120 \times 7 = 840$ LP solves per rank. With warm-start, each solve takes ~2 ms, so the simulation check adds ~1.7 seconds — modest compared to a full training iteration (~45 seconds).
10. Add a cross-reference to Training Loop SS2.1 step 5, Stopping Rules SS5, and Solver Workspaces SS1.
11. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-015 as resolved.

### Inputs/Props

- Stopping rule config from Stopping Rules SS5
- Convergence monitor state from SS2.1
- Solver workspaces from Solver Workspaces SS1

### Outputs/Behavior

A boolean convergence signal (stable or not), plus stored per-stage mean costs for the next comparison.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `convergence-monitoring.md`, when looking after SS2.3, then a subsection SS2.3a "Simulation-Based Stopping Rule Integration" exists.
- [ ] Given SS2.3a, when reading the execution model, then it states synchronous (blocking) execution.
- [ ] Given SS2.3a, when reading the workspace usage, then it states reuse of training solver workspaces.
- [ ] Given SS2.3a, when reading the scenario source, then it states fresh InSample draws with a separate seed.
- [ ] Given SS2.3a, when reading the distribution, then it states contiguous block assignment across ranks.
- [ ] Given SS2.3a, when reading the first-check behavior, then it states no convergence trigger on the first check (no comparison baseline).
- [ ] Given SS2.3a, when reading the performance note, then it shows ~840 solves per rank with ~1.7 second estimate.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-015 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/convergence-monitoring.md` and locate SS2.3.
2. Insert subsection `### 2.3a Simulation-Based Stopping Rule Integration` after SS2.3.
3. Write the specification covering all 9 technical requirements.
4. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
5. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/convergence-monitoring.md` — Add SS2.3a subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-015 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: "2.3a" pattern.
- **Performance note**: Follow the pattern in Solver Abstraction SS2.5 (numeric performance analysis with specific values and formulas).
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT specify asynchronous execution. Async simulation would require separate solver instances (double memory) and complex synchronization. Synchronous is simpler and sufficient for the check frequency (every 20 iterations).
- Do NOT specify separate LP instances. Reusing the training workspaces is correct because the simulation uses the same LP structure with different scenario values.
- Do NOT specify External or Historical scenarios for the simulation check. The simulation always uses InSample draws from the opening tree.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-009 (state vector format affects simulation state management — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
