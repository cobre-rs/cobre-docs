# Epic 02 Learnings: Consistency Pass (§-Convention Enforcement)

## Patterns Established

- **Mechanical §-to-SS replacement pattern**: the replacement algorithm is: scan each file for `§`; classify each occurrence as (a) inside a markdown link pointing to `../hpc/` (legitimate — keep), (b) inside the convention blockquote's single `[Backend Testing §1](../hpc/backend-testing.md)` reference (legitimate — keep), or (c) everything else (violation — replace with `SS`). The classifier is grep-filterable: `grep "§" FILE | grep -v "../hpc/"` returns only violations. See `src/specs/architecture/simulation-architecture.md` (42 violations fixed) and `src/specs/architecture/scenario-generation.md` (14 violations, 2 preserved).

- **Cross-architecture-file § pattern**: some pre-convention files used `§` not just self-referentially but also when referring to sections in other architecture files (e.g., `Solver Abstraction §6` in `solver-clp-impl.md` and `solver-highs-impl.md`). These are violations under the same rule — replace with `SS`. The fix reads: `Solver Abstraction §6` → `Solver Abstraction SS6`. See `src/specs/architecture/solver-clp-impl.md` and `src/specs/architecture/solver-highs-impl.md`.

- **Table cell § pattern**: `solver-workspaces.md` used `§` inside a markdown table header cell (`| §1.4 Step |`). The replacement to `| SS1.4 Step |` preserves table structure. No special handling required; the cell border characters are unaffected. See `src/specs/architecture/solver-workspaces.md`.

- **Mixed-status file pattern**: several files had both violations and legitimate HPC § references in the same file. For these files, the correct approach is not a global replace-all but a targeted per-occurrence edit. `training-loop.md` (9 violations, 2 legitimate), `scenario-generation.md` (14 violations, 2 legitimate), `cli-and-lifecycle.md` (3 violations, 1 legitimate), `convergence-monitoring.md` (2 violations, 1 legitimate), and `cut-management-impl.md` (4 violations, 1 legitimate) all required this selective approach.

- **Comprehensive C6 verification pattern**: ticket-005's final acceptance criterion ran a single grep across all 25 architecture files: `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"`. This returns zero matches when the corpus is clean. This is the canonical post-epic verification command for §-convention status. See the ticket-005 AC C6 and final verification in `plans/spec-implementation-prep/epic-02-consistency-pass/ticket-005-fix-section-prefix-low-count-and-openmp-audit.md`.

## Architectural Decisions

- **Batching by violation count, not by file purpose**: the three tickets split the 12 files by count bracket (high: 42+14+14, medium: 10+9+7+7, low: 5+4+3+2+2) rather than by functional grouping (solver files, training loop files, etc.). This decision was correct because it balanced effort per ticket (2 points each) and allowed early commits to demonstrate the pattern before tackling the largest files. An alternative grouping by subsystem would have created uneven ticket sizes and made it harder to verify the pattern was being applied consistently.

- **OpenMP references preserved, not neutralized**: the audit in ticket-005 concluded that all OpenMP references in architecture files outside the three canonical files (`training-loop.md`, `hybrid-parallelism.md`, `communicator-trait.md`) are intentional and accurate. They describe thread-local solver ownership — a pattern that remains valid regardless of whether the threading layer uses OpenMP or rayon. The rejected alternative was to replace "OpenMP thread" with "thread" everywhere, which would have erased the connection to the HPC spec layer that still uses OpenMP terminology. See `src/specs/architecture/solver-workspaces.md`, `src/specs/architecture/solver-interface-trait.md`, `src/specs/architecture/solver-clp-impl.md`, `src/specs/architecture/solver-highs-impl.md`.

- **No § violations existed in the 7 trait specs (convention blockquote files)**: the 7 architecture files authored during the spec-readiness plan (`cut-selection-trait.md`, `horizon-mode-trait.md`, `risk-measure-trait.md`, `sampling-scheme-trait.md`, `solver-interface-trait.md`, `stopping-rule-trait.md`, and `validation-architecture.md`) already had exactly the correct § state. This confirmed the convention was applied correctly during their authorship and that the violations were purely a pre-convention legacy issue.

## Files and Structures Created

No new files created. Twelve existing architecture files modified:

- `src/specs/architecture/simulation-architecture.md` — 42 violations fixed (largest file in epic)
- `src/specs/architecture/scenario-generation.md` — 14 violations fixed, 2 legitimate HPC § preserved
- `src/specs/architecture/solver-abstraction.md` — 14 violations fixed, 0 legitimate § (all violations)
- `src/specs/architecture/solver-workspaces.md` — 10 violations fixed (includes table cell replacement)
- `src/specs/architecture/training-loop.md` — 9 violations fixed, 2 legitimate HPC § preserved
- `src/specs/architecture/extension-points.md` — 7 violations fixed
- `src/specs/architecture/input-loading-pipeline.md` — 7 violations fixed
- `src/specs/architecture/solver-clp-impl.md` — 5 violations fixed (includes cross-architecture § references)
- `src/specs/architecture/cut-management-impl.md` — 4 violations fixed, 1 legitimate HPC § preserved
- `src/specs/architecture/cli-and-lifecycle.md` — 3 violations fixed, 1 legitimate HPC § preserved
- `src/specs/architecture/convergence-monitoring.md` — 2 violations fixed, 1 legitimate HPC § preserved
- `src/specs/architecture/solver-highs-impl.md` — 2 violations fixed (cross-architecture § references)

Final corpus state: `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"` returns zero matches. Total remaining § in architecture directory: 17 occurrences across 11 files, all legitimate (7 convention blockquotes + 10 HPC file links in non-trait specs).

## Conventions Adopted

- **§ classification rule (canonical)**: in `src/specs/architecture/` files, `§` is permitted in exactly two contexts: (1) inside a markdown link whose target path contains `../hpc/` (links to HPC spec files), and (2) inside the verbatim convention blockquote's single `[Backend Testing §1](../hpc/backend-testing.md)` reference. All other § are violations and must be replaced with `SS`.

- **Cross-architecture reference format**: when an architecture file refers to a section in another architecture file, the format is `Filename SSN` — not `Filename §N`. Example: `Solver Abstraction SS6` (referring to section 6 of `solver-abstraction.md`). The file name is not linked in inline prose unless it is a full Markdown link; the `SS` prefix stands alone. See `src/specs/architecture/solver-clp-impl.md` post-fix state.

- **§ verification as part of any architecture spec review**: before approving any architecture spec for merge, run `grep "§" FILE | grep -v "../hpc/"` — any non-empty result is a violation. For bulk checks, use the full corpus command from the C6 pattern above.

## Surprises and Deviations

- **Guardian initially rejected ticket-003 due to diff analysis error**: the guardian's first verification pass for ticket-003 analyzed the wrong baseline (compared the post-edit state to itself rather than to the pre-edit state), causing a false REJECTED verdict. The implementer provided direct file evidence that all acceptance criteria passed, and the guardian overrode its diff-based conclusion. Resolution: the guardian re-ran all verification commands directly against the files and confirmed PASS. This is a known hazard when diff-analysis and direct-file-check methods disagree — direct file checks are authoritative for text-content criteria, while diff analysis is informational only.

- **Ticket-005 had the lowest atomicity readiness score (0.40)**: the readiness breakdown showed `atomicity: 0.4` because ticket-005 combined 5 files for §-cleanup with a corpus-wide OpenMP audit covering 5 additional files. These are two distinct tasks bundled by the planner for efficiency. The implementation quality still scored 1.00 because both tasks were fully completed. Future planning should consider whether the OpenMP audit warrants its own ticket if the corpus grows.

- **`cut-management-impl.md` had a mixed SS/§ state for the same target**: before the fix, this file used `SS` correctly in a markdown link to `communicator-trait.md` (`[Communicator Trait SS2.1](../hpc/communicator-trait.md)`) while using `§` in body text for self-referential sections. This asymmetry — correct in links, incorrect in prose — is a pattern to watch for in future audits. The grep check catches both because it operates on raw text, not on rendered links.

- **All 119 violations traced to 12 pre-convention files; 0 violations in 13 post-convention files**: the clean/dirty boundary is precisely the authorship date boundary (spec-readiness plan epoch). Files authored after the convention was established in `CLAUDE.md` required no edits. This confirms the convention has been working correctly since its establishment and that this epic was a one-time cleanup, not an ongoing maintenance task.

## Recommendations for Future Epics

- **Run the C6 grep as a standing gate before merging any architecture spec edit**: `grep "§" src/specs/architecture/ -r --include="*.md" | grep -v "Backend Testing §1" | grep -v "../hpc/"` should return zero matches. Add this check to any guardian verification step that modifies architecture files. See `plans/spec-implementation-prep/epic-02-consistency-pass/ticket-005-fix-section-prefix-low-count-and-openmp-audit.md` AC C6 for the exact command.

- **Direct file verification overrides diff-based reasoning for text-content criteria**: when a guardian or reviewer checks whether a specific string exists (or does not exist) in a file, run the grep directly against the file — do not infer the answer from a diff. Diffs can be misleading if the baseline is wrong or if the tool shows a partial view. See the ticket-003 guardian override incident.

- **OpenMP-to-rayon migration is out of scope for spec cleanup epics**: if the HPC layer fully adopts rayon and removes OpenMP, a dedicated spec-update epic will be needed to update the 6 files with OpenMP solver-ownership language. The decision should come from the architecture team, not from a consistency-pass agent. Files to update at that time: `src/specs/architecture/solver-workspaces.md`, `src/specs/architecture/solver-clp-impl.md`, `src/specs/architecture/solver-highs-impl.md`, `src/specs/architecture/solver-interface-trait.md`, and `src/specs/architecture/architecture.md` (parent).

- **Multi-task tickets (§ fix + audit) are acceptable at small scale but increase complexity**: ticket-005 bundled 5-file §-cleanup with a corpus-wide audit. Both tasks completed cleanly. If either task grows in scope in a future epic, split them: one ticket per edit class, one ticket for the audit. The atomicity readiness score (0.40) is the signal that the bundling is at the edge of what is tractable as a single ticket.
