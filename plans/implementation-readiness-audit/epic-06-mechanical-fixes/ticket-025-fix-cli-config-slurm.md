# ticket-025 Fix CLI Config and SLURM Cross-Spec Inconsistencies

## Context

### Background

Three Phase 8 conditions from the readiness verdict involve CLI and configuration cross-spec inconsistencies:

1. **C-15**: `src/specs/hpc/slurm-deployment.md` uses `cobre train --config config.json` as the SLURM job submission example, but the canonical CLI subcommand is `cobre run` (as established in `src/specs/architecture/cli-and-lifecycle.md`). Report-007 Findings F-003 and F-012.

2. **C-16**: The configuration field for the number of forward passes per iteration is inconsistently named across 4 spec files: `training.forward_passes`, `training.num_forward_passes`, and `training.forward_scenarios`. Report-007 Finding F-010.

3. **C-17**: `src/specs/architecture/cli-and-lifecycle.md` specifies a `training.enabled` boolean that controls whether training is skipped (simulation-only mode), but this field is absent from `src/specs/configuration/configuration-reference.md`. Report-007 Finding F-007.

### Relation to Epic

This ticket groups three CLI/configuration consistency fixes that each take hours individually and affect overlapping spec files.

### Current State

- `slurm-deployment.md` uses `cobre train --config` in SLURM script examples.
- `configuration-reference.md` is the canonical configuration schema reference. It does not contain a `training.enabled` field.
- The forward passes field name varies across: `training-loop.md`, `configuration-reference.md`, `cli-and-lifecycle.md`, and `slurm-deployment.md`.

## Specification

### Requirements

1. **C-15**: In `src/specs/hpc/slurm-deployment.md`, replace all occurrences of `cobre train --config` (or similar non-canonical invocations) with `cobre run`. Cross-reference `cli-and-lifecycle.md` SS5 for the canonical lifecycle phase commands.

2. **C-16**: Standardize the config field name to `training.forward_passes` (the most descriptive canonical form) across all 4 spec files where it appears:
   - `src/specs/architecture/training-loop.md`
   - `src/specs/configuration/configuration-reference.md`
   - `src/specs/architecture/cli-and-lifecycle.md`
   - `src/specs/hpc/slurm-deployment.md`
     Search the entire spec corpus for `num_forward_passes` and `forward_scenarios` to find any additional occurrences.

3. **C-17**: Add the `training.enabled` boolean field to `src/specs/configuration/configuration-reference.md` in the `[training]` section. The field should:
   - Default to `true`
   - When set to `false`, skip the training phase and proceed directly to simulation
   - Cross-reference `cli-and-lifecycle.md` SS5 for the lifecycle phase that this field controls

### Inputs/Props

- Report-007 Findings F-003, F-007, F-010, F-012
- `src/specs/hpc/slurm-deployment.md` -- SLURM script examples
- `src/specs/configuration/configuration-reference.md` -- canonical config schema
- `src/specs/architecture/cli-and-lifecycle.md` -- lifecycle phases and CLI commands
- `src/specs/architecture/training-loop.md` -- forward passes reference

### Outputs/Behavior

- Updated `src/specs/hpc/slurm-deployment.md` -- `cobre run` replaces stale invocations
- Updated 4 spec files with standardized `training.forward_passes` field name
- Updated `src/specs/configuration/configuration-reference.md` -- `training.enabled` field added

### Error Handling

Not applicable -- this is a spec authoring task.

## Acceptance Criteria

- [ ] Given `slurm-deployment.md` is searched for `cobre train`, then zero occurrences are found (replaced with `cobre run`)
- [ ] Given the entire `src/specs/` directory is searched for `num_forward_passes`, then zero occurrences are found
- [ ] Given the entire `src/specs/` directory is searched for `forward_scenarios`, then zero occurrences are found
- [ ] Given `configuration-reference.md` is read, when searching for `training.enabled`, then a boolean field definition is found with default `true` and a description of its behavior
- [ ] Given the updated files, when running `mdbook build`, then no errors occur

## Implementation Guide

### Suggested Approach

1. Search `src/specs/` for `cobre train` to find all stale invocation patterns. Replace with `cobre run` in context-appropriate way.
2. Search `src/specs/` for `num_forward_passes` and `forward_scenarios`. Replace all with `forward_passes`. Verify the surrounding context still reads correctly.
3. Read `configuration-reference.md` to find the `[training]` section. Add `training.enabled` with type `bool`, default `true`, description "When false, skip training and proceed directly to simulation."
4. Verify all changes are consistent with `cli-and-lifecycle.md` SS5.

### Key Files to Modify

- `src/specs/hpc/slurm-deployment.md` -- SLURM script CLI fix
- `src/specs/architecture/training-loop.md` -- field name standardization
- `src/specs/configuration/configuration-reference.md` -- field name + new field
- `src/specs/architecture/cli-and-lifecycle.md` -- field name standardization (if needed)

### Patterns to Follow

- Follow the field definition format used in `configuration-reference.md` for other fields.
- Use the lifecycle phase names from `cli-and-lifecycle.md`.

### Pitfalls to Avoid

- Do NOT change the behavior semantics of `training.forward_passes` -- only standardize the name.
- Do NOT remove the SLURM deployment examples -- only fix the CLI invocation syntax.
- Verify that `cobre run` is indeed the correct replacement by checking `cli-and-lifecycle.md` first.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

Verify `mdbook build` completes without errors.

### E2E Tests (if applicable)

Not applicable.

## Dependencies

- **Blocked By**: None
- **Blocks**: None directly

## Effort Estimate

**Points**: 2
**Confidence**: High
