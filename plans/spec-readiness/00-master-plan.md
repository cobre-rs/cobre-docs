# Master Plan: Spec Readiness

## Executive Summary

Prepare the Cobre SDDP specification corpus for Rust implementation by formalizing the remaining abstraction-point traits (RiskMeasure, HorizonMode, SamplingScheme, CutSelectionStrategy, StoppingRule, SolverInterface), writing conformance test specifications for each, performing a final consistency pass after the communication-backend-abstraction changes, and producing an implementation ordering document that maps crate dependencies and identifies the minimal viable deliverable.

## Goals

1. **Trait formalization**: Define trait specs + conformance test specs for 6 abstraction points, following the communicator-trait.md + backend-testing.md gold standard pattern
2. **Spec consistency**: Verify cross-reference integrity, naming consistency, and convention adherence after the 6 new HPC specs and modified files from the communication-backend-abstraction plan
3. **Implementation readiness**: Produce a crate dependency analysis, implementation ordering document, and gap/ambiguity inventory that allows Rust development to begin

## Non-Goals

- Writing any Rust code or runnable tests
- Changing mathematical definitions (math specs are source of truth)
- Modifying the communication-backend-abstraction work (completed and stable)
- Adding new features or deferred items
- Creating user-guide content

## Architecture Overview

### Current State

The spec corpus has 60+ spec files across 6 sections (overview, math, data-model, architecture, hpc, interfaces/configuration). The `Communicator` trait + conformance test pair is the gold standard. The four algorithm abstraction points (risk measure, cut formulation, horizon mode, sampling scheme) are described in extension-points.md with behavioral contracts but lack formal trait definitions. The solver interface contract is in solver-abstraction.md with an operations table but no trait definition. Stopping rules are defined mathematically but lack a trait formalization.

### Target State

- 6 new trait spec files in `src/specs/architecture/` (one per abstraction point)
- 6 new conformance test spec files in `src/specs/architecture/` (one per trait)
- Updated cross-reference-index.md with all new files
- Updated SUMMARY.md with new pages
- Updated crate specs (sddp.md, solver.md, stochastic.md) referencing the new trait specs
- An implementation-ordering.md document in `src/specs/overview/`
- All cross-references verified correct after all additions

### Key Design Decisions

1. **Trait specs go in `src/specs/architecture/`** not `src/specs/hpc/` -- these are algorithm-level abstractions, not HPC infrastructure. The section reference symbol is therefore `SS` (not `§`).
2. **Each trait follows the communicator-trait.md pattern**: Purpose, convention blockquote, numbered sections, cross-references. But adapted for enum-dispatch traits (risk measure, horizon mode, etc.) rather than backend-dispatch traits.
3. **Conformance test specs follow the backend-testing.md pattern**: Requirements tables (Test Name | Input | Expected Observable Behavior), no executable code.
4. **The SolverInterface trait is REFERENCE priority** -- the solver-abstraction.md already has an extensive operations table in §4. The trait formalization should codify what exists, not add new behavior.

## Technical Approach

### Component Breakdown

| Component                          | Files Created/Modified  | Priority    |
| ---------------------------------- | ----------------------- | ----------- |
| RiskMeasure trait + tests          | 2 new files             | HIGH        |
| HorizonMode trait + tests          | 2 new files             | HIGH        |
| SamplingScheme trait + tests       | 2 new files             | HIGH        |
| CutSelectionStrategy trait + tests | 2 new files             | MEDIUM-HIGH |
| StoppingRule trait + tests         | 2 new files             | MEDIUM-HIGH |
| SolverInterface trait + tests      | 2 new files             | REFERENCE   |
| Cross-reference updates            | 1 modified file         | Required    |
| SUMMARY.md updates                 | 1 modified file         | Required    |
| Crate spec updates                 | 3 modified files        | Required    |
| Consistency pass                   | Multiple modified files | Required    |
| Implementation ordering            | 1 new file              | Required    |

### Testing Strategy

All testing is at the specification level -- conformance test specs define requirements tables, not executable tests. The test specs will be used during Rust implementation to derive actual test code.

## Phases & Milestones

### Phase 1: High-Priority Trait Formalization (Epic 1)

Define RiskMeasure, HorizonMode, and SamplingScheme traits with conformance test specs. These are the three abstraction points with the most complex behavioral contracts and the most cross-references.

### Phase 2: Medium-Priority Trait Formalization (Epic 2)

Define CutSelectionStrategy and StoppingRule traits with conformance test specs. These have simpler dispatch patterns but important composition semantics (OR/AND for stopping rules, periodic execution for cut selection).

### Phase 3: Solver Interface Formalization (Epic 3)

Codify the existing solver interface contract (solver-abstraction.md §4) as a formal trait spec with conformance tests. Reference priority -- the contract already exists, this is about making it explicit and testable.

### Phase 4: Spec Consistency Final Pass (Epic 4)

Cross-reference integrity, naming consistency, convention adherence, free-threaded Python note validation, traits-as-guidelines convention propagation.

### Phase 5: Implementation Readiness Assessment (Epic 5)

Crate dependency analysis, implementation ordering, minimal viable deliverable identification, gap/ambiguity inventory.

## Risk Analysis

| Risk                                                | Likelihood | Impact | Mitigation                                     |
| --------------------------------------------------- | ---------- | ------ | ---------------------------------------------- |
| Trait spec conflicts with existing math spec        | Medium     | High   | Math spec is source of truth; trait must align |
| Extension-points.md behavioral contracts incomplete | Low        | Medium | Deep-read of math specs fills gaps             |
| Cross-reference cascade from 12 new files           | High       | Low    | Systematic update of cross-reference-index.md  |
| Scope creep into deferred features                  | Medium     | Medium | Strict non-goal enforcement                    |

## Success Metrics

1. All 6 trait specs pass internal review for completeness (convention blockquote, method contracts, error types, dispatch mechanism)
2. All 6 conformance test specs have requirements tables covering all variant combinations and edge cases
3. Cross-reference-index.md has rows for all new files with correct crate assignments
4. Implementation ordering document identifies a valid dependency-ordered build sequence
5. No broken cross-references across the entire spec corpus
