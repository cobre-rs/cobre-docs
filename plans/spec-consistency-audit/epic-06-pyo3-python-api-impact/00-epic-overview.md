# Epic 06: Agent & External Interface Impact Assessment

## Goals

1. **Assess structured CLI impact** — Review existing CLI, output, and lifecycle specs to determine what changes are needed for subcommands, JSON structured output, progress streaming, and composable pipeline patterns that serve both human users and AI agents.
2. **Assess MCP server, Python bindings, and TUI impact** — Review crate architecture, data model, and configuration specs to determine what new crates and cross-references are needed for an MCP server, PyO3 Python bindings, and a ratatui terminal UI.
3. **Define agent-readability design principles and interface architecture** — Draft the agent-readability design principle, map new crates (`cobre-mcp`, `cobre-python`, `cobre-tui`) into the dependency graph, and define the agent context strategy (structured documentation, skills, CLAUDE.md patterns).

## Motivation

Software must increasingly be readable, understandable, and usable by AI agents — not only people. The Cobre ecosystem is currently designed as an HPC-batch system with a single MPI entrypoint and human-readable output. This epic assesses the impact of adding multiple interface layers that make the solver composable for agents, interactive tools, and programmatic embedding.

## Scope

This epic is an **impact assessment and architecture planning** exercise. The only spec modification is adding the agent-readability design principle to `design-principles.md` (ticket-021). All other deliverables are assessment reports and architecture decisions that inform Epic 07 (spec authoring).

### Interface Layers (Priority Order)

1. **Structured CLI & Output** — JSON output mode, subcommands, progress streaming, machine-parseable errors
2. **MCP Server** — Model Context Protocol server exposing Cobre tools/resources to AI agents
3. **Python Bindings** — PyO3 module for programmatic access from Python, Jupyter, agent frameworks
4. **Terminal UI** — ratatui-based interactive monitoring and exploration

## Key Design Constraints

| Constraint                    | Detail                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Agent-first, human-compatible | All interfaces must be machine-parseable first; human readability is a secondary concern that should not compromise parseability |
| Structured output everywhere  | Every operation must support JSON output with stable schemas                                                                     |
| No MPI in agent paths         | MCP server and Python bindings are single-process; HPC remains MPI-based                                                         |
| Composable by default         | CLI subcommands, MCP tools, and Python functions must compose for multi-step agent workflows                                     |
| Schema-first design           | All inputs and outputs have documented JSON schemas before implementation                                                        |
| Backward compatible           | The existing HPC batch CLI (`mpiexec cobre /path`) must continue to work unchanged                                               |

## Tickets

| Ticket     | Title                                                                 | Detail Level |
| ---------- | --------------------------------------------------------------------- | ------------ |
| ticket-019 | Assess structured CLI and output impact on existing specs             | Refined      |
| ticket-020 | Assess MCP server, Python bindings, and TUI impact on existing specs  | Refined      |
| ticket-021 | Define agent-readability design principles and interface architecture | Refined      |

## Dependencies

- No hard dependencies on Epics 01-05 (but benefits from completed notation and organization audits)
- Epic 06 tickets have internal ordering: ticket-019 and ticket-020 inform ticket-021
- Epic 06 findings feed directly into Epic 07 spec authoring

## Success Criteria

- Impact report identifying every existing spec that needs changes and what those changes are
- Architecture document mapping new crates into the dependency graph
- Agent-readability design principle drafted and ready for inclusion in `design-principles.md`
- Clear scope definition for each Epic 07 spec document
