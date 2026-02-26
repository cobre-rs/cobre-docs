# ticket-017 Validate Free-Threaded Python Note Consistency

## Context

### Background

The `communication-backend-abstraction` plan added section SS7.5a ("Future: Free-Threaded Python (PEP 703)") to `src/specs/interfaces/python-bindings.md`. This section documents the impact of free-threaded Python (CPython 3.14+) on Cobre's Python bindings, including the continued correctness of the 6-point GIL contract, the persistence of the MPI prohibition, and the deferred threading-based multi-worker alternative. Additionally, the same plan updated SS3.1 point 2 with portable wording ("detach thread state" instead of "release GIL") and updated SS10.4 for Python 3.14 + free-threaded wheel support.

Multiple other spec files reference the GIL, GIL/MPI incompatibility, or GIL release behavior. A systematic check is needed to ensure that no existing GIL reference contradicts the SS7.5a additions or the updated SS3.1 wording. A contradiction would mean one spec claims the GIL must be released for a specific reason that no longer applies under free-threaded builds, or that a spec claims MPI is forbidden solely because of the GIL (when in fact 2 of the 3 prohibition reasons are GIL-independent).

### Relation to Epic

This ticket is one of four parallel consistency checks in Epic 04. It focuses on a narrow but important domain: ensuring that the free-threaded Python note (SS7.5a) and the updated GIL contract wording do not create contradictions with GIL references elsewhere in the spec corpus. This is the most content-sensitive of the four checks, requiring careful reading of each GIL reference in context.

### Current State

The following 8 files reference the GIL, "Global Interpreter Lock", "free-threaded", or "nogil":

**Spec files (7):**

1. `src/specs/interfaces/python-bindings.md` -- The authoritative GIL spec. Contains the 6-point GIL contract (SS3.1), GIL state transition diagrams (SS3.2, SS3.2a), MPI prohibition (SS7.2), multi-process execution (SS7.3-7.4), and the free-threaded Python note (SS7.5a). Updated SS3.1 point 2 with portable wording and SS10.4 for free-threaded wheel support.
2. `src/specs/hpc/hybrid-parallelism.md` -- References GIL/MPI incompatibility as the reason Python bindings use single-process mode. Mentions GIL release before OpenMP parallel regions.
3. `src/specs/hpc/backend-local.md` -- References GIL/MPI incompatibility as the reason Python bindings use the local backend.
4. `src/specs/hpc/backend-tcp.md` -- References GIL incompatibility with MPI launchers as a deployment scenario for the TCP backend.
5. `src/specs/hpc/backend-selection.md` -- References GIL release before entering Rust computation during Python backend selection.
6. `src/specs/overview/design-principles.md` -- References GIL management in the Python bindings cross-reference entry.
7. `src/specs/architecture/cli-and-lifecycle.md` -- References GIL/MPI incompatibility for Python bindings and GIL release before OpenMP parallel regions.

**Crate file (1):** 8. `src/crates/python.md` -- References GIL/MPI incompatibility and describes a "Five-point contract" for GIL management. NOTE: The spec now has a 6-point GIL contract (point 6 was added for multi-process mode by the communication-backend-abstraction plan). This file likely has a stale "Five-point" reference that needs updating to "6-point".

## Specification

### Requirements

The validation has three parts:

**Part 1: GIL/MPI prohibition wording.** For each file that mentions GIL/MPI incompatibility (files 2, 3, 4, 7, 8), verify that the stated reason for the incompatibility is not solely "the GIL prevents MPI threads from executing." The correct framing (per SS7.2 and SS7.5a) is that there are 3 independent reasons for the MPI prohibition: (1) `MPI_Init_thread` timing conflict, (2) GIL/`MPI_THREAD_MULTIPLE` deadlock risk, and (3) dual-FFI-layer fragility. Free-threaded Python resolves reason (2) but not reasons (1) or (3). Any spec that cites only reason (2) must be updated to reference the full prohibition or to use a more general phrase (e.g., "GIL/MPI incompatibility" as a shorthand is acceptable since it is established terminology, but "because the GIL prevents MPI" is too narrow).

**Part 2: GIL contract count.** Verify that all references to the GIL contract point count match the current 6-point contract in SS3.1. The `src/crates/python.md` file currently says "Five-point contract" which is stale (the 6th point about multi-process GIL independence was added by the communication-backend-abstraction plan). Update any stale counts.

**Part 3: `py.allow_threads()` wording.** Verify that any spec file that mentions `py.allow_threads()` or GIL release uses wording compatible with SS3.1 point 2's updated portable wording. The current wording says `py.allow_threads()` "detaches the thread state" (not just "releases the GIL"), which is correct for both GIL-enabled and free-threaded builds. Any file that says "releases the GIL" without mentioning thread state detachment is not incorrect (it describes the GIL-enabled behavior accurately) but should be checked against SS3.1 point 2 for consistency.

### Inputs/Props

- The 8 files listed above containing GIL references
- `src/specs/interfaces/python-bindings.md` SS3.1 and SS7.5a as the authoritative reference

### Outputs/Behavior

- A list of all inconsistencies found, with the current text and the recommended correction
- Fixes applied directly to the affected files following the additive-only convention
- For `src/crates/python.md`: update "Five-point" to "Six-point" (or update the entire bullet to match the current contract)
- If the only inconsistency is the stale point count in `src/crates/python.md`, confirm that all other GIL references are consistent

### Error Handling

If a contradiction is found that cannot be resolved by a simple wording update, add a clarifying note as a new lettered subsection (additive-only). Do not delete existing text.

## Acceptance Criteria

- [ ] Given all 7 spec files that reference GIL/MPI incompatibility, when each reference is examined, then no reference states that the MPI prohibition exists solely because of the GIL (all references either use the established shorthand "GIL/MPI incompatibility" or cite the full 3-reason prohibition)
- [ ] Given `src/crates/python.md`, when the GIL contract description is examined, then the point count matches the current 6-point contract (not the stale 5-point count)
- [ ] Given all files that mention `py.allow_threads()`, when the wording is compared to SS3.1 point 2, then no file makes claims that contradict the portable "detach thread state" semantics
- [ ] Given the free-threaded Python note SS7.5a, when all GIL references across the corpus are read, then no reference claims behavior that would be incorrect under free-threaded Python (e.g., no file claims "the GIL serializes all Python threads" without acknowledging the free-threaded future)
- [ ] Given any fixes applied, when the changes are reviewed, then the additive-only convention is preserved (no sections deleted or renumbered)

## Implementation Guide

### Suggested Approach

1. **Read SS3.1 and SS7.5a.** Establish the authoritative GIL contract wording and the free-threaded impact analysis as the reference baseline.

2. **Check each file sequentially.** For each of the 8 files:
   a. Read all GIL-related passages
   b. Check GIL/MPI prohibition wording (Part 1)
   c. Check GIL contract point count (Part 2)
   d. Check `py.allow_threads()` wording (Part 3)
   e. Record any inconsistencies

3. **Apply fixes.** Update stale references. For `src/crates/python.md`, update the point count from 5 to 6 and consider adding the 6th point's summary. For any spec file with overly narrow GIL/MPI wording, update to use the established shorthand or reference the full prohibition.

4. **Verify no regression.** After applying fixes, re-read each modified file to confirm the changes are correct and do not introduce new inconsistencies.

### Key Files to Modify

Likely to need modification:

- `src/crates/python.md` -- Update "Five-point contract" to "Six-point contract" and add summary of point 6

May need modification (if GIL/MPI wording is too narrow):

- `src/specs/hpc/hybrid-parallelism.md`
- `src/specs/hpc/backend-local.md`
- `src/specs/hpc/backend-tcp.md`
- `src/specs/hpc/backend-selection.md`
- `src/specs/architecture/cli-and-lifecycle.md`

Unlikely to need modification (cross-reference entries only):

- `src/specs/overview/design-principles.md`

Authoritative reference (read-only):

- `src/specs/interfaces/python-bindings.md` (SS3.1, SS7.2, SS7.5a)

### Patterns to Follow

- The established shorthand "GIL/MPI incompatibility" is acceptable as a brief reference to the full 3-reason prohibition documented in SS7.2
- Cross-references to the GIL contract should say "6-point GIL contract" or simply "GIL management contract (SS3.1)" without specifying the count
- When mentioning `py.allow_threads()`, the most portable phrasing is "detaches from the Python runtime" or "releases the GIL / detaches thread state" -- either is acceptable
- The additive-only convention applies: if a file needs a clarification about free-threaded Python, add it as a parenthetical or a new lettered subsection, never delete existing text

### Pitfalls to Avoid

- Do not add a full SS7.5a-style free-threaded Python discussion to every file that mentions the GIL. The detailed analysis belongs only in `python-bindings.md`. Other files should use the established shorthand or a brief parenthetical.
- Do not change "GIL/MPI incompatibility" to a longer phrase everywhere -- this shorthand is intentionally brief and is used in parenthetical cross-references.
- Do not modify `python-bindings.md` itself unless a genuine internal inconsistency is found (this file is the authoritative source, not the audit target for this ticket).

## Testing Requirements

Not applicable -- this is a specification document audit, not executable code.

## Dependencies

- **Blocked By**: None (can proceed independently of trait spec work -- the GIL-related changes were made in a prior plan)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
