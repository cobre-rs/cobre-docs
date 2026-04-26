# Warm-Start Basis Prediction

## Purpose

This chapter describes how Cobre assigns an initial simplex basis status to each cut
when that cut re-enters the LP after a period of inactivity. The mechanism predicts
whether a re-introduced cut is likely to be tight or slack at the current trial point
by examining the cut's recent binding history, and sets the initial basis accordingly
so that the LP solver can warm-start rather than cold-start for that cut.

## 1. The Cut-Churn Problem

The SDDP backward pass adds one new cut per stage per iteration, and the cut selection
strategies described in [Cut Management](./cut-management.md) periodically deactivate
cuts that have not been binding. When a cut is deactivated, its row disappears from
the LP. When it is later reactivated, the LP solver has no record of the role this
cut played before: it cannot recover the basis status the cut held at the point of
deactivation.

Without a prediction, every reactivated cut begins in the BASIC position — the LP
solver treats it as slack, regardless of whether the cut is actually tight at the
current trial point. If the trial-point geometry has not changed much, the prediction
is wrong: the cut is tight, but the solver starts with it slack. The solver corrects
this by re-pivoting, which adds simplex iterations on top of the warm-start that
would otherwise have been sufficient.

This extra pivot work accumulates across stages and iterations whenever the cut pool
fluctuates. The faster the cut set turns over — and cut selection is designed to
turn it over — the more frequently the cold-start penalty appears.

## 2. Activity-Window Classifier

Cobre predicts each reactivated cut's initial basis status from a fixed-length window
of its most recent binding observations. The window records, for each of the last $w$
iterations, whether the cut was binding at the trial point used during that iteration.

The prediction rule is a majority vote over the window:

- If the cut was binding in more than half of the recorded iterations, it is
  predicted to be tight again, and its initial basis status is set to **LOWER**
  (the row is at its lower bound, meaning the cut is active in the LP sense).
- If the cut was not binding in more than half of the recorded iterations, it is
  predicted to remain slack, and its initial basis status is set to **BASIC**
  (the row is treated as non-binding, and the LP solver starts with it inactive).

A cut that enters the LP for the first time — with no prior activity recorded in
the window — starts BASIC. This is the conservative choice: a brand-new cut has no
history to predict from, and the LP solver will promote it to LOWER in the next
solve if it turns out to be tight.

The window contains only the most recent $w$ iterations. Older observations are
discarded automatically as the window advances, so the prediction always reflects
the cut's behaviour under the current region of the state space rather than under
trial points from the distant past.

## 3. The `basis_activity_window` Knob

The window length $w$ is controlled by the `basis_activity_window` configuration
parameter.

| Parameter               | Range  | Default |
| ----------------------- | ------ | ------- |
| `basis_activity_window` | 1..=31 | 5       |

**Boundary values**:

- $w = 1$: The prediction is based solely on the most recent iteration. The
  classifier responds instantly to any change in the trial-point geometry but is
  sensitive to single-iteration noise — one anomalous solve can flip the
  prediction for every cut in the pool.
- $w = 31$: The prediction draws on the longest practical window. The classifier
  is stable against individual-iteration fluctuations but requires 31 iterations
  of consistent behaviour before it can respond to a genuine shift in the
  active-cut structure.

Values in the middle range, such as the default of 5, give the classifier enough
observations to smooth over single-iteration variation while remaining responsive
to trends that develop over a handful of iterations.

## 4. Guarantee and Conditions

When the trial-point geometry evolves gradually — as is typical in the middle and
late phases of a training run, when the lower-bound estimate has nearly converged —
the activity-window classifier tends to be correct for most cuts on most iterations.
Correctly predicting LOWER for a tight cut and BASIC for a slack cut means the LP
solver starts in the right basis for those rows, eliminating the re-pivot work that
would otherwise be needed.

The mechanism reduces the expected number of simplex iterations per warm-started
backward-pass solve under these conditions. Cobre does not promise a specific
iteration-count reduction or a wall-clock speedup; the benefit depends on how
stable the trial-point geometry is and on how aggressively the cut selection
strategy turns the pool over.

The prediction provides no benefit in two identifiable situations:

- **Cold starts after the first iteration**: Cuts added during the very first
  backward pass have no activity history. They all begin BASIC and are promoted
  only if the first solve confirms them as tight. This is unavoidable and
  inconsequential because warm-starting is not expected to help at iteration 1
  regardless.
- **Regime changes**: If the trial points shift sharply — for example, because a
  large number of new cuts changes the LP geometry abruptly — the activity window
  reflects a region of state space that no longer describes the current one. In
  this case the predictions may be systematically wrong until the window catches up
  to the new regime, temporarily increasing rather than decreasing simplex
  iterations.

Both cases are self-correcting: the LP solver reaches the correct optimal basis
regardless of the starting prediction, and the window begins updating immediately.

## 5. Trade-off

The window length trades off responsiveness against stability:

**Short windows** (small $w$) track the current trial-point geometry closely.
If the active-cut structure shifts — because new, tighter cuts are generated or
because the forward pass is sampling a different region of the state space — a
short window adjusts the predictions within a few iterations. The cost is
sensitivity to noise: a single iteration where cut activity is atypical can
cause the classifier to reverse its predictions for many cuts simultaneously.

**Long windows** (large $w$) produce stable predictions that are difficult to
perturb by individual iterations. The cost is lag: a genuine shift in the
active-cut structure takes up to $w$ iterations to register in the majority vote.
During that lag the predictions may be systematically misaligned with the current
geometry.

The default value of 5 was chosen to balance these two effects at the scale of a
typical training run. Studies with unusually high cut turnover — such as those using
aggressive LML1 selection with a short memory window — may benefit from reducing
$w$ to 2 or 3. Studies with very stable cut pools may benefit from a longer window.

The interaction with the cut selection strategy is deliberate: [Cut Management](./cut-management.md)
controls how rapidly the cut pool changes; this chapter's mechanism controls how
quickly the basis predictor adapts to those changes. The two knobs operate on the
same underlying phenomenon from opposite sides.

## Cross-References

- [Cut Management](./cut-management.md) — Cut activity, the binding condition, and
  the deactivation mechanism that this chapter's classifier consumes; cut selection
  strategies that drive cut-pool churn.
- [LP Warm-Start](./lp-warm-start.md) — Backward-pass basis caching across
  iterations; the sister chapter covering how Cobre carries a full LP basis
  between solves, as distinct from per-cut status prediction.
- [SDDP Algorithm](./sddp-algorithm.md) — The iteration loop in which warm-starting
  occurs; forward and backward pass structure that determines when cuts are added,
  evaluated, and reactivated.
