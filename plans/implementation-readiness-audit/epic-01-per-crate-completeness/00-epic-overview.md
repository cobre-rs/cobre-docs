# Epic 01: Per-Crate Spec Completeness Audit

## Goal

Systematically audit each of the 8 required crates (cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-comm, cobre-cli, ferrompi) to determine whether every public API surface is specified with sufficient detail for implementation. Each ticket produces a completeness matrix covering five categories: public types, public functions, error types, trait implementations, and crate boundary interactions.

## Scope

- All 8 crates listed in `src/specs/overview/implementation-ordering.md` section 4
- Only the minimal viable solver scope (4 element types, selected trait variants, MPI backend)
- Deferred crates and deferred features are explicitly excluded

## Audit Categories

For each crate, the audit examines:

1. **Public Types** (structs, enums, traits): Does every type that crosses the crate boundary have a concrete Rust signature or sketch with field types?
2. **Public Functions**: Does every public function have a signature with named parameters, typed return values, and documented semantics?
3. **Error Types**: Are all error conditions enumerated with variant-level documentation? Are error recovery contracts specified?
4. **Trait Implementations**: For traits implemented in this crate, are behavioral contracts (preconditions, postconditions) specified?
5. **Crate Boundary Interactions**: Are all interactions with other crates specified with concrete function signatures at both sides of the boundary?

## Classification Scheme

Each item is classified as:

- **COMPLETE**: Fully specified with concrete types, behavioral contracts, and error handling
- **PARTIAL**: Some specification exists but is missing concrete types, has ambiguous behavior, or lacks error handling
- **MISSING**: No specification exists for a required API surface

## Tickets

| Ticket     | Title                                           | Agent                               | Effort |
| ---------- | ----------------------------------------------- | ----------------------------------- | ------ |
| ticket-001 | Audit cobre-core API Surface Completeness       | `data-model-format-specialist`      | 3 pts  |
| ticket-002 | Audit cobre-io API Surface Completeness         | `data-model-format-specialist`      | 3 pts  |
| ticket-003 | Audit cobre-stochastic API Surface Completeness | `sddp-specialist`                   | 2 pts  |
| ticket-004 | Audit cobre-solver API Surface Completeness     | `sddp-specialist`                   | 3 pts  |
| ticket-005 | Audit cobre-sddp API Surface Completeness       | `sddp-specialist`                   | 5 pts  |
| ticket-006 | Audit cobre-comm API Surface Completeness       | `hpc-parallel-computing-specialist` | 2 pts  |
| ticket-007 | Audit cobre-cli API Surface Completeness        | `sddp-specialist`                   | 2 pts  |
| ticket-008 | Audit ferrompi API Surface Completeness         | `hpc-parallel-computing-specialist` | 2 pts  |

## Dependencies

- No dependencies on other epics (this is the first epic)
- Tickets within this epic are independent and can be executed in parallel

## Deliverables

- 8 audit report files in the plan directory, one per crate
- Each report contains a completeness matrix, detailed findings, and a per-crate verdict
