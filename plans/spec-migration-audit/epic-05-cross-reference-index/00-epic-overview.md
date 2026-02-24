# Epic 05: Spec Index and Dependency Map Creation

## Goal

Create a new file `src/specs/cross-reference-index.md` that serves as a centralized navigation hub: mapping each spec to its target crate(s), listing its outgoing and incoming cross-references, and providing a dependency ordering table showing which specs must be understood before others.

## Why This Matters

The cobre-docs book has 50 spec files across 7 sections. When an implementer starts work on a crate, they need to know: (1) which specs to read, (2) in what order, and (3) what other specs those will reference. Without a centralized index, navigating the spec corpus requires reading each crate doc page and manually following cross-reference chains.

The cross-reference index makes implementation navigation deterministic.

## Deliverable

A new file `src/specs/cross-reference-index.md` containing:

1. A 50-row spec-to-crate mapping table (populated from Epic 02 master table)
2. A per-crate spec reading list (grouped by crate, ordered by reading dependency)
3. An outgoing cross-reference table for each spec (which other specs does it reference?)
4. An incoming cross-reference table (which other specs reference this one?)
5. A dependency ordering table: which specs must be read before others to fully understand the subject

The file must be added to `SUMMARY.md` so it appears in the book.

## Tickets in This Epic

| Ticket                                                        | Scope                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ticket-016                                                    | Build the cross-reference index from the Epic 02 master table and link analysis |
| ticket-017 is in Epic 06 — remediation starts after this epic |

Wait — ticket numbering: ticket-016 and ticket-017 are in this epic. Ticket-018 and beyond are in Epic 06. See the state file for the authoritative numbering.

## Acceptance Criteria for the Epic

- `src/specs/cross-reference-index.md` exists and is listed in `SUMMARY.md`
- The file contains all 5 components listed above
- `mdbook build` exits 0 after the file is added

## Dependencies

- Blocked By: Epic 02 (the master spec-to-crate table from ticket-009 is the primary input)
- Blocked By: Epic 03 (cross-reference links should be verified before being indexed)
- Blocks: Nothing (this is a new file addition with no downstream technical dependencies)
