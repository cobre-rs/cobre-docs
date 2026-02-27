# ticket-006 Update Implementation-Ordering Per-Phase Reading Lists

## Context

### Background

The file `src/specs/overview/implementation-ordering.md` defines an 8-phase crate-by-crate build sequence for the Cobre SDDP solver. Each phase includes a **Spec reading list** row in its attribute table, listing the spec files an implementer should read before starting that phase.

These reading lists were authored during the spec-readiness plan (Epic 05) when the corpus contained ~68 files. Since then, the spec-readiness plan added 13 new files (7 trait specs, 6 testing specs) and the gap-resolution plan added content to existing files. The per-phase reading lists were never updated to include these additions. A systematic comparison (see Specification below) reveals **15 spec files** that belong in minimal-viable phase reading lists but are currently absent, plus **10 additional specs** that are correctly excluded because they belong to deferred crates or are meta-documents.

Separately, the original outline ticket anticipated blocker-resolution language cleanup. This work is already complete: ticket-001 (epic-01) removed all inline GAP markers, and ticket-002 (epic-01) updated the `ecosystem-guidelines.md` blocker table. A `grep` for "blocker", "must be resolved", "GAP-", "unresolved", and "before Phase" returns zero matches in `implementation-ordering.md`. No blocker cleanup is needed.

### Relation to Epic

This is the first ticket in Epic 03 (Navigation Layer). It ensures the per-phase reading lists are complete and accurate before ticket-007 curates the Minimum Viable Reading List from them, and before ticket-008 adds the spec usage guide.

### Current State

`implementation-ordering.md` has 232 lines, 8 sections (numbered `## 1.` through `## 8.`). Phases 1-8 are in section 5 (subsections `### Phase 1` through `### Phase 8`). The Phase Dependency Summary ASCII DAG is at lines 158-173.

The file currently references 52 unique spec files in the reading lists. There are 84 total spec files in the corpus. Of the 32 missing, 10 belong to deferred crates (correctly excluded), 5 are meta/index documents (cross-reference-index, implementation-ordering itself, spec-gap-inventory, deferred.md, ecosystem-guidelines), and 2 are deferred-backend specs (backend-shm, backend-tcp). That leaves **15 specs that should be added** to phase reading lists.

## Specification

### Requirements

Add the following 15 specs to the per-phase reading lists. Each addition is justified by the spec's primary crate ownership (from the cross-reference index) and its relevance to the phase's testable deliverables.

**Phase 1 (cobre-core)** -- add 2 specs:

- [Notation Conventions](../overview/notation-conventions.md) -- foundational; defines the mathematical notation used by all subsequent specs. Must be read before any math spec.
- [Hydro Production Models](../math/hydro-production-models.md) -- primary crate is `cobre-sddp` but secondary is `cobre-core`; the constant-productivity model ($\rho_i$) is used in Phase 1 entity definitions. Listed here so implementers understand the production function contract before defining Hydro entity types.

**Phase 3 (cobre-solver)** -- add 2 specs:

- [Solver Interface Testing](../architecture/solver-interface-testing.md) -- conformance test suite for `SolverInterface` trait; pairs with `solver-interface-trait.md` already in the list.
- [Solver CLP Implementation](../architecture/solver-clp-impl.md) -- the CLP backend is deferred from minimal viable, but reading the CLP impl spec during Phase 3 provides insight into the abstraction boundary and helps ensure the HiGHS adapter does not accidentally encode HiGHS-specific assumptions into the trait interface.

**Phase 4 (cobre-comm)** -- add 1 spec:

- [Backend Testing](../hpc/backend-testing.md) -- conformance test suite for all Communicator backends; the Phase 4 integration test (4-rank allgatherv round-trip) is defined here.

**Phase 5 (cobre-stochastic)** -- add 1 spec:

- [Sampling Scheme Testing](../architecture/sampling-scheme-testing.md) -- conformance tests for the `SamplingScheme` trait; pairs with `sampling-scheme-trait.md` already in the list.

**Phase 6 (cobre-sddp training)** -- add 7 specs:

- [Block Formulations](../math/block-formulations.md) -- load block structure used in LP construction.
- [Discount Rate](../math/discount-rate.md) -- discount factor applied to future-cost functions; used in cut coefficient computation.
- [Risk Measure Testing](../architecture/risk-measure-testing.md) -- conformance tests for `RiskMeasure` trait.
- [Horizon Mode Testing](../architecture/horizon-mode-testing.md) -- conformance tests for `HorizonMode` trait.
- [Cut Selection Testing](../architecture/cut-selection-testing.md) -- conformance tests for `CutSelectionStrategy` trait.
- [Stopping Rule Testing](../architecture/stopping-rule-testing.md) -- conformance tests for `StoppingRule` trait.
- [Extension Points](../architecture/extension-points.md) -- documents the trait extension architecture; reading it during Phase 6 helps implementers understand which design decisions are frozen vs. extensible.

**Phase 7 (simulation + output)** -- add 1 spec:

- [Production Scale Reference](../overview/production-scale-reference.md) -- benchmark targets for the full train+simulate cycle; the Phase 7 integration test should validate against these scale parameters.

**Phase 8 (cobre-cli)** -- add 1 spec:

- [Ecosystem Guidelines](../overview/ecosystem-guidelines.md) -- authoring conventions and invariant checklist; relevant to Phase 8 because the CLI wires together all crates and the ecosystem guidelines document the cross-cutting contracts that the integration must respect.

**Specs confirmed as correctly excluded** (no additions needed):

- `interfaces/mcp-server.md`, `interfaces/python-bindings.md`, `interfaces/terminal-ui.md` -- deferred crate specs
- `hpc/backend-shm.md`, `hpc/backend-tcp.md` -- deferred backend specs
- `deferred.md` -- meta-document for deferred features
- `cross-reference-index.md` -- navigation index, not an implementation spec
- `overview/implementation-ordering.md` -- self-reference; already linked in section 1
- `overview/spec-gap-inventory.md` -- historical audit trail, not implementation reading
- `math/infinite-horizon.md` -- the Cyclic horizon mode is deferred; no Phase 6 work depends on it

### Inputs/Props

- Current file: `src/specs/overview/implementation-ordering.md` (232 lines)
- Cross-reference index section 1 (crate ownership): `src/specs/cross-reference-index.md`

### Outputs/Behavior

The 8 phase reading lists in section 5 of `implementation-ordering.md` are updated to include the 15 additional specs listed above, inserted in a logical position within each phase's existing list (testing specs after their corresponding trait spec, foundational specs at the beginning of the list).

### Error Handling

Not applicable (documentation-only change).

### Out of Scope

- No changes to sections 1-4, 6-8 of `implementation-ordering.md` (the Crate Dependency Graph, Minimal Viable Definition, Crates Required table, Trait Variant Selection, System Element Scope, and Cross-References sections are unchanged).
- No changes to the Phase Dependency Summary ASCII DAG.
- No changes to any other file. The cross-reference index is not updated in this ticket (it already lists all 76+ specs).
- No blocker language cleanup (already completed in epic-01).
- No reordering of existing entries in the reading lists -- only additions.

## Acceptance Criteria

- [ ] Given the current `src/specs/overview/implementation-ordering.md`, when `grep -c "notation-conventions" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Notation Conventions added to Phase 1).
- [ ] Given the current file, when `grep -c "hydro-production-models" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Hydro Production Models added to Phase 1).
- [ ] Given the current file, when `grep -c "solver-interface-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Solver Interface Testing added to Phase 3).
- [ ] Given the current file, when `grep -c "solver-clp-impl" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Solver CLP Implementation added to Phase 3).
- [ ] Given the current file, when `grep -c "backend-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Backend Testing added to Phase 4).
- [ ] Given the current file, when `grep -c "sampling-scheme-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Sampling Scheme Testing added to Phase 5).
- [ ] Given the current file, when `grep -c "block-formulations" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Block Formulations added to Phase 6).
- [ ] Given the current file, when `grep -c "discount-rate" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Discount Rate added to Phase 6).
- [ ] Given the current file, when `grep -c "risk-measure-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Risk Measure Testing added to Phase 6).
- [ ] Given the current file, when `grep -c "horizon-mode-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Horizon Mode Testing added to Phase 6).
- [ ] Given the current file, when `grep -c "cut-selection-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Cut Selection Testing added to Phase 6).
- [ ] Given the current file, when `grep -c "stopping-rule-testing" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Stopping Rule Testing added to Phase 6).
- [ ] Given the current file, when `grep -c "extension-points" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Extension Points added to Phase 6).
- [ ] Given the current file, when `grep -c "production-scale-reference" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Production Scale Reference added to Phase 7).
- [ ] Given the current file, when `grep -c "ecosystem-guidelines" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (Ecosystem Guidelines added to Phase 8).
- [ ] Given the updated file, when `mdbook build` is run from the repo root, then the build succeeds with exit code 0.
- [ ] Given the updated file, when all reading list links are checked, then every relative link resolves to an existing file (no broken links).

## Implementation Guide

### Suggested Approach

1. Read the current Phase 1-8 reading list rows (lines 84-155 of the file).
2. For each phase, insert the new specs into the existing comma-separated reading list in the `**Spec reading list**` table cell. Place testing specs immediately after their corresponding trait spec. Place foundational/overview specs at the beginning of the list.
3. The format for each entry is: `[Display Name](../relative/path.md)` separated by commas and spaces within the same table cell.
4. Verify all 15 additions are present with the grep checks from the acceptance criteria.
5. Run `mdbook build` to confirm no broken links.

### Key Files to Modify

- `src/specs/overview/implementation-ordering.md` -- the only file modified

### Patterns to Follow

- The existing reading list entries use the format `[Human-Readable Name](../section/filename.md)`. Follow the same format.
- Testing specs are named `[Trait Name Testing]` (e.g., `[Solver Interface Testing]`). Follow the same naming pattern.
- Overview specs follow the display name from their `# Title` heading.
- Entries within a phase's reading list are comma-separated in a single table cell. Do not introduce line breaks within the cell.

### Pitfalls to Avoid

- Do not use `§` or `SS` prefixes in any prose or heading in this file. Overview specs use plain numbered headings only.
- Do not modify the Phase Dependency Summary ASCII DAG.
- Do not reorder existing entries -- only append or insert new ones.
- Do not add specs for deferred crates (mcp-server, python-bindings, terminal-ui, backend-shm, backend-tcp).
- Do not add `infinite-horizon.md` to Phase 6 -- the Cyclic variant is deferred.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only).

### Integration Tests

- Run `mdbook build` from the repo root and confirm exit code 0.
- Run the 15 `grep -c` checks from the acceptance criteria and confirm each returns >= 1.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-005-fix-section-prefix-low-count-and-openmp-audit.md (epic-02 consistency pass must be complete so the file inventory is finalized)
- **Blocks**: ticket-007-add-minimum-viable-reading-list.md (MVRL is curated from the complete reading lists)

## Effort Estimate

**Points**: 2
**Confidence**: High
