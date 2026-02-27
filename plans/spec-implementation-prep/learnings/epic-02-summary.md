# Accumulated Learnings: spec-implementation-prep through Epic 02

## Patterns

- **Label-only removal**: GAP marker excision from prose is a one-line substitution — strip the parenthetical, verify surrounding sentence still reads as a complete thought. Blockquote bold openers keep their trailing punctuation (`.` for design notes, `:` for stakeholder decisions). See `src/specs/architecture/training-loop.md` line 69 and `src/specs/architecture/solver-abstraction.md` line 318.
- **False-gap sentence rewrite**: when a GAP reference is embedded in a sentence explaining _why_ it was a false gap, mechanical deletion destroys the architectural insight — rewrite the sentence to state the architectural property directly. See `src/specs/architecture/scenario-generation.md` line 133.
- **Status-table inversion**: "must be resolved before X" becomes a historical record by changing tense, adding **Resolved** markers, and updating hardcoded statistics. See `src/specs/overview/ecosystem-guidelines.md` lines 384-402.
- **§-to-SS replacement (canonical rule)**: in `src/specs/architecture/` files, `§` is permitted only (1) inside markdown links targeting `../hpc/` files, and (2) inside the convention blockquote's `[Backend Testing §1](../hpc/backend-testing.md)`. Every other `§` is a violation — replace with `SS`. Total fixed: 119 violations across 12 pre-convention files.
- **Cross-architecture reference format**: prose references to sections in other architecture files use `Filename SSN` — not `Filename §N`. See `src/specs/architecture/solver-clp-impl.md` (post-fix).
- **Table cell § replacement**: `§` inside markdown table cells replaces cleanly with `SS`; table borders are unaffected. See `src/specs/architecture/solver-workspaces.md`.
- **Mixed-status file handling**: files with both violations and legitimate HPC § links require per-occurrence edits, not global replace-all. Key filter: `grep "§" FILE | grep -v "../hpc/"` isolates violations only.

## Conventions

- **Resolved row link policy**: cross-references in resolution-status tables point to the content-bearing spec file (not the gap inventory). Relative paths from `src/specs/overview/`.
- **Gap count update sequence**: verify counts against `src/specs/overview/spec-gap-inventory.md` before editing; update total count and per-severity count atomically in the same edit.
- **Gap inventory is immutable in this plan**: only prose files are cleaned; `spec-gap-inventory.md` is never modified — it is the audit trail from the prior plan.
- **§ verification gate**: before merging any architecture spec edit, run `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"` — expect zero matches. This is the canonical post-edit check established by ticket-005 AC C6.
- **Pre-convention vs. post-convention boundary**: all 13 architecture files authored during spec-readiness were already clean. The 12 dirty files were all pre-convention. The §-cleanup is a one-time historical fix, not ongoing maintenance.

## Architectural Decisions

- **Separate tickets for distinct edit patterns** (Epic 01): label removal and status-table inversion were split because they require different verification criteria.
- **Ticket batching by violation count, not by file purpose** (Epic 02): files split into count brackets (high/medium/low) rather than subsystem groups to balance per-ticket effort and enable early pattern validation.
- **OpenMP references preserved in architecture files**: solver-workspace and solver-impl files correctly say "OpenMP thread" because the HPC spec layer still uses OpenMP terminology for thread-local solver ownership. Neutralizing them without an HPC-layer decision would sever the spec chain. See `src/specs/architecture/solver-workspaces.md` and `src/specs/architecture/solver-interface-trait.md`.
- **"Pending blocker" prose outlives the planning phase**: every "must be resolved before" statement coupled to a GAP-ID becomes stale when the gap closes — treat as a maintenance liability requiring a dedicated cleanup ticket.

## Quality Signals

- Ticket-001 quality 0.93 (EXCELLENT): multi-file scatter caused atomicity score of 0.8
- Ticket-002 quality 1.00 (EXCELLENT): single-file, exact-match ACs, status-only annotation
- Ticket-003 quality 1.00 (EXCELLENT): guardian initially false-rejected due to diff analysis error; overridden on direct file evidence
- Ticket-004 quality 1.00 (EXCELLENT): clean execution, 6/6 ACs passed
- Ticket-005 quality 1.00 (EXCELLENT): readiness atomicity 0.4 (dual-task ticket), implementation fully completed

## Process Pitfalls

- **Diff-analysis errors produce false REJECTED verdicts**: the ticket-003 guardian compared post-edit state to itself, not to the pre-edit baseline, and incorrectly rejected the implementation. Fix: always run grep directly against the current file for text-content criteria — diff output is informational only, direct file checks are authoritative.
- **Multi-task tickets inflate scope risk**: ticket-005 bundled 5-file §-fix with corpus-wide OpenMP audit. Both completed cleanly at this scale; at larger scale, split into separate tickets.

## Recommendations for Future Epics

- **Run GAP scan at every epic boundary**: `grep -rn "GAP-" src/specs/ --include="*.md" | grep -v spec-gap-inventory.md` — any result outside the inventory is a cleanup candidate
- **Flag "must resolve before" language after every gap-closing plan**: files most likely to need updates are `src/specs/overview/ecosystem-guidelines.md` and `src/specs/overview/implementation-ordering.md`
- **Route false-gap sentences to a spec author, not a mechanical agent**: they require semantic judgment to preserve architectural content while removing the tracking reference
- **Run the §-gate grep before merging any architecture spec**: see Convention above; zero-match result is the gate condition
- **OpenMP-to-rayon migration requires a dedicated spec-update epic**: do not update OpenMP terminology in cleanup passes — the decision belongs to the architecture team. Files to update when the time comes: `src/specs/architecture/solver-workspaces.md`, `src/specs/architecture/solver-clp-impl.md`, `src/specs/architecture/solver-highs-impl.md`, `src/specs/architecture/solver-interface-trait.md`, `src/specs/architecture/architecture.md`
- **Epic-03 (navigation layer) edits `src/specs/overview/` files** — apply plain numbered headings (`## 1.`, `## 2.`), never `SS` or `§`, per the structural pattern for overview files
