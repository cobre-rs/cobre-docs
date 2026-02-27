# Ecosystem Guidelines

## Purpose

This document captures the durable authoring conventions for the Cobre specification corpus.
These guidelines emerged from the spec-readiness plan (Epics 01–05) and apply to every future
spec authoring or update task in this repository. They exist for three reasons.

First, the specification corpus is large and spans multiple directories with distinct structural
conventions. Without explicit rules, cross-linking breaks, section prefix conventions drift, and
structural patterns diverge across files, creating inconsistency that is expensive to repair in
bulk. Second, every spec file in this corpus is intended to serve both human readers and AI
coding assistants. Consistency in structure and cross-reference format makes the corpus
machine-navigable in addition to human-readable. Third, several of these conventions are
non-obvious — they encode hard-won decisions from spec review cycles, and the "Do NOT" entries
in particular exist because the violation was observed and caused a guardian rejection.

---

## 1. Repository Layout

This is an mdBook project (`book.toml`, `src = "src"`) containing the specification corpus for
the Cobre ecosystem — a power system analysis and optimization platform written in Rust, with SDDP-based hydrothermal dispatch as the first solver vertical. The book builds with `mdbook build`
from the repo root. Spec source files live exclusively under `src/specs/`. The `CLAUDE.md` file
at the repository root is outside `src/` and is never processed by mdBook.

### 1.1 Key Directories

| Directory                            | Contents                                                            |
| ------------------------------------ | ------------------------------------------------------------------- |
| `src/specs/architecture/`            | Trait specs and testing specs for architectural boundaries          |
| `src/specs/hpc/`                     | HPC layer specs: MPI communicator, parallelism, backend testing     |
| `src/specs/overview/`                | Planning and overview specs: implementation ordering, gap inventory |
| `src/specs/data-model/`              | Data format and schema specs                                        |
| `src/specs/interfaces/`              | Python bindings and interface specs                                 |
| `src/crates/`                        | Per-crate overview files tracking section counts and key contracts  |
| `src/specs/cross-reference-index.md` | Canonical index of all specs (5 sections)                           |
| `plans/spec-readiness/learnings/`    | Accumulated plan learnings (primary historical reference)           |

---

## 2. Specification Structural Patterns

The corpus contains three distinct file categories, each with its own structural requirements.
These categories are not interchangeable — applying the rules of one category to a file in
another category is an error.

### 2.1 Trait Specs

Trait specs are files named `*-trait.md` in `src/specs/architecture/`. They define Rust trait
contracts, behavioral invariants, and dispatch decisions for architectural boundaries. Every
trait spec must begin with this exact opening structure:

1. A **purpose paragraph** describing what the trait does and why it exists.
2. The **convention blockquote** — reproduced verbatim from
   `src/specs/hpc/communicator-trait.md` (see below). Paraphrasing is not permitted.
3. **SS1 Trait Definition** — the first numbered section.

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

Note that the blockquote contains exactly one `§` reference: `[Backend Testing §1](../hpc/backend-testing.md)`.
When the blockquote appears in an HPC-directory file, the path is `./backend-testing.md`; in
architecture-directory files, it is `../hpc/backend-testing.md`. Both forms are correct in
their respective contexts. This is the only `§` reference permitted in any architecture spec
prose outside the blockquote itself.

The convention blockquote belongs only in trait specs. It must not appear in testing specs or
overview files.

### 2.2 Testing Specs

Testing specs are files named `*-testing.md` in `src/specs/architecture/`. They specify
conformance test suites for the trait contracts defined in the corresponding trait specs. Key
structural requirements:

- A **shared fixture** is declared once at the top of SS1, before any test tables. Individual
  test rows reference it as a delta.
- A **"Test naming convention:" paragraph** appears before the first table in each section.
- The **naming pattern** for all test identifiers is
  `test_{trait}_{variant}_{method}_{scenario}` using all-lowercase snake*case. The `{variant}`
  component is the backend name for solver tests (`highs`, `clp`). Cross-solver equivalence
  tests use `test_solver_cross*...`.
- **Error path tests** occupy a dedicated section (SS3), separate from success-path conformance
  tests. Mixing error path tests into success-path sections is a structural violation.
- **LP lifecycle tests** go in a standalone section when methods must be called in sequence.
- **Cross-solver equivalence tests** require a dedicated section with an explicit tolerances
  table:

  | Metric                     | Tolerance     |
  | -------------------------- | ------------- |
  | Objective                  | 1e-8 relative |
  | Primal                     | 1e-8 absolute |
  | Dual                       | 1e-6 absolute |
  | Warm-start iteration ratio | 2× max        |

- **Finite-difference sensitivity check** is the strongest dual verification; use it whenever a
  dual or gradient is a first-class postcondition.
- Minimum test counts are floors, not targets. Algorithm-heavy and multi-backend traits will
  naturally exceed them.
- The convention blockquote is absent from testing specs.

### 2.3 Overview and Planning Specs

Files in `src/specs/overview/` (this file, `implementation-ordering.md`,
`spec-gap-inventory.md`, etc.) use plain numbered sections (`## 1.`, `## 2.`). The `SS` and
`§` prefixes are never used in overview specs, regardless of section count or cross-link
direction. This rule applies universally to every file in this directory.

Additional structural expectations by document type:

- **Implementation ordering documents** express each phase as a sub-section with a two-column
  attribute table: Crates, What becomes testable, Blocked by, Spec reading list. An ASCII
  preformatted DAG complements the per-phase "Blocked by" entries.
- **Gap inventories** use a seven-column table: ID, Severity, Affected Crate(s), Spec File(s),
  Sections, Description, Resolution Path. Gap summary statistics must be computed from the
  detailed table and verified to match before any guardian pass.
- **Cross-cutting documents** (no single owning crate) use `(cross-cutting)` as the Primary
  Crate in the cross-reference index mapping table.

---

## 3. Dispatch Architecture Patterns

The canonical reference for dispatch decisions is
[Solver Interface Trait SS5](../architecture/solver-interface-trait.md). All trait specs that
introduce a dispatch mechanism must justify the choice with respect to the four patterns
documented in that section.

The four dispatch patterns in the Cobre architecture are:

| Pattern                                                  | Mechanism                                               | Examples                                                |
| -------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Single active variant, global scope                      | Flat enum, `match` at call sites                        | `CutSelectionStrategy`, `HorizonMode`, `SamplingScheme` |
| Single active variant, per-stage scope                   | Flat enum, `match` at call sites                        | `RiskMeasure`                                           |
| Multiple active variants evaluated simultaneously        | `Vec<EnumVariant>` + composition struct with mode field | `StoppingRuleSet`                                       |
| Single active variant, fixed at build time, wrapping FFI | Rust `trait` with compile-time monomorphization         | `SolverInterface`                                       |

Every trait spec's dispatch mechanism section must document all three of:

1. Why the rejected alternatives (e.g., `Box<dyn Trait>`, compile-time monomorphization) were
   not chosen for this particular trait.
2. The performance characteristics of the chosen approach.
3. Which architectural property — runtime flexibility, compile-time specialization, or
   composition of simultaneous variants — drives the choice.

`Box<dyn Trait>` is rejected in all current trait specs. Closed variant sets always prefer
enum dispatch. Compile-time monomorphization via Rust `trait` is reserved for traits that wrap
FFI and fix exactly one backend per binary. Using `Box<dyn Trait>` in a new spec without an
explicit architectural justification is a conformance violation.

---

## 4. Invariant and Contract Patterns

Method contracts in trait specs follow a strict category system. The category determines whether
a method returns `Result`, whether a postcondition table is required, and where error recovery
responsibility lies.

### 4.1 Pure Query Methods

Methods that compute and return a value from already-validated inputs — `should_run`, `select`,
`evaluate` — never return `Result`. The infallibility claim is always supported by citing the
specific upstream section (a validation rule, config load step, or precondition spec section)
that guarantees valid inputs arrive at the method. Claiming infallibility without this citation
is a specification defect.

### 4.2 FFI-Wrapping Methods

Methods that cross an FFI boundary — `solve`, `solve_with_basis` — return `Result` and require
split Ok/Err postcondition tables: one table for the success path and one for the error path.
The Err postcondition table must include the error recovery contract: when a method returns
`Err`, the **caller** is responsible for calling `reset()` before reusing the instance.
Documenting this responsibility in the trait spec (not just in calling code) prevents
misuse at integration boundaries.

### 4.3 Encapsulated Behavior

Retry logic and sign-convention normalization are hidden inside implementations. The trait
method returns only the final result. A dedicated section (e.g., SS6 for retry, SS7 for dual
normalization) documents the hidden behavior so that conformance tests can verify it without
the calling code needing to observe or manage the internal mechanism.

Dual normalization is a trait-level guarantee connected to the mathematical failure mode
(divergent cuts) documented in [Solver Interface Trait SS7](../architecture/solver-interface-trait.md).
This guarantee must be verified by finite-difference sensitivity check during initial
implementation.

### 4.4 SolverError Pattern

`SolverError` is the template for future error enums in the solver layer. It specifies one
variant per error category from the source spec, with optional structured diagnostic fields,
and a hard-stop vs. proceed-with-partial mapping table.

| Category              | Disposition          |
| --------------------- | -------------------- |
| `Infeasible`          | Hard-stop            |
| `Unbounded`           | Hard-stop            |
| `InternalError`       | Hard-stop            |
| `NumericalDifficulty` | Proceed with partial |
| `TimeLimitExceeded`   | Proceed with partial |
| `IterationLimit`      | Proceed with partial |

New error enums in other crates should follow the same variant-per-category and
hard-stop-vs-partial structure.

---

## 5. Error Type Design

The `SolverError` pattern from [Solver Interface Trait](../architecture/solver-interface-trait.md)
is the authoritative model for designing error types across the ecosystem. Three principles
govern error type design:

**One variant per error category from the source spec.** Error variants are not generic
catch-alls. Each variant corresponds to a named category with defined semantics in the
specification. This enables callers to make programmatic decisions — retry, fallback, abort —
without inspecting error message strings.

**Structured diagnostic fields where useful.** Variants like `NumericalDifficulty` may carry
structured fields (`iteration`, `stage`, `residual_norm`) that enable the caller to construct
a useful error report without parsing a human-readable message.

**Hard-stop vs. proceed-with-partial mapping table.** The error type specification must include
a table mapping each variant to its recovery disposition. This table belongs in the trait spec
or the error type spec, not scattered across calling code.

For the MPI and communication layer, see the `CommError` type referenced in
[Communicator Trait](../hpc/communicator-trait.md). For the validation layer, see the 14
validation error kinds defined in [Validation Architecture](../architecture/validation-architecture.md),
which form the foundation for the structured error schema.

---

## 6. Performance Principles

Cobre is an HPC ecosystem. Performance considerations are first-class spec content, not
implementation notes. The following principles apply to all design decisions at the spec level.

**Cache locality.** Organize struct fields and LP variable layouts so that hot-path operations
(state transfer, cut extraction, dot products) access contiguous memory slices. This is a
design decision, not an implementation detail, and must appear in the relevant data model or
architecture spec.

**Contiguous memory for LP variables.** Group variables that are always accessed together —
for example, all storage levels before all inflow lags — so that the state transfer operation
is a single `memcpy`-equivalent slice copy. The grouping must be specified in the relevant
spec, because it determines the layout that the LP construction code must reproduce.

**SIMD-friendly layout.** Prefer flat, homogeneous arrays of `f64` over nested structs on hot
paths. Avoid padding that breaks SIMD alignment. Specs that define data structures for the
hot path should note any alignment requirements.

**Minimal allocation on hot paths.** Pre-allocate workspaces (see
[Solver Workspaces SS1.1](../architecture/solver-workspaces.md)); avoid `Vec` growth or heap
allocation inside the training-loop iteration. A spec that introduces a new data structure
used inside the training loop must explicitly state whether it allocates and, if so, where the
allocation occurs relative to the loop iteration boundary.

**Dominated strategy FLOP cost.** The dominated-cut detection algorithm in
[Cut Selection Strategy Trait SS6.4](../architecture/cut-selection-trait.md) has a
production-scale cost of approximately 7.7 billion FLOPs. This algorithm must be gated behind
a Cargo feature flag to prevent CI benchmark regression. Any spec that introduces similarly
expensive optional algorithms should follow the same pattern.

**Error-path benchmarks for hot-path methods.** `Result`-returning hot-path methods (`solve`,
`solve_with_basis`) require a separate error-path benchmark in addition to the happy-path
benchmark. The happy path and error path have different performance profiles due to FFI retry
logic.

**LP variable indexing.** Provide "indexer" helper structs (e.g., `stage_template.storage`)
for accessing specific primal or dual slices. These structs should be read-only and shareable
across threads and ranks, since all LPs at the same stage share the same structure. The spec
for any trait that exposes LP access methods should reference the corresponding indexer struct.

**Serialization format.** The ecosystem uses three distinct binary serialization formats, each with a specific role:

- **`postcard`** for MPI broadcast of the `System` initialization struct (once per execution, hot path). Zero runtime overhead; reuses existing `serde` derives. See [Input Loading Pipeline](../architecture/input-loading-pipeline.md) SS6.1–6.4.
- **`FlatBuffers`** for persistent policy data (cuts, state vectors, vertices). Zero-copy read access from disk; schema evolution via file-identifier versioning. See [Output Infrastructure §6.6](../data-model/output-infrastructure.md).
- **`#[repr(C)]` raw `f64` arrays** for cut wire format on the backward-pass hot path (already in use; zero serialization overhead). See [Cut Management](../math/cut-management.md).

`bincode` is unmaintained and must not be used. Any new spec that introduces a serialization requirement must specify which of the three approved formats applies and why.

---

## 7. Documentation Conventions

### 7.1 Section Prefix Rules

Three types of cross-links appear in this corpus, and each uses a distinct prefix:

- **`SS` prefix** (e.g., `SS4`, `SS7`): used exclusively for architecture-to-architecture
  cross-links — links from one `src/specs/architecture/` file to a section in another
  `src/specs/architecture/` file.
- **`§` prefix** (e.g., `§1`, `§3`): reserved exclusively for links to sections in
  `src/specs/hpc/` files. It does not appear in overview file prose.
- **Plain numbered headings** (e.g., `## 1.`, `## 2.`): used exclusively in overview and
  planning specs (`src/specs/overview/`).

Two recurring violation categories to check when auditing spec files:

1. **New architecture spec files**: authors over-apply `§`-avoidance and write `SS1` instead
   of `§1` for the one legitimate HPC link inside the convention blockquote.
2. **Pre-existing architecture files**: authored before the convention existed; may use `§` as
   self-referential section anchors. Run `grep § src/specs/architecture/*.md` — any result
   not inside a convention blockquote is a violation.

The post-Epic-04 baseline: `grep § src/specs/architecture/` returns only blockquote
occurrences across the 7 trait specs. This is the correct state to preserve.

### 7.2 Cross-References Section

Every trait spec must include a Cross-References section with a minimum of 10–14 entries. Each
entry must include: the file, the specific sections within it, and a one-line description.
The canonical format is:

```
[File](./link.md) -- description (section list)
```

Do not substitute bare hyperlinks in prose for the Cross-References section. The Cross-References
section is a structured index, not a list of footnotes.

Overview and planning specs (including this file) include a Cross-References section, but the
minimum entry count does not apply — include all entries that are actually referenced in the
document.

### 7.3 Cross-Reference Index Methodology

The file `src/specs/cross-reference-index.md` has 5 sections that must stay consistent.
Always perform updates in batches — all affected specs at once per epic, never piecemeal.

The batch update sequence for each new spec is:

1. Extract outgoing references from the new spec for **section 3** (outgoing refs).
2. Identify existing specs that gain new incoming refs for **section 4** (incoming refs).
3. Compute topological position for **section 5** (dependency order).
4. Assign primary crate for **sections 1 and 2** (per-crate reading lists).
5. Update the document count header.

Cross-cutting documents (no single owning crate) go into all 11 per-crate reading lists in
section 2 as `(secondary)`, including deferred crates.

---

## 8. GIL Contract and Free-Threaded Python

The GIL contract in `src/specs/interfaces/python-bindings.md` is a 6-point contract (current
authoritative count). When any numbered contract is extended, grep `src/crates/` for the
previous count string and update it — crate overview files lag behind spec files and must be
kept synchronized.

MPI prohibition has three independent reasons:

1. `MPI_Init_thread` timing conflict.
2. GIL/`MPI_THREAD_MULTIPLE` deadlock.
3. Dual-FFI-layer fragility.

Reason (2) is GIL-dependent; reasons (1) and (3) persist under free-threaded Python.
Free-threaded Python detail belongs only in
[Python Bindings SS7.5a](../interfaces/python-bindings.md); other files use the established
shorthand "GIL/MPI incompatibility". The phrase "because the GIL prevents MPI" is imprecise
and must not be used.

---

## 9. Implementation Readiness State

Key planning documents for the first implementation plan:

- [Implementation Ordering](./implementation-ordering.md) — 8-phase build sequence, per-phase
  spec reading lists
- [Spec Gap Inventory](./spec-gap-inventory.md) — 39 gaps (5 Blocker, 16 High, 13 Medium,
  5 Low)

All 5 Blockers have been resolved:

| Gap ID  | Description                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-001 | `SystemRepresentation` struct definition — **Resolved**: defined in [Internal Structures](../data-model/internal-structures.md)              |
| GAP-002 | Decommissioned LP treatment — **Resolved**: specified in [Training Loop](../architecture/training-loop.md)                                   |
| GAP-003 | Broadcast serialization format — **Resolved**: `postcard` adopted for MPI broadcast                                                          |
| GAP-004 | `StageTemplate` construction and LP variable layout — **Resolved**: specified in [Internal Structures](../data-model/internal-structures.md) |
| GAP-005 | Forward pass patch sequence — **Resolved**: specified in [Training Loop](../architecture/training-loop.md)                                   |

The dominant gap crate is `cobre-sddp` (~20 of 39 gaps). The minimal viable build sequence
is bottom-up: `cobre-core` first, then `cobre-solver` + `ferrompi` in parallel (Phase 3), up
to `cobre-cli` (Phase 8).

---

## 10. Invariants Checklist

The following invariants apply to every spec authoring task in this repository. Use this list
as a pre-submission checklist:

- [ ] Overview files use plain numbered sections only — no `SS` or `§` prefixes.
- [ ] Trait specs begin with purpose paragraph, verbatim convention blockquote, then SS1.
- [ ] The convention blockquote is reproduced verbatim — not paraphrased, not summarized.
- [ ] The convention blockquote does not appear in testing specs.
- [ ] The single `§` inside the convention blockquote uses `../hpc/backend-testing.md`
      (architecture files) or `./backend-testing.md` (HPC files).
- [ ] Architecture cross-links use `SS` prefix; HPC cross-links use `§` prefix.
- [ ] Pure query methods do not return `Result`; their infallibility cites an upstream section.
- [ ] FFI-wrapping methods have split Ok/Err postcondition tables.
- [ ] Err postcondition table documents caller's `reset()` responsibility.
- [ ] Dispatch mechanism section documents rejected alternatives and the driving property.
- [ ] No `Box<dyn Trait>` without explicit architectural justification.
- [ ] Trait spec Cross-References section has 10–14 entries with section-level detail.
- [ ] Cross-reference index updated in a batch — not for a single spec in isolation.
- [ ] Gap summary statistics computed from and verified against the detailed gap table.
- [ ] No `bincode` in serialization specs — use `postcard` (MPI broadcast), `FlatBuffers` (policy persistence), or `#[repr(C)]` raw arrays (cut wire format).
- [ ] No allocation inside the training-loop iteration hot path.
- [ ] Dominated-cut detection algorithm gated behind a Cargo feature flag.

---

## Cross-References

- [Implementation Ordering](./implementation-ordering.md) — 8-phase build sequence and per-phase spec reading lists (sections 4–5)
- [Spec Gap Inventory](./spec-gap-inventory.md) — 38 open gaps with severity, crate ownership, and resolution paths
- [Cross-Reference Index](../cross-reference-index.md) — Canonical index of all specs across 5 sections; methodology for batch updates
- [Communicator Trait](../hpc/communicator-trait.md) — Canonical source of the convention blockquote; `§` prefix convention origin
- [Backend Testing](../hpc/backend-testing.md) — Conformance test suite referenced by the convention blockquote (§1)
- [Solver Interface Trait](../architecture/solver-interface-trait.md) — Canonical reference for dispatch pattern decisions (SS5); dual normalization guarantee (SS7); `SolverError` pattern
- [Solver Workspaces](../architecture/solver-workspaces.md) — Pre-allocation requirements for hot-path methods (SS1.1)
- [Cut Selection Strategy Trait](../architecture/cut-selection-trait.md) — Dominated-cut detection FLOP cost and feature flag requirement (SS6.4)
- [Validation Architecture](../architecture/validation-architecture.md) — 14 validation error kinds forming the foundation for the structured error schema (§4–5)
- [Python Bindings](../interfaces/python-bindings.md) — 6-point GIL contract; free-threaded Python detail; MPI prohibition reasons (SS7.5a)
- [Design Principles](./design-principles.md) — Format selection criteria, declaration order invariance, agent-readability rules
