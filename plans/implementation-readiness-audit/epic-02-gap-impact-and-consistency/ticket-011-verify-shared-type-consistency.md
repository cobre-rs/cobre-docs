# ticket-011 Verify Shared Type Consistency Across Specs

## Context

### Background

Several critical types in the Cobre spec corpus are referenced across multiple spec files. If these types have inconsistent definitions (different field names, different field types, different variant lists), an implementer will encounter contradictions. The gap-resolution plan introduced or refined several of these types (System struct, CutWireRecord, TrainingEvent, LoadError, StageTemplate, StageIndexer), and each was defined in "one canonical source" with cross-references. This ticket verifies that the cross-references are consistent with the canonical source and that no spec silently assumes a different definition.

### Relation to Epic

This is ticket 11 of 11 in Epic 02. It provides the type consistency verification that feeds into the final readiness verdict (ticket-017).

### Current State

The shared types and their canonical sources (established in gap-resolution learnings):

- **System**: `src/specs/data-model/internal-structures.md` SS1
- **StageTemplate**: `src/specs/architecture/solver-abstraction.md` SS2.1
- **StageIndexer**: `src/specs/architecture/solver-abstraction.md` SS2.2
- **CutWireRecord**: `src/specs/architecture/cut-management-impl.md` SS4.2a
- **TrainingEvent**: `src/specs/architecture/training-loop.md` SS2.1b
- **LoadError**: `src/specs/architecture/input-loading-pipeline.md` SS8.1
- **SolverError**: `src/specs/architecture/solver-interface-trait.md` (location varies)

Additionally, mathematical notation for shared concepts must be consistent:

- Cut coefficients ($\alpha_t^k$, $\beta_t^k$): defined in `src/specs/math/cut-management.md`, referenced in `training-loop.md`, `cut-management-impl.md`, `risk-measure-trait.md`
- Stage cost function notation: defined in `src/specs/math/sddp-algorithm.md`, referenced across many specs
- Dual variable notation: defined in `src/specs/math/lp-formulation.md`, referenced in solver-interface-trait.md, training-loop.md

## Specification

### Requirements

**Part 1: Shared Type Consistency**
For each of the 7 shared types listed above:

1. Read the canonical source definition (exact section) and extract: type name, all field names, all field types, derive macros, and any invariants
2. Search the entire spec corpus for all references to this type
3. For each reference, verify it is consistent with the canonical source:
   - If the reference mentions field names, do they match?
   - If the reference mentions field types, do they match?
   - If the reference lists variants (for enums), do they match?
   - If the reference describes behavior, does it match the canonical contract?
4. Log any discrepancy as a finding

**Part 2: Mathematical Notation Consistency**
For each of the 3 notation families listed above:

1. Read the canonical source definition in the math spec
2. Search all architecture specs for usage of the same mathematical symbols
3. Verify that the symbols have the same meaning in every context
4. Flag any notation overloading (same symbol, different meaning) or inconsistency (different symbol, same meaning)

**Part 3: Enum Variant Completeness**
For each enum type that appears in trait specs:

1. Verify that every variant listed in the trait spec has a corresponding definition in the math spec
2. Verify that the trait spec's variant list matches what the training loop or simulation architecture expects
3. Flag any "phantom variants" (listed in one place but not another)

### Inputs/Props

- All canonical source files listed above
- All spec files under `src/specs/` (search targets)
- `src/specs/math/cut-management.md`, `src/specs/math/sddp-algorithm.md`, `src/specs/math/lp-formulation.md` (notation sources)

### Outputs/Behavior

A Markdown report written to `plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-011-shared-types.md` containing:

1. **Per-Type Consistency Matrix**: For each shared type, a table of all referencing files with a CONSISTENT/INCONSISTENT status and notes
2. **Notation Consistency Matrix**: For each notation family, a table of all usage sites with CONSISTENT/INCONSISTENT status
3. **Findings**: Numbered findings for every inconsistency, with evidence citations from both the canonical source and the inconsistent reference
4. **Summary**: Count of inconsistencies by type and severity

### Error Handling

- If a canonical source section does not exist (e.g., if a section number was changed), log it as a Blocker finding and attempt to locate the type definition elsewhere
- If a type is referenced but its canonical source is ambiguous (defined in two places), log both definitions and flag the ambiguity

## Acceptance Criteria

- [ ] Given the System struct in internal-structures.md SS1, when every reference to System in other spec files is inspected, then all references are consistent with the canonical field list
- [ ] Given the CutWireRecord in cut-management-impl.md SS4.2a, when its `#[repr(C)]` layout with explicit padding is checked against all references, then every reference uses the correct field names and byte sizes
- [ ] Given the TrainingEvent enum in training-loop.md SS2.1b with 11 variants, when all references to TrainingEvent are inspected, then no spec assumes a different variant count or variant name
- [ ] Given the LoadError enum in input-loading-pipeline.md SS8.1 with 5 variants, when all references are inspected, then no spec assumes a different variant count or variant name
- [ ] Given the cut coefficient notation ($\alpha_t^k$, $\beta_t^k$) in cut-management.md, when all architecture specs that use cut coefficients are inspected, then the notation is identical
- [ ] Given the dual variable notation in lp-formulation.md, when solver-interface-trait.md and training-loop.md are inspected, then the dual normalization convention and sign convention are consistent
- [ ] Given the SolverError enum, when its variants are cross-referenced with the hard-stop vs proceed-with-partial mapping, then all referencing specs use the same mapping

## Implementation Guide

### Suggested Approach

1. For each shared type, read the canonical source and create a "canonical snapshot" (field list, variant list, invariants)
2. Search the spec corpus for all references: `grep -rn "TypeName" src/specs/`
3. For each reference, compare against the canonical snapshot
4. For mathematical notation, search for the LaTeX symbols in all files
5. Compile discrepancies into findings
6. Pay special attention to types that were modified during gap-resolution (System, CutWireRecord, TrainingEvent, LoadError) -- these are most likely to have stale references

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-011-shared-types.md`

### Patterns to Follow

- Use exact string matching for field names and variant names (case-sensitive)
- For mathematical notation, compare the LaTeX source, not the rendered output
- Follow the "one canonical source + cross-references only" convention from CLAUDE.md

### Pitfalls to Avoid

- Some specs may describe a type at a higher level of abstraction (e.g., "the system representation") without listing fields. This is not an inconsistency -- only flag cases where specific field names or types differ.
- Mathematical notation may use subscript/superscript variations in different contexts (e.g., $\alpha_t^k$ vs $\alpha_{t,k}$). Flag these only if the subscript/superscript convention is documented as authoritative.
- The `patch_row_bounds`/`patch_col_bounds` rename was propagated to all 5 affected files during gap-resolution. Verify this is complete (no lingering `patch_rhs_bounds` references).

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-017 (readiness verdict uses the consistency results)

## Effort Estimate

**Points**: 3
**Confidence**: Medium (scope depends on the number of inconsistencies discovered)
