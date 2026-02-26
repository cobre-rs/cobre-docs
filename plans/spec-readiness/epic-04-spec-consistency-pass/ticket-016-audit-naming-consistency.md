# ticket-016 Audit Naming Consistency Across Trait Specs

## Context

### Background

Epics 01-03 produced 6 trait specs and 6 testing specs, each defining enum types, method names, supporting types, and configuration enums. These were written across multiple sessions with different tickets, creating a risk that naming conventions diverged between specs. Each trait spec draws its variant names from the source spec (`extension-points.md` for the five algorithm-variant traits, `solver-abstraction.md` for the solver interface), but the trait specs also introduce new type names (config enums, error types, supporting structs) that must be consistent with each other and with the broader spec corpus.

Additionally, the testing specs introduce test naming conventions using the pattern `test_{trait}_{variant}_{method}_{scenario}`. The `{variant}` field semantics vary by trait type: for enum-dispatch traits, `{variant}` is the enum variant name (e.g., `expectation`, `cvar`); for the solver interface, `{variant}` is the backend name (`highs`, `clp`). This convention must be consistent across all 6 testing specs.

### Relation to Epic

This ticket is one of four parallel consistency checks in Epic 04. It focuses on naming consistency -- ensuring that enum variant names, method names, type names, and test naming conventions are uniform across the 12 new specs. Naming inconsistencies create confusion for implementors who must map spec names to Rust identifiers.

### Current State

The 6 trait specs define the following primary types:

| Trait Spec                  | Primary Enum              | Variant Names                                                                         | Primary Methods                                                                                                           |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `risk-measure-trait.md`     | `RiskMeasure`             | `Expectation`, `CVaR`                                                                 | `aggregate_cut`, `evaluate_risk`                                                                                          |
| `horizon-mode-trait.md`     | `HorizonMode`             | `Finite`, `Cyclic`                                                                    | `successors`, `is_terminal`, `discount_factor`, `validate`, `season`, `should_terminate_forward`                          |
| `sampling-scheme-trait.md`  | `SamplingScheme`          | `LatinHypercube`, `MonteCarlo`                                                        | `sample_forward`, `requires_noise_inversion`, `backward_tree_source`                                                      |
| `cut-selection-trait.md`    | `CutSelectionStrategy`    | `KeepAll`, `Dominated`                                                                | `should_run`, `select`, `update_activity`                                                                                 |
| `stopping-rule-trait.md`    | `StoppingRule`            | `IterationLimit`, `TimeLimit`, `BoundStalling`, `SimulationBased`, `GracefulShutdown` | `evaluate` (individual), `should_stop` (composed)                                                                         |
| `solver-interface-trait.md` | `SolverInterface` (trait) | N/A (trait, not enum)                                                                 | `load_model`, `add_cut_rows`, `patch_rhs_bounds`, `solve`, `solve_with_basis`, `reset`, `get_basis`, `statistics`, `name` |

Each trait spec also defines:

- A `*Config` enum for deserialization (e.g., `RiskMeasureConfig`, `StoppingRuleConfig`)
- Supporting types (e.g., `BackwardOutcome`, `Successor`, `NoiseVector`, `CutMetadata`, `MonitorState`)
- The solver interface additionally defines error types (`SolverError`), solution types (`LpSolution`, `Basis`), and template types (`StageTemplate`, `CutBatch`)

The communicator trait (`src/specs/hpc/communicator-trait.md`) is the seventh trait spec but follows HPC conventions. It should be included in the naming audit for cross-consistency.

## Specification

### Requirements

The naming audit has four distinct checks:

**Check 1: Enum variant names vs. source spec.** For each of the 5 algorithm-variant trait specs, verify that the enum variant names match the variant names in `extension-points.md` section 2 (risk measure), section 3 (cut selection/formulation), section 4 (horizon mode), section 5 (sampling scheme), and section 8 (stopping rules). The trait spec should use Rust PascalCase for the variant name and document the JSON config string (snake_case) in the `*Config` enum.

**Check 2: Method naming consistency across trait specs.** Verify that method names follow a consistent style:

- Query methods returning boolean: `is_*` or `should_*` prefix
- Computation methods: verb-based names (`evaluate`, `aggregate_cut`, `select`, `sample_forward`, `solve`)
- Accessor methods: `get_*` or noun-based names (`statistics`, `name`, `rank`, `size`)

Look for inconsistencies such as one spec using `compute_risk` while another uses `evaluate_risk`, or one using `get_statistics` while another uses `statistics`.

**Check 3: Supporting type name conflicts.** Verify that no two trait specs define types with the same name but different structures. For example, if both `risk-measure-trait.md` and `cut-selection-trait.md` define a type called `CutMetadata`, they must either be the same type or use disambiguated names. Also verify that new type names do not conflict with existing types defined in pre-epic specs (e.g., `solver-abstraction.md`, `training-loop.md`).

**Check 4: Test naming convention consistency.** Verify that all 6 testing specs follow the `test_{trait}_{variant}_{method}_{scenario}` naming convention established in the learnings:

- `{trait}` should be consistent in abbreviation style (e.g., `risk` not `riskmeasure`)
- `{variant}` should use the correct semantics per trait type (enum variant for algorithm traits, backend name for solver)
- `{method}` should match the actual method name from the trait spec
- All names should be lowercase snake_case

### Inputs/Props

- The 6 trait specs in `src/specs/architecture/`
- The 6 testing specs in `src/specs/architecture/`
- `src/specs/hpc/communicator-trait.md` (7th trait spec)
- `src/specs/architecture/extension-points.md` (source of variant names)
- `src/specs/architecture/solver-abstraction.md` (source of solver method names)

### Outputs/Behavior

- A list of all naming inconsistencies found, with the current name and the recommended correction
- Fixes applied directly to the affected spec files
- If no inconsistencies are found, a confirmation that naming is consistent

### Error Handling

If a naming conflict requires a choice between two valid alternatives, prefer the name that is (a) already used more frequently across the corpus, or (b) more closely matches the source spec's terminology.

## Acceptance Criteria

- [ ] Given the 5 algorithm-variant trait specs, when each enum variant name is compared to the corresponding entry in `extension-points.md`, then the PascalCase variant name and the snake_case JSON config string are consistent
- [ ] Given all 6 trait specs, when method names are compared across specs, then boolean-returning methods consistently use `is_*` or `should_*` prefixes and computation methods use a consistent verb style
- [ ] Given all supporting types defined across the 6 trait specs, when type names are compared, then no two different types share the same name
- [ ] Given all 6 testing specs, when test names are compared against the `test_{trait}_{variant}_{method}_{scenario}` convention, then all test names follow the convention with consistent abbreviation and casing
- [ ] Given the communicator trait, when its method naming style is compared to the 6 new trait specs, then the style is consistent (e.g., `rank()` and `size()` as accessor methods follow the same pattern as `name()` and `statistics()` in solver-interface-trait)

## Implementation Guide

### Suggested Approach

1. **Extract all names.** Read each of the 7 trait specs and list: (a) enum type names, (b) enum variant names, (c) method names, (d) supporting type names, (e) config enum names.

2. **Cross-check variant names.** Open `extension-points.md` and compare each variant table entry against the corresponding trait spec's enum definition. Verify PascalCase for Rust and snake_case for JSON.

3. **Compare method names.** Create a table of all methods across all 7 trait specs. Look for stylistic inconsistencies (e.g., `get_basis` vs `basis`, `evaluate` vs `compute`).

4. **Check type name uniqueness.** List all `pub struct` and `pub enum` types across the 7 trait specs. Check for name collisions.

5. **Audit test names.** Read each testing spec's test tables. Verify each test name follows `test_{trait}_{variant}_{method}_{scenario}`. Check that `{trait}` abbreviations are consistent (all testing specs should use the same style of abbreviation).

6. **Apply fixes.** For any inconsistencies found, edit the affected spec files. Prefer changing the less-established name (the one that appears fewer times in the corpus).

### Key Files to Modify

Files to audit (may need fixes if inconsistencies are found):

- `src/specs/architecture/risk-measure-trait.md`
- `src/specs/architecture/horizon-mode-trait.md`
- `src/specs/architecture/sampling-scheme-trait.md`
- `src/specs/architecture/cut-selection-trait.md`
- `src/specs/architecture/stopping-rule-trait.md`
- `src/specs/architecture/solver-interface-trait.md`
- `src/specs/architecture/risk-measure-testing.md`
- `src/specs/architecture/horizon-mode-testing.md`
- `src/specs/architecture/sampling-scheme-testing.md`
- `src/specs/architecture/cut-selection-testing.md`
- `src/specs/architecture/stopping-rule-testing.md`
- `src/specs/architecture/solver-interface-testing.md`
- `src/specs/hpc/communicator-trait.md`

Reference files (read-only for comparison):

- `src/specs/architecture/extension-points.md`
- `src/specs/architecture/solver-abstraction.md`

### Patterns to Follow

- Trait naming: `{Domain}` for enum-dispatch traits (e.g., `RiskMeasure`, `HorizonMode`), `{Domain}Interface` or `{Domain}Trait` for monomorphized traits (e.g., `SolverInterface`, `Communicator`)
- Config naming: `{TraitName}Config` (e.g., `RiskMeasureConfig`, `StoppingRuleConfig`)
- Test naming: `test_{trait}_{variant}_{method}_{scenario}` (e.g., `test_risk_cvar_aggregate_cut_uniform`)
- Method naming: verbs for computations (`evaluate`, `aggregate_cut`, `solve`), `is_*`/`should_*` for boolean queries, bare nouns for accessors (`name`, `statistics`, `rank`)

### Pitfalls to Avoid

- Do not rename types that are already referenced in other specs without also updating all references. If a type name appears in cross-references, the name change must propagate.
- Do not enforce a single verb for all computation methods -- `aggregate_cut`, `evaluate_risk`, `select`, and `solve` are all valid because they describe different domain actions. The check is for inconsistency within the same semantic category, not for identical verbs.
- The `communicator-trait.md` uses `§` for its own sections (HPC convention). Do not flag this as a naming inconsistency.

## Testing Requirements

Not applicable -- this is a specification document audit, not executable code.

## Dependencies

- **Blocked By**: ticket-013 (all specs must be in final form before naming audit -- completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
