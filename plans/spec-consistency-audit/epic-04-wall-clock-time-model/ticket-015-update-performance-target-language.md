# ticket-015 Update Performance Target Language in Specs

## Context

### Background

Tickets 013 and 014 produce a complete wall-clock timing model for the Cobre SDDP production case, with compute-only estimates and synchronization overhead. The current `production-scale-reference.md` §4 describes performance expectations as "aspirational targets based on domain experience" that "will be validated and refined during implementation." This ticket replaces that hedging language with model-based estimates, adds an explicit assumptions section, and updates the test systems table with derived values. It also verifies that claims in `communication-patterns.md` and `work-distribution.md` are consistent with the model, updating them if not.

### Relation to Epic

This is the final ticket in Epic 04. It takes the complete timing model from tickets 013-014 and applies it to the specification documents, replacing aspirational language with derived estimates. This is the ticket that actually modifies spec files.

### Current State

- `production-scale-reference.md` §4 preamble note: "Performance expectations in this section are aspirational targets based on domain experience and hardware specifications, not calculator-derived values."
- §4.2 test systems table has Forward Time and Backward Time columns with round-number targets: `<30s` forward, `<90s` backward for production scale.
- §4.3 KPI table includes "Cut exchange (MPI_Allgatherv) <5 ms" and "Parallel efficiency >80%."
- §4.4 scaling expectations: "< 2% of iteration time at production scale."
- `communication-patterns.md` §3.2: "<1%" on InfiniBand, "~1-2%" on Ethernet.
- The timing model analysis (`timing-model-analysis.md`) will contain the complete model with compute + sync overhead, sensitivity analysis, and consistency checks.

## Specification

### Requirements

1. **Update `production-scale-reference.md` §4 preamble note**:
   - Replace the "aspirational targets" disclaimer with a "model-based estimates" framing
   - Add language like: "The timing estimates below are derived from a first-principles model using LP solve time KPIs (§4.3), parallelism parameters (§4.2), and work distribution mechanics (Work Distribution §2). They assume a fully warm-started steady-state iteration and do not account for I/O, checkpointing, or convergence check overhead."
   - Keep a qualifier that these are pre-implementation estimates pending solver benchmarking, but make clear they are derived, not aspirational

2. **Update `production-scale-reference.md` §4.2 test systems table**:
   - Replace the Forward Time and Backward Time values for the **Production** row with the model-derived values from the timing analysis
   - Keep the other rows (Unit Test, Small, Medium, Large) as aspirational targets (the model only covers the production configuration)
   - Add a footnote or note explaining which rows are model-derived vs aspirational

3. **Add a new subsection to §4**: **§4.6 Wall-Clock Time Budget** (or similar numbering):
   - **Per-iteration time budget table** breaking down: forward compute, backward compute, trial point gathering, cut exchange, convergence sync, barrier/imbalance overhead
   - Show both the per-iteration total and the 50-iteration total
   - State the margin relative to the 7,200-second target
   - Reference the timing model analysis document for the full derivation

4. **Add a new subsection**: **§4.7 Model Assumptions** (or integrate into §4.6):
   - Enumerate every assumption the model relies on with its source
   - Categorize assumptions as: (a) from spec KPIs, (b) from spec architecture, (c) engineering estimates
   - Highlight the most sensitive assumptions (LP solve time, warm-start hit rate)

5. **Add a sensitivity summary** (can be within §4.6):
   - At what LP solve time does the 50-iteration total exceed 2 hours?
   - What is the impact of doubling the LP solve time?

6. **Add a thread utilization note** to §4.4 scaling expectations:
   - Note that at 64 ranks with 192 passes, only 3/24 threads per rank are active
   - Reference alternative configurations where utilization is better
   - Frame this as an optimization opportunity for the implementation, not a spec defect

7. **Verify and update `communication-patterns.md` §3** if needed:
   - If the §3.1 volume table or §3.2 bandwidth analysis at R=16 is inconsistent with the R=64 production model, add a note or additional row for R=64
   - If the "<1% on InfiniBand" claim needs qualification (e.g., it depends on iteration time which depends on LP solve time), add the qualification

8. **Verify `work-distribution.md` §2.3** example:
   - §2.3 uses R=8, N_threads=16 as an example. If the production parameters (R=64, N_threads=24) tell a different utilization story, note this in the relevant sections

9. **Ensure all changes are consistent** with each other and with the timing model analysis.

10. **Ensure mdBook builds cleanly** after all changes.

### Inputs/Props

| Input                     | Source                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Complete timing model     | `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` |
| Current §4 content        | `src/specs/overview/production-scale-reference.md` lines ~240-312                     |
| Communication analysis    | `src/specs/hpc/communication-patterns.md` §3                                          |
| Work distribution example | `src/specs/hpc/work-distribution.md` §2.3                                             |

### Outputs/Behavior

1. Modified `src/specs/overview/production-scale-reference.md`:
   - Updated §4 preamble note
   - Updated §4.2 Production row
   - New §4.6 Wall-Clock Time Budget subsection
   - New §4.7 Model Assumptions subsection (or integrated)
   - Updated §4.4 with thread utilization note
2. Possibly modified `src/specs/hpc/communication-patterns.md` §3 (if consistency check requires updates)
3. Possibly modified `src/specs/hpc/work-distribution.md` §2.3 (if example needs production-scale note)

### Error Handling

- If the timing model shows the 2-hour target is infeasible at the KPI LP solve time, the updated language should clearly state this and identify the gap. The target itself should not be changed — instead, frame it as "the model shows the target requires LP solve time below X ms" or similar.
- If updating `communication-patterns.md` or `work-distribution.md` would create ripple effects to other cross-referenced specs, limit changes to additions (notes, additional rows) rather than modifying existing content.

## Acceptance Criteria

- [ ] Given the current §4 preamble note says "aspirational targets", when the update is applied, then the note says "model-based estimates" (or equivalent) and references the work distribution and LP solve KPIs as the derivation basis
- [ ] Given the §4.2 test systems table Production row, when updated, then Forward Time and Backward Time contain model-derived values (not round-number aspirational targets) with a footnote indicating they are model-derived
- [ ] Given the new §4.6 subsection, when a reader examines it, then they see a per-iteration time budget table with at least: forward compute, backward compute, communication overhead, barrier overhead, per-iteration total, and 50-iteration total
- [ ] Given the new §4.7 assumptions subsection, when a reader examines it, then every timing model assumption is listed with its source and category
- [ ] Given the §4.4 scaling expectations, when updated, then there is a note about thread utilization at 64 ranks (3/24 = 12.5%) with reference to alternative configurations
- [ ] Given all changes, when `mdbook build` is run, then it exits 0 with no new warnings
- [ ] Given the timing model's consistency checks from ticket-014, when spec claims were flagged as NEEDS UPDATE, then those claims are updated in this ticket
- [ ] Given the changes to `production-scale-reference.md`, when cross-references within the file are checked (§4.6 referring to §4.3, §4.2, etc.), then all section references are valid

## Implementation Guide

### Suggested Approach

1. **Read the timing model analysis** (`timing-model-analysis.md`) to extract the key numbers:
   - Per-iteration forward compute time
   - Per-iteration backward compute time
   - Per-iteration sync overhead
   - Per-iteration total
   - 50-iteration total
   - Sensitivity breakpoints
   - Thread utilization findings
   - Consistency check verdicts

2. **Read current `production-scale-reference.md` §4** to understand the existing structure and section numbering.

3. **Draft the §4 preamble update**: Replace the aspirational note. Keep a qualification about pre-implementation estimates, but make clear the derivation is from spec parameters.

4. **Update §4.2 Production row**: Replace `<30s` / `<90s` with model-derived values. Format consistently with other rows (round to nearest second with `<` or `~` prefix as appropriate).

5. **Write §4.6 Wall-Clock Time Budget**:
   - Lead with the per-iteration time budget table
   - Show the 50-iteration total
   - Show margin to 7,200 s
   - Include sensitivity: "At 4 ms LP solve time, total increases to X seconds (still under / exceeds 2 hours)"
   - Reference timing-model-analysis.md for full derivation (as a relative link if it is in the plans directory, or describe it as an audit artifact)

6. **Write §4.7 Model Assumptions**:
   - Table with columns: Assumption, Value, Source, Category, Sensitivity
   - Category: Spec KPI / Spec Architecture / Engineering Estimate
   - Sensitivity: High (model is sensitive to this) / Low (model is insensitive)

7. **Update §4.4** with thread utilization note.

8. **Check `communication-patterns.md` §3** against ticket-014 consistency verdicts. If any claim needs updating:
   - Prefer adding a note or additional paragraph rather than modifying existing text
   - If §3.1 table only covers R=16, add a note: "At the full production scale (R=64), the communication volume per iteration is unchanged (Allgatherv volume is independent of rank count), but the per-call latency increases modestly due to additional participants in the collective."

9. **Check `work-distribution.md` §2.3** — the example uses R=8, threads=16 which gives 192/8=24 trial points per rank, 16 threads => 16/16 = 100% utilization. The production case (R=64) gives 3/24 = 12.5%. If this contrast is worth noting, add a brief note after the example.

10. **Run `mdbook build`** and verify exit 0.

### Key Files to Modify

| File                                               | Sections                                          | Changes                                   |
| -------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| `src/specs/overview/production-scale-reference.md` | §4 preamble, §4.2 table, §4.4, new §4.6, new §4.7 | Primary deliverable                       |
| `src/specs/hpc/communication-patterns.md`          | §3                                                | Add R=64 production note if needed        |
| `src/specs/hpc/work-distribution.md`               | §2.3                                              | Add production utilization note if needed |

### Key Files to Read

| File                                                                                  | Purpose                      |
| ------------------------------------------------------------------------------------- | ---------------------------- |
| `plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` | Source for all model numbers |
| `src/specs/overview/production-scale-reference.md`                                    | Current state of §4          |
| `src/specs/hpc/communication-patterns.md`                                             | Current claims to verify     |
| `src/specs/hpc/work-distribution.md`                                                  | Current examples to verify   |

### Patterns to Follow

- **Source column pattern** (Epic 03): Every numeric value in the new sections should reference its derivation source
- **Annotation-not-modification** (Epic 03): When updating existing claims, prefer adding qualifying notes alongside existing text rather than replacing it wholesale, unless the existing text is clearly wrong
- **Calculator-verified presentation** (Epic 03 §3.4): The model-verified values should be presented with the same traceability rigor as the LP sizing calculator values in §3.4
- **"See also" cross-reference style**: Use the same markdown link format as other cross-references in the file
- Follow existing section numbering convention (§4.1, §4.2, ..., §4.5 exists as convergence reference, so new sections are §4.6, §4.7)

### Pitfalls to Avoid

- **Do not remove the KPI targets from §4.3**: These are input assumptions to the model, not outputs. They should remain as-is.
- **Do not update the Unit Test / Small / Medium / Large rows in §4.2**: The timing model only covers the Production configuration. Other rows remain aspirational.
- **Do not modify the timing model analysis document**: This ticket only reads from it.
- **Do not create a separate timing model spec**: The model results belong in `production-scale-reference.md` §4. The full derivation lives in the plans directory as an audit artifact.
- **Watch out for section numbering**: §4.5 is "Convergence Reference." New sections should be §4.6 and beyond, not inserted before §4.5.
- **Do not change the 2-hour target itself**: Even if the model shows margin, the target is a business requirement. The model proves feasibility, not optimality.

## Testing Requirements

### Unit Tests

Not applicable (documentation changes only).

### Integration Tests

- `mdbook build` exits 0
- All internal cross-reference links in the modified files resolve correctly (check for broken `§` references)

### Verification Steps

- Read the updated §4.2 Production row and verify the Forward/Backward time values match the model analysis
- Read the new §4.6 and verify per-iteration total matches the sum of its components
- Read the new §4.7 and verify every assumption has a source citation
- Verify the 50-iteration total is stated and compared against 7,200 s
- If `communication-patterns.md` was modified, verify the R=64 note is accurate
- Grep for "aspirational" in `production-scale-reference.md` to confirm it is removed or reframed in the §4 preamble

## Dependencies

- **Blocked By**: ticket-013, ticket-014 (needs the complete timing model with sync overhead)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: High
