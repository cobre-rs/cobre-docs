# ticket-002 Audit Notation-Conventions Symbol Usage in Math Specs (Part 2)

## Context

### Background

This is the second of two notation audit tickets. It covers the "semantic" notation (sections 4-5 of notation-conventions: decision variables, dual variables/cut coefficients) and verifies them against the remaining 8 math specs. It also re-checks any symbols from sections 1-3 that appear in these specs, though the primary focus is sections 4-5.

### Relation to Epic

Together with ticket-001, this completes the notation cross-check for all 14 math specs. This ticket handles the specs that are more focused on specific subsystems (discount rates, risk measures, stopping rules, etc.) rather than the core LP/algorithm formulation.

### Current State

- `notation-conventions.md` section 4 (Decision Variables, ~40 lines of tables) defines per-block variables, stage-level state variables, and slack variables
- `notation-conventions.md` section 5 (Dual Variables, ~130 lines) defines the LP formulation strategy, water balance LP form, AR lag constraints, cut coefficient derivation, and a summary table
- Epic-06 changed cut notation from beta to pi; this ticket verifies the change propagated fully into these 8 specs

## Specification

### Requirements

1. Read `notation-conventions.md` sections 4 (Decision Variables) and 5 (Dual Variables) to build a complete symbol inventory for:
   - Per-block variables: $\delta$, $\epsilon$, $f^\pm$, $g_{j,k,s}$, $q_{h,k}$, $s_{h,k}$, $g_{h,k}$, $u_{h,k}$, $o_{h,k}$, $e_{h,k}$, $r_{h,k}$, $p_{j,k}$, $\chi^{in/out}$
   - Stage-level state variables: $v_h$, $v^{avg}_h$, $a_{h,\ell}$, $\theta$
   - Slack variables: $\sigma^{q-}$, $\sigma^{o-}$, $\sigma^{o+}$, $\sigma^{g-}$, $\sigma^{e\pm}$, $\sigma^r$, $\sigma^{inf}$
   - Dual variables: $\pi^{wb}_h$, $\pi^{lag}_{h,\ell}$, $\pi^{lb}_{b,k}$, $\lambda_i$
   - Cut coefficients: $\pi^v_h$, $\alpha$ (intercept)
2. For each of the following 8 math specs, verify every mathematical symbol used matches its canonical definition:
   - `discount-rate.md`
   - `infinite-horizon.md`
   - `risk-measures.md`
   - `inflow-nonnegativity.md`
   - `par-inflow-model.md`
   - `equipment-formulations.md`
   - `stopping-rules.md`
   - `upper-bound-evaluation.md`
3. Additionally, verify that the cut coefficient notation ($\pi$ not $\beta$) from epic-06 is fully propagated in ALL 14 math specs (quick re-check of the 6 specs from ticket-001 specifically for cut notation)

### Inputs/Props

**Files to read** (all paths relative to `/home/rogerio/git/cobre-docs/src/`):

| File                                     | Purpose                                               |
| ---------------------------------------- | ----------------------------------------------------- |
| `specs/overview/notation-conventions.md` | Canonical notation source (sections 4-5)              |
| `specs/math/discount-rate.md`            | Discount factor on theta, discounted Bellman equation |
| `specs/math/infinite-horizon.md`         | Cyclic policy graphs, cut sharing                     |
| `specs/math/risk-measures.md`            | CVaR, risk-averse cut generation                      |
| `specs/math/inflow-nonnegativity.md`     | PAR non-negativity treatment                          |
| `specs/math/par-inflow-model.md`         | Full PAR(p) model specification                       |
| `specs/math/equipment-formulations.md`   | Per-equipment constraints                             |
| `specs/math/stopping-rules.md`           | Convergence criteria                                  |
| `specs/math/upper-bound-evaluation.md`   | Upper bound estimation methods                        |

### Outputs/Behavior

Produce a findings report with the same structure as ticket-001:

```markdown
## Findings: Notation Sections 4-5 vs Math Specs Part 2

### Summary

- Total symbols checked: N
- Consistent: N
- Inconsistent: N (list)
- Beta-to-pi migration incomplete: N (list)
- Missing from notation-conventions: N (list)

### Detailed Findings

#### [spec-name.md]

| Line | Symbol | Issue | Canonical Definition | Actual Usage |
| ---- | ------ | ----- | -------------------- | ------------ |
```

### Error Handling

- Same classification as ticket-001: MISSING DEFINITION, SUBSCRIPT VARIANT, SYMBOL CONFLICT
- Additionally, any remaining use of beta ($\beta$) for cut coefficients should be flagged as "BETA-TO-PI MIGRATION INCOMPLETE"
- For `par-inflow-model.md`, the stored vs computed quantities distinction means $\sigma_m$ is computed at runtime from $s_m$ and $\psi_{m,\ell}$; verify the conversion formulas use consistent symbols

## Acceptance Criteria

- [ ] Given notation-conventions.md sections 4-5 have been read, when each of the 8 target math specs is read, then every LaTeX formula is checked for symbol consistency
- [ ] Given the epic-06 beta-to-pi migration was completed, when all 14 math specs are scanned for beta ($\beta$) usage in cut coefficient context, then zero instances remain
- [ ] Given findings are recorded, when the report is produced, then each finding includes file path, approximate line, canonical definition, and actual usage
- [ ] Given the par-inflow-model uses stored ($s_m$, $\psi_{m,\ell}$) and computed ($\sigma_m$) quantities, when the conversion formulas are checked, then the symbols match notation-conventions exactly

## Implementation Guide

### Suggested Approach

1. Read `notation-conventions.md` sections 4-5 and build lookup tables for decision variables, state variables, slack variables, and dual variables
2. For each of the 8 target math specs, scan all LaTeX blocks and compare against both the new lookup tables (sections 4-5) and the section 1-3 tables from ticket-001
3. Perform a targeted scan of ALL 14 math specs for any remaining beta ($\beta$) usage in cut coefficient context (this is a quick grep-like check, not a full re-audit)
4. Pay special attention to:
   - Slack variable naming: notation-conventions defines $\sigma^{q-}$ but some specs might use $\sigma^{turb}$ or similar
   - Dual variable naming: $\pi^{wb}$ vs $\pi^{balance}$ vs $\pi^{wbal}$ (the hydro-production-models spec uses $\pi_h^{balance}$ in section 2.10)
   - Contract variable: $\chi$ (chi) must not be confused with $\chi^2$ (chi-squared) in statistical contexts
   - Risk measure notation: verify CVaR parameter conventions match

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-002.md`

### Patterns to Follow

- Same structured report format as ticket-001
- Cross-reference findings between ticket-001 and ticket-002 when the same symbol inconsistency appears in both sets of specs

### Pitfalls to Avoid

- The `par-inflow-model.md` uses $\varepsilon_t$ for innovation noise and $\eta_t$ for noise realization in the LP -- these are different symbols for conceptually the same thing in different contexts; verify whether notation-conventions resolves this
- The `hydro-production-models.md` uses $\pi_h^{balance}$ (section 2.10) while `notation-conventions.md` uses $\pi^{wb}_h$ -- this may be an inconsistency from the FPHA section predating the notation standardization
- `equipment-formulations.md` defines per-equipment details that may introduce symbols not in notation-conventions (like pumping power coefficient $\gamma_j$) -- these are equipment-specific and may be intentionally local

## Testing Requirements

### Unit Tests

N/A (audit ticket)

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: None (can run in parallel with ticket-001)
- **Blocks**: ticket-005

## Effort Estimate

**Points**: 3
**Confidence**: High
