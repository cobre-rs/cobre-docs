# ticket-020 Assess MCP Server, Python Bindings, and TUI Impact on Existing Specs

## Context

### Background

Beyond the structured CLI (ticket-019), three additional interface layers are planned for the Cobre ecosystem: an MCP server (`cobre-mcp`) for AI agent integration via the Model Context Protocol, Python bindings (`cobre-python`) via PyO3 for programmatic access from Python and Jupyter environments, and a terminal UI (`cobre-tui`) via ratatui for interactive monitoring. Each of these introduces new crates that must integrate with the existing 6-crate + ferrompi architecture and may impose constraints on existing specs.

The current crate ecosystem (`cobre-core`, `cobre-io`, `cobre-stochastic`, `cobre-solver`, `cobre-sddp`, `cobre-cli`, `ferrompi`) is documented in `src/crates/overview.md` with a clean dependency graph. Adding 3 new crates requires understanding where they sit in this graph, what existing public APIs they depend on, and what architectural constraints they impose (GIL handling for Python, single-process requirement for MCP, event streaming for TUI).

### Relation to Epic

This is the second of two parallel assessment tickets in Epic 06. While ticket-019 focuses on structured CLI output (highest priority), this ticket covers the remaining three interface layers: MCP server (second priority), Python bindings (third priority), and TUI (fourth priority). The findings from both tickets feed into ticket-021, which synthesizes them into a coherent architecture document.

### Current State

The following specs define the architectural surface that the three new interface layers will interact with:

- **`src/crates/overview.md`** -- Documents 6 crates + ferrompi with a simple dependency graph. No placeholder for MCP, Python, or TUI crates. The "Design principles" section establishes: `cobre-core` is the foundation, solvers are pluggable, IO is separated from computation.

- **`src/specs/architecture/cli-and-lifecycle.md`** -- Defines a single-entrypoint lifecycle. No embedded/library mode for Python embedding. No `serve` subcommand for MCP. The lifecycle phases (Startup through Finalize) assume a batch execution model.

- **`src/specs/hpc/hybrid-parallelism.md`** -- Defines ferrompi + OpenMP hybrid. MPI requires `MPI_THREAD_MULTIPLE` initialization. Python's GIL creates a fundamental tension: PyO3 acquires the GIL for Python calls, which conflicts with MPI's threading model. The spec currently makes no mention of non-MPI execution modes.

- **`src/specs/hpc/memory-architecture.md`** -- Defines 4 data ownership categories (shared read-only, thread-local mutable, rank-local growing, temporary). NUMA-aware allocation with first-touch placement. Python's memory model (GC-managed heap) is fundamentally different from the explicit allocation patterns described here.

- **`src/specs/data-model/output-schemas.md`** -- 14 Parquet output schemas. Python users would expect DataFrame-native access (polars/pandas). MCP resources would need JSON representations of result subsets. The existing schemas are Parquet-column definitions with no programmatic API.

- **`src/specs/architecture/training-loop.md`** -- Defines the iteration lifecycle (forward pass, synchronization, backward pass, cut sync, convergence check, checkpoint, logging). The TUI needs to consume iteration events in real-time. The current logging step (step 7 in section 2.1) emits text.

- **`src/specs/architecture/convergence-monitoring.md`** -- Per-iteration output record (section 2.4) and training log format (section 4). The TUI's convergence plot would consume the same data as the convergence log. The training log is currently text-only.

## Specification

### Requirements

Produce an **impact assessment report** (markdown document in the epic directory) organized by interface layer (MCP, Python, TUI), that:

1. **For MCP Server (`cobre-mcp`)**:
   - Map existing Cobre operations to MCP tools (which operations become tools, with what input/output schemas)
   - Map existing data artifacts to MCP resources (case directories, policy files, result datasets)
   - Identify MCP prompts for guided agent interaction
   - Recommend transport design (stdio for local, SSE/streamable-HTTP for remote)
   - Define the security model (read-only vs read-write operations, sandboxing)
   - List existing specs that need modification to support MCP integration

2. **For Python Bindings (`cobre-python`)**:
   - Map the 6 Rust crate public APIs to Python interface design (classes, methods, data types)
   - Analyze GIL interaction with the hybrid parallelism model (MPI + OpenMP + GIL)
   - Identify zero-copy data paths (NumPy/Arrow for scenario data and results)
   - Recommend whether MPI support is needed from Python (mpi4py integration vs single-process only)
   - Analyze FlatBuffers policy data access from Python
   - List existing specs that need modification to support Python embedding

3. **For Terminal UI (`cobre-tui`)**:
   - Identify training loop events that need to be surfaced (iteration progress, convergence, resource usage)
   - Define monitoring views needed (convergence plot, iteration detail, memory, communication)
   - Analyze interactive features (pause training, inspect cuts, compare scenarios)
   - Define relationship to structured output (does TUI consume the same JSON-lines stream as the CLI?)
   - List existing specs that need modification to support TUI event consumption

4. **Cross-cutting concerns**:
   - Catalog every existing spec that needs modification, with section-level precision
   - Classify each change by severity (REQUIRED/RECOMMENDED/OPTIONAL)
   - Identify new crate documentation pages needed in `src/crates/`
   - Identify cross-reference index updates needed

### Inputs/Props

- The 7 spec files listed in Current State above (read-only review)
- The cross-reference index at `src/specs/cross-reference-index.md`
- The crate documentation pages in `src/crates/` (overview.md, core.md, io.md, stochastic.md, solver.md, sddp.md, cli.md, ferrompi.md)
- The epic overview design constraints table

### Outputs/Behavior

A single assessment report file: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md`

The report must contain:

1. **MCP Server Assessment** -- Tool/resource/prompt mapping, transport recommendation, security model, affected specs
2. **Python Bindings Assessment** -- API surface mapping, GIL analysis, zero-copy paths, MPI recommendation, affected specs
3. **TUI Assessment** -- Event model, view definitions, interactive features, affected specs
4. **Impact Inventory Table** -- One row per affected spec section, with columns: Spec File, Section, Interface Layer (MCP/Python/TUI/Multiple), Current State, Required Change, Severity, Notes
5. **New Crate Documentation Inventory** -- List of new `src/crates/*.md` pages needed
6. **Architectural Constraint Summary** -- Key constraints each interface layer imposes on the existing architecture (e.g., "Python bindings require single-process execution mode without MPI")

### Error Handling

- If a spec file listed in scope does not exist, note its absence in the report rather than failing.
- If an architectural constraint cannot be resolved from available information (e.g., whether mpi4py + ferrompi can coexist), flag it as OPEN with the specific question.

## Acceptance Criteria

- [ ] Given the 6 existing Rust crates, when the MCP assessment is complete, then every crate operation that maps to an MCP tool is listed with its proposed tool name, input schema shape, and output schema shape.
- [ ] Given the hybrid parallelism spec (ferrompi + OpenMP), when the Python bindings assessment is complete, then the GIL interaction analysis explicitly addresses: (a) whether Python bindings can coexist with MPI in the same process, (b) how thread-local solver workspaces interact with the GIL, and (c) the recommended execution mode (single-process only vs MPI-compatible).
- [ ] Given the training-loop.md iteration lifecycle (section 2.1, 7 steps), when the TUI assessment is complete, then every step that emits observable data is mapped to a TUI event with its payload shape.
- [ ] Given the convergence-monitoring.md per-iteration record (section 2.4), when the TUI assessment is complete, then the convergence plot data source is explicitly defined (same record, or different).
- [ ] Given the crates/overview.md dependency graph, when the new crate documentation inventory is complete, then each of `cobre-mcp`, `cobre-python`, and `cobre-tui` has a proposed dependency list referencing existing crates.
- [ ] Given all 3 interface layers assessed, when the Impact Inventory Table is complete, then each affected spec section is tagged with which interface layer(s) require the change.
- [ ] Given the report is written, when `mdbook build` is run, then it exits 0 (the report is in plans/ directory, not in src/, so this is a no-op gate confirming no src/ files were modified).

## Implementation Guide

### Suggested Approach

1. **MCP-first pass**: Read the MCP specification concepts (tools, resources, prompts, transports) and map them against Cobre's current capabilities. For each Cobre operation (validate, run training, run simulation, query results, compare policies), determine the MCP primitive type.
2. **Python bindings pass**: For each of the 6 Rust crates, examine the public API surface described in the crate docs and spec files. Determine what Python classes/methods would expose this functionality. Pay special attention to the GIL/MPI tension.
3. **TUI pass**: Walk through the training loop iteration lifecycle step by step. For each step, determine what data an interactive terminal UI would want to display. Then review convergence-monitoring.md for the specific metrics.
4. **Cross-cutting consolidation**: Merge the three per-layer impact lists into the unified Impact Inventory Table. De-duplicate entries where multiple layers affect the same spec section.
5. Write the findings report.

### Key Files to Read

| File                                               | Focus Areas                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `src/crates/overview.md`                           | Dependency graph, design principles, crate responsibility boundaries  |
| `src/crates/core.md`                               | Public types that Python would expose                                 |
| `src/crates/io.md`                                 | IO patterns that Python/MCP need to replicate or bypass               |
| `src/crates/sddp.md`                               | Training/simulation entry points that MCP tools and Python would call |
| `src/crates/cli.md`                                | Current binary entrypoint -- contrast with library/embedded mode      |
| `src/specs/architecture/cli-and-lifecycle.md`      | Lifecycle phases -- which apply in embedded/library mode?             |
| `src/specs/hpc/hybrid-parallelism.md`              | MPI + OpenMP model -- GIL conflict analysis                           |
| `src/specs/hpc/memory-architecture.md`             | NUMA-aware allocation -- Python compatibility                         |
| `src/specs/architecture/training-loop.md`          | Iteration lifecycle -- TUI event sources                              |
| `src/specs/architecture/convergence-monitoring.md` | Per-iteration record -- TUI convergence plot data                     |
| `src/specs/data-model/output-schemas.md`           | Parquet schemas -- Python DataFrame access, MCP resource exposure     |

### Key File to Create

| File                                                                          | Content                  |
| ----------------------------------------------------------------------------- | ------------------------ |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` | Impact assessment report |

### Patterns to Follow

- **Decision table with rationale column** pattern from Epic 05: use tabular format for the Impact Inventory Table.
- **Per-interface-layer sections** as specified in the epic overview: organize the report by MCP, Python, TUI before consolidating.
- **Source column pattern** from Epics 03-04: cite specific section numbers for every affected spec section.
- **Three-way classification** (REQUIRED/RECOMMENDED/OPTIONAL) consistent with ticket-019's severity scheme.

### Pitfalls to Avoid

- Do not design the Python API itself -- that is Epic 07 ticket-024's scope. This ticket identifies which Rust APIs need Python exposure and what constraints apply.
- Do not design the MCP tool schemas -- that is Epic 07 ticket-023's scope. This ticket maps existing operations to MCP primitives.
- Do not design the TUI layout -- that is Epic 07 ticket-025's scope. This ticket identifies what data the TUI needs to consume.
- Do not conflate MPI execution mode with single-process mode. Python bindings and MCP server run without MPI. The existing HPC batch mode with MPI continues unchanged. The two modes coexist as separate execution paths.
- Do not underestimate the GIL/MPI analysis. This is the most architecturally significant finding expected from this ticket. The recommendation must be concrete: either Python is single-process only, or a specific coexistence strategy (releasing GIL during Rust computation, mpi4py integration) is recommended with tradeoffs.

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation assessment ticket.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

### Validation

- Verify the findings report covers all 3 interface layers (MCP, Python, TUI).
- Verify the Impact Inventory Table tags every entry with the interface layer(s) requiring the change.
- Verify the GIL analysis addresses all 3 sub-questions from the acceptance criteria.
- Run `mdbook build` from `src/` to confirm exit 0 (no src/ files modified).

## Dependencies

- **Blocked By**: None (can start independently, parallel with ticket-019)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: High
