# ticket-012 Define SolverInterface Conformance Test Spec

## Context

### Background

After the SolverInterface trait spec (ticket-011) formalizes the behavioral contract for LP solver operations, a conformance test specification is needed to verify that both HiGHS and CLP implementations satisfy the same contract. Unlike the algorithm-variant conformance tests from epics 01-02 (which used hand-computable fixtures with 3-5 data points), the solver conformance tests operate on small LP problems where the expected primal/dual solutions can be computed analytically. The key property to verify is solver-agnosticism: the same LP, submitted through the same interface, produces the same solution (within numerical tolerance) regardless of which solver backend is active.

The SolverInterface is unique among the formalized traits because: (1) operations can fail (the test suite must cover error paths), (2) the interface wraps external C libraries via FFI (tests verify behavioral correctness, not implementation details), and (3) the LP lifecycle has a strict ordering (load, patch, add cuts, solve) that tests must respect.

### Relation to Epic

Second ticket in Epic 03. Depends on ticket-011 (the trait spec defines the contracts being tested). The cross-reference and SUMMARY updates (ticket-013) depend on this file existing.

### Current State

- `src/specs/hpc/backend-testing.md` is the gold-standard conformance test spec for the Communicator trait (HPC domain)
- `src/specs/architecture/risk-measure-testing.md` is the most recent conformance test spec (architecture domain), following the naming convention `test_{trait}_{variant}_{method}_{scenario}`
- Five conformance test specs exist from epics 01-02: `risk-measure-testing.md`, `horizon-mode-testing.md`, `sampling-scheme-testing.md`, `cut-selection-testing.md`, `stopping-rule-testing.md`
- No conformance test spec exists for the SolverInterface
- `solver-abstraction.md` SS4.3 provides the dual-solver validation table that maps each operation to both HiGHS and CLP API calls

## Specification

### Requirements

Create a new file `src/specs/architecture/solver-interface-testing.md` with the following structure:

1. **Title**: `# Solver Interface Testing and Conformance`
2. **Purpose paragraph**: Define the conformance test suite for the `SolverInterface` trait. The suite verifies that both reference implementations (HiGHS, CLP) satisfy the behavioral contract from `solver-interface-trait.md` and produce equivalent solutions on identical LP inputs. Reference that tests use small, analytically solvable LPs.
3. **SS1. Conformance Test Suite**: Requirements tables covering all 8+1 operations from the trait. Use the test naming convention `test_solver_{variant}_{method}_{scenario}` where `{variant}` is `highs` or `clp`.

   **Shared test fixture**: Define a small LP problem (2-4 variables, 3-5 constraints) with known optimal solution, known dual values, and known basis. The LP must follow the column/row layout convention from `solver-abstraction.md` SS2 (state variables first, cut-relevant constraints at top). Include the explicit LP data: objective coefficients, constraint matrix (CSC), bounds, and the hand-computed optimal primal, dual, and objective values.

   **Test categories by method:**
   - `load_model`: Verify that loading the shared fixture LP succeeds; verify that a subsequent solve produces the expected objective value
   - `add_cut_rows`: Add 1-2 Benders cuts (with explicit coefficients) to the loaded LP; verify that the solve produces the tightened objective; verify that cuts are appended at the bottom per SS2.2
   - `patch_rhs_bounds`: Modify scenario-dependent values (e.g., change an RHS value); verify that the solve reflects the updated constraint
   - `solve`: Verify optimal objective, primal values, and dual values match expected within tolerance; verify that returned duals are in canonical sign convention (SS8)
   - `solve_with_basis`: Load basis from prior solve; verify reduced iteration count compared to cold start; verify solution is identical to cold-start solve
   - `reset`: After reset, verify that a solve without re-loading fails or that the solver is in a clean state; verify that statistics are not cleared (statistics accumulate across resets)
   - `get_basis`: Verify that the returned basis has the correct number of column and row status entries; verify that loading the returned basis back produces an immediate solution (0-1 iterations)
   - `statistics`: Verify that total_solves increments after each solve call; verify that total_iterations is positive after a solve
   - `name`: Verify that the returned string identifies the solver backend (e.g., "highs", "clp")

4. **SS2. Cross-Solver Equivalence Tests**: Tests that run the same LP on both backends and verify equivalent results. These are the core solver-agnosticism tests.
   - Same LP, same data, both solvers produce the same optimal objective within tolerance (1e-8 relative)
   - Same LP, same cuts added, both produce the same cut-tightened objective within tolerance
   - Same LP with basis warm-start, both produce optimal in similar iteration counts (within 2x)
   - Dual values from both solvers agree within tolerance after normalization (verify the SS8 normalization contract)

5. **SS3. Error Path Tests**: Tests that verify correct error reporting.
   - Infeasible LP: construct a 2-variable LP with contradictory bounds; verify `SolverError::Infeasible` is returned
   - Unbounded LP: construct an LP with no upper bound on the objective direction; verify `SolverError::Unbounded` is returned
   - These tests are solver-variant-independent (both HiGHS and CLP must return the same error category)

6. **SS4. LP Lifecycle Tests**: Tests that verify the correct ordering of operations.
   - Full lifecycle: load -> patch -> add cuts -> solve -> get basis -> solve with basis -> reset -> load again -> solve
   - Verify that each step transitions the solver to the expected state
   - Verify that warm-start reduces iteration count compared to cold start on the same LP

7. **Cross-References** section: At least 8 entries. Must include: `solver-interface-trait.md` (SS1, SS2, SS3), `solver-abstraction.md` (SS2, SS4, SS6, SS8, SS9), `solver-highs-impl.md`, `solver-clp-impl.md`, `backend-testing.md` (reference pattern), `risk-measure-testing.md` (naming convention pattern).

### Content Guidelines

- Use a small LP (2-4 variables, 3-5 constraints) that is analytically solvable. The LP should have: at least one state variable, one decision variable, one cut-relevant constraint, and one structural constraint.
- Provide the full LP data explicitly in the shared fixture (objective vector, constraint matrix in CSC, column bounds, row bounds) so that expected solutions can be verified by hand.
- For cut addition tests, provide explicit cut coefficients and intercepts. The cut must be tight enough to change the objective value.
- Numerical tolerance for cross-solver equivalence: 1e-8 relative for objective and primal values, 1e-6 for dual values (duals may have larger solver-specific variation).
- Do NOT include executable test code.
- Do NOT test solver-internal retry logic (that is encapsulated and not observable through the trait interface).
- Do NOT test LP scaling (that is solver-workspaces.md territory).
- Test naming convention: `test_solver_{variant}_{method}_{scenario}` (all lowercase, snake_case), following the pattern from epics 01-02 conformance tests.

## Acceptance Criteria

- [ ] Given the file `src/specs/architecture/solver-interface-testing.md` exists, when reading it, then it opens with a Purpose paragraph and the shared LP fixture with explicit data
- [ ] Given SS1, when reading the conformance tests, then there are at least 12 tests covering all 8+1 operations
- [ ] Given the shared fixture, when reading the LP data, then the optimal solution, dual values, and objective can be verified by hand
- [ ] Given SS2, when reading cross-solver equivalence tests, then they verify that HiGHS and CLP produce the same results within tolerance
- [ ] Given SS3, when reading error path tests, then infeasible and unbounded cases are covered with explicit LP constructions
- [ ] Given SS4, when reading lifecycle tests, then the full load-patch-solve-basis-reset cycle is tested
- [ ] Given the dual normalization tests, when reading them, then they verify the canonical sign convention from `solver-abstraction.md` SS8
- [ ] Given any test, when reading Expected Observable Behavior, then values are concrete (specific objective values, primal values, iteration counts)

## Implementation Guide

### Suggested Approach

1. Read `src/specs/architecture/solver-interface-trait.md` (ticket-011 output) for the method contracts
2. Read `src/specs/architecture/risk-measure-testing.md` for the conformance test table format and naming convention
3. Read `src/specs/hpc/backend-testing.md` for the gold-standard test spec structure (especially the parameterized-by-backend pattern)
4. Design a small LP: minimize `c'x` subject to `Ax <= b`, `x >= 0`, with 2-3 variables and 3-4 constraints. Choose coefficients so the optimal solution has clean rational values (e.g., integers or simple fractions).
5. Hand-compute the optimal primal, dual, and basis for the shared fixture LP
6. Design 1-2 Benders cuts that tighten the objective when added
7. Write test tables following the `test_solver_{variant}_{method}_{scenario}` convention

### Key Files to Modify

- **Create**: `src/specs/architecture/solver-interface-testing.md`

### Patterns to Follow

- Same table format as `risk-measure-testing.md` and other architecture testing specs: Test Name, Input Scenario, Expected Observable Behavior, Variant columns
- Shared fixture declared once at the top of SS1, before any test tables; tests reference it
- Cross-solver equivalence tests in a dedicated section (SS2), separate from per-method conformance tests (SS1)
- Error path tests in a dedicated section (SS3), not mixed with success-path tests
- Test naming convention: `test_solver_{variant}_{method}_{scenario}`

### Pitfalls to Avoid

- Do NOT use large LPs. Keep the fixture at 2-4 variables, 3-5 constraints for hand-computability.
- Do NOT test retry logic internals. The conformance suite tests the observable interface, not internal solver strategies.
- Do NOT test LP scaling. That is `solver-workspaces.md` territory.
- Do NOT include the convention blockquote in this file. Convention blockquotes belong in trait specs only, not in testing specs (established in learnings).
- Do NOT test solver-specific behavior (e.g., HiGHS presolve settings). Only test behavior specified in the trait contract.
- Do NOT assume any specific iteration count for cold starts. Only test relative properties (warm-start uses fewer iterations than cold start).

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-011 (trait spec defines the contracts being tested)
- **Blocks**: ticket-013 (cross-reference updates)

## Effort Estimate

**Points**: 3
**Confidence**: High
