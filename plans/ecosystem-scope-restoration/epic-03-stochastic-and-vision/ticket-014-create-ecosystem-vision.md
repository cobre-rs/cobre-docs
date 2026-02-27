# ticket-014 Create ecosystem-vision.md

## Context

### Background

No document in the Cobre specification corpus describes the broader ecosystem vision -- the full power system analysis and optimization platform that Cobre is designed to be. All existing specs are written from an SDDP-first perspective. A new document `src/specs/overview/ecosystem-vision.md` is needed that describes the complete vision: power flow, OPF, dynamic simulation, batteries, renewable uncertainty, and SDDP as the first vertical. This is the document a new contributor reads to understand why the crates are designed to be generic.

The vision is based on the Cobre GitHub README at https://github.com/cobre-rs/cobre, which describes Cobre as "an open-source ecosystem of Rust crates for power system analysis and optimization" with phases from SDDP through power flow, OPF, and future expansion.

### Relation to Epic

This is the centerpiece ticket of Epic 03. It creates the new vision document that anchors the ecosystem scope restoration.

### Current State

No file exists at `src/specs/overview/ecosystem-vision.md`. The ecosystem vision is described only in the GitHub README and is not part of the specification corpus. The `SUMMARY.md` file (mdBook table of contents) will need an entry for the new file.

## Specification

### Requirements

1. Create `src/specs/overview/ecosystem-vision.md` with the following content structure:
   - Purpose paragraph describing the document's role
   - Section 1: Ecosystem Overview (what Cobre is, why it exists)
   - Section 2: Architectural Layers (shared data model, solver modules, applications)
   - Section 3: Crate Map (all current crates and their roles in the ecosystem)
   - Section 4: Solver Verticals (SDDP as first, power flow/OPF as next, future expansion)
   - Section 5: Roadmap Phases (from GitHub README: Phase 0 current, Phase 1 hardening, Phase 2 power flow, future)
   - Section 6: Design Principles for Genericity (why crates are designed to be generic)
   - Cross-References section
2. Use plain numbered sections (`## 1.`, `## 2.`, etc.) per overview spec conventions
3. Do NOT use `SS` or `§` section prefixes (overview specs use plain numbers)
4. Reference existing specs where appropriate (design-principles.md, ecosystem-guidelines.md, etc.)
5. Add the file to `src/SUMMARY.md` in the Overview section
6. The document should be informative enough that a new contributor understands the full vision without reading the GitHub README

### Inputs/Props

- GitHub README content (Cobre: Open Infrastructure for Power System Computation):
  - Shared data model: "the same HydroPlant, Bus, or ThermalUnit struct works whether you're running a 10-year stochastic dispatch or a steady-state power flow"
  - Current crates: cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-cli, ferrompi
  - Phase 1: Python bindings, TUI monitoring, benchmark suite, additional IO formats, NEWAVE validation
  - Phase 2: Newton-Raphson AC power flow, DC power flow, OPF, web visualization
  - Future: Dynamic simulation, renewable uncertainty, battery/storage optimization, SCADA integration
  - Architectural inspirations: NREL Sienna (Julia), PowSyBl (Java), SDDP.jl, SPARHTACUS (C++)
- New file path: `/home/rogerio/git/cobre-docs/src/specs/overview/ecosystem-vision.md`
- SUMMARY.md path: `/home/rogerio/git/cobre-docs/src/SUMMARY.md`

### Outputs/Behavior

- New file exists at `src/specs/overview/ecosystem-vision.md`
- File uses plain numbered sections (no SS or section prefix)
- File is referenced in `src/SUMMARY.md`
- File contains comprehensive ecosystem vision

### Error Handling

- If `src/SUMMARY.md` does not have an obvious place for the new entry, add it after the existing overview files

## Acceptance Criteria

- [ ] Given the file `src/specs/overview/ecosystem-vision.md`, when it exists, then it contains sections covering ecosystem overview, architectural layers, crate map, solver verticals, roadmap, and design principles
- [ ] Given the file, when section headings are examined, then they use plain numbered format (`## 1.`, `## 2.`, etc.), not `SS` or `§` prefixes
- [ ] Given the file, when a new contributor reads it, then they understand that Cobre is a power system analysis and optimization ecosystem with SDDP as the first solver vertical
- [ ] Given `src/SUMMARY.md`, when read, then it contains an entry linking to `specs/overview/ecosystem-vision.md`
- [ ] Given the file, when `mdbook build` is run, then the build succeeds with no new warnings
- [ ] Given the file, when cross-reference links within the document are checked, then all resolve correctly

### Out of Scope

- Detailed technical specifications for future solver verticals (power flow, OPF)
- Implementation timelines
- Budget or resource allocation
- Changes to existing specs

## Implementation Guide

### Suggested Approach

1. Create `src/specs/overview/ecosystem-vision.md`
2. Write the Purpose paragraph: "This document describes the Cobre ecosystem vision: a comprehensive, open-source platform for power system analysis and optimization, built as a modular set of Rust crates. It explains why the specification corpus designs infrastructure crates (core, solver, comm, io) to be domain-agnostic, and how SDDP-based hydrothermal dispatch serves as the first solver vertical in a broader roadmap."
3. Section 1 -- Ecosystem Overview: Cobre provides a shared data model, file format interoperability, and modular solvers. Name derives from Portuguese for copper. Addresses fragmentation in power system software.
4. Section 2 -- Architectural Layers: Foundation (cobre-core), Infrastructure (cobre-io, cobre-comm, ferrompi), Solver Abstraction (cobre-solver), Solver Verticals (cobre-sddp, future: cobre-powerflow), Applications (cobre-cli, cobre-tui, cobre-python, cobre-mcp)
5. Section 3 -- Crate Map: Table of all crates with status, role, and genericity note
6. Section 4 -- Solver Verticals: SDDP (current, experimental), Power Flow (planned Phase 2), OPF (planned Phase 2), Dynamic Simulation (future), Battery/Storage (future)
7. Section 5 -- Roadmap: Phase 0 (current: SDDP specs + initial implementation), Phase 1 (hardening: Python bindings, benchmarks, NEWAVE validation), Phase 2 (expansion: power flow, OPF, web), Future (dynamic simulation, renewable uncertainty, SCADA)
8. Section 6 -- Design Principles for Genericity: Why crates are generic (same Bus struct for power flow and SDDP, same solver interface for LP and OPF, same communication infrastructure for any distributed algorithm)
9. Cross-References section
10. Add entry to `src/SUMMARY.md`

### Key Files to Modify

- `src/specs/overview/ecosystem-vision.md` (new file)
- `src/SUMMARY.md` (add entry)

### Patterns to Follow

- Overview spec conventions: plain numbered sections, no SS or section prefixes
- Cross-reference format: `[File](./link.md) -- description`
- Tone: informative and vision-oriented, suitable for new contributors
- mdBook compatibility: standard markdown

### Pitfalls to Avoid

- Do NOT use `SS` or `§` section prefixes (overview spec convention)
- Do NOT include implementation timelines or commitments
- Do NOT speculate on detailed technical designs for future verticals
- Do NOT break the mdBook build by incorrect `SUMMARY.md` formatting

## Testing Requirements

### Unit Tests

- File exists at `src/specs/overview/ecosystem-vision.md`
- File uses `## 1.`, `## 2.` heading format
- `grep "SS[0-9]\|§[0-9]" src/specs/overview/ecosystem-vision.md` returns 0 matches (except in cross-reference links to other specs)

### Integration Tests

- `mdbook build` succeeds
- `src/SUMMARY.md` contains the new entry

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: Epic 01 (ecosystem framing should be established in crate overviews before the vision doc references them)
- **Blocks**: ticket-015 (cross-reference index update)

## Effort Estimate

**Points**: 3
**Confidence**: High
