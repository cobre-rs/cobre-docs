# ticket-008 Audit Citation Usage Context Across Specs

## Context

### Background

The Cobre spec corpus cites bibliography entries throughout the math, architecture, and HPC specs. Each citation claims something about the referenced paper (e.g., "Guigues & Bandarra (2019) prove convergence for Level-1 and LML1 cut selection"). These claims must be verified against the papers' actual contributions. A citation that misattributes a result undermines the spec's credibility and could lead to incorrect implementation decisions.

### Relation to Epic

This ticket complements the metadata verification (tickets 006-007) by auditing the **semantic usage** of citations. Tickets 006-007 verify the bibliography entries are correct; this ticket verifies the specs cite them correctly.

### Current State

Known citation locations from reading the specs:

- `sddp-algorithm.md` -- references to Pereira & Pinto (1991) as "foundational"
- `cut-management.md` section 8 -- cites Guigues & Bandarra (2019) for convergence theorem
- `risk-measures.md` -- cites Shapiro (2011), Philpott & de Matos (2012), Philpott, de Matos & Finardi (2013)
- `infinite-horizon.md` -- cites Costa, Matos & Philpott (2025)
- `upper-bound-evaluation.md` -- cites Costa & Leclere (2023)
- `inflow-nonnegativity.md` -- cites Larroyd et al. (2022)
- `par-inflow-model.md` -- may cite references for Yule-Walker or PAR models
- Architecture specs -- reference SDDP.jl (Dowson & Kapelevich 2021), HiGHS (Huangfu & Hall 2018)
- `bibliography.md` itself -- annotation descriptions after each entry

## Specification

### Requirements

1. Search all spec files under `src/specs/` and `src/reference/` for citation patterns:
   - Author name mentions (e.g., "Pereira", "Philpott", "Guigues")
   - Year-in-parentheses patterns (e.g., "(2019)", "(2013)")
   - Explicit bibliography references (links to `bibliography.md`)
2. For each citation found, extract the claim being made about the referenced work
3. Verify the claim against the paper's actual contribution (using knowledge of the SDDP literature and the paper abstracts/titles)
4. Check that no spec cites a work not in the bibliography
5. Check that every bibliography entry is cited at least once in the spec corpus (no orphans)

### Inputs/Props

**Files to search** (all paths relative to `/home/rogerio/git/cobre-docs/src/`):

All `.md` files under:

- `specs/math/` (14 files)
- `specs/architecture/` (13 files)
- `specs/hpc/` (8 files)
- `specs/overview/` (3 files)
- `specs/data-model/` (10 files)
- `specs/configuration/` (1 file)
- `reference/bibliography.md` (annotation descriptions)
- `algorithms/` (12 files -- may cite references)

**Reference knowledge**: The bibliography entries and their actual contributions (from the papers' titles and abstracts as verified in ticket-006).

### Outputs/Behavior

Produce a findings report:

```markdown
## Findings: Citation Usage Context Audit

### Summary

- Total citations found: N
- Contextually correct: N
- Contextually incorrect or misleading: N
- Orphan bibliography entries (never cited): N
- Uncited references in specs (not in bibliography): N

### Citation Inventory

| #   | Spec File         | Line | Reference                 | Claim                                                                    | Correct? | Notes |
| --- | ----------------- | ---- | ------------------------- | ------------------------------------------------------------------------ | -------- | ----- |
| 1   | cut-management.md | ~173 | Guigues & Bandarra (2019) | "Under Level-1 or LML1 cut selection, SDDP converges with probability 1" | YES/NO   | ...   |
| 2   | ...               | ...  | ...                       | ...                                                                      | ...      | ...   |

### Orphan Bibliography Entries

[List any entries in bibliography.md that are never cited in any spec]

### Uncited References in Specs

[List any references cited in specs but not present in bibliography.md]

### Contextual Issues

[Detailed discussion of any incorrect or misleading citation usage]
```

### Error Handling

- If a spec cites a paper for a specific theorem or result, and the paper does prove that result but the spec describes it slightly differently (e.g., stronger wording), flag it as MISLEADING rather than INCORRECT
- If a spec cites a paper that is not in the bibliography, flag it as UNCITED REFERENCE
- If a bibliography entry is never cited in any spec, flag it as ORPHAN

## Acceptance Criteria

- [ ] Given all spec files are searched for citation patterns, when every citation is extracted, then no citation is missed
- [ ] Given each citation makes a claim about the referenced paper, when the claim is compared to the paper's actual contribution, then the result is classified as CORRECT, MISLEADING, or INCORRECT
- [ ] Given the bibliography has 13 entries, when the citation inventory is cross-referenced, then every entry is either found cited at least once or flagged as ORPHAN
- [ ] Given specs may cite works not in the bibliography, when the citation inventory is cross-referenced, then any such citations are flagged as UNCITED REFERENCE
- [ ] Given cut-management.md section 8 cites Guigues & Bandarra (2019) for convergence of Level-1 and LML1, when this claim is verified, then it is confirmed or flagged

## Implementation Guide

### Suggested Approach

1. Search all `.md` files under `src/` for known author surnames from the bibliography: "Pereira", "Pinto", "Philpott", "Guan", "Costa", "Matos", "Guigues", "Bandarra", "Shapiro", "Finardi", "Leclere", "Larroyd", "Diniz", "Borges", "Dowson", "Kapelevich", "Huangfu", "Hall", "CEPEL", "SPARHTACUS"
2. Also search for year patterns near these names: "(1991)", "(2008)", "(2025)", "(2015)", "(2019)", "(2011)", "(2012)", "(2013)", "(2023)", "(2022)", "(2021)", "(2018)"
3. For each match, extract the surrounding context (1-2 sentences) to understand the claim
4. Compare the claim against the known contribution of the paper
5. Build the citation inventory table and cross-reference against the bibliography

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-02-external-reference-verification/findings-008.md`

### Patterns to Follow

- Use grep/search to find citations, but read the surrounding context manually to understand the claim
- For each citation, quote the exact claim text from the spec
- For verification, reference the paper's title and abstract (the paper title usually captures the main contribution)

### Pitfalls to Avoid

- The `algorithms/` directory contains educational reference pages that may cite the same papers differently than the formal specs -- both should be checked
- Some citations are implicit (e.g., "the original SDDP algorithm" without naming Pereira & Pinto) -- these are not errors but should be noted
- The annotation text in `bibliography.md` itself (e.g., "Convergence proof for Level-1 and LML1 cut selection strategies") is a claim that should also be verified
- A citation being "correct" does not require the spec to reproduce the paper's exact wording -- it requires the spec's claim to be consistent with what the paper actually demonstrates

## Testing Requirements

### Unit Tests

N/A (audit ticket)

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: ticket-006 (needs verified metadata to confirm which paper a citation refers to)
- **Blocks**: ticket-009

## Effort Estimate

**Points**: 3
**Confidence**: High
