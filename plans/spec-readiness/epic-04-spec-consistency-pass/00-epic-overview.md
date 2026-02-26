# Epic 04: Spec Consistency Final Pass

## Goals

Perform a final consistency pass across the spec corpus, focused on:

1. **Cross-reference integrity** after the communication-backend-abstraction changes (6 new HPC specs, modified python-bindings.md, modified crate overview) and the new trait specs from epics 01-03
2. **Naming consistency** across the new trait specs and existing specs (enum variant names, method names, type names)
3. **Free-threaded Python validation** -- verify the SS7.5a note in python-bindings.md does not contradict existing GIL references
4. **Traits-as-guidelines convention** -- verify the convention blockquote is properly referenced where needed

## Scope

- Audit all cross-references in the 12 new trait/test spec files
- Audit all cross-references in the 6 HPC specs added by communication-backend-abstraction
- Verify naming consistency for enum variants, method names, and type names across trait specs and their source specs (extension-points.md, math specs)
- Check python-bindings.md SS7.5a against all existing GIL references
- Verify the convention blockquote appears in all trait-bearing spec documents

## Tickets

| Ticket     | Title                                              | Estimated Effort |
| ---------- | -------------------------------------------------- | ---------------- |
| ticket-015 | Audit cross-references in new trait and test specs | 3 points         |
| ticket-016 | Audit naming consistency across trait specs        | 2 points         |
| ticket-017 | Validate free-threaded Python note consistency     | 2 points         |
| ticket-018 | Verify traits-as-guidelines convention propagation | 2 points         |

## Dependencies

- Depends on Epic 03 (all trait specs must exist before auditing them)
- Tickets within this epic can proceed in parallel

## Completion Criteria

- Zero broken cross-references across the spec corpus
- Consistent naming for all enum variants and methods between trait specs and source specs
- No contradictions between SS7.5a and existing GIL references
- Convention blockquote present in all trait-bearing specs
