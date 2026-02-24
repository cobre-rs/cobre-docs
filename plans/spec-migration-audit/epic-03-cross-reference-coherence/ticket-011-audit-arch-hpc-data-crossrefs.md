# ticket-011 Audit Semantic Accuracy of Cross-References in Architecture, HPC, and Data Model Specs

## Context

### Background

This ticket continues the semantic cross-reference audit from ticket-010, covering the remaining 33 spec files across architecture (13 files), HPC (8 files), data model (10 files), configuration (1 file + section index), and deferred features (1 file). These sections contain **1,120 markdown links to `.md` files** and approximately **660 cross-file section-number references** in `§N.N` format -- significantly more than the math/overview scope in ticket-010.

The architecture and HPC sections are the most cross-reference-dense areas of the spec corpus. `configuration-reference.md` alone has 89 links and 37 section-number references. `training-loop.md` is the central hub that architecture, HPC, data model, and math specs all reference. The density of cross-references in these sections creates the highest risk for semantic drift.

### Relation to Epic

This is the second ticket in Epic 03. It applies the audit methodology established in ticket-010 to the larger, more cross-reference-dense portion of the spec corpus. Together with ticket-010, it completes the semantic audit of all 50 spec files.

### Current State

The 37 files in scope (33 individual specs + 4 section index pages) are:

**Architecture section** (13 specs + 1 index = 14 files):

- `/home/rogerio/git/cobre-docs/src/specs/architecture.md` (57 links)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/training-loop.md` (42 links, 21 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/simulation-architecture.md` (35 links, 23 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/validation-architecture.md` (34 links, 18 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/scenario-generation.md` (30 links, 38 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/cut-management-impl.md` (30 links, 30 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md` (29 links, 26 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-workspaces.md` (28 links, 35 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-highs-impl.md` (28 links, 23 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-clp-impl.md` (26 links, 27 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/extension-points.md` (40 links, 50 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/input-loading-pipeline.md` (24 links)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/convergence-monitoring.md` (17 links)
- `/home/rogerio/git/cobre-docs/src/specs/architecture/cli-and-lifecycle.md` (11 links)

**HPC section** (8 specs + 1 index = 9 files):

- `/home/rogerio/git/cobre-docs/src/specs/hpc.md` (34 links)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/work-distribution.md` (18 links, 12 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/hybrid-parallelism.md` (28 links, 14 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/communication-patterns.md` (23 links, 22 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/memory-architecture.md` (35 links, 30 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/shared-memory-aggregation.md` (32 links, 31 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/checkpointing.md` (32 links, 30 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/slurm-deployment.md` (23 links, 30 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/hpc/synchronization.md` (19 links, 15 § refs)

**Data model section** (10 specs + 1 index = 11 files):

- `/home/rogerio/git/cobre-docs/src/specs/data-model.md` (34 links)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/input-directory-structure.md` (27 links)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/input-system-entities.md` (60 links, 36 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/input-scenarios.md` (25 links, 39 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/input-constraints.md` (28 links, 15 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/input-hydro-extensions.md` (22 links)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/penalty-system.md` (17 links)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/internal-structures.md` (35 links, 32 § refs)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/output-schemas.md` (29 links)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/output-infrastructure.md` (26 links)
- `/home/rogerio/git/cobre-docs/src/specs/data-model/binary-formats.md` (17 links)

**Configuration section** (1 spec + 1 index = 2 files):

- `/home/rogerio/git/cobre-docs/src/specs/configuration.md` (4 links)
- `/home/rogerio/git/cobre-docs/src/specs/configuration/configuration-reference.md` (89 links, 37 § refs)

**Deferred features** (1 file):

- `/home/rogerio/git/cobre-docs/src/specs/deferred.md` (38 links, 19 § refs)

## Specification

### Requirements

Apply the same four checks from ticket-010 to all 37 files. Given the larger scope, the sampling strategy is adjusted for efficiency:

**Check A -- Section-Number Reference Accuracy**: Extract all `§N` and `§N.N` references from the 37 files. For each:

1. Identify the target file (from the surrounding markdown link or from the context)
2. Open the target file and verify the numbered section heading exists
3. Verify the section content matches the claim

Focus on the 10 files with the highest § reference density (> 25 § refs each):

- `extension-points.md` (50 § refs) -- **top priority**
- `input-scenarios.md` (39 § refs)
- `scenario-generation.md` (38 § refs)
- `configuration-reference.md` (37 § refs)
- `input-system-entities.md` (36 § refs)
- `solver-workspaces.md` (35 § refs)
- `internal-structures.md` (32 § refs)
- `shared-memory-aggregation.md` (31 § refs)
- `checkpointing.md` (30 § refs)
- `memory-architecture.md` (30 § refs)

**Check B -- Anchor Fragment Verification**: There are zero `#anchor` fragment links in the spec files (confirmed by grep). Record as PASS baseline.

**Check C -- Semantic Link Accuracy (Sampled)**: Sample **2 domain-critical links per file** (74 total). Reduced from 3 per file in ticket-010 because the file count is higher and the per-file link density is well-characterized.

Priority sampling targets:

- `training-loop.md` links to HPC specs (parallelism claims)
- `configuration-reference.md` links to architecture specs (config key to behavior mapping)
- `work-distribution.md` links to `training-loop.md` (forward/backward pass distribution claims)
- `internal-structures.md` links to math specs (data structure to formula mapping)
- `deferred.md` links to specs that describe the feature being deferred

**Check D -- Cross-Section Consistency**: Verify 5+ bidirectional reference pairs that span section boundaries:

1. `training-loop.md` <-> `work-distribution.md` (forward pass parallelism)
2. `training-loop.md` <-> `synchronization.md` (barrier semantics)
3. `configuration-reference.md` <-> `solver-abstraction.md` (solver config keys)
4. `internal-structures.md` <-> `lp-formulation.md` (data structures backing LP constraints)
5. `scenario-generation.md` <-> `par-inflow-model.md` (PAR model usage)
6. `cut-management-impl.md` <-> `cut-management.md` (implementation vs formal spec)

### Inputs

All 37 files listed in the Current State section above.

### Outputs

A structured audit report at:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-011-audit-report.md`

The report must contain:

1. **Summary table**: `| File | Total Links | § Refs | § Mismatches | Sampled Links | Sampled Failures | Verdict |` (37 rows)
2. **Per-file section-number audit** for the 10 highest-density files: every § reference, target heading, PASS/FAIL
3. **Per-file section-number audit** for the remaining 27 files: § reference count and spot-check of 3 representative references per file
4. **Semantic sample audit**: 74 sampled links with source, anchor text, target, match result
5. **Bidirectional consistency audit**: 6+ pairs
6. **Findings list**: severity-classified

### Error Handling

Same severity rules as ticket-010:

- § number does not match any heading in target: **HIGH**
- § number matches heading but content does not match claim: **HIGH**
- Sampled link target does not contain implied concept: **HIGH**
- Asymmetric bidirectional reference: **MEDIUM**
- Minor wording mismatch between anchor text and heading: **LOW**

## Acceptance Criteria

- [ ] Given all 37 files in scope, when all `§N` references in the 10 highest-density files are fully enumerated and verified, then every section number maps to an existing heading
- [ ] Given the remaining 27 files, when 3 representative § references per file are spot-checked, then all map to correct headings
- [ ] Given `training-loop.md` (the central hub), when all its outbound § references are checked, then zero mismatches are found
- [ ] Given `extension-points.md` (50 § refs -- highest density), when all its § references are checked, then zero mismatches are found
- [ ] Given `configuration-reference.md` (89 links -- highest link count), when its 37 § references are checked, then zero mismatches are found
- [ ] Given 2 domain-critical links per file (74 total), when semantically verified, then no HIGH findings are reported
- [ ] Given 6+ bidirectional reference pairs, when symmetry is checked, then asymmetric pairs are documented as MEDIUM findings
- [ ] The audit report contains a 37-row summary table and a severity-classified findings list
- [ ] Zero CRITICAL findings

## Implementation Guide

### Suggested Approach

**Step 1: Extract all § references grouped by file.**

```bash
for f in /home/rogerio/git/cobre-docs/src/specs/architecture/*.md \
         /home/rogerio/git/cobre-docs/src/specs/architecture.md \
         /home/rogerio/git/cobre-docs/src/specs/hpc/*.md \
         /home/rogerio/git/cobre-docs/src/specs/hpc.md \
         /home/rogerio/git/cobre-docs/src/specs/data-model/*.md \
         /home/rogerio/git/cobre-docs/src/specs/data-model.md \
         /home/rogerio/git/cobre-docs/src/specs/configuration/*.md \
         /home/rogerio/git/cobre-docs/src/specs/configuration.md \
         /home/rogerio/git/cobre-docs/src/specs/deferred.md; do
  count=$(grep -oP '§[\d]+(?:\.[\d]+)*' "$f" 2>/dev/null | wc -l)
  echo "$count $f"
done | sort -rn
```

**Step 2: For each of the 10 highest-density files, do a complete § reference audit.**

For each § reference:

1. Identify the target file from the surrounding markdown link context
2. Read the target file's headings (`grep '^#' target.md`)
3. Verify the numbered section exists and its content matches the claim

**Step 3: For the remaining 27 files, spot-check 3 § references per file.**

Choose the first, middle, and last § references in each file. Verify target heading existence and content match.

**Step 4: Sample 2 domain-critical links per file (74 total).**

Focus on links that connect architecture to math (behavioral claims), data model to architecture (structural claims), and HPC to architecture (parallelism claims).

**Step 5: Verify 6 bidirectional reference pairs.**

For each pair, read both files and confirm each references the other in the appropriate context.

**Step 6: Compile findings and write the audit report.**

### Key Files to Modify

No source files are modified. The sole deliverable is:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-011-audit-report.md`

### Patterns to Follow

- Reuse the summary table format from ticket-010's report
- Follow severity classification from the plan README
- Assign unique finding IDs (continuing from ticket-010's numbering, e.g., if ticket-010 ended at F-8, start at F-9)

### Pitfalls to Avoid

- **Self-referential § numbers are common in architecture specs**: `lp-formulation.md` says "see §9 above" referring to its own section 9. Only check these against the same file's headings.
- **Cross-section § references often omit the file name**: Context like "see §4.3 in the training-loop spec" is common in HPC files. Use the surrounding link to identify the target file.
- **`deferred.md` uses a different numbering scheme**: Deferred features are numbered C.1 through C.18 (plus 3 unnumbered algorithm variants). These are item numbers, not section numbers -- verify them against the deferred feature list, not section headings.
- **`configuration-reference.md` has the highest link count (89)** but many are to the same few targets (solver, training-loop, scenario-generation). The 37 § references are the audit focus, not the repetitive links.
- **Do not re-verify structural link resolution**: Epic 01 already confirmed. Focus on semantic accuracy.

## Testing Requirements

### Unit Tests

Not applicable -- read-only audit ticket.

### Integration Tests

The audit report is the deliverable. A reviewer must be able to pick any § reference from the report, open both source and target files, and verify the PASS/FAIL independently.

### E2E Tests

No files are modified, so no `mdbook build` verification needed.

## Dependencies

- **Blocked By**: ticket-010 (establishes § audit methodology and produces the first semantic audit)
- **Blocks**: ticket-018/019 (remediation of any HIGH findings)

## Effort Estimate

**Points**: 4
**Confidence**: High
