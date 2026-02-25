# ticket-012 Update Crate Overview and SUMMARY.md

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update `src/crates/overview.md` to include `cobre-comm` in the dependency graph and crate table, and update `src/SUMMARY.md` to include all new spec pages (communicator-trait.md, backend-selection.md, backend-ferrompi.md, backend-local.md, backend-tcp.md, backend-shm.md, comm.md) in the appropriate sections. Also add `cobre-comm` to the `src/crates/` crate listing in SUMMARY.md.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/crates/overview.md` -- Dependency graph, crate table
  - `src/SUMMARY.md` -- HPC section (new spec pages), Crate Documentation section (cobre-comm)
- **Key decisions needed**:
  - Where in the HPC section to place the new spec pages (before or after existing pages)
  - Whether backend specs should be grouped under a "Communication Backends" subsection or listed flat
- **Open questions**:
  - Should the dependency graph in overview.md show ferrompi as a dependency of cobre-comm (feature-gated) or keep it as a standalone entry?
  - How does the `cobre-comm` crate fit in the "Key property" note that currently says "None of the three new crates depend on ferrompi"?

## Dependencies

- **Blocked By**: ticket-004 (cobre-comm crate spec), ticket-005 through ticket-008 (all backend specs)
- **Blocks**: ticket-013

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
