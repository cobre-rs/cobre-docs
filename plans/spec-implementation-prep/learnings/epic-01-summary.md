# Accumulated Learnings: spec-implementation-prep through Epic 01

## Patterns

- **Label-only removal**: GAP marker excision from prose is a one-line substitution — strip the parenthetical, verify surrounding sentence still reads as a complete thought. Blockquote bold openers keep their trailing punctuation (`.` for design notes, `:` for stakeholder decisions). See `src/specs/architecture/training-loop.md` line 69 and `src/specs/architecture/solver-abstraction.md` line 318.
- **False-gap sentence rewrite**: when a GAP reference is embedded in a sentence explaining _why_ it was a false gap, mechanical deletion destroys the architectural insight — rewrite the sentence to state the architectural property directly. See `src/specs/architecture/scenario-generation.md` line 133.
- **Section heading parenthetical removal**: strip trailing `(GAP-NNN)` from heading, preserve section number, title, and heading level verbatim. See `src/specs/hpc/communicator-trait.md` line 640.
- **Status-table inversion**: "must be resolved before X" becomes a historical record by (a) changing tense, (b) adding **Resolved** markers matching the `Description — **Resolved**: brief note with relative Markdown link` format, (c) updating hardcoded statistics. See `src/specs/overview/ecosystem-guidelines.md` lines 384-402.

## Conventions

- **Resolved row link policy**: cross-references in resolution-status tables point to the content-bearing spec file (not the gap inventory). Relative paths from `src/specs/overview/`.
- **Gap count update sequence**: verify counts against `src/specs/overview/spec-gap-inventory.md` before editing; update total count and per-severity count atomically in the same edit.
- **Gap inventory is immutable in this plan**: only prose files are cleaned; `spec-gap-inventory.md` is never modified — it is the audit trail from the prior plan.

## Architectural Decisions

- **Separate tickets for distinct edit patterns**: label removal (4 files, ticket-001) and status-table inversion (1 file, ticket-002) were split because they require different verification criteria. Splitting enables tighter scope checking.
- **"Pending blocker" prose outlives the planning phase**: every "must be resolved before" statement coupled to a GAP-ID becomes stale when the gap closes. Treat these as maintenance liabilities requiring a dedicated cleanup ticket.

## Quality Signals

- Ticket-001 quality 0.93 (EXCELLENT): multi-file scatter caused atomicity score of 0.8 but all criteria passed
- Ticket-002 quality 1.00 (EXCELLENT): single-file, exact-match acceptance criteria, status-only annotation

## Recommendations for Future Epics

- **Run GAP scan at every epic boundary**: `grep -rn "GAP-" src/specs/ --include="*.md" | grep -v spec-gap-inventory.md` — any result outside the inventory is a cleanup candidate
- **Flag "must resolve before" language after every gap-closing plan**: files most likely to need updates are `src/specs/overview/ecosystem-guidelines.md` and `src/specs/overview/implementation-ordering.md`
- **Route false-gap sentences to a spec author, not a mechanical agent**: they require semantic judgment to preserve architectural content while removing the tracking reference
- **Multi-file single-pattern tickets score 0.8 on atomicity** — acceptable tradeoff when edits are logically coupled; document the rationale in the ticket to set expectations
