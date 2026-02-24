# Block Formulation Variants

## Purpose

This spec defines the two block formulations supported by Cobre — parallel and chronological — which determine how intra-stage time periods (e.g., peak, off-peak, or hourly resolution) are handled in the LP. The choice of block formulation affects water balance constraints, LP size, and the ability to model intra-stage storage dynamics.

For the variable and set definitions used here, see [notation conventions](../overview/notation-conventions.md). For how blocks integrate into the full LP, see [LP formulation](lp-formulation.md). For the system elements that participate in block constraints, see [system elements](system-elements.md).

## 1. Parallel Blocks (Default)

In parallel blocks mode, all blocks within a stage are **independent** — there is no intra-stage storage dynamics.

### 1.1 Water Balance (Parallel)

A single water balance constraint spans all blocks:

$$
v_h = \hat{v}_h + \zeta \left[ a_h + \sum_{k \in \mathcal{K}} w_k \cdot \text{net\_flows}_{h,k} \right]
$$

where:

- $w_k = \tau_k / \sum_j \tau_j$ is the block weight
- $\text{net\_flows}_{h,k}$ = inflows from upstream − outflows − evaporation − withdrawal

This formulation assumes the reservoir can freely redistribute water across blocks within the stage.

### 1.2 Characteristics

| Aspect           | Description                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| LP size          | Smaller (one water balance per hydro)                                                                              |
| Storage dynamics | End-of-stage only                                                                                                  |
| Use case         | Long-term strategic planning                                                                                       |
| Configuration    | `block_mode: "parallel"` per stage in `stages.json` (see [Input Scenarios §1.5](../data-model/input-scenarios.md)) |

## 2. Chronological Blocks

In chronological blocks mode, blocks are **sequential** within each stage, enabling modeling of intra-stage storage dynamics (e.g., daily cycling patterns within a monthly stage).

### 2.1 Additional Variables

| Variable  | Domain                         | Units | Description                 |
| --------- | ------------------------------ | ----- | --------------------------- |
| $v_{h,k}$ | $[\underline{V}_h, \bar{V}_h]$ | hm³   | Storage at end of block $k$ |

The end-of-stage storage (state variable) is: $v_h = v_{h,|\mathcal{K}|}$

### 2.2 Block 1 Water Balance

$$
v_{h,1} = \hat{v}_h + \zeta_1 \left[ a_h \cdot w_1 + \text{net\_flows}_{h,1} \right]
$$

where $\zeta_1 = 0.0036 \times \tau_1$ is the time conversion for block 1.

### 2.3 Subsequent Blocks Water Balance

For $k = 2, \ldots, |\mathcal{K}|$:

$$
v_{h,k} = v_{h,k-1} + \zeta_k \left[ a_h \cdot w_k + \text{net\_flows}_{h,k} \right]
$$

### 2.4 State Variable Definition

Only **end-of-stage storage** is a state variable:

$$
v_h = v_{h,|\mathcal{K}|}
$$

Inter-block storages $v_{h,k}$ for $k < |\mathcal{K}|$ are internal LP variables — not state variables. This ensures:

1. Cuts are computed with respect to end-of-stage storage only
2. State dimension does not increase with number of blocks

### 2.5 Dual Extraction for Cuts

For cut generation, we need the dual of block 1's water balance (containing $\hat{v}_h$):

$$
\beta_h^{storage} = \pi^{wb}_{h,1}
$$

For the full cut coefficient definition (including FPHA and generic constraint contributions), see [Cut Management §2](cut-management.md).

> **FPHA dual propagation in chronological mode**: When a hydro uses the FPHA production model, the FPHA constraints involve $v^{avg}_h = (\hat{v}_h + v_h)/2$ where $v_h = v_{h,|\mathcal{K}|}$ (the last block's storage). The incoming storage $\hat{v}_h$ contributes to the FPHA constraint both directly (through $v^{avg}$) and indirectly (through the chain of inter-block water balances $\hat{v}_h \to v_{h,1} \to \ldots \to v_{h,|\mathcal{K}|}$). LP duality propagates this automatically: the dual of block 1's water balance $\pi^{wb}_{h,1}$ captures the full marginal value of incoming storage, including the downstream effect on FPHA constraints through the inter-block chain. No special handling is required beyond extracting block 1's dual.

### 2.6 Characteristics

| Aspect           | Description                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| LP size          | Larger ($N_{hydro} \times (\lvert\mathcal{K}\rvert - 1)$ additional vars/cons)                                          |
| Storage dynamics | Intra-stage cycling modeled                                                                                             |
| Use case         | Short-term planning with storage cycling                                                                                |
| Configuration    | `block_mode: "chronological"` per stage in `stages.json` (see [Input Scenarios §1.5](../data-model/input-scenarios.md)) |

## 3. Comparison Summary

| Aspect               | Parallel Blocks       | Chronological Blocks                          |
| -------------------- | --------------------- | --------------------------------------------- |
| Water balance        | 1 per hydro per stage | $\lvert\mathcal{K}\rvert$ per hydro per stage |
| Inter-block storage  | Not modeled           | Explicit continuity                           |
| State variables      | End-of-stage only     | End-of-stage only                             |
| LP variables         | Fewer                 | More                                          |
| LP constraints       | Fewer                 | More                                          |
| Intra-stage dynamics | None                  | Full                                          |

## 4. Policy Compatibility Validation

When running in **simulation-only**, **warm-start**, or **checkpoint resume** modes, the block configuration in the current input data must be compatible with the policy (cuts) that was previously trained. Specifically:

1. **`block_mode` must match** per stage — cuts trained with parallel blocks encode a different water balance dual structure than cuts trained with chronological blocks. Using a policy with mismatched block mode produces incorrect future cost evaluations.

2. **Block count and durations must match** per stage — the number of blocks, their ordering, and their durations (τ_k) affect the LP structure from which cut coefficients were derived. Any change invalidates the existing cuts.

This is a **hard validation error** — the solver must reject the run if any mismatch is detected.

> **Scope note**: Block configuration is one of many input properties that must be validated for policy compatibility. Other properties include the number of hydro plants, state variable dimensions, AR orders, and system topology. A comprehensive policy compatibility validation specification is planned — see [Deferred Features §C.9](../deferred.md). Requirements for what metadata the training phase must persist alongside the policy will be defined during the architecture review of [Training Loop](../architecture/training-loop.md), [Simulation Architecture](../architecture/simulation-architecture.md), and [Checkpointing](../hpc/checkpointing.md).

## 5. Future Work: Fine-Grained Temporal Resolution

The current block formulations use a single level of temporal decomposition within each stage: the user defines blocks with durations τ_k, and the LP operates at that resolution in both training and simulation.

A more sophisticated approach — used in commercial tools like PSR's SDDP (v17.3+) — decomposes each stage into **representative typical days**, each containing chronological hourly (or sub-hourly) blocks. This enables:

- Accurate modeling of daily cycling patterns (peak/off-peak storage arbitrage)
- Proper representation of intermittent renewable generation profiles
- Separate temporal resolutions for training (aggregated blocks) and simulation (full typical-day profiles)

This feature is deferred because it requires:

- New input data schemas (day-type definitions, weights, hourly profiles)
- Separation of the objective time-weighting (day weight × block duration) from the water balance conversion (block duration only)
- Research into how day types chain within a stage (sequential vs. independent with weighted-average storage)
- Validation against reference implementations

See [Deferred Features §C.10](../deferred.md) for the full description.

## Cross-References

- [Notation conventions](../overview/notation-conventions.md) — variable and set definitions ($v_h$, $\hat{v}_h$, $\mathcal{K}$, $\tau_k$, $w_k$)
- [System elements](system-elements.md) — hydro plant element description and decision variables
- [LP formulation](lp-formulation.md) — how block formulations integrate into the assembled LP
- [Cut management](cut-management.md) — cut coefficient extraction from water balance duals (§2.5)
- [Hydro production models](hydro-production-models.md) — production function constraints that operate within each block
- [Input scenarios](../data-model/input-scenarios.md) — per-stage `block_mode` field in `stages.json` (§1.5)
- [Training loop](../architecture/training-loop.md) — training phase that produces the policy (must persist block configuration metadata)
- [Simulation architecture](../architecture/simulation-architecture.md) — simulation phase that must validate policy compatibility
- [Checkpointing](../hpc/checkpointing.md) — checkpoint format that stores policy metadata for resume validation
- [Deferred features](../deferred.md) — policy compatibility validation (§C.9), fine-grained temporal resolution (§C.10)
