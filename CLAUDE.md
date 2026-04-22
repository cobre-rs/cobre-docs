# Cobre Docs — Development Guidelines

## Project Overview

Cobre-docs is the **methodology reference** for the Cobre ecosystem — an mdBook
containing the specification corpus for SDDP-based hydrothermal dispatch.

- **Build**: `mdbook build` from repo root
- **Serve**: `mdbook serve --open`
- **KaTeX**: requires `mdbook-katex` v0.10.0-alpha (see memory/build-tools.md)
- **Source**: all spec files live under `src/specs/`
- **Audience**: `methodology.cobre-rs.dev` (see `docs/design/dev-strategy.md`)

The actual Cobre code at the main org repo is the **ground truth**. When specs
diverge from the code, the spec must be updated — not the other way around.

---

## Current State (synced to v0.4.1, April 2026)

88 specification files across 7 domains: architecture, math, data-model,
hpc, interfaces, configuration, overview.

---

## Hard Rules

- **Section prefixes**: `SS` in architecture specs, `§` in HPC specs, plain numbers in overview specs. Never mix.
- **`§` is HPC-only**: the sole permitted `§` in architecture specs is inside the convention blockquote
- **Convention blockquote**: reproduced verbatim in trait specs, never paraphrased, never in testing specs. Canonical source: `src/specs/hpc/communicator-trait.md`
- **No `Box<dyn Trait>`**: enum dispatch for closed variant sets (see solver-interface-trait.md SS5)
- **Cross-reference index**: always batch-update (never piecemeal). 5 sections must stay consistent.
- **Decision Log**: changes affecting 2+ spec files must be registered as DEC-NNN before propagating
- **Serialization**: `postcard` for MPI broadcast, `FlatBuffers` for policy persistence. Never `bincode`.
- **Ground truth**: code > spec. When they diverge, update the spec.

---

## Spec File Patterns (Read When Relevant)

When writing or editing **trait specs** (`*-trait.md` in `src/specs/architecture/`):
→ Follow: purpose paragraph, convention blockquote, SS1 trait definition.
→ Minimum 10-14 cross-reference entries. Infallibility claims must cite upstream sections.
→ Reference: `src/specs/architecture/solver-interface-trait.md` (most complete example)

When updating **output schemas** (`src/specs/data-model/output-schemas.md`):
→ Verify column count against `cobre-io/src/output/schemas.rs`
→ Verify codes against `cobre-io/src/output/dictionary.rs`

When updating **LP formulation** (`src/specs/math/lp-formulation.md`):
→ Verify column/row layout against `cobre-sddp/src/indexer.rs`
→ LP scaling: Cobre applies own row/col/cost scaling (DEC-021). HiGHS internal scaling disabled.

When **authoring or editing a diagram** (new `src/images/*.svg`, `diagrams/matplotlib/d*.py`, or inline ` ```mermaid ` block in a spec):
→ Follow: [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) — tool-selection decision table (§1.1), design system for composed blocks (§4.2–4.3), naming (§7), D2 rendering policy (§2).
→ Consistency rule (§1.3): a family of related diagrams uses the same tool — never mix within a domain.
→ Reference implementations: `diagrams/matplotlib/d02_value_function.py` (math plot), `diagrams/matplotlib/d23_par_stored_vs_computed.py` (composed block diagram), inline mermaid in `src/specs/math/sddp-algorithm.md` §3 (flowchart).

---

## Key References

| Resource                  | Location                                  | Purpose                                  |
| ------------------------- | ----------------------------------------- | ---------------------------------------- |
| Cobre code (ground truth) | `https://github.com/cobre-rs/cobre/`                            | Actual implementation                    |
| Software book             | `https://github.com/cobre-rs/cobre/book/`                       | User-facing docs                         |
| Dev strategy              | `https://github.com/cobre-rs/cobre/docs/design/dev-strategy.md` | Documentation & public presence strategy |
| CHANGELOG                 | `https://github.com/cobre-rs/cobre/CHANGELOG.md`                | Per-release feature list                 |
| Diagram authoring guide   | [`docs/design/diagram-authoring.md`](docs/design/diagram-authoring.md) | Tool selection + design system for spec diagrams |

---

## Error Classifications (SolverError)

Hard-stop: `Infeasible`, `Unbounded`, `NumericalDifficulty`, `InternalError`
Proceed-with-partial: `TimeLimitExceeded`, `IterationLimit`

---

## MPI / Python Safety

- MPI threading: `ThreadLevel::Funneled` (only main thread calls MPI)
- GIL contract: 6-point contract in `python-bindings.md` SS7
- MPI prohibition from Python: 3 independent reasons (timing, deadlock, FFI fragility)
- Shorthand "GIL/MPI incompatibility" is OK; "because the GIL prevents MPI" is not