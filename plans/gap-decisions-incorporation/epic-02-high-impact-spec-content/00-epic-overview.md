# Epic 02: High-Impact Spec Content

## Goal

Add substantive spec content for the four highest-impact gaps: PAR-to-LP transformation flow (GAP-022), TrajectoryRecord type definition (GAP-030), warm-start validation specification (GAP-028), and threading model decision (GAP-018). These gaps require the most new content and affect the most downstream spec files.

## Scope

- **GAP-022**: Add explicit PAR canonical-to-LP transformation flow, coefficient conversion formulas, LP-ready form derivation, and `PrecomputedParLp` struct definition to `par-inflow-model.md` and `internal-structures.md`
- **GAP-030**: Define `TrajectoryRecord` type with complete LP solution (primal, dual, costs), contiguous memory layout, and dual-use for training and simulation in `training-loop.md`
- **GAP-028**: Specify minimal warm-start compatibility validation checks (hydro count, max PAR order, hydro production methods, PAR models per hydro) in `input-loading-pipeline.md`
- **GAP-018**: Replace OpenMP-only threading model with rayon-based intra-rank parallelism in `hybrid-parallelism.md`

## Why These Gaps Are Prioritized

- GAP-022 defines a critical data transformation that flows from `cobre-stochastic` to `cobre-sddp` LP construction
- GAP-030 defines the primary data structure for forward pass results, consumed by backward pass and simulation
- GAP-028 is required for warm-start (Phase 7 of implementation ordering)
- GAP-018 affects every performance-critical code path and changes the build system

## Tickets

| Ticket     | Title                                                           | Dependencies | Effort |
| ---------- | --------------------------------------------------------------- | ------------ | ------ |
| ticket-002 | Add PAR-to-LP transformation flow and PrecomputedParLp struct   | ticket-001   | 3      |
| ticket-003 | Define TrajectoryRecord type with contiguous LP solution layout | ticket-001   | 2      |
| ticket-004 | Specify warm-start compatibility validation checks              | ticket-001   | 2      |
| ticket-005 | Replace OpenMP with rayon for intra-rank parallelism            | ticket-001   | 3      |

## Acceptance Criteria

- `par-inflow-model.md` contains the complete canonical-to-LP derivation with all four forms of the PAR equation
- `internal-structures.md` contains the `PrecomputedParLp` struct definition with fields for psi coefficients, deterministic base, and sigma
- `training-loop.md` contains a `TrajectoryRecord` struct with primal variables, dual variables, and stage costs
- `input-loading-pipeline.md` contains an enumerated list of warm-start compatibility checks with specific dimension match requirements
- `hybrid-parallelism.md` section 2 documents rayon as the threading model with rationale for OpenMP deferral
- `mdbook build` succeeds after each ticket
