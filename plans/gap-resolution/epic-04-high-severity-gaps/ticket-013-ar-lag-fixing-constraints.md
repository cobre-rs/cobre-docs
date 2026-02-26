# ticket-013: Add AR Lag Fixing Constraints to LP Formulation (GAP-008)

## Context

### Background

Cut coefficient computation in the backward pass extracts dual variables from "AR lag fixing constraints" — equality constraints that bind each lag variable to its incoming state value. These constraints are present in the LP row layout (Solver Abstraction SS2.2, rows `[N, N + N*L)`) and are referenced in the forward pass patch sequence (Training Loop SS4.2a, Category 2) and dual extraction (Training Loop SS7.2). However, the LP Formulation spec (the mathematical definition of the stage subproblem) does not explicitly define these as separate constraints. Section 5 shows the AR dynamics equation with the remark "State expansion: lagged inflows are state variables with fixing constraints" and the formula $a_{h,\ell} = \hat{a}_{h,\ell}$, but this is presented as a side note rather than a formal constraint family with its own section, dual variable symbol, and LP row assignment.

### Relation to Epic

This ticket resolves GAP-008 (High severity). It connects the mathematical LP formulation to the implementation-level row layout defined in epic-03. Without this fix, a developer reading the LP formulation would not find the lag fixing constraints as a distinct constraint family, yet the solver abstraction places them at specific row indices and the cut coefficient computation depends on their duals.

### Current State

- **LP Formulation SS5**: Shows `$a_{h,\ell} = \hat{a}_{h,\ell} \quad \forall h, \ell$` as "State expansion" with dual variable notation $\pi^{lag}_{h,\ell}$. But this appears as a remark within the AR dynamics section, not as a standalone constraint subsection.
- **Solver Abstraction SS2.2**: Places lag fixing rows at `[N, N + N*L)` in the top (cut-relevant) region.
- **Training Loop SS4.2a**: Category 2 patches target these rows with `patch(row = N + l*N + h, value = state[N + l*N + h])`.
- **Training Loop SS7.2**: States "AR inflow lags: The lag fixing constraints bind each lag variable to its incoming value. Their duals $\pi^a_{h,\ell}$ are the cut coefficients."
- **Solver Abstraction SS2.2 cross-reference note** (added in epic-03): "Constraint families in the LP Formulation are implemented as rows in this layout" with a reverse link to LP Formulation.

## Specification

### Requirements

1. Add a new section SS5a "AR Lag Fixing Constraints" to `lp-formulation.md`, positioned between the existing SS5 "AR Inflow Dynamics" and SS6 "Hydro Generation Constraints".
2. Promote the existing "State expansion" remark from SS5 into the new section as a formal constraint family with:
   - One equality constraint per (hydro $h$, lag $\ell$): $a_{h,\ell} = \hat{a}_{h,\ell}$
   - Explicit statement that these are $N \times L$ total constraints (one per hydro per lag position, using the uniform lag storage convention from Solver Abstraction SS2.1)
   - Dual variable symbol: $\pi^{lag}_{h,\ell}$ (already used in SS5 and Training Loop SS7.2)
   - Statement that the duals are cut coefficients for inflow lag state variables
3. Add a cross-reference from SS5a to Solver Abstraction SS2.2 noting that these constraints occupy LP rows `[N, N + N*L)` in the cut-relevant top region.
4. Add a cross-reference from SS5a to Training Loop SS7.2 (dual extraction for cut coefficients) and Training Loop SS4.2a (Category 2 patches).
5. In the existing SS5, replace the "State expansion" remark with a forward reference to SS5a: "See SS5a for the formal lag fixing constraint definition."
6. Verify that the existing Benders cut section (SS11) references $\pi^{lag}_{h,\ell}$ consistently. The existing formula $\theta \geq \alpha_i + \sum_h \pi^v_{i,h} \cdot v_h + \sum_{h,\ell} \pi^{lag}_{i,h,\ell} \cdot a_{h,\ell}$ already uses this symbol — no change needed there.
7. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-008 as resolved.

### Inputs/Props

- Existing SS5 "State expansion" remark and dual symbol
- Row layout from Solver Abstraction SS2.2
- Patch sequence from Training Loop SS4.2a

### Outputs/Behavior

A formal constraint family section in the LP formulation that an implementer can reference when building the LP row layout, without needing to infer the existence of lag fixing constraints from side remarks.

### Error Handling

Not applicable — specification document.

## Acceptance Criteria

- [ ] Given `lp-formulation.md`, when reading between SS5 and SS6, then a section SS5a "AR Lag Fixing Constraints" exists.
- [ ] Given SS5a, when reading the constraint definition, then $a_{h,\ell} = \hat{a}_{h,\ell} \;\forall h \in \mathcal{H}, \ell \in \{1, \ldots, L\}$ is stated as a formal equality constraint family.
- [ ] Given SS5a, when checking the constraint count, then it states $N \times L$ constraints (using the uniform lag storage convention).
- [ ] Given SS5a, when checking the dual variable, then $\pi^{lag}_{h,\ell}$ is defined as the dual and described as a cut coefficient for inflow lag state variables.
- [ ] Given SS5a, when checking cross-references, then links to Solver Abstraction SS2.2, Training Loop SS7.2, and Training Loop SS4.2a are present.
- [ ] Given SS5, when reading the AR dynamics section, then the "State expansion" remark is replaced with a forward reference to SS5a.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-008 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/math/lp-formulation.md` and locate SS5 "AR Inflow Dynamics".
2. At the end of SS5, replace the "State expansion" block with a forward reference: "The lag fixing constraints that bind $a_{h,\ell}$ to the incoming state value $\hat{a}_{h,\ell}$ are defined as a separate constraint family in SS5a below."
3. Insert section `## 5a. AR Lag Fixing Constraints` (or use `### 5a` if the numbering convention in lp-formulation.md uses `##` for top-level sections).
4. Write the constraint definition, count, dual variable, and cross-references.
5. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
6. Run `mdbook build`.

### Key Files to Modify

- `src/specs/math/lp-formulation.md` — Add SS5a section, edit SS5 remark (primary edit)
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-008 resolution row to Section 7 table

### Patterns to Follow

- **Constraint section format**: Follow the pattern of SS4 (Water Balance) and SS5 (AR Dynamics): state the constraint formula in display math, define the dual variable symbol in a note below, add cross-references.
- **Section numbering**: Use "5a" to insert between 5 and 6 without renumbering existing sections. Verify the existing file uses `##` for numbered sections.
- **Resolution Log row**: Follow the format of existing rows.

### Pitfalls to Avoid

- Do NOT renumber existing sections (SS6, SS7, etc.). Use "5a" to insert.
- Do NOT duplicate the AR dynamics equation. SS5a defines only the fixing constraints; the dynamics equation remains in SS5.
- Do NOT change the dual variable symbol. $\pi^{lag}_{h,\ell}$ is already used consistently in Training Loop SS7.2 and SS5.
- Do NOT edit any files beyond the two listed above. The cross-references in training-loop.md and solver-abstraction.md already reference the lag fixing concept and will not break.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-008 (row layout must define the position of these constraints — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
