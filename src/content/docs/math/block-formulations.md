---
title: Block Formulation Variants
description: Parallel and chronological block formulations — how intra-stage time periods are handled in the LP, with water balance constraints, LP size, and storage dynamics.
---

## Purpose

This spec defines the two block formulations supported by Cobre — parallel and chronological — which determine how intra-stage time periods (e.g., peak, off-peak, or hourly resolution) are handled in the LP. The choice of block formulation affects water balance constraints, LP size, and the ability to model intra-stage storage dynamics.

For the variable and set definitions used here, see [notation conventions](/overview/notation-conventions). For how blocks integrate into the full LP, see [LP formulation](/math/lp-formulation). For the system elements that participate in block constraints, see [system elements](/math/system-elements).

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

| Aspect           | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| LP size          | Smaller (one water balance per hydro)                                        |
| Storage dynamics | End-of-stage only                                                            |
| Use case         | Long-term strategic planning                                                 |
| Configuration    | `block_mode: "parallel"` configured per stage via the `block_mode` parameter |

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

Each block chains its storage from the previous block's end storage $v_{h,k-1}$, so the per-block boundaries $v_{h,0} = \hat{v}_h, v_{h,1}, \ldots, v_{h,|\mathcal{K}|}$ form a within-stage storage trajectory.

:::note[Pre-commissioning hydros]
A hydro that has not yet entered service freezes each block's storage identity in chronological mode — $v_{h,k} - v_{h,k-1} = 0$ for every block — holding storage constant while the site does not yet exist. See [system elements](/math/system-elements) for the full commissioning lifecycle.
:::

### 2.4 Per-Block Production and Evaporation

Each block's hydro production (FPHA) and evaporation are evaluated on **that block's own average storage** $(v_{h,k-1} + v_{h,k})/2$, rather than the single stage-average storage that parallel mode shares across all blocks. A storage-dependent production or evaporation coefficient $\gamma_v$ therefore enters the block-$k$ constraint as $-\gamma_v/2$ on **both** bounding storage columns $v_{h,k-1}$ and $v_{h,k}$, so the block sees the mean of its entry and exit storage. This lets a chronological stage capture the head and evaporative-area variation that tracks the within-stage storage trajectory.

### 2.5 State Variable Definition

Only **end-of-stage storage** is a state variable:

$$
v_h = v_{h,|\mathcal{K}|}
$$

Inter-block storages $v_{h,k}$ for $k < |\mathcal{K}|$ are internal LP variables — not state variables. This ensures:

1. Cuts are computed with respect to end-of-stage storage only
2. State dimension does not increase with number of blocks

### 2.6 Cut Coefficient Extraction

In chronological mode, the incoming storage LP variable $v^{in}_h$ is pinned to its trial value $\hat{v}_h$ by equal column bounds (see [LP formulation §4a](/math/lp-formulation)). The **reduced cost** of that pinned column gives the storage cut coefficient directly:

$$
\pi^v_h = \bar{c}^{in}_h / d^{col}_h
$$

By the LP envelope theorem, this reduced cost automatically captures all downstream effects through the chain of inter-block water balances ($v^{in}_h \to v_{h,1} \to \ldots \to v_{h,|\mathcal{K}|}$), FPHA constraints, and generic constraints. No special handling or dual combination is required. See [Cut management](/math/cut-management).

### 2.7 Characteristics

| Aspect           | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| LP size          | Larger ($N_{hydro} \times (\lvert\mathcal{K}\rvert - 1)$ additional vars/cons)    |
| Storage dynamics | Intra-stage cycling modeled                                                       |
| Use case         | Short-term planning with storage cycling                                          |
| Configuration    | `block_mode: "chronological"` configured per stage via the `block_mode` parameter |

## 3. Comparison Summary

| Aspect               | Parallel Blocks       | Chronological Blocks                          |
| -------------------- | --------------------- | --------------------------------------------- |
| Water balance        | 1 per hydro per stage | $\lvert\mathcal{K}\rvert$ per hydro per stage |
| Inter-block storage  | Not modeled           | Explicit continuity                           |
| State variables      | End-of-stage only     | End-of-stage only                             |
| LP variables         | Fewer                 | More                                          |
| LP constraints       | Fewer                 | More                                          |
| Intra-stage dynamics | None                  | Full                                          |

## 4. Cross-Mode Policy Portability

A policy (the set of Benders cuts) trained under one block formulation can be loaded and simulated under the other — parallel-trained cuts drive a chronological simulation, and vice versa — and a policy trained with one block count can be simulated with a different one. This is a **guarantee**, not a coincidence: it follows directly from the state-variable definition in §2.5.

### 4.1 Why cuts are block-count- and block-mode-independent

Only end-of-stage storage is carried as state (§2.5); the interior block storages are internal LP columns. A cut approximates the future-cost function over the **incoming state vector**, whose dimension — end-of-stage storage plus any inflow lags and augmented slots — does not depend on how many blocks a stage carries or whether they are parallel or chronological. The storage cut coefficient is the reduced cost of the pinned incoming-state storage column (§2.6), whose identity is likewise block-structure-independent. The resulting cut coefficients are therefore **identical** across block modes and block counts, and loading them into a differently-blocked LP is exact, not approximate.

This is what unlocks a **coarse-train / fine-simulate** workflow: train the policy with a cheap block partition (a few parallel blocks) and simulate it with a finer chronological partition that resolves intra-stage cycling — the trained cost-to-go is reused unchanged.

### 4.2 What policy load validates

Policy load is validated unconditionally against the current study (the check cannot be disabled), but on **state identity, not block structure**:

- The **state-vector dimension** must match.
- A **per-slot entity manifest** embedded in each policy file must match — every state coordinate must attach to the same entity (same type, id, and sub-index) it was trained on, which rejects a policy that matches by dimension count but binds its coordinates to different plants.

There is **no** `block_mode`, block-count, or block-duration check anywhere in policy validation. See [output format](/reference/output-format) for the embedded manifest.

### 4.3 Training provenance

For traceability, `policy/metadata.json` records the mode the policy was trained under in `training_block_mode` (and `training_block_mode_per_stage` when it varies across stages). This is provenance only — it does not gate loading.

## 5. Note on Fine-Grained Temporal Resolution

The current block formulations use a single level of temporal decomposition within each stage: the user defines blocks with durations τ_k, and the LP operates at that resolution in both training and simulation.

A more sophisticated approach — used in commercial tools like PSR's SDDP (v17.3+) — decomposes each stage into **representative typical days**, each containing chronological hourly (or sub-hourly) blocks. This enables:

- Accurate modeling of daily cycling patterns (peak/off-peak storage arbitrage)
- Proper representation of intermittent renewable generation profiles
- Separate temporal resolutions for training (aggregated blocks) and simulation (full typical-day profiles)

This extension is out of scope for the current formulation because it requires:

- New input data schemas (day-type definitions, weights, hourly profiles)
- Separation of the objective time-weighting (day weight × block duration) from the water balance conversion (block duration only)
- Research into how day types chain within a stage (sequential vs. independent with weighted-average storage)
- Validation against reference implementations

## Cross-References

- [Notation conventions](/overview/notation-conventions) — variable and set definitions ($v_h$, $\hat{v}_h$, $\mathcal{K}$, $\tau_k$, $w_k$)
- [System elements](/math/system-elements) — hydro plant element description and decision variables
- [LP formulation](/math/lp-formulation) — how block formulations integrate into the assembled LP
- [Cut management](/math/cut-management) — cut coefficient extraction from pinned-column reduced costs
- [Hydro production models](/math/hydro-production-models) — production function constraints that operate within each block
