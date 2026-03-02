# ticket-013 Add Inline Decision Markers to Primary Spec Sections

## Context

### Background

The Decision Log created in ticket-012 provides a central registry of cross-cutting decisions with their affected files. However, the log alone is one-directional: a reader of the Decision Log can find all affected files, but a reader of a spec file has no indication that a section contains an authoritative decision record or where the full propagation list can be found. Inline decision markers create the reverse link, making the relationship bidirectional. When a spec author edits a section that owns a decision, the marker immediately reminds them to check the Decision Log for the full list of affected files that may need corresponding updates.

### Relation to Epic

This is the second ticket of Epic 03. It depends on ticket-012 (the Decision Log must exist so that markers can link to specific `#dec-nnn` anchors). It blocks ticket-014 (CLAUDE.md convention) because the convention must describe the marker format, which is established by this ticket. Together, the Decision Log + inline markers + CLAUDE.md convention form the complete prevention mechanism.

### Current State

- `src/specs/overview/decision-log.md` exists (created in ticket-012) with `DEC-NNN` entries.
- Primary spec sections use ad-hoc decision documentation formats:
  - `binary-formats.md` line 63: `> **Decision Date**: 2026-01-19`
  - `binary-formats.md` line 119: `> **Decision (2026-02-16)**: Option A (full rebuild per stage) was originally adopted...`
  - `solver-abstraction.md` line 323: `> **Stakeholder decision:** The minimal viable solver delegates LP scaling...`
  - `solver-abstraction.md` line 441: `**Stakeholder Decision: Selective addition is the adopted baseline...**`
  - `solver-abstraction.md` line 621: `> The StageLpCache replaces the previous per-thread memory model... See the Decision Log for details.`
  - `shared-memory-aggregation.md` line 103: `> **Design decision**: Two-level aggregation is an optimization...`
  - `solver-workspaces.md` line 202: `> **Scaling strategy resolved**: The minimal viable solver delegates LP scaling...`
- No standardized marker format exists across the corpus.

## Specification

### Requirements

1. Define a standardized inline decision marker format: a markdown blockquote that identifies the decision by its `DEC-NNN` ID, states its status, gives a one-sentence summary, and links to the Decision Log entry.
2. Add markers to every **primary spec section** that owns a cross-cutting decision cataloged in the Decision Log.
3. Markers are added only at the **primary source** (the owning section), not at every affected file. Affected files continue to reference the primary section via normal cross-references.
4. Where an existing ad-hoc decision blockquote exists at the primary source, replace it with the standardized marker format. Preserve any historical context or superseded notes as a sub-paragraph within the blockquote.
5. The marker format is:
   ```markdown
   > **Decision [DEC-NNN](../overview/decision-log.md#dec-nnn) (active):** [One-sentence summary].
   ```
   For superseded decisions, replace `active` with `superseded by [DEC-XXX](../overview/decision-log.md#dec-xxx)`.
6. Verify `mdbook build` succeeds after all changes.

### Inputs/Props

- The Decision Log file (`src/specs/overview/decision-log.md`) with the complete list of `DEC-NNN` entries and their primary spec sections.
- The primary spec files to modify are determined by the "Primary Spec Section" column in the Decision Log. Based on the ticket-012 catalog, the estimated list is:
  - `src/specs/architecture/solver-abstraction.md` (DEC-001, DEC-005, DEC-007, DEC-008, DEC-015)
  - `src/specs/data-model/binary-formats.md` (DEC-002, DEC-003, DEC-004)
  - `src/specs/architecture/solver-interface-trait.md` (DEC-006)
  - `src/specs/overview/production-scale-reference.md` (DEC-009)
  - `src/specs/hpc/memory-architecture.md` (DEC-010, DEC-011)
  - `src/specs/interfaces/python-bindings.md` (DEC-012)
  - `src/specs/overview/design-principles.md` (DEC-013, DEC-014)

### Outputs/Behavior

- Each primary spec section that owns a cross-cutting decision has exactly one standardized decision marker blockquote.
- Existing ad-hoc decision blockquotes at primary sources are replaced with the standardized format.
- All `[DEC-NNN]` links in markers resolve to valid anchors in the Decision Log file.

### Error Handling

- If a primary spec section already has a multi-paragraph decision blockquote with historical context (e.g., `binary-formats.md` SS3 with the superseded note), preserve the historical context as additional lines within the blockquote, after the standardized first line.
- If `mdbook build` fails due to a broken link, verify the anchor format matches between the marker (`#dec-nnn`) and the Decision Log heading or anchor.

## Acceptance Criteria

- [ ] Given the Decision Log contains N entries with `DEC-NNN` IDs, when `grep -r "Decision DEC-" src/specs/` is run (excluding `overview/decision-log.md`), then the count of matching files equals the number of distinct primary spec files in the Decision Log (estimated 7 files).
- [ ] Given a primary spec section for DEC-001 in `solver-abstraction.md`, when the file is read, then the section contains a blockquote matching `> **Decision [DEC-001]` with a link to `decision-log.md#dec-001` and the status `(active)`.
- [ ] Given `binary-formats.md` contains DEC-002 and DEC-003, when `grep -c "Decision \[DEC-" src/specs/data-model/binary-formats.md` is run, then the count matches the number of decisions owned by that file (at least 2).
- [ ] Given all markers are in place, when `mdbook build` is run from the repo root, then the build succeeds with exit code 0.
- [ ] Given the existing ad-hoc decision blockquote at `solver-abstraction.md` line 323 (`> **Stakeholder decision:**`), when the file is read after implementation, then the blockquote uses the standardized `> **Decision [DEC-NNN](...) (active):**` format instead.

## Implementation Guide

### Suggested Approach

1. Read the completed Decision Log (`src/specs/overview/decision-log.md`) to get the full list of `DEC-NNN` entries and their primary spec sections.
2. For each decision, navigate to the primary spec section:
   - If an ad-hoc decision blockquote exists, replace its opening line with the standardized marker format. Preserve any historical context, superseded notes, or rationale as continuation lines within the same blockquote.
   - If no blockquote exists (the decision is documented in plain prose), add the marker blockquote immediately before or after the decision prose, choosing whichever position reads more naturally.
3. Adjust the relative link path based on the file's directory:
   - Files in `src/specs/architecture/`: use `../overview/decision-log.md#dec-nnn`
   - Files in `src/specs/overview/`: use `./decision-log.md#dec-nnn`
   - Files in `src/specs/data-model/`: use `../overview/decision-log.md#dec-nnn`
   - Files in `src/specs/hpc/`: use `../overview/decision-log.md#dec-nnn`
   - Files in `src/specs/interfaces/`: use `../overview/decision-log.md#dec-nnn`
4. For `solver-abstraction.md` line 621 which already says "See the Decision Log for details", update it to use the standardized marker format with a proper link.
5. Run `mdbook build` and verify success.

### Key Files to Modify

- `src/specs/architecture/solver-abstraction.md` (up to 5 markers)
- `src/specs/data-model/binary-formats.md` (up to 3 markers)
- `src/specs/architecture/solver-interface-trait.md` (1 marker)
- `src/specs/overview/production-scale-reference.md` (1 marker)
- `src/specs/hpc/memory-architecture.md` (up to 2 markers)
- `src/specs/interfaces/python-bindings.md` (1 marker)
- `src/specs/overview/design-principles.md` (up to 2 markers)

### Patterns to Follow

- The marker is always a blockquote (`> `) with bold decision ID and status on the first line.
- The link text is the `DEC-NNN` ID itself: `[DEC-NNN](path/to/decision-log.md#dec-nnn)`.
- Status is always in parentheses after the link: `(active)` or `(superseded by [DEC-XXX](...))`.
- The one-sentence summary after the colon should match or closely paraphrase the Decision Summary column in the Decision Log.
- In architecture files, use `SS` prefix for section references. In HPC files, use `§`. In overview files, use plain numbers. This applies to any section references within the marker text, not to the DEC-NNN ID itself.

### Pitfalls to Avoid

- Do not add markers to every file that references a decision -- only the primary (owning) section gets a marker.
- Do not delete existing historical context from decision blockquotes when replacing the opening format. The superseded note in `binary-formats.md` line 121 must be preserved.
- Do not use the `§` prefix when referencing architecture sections from within the marker text (use `SS`). The `§` prefix is reserved for HPC section links.
- Do not change the prose content of the spec sections beyond the decision marker itself. This ticket modifies marker formatting only.
- Do not forget to update the forward reference at `solver-abstraction.md` line 621 which currently says "See the Decision Log for details" -- it needs the standardized link format.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only change).

### Integration Tests

- `mdbook build` from repo root must succeed with exit code 0.
- Grep-based verification that each primary spec file contains the expected number of `Decision [DEC-` markers.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-012 (Decision Log must exist before markers can reference it)
- **Blocks**: ticket-014 (CLAUDE.md convention describes the marker format established here), ticket-017 (final verification checks for marker consistency)

## Effort Estimate

**Points**: 2
**Confidence**: High
