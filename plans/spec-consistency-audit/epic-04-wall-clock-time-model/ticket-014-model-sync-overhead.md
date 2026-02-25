# ticket-014 Model Synchronization and Communication Overhead

## Context

### Background

Ticket-013 produces a compute-only timing model for one SDDP iteration (forward pass + backward pass LP solves). However, the complete iteration time also includes MPI synchronization overhead: `MPI_Allgatherv` for trial point gathering (once per iteration), `MPI_Allgatherv` for cut exchange (once per backward stage = 119 times), `MPI_Allreduce` for convergence statistics (once per iteration), and implicit barrier overhead from load imbalance at each backward stage boundary. This ticket extends the timing model with these overheads to produce the complete per-iteration and 50-iteration wall-clock estimate.

### Relation to Epic

This is the second ticket in Epic 04. It takes the compute-only model from ticket-013 and adds communication and synchronization to produce the full iteration time budget. Ticket-015 then uses this complete model to update the spec language.

### Current State

- `communication-patterns.md` §3.1 provides a per-iteration communication volume analysis at R=16 ranks, D_state=2,080: ~587 MB total per iteration. It estimates "<1%" overhead on InfiniBand HDR and "~1-2%" on 100 Gbps Ethernet.
- `communication-patterns.md` §3.2 computes bandwidth requirements: ~23 ms at wire speed on InfiniBand HDR (200 Gb/s = 25 GB/s), ~46 ms with 50% protocol overhead.
- However, these calculations use R=16 ranks, while the production deployment is R=64 ranks. The `MPI_Allgatherv` latency scales with rank count (more participants in the collective), so the overhead must be recomputed for R=64.
- `production-scale-reference.md` §4.3 KPI: "Cut exchange (MPI_Allgatherv) <5 ms per stage."
- `production-scale-reference.md` §4.4: "Communication < 2% of iteration time at production scale."
- The ticket-013 analysis document (`timing-model-analysis.md`) will contain the compute-only per-iteration time.

## Specification

### Requirements

1. **Compute the communication volume** at production scale (R=64, M=192, D_state=1,120 for typical / 2,080 for worst-case):
   - **Trial point `MPI_Allgatherv`** (once per iteration): 192 trial points × 120 stages × state_payload_bytes
   - **Cut `MPI_Allgatherv`** (119 times per iteration): 192 cuts × cut_payload_bytes per stage
   - **Convergence `MPI_Allreduce`** (once per iteration): 32 bytes (4 × f64)
   - Total per iteration at both D=1,120 and D=2,080

2. **Model the per-stage cut exchange latency** for `MPI_Allgatherv` at 64 ranks:
   - Wire time: payload / bandwidth (InfiniBand HDR 200 Gb/s = 25 GB/s)
   - Protocol overhead: model as 50% overhead factor (consistent with `communication-patterns.md` §3.2)
   - Latency component: MPI_Allgatherv with 64 ranks has a latency term proportional to log2(64) = 6 (tree-based algorithm) or proportional to 64 (ring-based). Use the conservative ring model: base_latency × (R-1), where base_latency ~ 1-5 microseconds on InfiniBand.
   - Per-stage total: wire_time + protocol_overhead + latency

3. **Model the load imbalance barrier overhead** per backward stage:
   - At each backward stage boundary, all ranks must complete before proceeding (implicit in `MPI_Allgatherv`)
   - Imbalance source: LP simplex iteration variance (~5-15% per solve, per `work-distribution.md` §4.1)
   - With 3 trial points per rank, each doing 200 LP solves, the variance averages down: std_dev of mean over 200 solves ≈ solve_std / sqrt(200)
   - Model as a small percentage (1-3%) of per-stage backward compute time

4. **Produce the complete iteration time formula**:

   ```
   T_iter = T_forward + T_backward_compute + T_trial_gather + (119 × T_cut_exchange) + T_convergence + (119 × T_barrier)
   ```

5. **Compute the 50-iteration total** and compare against the 7,200-second budget.

6. **Verify consistency** with existing spec claims:
   - `communication-patterns.md` §3.2 claim: "<1%" on InfiniBand — does the model confirm this?
   - `production-scale-reference.md` §4.3 KPI: "Cut exchange <5 ms per stage" — does the model confirm this?
   - `production-scale-reference.md` §4.4: "Communication < 2% of iteration time" — does the model confirm this?

7. **Append the synchronization model** to the timing-model-analysis.md document created by ticket-013, as a new section (or as a companion section that integrates with the compute model).

### Inputs/Props

| Parameter                       | Value                       | Source                               |
| ------------------------------- | --------------------------- | ------------------------------------ |
| Compute-only per-iteration time | From ticket-013 analysis    | `timing-model-analysis.md`           |
| MPI ranks (R)                   | 64                          | `production-scale-reference.md` §4.2 |
| InfiniBand bandwidth            | 200 Gb/s (25 GB/s)          | `production-scale-reference.md` §4.1 |
| State dimension (typical)       | 1,120                       | `production-scale-reference.md` §3.4 |
| State dimension (worst-case)    | 2,080                       | `production-scale-reference.md` §2.1 |
| Trial point payload per point   | 8,964 bytes (at D=1,120)    | `communication-patterns.md` §2.1     |
| Cut payload per cut (D=2,080)   | ~16,660 bytes               | `communication-patterns.md` §2.2     |
| Cut payload per cut (D=1,120)   | ~8,976 bytes                | Derived: 16 + 1,120 × 8              |
| Forward passes / trial points   | 192                         | `production-scale-reference.md` §1   |
| Backward stages                 | 119 (T down to 2)           | `training-loop.md` §6.1              |
| Protocol overhead factor        | 50% on IB, 100% on Ethernet | `communication-patterns.md` §3.2     |
| LP solve variance               | ~5-15%                      | `work-distribution.md` §4.1          |

### Outputs/Behavior

The extended analysis document must contain:

1. **Communication volume table**: Per-operation and per-iteration totals at both D=1,120 and D=2,080
2. **Per-stage cut exchange latency derivation**: Wire time + protocol overhead + MPI latency at 64 ranks
3. **Trial point gathering latency**: Single `MPI_Allgatherv` for all stages' visited states
4. **Barrier overhead estimate**: Load imbalance waiting time per backward stage
5. **Complete iteration time formula and numerical result**: Combining compute (from ticket-013) and sync overhead
6. **50-iteration total with overhead**: Final wall-clock estimate vs 7,200 s budget
7. **Consistency check table**: Each existing spec claim vs model prediction, with CONFIRMED/NEEDS UPDATE verdict
8. **Time budget breakdown**: Pie chart or percentage table showing fraction of iteration time for each component (forward compute, backward compute, trial gathering, cut exchange, convergence, barrier)

### Error Handling

- If any existing spec claim is inconsistent with the model (e.g., "<5 ms per stage" is actually 10 ms), flag it with a NEEDS UPDATE verdict and note the correct value. Ticket-015 will handle the spec update.
- If the communication volume at R=64 differs significantly from the R=16 reference in `communication-patterns.md` §3.1 (it should not — volume is independent of rank count for Allgatherv, but latency does scale), note the difference clearly.

## Acceptance Criteria

- [ ] Given D=1,120 (typical), when trial point payload is computed, then total = 192 × 120 × 8,964 ≈ 206 MB (confirming `communication-patterns.md` §2.1 calculation)
- [ ] Given D=1,120, when cut payload is computed per stage, then per_stage = 192 × 8,976 ≈ 1.72 MB; per iteration = 1.72 × 119 ≈ 205 MB
- [ ] Given InfiniBand HDR at 25 GB/s, when per-stage cut exchange latency is computed, then wire_time = 1.72 MB / 25 GB/s ≈ 0.069 ms; with 50% overhead ≈ 0.10 ms; plus MPI latency ≈ 0.1-0.3 ms; total < 0.5 ms per stage — well under the 5 ms KPI
- [ ] Given 119 stages of cut exchange at ~0.5 ms per stage, then total cut exchange overhead ≈ 60 ms per iteration
- [ ] Given the complete model at LP_time = 2 ms, when sync overhead is added to compute (~47.84 s from ticket-013), then total per-iteration time is approximately 47.84 + overhead_seconds, and 50 × total < 7,200 s
- [ ] The consistency check table addresses all three existing spec claims ("<1% on IB", "<5 ms per stage", "<2% of iteration time")
- [ ] The time budget breakdown shows communication as a small fraction (<2%) of total iteration time on InfiniBand
- [ ] The analysis is appended to or integrated with `timing-model-analysis.md`

## Implementation Guide

### Suggested Approach

1. **Read the ticket-013 output** (`timing-model-analysis.md`) to get the compute-only per-iteration time.
2. **Compute payload sizes at D=1,120** (the typical production case, not worst-case D=2,080):
   - Trial point: (1,120 × 8 + 4) = 8,964 bytes
   - Cut: (4 + 4 + 4 + 8 + 1,120 × 8) = 8,980 bytes (or use the wire format from `cut-management-impl.md` §4.2 if it differs)
   - Also compute at D=2,080 for worst-case column
3. **Compute per-iteration volume**:
   - Trial gather: 192 × 120 × 8,964 = 206,530,560 bytes ≈ 197 MiB
   - Cut exchange: 192 × 119 × 8,980 = 205,145,280 bytes ≈ 196 MiB
   - Convergence: 32 bytes
   - Total: ~393 MiB (at D=1,120; note this is less than the 587 MB figure in `communication-patterns.md` §3.1 which uses D=2,080 for cuts)
4. **Compute per-stage cut exchange latency**:
   - Payload: 192 × 8,980 ≈ 1.72 MB
   - Wire time at 25 GB/s: 1.72 / 25,000 = 0.069 ms
   - With 50% protocol overhead: 0.103 ms
   - MPI Allgatherv latency at 64 ranks: estimate 0.1-0.3 ms (depends on algorithm; InfiniBand hardware collectives can achieve sub-millisecond at 64 ranks for small messages)
   - Total per-stage: ~0.2-0.4 ms
5. **Compute trial point gathering latency**:
   - Payload: 206 MB
   - Wire time at 25 GB/s: 206 / 25,000 = 8.24 ms
   - With 50% overhead: 12.4 ms
   - MPI latency: ~0.5 ms (larger message, one call)
   - Total: ~13 ms
6. **Estimate barrier overhead**: 2% of per-stage backward compute time (200 × 2ms = 400 ms per stage → 2% = 8 ms per stage → 119 × 8 ms ≈ 952 ms per iteration). This is significant if variance is high, but likely conservative.
7. **Sum up**:
   - Total sync per iteration: trial_gather + 119 × cut_exchange + convergence + 119 × barrier
   - = 13 ms + 119 × 0.3 ms + 0 ms + 119 × 8 ms ≈ 13 + 36 + 0 + 952 ≈ 1,001 ms ≈ 1.0 s
   - As fraction of ~47.84 s iteration: ~2.1% (borderline on the "<2%" claim)
8. **Verify claims and produce consistency table**.
9. **Append to timing-model-analysis.md**.

### Key Files to Read

| File                                                                                  | Section          | Purpose                                    |
| ------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` | All              | Compute-only model from ticket-013         |
| `src/specs/hpc/communication-patterns.md`                                             | §2, §3           | Payload definitions, volume analysis       |
| `src/specs/overview/production-scale-reference.md`                                    | §4.1, §4.3, §4.4 | Hardware assumptions, KPIs, scaling claims |
| `src/specs/hpc/work-distribution.md`                                                  | §4.1             | Load imbalance sources and magnitudes      |
| `src/specs/architecture/cut-management-impl.md`                                       | §4.2             | Cut wire format (for exact payload size)   |

### Key File to Modify

- `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` (append synchronization section)

### Patterns to Follow

- **Source column pattern**: Annotate every numeric value with its source spec and section
- **Consistency check table** pattern: for each existing spec claim, show (Claim, Source, Model Prediction, Verdict)
- **Dual-scenario presentation**: Show both D=1,120 (typical) and D=2,080 (worst-case) where they differ

### Pitfalls to Avoid

- **Do not confuse communication volume with latency**: Volume (MB) is the same regardless of rank count for Allgatherv. Latency (ms) scales with rank count due to the collective algorithm.
- **Do not ignore barrier overhead**: The implicit barrier at each backward stage means the slowest rank gates progress. With 64 ranks and only 3 trial points per rank, the LP solve variance across 200 openings averages down well, but the per-rank variance (3 trial points × 200 openings = 600 solves) still has a tail.
- **Do not update any spec files**: This ticket only extends the analysis document. Spec file updates are ticket-015's scope.
- **The `communication-patterns.md` §3.1 table uses R=16 and D=2,080**: The numbers there do not directly apply to R=64 with D=1,120. Recompute from first principles.

## Testing Requirements

### Verification Steps

- Cross-check the per-stage cut payload at D=1,120 against the formula: 192 × (16 + 1,120 × 8) = 192 × 8,976 ≈ 1,723,392 bytes ≈ 1.64 MiB ≈ 1.72 MB
- Verify that the total communication volume at D=2,080 approximately matches the 587 MB figure from `communication-patterns.md` §3.1 (which uses R=16 — volume should be independent of R)
- Verify the complete per-iteration time is consistent: compute + sync < 60 s at 2 ms LP solve
- Verify 50 × per-iteration < 7,200 s with margin
- Verify mdBook builds: `mdbook build` exits 0 (analysis is in `plans/`, not `src/`)

## Dependencies

- **Blocked By**: ticket-013 (needs the compute-only timing model)
- **Blocks**: ticket-015

## Effort Estimate

**Points**: 2
**Confidence**: High
