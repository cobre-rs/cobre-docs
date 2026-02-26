# Epic 05 Learnings: Implementation Readiness Assessment

## Patterns Established

- **Implementation ordering document pattern**: overview-section specs that bridge corpus to implementation should use plain numbered sections (`## 1.`, `## 2.`), not `SS`/`§` prefixes. Cross-cutting documents (no single owning crate) use `(cross-cutting)` as Primary Crate and `All crates` as Secondary in the cross-reference index mapping table. See `src/specs/overview/implementation-ordering.md`.

- **Phase table pattern for ordering documents**: each implementation phase is expressed as a sub-section with a two-column attribute table (Attribute | Value) listing Crates, What becomes testable, Blocked by, and Spec reading list. Phase reading lists reference cross-reference-index section 2 entries directly rather than listing spec files redundantly. See `src/specs/overview/implementation-ordering.md` phases 1-8.

- **ASCII phase dependency diagram**: a preformatted block (` ``` `) depicting the DAG complements the per-phase Blocked-by entries. Used for at-a-glance comprehension without Mermaid. See `src/specs/overview/implementation-ordering.md` section 5 (Phase Dependency Summary).

- **Gap inventory pattern**: analysis documents cataloguing open questions use a seven-column table (ID, Severity, Affected Crate(s), Spec File(s), Sections, Description, Resolution Path). Gaps are globally unique sequential IDs (`GAP-001`, ...) and are never reused. See `src/specs/overview/spec-gap-inventory.md` section 3.

- **Stakeholder-resolved exclusions section**: gap inventories must carry an explicit "Key Decisions Resolved by Stakeholder Review" section that states which classes of issues are NOT gaps, preventing re-litigation during implementation. The key rule: deferred features are not gaps, but underspecified architectural hooks for deferred features are. See `src/specs/overview/spec-gap-inventory.md` section 4.

- **Summary statistics validation**: gap inventory summary tables (counts by severity and by crate) must be computed by hand from the detailed table and verified to match before the guardian pass. In ticket-020 the initial submission contained a counting error in the summary; the guardian caught it and the specialist resubmitted with corrected totals. See `src/specs/overview/spec-gap-inventory.md` section 6.

- **Cross-cutting document registration pattern**: when a new spec is cross-cutting (references all 11 crates), it is added to ALL per-crate reading lists in cross-reference-index section 2 as `(secondary)` entries, including deferred crates. This ensures future implementers of deferred crates encounter the planning documents regardless of their entry point. See `src/specs/cross-reference-index.md` section 2.

## Architectural Decisions

- **Separate repository for ferrompi treated as implementation phase boundary**: ticket-019 explicitly called out that `ferrompi` is a separate repository (not a workspace crate) and placed it in Phase 3 with a note that it can be developed in parallel with Phases 1-2. Alternative (treating it as an internal crate) was rejected because the separation is a deliberate architecture boundary from the comm backend abstraction plan. See `src/specs/overview/implementation-ordering.md` section 5, Phase 3.

- **Gap scope bounded to minimal viable solver**: the gap inventory was deliberately scoped to the 8 required crates and 4 system element types rather than the full 11-crate corpus. Alternative (comprehensive gap inventory for all features) was rejected because it would have produced an unactionable list dominated by deferred-feature gaps. The stakeholder requirements from the epic overview were used as the bounding criterion. See `src/specs/overview/spec-gap-inventory.md` sections 2 and 4.

- **`SystemRepresentation` top-level type flagged as Blocker**: GAP-001 identifies that the central `SystemRepresentation` type has no struct sketch and no public API surface in `src/specs/data-model/internal-structures.md`. All 8 required crates depend on this type. The decision to classify it Blocker (rather than High) is correct: implementation of every subsequent phase depends on knowing the entity collection interfaces and `Send + Sync` bounds. See `src/specs/overview/spec-gap-inventory.md` GAP-001.

- **Decommissioned LP treatment classified as Blocker**: the training loop references "decommissioned stage LPs" as a mechanism for handling finite-horizon terminal stages, but the spec does not define when an LP is decommissioned, how it is re-initialized on resume, or whether it retains its basis. This ambiguity was classified Blocker (GAP-002) because the forward pass cannot be implemented correctly without it. See `src/specs/overview/spec-gap-inventory.md` GAP-002.

## Files and Structures Created

- `src/specs/overview/implementation-ordering.md` -- 8-section document defining the 8-phase bottom-up build sequence, Mermaid dependency graph, minimal viable solver definition, trait variant selection table (7 traits), and system element scope table (7 elements). 14 cross-references. Guardian-approved 9/9.

- `src/specs/overview/spec-gap-inventory.md` -- 7-section document with 38 identified gaps (5 Blocker, 15 High, 13 Medium, 5 Low) across 8 required crates. Includes scope classification table, stakeholder-resolved exclusions, known performance risks section, and summary statistics. Guardian-approved after resubmission to fix summary statistics counting error.

- `src/SUMMARY.md` -- 2 new entries added under the Overview section, after Production Scale Reference.

- `src/specs/cross-reference-index.md` -- Updated from 72 to 74 specs; 2 new rows in section 1 (cross-cutting primary crate); 22 new reading list entries across all 11 per-crate lists in section 2; 2 new outgoing reference rows in section 3; incoming reference updates in section 4; 2 new dependency ordering rows in section 5. Guardian noted that sections 3-5 had a pre-existing structural gap (some specs lacked entries even before epic-05) and issued a conditional pass for that ticket.

## Conventions Adopted

- **Overview spec section numbering**: plain integers (`## 1.`, `## 2.`, ...) with no prefix. This is the convention already used by `design-principles.md`, `notation-conventions.md`, and `production-scale-reference.md`. Do not apply `SS` or `§` to overview files regardless of how many sections they have.

- **Gap ID format**: `GAP-NNN` with three digits, zero-padded. Sequential, never reused. A gap affecting multiple crates is logged once with all affected crates listed in the Affected Crate(s) column, not duplicated once per crate.

- **Deferred-crate reading list inclusion**: both `implementation-ordering.md` and `spec-gap-inventory.md` appear as `(secondary)` entries in ALL 11 per-crate reading lists (including deferred crates cobre-python, cobre-tui, cobre-mcp). Rationale: the gap inventory section 4 contains architectural-hook gaps that are relevant when deferred crates are eventually implemented.

- **Phase reading lists**: implementation phase reading lists reference spec files by their mdBook display name and relative path from `src/specs/overview/`, consistent with the cross-reference format used in all other overview specs.

- **Stub vs. omission distinction**: system elements that are deferred are "stub (NO-OP)" code paths, not omissions. This convention is explicitly stated in `src/specs/overview/implementation-ordering.md` section 7 ("Why stubs, not omissions") and must be carried into implementation tickets to prevent bypassing crate boundaries.

## Surprises and Deviations

- **Summary statistics counting error (ticket-020 resubmission)**: the initial submission of `spec-gap-inventory.md` contained a mismatch between the per-severity counts in the summary table and the actual counts in the gap inventory table. The guardian caught this on the "summary counts match the detailed table exactly" criterion. The specialist resubmitted with corrected counts (5 Blocker, 15 High, 13 Medium, 5 Low = 38 total). Root cause: the specialist manually tallied counts rather than programmatically counting rows.

- **Pre-existing structural gap in cross-reference-index (ticket-021 conditional pass)**: sections 3-5 of `src/specs/cross-reference-index.md` were missing entries for some pre-epic-05 specs. The guardian issued a conditional pass on the criterion requiring 74 specs consistently across all sections, noting that the gap predates epic-05 and that the ticket scope does not include back-filling the entire index. This is logged as a known technical debt item.

- **Mermaid graph included `cobre-stochastic` -> `cobre-sddp` edge implicitly**: the Mermaid diagram in `implementation-ordering.md` section 2 represents `cobre-stochastic` as a dependency of `cobre-sddp` via the `sddp --> stochastic` edge. This edge was not explicitly listed in `src/crates/overview.md` in the same notation, requiring the specialist to synthesize it from reading the sddp crate spec. No deviation from correctness, but the dependency derivation was not purely mechanical.

- **38 gaps -- more than expected**: the ticket-020 effort estimate was "3 points, Medium confidence" because the gap count was unknown. 38 gaps is a substantial number for a corpus that has been through 4 epics of formalization. The dominant crate is `cobre-sddp` (16 direct + 4 shared = 20 gaps touching sddp), reflecting that the training loop and simulation architecture specs describe behavior in prose but leave many inter-crate handoff types unspecified.

## Recommendations for Future Epics

- Begin implementation with a spec resolution sprint before Phase 1 coding: the 5 Blocker gaps (GAP-001 through GAP-005 as catalogued in `src/specs/overview/spec-gap-inventory.md`) must be resolved as spec updates before any crate can be coded. A dedicated "Epic 00: Gap Resolution" that closes the Blocker gaps would prevent implementation from stalling immediately.

- When writing implementation tickets for Phase 6 (cobre-sddp training), consult the 15 High-severity gaps in `src/specs/overview/spec-gap-inventory.md` before drafting acceptance criteria. Many High gaps correspond to underspecified inter-crate handoff types that will surface as compile errors.

- The cross-reference index sections 3-5 pre-existing gap should be fixed in a dedicated housekeeping ticket. The inconsistency (some pre-epic-04 specs missing from sections 3, 4, 5) is not catastrophic but will cause confusion for implementers using the index as a navigation tool.

- Use `src/specs/overview/implementation-ordering.md` section 5 phase reading lists as the input to future implementation ticket "Spec Reading List" sections. The reading lists are already validated for crate-ordering correctness.

- The Dominated strategy (CutSelectionStrategy::LML1, `src/specs/architecture/cut-selection-trait.md` SS6.4) with its 7.7G FLOP production cost should be gated behind a Cargo feature flag from the start. Do not implement it unconditionally even in the "all variants" phase.
