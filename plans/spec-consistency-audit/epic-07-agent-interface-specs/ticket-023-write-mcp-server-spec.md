# ticket-023 Write mcp-server.md Spec

## Context

### Background

Epic 06 produced a comprehensive MCP server assessment (findings-020 SS1) that defines 10 tools, 6 resource types, 4 prompts, transport recommendations, and a security model. The architecture document (architecture-021.md SS2.1) defines the `cobre-mcp` crate's responsibility boundaries, dependency graph position, and execution mode. The scope definition in architecture-021.md SS5.2 specifies exactly what this spec must contain. All tool schemas, resource URIs, and security policies are resolved in the assessment -- this ticket writes the implementation-ready specification.

### Relation to Epic

This is one of three interface layer specs (alongside ticket-024 and ticket-025) that can proceed in parallel once ticket-022 (structured output) is complete. The MCP server spec depends on the structured output spec because MCP tool responses reuse the response envelope and error schema. ticket-026 depends on this spec for cross-reference integration.

### Current State

- No file exists at `src/specs/interfaces/mcp-server.md` and the `src/specs/interfaces/` directory does not exist yet (ticket-022 creates it).
- `findings-020.md` SS1.1 defines the 10-tool mapping with input/output schema shapes for each tool.
- `findings-020.md` SS1.2 defines 6 resource URI templates with MIME types and data sources.
- `findings-020.md` SS1.3 defines 4 prompt definitions with argument schemas.
- `findings-020.md` SS1.4 defines transport recommendations (stdio local, streamable-HTTP/SSE remote).
- `findings-020.md` SS1.5 defines the security model (read-only default, read-write opt-in, sandboxed file access).
- `architecture-021.md` SS2.1 defines the crate's responsibility table, owned operations, and security boundary.
- `architecture-021.md` SS3 defines the event stream architecture. The MCP server is one consumer of `ConvergenceUpdate` events via progress notifications.
- `architecture-021.md` SS6.1 Q-3 documents the open assumption about long-running operation model: recommended approach is progress notifications during the call.

## Specification

### Requirements

Create the file `src/specs/interfaces/mcp-server.md` containing a complete, implementation-ready specification for the Cobre MCP server. The spec must cover all seven areas defined in architecture-021.md SS5.2:

1. **Tool definitions** -- All 10 tools from findings-020 SS1.1 with:
   - Full JSON Schema for input parameters
   - Full JSON Schema for output (success and error cases)
   - Error conditions and corresponding error kinds (referencing structured-output.md error registry)
   - Timeout behavior (especially for `cobre/run` which may take minutes to hours)
   - Example request/response JSON pairs

   Tools: `cobre/validate`, `cobre/run`, `cobre/query-results`, `cobre/query-convergence`, `cobre/inspect-policy`, `cobre/compare-policies`, `cobre/inspect-case`, `cobre/list-scenarios`, `cobre/export-results`, `cobre/get-config-schema`

2. **Resource definitions** -- All 6 resource types from findings-020 SS1.2 with:
   - URI template (e.g., `cobre://case/{case_dir}/config`)
   - MIME type (`application/json` for all)
   - Data source (which file/format is read)
   - Data conversion rules (Parquet-to-JSON column type mapping, FlatBuffers-to-JSON summary conversion)
   - Access control (which resources are available in read-only mode)

3. **Prompt definitions** -- All 4 prompts from findings-020 SS1.3 with:
   - Argument schemas
   - Purpose descriptions
   - Expected agent workflow when using the prompt

4. **Transport specification** -- stdio for local agents, streamable-HTTP/SSE for remote. Connection lifecycle, capability negotiation during MCP `initialize` handshake.

5. **Progress reporting** -- How `cobre/run` maps `ConvergenceUpdate` events (from architecture-021.md SS3.2) to MCP progress notifications. Progress token lifecycle. Mapping from event fields to notification content.

6. **Security model** -- Read-only vs read-write operation classification. Sandboxed file access with configurable allowlist. The `--allow-write` opt-in mechanism. Path validation rules.

7. **Long-running operation model** -- Document the recommended approach (progress notifications during the call, per Q-3 resolution in architecture-021.md SS6.1) and the alternative (background task with polling) as a design note flagged for user review.

### Inputs/Props

| Source Document                     | Relevant Sections               | What to Extract                                                 |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `findings-020.md`                   | SS1.1 (10 tools)                | Tool names, source crates, input/output schema shapes, notes    |
| `findings-020.md`                   | SS1.2 (6 resources)             | URI templates, data sources, MIME types                         |
| `findings-020.md`                   | SS1.3 (4 prompts)               | Prompt names, arguments, purposes                               |
| `findings-020.md`                   | SS1.4 (transport)               | stdio vs SSE/streamable-HTTP rationale                          |
| `findings-020.md`                   | SS1.5 (security)                | Read-only/read-write classification, sandboxing policy          |
| `architecture-021.md`               | SS2.1 (cobre-mcp boundaries)    | Crate type, execution mode, owned operations, security boundary |
| `architecture-021.md`               | SS3.2-SS3.4 (event stream)      | Event types, consumer registration, backpressure rules          |
| `architecture-021.md`               | SS5.2 (scope definition)        | Must-contain, must-NOT-contain boundaries                       |
| `architecture-021.md`               | SS6.1 Q-3                       | Long-running operation model assumption                         |
| `structured-output.md` (ticket-022) | Response envelope, error schema | Shared response envelope and error kind registry                |

### Outputs/Behavior

A single markdown file at `src/specs/interfaces/mcp-server.md` that:

- Follows the style and depth of existing architecture specs
- Contains full JSON Schema definitions for all 10 tool inputs and outputs
- Contains complete resource URI templates with data conversion specifications
- Contains example request/response JSON for the most critical tools (at minimum: `cobre/validate`, `cobre/run`, `cobre/query-results`)
- Is self-contained enough for a developer to implement the MCP server without reading the assessment documents

### Error Handling

- Each tool definition must specify which error kinds from the structured-output.md registry can be returned
- The `cobre/run` tool must define what happens on: training success, training failure (solver error), training interruption (signal), and client disconnect during progress streaming
- Resource access errors must produce structured error responses with appropriate error kinds (`OutputNotFound` for missing output directories, etc.)

## Acceptance Criteria

- [ ] Given the file `src/specs/interfaces/mcp-server.md` does not exist, when the ticket is completed, then the file exists with complete content
- [ ] Given the spec exists, when reading the tools section, then all 10 tools are defined with full input/output JSON schemas and error conditions
- [ ] Given the spec exists, when reading the resources section, then all 6 resource types have URI templates, MIME types, data sources, and conversion rules
- [ ] Given the spec exists, when reading the prompts section, then all 4 prompts have argument schemas and purpose descriptions
- [ ] Given the spec exists, when reading the transport section, then both stdio and streamable-HTTP/SSE transports are specified with connection lifecycle
- [ ] Given the spec exists, when reading the progress section, then the mapping from `ConvergenceUpdate` events to MCP progress notifications is documented with progress token lifecycle
- [ ] Given the spec exists, when reading the security section, then read-only/read-write classification, sandboxed file access, and allowlist configuration are documented
- [ ] Given the spec exists, when reading the long-running operations section, then the recommended approach (progress during call) is documented and the alternative (background task) is noted as a design option
- [ ] Given the spec exists, when checking cross-references, then it references: `structured-output.md`, `convergence-monitoring.md` SS2.4, `architecture-021.md` SS2.1 and SS3, `validation-architecture.md` SS4
- [ ] Given the spec exists, when checking must-NOT-contain boundaries, then it does NOT contain CLI structured output protocol details, Python API definitions, or TUI rendering specifications
- [ ] Given `mdbook build` is run from the repo root, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Verify `src/specs/interfaces/` directory exists (ticket-022 creates it; if running in parallel, create it if absent).
2. Create `src/specs/interfaces/mcp-server.md` with the following section structure:
   - **Purpose** -- 1-paragraph summary: MCP server that makes Cobre a first-class tool for AI agents
   - **1. Crate Architecture** -- Crate type (binary), dependency graph (from architecture-021.md SS1.2), execution mode (single-process, no MPI, OpenMP threads)
   - **2. Tool Definitions** -- Subsection per tool (SS2.1 through SS2.10) with input schema, output schema, error conditions, timeout, example
   - **3. Resource Definitions** -- Table of 6 resources with URI templates, then per-resource conversion rules
   - **4. Prompt Definitions** -- Table of 4 prompts with argument schemas and purpose
   - **5. Transport** -- stdio and streamable-HTTP subsections with connection lifecycle
   - **6. Progress Reporting** -- Mapping from event stream to MCP progress notifications, progress token management
   - **7. Long-Running Operations** -- Recommended approach with design note for alternative
   - **8. Security Model** -- Operation classification table, sandboxing rules, allowlist configuration
   - **9. Capability Negotiation** -- MCP `initialize` handshake, server capabilities declaration, version compatibility
   - **Cross-References** -- Links to structured-output.md, convergence-monitoring.md, architecture-021.md, validation-architecture.md

3. For tool definitions, expand the schema shapes from findings-020 SS1.1 into full JSON Schema with property types, required fields, and descriptions.
4. For resources, document the Parquet-to-JSON conversion rules: column type mapping (INT32 -> number, DOUBLE -> number, BYTE_ARRAY/UTF8 -> string, BOOLEAN -> boolean), null handling, array flattening for nested Parquet structures.

### Key Files to Modify

| File                                 | Action                                 |
| ------------------------------------ | -------------------------------------- |
| `src/specs/interfaces/mcp-server.md` | **CREATE** -- The entire spec document |

No existing files are modified by this ticket.

### Patterns to Follow

- **Spec structure pattern**: Follow `convergence-monitoring.md` for Purpose + numbered sections + cross-references
- **Tool schema pattern**: Use JSON Schema notation matching the style in `design-principles.md` SS6.2 Rule 1 example
- **Security model pattern**: Follow the read-only/read-write table from findings-020 SS1.5
- **Forward reference pattern**: Use `(planned)` annotation for references to `python-bindings.md` and `terminal-ui.md`

### Pitfalls to Avoid

- Do NOT place the file at `src/specs/architecture/mcp-server.md` -- the correct location is `src/specs/interfaces/mcp-server.md`
- Do NOT add the file to `src/SUMMARY.md` -- that is ticket-026's responsibility
- Do NOT re-derive the tool-to-operation mapping -- findings-020 SS1.1 is authoritative
- Do NOT define CLI structured output envelope details -- reference `structured-output.md` instead
- Do NOT define Python bindings or TUI rendering
- Do NOT resolve Q-3 (long-running operation model) unilaterally -- present both options and flag for user review as specified in architecture-021.md SS5.2
- The outline ticket used different tool names (e.g., `run_study`, `validate_case`) than the assessment. Use the canonical names from findings-020 SS1.1: `cobre/validate`, `cobre/run`, etc.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-022 (structured output spec -- shared envelope and error schemas)
- **Blocks**: ticket-026

## Effort Estimate

**Points**: 5
**Confidence**: High
