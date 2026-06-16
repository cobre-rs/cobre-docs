# Determinism Guarantees

## Purpose

This chapter defines what "deterministic" means in Cobre. The guarantee is
bit-identical outputs: given the same inputs, the same random seed, the same
MPI topology, and hardware that conforms to IEEE 754, every Cobre run produces
the same lower bounds, the same cuts, the same trial-point trajectories, the
same simulation costs, and the same scenario tree — byte for byte.

This property is not incidental to the implementation. It is an explicit
methodology commitment, achieved through five coordinated mechanisms described
in section 3. The companion chapter [Reproducibility and Provenance](./reproducibility-and-provenance.md)
defines the bookkeeping that makes this commitment actionable: what Cobre
records so that any run can be independently re-derived.

## 1. Definition

Cobre guarantees **bit-identical results** across the three axes that
practitioners most often vary:

- **Re-runs at identical inputs.** Running the same study twice, on the same
  machine, with the same configuration and the same base seed, produces
  output values that are identical to the last bit.
- **MPI topology changes.** Distributing the same study across a different
  number of ranks — or re-ordering ranks — does not change the computed lower
  bounds, cuts, trial points, or simulation costs. The same answer is reached
  regardless of how work is partitioned.
- **Hardware variants within IEEE 754 conformance.** On any hardware that
  implements the IEEE 754-2008 standard faithfully, Cobre produces identical
  results for the same inputs. Compiler-driven floating-point reorderings and
  wall-clock variation are out of scope (section 4).

The definition applies to the full SDDP output corpus: training produces the
same lower bounds at every iteration, the same cut coefficients appended to the
cut pool in the same order, and the same forward-pass trial points; simulation
produces the same expected cost and the same per-scenario cost paths; scenario
tree generation produces the same noise vectors for every (stage, opening index)
pair.

## 2. Scope

**Training.** The forward pass visits the same trial-point trajectories in the
same order; the backward pass solves the same subproblems for the same scenarios
and stages; the resulting cuts have the same coefficients and occupy the same
deterministic slot in the cut pool (a fixed function of the iteration and
forward-pass index). The lower-bound sequence at every iteration is
identical across runs.

**Simulation.** The simulation phase evaluates the trained policy on the same
set of scenarios regardless of rank assignment. Per-scenario costs and the
aggregate expected cost are identical across runs.

**Scenario-tree generation.** The opening tree is generated before training
begins by deriving one seed per (opening index, stage) pair from the base seed.
Because the derivation depends only on globally known constants, every MPI rank
generates the same tree bit-identically. See [Scenario Generation](./scenario-generation.md)
for the seed derivation procedure and opening-tree construction.

**Out of scope.** Wall-clock time, peak memory, and compiler-optimisation-driven
floating-point reorderings within a single hardware target are not covered by
this guarantee. These are addressed in section 4.

## 3. Methodology Mechanisms

Five coordinated design decisions make the guarantee achievable across all three
axes.

**LP model reloaded per scenario and per trial point.** Each subproblem solve
uses a freshly constructed LP model. No internal solver state — basis warmth
aside, which is handled separately — carries over from one solve call to the
next. The result of solving the subproblem for scenario $\omega$ at trial state
$\hat{x}$ is therefore a function of those inputs alone and is independent of
what order the solver was previously called in or on which rank the call was
issued. See [LP Formulation](./lp-formulation.md) for the column and row layout
that this construction produces.

**Total ordering on floating-point comparisons.** In all sort and selection
paths on the hot forward and backward pass loops, Cobre compares floating-point
values using a total ordering, not the IEEE 754 partial order. The IEEE 754
partial order leaves NaN comparisons undefined; a total ordering assigns a
deterministic position to every representable value, including NaNs. This
eliminates the class of non-determinism that arises when NaN-producing arithmetic
interacts with sort algorithms or maximum-selection routines.

**Global sample counts, not per-rank counts.** Any decision that depends on the
number of scenarios processed — such as a convergence check or a cut-selection
trigger — is evaluated against a globally aggregated count, not a count local to
the calling rank. The same threshold is therefore reached at the same iteration
regardless of how scenarios are distributed across ranks, ensuring that all ranks
reach the same algorithmic decisions at the same time.

**Deterministic seed derivation across MPI ranks.** Each noise vector is
produced by a pseudo-random number generator seeded from a value derived
deterministically from the base seed and the tuple that identifies the noise:
(base seed, iteration, scenario, stage) for the forward pass, and (base seed,
opening index, stage) for the opening tree. Because the derivation uses only
globally known constants and an identical deterministic hash, every rank
independently computes the same seed for any given tuple without communicating.
There are no broadcast races, no per-rank entropy, and no dependence on MPI
message ordering. See [Scenario Generation](./scenario-generation.md) for
the hash input encoding and the little-endian byte layout that ensures
cross-platform stability.

**Order-independent parallel cut selection.** Cut selection evaluates every cut
at every visited trial point and decides survival per cut. The trial points are
partitioned into fixed-size blocks processed in parallel; each block produces a
survival bitmap, and the bitmaps are combined by a bitwise OR. Because set union
is commutative and associative, the selected cut set is identical regardless of
how the blocks are distributed across threads or how many threads run — a
single-threaded run and a fully parallel run produce the same deactivations and
reactivations. The deterministic cut-pool slot index closes the loop: the
tie-break that keeps the _oldest_ cut at a state (LML1) resolves to the same
cut in every run, because each cut occupies the same slot in every run.

The same discipline extends to **dynamic cut selection (DCS)**, which chooses a
per-solve resident subset of cuts rather than deactivating any. The resident set
is seeded from synchronized per-slot pool metadata (not per-worker solve traces),
the omitted-cut violation scores come from a bit-deterministic batched product,
and the order in which violated cuts are added is fixed by a total ordering on
violation magnitude with an ascending-slot-index tie-break. The resident set —
and therefore the solve result — is consequently identical across thread and MPI
rank counts. See [Cut Management](./cut-management.md).

## 4. Out of Scope

**Wall-clock time and peak memory.** Cobre makes no claims about the time taken
or the memory consumed across runs, even at identical inputs. These quantities
are functions of hardware load, OS scheduling, memory allocator behaviour, and
MPI library implementation — none of which are under Cobre's control.

**Compiler-optimisation-driven floating-point reorderings within a single
hardware target.** The IEEE 754 standard allows implementations to fuse multiply-
add operations and, under `-ffast-math` or equivalent flags, to reassociate
floating-point additions. Cobre does not use relaxed floating-point flags on
production builds, so this source of variation is suppressed in practice. The
determinism guarantee nonetheless applies only to builds with identical compiler
flags and compiler versions targeting the same hardware. Moving to a different
compiler version, a different optimisation level, or a different target
architecture is not guaranteed to preserve bit-identical results.

**Cross-platform binary equality of output files.** Timestamps, schema-version
fields, and file-format padding may differ across platforms and library versions.
The guarantee covers the numerical content of the outputs, not the raw bytes of
the output files. Independent re-derivation of numerical content is the subject
of [Reproducibility and Provenance](./reproducibility-and-provenance.md).

## 5. Pairing with Provenance

Determinism is the algorithmic property; provenance is the bookkeeping that
makes it actionable. Knowing that Cobre is deterministic is useful only if the
inputs that determine the output are themselves recorded. The companion chapter
[Reproducibility and Provenance](./reproducibility-and-provenance.md) defines
what Cobre records — input fingerprints, random-seed lineage, solver and library
identifiers, and execution topology — and what that recording enables: independent
re-derivation of cuts and policy, audit trails for regulatory or scientific
reporting, and diff-of-runs analysis. The sharp boundary between the two
chapters is intentional: this chapter proves the property exists; the companion
chapter proves it can be exercised.

## Cross-References

- [Scenario Generation](./scenario-generation.md) — Deterministic seed derivation
  for the opening tree and forward pass; the bit-identical tree property stated
  at section 2.3 that this chapter formalises
- [Cut Management](./cut-management.md) — Append-only cut monotonicity; cut
  order is deterministic across iterations and is a precondition for the
  bit-identical lower-bound sequence guarantee
- [LP Formulation](./lp-formulation.md) — LP construction determinism; the
  column and row ordering that the per-scenario reload mechanism preserves
- [Reproducibility and Provenance](./reproducibility-and-provenance.md) — The
  companion chapter that records what enables independent verification of the
  determinism guarantee
