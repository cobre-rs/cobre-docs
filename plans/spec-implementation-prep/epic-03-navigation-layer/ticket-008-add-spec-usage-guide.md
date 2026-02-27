# ticket-008 Add "How to Use This Specification" Guide

## Context

### Background

The Cobre specification corpus is 84 markdown files defining behavioral contracts, type-level invariants, and algorithmic requirements for an HPC SDDP solver. A developer arriving at this repository can navigate the individual specs but has no document that explains the abstraction boundary: what the corpus provides (behavioral contracts -- the WHAT) versus what implementation planning provides (crate scaffolding, build sequences, test scaffolding -- the HOW).

Without this guide, developers risk two failure modes: (1) expecting the specs to contain implementation instructions (they do not), or (2) treating the specs as optional reading and missing the behavioral contracts that define correctness.

**File location decision: new file `src/specs/overview/spec-usage-guide.md`.**

Rationale: `implementation-ordering.md` is 232+ lines and focused on the build sequence. A usage guide is conceptually distinct -- it answers "what is this corpus and how do I use it" rather than "in what order do I build the crates". Creating a separate file keeps each document single-purpose and avoids making `implementation-ordering.md` excessively long. The new file will be added to `SUMMARY.md` under the Specifications > Overview section, and `implementation-ordering.md` will gain a one-line cross-reference to it in the Cross-References section (section 8) and a forward reference in the MVRL closing paragraph (section 9, added by ticket-007).

### Relation to Epic

This is the third and final ticket in Epic 03 (Navigation Layer). It depends on ticket-007 (MVRL) because the guide references the MVRL by section number as the recommended starting point. Together, the three tickets transform `implementation-ordering.md` and the new usage guide into a complete onboarding path: usage guide (what is this) -> MVRL (what to read first) -> per-phase reading lists (what to read for each crate).

### Current State

- No spec usage guide exists in the corpus.
- `src/SUMMARY.md` lists the overview section at lines 60-66 with entries for design-principles, ecosystem-guidelines, notation-conventions, production-scale-reference, implementation-ordering, and spec-gap-inventory.
- `src/specs/overview/` currently contains 6 files: `design-principles.md`, `ecosystem-guidelines.md`, `implementation-ordering.md`, `notation-conventions.md`, `production-scale-reference.md`, `spec-gap-inventory.md`.

## Specification

### Requirements

Create a new file `src/specs/overview/spec-usage-guide.md` and register it in `src/SUMMARY.md`. The file has the following structure (using plain numbered headings per overview file convention):

**Title**: `# How to Use This Specification`

**Section 1: What This Corpus Is**

A 2-3 paragraph section explaining:

- Cobre-docs is a behavioral contract corpus for the Cobre SDDP solver ecosystem.
- Specs define what the system must guarantee: trait contracts, data layouts, dispatch patterns, configuration contracts, algorithmic invariants, test obligations, and cross-cutting rationale.
- The spec corpus operates at the level of behavioral contracts and type-level invariants. When a spec says `fn solve(...) -> Result<Solution, SolverError>`, it defines what any correct implementation must satisfy, not a specific implementation to reproduce.

**Section 2: What You Will Find**

A bulleted list of content categories present in the specs:

- Rust trait definitions expressing behavioral contracts (not implementation mandates -- see the convention blockquote in trait specs)
- Data model definitions: entity schemas, internal structures, LP variable layouts
- Mathematical formulations: SDDP algorithm, LP structure, cut management, risk measures
- Dispatch pattern decisions: enum dispatch vs. compile-time monomorphization
- Configuration contracts: schema definitions, validation rules
- HPC architecture: MPI communication, parallelism model, memory layout
- Test obligations: conformance test suites for every trait

**Section 3: What You Will Not Find**

A bulleted list of content categories absent from the specs (these belong in implementation tickets):

- Crate scaffolding (`cargo init`, `Cargo.toml` contents, module structure)
- CI configuration (GitHub Actions, Docker images, build scripts)
- Step-by-step "create file X, write function Y" instructions
- IDE setup, toolchain installation, dependency pinning
- Performance benchmarks (specs define contracts; benchmarks verify implementations)

**Section 4: The Abstraction Boundary**

A 2-3 paragraph section with a concrete worked example showing how spec content maps to implementation work. The example uses `SolverInterface`:

> _Spec content (from `solver-interface-trait.md`)_: The trait defines `fn solve(...)` with preconditions (LP must be loaded), postconditions (split Ok/Err tables), warm-start protocol, dual normalization guarantee, and retry encapsulation. The testing spec defines the conformance test suite.
>
> _Implementation ticket (derived from the spec)_: "Implement the HiGHS adapter in `cobre-solver`. Wrap the HiGHS C FFI via `highs-sys`. Map HiGHS status codes to `SolverError` variants. Implement warm-start via `Highs_setBasis`. Implement dual sign normalization per SS7. Write the conformance test suite from `solver-interface-testing.md`. Benchmark happy-path and error-path latency."
>
> The spec is the acceptance criterion. The implementation ticket is the path to satisfying it.

**Section 5: Where Implementation Planning Begins**

A 1-2 paragraph section directing the reader to:

- The Minimum Viable Reading List (section 9 of `implementation-ordering.md`) as the recommended starting point.
- The per-phase reading lists (section 5 of `implementation-ordering.md`) for phase-specific deep dives.
- The statement that after reading the MVRL, a developer has enough context to draft Phase 1 implementation tickets. Cobre-docs is the reference they will consult during implementation, not the work breakdown structure itself.

**Section 6: Cross-References**

A short cross-references section linking to:

- `implementation-ordering.md` (build sequence, MVRL, per-phase reading lists)
- `ecosystem-guidelines.md` (authoring conventions, invariant checklist)
- `cross-reference-index.md` (per-crate reading lists, dependency ordering)
- `design-principles.md` (format selection criteria, agent-readability rules)

Additionally:

- Add a line to `src/SUMMARY.md` under the Overview section, after "Ecosystem Guidelines" and before "Notation Conventions": `  - [How to Use This Specification](./specs/overview/spec-usage-guide.md)`
- Add a cross-reference entry to `implementation-ordering.md` section 8 (Cross-References table): `| [How to Use This Specification](./spec-usage-guide.md) | Abstraction boundary between specs and implementation; worked example |`
- Update the MVRL closing paragraph (section 9, added by ticket-007) to reference the usage guide.

### Inputs/Props

- The MVRL section from ticket-007 (referenced by section number)
- The existing overview files for cross-referencing
- The convention blockquote from `ecosystem-guidelines.md` (referenced but not reproduced -- this is not a trait spec)

### Outputs/Behavior

Three files are modified or created:

1. **New file**: `src/specs/overview/spec-usage-guide.md` (approximately 80-100 lines)
2. **Modified**: `src/SUMMARY.md` (one line added)
3. **Modified**: `src/specs/overview/implementation-ordering.md` (one row added to Cross-References table in section 8, one sentence updated in MVRL closing paragraph in section 9)

### Error Handling

Not applicable (documentation-only change).

### Out of Scope

- The convention blockquote is not reproduced in this file (it is not a trait spec). The guide references it by description only.
- The cross-reference index (`cross-reference-index.md`) is not updated in this ticket. Cross-reference index updates are batched per the methodology in `ecosystem-guidelines.md` section 7.3.
- No changes to `ecosystem-guidelines.md` (it already references `implementation-ordering.md`; the usage guide is a new file that does not require ecosystem-guidelines updates).

## Acceptance Criteria

- [ ] Given the repository, when `test -f src/specs/overview/spec-usage-guide.md && echo "exists"` is run, then the output is `exists` (file was created).
- [ ] Given the new file, when `grep -c "# How to Use This Specification" src/specs/overview/spec-usage-guide.md` is run, then the output is `1` (correct title).
- [ ] Given the new file, when `grep -c "## 1\." src/specs/overview/spec-usage-guide.md` is run, then the output is `1` (section 1 uses plain numbered heading).
- [ ] Given the new file, when `grep -c "## 2\." src/specs/overview/spec-usage-guide.md` is run, then the output is `1` (section 2 exists).
- [ ] Given the new file, when `grep -c "## 3\." src/specs/overview/spec-usage-guide.md` is run, then the output is `1` (section 3 exists).
- [ ] Given the new file, when `grep -c "## 4\." src/specs/overview/spec-usage-guide.md` is run, then the output is `1` (section 4 with worked example exists).
- [ ] Given the new file, when `grep -c "## 5\." src/specs/overview/spec-usage-guide.md` is run, then the output is `1` (section 5 exists).
- [ ] Given the new file, when `grep -c "solver-interface-trait" src/specs/overview/spec-usage-guide.md` is run, then the output is at least `1` (worked example references the SolverInterface spec).
- [ ] Given the new file, when `grep "§\|SS" src/specs/overview/spec-usage-guide.md` is run, then there are zero matches (overview file convention: no SS or section-sign prefixes).
- [ ] Given the updated `src/SUMMARY.md`, when `grep -c "spec-usage-guide" src/SUMMARY.md` is run, then the output is `1` (SUMMARY.md registers the new file).
- [ ] Given the updated `src/specs/overview/implementation-ordering.md`, when `grep -c "spec-usage-guide" src/specs/overview/implementation-ordering.md` is run, then the output is at least `1` (cross-reference added).
- [ ] Given all changes, when `mdbook build` is run from the repo root, then the build succeeds with exit code 0.

## Implementation Guide

### Suggested Approach

1. Create `src/specs/overview/spec-usage-guide.md` with the structure defined in the Requirements section.
2. Write each section following the overview file convention: plain numbered headings (`## 1.`, `## 2.`, etc.), no `SS` or `§` prefixes.
3. For the worked example in section 4, use a blockquote format to visually separate the spec content from the implementation ticket content.
4. Add the SUMMARY.md entry. The insertion point is after the "Ecosystem Guidelines" line and before "Notation Conventions":
   ```
     - [Ecosystem Guidelines](./specs/overview/ecosystem-guidelines.md)
     - [How to Use This Specification](./specs/overview/spec-usage-guide.md)
     - [Notation Conventions](./specs/overview/notation-conventions.md)
   ```
5. Add the cross-reference row to `implementation-ordering.md` section 8.
6. Update the MVRL closing paragraph in `implementation-ordering.md` section 9 to include a link to the usage guide.
7. Run `mdbook build` to verify no broken links and correct sidebar rendering.

### Key Files to Modify

- `src/specs/overview/spec-usage-guide.md` -- new file (created)
- `src/SUMMARY.md` -- one line added
- `src/specs/overview/implementation-ordering.md` -- one table row added to section 8, one sentence updated in section 9

### Patterns to Follow

- Overview file convention: plain numbered headings (`## 1.`, `## 2.`), no `SS` or `§`.
- Cross-reference format in `implementation-ordering.md` section 8: `| [Title](./relative-path.md) | Description |`
- SUMMARY.md indentation: two spaces per nesting level, consistent with existing entries.
- The worked example follows the pattern established in `ecosystem-guidelines.md` section 4 (concrete illustrations of abstract principles).

### Pitfalls to Avoid

- Do not reproduce the convention blockquote in this file. The convention blockquote belongs only in trait specs. Reference it by description instead.
- Do not use `§` or `SS` prefixes anywhere in this file.
- Do not include implementation instructions in the guide (that would contradict the guide's own message about abstraction boundaries).
- Do not add the file to the cross-reference index in this ticket. Cross-reference index updates are batched, and adding a single file would violate the batch-update methodology from `ecosystem-guidelines.md` section 7.3.
- Verify the SUMMARY.md indentation matches the existing entries exactly (two spaces). Incorrect indentation breaks mdBook sidebar rendering.

## Testing Requirements

### Unit Tests

Not applicable (documentation-only).

### Integration Tests

- Run `mdbook build` from the repo root and confirm exit code 0.
- Verify the new page appears in the mdBook sidebar under Specifications > Overview.
- Run all grep checks from the acceptance criteria.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-007-add-minimum-viable-reading-list.md (the MVRL must exist before this guide can reference it by section number)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
