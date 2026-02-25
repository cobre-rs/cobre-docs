# ticket-019 Assess Structured CLI and Output Impact on Existing Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Review all existing architecture and data model specs to assess the impact of expanding the CLI from a single-entrypoint HPC batch design to a multi-subcommand, structured-output CLI that serves both human users and AI agents. Identify every spec that needs modification and catalog the required changes.

The Cobre CLI currently follows a minimal `mpiexec cobre CASE_DIR` pattern optimized for HPC batch jobs. To make the ecosystem useful for AI agents, the CLI needs: subcommands (`validate`, `report`, `compare`, `serve`), JSON structured output mode, JSON-lines progress streaming, machine-parseable error schemas, and composable stdin/stdout pipelines.

## Anticipated Scope

- **Specs to review**:
  - `specs/architecture/cli-and-lifecycle.md` — Current single-entrypoint design; needs expansion for subcommands
  - `specs/data-model/output-infrastructure.md` — Output formats; needs JSON structured output mode
  - `specs/data-model/output-schemas.md` — Schema definitions; need JSON schema versions for all outputs
  - `specs/architecture/validation-architecture.md` — Validation error reporting; needs structured error schema
  - `specs/architecture/convergence-monitoring.md` — Training log format; needs JSON-lines streaming mode
  - `specs/configuration/configuration-reference.md` — Config schema; may need output format settings
  - `crates/cli.md` — CLI crate documentation; needs subcommand architecture
- **Key decisions needed**:
  - Should structured output be the default (with `--human` for pretty-printed), or opt-in (`--output-format json`)?
  - Should progress streaming use JSON-lines to stdout or a separate file descriptor?
  - How should subcommands coexist with the current `mpiexec cobre CASE_DIR` pattern?
  - What error schema should structured errors follow (RFC 7807 Problem Details, custom, etc.)?
- **Deliverable**: Impact assessment report listing every spec change needed, with severity (REQUIRED / RECOMMENDED / OPTIONAL)

## Dependencies

- **Blocked By**: None (can start independently)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
