# ticket-003 Audit Content Integrity of Math Spec Files Part 2

## Context

### Background

This ticket continues the math spec audit begun in ticket-002. It covers the remaining 7 of the 14 math spec files: `infinite-horizon.md`, `risk-measures.md`, `inflow-nonnegativity.md`, `par-inflow-model.md`, `equipment-formulations.md`, `stopping-rules.md`, and `upper-bound-evaluation.md`.

These files are mathematically complex. `risk-measures.md` defines the CVaR formulation and the dual representation used during cut generation — any missing formula here would break the risk-averse SDDP implementation. `par-inflow-model.md` defines the PAR(p) model that is the sole basis for `cobre-stochastic` implementation. `upper-bound-evaluation.md` defines the statistical testing procedure for convergence, including t-test and chi-squared formulas. `equipment-formulations.md` covers pumping stations, contracts, and non-controllable sources — secondary elements that could easily have content silently dropped.

### Relation to Epic

This is ticket 3 of 5 in Epic 01. After this ticket, all 17 overview and math specs have been audited.

### Current State

Target files at `/home/rogerio/git/cobre-docs/src/specs/math/`. Source files at `/home/rogerio/git/powers/docs/specs/01-math/`.

The Epic 02 revision report from the migration confirmed all 14 math specs PASS. The migration report noted that `risk-measures.md` uses symbol `$d$` for discount factor (not `$\beta$`) and `$\hat{\alpha}_t(\omega)$` for cut intercepts — verify these notation substitutions are preserved correctly and that the `>Symbol conventions` callout block is intact in the target.

## Specification

### Requirements

Apply the same 6-check audit methodology from tickets 001-002 to each of the 7 files. Additionally:

**Check 4a — risk-measures.md Symbol Convention Block**: The source contains a notation callout block at the top of the file that defines 5 symbol conventions specific to this spec (to avoid collision with other specs). Verify this block is present in the target and all 5 symbols are defined.

**Check 4b — par-inflow-model.md Fitting Procedure**: The source defines a complete PAR(p) parameter estimation procedure with moment-matching equations and model order selection criteria. Verify section headings for the fitting procedure are present.

**Check 4c — upper-bound-evaluation.md Statistical Tests**: The source defines specific statistical test formulas (t-test for upper bound confidence interval, chi-squared bounds or equivalent). Verify the statistical testing section is present.

**Check 4d — infinite-horizon.md Cycle Discount Convergence**: The source defines the infinite horizon discount factor convergence condition. Verify the convergence formula and cycle transition definition are present.

**Check 6 — Cross-Reference Path Accuracy**: Key links to verify:

- `risk-measures.md` → `../math/cut-management.md` (same directory)
- `par-inflow-model.md` → `../architecture/scenario-generation.md` (was `../03-architecture/`)
- `stopping-rules.md` → `../architecture/convergence-monitoring.md` (was `../03-architecture/`)
- `upper-bound-evaluation.md` → `../math/stopping-rules.md` (same directory)
- `equipment-formulations.md` → `../data-model/input-system-entities.md` (was `../02-data-model/`)

### Inputs

- Source: `/home/rogerio/git/powers/docs/specs/01-math/` — files: `infinite-horizon.md`, `risk-measures.md`, `inflow-nonnegativity.md`, `par-inflow-model.md`, `equipment-formulations.md`, `stopping-rules.md`, `upper-bound-evaluation.md`
- Target: `/home/rogerio/git/cobre-docs/src/specs/math/` — same file names

### Outputs

Same format as ticket-002: per-file audit sub-sections with check results, findings, and PASS/FAIL verdict.

### Error Handling

Same severity classification as ticket-001.

## Acceptance Criteria

- [ ] Given `risk-measures.md` target file, when the symbol convention callout block is checked, then all 5 symbol conventions are present and correctly defined
- [ ] Given `par-inflow-model.md` target file, when the PAR(p) fitting procedure section is verified, then the moment-matching equations and model order selection sections are present
- [ ] Given `upper-bound-evaluation.md` target file, when statistical test formulas are verified, then the confidence interval construction and test statistic formulas are present
- [ ] Given `infinite-horizon.md` target file, when the cycle discount convergence condition is verified, then the formula for infinite horizon convergence is present
- [ ] Given all 7 target files, when `$$` formula counts are compared to source, then counts match
- [ ] Given all 7 target files, when all cross-references are resolved on disk, then zero broken links exist
- [ ] The ticket produces a 7-row summary table with PASS/FAIL per file

## Implementation Guide

### Suggested Approach

Step 1: Same structural checks as ticket-002 — line counts, heading counts, formula counts for all 7 files.

Step 2: For `risk-measures.md` — verify the symbol conventions callout block:

```bash
grep -A 12 "Symbol conventions" \
  /home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md
```

The block defines: `$\alpha$` (CVaR confidence level), `$\hat{\alpha}_t(\omega)$` (cut intercepts), `$d$` (discount factor), `$\mu$` (risk-adjusted probability measure), `$\psi(p, \mu)$` (dual penalty function).

Step 3: For `par-inflow-model.md` — extract H2/H3 headings and compare:

```bash
grep "^##" /home/rogerio/git/powers/docs/specs/01-math/par-inflow-model.md
grep "^##" /home/rogerio/git/cobre-docs/src/specs/math/par-inflow-model.md
```

Look for sections covering: model definition, standardized form, residual std derivation, parameter estimation/fitting, model order selection, validation invariants.

Step 4: For `upper-bound-evaluation.md` — check for t-test or confidence interval formulas:

```bash
grep -n "t-test\|confidence\|chi\|Student" \
  /home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md
```

Step 5: Apply the normalized diff (Python script from ticket-002) to all 7 files and check for unexpected deltas.

Step 6: Verify all cross-references. The `inflow-nonnegativity.md` likely cross-references `lp-formulation.md` or `penalty-system.md` — check that these links are intact.

### Key Files to Modify

Read-only audit.

### Patterns to Follow

Same methodology as tickets 001 and 002.

### Pitfalls to Avoid

- `equipment-formulations.md` covers pumping stations, energy contracts, and non-controllable sources — these are secondary elements that may have received less careful migration attention. Give this file extra scrutiny.
- `inflow-nonnegativity.md` may be a short file (the source inflow non-negativity section was relatively brief). Verify that its short length matches the source length minus frontmatter, not a truncation.

## Testing Requirements

### Unit Tests

Not applicable.

### Integration Tests

After tickets 001-003, run `mdbook build` to confirm exit 0.

## Dependencies

- **Blocked By**: ticket-002 (establishes per-file audit report format for math specs)
- **Blocks**: ticket-009 (math specs mapping audit in Epic 02)

## Effort Estimate

**Points**: 3
**Confidence**: High
