# ticket-019: Specify Deterministic Hash Function for Seed Derivation (GAP-014)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Specify the concrete hash function used for deterministic seed derivation in the scenario generation pipeline. Reproducible sampling requires deriving per-(iteration, scenario, stage) seeds from a base seed using a deterministic hash function that is stable across platforms and Rust compiler versions. The spec currently references this requirement without naming the function or defining the exact input encoding.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/scenario-generation.md` (SS2.2 -- seed derivation)
- **Key decisions needed**: Whether to use `SipHash-2-4` (stable in std), `xxhash` (faster but external crate), or a simple combination formula
- **Open questions**:
  - Is `std::collections::hash_map::DefaultHasher` acceptable, or is its stability guarantee insufficient across Rust versions?
  - Should the input format use fixed-width little-endian integers, or can native encoding be assumed within a single binary?
  - Does the hash need to be cryptographic, or is collision resistance among (iteration, scenario, stage) tuples sufficient?

## Dependencies

- **Blocked By**: None (independent of LP layout work)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
