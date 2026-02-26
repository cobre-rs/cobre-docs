# ticket-017 Synthesize Readiness Verdict

## Context

### Background

The implementation-readiness-audit plan has produced 16 audit reports across 4 epics, systematically assessing the Cobre specification corpus for implementation readiness. Epic 01 audited all 8 crates for API surface completeness (reports 001-008). Epic 02 triaged the 18 remaining Medium/Low gaps, verified cross-reference link integrity, and checked shared type consistency (reports 009-011). Epic 03 assessed implementation phase readiness for all 8 phases and audited 7 testing specs for adequacy (reports 012-014). Epic 04 traced data model chains end-to-end and audited HPC spec correctness (reports 015-016). This ticket reads all 16 reports plus the accumulated learnings and synthesizes them into the final readiness verdict.

### Relation to Epic

This is the third and final ticket in Epic 04 (Data Model, HPC, and Verdict) and the terminal ticket of the entire implementation-readiness-audit plan. It depends on all 16 preceding tickets. Its output is the single most important deliverable of the plan: the GO / CONDITIONAL GO / NO-GO recommendation that determines whether implementation can begin.

### Current State

The accumulated learnings through Epic 03 provide a pre-synthesis summary:

- **Crate completeness**: 8 crates audited, all CONDITIONAL PASS. Domain semantics strong; Rust API formalization and naming consistency are the systematic gaps. Completeness ranges from 47% (cobre-core) to 96% (ferrompi).
- **Gap triage**: 18 gaps triaged into 3 Resolve-Before-Coding (GAP-020, GAP-023, GAP-029), 12 Resolve-During-Phase, 3 Resolve-After-MVP.
- **Phase readiness**: 6 CONDITIONALLY READY, 1 READY (Phase 4 cobre-comm, Phase 6 cobre-sddp training), 1 NOT READY (Phase 7 simulation + output).
- **Testing adequacy**: 5 of 7 specs ADEQUATE, 2 ADEQUATE WITH GAPS (solver-interface-testing, backend-testing). 247 total named tests verified.
- **Pre-coding effort**: 9-15 working days across all 8 phases.
- **Most implementation-ready**: cobre-solver (79%), ferrompi (96%), cobre-comm (77%).
- **Least implementation-ready**: cobre-io output writer (GAP-020, 9 missing elements), cobre-core (47%, all entity types PARTIAL).

The learnings also provide specific recommendations for the verdict: present GAP-020 as the single most important pre-coding condition, provide resolution scheduling batches, include cross-reference index update conditions, and address the 100 section-prefix convention violations.

## Specification

### Requirements

Read all 16 audit reports and the accumulated learnings. Synthesize a readiness verdict using the following structure:

1. **Verdict determination**: Assign one of three verdicts:
   - **GO**: Begin Phase 1 coding immediately. No pre-coding spec work required.
   - **CONDITIONAL GO**: Begin coding after resolving specific, enumerated conditions. Each condition has an owner, deadline, estimated effort, and dependency.
   - **NO-GO**: Additional spec work of indeterminate scope required before coding can begin.

   The verdict thresholds are:
   - GO: zero Resolve-Before-Coding gaps, zero NOT READY phases, all testing specs ADEQUATE
   - CONDITIONAL GO: all Resolve-Before-Coding gaps have concrete resolution paths with bounded effort (total pre-coding effort under 20 working days), NOT READY phases have enumerated conditions that resolve them
   - NO-GO: any Resolve-Before-Coding gap without a concrete resolution path, or total pre-coding effort exceeds 20 working days, or a fundamental architectural gap is identified

2. **Conditions inventory**: For a CONDITIONAL GO verdict, enumerate every condition in a structured table with: condition ID, description, phase(s) blocked, estimated effort, resolution timing (Batch 1 = immediately, Batch 2 = during early phase coding), dependencies, and resolution owner (spec author).

3. **Resolution scheduling**: Group conditions into resolution batches based on the phase dependency graph. Batch 1 items can be resolved before any coding starts and have no dependencies on implementation. Batch 2 items should be resolved during early phase coding (e.g., GAP-020 during Phase 6) before the blocked phase begins.

4. **Risk assessment**: Identify the top 3 risks to successful implementation even after all conditions are met. For each risk, state the impact, likelihood, and mitigation.

5. **Crate readiness ranking**: Rank all 8 crates by implementation readiness, combining completeness percentage, gap severity, and phase position. This informs implementation sequencing decisions.

### Inputs/Props

The verdict consumes all prior reports and learnings:

- Epic 01 reports: `report-001-cobre-core.md` through `report-008-ferrompi.md` (8 per-crate completeness audits)
- Epic 02 reports: `report-009-gap-triage.md`, `report-010-crossref-integrity.md`, `report-011-shared-types.md`
- Epic 03 reports: `report-012-phase-1-4-readiness.md`, `report-013-phase-5-8-readiness.md`, `report-014-testing-adequacy.md`
- Epic 04 reports: `report-015-data-traceability.md`, `report-016-hpc-correctness.md`
- Accumulated learnings: `plans/implementation-readiness-audit/learnings/epic-03-summary.md`

All reports are in the plan directory tree under `plans/implementation-readiness-audit/`.

### Outputs/Behavior

A single Markdown report file: `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-017-readiness-verdict.md`

The report structure:

1. **Verdict** -- the GO / CONDITIONAL GO / NO-GO determination with a one-paragraph justification citing the decisive evidence
2. **Conditions inventory** -- structured table of all pre-coding conditions (only for CONDITIONAL GO)
3. **Resolution schedule** -- conditions grouped into batches with timeline and dependencies
4. **Phase readiness summary** -- consolidated 8-row table with per-phase verdict, blocking conditions, and effort; sourced from reports 012 and 013
5. **Crate readiness ranking** -- 8-row table ranking crates by implementation readiness
6. **Risk assessment** -- top 3 risks with impact, likelihood, and mitigation
7. **Audit coverage summary** -- what the 16 reports covered (dimensions audited, specs read, findings count, testing specs reviewed) to establish confidence in the verdict

### Error Handling

If any of the 16 input reports does not exist, note it as a gap in the audit coverage summary and reduce confidence accordingly. The verdict must still be rendered using available evidence.

## Acceptance Criteria

- [ ] Given the report file `report-017-readiness-verdict.md` exists, when opened, then section 1 contains exactly one verdict from the set {GO, CONDITIONAL GO, NO-GO} with a justification paragraph that cites at least 3 specific report numbers as evidence
- [ ] Given a CONDITIONAL GO verdict, when the conditions inventory is reviewed, then every condition has all 6 fields populated (ID, description, phase blocked, effort, timing batch, dependencies) and the total effort across all conditions is stated
- [ ] Given the resolution schedule, when reviewed, then conditions are grouped into exactly 2 batches (Batch 1: resolve immediately; Batch 2: resolve during early phase coding) and each batch states its total effort and which phases are unblocked upon completion
- [ ] Given the phase readiness summary table, when reviewed, then it contains exactly 8 rows (one per phase) with verdicts that are consistent with reports 012 and 013 (no phase verdict contradicts the source reports)
- [ ] Given the audit coverage summary, when reviewed, then it states the total number of reports consumed (16), total spec files read across the audit, and total findings across all reports

## Implementation Guide

### Suggested Approach

1. Read the accumulated learnings (`learnings/epic-03-summary.md`) first -- it provides a pre-synthesized summary of Epics 01-03 findings, including per-phase verdicts, gap classifications, and pre-coding effort estimates
2. Read reports 015 and 016 (the two new Epic 04 reports) to integrate data model traceability and HPC correctness findings
3. Compile the phase readiness summary by transcribing verdicts from reports 012 and 013 into a single 8-row table
4. Compile the conditions inventory by extracting all Resolve-Before-Coding gaps (from report-009), all phase-level blocking conditions (from reports 012-013), and any new blocking findings from reports 015-016
5. Apply the verdict thresholds: check for zero-resolution-path gaps, total pre-coding effort, and fundamental architectural gaps. The accumulated learnings already estimate 9-15 working days total, which is under the 20-day NO-GO threshold.
6. Group conditions into Batch 1 (no dependencies, resolvable immediately) and Batch 2 (depends on early phase implementation)
7. Rank crates by implementation readiness using completeness percentage from Epic 01 reports, gap severity from report-009, and phase position from reports 012-013
8. Identify top 3 risks from the pattern analysis across all reports
9. Compile the audit coverage summary with counts of reports, specs, and findings

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-017-readiness-verdict.md` (new file, the sole deliverable)

### Patterns to Follow

- Follow the report format established in Epics 01-03: title with report number, date, scope, evidence sources
- The verdict justification must cite specific report numbers (e.g., "report-013 section 4 assigns Phase 7 a NOT READY verdict") rather than making unsupported claims
- Use the resolution scheduling recommendation from the Epic 03 learnings: Batch 1 = GAP-023 + cross-spec fixes + notation fixes + `patch_col_bounds` tests + `patch_rhs_bounds` rename; Batch 2 = GAP-020 + simulation types (during Phase 6, before Phase 7)
- The conditions inventory table format should match the format used in report-013 section 8.1 (pre-coding conditions inventory)

### Pitfalls to Avoid

- Do not re-analyze spec files -- the verdict synthesizes existing reports only. Every claim must cite a specific report and section.
- Do not downgrade a phase verdict from what reports 012/013 determined. The verdict can elevate concerns (e.g., noting a new finding from report-015 or 016) but must not contradict the source reports without explicit justification.
- Do not conflate Resolve-During-Phase gaps with blocking conditions. Only Resolve-Before-Coding gaps and phase-level blocking conditions appear in the conditions inventory. Resolve-During-Phase gaps are noted in the risk assessment if they accumulate in a single phase.
- Do not set the verdict to GO -- the existence of 3 Resolve-Before-Coding gaps (GAP-020, GAP-023, GAP-029) and 1 NOT READY phase (Phase 7) means the verdict cannot be GO by the threshold criteria. This is a guardrail, not a pre-judgment: the verdict determination must still follow the threshold logic, but if the evidence has not changed, the outcome is predetermined.

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket producing a Markdown report.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-audit-cobre-core-api-surface.md through ticket-016-audit-hpc-spec-correctness.md (all 16 preceding audit tickets)
- **Blocks**: None (this is the terminal ticket of the plan)

## Effort Estimate

**Points**: 3
**Confidence**: High
