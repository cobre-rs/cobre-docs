# Master Plan: Scenario Spec Gap Closure

## Executive Summary

Close GAP-039 definitively, fix an InSample description inconsistency in `scenario-generation.md`, add the missing `sampling_method` section connecting the data model to the architecture spec, resolve 3 cosmetic gap inventory markers, and fix 8 cross-reference navigability issues identified in report-030 of the implementation readiness audit. This is a focused, small plan (7 tickets across 3 epics) that completes post-audit maintenance work.

## Goals & Non-Goals

### Goals

1. Reclassify GAP-039 as a false/resolved gap in `spec-gap-inventory.md`, with a correct explanation of why the seed-based architecture already in SS2.2a eliminates the need for any broadcast
2. Fix the InSample description in `scenario-generation.md` SS3.2 to be consistent with the LP-based noise injection architecture
3. Add a `sampling_method` section (SS2.3b) to `scenario-generation.md` connecting `input-scenarios.md` SS1.8 to the opening tree construction
4. Add `**Resolved**` markers to GAP-036, GAP-037, GAP-038 in the section 3 detailed table of `spec-gap-inventory.md`
5. Fix all 8 cross-reference navigability issues (F1-F8 from report-030)

### Non-Goals

- Writing new trait specs or testing specs
- Adding new gaps to the inventory
- Modifying any spec content outside the specific files and sections identified above
- Changing the architecture (all architectural decisions are pre-made and documented in the feature description)

## Architecture Overview

### Current State

- `scenario-generation.md` has correct content for SS2.2a (deterministic seed derivation per MPI rank) but SS3.2 InSample description says "The sampled noise feeds the PAR model to produce inflow realizations" -- misleading because the noise is injected as an LP variable, not fed externally to the PAR model
- `scenario-generation.md` lacks a `sampling_method` section connecting `stages.json` `sampling_method` field to opening tree construction
- `spec-gap-inventory.md` has GAP-039 listed as an unresolved High gap describing a "broadcast format" that does not exist in the actual architecture
- GAP-036, GAP-037, GAP-038 rows in section 3 are missing `**Resolved**` markers despite being correctly listed as resolved in section 7
- 8 cross-reference issues (5 HIGH, 3 LOW) identified in report-030

### Target State

- GAP-039 reclassified as resolved (false gap) with correct explanation
- SS3.2 InSample description correctly describes noise injection via `patch_row_bounds` on the AR dynamics constraint row
- New SS2.3b section documents `sampling_method` -> opening tree generation connection (SAA only for Phase 5)
- GAP-036/037/038 section 3 markers fixed, summary statistics verified
- All 8 cross-reference issues resolved

### Key Design Decisions

All decisions are pre-made (see feature description). Key facts:

1. **No broadcast for noise data** -- each MPI rank generates noise independently via `(base_seed, iteration, scenario, stage)` and SipHash-1-3 (already in SS2.2a)
2. **Noise enters LP as a variable** -- `patch_row_bounds` on the AR dynamics constraint row (confirmed by `training-loop.md` SS4.2a)
3. **SAA is the only Phase 5 sampling method** -- LHS, QMC, Selective are deferred
4. **New section goes between SS2.3a and SS2.4** -- named SS2.3b (Sampling Method and Opening Tree Generation)

## Technical Approach

### Tech Stack

- mdBook specification documents (Markdown)
- No code changes

### Component Breakdown

| Epic | Files Modified                                                                | Scope                                                            |
| ---- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | `scenario-generation.md`                                                      | SS3.2 fix, new SS2.3b section, SS2.2 clarifying note             |
| 2    | `spec-gap-inventory.md`                                                       | GAP-039 reclassification, GAP-036/037/038 markers, summary stats |
| 3    | `simulation-architecture.md`, `binary-formats.md`, `cross-reference-index.md` | F1-F8 navigability fixes                                         |

### Testing Strategy

- `mdbook build` after each epic to verify no broken links
- Manual verification of section references and cross-reference consistency
- Summary statistics recount for gap inventory

## Phases & Milestones

| Phase | Epic                                     | Milestone                                       |
| ----- | ---------------------------------------- | ----------------------------------------------- |
| 1     | Epic 1: Scenario Generation Spec Updates | SS3.2 corrected, SS2.3b added, SS2.2 clarified  |
| 2     | Epic 2: Gap Inventory Cleanup            | GAP-039 resolved, markers fixed, stats verified |
| 3     | Epic 3: Cross-Reference Fixes            | All 8 findings remediated                       |

## Risk Analysis

| Risk                              | Likelihood | Impact | Mitigation                                                               |
| --------------------------------- | ---------- | ------ | ------------------------------------------------------------------------ |
| Section renumbering cascade       | Low        | Medium | SS2.3b is inserted without renumbering existing sections (2.4 stays 2.4) |
| Cross-reference index batch error | Low        | High   | All index changes in a single ticket, verified by recount                |
| Summary statistics mismatch       | Low        | Medium | Recount from section 3 table after every change                          |

## Success Metrics

- GAP-039 correctly reclassified with accurate architectural explanation
- Zero remaining InSample description inconsistencies
- `sampling_method` connection documented between data model and architecture
- GAP-036/037/038 markers consistent between section 3, section 6, and section 7
- All 8 report-030 findings resolved
- `mdbook build` exits 0 with no new warnings
