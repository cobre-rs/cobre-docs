# ticket-030 Verify Cross-Reference Integrity After All Edits

## Context

### Background

Epics 05-07 modified approximately 20 spec files across the corpus: adding entity struct definitions (internal-structures.md SS1-SS12), validation checklists (input-loading-pipeline.md SS2.6), OpeningTree type (scenario-generation.md), renaming methods (split_shared_memory -> split_shared, ferrompi::slurm -> cobre_comm::slurm), replacing serialization format (rkyv -> postcard in input-loading-pipeline.md SS6), adding simulation result types (simulation-architecture.md SS3.4), and adding output writer API (output-infrastructure.md SS6). The cross-reference index was batch-updated in ticket-026 (Epic 06). Any of these edits could have introduced broken links, stale section references, or missing cross-references between the new and existing sections.

### Relation to Epic

This is the first of two tickets in Epic 08 (Final Verification). It performs a mechanistic and targeted manual verification of cross-reference integrity across the spec corpus after all editing epics. Its findings feed directly into ticket-031, which produces the final readiness verdict. If this ticket discovers broken links or stale references, those become new conditions that ticket-031 must assess.

### Current State

The spec corpus contains 76 files. The cross-reference index (cross-reference-index.md) was last batch-updated in Epic 06 (ticket-026) to add backend-testing.md and ecosystem-guidelines.md. Since then, Epic 07 added significant new content to simulation-architecture.md (SS3.4, ~500 lines) and output-infrastructure.md (SS6, ~470 lines), plus updated input-loading-pipeline.md (SS6.1-6.4, rkyv -> postcard). The cross-reference index was NOT re-updated after Epic 07 edits. The mdbook build was verified clean after each ticket in Epics 05-07, but targeted cross-reference consistency (e.g., do new sections get referenced by the files that should reference them?) was not systematically checked.

## Specification

### Requirements

1. Run `mdbook build` from the repo root and verify zero errors (mechanistic broken-link check)
2. Perform a targeted manual review of cross-reference integrity for files modified in Epics 05-07, organized into three verification passes:
   - **Pass A (new sections -> existing files)**: Verify that new sections added in Epics 05-07 are referenced by the files that should reference them. Specifically:
     - Does output-infrastructure.md SS6 reference simulation-architecture.md SS3.4? (YES -- confirmed during learnings review)
     - Does simulation-architecture.md SS3.4 reference output-infrastructure.md SS6? (check the channel/writer linkage)
     - Does simulation-architecture.md SS6.1 reference output-infrastructure.md SS6.3 (SimulationParquetWriter)?
     - Do internal-structures.md SS1-SS12 entity struct sections get referenced from input-system-entities.md?
     - Does input-loading-pipeline.md SS6.1 (postcard) get referenced from binary-formats.md or its cross-references section?
   - **Pass B (renamed identifiers)**: Verify that no stale names survive in the live spec corpus:
     - `split_shared_memory` should appear nowhere except historical references in spec-gap-inventory.md
     - `ferrompi::slurm` should appear nowhere in live specs (only `cobre_comm::slurm`)
     - `rkyv` should appear nowhere in input-loading-pipeline.md except in the "Why postcard over rkyv" comparison paragraph
     - `patch_rhs_bounds` should not appear in solver-interface-testing.md (replaced by `patch_row_bounds`)
   - **Pass C (cross-reference index consistency)**: Verify that cross-reference-index.md correctly reflects the current state:
     - Section 3 (outgoing refs) for simulation-architecture.md, output-infrastructure.md, and input-loading-pipeline.md includes the new cross-references introduced in Epics 05-07
     - Section 4 (incoming refs) for files that gained new incoming references from Epic 07 edits
     - Section 5 (dependency ordering) is still topologically valid after the new cross-references
3. Produce a findings report documenting all issues discovered, categorized as BROKEN LINK, STALE REFERENCE, MISSING CROSS-REFERENCE, or INDEX INCONSISTENCY
4. Do NOT fix any issues -- report only. Findings become inputs to ticket-031.

### Inputs/Props

- The full spec corpus under `src/specs/` (76 files)
- The cross-reference index at `src/specs/cross-reference-index.md`
- The list of files modified in Epics 05-07 (from learnings):
  - `src/specs/architecture/solver-interface-testing.md` (Epic 06: patch_rhs_bounds -> patch_row_bounds)
  - `src/specs/architecture/solver-abstraction.md` (Epic 06: StageTemplate ownership)
  - `src/specs/architecture/training-loop.md` (Epic 06: notation, threading)
  - `src/specs/architecture/simulation-architecture.md` (Epic 07: new SS3.4)
  - `src/specs/architecture/input-loading-pipeline.md` (Epic 07: SS6 rkyv -> postcard)
  - `src/specs/hpc/backend-ferrompi.md` (Epic 06: split_shared, Mpi guard)
  - `src/specs/hpc/communication-patterns.md` (Epic 06: split_shared)
  - `src/specs/hpc/communicator-trait.md` (Epic 06: split_shared)
  - `src/specs/hpc/work-distribution.md` (Epic 06: i32 -> usize)
  - `src/specs/hpc/memory-architecture.md` (Epic 06: cobre_comm::slurm)
  - `src/specs/hpc/slurm-deployment.md` (Epic 06: cobre_comm::slurm, cobre run)
  - `src/specs/data-model/internal-structures.md` (Epic 05: new SS1-SS12)
  - `src/specs/data-model/output-infrastructure.md` (Epic 07: new SS6)
  - `src/specs/data-model/input-directory-structure.md` (Epic 05: validation)
  - `src/specs/math/cut-management.md` (Epic 06: notation P_h)
  - `src/specs/configuration/configuration-reference.md` (Epic 06: training.enabled, field names)
  - `src/specs/overview/spec-gap-inventory.md` (Epics 06-07: gap status updates, GAP-039)
  - `src/specs/overview/implementation-ordering.md` (Epic 06: spec reading lists)
  - `src/specs/cross-reference-index.md` (Epic 06: backend-testing.md, ecosystem-guidelines.md)
  - `src/specs/architecture/scenario-generation.md` (Epic 05: OpeningTree)

### Outputs/Behavior

A report file at `plans/implementation-readiness-audit/epic-08-final-verification/report-030-crossref-integrity.md` containing:

- Section 1: mdbook build result (PASS/FAIL with any error messages)
- Section 2: Pass A findings (new section cross-reference completeness)
- Section 3: Pass B findings (stale identifier audit)
- Section 4: Pass C findings (cross-reference index consistency)
- Section 5: Summary table of all findings with category, severity, affected file(s), and description
- Section 6: Conclusion (number of findings by category, overall assessment)

### Error Handling

- If `mdbook build` fails with errors, document all errors in Section 1 and continue with the manual review passes
- If a file referenced in the modified-files list does not exist, note it as a finding and continue

### Out of Scope

- Fixing any broken links or stale references (report only)
- Verifying links in files NOT modified in Epics 05-07 (the original link audit was report-010; this ticket covers only post-edit integrity)
- Updating the cross-reference index (that would be a separate ticket if needed)
- Verifying mathematical correctness of spec content (that is not a cross-reference concern)

## Acceptance Criteria

- [ ] Given the repo at HEAD after Epics 05-07, when `mdbook build` runs from `/home/rogerio/git/cobre-docs`, then the build completes and the exit code and any warnings/errors are documented in report Section 1
- [ ] Given the files modified in Epics 05-07, when Pass A (new section cross-references) is executed, then each new section (simulation-architecture.md SS3.4, output-infrastructure.md SS6, internal-structures.md SS1-SS12, input-loading-pipeline.md SS6.1 postcard) is checked for bidirectional cross-referencing with its dependent files, and all findings are documented in report Section 2
- [ ] Given the renamed identifiers from Epics 05-07, when Pass B (stale identifier audit) is executed using grep across `src/specs/`, then zero instances of `split_shared_memory`, `ferrompi::slurm`, or `patch_rhs_bounds` exist in live spec files (excluding spec-gap-inventory.md historical references), and all findings are documented in report Section 3
- [ ] Given the cross-reference index at `src/specs/cross-reference-index.md`, when Pass C (index consistency) is executed, then sections 3, 4, and 5 of the index are checked against the actual cross-references in files modified by Epic 07, and all inconsistencies are documented in report Section 4
- [ ] Given the completed verification passes, when the report is written to `plans/implementation-readiness-audit/epic-08-final-verification/report-030-crossref-integrity.md`, then the report contains all 6 sections with a summary table of findings in Section 5

## Implementation Guide

### Suggested Approach

1. Run `mdbook build` in the repo root and capture stdout/stderr. Record PASS/FAIL and any diagnostics.
2. For Pass A, open each new/modified file and grep for expected cross-references:
   - `grep -n "simulation-architecture" src/specs/data-model/output-infrastructure.md` (check SS6 references SS3.4)
   - `grep -n "output-infrastructure" src/specs/architecture/simulation-architecture.md` (check SS3.4/SS6.1 references SS6)
   - `grep -n "internal-structures" src/specs/data-model/input-system-entities.md` (check entity struct cross-refs)
   - `grep -n "input-loading-pipeline.*SS6\|postcard" src/specs/data-model/binary-formats.md` (check serialization format reference)
3. For Pass B, run targeted greps:
   - `grep -rn "split_shared_memory" src/specs/ --include="*.md"` (expect 0 results in live specs, only gap inventory)
   - `grep -rn "ferrompi::slurm" src/specs/ --include="*.md"` (expect 0 results)
   - `grep -rn "patch_rhs_bounds" src/specs/ --include="*.md"` (expect 0 results)
   - `grep -rn "rkyv" src/specs/architecture/input-loading-pipeline.md` (expect only in "Why postcard over rkyv" comparison)
4. For Pass C, read cross-reference-index.md sections 3-5 and verify:
   - simulation-architecture.md outgoing refs include output-infrastructure.md
   - output-infrastructure.md outgoing refs include simulation-architecture.md
   - input-loading-pipeline.md outgoing refs reflect the postcard/binary-formats linkage
   - Incoming refs for output-infrastructure.md include simulation-architecture.md
5. Write the report with all findings organized by pass.

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-08-final-verification/report-030-crossref-integrity.md` (NEW -- the deliverable report)

### Patterns to Follow

- Follow the same report structure used in report-010 (cross-reference link integrity from Epic 02): numbered sections, findings table with category/severity/description columns, clear PASS/FAIL conclusion
- Use grep commands as mechanistic evidence (cite the exact command and output)
- Categorize findings using the 4-category system: BROKEN LINK, STALE REFERENCE, MISSING CROSS-REFERENCE, INDEX INCONSISTENCY

### Pitfalls to Avoid

- Do NOT fix any issues found -- this is a report-only ticket. Fixing is out of scope.
- Do NOT re-audit all 4,689 links from report-010. This ticket is scoped to files modified in Epics 05-07 only.
- Do NOT update the cross-reference index even if inconsistencies are found. Document them for ticket-031.
- The gap inventory (spec-gap-inventory.md) contains historical references to old names like `split_shared_memory` -- these are acceptable and should not be flagged as stale references.

## Testing Requirements

### Unit Tests

Not applicable (this is an audit/report ticket, not a code change).

### Integration Tests

- Verify `mdbook build` completes successfully (exit code 0)
- Verify the report file exists at the expected path after completion

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md, ticket-019-define-stage-block-policygraph.md, ticket-020-enumerate-validation-checks.md, ticket-021-define-openingtree-type.md, ticket-022-fix-solver-testing-naming.md, ticket-023-fix-stagetemplate-ownership-and-ferrompi-names.md, ticket-024-fix-notation-and-threading.md, ticket-025-fix-cli-config-slurm.md, ticket-026-update-crossref-index-and-slurm-module.md, ticket-027-evaluate-rkyv-serialization.md, ticket-028-define-simulation-result-type.md, ticket-029-define-output-writer-api.md
- **Blocks**: ticket-031-confirm-conditions-and-final-verdict.md

## Effort Estimate

**Points**: 2
**Confidence**: High
