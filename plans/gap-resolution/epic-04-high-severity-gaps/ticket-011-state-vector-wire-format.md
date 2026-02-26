# ticket-011: Specify State Vector MPI Wire Format (GAP-006)

## Context

### Background

After the forward pass, each MPI rank holds visited states for its assigned scenarios. The backward pass requires all visited states from all ranks at each stage — these are gathered via `allgatherv`. The state vector format itself is now fully defined (Training Loop SS5.1: flat `[f64; n_state]` with 64-byte alignment, layout matching the LP column prefix from Solver Abstraction SS2.1), but the MPI wire format for the `allgatherv` exchange is unspecified: the indexing convention (scenario-major vs stage-major), counts/displacements computation, and whether the payload uses raw `f64` reinterpretation or structured serialization.

### Relation to Epic

This ticket resolves GAP-006 (High severity). It is the first of two MPI wire format specifications in this epic (the other being ticket-012 for cut synchronization). Defining the state vector wire format is prerequisite knowledge for ticket-012, since both follow the same raw-reinterpretation pattern established by the rkyv decision in epic-02 (ticket-006: rkyv for broadcast, raw reinterpretation for hot-path collectives).

### Current State

- **Training Loop SS5.1-5.2**: Defines the state vector as `[f64; n_state]` with $n_{state} = N \cdot (1 + L)$, 64-byte aligned. State extraction is a contiguous slice copy from the LP primal solution.
- **Training Loop SS5.4 step 3**: States "visited states at each stage are collected across all ranks via `allgatherv`" but does not specify the wire format.
- **Training Loop SS4.3**: Forward pass scenarios are distributed in contiguous blocks across ranks. Each rank processes `M_r` scenarios (where `sum(M_r) = M`).
- **Communicator Trait SS2.1**: `allgatherv` signature: `fn allgatherv<T: CommData>(&self, send: &[T], recv: &mut [T], counts: &[usize], displs: &[usize])`.
- **Solver Abstraction SS2.1**: $n_{state} = N \cdot (1 + L)$; at production scale ($N=160$, $L=12$): $n_{state} = 2{,}080$.

## Specification

### Requirements

1. Add a new subsection SS5.4a "State Vector Wire Format" to `training-loop.md` immediately after SS5.4 step 3 (state collection via `allgatherv`).
2. Specify the wire format as raw `[f64]` reinterpretation (not rkyv-serialized), consistent with the hot-path convention established in cut-management-impl.md SS4.2. The payload is a flat contiguous array of `f64` values.
3. Define the indexing convention as **per-stage, scenario-major within each stage**: for stage $t$, rank $r$ sends all visited states for its scenarios at that stage concatenated. The `allgatherv` at stage $t$ gathers the states for that single stage only.
4. Specify the counts and displacements formulas:
   - `counts[r] = M_r * n_state` (number of `f64` values from rank $r$)
   - `displs[r] = sum(counts[0..r])` (cumulative sum of counts, 0-based)
   - Total receive buffer size: `M * n_state` f64 values
5. Note that one `allgatherv` call is made per stage $t \in [1, T]$ during the backward pass preparation (not one giant allgatherv for all stages at once), since different stages may have different numbers of trial points in future extensions (e.g., state deduplication).
6. Document that no alignment padding is added to the wire format — the 64-byte alignment is a local allocation concern, not a wire format concern. The receive buffer on each rank is locally allocated with 64-byte alignment for SIMD operations after gathering.
7. Add a production-scale sizing note: at $M=192$, $n_{state}=2{,}080$, a single stage's `allgatherv` payload is $192 \times 2{,}080 \times 8 = 3.19$ MB — small for InfiniBand.
8. Add a cross-reference from SS5.4a to Communicator Trait SS2.1 (allgatherv contract) and to Solver Abstraction SS2.1 (n_state formula).
9. Update the spec-gap-inventory.md Resolution Log table to mark GAP-006 as resolved, referencing this ticket.

### Inputs/Props

The subsection consumes:

- $n_{state}$ from Solver Abstraction SS2.1
- Per-rank scenario counts $M_r$ from the work distribution (Training Loop SS4.3)
- The `allgatherv` signature from Communicator Trait SS2.1

### Outputs/Behavior

A new subsection in `training-loop.md` that an implementer can use to write the `allgatherv` call without ambiguity: exact payload type (`f64`), exact count/displacement formulas, exact per-call granularity (one call per stage).

### Error Handling

No error handling specification needed — this is a documentation ticket. The `allgatherv` error handling is already defined in the Communicator Trait.

## Acceptance Criteria

- [ ] Given `training-loop.md`, when a reader looks for SS5.4a, then a subsection titled "State Vector Wire Format" exists immediately after SS5.4 step 3.
- [ ] Given SS5.4a, when reading the wire format description, then it specifies raw `[f64]` (not rkyv) as the payload type.
- [ ] Given SS5.4a, when reading the counts formula, then `counts[r] = M_r * n_state` is stated with variables defined by cross-reference.
- [ ] Given SS5.4a, when reading the displacements formula, then `displs[r] = sum(counts[0..r])` is stated.
- [ ] Given SS5.4a, when checking the production-scale sizing note, then it shows $192 \times 2{,}080 \times 8 \approx 3.19$ MB per stage.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-006 has a row with the resolution date, plan/epic reference, ticket ID, and a summary referencing Training Loop SS5.4a.
- [ ] Given `mdbook build`, when building the book after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/training-loop.md` and locate SS5.4 "State Lifecycle" step 3 ("Extraction for backward pass").
2. Insert a new subsection `### 5.4a State Vector Wire Format` after step 3. Use the same subsection numbering pattern established for SS4.2a (the patch sequence subsection from epic-03).
3. Write the wire format specification with:
   - A brief intro sentence connecting to the `allgatherv` in step 3
   - The explicit statement that the payload is raw `[f64]` values (not structured serialization)
   - The per-stage granularity clarification
   - The counts/displacements formulas as a table or code block
   - The sizing note
   - Cross-references to Communicator Trait SS2.1 and Solver Abstraction SS2.1
4. Open `src/specs/overview/spec-gap-inventory.md` and add a row to the Section 7 Resolution Log table for GAP-006.
5. Run `mdbook build` to verify no broken links.

### Key Files to Modify

- `src/specs/architecture/training-loop.md` — Add SS5.4a subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-006 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: Use "5.4a" pattern (same as "4.2a" from ticket-009). This keeps the section number hierarchy without renumbering existing sections.
- **Wire format description**: Follow the pattern in `cut-management-impl.md` SS4.2 which describes per-cut wire fields as a table with Type and Size columns.
- **Resolution Log**: Follow the format of existing rows (GAP-001 through GAP-005) in Section 7: `| GAP-006 | <date> | gap-resolution / epic-04 | ticket-011 | <summary> |`.

### Pitfalls to Avoid

- Do NOT specify rkyv for the state vector wire format. The rkyv decision (ticket-006) applies only to the initial `System` broadcast, not to hot-path collectives. The state `allgatherv` happens every iteration and must use zero-overhead raw reinterpretation.
- Do NOT specify a single `allgatherv` for all stages at once. The per-stage granularity is important because future extensions (state deduplication) may change the count of trial points per stage.
- Do NOT add alignment padding to the wire format. 64-byte alignment is a local concern.
- Do NOT edit any files beyond the two listed above. Cross-references from other files to Training Loop SS5 already exist and do not need updating.

## Testing Requirements

### Unit Tests

Not applicable — this is a specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` from the repo root to verify no broken links or rendering errors after the edits.

## Dependencies

- **Blocked By**: ticket-009 (state vector format must be defined first — completed)
- **Blocks**: ticket-012 (cut wire format follows same pattern)

## Effort Estimate

**Points**: 2
**Confidence**: High
