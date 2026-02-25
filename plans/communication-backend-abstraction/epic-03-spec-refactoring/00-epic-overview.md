# Epic 03: Refactor Existing Specs to Use Communicator Trait

## Goals

1. Update all HPC specs to reference the `Communicator` trait instead of direct ferrompi calls
2. Update architecture specs (training-loop.md) to use generic communication through the trait
3. Update the crate overview to include `cobre-comm` in the dependency graph
4. Update SUMMARY.md to include new spec pages in the HPC section
5. Update the cross-reference index with new specs

## Scope

This epic modifies 8+ existing spec documents and the SUMMARY.md:

- `src/specs/hpc/hybrid-parallelism.md` -- Generalize initialization sequence; remove ferrompi-only assumption
- `src/specs/hpc/communication-patterns.md` -- Reference trait methods instead of ferrompi API
- `src/specs/hpc/synchronization.md` -- Generalize sync point descriptions
- `src/specs/hpc/work-distribution.md` -- Reference trait for collective parameter computation
- `src/specs/hpc/shared-memory-aggregation.md` -- Reference SharedMemoryProvider trait
- `src/specs/architecture/training-loop.md` -- Parameterize training loop by Communicator generic
- `src/crates/overview.md` -- Add cobre-comm to dependency graph
- `src/SUMMARY.md` -- Add new spec pages under HPC section
- `src/specs/cross-reference-index.md` -- Add entries for new specs

## Tickets

| Ticket     | Title                                                   | Status  | Detail Level |
| ---------- | ------------------------------------------------------- | ------- | ------------ |
| ticket-009 | Refactor hybrid-parallelism.md for backend abstraction  | pending | Outline      |
| ticket-010 | Refactor communication-patterns.md for trait references | pending | Outline      |
| ticket-011 | Refactor training-loop.md and remaining HPC specs       | pending | Outline      |
| ticket-012 | Update crate overview and SUMMARY.md                    | pending | Outline      |
| ticket-013 | Update cross-reference index with new specs             | pending | Outline      |

## Dependencies

- **Blocked By**: Epic 01 (trait must be defined), Epic 02 (backends must be specified)
- **Blocks**: Epic 04 (Python spec updates reference the refactored specs)

## Success Criteria

- No existing HPC spec hardcodes ferrompi as the only communication path
- The training loop spec shows generic parameterization `<C: Communicator>`
- The initialization sequence in hybrid-parallelism.md is backend-aware
- The crate overview includes `cobre-comm` in the correct dependency position
- SUMMARY.md lists all new spec pages
- `mdbook build` succeeds after all changes
