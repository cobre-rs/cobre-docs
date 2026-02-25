# ticket-001 Audit Notation-Conventions Symbol Usage in Math Specs (Part 1)

## Context

### Background

The Cobre specification corpus defines all mathematical notation in a single canonical document (`notation-conventions.md`, 364 lines). This notation covers index sets, parameters, decision variables, dual variables, and cut coefficient derivations. All 14 math specs and all other specs reference these symbols. A recent epic-06 remediation changed cut coefficient notation from beta to pi, but no systematic audit has verified that every symbol usage across the corpus matches the canonical definitions.

### Relation to Epic

This is the first of two notation audit tickets. It covers the "structural" notation (sections 1-3 of notation-conventions: general conventions, index sets, parameters) and verifies them against the first 6 math specs which are the most formula-dense.

### Current State

- `notation-conventions.md` (364 lines) at `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md`
- 14 math specs at `/home/rogerio/git/cobre-docs/src/specs/math/`
- Epic-06 of the previous audit changed beta to pi for cut coefficients, but no systematic cross-check was done

## Specification

### Requirements

1. Read `notation-conventions.md` sections 1 (General Notation Conventions), 2 (Index Sets), and 3 (Parameters) to build a complete symbol inventory
2. For each of the following 6 math specs, verify that every mathematical symbol used matches its canonical definition:
   - `sddp-algorithm.md` (~222 lines)
   - `lp-formulation.md` (~374 lines)
   - `system-elements.md` (~535 lines)
   - `block-formulations.md` (read full file)
   - `hydro-production-models.md` (~391 lines)
   - `cut-management.md` (~208 lines)
3. For each symbol found in these specs, record whether it:
   - Matches the canonical definition exactly
   - Uses a variant not defined in notation-conventions (e.g., different subscript pattern)
   - Is missing from notation-conventions but should be there
   - Has a different meaning than defined in notation-conventions

### Inputs/Props

**Files to read** (all paths relative to `/home/rogerio/git/cobre-docs/src/`):

| File                                     | Purpose                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `specs/overview/notation-conventions.md` | Canonical notation source (sections 1-3)                          |
| `specs/math/sddp-algorithm.md`           | Algorithm overview with value function, cut, convergence formulas |
| `specs/math/lp-formulation.md`           | Complete LP with objective, constraints, penalties                |
| `specs/math/system-elements.md`          | Physical elements with decision variables, parameters             |
| `specs/math/block-formulations.md`       | Parallel vs chronological block variants                          |
| `specs/math/hydro-production-models.md`  | FPHA, constant productivity, linearized head                      |
| `specs/math/cut-management.md`           | Cut definition, dual extraction, aggregation, selection           |

### Outputs/Behavior

Produce a findings report as a markdown section with the following structure:

```markdown
## Findings: Notation Sections 1-3 vs Math Specs Part 1

### Summary

- Total symbols checked: N
- Consistent: N
- Inconsistent: N (list)
- Missing from notation-conventions: N (list)
- Undocumented variants: N (list)

### Detailed Findings

#### [spec-name.md]

| Line | Symbol | Issue | Canonical Definition | Actual Usage |
| ---- | ------ | ----- | -------------------- | ------------ |
```

### Error Handling

- If a symbol in a math spec is not defined in notation-conventions.md at all, flag it as "MISSING DEFINITION" rather than "inconsistent"
- If a symbol is used with additional subscripts beyond the canonical definition (e.g., $\pi^{wb}_h$ in notation-conventions but $\pi^{wb}_{h,k}$ in a spec), flag it as "SUBSCRIPT VARIANT"
- If notation-conventions defines a symbol but the math spec uses a different letter for the same concept, flag it as "SYMBOL CONFLICT"

## Acceptance Criteria

- [ ] Given notation-conventions.md sections 1-3 have been read, when each of the 6 target math specs is read, then every LaTeX formula in the spec is checked for symbol consistency
- [ ] Given an inconsistency is found, when it is recorded in the findings report, then it includes the exact file path, approximate line number, the canonical definition, and the actual usage
- [ ] Given all 6 specs have been audited, when the findings report is produced, then it includes a summary with counts of consistent, inconsistent, missing, and variant symbols
- [ ] Given the index set table in notation-conventions section 2 defines typical sizes, when these sizes appear in math specs, then they are verified to match

## Implementation Guide

### Suggested Approach

1. Read `notation-conventions.md` sections 1-3 and build three lookup tables:
   - **General conventions**: $t$, $\omega$, $x_t$, $\hat{x}_{t-1}$, $V_t(x)$, $\theta_t$, $\pi$, $(\alpha, \pi)$, $k$
   - **Index sets**: All symbols in the section 2 table ($t$, $k$, $\mathcal{B}$, $\mathcal{H}$, $\mathcal{T}$, $\mathcal{L}$, etc.)
   - **Parameters**: All symbols in section 3 tables ($\tau_k$, $w_k$, $\zeta$, $D_{b,k}$, $c^{def}_{b,s}$, etc.)
2. For each target math spec, scan every LaTeX block (`$$...$$` and `$...$`) and compare against the lookup tables
3. Pay special attention to:
   - Cut notation: must use $\pi$ (not $\beta$) for cut coefficients after epic-06 change
   - Water balance: verify $\zeta$ definition and usage are consistent
   - FPHA: verify $\gamma$ coefficient notation matches
   - Block weights: verify $w_k$ definition and usage
4. Record all findings in the structured report format

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-001.md`

### Patterns to Follow

- Use exact file paths and approximate line numbers in findings
- Distinguish between true inconsistencies (wrong symbol) and acceptable variants (additional context-specific subscripts)
- Group findings by spec file for easy navigation

### Pitfalls to Avoid

- Do not confuse different uses of the same letter (e.g., $k$ as iteration counter vs $k$ as block index vs $k$ as cut index) -- notation-conventions explicitly defines these
- Do not flag the notation-conventions document itself as inconsistent with itself
- Do not flag symbols that are defined locally within a spec (e.g., a local variable in a derivation) as needing to be in notation-conventions

## Testing Requirements

### Unit Tests

N/A (audit ticket, no code changes)

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-005

## Effort Estimate

**Points**: 3
**Confidence**: High
