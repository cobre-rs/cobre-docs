# Report 007 -- cobre-cli API Surface Completeness Audit

**Crate**: cobre-cli
**Phase**: 8 (Final Binary)
**Auditor**: sddp-specialist
**Date**: 2026-02-26

---

## 1. Completeness Matrix

### 1.1 Public Types

cobre-cli is a binary crate. It defines no library-public types, but it must contain internal types for CLI argument parsing, exit code mapping, and execution phase orchestration. These are audited as the "public API" of the binary.

| Item Name                 | Category | Spec File              | Section           | Status   | Notes                                                                                                                                                                                                                                                                                                      |
| ------------------------- | -------- | ---------------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI argument struct       | Struct   | `cli-and-lifecycle.md` | SS3, SS3.1, SS3.2 | PARTIAL  | Arguments and flags documented in tables (SS3: `CASE_DIR`, `--validate-only`, `--version`, `--help`; SS3.1: `--output-format`, `--quiet`, `--no-progress`; SS3.2: per-subcommand args). No Rust struct definition (e.g., `clap` derive struct). See F-001.                                                 |
| Exit code enum            | Enum     | `cli-and-lifecycle.md` | SS4               | COMPLETE | All 8 codes (0-5 + 130, 137) documented with meanings in a clear table. Sufficient for implementation.                                                                                                                                                                                                     |
| Execution phase enum      | Enum     | `cli-and-lifecycle.md` | SS5.2             | PARTIAL  | Seven phases listed (Startup, Validation, Initialization, Scenario Gen, Training, Simulation, Finalize) with MPI rank participation. No Rust enum definition. Phase entry/exit conditions are implicit via the alignment table (SS5.2a) but not formalized as precondition/postcondition pairs. See F-002. |
| Subcommand enum           | Enum     | `cli-and-lifecycle.md` | SS2.1, SS5.4      | PARTIAL  | Six subcommands defined (`run`, `validate`, `report`, `compare`, `serve`, `version`) with MPI requirements table and phase mapping. No Rust enum definition. See F-003.                                                                                                                                    |
| Config resolution result  | Struct   | `cli-and-lifecycle.md` | SS6.2             | PARTIAL  | Two-level hierarchy documented (config.json then compiled defaults). Resource allocations (SS6.1) documented separately. No Rust type for the resolved configuration. See F-004.                                                                                                                           |
| Signal handler state      | Internal | `cli-and-lifecycle.md` | SS7               | PARTIAL  | Graceful shutdown protocol described (global shutdown flag, checkpoint from last completed iteration, barrier before finalization). No Rust type for the signal state (e.g., `AtomicBool` flag). Behavioral spec is sufficient for implementation.                                                         |
| Response envelope         | Struct   | `structured-output.md` | SS1               | COMPLETE | Full JSON schema with 9 top-level fields, 3 invariants, and complete example. Sufficient for implementation.                                                                                                                                                                                               |
| Error record              | Struct   | `structured-output.md` | SS2.1             | COMPLETE | Four required fields (`kind`, `message`, `context`, `suggestion`). 14 validation kinds + 6 runtime kinds fully specified with context field tables.                                                                                                                                                        |
| JSON-lines envelope types | Enum     | `structured-output.md` | SS3.2             | COMPLETE | Four types (`started`, `progress`, `terminated`, `result`) with full payload schemas, field tables, and lifecycle ordering.                                                                                                                                                                                |

### 1.2 Public Functions

As a binary crate, cobre-cli has no library-public functions. The audit covers the execution lifecycle orchestration: what functions are called from other crates, in what order, and with what parameters.

| Item Name                   | Category   | Spec File              | Section  | Status   | Notes                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------- | ---------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main()` entry point        | Entry      | `cli-and-lifecycle.md` | SS2, SS5 | PARTIAL  | Invocation patterns documented (SS2). Phase sequence documented (SS5.2). Phase-Training Loop alignment table (SS5.2a) provides authoritative spec cross-references for each operation. No Rust `main()` signature or orchestration pseudocode. See F-005.                                                  |
| Config resolution function  | Function   | `cli-and-lifecycle.md` | SS6      | PARTIAL  | Two-category hierarchy documented (resource allocations from environment, algorithm parameters from config.json then compiled defaults). Scheduler detection documented (SS6.3). No function signature. The resolved configuration type is unspecified. See F-004.                                         |
| `--validate-only` mode      | Function   | `cli-and-lifecycle.md` | SS5.3    | COMPLETE | Behavior fully specified: "exits immediately after the Validation phase. No memory allocation, no solver setup, no outputs." Triggering documented: CLI flag or disabling both `training.enabled` and `simulation.enabled`. Exit code 0 on success, 2 on config error, 3 on data error (from SS4 mapping). |
| MPI initialization          | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table row 1: "MPI backend initialization (`create_communicator`)" with authoritative spec `[Hybrid Parallelism SS6, Step 1]`. Ordering constraint: "Must be the first operation; precedes all file I/O and thread creation."                                                               |
| Rank-0 file loading         | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "Rank-0 file loading and validation (`load_case`)" with authoritative spec `[Input Loading Pipeline SS8.1]`. Constraint: "Rank 0 only; produces the `System` struct."                                                                                                               |
| rkyv broadcast              | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "rkyv broadcast of `System` to worker ranks" with authoritative spec `[Input Loading Pipeline SS6]`.                                                                                                                                                                                |
| Solver workspace allocation | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "Solver workspace allocation (thread-local, NUMA-aware)" with authoritative spec `[Solver Workspaces SS1.3]`.                                                                                                                                                                       |
| Training loop invocation    | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "SDDP iteration loop (forward/backward/convergence)" with authoritative spec `[Training Loop SS2.1]`.                                                                                                                                                                               |
| Simulation invocation       | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "Policy evaluation on large scenario sets" with authoritative spec `[Simulation Architecture SS1]`.                                                                                                                                                                                 |
| Output writing              | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "Output writing (Parquet, policy FlatBuffers, manifest)" with authoritative spec `[Output Infrastructure SS1]`.                                                                                                                                                                     |
| MPI finalize                | Delegation | `cli-and-lifecycle.md` | SS5.2a   | COMPLETE | Phase alignment table: "MPI finalize and process exit" with authoritative spec `[Hybrid Parallelism SS6]`. Constraint: "Must be the last MPI operation."                                                                                                                                                   |

### 1.3 Error Types

| Item Name               | Category | Spec File                    | Section | Status   | Notes                                                                                                                                                                                                                                                                                             |
| ----------------------- | -------- | ---------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exit code mapping       | Mapping  | `cli-and-lifecycle.md`       | SS4     | PARTIAL  | Six exit codes (0-5) cover success, CLI errors, config validation errors, input validation errors, runtime errors, and checkpoint recovery failures. Signal codes (130, 137) cover SIGINT and SIGKILL. However, the mapping from specific error types to exit codes is not exhaustive. See F-006. |
| Structured error format | Schema   | `structured-output.md`       | SS2     | COMPLETE | Error schema with `kind`, `message`, `context`, `suggestion` fields. 20 error kinds (14 validation + 6 runtime) with context field specifications.                                                                                                                                                |
| Validation error kinds  | Catalog  | `validation-architecture.md` | SS4     | COMPLETE | 14 kinds with severity, description, and examples. Mapping to structured output error kinds documented in `structured-output.md` SS2.3.1.                                                                                                                                                         |
| Runtime error kinds     | Catalog  | `structured-output.md`       | SS2.3.2 | COMPLETE | 6 kinds (`SolverFailure`, `MpiError`, `CheckpointFailed`, `OutputCorrupted`, `OutputNotFound`, `IncompatibleRuns`) with context fields.                                                                                                                                                           |
| Validation report       | Output   | `validation-architecture.md` | SS5     | COMPLETE | JSON schema with `valid`, `timestamp`, `case_directory`, `errors`, `warnings`, `summary` fields. Written to `{case_directory}/validation_report.json`. Structured output integration documented in SS5.1.                                                                                         |

### 1.4 Trait Implementations

cobre-cli is a binary crate and defines no traits. This category is not applicable.

| Item Name | Category | Spec File | Section | Status | Notes                            |
| --------- | -------- | --------- | ------- | ------ | -------------------------------- |
| (none)    | --       | --        | --      | N/A    | Binary crate; no traits defined. |

### 1.5 Crate Boundary Interactions

| Interaction                                 | Direction  | Spec File              | Section | Status   | Notes                                                                                                                                                                                                       |
| ------------------------------------------- | ---------- | ---------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cobre-cli -> cobre-io: `load_case`          | Call       | `cli-and-lifecycle.md` | SS5.2a  | COMPLETE | Documented in phase alignment table as Validation phase operation. Source spec: `[Input Loading Pipeline SS8.1]`. Produces `System` struct.                                                                 |
| cobre-cli -> cobre-io: output writing       | Call       | `cli-and-lifecycle.md` | SS5.2a  | PARTIAL  | Documented as Finalize phase operation. Source spec: `[Output Infrastructure SS1]`. No function signature for the write API. GAP-020 in the spec-gap-inventory identifies this.                             |
| cobre-cli -> cobre-sddp: training loop      | Call       | `cli-and-lifecycle.md` | SS5.2a  | COMPLETE | Documented as Training phase operation. Source spec: `[Training Loop SS2.1]`. The `train` function signature exists in the training loop spec.                                                              |
| cobre-cli -> cobre-sddp: simulation         | Call       | `cli-and-lifecycle.md` | SS5.2a  | COMPLETE | Documented as Simulation phase operation. Source spec: `[Simulation Architecture SS1]`.                                                                                                                     |
| cobre-cli -> cobre-core: `System` read      | Data       | `cli-and-lifecycle.md` | SS5.2a  | COMPLETE | The `System` struct is produced by `load_case` and consumed throughout subsequent phases.                                                                                                                   |
| cobre-cli -> cobre-core: `TrainingEvent`    | Subscribe  | `training-loop.md`     | SS2.1b  | PARTIAL  | Event channel documented with 11 variants. The subscription mechanism from the CLI side is not specified (how does `main()` register as a consumer?). GAP-032 notes the `broadcast` channel type ambiguity. |
| cobre-cli -> cobre-comm: MPI lifecycle      | Delegation | `cli-and-lifecycle.md` | SS5.2a  | COMPLETE | MPI init and finalize documented with ordering constraints. Delegated to `[Hybrid Parallelism SS6]`.                                                                                                        |
| cobre-cli -> cobre-stochastic: scenario gen | Delegation | `cli-and-lifecycle.md` | SS5.2a  | COMPLETE | Scenario Gen phase documented with three operations (PAR preprocessing, opening tree, Cholesky). Source specs referenced.                                                                                   |

---

## 2. Findings

### F-001: CLI Argument Struct Not Formally Defined

**Severity**: Low
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS3:

> "| `CASE_DIR` | Yes | Path to case directory containing `config.json` |"
> "| `--validate-only` | No | Run Startup and Validation phases only, then exit (see SS5.3) |"
> "| `--version` | No | Print version and exit |"
> "| `--help` | No | Print usage and exit |"

cli-and-lifecycle.md SS3.1:

> "| `--output-format` | `human`, `json`, `json-lines` | `human` | Output presentation format. Does not affect computation. |"
> "| `--quiet` | (flag) | off | Suppress non-essential output |"
> "| `--no-progress` | (flag) | off | Suppress progress streaming |"

cli-and-lifecycle.md SS3.2:

> "| `run` | `CASE_DIR` | `--tui`, `--validate-only` | Execute training and/or simulation |"
> "| `validate` | `CASE_DIR` | (none) | Validate input files only |"
> "| `report` | `OUTPUT_DIR` | `--section <name>` | Query output data |"
> "| `compare` | `OUTPUT_A OUTPUT_B` | `--metric <name>` | Compare two runs |"
> "| `serve` | (none) | `--transport <stdio\|http>`, `--port <N>` | Start MCP server |"
> "| `version` | (none) | (none) | Print version information |"

**Impact**: All arguments, flags, and subcommands are documented in specification tables. The information is sufficient for a developer to construct a `clap` derive struct. This is a minor convenience gap, not a blocker.

**Recommendation**: No action needed. The tabular specification is sufficient for implementation.

---

### F-002: Execution Phase Entry/Exit Conditions Not Formalized

**Severity**: Medium
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS5.2a documents the phase alignment table with an "Ordering Constraint" column, but entry and exit conditions are implicit rather than formalized as precondition/postcondition pairs. For example:

> "| **Startup** | MPI backend initialization (`create_communicator`) | [Hybrid Parallelism SS6, Step 1] | Must be the first operation; precedes all file I/O and thread creation |"

The "Key invariants enforced by phase ordering" (SS5.2a) provide four invariants:

> "1. **MPI-first**: MPI initialization is the first operation in Startup, before any file I/O or thread creation."
> "2. **Rank-0 validation before broadcast**: The `load_case` function [...] executes on rank 0 only during the Validation phase."
> "3. **Workspaces before training**: Solver workspace allocation [...] and stage template construction [...] complete during Initialization, before the Training phase begins."
> "4. **Scenarios before training**: PAR preprocessing and opening tree generation complete during Scenario Gen."

These invariants serve as implicit entry/exit conditions, but there is no formal table stating: "Precondition: MPI initialized. Postcondition: `System` struct exists on rank 0."

**Impact**: An implementer can infer the sequencing from the alignment table and the 4 invariants, but the absence of explicit per-phase precondition/postcondition tables increases the risk of subtle ordering bugs (e.g., allocating solver workspaces before OpenMP configuration is set).

**Recommendation**: Add a precondition/postcondition table to cli-and-lifecycle.md SS5.2 with one row per phase. Each row should state the data artifacts that must exist on entry and the artifacts produced on exit. The alignment table already contains most of this information -- it needs to be consolidated into a single summary.

---

### F-003: Subcommand Routing and `train` Subcommand Inconsistency

**Severity**: High
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS2.1 defines the subcommand set:

> "cobre validate /path/to/case_directory"
> "cobre run /path/to/case_directory"
> "cobre report /path/to/output_directory"
> "cobre compare /path/to/output_a /path/to/output_b"
> "cobre serve"
> "cobre version"

However, slurm-deployment.md SS1, SS2, SS3, SS4, and SS6.2 all use a `train` subcommand with a `--config` flag that does not exist in cli-and-lifecycle.md:

> "srun cobre train --config /path/to/case/config.json" (slurm-deployment.md SS1)
> "cobre train --config /scratch/user/case/config.json" (slurm-deployment.md SS2)
> "cobre train --config /scratch/user/case/config.json" (slurm-deployment.md SS6.2)

Furthermore, slurm-deployment.md SS4 uses a config field name `training.forward_scenarios`:

> "jq \".training.forward_scenarios = ${N_SCENARIOS}\"" (slurm-deployment.md SS4)

This conflicts with configuration-reference.md SS3.1 which uses `training.forward_passes`:

> "| training.forward_passes | int | --- | Number of scenario trajectories $M$ per iteration |"

**Impact**: There are three distinct inconsistencies: (1) `cobre train` vs `cobre run` subcommand, (2) `--config` flag vs positional `CASE_DIR` argument, and (3) `training.forward_scenarios` vs `training.forward_passes` config field name. An implementer following slurm-deployment.md would build a different CLI than the one specified in cli-and-lifecycle.md. The SLURM scripts are the primary user-facing deployment artifacts, so this inconsistency will surface immediately.

**Recommendation**: Update slurm-deployment.md to match cli-and-lifecycle.md: replace `cobre train --config /path/to/case/config.json` with `cobre run /path/to/case_directory` (or `cobre /path/to/case_directory` relying on hybrid detection). Replace `training.forward_scenarios` with `training.forward_passes` in the job array jq command.

---

### F-004: Config Resolution Produces No Typed Artifact

**Severity**: Medium
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS6.2 describes the algorithm parameter resolution:

> "1. **`config.json`** --- Explicit user configuration. See [Configuration Reference]"
> "2. **Compiled defaults** --- Internal constants for any parameter not specified in `config.json`"

cli-and-lifecycle.md SS6.1 describes resource allocations:

> "Resource allocations are determined by the MPI launcher and job scheduler. The program reads them from the environment and must not override them."

The resolved configuration is consumed by every downstream phase but no Rust type captures the fully resolved configuration. The Configuration Reference (configuration-reference.md) documents all fields in a table format but does not define a Rust struct.

**Impact**: Every phase depends on the resolved configuration, but there is no specification for the Rust type that carries it. The implementer must reverse-engineer a struct from the field tables across configuration-reference.md, input-directory-structure.md SS2, and cli-and-lifecycle.md SS6. This is the interface between parsing (Phase 8) and every other phase.

**Recommendation**: Define a `ResolvedConfig` struct (or similar) in configuration-reference.md that captures all fields from the two-level merge. This struct should be the primary input to the Initialization phase and should be recorded in training metadata for reproducibility (as noted in SS6.2: "The resolved configuration is recorded in the training metadata file for reproducibility").

---

### F-005: No Orchestration Pseudocode for `main()`

**Severity**: Low
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS5.2a provides the Phase-Training Loop alignment table with 16 rows covering all lifecycle operations. The conditional execution matrix (SS5.3) documents which phases execute in each mode. However, there is no integrated pseudocode or flowchart showing the complete `main()` orchestration logic with branching, error handling, and exit code assignment.

cli-and-lifecycle.md SS5.3:

> "**Validation Only** --- Validates all input files and configuration, then exits immediately after the Validation phase. No memory allocation, no solver setup, no outputs. Triggered by `--validate-only` on the command line (overrides config settings) or by disabling both `training.enabled` and `simulation.enabled` in `config.json`."

The combination of the alignment table (SS5.2a), conditional execution matrix (SS5.3), subcommand phase mapping (SS5.4), and exit codes (SS4) contains all the information needed, but it is distributed across multiple subsections.

**Impact**: An implementer must mentally integrate 4 subsections to construct the `main()` function. The information is present but not consolidated. Low severity because the specifications are internally consistent.

**Recommendation**: Add a pseudocode listing to cli-and-lifecycle.md SS5 that integrates the phase sequence, conditional execution, error handling, and exit code assignment into a single linear flow.

---

### F-006: Exit Code Mapping Not Exhaustive per Subcommand

**Severity**: Medium
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS4 defines exit codes:

> "| 0 | Success |"
> "| 1 | Invalid command-line arguments |"
> "| 2 | Configuration validation error |"
> "| 3 | Input data validation error |"
> "| 4 | Runtime error (solver failure, MPI error) |"
> "| 5 | Checkpoint recovery failed |"
> "| 130 | Interrupted (SIGINT) |"
> "| 137 | Killed (SIGKILL, typically OOM) |"

The exit code table is presented as a global scheme, but the applicability per subcommand is not specified. For example:

- `report` and `compare` subcommands can produce `OutputCorrupted`, `OutputNotFound`, and `IncompatibleRuns` errors (structured-output.md SS2.3.2). Which exit code do these map to?
- The `serve` subcommand (MCP server) has no specified exit code behavior at all.
- Exit code 5 (checkpoint recovery) can only occur during `run`; this is not stated.

**Impact**: An implementer of the `report`, `compare`, or `serve` subcommands would need to choose an exit code without specification guidance. The `report`/`compare` errors are closest to exit code 4 (runtime error) but this is ambiguous.

**Recommendation**: Add a per-subcommand exit code applicability column to the SS4 table, or add a second table mapping each runtime error kind to its exit code. Also specify exit code behavior for the `serve` subcommand (e.g., exit code 4 for server startup failure).

---

### F-007: `training.enabled` Not Defined in Configuration Reference

**Severity**: High
**Affected Crate**: cobre-cli, cobre-sddp
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS5.3 references `training.enabled`:

> "Training Only and Simulation Only are controlled by the `training.enabled` and `simulation.enabled` fields in `config.json`. See [Configuration Reference]."

structured-output.md SS4.1 references it:

> "If training is disabled (`training.enabled = false`), the `training` field is `null`."

However, `training.enabled` does NOT appear in configuration-reference.md. The configuration reference defines `training.forward_passes`, `training.cut_selection`, `training.stopping_rules`, and `training.stopping_mode`, but has no `training.enabled` field.

Meanwhile, `simulation.enabled` IS defined in input-directory-structure.md SS2.5:

> "| `enabled` | bool | false | Enable post-training simulation |"

But `training.enabled` has no equivalent definition anywhere.

**Impact**: The conditional execution logic (Training Only, Simulation Only, Validation Only modes) depends on `training.enabled`, but this field has no schema definition, no default value, and no validation rules. An implementer cannot determine whether training is enabled by default or requires explicit opt-in.

**Recommendation**: Add `training.enabled` to configuration-reference.md SS3 with type `bool` and default `true` (training enabled by default, consistent with the "Full Run" default mode in SS5.3). Add it to input-directory-structure.md SS2 in the training configuration section.

---

### F-008: GAP-027 -- `training.forward_passes` Has No Default Value

**Severity**: High
**Affected Crate**: cobre-cli, cobre-sddp
**Affected Phase**: Phase 8

**Evidence**:

configuration-reference.md SS3.1:

> "| training.forward_passes | int | --- | Number of scenario trajectories $M$ per iteration |"

The default column contains "---" (no default). GAP-027 in spec-gap-inventory.md identifies this:

> "The `training.forward_passes` parameter has no documented default value (the table shows '---'). This is a mandatory parameter for the training loop. Should the loader reject configs without it, or should there be a sensible default?"

The resolution path in the gap inventory:

> "Specify that `training.forward_passes` is required (no default) and the loader emits an error if it is missing. Alternatively, define a default based on MPI rank count (e.g., `max(1, n_ranks)`)."

This gap remains open.

**Impact**: The training loop cannot execute without knowing $M$ (the number of forward scenarios per iteration). The absence of a default or a "required" annotation means the config validation pipeline cannot properly enforce this field. From the SDDP algorithm's perspective, the number of forward passes $M$ directly determines the statistical quality of the upper bound estimate:

$$\sigma^k = \sqrt{\frac{1}{M-1}\sum_{m=1}^{M}\left(\sum_{t=1}^{T} c_t^\top \hat{x}_t^{k,m} - \bar{z}^k\right)^2}$$

An unspecified $M$ would make the convergence criterion undefined.

**Recommendation**: Mark `training.forward_passes` as **required** (no default). This forces the user to make an explicit choice about the number of forward scenarios, which is a problem-specific parameter that cannot have a universally sensible default. Emit a `SchemaViolation` error (exit code 2) when the field is missing.

---

### F-009: GAP-035 -- Example `config.json` Uses Non-Minimal-Viable Defaults

**Severity**: Low
**Affected Crate**: all 8 crates
**Affected Phase**: Phase 8

**Evidence**:

configuration-reference.md SS7 provides the complete example `config.json`:

> "\"cut_selection\": { \"enabled\": true, \"method\": \"domination\", \"threshold\": 0, \"check_frequency\": 10 }"

GAP-035 in spec-gap-inventory.md:

> "The complete example `config.json` includes `\"method\": \"domination\"` for cut selection, but the minimal viable solver uses Level-1 (per implementation ordering section 6). The example should reflect the minimal viable defaults to avoid confusion."

Resolution path:

> "Update the example to use `\"method\": \"level1\"` and `\"risk_measure\": \"expectation\"` to match the minimal viable configuration."

This gap remains open.

**Impact**: Low severity. The example serves as documentation, not a functional default. An implementer would reference the implementation ordering for the minimal viable configuration, not the example in the configuration reference.

**Recommendation**: Update the example to use `"method": "level1"` to match the minimal viable solver. This is a documentation fix, not a specification gap.

---

### F-010: Config Field Name Inconsistency Across Specs (`forward_passes` vs `num_forward_passes` vs `forward_scenarios`)

**Severity**: High
**Affected Crate**: cobre-cli, cobre-io
**Affected Phase**: Phase 8

**Evidence**:

Three different names are used for the same parameter across spec files:

1. configuration-reference.md SS3.1 uses `training.forward_passes`:

   > "| training.forward_passes | int | --- | Number of scenario trajectories $M$ per iteration |"

2. input-directory-structure.md SS2 example JSON uses `training.num_forward_passes`:

   > "\"num_forward_passes\": 192,"

3. slurm-deployment.md SS4 uses `training.forward_scenarios`:

   > "jq \".training.forward_scenarios = ${N_SCENARIOS}\""

4. output-infrastructure.md SS2 uses both `forward_passes_per_iteration` and `num_forward_passes`:
   > "\"forward_passes_per_iteration\": 8"
   > "\"num_forward_passes\": 192"

**Impact**: An implementer must decide which name is canonical. The configuration parser, the output metadata writer, and the SLURM job scripts all use different names for the same parameter. This will cause silent configuration failures where a field is ignored because it uses the wrong key name.

**Recommendation**: Standardize on `training.forward_passes` (the name used in the configuration reference, which is the authoritative schema spec). Update input-directory-structure.md, slurm-deployment.md, and output-infrastructure.md to use this canonical name.

---

### F-011: Simulation Configuration Section Missing from Configuration Reference

**Severity**: Medium
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS5.3 references `simulation.enabled`:

> "Triggered by `--validate-only` on the command line (overrides config settings) or by disabling both `training.enabled` and `simulation.enabled` in `config.json`."

input-directory-structure.md SS2.5 defines simulation fields:

> "| `enabled` | bool | false | Enable post-training simulation |"
> "| `num_scenarios` | i32 | 2000 | Number of simulation scenarios |"
> "| `policy_type` | string | `\"outer\"` | `\"outer\"` (cuts) or `\"inner\"` (vertices) |"
> "| `sampling_scheme.type` | string | `\"in_sample\"` | `\"in_sample\"`, `\"out_of_sample\"`, or `\"external\"` |"

However, configuration-reference.md (the authoritative field-by-field reference) contains no `## Simulation Options` section. The document's scope (SS1) lists "simulation" as a `config.json` section but never defines it.

configuration-reference.md SS1:

> "| `config.json` | Solver behavior: modeling options, training parameters, simulation, HPC, I/O |"

**Impact**: The configuration reference is designated as the "comprehensive mapping between Cobre configuration options and their effects." The absence of simulation options means an implementer must discover these fields from a different spec (input-directory-structure.md) that has a different purpose. This is a documentation completeness gap, not a functional gap -- the fields are defined elsewhere.

**Recommendation**: Add a `## Simulation Options (config.json -> simulation)` section to configuration-reference.md that mirrors the fields from input-directory-structure.md SS2.5 and adds LP effect and reference columns consistent with the rest of the document.

---

### F-012: SLURM Deployment Invocation Pattern Mismatches CLI Spec

**Severity**: High (same root cause as F-003, different evidence)
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

cli-and-lifecycle.md SS2 specifies the standard invocation:

> "mpiexec -n 8 cobre /path/to/case_directory"
> "srun cobre /path/to/case_directory"

cli-and-lifecycle.md SS2.1 specifies subcommand invocation:

> "cobre run /path/to/case_directory"

slurm-deployment.md SS1, SS2, SS3, SS4, SS6.2 all use a different pattern:

> "srun cobre train --config /path/to/case/config.json" (SS1)
> "cobre train --config /scratch/user/case/config.json" (SS2)

The discrepancies are:

1. `train` subcommand does not exist in cli-and-lifecycle.md SS2.1 (valid subcommands: `run`, `validate`, `report`, `compare`, `serve`, `version`)
2. `--config` flag does not exist in cli-and-lifecycle.md SS3 or SS3.2 (valid flags for `run`: `--tui`, `--validate-only`)
3. The argument to `--config` is a path to `config.json`, whereas cli-and-lifecycle.md expects a case directory path

**Impact**: All five SLURM job scripts in the spec corpus use an invocation pattern that contradicts the canonical CLI spec. These are the primary artifacts that HPC users will copy into their job submissions. The contradiction is unambiguous and cannot be resolved without a spec update.

**Recommendation**: Update all five invocation patterns in slurm-deployment.md to match cli-and-lifecycle.md. Replace `cobre train --config /path/to/case/config.json` with `cobre /path/to/case_directory` (or `cobre run /path/to/case_directory`). The hybrid detection mechanism (SS2.1: "When invoked as `mpiexec cobre /path/to/case`, the CLI detects that no recognized subcommand was given and treats the path argument as an implicit `run` subcommand") means the bare-path form is the correct SLURM invocation.

---

### F-013: `--quiet` Behavior Inconsistency Between Human and Structured Modes

**Severity**: Low
**Affected Crate**: cobre-cli
**Affected Phase**: Phase 8

**Evidence**:

structured-output.md SS5.2 defines `--quiet` behavior:

> "| `--quiet` | Suppresses all stdout; exit code only | Suppresses all stdout | Suppresses all stdout |"

cli-and-lifecycle.md SS3.1 defines `--quiet`:

> "| `--quiet` | (flag) | off | Suppress non-essential output (progress bars, decorative headers). In `json` mode, suppresses `warnings` array |"

The cli-and-lifecycle.md description says `--quiet` suppresses "non-essential output" and specifically "suppresses `warnings` array" in json mode. The structured-output.md description says `--quiet` "suppresses all stdout" in all modes. These are different behaviors: one suppresses warnings from the JSON envelope, the other suppresses the entire output.

**Impact**: An agent that uses `--output-format json --quiet` would receive no output at all according to structured-output.md, or would receive a JSON envelope without warnings according to cli-and-lifecycle.md. The difference affects CI/CD pipeline design.

**Recommendation**: Reconcile the two descriptions. The structured-output.md behavior (suppress all stdout) is the stronger and simpler contract. If this is the intended behavior, update cli-and-lifecycle.md SS3.1 to match. If the intention is to keep the JSON envelope but strip warnings, update structured-output.md SS5.2.

---

## 3. GAP Cross-Reference

| GAP ID  | Summary                                              | Current Status | Findings                                               |
| ------- | ---------------------------------------------------- | -------------- | ------------------------------------------------------ |
| GAP-027 | `training.forward_passes` has no default             | Open           | F-008                                                  |
| GAP-035 | Example `config.json` uses non-minimal defaults      | Open           | F-009                                                  |
| GAP-020 | cobre-sddp to cobre-io output writer API unspecified | Open           | Noted in SS1.5 (cobre-cli -> cobre-io output writing)  |
| GAP-032 | Event channel type (`broadcast`) ambiguity           | Open           | Noted in SS1.5 (cobre-cli -> cobre-core TrainingEvent) |

---

## 4. Summary Statistics

| Category                    | COMPLETE | PARTIAL | MISSING | N/A   | Total  |
| --------------------------- | -------- | ------- | ------- | ----- | ------ |
| Public Types                | 4        | 5       | 0       | 0     | 9      |
| Public Functions            | 9        | 3       | 0       | 0     | 12     |
| Error Types                 | 4        | 1       | 0       | 0     | 5      |
| Trait Implementations       | 0        | 0       | 0       | 1     | 1      |
| Crate Boundary Interactions | 6        | 2       | 0       | 0     | 8      |
| **Total**                   | **23**   | **11**  | **0**   | **1** | **35** |

**Findings by severity:**

| Severity | Count | Finding IDs                       |
| -------- | ----- | --------------------------------- |
| High     | 5     | F-003, F-007, F-008, F-010, F-012 |
| Medium   | 3     | F-002, F-006, F-011               |
| Low      | 4     | F-001, F-005, F-009, F-013        |

**Unique issues (excluding duplicates):**

- F-003 and F-012 share the same root cause (SLURM invocation pattern mismatch) but cite different evidence.
- F-010 subsumes the `forward_scenarios` naming issue from F-003.

---

## 5. Crate Verdict

**CONDITIONAL PASS**

cobre-cli has zero MISSING items and the execution lifecycle is comprehensively documented through the Phase-Training Loop alignment table (SS5.2a), conditional execution matrix (SS5.3), exit code scheme (SS4), and structured output protocol. The four High-severity findings are all **cross-spec inconsistencies** rather than missing specifications:

1. **F-003/F-012**: SLURM deployment scripts use a `cobre train --config` invocation pattern that contradicts the canonical CLI spec. This is a documentation fix in slurm-deployment.md.
2. **F-007**: `training.enabled` is referenced by cli-and-lifecycle.md and structured-output.md but never defined in the configuration reference. This requires a one-line addition to configuration-reference.md.
3. **F-010**: The forward pass count parameter uses three different names across four spec files. This requires a naming standardization pass.

All four High-severity findings are resolvable through documentation updates without architectural changes. The core lifecycle specification (cli-and-lifecycle.md) is internally consistent and comprehensive. The Phase 8 implementation can proceed once the naming inconsistencies are resolved.

**Conditions for PASS:**

- Resolve F-003/F-012 by updating slurm-deployment.md invocation patterns
- Resolve F-007 by adding `training.enabled` to configuration-reference.md
- Resolve F-010 by standardizing the forward pass count field name across all specs
- Resolve F-008 (GAP-027) by marking `training.forward_passes` as required
