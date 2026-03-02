# Spec Clarity Audit Plan

## Overview

Systematic audit and cleanup of the Cobre spec corpus to eliminate contradictions, stale values, and confusing superseded content introduced by the StageLpCache adoption. The goal is to ensure every spec file unambiguously communicates the current architectural baseline before implementation begins.

## Tech Stack

- mdBook documentation project
- Markdown editing only (no code changes)
- `mdbook build` for link verification

## Epic Summary

| Epic    | Name                        | Tickets | Status  | Detail Level |
| ------- | --------------------------- | ------- | ------- | ------------ |
| epic-01 | Stale Reference Cleanup     | 6       | pending | Detailed     |
| epic-02 | Superseded Content Collapse | 5       | pending | Detailed     |
| epic-03 | Decision Log and Prevention | 3       | pending | Outline      |
| epic-04 | Cross-File Verification     | 3       | pending | Outline      |

## Progress Tracking

| Ticket     | Title                                                             | Epic    | Status    | Detail Level | Readiness | Quality | Badge     |
| ---------- | ----------------------------------------------------------------- | ------- | --------- | ------------ | --------- | ------- | --------- |
| ticket-001 | Rewrite design-principles.md Section 5.4 for StageLpCache         | epic-01 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-002 | Clean Up binary-formats.md Option A Content and Delete Appendix A | epic-01 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-003 | Remove Binary Formats Appendix A Cross-References                 | epic-01 | completed | Detailed     | 0.94      | 1.00    | EXCELLENT |
| ticket-004 | Update "120 stages" Production References in Trait Specs          | epic-01 | completed | Detailed     | 1.00      | 1.00    | EXCELLENT |
| ticket-005 | Update "120 stages" in HPC and Overview Specs                     | epic-01 | completed | Detailed     | 0.92      | 1.00    | EXCELLENT |
| ticket-006 | Add Stage Count Clarification Note and Update Crate Docs          | epic-01 | completed | Detailed     | 0.94      | 1.00    | EXCELLENT |
| ticket-007 | Collapse Superseded Content in solver-abstraction.md              | epic-02 | pending   | Detailed     | 0.97      | --      | --        |
| ticket-008 | Collapse Resolved Blockquote in solver-workspaces.md SS1.10       | epic-02 | pending   | Detailed     | 1.00      | --      | --        |
| ticket-009 | Collapse Superseded C++ Wrapper Section in solver-clp-impl.md     | epic-02 | pending   | Detailed     | 1.00      | --      | --        |
| ticket-010 | Collapse Superseded Inline Notes in solver-highs-impl.md          | epic-02 | pending   | Detailed     | 0.96      | --      | --        |
| ticket-011 | Collapse Option A Reference in cut-management-impl.md             | epic-02 | pending   | Detailed     | 0.92      | --      | --        |
| ticket-012 | Create Central Decision Log                                       | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-013 | Add Inline Decision Markers to Primary Spec Sections              | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-014 | Update CLAUDE.md with Decision Log Convention                     | epic-03 | pending   | Outline      | --        | --      | --        |
| ticket-015 | Update Cross-Reference Index for Affected Entries                 | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-016 | Run Full-Corpus Consistency Audit                                 | epic-04 | pending   | Outline      | --        | --      | --        |
| ticket-017 | Final Verification and mdBook Build                               | epic-04 | pending   | Outline      | --        | --      | --        |

## Dependency Graph

```
Epic 01 (Stale Reference Cleanup):
  ticket-001 ──────────────────────────────────────> ticket-012
  ticket-002 ──> ticket-003 ──> ticket-007 ──────> ticket-015
                                ticket-008
                                ticket-009
                                ticket-010
  ticket-004 ──────────────────────────────────────> ticket-016
  ticket-005 ──────────────────────────────────────> ticket-016
  ticket-006 ──────────────────────────────────────> ticket-016

Epic 02 (Superseded Content Collapse):
  ticket-007 ──────────────────────────────────────> ticket-015
  ticket-008 ──────────────────────────────────────> (none)
  ticket-009 ──────────────────────────────────────> (none)
  ticket-010 ──────────────────────────────────────> (none)
  ticket-011 ──────────────────────────────────────> (none)

Epic 03 (Decision Log and Prevention):
  ticket-012 ──> ticket-013 ──> ticket-014
  ticket-012 ──────────────────────────────────────> ticket-015

Epic 04 (Cross-File Verification):
  ticket-015 ──> ticket-016 ──> ticket-017
```

## Key Files

- [Master Plan](./00-master-plan.md)
- [Epic 01 Overview](./epic-01-stale-reference-cleanup/00-epic-overview.md)
- [Epic 02 Overview](./epic-02-superseded-content-collapse/00-epic-overview.md)
- [Epic 03 Overview](./epic-03-decision-log-and-prevention/00-epic-overview.md)
- [Epic 04 Overview](./epic-04-cross-file-verification/00-epic-overview.md)
