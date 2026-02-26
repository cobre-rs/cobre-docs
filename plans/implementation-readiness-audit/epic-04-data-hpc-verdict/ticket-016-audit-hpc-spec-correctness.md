# ticket-016 Audit HPC Spec Correctness

## Context

### Background

The implementation-readiness-audit plan has completed three epics. Among the 8 per-crate audits in Epic 01, two targeted HPC crates directly: report-006 (cobre-comm, 77% COMPLETE with strong trait contracts) and report-008 (ferrompi, 96% COMPLETE with 0 MISSING items). Epic 03 assessed Phase 3 (ferrompi + cobre-solver) as CONDITIONALLY READY with 4 conditions and Phase 4 (cobre-comm) as READY with 0 conditions. However, no ticket has yet verified the HPC specs for internal correctness at the parameter level: whether MPI collective operations are specified with exact type parameters, whether threading model references are consistent across specs, whether NUMA/cache guidance is actionable, and whether the ferrompi API spec matches the real crate's API for the operations used.

### Relation to Epic

This is the second of three tickets in Epic 04 (Data Model, HPC, and Verdict). It executes in parallel with ticket-015 (Data Model Traceability). Both feed ticket-017 (Readiness Verdict), which synthesizes all 16 audit reports into the final GO / CONDITIONAL GO / NO-GO recommendation.

### Current State

The HPC spec corpus spans 15 files in `src/specs/hpc/`:

- **Core trait specs**: `communicator-trait.md` (Communicator + SharedMemoryProvider traits), `backend-ferrompi.md` (production MPI backend), `backend-local.md`, `backend-tcp.md`, `backend-shm.md` (alternative backends), `backend-selection.md` (compile-time selection), `backend-testing.md` (conformance tests)
- **Parallelism and communication**: `hybrid-parallelism.md` (MPI+OpenMP architecture), `communication-patterns.md` (collective operations and data payloads), `work-distribution.md` (trajectory assignment), `synchronization.md` (barrier and ordering protocols)
- **Memory and performance**: `memory-architecture.md` (data ownership, per-rank budget, NUMA), `shared-memory-aggregation.md` (SharedRegion usage, opening tree, cut pool sharing)
- **Deployment**: `slurm-deployment.md` (job scripts, scaling), `checkpointing.md` (checkpoint/resume protocol)

Key findings from earlier epics:

- Report-006 (cobre-comm): 77% COMPLETE, 1 High-severity structural gap (BoxedRegion vs enum dispatch for SharedMemoryProvider), all 3 traits fully specified with method signatures
- Report-008 (ferrompi): 96% COMPLETE, 0 MISSING items, 2 High-severity stale API names (`split_shared_memory()` should be `split_shared()` in 4 files)
- Epic-03 learnings: ferrompi is the highest-completeness crate (96%) but Phase 3 still has 4 conditions, showing that naming consistency and crate ownership gaps are invisible to completeness percentage
- Epic-03 learnings: "GAP-018 (threading model) is Resolve-During-Phase -- the choice between rayon and std::thread is local to cobre-sddp"

## Specification

### Requirements

Audit the HPC spec corpus across four correctness dimensions:

1. **MPI collective operation parameter specificity**: For every MPI collective invocation in the spec corpus (allgatherv, allreduce, broadcast, barrier), verify that the specification includes: (a) the Rust generic type parameter `T: CommData`, (b) the buffer sizes or buffer size formulas, (c) the reduction operation type where applicable (ReduceOp::Sum), and (d) counts/displacements formulas for allgatherv. Assess whether each invocation has enough parameter detail for an implementer to write the call without guessing buffer sizes.

2. **Threading model consistency**: Verify that all references to intra-rank threading across the spec corpus are consistent. Check whether specs consistently reference OpenMP via C FFI (the approved threading model per `hybrid-parallelism.md` SS1.1) or whether some specs reference rayon, std::thread, or other threading abstractions. Flag any inconsistency as a finding.

3. **NUMA and cache-awareness actionability**: Assess whether the NUMA/cache guidance in `memory-architecture.md` and `shared-memory-aggregation.md` is concrete enough for implementation. Specifically: are struct field layouts prescribed for cache locality? Are alignment constraints specified (e.g., 64-byte cache line alignment for shared data)? Are hot-path allocation avoidance requirements tied to specific functions or code paths? Classify guidance as ACTIONABLE (specific layout, specific alignment, specific code path) or ASPIRATIONAL (general principle without implementation-level detail).

4. **ferrompi API surface match**: Verify that every ferrompi API call referenced in the spec corpus (`backend-ferrompi.md`, `hybrid-parallelism.md` SS1.2, `shared-memory-aggregation.md`) uses a method name and signature that matches the ferrompi crate's documented API. Cross-reference report-008 findings (2 High-severity stale names) and verify whether additional stale references exist beyond those already identified.

### Inputs/Props

The audit reads HPC spec files directly and cross-references prior reports:

- HPC specs: all 15 files in `src/specs/hpc/`
- Architecture specs that reference HPC: `src/specs/architecture/training-loop.md` (forward/backward pass parallelism), `src/specs/architecture/solver-workspaces.md` (thread-local workspace), `src/specs/architecture/cut-management-impl.md` (cut synchronization wire format)
- Epic 01 reports: `report-006-cobre-comm.md`, `report-008-ferrompi.md`
- Epic 03 report: `report-012-phase-1-4-readiness.md` (Phase 3 and Phase 4 assessments)

### Outputs/Behavior

A single Markdown report file: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-016-hpc-correctness.md`

The report structure:

1. **Executive summary** -- one-paragraph overview with per-dimension verdict and the most significant finding
2. **MPI collective parameter audit** -- per-operation inventory (allgatherv, allreduce, broadcast, barrier) with every invocation site, its parameter specificity level, and gaps
3. **Threading model consistency audit** -- inventory of all threading references across specs, consistency assessment, and any conflicting references
4. **NUMA and cache-awareness assessment** -- per-guideline classification as ACTIONABLE vs ASPIRATIONAL with specific evidence
5. **ferrompi API surface match** -- per-method comparison of spec references vs report-008 findings, identification of any new stale references
6. **Summary table** -- dimension, verdict (SUFFICIENT / SUFFICIENT WITH GAPS / INSUFFICIENT), finding count, blocking findings count

### Error Handling

If a spec file does not exist at the expected path, note it as missing and skip it. Do not fail the entire audit.

## Acceptance Criteria

- [ ] Given the report file `report-016-hpc-correctness.md` exists, when opened, then it contains exactly 6 sections (executive summary, MPI audit, threading audit, NUMA/cache assessment, ferrompi API match, summary table)
- [ ] Given the MPI collective parameter audit section, when reviewed, then it inventories every allgatherv invocation in the spec corpus with the specific file and section where it appears, and for each invocation states whether buffer size formulas are present
- [ ] Given the threading model consistency section, when reviewed, then it lists every file that references an intra-rank threading technology (OpenMP, rayon, std::thread) and states whether the reference is consistent with the approved model in `hybrid-parallelism.md` SS1.1
- [ ] Given the ferrompi API surface match section, when reviewed, then it confirms or extends the 2 stale API name findings from report-008 (`split_shared_memory()` -> `split_shared()`) and identifies whether additional stale references exist
- [ ] Given the summary table, when reviewed, then it contains exactly 4 rows (one per dimension) with a verdict from the set {SUFFICIENT, SUFFICIENT WITH GAPS, INSUFFICIENT}

## Implementation Guide

### Suggested Approach

1. Read `communicator-trait.md` to extract the canonical trait method signatures (allgatherv, allreduce, broadcast, barrier) with their type parameters
2. Search all 15 HPC specs and the 3 architecture specs for every invocation or reference to these collective operations. For each, record: file, section, operation, type parameter, buffer size formula (if present), counts/displacements (if applicable)
3. Read `hybrid-parallelism.md` SS1.1 to establish the approved threading model (OpenMP via C FFI). Then search all specs for references to rayon, std::thread, OpenMP, or other threading abstractions. Record each with file, section, and the technology referenced.
4. Read `memory-architecture.md` and `shared-memory-aggregation.md` for NUMA/cache guidance. For each guideline, classify as ACTIONABLE (provides specific struct layout, alignment value, or code path) or ASPIRATIONAL (states a principle without implementation detail).
5. Read `backend-ferrompi.md` for the ferrompi API surface. Cross-reference report-008 for the 2 known stale names. Search all specs for ferrompi method name references and verify each against the canonical names in `backend-ferrompi.md`.
6. Compile the summary table with per-dimension verdicts.

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-016-hpc-correctness.md` (new file, the sole deliverable)

### Patterns to Follow

- Follow the report format established in Epics 01-03: title with report number, date, scope, evidence sources, clear section numbering
- Use the three-level verdict scale for dimensions (SUFFICIENT / SUFFICIENT WITH GAPS / INSUFFICIENT)
- Cross-reference existing findings from report-006 and report-008 rather than re-discovering them
- Cite specific file paths and section numbers for every finding

### Pitfalls to Avoid

- Do not re-audit the cobre-comm or ferrompi crate API surfaces -- that was done in Epic 01 (reports 006 and 008). This ticket audits HPC spec internal correctness (parameter specificity, consistency, actionability), not API completeness.
- Do not audit the `backend-local.md`, `backend-tcp.md`, or `backend-shm.md` specs for MPI parameter specificity -- they are non-MPI backends. Only audit them for threading model consistency and naming consistency.
- Do not assess the algorithmic correctness of the SDDP communication pattern (that is an SDDP domain concern, not an HPC spec correctness concern). Focus on whether the MPI operations are specified with enough detail to implement.
- The `split_shared_memory()` -> `split_shared()` stale name was already identified in report-008. Confirm it is still present but do not double-count it as a new finding.

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket producing a Markdown report.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-006-audit-cobre-comm-api-surface.md (cobre-comm API completeness), ticket-008-audit-ferrompi-api-surface.md (ferrompi API completeness)
- **Blocks**: ticket-017-synthesize-readiness-verdict.md (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: High
