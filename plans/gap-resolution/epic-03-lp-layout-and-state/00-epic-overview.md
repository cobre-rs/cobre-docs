# Epic 03: LP Layout and State Vectors (GAP-004, GAP-005)

## Goal

Resolve the two most technically demanding Blocker gaps: the LP memory layout with exact index formulas (GAP-004) and the state vector format with indexer structs (GAP-005). This is the most performance-critical specification in the entire ecosystem -- it determines the memory access patterns for millions of LP solves per training run.

## Stakeholder Decisions Applied

**GAP-004 (Stage/StageTemplate construction)**:

- cobre-sddp owns the Stage struct and knows how to build it
- The solver should not worry about LP semantics
- LP layout must be optimized for SDDP hot-path operations:
  - State transfer: organize variables as contiguous slice `[storage_0, ..., storage_N, inflow_0_lag0, ..., inflow_N_lag0, ..., inflow_N_lagL]`; state transfer is a single slice copy (ignoring last inflow lags)
  - Store all inflow lags (up to max PAR order) for all hydros in all stages for simplicity
  - Constraint rows containing duals used in cut computation must be contiguous
  - Frequently-accessed variables/constraints go at the beginning of arrays for cache optimization
  - Efficient LP result extraction and storage for backward step / cut computation
  - Efficient cut computation, FlatBuffers storage, and recovery without hot-path performance loss

**GAP-005 (State vector format)**:

- State vectors are flat vectors where each position corresponds to a cut coefficient
- Primary operation is dot product (state . cut coefficients), so optimize for this
- State vectors must be extractable as clean contiguous slices from the LP
- "Indexer" helper structs (e.g., `LP[stage_template.storage]`) provide named access to specific primals/duals
- Indexers are owned by the stage definition -- read-only, shared across threads, equal on all ranks

## Scope

- Update `src/specs/architecture/solver-abstraction.md` SS2 with exact column/row index formulas and a worked example
- Update `src/specs/architecture/solver-interface-trait.md` SS4.4 (StageTemplate) with construction ownership
- Update `src/specs/architecture/training-loop.md` SS5 (State Management) with state vector format, indexer structs, and patch sequence
- Update `src/specs/overview/spec-gap-inventory.md` to mark GAP-004 and GAP-005 as resolved

## Tickets

| Ticket     | Title                                                                  | Gap     | Estimate |
| ---------- | ---------------------------------------------------------------------- | ------- | -------- |
| ticket-008 | Specify LP memory layout with exact index formulas                     | GAP-004 | 5 points |
| ticket-009 | Specify state vectors and indexer structs                              | GAP-005 | 4 points |
| ticket-010 | Update spec-gap-inventory and cross-references for GAP-004 and GAP-005 | --      | 2 points |

## Performance Requirements

Every specification in this epic must address:

- **Cache-line awareness**: 64 bytes = 8 f64 values. Related data must be within cache lines.
- **SIMD alignment**: State vector arrays should be aligned to 32-byte (AVX) or 64-byte (AVX-512) boundaries for vectorized dot products.
- **Contiguous memory**: All slice operations (state transfer, dual extraction, cut coefficient dot product) must operate on contiguous memory -- no index gathering.
- **Minimal allocation**: Index formulas must be pure arithmetic (no allocation, no HashMap lookup) on the hot path.

## Dependencies

- **Blocked by**: Epic 2 (SystemRepresentation must be defined so LP layout can reference entity collections and counts)
- **Blocks**: Epic 4 (High-severity gaps that reference the LP layout)

## Acceptance Criteria

- [ ] LP column layout has exact index formulas for storage, inflow lags (all hydros, max PAR order), theta, and decision variables
- [ ] LP row layout has exact index formulas for water balance, AR lag fixing, FPHA hyperplane, generic volume, and structural constraints
- [ ] A worked example for a 3-hydro AR(2) system shows concrete column and row indices
- [ ] State vector format is defined as flat `[f64; n_state]` with contiguous storage + lag layout matching LP column prefix
- [ ] Indexer struct sketches provide named access to storage, lags, theta, and dual positions
- [ ] Indexers are documented as read-only, `Send + Sync`, shared across threads, equal on all ranks
- [ ] The patch sequence for forward pass scenario fixing is specified with exact row indices
- [ ] SIMD alignment requirements are documented for state vector and cut coefficient arrays
