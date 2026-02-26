# ticket-027 Evaluate rkyv Serialization Fitness for System Broadcast

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Produce an evidence-based evaluation of whether `rkyv` is the optimal serialization library for the single initialization-phase MPI broadcast of the `System` struct (rank-0 serializes, broadcasts to workers, workers deserialize). The evaluation must compare `rkyv` against `postcard`, manual native-endian serialization (the pattern already used for hot-path cut wire format and state vectors), and FlatBuffers (already used for policy persistence). The deliverable is a recommendation with concrete evidence -- not prose speculation -- covering derive complexity impact on all entity types, binary size overhead, deserialization performance at production scale (hundreds of entities, thousands of stages), alignment constraints, and ecosystem maintenance status. The outcome may update `src/specs/architecture/input-loading-pipeline.md` SS6.1 if the recommendation is to replace `rkyv`.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/input-loading-pipeline.md` (SS6.1 broadcast format), `src/specs/overview/ecosystem-guidelines.md` (rkyv ecosystem decision), possibly `src/specs/data-model/binary-formats.md` (if a new format is recommended)
- **Key decisions needed**: (1) Whether zero-copy deserialization is worth the complexity for a once-per-execution operation; (2) Whether the derive macro burden on all entity types (from Epic 05 ticket-018) is acceptable; (3) Whether reusing the FlatBuffers toolchain (already a dependency for policy) is preferable to adding rkyv as a separate dependency
- **Open questions**: What is the realistic `System` struct size for production cases (100+ hydros, 200+ thermals, 3000+ stages)? Does rkyv's alignment requirement (16-byte) conflict with any of the flat-array memory layouts in the HPC specs? Has rkyv's maintenance status changed since the GAP-003 decision (which rejected bincode)?

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md (entity struct definitions determine the derive macro burden)
- **Blocks**: None (recommendation is advisory; the output writer API in ticket-029 is independent)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
