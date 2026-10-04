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
contributes no LP subproblem and no backward pass. Its role is to let a date
past the horizon resolve to a calendar position — so the reconciliation in
section 4 has somewhere to land — and, for an anticipated thermal, to declare
the capability and cost of a delivery there. Whatever the post-study segment
"contains" is priced back onto the study's own terminal stage through the
imported cut — never solved in its own right.

## 2. Held-to-Terminal State

Two families of state would otherwise leave the modelled system at the
horizon edge instead of being carried forward and priced:

- **Commitments delivered past the horizon.** A commitment decided in the
  study for a delivery stage after $T$ exists only when that delivery stage
  lies on the declared post-study calendar and the plant is in service there;
  it is then a genuine decision, bounded and costed by the post-study stage's
  declared capability and cost, and carried in its ring slot to the terminal
  stage (see
  [System Elements §4](/math/system-elements#anticipated-thermal-plants) and
  [LP Formulation — Ring Rows](/math/lp-formulation#ring-rows)). A delivery
  past $T$ outside that calendar has no decision. Without a loaded boundary
  the carried commitment has zero terminal value while its fuel is still
  charged on its decision column, and the study setup warns about it.
- **Terminal deep-lag in-transit buckets.** Water released late in the horizon
  may still be in transit at $T$ (see
  [System Elements — Cascade Travel Time](/math/system-elements#cascade-travel-time)).
  With a boundary loaded, every lag a stage's releases reach is held live to
  the terminal stage; without one, a lag that would mature past the horizon is
  capped away and its water is dropped (see
  [LP Formulation — Horizon limitation](/math/lp-formulation#horizon-limitation)).

The two families are gated differently: the post-study calendar decides
whether a post-horizon commitment is made, and the boundary decides whether a
deep-lag bucket survives to the terminal stage. A coordinate that reaches the
terminal stage is held live in the terminal stage's outgoing state, like
storage or AR lags, and the boundary prices it; a coordinate fixed at zero or
dropped before the terminal stage leaves nothing for a cut to act on.

The figure follows a commitment decided at stage $t$ for a post-study delivery
stage $m$. It is deposited into its ring slot at $t$, carried to the terminal
stage $T$ and valued there by the boundary cut through the slot's coefficient,
while its fuel is charged at $t$; the delivery stage $m$ itself lies on the
post-study calendar past the boundary. A commitment decided before the study
for a post-study stage holds no slot (the dashed path), and its state
contribution enters the boundary cut's intercept.

```d2
direction: down

classes: {
  thermal: {style: {stroke: "#f5a623"}}
}

decide: "stage t\ndecision, fuel charged" {class: thermal}
carry: "stage T\nring slot carried"
prestudy: "pre-study commitment\nno ring slot" {shape: parallelogram}
boundary: "terminal boundary" {shape: oval}
deliver: "post-study stage m\ndelivery" {class: thermal}

decide -> carry: "ring slot"
carry -> boundary: "cut coefficient"
prestudy -> boundary: "intercept" {style.stroke-dash: 4}
boundary -> deliver: "post-study calendar"
```

Both families are carried by the in-study state machinery — ring slots and
bucket columns, their incoming copies pinned by column bounds — and a right
boundary adds no state-carrying mechanism: for these two families it only
changes which bucket lags reach the terminal stage.

## 3. Boundary Pricing (`β·x`)

An imported terminal cut carries an intercept $\beta_0$ and a coefficient
$\beta$ for every coordinate of the terminal stage's outgoing state — one
entry per hydro storage, per AR lag, per in-transit bucket and per
commitment-ring slot. Each cut is the familiar affine floor on the terminal
future-cost variable,

$$
\theta \;\geq\; \beta_0 \;+\; \beta^{\top} x_T,
$$

evaluated through the same cut **row** every other Benders cut uses (see
[SDDP Algorithm §6](/math/sddp-algorithm) for the single-cut form). The
coefficient of a ring slot or a bucket multiplies the terminal stage's
outgoing column for that coordinate, which the commitment's deposit or carry
row, or the bucket's definition row, ties to the decision or release that
produced it
([LP Formulation — Ring-Slot Cut Coefficient](/math/lp-formulation#ring-slot-cut-coefficient)).
A right boundary adds no second pricing mechanism; it supplies the
coefficients of the state held live at the terminal stage.

Pricing the carried state through $\beta^{\top} x_T$ is deliberately kept
separate from pricing the fuel an anticipated commitment consumes. The fuel of
a post-horizon commitment is booked on its decision column at its decision
stage, at the post-study stage's declared cost and discounted from the
delivery stage
([LP Formulation — Objective contributions](/math/lp-formulation#objective-contributions);
[Discount Rate — Post-Study Extension](/math/discount-rate#post-study-extension)),
while $\beta^{\top} x_T$ prices the _state_ the commitment leaves behind in
its ring slot. State valuation and fuel booking are disjoint columns: one is a
term in $\beta^{\top} x_T$ on the outgoing slot column, the other is the
commitment's own objective coefficient on its decision column. Because no
single column carries both roles, the two compose without double-counting the
same delivered energy — the same discipline the in-study fishing and objective
machinery already applies to delivery inside the horizon.

A commitment decided **before the study** for a delivery past the horizon is
fixed: it has no decision column, no ring slot and no coordinate of $\beta$.
Its fuel is sunk and enters no objective. When a boundary is loaded
([Boundary Cuts](/running/policy-management/#boundary-cuts)), its state
contribution — the value the boundary cut assigns to the committed rate over
the source slots its delivery window overlaps, hour-weighted — is added once,
at load, to the intercept $\beta_0$ of every boundary cut; no coefficient
changes. With no boundary loaded it enters no term, and the study setup warns
about it when its committed rate is non-zero. Either way it is reported at its
real delivery date
([Output Format](/reference/output-format/#anticipatedfixed_deliveriesparquet)).

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

The source and the current study need not even model the **same set of state
coordinates**. A source trained without in-transit buckets, or with monthly
anticipated slots where the current study carries weekly ones, presents a
terminal state of a different shape. Reconciliation therefore matches each
target coordinate to the source **by entity identity and delivery date**, never
by position in the state vector: a storage coordinate binds to the same
reservoir, an anticipated slot to the same plant-and-delivery-date, an
in-transit bucket to the same arc-and-maturity. A source coordinate the current
study does not model has nowhere to land and is **dropped** — counted, per
family, in the reconciliation summary below rather than silently discarded —
and the load still succeeds **by default**. A differing state dimension is thus
not a rejection by default; only a coordinate the current study models but the
source cannot identify is defaulted rather than sourced. A stricter admission is
available that instead **rejects** a superset source — one pricing state the
current study does not model — rather than dropping and reporting it; see
[Compatibility requirements](/running/policy-management/#compatibility-requirements)
for how the software layer requires it.

The fan-out is produced once, at load, and its result is summarized rather
than left implicit: a **per-family reconciliation summary** reports, for
storage, for inflow lags, for in-transit buckets, and for anticipated
commitments, how many target coordinates were copied identically, how many
were fanned out across more than one source month, how many had no
corresponding source information and were defaulted rather than guessed, and
how many source coordinates the current study does not model and dropped. The
summary is a load-time diagnostic, not a state variable — it exists so an
inconsistency between the source and current state or calendars is visible
rather than silently absorbed.

The reconciliation source is required to resolve to a **single leaf pool**:
the upstream run's terminal state must trace back to exactly one unambiguous
cut pool. A source whose matching terminal state is shared by more than one
scenario branch at the source's own terminal stage is rejected rather than
guessed at, because there is no principled way to prefer one sibling
branch's state over another's as _the_ boundary.

A delivery past the horizon that the study decides has exactly one decision
stage $t_i(m)$
([LP Formulation §5c](/math/lp-formulation#5c-anticipated-thermal-dispatch)).
At that stage each scenario decides it like any other stage decision and
carries it in its ring slot to the terminal stage, and the boundary prices the
carried value through the boundary cuts of that scenario's terminal-stage LP.

## Cross-References

- [LP Formulation](/math/lp-formulation) — §5c the commitment ring (hold ring,
  ring rows, ring-slot cut coefficient, objective contributions); §5d
  in-transit bucket state, pinning, and the horizon-limitation cap that a
  right boundary lifts.
- [System Elements](/math/system-elements) — §4 the anticipated-thermal
  commitment ring and §5 cascade travel time, the element-level source of the
  two carried families.
- [Weekly+Monthly Coupled Studies](/math/weekly-monthly-coupled-studies) —
  the storage-only terminal boundary cut import this chapter extends to
  delivery-side state.
- [Horizon Modes](/math/horizon-modes) — the zero terminal value a right
  boundary replaces, and the finite-horizon context the post-study segment
  attaches to.
- [Discount Rate](/math/discount-rate) — the cumulative factor extended over
  the post-study stages.
