# Changes Log: ticket-012 Add Traceability Annotations

## File Modified

- `src/specs/overview/production-scale-reference.md`

## Changes by Requirement

### R1. Expanded Section 3.4 into Verification Subsection

**Location**: Section 3.4, renamed from "Sizing Calculator Tool" to "Sizing Calculator Verification"

Added:

- **Calculator Location and Verification Command** sub-section with the exact `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin` command and a note about the `n_forward_passes` 200 vs 192 discrepancy.
- **Default Parameters** table listing all 22 `SystemConfig` defaults that drive the production-scale values, extracted from the calculator's dataclass (lines 48-88).
- **Output Mapping** table mapping 7 calculator output fields to their corresponding spec section references.
- **Headline Values** sub-section preserving the existing 5-row table unchanged.
- **AR(12) vs AR(6) Assumptions** sub-section replacing the previous blockquote note with a more detailed explanation, including both worst-case and average-case values, and a command to verify worst-case values.

### R2. Added "Source" Column to Section 3.1 Table

**Location**: Section 3.1 variable count table

Added fourth column "Source" with the following annotations:

- 16 rows annotated "Calculator" (AR-independent, match calculator defaults)
- 1 row annotated "Calculator (AR 12)" — "Hydro incremental inflow AR" uses P=12 while calculator default is avg_ar_order=6
- 1 row annotated "Derived" — "Total Variables" is the sum of above rows

### R3. Added "Source" Column to Section 3.2 Table

**Location**: Section 3.2 constraint count table

Added fourth column "Source" with the following annotations:

- 12 rows annotated "Calculator" (AR-independent, match calculator defaults)
- 1 row annotated "Calculator (AR 12)" — "Lagged incremental inflow fixing" uses P=12
- 1 row annotated "Configuration" — "Benders cuts (pre-allocated)" is a configurable capacity setting
- 1 row annotated "Derived" — "Total Constraints" is the sum of above rows

### R4. Added Introductory Note to Section 3.3

**Location**: Section 3.3, before the "For precise sizing" paragraph

Added one paragraph noting:

- One-to-one correspondence with `calculate_sizing()` function (lines 191-234)
- Each term maps to a named field in the `LPSizing` dataclass
- The calculator groups two spec constraint rows ("AR dynamics" + "Lagged inflow fixing") into a single `n_cons_hydro_ar_dynamics` field

### R5. Added Introductory Note to Section 4

**Location**: Section 4, before the existing "Purpose" blockquote

Added one blockquote note distinguishing aspirational performance targets from calculator-derived values, with a back-reference to section 3.4.

## Values Changed

None. All numeric values preserved exactly as found. Only annotations and traceability text added.

## Verification

- `mdbook build` exits 0 with no new warnings (pre-existing warnings in `risk-measures.md` are unrelated).
