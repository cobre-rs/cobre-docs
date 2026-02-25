# ticket-004 Audit Behavioral Description Consistency Across Architecture and HPC Specs

## Context

### Background

The Cobre spec corpus describes the same runtime behaviors (forward pass execution, backward pass synchronization, LP solving, cut exchange) from multiple perspectives: mathematical specs describe the algorithm, architecture specs describe the software design, and HPC specs describe the parallelization. When the same behavior is described in three places, there is risk of inconsistency. For example, "the forward pass distributes M trajectories across ranks" must be stated consistently in the SDDP algorithm spec, the training loop spec, the work distribution spec, and the hybrid parallelism spec.

### Relation to Epic

This ticket extends the consistency audit beyond pure mathematical notation (tickets 001-002) and numeric values (ticket-003) to cover **behavioral descriptions** -- prose and algorithmic statements about how the system operates.

### Current State

Key behavioral claims that appear across multiple spec categories:

1. **Forward pass distribution**: "Forward trajectories are independent -- Cobre distributes M trajectories across MPI ranks" (sddp-algorithm.md section 3.1) vs detailed distribution in work-distribution.md section 1
2. **Backward pass synchronization**: "Hard synchronization barrier at each stage boundary" (sddp-algorithm.md section 3.4) vs work-distribution.md section 2.2
3. **Thread-trajectory affinity**: Described in sddp-algorithm.md section 3.4, work-distribution.md section 1.2, hybrid-parallelism.md
4. **LP solve warm-starting**: Referenced in sddp-algorithm.md section 3.1, work-distribution.md section 2.3, solver-workspaces.md
5. **Cut exchange**: sddp-algorithm.md section 3.2, cut-management-impl.md, communication-patterns.md
6. **Opening tree**: sddp-algorithm.md section 3.2, scenario-generation.md, work-distribution.md section 2.2

## Specification

### Requirements

1. For each of the 6 behavioral themes listed above, read the relevant sections in all specs that describe it
2. Compare the descriptions for consistency: same number of passes, same distribution strategy, same synchronization points, same data flow
3. Identify any contradictions or ambiguities between the different perspectives
4. Check that cross-references between specs are bidirectional (if spec A references spec B for details, spec B should reference spec A for context)

### Inputs/Props

**Files to read** (all paths relative to `/home/rogerio/git/cobre-docs/src/`):

| File                                           | Sections                                               | Behavioral Themes                                                   |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| `specs/math/sddp-algorithm.md`                 | 3.1, 3.2, 3.4                                          | Forward pass, backward pass, thread-trajectory affinity, warm-start |
| `specs/architecture/training-loop.md`          | Full file                                              | Complete training loop behavior                                     |
| `specs/architecture/solver-abstraction.md`     | Section 3 (RHS updates), section 5 (cut preallocation) | LP solve pattern, cut management                                    |
| `specs/architecture/solver-workspaces.md`      | Section 1 (thread-local workspaces)                    | Warm-start, solver lifecycle                                        |
| `specs/architecture/solver-highs-impl.md`      | Section 3 (HiGHS-specific hot path)                    | LP solve mechanics                                                  |
| `specs/architecture/cut-management-impl.md`    | Section 4 (MPI synchronization)                        | Cut exchange wire format and protocol                               |
| `specs/architecture/convergence-monitoring.md` | Full file                                              | Bound computation, stopping check                                   |
| `specs/architecture/scenario-generation.md`    | Sections 2.3, 3, 3.4                                   | Opening tree, sampling schemes                                      |
| `specs/hpc/work-distribution.md`               | Full file                                              | Forward/backward distribution mechanics                             |
| `specs/hpc/hybrid-parallelism.md`              | Section 1.1, 3                                         | MPI vs OpenMP responsibility split                                  |
| `specs/hpc/communication-patterns.md`          | Section 1, 2                                           | MPI operations, data payloads                                       |
| `specs/hpc/synchronization.md`                 | Full file                                              | Sync points, barrier semantics                                      |
| `specs/hpc/memory-architecture.md`             | Section 1 (data ownership), 2 (per-rank budget)        | Memory model for shared/thread-local data                           |

### Outputs/Behavior

Produce a findings report organized by behavioral theme:

```markdown
## Findings: Behavioral Description Consistency

### Summary

- Behavioral themes checked: 6
- Consistent: N
- Contradictions found: N
- Ambiguities found: N
- Missing cross-references: N

### Theme 1: Forward Pass Distribution

| Spec                 | Section | Description                                   | Consistent? | Notes |
| -------------------- | ------- | --------------------------------------------- | ----------- | ----- |
| sddp-algorithm.md    | 3.1     | "distributes M trajectories across MPI ranks" | YES/NO      | ...   |
| work-distribution.md | 1.1     | "Static contiguous block assignment"          | YES/NO      | ...   |
| training-loop.md     | 4.3     | ...                                           | YES/NO      | ...   |

### Theme 2: Backward Pass Synchronization

...

### Missing Cross-References

| Source Spec | References | Missing Back-Reference From |
| ----------- | ---------- | --------------------------- |
```

### Error Handling

- If two specs give different numbers for the same quantity (e.g., one says "all openings" and another says "N_openings openings"), flag it as a CONTRADICTION
- If a spec describes a behavior ambiguously enough that it could be interpreted as contradicting another spec, flag it as AMBIGUITY
- If a spec references another spec for details but the referenced spec does not reference back, flag it as MISSING BACK-REFERENCE

## Acceptance Criteria

- [ ] Given the 6 behavioral themes are defined, when all relevant spec sections are compared, then each contradiction or ambiguity is documented with exact file paths and section numbers
- [ ] Given the forward pass is described in sddp-algorithm, training-loop, and work-distribution, when the three descriptions are compared, then they agree on distribution strategy, pass count, and thread assignment
- [ ] Given the backward pass involves per-stage synchronization, when the synchronization descriptions are compared across specs, then they agree on what is synchronized (cuts), when (stage boundary), and how (MPI_Allgatherv)
- [ ] Given cross-references should be bidirectional, when a spec references another for detail, then the referenced spec links back for context

## Implementation Guide

### Suggested Approach

1. For each behavioral theme, collect all relevant text excerpts from the listed specs
2. Create a comparison table showing how each spec describes the same behavior
3. Highlight any differences in terminology, numbers, or logic
4. For cross-reference checking, build an adjacency list of spec-to-spec references and identify any one-directional edges

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-004.md`

### Patterns to Follow

- Quote exact text from specs when comparing (makes it easy to verify)
- Use the section numbering from the specs (e.g., "sddp-algorithm.md section 3.4" not "the part about thread affinity")
- For cross-reference analysis, note the markdown link text and target

### Pitfalls to Avoid

- Architecture specs describe software design patterns while HPC specs describe hardware-level execution -- different levels of abstraction are not contradictions
- The SDDP algorithm spec intentionally provides a simplified overview while the architecture and HPC specs provide implementation details -- this layering is by design
- "Forward pass scenarios are independent" (algorithm level) is consistent with "Static contiguous block assignment" (distribution level) -- independence is the precondition, not the distribution strategy
- Some specs may describe deferred features (e.g., pipelined backward pass) -- these are documented as future work and should not be treated as current behavior contradictions

## Testing Requirements

### Unit Tests

N/A (audit ticket)

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: None (can run in parallel with tickets 001-003)
- **Blocks**: ticket-005

## Effort Estimate

**Points**: 3
**Confidence**: High
