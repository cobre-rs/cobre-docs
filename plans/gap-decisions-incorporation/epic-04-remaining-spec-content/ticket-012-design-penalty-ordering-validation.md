# ticket-012 Design Penalty Ordering Validation Checks

## Context

### Background

GAP-025 identified that the penalty priority ordering in `penalty-system.md` SS2 ("Penalty Priority Ordering") says the ordering "must be maintained" but provides no enforcement mechanism. A user could set `deficit_cost < spillage_cost`, violating the ordering. The stakeholder design review decided that ordering violations emit a **warning** (not an error), because the ordering is a best-practice guideline that affects policy quality but does not break algorithmic correctness. This ticket designs the validation checks and documents them in `penalty-system.md` and `validation-architecture.md`.

### Relation to Epic

Epic 04 resolves the five remaining gaps. This ticket resolves GAP-025 by specifying penalty ordering validation checks that emit warnings. The gap inventory resolution log (section 7) records this ticket as the closer and cites `penalty-system.md` and `validation-architecture.md` as the target files.

### Current State

- `src/specs/data-model/penalty-system.md` SS2 "Penalty Priority Ordering" states the qualitative ordering: Filling target > Storage violation > Deficit > Constraint violations > Resource costs > Regularization. It also has a specific FPHA validation rule (`fpha_turbined_cost > spillage_cost`) which is already an error.
- `src/specs/architecture/validation-architecture.md` SS2.5 "Penalty System" has four existing rules: penalty values strictly positive, priority ordering maintained (references penalty-system.md SS3), deficit last segment null depth, deficit monotonicity. The "Priority ordering" rule is listed but not enumerated into specific checks.
- The three-tier cascade (global -> entity -> stage) means penalties are pre-resolved per (entity, stage) during loading. Ordering validation should run on the **resolved** values, not on the raw input tiers.

## Specification

### Requirements

1. Add a new subsection to `penalty-system.md` after SS2 "Penalty Priority Ordering" (e.g., SS2a "Penalty Ordering Validation") that specifies:
   - **Five adjacent-pair comparisons** to validate. Each comparison checks that the higher-priority penalty exceeds the lower-priority penalty from the ordering. The pairs to check are:
     1. `filling_target_violation_cost > storage_violation_below_cost` (per hydro, after cascade resolution)
     2. `storage_violation_below_cost > max(deficit_segments[-1].cost)` (per hydro vs. its bus's last deficit segment)
     3. `max(deficit_segments[-1].cost) > max(constraint_violation_costs)` where constraint violation costs are the set {`turbined_violation_below_cost`, `outflow_violation_below_cost`, `outflow_violation_above_cost`, `generation_violation_below_cost`, `evaporation_violation_cost`, `water_withdrawal_violation_cost`} (per hydro, deficit from its bus)
     4. `min(constraint_violation_costs) > max(resource_costs)` where resource costs are thermal generation costs (per bus, comparing the minimum constraint violation penalty on any hydro connected to that bus against the maximum thermal cost)
     5. `min(resource_costs or deficit_cost) > max(regularization_costs)` where regularization costs are {`spillage_cost`, `fpha_turbined_cost`, `diversion_cost`, `curtailment_cost`, `exchange_cost`} (system-wide check)
   - All five checks produce **warnings**, not errors. The existing FPHA rule (`fpha_turbined_cost > spillage_cost`) remains a separate **error** because it affects LP correctness (interior FPHA solutions), not just policy quality.
   - Validation runs on **post-resolution** penalty values (after the three-tier cascade has been applied), not on raw input tiers. This means each (entity, stage) pair may produce a warning independently.
   - To avoid excessive warning output, warnings are **aggregated**: one warning per violated pair across all entities and stages, with the warning message listing the count of violations and the most extreme example.

2. Update `validation-architecture.md` SS2.5 "Penalty System" to expand the "Priority ordering" row into the five specific checks with severity "Warning" and descriptions referencing `penalty-system.md` SS2a.

### Inputs/Props

- The penalty priority ordering from `penalty-system.md` SS2.
- The pre-resolved penalty values from the three-tier cascade.

### Outputs/Behavior

- `penalty-system.md` gains a subsection SS2a with the five validation pair specifications.
- `validation-architecture.md` SS2.5 gains expanded penalty ordering rows.

### Error Handling

Not applicable (documentation ticket). The designed checks themselves produce warnings, not errors.

### Out of Scope

- Implementing the validation logic in code.
- Changing the FPHA validation rule from error to warning (it stays as an error).
- Adding new penalty types or modifying the penalty cascade resolution.
- Modifying `input-loading-pipeline.md` (the validation rules are architectural; per-file loading checks are not affected).

## Acceptance Criteria

- [ ] Given `src/specs/data-model/penalty-system.md`, when the file is read, then a subsection (SS2a or similar) exists that enumerates exactly five adjacent-pair penalty ordering checks.
- [ ] Given `src/specs/data-model/penalty-system.md` SS2a, when each check is read, then it specifies severity as "Warning" (not "Error").
- [ ] Given `src/specs/data-model/penalty-system.md` SS2a, when each check is read, then it specifies that validation runs on post-resolution values (after three-tier cascade).
- [ ] Given `src/specs/architecture/validation-architecture.md` SS2.5, when the "Penalty System" table is read, then the "Priority ordering" row has been expanded into five specific check rows with severity "Warning".
- [ ] Given the modified files, when `mdbook build` is run, then it completes with exit code 0 and no new warnings.

## Implementation Guide

### Suggested Approach

1. Read `src/specs/data-model/penalty-system.md` SS2 "Penalty Priority Ordering" (lines 82-90).
2. After the "FPHA validation rule" paragraph (line 90), add a new subsection:
   ```
   ### Penalty Ordering Validation
   ```
   (Using `### 2a` or plain `###` heading -- penalty-system.md is a data-model spec, so it does not use `SS` prefix.)
3. In the new subsection, add a table with the five validation pairs:

   | #   | Higher Priority                 | Lower Priority                 | Comparison Scope  | Severity |
   | --- | ------------------------------- | ------------------------------ | ----------------- | -------- |
   | 1   | `filling_target_violation_cost` | `storage_violation_below_cost` | Per hydro         | Warning  |
   | 2   | `storage_violation_below_cost`  | last deficit segment cost      | Per hydro vs. bus | Warning  |
   | 3   | last deficit segment cost       | constraint violation costs     | Per hydro vs. bus | Warning  |
   | 4   | min constraint violation cost   | max resource cost              | Per bus           | Warning  |
   | 5   | min resource/deficit cost       | max regularization cost        | System-wide       | Warning  |

4. Add a paragraph explaining:
   - Validation runs on post-resolution values.
   - Warnings are aggregated (one per violated pair with count + worst example).
   - Violations indicate suboptimal policy behavior but do not break algorithmic correctness.
   - The existing FPHA `fpha_turbined_cost > spillage_cost` check remains a separate error (SS2 paragraph).
5. Read `src/specs/architecture/validation-architecture.md` SS2.5 "Penalty System" (lines 114-122).
6. Replace the single "Priority ordering" row with five rows, one per check:

   | Rule                          | Description                                                                                                                                                            |
   | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | **Filling > storage**         | **Warning.** `filling_target_violation_cost` should exceed `storage_violation_below_cost` per hydro. See [Penalty System](../data-model/penalty-system.md) SS2a        |
   | **Storage > deficit**         | **Warning.** Per-hydro `storage_violation_below_cost` should exceed the bus's highest deficit segment cost. See [Penalty System](../data-model/penalty-system.md) SS2a |
   | **Deficit > constraint**      | **Warning.** Highest deficit segment cost should exceed constraint violation penalties. See [Penalty System](../data-model/penalty-system.md) SS2a                     |
   | **Constraint > resource**     | **Warning.** Minimum constraint violation penalty should exceed maximum resource cost. See [Penalty System](../data-model/penalty-system.md) SS2a                      |
   | **Resource > regularization** | **Warning.** Minimum resource/deficit cost should exceed maximum regularization cost. See [Penalty System](../data-model/penalty-system.md) SS2a                       |

7. Run `mdbook build` to verify.

### Key Files to Modify

- `src/specs/data-model/penalty-system.md` (add subsection after SS2 "Penalty Priority Ordering")
- `src/specs/architecture/validation-architecture.md` (expand SS2.5 "Penalty System" table)

### Patterns to Follow

- Data-model specs (`src/specs/data-model/`) use plain numbered headings (`## 2.`, `### 2a`) -- no `SS` or `§` prefix.
- Architecture specs (`src/specs/architecture/`) use `SS` prefix in cross-references.
- Warning-severity rules in `validation-architecture.md` use bold `**Warning.**` prefix in the Description column -- see "Filling inflow sufficiency" row for the existing pattern.
- Cross-references from architecture files to data-model files use prose: `[Penalty System](../data-model/penalty-system.md) SS2a` is acceptable because it is the section reference in the link text, not a `§` prefix.

### Pitfalls to Avoid

- Do NOT use `§` prefix in penalty-system.md headings or internal references (it is a data-model file, not an HPC file).
- Do NOT change the FPHA rule (`fpha_turbined_cost > spillage_cost`) from error to warning.
- Do NOT define per-(entity, stage) detailed validation pseudocode -- the spec should describe the checks declaratively, leaving implementation details to the developer.
- Do NOT remove the existing qualitative ordering statement in SS2 -- the five checks supplement it, they do not replace it.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Run `mdbook build` from the repo root; verify exit code 0.
- Verify that `grep -c 'Warning' src/specs/architecture/validation-architecture.md` returns at least 5 more matches than before (one per new warning row).
- Verify that `grep -c 'ordering\|adjacent.pair' src/specs/data-model/penalty-system.md` returns at least 1 match in the new subsection.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
