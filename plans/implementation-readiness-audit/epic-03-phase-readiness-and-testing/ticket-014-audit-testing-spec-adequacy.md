# ticket-014 Audit Testing Spec Adequacy

## Context

### Background

The Cobre spec corpus contains 7 testing specification files: 6 architecture testing specs (`risk-measure-testing.md`, `horizon-mode-testing.md`, `sampling-scheme-testing.md`, `cut-selection-testing.md`, `stopping-rule-testing.md`, `solver-interface-testing.md`) and 1 HPC testing spec (`backend-testing.md`). These specs define conformance test suites that verify backend interchangeability -- the central claim of the trait-based architecture. Before implementation begins, the testing specs must be audited for structural completeness, test count adequacy, error path coverage, and conformance to the testing spec conventions documented in CLAUDE.md.

### Relation to Epic

This is the third of three tickets in Epic 03 (Phase Readiness and Testing). It is independent of the phase readiness assessments (tickets 012-013) and can execute in parallel with them. Its findings feed the readiness verdict in ticket-017 (Epic 04).

### Current State

The 7 testing specs currently have the following structure and test counts (verified by inspection):

| Testing Spec                  | Sections (excluding Purpose/Cross-Refs)                                                                                       | Named Test Rows |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `risk-measure-testing.md`     | 3 (SS1 Conformance, SS2 Variant Equivalence, SS3 Numerical Properties)                                                        | 34              |
| `horizon-mode-testing.md`     | 3 (SS1 Conformance, SS2 Validation, SS3 Forward Pass Termination)                                                             | 33              |
| `sampling-scheme-testing.md`  | 4 (SS1 Conformance, SS2 Forward-Backward Separation, SS3 Reproducibility, SS4 Validation)                                     | 29              |
| `cut-selection-testing.md`    | 3 (SS1 Conformance, SS2 Aggressiveness Ordering, SS3 Convergence Properties)                                                  | 21              |
| `stopping-rule-testing.md`    | 3 (SS1 Individual Rule Conformance, SS2 Composition, SS3 Bound Stalling Numerical)                                            | 41              |
| `solver-interface-testing.md` | 5 (SS1 Conformance, SS2 Cross-Solver Equivalence, SS3 Error Path, SS4 LP Lifecycle, SS5 Dual Normalization)                   | 59              |
| `backend-testing.md`          | 4 (section 1 Conformance, section 2 Interchangeability, section 3 Performance Regression, section 4 Determinism Verification) | 30              |

The CLAUDE.md testing spec conventions define the required patterns: shared fixtures at top of SS1, test naming convention paragraph, naming pattern `test_{trait}_{variant}_{method}_{scenario}`, dedicated error path sections (SS3), LP lifecycle sections for sequential methods, cross-solver equivalence tolerances table, finite-difference sensitivity checks for dual/gradient postconditions.

The Epic 02 learnings note: "Fix F3 (`patch_rhs_bounds` in `solver-interface-testing.md`) before the testing spec adequacy assessment; the 7 stale occurrences will produce misleading coverage analysis." This ticket should note the stale naming but not be blocked by it.

## Specification

### Requirements

For each of the 7 testing specs, assess the following six adequacy dimensions:

1. **Structural compliance**: Does the spec follow the CLAUDE.md testing spec patterns? Specifically: shared fixture declared at top of SS1, "Test naming convention:" paragraph before first table, naming pattern `test_{trait}_{variant}_{method}_{scenario}`, convention blockquote absent.
2. **Conformance test coverage**: Does the conformance test suite (SS1) cover all trait methods and all variants? Cross-reference the corresponding trait spec to identify any untested methods or variants.
3. **Error path coverage**: Are error paths tested in a dedicated section? For traits that return `Result`, are all `SolverError`/`CommError` variants exercised? For traits with validation rules, are all rejection cases tested?
4. **Cross-solver/cross-backend equivalence**: For specs that test multiple backends (`solver-interface-testing.md`, `backend-testing.md`), are explicit tolerance tables present with the values specified in CLAUDE.md (objective 1e-8 relative, primal 1e-8 absolute, dual 1e-6 absolute, warm-start iteration ratio 2x)?
5. **Finite-difference sensitivity checks**: Are finite-difference checks specified for all traits that have dual or gradient postconditions? Per CLAUDE.md: "the strongest dual verification; use whenever a dual or gradient is a first-class postcondition."
6. **Test count adequacy**: Does the test count meet the expected floor for the trait's complexity? Assess whether the test count is proportional to the trait's method count, variant count, and behavioral complexity. Minimum test counts are floors, not targets.

Per-spec verdicts use a three-level scale:

- **ADEQUATE**: All 6 dimensions satisfied, no missing tests identified
- **ADEQUATE WITH GAPS**: Most dimensions satisfied, specific enumerated gaps identified but they do not block implementation
- **INADEQUATE**: Critical dimensions missing (e.g., no error path coverage, missing conformance tests for a trait method)

### Inputs/Props

The audit reads the testing spec files directly:

- `/home/rogerio/git/cobre-docs/src/specs/architecture/risk-measure-testing.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/horizon-mode-testing.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/sampling-scheme-testing.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/cut-selection-testing.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/stopping-rule-testing.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-interface-testing.md`
- `/home/rogerio/git/cobre-docs/src/specs/hpc/backend-testing.md`

And cross-references the corresponding trait specs:

- `/home/rogerio/git/cobre-docs/src/specs/architecture/risk-measure-trait.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/horizon-mode-trait.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/sampling-scheme-trait.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/cut-selection-trait.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/stopping-rule-trait.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-interface-trait.md`
- `/home/rogerio/git/cobre-docs/src/specs/hpc/communicator-trait.md`

### Outputs/Behavior

A single Markdown report file: `plans/implementation-readiness-audit/epic-03-phase-readiness-and-testing/report-014-testing-adequacy.md`

The report structure:

1. **Executive summary** -- one-paragraph overview with aggregate statistics: total tests across all specs, number of specs at each verdict level, top-3 gaps by severity
2. **Per-spec assessments** (7 sub-sections, one per testing spec) -- each containing:
   - 6-dimension assessment with pass/fail per dimension and evidence
   - Test count and method coverage table (trait methods vs test coverage)
   - Identified missing tests (if any), with specific test names and rationale
   - Per-spec verdict (ADEQUATE / ADEQUATE WITH GAPS / INADEQUATE)
3. **Cross-spec pattern analysis** -- identify patterns that hold across all specs (e.g., all have shared fixtures, all follow naming convention) and patterns that are inconsistent (e.g., some have error path sections and some do not)
4. **Summary table** -- spec name, test count, method coverage %, error paths covered (Y/N), equivalence tolerances (Y/N/N/A), finite-diff checks (Y/N/N/A), verdict
5. **Missing tests inventory** -- consolidated list of all identified missing tests across all 7 specs, with priority (High/Medium/Low) based on whether the missing test covers a critical behavioral contract

### Error Handling

If a testing spec file does not exist at the expected path, note it as missing in the report and skip the assessment for that spec.

## Acceptance Criteria

- [ ] Given the report file `report-014-testing-adequacy.md` exists, when opened, then it contains exactly 5 sections (executive summary, 7 per-spec assessments grouped under a single section, cross-spec pattern analysis, summary table, missing tests inventory)
- [ ] Given each per-spec assessment, when reviewed, then it evaluates all 6 dimensions (structural compliance, conformance coverage, error path coverage, cross-backend equivalence, finite-diff checks, test count adequacy) with pass/fail evidence
- [ ] Given the `solver-interface-testing.md` assessment, when the cross-solver equivalence dimension is evaluated, then it verifies the presence of the tolerance table with the CLAUDE.md-specified values (objective 1e-8 relative, primal 1e-8 absolute, dual 1e-6 absolute, warm-start iteration ratio 2x)
- [ ] Given the summary table, when reviewed, then it contains exactly 7 rows (one per testing spec) with columns for spec name, test count, method coverage percentage, and per-spec verdict
- [ ] Given the missing tests inventory, when reviewed, then each entry specifies a concrete test name following the `test_{trait}_{variant}_{method}_{scenario}` pattern, the rationale for why it is needed, and a priority level

## Implementation Guide

### Suggested Approach

1. For each of the 7 testing specs, read the full file and extract: section structure, shared fixture location, test naming convention paragraph, all test names from table rows
2. For each testing spec, read the corresponding trait spec and extract: all method signatures, all variants, all error types, all postconditions that involve duals or gradients
3. Build a coverage matrix: trait methods on rows, test names on columns, mark which methods are covered by which tests
4. Check structural compliance against CLAUDE.md patterns: shared fixture at top of SS1, naming convention paragraph, naming pattern, convention blockquote absent
5. Check error path coverage: look for dedicated error path sections (SS3 per CLAUDE.md), count the error variants tested, identify untested error variants
6. Check cross-backend equivalence for solver-interface and backend testing: verify tolerance table presence and values
7. Check finite-difference sensitivity: identify which trait methods have dual/gradient postconditions (primarily `solver-interface-trait.md` `solve`/`solve_with_basis` and `risk-measure-trait.md` `aggregate_cut`), verify that finite-diff tests exist for each
8. Compile the summary table and missing tests inventory

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-03-phase-readiness-and-testing/report-014-testing-adequacy.md` (new file, the sole deliverable)

### Patterns to Follow

- Follow the report format established in Epic 01 and Epic 02: title with report number, date, scope, clear section numbering
- Use the three-level verdict scale consistently
- For the missing tests inventory, follow the test naming convention from CLAUDE.md: `test_{trait}_{variant}_{method}_{scenario}`
- Note the `patch_rhs_bounds` stale naming in `solver-interface-testing.md` (7 occurrences, per Epic 02 learnings finding F3) as a finding but do not let it distort the coverage analysis -- the tests exist and are correctly specified, they just use the old method name

### Pitfalls to Avoid

- Do not conflate "test not in the testing spec" with "test not needed" -- some methods may be simple enough that a single conformance test suffices; others may be complex enough to need 10+ tests
- Do not count deferred variants (CVaR risk measure tests, CLP solver tests, Cyclic horizon tests, etc.) as missing -- only assess coverage for the minimal viable solver variants (Expectation, HiGHS, Finite, InSample, Level-1, all 5 stopping rules, MPI + Local backends)
- Do not audit the trait specs themselves -- only audit the testing specs. The trait specs were audited in Epic 01
- The `backend-testing.md` file uses plain numbered sections (`## 1.`, `## 2.`) rather than `SS` prefix because it is in `src/specs/hpc/`, not `src/specs/architecture/` -- this is correct per CLAUDE.md conventions, not a violation

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket producing a Markdown report.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: None (testing specs are independent of per-crate audit results)
- **Blocks**: ticket-017 (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: High
