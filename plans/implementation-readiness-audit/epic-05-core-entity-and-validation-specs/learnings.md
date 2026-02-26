# Epic 05 Learnings: Core Entity Struct Definitions and Validation Specs

**Epic**: epic-05-core-entity-and-validation-specs
**Date**: 2026-02-26
**Tickets**: ticket-018, ticket-019, ticket-020, ticket-021
**Quality scores**: 0.958, 0.961, 0.99, 0.98 (all EXCELLENT)

---

## Patterns Established

### P1: Newtype EntityId over primitive integers

`EntityId` was defined as `pub struct EntityId(pub i32)` -- a newtype around `i32` rather than a type alias. The choice was driven by two observations: (1) all JSON entity schemas use integer IDs (`i32`), not strings, making `i32` the natural inner type; (2) the newtype prevents accidental confusion between entity IDs and collection indices (`usize`), which are both integers but carry different semantics. The design rationale is captured in the field descriptions table at `src/specs/data-model/internal-structures.md` section 1.8. `Copy`, `Hash`, and `Eq` are derived; `Ord` is intentionally omitted because canonical ordering uses collection position, not ID magnitude.

### P2: Base vs Resolved field annotation pattern

Every entity struct distinguishes `// -- Base fields (loaded from JSON) --` from `// -- Resolved fields (defaults applied during loading) --` via inline comment blocks. This pattern makes the implementer's loading-pass responsibilities unambiguous: base fields are a direct JSON deserialization target; resolved fields require the default cascade (from entity-level override or global `penalties.json`) to run after deserialization. First instantiated in `Bus` and extended consistently through all 7 entity structs (`src/specs/data-model/internal-structures.md` sections 1.9.2 through 1.9.8).

### P3: Supporting enum extraction before entity structs

Each "entity section" (1.9 for entities, 12 for temporal types) opens with a supporting enums subsection before any struct definitions. For entities, this is section 1.9.1 with `HydroGenerationModel`, `TailraceModel`, `HydraulicLossesModel`, `EfficiencyModel`, and `ContractType`. For temporal types, this is section 12.1 with `BlockMode`, `SeasonCycleType`, and `SamplingMethod`. The pattern prevents forward-reference confusion in prose and mirrors the dependency order that a Rust compiler would see.

### P4: Dual-type owned/borrowed split for HPC shared data

For the `OpeningTree`, a two-type design was established: `OpeningTree` (owned, `Box<[f64]>` backing) for `cobre-stochastic` generation, and `OpeningTreeView<'a>` (borrowed, `&'a [f64]` slice) for `cobre-sddp` training loop consumption. This mirrors the dual-nature design already established in `internal-structures.md` SS1.1, extending it to HPC cross-crate boundaries. The pattern avoids any ownership transfer at the training loop boundary -- the loop sees only a borrowed slice with stride-based accessors. Source: `src/specs/architecture/scenario-generation.md` section 2.3a.

### P5: Layered validation rule execution order

The 26-rule cross-reference validation checklist in `input-loading-pipeline.md` SS2.6 established a two-layer execution order: referential integrity rules (1--15, 23--26) execute first, followed by structural and dimensional rules (16--22) that depend on all foreign-key references being confirmed valid. Cascade acyclicity (rule 16) cannot run until all `downstream_id` references are confirmed to exist (rule 6). This ordering constraint is documented explicitly in the "Execution order within SS2.6" paragraph following the table.

### P6: `Box<[f64]>` over `Vec<f64>` for fixed-size HPC arrays

The `OpeningTree` backing storage uses `Box<[f64]>` rather than `Vec<f64>`. The distinction communicates a structural invariant: the opening tree is allocated once and never resized. `Box<[f64]>` has no capacity field and no growth path, making accidental reallocation impossible. This convention should be applied to all other fixed-size flat arrays in HPC types (solver workspaces, cut pool backing storage). Source: `src/specs/architecture/scenario-generation.md` section 2.3a.

---

## Architectural Decisions

### D1: EntityId as i32 newtype, not String

Decision: wrap `i32`, not `String`. Rejected alternative: `String` newtype (as recommended in ticket-018's implementation guide). The JSON schemas use integer IDs throughout; `i32` keys are cheaper to hash and `Copy` without cloning. The newtype boundary isolates any future format migration. The "Pitfalls to Avoid" section in ticket-018 warned against `String` for fields with a fixed variant set -- the same principle applies to ID types.

### D2: PolicyGraph/HorizonMode separation of concerns

Decision: `PolicyGraph` captures the raw topology (transitions, horizon type, discount rate) loaded from `stages.json`; `HorizonMode` is a precomputed dispatch type built FROM `PolicyGraph` during the extension point pipeline. Rejected alternative: combining the two into a single type or making `PolicyGraph` hold a `HorizonMode` directly. The separation is documented in `internal-structures.md` section 12.10: "The `PolicyGraph` captures what the user specified; `HorizonMode` captures how the solver will traverse it." This ensures `cobre-core` does not depend on `cobre-sddp`'s solver dispatch types.

### D3: Stage-major memory layout for OpeningTree (correcting the existing spec)

Decision: stage-major layout (`data[stage * n_openings * dim + opening_idx * dim]`). The pre-existing spec text in `scenario-generation.md` incorrectly specified "opening-major ordering." The implementation corrected this to stage-major, which is optimal for the backward pass's access pattern: at each stage, all `n_openings` noise vectors are accessed sequentially and are contiguous in memory. Source: `src/specs/architecture/scenario-generation.md` section 2.3. This was a spec correction, not a deviation from the ticket.

### D4: SharedRegion primary path with HeapFallback for OpeningTree ownership

Decision: `SharedRegion<f64>` as the primary ownership strategy, with `Arc<OpeningTree>` as the `HeapFallback` path for single-process backends (`LocalComm`, `TcpComm`). The `HeapFallback` makes `SharedRegion` a strict generalization: code written against `SharedRegion` works on all four communicator backends without conditional logic. With 4 ranks per node, `SharedRegion` eliminates ~90 MB of redundant data copies at production scale. Source: `src/specs/architecture/scenario-generation.md` section 2.3a ownership model table.

### D5: Validation checklist count drives structural checks placement

Decision: 26 rules, with structural checks (cascade acyclicity, self-loop prevention, coverage checks) treated as their own category within the table rather than in a separate section. Rejected alternative: a separate "structural validations" subsection. The single table with grouping comments keeps the rule count verifiable (ticket-020 acceptance criterion: minimum 15 rules) and ensures the execution order paragraph can reference rule numbers unambiguously.

---

## Files and Structures Created

- `src/specs/data-model/internal-structures.md` sections 1.8--1.9: `EntityId` newtype, 7 entity struct definitions (`Bus`, `Line`, `Hydro`, `Thermal`, `PumpingStation`, `EnergyContract`, `NonControllableSource`), 5 supporting enums (`HydroGenerationModel`, `TailraceModel`, `HydraulicLossesModel`, `EfficiencyModel`, `ContractType`), 4 auxiliary structs (`DeficitSegment`, `DiversionChannel`, `FillingConfig`, `HydroPenalties`). Total: +639 lines.

- `src/specs/data-model/internal-structures.md` section 12.1--12.10: `Block`, `Stage`, `PolicyGraph` struct definitions with 7 supporting types (`StageStateConfig`, `StageRiskConfig`, `StageSamplingConfig`, `SeasonDefinition`, `SeasonMap`, `Transition`, `BlockMode`/`SeasonCycleType`/`SamplingMethod` enums). Total: ~458 additional lines within the existing section 12.

- `src/specs/architecture/input-loading-pipeline.md` SS2.6: 26-rule cross-reference validation checklist table with Source Entity, Reference Field, Target Entity, Validation Rule, and Error on Failure columns. Replaced 7-line illustrative list. Total: +29 lines net.

- `src/specs/architecture/scenario-generation.md` section 2.3a (new): `OpeningTree` struct definition, `OpeningTreeView<'a>` borrow type, ownership model analysis table, corrected memory layout from opening-major to stage-major, stride formula, backward pass access pattern code block. Total: +205 lines.

- `src/specs/overview/spec-gap-inventory.md`: GAP-023 and GAP-029 marked Resolved with detailed resolution descriptions.

---

## Conventions Adopted

### C1: Struct subsection numbering uses decimal notation

Entity structs use `### 1.9.2 Bus`, `### 1.9.3 Line`, etc. Temporal structs use `### 12.2 Block`, `### 12.3 StageStateConfig`, etc. The decimal numbering allows inserting intermediate types (supporting structs for a parent entity) without renumbering. Do not use `#### 1.9.2.1` -- two levels of decimal are the maximum.

### C2: Field descriptions table follows immediately after each struct code block

Every struct in `internal-structures.md` is followed by a `**Field descriptions**:` bold label and a Markdown table with columns: Field, Source, Base/Resolved, Description. The Source column specifies the exact JSON file and field path (e.g., `buses.json` `deficit_segments`). This convention was established in the System struct (section 1.3) and extended to all 7 entity structs and all temporal types.

### C3: Hydro diversion and filling as `Option<T>` inner structs

The `Hydro` struct uses `pub diversion: Option<DiversionChannel>` and `pub filling: Option<FillingConfig>` rather than flattening optional diversion/filling fields directly into `Hydro`. This keeps the base entity struct readable while making the optional feature groups self-contained types with their own field descriptions tables.

### C4: validation rule numbering is one-indexed, global across the SS2.6 table

Rules are numbered 1--26 with the `#` column. The "Execution order" paragraph references rules by this number (e.g., "Rules 1--15 and 23--26 execute first"). This enables prose references that survive table reordering as long as the `#` values are updated consistently.

---

## Surprises and Deviations

### S1: Memory layout in scenario-generation.md was incorrect before this epic

The pre-existing `scenario-generation.md` text stated the opening tree used "opening-major ordering" with the layout comment showing `[opening_0_stage_0_entity_0, ..., opening_N_stage_T_entity_E]`. Ticket-021 corrected this to stage-major ordering with the layout `[stage_0_opening_0_entity_0, ..., stage_T_opening_N_entity_E]`. Stage-major is correct for the backward pass access pattern and matches the stride formula `stage * n_openings * dim + opening_idx * dim`. The existing SS2.4 (time-varying correlation profiles) references "scenario-major layout" for a different structure -- these are separate, unrelated layouts in different subsections.

### S2: OpeningTreeView was not in the ticket specification but was added

Ticket-021 specified only `OpeningTree` (owned struct). The implementation added `OpeningTreeView<'a>` as a second type to handle the borrowed access pattern at the training loop boundary. This is a pure addition (not a deviation from specified requirements) and follows the dual-nature principle from `internal-structures.md` SS1.1. The view type is documented in `scenario-generation.md` section 2.3a.

### S3: Stage-level config decomposition into 3 supporting structs

Ticket-019 specified a single `Stage` struct. The implementation decomposed stage-level configuration into three focused supporting structs: `StageStateConfig` (what variables are state), `StageRiskConfig` (CVaR/expectation risk parameters), and `StageSamplingConfig` (branching factor and sampling method). This decomposition was driven by the natural grouping of the `stages.json` schema fields -- each group has its own optional vs required fields and documentation concerns. The resulting `Stage` struct is cleaner and each config type can be documented independently.

### S4: Thermal struct required GnlConfig and ThermalCostSegment auxiliary types

The ticket specified a `Thermal` struct without naming auxiliary types. The implementation added `ThermalCostSegment` (individual segment of the piecewise cost curve) and `GnlConfig` (Gas and Natural Liquids commitment lag configuration) as required supporting structs. Both derive from the `input-system-entities.md` JSON schema tables but were not listed by name in the ticket's requirements.

### S5: 26 validation rules exceed the ticket's 15-rule minimum by 73%

Ticket-020 required a minimum of 15 cross-reference validation rules. The final checklist contains 26 rules. The excess arose from coverage gaps the ticket did not enumerate: lifecycle checks (`entry_stage_id`, `exit_stage_id`) apply to all 6 entity types, not just hydros; the `filling.start_stage_id` hydro reference requires its own rule; GNL lag validation is a structural constraint; coverage checks for inflow model and FPHA hyperplanes are additional structural rules. All 26 rules are genuinely distinct and derivable from the entity schemas.

---

## Recommendations for Subsequent Epics

### R1: Apply base/resolved field annotation to all new struct additions in any spec

The pattern from sections 1.9.2--1.9.8 (`// -- Base fields (loaded from JSON) --` and `// -- Resolved fields (defaults applied during loading) --`) is the standard for all `cobre-core` entity structs. Any future struct additions to `internal-structures.md` must use this pattern. It is especially important for entities with penalty defaults (anything with a `cost` or `penalty` field that may be overridden by `penalties.json`).

### R2: When specifying validation rules, enumerate entity foreign keys first, then count

The correct workflow for validation rule tickets is: (1) read all entity schemas and extract every field ending in `_id`; (2) count distinct referential integrity rules; (3) then add structural rules (acyclicity, self-loop, coverage). The ticket-020 implementation found 15+ referential rules alone, exceeding the minimum before any structural rules were added. Future validation spec tickets should set their minimum rule counts using this methodology.

### R3: Use the OpeningTreeView pattern for all HPC cross-crate data sharing

Any data structure that is generated by one crate and consumed read-only by another should use the `OpeningTree`/`OpeningTreeView` dual-type pattern from `scenario-generation.md` SS2.3a. The generating crate owns the `Box<[f64]>` via the primary struct; the consuming crate receives a `&'a [f64]` slice wrapped in a view struct that provides stride-based accessors. Establish the view type in the same spec section as the primary struct.

### R4: Specify `Box<[f64]>` explicitly in ticket requirements for fixed-size HPC arrays

Ticket-021 did not specify `Box<[f64]>` vs `Vec<f64>` -- the implementation chose `Box<[f64]>` based on the "never resized" invariant. Future tickets for HPC data structures with pre-allocated fixed-size backing arrays (cut pools, solver workspaces, inflow model coefficient arrays) should explicitly require `Box<[f64]>` in their requirements to make the invariant visible in the spec review.

### R5: GAP-020 (output writer API) is the next single highest-leverage spec gap

All 4 output chains remain blocked by GAP-020. The pattern from this epic -- where `load_case` anchors all input chains -- suggests that a single `SimulationWriter` trait would anchor all output chains analogously. Before tackling output chain tickets, resolve GAP-020 first, following the resolution order from the epic-04 accumulated summary: define `SimulationScenarioResult` first (C-14), then design the writer API starting with the metadata/manifest chain.
