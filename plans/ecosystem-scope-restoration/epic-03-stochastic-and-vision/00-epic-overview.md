# Epic 03: Stochastic Generalization & Ecosystem Vision

## Goal

Reframe `cobre-stochastic` and `sampling-scheme-trait.md` as a general scenario generation framework (with PAR(p)/hydro as the first implementation), and create the new `ecosystem-vision.md` document that describes the full power system analysis and optimization ecosystem with SDDP as the first vertical.

## Scope

### In Scope

- `src/specs/architecture/sampling-scheme-trait.md` -- Reframe purpose paragraph
- `src/specs/architecture/sampling-scheme-testing.md` -- Update accordingly
- `src/specs/architecture/scenario-generation.md` -- Partially reframe purpose paragraph
- `src/crates/stochastic.md` -- Already covered by Epic 01 ticket-004, but the architecture spec purpose paragraphs are handled here
- New file: `src/specs/overview/ecosystem-vision.md` -- Ecosystem vision document
- `src/specs/cross-reference-index.md` -- Add ecosystem-vision.md entry

### Out of Scope

- Mathematical formulations in `src/specs/math/par-inflow-model.md` (correctly domain-specific)
- `SamplingScheme` enum variant names (InSample, External, Historical are generic enough)
- Method signatures (already generic)
- Behavioral contracts

## Tickets

| Ticket     | Title                                                           | Files Modified                                                                                         | Effort |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| ticket-012 | Reframe sampling-scheme-trait.md and sampling-scheme-testing.md | `src/specs/architecture/sampling-scheme-trait.md`, `src/specs/architecture/sampling-scheme-testing.md` | 2      |
| ticket-013 | Reframe scenario-generation.md purpose paragraph                | `src/specs/architecture/scenario-generation.md`                                                        | 2      |
| ticket-014 | Create ecosystem-vision.md                                      | `src/specs/overview/ecosystem-vision.md` (new)                                                         | 3      |
| ticket-015 | Update cross-reference index for ecosystem-vision.md            | `src/specs/cross-reference-index.md`                                                                   | 2      |

## Dependencies

- ticket-012 and ticket-013 are independent of each other
- ticket-014 depends on Epic 01 being complete (ecosystem framing should be established before the vision doc references it)
- ticket-015 depends on ticket-014 (the new file must exist before it can be indexed)
- This epic depends on Epic 01 and can run in parallel with Epic 02

## Success Criteria

- `sampling-scheme-trait.md` purpose paragraph describes a general scenario generation abstraction
- `ecosystem-vision.md` exists and describes the full power system analysis and optimization ecosystem
- Cross-reference index includes the new document
- `mdbook build` passes with no new warnings
- No behavioral contracts are changed
