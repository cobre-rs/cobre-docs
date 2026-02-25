# Epic 05: Documentation Organization & NEWAVE Deferral

## Goals

1. **Validate spec organization coherence** — Formally review whether the grouping of 50 specs into 6 sections (overview, math, data-model, architecture, hpc, configuration) is sound, and identify any improvement opportunities.
2. **Remove NEWAVE migration stubs** — Delete the 6 empty stub files in `src/migration/` and remove the NEWAVE Migration section from SUMMARY.md.
3. **Clean up NEWAVE/CEPEL references** — Audit all 31 files that reference NEWAVE/CEPEL/DECOMP/DESSEM. Keep strategic and domain-modeling references. Remove file format specifics and parser documentation that belong to the deferred NEWAVE import feature.

## Scope

- The spec organization review covers all 6 section container pages, the cross-reference index, SUMMARY.md, and the 50 individual spec files
- The NEWAVE migration removal targets `src/migration/` (6 files) and SUMMARY.md
- The reference cleanup targets 31 files across the codebase, with a clear keep/update/remove policy

## Policy: NEWAVE Reference Handling

| Category                 | Action            | Examples                                                        |
| ------------------------ | ----------------- | --------------------------------------------------------------- |
| Strategic positioning    | **Keep**          | "Cobre is an alternative to NEWAVE/DECOMP/DESSEM"               |
| Domain modeling concepts | **Keep**          | CEPEL dead-volume filling, FPHA mapping, Portuguese terminology |
| Domain terminology       | **Keep**          | "NEWAVE branching factor", CEPEL PAR(p)-A variant               |
| File format specifics    | **Remove/Update** | HIDR.DAT, TERM.DAT, CONFHD.DAT references                       |
| Parser documentation     | **Remove/Update** | cobre-io NEWAVE parser descriptions                             |
| Incidental examples      | **Update**        | Contributing guide examples using NEWAVE field names            |

## Tickets

| Ticket     | Title                                    | Detail Level |
| ---------- | ---------------------------------------- | ------------ |
| ticket-016 | Review spec organization coherence       | Outline      |
| ticket-017 | Remove NEWAVE migration section          | Outline      |
| ticket-018 | Audit and update NEWAVE/CEPEL references | Outline      |

## Dependencies

- No hard dependencies on Epics 01-04
- Findings from Epic 01 (notation consistency) may inform the organization review in ticket-016
- Epic 05 and Epic 06 are independent of each other

## Estimated Duration

1-2 weeks
