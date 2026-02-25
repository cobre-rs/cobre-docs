# ticket-010 Cross-Check Sizing Calculator Output Against Spec Values

## Context

### Background

Epic 01 ticket-003 produced a comprehensive parameter value consistency audit of the spec corpus, including running the LP sizing calculator and comparing its output against `production-scale-reference.md`. That audit found three discrepancies (D1: missing per-block inflow variable row in s3.1, D2: pumping multiplier missing in s3.1, D3: generation constant overcounting FPHA hydros in s3.2 and s3.3). All three were fixed in ticket-005. The calculator headline values (6,923 vars, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts) were confirmed matching.

This ticket performs a **post-fix verification pass** — re-running the calculator and systematically confirming that every value in `production-scale-reference.md` sections 3.1 through 3.4 now matches the calculator output under its default configuration, and that the counting formulas in section 3.3 are algebraically identical to the calculator's `calculate_sizing()` function. The output is a verification report confirming correctness (or documenting any remaining gaps).

### Relation to Epic

This is the first ticket in Epic 03 (Production Scale Reference Hardening). It establishes the ground truth baseline before ticket-011 changes the forward pass count and ticket-012 adds traceability annotations. Without a clean verification pass, changing values (ticket-011) would risk propagating errors.

### Current State

After ticket-005 fixes:

- **s3.1 table** now includes the per-block inflow variable row (`N_hydro * N_block = 160 * 3 = 480`) and the pumping formula uses `N_pump * N_block * 2 = 5 * 3 * 2 = 30`.
- **s3.2 table** now shows generation (constant) as `(N_hydro - N_fpha) * N_block = (160 - 50) * 3 = 330`.
- **s3.3 counting formulas** have the generation constant formula as `(N_HYDRO - N_HYDRO_FPHA) * N_BLOCK`.
- **s3.4 calculator output table** shows the five headline values matching the calculator.
- The LP sizing calculator at `~/git/powers/scripts/lp_sizing.py` produces with default config: 6,923 total variables, 20,788 total constraints, 5,788 active constraints, 1,120 state dimension, 128.7 MB cuts per stage.

## Specification

### Requirements

1. **Run the LP sizing calculator** (`~/git/powers/scripts/lp_sizing.py`) with its default production-scale parameters (160 hydros, 130 thermals, 6 buses, 10 lines, avg AR order 6, 15,000 cut slots) by passing an empty JSON config: `echo '{}' | python3 ~/git/powers/scripts/lp_sizing.py /dev/stdin`.

2. **Compare every individual variable count** from the calculator output against the corresponding row in section 3.1 table. For each row, verify: (a) the formula in column 2 matches the calculator's formula in `calculate_sizing()`, (b) the "Typical Count" in column 3 is consistent with the calculator's value at worst-case AR(12). Document the AR(12) vs AR(6) explained variance where applicable.

3. **Compare every individual constraint count** from the calculator output against the corresponding row in section 3.2 table. Same verification as step 2.

4. **Line-by-line formula comparison** of section 3.3 counting formulas against the `calculate_sizing()` function (lines 191-234 of `lp_sizing.py`). Verify algebraic equivalence for each term. Pay special attention to:
   - The AR dynamics constraint: spec has `N_HYDRO + N_HYDRO * AR_ORDER` as two terms; calculator has `n_hydros * (1 + avg_ar_order)` as one — these are algebraically equivalent.
   - The generation constant constraint: spec should now use `(N_HYDRO - N_HYDRO_FPHA) * N_BLOCK`; calculator uses `(n_hydros - n_hydros_with_fpha) * n_blocks`.

5. **Compare section 3.4 table** values against calculator output: total variables, total constraints, active constraints (total - cuts), state dimension, cuts memory per stage.

6. **Check section 2.1** state dimension formulas and numeric examples against the calculator's state dimension breakdown.

7. **Produce a verification report** as `findings-010.md` in the epic directory. The report should have:
   - A per-row comparison table for s3.1 (variables)
   - A per-row comparison table for s3.2 (constraints)
   - A formula-by-formula comparison table for s3.3
   - A headline values comparison table for s3.4
   - A state dimension comparison for s2.1
   - A clear PASS/FAIL verdict for each comparison
   - An overall verdict (CLEAN / HAS REMAINING ISSUES)
   - If issues are found, document them with the same discrepancy format used in findings-003 (D-number, location, impact)

### Inputs/Props

- LP sizing calculator: `~/git/powers/scripts/lp_sizing.py` (read-only, DO NOT MODIFY)
- Spec file: `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`
- Previous findings for reference: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-003.md`

### Outputs/Behavior

- Output file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-03-production-scale-hardening/findings-010.md`
- No spec files are modified by this ticket. This is a read-only verification audit.

### Error Handling

- If the calculator fails to run (e.g., Python version issue), document the error and attempt to manually verify the formulas by reading the calculator source code and computing the values by hand.
- If a discrepancy is found that was NOT in the original D1/D2/D3 set, flag it as a new finding with severity assessment. Do NOT fix it in this ticket — it will be addressed in a follow-up.

## Acceptance Criteria

- [ ] Given the LP sizing calculator at `~/git/powers/scripts/lp_sizing.py` with default config, when run with `echo '{}' | python3 ~/git/powers/scripts/lp_sizing.py /dev/stdin`, then the output matches the values in `production-scale-reference.md` section 3.4 table exactly (6,923 vars, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts/stage).
- [ ] Given the section 3.1 variable count table, when each row's formula and typical count are compared against the calculator's `calculate_sizing()` function, then every row either matches exactly or the variance is explained (AR(12) worst-case vs AR(6) average).
- [ ] Given the section 3.2 constraint count table, when each row is compared against the calculator, then every row either matches exactly or the variance is explained.
- [ ] Given the section 3.3 counting formulas, when compared term-by-term against `calculate_sizing()` lines 197-226, then every term is algebraically equivalent.
- [ ] Given the section 2.1 state dimension formulas, when the numeric examples (160 + 1920 = 2080 worst-case; 160 + 960 = 1120 typical) are compared against the calculator's state dimension breakdown, then they match.
- [ ] A findings report `findings-010.md` exists in the epic directory with per-section comparison tables and an overall PASS/FAIL verdict.

## Implementation Guide

### Suggested Approach

1. Run the calculator with default config and capture the full output.
2. Read `production-scale-reference.md` and extract every numeric value in sections 2.1, 3.1, 3.2, 3.3, and 3.4.
3. Read `lp_sizing.py` lines 191-234 (`calculate_sizing()` function) to get the exact formulas.
4. Build comparison tables:
   - For s3.1: one row per variable category, columns: spec formula, spec typical count, calculator formula, calculator value, match (Y/N/Explained).
   - For s3.2: same structure for constraints.
   - For s3.3: one row per formula term, columns: spec formula text, calculator code reference, algebraic equivalence (Y/N).
   - For s3.4: one row per headline metric, columns: spec value, calculator value, match.
5. Write the verification report.

### Key Files to Modify

- **Create**: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-03-production-scale-hardening/findings-010.md`
- **Read only**: `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`
- **Read only**: `~/git/powers/scripts/lp_sizing.py`

### Patterns to Follow

- Use the same findings format established in Epic 01 (see `findings-003.md`): severity labels, location references with line numbers, impact assessments.
- Use the same `PASS / FAIL / EXPLAINED VARIANCE` verdict structure.
- Reference line numbers in both the spec and the calculator code for traceability.

### Pitfalls to Avoid

- **Do not modify the calculator** — it is in a different repository (`~/git/powers/`) and is out of scope for this plan.
- **Do not modify the spec** — this ticket is verification only. Fixes, if any are needed, would be a separate ticket.
- **AR order variance is not a bug** — s3.1/s3.2 use worst-case AR(12) while the calculator uses average AR(6). The s3.4 note explicitly explains this. Document as "Explained Variance", not as a discrepancy.
- **The s3.1 "~7,500" total is approximate** — do not flag it as a discrepancy if the exact worst-case sum differs slightly. Focus on individual row correctness.
- **Contract counts**: notation-conventions says 5 each (import/export), calculator uses 3+2=5 total. This is a known explained variance from findings-003.

## Testing Requirements

### Unit Tests

Not applicable — this is a documentation audit ticket producing a findings report.

### Integration Tests

Not applicable.

### E2E Tests

- Verify `mdbook build` still succeeds after the ticket (no spec files are modified, so this is a sanity check only).

## Dependencies

- **Blocked By**: ticket-003 (parameter value catalog — completed), ticket-005 (D1/D2/D3 fixes — completed)
- **Blocks**: ticket-011, ticket-012

## Effort Estimate

**Points**: 2
**Confidence**: High
