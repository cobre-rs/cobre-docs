# ticket-017: Define load_case API and System Crate Boundary Type (GAP-012)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Define the public API `cobre_io::load_case(path: &Path) -> Result<cobre_core::System, LoadError>` that crosses the cobre-io / cobre-core crate boundary. This is the primary contract for how input data enters the system. The `System` type (specified in ticket-004) is the concrete struct produced by the loader. This ticket specifies the function signature, error type, and the loader's responsibility boundary.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/input-loading-pipeline.md` (SS8 -- "transition to in-memory model"), `src/specs/data-model/internal-structures.md` (cross-reference to System type)
- **Key decisions needed**: Whether `LoadError` is a flat enum or uses `thiserror`-derived hierarchy; whether the path argument is a file or directory
- **Open questions**:
  - Does `load_case` perform cross-reference validation (GAP-029) inline or is validation a separate step?
  - Is the return type `System` or `Arc<System>` (considering it will be broadcast via MPI and shared read-only)?
  - Should the function accept a `&Config` parameter for conditional loading, or is the config loaded separately?

## Dependencies

- **Blocked By**: ticket-004 (System type must be defined first)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
