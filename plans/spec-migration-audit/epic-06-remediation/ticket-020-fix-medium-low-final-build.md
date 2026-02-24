# ticket-020 Fix MEDIUM and LOW Findings and Verify Final Build

## Context

### Background

Epics 01-05 identified 31 MEDIUM findings and 35 LOW findings. The user review added 1 MEDIUM finding (R1: cobre-solver description). MEDIUM findings include asymmetric cross-reference gaps, algorithm page notation/link gaps, and glossary omissions. LOW findings are cosmetic (legacy references, style inconsistencies). This ticket also serves as the final build verification gate for the entire audit plan.

### Relation to Epic

This is the final ticket in the remediation epic. It handles all non-HIGH, non-notation-change findings and performs the comprehensive final verification. It runs after tickets 018 (notation), 019 (HIGH spec fixes), and 021 (crate doc links) because those tickets modify files that this ticket also touches.

### Current State

The MEDIUM and LOW findings are documented across multiple learnings files:

- **6 MEDIUM asymmetric reference gaps** (F-2, F-3, F-12, F-13, F-14, F-15): documented in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/learnings/epic-03-summary.md` lines 89-101
- **3 MEDIUM algorithm page gaps** (F-16, F-17, F-18): documented in same file, lines 102-104
- **9 MEDIUM glossary omissions** (F-19 to F-27): documented in same file, lines 105-113; definition text available in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-013-audit-report.md`
- **1 MEDIUM cobre-solver description** (R1): documented in `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/user-review-findings.md`
- **1 LOW legacy "DATA_MODEL S3.x.x" references** (F-10): in `deferred.md` at lines 70, 167, 220, 814
- **~34 additional LOW findings** from Epics 01-02: cosmetic, emoji removal, Unicode normalization — documented in individual epic learnings

The cross-reference index conservation check (489 = 489) must be re-verified after adding the 6 asymmetric gap fixes, which add new entries to the `## Cross-References` section of 6 spec files.

## Specification

### Requirements

**Group 1: Asymmetric Reference Gaps (F-2, F-3, F-12, F-13, F-14, F-15) — 6 files**

Add missing reverse cross-reference links to establish bidirectional references:

| Finding | File to Modify                                       | Link to Add                                 | Context                                                                   |
| ------- | ---------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| F-2     | `src/specs/math/equipment-formulations.md`           | Add reverse link to `sddp-algorithm.md`     | sddp-algorithm.md references equipment-formulations but not vice versa    |
| F-3     | `src/specs/math/cut-management.md`                   | Add reverse link to `block-formulations.md` | block-formulations references cut-management but not vice versa           |
| F-12    | `src/specs/architecture/training-loop.md`            | Add link to `synchronization.md`            | training-loop describes barrier semantics but does not link the sync spec |
| F-13    | `src/specs/math/cut-management.md`                   | Add link to `cut-management-impl.md`        | math spec has no link to its architecture implementation counterpart      |
| F-14    | `src/specs/configuration/configuration-reference.md` | Add reverse link to `solver-abstraction.md` | solver-abstraction references config spec but not vice versa              |
| F-15a   | `src/specs/data-model/internal-structures.md`        | Add link to `lp-formulation.md`             | No cross-reference between these tightly coupled specs                    |
| F-15b   | `src/specs/math/lp-formulation.md`                   | Add link to `internal-structures.md`        | Reverse direction of F-15a                                                |

Each link is added to the existing `## Cross-References` section at the bottom of the file. Follow the established format: `- [Spec Title](relative/path.md) — Brief description of relationship`.

**Group 2: Algorithm Page Gaps (F-16, F-17, F-18) — 3 files**

| Finding | File to Modify                       | Change                                                                                                                                                            |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-16    | `src/algorithms/benders.md`          | Add clarifying note at line ~35 explaining the matrix notation ($E_{t+1}^\top \pi^*$) vs the direct-dual convention ($\pi^v_h = \pi^{wb}_h$) used in formal specs |
| F-17    | `src/algorithms/forward-backward.md` | Add link to `specs/architecture/solver-workspaces.md` in "Related topics" section                                                                                 |
| F-18    | `src/algorithms/cvar.md`             | Add link to `specs/math/cut-management.md` in "Further reading" section                                                                                           |

**Group 3: Glossary Additions (F-19 to F-27) — 1 file**

Add 9 missing term definitions to `/home/rogerio/git/cobre-docs/src/reference/glossary.md`. The definition text is available in the ticket-013 audit report at `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-013-audit-report.md`, sections F-19 through F-27. Terms to add:

| Finding | Term                                     | Category            |
| ------- | ---------------------------------------- | ------------------- |
| F-19    | Epigraph variable                        | Math/optimization   |
| F-20    | Relatively complete recourse             | Math/optimization   |
| F-21    | Yule-Walker equations                    | Stochastic modeling |
| F-22    | Innovation (stochastic modeling)         | Stochastic modeling |
| F-23    | Discount factor                          | Math/finance        |
| F-24    | EAVaR                                    | Risk measures       |
| F-25    | Block (intra-stage time period, patamar) | Domain-specific     |
| F-26    | Coherent risk measure                    | Risk measures       |
| F-27    | Outer approximation                      | Math/optimization   |

Insert each term in alphabetical order within the glossary. Follow the existing definition format used in the glossary file.

**Group 4: User Review MEDIUM (R1) — 1 file**

| Finding | File                                                  | Change                                                                                 |
| ------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| R1      | Overview spec (cobre-solver description in section 4) | Update cobre-solver description to mention both HiGHS and CLP backends, not just HiGHS |

Locate the cobre-solver description in the overview spec. It currently says something like "LP/MIP solver abstraction with HiGHS backend". Change to mention both HiGHS and CLP as supported backends.

**Group 5: LOW Findings — Multiple files**

| Finding                 | File                                            | Change                                                                                                                      |
| ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| F-10                    | `src/specs/deferred.md` lines 70, 167, 220, 814 | Replace legacy "DATA_MODEL S3.x.x" references with correct cobre-docs spec references                                       |
| LOW batch (Epics 01-02) | Various spec files                              | Address cosmetic findings as documented in epic learnings — these are optional and should be addressed only if time permits |

### Inputs/Props

- Epic-03 learnings: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/learnings/epic-03-summary.md` (lines 86-115 for finding details)
- Ticket-013 audit report: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-013-audit-report.md` (glossary definition text)
- User review findings: `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/user-review-findings.md` (R1)
- Cross-reference index: `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` (conservation count verification)

### Outputs/Behavior

- All 6 asymmetric reference gaps resolved (6+ new cross-reference entries)
- All 3 algorithm page gaps resolved
- All 9 glossary terms added
- R1 cobre-solver description updated
- F-10 legacy references fixed
- Cross-reference index conservation count re-verified (should be 489 + 8 = 497, or close to that)
- Final `mdbook build` passes with exit 0

### Error Handling

- **Conservation count mismatch**: If adding the 6 asymmetric gap entries changes the outgoing count but not the incoming count (or vice versa), investigate. Each new cross-reference link adds 1 to outgoing from the source file and 1 to incoming at the target file — conservation should still hold.
- **Glossary alphabetical ordering**: If the glossary uses subsections (by letter or by domain), place terms in the appropriate subsection rather than forcing strict alphabetical order.

## Acceptance Criteria

**Group 1 (asymmetric gaps):**

- [ ] Given `equipment-formulations.md` Cross-References section, when reading the links, then `sddp-algorithm.md` appears
- [ ] Given `cut-management.md` Cross-References section, when reading the links, then both `block-formulations.md` and `cut-management-impl.md` appear
- [ ] Given `training-loop.md` Cross-References section, when reading the links, then `synchronization.md` appears
- [ ] Given `configuration-reference.md` Cross-References section, when reading the links, then `solver-abstraction.md` appears
- [ ] Given `internal-structures.md` Cross-References section, when reading the links, then `lp-formulation.md` appears
- [ ] Given `lp-formulation.md` Cross-References section, when reading the links, then `internal-structures.md` appears

**Group 2 (algorithm pages):**

- [ ] Given `algorithms/benders.md`, when reading the content, then a note explains the matrix vs direct-dual notation difference
- [ ] Given `algorithms/forward-backward.md`, when reading Related topics, then `solver-workspaces.md` is linked
- [ ] Given `algorithms/cvar.md`, when reading Further reading, then `cut-management.md` is linked

**Group 3 (glossary):**

- [ ] Given `reference/glossary.md`, when searching for "Epigraph variable", then a definition entry exists
- [ ] Given `reference/glossary.md`, when searching for "EAVaR", then a definition entry exists
- [ ] Given `reference/glossary.md`, when counting total terms, then at least 81 terms exist (72 existing + 9 new)

**Group 4 (R1):**

- [ ] Given the cobre-solver description in the overview spec, when reading it, then both HiGHS and CLP are mentioned as backends

**Group 5 (LOW):**

- [ ] Given `deferred.md`, when searching for "DATA_MODEL S3", then zero matches remain

**Final verification:**

- [ ] Given the full cobre-docs repo, when running `mdbook build`, then the build succeeds with exit 0
- [ ] Given the full cobre-docs repo, when running `mdbook build 2>&1 | grep -c "Rendering failed"`, then the count is 0

## Implementation Guide

### Suggested Approach

1. **Read the glossary file** to understand its current structure and formatting conventions
2. **Read the ticket-013 audit report** sections F-19 through F-27 to get the exact definition text for glossary additions
3. **Execute Group 1** (asymmetric gaps): Read each target file's Cross-References section, add the missing link entry
4. **Execute Group 2** (algorithm pages): Read each algorithm page, add the note or link
5. **Execute Group 3** (glossary): Add all 9 terms in one batch, maintaining alphabetical order
6. **Execute Group 4** (R1): Find and update the cobre-solver description
7. **Execute Group 5** (F-10): Fix the 4 legacy references in deferred.md
8. **Run conservation count check**: Count total outgoing and incoming links in the cross-reference index; they should remain equal
9. **Run `mdbook build`** and verify exit 0

### Key Files to Modify

1. `/home/rogerio/git/cobre-docs/src/specs/math/equipment-formulations.md` — F-2
2. `/home/rogerio/git/cobre-docs/src/specs/math/cut-management.md` — F-3, F-13
3. `/home/rogerio/git/cobre-docs/src/specs/architecture/training-loop.md` — F-12
4. `/home/rogerio/git/cobre-docs/src/specs/configuration/configuration-reference.md` — F-14
5. `/home/rogerio/git/cobre-docs/src/specs/data-model/internal-structures.md` — F-15a
6. `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md` — F-15b
7. `/home/rogerio/git/cobre-docs/src/algorithms/benders.md` — F-16
8. `/home/rogerio/git/cobre-docs/src/algorithms/forward-backward.md` — F-17
9. `/home/rogerio/git/cobre-docs/src/algorithms/cvar.md` — F-18
10. `/home/rogerio/git/cobre-docs/src/reference/glossary.md` — F-19 to F-27
11. Overview spec file (locate cobre-solver description) — R1
12. `/home/rogerio/git/cobre-docs/src/specs/deferred.md` — F-10 (lines 70, 167, 220, 814)

### Patterns to Follow

For cross-reference additions, follow the existing format in each file's `## Cross-References` section:

```markdown
- [Spec Title](relative/path/to/spec.md) — Brief description of the relationship
```

For glossary additions, follow the existing format in `glossary.md` (read the file first to determine format).

### Pitfalls to Avoid

- **Do NOT update the cross-reference index conservation count manually**: The index was built from the pre-remediation state. After all remediation is done, re-running the conservation count check is sufficient. Do not edit the index to change the 489 count.
- **F-16 clarifying note**: The notation difference in `benders.md` is intentional (algorithm pages use simplified matrix notation). The note should explain this choice, not "fix" it.
- **Glossary definition accuracy**: Use the definition text from ticket-013 audit report verbatim unless it contains errors. Do not rephrase definitions.
- **R1 precision**: When updating the cobre-solver description, do not make it sound like HiGHS and CLP are the only possible backends. The solver abstraction supports compile-time backend selection; HiGHS and CLP are the two currently implemented backends.

## Testing Requirements

### Build Verification

- Run `mdbook build` after all fixes
- Verify exit 0 and grep for "Rendering failed" — must be 0

### Conservation Check

- Count the total number of outgoing links in the cross-reference index outgoing table
- Count the total number of incoming links in the cross-reference index incoming table
- Verify they are equal (conservation holds)
- Note: The count will be higher than 489 due to the 6+ new cross-reference entries

### Link Verification

- For each new cross-reference link added, verify the target file exists at the relative path
- For each new algorithm page link, verify the target renders in the built book

## Dependencies

- **Blocked By**: ticket-018 (notation change), ticket-019 (HIGH spec fixes), ticket-021 (crate doc links, or can run in parallel since different files)
- **Blocks**: Nothing — this is the final ticket in the plan

## Effort Estimate

**Points**: 3
**Confidence**: High (all findings are documented with exact locations and fix descriptions; the glossary definition text is pre-written; the work is largely mechanical)
