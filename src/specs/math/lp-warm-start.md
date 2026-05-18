# LP Warm-Start

## Purpose

This chapter describes how Cobre reuses the LP basis from one solve at a
stage to accelerate the next solve at the same stage. The mechanism — called
the **backward-pass basis cache** — applies during the backward pass, where
many similar LPs are solved in sequence and a valid prior basis is almost
always available. This chapter does not cover forward-pass basis behaviour,
and it does not cover per-cut basis-status prediction for re-introduced cuts;
those topics are in [Warm-Start Basis Prediction](./warm-start-basis-prediction.md).

## 1. The Repeated-LP Problem

The [SDDP Algorithm](./sddp-algorithm.md) backward pass solves, at each
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
first solve of a training run (which necessarily cold-starts), and is
populated with a valid optimal basis from that point onward.

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
training run (see [Cut Management](./cut-management.md) for the append-only
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

Cut deactivation — relaxing a cut's bound to $-\infty$ during cut selection —
is treated as a bound change on an existing row rather than a structural
change to the constraint matrix. The basis index of each cut row is
preserved. When a cut is later reactivated, its row's bound is restored and
the solver resumes from the current cached basis with the reactivated
constraint.

## 4. Solver State Retention

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

## 5. Trade-offs

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

**Relationship to per-cut prediction.** The basis cache and the per-cut
prediction mechanism in [Warm-Start Basis Prediction](./warm-start-basis-prediction.md)
operate at different levels. The basis cache carries the full LP basis across
consecutive solves; it answers the question "where should the LP solver
start for the next complete LP solve at this stage?" The per-cut prediction
mechanism answers the narrower question "when a previously deactivated cut
is reintroduced, should that cut's row start as tight (LOWER) or slack
(BASIC) in the reconstructed basis?" The two mechanisms are complementary:
the basis cache provides the starting point for the retained rows; the
per-cut predictor fills in the status of rows that are new to the current
basis because they were absent during the previous solve.

**On/off control.** Basis caching can be disabled. With caching off, every
backward-pass LP solve cold-starts. This is useful for diagnostic purposes
— comparing cold-start and warm-start solve counts isolates the warm-start
contribution to training-run performance — and for tight-memory environments
where the memory cost of persistent solver state is unacceptable.

## Cross-References

- [Warm-Start Basis Prediction](./warm-start-basis-prediction.md) — The
  sister chapter; per-cut LOWER/BASIC prediction for re-introduced cuts.
  Complements the basis cache by handling rows that are new to the current
  basis after a deactivation/reactivation cycle.
- [Cut Management](./cut-management.md) — The append-only cut lifecycle that
  drives cache invalidation; cut deactivation mechanism and selection
  strategies that determine how frequently the cut pool changes.
- [SDDP Algorithm](./sddp-algorithm.md) — The iteration loop in which
  backward-pass basis caching occurs; forward and backward pass structure,
  per-stage solve ordering, and the synchronization barriers that separate
  stages.
