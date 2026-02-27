# ticket-007 Fix Low-Priority Cross-References Entry Precision in simulation-architecture

## Context

### Background

Report-030 finding F3 (LOW severity) identified that the Cross-References entry for `output-infrastructure.md` in `simulation-architecture.md` is imprecise. The current entry reads:

```
- [Output Infrastructure](../data-model/output-infrastructure.md) -- Manifests, MPI partitioning, crash recovery
```

This description does not acknowledge the new SS6 (Output Writer API) that was added in Epic 07. SS3.4 result types in `simulation-architecture.md` are consumed by `SimulationParquetWriter` in `output-infrastructure.md` SS6.2, but the Cross-References entry only mentions the older content (manifests, MPI partitioning, crash recovery).

### Relation to Epic

This is the third and final ticket in Epic 3 (Cross-Reference Fixes). It handles the low-priority cosmetic fix F3. It is independent of tickets 005 and 006 and can be done in any order.

### Current State

File: `src/specs/architecture/simulation-architecture.md`

**Cross-References section** (line 770):

```
- [Output Infrastructure](../data-model/output-infrastructure.md) -- Manifests, MPI partitioning, crash recovery
```

The entry mentions only the original SS1-SS5 content of `output-infrastructure.md`. It does not mention SS6 (Output Writer API), SS6.2 (`SimulationParquetWriter`), or the connection between `SimulationScenarioResult` (defined in this file's SS3.4.3) and the writer that consumes it.

## Specification

### Requirements

1. **Update the Cross-References entry for `output-infrastructure.md`** in `simulation-architecture.md` to include SS6 acknowledgment. The updated entry should mention:
   - Manifests and crash recovery (SS1) -- existing content, keep
   - MPI Hive partitioning (SS2-SS4) -- existing content, keep
   - Output Writer API (SS6) including `SimulationParquetWriter` (SS6.2) which consumes `SimulationScenarioResult` from SS3.4

   Suggested updated entry:

   ```
   - [Output Infrastructure](../data-model/output-infrastructure.md) -- Manifests and crash recovery (SS1), MPI Hive partitioning (SS2-SS4), `SimulationParquetWriter` output writer API (SS6.2)
   ```

### Inputs/Props

- Current content of `src/specs/architecture/simulation-architecture.md` Cross-References section

### Outputs/Behavior

- Modified `src/specs/architecture/simulation-architecture.md` with improved Cross-References entry

### Error Handling

- Not applicable (spec document editing)

### Out of Scope

- Modifying other Cross-References entries in the same file
- Modifying `output-infrastructure.md`
- Updating the cross-reference index (ticket-006 handles that)
- Adding new Cross-References entries (only updating the existing one)

## Acceptance Criteria

- [ ] Given the Cross-References section of `simulation-architecture.md`, when the `output-infrastructure.md` entry is read, then it mentions "SS6" or "SimulationParquetWriter" or "Output Writer API"
- [ ] Given the Cross-References section of `simulation-architecture.md`, when the `output-infrastructure.md` entry is read, then it still mentions manifests and MPI partitioning (existing content not removed)
- [ ] Given `mdbook build` is run from the repo root, when it completes, then it exits 0 with no new warnings

## Implementation Guide

### Suggested Approach

1. Read `simulation-architecture.md` and locate the Cross-References section (line 755)
2. Find the `output-infrastructure.md` entry (line 770)
3. Replace the description text after the `--` with a more complete description that includes SS6
4. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/simulation-architecture.md` -- Cross-References section, line 770

### Patterns to Follow

- Cross-References entries in this file use the pattern: `- [Display Name](./path) -- description with section numbers`
- Example from the same file: `- [Scenario Generation](./scenario-generation.md) -- Sampling scheme abstraction (SS3), scenario distribution (SS5), noise inversion for external scenarios (SS4.3)`
- Section numbers are included in parentheses after the description topic

### Pitfalls to Avoid

- Do NOT remove existing description content (manifests, MPI partitioning, crash recovery) -- only add SS6 acknowledgment
- Do NOT add new entries to the Cross-References section (this ticket only updates the existing entry)
- Per CLAUDE.md, do NOT use the section symbol prefix in architecture spec Cross-References entries -- use `SS` prefix. However, note that the current entry does not use any prefix; adding section numbers in parentheses (e.g., "SS1", "SS6.2") is the correct approach.

## Testing Requirements

### Unit Tests

- Not applicable (spec document)

### Integration Tests

- Run `mdbook build` from repo root; verify exit code 0 and no new warnings
- Read the updated Cross-References entry and verify it mentions SS6 content

### E2E Tests

- Not applicable

## Dependencies

- **Blocked By**: None
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
