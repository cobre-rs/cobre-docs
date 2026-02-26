# ticket-007 Audit cobre-cli API Surface Completeness

## Context

### Background

cobre-cli is the binary entrypoint for the minimal viable SDDP solver: `mpiexec -n N cobre CASE_DIR`. It handles the execution lifecycle (MPI initialization, command-line parsing, config resolution, validation, data broadcast, training, simulation, finalization), exit codes, and `--validate-only` mode. It is Phase 8 (the final phase) in the implementation ordering.

### Relation to Epic

This is ticket 7 of 8 in the per-crate completeness audit. cobre-cli has a smaller API surface than most crates (it is primarily a binary, not a library), but its lifecycle orchestration and exit code scheme are critical for correctness.

### Current State

The cobre-cli API surface is specified in:

- `src/specs/architecture/cli-and-lifecycle.md` -- Execution lifecycle, exit codes, phases, config resolution (328 lines)
- `src/specs/configuration/configuration-reference.md` -- config.json and stages.json schema (392 lines)
- `src/specs/architecture/validation-architecture.md` -- Validation pipeline (referenced from CLI)
- `src/specs/hpc/slurm-deployment.md` -- SLURM job integration (231 lines)
- `src/specs/interfaces/structured-output.md` -- JSON output format (741 lines)
- `src/crates/cli.md` -- Crate overview (87 lines)

## Specification

### Requirements

Audit cobre-cli across five categories.

**Category 1: Public Types**

- CLI argument struct (command-line options)
- Exit code enum (0-5 + signal codes)
- Config resolution result types
- Execution phase enum (if any)

**Category 2: Public Functions**

- `main()` entry point and lifecycle orchestration
- Config resolution function (merge defaults, config.json, command-line overrides)
- `--validate-only` mode function
- MPI initialization coordination

**Category 3: Error Types**

- Exit code mapping (which errors map to which exit codes)
- Error reporting format (structured output vs stderr)

**Category 4: Trait Implementations**

- No traits defined in cobre-cli (it is a binary crate)

**Category 5: Crate Boundary Interactions**

- cobre-cli -> cobre-io: calls load_case, orchestrates output writing
- cobre-cli -> cobre-sddp: calls training loop and simulation pipeline
- cobre-cli -> cobre-core: reads System, subscribes to TrainingEvent
- cobre-cli -> cobre-comm (implicit via cobre-sddp): MPI lifecycle

### Inputs/Props

- `src/specs/architecture/cli-and-lifecycle.md`
- `src/specs/configuration/configuration-reference.md`
- `src/specs/architecture/validation-architecture.md`
- `src/specs/hpc/slurm-deployment.md`
- `src/specs/interfaces/structured-output.md`
- `src/crates/cli.md`

### Outputs/Behavior

Audit report written to `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-007-cobre-cli.md`.

### Error Handling

Same as ticket-001.

## Acceptance Criteria

- [ ] Given cli-and-lifecycle.md, when the execution lifecycle phases are inspected, then every phase has a clear entry/exit condition and the functions called in each phase are identified with their source crates
- [ ] Given the exit code scheme (0-5 + signal codes), when each code is inspected, then it maps to a specific error condition with documentation
- [ ] Given cli-and-lifecycle.md SS5.2a, when the Phase-Training Loop alignment table is inspected, then every lifecycle phase maps to specific spec sections
- [ ] Given the config resolution function, when its inputs (defaults, config.json, command-line overrides) are inspected, then the merge order and conflict resolution rules are specified
- [ ] Given the `--validate-only` mode, when its behavior is inspected, then the function exits with a specific exit code after validation without proceeding to training
- [ ] Given each crate boundary interaction, when traced, then the function calls from cobre-cli into cobre-io, cobre-sddp, and cobre-core are documented with parameter types

## Implementation Guide

### Suggested Approach

1. Read `src/crates/cli.md` for overview
2. Read `src/specs/architecture/cli-and-lifecycle.md` fully -- the primary architecture spec
3. Read `src/specs/configuration/configuration-reference.md` for config types
4. Trace the lifecycle: what functions does cobre-cli call in what order?
5. Verify exit code scheme is complete
6. Check GAP-027 (training.forward_passes default) and GAP-035 (example config.json mismatched defaults) for current state

### Key Files to Modify

- **Create**: `plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-007-cobre-cli.md`

### Patterns to Follow

Same as ticket-001.

### Pitfalls to Avoid

- cobre-cli is a binary crate, not a library. It has no public API in the traditional sense -- audit the execution lifecycle and the functions it calls from other crates.
- GAP-027 and GAP-035 affect configuration defaults. Document their current state.
- Do not audit TUI integration (deferred crate cobre-tui).

## Testing Requirements

### Unit Tests

Not applicable -- documentation audit ticket.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

Verify `mdbook build` passes from repo root.

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-013 (Phase 5-8 readiness assessment uses this report)

## Effort Estimate

**Points**: 2
**Confidence**: High
