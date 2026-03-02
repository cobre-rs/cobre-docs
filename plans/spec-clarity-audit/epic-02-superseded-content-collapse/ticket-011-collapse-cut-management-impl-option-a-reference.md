# ticket-011 Collapse Option A Reference in cut-management-impl.md

## Context

### Background

`src/specs/architecture/cut-management-impl.md` contains a single inline reference to "the previous Option A" in the StageLpCache coefficient write description. This is a minor comparative framing issue rather than a large superseded block, but it should be cleaned for consistency with the rest of the audit.

### Relation to Epic

This is the smallest ticket in Epic 02, handling a single-line edit. It completes the superseded content cleanup in the architecture spec directory.

### Current State

`src/specs/architecture/cut-management-impl.md` line 323:

```
The coefficient write to StageLpCache is the additional step introduced by Strategy 2+3 --
under the previous Option A, coefficients were written only to the cut pool and assembled
into CSR on each stage transition.
```

This sentence describes the StageLpCache coefficient write as "additional" relative to Option A. Under the current architecture, it is simply the mechanism -- not an "additional step." The comparative framing with Option A is unnecessary.

## Specification

### Requirements

1. Rewrite line 323 to describe the StageLpCache coefficient write as the current mechanism without comparing to Option A:
   `The coefficient write to StageLpCache ensures that the per-stage CSC representation stays current as new cuts are generated. Coefficients are written both to the cut pool metadata and to the StageLpCache CSC slots.`
2. Remove the "under the previous Option A" comparative clause

### Inputs/Props

- File to edit: `src/specs/architecture/cut-management-impl.md`
- Line 323

### Outputs/Behavior

- The StageLpCache coefficient write is described as the current mechanism, not as a deviation from a previous approach
- No mention of "Option A" remains in the file

### Error Handling

- If line 323 has shifted, locate by searching for "previous Option A" in the file

## Acceptance Criteria

- [ ] Given `src/specs/architecture/cut-management-impl.md`, when searching for "Option A", then zero matches are found
- [ ] Given `src/specs/architecture/cut-management-impl.md`, when reading the StageLpCache coefficient write description near line 323, then it describes the mechanism without comparative framing
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Read lines 318-330 to understand the context
2. Replace the sentence at line 323 with:
   `The coefficient write to StageLpCache ensures the per-stage CSC representation stays current as new cuts are generated. Coefficients are written to both the cut pool metadata (intercepts, activity bitmap) and the StageLpCache CSC column data.`
3. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/cut-management-impl.md` (line 323)

### Patterns to Follow

- Architecture specs use `SS` prefix for section references
- Describe the current mechanism directly

### Pitfalls to Avoid

- Do not change surrounding paragraphs -- this is a surgical single-line edit
- Verify that no other "Option A" references exist in the file (there should be none, but check)

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep -c "Option A" src/specs/architecture/cut-management-impl.md` and verify count is 0
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None (can run in parallel with other Epic 02 tickets)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
