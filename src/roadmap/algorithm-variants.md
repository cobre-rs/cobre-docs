# Algorithm Variants

This page covers planned extensions to the core SDDP algorithm: alternative cut formulations, richer policy graph structures, and solver modes that address problem types not covered by the initial release.

---

## C.3 Multi-Cut Formulation

The standard SDDP implementation uses a single-cut formulation: one aggregated Benders cut is added per backward pass iteration. The multi-cut formulation instead generates one cut per scenario in the opening tree. This provides more information per iteration at the cost of a larger LP at each stage.

The trade-off is well-studied: multi-cut converges in fewer iterations but each iteration is slower and uses more memory. Single-cut is better for large scenario counts and risk-averse configurations with CVaR; multi-cut is better for small scenario counts and risk-neutral settings.

**Why it is deferred**: Multi-cut requires the LP builder to handle a variable number of future cost variables (one per scenario instead of one aggregate), a cut pool indexed by scenario, and adapted cut selection logic. The interaction with CVaR risk measures requires careful analysis to ensure the cut validity guarantees are preserved.

**Prerequisites**:

- LP builder supports a configurable number of future cost variables per stage
- Cut pool is indexed by scenario identifier
- Cut selection strategy is adapted for per-scenario pools

**Estimated effort**: Medium (2-3 weeks). The core algorithm change has wide-reaching effects on cut management.

**See also**: [Deferred Features §C.3](../specs/deferred.html#c3-multi-cut-formulation), [Cut Management](../specs/math/cut-management.md)

---

## C.4 Markovian Policy Graphs

The current SDDP implementation assumes stage-wise independence: the same scenario tree structure is used at every stage regardless of which scenario was realized in the previous stage. Markovian policy graphs relax this assumption by introducing a Markov chain over "regimes" (for example, wet/dry/normal inflow regimes), where the transition to the next regime depends on the current one.

In this extension, the policy graph has nodes indexed by `(stage, regime)` rather than just `stage`. Cuts are regime-specific — they are only shared within nodes of the same regime. The state space grows by a factor equal to the number of Markov states.

**Why it is deferred**: Markovian policy graphs substantially increase algorithm complexity. The forward pass must track and sample regime transitions. The backward pass generates cuts for each `(stage, markov_state)` node. The cut pool, binary format, and cut selection all need to be extended with regime indexing. The data model is already prepared (the `stages.json` schema includes optional `markov_states` fields), but the algorithmic work is large.

**Prerequisites**:

- Policy graph supports multi-node-per-stage structure
- Cut pool indexed by `(stage, markov_state)` tuples
- Forward and backward pass logic handles Markov regime transitions
- Scenario generation respects regime-dependent inflow distributions

**Estimated effort**: Large (3-4 weeks). Fundamental change to the policy graph and forward/backward pass logic.

**See also**: [Deferred Features §C.4](../specs/deferred.html#c4-markovian-policy-graphs), [Input Scenarios](../specs/data-model/input-scenarios.md)

---

## C.7 Temporal Scope Decoupling

The current SDDP formulation tightly couples three temporal scopes: the SDDP decomposition stage (where Benders cuts are generated), the physical time resolution of the constraints, and the stochastic process realization period. This forces a trade-off between fine temporal resolution (accurate physics, exponential cut growth) and coarse resolution (manageable cuts, poor short-term dynamics).

Temporal scope decoupling, inspired by the SPARHTACUS framework, allows each SDDP stage to contain multiple physical decision periods. Within a single stage, the LP chains multiple sub-period problems (period 1 feeds period 2, and so on). Cuts are still generated only at stage boundaries — they reference the state at the stage boundary, not intermediate periods — so the cut pool size does not increase even as temporal resolution within each stage improves.

The key advantage is that hourly or weekly resolution can be modeled within monthly SDDP stages without multiplying the cut pool size. The LP per stage grows proportionally to the number of sub-periods, but cut growth (the usual bottleneck) is unchanged.

**Why it is deferred**: This requires significant architectural changes to LP construction (multi-period sub-problem chaining within a stage), modified forward and backward pass logic, data model changes (a `periods` array within stages), and careful interaction with chronological block formulations.

**Prerequisites**:

- Core SDDP training loop validated and stable
- Chronological block formulation operational
- Performance profiling showing cut growth as the binding bottleneck

**Estimated effort**: Large (4-6 weeks). Fundamental change to LP construction, the data model, and the algorithm.

**See also**: [Deferred Features §C.7](../specs/deferred.html#c7-temporal-scope-decoupling)

---

## C.12 Complete Tree Solver

The complete tree solver replaces SDDP's sample-based forward and backward passes with deterministic traversal of an explicit scenario tree. Instead of sampling scenarios, all nodes in the tree are enumerated and a subproblem is solved at each node. The result is an exact solution to the stochastic program (relative to the given tree discretization), matching the behavior of CEPEL's DECOMP model.

The LP construction per node is identical to the SDDP stage subproblem — the complete tree mode reuses the existing LP builder. The difference is purely in the traversal logic (BFS/DFS enumeration of all tree nodes vs. random sampling) and cut aggregation (tree-weighted aggregation vs. sample-averaged aggregation).

**Why it is deferred**: Full tree traversal requires infrastructure for enumerating tree nodes, distributing them across MPI ranks, and storing results for potentially millions of nodes. The convergence criterion also changes: rather than a statistical lower bound, convergence means closing the Benders gap on the tree exactly.

**Prerequisites**:

- Core SDDP training loop operational
- Opening tree infrastructure supports variable per-stage branching counts
- External scenario integration validated
- Performance profiling establishes tractability bounds for target problem sizes

**Estimated effort**: Medium-Large (3-4 weeks). LP construction is reused; main effort is tree traversal, MPI node distribution, and result aggregation.

**See also**: [Deferred Features §C.12](../specs/deferred.html#c12-complete-tree-solver-integration), [Scenario Generation §7](../specs/architecture/scenario-generation.md)
