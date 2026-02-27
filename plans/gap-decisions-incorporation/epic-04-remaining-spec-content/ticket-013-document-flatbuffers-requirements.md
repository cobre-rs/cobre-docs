# ticket-013 Document FlatBuffers Requirements for Cut Persistence

## Context

### Background

GAP-021 identified that the FlatBuffers schema for cut persistence is referenced conceptually (StageCuts, BendersCut, StageBasis) but the actual `.fbs` schema that would be used for code generation is not fully specified. The stakeholder design review decided to document **requirements** (batch extraction, cache-fitting) without fully defining the `.fbs` schema, deferring the complete schema definition to implementation time when actual data access patterns will be known.

### Relation to Epic

Epic 04 resolves the five remaining gaps. This ticket resolves GAP-021 by adding a requirements subsection to `binary-formats.md` section 3 that captures the two key access pattern requirements.

### Current State

- `src/specs/data-model/binary-formats.md` section 3 ("FlatBuffers for Policy Data") already contains substantial content:
  - SS3.0: Runtime access pattern and memory model, including Option A decision.
  - SS3.1: FlatBuffers schema (a `.fbs` schema IS already present -- 100+ lines of FlatBuffers IDL).
  - SS3.2: Policy directory structure.
  - SS3.3: Encoding guidelines.
  - SS3.4: Cut pool memory layout requirements (contiguous dense arrays, cache-line alignment, CSR assembly optimization).
- The existing SS3.4 ("Cut Pool Memory Layout Requirements") already documents layout requirements: contiguous coefficient arrays, stage-level indexable collection, cache-line alignment, and separated intercepts. It also includes a "Why dense, not sparse" note and a "FlatBuffers alignment" note.
- The gap resolution path in the inventory says: "FlatBuffers requirements documented (not full schema): cut coefficients must be batch-extractable for active cuts; layout must fit in L2/L3 cache at production scale. Full schema deferred."
- However, the existing SS3.1 already has a full `.fbs` schema. The gap inventory's "full schema deferred" note appears to refer to the schema being considered provisional/non-final rather than absent. The requirements subsection should document the access-pattern requirements that constrain any future schema revision.

## Specification

### Requirements

1. Add a new subsection to `binary-formats.md` section 3 (e.g., section 3.5 "Access Pattern Requirements") that explicitly states the two requirements the FlatBuffers schema must satisfy:
   - **Batch extraction requirement**: Cut coefficients for all active cuts at a given stage must be extractable in a single pass for CSR assembly. The schema must support iterating active cuts and copying each cut's coefficient vector into the CSR values array without random access or indirection beyond the active-cut-indices list. This is the hot-path requirement referenced in SS3.4.
   - **Cache-fitting requirement**: At production scale ($n_{state} = 2{,}080$), a single cut's coefficient vector is $2{,}080 \times 8 = 16{,}640$ bytes ($\approx 16.3$ KB), which fits in L1 data cache (typically 32-48 KB). The CSR assembly loop processes one cut at a time, so the active working set per cut fits in L1. The full active cut set (up to 15,000 cuts $\times$ 16.6 KB = 238 MB) does NOT fit in any cache level. The requirement is that the per-cut access pattern (read one coefficient vector, write to CSR) fits in L1, not that the entire cut pool fits in cache. State the distinction clearly.
2. Add a note that the `.fbs` schema in SS3.1 is the current best specification but may be revised during implementation when actual data access patterns are measured. The schema is a **guideline** (consistent with the trait convention blockquote pattern used in architecture specs, though binary-formats.md is a data-model spec and does not carry that blockquote).

### Inputs/Props

- The existing content of `binary-formats.md` sections 3.0 through 3.4.
- Production-scale dimensions from [Production Scale Reference](../overview/production-scale-reference.md).

### Outputs/Behavior

- `binary-formats.md` gains a section 3.5 "Access Pattern Requirements" with the two requirements and the schema-as-guideline note.

### Error Handling

Not applicable (documentation ticket).

### Out of Scope

- Modifying the existing `.fbs` schema in SS3.1.
- Modifying the cut pool memory layout requirements in SS3.4 (they are already correct and this ticket supplements them).
- Adding cache-level sizing tables or benchmark estimates.
- Modifying any files other than `binary-formats.md`.

## Acceptance Criteria

- [ ] Given `src/specs/data-model/binary-formats.md`, when the file is read, then a subsection (3.5 or equivalent) exists titled "Access Pattern Requirements" or similar.
- [ ] Given the new subsection, when it is read, then it states the batch extraction requirement: active cut coefficients must be extractable in a single pass for CSR assembly.
- [ ] Given the new subsection, when it is read, then it states the cache-fitting requirement with the correct per-cut working set calculation ($16{,}640$ bytes fits in L1) and explicitly notes that the full cut pool does NOT fit in any cache level.
- [ ] Given the new subsection, when it is read, then it contains a note that the SS3.1 schema is a guideline that may be revised during implementation.
- [ ] Given the modified file, when `mdbook build` is run, then it completes with exit code 0 and no new warnings.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/data-model/binary-formats.md` sections 3.0 through 3.4 to understand the existing content.
2. After section 3.4 ("Cut Pool Memory Layout Requirements"), add a new section:
   ```
   ### 3.5 Access Pattern Requirements
   ```
3. In the new section, write two requirement paragraphs:

   **Batch extraction.** The FlatBuffers schema and the runtime cut pool layout must support extracting all active cuts for a given stage in a single sequential pass. The CSR assembly loop (SS3.4) iterates the `active_cut_indices` list, and for each index reads the corresponding cut's coefficient vector as a contiguous `[f64; state_dimension]` slice. No indirection beyond the index list is permitted on this path. The schema in SS3.1 satisfies this via the `StageCuts.active_cut_indices` field and per-`BendersCut` `coefficients: [double]` vectors.

   **Per-cut cache locality.** At production scale, a single cut coefficient vector is $2{,}080 \times 8 = 16{,}640$ bytes ($\approx 16.3$ KB). This fits within the L1 data cache of modern CPUs (32-48 KB), ensuring that the CSR copy loop for one cut executes entirely from L1. The full active cut set (up to 15,000 cuts, $\approx 238$ MB of coefficients) vastly exceeds all cache levels. The performance model therefore assumes **streaming access**: the CPU prefetcher loads the next cut's coefficient vector while the current cut is being copied to the CSR output buffer. Cache-line alignment (64 bytes, per SS3.4) ensures that prefetch requests align with hardware prefetch boundaries.

4. Add a concluding note:

   > **Schema evolution note.** The `.fbs` schema in SS3.1 is the current specification based on the architectural analysis in SS3.0. It may be revised during implementation when actual data access patterns (cut generation rate, active cut ratio, warm-start coefficient reuse) are measured under production-scale workloads. Any revision must preserve the batch extraction and per-cut cache locality requirements stated above.

5. Run `mdbook build` to verify.

### Key Files to Modify

- `src/specs/data-model/binary-formats.md` (add section 3.5 only)

### Patterns to Follow

- Data-model specs use plain numbered headings (`### 3.5`), not `SS` or `§` prefix.
- Production-scale numbers reference [Production Scale Reference](../overview/production-scale-reference.md) or are computed inline from the established dimensions ($N = 160$, $L = 12$, state dimension = 2,080).
- Blockquote notes use `>` prefix for design notes and schema evolution notes.

### Pitfalls to Avoid

- Do NOT modify the existing `.fbs` schema in SS3.1. The ticket adds requirements, not schema changes.
- Do NOT modify SS3.4 -- the new section supplements it with explicit requirements language.
- Do NOT claim the entire cut pool fits in cache -- only the per-cut working set fits in L1.
- Do NOT use `§` prefix in binary-formats.md headings or internal cross-references (data-model file).

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Run `mdbook build` from the repo root; verify exit code 0.
- Verify that `grep -c 'Access Pattern\|batch extract\|cache locality' src/specs/data-model/binary-formats.md` returns at least 2 matches.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
