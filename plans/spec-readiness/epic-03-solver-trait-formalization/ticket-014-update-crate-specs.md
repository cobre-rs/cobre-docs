# ticket-014 Update Crate Specs to Reference New Trait Specs

## Context

### Background

The 6 trait specs created across epics 01-03 define formal behavioral contracts for the abstraction points that the SDDP crates implement. The crate specification files (`src/crates/*.md`) are the entry point documentation for each crate and should reference these new trait specs so that implementers can find the contracts relevant to each crate. The pattern is established in `src/crates/comm.md`, which references `communicator-trait.md` in its Key Concepts section.

The 6 trait specs and their crate assignments are:

- `cobre-sddp`: `risk-measure-trait.md`, `horizon-mode-trait.md`, `cut-selection-trait.md`, `stopping-rule-trait.md` (4 trait specs)
- `cobre-solver`: `solver-interface-trait.md` (1 trait spec)
- `cobre-stochastic`: `sampling-scheme-trait.md` (1 trait spec)

### Relation to Epic

Fourth and final ticket in Epic 03. Depends on ticket-013 (cross-reference index must be updated first to ensure consistency between the crate reading lists and the crate spec references).

### Current State

- `src/crates/sddp.md` has a Key Concepts section with bullet points for SDDP algorithm, LP subproblem, system elements, block formulations, hydro production models, cut management, risk measures, stopping rules, training iterations, simulation replays, convergence criteria, FCF structure, and cut selection strategies. The risk measures, stopping rules, and cut selection entries reference only the math specs (e.g., `risk-measures.md`, `stopping-rules.md`, `cut-management.md`), not the new trait specs.
- `src/crates/solver.md` has a Key Concepts section with bullet points for LP layout convention, solver trait interface, solver workspaces, basis warm-starting, and cut pool integration. The "solver trait interface" bullet references `solver-highs-impl.md` and `solver-clp-impl.md` but not the new `solver-interface-trait.md`.
- `src/crates/stochastic.md` has a Key Concepts section with bullet points for PAR(p) preprocessing, correlated noise sampling, opening tree, and external scenario override. No sampling scheme trait reference exists.
- `src/crates/comm.md` has a Key Concepts section with a "Communicator trait" bullet that references `communicator-trait.md` -- this is the pattern to follow.

## Specification

### Requirements

Modify three existing files:

**File 1: `src/crates/sddp.md`**

Update existing Key Concepts bullets to add trait spec references alongside the existing math spec references:

- **Risk measures bullet**: Add a second `See` line: `See also [Risk Measure Trait](../specs/architecture/risk-measure-trait.md) for the formal trait definition and method contracts.`
- **Stopping rules bullet**: Add a second `See` line: `See also [Stopping Rule Trait](../specs/architecture/stopping-rule-trait.md) for the formal trait definition and method contracts.`
- **Cut selection strategies bullet**: Add a `See` line (currently missing): `See [Cut Selection Strategy Trait](../specs/architecture/cut-selection-trait.md) for the formal trait definition and method contracts.`
- **Add a new bullet** for horizon mode (currently not represented in Key Concepts): `- **Horizon mode** -- Determines stage traversal and terminal conditions. Finite horizon uses a linear chain with zero terminal value; cyclic horizon supports periodic policy graphs with discount factors for convergence. See [Horizon Mode Trait](../specs/architecture/horizon-mode-trait.md).`

Place the horizon mode bullet near the existing risk measures and stopping rules bullets (grouped with other abstraction-point concepts).

**File 2: `src/crates/solver.md`**

Update the existing "Solver trait interface" bullet to reference the new formal trait spec:

- Current text references `solver-highs-impl.md` and `solver-clp-impl.md`
- Add a new `See` line: `See [Solver Interface Trait](../specs/architecture/solver-interface-trait.md) for the formal trait definition, method contracts, and error types.`
- Keep the existing references to the implementation specs

**File 3: `src/crates/stochastic.md`**

Add a new Key Concepts bullet for the sampling scheme:

- `- **Sampling scheme** -- Determines how the forward pass selects scenario realizations at each stage. Three variants are supported: in-sample (from the opening tree), external (user-provided scenarios), and historical (from inflow history). See [Sampling Scheme Trait](../specs/architecture/sampling-scheme-trait.md).`

Place this bullet after the existing "Opening tree" bullet (the sampling scheme builds on the opening tree concept).

### Content Guidelines

- Follow the existing Key Concepts bullet format in each crate spec: bold term, en-dash, description, `See [Link](path)` at the end
- Add trait spec references as supplementary "See also" lines when an existing bullet already covers the concept (risk measures, stopping rules, solver trait). This preserves the existing content while adding the new reference.
- Add entirely new bullets only when the concept is missing from Key Concepts (horizon mode in sddp.md, sampling scheme in stochastic.md)
- Do NOT reference the conformance testing specs from crate specs. Crate specs point to trait specs; the trait specs' cross-references already point to testing specs.
- Do NOT reorganize or rewrite existing bullet content. Only add references and new bullets.
- Relative paths from `src/crates/` to `src/specs/architecture/` are `../specs/architecture/`

## Acceptance Criteria

- [ ] Given `src/crates/sddp.md`, when reading Key Concepts, then the risk measures bullet includes a "See also" referencing `risk-measure-trait.md`
- [ ] Given `src/crates/sddp.md`, when reading Key Concepts, then the stopping rules bullet includes a "See also" referencing `stopping-rule-trait.md`
- [ ] Given `src/crates/sddp.md`, when reading Key Concepts, then the cut selection bullet includes a "See" referencing `cut-selection-trait.md`
- [ ] Given `src/crates/sddp.md`, when reading Key Concepts, then a new horizon mode bullet exists referencing `horizon-mode-trait.md`
- [ ] Given `src/crates/solver.md`, when reading Key Concepts, then the solver trait interface bullet includes a "See" referencing `solver-interface-trait.md`
- [ ] Given `src/crates/stochastic.md`, when reading Key Concepts, then a new sampling scheme bullet exists referencing `sampling-scheme-trait.md`
- [ ] Given any modified file, when following the trait spec links, then all links resolve to existing files

## Implementation Guide

### Suggested Approach

1. Read `src/crates/comm.md` Key Concepts section to see the reference pattern for `communicator-trait.md`
2. Read `src/crates/sddp.md` Key Concepts section to identify which bullets need trait spec references and where to insert the new horizon mode bullet
3. Read `src/crates/solver.md` Key Concepts section to identify the "Solver trait interface" bullet
4. Read `src/crates/stochastic.md` Key Concepts section to identify where to insert the sampling scheme bullet
5. Make the edits: add "See also" lines to existing bullets, add new bullets where needed
6. Verify all link paths are correct (`../specs/architecture/filename.md`)

### Key Files to Modify

- **Modify**: `src/crates/sddp.md` (update 3 existing bullets, add 1 new bullet)
- **Modify**: `src/crates/solver.md` (update 1 existing bullet)
- **Modify**: `src/crates/stochastic.md` (add 1 new bullet)

### Patterns to Follow

- `src/crates/comm.md` Key Concepts pattern: bold term, en-dash, description, `See [Link](path).`
- "See also" pattern for supplementary references: place on the next line after the existing `See` line
- Relative path from `src/crates/` to `src/specs/architecture/`: `../specs/architecture/`
- New bullets placed near conceptually related existing bullets

### Pitfalls to Avoid

- Do NOT reference testing specs from crate specs. Only reference trait specs.
- Do NOT rewrite existing bullet text. Only add references and new bullets.
- Do NOT change the existing `See` references. Add "See also" as a separate line.
- Do NOT use absolute paths in links. Use relative paths from the crate spec file.
- Do NOT forget the horizon mode bullet in `sddp.md` -- this concept is currently missing from Key Concepts despite being a major abstraction point.

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-013 (cross-reference index must be updated first)
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 2
**Confidence**: High
