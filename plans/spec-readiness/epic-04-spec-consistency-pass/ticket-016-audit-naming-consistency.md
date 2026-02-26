# ticket-016 Audit Naming Consistency Across Trait Specs

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Verify naming consistency across all trait specs and between trait specs and their source specs. Check that: (1) enum variant names match between the trait spec and extension-points.md (e.g., `Expectation` vs `expectation` -- the trait should use Rust PascalCase but document the JSON config string), (2) method names are consistent in style across all 6 trait specs (e.g., all use `evaluate` or all use `compute`, not a mix), (3) type names for supporting types do not conflict with each other or with existing types in the spec corpus. Fix any inconsistencies found.

## Anticipated Scope

- **Files likely to be modified**: Potentially any of the 12 new trait/test spec files if naming inconsistencies are found
- **Key decisions needed**: Canonical naming style for trait methods across all 6 traits; how to handle cases where the source spec uses a different term than the trait spec
- **Open questions**: Should the naming audit also cover the communicator-trait.md to ensure the new traits follow the same conventions?

## Dependencies

- **Blocked By**: ticket-013 (all specs must be in final form before naming audit)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
