# ticket-020 Assess Impact on Existing Spec Designs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Identify which of the 50 existing spec documents contain assumptions that are incompatible with or need modification for a Python embedding layer. Produce an impact report listing each affected spec, the specific assumption or design element that conflicts, the nature of the conflict, and a recommended resolution. This informs both the cobre-python spec and any future updates to existing specs.

## Anticipated Scope

- **Files likely to be read**: All 50 spec files, with particular focus on:
  - `src/specs/architecture/cli-and-lifecycle.md` (lifecycle assumes CLI-only entry point)
  - `src/specs/architecture/validation-pipeline.md` (validation may need Python-accessible hooks)
  - `src/specs/hpc/hybrid-parallelism.md` (MPI+threads model incompatible with GIL)
  - `src/specs/hpc/memory-architecture.md` (NUMA-aware thread-local workspaces)
  - `src/specs/hpc/work-distribution.md` (MPI rank distribution model)
  - `src/specs/data-model/output-schemas.md` (output formats may need Python-native alternatives)
  - `src/specs/configuration/solver-parameters.md` (configuration may need Python-specific options)
- **Files likely to be created**: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/spec-impact-report.md` (deliverable document)
- **Key decisions needed**: Whether Python support requires changes to existing specs or only additive new specs; whether the lifecycle spec needs a new "embedded mode" section; whether GIL-compatible execution is a new HPC concern
- **Open questions**:
  - Does the validation pipeline need changes for Python, or can it be wrapped as-is?
  - Does the configuration schema need Python-specific options (e.g., `output_format: "dataframe"`)?
  - Should the lifecycle spec define an "embedded" or "library" mode alongside the CLI mode?
  - How many specs actually have hard MPI-only assumptions vs. soft preferences?

## Dependencies

- **Blocked By**: ticket-019 (needs the API surface to assess impact)
- **Blocks**: ticket-021

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
