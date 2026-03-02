# ticket-014 Update CLAUDE.md with Decision Log Convention

## Context

### Background

The Decision Log (`src/specs/overview/decision-log.md`) and inline decision markers (standardized blockquote format in primary spec sections) were established in tickets 012 and 013. For these conventions to persist across future spec authoring sessions, they must be codified in `CLAUDE.md` -- the file that Claude Code loads automatically when working in this repository. Without this codification, future sessions would not know to update the Decision Log when adding or changing cross-cutting decisions, and would not use the standardized marker format.

### Relation to Epic

This is the final ticket of Epic 03. It depends on both ticket-012 (Decision Log exists) and ticket-013 (inline marker format is established). After this ticket, the complete prevention mechanism is in place: central registry + inline markers + codified convention. No downstream tickets depend on this one within Epic 03; however, the convention will be referenced by all future spec work.

### Current State

- `CLAUDE.md` has the following top-level sections (in order):
  1. Project Overview
  2. Structural Patterns: Trait Specs
  3. Structural Patterns: Testing Specs
  4. Structural Patterns: Overview and Planning Specs
  5. Dispatch Architecture
  6. Invariants and Contracts
  7. Performance Guidance
  8. § Convention Enforcement
  9. Cross-Reference Index Methodology
  10. GIL Contract and Free-Threaded Python
  11. Implementation Readiness State (as of Epic 05)
  12. Do NOT
- No mention of the Decision Log or inline decision markers exists in `CLAUDE.md`.
- The Decision Log file and inline markers exist in the spec corpus (from tickets 012-013).

## Specification

### Requirements

1. Add a new section `## Decision Log Convention` to `CLAUDE.md`, placed after "Cross-Reference Index Methodology" (section 9) and before "GIL Contract and Free-Threaded Python" (section 10).
2. The section must document:
   - What the Decision Log is and where it lives (`src/specs/overview/decision-log.md`)
   - The `DEC-NNN` identifier format
   - When a new decision must be added (threshold: affects 2+ spec files)
   - The inline marker format for primary spec sections (verbatim template)
   - The propagation verification process (checking all affected files when a decision changes)
   - The table columns used in the Decision Log registry
3. Add one entry to the existing "Do NOT" section at the end of `CLAUDE.md`:
   - `- Change a cross-cutting decision in a spec file without updating the Decision Log and all affected files listed there.`
4. The section must include the verbatim marker template so future sessions can reproduce it exactly (same pattern as the convention blockquote in the "Structural Patterns: Trait Specs" section).

### Inputs/Props

- The completed Decision Log at `src/specs/overview/decision-log.md` (for referencing the exact format).
- The inline marker format established in ticket-013:
  ```markdown
  > **Decision [DEC-NNN](../overview/decision-log.md#dec-nnn) (active):** [One-sentence summary].
  ```

### Outputs/Behavior

- `CLAUDE.md` contains a new `## Decision Log Convention` section with all required content.
- The "Do NOT" section contains the new entry about cross-cutting decision changes.
- No other sections of `CLAUDE.md` are modified.

### Error Handling

- If the placement between "Cross-Reference Index Methodology" and "GIL Contract" would break the `---` horizontal rule pattern used to separate sections, maintain the existing formatting pattern (each section separated by `---`).

## Acceptance Criteria

- [ ] Given `CLAUDE.md` is read, when `grep "## Decision Log Convention" CLAUDE.md` is run from the repo root, then exactly one line matches.
- [ ] Given the Decision Log Convention section exists, when its content is read, then it contains the verbatim inline marker template string `> **Decision [DEC-NNN]` as a code block or example.
- [ ] Given the Decision Log Convention section exists, when its content is read, then it specifies the cross-cutting threshold as "2+ spec files" or equivalent wording.
- [ ] Given the "Do NOT" section of `CLAUDE.md`, when `grep "Decision Log" CLAUDE.md` is run, then at least 2 lines match (one in the convention section, one in the "Do NOT" section).
- [ ] Given the full `CLAUDE.md`, when the section order is inspected, then "Decision Log Convention" appears after "Cross-Reference Index Methodology" and before "GIL Contract and Free-Threaded Python".

## Implementation Guide

### Suggested Approach

1. Read `CLAUDE.md` to confirm the current section order and the `---` separator pattern.
2. Locate the `---` separator between "Cross-Reference Index Methodology" and "GIL Contract and Free-Threaded Python".
3. Insert the new section before that separator, following the existing formatting pattern:

   ```markdown
   ---

   ## Decision Log Convention

   [content]
   ```

4. Write the section content with these subsections (using prose paragraphs and bullet lists, matching the style of other CLAUDE.md sections):
   - Opening paragraph: what the Decision Log is and its file path
   - `DEC-NNN` format and cross-cutting threshold
   - Inline marker template (in a fenced code block)
   - When to add a new entry (new cross-cutting decision), when to update (decision changes), propagation verification steps
5. Add the "Do NOT" entry at the end of the existing "Do NOT" bullet list.
6. Verify the file renders correctly (no broken markdown).

### Key Files to Modify

- `CLAUDE.md` (root of repo)

### Patterns to Follow

- Match the documentation density and style of existing `CLAUDE.md` sections. For example, "§ Convention Enforcement" is concise (2 numbered items + 1 paragraph), while "Structural Patterns: Trait Specs" is detailed (multiple subsections with rules). The Decision Log Convention should be moderate: one opening paragraph + bullet list of rules + one code block template + one paragraph on propagation.
- Use `---` horizontal rules to separate major sections, consistent with the existing file structure.
- Include the verbatim marker template in a fenced code block (same approach used for the convention blockquote text in the "Structural Patterns: Trait Specs" section).

### Pitfalls to Avoid

- Do not modify any existing section of `CLAUDE.md` beyond adding the new "Do NOT" entry. The rest of the file must remain unchanged.
- Do not place the new section at the end of the file -- it must go between "Cross-Reference Index Methodology" and "GIL Contract" to maintain topical grouping (spec structure conventions together).
- Do not make the convention overly prescriptive about decision categorization -- the Decision Log uses a flat table, not categories.
- Do not forget to include the propagation verification process (the whole point of the convention is preventing missed propagation).

## Testing Requirements

### Unit Tests

Not applicable (documentation-only change).

### Integration Tests

Not applicable (`CLAUDE.md` is not processed by mdBook).

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-012 (Decision Log must exist so the convention can reference it), ticket-013 (inline markers must be established so the convention can describe them)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
