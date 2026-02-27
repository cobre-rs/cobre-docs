# ticket-006 Batch-Update Cross-Reference Index for F4 Through F8

## Context

### Background

Report-030 identified 5 cross-reference index inconsistencies (F4, F5, F6, F7, F8) in `cross-reference-index.md`. Per CLAUDE.md conventions, cross-reference index updates must be batched (never piecemeal). This ticket performs a single batch update resolving all 5 findings plus any cascading effects from ticket-005's content changes.

The findings are:

- **F4 (HIGH)**: Section 3 (outgoing refs) for `output-infrastructure.md` is missing 3 outgoing references added in Epic 07: `simulation-architecture.md`, `input-loading-pipeline.md`, `training-loop.md`
- **F5 (HIGH)**: Section 4 (incoming refs) for `simulation-architecture.md` incorrectly lists `implementation-ordering.md` (has only inline ref, not Cross-References entry) and is missing `output-infrastructure.md` (added in Epic 07)
- **F6 (HIGH)**: Section 4 (incoming refs) for `input-loading-pipeline.md` is missing `internal-structures.md` and `output-infrastructure.md`, and erroneously lists `spec-gap-inventory.md` (inline ref only)
- **F7 (LOW)**: Section 4 (incoming refs) for `output-infrastructure.md` is missing `structured-output.md` (pre-existing)
- **F8 (LOW)**: Section 3 (outgoing refs) for `simulation-architecture.md` is missing 8 outgoing references: `solver-interface-trait.md`, `communicator-trait.md`, `internal-structures.md`, `binary-formats.md`, `penalty-system.md` (plus partial deferred count) -- pre-existing

Additionally, after ticket-005 adds content changes:

- `binary-formats.md` gains a new outgoing ref to `input-loading-pipeline.md` (if added to its Cross-References section). This creates a new incoming ref for `input-loading-pipeline.md` from `binary-formats.md` that must be reflected in section 4.

### Relation to Epic

This is the second of three tickets in Epic 3 (Cross-Reference Fixes). It handles all index-level fixes. It must be done after ticket-005 (content fixes) to account for any new references those content fixes introduce.

### Current State

File: `src/specs/cross-reference-index.md`

**Section 3 (Outgoing Cross-Reference Table):**

- `output-infrastructure.md` row (line 381): Lists 13 outgoing refs; missing `simulation-architecture.md`, `input-loading-pipeline.md`, `training-loop.md`
- `simulation-architecture.md` row (line 389): Lists 10 outgoing refs; missing `solver-interface-trait.md`, `communicator-trait.md`, `internal-structures.md`, `binary-formats.md`, `penalty-system.md` (and deferred refs)

**Section 4 (Incoming Cross-Reference Table):**

- `simulation-architecture.md` row (line 502): Lists `block-formulations, hydro-production-models, deferred, implementation-ordering`; should remove `implementation-ordering.md` and add `output-infrastructure.md`
- `input-loading-pipeline.md` row (line 505): Lists `cli-and-lifecycle, validation-architecture, training-loop, scenario-generation, spec-gap-inventory`; should remove `spec-gap-inventory.md` and add `internal-structures.md`, `output-infrastructure.md`
- `output-infrastructure.md` row (line 494): Lists 5 incoming refs; missing `structured-output.md`

**Section 5 (Dependency Ordering):**

- `output-infrastructure.md` (line 615): Shows 5 incoming -- needs update to 6
- `input-loading-pipeline.md` (line 620): Shows 5 incoming -- needs update to correct count
- `simulation-architecture.md` (line 623): Shows 4 incoming -- needs update to correct count

## Specification

### Requirements

1. **Update section 3 row for `output-infrastructure.md`**: Add the 3 missing outgoing refs to the References column: `simulation-architecture.md`, `input-loading-pipeline.md`, `training-loop.md`. The row should list all outgoing refs (now 16 total).

2. **Update section 3 row for `simulation-architecture.md`**: Add the missing outgoing refs to the References column. Cross-verify against the actual Cross-References section of `simulation-architecture.md` (lines 755-774). The complete outgoing list should include all 18 entries from the file's Cross-References section: `cli-and-lifecycle`, `scenario-generation`, `training-loop`, `solver-interface-trait`, `communicator-trait`, `internal-structures`, `binary-formats`, `block-formulations`, `risk-measures`, `discount-rate`, `lp-formulation`, `penalty-system`, `output-schemas`, `output-infrastructure`, `deferred` (x4 separate references).

3. **Update section 4 row for `simulation-architecture.md`**: Remove `implementation-ordering.md` (erroneous -- only inline ref, not Cross-References entry). Add `output-infrastructure.md`. Verify remaining entries are correct.

4. **Update section 4 row for `input-loading-pipeline.md`**: Remove `spec-gap-inventory.md` (erroneous -- only inline ref). Add `internal-structures.md` and `output-infrastructure.md`. If ticket-005 added `input-loading-pipeline.md` to `binary-formats.md` Cross-References, also add `binary-formats.md` here.

5. **Update section 4 row for `output-infrastructure.md`**: Add `structured-output.md` to the incoming refs list.

6. **Update section 5 incoming counts** for all affected files to match the corrected section 4 entries.

7. **Cross-verify all changes** by reading the actual Cross-References sections of the source files and confirming the index matches.

### Inputs/Props

- Current content of `src/specs/cross-reference-index.md`
- Actual Cross-References sections of: `output-infrastructure.md`, `simulation-architecture.md`, `input-loading-pipeline.md`, `structured-output.md`, `binary-formats.md`
- Ticket-005 changes (content fixes that may add new references)

### Outputs/Behavior

- Modified `src/specs/cross-reference-index.md` with corrected sections 3, 4, and 5

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Modifying any spec files (content fixes are done in ticket-005 and ticket-007)
- Updating section 1 (Spec-to-Crate Mapping) or section 2 (Per-Crate Reading Lists) -- they are not affected by these findings
- Verifying the entire index for all 76 files (only the files identified in F4-F8 are in scope)

## Acceptance Criteria

- [ ] Given the section 3 row for `output-infrastructure.md`, when the References column is read, then it includes `simulation-architecture.md`, `input-loading-pipeline.md`, and `training-loop.md`
- [ ] Given the section 3 row for `simulation-architecture.md`, when the outgoing ref count is compared to the file's actual Cross-References section (18 entries), then the counts match
- [ ] Given the section 4 row for `simulation-architecture.md`, when read, then `implementation-ordering.md` is NOT listed and `output-infrastructure.md` IS listed
- [ ] Given the section 4 row for `input-loading-pipeline.md`, when read, then `spec-gap-inventory.md` is NOT listed and `internal-structures.md` and `output-infrastructure.md` ARE listed
- [ ] Given the section 4 row for `output-infrastructure.md`, when read, then `structured-output.md` IS listed
- [ ] Given the section 5 rows for `output-infrastructure.md`, `input-loading-pipeline.md`, and `simulation-architecture.md`, when their incoming counts are read, then they match the corrected section 4 entry counts
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings

## Implementation Guide

### Suggested Approach

1. **Preparation**: Read the actual Cross-References sections of all affected spec files to build ground truth:
   - `src/specs/data-model/output-infrastructure.md` Cross-References section
   - `src/specs/architecture/simulation-architecture.md` Cross-References section
   - `src/specs/architecture/input-loading-pipeline.md` Cross-References section
   - `src/specs/interfaces/structured-output.md` Cross-References section
   - `src/specs/data-model/binary-formats.md` Cross-References section (after ticket-005 changes)

2. **Update section 3** (outgoing refs):
   - Locate the `output-infrastructure.md` row and add the 3 missing refs
   - Locate the `simulation-architecture.md` row and add the missing refs (verify against file)

3. **Update section 4** (incoming refs):
   - For each file listed in a finding (simulation-architecture, input-loading-pipeline, output-infrastructure): scan ALL spec files' Cross-References sections to find which files reference it, then update the section 4 row to match

4. **Update section 5** (incoming counts):
   - For each affected file, count the entries in its corrected section 4 row and update the count in section 5

5. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/cross-reference-index.md` -- sections 3 (around lines 381, 389), 4 (around lines 494, 502, 505), and 5 (around lines 615, 620, 623)

### Patterns to Follow

- Section 3 format: Each row lists the spec file and a comma-separated list of all specs it references in its Cross-References section. Format: `| [spec-file.md](./path) | [ref1](./path), [ref2](./path), ... |`
- Section 4 format: Each row lists the spec file and a comma-separated list of all specs that reference it in their Cross-References sections. Same link format.
- Section 5 format: `| rank | [spec-file.md](./path) | section | count incoming |`

### Pitfalls to Avoid

- Do NOT make piecemeal updates -- all changes must be in a single edit pass per CLAUDE.md convention ("cross-reference index updates must be batched")
- Do NOT count inline references as Cross-References entries. Only entries in a file's `## Cross-References` section count for the index. This is why `implementation-ordering.md` and `spec-gap-inventory.md` are being removed from section 4 entries -- they reference files inline but not in their formal Cross-References sections.
- Be careful to distinguish incoming (section 4) from outgoing (section 3). Outgoing = "this file references X in its Cross-References section." Incoming = "file X references this file in X's Cross-References section."
- The `deferred.md` file is referenced multiple times from `simulation-architecture.md` (SSC.1, SSC.6, SSC.9, SSC.13) but counts as one outgoing reference in section 3

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- For each corrected section 3 row, verify the outgoing ref list matches the actual Cross-References section of the source file
- For each corrected section 4 row, verify by grepping all spec files for the target filename in Cross-References sections

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: ticket-005 (content fixes may add new outgoing refs that need to be in the index)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: Medium (cross-reference index batch updates require careful verification; the actual file scanning is tedious but well-defined)
