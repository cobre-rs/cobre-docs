# ticket-018 Fix Cross-Cutting Notation Change: beta to pi for Cut Coefficients

## Context

### Background

The user review (R6) identified a notation change requirement: the current specs use $\beta$ for Benders cut coefficients, but the user wants to switch to $\pi$ for cut coefficients, which is more consistent with the broader SDDP literature and frees $\beta$ for the discount factor. This is the most impactful cross-cutting change in the remediation epic because it touches LaTeX formulas in at least 8 files and requires careful, consistent substitution that does not break rendering or introduce mathematical errors.

The original ticket-018 was scoped for CRITICAL findings, but the audit found 0 CRITICAL findings across all five epics. This ticket is repurposed for the notation change, which is the single most complex and high-risk remediation item.

### Relation to Epic

This ticket handles the highest-risk remediation: a structured cross-cutting notation change. It must be executed first because other tickets (019, 020) may edit the same files for different reasons, and the notation change establishes the canonical symbol set that all subsequent edits must respect.

### Current State

The current notation convention (defined in `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md` line 20) is:

```
| $(\alpha, \beta)$        | Cut intercept and coefficients           |
```

Throughout the math specs, cut coefficients use `$\beta$` with superscripts:

- `$\beta^v_h$` — storage cut coefficient
- `$\beta^{lag}_{h,\ell}$` — AR lag cut coefficient
- `$\bar{\beta}$` — aggregated cut coefficients
- `$\beta_t(\omega)$` — per-scenario cut coefficients
- `$\beta_k$` — cut coefficient vector in selection formulas

The discount factor currently uses `$d$` explicitly to avoid collision with `$\beta$` (see discount-rate.md line 11, sddp-algorithm.md line 147, risk-measures.md line 13, upper-bound-evaluation.md line 9).

**IMPORTANT**: The symbol `$\pi$` is already used for dual variables (Lagrange multipliers) in notation-conventions.md line 19. The user's intent is that cut coefficients — which ARE derived from duals — use `$\pi$` with appropriate superscripts to make this derivation explicit. This is consistent with the existing convention where `$\pi^{wb}_h$` and `$\pi^{lag}_{h,\ell}$` are the duals, and `$\beta^v_h = \pi^{wb}_h$` (see notation-conventions.md line 307). After the rename, the cut coefficient IS the dual variable, eliminating the notational indirection.

## Specification

### Requirements

1. Replace `$\beta$` with `$\pi$` for all Benders cut coefficient symbols across all affected files
2. Update the notation conventions table to reflect the change
3. Remove or update the "symbol note" disclaimers that explain why `$d$` is used instead of `$\beta$` for discount factor (the collision concern is eliminated)
4. Verify all LaTeX renders correctly after changes
5. Do NOT change `$\beta$` when it appears in non-cut-coefficient contexts (e.g., `$\beta_h^{storage}$` in hydro-production-models.md line 281 which is a production model coefficient)

### Files to Modify

1. **`/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md`** — Update the general conventions table (line 20) and all cut coefficient references in §5.4 (lines 270-356)
2. **`/home/rogerio/git/cobre-docs/src/specs/math/cut-management.md`** — Heavy: cut definition §1 (line 12), dual extraction §2 (lines 31-46), aggregation §3 (lines 61-72), validity §4 (line 83), activity §6 (lines 109-117), selection §7 (lines 156-162)
3. **`/home/rogerio/git/cobre-docs/src/specs/math/sddp-algorithm.md`** — Lines 75, 94, 147, 185, 188, 198
4. **`/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md`** — Lines 13, 109, 112, 146-147, 180, 186
5. **`/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md`** — Lines 349, 355, 356
6. **`/home/rogerio/git/cobre-docs/src/specs/math/discount-rate.md`** — Lines 11, 91, 94, 96
7. **`/home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md`** — Lines 9, 113
8. **`/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md`** — Line 83 (`$\beta_h^{storage}$` — this is a production model coefficient, NOT a cut coefficient; do NOT change)
9. **`/home/rogerio/git/cobre-docs/src/specs/math/hydro-production-models.md`** — Line 281 (`$\beta_{\hat{v}_h}$` — this IS a cut coefficient, representing the storage dual contribution; change to `$\pi_{\hat{v}_h}$`)
10. **`/home/rogerio/git/cobre-docs/src/specs/deferred.md`** — Lines ~103-104 (multi-cut formulation uses `$\beta_k(\omega)$`)
11. **Algorithm reference pages** — Check `src/algorithms/benders.md` for any `$\beta$` usage

### Substitution Rules

The substitution is NOT a blind find-and-replace. Apply these rules:

| Pattern                                | Replace With    | Context                                |
| -------------------------------------- | --------------- | -------------------------------------- |
| `\beta^v`                              | `\pi^v`         | Storage cut coefficient                |
| `\beta^{lag}`                          | `\pi^{lag}`     | AR lag cut coefficient                 |
| `\bar{\beta}`                          | `\bar{\pi}`     | Aggregated cut coefficient             |
| `\beta_t(\omega)`                      | `\pi_t(\omega)` | Per-scenario cut coefficient vector    |
| `\beta_k` (in cut selection formulas)  | `\pi_k`         | Cut coefficient vector for cut k       |
| `\beta_i` (in cut constraint formulas) | `\pi_i`         | Cut coefficient vector for cut i       |
| `\beta(\omega)`                        | `\pi(\omega)`   | Shorthand for per-scenario coefficient |

DO NOT substitute:

- `$\beta_h^{storage}$` in block-formulations.md — this is a production function coefficient, not a Benders cut coefficient
- Any `$\beta$` that appears inside prose text as a Greek letter name without mathematical context

### Symbol Note Updates

After the rename, the "symbol notes" in several files that say "we use $d$ for discount factor, not $\beta$, which denotes cut coefficients" become confusing because `$\pi$` is now the cut coefficient symbol. Update these notes:

- **discount-rate.md line 11**: Remove the parenthetical about `$\beta$`; simplify to note that `$d$` is the discount factor symbol
- **sddp-algorithm.md line 147**: Remove the "symbol note" block quote entirely, or simplify it
- **risk-measures.md line 13**: Update the bullet for `$d$` to remove the `$\beta$` reference
- **upper-bound-evaluation.md line 9**: Update the symbol convention note

### Error Handling

If any LaTeX formula fails to render after substitution, revert that specific formula and investigate. Common risks:

- Missing closing braces after multi-character superscripts
- Accidental substitution inside `\text{}` blocks
- Double-pi conflicts where `$\pi$` appears as both a dual variable and cut coefficient in the same formula (this should not occur because the rename makes them the same symbol)

## Acceptance Criteria

- [ ] Given `notation-conventions.md`, when reading the general conventions table (§1), then `$(\alpha, \pi)$` appears as "Cut intercept and coefficients" (not `$\beta$`)
- [ ] Given `notation-conventions.md` §5.4, when reading the cut coefficient derivation, then all cut coefficient symbols use `$\pi^v_h$` and `$\pi^{lag}_{h,\ell}$`
- [ ] Given `cut-management.md`, when reading the cut definition (§1), then the formula uses `$\pi^v_h$` and `$\pi^{lag}_{h,\ell}$` for cut coefficients
- [ ] Given `cut-management.md` §3, when reading the aggregation formulas, then `$\bar{\pi}^v$` and `$\bar{\pi}^{lag}$` appear (not `$\bar{\beta}$`)
- [ ] Given `sddp-algorithm.md` §6.1, when reading the single-cut formula (line ~185), then `$\bar{\pi}$` appears
- [ ] Given `risk-measures.md` §5, when reading the risk-averse subgradient application (line ~112), then `$\pi_{t,h}(\omega)$` appears for cut coefficients
- [ ] Given `lp-formulation.md` §11, when reading Benders cut constraints, then `$\pi^v_{i,h}$` and `$\pi^{lag}_{i,h,\ell}$` appear
- [ ] Given `discount-rate.md`, when reading the symbol convention note, then it does NOT mention `$\beta$` as the reason for using `$d$`
- [ ] Given `block-formulations.md` line 83, when reading the storage coefficient, then `$\beta_h^{storage}$` is UNCHANGED (it is a production model coefficient, not a Benders cut coefficient)
- [ ] Given all 8+ modified files, when running `mdbook build 2>&1 | grep -c "Rendering failed"`, then the count is 0
- [ ] Given a grep for `\beta` across all math spec files, when filtering for cut coefficient contexts, then zero remaining instances use `$\beta$` for Benders cut coefficients

## Implementation Guide

### Suggested Approach

1. **Inventory all occurrences first**: Run `grep -rn '\\beta' src/specs/math/ src/specs/overview/notation-conventions.md src/specs/deferred.md src/algorithms/` and classify each hit as cut-coefficient (change) or non-cut-coefficient (keep)
2. **Start with notation-conventions.md**: This is the canonical reference; update it first to establish the target notation
3. **Process files in dependency order**: cut-management.md (defines cuts), then sddp-algorithm.md (uses cuts), then risk-measures.md (modifies cuts), then lp-formulation.md (adds cuts to LP), then discount-rate.md, then upper-bound-evaluation.md
4. **Update symbol notes**: After all formula substitutions, clean up the explanatory notes
5. **Run mdbook build** after each file modification to catch rendering errors early
6. **Final grep verification**: Confirm no `$\beta$` remains in cut-coefficient contexts

### Patterns to Follow

- The substitution `\beta^v_h -> \pi^v_h` preserves the superscript/subscript structure exactly
- In aggregation formulas, `\bar{\beta} -> \bar{\pi}` preserves the overbar
- In per-scenario formulas, `\beta_t(\omega) -> \pi_t(\omega)` preserves the subscript and argument

### Pitfalls to Avoid

- **Do NOT change `$\beta_h^{storage}$` in block-formulations.md** — this is a hydro production function coefficient, not a Benders cut coefficient
- **Do NOT change `$\beta_{\hat{v}_h}$` in hydro-production-models.md line 281** WITHOUT verifying context — this line defines a combined dual/cut coefficient and SHOULD be changed
- **The notation-conventions.md §5.4 already has `$\pi^{wb}_h$` for water balance duals**: After the rename, cut coefficients and duals use the same base symbol `$\pi$`, which is intentional — cut coefficients ARE derived directly from duals. The summary table in §5.5 (line ~340) currently shows `$\beta^v_h = \pi^{wb}_h$`; after the rename this becomes `$\pi^v_h = \pi^{wb}_h$` which is cleaner
- **Check for prose references**: Some files mention "the cut coefficient $\beta$" in running text — these must also be updated

## Testing Requirements

### Build Verification

- Run `mdbook build` after completing all substitutions
- Grep build stderr for "Rendering failed" — must be 0
- Grep build stderr for KaTeX warnings related to `\pi` or `\beta` — investigate any new warnings

### Content Verification

- Grep all modified files for remaining `\beta` in math contexts to confirm no cut-coefficient instances were missed
- Verify the notation-conventions.md general table and §5 summary table are internally consistent
- Verify that the `$d$` symbol notes in discount-rate.md, sddp-algorithm.md, risk-measures.md, and upper-bound-evaluation.md no longer reference `$\beta$`

## Dependencies

- **Blocked By**: tickets 001-017 (all audit tickets must complete first — already done)
- **Blocks**: ticket-019, ticket-020, ticket-021 (notation must be established before other file edits)

## Effort Estimate

**Points**: 3
**Confidence**: Medium (cross-cutting LaTeX changes require careful execution; the substitution rules are well-defined but the number of files and formulas is large)
