# ticket-006 Update Configuration Reference for GAP-019, 024, 027, 035

## Context

### Background

Four configuration-related gap decisions from the stakeholder design review need to be
incorporated into the configuration reference spec. These gaps were already marked as
resolved in the gap inventory (ticket-001), with forward references pointing to
`configuration-reference.md` and `solver-interface-trait.md`. This ticket creates the
actual spec content that those forward references target.

The four gaps are:

- **GAP-019**: Solver retry parameters (`retry_max_attempts`, `retry_time_budget_seconds`)
  are external config per-solver, with tuning encapsulated inside the solver implementation.
- **GAP-024**: `cut_activity_tolerance` is an external config parameter with default 1e-6.
- **GAP-027**: `training.forward_passes` is mandatory with no default; loader emits an
  error if the field is absent.
- **GAP-035**: The example `config.json` should use `"method": "level1"` and
  `"risk_measure": "expectation"` to reflect the minimal viable defaults.

### Relation to Epic

This is the primary ticket in epic-03 (Configuration and Data Model). It modifies the
central configuration reference document to align with confirmed architectural decisions.
The other two tickets in this epic (ticket-007 and ticket-008) are independent and do
not depend on changes made here.

### Current State

`src/specs/configuration/configuration-reference.md` currently:

1. **Section 3.2** (Forward Pass Count): Shows `training.forward_passes` with Default
   column value `—` (em dash), but no explicit statement that the field is mandatory or
   that the loader must reject configs missing it. The table description says only
   "Number of scenario trajectories $M$ per iteration."
2. **Section 3.3** (Cut Selection): Lists `method`, `threshold`, `check_frequency`, but
   does NOT include a `cut_activity_tolerance` parameter.
3. **No solver retry config section exists.** There is no `solver` config section at all.
   Retry parameters are described only in `solver-abstraction.md` SS7.1 as "configurable"
   defaults, and in `solver-interface-trait.md` SS6 as "encapsulated within each
   implementation."
4. **Section 8** (Complete Example): The `config.json` example uses
   `"method": "domination"` for cut selection. The `stages.json` example uses per-stage
   `"risk_measure": { "cvar": { "alpha": 0.95, "lambda": 0.5 } }` for stage 0 and
   `"risk_measure": "expectation"` for stage 1. The risk measure entries are correct
   (they demonstrate per-stage variation), but the cut selection method should reflect the
   minimal viable default (`"level1"`) per GAP-035.
5. **Duplicate section 8 heading**: There are two `## 8.` sections (Complete Example and
   Formulation-to-Configuration Mapping). This is a pre-existing issue and is NOT in scope
   for this ticket.

`src/specs/architecture/solver-interface-trait.md` SS6 already documents the retry logic
encapsulation. An encapsulation note with a cross-reference to the configuration
reference should be added there.

The configuration reference uses **plain numbered sections** (`## 1.`, `## 2.`, etc.),
NOT `SS` prefix.

## Specification

### Requirements

1. **Add solver retry config parameters** (GAP-019):
   - Add a new section `3.x Solver Retry Configuration` (as subsection under section 3,
     Training Options) with a parameter table documenting:
     - `training.solver.retry_max_attempts` (int, default: 5)
     - `training.solver.retry_time_budget_seconds` (float, default: 30.0)
   - Add a design note explaining that retry parameters are per-solver external config,
     but the retry strategy escalation sequence is encapsulated inside each solver
     implementation and not user-configurable.
   - Add a cross-reference to `solver-interface-trait.md` SS6 and `solver-abstraction.md`
     SS7.
   - In `solver-interface-trait.md` SS6, add a sentence noting that the retry parameters
     (`retry_max_attempts`, `retry_time_budget_seconds`) are sourced from
     `config.json` (with cross-reference to configuration-reference.md).

2. **Add `cut_activity_tolerance` parameter** (GAP-024):
   - Add `training.cut_selection.cut_activity_tolerance` to the section 3.3 parameter
     table with type `float`, default `1e-6`, and description: "Minimum dual multiplier
     value for a cut to be considered binding (active). Used by all selection strategies."
   - Add a cross-reference to `cut-management-impl.md` SS6.1 (Binding Detection).

3. **Mark `training.forward_passes` as mandatory** (GAP-027):
   - In the section 3.2 table, change the Default column from `—` to
     `**mandatory** (no default)`.
   - Add a sentence after the table: "The loader must reject any configuration that omits
     `training.forward_passes`. This field has no default because the optimal value depends
     on the problem structure and the available MPI ranks. An absent value would silently
     produce incorrect cut pool sizing (see
     [Cut Management Implementation SS1.3](../architecture/cut-management-impl.md))."

4. **Update example `config.json`** (GAP-035):
   - In the section 8 Complete Example, change `"method": "domination"` to
     `"method": "level1"` in the `config.json` example.
   - The `stages.json` example's `risk_measure` values are already correct (stage 0 uses
     CVaR, stage 1 uses `"expectation"`) and do NOT need changes. The gap description
     mentions `"risk_measure": "expectation"` but this already appears in the existing
     example for stage 1.

### Inputs/Props

- Gap decisions from stakeholder review (GAP-019, GAP-024, GAP-027, GAP-035)
- Current `configuration-reference.md` section structure
- Current `solver-interface-trait.md` SS6 content

### Outputs/Behavior

- Updated `configuration-reference.md` with three new parameter entries and one example
  correction
- Updated `solver-interface-trait.md` SS6 with configuration source cross-reference
- No new files created

### Error Handling

N/A (spec document edits only).

### Out of Scope

- The duplicate `## 8.` heading issue in configuration-reference.md is pre-existing and
  NOT addressed by this ticket.
- Updating the `stages.json` example for scenario notation changes (that is ticket-007).
- Updating any files other than `configuration-reference.md` and
  `solver-interface-trait.md`.
- Adding actual JSON schema validation logic (this is a spec, not code).

## Acceptance Criteria

- [ ] Given the current `configuration-reference.md`, when the ticket is complete, then
      section 3 contains a new subsection documenting `training.solver.retry_max_attempts`
      (int, default 5) and `training.solver.retry_time_budget_seconds` (float, default 30.0)
      in a parameter table.
- [ ] Given the solver retry subsection, when a reader inspects it, then it contains a
      design note explaining that retry escalation strategy is encapsulated and not
      user-configurable, with cross-references to `solver-interface-trait.md` SS6 and
      `solver-abstraction.md` SS7.
- [ ] Given `solver-interface-trait.md` SS6, when the ticket is complete, then it contains
      a sentence stating that `retry_max_attempts` and `retry_time_budget_seconds` are sourced
      from `config.json` with a cross-reference to `configuration-reference.md`.
- [ ] Given the section 3.3 parameter table, when the ticket is complete, then it contains
      a row for `training.cut_selection.cut_activity_tolerance` with type float, default
      1e-6, and a reference to `cut-management-impl.md` SS6.1.
- [ ] Given the section 3.2 table, when the ticket is complete, then the Default column
      for `training.forward_passes` reads `**mandatory** (no default)` and a sentence after
      the table explains that the loader must reject configs missing this field, citing
      `cut-management-impl.md` SS1.3.
- [ ] Given the section 8 `config.json` example, when the ticket is complete, then the
      `"method"` value reads `"level1"` (not `"domination"`).
- [ ] Given the completed file, when `mdbook build` is run, then the build succeeds
      with no new errors.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/configuration/configuration-reference.md`.
2. In section 3.2, update the Default column and add the mandatory field sentence.
3. In section 3.3, add a row to the existing parameter table for
   `cut_activity_tolerance`.
4. After section 3.4 (Stopping Rules), add a new subsection `### 3.5 Solver Retry
Configuration` with a parameter table and encapsulation design note. (This places
   solver config logically under Training Options since retry affects only training LP
   solves.)
5. In section 8, change `"method": "domination"` to `"method": "level1"` in the
   `config.json` code block.
6. Open `src/specs/architecture/solver-interface-trait.md`.
7. In section 6 (Retry Logic Encapsulation), add a sentence at the end of the first
   paragraph noting the configuration source:
   "The `retry_max_attempts` and `retry_time_budget_seconds` parameters are sourced from
   `config.json` (see [Configuration Reference §3.5](../configuration/configuration-reference.md))."
8. Run `mdbook build` to verify no broken links or rendering issues.

### Key Files to Modify

- `src/specs/configuration/configuration-reference.md` — sections 3.2, 3.3, new 3.5, 8
- `src/specs/architecture/solver-interface-trait.md` — section 6

### Patterns to Follow

- **Parameter table format**: Follow the existing pattern in section 3.1 and 3.3 with
  columns `| Option | Type | Default | Description |` or
  `| Option | Value | LP Effect | Reference |` depending on the parameter nature.
- **Cross-reference format**: Use `[Target Spec Name SS/§N](relative-path)` following
  the section prefix rules (plain numbers in configuration-reference.md, SS in
  architecture files).
- **Section numbering**: Configuration reference uses plain numbered headings
  (`### 3.5`), NOT `SS` prefix.
- **Architecture files**: Use `SS` prefix when referencing sections within architecture
  files.

### Pitfalls to Avoid

- Do NOT use `§` prefix in configuration-reference.md or solver-interface-trait.md
  section headings or prose references (both are outside `src/specs/hpc/`).
- Do NOT renumber existing sections. The new subsection is `### 3.5`, inserted after
  `### 3.4`.
- Do NOT modify the `stages.json` example in section 8 (scenario changes are ticket-007).
- Do NOT fix the duplicate `## 8.` heading (out of scope).
- Ensure the `"method": "level1"` change is in the `config.json` block only, not in
  the standalone cut selection table in section 3.3 which already lists `level1` as a
  valid value.

## Testing Requirements

### Unit Tests

N/A (spec document, not code).

### Integration Tests

- Run `mdbook build` from the repo root and verify zero new errors.
- Verify all new cross-references resolve (check for broken link warnings in build
  output).

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-001-batch-update-gap-inventory.md (gap inventory forward
  references must exist before creating the target content)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
