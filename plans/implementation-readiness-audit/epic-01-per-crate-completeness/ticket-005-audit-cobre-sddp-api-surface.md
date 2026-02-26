# ticket-005 Audit cobre-sddp API Surface Completeness

## Context

### Background

cobre-sddp is the largest and most complex crate, implementing the SDDP training loop, simulation pipeline, convergence monitoring, and FCF (Future Cost Function) management. It is Phase 6 in the implementation ordering and depends on cobre-core, cobre-stochastic, cobre-solver, and cobre-comm. This crate coordinates the forward pass, backward pass, cut generation, cross-rank synchronization, and all five stopping rules. Approximately 20 of the original 38 gaps were in cobre-sddp, making it the dominant gap crate.

### Relation to Epic

This is ticket 5 of 8 in the per-crate completeness audit. cobre-sddp has the largest API surface of any crate and the most complex internal architecture, warranting the highest effort estimate (5 points).

### Current State

The cobre-sddp API surface is specified across many files:

- `src/specs/architecture/training-loop.md` -- Training loop orchestrator, iteration lifecycle, forward/backward pass, event emission (868 lines)
- `src/specs/architecture/simulation-architecture.md` -- Simulation pipeline (254 lines)
- `src/specs/architecture/convergence-monitoring.md` -- Lower/upper bound tracking, stopping rule evaluation (382 lines)
- `src/specs/architecture/cut-management-impl.md` -- FCF runtime structure, cut pool, CutWireRecord (329 lines)
- `src/specs/architecture/risk-measure-trait.md` -- RiskMeasure trait (249 lines)
- `src/specs/architecture/horizon-mode-trait.md` -- HorizonMode trait (473 lines)
- `src/specs/architecture/cut-selection-trait.md` -- CutSelectionStrategy trait (438 lines)
- `src/specs/architecture/stopping-rule-trait.md` -- StoppingRule trait and StoppingRuleSet (661 lines)
- `src/specs/architecture/extension-points.md` -- Extension architecture (269 lines)
- `src/specs/math/sddp-algorithm.md` -- SDDP mathematical foundation (221 lines)
- `src/specs/math/cut-management.md` -- Cut mathematics (207 lines)
- `src/specs/math/risk-measures.md` -- Risk measure math (283 lines)
- `src/specs/math/stopping-rules.md` -- Stopping rule math (189 lines)
- `src/specs/math/upper-bound-evaluation.md` -- UB evaluation math (222 lines)
- `src/specs/hpc/work-distribution.md` -- Scenario distribution across MPI ranks (173 lines)
- `src/specs/hpc/synchronization.md` -- Cut sync and bound sync (127 lines)
- `src/crates/sddp.md` -- Crate overview (114 lines)

## Specification

### Requirements

Audit cobre-sddp across five categories. Due to the crate's size, organize the audit by functional subsystem.

**Subsystem A: Training Loop Orchestrator**

- TrainingOrchestrator struct (or equivalent top-level coordinator)
- Iteration lifecycle functions (forward pass, backward pass, convergence check, checkpoint, logging)
- Configuration types for training parameters

**Subsystem B: Forward Pass**

- Forward pass function signature
- State recording types (visited states per stage)
- Stage LP solve coordination (which function in cobre-solver is called, with what parameters)
- Forward pass synchronization (allreduce for bounds)

**Subsystem C: Backward Pass**

- Backward pass function signature
- Opening tree evaluation function
- Dual extraction and cut coefficient computation
- Cut generation and aggregation (single-cut)
- Cut synchronization (allgatherv for new cuts)

**Subsystem D: Convergence Monitoring**

- ConvergenceMonitor struct
- Bound tracking types (lower bound, upper bound, gap)
- StoppingRuleSet evaluation function
- Upper bound variance computation (Bessel's correction)

**Subsystem E: FCF Management**

- CutPool struct (pre-allocated, per-stage)
- Cut storage types (intercept, coefficients, metadata)
- CutWireRecord struct (for MPI serialization)
- CutSelectionStrategy application function
- Activity tracking types

**Subsystem F: Simulation Pipeline**

- Simulation orchestrator function
- Per-scenario solve function
- Result streaming types
- TrajectoryRecord type (GAP-030 notes this was unspecified -- check current state)

**Subsystem G: Trait Enum Dispatch**

- RiskMeasure enum with Expectation variant
- HorizonMode enum with Finite variant
- CutSelectionStrategy enum with Level1 variant
- SamplingScheme enum (delegated to cobre-stochastic) with InSample variant
- StoppingRuleSet with all 5 rules

For each public type and function, classify as COMPLETE, PARTIAL, or MISSING.

### Inputs/Props

All files listed above in the Current State section.

### Outputs/Behavior

Audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-005-cobre-sddp.md`. The report is organized by subsystem (A through G) with a completeness matrix per subsystem and an overall crate verdict.

### Error Handling

Same as ticket-001. Additionally, flag any subsystem where more than 30% of items are PARTIAL or MISSING as a High-severity finding.

## Acceptance Criteria

- [ ] Given the training loop spec (training-loop.md), when the forward pass is inspected, then the function signature includes parameters for scenario set, stage range, LP workspaces, and the return type includes visited states and bound candidates
- [ ] Given the backward pass spec, when cut generation is inspected, then the cut coefficient computation ($\alpha_t^k$ and $\beta_t^k$) has a concrete formula with input types (duals, opening probabilities) and output type (cut record)
- [ ] Given the convergence monitoring spec (convergence-monitoring.md), when the upper bound computation is inspected, then the variance formula uses Bessel's correction ($N-1$) as specified in SS3.1a
- [ ] Given the FCF management spec (cut-management-impl.md), when the CutPool is inspected, then its struct has concrete field types including pre-allocation strategy and capacity parameters
- [ ] Given the CutWireRecord in cut-management-impl.md SS4.2a, when its fields are inspected, then the `#[repr(C)]` layout with explicit padding is documented with byte-level sizes
- [ ] Given the simulation pipeline spec (simulation-architecture.md), when the simulation orchestrator is inspected, then the function signature and scenario distribution strategy are classified
- [ ] Given GAP-030 (TrajectoryRecord), when the current state is inspected, then the report documents whether this type now has a concrete definition
- [ ] Given each trait enum (RiskMeasure, HorizonMode, CutSelectionStrategy, StoppingRuleSet), when the dispatch mechanism is inspected, then the enum definition has all minimal-viable variants with documented match arm behavior

## Implementation Guide

### Suggested Approach

1. Read `src/crates/sddp.md` for overview
2. Read `src/specs/architecture/training-loop.md` fully -- the central architecture spec
3. Organize findings by subsystem (A through G) as you read
4. For each subsystem, trace the public API surface: what types and functions would an implementer need to write?
5. Cross-reference with the mathematical specs in `src/specs/math/` to verify that architecture types match mathematical definitions
6. Check GAP-026 (backward pass trial state distribution), GAP-027 (training.forward_passes default), GAP-030 (TrajectoryRecord) for current state
7. Read the four trait specs and verify the enum dispatch pattern is consistently documented

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-005-cobre-sddp.md`

### Patterns to Follow

Same as ticket-001, with the addition of subsystem organization (A through G).

### Pitfalls to Avoid

- cobre-sddp's API surface is distributed across 17+ spec files. Use the crate overview and Phase 6 reading list as the primary guide, but verify against the trait specs and math specs.
- Do not audit multi-cut formulation (deferred), CVaR risk measure (deferred), Cyclic horizon mode (deferred), or LML1 cut selection (deferred).
- The simulation pipeline (Subsystem F) is Phase 7, not Phase 6. Include it in this crate audit but note the phase difference.
- Several Medium gaps (GAP-026, GAP-027, GAP-030) directly affect this crate. Document their current state.

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Verify `mdbook build` passes from repo root.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-013 (Phase 5-8 readiness assessment uses this report)

## Effort Estimate

**Points**: 5
**Confidence**: High
