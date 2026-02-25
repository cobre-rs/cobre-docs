# ticket-005 Apply Fixes for Epic 01 Findings

## Context

### Background

Tickets 001-004 produced findings reports documenting all notation inconsistencies, parameter value mismatches, and behavioral description contradictions found across the Cobre specification corpus. This ticket applies the fixes for all issues identified in those reports.

### Relation to Epic

This is the final ticket in Epic 01. It depends on all four audit tickets being complete so the full scope of needed changes is known before any edits begin. Batching fixes into a single ticket prevents partial fixes that might introduce new inconsistencies.

### Current State

The findings reports are located at:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-001.md`
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-002.md`
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-003.md`
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-004.md`

## Specification

### Requirements

1. Read all four findings reports to build a consolidated list of required changes
2. For each finding classified as INCONSISTENT, SYMBOL CONFLICT, BETA-TO-PI MIGRATION INCOMPLETE, or CONTRADICTION:
   - Determine the correct value (the one in notation-conventions.md or production-scale-reference.md takes priority)
   - Apply the fix to the affected spec file
3. For each finding classified as MISSING DEFINITION:
   - Evaluate whether the symbol should be added to notation-conventions.md or whether it is correctly a local definition
   - If it should be added, add it to the appropriate section
4. For each finding classified as MISSING BACK-REFERENCE:
   - Add the missing cross-reference to the spec's Cross-References section
5. After all fixes, run `mdbook build` to verify no broken links or rendering issues
6. Do NOT change forward pass count from 200 to 192 in this ticket (that is deferred to Epic 03)

### Inputs/Props

**Findings reports** (read first):

- `findings-001.md` through `findings-004.md` in the epic-01 directory

**Files potentially modified** (paths relative to `/home/rogerio/git/cobre-docs/src/`):

- Any of the 50 specs under `specs/`
- `specs/overview/notation-conventions.md` (if symbols need to be added)
- `reference/bibliography.md` is NOT modified in this ticket (that is Epic 02)

### Outputs/Behavior

- All inconsistencies from findings reports are resolved
- `mdbook build` completes without errors
- A summary of changes is produced listing each file modified and what was changed

### Error Handling

- If a finding is ambiguous (the "correct" value is unclear), do NOT guess. Flag it as NEEDS REVIEW in the change summary and do not modify the file
- If a fix in one spec would cascade to require changes in other specs, apply all cascading changes together
- If `mdbook build` fails after applying fixes, investigate and fix the build issue before completing the ticket

## Acceptance Criteria

- [ ] Given the findings reports from tickets 001-004, when all INCONSISTENT/CONFLICT/CONTRADICTION findings are processed, then each one is either fixed or flagged as NEEDS REVIEW with justification
- [ ] Given fixes are applied to spec files, when `mdbook build` is run from `/home/rogerio/git/cobre-docs/`, then it exits with code 0
- [ ] Given a change summary is produced, when it is reviewed, then each change references the original finding (ticket number and finding ID)
- [ ] Given the forward pass count of 200 appears in specs, when this ticket is complete, then 200 is NOT changed to 192 (deferred to Epic 03)

## Implementation Guide

### Suggested Approach

1. Read all four findings reports and build a consolidated change list sorted by file path
2. Group changes by file to minimize the number of file edits
3. For each file with changes:
   a. Read the current file content
   b. Apply all changes for that file
   c. Write the updated file
4. After all files are updated, run `mdbook build` from the repository root
5. Produce the change summary

### Key Files to Modify

Depends entirely on findings from tickets 001-004. Likely candidates:

- `specs/math/hydro-production-models.md` (if $\pi_h^{balance}$ vs $\pi^{wb}_h$ inconsistency confirmed)
- `specs/math/par-inflow-model.md` (if $\varepsilon_t$ vs $\eta_t$ inconsistency confirmed)
- Various specs (if any remaining beta notation found)
- Various specs (if cross-reference back-links missing)

### Patterns to Follow

- When fixing a symbol, change the non-canonical usage to match notation-conventions.md (not the other way around)
- When adding a cross-reference, follow the existing format in the target spec's Cross-References section
- When adding a symbol to notation-conventions.md, place it in the correct section and follow the existing table format

### Pitfalls to Avoid

- Do not change notation-conventions.md to match a spec -- notation-conventions is the source of truth
- Do not rename symbols that are intentionally local to a spec (local derivation variables, intermediate results)
- Do not change 200 to 192 for forward passes -- that change belongs to Epic 03 which updates production-scale-reference comprehensively

## Testing Requirements

### Unit Tests

N/A (documentation changes)

### Integration Tests

- `mdbook build` must pass from `/home/rogerio/git/cobre-docs/`

### E2E Tests

N/A

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-003, ticket-004
- **Blocks**: None (Epic 02 can start independently)

## Effort Estimate

**Points**: 2
**Confidence**: Medium (depends on volume of findings from tickets 001-004)
