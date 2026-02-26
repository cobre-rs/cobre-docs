# Epic 04 Learnings: Spec Consistency Final Pass

## Patterns Followed from Epics 01-03

### § vs SS prefix enforcement via systematic grep

The § convention audit (ticket-015) followed the exact methodology recommended in the epic-03 learnings: grep all `.md` files in `src/specs/architecture/` for the `§` character, then for each match verify the link target is in `src/specs/hpc/`. This mechanically produces a complete violation list without relying on manual review of individual files.

The expected finding (zero remaining violations in the new trait/test spec files after epic-03's guardian rejection was resolved) held true. The 12 new spec files from epics 01-03 were clean. The violations discovered were all in pre-existing architecture files that had been authored before the `§` vs `SS` convention was formalized.

Files audited: all `.md` files in `src/specs/architecture/`, plus `src/specs/hpc/communicator-trait.md`, `src/specs/hpc/backend-selection.md`, `src/specs/hpc/backend-local.md`, `src/specs/hpc/backend-tcp.md`, `src/specs/hpc/backend-shm.md`, `src/specs/hpc/backend-testing.md`.

### Convention blockquote position and absence in testing specs confirmed

All seven trait-bearing spec files were confirmed to contain the verbatim convention blockquote in the required structural position: after the Purpose section, before SS1/section 1. The six testing specs (`*-testing.md`) were confirmed to contain zero instances of the blockquote. This split validates the convention established in epic-01: "blockquote belongs in trait specs only, never in testing specs."

The one defect found was a path-level error inside the blockquote text itself, not a structural placement error (see the guardian findings section below).

Files confirmed: `src/specs/hpc/communicator-trait.md`, `src/specs/architecture/risk-measure-trait.md`, `src/specs/architecture/horizon-mode-trait.md`, `src/specs/architecture/sampling-scheme-trait.md`, `src/specs/architecture/cut-selection-trait.md`, `src/specs/architecture/stopping-rule-trait.md`, `src/specs/architecture/solver-interface-trait.md`.

### Naming conventions derived from source specs held across all 7 trait specs

The enum variant names in all five algorithm-variant trait specs match their source entries in `src/specs/architecture/extension-points.md` in both PascalCase (Rust identifier) and snake*case (JSON config string). Method naming conventions — `is*_`/`should\__`for boolean queries, verb-based for computation, bare nouns for accessors — are consistent across all trait specs and the`communicator-trait.md`. No two supporting types across the seven specs share a name with conflicting structures.

No fixes were required for naming; the audit was a clean confirmation pass.

Reference sources: `src/specs/architecture/extension-points.md` (SS2-SS5, SS8), `src/specs/architecture/solver-abstraction.md`.

---

## New Patterns and Conventions Established

### Pre-existing architecture files are a distinct § violation source

The epic-03 guardian rejection involved new files (solver-interface-trait.md) written incorrectly. The epic-04 audit revealed a different violation category: pre-existing architecture files authored before the `§` vs `SS` convention existed. These files used `§` as a section anchor throughout (e.g., `training-loop.md`, `input-loading-pipeline.md`, `simulation-architecture.md`), consistently self-referencing sections within the same file.

This finding has a practical consequence for future audits: the "18 architecture files containing `§`" category splits into (a) new spec files where the violation is an author error against a known rule, and (b) pre-existing files that were never updated to the convention. The remediation approach differs: new file violations are blockers (reject the ticket); pre-existing file violations are deferred-fix items tracked as a batch.

Total violations fixed in epic-04: approximately 343 occurrences across 16 files (81 in 3 new trait spec files from earlier epics that needed touch-up, and 262 in 13 pre-existing architecture files).

### Six-point GIL contract as the canonical reference for all GIL-adjacent files

The communication-backend-abstraction plan added a sixth point to the GIL contract (multi-process worker independence), but the `src/crates/python.md` crate overview file still referenced the "Five-point contract." The epic-04 audit (ticket-017) identified this stale count and fixed it.

The pattern established here: when a numbered contract in an authoritative spec is extended, the crate overview files that reference the contract by count are a secondary update target that can easily be missed. Future contract extensions should include a grep for the previous count string as part of the update checklist.

Files fixed: `src/crates/python.md` (updated "Five-point contract" to "Six-point contract" with summary of point 6, and corrected the MPI prohibition rationale to cite all three independent reasons).

### MPI prohibition rationale requires all three reasons, not just the GIL reason

Ticket-017 established a clear rule: any spec that states the MPI prohibition must not attribute it solely to GIL/threading incompatibility. The correct framing is that there are three independent reasons: (1) `MPI_Init_thread` timing conflict, (2) GIL/`MPI_THREAD_MULTIPLE` deadlock risk, and (3) dual-FFI-layer fragility. Under free-threaded Python (PEP 703/779), reason (2) is resolved, but reasons (1) and (3) remain. A spec that cites only reason (2) would incorrectly imply the prohibition lifts under free-threaded builds.

The established shorthand "GIL/MPI incompatibility" remains acceptable as a brief parenthetical reference to the full prohibition documented in `python-bindings.md` SS7.2. What is not acceptable: any phrase of the form "because the GIL prevents MPI."

Files confirmed/fixed: `src/specs/hpc/hybrid-parallelism.md`, `src/specs/hpc/backend-local.md`, `src/specs/hpc/backend-tcp.md`, `src/specs/hpc/backend-selection.md`, `src/specs/architecture/cli-and-lifecycle.md`.

### Decision log entries in ticket files document scope boundary reasoning

Ticket-018 added a Decision Log section to its ticket file documenting the conclusion that `extension-points.md` does not need a forward-reference to the traits-as-guidelines convention. The reasoning: `extension-points.md` discusses dispatch strategies and variant pipeline but does not present any Rust trait signatures, so the convention is not relevant to readers of that file.

This inline decision log is a useful practice for consistency-pass tickets that have a "check and decide" criterion rather than a "check and fix" criterion. Recording the decision in the ticket prevents the same question from being re-evaluated in future audits or by future authors.

File: `plans/spec-readiness/epic-04-spec-consistency-pass/ticket-018-verify-traits-convention-propagation.md`, Decision Log section.

---

## Guardian Findings and Rejections

No formal guardian rejections occurred in epic-04 (all four tickets passed). However, ticket-018 identified one defect during verification:

### Defect in sampling-scheme-trait.md: wrong cross-reference symbol inside convention blockquote

`src/specs/architecture/sampling-scheme-trait.md` contained `[Backend Testing SS1]` inside the convention blockquote instead of the correct `[Backend Testing §1]`. The blockquote in all other six trait specs uses `§1` for this link, which is correct because `backend-testing.md` is an HPC file. The `SS1` form is the violation: it applies the architecture-file prefix to an HPC-file reference.

This defect is the mirror image of the epic-03 violation: instead of using `§` for architecture links (wrong), this file used `SS` for an HPC link (also wrong). The root cause is that the file was produced in a session that knew to avoid `§` in architecture contexts, and over-applied that rule to the one `§` that is legitimately required (the HPC link inside the blockquote).

Fix applied: replaced `[Backend Testing SS1]` with `[Backend Testing §1](../hpc/backend-testing.md)` in the blockquote in `src/specs/architecture/sampling-scheme-trait.md`.

---

## Issues Encountered

### Violation count scale: pre-existing files dwarf new spec files

The pre-existing architecture files contributed approximately 262 `§` violations across 13 files, compared to approximately 81 violations in the 3 new trait spec files that needed touch-up. This ratio means that a future consistency audit of a mature spec corpus will spend most of its effort on files that predate the convention, not on newly authored files. The new spec author workflow (with explicit pitfall warnings in ticket descriptions) produces cleaner files than organic evolution.

### GIL contract count divergence is a cross-plan artifact

The `src/crates/python.md` stale "Five-point contract" arose because the communication-backend-abstraction plan updated `python-bindings.md` but did not include the crate overview file in its scope. Crate overview files (`src/crates/*.md`) are secondary documentation that summarizes authoritative specs; they do not always receive updates when the authoritative spec changes. The spec-readiness consistency pass caught this gap.

For future plans: when a numbered contract in a `src/specs/` file is extended, add the corresponding `src/crates/` file to the "Key Files to Modify" list in the ticket.

### py.allow_threads() wording is backward-compatible by construction

Ticket-017 verified that all files mentioning `py.allow_threads()` or "GIL release" use wording that is compatible with free-threaded Python semantics. The conclusion is that the portable phrasing "detaches the calling thread from the Python runtime" (or "releases the GIL / detaches thread state") appears naturally in the files that were updated by the communication-backend-abstraction plan. Files that predate that plan and use the older "releases the GIL" phrasing are not incorrect — they describe the GIL-enabled behavior accurately and do not claim the free-threaded behavior is different. No fixes were required for `py.allow_threads()` wording outside of `src/crates/python.md`.

---

## Recommendations for Epic 05

### Convention blockquote audit should be mechanical, not manual

The one blockquote defect found in epic-04 (`SS1` instead of `§1` inside the blockquote in `sampling-scheme-trait.md`) was a character-level error that a diff against the canonical blockquote would catch automatically. For any future plan that adds new trait specs, the verification step should extract the canonical blockquote text from `src/specs/hpc/communicator-trait.md` and do a textual comparison (allowing only the `./backend-testing.md` vs `../hpc/backend-testing.md` path difference) rather than a visual inspection.

### Pre-existing § violations are now fixed; future audits start from a clean corpus

After epic-04, the architecture spec corpus has been fully audited for `§` convention violations. A post-epic-04 grep of `§` in `src/specs/architecture/*.md` should return only: (a) the convention blockquote's `[Backend Testing §1]` occurrence in each of the seven trait specs, and (b) no other occurrences. Any future architecture spec that produces new `§` occurrences beyond this baseline is a new violation.

### Implementation readiness tickets should cross-reference the MPI prohibition rule

Any implementation ticket that touches Python bindings, worker launch, or backend selection should include a pitfall note: "Do not cite only the GIL reason for the MPI prohibition; cite the full three-reason rationale from `python-bindings.md` SS7.2 or use the established shorthand `GIL/MPI incompatibility`." This prevents future spec drift.

### Crate overview files are secondary targets that lag behind spec changes

The pattern established in epic-04 (crate file out of sync with spec because the spec was updated in a prior plan) will recur. For each spec-readiness epic that finalizes content in `src/specs/`, include a checklist item: "Verify all `src/crates/*.md` files that reference this spec still accurately reflect the current section count and content."
