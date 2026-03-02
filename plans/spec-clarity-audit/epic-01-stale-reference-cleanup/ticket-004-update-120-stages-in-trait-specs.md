# ticket-004 Update "120 stages" Production References in Trait Specs

## Context

### Background

Four trait spec files in `src/specs/architecture/` use "120 stages" as the production-scale reference in their dispatch mechanism sections. The canonical production reference (`src/specs/overview/production-scale-reference.md`) uses 60 stages. These are all performance-characteristics paragraphs that calculate the number of enum match dispatches per iteration to argue that dispatch overhead is negligible. The calculations themselves are straightforward substitutions: replace 120 with 60 and recalculate the result.

### Relation to Epic

This ticket groups all four trait spec updates into a single atomic unit because: (a) the edits are identical in nature (substitute a number and recalculate), (b) the files follow the same structural pattern, and (c) modifying them together avoids four separate 1-point tickets.

### Current State

1. `src/specs/architecture/risk-measure-trait.md` line 206:
   `At production scale (192 forward passes, 120 stages), this is at most ~23,000 match dispatches per iteration`
   Correct calculation: 192 x 60 = 11,520

2. `src/specs/architecture/sampling-scheme-trait.md` line 310:
   `At production scale (192 forward passes, 120 stages), this is ~23,000 match dispatches per iteration`
   Correct calculation: 192 x 60 = 11,520

3. `src/specs/architecture/horizon-mode-trait.md` line 357:
   `At production scale (120 stages, 200 iterations), this is ~48,000 match dispatches per training run`
   Correct calculation: 60 stages x 200 iterations x 2 (successors + is_terminal) = 24,000 -- but check the exact formula in context

4. `src/specs/architecture/cut-selection-trait.md` line 344:
   `at production scale (120 stages, check_frequency=10) amounts to at most 12 dispatches per iteration`
   Correct calculation: 60 / 10 = 6 dispatches per iteration (or check if the formula is stages / check_frequency)

## Specification

### Requirements

1. In each of the 4 files, replace "120 stages" with "60 stages" in the performance-characteristics paragraph of the dispatch mechanism section
2. Recalculate the derived dispatch count for each file using the formula in context
3. Keep the argumentative conclusion unchanged (dispatch overhead is negligible) -- the conclusion remains valid at 60 stages

### Inputs/Props

- Files to edit (all in `src/specs/architecture/`):
  - `risk-measure-trait.md` (line 206)
  - `sampling-scheme-trait.md` (line 310)
  - `horizon-mode-trait.md` (line 357)
  - `cut-selection-trait.md` (line 344)
- Canonical production dimensions: `src/specs/overview/production-scale-reference.md` section 1 (60 stages, 192 forward passes, 50 iterations)

### Outputs/Behavior

- Each file uses "60 stages" as the production reference
- Derived dispatch counts are recalculated correctly
- The "dispatch overhead is negligible" conclusion is preserved (it remains valid at smaller numbers)

### Error Handling

- If line numbers have shifted, locate by searching for "120 stages" in each file
- Verify the dispatch count formula by reading the surrounding paragraph before editing

## Acceptance Criteria

- [ ] Given `src/specs/architecture/risk-measure-trait.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/architecture/sampling-scheme-trait.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/architecture/horizon-mode-trait.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/architecture/cut-selection-trait.md`, when searching for "120 stages", then zero matches are found
- [ ] Given each of the 4 files, when reading the dispatch count, then the number matches the formula with 60 stages substituted (e.g., 192 x 60 = 11,520 for risk-measure and sampling-scheme)

## Implementation Guide

### Suggested Approach

1. For each file, read the paragraph containing "120 stages" to understand the exact formula
2. Substitute 60 for 120 and recalculate:
   - **risk-measure-trait.md**: `192 forward passes, 60 stages` => `at most ~11,520 match dispatches per iteration`
   - **sampling-scheme-trait.md**: `192 forward passes, 60 stages` => `~11,520 match dispatches per iteration`
   - **horizon-mode-trait.md**: Read the formula carefully. `successors` and `is_terminal` are called once per stage per forward/backward pass iteration. With 60 stages and 200 iterations: check if it is `60 x 200 = 12,000` or `60 x 2 x 200 = 24,000` (the "x 2" being forward + backward). Use the exact formula from context
   - **cut-selection-trait.md**: `60 stages, check_frequency=10` => `at most 6 dispatches per iteration`
3. Edit each line with the corrected values
4. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/risk-measure-trait.md` (line 206)
- `src/specs/architecture/sampling-scheme-trait.md` (line 310)
- `src/specs/architecture/horizon-mode-trait.md` (line 357)
- `src/specs/architecture/cut-selection-trait.md` (line 344)

### Patterns to Follow

- Trait specs use `SS` prefix for section references
- Performance characteristics paragraphs appear in the dispatch mechanism section (typically SS4)
- The paragraph structure is: "At production scale (dimensions), this is N dispatches -- negligible compared to LP solve cost"

### Pitfalls to Avoid

- Do not change any other content in these files -- only the "120 stages" reference and derived count
- Do not change the `§` reference inside the convention blockquote (if present) -- those are correct as-is
- Verify the formula before substituting -- do not assume all four use the same formula
- The `performance-adaptation-layer.md` file also has "120 stages" but those are handled in ticket-005 (different context: range bounds and FLOP calculations)

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep "120 stages" src/specs/architecture/risk-measure-trait.md src/specs/architecture/sampling-scheme-trait.md src/specs/architecture/horizon-mode-trait.md src/specs/architecture/cut-selection-trait.md` and verify zero matches
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-016 (full-corpus verification)

## Effort Estimate

**Points**: 1
**Confidence**: High
