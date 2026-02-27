# Epic 01: Scenario Generation Spec Updates

## Goal

Fix the InSample description inconsistency in `scenario-generation.md` SS3.2, add a new SS2.3b section documenting the `sampling_method` -> opening tree generation connection, and add a clarifying note in SS2.2 that the seed-based approach eliminates the need for any noise broadcast.

## Scope

All changes are within a single file: `src/specs/architecture/scenario-generation.md`.

### Changes

1. **SS3.2 InSample description fix** -- Replace "The sampled noise feeds the PAR model to produce inflow realizations" with a description consistent with the LP-based architecture where noise (epsilon) is fixed as an LP variable via `patch_row_bounds` on the AR dynamics constraint row
2. **New SS2.3b section** -- Add "Sampling Method and Opening Tree Generation" between SS2.3a (OpeningTree Rust Type) and SS2.4 (Time-Varying Correlation Profiles), connecting `input-scenarios.md` SS1.8 `sampling_method` field to how the opening tree is generated
3. **SS2.2 clarifying note** -- Add a note that deterministic per-rank seed derivation means no MPI broadcast of noise data is needed

## Tickets

| #   | Ticket     | Title                                                         |
| --- | ---------- | ------------------------------------------------------------- |
| 1   | ticket-001 | Fix InSample description and add seed-broadcast clarification |
| 2   | ticket-002 | Add sampling_method section to scenario-generation.md         |

## Dependencies

- None (this epic modifies only `scenario-generation.md`)

## Completion Criteria

- SS3.2 InSample description accurately reflects the LP-based noise injection mechanism
- SS2.3b documents the SAA sampling method connection and deferred alternatives
- SS2.2 contains a note clarifying that no MPI broadcast of noise data occurs
- `mdbook build` exits 0 with no new warnings
