# ticket-012 Audit Algorithm Reference Pages for Consistency with Formal Specs

## Context

### Background

The 13 algorithm reference pages in `src/algorithms/` provide accessible explanations of the SDDP algorithm and its components for readers who are not optimization specialists. These pages simplify the formal mathematical specifications into plain-language descriptions with illustrative formulas. The risk is that simplification introduces **factual inconsistencies**: a formula that looks correct at first glance but differs from the formal spec in a way that would mislead an implementer.

The algorithm reference pages were written fresh for `cobre-docs` (not migrated from `powers-rs`). They were reviewed during Epic 01 but only for structural completeness (link resolution, heading integrity), not for mathematical consistency with the formal specs.

The 13 pages contain **68 markdown links** total, of which **31 link directly to formal spec files** in `src/specs/`. There are also **2 anchor-bearing links** that reference specific sections:

- `sddp-theory.md` links to `sddp-algorithm.md#4-policy-graph-structure`
- `cut-selection.md` links to `cut-management.md#9-selection-parameters`

### Relation to Epic

This is the third ticket in Epic 03. It shifts focus from cross-reference accuracy (tickets 010-011) to **content consistency** between the algorithm reference layer and the formal spec layer. A contradiction between these layers is a HIGH finding because developers may rely on the algorithm reference for conceptual understanding and then implement against the formal spec -- or vice versa.

### Current State

The 13 algorithm reference files are at `/home/rogerio/git/cobre-docs/src/algorithms/`:

| File                     | Links | Links to Specs | Primary Formal Spec                                                    |
| ------------------------ | ----- | -------------- | ---------------------------------------------------------------------- |
| `sddp-theory.md`         | 10    | 3              | `specs/math/sddp-algorithm.md`                                         |
| `benders.md`             | 7     | 4              | `specs/math/lp-formulation.md`                                         |
| `forward-backward.md`    | 7     | 2              | `specs/math/sddp-algorithm.md`                                         |
| `convergence.md`         | 7     | 3              | `specs/math/stopping-rules.md`, `specs/math/upper-bound-evaluation.md` |
| `stochastic-modeling.md` | 4     | 1              | `specs/math/par-inflow-model.md`                                       |
| `par-model.md`           | 2     | 1              | `specs/math/par-inflow-model.md`                                       |
| `spatial-correlation.md` | 4     | 1              | `specs/math/par-inflow-model.md`                                       |
| `scenario-generation.md` | 7     | 2              | `specs/math/sddp-algorithm.md`, `specs/math/par-inflow-model.md`       |
| `cut-management.md`      | 6     | 2              | `specs/math/cut-management.md`                                         |
| `single-multi-cut.md`    | 4     | 1              | `specs/math/cut-management.md`                                         |
| `cut-selection.md`       | 4     | 2              | `specs/math/cut-management.md`                                         |
| `risk-measures.md`       | 4     | 2              | `specs/math/risk-measures.md`                                          |
| `cvar.md`                | 3     | 1              | `specs/math/risk-measures.md`                                          |

Each algorithm reference page has a "Further reading" or "Related topics" section that links to the corresponding formal spec(s). These links are the primary navigation path for a reader who wants to go from conceptual understanding to the formal definition.

## Specification

### Requirements

For each of the 13 algorithm reference pages, perform the following checks:

**Check A -- Formula Consistency**: Compare every formula in the algorithm reference page against its counterpart in the corresponding formal spec. Verify:

1. The formula is mathematically equivalent (simplification is acceptable; contradiction is not)
2. Variable names match the notation conventions in `specs/overview/notation-conventions.md`
3. No formula in the algorithm reference contradicts the formal spec

Key comparisons (highest risk):

- `sddp-theory.md`: optimality gap formula `gap^k = (z_bar - z_underline) / max(1, |z_bar|)` vs `sddp-algorithm.md §3.3`
- `par-model.md`: PAR(p) equation `a_{h,t} = mu + sum(psi * (a_{h,t-l} - mu)) + sigma * epsilon` vs `par-inflow-model.md`
- `risk-measures.md`: convex combination `rho = (1-lambda) E[Z] + lambda CVaR_alpha[Z]` vs `risk-measures.md` formal spec
- `cvar.md`: CVaR definition `CVaR_alpha(Z) = min_eta { eta + (1/alpha) E[(Z-eta)^+] }` vs formal spec
- `benders.md`: cut formula `theta >= alpha + beta^T x` vs `cut-management.md §1`
- `convergence.md`: lower bound formula `z_underline^k = c_1^T x_1 + theta_1` vs `sddp-algorithm.md §3.3`
- `cut-selection.md`: activity criterion `theta* - (alpha_k + beta_k^T x) < epsilon` vs `cut-management.md §6`

**Check B -- Factual Claim Consistency**: Verify key non-formula claims in each algorithm reference page against the formal specs:

1. `sddp-theory.md` claims "Each iteration adds new cuts, progressively tightening the approximation" -- verify this matches `sddp-algorithm.md` backward pass description
2. `sddp-theory.md` claims "Cobre uses the single-cut formulation by default" and "A multi-cut variant is planned for future releases" -- verify against `deferred.md`
3. `forward-backward.md` claims "Multiple independent trajectories are simulated in parallel" -- verify against `sddp-algorithm.md §3.1`
4. `forward-backward.md` claims "the forward pass LP solution at each stage also provides a warm-start basis for the corresponding backward pass solves" -- verify against `solver-workspaces.md` or `sddp-algorithm.md`
5. `scenario-generation.md` claims "The opening tree is generated once and remains fixed throughout training" -- verify against `sddp-algorithm.md`
6. `risk-measures.md` claims "the first-stage LP objective is not a valid lower bound on the true risk-averse optimal cost" -- verify against `risk-measures.md` formal spec
7. `cut-management.md` claims "deactivated cuts are not deleted from memory -- they are relaxed to -infinity" -- verify against `cut-management.md` formal spec
8. `single-multi-cut.md` claims multi-cut is deferred -- verify against `deferred.md`

**Check C -- "Further Reading" Link Accuracy**: For each algorithm reference page, verify:

1. Every "Further reading" / "Related topics" link resolves to the correct file (structural check -- should already pass from Epic 01)
2. The linked formal spec is the **correct** one for the topic (semantic check)
3. No essential formal spec is missing from the "Further reading" section

**Check D -- Anchor Fragment Verification**: Verify the 2 anchor-bearing links:

1. `sddp-theory.md` line 49: `[SDDP Algorithm (spec) -- Policy Graph Structure](../specs/math/sddp-algorithm.md#4-policy-graph-structure)` -- verify `sddp-algorithm.md` has heading `## 4. Policy Graph Structure`
2. `cut-selection.md` line 51: `[Cut Management (spec) -- section 9](../specs/math/cut-management.md#9-selection-parameters)` -- verify `cut-management.md` has heading `## 9. Selection Parameters`

### Inputs

- Algorithm reference pages: `/home/rogerio/git/cobre-docs/src/algorithms/*.md` (13 files)
- Formal specs for comparison: `/home/rogerio/git/cobre-docs/src/specs/math/*.md` (14 files)
- Architecture specs for claim verification: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-workspaces.md`, `training-loop.md`
- Deferred features: `/home/rogerio/git/cobre-docs/src/specs/deferred.md`
- Notation conventions: `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md`

### Outputs

A structured audit report at:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-012-audit-report.md`

The report must contain:

1. **Summary table**: `| Algorithm Page | Formulas Checked | Formulas OK | Claims Checked | Claims OK | Further Reading OK | Verdict |`
2. **Per-page formula audit**: For each page, list every formula, its formal spec counterpart, and MATCH/MISMATCH
3. **Per-page claim audit**: For each factual claim checked, record the claim, the formal spec reference, and CONSISTENT/INCONSISTENT
4. **Further reading audit**: For each page, list all "Further reading" links, their targets, and CORRECT/INCORRECT/MISSING
5. **Anchor verification**: Results for the 2 anchor-bearing links
6. **Findings list**: severity-classified

### Error Handling

- Formula in algorithm reference contradicts formal spec: **HIGH** (implementer may rely on wrong formula)
- Factual claim contradicts formal spec: **HIGH** (misleading conceptual understanding)
- Acceptable simplification that omits details but does not contradict: **not a finding** (by design, algorithm reference pages are simplified)
- "Further reading" link points to wrong formal spec: **HIGH** (reader directed to wrong specification)
- Essential formal spec missing from "Further reading": **MEDIUM** (navigability gap)
- Anchor fragment does not match heading: **HIGH** (link jumps to wrong section)
- Notation inconsistency (different variable name for same concept): **MEDIUM**

## Acceptance Criteria

- [ ] Given all 13 algorithm reference pages, when every formula is compared to its formal spec counterpart, then zero formulas contradict the formal spec
- [ ] Given `sddp-theory.md`, when its optimality gap formula is compared to `sddp-algorithm.md §3.3`, then the formulas are mathematically equivalent
- [ ] Given `par-model.md`, when its PAR(p) equation is compared to `par-inflow-model.md`, then the equations are mathematically equivalent
- [ ] Given `risk-measures.md` and `cvar.md`, when their CVaR formulas are compared to `specs/math/risk-measures.md`, then all are mathematically equivalent
- [ ] Given the 8 key factual claims listed in Check B, when verified against formal specs, then zero contradictions are found
- [ ] Given all 13 pages' "Further reading" sections, when links are verified, then all point to the correct formal specs
- [ ] Given the 2 anchor-bearing links, when fragments are checked against target headings, then both resolve correctly
- [ ] All findings are severity-classified; zero CRITICAL findings expected
- [ ] The audit report has a 13-row summary table and per-page formula/claim audit sections

## Implementation Guide

### Suggested Approach

**Step 1: Build the comparison matrix.**

For each algorithm reference page, identify the primary formal spec(s) it corresponds to (use the table in Context > Current State). This establishes which files to compare.

**Step 2: Formula-by-formula comparison.**

For each algorithm reference page:

1. Extract all LaTeX formulas (`$$...$$` blocks and `$...$` inline)
2. For each formula, locate the equivalent formula in the formal spec
3. Verify mathematical equivalence (same variables, same operators, same relationships)
4. Check notation against `notation-conventions.md`

```bash
# Extract all display formulas from algorithm reference pages
for f in /home/rogerio/git/cobre-docs/src/algorithms/*.md; do
  echo "=== $(basename $f) ==="
  grep -n '^\$\$' "$f"
done
```

**Step 3: Factual claim verification.**

For each of the 8 claims listed in Check B:

1. Read the claim in context in the algorithm reference page
2. Open the cited formal spec
3. Verify the claim is consistent

**Step 4: "Further reading" audit.**

```bash
# Extract all "Further reading" / "Related topics" links
for f in /home/rogerio/git/cobre-docs/src/algorithms/*.md; do
  echo "=== $(basename $f) ==="
  # Get lines after "Further reading" or "Related topics" heading
  sed -n '/^## .*[Ff]urther\|^## .*[Rr]elated/,/^## /p' "$f" | grep -oP '\[.*?\]\([^)]+\)'
done
```

**Step 5: Anchor fragment verification.**

Read the target files and verify the headings:

- `sddp-algorithm.md`: look for `## 4. Policy Graph Structure`
- `cut-management.md`: look for `## 9. Selection Parameters`

**Step 6: Compile findings and write the audit report.**

### Key Files to Modify

No source files are modified. The sole deliverable is:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-012-audit-report.md`

### Patterns to Follow

- Follow the same severity classification from the plan README
- Assign unique finding IDs continuing from ticket-011's numbering
- For formula comparisons, quote both the algorithm reference formula and the formal spec formula side-by-side in the report

### Pitfalls to Avoid

- **Simplification is not a finding**: Algorithm reference pages intentionally simplify. The PAR(p) equation in `par-model.md` uses the same notation as the formal spec, but the text around it is simpler. This is by design. Only flag when the simplification introduces a factual error.
- **Notation conventions may differ slightly between prose and formal notation**: The formal spec may use `\hat{x}` while the algorithm reference uses `x` with a verbal qualifier "trial point". This is acceptable if the meaning is clear.
- **The `convergence.md` page covers material from TWO formal specs**: `stopping-rules.md` (stopping criteria) and `upper-bound-evaluation.md` (deterministic upper bound). Both must be checked.
- **The `benders.md` page references both the LP formulation and the cut management spec**: It discusses the stage subproblem (from `lp-formulation.md`) and how cuts are derived (from `cut-management.md`). Check both.
- **Do not verify claims about crate implementation details**: The algorithm reference pages occasionally mention Cobre's specific design choices (e.g., "Cobre uses single-cut by default"). Verify these against the specs and `deferred.md`, not against source code.

## Testing Requirements

### Unit Tests

Not applicable -- read-only audit ticket.

### Integration Tests

The audit report is the deliverable. For each formula comparison in the report, a reviewer must be able to open both the algorithm reference page and the formal spec, locate both formulas, and verify the MATCH/MISMATCH judgment.

### E2E Tests

No files are modified, so no `mdbook build` verification needed.

## Dependencies

- **Blocked By**: ticket-003 (math spec content integrity must be confirmed before comparing against algorithm reference)
- **Blocks**: ticket-018/019 (remediation of any contradictions found)

## Effort Estimate

**Points**: 3
**Confidence**: High
