# ticket-005: Add Parallel Generation Tests

## Context

### Background

The existing `sampling-scheme-testing.md` has 23 tests across 4 sections: SS1 (conformance, 10 tests), SS2 (forward-backward separation, 3 tests), SS3 (reproducibility, 3 tests), and SS4 (validation, 8 tests). The reproducibility tests in SS3 verify that the same seed produces identical results across ranks, but they do not explicitly test parallel generation scenarios -- e.g., that opening tree generation across multiple ranks produces the same tree as single-rank generation, or that noise generation on different thread configurations produces identical results.

The cut selection testing spec (`cut-selection-testing.md`) includes an SS4 section with 8 parallel execution tests that verify rank-independent selection, thread-independent selection, and multi-rank DeactivationSet gathering. The scenario generation pipeline needs equivalent parallel tests to verify that the communication-free parallelism model documented in SS2.2b and SS2.3c (added by tickets 001-002) produces correct results.

### Relation to Epic

This is the first ticket in Epic 02. It adds the parallel generation test section that complements the spec content added in Epic 01. The tests verify the claims made in SS2.2b (communication-free noise generation), SS2.3c (parallel opening tree generation), and the forward pass threading model (SS5.2 addendum).

### Current State

File: `/home/rogerio/git/cobre-docs/src/specs/architecture/sampling-scheme-testing.md`

The file currently has 4 sections (SS1 through SS4) with a shared test fixture and cross-references. The last section is SS4 "Validation Tests" (lines 136-148). The Cross-References section follows immediately after SS4 (lines 149-159).

The existing SS3 "Reproducibility Tests" (lines 124-132) has 3 tests:

- `test_sampling_insample_reproducibility_same_seed` -- Same seed produces identical output
- `test_sampling_insample_reproducibility_cross_rank` -- Simulates 2 MPI configurations and verifies identical output per scenario index
- `test_sampling_insample_reproducibility_different_seeds` -- Different seeds produce different output

The gap: SS3 tests single-method reproducibility (calling `sample_forward` with the same seed on different simulated rank configurations). There are no tests for:

1. Opening tree multi-rank generation equivalence (parallel tree generation produces the same tree as single-rank generation)
2. Multi-thread noise generation equivalence (varying thread counts produce identical noise)
3. Forward pass noise generation across different MPI configurations (varying rank counts produce identical per-scenario noise)
4. Opening tree generation across different thread configurations
5. End-to-end parallel invariance (full forward+backward pass noise usage is identical across configurations)

## Specification

### Requirements

Add a new section **SS5 "Parallel Generation Tests"** to `sampling-scheme-testing.md`, placed after SS4 "Validation Tests" and before the Cross-References section. The section must contain:

1. **Section heading**: `## SS5. Parallel Generation Tests`

2. **Purpose paragraph** explaining that these tests verify the communication-free parallel noise generation model documented in [Scenario Generation SS2.2b](./scenario-generation.md). They complement the reproducibility tests in SS3 by explicitly varying MPI rank count, thread count, and opening tree generation configurations, and verifying that results are bit-identical across configurations. These tests validate the architectural claim that deterministic seed derivation eliminates the need for inter-rank communication during noise generation.

3. **Test naming convention paragraph**: `test_sampling_parallel_{component}_{scenario}` where `{component}` is `noise`, `opening_tree`, or `forward_pass`, and `{scenario}` describes the parallel configuration being tested.

4. **Test table** with 6 tests in the following format (using the standard columns: Test Name, Input Scenario, Expected Observable Behavior):

**Test 1: `test_sampling_parallel_noise_rank_independence`**

- Input: Shared fixture from SS1. InSample with seed=42. Two MPI configurations: (A) 1 rank processes all 5 scenarios at stage 0, (B) 4 ranks process scenarios [0-1], [2-3], [4], [] respectively. For each scenario index $s \in \{0, 1, 2, 3, 4\}$, generate the noise vector at stage 0 using `seed(iteration=0, s, stage_id=0)`.
- Expected: Configurations (A) and (B) produce identical `NoiseVector` for every scenario index. The noise for scenario $s$ depends only on the tuple `(base_seed=42, iteration=0, s, stage_id=0)` -- not on rank count, rank assignment, or which rank generates it.

**Test 2: `test_sampling_parallel_noise_thread_independence`**

- Input: Shared fixture. InSample with seed=42. Single rank, two thread configurations: (A) 1 Rayon worker thread processes all 5 scenarios, (B) 4 Rayon worker threads process scenarios dynamically via work-stealing. Generate noise vectors for all 5 scenarios at all 3 stages.
- Expected: Configurations (A) and (B) produce identical `NoiseVector` for every (scenario, stage) pair. Thread ID does not appear in the seed derivation -- only `(base_seed, iteration, scenario_index, stage_id)`.

**Test 3: `test_sampling_parallel_opening_tree_rank_equivalence`**

- Input: Shared fixture with 5 openings, 3 stages, 2 hydros, base seed=42. Two generation configurations: (A) single rank generates all 5 openings for all 3 stages, (B) 2 ranks generate openings [0-2] and [3-4] respectively (contiguous block assignment per [Work Distribution §3.1](../hpc/work-distribution.md)). Each opening's noise is generated from `seed(base_seed=42, opening_index, stage)`.
- Expected: The resulting `OpeningTree` is bit-identical under both configurations. For each (opening $j$, stage $t$, hydro $h$), the noise value $\eta_{j,t,h}$ matches the shared fixture opening tree table from SS1. Multi-rank generation is equivalent to single-rank generation because the seed depends on `(base_seed, opening_index, stage)` only.

**Test 4: `test_sampling_parallel_opening_tree_thread_equivalence`**

- Input: Same as Test 3 but within a single rank. Two thread configurations: (A) 1 thread generates all 5 openings, (B) 3 threads generate openings [0-1], [2-3], [4] respectively. Openings are the outer loop; stages are the inner loop per opening (per [Scenario Generation SS2.3c](./scenario-generation.md)).
- Expected: Bit-identical `OpeningTree` under both configurations. Each thread writes to a disjoint portion of the opening tree; the result is independent of thread assignment.

**Test 5: `test_sampling_parallel_forward_pass_multi_config`**

- Input: Shared fixture. InSample with seed=42. Run a complete forward pass (all 3 stages, 5 scenarios) under three configurations: (A) 1 rank / 1 thread, (B) 2 ranks / 1 thread each, (C) 1 rank / 4 threads. At each (scenario, stage), the forward pass invokes `sample_forward` with the deterministically seeded RNG.
- Expected: All three configurations produce identical forward pass results: same sampled opening indices, same noise vectors, same LP solutions (assuming deterministic LP solver). The forward pass noise path is invariant to MPI rank count and thread count.

**Test 6: `test_sampling_parallel_external_noise_inversion_rank_independence`**

- Input: Shared fixture. External variant with `selection_mode = Sequential`. Two configurations: (A) 1 rank processes all 5 scenarios, (B) 2 ranks process scenarios [0-2] and [3-4] respectively. Generate inverted noise for all 3 stages of scenario 0 (using the external scenario data and the noise inversion formula from [Scenario Generation SS4.3](./scenario-generation.md)).
- Expected: Both configurations produce identical inverted noise vectors for scenario 0. The noise inversion depends on `(external_scenario_data, PAR_parameters, scenario_index, stage_id)` -- not on rank assignment. Scenario 0 produces the same 3-stage chain regardless of which rank processes it: stage 0 = [0.5, 0.5], stage 1 = [-0.35, 1.05], stage 2 = [1.26, -0.75] (values from the existing `test_sampling_external_sample_forward_stage_chain` in SS1.1).

### Inputs/Props

- The shared fixture from SS1 of the existing `sampling-scheme-testing.md`
- The work distribution formulas from `work-distribution.md` SS3.1
- The parallel generation documentation from `scenario-generation.md` SS2.2b and SS2.3c (added by tickets 001-002)

### Outputs/Behavior

A new SS5 section is inserted into `sampling-scheme-testing.md` after SS4 and before the Cross-References section.

### Error Handling

Not applicable (documentation task).

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/sampling-scheme-testing.md`, when searching for `## SS5. Parallel Generation Tests`, then exactly one match is found, and it is located after `## SS4. Validation Tests` and before `## Cross-References`
- [ ] Given the new SS5 section, when counting test rows in the test table, then exactly 6 tests are present with names matching the `test_sampling_parallel_` prefix
- [ ] Given the 6 tests, when checking their input scenarios, then tests 1 and 2 test noise generation, tests 3 and 4 test opening tree generation, test 5 tests forward pass multi-configuration, and test 6 tests External variant noise inversion -- covering all three parallel generation dimensions (rank independence, thread independence, opening tree equivalence)
- [ ] Given the new SS5 section, when checking cross-references within test descriptions, then references to `Scenario Generation SS2.2b`, `Scenario Generation SS2.3c`, and `Work Distribution §3.1` are present
- [ ] Given the modified `sampling-scheme-testing.md`, when running `mdbook build` from the repo root, then the build completes without new warnings

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/sampling-scheme-testing.md` to understand the existing structure, shared fixture, and test table format
2. Read the content added by tickets 001-002 in `scenario-generation.md` (SS2.2b and SS2.3c) to understand the parallel models being tested
3. Identify the insertion point: after the last row of the SS4 table (around line 148) and before the Cross-References section (line 149)
4. Write the SS5 section with purpose paragraph, test naming convention, and 6-test table
5. Ensure each test's Expected Observable Behavior column includes concrete values from the shared fixture (bit-identical outputs, specific noise vector values where applicable)
6. Run `mdbook build` to verify no new warnings

### Key Files to Modify

- `src/specs/architecture/sampling-scheme-testing.md` -- Add SS5 section

### Patterns to Follow

- Use the same table format as existing test sections (Test Name, Input Scenario, Expected Observable Behavior columns)
- Use the shared fixture from SS1 for all test inputs (do not define a new fixture)
- Follow the test naming convention: `test_sampling_parallel_{component}_{scenario}`
- Reference concrete values from the shared fixture's opening tree and external scenario tables where possible
- Follow the same level of detail as the SS2 forward-backward separation tests (which are the most detailed existing tests)

### Pitfalls to Avoid

- Do NOT create a separate test fixture -- use the existing shared fixture from SS1
- Do NOT add a Variant column to the test table -- parallel tests span multiple variants (some test InSample, some test External; the variant is stated in the Input Scenario column)
- Do NOT place the new section before SS4 -- it must go after SS4 and before Cross-References
- Do NOT use `§` prefix for references to architecture spec sections -- use `SS` prefix
- Do NOT redefine the noise inversion reference values -- reuse the exact values already computed in the SS1.1 `test_sampling_external_sample_forward_stage_chain` test

## Testing Requirements

### Unit Tests

Not applicable (documentation task).

### Integration Tests

- Run `mdbook build` from repo root and verify no new warnings

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-004-add-dec-017-decision-log-entry.md (tests reference DEC-017 in their rationale)
- **Blocks**: ticket-007-batch-update-cross-reference-index.md

## Effort Estimate

**Points**: 3
**Confidence**: High

## Out of Scope

- Adding tests to `cut-selection-testing.md` (that spec already has parallel tests)
- Adding tests for the backward pass opening tree access (covered by existing SS2 forward-backward separation tests)
- Modifying the shared test fixture
- Updating cross-references in `sampling-scheme-testing.md` (ticket-006)
