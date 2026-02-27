# ticket-013 Document FlatBuffers Requirements for Cut Persistence

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Implement the GAP-021 decision to document FlatBuffers requirements without fully defining the `.fbs` schema. Add a requirements subsection to `src/specs/data-model/binary-formats.md` section 3 specifying: (1) cut coefficients must be extractable in batch for all active cuts so the LP can be updated quickly (hot path), and (2) the layout must fit within a cache level (L2/L3) at production scale. Explicitly note that the full schema definition is deferred to implementation time, when the actual data access patterns will be known.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/data-model/binary-formats.md` (section 3 "FlatBuffers for Policy Data", likely section 3.4 "Cut Pool Memory Layout Requirements" or a new section 3.5)
- **Key decisions needed**: Whether the cache-fitting requirement should specify L2 or L3 (or both); whether "batch extraction" means the FlatBuffers schema must support zero-copy slice access or just contiguous storage
- **Open questions**: The existing section 3.4 already documents some layout requirements (contiguous dense arrays, cache-line alignment). How much of GAP-021 is already covered by the existing content? Is a new subsection needed or just a clarifying note?

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
