# ticket-004 Audit cobre-solver API Surface Completeness

## Context

### Background

cobre-solver provides the LP solver abstraction: the SolverInterface trait (9 methods), the HiGHS backend implementation, solver workspaces with thread-local allocation, basis warm-starting, and the LP memory layout convention. It is Phase 3 in the implementation ordering (alongside ferrompi) and depends on cobre-core for LP layout types (StageTemplate, StageIndexer).

### Relation to Epic

This is ticket 4 of 8 in the per-crate completeness audit. cobre-solver has the most detailed trait specification in the corpus (solver-interface-trait.md at 743 lines) and a rich set of behavioral contracts for its 9 trait methods.

### Current State

The cobre-solver API surface is specified in:

- `src/specs/architecture/solver-interface-trait.md` -- SolverInterface trait (743 lines), 9 methods, dispatch mechanism, dual normalization
- `src/specs/architecture/solver-abstraction.md` -- LP memory layout, StageIndexer, scaling, cut loading strategy (610 lines)
- `src/specs/architecture/solver-highs-impl.md` -- HiGHS backend implementation (258 lines)
- `src/specs/architecture/solver-clp-impl.md` -- CLP backend (deferred, but verify it does not pollute the trait)
- `src/specs/architecture/solver-workspaces.md` -- Thread-local workspace allocation, lifecycle (326 lines)
- `src/specs/math/lp-formulation.md` -- LP constraint matrix, variable layout
- `src/specs/hpc/memory-architecture.md` -- Memory layout for solver structures
- `src/crates/solver.md` -- Crate overview (65 lines)

## Specification

### Requirements

Audit cobre-solver across five categories.

**Category 1: Public Types**

- SolverInterface trait definition (9 methods)
- SolverError enum (variants: Infeasible, Unbounded, NumericalDifficulty, TimeLimitExceeded, IterationLimit, InternalError)
- SolverStatistics struct
- Basis type (for warm-starting)
- StageTemplate struct (LP layout metadata)
- StageIndexer struct (variable/constraint index ranges)
- Workspace type(s)
- HiGHS-specific configuration types

**Category 2: Public Functions**

- Workspace creation/allocation function
- Workspace destruction function
- `load_model` function signature (CSC/CSR format)
- `add_cut_rows` function signature
- `patch_row_bounds` and `patch_col_bounds` function signatures
- `solve` and `solve_with_basis` function signatures
- `reset`, `get_basis`, `statistics`, `name` function signatures

**Category 3: Error Types**

- SolverError enum with hard-stop vs proceed-with-partial mapping
- Per-method error contracts (which methods return Result, which are infallible)

**Category 4: Trait Implementations**

- HiGHS implementation of SolverInterface (all 9 methods)
- Behavioral contracts for each method (preconditions, postconditions, Ok/Err tables)

**Category 5: Crate Boundary Interactions**

- cobre-solver -> cobre-core: uses StageTemplate, StageIndexer types
- cobre-sddp -> cobre-solver: creates workspaces, calls solve/solve_with_basis, extracts duals

### Inputs/Props

- `src/specs/architecture/solver-interface-trait.md`
- `src/specs/architecture/solver-abstraction.md`
- `src/specs/architecture/solver-highs-impl.md`
- `src/specs/architecture/solver-workspaces.md`
- `src/specs/math/lp-formulation.md`
- `src/specs/hpc/memory-architecture.md`
- `src/crates/solver.md`

### Outputs/Behavior

Audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-004-cobre-solver.md`.

### Error Handling

Same as ticket-001.

## Acceptance Criteria

- [ ] Given solver-interface-trait.md, when all 9 SolverInterface methods are inspected, then each method has a concrete Rust signature with parameter types, return type, and behavioral contract (pre/postconditions)
- [ ] Given the SolverError enum, when all variants are inspected, then each variant has documentation, the hard-stop vs proceed-with-partial mapping is specified, and the Err recovery contract (caller calls reset()) is documented
- [ ] Given solver-abstraction.md, when the LP memory layout is inspected, then the StageTemplate and StageIndexer types have concrete field definitions with Rust types
- [ ] Given solver-workspaces.md SS1.3a, when the workspace lifecycle is inspected, then creation, per-iteration reuse, per-stage transition, and destruction phases are all specified with concrete function signatures
- [ ] Given solver-highs-impl.md, when the HiGHS implementation is inspected, then every SolverInterface method maps to specific HiGHS C API calls
- [ ] Given the dual normalization convention in solver-abstraction.md SS8 (or solver-interface-trait.md), when the convention is inspected, then it specifies the sign convention and references the mathematical failure mode
- [ ] Given the crate boundary with cobre-core, when StageTemplate/StageIndexer are traced, then their definitions are consistent between solver-abstraction.md and internal-structures.md

## Implementation Guide

### Suggested Approach

1. Read `src/crates/solver.md` for overview
2. Read `src/specs/architecture/solver-interface-trait.md` fully -- the most detailed trait spec
3. For each of the 9 methods, extract: signature, preconditions, postconditions, Ok/Err table
4. Read `src/specs/architecture/solver-abstraction.md` for LP layout types
5. Read `src/specs/architecture/solver-workspaces.md` for workspace lifecycle
6. Read `src/specs/architecture/solver-highs-impl.md` for the HiGHS backend mapping
7. Cross-reference GAP-019 (solver retry config) in the gap inventory

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-004-cobre-solver.md`

### Patterns to Follow

Same as ticket-001.

### Pitfalls to Avoid

- Do not audit the CLP backend (deferred variant). Only verify it does not pollute the trait contract.
- GAP-019 (solver retry config parameters) is a Medium gap affecting this crate. Document its current state.
- The `patch_row_bounds`/`patch_col_bounds` rename was completed in gap-resolution. Verify all references use the new names.
- solver-interface-trait.md is 743 lines. Focus on the API surface (signatures, contracts), not the mathematical derivations.

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Verify `mdbook build` passes from repo root.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-012 (Phase 1-4 readiness assessment uses this report)

## Effort Estimate

**Points**: 3
**Confidence**: High
