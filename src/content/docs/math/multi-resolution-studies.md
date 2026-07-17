---
title: Multi-Resolution Studies
description: Mixed-resolution SDDP studies with monthly and quarterly (or weekly and monthly) stages — same-season noise sharing, duration-weighted aggregation, and PAR fitting on aggregated statistics.
---

## Purpose

A multi-resolution study is a single study whose stages span more than one
temporal resolution — most commonly a monthly head followed by a quarterly
tail, or a weekly head followed by a monthly tail. All stages belong to one
SDDP horizon and share one set of value-function cuts; no coupling boundary
exists. The modelling challenge is that the PAR(p) inflow model is defined at a
fixed seasonal grid, yet stages at different resolutions must draw noise from
the same underlying stochastic process and produce statistically coherent
inflow realisations. This chapter describes how Cobre handles that challenge.

**Boundary with the coupled-studies chapter.** A multi-resolution study is one
study with mixed-resolution stages. Weekly+monthly coupled studies
([Weekly+Monthly Coupled Studies](/math/weekly-monthly-coupled-studies)) are
instead two separate studies that hand off at an explicit coupling boundary.
Where the same stochastic aggregation concept appears in both contexts, this
chapter owns the mechanism description; the coupled-studies chapter
cross-references here.

## 1. Same-Season Noise Sharing

The PAR(p) model associates each stage $t$ with a season index $m(t)$. In a
purely monthly study, $m(t)$ cycles over twelve months and stages with the same
calendar month share the same seasonal parameters $(\mu_m, s_m,
\psi_{m,\ell})$.

When some stages run at quarterly resolution, a quarterly stage covers the same
calendar period as three monthly stages. Cobre assigns every quarterly stage the
season index of its middle month so that the seasonal noise vector for that
quarter is drawn from the same distribution as the corresponding monthly season.
The noise draw $\varepsilon_t$ for a quarterly stage therefore represents the
same seasonal signal that monthly stages in the same calendar quarter would
share — the stochastic process is not re-defined at the coarser resolution; it
is sampled at the resolution that the stage demands.

This alignment guarantees that forward trajectories at different stage
resolutions remain on the same probability space. A quarterly stage and the
three monthly stages it replaces draw noise that is centred on the same seasonal
mean and scaled by a statistic derived from the same historical record after
aggregation (see section 3).

## 2. Duration-Weighted Aggregation

Monthly inflow observations cannot be fed directly into a PAR fitting procedure
intended for quarterly stages because the seasonal moments (mean, standard
deviation, and autocorrelations) must refer to the resolution at which the AR
model will be evaluated. Cobre aggregates the historical observations from the
fine to the coarse resolution before fitting, using duration weighting.

**Aggregation rule.** The quarterly equivalent of a set of monthly observations
within the same quarter is the duration-weighted sum of those observations:

$$
a^{(Q)}_q = \sum_{m \in Q} d_m \cdot a^{(M)}_m
$$

where $a^{(M)}_m$ is the monthly observation, $d_m$ is the duration weight of
month $m$ within quarter $Q$ (normalised so that $\sum_{m \in Q} d_m = 1$), and
$a^{(Q)}_q$ is the resulting quarterly observation. The seasonal mean and
standard deviation of the quarterly series are then estimated from the
aggregated observations $\{a^{(Q)}_q\}$ in the usual way.

The duration weights reflect the fraction of the quarter's total duration
contributed by each month. For calendar quarters with three months of unequal
length (e.g., January/31, February/28–29, March/31), the weights differ from
the uniform $1/3$ value that a naive average would apply.

**Weekly-to-monthly aggregation** follows the same rule: a monthly observation
aggregates the weekly observations whose periods fall within that month, weighted
by the fraction of the month's duration each week covers.

## 3. PAR Fitting on Aggregated Statistics

After duration-weighted aggregation, the aggregated series has the same form as
a homogeneous-resolution series at the coarser resolution. The standard
five-step PAR fitting procedure described in
[PAR(p) Inflow Model](/math/par-inflow-model) section 5 applies without
modification.

For stages that run at the fine resolution (e.g., the monthly head of a
monthly-quarterly study), the seasonal statistics $(\mu_m, s_m)$ and AR
coefficients $(\psi_{m,\ell})$ are derived from monthly observations in the
normal way. For stages that run at the coarse resolution (e.g., the quarterly
tail), the statistics and coefficients are derived from the duration-weighted
quarterly aggregates. The two sets of parameters co-exist in the same parameter
files; the system resolves the appropriate set for each stage when building the
stage-indexed preprocessing arrays described in
[Scenario Generation](/math/scenario-generation) section 1.

No separate fitting pipeline exists for multi-resolution studies: the aggregation
step is a preprocessing transformation that produces a coarser-resolution
observation series, after which the standard procedure runs once per resolution
band that appears in the study.

## 4. Opening-Tree Generation Across Resolutions

The opening tree (see [Scenario Generation](/math/scenario-generation)
section 2.3) is generated per stage. Each stage's noise vectors are drawn from
the PAR model at that stage's native resolution: monthly stages use monthly
seasonal parameters; quarterly stages use quarterly parameters derived from the
aggregated statistics of section 2.

Because the season index assignment of section 1 aligns quarterly stages with
the same seasonal calendar as the corresponding monthly stages, the opening tree
is coherent across the resolution boundary. A quarterly stage in the fourth
quarter and the three monthly stages of that quarter draw noise with the same
seasonal conditioning — that alignment is a structural consequence of
season-index assignment.

One sampling rule is specific to subdivided seasons: **noise groups**. Before
the tree is drawn, stages are grouped by `(season_id, year)`, and consecutive
stages falling in the same group — several fine-resolution stages inside one
coarse season, such as weekly stages within a monthly season — receive one
shared draw per opening: the group's first stage draws from its
(opening index, stage) seed and each later stage in the group copies that
stage's already-correlated noise. This prevents a season's stochastic
innovation from being sampled anew for every stage the season happens to be
subdivided into. A stage without a `season_id` forms its own group, and in a
uniform single-resolution study every group is unique, so every stage draws
independently. The group assignment is a pure function of the stage calendar,
so it is identical on every MPI rank (see
[Determinism Guarantees](/math/determinism-guarantees)).

The backward pass iterates over the full opening tree without distinguishing
stage resolution; cut aggregation proceeds as in a single-resolution study.

## 5. Trade-offs

**Sub-resolution information loss.** Duration-weighted aggregation discards the
intra-quarter variation among monthly observations. A monthly series with
pronounced within-quarter autocorrelation loses that signal when aggregated to
quarterly. The fitted PAR model at quarterly resolution can only reproduce
variation at the quarterly timescale; sub-quarterly dynamics are invisible to
the value function in the quarterly tail.

**Timescale interpretation.** The analyst must track which resolution each
reported statistic refers to. A mean inflow reported for a quarterly stage is a
duration-weighted quarterly mean, not a monthly mean. Comparing statistics
across the resolution boundary requires explicit re-scaling; automated
cross-resolution comparisons are outside the scope of the optimizer.

**Season-index choice.** Assigning a quarterly stage the season index of its
middle month is a convention, not a physical law. It aligns the noise
distribution with the seasonal calendar in a symmetric way, but introduces a
small boundary effect at the start and end of each quarter: the first and last
months of a quarter contribute less to the quarterly mean than the middle month
does to the monthly statistics. The analyst should inspect seasonal means and
standard deviations in the aggregated statistics file to verify that the
aggregated distribution matches expectations before running training.

## Cross-References

- [PAR(p) Inflow Model](/math/par-inflow-model) — The fitting procedure (section 5) that applies to aggregated statistics; the parameter set that the aggregated statistics populate; the LP-ready form that quarterly stages use at runtime.
- [Scenario Generation](/math/scenario-generation) — Opening-tree generation (section 2.3) that produces per-stage noise vectors; the PAR preprocessing pipeline (section 1) that resolves seasonal statistics into stage-indexed arrays at the native resolution.
- [Weekly+Monthly Coupled Studies](/math/weekly-monthly-coupled-studies) — The boundary chapter: two studies coupled at a handoff point rather than one study with mixed stages; sub-monthly lag accumulation and terminal boundary cuts live there, not here.
