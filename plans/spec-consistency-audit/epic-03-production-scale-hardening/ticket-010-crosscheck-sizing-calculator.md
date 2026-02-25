# ticket-010 Cross-Check Sizing Calculator Output Against Spec Values

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Run the LP sizing calculator (`~/git/powers/scripts/lp_sizing.py`) with the default production parameters and compare every output value against `production-scale-reference.md` sections 3.1, 3.2, 3.3, and 3.4. Also compare the counting formulas in section 3.3 line-by-line against the calculator's `calculate_sizing()` function to verify they encode the same arithmetic. Produce a detailed discrepancy report.

## Anticipated Scope

- **Files likely to be modified**: None (read-only audit producing a findings report)
- **Key decisions needed**:
  - How to handle the known AR order discrepancy (spec uses worst-case AR(12) in some tables, calculator defaults to avg AR(6))
  - Whether to run the calculator with both AR(6) and AR(12) configurations for comparison
- **Open questions**:
  - Does the calculator's `n_cons_hydro_ar_dynamics` formula (line 216: `n_hydros * (1 + avg_ar_order)`) match the spec's listing of two separate constraint categories ("Incremental inflow AR dynamics" = N_hydro and "Lagged incremental inflow fixing" = N_hydro x P)?
  - Does the calculator include the `inflow` variable in `n_vars_hydro_flow` (4 per hydro per block: q, s, g, inflow) while the spec section 3.1 lists inflow AR lags separately?

## Dependencies

- **Blocked By**: ticket-003 (provides the parameter value location catalog)
- **Blocks**: ticket-011, ticket-012

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
