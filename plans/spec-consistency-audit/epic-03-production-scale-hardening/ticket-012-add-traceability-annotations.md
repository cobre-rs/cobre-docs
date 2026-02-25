# ticket-012 Add Traceability Annotations to Production Scale Reference

## Context

### Background

After ticket-010 verified all values and ticket-011 updated the forward pass count to 192, the `production-scale-reference.md` contains correct values throughout. However, a reader encountering these values has no way to independently verify them without reading the LP sizing calculator source code and understanding its relationship to the spec. This ticket adds traceability annotations that link each value to its source (calculator output, calculator formula, or domain assumption), and expands the existing section 3.4 note into a proper verification subsection with runnable commands.

The accumulated learnings from Epics 01-02 established that `tools/lp_sizing.py` (referenced in the spec as `scripts/lp_sizing.py`) is the ground truth for LP sizing values, and that the spec's worst-case AR(12) estimates diverge from the calculator's average AR(6) defaults by design. The traceability annotations must make this dual-assumption structure explicit and self-documenting.

### Relation to Epic

This is the final ticket in Epic 03. It builds on the verified and updated values from tickets 010 and 011 to add a layer of reproducibility to the spec. After this ticket, any reader can run a single command and confirm every numeric value in sections 3.1-3.4.

### Current State

`production-scale-reference.md` section 3.4 currently has:

- A one-paragraph description of the sizing calculator tool
- A 5-row table with headline values (6,923 vars, 20,788 constraints, 5,788 active, 1,120 state dim, 128.7 MB cuts/stage)
- A "Note" blockquote explaining the AR(12) vs AR(6) difference

The note is informative but does not provide:

- The exact command to run the calculator
- How to interpret the output against sections 3.1-3.3
- Which values come from the calculator vs. which are domain assumptions
- How to verify the worst-case AR(12) estimates

## Specification

### Requirements

#### R1. Expand Section 3.4 Into a Verification Subsection

Replace the current section 3.4 content with an expanded subsection that includes:

1. **Calculator location**: Explicit path (`scripts/lp_sizing.py` in the `powers` repository).
2. **Verification command**: The exact command to run with default parameters: `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin`. Note that an empty JSON uses all defaults.
3. **Default parameter table**: A table listing the calculator's default parameters that drive the production-scale values (extracted from `SystemConfig` dataclass defaults in the calculator). This makes the assumptions explicit without requiring the reader to inspect the source. Include at minimum: n_hydros=160, n_thermals=130, n_buses=6, n_lines=10, n_blocks=3, n_pumps=5, n_contracts_import=3, n_contracts_export=2, avg_ar_order=6, max_ar_order=12, n_hydros_with_fpha=50, avg_fpha_planes=10, n_cuts_capacity=15000, n_stages=120, n_iterations=50, n_forward_passes=192 (updated from 200 by ticket-011).
4. **Output mapping**: A table mapping calculator output fields to spec section references (e.g., "Total variables → §3.1 approximate total", "Total constraints → §3.2 approximate total").
5. **Retain the existing headline values table** (updated by ticket-011 if forward pass change affected any values — note: forward pass count does not affect LP sizing, so these values should be unchanged).
6. **Retain and refine the AR(12) vs AR(6) note**, making it clearer that sections 3.1 and 3.2 use worst-case AR(12) for per-row estimates while the calculator headline uses average AR(6).

#### R2. Add Source Annotations to Section 3.1 Table

Add a fourth column "Source" to the section 3.1 variable count table. For each row, indicate one of:

- **Calculator**: Value matches the calculator's `calculate_sizing()` output for this variable category (at avg AR(6) for AR-dependent rows).
- **Calculator (AR 12)**: Value uses worst-case AR(12) assumption; calculator default uses AR(6) — value would match calculator if `avg_ar_order` set to 12.
- **Domain**: Value is a domain assumption or design choice (e.g., number of deficit segments, number of slack types).

#### R3. Add Source Annotations to Section 3.2 Table

Same as R2 but for the constraint count table.

#### R4. Add Verification Notes to Section 3.3

Add a brief note at the top of section 3.3 stating: "These formulas correspond one-to-one with the `calculate_sizing()` function in `scripts/lp_sizing.py` (lines 191-234). Each term below maps to a named field in the `LPSizing` dataclass."

Do NOT add per-line annotations to the code blocks — that would be too verbose and would break if the calculator code changes. The single mapping note is sufficient.

#### R5. Section 4 Annotation

Add a brief note at the top of section 4 stating: "Performance expectations in this section are aspirational targets, not calculator-derived values. They will be validated and refined during implementation. See §3.4 for calculator-verifiable values."

This distinguishes the verifiable (calculator-derived) values in section 3 from the aspirational (experience-based) targets in section 4.

### Inputs/Props

- `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` — the file to modify
- `~/git/powers/scripts/lp_sizing.py` — read-only reference for parameter defaults and function structure
- findings-010 report (from ticket-010) — for verification context

### Outputs/Behavior

- Modified `production-scale-reference.md` with traceability annotations in sections 3.1, 3.2, 3.3, 3.4, and 4.
- A changes log `changes-012.md` in the epic directory documenting the additions.

### Error Handling

- If the calculator's default `n_forward_passes` is still 200 (because the calculator is out of scope for modification), note this in the verification subsection: "The calculator default uses `n_forward_passes: 200`; the spec uses 192. This parameter does not affect LP sizing values."
- If adding a fourth column to sections 3.1/3.2 causes markdown table rendering issues in mdbook, use inline annotations (e.g., superscript markers with a legend) instead.

## Acceptance Criteria

- [ ] Given `production-scale-reference.md` section 3.4, when a reader follows the documented verification command (`echo '{}' | python3 scripts/lp_sizing.py /dev/stdin`), then the calculator output matches every value in the section 3.4 headline table.
- [ ] Given `production-scale-reference.md` section 3.4, when the default parameter table is read, then it lists all calculator defaults that drive the production-scale values, including the AR order and forward pass count.
- [ ] Given `production-scale-reference.md` section 3.1, when the "Source" column is read, then every row indicates whether its value comes from the calculator, from the calculator at a different AR order, or from a domain assumption.
- [ ] Given `production-scale-reference.md` section 3.2, when the "Source" column is read, then every row has a source annotation following the same convention as section 3.1.
- [ ] Given `production-scale-reference.md` section 3.3, when the introductory note is read, then it references the calculator function and line range.
- [ ] Given `production-scale-reference.md` section 4, when the introductory note is read, then it clearly distinguishes aspirational targets from calculator-derived values.
- [ ] `mdbook build` exits 0 with no new warnings.
- [ ] A changes log `changes-012.md` exists documenting every addition.

## Implementation Guide

### Suggested Approach

1. **Read the current section 3.4** and plan the expansion. The existing content should be preserved and wrapped in the new structure.

2. **Build the default parameter table** by reading the `SystemConfig` dataclass defaults in `lp_sizing.py` (lines 48-88). Extract the key parameters that affect LP sizing.

3. **Build the output mapping table** by comparing the calculator's `print_report()` function output fields against spec sections.

4. **Add the "Source" column to s3.1 table**: Read each row's formula and check whether it uses AR-order-dependent terms. Rows with `P` or `AR_ORDER` in the formula get "Calculator (AR 12)". Rows without AR dependency get "Calculator". The approximate total gets "Derived (sum of above)".

5. **Add the "Source" column to s3.2 table**: Same logic. The Benders cuts row gets "Configuration" since it is a pre-allocated capacity setting.

6. **Add the section 3.3 introductory note**: One paragraph referencing the calculator function.

7. **Add the section 4 introductory note**: One sentence distinguishing aspirational from calculated values.

8. **Write the changes log**: Document each addition with location and rationale.

9. **Build and verify**: Run `mdbook build`.

### Key Files to Modify

- `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` — sections 3.1, 3.2, 3.3, 3.4, and 4
- **Read only**: `~/git/powers/scripts/lp_sizing.py` — for parameter defaults and function structure
- **Create**: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-03-production-scale-hardening/changes-012.md`

### Patterns to Follow

- Use the same annotation style as the existing "Note" blockquotes in the spec (the `> **Note**:` format).
- For the source column values, use short labels that are self-explanatory: "Calculator", "Calculator (AR 12)", "Domain", "Configuration", "Derived".
- Follow the mdbook-compatible markdown table format already used in the document.

### Pitfalls to Avoid

- **Do NOT add inline code comments to section 3.3 code blocks** — this would make the formulas harder to read and would break if the calculator code changes. Use a single introductory note instead.
- **Do NOT change any numeric values** — this ticket only adds annotations and traceability. All values should already be correct from tickets 010 and 011.
- **Do NOT reference absolute file paths** in the spec annotations — use repository-relative paths (`scripts/lp_sizing.py`) since the spec is documentation for the project, not for this audit.
- **Keep the annotations concise** — the goal is traceability, not tutorial-level documentation. A reader should be able to verify values, not learn SDDP from the annotations.
- **The calculator's `n_forward_passes` default is 200** (in the `powers` repo), but the spec now uses 192. Note this discrepancy in the verification section — it does not affect LP variable/constraint counts since those are independent of forward pass count.

## Testing Requirements

### Unit Tests

Not applicable — this is a documentation enhancement.

### Integration Tests

Not applicable.

### E2E Tests

- `mdbook build` must exit 0 with no new warnings.
- Manual review: the section 3.1 and 3.2 tables should render correctly in mdbook with the added Source column.

## Dependencies

- **Blocked By**: ticket-010 (value verification), ticket-011 (forward pass update)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
