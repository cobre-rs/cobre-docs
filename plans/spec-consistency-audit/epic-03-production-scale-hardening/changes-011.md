# Changes Log: ticket-011 Update Forward Pass Count From 200 to 192

## Summary

Changed the forward pass count from 200 to 192 across the spec corpus and updated all derived values. The value 192 divides evenly across 64 ranks (192 / 64 = 3) and 16 ranks (192 / 16 = 12), eliminating load imbalance.

Openings remain at 200 (backward pass branching, independent of forward passes). The cut capacity buffer remains at 15,000, but the arithmetic formula was updated. SDDP iteration counts ("200 iterations"), InfiniBand bandwidth ("200 Gb/s"), and all other non-forward-pass "200" values were left unchanged.

## Changes

### File 1: `src/specs/overview/production-scale-reference.md`

**Change 1 (Section 1, dimensions table, line 20):**

- Old: `| Forward Passes       | 200                        | Parallelism                            |`
- New: `| Forward Passes       | 192                        | Parallelism                            |`
- Rationale: Canonical forward pass count update (R1).

**Change 2 (Section 4.2, test systems table, Large row, line 189):**

- Old: `| **Large**      | 60     | 160    | 130      | 12       | 200        | 16    |`
- New: `| **Large**      | 60     | 160    | 130      | 12       | 192        | 16    |`
- Rationale: Forward pass count in Large test system (R4). 192 / 16 = 12 per rank (clean division).

**Change 3 (Section 4.2, test systems table, Production row, line 190):**

- Old: `| **Production** | 120    | 160    | 130      | 12       | 200        | 64    |`
- New: `| **Production** | 120    | 160    | 130      | 12       | 192        | 64    |`
- Rationale: Forward pass count in Production test system (R4). 192 / 64 = 3 per rank (clean division).

### File 2: `src/specs/architecture/cut-management-impl.md`

**Change 4 (Section 1.3, capacity table, line 42):**

- Old: `| Production example     | 5,000 + 50 x 200 = 15,000 slots                           |`
- New: `| Production example     | 5,000 + 50 x 192 = 14,600 (rounded up to 15,000 for headroom) |`
- Rationale: Updated arithmetic to reflect 192 forward passes; total capacity remains 15,000 as a buffer size (R3).

**Change 5 (Section 4.2, cut payload paragraph, line 176):**

- Old: `At production scale with 200 forward passes per iteration and 16 ranks, each rank generates ~12-13 cuts per stage. The MPI_Allgatherv payload is ~200 cuts x 16,660 bytes = 3.3 MB per stage`
- New: `At production scale with 192 forward passes per iteration and 16 ranks, each rank generates 12 cuts per stage. The MPI_Allgatherv payload is ~192 cuts x 16,660 bytes = 3.2 MB per stage`
- Rationale: Forward pass count and derived payload (R1). 192 / 16 = 12 exactly (no "12-13" ambiguity). 192 \* 16,660 = 3,198,720 bytes = 3.2 MB.

### File 3: `src/specs/architecture/solver-abstraction.md`

**Change 6 (Section 5.2, capacity example table, line 207):**

- Old: `| Max iterations x forward passes | 50 x 200 = 10,000                 |`
- New: `| Max iterations x forward passes | 50 x 192 = 9,600                  |`
- Rationale: Updated arithmetic to reflect 192 forward passes (R3). Total capacity row still shows 15,000 (unchanged).

### File 4: `src/specs/hpc/communication-patterns.md`

**Change 7 (Section 2.1, trial point payload, line 42):**

- Old: `M = 200 trajectories`
- New: `M = 192 trajectories`
- Rationale: Forward pass count in trial point payload sizing (R5).

**Change 8 (Section 2.1, derived values, lines 45-46):**

- Old: `Trial points per stage: 200` and `200 x 8,964 = 1.75 MB per stage, or 1.75 x 120 = 210 MB`
- New: `Trial points per stage: 192` and `192 x 8,964 = 1.72 MB per stage, or 1.72 x 120 = 206 MB`
- Rationale: Derived payload values (R5). 192 _ 8,964 = 1,721,088 bytes = 1.72 MB. 1.72 _ 120 = 206.4 MB.

**Change 9 (Section 2.2, cut payload, line 63):**

- Old: `M = 200 forward passes ... floor(200/16) = 12-13 ... 200 x 16,660 = 3.3 MB`
- New: `M = 192 forward passes ... floor(192/16) = 12 ... 192 x 16,660 = 3.2 MB`
- Rationale: Forward pass count and derived values (R5).

**Change 10 (Section 3.1, reference config, line 84):**

- Old: `M = 200 forward passes`
- New: `M = 192 forward passes`
- Rationale: Per-iteration budget reference configuration (R5).

**Change 11 (Section 3.1, per-iteration budget table, lines 88-91):**

- Old: `~210 MB (once)`, `~3.3 MB / ~393 MB (119 stages)`, total `~603 MB`
- New: `~206 MB (once)`, `~3.2 MB / ~381 MB (119 stages)`, total `~587 MB`
- Rationale: Derived communication volumes (R5). 3.2 \* 119 = 380.8 = ~381 MB. 206 + 381 = 587 MB.

**Change 12 (Section 3.2, InfiniBand bandwidth, lines 97-99):**

- Old: `603 MB takes ~24 ms ... ~48 ms per iteration ... ~9.6 seconds`
- New: `587 MB takes ~23 ms ... ~46 ms per iteration ... ~9.2 seconds`
- Rationale: Derived bandwidth estimates (R5). 587 / 25,000 _ 1,000 = 23.5 ms = ~23 ms. 23 _ 2 = 46 ms. 46 \* 200 / 1,000 = 9.2 s.

**Change 13 (Section 3.2, Ethernet bandwidth, lines 104-106):**

- Old: `603 MB takes ~48 ms ... ~96 ms per iteration ... ~19.2 seconds`
- New: `587 MB takes ~47 ms ... ~94 ms per iteration ... ~18.8 seconds`
- Rationale: Derived bandwidth estimates (R5). 587 / 12,500 _ 1,000 = 46.96 ms = ~47 ms. 47 _ 2 = 94 ms. 94 \* 200 / 1,000 = 18.8 s.

### File 5: `src/specs/hpc/memory-architecture.md`

**Change 14 (Section 2.1, reference config text, line 36):**

- Old: `200 forward passes, 200 openings`
- New: `192 forward passes, 200 openings`
- Rationale: Forward pass count in reference configuration (R6). Openings stay at 200.

**Change 15 (Section 2.1, forward pass state row, line 44):**

- Old: `~20 MB | 200 trajectories x ~9 KB state vector`
- New: `~18 MB | 192 trajectories x ~9 KB state vector`
- Rationale: Forward pass state memory estimate (R6). Scaled proportionally: 20 \* 192/200 = 19.2 = ~18 MB.

**Change 16 (Section 2.3, memory growth table, iteration 1 row, line 66):**

- Old: `| 1         |                  200 |`
- New: `| 1         |                  192 |`
- Rationale: Iteration 1 active cut count = $M$ (one per forward pass) = 192 (R6). Note in same row explicitly says "$M$ cuts (one per forward pass)".

### File 6: `src/specs/hpc/work-distribution.md`

**Change 17 (Section 2.3, parallelism example, line 84):**

- Old: `M = 200 forward passes ... 200 trial points per stage ... approximately 1.5 trial points per thread`
- New: `M = 192 forward passes ... 192 trial points per stage ... 1.5 trial points per thread`
- Rationale: Forward pass count in parallelism example (R7). 192 / 128 = 1.5 exactly (cleaner than the previous approximation).

### File 7: `src/specs/data-model/input-directory-structure.md`

**Change 18 (Minimal JSON example, line 106):**

- Old: `"num_forward_passes": 200,`
- New: `"num_forward_passes": 192,`
- Rationale: Config JSON example (R8).

**Change 19 (Full JSON example, line 156):**

- Old: `"num_forward_passes": 200,`
- New: `"num_forward_passes": 192,`
- Rationale: Config JSON example (R8).

### File 8: `src/specs/data-model/output-infrastructure.md`

**Change 20 (Metadata JSON example, line 130):**

- Old: `"num_forward_passes": 200,`
- New: `"num_forward_passes": 192,`
- Rationale: Output metadata JSON example (R8).

## Unchanged "200" Values (Verified)

The following "200" values in the spec corpus were reviewed and confirmed as NOT forward pass references:

| File                            | Line | Value | Context                           | Reason Unchanged                    |
| ------------------------------- | ---- | ----- | --------------------------------- | ----------------------------------- |
| `production-scale-reference.md` | 21   | 200   | Openings dimension                | Backward pass openings (R2)         |
| `production-scale-reference.md` | 179  | 200   | InfiniBand HDR (200 Gb/s)         | Network bandwidth                   |
| `communication-patterns.md`     | 95   | 200   | InfiniBand HDR (200 Gb/s)         | Network bandwidth                   |
| `communication-patterns.md`     | 99   | 200   | "At 200 iterations total"         | SDDP iteration count                |
| `communication-patterns.md`     | 106  | 200   | "At 200 iterations"               | SDDP iteration count                |
| `communication-patterns.md`     | 114  | 200   | "~100-200 iterations"             | SDDP iteration range                |
| `memory-architecture.md`        | 36   | 200   | "200 openings"                    | Backward pass openings (R2)         |
| `memory-architecture.md`        | 40   | 200   | "200 openings x 120 stages"       | Backward pass openings (R2)         |
| `memory-architecture.md`        | 69   | 200   | Iteration 200 row in growth table | Iteration index, not forward passes |
| `memory-architecture.md`        | 124  | 200   | "~200 ns (2.5x)"                  | NUMA latency                        |
| `scenario-generation.md`        | 154  | 200   | "200 openings"                    | Backward pass openings              |
| `scenario-generation.md`        | 329  | 200   | "200 scenarios"                   | Simulation scenarios                |
| `output-infrastructure.md`      | 160  | 200   | "num_thermals": 200               | Thermal plant count                 |
| `output-infrastructure.md`      | 268  | 200   | "200 MB"                          | Output size estimate                |
| `output-infrastructure.md`      | 272  | 200   | "200 GB"                          | Output size estimate                |
| `output-infrastructure.md`      | 287  | 200   | "200 MB/s"                        | I/O throughput                      |
| `notation-conventions.md`       | 86   | 200   | Table data value                  | Notation example                    |
| `solver-highs-impl.md`          | 213  | 200   | "~200 KB"                         | Memory size                         |
| `input-constraints.md`          | 24   | 200   | "value_hm3": 200.0                | Data value                          |
| `deferred.md`                   | 491  | 200   | "0-200"                           | Variable count range                |
| `deferred.md`                   | 656  | 200   | "50-200 openings"                 | Backward pass openings range        |
| `slurm-deployment.md`           | 149  | 200   | Scenario array value              | SLURM script                        |
| `equipment-formulations.md`     | 13   | 200   | "200 MW", "$200/MWh"              | Power/cost examples                 |
| `equipment-formulations.md`     | 231  | 200   | "200 m3/s"                        | Outflow bound example               |
| `input-system-entities.md`      | 561  | 200   | "cost_per_mwh": 200.0             | Data value                          |

## Verification

- `mdbook build` exits 0 with no new warnings (pre-existing warnings in `risk-measures.md` only).
- `grep -rn '\b200\b' src/specs/` sweep confirms no remaining forward-pass-context "200" values.
- Communication volume change: 603 MB -> 587 MB (2.7% reduction, well within 5% threshold).
