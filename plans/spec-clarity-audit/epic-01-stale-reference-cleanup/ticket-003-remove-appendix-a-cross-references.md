# ticket-003 Remove Binary Formats Appendix A Cross-References

## Context

### Background

After ticket-002 deletes Appendix A from `src/specs/data-model/binary-formats.md`, six other files contain cross-references to "Binary Formats Appendix A", "Binary Formats SSA", or "LP rebuild strategy analysis (SSA)". These references will become broken links (or confusing dead-end references) and must be updated or removed.

### Relation to Epic

This ticket is the immediate follow-up to ticket-002. It ensures that no cross-references to the deleted appendix remain anywhere in the corpus.

### Current State

Files with references to Binary Formats Appendix A:

1. `src/specs/overview/design-principles.md` line 122: `See [Binary Formats Appendix A](../data-model/binary-formats.md) for the complete C vs C++ API comparison across HiGHS and CLP.` -- **already handled by ticket-001**
2. `src/specs/architecture/solver-interface-trait.md` line 740: `[Binary Formats](../data-model/binary-formats.md) -- Cut pool memory layout (SS3.4) that produces RowBatch inputs; LP rebuild strategy analysis (SS3, Appendix A)`
3. `src/specs/architecture/solver-clp-impl.md` line 300: `[Binary Formats](../data-model/binary-formats.md) -- Cut pool CSR layout (SS3.4), LP rebuild analysis (SSA)`
4. `src/specs/architecture/solver-highs-impl.md` line 257: `[Binary Formats](../data-model/binary-formats.md) -- Cut pool CSR layout (SS3.4), LP rebuild analysis (SSA)`
5. `src/specs/architecture/solver-workspaces.md` line 327: `[Binary Formats](../data-model/binary-formats.md) -- Cut pool CSR layout (SS3.4), LP rebuild analysis (SSA)`
6. `src/specs/architecture/solver-abstraction.md` line 674: `[Binary Formats](../data-model/binary-formats.md) -- FlatBuffers schema for cut persistence, cut pool memory layout (SS3.4), LP rebuild strategy analysis (SS3, SSA)`

In each case, the cross-reference entry has two parts: (a) a valid reference to Binary Formats SS3.4 (cut pool memory layout) which should be kept, and (b) an invalid reference to the deleted Appendix A which should be removed.

## Specification

### Requirements

1. In each of the 5 files listed above (excluding design-principles.md which is handled by ticket-001), remove the "LP rebuild analysis (SSA)" or "LP rebuild strategy analysis (SS3, Appendix A)" portion from the cross-reference entry
2. Keep the valid "Cut pool memory layout (SS3.4)" or "FlatBuffers schema" portions of each cross-reference entry
3. Do not modify any other content in these files

### Inputs/Props

- Files to edit: solver-interface-trait.md, solver-clp-impl.md, solver-highs-impl.md, solver-workspaces.md, solver-abstraction.md (all in `src/specs/architecture/`)
- The pattern to remove: `, LP rebuild analysis (SSA)` or `, LP rebuild strategy analysis (SS3, Appendix A)` or `, LP rebuild strategy analysis (SS3, SSA)`

### Outputs/Behavior

- Each cross-reference entry retains its valid reference to Binary Formats SS3.4 but no longer mentions Appendix A or SSA
- No other content in these files is changed

### Error Handling

- If line numbers have shifted, locate the cross-reference entries by searching for "SSA" or "Appendix A" in each file

## Acceptance Criteria

- [ ] Given the 5 architecture spec files, when searching for "SSA" or "Appendix A", then zero matches are found in any of them
- [ ] Given `src/specs/architecture/solver-interface-trait.md` line 740 area, when reading the Binary Formats cross-reference entry, then it references SS3.4 only, with no mention of Appendix A
- [ ] Given `src/specs/architecture/solver-abstraction.md` line 674 area, when reading the Binary Formats cross-reference entry, then it references SS3.4 and SS3 only, with no mention of SSA
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. For each of the 5 files, search for "SSA" or "Appendix A"
2. Edit the matching cross-reference line to remove only the Appendix A reference portion
3. Specific edits:
   - `solver-interface-trait.md` line 740: change `LP rebuild strategy analysis (SS3, Appendix A)` to remove that clause entirely, keeping `Cut pool memory layout (SS3.4) that produces RowBatch inputs`
   - `solver-clp-impl.md` line 300: change `Cut pool CSR layout (SS3.4), LP rebuild analysis (SSA)` to `Cut pool CSR layout (SS3.4)`
   - `solver-highs-impl.md` line 257: change `Cut pool CSR layout (SS3.4), LP rebuild analysis (SSA)` to `Cut pool CSR layout (SS3.4)`
   - `solver-workspaces.md` line 327: change `Cut pool CSR layout (SS3.4), LP rebuild analysis (SSA)` to `Cut pool CSR layout (SS3.4)`
   - `solver-abstraction.md` line 674: change `FlatBuffers schema for cut persistence, cut pool memory layout (SS3.4), LP rebuild strategy analysis (SS3, SSA)` to `FlatBuffers schema for cut persistence, cut pool memory layout (SS3.4)`
4. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/solver-interface-trait.md` (line 740)
- `src/specs/architecture/solver-clp-impl.md` (line 300)
- `src/specs/architecture/solver-highs-impl.md` (line 257)
- `src/specs/architecture/solver-workspaces.md` (line 327)
- `src/specs/architecture/solver-abstraction.md` (line 674)

### Patterns to Follow

- Cross-reference entries in architecture specs use the format: `- [File](./link.md) -- description (section list)`
- Architecture specs use `SS` prefix for architecture section references

### Pitfalls to Avoid

- Do not modify any content other than the cross-reference entries
- Do not remove the entire cross-reference line -- only remove the Appendix A portion
- Do not touch `design-principles.md` -- that is handled by ticket-001

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep -r "SSA\|Appendix A" src/specs/architecture/*.md` and verify zero matches
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-002 (binary-formats cleanup must be done first so we know the Appendix is deleted)
- **Blocks**: ticket-015 (cross-reference index update)

## Effort Estimate

**Points**: 1
**Confidence**: High
