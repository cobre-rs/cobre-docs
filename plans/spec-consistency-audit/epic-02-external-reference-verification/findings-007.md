## Findings: Bibliography Software/Web Reference Verification

**Date**: 2026-02-24
**Ticket**: ticket-007

### Summary

- Entries verified: 2
- URLs reachable: 2/2
- Descriptions accurate: 2/2 (one with minor nuance noted)

### Entry-by-Entry Verification

#### CEPEL Technical Documentation

- **URL**: https://see.cepel.br/manual/libs/latest/
- **Reachable**: YES [HTTP 200, 0.465s response time]
- **Content matches description**: YES
- **Bibliography description**: "Official documentation for the NEWAVE/DECOMP/DESSEM suite."
- **Notes**:
  - Page title: "Documentacao Tecnica dos modelos para Planejamento da Operacao do SIN - Ambiente Libs"
  - The page is a Sphinx-based documentation site (ReadTheDocs theme) in Portuguese.
  - Confirmed presence of all three named models: NEWAVE (14 occurrences), DECOMP (13 occurrences), DESSEM (12 occurrences).
  - The site also covers additional models beyond those three (visible in sidebar navigation: versioned Libs releases from 7.0.0 through 15.0.0, plus individual NEWAVE, DECOMP, and DESSEM version pages).
  - The site title refers to "Ambiente Libs" which is a broader umbrella for CEPEL's power system optimization models, but NEWAVE, DECOMP, and DESSEM are the three primary models documented.
  - The canonical URL redirects to `index.html` within the same path.
  - The description "Official documentation for the NEWAVE/DECOMP/DESSEM suite" is accurate. The word "suite" is a reasonable characterization since all three models are documented under the unified "Libs" environment.
  - No authentication required.

#### SPARHTACUS Wiki

- **URL**: https://github.com/SPARHTACUS/SPTcpp/wiki
- **Reachable**: YES [HTTP 200, 0.788s response time]
- **Content matches description**: YES
- **Bibliography description**: "Documentation for the C++ SDDP implementation. Reference for auditable pre-processing approach."
- **Notes**:
  - Page title: "Home -- SPARHTACUS/SPTcpp Wiki -- GitHub"
  - Wiki home page content (translated from Portuguese): "The SPARHTACUS model is a computational model for solving electro-energy planning problems, released publicly under ANEEL R&D project PD-07427-0318/2018 SPARHTACUS II, executed by Norus and LABPLAN/UFSC, financed by Norte Energia S.A with technical collaboration from ONS. Norus is the official maintainer of this repository. This wiki serves as the user manual, presenting how to use the software developed in C++ (SPTcpp)."
  - The wiki contains multiple documentation pages:
    - Home (28 revisions)
    - Auditabilidade (auditability -- directly relevant to bibliography claim)
    - Conversao dos Decks Oficiais (conversion of official input decks)
    - Escopo Temporal (temporal scope)
    - Execucao Basica (basic execution)
    - Execucao de Estudos (study execution)
    - Funcionalidades (features)
    - Tipos de Arquivos e Dados (file and data types)
  - Content confirms presence of "auditab" keyword (1 occurrence on main page), "PDDE" (Portuguese acronym for SDDP, 1 occurrence), "pre-process" references, and "estocastic" (stochastic, 2 occurrences).
  - The bibliography description "C++ SDDP implementation" is confirmed: repo language is C++, repo description states "Stochastic optimization model for hidrothermal scheduling problems", and topics include `optimization`, `stochastic`, `hidrothermal`, `linear-programming`.
  - The "auditable pre-processing approach" claim is supported by the dedicated "Auditabilidade" wiki page and the "Conversao dos Decks Oficiais" page (which documents how official NEWAVE/DECOMP input decks are converted).
  - **Repository currency**: Last push was 2025-11-14 (approximately 3 months ago). The 5 most recent commits are:
    - `4e62469` 2025-11-14 "Merge pull request #37 from SPARHTACUS/EscalonamentoCortes" (cut scaling)
    - `f60e290` 2025-11-14 "Atualizacao versao" (version update)
    - `5666eae` 2025-11-14 "Escalonamento cortes" (cut scaling implementation)
    - `127fd09` 2025-11-12 "Merge pull request #36 from SPARHTACUS/AtualizacaoGRB" (Gurobi update)
    - `8d200b4` 2025-11-12 "Ajuste projeto com configuracao para GRB" (Gurobi config)
  - Repository is NOT archived. Active development as of late 2025.
  - No authentication required for wiki access.

### Discrepancies and Recommendations

No discrepancies found. Both bibliography entries are accurate and their URLs are reachable.

**Minor observations** (informational, no action required):

1. The CEPEL Libs documentation covers more than just NEWAVE/DECOMP/DESSEM (it includes the broader "Libs" versioned environment), but the bibliography description naming those three models is appropriate since they are the primary and most relevant models for Cobre's hydrothermal dispatch context.

2. The SPARHTACUS wiki sub-pages (Auditabilidade, Funcionalidades, etc.) load their content via JavaScript, so only the Home page content is directly verifiable via static HTTP fetch. The Home page itself confirms the C++ SDDP implementation description.

### Verdict

**No changes needed** to the bibliography entries. Both URLs are live, content matches descriptions, and the referenced projects show recent activity.
