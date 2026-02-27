# How to Use This Specification

## 1. What This Corpus Is

The `cobre-docs` repository is a behavioral contract corpus for the Cobre power system ecosystem. Every file in `src/specs/` defines what some part of the system must guarantee: trait contracts, data layouts, dispatch patterns, configuration schemas, algorithmic invariants, LP structural constraints, and test obligations. The specs are the acceptance criteria for the implementation.

The corpus operates at the level of behavioral contracts and type-level invariants. When a spec says `fn add_rows(batch: RowBatch) -> ()`, it defines what any correct implementation must satisfy — the preconditions, postconditions, error behavior, and performance expectations — not a specific implementation to reproduce. Implementations may diverge in naming, internal organization, or error representation when practical considerations demand it, provided the behavioral contracts continue to hold.

The corpus is also the shared vocabulary for implementation planning. When an implementation ticket says "implement `SolverInterface` for HiGHS," the ticket scope and acceptance criteria are defined by the spec, not re-invented in the ticket.

## 2. What You Will Find

The specs cover seven content categories:

- **Rust trait definitions** expressing behavioral contracts (preconditions, postconditions, error types, performance expectations). These are guidelines, not verbatim implementation mandates — see the convention blockquote in trait specs.
- **Data model definitions**: entity schemas (`cobre-core`), internal structures (`SystemRepresentation`, `StageTemplate`, `PrecomputedParLp`), LP variable layouts, binary format schemas.
- **Mathematical formulations**: SDDP algorithm, LP stage structure, cut management, risk measures, PAR(p) inflow model, inflow non-negativity treatment.
- **Dispatch pattern decisions**: when to use enum dispatch versus compile-time monomorphization, and why `Box<dyn Trait>` is rejected. See [Solver Interface Trait](../architecture/solver-interface-trait.md).
- **Configuration contracts**: `config.json` and `stages.json` schema definitions, validation rules, field semantics, and LP effects.
- **HPC architecture**: MPI communication patterns, hybrid parallelism model, NUMA placement, memory layout, shared-window semantics.
- **Test obligations**: conformance test suites for every trait, with naming conventions, shared fixtures, tolerance tables, and minimum test counts.

## 3. What You Will Not Find

The specs deliberately exclude implementation artifacts. The following belong in implementation tickets, not in this corpus:

- Crate scaffolding (`cargo init`, `Cargo.toml` contents, module structure, workspace layout)
- CI configuration (GitHub Actions workflows, Docker images, build scripts)
- Step-by-step "create file X, write function Y" instructions
- IDE setup, toolchain installation, dependency pinning
- Performance benchmarks — specs define behavioral contracts; benchmarks verify that implementations meet them

## 4. The Abstraction Boundary

The boundary between spec content and implementation content is the boundary between _what the system must guarantee_ and _how a specific implementation achieves it_.

A worked example using `SolverInterface`:

> **Spec content** (`solver-interface-trait.md`): The trait defines `fn solve(...)` with preconditions (LP must be loaded, basis optional), postconditions (split Ok/Err tables), warm-start protocol, dual normalization guarantee, and retry encapsulation. The testing spec defines the complete conformance test suite with test names, tolerances, and expected behavior for each method.
>
> **Implementation ticket** (derived from the spec): "Implement the HiGHS adapter in `cobre-solver`. Wrap the HiGHS C FFI via `highs-sys`. Map HiGHS status codes to `SolverError` variants. Implement warm-start via `Highs_setBasis`. Implement dual sign normalization per the trait spec's normalization section. Write the conformance test suite from `solver-interface-testing.md`. Benchmark happy-path and error-path latency."

The spec is the acceptance criterion. The implementation ticket is the path to satisfying it. An implementation that passes all conformance tests and satisfies all behavioral contracts in the spec is correct by definition.

This boundary also determines where to look when something is unclear: if the question is "what must this do?", look in the spec. If the question is "how should I structure this crate?", that is an implementation decision made in the ticket or during development.

## 5. Where Implementation Planning Begins

Start with the [Minimum Viable Reading List](./implementation-ordering.md#9-minimum-viable-reading-list) (section 9 of `implementation-ordering.md`) — 10 ordered specs covering conventions, mathematical foundations, data model, core architecture, and HPC execution model. After reading these 10 files, you have the vocabulary and structural understanding needed to draft implementation tickets for any phase.

For phase-specific depth, use the per-phase reading lists in [Implementation Ordering section 5](./implementation-ordering.md). Each phase entry lists the specs a developer needs before beginning that phase's tickets.

The [Cross-Reference Index](../cross-reference-index.md) provides per-crate reading lists (section 2) and a full dependency ordering (section 5) — useful when you need to understand which specs govern a specific crate.

After reading the MVRL, a developer has enough context to draft Phase 1 implementation tickets. The `cobre-docs` corpus is the reference you consult during implementation, not the work breakdown structure itself.

## 6. Cross-References

| Target                                                  | Relevance                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Implementation Ordering](./implementation-ordering.md) | Build sequence, MVRL (section 9), per-phase reading lists (section 5)            |
| [Ecosystem Guidelines](./ecosystem-guidelines.md)       | Authoring conventions, invariant checklist, cross-reference methodology          |
| [Cross-Reference Index](../cross-reference-index.md)    | Per-crate reading lists, dependency ordering, spec-to-crate mappings             |
| [Design Principles](./design-principles.md)             | Format selection criteria, declaration-order invariance, agent-readability rules |
