# ticket-012 Create Central Decision Log

## Context

### Background

The Cobre spec corpus contains approximately 15-20 cross-cutting architectural decisions that are documented in their primary spec sections but propagated (often inconsistently) across multiple files. The spec-clarity-audit plan (Epics 01-02) cleaned up contradictions caused by the StageLpCache adoption and stale production-scale values, but no central registry of decisions exists to prevent future inconsistencies. When a decision changes (as the StageLpCache adoption did), every affected file must be updated -- and without a central list of affected files, some are invariably missed.

### Relation to Epic

This is the foundational ticket of Epic 03 (Decision Log and Prevention). It creates the Decision Log file that ticket-013 (inline markers) will reference and that ticket-014 (CLAUDE.md convention) will codify. The Decision Log must exist and be populated before either downstream ticket can proceed.

### Current State

- No `src/specs/overview/decision-log.md` file exists.
- Cross-cutting decisions are documented inline within their primary spec sections using ad-hoc formats: `> **Decision (2026-02-16)**:` in `binary-formats.md`, `> **Stakeholder decision:**` in `solver-abstraction.md`, `> **Design decision**:` in `shared-memory-aggregation.md`, and unformatted prose elsewhere.
- One forward reference to the Decision Log already exists: `solver-abstraction.md` line 621 says "See the Decision Log for details" (added during Epic 02 cleanup).
- `src/SUMMARY.md` lists 8 overview specs under the "Specifications > Overview" section.
- `src/specs/overview.md` has a "Reading Order", "Spec Index", and "Navigation" structure.

## Specification

### Requirements

1. Create `src/specs/overview/decision-log.md` containing all cross-cutting architectural decisions currently documented across the spec corpus.
2. Use plain numbered sections (`## 1.`, `## 2.`, etc.) per the overview spec convention -- never `SS` or `§`.
3. Organize decisions into a single flat table (not per-category tables) with columns: ID, Date, Status, Decision Summary, Primary Spec Section, Affected Files.
4. Assign each decision a stable identifier using the format `DEC-NNN` (e.g., `DEC-001`).
5. Include only **cross-cutting** decisions (affecting 2+ spec files). Spec-local decisions stay in their owning file only.
6. Add the file to `src/SUMMARY.md` under "Specifications > Overview", after "Spec Gap Inventory" and before "Ecosystem Vision".
7. Add the file to `src/specs/overview.md` in the Spec Index table.
8. Verify `mdbook build` succeeds after all changes.

### Inputs/Props

The following cross-cutting decisions must be cataloged (extracted from corpus grep analysis). This is the minimum set; the implementer should verify completeness by grepping for `Decision`, `adopted`, `baseline`, and `Stakeholder` blockquotes:

| ID      | Decision                                                 | Primary Spec Section                                     |
| ------- | -------------------------------------------------------- | -------------------------------------------------------- |
| DEC-001 | StageLpCache as LP construction baseline                 | `solver-abstraction.md` SS11.4                           |
| DEC-002 | `postcard` for MPI broadcast serialization               | `binary-formats.md` SS2                                  |
| DEC-003 | FlatBuffers for policy persistence                       | `binary-formats.md` SS3                                  |
| DEC-004 | Parquet for tabular input data                           | `binary-formats.md` SS1 / `input-directory-structure.md` |
| DEC-005 | Compile-time solver selection via Cargo feature flags    | `solver-abstraction.md` SS10                             |
| DEC-006 | `Box<dyn Trait>` rejected; enum dispatch for closed sets | `solver-interface-trait.md` SS5                          |
| DEC-007 | Selective cut addition as cut loading baseline           | `solver-abstraction.md` SS5                              |
| DEC-008 | LP scaling delegated to solver backend                   | `solver-abstraction.md` SS3                              |
| DEC-009 | 60 stages as production-scale reference baseline         | `production-scale-reference.md`                          |
| DEC-010 | NUMA-interleaved allocation for SharedRegion             | `memory-architecture.md` SS3.6                           |
| DEC-011 | One MPI rank per NUMA domain deployment model            | `memory-architecture.md` SS3 / `hybrid-parallelism.md`   |
| DEC-012 | GIL contract / MPI prohibition (3 independent reasons)   | `python-bindings.md` SS7                                 |
| DEC-013 | C API only for solver portability                        | `design-principles.md` SS5.3                             |
| DEC-014 | Enlarged `unsafe` boundary for performance-critical ops  | `design-principles.md` SS5.5                             |
| DEC-015 | `SolverError` hard-stop vs proceed-with-partial mapping  | `solver-abstraction.md` SS6                              |

### Outputs/Behavior

- A new file `src/specs/overview/decision-log.md` with:
  - Title: `# Decision Log`
  - Section `## 1. Purpose` explaining what the log is and when to update it
  - Section `## 2. Decision Registry` containing the flat table
  - Section `## 3. How to Use This Log` with brief instructions for adding new decisions and verifying propagation
- Updated `src/SUMMARY.md` with a new entry
- Updated `src/specs/overview.md` with a new row in the Spec Index table

### Error Handling

- If `mdbook build` fails after changes, fix the SUMMARY.md entry path or internal link before proceeding.
- If a decision's primary spec section cannot be identified (multiple candidates), choose the section with the most detailed treatment and note the secondary source in the Affected Files column.

## Acceptance Criteria

- [ ] Given the file `src/specs/overview/decision-log.md` does not exist, when the ticket is implemented, then the file exists and contains at least 15 `DEC-NNN` entries in a markdown table with columns ID, Date, Status, Decision Summary, Primary Spec Section, and Affected Files.
- [ ] Given the Decision Log file exists, when `grep -c "^| DEC-" src/specs/overview/decision-log.md` is run, then the count is >= 15.
- [ ] Given the SUMMARY.md file, when `grep "decision-log" src/SUMMARY.md` is run, then exactly one line matches containing `[Decision Log](./specs/overview/decision-log.md)`.
- [ ] Given the overview.md file, when `grep "decision-log" src/specs/overview.md` is run, then exactly one line matches in the Spec Index table.
- [ ] Given all changes are in place, when `mdbook build` is run from the repo root, then the build succeeds with exit code 0.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/decision-log.md` does not exist -- confirm with `ls src/specs/overview/`.
2. Create `src/specs/overview/decision-log.md` with the structure defined in Outputs/Behavior.
3. Extract each decision from its primary spec section:
   - For each DEC-NNN in the Inputs table, read the primary spec section.
   - Record the decision date (from existing blockquotes where available; use `2026-02-28` for decisions documented during spec-readiness; use `2026-01-19` for decisions present in the original corpus).
   - Set Status to `active` for all current decisions. Set `superseded` only for decisions explicitly marked as superseded (e.g., the original Option A adoption in `binary-formats.md` is superseded by DEC-001).
   - List all files that reference or are affected by each decision in the Affected Files column.
4. Use the overview convention: plain numbered sections, no `SS` or `§` prefixes.
5. Add the SUMMARY.md entry after "Spec Gap Inventory":
   ```
     - [Decision Log](./specs/overview/decision-log.md)
   ```
6. Add a row to the `src/specs/overview.md` Spec Index table.
7. Run `mdbook build` and verify success.

### Key Files to Modify

- `src/specs/overview/decision-log.md` (new file)
- `src/SUMMARY.md` (add one line)
- `src/specs/overview.md` (add one table row)

### Patterns to Follow

- Use the same plain-numbered-section structure as `src/specs/overview/implementation-ordering.md` and `src/specs/overview/spec-gap-inventory.md`.
- Use standard markdown table syntax with `|` delimiters.
- Link to primary spec sections using relative paths from the `overview/` directory (e.g., `[SS11.4](../architecture/solver-abstraction.md)`).
- Reference the StageLpCache naturally by its architectural name, not as "Strategy 2+3" (the comparison-era label is no longer appropriate in new content).

### Pitfalls to Avoid

- Do not use `SS` or `§` prefixes in the Decision Log section headings -- it is an overview spec and must use plain numbered sections.
- Do not catalog spec-local decisions (decisions that affect only one file). The threshold is 2+ affected files.
- Do not create per-category sub-tables -- use a single flat registry table for simplicity and grepability.
- Do not add the SUMMARY.md entry at the wrong indentation level -- it must be indented with 2 spaces to appear as a child of "Overview".
- Do not reference "Option A" or "Strategy 2+3" as current labels in new content -- use "StageLpCache" and "cut in-memory management strategy" instead.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only change).

### Integration Tests

- `mdbook build` from repo root must succeed with exit code 0.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 through ticket-011 (all cleanup must be complete before cataloging decisions, to avoid cataloging stale state)
- **Blocks**: ticket-013 (inline decision markers reference the Decision Log), ticket-015 (cross-reference index update)

## Effort Estimate

**Points**: 3
**Confidence**: High
