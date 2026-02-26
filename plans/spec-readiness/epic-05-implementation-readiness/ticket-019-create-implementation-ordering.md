# ticket-019 Create Implementation Ordering Document

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Create `src/specs/overview/implementation-ordering.md` that provides a concrete crate-by-crate build sequence for Rust implementation. The document should analyze the dependency graph of all 11 crates (cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-sddp, cobre-cli, cobre-comm, cobre-mcp, cobre-python, cobre-tui, ferrompi), identify the critical path, define a minimal viable deliverable (smallest subset that can solve a trivial SDDP problem), and specify implementation milestones with their dependencies.

## Anticipated Scope

- **Files likely to be modified**: Create `src/specs/overview/implementation-ordering.md`
- **Key decisions resolved by stakeholder review** (see 00-epic-overview.md):
  - The minimal viable SDDP solver is MPI-first (real `mpiexec -n N` binary), not local-only
  - cobre-comm MUST be implemented early with MPI backend (the primary use case)
  - Python bindings, TUI, MCP server, TCP/shm backends are NOT in scope for minimal viable
  - Real crate boundaries must be respected — no stubs that bypass architecture
  - Only one variant per trait needed: Expectation, Level-1, Finite, InSample
  - System elements: Buses + Lines + Thermals + Hydros only; other types are NO-OP stubs
  - Constant hydro productivity only
  - Single scenario input path (deferred: PAR fitting, history, external)
  - Training + simulation + parallel + reproducibility required
  - Full output chain via cobre-io following spec schemas
- **Remaining open questions**: How to represent the dependency graph (ASCII, Mermaid, or prose); whether to include estimated effort per crate; whether to define intermediate integration test milestones

## Dependencies

- **Blocked By**: ticket-015 through ticket-018 (consistency pass must complete first)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 4
**Confidence**: Low (will be re-estimated during refinement)
