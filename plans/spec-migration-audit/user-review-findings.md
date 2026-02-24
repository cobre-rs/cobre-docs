# User Review Findings

**Date**: 2026-02-24
**Source**: `/home/rogerio/git/cobre-docs/review.md`

These findings were reported by the project owner during a non-exhaustive manual review. They must be incorporated into Epic 06 remediation tickets during refinement.

## Findings

### R1 — cobre-solver description incomplete (MEDIUM)

**Location**: Overview spec (section 4)
**Issue**: cobre-solver is described as "LP/MIP solver abstraction with HiGHS backend" but should mention that HiGHS is not the only backend. At minimum, HiGHS and CLP must both be highlighted.
**Fix**: Update the cobre-solver description to mention both HiGHS and CLP backends.

### R2 — Non-Controllable Sources no longer deferred (HIGH)

**Location**: `src/specs/deferred.md`, section C.5
**Issue**: There is a section for "C.5 Non-Controllable Sources" in the deferred features spec, but this feature is no longer deferred — it is modeled and will be implemented.
**Fix**: Remove or reclassify C.5 from deferred.md. Update any cross-references that mention NCS as deferred. Update the deferred features count.

### R3 — Legacy "01-math" reference in Design Principles (HIGH)

**Location**: `src/specs/overview/design-principles.md`, section 3.2 "Validation Requirements"
**Issue**: Contains a reference with label "01-math spec category" which is the subfolder name from the old powers-rs specification structure. Must be updated to use cobre-docs naming.
**Fix**: Replace "01-math" references with the correct cobre-docs spec section name.

### R4 — Legacy "01-math" reference in LP Formulation (HIGH)

**Location**: `src/specs/math/lp-formulation.md`, section 4
**Issue**: Same "01-math" legacy reference as R3.
**Fix**: Replace "01-math" references with the correct cobre-docs spec section name.

### R5 — Production Scale Reference needs data-driven rewrite (HIGH)

**Location**: `src/specs/overview/production-scale-reference.md`
**Issue**: Multiple problems:

1. Estimates like `N_withdrawal = 20` and `M_planes = 10` have no clear derivation
2. The `lp_sizing.py` script exists at `~/git/powers/scripts/` with a default JSON input file — it should be run to produce accurate reference numbers
3. Performance expectations by scale have no robust references — they appear fabricated
4. The section mentions `lp_sizing.py` as future work, but the script already exists

**Fix**: Run `~/git/powers/scripts/lp_sizing.py` with its default input file to get accurate LP sizing numbers. Either:
(a) Replace the estimates with script-derived values, or
(b) Explicitly mark performance expectations as non-binding estimates, not hard goals
The user's preference is for robust, verifiable numbers backed by the script.

### R6 — Benders cut coefficient notation change: β → π (HIGH)

**Location**: Cross-cutting — affects multiple math spec files
**Issue**: The current notation uses β for Benders cut coefficients. The user wants to use π instead, for compatibility with broader SDDP literature. This would free β to denote the discount factor again.
**Impact**: This is a structured notation change that touches:

- `src/specs/math/sddp-algorithm.md`
- `src/specs/math/lp-formulation.md`
- `src/specs/math/cut-management.md`
- `src/specs/math/risk-measures.md`
- Possibly algorithm reference pages that reference the notation
- `src/specs/overview/notation-conventions.md` (the notation registry)

**Fix**: Plan and execute a structured search-and-replace:

1. Inventory all files using β for cut coefficients
2. Replace β with π for cut coefficients
3. If β was also used for discount factor, restore that usage
4. Update notation-conventions.md
5. Verify all LaTeX renders correctly after changes
6. Run mdbook build to confirm

### R7 — Risk-measures §5 LaTeX rendering errors (HIGH)

**Location**: `src/specs/math/risk-measures.md`, section 5 "Risk-Averse Subgradient Theorem"
**Issue**: Some text in the theorem has lines through the middle at random places, likely caused by LaTeX/KaTeX rendering errors or markdown strikethrough interpretation.
**Fix**: Inspect the source markdown for accidental `~~` strikethrough markers or KaTeX spans that cross markdown boundaries. Fix the source to render cleanly. This may be related to the 28 pre-existing `<span>` warnings from risk-measures.md identified in Epic 04.

### R8 — Lower bound validity claims in §10 need verification (HIGH)

**Location**: `src/specs/math/risk-measures.md`, section 10 "Lower Bound Validity with Risk Measures"
**Issue**: The user reports that in SDDP for minimization problems, the lower bound IS what holds (it's valid). It's the upper bound estimated via forward-cost sampling that doesn't hold under risk aversion. The current text may have the claims inverted or be confusing.
**Fix**: Review the mathematical claims in §10 carefully:

- In risk-neutral SDDP: lower bound from backward pass IS valid; upper bound from Monte Carlo simulation IS valid
- In risk-averse SDDP (CVaR): lower bound from backward pass is a convergence indicator, not necessarily a valid bound on the true risk-averse cost; the simulation-based upper bound is NOT valid because forward-pass costs under the sampling distribution don't reflect the risk-averse objective
- Verify whether the spec correctly states which bounds hold and which don't
- Fix any incorrect claims

### R9 — cobre-core crate role misidentified (HIGH)

**Location**: Data Model section (section 18), possibly other locations
**Issue**: A mention of "the solver core (cobre-core)" implies cobre-core is the solver crate. But cobre-core is the data model crate (entity types, internal structures, penalty system). The solver crate is cobre-solver.
**Fix**: Search all spec files for mentions of "cobre-core" and verify each usage matches the crate's actual role (data model, entity types, core structures). Fix any instances where cobre-core is described with solver responsibilities.

## Priority for Epic 06

- **R5** (production-scale-reference rewrite) is the largest task — requires running an external script and may change many numbers
- **R6** (notation change β→π) is cross-cutting and affects LaTeX in multiple files — needs careful execution
- **R7/R8** (risk-measures fixes) should be done together since they're in the same file
- **R2** (NCS no longer deferred) changes the deferred features spec structure
- **R3/R4** (01-math references) are simple find-and-replace
- **R1** (solver description) is a single sentence fix
- **R9** (cobre-core role) requires a cross-file audit
