# ticket-016 Update MCP Server Spec for Optional Multi-Process Capability

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Add a brief section to `src/specs/interfaces/mcp-server.md` acknowledging that the `cobre-mcp` server can optionally use the TCP or shm backend for multi-process SDDP training within a single server process. The current spec states "single-process, no MPI" as the execution mode (SS1.1). This ticket adds a note that multi-process execution is possible via alternative backends without MPI, while keeping single-process as the default and recommended mode for the MCP server.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/interfaces/mcp-server.md` -- Add a subsection (e.g., SS1.1a or an addition to the execution mode table) noting multi-process capability
- **Key decisions needed**:
  - Whether multi-process MCP is a documented capability or a deferred feature
  - Whether the `cobre/train` tool should accept a `backend` parameter
- **Open questions**:
  - Is multi-process execution useful for MCP server use cases? (The MCP server is primarily for AI agent interaction, which may not benefit from multi-process SDDP if the server runs on a single machine with limited cores)
  - Should the MCP server support launching worker processes, or should workers be pre-launched?

## Dependencies

- **Blocked By**: ticket-007 (TCP backend spec), ticket-014 (Python multi-process API sets precedent)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: Low (will be re-estimated during refinement)
