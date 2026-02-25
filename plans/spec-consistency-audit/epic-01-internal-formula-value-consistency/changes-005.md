## Change Summary: Epic 01 Fixes

### Files Modified

#### `src/specs/math/block-formulations.md`

- **SC-1**: Line 83 -- Replaced `$\beta_h^{storage}$` with `$\pi^v_h$` to complete the beta-to-pi cut coefficient migration. This was the last remaining `$\beta$` usage in cut coefficient context across all 14 math specs.

#### `src/specs/math/hydro-production-models.md`

- **SC-3 / SV-5**: Line 281 -- Replaced `$\pi_{\hat{v}_h}$` with `$\pi^v_h$` and `$\pi_h^{balance}$` with `$\pi^{wb}_h$` in the FPHA cut coefficient formula. This aligns with the canonical notation in notation-conventions.md section 5.2 and cut-management.md line 46.

#### `src/specs/overview/notation-conventions.md`

- **MD-10**: Section 3.2 -- Changed `$c^{th}_{t,s}$` to `$c^{th}_{j,s}$` to avoid collision between the thermal plant index and the stage index `$t$`. All math specs use `$j$` for thermal plant index.
- **SC-2 (contract capacity)**: Section 3.4 -- Replaced `$\bar{M}_c$` with `$\bar{C}_c$, $\underline{C}_c$` to match the notation used in equipment-formulations.md and system-elements.md. The symbol `$\bar{M}_c$` was not used in any math spec.
- **MD-1, MD-2, MD-3, MD-4**: Section 2 -- Added four missing index sets:
  - `$\mathcal{H}^{fpha}$` -- Hydros using FPHA production model (typical size 50)
  - `$\mathcal{H}^{const}$` -- Hydros using constant productivity
  - `$\mathcal{R}$` -- Non-controllable generation sources
  - `$\mathcal{C}$` -- Unified contract set (`$\mathcal{C}^{imp} \cup \mathcal{C}^{exp}$`)
- **MD (slack)**: Section 4.3 -- Added two missing slack variables:
  - `$\sigma^{v-}_h$` -- Storage below minimum (hm3)
  - `$\sigma^{fill}_h$` -- Filling target shortfall (hm3)
- **MD (duals)**: Section 5.5 -- Added two missing dual variables to the summary table:
  - `$\pi_m^{fpha}$` -- Dual of FPHA hyperplane $m$
  - `$\pi^{gen}_c$` -- Dual of generic constraint $c$

#### `src/specs/overview/production-scale-reference.md`

- **D1**: Section 3.1 table -- Added missing "Hydro inflow (per-block)" variable row (160 x 3 = 480 variables). The s3.3 formula (`N_HYDRO * N_BLOCK * 4`) and the calculator both include this variable; only the s3.1 breakdown table was missing it.
- **D2**: Section 3.1 table -- Changed Pumping row from `$N_{pump} \times N_{block}$` (15) to `$N_{pump} \times N_{block} \times 2$` (30) to account for both pumped flow and pumped power variables, matching the s3.3 formula and calculator.
- **D3**: Section 3.2 table -- Changed "Hydro generation (constant)" formula from `$N_{hydro} \times N_{block}$` (480) to `$(N_{hydro} - N_{fpha}) \times N_{block}$` (330). Constant productivity constraints apply only to non-FPHA hydros. Also updated the corresponding s3.3 counting formula line from `N_HYDRO` to `(N_HYDRO - N_HYDRO_FPHA)`.

#### `src/specs/hpc/synchronization.md`

- **B-001**: Section 1.1 -- Replaced misleading "exactly three collective calls per iteration" with a precise statement: "three types of collective calls per iteration" with the total count of $T+1$ operations explicitly stated.

#### `src/specs/architecture/convergence-monitoring.md`

- **B-005**: Cross-References section -- Added back-link to `synchronization.md` for MPI_Allreduce convergence statistics aggregation.

#### `src/specs/architecture/scenario-generation.md`

- **B-006**: Cross-References section -- Added back-link to `memory-architecture.md` for per-rank memory budget tracking of opening tree and scenario data.

### Items Flagged as NEEDS REVIEW

- **SC-2 ($\gamma$ overloading)**: The symbol `$\gamma$` is used for both FPHA hyperplane coefficients (`$\gamma^m_0, \gamma^m_v, \gamma^m_q, \gamma^m_s$`) and pumping power consumption rate (`$\gamma_j$`). Disambiguating subscripts (`$m$ superscript` vs `$j$ subscript`) make the intended meaning clear in context, but a rename of the pumping parameter may be warranted. Not fixed because: (a) the overloading is documented in findings-001, (b) a rename would cascade through lp-formulation.md, system-elements.md, and equipment-formulations.md, and (c) the finding severity is LOW. Recommend evaluating in a dedicated notation cleanup pass.

- **SC-2 ($\eta$ overloading)**: The symbol `$\eta$` is used for three concepts: line efficiency (`$\eta_l$` in section 3.4), PAR innovation noise (`$\eta_t$` in par-inflow-model.md LP form), and VaR threshold (`$\eta$` in risk-measures.md). The PAR usage collides with line efficiency. Not fixed because: (a) the risk-measures.md usage is explicitly acknowledged in that spec's preamble, (b) the par-inflow-model.md formally uses `$\varepsilon_t$` for innovation and only uses `$\eta_t$` for the sampled realization in the LP form, and (c) renaming would affect multiple specs and the inflow-nonnegativity.md spec. Recommend a dedicated pass to unify to `$\varepsilon_t$` for the PAR innovation noise.

- **SV-1 ($\zeta_k$)**: Per-block conversion factors `$\zeta_k$` and `$\zeta_1$` in block-formulations.md are natural extensions of `$\zeta$` but the subscript convention is not documented. Not fixed because these are locally defined in block-formulations.md with explicit formulas, and adding a subscript convention note would be a notation enrichment (LOW priority).

- **SV-2, SV-3 ($\psi_\ell$, $\mu_t$, $\sigma_t$)**: In lp-formulation.md, the PAR parameters drop the season subscript `$m$` (using `$\psi_\ell$` instead of `$\psi_{m,\ell}$`) and use stage index `$t$` instead of season index `$m$` for mean/std. Not fixed because: the LP form context makes the stage-to-season mapping implicit, and enforcing the full notation would make the LP equations more verbose without improving clarity.

- **SV-4 ($\gamma_0, \gamma_v, \gamma_q, \gamma_s$ without superscript)**: system-elements.md line 27 uses FPHA coefficients without the plane superscript `$m$`. The formal equations at lines 296 and 363 correctly include it. Not fixed because this is a prose explanation where the plane index is not relevant to the point being made.

- **SV-6 (bus-subscript convention)**: The convention of restricting index sets to bus-scoped subsets (e.g., `$\mathcal{H}_b$`) is not documented in notation-conventions.md. Not fixed because: this is a documentation enrichment item (LOW priority) and the bus-subscript pattern is intuitive.

- **MD-5, MD-6, MD-7, MD-8, MD-9**: Penalty cost parameters (`$c^{ctr}_c$`, `$c^{fpha}_h$`, `$c^{curt}_r$`, Category 2 penalties, `$\gamma_j$`) are not in notation-conventions.md section 3. Not fixed because: these are extensively documented in lp-formulation.md section 1.3 tables and penalty-system.md, and notation-conventions section 3 focuses on core physical parameters rather than penalty coefficients. Adding them would expand the table significantly. Recommend adding a cross-reference note to section 3 pointing to lp-formulation.md as the authoritative source for penalty parameters.

- **MD ($\xi_h$)**: The noise adjustment slack variable `$\xi_h$` in inflow-nonnegativity.md is not in notation-conventions.md. Not fixed because: it is used only in that one spec and is properly defined there. Adding it to notation-conventions would be a minor enrichment.

- **SV (contract $\chi_{c,k}$)**: The unsuperscripted `$\chi_{c,k}$` for unidirectional contracts vs the canonical `$\chi^{in}_{c,k}$`/`$\chi^{out}_{c,k}$`. Not fixed because: the unidirectional model intentionally drops the direction superscript (the direction is determined by contract set membership). A documentation note in section 4.1 would be a minor enrichment.

- **D5 (s3.1 total "~7,500")**: The approximate total understates the worst-case sum after adding the inflow variable row. Not fixed because: the total is explicitly approximate, the exact values are provided in s3.4 via the calculator, and the approximate serves as a rough order-of-magnitude guide.

- **Forward pass count 200**: Per ticket instructions, NOT changed to 192. All 14 locations cataloged in findings-003 are left as-is. This is deferred to Epic 03.

- **B-002, B-003, B-004**: Low-severity ambiguities in warm-start lifecycle and opening tree memory layout descriptions. Not fixed because: these are not contradictions, merely complementary descriptions across specs. Clarifying them would require adding cross-reference notes or consolidating descriptions, which is out of scope for this fix pass.

### mdbook build: PASS

Build completes with exit code 0. Pre-existing warnings in `risk-measures.md` (HTML tag balance) are unrelated to these changes.
