[OUTLINE]

# ticket-008 Add "How to Use This Specification" Guide

## Objective

Add a document (or a prominent section in `implementation-ordering.md`) that explicitly answers the question: **what is cobre-docs, and where does it end?**

A developer arriving at this repository needs to understand the abstraction boundary between the specification corpus (what the system must guarantee) and the implementation work (how those guarantees are realized). Without this document, the spec corpus is a set of files with no declared scope — navigable with effort but not self-describing in terms of its role in the development process.

## Anticipated Scope

A new file `src/specs/overview/spec-usage-guide.md`, or a new top-level section added to `implementation-ordering.md`, covering:

1. **What cobre-docs is**: a behavioral contract corpus, not an implementation guide. Specs define _what_ the system must do and guarantee; they do not prescribe file names, crate structure, or build sequences.
2. **What you will find**: trait definitions, data layouts, dispatch patterns, configuration contracts, algorithmic invariants, test obligations, cross-cutting rationale.
3. **What you will not find**: crate scaffolding, Cargo.toml contents, CI configuration, step-by-step "create file X" instructions.
4. **The abstraction level**: specs operate at the level of behavioral contracts and type-level invariants. When a spec says `fn solve(...) -> Result<Solution, SolverError>`, it is not prescribing an implementation — it is defining what any correct implementation must satisfy.
5. **Worked transition example**: one concrete mapping from spec content to implementation ticket. E.g.: "The spec defines the `SolverInterface` trait contract and warm-start validity checks. An implementation ticket would read: _implement the HiGHS adapter, wrap the C FFI, map error categories, write conformance tests_. The spec is the acceptance criterion; the ticket is the path to satisfying it."
6. **Where implementation planning begins**: after reading the MVRL (ticket-007), a developer has enough context to draft the Phase 1 implementation tickets. Cobre-docs is the reference they will check during implementation, not the work breakdown structure.

## Known Dependencies

- ticket-007 (MVRL) must exist before this document can reference it by section
- `implementation-ordering.md` changes from ticket-006 must be complete

## Open Questions

- Should this be a new file (`spec-usage-guide.md`) or a new section in `implementation-ordering.md`? A new file avoids making `implementation-ordering.md` overly long; a section there keeps navigation co-located. To be decided during refinement.
- Should there be a one-paragraph version at the top of `implementation-ordering.md` that links to the full guide? Likely yes.
- Should the cross-reference index (`cross-reference-index.md`) gain an entry for this new document?

## Effort Estimate

**Points**: 1
**Confidence**: Low (outline)
