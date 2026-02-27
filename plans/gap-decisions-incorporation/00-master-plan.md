# Master Plan: Gap Decisions Incorporation

## Executive Summary

This plan incorporates confirmed architectural decisions from a stakeholder design review into the Cobre specification corpus. Fifteen open gaps (GAP-018 through GAP-035) received decisions via `review.md`. The work consists of (1) updating the gap inventory to reflect resolved status and recalculated statistics, and (2) adding the actual spec content that closes each gap in its owning spec file(s). All work is Markdown spec authoring -- no code is produced.

## Goals & Non-Goals

### Goals

- Resolve all 15 open gaps (10 Medium, 5 Low) with the decisions confirmed in `review.md`
- Update `spec-gap-inventory.md` statistics to reflect 0 unresolved gaps
- Add spec content to the owning spec files that makes each gap's resolution concrete and verifiable
- Maintain all mdBook conventions (section numbering, cross-reference style, convention blockquote rules)
- Ensure the spec corpus is self-consistent after all changes

### Non-Goals

- Writing Rust code or implementation artifacts
- Defining the complete FlatBuffers `.fbs` schema (GAP-021 decision: document requirements only)
- Adding a dynamic forward_passes scheduler (GAP-034 decision: immutable for now)
- Implementing MPI shared memory optimization (GAP-033 decision: defer to post-profiling)
- Creating new spec files -- all content goes into existing files

## Architecture Overview

### Current State

- 39 total gaps in the inventory: 5 Blocker (resolved), 16 High (resolved), 13 Medium (3 resolved, 10 open), 5 Low (all open)
- 15 gaps remain open (GAP-018 through GAP-035, excluding already-resolved GAP-020, GAP-023, GAP-029)
- The gap inventory summary statistics and resolution log need updating

### Target State

- 0 unresolved gaps
- All 39 gaps resolved with entries in the resolution log
- Each gap's owning spec file contains the content that closes the gap
- Summary statistics updated: 0 unresolved across all severities

### Key Design Decisions

1. **Gap inventory update is a single atomic ticket** per the CLAUDE.md batch convention -- all 15 gaps updated in one pass
2. **Each spec content ticket targets one spec file** (or a tightly coupled pair) to maintain atomicity
3. **GAP-018 (threading)**: The hybrid-parallelism.md spec currently mandates OpenMP; the decision says use rayon for intra-rank parallelism. This requires rewriting section 2 and updating sections 1, 3-6
4. **GAP-022 (PAR-to-LP)**: Requires adding explicit transformation flow to par-inflow-model.md and a `PrecomputedParLp` struct to internal-structures.md
5. **GAP-031 (scenario notation)**: Requires modifying the `StageSamplingConfig` struct and `SamplingMethod` enum in internal-structures.md section 12

## Technical Approach

### Tech Stack

- mdBook Markdown specification documents
- KaTeX math rendering (LaTeX equations in `$$` blocks)
- No code compilation -- all deliverables are `.md` files

### Component/Module Breakdown

| Epic                                 | Scope                                                                                                                     | Tickets |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| Epic 1: Gap Inventory Update         | Batch update of spec-gap-inventory.md                                                                                     | 1       |
| Epic 2: High-Impact Spec Content     | PAR-to-LP (022), TrajectoryRecord (030), Warm-start (028), Threading model (018)                                          | 4       |
| Epic 3: Configuration and Data Model | Config params (019, 024, 027, 035), Scenario notation (031), Forward passes immutability (034)                            | 3       |
| Epic 4: Remaining Spec Content       | Backward pass (026), Event channel (032), NUMA/SharedMemory (033), Penalty ordering (025), FlatBuffers requirements (021) | 5       |

### Data Flow

1. Read `review.md` decisions (authoritative input)
2. Read current spec files to understand what content exists
3. Write new/updated spec content into existing files
4. Update gap inventory table entries, statistics, and resolution log
5. Verify mdBook builds cleanly after all changes

### Testing Strategy

- `mdbook build` must succeed with no new errors after each ticket
- Cross-reference links must resolve (no broken links)
- Section numbering must follow conventions (plain numbers for overview, SS for architecture, section symbol for HPC)
- Summary statistics in gap inventory must be arithmetically correct

## Phases & Milestones

| Phase | Epic   | Milestone                                                                           |
| ----- | ------ | ----------------------------------------------------------------------------------- |
| 1     | Epic 1 | Gap inventory fully updated -- all 15 gaps marked resolved, statistics correct      |
| 2     | Epic 2 | Four highest-impact gaps resolved in spec files (022, 030, 028, 018)                |
| 3     | Epic 3 | Configuration reference and data model specs updated (019, 024, 027, 035, 031, 034) |
| 4     | Epic 4 | All remaining gaps resolved in spec files (026, 032, 033, 025, 021)                 |

## Risk Analysis

| Risk                                               | Likelihood | Impact | Mitigation                                                                        |
| -------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------- |
| GAP-018 rewrite of hybrid-parallelism.md is large  | Medium     | Medium | Scope to sections 1-6 only; cross-references section unchanged                    |
| GAP-031 struct changes propagate to multiple files | Low        | Medium | Track all references to `StageSamplingConfig` and `SamplingMethod` before editing |
| Math rendering breaks in PAR-to-LP section         | Low        | Low    | Verify with `mdbook build` and manual KaTeX check                                 |
| Section numbering inconsistencies                  | Low        | Medium | Follow CLAUDE.md conventions strictly; grep for violations                        |

## Success Metrics

- All 15 gaps marked **Resolved** in `spec-gap-inventory.md` section 3
- Summary statistics in section 6 show 0 unresolved gaps across all severities
- Resolution log in section 7 has entries for all 15 gaps
- `mdbook build` succeeds with no new errors
- No `section symbol` (`§`) violations in architecture specs (except convention blockquotes)
