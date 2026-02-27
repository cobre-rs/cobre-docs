# ticket-001 Remove Inline GAP Markers from Spec Prose

## Context

### Background

The Cobre spec corpus uses a gap inventory (`src/specs/overview/spec-gap-inventory.md`) to track specification gaps. As gaps are resolved, their resolutions are incorporated into the relevant spec files. However, the inline `GAP-XXX` references in the spec prose -- originally inserted to flag pending decisions -- remain after resolution. These stale markers create confusion for developers who encounter "Design note (GAP-032)" or "Stakeholder decision (GAP-010)" and may mistakenly think the decision is still pending.

### Relation to Epic

This is the first ticket in Epic 01 (GAP Marker Cleanup). It handles the 4 spec files that contain resolved-gap inline markers (GAP-010, GAP-032, GAP-033, GAP-039). The companion ticket-002 handles the separate `ecosystem-guidelines.md` blocker table.

### Current State

Four spec files contain inline `GAP-XXX` references:

1. **`src/specs/architecture/training-loop.md` line 69**: `> **Design note (GAP-032).** The event channel uses std::sync::mpsc...` -- The design decision content (use `std::sync::mpsc`, unbounded channel) is already fully specified inline. Only the `(GAP-032)` label is stale.

2. **`src/specs/hpc/communicator-trait.md` line 640**: `### 4.7 Minimal Viable Simplification (GAP-033)` -- The section heading includes a parenthetical gap reference. The section content fully documents the minimal viable simplification decision.

3. **`src/specs/architecture/solver-abstraction.md` line 318**: `> **Stakeholder decision (GAP-010)**: The minimal viable solver delegates LP scaling...` -- The decision content is fully inline. Only the `(GAP-010)` label is stale.

4. **`src/specs/architecture/scenario-generation.md` line 133**: `...This property is what makes the previously identified GAP-039 ("scenario innovation noise broadcast format") a false gap...` -- The architectural note explains that GAP-039 was a false alarm. The explanation is valuable but the GAP-039 reference is stale.

## Specification

### Requirements

1. Remove the `(GAP-032)` label from the design note blockquote in `training-loop.md` while preserving all decision content.
2. Remove the `(GAP-033)` parenthetical from the section heading in `communicator-trait.md` while preserving the section title and all content.
3. Remove the `(GAP-010)` label from the stakeholder decision blockquote in `solver-abstraction.md` while preserving all decision content.
4. Remove the GAP-039 reference from the architectural note in `scenario-generation.md` while preserving the architectural insight about seed-based architecture.

### Inputs/Props

- 4 markdown files with specific line-level locations identified above.

### Outputs/Behavior

- Each file retains all technical content.
- No `GAP-0XX` strings appear in these 4 files after the edit.
- Blockquote formatting and section structure remain intact.

### Error Handling

- Not applicable (markdown text edits).

### Out of Scope

- `src/specs/overview/ecosystem-guidelines.md` -- handled by ticket-002.
- `src/specs/overview/spec-gap-inventory.md` -- preserved as audit trail, never modified.
- Any changes to technical content, section numbering, or cross-references.

## Acceptance Criteria

- [ ] Given `src/specs/architecture/training-loop.md`, when searching for `GAP-`, then zero matches are found.
- [ ] Given `src/specs/architecture/training-loop.md` line 69, when reading the blockquote, then it begins with `> **Design note.**` (no GAP-032 label) and all subsequent content is unchanged.
- [ ] Given `src/specs/hpc/communicator-trait.md`, when searching for `GAP-`, then zero matches are found.
- [ ] Given `src/specs/hpc/communicator-trait.md` line 640, when reading the section heading, then it reads `### 4.7 Minimal Viable Simplification` (no parenthetical).
- [ ] Given `src/specs/architecture/solver-abstraction.md`, when searching for `GAP-`, then zero matches are found.
- [ ] Given `src/specs/architecture/scenario-generation.md`, when searching for `GAP-`, then zero matches are found.
- [ ] Given the command `mdbook build`, when executed from the repo root, then the build succeeds with no new warnings.

## Implementation Guide

### Suggested Approach

1. Edit `src/specs/architecture/training-loop.md` line 69: Change `**Design note (GAP-032).**` to `**Design note.**`.
2. Edit `src/specs/hpc/communicator-trait.md` line 640: Change `### 4.7 Minimal Viable Simplification (GAP-033)` to `### 4.7 Minimal Viable Simplification`.
3. Edit `src/specs/architecture/solver-abstraction.md` line 318: Change `**Stakeholder decision (GAP-010)**:` to `**Stakeholder decision:**`.
4. Edit `src/specs/architecture/scenario-generation.md` line 133: Rewrite the sentence to remove the GAP-039 reference while preserving the architectural insight. For example, change `This property is what makes the previously identified GAP-039 ("scenario innovation noise broadcast format") a false gap — the seed-based architecture already resolves the distribution problem.` to `This property eliminates the need for a dedicated scenario innovation noise broadcast format — the seed-based architecture already resolves the distribution problem.`
5. Run `grep -rn "GAP-" src/specs/ --include="*.md" | grep -v spec-gap-inventory.md | grep -v ecosystem-guidelines.md` to verify zero matches from these 4 files.
6. Run `mdbook build` to verify no new warnings.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` (line 69)
- `src/specs/hpc/communicator-trait.md` (line 640)
- `src/specs/architecture/solver-abstraction.md` (line 318)
- `src/specs/architecture/scenario-generation.md` (line 133)

### Patterns to Follow

- Preserve all blockquote formatting (`>` prefix, bold opener, content).
- Preserve all section heading levels (`###`).
- Preserve all technical decision content verbatim -- only the gap tracker labels are removed.

### Pitfalls to Avoid

- Do not modify `spec-gap-inventory.md` -- it is the audit trail.
- Do not remove the design note blockquote content itself -- only the `(GAP-XXX)` label.
- Do not change section numbering (e.g., `4.7` stays `4.7`).
- Do not add new content or rewrite existing prose beyond the GAP reference removal.

## Testing Requirements

### Unit Tests

Not applicable (markdown edits).

### Integration Tests

- Run `grep -rn "GAP-" src/specs/architecture/training-loop.md src/specs/hpc/communicator-trait.md src/specs/architecture/solver-abstraction.md src/specs/architecture/scenario-generation.md` and verify zero matches.
- Run `mdbook build` and verify success with no new warnings.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-002-update-ecosystem-guidelines-blocker-table.md (logically related but not strictly blocking)

## Effort Estimate

**Points**: 1
**Confidence**: High
