# ticket-002 Add PAR-to-LP Transformation Flow and PrecomputedParLp Struct

## Context

### Background

GAP-022 identifies that the PAR preprocessing pipeline produces arrays but the concrete struct holding LP-ready precomputed values is not defined. The stakeholder review provided the complete derivation showing four forms of the PAR equation: (1) canonical standardized form, (2) original-units form (already in `par-inflow-model.md` section 1), (3) coefficient conversion from standardized to original, and (4) LP-ready form with separated deterministic base, lag coefficients, and noise scale. The user confirmed that a precomputed struct caching `psi` coefficients, deterministic base per (stage, hydro), and `sigma` per (stage, hydro) is needed.

### Relation to Epic

This is the highest-impact gap in Epic 02. It defines the data transformation pipeline from `cobre-stochastic` PAR model parameters to the LP-ready values that `cobre-sddp` consumes at every forward pass stage transition. Without this, the LP construction code has no specification for how PAR parameters become RHS values.

### Current State

`src/specs/math/par-inflow-model.md` currently has:

- **Section 1**: Model definition in original-units form (equation with `psi` coefficients)
- **Section 3**: Stored vs computed quantities, including an "LP coefficients" subsection that shows the LP equation with deterministic base
- **Sections 4-6**: Fitting, validation

`src/specs/data-model/internal-structures.md` section 14 covers the scenario pipeline but does **not** define a `PrecomputedParLp` struct for LP-ready values. The existing `ParModel` struct in that section holds the fitting parameters, not the LP-ready precomputed values.

What is missing:

- The explicit canonical-to-LP transformation derivation with all intermediate steps
- The `PrecomputedParLp` struct definition with exact fields
- The workflow showing how the precomputed struct is populated and consumed

## Specification

### Requirements

1. Add a new section to `src/specs/math/par-inflow-model.md` (section 3.1 or a new section 7) documenting the explicit PAR-to-LP transformation flow with all four equation forms
2. Add the `PrecomputedParLp` struct definition to `src/specs/data-model/internal-structures.md` section 14 (scenario pipeline) with fields for: `psi` coefficients per (stage, hydro, lag), deterministic base per (stage, hydro), and `sigma` per (stage, hydro)
3. The derivation must show:
   - Canonical form: `(a_{h,t} - mu) / sigma = sum phi * (a_{h,t-l} - mu_{m(t-l)}) / sigma_{m(t-l)} + epsilon`
   - Coefficient conversion: `psi_{m(t),l} = phi_{m(t),l} * (sigma_{m(t)} / sigma_{m(t-l)})`
   - LP-ready form: `a_{h,t} = sum psi * a_{h,t-l} + [mu - sum psi * mu_{m(t-l)}] + sigma * epsilon`
   - Deterministic base: `mu_{m(t)} - sum psi * mu_{m(t-l)}` (precomputed constant per stage/hydro)
4. Document that the deterministic base and sigma are cached in the precomputed struct for a multiply-add operation before setting the LP RHS

### Out of Scope

- Modifying the fitting procedure (sections 4-6) -- those are correct as-is
- Changing the `ParModel` struct that holds fitting parameters
- Adding Rust implementation code -- only spec-level struct definitions

### Inputs/Props

The four equation forms (from `review.md`):

**Canonical**: $(a_{h,t} - \mu_{m(t)}) / \sigma_{m(t)} = \sum_{\ell=1}^{p} \phi_{m(t),\ell} (a_{h,t-\ell} - \mu_{m(t-\ell)}) / \sigma_{m(t-\ell)} + \varepsilon_t$

**Coefficient conversion**: $\psi_{m(t),\ell} = \phi_{m(t),\ell} \cdot (\sigma_{m(t)} / \sigma_{m(t-\ell)})$

**LP-ready form**: $a_{h,t} = \sum_{\ell=1}^{p} \psi_{m(t),\ell} a_{h,t-\ell} + [\mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell}\mu_{m(t-\ell)}] + \sigma_{m(t)} \cdot \varepsilon_t$

**Deterministic base** = $\mu_{m(t)} - \sum_{\ell=1}^{p} \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)}$

### Outputs/Behavior

Two updated spec files:

1. `par-inflow-model.md` with a new subsection documenting the complete transformation flow
2. `internal-structures.md` with a `PrecomputedParLp` struct definition

### Error Handling

Not applicable (spec documentation).

## Acceptance Criteria

- [ ] Given `src/specs/math/par-inflow-model.md`, when reading the new transformation section, then all four equation forms are present: canonical standardized, coefficient conversion, original-units (existing section 1), and LP-ready with separated deterministic base
- [ ] Given `src/specs/math/par-inflow-model.md`, when reading the new transformation section, then the deterministic base is explicitly identified as $\mu_{m(t)} - \sum \psi_{m(t),\ell} \cdot \mu_{m(t-\ell)}$ and described as a precomputed constant per (stage, hydro)
- [ ] Given `src/specs/data-model/internal-structures.md` section 14, when reading the `PrecomputedParLp` struct definition, then it contains fields for: psi coefficients (per stage, hydro, lag), deterministic base (per stage, hydro), and sigma (per stage, hydro)
- [ ] Given the `PrecomputedParLp` struct, when reading the doc comments, then the struct explicitly states it caches values for a multiply-add operation (deterministic_base + sigma \* noise) before setting the LP RHS
- [ ] Given `src/specs/math/par-inflow-model.md`, when running `mdbook build`, then the build succeeds with no new errors and all KaTeX equations render

## Implementation Guide

### Suggested Approach

1. Read `src/specs/math/par-inflow-model.md` in full to understand the existing structure
2. Add a new subsection after section 3 (e.g., "3.1 PAR-to-LP Transformation Flow" or "7. PAR-to-LP Transformation") documenting:
   a. The canonical standardized form (input from user/fitting tools)
   b. The coefficient conversion from standardized `phi` to original-units `psi` (this is already in section 5.5, but restate in the transformation context)
   c. The LP-ready form with terms separated for implementation
   d. Identification of the three components: lag coefficients (`psi`), deterministic base, noise scale (`sigma`)
   e. A note that the deterministic base and sigma are cached per (stage, hydro) for a single multiply-add before LP RHS patching
3. Read `src/specs/data-model/internal-structures.md` section 14 to understand the scenario pipeline structures
4. Add the `PrecomputedParLp` struct definition in section 14, following the existing struct patterns (doc comments, field descriptions table, design rationale)
5. Add a cross-reference between the two files

### Key Files to Modify

- `src/specs/math/par-inflow-model.md` -- add transformation flow section
- `src/specs/data-model/internal-structures.md` -- add `PrecomputedParLp` struct in section 14

### Patterns to Follow

- Math sections in `par-inflow-model.md` use `$$` blocks with KaTeX notation for display equations
- Struct definitions in `internal-structures.md` follow the pattern: Rust code block, then field descriptions table, then design rationale
- Section numbering in math specs uses plain numbers (e.g., `## 7.` or `### 3.1`)
- Section numbering in data-model specs uses `§` prefix for references from other files but plain numbers within the file itself

### Pitfalls to Avoid

- Do NOT modify the existing section 1 model definition or sections 4-6 fitting procedure
- The existing section 3 "LP coefficients" subsection already has the LP equation -- the new content should provide the explicit derivation path from canonical to LP form, not duplicate what is there
- Ensure KaTeX math uses the same notation conventions as the existing file ($a_{h,t}$, $\mu_{m(t)}$, $\psi_{m(t),\ell}$, $\sigma_{m(t)}$)
- The `PrecomputedParLp` struct belongs to `cobre-sddp` performance layer (not `cobre-core`), consistent with the dual-nature design in internal-structures.md section 1.1

## Testing Requirements

### Unit Tests

Not applicable (Markdown spec document).

### Integration Tests

- Run `mdbook build` and verify no new errors
- Verify KaTeX equations render correctly (no missing symbols or broken rendering)

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
