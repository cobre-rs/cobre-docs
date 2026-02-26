# ticket-020 Create Spec Gap Inventory

## Context

### Background

The Cobre specification corpus (72 files across 6 sections) has been fully formalized and audited. Six trait specs with conformance tests were added in epics 01-03, and a consistency pass in epic 04 resolved all cross-reference errors, naming inconsistencies, `§` convention violations, and stale crate overview counts. The corpus is internally consistent.

However, internal consistency does not guarantee implementation readiness. A specification can be self-consistent yet still contain ambiguities, underspecified interfaces, missing error handling details, or implicit assumptions that would force a developer to stop coding and ask questions. This document catalogs every such gap, scoped specifically to what would block the minimal viable SDDP solver defined by stakeholder requirements.

### Relation to Epic

This is the second of two analysis documents in Epic 05 (Implementation Readiness Assessment). The implementation ordering (ticket-019) answers "what order"; this ticket answers "what's missing." Together they form the transition artifact from specification to implementation. The gap inventory is deliberately sequenced after the implementation ordering because the act of planning the build order may surface additional gaps (e.g., missing crate interface specifications, unclear data flow between phases).

### Current State

- No `src/specs/overview/spec-gap-inventory.md` file exists.
- The 72 spec files cover: 3 overview, 14 math, 10 data-model, 24 architecture (including 12 trait/testing), 14 HPC, 1 configuration, 4 interfaces, 1 deferred.
- Learnings from epics 01-04 have surfaced several known areas of concern:
  - Dominated strategy 7.7G FLOP cost in `cut-selection-trait.md` SS6.4 flagged as performance risk requiring feature flag
  - `Result`-returning hot-path methods (`solve`, `solve_with_basis`) require separate error-path benchmarks
  - Dual normalization requires verification by sensitivity check in `solver-interface-testing.md` SS5
  - The `src/crates/*.md` files sometimes lag behind `src/specs/` changes (e.g., stale contract counts found in epic-04)
- Stakeholder review has scoped the gap inventory to the minimal viable SDDP solver (see Specification below).

## Specification

### Requirements

Create `src/specs/overview/spec-gap-inventory.md` with the following sections:

1. **Purpose** -- One paragraph explaining this document catalogs specification gaps that would block implementation of the minimal viable SDDP solver.

2. **Scope and Classification** -- Define the scope (minimal viable solver only, per stakeholder requirements) and the severity classification:

   | Severity | Definition                                                                                                                  | Action Required                      |
   | -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
   | Blocker  | Implementation cannot proceed without resolving this gap. Missing information, contradictory specs, or undefined interface. | Must resolve before coding starts    |
   | High     | Implementation can start but will be blocked before completion. Ambiguous behavior, missing edge case handling.             | Must resolve during implementation   |
   | Medium   | Implementation can complete but result may be incorrect or suboptimal. Missing performance constraints, unclear defaults.   | Should resolve during implementation |
   | Low      | Implementation can complete correctly. Missing documentation, unclear rationale, cosmetic issues.                           | Resolve opportunistically            |

3. **Gap Inventory Table** -- The core of the document. A table with columns:
   - **ID**: Sequential gap identifier (GAP-001, GAP-002, ...)
   - **Severity**: Blocker / High / Medium / Low
   - **Affected Crate(s)**: Which crate(s) are blocked
   - **Spec File(s)**: Which specification file(s) contain the gap
   - **Section(s)**: Specific section numbers where the gap exists
   - **Description**: What is missing, ambiguous, or contradictory
   - **Resolution Path**: How to resolve (e.g., "add missing section to spec X", "stakeholder decision needed", "implementation will determine")

   The author must systematically review the specs for the 8 crates required by the minimal viable solver (cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-comm, cobre-cli, ferrompi) and identify gaps. The review should cover:
   - **Crate interface gaps**: Are the public API boundaries between crates fully specified? Can a developer implement crate A's output types and crate B's input types and be confident they match?
   - **Data flow gaps**: Is the data flow from input loading through training/simulation to output writing fully traced? Are there handoff points where the spec says "data is passed to X" without specifying the exact types or format?
   - **Error handling gaps**: For each `Result`-returning method in the trait specs, is the error recovery path specified? Are there methods that should return `Result` but currently assume infallibility?
   - **Configuration gaps**: Are all configuration parameters for the minimal viable solver defined in `configuration-reference.md`? Are there algorithm parameters embedded in prose that should be configurable?
   - **Test infrastructure gaps**: Are the conformance test specs implementable? Do they reference test fixtures that are not yet defined?
   - **Performance specification gaps**: Are there performance-critical paths without target metrics or memory budgets?

4. **Key decisions resolved by stakeholder review** -- A section explicitly documenting which potential gaps are NOT gaps because stakeholder review resolved them:
   - Deferred features (Python, TUI, MCP, TCP/shm, CVaR, Cyclic horizon, etc.) are NOT gaps -- they are explicitly out of scope
   - However, deferred features that require architectural hooks in the minimal viable (e.g., trait dispatch infrastructure, crate boundary interfaces) ARE gaps if the hook is underspecified
   - "Real crates, real boundaries" means any spec gap in crate interfaces IS a blocker even if the feature behind it is deferred

5. **Known Performance Risks** -- A dedicated section for performance-related gaps identified in the learnings:
   - Dominated strategy FLOP cost (from `cut-selection-trait.md` SS6.4 learnings)
   - `Result`-returning hot-path methods requiring error-path benchmarks
   - Any other performance specifications that are missing baselines or targets

6. **Summary Statistics** -- A table counting gaps by severity and by crate, providing a quick overview of implementation readiness.

7. **Cross-References** -- Standard cross-reference section (minimum 10 entries). Must reference at minimum: `implementation-ordering.md` (the companion document), `cross-reference-index.md`, the trait specs with identified gaps, `production-scale-reference.md` (performance baselines), `configuration-reference.md`.

### Inputs/Props

The author must systematically read:

- All `src/specs/` files for the 8 required crates (use the per-crate reading lists from `cross-reference-index.md` section 2)
- All `src/crates/*.md` files for the 8 required crates
- The accumulated learnings file (`plans/spec-readiness/learnings/epic-04-summary.md`) for known issues
- The implementation ordering document (`src/specs/overview/implementation-ordering.md`, created by ticket-019) for phase dependencies

### Outputs/Behavior

A single new file: `src/specs/overview/spec-gap-inventory.md`

The document must be:

- Valid mdBook Markdown (renders correctly with `mdbook build`)
- Comprehensive within the minimal viable scope (every blocker and high-severity gap identified)
- Actionable (every gap has a resolution path)
- Scoped (deferred features are explicitly excluded unless their architectural hooks are underspecified)

### Error Handling

Not applicable (documentation file, no runtime behavior).

## Acceptance Criteria

- [ ] Given the file `src/specs/overview/spec-gap-inventory.md` does not exist, when the ticket is completed, then the file exists and contains all 7 sections listed in Requirements
- [ ] Given the Scope and Classification section, when severity definitions are read, then each of the four levels (Blocker, High, Medium, Low) has a clear definition and action-required statement
- [ ] Given the Gap Inventory Table, when each gap entry is examined, then every entry has all 7 columns populated (ID, Severity, Affected Crate(s), Spec File(s), Section(s), Description, Resolution Path)
- [ ] Given the Gap Inventory Table, when the affected crates are aggregated, then only the 8 crates required for the minimal viable solver appear (cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-comm, cobre-cli, ferrompi)
- [ ] Given the "Key decisions resolved by stakeholder review" section, when read, then it explicitly states that deferred features are not gaps and that architectural hooks for deferred features are gaps if underspecified
- [ ] Given the Known Performance Risks section, when compared to the epic-04 learnings summary, then the dominated strategy FLOP cost and `Result`-returning hot-path methods are listed
- [ ] Given the Summary Statistics table, when totals are computed from the Gap Inventory Table, then the summary counts match the detailed table exactly
- [ ] Given the Cross-References section, when each referenced file is checked, then all file paths resolve to existing files and section numbers are valid
- [ ] Given the completed document, when a developer reads only this file and the implementation ordering, then they can enumerate every decision that must be made before implementation begins (blocker gaps) and every ambiguity that will need resolution during implementation (high gaps)

## Implementation Guide

### Suggested Approach

1. Start by reading the implementation ordering document (ticket-019 output) to understand the phase structure and which specs matter for each phase
2. For each of the 8 required crates, work through the per-crate reading list from `cross-reference-index.md` section 2
3. For each spec in the reading list, ask: "Could a developer implement this section in Rust right now, without asking any questions?" If not, log a gap
4. Pay special attention to:
   - Type boundaries between crates (what exact Rust types cross crate boundaries?)
   - Method signatures that are described in prose but not in trait specs
   - Configuration parameters mentioned in architecture specs but not in `configuration-reference.md`
   - Error conditions mentioned in prose but not in error type enums
   - Performance claims without supporting numbers or benchmarks
5. After completing the per-crate review, review the gaps for completeness and assign severity levels
6. Write the stakeholder-resolved section to explicitly exclude deferred features
7. Write the performance risks section from the learnings
8. Compute summary statistics and write the cross-references

### Key Files to Modify

- **Create**: `src/specs/overview/spec-gap-inventory.md`

### Key Files to Read

All files listed in `cross-reference-index.md` section 2 for the 8 required crates. The most critical files to examine for gaps (based on their complexity and cross-crate nature):

- `src/specs/architecture/training-loop.md` -- most connected spec (27 incoming refs), coordinates all crates
- `src/specs/architecture/solver-abstraction.md` -- cobre-solver API surface
- `src/specs/architecture/solver-interface-trait.md` -- formal solver trait (Result types, error paths)
- `src/specs/architecture/input-loading-pipeline.md` -- cobre-io to cobre-core handoff
- `src/specs/architecture/scenario-generation.md` -- cobre-stochastic API
- `src/specs/architecture/cut-management-impl.md` -- cut pool data structures
- `src/specs/architecture/simulation-architecture.md` -- simulation data flow
- `src/specs/hpc/communicator-trait.md` -- cobre-comm API surface
- `src/specs/hpc/backend-ferrompi.md` -- MPI backend details
- `src/specs/configuration/configuration-reference.md` -- all config parameters
- `src/specs/data-model/internal-structures.md` -- cobre-core internal types
- `src/specs/data-model/output-schemas.md` -- output format definitions
- `src/specs/math/lp-formulation.md` -- LP structure that solver must implement
- `plans/spec-readiness/learnings/epic-04-summary.md` -- known issues from earlier epics

### Patterns to Follow

- **Section heading style**: Use `## N. Section Title` numbered sections, consistent with other overview specs
- **Gap ID format**: `GAP-001`, `GAP-002`, etc. Sequential, never reused
- **Cross-reference format**: Same as all overview specs -- relative paths from `src/specs/overview/`
- **Table formatting**: Left-align text columns. Keep Description and Resolution Path columns concise (1-2 sentences each; longer explanations go in a footnote or sub-section)

### Pitfalls to Avoid

- Do NOT flag deferred features as gaps. Python bindings, TUI, MCP server, TCP/shm backends, CVaR, Cyclic horizon, LML1 cut selection, External/Historical sampling are all explicitly out of scope for the minimal viable solver.
- Do NOT flag architectural hooks for deferred features as gaps UNLESS the hook itself is underspecified. The trait dispatch infrastructure must be in place (requirement 1: "full flexibility architecture"), but only one variant needs to work.
- Do NOT use `SS` or `§` prefixes for section numbers in this file. Overview files use plain numbered sections.
- Do NOT include gaps in `cobre-python`, `cobre-tui`, or `cobre-mcp`. These crates are deferred.
- Do NOT forget to check `configuration-reference.md` -- configuration gaps are easy to miss because parameters are often mentioned in architecture specs without being listed in the config spec.
- Do NOT overcount: if the same gap affects multiple crates, log it once with all affected crates listed, not once per crate.

## Testing Requirements

### Unit Tests

Not applicable (documentation file).

### Integration Tests

Not applicable (documentation file).

### Verification Checks

- Verify every gap references an actual spec file and section that exists
- Verify the summary statistics match the detailed table
- Verify no gap references a deferred crate (cobre-python, cobre-tui, cobre-mcp)
- Verify all cross-reference links resolve to existing files

## Dependencies

- **Blocked By**: ticket-015 through ticket-018 (epic-04 consistency pass); ticket-019 (implementation ordering may reveal additional gaps)
- **Blocks**: ticket-021 (SUMMARY and cross-reference-index update)

## Effort Estimate

**Points**: 3
**Confidence**: Medium (the number of gaps is unknown until the review is complete, but the scope is well-defined by the stakeholder requirements; the work is bounded by the 8-crate scope)
