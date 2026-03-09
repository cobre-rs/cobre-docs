# Equipment & Modeling

This page covers planned extensions to the set of power system equipment types and production models that Cobre can simulate. These features expand the physical scope of the solver to cover generation technologies and accuracy improvements not included in the initial release.

---

## C.1 GNL Thermal Plants

Gas Natural Liquefeito (GNL) thermal plants operate under complex fuel supply contracts with minimum take-or-pay obligations, variable spot market fuel costs, and start-up and shutdown constraints. The existing thermal model covers simple dispatchable units with fixed cost; GNL requires modeling the fuel inventory as an additional state variable and enforcing contract fulfillment constraints over time.

**Why it is deferred**: GNL modeling requires integer variables for unit commitment decisions. Extending SDDP to handle integer subproblems requires SDDiP infrastructure (Lagrangian relaxation or other duality handlers) — a significant architectural change that is out of scope for the initial release.

**Prerequisites**:

- Duality handler infrastructure for MIP subproblems (Lagrangian relaxation or strengthened Benders cuts)
- MIP solver integration (Gurobi, CPLEX, or an open-source alternative such as Cbc)
- GNL-specific data model extensions (fuel inventory, contract parameters)

**Estimated effort**: Large (3-4 weeks). Requires SDDiP infrastructure before GNL-specific modeling can begin.

**See also**: [Deferred Features §C.1](../specs/deferred.html#c1-gnl-thermal-plants)

---

## C.2 Battery Energy Storage Systems

Grid-scale batteries introduce a state-of-charge dimension alongside the existing reservoir storage state. Unlike hydro reservoirs, batteries have symmetric charge/discharge efficiency losses and a capacity that degrades over operational lifetime. The LP formulation is linear — no integer variables are required — making this a more tractable extension than GNL.

**Why it is deferred**: Batteries require a new state variable dimension (state of charge per battery), integration of charge and discharge flows into bus load balance constraints, and output schema additions for battery simulation results. The data model schemas for batteries are already fully defined, so the main effort is LP construction and testing.

**Prerequisites**:

- State variable infrastructure supports a dynamic number of storage dimensions
- Bus balance constraint generation handles battery charge and discharge contributions
- Output schema for battery simulation results implemented in `cobre-io`

**Estimated effort**: Medium (2-3 weeks). LP formulation is straightforward; the main effort is the data pipeline and realistic test cases.

**See also**: [Deferred Features §C.2](../specs/deferred.html#c2-battery-energy-storage-systems)

---

## C.5 Non-Controllable Sources (Wind/Solar)

> **Status: Implemented.** Non-controllable sources (wind, solar, and other variable renewable generation) are fully specified and implemented. The LP formulation — including generation bounds, curtailment variables, and bus balance participation — is in [Equipment Formulations §6](../specs/math/equipment-formulations.md). The entity schema, scenario pipeline, and curtailment penalty are also fully specified. This entry is retained for completeness.

**See also**: [Equipment Formulations §6](../specs/math/equipment-formulations.md), [Deferred Features §C.5](../specs/deferred.html#c5-non-controllable-sources-windsolar)

---

## C.6 FPHA Enhancements

The core Four-Point Head Approximation (FPHA) model for hydro generation is implemented with a constant turbine efficiency. Three accuracy extensions are deferred:

**Variable efficiency curves** — Replace the constant efficiency coefficient with a flow-dependent hill chart approximation. The efficiency varies with turbine load as a polynomial function of the normalized flow. This captures the operating curve of real turbines and improves generation estimates away from the nominal operating point.

**Pumped hydro production function** — Extend the FPHA to model reversible hydro units that can operate in both generation and pumping mode. The pumping mode uses a reversed head approximation. Mutual exclusion between generation and pumping is enforced via a high-penalty relaxation (the alternative of binary SOS1 constraints is deferred along with general MIP support).

**Dynamic FPHA recomputation** — Periodically refit the FPHA hyperplanes based on the observed operating region during training, narrowing the volume window to match where the algorithm actually explores. This improves approximation quality in practice but requires careful management of cut validity across refitting events.

**Why it is deferred**: Core FPHA is operational and validated. These extensions are accuracy improvements with problem-dependent benefit. Variable efficiency requires hill chart data infrastructure; pumped hydro requires the unified gen/pump production function; dynamic recomputation requires online hyperplane fitting with cut validity tracking.

**Prerequisites**:

- Core FPHA operational and validated against reference implementations
- Hyperplane fitting infrastructure supports refitting with a new volume window
- Performance baseline established to measure accuracy improvements

**Estimated effort**: Medium-Large (2-4 weeks total across all three sub-features).

**See also**: [Deferred Features §C.6](../specs/deferred.html#c6-fpha-enhancements), [Hydro Production Models](../specs/math/hydro-production-models.md)
