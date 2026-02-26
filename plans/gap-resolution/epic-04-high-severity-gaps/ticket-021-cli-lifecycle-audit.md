# ticket-021: Audit CLI Lifecycle for Training Loop Consistency (GAP-016)

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Audit the CLI and Lifecycle spec for consistency with the Training Loop spec's phase boundaries. Verify that MPI initialization happens before config loading, that rank-0 validation is explicitly sequenced, and that the `run` subcommand's phases (which are rank-0 only vs. all-ranks) are correctly documented. The CLI spec was not in the original critical reading list and may have drifted from the training loop spec.

## Anticipated Scope

- **Files likely to be modified**: `src/specs/architecture/cli-and-lifecycle.md` (phase boundary verification and corrections)
- **Key decisions needed**: None anticipated -- this is primarily an audit and consistency fix
- **Open questions**:
  - Does the CLI spec correctly reflect the MPI init -> config load -> validate -> broadcast -> build sequence?
  - Are there phase boundaries in the CLI that contradict the training loop's assumptions about what happens before MPI and what happens after?

## Dependencies

- **Blocked By**: ticket-004 (System type must be defined to verify the broadcast step)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
