# ticket-003: Update SUMMARY.md and Add Cross-References

## Context

### Background

The ecosystem guidelines page created in ticket-002 must be added to the mdBook table of contents (`src/SUMMARY.md`) and cross-referenced from the spec-gap-inventory and cross-reference index so it is discoverable within the specification corpus.

### Relation to Epic

Final ticket of Epic 1. Integrates the new page into the mdBook navigation structure.

### Current State

The Specifications > Overview section in `src/SUMMARY.md` currently lists:

```markdown
- [Overview](./specs/overview.md)
  - [Design Principles](./specs/overview/design-principles.md)
  - [Notation Conventions](./specs/overview/notation-conventions.md)
  - [Production Scale Reference](./specs/overview/production-scale-reference.md)
  - [Implementation Ordering](./specs/overview/implementation-ordering.md)
  - [Spec Gap Inventory](./specs/overview/spec-gap-inventory.md)
```

## Specification

### Requirements

1. Add the ecosystem guidelines page to `src/SUMMARY.md` in the Specifications > Overview section
2. Place it between "Design Principles" and "Notation Conventions" (guidelines are high-level and should appear early)
3. Verify `mdbook build` succeeds with no broken links

### Inputs/Props

- `/home/rogerio/git/cobre-docs/src/SUMMARY.md` -- existing table of contents
- `/home/rogerio/git/cobre-docs/src/specs/overview/ecosystem-guidelines.md` -- created by ticket-002

### Outputs/Behavior

Updated SUMMARY.md with the new page linked. The page should appear in the left sidebar of the mdBook.

### Error Handling

Not applicable (file edit).

## Acceptance Criteria

- [ ] Given `src/SUMMARY.md` is read, when the Overview section is inspected, then a line `  - [Ecosystem Guidelines](./specs/overview/ecosystem-guidelines.md)` appears between "Design Principles" and "Notation Conventions"
- [ ] Given the mdBook is built with `mdbook build`, when the build completes, then there are no broken link errors
- [ ] Given the mdBook is served, when a user navigates to Specifications > Overview, then "Ecosystem Guidelines" appears in the sidebar between "Design Principles" and "Notation Conventions"

## Implementation Guide

### Suggested Approach

1. Open `src/SUMMARY.md`
2. Find the line `  - [Design Principles](./specs/overview/design-principles.md)`
3. Add a new line after it: `  - [Ecosystem Guidelines](./specs/overview/ecosystem-guidelines.md)`
4. Run `mdbook build` to verify no broken links

### Key Files to Modify

- **Edit**: `/home/rogerio/git/cobre-docs/src/SUMMARY.md` -- add one line

### Patterns to Follow

- Same indentation as sibling entries (two spaces before the dash)
- Same link format as other overview entries

### Pitfalls to Avoid

- Do NOT change the indentation level (must be two spaces, same as other sub-entries under Overview)
- Do NOT add the entry in the wrong section (must be under Specifications > Overview, not under User Guide or Reference)

## Testing Requirements

### Unit Tests

Not applicable (documentation).

### Integration Tests

- Run `mdbook build` and verify success with no broken links

## Dependencies

- **Blocked By**: ticket-002 (the ecosystem guidelines page must exist before linking)
- **Blocks**: None within this epic. Subsequent epics benefit from the guidelines being in context.

## Effort Estimate

**Points**: 1
**Confidence**: High
