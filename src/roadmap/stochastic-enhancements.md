# Stochastic Enhancements

This page covers planned improvements to the stochastic modeling and sampling layers of Cobre. These features extend the inflow model, allow finer temporal resolution, add flexibility to the noise generation pipeline, and introduce sampling variants for the backward pass and forward pass.

> **Prerequisites last reviewed against v0.1.1 implementation state.** The PAR(p) estimation module (epic-11) is now operational. See individual sections below for updated prerequisite status.

---

## C.8 CEPEL PAR(p)-A Variant

The standard PAR(p) inflow model is implemented and validated. The CEPEL PAR(p)-A variant extends it with four refinements primarily relevant to basins with highly skewed inflow distributions:

- Maximum AR order fixed at 12 to enforce an annual cycle
- Stationarity enforcement via a coefficient constraint
- Lognormal transformation: the model fits on `log(inflow)` rather than the raw inflow, which prevents synthetic inflow values from going negative
- Regional correlation between hydro plants in the same river basin

The lognormal variant is mainly needed when inflow distributions are highly right-skewed and the standard model produces negative synthetic values with non-negligible probability. The inflow non-negativity handling strategies already mitigate this for the standard model in most basins.

**Why it is deferred**: The standard PAR(p) model covers most practical use cases. The PAR(p)-A variant is a refinement for specific basin characteristics. The current input format (`inflow_seasonal_stats.parquet` and `inflow_ar_coefficients.parquet`) is already compatible with PAR(p)-A — the lognormal transformation is applied during history preprocessing before computing the seasonal statistics.

**Prerequisites**:

- ~~Standard PAR(p) fitting and validation operational~~ (met in v0.1.1 — estimation module implemented in epic-11)
- Lognormal transformation infrastructure (log-space fitting, back-transformation)
- Validation suite comparing PAR(p) and PAR(p)-A on representative basins

**Estimated effort**: Small-Medium (1-2 weeks). The mathematical extensions are straightforward; the main effort is validation and testing.

**See also**: [Deferred Features §C.8](../specs/deferred.html#c8-cepel-parp-a-variant), [PAR Inflow Model](../specs/math/par-inflow-model.md)

---

## C.10 Fine-Grained Temporal Resolution (Typical Days)

The current block formulation represents each SDDP stage with a small number of load blocks (for example, peak, shoulder, and off-peak) that aggregate monthly hours by load level. This is adequate for long-term planning but cannot model daily cycling patterns — daily storage behavior for pumped hydro and batteries, hourly renewable generation profiles, time-of-use pricing, or intra-day ramp constraints.

The planned extension introduces representative typical day types (for example, weekday and weekend) within each SDDP stage, each containing a sequence of chronological hourly blocks. This enables accurate daily sub-structure without increasing the cut pool size (cuts are still generated at stage boundaries, not within day types).

Key open design questions that require research before implementation:

- **Day-type chaining**: Should the end-of-day storage from one day type carry forward to the next day type within the same stage, or should each day type operate independently with a weighted average end-of-stage storage?
- **Objective scaling**: Block durations are actual hours (for water balance), but the objective contribution must be scaled by how many days each day type represents.
- **Two-phase architecture**: Training with aggregated blocks followed by simulation with full typical-day resolution. Cut compatibility conditions between the two phases need formal verification.

**Why it is deferred**: This feature requires research on the open design questions before implementation can begin. The LP size per stage grows substantially (from 3 blocks to 72 or more), and the interaction with existing block formulations is complex.

**Prerequisites**:

- Core parallel and chronological block modes operational and validated
- Simulation architecture supports variable block configurations
- Research on day-type chaining and two-phase cut compatibility completed

**Estimated effort**: Large (4-6 weeks). Significant input schema design, LP construction changes, and research required.

**See also**: [Deferred Features §C.10](../specs/deferred.html#c10-fine-grained-temporal-resolution-typical-days)

---

## C.11 User-Supplied Noise Openings

The standard noise generation pipeline samples independent Gaussian noise vectors and applies spectral correlation. This pipeline covers most use cases, but some workflows require direct control over the noise values:

- Importing noise realizations from external stochastic models that use non-Gaussian distributions
- Reproducing exact noise sequences from legacy tools for validation
- Using domain-specific spatial correlation structures not captured by the spectral decomposition approach
- Research workflows where specific noise patterns are under study

The planned mechanism is a `scenarios/noise_openings.parquet` file. When this file is present, the scenario generator skips internal noise sampling and spectral correlation entirely, loading the user-supplied values directly into the opening tree.

Open design questions to resolve before implementation: the relationship to the existing external scenario mechanism (with noise inversion), what validation checks should be applied to user-supplied noise, whether load entity noise should be included alongside inflow noise, and whether separate noise sets are needed for forward and backward passes.

**Prerequisites**:

- ~~Opening tree architecture implemented and validated~~ (met before v0.1.1 — Phase 5 cobre-stochastic)
- Forward/backward noise separation operational
- Clear use case catalog that cannot be served by the existing external scenario mechanism

**Estimated effort**: Small (1 week). Input loading and validation are straightforward once the design questions are resolved.

**See also**: [Deferred Features §C.11](../specs/deferred.html#c11-user-supplied-noise-openings), [Scenario Generation §2.3](../specs/architecture/scenario-generation.md)

---

## C.14 Monte Carlo Backward Sampling

The standard backward pass evaluates all openings in the opening tree at each backward stage. When the opening count is large (500 or more, for high-fidelity tail representation), the backward pass dominates iteration time. Monte Carlo backward sampling replaces full enumeration with a sample of `n` openings drawn with replacement from the tree, reducing backward pass cost from O(N_openings) to O(n) LP solves per stage per trial point.

The resulting cut is an unbiased estimator of the full cut but with higher variance. The trade-off relative to the default full evaluation: fewer solves per iteration, but non-monotonic lower bound behavior (which complicates convergence monitoring) and slower per-iteration convergence.

**Why it is deferred**: The default complete evaluation is reliable and performant for typical production opening counts (50-200). Monte Carlo sampling introduces non-monotonic lower bounds, which require adaptations to convergence monitoring. The benefit depends on the chosen `n` relative to `N_openings`, which is problem-dependent.

**Prerequisites**:

- ~~Core SDDP with complete backward sampling validated~~ (met before v0.1.1 — Phase 6 cobre-sddp)
- Convergence monitoring supports non-monotonic lower bounds
- Empirical study of the `n` vs. convergence rate trade-off

**Estimated effort**: Small (1 week). Sampling infrastructure is trivial; the main effort is convergence monitoring adaptation.

**See also**: [Deferred Features §C.14](../specs/deferred.html#c14-monte-carlo-backward-sampling)

---

## C.15 Risk-Adjusted Forward Sampling

Standard forward sampling draws scenarios uniformly from the opening tree. For strongly risk-averse policies (CVaR with weight `lambda` close to 1.0), uniform sampling under-explores the worst-case tail scenarios that matter most for the risk measure.

Risk-adjusted forward sampling biases the forward pass toward tail scenarios by evaluating the risk measure over candidate noise terms at each forward stage and re-weighting or re-sampling the next-stage noise accordingly. A complementary importance sampling variant weights forward trajectories by their likelihood ratio under the risk-adjusted distribution, enabling tighter upper bound estimates for risk-averse settings.

**Why it is deferred**: Integration with the CVaR risk measure configuration is non-trivial, and importance weights must be handled carefully in upper bound estimation. Default uniform sampling is sufficient for most applications; the benefit is primarily for strongly risk-averse configurations.

**Prerequisites**:

- CVaR risk measure implemented and validated
- Forward sampling scheme abstraction supports per-stage re-weighting
- Upper bound evaluation handles importance-weighted trajectories

**Estimated effort**: Medium (2-3 weeks). The algorithm is well-documented in the literature; the main effort is integration with the risk measure and convergence analysis.

**See also**: [Deferred Features §C.15](../specs/deferred.html#c15-risk-adjusted-forward-sampling), [Risk Measures](../specs/math/risk-measures.md)
