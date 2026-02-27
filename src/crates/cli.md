# cobre-cli

<span class="status-experimental">experimental</span>

## Overview

cobre-cli is the top-level binary crate and execution entrypoint for the Cobre
ecosystem. It orchestrates the full execution lifecycle -- from process
initialization through input loading, validation, solver execution, and
finalization -- and translates outcomes into well-defined exit codes for HPC
batch schedulers. All runtime behavior is controlled via the case directory's
`config.json`; the CLI itself accepts only the case path and a minimal set of
flags (`--validate-only`, `--version`, `--help`).

Execution proceeds through a fixed sequence of phases. The **Startup** phase
initializes MPI, detects the scheduler environment, and parses command-line
arguments. The **Validation** phase runs on rank 0 only, loading input files
and applying a five-layer validation pipeline (structural, schema, referential
integrity, dimensional consistency, semantic rules) that collects all errors
before failing so the user sees every problem in a single report. The
**Initialization** phase broadcasts validated data to all ranks, allocates
solver workspaces, and sets up scenario generation. The remaining phases --
**Training**, **Simulation**, and **Finalize** -- execute conditionally based
on configuration (e.g., simulation can be skipped, training can resume from a
checkpoint).

Exit codes follow a structured scheme: 0 for success, 1 for CLI argument
errors, 2 for configuration validation errors, 3 for input data validation
errors, 4 for runtime errors (solver failures, MPI errors), 5 for checkpoint
recovery failures, and signal-derived codes (130 for SIGINT, 137 for SIGKILL).

## Key Concepts

- **Execution phases** -- The fixed lifecycle sequence: Startup, Validation,
  Initialization, Scenario Generation, Training, Simulation, Finalize. Each
  phase has defined MPI rank participation and failure semantics.
  See [CLI and Lifecycle](../specs/architecture/cli-and-lifecycle.md).

- **Validation pipeline** -- Five sequential layers that depend on each other:
  structural (files exist and parse), schema (fields and types), referential
  integrity (cross-entity foreign keys), dimensional consistency (coverage
  completeness), and semantic (business rules). Runs on rank 0 only.
  See [Validation Architecture](../specs/architecture/validation-architecture.md).

- **Exit code semantics** -- Structured exit codes that HPC job schedulers and
  monitoring systems can interpret programmatically. Each code maps to a
  specific failure category.

- **Configuration loading** -- All execution options (skip training, skip
  simulation, warm-start mode, checkpoint interval) live in `config.json`, not
  CLI flags. This keeps job scripts stable and makes configuration
  self-documenting and version-controlled.

- **Configuration reference** -- Complete `config.json` and `stages.json` schema
  definitions, modeling/training/simulation option catalogs, and the mapping from
  formulation choices to configuration fields.
  See [Configuration Reference](../specs/configuration/configuration-reference.md).

- **Subcommand dispatch** -- Beyond the traditional `mpiexec cobre CASE_DIR`
  invocation, the CLI supports subcommands (`run`, `validate`, `report`,
  `compare`, `serve`, `version`) for operations that may not require MPI.
  Hybrid detection treats a bare path argument as implicit `run` for backward
  compatibility.
  See [CLI and Lifecycle §2.1](../specs/architecture/cli-and-lifecycle.md).

- **Output format negotiation** -- The `--output-format` global flag selects
  between human-readable text (default), structured JSON, and JSON-lines
  streaming. The flag affects only presentation, not computation.
  See [CLI and Lifecycle §8](../specs/architecture/cli-and-lifecycle.md) and
  [Structured Output](../specs/interfaces/structured-output.md).

- **Structured error responses** -- All errors produce machine-parseable records
  with `kind`, `message`, `context`, and `suggestion` fields. The 14 validation
  error kinds plus runtime kinds form a stable error registry.
  See [Structured Output](../specs/interfaces/structured-output.md).

- **Progress streaming protocol** -- Long-running operations emit per-iteration
  progress events as JSON-lines, enabling real-time monitoring by agents, the
  TUI, and MCP server.
  See [Convergence Monitoring §4.1](../specs/architecture/convergence-monitoring.md).

## Status

cobre-cli is in the **design phase**. The CLI/lifecycle and validation specs
linked above are stable and serve as the authoritative reference for
implementation. No Rust code has been published yet; the crate placeholder
exists in the Cargo workspace to reserve the module boundary.
