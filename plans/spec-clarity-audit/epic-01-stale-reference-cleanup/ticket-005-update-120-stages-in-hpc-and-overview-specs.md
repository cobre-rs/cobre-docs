# ticket-005 Update "120 stages" in HPC and Overview Specs

## Context

### Background

Multiple files in `src/specs/hpc/` and `src/specs/overview/` use "120 stages" as a production-scale reference value. The canonical production reference (`production-scale-reference.md`) uses 60 stages. These files contain sizing tables, timeout calculations, benchmark dimensions, and gap inventory entries that all need updating. Additionally, `src/specs/architecture/performance-adaptation-layer.md` uses "120 stages" in contexts that require contextual evaluation: some are production references (stale), some are range bounds (keep as "60-120 stages"), and some are FLOP cost calculations (update).

### Relation to Epic

This ticket covers the remaining "120 stages" references not handled by ticket-002 (binary-formats), ticket-004 (trait specs), or ticket-006 (production-scale-reference clarification note). It groups together the HPC specs, overview specs, and performance-adaptation-layer because the edits are all straightforward numerical substitutions with recalculations.

### Current State

**HPC specs:**

1. `src/specs/hpc/checkpointing.md` lines 72-73:
   - Line 72: `120 stages x up to 15K cuts x ~17 KB per cut -- up to ~28 GB at maximum capacity`
   - Line 73: `120 stages x ~87 KB per basis = ~10 MB`

2. `src/specs/hpc/communicator-trait.md` line 648:
   `production-scale profiling (120 stages, 160 hydro plants, 15,000 cuts per stage)`

3. `src/specs/hpc/backend-tcp.md` line 385:
   `~192 solves per stage, ~120 stages = ~576 seconds of computation per iteration`

**Overview specs:**

4. `src/specs/overview/ecosystem-vision.md` line 153:
   `Benchmark suite for production-scale cases (164 hydros, 120 stages)`

5. `src/specs/overview/spec-gap-inventory.md` line 93:
   `15,000 cuts x 192 states x 2,080 state dims x 120 stages = 7.7 billion FLOPs per check`

6. `src/specs/overview/spec-gap-inventory.md` line 96:
   `120 stages x 15,000 cuts x 2,080 state dims x 8 bytes` and `28 GB per rank`

**Architecture spec (contextual):**

7. `src/specs/architecture/performance-adaptation-layer.md`:
   - Line 87: `60-120 stages` -- this is a **range bound**, keep as-is
   - Line 89: `160 hydros x 120 stages x millions of iterations` -- this is a **FLOP cost** using max stages, evaluate whether to keep as worst-case or update
   - Line 98: `120 x 160 = 19,200 vs. 12 x 160 = 1,920` -- this is a **memory cost** calculation, evaluate whether to keep as worst-case or update

## Specification

### Requirements

1. **checkpointing.md**: Update lines 72-73 to use 60 stages:
   - Cut pool: `60 stages x up to 15K cuts x ~17 KB per cut` => recalculate total (60 x 15K x 17KB ~ 14.9 GB, use ~14.3 GB for consistency with other specs that use 60 x 238 MB)
   - Solver basis: `60 stages x ~87 KB per basis = ~5 MB`
   - Note: under StageLpCache, cut coefficients are in the SharedRegion (~22.3 GB node-wide), so the "per rank" qualifier needs a parenthetical noting SharedRegion sharing

2. **communicator-trait.md**: Update line 648 to use "60 stages"

3. **backend-tcp.md**: Update line 385 to use 60 stages and recalculate: `~192 solves per stage, ~60 stages = ~288 seconds of computation per iteration`

4. **ecosystem-vision.md**: Update line 153 to `160 hydros, 60 stages` (also fix "164 hydros" to "160 hydros" if that is the canonical value from production-scale-reference.md)

5. **spec-gap-inventory.md**:
   - Line 93: Update to 60 stages and recalculate FLOP count: `15,000 cuts x 192 states x 2,080 dims x 60 stages = 3.85 billion FLOPs` (half of 7.7G)
   - Line 96: Update to 60 stages and recalculate: `60 stages x 15,000 cuts x 2,080 state dims x 8 bytes` => ~14.3 GB, and update "28 GB per rank" to "~14.3 GB per rank (coefficients absorbed into StageLpCache SharedRegion at ~22.3 GB node-wide)"

6. **performance-adaptation-layer.md**:
   - Line 87: Keep "60-120 stages" as-is (legitimate range bound for temporal flattening description)
   - Line 89: Keep "120 stages" but add clarifying context: "At worst-case scale (160 hydros x 120 stages x millions of iterations)" -- this is a legitimate worst-case FLOP cost argument
   - Line 98: Keep "120 x 160 = 19,200" as worst-case memory cost, but add: "At the production baseline of 60 stages, this is 60 x 160 = 9,600 values"

### Inputs/Props

- Files to edit: checkpointing.md, communicator-trait.md, backend-tcp.md, ecosystem-vision.md, spec-gap-inventory.md (all under `src/specs/`), performance-adaptation-layer.md (`src/specs/architecture/`)
- Canonical dimensions: `src/specs/overview/production-scale-reference.md` section 1 (60 stages, 160 hydros)

### Outputs/Behavior

- All files use "60 stages" as the production baseline
- Derived values are recalculated correctly
- performance-adaptation-layer.md retains "120 stages" only in worst-case and range-bound contexts with explicit clarifying labels

### Error Handling

- If line numbers have shifted, locate by searching for "120 stages" in each file
- If ecosystem-vision.md says "164 hydros", check production-scale-reference.md to confirm canonical value (160 hydros)

## Acceptance Criteria

- [ ] Given `src/specs/hpc/checkpointing.md`, when searching for "120 stages" or "28 GB", then zero matches are found
- [ ] Given `src/specs/hpc/communicator-trait.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/hpc/backend-tcp.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/overview/ecosystem-vision.md`, when searching for "120 stages", then zero matches are found
- [ ] Given `src/specs/overview/spec-gap-inventory.md`, when searching for "28 GB", then zero matches are found and "120 stages" is replaced with "60 stages"
- [ ] Given `src/specs/architecture/performance-adaptation-layer.md`, when searching for "120 stages", then each remaining occurrence has an explicit "worst-case" or range-bound qualifier

## Implementation Guide

### Suggested Approach

1. Open each file and locate the "120 stages" reference(s) by searching
2. For each reference, determine the context (production baseline, worst-case, range bound)
3. Apply the appropriate edit:
   - **Production baseline references**: replace 120 with 60 and recalculate derived values
   - **Worst-case references** (performance-adaptation-layer.md lines 89, 98): add "worst-case" qualifier
   - **Range bound references** (performance-adaptation-layer.md line 87): keep "60-120 stages" as-is
4. For checkpointing.md and spec-gap-inventory.md, also update "28 GB" references
5. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/hpc/checkpointing.md` (lines 72-73)
- `src/specs/hpc/communicator-trait.md` (line 648)
- `src/specs/hpc/backend-tcp.md` (line 385)
- `src/specs/overview/ecosystem-vision.md` (line 153)
- `src/specs/overview/spec-gap-inventory.md` (lines 93, 96)
- `src/specs/architecture/performance-adaptation-layer.md` (lines 87, 89, 98)

### Patterns to Follow

- HPC specs use `§` prefix for section self-references
- Overview specs use plain numbered sections
- Architecture specs use `SS` prefix for section self-references
- Numerical values should match the canonical production-scale-reference.md dimensions

### Pitfalls to Avoid

- Do not replace "120 stages" in `scenario-generation.md` -- those are hypothetical-maximum calculations that are correctly labeled
- Do not replace "60-120 stages" in performance-adaptation-layer.md line 87 -- that is a legitimate range bound
- For checkpointing.md, remember that StageLpCache changes the memory model: cut coefficients are now in SharedRegion, not per-rank. Add appropriate context
- For spec-gap-inventory.md line 96, the "28 GB per rank" figure is the old per-rank cut pool size. Under StageLpCache, the equivalent is ~22.3 GB node-wide via SharedRegion. Be precise about the new sharing model

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep "120 stages" src/specs/hpc/checkpointing.md src/specs/hpc/communicator-trait.md src/specs/hpc/backend-tcp.md src/specs/overview/ecosystem-vision.md` and verify zero matches
- Run `grep "28 GB" src/specs/hpc/checkpointing.md src/specs/overview/spec-gap-inventory.md` and verify zero matches
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None (can run in parallel with ticket-004)
- **Blocks**: ticket-016 (full-corpus verification)

## Effort Estimate

**Points**: 2
**Confidence**: High
