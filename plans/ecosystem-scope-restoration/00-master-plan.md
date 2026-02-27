# Master Plan: Ecosystem Scope Restoration

## Executive Summary

The Cobre specification corpus has progressively narrowed its framing from "a power system analysis and optimization ecosystem" to "an HPC SDDP solver." This plan restores the correct scope by addressing two layers of drift: (1) framing drift in crate overviews, purpose paragraphs, and overview docs where generic infrastructure is described in SDDP-specific terms, and (2) architectural drift where the `SolverInterface` trait uses SDDP-specific method names and the LP layout uses SDDP-specific terminology for generic LP operations. The plan also creates a new ecosystem vision document that describes the broader power system analysis and optimization mission.

## Goals & Non-Goals

### Goals

1. Restore generic framing in all crate overview files (`src/crates/*.md`)
2. Restore generic framing in overview spec files (`ecosystem-guidelines.md`)
3. Update `CLAUDE.md` project description to reflect the ecosystem scope
4. Redesign the LP layout in `solver-abstraction.md` to use fully generic terminology (named constraint regions, arbitrary constraint types)
5. Rename `SolverInterface` methods from SDDP-specific names to generic LP operations
6. Update all downstream specs that reference renamed methods/concepts
7. Reframe `cobre-stochastic` and `sampling-scheme-trait.md` as a general scenario generation framework
8. Create `src/specs/overview/ecosystem-vision.md` describing the full power system analysis and optimization ecosystem
9. Update the cross-reference index with the new ecosystem-vision.md entry

### Non-Goals

- Changing behavioral contracts (only names and framing change)
- Writing Rust code (all deliverables are `.md` files)
- Adding new traits or capabilities
- Modifying mathematical formulations
- Changing data model schemas
- Introducing abstraction overhead in spec design
- Modifying test fixture data (only test names and references change)

## Architecture Overview

### Current State

- Crate overviews describe generic infrastructure in SDDP-specific terms (e.g., "in-memory data model for SDDP studies")
- `solver-abstraction.md` LP layout uses "cut rows" and "Benders cuts" terminology
- `SolverInterface` trait has methods named `add_cut_rows` (SDDP-specific)
- `cobre-stochastic` is framed exclusively as SDDP scenario generation
- `ecosystem-guidelines.md` line 23 says "an HPC SDDP solver written in Rust"
- `CLAUDE.md` says "an HPC SDDP solver written in Rust"
- No document describes the broader ecosystem vision

### Target State

- Crate overviews describe capabilities in domain-generic terms
- `solver-abstraction.md` uses "dynamic constraint region" and generic LP terminology
- `SolverInterface` trait has methods named with generic LP operations
- `cobre-stochastic` is framed as a general scenario generation framework
- `ecosystem-guidelines.md` and `CLAUDE.md` describe "a power system analysis and optimization ecosystem"
- `ecosystem-vision.md` exists and describes the full vision (SDDP as first vertical)

### Key Design Decisions

#### SolverInterface Method Mapping

After analyzing the current method signatures in `solver-interface-trait.md`:

| Current Method     | Current Parameter               | Proposed Method  | Proposed Parameter              | Rationale                                                    |
| ------------------ | ------------------------------- | ---------------- | ------------------------------- | ------------------------------------------------------------ |
| `add_cut_rows`     | `cuts: &CutBatch`               | `add_rows`       | `rows: &RowBatch`               | Generic batch row addition; SDDP wraps this for Benders cuts |
| `patch_row_bounds` | `patches: &[(usize, f64, f64)]` | `set_row_bounds` | `patches: &[(usize, f64, f64)]` | Generic RHS update; same signature, clearer name             |
| `patch_col_bounds` | `patches: &[(usize, f64, f64)]` | `set_col_bounds` | `patches: &[(usize, f64, f64)]` | Generic variable bound update; same signature, clearer name  |

The remaining methods (`load_model`, `solve`, `solve_with_basis`, `reset`, `get_basis`, `statistics`, `name`) are already generic and need no renaming.

**Type renames:**

- `CutBatch` -> `RowBatch` (CSR row data for batch addition)
- `StageTemplate` stays (owned by `cobre-solver`, SDDP-specific construction stays in `cobre-sddp`)

#### LP Layout Region Naming

| Current Term                       | Proposed Term               | Rationale                                                     |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------- |
| "cut rows" / "Benders cuts" region | "dynamic constraint rows"   | Constraints added/removed at runtime via `add_rows`           |
| "structural rows"                  | "static constraint rows"    | Constraints present in the base model, never removed          |
| "cut-relevant constraints"         | "dual-relevant constraints" | Constraints whose duals contribute to subgradient computation |
| "Top region"                       | "Dual-extraction region"    | Generic: the rows whose duals feed gradient computation       |
| "Middle region"                    | "Static non-dual region"    | Generic: structural constraints not needed for gradients      |
| "Bottom region"                    | "Dynamic constraint region" | Generic: rows added at runtime via batch `add_rows`           |

**Key principle:** The layout becomes describable as "static rows on top, dynamic rows at bottom" -- an LP construction pattern used in column generation, Benders decomposition, Dantzig-Wolfe, and other decomposition methods. SDDP's Benders cuts are an instance of this pattern.

## Technical Approach

### Tech Stack

- mdBook (markdown documentation)
- No code changes

### Component Breakdown

| Epic                           | Scope                                | Files Modified | Complexity |
| ------------------------------ | ------------------------------------ | -------------- | ---------- |
| Epic 01: Framing Restoration   | Documentation-only prose updates     | 10 files       | Low-medium |
| Epic 02: Solver Generalization | LP layout redesign + method renaming | 8 files        | High       |
| Epic 03: Stochastic & Vision   | Stochastic reframe + new vision doc  | 6 files        | Medium     |

### Data Flow

Changes propagate in dependency order:

1. `solver-abstraction.md` (defines LP layout and terminology) must be updated first
2. `solver-interface-trait.md` (defines method names referencing the layout) depends on #1
3. Implementation specs (`solver-highs-impl.md`, `solver-clp-impl.md`) reference both #1 and #2
4. Testing spec (`solver-interface-testing.md`) references method names from #2
5. `training-loop.md` references method names from #2
6. `solver-workspaces.md` references layout terminology from #1
7. Crate overviews reference all of the above
8. Cross-reference index references all files

### Testing Strategy

Each ticket includes verification steps:

- `mdbook build` must pass after each ticket
- `grep` for SDDP-specific terms that should have been replaced
- Cross-reference link integrity (no broken links)
- Convention compliance (SS/section prefix rules, convention blockquote)

## Phases & Milestones

| Phase | Epic                           | Duration  | Milestone                                                   |
| ----- | ------------------------------ | --------- | ----------------------------------------------------------- |
| 1     | Epic 01: Framing Restoration   | 1-2 weeks | All crate overviews and overview specs use generic framing  |
| 2     | Epic 02: Solver Generalization | 2-3 weeks | LP layout and SolverInterface use generic terminology       |
| 3     | Epic 03: Stochastic & Vision   | 1-2 weeks | Ecosystem vision document exists; stochastic crate reframed |

## Risk Analysis

| Risk                                     | Probability | Impact | Mitigation                                             |
| ---------------------------------------- | ----------- | ------ | ------------------------------------------------------ |
| Broken cross-references after renaming   | Medium      | High   | Each ticket includes link verification step            |
| Accidental behavioral contract change    | Low         | High   | Acceptance criteria explicitly forbid contract changes |
| SS/section-prefix convention violation   | Medium      | Medium | Each ticket includes convention compliance check       |
| Inconsistent terminology across files    | Medium      | Medium | Epic 02 tickets ordered by dependency chain            |
| SDDP-specific terms missed during search | Low         | Medium | Comprehensive grep verification in final tickets       |

## Success Metrics

1. Zero instances of "SDDP" in crate overview purpose paragraphs (except where contextually correct as "first vertical")
2. `solver-abstraction.md` LP layout describable without SDDP domain knowledge
3. `SolverInterface` method names are natural for any LP use case
4. `ecosystem-vision.md` describes power flow, OPF, dynamic simulation, and SDDP as verticals
5. `CLAUDE.md` and `ecosystem-guidelines.md` describe the ecosystem, not just the SDDP solver
6. `mdbook build` passes with no new warnings
7. All cross-reference links resolve correctly
