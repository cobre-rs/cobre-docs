# ticket-024 Write python-bindings.md Spec

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Write a full implementation-ready specification for the Cobre Python bindings. This spec defines: the `cobre-python` PyO3 crate structure, Python API surface (classes, methods, types), GIL interaction strategy, zero-copy data patterns (NumPy/Arrow), DataFrame interop (pandas/polars), Jupyter notebook integration, and the relationship to the structured output layer.

## Anticipated Scope

- **File to create**: `src/specs/architecture/python-bindings.md`
- **Spec sections**:
  1. Purpose: programmatic access to Cobre from Python, Jupyter, and agent frameworks
  2. Module structure: `import cobre` → submodules for core, solver, sddp, io, stochastic
  3. High-level API classes:
     - `cobre.Case` — Load and inspect a case directory
     - `cobre.Study` — Run training, simulation, or both
     - `cobre.Results` — Query convergence, simulation, diagnostics as DataFrames
     - `cobre.Config` — Read/modify configuration programmatically
     - `cobre.Validator` — Run validation pipeline layers
  4. Low-level API: direct access to solver, stochastic models, data structures
  5. GIL strategy: release GIL during long-running operations (training, simulation, LP solves)
  6. Zero-copy data: NumPy arrays for scenario data, Arrow tables for results
  7. DataFrame interop: pandas and polars support for time-series results
  8. Jupyter integration: progress bars, inline convergence plots, rich repr for objects
  9. Error handling: Python exceptions mapped to Rust error types
  10. Build system: maturin, wheel distribution, platform support
  11. Crate architecture: `cobre-python` wrapping all other crates via PyO3
- **Key decisions**: Uses findings from ticket-020 impact assessment
- **Spec depth**: Concrete Python API signatures, example usage patterns, error type mapping

## Dependencies

- **Blocked By**: ticket-022 (structured output schemas reused in Python API)
- **Blocks**: ticket-026

## Effort Estimate

**Points**: 5
**Confidence**: Low (will be re-estimated during refinement)
