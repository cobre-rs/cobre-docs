# Performance & Parallelism

This page covers planned optimizations to the SDDP training loop that reduce computation time, improve state space exploration, or exploit parallel hardware more effectively. These features are motivated by profiling observations rather than new algorithmic capabilities — they make the existing algorithm faster or more thorough, without changing its fundamental behavior.

---

## C.13 Alternative Forward Pass

The default forward pass solves the training LP, which excludes simulation-only features (linearized head, unit commitment, bottom discharge) to preserve convexity for valid cut generation. Trial points from this simplified model may not represent states that are realistic under full operational modeling, potentially slowing convergence.

The alternative forward pass maintains two LP models per stage: the training LP (convex, used for backward pass cut generation) and an alternative LP (includes simulation-only features, used for the forward pass to generate more realistic trial points). After each backward pass, new cuts are added to both models.

Cuts remain valid because they are always generated from the convex training LP. Trial points are more realistic because they come from the richer alternative LP. The trade-off: memory approximately doubles (two LP models per stage), and convergence may be slower because forward trial points are not optimal for the training model.

**Why it is deferred**: Maintaining two parallel LP models per stage doubles memory and complicates solver workspace management. The benefit depends on how much simulation-only features change the trial points, which is problem-dependent and requires empirical investigation.

**Prerequisites**:

- Core SDDP training loop operational and validated
- Simulation-only LP construction (linearized head, unit commitment) implemented
- Solver workspace infrastructure supports multiple LP models per stage

**Estimated effort**: Medium (2-3 weeks). LP construction infrastructure is reused; the main effort is dual LP management, cut copying, and convergence testing.

**See also**: [Deferred Features §C.13](../specs/deferred.html#c13-alternative-forward-pass-model), [Simulation Architecture](../specs/architecture/simulation-architecture.md)

---

## C.16 Revisiting Forward Pass

Standard forward passes always start from the initial state at stage 1. In problems with large state spaces, repeated iterations can visit similar states and generate cuts in the same regions, leaving parts of the state space poorly covered.

The revisiting forward pass maintains a buffer of previously visited states from past iterations. With some probability, a forward pass starts from a randomly selected historical state at a randomly selected stage instead of from stage 1. The resulting trial points generate cuts in regions that standard forward passes have not recently visited.

**Why it is deferred**: Starting a forward pass from an intermediate stage produces a partial trajectory that does not contribute a full-horizon cost estimate. This complicates upper bound estimation. The benefit is primarily for problems where standard forward passes provably concentrate in a narrow region of the state space.

**Prerequisites**:

- Core SDDP training loop validated
- State history buffer infrastructure
- Convergence monitoring handles partial-trajectory iterations

**Estimated effort**: Small-Medium (1-2 weeks). The state buffer is straightforward; the main effort is convergence analysis for partial trajectories.

**See also**: [Deferred Features §C.16](../specs/deferred.html#c16-revisiting-forward-pass)

---

## C.17 Forward Pass State Deduplication

When multiple forward scenarios visit identical or near-identical states at a given stage, the backward pass redundantly evaluates the cost-to-go from duplicate trial points. Identical states produce identical cuts, so the duplication adds no information.

Two approaches are planned:

- **Exact deduplication** — Hash-based deduplication of state vectors with identical values. Straightforward to implement but limited in benefit, since exact duplicates are uncommon in problems with continuous state spaces.
- **Approximate deduplication** — Merge states within a tolerance using spatial indexing (for example, k-d tree). Greater reduction in backward solves, but introduces approximation in cut coefficients. Requires analysis of convergence implications before deployment.

**Why it is deferred**: Exact duplicates are uncommon, making exact deduplication a marginal optimization. Approximate deduplication requires careful convergence analysis. This feature should be implemented only when profiling shows backward pass cost is dominated by trial point count rather than per-solve cost.

**Prerequisites**:

- Core SDDP training loop validated and profiled
- Backward pass timing data identifying trial point count as the dominant cost factor

**Estimated effort**: Small (less than 1 week) for exact deduplication; Medium (2-3 weeks) for approximate deduplication with convergence analysis.

**See also**: [Deferred Features §C.17](../specs/deferred.html#c17-forward-pass-state-deduplication), [Training Loop §5.2](../specs/architecture/training-loop.md)

---

## C.18 Pipelined Backward Pass

The standard sequential backward pass uses the cut approximation from the current iteration at each stage. This requires a synchronization barrier between stages: stage `t` cannot begin its backward solve until stage `t+1` has finished and broadcast its cuts.

The pipelined backward pass uses the previous iteration's approximation instead. This eliminates per-stage barriers and allows backward stages to proceed in a pipeline — stage `t` begins its solve while stage `t+1` is still communicating cuts via non-blocking MPI collectives (`MPI_Iallgatherv`). The result is overlapped communication and computation.

The trade-off: pipelined cuts are looser (older information), so more iterations are needed to converge. Whether the shorter wall-clock time per iteration outweighs the slower per-iteration convergence depends on hardware-specific communication latency, which cannot be determined without profiling production workloads.

**When to consider**: Profiling shows backward pass per-stage barrier synchronization accounts for more than 20% of backward pass time. Most likely with very large stage counts (more than 100 stages) and high inter-node network latency.

**Why it is deferred**: The sequential mode is simpler, produces tighter cuts, and is the default in SDDP.jl and most production implementations. The pipelining benefit is hardware-specific.

**Prerequisites**:

- Core SDDP training loop validated and profiled
- Backward pass timing data showing barrier synchronization as a bottleneck
- Non-blocking MPI collective support in ferrompi (`MPI_Iallgatherv`)

**Estimated effort**: Medium (2-3 weeks). Requires async state management, non-blocking collective wrappers, and convergence regression testing.

**See also**: [Deferred Features §C.18](../specs/deferred.html#c18-pipelined-backward-pass), [Communication Patterns](../specs/hpc/communication-patterns.md)

---

## C.19 Dynamic Forward-Passes Scheduler

The number of forward passes per iteration (`forward_passes`) is currently set statically in the configuration. A dynamic scheduler would adjust this count during training based on convergence metrics (for example, increasing forward passes when the lower bound is stagnant) or wall-clock budget (for example, maintaining a fixed seconds-per-iteration target).

**Why it is deferred**: The cut pool is pre-allocated using the formula `warm_start_cuts + max_iterations × forward_passes` with a deterministic slot assignment. A dynamic scheduler would require either a worst-case static allocation (wasteful for most runs) or dynamic reallocation (which invalidates the deterministic slot assignment and complicates reproducibility). The right approach requires profiling data from production workloads.

**See also**: [Deferred Features §C.19](../specs/deferred.html#c19-dynamic-forward-passes-scheduler), [Cut Management Implementation §1.3](../specs/architecture/cut-management-impl.md)
