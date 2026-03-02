# Epic 01: Stale Reference Cleanup

## Goal

Fix all files that were NOT touched by the StageLpCache adoption but still contain stale "Option A" references, stale "120 stages" production values, and stale derived numerical values (28 GB, dispatch counts). These are the files where a reader will encounter a direct contradiction with the adopted baseline.

## Scope

This epic covers files that were **not** edited during the StageLpCache adoption and still present Option A / 120 stages as the current production baseline. It also covers the full rewrite of design-principles.md section 5.4, deletion of binary-formats.md Appendix A, and cleanup of stale numerical values throughout.

## Files Targeted

### Contradictory "adopted" statements

- `src/specs/overview/design-principles.md` -- says "adopted LP construction strategy is Option A"
- `src/specs/data-model/binary-formats.md` -- says "Decision (2026-02-16): Option A is adopted"

### Stale "120 stages" as production reference

- `src/specs/data-model/binary-formats.md` (lines 129, 326, 392)
- `src/specs/hpc/checkpointing.md` (lines 72-73)
- `src/specs/hpc/communicator-trait.md` (line 648)
- `src/specs/hpc/backend-tcp.md` (line 385)
- `src/specs/overview/ecosystem-vision.md` (line 153)
- `src/specs/overview/spec-gap-inventory.md` (lines 93, 96)
- `src/specs/architecture/risk-measure-trait.md` (line 206)
- `src/specs/architecture/sampling-scheme-trait.md` (line 310)
- `src/specs/architecture/horizon-mode-trait.md` (line 357)
- `src/specs/architecture/cut-selection-trait.md` (line 344)
- `src/specs/architecture/performance-adaptation-layer.md` (lines 87, 89, 98)

### Stale cross-references to Binary Formats Appendix A

- `src/specs/overview/design-principles.md` (line 122)
- `src/specs/architecture/solver-interface-trait.md` (line 740)
- `src/specs/architecture/solver-clp-impl.md` (line 300)
- `src/specs/architecture/solver-highs-impl.md` (line 257)
- `src/specs/architecture/solver-workspaces.md` (line 327)
- `src/specs/architecture/solver-abstraction.md` (line 674)

### Crate docs

- `src/crates/solver.md` (line 67-70) -- mentions addRows as the dynamic constraint injection mechanism

## Ticket Count: 6

## Dependencies

- None -- this epic can start immediately. All edits are to files not currently being modified by other work.

## Completion Criteria

- Zero occurrences of "Option A" as an adopted baseline in any spec file
- Zero occurrences of "120 stages" used as a production baseline (hypothetical max and range uses are acceptable)
- Zero occurrences of "28 GB" anywhere in the spec corpus
- Binary Formats Appendix A deleted; zero cross-references to it
- `mdbook build` succeeds
