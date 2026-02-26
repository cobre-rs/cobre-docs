# ticket-015 Trace Data Model End-to-End

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Trace every input data format (JSON config, JSON entity registries, Parquet scenario files) from its schema spec through the loading pipeline to its in-memory representation in cobre-core. Trace every output data format (convergence Parquet, simulation Parquet, FlatBuffers policy files) from its in-memory source through the writing pipeline to its on-disk schema. Identify any format where the end-to-end chain has a gap (e.g., schema defined but loading function unspecified, or in-memory type defined but output schema missing).

## Anticipated Scope

- **Files likely to be modified**: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-015-data-traceability.md` (new file)
- **Key decisions needed**: How to handle format chains that are partially specified (e.g., schema exists but the loading function signature is only implied)
- **Open questions**:
  - Is the Parquet scenario loading chain complete from column schema to PAR parameter types?
  - Is the FlatBuffers cut persistence chain complete from CutPool in-memory to .fbs on-disk?
  - Does the output infrastructure spec fully specify the Hive partitioning implementation?
  - Are the manifest and metadata schemas specified with enough detail for implementation?

## Dependencies

- **Blocked By**: ticket-002 (cobre-io audit provides the API surface assessment), ticket-001 (cobre-core audit provides the in-memory type assessment)
- **Blocks**: ticket-017 (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
