# Epic 01 Learnings: GAP Marker Cleanup

## Patterns Established

- **Label-only removal pattern**: all four inline GAP markers in ticket-001 were simple label excisions — the decision content was already fully inline, so the edit was a one-line deletion or single-word substitution. The pattern is: identify the label (parenthetical, heading suffix, or prose reference), remove exactly the label, verify the surrounding sentence still reads correctly as a complete thought. See `src/specs/architecture/training-loop.md` line 69 (`**Design note (GAP-032).**` → `**Design note.**`) and `src/specs/architecture/solver-abstraction.md` line 318 (`**Stakeholder decision (GAP-010)**:` → `**Stakeholder decision:**`).

- **False-gap sentence rewrite pattern**: when a GAP reference appears inside a sentence that explains _why_ the gap is a false gap, the reference cannot be simply deleted — the sentence must be rewritten to preserve the architectural insight while dropping the tracking reference. Ticket-001 applied this to `src/specs/architecture/scenario-generation.md` line 133: the phrase "the previously identified GAP-039 ('scenario innovation noise broadcast format') a false gap" was replaced with "eliminates the need for a dedicated scenario innovation noise broadcast format". The rewrite must keep the conclusion intact and must not introduce new technical claims.

- **Section heading parenthetical removal pattern**: a GAP reference embedded in a section heading (`### 4.7 Minimal Viable Simplification (GAP-033)`) is removed by stripping only the trailing parenthetical. Section number, title, and heading level are preserved verbatim. See `src/specs/hpc/communicator-trait.md` line 640.

- **Status-table inversion pattern**: ticket-002 demonstrates that a "must do X before Y" prerequisite list becomes a historical record by changing (a) the introductory sentence tense ("must be resolved" → "have been resolved"), (b) adding **Resolved** markers to all rows that lacked them, and (c) updating supporting statistics to match the current inventory. The table structure is preserved; only its semantic register shifts from future obligation to historical fact. See `src/specs/overview/ecosystem-guidelines.md` lines 384-402.

- **Resolution cross-reference format**: the format for **Resolved** markers in the blocker table is `Description — **Resolved**: brief note with a relative Markdown link`. GAP-003 was already in this format in the original file; GAP-001, 002, 004, and 005 were brought into conformance. Links point to the spec file where the resolution is documented, not to the gap inventory. See the five rows of the blocker table in `src/specs/overview/ecosystem-guidelines.md`.

## Architectural Decisions

- **Gap inventory is immutable; prose files carry the resolved state**: neither ticket modified `src/specs/overview/spec-gap-inventory.md`. The inventory is the audit trail; its resolution markers were set during the gap-decisions-incorporation plan. The spec-implementation-prep plan removes only the _secondary_ markers that leaked into prose files, leaving the canonical record intact. This separation ensures the inventory remains the single authoritative source of resolution history while allowing prose files to read cleanly without gap-tracking clutter.

- **Two separate tickets for one logical epic**: the epic split into two tickets because ecosystem-guidelines.md required a different edit pattern (status-table update, numeric count update, five-row resolution annotation) compared to the four prose-file label removals. Separate tickets with separate acceptance criteria enabled independent verification. A single ticket containing both patterns would have been harder to scope-check. The logical grouping (all stale GAP references) was preserved at the epic level.

- **"Pending blocker" prose is itself a gap**: the ecosystem-guidelines.md implementation readiness section was written during spec authoring when the blockers were genuinely unresolved. After the gap-resolution plan completed them, the prose became a stale forward-looking statement. This pattern — planning prose outliving the planning phase — is a recurring maintenance liability. Every "must be resolved before" or "pending" statement in a spec that is coupled to a GAP-ID is a candidate for a future cleanup ticket once that gap closes.

## Files and Structures Created

- No new files created. Five existing files modified:
  - `src/specs/architecture/training-loop.md` — one-word label removal at line 69
  - `src/specs/hpc/communicator-trait.md` — heading parenthetical removed at line 640
  - `src/specs/architecture/solver-abstraction.md` — one-word label removal at line 318
  - `src/specs/architecture/scenario-generation.md` — sentence rewrite at line 133 to remove GAP-039 reference while preserving architectural insight
  - `src/specs/overview/ecosystem-guidelines.md` — introductory sentence tense change, five-row Resolved annotation, two numeric count updates ("38 gaps" → "39 gaps", "~20 of 38" → "~20 of 39", "15 High" → "16 High")

## Conventions Adopted

- **Blockquote bold opener format after label removal**: when a blockquote opener was `> **Design note (GAP-032).**` or `> **Stakeholder decision (GAP-010)**:`, the label is removed and the opener retains its formatting: `> **Design note.**` and `> **Stakeholder decision:**`. The trailing punctuation after the bold text matches the original (period for design notes, colon for stakeholder decisions). The `:` or `.` that was before the gap label is preserved as-is. This must be applied consistently in future label removal passes across the corpus.

- **Resolved row link target policy**: resolution cross-references in the blocker table point to the _content-bearing_ spec file, not to the gap inventory. GAP-001 and GAP-004 (struct definitions) link to `../data-model/internal-structures.md`; GAP-002 and GAP-005 (training loop behavior) link to `../architecture/training-loop.md`; GAP-003 (serialization format) keeps its existing format (`postcard` adopted for MPI broadcast). Links use relative paths from `src/specs/overview/`.

- **Gap count statistics verification sequence**: before updating any count statistics in a spec file, verify against the authoritative source (`src/specs/overview/spec-gap-inventory.md`) by counting table rows. Ticket-002 required changing "38 gaps (5 Blocker, 15 High, 13 Medium, 5 Low)" to "39 gaps (5 Blocker, 16 High, 13 Medium, 5 Low)". Both changes — total count and High count — must be applied atomically in the same edit to avoid a window where they are inconsistent.

## Surprises and Deviations

- **Ticket-001 readiness scored 0.98 (not 1.00) due to atomicity concerns**: the readiness breakdown shows `atomicity: 0.8`, reflecting that ticket-001 touched 4 files across 2 directories (architecture and hpc) for 4 distinct GAP markers. The 4 edits were logically coupled (all are label removals for resolved gaps) but physically scattered. Future tickets of this type should either tighten the scope to a single file or accept the atomicity score reduction as a known tradeoff of batching related single-line edits. The quality score was 0.93 (EXCELLENT), confirming correct implementation despite the atomicity concern.

- **Ticket-002 achieved a perfect quality score (1.00)**: single-file scope, well-defined acceptance criteria with exact match strings, and no technical rewriting — only status annotation — contributed to 1.0 across all quality dimensions. This confirms that status-table cleanup tickets are inherently low-risk and well-suited to high-confidence 1-point estimates.

- **GAP-003 row was already partially resolved in the original file**: the original `ecosystem-guidelines.md` had GAP-003 already marked as `**Resolved**: postcard adopted for MPI broadcast` while GAP-001, 002, 004, and 005 were bare. This asymmetric state was created during the gap-resolution plan when only GAP-003's resolution was propagated to the overview file. Ticket-002 brought the remaining four rows into parity with GAP-003's pre-existing format, making GAP-003's format the template rather than an exception.

- **The epic overview listed "5 spec files" but the epic deliverable was 5 files across 2 tickets**: the overview's deliverable count matched the final implementation precisely. No scope drift. Both tickets were implemented as specified with no added or removed files.

## Recommendations for Future Epics

- **Add a GAP-marker scan to every epic boundary check**: before closing any epic that adds spec content, run `grep -rn "GAP-" src/specs/ --include="*.md" | grep -v spec-gap-inventory.md` and verify that any new GAP references introduced are either (a) references within the inventory itself or (b) newly opened gaps that will be tracked. Stale inline markers are created whenever a spec is written under uncertainty and the gap tracker is updated later without revisiting the prose. The scan cost is negligible; the cleanup cost compounds if deferred. See `src/specs/overview/spec-gap-inventory.md` as the sole permitted location for GAP-ID references after this epic.

- **Pending-blocker prose requires a dedicated cleanup pass after each plan that closes blockers**: the ecosystem-guidelines.md had five stale blocker rows because the gap-resolution plan updated the inventory but not the overview narrative. Any future plan that closes a blocker or significant gap should include a 1-point ticket to update all "must resolve before" language in planning and overview spec files. The list of files likely to need such updates: `src/specs/overview/ecosystem-guidelines.md`, `src/specs/overview/implementation-ordering.md`, and any spec file with a blockquote citing a pending gap decision.

- **False-gap sentence rewrites require human review, not mechanical grep-replace**: the GAP-039 sentence in scenario-generation.md required semantic judgment to preserve the architectural insight while removing the tracking reference. Future consistency passes should flag "false gap" sentences separately from simple label removals and route them to a spec author (not a mechanical cleanup agent) for review. A mechanical tool might drop the architectural content along with the label.

- **Numeric count statistics in overview files should reference the inventory as their source of truth**: the "38 gaps" / "15 High" discrepancy in ecosystem-guidelines.md was caught because ticket-002 explicitly required verifying counts against spec-gap-inventory.md. Any spec file that embeds numeric gap statistics (total count, per-severity count, per-crate count) is a maintenance liability. Future planning tickets that add or close gaps should include a step to grep for hardcoded gap counts across all `src/specs/overview/` files and update them. See `src/specs/overview/ecosystem-guidelines.md` lines 384-387 as the canonical example of a file with embedded count statistics.
