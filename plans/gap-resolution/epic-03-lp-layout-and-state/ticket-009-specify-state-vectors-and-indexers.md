# ticket-009: Specify State Vectors and Indexer Structs

## Context

### Background

GAP-005 identifies that the forward pass patch sequence, state vector wire format, and the exact index arithmetic for patching LP RHS values are unspecified. The stakeholder has provided a clear design: state vectors are flat `[f64]` arrays where each position corresponds to a cut coefficient. The primary operation is dot product (state . cut coefficients). "Indexer" helper structs provide named access to LP positions without magic index numbers.

### Relation to Epic

Second ticket of Epic 3. Depends on ticket-008 (LP column layout) because the state vector layout must match the LP column prefix exactly.

### Current State

`src/specs/architecture/training-loop.md` SS5 (State Management) contains:

- SS5.1 State Vector: A component table (storage volumes, AR inflow lags) with dimensions
- SS5.2 State Lifecycle: Initialization, update, and extraction steps
- No concrete Rust types for state vectors
- No indexer structs
- No patch sequence specification
- No SIMD alignment notes

The forward pass step "Build stage LP" (SS4.2 step c) references building the LP with "incoming state, scenario realization, and all current FCF cuts" but the exact patch_rhs_bounds calls are unspecified.

## Specification

### Requirements

1. **State vector type**: Add a concrete type definition to Training Loop SS5.1:

   ```rust
   /// Flat state vector matching the LP column prefix layout.
   /// Position i corresponds to cut coefficient i.
   /// Layout: [v_0, v_1, ..., v_{N-1}, a_{0,0}, a_{1,0}, ..., a_{N-1,0}, a_{0,1}, ..., a_{N-1,L-1}]
   /// where v_h = storage for hydro h, a_{h,l} = inflow lag l for hydro h.
   /// Total dimension: N * (1 + L)
   ///
   /// Aligned to 64 bytes for AVX-512 SIMD dot product operations.
   type StateVector = Vec<f64>;  // len = n_state, allocated with 64-byte alignment
   ```

2. **Dot product optimization**: Add a note that the primary operation on state vectors is the dot product `state . cut_coefficients`, which occurs during:
   - Forward pass: evaluating theta = max_k { alpha_k + pi_k . x } for each active cut
   - Backward pass: computing cut intercept alpha = Q - pi . x_hat
   - This operation should use BLAS-like vectorized routines when available

3. **State extraction from LP**: Add specification for how the state vector is extracted from an LP solution:
   - `state[0..N] = primal[0..N]` (storage volumes)
   - `state[N..N*(1+L)] = primal[N..N*(1+L)]` (inflow lags)
   - This is a single contiguous `memcpy` from the LP primal vector prefix

4. **State transfer between stages**: Add specification for how state is transferred from one stage to the next:
   - Storage: `rhs_patch[water_balance_row_h] = state[h]` for each operating hydro h
   - Inflow lags: `rhs_patch[lag_fixing_row(h,l)] = state[lag_col(h,l)]` for each (h,l)
   - Both use the index formulas from ticket-008

5. **Patch sequence**: Add a concrete subsection to Training Loop SS4.2 specifying the exact `patch_rhs_bounds` calls for the forward pass:
   - **Incoming state patches**: Fix water balance RHS and lag fixing constraints to incoming state values
   - **Noise innovation patches**: Fix the AR dynamics noise terms to the scenario realization
   - Provide a patch count formula: `n_patches = N (water balance) + N*L (lag fixing) + N (noise fixing) = N*(2+L)`
   - Provide a worked example using the 3-hydro AR(2) system from ticket-008

6. **Indexer struct sketches**: Add to Training Loop SS5 (or a new subsection):

   ```rust
   /// Read-only index map for accessing LP primal/dual positions by semantic name.
   /// Built once at initialization from the stage definition.
   /// Shared across all threads within an MPI rank.
   /// Equal on all ranks (since LPs differ only by noise innovations).
   pub struct StageIndexer {
       /// Column range for storage variables: [0, n_hydro)
       pub storage: Range<usize>,
       /// Column range for inflow lag variables: [n_hydro, n_state)
       pub inflow_lags: Range<usize>,
       /// Column index of the future cost variable theta
       pub theta: usize,
       /// State dimension: n_hydro * (1 + max_par_order)
       pub n_state: usize,

       /// Row range for water balance constraints (duals -> storage cut coefficients)
       pub water_balance: Range<usize>,
       /// Row range for AR lag fixing constraints (duals -> lag cut coefficients)
       pub lag_fixing: Range<usize>,
       /// Row range for FPHA hyperplane constraints (duals contribute to storage cut coefficients)
       pub fpha_hyperplanes: Range<usize>,
       /// Row range for generic volume constraints (duals contribute to state cut coefficients)
       pub generic_volume: Range<usize>,
       /// Total cut-relevant rows (contiguous prefix)
       pub n_cut_relevant: usize,

       /// Per-hydro indexing within the storage/lag ranges
       pub hydro_count: usize,
       pub max_par_order: usize,
   }
   ```

7. **Indexer usage examples**: Show how the indexer is used in practice:

   ```rust
   // Extract state from LP solution
   let state = &solution.primal[indexer.storage.start..indexer.inflow_lags.end];

   // Extract duals for cut computation
   let cut_duals = &solution.dual[0..indexer.n_cut_relevant];

   // Access a specific hydro's storage value
   let h3_storage = solution.primal[indexer.storage.start + 3];

   // Access a specific lag value (hydro 2, lag 1)
   let h2_lag1 = solution.primal[indexer.inflow_lags.start + 1 * indexer.hydro_count + 2];
   ```

8. **Indexer properties**: Document that:
   - Indexers are built at initialization from `System` + stage configuration
   - They are `Send + Sync` (immutable after construction)
   - They are equal across all ranks (since the LP structure is identical for all ranks; only noise innovations differ)
   - They are owned by the stage definition, not the solver instance

### Inputs/Props

- Column layout from ticket-008 (Solver Abstraction SS2.1)
- Row layout from ticket-008 (Solver Abstraction SS2.2)
- Current text of Training Loop SS4.2 and SS5

### Outputs/Behavior

Updated Training Loop SS4.2 and SS5 with state vector types, patch sequence, and indexer structs.

### Error Handling

Not applicable (specification work).

## Acceptance Criteria

- [ ] Given Training Loop SS5.1 is read, when a developer looks for the state vector type, then they find a flat `Vec<f64>` with 64-byte alignment and layout matching the LP column prefix
- [ ] Given SS5 is read, when a developer looks for how to extract state from an LP solution, then they find it is a single contiguous memcpy from `primal[0..n_state]`
- [ ] Given SS4.2 is read, when a developer looks for the forward pass patch sequence, then they find the exact list of patches (water balance, lag fixing, noise fixing) with row index formulas
- [ ] Given the patch count formula is read, when applied to the 3-hydro AR(2) example, then the count matches: 3\*(2+2) = 12 patches
- [ ] Given the StageIndexer struct is read, when a developer needs to access hydro 3's storage value from the LP solution, then they can compute the index as `indexer.storage.start + 3`
- [ ] Given the StageIndexer properties are read, when a developer checks thread-safety, then they find `Send + Sync` documented with "equal across all ranks" justification
- [ ] Given the dot product optimization note is read, when a developer considers SIMD, then they find 64-byte alignment documented for state vectors and cut coefficient arrays

## Implementation Guide

### Suggested Approach

1. Read ticket-008's column and row layout (must be completed first)
2. Read the current Training Loop SS5 and SS4.2
3. Add a new subsection to SS5 for the state vector type definition
4. Add a new subsection to SS5 for the StageIndexer struct sketch
5. Add a new subsection to SS4.2 (or modify the existing step c description) with the concrete patch sequence
6. Add a worked example using the 3-hydro AR(2) system from ticket-008
7. Add performance notes about SIMD alignment and dot product optimization
8. Verify cross-references to Solver Abstraction SS2 are correct

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/specs/architecture/training-loop.md` -- SS4.2 (forward pass step c), SS5 (State Management)

### Patterns to Follow

- Use `SS` prefix for section references within architecture files
- Use Rust code blocks for type definitions (with `rust` language tag)
- Follow the existing style of the training loop spec (component tables, lifecycle descriptions)

### Pitfalls to Avoid

- Do NOT duplicate the LP layout formulas from ticket-008 -- reference Solver Abstraction SS2 instead
- Do NOT change the backward pass description (SS6) -- the patch sequence for backward pass is similar but not identical (different noise values); document forward pass first and note backward pass similarity
- Do NOT prescribe specific BLAS library -- state "BLAS-like vectorized routines" as the expectation
- Do NOT make the StageIndexer mutable -- it is read-only after construction
- VERIFY that the lag indexing formula `inflow_lags.start + l * hydro_count + h` produces the correct index given the LP column layout `[..., inflow_0_lag0, inflow_1_lag0, ..., inflow_{N-1}_lag0, inflow_0_lag1, ...]`

## Testing Requirements

### Unit Tests

Not applicable (specification work).

### Integration Tests

- Verify `mdbook build` succeeds after changes
- Verify that the worked example's patch count matches the formula

## Dependencies

- **Blocked By**: ticket-008 (LP column and row layout must be defined first)
- **Blocks**: ticket-010 (gap inventory update and cross-references)

## Effort Estimate

**Points**: 4
**Confidence**: Medium (depends on ticket-008 being complete and correct; the indexer design is straightforward but the patch sequence arithmetic requires care)
