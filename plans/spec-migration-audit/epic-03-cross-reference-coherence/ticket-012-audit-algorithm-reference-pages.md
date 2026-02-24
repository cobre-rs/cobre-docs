# ticket-012 Audit Algorithm Reference Pages for Consistency with Formal Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Verify that the 13 algorithm reference pages in `src/algorithms/` accurately represent the formal specs they summarize. The algorithm reference section provides accessible explanations for non-specialists — but they must not contradict the formal spec. Any factual difference between an algorithm reference page and its corresponding formal spec is a HIGH finding.

Key comparisons:

- `algorithms/sddp-theory.md` vs `specs/math/sddp-algorithm.md` — does the simplified description of convergence, forward/backward passes, and state variables match the formal spec?
- `algorithms/par-model.md` vs `specs/math/par-inflow-model.md` — is the PAR(p) formula in the algorithm reference consistent with the formal spec?
- `algorithms/risk-measures.md` vs `specs/math/risk-measures.md` — does the CVaR description match?
- `algorithms/cut-management.md` vs `specs/math/cut-management.md` + `specs/architecture/cut-management-impl.md` — are the cut selection strategy descriptions consistent?

## Anticipated Scope

- **Files likely to be modified**: Potentially `src/algorithms/*.md` if contradictions are found
- **Key decisions needed**:
  - What level of simplification is acceptable in algorithm reference pages? (accessible prose can omit details but must not get facts wrong)
  - If a simplified formula in an algorithm reference page differs from the formal spec's notation but represents the same concept, is this a finding?
- **Open questions**:
  - Were the algorithm reference pages written by the same author as the formal specs, or were they independently created?
  - Do any algorithm reference pages contain formulas that could become out of date if the formal spec evolves?
  - Are "Further reading" links from algorithm reference pages to formal specs all verified to be correct?

## Dependencies

- **Blocked By**: ticket-003 (math spec audit must complete before comparing algorithm reference to formal spec)
- **Blocks**: ticket-017 (remediation of contradictions)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
