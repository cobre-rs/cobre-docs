# findings-019: Structured CLI and Output Impact Assessment

## Summary

This report catalogs the impact of adding structured CLI output capabilities to the Cobre solver on every existing spec that currently assumes human-only output, single-entrypoint CLI, or lacks structured output support. The assessment covers 7 spec files and the cross-reference index, identifies 23 affected spec sections, resolves 4 design decisions, and confirms full backward compatibility with the existing `mpiexec cobre CASE_DIR` invocation pattern.

**Key finding**: The existing specs are well-structured for extension. The validation report (validation-architecture.md SS5) already demonstrates the structured JSON output pattern that should be generalized across all CLI responses. The convergence training log (convergence-monitoring.md SS4) is the single largest gap -- it is the only runtime progress output and is entirely human-readable with no machine-parseable alternative.

---

## 1. Impact Inventory Table

Each row identifies a spec section that needs modification to support structured CLI output. Severity levels:

- **REQUIRED** -- Blocks agent usability; structured CLI cannot function without this change
- **RECOMMENDED** -- Significantly improves agent usability; structured CLI is degraded without it
- **OPTIONAL** -- Nice-to-have; structured CLI works without it but is less complete

| #   | Spec File                  | Section                           | Current State                                                                             | Required Change                                                                                                                                                                                                                                                                                                                                                     | Severity    | Notes                                                                                                                                                                                                    |
| --- | -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | cli-and-lifecycle.md       | SS1 Design Philosophy             | States "single-entrypoint design optimized for HPC batch execution"                       | Expand philosophy to include agent-composable interface alongside HPC batch; add principle that all CLI output supports structured (JSON) and human modes                                                                                                                                                                                                           | REQUIRED    | Foundation for all other changes; without updating the stated philosophy, every subcommand addition contradicts SS1                                                                                      |
| 2   | cli-and-lifecycle.md       | SS2 Invocation Pattern            | Shows only `mpiexec cobre CASE_DIR` pattern                                               | Add subcommand invocation patterns: `cobre run CASE_DIR` (MPI), `cobre validate CASE_DIR` (single-process), `cobre report CASE_DIR`, `cobre compare DIR1 DIR2`, `cobre serve`                                                                                                                                                                                       | REQUIRED    | The `mpiexec cobre CASE_DIR` pattern is preserved as equivalent to `mpiexec cobre run CASE_DIR`; new subcommands do not require MPI                                                                      |
| 3   | cli-and-lifecycle.md       | SS3 CLI Table                     | 4 arguments only: CASE_DIR, --validate-only, --version, --help                            | Add global flags: `--output-format` (json/human/json-lines), `--quiet`, `--no-progress`; add subcommand-specific arguments; deprecate `--validate-only` in favor of `cobre validate` subcommand                                                                                                                                                                     | REQUIRED    | The `--validate-only` flag becomes an alias for `cobre validate` for backward compatibility                                                                                                              |
| 4   | cli-and-lifecycle.md       | SS4 Exit Codes                    | 7 exit codes (0-5, 130, 137)                                                              | Add exit code documentation for new subcommands; document that all non-zero exits produce structured error JSON on stderr when `--output-format json` is active                                                                                                                                                                                                     | RECOMMENDED | Existing codes remain valid; new subcommands reuse same code scheme                                                                                                                                      |
| 5   | cli-and-lifecycle.md       | SS5 Execution Phases              | Phases assume single-entrypoint full-lifecycle execution                                  | Add phase mappings for each subcommand: `validate` = Startup + Validation only; `report` = read output files only (no MPI phases); `compare` = read two output sets; `serve` = long-lived event loop                                                                                                                                                                | REQUIRED    | Must clarify which subcommands participate in which phases and which require MPI                                                                                                                         |
| 6   | cli-and-lifecycle.md       | SS5.3 Conditional Execution       | Mode selection via config.json flags and --validate-only                                  | Add subcommand-based mode selection as the primary mechanism; config.json flags remain for `run` subcommand internal mode selection (training-only, simulation-only)                                                                                                                                                                                                | RECOMMENDED | The 4-mode table (Full Run, Training Only, Simulation Only, Validation Only) applies within the `run` subcommand                                                                                         |
| 7   | cli-and-lifecycle.md       | SS6 Configuration Resolution      | Two categories: resource allocations and algorithm parameters                             | Add third category: CLI output preferences (`--output-format`, `--quiet`); document that these are transient (not recorded in metadata) and do not affect computation                                                                                                                                                                                               | RECOMMENDED | Output format is a presentation concern, not a computation parameter                                                                                                                                     |
| 8   | cli-and-lifecycle.md       | SS7 Signal Handling               | Graceful shutdown for SIGTERM/SIGINT                                                      | Document signal handling behavior for non-MPI subcommands (validate, report, compare, serve); serve subcommand needs its own shutdown protocol                                                                                                                                                                                                                      | RECOMMENDED | Non-MPI subcommands are single-process; shutdown is simpler but still needs documentation                                                                                                                |
| 9   | convergence-monitoring.md  | SS4 Training Log Format           | Human-readable fixed-width text: header, per-iteration line, termination summary          | Add parallel JSON-lines output mode emitting one JSON object per iteration with the same fields as SS2.4 (iteration, lower_bound, upper_bound, etc.); specify that JSON-lines mode and human text mode are selected by `--output-format`                                                                                                                            | REQUIRED    | This is the highest-impact single change. The human text log has no machine-parseable equivalent; agents cannot monitor training progress without JSON-lines                                             |
| 10  | convergence-monitoring.md  | SS2.4 Per-Iteration Output Record | Defines record fields but only for internal use and text log                              | Formalize this record as the JSON-lines schema; add a subsection specifying the JSON field names and types for each per-iteration record                                                                                                                                                                                                                            | REQUIRED    | The fields already exist (iteration, lower_bound, upper_bound, upper_bound_std, ci_95, gap, wall_time, iteration_time); they just need a JSON serialization specification                                |
| 11  | convergence-monitoring.md  | SS2.3 Convergence Evaluation      | Termination reason recorded in log and metadata                                           | Specify that termination event is emitted as a final JSON-lines record with `"event": "terminated"` and the termination reason, or as a separate structured termination summary object                                                                                                                                                                              | RECOMMENDED | Agents need a machine-parseable signal that training has ended and why                                                                                                                                   |
| 12  | validation-architecture.md | SS5 Validation Report Format      | Already structured JSON with errors, warnings, summary                                    | Generalize this pattern as the canonical structured output schema for the `validate` subcommand; add `$schema` reference; ensure the format can be extended for other subcommand responses                                                                                                                                                                          | RECOMMENDED | Excellent existing foundation; needs minor additions: `$schema` field, `cobre_version` field, `exit_code` field                                                                                          |
| 13  | validation-architecture.md | SS3 Error Collection Strategy     | Errors emitted to validation report and program log                                       | Clarify that in `--output-format json` mode, the validation report is written to stdout (not just to file and log); specify that stderr receives progress indicators if any                                                                                                                                                                                         | RECOMMENDED | Currently the report is written to `{case_directory}/validation_report.json` and "emitted to the program log"; for agent consumption it should also go to stdout                                         |
| 14  | validation-architecture.md | SS4 Error Type Catalog            | 14 error kinds with severity and description                                              | Document that error kinds map directly to structured error response `kind` field; confirm these are stable identifiers for programmatic matching                                                                                                                                                                                                                    | OPTIONAL    | Already well-structured; just needs explicit stability guarantee                                                                                                                                         |
| 15  | output-infrastructure.md   | SS1 Manifest Files                | Simulation and training manifests are already JSON                                        | Document that manifests are readable via `cobre report` subcommand and returned as structured JSON; no schema change needed for the manifests themselves                                                                                                                                                                                                            | RECOMMENDED | Manifests already follow the structured pattern; they just need to be surfaced through the CLI                                                                                                           |
| 16  | output-infrastructure.md   | SS2 Metadata File                 | Comprehensive JSON metadata for reproducibility                                           | Same as SS1 -- document that metadata is accessible via `cobre report` and returned as structured JSON                                                                                                                                                                                                                                                              | RECOMMENDED | Already well-structured; just needs CLI surface                                                                                                                                                          |
| 17  | output-infrastructure.md   | SS4 Output Size Estimates         | Table of file sizes by scale                                                              | Add size estimates for JSON-lines training log (negligible: ~100 bytes per iteration, ~10 KB for 100 iterations) and structured CLI responses (negligible: < 10 KB per invocation)                                                                                                                                                                                  | OPTIONAL    | JSON-lines overhead is trivial compared to Parquet outputs                                                                                                                                               |
| 18  | output-schemas.md          | SS6.1 Convergence Log             | Parquet schema for `training/convergence.parquet`                                         | Document the relationship between this Parquet schema and the JSON-lines streaming schema from convergence-monitoring.md; they represent the same data in different formats (Parquet for post-hoc analysis, JSON-lines for real-time streaming)                                                                                                                     | RECOMMENDED | Avoids confusion between the two representations of convergence data                                                                                                                                     |
| 19  | output-schemas.md          | SS1-SS6 (all 14 schemas)          | All schemas are Parquet column definitions                                                | Add a subsection clarifying which schemas need JSON equivalents for agent consumption: convergence log (SS6.1) and dictionary files (SS3, SS4.2, SS4.3, SS4.4) already have JSON/CSV equivalents; simulation entity schemas (SS5.1-SS5.11) do NOT need JSON equivalents (Parquet is the correct format for large tabular data; agents use Arrow/Polars for Parquet) | OPTIONAL    | JSON schema equivalents are NOT needed for the 11 simulation Parquet schemas. Agents consume Parquet via Arrow libraries. Only metadata/dictionary files need JSON access, and they are already JSON/CSV |
| 20  | configuration-reference.md | SS7 Complete Example              | Shows `config.json` with no output format settings                                        | Add documentation for new `output` section in config.json (if output format defaults are configurable via config, not just CLI flags) or explicitly state that output format is CLI-only and not persisted in config                                                                                                                                                | RECOMMENDED | Design decision: should `config.json` support an `output.format` field? Recommendation: NO -- output format is a presentation concern controlled by CLI flags only                                       |
| 21  | configuration-reference.md | SS1 Configuration File Split      | Two files: config.json and stages.json                                                    | Add note that CLI output preferences (--output-format, --quiet) are NOT part of either configuration file; they are transient CLI flags that do not affect computation or reproducibility                                                                                                                                                                           | OPTIONAL    | Prevents users from looking for output format settings in config.json                                                                                                                                    |
| 22  | cli.md (crate)             | Full document                     | Describes single-entrypoint binary crate with no subcommands                              | Expand to describe subcommand architecture: `run` (default, MPI), `validate`, `report`, `compare`, `serve`; note that only `run` requires MPI; all subcommands support `--output-format json`                                                                                                                                                                       | REQUIRED    | This is the implementation-facing crate doc; must reflect the subcommand design                                                                                                                          |
| 23  | cli.md (crate)             | Key Concepts                      | Lists execution phases, validation pipeline, exit codes, config loading, config reference | Add key concepts: subcommand dispatch, output format negotiation (json/human/json-lines), structured error responses, progress streaming protocol                                                                                                                                                                                                                   | REQUIRED    | Missing concepts that are fundamental to the structured CLI design                                                                                                                                       |

---

## 2. Design Decision Recommendations

### 2.1 Default Output Mode

**Decision**: Should the default output mode be structured-first (`--human` opt-in for pretty-printing) or human-first (`--output-format json` opt-in for structured)?

**Options Considered**:

| Option                       | Description                                                                  | Pros                                                                                                           | Cons                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A. Structured-first          | Default output is JSON; `--human` flag for pretty-printed text               | Agent-optimized; forces structured output as the primary interface; no silent regressions in structured output | Breaks every existing user workflow; HPC operators expect text output; job scheduler log monitoring assumes text |
| B. Human-first (opt-in JSON) | Default output is human-readable text; `--output-format json` for structured | Fully backward compatible; matches Unix convention; HPC operators see familiar text output                     | Agents must always remember to pass `--output-format json`; easy to forget in automation                         |
| C. Auto-detect               | Detect if stdout is a TTY; JSON if piped, human if terminal                  | Automatic correct behavior in most cases; agents piping output get JSON; humans at terminal get text           | Surprising behavior; hard to reason about in scripts; TTY detection unreliable in containers/CI                  |

**Recommendation**: **Option B (human-first, opt-in JSON)**

**Rationale**:

1. **Backward compatibility** is a hard constraint (epic overview). Changing the default output format would break every existing SLURM job script, log monitoring setup, and operator workflow.
2. **Unix convention**: `jq`, `kubectl`, `gh`, and `docker` all default to human-readable output with `--output json` or `-o json` flags.
3. **Agent frameworks** (Claude Code, Cursor, etc.) can trivially add `--output-format json` to every invocation. The one-time cost of adding a flag is negligible compared to the disruption of changing defaults.
4. **The `run` subcommand** (the MPI path) outputs streaming text during training and Parquet files on disk -- structured JSON for the training log is accessed via `--output-format json-lines`, not by changing the default.

**Flag specification**: `--output-format <format>` where format is one of:

- `human` (default) -- Current text output, unchanged
- `json` -- Single JSON object on stdout for command result
- `json-lines` -- JSON-lines streaming for `run` subcommand progress (one JSON object per line, per iteration)

### 2.2 Progress Streaming Transport

**Decision**: How should training progress be streamed in structured mode -- JSON-lines to stdout, JSON-lines to a separate file descriptor, or another mechanism?

**Options Considered**:

| Option                             | Description                                                                                             | Pros                                                                                   | Cons                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A. JSON-lines to stdout            | Progress lines go to stdout; final result also to stdout                                                | Simple; standard Unix piping; `jq` can process in real time                            | Mixes progress and result on same stream; agent must parse line-by-line to separate progress from final result |
| B. Separate fd (fd 3)              | Progress to fd 3; result to stdout                                                                      | Clean separation of progress and result; stdout is always the final answer             | Non-standard; many shells do not easily redirect fd 3; MPI launchers may not propagate extra fds               |
| C. Separate file                   | Progress written to `training/progress.jsonl` on disk; final result to stdout                           | Clean separation; file can be tailed; works with all MPI launchers                     | Requires polling/inotify for real-time monitoring; extra I/O; disk path must be known in advance               |
| D. Structured stdout with envelope | Every stdout line is JSON with a `type` field: `{"type": "progress", ...}` or `{"type": "result", ...}` | Single stream, self-describing; easy to filter with `jq 'select(.type == "progress")'` | Slightly more complex parsing; every line must be valid JSON                                                   |

**Recommendation**: **Option D (structured stdout with envelope)**

**Rationale**:

1. **MPI compatibility**: MPI launchers (`mpiexec`, `srun`) reliably propagate stdout from rank 0. Extra file descriptors (Option B) are not reliably forwarded through MPI process management.
2. **Agent simplicity**: A single stdout stream with self-describing JSON objects is the simplest model for agents. Each line is `{"type": "progress", "iteration": 5, "lower_bound": 1234.5, ...}` or `{"type": "result", "status": "success", ...}`. Agents filter by `type` field.
3. **Disk file alternative**: The on-disk `training/convergence.parquet` file already captures the same data for post-hoc analysis. The JSON-lines stream is for real-time consumption.
4. **Separation from human mode**: In human mode (default), stdout shows the current text log (SS4 format). In `--output-format json-lines`, stdout shows the structured envelope format. The two modes are mutually exclusive.

**Envelope schema (outline -- not full design)**:

```
{"type": "started", "case": "/path/to/case", "timestamp": "...", "cobre_version": "2.0.0"}
{"type": "progress", "iteration": 1, "lower_bound": ..., "upper_bound": ..., ...}
{"type": "progress", "iteration": 2, ...}
{"type": "terminated", "reason": "bound_stalling", "iterations": 87, ...}
{"type": "result", "status": "success", "exit_code": 0, "output_directory": "...", ...}
```

### 2.3 Subcommand Coexistence with MPI Pattern

**Decision**: How do subcommands coexist with the `mpiexec cobre CASE_DIR` invocation pattern?

**Options Considered**:

| Option                    | Description                                                                                                           | Pros                                                                                              | Cons                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A. Implicit `run` default | `cobre CASE_DIR` is equivalent to `cobre run CASE_DIR`; new subcommands are explicit                                  | Full backward compatibility; existing scripts unchanged; `mpiexec cobre CASE_DIR` works as before | Argument parsing must distinguish a path from a subcommand name; potential ambiguity if a case directory is named `validate` |
| B. Mandatory subcommand   | All invocations require a subcommand: `cobre run CASE_DIR`, `cobre validate CASE_DIR`                                 | Unambiguous parsing; clear intent in every invocation                                             | Breaks every existing `mpiexec cobre CASE_DIR` script; violates backward compatibility constraint                            |
| C. Hybrid detection       | If first positional argument is a known subcommand, parse as subcommand; otherwise treat as CASE_DIR (implicit `run`) | Best of both worlds; backward compatible and unambiguous for new subcommands                      | Slightly more complex parser; must ensure no subcommand name collides with valid directory names                             |

**Recommendation**: **Option C (hybrid detection)**

**Rationale**:

1. **Backward compatibility**: `mpiexec cobre /path/to/case` continues to work exactly as today -- the parser sees `/path/to/case` is not a known subcommand, so it dispatches to `run`.
2. **Unambiguous subcommands**: Subcommand names (`run`, `validate`, `report`, `compare`, `serve`, `version`, `help`) are fixed strings that cannot collide with filesystem paths (which contain `/` or `.`).
3. **Standard pattern**: This is the same approach used by `git` (where `git init` is a subcommand but `git` alone prints help) and `cargo` (where `cargo build` is a subcommand).
4. **Implementation**: The argument parser checks if `argv[1]` matches a known subcommand. If yes, dispatch to that subcommand. If no, treat all positional arguments as the `run` subcommand's CASE_DIR argument.

**Subcommand inventory**:

| Subcommand | MPI Required           | Description                     | Output (json mode)                                 |
| ---------- | ---------------------- | ------------------------------- | -------------------------------------------------- |
| `run`      | Yes (implicit default) | Full execution lifecycle        | JSON-lines progress + result envelope              |
| `validate` | No                     | Validate case inputs            | Validation report JSON (existing format, extended) |
| `report`   | No                     | Summarize completed run outputs | Run summary JSON (from manifests + metadata)       |
| `compare`  | No                     | Compare two run outputs         | Comparison JSON (deltas, statistics)               |
| `serve`    | No                     | Long-running MCP/HTTP server    | Server status JSON; MCP protocol on stdio          |
| `version`  | No                     | Print version info              | Version JSON                                       |
| `help`     | No                     | Print usage                     | Help text (always human-readable)                  |

**MPI note**: When `mpiexec cobre run CASE_DIR` is invoked, non-rank-0 processes suppress all stdout/stderr output (as they do today). Structured output is always from rank 0 only.

### 2.4 Error Schema Standard

**Decision**: Should structured error responses follow RFC 7807 Problem Details, the existing validation report format, or a custom schema?

**Options Considered**:

| Option                          | Description                                                                                                                | Pros                                                                                                                   | Cons                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A. RFC 7807 Problem Details     | Standard fields: `type`, `title`, `status`, `detail`, `instance`                                                           | Industry standard; recognized by API clients and agent frameworks; extensible                                          | Designed for HTTP APIs, not CLI tools; `status` field implies HTTP status codes; `type` field expects a URI |
| B. Generalize validation report | Extend the existing validation report JSON (SS5) as the error schema for all subcommands                                   | Reuses proven pattern; no new schema to design; `kind`, `file`, `entity`, `message` fields are already agent-parseable | Validation-specific fields (`files_checked`, `entities_validated`) do not apply to runtime errors           |
| C. Custom CLI error schema      | Design a new schema: `error_code`, `kind`, `message`, `context`, `suggestions`                                             | Tailored to CLI use case; can include actionable suggestions; no HTTP baggage                                          | Yet another error format; agents must learn a non-standard schema                                           |
| D. Adapted RFC 7807             | Use RFC 7807 field names but adapt semantics for CLI: `type` is error kind URI, `status` is exit code, `detail` is message | Gets the benefit of a standard shape with CLI semantics; `type` as `urn:cobre:error:SchemaViolation`                   | Slightly non-standard use of RFC 7807; purists may object                                                   |

**Recommendation**: **Option B (generalize validation report) with Option C enrichments**

**Rationale**:

1. **The validation report already works**: The existing schema in validation-architecture.md SS5 is already structured JSON with `errors[]`, `warnings[]`, and `summary`. It is proven and agent-parseable.
2. **Generalization path**: The validation report can be generalized into a universal response envelope:
   ```json
   {
     "$schema": "...",
     "command": "validate",
     "success": false,
     "exit_code": 3,
     "timestamp": "...",
     "cobre_version": "2.0.0",
     "errors": [...],
     "warnings": [...],
     "data": { ... },
     "summary": { ... }
   }
   ```

   - For `validate`: `data` is null; `errors`/`warnings` contain validation results (existing format)
   - For `report`: `data` contains the run summary; `errors`/`warnings` are empty
   - For `run` with failure: `errors` contains the runtime error; `data` contains partial results if available
3. **Error `kind` field**: The existing 14 error kinds (SS4) are already stable identifiers. New subcommands can add new kinds (e.g., `RuntimeError`, `SolverFailure`, `MpiError`) following the same pattern.
4. **RFC 7807 is overkill**: Cobre is not an HTTP API. The `type` URI, `status` HTTP code, and `instance` resource identifier fields from RFC 7807 add complexity without benefit for a CLI tool.
5. **Actionable suggestions**: The generalized schema can include a `suggestions` field (from Option C) for common errors, e.g., `"suggestion": "Check that bus_id 99 exists in buses.json"`.

---

## 3. New Section Inventory

These are new sections that need to be added to existing specs in Epic 07. No new spec files are created by this assessment (new spec files are Epic 07 scope).

| #   | Target Spec                | New Section Title                        | Description                                                                                                                                                                  | Relates To            |
| --- | -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | cli-and-lifecycle.md       | SS1.1 Agent Composability Principle      | New subsection documenting the dual design philosophy: HPC batch + agent-composable interfaces                                                                               | Impact row 1          |
| 2   | cli-and-lifecycle.md       | SS2.1 Subcommand Invocation Patterns     | New subsection with examples for each subcommand alongside the existing MPI patterns                                                                                         | Impact rows 2, 5      |
| 3   | cli-and-lifecycle.md       | SS3.1 Global CLI Flags                   | New subsection for flags that apply to all subcommands: `--output-format`, `--quiet`, `--no-progress`                                                                        | Impact row 3          |
| 4   | cli-and-lifecycle.md       | SS3.2 Subcommand Arguments               | New subsection with per-subcommand argument tables                                                                                                                           | Impact row 3          |
| 5   | cli-and-lifecycle.md       | SS5.4 Subcommand Phase Mapping           | New subsection mapping each subcommand to which execution phases it participates in                                                                                          | Impact row 5          |
| 6   | cli-and-lifecycle.md       | SS8 Structured Output Protocol           | New section defining the output format negotiation, envelope schema, and JSON-lines streaming protocol                                                                       | Impact rows 1-3, 9-10 |
| 7   | convergence-monitoring.md  | SS4.1 JSON-Lines Streaming Schema        | New subsection defining the JSON-lines format for real-time progress streaming, referencing SS2.4 field definitions                                                          | Impact rows 9-10      |
| 8   | convergence-monitoring.md  | SS4.2 Termination Event Schema           | New subsection defining the structured termination event emitted at training end                                                                                             | Impact row 11         |
| 9   | validation-architecture.md | SS5.1 Structured Output Integration      | New subsection specifying how the validation report is emitted via stdout in `--output-format json` mode and how the `validate` subcommand wraps it in the response envelope | Impact rows 12-13     |
| 10  | validation-architecture.md | SS5.2 Response Envelope Schema           | New subsection (or cross-reference to cli-and-lifecycle.md SS8) defining the generalized response envelope that wraps validation results                                     | Impact row 12         |
| 11  | output-infrastructure.md   | SS1.3 CLI Report Access                  | New subsection documenting that manifests and metadata are accessible via the `report` subcommand and returned as structured JSON                                            | Impact rows 15-16     |
| 12  | output-schemas.md          | SS7 Structured Output vs Parquet Schemas | New section clarifying the distinction between structured CLI output (JSON) and Parquet output schemas, and which schemas have JSON equivalents                              | Impact row 19         |
| 13  | configuration-reference.md | SS1.1 CLI Presentation Settings          | New subsection explicitly stating that output format is a CLI flag, not a config parameter, and documenting why                                                              | Impact rows 20-21     |
| 14  | cli.md (crate)             | Subcommand Architecture                  | New section describing the subcommand dispatch, which subcommands require MPI, and the output format negotiation                                                             | Impact rows 22-23     |

---

## 4. Backward Compatibility Analysis

### 4.1 Preserved Behaviors

The following existing behaviors are **explicitly preserved** under all recommended changes:

| Behavior                                   | Current                                        | After Changes                                                                       | Verification                                                        |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `mpiexec -n 8 cobre /path/to/case`         | Full execution lifecycle                       | Identical -- implicit `run` subcommand dispatch                                     | Hybrid detection (Decision 2.3, Option C) treats path as CASE_DIR   |
| `mpiexec -n 1 cobre /path --validate-only` | Validation-only mode                           | Identical -- `--validate-only` remains as alias for `cobre validate`                | Backward-compat alias in argument parser                            |
| `cobre --version`                          | Print version, exit 0                          | Identical                                                                           | Preserved as global flag                                            |
| `cobre --help`                             | Print usage, exit 0                            | Identical (updated help text includes subcommands)                                  | Preserved as global flag                                            |
| Exit codes 0-5, 130, 137                   | As documented in SS4                           | Unchanged                                                                           | No existing codes are removed or reassigned                         |
| Human-readable stdout                      | Text training log, text errors                 | Default behavior unchanged; JSON only when `--output-format` is explicitly provided | Decision 2.1 (human-first)                                          |
| Training log format                        | Fixed-width text per SS4                       | Unchanged in default mode; JSON-lines only when `--output-format json-lines`        | Existing text format is not removed                                 |
| Output files on disk                       | Parquet + JSON manifests + JSON metadata       | Unchanged                                                                           | Structured CLI output is a presentation layer, not a storage change |
| Validation report file                     | Written to `{case_dir}/validation_report.json` | Still written to file; additionally emitted to stdout in JSON mode                  | Additive behavior                                                   |
| config.json schema                         | No output format fields                        | No output format fields added                                                       | Decision: output format is CLI-only                                 |
| Signal handling                            | SIGTERM/SIGINT graceful shutdown               | Unchanged for `run` subcommand                                                      | Non-MPI subcommands have simpler shutdown                           |

### 4.2 Deprecation Path

| Deprecated Pattern     | Replacement                          | Timeline                                      | Compatibility                               |
| ---------------------- | ------------------------------------ | --------------------------------------------- | ------------------------------------------- |
| `--validate-only` flag | `cobre validate CASE_DIR` subcommand | Emit deprecation warning for 2 major versions | Flag continues to work; just prints warning |

### 4.3 MPI Compatibility

**No MPI changes are required.** The structured CLI layer is purely a presentation concern:

- `run` subcommand uses MPI exactly as today
- New subcommands (`validate`, `report`, `compare`, `serve`) are single-process and never initialize MPI
- The argument parser (which determines the subcommand) runs before `MPI_Init`
- Rank 0 is the sole producer of structured output; non-rank-0 processes suppress stdout/stderr as they do today

### 4.4 SLURM Integration

Existing SLURM job scripts of the form:

```bash
#!/bin/bash
#SBATCH --nodes=4
#SBATCH --ntasks-per-node=32
srun cobre /scratch/case_001
```

continue to work without modification. The `srun cobre /scratch/case_001` invocation is parsed as implicit `run` with CASE_DIR `/scratch/case_001`.

---

## 5. Convergence Monitoring: JSON-Lines Recommendation

This section addresses the specific relationship between the current text training log (convergence-monitoring.md SS4) and the proposed JSON-lines alternative.

### 5.1 Current Text Log

The current training log (SS4) outputs:

- A decorative header with case name, timestamp, rank/thread/stage/hydro counts
- Per-iteration lines: `Iter <n> | LB: <value> | UB: <value> +/- <ci_95> | Gap: <value>%`
- A decorative termination summary with final statistics

### 5.2 Recommended JSON-Lines Alternative

The JSON-lines format uses the **same fields** defined in SS2.4 (Per-Iteration Output Record):

```json
{
  "type": "progress",
  "iteration": 1,
  "lower_bound": 1234567.89,
  "upper_bound": 1345678.9,
  "upper_bound_std": 12345.67,
  "ci_95": 2420.73,
  "gap": 0.0899,
  "wall_time_ms": 45200,
  "iteration_time_ms": 45200
}
```

### 5.3 Relationship Between Formats

| Aspect      | Text Log (SS4)                                         | JSON-Lines                                     | Parquet (SS6.1)                   |
| ----------- | ------------------------------------------------------ | ---------------------------------------------- | --------------------------------- |
| Purpose     | Human monitoring during execution                      | Agent/programmatic monitoring during execution | Post-hoc analysis after execution |
| Transport   | stdout                                                 | stdout (with `--output-format json-lines`)     | Disk file                         |
| Timing      | Real-time, per iteration                               | Real-time, per iteration                       | Written once at finalization      |
| Fields      | Subset (LB, UB, CI, Gap)                               | Full (all SS2.4 fields)                        | Full (all SS6.1 columns)          |
| Persistence | Ephemeral (gone after process exits unless redirected) | Ephemeral (same)                               | Permanent on disk                 |
| Schema      | No schema (display format)                             | Defined by SS4.1 (new section)                 | Defined by SS6.1 (existing)       |

**Key principle**: Text log and JSON-lines are **mutually exclusive output modes** for the same event stream. They are **not** separate outputs. When `--output-format human` (default), the text log is emitted. When `--output-format json-lines`, the JSON-lines stream is emitted. The Parquet convergence log is always written to disk regardless of output mode.

### 5.4 Generalization of Validation Report

The existing validation report (validation-architecture.md SS5) can serve as the foundation for the structured error schema with the following extensions:

| Current Field    | Generalized Field | Notes                                                                 |
| ---------------- | ----------------- | --------------------------------------------------------------------- |
| `valid`          | `success`         | Renamed for consistency across subcommands                            |
| `timestamp`      | `timestamp`       | Unchanged                                                             |
| `case_directory` | `case_directory`  | Unchanged; null for commands that do not operate on a case            |
| (new)            | `command`         | Subcommand that produced the response                                 |
| (new)            | `exit_code`       | Numeric exit code                                                     |
| (new)            | `cobre_version`   | Version string for schema evolution                                   |
| (new)            | `$schema`         | JSON Schema reference URL                                             |
| `errors[]`       | `errors[]`        | Unchanged structure; extended with new error kinds for runtime errors |
| `warnings[]`     | `warnings[]`      | Unchanged                                                             |
| `summary`        | `summary`         | Generalized: different fields per subcommand                          |
| (new)            | `data`            | Subcommand-specific result data (null for validate)                   |

The existing 14 error kinds (SS4) remain unchanged. New kinds are added for runtime errors:

| New Error Kind     | Severity | Applicable Subcommands |
| ------------------ | -------- | ---------------------- |
| `SolverFailure`    | Error    | run                    |
| `MpiError`         | Error    | run                    |
| `OutputCorrupted`  | Error    | report, compare        |
| `OutputNotFound`   | Error    | report, compare        |
| `IncompatibleRuns` | Error    | compare                |

---

## 6. Parquet Schema JSON Equivalents Assessment

This section addresses whether JSON schema equivalents are needed for the 14 Parquet schemas defined in output-schemas.md.

### 6.1 Assessment by Schema

| Schema             | SS Reference | JSON Equivalent Needed?            | Rationale                                                                              |
| ------------------ | ------------ | ---------------------------------- | -------------------------------------------------------------------------------------- |
| Costs              | SS5.1        | NO                                 | Large tabular data (stages x blocks per scenario); agents use Arrow/Polars for Parquet |
| Hydros             | SS5.2        | NO                                 | Same -- large tabular data                                                             |
| Thermals           | SS5.3        | NO                                 | Same                                                                                   |
| Exchanges          | SS5.4        | NO                                 | Same                                                                                   |
| Buses              | SS5.5        | NO                                 | Same                                                                                   |
| Pumping Stations   | SS5.6        | NO                                 | Same                                                                                   |
| Contracts          | SS5.7        | NO                                 | Same                                                                                   |
| Non-Controllables  | SS5.8        | NO                                 | Same                                                                                   |
| Batteries          | SS5.9        | NO                                 | Same (deferred)                                                                        |
| Inflow Lags        | SS5.10       | NO                                 | Same                                                                                   |
| Generic Violations | SS5.11       | NO                                 | Same                                                                                   |
| Convergence Log    | SS6.1        | YES (already served by JSON-lines) | Small data; real-time streaming use case; JSON-lines format mirrors these columns      |
| Iteration Timing   | SS6.2        | NO                                 | Post-hoc profiling data; Parquet is appropriate                                        |
| MPI Rank Timing    | SS6.3        | NO                                 | Post-hoc profiling data; Parquet is appropriate                                        |

### 6.2 Existing JSON Files (No Change Needed)

The following output files are already JSON/CSV and need no schema changes:

| File                                 | Format | Notes                                                  |
| ------------------------------------ | ------ | ------------------------------------------------------ |
| `_manifest.json` (simulation)        | JSON   | Already structured; accessible via `report` subcommand |
| `_manifest.json` (training)          | JSON   | Same                                                   |
| `metadata.json`                      | JSON   | Same                                                   |
| `dictionaries/codes.json`            | JSON   | Same                                                   |
| `dictionaries/state_dictionary.json` | JSON   | Same                                                   |
| `dictionaries/variables.csv`         | CSV    | Readable via standard tools; no JSON needed            |
| `dictionaries/entities.csv`          | CSV    | Same                                                   |

### 6.3 Summary

**No new JSON schema equivalents are needed for any of the 14 Parquet schemas.** The only structured output that needs a JSON representation is the per-iteration convergence data, which is served by the JSON-lines streaming protocol (not by a separate JSON file). Agents access Parquet files through Arrow libraries, which are universally available in Python, R, Julia, and Rust.

---

## 7. Cross-Reference Impact

### 7.1 Entries Requiring Update in cross-reference-index.md

| Index Entry                            | Current State                                                                 | Required Update                                                                                                                                             | Severity                         |
| -------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Row 30: cli-and-lifecycle.md           | Primary crate: cobre-cli, Secondary: none                                     | No change to crate assignment; update outgoing references if new sections reference other specs                                                             | OPTIONAL                         |
| Row 39: convergence-monitoring.md      | Primary crate: cobre-sddp, Secondary: none                                    | Add secondary crate: cobre-cli (because JSON-lines streaming protocol is surfaced through CLI)                                                              | RECOMMENDED                      |
| Row 31: validation-architecture.md     | Primary crate: cobre-io, Secondary: cobre-cli                                 | No change to crate assignment; update outgoing references if SS5.1/SS5.2 reference cli-and-lifecycle.md SS8                                                 | OPTIONAL                         |
| Row 49: configuration-reference.md     | Primary crate: cobre-cli, Secondary: cobre-sddp, cobre-stochastic, cobre-core | No change                                                                                                                                                   | --                               |
| Row 12: output-infrastructure.md       | Primary crate: cobre-io, Secondary: ferrompi, cobre-sddp                      | Add secondary crate: cobre-cli (because manifests are surfaced through `report` subcommand)                                                                 | RECOMMENDED                      |
| SS2 Per-Crate Reading Lists: cobre-cli | 3 primary specs, 3 secondary                                                  | Add convergence-monitoring.md as secondary; update reading list to reflect subcommand architecture                                                          | RECOMMENDED                      |
| SS3 Outgoing Cross-Reference Table     | cli-and-lifecycle.md references listed                                        | Update outgoing references when new sections are added (SS8 will reference convergence-monitoring.md, validation-architecture.md, output-infrastructure.md) | REQUIRED (after Epic 07 changes) |
| SS4 Incoming Cross-Reference Table     | convergence-monitoring.md referenced by listed specs                          | Add cli-and-lifecycle.md as incoming reference to convergence-monitoring.md                                                                                 | REQUIRED (after Epic 07 changes) |

### 7.2 New Cross-References Created

When Epic 07 implements the recommended changes, these new cross-references will be created:

| Source Spec                      | Target Spec                     | Direction | Reason                                                                             |
| -------------------------------- | ------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| cli-and-lifecycle.md SS8         | convergence-monitoring.md SS4.1 | outgoing  | Structured output protocol references JSON-lines streaming schema                  |
| cli-and-lifecycle.md SS8         | validation-architecture.md SS5  | outgoing  | Structured output protocol references validation report as error schema foundation |
| cli-and-lifecycle.md SS2.1       | output-infrastructure.md SS1-2  | outgoing  | Subcommand patterns reference report/manifest access                               |
| convergence-monitoring.md SS4.1  | cli-and-lifecycle.md SS8        | outgoing  | JSON-lines schema references structured output protocol                            |
| validation-architecture.md SS5.1 | cli-and-lifecycle.md SS8        | outgoing  | Stdout emission references structured output protocol                              |
| output-infrastructure.md SS1.3   | cli-and-lifecycle.md SS2.1      | outgoing  | CLI report access references subcommand patterns                                   |
| cli.md (crate)                   | cli-and-lifecycle.md            | outgoing  | Already exists; updated content                                                    |

### 7.3 Dependency Ordering Impact

The cross-reference index SS5 (Dependency Ordering) places cli-and-lifecycle.md at position 46 (late in the reading order). This remains correct: the CLI spec depends on nearly all other specs. The new cross-references from cli-and-lifecycle.md to convergence-monitoring.md and validation-architecture.md are consistent with this ordering (both appear earlier in the dependency chain).

---

## 8. Acceptance Criteria Verification

| Criterion                                                             | Status | Evidence                                                                                                                         |
| --------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Every spec section needing modification is listed with severity       | PASS   | Impact Inventory Table (Section 1) lists 23 affected sections across 7 specs + 1 crate doc                                       |
| Each of 4 design decisions has recommendation or OPEN flag            | PASS   | Section 2: all 4 decisions have recommendations with rationale                                                                   |
| Backward compatibility analysis confirms `mpiexec cobre CASE_DIR`     | PASS   | Section 4 explicitly confirms preservation; Section 4.4 shows SLURM script unchanged                                             |
| JSON-lines streaming recommendation for convergence-monitoring.md SS4 | PASS   | Section 5 provides detailed relationship analysis between text log, JSON-lines, and Parquet                                      |
| Assessment of whether validation report generalizes to error schema   | PASS   | Section 5.4 recommends generalization with specific field mapping                                                                |
| Assessment of JSON equivalents for 14 Parquet schemas                 | PASS   | Section 6 recommends NO JSON equivalents for simulation/training Parquet schemas; only convergence data needs JSON via streaming |
| No `src/` files modified                                              | PASS   | This report is in `plans/` directory; all spec files were read-only                                                              |
