---
title: LP Warm-Start
description: Per-stage basis caching and cut-aware basis reconstruction by slot identity — how Cobre reuses LP bases to accelerate backward-pass solves.
---

## Purpose

This chapter describes how Cobre reuses an LP basis to accelerate solves.
Two related mechanisms are covered. The **backward-pass basis cache** carries
an optimal basis between consecutive solves at the same stage during a run,
where many similar LPs are solved in sequence and a valid prior basis is almost
always available. **Cut-aware basis reconstruction by slot identity** maps a
stored basis onto a cut pool that has churned through cut selection, and is
also what lets a warm-start or resume run reconstruct the checkpoint basis from
a saved policy. This chapter does not cover forward-pass basis behaviour beyond
what these mechanisms require.

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

## 2. Per-Stage Basis Cache

Cobre maintains one basis cache per stage. At the end of each backward-pass
LP solve at stage $t$, the solver's optimal basis — the partition of variables
and constraints into basic and non-basic — is saved into the stage-$t$ cache,
replacing whatever was there before.

At the start of the next solve at stage $t$, the cached basis is loaded and
supplied to the LP solver as the starting point. The cache is seeded on the
first solve of a fresh training run (which necessarily cold-starts), and is
populated with a valid optimal basis from that point onward. A **warm-start or
resume run is the exception**: it loads a saved policy whose stored LP bases
seed the cache up front, so even the first training iteration warm-starts — by
reconstructing the checkpoint basis (§4) — rather than cold-starting. The same
checkpoint reconstruction also speeds up simulation-only (`cobre simulate`)
runs.

The cache is per-stage rather than per-opening. The backward pass solves
multiple openings at each stage per trial point; the cache is updated at the
end of each opening solve and used at the start of the next opening solve at
the same stage. This means the warm-starting basis is always the most recent
optimal basis from the same stage, not necessarily from the same opening or
the same trial point.

The same cache carries across iterations. The basis saved at the end of
iteration $k$'s backward pass at stage $t$ seeds the first opening of
iteration $k+1$'s backward pass at stage $t$. The solver instance for each
stage persists across the iteration loop rather than being recreated per
solve; the basis persists with it.

## 3. Cache Invalidation

The basis cache becomes invalid when the LP at stage $t$ changes in a way
that is incompatible with the cached basis. The relevant change is cut-set
growth: each iteration adds one new cut to every stage's LP. Cut growth is
strictly append-only — Cobre never removes a cut from the LP within a
training run (see [Cut Management](/math/cut-management) for the append-only
monotonicity guarantee). A new cut adds one constraint row to the LP.

Adding a row to a previously solved LP does not in general destroy the
feasibility of the cached basis for the remaining rows; the newly added cut
may be satisfied at the cached basis point, in which case the old basis
remains dual-feasible. If the new cut is violated at the cached basis point,
the solver performs a bounded number of additional dual simplex pivots to
restore feasibility, starting from the warm basis rather than from cold.

The key observation is that cut growth is monotone: rows are only ever added,
never removed or reordered. This means the structural relationship between
consecutive LP instances is predictable — the new LP is a proper extension of
the previous one — and warm starting from a prior basis is always at least as
good as cold starting, never worse in terms of feasibility of the retained
rows.

Cut deactivation — toggling a cut row's bound to a trivially-satisfied
$\pm\infty$ sentinel during cut selection — is treated as a bound change on an
existing row rather than a structural change to the constraint matrix. The
cut's stable slot, and hence its row identity, is preserved. When a cut is
later reactivated, its row's bound is restored and the solver resumes from the
current cached basis with the reactivated constraint.

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
  basic cut rows to non-basic until the invariant holds. The obligation is
  one-sided — reconstruction can only ever leave an excess, never a deficit.

This single mechanism handles all three churn cases — drops, reorders, and
additions — and serves both within-run reactivation and the cross-run
checkpoint reconstruction used on warm-start/resume (§2). Because
reconstruction keys purely on slot identity, a re-introduced cut's basis
status is determined wholly by that identity — there is no configurable
activity-window prediction of its LOWER-vs-BASIC status.

## 5. Solver State Retention

The LP warm-start mechanism rests on a deliberate policy: solver instances
at each stage are not destroyed and recreated between solves. The solver
retains all LP data — the constraint matrix, the objective, the variable
bounds, and the current basis — across the full backward pass of an
iteration and across successive iterations.

This retention policy has a direct consequence for memory: each stage's
solver instance holds the LP in full, including the complete cut set
accumulated so far, for the lifetime of the training run. The memory cost of
solver state grows with the number of cuts added and the size of the stage LP.

Two aspects of solver state are worth noting from a methodology perspective:

- **Basis state** is the information that directly enables warm-starting: the
  partition of the LP into basic and non-basic variables and constraints.
  Basis state is the quantity written to and read from the per-stage cache
  on each solve.
- **LP structural state** includes the constraint matrix, objective, and
  bounds. Structural state persists across solves; new cuts are appended
  incrementally rather than rebuilding the full LP from scratch each
  iteration.

The combination of persistent structural state and a warm basis means that
the marginal cost of a backward-pass LP solve after the first iteration is
dominated by the dual simplex work needed to restore optimality after
incorporating the new cut, rather than by LP construction or Phase-I
feasibility work.

## 6. Trade-offs

**Memory versus simplex savings.** Each stage's solver instance holds the
full LP in memory for the duration of the training run. For a study with
many stages and a large state-variable count, the total memory footprint of
all solver instances can be significant. Cobre exposes configuration controls
to limit per-stage memory budget; engaging these controls may cause the
solver to evict cached basis state and cold-start certain solves, trading
memory for increased simplex work.

**Warm-start benefit degrades with LP change magnitude.** The cached basis is
most valuable when consecutive LP instances are nearly identical. Early in a
training run, when the cut set is growing rapidly and each new cut can shift
the active face of the optimal basis substantially, warm-starting provides
smaller savings than in the middle and late phases of training when the cut
set has largely stabilized and new cuts make only incremental changes to the
LP geometry.

**Relationship to cut-aware reconstruction.** The basis cache and the
reconstruction of §4 operate at different levels. The cache carries the full
LP basis across consecutive solves at a stage; it answers "where should the
solver start for the next complete solve at this stage?" Reconstruction answers
the narrower question that arises when the cut set has changed between the
stored basis and the current LP: "which stored row statuses still apply, and
what status should rows new to this basis take?" The cache provides the
starting point for retained rows; reconstruction fills in the status of cut
rows that are new to the current basis — those whose slot was absent from the
stored basis — defaulting them to BASIC.

**On/off control.** Basis caching can be disabled. With caching off, every
backward-pass LP solve cold-starts. This is useful for diagnostic purposes
— comparing cold-start and warm-start solve counts isolates the warm-start
contribution to training-run performance — and for tight-memory environments
where the memory cost of persistent solver state is unacceptable.

## Cross-References

- [Cut Management](/math/cut-management) — The append-only cut lifecycle with
  stable slot indices that drives cache invalidation and underpins slot-identity
  reconstruction; cut deactivation mechanism and selection strategies that
  determine how frequently the cut pool changes.
- [SDDP Algorithm](/math/sddp-algorithm) — The iteration loop in which
  backward-pass basis caching occurs; forward and backward pass structure,
  per-stage solve ordering, and the synchronization barriers that separate
  stages.
