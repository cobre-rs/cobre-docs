# ticket-015 Update Cross-Reference Index for ecosystem-vision.md

## Context

### Background

The cross-reference index (`src/specs/cross-reference-index.md`) is the canonical navigation index for all specification files. After ticket-014 creates `ecosystem-vision.md`, the index must be updated with the new file's entry across all 5 sections: spec-to-crate mapping, per-crate reading lists, outgoing cross-references, incoming cross-references, and dependency ordering.

### Relation to Epic

This is the final ticket in the plan. It integrates the new ecosystem vision document into the cross-reference index, completing the ecosystem scope restoration.

### Current State

File `src/specs/cross-reference-index.md`:

- Lists 76 specification files (document count in header)
- Section 1: Spec-to-Crate Mapping Table (76 entries)
- Section 2: Per-Crate Reading Lists (11 crates)
- Section 3: Outgoing Cross-Reference Table
- Section 4: Incoming Cross-Reference Table
- Section 5: Dependency Ordering

The new `ecosystem-vision.md` does not yet exist in the index.

## Specification

### Requirements

1. Increment the document count in the header from 76 to 77
2. Add `ecosystem-vision.md` to Section 1 (Spec-to-Crate Mapping Table):
   - Primary Crate: `(cross-cutting)` (no single owning crate)
   - Secondary Crate(s): `All crates`
   - Section: `overview`
3. Add `ecosystem-vision.md` to Section 2 (Per-Crate Reading Lists):
   - Per CLAUDE.md rules, cross-cutting documents go into all 11 per-crate reading lists as `(secondary)`
   - Place it near `ecosystem-guidelines.md` in each list
4. Add outgoing cross-references for `ecosystem-vision.md` in Section 3
5. Add incoming cross-references for specs that `ecosystem-vision.md` references in Section 4
6. Add `ecosystem-vision.md` to the dependency ordering in Section 5
7. Follow the batch update methodology from `CLAUDE.md`: all 5 sections updated together

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`
- New file: `src/specs/overview/ecosystem-vision.md` (created by ticket-014)
- Batch update methodology from CLAUDE.md section "Cross-Reference Index Methodology"

### Outputs/Behavior

- Cross-reference index has 77 entries
- `ecosystem-vision.md` appears in all 5 sections
- All 11 per-crate reading lists include the new file as `(secondary)`
- Existing entries unchanged except for new incoming references

### Error Handling

- The cross-reference index file is large (~256KB). Read only the sections needed for the update.
- If the document count has changed since this plan was written (e.g., other plans added files), use the actual current count.

## Acceptance Criteria

- [ ] Given the cross-reference index, when the document count is read, then it is one more than the previous count
- [ ] Given Section 1, when searched for `ecosystem-vision.md`, then exactly one entry appears with Primary Crate `(cross-cutting)` and Secondary Crate(s) `All crates`
- [ ] Given Section 2, when each of the 11 per-crate reading lists is examined, then `ecosystem-vision.md` appears as `(secondary)` in each one
- [ ] Given Section 3, when `ecosystem-vision.md` outgoing references are read, then they list the specs that the vision document references
- [ ] Given Section 5, when the dependency ordering is examined, then `ecosystem-vision.md` appears at an appropriate position (it has few dependencies, being an overview document)
- [ ] Given the file, when `mdbook build` is run, then the build succeeds

### Out of Scope

- Updating any other spec entries in the index (only the new file and its references)
- Modifying the index structure or format
- Updating section numbers in existing specs

## Implementation Guide

### Suggested Approach

1. Read the current document count from the header
2. **Section 1**: Add a row for `ecosystem-vision.md`:
   ```
   | 77 | [ecosystem-vision.md](./overview/ecosystem-vision.md) | overview | (cross-cutting) | All crates |
   ```
   Use the next available number (may be 77 or higher if other plans added entries)
3. **Section 2**: In each of the 11 per-crate reading lists, add `[Ecosystem Vision](./overview/ecosystem-vision.md) (secondary)` near the `[Ecosystem Guidelines]` entry
4. **Section 3**: Create the outgoing references entry for `ecosystem-vision.md`. List all specs it references (from the actual file content created by ticket-014)
5. **Section 4**: For each spec referenced by `ecosystem-vision.md`, add an incoming reference entry
6. **Section 5**: Place `ecosystem-vision.md` in the dependency order. As an overview document with few outgoing references, it should appear near the beginning (low dependency count)
7. Increment the document count in the header

### Key Files to Modify

- `src/specs/cross-reference-index.md`

### Patterns to Follow

- Cross-cutting documents: `(cross-cutting)` as Primary Crate, `All crates` as Secondary
- `(secondary)` marker in per-crate reading lists
- Follow existing formatting: `| # | [file](./path) | section | crate | secondary |`
- Batch update: all 5 sections updated in one ticket

### Pitfalls to Avoid

- Do NOT update the index piecemeal -- all 5 sections must be updated together (per CLAUDE.md rules)
- Do NOT miss any of the 11 per-crate reading lists
- Verify the link path is `./overview/ecosystem-vision.md` (relative to `src/specs/`)
- The file is very large -- use targeted reads/edits rather than reading the entire file

## Testing Requirements

### Unit Tests

- `grep "ecosystem-vision" src/specs/cross-reference-index.md` returns matches in all 5 sections

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: ticket-014 (the new file must exist before it can be indexed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Medium (the cross-reference index is large and requires careful section-by-section updates)
