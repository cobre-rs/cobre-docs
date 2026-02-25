# ticket-019 Assess Structured CLI and Output Impact on Existing Specs

## Context

### Background

Cobre currently follows a single-entrypoint HPC batch design (`mpiexec cobre CASE_DIR`) with all runtime behavior controlled through configuration files. The CLI accepts only a case path and three flags (`--validate-only`, `--version`, `--help`). Output is exclusively Parquet/JSON files written to disk, and progress reporting is human-readable text to stdout. This design is optimal for HPC batch jobs but makes the solver opaque to AI agents and programmatic workflows.

To make Cobre composable for agents, the CLI needs to expand to support: subcommands (`validate`, `report`, `compare`, `serve`), a JSON structured output mode for all operations, JSON-lines progress streaming during training, machine-parseable structured error reporting, and composable stdin/stdout pipelines. This ticket assesses which existing specs need modification to accommodate these capabilities and catalogs the specific changes required.

### Relation to Epic

This is the first of two parallel assessment tickets in Epic 06 (Agent & External Interface Impact Assessment). Together with ticket-020, it produces the impact inventory that ticket-021 synthesizes into a coherent architecture. This ticket focuses specifically on the **Structured CLI & Output** layer -- the highest priority interface per the user-approved priority order (Structured CLI > MCP > Python > TUI).

### Current State

The following specs currently define the CLI, output, and related infrastructure:

- **`src/specs/architecture/cli-and-lifecycle.md`** -- Defines the single-entrypoint design (section 1), invocation pattern (section 2), CLI arguments table (section 3, 4 arguments only), exit codes (section 4, 7 codes), execution phases (section 5), configuration resolution (section 6), and signal handling (section 7). The design philosophy in section 1 explicitly states "single-entrypoint design optimized for HPC batch execution."

- **`src/specs/data-model/output-infrastructure.md`** -- Defines manifest files (section 1), metadata file (section 2), MPI Hive partitioning (section 3), output size estimates (section 4), and validation/integrity (section 5). All output is file-based (Parquet, JSON manifests). No stdout streaming, no JSON-lines, no structured error output.

- **`src/specs/data-model/output-schemas.md`** -- Defines Parquet schemas for 11 simulation entity types and 3 training output types. All schemas are Parquet-column definitions. No JSON schema equivalents exist.

- **`src/specs/architecture/validation-architecture.md`** -- Defines 5-layer validation pipeline (section 2), error collection strategy (section 3), error type catalog (section 4, 13 error kinds), and validation report format (section 5). The validation report (section 5) is already structured JSON, but the format is specific to validation -- it is not a general structured error schema.

- **`src/specs/architecture/convergence-monitoring.md`** -- Defines convergence criteria (section 1), convergence monitor (section 2), bound computation (section 3), and training log format (section 4). The training log (section 4) is human-readable text with fixed-width formatting.

- **`src/specs/configuration/configuration-reference.md`** -- Defines complete `config.json` schema. No output format configuration exists (no `--output-format`, no `output.format` in config).

- **`src/crates/cli.md`** -- Documents cobre-cli as a single-entrypoint binary crate. No subcommand architecture.

## Specification

### Requirements

Produce an **impact assessment report** (markdown document in the epic directory) that:

1. **Catalogs every existing spec** that needs modification to support structured CLI output, with the specific section(s) affected and the nature of the change.
2. **Classifies each change** by severity: REQUIRED (blocks agent usability), RECOMMENDED (improves agent usability significantly), OPTIONAL (nice-to-have).
3. **Resolves key design decisions** by recommending answers with rationale:
   - Default output mode: structured-first (`--human` for pretty-printed) vs opt-in (`--output-format json`)
   - Progress streaming transport: JSON-lines to stdout vs separate file descriptor
   - Subcommand coexistence with `mpiexec cobre CASE_DIR` pattern
   - Error schema standard: RFC 7807 Problem Details adaptation vs custom
4. **Identifies new spec sections** needed within existing specs (not new spec files -- that is Epic 07's scope).
5. **Preserves backward compatibility**: the existing `mpiexec cobre CASE_DIR` invocation pattern must continue to work unchanged.

### Inputs/Props

- The 7 spec files listed in Current State above (read-only review)
- The cross-reference index at `src/specs/cross-reference-index.md` (to identify downstream impacts)
- The epic overview design constraints table (backward compatible, schema-first, no MPI in agent paths)

### Outputs/Behavior

A single assessment report file: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md`

The report must contain:

1. **Impact Inventory Table** -- One row per affected spec section, with columns: Spec File, Section, Current State, Required Change, Severity (REQUIRED/RECOMMENDED/OPTIONAL), Notes
2. **Design Decision Recommendations** -- One subsection per decision, with options considered, recommended choice, and rationale
3. **New Section Inventory** -- List of new sections that need to be added to existing specs in Epic 07
4. **Backward Compatibility Analysis** -- Explicit confirmation that the recommended changes preserve the existing HPC batch workflow
5. **Cross-Reference Impact** -- Which entries in the cross-reference index need updating

### Error Handling

- If a spec file listed in scope does not exist, note its absence in the report rather than failing.
- If a design decision cannot be resolved from available information, flag it as OPEN with the specific question that needs answering.

## Acceptance Criteria

- [ ] Given the 7 specs listed in Current State, when the assessment is complete, then every spec section that would need modification for structured CLI output is listed in the Impact Inventory Table with severity classification.
- [ ] Given the 4 design decisions listed in Requirements, when the assessment is complete, then each has a recommended answer with rationale, or is explicitly flagged as OPEN with the blocking question.
- [ ] Given the existing `mpiexec cobre CASE_DIR` invocation pattern, when the backward compatibility analysis is complete, then the report explicitly confirms this pattern remains functional under all recommended changes.
- [ ] Given the convergence-monitoring.md training log format (section 4), when the assessment reviews progress streaming, then a specific recommendation exists for how JSON-lines streaming relates to or replaces the current text log.
- [ ] Given the validation-architecture.md validation report (section 5), when the assessment reviews structured errors, then the report addresses whether the existing JSON validation report can be generalized into the structured error schema or needs a separate design.
- [ ] Given the output-schemas.md Parquet schemas, when the assessment reviews structured output, then the report specifies whether JSON schema equivalents are needed for all 14 Parquet schemas or a subset.
- [ ] Given the report is written, when `mdbook build` is run, then it exits 0 (the report is in plans/ directory, not in src/, so this is a no-op gate confirming no src/ files were modified).

## Implementation Guide

### Suggested Approach

1. Read each of the 7 spec files end-to-end, annotating every section that assumes human-only output, single-entrypoint CLI, or lacks structured output support.
2. For each annotation, classify the change severity and describe the required modification.
3. Resolve the 4 design decisions by analyzing the constraints in the epic overview (agent-first, backward compatible, schema-first, no MPI in agent paths).
4. Cross-reference the impact inventory against the cross-reference index to identify downstream spec-to-spec impacts.
5. Write the findings report.

### Key Files to Read

| File                                                 | Focus Areas                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/specs/architecture/cli-and-lifecycle.md`        | Section 1 (design philosophy), section 2 (invocation), section 3 (CLI table), section 5 (phases)       |
| `src/specs/data-model/output-infrastructure.md`      | Section 1-2 (manifests/metadata -- already JSON), section 4 (size estimates -- need JSON equivalents?) |
| `src/specs/data-model/output-schemas.md`             | All 14 schemas -- which need JSON equivalents for agent consumption?                                   |
| `src/specs/architecture/validation-architecture.md`  | Section 5 (validation report -- existing structured JSON pattern)                                      |
| `src/specs/architecture/convergence-monitoring.md`   | Section 4 (training log -- human-readable text that needs JSON-lines alternative)                      |
| `src/specs/configuration/configuration-reference.md` | Look for where output format configuration should be added                                             |
| `src/crates/cli.md`                                  | Current binary crate description -- needs subcommand architecture                                      |

### Key File to Create

| File                                                                          | Content                  |
| ----------------------------------------------------------------------------- | ------------------------ |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` | Impact assessment report |

### Patterns to Follow

- **Decision table with rationale column** pattern from Epic 05 (`changes-018.md`): use tabular format with File, Section, Current State, Required Change, Severity, Notes columns for the impact inventory.
- **Three-way classification** pattern from Epic 05: REQUIRED/RECOMMENDED/OPTIONAL mirrors KEEP/UPDATE/REMOVE in its clarity.
- **Source column pattern** from Epics 03-04: cite specific section numbers (e.g., "cli-and-lifecycle.md section 3") so Epic 07 authors can navigate directly.

### Pitfalls to Avoid

- Do not modify any spec files -- this is a read-only assessment. All spec modifications happen in Epic 07.
- Do not design the JSON schemas themselves -- that is Epic 07 ticket-022's scope. This ticket identifies _which_ schemas are needed and _where_ in existing specs they should be referenced.
- Do not conflate "structured output" (JSON responses from CLI commands) with "output schemas" (Parquet column definitions for simulation/training results). Both are relevant but serve different purposes.
- Do not assume MPI is available for agent-facing commands. The epic overview constraint "No MPI in agent paths" means subcommands like `validate`, `report`, and `compare` must work in single-process mode. Only the batch `run` command uses MPI.

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation assessment ticket.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

### Validation

- Verify the findings report covers all 7 spec files from the scope.
- Verify every design decision from the Requirements section has a recommendation or OPEN flag.
- Run `mdbook build` from `src/` to confirm exit 0 (no src/ files modified).

## Dependencies

- **Blocked By**: None (can start independently)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: High
