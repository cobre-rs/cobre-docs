# ticket-021 Update SUMMARY and Cross-Reference Index for Readiness Documents

## Context

### Background

Tickets 019 and 020 create two new specification files in `src/specs/overview/`:

- `implementation-ordering.md` -- crate build sequence and minimal viable solver definition
- `spec-gap-inventory.md` -- catalog of specification gaps that would block implementation

These files must be registered in the two navigation/index documents that make the spec corpus discoverable:

1. `src/SUMMARY.md` -- mdBook's sidebar table of contents (controls what appears in the rendered book)
2. `src/specs/cross-reference-index.md` -- the centralized navigation index for spec files

This is the final housekeeping ticket that completes the spec-readiness plan.

### Relation to Epic

This is the third and final ticket in Epic 05 (Implementation Readiness Assessment). It depends on both ticket-019 and ticket-020 because it must reference the actual content of those files to produce accurate cross-reference entries.

### Current State

**`src/SUMMARY.md`** currently has the Overview section structured as:

```markdown
- [Overview](./specs/overview.md)
  - [Design Principles](./specs/overview/design-principles.md)
  - [Notation Conventions](./specs/overview/notation-conventions.md)
  - [Production Scale Reference](./specs/overview/production-scale-reference.md)
```

The new documents should be added after `Production Scale Reference` in this list, as they are overview-level documents that logically follow the reference material.

**`src/specs/cross-reference-index.md`** currently tracks 72 spec files. The header paragraph reads: "This page provides a centralized navigation index for the 72 specification files in the Cobre documentation." This count must be updated to 74.

The cross-reference index has 5 sections:

1. Spec-to-Crate Mapping Table (section 1)
2. Per-Crate Reading Lists (section 2)
3. Outgoing Cross-Reference Table (section 3)
4. Incoming Cross-Reference Table (section 4)
5. Dependency Ordering (section 5)

Sections 1, 2, 3, and 5 need updates. Section 4 (incoming references) needs updates only if existing specs reference the new documents.

The cross-reference-index pattern established in ticket-013 (from epic-03) requires: extract outgoing refs for section 3, identify existing specs gaining incoming refs for section 4, compute topological positions for section 5, assign primary crates for sections 1 and 2, and update the document count header.

## Specification

### Requirements

#### 1. Update `src/SUMMARY.md`

Add two new entries to the Specifications > Overview section, after the Production Scale Reference entry:

```markdown
- [Overview](./specs/overview.md)
  - [Design Principles](./specs/overview/design-principles.md)
  - [Notation Conventions](./specs/overview/notation-conventions.md)
  - [Production Scale Reference](./specs/overview/production-scale-reference.md)
  - [Implementation Ordering](./specs/overview/implementation-ordering.md)
  - [Spec Gap Inventory](./specs/overview/spec-gap-inventory.md)
```

Indentation must use exactly 2 spaces per level, matching the existing SUMMARY.md convention.

#### 2. Update `src/specs/cross-reference-index.md` Header

Change the document count from 72 to 74 in the opening paragraph:

- Before: "...for the 72 specification files..."
- After: "...for the 74 specification files..."

#### 3. Update Section 1: Spec-to-Crate Mapping Table

Add two new rows at the end of the Overview group (after row 3, production-scale-reference.md). The new rows are:

| #   | Spec File                                                           | Section  | Primary Crate   | Secondary Crate(s) |
| --- | ------------------------------------------------------------------- | -------- | --------------- | ------------------ |
| 73  | [implementation-ordering.md](./overview/implementation-ordering.md) | overview | (cross-cutting) | All crates         |
| 74  | [spec-gap-inventory.md](./overview/spec-gap-inventory.md)           | overview | (cross-cutting) | All crates         |

These documents are cross-cutting (like `notation-conventions.md`) because they reference all crates. The Primary Crate should be `(cross-cutting)` since they are planning documents, not owned by a single crate.

#### 4. Update Section 2: Per-Crate Reading Lists

Add both new documents to each of the 8 required crates' reading lists as `(secondary)` entries at the end. The reasoning: these documents reference every required crate and serve as implementation planning context. They should also be added to the 3 deferred crate reading lists (cobre-mcp, cobre-python, cobre-tui) as `(secondary)` because the gap inventory may mention architectural hooks relevant to those crates.

Specifically, append to each of the 11 per-crate reading lists (cobre-sddp, cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-cli, ferrompi, cobre-comm, cobre-mcp, cobre-python, cobre-tui):

```
N+1. [Implementation Ordering](./overview/implementation-ordering.md) (secondary)
N+2. [Spec Gap Inventory](./overview/spec-gap-inventory.md) (secondary)
```

where N is the current last entry number in each reading list.

#### 5. Update Section 3: Outgoing Cross-Reference Table

Add two new rows to the Overview group of the outgoing cross-reference table. The outgoing references must be extracted from the actual Cross-References sections of the two new documents (created by tickets 019 and 020). The author must:

1. Read `implementation-ordering.md`'s Cross-References section
2. Read `spec-gap-inventory.md`'s Cross-References section
3. List all referenced spec files for each document

#### 6. Update Section 4: Incoming Cross-Reference Table

For each existing spec that the two new documents reference in their Cross-References sections, add the new document as an incoming reference. This requires:

1. For each outgoing reference from `implementation-ordering.md`, find the target spec in the incoming table and add `implementation-ordering.md` to its incoming references
2. Same for `spec-gap-inventory.md`

#### 7. Update Section 5: Dependency Ordering

Add the two new documents to the dependency ordering table. Their position depends on their incoming reference count (which will be low initially -- likely 1-2, since only each other and ticket-021 reference them). They should appear near the bottom of the ordering table.

Recount the incoming references for any existing specs that gained new incoming references from the two new documents, and adjust their ordering position if the count changes their rank.

### Inputs/Props

- `src/SUMMARY.md` (current state)
- `src/specs/cross-reference-index.md` (current state)
- `src/specs/overview/implementation-ordering.md` (created by ticket-019, must exist)
- `src/specs/overview/spec-gap-inventory.md` (created by ticket-020, must exist)

### Outputs/Behavior

- Modified `src/SUMMARY.md` with 2 new entries
- Modified `src/specs/cross-reference-index.md` with updated count, 2 new mapping rows, reading list additions, outgoing/incoming reference updates, and dependency ordering updates

### Error Handling

Not applicable (documentation file, no runtime behavior).

## Acceptance Criteria

- [ ] Given the current `src/SUMMARY.md`, when the ticket is completed, then the file contains entries for `implementation-ordering.md` and `spec-gap-inventory.md` under the Overview section, after Production Scale Reference
- [ ] Given the new SUMMARY.md entries, when `mdbook build` is run, then both new documents appear in the rendered sidebar under Specifications > Overview
- [ ] Given the cross-reference-index header, when the document count is read, then it says "74 specification files" (not 72)
- [ ] Given the Spec-to-Crate Mapping Table (section 1), when the Overview group is examined, then rows 73 and 74 exist for the two new documents with Primary Crate = `(cross-cutting)` and Secondary Crate(s) = `All crates`
- [ ] Given each of the 11 per-crate reading lists (section 2), when the last entries are examined, then both new documents appear as `(secondary)` entries
- [ ] Given the Outgoing Cross-Reference Table (section 3), when the Overview group is examined, then rows for `implementation-ordering.md` and `spec-gap-inventory.md` exist and their outgoing references match the actual Cross-References sections of those files
- [ ] Given the Incoming Cross-Reference Table (section 4), when any spec referenced by the two new documents is examined, then the new documents appear in that spec's incoming reference list
- [ ] Given the Dependency Ordering table (section 5), when examined, then both new documents appear with correct incoming reference counts, and all counts for existing specs that gained new incoming references are updated
- [ ] Given the completed modifications, when the total number of specs across sections 1, 3, 4, and 5 is counted, then all sections consistently show 74 specs

## Implementation Guide

### Suggested Approach

1. Read the actual Cross-References sections of `implementation-ordering.md` and `spec-gap-inventory.md` to extract outgoing references
2. Update `src/SUMMARY.md` first (simplest change, 2 lines)
3. Update `src/specs/cross-reference-index.md` in section order:
   - Update the header paragraph (72 -> 74)
   - Add 2 rows to section 1 (Spec-to-Crate Mapping)
   - Append entries to all 11 reading lists in section 2
   - Add 2 rows to the Overview group in section 3 (Outgoing References)
   - Scan section 4 (Incoming References) and add incoming entries for each spec referenced by the new documents
   - Add 2 rows to section 5 (Dependency Ordering) and re-verify sort order
4. Verify consistency: count specs in each section, ensure all say 74

### Key Files to Modify

- `src/SUMMARY.md` -- add 2 entries to Overview section
- `src/specs/cross-reference-index.md` -- update all 5 sections

### Key Files to Read

- `src/specs/overview/implementation-ordering.md` -- read Cross-References section for outgoing refs
- `src/specs/overview/spec-gap-inventory.md` -- read Cross-References section for outgoing refs

### Patterns to Follow

- **SUMMARY.md indentation**: 2 spaces per level, matching existing entries. The Overview section is at indent level 1 (2 spaces). The sub-entries are at indent level 2 (4 spaces).
- **Cross-reference-index update pattern**: This follows the exact pattern from ticket-013 (epic-03): extract outgoing refs for section 3, identify existing specs gaining incoming refs for section 4, compute topological positions for section 5, assign primary crates for sections 1/2, update document count header.
- **Row numbering in section 1**: Sequential. The current last row is 72. New rows are 73 and 74.
- **Reading list numbering**: Each per-crate reading list has its own sequential numbering. Append at N+1 and N+2.
- **Dependency ordering sort**: By incoming reference count descending. Within the same count, by section precedence (overview < math < data-model < architecture < hpc < configuration < deferred < interfaces).

### Pitfalls to Avoid

- Do NOT use `§` or `SS` prefixes anywhere in `cross-reference-index.md`. The index uses plain section numbers.
- Do NOT forget to update the document count in the header paragraph. This is the easiest thing to miss.
- Do NOT forget to update ALL 11 per-crate reading lists in section 2. Missing a crate is a subtle error.
- Do NOT place the SUMMARY.md entries before Production Scale Reference. They logically come after the reference material as planning/assessment documents.
- Do NOT change any existing content in the cross-reference index beyond the additions. Existing rows, counts, and orderings must remain stable unless a row's incoming reference count changes.
- Do NOT assume the incoming reference count for the new documents. Count the actual outgoing references from the two new documents' Cross-References sections.

## Testing Requirements

### Unit Tests

Not applicable (documentation file).

### Integration Tests

Not applicable (documentation file).

### Verification Checks

- Run `mdbook build` and verify the new entries appear in the sidebar
- Verify document count says 74 in the header
- Verify section 1 has exactly 74 rows
- Verify every outgoing reference in section 3 for the new documents matches a valid file path
- Verify the dependency ordering in section 5 is sorted by incoming reference count descending
- Verify all 11 per-crate reading lists have the 2 new entries as secondary

## Dependencies

- **Blocked By**: ticket-019 (implementation ordering must exist), ticket-020 (spec gap inventory must exist)
- **Blocks**: None (this is the final ticket in the plan)

## Effort Estimate

**Points**: 2
**Confidence**: High (the pattern is well-established from ticket-013; the work is mechanical once the source documents exist)
