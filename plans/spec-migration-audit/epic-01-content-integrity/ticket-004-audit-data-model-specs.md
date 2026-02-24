# ticket-004 Audit Content Integrity of Data Model Spec Files

## Context

### Background

The 10 data model spec files define the complete input/output data schema that `cobre-io` and `cobre-core` will implement. These files contain the most tables of any section — the Epic 03 revision report recorded 195 table rows for `input-system-entities.md` alone. Table rows represent field definitions: if any field definition row was dropped during migration, an implementer would silently miss a required field.

The data model section covers: input directory layout, all entity registries (buses, lines, hydros, thermals, pumps, contracts), hydro extensions (geometry, FPHA hyperplanes, cascade topology), scenario data schemas, generic constraints, penalty system configuration, internal data structures, output schemas, output infrastructure, and binary format specifications.

### Relation to Epic

This is ticket 4 of 5 in Epic 01. It covers all 10 data model spec files.

### Current State

Source files at `/home/rogerio/git/powers/docs/specs/02-data-model/`:
`input-directory-structure.md`, `input-system-entities.md`, `input-hydro-extensions.md`, `input-scenarios.md`, `input-constraints.md`, `penalty-system.md`, `internal-structures.md`, `output-schemas.md`, `output-infrastructure.md`, `binary-formats.md`

Target files at `/home/rogerio/git/cobre-docs/src/specs/data-model/` with the same names.

The Epic 03 revision report confirmed all 10 files PASS with heading and table counts matching. The present audit goes deeper by also verifying FlatBuffers schema snippets in `binary-formats.md`, JSON example blocks in `input-system-entities.md` and `input-constraints.md`, and Parquet column definitions in `output-schemas.md`.

### Known Complexity

`input-system-entities.md` is the largest data model file (807 target lines). It defines entity fields for buses, lines, hydro plants, thermal plants, pumping stations, energy contracts, bus groups, non-controllable sources, and generic non-linear (GNL) extension data. The table count of 195 rows makes this file the highest-risk target for silent field definition loss.

`binary-formats.md` contains FlatBuffers schema code blocks that define the policy persistence format. Any truncation or alteration of these schemas would break checkpoint/resume compatibility.

## Specification

### Requirements

Apply the 6-check audit methodology. Additionally:

**Check 4a — Table Row Completeness for input-system-entities.md**: The source has 195 table rows. Count rows in the target and confirm they match. Then do spot-check verification on specific entity type sections:

- Hydro plant fields: verify that `downstream_id`, `min_storage`, `max_storage`, `inflow_scale`, `productivity` are all present
- Thermal unit fields: verify `min_generation`, `max_generation`, `startup_cost`, `operating_cost` are all present
- Penalty system fields: verify `category`, `tier_bounds`, `tier_costs` structure is present

**Check 4b — FlatBuffers Schema Completeness for binary-formats.md**: The source defines FlatBuffers IDL schemas for: `CutEntry`, `CutPool`, `VisitedState`, `CheckpointManifest`. Verify each table/struct definition is present in the target with its fields.

**Check 4c — JSON Examples**: `input-system-entities.md` and `input-constraints.md` contain JSON code blocks showing valid input examples. Verify these code blocks are present in the target.

**Check 4d — Output Column Definitions for output-schemas.md**: The source defines Parquet column schemas for simulation outputs and training outputs. Verify the column definition tables are present.

**Check 6 — Cross-Reference Path Accuracy**: Key cross-references to verify in data model files:

- `binary-formats.md` → `../data-model/internal-structures.md` (same directory)
- `binary-formats.md` → `../data-model/output-schemas.md` (same directory)
- `output-infrastructure.md` → `../architecture/cli-and-lifecycle.md` (was `../03-architecture/`)
- `input-directory-structure.md` → `../configuration/configuration-reference.md` (was `../05-config/`)
- `penalty-system.md` → `../math/lp-formulation.md` (was `../01-math/`)
- `input-scenarios.md` → `../architecture/scenario-generation.md` (was `../03-architecture/`)
- `internal-structures.md` → `../data-model/input-system-entities.md` (same directory)

### Inputs

- Source: `/home/rogerio/git/powers/docs/specs/02-data-model/`
- Target: `/home/rogerio/git/cobre-docs/src/specs/data-model/`
- Files: all 10 listed above

### Outputs

Per-file audit sections with check results, findings, and PASS/FAIL verdicts. A summary table with all 10 files.

### Error Handling

- Missing field definition row in any entity table: CRITICAL
- Missing FlatBuffers schema element: CRITICAL
- Missing JSON example block: HIGH
- Wrong cross-reference path: HIGH
- Missing Parquet column definition: CRITICAL (affects output parsing)

## Acceptance Criteria

- [ ] Given `input-system-entities.md` source (195 table rows) and target, when table row counts are compared, then target has 195 table rows in entity definition tables
- [ ] Given `binary-formats.md` target, when FlatBuffers schema code blocks are checked, then `CutEntry`, `CutPool`, `VisitedState`, and `CheckpointManifest` table definitions are all present with their fields
- [ ] Given `output-schemas.md` target, when Parquet column definition tables are checked, then simulation output columns and training output columns are both defined
- [ ] Given all 10 target files, when first lines are checked, then none begin with `---`
- [ ] Given all 10 target files, when heading inventories are compared to source, then heading lists match
- [ ] Given all 10 target files, when all cross-references are resolved, then zero broken links exist
- [ ] The ticket produces a 10-row summary table with PASS/FAIL per file

## Implementation Guide

### Suggested Approach

Step 1: Line and heading counts for all 10 files:

```bash
for f in input-directory-structure input-system-entities input-hydro-extensions \
          input-scenarios input-constraints penalty-system internal-structures \
          output-schemas output-infrastructure binary-formats; do
  src_l=$(wc -l < /home/rogerio/git/powers/docs/specs/02-data-model/${f}.md)
  tgt_l=$(wc -l < /home/rogerio/git/cobre-docs/src/specs/data-model/${f}.md)
  src_h=$(grep -c "^#" /home/rogerio/git/powers/docs/specs/02-data-model/${f}.md)
  tgt_h=$(grep -c "^#" /home/rogerio/git/cobre-docs/src/specs/data-model/${f}.md)
  src_t=$(grep -c "|" /home/rogerio/git/powers/docs/specs/02-data-model/${f}.md)
  tgt_t=$(grep -c "|" /home/rogerio/git/cobre-docs/src/specs/data-model/${f}.md)
  echo "$f: lines=$src_l->$tgt_l headings=$src_h->$tgt_h tables=$src_t->$tgt_t"
done
```

Step 2: For `input-system-entities.md` — spot-check key field names:

```bash
grep -n "downstream_id\|min_storage\|max_storage\|startup_cost\|operating_cost" \
  /home/rogerio/git/cobre-docs/src/specs/data-model/input-system-entities.md | head -20
```

Step 3: For `binary-formats.md` — verify FlatBuffers schema definitions:

```bash
grep -n "table CutEntry\|table CutPool\|table VisitedState\|table Checkpoint" \
  /home/rogerio/git/cobre-docs/src/specs/data-model/binary-formats.md
```

Step 4: For `output-schemas.md` — check for simulation and training column sections:

```bash
grep "^## " /home/rogerio/git/powers/docs/specs/02-data-model/output-schemas.md
grep "^## " /home/rogerio/git/cobre-docs/src/specs/data-model/output-schemas.md
```

Step 5: Run normalized diff for each file (use the Python script from ticket-002).

Step 6: Extract all markdown links from all 10 files and verify paths:

```bash
grep -rn "\[.*\](.*\.md)" /home/rogerio/git/cobre-docs/src/specs/data-model/ --include="*.md" \
  | grep -v "http"
```

### Key Files to Modify

Read-only audit.

### Patterns to Follow

Same 6-check methodology as tickets 001-003. The table row count check (Check 4a) is specific to this section given the high field definition density.

### Pitfalls to Avoid

- `input-system-entities.md` has both markdown tables (for field definitions) and JSON code blocks (for examples). The table count must target only the markdown table rows.
- `binary-formats.md` FlatBuffers schemas are inside ` ``` ` code blocks — do not confuse them with markdown table row counts.
- `output-infrastructure.md` likely cross-references `cli-and-lifecycle.md` in the architecture section — verify this path uses `../architecture/` not `../03-architecture/`.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

After all 5 Epic 01 tickets are done, run `mdbook build` and confirm exit 0.

## Dependencies

- **Blocked By**: ticket-001 (audit methodology established)
- **Blocks**: ticket-007 (data model mapping audit in Epic 02)

## Effort Estimate

**Points**: 3
**Confidence**: High
