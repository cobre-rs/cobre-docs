# ticket-003 Audit Parameter Value Consistency Across Overview and Math Specs

## Context

### Background

The Cobre specification corpus contains numeric parameter values (system dimensions, typical sizes, LP variable/constraint counts) in multiple locations. The canonical sources are `notation-conventions.md` (index set typical sizes in section 2) and `production-scale-reference.md` (production dimensions in section 1, variable/constraint counts in section 3). Individual math specs and HPC specs also reference these values in their own tables and text. Any discrepancy between these values creates confusion about the true production target.

### Relation to Epic

This ticket complements the symbol-level audit (tickets 001-002) by auditing the **numeric values** associated with those symbols. While tickets 001-002 check that "$\mathcal{H}$" means "hydro plants" everywhere, this ticket checks that "$|\mathcal{H}| = 160$" is stated consistently everywhere it appears.

### Current State

Known parameter values that appear in multiple places:

- Hydros: 160 (notation-conventions section 2, production-scale-reference section 1)
- Thermals: 130
- Buses: 6
- Lines: 10
- Stages: 120
- Blocks: typically 3
- AR order: up to 12 (max), typically 6 (average)
- Forward passes: 200 (production-scale-reference) -- **user wants 192**
- State dimension: 1,120 (at avg AR(6)), up to 2,080 (at max AR(12))
- Total variables: 6,923 (calculator with defaults), ~7,500 (spec worst-case estimate)
- Total constraints: 20,788 (calculator), ~17,000-22,000 (spec estimate)

## Specification

### Requirements

1. Extract every numeric value from `notation-conventions.md` section 2 "Typical Size" column and section 3 parameter tables
2. Extract every numeric value from `production-scale-reference.md` sections 1-4
3. For each value, search all specs for references to the same quantity and verify consistency
4. Check that dimensional formulas (e.g., state dimension = N_hydro + sum(AR_orders)) are stated consistently across specs
5. Check that the LP sizing calculator default values match the "production scale" values in the docs

### Inputs/Props

**Files to read** (all paths relative to `/home/rogerio/git/cobre-docs/src/`):

| File                                           | Purpose                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `specs/overview/notation-conventions.md`       | Section 2 typical sizes, section 3 parameter tables               |
| `specs/overview/production-scale-reference.md` | Full file -- all dimension tables, formulas, calculator reference |
| `specs/math/sddp-algorithm.md`                 | Section 1 (problem context), section 5 (state variables)          |
| `specs/math/lp-formulation.md`                 | Any inline references to LP size                                  |
| `specs/math/cut-management.md`                 | Section 5 (cut growth), section 9 (selection parameters)          |
| `specs/math/par-inflow-model.md`               | AR model parameters                                               |
| `specs/hpc/work-distribution.md`               | Section 2.3 references to production-scale parameters             |
| `specs/hpc/communication-patterns.md`          | Section 2 data payload sizes use production dimensions            |
| `specs/hpc/memory-architecture.md`             | Section 2.1 per-rank memory budget uses production dimensions     |
| `specs/hpc/hybrid-parallelism.md`              | References to rank/thread counts                                  |
| `specs/architecture/training-loop.md`          | References to forward pass counts, iteration counts               |
| `specs/cross-reference-index.md`               | Master index -- may reference dimensions                          |

**External file to read**:
| File | Purpose |
|------|---------|
| `~/git/powers/scripts/lp_sizing.py` | Calculator default values in SystemConfig dataclass |

### Outputs/Behavior

Produce a findings report:

```markdown
## Findings: Parameter Value Consistency

### Summary

- Total parameter values checked: N
- Consistent: N
- Inconsistent: N
- Forward pass count (200 vs user target 192): locations listed

### Value Cross-Reference Table

| Parameter | Canonical Value | notation-conventions | production-scale-reference | sddp-algorithm | work-distribution | communication-patterns | memory-architecture | calculator defaults |
| --------- | --------------- | -------------------- | -------------------------- | -------------- | ----------------- | ---------------------- | ------------------- | ------------------- |
| Hydros    | 160             | s2: 160              | s1: 160                    | s1: 160+       | s2.3: 160         | s2.1: 160              | s2.1: 160           | 160                 |
| ...       | ...             | ...                  | ...                        | ...            | ...               | ...                    | ...                 | ...                 |

### Dimensional Formula Cross-Check

| Formula                     | production-scale-reference | calculator code | Consistent? |
| --------------------------- | -------------------------- | --------------- | ----------- |
| N_STATE = N_hydro + sum(AR) | s2: yes                    | line N: yes     | YES/NO      |
| ...                         | ...                        | ...             | ...         |

### Forward Pass Count Locations

[List every file and line where 200 appears as forward pass count]
```

### Error Handling

- If a spec references a different value than the canonical source, flag it with both values
- If a spec references a range (e.g., "17,000-22,000") that contains the calculator value (20,788), mark it as CONSISTENT (range includes precise value)
- If the calculator output differs from the spec, note both the calculator value and the spec value

## Acceptance Criteria

- [ ] Given notation-conventions section 2 defines typical sizes for each index set, when these sizes appear in other specs, then they are verified to match or have an explained reason for divergence
- [ ] Given production-scale-reference section 3 defines exact counting formulas, when the calculator implements equivalent formulas, then they produce identical results
- [ ] Given the calculator default SystemConfig uses specific values, when production-scale-reference section 3.4 references calculator output, then the cited numbers (6,923 variables, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts) match actual calculator output with those defaults
- [ ] Given the user wants 192 forward passes (not 200), when all specs are searched for "200" in forward pass context, then every location is identified for later update

## Implementation Guide

### Suggested Approach

1. Run the LP sizing calculator with defaults and capture exact output (the output should match: 6,923 vars, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts/stage)
2. Build a parameter inventory from notation-conventions and production-scale-reference
3. Search each target spec for these parameter values
4. Cross-check the exact counting formulas in production-scale-reference section 3.3 against the calculator code line by line
5. Search ALL spec files for the number "200" in forward pass context to catalog every location that needs updating to 192

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-01-internal-formula-value-consistency/findings-003.md`

### Patterns to Follow

- For the calculator cross-check, map each line of the calculator's `calculate_sizing()` function to the corresponding formula line in production-scale-reference section 3.3
- For the forward pass search, use grep across all `.md` files for "200" and filter to forward pass context

### Pitfalls to Avoid

- The number "200" appears in many contexts (e.g., block duration "200 hours" for LEVE, InfiniBand "200 Gb/s", deficit cost "1,000-10,000"); do not confuse these with forward pass count
- The calculator uses `avg_ar_order = 6` by default, but `max_ar_order = 12`. The specs sometimes use 12 for worst-case estimates and 6 for typical estimates -- both are valid in their context
- production-scale-reference section 3.1 uses worst-case AR(12) in its "Typical Count" column (showing 1,920 for AR lags), while the calculator with avg_ar_order=6 shows 960. This is a known discrepancy explained by the note in section 3.4 -- flag it but do not classify as an error

## Testing Requirements

### Unit Tests

N/A (audit ticket)

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: None (can run in parallel with tickets 001-002)
- **Blocks**: ticket-005

## Effort Estimate

**Points**: 3
**Confidence**: High
