# Accumulated Learnings Through Epic 04 (Remaining Spec Content)

## Gap Inventory Update Patterns

- **Atomic batch update**: all gaps resolved in a single ticket targeting only `src/specs/overview/spec-gap-inventory.md`; never split by gap or severity
- **Three-location rule**: every gap resolution touches (1) section 3 description cell (`**Resolved.** ...`), (2) section 3 resolution path cell (spec file + section link), (3) section 7 resolution log row -- touching fewer than three is an inconsistency
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

- **New top-level section for multi-step derivations**: substantial derivations (6+ subsections) become a new `## N.` section -- see `src/specs/math/par-inflow-model.md` §7
- **Letter-suffix subsections for mid-section insertions**: inserting between two existing architecture subsections uses letter suffixes (`SS4.2b`) to avoid renumbering -- see `src/specs/architecture/training-loop.md` SS4.2b
- **Struct definition template**: prose summary → Rust code block with `///` doc comments → field descriptions table → memory layout paragraph → design note paragraph
- **Bidirectional cross-referencing is mandatory**: every shared type addition requires updating both the defining file and every consuming file with a cross-reference -- no one-way links
- **Parameter table format for configuration-reference.md**: columns are `| Option | Type | Default | Description |` for scalar parameters, or `| Option | Value | LP Effect | Reference |` for variant-selection parameters

## Design Note Blockquote Patterns

- **GAP-resolution design notes**: use `> **Design note (GAP-NNN).**` followed by a single paragraph explaining (1) what was chosen, (2) why the chosen approach was selected, (3) what alternatives were rejected, and (4) any boundary conditions -- see `src/specs/architecture/training-loop.md` SS2.1a design note for GAP-032
- **Minimal viable notes**: use `> **Minimal viable note.**` (or `> **Minimal viable note (Phase N).**`) for deferral patterns -- the note must state the target architecture, the minimal viable behavior, and a cross-reference to the trigger condition table; see `src/specs/hpc/hybrid-parallelism.md` SS1.3 and SS6
- **Trigger condition tables**: use T1/T2/T3 row labels with Condition and Measurement Method columns for deferred features that have concrete re-introduction criteria -- see `src/specs/hpc/communicator-trait.md` §4.7; conditions must be measurable (specific thresholds, specific tools)
- **Schema evolution notes**: use `> **Schema evolution note.**` to flag spec content that is a guideline subject to revision during implementation; cite the requirements that any revision must preserve -- see `src/specs/data-model/binary-formats.md` §3.5

## Section Prefix Rules (All Three Contexts)

- **Architecture specs**: `SS` prefix for section numbering and cross-links within architecture files; `§` only inside the verbatim convention blockquote (trait specs only)
- **HPC specs (`src/specs/hpc/`)**: plain numbered headings (`## 5.`, `### 5.4`) within the file; `§` when referencing sections in other HPC files from cross-reference text; HPC-to-HPC links use `§N.N` in link text
- **Math specs and overview specs**: plain numbered headings with no prefix; `§` appears only in cross-reference links from other files pointing into these files
- **Configuration specs (`src/specs/configuration/`)**: plain numbered headings; architecture-to-configuration links use `section N.N` prose, never `§N.N`
- **Data-model specs (`src/specs/data-model/`)**: plain numbered headings (`## 2.`, `### 2a`, `### 3.5`); `§` is never used in headings or internal cross-references; cross-references from architecture files to data-model sections write `[File](path) SectionName` in prose
- **Violation pattern caught in epic-04**: the ticket-011 implementation guide suggested `[Communicator Trait SS4.5](...)` for an HPC file; the correct form for an HPC-to-HPC cross-reference is `[Communicator Trait §4.7](./communicator-trait.md)` -- always apply the §-convention rule to implementation guide suggestions before following them literally

## §-Convention Cross-Reference Rule (Critical)

- **§ is exclusively for links into `src/specs/hpc/` files**: from any file, `§` is permitted only when linking to a section inside `src/specs/hpc/`
- **Architecture-to-architecture links must use `SSN` or plain prose**
- **Architecture-to-configuration links must use plain prose** (`section N.N`)
- **Architecture-to-data-model links use file name + section name in prose**: `[Penalty System](../data-model/penalty-system.md) Penalty Ordering Validation` -- the section title in prose, not a `§` or `SS` prefix
- **Baseline to verify**: `grep § src/specs/architecture/*.md` must return only occurrences inside convention blockquotes

## Warning vs. Error Distinction

- **WARNING severity**: use for validation checks that affect policy quality but not algorithmic correctness -- penalty ordering violations use WARNING because the LP remains feasible and the solution is valid; see `src/specs/data-model/penalty-system.md` Penalty Ordering Validation subsection
- **ERROR severity**: use for checks that break LP correctness or algorithmic guarantees -- the FPHA rule (`fpha_turbined_cost > spillage_cost`) is an ERROR because violating it produces interior FPHA solutions that compromise the LP objective
- **The distinction must be explicit in both the data-model spec and the validation table**: when a new validation check is added, it must appear in both the owning spec (e.g., `penalty-system.md`) and `validation-architecture.md` SS2.5, with consistent severity in both locations
- **Warning aggregation pattern**: when warnings can fire per-(entity, stage), aggregate to one warning per violated pair with a count and worst example to prevent log flooding -- document this aggregation behavior in the spec subsection

## Adjacent-Pair Validation Table Pattern

- **Five-column format for validation pair tables**: `| # | Higher Priority | Lower Priority | Comparison Scope | Severity |` -- see `src/specs/data-model/penalty-system.md` Penalty Ordering Validation table
- **Comparison scope must be explicit**: "Per hydro", "Per hydro vs. bus", "Per bus", "System-wide" -- different penalty types resolve at different entity scopes; the scope determines the validation unit
- **Post-resolution validation**: all ordering checks run on post-cascade-resolution values (after the three-tier cascade has been applied), not on raw input; state this explicitly in the validation subsection to prevent implementors from running checks at input-parse time

## Contiguous Block Assignment Cross-Reference Pattern

- **Do not duplicate formulas across files**: when a formula is fully specified in one file (e.g., Work Distribution SS3.1), downstream files reference it rather than restating it -- see `src/specs/architecture/training-loop.md` SS6.3 backward pass distribution paragraph
- **Both source and target of a reference must be explicit**: the backward pass distribution paragraph in SS6.3 references both the allgatherv exchange (SS5.4a) and the block assignment formula (Work Distribution SS3.1); missing either reference leaves the reader unable to verify the distribution without context
- **Architecture-to-HPC cross-references**: from `src/specs/architecture/` to `src/specs/hpc/`, both `[File SS3.1](path)` and `[File §3.1](path)` are acceptable in link text; use the `§` form as the default for HPC targets -- see `src/specs/architecture/training-loop.md` line 628

## Minimal Viable / Deferred Feature Documentation Pattern

- **Retain deferred spec content**: when a feature is deferred (e.g., `SharedMemoryProvider` bound on `train()`), the full spec content remains as the target architecture and must not be removed -- see `src/specs/hpc/communicator-trait.md` §4.7 preamble
- **Name the constraint that prevents early implementation**: the minimal viable note must state why the feature cannot be added now (e.g., shared memory lifecycle couples to unstable components) -- see `src/specs/hpc/communicator-trait.md` §4.7 "Constraint preventing early implementation" paragraph
- **Trigger conditions must be measurable**: each trigger condition must name a specific threshold, a specific measurement tool or file, and the action it unlocks -- generic triggers like "when memory is a concern" are insufficient; see `src/specs/hpc/communicator-trait.md` §4.7 trigger table (T1/T2/T3)
- **Two-file consistency for minimal viable notes**: when a simplification affects both the trait file and the usage file, both must carry the minimal viable note with a cross-reference to each other -- `communicator-trait.md` §4.7 and `hybrid-parallelism.md` SS1.3 and SS6 both carry notes linking back to `communicator-trait.md` §4.7

## Channel Architecture (std::sync::mpsc Decision)

- **`std::sync::mpsc` for synchronous training loop**: the training loop is synchronous (no tokio runtime); using `tokio::sync::broadcast` would introduce an async runtime dependency in `cobre-sddp` and `cobre-core` -- see `src/specs/architecture/training-loop.md` SS2.1a design note (GAP-032)
- **Single receiver, internal fan-out**: the `mpsc` channel has one receiver that fans out to multiple sinks (text logger, JSON-lines writer, TUI, Parquet writer); this is internal to the consumer, not a channel property; document this explicitly to prevent future implementors from introducing multiple channel subscriptions
- **Unbounded is acceptable for training loop events**: events are small (< 1 KB), emitted at most 7 times per iteration, so unbounded `mpsc::channel()` is correct; `sync_channel(N)` is a future option if memory becomes a concern
- **Deferred async interfaces may use different channels**: `cobre-python` and `cobre-mcp` may use `tokio::sync::broadcast` in their own event bridges; this does not contradict the `mpsc` decision in the core training loop

## FlatBuffers Requirements Documentation Pattern

- **Requirements before schema**: document access-pattern requirements (batch extraction, cache locality) in a dedicated subsection before the full schema, so that any schema revision has a compliance checklist -- see `src/specs/data-model/binary-formats.md` §3.5
- **L1 cache locality is per-cut, not per-pool**: state explicitly that the per-cut working set (16,640 bytes) fits in L1 and the full pool does not; conflating the two leads to incorrect performance assumptions -- see `src/specs/data-model/binary-formats.md` §3.5
- **Schema backward compatibility via field IDs**: document that FlatBuffers backward compatibility is maintained through field ID assignment (new fields get new IDs, deprecated fields are retained but ignored) -- this is the schema evolution contract; see `src/specs/data-model/binary-formats.md` §3.5 schema evolution note

## Threading Architecture (From Epic 02 -- Reinforced)

- **Rayon is the intra-rank threading model**: `src/specs/hpc/hybrid-parallelism.md` §2 documents the decision
- **OpenMP is deferred to post-profiling**: three named trigger conditions for revisiting
- **Encapsulation boundary**: Rayon is a `cobre-sddp` dependency only; no rayon types in public APIs

## Warm-Start Validation Contract (From Epic 02 -- Reinforced)

- **Four structural checks**: hydro count, max PAR order per hydro, production method per hydro, PAR model parameters per hydro -- all in `src/specs/architecture/input-loading-pipeline.md` SS7.1
- **Hard failure only**: all four checks produce `LoadError::PolicyIncompatible`
- **Validation runs on every rank**, not just rank-0

## Pitfalls for Future Content Epics

- **Planning briefs must not be committed to repo root**: `review.md` was accidentally committed during epic-01 and required a fix commit; planning inputs belong in the plan directory
- **Stale reference risk**: always read current spec state before recording in section 7 of the gap inventory; stale entries inherit wrong library names or old struct names
- **Content tickets must create sections at the exact path recorded in section 3 resolution path**: verify after each ticket that section 3 links resolve correctly in the built book
- **Cross-file consistency sweeps needed**: when renaming a type or changing a pattern, sweep ALL affected files; type renaming in `internal-structures.md` required updates in `scenario-generation.md` that would have been missed without a grep sweep
- **Implementation guide §-references may contain violations**: ticket-011 suggested `[Communicator Trait SS4.5]` for an HPC file; the correct form is `[Communicator Trait §4.7]` -- always apply the §-convention rule to suggested link text before copying it literally
- **Warning vs. error is a spec-level decision, not an implementation detail**: when a new validation check is designed, the severity (Warning vs. Error) must be determined by the spec author and recorded in both the owning spec and `validation-architecture.md`; the implementor must not choose the severity independently
