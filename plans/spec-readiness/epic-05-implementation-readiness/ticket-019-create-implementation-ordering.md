# ticket-019 Create Implementation Ordering Document

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create `src/specs/overview/implementation-ordering.md` that provides a concrete crate-by-crate build sequence for Rust implementation. The document should analyze the dependency graph of all 11 crates (cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-cli, cobre-comm, cobre-mcp, cobre-python, cobre-tui, ferrompi), identify the critical path, define a minimal viable deliverable (smallest subset that can solve a trivial SDDP problem), and specify implementation milestones with their dependencies.

## Anticipated Scope

- **Files likely to be modified**: Create `src/specs/overview/implementation-ordering.md`
- **Key decisions needed**: What constitutes the minimal viable deliverable (likely: cobre-core + cobre-io + cobre-solver + cobre-sddp with local backend and HiGHS solver, no Python bindings, no MPI); how to represent the dependency graph (ASCII, Mermaid, or prose); whether to include estimated effort per crate
- **Open questions**: Should the ordering account for external dependency availability (e.g., HiGHS vs CLP, ferrompi availability)? Should it define intermediate integration test milestones? How does the cobre-comm crate fit -- should it be implemented early (it has the most detailed trait spec) or deferred until MPI is needed?

## Dependencies

- **Blocked By**: ticket-015 through ticket-018 (consistency pass must complete first)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 4
**Confidence**: Low (will be re-estimated during refinement)
