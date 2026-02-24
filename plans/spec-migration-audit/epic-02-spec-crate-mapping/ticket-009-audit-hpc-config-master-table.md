# ticket-009 Audit HPC and Config Spec Mapping and Produce Master Spec-to-Crate Table

## Context

### Background

This ticket completes the spec-to-crate mapping audit by covering the 10 remaining specs (8 HPC + 1 config + 1 deferred) and synthesizes findings from tickets 006-009 into the master mapping table.

The HPC section spans multiple crates: the parallelism patterns are implemented in `cobre-sddp` (forward/backward distribution), `ferrompi` (MPI communication primitives), and `cobre-solver` (NUMA-aware workspace allocation). The `slurm-deployment.md` is a deployment document that doesn't map to a specific crate — it maps to the `cobre-cli` binary's interaction with the scheduler environment.

`configuration-reference.md` is a `cobre-cli` spec (it defines the `config.json` schema that the CLI parses), but many configuration fields directly govern `cobre-sddp` training behavior (e.g., `stopping_rules`, `forward_scenarios`). This dual nature must be documented.

`deferred.md` is special: it defines features that are NOT implemented yet. The mapping table must note which deferred feature belongs to which crate (e.g., multi-cut variant → `cobre-sddp`, Monte Carlo backward sampling → `cobre-sddp`, commercial solver support → `cobre-solver`).

### Relation to Epic

This is the final ticket (4 of 4) in Epic 02. It closes the mapping audit and produces the master table.

### Current State

The HPC section was well-mapped by the original migration. The question is whether the HPC section itself is the right container for HPC specs or whether some should live in `specs/architecture/`.

The master mapping table is the primary deliverable of Epic 02. It will feed directly into Epic 05 (cross-reference index creation).

## Specification

### Requirements

**Check M1 — HPC Section Mapping** (8 files):

- `work-distribution.md` → cobre-sddp (forward/backward distribution logic)
- `hybrid-parallelism.md` → cobre-sddp (MPI+OpenMP orchestration) AND ferrompi (MPI primitives)
- `communication-patterns.md` → ferrompi (MPI communication design) AND cobre-sddp (usage)
- `memory-architecture.md` → cobre-sddp (NUMA-aware memory layout) AND cobre-solver (workspace NUMA placement)
- `shared-memory-aggregation.md` → cobre-sddp (OpenMP cut aggregation)
- `checkpointing.md` → cobre-sddp (FCF checkpoint) AND cobre-io (FlatBuffers write/read)
- `synchronization.md` → ferrompi (MPI synchronization primitives) AND cobre-sddp (usage)
- `slurm-deployment.md` → cobre-cli (binary deployment) + no specific crate (deployment docs)

Verify or correct each assignment.

**Check M2 — Config and Deferred Mapping**:

- `configuration-reference.md` → cobre-cli (parses config.json) AND cobre-sddp (most config keys govern training behavior)
- `deferred.md` → produce a per-feature crate assignment table for the 14+ deferred features

**Check M3 — SUMMARY.md Verification**: Confirm all 10 files are listed in SUMMARY.md under their correct section headings.

**Check M4 — Master Spec-to-Crate Table**: Compile the complete 50-row table from all mapping tickets:

```
| # | Spec File | Section | Primary Crate | Secondary Crate(s) | Placement | CRITICAL | HIGH | MEDIUM | LOW |
```

Sort by spec file number. Flag any row where the mapping is in dispute.

**Check M5 — Crate Coverage Summary**: After the 50-row table, produce a per-crate summary:

```
| Crate | Primary Specs (count) | Secondary Specs (count) | Coverage Gaps |
```

A crate has a "coverage gap" if it has a confirmed responsibility that no spec covers.

### Inputs

- Files: `src/specs/hpc/` (8 files), `src/specs/configuration/configuration-reference.md`, `src/specs/deferred.md`
- Mapping tables from tickets 007 and 008
- `SUMMARY.md`: `/home/rogerio/git/cobre-docs/src/SUMMARY.md`

### Outputs

1. A 10-row mapping table for HPC/config/deferred files
2. The complete 50-row master spec-to-crate table
3. A per-crate coverage summary table

### Error Handling

- Deferred feature with no crate assignment: MEDIUM
- HPC spec incorrectly assigned: HIGH
- Coverage gap in any crate: HIGH

## Acceptance Criteria

- [ ] Given `hybrid-parallelism.md`, when crate assignment is determined, then both `cobre-sddp` and `ferrompi` are acknowledged as targets
- [ ] Given `checkpointing.md`, when crate assignment is determined, then both `cobre-sddp` (FCF checkpoint logic) and `cobre-io` (serialization) are acknowledged
- [ ] Given `deferred.md`, when the 14+ deferred features are mapped, then each feature has at least one target crate assigned
- [ ] Given the completed master table, when crate coverage summary is computed, then no crate has a confirmed responsibility with zero spec coverage
- [ ] The ticket produces the 50-row master spec-to-crate table
- [ ] The ticket produces the per-crate coverage summary table

## Implementation Guide

### Suggested Approach

Step 1: For each HPC file, read the Purpose section to confirm crate assignment:

```bash
for f in work-distribution hybrid-parallelism communication-patterns memory-architecture \
          shared-memory-aggregation checkpointing slurm-deployment synchronization; do
  echo "=== $f ==="
  head -8 /home/rogerio/git/cobre-docs/src/specs/hpc/${f}.md
done
```

Step 2: For `deferred.md`, extract all feature section headings and assign each to a crate:

```bash
grep "^### C\." /home/rogerio/git/cobre-docs/src/specs/deferred.md
```

For each feature, determine which crate would implement it based on the feature's description.

Step 3: Merge the 13-row table from ticket-007, the 27-row table from ticket-008, and the 10-row table from this ticket into a 50-row master table.

Step 4: Compute the per-crate summary:

```bash
# Count primary assignments per crate from the master table
python3 -c "
data = [
  # (spec, section, primary, secondaries)
  # ... fill from tickets 007, 008, this ticket
]
from collections import Counter
primary_counts = Counter(row[2] for row in data)
print('Primary counts:', dict(primary_counts))
"
```

Step 5: Identify coverage gaps by comparing crate responsibilities (from ticket-006) against the primary+secondary columns in the master table.

### Key Files to Modify

Read-only audit.

### Patterns to Follow

The master table format follows the Epic 02 overview table structure. Include a `Notes` column for ambiguous assignments.

### Pitfalls to Avoid

- `slurm-deployment.md` is a deployment document. It maps to the deployment concern of `cobre-cli` but it does not define any Rust API. Its "crate" assignment is `cobre-cli` because the binary is what gets deployed — but note this is a documentation/deployment spec, not an implementation spec.
- The deferred features in `deferred.md` include mathematical extensions (new risk measures, multi-cut) and engineering extensions (commercial solvers, NEWAVE-format input). Map mathematical extensions to `cobre-sddp` and format extensions to `cobre-io`.

## Testing Requirements

### Unit Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-007 (data model/overview mapping table), ticket-008 (math/architecture mapping table)
- **Blocks**: ticket-015 (Epic 05 cross-reference index creation uses the master mapping table)

## Effort Estimate

**Points**: 2
**Confidence**: High
