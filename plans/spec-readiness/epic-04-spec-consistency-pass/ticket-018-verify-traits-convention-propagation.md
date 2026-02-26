# ticket-018 Verify Traits-as-Guidelines Convention Propagation

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Verify that the "Convention: Rust traits as specification guidelines" blockquote from `communicator-trait.md` appears in every trait-bearing specification document. The convention states that Rust trait definitions serve as guidelines (not absolute contracts), that prose takes precedence on conflict, and that conformance tests are the true verification mechanism. All 7 trait specs (communicator-trait.md + 6 new specs from epics 01-03) must contain this blockquote verbatim. Additionally, verify that extension-points.md references this convention where it discusses the dispatch mechanism (SS7).

## Anticipated Scope

- **Files likely to be modified**: Potentially any of the 6 new trait specs if the blockquote was missed or modified; potentially `src/specs/architecture/extension-points.md` if a reference to the convention is needed
- **Key decisions needed**: Whether extension-points.md needs a forward-reference to the convention (it was written before the convention was established)
- **Open questions**: Should the convention note also appear in the conformance test specs, or only in the trait specs?

## Dependencies

- **Blocked By**: ticket-013 (all trait specs must be in final form)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
