# ticket-029 Define Output Writer API

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Resolve GAP-020 by defining the complete output writer API for the cobre-io crate. Report-013 section 4.4 enumerated 9 specific missing elements: (1) simulation Parquet writer, (2) training Parquet writer, (3) manifest writer, (4) metadata writer, (5) dictionary writers, (6) FlatBuffers serialization function, (7) output error type, (8) serde derives on output types, (9) Parquet library selection. This ticket designs the Rust API surface (types, function signatures, error type, trait bounds) that serves all 4 output chains identified in report-015: simulation results to Parquet, training convergence to Parquet, policy checkpoint to FlatBuffers, and metadata/manifests/dictionaries to JSON/CSV. The design should use the input side's `load_case` function as an architectural template (a single anchoring entry point), as recommended by report-015 Finding 3.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/output-infrastructure.md` (primary -- add output writer types and function signatures), `src/specs/data-model/binary-formats.md` (Parquet library selection decision), `src/specs/overview/spec-gap-inventory.md` (mark GAP-020 resolved), possibly `src/specs/data-model/output-schemas.md` (if schema-to-API mapping notes are needed)
- **Key decisions needed**: (1) Whether the output API uses a single `OutputWriter` trait or separate writer types per output chain; (2) Whether the Parquet library is `arrow-rs` (ecosystem standard) or `parquet2` (lower-level); (3) Whether the writer API is synchronous (simplest) or async (matching the bounded-channel streaming pattern in output-infrastructure.md); (4) Whether `OutputError` mirrors `LoadError`'s variant structure or has a different taxonomy; (5) Thread-safety bounds (`Send` requirement) for writer types
- **Open questions**: Does the FlatBuffers policy writer need a different API pattern than the Parquet writers? How does the metadata/manifest chain (JSON/CSV) fit into the same writer abstraction? Should the output API provide an anchoring function like `write_results()` that orchestrates all 4 chains, or should each chain be independently callable? What serde derives are needed on which types?

## Dependencies

- **Blocked By**: ticket-028-define-simulation-result-type.md (output writer method signatures depend on `SimulationScenarioResult`)
- **Blocks**: None directly (but Epic 08 verification depends on GAP-020 resolution)

## Effort Estimate

**Points**: 4
**Confidence**: Low (will be re-estimated during refinement)
