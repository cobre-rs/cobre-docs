# ticket-019 Define Python API Surface from Existing Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Map each of the 7 existing Rust crates' public APIs to a Python interface design. The result is a Python API surface document that defines the high-level classes (`CaseLoader`, `SDDPTrainer`, `SDDPSimulator`), their methods, data types exposed to Python (as DataFrames/NumPy arrays), configuration entry points, and the validation pipeline interface. This document becomes the input for the impact assessment and the cobre-python spec.

## Anticipated Scope

- **Files likely to be read**: `src/crates/overview.md`, individual crate spec pages (7 crates), `src/specs/architecture/cli-and-lifecycle.md`, `src/specs/architecture/validation-pipeline.md`, `src/specs/data-model/output-schemas.md`, `src/specs/data-model/input-system-entities.md`, `src/specs/configuration/solver-parameters.md`
- **Files likely to be created**: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/python-api-surface.md` (deliverable document)
- **Key decisions needed**: What level of granularity for the Python API (high-level orchestration only, or exposing solver internals?); whether MPI should be supported via mpi4py; whether the solver layer (HiGHS/CLP) should be directly accessible from Python
- **Open questions**:
  - Should the Python API expose individual solver iterations, or only train/simulate at the top level?
  - What result formats should be supported (pandas DataFrame, NumPy array, Arrow)?
  - Should configuration be done via Python dicts, Pydantic models, or TOML file paths?
  - How should the 5-layer validation pipeline be exposed (single `validate()` call, or per-layer control)?

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-020, ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
