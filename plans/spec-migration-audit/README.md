# Spec Migration Quality Audit & Enforcement

## Overview

This plan performs a deep quality audit of the 50 SDDP specification documents migrated from `powers-rs` into the `cobre-docs` mdBook. The migration itself (39 tickets, all completed) is not repeated -- this plan verifies correctness, crate-mapping accuracy, cross-reference coherence, LaTeX rendering, and produces a new centralized cross-reference index.

**Plan type**: Progressive (epics 1-2 detailed, epics 3-6 outline -- refinement required before execution)

**Cobre-docs repo**: `/home/rogerio/git/cobre-docs/`
**Powers source repo**: `/home/rogerio/git/powers/docs/specs/`
**Architecture reference**: `/home/rogerio/git/cobre/`
**Deployed site**: https://cobre-rs.github.io/cobre-docs/

## Tech Stack

- Content: Markdown (mdBook), LaTeX math via KaTeX (mdbook-katex preprocessor)
- Agent routing: `sddp-specialist` (math/domain content), `open-source-documentation-writer` (index creation), `implementation-guardian` (crate mapping verification)

## Epics

| Epic    | Description                           | Tickets | Phase     |
| ------- | ------------------------------------- | ------- | --------- |
| epic-01 | Content Integrity Verification        | 5       | completed |
| epic-02 | Spec-to-Crate Mapping Audit           | 4       | completed |
| epic-03 | Cross-Reference and Coherence Audit   | 4       | completed |
| epic-04 | LaTeX Equation Rendering Verification | 2       | completed |
| epic-05 | Cross-Reference Index Creation        | 2       | completed |
| epic-06 | Remediation                           | 4       | completed |

## Progress Tracking

| Ticket     | Title                                                                                  | Epic    | Status    | Detail Level |
| ---------- | -------------------------------------------------------------------------------------- | ------- | --------- | ------------ |
| ticket-001 | Audit Content Integrity of Overview Spec Files                                         | epic-01 | completed | Detailed     |
| ticket-002 | Audit Content Integrity of Math Spec Files Part 1                                      | epic-01 | completed | Detailed     |
| ticket-003 | Audit Content Integrity of Math Spec Files Part 2                                      | epic-01 | completed | Detailed     |
| ticket-004 | Audit Content Integrity of Data Model Spec Files                                       | epic-01 | completed | Detailed     |
| ticket-005 | Audit Content Integrity of Architecture, HPC, Config, and Deferred Spec Files          | epic-01 | completed | Detailed     |
| ticket-006 | Audit Crate Documentation Pages for Spec Reference Completeness                        | epic-02 | completed | Detailed     |
| ticket-007 | Audit Spec-to-Crate Mapping for Data Model and Overview Specs                          | epic-02 | completed | Detailed     |
| ticket-008 | Audit Spec-to-Crate Mapping for Math and Architecture Specs                            | epic-02 | completed | Detailed     |
| ticket-009 | Audit HPC and Config Spec Mapping and Produce Master Spec-to-Crate Table               | epic-02 | completed | Detailed     |
| ticket-010 | Audit Semantic Accuracy of Cross-References in Math and Overview Specs                 | epic-03 | completed | Refined      |
| ticket-011 | Audit Semantic Accuracy of Cross-References in Architecture, HPC, and Data Model Specs | epic-03 | completed | Refined      |
| ticket-012 | Audit Algorithm Reference Pages for Consistency with Formal Specs                      | epic-03 | completed | Refined      |
| ticket-013 | Audit Glossary Coverage and Crate Documentation Cross-Reference Accuracy               | epic-03 | completed | Refined      |
| ticket-014 | Configure mdbook-katex and Verify High-Density Equation Pages                          | epic-04 | completed | Refined      |
| ticket-015 | Verify LaTeX Rendering for Remaining Pages and Deploy                                  | epic-04 | completed | Refined      |
| ticket-016 | Build the Cross-Reference Index File                                                   | epic-05 | completed | Refined      |
| ticket-017 | Finalize Cross-Reference Index and Verify mdBook Build                                 | epic-05 | completed | Refined      |
| ticket-018 | Fix Cross-Cutting Notation Change: Beta to Pi for Cut Coefficients                     | epic-06 | completed | Refined      |
| ticket-019 | Fix Section-Number Errata and User-Review HIGH Findings in Spec Files                  | epic-06 | completed | Refined      |
| ticket-020 | Fix MEDIUM and LOW Findings and Verify Final Build                                     | epic-06 | completed | Refined      |
| ticket-021 | Add Missing Spec Links to Crate Documentation Pages                                    | epic-06 | completed | Refined      |

## Severity Classification

| Severity | Definition                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------- |
| CRITICAL | Information loss -- content present in source but absent from target                                    |
| HIGH     | Incorrect spec-to-crate mapping, broken link, contradiction between algorithm reference and formal spec |
| MEDIUM   | Missing crate doc reference, glossary gap, minor cross-reference inaccuracy                             |
| LOW      | Style inconsistency, cosmetic, non-blocking                                                             |

## File Structure

```
plans/spec-migration-audit/
├── 00-master-plan.md
├── README.md
├── .implementation-state.json
├── user-review-findings.md
├── learnings/
│   ├── epic-02-summary.md
│   ├── epic-03-summary.md
│   ├── epic-04-summary.md
│   └── epic-05-summary.md
├── epic-01-content-integrity/
│   ├── 00-epic-overview.md
│   ├── ticket-001-audit-overview-specs.md          (detailed, completed)
│   ├── ticket-002-audit-math-specs-part1.md         (detailed, completed)
│   ├── ticket-003-audit-math-specs-part2.md         (detailed, completed)
│   ├── ticket-004-audit-data-model-specs.md         (detailed, completed)
│   └── ticket-005-audit-arch-hpc-config-deferred.md (detailed, completed)
├── epic-02-spec-crate-mapping/
│   ├── 00-epic-overview.md
│   ├── ticket-006-audit-crate-doc-pages.md          (detailed, completed)
│   ├── ticket-007-audit-data-model-overview-mapping.md (detailed, completed)
│   ├── ticket-008-audit-math-arch-mapping.md        (detailed, completed)
│   └── ticket-009-audit-hpc-config-master-table.md  (detailed, completed)
├── epic-03-cross-reference-coherence/
│   ├── 00-epic-overview.md
│   ├── ticket-010-audit-math-overview-crossrefs.md  (refined, completed)
│   ├── ticket-011-audit-arch-hpc-data-crossrefs.md  (refined, completed)
│   ├── ticket-012-audit-algorithm-reference-pages.md (refined, completed)
│   └── ticket-013-audit-glossary-and-crate-crossrefs.md (refined, completed)
├── epic-04-latex-rendering/
│   ├── 00-epic-overview.md
│   ├── ticket-014-verify-latex-high-density-pages.md (refined, completed)
│   └── ticket-015-verify-latex-remaining-pages.md   (refined, completed)
├── epic-05-cross-reference-index/
│   ├── 00-epic-overview.md
│   ├── ticket-016-build-cross-reference-index.md    (refined, completed)
│   └── ticket-017-finalize-index-and-verify-build.md (refined, completed)
└── epic-06-remediation/
    ├── 00-epic-overview.md
    ├── ticket-018-fix-cross-cutting-notation.md      (refined, completed)
    ├── ticket-019-fix-high-findings.md               (refined, completed)
    ├── ticket-020-fix-medium-low-final-build.md      (refined, completed)
    └── ticket-021-fix-crate-doc-links.md             (refined, completed)
```
