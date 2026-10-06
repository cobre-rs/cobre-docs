# Symbol Registry — cobre-docs math layer

Status: decided (G1, 2026-10-04)

The concept-to-symbol registry of the math layer (R20, R84, ADR-046). Gate G1 (spec §2.3) decides its glyphs, and
every later ticket that introduces or re-means a symbol keeps it current. It is a design document, not site content;
`overview/notation-conventions.md` is its reader-facing view.

## 1. Principles

Principles 1-4 are copied verbatim from spec §2.3 (gate G1); principles 5-6 from the sddp-specialist G1 contract
(`plans/v0.17.0-docs-sync/design/council/sddp-specialist.brief.md`).

1. LP and system symbols keep priority (most occurrences);
2. algorithm-side symbols yield;
3. config key names never constrain math symbols, because Configure tabs map them;
4. scoped reuse is allowed only where both meanings never appear on the same page, and is declared on the notation
   page.
5. β is the cut slope (the subgradient of V with respect to the incoming state, equal to the dual of its pinning
   bound); π is reserved for row duals.
6. State conventions plainly, without justification.

### 1.1 Declared scoped reuse

Principle 4's declarations as G1 decided them (§3). Each line is the sentence ticket-018 copies onto
`overview/notation-conventions.md` §1, so it is written for the reader: it names no planning tool, ticket or release
and states the convention without justification (principle 6). One kind of decided reuse is not listed yet: a reuse
that involves a meaning a later ticket introduces is declared by that ticket (ADR-046).

- $k$ indexes the blocks of a stage, $k \in \mathcal{K}$, in the System Modelling chapters and [Scenario Generation](/math/scenario-generation); it counts training iterations in [SDDP Algorithm](/math/sddp-algorithm), [Cut Management](/math/cut-management), [LP Warm-Start](/math/lp-warm-start), [Stopping Rules](/math/stopping-rules), [Upper Bound Evaluation](/math/upper-bound-evaluation), [Horizon Modes](/math/horizon-modes), [Discount Rate](/math/discount-rate), [The SDDP Framework in One Page](/overview/sddp-framework-overview) and the worked examples; in [PAR(p) Inflow Model](/math/par-inflow-model) it is the candidate order of the partial-autocorrelation test.
- $k_{max}$ is the number of slots in every anticipated thermal's commitment ring in [State Augmentation](/math/state-augmentation); in [Stopping Rules](/math/stopping-rules) it is the iteration limit.
- $\ell$ is the lag index of the autoregressive inflow model; in [Stopping Rules](/math/stopping-rules) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the leaf paths of an enumerated scenario tree.
- $\lambda$ is the risk-aversion weight of the convex-combination risk measure; in [PAR(p) Inflow Model](/math/par-inflow-model) $\lambda_i$ are the eigenvalues of the correlation matrix, and in [LP Formulation](/math/lp-formulation), [Block Formulations](/math/block-formulations) and [Hydro Production Models](/math/hydro-production-models) $\lambda_{h,b}$ is the share of cell $(h, b)$ in the turbine capacity of plant $h$.
- $L$ is the last filling stage of a filling hydro in [LP Formulation](/math/lp-formulation) and [Penalty System](/math/penalty-system); in [PAR(p) Inflow Model](/math/par-inflow-model) it is the lower-triangular Cholesky factor of the correlation matrix, in [State Augmentation](/math/state-augmentation) $L_h$ is the bucket depth of receiving plant $h$, and in [Upper Bound Evaluation](/math/upper-bound-evaluation) $L_t$ is the vector of per-state-component Lipschitz constants $L_{t,j}$ of the stage-$t$ value function.
- $\psi_{m,\ell}$ is the autoregressive coefficient of the inflow model ($\psi^*_{m,\ell}$ standardized; $\psi^{A*}_m$ and $\psi^A_m$ the annual coefficient of PAR(p)-A); in [Risk Measures](/math/risk-measures) $\psi(p, \mu)$ is the penalty function of the dual representation of a convex risk measure.
- A hat on a state quantity marks its incoming (trial) value ($\hat{x}_{t-1}$, $\hat{v}_h$, $\hat{a}_{h,\ell}$); a hat on a model parameter marks its sample estimate from the historical record ($\hat{\mu}_m$, $\hat{s}_m$, $\hat{\rho}_m(\ell)$); the two never decorate the same base symbol.
- $\tau_k$ is the duration of block $k$; in [Stopping Rules](/math/stopping-rules) $\tau$ is the bound-stalling window, and in [Horizon Modes](/math/horizon-modes) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the seasons of a cyclic policy graph.
- $\phi(v, q, s)$ is the exact hydro production function in [Hydro Production Models](/math/hydro-production-models); in [LP Formulation](/math/lp-formulation) and [State Augmentation](/math/state-augmentation) $\phi_{h,k}$ is the arrival density that spreads a maturing in-transit volume over the blocks of its arrival stage; in [PAR(p) Inflow Model](/math/par-inflow-model) $\phi$ names the AR-coefficient notation of other implementations, which that chapter writes $\psi$.
- $A_{ij}$ is an entry of the constraint matrix $A$ of the stage LP in [LP Layout and Scaling](/math/lp-layout-and-scaling); in [System Elements](/math/system-elements) and [Equipment Formulations](/math/equipment-formulations) $A_{r,k}$ is the available generation of non-controllable source $r$ in block $k$, in [PAR(p) Inflow Model](/math/par-inflow-model) $A_{h,t-1}$ is the annual regressor of PAR(p)-A, and in [State Augmentation](/math/state-augmentation) the bare $A$ is the number of anticipated thermals.
- $D_{b,k}$ is the load at bus $b$, block $k$, in [LP Formulation](/math/lp-formulation) and [System Elements](/math/system-elements), written $D$ and $D_b$ in the worked examples; in [LP Layout and Scaling](/math/lp-layout-and-scaling) $D_r$ and $D_c$ are the diagonal row and column scaling matrices.
- $i$ is the Benders cut index; in [PAR(p) Inflow Model](/math/par-inflow-model) $(i, j)$ index the rows and columns of the periodic Yule-Walker system, in [Scenario Generation](/math/scenario-generation) $i$ indexes the entities of a correlation group, in [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the vertices of the inner approximation, in [State Augmentation](/math/state-augmentation), [System Elements](/math/system-elements), [SDDP Algorithm](/math/sddp-algorithm), [Post-Study Boundary](/math/post-study-boundary) and the [Glossary](/reference/glossary) it indexes the anticipated thermal plants, in [LP Layout and Scaling](/math/lp-layout-and-scaling) it is the LP row index, and in [Hydro Production Models](/math/hydro-production-models) it indexes the storage points of the volume-height curve, $v^{(i)}$ and $h^{(i)}$, and of the FPHA fitting grid, $V_i$.
- $j$ is the thermal-plant index; in [Scenario Generation](/math/scenario-generation), [SDDP Algorithm](/math/sddp-algorithm) and the worked examples it indexes the openings of a stage, in [Cut Management](/math/cut-management) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes the components of the state vector, in [LP Layout and Scaling](/math/lp-layout-and-scaling) it is the LP column index, and in [Hydro Production Models](/math/hydro-production-models) it indexes the turbined-flow points $Q_j$ of the FPHA fitting grid.
- $K_i$ is the ring depth of anticipated thermal $i$ in [State Augmentation](/math/state-augmentation), [System Elements](/math/system-elements) and the [Glossary](/reference/glossary); in [LP Layout and Scaling](/math/lp-layout-and-scaling) and [Cut Management](/math/cut-management) the bare $K$ is the cost-scale factor.
- $M$ is the number of seasons in the cycle of the inflow model and of a cyclic policy graph; in [Hydro Production Models](/math/hydro-production-models) it is the number of FPHA hyperplanes of a plant, and in [SDDP Algorithm](/math/sddp-algorithm), [Discount Rate](/math/discount-rate) and [Upper Bound Evaluation](/math/upper-bound-evaluation) the number of forward-pass trajectories of an iteration.
- $m$ indexes the seasons of the inflow model, with $m(t)$ the season of stage $t$, and, in $\gamma^m$ and $\pi^{fpha}_m$, the planes $m \in \mathcal{M}_h$ of an FPHA model; in [SDDP Algorithm](/math/sddp-algorithm), [Discount Rate](/math/discount-rate) and [Upper Bound Evaluation](/math/upper-bound-evaluation) it indexes trajectories, forward-pass or simulated, and in [State Augmentation](/math/state-augmentation), [System Elements](/math/system-elements) and [Post-Study Boundary](/math/post-study-boundary) it is the delivery stage of an anticipated commitment.
- $N$ is the number of hydro plants; in [Scenario Generation](/math/scenario-generation) it is the uniform branching factor of the scenario tree ($N_t = N$), and in [Upper Bound Evaluation](/math/upper-bound-evaluation) the number of out-of-sample simulation scenarios.
- $n$ is a node of a policy graph or of an enumerated scenario tree; in [Horizon Modes](/math/horizon-modes) it counts cycle repetitions, in [LP Formulation](/math/lp-formulation), [System Elements](/math/system-elements), [Equipment Formulations](/math/equipment-formulations) and [Penalty System](/math/penalty-system) it is the transmission-line index, in [PAR(p) Inflow Model](/math/par-inflow-model) it is the dimension of the correlation matrix with eigenvalues $\lambda_1, \ldots, \lambda_n$, and in [Hydro Production Models](/math/hydro-production-models) the superscript of $h_{tail}^{(n)}$ indexes the segments of a piecewise-quartic tailrace curve.
- $p(\omega)$ is the probability of opening $\omega$; in [Hydro Production Models](/math/hydro-production-models) $p$ is the security-curve fraction of the maximum stored energy, and in [LP Formulation](/math/lp-formulation), [System Elements](/math/system-elements) and [Equipment Formulations](/math/equipment-formulations) $p_{y,k}$ is the pumped flow of station $y$.
- $Q_t$ is the optimal value of the stage-$t$ LP as a function of its incoming state; in [Hydro Production Models](/math/hydro-production-models) $Q$ is the turbined-flow coordinate of the FPHA fitting grid.
- $q_{h,k}$ is the turbined flow of hydro $h$; in [Upper Bound Evaluation](/math/upper-bound-evaluation) $q_{n \to n'}$ is the conditional probability of reaching child node $n'$ from node $n$ of an enumerated scenario tree; in [Risk Measures](/math/risk-measures) $q^*$ is the vector of CVaR tail weights.
- $r_h$ is the water-withdrawal target of hydro $h$ in [LP Formulation](/math/lp-formulation), [System Elements](/math/system-elements), [Block Formulations](/math/block-formulations) and [Penalty System](/math/penalty-system); in [PAR(p) Inflow Model](/math/par-inflow-model) and [Scenario Generation](/math/scenario-generation) $r_m$ is the standardized innovation scale of season $m$, in [Discount Rate](/math/discount-rate) $r_t$ is the annual discount rate that applies to stage $t$, and in [State Augmentation](/math/state-augmentation) $r_i(m)$ is the ring position of anticipated thermal $i$'s delivery at stage $m$.
- $s$ indexes the deficit segments of a bus in [LP Formulation](/math/lp-formulation), [System Elements](/math/system-elements) and [Penalty System](/math/penalty-system); in [State Augmentation](/math/state-augmentation) and [SDDP Algorithm](/math/sddp-algorithm) it indexes the slots of an anticipated thermal's commitment ring. The spillage $s_{h,k}$ and the standard deviations $s_m$, $s^{\text{load}}_{b,t}$ and $s^{nc}_r$ are distinct forms.
- $u_{h,k}$ is the diversion flow of hydro $h$, and $u$ indexes the unit groups of a (hydro, bus) cell, in the System Modelling chapters; in [SDDP Algorithm](/math/sddp-algorithm), [Risk Measures](/math/risk-measures), [Upper Bound Evaluation](/math/upper-bound-evaluation), [Horizon Modes](/math/horizon-modes), [Discount Rate](/math/discount-rate), [The SDDP Framework in One Page](/overview/sddp-framework-overview) and the [Glossary](/reference/glossary) $u_t$ is the control vector of the stage problem.
- $w_k$ is the weight of block $k$ in the System Modelling chapters; in [Upper Bound Evaluation](/math/upper-bound-evaluation) $w_m$ is the census weight of simulation scenario $m$, in [PAR(p) Inflow Model](/math/par-inflow-model) $w$ indexes the rolling windows of a season bucket, and in [Multi-Resolution Studies](/math/multi-resolution-studies) $w_{t,\mathcal{W}}$ is the share of lag period $\mathcal{W}$ covered by stage $t$.
- $y$ indexes the pumping stations in the System Modelling chapters; in [Scenario Generation](/math/scenario-generation) $y \in W$ is a window year of historical replay.
- $Z$ is the random cost a risk measure applies to; in [PAR(p) Inflow Model](/math/par-inflow-model) it is the standardised series on which the PAR(p)-A conditional partial autocorrelation conditions.
- $z$ is the vector of independent standard normal draws that the correlation factor maps to correlated noise; in [LP Formulation](/math/lp-formulation), [State Augmentation](/math/state-augmentation) and [LP Layout and Scaling](/math/lp-layout-and-scaling) $z_h$ is the realized-inflow column of hydro $h$.
- $\delta_{b,k,s}$ is the load deficit at bus $b$, block $k$, segment $s$; in [Hydro Production Models](/math/hydro-production-models) $\delta$ is the normalised mean-squared generation difference of two FPHA planes, and in [Scenario Generation](/math/scenario-generation) $\delta_t$ is the offset from the window year to the year of stage $t$'s season occurrence ($\delta^{(\ell)}$ for the $\ell$-th preceding occurrence of stage 1's season).
- $\varepsilon$ with an entity, stage or source index is a noise innovation ($\varepsilon_t$, $\varepsilon^{\text{load}}_{b,t}$, $\varepsilon^{nc}_r$) and with a text subscript a tolerance ($\varepsilon_{\text{viol}}$, $\varepsilon_{\text{stall}}$, $\varepsilon_{\text{abs}}$, $\varepsilon_{\text{rel}}$); in [Hydro Production Models](/math/hydro-production-models) the bare $\varepsilon$ is the merge tolerance of FPHA plane reduction.
- $\eta$ with an entity index is an efficiency ($\eta_h$ of a turbine, $\eta_n$ of a transmission line); in [Risk Measures](/math/risk-measures) and [The SDDP Framework in One Page](/overview/sddp-framework-overview) $\eta$ is the threshold variable of the CVaR minimization formula.
- $\theta_t$ is the future-cost epigraph variable, approximating $V_{t+1}(x_t)$; in [Hydro Production Models](/math/hydro-production-models) $\theta$ is the angle between the normals of two FPHA planes.
- $\kappa_{r,k}$ is the curtailment of non-controllable source $r$ in [System Elements](/math/system-elements) and [Equipment Formulations](/math/equipment-formulations); in [Hydro Production Models](/math/hydro-production-models) $\kappa$ is the intercept-only correction factor of precomputed FPHA planes, and in [Penalty System](/math/penalty-system) $\kappa = 10^6/3600$ is the number of (m³/s)·h in one hm³.
- $\mu$ with a season, bus or source index is a mean ($\mu_m$, $\mu^A_m$, $\mu^{\text{load}}_{b,t}$, $\mu^{nc}_r$); in [Risk Measures](/math/risk-measures) $\mu$ is a risk-adjusted probability vector.
- $\epsilon_{b,k}$ is the excess generation at bus $b$, block $k$, in [LP Formulation](/math/lp-formulation), [System Elements](/math/system-elements) and [Penalty System](/math/penalty-system); in [Cut Management](/math/cut-management) $\epsilon$ is the cut-activity tolerance of periodic pruning.
- $\mathcal{C}$ is the contract set, with $\mathcal{C}^{imp}$, $\mathcal{C}^{exp}$ and their per-bus subsets, in the System Modelling chapters; in [Horizon Modes](/math/horizon-modes) $\mathcal{C}_\tau$ is the set of stages that occupy season $\tau$ of a cyclic policy graph.
- $\mathcal{P}$ is the pumping-station set, with per-bus subsets $\mathcal{P}_b$, in the System Modelling chapters; in [Risk Measures](/math/risk-measures) it is the probability simplex of the scenario probabilities.
- $\mathcal{M}_h$ is the FPHA hyperplane set of hydro $h$; in [Risk Measures](/math/risk-measures) $\mathcal{M}(p)$, $\mathcal{M}_\alpha(p)$ and $\mathcal{M}^{EAVaR}(p)$ are risk sets of the dual representation of a convex risk measure.
- $\mathcal{X}_t(x_{t-1}, \omega_t)$ is the feasible set of the stage-$t$ state and control; in [Cut Management](/math/cut-management) $\mathcal{X}_t$ is the feasible state set on which a cut is valid.
- $I_t$ is the number of vertices stored at stage $t$ in [Upper Bound Evaluation](/math/upper-bound-evaluation); in [LP Formulation](/math/lp-formulation) $I_{h,k}$ is the inflow of hydro $h$ in block $k$ that a `hydro_inflow` term reads.
- $\xi_r$ is the availability ratio of non-controllable source $r$ in [System Elements](/math/system-elements), [Equipment Formulations](/math/equipment-formulations) and [Scenario Generation](/math/scenario-generation); in [Inflow Non-Negativity](/math/inflow-nonnegativity) $\xi_h$ is the noise-adjustment slack of the reference design.

## 2. Inventory

Column conventions:

- **Concept**: one row per math concept; a glyph that carries two concepts has two rows. Other written forms of the
  same concept are listed in this cell ("also written …") so that **Symbol** holds exactly one form.
  `UNRESOLVED: <quote>` marked a symbol whose meaning neither its page nor its notation entry determined; G1
  resolved the four such rows (§3).
- **Symbol**: the G1-decided LaTeX source form: where a decided §4 row renames the concept, its new form, with the
  form written today kept in §4 (ticket-016); otherwise the form as written today. A planned-only row (one no page
  carries yet) holds the form the spec or its cited ledger row writes; §3 records the form G1 decided for its
  introducing ticket.
- **Index set (1-based)**: the index set as the page states it; `0-based (NOT-09)` or `0-based (NOT-10)` names a
  page that uses a 0-based index.
- **Pages where used**: paths relative to `src/content/docs/`, without line numbers. `planned: <page> (ticket-NNN)`
  names a page on which ticket NNN of a later epic writes the symbol or its planned form (ADR-046); a planned-only
  row's cell starts with it, and an extended row lists its current pages first. A Notation = yes row whose
  notation-page entry waits for its introducing ticket carries `planned: overview/notation-conventions.md (ticket-NNN)`.
- **Owner page**: the spec §6.4 owner where one exists; otherwise the math page that formulates the concept, or
  `overview/notation-conventions.md` for the stage index, the entity index sets and the conventions it alone defines.
  When spec §6.1 assigns the concept to a page that E10 creates, that page is named in parentheses.
- **Configure key**: the input key (file and key path) that sets the symbol, verified at cobre v0.17.0; `—` when no
  single input key sets it.
- **Notation**: `yes` when the symbol is used on two or more pages or is listed in NOT-04, else `no`; a `planned:`
  page counts as a page.

Rows run by family: index sets and indices; parameters; decision and state variables; slacks; duals, reduced costs and
cut terms; functions and operators.

<!-- prettier-ignore-start -->
| Concept | Symbol | Index set (1-based) | Units | Pages where used | Owner page | Configure key | Notation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stage index: position of a study stage in ascending declared-id order; mapped to the declared id by `\text{stage\_id} = t - 1` only for dense ids (notation-conventions); policy-graphs says 'stage 0' (§5) and labels its d2 stage-chain nodes `0`, `1`, `2`; scenario-generation §4.5 calls the pre-study lag state 'stage 0'; discount-rate §5 writes the primed stage dummy `t'` (`\prod_{t'=1}^{t-1} d_{t' \to t'+1}`), and lp-formulation §8 writes it in the filling floor's `\sum_{t'=t+1}^{L}`; see the historical-period row for the second meaning of `t` on par-inflow-model; the toy pages number the stages `t = 1, 2, 3, 4` and write the stage as a subscript (toy-single-reservoir `a_1`, `v_1`, `\hat{v}_0`, `Q_4`, `\beta^v_4`; toy-four-reservoir `v_1`, `\hat v_{h,3}`, `Q_4`, on a page that also writes hydro numbers as subscripts, see the hydro row); the glossary writes `t` in `\tau(t)` | `t` | `t \in \{1, \ldots, T\}`; 0-based (NOT-09) in the 'stage 0' wording of policy-graphs §5 and scenario-generation §4.5 | — | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md, math/system-elements.mdx, math/hydro-production-models.mdx, math/penalty-system.mdx, math/policy-graphs.mdx, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, math/horizon-modes.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/lp-warm-start.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | overview/notation-conventions.md | `stages[].id` (`stages.json`; declared `stage_id`, of which `t` is the ascending-order position) | yes |
| Number of study stages (horizon length); see the total-stage-hours row for the second meaning of `T`; sddp-framework-overview writes `V_{T+1}(x) = 0`; the toy pages list `T` among the case parameters | `T` | — | — | math/lp-formulation.md, math/state-augmentation.md, math/policy-graphs.mdx, math/scenario-generation.mdx, math/horizon-modes.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | overview/notation-conventions.md | — (count of `stages[]`) | yes |
| Blocks of a stage: block index and block set, block count written `\lvert\mathcal{K}\rvert` (with bars on block-formulations); system-elements writes the block index `k` without the set (ticket-152a) | `k \in \mathcal{K}` | `k \in \mathcal{K}` | — | math/lp-formulation.md, math/state-augmentation.md, math/equipment-formulations.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/penalty-system.mdx, math/inflow-nonnegativity.md, math/scenario-generation.mdx, overview/notation-conventions.md | math/block-formulations.mdx | `stages[].blocks[]` (`stages.json`) | yes |
| Training iteration counter; horizon-modes writes it as the bound superscript of `\underline{z}^{\,k,\tau}`, and discount-rate in `\underline{z}^k`, `\bar{z}^k` and `\hat{x}_t^{k,m}`; sddp-algorithm writes `\underline{z}^k`, `\bar{z}^k`, `\underline{V}_t^k` and `k ← k+1` in its d2 loop diagram; cut-management §8.1 writes 'at iteration `k`'; lp-warm-start compares iterations `k` and `k+1`; stopping-rules writes `k \geq k_{max}`, `\underline{z}^{k-\tau+1}` and `\Delta_k`; upper-bound-evaluation §3 writes `Q_1^k`, `\text{gap}^k` and `k \to \infty`; see the forward-pass-index row for the `k` of sddp-algorithm §3.4; the toy pages write `\underline{z}^k`, `\bar{z}^k`, `\text{gap}^k` and `\hat{V}_t^k`, and toy-single-reservoir `\underline{z}^1` and `Q_1^1` at iteration 1, calling the cut-free start 'iteration 0'; ConvergencePlot's x-axis label writes 'iteration k' and `src/figures/convergence.ts` comments write 'SDDP iterations k' (`k = 0 … kMax`) | `k` | iterations `1, 2, \ldots` on the toy pages; 0-based (NOT-09) in the 'iteration 0' wording of toy-single-reservoir §6 and `k = 0 … kMax` in `src/figures/convergence.ts` (ConvergencePlot) | — | math/horizon-modes.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/lp-warm-start.mdx, math/risk-measures.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, src/components/ConvergencePlot.astro | math/sddp-algorithm.mdx | — | yes |
| Segment index of a piecewise-quartic tailrace family (superscript on `h_{tail}^{(n)}` and `c_0^{(n)}`); a declared scoped reuse of `n` (§1.1) | `^{(n)}` | segment `n` within a backwater family | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `segment_id` (`system/tailrace_curves.parquet`) | no |
| Bus set and bus index; toy-four-reservoir numbers the buses `b = 1, 2, 3, 4` (`\sum_{b=1}^{4}`, `D_1`) with no set symbol | `\mathcal{B}` | `b \in \mathcal{B}`; `b = 1, 2, 3, 4` on toy-four-reservoir | — | math/lp-formulation.md, math/system-elements.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx | overview/notation-conventions.md | — | yes |
| Buses hosting one of hydro `h`'s (hydro, bus) cells; cell bus index `b`; single-cell plant written with bars `\lvert\mathcal{B}_h\rvert = 1` on lp-formulation | `\mathcal{B}_h` | `b \in \mathcal{B}_h` | — | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/lp-formulation.md | `unit_groups[].bus_id` (`system/hydros.json`; derived) | yes |
| (hydro, bus) cell: the unit groups of plant `h` that share bus `b`; turbined flow and generation are tracked per cell (also written `(h,b)`); the `_hydro.notes` partial indexes the cells by `c` in inline code (`(Σ_c turbined_c) × ρ`) | `(h, b)` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h` | — | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, math/_impl/_hydro.notes.mdx | math/lp-formulation.md | `unit_groups[].bus_id` (`system/hydros.json`) | yes |
| Hydro plant set and hydro index; risk-measures writes the hydro index `h` alone, in `\pi_{t,h}(\omega)` and `\bar{\pi}_{t-1,h}`; toy-four-reservoir numbers the hydros `h = 1, 2, 3, 4` (`H1`–`H4`) with no set symbol and writes the number as a subscript (`v_1`, `a_1`, `\mu_1`, `\pi^v_3(\omega_2)`, `\bar\pi^{v,i}_1`) and as the first of two subscripts (`\hat v_{1,2}`, `v_{1,3}`: hydro, then stage) | `\mathcal{H}` | `h \in \mathcal{H}`; `h = 1, 2, 3, 4` on toy-four-reservoir | — | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md, math/system-elements.mdx, math/penalty-system.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/risk-measures.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx | overview/notation-conventions.md | — | yes |
| Operating hydros (can generate) | `\mathcal{H}^{op}` | `h \in \mathcal{H}^{op}` | — | math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (derived from the commissioning window and `filling`) | yes |
| Filling hydros (no generation) | `\mathcal{H}^{fill}` | `h \in \mathcal{H}^{fill}` | — | math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | `filling` (`system/hydros.json`) | yes |
| Hydros using the FPHA production model | `\mathcal{H}^{fpha}` | `h \in \mathcal{H}^{fpha}` | — | math/lp-formulation.md, overview/notation-conventions.md | math/hydro-production-models.mdx | `generation.model` = `"fpha"` (`system/hydros.json`) or `model` (`system/hydro_production_models.json`) | yes |
| Hydros using constant productivity (complement of `\mathcal{H}^{fpha}` within `\mathcal{H}^{op}`) | `\mathcal{H}^{const}` | `h \in \mathcal{H}^{const}` | — | math/lp-formulation.md, overview/notation-conventions.md | math/hydro-production-models.mdx | `generation.model` = `"constant_productivity"` (`system/hydros.json`) or `model` (`system/hydro_production_models.json`) | yes |
| Hydros with a cell at bus `b` | `\mathcal{H}_b` | `h \in \mathcal{H}_b` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `unit_groups[].bus_id` (`system/hydros.json`; derived) | yes |
| Thermal plant set and thermal index `j` | `\mathcal{T}` | `j \in \mathcal{T}` | — | math/lp-formulation.md, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Thermals connected to bus `b` | `\mathcal{T}_b` | `j \in \mathcal{T}_b` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `bus_id` (`system/thermals.json`; derived) | yes |
| Non-controllable source set and source index `r` | `\mathcal{R}` | `r \in \mathcal{R}` | — | math/lp-formulation.md, math/equipment-formulations.mdx, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Non-controllable sources connected to bus `b` | `\mathcal{R}_b` | `r \in \mathcal{R}_b` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `bus_id` (`system/non_controllable_sources.json`; derived) | yes |
| Transmission line set and line index; lp-formulation writes the line index as `n` (`n \in \mathcal{L}`, `f^+_{n,k}`), a declared scoped reuse of `n` (§1.1) | `\mathcal{L}` | `n \in \mathcal{L}` | — | math/lp-formulation.md, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Contract set (`\mathcal{C}^{imp} \cup \mathcal{C}^{exp}`) and contract index `c` | `\mathcal{C}` | `c \in \mathcal{C}` | — | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Import contracts | `\mathcal{C}^{imp}` | `c \in \mathcal{C}^{imp}` | — | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `type` = `"import"` (`system/energy_contracts.json`) | yes |
| Export contracts | `\mathcal{C}^{exp}` | `c \in \mathcal{C}^{exp}` | — | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `type` = `"export"` (`system/energy_contracts.json`) | yes |
| Import contracts connected to bus `b` | `\mathcal{C}^{imp}_b` | `c \in \mathcal{C}^{imp}_b` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `bus_id`, `type` (`system/energy_contracts.json`; derived) | yes |
| Export contracts connected to bus `b` | `\mathcal{C}^{exp}_b` | `c \in \mathcal{C}^{exp}_b` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `bus_id`, `type` (`system/energy_contracts.json`; derived) | yes |
| Pumping station set and station index `y` | `\mathcal{P}` | `y \in \mathcal{P}` | — | math/lp-formulation.md, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Pumping stations connected to bus `b` | `\mathcal{P}_b` | `y \in \mathcal{P}_b` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `bus_id` (`system/pumping_stations.json`; derived) | yes |
| Generic constraint set and constraint index `g` | `\mathcal{G}` | `g \in \mathcal{G}` | — | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md (authoring grammar owner: `reference/generic-constraints`) | — | yes |
| Deficit segments of bus `b` and segment index `s` | `\mathcal{S}_b` | `s \in \mathcal{S}_b` | — | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `deficit_segments[]` (`penalties.json` `bus`; per-bus override in `system/buses.json`) | yes |
| Thermal cost-segment index (`c^{th}_{j,s}`, `g_{j,k,s}`, `\bar{g}_{j,s}`); no set symbol; no page writes it (one generation column per thermal per block, ticket-078) | `s` | segment `s` of thermal `j` (no set symbol) | — | — | math/equipment-formulations.mdx | — (`system/thermals.json` carries one `cost_per_mwh` and no segment field) | no |
| FPHA hyperplane set of hydro `h` and plane index `m`; system-elements §5 names the plane set in words (ticket-152a) | `\mathcal{M}_h` | `m \in \mathcal{M}_h` | — | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `plane_id` (`system/fpha_hyperplanes.parquet`, precomputed planes) | yes |
| Number of FPHA hyperplanes of a plant ("a set of `M` linear hyperplanes") | `M` | — | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Upstream hydros of `h` and upstream index `i` (`q_{i,k}`, `s_{i,k}`, `u_{i,k}`); toy-four-reservoir §8 writes the upstream set as `\text{upstream}` with index `u` (`\sum_{u \in \text{upstream}}(q_u + s_u)`); see the diversion row for `u` | `\mathcal{U}_h` | `h' \in \mathcal{U}_h` | — | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx | math/lp-formulation.md | `downstream_id` (`system/hydros.json`; derived) | yes |
| PreFilling routing set: the hydros that are PreFilling at stage `t` and whose first non-PreFilling downstream plant is `h` (`crates/cobre-sddp/src/lp/builder/hydro_state.rs:20-54`); their local inflow, the flows diverted into them and the releases of their upstream plants enter `I_{h,k}` whole, at `1.0` in block `k`, with no travel-time share (`crates/cobre-sddp/src/lp/builder/generic_constraints.rs:319-334`), as they enter the water-balance row of `h` (lp-formulation §4 PreFilling Pass-Through); ledger HYD-11 | `\mathcal{U}^{pre}_h(t)` | `h \in \mathcal{H}`, stage `t`; members `h'` | — | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Plants downstream of `h` along the cascade, summed in topological order (index `h'`) | `\text{downstream}(h)` | `h' \in \text{downstream}(h)` | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `downstream_id` (`system/hydros.json`; derived) | no |
| Opening set of stage `t` and opening `\omega`; policy-graphs and scenario-generation write the per-node set `\Omega_n` (`\omega \in \Omega_n`, count `\lvert\Omega_n\rvert`, written with bars), which collapses to `\Omega_t` on the implicit stage chain; policy-graphs and cut-management write a child's set `\Omega_{n'}` (cut-management's count `\lvert\Omega_{n'}\rvert`, written with bars); horizon-modes and discount-rate write the realization `\omega_\tau`, `\omega_t`; sddp-algorithm writes the sampled realization `\omega_t` and labels three openings `ω⁽¹⁾`, `ω⁽²⁾`, `ω⁽³⁾` in its d2 backward-pass diagram; risk-measures writes the set bare as `\Omega` in its subgradient theorem and indexes probability components by `\omega` (`p_\omega`, `\mu_\omega`); upper-bound-evaluation writes `\omega_t`, `\omega_T` and the stage-1 set `\Omega_1`; determinism-guarantees writes the opening `\omega`; sddp-framework-overview writes the realized uncertainty `\omega_t`; the toy pages write `\omega` (`a_t(\omega)`, `Q_4(\omega)`, `\mathbb{E}_{\omega}`) and name the three openings `\omega_1`, `\omega_2`, `\omega_3`, the subscript numbering the opening, not the stage (see the opening-index row); the glossary indexes the opening probability by `\omega` (`p_\omega`) | `\Omega_t` | `\omega \in \Omega_t`; `\omega \in \Omega_n` per policy-graph node; openings numbered `\omega_1, \omega_2, \omega_3` on the toy pages | — | math/policy-graphs.mdx, math/scenario-generation.mdx, math/horizon-modes.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, math/determinism-guarantees.mdx, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/scenario-generation.mdx | `stages[].num_openings` (`stages.json`; count) | yes |
| Branching factor of the scenario tree (children per node); scenario-generation writes the uniform count `N` (`N_t = N`) and `N_{\text{openings}}`; it equals `\lvert\Omega_n\rvert` (written with bars) on the implicit stage chain; sddp-algorithm and cut-management write `N_{\text{openings}}` (`p(\omega) = 1/N_{\text{openings}}`), and sddp-algorithm's d2 diagrams label the count `N` ('evaluate N openings', 'all N openings'); the toy pages tabulate the openings per stage as `N` and write the uniform weight `p = 1/N`; the glossary writes `p_\omega = 1/N` | `N_t` | — | — | math/scenario-generation.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/scenario-generation.mdx | `stages[].num_openings` (`stages.json`) | yes |
| Effective opening count of a `historical_residuals` stage: the branching factor clamped to the window count, `N^{\rm eff}_t = \min(N_t, \lvert W\rvert)`, and, when a class is external in training, also to the stage's number of external scenarios, so that it is the smallest of the three (scenario-generation §2.5 and §4.2; `crates/cobre-stochastic/src/tree/generate.rs:115-149`), with a clamp warning, the stage's openings drawing windows independently and with replacement (spec §3.4; ledger STO-03) | `N^{\rm eff}_t` | stage `t` | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — (`stages[].num_openings` in `stages.json`, clamped to the window count and, under an external class, to the external scenario count) | no |
| Policy-graph node: it has a unique id, sits at a study stage `t(n)`, may point into that stage's realization column and may carry a label; every non-leaf node owns its own cut pool and all leaves share one terminal pool; `n'` is a child node of `n` (`P(n \to n')`, `p_{n'}(\omega)`, `V_{n'}`), and policy-graphs, cut-management and sddp-algorithm write the successor-opening pairs `(n', \omega)` | `n` | node `n` of the policy graph | — | math/policy-graphs.mdx, math/scenario-generation.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md | math/policy-graphs.mdx | `policy_graph.nodes[]` (`stages.json`; absent ⇒ one implicit node per stage) | yes |
| Stage a policy-graph node sits at; policy-graphs also writes `t(n')` for a child `n'` (`d_{t(n') \to t(n')+1}`) and `V_{t(n)+1}` | `t(n)` | — | — | math/policy-graphs.mdx | math/policy-graphs.mdx | `policy_graph.nodes[].stage_id` (`stages.json`; declared stage id) | no |
| Opening index: position of an opening in a stage's opening tree, selecting the noise vector `\varepsilon_{t,j}`; sddp-algorithm §3.1 draws the forward-pass opening index `j` from the fixed opening tree; the toy pages write the opening number as the subscript of `\omega` (`\omega_1`, `\omega_2`, `\omega_3`) | `j` | `j \in \{1, \ldots, N_t\}` (§2.3) and `j \in \{1, \ldots, N_{\text{openings}}\}` (§3.2) on scenario-generation, and `j \in \{1, \ldots, N_{\text{openings}}\}` on sddp-algorithm §3.1; `\{1, 2, 3\}` as the subscript of `\omega` on toy-single-reservoir and toy-four-reservoir | — | math/scenario-generation.mdx, math/sddp-algorithm.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/scenario-generation.mdx | — | yes |
| Noise-vector dimension (entries per opening noise vector) in the opening-tree element count `\sum_t N_t \times \text{dim}` | `\text{dim}` | — | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Last-stage branching count of the deterministic-trunk tree, `N_T = K` (the number of external scenario branchings); no page writes it (scenario-generation §6 declares the final-stage branching as a terminal fan of sibling nodes, ticket-090) | `K` | — | — | — | math/scenario-generation.mdx | — | no |
| Number of openings a Monte Carlo backward-sampling variant would draw with replacement (stated as not implemented); sddp-algorithm §3.2 writes 'sample `n_{\text{sample}}` openings instead of the full tree' | `n_{\text{sample}}` | — | — | math/scenario-generation.mdx, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/scenario-generation.mdx | — | yes |
| Historical window pool and window year: the admissible years `y \in W` for historical replay, `y` being the occurrence year of stage 1's season; a year is admissible when every hydro has an observation for every study stage's season occurrence and for the `n_{\text{pre}} \le p` preceding calendar occurrences, which gate admissibility only (spec §3.4; ledger STO-01, in the ledger's glyphs `k` and `r`: `W = \{y : \forall h, t\ a^{obs}_h(y + \delta_t, m(t)) \text{ exists},\ \forall k \le r\ a^{obs}_h(y + \delta^{(k)}, m^{(k)}) \text{ exists}\}`); forward selection draws window `H(\text{iteration}, \text{trajectory}) \bmod \lvert W\rvert` (spec §3.4; ledger STO-02); at the tag `discover_historical_windows` keeps the candidate years whose observation sequence is complete (`crates/cobre-stochastic/src/sampling/window.rs:104-164`; `crates/cobre-stochastic/src/sampling/mod.rs:708-776`) | `W` | window year `y \in W` | — | math/scenario-generation.mdx | math/scenario-generation.mdx | `training.scenario_source.historical_years` or `simulation.scenario_source.historical_years` (`config.json`; candidate years, default every year of `scenarios/inflow_history.parquet`) | no |
| Occurrence-year offset of stage `t`: the year of stage `t`'s season occurrence minus the window year, so window `y` reads stage `t`'s observation at year `y + \delta_t` (ledger STO-01); scenario-generation also writes `\delta^{(\ell)}` for the offset of the `\ell`-th calendar predecessor occurrence; at the tag the offsets are `year - y0` (`crates/cobre-stochastic/src/sampling/mod.rs:729-742,752-758`); see the deficit, plane-reduction and cycle-tolerance rows for the other meanings of `\delta` | `\delta_t` | stage `t` | years | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Season of the `\ell`-th calendar predecessor occurrence of stage 1's season (monthly: the previous month; weekly: the previous 7 days; custom: the previous season definition in id order), whose observation at year `y + \delta^{(\ell)}` gates the admissibility of window `y` (ledger STO-01); at the tag the calendar walk records the season id of each predecessor occurrence, up to the applied PAR order (`crates/cobre-stochastic/src/sampling/mod.rs:744-773`); see the season row for `m(t)` | `m^{(\ell)}` | `\ell \in \{1, \ldots, n_{\text{pre}}\}` | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — (derived from the stage calendar and `season_definitions` in `stages.json`) | no |
| Number of preceding calendar occurrences of stage 1's season whose observations gate window admissibility, `n_{\text{pre}} \le p` with `p` the applied PAR order (spec §3.4; ledger STO-01, which writes the count `r`), `n_{\text{pre}} < p` when the calendar walk ends early; at the tag the walk visits `\ell = 1, \ldots, n_{\text{pre}}`, with `p` the largest applied PAR order, and stops at the first occurrence the calendar cannot place (`crates/cobre-sddp/src/setup/scenario_libraries.rs:53-63`; `crates/cobre-stochastic/src/sampling/mod.rs:744-773`); the count is written `n_{\text{pre}}` because `r` would share scenario-generation with the innovation scale `r_m` (§3 `r` and `n` rows) | `n_{\text{pre}}` | — | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — (bounded by the applied PAR order) | no |
| Number of forward-pass trajectories per iteration; cut-management §5 and the upper-bound-evaluation appendix (Computational Considerations) write `\text{forward\_passes}` in `\mathcal{O}(\text{iterations} \times \text{forward\_passes})`; sddp-algorithm writes the count as `M` (see the upper-bound trajectory-count row) | `N_{\text{forward\_passes}}` | — | — | math/cut-management.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/sddp-algorithm.mdx | `training.selection.forward_passes` with `training.selection.method` = `"sampled"` (`config.json`) | yes |
| Number of simulated trajectories averaged in the upper-bound estimate at iteration `k` (see the season-cycle and FPHA plane-count rows for the other meanings of `M`); sddp-algorithm writes `M` for the forward-pass trajectories of an iteration (§3.1, §3.4; 'sample M trajectories' and 'sample M paths' in its d2 diagrams), whose costs this estimate averages (the count `N_{\text{forward\_passes}}`); upper-bound-evaluation §2 writes the sampled forward pass's per-scenario weight as `1/M` | `M` | — | — | math/discount-rate.mdx, math/sddp-algorithm.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/upper-bound-evaluation.md | `training.selection.forward_passes` with `training.selection.method` = `"sampled"` (`config.json`) | yes |
| Simulated-trajectory index of the upper-bound estimate (`\sum_{m=1}^{M}`, `\hat{x}_t^{k,m}`); sddp-algorithm §3.3 writes `\sum_{m=1}^{M}` and `x_t^{(m)}` | `m` | `m \in \{1, \ldots, M\}` | — | math/discount-rate.mdx, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/upper-bound-evaluation.md | — | yes |
| Season of stage `t` (notation-conventions: the stage's resolved season, with season arithmetic modulo `M` on `\{1, \ldots, M\}`); inflow-nonnegativity indexes the season directly as `m`; par-inflow-model writes the season index `m` and `m(t)`, with seasons `m = 1, \ldots, M` in its §4.1 closure, 'season 0 = season `M`' in §3.4, 'season `0` is season `M`' in §3.5 and `\bmod M` season arithmetic in §4.1 and §3.5; horizon-modes writes the cyclic-graph season as `\tau`, with season function `\tau(t) = (t - 1) \bmod P + 1`; the upper-bound-evaluation appendix (Cyclic Mode) organizes the reserved cyclic vertices by season `\tau`; the glossary writes the cyclic-mode season function `\tau(t) = (t-1) \bmod P + 1` and the season `m` of the per-season order `p_m` | `m(t)` | `m \in \{1, \ldots, M\}`; `\tau \in \{1, \ldots, P\}` on horizon-modes | — | math/lp-formulation.md, math/block-formulations.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, math/horizon-modes.md, math/upper-bound-evaluation.md, overview/notation-conventions.md, reference/glossary.md | math/par-inflow-model.mdx | `stages[].season_id` (`stages.json`) | yes |
| Season cycle length of the PAR(p) model; horizon-modes writes the cyclic-graph cycle length as `P` (stages per cycle) (see the FPHA plane-count and upper-bound trajectory-count rows for the other meanings of `M`); the glossary writes the cycle length as `P` | `M` | — | — | math/par-inflow-model.mdx, math/horizon-modes.md, overview/notation-conventions.md, reference/glossary.md | math/par-inflow-model.mdx | — (number of `season_definitions.seasons[]`) | yes |
| Stages occupying season `\tau` of a cyclic policy graph, `\mathcal{C}_\tau = \{t : \tau(t) = \tau\}`; a cut generated at any of them is valid for all (reserved cyclic design) | `\mathcal{C}_\tau` | `\tau \in \{1, \ldots, P\}` | — | math/horizon-modes.md | math/horizon-modes.md | — | no |
| Number of cycle repetitions in the convergence limit `\lim_{n \to \infty} d_{\text{cycle}}^{\,n} \cdot V_t(x) = 0` | `n` | — | — | math/horizon-modes.md, overview/notation-conventions.md | math/horizon-modes.md | — | yes |
| Period index of the historical inflow record in the fitting estimators (`\sum_{t: m(t) = m}`, `a_{h,t-\ell}` in §3.2 and §3.4, the rolling window `A_t` in §7.3): a chronological position in the history, not a study stage | `t` | historical period `t`, season `m(t)` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Historical observations of season `m`, `Y_m = \{a_{h,t} : m(t) = m\}` | `Y_m` | `m \in \{1, \ldots, M\}` | m³/s | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Number of historical observations of season `m` (divisor `1/N_m`; PACF threshold `z_{0.975} / \sqrt{N_m}`) | `N_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx, overview/notation-conventions.md, reference/bibliography.md | math/par-inflow-model.mdx | — (`estimation.min_observations_per_season` in `config.json` is a recommended minimum: below it estimation proceeds with a warning) | yes |
| Number of year-aligned valid pairs at lag `\ell` for reference season `m` (autocovariance divisor `1/N_m^{(\ell)}`) | `N_m^{(\ell)}` | `m \in \{1, \ldots, M\}`, lag `\ell` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Number of annual-regressor values in the season-`m` bucket (divisor `1/N^A_m` of `\hat{\mu}^A_m` and `\hat{\sigma}^A_m`) | `N^A_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Historical record length, compared with the correlation-matrix dimension when estimating spatial correlation | `N^{\text{hist}}` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Quarter of the duration-weighted aggregation, as the set of its fine-resolution months, with month index `m \in Q` (weight `d_m`, observation `a^{(M)}_m`); no page writes it (ticket-103) | `Q` | `m \in Q` | — | — | math/multi-resolution-studies.md | — | no |
| Lag period: one occurrence of a stage's season period, the calendar window the season covers in one cycle (one particular month or quarter); the stages that overlap it accumulate one lag value, the duration-weighted mean of their realized inflows with shares `w_{t,\mathcal{W}}`; its duration in hours is `\lvert \mathcal{W} \rvert`; a distinct glyph from the historical window pool `W` of scenario-generation | `\mathcal{W}` | one occurrence of the season `m(t)` of stage `t` | — | math/multi-resolution-studies.md | math/multi-resolution-studies.md | — | no |
| AR lag index; state-augmentation §4 writes `\ell \in \{1, \ldots, P^{\max}\}`; par-inflow-model also writes the lag as `k` (§3.6 PACF order, §7.5 conditional-FACP lag) and the dummy lag `\ell'` (§4.1 closure, §3.5 note); see the leaf-path row for the `\ell` of upper-bound-evaluation and stopping-rules; the glossary writes the lagged inflow `a_{h, t-\ell}`; `_par.io` requires contiguous lags `1, 2, \ldots, p` and `_par.notes` sums over `\ell` (`\sum_\ell \psi^*_{m,\ell}\rho_m(\ell)`); par-inflow-model sums the composed-influence recursion over the dummy lag `\ell'` | `\ell` | `\ell \in \{1, \ldots, P_h\}`; `\ell \in \{1, \ldots, P^{\max}\}` on state-augmentation §4 and sddp-algorithm §5.1; lags `1, 2, \ldots, p` on `_par.io` | — | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md, reference/glossary.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx | math/par-inflow-model.mdx | `lag` (`scenarios/inflow_ar_coefficients.parquet`, 1-based) | yes |
| AR order of hydro `h` (system-elements writes only the model name PAR(p); ticket-152a); inflow-nonnegativity writes `p` (`\sum_{\ell=1}^{p}`); par-inflow-model writes `p` and the per-season order `p_m` (`pₘ` in its d2 diagram); scenario-generation writes PAR(p); sddp-algorithm writes AR(`P_h`) in its state table; cut-management writes the order condition PAR(p > 0); the toy pages write `p = 0` (the '0-order' model), `p_m = 0` and `p \geq 1`; the glossary writes `p`, `p_m`, `p = 0`, `p_m = 0` and `p \geq 1`; `_par.io` writes PAR(`p`), the AR order `p` and 'any AR order is `>0`'; see the opening-probability row for the `p = 1/3` of the toy pages | `P_h` | — | — | math/lp-formulation.md, math/state-augmentation.md, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md, math/_impl/_par.io.mdx | math/par-inflow-model.mdx | — (bounded by `estimation.max_order` in `config.json`) | yes |
| Order-selection ceiling: the largest order the PACF loop fits (`k = 1, \ldots, p_{max}`) | `p_{max}` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | `estimation.max_order` (`config.json`) | no |
| Largest per-season AR order of a hydro, `p_{\max} = \max_m p_m`, the lag range of the periodic-ACF closure | `P_h` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Candidate AR order of the PACF order-selection loop: the order-`k` Yule-Walker fit whose last coefficient `\hat{\psi}^*_{m,k}` is the periodic PACF at lag `k` (also the conditional-FACP lag on the PAR(p)-A path) | `k` | `k \in \{1, \ldots, p_{max}\}` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — (bounded by `estimation.max_order` in `config.json`) | no |
| Upper index of the lag sum in the noise inversion: the width of the AR-dynamics row, which equals the classical AR order or, when any hydro carries the annual component, the full lag width (twelve lags, or the classical order if larger) | `P_h` | — | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Row and column index of the periodic Yule-Walker matrix `[\mathbf{R}_m]_{i,j}` and right-hand side `[\hat{\boldsymbol{\rho}}_m]_i`; entry `(i, j)` correlates the lags `i` and `j` | `(i, j)` | `1 \leq i, j \leq p` on par-inflow-model §3.5 | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Entity index within a correlation group (`z_i`, `\varepsilon_i`) | `i` | entity `i` of the group | — | math/scenario-generation.mdx | math/scenario-generation.mdx | `profiles.<name>.correlation_groups[].entities[]` (`scenarios/correlation.json`) | no |
| Lag depth of the inflow-lag state, uniform across hydros: the largest AR order, at least twelve when any hydro carries the annual component, widened to the deepest boundary-cut lag when a terminal boundary is loaded (`crates/cobre-stochastic/src/par/precompute.rs:203-212`; `crates/cobre-sddp/src/setup/mod.rs:925-936`; ticket-147); see the last-filling-stage row for the second meaning of `L`; cut-management writes `N(1+P^{\max})`; sddp-algorithm writes `N_{hydro} \cdot P^{\max}` in its state table and `\ell \in \{1, \ldots, P^{\max}\}` in §5.1 | `P^{\max}` | — | — | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Last filling stage of a filling hydro, the stage before its entry stage | `L` | — | — | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | `entry_stage_id` (`system/hydros.json`; derived) | yes |
| Number of operating hydros, `N = \lvert\mathcal{H}\rvert` (written with bars on lp-formulation); block-formulations writes `N_{hydro}`; sddp-algorithm writes `N_{hydro}` and `N_{hydro} \cdot P^{\max}` in its state table; cut-management writes `N(1+P^{\max})` | `N` | — | — | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md, math/block-formulations.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md | math/lp-layout-and-scaling.md | — | yes |
| Number of anticipated thermals | `A` | — | — | math/state-augmentation.md | math/state-augmentation.md | — | no |
| Anticipated thermal plant index; the glossary writes 'plant `i`' without an index set | `i` | `i \in \{1, \ldots, A\}` | — | math/state-augmentation.md, math/system-elements.mdx, math/sddp-algorithm.mdx, overview/notation-conventions.md, reference/glossary.md | math/state-augmentation.md | — | yes |
| Slot of an anticipated plant's commitment ring; the delivery at stage `m` holds slot `s_i(m) = r_i(m) \bmod k_{max}` (state-augmentation §5 `### Hold Ring`; `crates/cobre-sddp/src/lp/indexer/state_space.rs:569-600`); reference/output-format writes the checkpoint `subindex` of slot `s` as `(s - 1) \bmod k_{max}`; system-elements names the slots in words, with no glyph (ticket-152) | `s` | residues `s \in \{0, \ldots, k_{max} - 1\}` | — | math/state-augmentation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md, reference/output-format.mdx, reference/output/policy.mdx | math/state-augmentation.md | — | yes |
| Ring depth of anticipated plant `i`: the lead for a stage-count lead; for a physical lead the largest number of commitments the plant's ring holds at the start of any stage, the first stage after the study included, counting the deliveries at or after that stage decided at an earlier stage, with those decided before the study held from the first stage (state-augmentation §5 `### Hold Ring`; `ring_depth`, `crates/cobre-sddp/src/lead_time/mod.rs:452-473`, its occupancy sweep `:675-747`; `crates/cobre-sddp/src/setup/mod.rs:1197-1221`; ticket-147); the glossary's Lead row ('Lead (`K_i`)') writes `K_i` as the plant's ring depth, equal to the lead under `lead_stages` | `K_i` | anticipated plant `i` | — | math/state-augmentation.md, math/system-elements.mdx, overview/notation-conventions.md, reference/glossary.md | math/state-augmentation.md | `anticipated_config.lead_stages` or `anticipated_config.lead_time_hours` (`system/thermals.json`) | yes |
| Maximum lead (ring depth reserved per plant), `K_{\max} = \max_i K_i`. Replaced by `k_{max}` (§4 row 124, ticket-063); no page writes it. | `K_{\max}` | — | stages | — | math/state-augmentation.md | — | no |
| Number of slots in every anticipated plant's commitment ring, `k_{max} = \max_i K_i` (state-augmentation §5 `### Hold Ring`); at the tag `ring_size` widens the anchored depth, the largest `ring_depth` over the plants, to the deepest `K_i` (`crates/cobre-sddp/src/lead_time/mod.rs:452-473,570-580,616-621`; `crates/cobre-sddp/src/lp/indexer/state_space.rs:280`), which is `\max_i K_i` because a stage-count plant's ring depth never exceeds its lead (`crates/cobre-sddp/src/setup/mod.rs:1197-1221`); delivery `m` holds slot `s_i(m) = r_i(m) \bmod k_{max}`; see the iteration-limit row for the `k_{max}` of stopping-rules and the maximum-lead row for the replaced `K_{\max}`; reference/output-format writes it in the checkpoint slot `(s - 1) \bmod k_{max}` of the `subindex` column | `k_{max}` | — | — | math/state-augmentation.md, overview/notation-conventions.md, reference/output-format.mdx, reference/output/policy.mdx | math/state-augmentation.md | — (derived from `anticipated_config.lead_stages` or `anticipated_config.lead_time_hours` in `system/thermals.json`) | yes |
| Ring position of the delivery at stage `m` of anticipated plant `i`: `m` on the study stages; past the horizon the plant's deliveries decided before the study come first and hold no ring position, and `r_i` continues from `T + 1` over the later ones; the delivery holds slot `s_i(m) = r_i(m) \bmod k_{max}`, so the slot maturing at study stage `t` is `t \bmod k_{max}` (state-augmentation §5 `### Hold Ring`; `ring_index`/`physical_target`, `crates/cobre-sddp/src/lead_time/mod.rs:494-525`; `crates/cobre-sddp/src/lp/indexer/state_space.rs:569-600`); the tag counts stages from 0, so its slot of the delivery at stage `m` is `(r_i(m) - 1) \bmod k_{max}` (`crates/cobre-sddp/src/lp/builder/entries.rs:63`), a cyclic relabelling of the same residues | `r_i(m)` | anticipated plant `i`, delivery stage `m` | — | math/state-augmentation.md, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Delivery stage of an anticipated commitment: the stage, in the study or on the declared post-study calendar, at which it is delivered (fished at a study stage, carried to the terminal stage past the horizon), written in `t_i(m)`, `r_i(m)`, `s_i(m)`, `H_m`, `c_i(m)`, `\bar{G}_i(m)` (state-augmentation §5); see the season, FPHA-plane and trajectory rows for the other meanings of `m` | `m` | anticipated plant `i`; study and declared post-study stages | — | math/state-augmentation.md, overview/notation-conventions.md, math/system-elements.mdx, math/post-study-boundary.md | math/state-augmentation.md | — | yes |
| Decision stage of the delivery at stage `m` of anticipated plant `i`: `t_i(m) = m - K_i` for a stage-count lead; for a physical lead the stage containing the instant one lead time before the end of stage `m`, an instant on a stage boundary belonging to the earlier stage; none for a delivery decided before the study (`m \leq K_i`, or an instant at or before the study start); `t_i(m) = m` marks a delivery that is not anticipated, where the plant dispatches as an ordinary thermal; the deposit row exists only for a decision `t_i(m) = t < m` (state-augmentation §5; the tag's delivery-anchored `decider`, written `c(m)` in its source, `crates/cobre-sddp/src/lead_time/mod.rs:644-673`, the sub-stage case at `:391-413`); spec §3.3 and ledgers ANT-01 and ANT-10 write it `c_i(m)`, the form the anticipated unit-cost row keeps (G1 §3 `c` row) | `t_i(m)` | anticipated plant `i`, delivery stage `m` | — | math/state-augmentation.md, overview/notation-conventions.md, math/post-study-boundary.md | math/state-augmentation.md | — (derived from `anticipated_config.lead_stages` or `anticipated_config.lead_time_hours` in `system/thermals.json`) | yes |
| Total in-transit bucket count, `B = \sum_h L_h`; sddp-algorithm's state table counts the bucket state as `B` | `B` | — | — | math/lp-layout-and-scaling.md, math/state-augmentation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Receiving (downstream) plant index of an in-transit bucket | `h` | receiving plant `i` with at least one travel-time arc | — | math/lp-formulation.md, math/state-augmentation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Maturity lag index of an in-transit bucket (lag 1 matures at the current stage) | `d` | `d \in \{1, \ldots, L_i\}` | — | math/state-augmentation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Per-plant bucket depth: deepest maturity lag any arc into plant `h` reaches on the stage calendar | `L_h` | receiving plant `h` | stages | math/state-augmentation.md, overview/notation-conventions.md | math/state-augmentation.md | `travel_time_hours` (`system/hydros.json`; derived on the stage calendar) | yes |
| Benders cut index (`\alpha_i`, `\pi^v_{i,h}`, `\lambda_i`); horizon-modes writes `i \in \mathcal{I}_\tau`, `\beta_{0,i}`, `\beta_i`; cut-management writes the cut index as `k` (§4, §6, §7.3; `j` for the competing cut in `\max_{j \neq k}`) and as `i` for a DCS candidate (§8.1); the upper-bound-evaluation appendix (Upper Bound Evaluation LP) writes `k` ('`\forall k` (cuts)'); sddp-framework-overview writes `\beta_{0,i}`, `\beta_i` 'for every cut `i`' and `\max_i`; the toy pages index the iteration-`i` cut by a superscript (`\bar{\alpha}^i`, `\bar{\pi}^{v,i}`, `\max_{i = 1, \ldots, k}`) | `i` | active cut `i`; `i = 1, \ldots, k` (one cut per iteration) on the toy pages | — | math/lp-formulation.md, math/horizon-modes.md, math/discount-rate.mdx, math/cut-management.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/cut-management.mdx | — | yes |
| Cut index set of the season-`\tau` cut pool (`i \in \mathcal{I}_\tau`) | `\mathcal{I}_\tau` | `i \in \mathcal{I}_\tau` | — | math/horizon-modes.md | math/cut-management.mdx | — | no |
| Feasible set of the stage-`t` state and control, given the incoming state `x_{t-1}` and the opening `\omega_t` (`(x_t, u_t) \in \mathcal{X}_t(x_{t-1}, \omega_t)`); risk-measures writes `\mathcal{X}_t(x_{t-1}, \omega)`; notation-conventions also writes `\mathcal{X}_t(\omega_t)` when the incoming state is fixed; horizon-modes writes the season-indexed `\mathcal{X}_\tau(x, \omega_\tau)`; policy-graphs writes the child form `\mathcal{X}_{n'}(x, \omega)` in its node Bellman equation; see the cut-validity row for the `\mathcal{X}_t` of cut-management | `\mathcal{X}_t(x_{t-1}, \omega_t)` | stage `t` | — | math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/risk-measures.mdx, overview/notation-conventions.md, overview/sddp-framework-overview.mdx | math/sddp-algorithm.mdx | — | yes |
| Feasible state set of the cut-validity statement: the states at which a valid cut bounds the cost-to-go from below, `\beta_{0,i} + \beta_i^\top x \leq V_{t+1}(x)\ \forall x \in \mathcal{X}_t` ('the feasible state space'); see the stage-feasible-set row for `\mathcal{X}_t(x_{t-1}, \omega_t)` and §1.1 for the declared scoped reuse | `\mathcal{X}_t` | stage `t` | — | math/cut-management.mdx | math/cut-management.mdx | — | no |
| Unit-group index of a (hydro, bus) cell (`\sum_{g \,\in\, (h,b)}`, `\sum_{g \,\in\, h}`) | `u` | `g \in (h,b)` | — | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/lp-formulation.md | `unit_groups[]` (`system/hydros.json`) | yes |
| Vertex set of the stage-`t` inner approximation (reserved SIDP design): the visited state-value pairs `\mathcal{V}_t = \{(x^{(1)}, \bar{v}^{(1)}), \ldots, (x^{(I_t)}, \bar{v}^{(I_t)})\}` | `\mathcal{V}_t` | vertex `i \in \mathcal{V}_t`, stage `t` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Vertex index of the inner approximation (`x^{(i)}`, `\bar{v}^{(i)}`, `\varphi_i`, `i \in \mathcal{V}_t`; reserved SIDP design); the simulation scenarios of the same page take `m` (see the simulation-scenario-index row) | `i` | `i \in \mathcal{V}_t` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Number of vertices of a stage's inner approximation, `n_{vertices}` in the appendix's Computational Considerations LP-size table; the appendix's Vertex-Based Inner Approximation indexes its last vertex by the per-stage count `I_t` (see that row; reserved SIDP design) | `n_{vertices}` | — | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Number of vertices stored in the stage-`t` inner approximation, the index of its last vertex in `\mathcal{V}_t = \{(x^{(1)}, \bar{v}^{(1)}), \ldots, (x^{(I_t)}, \bar{v}^{(I_t)})\}` (reserved SIDP design); see the vertex-count row for the `n_{vertices}` of the appendix's Computational Considerations LP-size table | `I_t` | stage `t` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| State-coordinate index: component `j` of the incoming or outgoing state (`\hat{x}_j`, `\pi_j`, `x^{in}_j`, `\underline{x}_j = \bar{x}_j = \hat{x}_j` on cut-management §2; `L_{t,j}`, `L_{t+1,j}` and `L_{T,j}` on the upper-bound-evaluation appendix (Lipschitz Interpolation, Lipschitz Constant Computation)); see the LP-column, thermal and opening rows for the other meanings of `j` | `j` | state coordinate `j` | — | math/cut-management.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/cut-management.mdx | — | yes |
| Forward-pass (trajectory) index of the thread-trajectory affinity description: 'the same thread that executed forward pass `k` also performs the backward pass for the scenarios sampled by forward pass `k`'; see the iteration-counter row for the other `k` on the same page | `m` | forward pass `k` of an iteration | — | math/sddp-algorithm.mdx | math/sddp-algorithm.mdx | — | no |
| Leaf path of the enumerated scenario tree, the summation index of the exact upper bound `\sum_{\ell} P(\ell)\, C(\ell)` (also `c(\ell)` and `\tilde{V}(\ell)` at a leaf); stopping-rules §5 writes 'every scenario `\ell`'; see the AR-lag and line rows for the other meanings of `\ell` | `\ell` | leaf paths of the enumerated tree | — | math/sddp-algorithm.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/upper-bound-evaluation.md | — | yes |
| Node of the enumerated scenario tree, carrying immediate cost `c(n)` at stage `\mathrm{stage}(n)`; `n'` is a child and `\text{root}` the root node (`\tilde{V}(\text{root})`); distinct from the policy-graph node `n` | `n` | nodes of the enumerated tree | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Children of enumerated-tree node `n`, over which the stage risk measure aggregates, `\rho_{\,n' \in \mathrm{ch}(n)}[\cdot]` | `\mathrm{ch}(n)` | `n' \in \mathrm{ch}(n)` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Stage an enumerated-tree node sits at (`d_{1 \to \mathrm{stage}(n)}`); policy-graphs writes the stage of a policy-graph node as `t(n)` | `\mathrm{stage}(n)` | — | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Simulation-scenario index of the post-training simulation estimator (`C_m`, `w_m`, `\sum_{m=1}^{N}`, the superscript of `c_t^{(m)}`); the vertex index of the same page's reserved design keeps `i` (see the vertex-index row) | `m` | `m \in \{1, \ldots, N\}` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Number of simulation scenarios (`\bar{C} = \frac{1}{N} \sum_{m=1}^{N} C_m`, `N/(N-1)`, `\sigma_C / \sqrt{N}`); under the census variant it is fixed by the size of the declared enumeration; see the upper-bound trajectory-count row for the `1/M` of upper-bound-evaluation §2 | `N` | — | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | `simulation.selection.num_scenarios` with `simulation.selection.method` = `"sampled"` (`config.json`); derived from the policy graph under `"enumerated"` | no |
| Number of threads summed across all MPI ranks, each owning one forward trajectory at a time, so that `N` forward passes execute in parallel; see the upper-bound trajectory-count row for the `M` trajectories they process; no page writes it (ticket-123) | `N` | — | — | — | math/sddp-algorithm.mdx | — (summed over MPI ranks) | no |
| Visited-states archive: the recent forward-pass trial points against which periodic cut selection scores every cut (`\forall \hat{x} \in \text{visited states}`); its size is written `\lvert\text{visited states}\rvert` (with bars) | `\text{visited states}` | trial point `\hat{x}` | — | math/cut-management.mdx | math/cut-management.mdx | — | no |
| Number of populated cuts in a stage's pool, in the Domination cost `\mathcal{O}(\lvert\text{cuts}\rvert \times \lvert\text{visited states}\rvert)` (written with bars) | `\lvert\text{cuts}\rvert` | — | — | math/cut-management.mdx | math/cut-management.mdx | — | no |
| Number of training iterations, in the cut-growth and vertex-count orders `\mathcal{O}(\text{iterations} \times \text{forward\_passes})` | `\text{iterations}` | — | — | math/cut-management.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/cut-management.mdx | — | yes |
| Period of periodic cut selection: the value-evaluation pass runs after each `n_{\text{sel}}`-th iteration; the §10 symbol table lists no math symbol for `check_frequency` | `n_{\text{sel}}` | — | iterations | math/cut-management.mdx | math/cut-management.mdx | `training.cut_selection.selection.check_frequency` (`config.json`; methods `level1`, `lml1`, `domination`) | no |
| Canonical total order of the entities within each state block, by operational start date and then by id (rename-invariant); the `_network.configure` partial writes the `(operational_start_date, id)` ordering key in inline code | `(\text{operational\_start\_date}, \text{id})` | entities of each `system/*` collection | — | math/determinism-guarantees.mdx, overview/notation-conventions.md, math/_impl/_network.configure.mdx | math/determinism-guarantees.mdx | `operational_start_date`, `id` (every `system/*` entity) | yes |
| Risk set of a convex risk measure in its dual representation, a convex subset of the probability simplex, `\mathcal{M}(p) \subseteq \mathcal{P}`; §4 prose writes it bare as `\mathcal{M}`; see the FPHA plane-set row for `\mathcal{M}_h` | `\mathcal{M}(p)` | — | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| CVaR risk set: probability vectors `\mu \geq 0` with `\sum_\omega \mu_\omega = 1` and `\mu_\omega \leq \frac{p_\omega}{\alpha}` for every `\omega` | `\mathcal{M}_\alpha(p)` | — | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Risk set of the convex-combination (EAVaR) measure: probability vectors with `(1-\lambda)\, p_\omega \leq \mu_\omega \leq (1-\lambda)\, p_\omega + \frac{\lambda\, p_\omega}{\alpha}` for every `\omega`, equivalently `\mu = (1-\lambda)\, p + \lambda\, q` with `q \in \mathcal{M}_\alpha(p)` | `\mathcal{M}^{EAVaR}(p)` | — | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Probability simplex of the scenario probabilities, `\mathcal{P} = \{p \geq 0 : \sum_{\omega} p_\omega = 1\}`; see the pumping-station row for the other meaning of `\mathcal{P}` | `\mathcal{P}` | — | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Block duration; block-formulations §5 writes `τ_k` in prose | `\tau_k` | `k \in \mathcal{K}` | hours | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md | math/block-formulations.mdx | `stages[].blocks[].hours` (`stages.json`) | yes |
| Block weight, `w_k = \tau_k / \sum_{k' \in \mathcal{K}} \tau_{k'}` (primed block dummy `k'`); notation-conventions writes `w_k = \tau_k / H_t`; system-elements §5 links its owner, lp-formulation §4 (ticket-152a) | `w_k` | `k \in \mathcal{K}` | — | math/lp-formulation.md, math/state-augmentation.md, math/block-formulations.mdx, overview/notation-conventions.md | math/block-formulations.mdx | — (derived from `stages[].blocks[].hours`) | yes |
| Stage flow-to-volume conversion, `\zeta = 0.0036 \times \sum_k \tau_k`; lp-formulation §8 writes the stage-indexed `\zeta_{t'}`; the toy pages set `\zeta = 1`; system-elements §5 links its owner, lp-formulation §4 (ticket-152a) | `\zeta` | stage `t` (`\zeta_t`) | hm³/(m³/s) | math/lp-formulation.md, math/state-augmentation.md, math/block-formulations.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — (derived from `stages[].blocks[].hours`) | yes |
| Block flow-to-volume conversion `\zeta_k = 0.0036\,\tau_k = w_k\,\zeta`, `\sum_k \zeta_k = \zeta`: the coefficient of every block-`k` flow on a water-balance row (parallel and chronological) and of `z_h`, `\sigma^{inf}_h`, `\sigma^{w\pm}_h` and the right-hand side on a chronological block row; the pumping term `\pm\zeta_k p_{y,k}` on the station's source and destination rows with all terms on the left, the storage-change form of equipment-formulations carrying the opposite signs (system-elements §5 links its owner, lp-formulation §4; ticket-152a) (ledger HYD-01, HYD-04, HYD-10); at the tag the builder's `tau(blk)`, which is `\zeta_k`, is the block's hours and `zeta()` the stage's hours times `3600/10^6` (`crates/cobre-sddp/src/block_clock.rs:7-10,36-42`); it converts every block flow on the parallel row (`crates/cobre-sddp/src/lp/builder/entries.rs:232-262`), every term of a chronological block row (`crates/cobre-sddp/src/lp/builder/entries.rs:424-428,482-527`) and its right-hand side (`crates/cobre-sddp/src/lp/builder/rows.rs:150-184`), and the pumped flow enters `+\zeta_k` on the source row and `-\zeta_k` on the destination row (`crates/cobre-sddp/src/lp/builder/entries.rs:807-841`) | `\zeta_k` | `k \in \mathcal{K}` | hm³/(m³/s) | math/block-formulations.mdx, math/lp-formulation.md, math/equipment-formulations.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md | math/block-formulations.mdx | — (derived from `stages[].blocks[].hours`) | yes |
| Total stage duration in hours, `H_t = \sum_k \tau_k`: the hours over which the stage-level withdrawal slacks (lp-formulation §9), the inflow non-negativity slack (lp-formulation §2, inflow-nonnegativity) and a parallel stage's evaporation slacks are priced (`crates/cobre-sddp/src/lp/builder/columns.rs:596-610,712-717,732-766`; ledger HYD-05), and the stage duration in the same-stage travel-time share `\nu_{h',t,0}` (lp-formulation §4) and in the parallel-stage arrival share `\tau_k / H_t` of a `hydro_inflow` term (lp-formulation §10); state-augmentation §5 and system-elements §4 write `H_m`, the hours of delivery stage `m` (a post-study stage's declared duration past the horizon), in the decision-column cost (`crates/cobre-sddp/src/time_value.rs:310-321,583-586`; `crates/cobre-sddp/src/lp/builder/columns.rs:502-507`) | `H_t` | stage `t` (`H_t`) | hours | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (sum of `stages[].blocks[].hours`) | yes |
| Flow rate in the unit-conversion derivation of `\zeta` | `Q` | — | m³/s | — | overview/notation-conventions.md | — | no |
| Volume in the unit-conversion derivation of `\zeta` | `V` | — | hm³ | — | overview/notation-conventions.md | — | no |
| Load demand at bus `b`, block `k`; system-elements labels it `D` in its d2 diagram; scenario-generation writes the block-level load `d_{b,t,k} = d_{b,t} \cdot f_{b,t,k}`; toy-single-reservoir writes the one bus's demand bare as `D` (d2 label 'demand D = 40'); toy-four-reservoir writes the bus-`b` demand `D_b` (`D_1`, …) and bare `D` in its tables and d2 labels | `D_{b,k}` | `b \in \mathcal{B}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — | yes |
| Stage-level load realization at bus `b`, stage `t`, `d_{b,t} = \max\bigl(0,\; \mu_{b,t}^{\text{load}} + s_{b,t}^{\text{load}} \cdot \varepsilon_{b,t}^{\text{load}}\bigr)` | `d_{b,t}` | `b \in \mathcal{B}`, stage `t` | MW | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Mean load at bus `b`, stage `t` | `\mu_{b,t}^{\text{load}}` | `b \in \mathcal{B}`, stage `t` | MW | math/scenario-generation.mdx | math/scenario-generation.mdx | `mean_mw` (`scenarios/load_seasonal_stats.parquet`) | no |
| Load standard deviation at bus `b`, stage `t` (`0` = deterministic) | `s_{b,t}^{\text{load}}` | `b \in \mathcal{B}`, stage `t` | MW | math/scenario-generation.mdx | math/scenario-generation.mdx | `std_mw` (`scenarios/load_seasonal_stats.parquet`) | no |
| Load noise term, `\varepsilon_{b,t}^{\text{load}} \sim N(0,1)`, correlated only with the load buses of its correlation group | `\varepsilon_{b,t}^{\text{load}}` | `b \in \mathcal{B}`, stage `t` | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Block load factor multiplying the stage-level load (default 1.0) | `f_{b,t,k}` | `b \in \mathcal{B}`, stage `t`, `k \in \mathcal{K}` | — | math/scenario-generation.mdx | math/scenario-generation.mdx | `load_factors[].block_factors[].factor` (`scenarios/load_factors.json`) | no |
| Thermal marginal cost: one cost per MWh of thermal `j` at each stage, with no segment index (also written `c^{th}` without indices; the toy pages tabulate the bare `c^{th}`); at the tag one `cost_per_mwh` per thermal, overridden per stage only (`crates/cobre-core/src/entities/thermal.rs:49-50`; `crates/cobre-sddp/src/lp/builder/columns.rs:350-354,385-388`) | `c^{th}_j` | `j \in \mathcal{T}` | \$/MWh | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/equipment-formulations.mdx | `cost_per_mwh` (`system/thermals.json`; stage override in `constraints/thermal_bounds.parquet`) | yes |
| Contract price, signed (+ import cost, − export revenue) | `c^{ctr}_c` | `c \in \mathcal{C}` | \$/MWh | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `price_per_mwh` (`system/energy_contracts.json`) | yes |
| Deficit cost of segment `s` at bus `b`; the toy pages tabulate the bare `c^{def}` | `c^{def}_{b,s}` | `b \in \mathcal{B}`, `s \in \mathcal{S}_b` | \$/MWh | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/penalty-system.mdx | `deficit_segments[].cost` (`penalties.json` `bus`; per-bus override in `system/buses.json`) | yes |
| Deficit segment depth | `\bar{d}_{b,s}` | `b \in \mathcal{B}`, `s \in \mathcal{S}_b` | MW | math/system-elements.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `deficit_segments[].depth_mw` (`penalties.json` `bus`; `null` on the last segment) | yes |
| Excess generation cost | `c^{exc}_b` | `b \in \mathcal{B}` | \$/MWh | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `bus.excess_cost` (`penalties.json`) | yes |
| Storage-below-minimum penalty | `c^{sv-}_h` | `h \in \mathcal{H}` | \$/hm³ | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `storage_violation_below_cost` (`penalties.json` `hydro`; entity `penalties` override) | yes |
| Filling-target shortfall penalty | `c^{fill}_h` | `h \in \mathcal{H}` | \$/hm³ | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `filling_target_violation_cost` (`penalties.json` `hydro`; entity override) | yes |
| Turbined-flow-minimum penalty (per plant, charged on every cell) | `c^{tv-}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `turbined_violation_below_cost` (`penalties.json` `hydro`; entity override) | yes |
| Outflow-minimum penalty (with `c^{ov+}_h` abbreviated `c^{ov\pm}` on penalty-system) | `c^{ov-}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `outflow_violation_below_cost` (`penalties.json` `hydro`; entity override) | yes |
| Outflow-maximum penalty (abbreviated with `c^{ov-}_h` as `c^{ov\pm}`) | `c^{ov+}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `outflow_violation_above_cost` (`penalties.json` `hydro`; entity override) | yes |
| Generation-minimum penalty (per plant, charged on every cell) | `c^{gv-}_h` | `h \in \mathcal{H}` | \$/MWh | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `generation_violation_below_cost` (`penalties.json` `hydro`; entity override) | yes |
| Evaporation-above-target penalty (abbreviated with `c^{ev-}_h` as `c^{ev\pm}`) | `c^{ev+}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `evaporation_violation_pos_cost` (`penalties.json` `hydro`; falls back to `evaporation_violation_cost`) | yes |
| Evaporation-below-target penalty (abbreviated with `c^{ev+}_h` as `c^{ev\pm}`) | `c^{ev-}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `evaporation_violation_neg_cost` (`penalties.json` `hydro`; falls back to `evaporation_violation_cost`) | yes |
| Withdrawal-above-target (over-delivery) penalty, pricing `\sigma^{w+}_h` (abbreviated with `c^{wv-}_h` as `c^{wv\pm}`) | `c^{wv+}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `water_withdrawal_violation_pos_cost` (`penalties.json` `hydro`; falls back to `water_withdrawal_violation_cost`) | yes |
| Withdrawal-below-target (under-delivery) penalty, pricing `\sigma^{w-}_h` (abbreviated with `c^{wv+}_h` as `c^{wv\pm}`) | `c^{wv-}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `water_withdrawal_violation_neg_cost` (`penalties.json` `hydro`; falls back to `water_withdrawal_violation_cost`) | yes |
| Spillage regularization cost; system-elements §5 names it in words (ticket-152a) | `c^{spill}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `spillage_cost` (`penalties.json` `hydro`; entity override) | yes |
| Turbined-flow regularization cost of hydro `h` (system-elements §5 names it in words; ticket-152a), charged on the turbined flow of every cell of every hydro, `\tau_k c^{tc}_h q_{h,b,k}` per cell and block (`crates/cobre-sddp/src/lp/builder/columns.rs:181-224`, the cost at `:220`); an FPHA hydro requires `c^{tc}_h \ge 0` (`crates/cobre-io/src/validation/semantic/scenarios.rs:203-230`); `c^{tc}_h > c^{spill}_h` is advice (ledger PEN-08) | `c^{tc}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `turbined_cost` (`penalties.json` `hydro`; entity override) | yes |
| Diversion regularization cost; system-elements §5 names it in words (ticket-152a) | `c^{div}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/lp-formulation.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `diversion_cost` (`penalties.json` `hydro`; entity override) | yes |
| Curtailment regularization cost; the LP charges `-\tau_k c^{curt}_r g^{nc}_{r,k}` (`columns.rs:953-954`) | `c^{curt}_r` | `r \in \mathcal{R}` | \$/MWh | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `non_controllable_source.curtailment_cost` (`penalties.json`); entity `curtailment_cost` (`system/non_controllable_sources.json`) | yes |
| Exchange regularization cost; lp-formulation and system-elements write `c^{exch}_l` | `c^{exch}_n` | `\ell \in \mathcal{L}` | \$/MWh | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | `line.exchange_cost` (`penalties.json`); entity `exchange_cost` (`system/lines.json`) | yes |
| Inflow non-negativity penalty of hydro `h`, per (m³/s)·h of water the slack adds, `c^{inf}_h H_t \sigma^{inf}_h` (`crates/cobre-sddp/src/lp/builder/columns.rs:594-610`); the penalty-system ordering display writes the bare `c^{inf}` | `c^{inf}_h` | `h \in \mathcal{H}` | \$/(m³/s·h) | math/inflow-nonnegativity.md, math/penalty-system.mdx, math/lp-formulation.md, overview/notation-conventions.md | math/penalty-system.mdx | `inflow_nonnegativity_cost` (`penalties.json` `hydro`; entity override) | yes |
| Cost-coefficient prefix: a superscript names the cost type | `c` | — | — | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/inflow-nonnegativity.md, math/penalty-system.mdx, overview/notation-conventions.md | math/penalty-system.mdx | — | yes |
| Volume-to-energy-rate conversion of the energy-equivalent penalty ordering, `\kappa = 10^6/3600`, the number of (m³/s)·h in one hm³: a storage cost `c` in \$/hm³ is worth `c/(\kappa \bar\rho_{acum,h,t})` \$/MWh (ledger PEN-01); the load-time checks compare the raw values without it (`crates/cobre-io/src/validation/semantic/scenarios.rs:64-88`); see the intercept-correction and curtailment rows for the other meanings of `\kappa` | `\kappa` | — | (m³/s)·h/hm³ | math/penalty-system.mdx | math/penalty-system.mdx | — (unit-conversion constant) | no |
| Unit cost of anticipated plant `i` evaluated at a stage, `c_i(\cdot)`; state-augmentation, system-elements and the notation page write the unit cost at delivery stage `m`, `c_i(m)` (spec §3.3, ledger ANT-05): the delivery stage's resolved cost in the study, the declared post-study cost past it (`crates/cobre-sddp/src/lp/builder/columns.rs:473-496`), in the decision-column cost `c_i(m) H_m d_{t \to m}` (`crates/cobre-sddp/src/lp/builder/columns.rs:498-508`); ledger ANT-01 and ANT-10 write `c_i(m)` for the decision stage of delivery `m` instead (see the `t_i(m)` row) | `c_i(t)` | anticipated plant `i`, stage `t` | \$/MWh | math/state-augmentation.md, math/system-elements.mdx, overview/notation-conventions.md | math/state-augmentation.md | `cost_per_mwh` (`system/thermals.json`, resolved at the delivery stage; `post_study_stages.json` past the horizon) | yes |
| Cumulative discount factor of stage `t`; discount-rate writes it `d_{1 \to t}` (`d_{1 \to T}`, `d_{1 \to 2}`, `d_{1 \to 12}`, `d_{1 \to 1} = 1`) and as the product `\prod_{t'=1}^{t-1} d_{t' \to t'+1}`; upper-bound-evaluation writes `d_{1 \to t}`, `d_{1 \to T}` and `d_{1 \to \mathrm{stage}(n)}`; discount-rate §5 defines it, with the post-study extension at the global rate bridged by the last study stage's one-step factor (`crates/cobre-sddp/src/time_value.rs:198-284`); state-augmentation writes `d_{1 \to m}` at delivery stage `m` (system-elements §4 states the delivery discount in words; ticket-152); at the tag `compute_cumulative_discount_factors`, with `d_{1 \to 1} = 1` (`crates/cobre-sddp/src/time_value.rs:55-67`) | `d_{1 \to t}` | stage `t` | — | math/state-augmentation.md, math/discount-rate.mdx, math/upper-bound-evaluation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/discount-rate.mdx | — (derived from `policy_graph.annual_discount_rate` in `stages.json`) | yes |
| Discount factor of the stage transition `t \to t+1`, `d_{t \to t+1} = (1 + r_t)^{-\Delta t}` on the source stage's duration, applied to the future-cost variable; sddp-algorithm and cut-management write the factor on `\theta` as `d_{t-1 \to t} \cdot \theta`; policy-graphs writes the child form `d_{t(n') \to t(n')+1}` in its node Bellman equation; risk-measures and upper-bound-evaluation write `d_{t \to t+1}` and bare `d` (`d \cdot \theta`, `d = 1`); the toy pages tabulate the bare `d` ('Discount factor'); the glossary writes `d \in (0, 1]` applied to `\theta`, `d \cdot \mathbb{E}[V_{t+1}(x_t)]` in its Bellman recursion and `d_{t \to t+1}` in the cycle product; discount-rate §3 defines it with the stage's rate `r_t` and duration `\Delta t`; θ's objective coefficient, not divided by the cost scale (lp-formulation §1.1, §2; lp-layout-and-scaling §2.1); at the tag `compute_per_stage_discount_factors` (`crates/cobre-sddp/src/time_value.rs:24-53`) and θ's coefficient `discount_factors[stage_idx]` (`crates/cobre-sddp/src/lp/builder/template.rs:186-212`) | `d_{t \to t+1}` | transition `t \to t+1` | — | math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md, math/lp-formulation.md, math/lp-layout-and-scaling.md | math/discount-rate.mdx | — (derived from `policy_graph.annual_discount_rate`; overridden by `stages[].annual_discount_rate_override` or `policy_graph.transitions[].annual_discount_rate_override` in `stages.json`) | yes |
| Discount from stage `t_2` back to stage `t_1 \le t_2`, `d_{t_1 \to t_2} = d_{1 \to t_2} / d_{1 \to t_1}`; state-augmentation writes the delivery discount `d_{t \to m}` from delivery stage `m` to decision stage `t` (system-elements §4 states it in words; ticket-152); at the tag `relative_delivery_discount` (`crates/cobre-sddp/src/time_value.rs:604-609`) | `d_{t_1 \to t_2}` | stages `t_1 \le t_2` | — | math/discount-rate.mdx, overview/notation-conventions.md, math/state-augmentation.md | math/discount-rate.mdx | — | yes |
| Cumulative discount around one full cycle, `d_{\text{cycle}} = \prod_{t \in \text{cycle}} d_{t \to t+1} < 1` (reserved cyclic design); the glossary writes `d_{\text{cycle}} = \prod_{t \in \text{cycle}} d_{t \to t+1} < 1` | `d_{\text{cycle}}` | — | — | math/horizon-modes.md, math/upper-bound-evaluation.md, overview/notation-conventions.md, reference/glossary.md | math/horizon-modes.md | — | yes |
| Global annual discount rate of the study: the rate of every stage that declares none and of every post-study stage | `r_{annual}` | — | per year | math/discount-rate.mdx | math/discount-rate.mdx | `policy_graph.annual_discount_rate` (`stages.json`) | no |
| Annual discount rate of stage `t`: the stage's own rate when it declares one, else the global rate `r_{annual}`; post-study stages take the global rate (`crates/cobre-sddp/src/time_value.rs:24-53,239-249`; `crates/cobre-io/src/stages.rs:681-701`) | `r_t` | stage `t` | per year | math/discount-rate.mdx | math/discount-rate.mdx | `stages[].annual_discount_rate_override` (`stages.json`; the chain dialect folds a departing edge's `policy_graph.transitions[].annual_discount_rate_override` onto its source stage) | no |
| Duration of stage `t`, the source stage of the transition `t \to t+1`, in years: its whole days divided by 365.25 (`crates/cobre-sddp/src/time_value.rs:43-49`) | `\Delta t` | stage `t` | years | math/discount-rate.mdx | math/discount-rate.mdx | — (derived from `stages[].start_date` and `stages[].end_date` in `stages.json`) | no |
| Tolerance of the cyclic-mode convergence criterion on per-season lower bounds (reserved cyclic design) | `\delta_{\text{cycle}}` | — | \$ | math/horizon-modes.md | math/horizon-modes.md | — | no |
| Operative storage upper bound (reservoir capacity, hard); hydro-production-models writes `\bar V_h`; toy-single-reservoir writes the bare `\bar{V}` ('cap 100' in its d2 diagram); toy-four-reservoir writes `\bar V_h` | `\bar{V}_h` | `h \in \mathcal{H}` | hm³ | math/lp-formulation.md, math/system-elements.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/lp-formulation.md | `reservoir.max_storage_hm3` (`system/hydros.json`); stage override `max_storage_hm3` (`constraints/hydro_bounds.parquet`) | yes |
| Operative storage lower bound, read as the dead volume on lp-formulation §8, system-elements §5 and penalty-system; hydro-production-models writes `\underline V_h`; a hard column bound except for the two cases of `\sigma^{v-}_h` and PreFilling (ticket-053); lp-formulation §8 writes the stage-resolved `\underline{V}_{h,t}` and `\underline{V}_{h,L}` in the filling floor | `\underline{V}_h` | `h \in \mathcal{H}` | hm³ | math/lp-formulation.md, math/system-elements.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | `reservoir.min_storage_hm3` (`system/hydros.json`); stage override `min_storage_hm3` (`constraints/hydro_bounds.parquet`) | yes |
| Physical storage minimum (dead-volume floor), stage-invariant; distinct from the operative bound | `V^{min}_h` | `h \in \mathcal{H}` | hm³ | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `reservoir.min_storage_hm3` (`system/hydros.json`) | yes |
| Physical storage maximum (full-reservoir ceiling), stage-invariant | `V^{max}_h` | `h \in \mathcal{H}` | hm³ | math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `reservoir.max_storage_hm3` (`system/hydros.json`) | yes |
| Plant turbined-flow upper bound (resolved plant maximum that caps each cell) | `\bar{Q}_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `generation.max_turbined_m3s` (`system/hydros.json`); stage override `max_turbined_m3s` (`constraints/hydro_bounds.parquet`) | yes |
| Plant turbined-flow lower bound | `\underline{Q}_h` | `h \in \mathcal{H}` | m³/s | overview/notation-conventions.md | math/lp-formulation.md | `generation.min_turbined_m3s` (`system/hydros.json`); stage override `min_turbined_m3s` (`constraints/hydro_bounds.parquet`) | no |
| Cell turbined-flow upper bound, `\min(\sum_{g \in (h,b)} \mathrm{fold}(g), \bar{Q}_h)` | `\bar{Q}_{h,b}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (composed from the cell's unit groups) | yes |
| Cell turbined-flow lower bound, `\sum_{g \in (h,b)} \underline{Q}_g` | `\underline{Q}_{h,b}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (composed from the cell's unit groups) | yes |
| Unit-group turbined-flow upper bound | `\bar{Q}_u` | unit group `g` | m³/s | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/lp-formulation.md | `unit_groups[].max_turbined_m3s` (`system/hydros.json`) | yes |
| Unit-group turbined-flow lower bound | `\underline{Q}_u` | unit group `g` | m³/s | math/lp-formulation.md | math/lp-formulation.md | `unit_groups[].min_turbined_m3s` (`system/hydros.json`) | no |
| Plant generation upper bound (resolved plant maximum that caps each cell; installed capacity capping the FPHA cloud) | `\bar{G}_h` | `h \in \mathcal{H}` | MW | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md, src/components/FphaPlot.astro | math/lp-formulation.md | `generation.max_generation_mw` (`system/hydros.json`); stage override `max_generation_mw` (`constraints/hydro_bounds.parquet`) | yes |
| Plant generation lower bound | `\underline{G}_h` | `h \in \mathcal{H}` | MW | overview/notation-conventions.md | math/lp-formulation.md | `generation.min_generation_mw` (`system/hydros.json`); stage override `min_generation_mw` (`constraints/hydro_bounds.parquet`) | no |
| Cell generation upper bound, `\min(\sum_{g \in (h,b)} \bar{G}_g, \bar{G}_h)` | `\bar{G}_{h,b}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h` | MW | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (composed from the cell's unit groups) | yes |
| Cell generation lower bound, `\sum_{g \in (h,b)} \underline{G}_g` | `\underline{G}_{h,b}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h` | MW | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (composed from the cell's unit groups) | yes |
| Unit-group generation upper bound | `\bar{G}_u` | unit group `g` | MW | math/lp-formulation.md | math/lp-formulation.md | `unit_groups[].max_generation_mw` (`system/hydros.json`) | no |
| Unit-group generation lower bound | `\underline{G}_u` | unit group `g` | MW | math/lp-formulation.md | math/lp-formulation.md | `unit_groups[].min_generation_mw` (`system/hydros.json`) | no |
| Outflow upper bound (flood control) | `\bar{O}_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | `outflow.max_outflow_m3s` (`system/hydros.json`); stage override `max_outflow_m3s` (`constraints/hydro_bounds.parquet`) | yes |
| Outflow lower bound (environmental flow) | `\underline{O}_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | `outflow.min_outflow_m3s` (`system/hydros.json`); stage override `min_outflow_m3s` (`constraints/hydro_bounds.parquet`) | yes |
| Maximum diversion flow | `\bar{U}_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | `diversion.max_flow_m3s` (`system/hydros.json`); stage override `max_diversion_m3s` (`constraints/hydro_bounds.parquet`) | yes |
| Water withdrawal target, signed stage-level fixed RHS (negative = inter-basin return), with no per-block `r_{h,k}`: the right-hand side `-\zeta r_h` of the parallel water-balance row and `-\zeta_k r_h` of each chronological block row (`crates/cobre-sddp/src/lp/builder/rows.rs:107-114,170-183`), and the stage-level withdrawal of system-elements and block-formulations (ledger HYD-01, HYD-09) | `r_h` | `h \in \mathcal{H}` (stage-level) | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/block-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | `water_withdrawal_m3s` (`constraints/hydro_bounds.parquet`, stage-level) | yes |
| Realized withdrawal, `R_h = r_h - \sigma^{w-}_h + \sigma^{w+}_h` | `R_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Constant productivity; hydro-production-models writes the per-stage `\rho_{h,t}`; system-elements also writes a bare `\rho` (Variable Units Convention); the `_hydro.notes` partial writes a bare `ρ` in inline code (`(Σ_c turbined_c) × ρ`, `turbined_c × ρ`) | `\rho_h` | `h \in \mathcal{H}` (stage `t` on hydro-production-models) | MW/(m³/s) | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, math/_impl/_hydro.notes.mdx | math/hydro-production-models.mdx | `productivity_mw_per_m3s` (`system/hydro_production_models.json` range or season entry) or `equivalent_productivity_mw_per_m3s` (`system/hydro_energy_productivity.parquet`) | yes |
| Turbine efficiency (dimensionless, constant per plant); hydro-production-models §6 also writes a bare `\eta` | `\eta_h` | `h \in \mathcal{H}` | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `efficiency.value` (`system/hydros.json`, `type: "constant"`) | no |
| Reference net head at the reference storage level, per stage | `H^{ref}_{h,t}` | `h \in \mathcal{H}`, stage `t` | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Specific productivity, the authored per-plant input (overridable per stage, also `\rho_{esp,h,t}`) that, with the net head of the VHA geometry, gives the equivalent productivity `\rho_{eq,h,t}` and the useful-range mean `\bar\rho_{eq,h,t}` (hydro-production-models §5.1, §5.3); the exact production function and the FPHA fit use the factor `9.81\,\eta_h/1000` and do not read it (C2 = A, XD-330; `crates/cobre-sddp/src/production/fpha_fitting/production.rs:39`, `crates/cobre-sddp/src/production/energy_conversion/builder.rs:92`) | `\rho_{esp}` | `h \in \mathcal{H}`, stage `t` | MW/(m³/s·m) | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `specific_productivity_mw_per_m3s_per_m` (`system/hydros.json`); per-stage override column of the same name (`system/hydro_energy_productivity.parquet`) | no |
| Equivalent productivity at the reference operating point (also unindexed `\rho_{eq}`) | `\rho_{eq,h,t}` | `h \in \mathcal{H}`, stage `t` | MW/(m³/s) | math/hydro-production-models.mdx, overview/notation-conventions.md, src/components/FphaPlot.astro | math/hydro-production-models.mdx | `equivalent_productivity_mw_per_m3s` (`system/hydro_energy_productivity.parquet`, override) or `productivity_mw_per_m3s` (non-FPHA) | yes |
| Accumulated cascade productivity (plant plus downstream), reference-point evaluator (also unindexed `\rho_{acum}`) | `\rho_{acum,h,t}` | `h \in \mathcal{H}`, stage `t` | MW/(m³/s) | math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | — | yes |
| Useful-range mean equivalent productivity, forebay level averaged over the physical storage range (also unindexed `\bar\rho_{eq}`) | `\bar\rho_{eq,h,t}` | `h \in \mathcal{H}`, stage `t` | MW/(m³/s) | math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | — | yes |
| Useful-range mean accumulated cascade productivity (also unindexed `\bar\rho_{acum}`) | `\bar\rho_{acum,h,t}` | `h \in \mathcal{H}`, stage `t` | MW/(m³/s) | math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | — | yes |
| Maximum stored energy, `\bar\rho_{acum,h,t}\,(V^{max}_h - V^{min}_h)` (raw unit, not MWh) | `E^{max}_{h,t}` | `h \in \mathcal{H}`, stage `t` | MW/(m³/s)·hm³ | math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | — | yes |
| Reference operating volume (also written `V^{ref}`) | `V^{ref}_{h,t}` | `h \in \mathcal{H}`, stage `t` | hm³ | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `reference_volume` (`volume_hm3` or `percentile`; `system/hydro_production_models.json`) | no |
| Reference flow at which both evaluators compute the net head (the installed turbined-flow capacity) | `Q^{ref}_{h,t}` | `h \in \mathcal{H}`, stage `t` | m³/s | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `reference_outflow_m3s` (`system/hydro_energy_productivity.parquet`, override) | no |
| Security-curve fraction of the maximum stored energy | `p` | — | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — (authored on a generic constraint) | no |
| Incremental (natural) inflow energy, `\rho_{acum,h,t} \cdot a_{h,k}` | `\text{ENA}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | MW | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Stored reservoir energy (`\text{EARM}^{\,\text{init}}_h`, `\text{EARM}^{\,\text{final}}_h` in MWh; power form `\text{EARM}^{\,\text{MW}}_h` in MW) | `\text{EARM}_h` | `h \in \mathcal{H}` | MWh | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| FPHA plane intercept, already `k_{FPHA}`-scaled; lp-formulation also writes `\gamma^m_0`, and no page writes a bare `\gamma_0` (ticket-152); system-elements §5 names the plane set in words (ticket-152a); notation-conventions states the plane coefficients are lowercase, never `\Gamma` | `\gamma_0^m` | `m \in \mathcal{M}_h` | MW | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `gamma_0` (`system/fpha_hyperplanes.parquet`) | yes |
| FPHA plane storage coefficient (also `\gamma^m_v`; block-formulations §2.4 applies it per block as `-\gamma_v^m/2`, apportioned by `\lambda_{h,b}`; ticket-155); system-elements §5 names the plane set in words (ticket-152a) | `\gamma_v^m` | `m \in \mathcal{M}_h` | MW/hm³ | math/lp-formulation.md, math/block-formulations.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `gamma_v` (`system/fpha_hyperplanes.parquet`) | yes |
| FPHA plane turbined-flow coefficient (also `\gamma^m_q`); system-elements §5 names the plane set in words (ticket-152a) | `\gamma_q^m` | `m \in \mathcal{M}_h` | MW/(m³/s) | math/lp-formulation.md, math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `gamma_q` (`system/fpha_hyperplanes.parquet`) | yes |
| FPHA plane spillage coefficient, `\le 0` (also `\gamma^m_s`, bare `\gamma_s`); system-elements §5 names the plane set in words (ticket-152a) | `\gamma_s^m` | `m \in \mathcal{M}_h` | MW/(m³/s) | math/lp-formulation.md, math/hydro-production-models.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | `gamma_s` (`system/fpha_hyperplanes.parquet`) | yes |
| Linearized net-evaporation intercept of hydro `h` at the current stage, the right-hand side of its evaporation row (`crates/cobre-sddp/src/lp/builder/entries.rs:1027-1100`, `crates/cobre-sddp/src/production/hydro_models/evaporation.rs:24-55`) | `\gamma^{ev}_{0,h}` | `h \in \mathcal{H}`, stage `t` | m³/s | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `evaporation.coefficients_mm` and `evaporation.reference_volumes_hm3` (`system/hydros.json`) with `area_km2` (`system/hydro_geometry.parquet`) | yes |
| Linearized net-evaporation storage slope of hydro `h` at the current stage, the coefficient `-\gamma^{ev}_{v,h}/2` of each of the two storages its evaporation row reads (`crates/cobre-sddp/src/lp/builder/entries.rs:1027-1100`, `crates/cobre-sddp/src/production/hydro_models/evaporation.rs:24-55`) | `\gamma^{ev}_{v,h}` | `h \in \mathcal{H}`, stage `t` | (m³/s)/hm³ | math/lp-formulation.md, math/block-formulations.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md; ticket-155; hydro-production-models §2.11, ticket-157c | math/lp-formulation.md | `evaporation.coefficients_mm` and `evaporation.reference_volumes_hm3` (`system/hydros.json`) with `area_km2` (`system/hydro_geometry.parquet`) | yes |
| FPHA least-squares fit-correction factor; scales the whole fitted plane set; the `_hydro.notes` partial writes `alpha_FPHA` in inline code | `k_{FPHA}` | plant, production-model entry | — | math/hydro-production-models.mdx, overview/notation-conventions.md, math/_impl/_hydro.notes.mdx, src/components/FphaPlot.astro | math/hydro-production-models.mdx | — (computed) | yes |
| Intercept-only correction factor of precomputed planes, in `(0, 1]` | `\kappa` | plane | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `kappa` (`system/fpha_hyperplanes.parquet`, defaults to `1.0`) | no |
| Raw convex-hull envelope (pointwise minimum over the raw hull planes) | `FPHA_0` | — | MW | math/hydro-production-models.mdx, src/components/FphaPlot.astro | math/hydro-production-models.mdx | — | no |
| Corrected FPHA envelope, `FPHA = k_{FPHA}\cdot FPHA_0` | `FPHA` | — | MW | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Exact hydro production function, `\phi(v, q, s) = (9.81\,\eta_h/1000) \cdot q \cdot h_{net}` (practitioner term-map: FPH); hydro-production-models §2.8 also writes `\phi_{\max}`, the largest uncapped `\phi` over the fitting grid (ticket-157c guardian F3) | `\phi` | — | MW | math/hydro-production-models.mdx, src/components/FphaPlot.astro | math/hydro-production-models.mdx | — | no |
| Net head, clamped to `\ge 0` (practitioner term-map `h_{liq}`) | `h_{net}` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Forebay level as a function of storage, volume-height curve (practitioner term-map `h_{mon}`) | `h_{fore}` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `volume_hm3`, `height_m` (`system/hydro_geometry.parquet`) | no |
| Volume of breakpoint `i` of the volume-height curve | `v^{(i)}` | breakpoint `i` | hm³ | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `volume_hm3` (`system/hydro_geometry.parquet`) | no |
| Height of breakpoint `i` of the volume-height curve | `h^{(i)}` | breakpoint `i` | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `height_m` (`system/hydro_geometry.parquet`) | no |
| Mean forebay level over the physical storage range | `\bar h_{fore,h}` | `h \in \mathcal{H}` | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Net-head function of a forebay level `h_f` and a flow `Q`, `h_{eq}(h_f, Q) = h_f - h_{tail}(Q) - h_{loss}` | `h_{eq}` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Tailrace level as a function of total outflow (`h_{tail}^{(k)}` per piecewise-quartic segment; practitioner term-map `h_{jus}`) | `h_{tail}` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `tailrace` (`system/hydros.json`) or `system/tailrace_curves.parquet` | no |
| Tailrace polynomial coefficients `c_0, \ldots, c_4` (ascending powers) | `c_0` | — | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `tailrace.coefficients` (`system/hydros.json`, `type: "polynomial"`) | no |
| Piecewise-quartic tailrace segment coefficients `a_0^{(k)}, \ldots, a_4^{(k)}` | `c_0^{(n)}` | segment `k` | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `coefficient_0` … `coefficient_4` (`system/tailrace_curves.parquet`) | no |
| Hydraulic head losses, factor or constant model (practitioner term-map `h_{PerdH}`) | `h_{loss}` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `hydraulic_losses` (`system/hydros.json`) | no |
| Head-loss factor (fraction of the gross head) | `k_{loss}` | — | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `hydraulic_losses.value` (`system/hydros.json`, `type: "factor"`) | no |
| Constant head loss | `\Delta h_{const}` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `hydraulic_losses.value_m` (`system/hydros.json`, `type: "constant"`) | no |
| Downstream reservoir reference forebay level keying a backwater family | `HrefJus` | — | m | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `downstream_reference_level_m` (`system/tailrace_curves.parquet`) | no |
| Flow domain of a piecewise-quartic tailrace table | `[Q_{jus,lo}, Q_{jus,hi}]` | — | m³/s | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `outflow_min_m3s`, `outflow_max_m3s` per segment (`system/tailrace_curves.parquet`) | no |
| Volume window of the computed-FPHA fit; hydro-production-models §5.1 writes `[V_{min}, V_{max}]` | `[v_{min}, v_{max}]` | — | hm³ | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `fpha_config.fitting_window` (`system/hydro_production_models.json`) | no |
| Upper limit of the FPHA fitting grid's flow axis `[0, q_{max}]` | `q_{max}` | — | m³/s | math/hydro-production-models.mdx, src/components/FphaPlot.astro | math/hydro-production-models.mdx | — | no |
| Storage coordinate of the FPHA fitting cloud and grid points `V_i` (`(V, Q, \text{generation})`); the practitioner term-map of hydro-production-models §2.1 also writes `V` for storage | `V` | grid point `i` | hm³ | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `fpha_config.volume_discretization_points` (grid size; `system/hydro_production_models.json`) | no |
| Turbined-flow coordinate of the FPHA fitting cloud and grid points `Q_j`; the practitioner term-map also writes `Q` for turbined flow; the `_hydro.notes` partial writes the grid's zero-flow column as `q = 0` in inline code | `Q` | grid point `j` | m³/s | math/hydro-production-models.mdx, overview/notation-conventions.md, math/_impl/_hydro.notes.mdx | math/hydro-production-models.mdx | `fpha_config.turbine_discretization_points` (grid size; `system/hydro_production_models.json`) | yes |
| Upper end of the lateral-flow secant sample range (`2 \cdot \text{MLT}`, or `2 \cdot q_{max}` when the long-term mean is 0) | `S_{max}` | — | m³/s | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Long-term mean inflow | `\text{MLT}` | — | m³/s | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Lateral flow of the spillage secant (default: own spillage, `q_{lat} = s`) | `q_{lat}` | — | m³/s | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Normal vectors of two FPHA planes compared by the angle reduction method (`\mathbf{n}_1`, `\mathbf{n}_2`) | `\mathbf{n}_1` | — | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Angle between two FPHA plane normals (angle reduction method) | `\theta` | — | degrees | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Merge tolerance of FPHA plane reduction: degrees for the angle method, percent for the distance method | `\varepsilon` | — | degrees or percent | math/hydro-production-models.mdx | math/hydro-production-models.mdx | `fpha_plane_reduction.tolerance_deg` or `fpha_plane_reduction.tolerance_pct` (`system/hydro_production_models.json`) | no |
| Normalised mean-squared generation difference of two planes, `\delta = \text{EQM}/\phi_{\max}^2` (`\text{EQM}` the mean-squared generation difference, `\phi_{\max}` the largest uncapped `\phi` over the fitting grid) | `\delta` | — | — | math/hydro-production-models.mdx | math/hydro-production-models.mdx | — | no |
| Thermal cost-segment capacity; no page writes it (one generation column per thermal per block, ticket-078) | `\bar{g}_{j,s}` | `j \in \mathcal{T}`, segment `s` | MW | — | math/equipment-formulations.mdx | — (no segment field in `system/thermals.json`) | no |
| Thermal generation upper bound (capacity); the anticipated form reads `\bar{G}_i(m)` at the delivery stage `m` (state-augmentation, notation-conventions) | `\bar{G}_j` | `j \in \mathcal{T}` | MW | math/state-augmentation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `generation.max_mw` (`system/thermals.json`) | yes |
| Thermal generation lower bound (minimum stable load); the anticipated form reads `\underline{G}_i(m)` at the delivery stage `m` (state-augmentation, notation-conventions) | `\underline{G}_j` | `j \in \mathcal{T}` | MW | math/state-augmentation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `generation.min_mw` (`system/thermals.json`) | yes |
| Generic capacity bound of a rate variable, used to illustrate the Variable Units Convention (ticket-152) | `\bar{g}` | — | MW | math/system-elements.mdx | math/system-elements.mdx | — | no |
| Line capacity, direct direction; lp-formulation and system-elements write `\bar{F}^+_l` | `\bar{F}^+_n` | `\ell \in \mathcal{L}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `capacity.direct_mw` (`system/lines.json`); stage or block override `direct_mw` (`constraints/line_bounds.parquet`) | yes |
| Line capacity, reverse direction; system-elements writes `\bar{F}^-_l` | `\bar{F}^-_n` | `\ell \in \mathcal{L}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `capacity.reverse_mw` (`system/lines.json`); stage or block override `reverse_mw` (`constraints/line_bounds.parquet`) | yes |
| Reported line efficiency, `\eta_n = 1 - \text{losses}/100`; scales post-solve reported losses and does not enter the dispatch LP | `\eta_n` | `n \in \mathcal{L}` | — | math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `losses_percent` (`system/lines.json`; derived) | yes |
| Reported transmission loss, `(1 - \eta_\ell)(f^+_{\ell,k} + f^-_{\ell,k})`; the `_network.configure` partial writes `losses_mw = (losses_percent/100)·(f⁺+f⁻)` in inline code | `\text{loss}_{n,k}` | `\ell \in \mathcal{L}`, `k \in \mathcal{K}` | MW | math/equipment-formulations.mdx, overview/notation-conventions.md, math/_impl/_network.configure.mdx | math/equipment-formulations.mdx | — | yes |
| Contract dispatch upper bound | `\bar{C}_c` | `c \in \mathcal{C}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `limits.max_mw` (`system/energy_contracts.json`) | yes |
| Contract dispatch lower bound (take-or-pay floor when positive) | `\underline{C}_c` | `c \in \mathcal{C}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `limits.min_mw` (`system/energy_contracts.json`) | yes |
| Pumping power consumption rate | `\rho^{pump}_y` | `y \in \mathcal{P}` | MW/(m³/s) | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `consumption_mw_per_m3s` (`system/pumping_stations.json`) | yes |
| Pumping power consumption, `P^{pump}_{y,k} = \rho^{pump}_y \cdot p_{y,k}` | `P^{pump}_{y,k}` | `y \in \mathcal{P}`, `k \in \mathcal{K}` | MW | math/equipment-formulations.mdx | math/equipment-formulations.mdx | — | no |
| Pumped-flow upper bound | `\bar{P}_y` | `y \in \mathcal{P}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `flow.max_m3s` (`system/pumping_stations.json`); stage or block override `max_m3s` (`constraints/pumping_bounds.parquet`) | yes |
| Pumped-flow lower bound | `\underline{P}_y` | `y \in \mathcal{P}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `flow.min_m3s` (`system/pumping_stations.json`); stage or block override `min_m3s` (`constraints/pumping_bounds.parquet`) | yes |
| Available generation of non-controllable source `r` in block `k` for the current (stage, scenario), the cap of its generation column, `A_{r,k} = \bar{G}_r \xi_r f_{r,k}`; a source without stochastic availability uses its stage's available generation in place of `\bar{G}_r \xi_r` (`crates/cobre-sddp/src/stochastic/noise.rs:366-377`; `crates/cobre-sddp/src/lp/builder/columns.rs:941-948`; `crates/cobre-sddp/src/setup/mod.rs:588-616`) | `A_{r,k}` | `r \in \mathcal{R}`, `k \in \mathcal{K}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | — (scenario pipeline; not capped by `max_generation_mw`) | yes |
| Installed capacity of a non-controllable source | `\bar{G}_r` | `r \in \mathcal{R}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `max_generation_mw` (`system/non_controllable_sources.json`) | yes |
| Curtailable / must-run flag of a non-controllable source | `\chi^{curt}_r` | `r \in \mathcal{R}` | — | math/system-elements.mdx | math/system-elements.mdx | `allow_curtailment` (`system/non_controllable_sources.json`; `false` = must-run) | no |
| Availability ratio of a non-controllable source, `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \varepsilon^{nc}_r, 0, 1)`, a dimensionless factor of the stage and scenario in the block cap `A_{r,k} = \bar{G}_r \xi_r f_{r,k}` (`noise.rs:327-332,366-371`); scenario-generation §5.4 states its stochastic model | `\xi_r` | `r \in \mathcal{R}` | — | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, math/scenario-generation.mdx | math/system-elements.mdx | — | yes |
| Mean of the unclamped availability factor of non-controllable source `r` at a stage, the `mean` column of `scenarios/non_controllable_stats.parquet` (`crates/cobre-io/src/scenarios/non_controllable_stats.rs:10`), read as `ncs_lp.mean` at `crates/cobre-sddp/src/stochastic/noise.rs:367` (v0.17.0); system-elements writes it in the availability ratio `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \cdot \varepsilon^{nc}_r, 0, 1)` (§4 NCS row; resolved at G1 from an `UNRESOLVED` row) | `\mu^{nc}_r` | `r \in \mathcal{R}`, stage `t` | — | math/system-elements.mdx, math/scenario-generation.mdx | math/system-elements.mdx | `mean` (`scenarios/non_controllable_stats.parquet`) | no |
| Standard deviation of the unclamped availability factor of non-controllable source `r` at a stage (`0` = deterministic), the `std` column of `scenarios/non_controllable_stats.parquet` (`non_controllable_stats.rs:11`), read as `ncs_lp.std` at `noise.rs:368`; system-elements writes it in the availability ratio `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \cdot \varepsilon^{nc}_r, 0, 1)` (§4 NCS row; resolved at G1 from an `UNRESOLVED` row) | `s^{nc}_r` | `r \in \mathcal{R}`, stage `t` | — | math/system-elements.mdx, math/scenario-generation.mdx | math/system-elements.mdx | `std` (`scenarios/non_controllable_stats.parquet`) | no |
| Standard-normal noise of non-controllable source `r`, the per-source entry `eta` of the stage noise vector (`noise.rs:366`), combined as `availability_ratio = (mean + std * eta).clamp(0.0, 1.0)` (`noise.rs:370`); system-elements writes it in the availability ratio `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \cdot \varepsilon^{nc}_r, 0, 1)` (§4 NCS row; resolved at G1 from an `UNRESOLVED` row) | `\varepsilon^{nc}_r` | `r \in \mathcal{R}`, stage `t` | — | math/system-elements.mdx, math/scenario-generation.mdx | math/system-elements.mdx | — | no |
| Block factor of a non-controllable source: the per-(stage, block) scaling of its realized availability in the block cap `A_{r,k} = \bar{G}_r \xi_r f_{r,k}`, an absent factor reading 1.0 (`columns.rs:941-947`; `noise.rs:373-377`; `crates/cobre-core/src/model/resolved/factors.rs:1-4`); see the block-load-factor row for `f_{b,t,k}` | `f_{r,k}` | `r \in \mathcal{R}`, `k \in \mathcal{K}` | — | math/equipment-formulations.mdx, math/system-elements.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | `non_controllable_factors[].block_factors[].factor` (`scenarios/non_controllable_factors.json`) | yes |
| Reported line efficiency written bare as `\eta` among the constraint-matrix coefficients of the system-elements conditioning sentence (`\eta \approx 0.95`–`1.0`, a 0–5 % loss band); at v0.17.0 it never enters the constraint matrix (losses scale only the reported flows, `crates/cobre-io/src/output/simulation_writer.rs:587`), so G1 removes the clause (§4 NCS row; resolved at G1 from an `UNRESOLVED` row); see the reported-line-efficiency row; no page writes it (ticket-152) | `\eta_n` | `n \in \mathcal{L}` | — | — | math/equipment-formulations.mdx | `losses_percent` (`system/lines.json`; derived) | no |
| Seasonal mean inflow; par-inflow-model writes `\mu_{m(t)}`, `\mu_{m(t-\ell)}`, equates it to the sample mean `\bar{a}_m` (bar = sample mean; also `\bar{a}_{m-\ell}`), writes the estimate `\hat{\mu}_m` and `μₘ` in its d2 diagram; toy-single-reservoir writes the bare `\mu` and `\mu_t`, toy-four-reservoir the per-hydro `\mu_h` (`\mu_1`, …), the glossary `\mu_t` and `\mu_m`, and `_par.io` `\mu_m` | `\mu_m` | `m \in \{1, \ldots, M\}` | m³/s | math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md, math/_impl/_par.io.mdx | math/par-inflow-model.mdx | `mean_m3s` (`scenarios/inflow_seasonal_stats.parquet`) | yes |
| Seasonal sample standard deviation of season `m` (population divisor): the conditioning-plane magnitude and the standardization basis of `\psi^*`; also `s_{m(t)}`, `s_{m-\ell}`, the estimate `\hat{s}_m`, the re-conditioned `\tilde s_m = c\, s_m`, `sₘ` in par-inflow-model's d2 diagram; `_par.io` writes `s_m` ('your series' seasonal sample std', the `std_m3s` content) and the lagged `s_{m-\ell}` in `\psi^*_{m,\ell} = \psi_{m,\ell}\,s_{m-\ell}/s_m`; the glossary writes the stored seasonal std as `\sigma_m` ('Seasonal mean / std', converting standardised PAR coefficients to original units); the toy pages label their 0-order noise scale `\sigma` and `\sigma_h` 'Inflow seasonal std deviation', and toy-single-reservoir says `inflow_seasonal_stats.parquet` carries `\sigma_t`, which equals `s_m` only because `r_m = 1` at order 0 (see the innovation-std row) | `s_m` | `m \in \{1, \ldots, M\}` | m³/s | math/par-inflow-model.mdx, math/multi-resolution-studies.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md, math/_impl/_par.io.mdx | math/par-inflow-model.mdx | `std_m3s` (`scenarios/inflow_seasonal_stats.parquet`) | yes |
| AR coefficient of season `m`, lag `\ell` (original units); lp-formulation §5 writes `\psi_{m(t),\ell}`; par-inflow-model writes `\psi_{m(t),\ell}`, `\psi_{m,j}`, bare `\psi` (§1.2, §2.6 and §3) and `ψₘ,ℓ` in its d2 diagram; `_par.io` writes `\psi_{m,\ell}` ('your original-unit AR coefficients') and the bare `\psi` | `\psi_{m,\ell}` | `m \in \{1, \ldots, M\}`, `\ell \in \{1, \ldots, P_h\}` | — | math/lp-formulation.md, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, overview/notation-conventions.md, math/_impl/_par.io.mdx | math/par-inflow-model.mdx | — (`coefficient` in `scenarios/inflow_ar_coefficients.parquet` holds the standardized coefficient) | yes |
| Standardized AR coefficient of season `m`, lag `\ell` (standardized by `s_m`; the direct Yule-Walker output, dynamics plane); also bare `\psi^*`, `\psi^*_{m(t),\ell}`, `\psi_{m,\ell}^*`, the vector `\boldsymbol{\psi}_m^*` with solution `\hat{\boldsymbol{\psi}}_m^*`, the order-`k` fit's last coefficient `\hat{\psi}^*_{m,k}` (the PACF value), and `ψ*ₘ,ℓ`, `ψ*` in d2 diagrams; `_par.io` writes `\psi^*` and the standardization `\psi^*_{m,\ell} = \psi_{m,\ell}\,s_{m-\ell}/s_m`; `_par.notes` writes `\psi^*_{m,\ell}` in the closure; par-inflow-model writes the order-0 reset rule `\psi^*_{m,1} < 0`, and par-inflow-model's relation note (§1) names `\phi` as other implementations' AR notation; at the tag the rule tests the first Yule-Walker coefficient (`has_negative_phi1`, `crates/cobre-stochastic/src/par/contribution.rs:107-113`; `crates/cobre-stochastic/src/par/fitting/estimation.rs:1009-1024` pre-pass on both paths, `:1128-1146` classical re-fit, `:793-829` PAR(p)-A re-fit); see the production-function, deterministic-base and arrival-density rows for the other meanings of `\phi` | `\psi^*_{m,\ell}` | `m \in \{1, \ldots, M\}`, `\ell \in \{1, \ldots, p_m\}` | — | math/par-inflow-model.mdx, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx | math/par-inflow-model.mdx | `coefficient` (`scenarios/inflow_ar_coefficients.parquet`) | yes |
| Residual (innovation) standard deviation of season `m`; lp-formulation §5 and block-formulations §2.2 write `\sigma_{m(t)}`; par-inflow-model writes `\sigma_{m(t)}`, the estimate `\hat{\sigma}_m` and `σₘ` in its d2 diagram, derived as `\sigma_m = s_m \cdot r_m`; the toy pages write the 0-order noise scale bare as `\sigma` and `\sigma_t` (toy-single-reservoir) and per hydro as `\sigma_h` (toy-four-reservoir) in `a_t = \mu + \sigma\, \varepsilon_t` and `a_{h,t} = \mu_h + \sigma_h\, \varepsilon_{h,t}`, labelled 'seasonal std deviation' (see the seasonal-std row); the glossary writes `\sigma_t` in its 0-order formula; `_par.io` writes `\sigma_m`, the bare `\sigma` and the user's own estimate `\hat\sigma_m`; `_par.notes` writes `sigma_m` in inline code; `_scenario.notes` writes `σ = 0` for the zero standard deviation of the §4.3 inversion rule | `\sigma_m` | `m \in \{1, \ldots, M\}` | m³/s | math/lp-formulation.md, math/block-formulations.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx, math/_impl/_scenario.notes.mdx | math/par-inflow-model.mdx | — (derived at load; `std_m3s` in `scenarios/inflow_seasonal_stats.parquet` is the seasonal sample standard deviation) | yes |
| Standardized innovation scale of season `m`, `r_m = \sigma_m / s_m \in (0, 1]`, derived from `\psi^*` by the periodic-ACF closure (`r_m^2 = 1 - \sum_{\ell} \psi^*_{m,\ell}\, \rho_m(\ell)`); also `r_{m(t)}`, `rₘ` in par-inflow-model's d2 diagram; `_par.io` writes `r_m = \sigma_m/s_m` and `r_m = 1` at order 0; `_par.notes` writes `r_m` in inline code, the closure `r_m^2 = 1 - \sum_\ell \psi^*_{m,\ell}\rho_m(\ell)` and `r_m = 1`, and calls `r_m^2` the 'coefficient of determination' and `1 - r_m^2` the 'residual variance', reporting `r_squared`; at the tag `r_squared` is `1.0 - explained` (`explained` = `\sum_\ell \psi^*_{m,\ell}\rho_m(\ell)`), the residual-variance fraction `r_m^2` that the floor tests (`crates/cobre-stochastic/src/par/closure.rs:121,164,221-226`; message 'implied residual variance r²', `crates/cobre-io/src/validation/semantic/scenarios.rs:441`) | `r_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx | math/par-inflow-model.mdx | — (derived at load; not stored) | yes |
| PAR innovation, standardized noise `\varepsilon_t \sim \mathcal{N}(0,1)`; inflow-nonnegativity writes `\varepsilon` and, per hydro, `\varepsilon_h`; scenario-generation writes the correlated noise vector `\varepsilon = C^{1/2} z`, its entity component `\varepsilon_i`, the opening noise vector `\varepsilon_{t,j}` and window `y`'s noise `\varepsilon_{h,t}(y)`; the toy pages write `\varepsilon_t` and the bare `\varepsilon` (openings `\varepsilon \in \{-1, 0, +1\}`), toy-four-reservoir the per-hydro `\varepsilon_{h,t}` and the correlated vector `\varepsilon = C^{1/2} z`; the glossary writes `\varepsilon_t`, the per-hydro `\varepsilon_h`, the correlated vector `\varepsilon = C^{1/2} z` and the opening noise vector `\varepsilon` | `\varepsilon_t` | stage `t` (hydro `h` for `\varepsilon_h`; entity `i` and opening `j` on scenario-generation) | — | math/lp-formulation.md, math/block-formulations.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/par-inflow-model.mdx | — | yes |
| Adjusted innovation of the noise-adjustment reference design, `\varepsilon_h^{adj} = \varepsilon_h + \xi_h` | `\varepsilon_h^{adj}` | `h \in \mathcal{H}` | — | math/inflow-nonnegativity.md | math/inflow-nonnegativity.md | — | no |
| Deterministic base of the PAR(p) inflow equation; lp-formulation §5 writes `b_{h,m(t)}`, labelled 'deterministic base'; inflow-nonnegativity writes `b_{h,m}`, indexing the season directly as `m`, labelled 'deterministic base' in its first display; par-inflow-model §2.3 writes it expanded (`\mu_{m(t)} - \sum_{\ell} \psi_{m(t),\ell} \mu_{m(t-\ell)}`, labelled 'deterministic base') and §2.4 defines `b_{h,m(t)}`; scenario-generation §4.3 writes `b_{h,m} = \mu_m - \sum_{\ell} \psi_{m,\ell} \mu_{m-\ell}` ('the precomputed base value') | `b_{h,m(t)}` | `h \in \mathcal{H}`, season `m(t)` | m³/s | math/lp-formulation.md, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | — (precomputed from the seasonal means and AR coefficients) | yes |
| Right-hand side of the AR-dynamics row, `\text{RHS}_{h,t} = b_{h,m(t)} + \sigma_{m(t)} \cdot \varepsilon_t` | `\text{RHS}_{h,t}` | `h \in \mathcal{H}`, stage `t` | m³/s | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Standard normal distribution of the PAR innovation and of the independent draws `z`; scenario-generation writes `N(0,1)`, par-inflow-model §6 the multivariate `\mathcal{N}(0, I)` (`I` the identity); the toy pages write `\mathcal{N}(0, 1)`; the glossary writes `\mathcal{N}(0,1)` and the multivariate `\mathcal{N}(0, I)` | `\mathcal{N}(0,1)` | — | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/par-inflow-model.mdx | — | yes |
| Vector of independent standard normal draws mapped to correlated noise, `z \sim \mathcal{N}(0, I)`; scenario-generation writes the entity component `z_i \sim N(0,1)`; toy-four-reservoir and the glossary write `\varepsilon = C^{1/2} z` (`z \sim \mathcal{N}(0, I)` on the glossary) | `z` | entity `i` (`z_i`) | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx, reference/glossary.md | math/scenario-generation.mdx | — | yes |
| Cross-entity (spatial) correlation matrix of a correlation group; scenario-generation writes its eigendecomposition `C = U \Lambda U^\top`; the glossary writes it only in the factor `C^{1/2}` | `C` | — | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx, reference/glossary.md | math/par-inflow-model.mdx | `profiles.<name>.correlation_groups[].matrix` (`scenarios/correlation.json`) | yes |
| Pooled estimated residual correlation matrix: each off-diagonal entry the pairwise-complete Pearson correlation (Bessel divisor) of two hydros' fitted residuals `\tilde{\varepsilon}_{h,t}` over the residual periods of every season, zero with fewer than two shared periods or a residual standard deviation below machine epsilon, clamped to `[-1, 1]`; unit diagonal; not forced positive semidefinite; used by every stage whose season has no `\hat{C}_m` (`crates/cobre-stochastic/src/par/fitting/correlation.rs:54-68,396-469,530-613`) | `\hat{C}` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Per-season estimated residual correlation matrix of season `m`, formed like `\hat{C}` from the residuals of season `m` alone; the stages of season `m` use it when every hydro pair has at least 30 shared residual periods in that season (the constant `MIN_CORRELATION_PAIRS`), otherwise `\hat{C}` (`crates/cobre-stochastic/src/par/fitting/correlation.rs:25-27,366-391,594-605`) | `\hat{C}_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Orthogonal eigenvector matrix of the correlation matrix, `C = U \Lambda U^\top`; par-inflow-model writes the entry `U_{hi}`, the component of eigenvector `i` on hydro `h` | `U` | — | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | — | yes |
| Diagonal eigenvalue matrix of the correlation matrix, `\Lambda = \mathrm{diag}(\lambda_1, \ldots, \lambda_n)`; scenario-generation writes it in `C = U \Lambda U^\top` | `\Lambda` | — | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | — | yes |
| Eigenvalues of the correlation matrix, `\lambda_1, \ldots, \lambda_n` (eigenvalue index `i`, matrix dimension `n`) | `\lambda_i` | `i \in \{1, \ldots, n\}` | — | math/par-inflow-model.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | — | yes |
| Clipped eigenvalue square root, `\tilde{\Lambda}^{1/2} = \mathrm{diag}(\sqrt{\max(\lambda_1, 0)}, \ldots, \sqrt{\max(\lambda_n, 0)})` | `\tilde{\Lambda}^{1/2}` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Spectral (symmetric square-root) correlation factor `U \Lambda^{1/2} U^\top`, with negative eigenvalues clipped, mapping independent draws to correlated noise `C^{1/2} z`; scenario-generation writes the clipped factor `C^{1/2} = U \tilde{\Lambda}^{1/2} U^\top`; toy-four-reservoir and the glossary write `\varepsilon = C^{1/2} z` with `C^{1/2} = U \Lambda^{1/2} U^{\top}` | `C^{1/2}` | — | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx, reference/glossary.md | math/par-inflow-model.mdx | — | yes |
| Covariance of the generated correlated noise after eigenvalue clipping, `\tilde{C} = U \max(\Lambda, 0) U^\top` with `\max(\Lambda, 0) = \mathrm{diag}(\max(\lambda_1, 0), \ldots, \max(\lambda_n, 0))`; equal to `C` when no eigenvalue is negative; diagonal `\tilde{C}_{hh} = 1 + \sum_{i:\, \lambda_i < 0} U_{hi}^2 \lvert \lambda_i \rvert \ge 1`, with no renormalisation (`crates/cobre-stochastic/src/correlation/spectral.rs:1-11,115-139`) | `\tilde{C}` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Lower-triangular Cholesky factor of the correlation matrix, `C = L L^\top` (the alternative to the spectral factor) | `L` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Incremental inflow of hydro `h` at the current stage; hydro-production-models §5.4 writes `a_{h,k}`; lp-formulation equates it to the realized inflow `z_h`; system-elements labels it `a` in its d2 diagram; par-inflow-model writes the stage-indexed `a_{h,t}` and lagged values `a_{h,t-\ell}`, `a_{h,\, t-j}`; multi-resolution-studies writes the stage-indexed `a_{h,t}`; scenario-generation §4.3 writes the lagged value `a_{t-\ell}` without the hydro index; scenario-generation writes the record observation `a^{\text{obs}}_h(y', m)` and window `y`'s lag chain `a^{(y)}_{h,t}`; sddp-algorithm §5.1 writes the past inflows `a_{h,t-1}, a_{h,t-2}, \ldots`; toy-single-reservoir writes the bare `a`, the stage-indexed `a_t`, `a_1`, …, `a_4` and `a_t(\omega)`, `a_4(\omega)` (d2 label `aₜ`); toy-four-reservoir writes `a_h`, `a_{h,t}`, the bare `a` and the hydro-numbered `a_1`, …, `a_4` (d2 labels `a₁`–`a₄`); the glossary writes `a_t` in its 0-order formula | `a_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/multi-resolution-studies.md, math/sddp-algorithm.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/lp-formulation.md | — | yes |
| Water reaching the reservoir under a penalty-based inflow method, `a_h + \sigma^{inf}_h` | `a_h^{effective}` | `h \in \mathcal{H}` | m³/s | math/inflow-nonnegativity.md | math/inflow-nonnegativity.md | — | no |
| Standardized inflow of the periodic Yule-Walker system, `(a_{h,t} - \mu_m) / s_m`, with lags `\tilde{a}_{t-(i+1)}`; also written `\tilde{a}_{h,t}` with the hydro index in the residual of §6.1, standardized there by the sample estimates `\hat{\mu}_{m(t)}` and `\hat{s}_{m(t)}` | `\tilde{a}_t` | historical period `t` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Fitted standardized residual of hydro `h` at historical period `t`, `\tilde{a}_{h,t} - \sum_{\ell=1}^{p_{m(t)}} \psi^*_{m(t),\ell}\, \tilde{a}_{h,t-\ell}`, formed only where all `p_{m(t)}` lagged inflows are observed; the input of `\hat{C}` and `\hat{C}_m` (`crates/cobre-stochastic/src/par/fitting/correlation.rs:39-52,206-255`) | `\tilde{\varepsilon}_{h,t}` | `h \in \mathcal{H}`, historical period `t` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Periodic autocorrelation at lag `\ell` for season `m`: the model's implied ACF (§4.1 closure, §5, §2.1; `\rho_{m(t)}`, `\rho_{m'}(0) = 1`) and, hatted, the sample estimate `\hat{\rho}_m(\ell)` (§3.4-§3.5, `\hat{\rho}_{(m-1)}(1)`); scenario-generation's d2 diagram writes bare `ρ`; `_par.notes` writes `\rho_m(\ell)` in the closure | `\rho_m(\ell)` | `m \in \{1, \ldots, M\}`, lag `\ell` | — | math/par-inflow-model.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, math/_impl/_par.notes.mdx | math/par-inflow-model.mdx | — | yes |
| Periodic autocovariance at lag `\ell` for season `m` (sample estimate `\hat{\gamma}_m(\ell)`); the §3.5 reference-formulation note writes `\gamma_m(0)`, `\gamma_m(\ell)` and bare `\gamma` | `\gamma_m(\ell)` | `m \in \{1, \ldots, M\}`, lag `\ell` | (m³/s)² | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Periodic Yule-Walker correlation matrix of season `m` (`p \times p`, symmetric, not Toeplitz for `M > 1`; inverse `\mathbf{R}_m^{-1}`); PAR(p)-A writes the extended `(p+1) \times (p+1)` matrix `\mathbf{R}^{\,\text{ext}}_m` | `\mathbf{R}_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Yule-Walker right-hand side of season `m`, the target autocorrelations `[\hat{\boldsymbol{\rho}}_m]_i = \hat{\rho}_m(i)`; PAR(p)-A writes `\hat{\boldsymbol{\rho}}^{\,\text{ext}}_m` | `\hat{\boldsymbol{\rho}}_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Critical value of the PACF significance test, `z_{0.975} = 1.96` (95 % confidence), in the threshold `z_{0.975} / \sqrt{N_m}` | `z_{0.975}` | — | — | math/par-inflow-model.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | — (fixed at 1.96) | yes |
| Common observation value of a `Constant` historical bucket, imposed as the seasonal mean with zero standard deviation | `\text{value}` | — | m³/s | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Modal value of a `Saturated` historical bucket, treated as the cap and imposed as the seasonal mean with zero standard deviation | `\text{cap}` | — | m³/s | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Annual regressor of PAR(p)-A: the rolling 12-month average of incremental inflows ending one stage before `t`, `A_{h,t-1} = \frac{1}{12} \sum_{\ell=1}^{12} a_{h,\, t-\ell}`; §7.3 writes the rolling window `A_t` and its bucket values `A^{(w)}` (window `w`); §7.5 writes `A_{t-1}` (standardised by its own seasonal statistics), the bucket size `\lvert A\rvert` (written with bars) and the mean `\bar{A}` | `A_{h,t-1}` | `h \in \mathcal{H}`, stage `t` | m³/s | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Seasonal mean of season `m`'s annual regressor (estimate `\hat{\mu}^A_m`; also `\mu^A_{m(t)}`) | `\mu^A_m` | `m \in \{1, \ldots, M\}` | m³/s | math/par-inflow-model.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | `annual_mean_m3s` (`scenarios/inflow_annual_component.parquet`) | yes |
| Population-divisor standard deviation of season `m`'s annual regressor, `> 0` (estimate `\hat{\sigma}^A_m`; re-conditioned `\tilde\sigma^A_m`) | `\sigma^A_m` | `m \in \{1, \ldots, M\}` | m³/s | math/par-inflow-model.mdx, overview/notation-conventions.md | math/par-inflow-model.mdx | `annual_std_m3s` (`scenarios/inflow_annual_component.parquet`) | yes |
| Standardised annual coefficient of PAR(p)-A (dimensionless Yule-Walker output for the annual term), written bare; the bare `\psi` of par-inflow-model §1.2, §2.6 and §3 is the AR coefficient instead | `\psi^{A*}_m` | per (hydro, season) | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | `annual_coefficient` (`scenarios/inflow_annual_component.parquet`) | no |
| Original-unit annual coefficient of PAR(p)-A at season `m`, `\psi^A_m = \psi^{A*}_m \cdot s_m / \sigma^A_m` (also `\psi^A_{m(t)}`) | `\psi^A_m` | `m \in \{1, \ldots, M\}` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — (derived at LP construction) | no |
| Standardised inflow series of the PAR(p)-A conditional FACP (the page's 'standardised inflow series', the inflow standardised by its seasonal statistics): the FACP at lag `k` correlates its current-stage value with its lag-`k` value conditioned on its intermediate lags and on the annual regressor `A_{t-1}`; `Z_{-1}` is its one-step lag, `Z^{(w)}` its bucket values (window `w`), `\bar{Z}` its mean and `\lvert Z\rvert` (written with bars) its bucket size | `Z` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Rolling-window index of a PAR(p)-A (hydro, season) bucket: the bucket values `A^{(w)}` and `Z^{(w)}` and the sums `\sum_w` of §7.3 and §7.5 run over the 12-month windows `w` assigned to the season; see the block-weight and census-weight rows for `w_k` and `w_m`, and §1.1 for the declared scoped reuse | `w` | windows of a (hydro, season `m`) bucket | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Cross-covariance block of the PAR(p)-A conditional FACP between `Z` and the annual regressor `A`, with the max-bucket-size divisor `1/\max(\lvert A\rvert, \lvert Z\rvert)`; the page names the blocks `Z \otimes Z`, `Z \otimes A`, `A \otimes Z_{-1}` and `A \otimes A` | `\hat{\gamma}_{Z \otimes A}(\ell)` | lag `\ell` | m³/s | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Uniform rescaling factor of a conditioning swap, `\tilde s_m = c\, s_m` for every season `m` | `c` | — | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Target inflow of an external or historical scenario at stage `t` for hydro `h`, the value the noise inversion reproduces | `a_t^{\text{target}}` | stage `t`, hydro `h` | m³/s | math/scenario-generation.mdx | math/scenario-generation.mdx | `value_m3s` (`scenarios/external_inflow_scenarios.parquet`; `scenarios/inflow_history.parquet` under the historical scheme) | no |
| Deterministic part of the inflow in the noise inversion, `b_{h,m} + \sum_{\ell} \psi_{m,\ell} \cdot a_{t-\ell}` (the inflow at zero noise); no page writes the symbol: scenario-generation §4.3 names it in prose 'the deterministic PAR component', the window-pool inversion of §3.2 writes the deterministic value `b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell}\, a^{(y)}_{h,t-\ell}`, and §4.4 calls it the model's 'deterministic PAR output' | `\text{deterministic component}` | stage `t` | m³/s | — | math/scenario-generation.mdx | — | no |
| Inflow the LP reconstructs from the implied noise and its own lag state | `a_t^{\text{reconstructed}}` | stage `t` | m³/s | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Systematic per-stage offset between target and reconstructed inflow when the inversion lag chain and the LP start from different roots, `\Delta a_{h,t} = a_t^{\text{target}} - a_t^{\text{reconstructed}}` | `\Delta a_{h,t}` | `h \in \mathcal{H}`, stage `t` | m³/s | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Raw historical inflow `\ell` periods before the replayed window (the window's year-preceding lags), the alternative inversion root to the derived seed `\text{seed}_\ell` | `\text{window\_lag}_\ell` | lag `\ell` | m³/s | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Aggregated (coarse-resolution) observation: the duration-weighted sum of the fine observations of quarter `Q`, `a^{(Q)}_q = \sum_{m \in Q} d_m \cdot a^{(M)}_m` (`q` indexes the quarterly observations); no page writes it (ticket-103) | `a^{(Q)}_q` | quarterly observation `q` | m³/s | — | math/multi-resolution-studies.md | — | no |
| Fine-resolution (monthly) observation of month `m` within quarter `Q`; no page writes it (ticket-103) | `a^{(M)}_m` | `m \in Q` | m³/s | — | math/multi-resolution-studies.md | — | no |
| Duration weight of month `m` within quarter `Q`: its fraction of the quarter's duration, `\sum_{m \in Q} d_m = 1`; no page writes it (ticket-103) | `d_m` | `m \in Q` | — | — | math/multi-resolution-studies.md | — | no |
| Share of lag period `\mathcal{W}` covered by stage `t`, `w_{t,\mathcal{W}} = \lvert t \cap \mathcal{W} \rvert / \lvert \mathcal{W} \rvert` (the hours of stage `t` inside `\mathcal{W}` over the hours of the period); a completed period contributes the duration-weighted mean `\sum_t w_{t,\mathcal{W}}\, a_{h,t} / \sum_t w_{t,\mathcal{W}}` to the lag state; see the block-weight, census-weight and rolling-window rows for `w_k`, `w_m` and `w`, and §1.1 for the declared scoped reuse | `w_{t,\mathcal{W}}` | stage `t`, lag period `\mathcal{W}` | — | math/multi-resolution-studies.md | math/multi-resolution-studies.md | — | no |
| Transition probability of the policy-graph edge from node `n` to its child `n'` (between-node weight, normalised to sum to 1 per node); also written as the d2 edge labels `p₁`, `p₂`, `p₃`, `q` and `1−q` (and `1.0` on the stage chain); sddp-algorithm §4 writes the stage-chain transition probability as 'probability `1`'; cut-management, sddp-algorithm and policy-graphs weight the successor-opening pair `(n', \omega)` by the product `P(n \to n')\, p_{n'}(\omega)` | `P(n \to n')` | outgoing edges of node `n` | — | math/policy-graphs.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md | math/policy-graphs.mdx | `policy_graph.transitions[].probability` (`stages.json`) | yes |
| Linearised evaporation target of the evaporation equality row; no page writes it (the evaporation target is the linearised row on lp-formulation `### Evaporation Row`) | `\text{EvapCoef} \times \text{Area}(V_{avg})` | `h \in \mathcal{H}` | m³/s | — | math/lp-formulation.md | `evaporation.coefficients_mm`, `evaporation.reference_volumes_hm3` (`system/hydros.json`); `area_km2` (`system/hydro_geometry.parquet`) | no |
| Per-stage magnitude bound of the signed evaporation column, `e_h \in [-q^{\max}_{ev,h}, +q^{\max}_{ev,h}]`, recomputed at each stage as `\lvert \gamma^{ev}_{0,h} + \gamma^{ev}_{v,h} \bar{V}_h \rvert` times a fixed safety margin (`crates/cobre-sddp/src/lp/builder/columns.rs:675-703`, margin `lp/builder/mod.rs:94`) | `q^{\max}_{ev,h}` | `h \in \mathcal{H}` | m³/s | math/penalty-system.mdx | math/lp-formulation.md | — (each stage's linearised target at maximum storage times a safety margin) | no |
| Same-stage travel-time share of an upstream release: the fraction of the release of upstream plant `h'` that reaches the downstream water balance within the release stage `t`, the rest depositing into transit buckets (spec §4 E04 WP1), `\nu_{h',t,0} = (H_t - \Delta^{tt}_{h'})^+ / H_t` with `\Delta^{tt}_{h'}` the travel time of the main cascade arc of `h'`, `1` without a travel time (ledger HYD-01, HYD-03); spec §3.2 credits the same share to `hydro_inflow` on a parallel stage; at the tag the arc's same-stage stage-clock weight `k_0`, the arrival window being the release stage delayed by the travel time (`crates/cobre-sddp/src/lead_time/mod.rs:20-30,47-51,85-99`; `crates/cobre-sddp/src/lp/builder/entries.rs:334-380`), and the full release on an undeclared arc (`crates/cobre-sddp/src/lp/builder/entries.rs:354-361`); see the within-stage-routing row for the chronological counterpart | `\nu_{h',t,0}` | upstream plant `h' \in \mathcal{U}_h`, stage `t` | — | math/lp-formulation.md, math/state-augmentation.md, overview/notation-conventions.md, math/system-elements.mdx | math/lp-formulation.md | — (derived from `travel_time_hours` in `system/hydros.json` and the stage hours) | yes |
| Within-stage routing share on a chronological stage: the fraction of upstream plant `h'`'s block-`k'` release on a declared travel-time arc that reaches the downstream block-`k` water balance in the same stage, `k \ge k'`, the rest depositing into transit buckets; without a travel time `\nu^{k \to k}_{h',t} = 1` and `\nu^{k' \to k}_{h',t} = 0` for `k' < k` (spec §3.2 'within-stage routing on a chronological stage', without a symbol; ledger HYD-01, HYD-11, which credits, in the decided indices, `\sum_{k' \le k} \nu^{k' \to k}_{h',t} (\zeta_{k'} / \zeta_k)(q+s)_{h',k'}` to `hydro_inflow`); at the tag each chronological block row carries the arc's `within_stage_routing` share from source block `b` to target block `b + j` (`crates/cobre-sddp/src/lead_time/mod.rs:31-40,182-218`; `crates/cobre-sddp/src/lp/builder/entries.rs:550-620`), and the full release on its own block on an undeclared arc (`crates/cobre-sddp/src/lp/builder/entries.rs:561-571`); see the same-stage-share row for the parallel counterpart | `\nu^{k' \to k}_{h',t}` | upstream plant `h'`, stage `t`, source block `k'`, target block `k \ge k'` | — | math/lp-formulation.md, math/state-augmentation.md, overview/notation-conventions.md | math/lp-formulation.md | — (derived from `travel_time_hours` in `system/hydros.json` and `stages[].blocks[].hours` in `stages.json`) | yes |
| Travel time of the main cascade arc of upstream plant `h'` (hours), `0` when none is declared; it sets the same-stage share `\nu_{h',t,0}` (`crates/cobre-sddp/src/lead_time/mod.rs:47-51,85-93`) | `\Delta^{tt}_{h'}` | `h' \in \mathcal{H}` | hours | math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx | math/lp-formulation.md | `travel_time_hours` (`system/hydros.json`) | yes |
| Arrival density spreading a maturing in-transit bucket over the arrival stage's blocks (chronological blocks), `\phi_{h,k} \ge 0`, `\sum_k \phi_{h,k} = 1`; on a parallel stage `\phi_{h,k} = w_k = \tau_k/H_t` in a `hydro_inflow` term (lp-formulation §10; `crates/cobre-sddp/src/lp/builder/delivery_ring.rs:385-396,430`, `crates/cobre-sddp/src/bucket_topology.rs:324-325,375-377`) | `\phi_{h,k}` | receiving plant `h`, `k \in \mathcal{K}` | — | math/lp-formulation.md, math/state-augmentation.md, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| State-vector dimension, `n_{\text{state}} = N(1 + P^{\max}) + B + A \, k_{max}` (state-augmentation §1, notation-conventions); the upper-bound-evaluation appendix (Computational Considerations) writes `n_{state}` | `n_{\text{state}}` | — | — | math/state-augmentation.md, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Per-stage minimum end-of-stage storage of a filling hydro (filling floor), `\min(\underline{V}_{h,L} - \sum_{t'=t+1}^{L} \zeta_{t'}\,\text{rate}_{t'}, \underline{V}_{h,t})`, one soft floor at every Filling stage (`crates/cobre-sddp/src/setup/lp_build_inputs.rs:34-96`; `crates/cobre-sddp/src/lp/builder/layout.rs:676-695`) | `V^{\text{target}}_t` | stage `t` in `[start_stage_id, entry_stage_id)` | hm³ | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — (derived from `filling.filling_min_rate_m3s`) | yes |
| Minimum accumulation rate of a filling hydro at stage `t`; lp-formulation §8 writes `\text{rate}_{t'}` with the stage dummy `t'` of the closed-form filling floor | `\text{rate}_t` | stage `t` | m³/s | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md | `filling.filling_min_rate_m3s` (`system/hydros.json`); stage override `filling_min_rate_m3s` (`constraints/hydro_bounds.parquet`) | yes |
| Seed storage of a filling hydro at the start of its filling window; no page writes it (the load-time filling-sufficiency check is described in words in the penalty-system Configure tab) | `v^{\text{seed}}_h` | `h \in \mathcal{H}^{fill}` | hm³ | — | math/lp-formulation.md | `filling_storage[].value_hm3` (`initial_conditions.json`) | no |
| Commissioning-window entry stage (inclusive), written as its key name in math; no page writes it (lp-formulation, penalty-system and system-elements state it in words, 'entry stage'; tickets 152, 159) | `\text{entry\_stage\_id}` | — | — | — | math/lp-formulation.md | `entry_stage_id` (lines, thermals, hydros, non-controllable sources, pumping stations and contracts in `system/`) | no |
| Commissioning-window exit stage (exclusive), written as its key name in math; no page writes it (system-elements §1 states it in words, 'exit stage'; ticket-152) | `\text{exit\_stage\_id}` | — | — | — | math/lp-formulation.md | `exit_stage_id` (lines, thermals, hydros, non-controllable sources, pumping stations and contracts in `system/`) | no |
| Filling-window start stage (inclusive), written as its key name in math; no page writes it (lp-formulation and penalty-system state it in words, 'filling start stage'; ticket-159) | `\text{start\_stage\_id}` | — | — | — | math/lp-formulation.md | `filling.start_stage_id` (`system/hydros.json`) | no |
| Cost-scale factor dividing every objective coefficient except `\theta`; cut-management §2 writes 'a further factor `K` converts to original cost units' | `K` | — | — | math/lp-layout-and-scaling.md, math/cut-management.mdx, overview/notation-conventions.md; ticket-159 | math/lp-layout-and-scaling.md | `modeling.cost_scale_factor` (`config.json`) | yes |
| Objective coefficient of LP column `j`; `\tilde{c}_j` is its scaled form (`c_j / K` under cost scaling, `c_j \cdot d_j^{col}` under column scaling) | `c_j` | LP column `j` | — | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| Column scale factor (geometric mean); written `d^{col}_h`, `d^{col}_{h,\ell}`, `d^{col}_{h,d}` and bare `d^{col}` on the incoming-state columns; cut-management §8.1 calls it each state column's 'column scaling factor, the `d^{col}` of §2'; the `_cut-management.notes` partial writes the cut-coefficient unscaling `coefficient = reduced_cost / col_scale[col]` in inline code; solver internal, kept in its derivation section (NOT-02) | `d_j^{col}` | LP column `j` | — | math/lp-layout-and-scaling.md, math/state-augmentation.md, math/block-formulations.mdx, math/hydro-production-models.mdx, math/cut-management.mdx, math/_impl/_cut-management.notes.mdx | math/lp-layout-and-scaling.md | — | no |
| Row scale factor (geometric mean) | `d_i^{row}` | LP row `i` | — | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| Constraint-matrix entry (matrix `A` in `D_r \cdot A \cdot D_c`); `\tilde{A}_{ij}` is column-scaled, `\check{A}_{ij}` row-scaled (the check marks the row-scaled form) | `A_{ij}` | row `i`, column `j` | — | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| Column bounds of LP column `j` (`l_j`, `u_j`; column-scaled `\tilde{l}_j`, `\tilde{u}_j`) | `l_j` | LP column `j` | — | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| Row bounds of LP row `i` (`l_i^{row}`, `u_i^{row}`; row-scaled `\check{l}_i^{row}`, `\check{u}_i^{row}`) | `l_i^{row}` | LP row `i` | — | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| Diagonal row and column scaling matrices of `D_r \cdot A \cdot D_c` | `D_r` | — | — | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| LP column variable and its column-scaled form `\tilde{x}_j = x_j / d_j^{col}`; cut-management §8.1 writes the column-scaled value `x_{\text{scaled}}` and its unscaled `x_{\text{raw}}`, the scaled value multiplied by its column's `d^{col}` (`x^*_{\text{raw}}`, `\theta^*_{\text{raw}}` at the resident-set optimum) | `x_j` | LP column `j` | — | math/lp-layout-and-scaling.md, math/cut-management.mdx, overview/notation-conventions.md | math/lp-layout-and-scaling.md | — | yes |
| Objective component totals over the stage, per-block terms weighted by `\tau_k` (`C^{resource}`, `C^{recourse}`, `C^{violation}`, `C^{regularization}`) | `C^{component}` | — | \$ | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Stage and future cost totals in the scaled objective, `(C_{stage} + C_{future}) / K` | `C_{stage}` | — | \$ | math/lp-layout-and-scaling.md | math/lp-layout-and-scaling.md | — | no |
| Lower endpoint (floor) of generic constraint `g`; may be absent | `\underline{b}_g` | `g \in \mathcal{G}` | varies | math/lp-formulation.md | math/lp-formulation.md (authoring grammar owner: `reference/generic-constraints`) | — | no |
| Upper endpoint (cap) of generic constraint `g`; may be absent | `\bar{b}_g` | `g \in \mathcal{G}` | varies | math/lp-formulation.md | math/lp-formulation.md (authoring grammar owner: `reference/generic-constraints`) | — | no |
| Coefficient of term `e` of generic constraint `g` (literal or named scalar parameter) | `\gamma_{g,e}` | `g \in \mathcal{G}`, term `e` | varies | math/lp-formulation.md | math/lp-formulation.md (authoring grammar owner: `reference/generic-constraints`) | — | no |
| LP variable referenced by term `e` of a generic constraint | `x_e` | term `e` | varies | math/lp-formulation.md | math/lp-formulation.md (authoring grammar owner: `reference/generic-constraints`) | — | no |
| CVaR tail fraction: `\text{CVaR}_\alpha` averages the worst `\alpha`-fraction of outcomes, `\alpha \in (0, 1]` (`\alpha = 1` is the expectation); per-stage `\alpha_t` in `\rho^{\lambda_t, \alpha_t}` (risk-measures §6-§7 write `\alpha_{t-1}` for the stage that owns the cut); stopping-rules writes `\alpha` and the per-stage pair `(\lambda_t, \alpha_t)` in the gap-rule admissibility; risk-measures, sddp-framework-overview, the glossary and CvarPlot's aria-label call it the tail fraction; cobre's own doc comment (`crates/cobre-core/src/model/temporal.rs:231-232`) calls it a confidence level (UP-34, open); see the cut-intercept, FPHA-correction and NCS-availability rows for the other meanings of `\alpha` | `\alpha` | stage `t` (`\alpha_t`) | — | math/risk-measures.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, reference/glossary.md, src/components/CvarPlot.astro, src/components/CvarWeightsPlot.astro | math/risk-measures.mdx | `stages[].risk_measure.cvar.alpha` (`stages.json`) | yes |
| Risk-aversion weight of the convex-combination measure, `\lambda \in [0, 1]` (0 = risk-neutral, 1 = pure CVaR); per-stage `\lambda_t` (risk-measures §6-§7 write `\lambda_{t-1}` for the stage that owns the cut); see the cut-dual, eigenvalue, rescaling and subgradient rows for the other meanings of `\lambda`; stopping-rules writes `\lambda`, `\lambda_t` and `\lambda_t = 0` in the gap-rule admissibility; sddp-framework-overview writes `\lambda \in [0, 1]`, and it and the glossary write `\lambda = 0` (risk-neutral) and `\lambda = 1` (pure CVaR) | `\lambda` | stage `t` (`\lambda_t`) | — | math/risk-measures.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, reference/glossary.md, src/components/CvarWeightsPlot.astro | math/risk-measures.mdx | `stages[].risk_measure.cvar.lambda` (`stages.json`) | yes |
| Applied tail fraction: the tail fraction of the CVaR that cobre's current risk weights equal, `\alpha' = \alpha/(\lambda + (1-\lambda)\alpha)`, stated only in the software-layer note (spec §2.2 DF15, §4 E09 WP1; ledger ALG-02); at the tag the weights fill the costliest openings up to `(1-\lambda) p + \lambda p/\alpha = p/\alpha'` with no floor (`crates/cobre-sddp/src/convergence/risk_measure.rs:272-308`); see the CVaR tail-fraction row for `\alpha` | `\alpha'` | — | — | math/_impl/_risk.notes.mdx | math/_impl/_risk.notes.mdx | — (derived from `stages[].risk_measure.cvar.alpha` and `stages[].risk_measure.cvar.lambda` in `stages.json`) | no |
| Nominal probability of opening `\omega`, the single-cut aggregation weight, uniform: `p(\omega) = 1/N_{\text{openings}}`; the per-node form `p_{n'}(\omega)`, uniform within node `n'` (`p_{n'}(\omega) = 1/\lvert\Omega_{n'}\rvert`, written with bars, on cut-management), weights opening `\omega` of child `n'` in the successor-opening aggregation (cut-management, sddp-algorithm, policy-graphs, notation-conventions); risk-measures writes the probability vector `p` with components `p_\omega` (`\mathcal{M}(p)`, `\psi(p, \mu)`, `\mu^* = p`); see the PAR-order, pumped-flow, security-curve and transition-probability rows for the other meanings of `p`; the toy pages write the uniform `p = 1/3` and `p = 1/N`; the glossary writes `p_\omega = 1/N` | `p(\omega)` | `\omega \in \Omega_t` | — | math/sddp-algorithm.mdx, math/cut-management.mdx, math/policy-graphs.mdx, math/risk-measures.mdx, math/scenario-generation.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/cut-management.mdx | — (uniform over `stages[].num_openings` in `stages.json`) | yes |
| Per-scenario cap of the risk-adjusted weights, `\bar{\mu}_\omega = (1 - \lambda) \, p_\omega + \frac{\lambda \, p_\omega}{\alpha}`, attained by `\mu^*` on the openings `q^*` fills fully; its `(1-\lambda) p_\omega` part is the floor every opening keeps under a convex combination | `\bar{\mu}_\omega` | `\omega \in \Omega_t` | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Probability of leaf path `\ell` of the enumerated scenario tree, weighting `C(\ell)` in the exact upper bound; see the AR-order row for the `P` of sddp-algorithm's `AR(P)` on the same page | `P(\ell)` | leaf path `\ell` | — | math/sddp-algorithm.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/upper-bound-evaluation.md | — (derived along the path) | yes |
| Conditional probability of reaching child `n'` from enumerated-tree node `n`, weighting the stage risk measure over `\mathrm{ch}(n)`; see the turbined-flow row for `q` | `q_{n \to n'}` | `n' \in \mathrm{ch}(n)` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Census weight of simulation scenario `m`, its leaf-path probability, `\sum_m w_m = 1`; see the block-weight row for `w_k`; the glossary writes the bare `w` in the exact enumerated bound `\sum w \cdot c` 'over an exhaustively visited scenario tree or population', so its `w` also covers the leaf-path probability `P(\ell)` | `w_m` | `m \in \{1, \ldots, N\}` | — | math/upper-bound-evaluation.md, overview/notation-conventions.md, reference/glossary.md | math/upper-bound-evaluation.md | — | yes |
| Vector of the per-state-component Lipschitz constants `L_{t,j}` of the stage-`t` value function, pricing each component's deviation in the inner approximation's convex-combination LP (`L_t^\top (u^+ + u^-)`; the stage-`t` LP prices with `L_{t+1}`): \$/hm³ for a storage component (the penalty bound in \$/MWh times the energy per hm³ through the downstream productivities), \$ per unit of the lag for an inflow-lag component; accumulated backward per storage component, `L_{t,j}` adding the stage's own bound to `d_{t \to t+1} \cdot L_{t+1,j}` from the terminal `L_{T,j}` (reserved SIDP design); see the AR-order, last-filling-stage and bucket-depth rows for `L` | `L_t` | stage `t` | varies | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — (reserved design; `config.json` accepts an `upper_bound_evaluation.lipschitz` object that no solver code reads) | no |
| Largest penalty coefficient at stage `t`, from which the stage's own bound in the Lipschitz constant `L_{t,j}` of a storage component is built (times the energy per hm³ through the downstream productivities); the terminal stage writes `c_{max}^{penalty}` (reserved SIDP design) | `c_{max}^{penalty,t}` | stage `t` | \$/MWh | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| DCS candidate-recency window: only cuts generated within the last `k_1` iterations are scored as candidates; the default `k_1 = \infty` keeps every pool cut a candidate (exact) | `k_1` | — | iterations | math/cut-management.mdx | math/cut-management.mdx | `training.cut_selection.selection.candidate_recency` (`config.json`; method `dynamic`; absent = `\infty`) | no |
| DCS seed window: cuts active at the stage within the last `k_2` iterations seed the resident set, with the current iteration's cuts (`k_2 = 0` seeds only those) | `k_2` | — | iterations | math/cut-management.mdx | math/cut-management.mdx | `training.cut_selection.selection.seed_window` (`config.json`; method `dynamic`) | no |
| DCS cuts added per inner round: the top `n_{\text{adic}}` most-violated candidates | `n_{\text{adic}}` | — | cuts | math/cut-management.mdx | math/cut-management.mdx | `training.cut_selection.selection.max_added_per_round` (`config.json`; method `dynamic`) | no |
| DCS violation tolerance: candidate `i` is violated iff `f_i - \theta^*_{\text{raw}} > \varepsilon_{\text{viol}}`; see the noise and plane-reduction rows for `\varepsilon` | `\varepsilon_{\text{viol}}` | — | \$ | math/cut-management.mdx | math/cut-management.mdx | `training.cut_selection.selection.violation_tolerance` (`config.json`; method `dynamic`) | no |
| Cut-activity tolerance band of periodic pruning: a cut is active at `\hat{x}` when its value lies within `\epsilon` of the per-state maximum `V^*(\hat{x})`; §7.3 writes the Domination band as `\text{domination\_tolerance}`; see the excess-generation row for `\epsilon_{b,k}` | `\epsilon` | — | \$ | math/cut-management.mdx | math/cut-management.mdx | `training.cut_selection.selection.tie_tolerance` (methods `level1`, `lml1`) or `training.cut_selection.selection.domination_tolerance` (method `domination`) (`config.json`) | no |
| Iteration limit of the mandatory `iteration_limit` stopping rule, `\text{STOP} \iff k \geq k_{max}` | `k_{max}` | — | iterations | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[].limit` with `type` = `"iteration_limit"` (`config.json`) | no |
| Wall-clock time limit of the `time_limit` stopping rule, `\text{STOP} \iff t_{elapsed} \geq t_{max}` | `t_{max}` | — | s | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[].seconds` with `type` = `"time_limit"` (`config.json`) | no |
| Bound-stalling window: the number `\tau` of most recent recorded lower bounds, one per iteration, `\underline{z}^{k-\tau+1}, \ldots, \underline{z}^k`, across which the relative improvement `\Delta_k` is measured; see the block-duration, season and lag rows for the other meanings of `\tau` | `\tau` | — | iterations | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[].iterations` with `type` = `"bound_stalling"` (`config.json`) | no |
| Bound-stalling tolerance: the rule stops when `\lvert\Delta_k\rvert` (written with bars) falls below it; see the gap-tolerance row for the second meaning of `\text{tolerance}` on the same page | `\varepsilon_{\text{stall}}` | — | — | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[].tolerance` with `type` = `"bound_stalling"` (`config.json`) | no |
| Absolute arm of the gap stopping rule, `\max(0, \text{gap}^k) \leq \varepsilon_{\text{abs}}`, in the objective's own units; see the bound-stalling-tolerance row for the other meaning of `\text{tolerance}` on the same page | `\varepsilon_{\text{abs}}` | — | \$ | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[].tolerance` with `type` = `"gap"` (`config.json`) | no |
| Relative arm of the gap stopping rule, `100 \cdot \max(0, \text{gap}^k) / \max(1, \lvert\underline{z}^k\rvert) \leq \varepsilon_{\text{rel}}` (written with bars) | `\varepsilon_{\text{rel}}` | — | percent | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[].relative_tolerance` with `type` = `"gap"` (`config.json`) | no |
| Constraint matrix of the stage decision vector in the stage-linking constraint `A_t x_t = b_t - E_t x_{t-1}` (not defined in prose); see the anticipated-count, matrix-entry, NCS-availability and annual-regressor rows for the other meanings of `A` | `A_t` | stage `t` | varies | math/sddp-algorithm.mdx | math/sddp-algorithm.mdx | — | no |
| Coupling matrix of the incoming state in the stage-linking constraint `A_t x_t = b_t - E_t x_{t-1}` (not defined in prose); see the stored-energy row for `E^{max}_{h,t}` | `E_t` | stage `t` | varies | math/sddp-algorithm.mdx | math/sddp-algorithm.mdx | — | no |
| Right-hand-side vector of the stage-linking constraint `A_t x_t = b_t - E_t x_{t-1}` (not defined in prose); see the bus, bucket and deterministic-base rows for `b` | `b_t` | stage `t` | varies | math/sddp-algorithm.mdx | math/sddp-algorithm.mdx | — | no |
| Linear stage cost vector pricing the stage decision vector, `c_t^\top x_t`; sddp-algorithm's multistage objective writes `c_t(\omega_t)^\top` for its dependence on the realization; see the immediate-stage-cost row for the cost function `c_t(x_t, u_t)`; sddp-framework-overview writes `c_t^\top x_t` | `c_t(x_t, u_t)` | stage `t` | varies | math/sddp-algorithm.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx | math/sddp-algorithm.mdx | — | yes |
| Load deficit at bus `b`, block `k`, segment `s`; system-elements labels it `δ` in its d2 diagram; toy-single-reservoir writes the bare `\delta` (d2 label `δ`), toy-four-reservoir the bus-`b` deficit `\delta_b` | `\delta_{b,k,s}` | `b \in \mathcal{B}`, `k \in \mathcal{K}`, `s \in \mathcal{S}_b` | MW | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — | yes |
| Excess generation at bus `b`, block `k` | `\epsilon_{b,k}` | `b \in \mathcal{B}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Direct line flow (source to target); lp-formulation and system-elements write `f^+_{l,k}`, notation-conventions a bare `f^+`; equipment-formulations cross-references `f_\ell`; the `_network.configure` partial writes `f⁺` in inline code | `f^+_{n,k}` | `\ell \in \mathcal{L}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, math/_impl/_network.configure.mdx | math/equipment-formulations.mdx | — | yes |
| Reverse line flow (target to source); lp-formulation and system-elements write `f^-_{l,k}`; the `_network.configure` partial writes `f⁻` in inline code | `f^-_{n,k}` | `\ell \in \mathcal{L}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, math/_impl/_network.configure.mdx | math/equipment-formulations.mdx | — | yes |
| Thermal generation in cost segment `s`; no page writes it (one generation column per thermal per block, ticket-078) | `g_{j,k,s}` | `j \in \mathcal{T}`, `k \in \mathcal{K}`, segment `s` | MW | — | math/equipment-formulations.mdx | — | no |
| Generation of thermal `j` in block `k`, one LP column per thermal per block (also `g_j`; `columns.rs:370-384`); state-augmentation §5 writes an anticipated plant's per-block generation `g_{i,k}` in its fish row and system-elements §9 in its summary table (ticket-152); toy-single-reservoir writes the one thermal's generation `g_{th}` (d2 label `g_th`); toy-four-reservoir writes the bus-`b` thermal's `g^{th}_b` and the bare `g^{th}` in its tables | `g_{j,k}` | `j \in \mathcal{T}`, `k \in \mathcal{K}`; anticipated plant `i` in `g_{i,k}` | MW | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/equipment-formulations.mdx | — | yes |
| Plant turbined flow, `q_{h,k} = \sum_{b \in \mathcal{B}_h} q_{h,b,k}` (also `q_h`, `q_{i,k}`, bare `q`; practitioner term-map `Q`); toy-single-reservoir writes the bare `q` (d2 label 'Hydro q'), toy-four-reservoir `q_h` and the bare `q` | `q_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — | yes |
| Turbined flow of cell `(h,b)`; the `_hydro.notes` partial writes the cell turbined flow `turbined_c` (cell `c`) in inline code | `q_{h,b,k}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, math/_impl/_hydro.notes.mdx | math/lp-formulation.md | — | yes |
| Spillage (also `s_h`, `s_{i,k}`, bare `s`; practitioner term-map `S` / `Q_{ver}`); toy-four-reservoir §8 writes `s_h` and the upstream `s_u` | `s_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — | yes |
| Plant hydro generation (also `g_h`, bare `g`; practitioner term-map GH); equals `\sum_b g_{h,b,k}`; toy-four-reservoir writes `g_h = 1.0 \cdot q_h` | `g_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — | yes |
| Hydro generation of cell `(h,b)`, injected at bus `b`; toy-four-reservoir writes the local hydro generation at bus `b` as `g_b` | `g_{h,b,k}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, examples/toy-four-reservoir.mdx | math/lp-formulation.md | — | yes |
| Diversion (bypass) flow (also `u_h`, `u_{i,k}`) | `u_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Total downstream outflow, `o_{h,k} = q_{h,k} + s_{h,k}` (also `o_h`); hydro-production-models writes the tailrace argument `q_{out} = q + s` and `q_{jus}`, practitioner term-map `Q_{jus}` | `o_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Credited upstream release: the release `o_{h',k}` of upstream plant `h'` that `I_{h,k}` credits to block `k` of downstream plant `h` by the travel time of the arc, `o_{h',k}` on an arc without a travel time, `\nu_{h',t,0}\,o_{h',k}` on a travel-time arc of a parallel stage and `\sum_{k' \le k} \nu^{k' \to k}_{h',t} (\zeta_{k'}/\zeta_k)\,o_{h',k'}` on a travel-time arc of a chronological stage (`crates/cobre-sddp/src/lp/builder/generic_constraints.rs:375-411`); ledger HYD-11 | `o^{arr}_{h' \to h,k}` | upstream plant `h' \in \mathcal{U}_h`, `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Inflow of hydro `h` in block `k` that a `hydro_inflow` generic-constraint term reads (`crates/cobre-sddp/src/lp/builder/generic_constraints.rs:250-337`): local inflow, flows diverted in, credited upstream releases `o^{arr}_{h' \to h,k}`, the maturing transit volume `(\phi_{h,k}/\zeta_k)\,b^{\mathrm{in}}_{h,1}` and the PreFilling pass-through over `\mathcal{U}^{pre}_h(t)`, a rate; block-dependent, so a bound without a block expands to one row per block (`crates/cobre-sddp/src/lp/builder/layout.rs:779-786,800`); ledger HYD-11; see the vertex-count row for `I_t` (declared scoped reuse, §1.1) | `I_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, overview/notation-conventions.md | math/lp-formulation.md (moves with §10 at the E10 split) | `hydro_inflow` (`constraints/generic_constraints.json`) | no |
| Signed net evaporation flow (negative = net rainfall input); lp-formulation, block-formulations, system-elements and penalty-system also write the stage-level `e_h`; one stage-level `e_h` on a parallel stage of any block count, linearized on `(v^{in}_h + v_h)/2` and entering the water-balance row once with `\zeta`, and one per block on a chronological stage, linearized on `(v_{h,k-1} + v_{h,k})/2` and entering block `k`'s row with `\zeta_k`, all terms on the left (`crates/cobre-sddp/src/lp/builder/entries.rs:281-286,530-538,1027-1100`; ledger HYD-05) | `e_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/block-formulations.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Pumped flow (also `p_y`) | `p_{y,k}` | `y \in \mathcal{P}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | — | yes |
| Contract dispatch (also `\chi_c`, bare `\chi`); direction carried by membership in `\mathcal{C}^{imp}` or `\mathcal{C}^{exp}` | `\chi_{c,k}` | `c \in \mathcal{C}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | — | yes |
| Generation of non-controllable source `r`; system-elements labels it `gⁿᶜ` in its d2 diagram | `g^{nc}_{r,k}` | `r \in \mathcal{R}`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | — | yes |
| Curtailment of a non-controllable source, `A_{r,k} - g^{nc}_{r,k}` (not an LP column; the LP prices it through the cost `-\tau_k c^{curt}_r` on `g^{nc}_{r,k}`, `columns.rs:953-954`) | `\kappa_{r,k}` | `r \in \mathcal{R}`, `k \in \mathcal{K}` | MW | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | math/equipment-formulations.mdx | — | yes |
| End-of-stage storage (state); hydro-production-models writes a bare `v` (practitioner term-map `V`) and `V^{final}_h` in the stored-energy formula; toy-single-reservoir writes the bare `v` (d2 label 'Reservoir v') and the stage-indexed `v_t`, `v_1`, …, `v_4`; toy-four-reservoir writes `v_h`, the stage-`t` storage vector `v_t` (`v_1 = (20, 22, 15, 16)`) and, on the same page, the hydro-numbered `v_1`, …, `v_4` in its cuts and `v_{1,3}` (hydro 1, stage 3); the `_hydro.notes` partial writes the PreFilling identity `v_h = v^{in}_h`; ValueFunctionPlot's x-axis label writes 'stored volume v (hm³)' | `v_h` | `h \in \mathcal{H}`; stage `t` (`v_t`) on the toy pages, hydro then stage (`v_{1,3}`) on toy-four-reservoir | hm³ | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/penalty-system.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, math/_impl/_hydro.notes.mdx, src/components/ValueFunctionPlot.astro, src/components/ToySingleValuePlot.astro | math/lp-formulation.md | — | yes |
| Storage at the end of block `k` under chronological blocks (`v_{h,0} = \hat{v}_h`; only the last block's value is state) | `v_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | hm³ | math/lp-formulation.md, math/block-formulations.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md | math/block-formulations.mdx | — | yes |
| Average storage over the stage, `(v^{in}_h + v_h)/2` (also `v_h^{avg}`; ticket-152; system-elements §5 states the FPHA evaluation point in words, ticket-152a); notation-conventions defines it as `(\hat{v}_h + v_h)/2` | `v^{avg}_h` | `h \in \mathcal{H}` | hm³ | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | — | yes |
| Incoming-storage LP column, pinned by equal column bounds `\underline{v}^{in}_h = \bar{v}^{in}_h = \hat{v}_h`; state-augmentation §6 writes `v^{\mathrm{in}}_h`; toy-single-reservoir writes the bare `v^{in}`, the pinning `\underline{v}^{in} = \bar{v}^{in} = \hat{v}_{t-1}` and `v^{in}_4 = \hat{v}_3`; toy-four-reservoir writes `v^{in}_h = \hat{v}_{h,t-1}`; the `_hydro.notes` partial writes `v_h = v^{in}_h` | `v^{in}_h` | `h \in \mathcal{H}` | hm³ | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, math/cut-management.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, math/_impl/_hydro.notes.mdx | math/state-augmentation.md | — | yes |
| Incoming storage value (state from the previous stage); hydro-production-models writes `V^{init}_h` in the stored-energy formula; toy-single-reservoir writes the stage-indexed trial value `\hat{v}_{t-1}` (`\hat{v}_0`, …, `\hat{v}_3`, bare `\hat{v}`) and the initial storage `v_0` (`x_0 = v_0`); toy-four-reservoir writes `\hat{v}_{h,t-1}`, `\hat v_{h,0}`, `\hat v_{h,3}`, `\hat v_{1,2}` and the vector `\hat v_{t-1}` (`\hat v_0`, …, `\hat v_3`); `src/figures/valueFunction.ts` writes the tangent's pin (trial point) as `v0` (ValueFunctionPlot) | `\hat{v}_h` | `h \in \mathcal{H}`; stage `t-1` (`\hat{v}_{t-1}`, `\hat v_{h,t-1}`) on the toy pages | hm³ | math/state-augmentation.md, math/system-elements.mdx, math/block-formulations.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, src/components/ValueFunctionPlot.astro | math/lp-formulation.md | `storage[].value_hm3` (`initial_conditions.json`, first stage) | yes |
| AR lag LP column (state), pinned by equal column bounds `\underline{a}_{h,\ell} = \bar{a}_{h,\ell} = \hat{a}_{h,\ell}`; par-inflow-model §2.5 writes the lag column `a_{h,\ell}`; the glossary writes the lag state as the past inflow `a_{h, t-\ell}`, pinned via column bounds | `a_{h,\ell}` | `h \in \mathcal{H}`, `\ell \in \{1, \ldots, P_h\}`; `\ell \in \{1, \ldots, P^{\max}\}` on state-augmentation §4 and sddp-algorithm §5.1 | m³/s | math/lp-formulation.md, math/state-augmentation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md, reference/glossary.md | math/state-augmentation.md | — | yes |
| Incoming AR lag value (the inflow of the `\ell`-th most recently completed lag period, state-augmentation §4; ticket-147); par-inflow-model §2.5 writes `\hat{a}_{h,\ell}`, the trajectory's lag value set as both column bounds of the incoming lag column and patched per scenario from the trajectory record; scenario-generation §4.5 writes the opening-stage value as the derived inflow-lag seed `\text{seed}_\ell` (cast from the windowed inflow history, shadowed by recent observations) | `\hat{a}_{h,\ell}` | `h \in \mathcal{H}`, `\ell \in \{1, \ldots, P_h\}`; `\ell \in \{1, \ldots, P^{\max}\}` on state-augmentation §4 and sddp-algorithm §5.1 | m³/s | math/state-augmentation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, math/par-inflow-model.mdx, math/scenario-generation.mdx, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/state-augmentation.md | `value_m3s` (`scenarios/inflow_history.parquet`), shadowed by `recent_observations[]` (`initial_conditions.json`); opening-stage seed | yes |
| Realized-inflow LP column (z-inflow), `z_h = a_h` | `z_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md | math/lp-formulation.md | — | no |
| Outgoing slot `s` of anticipated plant `i`'s commitment ring, the column a cut references: the state carried to the next stage, held by a deposit or carry row and otherwise frozen at `0` (state-augmentation §5; `commit_out`, `crates/cobre-sddp/src/lp/indexer/state_space.rs:27-50,296-311`; `crates/cobre-sddp/src/lp/builder/columns.rs:132-144`); system-elements names the commitment-ring slots in words (ticket-152) | `x^{\mathrm{a}}_{s,i}` | residues `s \in \{0, \ldots, k_{max} - 1\}`; `i \in \{1, \ldots, A\}` | MW | math/state-augmentation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/state-augmentation.md | `past_anticipated_commitments[].value_mw` (`initial_conditions.json`; seed of the leading delivery stages) | yes |
| Trial value of slot `s`: the previous stage's outgoing slot `x^{\mathrm{a}}_{s,i}`; at the first stage the committed rate of the delivery decided before the study that the slot holds, `0` in a slot that holds none (state-augmentation §5; `crates/cobre-sddp/src/setup/mod.rs:2498,2530-2601`) | `\hat{x}^{\mathrm{a}}_{s,i}` | residues `s`; `i \in \{1, \ldots, A\}` | MW | math/state-augmentation.md, overview/notation-conventions.md | math/state-augmentation.md | `past_anticipated_commitments[].value_mw` (`initial_conditions.json`) | yes |
| Incoming slot `s`, pinned by equal column bounds at `\hat{x}^{\mathrm{a}}_{s,i}` (state-augmentation §5; `commit_in`, `crates/cobre-sddp/src/lp/indexer/state_space.rs:27-50,296-311,545-548`; open between solves, `crates/cobre-sddp/src/lp/builder/columns.rs:154-165`) | `x^{\mathrm{a,in}}_{s,i}` | residues `s \in \{0, \ldots, k_{max} - 1\}`; `i \in \{1, \ldots, A\}` | MW | math/state-augmentation.md, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Commitment decided at stage `t` for the delivery stage `m` with `t_i(m) = t` (`m = t + K_i` under a stage-count lead), in `[\underline{G}_i(m), \bar{G}_i(m)]` and fixed at `0` without a deposit row (state-augmentation §5; `crates/cobre-sddp/src/lp/builder/columns.rs:423-519`) | `g^{\mathrm{a}}_{i,t}` | anticipated plant `i`, stage `t` | MW | math/state-augmentation.md, math/system-elements.mdx, overview/notation-conventions.md | math/state-augmentation.md | — (bounded by the delivery stage's `generation.min_mw` / `generation.max_mw`) | yes |
| Anticipated state-out carrier column, `y^i_t - d^i_t = 0`; no page writes it: the commitment ring has no carrier column (ticket-063) | `y^i_t` | anticipated plant `i`, stage `t` | MW | — | math/state-augmentation.md | — | no |
| Outgoing in-transit bucket (state) of receiving plant `h` at maturity lag `d`; state-augmentation, sddp-algorithm's state table and notation-conventions write `b^{\mathrm{out}}_{h,d}` | `b^{\mathrm{out}}_{h,d}` | receiving plant `h`, `d \in \{1, \ldots, L_h\}` | hm³ | math/state-augmentation.md, math/sddp-algorithm.mdx, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Incoming in-transit bucket LP column `b^{\mathrm{in}}_{h,d}` of receiving plant `h` at maturity lag `d`, pinned by equal column bounds `\underline{b}^{\,\mathrm{in}}_{h,d} = \bar{b}^{\,\mathrm{in}}_{h,d} = \hat{b}_{h,d}` (state-augmentation §6 `### State pinning (column bounds)`); the definition row of outgoing lag `d` reads the incoming bucket of lag `d + 1`, `b^{\mathrm{out}}_{h,d} - b^{\mathrm{in}}_{h,d+1} - \text{(deposits into lag } d\text{)} = 0` with `b^{\mathrm{in}}_{h,L_h+1} = 0` (state-augmentation §6 `### Bucket definition rows`; `crates/cobre-sddp/src/lp/builder/delivery_ring.rs:193-234`); the maturing bucket `b^{\mathrm{in}}_{h,1}` enters the water balance (lp-formulation §4, state-augmentation §6) | `b^{\mathrm{in}}_{h,1}` | receiving plant `h`, `d \in \{1, \ldots, L_h\}` | hm³ | math/lp-formulation.md, math/state-augmentation.md | math/state-augmentation.md | — | no |
| Incoming in-transit volume of receiving plant `h` at maturity lag `d`, the trial value at which `b^{\mathrm{in}}_{h,d}` is pinned: the previous stage's outgoing bucket `b^{\mathrm{out}}_{h,d}`, carried by the cross-stage identity, or at the first stage the seed derived from `past_defluences` (state-augmentation §6 `### State pinning (column bounds)`) | `\hat{b}_{h,d}` | receiving plant `h`, `d \in \{1, \ldots, L_h\}` | hm³ | math/state-augmentation.md | math/state-augmentation.md | `past_defluences[]` (`initial_conditions.json`; first-stage seed) | no |
| Future-cost epigraph variable; notation-conventions writes `\theta_t`, approximating `V_{t+1}(x_t)`; lp-layout-and-scaling labels it `θ` in its d2 diagram; discount-rate writes the first stage's variable `\theta_1` in its lower-bound statement; post-study-boundary bounds the terminal stage's `\theta` by the imported cuts; sddp-algorithm and risk-measures write the stage-`(t-1)` variable `\theta_{t-1}` in the added cut and risk-measures writes `\theta_t` in the stage objective; policy-graphs writes node `n`'s variable `\theta_n` in the node cut; cut-management §8.1 writes the resident-set optimum `\theta^*` and its unscaled value `\theta^*_{\text{raw}}`; see the multi-cut `\theta_\omega` and inner-approximation `\bar{\theta}` rows; sddp-framework-overview writes `\theta_t`, approximating `V_{t+1}(x_t)` and bounded by every cut; the toy pages write the bare `\theta`, and toy-single-reservoir tabulates its per-opening optimum `\theta^*`; the glossary writes the bare `\theta` | `\theta` | — | \$ | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/policy-graphs.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | math/sddp-algorithm.mdx | — | yes |
| Discount-scaled future-cost variable of the equivalence note, `\theta' \geq d \cdot (\alpha + \pi^\top x)` | `\theta'` | — | \$ | math/discount-rate.mdx | math/discount-rate.mdx | — | no |
| State vector at the end of stage `t`; bare `x` as the argument of value functions and cuts (`V_t(x)`, `\beta^{\top} x`, `\pi^\top x`) on policy-graphs, horizon-modes and discount-rate; post-study-boundary writes the terminal state `x_T` in `\beta^{\top} x_T`; horizon-modes writes the outgoing state `x'`; discount-rate writes the incoming state `x_{t-1}` in `V_t(x_{t-1})` and the initial state `x_0` of its lower-bound statement; scenario-generation writes the initial state `x_0` and `_scenario.notes` writes it `x₀`; sddp-algorithm writes the known initial state `x_0` (`x₀` in its d2 diagram) and the cut argument `x_{t-1}`; risk-measures writes `x_{t-1}`; cut-management writes bare `x` (`\forall x \in \mathcal{X}_t`, the cut-row convention `-\beta^\top x + \theta \ge \beta_0`) and the DCS resident-set optimum `x^*` (unscaled `x^*_{\text{raw}}`); upper-bound-evaluation writes bare `x`, the outgoing state `x_t` of its appendix LPs, the optimal outgoing state `x_t^*(\omega_t)` and the initial state `x_0` of its lower bound and of its §3 reserved-mechanism note; see the stage-decision-vector row for the `x_t` priced by `c_t^\top x_t`; sddp-framework-overview writes the incoming state `x_{t-1}` and the bare `x` in `V_{T+1}(x) = 0`, `V_{t+1}(x) \ge \beta_{0,i} + \beta_i^\top x` and its caption's `V(x)` (see the stage-decision-vector row for its `x_t`); toy-single-reservoir writes the initial state `x_0 = v_0`; the glossary writes `V_t(x_{t-1}) = \min_{x_t} c_t(x_t) + d \cdot \mathbb{E}[V_{t+1}(x_t)]`, the bare `x` in its cut and `\beta \cdot x` | `x_t` | stage `t`; `x_0` initial state | — | math/policy-graphs.mdx, math/scenario-generation.mdx, math/horizon-modes.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, reference/glossary.md, math/_impl/_scenario.notes.mdx | math/sddp-algorithm.mdx | — | yes |
| Incoming state (trial point); discount-rate writes the trial points `\hat{x}_t^{k,m}` of the upper-bound simulation (stage `t`, iteration `k`, simulated trajectory `m`); sddp-algorithm writes the recorded (canonicalized) trial point `\hat{x}_t`, the set `\{\hat{x}_t\}` and, in its d2 scenario-tree diagram, `x̂₁ᴬ`, `x̂₂ᴬ`, `x̂₁ᴮ`, `x̂₂ᴮ` and 'trial point x̂'; cut-management writes a visited trial point `\hat{x}` and its coordinate `\hat{x}_j`; risk-measures, determinism-guarantees and policy-graphs write bare `\hat{x}`; the glossary writes the trial value `\hat{x}_{t-1}` | `\hat{x}_{t-1}` | stage `t` | — | math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/policy-graphs.mdx, math/risk-measures.mdx, math/determinism-guarantees.mdx, overview/notation-conventions.md, reference/glossary.md, reference/output-format.mdx, reference/output/policy.mdx | math/sddp-algorithm.mdx | — | yes |
| Generic incoming-state LP column and its equal pinning bounds (`\underline{x} = \bar{x} = \hat{x}`, `x^{in} = \hat{x}`); cut-management §2 writes the coordinate form `x^{in}_j = \hat{x}_j` and `\underline{x}_j = \bar{x}_j = \hat{x}_j`; state-augmentation, its owner, pins each state family by its own columns (`v^{in}_h`, the lag and bucket columns, `x^{\mathrm{a,in}}_{s,i}`) and writes no generic `x^{in}` | `x^{in}` | — | — | math/cut-management.mdx, overview/notation-conventions.md | math/state-augmentation.md | — | yes |
| Stage decision (control) vector, minimized with the state in the stage problem (`\min_{x_t, u_t, \theta}`); discount-rate does not define it in prose; horizon-modes minimizes over `(x', u)` (`\min_{(x', u) \in \mathcal{X}_\tau(x, \omega_\tau)}`, `c_\tau(x', u)`) and names `u` the control; policy-graphs minimizes over `(x', u)` in its node Bellman equation (`\min_{(x', u) \in \mathcal{X}_{n'}(x, \omega)}`, `c_{n'}(x', u)`) | `u_t` | stage `t` | varies | math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.mdx, overview/notation-conventions.md | math/discount-rate.mdx | — | yes |
| Stage decision vector of the linear multistage program: every stage-`t` variable, the state included, priced by `c_t^\top x_t` and passed whole to the cost-to-go `V_{t+1}(x_t)`, with no separate control vector; sddp-algorithm writes `x_t(\omega_{t})` in the multistage objective and `x_t^{(m)}` for trajectory `m`; see the state-vector row for the other meaning of `x_t`; sddp-framework-overview writes 'the feasible stage-`t` decisions `x_t`', priced by `c_t^\top x_t` and passed to `V_{t+1}(x_t)` | `x_t` | stage `t` | varies | math/sddp-algorithm.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx | math/sddp-algorithm.mdx | — | yes |
| Per-opening future-cost variable of the multi-cut formulation ; no page writes it (ticket-123; cut-management states that Cobre implements no multi-cut variant) | `\theta_\omega` | `\omega \in \Omega_t` | \$ | — | math/cut-management.mdx | — | no |
| Inner-approximation future-cost variable (free), bounded below by the convex-combination value `\sum_i \varphi_i \bar{v}^{(i)} + L_{t+1}^\top (u^+ + u^-)` of the next stage's inner approximation, so that `\bar{\theta} = \bar{V}_{t+1}(x_t)` at the optimum; `\bar{\theta}(\omega_t) = \bar{V}_{t+1}(x_t^*(\omega_t))` is the next stage's inner approximation at the stage's optimal outgoing state (reserved SIDP design) | `\bar{\theta}` | — | \$ | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| State of vertex `i` of the inner approximation, a state visited during forward passes (reserved SIDP design) | `x^{(i)}` | `i \in \mathcal{V}_t` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Vertex value: an upper bound on the expected cost-to-go from vertex state `x^{(i)}`, computed recursively from the terminal stage (reserved SIDP design) | `\bar{v}^{(i)}` | `i \in \mathcal{V}_t` | \$ | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Convex-combination weight of vertex `i` in the inner approximation's convex-combination LP, `\sum_i \varphi_i = 1`, `\geq 0` (also the weight vector `\varphi`) (reserved SIDP design) | `\varphi_i` | `i \in \mathcal{V}_t` | — | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Deviation vectors of the inner approximation's convex-combination LP, written `u^+` and `u^-`: the componentwise positive and negative deviations of the state from the convex combination of the vertex states, `\sum_i \varphi_i x^{(i)} + u^+ - u^- = x`, `\geq 0`, priced by `L_t^\top (u^+ + u^-)` (reserved SIDP design) | `u^{\pm}` | state coordinate `j` | varies | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Positive deviation from vertex `i` in state dimension `j`, splitting `\lvert x_j - x_j^{(i)}\rvert = u_j^{(i)+} + u_j^{(i)-}` (written with bars) in the linearized vertex constraints, `\geq 0` (reserved SIDP design). Replaced by the deviation vector `u^+` of the convex-combination LP (the `u^{\pm}` row, ticket-130); no page writes it. | `u_j^{(i)+}` | `i \in \mathcal{V}_t`, state coordinate `j` | — | — | math/upper-bound-evaluation.md | — | no |
| Negative deviation from vertex `i` in state dimension `j` (with `x_j - x_j^{(i)} = u_j^{(i)+} - u_j^{(i)-}`), `\geq 0` (reserved SIDP design). Replaced by the deviation vector `u^-` of the convex-combination LP (the `u^{\pm}` row, ticket-130); no page writes it. | `u_j^{(i)-}` | `i \in \mathcal{V}_t`, state coordinate `j` | — | — | math/upper-bound-evaluation.md | — | no |
| Threshold variable of the CVaR minimization formula, `\text{CVaR}_\alpha(Z) = \min_{\eta \in \mathbb{R}} \{\eta + \frac{1}{\alpha} \mathbb{E}[(Z - \eta)^+]\}`; §9 calls its optimum the VaR threshold; see the efficiency rows and the UNRESOLVED NCS `\eta` rows; sddp-framework-overview writes the same minimization formula | `\eta` | — | \$ | math/risk-measures.mdx, overview/notation-conventions.md, overview/sddp-framework-overview.mdx | math/risk-measures.mdx | — | yes |
| Point at which the risk-averse subgradient theorem takes the subgradient, `\lambda(\tilde{x}, \omega)` at `x = \tilde{x}`; see the LP-column row for the column-scaled `\tilde{x}_j` | `\tilde{x}` | — | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Slack-variable prefix: a superscript names the constraint type | `\sigma` | — | — | math/lp-formulation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, math/penalty-system.mdx, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Storage-below-minimum slack of a filling hydro at its Operating stages, in the soft floor `v_h + \sigma^{v-}_h \ge \underline{V}_h`; every other Operating hydro's `min_storage` is a hard column bound (`crates/cobre-sddp/src/lp/builder/columns.rs:79-112`, `layout.rs:695-721`) | `\sigma^{v-}_h` | `h \in \mathcal{H}` | hm³ | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Per-stage filling-floor shortfall slack | `\sigma^{fill}_h` | `h \in \mathcal{H}^{fill}` | hm³ | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Turbined-flow-below-minimum slack, one per (hydro, bus) cell | `\sigma^{q-}_{h,b,k}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Outflow-below-minimum slack (per plant) | `\sigma^{o-}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Outflow-above-maximum slack (per plant) | `\sigma^{o+}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Generation-below-minimum slack, one per (hydro, bus) cell | `\sigma^{g-}_{h,b,k}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h`, `k \in \mathcal{K}` | MW | math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Evaporation-above-target slack (system-elements writes the pair as `\sigma^{e\pm}_{h,k}`): one stage-level `\sigma^{e+}_h` on a parallel stage, its violation priced over the stage hours `H_t`, and one per block on a chronological stage, priced over `\tau_k`, in the evaporation row `e_h - \tfrac{\gamma^{ev}_{v,h}}{2}(v^{in}_h + v_h) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h}` (block `k`: `e_{h,k}`, `v_{h,k-1}`, `v_{h,k}`, `\sigma^{e\pm}_{h,k}`) (`crates/cobre-sddp/src/lp/builder/entries.rs:1027-1100`, `crates/cobre-sddp/src/lp/builder/columns.rs:708-717`; ledger HYD-05, HYD-06) | `\sigma^{e+}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, math/penalty-system.mdx | math/lp-formulation.md | — | yes |
| Evaporation-below-target slack (system-elements writes the pair as `\sigma^{e\pm}_{h,k}`): one stage-level `\sigma^{e-}_h` on a parallel stage, its violation priced over the stage hours `H_t`, and one per block on a chronological stage, priced over `\tau_k`, in the evaporation row `e_h - \tfrac{\gamma^{ev}_{v,h}}{2}(v^{in}_h + v_h) - \sigma^{e+}_h + \sigma^{e-}_h = \gamma^{ev}_{0,h}` (block `k`: `e_{h,k}`, `v_{h,k-1}`, `v_{h,k}`, `\sigma^{e\pm}_{h,k}`) (`crates/cobre-sddp/src/lp/builder/entries.rs:1027-1100`, `crates/cobre-sddp/src/lp/builder/columns.rs:708-717`; ledger HYD-05, HYD-06) | `\sigma^{e-}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, math/penalty-system.mdx | math/lp-formulation.md | — | yes |
| Withdrawal under-delivery slack (stage-level), capped at `r_h` when `r_h > 0`: a term of the canonical water-balance row, with `-\zeta` on the parallel row and `-\zeta_k` on each chronological block row (`crates/cobre-sddp/src/lp/builder/entries.rs:277,525`), and the stage-level withdrawal slack of system-elements (no per-block `r_{h,k}`; ledger HYD-01, HYD-09) | `\sigma^{w-}_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx, math/penalty-system.mdx | math/lp-formulation.md | — | yes |
| Withdrawal over-delivery slack (stage-level), capped at the target magnitude when `r_h < 0`: a term of the canonical water-balance row, with `+\zeta` on the parallel row and `+\zeta_k` on each chronological block row (`crates/cobre-sddp/src/lp/builder/entries.rs:278,526`), and the stage-level withdrawal slack of system-elements (no per-block `r_{h,k}`; ledger HYD-01, HYD-09) | `\sigma^{w+}_h` | `h \in \mathcal{H}` | m³/s | math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx, math/penalty-system.mdx | math/lp-formulation.md | — | yes |
| Water-withdrawal slack written as a single per-block symbol with no direction (system-elements soft-constraint table) | `\sigma^{r}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | — | math/lp-formulation.md | — | no |
| Inflow non-negativity slack: a water-balance column adding `\zeta \sigma^{inf}_h` of water on a parallel stage and `\zeta_k \sigma^{inf}_h` per block on a chronological stage, the realized-inflow row untouched (`crates/cobre-sddp/src/lp/builder/entries.rs:274-276,522-524`) | `\sigma^{inf}_h` | `h \in \mathcal{H}` | m³/s | math/inflow-nonnegativity.md, overview/notation-conventions.md, math/lp-formulation.md, math/penalty-system.mdx | math/inflow-nonnegativity.md | — | yes |
| Noise-adjustment slack of the reference design (dimensionless) | `\xi_h` | `h \in \mathcal{H}` | — | math/inflow-nonnegativity.md | math/inflow-nonnegativity.md | — | no |
| Generic-constraint slack relaxing the floor upward | `\sigma^{gc+}_g` | `g \in \mathcal{G}` | varies | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Generic-constraint slack relaxing the cap downward | `\sigma^{gc-}_g` | `g \in \mathcal{G}` | varies | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Apportionment share of cell `(h,b)` in plant `h`'s declared turbine capacity (not a slack), `\sum_{b \in \mathcal{B}_h} \lambda_{h,b} = 1`; system-elements §5 states the apportioning in words (ticket-152a) | `\lambda_{h,b}` | `h \in \mathcal{H}`, `b \in \mathcal{B}_h` | — | math/lp-formulation.md, math/block-formulations.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md; ticket-155 | math/lp-formulation.md | — (derived from `unit_groups[].max_turbined_m3s`) | yes |
| Row dual (row Lagrange multiplier), generic; lp-layout-and-scaling §2 writes `\pi_i^{original}` and `\pi_i^{scaled}` | `\pi` | LP row `i` | — | math/lp-formulation.md, math/lp-layout-and-scaling.md, overview/notation-conventions.md | overview/notation-conventions.md | — | yes |
| Load-balance row dual (marginal cost of energy); system-elements writes `\pi_{b,k}` | `\pi^{lb}_{b,k}` | `b \in \mathcal{B}`, `k \in \mathcal{K}` | \$/MW | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| Water-balance row dual (water value; not read as a cut coefficient); one dual `\pi^{wb}_{h,k}` per block row on a chronological stage (`crates/cobre-sddp/src/lp/builder/layout.rs:1139-1149`) | `\pi^{wb}_h` | `h \in \mathcal{H}`; block `k \in \mathcal{K}` on a chronological stage | — | math/lp-formulation.md, math/hydro-production-models.mdx, overview/notation-conventions.md | math/lp-formulation.md | — | yes |
| FPHA hyperplane row dual; hydro-production-models writes the per-cell `\pi_{h,b,m}^{fpha}` | `\pi_m^{fpha}` | `m \in \mathcal{M}_h` (cell `(h,b)` on hydro-production-models) | — | math/hydro-production-models.mdx, overview/notation-conventions.md | math/hydro-production-models.mdx | — | yes |
| Generic-constraint row dual (constraint indexed by `c`) | `\pi^{gen}_c` | generic constraint `c` | — | — | math/lp-formulation.md | — | no |
| Benders cut row dual (cut activity indicator) | `\lambda_i` | cut `i` | — | — | math/cut-management.mdx | — | no |
| Reduced cost of a column, generic (`\bar{c} = \partial Q^* / \partial \hat{x}` for a pinned column); lp-layout-and-scaling §2 writes `\bar{c}_j^{scaled}`; solver internal, kept in its derivation section (NOT-02) | `\bar{c}` | LP column `j` | — | math/lp-layout-and-scaling.md, math/state-augmentation.md, math/block-formulations.mdx, math/cut-management.mdx, math/hydro-production-models.mdx | math/cut-management.mdx | — | no |
| Reduced cost of the pinned incoming-storage column; solver internal, kept in its derivation section (NOT-02) | `\bar{c}^{in}_h` | `h \in \mathcal{H}` | \$/hm³ | math/block-formulations.mdx, math/hydro-production-models.mdx, math/cut-management.mdx | math/cut-management.mdx | — | no |
| Reduced cost of the pinned AR-lag column; solver internal, kept in its derivation section (NOT-02) | `\bar{c}^{lag}_{h,\ell}` | `h \in \mathcal{H}`, `\ell` | \$/(m³/s) | math/cut-management.mdx | math/cut-management.mdx | — | no |
| Reduced cost of the pinned incoming in-transit bucket column | `\bar{c}^{\,b}_{h,d}` | receiving plant `i`, lag `d` | \$/hm³ | math/state-augmentation.md | math/cut-management.mdx | — | no |
| Benders cut intercept (`\alpha_i` for cut `i`); lp-layout-and-scaling §2.1 writes the scaled intercept `\beta_0^{scaled}` (`crates/cobre-sddp/src/training/backward/outcome_aggregation.rs:141-142`; ticket-148); lp-formulation §11 writes `\beta_{0,i}` for cut `i`; horizon-modes writes `\alpha_k` for cut `k`; post-study-boundary writes the imported boundary-cut intercept `\beta_0`, to which the state contribution of a commitment decided before the study is added once at load; sddp-algorithm writes the per-opening intercept `\alpha(\omega)` and the aggregate `\bar{\alpha} = \mathbb{E}[\alpha(\omega)]` (`ᾱ = E[α]` in its d2 diagram); cut-management writes `\alpha_t`, `\alpha_t(\omega)`, the aggregate `\bar{\alpha}_{t-1}` and `\alpha_k`, `\alpha_j`, `\alpha_i` for cuts `k`, `j`, `i`; risk-measures renames the per-opening intercept `\hat{\alpha}_t(\omega)` to set it apart from the CVaR `\alpha` and writes the aggregate `\bar{\hat{\alpha}}_{t-1}`; the upper-bound-evaluation appendix (Upper Bound Evaluation LP) writes `\alpha_k`; sddp-framework-overview writes `\beta_{0,i}` for cut `i`; the toy pages write the bare `\alpha` in the cut form, the per-opening `\hat{\alpha}_4(\omega)`, `\hat{\alpha}_3`, `\hat{\alpha}(\omega)` and the aggregates `\bar{\alpha}` (toy-single-reservoir), `\bar\alpha_4` (toy-four-reservoir) and `\bar{\alpha}^i` for the iteration-`i` cut; the glossary writes the bare `\alpha`; cut-management and policy-graphs write the per-pair intercept `\beta_0(n', \omega)` of child `n'` under opening `\omega` and the aggregate `\bar{\beta}_0` | `\beta_0` | cut `i` | \$ | math/lp-formulation.md, math/state-augmentation.md, math/lp-layout-and-scaling.md, math/horizon-modes.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/policy-graphs.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md, reference/output-format.mdx, reference/output/policy.mdx | math/cut-management.mdx | — | yes |
| State cut coefficients (the cut slope), generic vector (principle 5); cut-management writes the generic `\beta^{\top} x` of §1, the trial-point product `\beta_t^{\top} \hat{x}_{t-1}` of §2, the per-pair `\beta(n', \omega)` of child `n'` under opening `\omega`, the aggregate `\bar{\beta}`, the cut-`i` slope `\beta_i` and the state component `\beta_j`; policy-graphs writes the per-pair `\beta(n', \omega)` and the aggregate `\bar{\beta}`; sddp-algorithm writes the per-opening `\beta(\omega)` and the aggregate `\bar{\beta} = \mathbb{E}[\beta(\omega)]` (`β̄ = E[β]` in its d2 diagram); risk-measures writes `\beta_t(\omega)`, the aggregate `\bar{\beta}_{t-1}` and the per-hydro components `\beta_{t,h}(\omega)`, `\bar{\beta}_{t-1,h}`; horizon-modes and sddp-framework-overview write `\beta_i^\top x` for cut `i`; discount-rate and upper-bound-evaluation write `\beta^\top x`; lp-layout-and-scaling §2 writes `\beta_j^{original}` and the scaled `\beta_j^{scaled}`; post-study-boundary and the glossary write `\beta^{\top} x` and `\beta \cdot x` (post-study-boundary heading `β·x`) | `\beta` | state coordinate | — | math/lp-formulation.md, math/lp-layout-and-scaling.md, math/horizon-modes.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/policy-graphs.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, reference/glossary.md, reference/output-format.mdx, reference/output/policy.mdx | math/cut-management.mdx | — | yes |
| Storage cut coefficient (`\beta^v_{i,h}` for cut `i`); read as the reduced cost of the pinned `storage_in` column divided by its column scale; cut-management writes `\beta^v_h` and the stage-indexed `\beta^v_{t,h}`; toy-single-reservoir writes the stage-indexed `\beta^v_4(\omega)`, `\beta^v_3(\omega_1)` (bare `\beta^v`, `\beta^v_3(\omega)`), the aggregate `\bar{\beta}^v` and the iteration-`i` aggregate `\bar{\beta}^{v,i}`; toy-four-reservoir writes `\beta^v_h`, `\beta^v_h(\omega)`, the hydro-numbered `\beta^v_3(\omega_2)`, the aggregate `\bar\beta^v_h`, `\bar\beta^{v,i}_1`, …, `\bar\beta^{v,i}_4` and the sign convention `\beta^v = \partial Q/\partial \hat v`; ToyFourSlopesPlot labels `\bar\beta^v_h` | `\beta^v_h` | `h \in \mathcal{H}` (cut `i`); stage `t` (`\beta^v_4`) on toy-single-reservoir, hydro (`\beta^v_3`) on toy-four-reservoir | \$/hm³ | math/lp-formulation.md, math/state-augmentation.md, math/block-formulations.mdx, math/hydro-production-models.mdx, math/discount-rate.mdx, math/cut-management.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, src/components/ToyFourSlopesPlot.astro | math/cut-management.mdx | `stages[].state_variables.storage` (`stages.json`; projection toggle, default `true`) | yes |
| AR-lag cut coefficient (`\beta^{lag}_{i,h,\ell}` for cut `i`, on lp-formulation §11 and discount-rate); cut-management writes the stage-indexed `\beta^{lag}_{t,h,\ell}`; state-augmentation writes `\beta^{lag}_{h,1}` on the realized-inflow column | `\beta^{lag}_{h,\ell}` | `h \in \mathcal{H}`, `\ell` (cut `i`) | \$/(m³/s) | math/lp-formulation.md, math/state-augmentation.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, overview/notation-conventions.md | math/cut-management.mdx | `stages[].state_variables.inflow_lags` (`stages.json`; projection toggle, default `false`) | yes |
| In-transit bucket cut coefficient (always in the cut projection) | `\beta^{b}_{h,d}` | receiving plant `i`, lag `d` | \$/hm³ | math/state-augmentation.md | math/cut-management.mdx | — | no |
| Subgradient of `V(x, \omega)` at `x = \tilde{x}` in the risk-averse subgradient theorem, identified with the per-opening cut coefficients `\beta_t(\omega)`; the subgradient symbol rename of spec §4 E09 WP1 is the E02 rename from `\lambda(\tilde{x}, \omega)` (§4, ticket-024), `\lambda` staying the risk weight | `\beta(\tilde{x}, \omega)` | `\omega \in \Omega` | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Risk-adjusted probability vector over the scenarios, a member of the risk set, with components `\mu_\omega`; `\mathbb{E}_\mu` is the expectation under it; see the seasonal-mean rows for the other meanings of `\mu` | `\mu` | `\omega \in \Omega_t` (`\mu_\omega`) | — | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Optimal dual probability vector, `\mu^* = \text{argmax}_{\mu \in \mathcal{M}(p)} \mathbb{E}_\mu[V(\tilde{x}, \omega)] - \psi(p, \mu)`, computed from the scenario costs; for the convex-combination measure it lies in the weight set `\mathcal{M}^{EAVaR}(p)` with its floor, `(1-\lambda)\, p_\omega \leq \mu_\omega \leq (1-\lambda)\, p_\omega + \frac{\lambda\, p_\omega}{\alpha}`, and is `\mu^* = (1-\lambda)\, p + \lambda\, q^*` (spec §4 E09 WP1; ledger ALG-01); its components `\mu^*_\omega` are the risk-adjusted weights that replace `p(\omega)` in cut aggregation (`\mu^* = p` when `\lambda = 0`, `\mu^* = q^*` when `\lambda = 1`) and reach the cap `\bar{\mu}_\omega` on the openings `q^*` fills fully; at the tag the computed weights carry no floor (see the applied-tail-fraction row) | `\mu^*` | `\omega \in \Omega_t` (`\mu^*_\omega`) | — | math/risk-measures.mdx, overview/notation-conventions.md, src/components/CvarWeightsPlot.astro | math/risk-measures.mdx | — | yes |
| CVaR tail weights: the `\text{CVaR}_\alpha` dual probability vector, filled greedily from the most expensive opening up to `p_\omega/\alpha` (ledger ALG-01), with components `q^*_\omega`, mixed with the nominal probabilities as `\mu^* = (1-\lambda)\, p + \lambda\, q^*` (spec §4 E09 WP1); risk-measures §4.2 writes a member of `\mathcal{M}_\alpha(p)` as `q` (`\mu = (1-\lambda)\, p + \lambda\, q`); at the tag cobre forms no `q^*` and fills the costliest openings up to `(1-\lambda) p + \lambda p/\alpha` with no floor (`crates/cobre-sddp/src/convergence/risk_measure.rs:272-308`; see the applied-tail-fraction row); see the conditional-probability, turbined-flow and lateral-flow rows for the other meanings of `q` | `q^*` | — | — | math/risk-measures.mdx, overview/notation-conventions.md | math/risk-measures.mdx | — | no |
| Future-cost floor that omitted DCS candidate cut `i` imposes at the resident-set optimum, `f_i = \alpha_i + \nabla_i \cdot x^*_{\text{raw}}`; see the block-load-factor row for `f` | `f_i` | candidate cut `i` | \$ | math/cut-management.mdx | math/cut-management.mdx | — | no |
| Per-state best cut value, `V^*(\hat{x}) = \max_k \{\alpha_k + \pi_k^\top \hat{x}\}` over all populated cuts (active and inactive), the reference of the cut-activity test; see the optimal-value row for `V^\star` | `V^*(\hat{x})` | trial point `\hat{x}` | \$ | math/cut-management.mdx | math/cut-management.mdx | — | no |
| Optimal stage-LP objective value as a function of the incoming state (`Q_{t+1}` and sensitivities `\partial Q_t / \partial \hat{v}_h`, `\partial Q / \partial x_j`); discount-rate writes `Q_t(x_{t-1}, \omega_t)`; sddp-algorithm writes the per-opening `Q_t(\hat{x}_{t-1}, \omega)` and its opening aggregate `\bar{Q}_t = \mathbb{E}[Q_t(\hat{x}_{t-1}, \omega)]` in the point-slope cut; upper-bound-evaluation writes the stage-1 `Q_1^k(x_0, \omega)` at iteration `k`; cut-management writes `Q_t(\hat{x}_{t-1}, \omega_t)` and `\partial Q_t / \partial \hat{x}_j`; policy-graphs writes the child form `Q_{n'}(\hat{x}, \omega)`; risk-measures writes `Q_t(\hat{x}_{t-1}, \omega)`, the sort key `Q_\omega` and the scenario-cost set `\{Q_t(\hat{x}, \omega)\}`; the toy pages write the per-opening `Q_4`, `Q_3`, `Q_4(\omega)`, `Q(\omega)`, the sensitivity `\partial Q_4/\partial \hat{v}_3` and the probability-weighted expectation over the openings `\bar{Q}_3` (`\bar Q_4` on toy-four-reservoir), and toy-single-reservoir the stage-1 `Q_1^1(x_0, \omega)` at iteration 1; reference/output-format writes `\bar{Q}_t` in the stored-intercept description; see the figure future-cost row for `Q(v)` | `Q_t` | stage `t` | \$ | math/lp-layout-and-scaling.md, math/state-augmentation.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/policy-graphs.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/output-format.mdx, reference/output/policy.mdx | math/cut-management.mdx | — | yes |
| Value function (cost-to-go) of stage `t`; lp-formulation writes `V_{t+1}` and `V_{T+1} = 0`; system-elements writes `V_{t+1}(v_h)`; policy-graphs writes the terminal condition `V_{T+1}(x) = 0`, the node form `V_n(x)`, the cost-to-go node `n`'s pool approximates (`V_n = V_{t(n)+1}` on the stage chain), and the child's `V_{n'}(x')`; post-study-boundary writes the terminal condition `V_{T+1} = 0`; discount-rate writes `V_t(x_{t-1})` and `V_{t+1}(x_t)`; horizon-modes writes the season-indexed `V_\tau`, `V_{\tau \bmod P + 1}`, `V_1` and bare `V`; scenario-generation writes `V_0`; sddp-algorithm writes `V_t(x_{t-1})`, `V_{t+1}(x_t)` and `V_{T+1}(x) = 0`; cut-management writes `V_t(x)` and `V_{t+1}(x)`; risk-measures writes the risk-averse `V_t(x_{t-1})` and `V_{t+1}(x_t)`; upper-bound-evaluation writes `V_t` and `V_t(x^{(i)})` in the conditions of its reserved inner approximation; see the realization-dependent `V(x, \omega)` row; sddp-framework-overview writes `V_t(x_{t-1})`, `V_{t+1}(x_t)`, `V_{T+1}(x) = 0`, the bare `V_t`, `V_{t+1}` and, in its value-function caption, `V(x)` for the plotted function that ValueFunctionPlot labels `Q(v)` (see the figure future-cost row); toy-single-reservoir writes `V(v)` and `V_t`; the glossary writes `V_t(x_{t-1})` and `V_{t+1}(x_t)`; ToySingleValuePlot labels `V_3(v)` | `V_t(x)` | stage `t`; 0-based (NOT-09) `V_0` on scenario-generation §4.5; season `\tau` on horizon-modes | \$ | math/lp-formulation.md, math/system-elements.mdx, math/policy-graphs.mdx, math/scenario-generation.mdx, math/horizon-modes.md, math/post-study-boundary.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, reference/glossary.md, src/components/ToySingleValuePlot.astro | math/sddp-algorithm.mdx | — | yes |
| Immediate (stage) cost of stage `t`, not discounted (also `c_t(\hat{x}_t^{k,m})`, `c_T`, bare `c_t`); horizon-modes writes `c_\tau(x', u)`; policy-graphs writes the child's `c_{n'}(x', u)` (bare `c_{n'}`); upper-bound-evaluation writes the immediate cost along leaf path `\ell` as `c_t(\ell)` and `c(\ell)`, at enumerated-tree node `n` as `c(n)`, of simulation scenario `m` as `c_t^{(m)}`, the reserved vertex forms `c_T(x^{(i)}, \omega_T)` and `c_t(x^{(i)}, \omega_t)` and `c_1, c_2, \ldots, c_T` in the nested functional; see the linear-cost-vector row for `c_t^\top x_t`; the glossary writes `c_t(x_t)` | `c_t(x_t, u_t)` | stage `t` | \$ | math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, reference/glossary.md | math/sddp-algorithm.mdx | — | yes |
| Expectation over the stage's realization (`\mathbb{E}_{\omega_\tau}` on horizon-modes); sddp-algorithm writes `\mathbb{E}[\alpha(\omega)]`, `\mathbb{E}_{\omega_t}` and the risk-neutral measure `\rho_1 = \mathbb{E}`; risk-measures writes `\mathbb{E}[Z]`, `\mathbb{E}[\cdot]` and the expectation under a measure `\mu`, `\mathbb{E}_\mu[Z]`; upper-bound-evaluation writes `\mathbb{E}_{\omega_t}`, `\mathbb{E}_{\omega_T}`, `\mathbb{E}[C]`, `\mathbb{E}[\bar{C}]` and bare `\mathbb{E}` inside `\rho`; sddp-framework-overview writes `\mathbb{E}_{\omega_t}` and `\mathbb{E}[Z]`; toy-single-reservoir writes `\mathbb{E}_{\omega}`; the glossary writes `\mathbb{E}[V_{t+1}(x_t)]` and `\mathbb{E}[Z]`; CvarPlot labels its mean marker `E[Z]` (its aria-label writes `E[Z]`) and `src/figures/cvar.ts` comments write `E[Z] = ∫ x·f(x) dx` | `\mathbb{E}_{\omega_t}` | stage `t` | — | math/horizon-modes.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, reference/glossary.md, src/components/CvarPlot.astro | math/sddp-algorithm.mdx | — | yes |
| One-stage Bellman operator at season `\tau`, `(\mathbb{T}_\tau V)(x) = \mathbb{E}_{\omega_\tau}[\min_{(x', u) \in \mathcal{X}_\tau(x, \omega_\tau)} \{c_\tau(x', u) + d_{t \to t+1} V(x')\}]`, `t` any stage of season `\tau` (stationarity: every stage of a season has the same data in every cycle), with the seasonal recursion `V_\tau = \mathbb{T}_\tau V_{\tau \bmod P + 1}` and the chain around one cycle `V_1 = (\mathbb{T}_1 \circ \mathbb{T}_2 \circ \cdots \circ \mathbb{T}_P) V_1`, a contraction with modulus `d_{\text{cycle}}` (reserved cyclic design) | `\mathbb{T}_\tau` | `\tau \in \{1, \ldots, P\}` | — | math/horizon-modes.md | math/horizon-modes.md | — | no |
| Outer (cut) approximation of the value function, `\underline{V}_\tau(x) = \max_{i \in \mathcal{I}_\tau} \{\beta_{0,i} + \beta_i^{\top} x\}` (season-indexed on horizon-modes); sddp-algorithm §3 writes the iteration-`k` approximation `\underline{V}_t^k`; the toy pages write `\hat{V}_t^k(v) = \max_{i = 1, \ldots, k} \{\bar{\alpha}^i + \bar{\pi}^{v,i}\, v\}` (toy-four-reservoir with the per-hydro `\bar\pi^{v,i}_h\, v_h` terms) | `\underline{V}_\tau(x)` | `\tau \in \{1, \ldots, P\}`; stage `t` and iteration `k` (`\underline{V}_t^k`) on sddp-algorithm | \$ | math/horizon-modes.md, math/sddp-algorithm.mdx, overview/notation-conventions.md, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | math/sddp-algorithm.mdx | — | yes |
| Lower bound at iteration `k`, in stage-1 present value under discounting (bare `\underline{z}`); the owner (upper-bound-evaluation `### Lower bound`) defines it as the stage-1 risk measure `\rho_1` over the opening objectives `Q_1^k(x_0, \omega)`, `\omega \in \Omega_1`; horizon-modes writes the per-season `\underline{z}^{\,k,\tau}` and compares it with `\underline{z}^{\,k-1,\tau}`; stopping-rules writes `\underline{z}^{k-\tau+1}`; sddp-framework-overview writes the bare `\underline{z}`; toy-single-reservoir writes `\underline{z}^1 = \mathbb{E}_{\omega}[Q_1^1(x_0, \omega)]` and `\underline{z}^k`, toy-four-reservoir writes `\underline{z}^k` in the percent-gap denominator `\lvert\underline{z}^k\rvert`; `src/figures/convergence.ts` comments write it `lb` and 'LB' (ConvergencePlot; aria-label 'monotone lower bound') | `\underline{z}^k` | iteration `k` | \$ | math/horizon-modes.md, math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/_impl/_cut-management.notes.mdx, math/risk-measures.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, src/components/ConvergencePlot.astro | math/upper-bound-evaluation.md | — | yes |
| Upper-bound estimate at iteration `k` from simulating the policy: the mean discounted cost over `M` trajectories (bare `\bar{z}`); sddp-algorithm §3.3 writes the sampled-mean form `\frac{1}{M} \sum_{m=1}^{M} \sum_{t=1}^{T} d_{1 \to t}\, c_t(x_t^{(m)}, u_t^{(m)})`; cut-management writes the gap `\bar{z}^k - \underline{z}^k` in its tier table and Tier 3; upper-bound-evaluation §3 makes `\bar{z}^k` the active forward-pass mechanism's bound (the sample mean, or `\bar{z}_{\text{exact}}` under an enumerated pass) and states the reserved inner-approximation bound in words (the first stage's risk-adjusted value at `x_0` with `\bar{V}_2` in place of the cuts); stopping-rules writes the exact bound bare as `\bar{z}`; toy-single-reservoir writes `\bar{z}^k`; `src/figures/convergence.ts` comments write its mean `ubMean` and 'UB' (ConvergencePlot; aria-label 'Monte-Carlo upper bound') | `\bar{z}^k` | iteration `k` | \$ | math/discount-rate.mdx, math/sddp-algorithm.mdx, math/cut-management.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, examples/toy-single-reservoir.mdx, src/components/ConvergencePlot.astro | math/upper-bound-evaluation.md | — | yes |
| Present value at stage 1 of a cost incurred at stage `T`, `\text{PV}_1[c_T] = d_{1 \to T} \cdot c_T`. No page writes it: discount-rate §5 states the present value in words, by ticket-067. | `\text{PV}_1[c_T]` | — | \$ | — | math/discount-rate.mdx | — | no |
| Per-unit-group flow cap folded before summing over a cell (`\bar{Q}_g` for FPHA, `\min(\bar{Q}_g, \bar{G}_g / \rho_h)` for constant productivity) | `\mathrm{fold}(u)` | unit group `g` | m³/s | math/lp-formulation.md | math/lp-formulation.md | — | no |
| Anticipated plants whose delivery falls at stage `t`; no page writes it | `\mathrm{deliver}(t)` | stage `t` | — | — | math/state-augmentation.md | — | no |
| Objective coefficient of an LP column; no page writes it (system-elements §4 states the commitment cost in words; ticket-152) | `\mathrm{obj}` | — | — | — | math/system-elements.mdx | — | no |
| Net per-block flow terms of the water balance: the turbined and spilled release credited from upstream and the flows diverted and pumped in, minus the plant's own turbined, spilled and diverted flow and its pumped-out flow; inflow, evaporation and withdrawal are separate terms; block-formulations §1.1 defines it, and lp-formulation §4 writes its terms out in full (ticket-152a) | `\text{net\_flows}_{h,k}` | `h \in \mathcal{H}`, `k \in \mathcal{K}` | m³/s | math/block-formulations.mdx, overview/notation-conventions.md | math/block-formulations.mdx | — | yes |
| Periodic partial autocorrelation of season `m` at lag `k`: the last coefficient of the order-`k` Yule-Walker fit, tested against `z_{0.975} / \sqrt{N_m}` (written with bars, `\lvert\text{PACF}_m(k)\rvert`, in the test) | `\text{PACF}_m(k)` | `m \in \{1, \ldots, M\}`, lag `k` | — | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Window-selection hash of historical forward sampling: a trajectory replays window `H(\text{iteration}, \text{trajectory}) \bmod \lvert W\rvert` for all its stages, with replacement (spec §3.4 writes `H(i,m)`; ledger STO-02, a fixed-base hash); scenario-generation writes the `historical_residuals` tree form `H(\text{tree seed}, j, t)` for opening `j` at stage `t`, the opening-tree seed derivation (ledger STO-03; at the tag `derive_opening_seed(base_seed, j, stage.id) % n_windows`, `crates/cobre-stochastic/src/tree/generate.rs:261-269`); at the tag `select_historical_window` hashes `(iteration, scenario)` from the fixed base `HISTORICAL_SELECTION_BASE_SEED` (`crates/cobre-stochastic/src/sampling/class_sampler.rs:10-14,128-130,192-203`); see the iteration-counter and trajectory-index rows for `k` and `m`, and the total-stage-duration row for `H_t` and `H_m` | `H(\text{iteration}, \text{trajectory})` | arguments: training iteration and trajectory indices | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — (fixed base; independent of the run seed) | no |
| Inverse of the standard normal distribution function, mapping a point of `(0, 1)` to a standard-normal value; applied to the Latin-hypercube and scrambled Sobol/Halton points (Beasley-Springer-Moro, `crates/cobre-stochastic/src/noise/quantile.rs:1-22` at v0.17.0) | `\Phi^{-1}` | — | — | math/scenario-generation.mdx | math/scenario-generation.mdx | — | no |
| Hat decoration marking a sample estimate from the historical record in the fitting procedure (`\hat{\mu}_m`, `\hat{s}_m`, `\hat{\gamma}_m(\ell)`, `\hat{\rho}_m(\ell)`, `\hat{\sigma}_m`, `\hat{\boldsymbol{\psi}}_m^*`, `\hat{\psi}^*_{m,k}`, `\hat{\mu}^A_m`, `\hat{\sigma}^A_m`, `\hat{C}`, `\hat{C}_m`); the original-unit annual coefficient `\hat{\psi}_m` uses the hat for a unit conversion instead | `\hat{\cdot}` | — | varies | math/par-inflow-model.mdx | math/par-inflow-model.mdx | — | no |
| Conditional Value-at-Risk at tail fraction `\alpha`, the expected cost over the worst `\alpha`-fraction of outcomes; also written `\text{CVaR}_\alpha(Z)`, `\text{CVaR}_\alpha[Z]`, `\mathrm{CVaR}_\alpha` (risk-measures figure caption, upper-bound-evaluation §2.1) and as prose CVaR with a math subscript (CVaR`_\alpha`, CVaR`_1` = `\mathbb{E}[Z]`); sddp-framework-overview writes `\text{CVaR}_\alpha(Z)`, `\text{CVaR}_\alpha[Z]` and, in its caption, `\mathrm{CVaR}_\alpha`; the glossary writes `\text{CVaR}_\alpha[Z]`; CvarPlot labels its marker `CVaRα` (aria-label 'CVaR') and `src/figures/cvar.ts` comments write `CVaR_alpha = E[Z \mid Z ≥ VaR_alpha]` (the tail mean; written with a bar) | `\text{CVaR}_\alpha` | — | \$ | math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, reference/glossary.md, src/components/CvarPlot.astro | math/risk-measures.mdx | `stages[].risk_measure` = `{"cvar": {...}}` (`stages.json`) | yes |
| Value-at-Risk at tail fraction `\alpha`, the `(1-\alpha)` quantile of the cost (`src/figures/cvar.ts:9`) and the optimum of the CVaR threshold `\eta`; marked in the risk-measures §1 figure caption; sddp-framework-overview's caption writes `\mathrm{VaR}_\alpha`; CvarPlot labels its marker `VaRα` (aria-label 'VaR') and `src/figures/cvar.ts` comments write `VaR_alpha` | `\mathrm{VaR}_\alpha` | — | \$ | math/risk-measures.mdx, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, src/components/CvarPlot.astro | math/risk-measures.mdx | — | yes |
| Convex-combination (EAVaR) risk measure, `\rho^{\lambda, \alpha}[Z] = (1 - \lambda) \mathbb{E}[Z] + \lambda \cdot \text{CVaR}_\alpha[Z]`; the per-stage instance `\rho^{\lambda_t, \alpha_t}` is written `\rho_t` (`\rho_1`, `\rho_2`, `\rho_{T-1}` in the nesting); risk-measures §6 writes the measure of the stage that owns a cut, which aggregates the next stage's openings, as `\rho^{\lambda_{t-1}, \alpha_{t-1}}` and `\rho_{t-1}`, and the last stage's measure, which aggregates none, as `\rho_T`; upper-bound-evaluation `### Lower bound` writes the stage-1 measure `\rho_1`; upper-bound-evaluation §2.1 writes the uniform stage measure bare as `\rho` and applies it over a node's children as `\rho_{\,n' \in \mathrm{ch}(n)}[\cdot]`; see the productivity and autocorrelation rows for the other meanings of `\rho`; sddp-framework-overview writes `\rho^{\lambda, \alpha}[Z]`, and `_risk.configure` writes `\rho^{\lambda,\alpha}` without the space; the glossary writes the combination `(1-\lambda)\,\mathbb{E}[Z] + \lambda \cdot \text{CVaR}_\alpha[Z]` without a symbol ('EAVaR') | `\rho^{\lambda, \alpha}` | stage `t` (`\rho_t`) | \$ | math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, reference/glossary.md, math/_impl/_risk.configure.mdx | math/risk-measures.mdx | `stages[].risk_measure` (`stages.json`; `"expectation"` or `{"cvar": {"alpha": …, "lambda": …}}`) | yes |
| Nested (time-consistent) risk functional over the horizon, the stage measure applied stage by stage: `\rho_1[\rho_2[\cdots \rho_{T-1}[\cdot]]]` on risk-measures, `\rho\big[\,c_1 + \rho[\,c_2 + \cdots + \rho[\,c_T\,]\,]\,\big]` on upper-bound-evaluation §2.1, which names it `\rho_{\text{nested}}` | `\rho_{\text{nested}}` | — | \$ | math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/risk-measures.mdx | — | yes |
| End-of-horizon risk functional, one measure applied to the whole-path total cost: `\rho[\text{total cost}]` on risk-measures, `\rho_{\text{end-of-horizon}}` on upper-bound-evaluation §2.1 | `\rho_{\text{end-of-horizon}}` | — | \$ | math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/risk-measures.mdx | — | yes |
| Convex risk measure in its dual representation, `\mathbb{F}[Z] = \sup_{\mu \in \mathcal{M}(p)} \mathbb{E}_\mu[Z] - \psi(p, \mu)`; the subgradient theorem writes `\mathbb{F}[V(x, \omega)]` | `\mathbb{F}` | — | \$ | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Penalty function of the dual representation, 'dual penalty function' in the symbol note and 'convex penalty function' in §4; `\psi(p, \mu) = 0` for CVaR; see the AR-coefficient rows for the other meanings of `\psi` | `\psi(p, \mu)` | — | \$ | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Realization-dependent value function, convex in `x` for each fixed `\omega`, in the risk-averse subgradient theorem, whose subgradients the page identifies with the per-opening cut coefficients | `V(x, \omega)` | `\omega \in \Omega` | \$ | math/risk-measures.mdx | math/risk-measures.mdx | — | no |
| Random cost a risk measure is applied to (`\mathbb{E}[Z]`, `\text{CVaR}_\alpha(Z)`, `\rho^{\lambda, \alpha}[Z]`); the §1 figure caption writes `\mathbb{E}[Z]` and `\rho^{\lambda,\alpha}[Z]`; see the PAR(p)-A standardised-series row for the other `Z`; sddp-framework-overview and the glossary write `Z`; CvarPlot's x-axis label writes 'total cost Z' and its marker `E[Z]`; `src/figures/cvar.ts` comments model it as `Z ~ Gamma(shape, scale)` and write its grid value as `x` (`E[Z] = ∫ x·f(x) dx`) | `Z` | — | \$ | math/risk-measures.mdx, overview/notation-conventions.md, overview/sddp-framework-overview.mdx, reference/glossary.md, src/components/CvarPlot.astro | math/risk-measures.mdx | — | yes |
| Probability density of the cost in the risk-measures §1 figure (a right-skewed Gamma law); CvarPlot's aria-label writes `f(Z)` and its y-axis label 'probability density'; `src/figures/cvar.ts` comments write the density `f(x)` of the Gamma law with parameters `shape` and `scale` | `f(Z)` | — | — | math/risk-measures.mdx, overview/notation-conventions.md, src/components/CvarPlot.astro | math/risk-measures.mdx | — | yes |
| Total discounted cost of one scenario trajectory, `C(\ell) = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t(\ell)` for leaf path `\ell` of the enumerated tree; §4.5 writes `C_m = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(m)}` for simulation scenario `m` and the random total cost `C` (`\mathbb{E}[C]`); see the correlation-matrix, contract-bound and cost-total rows for the other meanings of `C`; the glossary writes the scenario cost bare as `c` in `\sum w \cdot c` | `C(\ell)` | leaf path `\ell`; simulation scenario `m` (`C_m`) | \$ | math/sddp-algorithm.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, reference/glossary.md | math/upper-bound-evaluation.md | — | yes |
| Mean total cost of the post-training simulation: the sample mean `\frac{1}{N} \sum_{m=1}^{N} C_m` (sampled; the Monte Carlo estimator) or the census weighted mean `\sum_m w_m\, C_m`; the reported interval is `[\bar{C} - \Delta_{95},\; \bar{C} + \Delta_{95}]` | `\bar{C}` | — | \$ | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Standard deviation of the simulated total costs: the Bessel-corrected sample form (sampled) or the weighted population form (census); see the slack-prefix and innovation rows for `\sigma` | `\sigma_C` | — | \$ | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Half-width of the 95% normal-approximation confidence interval of the sampled estimator, `\Delta_{95} = 1.96 \cdot \frac{\sigma_C}{\sqrt{N}}`; the training statistical upper bound carries the same 95% half-width at every iteration (upper-bound-evaluation §1, in prose), drawn by ConvergencePlot as the band `ubMean ± 1.96·ciSigma` (`ciLo`, `ciHi`; standard deviation `ciSigma` in `src/figures/convergence.ts` comments; aria-label 'a 95% confidence band'), and by ConvergencePanelsPlot's sampled panel as a 95% band around the sampled mean (`panels()` in the same module, half-width `1.96·(6·exp(−k/12) + 3)`; aria-label 'a sampled upper bound whose 95% confidence band') | `\Delta_{95}` | — | \$ | math/upper-bound-evaluation.md, overview/notation-conventions.md, src/components/ConvergencePlot.astro, src/components/ConvergencePanelsPlot.astro | math/upper-bound-evaluation.md | — | yes |
| Exact deterministic upper bound of an enumerated forward pass: the leaf-path expectation `\sum_{\ell} P(\ell)\, C(\ell)` under expectation, the nested root value `\tilde{V}(\text{root})` under a uniform CVaR; sddp-algorithm §3.3 and stopping-rules write the symbol `\bar{z}_{\text{exact}}`; the glossary writes it `\sum w \cdot c` ('the exact enumerated bound') | `\bar{z}_{\text{exact}}` | iteration `k` | \$ | math/sddp-algorithm.mdx, math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, reference/glossary.md | math/upper-bound-evaluation.md | — (exact under `training.selection.method` = `"enumerated"`, `config.json`) | yes |
| Nested risk-adjusted value of enumerated-tree node `n`, built from the leaves up, `\tilde{V}(n) = d_{1 \to \mathrm{stage}(n)}\, c(n) + \rho_{\,n' \in \mathrm{ch}(n)}[\tilde{V}(n')]` with `\tilde{V}(\ell) = d_{1 \to T}\, c(\ell)` at a leaf; its root value is the exact upper bound under a uniform CVaR | `\tilde{V}(n)` | node `n` | \$ | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Optimal value of the multistage objective, bracketed by `\tilde{V}(\text{root}) \ge V^\star \ge \underline{z}`; see the per-state best-cut-value row for `V^*`; `src/figures/convergence.ts` comments write the optimum both bounds approach as `cStar` (ConvergencePlot) | `V^\star` | — | \$ | math/upper-bound-evaluation.md, overview/notation-conventions.md, src/components/ConvergencePlot.astro | math/upper-bound-evaluation.md | — | yes |
| Inner, convex and upper approximation of the stage-`t` value function by the convex-combination LP over the vertices: the minimum over the weights `\varphi_i` and the deviations `u^{\pm}` of `\sum_i \varphi_i \bar{v}^{(i)} + L_t^\top (u^+ + u^-)` subject to `\sum_i \varphi_i x^{(i)} + u^+ - u^- = x` and `\sum_i \varphi_i = 1` (also `\bar{V}_{t+1}`, `\bar{V}_{t+1}(x_t)`, `\bar{V}_2`) (reserved SIDP design); see the storage-upper-bound row for `\bar{V}_h` | `\bar{V}_t(x)` | stage `t` | \$ | math/upper-bound-evaluation.md | math/upper-bound-evaluation.md | — | no |
| Optimality gap at iteration `k`: the upper bound minus the lower bound, `\text{gap}^k = \bar{z}^k - \underline{z}^k`, signed and unclamped, in currency units; the gap stopping rule compares `\max(0,\; \text{gap}^k)`, the clamp belonging to the rule and not to the gap; its percent form `100 \cdot \text{gap}^k / \max(1, \lvert\underline{z}^k\rvert)` (written with bars), normalised by the lower bound and never by the upper bound, has no symbol of its own; upper-bound-evaluation writes `\text{gap}^k`; sddp-framework-overview states it in words, 'the upper bound minus the lower bound', with no symbol | `\text{gap}^k` | iteration `k` | \$ | math/stopping-rules.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/stopping-rules.mdx | — (compared with the gap rule's `tolerance`; the percent form with its `relative_tolerance`) | yes |
| Stopping predicate of the training loop: each rule states `\text{STOP} \iff \ldots`, and the rules combine as `\text{Rule}_1 \lor \text{Rule}_2 \lor \ldots` (mode `"any"`) or `\text{Rule}_1 \land \text{Rule}_2 \land \ldots` (mode `"all"`) | `\text{STOP}` | — | — | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_mode` (`config.json`; the combination) | no |
| Trigger predicate of the `i`-th configured stopping rule (`\text{Rule}_1`, `\text{Rule}_2`, …) | `\text{Rule}_1` | configured rule `1, 2, \ldots` | — | math/stopping-rules.mdx | math/stopping-rules.mdx | `training.stopping_rules[]` (`config.json`; one entry per rule) | no |
| Relative lower-bound improvement over the bound-stalling window, `\Delta_k = \frac{\underline{z}^k - \underline{z}^{k-\tau+1}}{\max(1, \lvert\underline{z}^k\rvert)}` (written with bars); see the confidence-half-width, stage-duration and head-loss rows for the other meanings of `\Delta` | `\Delta_k` | iteration `k` | — | math/stopping-rules.mdx | math/stopping-rules.mdx | — | no |
| Elapsed wall-clock training time, checked at the end of each iteration against `t_{max}`; see the stage-index row for `t` | `t_{elapsed}` | — | s | math/stopping-rules.mdx | math/stopping-rules.mdx | — | no |
| Asymptotic order of a count or cost: the cut-growth and vertex counts `\mathcal{O}(\text{iterations} \times \text{forward\_passes})` and the Domination cost `\mathcal{O}(\lvert\text{cuts}\rvert \times \lvert\text{visited states}\rvert)` (written with bars) | `\mathcal{O}(\cdot)` | — | — | math/cut-management.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md | math/cut-management.mdx | — | yes |
| Illustrative convex, decreasing future-cost function of stored volume in the value-function figure, `Q(v) = A·exp(-v/s)` in `src/figures/valueFunction.ts` (cost scale `A`, volume scale `s`, coded `S = 40` hm³), standing in for the cost-to-go `V_t`; ValueFunctionPlot labels its y-axis 'future cost Q(v)' and its aria-label 'Future cost Q(v) with Benders tangents', and renders on sddp-algorithm §2 and sddp-framework-overview §1, whose caption writes the same plotted function as `V(x)`; see the stage-value row for the `Q_t` of sddp-algorithm and the value-function row for `V_t(x)` | `V(v)` | — | — | src/components/ValueFunctionPlot.astro | math/sddp-algorithm.mdx | — | no |
| Derivative of the plotted future-cost function of storage, `Q(v)`, at a trial point: the slope of the tangent Benders cut (value-function figure caption on sddp-algorithm; `src/figures/valueFunction.ts:5,21`); see the stage-value row for `Q_t`; ValueFunctionPlot draws these tangents ('Benders tangents' in its aria-label) | `V'(v)` | — | — | math/sddp-algorithm.mdx, overview/notation-conventions.md, src/components/ValueFunctionPlot.astro | math/sddp-algorithm.mdx | — | yes |
<!-- prettier-ignore-end -->

Inventoried with no math symbol (no row): `overview/how-to-read.md`.

## 3. Collisions

Each row is a glyph that carries two or more §2 concepts, or a NOT-03 glyph (spec §2.3), or a glyph that a planned
row (ticket-014a) shares. The seventeen NOT-03 glyphs come first, in the spec's order, then the planned collision
`k_{max}`, the four `UNRESOLVED` concepts, and the remaining glyphs (Latin, Greek, calligraphic, text forms).

- **Pages** are named by file stem (`lp-formulation` is `src/content/docs/math/lp-formulation.md`; `cvar` and
  `CvarPlot` are `src/figures/cvar.ts` and `src/components/CvarPlot.astro`); `(planned, ticket-NNN)` marks a page on
  which that ticket writes the concept.
- **Collision criterion.** Two concepts collide when they are written with the same base glyph and the same tag or
  decoration; entity and time indices do not tell them apart (`\sigma_m`, `\sigma_{h,b}`), while a superscript or
  text tag, a decoration or a function argument does (`\sigma^{v-}_h`, `\bar{V}_h`, `m(t)`). An index that only
  selects the entity type or the aggregation level of one quantity (`\bar{G}_h`, `\bar{G}_j`; `q_{h,k}`,
  `q_{h,b,k}`) makes one family, not a collision. A free index letter collides with another index or with the bare
  symbol of the same letter, not with an indexed quantity (the index `u` and the flow `u_{h,k}`); a bare prose
  shorthand of an indexed quantity (`q + s + u`) is not counted.
- **Pages where meanings co-occur** excludes `notation-conventions`, the declaring page (principle 4); a planned page
  counts.
- **Recommendation** types: *Rename* (a §4 row, cited as "§4, ticket-NNN"); *Declared scoped reuse* (principle 4: the
  meanings share no page; G1 adds the declaration to §1.1 and ticket-018 publishes it on the notation page);
  *Distinct forms* or *One family* (no change); *E10 split* (the meanings share `lp-formulation` or `system-elements`
  only until E10 moves state augmentation and LP layout and scaling to `math/state-augmentation` and
  `math/lp-layout-and-scaling`, spec §6.1; declared scoped reuse from then on); *Planned* (the form an introducing
  ticket writes; no §4 row); *ask operator* (an `UNRESOLVED` concept; the Alternative is the best guess from the cobre
  v0.17.0 code, read at the tag).

<!-- prettier-ignore-start -->
| Symbol | Meanings (concept → pages) | Pages where meanings co-occur | Recommendation | Alternative | G1 decision |
| --- | --- | --- | --- | --- | --- |
| k | block index `k \in \mathcal{K}` → lp-formulation, system-elements, equipment-formulations, block-formulations, hydro-production-models, penalty-system, inflow-nonnegativity, scenario-generation, notation-conventions<br>training iteration `k` → horizon-modes, discount-rate, sddp-algorithm, cut-management, lp-warm-start, stopping-rules, upper-bound-evaluation, notation-conventions, toy-single-reservoir, toy-four-reservoir, ConvergencePlot<br>piecewise-quartic tailrace segment `^{(k)}` → hydro-production-models<br>PACF candidate order `k` → par-inflow-model<br>forward-pass (trajectory) index `k` → sddp-algorithm<br>cut index written `k` (`\alpha_k`, `\pi_k`) → cut-management, upper-bound-evaluation<br>ring slot written `k` (`y^{i}_{k}`), renamed `x^{\mathrm{a}}_{s,i}` (x row; §4, ticket-024)<br>PAR lag written `k` (`s_{m-k}`, lag `k = 1, \ldots`) → par-inflow-model<br>distinct forms `k_1`, `k_2` (DCS windows), `k_{loss}` (head-loss factor); `k_{max}` has its own row → cut-management, hydro-production-models | hydro-production-models, horizon-modes, sddp-algorithm, cut-management, upper-bound-evaluation, par-inflow-model | Declared scoped reuse (principle 4, spec §2.3): `k` is the block index on the system and stochastic pages and the training iteration on the algorithm pages; the two meanings share no page. Fixes where another meaning co-occurs (§4): tailrace segment → `n` (ticket-021); forward-pass index → `m` and ring slot → `x^{\mathrm{a}}_{s,i}` (ticket-024); cut index → `i` (tickets 022, 024; the upper-bound cut row drops it, ticket-025); PAR lag → `\ell` (ticket-022). The PACF candidate order `k` (par-inflow-model only) joins the declaration. The toy wording "iteration 0" becomes "before the first iteration" (ticket-026). | Give the iteration counter its own letter on every algorithm page (no scoped reuse): about eleven pages and the ConvergencePlot axis label change. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-60 (e) (operator delegation XD-03), 2026-10-04: the ring-slot entry names its renamed form; ticket-074. XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the predecessor index of the historical calendar walk is written `\ell`, the lag position of stage 1's season, because `k` is the block index on scenario-generation; ticket-085. XD-87 and XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: horizon-modes writes the season cut index as `i` (`i \in \mathcal{I}_\tau`, `\beta_{0,i}`, `\beta_i`), so the cut-index meaning written `k` omits it; ticket-110. |
| ℓ (`\ell`) | AR lag index `\ell` → lp-formulation, system-elements, inflow-nonnegativity, par-inflow-model, scenario-generation, multi-resolution-studies, discount-rate, sddp-algorithm, cut-management, notation-conventions, glossary, _par.io, _par.notes<br>transmission-line index `\ell` (written `l` on lp-formulation and system-elements) → lp-formulation, system-elements, equipment-formulations, notation-conventions, _network.configure, penalty-system<br>enumerated-tree leaf path `\ell` → sddp-algorithm, stopping-rules, upper-bound-evaluation<br>generic-constraint floor `\ell_g` → lp-formulation | lp-formulation, system-elements, sddp-algorithm | The AR lag keeps `\ell` (principle 1: most occurrences). Rename (§4): line index → `n` with the `l` forms (`f^\pm_{n,k}`, `\bar{F}^\pm_n`, `\eta_n`, `c^{exch}_n`; tickets 020, 021, 018); generic-constraint endpoints `\ell_g`, `u_g` → `\underline{b}_g`, `\bar{b}_g` (ticket-020); the leaf-path sum on sddp-algorithm → `\bar{z}_{\text{exact}}` (ticket-024). The leaf path keeps `\ell` on upper-bound-evaluation by declared scoped reuse (no lag there). | Keep `l` for lines, as lp-formulation and system-elements write it today: fewer edits, but `l` reads as 1 and is the column-bound letter `l_j` on lp-formulation. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| σ (`\sigma`) | slack prefix `\sigma^{tag}` (`\sigma^{v-}_h`, `\sigma^{q-}_{h,b,k}`, `\sigma^{gc\pm}_g`, …) → lp-formulation, system-elements, inflow-nonnegativity, notation-conventions, penalty-system<br>PAR innovation standard deviation `\sigma_m` → lp-formulation, block-formulations, inflow-nonnegativity, par-inflow-model, scenario-generation, notation-conventions, toy-single-reservoir, toy-four-reservoir, glossary, _par.io, _par.notes, _scenario.notes<br>annual-regressor standard deviation `\sigma^A_m` → par-inflow-model<br>FPHA cell apportionment share `\sigma_{h,b}` → lp-formulation, system-elements, hydro-production-models<br>standard deviation of simulated costs `\sigma_C` → upper-bound-evaluation<br>glossary and toy-four write the seasonal sample std as `\sigma_m`, `\sigma_h` → glossary, toy-four-reservoir<br>UNRESOLVED NCS `\sigma` (own ask-operator row below) → system-elements | lp-formulation, system-elements, inflow-nonnegativity, par-inflow-model, toy-four-reservoir, glossary | Distinct forms keep: the tagged slacks `\sigma^{tag}`, the season-indexed `\sigma_m`, `\sigma^A_m` and `\sigma_C`. Rename (§4): the cell share `\sigma_{h,b}` → `\lambda_{h,b}` (it shares the `(h,b)` index of the cell slacks `\sigma^{q-}_{h,b,k}`, `\sigma^{g-}_{h,b,k}`; tickets 020, 021); the glossary seasonal std `\sigma_m` → `s_m` (ticket-026). toy-four writes `\sigma_h` for its white-noise inflow std, which is the innovation std of an order-0 model: no change. | Cell share → `w_{h,b}`: frees `\lambda` from a third meaning but adds a second `w` (block weight `w_k`). | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: no decided §4 row covers the `s⁺−s⁻` and `s⁺+s⁻` of `_penalties.io` (this row renames only `\sigma_{h,b}` and the glossary `\sigma_m`), so they stay (§3 Out-of-cluster pages). |
| π (`\pi`) | row dual `\pi` (`\pi^{lb}_{b,k}`, `\pi^{wb}_h`, `\pi_m^{fpha}`, `\pi^{gen}_c`) → lp-formulation, notation-conventions, system-elements, hydro-production-models<br>state cut coefficients `\pi`, `\pi^v_h`, `\pi^{lag}_{h,\ell}`, `\pi^{b}_{i,d}` → lp-formulation, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, cut-management, risk-measures, upper-bound-evaluation, notation-conventions, sddp-framework-overview, glossary, block-formulations, hydro-production-models, toy-single-reservoir, toy-four-reservoir | lp-formulation, hydro-production-models | Principle 5: `\beta` is the cut slope (`\beta`, `\beta^v_h`, `\beta^{lag}_{h,\ell}`, `\beta^{b}_{h,d}`, per-opening `\beta_t(\omega)`, aggregate `\bar{\beta}`, cut `i` `\beta_i`); `\pi` stays for row duals only. Rename on every cut page (§4 slope rows, tickets 020, 021, 023, 024, 025, 026, 018). | Keep `\pi` for cut coefficients and write row duals `\lambda`: contradicts principle 5 and the sddp-specialist contract. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Sanctioned edits the rename tickets would otherwise avoid: the hydro-production-models §2.6.3 heading rename (α_FPHA → k_FPHA; no inbound anchor links — ticket-021 re-checks with check:links); the d2 label renames in §4 rows 1, 2, 17, 51, 62 (inside d2 fences only, labels only). |
| λ (`\lambda`) | correlation eigenvalues `\lambda_i` → par-inflow-model<br>uniform rescaling factor, renamed `c` (§4, ticket-022) → no page<br>risk-aversion weight `\lambda` → risk-measures, upper-bound-evaluation, sddp-framework-overview, glossary<br>Benders cut row dual `\lambda_i` → notation-conventions<br>risk-averse subgradient `\lambda(\tilde{x}, \omega)` → risk-measures | par-inflow-model, risk-measures | Keep `\lambda` as the weight of the CVaR term in `\rho^{\lambda,\alpha} = (1-\lambda)\mathbb{E} + \lambda\,\mathrm{CVaR}_\alpha` (sddp-specialist contract). Rename (§4): subgradient → `\beta(\tilde{x}, \omega)` (principle 5, ticket-024); rescaling factor → `c` (it co-occurs with the eigenvalues on par-inflow-model, ticket-022). The cut row dual `\lambda_i` exists only in notation-conventions §5, which ticket-017 deletes. Declared scoped reuse: eigenvalues `\lambda_i` (stochastic pages), risk weight `\lambda` (algorithm pages) and the new cell share `\lambda_{h,b}` (system pages, a convex weight like the risk weight) share no page. | Eigenvalues → `\varsigma_i` or the matrix entries of `\Lambda` only: removes one declared reuse at the cost of departing from the standard spectral notation. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| α (`\alpha`) | Benders cut intercept `\alpha`, `\alpha_i` → lp-formulation, hydro-production-models, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, cut-management, risk-measures, upper-bound-evaluation, notation-conventions, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir, glossary<br>CVaR tail fraction `\alpha` → risk-measures, upper-bound-evaluation, sddp-framework-overview, glossary, CvarPlot<br>applied tail fraction `\alpha'` → _risk.notes<br>FPHA fit-correction factor `\alpha_{FPHA}` → hydro-production-models, notation-conventions, _hydro.notes<br>NCS availability ratio `\xi_r` → system-elements, equipment-formulations, notation-conventions, scenario-generation | lp-formulation, hydro-production-models, risk-measures, upper-bound-evaluation, sddp-framework-overview, glossary | The CVaR tail fraction keeps `\alpha` (literature convention), with the wording "tail fraction" and "the worst `\alpha` tail" (tickets 024, 025, 026, 028). Cut intercepts leave `\alpha` (§4 intercept rows): point-slope form `\theta_{t-1} \ge \bar{Q}_t + \bar{\beta}^\top(x_{t-1} - \hat{x}_{t-1})` where the cut is shown at its trial point (sddp-algorithm §3, ticket-024); elsewhere the stored intercept `\beta_0` (`\beta_{0,i}` for cut `i`, `\beta_{0,t}(\omega)` per opening; tickets 020, 023, 024, 025, 026, 018). `\alpha_{FPHA}` → `k_{FPHA}` (tickets 021, 027, 018, with the `_hydro.configure` partial out of cluster). NCS availability ratio → `\xi_r` (system-elements now, ticket-020; equipment-formulations and notation-conventions by ticket-079, scenario-generation by ticket-089; see the ask-operator rows). `\alpha'` is published on _risk.notes. | Stored intercept → `\theta^0` or `a_0`; FPHA factor → `\kappa_{FPHA}` (adds a fourth `\kappa` meaning); NCS ratio → `a^{nc}_r` (shares `a` with the inflow). | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Sanctioned edits the rename tickets would otherwise avoid: the hydro-production-models §2.6.3 heading rename (α_FPHA → k_FPHA; no inbound anchor links — ticket-021 re-checks with check:links); the d2 label renames in §4 rows 1, 2, 17, 51, 62 (inside d2 fences only, labels only). Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: `alpha_FPHA` is no literal identifier at v0.17.0 (§4 row 102); the output-format intercept formula is §4 row 104. |
| ρ (`\rho`) | hydro productivities `\rho_h`, `\rho_{esp}`, `\rho_{eq,h,t}`, `\rho_{acum,h,t}`, `\bar\rho_{eq,h,t}`, `\bar\rho_{acum,h,t}` → lp-formulation, system-elements, hydro-production-models, notation-conventions, _hydro.notes, penalty-system<br>periodic autocorrelation `\rho_m(\ell)` → par-inflow-model, _par.notes<br>risk measures `\rho^{\lambda,\alpha}`, `\rho_{\text{nested}}`, `\rho_{\text{end-of-horizon}}` → risk-measures, upper-bound-evaluation, sddp-framework-overview, glossary<br>pumping consumption rate `\rho^{pump}_y` → lp-formulation, system-elements, equipment-formulations, notation-conventions | none | Distinct forms, no rename: productivities carry a hydro index or a tag, the autocorrelation a season subscript and a lag argument, the risk measures a superscript or a text tag. The three families share no page (productivity: system pages; autocorrelation: par-inflow-model; risk: algorithm pages). The new pumping consumption rate `\rho^{pump}_y` (§4, tickets 020, 021) is a tagged productivity-type rate. | Write the autocorrelation `r_m(\ell)`: collides with the innovation scale `r_m`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-56 (ticket-062 guardian observation 1; operator delegation XD-03), 2026-10-04: the pumping consumption rate `\rho^{pump}_y` is listed here; a tagged rate, it collides with no productivity, so the co-occurrence cell is unchanged; ticket-074. |
| d | in-transit maturity lag index `d` → state-augmentation, sddp-algorithm, notation-conventions<br>stage load realization `d_{b,t}` → scenario-generation<br>deficit segment depth `\bar{d}_{b,s}` → system-elements, notation-conventions<br>cumulative discount `d_{1 \to t}` → state-augmentation, discount-rate, upper-bound-evaluation, sddp-algorithm, notation-conventions<br>one-step discount `d_{t \to t+1}` (bare `d` in the glossary Bellman recursion) → policy-graphs, horizon-modes, discount-rate, sddp-algorithm, cut-management, risk-measures, upper-bound-evaluation, toy-single-reservoir, toy-four-reservoir, glossary, lp-formulation, lp-layout-and-scaling<br>relative discount `d_{t_1 \to t_2}` (`d_{t \to m}` for the delivery discount) → discount-rate, notation-conventions, state-augmentation<br>cycle discount `d_{\text{cycle}}` → horizon-modes, upper-bound-evaluation, glossary<br>month duration weight `d_m` → no page (retired, ticket-103)<br>prescaler factors `d_j^{col}`, `d_i^{row}` → lp-layout-and-scaling, state-augmentation, block-formulations, hydro-production-models, cut-management, _cut-management.notes<br>anticipated commitment `d^i_t`, renamed `g^{\mathrm{a}}_{i,t}` (§4, ticket-020) → no page | state-augmentation, lp-layout-and-scaling, sddp-algorithm, discount-rate, upper-bound-evaluation, horizon-modes, cut-management, glossary | Discount factors keep `d` in the arrow form `d_{t \to t+1}`, `d_{1 \to t}` (discount-rate). Rename (§4): `d^{\mathrm{NPV}}_t` → `d_{1 \to t}` (ticket-020); commitment `d^i_t` → `g^{\mathrm{a}}_{i,t}`, the anticipated generation it decides (tickets 020, 018); glossary bare `d` → `d_{t \to t+1}` (ticket-026). Distinct forms keep: maturity lag `d` (an index, only in the bucket subscripts `b_{h,d}`), `d_{b,t}`, `\bar{d}_{b,s}`, and the tagged prescalers `d^{col}_j`, `d^{row}_i` (lp §12, which E10 moves to lp-layout-and-scaling). | Commitment → `u^{a}_{i,t}`: reads as a control, but `u` is the diversion flow and the generic control vector. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the cumulative factor `d_{1 \to t}` is defined once, on discount-rate, and the relative discount is written `d_{t_1 \to t_2}` there and `d_{t \to m}` on lp-formulation and system-elements; ticket-067. The delivery discount `d_{t \to m}` and the cumulative factor `d_{1 \to m}` are written on lp-formulation and system-elements by ticket-066. The one-step factor `d_{t \to t+1}` is written on lp-formulation as the objective coefficient of `\theta`; ticket-068. XD-154, XD-155 (E08 delta pass and ticket-103 rework; operator delegation XD-03), 2026-10-05: the month duration weight `d_m` is retired with no page (multi-resolution-studies writes no aggregate symbol), so the Recommendation's distinct forms no longer list it; ticket-103. XD-65 and XD-154 (ticket-069 guardian routing and E08 delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: discount-rate writes no cycle discount, since the cyclic mathematics is on horizon-modes only; ticket-111. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| K | deterministic-trunk branching `K`, retired (ticket-090) → no page<br>ring depth `K_i` of anticipated plant `i`, the lead for a stage-count lead (the glossary's Lead row writes it as the ring depth) → state-augmentation, system-elements, notation-conventions, glossary<br>maximum lead `K_{\max}`, replaced by the ring size `k_{max}` (§4; tickets 063, 064, 065) → no page<br>cost-scale factor `K` → lp-layout-and-scaling, cut-management, notation-conventions<br>block set `\mathcal{K}` (calligraphic, distinct glyph) → lp-formulation, state-augmentation, equipment-formulations, block-formulations, hydro-production-models, notation-conventions | none (the calligraphic `\mathcal{K}` is a distinct glyph) | The cost-scale factor keeps bare `K` (lp-formulation §12, cut-management §2). Rename (§4): the maximum lead written `K` → `K_{\max}` and the per-plant lead written `K` → `K_i` (tickets 020, 026). E10 split: the cost-scale factor `K` (lp §12) and the ring depth `K_i` (lp §5c) share lp-formulation until §12 moves to lp-layout-and-scaling and the anticipated mechanics to state-augmentation (spec §6.1). `\mathcal{K}` is a different glyph. Rename (§4): `K_{\max}` → the ring slot count `k_{max}` (tickets 063, 064, 065); `K_i` is the ring depth. The trunk branching `K` is retired (ticket-090), so §1.1 carries no `K` line. | Cost-scale factor → `\kappa_c`: frees bare `K` for the lead, but `\kappa` already carries three meanings. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries only the page-disjoint cost-scale and trunk-branching meanings of `K` and ticket-159 adds the split meanings once E10 makes them page-disjoint. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: `K_i` is re-meant as the ring depth and `K_{\max}` is retired for `k_{max}`; ticket-063 publishes both. XD-60, XD-61, XD-69 (operator delegation XD-03), 2026-10-04: the `K_i` meaning and the E10-split wording name the ring depth, and the glossary entry follows its Lead row; ticket-074. XD-124 (operator delegation XD-03), 2026-10-05: the trunk branching `K` is retired with no page (scenario-generation §6 states the trunk as a terminal fan of sibling nodes) and the §1.1 `K` line is deleted; ticket-090. XD-127 (operator delegation XD-03), 2026-10-05: the G1 note's '§1.1 carries only the page-disjoint cost-scale and trunk-branching meanings of `K`' is superseded, since ticket-090 deleted the §1.1 `K` line and §1.1 carries no `K` line; the E10-split declaration (ticket-159) adds a `K` line for the cost-scale factor and the ring depth; ticket-102. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| T | number of stages `T` → lp-formulation, policy-graphs, scenario-generation, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, risk-measures, upper-bound-evaluation, notation-conventions, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir<br>total stage hours `T = \sum_k \tau_k` → lp-formulation, system-elements, inflow-nonnegativity<br>one-stage Bellman operator `T_\tau` → horizon-modes | lp-formulation, horizon-modes | The horizon keeps `T` (principle 1). Rename (§4): stage hours → `H_t` (the form lp §5c already uses; ticket-020) and the Bellman operator → `\mathbb{T}_\tau` (ticket-022, horizon-modes, which also uses the horizon `T`). | Stage hours → `\Delta_t`: collides with the stalling improvement `\Delta_k` and the year length `\Delta t`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. ticket-065 guardian F2 (routed to ticket-074; operator delegation XD-03), 2026-10-04: system-elements writes no stage count `T`, so it leaves this meaning and the co-occurrence cell; ticket-074. |
| L | maximum AR order across hydros `L`, renamed `P^{\max}` (§4, tickets 020, 024) → no page<br>last filling stage `L` → lp-formulation, penalty-system<br>bucket depth `L_h` of receiving plant `h` (§4, ticket-020) → state-augmentation, notation-conventions<br>Cholesky factor `L` → par-inflow-model<br>per-component Lipschitz constants `L_t` (components `L_{t,j}`) → upper-bound-evaluation<br>the glossary and toy-four correlation factor `L`, renamed `C^{1/2}` (§4, ticket-026) → no page | none | Rename (§4): maximum AR order → `P^{\max} = \max_h P_h` (the AR-order letter; tickets 020, 024); bucket depth `L_i` → `L_h` with the receiving-plant index (ticket-020); the glossary and toy-four factor → the spectral factor `C^{1/2}` cobre applies (ticket-026). E10 split: the bucket depth `L_h` and the last filling stage `L` share lp-formulation until the bucket mechanics move to state-augmentation (spec §6.1). Declared scoped reuse: last filling stage `L` (system pages), Cholesky factor `L` (par-inflow-model, the alternative factor), Lipschitz constant `L_t` (upper-bound-evaluation). | Last filling stage → `t^{fill}_{\text{end}}`: removes a declared reuse at the cost of a longer form in the filling formulas. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries only the page-disjoint `L` meanings (the bucket depth `L_h` waits) and ticket-159 adds the split meanings once E10 makes them page-disjoint. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| b | bus index `b \in \mathcal{B}` → lp-formulation, system-elements, scenario-generation, notation-conventions, toy-four-reservoir, penalty-system<br>0-based block index `b` in lp §5c and system-elements §4 (NOT-09) → lp-formulation, system-elements<br>PAR deterministic base `b_{h,m(t)}` (written `\phi_m`, `\mu_m - \sum \ldots` and `\text{deterministic\_base}` elsewhere) → lp-formulation, inflow-nonnegativity, par-inflow-model, scenario-generation<br>linear-program right-hand side `b_t` → sddp-algorithm<br>in-transit buckets `b^{\mathrm{out}}_{i,d}`, `b^{\mathrm{in}}_{i,1}`, `\hat{b}_{i,d}` → lp-formulation, sddp-algorithm, notation-conventions | lp-formulation, system-elements, scenario-generation, sddp-algorithm | Bus `b` keeps (principle 1); the block index is `k` (NOT-09, §4, ticket-020). Distinct forms keep: `b_{h,m(t)}` (hydro and season indices), the tagged buckets `b^{\mathrm{out}}_{h,d}`, `b^{\mathrm{in}}_{h,d}` (receiving-plant index `h`, ticket-020). NOT-10 (§4): one deterministic-base form `b_{h,m(t)}` on lp-formulation, inflow-nonnegativity and scenario-generation (tickets 020, 022). The right-hand side `b_t` of `A_t x_t = b_t` disappears with the SDDP.jl stage form (ticket-024). The new generic-constraint endpoints `\underline{b}_g`, `\bar{b}_g` are decorated bounds with the constraint index. | Deterministic base → `\beta_{h,m}`: collides with the cut slope. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| ψ (`\psi`) | AR coefficient `\psi_{m,\ell}` (written `\psi_\ell`, bare `\psi` on lp-formulation, par-inflow-model §1.2, §2.6 and §3, and `_par.io`) → lp-formulation, inflow-nonnegativity, par-inflow-model, scenario-generation, multi-resolution-studies, notation-conventions, _par.io<br>standardized AR coefficient `\psi^*_{m,\ell}` → par-inflow-model, _par.io, _par.notes<br>PAR(p)-A annual coefficients `\psi^{A*}_m` and `\psi^A_m` (§4, ticket-022) → par-inflow-model<br>dual penalty function `\psi(p, \mu)` → risk-measures | par-inflow-model, scenario-generation, _par.io | NOT-10 (§4): one AR form `\psi_{m(t),\ell}` (tickets 020, 022, 027). Rename (§4): annual coefficient → `\psi^{A*}_m` (standardised) and `\psi^A_m` (original units), tagged like `\mu^A_m`, `\sigma^A_m`; the hat is not an estimate there (ticket-022; `_par.configure` out of cluster). Declared scoped reuse: the penalty function `\psi(p, \mu)` (risk-measures only, two arguments). | Annual coefficient → `\gamma^A_m`: `\gamma` already carries the FPHA planes and the autocovariance. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: the `_par.configure` triple is §4 row 103. |
| hat (`\hat{\cdot}`) | incoming (trial) state value `\hat{x}_{t-1}`, `\hat{v}_h`, `\hat{a}_{h,\ell}`, `\hat{b}_{h,d}`, `\widehat{x}^{\mathrm{a}}_{s,i,t}` → discount-rate, sddp-algorithm, cut-management, risk-measures, determinism-guarantees, notation-conventions, glossary, lp-formulation, system-elements, block-formulations, hydro-production-models, toy-single-reservoir, toy-four-reservoir, ValueFunctionPlot, inflow-nonnegativity, par-inflow-model, scenario-generation<br>sample estimate `\hat{\mu}_m`, `\hat{s}_m`, `\hat{\gamma}_m(\ell)`, `\hat{\rho}_m(\ell)` → par-inflow-model<br>original-unit annual coefficient `\hat{\psi}_m` (not an estimate), renamed `\psi^A_m` (§4, ticket-022) → no page<br>row-scaled LP data `\hat{A}_{ij}`, `\hat{l}^{row}_i`, renamed `\check{A}_{ij}`, `\check{l}_i^{row}` (§4, ticket-020) → no page<br>outer approximation `\hat{V}_t^k` → sddp-algorithm, toy-single-reservoir, toy-four-reservoir<br>per-opening cut intercept `\hat{\alpha}_t(\omega)` → risk-measures, toy-single-reservoir, toy-four-reservoir | sddp-algorithm, risk-measures, lp-formulation, toy-single-reservoir, toy-four-reservoir, par-inflow-model | Declared decoration convention (principle 4): a hat on a state quantity marks its incoming (trial) value; a hat on a model parameter marks its sample estimate; the two never sit on the same base symbol. Rename (§4) every other hat: `\hat{\psi}_m` → `\psi^A_m` (ticket-022); row-scaled `\hat{A}_{ij}`, `\hat{l}^{row}_i`, `\hat{u}^{row}_i` → `\check{A}_{ij}`, `\check{l}^{row}_i`, `\check{u}^{row}_i` (ticket-020); `\hat{V}_t^k` → `\underline{V}_t^k` (tickets 024, 026); `\hat{\alpha}_t(\omega)` → `\beta_{0,t}(\omega)` (tickets 024, 026). | Estimates without a hat (a superscript `est`): non-standard in statistics. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the two-study coupling page leaves this row; its text is merged into post-study-boundary (R69) and ticket-109 deletes the page; ticket-105. |
| τ (`\tau`) | block duration `\tau_k` (written `h_b` in lp §5c and system-elements §4) → lp-formulation, system-elements, equipment-formulations, block-formulations, hydro-production-models, inflow-nonnegativity, notation-conventions<br>bound-stalling window `\tau` → stopping-rules<br>cyclic season `\tau` (`\mathcal{C}_\tau`, `\mathcal{I}_\tau`, `\mathbb{T}_\tau`, `\underline{V}_\tau`) → horizon-modes, sddp-algorithm, upper-bound-evaluation, toy-single-reservoir, toy-four-reservoir<br>PAR lag written `\tau` (`\psi^*_{m,\tau}`, `s_{m-\tau}`) → par-inflow-model | none | Block duration keeps `\tau_k` (principle 1); NOT-09 (§4): `h_b` → `\tau_k` (ticket-020). Rename (§4): the PAR lag → `\ell` (ticket-022). Declared scoped reuse: stalling window `\tau` (stopping-rules) and cyclic season `\tau` (horizon-modes) share no page with the block duration. PEN-11 (penalty-system, collision check from ticket-014a): penalty-system writes no `\tau` meaning other than the block duration, so no collision arises. | Stalling window → `w`: `w` is the block weight and the census weight. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-87 and XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the cyclic-season forms are those horizon-modes writes, `\mathcal{I}_\tau` and `\mathbb{T}_\tau` (§4, ticket-022); ticket-110. |
| φ (`\phi`) | exact hydro production function `\phi(v, q, s)` → hydro-production-models<br>in-transit arrival density `\phi_{i,k}` → lp-formulation<br>PAR deterministic base written `\phi_m`, renamed `b_{h,m}` (§4, ticket-022) → no page<br>other implementations' AR-coefficient notation, named in the relation note → par-inflow-model<br>convex-combination weights `\varphi_i` → upper-bound-evaluation | none | Rename (§4): `\phi_m` → `b_{h,m}` (NOT-10, ticket-022). The arrival density takes the receiving-plant index, `\phi_{h,k}` (ticket-020). Declared scoped reuse: production function `\phi(v, q, s)` (hydro-production-models) and arrival density `\phi_{h,k}` (lp-formulation) share no page. | Arrival density → `\nu^{arr}_{h,k}`: groups it with the travel-time shares `\nu` at the cost of a tagged form. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| β (`\beta`) | boundary-cut coefficient vector `\beta` (glossary `\beta \cdot x`) → post-study-boundary, glossary<br>the same concept written `\pi` on every other cut page (per-pair `\beta(n', \omega)` on policy-graphs and cut-management) → lp-formulation, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, cut-management, policy-graphs, risk-measures, upper-bound-evaluation, notation-conventions, sddp-framework-overview, glossary, block-formulations, hydro-production-models, toy-single-reservoir, toy-four-reservoir | post-study-boundary, glossary | Principle 5: `\beta` is the cut slope on every page; the stored intercept is `\beta_0` (§4 slope and intercept rows; post-study-boundary keeps `\beta` and takes `\beta_0`, ticket-023). `\beta_0` and `\beta_i` are read by position: `\beta_{0,i}` is the intercept of cut `i`. | Write the stored intercept `\beta^0`: avoids the double subscript `\beta_{0,i}` but puts a superscript where the slopes carry their state tags (`\beta^v`, `\beta^{lag}`). | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Sanctioned edits the rename tickets would otherwise avoid: the hydro-production-models §2.6.3 heading rename (α_FPHA → k_FPHA; no inbound anchor links — ticket-021 re-checks with check:links); the d2 label renames in §4 rows 1, 2, 17, 51, 62 (inside d2 fences only, labels only). Note: the output-format intercept formula (XD-04 decision 5) is §4 row 104. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| k_{max} | hold-ring slot count `k_{max}` → lp-formulation, notation-conventions, output-format, output/policy<br>iteration limit `k_{max}` → stopping-rules | none | Declared scoped reuse (principle 4; two-way door, so the simpler option): the hold-ring slot count on lp-formulation (state-augmentation after E10), the notation page and output-format, introduced by ticket-063; the iteration limit on stopping-rules. No §4 row. | Rename the iteration limit to `\bar{k}` and, for symmetry, the time limit `t_{max}` to `\bar{t}` (ticket-025): removes the reuse at the cost of two edits on stopping-rules. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Note: the hold-ring meaning is planned and held back from the notation page until its introducing ticket-063 (ADR-046), so this declaration is not in §1.1; ticket-063 publishes it with the hold-ring row. Published by ticket-063: the hold-ring row, the §1.1 declaration and its notation-page line. ticket-074 (E05 acceptance), 2026-10-04: the hold-ring meaning is the slot count of every ring, as on the notation page and §1.1 (`K_i` is the ring depth); output-format writes it in the checkpoint `subindex` row. |
| μ (`\mu`) in the NCS availability formula (UNRESOLVED) | `\mu` in `\alpha = \mathrm{clamp}(\mu + \sigma \cdot \eta,\,0,\,1)`, undefined on its page → no page (system-elements writes the decided `\mu^{nc}_r`) | none | ask operator | Mean of the NCS availability factor, `\mu^{nc}_r` (stage-varying), the `mean` column of `scenarios/non_controllable_stats.parquet` (`crates/cobre-io/src/scenarios/non_controllable_stats.rs:10`, read as `ncs_lp.mean` at `crates/cobre-sddp/src/stochastic/noise.rs:367`, v0.17.0); tagged like the load mean `\mu^{\text{load}}_{b,t}` (§4 NCS row, ticket-020). | G1 (XD-04, operator delegation XD-03), 2026-10-04: The four UNRESOLVED (`ask operator`) rows: accept the code-derived alternative. NCS mean → `\mu^{nc}_r` (`non_controllable_stats.rs:10`), std → `s^{nc}_r` (`:11`), noise → `\varepsilon^{nc}_r` (`noise.rs:366`), so the ratio reads `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r\,\varepsilon^{nc}_r, 0, 1)`; the stray `\eta \approx 0.95`–`1.0` clause on system-elements is the line efficiency, which never enters the LP — drop the clause (ticket-020; LPS-17 keeps the rest of that sentence for E10). E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| σ (`\sigma`) in the NCS availability formula (UNRESOLVED) | `\sigma` in the same formula → no page (system-elements writes the decided `s^{nc}_r`) | none | ask operator | Standard deviation of the NCS availability factor, `s^{nc}_r`, the `std` column of `non_controllable_stats.parquet` (`non_controllable_stats.rs:11`, `ncs_lp.std` at `noise.rs:368`); written `s` like the load std `s^{\text{load}}_{b,t}`, since `\sigma` is the slack prefix (§4 NCS row). | G1 (XD-04, operator delegation XD-03), 2026-10-04: The four UNRESOLVED (`ask operator`) rows: accept the code-derived alternative. NCS mean → `\mu^{nc}_r` (`non_controllable_stats.rs:10`), std → `s^{nc}_r` (`:11`), noise → `\varepsilon^{nc}_r` (`noise.rs:366`), so the ratio reads `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r\,\varepsilon^{nc}_r, 0, 1)`; the stray `\eta \approx 0.95`–`1.0` clause on system-elements is the line efficiency, which never enters the LP — drop the clause (ticket-020; LPS-17 keeps the rest of that sentence for E10). E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| η (`\eta`) in the NCS availability formula (UNRESOLVED) | `\eta` in the same formula → no page (system-elements writes the decided `\varepsilon^{nc}_r`) | none | ask operator | Standard-normal noise of the source, `\varepsilon^{nc}_r`, the per-source `eta` of the noise loop at `noise.rs:366`, combined at `noise.rs:370` (`availability_ratio = (mean + std * eta).clamp(0.0, 1.0)`); written `\varepsilon` like the load noise `\varepsilon^{\text{load}}_{b,t}`. The ratio itself becomes `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r\,\varepsilon^{nc}_r, 0, 1)` (§4 NCS row). | G1 (XD-04, operator delegation XD-03), 2026-10-04: The four UNRESOLVED (`ask operator`) rows: accept the code-derived alternative. NCS mean → `\mu^{nc}_r` (`non_controllable_stats.rs:10`), std → `s^{nc}_r` (`:11`), noise → `\varepsilon^{nc}_r` (`noise.rs:366`), so the ratio reads `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r\,\varepsilon^{nc}_r, 0, 1)`; the stray `\eta \approx 0.95`–`1.0` clause on system-elements is the line efficiency, which never enters the LP — drop the clause (ticket-020; LPS-17 keeps the rest of that sentence for E10). E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| η (`\eta`) in the coefficient-range sentence (UNRESOLVED) | `\eta \approx 0.95`–`1.0` beside `\rho \approx 0.05`–`5` in the system-elements conditioning sentence → no page (the sentence is removed) | none | ask operator | The line efficiency `\eta_n = 1 - \text{losses}/100` (the 0.95–1.0 range is a 0–5 % loss band); at v0.17.0 it never enters the constraint matrix (losses are applied only to the reported flows, `crates/cobre-io/src/output/simulation_writer.rs:587`), and instance magnitudes belong to no math page (LPS-17), so drop the clause `$\eta \approx 0.95$–$1.0$, ` (§4 NCS row, ticket-020). | G1 (XD-04, operator delegation XD-03), 2026-10-04: The four UNRESOLVED (`ask operator`) rows: accept the code-derived alternative. NCS mean → `\mu^{nc}_r` (`non_controllable_stats.rs:10`), std → `s^{nc}_r` (`:11`), noise → `\varepsilon^{nc}_r` (`noise.rs:366`), so the ratio reads `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r\,\varepsilon^{nc}_r, 0, 1)`; the stray `\eta \approx 0.95`–`1.0` clause on system-elements is the line efficiency, which never enters the LP — drop the clause (ticket-020; LPS-17 keeps the rest of that sentence for E10). E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| A | number of anticipated thermals `A` → state-augmentation, notation-conventions<br>NCS block cap `A_{r,k}` → system-elements, equipment-formulations, notation-conventions<br>PAR(p)-A annual regressor `A_{h,t-1}` → par-inflow-model<br>constraint matrix `A` and its entry `A_{ij}` → lp-layout-and-scaling<br>stage constraint matrix `A_t` → no page | none | E10 split: the count `A` (lp §4b layout, §5c) moves to lp-layout-and-scaling and state-augmentation, the matrix entry `A_{ij}` (§12) to lp-layout-and-scaling, with the NCS cap `A_{r,k}` on the system pages (lp-formulation writes the curtailment term without it, ticket-079) (spec §6.1); declared scoped reuse from then on, with the annual regressor `A_{h,t-1}` on par-inflow-model. `A_t` disappears with the SDDP.jl stage form (ticket-024). | Count of anticipated thermals → `N^{\mathrm{a}}` now, removing the lp-formulation co-occurrence before E10. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries no `A` line and ticket-159 adds the split meanings once E10 makes them page-disjoint. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| a | tailrace segment coefficients `a_0^{(k)}, \ldots, a_4^{(k)}` → hydro-production-models<br>inflow `a_h`, lag column `a_{h,\ell}`, incoming lag `\hat{a}_{h,\ell}`, standardized `\tilde{a}_t`, tagged `a^{effective}_h`, `a^{\text{target}}_t`, `a^{\text{reconstructed}}_t`, `a^{\text{obs}}_h`, `a^{(y)}_{h,t}` → lp-formulation, lp-layout-and-scaling, system-elements, block-formulations, hydro-production-models, inflow-nonnegativity, par-inflow-model, scenario-generation, sddp-algorithm, notation-conventions, toy-single-reservoir, toy-four-reservoir, glossary, multi-resolution-studies, discount-rate, cut-management | hydro-production-models | The inflow family keeps `a`. Rename (§4): tailrace segment coefficients → `c^{(n)}_0, \ldots, c^{(n)}_4` (they share hydro-production-models with the inflow `a_h`, ticket-021). NOT-10 (§4): one realized-inflow variable `z_h` on lp-formulation (ticket-020) and the registry lag forms `a_{h,\ell}`, `\hat{a}_{h,\ell}` on par-inflow-model §2.5 (ticket-022). | Segment coefficients → `b^{(n)}_i`: `b` is the bus index. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the record observation `a^{\text{obs}}_h` and window `y`'s lag chain `a^{(y)}_{h,t}` (scenario-generation) are distinct forms of the inflow family; ticket-085. XD-154 (E08 delta pass, D-E08Δ-1; operator delegation XD-03), 2026-10-05: the quarterly and monthly aggregate forms of multi-resolution-studies are retired with no page, and the page writes the realized inflow as the stage-indexed `a_{h,t}`; ticket-103. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the two-study coupling page leaves this row; its text is merged into post-study-boundary (R69) and ticket-109 deletes the page; ticket-105. |
| C | contract dispatch bounds `\bar{C}_c`, `\underline{C}_c` → system-elements, equipment-formulations, notation-conventions<br>correlation matrix `C` and spectral factor `C^{1/2}` → par-inflow-model, scenario-generation, toy-four-reservoir, glossary<br>objective component totals `C^{component}`, `C_{stage}` → lp-formulation, lp-layout-and-scaling<br>trajectory cost `C(\ell)`, mean simulated cost `\bar{C}` → sddp-algorithm, stopping-rules, upper-bound-evaluation, glossary<br>random cost written `C` in the risk figure → risk-measures, CvarPlot, cvar<br>estimated `\hat{C}`, `\hat{C}_m` and clipped `\tilde{C}` → par-inflow-model | glossary | Distinct forms keep: decorated contract bounds, the tagged objective totals, the matrix `C` with its factor `C^{1/2}`, the cost `C(\ell)`, `C_m`, `\bar{C}`. Rename (§4): the correlation forms `\Sigma`, `L z` → `C`, `C^{1/2} z` (tickets 022, 026); the random cost of the risk figure → `Z`, the risk-measures body symbol (tickets 024, 028). | Correlation matrix → `R` (common in the PAR literature): `R` is free, but the registry and par-inflow-model already write `C`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: the `cvar.test.ts` title and message are §4 row 106. |
| c | cost-coefficient prefix `c^{tag}` (`c^{th}_j`, `c^{def}_{b,s}`, `c^{exch}_\ell`, …) → lp-formulation, system-elements, equipment-formulations, inflow-nonnegativity, notation-conventions, toy-single-reservoir, toy-four-reservoir, hydro-production-models, penalty-system<br>anticipated unit cost `c_i(t)`, written `c_i(m)` at delivery stage `m` → state-augmentation, system-elements, notation-conventions<br>decision stage of delivery `m`, which spec §3.3 writes `c_i(m)`, published as `t_i(m)` (`t` row)<br>tailrace polynomial coefficients `c_0, \ldots, c_4` → hydro-production-models<br>LP objective coefficient `c_j` → lp-layout-and-scaling<br>maximum penalty coefficient `c_{max}^{penalty,t}` → upper-bound-evaluation<br>stage cost vector `c_t` (`c_t^\top x_t`) → sddp-algorithm, risk-measures, upper-bound-evaluation, sddp-framework-overview<br>stage cost `c_t(x_t, u_t)` (child form `c_{n'}(x', u)` on policy-graphs) → horizon-modes, discount-rate, policy-graphs, upper-bound-evaluation, glossary<br>reduced costs `\bar{c}`, `\bar{c}^{in}_h`, `\bar{c}^{lag}_{h,\ell}`, `\bar{c}^{\,b}_{i,d}` → lp-layout-and-scaling, state-augmentation, notation-conventions, block-formulations, hydro-production-models, cut-management | system-elements, state-augmentation, lp-layout-and-scaling, hydro-production-models, upper-bound-evaluation | Distinct forms keep: the tagged costs, the decorated reduced costs, `c_j` (lp §12, to lp-layout-and-scaling in E10), `c_0, \ldots, c_4`. Rename (§4): the stage cost takes the single SDDP.jl form `c_t(x_t, u_t)` (tickets 024, 025, 026). The anticipated unit cost keeps `c_i(\cdot)`, written `c_i(m)` at the delivery stage; the decision-stage map, which spec §3.3 also writes `c_i(m)`, is published as `t_i(m)` (`t` row), a stage-valued map like `t(n)`, so the two meanings do not share a form on lp-formulation. | Decision-stage map → `t^{\mathrm{dec}}_i(m)`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the decision-stage map is published as `t_i(m)`; ticket-063. The anticipated unit cost is written `c_i(m)` at delivery stage `m` by ticket-066. XD-75 (ticket-066 guardian nit 1; operator delegation XD-03), 2026-10-04: the Recommendation states the published forms; ticket-074. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| D | load demand `D_{b,k}` (labelled `D` in the system-elements d2 diagram) → lp-formulation, system-elements, notation-conventions, toy-single-reservoir, toy-four-reservoir<br>diagonal scaling matrices `D_r`, `D_c` → lp-layout-and-scaling | none | E10 split: `D_r`, `D_c` move with lp §12 to lp-layout-and-scaling; declared scoped reuse from then on. Rename (§4): the d2 label `d` → `D` (ticket-020). | Scaling matrices → `S_r`, `S_c` now. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Sanctioned edits the rename tickets would otherwise avoid: the hydro-production-models §2.6.3 heading rename (α_FPHA → k_FPHA; no inbound anchor links — ticket-021 re-checks with check:links); the d2 label renames in §4 rows 1, 2, 17, 51, 62 (inside d2 fences only, labels only). E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries no `D` line and ticket-159 adds the split meanings once E10 makes them page-disjoint. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| E | maximum stored energy `E^{max}_{h,t}` → hydro-production-models, notation-conventions<br>stage coupling matrix `E_t` → sddp-algorithm | none | Distinct forms (tag vs stage index on different pages); `E_t` disappears with the SDDP.jl stage form (ticket-024). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| F | FPHA envelopes `FPHA_0`, `FPHA` → hydro-production-models<br>line capacities `\bar{F}^\pm_\ell` → system-elements, equipment-formulations, notation-conventions | none | Distinct forms. The line capacities take the line index `n` (ℓ row, §4). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| f | block load factor `f_{b,t,k}` → scenario-generation<br>NCS block factor `f_{r,k}` → equipment-formulations, system-elements, notation-conventions<br>line flows `f^\pm_{\ell,k}` → lp-formulation, system-elements, equipment-formulations, notation-conventions, _network.configure<br>DCS future-cost floor `f_i` → cut-management<br>cost density `f(C)` of the risk figure → risk-measures, CvarPlot | equipment-formulations, system-elements | Distinct forms: block factors carry entity and block indices (one family of per-block scale factors), line flows the `\pm` tag (and the line index `n`, §4), `f_i` sits on cut-management only, the density is a function. Rename (§4): `f(C)` → `f(Z)` (tickets 024, 028). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| G | generation bounds per entity: `\bar{G}_h`, `\bar{G}_{h,b}`, `\bar{G}_g`, `\bar{G}_j`, `\bar{G}_r` and their lower bounds → lp-formulation, hydro-production-models, notation-conventions, system-elements, equipment-formulations, penalty-system | none | One concept family (the entity index selects the entity type), no collision. The unit-group bounds take the unit-group index `u` (`\bar{G}_u`, `\underline{G}_u`; §4, ticket-020). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| g | unit-group index `g` → lp-formulation, hydro-production-models<br>generic-constraint index `g` (`\sigma^{gc\pm}_g`, `\ell_g`, `u_g`, `\gamma_{g,e}`) → lp-formulation<br>generation `g_{j,k}`, `g_{h,k}`, `g_{h,b,k}`, `g^{nc}_{r,k}`, generic bound `\bar{g}` → system-elements, equipment-formulations, notation-conventions, lp-formulation, toy-single-reservoir, toy-four-reservoir, hydro-production-models | lp-formulation, hydro-production-models | The generic-constraint index keeps `g`. Rename (§4): unit-group index → `u` (both index meanings sit on lp-formulation; tickets 020, 021). Generation is one family indexed by entity; the new anticipated commitment `g^{\mathrm{a}}_{i,t}` (d row) is tagged. | Unit-group index → `\upsilon`: avoids reading `u` as the diversion flow, but `\upsilon` resembles the storage `v`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| H | reference net head `H^{ref}_{h,t}` → hydro-production-models<br>backwater key `HrefJus` → hydro-production-models<br>window-selection hash `H(\text{iteration}, \text{trajectory})` → scenario-generation | hydro-production-models | Distinct forms (tag, text name, two-argument function) on pages that do not share them; `H_t` (total stage hours, written today in lp §5c and adopted by the T row) is a stage-indexed hour count on the system pages. No rename. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the hash takes text arguments on scenario-generation, where `i` and `m` carry the correlation-group entity index and the season; ticket-086. |
| h | hydro index `h` and cell `(h, b)` → lp-formulation, system-elements, hydro-production-models, _hydro.notes, block-formulations, penalty-system, inflow-nonnegativity, par-inflow-model, scenario-generation, multi-resolution-studies, discount-rate, sddp-algorithm, cut-management, risk-measures, notation-conventions, toy-four-reservoir<br>head and level functions `h_{net}`, `h_{fore}`, `\bar h_{fore,h}`, `h_{eq}`, `h_{tail}`, `h_{loss}` → hydro-production-models<br>breakpoint height `h^{(i)}` → hydro-production-models<br>block duration written `h_b` (NOT-09) → no page | hydro-production-models | Hydro index keeps `h`; head and level functions are tagged forms. Rename (§4): breakpoint heights → `h^{(i)}` (shares hydro-production-models with the hydro index, ticket-021); `h_b` → `\tau_k` (NOT-09, ticket-020). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the two-study coupling page leaves this row; its text is merged into post-study-boundary (R69) and ticket-109 deletes the page; ticket-105. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| I | vertex count `I_t` → upper-bound-evaluation<br>`hydro_inflow` quantity `I_{h,k}` → lp-formulation | none | Declared scoped reuse (principle 4): the vertex count on upper-bound-evaluation and the `hydro_inflow` quantity on lp-formulation share no page. The identity matrix `I` of `\mathcal{N}(0, I)` is no inventoried concept and shares no page with `I_{h,k}` (§6, ticket-031). | No alternative needed. | XD-34 (E04 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: declare (§1.1); ticket-056 publishes `I_{h,k}`. |
| i | Yule-Walker row and column `(i, j)` → par-inflow-model<br>eigenvalue index `i` of the correlation matrix (`\lambda_i`, `U_{hi}`) → par-inflow-model<br>entity index in a correlation group → scenario-generation<br>anticipated thermal index `i` → state-augmentation, system-elements, sddp-algorithm, post-study-boundary, notation-conventions, glossary<br>receiving plant of a bucket, written `h` (§4, tickets 020, 024, 018) → no page<br>Benders cut index `i` → lp-formulation, horizon-modes, discount-rate, cut-management, notation-conventions, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir<br>LP row index `i` (`d_i^{row}`, `l_i^{row}`, `\pi_i`) → lp-layout-and-scaling<br>inner-approximation vertex index `i` → upper-bound-evaluation<br>PAR(p)-A rolling-window sample index `i`, written `w` (w row; §4, ticket-031) → no page<br>storage-point index `i` of the volume-height breakpoints `v^{(i)}`, `h^{(i)}` and of the FPHA fitting grid `V_i` → hydro-production-models | par-inflow-model | Cut index keeps `i` (registry; horizon-modes and cut-management move to it from `k`). Rename (§4): receiving plant → `h` (tickets 020, 024, 018); out-of-sample scenario index → `m` (shares upper-bound-evaluation with the vertex index, ticket-025); the upper-bound cut row drops the cut index. E10 split: the anticipated-plant index and the cut index share lp-formulation until the anticipated mechanics move to state-augmentation (spec §6.1). Declared scoped reuse: Yule-Walker `(i, j)` (par-inflow-model), correlation-group entity (scenario-generation), vertex (upper-bound-evaluation), anticipated plant (system pages). | Anticipated-thermal index → `j` (an anticipated plant is a thermal): removes the lp-formulation co-occurrence now, at the cost of rewriting the planned `K_i`, `r_i(m)`, `c_i(m)` forms of spec §3.3. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries only the page-disjoint `i` meanings (the anticipated-plant index waits) and ticket-159 adds the split meanings once E10 makes them page-disjoint. XD-10 (ticket-031, operator delegation XD-03), 2026-10-04: the PAR(p)-A sample index shares par-inflow-model with the Yule-Walker `(i, j)`, so it is renamed `w` (§4, ticket-031); the eigenvalue index of `\lambda_i` (§8.2) never shares a formula with the Yule-Walker `(i, j)` and stays. ticket-074 (E05 acceptance), 2026-10-04: sddp-algorithm writes the anticipated index in `x^{\mathrm{a}}_{s,i}`; its buckets take the receiving-plant index `h` (§4), so the two meanings do not co-occur there and the co-occurrence cell is unchanged. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| j | opening index `j` (1-based on scenario-generation and sddp-algorithm; §4, ticket-022) → scenario-generation, sddp-algorithm, toy-single-reservoir, toy-four-reservoir<br>state-coordinate index `j` → cut-management, upper-bound-evaluation<br>thermal index `j` and pumping-station index written `j` → lp-formulation, system-elements, equipment-formulations, notation-conventions, penalty-system<br>LP column index `j` (lp-layout-and-scaling §2) → lp-layout-and-scaling<br>FPHA fitting-grid turbined-flow index `j` (`Q_j`) → hydro-production-models | none | Thermal index keeps `j` (principle 1). Rename (§4): pumping-station index → `y` (tickets 020, 021, 018); 1-based opening index `j \in \{1, \ldots, N_t\}` (tickets 022, 024). E10 split: the LP column index `j` moves with lp §12 to lp-layout-and-scaling. Declared scoped reuse: opening index (stochastic and algorithm pages), state-coordinate index (cut-management, upper-bound-evaluation). | Opening index → `o`: no declaration, but `o` is the outflow tag. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries only the page-disjoint `j` meanings (the LP column index waits) and ticket-159 adds the split meanings once E10 makes them page-disjoint. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| l | LP column bounds `l_j` → lp-layout-and-scaling<br>LP row bounds `l^{row}_i` → lp-layout-and-scaling<br>transmission-line index written `l`, renamed `n` (ℓ row, §4) → no page | none | Column and row bounds are one family (tag `row`), moving to lp-layout-and-scaling in E10. The line index `l` becomes `n` (ℓ row, §4). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| M | number of FPHA hyperplanes `M` → hydro-production-models<br>number of simulated trajectories `M` → discount-rate, sddp-algorithm, upper-bound-evaluation<br>season cycle length `M` → par-inflow-model, horizon-modes, notation-conventions, glossary | none | Declared scoped reuse: plane count (hydro-production-models), trajectory count (algorithm pages), cycle length (stochastic pages and horizon-modes) share no page. | Plane count → `\lvert\mathcal{M}_h\rvert`, the size of the plane set, removing one declared reuse. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| m | season `m` and season map `m(t)` → lp-formulation, block-formulations, inflow-nonnegativity, par-inflow-model, scenario-generation, multi-resolution-studies, horizon-modes, upper-bound-evaluation, notation-conventions, glossary<br>simulated-trajectory index `m` → discount-rate, sddp-algorithm<br>simulation-scenario index `m` → upper-bound-evaluation<br>predecessor season `m^{(\ell)}` → scenario-generation<br>FPHA plane index `m` → lp-formulation, block-formulations, hydro-production-models, notation-conventions, penalty-system<br>delivery stage `m` of an anticipated commitment → state-augmentation, notation-conventions, system-elements, post-study-boundary | lp-formulation, block-formulations, scenario-generation | Distinct forms: the season appears as `m` on the stochastic pages and as the stage map `m(t)` in the stage LP (NOT-10, §4), the FPHA plane as the superscript index of `\gamma^m` and `\pi^{fpha}_m`; `m^{(\ell)}` is the predecessor season on scenario-generation. Declared scoped reuse: trajectory index `m` (algorithm pages, and upper-bound-evaluation after the scenario-index rename) shares no page with the season. E10 split: the delivery stage shares lp-formulation and system-elements with the FPHA plane index until the anticipated mechanics move to state-augmentation (spec §6.1); declared scoped reuse from then on (ticket-159). | FPHA plane index → `p` with set `\mathcal{M}_h`: frees `m` on lp-formulation but `p` is the pumped flow. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Note: the planned predecessor season `m^{(k)}` (ticket-085) is a distinct form, not part of the declaration. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the delivery stage `m` is an E10 split with the FPHA plane index; ticket-063 publishes it. post-study-boundary writes the delivery stage too, its only `m`; ticket-070. XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: `m^{(\ell)}` is published on scenario-generation, a distinct form with the lag index `\ell` (k row); ticket-085. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| N | opening count `N_t` (also `N_{\text{openings}}`) → scenario-generation, sddp-algorithm, cut-management, notation-conventions, toy-single-reservoir, toy-four-reservoir, glossary<br>effective opening count `N^{\rm eff}_t` → scenario-generation<br>forward-pass count `N_{\text{forward\_passes}}` → cut-management, upper-bound-evaluation<br>per-season observation counts `N_m`, `N^{(\ell)}_m`, `N^A_m` → par-inflow-model, bibliography<br>historical record length `N` → par-inflow-model<br>number of hydros `N` (`N_{hydro}` on block-formulations and sddp-algorithm) → lp-formulation, block-formulations, sddp-algorithm, cut-management<br>out-of-sample scenario count `N` → upper-bound-evaluation<br>thread count `N` → no page (retired, ticket-123)<br>uniform branching `N` (`N_t = N`) → scenario-generation | scenario-generation, sddp-algorithm, cut-management, upper-bound-evaluation, par-inflow-model | Bare `N` is the number of hydros (principle 1). Rename (§4): record length → `N^{\text{hist}}` (shares par-inflow-model with `N_m`, ticket-022); the PACF threshold on scenario-generation cites its owner instead of `N_m` (shares the page with `N_t`, ticket-022); the bare opening count on sddp-algorithm is dropped (shares the page with the thread count, ticket-024); the toy and glossary weight `1/N` → `1/N_t` (ticket-026); upper-bound §2 weight `1/N` → `1/M` (shares the page with the out-of-sample count, ticket-025). Declared scoped reuse: thread count `N` (sddp-algorithm), uniform branching `N` (scenario-generation), out-of-sample count `N` (upper-bound-evaluation). Tagged counts are distinct forms. | Thread count → `N_{\text{thr}}`, out-of-sample count → `N_{\text{sim}}`, uniform branching → `N_t` throughout: no declared reuse, about fifteen more edits. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| n | policy-graph node `n` (child `n'`) → policy-graphs, scenario-generation, cut-management, sddp-algorithm<br>Monte Carlo backward sample count `n` → scenario-generation, sddp-algorithm<br>cycle repetitions `n` → horizon-modes<br>enumerated-tree node `n` → upper-bound-evaluation<br>periodic cut-selection period `n` → cut-management<br>inner-approximation vertex count `n` (`x^{(n)}`, `\bar{v}^{(n)}`) → upper-bound-evaluation<br>correlation-matrix dimension `n` (`\lambda_1, \ldots, \lambda_n`) → par-inflow-model<br>tailrace-segment superscript `^{(n)}` → hydro-production-models<br>tagged counts `n_{vertices}`, `n_{\text{state}}`, `n_{\text{adic}}`, `n_{\text{pre}}` → upper-bound-evaluation, lp-formulation, cut-management, scenario-generation | scenario-generation, upper-bound-evaluation, cut-management | The node keeps `n` (policy-graph and enumerated-tree nodes are one concept). Rename (§4): sample count → `n_{\text{sample}}` (shares scenario-generation with the node, tickets 022, 024); selection period → `n_{\text{sel}}` (ticket-024). Declared scoped reuse: cycle repetitions `n` (horizon-modes) and the new transmission-line index `n` (system pages, ℓ row). Tagged counts are distinct. | Line index → `l` (see the ℓ row) and cycle repetitions → `r`: `r` carries four meanings already. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-10 (ticket-031, operator delegation XD-03), 2026-10-04: the vertex count shares upper-bound-evaluation with the enumerated-tree node, so it is renamed `I_t` (§4, ticket-031); the correlation-matrix dimension (par-inflow-model) and the tailrace-segment superscript (hydro-production-models, XP-05) are declared scoped reuse (§1.1). XD-65 and XD-154 (ticket-069 guardian routing and E08 delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: discount-rate writes no cycle repetitions, so the cycle-repetition reuse is declared for horizon-modes only; ticket-111. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| O | outflow bounds `\bar{O}_h`, `\underline{O}_h` → lp-formulation, system-elements, notation-conventions | none | One concept family (upper and lower bound), no collision. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| o | outflow `o_{h,k}` (also `o_h`) → lp-formulation, system-elements, hydro-production-models, notation-conventions<br>credited upstream release `o^{arr}_{h' \to h,k}` → lp-formulation | lp-formulation | Distinct tagged forms: the `arr` superscript tells the credited release from the outflow (collision criterion). | Write the credited release `R`: the realized withdrawal `R_h` shares lp-formulation. | XD-34 (E04 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: accept the Recommendation; ticket-056 publishes `o^{arr}_{h' \to h,k}`. |
| P | AR order `P_h` → lp-formulation, state-augmentation, inflow-nonnegativity, par-inflow-model, scenario-generation, sddp-algorithm, cut-management, notation-conventions, toy-single-reservoir, toy-four-reservoir, glossary, _par.io<br>lag-sum width `P` of the noise inversion → scenario-generation<br>pumping power and pumped-flow bounds `P^{pump}_{y,k}`, `\bar{P}_y`, `\underline{P}_y` → equipment-formulations, lp-formulation, system-elements, notation-conventions<br>leaf-path probability `P(\ell)` → sddp-algorithm, stopping-rules, upper-bound-evaluation<br>transition probability `P(n \to n')` with child node `n'` → policy-graphs, cut-management, sddp-algorithm, notation-conventions<br>HYD-11 PreFilling routing set: published as the tagged upstream set `\mathcal{U}^{pre}_h(t)` (𝒰 row, ticket-056), so it adds no `P` meaning | lp-formulation, scenario-generation, sddp-algorithm, cut-management | AR order keeps `P_h`. Rename (§4): the lag-sum width `P` → `P_h` (scenario-generation, ticket-022); pumping forms take the station index `y` (ticket-020, 021). Distinct forms: the tagged `P^{pump}_{y,k}`, the decorated bounds, and the event probabilities `P(\ell)` and the transition probability `P(n \to n')` (argument in parentheses). The HYD-11 PreFilling routing set is the tagged upstream set `\mathcal{U}^{pre}_h(t)`, not `P_h(t)` (it would equal the AR-order form); ticket-056 published it (𝒰 row). The transition probability is written `P(n \to n')` with child node `n'` (policy-graphs, cut-management, sddp-algorithm, notation-conventions). | Write the transition probability `\pi_{n n'}`: collides with the row dual. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the two-study coupling page leaves this row; its text is merged into post-study-boundary (R69) and ticket-109 deletes the page; ticket-105. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| p | PACF order ceiling `p_{max}` and per-season maximum `p_{\max}` → par-inflow-model<br>security-curve fraction `p` → hydro-production-models<br>policy-graph transition probability (d2 labels `p₁`, `p₂`, `q`) → policy-graphs, sddp-algorithm<br>opening probability `p(\omega)` (per child `p_{n'}(\omega)`) → sddp-algorithm, cut-management, risk-measures, policy-graphs, toy-single-reservoir, toy-four-reservoir, glossary<br>pumped flow `p_{y,k}` → lp-formulation, system-elements, equipment-formulations, notation-conventions | sddp-algorithm, policy-graphs | Opening probability keeps `p(\omega)`. Rename (§4): `p_{\max} = \max_m p_m` → the AR order `P_h` (shares par-inflow-model with the ceiling `p_{max}`, ticket-022); sddp-algorithm "probability `p = 1`" → "probability 1" (ticket-024); pumped flow takes the station index `y`. Declared scoped reuse: security-curve fraction `p` (hydro-production-models) and pumped flow `p_{y,k}` (system pages). The policy-graphs d2 edge labels are illustrative weights, told apart by its argument from the per-child opening probability `p_{n'}(\omega)` that policy-graphs also writes: no change. | Security-curve fraction → `f^{sec}`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| Q | quarter `Q` of the duration-weighted aggregation → no page (retired, ticket-103)<br>flow `Q` in the notation ζ derivation → notation-conventions<br>turbined-flow bounds `\bar{Q}_h`, `\bar{Q}_{h,b}`, `\bar{Q}_g`, lower bounds, `Q^{ref}_{h,t}`, `[Q_{jus,lo}, Q_{jus,hi}]` → lp-formulation, notation-conventions, system-elements, hydro-production-models<br>FPHA fit flow coordinate `Q` → hydro-production-models, _hydro.notes<br>stage-LP value `Q_t` (child form `Q_{n'}` on policy-graphs) → lp-formulation, hydro-production-models, discount-rate, sddp-algorithm, cut-management, policy-graphs, risk-measures, notation-conventions, toy-single-reservoir, toy-four-reservoir<br>plotted future cost `Q(v)`, `Q'(v)` → ValueFunctionPlot, sddp-algorithm | lp-formulation, hydro-production-models, sddp-algorithm | Stage-LP value keeps `Q_t` (cut pages). Rename (§4): the plotted cost-to-go `Q(v)`, `Q'(v)` → `V(v)`, `V'(v)` (tickets 024, 028; `valueFunction.ts` comments out of cluster); the water-value sensitivity `\partial Q_t / \partial \hat{v}_h` on hydro-production-models → the slope `\beta^v_h` (shares the page with the flow coordinate `Q`, ticket-021); the unit-group bounds take `u`. The ζ-derivation `Q` goes with ticket-019. Bounds and tagged forms are distinct. | FPHA flow coordinate → `q` (the turbined-flow letter): avoids the declaration but clashes with the cell flow `q_{h,b,k}` the fit is evaluated at. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: §1.1 declares the FPHA flow coordinate with the quarter, the meaning the water-value-sensitivity rename makes page-disjoint; the `valueFunction.ts` comments are §4 row 105. ticket-065 guardian F2 (routed to ticket-074; operator delegation XD-03), 2026-10-04: system-elements writes no `Q_t`, only the turbined-flow bounds, so it leaves this meaning and the co-occurrence cell; ticket-074. XD-154 (E08 delta pass; operator delegation XD-03), 2026-10-05: the quarter `Q` is retired with no page (multi-resolution-studies writes no aggregate symbol), so the §1.1 `Q_t` line drops its quarter clause and the G1 note's '§1.1 declares the FPHA flow coordinate with the quarter' is superseded: §1.1 declares the FPHA flow coordinate alone; ticket-103. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| q | turbined flow `q_{h,k}`, `q_{h,b,k}` → lp-formulation, system-elements, hydro-production-models, notation-conventions, toy-single-reservoir, toy-four-reservoir, _hydro.notes<br>FPHA fit flow limit `q_{max}` and lateral flow `q_{lat}` → hydro-production-models<br>evaporation magnitude bound `q^{\max}_{ev,h}` → penalty-system<br>enumerated-tree conditional probability `q_{n \to n'}` → upper-bound-evaluation<br>CVaR tail weights `q^*` and a member `q` of `\mathcal{M}_\alpha(p)` → risk-measures, notation-conventions | hydro-production-models | Turbined flow keeps `q` (principle 1); tagged flow limits are distinct. Declared scoped reuse: the conditional probability `q_{n \to n'}` (upper-bound-evaluation) and the tail weights `q^*` (risk-measures, a dual probability vector) sit on pages without turbined flow; risk-measures drops its "not `q`, which denotes turbined flow" aside (principle 6, ticket-024). The per-child opening weight of the successor-opening aggregation is written `p_{n'}(\omega)` (cut-management, sddp-algorithm, policy-graphs, notation-conventions), not `q_{m,\psi}`. | Write `q_{n \to n'}` as `P(n \to n')`, the transition-probability form of the successor-opening aggregation: one edit on upper-bound-evaluation, one fewer reuse. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Note: ticket-115 introduces the tail weights `q^*` on risk-measures, which carries no turbined flow, and declares them on the §1.1 `q_{h,k}` line (ADR-046). |
| r | predecessor-occurrence count, written `n_{\text{pre}}` (n row; ticket-085) → no page<br>ring position `r_i(m)` → state-augmentation, notation-conventions<br>annual discount rate `r_{annual}` → discount-rate<br>stage discount rate `r_t` → discount-rate<br>withdrawal target `r_h` → lp-formulation, system-elements, block-formulations, notation-conventions, penalty-system<br>innovation scale `r_m` → par-inflow-model, _par.io, _par.notes | discount-rate | Distinct forms: `r_{annual}` is tagged, `r_h` and `r_m` sit on disjoint pages (system vs stochastic; declared scoped reuse), `r_i(m)` is a map of the delivery stage. The predecessor-occurrence count shares scenario-generation with `r_m`, so it is written `n_{\text{pre}}` (ticket-085). Declared scoped reuse: `r_t` on discount-rate, declared by ticket-067. | Keep `r` for the count and write the innovation scale `\varsigma_m`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: `r_i(m)` published by ticket-063. The stage discount rate `r_t` is added and the `r_h` declaration extended to it; ticket-067. XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the predecessor-occurrence count is published on scenario-generation as `n_{\text{pre}}` (n row); ticket-085. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| s | deficit cost-segment index `s` → lp-formulation, system-elements, notation-conventions, penalty-system<br>anticipated ring-slot index `s` → state-augmentation, sddp-algorithm, notation-conventions, output-format, output/policy<br>load std `s^{\text{load}}_{b,t}` → scenario-generation<br>seasonal sample std `s_m` → par-inflow-model, multi-resolution-studies, glossary, _par.io<br>spillage `s_{h,k}` (bare `s` on hydro-production-models and in the glossary term map) → lp-formulation, system-elements, hydro-production-models, notation-conventions, toy-four-reservoir, glossary<br>NCS availability std `s^{nc}_r` → system-elements, scenario-generation<br>scenario-generation tree-product dummy `s`, renamed `t'` (§4, ticket-022) and dropped with the product (ticket-090) → no page<br>discount-rate stage dummy `s`, renamed `t'` (§4, ticket-031) → no page | lp-formulation, system-elements, scenario-generation, glossary | E10 split: the segment index and the slot index share lp-formulation and system-elements until the ring mechanics move to state-augmentation (spec §6.1). Rename (§4): tree-product dummy → `t'` (ticket-022). Spillage is an indexed quantity; `s_m`, `s^{\text{load}}_{b,t}` and the proposed `s^{nc}_r` (ask-operator row) are standard-deviation forms. | Slot index → `\varsigma` now, removing the co-occurrence before E10. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10-split reuses (i, K, L, s, A, D, j on lp-formulation / system-elements) are declared scoped reuse until the E10 split makes them page-disjoint; ticket-159 (E10 verification) reconciles them. Note: until E10 the split meanings share a page, which principle 4 does not admit as a declaration, so §1.1 carries no `s` line and ticket-159 adds the split meanings once E10 makes them page-disjoint. Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: no decided §4 row covers the `Ω_s` of `_sddp.configure` (this row renames only the tree-product dummy), so it stays (§3 Out-of-cluster pages). XD-10 (ticket-031, operator delegation XD-03), 2026-10-04: the discount-rate stage dummy shares the page with the deficit segment index of `\delta_{b,k,s}`, so it is renamed `t'` (§4, ticket-031); the page's sentence that justifies the `\delta_{b,k,s}` symbol choice is routed to E08 ticket-111. ticket-074 (E05 acceptance), 2026-10-04: output-format writes the ring slot `s` in the checkpoint `subindex` row; no other meaning of `s` occurs there. XD-08 and XD-10 (tickets 023 and 031, operator delegation XD-03), 2026-10-05: discount-rate writes neither the deficit segment index (its `\delta_{b,k,s}` sentence is deleted) nor the stage dummy (its product writes `t'`), so it leaves the meanings and the co-occurrence cell; ticket-111. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; §1.1 declares the page-disjoint meanings; ticket-159. |
| t | stage index `t` → lp-formulation, system-elements, hydro-production-models, penalty-system, policy-graphs, par-inflow-model, scenario-generation, multi-resolution-studies, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, cut-management, lp-warm-start, risk-measures, upper-bound-evaluation, notation-conventions, what-cobre-solves, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir, glossary<br>policy-graph stage map `t(n)` → policy-graphs<br>historical record period `t` → par-inflow-model<br>wall-clock times `t_{max}`, `t_{elapsed}` → stopping-rules<br>decision-stage map `t_i(m)` of an anticipated delivery → lp-formulation, notation-conventions, post-study-boundary | policy-graphs, par-inflow-model, lp-formulation | One family (time indices mapped to seasons by `m(t)`; `t(n)` and `t_i(m)` are stage-valued maps); tagged wall-clock times are distinct. No rename. NOT-08 and NOT-09 (§4): 1-based stage wording and indices (tickets 020, 026). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: `t_i(m)` is a distinct stage-valued map, published by ticket-063. post-study-boundary writes the stage index `t` and `t_i(m)`; ticket-070. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the two-study coupling page leaves this row; its text is merged into post-study-boundary (R69) and ticket-109 deletes the page; ticket-105. |
| U | maximum diversion `\bar{U}_h` → lp-formulation, system-elements, notation-conventions<br>eigenvector matrix `U` → par-inflow-model, scenario-generation | none | Distinct forms on disjoint pages (`\bar{U}_h` on system pages, `U` on stochastic pages). No rename. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| u | generic-constraint cap `u_g` → lp-formulation<br>diversion flow `u_{h,k}` → lp-formulation, system-elements, notation-conventions<br>stage control vector `u_t` (the child's control `u` in `(x', u)` on policy-graphs) → horizon-modes, discount-rate, policy-graphs<br>vertex deviations `u^{\pm}` → upper-bound-evaluation | lp-formulation | Rename (§4): `u_g` → `\bar{b}_g` (ticket-020). Declared scoped reuse: control vector `u_t` (algorithm pages, SDDP.jl form) and diversion `u_{h,k}` (system pages); the vertex deviations are tagged forms on upper-bound-evaluation. The new unit-group index `u` (g row) is an index on system pages. | Control vector → `y_t`: `y` is the new pumping-station index. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| V | volume `V` in the notation ζ derivation → notation-conventions<br>storage bounds and targets `\bar{V}_h`, `\underline{V}_h`, `V^{min}_h`, `V^{max}_h`, `V^{ref}_{h,t}`, `V^{\text{target}}_t` → lp-formulation, system-elements, block-formulations, hydro-production-models, notation-conventions, toy-single-reservoir, toy-four-reservoir, penalty-system<br>FPHA fit storage coordinate `V` → hydro-production-models<br>value functions `V_t(x)`, `\underline{V}_\tau(x)`, `\bar{V}_t(x)`, `V(x, \omega)`, `\tilde{V}(n)`, `V^\star`, `V^*(\hat{x})` → cut-management, system-elements, policy-graphs, scenario-generation, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, risk-measures, notation-conventions, sddp-framework-overview, toy-single-reservoir, glossary, upper-bound-evaluation, toy-four-reservoir, ConvergencePlot | system-elements, hydro-production-models, toy-single-reservoir, toy-four-reservoir | Distinct forms, no rename: storage bounds carry a hydro index or a tag, value functions a stage or season subscript and a state argument. The FPHA coordinate `V` sits on hydro-production-models, which writes no value function once the water-value sensitivity becomes `\beta^v_h` (§4, ticket-021). The ζ-derivation `V` goes with ticket-019. The outer approximation takes `\underline{V}_t^k` in place of the hatted form (hat row). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: post-study-boundary writes the terminal condition `V_{T+1} = 0`; ticket-105. |
| v | breakpoint volume `v^{(i)}` → hydro-production-models<br>FPHA fit window `[v_{min}, v_{max}]` → hydro-production-models<br>storage `v_h`, block storage `v_{h,k}`, `v^{avg}_h`, `v^{in}_h`, `\hat{v}_h`, `v^{\text{seed}}_h` → penalty-system, lp-formulation, system-elements, block-formulations, hydro-production-models, discount-rate, sddp-algorithm, cut-management, notation-conventions, toy-single-reservoir, toy-four-reservoir, _hydro.notes, ValueFunctionPlot<br>vertex value `\bar{v}^{(i)}` → upper-bound-evaluation<br>toy-four stage storage vectors `v_t`, `\hat v_t` → toy-four-reservoir | hydro-production-models, toy-four-reservoir | Storage keeps `v`. Rename (§4): breakpoint volume → `v^{(i)}` (ticket-021); receiving-plant storage `v_i` → `v_h` (ticket-020); toy-four stage vectors → the state `x_t`, `\hat x_t` (they read as the hydro components `v_1, \ldots, v_4`, ticket-026). The vertex value is decorated and superscripted. | Toy-four stage vectors → `\mathbf{v}_t` (bold vector). | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| w | block weight `w_k` → lp-formulation, state-augmentation, block-formulations, notation-conventions<br>census weight `w_m` → upper-bound-evaluation, glossary<br>PAR(p)-A rolling-window index `w` (`A^{(w)}`, `Z^{(w)}`), which replaces the sample index `i` (§4, ticket-031) → par-inflow-model<br>lag-period share `w_{t,\mathcal{W}}` → multi-resolution-studies | none | Declared scoped reuse (system pages vs upper-bound-evaluation and the glossary; the lag-period share `w_{t,\mathcal{W}}` on multi-resolution-studies only); the census weight takes the scenario index `m` (§4, ticket-025). | Census weight → `\pi_m`: collides with the row dual. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-10 (ticket-031, operator delegation XD-03), 2026-10-04: the declared scoped reuse extends to the rolling-window index `w` of PAR(p)-A (par-inflow-model), §1.1. XD-154 (E08 delta pass; operator delegation XD-03), 2026-10-05: the declared scoped reuse extends to the lag-period share `w_{t,\mathcal{W}}` (multi-resolution-studies), §1.1; ticket-103. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| x | LP column variable `x_j`, generic-constraint term variable `x_e` → lp-formulation, lp-layout-and-scaling, cut-management<br>anticipated slots `x^{\mathrm{a}}_{s,i}`, `x^{\mathrm{a,in}}_{s,i}` and the trial value `\hat{x}^{\mathrm{a}}_{s,i}` → state-augmentation, sddp-algorithm, notation-conventions<br>state vector `x_t`, trial point `\hat{x}_{t-1}`, pinned column `x^{in}`, vertex state `x^{(i)}`, subgradient point `\tilde{x}` → policy-graphs, scenario-generation, _scenario.notes, horizon-modes, post-study-boundary, discount-rate, sddp-algorithm, cut-management, risk-measures, upper-bound-evaluation, notation-conventions, sddp-framework-overview, toy-single-reservoir, glossary, determinism-guarantees<br>stage decision vector `x_t` of the linear multistage program → sddp-algorithm, risk-measures, upper-bound-evaluation, sddp-framework-overview | cut-management, sddp-algorithm, risk-measures, upper-bound-evaluation, sddp-framework-overview | Rename (§4): the SDDP.jl stage form — state `x_t`, control `u_t`, stage cost `c_t(x_t, u_t)`, feasible set `\mathcal{X}_t(x_{t-1}, \omega_t)` — replaces the decision-vector reading of `x_t` (tickets 024, 025, 026). Everything else is one state family or a tagged LP-variable form (lp §12 to lp-layout-and-scaling in E10). Rename (§4): `x^{\mathrm{a}}_{s,i,t}` → `x^{\mathrm{a}}_{s,i}` and `\widehat{x}^{\mathrm{a}}_{s, i, t}` → `\hat{x}^{\mathrm{a}}_{s,i}` (tickets 063, 065). | Keep `x_t` as the full decision vector and write the state `s_t`: `s` is the spillage and the slot index. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the slot forms drop the stage subscript; ticket-063. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| y | pumping-station index `y \in \mathcal{P}` → lp-formulation, system-elements, equipment-formulations, notation-conventions<br>window year `y \in W` → scenario-generation<br>anticipated carrier column `y^i_t`, retired by ticket-063 → no page<br>ring slot written `y^{i}_{k}` on sddp-algorithm, renamed `x^{\mathrm{a}}_{s,i}` (x row; §4, ticket-024) | none | Rename (§4): sddp-algorithm's `y^{i}_{k}` → the registry slot `x^{\mathrm{a}}_{s,i}` (ticket-024). The carrier `y^i_t` is retired: the commitment ring has none; ticket-063. Declared scoped reuse (principle 4): the pumping-station index (System Modelling chapters, notation page) and the window year (scenario-generation) share no page. | Pumping-station index → another letter if E10 keeps `y^i_t` on the stage LP. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-51 (E05 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the carrier is retired by ticket-063. XD-60 (b, e) (operator delegation XD-03), 2026-10-04: the Recommendation drops the retired carrier's page and the ring-slot entry names its renamed form; ticket-074. XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the window year `y \in W` (scenario-generation) is declared scoped reuse with the pumping-station index (§1.1); ticket-085. |
| Z | standardised conditioning series `Z` (PAR(p)-A FACP) → par-inflow-model<br>random cost `Z` of a risk measure → risk-measures, sddp-framework-overview, glossary, CvarPlot | none | Declared scoped reuse: par-inflow-model and the risk pages share neither meaning. | Conditioning series → `\tilde{Z}`: removes the declaration. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| z | independent normal draws `z` → par-inflow-model, scenario-generation, toy-four-reservoir, glossary<br>PACF critical value `z_{0.975}` → par-inflow-model<br>inversion offset, renamed `\Delta a_{h,t}` (§4, ticket-022) → no page<br>realized-inflow column `z_h` → lp-formulation<br>bounds `\underline{z}^k`, `\bar{z}^k`, `\bar{z}_{\text{exact}}` → horizon-modes, discount-rate, sddp-algorithm, risk-measures, stopping-rules, upper-bound-evaluation, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir, ConvergencePlot, glossary | par-inflow-model, scenario-generation, toy-four-reservoir, glossary | Realized inflow keeps `z_h` (NOT-10); the bounds are decorated. Rename (§4): offset → `\Delta a_{h,t}` (shares scenario-generation with the draws, ticket-022); `z_\alpha` → `z_{0.975}` (its `\alpha` is a significance level, not the tail fraction; ticket-022). Declared scoped reuse: the draws `z` (stochastic pages) and `z_h` (lp-formulation). | Draws → `\xi`: `\xi` is the noise-adjustment slack and the proposed NCS ratio. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| Δ (`\Delta`) | source-stage duration `\Delta t` → discount-rate<br>constant head loss `\Delta h_{const}` → hydro-production-models<br>confidence half-width `\Delta_{95}` → upper-bound-evaluation, ConvergencePlot<br>lower-bound improvement `\Delta_k` → stopping-rules<br>travel time `\Delta^{tt}_{h'}` → lp-formulation, notation-conventions, system-elements | none | Distinct forms (difference operator on a symbol, or a tagged quantity) on disjoint pages. No rename; the new offset `\Delta a_{h,t}` is a difference form; the travel time is a tagged quantity, a distinct form (ticket-049). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| Λ (`\Lambda`) | eigenvalue matrix `\Lambda` and clipped root `\tilde{\Lambda}^{1/2}` → par-inflow-model, scenario-generation | none | One family, no collision. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| γ (`\gamma`) | FPHA plane coefficients `\gamma_0^m`, `\gamma_v^m`, `\gamma_q^m`, `\gamma_s^m` → lp-formulation, hydro-production-models, notation-conventions, block-formulations, penalty-system<br>storage coefficient `\gamma_v` of a storage-dependent row, split into the FPHA `\gamma_v^m` and the evaporation `\gamma^{ev}_{v,h}` on block-formulations (§4 row 132; ticket-155)<br>pumping consumption rate, renamed `\rho^{pump}_y` (ρ row; §4, tickets 020, 021)<br>autocovariance `\gamma_m(\ell)`, cross-covariance `\hat{\gamma}_{Z \otimes A}(\ell)` → par-inflow-model<br>generic-constraint coefficient `\gamma_{g,e}` → lp-formulation<br>evaporation intercept and slope `\gamma^{ev}_{0,h}`, `\gamma^{ev}_{v,h}` → lp-formulation, notation-conventions; the slope also on block-formulations and hydro-production-models §2.11 (ticket-157c) | lp-formulation, block-formulations, hydro-production-models | FPHA planes keep `\gamma` (principle 1). Rename (§4): pumping rate → `\rho^{pump}_y` (shares the system pages with the planes, tickets 020, 021); the par-inflow reference note writes the autocovariance `\gamma_m(\ell)` (ticket-022). block-formulations §2.4 wrote one `\gamma_v` for the storage coefficient of both storage-dependent rows (FPHA plane and linearized evaporation); ticket-155 split it into `\gamma_v^m` and `\gamma^{ev}_{v,h}` (§4 row 132). `\gamma_{g,e}` is indexed by constraint and term, distinct from the tagged plane coefficients. Tagged evaporation coefficients, distinct from the plane coefficients (ticket-054). | Generic-constraint coefficient → `a_{g,e}`: `a` is the inflow. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Out-of-cluster pages → existing rename tickets, no new ticket: `math/_impl/_hydro.configure.mdx`, `_par.configure.mdx`, `_penalties.io.mdx`, `_sddp.configure.mdx` and `reference/output-format.mdx` (the `intercept` row formula) join ticket-027; the comments in `src/figures/valueFunction.ts` and the test titles in `src/figures/cvar.test.ts` join ticket-028 (comments/titles only, no compute change). Rule for both: rename a prose math form only where a decided §4 row covers it; never rename a literal identifier (config key, column, field or file name such as `alpha_FPHA` if it is a literal at the tag — verify at `v0.17.0`). Note: no decided §4 row covers the `γ_V` of `_hydro.configure` (this row keeps `\gamma_v` with no rename), so it stays; the code-formatted `gamma_v` there is the literal `fpha_hyperplanes.parquet` column (§3 Out-of-cluster pages). XD-56 (ticket-062 guardian observation 1; operator delegation XD-03), 2026-10-04: the pumping consumption rate is listed under its renamed form `\rho^{pump}_y` on the ρ row; ticket-074. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| δ (`\delta`) | occurrence-year offsets `\delta_t`, `\delta^{(\ell)}` → scenario-generation<br>cyclic convergence tolerance `\delta_{\text{cycle}}` → horizon-modes<br>plane-difference measure `\delta` → hydro-production-models<br>load deficit `\delta_{b,k,s}` → lp-formulation, system-elements, notation-conventions, toy-single-reservoir, toy-four-reservoir, penalty-system | none | Deficit keeps `\delta` (principle 1). Distinct forms: `\delta_{\text{cycle}}` is tagged; the plane-difference `\delta` (hydro-production-models) and the offsets `\delta_t`, `\delta^{(\ell)}` (scenario-generation) sit on pages without the deficit (declared scoped reuse). | Cyclic tolerance → `\varepsilon_{\text{cycle}}`, joining the tolerance family. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Note: the occurrence-year offset `\delta_t` is planned (ticket-085); §1.1 declares the current meanings and ticket-085 adds `\delta_t` when it introduces it (ADR-046). XD-50 (E07 refinement, approved with its report, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: the offsets `\delta_t` and `\delta^{(\ell)}` are published on scenario-generation and declared in §1.1; ticket-085. XD-10 (ticket-031, operator delegation XD-03), 2026-10-05: discount-rate's sentence justifying the `\delta_{b,k,s}` symbol is deleted, so the page writes no load deficit; ticket-111. |
| ε (`\varepsilon`) | innovations `\varepsilon_t`, `\varepsilon_h^{adj}`, `\varepsilon^{\text{load}}_{b,t}` → scenario-generation, lp-formulation, block-formulations, inflow-nonnegativity, par-inflow-model, multi-resolution-studies, notation-conventions, toy-single-reservoir, toy-four-reservoir, glossary<br>FPHA plane-merge tolerance `\varepsilon` → hydro-production-models<br>DCS violation tolerance `\varepsilon_{\text{viol}}` → cut-management<br>fitted residual `\tilde{\varepsilon}_{h,t}` → par-inflow-model | none | Innovations keep `\varepsilon` with entity, time or tag subscripts; tolerances take a text tag (`\varepsilon_{\text{viol}}`, and the new `\varepsilon_{\text{stall}}`, `\varepsilon_{\text{abs}}`, `\varepsilon_{\text{rel}}` of ticket-025). Declared scoped reuse: the bare merge tolerance on hydro-production-models (no innovation there). | Merge tolerance → `\varepsilon_{\text{merge}}`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| ζ (`\zeta`) | stage conversion `\zeta` and per-block `\zeta_k` → lp-formulation, state-augmentation, block-formulations, notation-conventions, toy-single-reservoir, toy-four-reservoir, equipment-formulations, inflow-nonnegativity | none | One family. The closed-form filling floor of lp-formulation §8 sums `\zeta_{t'}\,\text{rate}_{t'}` over later stages `t' > t`, with stage dummy `t'`, not `\tau` (block duration). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. E10 acceptance (XD-235, XD-256, XD-286, XD-291, XD-293; operator delegation XD-03), 2026-10-06: the meanings' page lists and the co-occurrence cell are re-derived on the E10-complete tree, with state-augmentation and lp-layout-and-scaling written in and the glyphs system-elements no longer writes written out; ticket-159. |
| η (`\eta`) | turbine efficiency `\eta_h` → hydro-production-models<br>line efficiency `\eta_\ell` → equipment-formulations, notation-conventions<br>CVaR threshold variable `\eta` → risk-measures, sddp-framework-overview<br>UNRESOLVED NCS `\eta` and coefficient-range `\eta` (own ask-operator rows) → system-elements | none | Efficiencies are one family indexed by entity (the line efficiency takes the line index, `\eta_n`). Declared scoped reuse: the CVaR threshold `\eta` (risk-measures, sddp-framework-overview) shares no page with the efficiencies. | CVaR threshold → `\zeta` (Rockafellar-Uryasev also use it): collides with the flow-to-volume conversion. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| θ (`\theta`) | FPHA plane-normal angle `\theta` → hydro-production-models<br>future-cost variables `\theta`, `\theta'`, `\theta_n`, `\bar{\theta}` → lp-formulation, post-study-boundary, discount-rate, sddp-algorithm, cut-management, policy-graphs, risk-measures, upper-bound-evaluation, notation-conventions, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir, glossary<br>multi-cut `\theta_\omega` → no page (retired, ticket-123) | none | The future-cost family keeps `\theta` (NOT-01: `\theta_t` approximates `V_{t+1}(x_t)`, §4 tickets 025, 018). Declared scoped reuse: the plane-normal angle (hydro-production-models only). | Angle → `\varphi`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| κ (`\kappa`) | volume-to-energy conversion `\kappa` → penalty-system<br>intercept-only correction factor `\kappa` → hydro-production-models<br>NCS curtailment `\kappa_{r,k}` → system-elements, equipment-formulations | none | Curtailment keeps `\kappa_{r,k}` (system pages). Declared scoped reuse: the correction factor (hydro-production-models) and the volume-to-energy conversion (penalty-system) share no page. | Planned conversion → `\zeta^{E}`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Note: ticket-075 publishes the volume-to-energy conversion and extends the §1.1 line. |
| μ (`\mu`) | seasonal means `\mu_m`, `\mu^A_m`, load mean `\mu^{\text{load}}_{b,t}` → scenario-generation, par-inflow-model, multi-resolution-studies, notation-conventions, toy-single-reservoir, toy-four-reservoir, glossary, _par.io<br>risk-adjusted probabilities `\mu`, `\mu^*`, cap `\bar{\mu}_\omega` → risk-measures, CvarWeightsPlot, notation-conventions<br>UNRESOLVED NCS `\mu` (own ask-operator row) → system-elements | none | Declared scoped reuse: means on the stochastic and system pages, risk-adjusted probabilities on risk-measures (literature convention). The NCS mean takes the tagged `\mu^{nc}_r` (ask-operator row). | Risk-adjusted probabilities → `\nu`: `\nu` is the travel-time share. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Note: the §1.1 line names the risk-adjusted `\mu` only; the notation page carries `\mu^*` (ADR-046). |
| ν (`\nu`) | travel-time shares `\nu_{h',t,0}`, `\nu^{k' \to k}_{h',t}` → lp-formulation, notation-conventions, system-elements | none | One family. Planned (HYD-11, tickets 049 and 056): write the within-stage share with block indices and the upstream hydro, `\nu^{k' \to k}_{h',t}` (`j` is the thermal index, `i` the cut index). ticket-049 publishes `\nu_{h',t,0}` and `\nu^{k' \to k}_{h',t}`. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| ξ (`\xi`) | noise-adjustment slack `\xi_h` → inflow-nonnegativity<br>sddp-algorithm d2 opening labels `ξ₁`, `ξ₂`, `ξ₃` → sddp-algorithm<br>NCS availability ratio `\xi_r` → system-elements, equipment-formulations, notation-conventions, scenario-generation | none | Rename (§4): the d2 opening labels → `ω⁽¹⁾`, `ω⁽²⁾`, `ω⁽³⁾` (ticket-024). Declared scoped reuse: the noise-adjustment slack `\xi_h` (inflow-nonnegativity) and the NCS availability ratio `\xi_r` (system pages and scenario-generation). | NCS ratio → `\upsilon_r` to keep `\xi` single. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Sanctioned edits the rename tickets would otherwise avoid: the hydro-production-models §2.6.3 heading rename (α_FPHA → k_FPHA; no inbound anchor links — ticket-021 re-checks with check:links); the d2 label renames in §4 rows 1, 2, 17, 51, 62 (inside d2 fences only, labels only). Note: ticket-079 publishes the notation entry and the §1.1 declaration. |
| χ (`\chi`) | curtailable flag `\chi_r` → system-elements<br>contract dispatch `\chi_{c,k}` → lp-formulation, system-elements, equipment-formulations, notation-conventions | system-elements | Rename (§4): the flag → `\chi^{curt}_r` (both on system-elements, ticket-020). | Flag as a set membership `r \in \mathcal{R}^{curt}`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| ω (`\omega`) | opening `\omega \in \Omega_t` → policy-graphs, scenario-generation, horizon-modes, discount-rate, sddp-algorithm, cut-management, risk-measures, upper-bound-evaluation, determinism-guarantees, notation-conventions, sddp-framework-overview, toy-single-reservoir, toy-four-reservoir, glossary<br>successor-opening pairs `(n', \omega)`, `n'` a child node → policy-graphs, cut-management, sddp-algorithm | sddp-algorithm, cut-management | The opening is always `\omega`; the successor-opening pairs are `(n', \omega)`, `n'` a child node (policy-graphs, cut-management, sddp-algorithm). | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| ϵ (`\epsilon`) | excess generation `\epsilon_{b,k}` (lunate epsilon) → lp-formulation, system-elements, notation-conventions, penalty-system<br>cut-activity tolerance `\epsilon` → cut-management | none | Declared scoped reuse of `\epsilon`: excess generation on the system pages, cut-activity tolerance on cut-management. The tolerances otherwise take the `\varepsilon` family with a text tag (stopping-rules, §4 ticket-025). | Cut-activity tolerance → `\varepsilon_{\text{act}}`, matching `\varepsilon_{\text{viol}}` on the same page. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝒞 (`\mathcal{C}`) | contract sets `\mathcal{C}`, `\mathcal{C}^{imp}`, `\mathcal{C}^{exp}`, per-bus subsets → lp-formulation, system-elements, equipment-formulations, notation-conventions<br>season stage set `\mathcal{C}_\tau` → horizon-modes | none | Declared scoped reuse: contract sets on the system pages, the season stage set on horizon-modes. | Season stage set → `\mathcal{S}_\tau`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝒦 (`\mathcal{K}`) | block set `\mathcal{K}` → lp-formulation, system-elements, equipment-formulations, block-formulations, hydro-production-models, inflow-nonnegativity, scenario-generation, notation-conventions<br>season cut-index set `\mathcal{K}_\tau`, renamed `\mathcal{I}_\tau` (§4, ticket-022) → no page | none | Rename (§4): the season cut-index set → `\mathcal{I}_\tau` with cut index `i` (ticket-022), so `\mathcal{K}` is the block set only. | Keep `\mathcal{K}_\tau` by declared scoped reuse (horizon-modes has no blocks). | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-87 and XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: horizon-modes writes the season cut-index set as `\mathcal{I}_\tau`, so the `\mathcal{K}_\tau` meaning has no page; ticket-110. |
| 𝒫 (`\mathcal{P}`) | pumping-station set `\mathcal{P}`, `\mathcal{P}_b` → lp-formulation, system-elements, equipment-formulations, notation-conventions<br>probability simplex `\mathcal{P}` → risk-measures | none | Declared scoped reuse: pumping stations on the system pages, the simplex on risk-measures. | Simplex → `\Delta_\Omega`: `\Delta` carries four difference forms. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝒯 (`\mathcal{T}`) | thermal set `\mathcal{T}` and per-bus subset `\mathcal{T}_b` → lp-formulation, system-elements, equipment-formulations, notation-conventions | none | One family, no collision. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝒰 (`\mathcal{U}`) | upstream set `\mathcal{U}_h` → lp-formulation, system-elements, notation-conventions, toy-four-reservoir<br>PreFilling routing set `\mathcal{U}^{pre}_h(t)` → lp-formulation | lp-formulation | Distinct tagged forms: the `pre` superscript and the stage argument tell the PreFilling routing set from the upstream set (collision criterion). | Write the routing set `P_h(t)`: it would equal the AR-order form (P row). | XD-34 (E04 refinement approval, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-04: accept the Recommendation (the form G1 decided, P row); ticket-056 publishes `\mathcal{U}^{pre}_h(t)`. |
| 𝓑 (`\mathcal{B}`) | bus set `\mathcal{B}` and cell buses `\mathcal{B}_h` → lp-formulation, system-elements, scenario-generation, notation-conventions, toy-four-reservoir, hydro-production-models | none | One family, no collision. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝓗 (`\mathcal{H}`) | hydro set and tagged subsets `\mathcal{H}^{op}`, `\mathcal{H}^{fill}`, `\mathcal{H}^{fpha}`, `\mathcal{H}^{const}`, `\mathcal{H}_b` → lp-formulation, system-elements, block-formulations, hydro-production-models, penalty-system, inflow-nonnegativity, par-inflow-model, scenario-generation, multi-resolution-studies, discount-rate, sddp-algorithm, cut-management, risk-measures, notation-conventions, toy-four-reservoir | none | One family, no collision. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: the two-study coupling page leaves this row; its text is merged into post-study-boundary (R69) and ticket-109 deletes the page; ticket-105. |
| 𝓜 (`\mathcal{M}`) | FPHA plane set `\mathcal{M}_h` → lp-formulation, hydro-production-models, notation-conventions<br>risk sets `\mathcal{M}(p)`, `\mathcal{M}_\alpha(p)`, `\mathcal{M}^{EAVaR}(p)` → risk-measures | none | Declared scoped reuse: plane set on the system pages, risk sets on risk-measures (literature convention). | Risk sets → `\mathfrak{M}`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝓡 (`\mathcal{R}`) | NCS set `\mathcal{R}`, `\mathcal{R}_b` → lp-formulation, system-elements, equipment-formulations, notation-conventions | none | One family per set (the per-bus subset), no collision. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
| 𝒳 (`\mathcal{X}`) | stage feasible set `\mathcal{X}_t(x_{t-1}, \omega_t)` (written `\mathcal{X}_t(\omega_t)` with the incoming state fixed; season-indexed `\mathcal{X}_\tau(x, \omega_\tau)` on horizon-modes; child form `\mathcal{X}_{n'}(x, \omega)` on policy-graphs) → horizon-modes, discount-rate, policy-graphs, sddp-algorithm, risk-measures, notation-conventions, sddp-framework-overview<br>feasible state set of the cut-validity statement `\mathcal{X}_t` → cut-management | none | Declared scoped reuse (principle 4): the stage feasible set on the algorithm pages and the cut-validity feasible state set on cut-management share no page. | No alternative needed. | XD-10 (ticket-031, operator delegation XD-03), 2026-10-04: declare (§1.1); E09 ticket-120 (cut-validity condition) may reword the cut-management statement, and the verification ticket after it drops the declaration if so. XD-87 and XD-154 (E08 refinement and delta pass, `design/execution-decisions.md`; operator delegation XD-03), 2026-10-05: horizon-modes writes the season-indexed stage feasible set `\mathcal{X}_\tau(x, \omega_\tau)` in its one-stage operator and no other `\mathcal{X}`, so it joins the stage-feasible-set meaning and no collision arises; ticket-110. XD-205 and XD-209 (E09; operator delegation XD-03), 2026-10-06: the policy-graph forms of ticket-122 join their meanings' page lists, and the meanings ticket-123 removed from sddp-algorithm are retired with no page; ticket-139. |
| `\text{gap}` | absolute gap `\text{gap}` → stopping-rules, upper-bound-evaluation, ConvergencePlot<br>relative gap `\text{gap}^k` → stopping-rules, upper-bound-evaluation | stopping-rules, upper-bound-evaluation | One definition owner (NOT-07, ticket-029 defines it; ticket-030 repoints the overview and toys): `\text{gap}^k`, the signed and unclamped upper bound minus lower bound, whose percent form has no symbol of its own, defined there. No §4 row here. | No alternative needed. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. Reconciled (ticket-031, XP-09 and XD-11 1A), 2026-10-04: the owner writes the gap at iteration `k` as `\text{gap}^k = \bar{z}^k - \underline{z}^k`, signed and unclamped (the gap stopping rule clamps it in its comparison only, `crates/cobre-sddp/src/convergence/stopping_rule.rs:263` at v0.17.0, and the monitor's reported gap is unclamped, `convergence/convergence.rs:96`), and its percent form is an expression of `\text{gap}^k` with no symbol of its own; §2 keeps one gap row (`\text{gap}^k`), the relative-gap row is removed, and the notation page carries the one `\text{gap}^k` row. |
| `\text{tolerance}` | bound-stalling tolerance → stopping-rules<br>absolute gap tolerance → stopping-rules<br>relative gap tolerance `\text{relative tolerance}` → stopping-rules | stopping-rules | Rename (§4): `\varepsilon_{\text{stall}}`, `\varepsilon_{\text{abs}}`, `\varepsilon_{\text{rel}}` (both meanings share stopping-rules, ticket-025); the backticked config keys stay. | Text forms `\text{tol}_{\text{stall}}`, `\text{tol}_{\text{abs}}`, `\text{tol}_{\text{rel}}`. | G1 (XD-04, operator delegation XD-03), 2026-10-04: Every §3 row: accept the Recommendation (column "Recommendation"), not the Alternative. |
<!-- prettier-ignore-end -->

### Out-of-cluster pages

Pages outside the rename-ticket cluster table (ticket-015 Requirement 3) that carry a form this table recommends
changing. G1 folded them into the existing rename tickets (XD-04 decision 5): the four partials and
`reference/output-format.mdx` join ticket-027, the two `src/figures` files join ticket-028. A form has a §4 row only
where a decided rename covers it and it is no literal identifier (config key, column, field or file name) at cobre
v0.17.0, read at the tag:

- `math/_impl/_hydro.configure.mdx` — writes the FPHA fit-correction factor as `$k_{FPHA}$` (line 161), the form
  that replaces `alpha_FPHA` (α row; §4 row 102). At v0.17.0 `alpha_FPHA` is no config key, column, field or file
  name: it occurs only in function names (`compute_alpha_fpha`, `crates/cobre-sddp/src/production/fpha_fitting/alpha.rs:38`)
  and in the fit-error message (`crates/cobre-sddp/src/production/fpha_fitting/error.rs:210-211`). The code-formatted
  `gamma_v` (lines 147, 166, 173, 323) is the literal `fpha_hyperplanes.parquet` column
  (`crates/cobre-io/src/extensions/fpha_hyperplanes.rs:138`) and stays; the partial writes no `γ_V`.
- `math/_impl/_par.configure.mdx` — line 35 writes the standardised annual coefficient of the fitted triple as `ψ` →
  `$\psi^{A*}_m$` (ψ row; §4 row 103); the stored `annual_coefficient` is the dimensionless standardised
  coefficient (`crates/cobre-io/src/scenarios/annual_component.rs:14`). The words "annual mean" and "annual std" are
  no math form and stay.
- `math/_impl/_penalties.io.mdx` — line 34 writes the generic-constraint slacks as `s⁺−s⁻` and `s⁺+s⁻`: no decided
  §4 row covers them (the σ row renames only `\sigma_{h,b}` and the glossary `\sigma_m`), so they stay;
  `reference/generic-constraints.mdx` writes the same `s⁺` and `s⁻`.
- `math/_impl/_sddp.configure.mdx` — line 36 writes the opening set as `Ω_s`: no decided §4 row covers it (the s row
  renames only the tree-product dummy), so it stays; `running/configuration.mdx` line 276 writes the same form.
- `reference/output-format.mdx` — line 824 describes the stored `intercept` as `alpha - beta' * x_hat` →
  `$\beta_0 = \bar{Q}_t - \beta^\top \hat{x}_{t-1}$` (α and β rows; §4 row 104); the field names `intercept` and
  `coefficients` are literals and stay. At v0.17.0 each opening's intercept is its objective minus the subgradient
  dotted with the trial state (`crates/cobre-sddp/src/training/backward/outcome_aggregation.rs:142`).
- `src/figures/valueFunction.ts` — comments at lines 5 and 21 name the plotted function `Q(v)` and `Q'(v)` → `V(v)`,
  `V'(v)` (Q row; §4 row 105); the identifiers `Q`, `dQ` and the field `q` are code and stay.
- `src/figures/cvar.test.ts` — the test title at line 29 and the assertion message at line 36 write `E[C]` → `E[Z]`
  (C row; §4 row 106); no assertion, computation or exported name changes.

## 4. Rename map

One row per decided change, grouped by rename ticket (020 … 028, then 018 for the notation page, which
tickets 017-019 rewrite). Old and new forms are LaTeX or label source fragments, paired by position and separated by
line breaks; apply the rows of a ticket in table order, each row's pairs in the listed order, each pair to every
occurrence on the row's pages. `(removed)` deletes the fragment. A pair marked as a d2 label in the concept sits inside
a d2 fence. `&#124;` in a cell stands for a literal `|`. G1 (ticket-016, 2026-10-04) set every row's Status to `decided`;
rows 102-106, the out-of-cluster forms G1 folded into tickets 027 and 028 (§3 Out-of-cluster pages), follow the
018 rows. Rows 107-119, which ticket-031 reconciled, follow them: the ticket-020 and ticket-023 edge cases
(XD-06, XD-08) and the ticket-031 renames and re-applications (XD-10, XD-11). Rows 120-121 follow them:
ticket-051's stage-level withdrawal target and withdrawal slack pair of system-elements, the only rows an E04 ticket
added. Rows 122-124 follow them: ticket-063's anticipated hold-ring forms (the outgoing slot, its trial value and
the ring size `k_{max}`), which tickets 064 and 065 complete on their pages. Rows 125-131 follow them, the E06 rows:
ticket-075's signed evaporation `e_h` on penalty-system (125); ticket-078's one-rate thermal cost, one thermal
generation column and removed segment capacity (126-128); ticket-079's non-controllable block cap `A_{r,k}` (129);
ticket-080's turbined cost `c^{tc}_h` (130); and ticket-081's hydro-indexed inflow penalty `c^{inf}_h` (131).
Row 132 follows them: ticket-155's split of the block-formulations storage coefficient `\gamma_v` into the FPHA
`\gamma_v^m` and the evaporation `\gamma^{ev}_{v,h}`. Row 133 follows it: ticket-159's fit constant of
hydro-production-models §2, written `9.81\,\eta_h/1000` where the page wrote `\rho_{esp}` for it, so `\rho_{esp}`
names only the authored specific productivity (C2 = A, XD-330).

<!-- prettier-ignore-start -->
| Old form | New form | Concept | Pages | Rename ticket | Status |
| --- | --- | --- | --- | --- | --- |
| `\pi^v_{i,h}`<br>`\pi^{lag}_{i,h,\ell}`<br>`\pi^{lag}_{h,\ell}`<br>`\pi^v_h`<br>`\pi^{b}_{i,d}`<br>`\pi_j^{original}`<br>`reduced costs → π"` | `\beta^v_{i,h}`<br>`\beta^{lag}_{i,h,\ell}`<br>`\beta^{lag}_{h,\ell}`<br>`\beta^v_h`<br>`\beta^{b}_{h,d}`<br>`\beta_j^{original}`<br>`reduced costs → β"` | Cut slope (state cut coefficients): β replaces π (principle 5); the bucket slope takes the receiving-plant index h; the last pair is the d2 layout-diagram label | math/lp-formulation.md, math/block-formulations.mdx | ticket-020 | decided |
| `\alpha_i`<br>`\alpha_{scaled}`<br>`θ ≥ α + πᵀx` | `\beta_{0,i}`<br>`\beta_0^{scaled}`<br>`θ ≥ β₀ + βᵀx` | Stored cut intercept: β_0 replaces the cut intercept α (α is the CVaR tail fraction); d2 cut label in the same form | math/lp-formulation.md | ticket-020 | decided |
| `For each plant $i \in \{0, \ldots, A - 1\}$`<br>`at $t = 0$, the committed MW rate`<br>`every stage $t \in [0, T - 1]$`<br>`\sum_{b = 0}^{B - 1} h_b \cdot g_{i, b, t}`<br>`where $h_b$ is the block-$b$ duration and $H_t = \sum_b h_b$`<br>`at $t < K_i$`<br>`From $t \geq K_i$ onward`<br>`(i.e., $t + K_i < T$)`<br>`\sum_{i = 0}^{A - 1} c_i(t + K_i)`<br>`\sum_b c_i(t) \cdot h_b \cdot d^{\mathrm{NPV}}_t \cdot g_{i, b, t}` | `For each plant $i \in \{1, \ldots, A\}$`<br>`at $t = 1$, the committed MW rate`<br>`every stage $t \in \{1, \ldots, T\}$`<br>`\sum_{k \in \mathcal{K}} \tau_k \cdot g_{i,k}`<br>`where $\tau_k$ is the block-$k$ duration and $H_t = \sum_{k \in \mathcal{K}} \tau_k$`<br>`at $t \leq K_i$`<br>`From $t > K_i$ onward`<br>`(i.e., $t + K_i \leq T$)`<br>`\sum_{i = 1}^{A} c_i(t + K_i)`<br>`\sum_{k \in \mathcal{K}} c_i(t) \cdot \tau_k \cdot d_{1 \to t} \cdot g_{i,k}` | NOT-09: 1-based stage index t, block index k, block duration τ_k and block set 𝒦 in the anticipated-thermal section (lp §5c); the anticipated generation is g_{i,k}; the delivery-stage discount follows the d_{1→t} row | math/lp-formulation.md | ticket-020 | decided |
| `& t + K_i < T \\`<br>`& t + K_i \geq T \quad`<br>`The horizon predicate $t + K_i < T$`<br>`every stage $t \in [0, T - 1]$`<br>`\sum_{b} h_b \cdot g_{i,b,t}`<br>`where $h_b$ is the duration of block $b$ and $H_t = \sum_b h_b$`<br>`stages $0, \ldots, K_i - 1$`<br>`every stage from $0$ to $K_i - 1$`<br>`From stage $K_i$ onward` | `& t + K_i \leq T \\`<br>`& t + K_i > T \quad`<br>`The horizon predicate $t + K_i \leq T$`<br>`every stage $t \in \{1, \ldots, T\}$`<br>`\sum_{k \in \mathcal{K}} \tau_k \cdot g_{i,k}`<br>`where $\tau_k$ is the duration of block $k$ and $H_t = \sum_{k \in \mathcal{K}} \tau_k$`<br>`stages $1, \ldots, K_i$`<br>`every stage from $1$ to $K_i$`<br>`From stage $K_i + 1$ onward` | NOT-09: 1-based stage index t, block index k and block duration τ_k in the anticipated-thermal section (system-elements §4, lines 300-329: horizon predicate, fishing row, pre-horizon seed) | math/system-elements.mdx | ticket-020 | decided |
| `The incremental inflow $a_h$ is determined by the PAR(p) autoregressive model:`<br>`a_h = \underbrace{\left( \mu_t - \sum_{\ell=1}^{P_h} \psi_\ell \mu_{t-\ell} \right)}_{\text{deterministic base}}`<br>`\underbrace{\sum_{\ell=1}^{P_h} \psi_\ell \cdot a_{h,\ell}}_{\text{lag contribution}}`<br>`\underbrace{\sigma_t \cdot \varepsilon_t}_{\text{stochastic innovation}}`<br>`each lag $\ell \in \{0, \ldots, L-1\}$`<br>`($\psi_\ell = 0$ for $\ell > P_h$)` | `The realized inflow $z_h$ is determined by the PAR(p) autoregressive model:`<br>`z_h = \underbrace{b_{h,m(t)}}_{\text{deterministic base}}`<br>`\underbrace{\sum_{\ell=1}^{P_h} \psi_{m(t),\ell} \cdot a_{h,\ell}}_{\text{lag contribution}}`<br>`\underbrace{\sigma_{m(t)} \cdot \varepsilon_t}_{\text{stochastic innovation}}`<br>`each lag $\ell \in \{1, \ldots, P^{\max}\}$`<br>`($\psi_{m(t),\ell} = 0$ for $\ell > P_h$)` | NOT-10: one PAR form b_{h,m(t)}, ψ_{m(t),ℓ}, σ_{m(t)} and one realized-inflow variable z_h in the lp §5 display; 1-based lags in §5a (lag range bounded by P^{max}, see the max-AR-order row) | math/lp-formulation.md | ticket-020 | decided |
| `a_h = \underbrace{\mu_m - \sum_{\ell=1}^{p} \psi_{m,\ell} \mu_{m-\ell}}_{\text{deterministic base}}`<br>`\text{deterministic\_base}` | `a_h = \underbrace{b_{h,m}}_{\text{deterministic base}}`<br>`b_{h,m}` | NOT-10: one PAR form — the deterministic base written b_{h,m} (the registry b_{h,m(t)} at season m) instead of its expansion and of the text name | math/inflow-nonnegativity.md | ticket-020 | decided |
| `\sum_{l \in \mathcal{L}}`<br>`\sum_{l: \text{target}=b}`<br>`\sum_{l: \text{source}=b}`<br>`f^+_{l,k}`<br>`f^-_{l,k}`<br>`c^{exch}_\ell`<br>`c^{exch}_l`<br>`\bar{F}^+_l`<br>`\bar{F}^-_l`<br>`line $l$` | `\sum_{n \in \mathcal{L}}`<br>`\sum_{n: \text{target}=b}`<br>`\sum_{n: \text{source}=b}`<br>`f^+_{n,k}`<br>`f^-_{n,k}`<br>`c^{exch}_n`<br>`c^{exch}_n`<br>`\bar{F}^+_n`<br>`\bar{F}^-_n`<br>`line $n$` | Transmission-line index: n replaces l and ℓ (ℓ is the AR lag) | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `\sigma_{h,b}` | `\lambda_{h,b}` | FPHA cell apportionment share: λ_{h,b} replaces σ_{h,b} (σ_m is the innovation standard deviation) | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `receiving (downstream) plant $i$`<br>`destined for $i$`<br>`L_i`<br>`The bucket $b_{i,d}$`<br>`feeding $i$`<br>`into plant $i$`<br>`arc into $i$`<br>`\sum_i L_i`<br>`\underline{b}^{\,\mathrm{in}}_{i,d}`<br>`\bar{b}^{\,\mathrm{in}}_{i,d}`<br>`\hat{b}_{i,d}`<br>`b^{\mathrm{in}}_{i,1}`<br>`receiving plant $i$`<br>`v_i - v^{\mathrm{in}}_i`<br>`\phi_{i,k}`<br>`b^{\mathrm{out}}_{i,d}`<br>`b^{\mathrm{in}}_{i,d+1}`<br>`\bar{c}^{\,b}_{i,d}`<br>`d^{col}_{i,d}` | `receiving (downstream) plant $h$`<br>`destined for $h$`<br>`L_h`<br>`The bucket $b^{\mathrm{out}}_{h,d}$`<br>`feeding $h$`<br>`into plant $h$`<br>`arc into $h$`<br>`\sum_h L_h`<br>`\underline{b}^{\,\mathrm{in}}_{h,d}`<br>`\bar{b}^{\,\mathrm{in}}_{h,d}`<br>`\hat{b}_{h,d}`<br>`b^{\mathrm{in}}_{h,1}`<br>`receiving plant $h$`<br>`v_h - v^{\mathrm{in}}_h`<br>`\phi_{h,k}`<br>`b^{\mathrm{out}}_{h,d}`<br>`b^{\mathrm{in}}_{h,d+1}`<br>`\bar{c}^{\,b}_{h,d}`<br>`d^{col}_{h,d}` | Receiving (downstream) plant of an in-transit bucket: hydro index h replaces i; the untagged bucket b_{i,d} is the outgoing bucket b^{out}_{h,d} | math/lp-formulation.md | ticket-020 | decided |
| `\sum_{i \in \mathcal{U}_h} (q_{i,k} + s_{i,k} + u_{i,k})`<br>`\sum_{i: \text{div}=h} u_{i,k}`<br>`\sum_{i \in \mathcal{U}_h}(q_i + s_i + u_i)`<br>`\sum_{i:\text{div}=h} u_i` | `\sum_{h' \in \mathcal{U}_h} (q_{h',k} + s_{h',k} + u_{h',k})`<br>`\sum_{h': \text{div}=h} u_{h',k}`<br>`\sum_{h' \in \mathcal{U}_h}(q_{h'} + s_{h'} + u_{h'})`<br>`\sum_{h':\text{div}=h} u_{h'}` | Upstream and diverting plants of hydro h: primed hydro index h' replaces i (i is the cut index) | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `$N(1+L)$`<br>`$L$ = maximum AR order,`<br>`$L = 2$`<br>`$N(1 + L) = 9$`<br>`$L$ = maximum AR order across all hydros`<br>`$N \times L$`<br>`$L$ is the system-wide maximum lag`<br>`store $L$ lags`<br>`$P_h < L$`<br>`N(1 + L) + B + A \, K_{\max}` | `$N(1+P^{\max})$`<br>`$P^{\max}$ = maximum AR order,`<br>`$P^{\max} = 2$`<br>`$N(1 + P^{\max}) = 9$`<br>`$P^{\max}$ = maximum AR order across all hydros`<br>`$N \times P^{\max}$`<br>`$P^{\max}$ is the system-wide maximum lag`<br>`store $P^{\max}$ lags`<br>`$P_h < P^{\max}$`<br>`N(1 + P^{\max}) + B + A \, K_{\max}` | Maximum AR order across hydros (uniform lag storage): P^{max} = max_h P_h replaces L (L is the last filling stage, L_h the bucket depth) | math/lp-formulation.md | ticket-020 | decided |
| `$K = K_{\max} = \max_i K_i$`<br>`$K A$`<br>`\{0, \ldots, K - 1\}`<br>`$K \geq 1$`<br>`$t + K$` | `$K_{\max} = \max_i K_i$`<br>`$K_{\max} A$`<br>`\{0, \ldots, K_{\max} - 1\}`<br>`$K_i \geq 1$`<br>`$t + K_i$` | Ring depth reserved per plant written K_{max} (bare K is the cost-scale factor); per-plant lead written K_i | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `\sum_{h \in \mathcal{H}} T \cdot \bigl(`<br>`$T = \sum_k \tau_k$`<br>`stage hours $T$`<br>`\sigma^{inf}_h \cdot T`<br>`\xi_h \cdot T` | `\sum_{h \in \mathcal{H}} H_t \cdot \bigl(`<br>`$H_t = \sum_k \tau_k$`<br>`stage hours $H_t$`<br>`\sigma^{inf}_h \cdot H_t`<br>`\xi_h \cdot H_t` | Total stage hours: H_t replaces T (T is the horizon) | math/lp-formulation.md, math/inflow-nonnegativity.md | ticket-020 | decided |
| `d^{\mathrm{NPV}}_{t + K_i}` | `d_{1 \to t + K_i}` | Cumulative discount factor: d_{1→t} (the discount-rate form) replaces d^{NPV}_t | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `d^i_{t - K_i}`<br>`d^i_{t}`<br>`d^i_t`<br>`d^i` | `g^{\mathrm{a}}_{i,t - K_i}`<br>`g^{\mathrm{a}}_{i,t}`<br>`g^{\mathrm{a}}_{i,t}`<br>`g^{\mathrm{a}}_i` | Anticipated commitment decided at stage t: g^{a}_{i,t} replaces d^i_t (d is the discount factor); apply the longer forms first | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `\alpha = \mathrm{clamp}(\mu + \sigma \cdot \eta,\,0,\,1)`<br>`$\eta \approx 0.95$–$1.0$, ` | `\xi_r = \mathrm{clamp}(\mu^{nc}_r + s^{nc}_r \cdot \varepsilon^{nc}_r,\,0,\,1)`<br>(removed) | NCS availability ratio and its stochastic model (the four §3 ask-operator rows, which G1 resolved to the code-derived alternative): ξ_r = clamp(μ^{nc}_r + s^{nc}_r ε^{nc}_r, 0, 1), as the tag computes it (noise.rs:366-370 at v0.17.0); the stray η magnitude clause, the line efficiency, which never enters the LP, is removed | math/system-elements.mdx | ticket-020 | decided |
| `` demand draw (`d`) ``<br>`` `d` demand ``<br>`"Demand d"`<br>`-> demand1: "d"`<br>`-> demand2: "d"` | `` demand draw (`D`) ``<br>`` `D` demand ``<br>`"Demand D"`<br>`-> demand1: "D"`<br>`-> demand2: "D"` | Load demand label in the system d2 diagram and caption: D (the registry load symbol) replaces d | math/system-elements.mdx | ticket-020 | decided |
| `\sum_{j \in \mathcal{P}_b} \gamma_j p_{j,k}`<br>`\sum_{j: \text{dest}=h} p_{j,k}`<br>`\sum_{j: \text{src}=h} p_{j,k}`<br>`\gamma_j`<br>`p_{j,k}`<br>`\underline{P}_j`<br>`\bar{P}_j`<br>`station $j$` | `\sum_{y \in \mathcal{P}_b} \rho^{pump}_y p_{y,k}`<br>`\sum_{y: \text{dest}=h} p_{y,k}`<br>`\sum_{y: \text{src}=h} p_{y,k}`<br>`\rho^{pump}_y`<br>`p_{y,k}`<br>`\underline{P}_y`<br>`\bar{P}_y`<br>`station $y$` | Pumping-station index y replaces j (j is the thermal index); consumption rate ρ^{pump}_y replaces γ_j (γ is the FPHA plane coefficient) | math/lp-formulation.md, math/system-elements.mdx | ticket-020 | decided |
| `g \,\in\, (h,b)`<br>`g \,\in\, h`<br>`\bar{Q}_g`<br>`\underline{Q}_g`<br>`\bar{G}_g`<br>`\underline{G}_g`<br>`\mathrm{fold}(g)` | `u \,\in\, (h,b)`<br>`u \,\in\, h`<br>`\bar{Q}_u`<br>`\underline{Q}_u`<br>`\bar{G}_u`<br>`\underline{G}_u`<br>`\mathrm{fold}(u)` | Unit-group index of a (hydro, bus) cell: u replaces g (g is the generic-constraint index) | math/lp-formulation.md | ticket-020 | decided |
| `\ell_g`<br>`u_g` | `\underline{b}_g`<br>`\bar{b}_g` | Generic-constraint endpoints: b̲_g and b̄_g replace ℓ_g and u_g (ℓ is the AR lag, u the diversion flow) | math/lp-formulation.md | ticket-020 | decided |
| `\chi_r` | `\chi^{curt}_r` | Curtailable / must-run flag of a non-controllable source: χ^{curt}_r replaces χ_r (χ_{c,k} is the contract dispatch) | math/system-elements.mdx | ticket-020 | decided |
| `f^+_{\ell,k}`<br>`f^-_{\ell,k}`<br>`\bar{F}^+_\ell`<br>`\bar{F}^-_\ell`<br>`\text{loss}_{\ell,k}`<br>`\eta_\ell`<br>`c^{exch}_\ell`<br>`$f_\ell$` | `f^+_{n,k}`<br>`f^-_{n,k}`<br>`\bar{F}^+_n`<br>`\bar{F}^-_n`<br>`\text{loss}_{n,k}`<br>`\eta_n`<br>`c^{exch}_n`<br>`$f_n$` | Transmission-line index: n replaces ℓ (ℓ is the AR lag) | math/equipment-formulations.mdx | ticket-021 | decided |
| `P^{pump}_{j,k} = \gamma_j \cdot p_{j,k}`<br>`-P^{pump}_{j,k} = -\gamma_j \cdot p_{j,k}`<br>`\gamma_j`<br>`p_{j,k}`<br>`\underline{P}_j`<br>`\bar{P}_j`<br>`station $j$`<br>`$p_j$` | `P^{pump}_{y,k} = \rho^{pump}_y \cdot p_{y,k}`<br>`-P^{pump}_{y,k} = -\rho^{pump}_y \cdot p_{y,k}`<br>`\rho^{pump}_y`<br>`p_{y,k}`<br>`\underline{P}_y`<br>`\bar{P}_y`<br>`station $y$`<br>`$p_y$` | Pumping-station index y replaces j; consumption rate ρ^{pump}_y replaces γ_j | math/equipment-formulations.mdx | ticket-021 | decided |
| `\sigma_{h,b}` | `\lambda_{h,b}` | FPHA cell apportionment share: λ_{h,b} replaces σ_{h,b} | math/hydro-production-models.mdx | ticket-021 | decided |
| `#### 2.6.3 Least-Squares $\alpha_{FPHA}$ Correction`<br>`$\alpha_{FPHA}$ is written with a subscript throughout this chapter to distinguish it from the Benders cut intercept $\alpha$ (see [cut management](/math/cut-management)).`<br>`\alpha_{FPHA}` | `#### 2.6.3 Least-Squares $k_{FPHA}$ Correction`<br>`` (removed, with its enclosing `:::note[Notation note]` and `:::` lines) ``<br>`k_{FPHA}` | FPHA least-squares fit-correction factor: k_{FPHA} replaces α_{FPHA} (α is the CVaR tail fraction); includes the §2.6.3 heading, whose anchor has no inbound link (G1 authorizes the heading edit); the symbol-justification note becomes void and is removed with its `:::note[Notation note]` block | math/hydro-production-models.mdx | ticket-021 | decided |
| `h_{tail}^{(k)}(q_{jus}) = a_0^{(k)} + a_1^{(k)} q_{jus} + a_2^{(k)} q_{jus}^2 + a_3^{(k)} q_{jus}^3 + a_4^{(k)} q_{jus}^4` | `h_{tail}^{(n)}(q_{jus}) = c_0^{(n)} + c_1^{(n)} q_{jus} + c_2^{(n)} q_{jus}^2 + c_3^{(n)} q_{jus}^3 + c_4^{(n)} q_{jus}^4` | Piecewise-quartic tailrace segment: index n replaces k (k is the block index); segment coefficients c^{(n)}_0 … c^{(n)}_4 replace a^{(k)}_0 … a^{(k)}_4 (a is the inflow; c_0 … c_4 are the single-polynomial coefficients) | math/hydro-production-models.mdx | ticket-021 | decided |
| `$v_i \leq v < v_{i+1}$`<br>`h_{fore}(v) = h_i + \frac{h_{i+1} - h_i}{v_{i+1} - v_i} \times (v - v_i)`<br>`plant $i$'s tailrace` | `$v^{(i)} \leq v < v^{(i+1)}$`<br>`h_{fore}(v) = h^{(i)} + \frac{h^{(i+1)} - h^{(i)}}{v^{(i+1)} - v^{(i)}} \times (v - v^{(i)})`<br>`plant $h$'s tailrace` | Volume-height breakpoints: (v^{(i)}, h^{(i)}) replace (v_i, h_i) (v_h is the storage); the backwater plant is h | math/hydro-production-models.mdx | ticket-021 | decided |
| `\pi^v_h`<br>`capture the total sensitivity $\partial Q_t / \partial \hat{v}_h$` | `\beta^v_h`<br>`capture the total sensitivity $\beta^v_h$` | Storage cut slope: β^v_h replaces π^v_h; the water-value sensitivity is written as the storage cut slope β^v_h (Q is the FPHA flow coordinate on this page) | math/hydro-production-models.mdx | ticket-021 | decided |
| `g \,\in\, (h,b)`<br>`g \,\in\, h`<br>`\bar{Q}_g` | `u \,\in\, (h,b)`<br>`u \,\in\, h`<br>`\bar{Q}_u` | Unit-group index of a (hydro, bus) cell: u replaces g | math/hydro-production-models.mdx | ticket-021 | decided |
| `\rho_m(\ell) = \sum_{j=1}^{p_m} \psi^*_{m,j}\, \rho_{(m-\min(j,\ell)) \bmod M}\bigl(&#124;\ell - j&#124;\bigr)`<br>`original-unit coefficients $\psi_{m,j}$; dividing each row $k$ of that system by $s_m\,s_{m-k}$`<br>`$\psi^*_{m,j} = \psi_{m,j}\,s_{m-j}/s_m$`<br>`$\gamma_0^{(m)} = \sum_j \psi_{m,j}\,\gamma_j^{(m)} + \sigma_m^2$`<br>`$1 = \sum_j \psi^*_{m,j}\,\rho_m(j) + r_m^2$`<br>`lag $k = 1, \ldots, \min(p,\, M - 1)$, the season $k$ calendar positions`<br>`$&#124;\rho_m(k)&#124; \le 1$`<br>`A_{h,t-1} = \frac{1}{12} \sum_{j=1}^{12} a_{h,\, t-j}`<br>`\sum_{j=0}^{11} a_{h,\, t - 11 + j}`<br>`lag-$\tau$ coefficient is the classical $\psi^*_{m,\tau}$` | `\rho_m(\ell) = \sum_{\ell'=1}^{p_m} \psi^*_{m,\ell'}\, \rho_{(m-\min(\ell',\ell)) \bmod M}\bigl(&#124;\ell - \ell'&#124;\bigr)`<br>`original-unit coefficients $\psi_{m,\ell}$; dividing each row $\ell'$ of that system by $s_m\,s_{m-\ell'}$`<br>`$\psi^*_{m,\ell} = \psi_{m,\ell}\,s_{m-\ell}/s_m$`<br>`$\gamma_m(0) = \sum_\ell \psi_{m,\ell}\,\gamma_m(\ell) + \sigma_m^2$`<br>`$1 = \sum_\ell \psi^*_{m,\ell}\,\rho_m(\ell) + r_m^2$`<br>`lag $\ell = 1, \ldots, \min(p,\, M - 1)$, the season $\ell$ calendar positions`<br>`$&#124;\rho_m(\ell)&#124; \le 1$`<br>`A_{h,t-1} = \frac{1}{12} \sum_{\ell=1}^{12} a_{h,\, t-\ell}`<br>`\sum_{\ell=1}^{12} a_{h,\, t + 1 - \ell}`<br>`lag-$\ell$ coefficient is the classical $\psi^*_{m,\ell}$` | NOT-10 / one lag letter: the AR lag is ℓ (a second lag ℓ') wherever par-inflow writes it j, k or τ; the autocovariance is γ_m(ℓ) in the reference note | math/par-inflow-model.mdx | ticket-022 | decided |
| `Entry $(i, j)$ (0-indexed, $0 \leq i,j < p$) is the correlation between the lagged observations $\tilde{a}_{t-(i+1)}$ and $\tilde{a}_{t-(j+1)}$`<br>`\hat{\rho}_{\left(m - 1 - \min(i,j)\right) \bmod M}`<br>`[\boldsymbol{r}_m]_i = \hat{\rho}_{m}(i + 1)`<br>`second-moment recursion at lag $i{+}1$`<br>`\boldsymbol{r}^{\,\text{ext}}_m`<br>`\boldsymbol{r}_m`<br>`every season $m = 0,\ldots,M-1$` | `Entry $(i, j)$, $1 \leq i, j \leq p$, is the correlation between the lagged observations $\tilde{a}_{t-i}$ and $\tilde{a}_{t-j}$`<br>`\hat{\rho}_{\left(m - \min(i,j)\right) \bmod M}`<br>`[\hat{\boldsymbol{\rho}}_m]_i = \hat{\rho}_{m}(i)`<br>`second-moment recursion at lag $i$`<br>`\hat{\boldsymbol{\rho}}^{\,\text{ext}}_m`<br>`\hat{\boldsymbol{\rho}}_m`<br>`every season $m = 1, \ldots, M$` | NOT-10 / 1-based lags in the periodic Yule-Walker system: entry (i, j), 1 ≤ i, j ≤ p, correlates lags i and j; the right-hand side is the estimated autocorrelation vector ρ̂_m (r_m is the innovation scale); seasons run m = 1, …, M | math/par-inflow-model.mdx | ticket-022 | decided |
| `z_\alpha` | `z_{0.975}` | PACF significance critical value: z_{0.975} replaces z_α (α is the CVaR tail fraction) | math/par-inflow-model.mdx | ticket-022 | decided |
| `every lag $\ell = 1,\ldots,p_{\max}$ (where $p_{\max} = \max_m p_m$)` | `every lag $\ell = 1, \ldots, P_h$ (where $P_h = \max_m p_m$)` | Largest per-season AR order of a hydro, max_m p_m, is the AR order P_h (p_max is the order-selection ceiling) | math/par-inflow-model.mdx | ticket-022 | decided |
| `\hat{\psi}_{m(t)}`<br>`&#124; Standardised annual coefficient &#124; $\psi$       &#124;`<br>`The standardised coefficient $\psi$ is`<br>`The stored standardised coefficient $\psi$ is converted to the original-unit coefficient $\hat{\psi}$`<br>`\hat{\psi}_{m} \;=\; \psi \cdot \frac{s_m}{\sigma^A_m}`<br>`\psi^*_{m,p}, \psi)`<br>`\psi^*_{m,p} \\ \psi \end{pmatrix}`<br>`The annual coefficient $\psi$ does not`<br>`\psi \cdot s_{m-\tau} / (12\,\sigma^A_m)`<br>`\hat\psi_m = \psi \cdot s_m / \sigma^A_m`<br>`\hat\psi_m` | `\psi^A_{m(t)}`<br>`&#124; Standardised annual coefficient &#124; $\psi^{A*}_m$ &#124;`<br>`The standardised coefficient $\psi^{A*}_m$ is`<br>`The stored standardised coefficient $\psi^{A*}_m$ is converted to the original-unit coefficient $\psi^A_m$`<br>`\psi^A_{m} \;=\; \psi^{A*}_m \cdot \frac{s_m}{\sigma^A_m}`<br>`\psi^*_{m,p}, \psi^{A*}_m)`<br>`\psi^*_{m,p} \\ \psi^{A*}_m \end{pmatrix}`<br>`The annual coefficient $\psi^{A*}_m$ does not`<br>`\psi^{A*}_m \cdot s_{m-\ell} / (12\,\sigma^A_m)`<br>`\psi^A_m = \psi^{A*}_m \cdot s_m / \sigma^A_m`<br>`\psi^A_m` | PAR(p)-A annual coefficient: standardised ψ^{A*}_m and original-unit ψ^A_m replace ψ and ψ̂_m (bare ψ is the AR coefficient; the hat marks an estimate) | math/par-inflow-model.mdx | ticket-022 | decided |
| `\tilde s_m = \lambda\, s_m`<br>`\tilde\sigma^A_m = \lambda\,\sigma^A_m` | `\tilde s_m = c\, s_m`<br>`\tilde\sigma^A_m = c\,\sigma^A_m` | Uniform rescaling factor of a conditioning swap: c replaces λ (λ_i are the correlation eigenvalues on this page) | math/par-inflow-model.mdx | ticket-022 | decided |
| `record length $N$`<br>`When $N$ is close` | `record length $N^{\text{hist}}$`<br>`When $N^{\text{hist}}$ is close` | Historical record length: N^{hist} replaces N (N_m is the per-season observation count) | math/par-inflow-model.mdx | ticket-022 | decided |
| `The lagged inflows $a_{h,t-\ell}$ are`<br>`a_{h,t-\ell} = \hat{a}_{h,t-\ell}`<br>`where $\hat{a}_{h,t-\ell}$ is patched`<br>`\sum_\ell \psi \cdot a_{h,t-\ell}` | `The lagged inflows $a_{h,\ell}$ are`<br>`a_{h,\ell} = \hat{a}_{h,\ell}`<br>`where $\hat{a}_{h,\ell}$ is patched`<br>`\sum_\ell \psi_{m(t),\ell} \cdot a_{h,\ell}` | NOT-10: the LP lag column and its incoming value in their registry forms a_{h,ℓ}, â_{h,ℓ}, and the AR coefficient ψ_{m(t),ℓ}, in §7.5 | math/par-inflow-model.mdx | ticket-022 | decided |
| `\phi_m` | `b_{h,m}` | NOT-10: the deterministic base of the noise inversion written b_{h,m} (φ is the hydro production function and the arrival density) | math/scenario-generation.mdx | ticket-022 | decided |
| `$\Sigma = V \operatorname{diag}(\lambda) V^T$`<br>`$D = V \operatorname{diag}(\sqrt{\max(0,\lambda)}) V^T$`<br>`$\varepsilon = D \cdot z$` | `$C = U \Lambda U^\top$`<br>`$C^{1/2} = U \tilde{\Lambda}^{1/2} U^\top$`<br>`$\varepsilon = C^{1/2} z$` | Spatial correlation in the registry forms: correlation matrix C, eigenvectors U, eigenvalues Λ, spectral factor C^{1/2} (V is the value function and D the load on this page) | math/scenario-generation.mdx | ticket-022 | decided |
| `z_h^{(t)}` | `\Delta a_{h,t}` | Systematic inversion offset: Δa_{h,t} replaces z_h^{(t)} (z are the independent normal draws) | math/scenario-generation.mdx | ticket-022 | decided |
| `sampling $n$ openings` | `sampling $n_{\text{sample}}$ openings` | Monte Carlo backward-sample count: n_{sample} replaces n (n is the policy-graph node) | math/scenario-generation.mdx | ticket-022 | decided |
| `j \in \{0, \ldots, N_t - 1\}`<br>`j \in \{0, \ldots, N_{\text{openings}} - 1\}` | `j \in \{1, \ldots, N_t\}`<br>`j \in \{1, \ldots, N_{\text{openings}}\}` | 1-based opening index j | math/scenario-generation.mdx | ticket-022 | decided |
| `\prod_{s=1}^{t} N_s`<br>`\prod_{s=1}^{3} N_s` | `\prod_{t'=1}^{t} N_{t'}`<br>`\prod_{t'=1}^{3} N_{t'}` | Stage dummy of the tree-size products: t' replaces s (s is the seasonal standard deviation in this page's d2 diagram) | math/scenario-generation.mdx | ticket-022 | decided |
| `\max_{k \in \mathcal{K}_\tau}`<br>`\alpha_k + \pi_k^{\top} x` | `\max_{i \in \mathcal{I}_\tau}`<br>`\beta_{0,i} + \beta_i^{\top} x` | Season-indexed cut pool: cut index i (index set ℐ_τ), stored intercept β_{0,i} and slope β_i (k is the iteration, α the CVaR tail fraction, π the row dual) | math/horizon-modes.md | ticket-022 | decided |
| `T_\tau` | `\mathbb{T}_\tau` | One-stage Bellman operator at season τ: 𝕋_τ replaces T_τ (T is the horizon) | math/horizon-modes.md | ticket-022 | decided |
| `the significance threshold $1.96 / \sqrt{N_m}$` | `the significance threshold of the [PAR Inflow Model](/math/par-inflow-model) order selection` | PACF significance threshold cited through its owner page (N_m, the per-season observation count, would share the page with the opening count N_t) | math/scenario-generation.mdx | ticket-022 | decided |
| `\sum_{\ell=1}^{P} \psi_{m,\ell} \cdot a_{t-\ell}`<br>`\sum_{\ell=1}^{P} \psi_{m,\ell} \cdot \mu_{m-\ell}`<br>`the upper index $P$ of the lag sum` | `\sum_{\ell=1}^{P_h} \psi_{m,\ell} \cdot a_{t-\ell}`<br>`\sum_{\ell=1}^{P_h} \psi_{m,\ell} \cdot \mu_{m-\ell}`<br>`the upper index $P_h$ of the lag sum` | Upper index of the noise-inversion lag sum: P_h, the hydro's AR-row width in the LP (bare P is not a registry symbol) | math/scenario-generation.mdx | ticket-022 | decided |
| `\pi^v_{i,h}`<br>`\pi^{lag}_{i,h,\ell}`<br>`\pi^\top x` | `\beta^v_{i,h}`<br>`\beta^{lag}_{i,h,\ell}`<br>`\beta^\top x` | Cut slope: β replaces π in the discounted-cut statements | math/discount-rate.mdx | ticket-023 | decided |
| `carries an intercept $\alpha$`<br>`\theta \;\geq\; \alpha \;+\; \beta^{\top} x`<br>`into the intercept $\alpha$ of every`<br>`\theta \geq \alpha_i +`<br>`$(\alpha_i,`<br>`\theta \geq \alpha +`<br>`d \cdot (\alpha +` | `carries an intercept $\beta_0$`<br>`\theta \;\geq\; \beta_0 \;+\; \beta^{\top} x`<br>`into the intercept $\beta_0$ of every`<br>`\theta \geq \beta_{0,i} +`<br>`$(\beta_{0,i},`<br>`\theta \geq \beta_0 +`<br>`d \cdot (\beta_0 +` | Stored cut intercept: β_0 replaces α (the imported boundary cut is θ ≥ β_0 + βᵀx) | math/post-study-boundary.md, math/discount-rate.mdx | ticket-023 | decided |
| `\bar{\pi}^v_{t-1,h}`<br>`\bar{\pi}^{lag}_{t-1,h,\ell}`<br>`\pi^v_{t,h}(\omega)`<br>`\pi^{lag}_{t,h,\ell}(\omega)`<br>`\pi^v_{t,h}`<br>`\pi^{lag}_{t,h,\ell}`<br>`\pi^v_h`<br>`\pi^{lag}_{h,\ell}`<br>`\bar{\pi}^v`<br>`\bar{\pi}^{lag}`<br>`\bar{\pi}_{t-1,h}`<br>`\bar{\pi}_{t-1}`<br>`\pi_{t,h}(\omega)`<br>`\pi_t(\omega)`<br>`\partial Q_t / \partial \hat{x}_j = \pi_j`<br>`gradient $\nabla_i$`<br>`\nabla_i \cdot x^*_{\text{raw}}`<br>`$-\nabla \cdot x + \theta \ge \alpha$` | `\bar{\beta}^v_{t-1,h}`<br>`\bar{\beta}^{lag}_{t-1,h,\ell}`<br>`\beta^v_{t,h}(\omega)`<br>`\beta^{lag}_{t,h,\ell}(\omega)`<br>`\beta^v_{t,h}`<br>`\beta^{lag}_{t,h,\ell}`<br>`\beta^v_h`<br>`\beta^{lag}_{h,\ell}`<br>`\bar{\beta}^v`<br>`\bar{\beta}^{lag}`<br>`\bar{\beta}_{t-1,h}`<br>`\bar{\beta}_{t-1}`<br>`\beta_{t,h}(\omega)`<br>`\beta_t(\omega)`<br>`\partial Q_t / \partial \hat{x}_j = \beta_j`<br>`slope $\beta_i$`<br>`\beta_i^\top x^*_{\text{raw}}`<br>`$-\beta^\top x + \theta \ge \beta_0$` | Cut slope: β replaces π (per-opening β_t(ω), aggregate β̄, storage β^v, lag β^{lag}, component β_j, DCS candidate β_i, which replaces the gradient ∇_i) | math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx | ticket-024 | decided |
| `Compute per-scenario cut coefficients $(\alpha(\omega), \pi(\omega))$`<br>`\theta_{t-1} \geq \bar{\alpha} + \bar{\pi}^\top x_{t-1}`<br>`where $\bar{\alpha} = \mathbb{E}[\alpha(\omega)]$ and $\bar{\pi} = \mathbb{E}[\pi(\omega)]$`<br>`π̄ = E[π],  ᾱ = E[α]` | `Compute per-scenario cut terms $(Q_t(\hat{x}_{t-1}, \omega), \beta(\omega))$`<br>`\theta_{t-1} \geq \bar{Q}_t + \bar{\beta}^\top (x_{t-1} - \hat{x}_{t-1})`<br>`where $\bar{Q}_t = \mathbb{E}[Q_t(\hat{x}_{t-1}, \omega)]$ and $\bar{\beta} = \mathbb{E}[\beta(\omega)]$`<br>`β̄ = E[β],  Q̄ₜ = E[Qₜ]` | Point-slope cut form where the cut is shown at its trial point (Req 2): θ_{t-1} ≥ Q̄_t + β̄ᵀ(x_{t-1} − x̂_{t-1}) with Q̄_t = E[Q_t(x̂_{t-1}, ω)] (the per-opening values and slopes are the cut terms; d2 label in the same form) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `- $\hat{\alpha}_t(\omega)$ denotes **per-scenario cut intercepts** within this spec. This corresponds to $\alpha$ in [Cut Management §1](/math/cut-management), renamed here to avoid collision with the CVaR parameter.`<br>` (not $q$, which denotes turbined flow)`<br>` This is the standard convention in the risk measure literature.` | `(bullet removed)`<br>(removed)<br>(removed) | Symbol-convention note: the obsolete α̂ rename bullet, the q aside and the convention justification are removed (no hatted intercept remains; q* is the planned CVaR tail weight; principle 6) | math/risk-measures.mdx | ticket-024 | decided |
| `\theta \geq \alpha + \sum`<br>`- $\alpha$ is the cut intercept`<br>`\alpha_t = Q_t(\hat{x}_{t-1}, \omega_t)`<br>`\bar{\alpha}_{t-1} = \sum_{\omega \in \Omega_t} p(\omega) \cdot \alpha_t(\omega)`<br>`The per-scenario cuts $\alpha_t(\omega)$`<br>`$(\bar{\alpha},`<br>`intercept $\alpha_i$`<br>`f_i = \alpha_i +`<br>`\bar{\hat{\alpha}}_{t-1}`<br>`\hat{\alpha}_t(\omega)` | `\theta \geq \beta_0 + \sum`<br>`- $\beta_0$ is the cut intercept`<br>`\beta_{0,t} = Q_t(\hat{x}_{t-1}, \omega_t)`<br>`\bar{\beta}_{0,t-1} = \sum_{\omega \in \Omega_t} p(\omega) \cdot \beta_{0,t}(\omega)`<br>`The per-scenario cuts $\beta_{0,t}(\omega)$`<br>`$(\bar{\beta}_0,`<br>`intercept $\beta_{0,i}$`<br>`f_i = \beta_{0,i} +`<br>`\bar{\beta}_{0,t-1}`<br>`\beta_{0,t}(\omega)` | Stored cut intercept: β_0 replaces α (per-opening β_{0,t}(ω), aggregate β̄_{0,t-1}, cut i β_{0,i}); the hatted per-opening intercept α̂ disappears | math/cut-management.mdx, math/risk-measures.mdx | ticket-024 | decided |
| `\alpha_k + \pi_k^\top x \leq V_{t+1}(x)`<br>`each cut's value is $\alpha_k + \pi_k^\top \hat{x}$`<br>`V^*(\hat{x}) = \max_k \left\{ \alpha_k + \pi_k^\top \hat{x} \right\}`<br>`\text{cut } k \text{ is active at } \hat{x} \iff V^*(\hat{x}) - (\alpha_k + \pi_k^\top \hat{x}) \le \epsilon`<br>`cut $k$ is dominated when`<br>`\max_{j \neq k} \left\{ \alpha_j + \pi_j^\top \hat{x} \right\} - \left( \alpha_k + \pi_k^\top \hat{x} \right)` | `\beta_{0,i} + \beta_i^\top x \leq V_{t+1}(x)`<br>`each cut's value is $\beta_{0,i} + \beta_i^\top \hat{x}$`<br>`V^*(\hat{x}) = \max_i \left\{ \beta_{0,i} + \beta_i^\top \hat{x} \right\}`<br>`\text{cut } i \text{ is active at } \hat{x} \iff V^*(\hat{x}) - (\beta_{0,i} + \beta_i^\top \hat{x}) \le \epsilon`<br>`cut $i$ is dominated when`<br>`\max_{i' \neq i} \left\{ \beta_{0,i'} + \beta_{i'}^\top \hat{x} \right\} - \left( \beta_{0,i} + \beta_i^\top \hat{x} \right)` | Cut index i replaces k on cut-management (k is the iteration); the competing cut is i' | math/cut-management.mdx | ticket-024 | decided |
| `$N(1+L)$`<br>`$N \cdot L$`<br>`PAR($p$)`<br>`PAR($p > 0$) model` | `$N(1+P^{\max})$`<br>`$N \cdot P^{\max}$`<br>`PAR(p)`<br>`PAR(p) model with $P_h > 0$` | Maximum AR order across hydros: P^{max} replaces L; AR order P_h replaces the bare p (p(ω) is the opening probability on this page) | math/cut-management.mdx | ticket-024 | decided |
| `each $n$-th iteration` | `each $n_{\text{sel}}$-th iteration` | Period of periodic cut selection: n_{sel} replaces n (n is the policy-graph node) | math/cut-management.mdx | ticket-024 | decided |
| `\min_{x_1, \ldots, x_T} \mathbb{E}\left[ \sum_{t=1}^{T} c_t(\omega_t)^\top x_t(\omega_{t}) \right]`<br>`\min_{x_t} \left\{ c_t^\top x_t + V_{t+1}(x_t) : A_t x_t = b_t - E_t x_{t-1}, \; x_t \in \mathcal{X}_t \right\}`<br>`\sum_{t=1}^{T} c_t^\top x_t^{(m)}`<br>`\min_{x_t} \left\{ c_t^\top x_t + d_{t \to t+1} \cdot V_{t+1}(x_t) : (x_t, x_{t-1}) \text{ feasible} \right\}`<br>`\min_{x_t} \left\{ c_t^\top x_t + d_{t \to t+1} \cdot \theta_t : \text{constraints} \right\}` | `\min \mathbb{E}\left[ \sum_{t=1}^{T} c_t(x_t, u_t) \right]`<br>`\min_{x_t, u_t} \left\{ c_t(x_t, u_t) + V_{t+1}(x_t) : (x_t, u_t) \in \mathcal{X}_t(x_{t-1}, \omega_t) \right\}`<br>`\sum_{t=1}^{T} c_t(x_t^{(m)}, u_t^{(m)})`<br>`\min_{x_t, u_t} \left\{ c_t(x_t, u_t) + d_{t \to t+1} \cdot V_{t+1}(x_t) : (x_t, u_t) \in \mathcal{X}_t(x_{t-1}, \omega) \right\}`<br>`\min_{x_t, u_t} \left\{ c_t(x_t, u_t) + d_{t \to t+1} \cdot \theta_t : \text{constraints} \right\}` | Stage decision in the SDDP.jl form: state x_t, control u_t, stage cost c_t(x_t, u_t), feasible set 𝒳_t(x_{t-1}, ω_t) (x_t is the state, which the cut slopes act on) | math/sddp-algorithm.mdx, math/risk-measures.mdx | ticket-024 | decided |
| `forward pass $k$` | `forward pass $m$` | Forward-pass (trajectory) index m replaces k (k is the iteration) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `$y^{i}_{k}$`<br>`$b_{i,d}$`<br>`receiving plant $i$` | `$x^{\mathrm{a}}_{s,i}$`<br>`$b^{\mathrm{out}}_{h,d}$`<br>`receiving plant $h$` | Anticipated ring-slot state written x^{a}_{s,i} (the lp-formulation form; y is the carrier column, k the iteration); in-transit bucket written b^{out}_{h,d} with receiving plant h | math/sddp-algorithm.mdx | ticket-024 | decided |
| `bound $\sum_\ell P(\ell)\, C(\ell)$ over every leaf path` | `bound $\bar{z}_{\text{exact}}$ over every leaf path` | Exact upper bound named by its registry symbol z̄_exact (ℓ is the AR lag and P_h the AR order on this page) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `transitions with probability $p = 1$` | `transitions of probability $1$` | Stage-chain transition probability written as the value 1 (p(ω) is the opening probability on this page) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `"ξ₁"`<br>`"ξ₂"`<br>`"ξ₃"`<br>`evaluate N openings`<br>`evaluates all N openings at each trial point`<br>`(all N openings)` | `"ω⁽¹⁾"`<br>`"ω⁽²⁾"`<br>`"ω⁽³⁾"`<br>`evaluate all openings`<br>`evaluates every opening at each trial point`<br>`(all openings)` | Opening labels and counts in the d2 diagrams and caption: openings ω⁽¹⁾, ω⁽²⁾, ω⁽³⁾ (ξ is the noise-adjustment slack); the bare opening count N is dropped (N is the thread count on this page) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `\hat{V}_t^k` | `\underline{V}_t^k` | Outer approximation at iteration k written V̲^k_t (the hat marks the trial point) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `$Q'(v)$` | `$V'(v)$` | Figure caption: the plotted cost-to-go is V(v), its tangent slope V′(v) (Q is the stage-LP value) | math/sddp-algorithm.mdx | ticket-024 | decided |
| `sample $n$ openings` | `sample $n_{\text{sample}}$ openings` | Monte Carlo backward-sample count: n_{sample} replaces n | math/sddp-algorithm.mdx | ticket-024 | decided |
| `j \in \{0, \ldots, N_{\text{openings}}-1\}` | `j \in \{1, \ldots, N_{\text{openings}}\}` | 1-based opening index j | math/sddp-algorithm.mdx | ticket-024 | decided |
| `\lambda(\tilde{x}, \omega)` | `\beta(\tilde{x}, \omega)` | Risk-averse subgradient written β(x̃, ω) (λ is the risk-aversion weight) | math/risk-measures.mdx | ticket-024 | decided |
| `**CVaR confidence level**`<br>`and confidence level $\alpha \in (0, 1]$`<br>`CVaR confidence level`<br>`` `alpha` (confidence level) ``<br>`the worst $(1-\alpha)$ tail shaded` | `**CVaR tail fraction**`<br>`and tail fraction $\alpha \in (0, 1]$`<br>`CVaR tail fraction`<br>`` `alpha` (tail fraction) ``<br>`the worst $\alpha$ tail shaded` | α is the CVaR tail fraction: wording "tail fraction" replaces "confidence level", and the shaded region is the worst α tail | math/risk-measures.mdx | ticket-024 | decided |
| `$f(C)$`<br>`$\mathbb{E}[C]$`<br>`\rho^{\lambda,\alpha}[C] = (1-\lambda)\,\mathbb{E}[C] + \lambda\,\mathrm{CVaR}_\alpha[C]` | `$f(Z)$`<br>`$\mathbb{E}[Z]$`<br>`\rho^{\lambda,\alpha}[Z] = (1-\lambda)\,\mathbb{E}[Z] + \lambda\,\mathrm{CVaR}_\alpha[Z]` | Random cost in the §1 figure caption: Z (the body symbol) replaces C | math/risk-measures.mdx | ticket-024 | decided |
| `\hat{A}_{ij} = \tilde{A}_{ij} \cdot d_i^{row}`<br>`\hat{l}_i^{row} = l_i^{row} \cdot d_i^{row}`<br>`\hat{u}_i^{row} = u_i^{row} \cdot d_i^{row}` | `\check{A}_{ij} = \tilde{A}_{ij} \cdot d_i^{row}`<br>`\check{l}_i^{row} = l_i^{row} \cdot d_i^{row}`<br>`\check{u}_i^{row} = u_i^{row} \cdot d_i^{row}` | Row-scaled LP data take the check accent Ǎ_{ij}, ľ_i^{row}, ǔ_i^{row} (the hat marks an incoming state value; the tilde stays the column-scaled form) | math/lp-formulation.md | ticket-020 | decided |
| `V_{t+1}(x) \;\ge\; \alpha_i + \pi_i^\top x \qquad \text{for every cut } i`<br>`an epigraph variable $\theta$ bounded by every cut ($\theta \ge \alpha_i + \pi_i^\top x$), so the approximation is the upper envelope $\max_i (\alpha_i + \pi_i^\top x)$` | `V_{t+1}(x) \;\ge\; \beta_{0,i} + \beta_i^\top x \qquad \text{for every cut } i`<br>`an epigraph variable $\theta_t$, approximating $V_{t+1}(x_t)$ and bounded by every cut ($\theta_t \ge \beta_{0,i} + \beta_i^\top x_t$), so the approximation is the upper envelope $\max_i (\beta_{0,i} + \beta_i^\top x)$` | NOT-01 and the cut in registry symbols: the epigraph variable θ_t approximates V_{t+1}(x_t); stored intercept β_{0,i} and slope β_i of cut i | overview/sddp-framework-overview.mdx | ticket-025 | decided |
| `\text{s.t. } \theta \geq \alpha_k + \pi_k^\top x_t \quad \forall k \text{ (cuts)}` | `\text{s.t. } \theta \geq \beta_0 + \beta^\top x_t \quad \text{for every cut } (\beta_0, \beta)` | Cut row of the stage LP without a cut index (i is the vertex index on this page): θ ≥ β_0 + βᵀx_t for every cut (β_0, β) | math/upper-bound-evaluation.md | ticket-025 | decided |
| `\min \; c_t^\top x_t + d_{t \to t+1} \cdot \theta`<br>`\min \; c_t^\top x_t + d_{t \to t+1} \cdot \bar{\theta}`<br>`\min_{x_t}\; c_t^\top x_t + V_{t+1}(x_t)`<br>`decisions $x_t$ given` | `\min \; c_t(x_t, u_t) + d_{t \to t+1} \cdot \theta`<br>`\min \; c_t(x_t, u_t) + d_{t \to t+1} \cdot \bar{\theta}`<br>`\min_{x_t, u_t}\; c_t(x_t, u_t) + V_{t+1}(x_t)`<br>`state $x_t$ and control $u_t$, $(x_t, u_t) \in \mathcal{X}_t(x_{t-1}, \omega_t)$, given` | Stage decision in the SDDP.jl form: stage cost c_t(x_t, u_t) of state x_t and control u_t, feasible set 𝒳_t(x_{t-1}, ω_t) | math/upper-bound-evaluation.md, overview/sddp-framework-overview.mdx | ticket-025 | decided |
| `sample weight $1/N$ per scenario` | `sample weight $1/M$ per scenario` | Per-scenario weight of the training forward pass: 1/M, with M the forward-pass trajectory count (N is the out-of-sample scenario count on this page) | math/upper-bound-evaluation.md | ticket-025 | decided |
| `recording the total discounted cost $C_i$ for scenario $i$`<br>`C_i = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(i)}`<br>`where $c_t^{(i)}$ is the immediate cost at stage $t$ of scenario $i$`<br>`\bar{C} = \frac{1}{N} \sum_{i=1}^{N} C_i`<br>`\sum_{i=1}^{N} (C_i - \bar{C})^2`<br>`the per-scenario weight $w_i$`<br>`$\sum_i w_i = 1$`<br>`\bar{C} = \sum_i w_i\, C_i`<br>`\sigma_C = \sqrt{\sum_i w_i\,(C_i - \bar{C})^2}`<br>`$C_i$ ranges over`<br>`its $\sum_i w_i C_i$ form` | `recording the total discounted cost $C_m$ for scenario $m$`<br>`C_m = \sum_{t=1}^{T} d_{1 \to t} \cdot c_t^{(m)}`<br>`where $c_t^{(m)}$ is the immediate cost at stage $t$ of scenario $m$`<br>`\bar{C} = \frac{1}{N} \sum_{m=1}^{N} C_m`<br>`\sum_{m=1}^{N} (C_m - \bar{C})^2`<br>`the per-scenario weight $w_m$`<br>`$\sum_m w_m = 1$`<br>`\bar{C} = \sum_m w_m\, C_m`<br>`\sigma_C = \sqrt{\sum_m w_m\,(C_m - \bar{C})^2}`<br>`$C_m$ ranges over`<br>`its $\sum_m w_m C_m$ form` | Out-of-sample simulation-scenario index: m (the registry simulated-trajectory index) replaces i (i is the vertex index on this page) | math/upper-bound-evaluation.md | ticket-025 | decided |
| `\text{STOP} \iff &#124;\Delta_k&#124; < \text{tolerance}`<br>`\text{gap} \leq \text{tolerance} \quad\text{or}\quad 100 \cdot \text{gap} / \max(1, &#124;\underline{z}&#124;) \leq \text{relative tolerance}` | `\text{STOP} \iff &#124;\Delta_k&#124; < \varepsilon_{\text{stall}}`<br>`\max(0, \text{gap}^k) \leq \varepsilon_{\text{abs}} \quad\text{or}\quad 100 \cdot \max(0, \text{gap}^k) / \max(1, &#124;\underline{z}^k&#124;) \leq \varepsilon_{\text{rel}}` | Stopping tolerances: ε_stall (bound stalling), ε_abs and ε_rel (absolute and relative gap arms) replace the two meanings of \text{tolerance} and \text{relative tolerance} | math/stopping-rules.mdx | ticket-025 | decided |
| `where $\alpha \in (0, 1]$ is the confidence level`<br>`the worst $(1-\alpha)$ tail shaded` | `where $\alpha \in (0, 1]$ is the tail fraction`<br>`the worst $\alpha$ tail shaded` | α is the CVaR tail fraction: "tail fraction" replaces "confidence level"; the shaded region is the worst α tail | overview/sddp-framework-overview.mdx | ticket-025 | decided |
| `\bar{\pi}`<br>`\bar\pi`<br>`\pi^v`<br>`The vector $\pi$ in a cut` | `\bar{\beta}`<br>`\bar\beta`<br>`\beta^v`<br>`The vector $\beta$ in a cut` | Storage cut slope: β^v replaces π^v (every π^v form: per-opening β^v_t(ω), aggregate β̄^v, cut-i aggregate β̄^{v,i}, hydro component β^v_h); the glossary cut-slope vector β | examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | ticket-026 | decided |
| `$\theta \geq \alpha + \pi^{\top} x$`<br>`\theta \geq \alpha +`<br>`\hat{\alpha}_4(\omega)`<br>`\hat{\alpha}_3(\omega)`<br>`\hat{\alpha}_4`<br>`\hat{\alpha}_3`<br>`\hat{\alpha}(\omega)`<br>`\hat\alpha_4(\omega)`<br>`\hat\alpha_4`<br>`\hat\alpha(\omega)`<br>`\bar{\alpha} = `<br>`\bar{\alpha}^i`<br>`\bar\alpha_4`<br>`\bar\alpha^i`<br>`The scalar $\alpha$ in a cut` | `$\theta \geq \beta_0 + \beta^{\top} x$`<br>`\theta \geq \beta_0 +`<br>`\beta_{0,4}(\omega)`<br>`\beta_{0,3}(\omega)`<br>`\beta_{0,4}`<br>`\beta_{0,3}`<br>`\beta_0(\omega)`<br>`\beta_{0,4}(\omega)`<br>`\beta_{0,4}`<br>`\beta_0(\omega)`<br>`\bar{\beta}_0 = `<br>`\bar{\beta}_0^i`<br>`\bar\beta_{0,4}`<br>`\bar\beta_0^i`<br>`The scalar $\beta_0$ in a cut` | Stored cut intercept: β_0 replaces α (per-opening β_{0,t}(ω) replaces the hatted α̂_t(ω), aggregate β̄_0, cut-i aggregate β̄_0^i) | examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | ticket-026 | decided |
| `\hat{V}_t^k(v)` | `\underline{V}_t^k(v)` | Outer approximation at iteration k written V̲^k_t (the hat marks the trial point) | examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx | ticket-026 | decided |
| `$\hat v_0 = (30, 30, 20, 20)$`<br>`v_1 = (30 + 15 - 25,`<br>`$\hat v_1 = (20, 22, 15, 16)$`<br>`v_2 = (10, 14, 10, 12).`<br>`$\hat v_2 = (10, 14, 10, 12)$`<br>`v_3 = (0, 6, 5, 8).`<br>`$\hat v_3 = (0, 6, 5, 8)$`<br>`&#124; $\hat v_3$ &#124;`<br>`At $v = \hat v_3 = (0, 6, 5, 8)$`<br>`storage vector $\hat v_{t-1}$`<br>`flows to terminal $v_4$` | `$\hat x_0 = (30, 30, 20, 20)$`<br>`x_1 = (30 + 15 - 25,`<br>`$\hat x_1 = (20, 22, 15, 16)$`<br>`x_2 = (10, 14, 10, 12).`<br>`$\hat x_2 = (10, 14, 10, 12)$`<br>`x_3 = (0, 6, 5, 8).`<br>`$\hat x_3 = (0, 6, 5, 8)$`<br>`&#124; $\hat v_{h,3}$ &#124;`<br>`At $x = \hat x_3 = (0, 6, 5, 8)$`<br>`storage vector $\hat x_{t-1}$`<br>`flows to terminal $x_4$` | Stage storage vectors of the four-reservoir toy: the state x_t and its trial value x̂_t replace v_t and v̂_t (v_h is the storage of hydro h, so v_1 … v_4 are the hydro components); the terminal stage-4 storage vector is x_4 (XD-09 2A) | examples/toy-four-reservoir.mdx | ticket-026 | decided |
| `\sum_{u \in \text{upstream}}(q_u + s_u)` | `\sum_{h' \in \mathcal{U}_h}(q_{h'} + s_{h'})` | Upstream plants of hydro h: the registry set 𝒰_h with primed hydro index h' (u is the diversion flow) | examples/toy-four-reservoir.mdx | ticket-026 | decided |
| `$\Sigma$`<br>`factorisation $\varepsilon = L\, z$ with $L L^{\top} = \Sigma$` | `$C$`<br>`factorisation $\varepsilon = C^{1/2} z$ with $C^{1/2} = U \Lambda^{1/2} U^{\top}$` | Spatial correlation in the registry forms: correlation matrix C, spectral factor C^{1/2} = U Λ^{1/2} Uᵀ (L is the last filling stage and Σ is not a registry symbol) | examples/toy-four-reservoir.mdx, reference/glossary.md | ticket-026 | decided |
| `uniform $p = 1/N$`<br>`$p_\omega = 1/N$`<br>`&#124; $N$       &#124;` | `uniform $p = 1/N_t$`<br>`$p_\omega = 1/N_t$`<br>`&#124; $N_t$     &#124;` | Uniform opening probability in the registry form 1/N_t (N_t is the opening count; bare N is the hydro count); the toy case-parameter tables write the opening count N_t (XD-09 1A) | examples/toy-single-reservoir.mdx, examples/toy-four-reservoir.mdx, reference/glossary.md | ticket-026 | decided |
| `at stage $t + K$, where $K = $`<br>`Lead stages ($K$)`<br>`at stage $t + K$.` | `at stage $t + K_i$, where $K_i = $`<br>`Lead stages ($K_i$)`<br>`at stage $t + K_i$.` | Per-plant lead of an anticipated thermal: K_i replaces K (K is the cost-scale factor). The glossary carries none of the three new forms: ticket-072a rewrote its anticipated rows, and its Lead row reads `Lead ($K_i$)`, with `K_i` the plant's ring depth, equal to the lead under `lead_stages`; the §5 grep of the old forms still applies | reference/glossary.md | ticket-026 | decided |
| `$\mu_m, \sigma_m$` | `$\mu_m, s_m$` | Seasonal sample standard deviation: s_m replaces σ_m (σ_m is the innovation standard deviation) | reference/glossary.md | ticket-026 | decided |
| `\min_{x_t}\, c_t(x_t) + d \cdot \mathbb{E}[V_{t+1}(x_t)]` | `\mathbb{E}_{\omega_t}\bigl[\min_{x_t, u_t}\, c_t(x_t, u_t) + d_{t \to t+1} \cdot V_{t+1}(x_t)\bigr]` | Bellman recursion in the registry form: expectation over ω_t of the stage minimum of c_t(x_t, u_t) plus the discounted cost-to-go d_{t→t+1} V_{t+1}(x_t) | reference/glossary.md | ticket-026 | decided |
| `Conditional Value at Risk at level $\alpha$`<br>`the worst $\alpha\%$ of scenarios` | `Conditional Value at Risk at tail fraction $\alpha$`<br>`the worst $\alpha$-fraction of scenarios` | α is the CVaR tail fraction: "at tail fraction α" and "the worst α-fraction" replace "at level α" and "the worst α%" | reference/glossary.md | ticket-026 | decided |
| `the objective value of the stage-zero LP` | `the objective value of the stage-1 LP` | NOT-08: 1-based stage wording; the lower bound is the stage-1 LP objective | overview/what-cobre-solves.md | ticket-026 | decided |
| `` least-squares `alpha_FPHA` scalar ``<br>`` no single `alpha_FPHA` scalar `` | `least-squares $k_{FPHA}$ scalar`<br>`no single $k_{FPHA}$ scalar` | FPHA least-squares fit-correction factor: $k_{FPHA}$ replaces the code-formatted alpha_FPHA (α is the CVaR tail fraction) | math/_impl/_hydro.notes.mdx | ticket-027 | decided |
| `reconstructs $\psi$ and $\sigma$` | `reconstructs $\psi_{m,\ell}$ and $\sigma_m$` | AR coefficient and innovation standard deviation in their registry forms ψ_{m,ℓ} and σ_m (the host page par-inflow-model writes the PAR(p)-A annual coefficient ψ^{A*}_m) | math/_impl/_par.io.mdx | ticket-027 | decided |
| `C ~ Gamma(shape, scale)`<br>`E[C]      = ∫ x·f(x) dx`<br>`the (1−alpha) quantile of C`<br>`E[C &#124; C ≥ VaR_alpha]`<br>`(the shaded (1−alpha) tail)`<br>`The shaded (1−alpha) tail`<br>`Cost distribution f(C) with E[C], VaR and CVaR marked and the (1−α) tail shaded`<br>`(E[C]/VaR/CVaR)`<br>`label: "E[C]"`<br>`label: "total cost C"` | `Z ~ Gamma(shape, scale)`<br>`E[Z]      = ∫ x·f(x) dx`<br>`the (1−alpha) quantile of Z`<br>`E[Z &#124; Z ≥ VaR_alpha]`<br>`(the shaded worst-alpha tail)`<br>`The shaded worst-alpha tail`<br>`Cost distribution f(Z) with E[Z], VaR and CVaR marked and the worst α tail shaded`<br>`(E[Z]/VaR/CVaR)`<br>`label: "E[Z]"`<br>`label: "total cost Z"` | Risk figure in the risk-measures symbols: random cost Z replaces C; the shaded region is the worst α tail (VaR_α is the (1−α) quantile, which stays) | src/figures/cvar.ts, src/components/CvarPlot.astro | ticket-028 | decided |
| `aria-label="Future cost Q(v) with Benders tangents"`<br>`label: "future cost Q(v)"` | `aria-label="Future cost V(v) with Benders tangents"`<br>`label: "future cost V(v)"` | Plotted cost-to-go: V(v) replaces Q(v) (Q_t is the stage-LP value) | src/components/ValueFunctionPlot.astro | ticket-028 | decided |
| `Epigraph variable approximating $V_{t}$` | `Epigraph variable approximating $V_{t+1}(x_t)$` | NOT-01: θ_t approximates V_{t+1}(x_t) | overview/notation-conventions.md | ticket-018 | decided |
| `$(\alpha, \pi)$` | `$(\beta_0, \beta)$` | Cut terms in registry symbols: stored intercept β_0 and slope β (π stays the row dual) | overview/notation-conventions.md | ticket-018 | decided |
| `already $\alpha_{FPHA}$-scaled`<br>`&#124; $\alpha_{FPHA}$`<br>`, distinct from the Benders cut intercept $\alpha$` | `already $k_{FPHA}$-scaled`<br>`&#124; $k_{FPHA}$`<br>(removed) | FPHA least-squares fit-correction factor: k_{FPHA} replaces α_{FPHA}; the distinctness clause about the cut intercept is removed (principle 6) | overview/notation-conventions.md | ticket-018 | decided |
| `$c^{exch}_\ell$`<br>`$\bar{F}^+_\ell$, $\bar{F}^-_\ell$`<br>`$\eta_\ell = 1 - \text{losses}/100$`<br>`$(1-\eta_\ell)(f^+ + f^-)$`<br>`the line efficiency $\eta_\ell$`<br>`$f^+_{\ell,k}$`<br>`$f^-_{\ell,k}$`<br>`$[0, \bar{F}^+_\ell]$`<br>`$[0, \bar{F}^-_\ell]$`<br>`flow on line $\ell$` | `$c^{exch}_n$`<br>`$\bar{F}^+_n$, $\bar{F}^-_n$`<br>`$\eta_n = 1 - \text{losses}/100$`<br>`$(1-\eta_n)(f^+ + f^-)$`<br>`the line efficiency $\eta_n$`<br>`$f^+_{n,k}$`<br>`$f^-_{n,k}$`<br>`$[0, \bar{F}^+_n]$`<br>`$[0, \bar{F}^-_n]$`<br>`flow on line $n$` | Transmission-line index: n replaces ℓ (ℓ is the AR lag) | overview/notation-conventions.md | ticket-018 | decided |
| `$p_{j,k}$`<br>`$[\underline{P}_j, \bar{P}_j]$`<br>`station $j$` | `$p_{y,k}$`<br>`$[\underline{P}_y, \bar{P}_y]$`<br>`station $y$` | Pumping-station index y replaces j (j is the thermal index) | overview/notation-conventions.md | ticket-018 | decided |
| `$b_{i,d,t}$`<br>`downstream plant $i$ at maturity lag $d$, stage $t$` | `$b^{\mathrm{out}}_{h,d}$`<br>`downstream plant $h$ at maturity lag $d$` | Outgoing in-transit bucket of receiving plant h: b^{out}_{h,d} replaces b_{i,d,t} (i is the cut index; the stage is implicit like every state) | overview/notation-conventions.md | ticket-018 | decided |
| `$d^i_t$` | `$g^{\mathrm{a}}_{i,t}$` | Anticipated commitment decided at stage t: g^{a}_{i,t} replaces d^i_t (d is the discount factor) | overview/notation-conventions.md | ticket-018 | decided |
| `(iteration 0, no cuts)` | `(before the first iteration, no cuts)` | 1-based iteration counter: the no-cut start precedes iteration 1 | examples/toy-single-reservoir.mdx | ticket-026 | decided |
| `` least-squares `alpha_FPHA` correction ``<br>`` the `alpha_FPHA` regression `` | `least-squares $k_{FPHA}$ correction`<br>`the $k_{FPHA}$ regression` | FPHA least-squares fit-correction factor: $k_{FPHA}$ replaces the code-formatted alpha_FPHA (α is the CVaR tail fraction; alpha_FPHA is no literal identifier at v0.17.0); the code-formatted `gamma_v` on the page is the literal `fpha_hyperplanes.parquet` column and stays | math/_impl/_hydro.configure.mdx | ticket-027 | decided |
| `(ψ, annual mean, annual std)` | `($\psi^{A*}_m$, annual mean, annual std)` | PAR(p)-A standardised annual coefficient in the fitted triple: ψ^{A*}_m replaces the bare ψ (bare ψ is the AR coefficient; the stored `annual_coefficient` is the dimensionless standardised coefficient) | math/_impl/_par.configure.mdx | ticket-027 | decided |
| `` Pre-computed cut intercept: `alpha - beta' * x_hat`, where `x_hat` is the state at the generating forward pass node. `` | `Pre-computed cut intercept $\beta_0 = \bar{Q}_t - \beta^\top \hat{x}_{t-1}$, where $\hat{x}_{t-1}$ is the state at the generating forward pass node and $\bar{Q}_t$ the aggregated stage value there.` | Stored cut intercept in registry symbols: β_0 = Q̄_t − βᵀx̂_{t-1}, the point-slope cut of the sddp-algorithm row evaluated at the origin (α is the CVaR tail fraction); the field names `intercept` and `coefficients` are literals and stay | reference/output-format.mdx | ticket-027 | decided |
| `future-cost function Q(v) = A·exp(-v/s)`<br>`Analytic derivative Q'(v).` | `future-cost function V(v) = A·exp(-v/s)`<br>`Analytic derivative V'(v).` | Plotted cost-to-go in the compute-module comments: V(v) and V′(v) replace Q(v) and Q′(v) (Q_t is the stage-LP value); the exported identifiers Q and dQ and the field q are code and stay | src/figures/valueFunction.ts | ticket-028 | decided |
| `E[C] ≈ 45 and E[C] < VaR < CVaR`<br>`E[C]=${expected}` | `E[Z] ≈ 45 and E[Z] < VaR < CVaR`<br>`E[Z]=${expected}` | Random cost of the risk figure in the test title and the assertion message: Z (the risk-measures body symbol) replaces C; no assertion, computation or exported name changes | src/figures/cvar.test.ts | ticket-028 | decided |
| `### Pumping Flow Bounds (per station $j$, block $k$)` | `### Pumping Flow Bounds (per station $y$, block $k$)` | Pumping-station index y in the lp-formulation §8 heading (XD-06 1A): completes row 18; the heading anchor has no inbound link (check:links re-verifies) | math/lp-formulation.md | ticket-020 | decided |
| `$NL$` | `$N P^{\max}$` | Maximum AR order P^{max} in the inflow-lag column count and the lag-fixing row count (XD-06 2A): completes row 11 (L is the last filling stage) | math/lp-formulation.md | ticket-020 | decided |
| `($KA$)` | `($K_{\max} A$)` | Ring depth K_{max} in the anticipated-state row count (XD-06 3A): completes row 12 (bare K is the cost-scale factor) | math/lp-formulation.md | ticket-020 | decided |
| `locked $K$ stages` | `locked $K_i$ stages` | Per-plant lead K_i of an anticipated thermal (XD-06 4A): completes row 12 | math/system-elements.mdx | ticket-020 | decided |
| `\sum_{j:\text{dest}=h} p_j`<br>`\sum_{j:\text{src}=h} p_j` | `\sum_{y:\text{dest}=h} p_y`<br>`\sum_{y:\text{src}=h} p_y` | Pumping-station index y in the water-balance term table (XD-06 5A): completes row 18 (j is the thermal index) | math/system-elements.mdx | ticket-020 | decided |
| `covering delivery stage $s$` | `covering delivery stage $s + 1$` | 1-based delivery stage of the pre-horizon seed (XD-06 6A): ring slot s, counted from 0, delivers at the 1-based stage s + 1 (the tag seeds slot s at 0-based stage s, `setup/mod.rs:2560-2568`) | math/lp-formulation.md | ticket-020 | decided |
| `w_k = \tau_k / \sum_j \tau_j` | `w_k = \tau_k / \sum_{k' \in \mathcal{K}} \tau_{k'}` | Block weight with the primed block dummy k' (XD-06 7B, the h' convention; j is the thermal index) | math/lp-formulation.md, math/block-formulations.mdx | ticket-020 | decided |
| `\min_{x_t \in \mathcal{X}_t(\omega_t)}` | `\min_{(x_t, u_t) \in \mathcal{X}_t(x_{t-1}, \omega_t)}` | Stage feasible set in the decided SDDP.jl form of row 57 (XD-08, XP-03): the membership binds the control u_t that c_t(x_t, u_t) uses, as the page's own §4 minimizes over x_t, u_t | math/discount-rate.mdx | ticket-023 | decided |
| `(x^{(n)}, \bar{v}^{(n)})` | `(x^{(I_t)}, \bar{v}^{(I_t)})` | Number of vertices stored at stage t: I_t replaces the vertex count n (XD-10; n is the enumerated-tree node on this page) | math/upper-bound-evaluation.md | ticket-031 | decided |
| `\prod_{s=1}^{t-1} d_{s \to s+1}` | `\prod_{t'=1}^{t-1} d_{t' \to t'+1}` | Stage dummy of the cumulative discount product: the primed stage dummy t' replaces s (XD-10, XD-11 3A; s is the deficit segment index of δ_{b,k,s} on this page) | math/discount-rate.mdx | ticket-031 | decided |
| `A^{(i)}`<br>`Z^{(i)}`<br>`\sum_{i}`<br>`\sum_i` | `A^{(w)}`<br>`Z^{(w)}`<br>`\sum_{w}`<br>`\sum_w` | PAR(p)-A rolling-window index w of a season bucket replaces the sample index i in §9.3 and §9.5 (XD-10; (i, j) index the Yule-Walker system on this page) | math/par-inflow-model.mdx | ticket-031 | decided |
| `d_{cycle}` | `d_{\text{cycle}}` | Cumulative discount around one cycle in its decided form d_{\text{cycle}}, the form horizon-modes, the glossary and the notation page write (XD-10, XD-11 2A) | math/discount-rate.mdx, math/upper-bound-evaluation.md | ticket-031 | decided |
| `AR($P$)` | `AR($P_h$)` | AR order of hydro h in the lag-state row of the state table: AR(P_h), the decided per-hydro order whose sum ∑_h P_h is the row's dimension (XD-10; bare P is not a registry symbol) | math/sddp-algorithm.mdx | ticket-031 | decided |
| `r_{h,k}` | `r_h` | Stage-level withdrawal target of system-elements: r_h replaces the per-block r_{h,k} (the target is one stage-level right-hand side of the water balance, `crates/cobre-sddp/src/lp/builder/rows.rs:107-114`) | math/system-elements.mdx | ticket-051 | decided |
| `\sigma^{r}_{h,k}` | `\sigma^{w-}_h, \sigma^{w+}_h` | The stage-level withdrawal slack pair of system-elements: the under- and over-delivery slacks σ^{w-}_h and σ^{w+}_h replace the single per-block σ^{r}_{h,k} (one stage-level slack column per direction, `crates/cobre-sddp/src/lp/builder/columns.rs:722-768`) | math/system-elements.mdx | ticket-051 | decided |
| `x^{\mathrm{a}}_{s,i,t}` | `x^{\mathrm{a}}_{s,i}` | Outgoing slot of an anticipated plant's commitment ring: the stage subscript drops, the ring being the stage's state (lp-formulation §5c `### Hold Ring`); the same old-form grep covers the fixed-slot forms `x^{\mathrm{a}}_{0,i,t}`, `x^{\mathrm{a}}_{1,i,t}` and `x^{\mathrm{a}}_{K_i - 1,i,t}` that ticket-065 rewrites on system-elements | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | ticket-063, ticket-065 | decided (E05 refinement, XD-03) |
| `\widehat{x}^{\mathrm{a}}_{s, i, t}` | `\hat{x}^{\mathrm{a}}_{s,i}` | Trial value of an anticipated slot: the trial-value hat `\hat{x}` of §1.1 replaces `\widehat{x}`, and the stage subscript drops | math/lp-formulation.md | ticket-063 | decided (E05 refinement, XD-03) |
| `K_{\max}` | `k_{max}` | Number of slots in every anticipated plant's commitment ring: `k_{max} = \max_i K_i` replaces the maximum lead `K_{\max}` (lp-formulation §5c `### Hold Ring`) | math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md | ticket-063, ticket-064, ticket-065 | decided (E05 refinement, XD-03) |
| `Q_{ev,h}` | `e_h` | Signed net evaporation of penalty-system §5 in its decided form e_h (e_{h,k} per block on a chronological stage) | math/penalty-system.mdx | ticket-075 | decided |
| `c^{th}_{j,s}` | `c^{th}_j` | Thermal marginal cost: the one cost per MWh of thermal j, c^{th}_j, replaces the per-segment cost c^{th}_{j,s} (one `cost_per_mwh` per thermal, overridden per stage only, `crates/cobre-core/src/entities/thermal.rs:49-50`, `crates/cobre-io/src/constraints/bounds.rs:17,102`) | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | ticket-078 | decided |
| `\sum_{s} g_{j,k,s}`<br>`\sum_s g_{j,k,s}`<br>`g_{j,k,s}` | `g_{j,k}`<br>`g_{j,k}`<br>`g_{j,k}` | Thermal generation: the one generation column per thermal per block, g_{j,k}, replaces the per-segment columns g_{j,k,s} and their sum over s; the two sum forms are listed first so that they apply before the bare form (`crates/cobre-sddp/src/lp/builder/columns.rs:370-384`) | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | ticket-078 | decided |
| `\bar{g}_{j,s}` | (removed) | Thermal cost-segment capacity: a thermal has no cost segment, so the segment bound and its capacity parameter are deleted (`system/thermals.json` carries `cost_per_mwh` and `generation.min_mw`/`generation.max_mw` only, `crates/cobre-io/src/system/thermals.rs:73-106`) | math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | ticket-078 | decided |
| `A_r`<br>`A_{r}` | `A_{r,k}`<br>`A_{r,k}` | Non-controllable block cap A_{r,k} = \bar G_r \xi_r f_{r,k} (block factors applied) | math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md | ticket-079 | decided |
| `c^{fpha}_h`<br>`c^{t}_h` | `c^{tc}_h`<br>`c^{tc}_h` | One turbined-cost symbol on every hydro's turbine columns (ledger PEN-08) | math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md | ticket-080 | decided |
| `c^{inf}` | `c^{inf}_h` | Inflow non-negativity penalty indexed by hydro (the cost resolves per hydro) | math/inflow-nonnegativity.md | ticket-081 | decided |
| `A storage-dependent production or evaporation coefficient $\gamma_v$ therefore enters the block-$k$ constraint as $-\gamma_v/2$ on **both** bounding storage columns $v_{h,k-1}$ and $v_{h,k}$, so the block sees the mean of its entry and exit storage.` | `Each storage coefficient therefore enters the block-$k$ row as minus half its value on **both** bounding storage columns $v_{h,k-1}$ and $v_{h,k}$, so the block sees the mean of its entry and exit storage: the FPHA plane storage coefficient $\gamma_v^m$, apportioned to cell $(h,b)$ by $\lambda_{h,b}$, as $-\lambda_{h,b}\,\gamma_v^m/2$ in that cell's row for the plane, and the evaporation storage slope $\gamma^{ev}_{v,h}$ as $-\gamma^{ev}_{v,h}/2$ in the evaporation row.` | Storage coefficient of a storage-dependent row on block-formulations §2.4, split by row: the FPHA plane storage coefficient `\gamma_v^m`, apportioned by `\lambda_{h,b}`, and the evaporation storage slope `\gamma^{ev}_{v,h}`, each entering the block-k row as minus half its value on `v_{h,k-1}` and on `v_{h,k}` (`crates/cobre-sddp/src/lp/builder/entries.rs:1018-1021,1094-1095`); retires the §2 row `\gamma_v` | math/block-formulations.mdx | ticket-155 | decided |
| `\phi(v, q, s) = \rho_{esp} \cdot q \cdot h_{net}`<br>`\phi = \rho_{esp} \cdot q \cdot h_{net}`<br>`$\rho_{esp} = 9.81\,\eta_h / 1000$ (MW·s/m⁴), with constant efficiency $\eta_h$ per plant` | `\phi(v, q, s) = (9.81\,\eta_h/1000) \cdot q \cdot h_{net}`<br>`\phi = (9.81\,\eta_h/1000) \cdot q \cdot h_{net}`<br>`$\eta_h$ = turbine efficiency (section 1), constant per plant; the factor $9.81\,\eta_h/1000$ (MW·s/m⁴) converts hydraulic power to electrical power` | Fit constant of the exact production function and the FPHA fit, `9.81\,\eta_h/1000` (`crates/cobre-sddp/src/production/fpha_fitting/production.rs:39`, `:145-148`), written inline so that `\rho_{esp}` names only the authored specific productivity (C2 = A, XD-330). The §2.4 opening sentence, its `\rho_{esp,h}` display equation and its closing sentence are rewritten as one paragraph (ticket-159 orchestrator edit OE-14c), which the pairs do not reproduce | math/hydro-production-models.mdx | ticket-159 | decided |
<!-- prettier-ignore-end -->

## 5. Stale-form greps

One `grep` per §4 row, in §4 order (GNU grep 3.x, ERE, run from the repository root with a UTF-8 locale). Each
matches the row's old forms on its pages today; after the rename tickets land, ticket-031 replays the block and
expects no output. The corpus-wide replay (§6) runs every pattern, with its options, over
`src/content/docs src/figures src/components` (excluding `pt-br/`) and calls GNU grep as `/usr/bin/grep` (XN-02);
a grep narrowed against legitimate text elsewhere carries a `# narrowed` note under its row label.

```bash
# §4 row 1 (ticket-020)
grep -rnE '\\pi\^(v|\{v|\{lag\}|\{b\})|\\bar\{?\\pi|\\pi_(k|t|j)\b|\\pi_\{t,|\\pi\(\\omega|\\pi\^\{?\\top|\\pi_i\^\\top|\\nabla|vector \$\\pi\$|πᵀ|π̄|E\[π\]|→ π"' src/content/docs/math/lp-formulation.md src/content/docs/math/block-formulations.mdx
# §4 row 2 (ticket-020)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π' src/content/docs/math/lp-formulation.md
# §4 row 3 (ticket-020)
# narrowed (ticket-031, XP-08): `h_b` -> `\bh_b\b`; the bare substring matched the identifier `cut_batch_build_ms` on reference/output-format.
grep -rnE '\[0, T - 1\]|\bh_b\b|g_\{i, ?b, ?t\}|\\sum_\{b = 0\}\^\{B - 1\}|t \+ K_i < T|t \+ K_i \\geq T|at \$t = 0\$|at \$t < K_i\$|From \$t \\geq K_i\$|\\\{0, \\ldots, A - 1\\\}|\\sum_\{i = 0\}\^\{A - 1\}|stages \$0, \\ldots, K_i - 1\$|from \$0\$ to \$K_i - 1\$|From stage \$K_i\$ onward' src/content/docs/math/lp-formulation.md
# §4 row 4 (ticket-020)
# narrowed (ticket-031, XP-08): `h_b` -> `\bh_b\b`; the bare substring matched the identifier `cut_batch_build_ms` on reference/output-format.
grep -rnE '\[0, T - 1\]|\bh_b\b|g_\{i, ?b, ?t\}|\\sum_\{b = 0\}\^\{B - 1\}|t \+ K_i < T|t \+ K_i \\geq T|at \$t = 0\$|at \$t < K_i\$|From \$t \\geq K_i\$|\\\{0, \\ldots, A - 1\\\}|\\sum_\{i = 0\}\^\{A - 1\}|stages \$0, \\ldots, K_i - 1\$|from \$0\$ to \$K_i - 1\$|From stage \$K_i\$ onward' src/content/docs/math/system-elements.mdx
# §4 row 5 (ticket-020)
grep -rnE '\\psi_\\ell|\\mu_t - \\sum|\\sigma_t \\cdot \\varepsilon_t\}_\{\\text\{stochastic|\\ell \\in \\\{0, \\ldots, L-1\\\}|\\text\{deterministic\\_base\}|\\mu_m - \\sum_\{\\ell=1\}\^\{p\} \\psi_\{m,\\ell\} \\mu_\{m-\\ell\}\}_\{\\text\{deterministic|The incremental inflow \$a_h\$ is determined' src/content/docs/math/lp-formulation.md
# §4 row 6 (ticket-020)
grep -rnE '\\psi_\\ell|\\mu_t - \\sum|\\sigma_t \\cdot \\varepsilon_t\}_\{\\text\{stochastic|\\ell \\in \\\{0, \\ldots, L-1\\\}|\\text\{deterministic\\_base\}|\\mu_m - \\sum_\{\\ell=1\}\^\{p\} \\psi_\{m,\\ell\} \\mu_\{m-\\ell\}\}_\{\\text\{deterministic|The incremental inflow \$a_h\$ is determined' src/content/docs/math/inflow-nonnegativity.md
# §4 row 7 (ticket-020)
grep -rnE 'f\^[+-]_\{(l|\\ell),|\\bar\{F\}\^[+-]_(l|\\ell)\b|\^\{exch\}_(l|\\ell)\b|\\eta_\\ell|\\text\{loss\}_\{\\ell|\\sum_\{l[ :]|line \$l\$|f_\\ell\b|\\ell \\in \\mathcal\{L\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 8 (ticket-020)
grep -rnE '\\sigma_\{h,b\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 9 (ticket-020)
grep -rnE '_\{i,d|_\{i,1\}|L_i\b|\\phi_\{i,k\}|v\^\{\\mathrm\{in\}\}_i|\\sum_i L_i|v_i - v|receiving \(downstream\) plant \$i\$|into plant \$i\$|receiving plant \$i\$|feeding \$i\$|destined for \$i\$|arc into \$i\$|b_\{i,d\}' src/content/docs/math/lp-formulation.md
# §4 row 10 (ticket-020)
grep -rnE '[qsu]_\{i,k\}|\\sum_\{i \\in \\mathcal\{U\}_h\}|\\sum_\{i: ?\\text\{div\}|q_i \+ s_i \+ u_i|\\sum_\{u \\in \\text\{upstream\}\}|q_u \+ s_u' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 11 (ticket-020)
grep -rnE 'N\(1 ?\+ ?L\)|N \\times L|N \\cdot L|\$L\$ = maximum|\$L\$ is the system-wide|store \$L\$ lags|P_h < L|\$L = 2\$|\\\{0, \\ldots, L-1\\\}' src/content/docs/math/lp-formulation.md
# §4 row 12 (ticket-020)
grep -rnE '\$K = K_\{\\max\}|\$K A\$|\\\{0, \\ldots, K - 1\\\}|\$K \\geq 1\$|\$t \+ K\$|per-plant lead \$K\$' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 13 (ticket-020)
grep -rnE 'T = \\sum_k \\tau_k|\\cdot T\b|stage hours \$T\$|\} T \\cdot' src/content/docs/math/lp-formulation.md src/content/docs/math/inflow-nonnegativity.md
# §4 row 14 (ticket-020)
grep -rnE '\\mathrm\{NPV\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 15 (ticket-020)
grep -rnE 'd\^i' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 16 (ticket-020)
grep -rnE '\\mathrm\{clamp\}\(\\mu \+|\\eta \\approx' src/content/docs/math/system-elements.mdx
# §4 row 17 (ticket-020)
grep -rnE '"Demand d"|: "d"$|\(`d`\)|`d` demand' src/content/docs/math/system-elements.mdx
# §4 row 18 (ticket-020)
grep -rnE 'p_\{j,k\}|\\gamma_j\b|P\}_j\b|P\^\{pump\}_\{j|j \\in \\mathcal\{P\}|station \$j\$|\\sum_\{j: \\text\{(dest|src)\}|\$p_j\$' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx
# §4 row 19 (ticket-020)
grep -rnE 'g \\,\\in\\,|[QG]\}_g\b|fold\}\(g\)' src/content/docs/math/lp-formulation.md
# §4 row 20 (ticket-020)
grep -rnE '\\ell_g|(^|[^a-z{])u_g\b' src/content/docs/math/lp-formulation.md
# §4 row 21 (ticket-020)
grep -rnE '\\chi_r' src/content/docs/math/system-elements.mdx
# §4 row 22 (ticket-021)
grep -rnE 'f\^[+-]_\{(l|\\ell),|\\bar\{F\}\^[+-]_(l|\\ell)\b|\^\{exch\}_(l|\\ell)\b|\\eta_\\ell|\\text\{loss\}_\{\\ell|\\sum_\{l[ :]|line \$l\$|f_\\ell\b|\\ell \\in \\mathcal\{L\}' src/content/docs/math/equipment-formulations.mdx
# §4 row 23 (ticket-021)
grep -rnE 'p_\{j,k\}|\\gamma_j\b|P\}_j\b|P\^\{pump\}_\{j|j \\in \\mathcal\{P\}|station \$j\$|\\sum_\{j: \\text\{(dest|src)\}|\$p_j\$' src/content/docs/math/equipment-formulations.mdx
# §4 row 24 (ticket-021)
grep -rnE '\\sigma_\{h,b\}' src/content/docs/math/hydro-production-models.mdx
# §4 row 25 (ticket-021)
grep -rnE '\\alpha_\{FPHA\}|alpha_FPHA' src/content/docs/math/hydro-production-models.mdx
# §4 row 26 (ticket-021)
grep -rnE '\^\{\(k\)\}' src/content/docs/math/hydro-production-models.mdx
# §4 row 27 (ticket-021)
grep -rnE 'v_i\b|v_\{i\+1\}|h_i\b|h_\{i\+1\}|plant \$i\$.s tailrace' src/content/docs/math/hydro-production-models.mdx
# §4 row 28 (ticket-021)
grep -rnE '\\pi\^v_h|total sensitivity \$\\partial Q_t' src/content/docs/math/hydro-production-models.mdx
# §4 row 29 (ticket-021)
grep -rnE 'g \\,\\in\\,|[QG]\}_g\b|fold\}\(g\)' src/content/docs/math/hydro-production-models.mdx
# §4 row 30 (ticket-022)
grep -rnE '_\{m,j\}|\\, t-j\}|\\sum_\{j=|\\min\(j,|\\ell - j\||row \$k\$|s_\{m-k\}|\\gamma_j\^\{\(m\)\}|\\gamma_0\^\{\(m\)\}|\\rho_m\(j\)|lag \$k = 1|season \$k\$ calendar|\\rho_m\(k\)|lag-\$\\tau\$|_\{m,\\tau\}|s_\{m-\\tau\}|t - 11 \+ j' src/content/docs/math/par-inflow-model.mdx
# §4 row 31 (ticket-022)
# narrowed (ticket-200, XD-283): scoped to par-inflow-model.mdx; `src/figures/fpha.test.ts` and `src/components/FphaPlot.astro` write `(i + 1)` as a code index expression (XD-07).
grep -rnE --include=par-inflow-model.mdx '0-indexed|0 \\leq i,j < p|t-\(i\+1\)|t-\(j\+1\)|m - 1 - \\min\(i,j\)|\(i \+ 1\)|lag \$i\{\+\}1\$|\\boldsymbol\{r\}|m = 0,\\ldots,M-1' src/content/docs/math/par-inflow-model.mdx
# §4 row 32 (ticket-022)
grep -rnE 'z_\\alpha' src/content/docs/math/par-inflow-model.mdx
# §4 row 33 (ticket-022)
grep -rnE 'p_\{\\max\} = \\max_m p_m|\\ell = 1,\\ldots,p_\{\\max\}' src/content/docs/math/par-inflow-model.mdx
# §4 row 34 (ticket-022)
grep -rnE '\\hat\{?\\psi\}?(_\{?m|\$)|coefficient \$\\psi\$|\\psi \\cdot|\\psi\)|\\\\ \\psi \\end|\| \$\\psi\$ ' src/content/docs/math/par-inflow-model.mdx
# §4 row 35 (ticket-022)
grep -rnE '\\lambda\\, ?s_m|\\lambda\\,\\sigma\^A_m' src/content/docs/math/par-inflow-model.mdx
# §4 row 36 (ticket-022)
grep -rnE 'record length \$N\$|When \$N\$ is close' src/content/docs/math/par-inflow-model.mdx
# §4 row 37 (ticket-022)
grep -rnE 'a_\{h,t-\\ell\} = \\hat\{a\}_\{h,t-\\ell\}|\$\\hat\{a\}_\{h,t-\\ell\}\$|lagged inflows \$a_\{h,t-\\ell\}\$ are|\\sum_\\ell \\psi \\cdot' src/content/docs/math/par-inflow-model.mdx
# §4 row 38 (ticket-022)
grep -rnE '\\phi_m' src/content/docs/math/scenario-generation.mdx
# §4 row 39 (ticket-022)
grep -rnE '\\Sigma = V|V \\operatorname\{diag\}|V\^T|D = V|\\varepsilon = D' src/content/docs/math/scenario-generation.mdx
# §4 row 40 (ticket-022)
grep -rnE 'z_h\^\{\(t\)\}' src/content/docs/math/scenario-generation.mdx
# §4 row 41 (ticket-022)
grep -rnE 'sampling \$n\$ openings|sample \$n\$ openings' src/content/docs/math/scenario-generation.mdx
# §4 row 42 (ticket-022)
grep -rnE 'j \\in \\\{0, \\ldots, N' src/content/docs/math/scenario-generation.mdx
# §4 row 43 (ticket-022)
grep -rnE '\\prod_\{s=1\}' src/content/docs/math/scenario-generation.mdx
# §4 row 44 (ticket-022)
grep -rnE '\\max_\{k \\in \\mathcal\{K\}_\\tau\}|\\alpha_k \+ \\pi_k\^\{\\top\}' src/content/docs/math/horizon-modes.md
# §4 row 45 (ticket-022)
grep -rnE '(^|[^{a-z])T_\\tau' src/content/docs/math/horizon-modes.md
# §4 row 46 (ticket-022)
grep -rnE 'threshold \$1\.96 / \\sqrt\{N_m\}\$' src/content/docs/math/scenario-generation.mdx
# §4 row 47 (ticket-022)
grep -rnE '\\sum_\{\\ell=1\}\^\{P\}|upper index \$P\$' src/content/docs/math/scenario-generation.mdx
# §4 row 48 (ticket-023)
grep -rnE '\\pi\^(v|\{v|\{lag\}|\{b\})|\\bar\{?\\pi|\\pi_(k|t|j)\b|\\pi_\{t,|\\pi\(\\omega|\\pi\^\{?\\top|\\pi_i\^\\top|\\nabla|vector \$\\pi\$|πᵀ|π̄|E\[π\]|→ π"' src/content/docs/math/discount-rate.mdx
# §4 row 49 (ticket-023)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π' src/content/docs/math/post-study-boundary.md src/content/docs/math/discount-rate.mdx
# §4 row 50 (ticket-024)
grep -rnE '\\pi\^(v|\{v|\{lag\}|\{b\})|\\bar\{?\\pi|\\pi_(k|t|j)\b|\\pi_\{t,|\\pi\(\\omega|\\pi\^\{?\\top|\\pi_i\^\\top|\\nabla|vector \$\\pi\$|πᵀ|π̄|E\[π\]|→ π"' src/content/docs/math/sddp-algorithm.mdx src/content/docs/math/cut-management.mdx src/content/docs/math/risk-measures.mdx
# §4 row 51 (ticket-024)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π' src/content/docs/math/sddp-algorithm.mdx
# §4 row 52 (ticket-024)
grep -rnE 'renamed here to avoid collision|not \$q\$, which denotes turbined flow|This is the standard convention in the risk measure literature' src/content/docs/math/risk-measures.mdx
# §4 row 53 (ticket-024)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π' src/content/docs/math/cut-management.mdx src/content/docs/math/risk-measures.mdx
# §4 row 54 (ticket-024)
grep -rnE '\\alpha_k|\\pi_k|\\max_k|\\text\{cut \} k|cut \$k\$|\\max_\{j \\neq k\}|\\alpha_j|\\pi_j\^' src/content/docs/math/cut-management.mdx
# §4 row 55 (ticket-024)
# narrowed (ticket-031): scoped to cut-management.mdx; `PAR($p$)` is legitimate where `p` is the AR-order letter (par-inflow-model, lp-formulation, `_par.io`; XD-07).
grep -rnE --include=cut-management.mdx 'N\(1 ?\+ ?L\)|N \\times L|N \\cdot L|\$L\$ = maximum|\$L\$ is the system-wide|store \$L\$ lags|P_h < L|\$L = 2\$|\\\{0, \\ldots, L-1\\\}|PAR\(\$p\$\)|PAR\(\$p > 0\$\)' src/content/docs/math/cut-management.mdx
# §4 row 56 (ticket-024)
grep -rnE 'each \$n\$-th iteration' src/content/docs/math/cut-management.mdx
# §4 row 57 (ticket-024)
grep -rnE 'c_t\^\\top|c_t\(\\omega_t\)\^\\top|\\min_\{x_t\}|\\min_\{x_1, \\ldots, x_T\}|decisions \$x_t\$|A_t x_t = b_t' src/content/docs/math/sddp-algorithm.mdx src/content/docs/math/risk-measures.mdx
# §4 row 58 (ticket-024)
grep -rnE 'forward pass \$k\$' src/content/docs/math/sddp-algorithm.mdx
# §4 row 59 (ticket-024)
grep -rnE 'y\^\{i\}_\{k\}|\$b_\{i,d\}\$|receiving plant \$i\$' src/content/docs/math/sddp-algorithm.mdx
# §4 row 60 (ticket-024)
grep -rnE 'bound \$\\sum_\\ell P\(\\ell\)\\, C\(\\ell\)\$ over every leaf' src/content/docs/math/sddp-algorithm.mdx
# §4 row 61 (ticket-024)
grep -rnE 'probability \$p = 1\$' src/content/docs/math/sddp-algorithm.mdx
# §4 row 62 (ticket-024)
grep -rnE 'ξ[₁₂₃]|N openings' src/content/docs/math/sddp-algorithm.mdx
# §4 row 63 (ticket-024)
grep -rnE '\\hat\{V\}_t\^k' src/content/docs/math/sddp-algorithm.mdx
# §4 row 64 (ticket-024)
# narrowed (ticket-031): scoped to sddp-algorithm.mdx; `src/figures/valueFunction.ts` writes `Q(v)` as a call of its exported identifier `Q` (code; row 105 guards its comments).
grep -rnE --include=sddp-algorithm.mdx 'Q.?\(v\)' src/content/docs/math/sddp-algorithm.mdx
# §4 row 65 (ticket-024)
grep -rnE 'sampling \$n\$ openings|sample \$n\$ openings' src/content/docs/math/sddp-algorithm.mdx
# §4 row 66 (ticket-024)
grep -rnE 'j \\in \\\{0, \\ldots, N' src/content/docs/math/sddp-algorithm.mdx
# §4 row 67 (ticket-024)
grep -rnE '\\lambda\(\\tilde\{x\}, \\omega\)' src/content/docs/math/risk-measures.mdx
# §4 row 68 (ticket-024)
grep -rnE 'confidence level|\(1-\\alpha\)\$ tail' src/content/docs/math/risk-measures.mdx
# §4 row 69 (ticket-024)
# narrowed (ticket-031): scoped to risk-measures.mdx; upper-bound-evaluation writes `\mathbb{E}[C]` for its total simulated cost `C` (§2 total-cost row; XP-07).
grep -rnE --include=risk-measures.mdx 'f\(C\)|\\mathbb\{E\}\[C\]|\[C\]' src/content/docs/math/risk-measures.mdx
# §4 row 70 (ticket-020)
grep -rnE '\\hat\{A\}_\{ij\}|\\hat\{l\}_i\^\{row\}|\\hat\{u\}_i\^\{row\}' src/content/docs/math/lp-formulation.md
# §4 row 71 (ticket-025)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π|\\pi\^(v|\{v|\{lag\}|\{b\})|\\bar\{?\\pi|\\pi_(k|t|j)\b|\\pi_\{t,|\\pi\(\\omega|\\pi\^\{?\\top|\\pi_i\^\\top|\\nabla|vector \$\\pi\$|πᵀ|π̄|E\[π\]|→ π"' src/content/docs/overview/sddp-framework-overview.mdx
# §4 row 72 (ticket-025)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π|\\pi\^(v|\{v|\{lag\}|\{b\})|\\bar\{?\\pi|\\pi_(k|t|j)\b|\\pi_\{t,|\\pi\(\\omega|\\pi\^\{?\\top|\\pi_i\^\\top|\\nabla|vector \$\\pi\$|πᵀ|π̄|E\[π\]|→ π"' src/content/docs/math/upper-bound-evaluation.md
# §4 row 73 (ticket-025)
grep -rnE 'c_t\^\\top|c_t\(\\omega_t\)\^\\top|\\min_\{x_t\}|\\min_\{x_1, \\ldots, x_T\}|decisions \$x_t\$|A_t x_t = b_t' src/content/docs/math/upper-bound-evaluation.md src/content/docs/overview/sddp-framework-overview.mdx
# §4 row 74 (ticket-025)
grep -rnE 'sample weight \$1/N\$' src/content/docs/math/upper-bound-evaluation.md
# §4 row 75 (ticket-025)
grep -rnE 'C_i\b|w_i\b|c_t\^\{\(i\)\}|scenario \$i\$|\\sum_\{i=1\}\^\{N\}' src/content/docs/math/upper-bound-evaluation.md
# §4 row 76 (ticket-025)
grep -rnE '\\text\{(relative )?tolerance\}' src/content/docs/math/stopping-rules.mdx
# §4 row 77 (ticket-025)
grep -rnE 'confidence level|\(1-\\alpha\)\$ tail' src/content/docs/overview/sddp-framework-overview.mdx
# §4 row 78 (ticket-026)
grep -rnE '\\pi\^(v|\{v|\{lag\}|\{b\})|\\bar\{?\\pi|\\pi_(k|t|j)\b|\\pi_\{t,|\\pi\(\\omega|\\pi\^\{?\\top|\\pi_i\^\\top|\\nabla|vector \$\\pi\$|πᵀ|π̄|E\[π\]|→ π"' src/content/docs/examples/toy-single-reservoir.mdx src/content/docs/examples/toy-four-reservoir.mdx src/content/docs/reference/glossary.md
# §4 row 79 (ticket-026)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π' src/content/docs/examples/toy-single-reservoir.mdx src/content/docs/examples/toy-four-reservoir.mdx src/content/docs/reference/glossary.md
# §4 row 80 (ticket-026)
grep -rnE '\\hat\{V\}_t\^k' src/content/docs/examples/toy-single-reservoir.mdx src/content/docs/examples/toy-four-reservoir.mdx
# §4 row 81 (ticket-026)
grep -rnE '\\hat v_[0-3] = \(|(^|[^a-z_\\{])v_[1-3] = \(|\$\\hat v_3\$ \||At \$v = \\hat v_3|\$\\hat v_\{t-1\}\$|flows to terminal \$v_4\$' src/content/docs/examples/toy-four-reservoir.mdx
# §4 row 82 (ticket-026)
grep -rnE '[qsu]_\{i,k\}|\\sum_\{i \\in \\mathcal\{U\}_h\}|\\sum_\{i: ?\\text\{div\}|q_i \+ s_i \+ u_i|\\sum_\{u \\in \\text\{upstream\}\}|q_u \+ s_u' src/content/docs/examples/toy-four-reservoir.mdx
# §4 row 83 (ticket-026)
grep -rnE 'L\\, z|L L\^\{\\top\} = \\Sigma|\$\\Sigma\$' src/content/docs/examples/toy-four-reservoir.mdx src/content/docs/reference/glossary.md
# §4 row 84 (ticket-026)
grep -rnE 'p = 1/N\$|p_\\omega = 1/N\$|[Oo]penings per stage +\| \$N\$ +\|' src/content/docs/examples/toy-single-reservoir.mdx src/content/docs/examples/toy-four-reservoir.mdx src/content/docs/reference/glossary.md
# §4 row 85 (ticket-026)
grep -rnE 'Lead stages \(\$K\$\)|where \$K = \$|stage \$t \+ K\$' src/content/docs/reference/glossary.md
# §4 row 86 (ticket-026)
grep -rnE '\\mu_m, \\sigma_m' src/content/docs/reference/glossary.md
# §4 row 87 (ticket-026)
grep -rnE 'c_t\^\\top|c_t\(\\omega_t\)\^\\top|\\min_\{x_t\}|\\min_\{x_1, \\ldots, x_T\}|decisions \$x_t\$|A_t x_t = b_t' src/content/docs/reference/glossary.md
# §4 row 88 (ticket-026)
grep -rnE 'at level \$\\alpha\$|worst \$\\alpha\\%\$' src/content/docs/reference/glossary.md
# §4 row 89 (ticket-026)
grep -rnE 'stage-zero LP' src/content/docs/overview/what-cobre-solves.md
# §4 row 90 (ticket-027)
grep -rnE '\\alpha_\{FPHA\}|alpha_FPHA' src/content/docs/math/_impl/_hydro.notes.mdx
# §4 row 91 (ticket-027)
grep -rnE 'reconstructs \$\\psi\$ and \$\\sigma\$' src/content/docs/math/_impl/_par.io.mdx
# §4 row 92 (ticket-028)
grep -rnE 'E\[C|f\(C\)|total cost C|C ~ Gamma|quantile of C|\(1−alpha\) tail|\(1−α\) tail' src/figures/cvar.ts src/components/CvarPlot.astro
# §4 row 93 (ticket-028)
# narrowed (ticket-031): scoped to ValueFunctionPlot.astro; `src/figures/valueFunction.ts` writes `Q(v)` as a call of its exported identifier `Q` (code; row 105 guards its comments).
grep -rnE --include=ValueFunctionPlot.astro 'Q.?\(v\)' src/components/ValueFunctionPlot.astro
# §4 row 94 (ticket-018)
grep -rnE 'Epigraph variable approximating \$V_\{t\}\$' src/content/docs/overview/notation-conventions.md
# §4 row 95 (ticket-018)
grep -rnE '\\alpha_(i|k|j)\b|\\alpha\(\\omega|\\alpha_t\(|\\alpha_t = |\\(bar|hat)\{?\\alpha|\\alpha_\{scaled\}|\\alpha (\\;)?\+|intercept \$\\alpha\$|scalar \$\\alpha\$|\$\\alpha\$ is the cut intercept|\(\\alpha, \\pi|ᾱ|E\[α\]|α \+ π' src/content/docs/overview/notation-conventions.md
# §4 row 96 (ticket-018)
grep -rnE '\\alpha_\{FPHA\}|alpha_FPHA|distinct from the Benders cut intercept' src/content/docs/overview/notation-conventions.md
# §4 row 97 (ticket-018)
grep -rnE 'f\^[+-]_\{(l|\\ell),|\\bar\{F\}\^[+-]_(l|\\ell)\b|\^\{exch\}_(l|\\ell)\b|\\eta_\\ell|\\text\{loss\}_\{\\ell|\\sum_\{l[ :]|line \$l\$|f_\\ell\b|\\ell \\in \\mathcal\{L\}|line \$\\ell\$' src/content/docs/overview/notation-conventions.md
# §4 row 98 (ticket-018)
grep -rnE 'p_\{j,k\}|\\gamma_j\b|P\}_j\b|P\^\{pump\}_\{j|j \\in \\mathcal\{P\}|station \$j\$|\\sum_\{j: \\text\{(dest|src)\}|\$p_j\$' src/content/docs/overview/notation-conventions.md
# §4 row 99 (ticket-018)
grep -rnE 'b_\{i,d,t\}|downstream plant \$i\$ at maturity' src/content/docs/overview/notation-conventions.md
# §4 row 100 (ticket-018)
grep -rnE 'd\^i' src/content/docs/overview/notation-conventions.md
# §4 row 101 (ticket-026)
grep -rnE 'iteration 0, no cuts' src/content/docs/examples/toy-single-reservoir.mdx
# §4 row 102 (ticket-027)
grep -rnE 'alpha_FPHA' src/content/docs/math/_impl/_hydro.configure.mdx
# §4 row 103 (ticket-027)
grep -rnE '\(ψ, annual mean' src/content/docs/math/_impl/_par.configure.mdx
# §4 row 104 (ticket-027)
grep -rnE 'alpha - beta|x_hat' src/content/docs/reference/output-format.mdx
# §4 row 105 (ticket-028)
grep -rnE '(//|\*).*Q.?\(v\)' src/figures/valueFunction.ts
# §4 row 106 (ticket-028)
grep -rnE 'E\[C' src/figures/cvar.test.ts
# §4 row 107 (ticket-020)
grep -rnE 'Pumping Flow Bounds \(per station \$j\$' src/content/docs/math/lp-formulation.md
# §4 row 108 (ticket-020)
grep -rnE '\$NL\$' src/content/docs/math/lp-formulation.md
# §4 row 109 (ticket-020)
grep -rnE '\(\$KA\$\)' src/content/docs/math/lp-formulation.md
# §4 row 110 (ticket-020)
grep -rnE 'locked \$K\$ stages' src/content/docs/math/system-elements.mdx
# §4 row 111 (ticket-020)
grep -rnE '\\sum_\{j:\\text\{(dest|src)\}=h\} p_j' src/content/docs/math/system-elements.mdx
# §4 row 112 (ticket-020)
grep -rnE 'covering delivery stage \$s\$' src/content/docs/math/lp-formulation.md
# §4 row 113 (ticket-020)
grep -rnE '\\sum_j \\tau_j' src/content/docs/math/lp-formulation.md src/content/docs/math/block-formulations.mdx
# §4 row 114 (ticket-023)
grep -rnE '\\min_\{x_t \\in \\mathcal\{X\}_t\(\\omega_t\)\}' src/content/docs/math/discount-rate.mdx
# §4 row 115 (ticket-031)
grep -rnE 'x\^\{\(n\)\}' src/content/docs/math/upper-bound-evaluation.md
# §4 row 116 (ticket-031)
grep -rnE '\\prod_\{s=1\}\^\{t-1\}|d_\{s \\to s\+1\}' src/content/docs/math/discount-rate.mdx
# §4 row 117 (ticket-031)
grep -rnE '[AZ]\^\{\(i\)\}' src/content/docs/math/par-inflow-model.mdx
# §4 row 118 (ticket-031)
grep -rnE 'd_\{cycle\}' src/content/docs/math/discount-rate.mdx src/content/docs/math/upper-bound-evaluation.md
# §4 row 119 (ticket-031)
grep -rnE 'AR\(\$P\$\)' src/content/docs/math/sddp-algorithm.mdx
# §4 row 120 (ticket-051)
grep -rnE 'r_\{h,k\}' src/content/docs/math/system-elements.mdx
# §4 row 121 (ticket-051)
grep -rnE '\\sigma\^\{r\}' src/content/docs/math/system-elements.mdx
# §4 row 122 (ticket-063)
grep -rnE 'x\}?\^\{\\mathrm\{a\}\}_\{[^}]*,[ ]*t[ ]*(\+[ ]*1)?\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/overview/notation-conventions.md
# §4 row 123 (ticket-063)
grep -rnF '\widehat{x}^{\mathrm{a}}' src/content/docs/math/lp-formulation.md
# §4 row 124 (ticket-063)
grep -rnF 'K_{\max}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/overview/notation-conventions.md
# §4 row 125 (ticket-075)
grep -rnE 'Q_\{ev' src/content/docs/math/penalty-system.mdx
# §4 row 126 (ticket-078)
grep -rnE 'c\^\{th\}_\{j,s\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/math/equipment-formulations.mdx src/content/docs/overview/notation-conventions.md
# §4 row 127 (ticket-078)
grep -rnE 'g_\{j,k,s\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/math/equipment-formulations.mdx src/content/docs/overview/notation-conventions.md
# §4 row 128 (ticket-078)
grep -rnE '\\bar\{g\}_\{j,s\}' src/content/docs/math/system-elements.mdx src/content/docs/math/equipment-formulations.mdx src/content/docs/overview/notation-conventions.md
# §4 row 129 (ticket-079)
grep -rnE '(^|[ ${(\[,])A_r([^a-zA-Z0-9_{]|$)|A_\{r\}' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/math/equipment-formulations.mdx src/content/docs/overview/notation-conventions.md
# §4 row 130 (ticket-080)
grep -rnE 'c\^\{fpha\}|c\^\{t\}_h' src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/math/hydro-production-models.mdx src/content/docs/overview/notation-conventions.md
# §4 row 131 (ticket-081)
grep -rnE 'c\^\{inf\}([^_}]|$)' src/content/docs/math/inflow-nonnegativity.md
# §4 row 132 (ticket-155)
grep -rnE '\\gamma_v([^^]|$)' src/content/docs/math/block-formulations.mdx
# §4 row 133 (ticket-159)
grep -rnE '\\rho_\{esp\} (\\cdot q|= 9\.81)|\\rho_\{esp,h\} =' src/content/docs/math/hydro-production-models.mdx
```

## 6. Verification log

### 2026-10-04 — ticket-031 (E02 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02): in agent
shells `grep` is a shell function that calls ugrep, under which the registry's `-E` patterns do not behave as written.
Run `unset -f grep` before the mirror check below, whose canonical text calls plain `grep`.

#### §5 replay

The replay runs every §5 grep with its pattern and options as written, over `src/content/docs src/figures
src/components` with `pt-br/` excluded, and prints each grep's hit count. Each output line names a §5 grep by its row
label; its command is that §5 line with the file list replaced by the corpus paths, as the loop builds it.

```bash
awk '/^## 5\./,/^## 6\./' docs/design/symbol-registry.md | /usr/bin/grep -E '^(# §4 row|grep )' \
  | while IFS= read -r l; do
      case "$l" in '# '*) row="${l#\# }"; continue ;; esac
      cmd="$(printf '%s' "$l" | sed -E "s|^grep |/usr/bin/grep --exclude-dir=pt-br |; s|'( [^' ]+)+\$|' src/content/docs src/figures src/components|")"
      printf '%s: %s\n' "$row" "$(eval "$cmd" | wc -l)"
    done
```

Output, 2026-10-04 (119 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
```

Narrowed in §5, each with a one-line `# narrowed` note: rows 3 and 4 (`h_b` tightened to `\bh_b\b`, XP-08), row 55
(scoped to cut-management, XD-07), rows 64 and 93 (scoped to their pages: `src/figures/valueFunction.ts` calls its
exported identifier `Q`), row 69 (scoped to risk-measures, XP-07). Extended: rows 81 and 84 (XD-09). Added: rows
107-119. Before the ticket-031 edits the replay printed 13 hits: the six narrowed greps above (12, all on legitimate
text) and row 43 on discount-rate (the stage dummy that row 116 renames).

#### Declarations, gap owner, solver internals, KaTeX

- §1.1 against the notation page — every line of §1.1 (34) occurs verbatim in its `### Declared Scoped Reuse`
  subsection; output empty:
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- §3 scoped-reuse decisions — each has its §1.1 line on the notation page, except the five that §1.1 defers: `k_{max}`
  (ticket-063) and `\xi` (ticket-079), whose second meaning a later ticket introduces, and the E10-split `A`, `D`, `s`
  (ticket-159).
- Gap defined once (NOT-07) — `/usr/bin/grep -rln 'max(1,' src/content/docs/math src/content/docs/overview src/content/docs/examples`
  prints only `src/content/docs/math/stopping-rules.mdx`. The notation page carries one gap row, `\text{gap}^k`, the
  owner's signed, unclamped `\bar{z}^k - \underline{z}^k`, with no `max(1,` (XD-11 1A).
- No solver internals on the notation page (NOT-02) — the ticket-017 grep
  `/usr/bin/grep -nE 'HiGHS|d\^\{col\}|storage_in|inflow_lags|anticipated_state|hot[- ]path|prescaler' src/content/docs/overview/notation-conventions.md`
  prints nothing.
- KaTeX strict mode — the strict-check helper over the 66 `.md`/`.mdx` files under `src/content/docs` (excluding
  `pt-br/`) prints `TOTAL 0`.
- Hold-back — ticket-018's hold-back check (its AC2 command) prints nothing: no planned-only row was published on the
  notation page in E02. ticket-014a's planned-entry check (the second command of its AC2) prints nothing: every
  planned-only Notation = yes row names the notation page among its later pages.

#### Reconciliation (ticket-031)

- §1.1 and the notation page: `n` extends to the correlation-matrix dimension (PAR(p) Inflow Model) and the tailrace
  segment superscript (Hydro Production Models); `w` extends to the PAR(p)-A rolling-window index; `\mathcal{X}_t` of
  the cut-validity statement (Cut Management) is declared (XD-10, XP-05).
- §2: new rows for the cut-validity feasible state set `\mathcal{X}_t`, the vertex count `I_t` and the rolling-window
  index `w`; the stage feasible set takes its decided form `\mathcal{X}_t(x_{t-1}, \omega_t)` (XD-05); the gap row
  becomes `\text{gap}^k`, signed and unclamped, and the relative-gap row is removed (XP-09, XD-11 1A); the stage dummy
  `t'` stays in the stage-index row (XD-11 3A); the notation page joins the Pages cells of the Notation = yes rows it
  carries (104 by the sweep, plus the rewritten feasible-set and gap rows; XD-05); refreshed rows (XD-05, XP-06, XP-08, XP-10, XD-10): stage index, tailrace segment, generic
  constraints, deficit segments, Monte Carlo sample count, season, AR order, vertex set and count, selection period,
  block duration and weight, the two ζ-derivation rows (Pages `—`), `d_{\text{cycle}}`, annual regressor, PAR(p)-A
  standardised series, anticipated slot, in-transit bucket, epigraph variable, cut slope, risk-averse subgradient,
  stage-LP value (with `\bar{Q}_t` on reference/output-format), upper-bound estimate and exact bound. Concept cells of
  the other rows keep their G1 inventory notes ("… writes …"); §4 records which of those forms the rename tickets
  replaced.
- §3: the `i`, `n`, `s` and `w` rows record the XD-10 outcomes; a new `\mathcal{X}` row declares the cut-validity
  reuse; the gap row records the XP-09 reconciliation; the τ row drops the removed ζ-derivation form.
- §4: row 55's old form reads `PAR($p > 0$) model` (XP-06); rows 81 and 84 gain the XD-09 pairs; rows 107-119.
- Record only: bare `\psi` on par-inflow-model (§3 and §7.6) names the AR-coefficient family of `\psi_{m,\ell}`; the
  Yule-Walker season arithmetic `\bmod M` is stated on par-inflow-model §5.3 ("season 0 = season $M$") and declared on
  the notation page (modulo $M$ on $\{1, \ldots, M\}$), and E07 ticket-095 owns any prose fix; the eigenvalue
  `\lambda_i` stays (§8.2 only); the `Q` of `src/figures/valueFunction.test.ts` is an identifier, not a math form; the
  identity matrix `I` of `\mathcal{N}(0, I)` is no inventoried concept and shares no page with `I_t`.
- Routed: the discount-rate sentence that justifies the `\delta_{b,k,s}` symbol choice goes to E08 ticket-111.

#### Hand-off: rows with a later page

Every §2 row whose Pages cell still names a later page (34 rows), with its introducing ticket. Each introducing ticket
publishes and resolves its row, and each later epic's verification ticket keeps the registry and the notation page
current (ADR-046).

- `N^{\rm eff}_t` — introduced by ticket-087 — Pages: planned: math/scenario-generation.md (ticket-087)
- `W` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\delta_t` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `m^{(k)}` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `r` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `k_{max}` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `r_i(m)` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `c_i(m)` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `\zeta_k` — introduced by ticket-049, ticket-052, ticket-081 — Pages: math/block-formulations.md, planned: math/lp-formulation.md (ticket-049), planned: math/equipment-formulations.mdx (ticket-052), planned: math/system-elements.mdx (ticket-052), planned: math/inflow-nonnegativity.md (ticket-081), planned: overview/notation-conventions.md (ticket-049)
- `H_t` — introduced by ticket-054, ticket-066 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-054), planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066)
- `c^{th}_{j,s}` — introduced by ticket-078 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, planned: math/lp-formulation.md (ticket-078), planned: math/system-elements.mdx (ticket-078), planned: math/equipment-formulations.mdx (ticket-078)
- `c^{fpha}_h` — introduced by ticket-080 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-080), planned: math/system-elements.mdx (ticket-080), planned: math/hydro-production-models.mdx (ticket-080), planned: math/penalty-system.mdx (ticket-080)
- `\kappa` — introduced by ticket-075 — Pages: planned: math/penalty-system.mdx (ticket-075)
- `c_i(t)` — introduced by ticket-066 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066)
- `d_{1 \to t}` — introduced by ticket-066, ticket-067, ticket-068 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/discount-rate.md, math/upper-bound-evaluation.md, planned: math/discount-rate.md (ticket-067), planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066), planned: math/policy-graphs.mdx (ticket-068), planned: overview/notation-conventions.md (ticket-067)
- `d_{t \to t+1}` — introduced by ticket-066, ticket-067, ticket-068 — Pages: math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.md, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, reference/glossary.md, planned: math/discount-rate.md (ticket-067), planned: math/lp-formulation.md (ticket-066), planned: math/lp-formulation.md (ticket-068), planned: math/system-elements.mdx (ticket-066), planned: math/policy-graphs.mdx (ticket-068)
- `r_h` — introduced by ticket-049, ticket-051 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051)
- `A_r` — introduced by ticket-079 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079)
- `\xi_r` — introduced by ticket-079, ticket-089 — Pages: math/system-elements.mdx, planned: math/equipment-formulations.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/scenario-generation.md (ticket-089), planned: overview/notation-conventions.md (ticket-079)
- `f_{r,k}` — introduced by ticket-079 — Pages: planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: overview/notation-conventions.md (ticket-079)
- `\psi^*_{m,\ell}` — introduced by ticket-093, ticket-095 — Pages: math/par-inflow-model.mdx, math/scenario-generation.md, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx, planned: math/par-inflow-model.mdx (ticket-093), planned: math/par-inflow-model.mdx (ticket-095)
- `\nu_0` — introduced by ticket-049, ticket-051 — Pages: planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051), planned: overview/notation-conventions.md (ticket-049)
- `\nu^{j \to k}_{i,t}` — introduced by ticket-049 — Pages: planned: math/lp-formulation.md (ticket-049), planned: overview/notation-conventions.md (ticket-049)
- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `e_{h,k}` — introduced by ticket-049 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049)
- `\sigma^{e+}_{h,k}` — introduced by ticket-054, ticket-055 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-054), planned: math/penalty-system.mdx (ticket-055)
- `\sigma^{e-}_{h,k}` — introduced by ticket-054, ticket-055 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-054), planned: math/penalty-system.mdx (ticket-055)
- `\sigma^{w-}_h` — introduced by ticket-049, ticket-051, ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051), planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{w+}_h` — introduced by ticket-049, ticket-051, ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051), planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{inf}_h` — introduced by ticket-049, ticket-081 — Pages: math/inflow-nonnegativity.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/inflow-nonnegativity.md (ticket-081)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)
- `H(i,m)` — introduced by ticket-086 — Pages: planned: math/scenario-generation.md (ticket-086)

#### Mirror check

The canonical registry-to-notation-page check (R84, ADR-046) that every later verification ticket replays: every
Notation = yes row except those whose notation-page entry waits for its introducing ticket must occur on
`overview/notation-conventions.md`. Run it after `unset -f grep` (XN-02).

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-04: empty.

This command's `awk` line is the only line of §6 besides the 34 hand-off rows that carries the planned-entry token, so
the token's line count over §6 is 35, one more than the §2 row count (XD-11 4A).

### 2026-10-04 — ticket-048 (E03 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

#### §5 replay

The ticket-031 loop, unchanged, over `src/content/docs src/figures src/components` with `pt-br/` excluded:

```bash
awk '/^## 5\./,/^## 6\./' docs/design/symbol-registry.md | /usr/bin/grep -E '^(# §4 row|grep )' \
  | while IFS= read -r l; do
      case "$l" in '# '*) row="${l#\# }"; continue ;; esac
      cmd="$(printf '%s' "$l" | sed -E "s|^grep |/usr/bin/grep --exclude-dir=pt-br |; s|'( [^' ]+)+\$|' src/content/docs src/figures src/components|")"
      printf '%s: %s\n' "$row" "$(eval "$cmd" | wc -l)"
    done
```

Output, 2026-10-04 (119 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
```

#### Declarations and Mirror check

- §1.1 against the notation page — every line of §1.1 (34) occurs verbatim in its `### Declared Scoped Reuse`
  subsection; output empty:
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep`:

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-04: empty. The notation page needs no edit.

#### Reconciliation (ticket-048)

- E03 delta — `math/block-formulations.md` became `math/block-formulations.mdx` in ticket-045, which updated the 29
  registry paths; the rows and the §5 greps follow the new path, and the replay above is at zero. No E03 ticket
  introduced, re-meant or moved a math symbol.
- XP-11 tidy, closed without a new decision: the §3 gap row's Recommendation cell names `\text{gap}^k`, the signed and
  unclamped upper bound minus lower bound, whose percent form has no symbol of its own; the two gap-arm rows of §2 and
  the new-form cell of §4 row 76 write the arms as the owner does (`math/stopping-rules.mdx`, Evaluation), with the
  clamp inside `\max(0, \text{gap}^k)` and the iteration superscript on the lower bound; the obsolete §5 intro
  sentence is deleted.
- Pages additions — `reference/output-format.mdx` joins the Pages cells of the `\hat{x}_{t-1}`, `\beta_0` and `\beta`
  rows: the policy-checkpoint cut table writes `\beta_0 = \bar{Q}_t - \beta^\top \hat{x}_{t-1}` (E02 ticket-027), and
  only the `Q_t` row listed the page. The Mirror check is unaffected (Pages change, Notation flags do not).
- XD-24 — `math/_impl/_blocks.notes.mdx` carries no math span, so it joins no inventory row and stays off the
  "Inventoried with no math symbol" line. That line records the pages an inventory acceptance check demanded a row for;
  the other `math/_impl` partials without a math span (nine, among them `_cut-management.io.mdx` and
  `_sddp.configure.mdx`) are not listed on it either (ticket-014 step 6 records "no symbols" for them in its completion
  report, not in the registry).

#### Hand-off: rows with a later page

Every §2 table row whose Pages cell still names a later page (34 rows), generated from the §2 table rows only, with its
introducing ticket. Each introducing ticket publishes and resolves its row, and each later epic's verification ticket
keeps the registry and the notation page current (ADR-046). The `\zeta_k` line names `math/block-formulations.mdx`.

- `N^{\rm eff}_t` — introduced by ticket-087 — Pages: planned: math/scenario-generation.md (ticket-087)
- `W` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\delta_t` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `m^{(k)}` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `r` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `k_{max}` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `r_i(m)` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `c_i(m)` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `\zeta_k` — introduced by ticket-049, ticket-052, ticket-081 — Pages: math/block-formulations.mdx, planned: math/lp-formulation.md (ticket-049), planned: math/equipment-formulations.mdx (ticket-052), planned: math/system-elements.mdx (ticket-052), planned: math/inflow-nonnegativity.md (ticket-081), planned: overview/notation-conventions.md (ticket-049)
- `H_t` — introduced by ticket-054, ticket-066 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-054), planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066)
- `c^{th}_{j,s}` — introduced by ticket-078 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, planned: math/lp-formulation.md (ticket-078), planned: math/system-elements.mdx (ticket-078), planned: math/equipment-formulations.mdx (ticket-078)
- `c^{fpha}_h` — introduced by ticket-080 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-080), planned: math/system-elements.mdx (ticket-080), planned: math/hydro-production-models.mdx (ticket-080), planned: math/penalty-system.mdx (ticket-080)
- `\kappa` — introduced by ticket-075 — Pages: planned: math/penalty-system.mdx (ticket-075)
- `c_i(t)` — introduced by ticket-066 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066)
- `d_{1 \to t}` — introduced by ticket-066, ticket-067, ticket-068 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/discount-rate.md, math/upper-bound-evaluation.md, planned: math/discount-rate.md (ticket-067), planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066), planned: math/policy-graphs.mdx (ticket-068), planned: overview/notation-conventions.md (ticket-067)
- `d_{t \to t+1}` — introduced by ticket-066, ticket-067, ticket-068 — Pages: math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.md, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, reference/glossary.md, planned: math/discount-rate.md (ticket-067), planned: math/lp-formulation.md (ticket-066), planned: math/lp-formulation.md (ticket-068), planned: math/system-elements.mdx (ticket-066), planned: math/policy-graphs.mdx (ticket-068)
- `r_h` — introduced by ticket-049, ticket-051 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051)
- `A_r` — introduced by ticket-079 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079)
- `\xi_r` — introduced by ticket-079, ticket-089 — Pages: math/system-elements.mdx, planned: math/equipment-formulations.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/scenario-generation.md (ticket-089), planned: overview/notation-conventions.md (ticket-079)
- `f_{r,k}` — introduced by ticket-079 — Pages: planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: overview/notation-conventions.md (ticket-079)
- `\psi^*_{m,\ell}` — introduced by ticket-093, ticket-095 — Pages: math/par-inflow-model.mdx, math/scenario-generation.md, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx, planned: math/par-inflow-model.mdx (ticket-093), planned: math/par-inflow-model.mdx (ticket-095)
- `\nu_0` — introduced by ticket-049, ticket-051 — Pages: planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051), planned: overview/notation-conventions.md (ticket-049)
- `\nu^{j \to k}_{i,t}` — introduced by ticket-049 — Pages: planned: math/lp-formulation.md (ticket-049), planned: overview/notation-conventions.md (ticket-049)
- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `e_{h,k}` — introduced by ticket-049 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/penalty-system.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049)
- `\sigma^{e+}_{h,k}` — introduced by ticket-054, ticket-055 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-054), planned: math/penalty-system.mdx (ticket-055)
- `\sigma^{e-}_{h,k}` — introduced by ticket-054, ticket-055 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-054), planned: math/penalty-system.mdx (ticket-055)
- `\sigma^{w-}_h` — introduced by ticket-049, ticket-051, ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051), planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{w+}_h` — introduced by ticket-049, ticket-051, ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/system-elements.mdx (ticket-051), planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{inf}_h` — introduced by ticket-049, ticket-081 — Pages: math/inflow-nonnegativity.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-049), planned: math/inflow-nonnegativity.md (ticket-081)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)
- `H(i,m)` — introduced by ticket-086 — Pages: planned: math/scenario-generation.md (ticket-086)

Token counts are per entry: this entry's hand-off list carries 34 lines with the planned-entry token, and the Mirror
check line above is the 35th, as in the ticket-031 entry (XD-11 4A). No row carries a later-page entry that names a
ticket of E03.

XP-11 closed.

### 2026-10-04 — ticket-062 (E04 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only: each §6 entry keeps the snapshot it recorded, so the ticket-031 and
ticket-048 hand-off lists keep their planned entries naming tickets 049-055 (XD-45 (b)).

#### §5 replay

The ticket-031 loop, unchanged, over `src/content/docs src/figures src/components` with `pt-br/` excluded:

```bash
awk '/^## 5\./,/^## 6\./' docs/design/symbol-registry.md | /usr/bin/grep -E '^(# §4 row|grep )' \
  | while IFS= read -r l; do
      case "$l" in '# '*) row="${l#\# }"; continue ;; esac
      cmd="$(printf '%s' "$l" | sed -E "s|^grep |/usr/bin/grep --exclude-dir=pt-br |; s|'( [^' ]+)+\$|' src/content/docs src/figures src/components|")"
      printf '%s: %s\n' "$row" "$(eval "$cmd" | wc -l)"
    done
```

Output, 2026-10-04 (121 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
```

#### Declarations, Mirror and Pages checks

- §1.1 against the notation page — every line of §1.1 (35) occurs verbatim in its `### Declared Scoped Reuse`
  subsection; output empty:
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep`:

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-04: empty.

- Pages check (ticket-062 block A, with `m(t)` added under XD-42): every listed E04 symbol that occurs on an E04 math
  page or on the notation page is listed in its row's Pages cell, where a planned entry does not count as listed.
  `ENVIRON` passes each symbol to `awk`, because an `awk -v` assignment would turn `\nu` into a newline:

```bash
pages="src/content/docs/math/lp-formulation.md src/content/docs/math/block-formulations.mdx src/content/docs/math/system-elements.mdx src/content/docs/math/equipment-formulations.mdx src/content/docs/math/penalty-system.mdx src/content/docs/math/hydro-production-models.mdx src/content/docs/overview/notation-conventions.md"
while IFS= read -r sym; do
  cell="$(S="\`$sym\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,]*//g')"
  [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $pages; do
    /usr/bin/grep -qF -- "$sym" "$p" || continue
    rel="${p#src/content/docs/}"
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym $rel" ;; esac
  done
done <<'EOF'
\zeta_k
\nu_{h',t,0}
\nu^{k' \to k}_{h',t}
\Delta^{tt}_{h'}
v_{h,k}
\gamma^{ev}_{0,h}
\gamma^{ev}_{v,h}
I_{h,k}
o^{arr}_{h' \to h,k}
\mathcal{U}^{pre}_h(t)
m(t)
EOF
```

Output, 2026-10-04: empty. Before this ticket's two Pages fixes the check printed `UNLISTED I_{h,k}
overview/notation-conventions.md` (the §1.1 `I` declaration line) and `UNLISTED m(t) math/block-formulations.mdx` (the
innovation share `\sigma_{m(t)}`).

#### Reconciliation (ticket-062)

- E04 delta, from the registry at the epic's start (`cdee790`) to the epic-complete tree:
  - Introduced: `\Delta^{tt}_{h'}`, `\gamma^{ev}_{0,h}`, `\gamma^{ev}_{v,h}` (Notation `yes`), `I_{h,k}`,
    `o^{arr}_{h' \to h,k}`, `\mathcal{U}^{pre}_h(t)` (Notation `no`).
  - Published from their planned rows: `\zeta_k`; `\nu_{h',t,0}` and `\nu^{k' \to k}_{h',t}`, the decided forms whose rows replace
    the planned `\nu_0` and `\nu^{j \to k}_{i,t}` rows; `r_h`; `e_{h,k}`; `\sigma^{e\pm}_{h,k}`; `\sigma^{w\pm}_h` on
    system-elements (its penalty-system entry stays with E06 ticket-075); `\sigma^{inf}_h` on lp-formulation (its
    inflow-nonnegativity entry stays with E06 ticket-081); `H_t` as the parallel evaporation pricing hours (its
    delivery-stage `H_m` stays with E05 ticket-066).
  - Re-meant: `\pi^{wb}_h` (one dual per block row on a chronological stage), `\text{net\_flows}_{h,k}` (the per-block
    flow terms only), `\sigma^{v-}_h` (the soft dead-volume floor of a filling hydro from its entry stage on),
    `\underline{V}_h` (a hard bound outside those two cases), `q^{\max}_{ev,h}` (the per-stage bound at maximum storage).
  - §4 rows 120-121 (ticket-051) and their §5 greps; the §4 intro names them (this ticket, XD-44 (c)).
  - §3 rows `I`, `o` and `𝒰` added; the `k`, σ, `P`, `r`, Δ, γ, ε, ζ and ν rows amended.
  - §1.1: the `I` declaration added (ticket-056); the `r_h` declaration extended to Block Formulations on the registry
    and the notation page together (this ticket, XD-42 (ii)).
  - Pages additions: `v_{h,k}` (lp-formulation, hydro-production-models); `\zeta_k` (lp-formulation,
    equipment-formulations, system-elements, notation page); `r_h`, `e_{h,k}`, `\sigma_m`, `\varepsilon_t` and, by this
    ticket, `m(t)` (block-formulations); `\sigma^{e\pm}_{h,k}` and `k \in \mathcal{K}` (penalty-system);
    `\sigma^{w\pm}_h` (system-elements); `\sigma^{inf}_h` (lp-formulation); by this ticket, `I_{h,k}` (notation page).
- Registry corrections by this ticket (XD-42, XD-44, XD-45, XD-47, XD-52):
  - Concept cells restated as current, each with its tag source: `r_h`, `e_{h,k}`, `\sigma^{w-}_h`, `\sigma^{w+}_h`,
    `\sigma^{e+}_{h,k}` and `\sigma^{e-}_{h,k}` (the evaporation row written with `\gamma^{ev}_{0,h}`, `\gamma^{ev}_{v,h}`), and
    `H_t`, which also takes its decided form `H_t = \sum_k \tau_k` (§4 rows 3, 4 and 13) and keeps its planned `H_m`
    clause for ticket-066. The `e_{h,k}` clause on penalty-system's `Q_{ev,h}` stays for ticket-075. The §3 γ meaning
    drops its trailing ticket reference.
  - Pumping-station index `y` (XD-45 (a)): the Concept and Index cells of the station-set, per-bus station-set,
    `\rho^{pump}_y`, `P^{pump}_{y,k}`, `\bar{P}_y`, `\underline{P}_y` and `p_{y,k}` rows, and the §3 `P` and `p` meanings.
    The set keeps `\mathcal{P}`, so no new glyph is needed. The §3 `j` row keeps its "pumping-station index written `j`"
    meaning, the collision that the rename resolved.
  - `\phi_{h,k}` (XD-52): the row and its notation line add the parallel-stage share `\tau_k / H_t` of a `hydro_inflow`
    term; the row's Concept and Index take the receiving-plant index `h` (§4 row 9). The §3 `P` row records the
    PreFilling routing set as published (`\mathcal{U}^{pre}_h(t)`, ticket-056).
- Notation page (Requirement 4): the `r_h` declaration line (XD-42 (ii)), the `\phi_{h,k}` line (XD-52), and the
  `v_{h,k}` and `v_h` lines, whose lower bound is `0`, not `\underline{V}_h`, for a filling hydro and for a hydro not in
  service (XD-46 (a)). No `MISSING` line or absent declaration was found.
- Notation-page definition against the registry Concept and the owner page, for every Notation = yes row E04
  introduced, re-meant or edited: `\zeta_k`, `\nu_{h',t,0}`, `\nu^{k' \to k}_{h',t}`, `\Delta^{tt}_{h'}`, `\pi^{wb}_h`,
  `\text{net\_flows}_{h,k}`, `\sigma^{v-}_h`, `\gamma^{ev}_{0,h}`/`\gamma^{ev}_{v,h}`, `\underline{V}_h`, `r_h`, `e_{h,k}`,
  `\sigma^{e\pm}_{h,k}`, `\sigma^{w\pm}_h`, `\sigma^{inf}_h` and `H_t` match. `\phi_{h,k}`, `v_{h,k}` and `v_h` match after the
  corrections above.
- The `I_{h,k}` notation-page occurrence is its §1.1 declaration line; the row keeps Notation `no` (lp-formulation is
  the only math page that writes it).

#### Hand-off: rows with a later page

Every §2 table row whose Pages cell still names a later page (28 rows), generated from the §2 table rows only, with the
tickets its planned entries name. Each named ticket publishes and resolves its row, and each later epic's verification
ticket keeps the registry and the notation page current (ADR-046).

- `N^{\rm eff}_t` — introduced by ticket-087 — Pages: planned: math/scenario-generation.md (ticket-087)
- `W` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\delta_t` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `m^{(k)}` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `r` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `k_{max}` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `r_i(m)` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `c_i(m)` — introduced by ticket-063 — Pages: planned: math/lp-formulation.md (ticket-063), planned: overview/notation-conventions.md (ticket-063)
- `\zeta_k` — introduced by ticket-081 — Pages: math/block-formulations.mdx, math/lp-formulation.md, math/equipment-formulations.mdx, math/system-elements.mdx, planned: math/inflow-nonnegativity.md (ticket-081), overview/notation-conventions.md
- `H_t` — introduced by ticket-066 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066)
- `c^{th}_{j,s}` — introduced by ticket-078 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, planned: math/lp-formulation.md (ticket-078), planned: math/system-elements.mdx (ticket-078), planned: math/equipment-formulations.mdx (ticket-078)
- `c^{fpha}_h` — introduced by ticket-080 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-080), planned: math/system-elements.mdx (ticket-080), planned: math/hydro-production-models.mdx (ticket-080), planned: math/penalty-system.mdx (ticket-080)
- `\kappa` — introduced by ticket-075 — Pages: planned: math/penalty-system.mdx (ticket-075)
- `c_i(t)` — introduced by ticket-066 — Pages: math/lp-formulation.md, math/system-elements.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066)
- `d_{1 \to t}` — introduced by ticket-066, ticket-067, ticket-068 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/discount-rate.md, math/upper-bound-evaluation.md, planned: math/discount-rate.md (ticket-067), planned: math/lp-formulation.md (ticket-066), planned: math/system-elements.mdx (ticket-066), planned: math/policy-graphs.mdx (ticket-068), planned: overview/notation-conventions.md (ticket-067)
- `d_{t \to t+1}` — introduced by ticket-066, ticket-067, ticket-068 — Pages: math/policy-graphs.mdx, math/horizon-modes.md, math/discount-rate.md, math/sddp-algorithm.mdx, math/cut-management.mdx, math/risk-measures.mdx, math/upper-bound-evaluation.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, reference/glossary.md, planned: math/discount-rate.md (ticket-067), planned: math/lp-formulation.md (ticket-066), planned: math/lp-formulation.md (ticket-068), planned: math/system-elements.mdx (ticket-066), planned: math/policy-graphs.mdx (ticket-068)
- `A_r` — introduced by ticket-079 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079)
- `\xi_r` — introduced by ticket-079, ticket-089 — Pages: math/system-elements.mdx, planned: math/equipment-formulations.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/scenario-generation.md (ticket-089), planned: overview/notation-conventions.md (ticket-079)
- `f_{r,k}` — introduced by ticket-079 — Pages: planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: overview/notation-conventions.md (ticket-079)
- `\psi^*_{m,\ell}` — introduced by ticket-093, ticket-095 — Pages: math/par-inflow-model.mdx, math/scenario-generation.md, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx, planned: math/par-inflow-model.mdx (ticket-093), planned: math/par-inflow-model.mdx (ticket-095)
- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `\sigma^{w-}_h` — introduced by ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx, planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{w+}_h` — introduced by ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx, planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{inf}_h` — introduced by ticket-081 — Pages: math/inflow-nonnegativity.md, overview/notation-conventions.md, math/lp-formulation.md, planned: math/inflow-nonnegativity.md (ticket-081)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)
- `H(i,m)` — introduced by ticket-086 — Pages: planned: math/scenario-generation.md (ticket-086)

Token counts are per entry: this entry's hand-off list carries 28 lines with the planned-entry token, and the Mirror
check and Pages check lines above are the 29th and 30th, as in the ticket-031 entry (XD-11 4A). No row carries a
later-page entry that names a ticket of E04.

### 2026-10-04 — ticket-074 (E05 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over `src/content/docs src/figures
src/components` with `pt-br/` excluded.

Output, 2026-10-04 (124 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
```

#### Declarations, Mirror and Pages checks

- §1.1 against the notation page: every line of §1.1 (36) occurs verbatim in the notation page's
  `### Declared Scoped Reuse` subsection. Output, 2026-10-04: empty.
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep`:

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-04: empty.

- Pages check (ticket-074 block A): every listed E05 symbol that occurs on an E05 math page or on the notation page is
  listed in its row's Pages cell. A planned entry does not count as listed, and `ENVIRON` passes each symbol to `awk`:

```bash
pages="src/content/docs/math/lp-formulation.md src/content/docs/math/system-elements.mdx src/content/docs/math/sddp-algorithm.mdx src/content/docs/math/discount-rate.mdx src/content/docs/math/policy-graphs.mdx src/content/docs/math/post-study-boundary.md src/content/docs/math/cut-management.mdx src/content/docs/overview/notation-conventions.md"
while IFS= read -r sym; do
  cell="$(S="\`$sym\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,]*//g')"
  [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $pages; do
    /usr/bin/grep -qF -- "$sym" "$p" || continue
    rel="${p#src/content/docs/}"
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym $rel" ;; esac
  done
done <<'SYMS'
k_{max}
t_i(m)
r_i(m)
x^{\mathrm{a}}_{s,i}
x^{\mathrm{a,in}}_{s,i}
\hat{x}^{\mathrm{a}}_{s,i}
g^{\mathrm{a}}_{i,t}
d_{1 \to t}
d_{t_1 \to t_2}
d_{t \to t+1}
SYMS
```

Output, 2026-10-04: empty, both before and after this ticket's edits. This ticket also ran the same loop over the
whole corpus (`src/content/docs src/figures src/components`) for these symbols and for `K_i`, `c_i(t)`, `H_t`, `r_t`,
`r_{annual}`, `\Delta t`, `b^{\mathrm{out}}_{h,d}`, `\hat{b}_{h,d}`, `L_h` and `n_{\text{state}}`. Two results were real gaps, and both are fixed: `k_{max}` and `s` on `reference/output-format.mdx`, whose checkpoint
`subindex` row writes `(s - 1) \bmod k_{max}` for the ring slot `s`. The `k_{max}` and `s` rows now list that page.
Every other hit was either `r_t` on its §1.1 declaration line (see the declaration-line note below) or a substring of
the identifiers `error_tolerance` and `worker_total` on three software pages.

Planned-entry counts, 2026-10-04: the §2 count (`planned:[^|]*\(ticket-0(6[3-9]|7[0-4])[ab]?\)`) prints `0` and the §3
count prints `0`; the §3 `γ` row prints `0` for `gamma_j` and the `ρ` row prints `1` for `rho^{pump}_y`.

#### Reconciliation (ticket-074)

- E05 delta, from the registry at the epic's start (`e4cc58d`) to the epic-complete tree:
  - Introduced: `t_i(m)` (its row replaces the decision-stage `c_i(m)` row), `x^{\mathrm{a,in}}_{s,i}` and the
    delivery-stage `m` (ticket-063); `d_{t_1 \to t_2}` and `r_t` (ticket-067).
  - Published from their planned rows: `k_{max}` and `r_i(m)` on lp-formulation and the notation page (ticket-063);
    `d_{1 \to t}` on the notation page (ticket-067). The planned entries of `H_t` and `c_i(t)` (ticket-066) and of
    `d_{1 \to t}` and `d_{t \to t+1}` on lp-formulation, system-elements and policy-graphs (tickets 066-068) are
    resolved too. The hand-off list goes from 28 rows to 21.
  - Re-meant: `K_i` (the ring depth); `s` (the ring residue, `s \in \{0, \ldots, k_{max} - 1\}`);
    `x^{\mathrm{a}}_{s,i}` and `\hat{x}^{\mathrm{a}}_{s,i}`, which drop the stage index (§4 rows 122-123);
    `g^{\mathrm{a}}_{i,t}` (the commitment decided at stage `t` for delivery stage `m`); `c_i(t)` (the unit cost at the
    delivery stage, `c_i(m)`, ticket-066); `H_t` (with the delivery-stage hours `H_m`, ticket-066); `r_{annual}` and
    `\Delta t` (ticket-067).
  - Retired, rows kept with no page: `K_{\max}` (§4 row 124, replaced by `k_{max}`), `y^i_t` (the ring has no carrier
    column; ticket-063) and `\text{PV}_1[c_T]` (ticket-067).
  - §4 rows 122-124 (ticket-063) and their §5 greps. Ticket-063 also wrote the §4 intro sentence naming them; this
    ticket verified it and did not add a second one (XD-60 (a)).
  - §1.1: the `k_{max}` declaration added (ticket-063) and the `r_h` declaration extended to `r_t` on Discount Rate
    (ticket-067).
  - The page path `math/discount-rate.md` is `math/discount-rate.mdx` in §1-§5 (ticket-069).
- Registry corrections by this ticket:
  - §3 `γ` and `ρ` (XD-56, guardian observation 1): the γ row lists the pumping consumption rate under its renamed form
    `\rho^{pump}_y`, and the ρ row lists `\rho^{pump}_y` → lp-formulation, system-elements, equipment-formulations,
    notation-conventions. A tagged rate collides with no productivity, so no co-occurrence cell changes.
  - The ring and its depth (XD-60 (b, e), XD-61): the `K_i` Concept drops its stale sddp-algorithm clause; the
    `K_{\max}` Concept is stated as current; the `n_{\text{state}}` Concept takes the page form
    `N(1 + P^{\max}) + B + A \, k_{max}`; the §3 `K` Recommendation names `K_i` the ring depth and `k_{max}` the slot
    count; the §3 `k` and `y` rows give `y^{i}_{k}`'s renamed form instead of a page; the §3 `y` Recommendation drops
    the retired carrier's page. The `\mathcal{M}_h` Pages cell adds system-elements, which writes the plane index `m`.
    Unchanged after checking: the §3 `x` row, which carries no retired form, and the `\bar{G}_j`/`\underline{G}_j`
    Concepts, which carry no pending clause.
  - XD-60 (c): the delivery-stage `m` Concept puts the delivery clause in parentheses.
  - XD-60 (d), declined: lp-formulation §5c defines `K_i` "at the start of any stage", which already admits the first
    post-study stage that the occupancy count at `crates/cobre-sddp/src/lead_time/mod.rs:374-387,452-473` reaches. A
    registry-only rewording would differ from the owner page, so the optional wording is left to E10 ticket-147 (the ticket that moves §5c to state-augmentation), recorded under
    XD-81 in `plans/v0.17.0-docs-sync/design/execution-decisions.md`.
  - XD-62: the `d_{1 \to t}` and `d_{t \to t+1}` Concepts carry no leftover form. Verified; no change.
  - XD-67 (ticket-065 guardian F2-F4): the stage-index `t` row drops the 0-based lp §5c and system-elements §4 clauses
    from its Concept and Index cells, drops the glossary `t + K` form and cites the product dummy on discount-rate §5.
    `T` and `Q_t` drop system-elements from their Pages and from the §3 `T` and `Q` meanings and co-occurrence cells.
    The `g_{j,k}` row writes the fish row's `g_{i,k}`. The block-index and `B` rows drop the same 0-based §5c clauses,
    and `B`, `L_h`, `b^{\mathrm{in}}_{h,1}` and `\hat{b}_{h,d}` take the receiving-plant index `h` (§4 row 1). The
    anticipated-plant `i` row takes `i \in \{1, \ldots, A\}` and adds sddp-algorithm (`x^{\mathrm{a}}_{s,i}`), with its
    §3 `i` meaning; the receiving-plant `i` is renamed `h` there, so no co-occurrence is added.
  - XD-69: the `K_i` row and the §3 `K` meaning cite the glossary's Lead row (`K_i` the ring depth). The §4 row 85
    Concept states the glossary's current Lead label and keeps the new forms as the record of ticket-026's rename; the
    row's §5 grep is unchanged.
  - XD-75: the §3 `c` Recommendation states the published forms, and the decision-stage meaning points to the `t` row.
  - XD-77: the `d_{t \to t+1}` Concept cites `crates/cobre-sddp/src/lp/builder/template.rs:186-212` once.
  - XD-78: the `\beta_0` row says post-study-boundary writes the boundary intercept `\beta_0`, to which a pre-study
    commitment's state contribution is added at load. The `x_t` row says post-study-boundary writes `x_T` in
    `\beta^{\top} x_T`.
  - XD-79: the `b^{\mathrm{in}}_{h,1}` and `\hat{b}_{h,d}` rows describe the in-transit buckets through their
    definition rows, `b^{\mathrm{out}}_{h,d} - b^{\mathrm{in}}_{h,d+1} - \text{(deposits into lag } d\text{)} = 0`
    (lp-formulation §5d; `crates/cobre-sddp/src/lp/builder/delivery_ring.rs:193-234`).
  - Pages added from the corpus-wide run: `k_{max}` and `s` gain `reference/output-format.mdx`, with their §3 rows.
    The §3 `k_{max}` meaning reads "hold-ring slot count".
  - XD-71 (verify only): the boundary intercept fold is skipped when the boundary or the current entity manifest is
    empty (`crates/cobre-sddp/src/policy/policy_load.rs:551-557,1177,1230-1252`). Behind the version gate a normal
    checkpoint always carries a manifest, so no page states this case. Verify-only, routed by XD-71 F5 and recorded as F-072-5
    in `plans/v0.17.0-docs-sync/design/findings-register.md` §2 (cobre code); no docs owner, because no page carries
    the case.
- Notation page (Requirement 3): the `k_{max}` declaration line says "the number of slots in every anticipated
  thermal's commitment ring", in place of "depth". This makes it consistent with the ring depth `K_i` in §3.4 of the
  same page, and the registry §1.1 line changed with it. For every other Notation = yes row E05 introduced or re-meant,
  the notation definition matches the registry Concept and the owner page: `k_{max}` (table row), `t_i(m)`, `r_i(m)`,
  `K_i`, `s`, the delivery-stage `m`, `x^{\mathrm{a}}_{s,i}`, `x^{\mathrm{a,in}}_{s,i}`, `\hat{x}^{\mathrm{a}}_{s,i}`,
  `g^{\mathrm{a}}_{i,t}`, `\bar{G}_i(m)`/`\underline{G}_i(m)`, `c_i(t)`, `d_{1 \to t}`, `d_{t_1 \to t_2}` and
  `d_{t \to t+1}`.
- Declaration-line mentions (XD-55 triage, E05 scope only): a symbol whose only notation-page occurrence is a
  `### Declared Scoped Reuse` line does not add the notation page to its Pages cell. This covers `r_t` (the extended
  `r_h` line) and the iteration-limit `k_{max}` (the `k_{max}` line), and it is the practice of the existing rows;
  `I_{h,k}` stays the one exception. Block A passes either way, because every E05 symbol it checks also has a notation
  table row. The plan-wide rule and its check belong to E15 (drift guards); see the findings register
  (`plans/v0.17.0-docs-sync/design/findings-register.md` §7).

#### §1.1 held-back list (XD-57)

The §1.1 intro, printed with `awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md`, names no
ticket of E05 (`/usr/bin/grep -cE 'ticket-0(6[3-9]|7[0-4])[ab]?\b'` on it prints `0`). Its held-back list, quoted
verbatim with the hard wraps joined:

> Two kinds of decided reuse are not listed yet. An E10-split reuse (§3 rows `K`, `L`, `A`, `D`, `i`, `j`, `s`, `m`) shares `lp-formulation` or `system-elements` until E10 makes it page-disjoint, which principle 4 requires first; ticket-159 adds it then. A reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046): `\xi` (ticket-079), and the planned meanings of `\delta` (ticket-085), `\kappa` (ticket-075) and `q` (ticket-115).

#### Hand-off: rows with a later page

Every §2 table row whose Pages cell still names a later page (21 rows), generated from the §2 table rows only, with the
tickets its planned entries name. Each named ticket publishes and resolves its row, and each
later epic's verification ticket keeps the registry and the notation page current (ADR-046).

- `N^{\rm eff}_t` — introduced by ticket-087 — Pages: planned: math/scenario-generation.md (ticket-087)
- `W` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\delta_t` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `m^{(k)}` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `r` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\zeta_k` — introduced by ticket-081 — Pages: math/block-formulations.mdx, math/lp-formulation.md, math/equipment-formulations.mdx, math/system-elements.mdx, planned: math/inflow-nonnegativity.md (ticket-081), overview/notation-conventions.md
- `c^{th}_{j,s}` — introduced by ticket-078 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, math/inflow-nonnegativity.md, overview/notation-conventions.md, examples/toy-single-reservoir.md, examples/toy-four-reservoir.md, planned: math/lp-formulation.md (ticket-078), planned: math/system-elements.mdx (ticket-078), planned: math/equipment-formulations.mdx (ticket-078)
- `c^{fpha}_h` — introduced by ticket-080 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/hydro-production-models.mdx, overview/notation-conventions.md, planned: math/lp-formulation.md (ticket-080), planned: math/system-elements.mdx (ticket-080), planned: math/hydro-production-models.mdx (ticket-080), planned: math/penalty-system.mdx (ticket-080)
- `\kappa` — introduced by ticket-075 — Pages: planned: math/penalty-system.mdx (ticket-075)
- `A_r` — introduced by ticket-079 — Pages: math/lp-formulation.md, math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079)
- `\xi_r` — introduced by ticket-079, ticket-089 — Pages: math/system-elements.mdx, planned: math/equipment-formulations.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/scenario-generation.md (ticket-089), planned: overview/notation-conventions.md (ticket-079)
- `f_{r,k}` — introduced by ticket-079 — Pages: planned: math/equipment-formulations.mdx (ticket-079), planned: math/system-elements.mdx (ticket-079), planned: math/lp-formulation.md (ticket-079), planned: overview/notation-conventions.md (ticket-079)
- `\psi^*_{m,\ell}` — introduced by ticket-093, ticket-095 — Pages: math/par-inflow-model.mdx, math/scenario-generation.md, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx, planned: math/par-inflow-model.mdx (ticket-093), planned: math/par-inflow-model.mdx (ticket-095)
- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `\sigma^{w-}_h` — introduced by ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx, planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{w+}_h` — introduced by ticket-075 — Pages: math/lp-formulation.md, overview/notation-conventions.md, math/system-elements.mdx, planned: math/penalty-system.mdx (ticket-075)
- `\sigma^{inf}_h` — introduced by ticket-081 — Pages: math/inflow-nonnegativity.md, overview/notation-conventions.md, math/lp-formulation.md, planned: math/inflow-nonnegativity.md (ticket-081)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)
- `H(i,m)` — introduced by ticket-086 — Pages: planned: math/scenario-generation.md (ticket-086)

Token counts are per entry: this entry's hand-off list carries 21 lines with the planned-entry token, and the Mirror
check and Pages check commands are the 22nd and 23rd, as in the ticket-031 entry (XD-11 4A); the
planned-entry count pattern under the Pages check is the 24th. No row carries a
later-page entry that names a ticket of E05.

### 2026-10-05 — ticket-083 (E06 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded, so the ticket-062 and
ticket-074 hand-off lists keep their planned entries naming tickets 075 and 078-081.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over `src/content/docs src/figures
src/components` with `pt-br/` excluded.

Output, 2026-10-05 (131 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
```

#### Declarations, Mirror and Pages checks

- §1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
  `### Declared Scoped Reuse` subsection, which holds the same 37 lines. Output, 2026-10-05: empty.
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (259 rows checked):

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-05: empty.

- Pages check (ticket-083 block C), corpus-wide over every `.md`/`.mdx` page of `src/content/docs` with `pt-br/`
  excluded. It also confirms the retired rows and the Pages cells E06 cleared. A planned entry does not count as
  listed, and `ENVIRON` passes each symbol to `awk`:

```bash
pages_of() { S="\`$1\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,|]*//g'; }
P="$(find src/content/docs -name pt-br -prune -o -type f \( -name '*.md' -o -name '*.mdx' \) -print | sort)"
while IFS= read -r sym; do
  cell="$(pages_of "$sym")"; [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $P; do /usr/bin/grep -qF -- "$sym" "$p" || continue; rel="${p#src/content/docs/}"
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym $rel" ;; esac; done
done <<'SYMS'
c^{sv-}_h
c^{fill}_h
c^{th}_j
c^{tc}_h
c^{inf}_h
c^{curt}_r
\sigma^{inf}_h
\sigma^{w-}_h
\sigma^{w+}_h
A_{r,k}
\xi_r
f_{r,k}
\kappa_{r,k}
g^{nc}_{r,k}
\zeta_k
V^{\text{target}}_t
\bar\rho_{acum,h,t}
SYMS
awk -F'|' '/^## 2\./,/^## 3\./ { s=$3; gsub(/^ +| +$/,"",s); p=$6; n=$9; gsub(/^ +| +$/,"",p); gsub(/^ +| +$/,"",n);
  if (s=="\x60g_{j,k,s}\x60" || s=="\x60\\bar{g}_{j,s}\x60" || $2 ~ /^ *Thermal cost-segment index/) if (p!="—" || n!="no") print "NOT-RETIRED " s;
  if (s=="\x60v^{\\text{seed}}_h\x60" && p!="—") print "NOT-RETIRED " s }' docs/design/symbol-registry.md
for s in 'c^{tv-}_h' 'c^{ov-}_h' 'c^{ov+}_h' 'c^{gv-}_h' 'c^{ev+}_h' 'c^{ev-}_h' 'c^{wv+}_h' 'c^{wv-}_h' 'c^{th}_j' 'c^{ctr}_c'; do
  case "$(pages_of "$s")" in *inflow-nonnegativity*) echo "STALE $s inflow-nonnegativity" ;; esac; done
for s in '\zeta' '\text{rate}_t'; do case "$(pages_of "$s")" in *penalty-system*) echo "STALE $s penalty-system" ;; esac; done
```

Output, 2026-10-05: empty, both before and after this ticket's edits. A second sweep compared every §2 Pages cell with
the E06 pages at `1aa352f` and at the epic-complete tree (a symbol a page wrote before the epic and no longer writes, or the reverse). It
found three real drifts, fixed below: `\text{start\_stage\_id}` and `v^{avg}_h` on penalty-system, and the
`\text{rate}_{t'}` form on lp-formulation. Every other hit was a substring of a longer symbol (`\kappa` in
`\kappa_{r,k}`, `\delta` in `\delta_{b,k,s}`, `\rho_{acum,h,t}` in `\bar\rho_{acum,h,t}`), of prose or an
identifier on `_impl/_penalties.configure.mdx`, or `\xi_h` on its §1.1 declaration line (see the declaration-line note below). The sweep was a manual comparison of §2 Pages
cells with the E06 pages, with no recorded command; the corpus-wide Pages/Concept check routed to E15 (XD-105 finding
3) is to replace it.

Planned-entry count, 2026-10-05: the AC3 count over §1.1 to §3
(`planned:[^|]*\(ticket-0(7[5-9]|8[0-3])a?\)|\(planned, ticket-0(7[5-9]|8[0-3])a?\)|\(ticket-0(7[5-9]|8[0-3])\)`) prints
`0`.

#### Reconciliation (ticket-083)

- E06 delta, from the registry at the epic's start (`1aa352f`) to the epic-complete tree:
  - Renamed, with §4 rows 125-131 and their §5 greps: `Q_{ev,h}` → `e_h` on penalty-system (row 125, ticket-075);
    `c^{th}_{j,s}` → `c^{th}_j`, `g_{j,k,s}` → `g_{j,k}` and `\bar{g}_{j,s}` removed (rows 126-128, ticket-078);
    `A_r` → `A_{r,k}` (row 129, ticket-079); `c^{fpha}_h` and `c^{t}_h` → `c^{tc}_h` (row 130, ticket-080);
    `c^{inf}` → `c^{inf}_h` (row 131, ticket-081).
  - Published from their planned rows: the conversion `\kappa` on penalty-system (ticket-075); `\xi_r` and `f_{r,k}`
    on equipment-formulations, system-elements and the notation page (ticket-079); `\sigma^{w-}_h`, `\sigma^{w+}_h`
    on penalty-system (ticket-075); `\sigma^{inf}_h` on inflow-nonnegativity and penalty-system and `\zeta_k` on
    inflow-nonnegativity (ticket-081). `c^{sv-}_h` and `c^{fill}_h` gain notation rows (Notation yes, ticket-075).
    The hand-off list goes from 21 rows to 12.
  - Re-meant: `V^{\text{target}}_t`, stated in closed form (ticket-082); `a_h^{effective}`, the water reaching the
    reservoir, `a_h + \sigma^{inf}_h` (ticket-081); `\kappa_{r,k}`, the curtailment `A_{r,k} - g^{nc}_{r,k}`, priced
    through `-\tau_k c^{curt}_r` on `g^{nc}_{r,k}` (ticket-079). Concepts restated with the epic's facts: `g_{j,k}`,
    `e_{h,k}`, `q^{\max}_{ev,h}`, `\sigma^{inf}_h`, `c^{ov-}_h`, `c^{curt}_r`, `\underline{V}_h`, `\zeta` and
    `\text{rate}_t`.
  - Retired, rows kept with no page: `g_{j,k,s}`, `\bar{g}_{j,s}` and the thermal segment index `s` (Notation no,
    ticket-078); `\text{EvapCoef} \times \text{Area}(V_{avg})` (ticket-075a, F-075-5). The Pages of
    `v^{\text{seed}}_h` are cleared (ticket-082).
  - Pages: penalty-system is listed on 53 §2 rows, against 21 at `1aa352f` (planned entries counted). Its rebuilt
    body writes the ordering's cost symbols, `\sigma^{w\pm}_h`, `\kappa`, `r_h`, `\bar\rho_{acum,h,t}` and `H_t`
    (ticket-075), the slacks, bounds and bus symbols of its tables (ticket-075a), `\gamma_q^m`, `\gamma_s^m` and
    `c^{tc}_h` (ticket-080), and `c^{inf}_h` and `\sigma^{inf}_h` (ticket-081). It leaves `\zeta`,
    `\text{rate}_t` and `v^{\text{seed}}_h` (ticket-082), the `EvapCoef` row (ticket-075a), and
    `\text{start\_stage\_id}` and `v^{avg}_h` (this ticket, below). inflow-nonnegativity joins `\zeta` and
    `\zeta_k` and leaves the ten cost rows it no longer writes (ticket-081).
  - §3 rows amended by the E06 tickets before this one: α, `A`, `c`, `f`, `g`, `m`, `s`, γ, ζ, κ and ξ; the corrections
    below add δ, ϵ, ℓ, `r`, ρ, `b`, `j`, `G` (XD-86) and μ (XD-100).
  - §1.1: the κ, `r_h`, `n` and `\epsilon_{b,k}` lines name penalty-system (tickets 075, 075a); the ξ line is added
    (ticket-079); the intro's held-back list drops `\xi` (ticket-079) and `\kappa` (ticket-075).
- Registry corrections by this ticket:
  - XD-86 (F-075a-3): the §3 meaning lists name penalty-system for the meanings its body writes: δ (load deficit),
    ϵ (excess), ℓ (transmission-line index, written `n`), `r` (withdrawal target `r_h`), ρ (the accumulated
    productivity), `b` (bus index), `j` (thermal index), `G` (generation bounds) and `s` (deficit segment). Each glyph
    has one meaning on penalty-system, so no co-occurrence cell changes.
  - XD-89 (F-078-2) and XD-94 (3): the §4 intro names rows 125-131.
  - XD-94 (2): the `\xi_r` row's Index cell is `r \in \mathcal{R}`.
  - XD-94 (1), kept under the §3 convention: the α co-occurrence cell records G1's collisions. At the epic-complete tree lp-formulation and hydro-production-models write no α, and every listed page's second meaning has been renamed (the intercept to
    `\beta_0`, `\alpha_{FPHA}` to `k_{FPHA}`, the NCS ratio to `\xi_r`). Dropping lp-formulation alone would leave the
    other historical entries, so the cell stays as recorded; the convention for these cells is routed to E15 (XD-81 finding 4 and XD-105 finding 3, recorded in
    `plans/v0.17.0-docs-sync/epic-15-drift-guards/00-epic-overview.md`; no E15 ticket carries it yet).
  - XD-100: the `H_t` Concept names lp-formulation §2 for the inflow non-negativity pricing. The `\mu_m` Concept and
    Pages drop lp-formulation and inflow-nonnegativity, which write no `\mu` (the §3 μ meaning drops them too). The
    `b_{h,m(t)}` Concept states the forms the pages write: `b_{h,m(t)}` on lp-formulation §5 and §5b, `b_{h,m}` on
    inflow-nonnegativity and scenario-generation §4.3, the expanded form on par-inflow-model §3. The same family's
    `\sigma_m` Concept says that lp-formulation §5 and §5b write `\sigma_{m(t)}`. The rows of `m(t)`, `P_h` and
    `\varepsilon_t` state the inflow page's forms correctly (`m`, `p` in `\sum_{\ell=1}^{p}`, `\varepsilon` and
    `\varepsilon_h`): no change.
  - Pages drift from the second sweep: `\text{start\_stage\_id}` leaves penalty-system, whose filling-sufficiency
    display moved to the Configure tab (ticket-076); `v^{avg}_h` leaves penalty-system and drops its `V_{avg}` clause
    (no page has written that form since `e4cc58d`); the `\text{rate}_t` Concept names lp-formulation's
    `\text{rate}_{t'}`, the stage dummy of the closed-form floor.
  - XD-103 (ticket-082 guardian N9, decided Option A in XD-105), not applied: N9 asked for equipment-formulations to be
    added to the `\zeta` row's Pages cell. Equipment-formulations writes `\zeta_k` only
    (`math/equipment-formulations.mdx:155-158`, listed in the `\zeta_k` row) and never the stage conversion `\zeta`;
    a plain `grep -F '\zeta'` matches it only as a substring of `\zeta_k`. The `\zeta` row keeps its Pages.
- Notation page (Requirements 3 and 5): no edit. The definition of every Notation = yes row E06 introduced, re-meant
  or edited matches its registry Concept and its owner page: `c^{sv-}_h`, `c^{fill}_h`, `c^{tc}_h`, `c^{inf}_h`
  (penalty-system), `c^{th}_j`, `A_{r,k}`, `f_{r,k}`, `\kappa_{r,k}`, `g^{nc}_{r,k}`, `g_{j,k}`
  (equipment-formulations), `\xi_r` (system-elements), `c^{curt}_r` (penalty-system), `\sigma^{w\pm}_h`, `e_{h,k}`
  (lp-formulation), `\sigma^{inf}_h` (inflow-nonnegativity) and `V^{\text{target}}_t` (lp-formulation; its "reaching
  `\underline{V}_h` at stage `L`" reads the stage-resolved `\underline{V}_{h,L}` of lp §8 as an also-written form of
  `\underline{V}_h`, as ticket-082 decided). The five §1.1 lines E06 edited or added (κ, `r_h`, `n`,
  `\epsilon_{b,k}`, ξ) occur verbatim in `### Declared Scoped Reuse`. The optional out-of-window `[0, 0]` pin on the
  `g_{j,k}` domain (XD-89) is not added: `p_{y,k}`, `\chi_{c,k}`, `f^{\pm}_{n,k}` and `g^{nc}_{r,k}` carry the same
  generic commissioning pin (`crates/cobre-sddp/src/lp/builder/columns.rs:534,931,973,1018`; the thermal column's own
  pin is at `:349`), so one row alone would be asymmetric. The pin is declined here and routed to E10 ticket-152
  (`plans/v0.17.0-docs-sync/epic-10-system-modelling-restructure/ticket-152-rewrite-system-elements.md`, XD-105
  finding 5), which states it once in a table-level sentence when it rewrites system-elements.
- Declaration-line mentions (XD-55 practice): `\xi_h` occurs on the notation page only on the ξ declaration line, so
  its row does not list the notation page.

#### §1.1 held-back list (XD-57)

The §1.1 intro, printed with `awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md`, names no
ticket of E06 (`/usr/bin/grep -cE 'ticket-0(7[5-9]|8[0-3])a?\b'` on it prints `0`). Its held-back list, quoted
verbatim with the hard wraps joined:

> Two kinds of decided reuse are not listed yet. An E10-split reuse (§3 rows `K`, `L`, `A`, `D`, `i`, `j`, `s`, `m`) shares `lp-formulation` or `system-elements` until E10 makes it page-disjoint, which principle 4 requires first; ticket-159 adds it then. A reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046): the planned meanings of `\delta` (ticket-085) and `q` (ticket-115).

#### Hand-off: rows with a later page

Every §2 table row whose Pages cell still names a later page (12 rows), generated from the §2 table rows only, with the
tickets its planned entries name. Each named ticket publishes and resolves its row, and each later epic's verification
ticket keeps the registry and the notation page current (ADR-046).

- `N^{\rm eff}_t` — introduced by ticket-087 — Pages: planned: math/scenario-generation.md (ticket-087)
- `W` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\delta_t` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `m^{(k)}` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `r` — introduced by ticket-085 — Pages: planned: math/scenario-generation.md (ticket-085)
- `\xi_r` — introduced by ticket-089 — Pages: math/system-elements.mdx, math/equipment-formulations.mdx, overview/notation-conventions.md, planned: math/scenario-generation.md (ticket-089)
- `\psi^*_{m,\ell}` — introduced by ticket-093, ticket-095 — Pages: math/par-inflow-model.mdx, math/scenario-generation.md, overview/notation-conventions.md, math/_impl/_par.io.mdx, math/_impl/_par.notes.mdx, planned: math/par-inflow-model.mdx (ticket-093), planned: math/par-inflow-model.mdx (ticket-095)
- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)
- `H(i,m)` — introduced by ticket-086 — Pages: planned: math/scenario-generation.md (ticket-086)

Line counts are per entry: this entry's hand-off list carries 12 lines with the planned-entry token (15 tokens, as
three lines carry several), and the Mirror check command, the Pages check command and the planned-entry count pattern
above are the 13th, 14th and 15th such lines, as in
the ticket-031 entry (XD-11 4A). No row carries a later-page entry that names a ticket of E06.

### 2026-10-05 — ticket-102 (E07 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded, so the ticket-074 and
ticket-083 hand-off lists keep their planned entries naming tickets 085-095.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over `src/content/docs src/figures
src/components` with `pt-br/` excluded. E07 adds no §4 row (ticket-092 renamed only the page path in §2, §4 and §5), so
the count equals E06's.

Output, 2026-10-05 (131 greps, 0 hits each), both before and after this ticket's edits:

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
```

#### Declarations, Mirror and Pages checks

- §1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
  `### Declared Scoped Reuse` subsection, which holds the same 37 lines. Output, 2026-10-05: empty.
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (259 rows checked):

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-05: empty. The check matches each symbol as a plain substring, so a one- or two-glyph symbol passes
whatever the page defines (XD-127; the tool gap is routed to E15). The 28 such rows (`t`, `T`, `k`, `n` twice, `j`
twice, `M` twice, `m` twice, `L`, `N`, `i` twice, `s`, `B`, `h`, `d`, `u`, `c`, `Q`, `z`, `C`, `U`, `p₁`, `K`, `Z`)
were checked by hand, meaning by meaning, against the notation page with its `### Declared Scoped Reuse` lines
removed. Each has a body entry (a table row or a definition; `N` and `B` in the state-dimension sentence of §4.2)
except five:

- `Q`, the turbined-flow coordinate of the FPHA fitting grid, occurs only on its declaration line;
- `n`, the number of cycle repetitions of the cyclic-graph limit, has no entry (the page's `n` is the policy-graph node
  and the line index);
- `j` as the opening index and `j` as the state-coordinate index have no entry (the page's `j` is the LP column and the
  thermal index);
- the cost-scale factor `K` has no notation entry since ticket-090 deleted the §1.1 `K` line, which was its only
  notation-page occurrence. The row keeps `Notation` yes under the two-page rule of the §2 column conventions
  (lp-formulation and cut-management); see the cost-scale `K` item under Reconciliation.

The first four are as they were at `2723667` and outside E07's diff; they are recorded for E15, with the mirror tool
gap.

- Pages check (ticket-102 block C), corpus-wide over every `.md`/`.mdx` page of `src/content/docs` with `pt-br/`
  excluded and the notation page read without its `### Declared Scoped Reuse` lines (XD-59). A planned entry does not
  count as listed, and `ENVIRON` passes each symbol to `awk`:

```bash
pages_of() { S="\`$1\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,|]*//g'; }
txt() { case "$1" in */overview/notation-conventions.md) awk '/^### Declared Scoped Reuse$/{f=1;next} f&&/^#/{f=0} !f' "$1" ;; *) cat "$1" ;; esac; }
P="$(find src/content/docs -name pt-br -prune -o -type f \( -name '*.md' -o -name '*.mdx' \) -print | sort)"
while IFS='|' read -r sym pat; do
  cell="$(pages_of "$sym")"; [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $P; do txt "$p" | /usr/bin/grep -qP -- "$pat" || continue
    rel="${p#src/content/docs/}"
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym $rel" ;; esac; done
done <<'SYMS'
W|\\lvert W\\rvert|y \\in W
\delta_t|\\delta_t(?![A-Za-z])|\\delta\^\{\(\\ell\)\}
m^{(\ell)}|(?<![A-Za-z_])m\^\{\(\\ell\)\}
n_{\text{pre}}|n_\{\\text\{pre\}\}
H(\text{iteration}, \text{trajectory})|H\(\\text\{iteration\}|H\(\\text\{tree seed\}
N^{\rm eff}_t|N\^\{\\rm eff\}_t
\Phi^{-1}|\\Phi\^\{-1\}
\tilde{\varepsilon}_{h,t}|\\tilde\{\\varepsilon\}_\{h,t\}
\hat{C}|\\hat\{C\}(?!_m)
\hat{C}_m|\\hat\{C\}_m
\tilde{C}|\\tilde\{C\}
\xi_r|\\xi_r(?![A-Za-z])
\mu^{nc}_r|\\mu\^\{nc\}_r
s^{nc}_r|(?<![A-Za-z\\])s\^\{nc\}_r
\varepsilon^{nc}_r|\\varepsilon\^\{nc\}_r
d_{b,t}|(?<![A-Za-z\\])d_\{b,t\}
\psi^*_{m,\ell}|\\psi\^\*_\{m,\\ell\}
a_h|a\^\{\\text\{obs\}\}_h|a\^\{\(y\)\}_\{h,t
SYMS
```

Output, 2026-10-05: empty, both before and after this ticket's edits. Run on the `2723667` tree and registry
(`git archive HEAD`), it prints the eight `NO-ROW` lines of the rows E07 creates or renames (`m^{(\ell)}`,
`n_{\text{pre}}`, `H(\text{iteration}, \text{trajectory})`, `\Phi^{-1}`, `\tilde{\varepsilon}_{h,t}`, `\hat{C}`,
`\hat{C}_m`, `\tilde{C}`) and nothing else.

The same loop over sixteen symbols that E07 moved or re-wrote (`\Delta a_{h,t}`, `\mu_m`, `s_m`, `\sigma_m`,
`\psi_{m,\ell}`, `r_m`, `\rho_m(\ell)`, `N_m`, `z_{0.975}`, `\Lambda`, `\lambda_i`, `C^{1/2}`, `\tilde{\Lambda}^{1/2}`,
`\mathcal{N}(0,1)`, `b_{h,m(t)}` and `x_0` for `x_t`) prints five `UNLISTED` lines: `s_m` on
`reference/bibliography.md`, `\Lambda` on `examples/toy-four-reservoir.md` and `reference/glossary.md`,
`\tilde{\Lambda}^{1/2}` on `math/scenario-generation.mdx`, and `x_0` (the `\hat x_0` of the incoming-state row) on
`examples/toy-four-reservoir.md`. Each use is already on the page at `2723667`, so E07 did not introduce it and
Requirement 3(b) does not add it; adding the first three would also turn `Notation` to yes for `\tilde{\Lambda}^{1/2}`
and require a notation entry. They are recorded for the corpus-wide Pages/Concept check routed to E15 (XD-105 finding
3).

A differential sweep compared, for every §2 row and every E07 page, whether the symbol occurs on the page at `2723667`
and at the epic-complete tree (plain substring, notation page without its declaration lines). It found six rows whose
listed E07 page wrote the symbol before the epic and no longer does: `s_m`, `\psi^*_{m,\ell}`, `r_m` and
`\text{deterministic component}` on scenario-generation, which change below, and `\mathcal{N}(0,1)` on
scenario-generation and `a_h` on par-inflow-model, which keep their pages through the forms their Concepts list
(`N(0,1)`; `a_{h,t}`). The only symbols it found newly written on an E07 page without the page in their row are the
bare `\phi` on par-inflow-model, the relation note's other-implementation notation, which the §3 φ row and the §1.1 φ
line record (the bare-`\phi` §2 row is the production function), and the bare `\delta` on scenario-generation, which
occurs only inside `\delta_t` and `\delta^{(\ell)}` of the `\delta_t` row; and single letters in the new `_scenario.*`
partials, which carry no math span. The rows a page listed but did not write already at `2723667` were triaged by
whether a form their Concept lists occurs: the drift on scenario-generation and par-inflow-model is corrected below;
on the pages E07 changed in one sentence or one pointer (lp-formulation, equipment-formulations, system-elements,
sddp-algorithm, the toy pages), the remaining cases are §4 rename targets or pre-epic rows outside E07's diff, and are
left to the E15 check.

Planned-entry counts, 2026-10-05: the four AC4 counts (`planned:[^|]*\(ticket-(08[4-9]|09[0-9]|10[0-2])[a-z]?\)` over
§2, `\(planned, ticket-(08[4-9]|09[0-9]|10[0-2])[a-z]?\)` over §3, `ticket-(08[4-9]|09[0-9]|10[0-2])` over the §1.1
intro, and the stale-wording count over §2 and the §3 meanings and Recommendation cells) print `0`, `0`, `0` and `0`;
at `2723667` they print `8`, `6`, `1` and `6`.

#### Reconciliation (ticket-102)

- E07 delta, from the registry at the epic's start (`2723667`) to the epic-complete tree, from the E07 tickets:
  - The page path `math/scenario-generation.md` is `math/scenario-generation.mdx` in §1-§5 (ticket-092).
  - Created: `H(\text{iteration}, \text{trajectory})`, which replaces the planned `H(i,m)` (ticket-086); `\Phi^{-1}`
    (ticket-091); `\tilde{\varepsilon}_{h,t}`, `\hat{C}`, `\hat{C}_m` and `\tilde{C}` (ticket-094). Renamed from
    planned rows: `m^{(k)}` → `m^{(\ell)}` and `r` → `n_{\text{pre}}` (ticket-085). Published from their planned rows:
    `W`, `\delta_t` (ticket-085), `N^{\rm eff}_t` (ticket-087), `\xi_r` on scenario-generation (ticket-089) and
    `\psi^*_{m,\ell}` on par-inflow-model (tickets 093, 095). §2 holds 488 rows, against 483 at `2723667`.
  - Retired: the deterministic-trunk branching `K`, kept with no page (ticket-090, XD-124).
  - §3 rows amended by the E07 tickets before this one: `C`, `H`, `K`, `N`, `a`, `k`, `m`, `n`, `r`, `y`, α, δ, ε, ξ, φ
    and ψ. §1.1: the `K` line is deleted (ticket-090); the δ, φ and ξ lines name scenario-generation or
    par-inflow-model and a `y` line is added (tickets 085, 089, 095a); the intro's held-back list drops `\delta`
    (ticket-085).
  - STO-27 is recorded as not documented (DF13, R74): the precomputed-model shape guard `validate_par_shape`
    (`crates/cobre-sddp/src/setup/mod.rs:815-830` at v0.17.0, called at `:364`) compares the stochastic pipeline's own
    PAR model with the system it was built from, so no case directory reaches it, and no page states it.
- Registry corrections by this ticket:
  - XD-121: the `\ell` row's Concept and Index cells and the `a_{h,\ell}` Index cell give lp-formulation §5a's
    `\ell \in \{1, \ldots, P^{\max}\}` in place of the 0-based clause; the `(i, j)` row's Index cell reads
    `1 \leq i, j \leq p` and its Concept "the lags `i` and `j`"; the `\psi^*_{m,\ell}` Concept drops the alias
    `\psi^*_{m,j}`, which no page writes.
  - XD-122 (ticket-089 guardian N1): the `\mu^{nc}_r` and `s^{nc}_r` Concepts read "of the unclamped availability
    factor" (`crates/cobre-sddp/src/stochastic/noise.rs:367-370` clamps `mean + std * eta`).
  - XD-116: the `N^{\rm eff}_t` Concept and Configure cells add the external-scenario clamp, so that the count is the
    smallest of `N_t`, `\lvert W\rvert` and the stage's external scenario count when a class is external in training
    (`crates/cobre-stochastic/src/tree/generate.rs:115-149`), as scenario-generation §2.5 and §4.2 now state.
  - XD-127: N1, the cost-scale `K` row drops `overview/notation-conventions.md`, whose only bare `K` was the
    declaration line ticket-090 deleted. Its `Notation` cell stays yes: the symbol is used on lp-formulation and
    cut-management, and the §2 rule counts two pages. Its notation entry is open: the E10-split declaration of
    ticket-159 names it on a declaration line only, which under XD-59 does not list the notation page, so the
    choice between a notation table row and `Notation` no is left to the orchestrator (ticket-102 report). N2, the §3
    `K` Recommendation drops "Declared scoped reuse: the trunk branching `K` (scenario-generation only)", and the
    append-only Decision cell gains a dated XD-127 note superseding the G1 note's §1.1 clause. N2's "add
    cut-management to the row's Pages" is not applied: cut-management already stands in the cost-scale meaning, and it
    writes no second meaning of `K`, so the co-occurrence cell cannot carry it (reported to the orchestrator). N3, the
    `t` row's Concept names lp-formulation's `\sum_{t'=t+1}^{L}`, which is in §8 (Variable Bounds), not §6.
  - XD-133: the `c` row and the `s_m` Concept write `\tilde s_m = c\, s_m` (§4 row of ticket-022); the
    `\gamma_m(\ell)` Concept gives the §3.5 note's `\gamma_m(0)`, `\gamma_m(\ell)` and bare `\gamma`; the
    `\psi_{m,\ell}` Concept, the `\psi^{A*}_m` Concept and the §3 ψ meaning place par-inflow-model's bare `\psi` in
    §1.2, §2.6 and §3.
  - XD-136: scenario-generation stopped writing `s_m`, `\psi^*` and `r_m` when ticket-092 moved its §1 to
    par-inflow-model. The `\psi^*_{m,\ell}` and `r_m` rows drop the page, with their §3 meanings. The `s_m` row keeps
    it through the form its Concept lists, the §4.4 heading's `σ = 0` (genuine §4.4), and so does its §3 meaning. The
    d2 clauses of the `\mu_m`, `s_m`, `\psi_{m,\ell}`, `r_m`, `P_h` (AR order) and `\rho_m(\ell)` rows lose their
    referent, scenario-generation's PAR diagram having moved to par-inflow-model: they are dropped, the `P_h` row
    stating scenario-generation's PAR(p) instead, and `\rho_m(\ell)` drops the page with its §3 meaning, as no other
    form of it remains there. The `t`,
    `\hat{a}_{h,\ell}` and `V_t(x)` rows cite the x₀ section as §4.5. The lag-sum `P_h` row states ticket-092's
    width, "twelve lags, or the classical order if larger" (`crates/cobre-stochastic/src/par/precompute.rs:197-212`).
  - Pages drift on scenario-generation and par-inflow-model found by the sweep, corrected here: `N_m`, `\lambda_i` and
    `z_{0.975}` drop scenario-generation, which has written none of them since before the epic, and their §3 meanings
    drop it too; the `z_{0.975}` Concept states the page's `z_{0.975} = 1.96` and threshold `z_{0.975}/\sqrt{N_m}` in
    place of `z_\alpha`, which no page writes; the `N_m` Configure cell says that
    `estimation.min_observations_per_season` is a recommended minimum below which estimation proceeds with a warning
    (ticket-095; the configuration page's own wording is E12 ticket-187c's). `\text{deterministic component}` is retired
    with no page: no page writes the symbol, scenario-generation stating the quantity in prose and as
    `b_{h,m(t)} + \sum_{\ell=1}^{P_h} \psi_{m(t),\ell}\, a^{(y)}_{h,t-\ell}`. The correlation-family Concepts carried
    the pre-rename forms of the §4 rows of ticket-022 (`\Sigma`, `L`, `D`, `\operatorname{diag}(\lambda)`, `z_h^{(t)}`):
    `z`, `C`, `\Lambda`, `C^{1/2}` and `\Delta a_{h,t}` state the forms the pages write, and the §3 `C`, λ, φ, `s` and
    `z` meanings name the renamed forms with no page where the old glyph no longer occurs.
  - The other PAR-family Concepts that still quoted a form the §4 rows of ticket-022 had renamed on par-inflow-model and
    scenario-generation before the epic state the page forms: `N_m` and `\text{PACF}_m(k)` (the threshold
    `z_{0.975}/\sqrt{N_m}`), `(i, j)` and `\hat{\boldsymbol{\rho}}_m`
    (`[\hat{\boldsymbol{\rho}}_m]_i = \hat{\rho}_m(i)`, `\hat{\boldsymbol{\rho}}^{\,\text{ext}}_m`), `\psi^A_m`
    (`\psi^A_m = \psi^{A*}_m \cdot s_m / \sigma^A_m`), `\varepsilon_t` (`\varepsilon = C^{1/2} z` on
    scenario-generation, toy-four-reservoir and the glossary), `U` and the Cholesky `L`, which drop their `V`, `\Sigma`
    and `L L^{\top} = \Sigma` clauses; the opening index `j` gives the 1-based `j \in \{1, \ldots, N_t\}` and
    `j \in \{1, \ldots, N_{\text{openings}}\}` in its Index cell and §3 `j` meaning, and the §3 ψ and hat meanings name
    `\psi^{A*}_m` and `\psi^A_m`.
  - New E07 page: `math/_impl/_scenario.notes.mdx` writes `σ = 0` for the §4.3 rule and `x₀` for the initial state;
    the `\sigma_m` and `x_t` rows and their §3 σ and `x` meanings list it.
- Content edits applied by this ticket under XD-149 (verified at v0.17.0):
  - scenario-generation §5.4 (XD-122 N1): `\mu^{nc}_r` and `s^{nc}_r` are "the mean and standard deviation of the
    unclamped availability factor" (`crates/cobre-sddp/src/stochastic/noise.rs:367-370`).
  - scenario-generation §4.1 and §4.2 item 1 (XD-122 N2): "every load bus with load statistics or external values for
    the load class, every NCS source with availability statistics or external values for the NCS class"; a bus or
    source with neither is not a noise member (`crates/cobre-core/src/system/mod.rs:441-486`,
    `crates/cobre-stochastic/src/context.rs:126-135,749-788`). Ticket-088's AC2 strings still count `1`.
  - scenario-generation §2.5 (XD-116): the opening count is `\min(N_t, \lvert W\rvert)` without an external class and
    the smaller of this and the stage's external scenario count with one, with a pointer to §4.2
    (`crates/cobre-stochastic/src/tree/generate.rs:115-149`).
  - glossary "Inflow-lag seed" (XD-111 backstop): the link is
    `/math/scenario-generation#45-x-consistency-under-historical-replay`, the github-slugger slug of
    `### 4.5 x₀ Consistency Under Historical Replay`, which the `_scenario.*` partials already link and `check:links`
    resolved in the snap097b gate.
  - par-inflow-model §5 invariant 2 (XD-138 U1): the implied `r_m^2` "must lie above a numerical floor", naming no
    constant (`crates/cobre-stochastic/src/par/closure.rs:196,225`).
- Upstream items (Requirement 5, read-only): E07 opened UP-57 and UP-58 (ticket-100: the simulation seed key changes
  no draw; `simulation.scenario_source.historical_years` has no effect when training is also `historical`; findings
  F-100-1, F-100-2) and UP-59 (ticket-099: a study stage with no season index panics before the historical-library
  check reports; corrected under XD-147 and XD-148). All three are in `design/upstream-issues.md` §1 and the findings
  register.
- Notation page (Requirement 3(d)): no edit. The definitions of the Notation = yes rows E07 touched match their
  registry rows and owner pages: `\xi_r` (system-elements; the ξ line names scenario-generation), `\psi^*_{m,\ell}`
  and `\ell` (par-inflow-model; lags `\ell \in \{1, \ldots, P_h\}`), `a_h` (lp-formulation), `C` and `C^{1/2}`
  (par-inflow-model §6.3, `U \Lambda^{1/2} U^\top` with negative eigenvalues clipped). The rows E07 publishes or adds
  are Notation = no.
- Declaration-line mentions (XD-59): unchanged. Of the Mirror spot-check exceptions above, `Q` is the one whose only
  notation-page occurrence is a declaration line.
- XD-07 narrowing: none needed; no §5 grep hit.
- Orchestrator addendum after the guardian (XD-152): `s_m` drops `math/scenario-generation.mdx` from its Pages cell
  and its §3 meaning list. The §4.4 heading's `σ = 0` is the standard deviation of an external column, not the
  seasonal sample std, and no other `s_m` form occurs on the page.
- Orchestrator addendum (XD-151/XD-152): `reference/bibliography.md` now writes `N_m` in the PACF band
  `\pm 1.96/\sqrt{N_m}`, so it joins the `N_m` Pages cell and its §3 meaning list.

#### §1.1 held-back list (XD-57)

The §1.1 intro, printed with `awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md`, names no
ticket of E07 (`/usr/bin/grep -cE 'ticket-(08[4-9]|09[0-9]|10[0-2])'` on it prints `0`). Its held-back list, quoted
verbatim with the hard wraps joined:

> Two kinds of decided reuse are not listed yet. An E10-split reuse (§3 rows `K`, `L`, `A`, `D`, `i`, `j`, `s`, `m`) shares `lp-formulation` or `system-elements` until E10 makes it page-disjoint, which principle 4 requires first; ticket-159 adds it then. A reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046): the planned meaning of `q` (ticket-115).

#### Hand-off: rows with a later page

Every §2 table row whose Pages cell still names a later page (4 rows), generated from the §2 table rows only, with the
tickets its planned entries name. Each named ticket publishes and resolves its row, and each later epic's verification
ticket keeps the registry and the notation page current (ADR-046).

- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)

Line counts are per entry: this entry's hand-off list carries 4 lines with the planned-entry token (6 tokens, as one
line carries three), and the Mirror check command, the Pages check command and the planned-entry count pattern above
are the 5th, 6th and 7th such lines, as in the ticket-031 entry (XD-11 4A). No row carries a later-page entry that
names a ticket of E07.

### 2026-10-05 — ticket-112 (E08 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over `src/content/docs src/figures
src/components` with `pt-br/` excluded. E08 adds no §4 row (it renames no symbol), so the count equals E07's.

Output, 2026-10-05 (131 greps, 0 hits each), both before and after this ticket's edits; it is identical to the
ticket-102 output:

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
```

#### Declarations, Mirror and Pages checks

- §1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
  `### Declared Scoped Reuse` subsection, which holds the same 37 lines. Output, 2026-10-05: empty.
  `awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done`
- Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (259 rows checked):

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Output, 2026-10-05: empty. The check matches each symbol as a plain substring, so a one- or two-glyph symbol passes
whatever the page defines (XD-127; the tool gap stays routed to E15). The short symbols among the Notation = yes rows
E08 touched were checked by hand,
meaning by meaning, against the notation page:

- `i`, the Benders cut index, has an entry: the §1 row "$i$ | Cut index ($\beta_{0,i}$, $\beta_i$)" and the
  `\max_i \{\beta_{0,i} + \beta_i^\top x\}` of the `\underline{V}_\tau(x)` row;
- `n`, the number of cycle repetitions of the cyclic-graph limit, occurs on its declaration line only ("in
  [Horizon Modes](/math/horizon-modes) it counts cycle repetitions"); the page's `n` entries are the policy-graph node
  (§1) and the transmission-line index (§2). Ticket-102 recorded the same finding as "no entry", reading the page
  without its declaration lines; ticket-111 changed only that line's page list.

The Pages checks follow.

- Pages check, block A of ticket-112: for the forms `\mathcal{W}`, `w_{t,\mathcal{W}}`, `a_{h,t}` (row `a_h`),
  `V_{T+1}` (row `V_t(x)`), `\mathcal{X}_\tau` (row `\mathcal{X}_t(x_{t-1}, \omega_t)`), `\mathbb{T}_\tau`,
  `d_{\text{cycle}}` and `t_i(m)`, every page among multi-resolution-studies, post-study-boundary, sddp-algorithm,
  horizon-modes, discount-rate and the notation page that writes the form must stand in that row's Pages cell. Block A
  (ticket-112, Testing Requirements) as written reads the whole notation page, and it prints
  `UNLISTED \mathcal{W} (\mathcal{W}) overview/notation-conventions.md` and
  `UNLISTED w_{t,\mathcal{W}} (w_{t,\mathcal{W}}) overview/notation-conventions.md`: on the notation page both forms
  occur only on the `$w_k$` declaration line (ticket-103). With the notation page read without its
  `### Declared Scoped Reuse` lines, as block C reads it (XD-59, XD-170), block A prints nothing. Neither row lists the
  notation page (see Declaration-line mentions under Reconciliation).
- Pages check, block C of ticket-112 (the ticket-102 block C with the E08 symbols), corpus-wide over every
  `.md`/`.mdx` page of `src/content/docs` with `pt-br/` excluded and the notation page read without its
  `### Declared Scoped Reuse` lines (XD-59). A planned entry does not count as listed, and `ENVIRON` passes each symbol
  to `awk`:

```bash
pages_of() { S="\`$1\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,|]*//g'; }
txt() { case "$1" in */overview/notation-conventions.md) awk '/^### Declared Scoped Reuse$/{f=1;next} f&&/^#/{f=0} !f' "$1" ;; *) cat "$1" ;; esac; }
P="$(find src/content/docs -name pt-br -prune -o -type f \( -name '*.md' -o -name '*.mdx' \) -print | sort)"
while IFS='|' read -r sym pat; do
  cell="$(pages_of "$sym")"; [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $P; do txt "$p" | /usr/bin/grep -qP -- "$pat" || continue
    rel="${p#src/content/docs/}"
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym $rel" ;; esac; done
done <<'EOF'
\mathcal{W}|\\mathcal\{W\}
w_{t,\mathcal{W}}|w_\{t,\\mathcal\{W\}\}
a_h|(?<![A-Za-z\\])a_\{h,t\}
V_t(x)|V_\{T\+1\}
\mathcal{X}_t(x_{t-1}, \omega_t)|\\mathcal\{X\}_\\tau
\mathbb{T}_\tau|\\mathbb\{T\}_\\tau
d_{\text{cycle}}|d_\{\\text\{cycle\}\}
\delta_{b,k,s}|\\delta_\{b,k,s\}
\mathcal{S}_b|\\mathcal\{S\}_b
t_i(m)|t_i\(m\)
\underline{z}^k|\\underline\{z\}\^\{?\\,?k
EOF
```

Output, 2026-10-05: empty, both before and after this ticket's edits. Run on the `87b7890` registry and tree (each file
read with `git show HEAD:<path>`), it prints `NO-ROW \mathcal{W}` and `NO-ROW w_{t,\mathcal{W}}`, the two rows
ticket-103 creates, and nothing else.

Planned-entry counts, 2026-10-05: the four AC4 counts (`planned:[^|]*\(ticket-1(0[3-9]|1[0-2])a?\)` over §2,
`\(planned, ticket-1(0[3-9]|1[0-2])a?\)` over §3, `ticket-1(0[3-9]|1[0-2])` over the §1.1 intro, and `weekly-monthly`
over §1-§4) print `0`, `0`, `0` and `0`; at `87b7890` they print `0`, `0`, `0` and `10`.

#### Reconciliation (ticket-112)

- E08 delta, from the registry at the epic's start (`87b7890`) to the epic-complete tree, row by row from the registry
  diff and attributed by the E08 tickets' registry requirements:
  - Page paths: no page is renamed. `math/weekly-monthly-coupled-studies.md` is deleted (ticket-109), and ticket-105
    removed it from every cell that named it: the §2 rows `t` (its Pages cell, plus the Concept and Index clauses that
    cited that page's "stage 0" wording), `\mathcal{H}`, `P_h` (Pages and Concept) and `\hat{a}_{h,\ell}` (Pages,
    Concept and Index), and the §3
    hat, `a`, `h`, `P`, `t` and `𝓗` meanings. No §1-§4 cell names the page.
  - Created: `\mathcal{W}` (the lag period) and `w_{t,\mathcal{W}}` (the share of lag period `\mathcal{W}` covered by
    stage `t`), both on multi-resolution-studies only, Notation no (ticket-103). §2 holds 490 rows, against 488 at
    `87b7890`.
  - Retired with no page, owner kept: `Q` (the quarter of the duration-weighted aggregation), `a^{(Q)}_q`, `a^{(M)}_m`
    and `d_m` (ticket-103).
  - Pages added: multi-resolution-studies to `a_h` and `\mathcal{H}` (ticket-103; its §2 writes `a_{h,t}` and
    `h \in \mathcal{H}`); post-study-boundary to `V_t(x)` (ticket-105, the terminal condition `V_{T+1} = 0`);
    horizon-modes to `\mathcal{X}_t(x_{t-1}, \omega_t)` (ticket-110, the season-indexed
    `\mathcal{X}_\tau(x, \omega_\tau)`).
  - Pages removed: the retired page from every row (ticket-105, above); discount-rate from `d_{\text{cycle}}`, the
    cycle-repetition `n`, `\delta_{b,k,s}` and `\mathcal{S}_b` (ticket-111).
  - Concepts restated to the pages' forms: ticket-110's eight rows (`\underline{z}^k`, `\mathbb{T}_\tau`, `u_t`,
    `d_{t \to t+1}`, `i`, `\mathcal{I}_\tau` with its Index cell, `\underline{V}_\tau(x)` and `V_t(x)`) and the
    `\mathcal{X}_t(x_{t-1}, \omega_t)` Concept with its new page; ticket-111's bare-`d` clause of `d_{t \to t+1}`;
    ticket-103's `a_h` clause; ticket-105's `V_t(x)` terminal-condition clause and the `t`, `P_h` and
    `\hat{a}_{h,\ell}` clauses above.
  - §3 cells changed: `w`, `Q`, `d`, `a`, `h` and `𝓗` (ticket-103); `V`, hat, `a`, `h`, `P`, `t` and `𝓗` (ticket-105);
    `𝒳`, `k`, `𝒦` and `τ` (ticket-110); `d`, `n`, `δ` and `s` (ticket-111). Each changed Decision cell cites its ticket.
  - §1.1: the `$Q_t$` line drops the quarter and the `$w_k$` line adds `w_{t,\mathcal{W}}` (ticket-103); the `$n$` line
    names Horizon Modes alone for the cycle repetitions (ticket-111). The notation page's declaration lines change in
    step (the §1.1 check above).
  - Ticket-108 and its XD-168 correction changed post-study-boundary §4 prose and its figures and wrote no symbol, so
    the registry has no ticket-108 change; block A and block C print nothing for the page.
  - The ticket-112 Requirement 3 summary omits three items this diff shows, each required by its ticket (ticket-103
    Requirement 10, ticket-105 Requirement 8):
    - multi-resolution-studies in the `\mathcal{H}` Pages cell and in the §3 `h` and `𝓗` meanings (ticket-103);
    - the §3 hat, `a`, `h`, `P`, `t` and `𝓗` meanings that drop the retired page (ticket-105);
    - the `t`, `P_h` and `\hat{a}_{h,\ell}` Concept and Index clauses that cite the retired page (ticket-105).
- Registry corrections by this ticket: none. No `UNLISTED` or `NO-ROW` line stands under the XD-59 reading, and no §5
  grep hits.
- Content edits applied by this ticket: none; ticket-112 edits no content page.
- Declaration-line mentions (XD-59): `\mathcal{W}` and `w_{t,\mathcal{W}}` occur on the notation page only on the
  `$w_k$` declaration line, so neither row lists the notation page and both keep Notation no (ticket-103,
  XD-170). The same practice applies to `r_t` and the iteration-limit `k_{max}` (ticket-074, XD-55), `\xi_h`
  (ticket-083) and the cost-scale `K` (ticket-102); the `K` row keeps Notation yes under the two-page rule.
- Upstream items (Requirement 4, read-only): no E08 item has a UP number. `design/upstream-issues.md` ends at UP-59,
  which E07 opened. Each E08 item is a candidate in the findings register (`design/findings-register.md` §1, §6):
  - F-E08-1: under an overlapping season map, the backward lag-seed walk wraps from the lowest season id to the highest
    (E08 delta pass; static reading);
  - F-E08-2: under PAR(p)-A the lag-seed coverage gate only warns, although the annual term reads the seeds (E08 delta
    pass);
  - F-E08-3: the accumulator seed casts the inflow record over the first stage's whole season period, not only the
    part before the study start (E08 delta pass);
  - F-E08-4: the fitting aggregate groups observations by calendar year, so on the overlapping-map path a coarse season
    that crosses a year boundary is split (E08 delta pass, narrowed by ticket-103);
  - F-E08-5: under a `custom` season map the next season period is the next definition in id order, not in calendar
    time (ticket-103);
  - F-E08-6: weekly stages not aligned to ISO Mondays in a 53-week year drop the week-52 spillover and key their noise
    group by calendar year (ticket-103; confirmed by its guardian at the tag);
  - F-E08-7: the per-pool active-cut cap is enforced on the terminal pool, so imported boundary cuts can be deactivated
    (ticket-107; confirmed by static reading);
  - F-105-1: with default settings, a non-terminal source pool of an upstream policy with AR lags refuses the load
    (ticket-105; confirmed by static reading);
  - F-106-1: lag-seed coverage is not checked when the AR coefficients are estimated (ticket-106);
  - F-106-2: a cobre doc comment states the in-progress period as `[period_start, study_start)`, but the code casts
    onto the whole period (ticket-106; comment only);
  - the ticket-108 guardian row (findings §6, a docs defect): post-study-boundary §4's "copy", "renormalized" and
    "fanned out" wording, corrected under XD-168.
- Notation page (Requirement 3): no edit. The definitions of the Notation = yes rows E08 touched match their registry
  rows and owner pages: `a_h` (lp-formulation §4b, `z_h = a_h` the realized incremental inflow); `n` for the cycle
  repetitions (declaration line only, above; horizon-modes "Cycle Convergence Inequality" writes
  `\lim_{n \to \infty} d_{\text{cycle}}^{\,n} \cdot V_t(x) = 0`); `\underline{z}^k` (upper-bound-evaluation §9,
  `\underline{z}^k = c_1(\hat{x}_1) + d_{1 \to 2} \cdot \underline{V}_2(\hat{x}_1)`); `u_t` and `d_{t \to t+1}`
  (discount-rate §2, the control in the stage minimization and "the discount factor for the transition from stage `t`
  to `t+1`"); `\mathcal{X}_t(x_{t-1}, \omega_t)` and `V_t(x)` (sddp-algorithm §2,
  `(x_t, u_t) \in \mathcal{X}_t(x_{t-1}, \omega_t)`); `i` (cut-management §4, `\beta_{0,i} + \beta_i^\top x`);
  `d_{\text{cycle}}` (horizon-modes, `\prod_{t \in \text{cycle}} d_{t \to t+1} < 1`); `\delta_{b,k,s}` (lp-formulation
  §2 and the load balance). For `\mathcal{S}_b`, the notation page's "Deficit segments for bus $b$, indexed by $s$"
  matches the row; the owner page, penalty-system, states the segments in prose ("Piecewise Deficit") and writes
  `c^{def}_{b,s}`, and the glyph is written on lp-formulation and system-elements, as at `87b7890` (E08 dropped only
  discount-rate). The declaration lines match their rows and pages: `$Q_t$` the `Q_t` row (cut-management §2, the
  optimal objective value of the stage-`t` subproblem) and the FPHA `Q` row (hydro-production-models); `$w_k$` the
  `w_k` (block-formulations), `w_m` (upper-bound-evaluation), `w` (par-inflow-model) and `w_{t,\mathcal{W}}`
  (multi-resolution-studies §2, `w_{t,\mathcal{W}} = \lvert t \cap \mathcal{W} \rvert / \lvert \mathcal{W} \rvert`)
  rows, multi-resolution-studies writing neither `w_k` nor a bare `w`; `$n$` the three `n` rows, with Horizon Modes
  alone for the cycle repetitions.
- XD-07 narrowing: none needed; no §5 grep hit.

#### §1.1 held-back list (XD-57)

The §1.1 intro, printed with `awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md`, names no
ticket of E08 (`/usr/bin/grep -cE 'ticket-1(0[3-9]|1[0-2])'` on it prints `0`). Its held-back list, quoted
verbatim with the hard wraps joined:

> Two kinds of decided reuse are not listed yet. An E10-split reuse (§3 rows `K`, `L`, `A`, `D`, `i`, `j`, `s`, `m`) shares `lp-formulation` or `system-elements` until E10 makes it page-disjoint, which principle 4 requires first; ticket-159 adds it then. A reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046): the planned meaning of `q` (ticket-115).

#### Hand-off: rows with a later page

Every §2 table row whose Pages cell still names a later page (4 rows, the same as in the ticket-102 entry), generated
from the §2 table rows only, with the tickets its planned entries name. Each named ticket publishes and resolves its
row, and each later epic's verification ticket keeps the registry and the notation page current (ADR-046).

- `\alpha'` — introduced by ticket-118 — Pages: planned: math/_impl/_risk.notes.mdx (ticket-118)
- `\beta(\tilde{x}, \omega)` — introduced by ticket-115 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115)
- `\mu^*` — introduced by ticket-115, ticket-119 — Pages: math/risk-measures.mdx, planned: math/risk-measures.mdx (ticket-115), planned: src/components/CvarWeightsPlot.astro (ticket-119), planned: overview/notation-conventions.md (ticket-115)
- `q^*` — introduced by ticket-115 — Pages: planned: math/risk-measures.mdx (ticket-115)

Line counts are per entry: this entry's hand-off list carries 4 lines with the planned-entry token (6 tokens, as one
line carries three), and the Mirror check command, the Pages check command and the planned-entry count pattern above
are the 5th, 6th and 7th such lines, as in the ticket-031 entry (XD-11 4A). No row carries a later-page entry that
names a ticket of E08.

### 2026-10-06 — ticket-181 (E11 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over
`src/content/docs src/figures src/components` with `pt-br/` excluded. E11 adds no §4 row (it renames no symbol), so the
count equals E08's (131).

Output, 2026-10-06 (131 greps, 0 hits each); it is identical to the ticket-112 output:

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
```

#### Declarations, Mirror and symbol checks

§1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
`### Declared Scoped Reuse` subsection. Output, 2026-10-06: empty.

```bash
awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' \
  | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done
```

Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (260 rows checked). Output,
2026-10-06: empty. The check matches each symbol as a plain substring (XD-127; the tool gap stays routed to E15).

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Symbol check (Requirement 4c), the ticket AC4 command: the added lines of the `git diff HEAD` of the six reference pages
and the three `_impl` partials that E11 edited (`_equipment.configure`, `_penalties.configure`, `_penalties.io`), with
escaped `\$` and `$schema` removed, counted for a `$...$` span. The diff carries the edits of the other epics on those
files, which this check does not separate from E11's.

```bash
d=src/content/docs; git diff HEAD -- $d/reference/case-directory-format.mdx $d/reference/output-format.mdx $d/reference/error-codes.mdx $d/reference/generic-constraints.mdx $d/reference/cli-reference.mdx $d/reference/json-schemas.mdx $d/math/_impl/_equipment.configure.mdx $d/math/_impl/_penalties.configure.mdx $d/math/_impl/_penalties.io.mdx | /usr/bin/grep -E '^\+' | /usr/bin/grep -v '^+++' | sed -E 's/\\\$//g; s/"?\$schema"?//g' | /usr/bin/grep -cE '\$[^$ ][^$]*\$'
```

Output, 2026-10-06: `1`. The one match is not a math span. It is the `unit` row that ticket-173 wrote on
`reference/output-format.mdx` (the currency sign `$` of two neighbouring code spans pairs across the comma in the list
of units). With inline code spans removed first, the same check prints `0`:

```bash
d=src/content/docs; git diff HEAD -- $d/reference/case-directory-format.mdx $d/reference/output-format.mdx $d/reference/error-codes.mdx $d/reference/generic-constraints.mdx $d/reference/cli-reference.mdx $d/reference/json-schemas.mdx $d/math/_impl/_equipment.configure.mdx $d/math/_impl/_penalties.configure.mdx $d/math/_impl/_penalties.io.mdx | /usr/bin/grep -E '^\+' | /usr/bin/grep -v '^+++' | sed -E 's/\\\$//g; s/"?\$schema"?//g; s/`[^`]*`//g' | /usr/bin/grep -cE '\$[^$ ][^$]*\$'
```

No E11 ticket added a symbol, so no §2 row, Pages entry or block C run is due.

`/usr/bin/grep -c '^### .* — ticket-181 (E11 acceptance)$' docs/design/symbol-registry.md` prints `1` once this entry is
in.

#### Reconciliation (ticket-181)

E11 delta: none. No E11 ticket writes, re-means or moves a math symbol (every planner fork reported "no registry
delta"). The diff from `HEAD` of the registry (cut off before this entry, as the command below does) and of the notation
page carries no line that names an E11 ticket (the count below prints `0`); the edits it does show belong to the tickets
of the other epics that run beside E11 (XN-14).

```bash
{ sed '/^### .* — ticket-181 (E11 acceptance)$/,$d' docs/design/symbol-registry.md | diff -U0 <(git show HEAD:docs/design/symbol-registry.md) - ; \
  git diff HEAD -U0 -- src/content/docs/overview/notation-conventions.md ; } \
  | /usr/bin/grep -E '^[+-]' | /usr/bin/grep -v '^+++\|^---' | /usr/bin/grep -cE 'ticket-(16[0-9]|17[0-9]|180)[a-c]?\b'
```

- Registry corrections by this ticket: none. Notation page: no edit (the Mirror and declarations checks print nothing).
  Content edits applied by this ticket: none; ticket-181 edits the banned-phrase register (BP entries and a §3 log
  entry) and this entry.
- Narration burn-down and reports (Requirements 2 and 3), 2026-10-06: `# owner: E11 ` entries in
  `scripts/doc-lint-allow.txt`: `0`; the case-format report has `Open rows: 0` (100 mismatch rows: 52
  `fixed by ticket-NNN`, 48 `dropped: ...`); the output and error reports carry no `| open |` cell; the
  generic-constraint record holds 5 `accept` rows at exit `0` and 7 `reject` rows at exit `1` with the release-archive
  hash, and the page carries 12 `gc-check` fences.
- Upstream items (Requirement 5, read-only): E11's refinement and execution reported 104 candidates. Each has a row in
  `design/findings-register.md` (§1 to §4) with its evidence and status; the orchestrator files them in
  `design/upstream-issues.md` from the next free UP number (XN-07). This entry does not file them. By register section:
  - §1 (cobre code: behaviour that is probably wrong; 16): E11-C1, E11-GC-C1, E11-GC-C2, E11-GC-C4, E11-GC-C3, F-163-3,
    F-171c-1, F-171c-O4, F-166-1, F-172-1, F-165a-S1, F-165a-S2, F-166a-S2, F-166a-S3, F-166a-S4, U-173b-2.
  - §2 (cobre code: validation, CLI contract and UX gaps; 45): E11-C2, E11-C3, E11-C4, E11-C5, E11-C6, E11-C7, E11-C8,
    E11-C9, E11-C10, F-E11Δ-1, F-E11Δ-2, F-E11Δ-3, F-E11Δ-5, F-E11Δ-6, F-E11Δ-10, F-E11Δ-11, F-E11Δ-12, F-170-4,
    F-162-1, F-162-2, F-162-3, F-162-5, F-163-1, F-163-2, F-163-4, F-163-5, F-164-1, F-164-2, F-171c-2, F-175-1,
    F-175-3, F-179-1, F-166a-1, F-176-2, F-167-2, F-176b-1, F-176b-2, F-167a-1, F-167a-2, F-168-2, F-168-3, F-168-6,
    F-168-7, U-169-1, U-169-2.
  - §3 (cobre code: output contract and messages; 28): E11-C11, E11-C12, E11-C13, E11-C14, E11-C15, E11-C16, F-E11Δ-8,
    F-E11Δ-9, F-E11Δ-13, F-170-1, F-171-2, F-171-3, F-171-5, F-174b-2, F-171a-2, F-171b-1, F-178-2, F-171c-O1, F-175b-3,
    F-175b-4, F-173a-3, F-167a-G1, U-173b-1, U-173b-3, U-173b-4, U-173b-5, U-173b-6, U-173b-7.
  - §4 (cobre comments, docs and release artefacts; 15): F-E11Δ-4, F-E11Δ-7, F-161-1, F-171b-2, F-163-7, F-171c-3,
    F-172-2/3/4, F-166a-S5, F-176-3, F-173a-4, F-173a-5, F-167-4, F-168-4, F-168a-1, F-168a-3.
  - Items that are not candidates and stay with their owners: F-176a-4 (`SddpError::BasisShapeMismatch`, closed as
    `dropped`: the UP-37 probe did not reach the guard; no reachable path has been reported since, so nothing reopens
    it) and F-176a-6 (provenance gap R5: `FileNotFound`, `SemanticAmbiguity`, `HydroModelsPreparationError`,
    `GenericConstraintValidationError` and `BoundaryReconciliationError` show their message only as an unlabelled inline
    example, so their `Example source` is `—` in the ticket-176a report; this ticket edits no content page, so the five
    entries are listed for the E13 error-codes tickets 212 and 212a to label).
- Hand-offs: the widened banned phrase `Per-\(stage, block\) (monetary )?cost` waits for ticket-207i, which rewrites
  `math/_impl/_equipment.io.mdx:36`; the plain `Load buses exist` and the fifth ticket-170 candidate wait for E12
  ticket-200 (`running/running-studies.mdx`); the broad `does not currently trim` waits for E10 ticket-159.

#### §1.1 held-back list

The §1.1 intro, printed with the first command below, names no ticket of E11 (the second command prints `0`).

```bash
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md | /usr/bin/grep -cE 'ticket-(16[0-9]|17[0-9]|180)'
```

#### Hand-off: rows with a later page

Every §2 table row's Pages cell names only existing pages: `awk -F'|' '/^## 2\./,/^## 3\./ { if ($6 ~ /planned:/ && NF>8) n++ } END { print n+0 }' docs/design/symbol-registry.md` prints `0`. No row carries a later-page entry that names a ticket of E11.

### 2026-10-06 — ticket-139 (E09 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over
`src/content/docs src/figures src/components` with `pt-br/` excluded. E09 adds no §4 row (it renames no symbol), so the
count equals E11's (131).

```bash
awk '/^## 5\./,/^## 6\./' docs/design/symbol-registry.md | /usr/bin/grep -E '^(# §4 row|grep )' \
  | while IFS= read -r l; do
      case "$l" in '# '*) row="${l#\# }"; continue ;; esac
      cmd="$(printf '%s' "$l" | sed -E "s|^grep |/usr/bin/grep --exclude-dir=pt-br |; s|'( [^' ]+)+\$|' src/content/docs src/figures src/components|")"
      printf '%s: %s\n' "$row" "$(eval "$cmd" | wc -l)"
    done
```

Output, 2026-10-06 (131 greps, 0 hits each); it is identical to the ticket-181 output:

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
```

#### Declarations, Mirror, Pages and symbol checks

§1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
`### Declared Scoped Reuse` subsection, which holds the same 37 lines. Output, 2026-10-06: empty.

```bash
awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' \
  | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done
```

Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (259 rows checked, one fewer than
in the ticket-181 entry because `\theta_\omega` is now Notation `no`). Output, 2026-10-06: empty. The check matches
each symbol as a plain substring (XD-127; the tool gap stays routed to E15); the Notation = yes rows E09 touched are
compared with the notation page by hand under Reconciliation.

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Pages check, block A of ticket-139 (Testing Requirements, unchanged). Output, 2026-10-06: empty. Before this ticket's
Pages fixes it printed `UNLISTED \underline{z}^k (\underline{z}^k) math/cut-management.mdx`.

```bash
pages="src/content/docs/math/risk-measures.mdx src/content/docs/math/_impl/_risk.configure.mdx src/content/docs/math/_impl/_risk.notes.mdx src/content/docs/math/cut-management.mdx src/content/docs/math/sddp-algorithm.mdx src/content/docs/math/stopping-rules.mdx src/content/docs/math/upper-bound-evaluation.md src/content/docs/math/policy-graphs.mdx src/content/docs/math/lp-warm-start.mdx src/content/docs/math/determinism-guarantees.mdx src/content/docs/overview/sddp-framework-overview.mdx src/content/docs/overview/what-cobre-solves.md src/content/docs/reference/glossary.md src/content/docs/overview/notation-conventions.md src/components/CvarWeightsPlot.astro"
while IFS='|' read -r form sym; do
  cell="$(S="\`$sym\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,]*//g')"
  [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $pages; do
    /usr/bin/grep -qF -- "$form" "$p" || continue
    rel="${p#src/content/docs/}"
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym ($form) $rel" ;; esac
  done
done <<'PAIRS'
\mu^*|\mu^*
q^*|q^*
\beta(\tilde{x}, \omega)|\beta(\tilde{x}, \omega)
\alpha'|\alpha'
\underline{z}^k|\underline{z}^k
\varphi_i|\varphi_i
P(n \to n')|P(n \to n')
p_{n'}(\omega)|p(\omega)
d_{1 \to t}|d_{1 \to t}
Q_1^k|Q_t
\rho_1|\rho^{\lambda, \alpha}
L_t^\top|L_t
\underline{z}^{k-\tau+1}|\tau
PAIRS
```

Pages check, corpus-wide: the ticket-112 block C shape with the E09 forms, over every `.md`/`.mdx` page of
`src/content/docs` with `pt-br/` excluded and the notation page read without its `### Declared Scoped Reuse` lines
(XD-59), plus the four risk and convergence islands. A planned entry does not count as listed, and `ENVIRON` passes each
symbol to `awk`. The `\underline{z}^k` pattern writes the optional thin space as `(\\,)?`: in the ticket-112 block C
pattern `\\underline\{z\}\^\{?\\,?k` the `?` binds to the comma alone, so the pattern requires a literal backslash,
matches only the `^{\,k` forms and never matched `\underline{z}^k`. Output, 2026-10-06: empty. Before this ticket's
edits it printed the five lines in the first block below; the `P^{\max}` line comes from this ticket's own
sddp-algorithm §5 edit. The second block is the command.

```text
UNLISTED \underline{z}^k math/_impl/_cut-management.notes.mdx
UNLISTED \underline{z}^k math/cut-management.mdx
UNLISTED \bar{z}^k math/cut-management.mdx
UNLISTED \rho^{\lambda, \alpha} math/_impl/_risk.configure.mdx
UNLISTED P^{\max} math/sddp-algorithm.mdx
```

```bash
pages_of() { S="\`$1\`" awk -F'|' '/^## 2\./,/^## 3\./ { c=$3; gsub(/^ +| +$/,"",c); if (c==ENVIRON["S"]) print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,|]*//g'; }
txt() { case "$1" in */overview/notation-conventions.md) awk '/^### Declared Scoped Reuse$/{f=1;next} f&&/^#/{f=0} !f' "$1" ;; *) cat "$1" ;; esac; }
P="$(find src/content/docs -name pt-br -prune -o -type f \( -name '*.md' -o -name '*.mdx' \) -print | sort) src/components/CvarWeightsPlot.astro src/components/ConvergencePanelsPlot.astro src/components/ConvergencePlot.astro src/components/CvarPlot.astro"
while IFS='|' read -r sym pat; do
  cell="$(pages_of "$sym")"; [ -n "$cell" ] || { echo "NO-ROW $sym"; continue; }
  for p in $P; do txt "$p" | /usr/bin/grep -qP -- "$pat" || continue
    case "$p" in src/content/docs/*) rel="${p#src/content/docs/}";; *) rel="$p";; esac
    case "$cell" in *"$rel"*) ;; *) echo "UNLISTED $sym $rel" ;; esac; done
done <<'PAIRS'
\underline{z}^k|\\underline\{z\}\^\{?(\\,)?k
\bar{z}^k|\\bar\{z\}\^\{?k
\mu^*|\\mu\^\*
q^*|q\^\*
\varphi_i|\\varphi_i
P(n \to n')|P\(n \\to n'\)
p(\omega)|p_\{n'\}\(\\omega\)|(?<![A-Za-z\\])p\(\\omega\)
d_{1 \to t}|d_\{1 \\to
\rho^{\lambda, \alpha}|\\rho\^\{\\lambda|\\rho_1\b|\\rho_t\b|\\rho_\{t-1\}
L_t|L_t\^\\top|L_\{t\+1\}\^\\top
\tau|\\underline\{z\}\^\{k-\\tau\+1\}
P^{\max}|P\^\{\\max\}
\theta_\omega|\\theta_\\omega
V(x, \omega)|V\(x, \\omega\)
\beta(\tilde{x}, \omega)|\\beta\(\\tilde\{x\}, \\omega\)
\alpha'|\\alpha'
PAIRS
```

Pages-exist check (ticket-139 Testing Requirements): every page path in a §2 Pages cell exists. Output, 2026-10-06:
empty.

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { print $6 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,]*//g' \
  | tr ',' '\n' | sed -E 's/^ +| +$//g' | /usr/bin/grep -E '\.(md|mdx|astro|ts)$' | sort -u \
  | while read -r p; do case "$p" in src/*) f="$p";; *) f="src/content/docs/$p";; esac; [ -e "$f" ] || echo "MISSING $p"; done
```

Planned-entry and retired-path counts (Requirement 3). Output, 2026-10-06: `0`, `0`, `0` and `0`. At `e11aa48` they
print `4`, `0`, `6` and `3`. The second command stays as the ticket wrote it but can never match, because §3 does not
use the `planned:` form; the fourth command counts §3's own `(planned, ticket-NNN)` form.

```bash
awk '/^## 2\./,/^## 3\./' docs/design/symbol-registry.md | /usr/bin/grep -cE 'planned:[^|]*\(ticket-1(1[3-9]|2[0-9]|3[0-8])a?\)'
awk '/^## 3\./,/^## 4\./' docs/design/symbol-registry.md | /usr/bin/grep -cE 'planned:[^|]*\(ticket-1(1[3-9]|2[0-9]|3[0-8])a?\)'
awk '/^## 1\./,/^## 4\./' docs/design/symbol-registry.md | /usr/bin/grep -cE 'reproducibility-and-provenance|lp-warm-start\.md\b|determinism-guarantees\.md\b'
awk '/^## 3\./,/^## 4\./' docs/design/symbol-registry.md | /usr/bin/grep -cE '\(planned, ticket-1(1[3-9]|2[0-9]|3[0-8])a?\)'
```

Symbol check: the `$...$` spans on the lines this ticket added to its content pages, with escaped `\$` and inline code
spans removed first, against the pre-edit copies kept in the plan's scratch directory, `.orch/t139/pre` (the epic's
earlier edits on these pages are in the copies, so only this ticket's lines are read). Git does not track that
directory, so this check records its result and cannot be re-run from a clean checkout. Output, 2026-10-06: 29 spans,
each the symbol of an existing §2 row that lists the page it stands on (block A and the corpus-wide check above print
nothing): `(\text{operational\_start\_date}, \text{id})`, `N`, `N_t = N`, `N_{hydro} \cdot P^{\max}`, `P^{\max}`,
`P_h`, `\epsilon`, `\hat{x}_t`, `\hat{x}_{t-1}`, the seven entity sets `\mathcal{B}` to `\mathcal{T}`,
`\rho^{\lambda, \alpha}` and its definition (two spans), `\rho_t`, `\theta_1`, `\underline{z}^k`, `a_{h,\ell}`,
`d_{1 \to 2}`, `k`, `k_1`, `k_1 = \infty`, `k_2`, `k_2 = 0` and `x_0`.

```bash
p=plans/v0.17.0-docs-sync/.orch/t139/pre
for f in math/cut-management.mdx math/_impl/_cut-management.notes.mdx math/sddp-algorithm.mdx math/policy-graphs.mdx math/scenario-generation.mdx math/discount-rate.mdx overview/notation-conventions.md; do
  diff -U0 "$p/$f" "src/content/docs/$f"; done | /usr/bin/grep -E '^\+' | /usr/bin/grep -v '^+++' \
  | sed -E 's/\\\$//g; s/`[^`]*`//g' | /usr/bin/grep -oE '\$[^$ ][^$]*\$' | sort -u
```

`/usr/bin/grep -c '^### .* — ticket-139 (E09 acceptance)$' docs/design/symbol-registry.md` prints `1` once this entry is
in.

#### Reconciliation (ticket-139)

- E09 delta, from the registry at the epic's start (`e11aa48`) to the epic-complete tree. The diff also carries the
  edits of the E10, E11 and E14 tickets that ran beside E09 (XN-14, XN-15); the items below are E09's, from the E09
  tickets' registry requirements and completion reports, each checked against its row:
  - §2 holds 492 rows, against 490 at `e11aa48` (the command below counts them, without the header and separator
    rows):

    ```bash
    awk '/^## 2\./,/^## 3\./' docs/design/symbol-registry.md | /usr/bin/grep '^|' | /usr/bin/grep -vcE '^\| *(Concept|:?-{3,}) *\|'
    ```

    New rows: `\varphi_i` and `u^{\pm}` (ticket-130). The transition-probability row's symbol is `P(n \to n')`, in place
    of `p₁` (ticket-122). Retired with no page, owner kept: `u_j^{(i)+}` and `u_j^{(i)-}` (ticket-130), and the
    thread count `N` and the multi-cut `\theta_\omega` (ticket-123 removed both from sddp-algorithm; this ticket
    retires the rows, XD-209).
  - Planned entries resolved: `\mu^*` (risk-measures, the notation page and CvarWeightsPlot; tickets 115, 119), `q^*`
    (risk-measures and the notation page; ticket-115), `\beta(\tilde{x}, \omega)` (risk-measures; ticket-115) and
    `\alpha'` (`_risk.notes`; ticket-118). The §3 `q^*`, `\alpha'` and `\mu^*` planned meanings are resolved as well.
  - Re-meant or restated: the `\underline{z}^k`, `x` and `V_t(x)` clauses (116); `\alpha` as the tail fraction (117);
    `P(n \to n')` (122); `d_{1 \to t}` and the §3 `d` meanings (123); `\underline{z}^k`, `\rho^{\lambda, \alpha}`, `Q_t`
    and `\underline{V}_\tau(x)` (125); `k`, `\tau` and `\underline{z}^k` (126); `u^{\pm}`, `L_t`, `\bar{V}_t(x)` and the
    notation page's `$L$` clause (130).
  - Page paths: `math/lp-warm-start.md` and `math/determinism-guarantees.md` are now cited as `.mdx` (tickets 132,
    133); `math/reproducibility-and-provenance.md` is deleted (ticket-135) and no §1-§4 cell names it.
  - Pages added to E09-page entries of single-row symbols (a Pages-cell diff from `e11aa48`, E09 pages only):
    `P(n \to n')` cut-management, policy-graphs, sddp-algorithm and the notation page (122); `Q_t`, `\beta`, `\beta_0`,
    `\theta`, `c_t(x_t, u_t)`, `p(\omega)`, `u_t`, `\mathcal{X}_t(x_{t-1}, \omega_t)` and `\hat{x}_{t-1}` policy-graphs
    (122); `\alpha` and `\lambda` CvarWeightsPlot (119); `\mu^*` the notation page and CvarWeightsPlot (115, 119); `q^*`
    risk-measures and the notation page (115); `\alpha'` `_risk.notes` (118); `d_{1 \to t}` sddp-algorithm (123);
    `\varphi_i`, `u^{\pm}`, `V_t(x)`, `Q_t` and `m` upper-bound-evaluation (125, 130).
  - Pages removed: `\theta_\omega` cut-management, sddp-algorithm and the notation page, `\rho^{\lambda, \alpha}`
    sddp-algorithm and `N` (the thread count) sddp-algorithm (123); `\underline{V}_\tau(x)` upper-bound-evaluation
    (125); `q_{h,k}` risk-measures (115); `u_j^{(i)+}` and `u_j^{(i)-}` upper-bound-evaluation (130).
  - Multi-row glyphs, compared by hand: the iteration counter `k` gains risk-measures (116) and cites lp-warm-start as
    `.mdx` (132), and the policy-graph node `n` gains sddp-algorithm and cut-management (122).
- Registry corrections by this ticket (under the lock, located by content; the read-modify-write kept the concurrent
  ticket-148 rows `A_{ij}`, `l_i^{row}`, `\bar{c}` and the §3 `d`, hat, `a`, `C`, `c`, `l` and `x` cells):
  - Pages: `\underline{z}^k` gains cut-management and `_cut-management.notes`, and `\bar{z}^k` cut-management (F-114-2,
    XD-190, XD-197); `\alpha` and `\lambda` gain stopping-rules (XD-202); `\rho^{\lambda, \alpha}` gains
    `_risk.configure`, which writes `\rho^{\lambda,\alpha}` (the corpus-wide check above; ticket-118's page);
    `\Delta_{95}` gains ConvergencePanelsPlot (XD-205, ticket-127); `P^{\max}` gains sddp-algorithm (this ticket's §5
    edit).
  - Concepts: `\bar{z}^k` drops the d2 `UB` label (XD-223) and writes the discounted sampled mean; `\beta` lists
    cut-management's `\beta^{\top} x` and `\beta_t^{\top} \hat{x}_{t-1}` (XD-197); `d_j^{col}` and `x_j` describe
    cut-management §8.1 in the page's words, the `d^{col}` of §2, not `\text{col\_scale}[c]` (XD-200, F-121-3); `\tau`
    counts recorded lower bounds, `\underline{z}^{k-\tau+1}, \ldots, \underline{z}^k` (XD-202, F-126-4); `Z` and
    `\text{CVaR}_\alpha` write the `Z` the figure and `cvar.ts` use (XD-204, F-118-3); `V(x, \omega)` drops its stale §10
    clause (XD-207); `k`, `c_t(x_t, u_t)`, `\theta`, `\hat{x}_{t-1}` and `x_t` follow discount-rate §6's new lower-bound
    text (XD-225), and `x_t` writes cut-management's cut-row convention `-\beta^\top x + \theta \ge \beta_0`;
    `P^{\max}`, `N`, `P_h`, `\ell`, `a_{h,\ell}` and `\hat{a}_{h,\ell}` follow sddp-algorithm §5's
    `N_{hydro} \cdot P^{\max}` and `\ell \in \{1, \ldots, P^{\max}\}` (F-123-2), and `P^{\max}` and `N` drop the
    stale `N(1+L)`, `N \cdot L` clause of cut-management; `n` (the policy-graph node) follows policy-graphs §1 without the
    removed tuple wording.
  - Retired: `N` (the thread count) and `\theta_\omega` (XD-209, F-123-1), Pages `—`, `\theta_\omega` now Notation `no`;
    §1.1 drops the `N` line's SDDP Algorithm clause.
  - §3: the policy-graph forms of ticket-122 join the `β`, `c`, `n`, `Q`, `u`, `θ` and `𝒳` meanings (F-122-3), and the `N`
    and `θ` rows retire the thread count and `\theta_\omega`; each changed Decided cell cites XD-205, XD-209 and this
    ticket. The `𝒳` declaration stays: cut-management §4 still writes the feasible state set `\mathcal{X}_t` (XD-10).
- Notation page (Requirement 3, under the notation lock): the definitions of the Notation = yes rows E09 touched were
  compared with their registry rows and owner pages. They match for `\mu^*` (the floor and cap of risk-measures §4.2),
  `\alpha`, `\lambda`, `\underline{z}^k` (upper-bound-evaluation `### Lower bound`), `\bar{z}^k`, `k`, `p(\omega)`,
  `P(n \to n')`, `Q_t` (cut-management §2), `\underline{V}_\tau(x)`, `V_t(x)`, `\theta` (the `\theta_t` row) and
  `d_{1 \to t}` (discount-rate §5), and the `$L$` declaration clause matches the `L_t` row and upper-bound-evaluation's
  Lipschitz vector. Corrections made: the `\rho^{\lambda, \alpha}` row gains the owner-stage convention of risk-measures
  §6 ("the measure of the stage that owns a cut, which aggregates the next stage's openings into it"; XD-207); the
  `\theta_\omega` row is removed and the `$N$` declaration line drops its SDDP Algorithm clause (XD-209); the
  determinism link text reads "Determinism & Provenance" (XD-235).
- Content edits applied by this ticket under its widened scope (XD-149, XD-255), each verified at the tag: cut-management
  (XD-201 DCS round cap, F-121-1, F-121-4, F-121-5, XD-216(a), N1, XD-235), `_cut-management.notes` (XD-201, F-121-5),
  sddp-algorithm (F-123-2, F-123-4, XD-211 G-2, XD-251, XD-235), policy-graphs (XD-251), scenario-generation (XD-204
  F-134-2, XD-211 G-1, XD-235), discount-rate (XD-225) and `docs/design/diagram-authoring.md` (XD-216(b)).
- Upstream items (Requirement 4): UP-60 to UP-64 in `design/upstream-issues.md` §1 (tickets 118, 128, 136, 134, and the
  ticket-138 guardian's probability-sum message).
- XD-07 (narrowing an over-broad §5 grep): none needed; the §5 replay above printed no hits.

#### §1.1 held-back list

The §1.1 intro, printed with the first command below, names no ticket of E09 (the second command prints `0`). Its
held-back list, quoted verbatim with the hard wraps joined:

> Two kinds of decided reuse are not listed yet. An E10-split reuse (§3 rows `K`, `L`, `A`, `D`, `i`, `j`, `s`, `m`) shares `lp-formulation` or `system-elements` until E10 makes it page-disjoint, which principle 4 requires first; ticket-159 adds it then. A reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046).

```bash
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md | /usr/bin/grep -cE 'ticket-1(1[3-9]|2[0-9]|3[0-8])'
```

#### Hand-off: rows with a later page

Every §2 table row's Pages cell names only existing pages: the command below prints `0`. No row carries a later-page
entry that names a ticket of E09.

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($6 ~ /planned:/ && NF>8) n++ } END { print n+0 }' docs/design/symbol-registry.md
```

### 2026-10-06 — ticket-200 (E12 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over
`src/content/docs src/figures src/components` with `pt-br/` excluded. E12 adds no §4 row (it renames no symbol). The
count is 132, one more than the ticket-139 entry's 131: row 132 (ticket-155, E10) joined §5 after it.

Output, 2026-10-06 (132 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
§4 row 132 (ticket-155): 0
```

Two rows printed a count earlier in the run, and both print `0` now. Row 31 (ticket-022) stood at 4: the lag-index
alternative `\(i \+ 1\)` of the corpus-wide loop matched the code expressions `Math.floor(next() * (i + 1))` in
`src/figures/fpha.test.ts` and `rowY(i + 1)` in `src/components/FphaPlot.astro`, the figure files of ticket-156. This
ticket narrowed the row under XD-07 and XD-283, as rows 55, 64 and 69 are narrowed: the grep carries
`--include=par-inflow-model.mdx`, and a `# narrowed (ticket-200, XD-283)` comment line precedes it (the loop reads only the
`# §4 row` and `grep` lines, so the comment does not run). The narrowed grep prints `0`, as the row did before the
figure files existed. Row 132 (ticket-155, `\gamma_v`) stood at 1, in a block of `system-elements.mdx` that E10 tickets
were editing; it printed `0` by the end of the run, with no edit by this ticket.

#### Declarations, Mirror and symbol checks

§1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
`### Declared Scoped Reuse` subsection. Output, 2026-10-06: empty.

```bash
awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' \
  | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done
```

Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (259 rows checked, as in the
ticket-139 entry). Output, 2026-10-06: empty. The check matches each symbol as a plain substring (XD-127; the tool gap
stays routed to E15).

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Symbol check (Requirement 6c), the ticket AC5 command: the added lines of the `git diff HEAD` of `running/`, the `_impl`
partials, `determinism-guarantees` and `inflow-nonnegativity`, with escaped `\$`, `$schema` and `${VAR}` removed, counted
for a `$...$` span. HEAD (`604386b`) holds most E12 edits already (the file-scoped commits of the E11 and E09 streams
carried them), so the diff carries the edits still uncommitted on those pages, of E12 and of the other epics.

```bash
d=src/content/docs; git diff HEAD -- $d/running $d/math/_impl $d/math/determinism-guarantees.mdx $d/math/inflow-nonnegativity.md | /usr/bin/grep -E '^\+' | /usr/bin/grep -v '^+++' | sed -E 's/\\\$//g; s/"?\$schema"?//g; s/\$\{?[A-Z_]+\}?//g' | /usr/bin/grep -cE '\$[^$ ][^$]*\$'
```

Output, 2026-10-06: `1`. The one matching line is on `math/inflow-nonnegativity.md`: ticket-186b re-points the link
`LP Formulation §5b` to `§5` inside the slack-water sentence, and the diff re-emits the whole line. It adds no span. The
`$...$` spans of the added lines and of the removed lines are the same five, and the command below, which lists both sets
and compares them, prints nothing:

```bash
d=src/content/docs; spans() { git diff HEAD -U0 -- $d/running $d/math/_impl $d/math/determinism-guarantees.mdx $d/math/inflow-nonnegativity.md | /usr/bin/grep -E "^[$1]" | /usr/bin/grep -vE '^(\+\+\+|---)' | sed -E 's/\\\$//g; s/"?\$schema"?//g; s/\$\{?[A-Z_]+\}?//g' | /usr/bin/grep -oE '\$[^$ ][^$]*\$' | sort; }; diff <(spans +) <(spans -)
```

No E12 ticket added a symbol, so no §2 row, Pages entry or block C run is due.

`/usr/bin/grep -c '^### .* — ticket-200 (E12 acceptance)$' docs/design/symbol-registry.md` prints `1` once this entry is
in.

#### Reconciliation (ticket-200)

E12 delta: none. No E12 ticket writes, re-means or moves a math symbol (every fork reported "no registry delta"). The
diff from `HEAD` of the registry (cut off before this entry, as the command below does) and of the notation page carries
one line that names an E12 ticket (the count prints `1`): the `# narrowed (ticket-200, XD-283)` comment this ticket added
to §5 row 31. The other edits it shows belong to the tickets of the other epics that run beside E12 (XN-14). §2 holds 491 rows (the command of the ticket-139 entry); no `planned:` token names
an E12 ticket (`/usr/bin/grep -cE 'planned:[^|]*\(ticket-(18[2-9]|19[0-9]|200)[a-z]?\)' docs/design/symbol-registry.md`
prints `0`).

```bash
{ sed '/^### .* — ticket-200 (E12 acceptance)$/,$d' docs/design/symbol-registry.md | diff -U0 <(git show HEAD:docs/design/symbol-registry.md) - ; \
  git diff HEAD -U0 -- src/content/docs/overview/notation-conventions.md ; } \
  | /usr/bin/grep -E '^[+-]' | /usr/bin/grep -v '^+++\|^---' | /usr/bin/grep -cE 'ticket-(18[2-9]|19[0-9]|200)[a-z]?\b'
```

- Registry corrections by this ticket: §5 row 31 narrowed to `par-inflow-model.mdx` (XD-07, XD-283; see the §5 replay above).
  Notation page: no edit (the Mirror and declarations checks print nothing).
- Content edits applied by this ticket under its widened scope (XD-279), each verified at `v0.17.0`: `_penalties.io` (XD-204:
  the `penalties.json` row lists the four sections under Case Directory Format and says what the Configure tab covers),
  `configuration` (XD-267: the `row_activity_tolerance` row states the raw-dual strict `>` comparison of
  `training/backward/outcome_aggregation.rs:47,88`; XD-272 N2 and D1: the `bound_stalling` window row and the note moved
  from the stopping tab, `convergence/stopping_rule.rs:210-244`), `_cut-management.io` (XD-267: the link to
  `#trainingcut_selection`), `_stopping.configure` (XD-272 D1 and N3, `training/session/mod.rs:556-560`),
  `stopping-rules` (XD-272 N5), `interpreting-results` (XD-265: the gap thresholds apply to a gap without sampling noise),
  `performance` (XD-268 F-193a-1: `#sizing-and-scaling`) and `hpc-deployment` (XD-268 F-193a-2 and F-193a-3, XD-272 for
  ticket-193b: `.cargo/config.toml` of the source tree sets `target-feature=+avx2,+fma,+sse4.2` for
  `x86_64-unknown-linux-gnu`).
- Narration burn-down and reports (Requirements 2 and 3), 2026-10-06: `# owner: E12 ` entries in
  `scripts/doc-lint-allow.txt`: `0`; the four narration gates exit `0` with no `STALE` line.
- Acceptance replays (Requirement 4) and capture re-runs (Requirement 5): the completion report records them. All 27
  capture comments of the E12 page set re-ran with the binary of record and matched (exit codes and every
  non-timing fence line).
- Upstream items (Requirement 7, read-only): the E12 refinement and execution candidates are rows of
  `design/findings-register.md` (§1 to §5) with their evidence and status; the orchestrator files them in
  `design/upstream-issues.md` from the next free UP number (XN-07). This entry does not file them. Refinement rows
  `E12-C1` to `E12-C7` (XD-129) are all `candidate`: C1 (non-empty `output/` reuse, §2), C2 (opening-tree file exit code,
  §2), C3 (rule-20 zero coverage, §2), C4 (bridge `compare` exit-code help text, §2), C5 (UP-21 addendum, §4), C6 (comment
  and message items, §4) and C7 (bridge `conversion_manifest.json` id map, §5). Execution-time candidates by register
  section:
  - §1 (cobre code: behaviour that is probably wrong): F-E12Δ-A1, F-183a-1, F-186d-1, F-187c-1, F-187b-1, U-185a-2.
  - §2 (validation, CLI contract and UX gaps): F-E12Δ-D1, F-183a-2, F-195-2, F-182a-1, F-185b-1, F-185b-2.
  - §3 (output contract and messages): F-E12Δ-D2, F-182-3, F-195-1, F-182a-4, F-182a-2, F-185-1, F-185-2, F-197-1, F-197-2.
  - §4 (comments, docs and release artefacts): F-E12Δ-B1, F-E12Δ-B2 (both `open`), F-194-1, F-194a-1, F-194a-2, F-182-1/2,
    F-195a-2, F-182a-5, U-185a-1, U-192b-1, U-192b-2, U-191-1, U-191-2, U-191-3, U-188a-1, U-188a-2, U-193-1, U-186e-1,
    U-188b-1, and the addenda F-174b-1 and F-E12Δ-A1.
  - The `--threads` mismatch message is no longer an item: E11 ticket-176 catalogues it under `#solver-failures`.
  - This ticket reports none of its own: the routed fixes are documentation edits, and the one cobre-code observation it
    made (the graceful-shutdown rule is never built outside tests, so a shutdown stop records `unknown`) is F-171c-1.
- Hand-offs: (1) `_network.configure.mdx:3-6,32` still says "this chapter does not repeat that field table" and points at
  the Penalty System Configure tab "for the segment field table" (F-189-1, routed to E10 ticket-158a, which is pending);
  (2) banned-phrase rows 44 and 78, held under the **C** rule until E10 ticket-158a clears the `_hydro.configure` and
  `_equipment.configure` hits, and the XD-256 `PhaseSolverProfileConfig` row, not appended (register section 3 entry of this
  ticket; the 68 other no-HEAD-hit candidates are BP-366 to BP-433, XD-283). The E12 entries are BP-353 to BP-433.

#### §1.1 held-back list

The §1.1 intro, printed with the first command below, names no ticket of E12 (the second command prints `0`). Its
held-back list, quoted verbatim with the hard wraps joined:

> Two kinds of decided reuse are not listed yet. An E10-split reuse (§3 rows `K`, `L`, `A`, `D`, `i`, `j`, `s`, `m`) shares `lp-formulation` or `system-elements` until E10 makes it page-disjoint, which principle 4 requires first; ticket-159 adds it then. A reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046).

```bash
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md | /usr/bin/grep -cE 'ticket-(18[2-9]|19[0-9]|200)'
```

#### Hand-off: rows with a later page

Every §2 table row's Pages cell names only existing pages: the command below prints `0`. No row carries a later-page
entry that names a ticket of E12.

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($6 ~ /planned:/ && NF>8) n++ } END { print n+0 }' docs/design/symbol-registry.md
```

### 2026-10-06 — ticket-239 (E14 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over
`src/content/docs src/figures src/components` with `pt-br/` excluded. E14 adds no §4 row (it renames no symbol), so the
count equals the ticket-200 entry's (132).

Output, 2026-10-06 (132 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
§4 row 132 (ticket-155): 0
```

#### Declarations, Mirror, Pages and Pages-exist checks

§1.1 against the notation page: every line of §1.1 (37) occurs verbatim in the notation page's
`### Declared Scoped Reuse` subsection. Output, 2026-10-06: empty (the command of the ticket-200 entry).

Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (259 rows checked, as in the
ticket-139 and ticket-200 entries). Output, 2026-10-06: empty.

Pages check (block A of ticket-239): each E14 form on an E14 page, component or the notation page is listed under its
row. The five form/symbol pairs are `\zeta = 1` / `\zeta`, `\bar{z}` / `\bar{z}^k`, `\underline{z}` / `\underline{z}^k`,
`V_3` / `V_t(x)` and `\beta^v` / `\beta^v_h`, checked on `sddp-framework-overview.mdx`, `what-cobre-solves.md`, the two
toy `.mdx` pages, `ToySingleValuePlot.astro`, `ToyFourSlopesPlot.astro` and the notation page. Output, 2026-10-06:
empty (no `NO-ROW`, no `UNLISTED`).

Pages-exist check (the command of ticket-239 Testing Requirements): every page path in a §2 Pages cell exists. Output,
2026-10-06: empty (no `MISSING`).

Counts of Requirement 3, 2026-10-06:

```bash
awk '/^## 2\./,/^## 3\./' docs/design/symbol-registry.md | /usr/bin/grep -cE 'planned:[^|]*\(ticket-2(2[3-9]|3[0-9])a?\)'
awk '/^## 3\./,/^## 4\./' docs/design/symbol-registry.md | /usr/bin/grep -cE 'planned:[^|]*\(ticket-2(2[3-9]|3[0-9])a?\)'
awk '/^## 6\./{exit} {print}' docs/design/symbol-registry.md | /usr/bin/grep -cE 'examples/toy-(single|four)-reservoir\.md\b'
```

Output: `0`, `0`, `0` (the planning tree printed `62` for the third; ticket-235a re-keyed every path outside the §6 history).
§2 holds 491 rows (the command of the ticket-139 entry), one fewer than the 492 of that entry; E14 adds and retires no row, and the
difference is not an E14 edit (a concurrent stream edits the registry at the same time, XN-14).

`/usr/bin/grep -c '^### .* — ticket-239 (E14 acceptance)$' docs/design/symbol-registry.md` prints `1` once this entry is
in.

#### Reconciliation (ticket-239)

- E14 delta: introduced none. Re-meant or restated, each checked against its row and the page: `\zeta` (ticket-234; the
  Concept cell reads "the toy pages set `\zeta = 1`" and Pages lists toy-single-reservoir); `\bar{z}^k` (ticket-238; the
  overview writes the bare `\bar{z}`, and the Concept cell carries no overline-form clause for the overview). Pages added: `src/components/ToySingleValuePlot.astro` to `V_t(x)` and
  `v_h` (ticket-235), `src/components/ToyFourSlopesPlot.astro` to `\beta^v_h` (ticket-237). Path changes: every toy page
  cited as `.mdx` outside this log (ticket-235a); `/usr/bin/grep -c 'examples/toy-\(single\|four\)-reservoir\.md\b'` of
  §1-§5 prints `0`.
- Drift fixes of the ticket's Current State, under `flock /tmp/symbol-registry.lock`, each located by content:
  1. The overview mentions of `\alpha_i` and `\pi_i`. The overview writes `\beta_{0,i} + \beta_i^\top x` for every cut
     `i` (`sddp-framework-overview.mdx`, lines 31 and 34), so the `i` row (Benders cut index) now reads
     "sddp-framework-overview writes `\beta_{0,i}`, `\beta_i` 'for every cut `i`' and `\max_i`"; the `x_t` state-vector row
     reads `V_{t+1}(x) \ge \beta_{0,i} + \beta_i^\top x`; the `\beta_0` row reads "sddp-framework-overview writes
     `\beta_{0,i}` for cut `i`". The `\beta` row already read `\beta_i^\top x`.
  2. The overview `\text{gap}`. The overview writes no `\text{gap}` and no `\text{gap}^k` (it states the gap in words), so
     the §3 `\text{gap}` row no longer lists `sddp-framework-overview` under the absolute gap; the §2 `\text{gap}^k` row
     never listed the overview.
  3. The §3 `\text{gap}` row listed `toy-single-reservoir` and `toy-four-reservoir` under the relative gap `\text{gap}^k`;
     neither page writes `\text{gap}` (`/usr/bin/grep -c 'text{gap}'` prints `0` on both), so both are removed. The row
     also listed `sddp-algorithm` there; that page states the gap in words (§3.3, "Optimality Gap") and writes no
     `\text{gap}`, so it is removed too (an addition to the ticket's list, same defect). `stopping-rules` and
     `upper-bound-evaluation` stay on both lists, and `ConvergencePlot` stays on the absolute gap (unchanged by this
     ticket).
  4. The `\underline{z}^k` toy-four mention is kept: toy-four-reservoir writes `\lvert\underline{z}^k\rvert` in the
     percent-gap denominator (line 468). The Concept cell now gives the form the page writes (`\underline{z}^k`, not
     `\underline z^k`).
- Routed items of ticket-239:
  - XD-237 F3 (the Pages cells of the overview rows): the overview writes `\omega_t` (the `\Omega_t` row's Concept lists
    it), `\beta_{0,i}` (the `\beta_0` row, after fix 1), `V_t(x_{t-1})`, `V_{t+1}(x_t)`, `V_{T+1}(x) = 0`, the bare `V_t`
    and the caption's `V(x)` (the `V_t(x)` row's Concept lists them), the bare `\underline{z}` (the `\underline{z}^k`
    row's Concept lists it). The `\text{gap}^k` and `V(v)` rows do not list the overview under Pages (the `\text{gap}^k`
    Concept says the overview states it in words; the `V(v)` Concept says the overview caption writes `V(x)`). The
    Pages cells therefore need no removal; the `\Omega_t`, `\beta_0`, `V_t(x)` and `\underline{z}^k` symbol forms are not
    the exact glyph the page writes, but each row's Concept cell names the form it does write. The §3 collision row was
    the only cell that listed a page for a form it does not write (fix 2).
  - XD-275, 237 F1: the `\beta^v_h` row's Concept head is now "Storage cut coefficient (`\beta^v_{i,h}` for cut `i`)" and
    the rest of the cell is written against the pages: cut-management writes `\beta^v_h` and the stage-indexed
    `\beta^v_{t,h}` (it writes no per-opening or aggregate storage form; the old `\pi^v_{t,h}(\omega)` and
    `\bar{\pi}^v_{t-1,h}` clause is removed); toy-single-reservoir writes `\beta^v_4(\omega)`, `\beta^v_3(\omega_1)`, the
    bare `\beta^v`, `\beta^v_3(\omega)`, the aggregate `\bar{\beta}^v` and `\bar{\beta}^{v,i}`; toy-four-reservoir writes
    `\beta^v_h`, `\beta^v_h(\omega)`, `\beta^v_3(\omega_2)`, `\bar\beta^v_h`, `\bar\beta^{v,i}_1` to `_4` and
    `\beta^v = \partial Q/\partial \hat v`. The same row's Index cell read "`\pi^v_4` on toy-single-reservoir, hydro
    (`\pi^v_3`) on toy-four-reservoir" and now reads `\beta^v_4` and `\beta^v_3`. The corpus-wide `\pi^v` count over
    `src/content/docs src/figures src/components` is `0`.
- Notation page (Requirement 3): the definitions of the Notation = yes rows E14 touched match the registry and the owner
  page; no notation-page edit (the notation lock was not taken for a write). `\zeta` (`notation-conventions.md` lines
  166 to 167: "Time conversion: m³/s over stage → hm³", `0.0036 \times \tau_k` per block) matches the Concept
  cell `\zeta = 0.0036 \times \sum_k \tau_k`; `\bar{z}^k` (line 39: the mean discounted cost of the iteration's `M`
  forward-pass trajectories, a statistical estimate; `\bar{z}_{\text{exact}}` under an enumerated pass) matches; `V_t(x)`
  (line 30: "Value function (cost-to-go) at stage `t`") matches; `\beta^v_h` (lines 378 to 379: the storage slope) matches.
  The Mirror check prints nothing.
- Content edits applied by this ticket under its widened scope (the orchestrator's XD-279 precedent), each verified at
  `v0.17.0`, on `overview/sddp-framework-overview.mdx` (3 one-line hunks; `diff -U0` and `diff -U0 -w` hunk counts both
  `3`): (a) the gap sentence now says its percent form "normalises that difference by the magnitude of the lower bound,
  floored at one currency unit", the rule of `convergence/convergence.rs` (`gap()` is `(UB - LB) / max(1.0, |LB|)`) and
  of the `relative_tolerance` doc of `cobre-io/src/config/training.rs` (`100·gap / max(1, |lower_bound|)`), the same
  wording as `math/stopping-rules.mdx` §Optimality gap; (b) the bounds sentence reads "the optimal (risk-adjusted) cost",
  as the next paragraph does; (c) the closing pointer reads "convergence monitoring" for SDDP Algorithm, whose §3.3 is
  "Convergence Monitoring" (the convergence theorem is `cut-management.mdx` §9).
- Upstream items (Requirement 4, read-only on the cobre tree): eight candidates re-verified at the tag and filed in
  `design/upstream-issues.md` as UP-66 (RunResult docstring, ticket-231), UP-67 (`best_upper_bound`, ticket-230), UP-68
  (Policy units, ticket-232), UP-69 (`builtins` module, ticket-232), UP-70 (validate against run on enumerated
  selection, ticket-228), UP-71 (`$/stage` label, ticket-227), UP-72 (`cobre-mcp` release assets, ticket-225) and UP-73
  (`examples/4ree` warnings, ticket-236). None was dropped.

#### Hand-off: rows with a later page

Every §2 table row's Pages cell names only existing pages: the Pages-exist check above prints nothing. No row carries a
`planned:` entry that names a ticket of E14 (the first count above prints `0`).

### 2026-10-06 — ticket-159 (E10 acceptance)

Every command runs from the repository root. GNU grep is called as `/usr/bin/grep` (GNU grep 3.11; XN-02). Run
`unset -f grep` before the Mirror check below, whose canonical text calls plain `grep`.

§6 is an append-only historical log. The rule that no §2 row keeps a planned entry naming a ticket of a finished epic
(ADR-046) applies to the §2 table rows only; earlier entries keep the snapshots they recorded.

#### §5 replay

The ticket-031 loop, unchanged (the command printed in the ticket-062 entry), over
`src/content/docs src/figures src/components` with `pt-br/` excluded. E10 adds no §4 row in this ticket; ticket-155's
row 132 (the bare `\gamma_v` of block-formulations) is the last row, so the count equals the ticket-200 entry's (132).
Row 132 prints `: 0`: its last hit, `system-elements.mdx:34`, sat in the "Why not absolute units" block that ticket-152
deleted (XD-283). The loop rewrites each grep's file list to the three corpus roots, so row 132's grep, written against
`math/block-formulations.mdx`, runs over the whole corpus (XD-274 F1).

```bash
awk '/^## 5\./,/^## 6\./' docs/design/symbol-registry.md | /usr/bin/grep -E '^(# §4 row|grep )' \
  | while IFS= read -r l; do
      case "$l" in '# '*) row="${l#\# }"; continue ;; esac
      cmd="$(printf '%s' "$l" | sed -E "s|^grep |/usr/bin/grep --exclude-dir=pt-br |; s|'( [^' ]+)+\$|' src/content/docs src/figures src/components|")"
      printf '%s: %s\n' "$row" "$(eval "$cmd" | wc -l)"
    done
```

Output, 2026-10-06 (132 greps, 0 hits each):

```text
§4 row 1 (ticket-020): 0
§4 row 2 (ticket-020): 0
§4 row 3 (ticket-020): 0
§4 row 4 (ticket-020): 0
§4 row 5 (ticket-020): 0
§4 row 6 (ticket-020): 0
§4 row 7 (ticket-020): 0
§4 row 8 (ticket-020): 0
§4 row 9 (ticket-020): 0
§4 row 10 (ticket-020): 0
§4 row 11 (ticket-020): 0
§4 row 12 (ticket-020): 0
§4 row 13 (ticket-020): 0
§4 row 14 (ticket-020): 0
§4 row 15 (ticket-020): 0
§4 row 16 (ticket-020): 0
§4 row 17 (ticket-020): 0
§4 row 18 (ticket-020): 0
§4 row 19 (ticket-020): 0
§4 row 20 (ticket-020): 0
§4 row 21 (ticket-020): 0
§4 row 22 (ticket-021): 0
§4 row 23 (ticket-021): 0
§4 row 24 (ticket-021): 0
§4 row 25 (ticket-021): 0
§4 row 26 (ticket-021): 0
§4 row 27 (ticket-021): 0
§4 row 28 (ticket-021): 0
§4 row 29 (ticket-021): 0
§4 row 30 (ticket-022): 0
§4 row 31 (ticket-022): 0
§4 row 32 (ticket-022): 0
§4 row 33 (ticket-022): 0
§4 row 34 (ticket-022): 0
§4 row 35 (ticket-022): 0
§4 row 36 (ticket-022): 0
§4 row 37 (ticket-022): 0
§4 row 38 (ticket-022): 0
§4 row 39 (ticket-022): 0
§4 row 40 (ticket-022): 0
§4 row 41 (ticket-022): 0
§4 row 42 (ticket-022): 0
§4 row 43 (ticket-022): 0
§4 row 44 (ticket-022): 0
§4 row 45 (ticket-022): 0
§4 row 46 (ticket-022): 0
§4 row 47 (ticket-022): 0
§4 row 48 (ticket-023): 0
§4 row 49 (ticket-023): 0
§4 row 50 (ticket-024): 0
§4 row 51 (ticket-024): 0
§4 row 52 (ticket-024): 0
§4 row 53 (ticket-024): 0
§4 row 54 (ticket-024): 0
§4 row 55 (ticket-024): 0
§4 row 56 (ticket-024): 0
§4 row 57 (ticket-024): 0
§4 row 58 (ticket-024): 0
§4 row 59 (ticket-024): 0
§4 row 60 (ticket-024): 0
§4 row 61 (ticket-024): 0
§4 row 62 (ticket-024): 0
§4 row 63 (ticket-024): 0
§4 row 64 (ticket-024): 0
§4 row 65 (ticket-024): 0
§4 row 66 (ticket-024): 0
§4 row 67 (ticket-024): 0
§4 row 68 (ticket-024): 0
§4 row 69 (ticket-024): 0
§4 row 70 (ticket-020): 0
§4 row 71 (ticket-025): 0
§4 row 72 (ticket-025): 0
§4 row 73 (ticket-025): 0
§4 row 74 (ticket-025): 0
§4 row 75 (ticket-025): 0
§4 row 76 (ticket-025): 0
§4 row 77 (ticket-025): 0
§4 row 78 (ticket-026): 0
§4 row 79 (ticket-026): 0
§4 row 80 (ticket-026): 0
§4 row 81 (ticket-026): 0
§4 row 82 (ticket-026): 0
§4 row 83 (ticket-026): 0
§4 row 84 (ticket-026): 0
§4 row 85 (ticket-026): 0
§4 row 86 (ticket-026): 0
§4 row 87 (ticket-026): 0
§4 row 88 (ticket-026): 0
§4 row 89 (ticket-026): 0
§4 row 90 (ticket-027): 0
§4 row 91 (ticket-027): 0
§4 row 92 (ticket-028): 0
§4 row 93 (ticket-028): 0
§4 row 94 (ticket-018): 0
§4 row 95 (ticket-018): 0
§4 row 96 (ticket-018): 0
§4 row 97 (ticket-018): 0
§4 row 98 (ticket-018): 0
§4 row 99 (ticket-018): 0
§4 row 100 (ticket-018): 0
§4 row 101 (ticket-026): 0
§4 row 102 (ticket-027): 0
§4 row 103 (ticket-027): 0
§4 row 104 (ticket-027): 0
§4 row 105 (ticket-028): 0
§4 row 106 (ticket-028): 0
§4 row 107 (ticket-020): 0
§4 row 108 (ticket-020): 0
§4 row 109 (ticket-020): 0
§4 row 110 (ticket-020): 0
§4 row 111 (ticket-020): 0
§4 row 112 (ticket-020): 0
§4 row 113 (ticket-020): 0
§4 row 114 (ticket-023): 0
§4 row 115 (ticket-031): 0
§4 row 116 (ticket-031): 0
§4 row 117 (ticket-031): 0
§4 row 118 (ticket-031): 0
§4 row 119 (ticket-031): 0
§4 row 120 (ticket-051): 0
§4 row 121 (ticket-051): 0
§4 row 122 (ticket-063): 0
§4 row 123 (ticket-063): 0
§4 row 124 (ticket-063): 0
§4 row 125 (ticket-075): 0
§4 row 126 (ticket-078): 0
§4 row 127 (ticket-078): 0
§4 row 128 (ticket-078): 0
§4 row 129 (ticket-079): 0
§4 row 130 (ticket-080): 0
§4 row 131 (ticket-081): 0
§4 row 132 (ticket-155): 0
```

#### Declarations, Mirror, Block A, Block E and Pages-exist checks

§1.1 against the notation page: every line of §1.1 (41: the 37 of the ticket-239 entry, of which the `L`, `i`, `j`, `m`,
`r` and `z` lines are extended, plus the new `A`, `D`, `K` and `s` lines) occurs verbatim in the notation page's
`### Declared Scoped Reuse` subsection, which holds the same 41 lines. Output, 2026-10-06: empty.

```bash
awk '/^### 1.1 /,/^## 2\./' docs/design/symbol-registry.md | /usr/bin/grep '^- ' \
  | while IFS= read -r l; do /usr/bin/grep -qF -- "$l" src/content/docs/overview/notation-conventions.md || echo "MISSING-DECL $l"; done
```

Mirror check, the canonical command of the ticket-031 entry, run after `unset -f grep` (257 rows checked, two fewer
than in the ticket-239 entry: `\text{entry\_stage\_id}` and `\text{start\_stage\_id}` are now Notation `no`).
Output, 2026-10-06: empty. The check matches each symbol as a plain substring (XD-127; the tool gap stays routed to
E15); the Notation = yes rows E10 touched are compared with the notation page by hand under Reconciliation.

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { if ($9 ~ /yes/ && $6 !~ /planned: *overview\/notation-conventions/) print $3 }' docs/design/symbol-registry.md \
  | tr -d '$' | sed 's/\x60//g; s/^ *//; s/ *$//' \
  | while read -r s; do grep -qF -- "$s" src/content/docs/overview/notation-conventions.md || echo "MISSING $s"; done
```

Block E of ticket-159 (page-disjointness of the E10-split glyphs on lp-formulation, state-augmentation,
lp-layout-and-scaling and system-elements). Output, 2026-10-06: empty, before and after this ticket's edits.

```bash
chk() { f="src/content/docs/math/$1"; shift; for re in "$@"; do n=$(tr '\n' ' ' < "$f" | /usr/bin/grep -oE -e "$re" | wc -l); [ "$n" = 0 ] || echo "MIXED $(basename "$f") $re $n"; done; }
chk lp-formulation.md 'K_i' 'L_h' 's_i\(' 'x\^\{\\mathrm\{a' 'c_i\(m\)' 'H_m' 'D_r' 'D_c' 'A_\{ij\}' 'd_j\^\{col\}' '\\tilde\{c\}_j' 'cost-scale factor \$K\$'
chk state-augmentation.md '\$K\$' 'cost-scale factor' 'A_\{ij\}' 'D_r' '\\beta_\{0,i\}' '\\gamma\^m' '\\delta_\{b,k,s\}'
chk lp-layout-and-scaling.md '\$A\$' 'A \\, k_\{max\}' 'K_i' 's_i\(' 'g_\{j,k\}' 'c\^\{th\}_j' 'D_\{b,k\}'
chk system-elements.mdx 's_i\(m\)' 'sᵢ\(m\)' 'x\^\{\\mathrm\{a\}\}_\{s,i\}' '\\gamma\^m' '\\gamma_[0vqs]\^m' 'plane \$m\$' 'D_r' 'D_c' 'A_\{ij\}'
```

Pages-exist check (ticket-159 Testing Requirements, over the Pages and Owner cells): every page path in a §2 Pages or
Owner cell exists. Output, 2026-10-06: empty.

```bash
awk -F'|' '/^## 2\./,/^## 3\./ { print $6; print $7 }' docs/design/symbol-registry.md | sed -E 's/planned: [^,]*//g' \
  | tr ',' '\n' | sed -E 's/^ +| +$//g' | /usr/bin/grep -E '\.(md|mdx|astro|ts)$' | sort -u \
  | while read -r p; do case "$p" in src/*) f="$p";; *) f="src/content/docs/$p";; esac; [ -e "$f" ] || echo "MISSING $p"; done
```

Block A of ticket-159 (the corpus-wide Pages check for every §2 row whose Pages or Owner cell names lp-formulation,
state-augmentation, lp-layout-and-scaling or system-elements, with STALE read on the eight E10 pages; the command is in
the ticket's Testing Requirements). Before this ticket's edits it printed 91 lines (49 STALE, 42 UNLISTED). On the
working tree after them it prints 80 lines, and 77 once the orchestrator applies the lifecycle-key edits of ticket-159's
report (lp-formulation:357 and :365, penalty-system:196): the three extra lines are `UNLISTED \text{entry\_stage\_id}`
on lp-formulation and penalty-system and `UNLISTED \text{start\_stage\_id}` on lp-formulation, which those edits remove
(verified on a scratch copy of the tree with the edits applied). The 77 lines are:

- 33 STALE lines, each on a page that writes the alias form the row's Concept names (the alias is recorded here, as
  ticket-159 Requirement 3 asks):

```text
STALE (h, b) math/system-elements.mdx — alias `(h,b)`
STALE P_h math/cut-management.mdx — alias the order condition PAR(p > 0)
STALE Q_t math/lp-layout-and-scaling.md — alias `\partial Q / \partial x_j`
STALE V_t(x) math/lp-formulation.md — alias `V_{t+1}`, `V_{T+1} = 0`
STALE V_t(x) math/system-elements.mdx — alias `V_{t+1}(v_h)`
STALE \bar{G}_j math/state-augmentation.md — alias `\bar{G}_i(m)`
STALE \bar{V}_h math/hydro-production-models.mdx — alias `\bar V_h`
STALE \beta^{lag}_{h,\ell} math/lp-formulation.md — alias `\beta^{lag}_{i,h,\ell}`
STALE \beta_0 math/lp-formulation.md — alias `\beta_{0,i}`
STALE \gamma_0^m math/lp-formulation.md — alias `\gamma^m_0`
STALE \gamma_q^m math/lp-formulation.md — alias `\gamma^m_q`
STALE \gamma_s^m math/lp-formulation.md — alias `\gamma^m_s`
STALE \gamma_v^m math/lp-formulation.md — alias `\gamma^m_v`
STALE \pi^{lb}_{b,k} math/system-elements.mdx — alias `\pi_{b,k}`
STALE \psi_{m,\ell} math/lp-formulation.md — alias `\psi_{m(t),\ell}`
STALE \sigma^{e+}_{h,k} math/system-elements.mdx — alias `\sigma^{e\pm}_{h,k}`
STALE \sigma^{e-}_{h,k} math/system-elements.mdx — alias `\sigma^{e\pm}_{h,k}`
STALE \sigma_m math/lp-formulation.md — alias `\sigma_{m(t)}`
STALE \sigma_m math/block-formulations.mdx — alias `\sigma_{m(t)}`
STALE \text{rate}_t math/lp-formulation.md — alias `\text{rate}_{t'}`
STALE \underline{G}_j math/state-augmentation.md — alias `\underline{G}_i(m)`
STALE \underline{V}_h math/hydro-production-models.mdx — alias `\underline V_h`
STALE c_i(t) math/state-augmentation.md — alias `c_i(m)`
STALE c_i(t) math/system-elements.mdx — alias `c_i(m)`
STALE d_j^{col} math/state-augmentation.md — alias `d^{col}_{h,d}`
STALE d_j^{col} math/block-formulations.mdx — alias `d^{col}_h`
STALE d_j^{col} math/hydro-production-models.mdx — alias `d^{col}_h`
STALE d_j^{col} math/cut-management.mdx — alias `d^{col}_h`, `d^{col}_{h,\ell}`, bare `d^{col}`
STALE d_{t \to t+1} math/cut-management.mdx — alias `d_{t-1 \to t} \cdot \theta`
STALE d_{t_1 \to t_2} math/state-augmentation.md — alias `d_{t \to m}`
STALE g_{j,k} math/state-augmentation.md — alias `g_{i,k}`
STALE o_{h,k} math/hydro-production-models.mdx — alias `q_{out} = q + s`, `q_{jus}`
STALE x_j math/cut-management.mdx — alias `x_{\text{scaled}}`, `x_{\text{raw}}`
```

- 44 UNLISTED lines, none a real gap. The plain substring test (`grep -F`) of Block A also matches a symbol where a page
  only mentions it on a §1.1 declaration line (6, which do not count as uses, XD-59): `A_{ij}` on notation-conventions; `D_r` on notation-conventions; `\mu^{nc}_r` on notation-conventions; `\varepsilon^{nc}_r` on notation-conventions; `s^{nc}_r` on notation-conventions; `z_h` on notation-conventions. It matches an identifier
  substring of a file, column or key name in code or a path (18): `a_h` on _hydro.configure; `a_h` on _hydro.io; `a_h` on _hydro.notes; `a_h` on case-directory-format; `a_h` on index; `a_h` on production-models; `a_h` on error-codes; `a_h` on output-format; `a_h` on hydro-models; `a_h` on index; `r_h` on _hydro.configure; `r_h` on case-directory-format; `r_h` on production-models; `r_h` on output-format; `r_h` on hydro-models; `r_h` on simulation; `r_h` on python-api; `r_h` on interpreting-results. And it matches a substring of a longer
  symbol that has its own §2 row listing that page (20, the ticket-083 `\zeta` precedent, XD-103/XD-105): `\beta` on toy-four-reservoir; `\beta` on toy-single-reservoir; `\beta` on block-formulations; `\beta` on hydro-production-models; `\beta` on state-augmentation; `\mathcal{B}` on hydro-production-models; `\mathcal{C}` on horizon-modes; `\mathcal{C}^{exp}` on lp-formulation; `\mathcal{C}^{imp}` on lp-formulation; `\pi` on hydro-production-models; `\pi` on system-elements; `\sigma` on toy-four-reservoir; `\sigma` on toy-single-reservoir; `\sigma` on _par.io; `\sigma` on block-formulations; `\sigma` on par-inflow-model; `\sigma` on scenario-generation; `\sigma` on upper-bound-evaluation; `\sigma` on glossary; `\zeta` on equipment-formulations.
  The longer forms are `\beta_0`, `\beta^v_h`, `\beta^{lag}_{h,\ell}` and the aggregate `\bar{\beta}^v`; `\mathcal{B}_h`;
  `\mathcal{C}_\tau`; `\mathcal{C}^{imp}_b`, `\mathcal{C}^{exp}_b`; `\pi^{wb}_h`, `\pi_m^{fpha}` and the load-balance
  dual `\pi_{b,k}` (the `\pi^{lb}_{b,k}` alias); the innovation and noise scales `\sigma_m`, `\sigma_{m(t)}`, `\sigma_h`,
  the toy pages' bare `\sigma`, `\sigma_t`, and `\sigma_C`; and `\zeta_k`.

Block A therefore does not print "nothing or only STALE alias lines" as AC3 states: the 44 artefact lines remain, and
silencing them would mean listing pages for symbols they do not write. This is returned as a clarification in
ticket-159's report.

Counts of AC3, 2026-10-06: `0` and `0`.

```bash
for r in '/^## 2\./,/^## 3\./' '/^## 3\./,/^## 4\./'; do awk "$r" docs/design/symbol-registry.md | /usr/bin/grep -cE 'planned:[^|]*\(ticket-1(4[0-9]|5[0-9])[a-d]?\)'; done
```

AC4 (the ticket's command, run unchanged, plus the `i:lp-layout-and-scaling` pair XD-256 adds): it prints `0` and then
`1` and nothing else; the added pair passes. §2 holds 491 rows (the ticket-139 entry's command), against 490 at
`e11aa48`.

`/usr/bin/grep -c '^### .* — ticket-159 (E10 acceptance)$' docs/design/symbol-registry.md` prints `1` once this entry is
in.

#### Reconciliation (ticket-159)

- E10 delta, from the registry at `e11aa48` to the E10-complete tree (the diff also carries the E09, E11, E12, E13 and
  E14 edits made beside E10; the items below are E10's):
  - Owner moves (spec §6.1 parentheses resolved): 30 rows to `math/state-augmentation.md` — `A`, `B`, `K_i`,
    `K_{\max}`, `L_h`, `P^{\max}`, `\hat{a}_{h,\ell}`, `\hat{b}_{h,d}`, `\hat{x}^{\mathrm{a}}_{s,i}`,
    `\mathrm{deliver}(t)`, `\phi_{h,k}`, `a_{h,\ell}`, `b^{\mathrm{in}}_{h,1}`, `b^{\mathrm{out}}_{h,d}`, `c_i(t)`, `d`,
    `g^{\mathrm{a}}_{i,t}`, `h` (receiving plant), `i` (anticipated plant), `k_{max}`, `m` (delivery stage),
    `n_{\text{state}}`, `r_i(m)`, `s` (ring slot), `t_i(m)`, `v^{in}_h`, `x^{\mathrm{a,in}}_{s,i}`,
    `x^{\mathrm{a}}_{s,i}`, `x^{in}` and `y^i_t` (tickets 147, 147a); 11 rows to `math/lp-layout-and-scaling.md` —
    `A_{ij}`, `C_{stage}`, `D_r`, `K` (cost scale), `N`, `c_j`, `d_i^{row}`, `d_j^{col}`, `l_i^{row}`, `l_j` and `x_j`
    (ticket-148).
  - Pages added: state-augmentation to its 30 owner rows' cells and to `H_t`, `T`, `t`, `\ell`, `\tau_k`, `\theta`,
    `\beta_0`, `\beta^v_h`, `\beta^{lag}_{h,\ell}`, `\beta^{b}_{h,d}`, `\bar{c}`, `\bar{c}^{\,b}_{h,d}`, `\bar{G}_j`,
    `\underline{G}_j`, `\hat{v}_h`, `\mathcal{H}`, `\nu_{h',t,0}`, `\nu^{k' \to k}_{h',t}`, `Q_t`, `\zeta`, `w_k`,
    `g_{j,k}`, `v_h`, `z_h`, `d_{1 \to t}`, `d_{t_1 \to t_2}`, `k \in \mathcal{K}` and `P_h` (147, 147a);
    lp-layout-and-scaling to its 11 owner rows' cells and to `B`, `N`, `P^{\max}`, `Q_t`, `\beta`, `\beta_0`, `\pi`,
    `\bar{c}`, `\mathcal{H}`, `\theta`, `t`, `a_h`, `d_{t \to t+1}` and `z_h` (148); block-formulations and
    hydro-production-models to `\bar{c}` and `\gamma^{ev}_{v,h}`, and block-formulations to `\lambda_{h,b}` (155,
    157c).
  - Pages removed: lp-formulation from the rows whose mechanics moved (147, 148); system-elements from
    `\gamma_0^m`, `\gamma_v^m`, `\gamma_q^m`, `\gamma_s^m`, `\mathcal{M}_h`, `\lambda_{h,b}`, `\zeta`, `\zeta_k`, `w_k`,
    `P_h`, `d_{1 \to t}`, `d_{t_1 \to t_2}`, `s`, `x^{\mathrm{a}}_{s,i}`, `k \in \mathcal{K}`, `v^{avg}_h`,
    `\text{net\_flows}_{h,k}`, `\mathrm{obj}`, `c^{spill}_h`, `c^{div}_h`, `c^{tc}_h`, `\text{entry\_stage\_id}` and
    `\text{exit\_stage\_id}` (152, 152a).
  - Retired: the block-formulations storage coefficient `\gamma_v` leaves §2 and becomes §4 row 132 with its §5 grep
    (ticket-155); the §5 replay prints `: 0` for it.
- Registry corrections by this ticket (under `flock /tmp/symbol-registry.lock`, each located by content and checked
  against the pages; hunk counts of the registry diff equal with and without `-w`, 49/49):
  - §1.1 (and verbatim on the notation page): the `A`, `D`, `K` and `s` lines are added and the `L`, `i`, `j` and `m`
    lines extended with the E10-split meanings (the `r` and `z` extensions follow below) (`K_i` and the cost-scale `K`, `L_h`, `A_{ij}` with the matrix `A`,
    `A_{r,k}`, `A_{h,t-1}` and the count `A`, `D_{b,k}` (written `D`, `D_b` on the toy pages) and `D_r`, `D_c`, the anticipated plant `i` and the LP row `i`,
    the LP column `j`, the deficit segment and ring slot `s`, the delivery stage `m`; XD-51 for `m`, XD-151 for `K`,
    XD-256 for the LP row `i`). Each line names every page of each meaning on the E10-complete tree, math layer and
    glossary, as the `k_{max}` line does; the reference pages that write the ring slot `s` are not named. The `i` and
    `j` lines also gain the hydro-production-models forms the §3 rows never listed: the breakpoints `v^{(i)}`,
    `h^{(i)}` (§4, ticket-021) and the FPHA fitting-grid points `V_i`, `Q_j`. The `z` line names state-augmentation and
    lp-layout-and-scaling for `z_h`, and the `r` line adds the ring position `r_i(m)` of state-augmentation
    (XD-235 (c)). The intro drops the E10-split sentence: one kind of reuse is held back.
  - §2: `V_t(x)` gains lp-formulation (`V_{t+1}`, `V_{T+1} = 0`; XD-208); the stage-index row drops what-cobre-solves
    (no math on the page) and its 'stage-zero LP' clauses, and writes `\beta^v_4` and `\hat v_{h,3}` for the toy forms
    the pages write (XD-306); the `\mathcal{H}`, `\mathcal{L}`, `\mathcal{P}`, `\mathcal{R}` and `\mathcal{T}` set rows
    drop the pages that write no set glyph (system-elements, equipment-formulations, block-formulations,
    hydro-production-models, cut-management; XD-286, XD-291), and `\mathcal{L}` and the line-efficiency row write the
    line index `n`; the second `\eta_n` row is Pages `—` (XD-286); the three NCS rows say system-elements writes the
    decided `\mu^{nc}_r`, `s^{nc}_r`, `\varepsilon^{nc}_r` in `\xi_r` (XD-286); `V^{max}_h` drops lp-formulation,
    `\beta_0` hydro-production-models and its `\alpha_{FPHA}` clause, `\hat{a}_{h,\ell}` and `\hat{v}_h` cut-management,
    `Q_t` hydro-production-models, and `x^{in}` state-augmentation (Block A STALE with no alias); `\beta^{lag}_{h,\ell}`
    writes the `\beta^{lag}` forms the pages use in place of the retired `\pi^{lag}` ones; `\sigma_m`, `P_h` and
    `d_j^{col}` name the forms block-formulations, cut-management and state-augmentation write (`d^{col}_{h,d}`,
    XD-235 (b)); `\mathrm{deliver}(t)` says no page writes it (XD-235 (a)); `\lambda_{h,b}` writes `\lambda_{h,b}` in its
    sum (XD-291); `\text{net\_flows}_{h,k}` takes block-formulations as its owner (it is defined and written there, and
    lp-formulation §4 writes its terms out; XD-291); the `c` row drops the removed "cost parameter" quote (XD-291);
    `\text{entry\_stage\_id}` and `\text{start\_stage\_id}` are Pages `—` and Notation `no`, and `L` reads "the stage
    before its entry stage" (XD-291 (d), with the notation and page edits); the cost-scale `K` row gains the notation page
    (XD-151); the slack-prefix `\sigma` row gains penalty-system, which writes the slacks (Block A); the FPHA intercept
    and envelope rows write `k_{FPHA}`, the decided form (§4 row 102); `D_{b,k}` says system-elements labels it `D`.
    The five XD-235 (a) owner rows are reconciled: `K_{\max}` and `y^i_t` already read "no page writes it", owner kept;
    `\mathrm{deliver}(t)` gains it; `c_i(t)` keeps its pages through the `c_i(m)` alias its Concept names; `x^{in}`
    keeps state-augmentation as owner (it pins each family by its own columns) and lists the pages that write it.
    XD-253 needs no edit: the E09 entry already wrote `N(1+P^{\max})` into the `P^{\max}` and `N` Concepts and added
    cut-management and `_cut-management.notes` to `\underline{z}^k`.
  - §3: the `K`, `L`, `A`, `D`, `i`, `j`, `l`, `m`, `P`, `r`, `s`, `w`, `x`, `γ`, `ζ`, `d`, `c`, `h`, `v` rows and the four
    resolved NCS rows have their meanings' page lists and co-occurrence cells re-derived on the E10-complete tree
    (XD-235 (d), XD-256 (a), XD-286, XD-293), each Decision cell citing this ticket. Co-occurrence cells after the edits: `K`,
    `L`, `A`, `D`, `j`, `l` none; `i` par-inflow-model (the Yule-Walker and eigenvalue indices); `m` lp-formulation,
    block-formulations, scenario-generation; `P` lp-formulation, scenario-generation, sddp-algorithm, cut-management;
    `r` discount-rate; `s` lp-formulation, system-elements, scenario-generation, glossary; `x` cut-management,
    sddp-algorithm, risk-measures, upper-bound-evaluation, sddp-framework-overview; `γ` lp-formulation,
    block-formulations, hydro-production-models; `d` state-augmentation, lp-layout-and-scaling, sddp-algorithm,
    discount-rate, upper-bound-evaluation, horizon-modes, cut-management, glossary; `c` system-elements,
    state-augmentation, lp-layout-and-scaling, hydro-production-models, upper-bound-evaluation; `h`
    hydro-production-models. Every co-occurring pair is a distinct form under the §3 collision criterion except the
    hydro-production-models `i`, whose breakpoint and fitting-grid uses are recorded as one storage-point family
    (returned for confirmation in ticket-159's report).
  - The out-of-cluster `_hydro.configure` bullet of §3 cites the partial's current lines (`k_{FPHA}` at line 161,
    `gamma_v` at lines 147, 166, 173, 323), XD-312.
- Notation page (Requirement 3, under `flock /tmp/notation.lock`; 8 hunks, equal with and without `-w`): the 41
  declarations mirrored verbatim; the cost-scale `K` row added to `### 3.2 Load and Costs` (D-E10Δ-M2, option A),
  checked against lp-layout-and-scaling §2.1 and `crates/cobre-sddp/src/setup/params.rs:43`
  (`DEFAULT_COST_SCALE_FACTOR`; no key and no default on the page); the `\text{start\_stage\_id}`,
  `\text{entry\_stage\_id}` row removed and the `L` row reading "Last filling stage of a filling hydro, the stage before
  its entry stage" (XD-291 (d)). The definitions of the Notation = yes rows whose Owner moved to state-augmentation or
  lp-layout-and-scaling, or whose Pages lost system-elements, were compared with the registry and the owner page. They
  match for `B`, `K_i`, `k_{max}`, `L_h`, `\phi_{h,k}`, `\hat{a}_{h,\ell}`, `a_{h,\ell}`, `b^{\mathrm{out}}_{h,d}`,
  `c_i(t)`, `g^{\mathrm{a}}_{i,t}`, `n_{\text{state}}`, `r_i(m)`, `s`, `t_i(m)`, `v^{in}_h`, `x^{\mathrm{a}}_{s,i}`,
  `x^{\mathrm{a,in}}_{s,i}`, `x^{in}`, `N`, `x_j`, `P_h`, the FPHA plane coefficients, `\lambda_{h,b}`,
  `\mathcal{M}_h`, `\zeta`, `\zeta_k`, `w_k`, `d_{1 \to t}`, `d_{t_1 \to t_2}`, `\text{net\_flows}_{h,k}`,
  `c^{spill}_h`, `c^{div}_h`, `c^{tc}_h`, `v^{avg}_h`, `k \in \mathcal{K}`, `\eta_n`, `\pi^{lb}_{b,k}`, `(h, b)` and
  `V_t(x)`. One correction: `P^{\max}` read "Maximum AR order across hydros" with the symbol `P^{\max} = \max_h P_h`;
  it reads the lag depth of the state-augmentation §4 definition (the largest AR order, at least twelve with the
  annual component, and the deepest lag a terminal boundary references, linked to that section; `crates/cobre-stochastic/src/par/precompute.rs:203-212`,
  `crates/cobre-sddp/src/setup/mod.rs:925-936`).

#### §1.1 held-back list

The §1.1 intro, printed with the first command below, names no ticket of E10 (the second command prints `0`). Its
held-back list, quoted verbatim with the hard wraps joined:

> One kind of decided reuse is not listed yet: a reuse that involves a meaning a later ticket introduces is declared by that ticket (ADR-046).

```bash
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md
awk '/^### 1\.1 /{f=1} f && /^- /{exit} f' docs/design/symbol-registry.md | /usr/bin/grep -cE 'ticket-1(4[0-9]|5[0-9])|E10-split'
```

#### Hand-off: rows with a later page

Every §2 table row's Pages cell names only existing pages: the Pages-exist check above prints nothing. No row carries a
`planned:` entry that names a ticket of E10 (the first AC3 count prints `0`).

#### XD-330 rulings (addendum)

The coordinator's rulings on ticket-159's four clarifications (XD-330):

- C1 = A: the 44 artefact lines of Block A are accepted and AC3 is amended; a token-boundary Block A is routed to E15
  (tickets 248a and 248b).
- C2 = A: hydro-production-models §2 writes the fit constant `9.81\,\eta_h/1000` inline, so `\rho_{esp}` names only the
  authored specific productivity. The `\rho_{esp}` and `\phi` rows of §2 follow the ruling, and §4 row 133 with its §5
  grep records the change; the page edit is ticket-159 orchestrator edit OE-14.
- C3 = A: the hydro-production-models `i` breakpoint and fitting-grid uses are one storage-point family, as the
  Reconciliation above records.
- C4 = A: AC1 is amended to 455 + 22 = 477.
- Orchestrator edit OE-8 (`_hydro.io.mdx`) moves to ticket-207n, and OE-13 (link texts, XD-314) to ticket-222.

This addendum supersedes the statement of the §5 replay above that E10 adds no §4 row in this ticket: row 133 is the
last row, and the replay runs 133 greps. On the working tree row 133 prints `: 5` (hydro-production-models lines 60,
69, 146, 149 and 180) until OE-14 lands; every other row prints `: 0`.

Simulated tree, 2026-10-06: a scratch copy of `src/content/docs`, `src/figures` and `src/components` with OE-1 to OE-7,
OE-9 to OE-12 and OE-14 to OE-16 applied in that order, each OLD string matching once at its turn (OE-15 rewrites the
sentence OE-9 edits; applied alone to the working-tree sentence it gives the same file), with this registry. On it the
§5 replay prints 133 rows of `: 0`. Block A prints 77 lines: the 33 STALE alias lines and the 44 artefact lines listed
above. The working tree prints 80; the other three are the `\text{start\_stage\_id}` and `\text{entry\_stage\_id}`
lines that OE-3, OE-4 and OE-5f remove. `check:voice`, `check:narration` and `check:version` pass, and the
banned-phrase replay of section 1 and block D print nothing beyond zeros. With the orchestrator batch applied to the working tree (guardian re-run, 2026-10-06), row 133 prints 0, Block A prints 77 lines, and the section 1 replay prints 477 lines of 0.
