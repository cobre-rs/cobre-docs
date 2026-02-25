# ticket-020 Assess MCP Server, Python Bindings, and TUI Impact on Existing Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Review the crate architecture, data model, configuration, and HPC specs to assess the impact of adding three new interface layers: an MCP server (`cobre-mcp`), Python bindings (`cobre-python` via PyO3), and a terminal UI (`cobre-tui` via ratatui). Identify every existing spec that needs modification, catalog new crate dependencies, and document architectural constraints for each interface layer.

## Anticipated Scope

- **MCP Server assessment**:
  - Which existing operations map to MCP tools (run study, validate, query results, compare policies)?
  - Which data artifacts map to MCP resources (case directories, policy files, result datasets)?
  - What MCP prompts would guide agent interaction (system modeling, parameter tuning, result interpretation)?
  - Transport design: stdio for local agents, SSE for remote, WebSocket for streaming results?
  - Security model: sandboxing, read-only vs. read-write operations

- **Python Bindings assessment**:
  - Map 7 Rust crate public APIs to Python interface design (classes, methods, data types)
  - GIL interaction with thread-local solver workspaces and NUMA-aware allocation
  - Zero-copy data paths (NumPy/Arrow for scenario data and results)
  - Whether MPI support is needed (mpi4py integration vs single-process only)
  - FlatBuffers deserialization for policy data from Python

- **Terminal UI assessment**:
  - Which training loop events need to be surfaced (iteration progress, convergence, resource usage)?
  - What monitoring views are needed (convergence plot, iteration detail, memory, communication)?
  - Interactive features (pause training, inspect cuts, compare scenarios)
  - Relationship to structured output (TUI consumes same JSON-lines stream?)

- **Specs to review**:
  - `crates/overview.md` — Dependency graph needs 3 new crates
  - `specs/architecture/cli-and-lifecycle.md` — Lifecycle needs embedded/library mode for Python, `serve` subcommand for MCP
  - `specs/hpc/hybrid-parallelism.md` — MPI+threads model vs GIL vs single-process MCP
  - `specs/hpc/memory-architecture.md` — NUMA-aware workspaces need Python-compatible patterns
  - `specs/data-model/output-schemas.md` — Outputs need Python-native and MCP-native paths
  - `specs/architecture/training-loop.md` — Event hooks for TUI and progress streaming
  - `specs/architecture/convergence-monitoring.md` — Monitoring data for TUI consumption

- **Deliverable**: Impact report with per-interface-layer sections, each listing affected specs, required changes, and architectural constraints

## Dependencies

- **Blocked By**: None (can start independently, parallel with ticket-019)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
