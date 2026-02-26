# Master Plan: Resolve Blocker Gaps and Codify Ecosystem Guidelines

## Executive Summary

This plan resolves all 5 Blocker-severity specification gaps (GAP-001 through GAP-005) in the Cobre SDDP ecosystem, codifies durable development guidelines extracted from the spec-readiness learnings, and outlines the resolution of 15 High-severity gaps. The stakeholder has provided design decisions for all 5 blockers. This work transforms the specification corpus from "almost ready for implementation" to "fully implementable for Phase 1 coding."

## Goals and Non-Goals

### Goals

1. **Codify ecosystem guidelines** -- Extract accumulated learnings into a CLAUDE.md (agent context) and an mdBook page (human-readable guidelines) so all future work benefits from established patterns
2. **Resolve all 5 Blocker gaps** -- Incorporate stakeholder design decisions into the specifications with sufficient precision for a Rust developer to implement without ambiguity
3. **Design the LP memory layout** -- Produce the most performance-critical specification in the ecosystem: the contiguous, SIMD-friendly, cache-optimized LP variable and constraint layout
4. **Design state vectors and indexers** -- Specify the flat state vector format, dot-product-optimized memory layout, and read-only indexer structs for named access to LP positions
5. **Outline High-severity gap resolution** -- Plan tickets for the 15 High-severity gaps to be refined after learnings from Epics 1-3

### Non-Goals

- Resolving Medium or Low severity gaps (deferred)
- Writing Rust code or creating crate scaffolding (this is specification work only)
- Modifying any HPC, interface, or deferred-feature specs
- Changing the mathematical formulations (LP formulation, cut management math, PAR model math are stable)

## Architecture Overview

### Current State

The Cobre specification corpus has 74 specs across 8 directories. Five Blocker gaps prevent Phase 1 coding from starting:

1. **GAP-001**: `SystemRepresentation` type -- described narratively but no struct definition
2. **GAP-002**: Decommissioned operative state -- references an "open question," LP treatment undefined
3. **GAP-003**: Serialization format -- broadcast strategy says "serialized to contiguous byte buffers" but format unspecified
4. **GAP-004**: `StageTemplate` construction -- bridge between data model and LP solver is missing
5. **GAP-005**: State vector format -- patch sequence, index arithmetic, and wire format undefined

### Target State

After this plan completes:

- All 5 Blocker gaps are resolved with precise, implementable specifications
- The LP layout convention is fully specified with exact column/row index formulas, alignment requirements, and contiguous region boundaries
- State vectors are defined as flat `[f64]` arrays with named indexer access patterns
- rkyv serialization bounds are added to relevant types
- Ecosystem guidelines are codified in both agent-context and human-readable forms
- 15 High-severity gaps have outline tickets ready for refinement

### Key Design Decisions

| Decision                                                                            | Rationale                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dual-nature data model** (clean in cobre-core, performance-adapted in cobre-sddp) | Separates concerns: cobre-core prioritizes clarity and correctness; cobre-sddp sacrifices readability for cache locality and SIMD friendliness on the hot path |
| **Decommissioned = Non-existing**                                                   | Simplifies lifecycle to 3 meaningful states (Non-existing, Filling, Operating); avoids undefined reservoir drainage complexity                                 |
| **rkyv for serialization**                                                          | Zero-copy deserialization avoids allocation on the hot path; bincode is unmaintained                                                                           |
| **cobre-sddp owns Stage construction**                                              | The LP layout is SDDP-specific; the solver crate should not know LP semantics                                                                                  |
| **State vector = flat contiguous `[f64]`**                                          | Primary operation is dot product (state . cut coefficients); contiguous memory enables SIMD vectorization and BLAS-like operations                             |
| **Indexer structs for named LP access**                                             | Read-only, shared across threads, equal on all ranks; avoids magic index numbers in hot-path code                                                              |

## Technical Approach

### Tech Stack

- **All work is documentation/specification changes** (Markdown files in an mdBook project)
- No Rust code, no executable tests, no infrastructure changes
- Performance specifications use concrete byte counts, alignment constraints, and SIMD width assumptions

### Component/Module Breakdown

| Component                       | Epic      | What Changes                                                              |
| ------------------------------- | --------- | ------------------------------------------------------------------------- |
| CLAUDE.md                       | Epic 1    | New file at repo root -- agent development guidelines                     |
| Ecosystem Guidelines spec       | Epic 1    | New file at `src/specs/overview/ecosystem-guidelines.md`                  |
| SUMMARY.md                      | Epic 1    | Add ecosystem-guidelines.md to mdBook TOC                                 |
| Internal Structures (SS1, SS2)  | Epic 2    | GAP-001: SystemRepresentation struct + GAP-002: Decommissioned resolution |
| Input Loading Pipeline (SS6)    | Epic 2    | GAP-003: rkyv serialization specification                                 |
| Solver Abstraction (SS2, SS11)  | Epic 3    | GAP-004: LP memory layout with exact index formulas                       |
| Solver Interface Trait (SS4.4)  | Epic 3    | GAP-004: StageTemplate construction ownership                             |
| Training Loop (SS4.2, SS5, SS7) | Epic 3    | GAP-005: State vector format, patch sequence, indexer structs             |
| Spec Gap Inventory (SS3)        | Epic 2, 3 | Update resolved gaps to "Resolved" status                                 |

### Data Flow

```
Ecosystem Guidelines (Epic 1)
          |
          v
SystemRepresentation + rkyv bounds (Epic 2)
          |
          v
LP Layout + State Vectors + Indexers (Epic 3)
          |
          v
High-Severity Gap Resolution (Epic 4, outline)
```

### Testing Strategy

Since this is specification work (no code), verification is done via:

- **Structural completeness**: Every resolved gap has concrete type definitions, index formulas, and worked examples
- **Cross-reference consistency**: Updated specs correctly reference each other
- **Gap inventory reconciliation**: Resolved gaps are marked with status and resolution summary
- **mdBook build**: `mdbook build` succeeds with no broken links

## Phases and Milestones

| Phase | Epic                         | Duration Estimate | Milestone                                                               |
| ----- | ---------------------------- | ----------------- | ----------------------------------------------------------------------- |
| 1     | Epic 1: Ecosystem Guidelines | 1-2 days          | CLAUDE.md + ecosystem-guidelines.md in place; all future agents benefit |
| 2     | Epic 2: Core Data Model      | 2-3 days          | GAP-001, GAP-002, GAP-003 resolved; SystemRepresentation specified      |
| 3     | Epic 3: LP Layout and State  | 3-4 days          | GAP-004, GAP-005 resolved; LP layout is the cornerstone spec            |
| 4     | Epic 4: High-Severity Gaps   | Outlined only     | Refined after learnings from Epics 1-3                                  |

## Risk Analysis

| Risk                                                                                                           | Likelihood | Impact | Mitigation                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| LP layout design has cascading effects on cut management, solver workspaces, and training loop specs           | High       | High   | Restrict Epic 3 changes to solver-abstraction.md (primary) with minimal cross-reference updates in other files; defer full ripple-through to Epic 4 |
| rkyv serialization requires understanding of alignment constraints that may conflict with SIMD alignment       | Medium     | Medium | Document both rkyv alignment and SIMD alignment requirements explicitly; flag any conflicts for resolution during implementation                    |
| State vector dimension depends on max PAR order across all hydros -- this is a runtime value, not compile-time | Low        | Low    | Document that indexer structs are built at initialization time from resolved internal structures; no compile-time dimension assumptions             |

## Success Metrics

1. All 5 Blocker gaps marked as "Resolved" in the spec-gap-inventory with resolution summaries
2. CLAUDE.md exists at repo root with guidelines extracted from learnings
3. `src/specs/overview/ecosystem-guidelines.md` exists and is linked from SUMMARY.md
4. LP layout convention includes exact index formulas with a worked example for a 3-hydro AR(2) system
5. State vector format includes alignment requirements, dot-product optimization notes, and indexer struct definitions
6. `mdbook build` succeeds with no broken links after all changes
