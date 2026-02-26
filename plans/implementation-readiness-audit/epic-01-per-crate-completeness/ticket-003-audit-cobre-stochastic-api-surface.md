# ticket-003 Audit cobre-stochastic API Surface Completeness

## Context

### Background

cobre-stochastic is responsible for scenario generation: PAR(p) preprocessing (reverse-standardization, contiguous layout), correlated noise generation via Cholesky factorization, opening tree construction, and InSample forward sampling. It is Phase 5 in the implementation ordering and depends on cobre-core for AR model parameters and internal structures. It can be developed in parallel with Phases 3-4.

### Relation to Epic

This is ticket 3 of 8 in the per-crate completeness audit. cobre-stochastic has a relatively narrow API surface focused on scenario generation.

### Current State

The cobre-stochastic API surface is specified in:

- `src/specs/architecture/scenario-generation.md` -- Main architecture spec (490 lines), covers PAR preprocessing, Cholesky noise, opening tree, seed derivation (SS2.2a)
- `src/specs/math/par-inflow-model.md` -- PAR(p) mathematical formulation
- `src/specs/math/inflow-nonnegativity.md` -- Truncation of negative inflows
- `src/specs/architecture/sampling-scheme-trait.md` -- SamplingScheme trait (InSample variant for minimal viable)
- `src/specs/data-model/input-scenarios.md` -- Parquet scenario file schemas that feed preprocessing
- `src/crates/stochastic.md` -- Crate overview (61 lines)

## Specification

### Requirements

Audit cobre-stochastic across five categories.

**Category 1: Public Types**

- PAR(p) preprocessed parameter types (contiguous memory layout for AR coefficients)
- Cholesky factor storage type
- Opening tree type (GAP-023 notes this was unspecified -- check current state)
- PrecomputedPar type (GAP-022 notes this was unspecified -- check current state)
- Scenario/noise generation workspace types
- Seed derivation types

**Category 2: Public Functions**

- PAR preprocessing function (takes raw Parquet data, produces contiguous layout)
- Cholesky factorization function
- Opening tree construction function
- InSample forward sampling function
- Seed derivation function (SipHash-1-3, per SS2.2a)

**Category 3: Error Types**

- Cholesky factorization failure (non-positive-definite matrix)
- Scenario generation errors

**Category 4: Trait Implementations**

- SamplingScheme::InSample implementation contract

**Category 5: Crate Boundary Interactions**

- cobre-stochastic -> cobre-core: reads AR model parameters from internal structures
- cobre-sddp -> cobre-stochastic: calls sampling functions during forward pass

### Inputs/Props

- `src/specs/architecture/scenario-generation.md`
- `src/specs/math/par-inflow-model.md`
- `src/specs/math/inflow-nonnegativity.md`
- `src/specs/architecture/sampling-scheme-trait.md`
- `src/specs/data-model/input-scenarios.md`
- `src/crates/stochastic.md`

### Outputs/Behavior

Audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-003-cobre-stochastic.md`.

### Error Handling

Same as ticket-001.

## Acceptance Criteria

- [ ] Given scenario-generation.md, when all public types are enumerated, then each type has a Status classification with cited section number
- [ ] Given GAP-022 (PrecomputedPar) and GAP-023 (opening tree), when the current spec state is inspected, then the report documents whether these types now have concrete Rust type definitions or remain unspecified
- [ ] Given the SipHash-1-3 seed derivation in scenario-generation.md SS2.2a, when the input encoding (20-byte and 16-byte) is inspected, then the function signature and byte layout are classified as COMPLETE or PARTIAL
- [ ] Given the InSample sampling scheme variant, when its behavioral contract is traced in sampling-scheme-trait.md, then the contract includes preconditions, postconditions, and pure-query infallibility citation
- [ ] Given the crate boundary with cobre-core, when the AR model parameter types are traced, then the types match between internal-structures.md and scenario-generation.md

## Implementation Guide

### Suggested Approach

1. Read `src/crates/stochastic.md` for overview
2. Read `src/specs/architecture/scenario-generation.md` fully -- this is the primary architecture spec
3. Cross-reference with GAP-022 and GAP-023 in the gap inventory
4. Read `src/specs/architecture/sampling-scheme-trait.md` for the trait contract
5. Trace the PAR parameter types from `input-scenarios.md` through `scenario-generation.md` to `internal-structures.md`

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-003-cobre-stochastic.md`

### Patterns to Follow

Same as ticket-001.

### Pitfalls to Avoid

- GAP-022 and GAP-023 are Medium-severity gaps directly about this crate's types. Document their current state objectively.
- Do not audit deferred sampling schemes (External, Historical).
- The Cholesky factorization is a standard numerical operation; verify the spec specifies whether cobre-stochastic uses a library (e.g., nalgebra) or implements its own.

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

**Points**: 2
**Confidence**: High
