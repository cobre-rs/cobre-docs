# Cobre Docs — Development Guidelines

This file is loaded automatically by Claude Code when working in this repository.
It captures durable conventions extracted from the spec-readiness plan learnings
(Epics 01–05). All patterns here apply to every future spec authoring or update task.

---

## Project Overview

This is an **mdBook project** (`book.toml`, `src = "src"`) containing the specification
corpus for the Cobre ecosystem — an HPC SDDP solver written in Rust. The book builds
with `mdbook build` from the repo root. Spec source files live exclusively under
`src/specs/`. This file (`CLAUDE.md`) is outside `src/` and is never processed by
mdBook.

### Key Directories

- `src/specs/architecture/` — Trait specs and testing specs for architectural boundaries
- `src/specs/hpc/` — HPC layer specs (MPI communicator, parallelism, backend testing)
- `src/specs/overview/` — Planning and overview specs (implementation ordering, gap inventory)
- `src/specs/data-model/` — Data format and schema specs
- `src/specs/interfaces/` — Python bindings and interface specs
- `src/crates/` — Per-crate overview files (track section counts and key contracts)
- `src/specs/cross-reference-index.md` — Canonical index of all specs (5 sections)
- `plans/spec-readiness/learnings/` — Accumulated plan learnings (primary reference)

---

## Structural Patterns: Trait Specs

Every **trait spec** (files like `*-trait.md` in `src/specs/architecture/`) must follow
this exact opening structure:

1. **Purpose paragraph** — describes what the trait does and why it exists
2. **Convention blockquote** — verbatim from `src/specs/hpc/communicator-trait.md`; paraphrasing is not permitted
3. **SS1 Trait Definition** — the first numbered section

The convention blockquote text is:

> **Convention: Rust traits as specification guidelines.** The Rust trait definitions,
> method signatures, and struct declarations throughout this specification corpus serve
> as _guidelines for implementation_, not as absolute source-of-truth contracts that
> must be reproduced verbatim. Their purpose is twofold: (1) to express behavioral
> contracts, preconditions, postconditions, and type-level invariants more precisely
> than prose alone, and (2) to anchor conformance test suites that verify backend
> interchangeability (see [Backend Testing §1](../hpc/backend-testing.md)).
> Implementation may diverge in naming, parameter ordering, error representation, or
> internal organization when practical considerations demand it -- provided the
> behavioral contracts and conformance tests continue to pass. When a trait signature
> and a prose description conflict, the prose description (which captures the domain
> intent) takes precedence; the conflict should be resolved by updating the trait
> signature. This convention applies to all trait-bearing specification documents in
> `src/specs/`.

- The blockquote contains exactly **one** `§` reference: `[Backend Testing §1](../hpc/backend-testing.md)`. This is the only permitted `§` in any architecture spec prose.
- In HPC files the path is `./backend-testing.md`; in architecture files it is `../hpc/backend-testing.md`. Both are correct in their respective contexts.
- The convention blockquote belongs **only** in trait specs, never in testing specs.

### Section Prefix Rules

- All architecture-to-architecture cross-links use the **`SS` prefix** (e.g., `SS4`, `SS7`).
- The **`§` prefix** is reserved exclusively for links to `src/specs/hpc/` files.
- Violation to watch for: applying `§` to architecture section links (epic-03 source of rejection), or writing `SS1` instead of `§1` for the HPC link inside the convention blockquote (epic-04 inline defect).
- Verification method: textual diff against the canonical blockquote from `communicator-trait.md`, allowing only the path difference.

### Dispatch Mechanism Section

Every trait spec's dispatch mechanism section must document all three of:

1. Why the rejected alternatives (e.g., `Box<dyn Trait>`, compile-time monomorphization) were not chosen
2. The performance characteristics of the chosen approach
3. Which architectural property drives the choice

### Infallibility Claims

Any claim that a method is infallible must cite the **specific upstream section** (a
validation rule, config load step, or precondition spec section) that provides the
guarantee.

### Cross-References Section

- Minimum **10–14 entries** per trait spec.
- Each entry must include: the file, the specific sections within it, and a one-line description.
- Format: `[File](./link.md) -- description (section list)`
- Do not substitute bare hyperlinks in prose for the Cross-References section.

---

## Structural Patterns: Testing Specs

Every **testing spec** (files like `*-testing.md` in `src/specs/architecture/`) must follow these patterns:

- **Shared fixture** declared once at the top of SS1, before any test tables; individual test rows reference it as a delta.
- **"Test naming convention:" paragraph** before the first table in each section.
- **Naming pattern**: `test_{trait}_{variant}_{method}_{scenario}` (all lowercase, snake_case).
  - `{variant}` is the backend name for solver tests (`highs`, `clp`).
  - Cross-solver equivalence tests use `test_solver_cross_...`.
- **Error path tests** occupy a **dedicated section** (SS3), separate from success-path conformance tests.
- **LP lifecycle tests** go in a standalone section when methods must be called in sequence.
- **Cross-solver equivalence tests**: dedicated section with explicit tolerances table:
  - Objective: 1e-8 relative
  - Primal: 1e-8 absolute
  - Dual: 1e-6 absolute
  - Warm-start iteration ratio: 2x
- **Finite-difference sensitivity check**: the strongest dual verification; use whenever a dual or gradient is a first-class postcondition.
- Minimum test counts are **floors**, not targets; algorithm-heavy and multi-backend traits exceed them naturally.
- The convention blockquote is **absent** from testing specs.

---

## Structural Patterns: Overview and Planning Specs

Files in `src/specs/overview/` (e.g., `implementation-ordering.md`, `spec-gap-inventory.md`):

- Use **plain numbered sections** (`## 1.`, `## 2.`); never `SS` or `§` regardless of section count.
- Cross-cutting documents (no single owning crate) use **`(cross-cutting)`** as the Primary Crate in the cross-reference index mapping table.
- Implementation ordering documents express each phase as a sub-section with a **two-column attribute table**: Crates, What becomes testable, Blocked by, Spec reading list.
- An **ASCII preformatted DAG** complements per-phase Blocked-by entries for at-a-glance comprehension.
- Gap inventories use a **seven-column table**: ID, Severity, Affected Crate(s), Spec File(s), Sections, Description, Resolution Path.
- Gap summary statistics must be **computed from the detailed table** and verified to match before any guardian pass.

---

## Dispatch Architecture

The canonical reference for choosing between enum dispatch and compile-time monomorphization is `src/specs/architecture/solver-interface-trait.md` SS5.

The four dispatch patterns in the Cobre architecture:

| Pattern                                                  | Mechanism                                               | Examples                                                |
| -------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Single active variant, global scope                      | Flat enum, `match` at call sites                        | `CutSelectionStrategy`, `HorizonMode`, `SamplingScheme` |
| Single active variant, per-stage scope                   | Flat enum, `match` at call sites                        | `RiskMeasure`                                           |
| Multiple active variants evaluated simultaneously        | `Vec<EnumVariant>` + composition struct with mode field | `StoppingRuleSet`                                       |
| Single active variant, fixed at build time, wrapping FFI | Rust `trait` with compile-time monomorphization         | `SolverInterface`                                       |

- `Box<dyn Trait>` is **rejected** in all current trait specs; closed variant sets always prefer enum dispatch.
- Compile-time monomorphization is reserved for traits that wrap FFI and fix exactly one backend per binary.

---

## Invariants and Contracts

- **Pure query methods** (`should_run`, `select`, `evaluate`): never return `Result`; cite the upstream validation section that guarantees valid inputs.
- **FFI-wrapping methods** (`solve`, `solve_with_basis`): return `Result`; provide **split Ok/Err postcondition tables**.
- **Err recovery contract**: when a method returns `Err`, the **caller** is responsible for calling `reset()` before reusing the instance; document this in the `Err` postcondition table.
- **Retry and normalization encapsulation**: retry logic and sign-convention normalization are hidden inside implementations; the trait method returns only the final result. A dedicated section (e.g., SS6 for retry, SS7 for dual normalization) documents the hidden behavior.
- **Dual normalization**: a trait-level guarantee connected to the mathematical failure mode (divergent cuts) in `solver-interface-trait.md` SS7; verify by finite-difference sensitivity check during initial implementation.
- **`SolverError` pattern**: one variant per error category from the source spec, optional structured diagnostic fields, plus a hard-stop vs. proceed-with-partial mapping table.
  - Hard-stop variants: `Infeasible`, `Unbounded`, `InternalError`
  - Proceed-with-partial variants: `NumericalDifficulty`, `TimeLimitExceeded`, `IterationLimit`

---

## Performance Guidance

This is an HPC ecosystem. Performance considerations are first-class spec content.

- **Cache locality**: organize struct fields and LP variable layouts so that hot-path operations (state transfer, cut extraction, dot products) access contiguous memory slices.
- **Contiguous memory for LP variables**: group variables that are always accessed together (e.g., all storage levels before all inflow lags) so that the operation is a single `memcpy`-equivalent slice copy.
- **SIMD-friendly layout**: prefer flat, homogeneous arrays of `f64` over nested structs on hot paths; avoid padding that breaks SIMD alignment.
- **Minimal allocation on hot paths**: pre-allocate workspaces (see Solver Workspaces SS1.1); avoid `Vec` growth or heap allocation inside the training-loop iteration.
- **Dominated strategy FLOP cost**: the dominated-cut detection algorithm in `cut-selection-trait.md` SS6.4 has a production-scale cost of ~7.7G FLOPs; gate it behind a Cargo feature flag to prevent CI benchmark regression.
- **`Result`-returning hot-path methods** (`solve`, `solve_with_basis`): require a **separate error-path benchmark** — the happy path and error path have different performance profiles due to FFI retry logic.
- **LP variable indexing**: provide "indexer" helper structs (e.g., `stage_template.storage`) for accessing specific primal or dual slices; these should be read-only and shared across threads and ranks since all LPs at the same stage share the same structure.

---

## § Convention Enforcement

Two recurring violation categories to check when auditing spec files:

1. **New spec files**: authors over-apply `§`-avoidance and write `SS1` instead of `§1` for the one legitimate HPC link inside the convention blockquote.
2. **Pre-existing architecture files**: authored before the convention existed; may use `§` as self-referential section anchors. Run `grep § src/specs/architecture/*.md` — any result not inside a convention blockquote is a violation.

Post-epic-04 state: `grep § src/specs/architecture/` returns only blockquote occurrences in the 7 trait specs. This is the correct baseline.

---

## Cross-Reference Index Methodology

The file `src/specs/cross-reference-index.md` has 5 sections that must stay consistent.
Always perform updates in **batches** (all affected specs at once per epic), never piecemeal.

Batch update sequence for each new spec:

1. Extract outgoing references from the new spec for **section 3** (outgoing refs)
2. Identify existing specs that gain new incoming refs for **section 4** (incoming refs)
3. Compute topological position for **section 5** (dependency order)
4. Assign primary crate for **sections 1 and 2** (per-crate reading lists)
5. Update the document count header

Cross-cutting documents (no single owning crate) go into **all 11 per-crate reading lists** in section 2 as `(secondary)`, including deferred crates.

---

## GIL Contract and Free-Threaded Python

- The GIL contract in `src/specs/interfaces/python-bindings.md` is a **6-point contract** (current authoritative count).
- When any numbered contract is extended, grep `src/crates/` for the previous count string and update it — crate overview files lag behind spec files.
- MPI prohibition has **3 independent reasons**: (1) `MPI_Init_thread` timing conflict, (2) GIL/`MPI_THREAD_MULTIPLE` deadlock, (3) dual-FFI-layer fragility. Reason (2) is GIL-dependent; reasons (1) and (3) persist under free-threaded Python.
- Free-threaded Python detail belongs **only** in `python-bindings.md` SS7.5a; other files use the established shorthand.
- Shorthand "GIL/MPI incompatibility" is acceptable; "because the GIL prevents MPI" is not.

---

## Implementation Readiness State (as of Epic 05)

Key planning documents for the first implementation plan:

- `src/specs/overview/implementation-ordering.md` — 8-phase build sequence, per-phase spec reading lists
- `src/specs/overview/spec-gap-inventory.md` — 39 gaps (5 Blocker, 16 High, 13 Medium, 5 Low)

**All 5 Blockers must be resolved before Phase 1 coding starts:**

- GAP-001: `SystemRepresentation` struct definition
- GAP-002: Decommissioned LP treatment
- GAP-003: Broadcast serialization format (use `postcard` for MPI; `bincode` is unmaintained)
- GAP-004: `StageTemplate` construction and LP variable layout
- GAP-005: Forward pass patch sequence

The dominant gap crate is `cobre-sddp` (~20 of 38 gaps). The minimal viable build sequence is bottom-up: `cobre-core` first, then `cobre-solver` + `ferrompi` in parallel (Phase 3), up to `cobre-cli` (Phase 8).

---

## Do NOT

- Use `§` in `src/specs/architecture/` files except inside the verbatim convention blockquote.
- Use `SS` prefix when linking to `src/specs/hpc/` files (use `§` there).
- Paraphrase the convention blockquote; it must be reproduced verbatim.
- Include the convention blockquote in testing specs.
- Claim infallibility without citing the upstream section that guarantees it.
- Use `Box<dyn Trait>` — prefer enum dispatch for closed variant sets.
- Allow `Result`-returning methods on pure queries.
- Use section prefix `SS` or `§` in overview/planning spec sections (use plain numbered headings).
- Update the cross-reference index for a single spec in isolation — always batch.
- Write gap summary statistics without verifying them against the detailed table.
- Use `bincode` for serialization — use `postcard` for MPI broadcast and `FlatBuffers` for policy persistence.
- Allocate on the hot path inside the SDDP training loop iteration.
