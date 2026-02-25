# cobre-mcp

<span class="status-experimental">experimental</span>

## Overview

cobre-mcp is a standalone binary crate that implements a Model Context Protocol
(MCP) server, exposing Cobre operations as MCP tools, data artifacts as
resources, and guided workflows as prompts. It enables AI coding assistants
and automation agents to interact with Cobre programmatically -- validating
cases, running training, querying results, and comparing policies -- without
parsing CLI text output.

The server supports two transport modes: stdio for local use (e.g., Claude
Desktop, VS Code extensions) and streamable-HTTP/SSE for remote deployment.
All operations are single-process -- the server invokes the Rust library API
directly through `cobre-sddp` without MPI. File access is sandboxed to a
configurable allowlist of case and output directories.

## Key Concepts

- **MCP tools** -- Ten tools mapping to Cobre operations: `cobre/validate`,
  `cobre/run`, `cobre/query-results`, `cobre/query-convergence`,
  `cobre/inspect-policy`, `cobre/inspect-case`, `cobre/list-scenarios`,
  `cobre/compare-policies`, `cobre/export-results`, `cobre/get-config-schema`.
  Each tool has a documented JSON Schema for inputs and outputs.
  See [MCP Server](../specs/interfaces/mcp-server.md).

- **MCP resources** -- Six resource types exposing Cobre data artifacts via
  URI templates: case configuration, convergence history, entity results,
  policy summary, validation report, and run metadata. Resources convert
  Parquet and FlatBuffers data to JSON on demand.
  See [MCP Server](../specs/interfaces/mcp-server.md).

- **MCP prompts** -- Four guided workflow prompts: diagnose convergence,
  compare runs, set up a new case, and tune stopping rules. Prompts
  assemble context from resources and tools to help agents complete
  multi-step workflows.
  See [MCP Server](../specs/interfaces/mcp-server.md).

- **Transport modes** -- stdio transport for local integration and
  streamable-HTTP/SSE for remote or multi-client deployments. The MCP
  protocol version and capability negotiation follow the MCP specification.
  See [MCP Server](../specs/interfaces/mcp-server.md).

- **Security model** -- File access sandboxed to an allowlist of directories.
  Read-only by default; write operations (`run`, `export-results`) require
  explicit opt-in configuration.
  See [MCP Server](../specs/interfaces/mcp-server.md).

## Dependencies

```
cobre-mcp
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core
```

cobre-mcp does NOT depend on `ferrompi` or `cobre-cli`. It operates in
single-process mode exclusively.

## Status

cobre-mcp is in the **design phase**. The MCP server spec linked above is
the authoritative reference for implementation. No Rust code has been
published yet; the crate placeholder exists in the Cargo workspace to
reserve the module boundary.
