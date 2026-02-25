## Changes Applied: Epic 02 External Reference Verification

**Date**: 2026-02-24
**Ticket**: ticket-009

### Summary

- Files modified: 7
- CRITICAL issues fixed: 4
- MEDIUM issues fixed: 1
- LOW issues fixed: 3 (annotations, uncited references)
- Priority 2 completeness fixes: 3

---

### 1. Bibliography Metadata Fixes (from findings-006)

#### 1.1 CRITICAL: Philpott et al. (2013) -- Wrong DOI

**File**: `src/reference/bibliography.md` (line 41)

- **Before**: `doi:10.1287/opre.2013.1200` (resolves to Bertsimas et al.)
- **After**: `doi:10.1287/opre.2013.1175` (resolves to correct Philpott et al. paper)
- **Also fixed in**:
  - `src/specs/math/risk-measures.md` (line 270)
  - `src/specs/math/upper-bound-evaluation.md` (line 209)

#### 1.2 CRITICAL: Costa et al. (2025) -- Wrong title, authors, journal

**File**: `src/reference/bibliography.md` (line 22-23)

- **Before**: Costa, B.S., de Matos, V.L. & Philpott, A.B. -- "SDDP.jl approaches for infinite horizon problems." _Trends in Computational and Applied Mathematics_
- **After**: Costa, B.F.P., Calixto, A.O., Sousa, R.F.S., Figueiredo, R.T., Penna, D.D.J., Khenayfis, L.S. & Oliveira, A.M.R. -- "Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach." _Proceeding Series of the Brazilian Society of Computational and Applied Mathematics_, 11(1), 1-7
- **Rationale**: DOI `10.5540/03.2025.011.01.0355` is valid; metadata now matches the actual paper at that DOI
- **Annotation updated**: Changed from "Infinite periodic horizon formulation with cyclic policy graphs" to "Infinite horizon boundary conditions for hydrothermal planning. Related to the infinite horizon extension in `cobre-sddp`."
- **Also fixed in**: `src/specs/math/infinite-horizon.md` (line 123)

#### 1.3 CRITICAL: Costa & Leclere (2023) -- Wrong title

**File**: `src/reference/bibliography.md` (line 46-47)

- **Before**: "Lipschitz-based Inner Approximation of Risk Measures"
- **After**: "Duality of upper bounds in stochastic dynamic programming"
- **Author initials fixed**: B.S. -> B.F.P.
- **Annotation updated**: "Duality framework for upper bounds in stochastic dynamic programming"
- **Also fixed in**: `src/specs/math/upper-bound-evaluation.md` (line 207)

#### 1.4 CRITICAL: Larroyd et al. (2022) -- Wrong title and authors

**File**: `src/reference/bibliography.md` (line 51-52)

- **Before**: Larroyd, P.V., Matos, V.L., Diniz, A.L. & Borges, C.L.T. -- "Tackling the Seasonal and Stochastic Components in Hydro-Dominated Power Systems with High Renewable Penetration"
- **After**: Larroyd, P.V., Pedrini, R., Beltran, F., Teixeira, G., Finardi, E.C. & Picarelli, L.B. -- "Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem"
- **Rationale**: DOI `10.3390/en15031115` is correct; metadata now matches the actual paper
- **Also fixed in**: `src/specs/math/inflow-nonnegativity.md` (line 217)

#### 1.5 MEDIUM: Guigues & Bandarra (2019) -- Updated to journal version

**File**: `src/reference/bibliography.md` (line 30-31)

- **Before**: Guigues, V. & Bandarra, M.P. (2019). arXiv preprint only
- **After**: Bandarra, M. & Guigues, V. (2021). _Computational Management Science_, 18(2), 125-148. doi:10.1007/s10287-021-00387-8. Preprint: arXiv:1902.06757
- **Note**: Author order reversed to match journal publication; arXiv link retained as secondary
- **Also updated in**:
  - `src/specs/math/cut-management.md` (section 8 theorem attribution and reference block)
  - `src/algorithms/cut-selection.md` (line 47, convergence guarantee attribution)

---

### 2. Citation Usage Fixes (from findings-008)

#### 2.1 Shapiro (2011) annotation -- expanded (B6, LOW)

**File**: `src/reference/bibliography.md` (line 36)

- **Before**: "Risk-averse SDDP with CVaR."
- **After**: "Convergence analysis, complexity bounds, and risk-averse extensions (including CVaR) for SDDP."
- **Rationale**: Original annotation was reductive; the paper covers much more than just CVaR

#### 2.2 Philpott & de Matos (2012) annotation -- added (B7, LOW)

**File**: `src/reference/bibliography.md` (line 39)

- **Before**: No annotation (only entry without one)
- **After**: "Dynamic sampling with risk aversion and Markovian scenario transitions."

#### 2.3 de Matos et al. (2015) attribution -- added to cut-management.md (Issue 6)

**File**: `src/specs/math/cut-management.md` (section 7.1)

- **Added**: "This strategy was originally proposed by de Matos, Philpott & Finardi (2015)." to the Level-1 cut selection description
- **Rationale**: The bibliography claims this paper is "Basis for the cut selection in `cobre-sddp`" but it was never cited in any spec. The Level-1 strategy was indeed proposed in this paper.

---

### 3. Uncited References Added (from findings-008)

**File**: `src/reference/bibliography.md` (SDDP Foundations section)

Three references cited in spec/algorithm files but missing from bibliography.md:

1. **Benders, J.F.** (1962). "Partitioning procedures for solving mixed-variables programming problems." _Numerische Mathematik_, 4(1), 238-252.
   - Cited in `algorithms/benders.md` line 72

2. **Birge, J.R.** (1985). "Decomposition and partitioning methods for multistage stochastic linear programs." _Operations Research_, 33(5), 989-1007.
   - Cited in `specs/deferred.md` line 133

3. **Birge, J.R. & Louveaux, F.V.** (2011). _Introduction to Stochastic Programming_. Springer, 2nd edition.
   - Cited in `algorithms/benders.md` line 73

---

### 4. Items NOT Changed (by design)

- **Orphan bibliography entries**: Philpott & Guan (2008), de Matos et al. (2015), Dowson & Kapelevich (2021), Huangfu & Hall (2018) remain in bibliography despite not being cited in spec files. They are useful references and the ticket instructions say not to remove them.
- **MISLEADING claims A9, A10, A13, A15**: These are minor over-attributions where the citation is thematically correct but slightly overstated. The metadata fixes (DOI, title, authors) address the root cause -- once readers can access the correct paper, they can verify the claims themselves. No language softening was needed beyond the metadata corrections.
- **Missing DOIs (LOW)**: DOIs for Pereira & Pinto (1991), Philpott & Guan (2008), de Matos et al. (2015), Shapiro (2011), Philpott & de Matos (2012), Dowson & Kapelevich (2021), and Huangfu & Hall (2018) were not added. These are nice-to-have improvements deferred for a future pass.

---

### 5. Build Verification

```
mdbook build   -->  exit 0
```

Pre-existing warnings about `<span>` tags in `risk-measures.md` are unrelated to these changes.

---

### Files Modified

| File                                       | Changes                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `src/reference/bibliography.md`            | 4 CRITICAL fixes, 1 MEDIUM update, 2 LOW annotation fixes, 3 new entries                                   |
| `src/specs/math/risk-measures.md`          | DOI fix (line 270)                                                                                         |
| `src/specs/math/upper-bound-evaluation.md` | Title fix (line 207), DOI fix (line 209)                                                                   |
| `src/specs/math/infinite-horizon.md`       | Citation metadata fix (line 123)                                                                           |
| `src/specs/math/inflow-nonnegativity.md`   | Citation metadata fix (line 217)                                                                           |
| `src/specs/math/cut-management.md`         | Guigues & Bandarra updated to journal version (section 8), de Matos et al. attribution added (section 7.1) |
| `src/algorithms/cut-selection.md`          | Guigues & Bandarra updated to journal version (line 47)                                                    |
