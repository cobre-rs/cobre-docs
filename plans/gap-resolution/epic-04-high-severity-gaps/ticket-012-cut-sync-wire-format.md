# ticket-012: Specify Cut Synchronization MPI Wire Format (GAP-007)

## Context

### Background

After each backward pass stage, newly generated cuts are distributed across all ranks via `allgatherv` so that every rank holds an identical FCF. The per-cut wire format is partially described in Cut Management Implementation SS4.2 (fields: slot index, iteration, forward pass index, intercept, coefficients) but the endianness convention, alignment requirements, and serialization mechanism are unspecified. Epic-02 (ticket-006) established that rkyv is used for the initial `System` broadcast but explicitly scoped rkyv to non-hot-path operations. The cut synchronization happens every iteration at every backward stage and is therefore a hot-path operation requiring raw byte reinterpretation.

### Relation to Epic

This ticket resolves GAP-007 (High severity). It follows the same raw-reinterpretation pattern as ticket-011 (state vector wire format) and completes the MPI wire format specifications for the two hot-path `allgatherv` operations in the training loop.

### Current State

- **Cut Management Implementation SS4.2**: Defines the per-cut fields and sizes (slot `u32`, iteration `u32`, forward pass index `u32`, intercept `f64`, coefficients `[f64; n_state]`). Total per cut: ~16,660 bytes at production scale. States "compact binary representation optimized for bandwidth" but does not specify endianness, alignment, or `#[repr(C)]` requirements.
- **Cut Management Implementation SS4.3**: Documents that slot indices are deterministic — all ranks can independently compute the correct slot for every received cut.
- **Input Loading Pipeline SS6.4**: Explicitly states rkyv is NOT suitable for long-term storage or cross-version compatibility. By extension, it confirms rkyv is tied to in-memory broadcast within a single binary.
- **Communicator Trait SS2.1**: `allgatherv` operates on `T: CommData` where `CommData: Send + Sync + Copy + 'static`.

## Specification

### Requirements

1. Add a new subsection SS4.2a "Wire Format Specification" to `cut-management-impl.md` immediately after the existing SS4.2 serialization table.
2. Specify that the cut synchronization wire format uses **native endianness** with the assumption that all ranks in an MPI job share the same architecture (same byte order, same floating-point format). This is a standard MPI assumption documented by the MPI specification itself.
3. Specify that the per-cut payload is a `#[repr(C)]` packed struct with explicit field ordering matching the SS4.2 table. Provide the struct definition:
   ```rust
   #[repr(C)]
   #[derive(Clone, Copy)]
   pub struct CutWireRecord {
       pub slot_index: u32,
       pub iteration: u32,
       pub forward_pass_index: u32,
       pub _padding: u32,  // align intercept to 8 bytes
       pub intercept: f64,
       pub coefficients: [f64; 0],  // variable-length tail, actual length = n_state
   }
   ```
4. Specify that the actual wire payload for each cut is `4 + 4 + 4 + 4 + 8 + n_state * 8` bytes = `24 + n_state * 8` bytes. At production scale: `24 + 2,080 * 8 = 16,664` bytes per cut.
5. Specify that the `allgatherv` uses `T = u8` (raw bytes) with counts and displacements in bytes, since `CutWireRecord` has variable length due to the coefficient tail.
6. Document the 8-byte alignment requirement: the `intercept` and `coefficients` fields require 8-byte alignment, which the 4-byte padding after `forward_pass_index` ensures within the record. The `allgatherv` receive buffer must be allocated with 8-byte alignment (satisfied by any standard allocator).
7. State explicitly: no version byte is included. The wire format is tied to the binary version — all ranks run the same binary, so format compatibility is guaranteed. Cross-version wire format compatibility is not a requirement.
8. Add a cross-reference to Communicator Trait SS2.1 and to ticket-011's state vector wire format (SS5.4a in training-loop.md) as the companion hot-path wire format.
9. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-007 as resolved.

### Inputs/Props

- Per-cut field layout from Cut Management Implementation SS4.2
- $n_{state}$ from Solver Abstraction SS2.1
- `allgatherv` signature from Communicator Trait SS2.1

### Outputs/Behavior

A new subsection in `cut-management-impl.md` that fully specifies the binary wire format for cut synchronization, including the `#[repr(C)]` struct layout, padding, and byte-level sizing.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `cut-management-impl.md`, when a reader looks for SS4.2a, then a subsection titled "Wire Format Specification" exists after the SS4.2 serialization table.
- [ ] Given SS4.2a, when reading the wire format, then it specifies native endianness with the same-architecture assumption.
- [ ] Given SS4.2a, when reading the struct definition, then a `#[repr(C)]` struct with the exact field ordering (slot_index, iteration, forward_pass_index, padding, intercept, coefficients) is shown.
- [ ] Given SS4.2a, when checking per-cut size, then it states `24 + n_state * 8` bytes with the production-scale value of 16,664 bytes.
- [ ] Given SS4.2a, when checking version byte, then it explicitly states no version byte is included with rationale.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-007 has a resolution row referencing Cut Management Implementation SS4.2a.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/cut-management-impl.md` and locate SS4.2 "Serialization for MPI".
2. Insert subsection `### 4.2a Wire Format Specification` immediately after the SS4.2 per-cut size table.
3. Write the specification covering: native endianness assumption, `#[repr(C)]` struct with padding, byte-level sizing formula, `T = u8` allgatherv approach, alignment requirement, no version byte rationale, cross-references.
4. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
5. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/cut-management-impl.md` — Add SS4.2a subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-007 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: Use "4.2a" pattern (consistent with "4.2a" and "5.4a" from earlier tickets).
- **Struct definition style**: Follow the pattern in `solver-interface-trait.md` SS4.4 (StageTemplate) — `#[repr(C)]` struct with doc comments per field.
- **Resolution Log row**: Follow existing rows (GAP-001 through GAP-006).

### Pitfalls to Avoid

- Do NOT use rkyv for the cut wire format. This is hot-path data; raw reinterpretation is required.
- Do NOT add a version byte. All ranks run the same binary.
- Do NOT forget the 4-byte padding between `forward_pass_index` (u32) and `intercept` (f64). Without padding, the `f64` would be at offset 12, which is not 8-byte aligned.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-006 (rkyv decision — completed), ticket-008 (LP layout determines n_state — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
