---
title: Post-Study Boundary
description: A terminal future-cost function imported from an upstream run, the two carried-state families held live to price against it, the β·x boundary-pricing mechanism, and the dated, hour-weighted fan-out that reconciles a source delivery calendar onto the study's own.
---

## 1. The Right Boundary

In finite (acyclic) horizon mode, the terminal future-cost function is zero by
default: no state carried past the last stage $T$ has any value in the model
(see [Horizon Modes §1](/math/horizon-modes)). A study may instead import a
terminal future-cost function trained by an upstream run — a **right
boundary**, in the sense that it prices the horizon from its far edge rather
than replacing a value at its near edge. The upstream run's terminal cuts are
injected as a fixed boundary condition at the study's own terminal stage,
replacing the zero terminal value with an already-informed continuation
value. This is the same terminal-boundary-cut mechanism
[SDDP Algorithm §7](/math/sddp-algorithm) and
[Weekly+Monthly Coupled Studies §2](/math/weekly-monthly-coupled-studies)
describe for the storage boundary; this chapter is about what a right
boundary additionally makes possible for state that would otherwise leave the
modelled system at the horizon edge instead of being priced.

A right boundary is anchored by a **post-study calendar segment** — a run of
stages that begins exactly where the study horizon ends and exists purely to
give a delivery or maturity deadline falling after $T$ a definite place on the
calendar. A post-study stage is never dispatched, never joins the study's own
stage chain, and never accumulates or carries a Benders cut of its own: it
contributes no LP subproblem and no backward pass. Its sole role is to let a
date past the horizon still resolve to a calendar position, so the
reconciliation in section 4 has somewhere to land. Whatever the post-study
segment "contains" is priced back onto the study's own terminal stage through
the imported cut — never solved in its own right.

## 2. Held-to-Terminal State

Two families of state would otherwise leave the modelled system at the
horizon edge instead of being carried forward and priced:

- **Post-horizon anticipated-commitment lanes.** An anticipated thermal may
  commit generation in-study whose delivery stage falls after $T$ (see
  [System Elements §4](/math/system-elements) and
  [LP Formulation §5c](/math/lp-formulation)). Absent a right boundary, a
  commitment whose delivery stage lies outside the horizon is pinned to
  zero — the plant is not permitted to make it, because there is nothing on
  the far side of the horizon to price it against.
- **Terminal deep-lag in-transit buckets.** Water released late enough in the
  horizon that its travel-time delay would carry it past $T$ is, absent a
  right boundary, dropped rather than credited to terminal storage (see
  [System Elements — Cascade Travel Time](/math/system-elements) and
  [LP Formulation §5d](/math/lp-formulation)). The deepest maturity lag
  reachable at each stage is capped so that no bucket ever points beyond the
  horizon.

A right boundary changes both defaults. Instead of being pinned to zero or
capped away, the post-horizon commitment lanes and the deep-lag buckets are
held live as genuine terminal state, carried into the terminal stage's
incoming-state vector exactly like storage or AR lags. Holding a family live
is what lets the boundary price it: a coordinate that has already been
pinned to zero or dropped before reaching the terminal stage leaves nothing
for a cut to act on.

```d2
direction: down

classes: {
  thermal: {style: {stroke: "#f5a623"}}
  hydro: {style: {stroke: "#4a90b8"}}
}

s1: "Stage 1"
sT: "Stage T\n(horizon end)"
boundary: "Terminal\nboundary" {shape: oval}

commit: "Anticipated\ncommitment" {class: thermal}
transit: "In-transit\nwater" {class: hydro}

s1 -> sT: "…"
s1 -> commit: "decided\nin-study"
sT -> transit: "release\nnear T"
commit -> boundary: "delivered,\npriced at boundary"
transit -> boundary: "matures\npast T"
```

The commitment lane and the in-transit bucket are carried by the same
ring-buffer and column-pinning machinery already used for their in-study
counterparts — a right boundary does not introduce a new state-carrying
mechanism. It only changes which lags and slots are permitted to survive to
the terminal stage rather than being capped or zeroed away before they get
there.

## 3. Boundary Pricing (`β·x`)

An imported terminal cut carries an intercept $\alpha$ and a coefficient
$\beta$ for every coordinate of the terminal incoming-state vector — one
entry per hydro storage, per AR lag, per in-transit bucket, and, once held
live by section 2, per post-horizon commitment lane. Each cut is the familiar
affine floor on the terminal future-cost variable,

$$
\theta \;\geq\; \alpha \;+\; \beta^{\top} x,
$$

evaluated through the same cut **row** every other Benders cut uses (see
[SDDP Algorithm §6](/math/sddp-algorithm) for the single-cut form). Because
the carried state is pinned by column bounds like any other incoming state,
the coordinate of $\beta$ paired with a held-live commitment lane or
in-transit bucket is read back the same way any cut coefficient is read
back — as the reduced cost of that pinned column — and the backward pass
propagates it to the deciding stage through the same ring-buffer remapping
[LP Formulation §5c](/math/lp-formulation) and
[§5d](/math/lp-formulation) already use for in-study lanes and buckets. A
right boundary does not add a second pricing mechanism; it supplies the
$\beta$ that the existing remapping had nothing to carry before the state was
held live.

Pricing the carried state through $\beta^{\top} x$ is deliberately kept
separate from pricing the fuel an anticipated commitment consumes. The
commitment's delivery-anchored fuel cost is booked on its own decision
column at the stage it is decided — the same commitment column priced
in-study (see the objective contributions in
[LP Formulation §5c](/math/lp-formulation)) — while $\beta \cdot x$ prices the
_state_ the commitment leaves behind in the carried lane. State valuation and
fuel booking are disjoint columns: one is a term in $\beta^{\top} x$ on the
pinned state column, the other is the commitment's own objective coefficient
on its decision column. Because no single column carries both roles, the two
compose without double-counting the same delivered energy — the same
discipline the in-study fishing and objective machinery already applies to
delivery inside the horizon.

## 4. Calendar Reconciliation (Fan-Out)

An upstream run's terminal state is expressed on its own calendar, which need
not share the current study's stage boundaries — a monthly source informing
a weekly or monthly study is the typical case. Loading the boundary therefore
reconciles the source's dated state onto the current study's own calendar
before any coefficient is used: every source month is distributed across the
study's own delivery windows in proportion to the hours each shares with it,
a **dated, hour-weighted fan-out**. A window that falls entirely inside a
single priced source month is a straight copy of that month's share; a
window straddling more than one source month, or straddling into a stretch
the source never priced, is renormalized over only the span the source
actually covers, so the fanned-out coefficient never overstates or
understates the value the source expresses.

The fan-out is produced once, at load, and its result is summarized rather
than left implicit: a **per-family reconciliation summary** reports, for
storage, for inflow lags, for in-transit buckets, and for anticipated
commitments, how many target coordinates were copied identically, how many
were fanned out across more than one source month, and how many had no
corresponding source information and were defaulted rather than guessed. The
summary is a load-time diagnostic, not a state variable — it exists so an
inconsistency between the source and current calendars is visible rather than
silently absorbed.

The reconciliation source is required to resolve to a **single leaf pool**:
the upstream run's terminal state must trace back to exactly one unambiguous
cut pool. A source whose matching terminal state is shared by more than one
scenario branch at the source's own terminal stage is rejected rather than
guessed at, because there is no principled way to prefer one sibling
branch's state over another's as _the_ boundary.

Within the fan-out, a delivery or maturity that falls past the study horizon
is decided by exactly one in-study stage — its **decider**. The decider's
position relative to the study's own last operative stage matters
conceptually, not just calendrically. A decider strictly before the last
operative stage is classified `Trunk`: one decision shared across every
branch of the terminal fan, because every scenario has already passed
through that stage by the time the decision is made. A decider that lands
exactly at the last operative stage is classified `TerminalFan` instead:
decided independently by each scenario, because at that point the scenarios
have not yet been forced back together. The distinction governs how a
post-horizon commitment is attributed for pricing — a `Trunk`-decided
commitment is one shared value the boundary prices once; a
`TerminalFan`-decided commitment is priced per scenario, matching the branch
that actually made it.

## Cross-References

- [LP Formulation](/math/lp-formulation) — §5c anticipated-thermal state
  pinning, fishing constraint, and cut subgradient remapping; §5d in-transit
  bucket state, pinning, and the horizon-limitation cap that a right boundary
  lifts.
- [System Elements](/math/system-elements) — §4 anticipated-thermal
  ring-buffer state and cascade travel time, the element-level source of the
  two carried families.
- [Weekly+Monthly Coupled Studies](/math/weekly-monthly-coupled-studies) —
  the storage-only terminal boundary cut import this chapter extends to
  delivery-side state.
- [Horizon Modes](/math/horizon-modes) — the zero terminal value a right
  boundary replaces, and the finite-horizon context the post-study segment
  attaches to.
