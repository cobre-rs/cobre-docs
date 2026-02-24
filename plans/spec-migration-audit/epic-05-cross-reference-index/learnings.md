# Epic 05 Learnings: Cross-Reference Index Creation

**Plan**: spec-migration-audit
**Epic**: epic-05-cross-reference-index
**Completed**: 2026-02-24

---

## What This Epic Accomplished

Epic 05 produced a centralized navigation index for the entire 50-spec corpus in two tickets:

- **Ticket 016**: Created `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` (452 lines, 5 components) and added a `SUMMARY.md` entry. The file was built from the master crate table (ticket-009 section 5) and by extracting all `## Cross-References` sections from the 50 spec files. Guardian verification identified 3 sub-issues (crate reading-list item counts and secondary annotations) that were corrected before the ticket was closed.
- **Ticket 017**: Verified all 6 quality steps: build clean (exit 0, zero errors), sidebar navigation correct, all 1,276 links resolve, tables render without wrapping issues, conservation invariant holds (489 outgoing = 489 incoming), and 3-spec spot-check passed (14 entries for `sddp-algorithm.md`, 16 for `training-loop.md`, 7 for `penalty-system.md`).

---

## Patterns Established

- **Link conservation check as an index integrity gate**: When building any bidirectional cross-reference index, compute the total outgoing link count and total incoming link count and assert they are equal before accepting the deliverable. This check catches transposition errors (A references B but B's incoming row is missing A) at a glance. Demonstrated in ticket-017 Step 5 with conservation count 489 = 489. Apply this pattern to any future bidirectional reference artifact.

- **Topological reading-order by incoming-reference count**: Ranking specs by the number of other specs that reference them (their in-degree in the cross-reference graph) produces a natural "read this first" ordering with zero manual curation. Specs with the highest in-degree (`lp-formulation.md` at 22, `cut-management.md` at 21, `sddp-algorithm.md` at 19) are the mathematical foundations that every other spec builds on. This ranking is reproducible from the cross-reference graph alone. See Component 5 of `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`.

- **Errata-aware index construction**: When source data contains known errors (here: 7 HIGH section-number errata from Epic 03), the index must reflect the current file state rather than hypothetically corrected content. Include a prominent errata note at the top of the index naming the findings and the remediation epic, so readers understand the known limitations without the index becoming a blocker for downstream work. See the Note block at the top of `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`.

- **SUMMARY.md position anchored to content, not line number**: Locate the insertion point in `SUMMARY.md` by searching for the target neighbor entry (`- [Overview](./specs/overview.md)`) rather than by relying on a hardcoded line number. Previous epics may shift line numbers; this approach is robust to any history of file edits. Confirmed in ticket-016 implementation.

---

## Architectural Decisions Recorded

- **Index reflects current file state, not corrected state**: The decision to build the cross-reference index from the current (un-remediated) spec files rather than waiting for Epic 06 corrections was deliberate. Rationale: the index is a navigation tool, not an authority on section numbers; link targets (file paths) are all correct even where section-number descriptions contain errors; and deferring the index until after remediation would leave implementers without navigation for an entire additional epic cycle. Rejected alternative: hold Epic 05 until Epic 06 completes. This would have created a dependency loop since Epic 06 ticket refinement itself benefits from the cross-reference index. Decision visible in the errata note at line 13 of `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`.

- **`deferred.md` included as a single row, not expanded into 21 feature rows**: The 21 deferred features are documented within `deferred.md` but each has no individual spec file. Including them as sub-rows in Component 1 would require a different table structure that mixes file-level and feature-level granularity. The decision was to keep `deferred.md` as one row (row 50) and note in the primary-crate cell "(multi-crate)" with a pointer to the audit report. Rejected alternative: 21 rows with `deferred/feature-name.md` phantom paths. These paths do not exist and would produce link-check failures.

- **Per-crate reading lists use topological sort within each crate's spec set**: Within each crate's reading list, a spec A precedes spec B if B's cross-references section links to A. This is a local topological sort, not the global one from Component 5. The choice preserves crate-specific dependency structure that the global order obscures (e.g., `cobre-io` readers should encounter `design-principles.md` before `input-system-entities.md` even though the global order places `design-principles.md` at position 13). Visible in Component 2 of `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md`.

---

## Files and Structures Created

- `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` -- 452-line navigation index with 5 components; primary deliverable of this epic
- `/home/rogerio/git/cobre-docs/src/SUMMARY.md` -- modified: one line added (`- [Cross-Reference Index](./specs/cross-reference-index.md)`) after the Overview entry under the Specifications heading

---

## Conventions Adopted

- **5-component structure for cross-reference indexes**: (1) spec-to-crate mapping table, (2) per-crate reading lists, (3) outgoing cross-reference table, (4) incoming cross-reference table, (5) dependency ordering. This structure separates the three primary navigation use-cases: "what do I read for my crate", "what does this spec reference", and "what order should I read everything". Future indexing work should follow this component layout.

- **Secondary spec annotation format**: In per-crate reading lists, secondary specs (where the crate is not the primary owner but is a major consumer) are appended with "(secondary)" suffix on the same list item. Primary specs have no suffix. This follows the primary/secondary distinction established in ticket-009 and allows readers to distinguish mandatory vs. supplementary reading at a glance.

- **Table-level `overflow-x: auto` wrapper for wide reference columns**: Cross-reference tables where cell content includes many comma-separated links (some cells have 14-20 links) must be wrapped in a `<div style="overflow-x: auto">` block to prevent horizontal layout overflow in the rendered HTML. This is a valid mdBook/Markdown construct. Applied in Components 3 and 4 if column width exceeded page width during ticket-017 rendering verification.

---

## Surprises and Deviations from Plan

- **Guardian found 3 sub-issues in ticket-016 before acceptance**: The implementation-guardian verification of ticket-016 identified (1) one crate reading list with an incorrect item count, (2) one spec marked "(secondary)" that should have been primary, and (3) one spec missing the "(secondary)" annotation. These were corrected in-ticket before the ticket was closed. The guardian's per-criterion verification caught these before they could propagate to ticket-017's conservation check. The pattern reinforces: guardian verification before ticket sign-off is necessary for data-extraction deliverables where off-by-one errors are invisible in casual review.

- **Conservation count was 489, not 534**: The ticket specification described 534 cross-reference entries across the 50 spec files (from the Epic 03 audit). The actual conservation count at index completion was 489 outgoing = 489 incoming. The discrepancy (534 - 489 = 45) arises because 45 of the Epic 03 links reference files outside the 50-spec corpus (algorithm reference pages, crate doc pages, or deferred sub-items that are not addressable spec files). The index covers only the 50 spec files; out-of-corpus links are excluded from the outgoing/incoming tables by design. This was expected behavior per the ticket specification but the specific count difference was not pre-calculated. Future index construction should clarify "links within corpus" vs. "total cross-reference section entries" early to avoid reviewer confusion.

- **Epic 03 recommendation to resolve 7 HIGH findings before index construction was not followed**: The epic-03 learnings recommended resolving all 7 HIGH section-number findings before building the index to avoid indexing wrong section numbers. The decision in Epic 05 was to build the index from current state and include errata notes. The actual impact was minor: the section-number errors are in link description text, not in link targets (file paths). All link targets in the index resolve correctly. The errata note in the index is sufficient for readers to understand the limitation. Epic 06 remediation will update the description text in the source files, after which the index descriptions will also become accurate without requiring a separate index rebuild.

---

## Recommendations for Epic 06

- **After each HIGH finding fix, verify conservation still holds**: Fixing F-2, F-3, F-12, F-13, F-14, F-15 (the 6 asymmetric reference gap findings) will add new `## Cross-References` entries to spec files. Each added link changes the cross-reference graph. After Epic 06 completes, re-run the conservation check (`grep` the index outgoing and incoming tables for link counts) to confirm the index remains accurate, or rebuild the relevant table rows.
- **Index does not need a full rebuild for HIGH section-number fixes**: Fixing F-1, F-5, F-6, F-7, F-8, F-9, F-11 changes section-number descriptions in spec files but does not change any link target paths. The cross-reference index links to files, not sections. No index update is needed for these 7 fixes; only the errata note should be updated or removed once all 7 are resolved.
- **`deferred.md` row 50 primary-crate cell**: Currently "(multi-crate)" with a pointer to the audit report. If Epic 06 assigns deferred features to specific crates during remediation, the row should be updated with a consolidated crate list.
- **Build-clean verification pattern from Epic 04 applies here**: After each Epic 06 file edit, run `mdbook build 2>&1 | grep -c "Rendering failed"` and check exit code. The cross-reference index now adds 1,276 links to the build surface; any path regression introduced by Epic 06 edits could break index links if file paths are renamed (no renaming is planned, but verify).
