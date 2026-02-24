# ticket-002 Audit Content Integrity of Math Spec Files Part 1

## Context

### Background

The `specs/math/` section contains 14 of the most mathematically dense files in the corpus, with 403 display equation delimiters (`$$`) across all 14 files. This ticket covers the first 7 math specs: `sddp-algorithm.md`, `lp-formulation.md`, `system-elements.md`, `block-formulations.md`, `hydro-production-models.md`, `cut-management.md`, and `discount-rate.md`.

These files are the algorithmic core. `sddp-algorithm.md` is the root spec referenced by all other mathematical formulations. `lp-formulation.md` defines the stage LP structure that the entire solver crate is built around. Any missing equation, constraint, or decision variable definition in these files would directly undermine implementation correctness.

### Relation to Epic

This is the second of 5 audit tickets in Epic 01. It follows the methodology established in ticket-001 and covers 7 of the 14 math spec files.

### Current State

Target files at `/home/rogerio/git/cobre-docs/src/specs/math/`:

- `sddp-algorithm.md` — source: 01-math (sizes: source 501 lines, target ~480 lines based on frontmatter removal)
- `lp-formulation.md` — large file with complete LP block structure, objective, constraints
- `system-elements.md` — physical component modeling overview
- `block-formulations.md` — block-level LP formulation details
- `hydro-production-models.md` — FPHA, linear hydro, discharge coefficient models
- `cut-management.md` — Benders cut generation, aggregation, and storage
- `discount-rate.md` — discount rate and inter-stage factor definitions

Source files at `/home/rogerio/git/powers/docs/specs/01-math/` with the same names.

The sddp-algorithm.md cross-reference to `../00-overview/notation-conventions.md` must have been rewritten to `../overview/notation-conventions.md`.

### Current State

The Epic 02 revision report from the migration confirmed all 14 math specs as PASS with heading/table/formula counts matching. The present audit goes deeper, specifically verifying:

1. All LaTeX display equations are present (not just counted — the count was equal, but were any swapped?)
2. The `sddp-algorithm.md` forward pass and backward pass pseudocode sections are semantically complete
3. The `lp-formulation.md` constraint inventory is complete (every constraint type defined in source appears in target)
4. Cross-references from math specs to architecture specs and data model specs use the correct named-directory paths

## Specification

### Requirements

For each of the 7 files, apply the 6-check audit methodology from ticket-001:

**Check 1 — Frontmatter Removal**: First line must be `# [Title]`, not `---`.

**Check 2 — Brand Terms**: Zero occurrences of prohibited terms.

**Check 3 — Heading Inventory**: Full heading list must match source (heading text and level).

**Check 4 — Formula Inventory** (replaces Check 4 from ticket-001): Count `$$` delimiter lines and inline `$` occurrences. For `sddp-algorithm.md` and `lp-formulation.md`, additionally verify:

- The core SDDP minimization objective formula is present: `\min_{x_1, \ldots, x_T}`
- The value function recursion formula is present: `V_t(x_{t-1}) = \mathbb{E}_{\omega_t}`
- The LP formulation contains the water balance constraint structure

**Check 5 — Table and Code Block Inventory**: Count lines containing `|` (table rows) and ` ``` ` delimiters. Must match source counts.

**Check 6 — Cross-Reference Path Accuracy**: Verify all inter-spec links use named directories. Key links to verify:

- `sddp-algorithm.md` → `../overview/notation-conventions.md` (was `../00-overview/`)
- `cut-management.md` → `../architecture/cut-management-impl.md` (was `../03-architecture/`)
- `hydro-production-models.md` → `../data-model/input-hydro-extensions.md` (was `../02-data-model/`)
- `discount-rate.md` → `../math/sddp-algorithm.md` (same directory, no prefix change)
- All deferred features links → `../deferred.md` (was `../06-deferred/deferred-features.md`)

### Inputs

- Source: `/home/rogerio/git/powers/docs/specs/01-math/` — files: `sddp-algorithm.md`, `lp-formulation.md`, `system-elements.md`, `block-formulations.md`, `hydro-production-models.md`, `cut-management.md`, `discount-rate.md`
- Target: `/home/rogerio/git/cobre-docs/src/specs/math/` — same file names

### Outputs

Structured audit report, one sub-section per file. Each sub-section contains:

- Check-by-check results table
- Findings list with severity classification
- PASS/FAIL verdict

### Error Handling

- Missing equation that is referenced by other specs: CRITICAL
- Wrong cross-reference path (broken link): HIGH
- Heading present in source but absent in target: CRITICAL
- Extra heading in target not in source: LOW (possible content addition, not loss)

## Acceptance Criteria

- [ ] Given `sddp-algorithm.md` source and target, when the core SDDP objective formula and value function recursion are checked, then both are present in the target
- [ ] Given `lp-formulation.md` source and target, when all constraint types are inventoried, then every constraint type defined in the source (water balance, load balance, hydro generation, etc.) is present in the target
- [ ] Given all 7 target files, when first lines are checked, then none begin with `---`
- [ ] Given all 7 target files, when heading inventories are compared to source, then heading lists match
- [ ] Given all 7 target files, when formula counts are compared, then `$$` counts match source counts
- [ ] Given all cross-references in all 7 target files, when resolved on disk, then zero broken links are found
- [ ] The ticket produces a 7-row summary table: `| File | FM | Brands | Headings | Formulas | Tables | Cross-refs | Verdict |`

## Implementation Guide

### Suggested Approach

Step 1: Enumerate source line counts to set expectations:

```bash
wc -l /home/rogerio/git/powers/docs/specs/01-math/sddp-algorithm.md \
       /home/rogerio/git/powers/docs/specs/01-math/lp-formulation.md \
       /home/rogerio/git/powers/docs/specs/01-math/system-elements.md \
       /home/rogerio/git/powers/docs/specs/01-math/block-formulations.md \
       /home/rogerio/git/powers/docs/specs/01-math/hydro-production-models.md \
       /home/rogerio/git/powers/docs/specs/01-math/cut-management.md \
       /home/rogerio/git/powers/docs/specs/01-math/discount-rate.md
```

Step 2: For each file, compute heading count in source and target:

```bash
for f in sddp-algorithm lp-formulation system-elements block-formulations \
          hydro-production-models cut-management discount-rate; do
  src=$(grep -c "^#" /home/rogerio/git/powers/docs/specs/01-math/${f}.md)
  tgt=$(grep -c "^#" /home/rogerio/git/cobre-docs/src/specs/math/${f}.md)
  echo "$f: source=$src target=$tgt"
done
```

Step 3: Formula count comparison:

```bash
for f in sddp-algorithm lp-formulation system-elements block-formulations \
          hydro-production-models cut-management discount-rate; do
  src=$(grep -c "^\$\$" /home/rogerio/git/powers/docs/specs/01-math/${f}.md)
  tgt=$(grep -c "^\$\$" /home/rogerio/git/cobre-docs/src/specs/math/${f}.md)
  echo "$f: $$-count source=$src target=$tgt"
done
```

Step 4: For `sddp-algorithm.md` specifically, verify the key formulas are present:

```bash
grep -n "min_{x_1" /home/rogerio/git/cobre-docs/src/specs/math/sddp-algorithm.md
grep -n "mathbb{E}_{\\\\omega_t}" /home/rogerio/git/cobre-docs/src/specs/math/sddp-algorithm.md
```

Step 5: For `lp-formulation.md`, extract all H2 and H3 headings representing constraint types from source and target and compare.

Step 6: Run targeted diff to catch content changes beyond frontmatter/brands/paths:

```bash
# Strip frontmatter, replace brand names, then diff
python3 -c "
import re, sys
with open(sys.argv[1]) as f:
    content = f.read()
# Remove frontmatter
content = re.sub(r'^---.*?---\n', '', content, flags=re.DOTALL)
# Normalize brand names
content = re.sub(r'POWE\.RS', 'Cobre', content)
content = re.sub(r'powers-', 'cobre-', content)
# Normalize path prefixes
content = re.sub(r'\.\./00-overview/', '../overview/', content)
content = re.sub(r'\.\./01-math/', '../math/', content)
content = re.sub(r'\.\./02-data-model/', '../data-model/', content)
content = re.sub(r'\.\./03-architecture/', '../architecture/', content)
content = re.sub(r'\.\./04-hpc/', '../hpc/', content)
content = re.sub(r'\.\./05-config/', '../configuration/', content)
content = re.sub(r'\.\./06-deferred/deferred-features\.md', '../deferred.md', content)
print(content)
" /home/rogerio/git/powers/docs/specs/01-math/sddp-algorithm.md > /tmp/src_normalized.md

diff /tmp/src_normalized.md /home/rogerio/git/cobre-docs/src/specs/math/sddp-algorithm.md
```

### Key Files to Modify

Read-only audit. No files are modified. Findings recorded in the audit report deliverable.

### Patterns to Follow

Same 6-check methodology as ticket-001. The Python normalization script (Step 6) is the primary tool for detecting non-trivial content changes beyond structural substitutions.

### Pitfalls to Avoid

- The `sddp-algorithm.md` source has diagram image tags (`![...](../../diagrams/...)`) that were stripped during migration (the cobre-docs repo has no diagrams directory). These appear as `<!-- TODO: diagram - ... -->` comments in the target. This is expected and intentional — do not flag as CRITICAL.
- The `hydro-production-models.md` likely has numerous `$...$` inline equations for FPHA hyperplane parameters — count these carefully using a pattern that doesn't double-count the `$$` display formulas.
- Table row counts should count lines containing `|`, which includes both separator rows (`|---|---|`) and data rows. Source and target must match exactly.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

After this ticket, run `mdbook build` and confirm exit 0.

### E2E Tests

Full audit deliverable readable as a standalone report.

## Dependencies

- **Blocked By**: ticket-001 (establishes audit methodology)
- **Blocks**: ticket-009 (Epic 02 mapping audit for math specs depends on integrity being confirmed first)

## Effort Estimate

**Points**: 3
**Confidence**: High
