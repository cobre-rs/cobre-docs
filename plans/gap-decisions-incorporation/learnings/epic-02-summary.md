# Accumulated Learnings Through Epic 02 (High-Impact Spec Content)

## Gap Inventory Update Patterns

- **Atomic batch update**: all gaps in scope resolved in a single ticket targeting only `src/specs/overview/spec-gap-inventory.md`; never split by gap or severity
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
- **Read current spec state before recording**: stale entries inherit wrong library names (e.g., `rkyv` instead of `postcard`); always read section 3 resolution path first

## Spec Content Writing Patterns

- **New top-level section for multi-step derivations**: substantial derivations (6+ subsections) become a new `## N.` section, not a nested subsection of an existing one — see `src/specs/math/par-inflow-model.md` §7 (PAR-to-LP transformation)
- **Letter-suffix subsections for mid-section insertions**: inserting a struct definition between two existing architecture subsections uses letter suffixes (`SS4.2b` after `SS4.2a`) to avoid renumbering — see `src/specs/architecture/training-loop.md` SS4.2b
- **Struct definition template**: prose summary → Rust code block with `///` doc comments → field descriptions table → memory layout paragraph → design note paragraph
- **Bidirectional cross-referencing is mandatory**: every shared type addition requires updating both the defining file and every consuming file with a cross-reference — no one-way links

## Section Prefix Rules (All Three Contexts)

- **Architecture specs**: `SS` prefix for section numbering and cross-links within architecture files; `§` only inside the verbatim convention blockquote (trait specs only)
- **HPC specs (`src/specs/hpc/`)**: plain numbered headings (`## 5.`, `### 5.4`) within the file; `§` when referencing sections in other HPC files from cross-reference text
- **Math specs (`src/specs/math/`) and overview specs**: plain numbered headings with no prefix; `§` appears only in cross-reference links from other files pointing into these files
- **Violation pattern to watch**: applying `§` to architecture section links, or writing `SS1` instead of `§1` for the HPC link inside the convention blockquote

## Threading Architecture (Rayon Decision)

- **Rayon is the intra-rank threading model**: `src/specs/hpc/hybrid-parallelism.md` §2 documents the decision — pure Rust, no FFI, borrow-checker safety, sufficient for embarrassingly parallel LP solves
- **OpenMP is deferred to post-profiling**: three named trigger conditions for revisiting (NUMA migration, vendor-tuned scheduling, profiling tool requirements)
- **Encapsulation boundary**: Rayon is a `cobre-sddp` dependency only; no rayon types in public APIs — `src/specs/hpc/hybrid-parallelism.md` §5.4
- **`OMP_NUM_THREADS=1` is LP solver suppression, not Cobre suppression**: preserve this env var in configuration tables; it prevents LP solver-internal OpenMP threads, not Cobre's rayon threads

## Warm-Start Validation Contract

- **Four structural checks**: hydro count, max PAR order per hydro, production method per hydro, PAR model parameters per hydro — all in `src/specs/architecture/input-loading-pipeline.md` SS7.1
- **Safe-modifications list is authoritative**: exchange limits, loads, inflows, block durations, penalty values, thermal costs, demand may change freely
- **Hard failure only**: all four checks produce `LoadError::PolicyIncompatible`; no warnings, no partial loading
- **Validation runs on every rank** (not just rank-0): all ranks receive the metadata broadcast before cut deserialization begins

## `LoadError` Enum Location

- **Canonical location**: `src/specs/architecture/input-loading-pipeline.md` SS8.1 is the single location for all `LoadError` variants; new variants go there with a doc comment referencing the section that specifies the check

## Pitfalls for Future Content Epics

- **Planning briefs must not be committed to repo root**: `review.md` was accidentally committed and required a fix commit; planning inputs belong in the plan directory
- **Stale reference risk**: resolution log initially inherited wrong library names; always read current spec state before recording
- **Content tickets must create sections at the exact path recorded in section 3 resolution path**: verify after each content ticket that section 3 links resolve correctly
- **Cross-file consistency sweeps needed**: the rayon rewrite of `hybrid-parallelism.md` did not update `training-loop.md` SS4.3, which still references "OpenMP threads"; mechanical-fix epics must sweep all affected files
