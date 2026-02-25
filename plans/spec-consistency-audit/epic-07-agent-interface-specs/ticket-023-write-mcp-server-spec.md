# ticket-023 Write mcp-server.md Spec

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Write a full implementation-ready specification for the Cobre MCP (Model Context Protocol) server. This spec defines: MCP tool definitions for all solver operations, resource definitions for case data and results, prompt definitions for agent guidance, transport configuration (stdio, SSE), security model, and the `cobre-mcp` crate architecture.

The MCP server makes Cobre a first-class tool for AI agents — agents can discover capabilities, run studies, query results, and compose multi-step optimization workflows through the standard MCP protocol.

## Anticipated Scope

- **File to create**: `src/specs/architecture/mcp-server.md`
- **Spec sections**:
  1. Purpose and design philosophy: why MCP for scientific computing
  2. Tool definitions:
     - `run_study` — Run a full SDDP study (training + simulation)
     - `validate_case` — Validate input files without running
     - `query_results` — Query training convergence, simulation results, cut statistics
     - `modify_config` — Read/modify configuration parameters
     - `compare_policies` — Compare convergence of two runs
     - `explain_convergence` — Interpret convergence behavior
     - `get_system_info` — Describe the power system being modeled
  3. Resource definitions:
     - Case directories (list, read, create)
     - Policy files (cuts, states, vertices)
     - Result datasets (convergence, simulation, diagnostics)
     - Configuration schemas
  4. Prompt definitions:
     - System modeling guidance (hydro, thermal, network)
     - Parameter tuning (risk measure selection, convergence criteria)
     - Result interpretation (convergence diagnosis, cost analysis)
  5. Transport: stdio for local agents (Claude Code), SSE for remote
  6. Security: read-only vs read-write operations, sandboxing, path restrictions
  7. Crate architecture: `cobre-mcp` dependency on `cobre-sddp`, `cobre-io`, `cobre-core`
  8. Capability negotiation and version compatibility
- **Key decisions**: Uses findings from ticket-020 impact assessment and ticket-021 architecture document
- **Spec depth**: Concrete tool schemas (JSON), example request/response pairs, error handling

## Dependencies

- **Blocked By**: ticket-022 (structured output is the foundation for tool responses)
- **Blocks**: ticket-026

## Effort Estimate

**Points**: 5
**Confidence**: Low (will be re-estimated during refinement)
