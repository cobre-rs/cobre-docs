# ticket-005 Audit Content Integrity of Architecture, HPC, Configuration, and Deferred Spec Files

## Context

### Background

This ticket is the final content integrity audit, covering the remaining 22 spec files: 13 architecture specs, 8 HPC specs, 1 configuration reference, and `deferred.md`.

The architecture specs define the runtime behavior of every crate boundary. `training-loop.md` is especially critical — it defines the full iteration lifecycle with MPI synchronization points and links all the abstraction points together. The HPC specs define parallel distribution, NUMA memory layout, checkpointing, and SLURM deployment — these contain the most SLURM code blocks and HPC-specific configuration tables.

`deferred.md` (850 lines) is a single file that consolidates 14+ deferred features. It was originally a large file (`deferred-features.md`, 871 lines) — the line delta of 21 is explained by frontmatter removal. This file contains 28 display formulas (`$$`) for the deferred mathematical extensions. It must not have been accidentally truncated.

`configuration-reference.md` (379 lines) defines the complete `config.json` schema — every key, its type, default, and validation rule. Missing configuration keys here would leave implementers without guidance for the user-facing API.

### Relation to Epic

This is the final ticket (5 of 5) in Epic 01. After this ticket, all 50 spec files have been individually audited.

### Current State

Architecture source: `/home/rogerio/git/powers/docs/specs/03-architecture/` (13 files)
Architecture target: `/home/rogerio/git/cobre-docs/src/specs/architecture/`

HPC source: `/home/rogerio/git/powers/docs/specs/04-hpc/` (8 files)
HPC target: `/home/rogerio/git/cobre-docs/src/specs/hpc/`

Config source: `/home/rogerio/git/powers/docs/specs/05-config/configuration-reference.md`
Config target: `/home/rogerio/git/cobre-docs/src/specs/configuration/configuration-reference.md`

Deferred source: `/home/rogerio/git/powers/docs/specs/06-deferred/deferred-features.md`
Deferred target: `/home/rogerio/git/cobre-docs/src/specs/deferred.md`

The Epic 04 and 05 revision reports from the migration confirmed all 22 files PASS. This ticket performs the independent re-check.

## Specification

### Requirements

Apply the 6-check audit methodology to all 22 files. Additionally:

**Check 4a — training-loop.md Iteration Lifecycle Table**: The source defines a 7-step iteration lifecycle table (forward pass, MPI Allreduce, backward pass, cut sync, convergence update, checkpoint, logging). Verify this table is present in the target with all 7 rows.

**Check 4b — configuration-reference.md Config Key Coverage**: The source defines all keys in `config.json` including nested sections. Verify key section headings: `training`, `simulation`, `stopping_rules`, `checkpointing`, `logging`, `solver`. Run a spot-check on specific required keys: `max_iterations`, `forward_scenarios`, `tolerance`, `checkpoint_interval`.

**Check 4c — deferred.md Feature Count**: The source has 14+ deferred features labeled with section IDs (e.g., `C.1`, `C.2`, etc.). Verify the target has the same feature list and that the 28 display formulas all have matching counts.

**Check 4d — slurm-deployment.md Script Completeness**: The source contains SLURM batch script examples (`#SBATCH` directives). These are inside code blocks and must be present in the target without truncation.

**Check 6 — Cross-Reference Path Accuracy**: Key cross-references to verify:

- `training-loop.md` → `../architecture/convergence-monitoring.md` (same directory)
- `training-loop.md` → `../hpc/checkpointing.md` (was `../04-hpc/`)
- `scenario-generation.md` → `../math/par-inflow-model.md` (was `../01-math/`)
- `cli-and-lifecycle.md` → `../data-model/output-infrastructure.md` (was `../02-data-model/`)
- `solver-workspaces.md` → `../architecture/solver-abstraction.md` (same directory)
- `work-distribution.md` → `../architecture/training-loop.md` (was `../03-architecture/`)
- `checkpointing.md` → `../deferred.md` (was `../06-deferred/deferred-features.md`)

### Inputs

- Source: `/home/rogerio/git/powers/docs/specs/03-architecture/`, `04-hpc/`, `05-config/`, `06-deferred/`
- Target: `/home/rogerio/git/cobre-docs/src/specs/architecture/`, `hpc/`, `configuration/`, `deferred.md`

### Outputs

A 22-row summary audit table (one row per file) and a roll-up of all CRITICAL/HIGH/MEDIUM/LOW findings from the entire Epic 01 (tickets 001-005). The roll-up table covers all 50 files.

### Error Handling

Same severity classification. Additionally: any deferred feature section missing from `deferred.md` is CRITICAL (these define the product roadmap).

## Acceptance Criteria

- [ ] Given `training-loop.md` target, when the iteration lifecycle table is checked, then all 7 steps (forward pass through logging) are present as table rows
- [ ] Given `configuration-reference.md` target, when config key sections are checked, then `training`, `simulation`, `stopping_rules`, `checkpointing`, `logging`, `solver` sections are all present
- [ ] Given `deferred.md` target, when deferred feature list is compared to source `deferred-features.md`, then the same feature IDs (e.g., C.1 through C.14+) are present and the `$$` formula count matches (28)
- [ ] Given `slurm-deployment.md` target, when code blocks are checked, then SLURM script blocks with `#SBATCH` directives are present
- [ ] Given all 22 target files, when heading inventories are compared to source, then heading lists match
- [ ] Given all 22 target files, when all cross-references are resolved, then zero broken links exist
- [ ] The ticket produces a 22-row summary table with PASS/FAIL per file
- [ ] The ticket produces an Epic 01 roll-up: a 50-row table covering all spec files from tickets 001-005

## Implementation Guide

### Suggested Approach

Step 1: Batch heading and formula count check for all architecture files:

```bash
for f in training-loop simulation-architecture cli-and-lifecycle validation-architecture \
          input-loading-pipeline scenario-generation solver-abstraction solver-highs-impl \
          solver-clp-impl solver-workspaces cut-management-impl convergence-monitoring \
          extension-points; do
  src_h=$(grep -c "^#" /home/rogerio/git/powers/docs/specs/03-architecture/${f}.md)
  tgt_h=$(grep -c "^#" /home/rogerio/git/cobre-docs/src/specs/architecture/${f}.md)
  src_f=$(grep -c "^\$\$" /home/rogerio/git/powers/docs/specs/03-architecture/${f}.md)
  tgt_f=$(grep -c "^\$\$" /home/rogerio/git/cobre-docs/src/specs/architecture/${f}.md)
  echo "arch/$f: headings=$src_h->$tgt_h formulas=$src_f->$tgt_f"
done
```

Step 2: For HPC files:

```bash
for f in work-distribution hybrid-parallelism communication-patterns memory-architecture \
          shared-memory-aggregation checkpointing slurm-deployment synchronization; do
  src_h=$(grep -c "^#" /home/rogerio/git/powers/docs/specs/04-hpc/${f}.md)
  tgt_h=$(grep -c "^#" /home/rogerio/git/cobre-docs/src/specs/hpc/${f}.md)
  echo "hpc/$f: headings=$src_h->$tgt_h"
done
```

Step 3: For `training-loop.md` — verify iteration lifecycle table:

```bash
grep -n "Forward pass\|Backward pass\|convergence\|checkpoint\|logging\|MPI_Allreduce\|MPI_Allgatherv" \
  /home/rogerio/git/cobre-docs/src/specs/architecture/training-loop.md | head -20
```

Step 4: For `deferred.md` — verify feature count and formula count:

```bash
grep "^### C\." /home/rogerio/git/powers/docs/specs/06-deferred/deferred-features.md
grep "^### C\." /home/rogerio/git/cobre-docs/src/specs/deferred.md
grep -c "^\$\$" /home/rogerio/git/powers/docs/specs/06-deferred/deferred-features.md
grep -c "^\$\$" /home/rogerio/git/cobre-docs/src/specs/deferred.md
```

Step 5: For `configuration-reference.md` — verify all top-level config sections:

```bash
grep "^## " /home/rogerio/git/powers/docs/specs/05-config/configuration-reference.md
grep "^## " /home/rogerio/git/cobre-docs/src/specs/configuration/configuration-reference.md
```

Step 6: Compile the Epic 01 Roll-Up table — for each of the 50 files audited in tickets 001-005, summarize as: `| File | Section | Verdict | Findings (count by severity) |`

### Key Files to Modify

Read-only audit.

### Patterns to Follow

Same 6-check methodology. The roll-up table in Step 6 is the primary Epic 01 deliverable — it must be produced regardless of whether individual files pass or fail.

### Pitfalls to Avoid

- `deferred.md` is at `src/specs/deferred.md` (not in a `deferred/` subdirectory). Cross-references to it use `../deferred.md`, not `../deferred/deferred-features.md`.
- `slurm-deployment.md` has a very high heading count (56) because `#SBATCH` lines and `#!/bin/bash` lines inside code blocks are counted by `grep "^#"`. This is expected — the source and target counts should be equal.
- The `configuration-reference.md` was at `05-config/` in the source but is now at `specs/configuration/configuration-reference.md` — a directory was created for it during migration even though it's the only file in that section.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

After all 5 Epic 01 tickets, run `mdbook build` in `/home/rogerio/git/cobre-docs/` and confirm exit code 0.

## Dependencies

- **Blocked By**: ticket-001 (establishes audit methodology)
- **Blocks**: ticket-008 (architecture mapping audit in Epic 02), ticket-013 (cross-reference coherence audit in Epic 03)

## Effort Estimate

**Points**: 3
**Confidence**: High
