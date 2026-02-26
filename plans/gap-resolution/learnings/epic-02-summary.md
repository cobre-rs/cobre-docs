# Learnings from Epic 02: Core Data Model Blockers

## What Went Well

- **Stakeholder decisions simplified scope**: GAP-002 (Decommissioned = Non-existing) was resolved with minimal changes — one table cell and a stakeholder decision note. Clear decisions accelerate implementation.
- **Specialist selection**: Using `sddp-specialist` for tickets 004/005/007 and `data-model-format-specialist` for ticket-006 (rkyv) was appropriate. Domain knowledge matters for spec accuracy.
- **Guardian thoroughness**: The guardian performed row-level math verification on the gap inventory (ticket-007), catching a potential issue with per-crate total adjustments. All tickets passed on first attempt.
- **Cross-ticket consistency**: The System struct in ticket-004 provided the exact type list that ticket-006 needed for rkyv bounds, and ticket-007 referenced the resolutions from tickets 004-006. Sequential execution maintained consistency.

## What Could Be Improved

- **Guardian false positives with uncommitted working tree**: The guardian for ticket-006 flagged `internal-structures.md` as modified (SC3 FAIL) because tickets 004/005 changes were in the working tree but not committed. Since we commit at epic boundaries, this will happen for every ticket that isn't the first in an epic. Consider either: (a) committing per-ticket instead of per-epic, or (b) educating the guardian about the commit strategy.
- **Requirement 5 miss (ticket-007)**: The specialist missed Requirement 5 ("Add a resolution tracking note with dates and plan reference") even though the acceptance criteria passed. This is a spec quality issue — important requirements should be in the acceptance criteria, not just the specification text.

## Technical Decisions

- **NetworkTopology added to System struct**: User feedback during execution identified that the bus/line transmission network topology was missing alongside CascadeTopology. Added `pub network: NetworkTopology` with section 1.5b describing bus-line incidence, line endpoints, bus generation/load maps. This is needed for power flow and bus balance constraint generation.
- **rkyv versioning scope**: Clearly separated rkyv (transient MPI broadcast) from FlatBuffers (persistent policy files). This boundary is critical — developers must not use rkyv for long-term storage.
- **HashMap exclusion from serialization**: Lookup indices are rebuilt locally per rank rather than serialized. This avoids potential platform-dependent hash ordering issues and keeps the wire format simpler.

## Patterns Established

- **Resolution Log section**: Added Section 7 to the gap inventory as a structured table tracking which plan/epic/ticket resolved each gap with dates. This will be extended by Epic 3 (GAP-004/005) and Epic 4.
- **Dual-nature design documentation**: The pattern of documenting both the clarity-first (cobre-core) and performance-adapted (cobre-sddp) views of the same data is now established in Internal Structures SS1.1 and can be referenced by Epic 3.

## Recommendations for Epic 03

- Epic 03 (LP Layout and State Vectors) is the most technically critical epic. ticket-008 (LP memory layout) and ticket-009 (state vectors and indexers) define the hot-path data structures.
- These tickets should be dispatched to `sddp-specialist` since they require deep domain knowledge of SDDP LP formulations, constraint organization, and performance-critical memory layout.
- The System struct and NetworkTopology from this epic provide the foundation — LP variable indices will reference entity collections from `System`, and constraint generation will use both `CascadeTopology` and `NetworkTopology`.
- ticket-010 (gap inventory update) is straightforward bookkeeping, similar to ticket-007.
