# ticket-022 Write structured-output.md Spec

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Write a full implementation-ready specification for structured output in the Cobre ecosystem. This spec defines: the JSON output mode for all CLI operations, CLI subcommand architecture (`validate`, `report`, `compare`, `serve`, `run`), JSON-lines progress streaming, machine-parseable error/warning schemas, and composable pipeline patterns for agent workflows.

This is the foundation spec — the MCP server, Python bindings, and TUI all consume structured output.

## Anticipated Scope

- **File to create**: `src/specs/architecture/structured-output.md`
- **Spec sections**:
  1. Design philosophy: agent-first, human-compatible
  2. Output format selection: JSON (default for non-TTY), human-readable (default for TTY), `--output-format` override
  3. CLI subcommand architecture: `cobre run`, `cobre validate`, `cobre report`, `cobre compare`, `cobre serve`
  4. JSON output schemas: per-subcommand response schemas with versioning
  5. Progress streaming: JSON-lines protocol for training/simulation progress events
  6. Error schema: structured error/warning format (code, message, location, suggestion, severity)
  7. Exit code expansion: additional codes for new subcommands
  8. Composable pipelines: stdin/stdout patterns for agent workflows
  9. Backward compatibility: `mpiexec cobre CASE_DIR` continues to work as today
- **Key decisions**: Uses findings from ticket-019 impact assessment
- **Spec depth**: Same level as `cli-and-lifecycle.md` — concrete schemas, examples, cross-references

## Dependencies

- **Blocked By**: ticket-021 (architecture document from Epic 06)
- **Blocks**: ticket-023, ticket-024, ticket-025, ticket-026

## Effort Estimate

**Points**: 5
**Confidence**: Low (will be re-estimated during refinement)
