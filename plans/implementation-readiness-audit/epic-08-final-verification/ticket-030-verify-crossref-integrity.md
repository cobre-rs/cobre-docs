# ticket-030 Verify Cross-Reference Integrity After All Edits

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

After Epics 05-07 have modified approximately 15-20 spec files (adding entity struct definitions, validation checklists, OpeningTree type, output writer API, renaming methods, fixing notation, updating the cross-reference index), re-verify cross-reference integrity across the entire spec corpus. This re-verification catches broken links, stale section references, and inconsistent cross-references introduced by the edits. It mirrors the methodology of report-010 (cross-reference link integrity) but is scoped to verifying consistency after modifications rather than auditing the pre-existing state.

## Anticipated Scope

- **Files likely to be modified**: None (this is a verification ticket, not an editing ticket). If broken links are found, they should be flagged as findings, not silently fixed.
- **Key decisions needed**: (1) Whether to re-run the full 4,689-link verification or scope to only files modified in Epics 05-07; (2) Whether to also re-verify the section-prefix convention (SS vs section) given that Epic 06 touched architecture and HPC files
- **Open questions**: Did the entity struct additions in Epic 05 create new cross-reference targets that other files should link to? Did the cross-reference index update (ticket-026/C-18) correctly capture all incoming/outgoing references for the two added files?

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md, ticket-019-define-stage-block-policygraph.md, ticket-020-enumerate-validation-checks.md, ticket-021-define-openingtree-type.md, ticket-022-fix-solver-testing-naming.md, ticket-023-fix-stagetemplate-ownership-and-ferrompi-names.md, ticket-024-fix-notation-and-threading.md, ticket-025-fix-cli-config-slurm.md, ticket-026-update-crossref-index-and-slurm-module.md, ticket-027-evaluate-rkyv-serialization.md, ticket-028-define-simulation-result-type.md, ticket-029-define-output-writer-api.md (all editing tickets from Epics 05-07)
- **Blocks**: ticket-031-confirm-conditions-and-final-verdict.md (the final verdict depends on verification results)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
