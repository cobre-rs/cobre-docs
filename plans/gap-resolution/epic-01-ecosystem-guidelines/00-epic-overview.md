# Epic 01: Ecosystem Guidelines

## Goal

Extract durable development guidelines from the accumulated spec-readiness learnings and codify them in two locations: a CLAUDE.md file at the repo root (always loaded as agent context) and an mdBook spec page (human-readable reference). This epic comes first because every subsequent ticket benefits from having the guidelines in context.

## Scope

- Create `CLAUDE.md` at the repo root with guidelines for Cobre ecosystem development
- Create `src/specs/overview/ecosystem-guidelines.md` with the same guidelines formatted for the mdBook
- Update `src/SUMMARY.md` to include the new page in the specifications section
- Add cross-references from the new ecosystem-guidelines page to relevant specs

## What This Epic Does NOT Do

- Does not modify any existing specification content
- Does not resolve any gaps from the spec-gap-inventory
- Does not create Rust code or scaffolding

## Tickets

| Ticket     | Title                                                  | Estimate |
| ---------- | ------------------------------------------------------ | -------- |
| ticket-001 | Create CLAUDE.md with ecosystem development guidelines | 2 points |
| ticket-002 | Create ecosystem-guidelines.md specification page      | 3 points |
| ticket-003 | Update SUMMARY.md and add cross-references             | 1 point  |

## Dependencies

- **Blocked by**: Nothing -- this is the first epic
- **Blocks**: Epics 2, 3, 4 (all benefit from guidelines being in context)

## Acceptance Criteria

- [ ] `CLAUDE.md` exists at the repo root and contains all durable patterns from the learnings
- [ ] `src/specs/overview/ecosystem-guidelines.md` exists with the same content formatted for mdBook
- [ ] `src/SUMMARY.md` links to the new page under the Specifications > Overview section
- [ ] `mdbook build` succeeds with no broken links
