# Weekly+Monthly Coupled Studies

## 1. Purpose

A **weekly+monthly coupled study** pairs two separate Cobre runs: an upstream
monthly run that builds a policy over a longer horizon, and a downstream weekly
run that inherits the terminal value of the monthly run rather than computing
it from scratch. The coupling is not merely a change of time resolution — it
is a handoff across a study boundary where the stochastic model, the scenario
tree, and the initial conditions of the AR dynamics all transition from one
run's calendar to the other's.

This chapter describes how the three components of that handoff compose: the
import of terminal boundary cuts from the monthly run, the seeding of the
weekly run's AR lag buffer from recent observations in the historical record,
and the independent scenario-count configuration that the weekly run carries
as its own opening tree. The chapter is a synthesis; the underlying mechanisms
belong to their owning chapters and are cross-linked throughout.

**Boundary distinction.** This chapter concerns two separate studies that hand
off at a single coupling boundary. The distinct topic of mixing multiple
temporal resolutions within a single study (e.g., a weekly head followed by a
monthly tail in one run) is covered in
[Multi-Resolution Studies](./multi-resolution-studies.md), which addresses
duration-weighted aggregation and within-study noise sharing — objectives that
do not arise in the two-study coupling described here.

## 2. The Coupling Boundary: Terminal Boundary Cut Import

The monthly run's final output at its terminal stage is a collection of Benders
cuts that together lower-bound the cost-to-go from any reservoir state at that
stage. When the weekly run imports these cuts as its own terminal boundary
condition, it receives an already-informed approximation of the value of stored
water at the end of its horizon, without re-running the upstream model.

The guarantee is inherited directly from the properties established for
terminal boundary cuts in the SDDP algorithm: imported cuts are valid Benders
cuts. They satisfy the same lower-bound and convexity conditions as cuts
generated internally. Adding them to the weekly run's terminal stage seeds the
outer approximation with upstream information; the backward pass then tightens
that approximation from the informed starting point. The append-only property
of the cut pool ensures that the lower-bound estimate remains non-decreasing
throughout training, regardless of whether cuts came from an import or from the
weekly run's own backward pass.

The trade-off at the coupling boundary is one of consistency: the imported cuts
reflect the monthly run's stochastic model, its reservoir state discretization,
and its penalty structure. If the weekly run is configured with a materially
different inflow model or penalty cost, the imported cuts may be a looser
starting approximation than they would be under a consistent configuration.
Inconsistency does not cause infeasibility — the backward pass generates
corrective cuts — but it may require more iterations for the lower bound to
reach the convergence threshold.

For the full treatment of terminal boundary cuts, including the formal
lower-bound and convexity conditions, see [SDDP Algorithm](./sddp-algorithm.md)
§7 "Terminal Boundary Cuts".

## 3. Initial Conditions from Recent Observations

The PAR(p) inflow model propagates AR dynamics forward from the state at stage
0 — the lags $a_{h,-1}, a_{h,-2}, \ldots, a_{h,-p}$ that condition the
inflow distribution at the first stage of the run. For a monthly run starting
from January, these lags are the preceding months' inflows from the historical
record. For a weekly run starting mid-year, the corresponding lags are the
most recent weekly inflow observations from that same historical record.

**The idea**: rather than drawing the lag buffer from a stationary distribution
or defaulting to seasonal means, the weekly run is initialized from the most
recent inflow values available in the historical record before the study's
start date. This anchors the opening distribution of the weekly run to the
actual hydrological state at the moment the run is intended to represent —
a short-term planning run whose near-term scenarios should branch from current
conditions, not from a hypothetical long-run average.

**The mechanism**: the lag buffer at stage 0 is populated from the historical
inflow sequence. For a PAR model of order $p$, the buffer holds $p$ values per
hydro plant. The most recent observation fills lag 1; the observation one period
earlier fills lag 2; and so on back to lag $p$. The AR recursion then propagates
forward from these values at each stage of the weekly run.

**The knob**: the depth of the observation buffer is bounded by the AR model
order $p$, which is itself a per-hydro, per-season parameter fitted from
historical data (see [PAR Inflow Model](./par-inflow-model.md) §4). When the
historical record does not extend far enough back to fill all $p$ lags — for
example, when the study start date falls very close to the beginning of the
available history — earlier lags are filled from the seasonal mean, preserving
the AR structure while gracefully handling data gaps.

**The guarantee**: the AR dynamics at each stage of the weekly run are
consistent with the PAR model parameters. The recent-observation initialization
shifts the opening distribution of the inflow scenarios toward the current
hydrological state without altering the PAR model's fitted coefficients or the
noise scaling at any stage.

**The trade-off**: a weekly run initialized from recent observations is
conditioned on a specific point in time and cannot be interpreted as a
long-run average policy. It answers the question "what is the optimal dispatch
policy given current reservoir and inflow conditions?" rather than "what is the
long-run average optimal policy?" This distinction matters when comparing runs
across different initialization dates or when using the weekly run's output to
calibrate parameters of the upstream monthly model.

## 4. Variable Per-Stage Scenario Counts

The weekly run is a separate study with its own opening tree. It is not
constrained to use the same per-stage scenario count as the upstream monthly
run. In practice, short-horizon weekly runs often benefit from a denser
opening tree than the monthly run uses, because the weekly run is expected to
resolve uncertainty quickly across a small number of stages.

**The idea**: scenario counts per stage are configured independently for each
study. The opening tree of the weekly run determines how many scenarios branch
at each stage of the weekly horizon, independently of the monthly run's tree
structure. The two opening trees are coupled only through the terminal boundary
cuts — not through shared scenario paths.

**The knob**: the per-stage scenario count for each study is set in its
respective study configuration. The weekly run may use a uniform count across
all stages, a tapering count that is denser near stage 1 and coarser near the
terminal stage, or any other pattern that the scenario-generation configuration
supports. See [Scenario Generation](./scenario-generation.md) for the
complete treatment of per-stage scenario counts and the opening-tree structure.

**The guarantee**: the lower-bound monotonicity guarantee of the weekly run
is not affected by the scenario-count choice. The backward pass generates valid
Benders cuts regardless of how many scenarios branch at each stage. A denser
tree produces cuts that are more representative of the inflow distribution at
each stage, which may accelerate convergence, but even a sparse tree produces
valid cuts.

**The trade-off**: increasing the per-stage scenario count of the weekly run
increases the computational cost of each backward pass proportionally, while
improving the representativeness of the cuts generated. For a weekly run with
a small number of stages (typically 4–12), the absolute cost of a dense tree
is usually modest relative to the monthly run. The appropriate count is
determined by the convergence criterion and the available computation time.

## 5. Trade-offs: Coupling Tightness vs. Independence

The weekly+monthly coupled architecture occupies a point on a spectrum between
two extremes.

**Tight coupling** — the weekly run uses terminal boundary cuts from a monthly
run configured with the same inflow model, the same reservoir set, and the same
penalty costs — maximizes consistency. The imported cuts accurately represent
the value of stored water at the terminal stage of the weekly horizon, reducing
the number of backward-pass iterations needed to reach the convergence
threshold. The weekly run's policy reflects both the short-term hydrological
state (via recent observations) and the long-run value of water (via the
upstream cuts).

**Loose coupling** — running the weekly study with a default terminal condition
(zero cost-to-go or a flat terminal value) — decouples the weekly run entirely
from the upstream model. The weekly run can be executed without access to the
upstream run's output and requires no consistency between the two models. The
cost is that the weekly policy treats stored water at the terminal stage as
having zero or arbitrary value, which may lead to suboptimal discharge
decisions near the end of the weekly horizon.

**Partial coupling** — importing terminal cuts from a monthly run that differs
in some configuration details — lies between these extremes. The imported cuts
provide a useful starting approximation even when the two runs are not
perfectly consistent; the backward pass corrects residual inconsistencies over
iterations. The closer the two models are in their shared components (inflow
dynamics, reservoir set, penalty costs), the more accurate the imported cuts
are from the outset.

The coupling boundary is not symmetric. The upstream monthly run has no
dependency on the weekly run and can be executed and archived independently.
The weekly run depends on the monthly run's terminal output but does not feed
back into it. This one-directional dependency means that re-running the weekly
run with updated recent observations requires only the archived terminal cuts
from the monthly run — the monthly run itself need not be re-executed.

For horizon-mode semantics and the mechanics of how Cobre represents terminal
conditions across study boundaries, see
[Horizon Modes](./horizon-modes.md).

## Cross-References

- [PAR Inflow Model](./par-inflow-model.md) — AR lag accumulation; seasonal
  parameters; model order selection; the lag buffer that is seeded from recent
  observations at stage 0 of the weekly run
- [SDDP Algorithm](./sddp-algorithm.md) — Terminal boundary cut import
  (§7 "Terminal Boundary Cuts"); lower-bound monotonicity and the append-only
  property of the cut pool; the backward pass that generates corrective cuts
  after an import
- [Scenario Generation](./scenario-generation.md) — Per-stage scenario counts;
  opening-tree construction; the independent scenario tree used by the weekly
  run
- [Multi-Resolution Studies](./multi-resolution-studies.md) — The sibling
  chapter covering mixed-resolution stages within a single study; addresses
  duration-weighted aggregation rather than two-study coupling
- [Horizon Modes](./horizon-modes.md) — Finite vs cyclic policy graphs;
  context for how terminal conditions are represented at study boundaries
