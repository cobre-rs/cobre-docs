# Findings: Behavioral Description Consistency

## Summary

- Behavioral themes checked: 6
- Consistent: 5
- Contradictions found: 1
- Ambiguities found: 3
- Missing cross-references: 2

Overall, the behavioral descriptions across the math, architecture, and HPC specs are highly consistent. The specs clearly describe the same system from complementary perspectives (algorithm, software design, hardware execution) and do so without meaningful contradictions. The one contradiction and three ambiguities identified are minor and mostly involve sequencing or phrasing differences that could cause confusion for an implementor.

---

## Theme 1: Forward Pass Distribution

How M trajectories are distributed across MPI ranks and OpenMP threads.

### Evidence Table

| Spec                                        | Section  | Description                                                                                                                                                                                                                                                                                       | Consistent? | Notes                                                      |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: | ---------------------------------------------------------- |
| `specs/math/sddp-algorithm.md`              | 3.1, 3.4 | "Forward trajectories are independent -- Cobre distributes M trajectories across MPI ranks, with OpenMP threads solving individual stage LPs within each rank." Thread-trajectory affinity: "each thread ownership of a complete forward trajectory."                                             |     Yes     | High-level algorithmic statement, no distribution details. |
| `specs/architecture/training-loop.md`       | 4.3      | "Scenarios are distributed across MPI ranks in contiguous blocks. Within each rank, scenarios are parallelized across OpenMP threads with thread-trajectory affinity." When M > N_threads, threads process multiple trajectories in batches. Post-forward: MPI_Allreduce aggregates LB, UB stats. |     Yes     | Adds contiguous block detail and batch processing.         |
| `specs/architecture/scenario-generation.md` | 5.2      | "MPI rank level -- deterministic distribution. Scenarios are assigned to MPI ranks as evenly as possible. If S total scenarios distributed across R ranks, first S mod R ranks receive ceil(S/R) and remaining receive floor(S/R)." Thread level: "dynamic work-stealing scheduling."             |     Yes     | Provides exact distribution arithmetic.                    |
| `specs/hpc/work-distribution.md`            | 1.1, 1.2 | "Static contiguous block assignment. Given M total forward trajectories and R MPI ranks, each rank receives floor(M/R) or ceil(M/R) scenario indices." Within rank: "schedule(dynamic,1)" with thread-trajectory affinity.                                                                        |     Yes     | Most detailed specification; consistent with all others.   |
| `specs/hpc/hybrid-parallelism.md`           | 1.1, 3   | "Scenarios are distributed across MPI ranks in contiguous blocks... thread-trajectory affinity." Table: MPI static distribution, OpenMP dynamic scheduling within rank.                                                                                                                           |     Yes     | Consistent summary.                                        |
| `specs/hpc/synchronization.md`              | 1.2      | "No per-stage synchronization barrier. Each thread solves its assigned trajectories independently from t=1 to T. No MPI communication occurs during the forward pass itself."                                                                                                                     |     Yes     | Confirms forward pass independence.                        |

### Verdict: CONSISTENT

All specs agree on: (a) static contiguous block assignment of M trajectories across R ranks, (b) thread-trajectory affinity within each rank, (c) dynamic OpenMP scheduling within rank, (d) no inter-rank communication during forward pass, (e) MPI_Allreduce for post-forward aggregation. The math spec is intentionally less detailed, as expected for different abstraction levels.

---

## Theme 2: Backward Pass Synchronization

Hard sync barrier at stage boundaries, what gets synchronized, and the protocol.

### Evidence Table

| Spec                                        | Section  | Description                                                                                                                                                                                                                                                                                                                                  | Consistent? | Notes                                                    |
| ------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: | -------------------------------------------------------- |
| `specs/math/sddp-algorithm.md`              | 3.4      | "The backward pass has a hard synchronization barrier at each stage boundary: all threads must complete cut construction at stage t before any thread proceeds to stage t-1."                                                                                                                                                                |     Yes     | Establishes the fundamental constraint.                  |
| `specs/architecture/training-loop.md`       | 2.1, 6.3 | Iteration lifecycle step 4: "Cut synchronization -- MPI_Allgatherv distributes new cuts to all ranks." Section 6.3: "All threads across all ranks must complete cut generation at stage t before any thread proceeds to stage t-1... After processing each stage, MPI_Allgatherv collects all new cuts from all ranks and distributes them." |     Yes     | Specifies MPI_Allgatherv as the mechanism.               |
| `specs/architecture/cut-management-impl.md` | 4.1      | "At each stage boundary during the backward pass: 1. Count, 2. Size exchange (MPI_Allgather of cut counts), 3. Data exchange (MPI_Allgatherv of serialized cut data), 4. Integration."                                                                                                                                                       |     Yes     | Adds intermediate size-exchange step.                    |
| `specs/hpc/work-distribution.md`            | 2.2      | 6-step execution per stage: Step 4 "MPI_Allgatherv collects all new cuts from all ranks." Step 6 "The MPI_Allgatherv in step 4 acts as an implicit barrier."                                                                                                                                                                                 |     Yes     | Most detailed backward execution model.                  |
| `specs/hpc/hybrid-parallelism.md`           | 3        | "Per-stage synchronization barrier... Level 1 (OpenMP): each thread evaluates trial points. Level 2 (MPI): MPI_Allgatherv collects new cuts."                                                                                                                                                                                                |     Yes     | Two-level summary consistent with others.                |
| `specs/hpc/synchronization.md`              | 1.4, 2.2 | "Hard synchronization barrier at each stage boundary. MPI_Allgatherv acts as an implicit barrier." Thread coordination: Phase 1 parallel evaluation, Phase 2 collection and MPI.                                                                                                                                                             |     Yes     | Details the OpenMP implicit barrier before MPI.          |
| `specs/hpc/communication-patterns.md`       | 1.1, 2.2 | "MPI_Allgatherv at backward stage boundary. Cut payload: slot_index, iteration, forward_pass_index, intercept, coefficients. ~16,660 bytes per cut."                                                                                                                                                                                         |     Yes     | Wire format details consistent with cut-management-impl. |

### Verdict: CONSISTENT

All specs agree on: (a) hard sync barrier at each stage boundary, (b) MPI_Allgatherv as the mechanism, (c) cuts are what gets synchronized, (d) the barrier must complete before proceeding to stage t-1. The cut-management-impl spec adds an MPI_Allgather for cut counts before MPI_Allgatherv, which is a necessary implementation detail not contradicted by other specs.

---

## Theme 3: Thread-Trajectory Affinity

Thread-local solver workspaces and static assignment of trajectories to threads.

### Evidence Table

| Spec                                      | Section       | Description                                                                                                                                                                                                               | Consistent? | Notes                                                     |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: | --------------------------------------------------------- |
| `specs/math/sddp-algorithm.md`            | 3.4           | "Each thread ownership of a complete forward trajectory. The same thread that executed forward pass k also performs the backward pass for the scenarios sampled by forward pass k."                                       |     Yes     | Establishes affinity extends across forward AND backward. |
| `specs/architecture/training-loop.md`     | 4.3, 6.3      | Forward: "thread-trajectory affinity: each thread owns one or more complete trajectories." Backward: "each thread evaluates its assigned states sequentially, reusing the warm solver basis saved from the forward pass." |     Yes     | Same affinity principle.                                  |
| `specs/architecture/solver-workspaces.md` | 1.1, 1.2, 1.8 | "Each thread owns one solver instance for the entire SDDP run (no pool-based borrow/return)." Thread safety table: solver instance is thread-local exclusive write.                                                       |     Yes     | Confirms exclusive ownership.                             |
| `specs/hpc/work-distribution.md`          | 1.2, 2.2, 5   | "Thread-trajectory affinity... each thread owns one or more complete forward trajectories." Section 5: "Each thread owns a set of trial points and evaluates all openings for each."                                      |     Yes     | Extends affinity to backward pass by trial point.         |
| `specs/hpc/hybrid-parallelism.md`         | 3             | "Thread-trajectory affinity: Each OpenMP thread owns one or more complete forward trajectories and also executes the backward pass for those trajectories."                                                               |     Yes     | Identical description.                                    |
| `specs/hpc/synchronization.md`            | 2.1, 2.2      | Forward: "Each thread owns complete trajectories." Backward: "Each thread evaluates its assigned trial points."                                                                                                           |     Yes     | Consistent.                                               |
| `specs/hpc/memory-architecture.md`        | 1.1, 3.1      | "Principle 1 -- Thread-owns-workspace: Each solver workspace is allocated by the thread that will use it." Thread-local mutable category.                                                                                 |     Yes     | Memory-level confirmation.                                |

### Verdict: CONSISTENT

All specs agree that: (a) each thread owns one solver instance for the entire run, (b) thread-trajectory affinity means a thread solves all stages of its assigned trajectories, (c) the same thread handles both forward and backward pass for its assigned work, (d) this preserves cache locality and warm-start continuity.

---

## Theme 4: LP Solve Warm-Starting

Warm-start capability, solver workspace lifecycle, and basis persistence across forward/backward passes.

### Evidence Table

| Spec                                       | Section  | Description                                                                                                                                                                                                                                                                                                        | Consistent? | Notes                                          |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------: | ---------------------------------------------- |
| `specs/math/sddp-algorithm.md`             | 3.1, 3.4 | "The forward pass LP solution at stage t provides a near-optimal basis for the backward pass solves at the same stage."                                                                                                                                                                                            |     Yes     | States forward-to-backward warm-start.         |
| `specs/architecture/training-loop.md`      | 4.4, 6.4 | "The solver retains this basis after the forward solve so that the backward pass at stage t can warm-start from it." Backward: "Basis persistence -- Reuse the forward pass basis as a warm-start for the backward LP."                                                                                            |     Yes     | Same forward-to-backward warm-start.           |
| `specs/architecture/solver-workspaces.md`  | 1.2, 1.5 | "Per-stage basis cache -- stores one basis per stage. The basis from solving stage t in iteration i is reused to warm-start stage t in iteration i+1." Also: "During backward pass, the basis from the first scenario solve at stage t is stored in slot t and reused for subsequent scenarios at the same stage." |  AMBIGUITY  | See note below.                                |
| `specs/architecture/solver-abstraction.md` | 2.3, 9   | "The forward pass basis at each stage is retained for warm-starting the backward pass at the same stage." Basis splits at cut boundary: structural rows reused, cut rows initialized Basic.                                                                                                                        |     Yes     | Consistent with training-loop.                 |
| `specs/architecture/solver-highs-impl.md`  | 3        | Retry strategy includes "Clear basis" as first escalation step. Warm-start via Highs_setBasis before Highs_run.                                                                                                                                                                                                    |     Yes     | Implementation-level consistency.              |
| `specs/hpc/work-distribution.md`           | 2.3      | "Sequential evaluation preserves solver warm-start across openings (the LP structure is identical, only the RHS changes between openings)."                                                                                                                                                                        |     Yes     | Confirms within-stage warm-start for backward. |

### AMBIGUITY: Forward-to-Backward vs Iteration-to-Iteration Warm-Start

**Source**: `specs/architecture/solver-workspaces.md` section 1.5 describes the per-stage basis cache as storing "the basis from solving stage t in iteration i" for reuse at "stage t in iteration i+1" -- this is an **iteration-to-iteration** warm-start. However, `specs/math/sddp-algorithm.md` section 3.1 and `specs/architecture/training-loop.md` section 4.4 describe **forward-to-backward** warm-start within the same iteration.

These two descriptions are not contradictory -- both are correct and complementary. The per-stage basis cache serves dual purposes: (1) the forward pass at stage t stores a basis that warm-starts the backward pass at stage t in the same iteration, and (2) the backward pass at stage t stores a basis that warm-starts the forward pass at stage t in the next iteration. However, the solver-workspaces spec emphasizes the iteration-to-iteration path while the algorithm and training-loop specs emphasize the within-iteration path, which could confuse an implementor about which warm-start path is primary.

**Severity**: LOW. Not a contradiction, but the dual role of the per-stage basis cache could be stated more explicitly in solver-workspaces.md.

### AMBIGUITY: Within-Stage Backward Warm-Start Source

**Source**: `specs/architecture/solver-workspaces.md` section 1.5 states "the basis from the first scenario solve at stage t is stored in slot t and reused for subsequent scenarios at the same stage within the same backward pass." Meanwhile, `specs/architecture/training-loop.md` section 4.4 says "The solver retains this basis after the forward solve so that the backward pass at stage t can warm-start from it" -- implying the forward basis is used for the backward pass.

These two descriptions overlap: the forward basis warm-starts the FIRST backward scenario solve, and then the first backward scenario solve's basis warm-starts subsequent backward scenario solves. Both are correct, but the full lifecycle is not stated in one place.

**Severity**: LOW. Complementary descriptions, not contradictory.

---

## Theme 5: Cut Exchange

Protocol, wire format, and MPI operations for sharing cuts between ranks.

### Evidence Table

| Spec                                        | Section       | Description                                                                                                                                                                                                                                                               | Consistent? | Notes                               |
| ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: | ----------------------------------- |
| `specs/architecture/training-loop.md`       | 2.1, 6.3      | Step 4: "Cut synchronization -- MPI_Allgatherv distributes new cuts to all ranks." After each stage: "MPI_Allgatherv collects all new cuts from all ranks and distributes them, so every rank has the complete set of new cuts."                                          |     Yes     | Protocol: MPI_Allgatherv per stage. |
| `specs/architecture/cut-management-impl.md` | 4.1, 4.2, 4.3 | Protocol: 1. Count, 2. MPI_Allgather of counts, 3. MPI_Allgatherv of cut data, 4. Integration. Wire format: slot_index(u32), iteration(u32), forward_pass_index(u32), intercept(f64), coefficients([f64]). ~16,660 bytes/cut. Deterministic integration via slot indices. |     Yes     | Most detailed protocol spec.        |
| `specs/hpc/work-distribution.md`            | 2.2           | Step 4: "MPI_Allgatherv collects all new cuts from all ranks." Step 5: "All ranks add new cuts to stage t-1's cut pool."                                                                                                                                                  |     Yes     | Consistent.                         |
| `specs/hpc/communication-patterns.md`       | 1.1, 2.2      | "MPI_Allgatherv at backward stage boundary. New cuts at stage t. Once per stage (T-1)." Wire format table matches cut-management-impl exactly: same fields, same sizes.                                                                                                   |     Yes     | Wire format cross-validated.        |
| `specs/hpc/synchronization.md`              | 1.4, 3.1-3.2  | "MPI_Allgatherv collects all new cuts." Thread-local accumulation: "each thread accumulates cuts in its own buffer." Collection: "rank's main thread collects all cuts from per-thread buffers into a single contiguous array" for MPI_Allgatherv send buffer.            |     Yes     | Adds intra-rank collection detail.  |

### CONTRADICTION: Synchronization Sync Point Count

**Source**: `specs/hpc/synchronization.md` section 1.1 states "There are exactly three collective calls per iteration (one post-forward, one per backward stage, one for convergence)." But looking at the actual sync points listed in that same table:

- Forward -> Backward: MPI_Allgatherv (visited states) -- 1 call
- Backward stage t: MPI_Allgatherv (cuts) -- T-1 calls (one per stage from T down to 2)
- Post-backward: MPI_Allreduce (convergence stats) -- 1 call

This totals 1 + (T-1) + 1 = T+1 collective calls per iteration, not three. The parenthetical "(one post-forward, one per backward stage, one for convergence)" should read "one post-forward, one per backward stage (T-1 total), one for convergence" -- the "three" refers to three TYPES of collective operations, not three total calls.

Additionally, `specs/architecture/training-loop.md` section 2.1 lists the iteration lifecycle as having a "Forward synchronization -- MPI_Allreduce aggregates global statistics" as step 2, but the synchronization spec section 1.3 describes this as both an MPI_Allgatherv (for trial points) AND an MPI_Allreduce (for convergence stats). The training-loop lifecycle step 2 only mentions MPI_Allreduce, omitting the MPI_Allgatherv for visited states. The MPI_Allgatherv for visited states appears separately in training-loop section 5.2.

**Severity**: LOW. The synchronization spec's "exactly three collective calls" is a categorization of call types, not a count. But the phrasing "exactly three" is misleading and could confuse an implementor counting actual MPI operations. The training-loop lifecycle step ordering is slightly ambiguous about when the trial-point Allgatherv happens relative to the Allreduce.

### Verdict on Cut Exchange: CONSISTENT (protocol and wire format agree across all specs)

---

## Theme 6: Opening Tree

How the scenario tree/sampling works in the forward pass and backward pass.

### Evidence Table

| Spec                                        | Section       | Description                                                                                                                                                                                                                                                                                                                                                                                   | Consistent? | Notes                                          |
| ------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: | ---------------------------------------------- |
| `specs/math/sddp-algorithm.md`              | 3.1, 3.2      | Forward: "Sample a scenario realization omega_t from the stage's scenario set." The InSample scheme "draws a random index j from the fixed opening tree." Backward: "every scenario omega in Omega_t" refers to all N_openings noise vectors in the fixed opening tree. Probabilities: "uniform over these openings (p = 1/N_openings)."                                                      |     Yes     | Establishes fixed tree, uniform probabilities. |
| `specs/architecture/training-loop.md`       | 3.4, 6.1, 6.2 | Forward: InSample samples random index from opening tree. "The backward pass noise source is always the fixed opening tree, regardless of the forward sampling scheme." Backward: "all N_openings noise vectors for stage t from the fixed opening tree. This is the Complete backward sampling scheme -- all openings are always evaluated." Probabilities uniform.                          |     Yes     | Adds sampling scheme separation.               |
| `specs/architecture/scenario-generation.md` | 2.3, 3.1, 3.4 | "The backward pass evaluates an aggregated cut by solving all N_openings branchings at each stage. These branchings must be identical across all iterations." Tree generated once before training. Forward (InSample): sample random index. Backward sampling: Complete -- evaluate all N_openings. Shape: (T x N_openings x N_entities). Memory layout: opening-major for backward locality. |     Yes     | Most detailed opening tree spec.               |
| `specs/hpc/work-distribution.md`            | 2.2           | "Each rank processes its assigned trial points. For each trial point, the rank evaluates all N_openings noise vectors from the fixed opening tree."                                                                                                                                                                                                                                           |     Yes     | Confirms complete backward evaluation.         |

### AMBIGUITY: Opening Tree Memory Layout vs Scenario Memory Layout

**Source**: `specs/architecture/scenario-generation.md` section 2.3 specifies the opening tree uses "opening-major ordering for backward pass locality":

```
[opening_0_stage_0_entity_0, ..., opening_0_stage_T_entity_E,
 opening_1_stage_0_entity_0, ..., opening_N_stage_T_entity_E]
```

While section 5.1 specifies scenario data (which includes forward pass scenarios) uses "scenario-major ordering optimized for the forward pass access pattern":

```
Layout: [S0_T0_H0] [S0_T0_H1] ... [S0_TT_HN] [S1_T0_H0] ... [SS_TT_HN]
```

These two layouts are essentially the same concept (scenario/opening as the outer dimension). The potential ambiguity is that section 5.1's "scenario data" and section 2.3's "opening tree" are potentially overlapping data structures for the InSample case (where the forward pass draws from the same opening tree). It is unclear whether there is one physical data structure serving both purposes or two separate data structures with redundant content. Since the InSample forward pass only reads individual noise vectors by index (not sequentially), the same opening-major layout works for both use cases.

**Severity**: LOW. Not a contradiction. A clarifying note about whether the InSample forward pass reads from the same physical opening tree data structure as the backward pass would remove the ambiguity.

### Verdict: CONSISTENT

All specs agree on: (a) fixed opening tree generated once before training, (b) backward pass always evaluates ALL openings (Complete scheme), (c) forward pass samples from the tree (InSample default), (d) uniform probabilities in backward aggregation.

---

## Missing Cross-References

I built a directed adjacency list of spec-to-spec references from the Cross-References sections and inline references of the audited files. Below are the one-directional edges where spec A references spec B but spec B does not reference A back.

| Source Spec                        | References                                                                             | Missing Back-Reference From                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `specs/hpc/synchronization.md`     | References `specs/architecture/convergence-monitoring.md`                              | `convergence-monitoring.md` does not reference `synchronization.md`  |
| `specs/hpc/memory-architecture.md` | References `specs/architecture/scenario-generation.md` (section 2.3 opening tree size) | `scenario-generation.md` does not reference `memory-architecture.md` |

### Analysis of Missing Back-References

1. **convergence-monitoring -> synchronization**: The convergence monitoring spec references training-loop and stopping-rules, but does not mention synchronization.md at all. Since convergence monitoring depends on the MPI_Allreduce described in the synchronization spec, a back-reference would help an implementor understand the aggregation mechanism. However, convergence-monitoring does reference training-loop section 4.3, which in turn references synchronization. The chain is intact but indirect.

2. **scenario-generation -> memory-architecture**: The scenario generation spec section 2.3 notes the opening tree "fits in L3 cache" (~30 MB) but does not reference the memory architecture spec where this budget is formally tracked. This is a natural omission since memory-architecture is a consumer of sizing data from scenario-generation, not the reverse. The lack of back-reference is typical for aggregation specs.

**Neither missing back-reference is a significant issue.** Both follow the pattern where an HPC/infrastructure spec references an architecture/algorithm spec, but the reverse direction is not expected (architecture specs should not need to know about HPC implementation details).

---

## Additional Observations

### Cross-Spec Consistency of Numeric Parameters

Several numeric values appear across multiple specs. All were checked for consistency:

| Parameter             | sddp-algorithm.md              | training-loop.md                          | work-distribution.md           | communication-patterns.md | memory-architecture.md                   |
| --------------------- | ------------------------------ | ----------------------------------------- | ------------------------------ | ------------------------- | ---------------------------------------- |
| Forward passes (M)    | "M independent"                | "M scenario trajectories"                 | "M total forward trajectories" | "M = 200" (example)       | "200 forward passes"                     |
| Openings (N_openings) | "all N_openings noise vectors" | "all N_openings noise vectors"            | "all N_openings noise vectors" | "200 openings" (example)  | "200 openings"                           |
| State dimension       | "~2000 state dimensions"       | "1,120 doubles" (160 hydro + 960 AR lags) | --                             | "D_state = 2,080"         | "1,120 doubles" / state dimension varies |

Note: The state dimension varies across specs: sddp-algorithm.md says "~2000 state dimensions", communication-patterns.md uses D_state = 2,080, and training-loop.md / memory-architecture.md use 1,120. The 1,120 figure (160 hydro storage + 160 x 6 AR lags) and 2,080 figure appear to use different AR lag counts. This was already flagged in findings-003 (parameter value consistency) and is not re-flagged here.

### Deferred Features Are Clearly Marked

All deferred features mentioned across specs (multi-cut, MonteCarlo(n) backward sampling, pipelined backward pass, state deduplication) are consistently labeled as deferred and point to the same deferred features document. No spec describes a deferred feature as if it were implemented.

---

## Consolidated Finding List

| ID    | Type          | Theme                      | Severity | Description                                                                                                                                                                                                                                                      |
| ----- | ------------- | -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B-001 | CONTRADICTION | Cut Exchange (Theme 5)     | LOW      | `synchronization.md` section 1.1 says "exactly three collective calls per iteration" but the actual count is T+1 (1 Allgatherv for states + T-1 Allgathervs for cuts + 1 Allreduce). The "three" refers to three types, not three calls. Phrasing is misleading. |
| B-002 | AMBIGUITY     | LP Warm-Starting (Theme 4) | LOW      | solver-workspaces.md emphasizes iteration-to-iteration basis reuse while training-loop.md emphasizes forward-to-backward within-iteration reuse. Both are correct; the dual role of the per-stage basis cache is not stated in one place.                        |
| B-003 | AMBIGUITY     | LP Warm-Starting (Theme 4) | LOW      | The full warm-start lifecycle (forward basis -> first backward scenario -> subsequent backward scenarios) is split across solver-workspaces.md and training-loop.md. Not contradictory but could be clearer.                                                     |
| B-004 | AMBIGUITY     | Opening Tree (Theme 6)     | LOW      | Whether InSample forward pass physically reads from the same opening tree data structure as the backward pass, or from a separate scenario-major copy, is not explicitly stated.                                                                                 |
| B-005 | MISSING-XREF  | Cross-References           | LOW      | `convergence-monitoring.md` does not back-reference `synchronization.md` (indirect path exists via training-loop.md).                                                                                                                                            |
| B-006 | MISSING-XREF  | Cross-References           | LOW      | `scenario-generation.md` does not back-reference `memory-architecture.md` (expected: aggregation spec references source, not reverse).                                                                                                                           |
