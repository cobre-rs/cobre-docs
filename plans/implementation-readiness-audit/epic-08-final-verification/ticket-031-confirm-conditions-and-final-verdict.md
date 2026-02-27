# ticket-031 Confirm All 19 Conditions Resolved and Produce Final Verdict

## Context

### Background

Report-017 (Epic 04) issued a CONDITIONAL GO verdict with 19 conditions that must be resolved before their respective blocked phases begin coding. Epics 05-07 systematically resolved all 19 conditions: C-01 through C-04 and C-09 in Epic 05 (entity structs, validation, OpeningTree); C-05 through C-08, C-10 through C-12, C-15 through C-19 in Epic 06 (mechanical fixes); C-13 and C-14 in Epic 07 (serialization evaluation, simulation result type, output writer API). Additionally, Epic 07 discovered GAP-039 (scenario generation broadcast format, HIGH severity), which was added to the gap inventory but was NOT one of the original 19 conditions. This ticket must produce the definitive final verdict that either confirms the spec corpus is READY for implementation or identifies remaining blockers.

### Relation to Epic

This is the terminal ticket of Epic 08 (Final Verification) and of the entire implementation-readiness-audit plan. It consumes the cross-reference integrity findings from ticket-030 and produces the final readiness determination that supersedes the CONDITIONAL GO from report-017. The verdict is the ultimate deliverable of the 31-ticket, 8-epic audit plan.

### Current State

- All 19 conditions from report-017 section 2 have been resolved across Epics 05-07 (see learnings/epic-07-summary.md "Conditions Fully Resolved" section for the complete mapping)
- The gap inventory (spec-gap-inventory.md) shows: 5 Blockers resolved, 15 High resolved + 1 High unresolved (GAP-039), 3 Medium resolved + 10 Medium unresolved, 5 Low unresolved. Total: 39 gaps, 16 unresolved.
- GAP-039 (scenario generation broadcast format) is HIGH severity, affecting cobre-stochastic and cobre-sddp. It was discovered during ticket-029 when specifying the output writer API. The gap describes an unspecified per-iteration hot-path MPI broadcast format for scenario innovation noise. The resolution path suggests raw `#[repr(C)]` f64 arrays matching the cut wire format pattern. This is a Phase 5 concern (cobre-stochastic implementation).
- Ticket-030 findings (cross-reference integrity) will be available as input to this ticket.

## Specification

### Requirements

1. **Condition-by-condition audit**: For each of the 19 conditions from report-017 section 2, verify resolution by citing the specific ticket, file, and section where the condition was resolved. Produce a 19-row resolution table with columns: Condition ID, Description (abbreviated), Resolving Ticket, Resolving File/Section, Verification Status (CONFIRMED / UNCONFIRMED).

2. **GAP-039 assessment**: Explicitly analyze GAP-039 to determine whether it constitutes a new condition blocking the READY verdict. The assessment must answer:
   - Which implementation phase does GAP-039 block? (Phase 5: cobre-stochastic)
   - Can Phase 1-4 coding proceed without resolving GAP-039? (Yes -- GAP-039 affects scenario broadcast, which is Phase 5)
   - Is GAP-039 a Blocker (cannot write correct code) or a Resolve-During-Phase gap? (The broadcast format can be specified during Phase 5 implementation, before the code that uses it is written)
   - Does GAP-039 change the overall READY verdict for the spec corpus? (Assess whether it meets the threshold for downgrading from READY)

3. **Ticket-030 findings integration**: Incorporate any findings from the cross-reference integrity report (report-030). If ticket-030 discovered broken links or stale references:
   - Assess whether each finding constitutes a new condition
   - If yes, add it to the conditions inventory
   - If no, document why it does not block readiness

4. **Phase readiness re-assessment**: Update the Phase Readiness Summary table from report-017 section 4 to reflect the resolved conditions. Each of the 8 phases should now have an updated verdict:
   - Phases that were CONDITIONALLY READY and whose conditions are all resolved -> READY
   - Phase 7 (NOT READY) -> READY (C-13, C-14 resolved)
   - Any phase affected by new findings -> assessed accordingly

5. **Gap inventory verification**: Verify that spec-gap-inventory.md correctly reflects the current state:
   - GAP-020, GAP-023, GAP-029 should be marked Resolved (these were the 3 Resolve-Before-Coding gaps)
   - GAP-039 should be present as HIGH unresolved
   - Summary statistics (section 6) should match the detailed table counts

6. **Final verdict**: Produce one of:
   - **READY**: All 19 original conditions confirmed resolved, no new blocking conditions from ticket-030 findings or GAP-039, all 8 phases assessable as READY or READY WITH KNOWN GAPS
   - **STILL CONDITIONAL**: One or more conditions remain unresolved, or new blocking conditions were discovered

7. **Deliverables**:
   - Final verdict report at `plans/implementation-readiness-audit/epic-08-final-verification/report-031-final-verdict.md`
   - Updated `src/specs/overview/spec-gap-inventory.md` if any gap statuses need correction (verify before editing)

### Inputs/Props

- Report-017 (readiness verdict with 19 conditions): `plans/implementation-readiness-audit/epic-04-data-hpc-verdict/report-017-readiness-verdict.md`
- Epic 07 learnings (condition resolution mapping): `plans/implementation-readiness-audit/learnings/epic-07-summary.md`
- Cross-reference integrity report: `plans/implementation-readiness-audit/epic-08-final-verification/report-030-crossref-integrity.md`
- Current gap inventory: `src/specs/overview/spec-gap-inventory.md`
- Key resolved-condition files to spot-check:
  - `src/specs/data-model/internal-structures.md` (C-01, C-02, C-03: entity structs, EntityId)
  - `src/specs/architecture/input-loading-pipeline.md` (C-04: validation checklist SS2.6; C-13: postcard SS6)
  - `src/specs/architecture/solver-interface-testing.md` (C-05: patch_row_bounds)
  - `src/specs/architecture/solver-abstraction.md` (C-06: StageTemplate ownership)
  - `src/specs/hpc/backend-ferrompi.md` (C-07: Mpi guard; C-08: split_shared)
  - `src/specs/architecture/scenario-generation.md` (C-09: OpeningTree)
  - `src/specs/math/cut-management.md` (C-10: P_h notation)
  - `src/specs/architecture/training-loop.md` (C-10: pi^lag; C-11: threading)
  - `src/specs/hpc/work-distribution.md` (C-12: usize)
  - `src/specs/architecture/simulation-architecture.md` (C-14: SimulationScenarioResult, fn simulate)
  - `src/specs/data-model/output-infrastructure.md` (C-13: output writer API SS6)
  - `src/specs/hpc/slurm-deployment.md` (C-15: cobre run)
  - `src/specs/configuration/configuration-reference.md` (C-16, C-17: field names, training.enabled)
  - `src/specs/cross-reference-index.md` (C-18: backend-testing.md, ecosystem-guidelines.md)
  - `src/specs/hpc/memory-architecture.md` (C-19: cobre_comm::slurm)

### Outputs/Behavior

A report file at `plans/implementation-readiness-audit/epic-08-final-verification/report-031-final-verdict.md` containing:

- Section 1: Verdict (READY or STILL CONDITIONAL, with 2-3 sentence justification)
- Section 2: Condition Resolution Table (19 rows + GAP-039 assessment row)
- Section 3: Phase Readiness Summary (updated 8-phase table with new verdicts)
- Section 4: GAP-039 Analysis (detailed assessment of whether it blocks READY)
- Section 5: Ticket-030 Findings Integration (cross-reference findings assessment)
- Section 6: Gap Inventory Verification (confirmation that spec-gap-inventory.md is accurate)
- Section 7: Audit Plan Summary (aggregate statistics: 31 tickets, 8 epics, key metrics)

### Error Handling

- If report-030 is not found, note this in Section 5 and proceed with the verdict based on the condition resolution audit alone. Flag that cross-reference verification was not available.
- If a condition cannot be verified (the resolving file does not contain the expected content), mark it UNCONFIRMED and assess whether it blocks the verdict.

### Out of Scope

- Resolving GAP-039 (this ticket assesses it, does not resolve it)
- Fixing any issues found in spec-gap-inventory.md beyond gap status corrections
- Updating the cross-reference index (that would be a separate ticket)
- Re-running the full 503-item completeness audit from Epic 01
- Producing a new implementation ordering or schedule

## Acceptance Criteria

- [ ] Given the 19 conditions from report-017 section 2, when each condition is verified against the resolving ticket's file changes, then a 19-row resolution table exists in report Section 2 where every row cites the specific ticket ID, file path, and section that resolves the condition
- [ ] Given GAP-039 in spec-gap-inventory.md, when the gap is analyzed against the implementation phase schedule, then report Section 4 contains an explicit determination of whether GAP-039 blocks Phase 1-4 coding (expected: NO) and whether it constitutes a pre-implementation blocker (expected: NO -- it is a Resolve-During-Phase gap for Phase 5)
- [ ] Given the cross-reference integrity findings from report-030, when the findings are integrated, then report Section 5 documents each finding and classifies it as blocking or non-blocking for the READY verdict
- [ ] Given the updated phase verdicts, when the Phase Readiness Summary is produced, then all 8 phases have updated verdicts in report Section 3, with the previously CONDITIONALLY READY phases upgraded to READY and the previously NOT READY Phase 7 upgraded to READY
- [ ] Given the gap inventory at `src/specs/overview/spec-gap-inventory.md`, when the summary statistics in section 6 are verified against the detailed table row counts, then report Section 6 confirms the counts match or documents any discrepancies that need correction
- [ ] Given all inputs, when the final verdict is produced, then report Section 1 contains either READY or STILL CONDITIONAL with a justification that references the condition resolution table and GAP-039 analysis
- [ ] Given the completed report, when written to `plans/implementation-readiness-audit/epic-08-final-verification/report-031-final-verdict.md`, then the file contains all 7 sections with substantive content in each

## Implementation Guide

### Suggested Approach

1. **Read report-030** to understand cross-reference findings before starting the verdict.
2. **Build the condition resolution table** by reading each condition from report-017 section 2 and mapping it to the resolving ticket from the epic-07 learnings:
   - C-01/C-02/C-03 -> ticket-018, ticket-019 (internal-structures.md SS1-SS12)
   - C-04 -> ticket-020 (input-loading-pipeline.md SS2.6)
   - C-05 -> ticket-022 (solver-interface-testing.md)
   - C-06 -> ticket-023 (solver-abstraction.md)
   - C-07 -> ticket-023 (backend-ferrompi.md)
   - C-08 -> ticket-023 (backend-ferrompi.md, communication-patterns.md, communicator-trait.md)
   - C-09 -> ticket-021 (scenario-generation.md)
   - C-10 -> ticket-024 (training-loop.md, cut-management.md)
   - C-11 -> ticket-024 (training-loop.md)
   - C-12 -> ticket-024 (work-distribution.md)
   - C-13 -> ticket-027 + ticket-029 (input-loading-pipeline.md SS6, output-infrastructure.md SS6)
   - C-14 -> ticket-028 (simulation-architecture.md SS3.4)
   - C-15 -> ticket-025 (slurm-deployment.md)
   - C-16 -> ticket-025 (configuration-reference.md)
   - C-17 -> ticket-025 (configuration-reference.md)
   - C-18 -> ticket-026 (cross-reference-index.md)
   - C-19 -> ticket-026 (slurm-deployment.md, memory-architecture.md)
3. **Spot-check each condition** by reading the specific section in the resolving file to confirm the content matches the condition requirement. This does NOT require re-reading entire files -- target the specific section.
4. **Analyze GAP-039**: Read the gap entry in spec-gap-inventory.md and the referenced sections in scenario-generation.md and training-loop.md. Determine:
   - The gap is about scenario innovation noise broadcast format (Phase 5, cobre-stochastic)
   - The resolution path (raw #[repr(C)] f64 arrays) is well-defined and bounded (~1 day effort)
   - Phase 1-4 do not touch scenario broadcast
   - Conclusion: GAP-039 is a Resolve-During-Phase gap for Phase 5, not a pre-implementation blocker
5. **Update phase verdicts**: Map each phase from report-017 section 4 to its new verdict based on resolved conditions.
6. **Verify gap inventory statistics**: Count rows in the detailed table by severity and resolution status; compare to section 6 summary.
7. **Write the verdict report** with all 7 sections.
8. If spec-gap-inventory.md statistics are incorrect, update them (verify before editing).

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-08-final-verification/report-031-final-verdict.md` (NEW -- the final verdict report)
- `src/specs/overview/spec-gap-inventory.md` (ONLY if statistics verification reveals discrepancies)

### Patterns to Follow

- Follow the report structure from report-017: numbered sections, summary table at the top, detailed analysis below
- Use the condition ID scheme from report-017 (C-01 through C-19) consistently
- For the GAP-039 analysis, follow the same assessment pattern used in report-009 (gap triage): identify phase blocked, effort to resolve, scheduling slot, and whether it blocks the overall verdict
- The verdict determination logic from report-017 section 1 applies: READY requires zero unresolved Resolve-Before-Coding gaps and zero NOT READY phases

### Pitfalls to Avoid

- Do NOT resolve GAP-039 (the scenario broadcast format). This ticket assesses it only.
- Do NOT re-run the full audit. This ticket verifies that resolved conditions are actually resolved by spot-checking the files, not by re-auditing from scratch.
- Do NOT update the cross-reference index. If ticket-030 found index inconsistencies, document them as findings but do not fix them in this ticket.
- GAP statistics must be computed from the detailed table, not assumed from previous counts. Count the rows.
- The verdict threshold from report-017: GO requires zero Resolve-Before-Coding gaps AND zero NOT READY phases. If all 19 conditions are resolved and GAP-039 is classified as Resolve-During-Phase, the threshold is met.

## Testing Requirements

### Unit Tests

Not applicable (this is an audit/verdict ticket, not a code change).

### Integration Tests

- Verify the final verdict report file exists at the expected path after completion
- If spec-gap-inventory.md was modified, verify `mdbook build` still succeeds

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-030-verify-crossref-integrity.md
- **Blocks**: None (this is the terminal ticket of the plan)

## Effort Estimate

**Points**: 3
**Confidence**: High
