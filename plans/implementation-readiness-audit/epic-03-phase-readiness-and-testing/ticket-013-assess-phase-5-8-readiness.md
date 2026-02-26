# ticket-013 Assess Implementation Phase 5-8 Readiness

## Context

### Background

Phases 5-8 represent the high-complexity, deep-dependency tail of the implementation ordering: Phase 5 (cobre-stochastic scenario generation), Phase 6 (cobre-sddp training loop with forward/backward pass and cuts), Phase 7 (simulation pipeline + cobre-io output writing), and Phase 8 (cobre-cli lifecycle orchestration). These phases are the most demanding from a specification standpoint because they integrate multiple crates and have the deepest dependency chains. Epic 01 and Epic 02 findings show that these phases contain the least-specified crate (cobre-io output writing at 0% for writer API), the most gap-dense crate (cobre-sddp with 8 Resolve-During-Phase gaps in Phase 6), and the only Resolve-Before-Coding gap that requires new API design (GAP-020, output writer API, blocking Phase 7).

### Relation to Epic

This is the second of three tickets in Epic 03 (Phase Readiness and Testing). It covers the algorithm and integration phases (Phase 5: cobre-stochastic, Phase 6: cobre-sddp training, Phase 7: simulation + output, Phase 8: cobre-cli). It complements ticket-012 (Phases 1-4) and feeds the go/no-go readiness verdict in ticket-017 (Epic 04).

### Current State

The following Epic 01 and Epic 02 reports provide the input evidence:

- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-003-cobre-stochastic.md` -- `PrecomputedPar` MISSING (GAP-022), opening tree type MISSING (GAP-023), `StageRng` MISSING, Cholesky storage type MISSING; `SamplingScheme` enum and methods COMPLETE
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-005-cobre-sddp.md` -- `TrainingConfig` MISSING, `train` function signature PARTIAL, `TrajectoryRecord` MISSING (GAP-030), simulation pipeline at 33% PARTIAL+MISSING; trait enum dispatch 97% COMPLETE
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-002-cobre-io.md` -- output writer API completely absent (GAP-020), all output types MISSING
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-007-cobre-cli.md` -- CLI argument struct PARTIAL, execution phase enum PARTIAL, exit code mapping COMPLETE, phase alignment table COMPLETE
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-009-gap-triage.md` -- gap triage with per-phase classification (section 3.2): Phase 5 has 2 gaps (1 Resolve-Before-Coding: GAP-023), Phase 6 has 8 gaps (0 Resolve-Before-Coding), Phase 7 has 3 gaps (1 Resolve-Before-Coding: GAP-020), Phase 8 has 2 gaps (0 Resolve-Before-Coding)

The implementation ordering document is at `/home/rogerio/git/cobre-docs/src/specs/overview/implementation-ordering.md` (section 5, Phases 5-8).

## Specification

### Requirements

For each of Phases 5-8, assess the same five dimensions as ticket-012 and assign a per-phase verdict:

1. **Spec reading list completeness**: Does the phase's reading list cover all specs needed to produce the testable intermediate?
2. **Testable intermediate achievability**: Can the stated "what becomes testable" be implemented given the current spec completeness? Cross-reference the crate audit reports.
3. **Gap impact on phase**: Using report-009 section 3.2, list all gaps affecting this phase with classifications. Flag Resolve-Before-Coding gaps as blocking conditions.
4. **Implicit knowledge gaps**: Identify domain assumptions, ordering constraints, or integration patterns not documented in specs that an implementer would need.
5. **Cross-phase dependency risks**: For Phase 6 (depends on all of Phases 1-5), assess whether the multi-crate integration creates coordination risk. For Phase 7, assess the dual-crate risk (cobre-sddp simulation + cobre-io output). For Phase 8, assess whether the MPI lifecycle documentation is sufficient for an implementer unfamiliar with MPI.

Per-phase verdicts use the same three-level scale as ticket-012:

- **READY**: All testable intermediates achievable with at most Resolve-During-Phase gaps
- **CONDITIONALLY READY**: Testable intermediates achievable after resolving specific, enumerated pre-coding conditions
- **NOT READY**: Fundamental spec gaps block the testable intermediate

Additionally, for Phases 5-8 the report must include a **simulation pipeline deep-dive** (as recommended in the Epic 02 learnings: "Flag the simulation pipeline (cobre-sddp Subsystem F, 33% PARTIAL+MISSING) for a dedicated adequacy sub-assessment").

### Inputs/Props

The report consumes only pre-existing files:

- Epic 01 reports: `report-003-cobre-stochastic.md`, `report-005-cobre-sddp.md`, `report-002-cobre-io.md` (output portion), `report-007-cobre-cli.md`
- Epic 02 reports: `report-009-gap-triage.md`
- Implementation ordering: `src/specs/overview/implementation-ordering.md` section 5 (Phases 5-8)
- Accumulated learnings: `plans/implementation-readiness-audit/learnings/epic-02-summary.md`

### Outputs/Behavior

A single Markdown report file: `plans/implementation-readiness-audit/epic-03-phase-readiness-and-testing/report-013-phase-5-8-readiness.md`

The report structure:

1. **Executive summary** -- one-paragraph overview with 4 per-phase verdicts
2. **Phase 5 assessment** (cobre-stochastic) -- 5 dimensions, verdict, conditions if any
3. **Phase 6 assessment** (cobre-sddp training) -- 5 dimensions, verdict, conditions if any, notation fix requirements
4. **Phase 7 assessment** (simulation + output) -- 5 dimensions, verdict, conditions if any, simulation pipeline deep-dive
5. **Phase 8 assessment** (cobre-cli) -- 5 dimensions, verdict, conditions if any, MPI-unfamiliar implementer assessment
6. **Simulation pipeline deep-dive** -- per-capability assessment of the simulation pipeline at 33% PARTIAL+MISSING, identifying which capabilities are specified, which are implicit, and which are absent
7. **Cross-phase summary table** -- phase, verdict, blocking conditions count, Resolve-During-Phase count, implicit gaps count
8. **Pre-coding conditions inventory** -- consolidated list of all conditions that must be met before a phase can begin, with estimated effort and recommended resolution timing (e.g., "resolve during Phase 5 implementation, before Phase 6 begins")

### Error Handling

If a crate audit report referenced above does not exist, note it as a data gap in the report and assess the phase using only the available evidence.

## Acceptance Criteria

- [ ] Given the report file `report-013-phase-5-8-readiness.md` exists, when opened, then it contains exactly 8 sections (executive summary + 4 phase assessments + simulation pipeline deep-dive + cross-phase summary table + pre-coding conditions inventory)
- [ ] Given the Phase 5 assessment, when the testable intermediate is evaluated, then it accounts for GAP-023 (opening tree Rust type, Resolve-Before-Coding) and determines whether the opening tree's crate boundary nature blocks Phase 5 start or only blocks Phase 6 consumption
- [ ] Given the Phase 7 assessment, when GAP-020 (output writer API) is evaluated, then the report identifies the specific missing API elements (writer type, method signatures, thread-safety guarantees, error type) and estimates whether the gap is resolvable during Phase 6 implementation as recommended in the Epic 02 learnings
- [ ] Given the simulation pipeline deep-dive section, when reviewed, then it enumerates each simulation capability from report-005 Subsystem F and classifies each as COMPLETE, PARTIAL, or MISSING with evidence citations
- [ ] Given the cross-phase summary table, when reviewed, then the verdict column uses exactly one of READY, CONDITIONALLY READY, or NOT READY per phase, and all blocking conditions are enumerated with effort estimates and recommended resolution timing

## Implementation Guide

### Suggested Approach

1. Read `implementation-ordering.md` section 5 and extract Phase 5-8 attributes (crates, testable intermediate, blocked by, spec reading list)
2. For each phase, load the corresponding crate audit report(s) and extract completeness data
3. Cross-reference report-009 section 3.2 to pull all gaps assigned to each phase
4. For Phase 6, pay special attention to the 8 Resolve-During-Phase gaps: assess whether their cumulative effect (even though none is individually blocking) creates aggregate risk
5. For Phase 7, produce the simulation pipeline deep-dive by walking through report-005 Subsystem F items one by one
6. For Phase 8, assess the MPI lifecycle documentation by checking whether the phase alignment table in `cli-and-lifecycle.md` SS5.2a is sufficient for an implementer who knows Rust but not MPI
7. Compile the cross-phase summary table and pre-coding conditions inventory with resolution timing recommendations

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-03-phase-readiness-and-testing/report-013-phase-5-8-readiness.md` (new file, the sole deliverable)

### Patterns to Follow

- Follow the report format established in ticket-012 (report-012): same section structure, same verdict scale, same evidence citation style
- Use the Epic 02 learnings recommendations directly:
  - "Flag the simulation pipeline (cobre-sddp Subsystem F, 33% PARTIAL+MISSING) for a dedicated adequacy sub-assessment"
  - "Present GAP-020 (output writer API) as the highest-priority pre-coding condition"
  - "Include the notation fixes (F1, F2) as pre-Phase-6 conditions"

### Pitfalls to Avoid

- Do not re-audit the crate API surfaces -- consume the existing reports
- Do not assess Phases 1-4 -- that is ticket-012's scope
- Do not conflate GAP-023 (opening tree, Phase 5) with GAP-022 (`PrecomputedPar`, also Phase 5): GAP-023 is Resolve-Before-Coding because it crosses a crate boundary, while GAP-022 is Resolve-During-Phase because it is internal to cobre-stochastic
- GAP-021 (FlatBuffers schema) was already resolved in the spec per report-009 triage -- do not count it as a Phase 7 gap

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket producing a Markdown report.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-003, ticket-005, ticket-007 (per-crate audit reports for Phase 5-8 crates), ticket-009 (gap triage results)
- **Blocks**: ticket-017 (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: High
