# ticket-011: Specify State Vector MPI Wire Format (GAP-006)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Define the exact wire format for state vectors exchanged via `allgatherv` after the forward pass. The format must specify byte layout, indexing convention (scenario-major vs stage-major), counts and displacements computation, and alignment requirements for the MPI buffer.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/training-loop.md` (SS5.2), possibly `src/specs/hpc/communication-patterns.md`
- **Key decisions needed**: Whether the wire format uses the flat `[f64; n_state]` state vector directly (as defined in ticket-009) or a packed struct with metadata
- **Open questions**:
  - Does each rank send states for all stages, or only the stages it processed?
  - Is the wire format rkyv-serialized or raw f64 reinterpretation?
  - How are counts and displacements computed from per-rank scenario assignments?

## Dependencies

- **Blocked By**: ticket-009 (state vector format must be defined first)
- **Blocks**: ticket-012 (cut wire format follows same pattern)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
