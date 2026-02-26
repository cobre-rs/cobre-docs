# ticket-019: Specify Deterministic Hash Function for Seed Derivation (GAP-014)

## Context

### Background

Scenario Generation SS2.2 "Reproducible Sampling" describes deterministic seed derivation — each (iteration, scenario, stage) tuple maps to a unique derived seed via a "deterministic hash function" — but does not name the hash function or define the input encoding. The choice affects reproducibility guarantees across platforms and Rust compiler versions.

### Relation to Epic

This ticket resolves GAP-014 (High severity). It specifies the concrete hash function and input encoding for the scenario generation pipeline in cobre-stochastic.

### Current State

- **Scenario Generation SS2.2**: States the requirement (deterministic seed derivation from base seed) and the properties it must satisfy (cross-rank reproducibility, restart reproducibility, order independence) but names no specific function.
- **Scenario Generation SS2.3**: Opening tree generation uses the same seed derivation for `(opening_index, stage)` pairs.
- **Rust std**: `DefaultHasher` uses SipHash-2-4 but its stability across Rust versions is NOT guaranteed by the standard library. The `RandomState` documentation explicitly warns against relying on hash values being stable.

## Specification

### Requirements

1. Add a new subsection SS2.2a "Seed Derivation Function" to `scenario-generation.md` immediately after SS2.2.
2. Specify the hash function as **SipHash-1-3** via the `siphasher` crate (version 1.x), NOT `std::collections::hash_map::DefaultHasher`. Rationale: SipHash-1-3 is faster than SipHash-2-4, provides sufficient collision resistance for the (iteration, scenario, stage) domain, and the `siphasher` crate guarantees output stability across versions (unlike std).
3. Specify the input encoding as fixed-width **little-endian** integers:
   ```
   input = base_seed.to_le_bytes()       // u64, 8 bytes
        ++ iteration.to_le_bytes()        // u32, 4 bytes
        ++ scenario.to_le_bytes()         // u32, 4 bytes
        ++ stage.to_le_bytes()            // u32, 4 bytes
   ```
   Total: 20 bytes of deterministic input.
4. Specify the derived seed as the full 64-bit hash output, used to initialize a `Pcg64` (or equivalent) RNG for generating the noise vector at that (iteration, scenario, stage) tuple.
5. For opening tree generation (SS2.3), the input encoding replaces `iteration` and `scenario` with `opening_index`:
   ```
   input = base_seed.to_le_bytes()       // u64, 8 bytes
        ++ opening_index.to_le_bytes()    // u32, 4 bytes
        ++ stage.to_le_bytes()            // u32, 4 bytes
   ```
   Total: 16 bytes.
6. State explicitly that the hash does NOT need to be cryptographic. The purpose is collision avoidance among a finite set of tuples, not security.
7. State that native encoding is NOT acceptable — little-endian is mandatory to ensure identical derived seeds on both little-endian (x86) and big-endian (some ARM, POWER) architectures if the MPI job spans heterogeneous nodes. This is a defensive choice; in practice, most HPC clusters are homogeneous x86.
8. Add a cross-reference to Scenario Generation SS2.3 (opening tree) and a note about the `siphasher` crate version requirement.
9. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-014 as resolved.

### Inputs/Props

- Base seed from `config.json`
- (iteration, scenario, stage) tuple from the training loop
- (opening_index, stage) tuple from the opening tree generator

### Outputs/Behavior

A 64-bit derived seed, deterministic and portable across platforms and Rust versions.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `scenario-generation.md`, when looking after SS2.2, then a subsection SS2.2a "Seed Derivation Function" exists.
- [ ] Given SS2.2a, when reading the hash function specification, then SipHash-1-3 via the `siphasher` crate is named.
- [ ] Given SS2.2a, when reading the input encoding, then little-endian fixed-width integers are specified with exact byte layout.
- [ ] Given SS2.2a, when reading the opening tree variant, then a separate input encoding for `(opening_index, stage)` is shown.
- [ ] Given SS2.2a, when checking cryptographic requirements, then it explicitly states non-cryptographic.
- [ ] Given SS2.2a, when checking endianness, then little-endian is mandatory with cross-platform rationale.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-014 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/scenario-generation.md` and locate SS2.2.
2. Insert subsection `### 2.2a Seed Derivation Function` after SS2.2.
3. Write the hash function specification, input encodings (two variants), output format, non-cryptographic note, endianness note, and cross-references.
4. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
5. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/scenario-generation.md` — Add SS2.2a subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-014 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: "2.2a" pattern.
- **Code block for byte layout**: Use a plain text code block showing the concatenation, matching the style used in Cut Management Implementation SS4.2 (wire format fields).
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT use `std::collections::hash_map::DefaultHasher`. Its output is not stable across Rust versions.
- Do NOT use native byte encoding. Little-endian is required for cross-platform reproducibility.
- Do NOT specify a cryptographic hash (SHA-256, BLAKE3). The overhead is unnecessary for collision avoidance among a small tuple domain.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: None (independent of LP layout work)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
