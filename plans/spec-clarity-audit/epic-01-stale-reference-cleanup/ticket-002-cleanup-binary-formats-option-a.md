# ticket-002 Clean Up binary-formats.md Option A Content and Delete Appendix A

## Context

### Background

`src/specs/data-model/binary-formats.md` is the most heavily affected file in the stale-reference category. It contains: (1) the original Option A/B/C/D comparison table and decision blockquote adopting Option A, (2) multiple references to "120 stages" and "28 GB" as production values, (3) the entire Appendix A (solver API analysis, 85 lines) which belongs in solver-specific specs, and (4) workflow descriptions and sizing calculations that assume the Option A architecture. The StageLpCache adoption fundamentally changes how cuts are loaded into the solver, making the Option A workflow description misleading.

### Relation to Epic

This ticket handles the largest single file cleanup in the plan. It must be completed before Epic 02 can collapse superseded content in other files, because binary-formats.md is the primary source of stale Option A analysis that other files reference.

### Current State

Key stale content in `src/specs/data-model/binary-formats.md`:

1. **Lines 110-119**: 4-option comparison table (Option A/B/C/D) and Decision blockquote "Option A (rebuild per stage) is adopted"
2. **Line 129**: "Up to 15,000 cuts/stage x 120 stages ~ 28 GB per rank"
3. **Lines 211**: Code comment "Cached solver basis for warm-start under Option A (full LP rebuild)"
4. **Lines 288-328**: Section 3.4 "Cut Pool Memory Layout Requirements" -- describes the Option A per-thread `addRows` workflow, "Under Option A (SS3.0), each thread rebuilds its LP per stage transition"
5. **Lines 311-328**: "Basis Caching for Warm-Start" subsection -- "Under Option A, each LP is rebuilt from scratch per stage transition"; "Across 120 stages, total basis storage is ~10 MB"
6. **Lines 385-394**: Section 4.3 "Cut Pool Sizing" -- "120 stages x 238 MB ~ 28 GB per MPI rank"
7. **Lines 421-508**: Appendix A -- full solver API analysis (batch row addition, LP cloning, incremental modification, warm-starting, row deletion, architectural decision) -- to be deleted entirely
8. **Lines 491-508**: Appendix A.2 -- Option A adoption decision and workflow

## Specification

### Requirements

1. **Update the comparison table and decision** (lines 110-119): Replace the "Decision" blockquote with a two-phase decision history: (a) original adoption of Option A (2026-02-16), (b) supersession by Strategy 2+3 StageLpCache with reference to Solver Abstraction SS11.4. The 4-option table is historical context that explains why Options B/C/D were rejected -- keep the table but add a note that Option A was subsequently superseded
2. **Update "120 stages" to "60 stages"** and recalculate derived values:
   - Line 129: `15,000 cuts/stage x 60 stages ~ 14.3 GB per rank` (or shared via StageLpCache SharedRegion)
   - Line 326: `Across 60 stages, total basis storage is ~5 MB`
   - Line 392: `60 stages x 238 MB ~ 14.3 GB per rank`
3. **Update section 3.4 "Cut Pool Memory Layout"** (lines 288-309): The CSR layout requirements for `addRows` are still relevant because `addRows` is used during StageLpCache assembly between iterations. But the framing "each thread rebuilds its LP per stage transition" is stale. Reframe: the cut pool layout enables efficient StageLpCache CSC assembly by the leader rank between iterations, and supports `addRows` during assembly
4. **Update "Basis Caching for Warm-Start"** (lines 311-328): The warm-start mechanism is still valid under StageLpCache. Update the framing from "Under Option A, each LP is rebuilt from scratch" to "At each stage transition, the StageLpCache provides the complete LP; the solver warm-starts from the previous iteration's cached basis"
5. **Update code comment** (line 211): Change "under Option A (full LP rebuild)" to "for warm-start at each stage transition"
6. **Update section 4.3 "Cut Pool Sizing"** (line 392): Update to 60 stages and note StageLpCache SharedRegion sharing
7. **Delete Appendix A entirely** (lines 419-508): All solver API analysis content. This includes sections A.1 (Incremental LP Modification Capabilities) and A.2 (Architectural Decision). The content is captured in `solver-highs-impl.md` and `solver-clp-impl.md`

### Inputs/Props

- Current file: `src/specs/data-model/binary-formats.md`
- Production scale reference: `src/specs/overview/production-scale-reference.md` (60 stages)
- StageLpCache canonical description: `src/specs/architecture/solver-abstraction.md` SS11.2-SS11.4

### Outputs/Behavior

- binary-formats.md focuses on binary format concerns (FlatBuffers schema, policy directory, memory layout for serialization)
- No Appendix A
- All numerical values use 60 stages as production baseline
- Decision history shows both the original Option A adoption and its supersession by StageLpCache

### Error Handling

- If line numbers have shifted, locate content by searching for the specific text patterns listed in Current State

## Acceptance Criteria

- [ ] Given `src/specs/data-model/binary-formats.md`, when searching for "Appendix A" or "§A" or "SSA", then zero matches are found
- [ ] Given `src/specs/data-model/binary-formats.md`, when searching for "28 GB", then zero matches are found
- [ ] Given `src/specs/data-model/binary-formats.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/data-model/binary-formats.md`, when reading the Decision blockquote near line 119, then it mentions both the original Option A adoption and the subsequent Strategy 2+3 supersession with a reference to `[Solver Abstraction SS11.4]`
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds with no new warnings related to binary-formats.md

## Implementation Guide

### Suggested Approach

1. Read `src/specs/data-model/binary-formats.md` in full to understand the file structure
2. Edit the Decision blockquote (line 119 area) to add supersession note: `> **Decision (2026-02-16)**: Option A (rebuild per stage) was originally adopted. **Superseded (2026-02-28)** by Strategy 2+3 (StageLpCache) -- see [Solver Abstraction SS11.4](../architecture/solver-abstraction.md). Cut coefficients are now pre-assembled into a per-stage CSC via SharedRegion; the cut pool retains metadata only. The analysis above remains valid as historical context for why Options B/C/D were rejected.`
3. Update line 129: change `120 stages ~ 28 GB per rank` to `60 stages ~ 14.3 GB per rank (coefficients absorbed into StageLpCache SharedRegion at ~22.3 GB node-wide; see [Memory Architecture §2.1](../hpc/memory-architecture.md))`
4. Update line 211 code comment: replace "under Option A (full LP rebuild)" with "for warm-start at each stage transition"
5. Update section 3.4 (lines 288-309): replace "Under Option A (SS3.0), each thread rebuilds its LP per stage transition" with a description of how the cut pool layout enables efficient StageLpCache CSC assembly between iterations by the leader rank. Keep the CSR layout requirements table -- it is still valid for the `addRows` call used during StageLpCache assembly
6. Update "Basis Caching for Warm-Start" (lines 311-328): replace "Under Option A" framing with StageLpCache framing; update "120 stages" to "60 stages" and recalculate basis storage ("~5 MB")
7. Update section 4.3 line 392: `60 stages x 238 MB ~ 14.3 GB per rank` with StageLpCache SharedRegion note
8. Delete everything from `## Appendix A: Solver API Analysis` (line 421) through end of file (line 508), including the `---` separator before it (line 419)
9. Run `mdbook build` to verify no broken links

### Key Files to Modify

- `src/specs/data-model/binary-formats.md`

### Patterns to Follow

- Data-model specs use `§` prefix for section self-references (e.g., `§3.0`, `§3.4`)
- Cross-references to architecture specs use full relative path: `[Solver Abstraction SS11.4](../architecture/solver-abstraction.md)`
- Cross-references to HPC specs use: `[Memory Architecture §2.1](../hpc/memory-architecture.md)`

### Pitfalls to Avoid

- Do not delete the 4-option comparison table (lines 112-117) -- it provides valid historical context for why Options B/C/D were rejected. Just add the supersession note to the decision blockquote
- Do not change section numbers (§3, §3.1, §3.4, §4, §4.3) -- many other files reference them
- Do not remove the CSR layout requirements table in §3.4 -- it is still valid for StageLpCache assembly
- Do not remove the basis caching subsection -- warm-start is still the mechanism; only the framing changes
- When deleting Appendix A, verify there are no internal cross-references from earlier sections in the same file (there is one at line 119 referencing §A.2 and one at line 425 referencing §3.0)

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `mdbook build` and verify success
- Run `grep -c "Appendix A\|§A\|SSA" src/specs/data-model/binary-formats.md` and verify count is 0
- Run `grep -c "28 GB" src/specs/data-model/binary-formats.md` and verify count is 0
- Run `grep -c "120 stages" src/specs/data-model/binary-formats.md` and verify count is 0

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-003 (Appendix A cross-reference cleanup), ticket-007 (solver-abstraction collapse), ticket-015 (cross-reference index update)

## Effort Estimate

**Points**: 3
**Confidence**: High
