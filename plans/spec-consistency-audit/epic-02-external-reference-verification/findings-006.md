## Findings: Bibliography Academic Entry Verification

### Summary

- Entries verified: 12 (11 academic + 1 software/academic)
- Fully correct: 5
- Corrections needed: 7
- DOIs verified resolving: 2/4 (1 resolves to WRONG paper, 1 resolves but metadata mismatches)
- DOIs unreachable: 0
- arXiv links verified: 1/1
- Optimization Online links verified: 1/1 (but title/description mismatch)

### Severity Classification

| Severity | Count | Description                                                                  |
| -------- | ----- | ---------------------------------------------------------------------------- |
| CRITICAL | 4     | DOI resolves to wrong paper, or title/authors completely wrong for given URL |
| MEDIUM   | 1     | Paper has since been published in journal; citation should be updated        |
| LOW      | 1     | Minor omission (missing DOI that exists)                                     |
| OK       | 5     | All verified fields correct or have only trivial differences                 |

---

### Entry-by-Entry Verification

#### 1. Pereira, M.V.F. & Pinto, L.M.V.G. (1991)

- **Bib line**: `Multi-stage stochastic optimization applied to energy planning. _Mathematical Programming_, 52(1-3), 359-375.`
- **Authors**: CORRECT -- Crossref confirms M. V. F. Pereira and L. M. V. G. Pinto
- **Year**: CORRECT -- 1991
- **Title**: CORRECT -- "Multi-stage stochastic optimization applied to energy planning"
- **Journal**: CORRECT -- Mathematical Programming, Volume 52, Issue 1-3, Pages 359-375
- **DOI/URL**: N/A (none provided; DOI exists: `10.1007/bf01582895`)
- **Overall**: **OK** (LOW: could add DOI `10.1007/bf01582895`)
- **Note**: Bib uses en-dash "52(1--3)" which is fine typographically.

---

#### 2. Philpott, A.B. & Guan, Z. (2008)

- **Bib line**: `On the convergence of stochastic dual dynamic programming and related methods. _Operations Research Letters_, 36(4), 450-455.`
- **Authors**: CORRECT -- Crossref confirms A.B. Philpott and Z. Guan
- **Year**: CORRECT -- 2008
- **Title**: CORRECT -- "On the convergence of stochastic dual dynamic programming and related methods"
- **Journal**: CORRECT -- Operations Research Letters, Volume 36, Issue 4, Pages 450-455
- **DOI/URL**: N/A (none provided; DOI exists: `10.1016/j.orl.2008.01.013`)
- **Overall**: **OK** (LOW: could add DOI `10.1016/j.orl.2008.01.013`)

---

#### 3. Costa, B.S., de Matos, V.L. & Philpott, A.B. (2025)

- **Bib line**: `SDDP.jl approaches for infinite horizon problems. _Trends in Computational and Applied Mathematics_, 11(1). doi:10.5540/03.2025.011.01.0355`
- **Authors**: INCORRECT
  - Bib says: Costa, B.S., de Matos, V.L. & Philpott, A.B. (3 authors)
  - Actual (per DOI): Bernardo F. P. Costa, Anderson O. Calixto, Ruan Felipe S. Sousa, Ricardo T. Figueiredo, Debora D. J. Penna, Lucas S. Khenayfis, Alessandra M. R. Oliveira (7 authors)
  - First author initials wrong: "B.S." should be "B.F.P."
  - de Matos and Philpott are NOT authors of this paper
- **Year**: CORRECT -- 2025 (published 2025-01-20)
- **Title**: INCORRECT
  - Bib says: "SDDP.jl approaches for infinite horizon problems"
  - Actual: "Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach"
- **Journal**: INCORRECT
  - Bib says: "Trends in Computational and Applied Mathematics"
  - Actual: "Proceeding Series of the Brazilian Society of Computational and Applied Mathematics" (SBMAC Proceedings)
  - Note: "Trends in Computational and Applied Mathematics" (TEMA) is a different SBMAC journal
- **DOI**: RESOLVES -- `10.5540/03.2025.011.01.0355` resolves correctly to the actual paper
- **Volume/Issue**: Volume 11, Issue 1 is CORRECT; pages 1-7 are missing from bib
- **Overall**: **CRITICAL -- NEEDS CORRECTION**
- **Diagnosis**: The DOI is valid but the bibliography entry has the wrong title, wrong authors, and wrong journal name. It appears the bibliography entry was written for a different (possibly hypothetical or forthcoming) paper by Costa/de Matos/Philpott, and the DOI for the SBMAC proceedings paper was incorrectly attached.
- **Correction**: Either (a) fix the metadata to match the actual DOI target, or (b) if the intent was to cite a different paper by Costa, de Matos & Philpott, find the correct DOI for that paper (it may not yet be published).

---

#### 4. de Matos, V.L., Philpott, A.B. & Finardi, E.C. (2015)

- **Bib line**: `Improving the performance of Stochastic Dual Dynamic Programming. _Journal of Computational and Applied Mathematics_, 290, 196-208.`
- **Authors**: CORRECT -- Crossref confirms Vitor L. de Matos, Andy B. Philpott, Erlon C. Finardi
- **Year**: CORRECT -- 2015
- **Title**: CORRECT -- "Improving the performance of Stochastic Dual Dynamic Programming"
- **Journal**: CORRECT -- Journal of Computational and Applied Mathematics, Volume 290, Pages 196-208
- **DOI/URL**: N/A (none provided; DOI exists: `10.1016/j.cam.2015.04.048`)
- **Overall**: **OK** (LOW: could add DOI)

---

#### 5. Guigues, V. & Bandarra, M.P. (2019) [arXiv]

- **Bib line**: `Single cut and multicut SDDP with cut selection for multistage stochastic linear programs: convergence proof and numerical experiments. arXiv:1902.06757`
- **Authors**: CORRECT for arXiv -- Vincent Guigues and Michelle Bandarra
  - Note: In the published journal version (2021), author order is reversed: Bandarra, Guigues. The middle initial "M.P." is not confirmed (arXiv just says "Michelle Bandarra").
- **Year**: CORRECT for arXiv submission -- 2019 (submitted 2019-02-18, last revised 2019-07-22)
- **Title**: CORRECT for arXiv -- Exact match (note: journal version has "stochastic dual dynamic programming" spelled out instead of "SDDP")
- **Venue**: CORRECT -- arXiv:1902.06757
- **arXiv link**: RESOLVES -- https://arxiv.org/abs/1902.06757 returns HTTP 200
- **Overall**: **MEDIUM -- NEEDS UPDATE**
- **Subsequent publication**: This paper was published in a peer-reviewed journal:
  - Bandarra, M. & Guigues, V. (2021). "Single cut and multicut stochastic dual dynamic programming with cut selection for multistage stochastic linear programs: convergence proof and numerical experiments." _Computational Management Science_, 18(2), 125-148. DOI: `10.1007/s10287-021-00387-8`
- **Recommendation**: Update citation to reference the published journal version (2021) instead of the arXiv preprint, or cite both. Note the author order is reversed in the published version.

---

#### 6. Shapiro, A. (2011)

- **Bib line**: `Analysis of stochastic dual dynamic programming method. _European Journal of Operational Research_, 209(1), 63-72.`
- **Authors**: CORRECT -- Crossref confirms Alexander Shapiro (sole author)
- **Year**: CORRECT -- 2011
- **Title**: CORRECT -- "Analysis of stochastic dual dynamic programming method"
- **Journal**: CORRECT -- European Journal of Operational Research, Volume 209, Issue 1, Pages 63-72
- **DOI/URL**: N/A (none provided; DOI exists: `10.1016/j.ejor.2010.08.007`)
- **Overall**: **OK**

---

#### 7. Philpott, A.B. & de Matos, V.L. (2012)

- **Bib line**: `Dynamic sampling algorithms for multi-stage stochastic programs with risk aversion. _European Journal of Operational Research_, 218(2), 470-483.`
- **Authors**: CORRECT -- Crossref confirms A.B. Philpott and V.L. de Matos
- **Year**: CORRECT -- 2012
- **Title**: CORRECT -- "Dynamic sampling algorithms for multi-stage stochastic programs with risk aversion"
- **Journal**: CORRECT -- European Journal of Operational Research, Volume 218, Issue 2, Pages 470-483
- **DOI/URL**: N/A (none provided; DOI exists: `10.1016/j.ejor.2011.10.056`)
- **Overall**: **OK**

---

#### 8. Philpott, A.B., de Matos, V.L. & Finardi, E.C. (2013)

- **Bib line**: `On solving multistage stochastic programs with coherent risk measures. _Operations Research_, 61(4), 957-970. doi:10.1287/opre.2013.1200`
- **Authors**: CORRECT -- Crossref (for correct DOI) confirms Andy Philpott, Vitor de Matos, Erlon Finardi
- **Year**: CORRECT -- 2013
- **Title**: CORRECT -- "On Solving Multistage Stochastic Programs with Coherent Risk Measures"
- **Journal**: CORRECT -- Operations Research, Volume 61, Issue 4, Pages 957-970
- **DOI**: **INCORRECT -- RESOLVES TO WRONG PAPER**
  - Bib DOI: `10.1287/opre.2013.1200`
  - That DOI resolves to: "Robust and Adaptive Network Flows" by Bertsimas, Nasrabadi & Stiller (2013), Operations Research 61(5), 1218-1242
  - Correct DOI: `10.1287/opre.2013.1175`
  - Confirmed via Crossref: DOI `10.1287/opre.2013.1175` resolves to the correct Philpott et al. paper
- **Overall**: **CRITICAL -- NEEDS CORRECTION**
- **Correction**: Change DOI from `10.1287/opre.2013.1200` to `10.1287/opre.2013.1175`

---

#### 9. Costa, B.S. & Leclere, V. (2023)

- **Bib line**: `Lipschitz-based Inner Approximation of Risk Measures. _Optimization Online_. optimization-online.org/?p=23738`
- **Authors**: PARTIALLY CORRECT
  - Author names match: Bernardo Freitas Paulo da Costa and Vincent Leclere are the authors at that URL
  - The initial "B.S." does not match the actual name "Bernardo Freitas Paulo da Costa" (more accurately B.F.P. da Costa or B. Costa)
- **Year**: CORRECT -- 2023 (published 2023-07-25 on Optimization Online)
- **Title**: **INCORRECT**
  - Bib says: "Lipschitz-based Inner Approximation of Risk Measures"
  - Actual title at URL: "Duality of upper bounds in stochastic dynamic programming"
  - These are completely different titles
- **Venue**: CORRECT -- Optimization Online
- **URL**: RESOLVES -- https://optimization-online.org/?p=23738 returns HTTP 200 with the paper page
- **Overall**: **CRITICAL -- NEEDS CORRECTION**
- **Subsequent publication**: The related arXiv version (arXiv:2107.10930) was published as:
  - Merabet, L., da Costa, B.F.P. & Leclere, V. (2024). "Policy with guaranteed risk-adjusted performance for multistage stochastic linear problems." _Computational Management Science_, DOI: `10.1007/s10287-024-00524-z`
  - Note: The journal version adds a third author (Lucas Merabet)
- **Correction**: Fix the title to "Duality of upper bounds in stochastic dynamic programming". Also verify whether the bibliography description ("Vertex-based inner approximation (SIDP) for deterministic upper bounds") actually matches the content of this paper, or whether a different paper was intended.
- **Note on description**: The description mentions "SIDP" (Stochastic Inner Dynamic Programming?) which may come from a different paper. The paper at p=23738 is about _duality of upper bounds_, which is thematically related but may not be the exact source for vertex-based inner approximation. The 2024 paper (p=25462) "Policy with guaranteed risk-adjusted performance..." with its inner approximation content may be a better match.

---

#### 10. Larroyd, P.V., Matos, V.L., Diniz, A.L. & Borges, C.L.T. (2022)

- **Bib line**: `Tackling the Seasonal and Stochastic Components in Hydro-Dominated Power Systems with High Renewable Penetration. _Energies_, 15(3), 1115. doi:10.3390/en15031115`
- **Authors**: **INCORRECT**
  - Bib says: Larroyd, P.V., Matos, V.L., Diniz, A.L. & Borges, C.L.T.
  - Actual (per DOI/Crossref): Paulo Vitor Larroyd, Renata Pedrini, Felipe Beltran, Gabriel Teixeira, Erlon Cristian Finardi, Lucas Borges Picarelli
  - Only the first author (Larroyd) is in common. The other 3 listed authors are not authors of this paper.
- **Year**: CORRECT -- 2022
- **Title**: **INCORRECT**
  - Bib says: "Tackling the Seasonal and Stochastic Components in Hydro-Dominated Power Systems with High Renewable Penetration"
  - Actual (per DOI/Crossref): "Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem"
- **Journal**: CORRECT -- Energies, Volume 15, Issue 3, Article 1115
- **DOI**: RESOLVES -- `10.3390/en15031115` resolves correctly (to the "Dealing with Negative Inflows" paper)
- **Overall**: **CRITICAL -- NEEDS CORRECTION (wrong title and wrong authors for the DOI)**
- **Diagnosis**: The DOI is for a real Larroyd et al. (2022) paper in Energies, but the title and author list in the bibliography belong to a _different_ paper. The bibliography description ("Inflow non-negativity treatment for PAR(p) models") actually matches the DOI paper's topic ("Dealing with Negative Inflows") much better than the listed title. This suggests the DOI is correct but the title and authors were copied from the wrong source.
- **Correction**: Either:
  - (a) Fix title to "Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem" and fix authors to Larroyd, P.V., Pedrini, R., Beltran, F., Teixeira, G., Finardi, E.C. & Picarelli, L.B.
  - (b) Or, if the intent was to cite a different Larroyd paper about seasonal/stochastic components with Matos/Diniz/Borges as co-authors, find the correct DOI for that paper (it does not appear in Crossref and may be a conference paper or unpublished).

---

#### 11. Dowson, O. & Kapelevich, L. (2021)

- **Bib line**: `SDDP.jl: A Julia Package for Stochastic Dual Dynamic Programming. _INFORMS Journal on Computing_, 33(1), 27-33.`
- **Authors**: CORRECT -- Crossref confirms Oscar Dowson and Lea Kapelevich
- **Year**: CORRECT -- 2021
- **Title**: CORRECT -- "SDDP.jl: A Julia Package for Stochastic Dual Dynamic Programming"
- **Journal**: CORRECT -- INFORMS Journal on Computing, Volume 33, Issue 1, Pages 27-33
- **DOI/URL**: N/A (none provided; DOI exists: `10.1287/ijoc.2020.0987`)
- **Overall**: **OK** (LOW: could add DOI)

---

#### 12. Huangfu, Q. & Hall, J.A.J. (2018)

- **Bib line**: `Parallelizing the dual revised simplex method. _Mathematical Programming Computation_, 10, 119-142.`
- **Authors**: CORRECT -- Crossref confirms Q. Huangfu and J. A. J. Hall
- **Year**: CORRECT -- 2018
- **Title**: CORRECT -- "Parallelizing the dual revised simplex method"
- **Journal**: CORRECT -- Mathematical Programming Computation, Volume 10, Issue 1, Pages 119-142
  - Minor: Bib omits issue number (1). This is acceptable as MPC uses continuous pagination.
- **DOI/URL**: N/A (none provided; DOI exists: `10.1007/s12532-017-0130-5`)
- **Overall**: **OK** (LOW: could add DOI)

---

### Summary Table

| #   | Entry                      | Authors | Year | Title | Journal    | DOI/URL                       | Overall  |
| --- | -------------------------- | ------- | ---- | ----- | ---------- | ----------------------------- | -------- |
| 1   | Pereira & Pinto (1991)     | OK      | OK   | OK    | OK         | N/A                           | OK       |
| 2   | Philpott & Guan (2008)     | OK      | OK   | OK    | OK         | N/A                           | OK       |
| 3   | Costa et al. (2025)        | WRONG   | OK   | WRONG | WRONG      | RESOLVES (to different paper) | CRITICAL |
| 4   | de Matos et al. (2015)     | OK      | OK   | OK    | OK         | N/A                           | OK       |
| 5   | Guigues & Bandarra (2019)  | OK      | OK   | OK    | OK (arXiv) | RESOLVES                      | MEDIUM   |
| 6   | Shapiro (2011)             | OK      | OK   | OK    | OK         | N/A                           | OK       |
| 7   | Philpott & de Matos (2012) | OK      | OK   | OK    | OK         | N/A                           | OK       |
| 8   | Philpott et al. (2013)     | OK      | OK   | OK    | OK         | WRONG DOI                     | CRITICAL |
| 9   | Costa & Leclere (2023)     | PARTIAL | OK   | WRONG | OK         | RESOLVES                      | CRITICAL |
| 10  | Larroyd et al. (2022)      | WRONG   | OK   | WRONG | OK         | RESOLVES (to different paper) | CRITICAL |
| 11  | Dowson & Kapelevich (2021) | OK      | OK   | OK    | OK         | N/A                           | OK       |
| 12  | Huangfu & Hall (2018)      | OK      | OK   | OK    | OK         | N/A                           | OK       |

### Recommended Corrections (Priority Order)

#### CRITICAL (must fix)

1. **Philpott et al. (2013)**: Change DOI from `10.1287/opre.2013.1200` to `10.1287/opre.2013.1175`. All other metadata is correct.

2. **Costa et al. (2025)**: The DOI `10.5540/03.2025.011.01.0355` points to a 7-author SBMAC proceedings paper titled "Boundary conditions for hydrothermal operation planning problems: the infinite horizon approach." The bibliography lists 3 different authors and a different title. Decision needed:
   - **Option A**: Update metadata to match the DOI (change title, authors, journal name)
   - **Option B**: If the intent was to cite a different paper by Costa/de Matos/Philpott (possibly unpublished or forthcoming), remove the DOI and mark as "forthcoming" or find the correct reference

3. **Costa & Leclere (2023)**: The URL `optimization-online.org/?p=23738` points to "Duality of upper bounds in stochastic dynamic programming," not "Lipschitz-based Inner Approximation of Risk Measures." Decision needed:
   - **Option A**: Fix title to match the actual paper at the URL
   - **Option B**: If a different paper was intended, find the correct URL
   - **Note**: The 2024 Costa & Leclere paper "Policy with guaranteed risk-adjusted performance..." at `optimization-online.org/?p=25462` may be a better match for the described SIDP content

4. **Larroyd et al. (2022)**: DOI `10.3390/en15031115` points to "Dealing with Negative Inflows in the Long-Term Hydrothermal Scheduling Problem" by Larroyd, Pedrini, Beltran, Teixeira, Finardi & Picarelli. The bibliography lists a different title and different co-authors. Decision needed:
   - **Option A**: Update title and authors to match the DOI (recommended, since the description about PAR non-negativity matches the actual paper's topic)
   - **Option B**: If a different Larroyd paper was intended, find the correct DOI

#### MEDIUM (should update)

5. **Guigues & Bandarra (2019)**: The arXiv preprint has since been published in _Computational Management Science_ 18(2), 125-148 (2021), DOI `10.1007/s10287-021-00387-8`. Recommend updating citation to the published version or adding the journal reference alongside the arXiv link.

#### LOW (nice to have)

6. **Missing DOIs**: Several entries lack DOIs that exist and could be added for better traceability:
   - Pereira & Pinto (1991): `10.1007/bf01582895`
   - Philpott & Guan (2008): `10.1016/j.orl.2008.01.013`
   - de Matos et al. (2015): `10.1016/j.cam.2015.04.048`
   - Shapiro (2011): `10.1016/j.ejor.2010.08.007`
   - Philpott & de Matos (2012): `10.1016/j.ejor.2011.10.056`
   - Dowson & Kapelevich (2021): `10.1287/ijoc.2020.0987`
   - Huangfu & Hall (2018): `10.1007/s12532-017-0130-5`

### Verification Method

All DOI verifications performed via Crossref API (`api.crossref.org/works/{doi}`) to extract authoritative metadata. arXiv verification performed by fetching the abstract page and extracting `<meta name="citation_*">` tags. Optimization Online verification performed by fetching the page and extracting `<h1 class="entry-title">` and author bylines. Crossref bibliographic search used for entries without DOIs to confirm metadata against the canonical database.
