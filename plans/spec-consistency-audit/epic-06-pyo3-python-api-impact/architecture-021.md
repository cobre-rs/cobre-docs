# architecture-021: Interface Architecture and Agent-Readability Blueprint

## Purpose

This document synthesizes the findings from ticket-019 (structured CLI impact) and ticket-020 (MCP/Python/TUI impact) into a unified interface architecture for three new crates (`cobre-mcp`, `cobre-python`, `cobre-tui`) and defines the scope of each Epic 07 ticket. It serves as the primary architectural reference for all Epic 07 spec authors.

---

## 1. Expanded Dependency Graph

### 1.1 Current Architecture (6 crates + ferrompi)

```
cobre-cli
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core

ferrompi (optional, MPI execution only)
  used by: cobre-sddp, cobre-cli
```

### 1.2 Expanded Architecture (9 crates + ferrompi)

```
cobre-cli
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-tui                  [NEW]
  |     +-- cobre-core           (event type definitions only)
  +-- cobre-core

cobre-mcp                        [NEW, standalone server binary]
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core

cobre-python                     [NEW, PyO3 cdylib]
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core

ferrompi (optional, MPI execution only)
  used by: cobre-sddp, cobre-cli
  NOT used by: cobre-mcp, cobre-python, cobre-tui
```

### 1.3 Dependency Matrix

| Crate        | cobre-core | cobre-io | cobre-solver | cobre-stochastic | cobre-sddp | cobre-cli | ferrompi |
| ------------ | ---------- | -------- | ------------ | ---------------- | ---------- | --------- | -------- |
| cobre-cli    | yes        | yes      | (transitive) | (transitive)     | yes        | --        | optional |
| cobre-mcp    | yes        | yes      | (transitive) | (transitive)     | yes        | no        | **no**   |
| cobre-python | yes        | yes      | (transitive) | (transitive)     | yes        | no        | **no**   |
| cobre-tui    | yes        | no       | no           | no               | no         | no        | **no**   |

**Key property**: None of the three new crates depend on `ferrompi`. They share the single-process execution path through `cobre-sddp` with OpenMP parallelism only.

### 1.4 No Circular Dependencies

The dependency graph is a DAG. Verification:

- `cobre-tui` depends only on `cobre-core` (event types). It does not depend on `cobre-cli`.
- `cobre-cli` depends on `cobre-tui` (not the reverse). The TUI is a library consumed by the CLI binary.
- `cobre-mcp` and `cobre-python` are leaf crates: they depend on internal crates but no internal crate depends on them.
- `cobre-sddp` does not depend on any interface crate. Event emission is defined via traits/channels in `cobre-core`, not by depending on consumers.

---

## 2. Responsibility Boundaries

### 2.1 `cobre-mcp` -- MCP Server

| Attribute             | Value                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Crate type**        | Binary crate (`[[bin]]`)                                                                                                     |
| **Execution mode**    | Single-process. No MPI. OpenMP threads for computation                                                                       |
| **What it owns**      | MCP protocol handling (stdio/SSE/streamable-HTTP transport), tool dispatch, resource serving, prompt definitions, sandboxing |
| **What it delegates** | All computation to `cobre-sddp`; all I/O to `cobre-io`; all data model types from `cobre-core`                               |
| **Binary name**       | `cobre-mcp` (standalone) or `cobre serve` (subcommand hosted in `cobre-cli`)                                                 |
| **MPI relationship**  | Never initializes MPI. The `cobre-sddp` library operates in single-rank mode                                                 |

**Owned operations** (from findings-020 SS1.1):

| Operation Category | Tools                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Validation         | `cobre/validate`                                                                                                       |
| Execution          | `cobre/run`                                                                                                            |
| Query (read-only)  | `cobre/query-results`, `cobre/query-convergence`, `cobre/inspect-policy`, `cobre/inspect-case`, `cobre/list-scenarios` |
| Comparison         | `cobre/compare-policies`                                                                                               |
| Export             | `cobre/export-results`                                                                                                 |
| Introspection      | `cobre/get-config-schema`                                                                                              |

**Security boundary**: File access sandboxed to configured allowlist of case/output directories. Read-only by default; write operations (`run`, `export-results`) require explicit opt-in.

### 2.2 `cobre-python` -- Python Bindings

| Attribute             | Value                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Crate type**        | `cdylib` (PyO3 shared library)                                                                                                          |
| **Execution mode**    | Single-process. No MPI. OpenMP threads for computation. GIL released during all Rust computation                                        |
| **What it owns**      | PyO3 class/function definitions, Python-to-Rust type conversions, zero-copy NumPy/Arrow bridge, async wrapper (optional)                |
| **What it delegates** | All computation to `cobre-sddp`; all I/O to `cobre-io`; all data model types from `cobre-core`                                          |
| **Module name**       | `import cobre`                                                                                                                          |
| **MPI relationship**  | MUST NOT depend on `ferrompi`. MUST NOT initialize MPI. Python users needing distributed execution launch `mpiexec cobre` as subprocess |

**Python API surface** (from findings-020 SS2.1):

| Rust Source Crate | Python Exposure                             | Data Type Mapping                                    |
| ----------------- | ------------------------------------------- | ---------------------------------------------------- |
| cobre-core        | Read-only entity objects, topology data     | `#[pyclass]` structs, `numpy.ndarray` for parameters |
| cobre-io          | `CaseLoader.load(path)`, `validate(path)`   | `Case` Python object, `ValidationResult`             |
| cobre-stochastic  | `PARModel`, `sample_noise()`, `OpeningTree` | NumPy arrays (zero-copy via PyO3 numpy crate)        |
| cobre-sddp        | `train()`, `simulate()`, `Policy` class     | `TrainingResult`, `SimulationResult`, Arrow tables   |
| cobre-solver      | Not exposed                                 | Internal implementation detail                       |
| ferrompi          | Not exposed                                 | Single-process only                                  |

**GIL contract** (from findings-020 SS2.2):

1. GIL acquired to receive Python call and validate arguments
2. GIL released via `py.allow_threads()` before entering Rust computation
3. No Rust thread within an OpenMP parallel region ever acquires the GIL
4. GIL reacquired to convert results to Python objects on return
5. No Python callbacks into the hot loop (all customization via configuration)

### 2.3 `cobre-tui` -- Terminal UI

| Attribute             | Value                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Crate type**        | Library crate (consumed by `cobre-cli`) or optionally a standalone binary                            |
| **Execution mode**    | Single-threaded rendering. Receives events from the training loop via channel or JSON-lines pipe     |
| **What it owns**      | Terminal rendering (ratatui/crossterm), view layout, interactive commands (pause, inspect, export)   |
| **What it delegates** | All event production to `cobre-sddp` (via event channel); all event type definitions to `cobre-core` |
| **MPI relationship**  | Never touches MPI. In co-hosted mode, runs on rank 0 only                                            |

**Consumption modes** (from findings-020 SS5.3):

| Mode            | Mechanism                                                                                                 | Use Case                                        |
| --------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Co-hosted       | In-process `broadcast` channel subscribed alongside JSON-lines writer                                     | Interactive monitoring during `cobre run --tui` |
| Standalone pipe | Reads JSON-lines from stdin pipe: `mpiexec cobre run ... --output-format json-lines` piped to `cobre-tui` | Monitoring a remote or already-running job      |

**Monitoring views** (from findings-020 SS3.3): convergence plot, iteration detail, cut statistics, resource usage, communication breakdown.

**Interactive features**: pause/resume at iteration boundary, cut inspection (read-only at boundary), stopping rule adjustment, snapshot export.

---

## 3. Shared Event/Progress Stream Architecture

### 3.1 Design Rationale

All four output consumers -- text logger, JSON-lines writer, TUI renderer, MCP progress notifications -- consume the same event data from the SDDP training loop. Rather than four separate output paths that could diverge, a single event emission mechanism in `cobre-sddp` feeds a channel that all consumers subscribe to.

### 3.2 Event Types

Derived from Training Loop §2.1 iteration lifecycle steps and Convergence Monitoring §2.4 per-iteration record.

**Iteration-scoped events** (emitted once per training iteration):

| Event Type             | Lifecycle Step | Payload Fields                                                                                                                                    | Source Spec                        |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `ForwardPassComplete`  | Step 1         | `iteration`, `scenarios`, `lb_candidate`, `ub_mean`, `ub_std`, `elapsed_ms`                                                                       | training-loop.md §4                |
| `ForwardSyncComplete`  | Step 2         | `iteration`, `global_lb`, `global_ub_mean`, `global_ub_std`, `sync_time_ms`                                                                       | training-loop.md §4.3              |
| `BackwardPassComplete` | Step 3         | `iteration`, `cuts_generated`, `stages_processed`, `elapsed_ms`                                                                                   | training-loop.md §6                |
| `CutSyncComplete`      | Step 4         | `iteration`, `cuts_distributed`, `cuts_active`, `cuts_removed`, `sync_time_ms`                                                                    | training-loop.md §6.3              |
| `ConvergenceUpdate`    | Step 5         | `iteration`, `lower_bound`, `upper_bound`, `upper_bound_std`, `ci_95`, `gap`, `rules_evaluated[]`                                                 | convergence-monitoring.md §2.4     |
| `CheckpointComplete`   | Step 6         | `iteration`, `checkpoint_path`, `elapsed_ms`                                                                                                      | checkpointing.md                   |
| `IterationSummary`     | Step 7         | `iteration`, `lower_bound`, `upper_bound`, `gap`, `wall_time_ms`, `iteration_time_ms`, `forward_ms`, `backward_ms`, `lp_solves`, `memory_peak_mb` | convergence-monitoring.md §2.4, §4 |

**Lifecycle events** (emitted once per training/simulation run):

| Event Type           | Payload Fields                                                                        | Source Spec                         |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------- |
| `TrainingStarted`    | `case_name`, `stages`, `hydros`, `thermals`, `ranks`, `threads_per_rank`, `timestamp` | convergence-monitoring.md §4 header |
| `TrainingFinished`   | `reason`, `iterations`, `final_lb`, `final_ub`, `total_time_ms`, `total_cuts`         | convergence-monitoring.md §4 footer |
| `SimulationProgress` | `scenarios_complete`, `scenarios_total`, `elapsed_ms`                                 | simulation-architecture.md          |
| `SimulationFinished` | `scenarios`, `output_dir`, `elapsed_ms`                                               | simulation-architecture.md          |

### 3.3 Payload Shapes

All payloads are flat JSON-serializable structs. The `ConvergenceUpdate` payload is the canonical per-iteration record from Convergence Monitoring §2.4:

```rust
// Defined in cobre-core (shared across all consumers)
#[derive(Clone, Debug, serde::Serialize)]
pub struct ConvergenceUpdate {
    pub iteration: i32,
    pub lower_bound: f64,
    pub upper_bound: f64,
    pub upper_bound_std: f64,
    pub ci_95: f64,
    pub gap: f64,
    pub wall_time_ms: i64,
    pub iteration_time_ms: i64,
}
```

The `IterationSummary` payload is a superset that adds timing breakdown and resource metrics (matching `convergence.parquet` schema from Output Schemas §6.1):

```rust
#[derive(Clone, Debug, serde::Serialize)]
pub struct IterationSummary {
    pub iteration: i32,
    pub lower_bound: f64,
    pub upper_bound: f64,
    pub gap: f64,
    pub wall_time_ms: i64,
    pub iteration_time_ms: i64,
    pub forward_ms: i64,
    pub backward_ms: i64,
    pub lp_solves: i64,
    pub memory_peak_mb: i64,
}
```

### 3.4 Consumer Registration Pattern

The event channel uses Rust's `broadcast` channel pattern. Producers (the training loop in `cobre-sddp`) send events to a channel. Consumers subscribe at initialization time.

```
Training Loop (cobre-sddp)
    |
    v
Event Channel (broadcast::Sender<TrainingEvent>)
    |
    +---> Text Logger          [cobre-cli, --output-format human]
    |
    +---> JSON-lines Writer    [cobre-cli, --output-format json-lines]
    |
    +---> TUI Renderer         [cobre-tui, --tui flag or standalone pipe]
    |
    +---> MCP Progress         [cobre-mcp, SSE/stdio progress notifications]
    |
    +---> Parquet Writer        [cobre-io, convergence.parquet -- always active]
```

**Key design decisions**:

1. **Event types defined in `cobre-core`**: This avoids circular dependencies. `cobre-sddp` imports event types from `cobre-core` to emit them. Consumer crates (`cobre-cli`, `cobre-tui`, `cobre-mcp`) also import from `cobre-core` to receive them. No consumer depends on the producer crate for type definitions.

2. **Channel injected at initialization**: The training loop accepts an `Option<broadcast::Sender<TrainingEvent>>`. When `None`, no events are emitted (zero overhead for library-mode callers who do not need events). When `Some(sender)`, events are emitted at each lifecycle step boundary.

3. **Consumers are additive**: Multiple consumers can subscribe simultaneously. The text logger and Parquet writer are always present; JSON-lines, TUI, and MCP consumers are activated by CLI flags or server mode.

4. **Backpressure**: If a consumer falls behind (e.g., slow TUI rendering), the broadcast channel drops old events rather than blocking the training loop. Consumers must tolerate gaps.

### 3.5 Relationship to Existing Convergence Monitoring

The event stream architecture extends, not replaces, the existing convergence monitoring design:

| Existing (convergence-monitoring.md) | Event Stream Extension                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| §2.1 Tracked quantities              | Same quantities; now formalized as event struct fields                                 |
| §2.4 Per-iteration output record     | Becomes the `ConvergenceUpdate` event type payload                                     |
| §3.1 Cross-rank aggregation          | Unchanged; aggregation happens before event emission (event carries global statistics) |
| §4 Training log format               | Text logger becomes one consumer of the event stream; format unchanged                 |

The convergence monitor remains the authority for bound computation and stopping rule evaluation. The event stream is the _output channel_ through which the monitor's results reach all consumers.

---

## 4. Agent Context Strategy

### 4.1 CLAUDE.md Conventions

The Cobre repository should include a `CLAUDE.md` file at the repository root with:

| Section                   | Content                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Project overview**      | One-paragraph description of Cobre as an SDDP hydrothermal dispatch solver                                 |
| **Architecture summary**  | Crate dependency graph, noting that `cobre-sddp` is the algorithm core and `cobre-core` holds shared types |
| **Build instructions**    | `cargo build --release`, feature flags for solver backends, MPI optional via `ferrompi` feature            |
| **Test instructions**     | `cargo test`, `cargo test --features integration`, HPC tests require `mpiexec`                             |
| **Key commands**          | `cobre run /path`, `cobre validate /path`, `cobre report /path`, `cobre compare dir1 dir2`, `cobre serve`  |
| **Output format**         | `--output-format json` for structured output, `--output-format json-lines` for streaming                   |
| **Case directory layout** | Reference to input-directory-structure.md for the canonical directory structure                            |
| **Common workflows**      | Validate -> Train -> Simulate -> Report pipeline with example commands                                     |
| **Error handling**        | All errors have `kind` field; reference to error kind registry                                             |
| **Do not modify**         | Generated files: `training/convergence.parquet`, `policy/cuts/`, `simulation/` Parquet files               |

### 4.2 Claude Code Skill Definitions

Skill files placed in `.claude/skills/` enable Claude Code to perform common Cobre operations:

| Skill File            | Activates On                                 | Content                                                                                                       |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `cobre-validate.md`   | Mention of validation, input errors          | How to run `cobre validate --output-format json`, interpret error kinds, fix common validation failures       |
| `cobre-run.md`        | Mention of training, simulation, convergence | How to run `cobre run --output-format json-lines`, monitor progress, interpret convergence                    |
| `cobre-diagnose.md`   | Mention of convergence problems, stalling    | How to read `convergence.parquet`, identify bound stalling, adjust stopping rules and risk measure parameters |
| `cobre-compare.md`    | Mention of comparing runs, policy quality    | How to run `cobre compare --output-format json`, interpret delta metrics                                      |
| `cobre-case-setup.md` | Mention of creating a case, input files      | Directory structure, required files, JSON schemas for config.json, hydros.json, etc.                          |

### 4.3 Structured Documentation Patterns

The existing spec corpus supports agent navigation through:

1. **Cross-reference index** (`cross-reference-index.md`): Machine-navigable mapping from specs to crates, with ordered reading lists per crate
2. **Stable section numbering**: Section numbers (§1, §2.4, §3.1) are stable identifiers used in cross-references, enabling agents to resolve references precisely
3. **Forward references with `(planned)` annotation**: Specs that reference not-yet-written documents use explicit planned markers rather than broken links
4. **Error kind registry**: A single authoritative list of all error kinds, enabling agents to programmatically match and handle errors

### 4.4 Agent-Friendly Error Messages

Every structured error includes a `suggestion` field. Suggestions are written for an agent audience:

- **Specific**: "Check that `bus_id` 99 exists in `buses.json`" (not "check your inputs")
- **Actionable**: Identifies the file and field to inspect or modify
- **Contextual**: Includes the entity ID, stage, iteration, or other identifiers needed to locate the problem
- **Non-prescriptive**: Suggests what to check, not what the answer is (the agent may have domain knowledge to determine the fix)

---

## 5. Epic 07 Scope Definitions

### 5.1 ticket-022: `structured-output.md`

**Spec location**: `src/specs/interfaces/structured-output.md`

**Scope**: Define the complete structured output protocol for the Cobre CLI.

**Must contain**:

1. **Response envelope schema**: Full JSON Schema for the top-level envelope (`$schema`, `command`, `success`, `exit_code`, `cobre_version`, `errors`, `warnings`, `data`, `summary`). Include per-subcommand `data` shape specifications.

2. **Error schema**: Full definition of the structured error record (`kind`, `message`, `context`, `suggestion`). The complete error kind registry (14 validation kinds from validation-architecture.md §4 plus runtime kinds: `SolverFailure`, `MpiError`, `CheckpointFailed`, `OutputCorrupted`, `OutputNotFound`, `IncompatibleRuns`).

3. **JSON-lines streaming protocol**: Envelope types (`started`, `progress`, `terminated`, `result`), payload schemas for each, line termination rules, relationship to convergence-monitoring.md §2.4.

4. **Subcommand output specifications**: Per-subcommand (run, validate, report, compare, version) response shape in both `--output-format json` and `--output-format json-lines` modes.

5. **Output format negotiation**: `--output-format` flag specification, default behavior, interaction with `--quiet` and `--no-progress`.

6. **Schema versioning strategy**: `$schema` field semantics, additive-only evolution rules, backward compatibility guarantees.

**Must NOT contain**: MCP protocol details (ticket-023), Python API (ticket-024), TUI rendering (ticket-025).

**Depends on**: findings-019 design decisions (§2.1 human-first default, §2.2 structured stdout with envelope, §2.3 hybrid detection, §2.4 generalized validation report).

### 5.2 ticket-023: `mcp-server.md`

**Spec location**: `src/specs/interfaces/mcp-server.md`

**Scope**: Define the MCP server specification for `cobre-mcp`.

**Must contain**:

1. **Tool definitions**: All 10 tools from findings-020 §1.1 with full input/output JSON schemas, error conditions, and timeout behavior.

2. **Resource definitions**: All 6 resource types from findings-020 §1.2 with URI templates, MIME types, and data conversion rules (Parquet-to-JSON, FlatBuffers-to-JSON).

3. **Prompt definitions**: All 4 prompts from findings-020 §1.3 with argument schemas and purpose descriptions.

4. **Transport specification**: stdio transport for local, streamable-HTTP/SSE for remote. Connection lifecycle, authentication model (if any).

5. **Progress reporting**: How `cobre/run` reports progress via MCP progress notifications. Mapping from `ConvergenceUpdate` events to MCP progress tokens.

6. **Security model**: Sandboxed file access, read-only vs read-write modes, allowlist configuration.

7. **Long-running operation model**: Background task pattern or progress-during-call pattern for training runs.

**Must NOT contain**: CLI structured output protocol (ticket-022), Python bindings (ticket-024), TUI rendering (ticket-025).

**Depends on**: findings-020 §1 (MCP assessment), structured-output.md (shared event types and error schemas).

**Assumption (from findings-020 Q-3)**: The long-running operation model for MCP is not yet resolved. The spec should present the recommended approach (progress notifications during the call) and document the alternative (background task with polling) as a design note. This is flagged for user review.

### 5.3 ticket-024: `python-bindings.md`

**Spec location**: `src/specs/interfaces/python-bindings.md`

**Scope**: Define the Python bindings specification for `cobre-python`.

**Must contain**:

1. **Python API surface**: Complete function/class signatures for all public APIs exposed from each source crate (cobre-core, cobre-io, cobre-stochastic, cobre-sddp) per findings-020 §2.1. Include type annotations.

2. **GIL management contract**: The 5-point GIL contract from findings-020 §2.2. When GIL is held, when released, what invariants apply.

3. **Zero-copy data paths**: NumPy and Arrow zero-copy mechanisms per findings-020 §2.3. Which data types use zero-copy, which require conversion.

4. **Execution mode specification**: Single-process only, no MPI, OpenMP threads. The explicit prohibition on MPI from Python with rationale (GIL/MPI deadlock risk).

5. **Error handling**: Python exception hierarchy mapping from Rust error kinds. How structured errors translate to Python exceptions.

6. **Async support**: Whether `asyncio` wrappers are provided for long-running operations (train, simulate). Recommendation from findings-020 Q-4.

7. **FlatBuffers policy access**: Python API for policy inspection (cuts, evaluation, summary) per findings-020 §2.4. Not exposing FlatBuffers internals.

**Must NOT contain**: CLI protocol (ticket-022), MCP protocol (ticket-023), TUI details (ticket-025).

**Depends on**: findings-020 §2 (Python assessment), structured-output.md (error schema reuse).

**Assumption (from findings-020 Q-4)**: Async support is deferred to implementation time. The spec should document the recommended approach (`run_in_executor` wrapper) but mark it as optional.

### 5.4 ticket-025: `terminal-ui.md`

**Spec location**: `src/specs/interfaces/terminal-ui.md`

**Scope**: Define the terminal UI specification for `cobre-tui`.

**Must contain**:

1. **Event consumption model**: Both co-hosted (in-process channel) and standalone (JSON-lines pipe) modes per findings-020 §3.5.

2. **View specifications**: Layout and data sources for all 5 monitoring views (convergence plot, iteration detail, cut statistics, resource usage, communication) per findings-020 §3.3.

3. **Convergence plot data model**: Mapping from `ConvergenceUpdate` event fields to plot axes, series, and error bars per findings-020 §3.2.

4. **Interactive features**: Pause/resume, cut inspection, scenario comparison, stopping rule adjustment, snapshot export per findings-020 §3.4. Include the iteration-boundary constraint.

5. **Keyboard shortcuts and navigation**: Key bindings for view switching, scrolling, interactive commands.

6. **Rendering requirements**: Minimum terminal size, color support, Unicode requirements.

**Must NOT contain**: CLI protocol (ticket-022), MCP protocol (ticket-023), Python API (ticket-024).

**Depends on**: findings-020 §3 (TUI assessment), structured-output.md (shared event type definitions).

**Assumption (from findings-020 Q-2)**: The TUI should support both co-hosted and standalone modes. The spec should document both, with co-hosted as the primary and standalone as a secondary use case.

### 5.5 ticket-026: Update Existing Specs with Agent-Readability Patterns

**Scope**: Modify existing spec files to incorporate agent-readability requirements identified in findings-019 and findings-020.

**Must modify** (changes derived from findings-019 §1 and findings-020 §4):

| Spec File                    | Changes                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cli-and-lifecycle.md`       | Expand design philosophy (§1), add subcommand patterns (§2), add global flags (§3), add phase mappings (§5), add structured output protocol section (§8) |
| `convergence-monitoring.md`  | Add JSON-lines streaming schema (§4.1), termination event schema (§4.2), formalize per-iteration record as shared event type (§2.4)                      |
| `validation-architecture.md` | Add structured output integration (§5.1), response envelope reference (§5.2)                                                                             |
| `output-infrastructure.md`   | Add CLI report access (§1.3)                                                                                                                             |
| `output-schemas.md`          | Add structured output vs Parquet clarification (§7), JSON serialization guidance for MCP (§1)                                                            |
| `configuration-reference.md` | Add CLI presentation settings note (§1.1)                                                                                                                |
| `training-loop.md`           | Define event emission points (§2.1), document single-rank variants (§4.3, §6.3)                                                                          |
| `hybrid-parallelism.md`      | Add single-process mode subsection (§1), alternative initialization (§6)                                                                                 |
| `memory-architecture.md`     | Add single-process mode notes (§1.1, §2.2)                                                                                                               |
| `cross-reference-index.md`   | Add new crate entries (§1, §2), update cross-references (§3, §4)                                                                                         |
| `crates/overview.md`         | Add 3 new crate rows, update dependency graph                                                                                                            |
| `crates/cli.md`              | Add subcommand architecture, output format negotiation                                                                                                   |

**Must also create** (new crate documentation pages):

| File               | Content                                                  |
| ------------------ | -------------------------------------------------------- |
| `crates/mcp.md`    | MCP server crate overview (per crates/overview.md style) |
| `crates/python.md` | Python bindings crate overview                           |
| `crates/tui.md`    | Terminal UI crate overview                               |

**Must NOT**: Write the new interface specs themselves (those are tickets 022-025).

**Depends on**: tickets 022-025 (the new specs must exist before cross-references can be resolved).

---

## 6. Open Items and Assumptions

The following open items from findings-019 and findings-020 are documented as assumptions for Epic 07. Each requires user confirmation before or during implementation.

### 6.1 From findings-020 Open Questions

| ID  | Question                                                            | Assumed Resolution                                                                                                                                                                                                                                  | Confidence | Blocking? |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| Q-1 | Where should event type definitions live?                           | **`cobre-core`**. Event types are data structures shared by all crates. Adding them to `cobre-core` is the simplest approach with no circular dependencies. If `cobre-core` becomes too large, extract `cobre-events` as a sub-crate later.         | High       | No        |
| Q-2 | Should the TUI be a separate binary or a feature flag in cobre-cli? | **Both**: `cobre-tui` is a library crate consumed by `cobre-cli` (feature flag `tui`), and can also be compiled as a standalone binary for pipe mode. Co-hosted is primary; standalone is secondary.                                                | Medium     | No        |
| Q-3 | What is the MCP server's long-running operation model?              | **Progress notifications during the call**. The MCP `cobre/run` tool blocks until completion, emitting MCP progress notifications each iteration. If the MCP protocol spec evolves to support background tasks natively, the design can be updated. | Medium     | No        |
| Q-4 | Should cobre-python support async (asyncio) for training?           | **Yes, optionally**. Provide `train_async()` and `simulate_async()` wrappers using `asyncio.get_event_loop().run_in_executor()`. Mark as optional in the spec; implement if ergonomics justify it.                                                  | Low        | No        |

### 6.2 Design Decisions Adopted from findings-019

All 4 design decisions from findings-019 §2 are adopted as stated:

| Decision                                | Resolution                                   | Reference         |
| --------------------------------------- | -------------------------------------------- | ----------------- |
| Default output mode                     | Human-first, opt-in JSON                     | findings-019 §2.1 |
| Progress streaming transport            | Structured stdout with envelope (JSON-lines) | findings-019 §2.2 |
| Subcommand coexistence with MPI pattern | Hybrid detection (implicit `run` default)    | findings-019 §2.3 |
| Error schema standard                   | Generalized validation report + enrichments  | findings-019 §2.4 |

### 6.3 Hard Constraints from GIL/MPI Analysis

From findings-020 §2.2, the following are non-negotiable:

1. `cobre-python` MUST NOT depend on `ferrompi`
2. `cobre-python` MUST NOT initialize MPI
3. GIL MUST be released during all Rust computation
4. No Python callbacks into the SDDP hot loop
5. All customization via configuration, not runtime callbacks

These are hard constraints, not assumptions. They are derived from fundamental language runtime incompatibilities and are not subject to revision without a fundamental change in approach.

---

## 7. Acceptance Criteria Verification

| Criterion                                                                      | Status | Evidence                                                                   |
| ------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------- |
| design-principles.md section 2 has goal 7 "Agent-Readability"                  | PASS   | Goal 7 added with 1-sentence description matching style of goals 1-6       |
| design-principles.md has new section 6 paralleling section 3's depth           | PASS   | Section 6 has: principle statement, 6 subsections, rules, examples         |
| All 4 design rules stated with rationale and concrete examples                 | PASS   | Rules 1-4 in §6.2 each have rationale and Cobre-specific example           |
| Agent-readability complements existing principles                              | PASS   | §6.1 explicitly maps to reproducibility, scalability, DOI, distributed I/O |
| Architecture has dependency list, responsibility boundaries, execution mode    | PASS   | §1 (graph), §2 (3 crate tables), execution mode in each table              |
| Event stream architecture defined with types, payloads, registration, relation | PASS   | §3.2 (types), §3.3 (payloads), §3.4 (registration), §3.5 (relation)        |
| Epic 07 scope definitions for all 5 tickets (022-026)                          | PASS   | §5.1-§5.5 with must-contain, must-not-contain, dependencies                |
| `mdbook build` exits 0 after design-principles.md modification                 | PASS   | Build succeeds with only pre-existing warnings in risk-measures.md         |
| OPEN items from findings documented as explicit assumptions                    | PASS   | §6 documents Q-1 through Q-4 and GIL/MPI hard constraints                  |
