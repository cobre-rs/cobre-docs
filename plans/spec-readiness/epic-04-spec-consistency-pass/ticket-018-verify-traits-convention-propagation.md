# ticket-018 Verify Traits-as-Guidelines Convention Propagation

## Context

### Background

The "Convention: Rust traits as specification guidelines" blockquote was established in `src/specs/hpc/communicator-trait.md` during the `communication-backend-abstraction` plan. It declares that Rust trait definitions in the spec corpus are guidelines for implementation (not absolute contracts), that prose takes precedence over trait signatures on conflict, and that conformance tests are the true verification mechanism. Epics 01-03 of the current plan required this blockquote to appear verbatim in all 6 new architecture trait specs. This ticket verifies that the blockquote is present, verbatim, and correctly positioned in all 7 trait-bearing spec files.

Additionally, `src/specs/architecture/extension-points.md` discusses the dispatch mechanism and trait architecture without referencing this convention. Since `extension-points.md` was written before the convention was formalized, it may benefit from a forward-reference to the convention. This ticket evaluates whether such a reference is needed and adds one if appropriate.

### Relation to Epic

This ticket is one of four parallel consistency checks in Epic 04. It verifies that the traits-as-guidelines convention is consistently propagated across all trait-bearing specs. If the blockquote is missing or modified in any trait spec, implementors may incorrectly treat trait signatures as absolute contracts, leading to rigid implementations that miss the domain intent captured in prose.

### Current State

The convention blockquote has been confirmed present in exactly 7 files via grep for "Convention: Rust traits as specification guidelines":

1. `src/specs/hpc/communicator-trait.md` -- The original source of the convention
2. `src/specs/architecture/risk-measure-trait.md` -- Added in ticket-001
3. `src/specs/architecture/horizon-mode-trait.md` -- Added in ticket-003
4. `src/specs/architecture/sampling-scheme-trait.md` -- Added in ticket-005
5. `src/specs/architecture/cut-selection-trait.md` -- Added in ticket-007
6. `src/specs/architecture/stopping-rule-trait.md` -- Added in ticket-009
7. `src/specs/architecture/solver-interface-trait.md` -- Added in ticket-011

The blockquote text (from `communicator-trait.md`, the canonical source):

> **Convention: Rust traits as specification guidelines.** The Rust trait definitions, method signatures, and struct declarations throughout this specification corpus serve as _guidelines for implementation_, not as absolute source-of-truth contracts that must be reproduced verbatim. Their purpose is twofold: (1) to express behavioral contracts, preconditions, postconditions, and type-level invariants more precisely than prose alone, and (2) to anchor conformance test suites that verify backend interchangeability (see [Backend Testing §1](../hpc/backend-testing.md)). Implementation may diverge in naming, parameter ordering, error representation, or internal organization when practical considerations demand it -- provided the behavioral contracts and conformance tests continue to pass. When a trait signature and a prose description conflict, the prose description (which captures the domain intent) takes precedence; the conflict should be resolved by updating the trait signature. This convention applies to all trait-bearing specification documents in `src/specs/`.

The blockquote must appear:

- After the Purpose section
- Before SS1 / section 1 (Trait Definition)
- As a markdown blockquote (line starts with `> `)

The testing specs (`*-testing.md`) should NOT contain the convention blockquote. The learnings state: "Convention blockquote belongs in trait specs only, never in testing specs."

The `extension-points.md` file discusses dispatch mechanisms (SS7) and the variant selection pipeline (SS6) without mentioning the convention. It was last updated by ticket-013 (cross-reference index additions).

## Specification

### Requirements

The verification has three checks:

**Check 1: Verbatim blockquote in all 7 trait specs.** For each of the 7 trait spec files, verify that:

1. The convention blockquote is present
2. The blockquote text is character-for-character identical to the canonical version from `communicator-trait.md`
3. The blockquote is positioned after the Purpose section and before SS1 / section 1
4. The blockquote is formatted as a markdown blockquote (lines start with `> `)

The only permitted difference between the 7 copies is the relative path in the `[Backend Testing §1]` link: in the HPC file (`communicator-trait.md`), the path is `./backend-testing.md`; in the 6 architecture files, the path is `../hpc/backend-testing.md`. Both are correct -- they resolve to the same file from their respective directories.

**Check 2: Absence from testing specs.** Verify that none of the 6 testing specs (`*-testing.md`) contain the convention blockquote. Testing specs should reference the trait spec for the convention, not reproduce it.

**Check 3: Extension-points.md forward-reference.** Evaluate whether `extension-points.md` should reference the convention. If SS7 (dispatch mechanism analysis) or the introductory section discusses how traits are used in the spec corpus, a parenthetical forward-reference to the convention would be appropriate (e.g., "See the convention note in each trait spec for the relationship between trait signatures and implementation."). If `extension-points.md` does not discuss trait usage at a level where the convention is relevant, no change is needed. Document the decision either way.

### Inputs/Props

- The 7 trait spec files listed above
- The 6 testing spec files
- `src/specs/architecture/extension-points.md`
- The canonical blockquote text from `src/specs/hpc/communicator-trait.md`

### Outputs/Behavior

- Confirmation that all 7 trait specs contain the verbatim blockquote (or fixes applied if any are missing/modified)
- Confirmation that no testing spec contains the blockquote (or fixes applied if any do)
- A decision on whether `extension-points.md` needs a forward-reference, with rationale
- If a forward-reference is added to `extension-points.md`, it should be a brief parenthetical, not a reproduction of the full blockquote

### Error Handling

If a trait spec has a modified version of the blockquote (e.g., different wording, missing sentences), replace it with the exact canonical text. If the blockquote is entirely missing from a trait spec, add it in the correct position (after Purpose, before SS1).

## Acceptance Criteria

- [ ] Given the 7 trait spec files, when the convention blockquote in each file is compared character-by-character to the canonical version from `communicator-trait.md`, then the text is identical except for the permitted `./backend-testing.md` vs `../hpc/backend-testing.md` path difference
- [ ] Given the 7 trait spec files, when the position of the convention blockquote is checked, then it appears after the Purpose paragraph and before the first numbered section (SS1 or ## 1)
- [ ] Given the 6 testing spec files, when each file is searched for the string "Convention: Rust traits as specification guidelines", then zero matches are found
- [ ] Given `extension-points.md`, when the need for a forward-reference is evaluated, then a documented decision is recorded (either a reference is added or the absence is justified)

## Implementation Guide

### Suggested Approach

1. **Extract canonical blockquote.** Read `src/specs/hpc/communicator-trait.md` and extract the full blockquote text (lines starting with `> ` between the Purpose section and §1).

2. **Compare each trait spec.** For each of the 6 architecture trait specs:
   a. Read the file
   b. Find the blockquote (search for "Convention: Rust traits")
   c. Compare the blockquote text to the canonical version
   d. The only permitted difference is the link path: canonical has `./backend-testing.md`, architecture files should have `../hpc/backend-testing.md`
   e. If the text differs, note the difference

3. **Check testing specs.** For each of the 6 testing specs, search for the string "Convention: Rust traits as specification guidelines". If found, note the file.

4. **Evaluate extension-points.md.** Read the file, focusing on SS7 (dispatch mechanism analysis) and the introductory sections. Decide whether a forward-reference to the convention is warranted. A reference is appropriate if the file discusses how traits are specified or how trait signatures relate to implementation. A reference is not needed if the file only discusses dispatch strategies (enum vs monomorphization) without commenting on the trait signature's role.

5. **Apply fixes.** Replace any non-verbatim blockquotes with the exact canonical text. Add missing blockquotes. Add a forward-reference to `extension-points.md` if the evaluation warrants it.

### Key Files to Modify

Files to verify (may need fixes):

- `src/specs/hpc/communicator-trait.md` (canonical source -- verify position)
- `src/specs/architecture/risk-measure-trait.md`
- `src/specs/architecture/horizon-mode-trait.md`
- `src/specs/architecture/sampling-scheme-trait.md`
- `src/specs/architecture/cut-selection-trait.md`
- `src/specs/architecture/stopping-rule-trait.md`
- `src/specs/architecture/solver-interface-trait.md`

Files to confirm absence:

- `src/specs/architecture/risk-measure-testing.md`
- `src/specs/architecture/horizon-mode-testing.md`
- `src/specs/architecture/sampling-scheme-testing.md`
- `src/specs/architecture/cut-selection-testing.md`
- `src/specs/architecture/stopping-rule-testing.md`
- `src/specs/architecture/solver-interface-testing.md`

File to evaluate for forward-reference:

- `src/specs/architecture/extension-points.md`

### Patterns to Follow

- The blockquote follows the structural pattern established in epic-01 learnings: Purpose paragraph -> blockquote -> SS1 Trait Definition
- The blockquote is a single markdown blockquote paragraph (all text on a single `> ` line in the source file, or wrapped with `> ` continuation lines)
- The link inside the blockquote uses `§1` (not SS1) because it references an HPC file -- this is the one valid `§` inside architecture spec files
- If a forward-reference is added to `extension-points.md`, follow the pattern of brief parenthetical cross-references used elsewhere in that file (e.g., "see [file §N](./path.md)" format)

### Pitfalls to Avoid

- Do not modify the canonical blockquote text in `communicator-trait.md`. If there is a discrepancy, the architecture files must be updated to match the HPC file, not the other way around.
- Do not add the blockquote to testing specs. The learnings explicitly state the blockquote belongs only in trait specs.
- Do not reproduce the full blockquote in `extension-points.md`. A forward-reference is sufficient.
- When comparing blockquotes, be careful with markdown rendering vs. source text. The comparison must be on the markdown source, not the rendered HTML (which may normalize whitespace).

## Testing Requirements

Not applicable -- this is a specification document audit, not executable code.

## Dependencies

- **Blocked By**: ticket-013 (all trait specs must be in final form -- completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High

## Decision Log

**extension-points.md forward-reference (Check 3)**: No forward-reference added. `extension-points.md` was evaluated at SS1 (Variant Architecture Overview) and SS7 (Dispatch Mechanism Analysis). The file discusses variant selection, enum dispatch vs. monomorphization trade-offs, and the variant pipeline — it does not discuss how Rust trait signatures relate to implementation, nor does it comment on the role of trait signatures as guidelines vs. contracts. The convention blockquote is relevant only where trait signatures are presented; `extension-points.md` presents no trait signatures. Adding a forward-reference would be out of place and would not aid any reader of that file. Decision: absence is justified.
