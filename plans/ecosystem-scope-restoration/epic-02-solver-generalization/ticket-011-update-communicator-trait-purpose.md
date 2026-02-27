# ticket-011 Update communicator-trait.md Purpose Paragraph

## Context

### Background

The `communicator-trait.md` purpose paragraph describes the Communicator trait as "the backend abstraction through which the SDDP training loop performs collective communication operations." While the trait is primarily used by the SDDP training loop, it is designed as generic distributed computing infrastructure. The purpose paragraph should describe it as generic, noting SDDP as the primary consumer.

### Relation to Epic

This ticket is independent of other Epic 02 tickets (it does not reference solver method names or LP layout terminology). It addresses the last remaining SDDP-specific framing in a trait spec purpose paragraph within Epic 02's scope.

### Current State

File `src/specs/hpc/communicator-trait.md`:

- Line 5: "the backend abstraction through which the SDDP training loop performs collective communication operations"
- Line 5-6: "preserving SDDP determinism invariants (rank-ordered receives, identical FCFs across all ranks)"
- Convention blockquote is present with `./backend-testing.md` path (correct for HPC directory)
- The rest of the spec (sections 1-4) uses SDDP as the design context, which is appropriate since SDDP drove the design requirements

## Specification

### Requirements

1. Update the Purpose paragraph to describe the Communicator trait generically: "through which distributed optimization algorithms perform collective communication operations"
2. Replace "SDDP determinism invariants" with generic determinism language: "determinism invariants (rank-ordered receives, identical state across all ranks)" -- the invariants themselves are generic, only the "SDDP" qualifier is domain-specific
3. Preserve the convention blockquote VERBATIM -- note that in HPC files, the path is `./backend-testing.md` (not `../hpc/backend-testing.md`)
4. Preserve all method contracts, type definitions, and behavioral descriptions in sections 1-4
5. SDDP-specific usage examples within the spec body are acceptable (the spec was designed for SDDP; examples stay)

### Inputs/Props

- File: `/home/rogerio/git/cobre-docs/src/specs/hpc/communicator-trait.md`

### Outputs/Behavior

- Purpose paragraph uses generic framing
- Convention blockquote unchanged
- All method contracts unchanged
- SS1-SS4 content unchanged (SDDP examples within the body stay)

### Error Handling

- The convention blockquote path must be `./backend-testing.md` (not `../hpc/`). Verify this after editing.
- "identical FCFs across all ranks" should become "identical state across all ranks" -- FCF is an SDDP-specific term

## Acceptance Criteria

- [ ] Given `communicator-trait.md`, when the Purpose paragraph is read, then it describes "distributed optimization algorithms" (or equivalent), not "the SDDP training loop"
- [ ] Given `communicator-trait.md`, when the Purpose paragraph is searched for "SDDP", then zero matches appear in the Purpose paragraph (SDDP may appear later in the spec body)
- [ ] Given `communicator-trait.md`, when the convention blockquote is compared to the canonical text, then it is character-for-character identical with `./backend-testing.md` path
- [ ] Given `communicator-trait.md`, when sections 1-4 are diffed against originals, then only the Purpose paragraph has changed
- [ ] Given the file, when `mdbook build` is run, then the build succeeds

### Out of Scope

- Sections 1-4 content (method contracts, type definitions, code examples)
- SDDP usage examples within the spec body (legitimate design context)
- SharedMemoryProvider trait (SS4) -- already generic

## Implementation Guide

### Suggested Approach

1. Read the Purpose paragraph (lines 5-6)
2. Replace: "through which the SDDP training loop performs collective communication operations" with "through which distributed optimization algorithms perform collective communication operations"
3. Replace: "SDDP determinism invariants (rank-ordered receives, identical FCFs across all ranks)" with "determinism invariants required by iterative decomposition algorithms (rank-ordered receives, identical distributed state across all ranks)"
4. Keep the rest of the Purpose paragraph: compile-time monomorphization reference, single-process mode reference
5. Verify convention blockquote is unchanged (especially the `./backend-testing.md` path)
6. Verify no other content changed

### Key Files to Modify

- `src/specs/hpc/communicator-trait.md` (Purpose paragraph only, approximately lines 5-6)

### Patterns to Follow

- "distributed optimization algorithms" for the consumer description
- "iterative decomposition algorithms" as the pattern that requires these determinism invariants
- Keep technical accuracy: the determinism invariants (rank-ordered receives) are indeed required by decomposition algorithms generally

### Pitfalls to Avoid

- CRITICAL: Do NOT modify the convention blockquote
- CRITICAL: Verify the blockquote path is `./backend-testing.md` (HPC directory uses `./`, not `../hpc/`)
- Do NOT modify sections 1-4
- Do NOT remove "FCF" or other SDDP terms from the spec body -- only the Purpose paragraph changes

## Testing Requirements

### Unit Tests

- Purpose paragraph does not contain "SDDP"
- Convention blockquote path is `./backend-testing.md`

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: None (independent of other Epic 02 tickets)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
