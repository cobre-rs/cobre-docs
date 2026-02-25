# ticket-007 Verify Bibliography Entry Metadata (Software and Web References)

## Context

### Background

The Cobre bibliography includes 2 web-based references (CEPEL documentation and SPARHTACUS wiki) that are not academic papers. These require URL reachability verification rather than academic metadata verification. The SDDP.jl entry (Dowson & Kapelevich 2021) is academic and was covered in ticket-006, but its software context makes it worth double-checking that the software link and paper link both resolve.

### Relation to Epic

This ticket handles the non-academic bibliography entries. It is deliberately small (1 point) since there are only 2 entries to verify, but URL reachability is time-sensitive (URLs can break).

### Current State

The 2 web reference entries in `bibliography.md`:

1. **CEPEL Technical Documentation** -- `https://see.cepel.br/manual/libs/latest/`
   - Description: "Official documentation for the NEWAVE/DECOMP/DESSEM suite."
2. **SPARHTACUS Wiki** -- `https://github.com/SPARHTACUS/SPTcpp/wiki`
   - Description: "Documentation for the C++ SDDP implementation. Reference for auditable pre-processing approach."

## Specification

### Requirements

1. Test URL reachability for both web references
2. If a URL is reachable, verify the page content matches the description in the bibliography
3. If a URL is unreachable (404, domain expired, etc.), note the failure and search for an alternative URL
4. Verify the descriptions in the bibliography are accurate for what the referenced resource actually contains

### Inputs/Props

**File to read**:

- `/home/rogerio/git/cobre-docs/src/reference/bibliography.md` (lines 49-56 for web references)

**URLs to test**:

- `https://see.cepel.br/manual/libs/latest/`
- `https://github.com/SPARHTACUS/SPTcpp/wiki`

### Outputs/Behavior

Produce a findings report:

```markdown
## Findings: Bibliography Software/Web Reference Verification

### Summary

- Entries verified: 2
- URLs reachable: N/2
- Descriptions accurate: N/2

### Entry-by-Entry Verification

#### CEPEL Technical Documentation

- **URL**: https://see.cepel.br/manual/libs/latest/
- **Reachable**: YES/NO [HTTP status code]
- **Content matches description**: YES/NO
- **Notes**: [any relevant observations]

#### SPARHTACUS Wiki

- **URL**: https://github.com/SPARHTACUS/SPTcpp/wiki
- **Reachable**: YES/NO [HTTP status code]
- **Content matches description**: YES/NO
- **Notes**: [any relevant observations]
```

### Error Handling

- If a URL returns a redirect, follow the redirect and note both the original and final URL
- If a URL is behind authentication, note "REQUIRES AUTH" and verify the domain is correct
- If a GitHub wiki has been deleted or the repo archived, note the state and check for forks or mirrors

## Acceptance Criteria

- [ ] Given 2 web reference URLs, when each is tested for reachability, then the HTTP status is recorded
- [ ] Given a URL is reachable, when the page content is examined, then it is confirmed to match the bibliography description
- [ ] Given a URL is unreachable, when an alternative is searched, then the result (found alternative or none) is documented

## Implementation Guide

### Suggested Approach

1. Use WebFetch to test each URL
2. For the CEPEL URL, check if the page loads and contains NEWAVE/DECOMP/DESSEM documentation
3. For the SPARHTACUS URL, check if the GitHub wiki exists and contains SDDP-related content
4. Record findings

### Key Files to Modify

None. This ticket is a read-only audit. The findings report should be written to:

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-02-external-reference-verification/findings-007.md`

### Patterns to Follow

- Record HTTP status codes, not just YES/NO
- For GitHub URLs, also check the repository's last commit date to assess currency

### Pitfalls to Avoid

- The CEPEL URL may be behind a corporate firewall or require specific access -- this is not an error in the bibliography
- GitHub wikis can exist even if the main repo appears empty

## Testing Requirements

### Unit Tests

N/A

### Integration Tests

N/A

### E2E Tests

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-009

## Effort Estimate

**Points**: 1
**Confidence**: High
