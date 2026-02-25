# Epic 02: External Reference Verification

## Goals

Verify that all 13 bibliography entries in `bibliography.md` have correct metadata (author names, year, title, journal, DOI/URL) and that every citation of these references throughout the spec corpus is used in a contextually accurate way (i.e., the spec's claim about what a paper proves or proposes matches the paper's actual content).

## Scope

### In Scope

- Verifying each bibliography entry: author names, year, title, journal/venue, DOI/URL
- Checking that DOI links and URLs resolve correctly
- Locating every citation of each bibliography entry across the spec corpus
- Verifying that the usage context of each citation is correct (e.g., if a spec says "Guigues & Bandarra (2019) prove Level-1 convergence", verify this matches the paper's actual contribution)
- Checking that all 13 entries are cited at least once (no orphan bibliography entries)
- Checking that no spec cites a reference not in the bibliography

### Out of Scope

- Adding new references to the bibliography
- Deep reading of full papers for technical correctness of the spec's mathematical treatment
- Verifying the spec's proofs are correct reproductions of the paper's proofs

## Tickets

| ID         | Title                                                            | Scope                                                                      | Estimate |
| ---------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| ticket-006 | Verify bibliography entry metadata (academic papers)             | Verify author names, year, title, journal, DOI for the 10 academic entries | 3 points |
| ticket-007 | Verify bibliography entry metadata (software and web references) | Verify the 3 non-academic entries (CEPEL docs, SPARHTACUS wiki, SDDP.jl)   | 1 point  |
| ticket-008 | Audit citation usage context across specs                        | Find every citation in the corpus and verify contextual accuracy           | 3 points |
| ticket-009 | Apply fixes for Epic 02 findings                                 | Fix bibliography errors and citation usage issues                          | 2 points |

## Dependencies

- None (can run in parallel with Epic 01)

## Success Criteria

- All 13 bibliography entries have verified metadata
- All DOIs and URLs are tested for resolution
- Every citation in the spec corpus is verified for contextual accuracy
- No orphan bibliography entries (each is cited at least once)
- No uncited references in specs (every citation has a bibliography entry)
- Findings report produced with corrections needed
- All fixes applied and mdBook builds cleanly
