# ticket-006 Verify Bibliography Entry Metadata (Academic Papers)

## Context

### Background

The Cobre bibliography (`bibliography.md`) contains 13 external references. Of these, 10 are academic papers published in journals or on arXiv. Each entry includes author names, year, title, journal, and optionally a DOI or URL. These metadata fields must be verified against the actual publications to ensure accuracy, since incorrect citations undermine the credibility of the specification corpus.

### Relation to Epic

This is the first of two metadata verification tickets. It covers the 10 academic papers. The 3 software/web references are handled in ticket-007 since they require a different verification approach (URL reachability rather than academic metadata).

### Current State

The 10 academic entries in `bibliography.md` (at `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`) are:

1. **Pereira & Pinto (1991)** -- Original SDDP paper. _Mathematical Programming_ 52(1-3), 359-375.
2. **Philpott & Guan (2008)** -- SDDP convergence. _Operations Research Letters_ 36(4), 450-455.
3. **Costa, Matos & Philpott (2025)** -- Infinite horizon SDDP.jl. _Trends in Computational and Applied Mathematics_ 11(1). doi:10.5540/03.2025.011.01.0355
4. **de Matos, Philpott & Finardi (2015)** -- Cut selection. _JCAM_ 290, 196-208.
5. **Guigues & Bandarra (2019)** -- Level-1/LML1 convergence. arXiv:1902.06757.
6. **Shapiro (2011)** -- Risk-averse SDDP. _EJOR_ 209(1), 63-72.
7. **Philpott & de Matos (2012)** -- Dynamic sampling. _EJOR_ 218(2), 470-483.
8. **Philpott, de Matos & Finardi (2013)** -- Time-consistent risk. _Operations Research_ 61(4), 957-970. doi:10.1287/opre.2013.1200.
9. **Costa & Leclere (2023)** -- Lipschitz inner approximation. _Optimization Online_.
10. **Larroyd, Matos, Diniz & Borges (2022)** -- PAR non-negativity. _Energies_ 15(3), 1115. doi:10.3390/en15031115.
11. **Huangfu & Hall (2018)** -- HiGHS simplex. _MPC_ 10, 119-142.

(Note: The SDDP.jl entry by Dowson & Kapelevich is technically academic but published in IJOC, so it is included here as entry 11 of academic papers.)

Actually, recounting from the bibliography, there are 11 academic-style entries and 2 web references. This ticket covers all 11 academic entries.

## Specification

### Requirements

For each of the 11 academic entries, verify:

1. **Author names**: Correct spelling, correct order, all authors listed (not just first author)
2. **Year**: Correct publication year
3. **Title**: Exact paper title (check against the actual paper or Google Scholar)
4. **Journal/venue**: Correct journal name, volume, issue, page numbers
5. **DOI/URL**: If a DOI is provided, verify it resolves to the correct paper. If an arXiv link is provided, verify it resolves.

### Inputs/Props

**File to read**:

- `/home/rogerio/git/cobre-docs/src/reference/bibliography.md` (61 lines)

**Verification sources** (use WebFetch or existing knowledge):

- DOI links: `https://doi.org/10.5540/03.2025.011.01.0355`, `https://doi.org/10.1287/opre.2013.1200`, `https://doi.org/10.3390/en15031115`
- arXiv link: `https://arxiv.org/abs/1902.06757`
- Optimization Online: `https://optimization-online.org/?p=23738`
- For entries without DOI/URL, use Google Scholar to verify metadata

### Outputs/Behavior

Produce a findings report:

```markdown
## Findings: Bibliography Academic Entry Verification

### Summary

- Entries verified: 11
- Fully correct: N
- Corrections needed: N
- DOIs verified resolving: N/N
- DOIs unreachable: N

### Entry-by-Entry Verification

#### 1. Pereira & Pinto (1991)

- **Authors**: [CORRECT/INCORRECT -- details]
- **Year**: [CORRECT/INCORRECT]
- **Title**: [CORRECT/INCORRECT -- expected vs actual]
- **Journal**: [CORRECT/INCORRECT]
- **DOI/URL**: [N/A / RESOLVES / UNREACHABLE]
- **Overall**: [OK / NEEDS CORRECTION]
- **Correction**: [if needed, exact corrected entry]

#### 2. Philpott & Guan (2008)

...
```

### Error Handling

- If a DOI does not resolve (network error or 404), mark it as UNREACHABLE and attempt to verify the paper via Google Scholar instead
- If an author name has multiple valid spellings (e.g., accented characters), note both forms but do not classify as an error unless the bibliography uses a clearly wrong name
- If a paper has been published in a different journal than stated (e.g., originally on arXiv but later published in a journal), note both and recommend updating to the journal version

## Acceptance Criteria

- [ ] Given the bibliography has 11 academic entries, when each is verified, then a verification result (CORRECT or NEEDS CORRECTION with details) is recorded for every field
- [ ] Given 3 DOI links are present in the bibliography, when each DOI is tested, then it either resolves to the correct paper or is marked UNREACHABLE with an alternative verification
- [ ] Given the arXiv entry (Guigues & Bandarra 2019) may have been subsequently published in a journal, when the arXiv page is checked, then any journal publication is noted
- [ ] Given the Optimization Online entry (Costa & Leclere 2023) may have been subsequently published, when checked, then any journal publication is noted

## Implementation Guide

### Suggested Approach

1. Read `bibliography.md` and extract all 11 academic entries
2. For each entry, verify metadata using the following priority:
   a. Test DOI resolution (if DOI provided) -- the landing page will confirm title, authors, journal
   b. Check arXiv abstract page (if arXiv link provided)
   c. Search Google Scholar for the paper title to verify metadata
3. For entries without DOI or URL, use Google Scholar to find the canonical publication record
4. Compare each field against the bibliography entry and record findings

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-02-external-reference-verification/findings-006.md`

### Patterns to Follow

- For each entry, verify in this order: authors, year, title, journal, DOI
- When checking DOI resolution, note the HTTP status and the page title
- If a paper has undergone title changes between preprint and publication, note both titles

### Pitfalls to Avoid

- Author name ordering conventions vary by field (some use "last, first" and others "first last") -- compare against the actual paper, not a style preference
- The Costa et al. (2025) paper has a future year -- this may be a pre-publication year or the bibliography may need updating once published
- Some journals use "pages" while others use "article number" (e.g., Energies uses article number 1115, not page 1115)
- The Guigues & Bandarra entry cites arXiv; this paper may have been published in a journal since 2019

## Testing Requirements

### Unit Tests

N/A (audit ticket)

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-009

## Effort Estimate

**Points**: 3
**Confidence**: High
