# ticket-008: Specify LP Memory Layout with Exact Index Formulas

## Context

### Background

GAP-004 identifies that the `StageTemplate` construction process -- how cobre-sddp builds a `StageTemplate` from `System` + `StageDefinition` -- is not specified. The existing LP layout convention in Solver Abstraction SS2 describes regions (state variables at top of columns, cut-relevant constraints at top of rows) but lacks exact index arithmetic. Without precise formulas, a developer cannot compute "which LP column corresponds to hydro 3's storage" or "which row holds the water balance for hydro 7."

The stakeholder has provided detailed performance requirements:

- State transfer as a single contiguous slice copy
- All inflow lags stored for all hydros (up to max PAR order) for simplicity
- Cut-relevant dual rows contiguous
- Frequently-accessed variables at the beginning of arrays

### Relation to Epic

First and largest ticket of Epic 3. This is the most performance-critical specification in the entire ecosystem. ticket-009 (state vectors/indexers) builds directly on the column layout defined here.

### Current State

`src/specs/architecture/solver-abstraction.md` SS2 (LP Layout Convention) contains:

- SS2.1 Column Layout: A 4-row table with generic ranges (`[0, n_hydro)`, `[n_hydro, n_hydro + n_ar_lags)`, etc.)
- SS2.2 Row Layout: A 3-region table (Top, Middle, Bottom) with generic boundaries
- SS2.3 Interaction with Basis Persistence (stable, well-specified)
- No exact index formulas, no worked examples, no SIMD alignment notes
- The column layout uses "n_ar_lags" without specifying whether this stores variable-order lags per hydro or uniform max-order lags for all hydros

`src/specs/architecture/solver-interface-trait.md` SS4.4 (StageTemplate) defines the struct with `n_state` and `n_cut_relevant` fields but no specification of who constructs it or how.

## Specification

### Requirements

1. **Replace** the existing column layout table in Solver Abstraction SS2.1 with a precise specification that includes:
   - Exact column index formulas using the stakeholder's contiguous layout:
     ```
     [storage_0, storage_1, ..., storage_{N-1},
      inflow_0_lag0, inflow_1_lag0, ..., inflow_{N-1}_lag0,
      inflow_0_lag1, inflow_1_lag1, ..., inflow_{N-1}_lag1,
      ...
      inflow_0_lag{L-1}, inflow_1_lag{L-1}, ..., inflow_{N-1}_lag{L-1},
      theta,
      <decision variables>]
     ```
   - Where N = number of operating hydros, L = max PAR order across all hydros
   - **All hydros store L lags** regardless of their individual AR order (pad with zero coefficients for hydros with lower order) -- this ensures uniform stride and enables SIMD vectorization
   - State dimension: `n_state = N + N * L = N * (1 + L)`
   - State transfer slice: `primal[0 .. N * (1 + L_transfer)]` where `L_transfer = L - 1` (last lag is dropped because it is the oldest and not needed in the next stage)

2. **Replace** the existing row layout table in Solver Abstraction SS2.2 with a precise specification:
   - **Top region (cut-relevant)**: Exact row index formulas for:
     - Water balance constraints: rows `[0, N)` -- one per operating hydro
     - AR lag fixing constraints: rows `[N, N + N*L)` -- one per (hydro, lag)
     - FPHA hyperplane constraints: rows `[N + N*L, N + N*L + n_fpha)` where `n_fpha` = total FPHA planes across all FPHA-model hydros
     - Generic volume constraints: rows `[N + N*L + n_fpha, n_cut_relevant)` where these are user-defined constraints referencing storage
   - **Middle region (structural, non-cut-relevant)**: Load balance, generation bounds, flow bounds, penalty bounds, remaining constraints
   - **Bottom region (cuts)**: Benders cuts appended via `addRows`

3. **Add construction ownership**: State explicitly that cobre-sddp owns `StageTemplate` construction via a builder function. The solver crate (cobre-solver) receives `StageTemplate` as opaque data and does not interpret its contents.

4. **Add a worked example** for a system with:
   - 3 hydros (H0, H1, H2)
   - Max PAR order L = 2
   - H0 uses constant productivity, H1 uses FPHA with 4 hyperplanes, H2 uses constant
   - 2 buses, 1 thermal, 1 line
   - Show exact column indices, row indices, n_state, n_cut_relevant

5. **Add performance notes**:
   - SIMD alignment: state vector arrays should be allocated with 64-byte alignment (AVX-512 width for 8 f64 values)
   - Cache locality: the state prefix occupies the first `N*(1+L)*8` bytes of the primal vector; for production cases (N=160, L=6), this is 160*7*8 = 8,960 bytes = 140 cache lines -- fits in L1 cache
   - Contiguous dual extraction: the first `n_cut_relevant` duals are read as a single slice for cut coefficient computation

6. **Add decision variable ordering** within the middle column region (after theta):
   - Document the ordering convention for decision variables: by entity type (thermals, then lines, then buses, then per-hydro variables), by entity ID within type, by block within entity
   - This ordering is secondary to performance (decision variables are not in the state vector) but important for debugging and output interpretation

### Inputs/Props

- Current text of `src/specs/architecture/solver-abstraction.md` SS2
- Current text of `src/specs/architecture/solver-interface-trait.md` SS4.4
- Stakeholder decisions for GAP-004
- Entity count notation from `src/specs/overview/production-scale-reference.md`

### Outputs/Behavior

Updated Solver Abstraction SS2 with exact index formulas, a worked example, and performance notes. Updated Solver Interface Trait SS4.4 with construction ownership statement.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given Solver Abstraction SS2.1 is read, when a developer needs the column index for hydro h's storage, then they can compute it as `h` (0-indexed within the operating hydro set)
- [ ] Given SS2.1 is read, when a developer needs the column index for hydro h's lag l, then they can compute it as `N + l*N + h`
- [ ] Given SS2.1 is read, when a developer reads the state transfer operation, then they find it described as `primal[0 .. N*(1 + L-1)]` (a single contiguous slice copy, dropping the oldest lag)
- [ ] Given SS2.2 is read, when a developer needs the row index for hydro h's water balance dual, then they can compute it as `h`
- [ ] Given SS2.2 is read, when a developer needs the row index for hydro h's lag l fixing constraint, then they can compute it as `N + l*N + h`
- [ ] Given the worked example is read, when a developer applies the formulas to the 3-hydro system, then they get the same column and row indices shown in the example
- [ ] Given the performance notes are read, when a developer allocates the state vector, then they know to use 64-byte alignment
- [ ] Given the construction ownership is read, when a developer looks for who builds StageTemplate, then they find "cobre-sddp owns construction" with a builder function signature
- [ ] Given all hydros store max-order lags, when a developer checks for variable-order handling, then they find that hydros with lower AR order have zero-padded coefficients in the lag positions beyond their actual order

## Implementation Guide

### Suggested Approach

1. Read the current Solver Abstraction SS2 thoroughly
2. Read the stakeholder's GAP-004 decision in `review.md` for the exact layout description
3. Read `src/specs/overview/production-scale-reference.md` for production-scale entity counts
4. Replace SS2.1 column layout with the precise specification:
   - Add an index formula table: `| Variable | Column Index | Count |`
   - Add the contiguous layout diagram
   - Add the state transfer slice formula
   - Add the uniform-lag-order justification
5. Replace SS2.2 row layout with the precise specification:
   - Add an index formula table for the top region sub-regions
   - Keep the Middle and Bottom regions as currently described (they are adequate)
6. Add the worked example as a new subsection SS2.4
7. Add performance notes as a new subsection SS2.5
8. Update Solver Interface Trait SS4.4 to add construction ownership paragraph
9. Verify all cross-references are correct

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md` -- SS2 (LP Layout Convention)
- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-interface-trait.md` -- SS4.4 (StageTemplate)

### Patterns to Follow

- Use `SS` prefix for section references within architecture files
- Use LaTeX math notation for formulas (rendered by mdBook katex preprocessor)
- Use code blocks for layout diagrams
- Follow the existing table style in SS2

### Pitfalls to Avoid

- Do NOT change SS2.3 (Basis Persistence) -- it is already well-specified and unchanged by this work
- Do NOT modify the existing SS3-SS11 content -- only SS2 and SS4.4 are in scope
- Do NOT prescribe specific Rust allocator APIs -- state alignment as a requirement, not an implementation
- Do NOT forget that the column layout also has a theta variable between the state prefix and decision variables
- Do NOT confuse "operating hydros" with "all hydros" -- non-existing and decommissioned hydros (per ticket-005) have zero LP presence
- VERIFY that the row layout for water balance matches the formula in LP Formulation SS4 -- the dual variable symbol must match

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after changes
- Verify that the worked example's column and row counts are arithmetically consistent

## Dependencies

- **Blocked By**: ticket-004 (SystemRepresentation -- need entity collection types and count notation), ticket-005 (Decommissioned resolution -- determines which hydros are "operating")
- **Blocks**: ticket-009 (state vectors and indexers build on the column layout), ticket-010 (gap inventory update)

## Effort Estimate

**Points**: 5
**Confidence**: Medium (the design is specified by stakeholder but translating it into precise formulas with a worked example requires careful arithmetic)
