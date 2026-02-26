# ticket-009 Triage Medium and Low Gaps for Phase 1 Impact

## Context

### Background

The spec gap inventory (`src/specs/overview/spec-gap-inventory.md`) currently shows 13 Medium-severity gaps (GAP-018 through GAP-030) and 5 Low-severity gaps (GAP-031 through GAP-035), plus 5 known performance risks. All 5 Blockers and all 15 High-severity gaps were resolved in the gap-resolution plan. Before coding begins, each remaining gap must be triaged: does it block Phase 1 coding, or can it be resolved during implementation?

### Relation to Epic

This is the first ticket in Epic 02. It provides the gap triage that feeds into the final readiness verdict (ticket-017). The triage classification determines whether additional gap resolution work is needed before coding starts.

### Current State

The 13 Medium gaps and 5 Low gaps are documented in `src/specs/overview/spec-gap-inventory.md` section 3 (detailed table) and section 4 (summary statistics). Each gap has: ID, Severity, Affected Crate(s), Spec File(s), Sections, Description, Resolution Path.

Medium gaps:

- GAP-018: Threading model (rayon vs std::thread) unspecified -- cobre-sddp
- GAP-019: Solver retry config parameters missing -- cobre-solver
- GAP-020: cobre-io output writer API unspecified -- cobre-io
- GAP-021: FlatBuffers .fbs schema not provided -- cobre-io
- GAP-022: PrecomputedPar Rust type unspecified -- cobre-stochastic
- GAP-023: Opening tree Rust type/ownership unspecified -- cobre-stochastic
- GAP-024: Cut activity tolerance default missing -- cobre-sddp
- GAP-025: Penalty priority ordering enforcement unspecified -- cobre-core, cobre-sddp
- GAP-026: Backward pass trial state distribution strategy unspecified -- cobre-sddp
- GAP-027: training.forward_passes default value missing -- cobre-cli
- GAP-028: Policy compatibility validation for warm-start -- cobre-sddp
- GAP-029: Cross-reference validation checklist incomplete -- (cross-cutting)
- GAP-030: TrajectoryRecord data structure unspecified -- cobre-sddp

Low gaps:

- GAP-031: Stage definition overlapping fields -- cobre-core
- GAP-032: Event channel type (broadcast vs crossbeam) -- cobre-core
- GAP-033: Generic bounds inconsistency (Communicator + SharedMemoryProvider) -- cobre-comm
- GAP-034: Cut pool forward_passes immutability confirmation -- cobre-sddp
- GAP-035: Example config.json mismatched defaults -- cobre-cli

## Specification

### Requirements

For each of the 18 remaining gaps, produce a triage assessment with the following fields:

1. **Gap ID and Description** (from the inventory)
2. **Affected Implementation Phase(s)**: Which of the 8 phases does this gap affect?
3. **Critical Path Assessment**: Is this gap on the critical path for the affected phase?
4. **Classification**: One of:
   - **Resolve-Before-Coding**: The gap blocks the start of coding for its affected phase. Must be resolved in a pre-implementation gap resolution plan.
   - **Resolve-During-Phase**: The gap affects its phase but can be resolved as an implementation decision during coding (e.g., choosing a default value, selecting a library).
   - **Resolve-After-MVP**: The gap does not affect the minimal viable solver and can be deferred entirely.
5. **Rationale**: Why this classification was chosen, citing specific evidence from the spec corpus.
6. **Resolution Effort**: Estimated effort to resolve (trivial: <1 hour, small: 1-4 hours, medium: 1-2 days, large: >2 days).

Additionally, produce:

- A summary table of all 18 gaps with their classifications
- A count of Resolve-Before-Coding gaps per implementation phase
- A recommendation on whether a pre-implementation gap resolution effort is needed

### Inputs/Props

- `src/specs/overview/spec-gap-inventory.md` (sections 3-7)
- `src/specs/overview/implementation-ordering.md` (sections 4-5)
- All spec files referenced in the gap descriptions (to verify current state after gap-resolution)

### Outputs/Behavior

A Markdown triage report written to `plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-009-gap-triage.md` containing:

1. **Per-Gap Triage Table**: 18 rows with columns: Gap ID, Description, Phase, Critical Path, Classification, Effort, Rationale
2. **Summary Statistics**: Counts by classification and by phase
3. **Recommendation**: Whether a pre-implementation gap resolution plan is needed, and if so, which gaps it should cover
4. **Known Performance Risks Assessment**: For each of the 5 known performance risks, assess whether it affects the minimal viable solver

### Error Handling

- If a gap's referenced spec file has changed since the gap was logged (e.g., due to gap-resolution work), note the change and re-assess the gap severity
- If a gap has been partially resolved (some but not all aspects addressed), classify the remaining aspects separately

## Acceptance Criteria

- [ ] Given the 13 Medium gaps, when each is triaged, then every gap has a Classification (Resolve-Before-Coding, Resolve-During-Phase, or Resolve-After-MVP) with cited rationale
- [ ] Given the 5 Low gaps, when each is triaged, then every gap has a Classification with cited rationale
- [ ] Given GAP-018 (threading model), when its impact on Phase 6 (cobre-sddp training) is assessed, then the triage explains whether rayon vs std::thread choice blocks coding or is an implementation decision
- [ ] Given GAP-020 (output writer API) and GAP-021 (FlatBuffers schema), when their impact on Phase 7 (simulation + output) is assessed, then the triage explains whether these block Phase 7 coding
- [ ] Given GAP-022 (PrecomputedPar) and GAP-023 (opening tree), when their impact on Phase 5 (cobre-stochastic) is assessed, then the triage explains whether these types need spec-level definition or can be designed during implementation
- [ ] Given the 5 known performance risks, when each is assessed, then the report documents whether it affects minimal viable coding or is a post-MVP optimization concern
- [ ] Given the triage report, when all classifications are tallied, then the summary statistics match the per-gap classifications
- [ ] Given the triage results, when Resolve-Before-Coding gaps exist, then the recommendation specifies a concrete resolution plan with estimated total effort

## Implementation Guide

### Suggested Approach

1. Read `src/specs/overview/spec-gap-inventory.md` sections 3-7 to get the full gap list and resolution log
2. For each gap, read the referenced spec file(s) and section(s) to understand the current state
3. Cross-reference with `src/specs/overview/implementation-ordering.md` section 5 to determine which phase the gap affects
4. Apply the classification criteria:
   - If the gap means an implementer cannot write a function signature or type definition -> Resolve-Before-Coding
   - If the gap means an implementer must make a choice but the choice is local and reversible -> Resolve-During-Phase
   - If the gap affects a feature not in the minimal viable solver -> Resolve-After-MVP
5. Assess the 5 known performance risks separately (they are not gaps but merit assessment)
6. Compile the summary and recommendation

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-009-gap-triage.md`

### Patterns to Follow

- For each gap, cite the spec file and section that the gap references
- For Resolve-During-Phase gaps, note which implementation phase should resolve it
- For Resolve-Before-Coding gaps, estimate the resolution effort

### Pitfalls to Avoid

- Do not resolve gaps -- this ticket only triages them. Resolution is a separate activity.
- Do not re-assess Blocker or High gaps (they are already resolved). Focus only on Medium and Low.
- Do not classify a gap as Resolve-After-MVP simply because it is Low severity. Severity and timing are independent dimensions.
- GAP-029 (cross-reference validation checklist) is meta-level. It affects the audit process itself, not coding. Triage it accordingly.

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-017 (readiness verdict uses the triage results)

## Effort Estimate

**Points**: 3
**Confidence**: High
