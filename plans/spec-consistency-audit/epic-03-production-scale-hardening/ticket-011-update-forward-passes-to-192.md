# ticket-011 Update Forward Pass Count From 200 to 192

## Context

### Background

The Cobre SDDP spec corpus currently uses 200 as the forward pass count throughout. The correct production value is 192, which divides evenly across 64 ranks (192 / 64 = 3 per rank exactly, eliminating load imbalance). Epic 01 ticket-003 cataloged 14 locations in the spec corpus where "200" appears in a forward pass context, plus 2 locations in the LP sizing calculator (which is out of scope for modification).

This ticket changes the forward pass count from 200 to 192 in all spec files and updates every derived value that depends on the forward pass count. It also updates the two JSON configuration examples in the data-model specs.

### Relation to Epic

This is the second ticket in Epic 03. It depends on ticket-010 confirming the current values are correct before changing them. Ticket-012 (traceability annotations) depends on this ticket completing first, so that annotations reference the final correct values.

### Current State

The following 14 spec locations contain "200" in a forward pass or openings context (line numbers from findings-003 — may have shifted slightly after ticket-005 fixes; use grep to re-locate):

| #   | File                                      | Context                                               | Type                   |
| --- | ----------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 1   | `overview/production-scale-reference.md`  | `Forward Passes \| 200` in section 1 dimensions table | Canonical definition   |
| 2   | `overview/production-scale-reference.md`  | `Openings \| 200` in section 1 dimensions table       | Backward pass openings |
| 3   | `overview/production-scale-reference.md`  | `200` Fwd Passes in Large test system row (s4.2)      | Test system table      |
| 4   | `overview/production-scale-reference.md`  | `200` Fwd Passes in Production test system row (s4.2) | Test system table      |
| 5   | `data-model/input-directory-structure.md` | `"num_forward_passes": 200` minimal example           | Config example         |
| 6   | `data-model/input-directory-structure.md` | `"num_forward_passes": 200` full example              | Config example         |
| 7   | `data-model/output-infrastructure.md`     | `"num_forward_passes": 200` output example            | Output example         |
| 8   | `architecture/cut-management-impl.md`     | `5,000 + 50 * 200 = 15,000 slots` capacity formula    | Cut capacity formula   |
| 9   | `architecture/solver-abstraction.md`      | `50 * 200 = 10,000` capacity formula                  | Cut capacity formula   |
| 10  | `hpc/communication-patterns.md`           | `M = 200 trajectories` payload sizing                 | Communication analysis |
| 11  | `hpc/communication-patterns.md`           | `M = 200 forward passes` cut payload                  | Communication analysis |
| 12  | `hpc/communication-patterns.md`           | `M = 200 forward passes` bandwidth ref                | Communication analysis |
| 13  | `hpc/memory-architecture.md`              | `200 forward passes, 200 openings` reference config   | Memory budget          |
| 14  | `hpc/work-distribution.md`                | `M = 200 forward passes` parallelism example          | Work distribution      |

Additional "200" occurrences in `communication-patterns.md` (lines 95, 99, 106) and `memory-architecture.md` (lines 40, 44, 66, 69) reference openings, iterations, or InfiniBand bandwidth — these are NOT forward pass counts and must NOT be changed.

## Specification

### Requirements

#### R1. Forward Pass Count: Change 200 to 192

Update the forward pass count from 200 to 192 in all 14 cataloged locations. Use `grep -rn '\b200\b'` on the `src/specs/` directory to re-locate each instance (line numbers may have shifted after ticket-005 fixes). For each "200" found, determine from context whether it is a forward pass count before changing it.

#### R2. Openings: Keep at 200

The "Openings" value in section 1 of `production-scale-reference.md` (location #2) stays at 200. Openings are the backward pass branching count and are independent of the forward pass count. The spec does not tie openings to forward passes — they happen to both be 200 currently, but openings = 200 is a separate design choice (backward pass scenario sampling).

Similarly, all other "200" values that refer to openings (in `memory-architecture.md` lines 36, 40, and the memory growth table) remain at 200.

#### R3. Cut Capacity Formula: Keep 15,000, Update Arithmetic

The cut capacity (15,000 pre-allocated slots) is a **buffer size**, not a tightly derived value. It should remain at 15,000. However, the arithmetic showing how 15,000 is derived must be updated:

- **`cut-management-impl.md`** line 42: Change `5,000 + 50 × 200 = 15,000 slots` to `5,000 + 50 × 192 = 14,600 slots` AND add a note that the actual capacity is rounded up to 15,000 for headroom. The exact wording: `5,000 + 50 × 192 = 14,600 (rounded up to 15,000 for headroom)`.
- **`solver-abstraction.md`** line 207: Change `50 × 200 = 10,000` to `50 × 192 = 9,600`. The total capacity row remains 15,000.

#### R4. Section 4.2 Test System Table

- **Large row**: Change Fwd Passes from 200 to 192. The Large test system uses 16 ranks, so 192 / 16 = 12 per rank (clean division).
- **Production row**: Change Fwd Passes from 200 to 192. The Production test system uses 64 ranks, so 192 / 64 = 3 per rank (clean division).

#### R5. Communication Patterns Updates

In `communication-patterns.md`:

- **Section 2.1** (trial point payload, around line 42): Change `M = 200 trajectories` to `M = 192`. Update the derived values:
  - Trial points per stage: 192 (was 200)
  - Total payload: `192 * 8,964 ≈ 1.72 MB` per stage (was 1.75 MB), and `1.72 * 120 ≈ 206 MB` for all stages (was 210 MB)

- **Section 2.2** (cut payload, around line 63): Change `M = 200 forward passes` to `M = 192`. Update:
  - Each rank generates `⌊192/16⌋ = 12` cuts per stage (was 12-13). Update: `192 * 16,660 ≈ 3.2 MB` per stage (was 3.3 MB).

- **Section 3.1** (bandwidth reference, around line 84): Change `M = 200 forward passes` to `M = 192`.

- **Section 3.1 per-iteration budget table**: Update trial point allgatherv from ~210 MB to ~206 MB. Update cut allgatherv from ~3.3 MB/stage to ~3.2 MB/stage, and `~393 MB (119 stages)` to `~380 MB (119 stages)`. Update total per iteration from ~603 MB to ~586 MB.

- **Section 3.2 bandwidth requirements**: Update `603 MB` to `586 MB` in all four lines (InfiniBand and Ethernet calculations). Recompute:
  - InfiniBand: 586 MB at 25 GB/s ≈ 23 ms wire speed, ~46 ms with overhead. At 200 iterations: ~9.2 seconds.
  - Ethernet: 586 MB at 12.5 GB/s ≈ 47 ms wire speed, ~94 ms with overhead. At 200 iterations: ~18.8 seconds.
  - Keep the conclusion that communication fraction is <1% (InfiniBand) and ~1-2% (Ethernet).

Note: The "200 iterations" references in section 3.2 (lines 99 and 106) refer to SDDP **iterations**, not forward passes. These stay at 200.

#### R6. Memory Architecture Updates

In `memory-architecture.md`:

- **Section 2.1 reference config** (line 36): Change `200 forward passes` to `192 forward passes`. Keep `200 openings` as-is.
- **Forward pass state row** (line 44): Change `200 trajectories` to `192 trajectories`. Recompute: `192 * ~9 KB * ~1 stage ≈ ~18 MB` (was ~20 MB). Round to ~18 MB.
- The opening tree row (line 40) references `200 openings` — this stays at 200.
- The memory growth table (lines 66-69) references iteration counts and cut pool growth — these are NOT forward pass values and stay unchanged.

#### R7. Work Distribution Update

In `work-distribution.md`:

- **Section 2 parallelism example** (line 84): Change `M = 200 forward passes` to `M = 192`. Update: `R = 8 ranks, N_threads = 16 per rank, 192 trial points per stage distributed across 128 total threads — approximately 1.5 trial points per thread per stage`. (The ratio 192/128 = 1.5 is the same as 200/128 ≈ 1.56, both round to "approximately 1.5", so the conclusion is unchanged.)

#### R8. Data Model Config Examples

- **`input-directory-structure.md`** lines 106 and 156: Change `"num_forward_passes": 200` to `"num_forward_passes": 192`.
- **`output-infrastructure.md`** line 130: Change `"num_forward_passes": 200` to `"num_forward_passes": 192`.

### Inputs/Props

- All files listed in the 14-location table above.
- The findings-010 verification report from ticket-010 (confirming current values are correct before modification).

### Outputs/Behavior

- All forward pass count "200" values become "192" in the spec corpus.
- All derived values (communication payloads, memory estimates, parallelism arithmetic) are updated to reflect 192.
- Openings remain at 200.
- Cut capacity remains at 15,000 but arithmetic is updated.
- A changes log `changes-011.md` is produced in the epic directory documenting every change made, with file path, line number, old value, and new value.

### Error Handling

- If a "200" is ambiguous (could be forward passes or something else), err on the side of NOT changing it and flag it in the changes log for human review.
- If the total per-iteration communication volume changes by more than 5% from the original, double-check the arithmetic — a larger change suggests an error in the derived value chain.
- If `mdbook build` fails after changes, inspect the failure and fix any broken markdown formatting introduced by the edits.

## Acceptance Criteria

- [ ] Given the `production-scale-reference.md` section 1 dimensions table, when the Forward Passes row is read, then it shows 192 (not 200). The Openings row still shows 200.
- [ ] Given the `production-scale-reference.md` section 4.2 test systems table, when the Large and Production rows are read, then both show 192 forward passes.
- [ ] Given `cut-management-impl.md` section 1.3, when the capacity formula is read, then it shows `5,000 + 50 × 192 = 14,600 (rounded up to 15,000 for headroom)`.
- [ ] Given `solver-abstraction.md` section 5 capacity example, when the formula is read, then it shows `50 × 192 = 9,600` and total capacity is still 15,000.
- [ ] Given `communication-patterns.md`, when all forward pass references are checked, then all show 192 and all derived payload/bandwidth values are updated consistently.
- [ ] Given `memory-architecture.md` section 2.1, when the reference config is read, then it shows `192 forward passes, 200 openings` and the forward pass state row shows ~18 MB.
- [ ] Given `work-distribution.md`, when the parallelism example is read, then it uses `M = 192`.
- [ ] Given the three JSON config examples (`input-directory-structure.md` x2, `output-infrastructure.md` x1), when read, then all show `"num_forward_passes": 192`.
- [ ] Given `grep -rn '200' src/specs/`, when the output is reviewed, then NO remaining "200" values refer to forward pass count (only openings, iterations, InfiniBand bandwidth, block hours, and other non-forward-pass contexts remain).
- [ ] `mdbook build` exits 0 with no new warnings.
- [ ] A changes log `changes-011.md` exists documenting every modification.

## Implementation Guide

### Suggested Approach

1. **Re-locate all 200 instances**: Run `grep -rn '\b200\b' src/specs/` and categorize each match as: forward pass (CHANGE), openings (KEEP), iterations (KEEP), bandwidth (KEEP), other (KEEP). Use the findings-003 catalog as a guide but verify against current line numbers.

2. **Update production-scale-reference.md first** (canonical source):
   - Section 1: Forward Passes row → 192
   - Section 4.2: Large and Production rows → 192

3. **Update cut capacity formulas** (locations #8 and #9):
   - `cut-management-impl.md`: Update formula text and add headroom note
   - `solver-abstraction.md`: Update formula text, keep total at 15,000

4. **Update communication-patterns.md** (locations #10, #11, #12 plus derived values):
   - Work through each section sequentially, updating the forward pass count and all derived arithmetic
   - Double-check each derived value with a calculator

5. **Update memory-architecture.md** (location #13):
   - Reference config line and forward pass state row

6. **Update work-distribution.md** (location #14):
   - Parallelism example

7. **Update data-model config examples** (locations #5, #6, #7):
   - Three JSON snippets

8. **Final sweep**: Run `grep -rn '\b200\b' src/specs/` and verify no forward-pass-context "200" remains.

9. **Build check**: Run `mdbook build` and verify clean exit.

10. **Write changes log**: Document every change in `changes-011.md`.

### Key Files to Modify

- `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` — sections 1 and 4.2
- `/home/rogerio/git/cobre-docs/src/specs/architecture/cut-management-impl.md` — section 1.3
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md` — section 5 capacity example
- `/home/rogerio/git/cobre-docs/src/specs/hpc/communication-patterns.md` — sections 2.1, 2.2, 3.1, 3.2
- `/home/rogerio/git/cobre-docs/src/specs/hpc/memory-architecture.md` — section 2.1
- `/home/rogerio/git/cobre-docs/src/specs/hpc/work-distribution.md` — section 2 parallelism example
- `/home/rogerio/git/cobre-docs/src/specs/data-model/input-directory-structure.md` — two JSON examples
- `/home/rogerio/git/cobre-docs/src/specs/data-model/output-infrastructure.md` — one JSON example
- **Create**: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-03-production-scale-hardening/changes-011.md`

### Patterns to Follow

- Use the same changes log format as Epic 01 and 02: file path, line number, old text, new text, rationale.
- When updating derived values (e.g., payload sizes), show the arithmetic in the changes log so reviewers can verify.
- Keep rounding conventions consistent: use "~" prefix for approximate values (e.g., "~18 MB", "~206 MB").

### Pitfalls to Avoid

- **Do NOT change openings from 200** — openings are backward pass branching and are independent of forward passes. The spec does not derive openings from forward passes.
- **Do NOT change "200 iterations"** references in communication-patterns.md sections 3.2 — those are SDDP iteration counts, not forward passes.
- **Do NOT change "200 Gb/s"** InfiniBand bandwidth references.
- **Do NOT change "200" in memory growth table** (memory-architecture.md lines 66-69) — those are iteration-indexed, not forward-pass-indexed. Exception: iteration 1 row says "200" active cuts with the note "$M$ cuts (one per forward pass)" — this should change to 192 since it explicitly derives from forward pass count.
- **Do NOT modify the LP sizing calculator** — it is in a different repository and out of scope.
- **Do NOT change the 15,000 cut capacity value** — only update the arithmetic formula that derives the "before headroom" value.
- **The "~100-200 iterations" range** in communication-patterns.md section 4.1 is a general SDDP training description, not a forward pass reference — do not change.

## Testing Requirements

### Unit Tests

Not applicable — this is a documentation change.

### Integration Tests

Not applicable.

### E2E Tests

- `mdbook build` must exit 0 with no new warnings after all changes.
- `grep -rn '\b200\b' src/specs/` must be reviewed to confirm no forward-pass-context "200" remains.

## Dependencies

- **Blocked By**: ticket-010 (verification that current values are correct)
- **Blocks**: ticket-012 (traceability annotations need final correct values)

## Effort Estimate

**Points**: 3
**Confidence**: High
