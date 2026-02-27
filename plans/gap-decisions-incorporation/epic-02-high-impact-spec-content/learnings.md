# Epic 02 Learnings: High-Impact Spec Content

## Patterns Established

- **New top-level section for transformation flows**: When a math spec needs a multi-step derivation (e.g., canonical-to-LP conversion), add it as a new top-level section (`## 7.`) with numbered subsections (`### 7.1`, `### 7.2`, ...) rather than inserting a subsection under an existing section. This was chosen in `src/specs/math/par-inflow-model.md` §7 (7.1 Canonical Form, 7.2 Coefficient Conversion, 7.3 LP-Ready Form, 7.4 Deterministic Base, 7.5 LP RHS Patching, 7.6 Summary) rather than expanding the existing §3 "LP coefficients" subsection.

- **Letter-suffix subsection numbering within architecture specs**: Mid-section insertions in architecture files use letter suffixes to avoid renumbering existing sections. `TrajectoryRecord` was added as `### 4.2b` (between the existing `4.2` and `4.2a`) in `src/specs/architecture/training-loop.md`. This convention is now established for this file and should be followed when adding further struct definitions between existing subsections.

- **Struct definition template in architecture specs**: The canonical struct definition pattern in `src/specs/architecture/training-loop.md` SS4.2b is: (1) prose paragraph explaining what the struct captures and where it is produced/consumed, (2) Rust code block with `///` doc comments naming the struct's purpose, (3) field list in the code block, (4) field descriptions table with `| field | type | description |` columns, (5) "Memory layout" paragraph, (6) "Dual-use design note" paragraph. The same pattern is established in `src/specs/data-model/internal-structures.md` for `PrecomputedParLp` (§14).

- **Bidirectional cross-referencing is mandatory for shared types**: Every ticket that added a struct used by two files required updating both files. `simulation-architecture.md` SS2 received a cross-reference to `TrajectoryRecord` in `training-loop.md` SS4.2b. `internal-structures.md` §14 received a cross-reference link to `par-inflow-model.md` §7. Failing to add the reverse link would leave one file's readers without the connection.

- **Rayon encapsulation boundary section**: When a threading library is scoped to a single crate, a dedicated subsection (`### 5.4 Encapsulation Boundary` in `src/specs/hpc/hybrid-parallelism.md`) documents the boundary explicitly: Rayon types (`ParallelIterator`, `ThreadPool`, `par_iter`) do not appear in public APIs; other crates use domain types only.

## Architectural Decisions

- **Rayon over OpenMP for intra-rank parallelism** (recorded in `src/specs/hpc/hybrid-parallelism.md` §2): Rayon was chosen because it is pure Rust (no C FFI, no `#pragma` wrappers), is the de facto Rust ecosystem standard, integrates with the borrow checker to statically prevent data races, and is sufficient for the embarrassingly parallel LP-solve workload. OpenMP was rejected as the active implementation choice (deferred to post-profiling) because it requires C FFI callback trampolines, `unsafe` reasoning for data safety, and a C compiler in the build graph. Alternative rejected: OpenMP via `extern "C"`. Rationale: SDDP's intra-rank workload is independent LP solves across scenario trajectories — exactly the work-stealing pattern rayon handles without FFI overhead.

- **`OMP_NUM_THREADS=1` is preserved for LP solver suppression, not Cobre's own parallelism** (in `src/specs/hpc/hybrid-parallelism.md` §4.3): The decision to keep `OMP_NUM_THREADS` in the configuration table was deliberate — it suppresses OpenMP threading inside the LP solver libraries (HiGHS, MKL), not inside Cobre. This distinction must be documented clearly to avoid future confusion between Cobre's rayon threads and the solver's internal OpenMP threads.

- **`TrajectoryRecord` as a superset struct** (in `src/specs/architecture/training-loop.md` SS4.2b): Training forward pass and simulation share one struct rather than defining two separate record types. Training uses only `state` and `stage_cost` (two fields); simulation additionally reads `primal` and `dual`. The alternative of two separate structs was rejected because it would duplicate field definitions and require a conversion step. The memory overhead is bounded by `M × T × (n_cols + n_rows) × 8` bytes, acceptable because `M` (forward scenarios per iteration) is typically 1–20.

- **Four-check warm-start validation with hard failure** (in `src/specs/architecture/input-loading-pipeline.md` SS7.1): The minimal set of compatibility checks is: hydro count, maximum PAR order per hydro, production method per hydro, PAR model parameters per hydro. Everything else (exchange limits, loads, inflows, block durations, penalty values, thermal costs, demand) is designated as a "safe modification" because those only affect LP RHS values, not cut coefficient dimensions. All four checks trigger `LoadError::PolicyIncompatible` (hard error); no partial loading or warnings. The alternative of a lenient hash-based check was rejected because structural mismatches produce silent numerical errors.

## Files and Structures Created

- `src/specs/math/par-inflow-model.md` §7 — New section: complete PAR-to-LP transformation (6 subsections: canonical form, coefficient conversion, LP-ready form, deterministic base, LP RHS patching, summary table). This is the canonical derivation path from stored PAR parameters to LP RHS values.

- `src/specs/data-model/internal-structures.md` §14 `PrecomputedParLp` struct — New struct definition: three fields (`psi: Vec<Vec<Vec<f64>>>` indexed [stage][hydro][lag], `deterministic_base: Vec<Vec<f64>>` indexed [stage][hydro], `sigma: Vec<Vec<f64>>` indexed [stage][hydro]). Caches LP-ready values for the hot-path multiply-add before RHS patching.

- `src/specs/architecture/training-loop.md` SS4.2b — New subsection: `TrajectoryRecord` struct definition with primal, dual, state, and stage_cost fields; contiguous `[scenario][stage]` memory layout; dual-use design note.

- `src/specs/architecture/input-loading-pipeline.md` SS7.1 — New subsection: warm-start compatibility validation (4-row table: hydro count, max PAR order, production method, PAR model parameters); safe modifications list; `LoadError::PolicyIncompatible` error behavior description; rationale paragraph on why dimensional mismatches are dangerous.

- `src/specs/hpc/hybrid-parallelism.md` §§1–8 rewrite — Full replacement of OpenMP with rayon across all sections; new §2 design rationale ("Why Rayon, OpenMP Deferred"); §3 MPI vs Rayon responsibility split; §4 rayon configuration (`RAYON_NUM_THREADS`, `ThreadPoolBuilder`); §5 rayon parallel patterns (5.4 encapsulation boundary); §6 rayon initialization sequence; §7 simplified build integration.

## Conventions Adopted

- **Math spec sections use plain numbers without prefix**: `par-inflow-model.md` lives in `src/specs/math/` and uses `## 7.`, `### 7.1` — no `§` or `SS` prefix. The `§` prefix applies to cross-references from other files pointing into this file (e.g., `[PAR Inflow Model §7]`), not to the headings within the file itself.

- **HPC spec sections use plain numbers internally, `§` only in cross-references to other HPC files**: `hybrid-parallelism.md` uses `## 5.`, `### 5.4` for its own headings, and uses `§` when referencing sections in other HPC files (e.g., `[Communicator Trait §1](./communicator-trait.md)`). This is the established HPC spec convention reinforced by the rayon rewrite.

- **`LoadError` variants go in SS8.1**: The canonical location for new `LoadError` enum variants is `src/specs/architecture/input-loading-pipeline.md` SS8.1. Ticket-004 added `PolicyIncompatible` there with a doc comment (`/// See SS7.1 for the four compatibility checks`) and an entry in the error examples table. Future tickets adding warm-start or loading error variants must target SS8.1 as the single source of truth.

- **Deferred features use "deferred to post-profiling" language**: The rayon-vs-OpenMP decision documents OpenMP as "deferred to post-profiling" with specific trigger conditions (NUMA migration, vendor-tuned scheduling, profiling tool requirements). This pattern — active choice + named escape hatch + explicit trigger conditions for revisiting — should be used whenever an architectural decision defers a stronger alternative.

## Surprises and Deviations

- **`§7` numbering vs ticket suggestion of `3.1` or new section after §3**: The ticket suggested adding the PAR-to-LP derivation as "section 3.1 or a new section 7". The implementation chose `## 7.` (a new top-level section) rather than a subsection of §3. This was the correct decision because the content is a multi-step derivation with 6 subsections, too substantial to be nested under the existing §3 "Stored vs. Computed" section. The result is at `src/specs/math/par-inflow-model.md` §7.

- **`SS4.2b` placement between two existing lettered subsections**: The ticket suggested `SS4.2b` or `SS5.6`. The implementation used `SS4.2b`, placed after the existing `SS4.2a` (Forward Pass Patch Sequence). This inserted the struct definition immediately after the step that uses it (step (e) of SS4.2), keeping specification and usage co-located.

- **`training-loop.md` SS4.3 references "OpenMP threads" in the forward pass threading section**: At the time of epic-02, `training-loop.md` SS4.3 still contained an "OpenMP threads" reference (thread-trajectory affinity paragraph). The rayon rewrite was confined to `hybrid-parallelism.md` per the ticket scope. This cross-file inconsistency is a candidate for a mechanical-fix epic. Observed in `src/specs/architecture/training-loop.md` SS4.3.

- **Warm-start validation runs on every rank, not just rank-0**: The ticket framed warm-start validation as a rank-0 concern (consistent with the rank-0-centric loading architecture). The actual implementation in SS7.1 specifies that validation runs on every rank because all ranks receive the metadata broadcast in SS7 step 1. This is a stronger consistency guarantee and correctly reflects that all ranks need to verify compatibility before proceeding.

## Recommendations for Future Epics

- **Sweep `training-loop.md` for "OpenMP" residue**: SS4.3 of `src/specs/architecture/training-loop.md` still reads "parallelized across OpenMP threads" after the rayon rewrite of `hybrid-parallelism.md`. Any epic touching training-loop.md or doing a consistency sweep should fix this occurrence.

- **PAR-to-LP derivation is the template for other transformation flows**: When documenting a numeric transformation pipeline (e.g., a preprocessing step that converts stored parameters into hot-path-ready caches), follow the 6-subsection structure established in `src/specs/math/par-inflow-model.md` §7: (1) canonical input form, (2) coefficient conversion, (3) output-ready form, (4) precomputed constants, (5) hot-path operation, (6) summary table.

- **`PrecomputedParLp` indexing convention**: The struct uses `[stage][hydro][lag]` indexing order for the `psi` field (shape `[T][H][p_max]`). When implementing, maintain this outer-to-inner-loop order for cache locality: iterate over stages in the outer loop, hydros in the middle, lags in the inner loop. Defined in `src/specs/data-model/internal-structures.md` §14.

- **Warm-start safe-modifications list is authoritative**: The list in `src/specs/architecture/input-loading-pipeline.md` SS7.1 (exchange limits, loads, inflows, block durations, penalty values, thermal costs, demand) is the canonical answer to "what can change between runs without invalidating loaded cuts." Future tickets that add new system parameters must classify them as structural (add to the validation checks) or value-only (add to the safe-modifications list).
