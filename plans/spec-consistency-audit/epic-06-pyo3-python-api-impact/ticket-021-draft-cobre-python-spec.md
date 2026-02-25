# ticket-021 Define Agent-Readability Design Principles and Interface Architecture

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Synthesize the findings from tickets 019 and 020 into a coherent architecture document that: (1) drafts the "Agent-Readability" design principle for inclusion in `design-principles.md`, (2) maps three new crates (`cobre-mcp`, `cobre-python`, `cobre-tui`) into the existing dependency graph with clear responsibility boundaries, and (3) defines the agent context strategy (structured documentation patterns, Claude Code skills, CLAUDE.md conventions).

This document becomes the architectural blueprint for Epic 07 spec authoring.

## Anticipated Scope

- **Agent-readability principle**:
  - Define what "agent-readable" means for Cobre: structured I/O, discoverable capabilities, composable operations, deterministic behavior
  - Position alongside existing principles (reproducibility, scalability, declaration order invariance)
  - Establish design rules: every operation has a JSON schema, every error is structured, every result is machine-parseable

- **Interface architecture**:
  - Dependency graph with new crates:
    ```
    cobre-cli (expanded: subcommands, structured output)
      ├── cobre-sddp
      ├── cobre-io
      ├── cobre-core
      └── (existing deps)
    cobre-mcp (new: MCP server)
      ├── cobre-sddp
      ├── cobre-io
      └── cobre-core
    cobre-python (new: PyO3 bindings)
      ├── cobre-sddp
      ├── cobre-stochastic
      ├── cobre-solver
      ├── cobre-io
      └── cobre-core
    cobre-tui (new: terminal UI)
      └── cobre-cli (or shared event stream)
    ```
  - Responsibility boundaries: what each new crate owns vs delegates
  - Shared event/progress stream that CLI, MCP, TUI all consume

- **Agent context strategy**:
  - CLAUDE.md conventions for the repository (what agents need to know)
  - Claude Code skill definitions for common operations (run study, validate, compare)
  - Structured documentation patterns (machine-readable cross-reference index)
  - Agent-friendly error messages with actionable suggestions

- **Deliverable**: Architecture document ready to inform Epic 07 ticket refinement

## Dependencies

- **Blocked By**: ticket-019, ticket-020 (needs both assessment reports)
- **Blocks**: Epic 07 (all tickets)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
