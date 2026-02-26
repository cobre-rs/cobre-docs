# ticket-014 Update Crate Specs to Reference New Trait Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Update the crate specification files (`src/crates/sddp.md`, `src/crates/solver.md`, `src/crates/stochastic.md`) to reference the new trait specs. The cobre-sddp crate owns the RiskMeasure, HorizonMode, CutSelectionStrategy, and StoppingRule traits. The cobre-solver crate owns the SolverInterface trait. The cobre-stochastic crate owns the SamplingScheme trait. Each crate spec should add a Key Concepts bullet point referencing the relevant trait spec(s), following the pattern established in `src/crates/comm.md` (which references communicator-trait.md).

## Anticipated Scope

- **Files likely to be modified**: `src/crates/sddp.md` (add 4 trait references), `src/crates/solver.md` (add 1 trait reference), `src/crates/stochastic.md` (add 1 trait reference)
- **Key decisions needed**: Where in each crate spec to place the new references (Key Concepts section, numbered sections, or both); whether to add new Key Concepts bullets or extend existing ones
- **Open questions**: Should the crate specs also reference the conformance test specs, or only the trait specs?

## Dependencies

- **Blocked By**: ticket-013 (cross-reference-index must be updated first to ensure consistency)
- **Blocks**: None within this epic

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
