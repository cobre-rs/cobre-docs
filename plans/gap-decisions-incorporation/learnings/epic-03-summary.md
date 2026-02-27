# Accumulated Learnings Through Epic 03 (Configuration and Data Model Updates)

## Gap Inventory Update Patterns

- **Atomic batch update**: all gaps resolved in a single ticket targeting only `src/specs/overview/spec-gap-inventory.md`; never split by gap or severity
- **Three-location rule**: every gap resolution touches (1) section 3 description cell (`**Resolved.** ...`), (2) section 3 resolution path cell (spec file + section link), (3) section 7 resolution log row — touching fewer than three is an inconsistency
- **Forward references permitted in resolution path**: when spec content does not yet exist, section 3 records where it will be added; content-writing epics must create the exact section referenced
- **Section 7 entries append in decision order, not GAP-ID order**: do not sort by GAP-NNN; new rows go at the bottom

## Section 6 Arithmetic Conventions

- **Total gaps invariant**: sum of all severity counts must equal 39; verify before committing
- **Split-row convention**: when a severity transitions from all-unresolved to all-resolved, replace a single row with two rows `(unresolved) | 0` and `(resolved) | N`
- **Severity note completeness**: the `**By severity (...):**` annotation must enumerate every resolved GAP-ID; missing an ID is an inconsistency
- **Per-crate table counts incidences, not gaps**: a gap affecting two crates appears in two rows; column totals exceed 39

## Section 7 Resolution Log Format

- **Five-column format**: `| GAP-NNN | YYYY-MM-DD | plan-name / epic-NN | ticket-NNN | <summary> |`
- **Summary length**: summaries include the spec file Markdown link, section reference, and enough detail to audit without opening the spec
- **Read current spec state before recording**: stale entries inherit wrong library names; always read section 3 resolution path first

## Spec Content Writing Patterns

- **New top-level section for multi-step derivations**: substantial derivations (6+ subsections) become a new `## N.` section — see `src/specs/math/par-inflow-model.md` §7
- **Letter-suffix subsections for mid-section insertions**: inserting between two existing architecture subsections uses letter suffixes (`SS4.2b`) to avoid renumbering — see `src/specs/architecture/training-loop.md` SS4.2b
- **Struct definition template**: prose summary → Rust code block with `///` doc comments → field descriptions table → memory layout paragraph → design note paragraph
- **Bidirectional cross-referencing is mandatory**: every shared type addition requires updating both the defining file and every consuming file with a cross-reference — no one-way links
- **Parameter table format for configuration-reference.md**: columns are `| Option | Type | Default | Description |` for scalar parameters, or `| Option | Value | LP Effect | Reference |` for variant-selection parameters — see `src/specs/configuration/configuration-reference.md` sections 3.2, 3.3, and 3.5

## Section Prefix Rules (All Three Contexts)

- **Architecture specs**: `SS` prefix for section numbering and cross-links within architecture files; `§` only inside the verbatim convention blockquote (trait specs only)
- **HPC specs (`src/specs/hpc/`)**: plain numbered headings (`## 5.`, `### 5.4`) within the file; `§` when referencing sections in other HPC files from cross-reference text
- **Math specs (`src/specs/math/`) and overview specs**: plain numbered headings with no prefix; `§` appears only in cross-reference links from other files pointing into these files
- **Configuration specs (`src/specs/configuration/`)**: plain numbered headings (`## 3.`, `### 3.5`) — the `§` prefix is never used in headings or prose here; cross-links from architecture files to configuration sections write "section N.N" in prose, not `§N.N`
- **Violation pattern caught in epic-03**: the implementation guide for ticket-006 suggested `[Configuration Reference §3.5](...)` in `solver-interface-trait.md` SS6; the guardian rejected this because `configuration-reference.md` is not an HPC file; the fix writes `[Configuration Reference section 3.5](...)` — see `src/specs/architecture/solver-interface-trait.md` line 702

## §-Convention Cross-Reference Rule (Critical)

- **§ is exclusively for links into `src/specs/hpc/` files**: from any file, `§` is permitted only when linking to a section inside `src/specs/hpc/`
- **Architecture-to-architecture links must use `SSN` or plain prose**: when linking from one architecture spec to a section in another architecture spec, write `SS5` or `section 5`, never `§5`
- **Architecture-to-configuration links must use plain prose**: when linking from `src/specs/architecture/` to `src/specs/configuration/`, write `section N.N` in prose, never `§N.N`
- **Architecture-to-math links use `§N` from architecture files**: the math file sections are referenced as `§` in cross-reference text pointing into them from architecture files (e.g., `[Cut Management §7](../math/cut-management.md)`) — but this is the target file's convention, not a prefix used internally in architecture files
- **Baseline to verify**: `grep § src/specs/architecture/*.md` must return only occurrences inside convention blockquotes; any result outside a blockquote is a violation

## Precondition Blockquote Pattern

- **Opening marker**: `> **Precondition:**` — verbatim, matching the style in `src/specs/architecture/solver-interface-trait.md` method preconditions
- **Required content**: the invariant statement, the specific consequence if violated, and a cross-reference to the deferred feature or constraining spec section — see `src/specs/architecture/cut-management-impl.md` SS1.3 for the canonical example
- **Placement**: immediately after the formula or table whose correctness depends on the precondition; do not bury the precondition in a footnote or design note paragraph
- **Cross-file duplication is acceptable**: when two specs contain the same formula (e.g., `solver-abstraction.md` SS5 and `cut-management-impl.md` SS1.3), both get the precondition note; the secondary note is briefer and refers to the primary for rationale — see `src/specs/architecture/solver-abstraction.md` line 422

## Deferred Feature Entry Pattern

- **File**: `src/specs/deferred.md`
- **Heading format**: `## C.N FeatureName` — the file uses lettered subsections; the next available number must be checked before writing (C.18 was pipelined backward pass, C.19 is dynamic forward-passes scheduler)
- **Cross-reference format from architecture files**: use `[Deferred Features SSC.N](../deferred.md)` — note the `SSC` prefix in the link text, even though the heading in `deferred.md` itself uses `## C.N` without `SS`; this is an established inconsistency in the spec corpus, not a typo
- **Required fields**: `**Status**: DEFERRED`, `**Description**`, `**Why Deferred**` (citing the constraining spec section by full path and section number)
- **Deferred entry must cite the primary constraint**: the rationale must name the spec section that creates the deferral (e.g., `src/specs/architecture/cut-management-impl.md` SS1.3 for the forward-passes scheduler)

## External Contract Preservation Rule

- **JSON field names are external contract**: changing Rust struct/enum names in `src/specs/data-model/internal-structures.md` does NOT require changing the JSON field names documented in `stages.json` schema, `input-scenarios.md`, or `input-directory-structure.md`
- **The input loading pipeline maps external names to internal names**: `num_scenarios` (JSON) maps to `branching_factor` (Rust); `sampling_method` (JSON) maps to `noise_method` (Rust); the mapping is implicit in the loader contract
- **Files that document the JSON schema must not change field names**: `src/specs/data-model/input-scenarios.md` and `src/specs/data-model/input-directory-structure.md` keep `num_scenarios` and `sampling_method` as external JSON keys; only the Rust struct definitions in `internal-structures.md` sections 12.1, 12.5, 12.6 changed
- **MCP server tool schemas are separate external contracts**: `src/specs/interfaces/mcp-server.md` references `num_scenarios` in a simulation context — this is NOT the Stage struct field and must not be updated when renaming internal types

## Two-Concept Clarity: NoiseMethod vs SamplingScheme

- **`NoiseMethod` (formerly `SamplingMethod`)**: controls the algorithm for generating noise vectors in the opening tree — SAA, LHS, QMC-Sobol, QMC-Halton, Selective; defined in `src/specs/data-model/internal-structures.md` section 12.1
- **`SamplingScheme`**: controls which noise source the forward pass uses — `in_sample`, `external`, `historical`; defined in `src/specs/architecture/scenario-generation.md` SS3
- **These are orthogonal**: a stage can use `in_sample` sampling scheme with `lhs` noise method, or `external` scheme with `saa` noise method; conflating them is a conceptual error that confuses spec readers
- **The doc comment in `NoiseMethod` must call out this distinction**: see `src/specs/data-model/internal-structures.md` section 12.1 for the canonical doc comment wording

## Configuration Parameter Addition Pattern

- **New parameters are subsections under their owning section**: adding solver retry config creates `### 3.5 Solver Retry Configuration` under section 3 (Training Options) — do not add floating parameter tables outside the section hierarchy
- **Mandatory fields use explicit table cell text**: write `**mandatory** (no default)` in the Default column, not `—` or blank — see `src/specs/configuration/configuration-reference.md` section 3.2
- **Mandatory fields require a follow-on sentence**: add a sentence after the table explaining why the field has no default and what happens if it is absent; cite the spec section that formalizes the consequence — see `src/specs/configuration/configuration-reference.md` section 3.2 citing `cut-management-impl.md` SS1.3
- **Encapsulation notes belong in the owning spec, not only in the config reference**: when a config parameter controls a boundary (e.g., retry is user-configurable but the escalation strategy is not), add a note in the architecture spec (SS6 in `solver-interface-trait.md`) that points back to the configuration reference

## Quality Scoring Artifact: Sequential Execution Scope Inflation

- **Scope score can be artificially penalized by sequential execution without intermediate commits**: when ticket-006 and ticket-007 are executed sequentially without committing between them, the diff for ticket-007 includes all the uncommitted files from ticket-006, inflating `extra_files` and producing a 0.5 scope score even though no actual scope violation occurred
- **This is a git artifact, not a real violation**: the guardian correctly identifies files outside the ticket's declared scope, but the root cause is staging rather than scope creep
- **Mitigation**: commit after each ticket before running the next one in the same session; or note the git artifact in the quality score review rather than treating it as a defect

## Threading Architecture (From Epic 02 — Reinforced)

- **Rayon is the intra-rank threading model**: `src/specs/hpc/hybrid-parallelism.md` §2 documents the decision — pure Rust, no FFI, borrow-checker safety, sufficient for embarrassingly parallel LP solves
- **OpenMP is deferred to post-profiling**: three named trigger conditions for revisiting
- **Encapsulation boundary**: Rayon is a `cobre-sddp` dependency only; no rayon types in public APIs

## Warm-Start Validation Contract (From Epic 02 — Reinforced)

- **Four structural checks**: hydro count, max PAR order per hydro, production method per hydro, PAR model parameters per hydro — all in `src/specs/architecture/input-loading-pipeline.md` SS7.1
- **Hard failure only**: all four checks produce `LoadError::PolicyIncompatible`
- **Validation runs on every rank**, not just rank-0

## Pitfalls for Future Content Epics

- **Planning briefs must not be committed to repo root**: `review.md` was accidentally committed during epic-01 and required a fix commit; planning inputs belong in the plan directory
- **Stale reference risk**: always read current spec state before recording in section 7 of the gap inventory; stale entries inherit wrong library names or old struct names
- **Content tickets must create sections at the exact path recorded in section 3 resolution path**: verify after each ticket that section 3 links resolve correctly in the built book
- **Cross-file consistency sweeps needed**: when renaming a type in `internal-structures.md`, sweep ALL files in `src/specs/architecture/`, `src/specs/data-model/`, and `src/specs/configuration/` that reference the old name; ticket-007 required updates in `scenario-generation.md` SS2.3 and SS5 that would have been missed without a grep sweep
- **Implementation guide §-references may themselves contain violations**: the ticket-006 implementation guide suggested `[Configuration Reference §3.5](...)` in the suggested approach; the correct form is `[Configuration Reference section 3.5](...)` — always apply the §-convention rule to implementation guide suggestions before following them literally
