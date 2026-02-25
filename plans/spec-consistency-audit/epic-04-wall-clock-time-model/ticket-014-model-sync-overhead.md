# ticket-014 Model Synchronization and Communication Overhead

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Extend the timing model from ticket-013 by computing the MPI synchronization overhead at each backward pass stage boundary and the communication overhead for trial point gathering and cut exchange. Use the payload sizes from communication-patterns.md section 2 and the network assumptions from production-scale-reference.md section 4.1 (InfiniBand HDR 200 Gb/s) to estimate per-stage and per-iteration overhead. Add this overhead to the iteration time model to produce a total per-iteration estimate and a 50-iteration total.

## Anticipated Scope

- **Files likely to be modified**: None initially (extends the model document from ticket-013)
- **Key decisions needed**:
  - How to model MPI_Allgatherv latency: message size / bandwidth + latency per rank, or use empirical MPI benchmark data?
  - Whether the communication patterns spec's claim of "<2% of iteration time" is consistent with the derived model
  - How cut exchange volume grows with iteration count (more cuts per exchange as the pool fills)
- **Open questions**:
  - With 192 forward passes and state dimension 1,120, the trial point payload is 192 × 8,964 bytes = ~1.7 MB per stage. At 200 Gb/s InfiniBand, this is ~0.07 ms per Allgatherv. Is this negligible?
  - Cut payload per stage: 192 cuts × ~9,000 bytes (at state dim 1,120 with avg AR(6)) = ~1.7 MB. Also ~0.07 ms per Allgatherv. Across 119 backward stages = ~8 ms total communication?
  - Is the barrier overhead at each backward stage boundary dominated by the slowest-to-finish rank (load imbalance) rather than by communication latency?

## Dependencies

- **Blocked By**: ticket-013 (needs the base timing model)
- **Blocks**: ticket-015

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
