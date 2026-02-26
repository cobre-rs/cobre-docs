# ticket-019 Create Implementation Ordering Document

## Context

### Background

All 72 specification files in the Cobre corpus have been formalized, cross-referenced, and consistency-audited through epics 01-04. Six trait specs (RiskMeasure, HorizonMode, SamplingScheme, CutSelectionStrategy, StoppingRule, SolverInterface) with their conformance test specs are complete. The cross-reference index tracks all 72 specs with their crate mappings, reading lists, and dependency ordering. The spec corpus is now internally consistent and ready for implementation planning.

The next step is to translate the specification corpus into a concrete implementation roadmap. Developers need to know: which crate to implement first, what the minimal working system looks like, and how to build incrementally toward production capability. This document bridges the gap between "specs are done" and "start coding."

### Relation to Epic

This is one of two analysis documents in Epic 05 (Implementation Readiness Assessment). Together with the spec gap inventory (ticket-020), it provides the transition from specification to implementation. This ticket focuses on the "what order" question; ticket-020 focuses on the "what's missing" question.

### Current State

- No `src/specs/overview/implementation-ordering.md` file exists.
- The dependency graph in `src/crates/overview.md` shows the 11-crate structure with `cobre-cli` at the top, `cobre-core` at the bottom, and `cobre-comm` encapsulating `ferrompi`.
- The cross-reference index (`src/specs/cross-reference-index.md`) section 2 has per-crate reading lists already ordered by dependency. Section 1 has the crate-to-spec mapping table (72 specs).
- The `src/crates/*.md` files each describe one crate's responsibilities, dependencies, public API surface, and status ("design phase").
- Stakeholder review has defined 8 requirements for the Minimal Viable SDDP Solver (see Specification below).

## Specification

### Requirements

Create `src/specs/overview/implementation-ordering.md` with the following sections:

1. **Purpose** -- One paragraph explaining this document bridges specification to implementation.

2. **Crate Dependency Graph** -- A Mermaid diagram (mdBook supports Mermaid via `mdbook-mermaid`) showing the 11 crate dependency relationships. Use the graph from `src/crates/overview.md` as the source of truth but render it as a proper directed graph with feature-flag annotations on edges (e.g., `cobre-comm --"mpi"--> ferrompi`). Include only the build-time dependency direction (arrow from dependent to dependency).

3. **Minimal Viable SDDP Solver Definition** -- A numbered list of the 8 stakeholder requirements that define the minimal implementation target. These are:
   1. Full architecture, one variant per trait (Expectation, Level-1, Finite, InSample)
   2. Real crates, real boundaries (all 11 crate boundaries respected)
   3. MPI-first production binary (`mpiexec -n N` invocation, no Python/TUI/MCP/TCP/shm)
   4. Minimal system elements (Buses + Lines + Thermals + Hydros only)
   5. Constant hydro productivity only
   6. Single scenario input path (deferred: PAR fitting, history, external)
   7. Training + simulation + parallel + reproducibility required
   8. Full output chain via cobre-io following spec schemas

4. **Crates Required for Minimal Viable** -- A table listing which of the 11 crates are needed for the minimal viable solver, their role in that context, and which are explicitly deferred. Based on requirement 3 (MPI-first), the required crates are: `cobre-core`, `cobre-io`, `cobre-stochastic`, `cobre-solver`, `cobre-sddp`, `cobre-comm` (MPI feature only), `cobre-cli`, `ferrompi`. The deferred crates are: `cobre-python`, `cobre-tui`, `cobre-mcp`.

5. **Implementation Phases** -- Break the minimal viable into ordered phases, where each phase produces a testable intermediate artifact. Each phase must specify:
   - **Crates involved** (which crates are implemented or extended in this phase)
   - **What becomes testable** (what integration test or end-to-end test becomes possible after this phase)
   - **Blocked by** (which preceding phases must complete)
   - **Spec reading list** (references to the per-crate reading lists in cross-reference-index.md section 2)

   The phases should follow the bottom-up dependency order. A reasonable decomposition (the author should validate and adjust based on actual spec analysis):
   - Phase 1: `cobre-core` (data model, entity registries, internal structures)
   - Phase 2: `cobre-io` (input loading, validation) -- testable: load a case directory and produce internal structures
   - Phase 3: `cobre-solver` + `ferrompi` (LP abstraction with HiGHS backend, MPI bindings) -- testable: solve a single-stage LP
   - Phase 4: `cobre-comm` (MPI backend via ferrompi) -- testable: multi-rank allreduce/allgatherv
   - Phase 5: `cobre-stochastic` (PAR preprocessing, opening tree, InSample sampling) -- testable: generate scenarios for a test case
   - Phase 6: `cobre-sddp` (training loop, forward/backward pass, cut management, convergence) -- testable: run training on a minimal case
   - Phase 7: `cobre-sddp` simulation + `cobre-io` output (simulation pipeline, Parquet output) -- testable: full training + simulation cycle
   - Phase 8: `cobre-cli` (lifecycle, config parsing, exit codes) -- testable: `mpiexec -n N cobre CASE_DIR` end-to-end

6. **Trait Variant Selection** -- A table mapping each trait to its minimal-viable variant, referencing the trait spec file. This codifies stakeholder requirement 1:

   | Trait                | Minimal Variant | Spec File                   |
   | -------------------- | --------------- | --------------------------- |
   | RiskMeasure          | Expectation     | `risk-measure-trait.md`     |
   | CutSelectionStrategy | Level-1         | `cut-selection-trait.md`    |
   | HorizonMode          | Finite          | `horizon-mode-trait.md`     |
   | SamplingScheme       | InSample        | `sampling-scheme-trait.md`  |
   | StoppingRule         | All (composite) | `stopping-rule-trait.md`    |
   | SolverInterface      | HiGHS           | `solver-interface-trait.md` |
   | Communicator         | MPI (ferrompi)  | `communicator-trait.md`     |

7. **System Element Scope** -- A table listing which system elements are fully implemented vs. stub-only for the minimal viable, referencing stakeholder requirement 4:

   | Element          | Minimal Status | Notes                               |
   | ---------------- | -------------- | ----------------------------------- |
   | Bus              | Full           | Required for network topology       |
   | Line             | Full           | Required for network constraints    |
   | Thermal          | Full           | Required for generation dispatch    |
   | Hydro            | Full           | Constant productivity only (req. 5) |
   | Contract         | Stub (NO-OP)   | Code path exists, no logic          |
   | Pumping Station  | Stub (NO-OP)   | Code path exists, no logic          |
   | Non-Controllable | Stub (NO-OP)   | Code path exists, no logic          |

8. **Cross-References** -- Standard cross-reference section following the established pattern (minimum 10 entries, each with file path, sections, and one-line description). Must reference at minimum: `crates/overview.md`, `cross-reference-index.md`, all trait spec files, `cli-and-lifecycle.md`, `training-loop.md`, `simulation-architecture.md`.

### Inputs/Props

The author must consult:

- `src/crates/overview.md` -- dependency graph (source of truth for crate relationships)
- `src/specs/cross-reference-index.md` section 1 -- crate-to-spec mapping
- `src/specs/cross-reference-index.md` section 2 -- per-crate reading lists
- All 12 `src/crates/*.md` files -- crate responsibilities and public API surfaces
- The 8 stakeholder requirements listed in the epic overview

### Outputs/Behavior

A single new file: `src/specs/overview/implementation-ordering.md`

The document must be:

- Valid mdBook Markdown (renders correctly with `mdbook build`)
- Self-contained (a developer can read it without prior context and understand the implementation plan)
- Consistent with the crate dependency graph in `src/crates/overview.md`
- Consistent with the stakeholder requirements in the epic overview

### Error Handling

Not applicable (documentation file, no runtime behavior).

## Acceptance Criteria

- [ ] Given the file `src/specs/overview/implementation-ordering.md` does not exist, when the ticket is completed, then the file exists and contains all 8 sections listed in Requirements
- [ ] Given the Mermaid dependency graph in section 2, when compared to `src/crates/overview.md`, then every crate-to-crate dependency in the overview is represented in the Mermaid graph with correct direction and feature annotations
- [ ] Given the Minimal Viable SDDP Solver Definition in section 3, when compared to the 8 stakeholder requirements in the epic overview, then all 8 requirements are present and accurately stated
- [ ] Given the Crates Required table in section 4, when the MPI-first requirement (3) is applied, then `cobre-python`, `cobre-tui`, and `cobre-mcp` are listed as deferred, and the remaining 8 crates (core, io, stochastic, solver, sddp, comm, cli, ferrompi) are listed as required
- [ ] Given the Implementation Phases in section 5, when the phase dependency chain is followed, then no phase references a crate that is not yet available from a preceding phase
- [ ] Given the Trait Variant Selection table in section 6, when each variant is checked against the corresponding trait spec file, then the listed variant exists as a defined variant in that spec
- [ ] Given the System Element Scope table in section 7, when checked against stakeholder requirement 4, then Buses, Lines, Thermals, and Hydros are marked "Full" and all other element types are marked "Stub (NO-OP)"
- [ ] Given the Cross-References section, when the referenced files are checked, then all file paths resolve to existing files in the repository and section numbers are valid
- [ ] Given the completed document, when `mdbook build` is run, then the build succeeds without warnings related to this file (note: the file must be added to SUMMARY.md in ticket-021 for mdbook to process it, but the Markdown itself must be syntactically valid)

## Implementation Guide

### Suggested Approach

1. Start by reading `src/crates/overview.md` to internalize the dependency graph
2. Read each of the 12 `src/crates/*.md` files to understand what each crate owns
3. Draft the Mermaid dependency graph, including feature-flag edges
4. Write the stakeholder requirements section by copying and expanding the 8 points from the epic overview
5. Build the required-vs-deferred crate table by applying requirement 3 (MPI-first)
6. Design the implementation phases bottom-up: start with leaf crates (`cobre-core`, `ferrompi`) and work toward root crates (`cobre-cli`)
7. For each phase, identify the integration test milestone that becomes possible
8. Write the trait variant and system element tables by referencing the specific spec files
9. Compile the cross-references section

### Key Files to Modify

- **Create**: `src/specs/overview/implementation-ordering.md`

### Key Files to Read

- `src/crates/overview.md` -- dependency graph
- `src/crates/core.md`, `src/crates/io.md`, `src/crates/stochastic.md`, `src/crates/solver.md`, `src/crates/sddp.md`, `src/crates/comm.md`, `src/crates/cli.md`, `src/crates/ferrompi.md` -- crate details for the 8 required crates
- `src/crates/python.md`, `src/crates/tui.md`, `src/crates/mcp.md` -- deferred crates (brief reference)
- `src/specs/cross-reference-index.md` sections 1-2 -- crate mappings and reading lists
- `src/specs/architecture/risk-measure-trait.md`, `src/specs/architecture/cut-selection-trait.md`, `src/specs/architecture/horizon-mode-trait.md`, `src/specs/architecture/sampling-scheme-trait.md`, `src/specs/architecture/stopping-rule-trait.md`, `src/specs/architecture/solver-interface-trait.md`, `src/specs/hpc/communicator-trait.md` -- trait specs for variant selection table
- `src/specs/math/system-elements.md`, `src/specs/math/equipment-formulations.md` -- system element types
- `src/specs/architecture/training-loop.md` -- training loop lifecycle (phases 6-7)
- `src/specs/architecture/simulation-architecture.md` -- simulation pipeline (phase 7)
- `src/specs/architecture/cli-and-lifecycle.md` -- CLI lifecycle (phase 8)

### Patterns to Follow

- **Section heading style**: Use `## N. Section Title` numbered sections, consistent with all other overview specs (see `design-principles.md`, `notation-conventions.md`, `production-scale-reference.md`)
- **Cross-reference format**: Use `[Display Name](relative-path)` for mdBook links. Within `src/specs/overview/`, links to other overview files use `./file.md`; links to architecture use `../architecture/file.md`; links to HPC use `../hpc/file.md`; links to crate docs use `../../crates/file.md`
- **Table formatting**: Use consistent column alignment. Left-align text columns, right-align numeric columns
- **Mermaid blocks**: Use ` ```mermaid ` fenced code blocks. Keep node labels short (crate names only). Use `-->` for dependencies with `|feature|` annotations on conditional edges

### Pitfalls to Avoid

- Do NOT use `SS` or `§` prefixes for section numbers in this file. Overview files use plain numbered sections (`## 1.`, `## 2.`, etc.). The `SS` prefix is for architecture specs; `§` is exclusively for HPC specs.
- Do NOT include `cobre-python`, `cobre-tui`, or `cobre-mcp` in the implementation phases. They are explicitly deferred by stakeholder requirement 3.
- Do NOT include TCP or shared memory backends in the communication phase. Only the MPI backend via ferrompi is in scope for the minimal viable (requirement 3).
- Do NOT propose stub implementations that bypass crate boundaries. Requirement 2 explicitly prohibits this: "NO stub implementations that bypass the definitive architecture."
- Do NOT forget that `ferrompi` is a separate repository, not a workspace crate. The implementation phases must account for this.
- Do NOT include CVaR, Cyclic horizon, LML1 cut selection, or External/Historical sampling in the trait variant table. Requirement 1 specifies exactly one variant per trait.

## Testing Requirements

### Unit Tests

Not applicable (documentation file).

### Integration Tests

Not applicable (documentation file).

### Verification Checks

- Verify all Mermaid graph edges match the dependency relationships in `src/crates/overview.md`
- Verify all cross-reference links resolve to existing files
- Verify the phase dependency chain is acyclic and respects the crate dependency graph
- Verify all 8 stakeholder requirements appear in section 3

## Dependencies

- **Blocked By**: ticket-015, ticket-016, ticket-017, ticket-018 (epic-04 consistency pass must complete first)
- **Blocks**: ticket-021 (SUMMARY and cross-reference-index update)

## Effort Estimate

**Points**: 4
**Confidence**: High
