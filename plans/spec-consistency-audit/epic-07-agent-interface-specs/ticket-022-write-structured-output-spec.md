# ticket-022 Write structured-output.md Spec

## Context

### Background

Epic 06 assessed the impact of adding structured CLI output to every existing spec and resolved four design decisions (findings-019 SS2.1-SS2.4): human-first default, JSON-lines streaming via structured stdout with envelope, hybrid subcommand detection for backward compatibility, and generalized validation report as the error schema standard. The architecture document (architecture-021.md SS5.1) defines the exact scope for this spec. All design decisions are resolved -- this ticket writes the specification, not the design.

### Relation to Epic

This is the foundation ticket for Epic 07. The structured output protocol defines the response envelope, error schema, and JSON-lines streaming protocol that the MCP server (ticket-023), Python bindings (ticket-024), and terminal UI (ticket-025) all consume. ticket-026 cannot add cross-references until this spec exists. Per the epic overview, ticket-022 must be completed first; tickets 023-025 can then proceed in parallel.

### Current State

- No file exists at `src/specs/interfaces/structured-output.md` and no `interfaces/` subdirectory exists yet under `src/specs/`.
- The `src/SUMMARY.md` has no "Interfaces" section -- it will be added by ticket-026.
- `design-principles.md` SS6 defines 4 agent-readability rules with examples of the response envelope and error schema, but these are illustrative, not normative.
- `validation-architecture.md` SS4 defines 14 error kinds with severity and description. SS5 defines the validation report JSON structure that serves as the starting point for the generalized response envelope.
- `convergence-monitoring.md` SS2.4 defines the per-iteration output record (8 fields) that is the canonical payload for JSON-lines progress events.
- `architecture-021.md` SS3 defines the event stream architecture with 7 iteration-scoped event types and 4 lifecycle event types, along with Rust struct definitions for `ConvergenceUpdate` and `IterationSummary`.
- `findings-019` SS1 identifies 23 spec sections requiring changes for structured output, SS2 resolves the 4 design decisions, SS3 defines 14 new sections to add to existing specs.

## Specification

### Requirements

Create the file `src/specs/interfaces/structured-output.md` containing a complete, implementation-ready specification for the Cobre structured output protocol. The spec must cover all six areas defined in architecture-021.md SS5.1:

1. **Response envelope schema** -- Full JSON Schema for the top-level envelope with fields: `$schema`, `command`, `success`, `exit_code`, `cobre_version`, `errors`, `warnings`, `data`, `summary`. Include per-subcommand `data` shape specifications for: `run`, `validate`, `report`, `compare`, `version`.

2. **Error schema** -- Full definition of the structured error record with fields: `kind`, `message`, `context`, `suggestion`. The complete error kind registry containing:
   - The 14 validation kinds from validation-architecture.md SS4: `MissingFile`, `ParseError`, `SchemaViolation`, `TypeMismatch`, `OutOfRange`, `InvalidEnum`, `DuplicateId`, `MissingReference`, `CoverageMismatch`, `StageMismatch`, `IncompatibleSettings`, `PhysicalConstraint`, `CapacityViolation`, `PenaltyConsistency`
   - Runtime error kinds: `SolverFailure`, `MpiError`, `CheckpointFailed`, `OutputCorrupted`, `OutputNotFound`, `IncompatibleRuns`
   - Document each kind with: description, context fields, example, severity (error/warning-eligible)

3. **JSON-lines streaming protocol** -- Four envelope types (`started`, `progress`, `terminated`, `result`) with full payload schemas for each. Line termination rules (one JSON object per line, newline-terminated). Relationship to convergence-monitoring.md SS2.4 per-iteration record. The `progress` payload must match the `ConvergenceUpdate` event struct from architecture-021.md SS3.3.

4. **Subcommand output specifications** -- Per-subcommand response shapes for both `--output-format json` and `--output-format json-lines` modes:
   - `run`: JSON-lines streaming (started + progress + terminated + result) or single JSON result
   - `validate`: Validation report wrapped in response envelope
   - `report`: Run summary JSON from manifests + metadata
   - `compare`: Comparison JSON with deltas and statistics
   - `version`: Version information JSON

5. **Output format negotiation** -- `--output-format` flag specification with values `human` (default), `json`, `json-lines`. Interaction with `--quiet` and `--no-progress`. TTY vs pipe behavior. MPI rank 0-only output rule.

6. **Schema versioning strategy** -- `$schema` field semantics using `urn:cobre:response:v1` format. Additive-only evolution rules. Backward compatibility guarantees. When breaking changes require a version bump.

### Inputs/Props

The spec author has these authoritative sources to draw from:

| Source Document              | Relevant Sections                                                                                       | What to Extract                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `findings-019.md`            | SS2.1 (default mode), SS2.2 (streaming transport), SS2.3 (subcommand coexistence), SS2.4 (error schema) | All 4 design decisions with rationale              |
| `findings-019.md`            | SS1 (impact inventory, 23 rows)                                                                         | Affected spec sections for cross-references        |
| `architecture-021.md`        | SS3.2-SS3.3 (event types and payload shapes)                                                            | Event type definitions and Rust struct examples    |
| `architecture-021.md`        | SS5.1 (scope definition)                                                                                | Must-contain and must-NOT-contain boundaries       |
| `validation-architecture.md` | SS4 (error kinds), SS5 (report format)                                                                  | Existing 14 error kinds and validation report JSON |
| `convergence-monitoring.md`  | SS2.4 (per-iteration record)                                                                            | Canonical progress event payload fields            |
| `design-principles.md`       | SS6.2 (Rules 1-4)                                                                                       | Agent-readability rules with Cobre examples        |
| `cli-and-lifecycle.md`       | SS2 (invocation), SS4 (exit codes)                                                                      | Subcommand inventory, exit code scheme             |

### Outputs/Behavior

A single markdown file at `src/specs/interfaces/structured-output.md` that:

- Follows the style and depth of existing architecture specs (e.g., `convergence-monitoring.md`, `validation-architecture.md`) -- Purpose section, numbered sections, tables, JSON/Rust code examples, cross-references section
- Contains concrete JSON examples for every envelope type and every subcommand
- Contains the complete error kind registry as a table with stable identifiers
- Is self-contained enough for a developer to implement the structured output layer without reading the assessment documents

### Error Handling

- The spec must define what happens when `--output-format json` is combined with a subcommand that produces streaming output (`run`): the behavior is to emit only the final `result` envelope, not the streaming progress events
- The spec must define what happens when the process crashes mid-stream during `--output-format json-lines`: partial output is valid JSON-lines (each line is independently valid), and the absence of a `result` line indicates abnormal termination
- The spec must define error envelope behavior: when `success: false`, the `errors` array is non-empty and `exit_code` is non-zero

## Acceptance Criteria

- [ ] Given the file `src/specs/interfaces/structured-output.md` does not exist, when the ticket is completed, then the file exists with complete content
- [ ] Given the spec exists, when reading SS1 (or equivalent section), then the response envelope schema has all 9 top-level fields (`$schema`, `command`, `success`, `exit_code`, `cobre_version`, `errors`, `warnings`, `data`, `summary`) with types documented
- [ ] Given the spec exists, when reading the error schema section, then all 20 error kinds (14 validation + 6 runtime) are listed with description, context fields, and example JSON
- [ ] Given the spec exists, when reading the JSON-lines section, then all 4 envelope types (`started`, `progress`, `terminated`, `result`) have complete payload schemas
- [ ] Given the spec exists, when reading the subcommand output section, then all 5 subcommands (`run`, `validate`, `report`, `compare`, `version`) have documented `data` shapes for both output format modes
- [ ] Given the spec exists, when reading the format negotiation section, then `--output-format` flag behavior, `--quiet`/`--no-progress` interaction, and MPI rank-0 rule are documented
- [ ] Given the spec exists, when reading the schema versioning section, then `$schema` field semantics and additive-only evolution rules are documented
- [ ] Given the spec exists, when checking cross-references, then it references: `convergence-monitoring.md` SS2.4, `validation-architecture.md` SS4-5, `training-loop.md` SS2.1, `design-principles.md` SS6, `cli-and-lifecycle.md` SS2-4
- [ ] Given the spec exists, when checking the must-NOT-contain boundaries, then it does NOT contain MCP protocol details, Python API definitions, or TUI rendering specifications
- [ ] Given `mdbook build` is run from the repo root, then the build succeeds (note: this file will not be in SUMMARY.md yet -- ticket-026 adds it; mdbook build should still pass because unreferenced files are allowed)

## Implementation Guide

### Suggested Approach

1. Create the directory `src/specs/interfaces/` (it does not exist yet).
2. Create `src/specs/interfaces/structured-output.md` with the following section structure:
   - **Purpose** -- 1-paragraph summary
   - **1. Response Envelope Schema** -- JSON Schema definition, field-by-field table, JSON example
   - **2. Error Schema** -- Error record fields, complete error kind registry table (20 kinds), JSON examples for validation and runtime errors
   - **3. JSON-Lines Streaming Protocol** -- 4 envelope types with payload schemas, line termination rules, partial-output semantics
   - **4. Subcommand Output Specifications** -- Per-subcommand tables showing `data` shape in `json` and `json-lines` modes; JSON examples for each subcommand
   - **5. Output Format Negotiation** -- `--output-format` flag table, `--quiet`/`--no-progress` interaction matrix, MPI rank-0 rule, TTY detection (informational only, not used for auto-detection per decision 2.1)
   - **6. Schema Versioning** -- `$schema` URN format, additive-only rules, breaking change policy
   - **Cross-References** -- Links to all source specs

3. For each section, draw content from the authoritative sources listed in Inputs/Props above. Do NOT re-derive design decisions -- reference them by document and section number.
4. Follow the established spec style: use numbered sections (SS1, SS2, etc.), tables for structured data, fenced code blocks for JSON/Rust examples, and blockquotes for important notes.

### Key Files to Modify

| File                                        | Action                                 |
| ------------------------------------------- | -------------------------------------- |
| `src/specs/interfaces/structured-output.md` | **CREATE** -- The entire spec document |

No existing files are modified by this ticket. SUMMARY.md and cross-reference-index.md updates are ticket-026 scope.

### Patterns to Follow

- **Spec structure pattern**: Follow `convergence-monitoring.md` for Purpose + numbered sections + cross-references layout
- **Error catalog pattern**: Follow `validation-architecture.md` SS4 for the error kind table format (Kind, Description, Severity columns)
- **JSON example pattern**: Follow `design-principles.md` SS6.2 Rule 1 and Rule 2 examples for the response envelope and error record JSON
- **Event type pattern**: Follow `architecture-021.md` SS3.2-SS3.3 for event type tables and Rust struct definitions
- **Forward reference pattern**: Use `(planned)` annotation for references to specs not yet written (mcp-server.md, python-bindings.md, terminal-ui.md) per the established convention from Epics 05-06

### Pitfalls to Avoid

- Do NOT place the file at `src/specs/architecture/structured-output.md` -- the architecture-021.md SS5.1 specifies `src/specs/interfaces/` as the location
- Do NOT add the file to `src/SUMMARY.md` -- that is ticket-026's responsibility
- Do NOT re-derive or re-debate the 4 design decisions from findings-019 SS2 -- they are resolved. Reference them by section number
- Do NOT define MCP-specific protocol details (tool schemas, resource URIs, etc.) -- those belong to ticket-023
- Do NOT define Python exception hierarchies or PyO3 bindings -- those belong to ticket-024
- Do NOT define TUI rendering layouts or ratatui widget specifications -- those belong to ticket-025
- Do NOT duplicate the full event stream architecture from architecture-021.md SS3 -- reference it and define only the JSON serialization rules for the structured output consumer
- The outline ticket incorrectly lists the file location as `src/specs/architecture/structured-output.md`; the correct location per the architecture document is `src/specs/interfaces/structured-output.md`

## Testing Requirements

### Unit Tests

Not applicable (this is a documentation-only ticket producing a markdown specification file).

### Integration Tests

- Verify `mdbook build` succeeds with the new file present (even though SUMMARY.md does not reference it yet)

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-021 (architecture document -- completed)
- **Blocks**: ticket-023, ticket-024, ticket-025, ticket-026

## Effort Estimate

**Points**: 5
**Confidence**: High
