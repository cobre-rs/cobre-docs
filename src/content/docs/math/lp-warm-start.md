---
title: LP Warm-Start
description: Per-(scenario, stage) basis caching and cut-aware basis reconstruction by slot identity — how Cobre reuses LP bases to accelerate backward-pass solves.
---

## Purpose

This chapter describes how Cobre reuses an LP basis to accelerate solves.
Two related mechanisms are covered. The **per-(scenario, stage) basis cache**
holds one captured basis per trial point per stage and supplies it as the warm
start when that subproblem is solved again; because the backward pass resets and
reloads each stage's frozen LP template per trial point rather than keeping a
live LP resident, it is this cache — a data structure, not a persistent solver —
that carries a good basis from one solve to the next. **Cut-aware basis
reconstruction by slot identity** maps a stored basis onto a cut pool whose
active set has churned through cut selection, which is what lets a reused basis —
whether a within-run capture or the checkpoint basis a warm-start or resume run
loads from a saved policy — align to the current LP. This chapter does not cover
forward-pass basis behaviour beyond what these mechanisms require.

## 1. The Repeated-LP Problem

The [SDDP Algorithm](/math/sddp-algorithm) backward pass solves, at each
stage, one LP per opening per trial point per iteration. Across a training
run these LPs are not independent: the LP at stage $t$ in iteration $k+1$
differs from the LP at stage $t$ in iteration $k$ only in two ways — the cut
set has grown by the cuts added during iteration $k$, and the trial point may
have shifted. The constraint matrix columns, the objective, the bounds, and
the majority of constraint rows are identical between consecutive iterations.

A **cold start** discards this structural similarity. The LP solver begins
from scratch each time, choosing an initial basis by its own heuristic
(typically Phase-I primal feasibility). On a well-structured LP this wastes
simplex pivots whose only purpose is to rediscover a basis that was already
known.

A **warm start** avoids this waste by supplying the solver with the basis
from a previous solve at the same stage. The solver checks whether the
supplied basis is primal feasible, dual feasible, or both for the new LP; if
it is, it can proceed immediately to optimality iterations rather than
rebuilding feasibility from scratch. The benefit is proportional to how
similar consecutive LPs are — and in the SDDP backward pass, consecutive
solves at the same stage are very similar.

## 2. Per-(Scenario, Stage) Basis Cache

Cobre maintains a basis cache keyed by `(scenario, stage)`, not one cache per
stage. The store holds at most one captured basis for each trial point at each
stage — the partition of variables and constraints into basic and non-basic —
and workers read from and write to it by that key.

The backward pass does not continuously mutate a single resident LP per stage.
Each backward work unit is a chain of one trial point's openings at a stage: it
resets the solver's retained basis and factorization and reloads the stage's
frozen LP template, then appends the iteration's new cuts. Warm-starting is then
supplied at exactly one point in the chain — its **first-solved opening**, where
the basis stored for that trial point's `(scenario, stage)` slot is loaded as
the starting point. The remaining openings do not reload from the store; they
warm-continue from the factorization the previous opening left in place, since
within the chain only the noise-dependent bounds change while the LP structure
is fixed.

The cache is seeded on the first solve of a fresh training run, which
necessarily cold-starts, and is populated with a valid optimal basis from that
point onward. A **warm-start or resume run is the exception**: it loads a saved
policy whose stored LP bases seed the cache up front, so even the first training
iteration warm-starts — by reconstructing the checkpoint basis (§4) — rather
than cold-starting. The same checkpoint reconstruction also speeds up
simulation-only (`cobre simulate`) runs.

Because warm-starting is confined to the first-solved opening, the basis a
solve begins from is a function of the order in which the trial point's openings
are chained, not of opening index or trial-point order. That chaining order is
fixed in advance rather than incidental: it determines which basis each solve
begins from, and bit-identical reproducibility depends on its being predetermined
and rank-invariant. It does not, however, affect the validity of any cut
produced. Each opening's optimal value is fixed by its own realization and the
trial state alone, and each opening's cut is recorded under that opening's own
canonical identity rather than under its position in the chain, so every cut is a
valid support of the value function wherever the chain happens to start it. The
mechanism by which a pinned chain makes the terminating bases — and therefore,
at a degenerate optimum, the cut coefficients — reproducible is set out in
[Determinism Guarantees §3 (Methodology Mechanisms)](/math/determinism-guarantees#3-methodology-mechanisms).

The store carries across iterations. The basis captured for a `(scenario, stage)`
slot during one iteration seeds that same slot's first-solved opening in the
next iteration's backward pass. Cross-iteration continuity is therefore carried
by the cache: each work unit resets the solver's retained state and reloads the
frozen template before solving, so it is the persisted `(scenario, stage)` basis
— not a solver left running in place — that links one iteration's solves to the
next.

## 3. Cache Invalidation

The basis cache becomes invalid when the LP at stage $t$ changes in a way
that is incompatible with the cached basis. The relevant change is cut-set
growth: each iteration adds one new cut to every stage's LP. Cut growth is
strictly append-only — Cobre never removes an active cut from the LP within a
training run (see [Cut Management](/math/cut-management) for the append-only
monotonicity guarantee). A new cut adds one constraint row to the LP.

Adding a row to a previously solved LP does not in general destroy the
feasibility of the cached basis for the remaining rows; the newly added cut
may be satisfied at the cached basis point, in which case the old basis
remains dual-feasible. If the new cut is violated at the cached basis point,
the solver performs a bounded number of additional dual simplex pivots to
restore feasibility, starting from the warm basis rather than from cold.

When cut selection leaves the active set untouched, this growth is purely
monotone: rows are only ever added, never removed or reordered. The structural
relationship between consecutive LP instances is then predictable — the new LP
is a proper extension of the previous one — and warm-starting from a prior basis
is at least as good as cold-starting, never worse in the feasibility of the
retained rows. Cut selection can break that pure-append case, which the next
paragraph turns to.

Cut deactivation follows a different route on the backward-pass solve path. A
deactivated cut is **excluded from the rebaked frozen template** rather than
left in place with a relaxed bound: at the LP level its row is dropped, not
merely slackened, so the active cut set can shrink and reorder from one
iteration to the next, not only grow. The cut is not lost — its stable slot is
retained in the append-only pool, and reactivation re-bakes the cut at that same
slot. Because the active set can change this way, a stored basis cannot be
replayed by row position; the slot-identity reconstruction of §4 reconciles it
to the current active set, which is what keeps warm-starting valid across
deactivation and reactivation. See [Cut Management](/math/cut-management) for the
full deactivation mechanism, including the separate persistent-lower-bound-LP
route that instead toggles a $\pm\infty$ sentinel.

## 4. Cut-Aware Basis Reconstruction by Slot Identity

Cut selection (see [Cut Management](/math/cut-management)) deactivates,
reactivates, and appends cuts between solves, so the set of active cut rows in
the stage LP **churns** from one iteration to the next. A stored basis records
a status for each row it contained; if those statuses were replayed by row
position, a churned cut set of the same length would misalign — and the solver
would warm-start from a corrupted basis or fall back to a cold start.

Cobre avoids this by reconciling on **slot identity**, not position. The cut
pool assigns every cut a stable slot index (see [Cut Management §5](/math/cut-management)),
and a stored basis carries, for each cut row it held, the pool slot that
generated it. To reconstruct a basis for the current LP:

- The non-cut (template) row statuses and all column statuses are copied
  directly.
- Each current cut row is matched to the stored basis **by its slot**. If the
  slot was present in the stored basis, its saved status is reused; if the slot
  is new — a cut that did not exist when the basis was captured — the row is set
  **BASIC** (slack), the conservative default that costs at most a re-pivot if
  the cut turns out to be tight.
- Setting new cut rows BASIC preserves the solver's basis-count invariant by
  construction (each new cut adds exactly one row and one basic entry). When
  selection instead _drops_ a previously-basic cut, the reconstructed basis can
  carry an excess of basic rows; a final pass demotes the trailing excess of
  basic cut rows to non-basic until the invariant holds. Under the
  reconstruction's premises — a stored basis captured against the same LP
  shape — the obligation is one-sided: reconstruction can only ever leave an
  excess. A basic-count **deficit** therefore proves the stored basis was
  captured against a differently-shaped LP; it is rejected with a named error
  reporting the basic-count arithmetic, identically on either solver backend —
  never repaired, since demotion cannot create the missing basics and
  promotion would fabricate a basis the stored one never described.

This single mechanism handles all three churn cases — drops, reorders, and
additions — and serves both within-run reactivation and the cross-run
checkpoint reconstruction used on warm-start/resume (§2).

:::note[Basis status is not predicted]
Basis reconstruction keys purely on slot identity, so a re-introduced cut's
basis status (LOWER vs BASIC) is not predicted from a fixed-length window of
its recent binding history. The resulting basis is fully determined by slot
identity, with no activity-window heuristic in play.
:::

## 5. What Persists Across Solves

Warm-starting does not rest on a resident per-stage solver that holds each
stage's LP for the lifetime of the run. Each backward work unit resets the
solver's retained state and reloads the stage's frozen LP template before
solving, so what carries information from one solve to the next is not a live
solver but two persistent data structures:

- The **per-(scenario, stage) basis cache**, which stores one captured basis per
  trial point per stage — the partition of the LP into basic and non-basic
  variables and constraints. This is the quantity that enables warm-starting: it
  is read when a subproblem is first solved and refreshed when a fresh optimal
  basis is captured for that `(scenario, stage)` slot.
- The **per-iteration frozen stage templates**, each of which bakes in the
  currently-active cut set. A template is built once per iteration for a stage
  and loaded into the solver afresh for every trial point that stage serves;
  within a trial point's chain only the noise-dependent bounds then change.

Because the template is reloaded rather than mutated in place, LP structural
state does not accrue silently inside a long-lived solver. Its size still grows
over a run — each iteration's template bakes in more cuts than the last — so the
memory devoted to the stage templates and to the basis cache grows with the
accumulated cut set and the size of the stage LP.

The combination of a reloaded template and a warm basis means that the marginal
cost of a backward-pass LP solve after the first iteration is dominated by the
dual simplex work needed to restore optimality once the reused basis has been
reconciled to the current cut set (§4), rather than by Phase-I feasibility work
from a cold start.

## 6. Trade-offs

**Memory versus simplex savings.** The memory a warm-started run devotes to LP
state grows over training, but not because a per-stage solver holds each LP for
the run's lifetime — no such resident solver exists. The growth comes from two
persistent structures: each stage's frozen template bakes in an ever-larger
active cut set as iterations accumulate, and the `(scenario, stage)` basis cache
stores one basis per trial point per stage. For a study with many stages and a
large state-variable count, their combined footprint can be significant.

**Warm-start benefit degrades with LP change magnitude.** The cached basis is
most valuable when consecutive LP instances are nearly identical. Early in a
training run, when the cut set is growing rapidly and each new cut can shift
the active face of the optimal basis substantially, warm-starting provides
smaller savings than in the middle and late phases of training when the cut
set has largely stabilized and new cuts make only incremental changes to the
LP geometry.

**Relationship to cut-aware reconstruction.** The basis cache and the
reconstruction of §4 answer different questions. The cache answers "which stored
basis should seed this `(scenario, stage)` subproblem's first solve?" — supplying
a basis captured for that same slot. Reconstruction answers the narrower question
that arises because the active cut set baked into the current template may have
churned since that basis was captured: "which stored row statuses still apply,
and what status should cut rows new to this LP take?" The cache provides the
starting point; reconstruction reconciles it to the current cut set by slot
identity, defaulting cut rows with no stored slot to BASIC.

**On/off control.** Warm-starting can be disabled, forcing every backward-pass
LP solve to cold-start. This is useful for diagnostic purposes — comparing
cold-start and warm-start solve counts isolates the warm-start contribution to
training-run performance — and for tight-memory environments where retaining the
basis cache is not worthwhile.

## Cross-References

- [Cut Management](/math/cut-management) — The append-only cut lifecycle with
  stable slot indices that drives cache invalidation and underpins slot-identity
  reconstruction; cut deactivation mechanism and selection strategies that
  determine how frequently the cut pool changes.
- [SDDP Algorithm](/math/sddp-algorithm) — The iteration loop in which
  backward-pass basis caching occurs; forward and backward pass structure,
  how each stage's openings are visited, and the synchronization barriers
  that separate stages.
- [Determinism Guarantees](/math/determinism-guarantees) — The deterministic
  pinning of the chain order described in
  [Determinism Guarantees §3 (Methodology Mechanisms)](/math/determinism-guarantees#3-methodology-mechanisms),
  which is what keeps warm-starting compatible with bit-identical
  reproducibility across runs.
