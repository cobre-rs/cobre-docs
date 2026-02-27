# ticket-004 Specify Warm-Start Compatibility Validation Checks

## Context

### Background

GAP-028 identifies that policy compatibility validation for warm-start is deferred to a future spec, but warm-start is included in the minimal viable solver (Phase 7 of implementation ordering). The stakeholder review confirmed the minimal set of compatibility checks: the warm-start policy must have the **same number of hydros**, **same maximum PAR model order**, **same hydro production methods per hydro** (because FPHA affects cut coefficients), and **same PAR models per hydro**. Everything else (exchange limits, loads, inflows, block durations) can change between runs because those only affect RHS values, not the LP structure or cut dimensions.

### Relation to Epic

This ticket defines the validation checks that gate warm-start loading. Without these checks, loading incompatible cuts would produce silent numerical errors (dimension mismatches in cut coefficient vectors).

### Current State

`src/specs/architecture/input-loading-pipeline.md` section 7 covers parallel policy loading for warm-start but defers the full validation to `[Deferred Features SSC.9](../deferred.md)`. The current spec says "hard error on mismatch" but does not enumerate what is checked.

`src/specs/architecture/simulation-architecture.md` section 2 references policy compatibility validation.

The `PolicyMetadata` table in `src/specs/data-model/binary-formats.md` SS3.1 stores `state_dimension`, `num_stages`, `config_hash`, and `system_hash` which provide some validation data.

## Specification

### Requirements

1. Add a new subsection to `src/specs/architecture/input-loading-pipeline.md` (e.g., SS7.1 "Warm-Start Compatibility Validation") specifying the minimal validation checks
2. The checks must verify dimensional compatibility (same cut/state structure):
   - **Same number of hydros**: `policy.n_hydros == system.n_hydros()`
   - **Same maximum PAR model order**: `policy.max_par_order == max(system.par_models.map(|m| m.order))`
   - **Same hydro production methods per hydro**: for each hydro, the production model variant (ConstantProductivity, Fpha, LinearizedHead) must match between policy and current system
   - **Same PAR models per hydro**: for each hydro, the PAR model parameters (order per season) must match
3. Document that dimension mismatches produce a `LoadError` (hard error, not warning)
4. Document what can change without invalidating the warm-start: exchange limits, loads, inflows, block durations, penalty values, thermal costs, demand
5. Explain the rationale: cuts encode state-variable coefficients; if the state dimension or the structure of the state vector changes (different hydros, different PAR orders, different production models affecting cut coefficients), the loaded cuts are meaningless

### Out of Scope

- Full checkpoint resume validation (which requires RNG state matching) -- that is a separate concern
- The `system_hash` and `config_hash` in `PolicyMetadata` -- those are for resume, not warm-start
- Validation of simulation policy loading (only training warm-start is in scope)

### Inputs/Props

Validation check table:

| Check                      | Source (Policy)                            | Source (Current System)                     | Failure Mode                                |
| -------------------------- | ------------------------------------------ | ------------------------------------------- | ------------------------------------------- |
| Hydro count                | `PolicyMetadata.state_dimension` (derived) | `system.n_hydros()`                         | Hard error: `LoadError::PolicyIncompatible` |
| Max PAR order              | Stored in policy metadata                  | Computed from `system.par_models`           | Hard error                                  |
| Production model per hydro | Stored per-hydro in policy                 | `system.hydros[i].generation_model` variant | Hard error                                  |
| PAR model per hydro        | Stored per-hydro in policy                 | `system.par_models` per hydro               | Hard error                                  |

### Outputs/Behavior

Updated `input-loading-pipeline.md` with:

- A new subsection documenting the warm-start validation checks
- An enumerated validation rule table
- A "what can change" list documenting safe modifications between runs

### Error Handling

All validation failures produce `LoadError::PolicyIncompatible` (or a new variant if needed). This is a hard error -- training cannot proceed with incompatible cuts.

## Acceptance Criteria

- [ ] Given `src/specs/architecture/input-loading-pipeline.md`, when searching for "warm-start" or "compatibility validation", then a subsection is found listing exactly four validation checks: hydro count, max PAR order, production methods per hydro, PAR models per hydro
- [ ] Given the validation subsection, when reading each check, then it specifies: what is compared (policy value vs. system value), the comparison operation (equality), and the error type on failure (`LoadError` variant)
- [ ] Given the validation subsection, when searching for "can change", then a list is found documenting safe modifications: exchange limits, loads, inflows, block durations, penalty values, thermal costs, demand
- [ ] Given `src/specs/architecture/input-loading-pipeline.md`, when running `mdbook build`, then the build succeeds with no new errors

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/input-loading-pipeline.md` section 7 to understand the current warm-start loading flow
2. Add SS7.1 "Warm-Start Compatibility Validation" after the existing section 7 content
3. Structure the subsection as:
   a. One-paragraph rationale explaining why dimensional compatibility matters (cuts encode state coefficients)
   b. A validation rules table with four rows (hydro count, max PAR order, production methods, PAR models)
   c. A "safe modifications" list documenting what can change
   d. A note on the error type and behavior (hard error, training aborts)
4. Add a cross-reference from `simulation-architecture.md` section 2 to the new validation subsection

### Key Files to Modify

- `src/specs/architecture/input-loading-pipeline.md` -- add SS7.1 warm-start validation subsection
- `src/specs/architecture/simulation-architecture.md` -- add cross-reference (minor, 1-2 lines)

### Patterns to Follow

- Architecture specs use `SS` prefix for section numbering (SS7.1)
- Validation rules follow the pattern in SS2.6 (cross-reference validation): tabular format with source, rule, and error variant
- The `LoadError` enum is defined in SS8.1 of the same file

### Pitfalls to Avoid

- Do NOT use `§` in architecture specs
- Do NOT add a new `LoadError` variant without checking the existing enum in SS8.1 -- prefer adding a new variant (e.g., `PolicyIncompatible`) or reusing an existing one if appropriate
- The warm-start validation is separate from resume validation (resume requires bit-for-bit state restoration, not just dimensional compatibility)
- `PolicyMetadata` in `binary-formats.md` already stores `state_dimension` -- leverage this rather than defining a new metadata field

## Testing Requirements

### Unit Tests

Not applicable (Markdown spec document).

### Integration Tests

- Run `mdbook build` and verify no new errors
- Verify cross-reference link from simulation-architecture.md resolves

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
