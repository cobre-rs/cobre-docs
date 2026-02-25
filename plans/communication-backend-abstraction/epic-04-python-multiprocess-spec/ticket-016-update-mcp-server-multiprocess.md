# ticket-016 Update MCP Server Spec for Optional Multi-Process Capability

## Context

### Background

The MCP server spec (`mcp-server.md`) currently defines `cobre-mcp` as strictly single-process (SS1.1, line 15: "Single-process. No MPI. OpenMP threads for computation"). This mirrors the original Python bindings execution model. With ticket-014 and ticket-015 establishing multi-process SDDP execution via TCP/shm backends in the Python bindings spec, the MCP server spec should acknowledge that multi-process execution is a documented future capability -- but not a primary feature for the MCP use case.

The MCP server is designed for AI agent interaction, typically running on a single machine where the server process handles one training run at a time (SS7, lines 1466-1470: `cobre/run` blocks until completion). Multi-process SDDP could theoretically improve training wall-clock time for the MCP server, but the MCP server is not the primary target for this optimization. The primary multi-process target is the Python bindings API for data scientists running training workloads directly.

### Relation to Epic

This is the third and final ticket in Epic 04. It is a lightweight documentation update: adding a brief note to the MCP server spec acknowledging multi-process capability and cross-referencing the Python bindings multi-process API. The design decision is explicit: multi-process is a documented future capability for MCP, not a primary feature. This ticket should be small (1 point).

### Current State

`src/specs/interfaces/mcp-server.md` (1631 lines) has the following relevant sections:

- **SS1.1** (lines 9-18): Crate Type and Execution Mode table. "Execution mode" row reads "Single-process. No MPI. OpenMP threads for computation". "MPI relationship" row reads "Never initializes MPI. The `cobre-sddp` library operates in single-rank mode".
- **SS1.2** (lines 20-31): Dependency graph. Shows `cobre-mcp` depending on `cobre-sddp`, `cobre-io`, `cobre-core`. No `cobre-comm` dependency.
- **Line 33**: States the crate "shares the single-process execution path through `cobre-sddp` with OpenMP parallelism only, identical to the execution mode used by `cobre-python`".
- **SS2.2 `cobre/run`** (lines 161-275): The execution tool. Input schema has `case_dir` and `phases` properties. No `backend` or `num_workers` parameter.
- **SS7** (lines 1466-1470): Long-running operation model. States `cobre/run` blocks until completion; server processes one training run at a time.
- **Cross-References** (lines 1621-1631): 8 entries. Includes `[Python Bindings](./python-bindings.md) -- Shares the same single-process execution path and dependency subgraph` (line 1630).

## Specification

### Requirements

1. **Add SS1.1a Future Multi-Process Capability**: Add a brief subsection after SS1.1 (after the execution mode table, around line 18) documenting multi-process as a future capability:
   - State that `cobre-mcp` currently operates in single-process mode (the default and recommended mode for AI agent interaction)
   - Note that multi-process execution via TCP or shm backends is architecturally possible, following the same mechanism defined for Python bindings ([Python Bindings](./python-bindings.md) SS7.4-SS7.5)
   - Clarify that enabling multi-process for MCP would require adding `backend` and `num_workers` parameters to the `cobre/run` tool input schema, which is deferred to a future release
   - Cross-reference `python-bindings.md SS7.4` (Multi-Process Architecture) and `python-bindings.md SS2.1` (updated `train()` signature) for the pattern

2. **Update line 33**: Change "shares the single-process execution path" to acknowledge that multi-process is architecturally possible but not currently exposed in the MCP tool interface.

3. **Update Cross-References**: Update the Python Bindings cross-reference (line 1630) to reference the multi-process sections specifically: `[Python Bindings](./python-bindings.md) -- Shares the single-process execution path (SS1.2); multi-process architecture (SS7.4) may be adopted in a future release`.

4. **Do NOT modify `cobre/run` input schema**: The `cobre/run` tool (SS2.2) does not gain `backend` or `num_workers` parameters in this ticket. The schema remains unchanged. The future-capability note in SS1.1a merely acknowledges the possibility.

### Key Design Decisions

- Multi-process is a documented future capability for MCP, not a primary feature. Keep the note brief (one subsection, 5-10 lines of prose).
- The `cobre/run` tool schema is NOT modified. This is a documentation-only change.
- The MCP server's single-process mode remains the default and recommended mode.
- No new dependency on `cobre-comm` is introduced for `cobre-mcp` in this ticket.

### Error Handling

No new error conditions are introduced. The MCP server continues to operate in single-process mode.

## Acceptance Criteria

- [ ] Given the updated `mcp-server.md`, when reading SS1.1a, then multi-process execution is documented as a future capability with cross-references to `python-bindings.md SS7.4` and `python-bindings.md SS2.1`.
- [ ] Given the updated `mcp-server.md`, when reading SS1.1a, then single-process is explicitly stated as the current default and recommended mode for AI agent interaction.
- [ ] Given the updated `mcp-server.md`, when reading SS2.2, then the `cobre/run` input schema is unchanged (no `backend` or `num_workers` parameters).
- [ ] Given the updated `mcp-server.md`, when reading line 33 (or its updated equivalent), then the text acknowledges multi-process as architecturally possible but not currently exposed.
- [ ] Given the updated `mcp-server.md`, when reading Cross-References, then the Python Bindings entry references the multi-process sections (SS7.4, SS2.1).
- [ ] The SS1.1a subsection is 5-15 lines of prose maximum (brief note, not a full architecture section).
- [ ] No existing section numbers are renumbered. The new content uses subsection notation (SS1.1a).

## Implementation Guide

### Suggested Approach

1. **Add SS1.1a** (after line 18, after the SS1.1 table): Write a brief "Future: Multi-Process Capability" subsection. Structure:
   - Opening sentence: "The MCP server currently operates in single-process mode, which is the recommended configuration for AI agent interaction."
   - Acknowledgment: "Multi-process SDDP execution via TCP or shm backends is architecturally possible using the same mechanism specified for the Python bindings API ([Python Bindings](./python-bindings.md) SS7.4)."
   - Deferral: "Exposing multi-process capability in the MCP server would require adding `backend` and `num_workers` parameters to the `cobre/run` tool input schema (SS2.2). This extension is deferred to a future release pending demonstrated demand from MCP-based agent workflows."
   - Cross-reference note: "See [Python Bindings](./python-bindings.md) SS2.1 for the multi-process API pattern that would be adapted for `cobre/run`."

2. **Update line 33**: Change from:

   > The `cobre-mcp` crate does **not** depend on `ferrompi`. It shares the single-process execution path through `cobre-sddp` with OpenMP parallelism only, identical to the execution mode used by `cobre-python` (see [Python Bindings](python-bindings.md)).

   To:

   > The `cobre-mcp` crate does **not** depend on `ferrompi`. It currently uses the single-process execution path through `cobre-sddp` with OpenMP parallelism only, matching the default execution mode of `cobre-python` (see [Python Bindings](python-bindings.md)). Multi-process execution via TCP or shm backends is architecturally possible but not currently exposed in the MCP tool interface (see SS1.1a).

3. **Update Cross-References** (line 1630): Update the Python Bindings entry to reference multi-process sections.

### Key Files to Modify

- `src/specs/interfaces/mcp-server.md` -- The sole target file. All changes are in this file.

### Patterns to Follow

- **Subsection notation**: Use `SS1.1a` (not SS1.2, which already exists as the dependency graph section).
- **Section reference convention**: Use `SS` notation (the file is in `src/specs/interfaces/`).
- **Cross-reference link format**: `[Python Bindings](./python-bindings.md)` (same directory, relative path with `./`).
- **Future capability framing**: Follow the pattern established in SS9 of `python-bindings.md` (async support): state the current status, explain the capability, and note it as optional/deferred.
- **Brevity**: This is a documentation note, not a full architecture section. Follow the design decision to keep it brief.

### Pitfalls to Avoid

- Do NOT modify the `cobre/run` input schema. The tool schema is frozen for this ticket.
- Do NOT add `cobre-comm` to the dependency graph in SS1.2. That would be a future change.
- Do NOT write a full multi-process architecture section. This is a brief note with cross-references.
- Do NOT renumber existing sections.
- Do NOT remove the "single-process" language from SS1.1. Multi-process is future/optional; single-process remains the primary mode.

## Testing Requirements

### Review Checks

- Verify the `cobre/run` input schema in SS2.2 is unchanged
- Verify SS1.1a is brief (5-15 lines)
- Verify cross-references to `python-bindings.md SS7.4` and `SS2.1` are correct (these sections must exist after ticket-014 and ticket-015 complete)
- Verify no existing section numbers are renumbered
- Verify the `SS` section convention is used

### Consistency Checks

- The future-capability note must be consistent with the multi-process architecture defined in `python-bindings.md SS7.4`
- The "single-process as default" language must be consistent with SS1.1 and SS7

## Dependencies

- **Blocked By**: ticket-007 (TCP backend spec, completed), ticket-014 (Python multi-process API establishes the pattern this ticket references)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
