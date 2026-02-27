# Report 027 -- rkyv Serialization Fitness for System Broadcast

**Date**: 2026-02-26
**Scope**: Evaluate whether rkyv remains the optimal serialization format for the initialization-phase MPI broadcast of the `System` struct, comparing against three alternatives
**Inputs**: `input-loading-pipeline.md` SS6.1--6.4, `internal-structures.md` SS1--16, `binary-formats.md` SS1--3, `cut-management-impl.md` SS4.2a, GAP-003 resolution path
**Method**: Five-dimension evaluation (zero-copy value, derive macro burden, ecosystem overlap, maintenance status, recommendation) across four candidates: rkyv, postcard, manual `#[repr(C)]` native-endian, FlatBuffers

---

## 1. Executive Summary

The recommendation is **REPLACE rkyv with postcard** for the System broadcast use case. The zero-copy deserialization benefit that motivated rkyv adoption is quantitatively immaterial for a once-per-execution broadcast, while the derive macro burden (22+ top-level types, 40+ transitive types, each requiring 3 rkyv-specific derives) is substantial. postcard provides equivalent functionality for this use case -- fast serialization and deserialization of arbitrary Rust types via serde derives already needed for JSON input loading -- with zero additional trait burden, a smaller dependency footprint, active maintenance, and `no_std` support. FlatBuffers is rejected for broadcast because its schema-file-per-type model is poorly suited to deeply nested Rust structs. Manual `#[repr(C)]` is rejected because the `System` struct contains `Vec`, `String`, `Option`, `HashMap`, and enum types that cannot be safely transmuted.

---

## 2. Use Case Characterization

Before evaluating alternatives, the broadcast use case must be precisely characterized, because the access pattern determines which serialization properties have value.

### 2.1 Operation Frequency

The System broadcast occurs **exactly once per program execution**, during the Initialization phase (`input-loading-pipeline.md` SS6). Rank 0 loads and validates the case data, serializes the `System` struct, broadcasts the size (one `MPI_Bcast`), then broadcasts the payload (one `MPI_Bcast`). Each worker rank deserializes the payload into an owned `System` value. After deserialization, the serialized buffer is freed. The buffer is never persisted to disk, never re-read, and never accessed concurrently.

### 2.2 Payload Size Estimate (Production Scale)

The production-scale system specified in `input-loading-pipeline.md` SS6.1 has 160 hydros, 200 thermals, and 120 stages. The following estimates the serialized `System` size:

| Component                                                        | Count     | Estimated Size Per | Subtotal  |
| ---------------------------------------------------------------- | --------- | ------------------ | --------- |
| `Bus` (with deficit segments, String name)                       | 20        | ~200 bytes         | 4 KB      |
| `Line` (10 f64 fields, 2 EntityId, 2 String)                     | 50        | ~180 bytes         | 9 KB      |
| `Hydro` (25+ fields, nested enums, Option types, HydroPenalties) | 160       | ~600 bytes         | 96 KB     |
| `Thermal` (cost segments Vec, GnlConfig Option, Strings)         | 200       | ~200 bytes         | 40 KB     |
| `PumpingStation`                                                 | 10        | ~120 bytes         | 1.2 KB    |
| `EnergyContract`                                                 | 20        | ~120 bytes         | 2.4 KB    |
| `NonControllableSource`                                          | 30        | ~100 bytes         | 3 KB      |
| `Stage` (with Vec of Blocks, nested configs, NaiveDate)          | 120       | ~300 bytes         | 36 KB     |
| `PolicyGraph` (Vec of Transitions, SeasonMap)                    | 1         | ~10 KB             | 10 KB     |
| `CascadeTopology` (adjacency lists, topological order)           | 1         | ~5 KB              | 5 KB      |
| `NetworkTopology` (bus-line incidence, generation maps)          | 1         | ~10 KB             | 10 KB     |
| `ResolvedPenalties` (per entity x stage x penalty_type)          | 1         | ~2 MB              | 2 MB      |
| `ResolvedBounds` (per entity x stage x bound_type)               | 1         | ~1.5 MB            | 1.5 MB    |
| `ParModel` (per hydro x stage: mean, std, AR coefficients)       | 160 x 120 | ~80 bytes          | 1.5 MB    |
| `CorrelationModel` (Cholesky matrices, schedule)                 | 1         | ~500 KB            | 500 KB    |
| `InitialConditions`                                              | 1         | ~5 KB              | 5 KB      |
| `GenericConstraint` (expressions, variable references)           | ~50       | ~500 bytes         | 25 KB     |
| **Serialization overhead** (tags, lengths, alignment padding)    | --        | --                 | ~200 KB   |
| **Total**                                                        |           |                    | **~6 MB** |

The dominant contributors are `ResolvedPenalties` (~2 MB), `ResolvedBounds` (~1.5 MB), and `ParModel` collection (~1.5 MB). The entity struct collections contribute under 200 KB.

**Note**: `HashMap` lookup indices (`bus_index`, `hydro_index`, etc.) are explicitly excluded from serialization per SS6.2 -- each rank rebuilds them locally. This is correct for all candidates.

### 2.3 Deserialization Timing Context

At 6 MB payload size, deserialization timing for the four candidates on modern hardware:

| Library      | Estimated Deser Time                              | Mechanism                                                             |
| ------------ | ------------------------------------------------- | --------------------------------------------------------------------- |
| rkyv         | ~0.05 ms (mmap/zero-copy) + ~2 ms (copy to owned) | Zero-copy archived access, then explicit `Deserialize` to owned types |
| postcard     | ~2--4 ms                                          | Standard serde deserialization into owned types                       |
| FlatBuffers  | ~0.05 ms (zero-copy) + ~3 ms (manual copy)        | Zero-copy field access, then manual copying into Rust structs         |
| `#[repr(C)]` | N/A                                               | Not applicable for this data (see Section 6)                          |

All timings are negligible compared to the MPI broadcast latency itself (~1--5 ms for 6 MB over InfiniBand) and trivially negligible compared to program execution time (minutes to hours). The difference between 2 ms (postcard) and 0.05 ms (rkyv zero-copy access) is **1.95 ms** -- saved exactly once per execution.

---

## 3. Evaluation Dimension 1: Zero-Copy Value

### 3.1 rkyv Zero-Copy Semantics

rkyv's primary value proposition is zero-copy deserialization: the archived byte buffer can be read directly via `ArchivedSystem` without allocating or copying into owned Rust types. However, the `System` struct as designed in `internal-structures.md` SS1.3 uses `Vec<Hydro>`, `String`, `HashMap<EntityId, usize>`, and other heap-allocated types. After zero-copy archived access, the program must eventually convert to owned types because:

1. The `System` is passed as `&System` to `cobre_sddp::train()` and `cobre_sddp::simulate()` -- these expect the standard Rust types, not `ArchivedSystem` types with rkyv's archived `Vec` and `String` equivalents.
2. The HashMap lookup indices are rebuilt locally (SS6.2) and cannot be built from archived data without owned collections.
3. The `System` outlives the receive buffer -- ownership transfer is the design pattern (SS8.1).

This means the rkyv workflow for broadcast is: serialize -> broadcast -> zero-copy access to archived form -> **copy to owned types anyway**. The zero-copy intermediate step is an unnecessary indirection for this use case. The only scenario where zero-copy access is valuable is when the consumer reads fields directly from the archived representation without ever constructing owned types -- which is the cut-loading use case (FlatBuffers in `binary-formats.md` SS3), not the broadcast use case.

### 3.2 Quantitative Assessment

| Metric                    | rkyv             | postcard                                       |
| ------------------------- | ---------------- | ---------------------------------------------- |
| Broadcast frequency       | 1x per execution | 1x per execution                               |
| Payload size              | ~6 MB            | ~5 MB (slightly smaller, no alignment padding) |
| Zero-copy access time     | ~0.05 ms         | N/A                                            |
| Copy-to-owned time        | ~2 ms            | ~2--4 ms (direct to owned)                     |
| **Total deserialization** | **~2 ms**        | **~2--4 ms**                                   |
| Marginal saving           | 0--2 ms, once    | --                                             |

**Verdict**: The zero-copy benefit is **immaterial** for the broadcast use case. The 0--2 ms marginal saving occurs once per execution in a program that runs for minutes to hours. SS6.1's claim that rkyv "eliminates a significant allocation burst on every worker rank during startup" is technically accurate but overstates the practical impact -- a 6 MB allocation burst on startup is not a performance concern for a program that will allocate 28+ GB of cut pool memory during initialization.

---

## 4. Evaluation Dimension 2: Derive Macro Burden

### 4.1 Complete Type Inventory

SS6.2 lists 20 top-level types requiring `rkyv::Archive + rkyv::Serialize + rkyv::Deserialize`. The full inventory, including transitive nested types from `internal-structures.md`, is:

**Top-level types (from SS6.2):**

| #   | Type                    | Source  |
| --- | ----------------------- | ------- |
| 1   | `System`                | SS1.3   |
| 2   | `Bus`                   | SS1.9.2 |
| 3   | `Line`                  | SS1.9.3 |
| 4   | `Hydro`                 | SS1.9.4 |
| 5   | `Thermal`               | SS1.9.5 |
| 6   | `PumpingStation`        | SS1.9.6 |
| 7   | `EnergyContract`        | SS1.9.7 |
| 8   | `NonControllableSource` | SS1.9.8 |
| 9   | `Stage`                 | SS12.6  |
| 10  | `PolicyGraph`           | SS12.10 |
| 11  | `CascadeTopology`       | SS1.5   |
| 12  | `NetworkTopology`       | SS1.5b  |
| 13  | `ResolvedPenalties`     | SS10    |
| 14  | `ResolvedBounds`        | SS11    |
| 15  | `ParModel`              | SS14    |
| 16  | `CorrelationModel`      | SS14    |
| 17  | `InitialConditions`     | SS16    |
| 18  | `GenericConstraint`     | SS15    |

**Transitive nested types (must also derive the same traits):**

| #   | Type                          | Parent                | Source       |
| --- | ----------------------------- | --------------------- | ------------ |
| 19  | `EntityId`                    | All entities          | SS1.8        |
| 20  | `DeficitSegment`              | `Bus`                 | SS1.9.2      |
| 21  | `HydroGenerationModel` (enum) | `Hydro`               | SS1.9.1      |
| 22  | `TailraceModel` (enum)        | `Hydro`               | SS1.9.1      |
| 23  | `TailracePoint`               | `TailraceModel`       | SS1.9.1      |
| 24  | `HydraulicLossesModel` (enum) | `Hydro`               | SS1.9.1      |
| 25  | `EfficiencyModel` (enum)      | `Hydro`               | SS1.9.1      |
| 26  | `DiversionChannel`            | `Hydro`               | SS1.9.4      |
| 27  | `FillingConfig`               | `Hydro`               | SS1.9.4      |
| 28  | `HydroPenalties`              | `Hydro`               | SS1.9.4      |
| 29  | `ThermalCostSegment`          | `Thermal`             | SS1.9.5      |
| 30  | `GnlConfig`                   | `Thermal`             | SS1.9.5      |
| 31  | `ContractType` (enum)         | `EnergyContract`      | SS1.9.1      |
| 32  | `Block`                       | `Stage`               | SS12.2       |
| 33  | `BlockMode` (enum)            | `Stage`               | SS12.1       |
| 34  | `StageStateConfig`            | `Stage`               | SS12.3       |
| 35  | `StageRiskConfig` (enum)      | `Stage`               | SS12.4       |
| 36  | `StageSamplingConfig`         | `Stage`               | SS12.5       |
| 37  | `SamplingMethod` (enum)       | `StageSamplingConfig` | SS12.1       |
| 38  | `Transition`                  | `PolicyGraph`         | SS12.9       |
| 39  | `SeasonMap`                   | `PolicyGraph`         | SS12.8       |
| 40  | `SeasonDefinition`            | `SeasonMap`           | SS12.7       |
| 41  | `SeasonCycleType` (enum)      | `SeasonMap`           | SS12.1       |
| 42  | `PolicyGraphType` (enum)      | `PolicyGraph`         | SS12.10      |
| 43  | `NaiveDate` (external type)   | `Stage`               | chrono crate |

**Total: 43 types** (18 top-level + 25 transitive).

### 4.2 Derive Annotation Comparison

| Library                  | Required Derives Per Type                                           | Total Annotations (43 types)                      | External Type Handling                                                                                      |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **rkyv**                 | `rkyv::Archive`, `rkyv::Serialize`, `rkyv::Deserialize` (3 derives) | **129**                                           | Requires wrapper types or `#[rkyv(with = ...)]` for `chrono::NaiveDate`, `HashMap` exclusion                |
| **postcard** (via serde) | `serde::Serialize`, `serde::Deserialize` (2 derives)                | **86**                                            | Native serde support; `NaiveDate` has serde impl via `chrono/serde`. `#[serde(skip)]` for HashMap exclusion |
| **FlatBuffers**          | Schema file definition per type (not derive macros)                 | 43 schema entries in `.fbs` file + generated code | Manual mapping between FlatBuffers types and Rust types                                                     |
| **`#[repr(C)]`**         | `#[repr(C)]` + custom ser/deser (no derive)                         | N/A                                               | Not applicable (see Section 6)                                                                              |

### 4.3 rkyv-Specific Burden

Beyond the raw annotation count, rkyv imposes additional burdens:

1. **Archived type parallel hierarchy**: rkyv generates an `ArchivedFoo` type for each `#[derive(rkyv::Archive)]` type. This doubles the effective type count in IDE autocomplete, documentation, and error messages. For 43 types, that is 43 additional archived types in the type namespace.

2. **External type wrappers**: `chrono::NaiveDate` does not implement rkyv traits natively. This requires either a newtype wrapper with manual `Archive` impl or the `rkyv::with` attribute pointing to a custom serializer. Neither option is zero-effort.

3. **HashMap exclusion**: SS6.2 states HashMap fields are excluded. With rkyv, this requires `#[rkyv(skip)]` or restructuring the `System` struct. With serde (used by postcard), the equivalent `#[serde(skip)]` is already a well-known pattern.

4. **rkyv 0.8 migration**: rkyv 0.8 introduced breaking API changes from 0.7 (the `Archived` type system was reworked). Pinning to 0.8+ as SS6.1 specifies is correct, but the 0.7-to-0.8 migration experience in the Rust ecosystem has been documented as painful, suggesting API stability is a concern.

5. **Compile time**: rkyv's procedural macros are heavier than serde's. For 43 types, this adds measurable compile time to `cobre-core` -- the foundational crate that all other crates depend on.

### 4.4 serde Derives Are Already Required

The `System` struct and all entity types must already implement `serde::Serialize` and `serde::Deserialize` for JSON input loading (`cobre-io` deserializes from JSON via serde). This means the 86 serde derive annotations are **already present** in the codebase regardless of the broadcast serialization choice. postcard uses serde, so choosing postcard for broadcast adds **zero additional derive annotations** to `cobre-core` types.

In contrast, rkyv adds **129 additional annotations** on top of the 86 serde annotations already needed, for a total of 215 derive annotations across the 43 types -- purely to support a single once-per-execution broadcast operation.

**Verdict**: The derive macro burden of rkyv is **substantial and entirely additional** to the serde derives already required. postcard eliminates this burden completely by reusing existing serde derives.

---

## 5. Evaluation Dimension 3: Ecosystem and Dependency Overlap

### 5.1 Current Dependency Landscape

| Dependency    | Used For                                           | Already Required                         |
| ------------- | -------------------------------------------------- | ---------------------------------------- |
| `serde`       | JSON input loading, configuration parsing          | Yes (mandatory)                          |
| `serde_json`  | JSON file deserialization                          | Yes (mandatory)                          |
| `flatbuffers` | Policy persistence (cuts, states, vertices, basis) | Yes (mandatory, `binary-formats.md` SS3) |
| `rkyv`        | System broadcast (if kept)                         | Only for broadcast                       |
| `postcard`    | System broadcast (if adopted)                      | No (new, but tiny)                       |

### 5.2 FlatBuffers Overlap Analysis

FlatBuffers is already a project dependency for policy persistence. Could it also serve for broadcast, eliminating rkyv without adding postcard?

**Arguments for reusing FlatBuffers:**

- Eliminates one dependency (rkyv or postcard)
- Zero-copy access genuinely useful if the archived form were used directly

**Arguments against FlatBuffers for broadcast:**

1. **Schema file burden**: FlatBuffers requires a `.fbs` schema file defining every type. The `System` struct has 43 types with deeply nested enums, `Option` fields, variable-length `Vec` members, and `String` fields. Writing and maintaining a 43-type FlatBuffers schema that mirrors the Rust types is a significant ongoing maintenance burden. The policy schema (`binary-formats.md` SS3.1) is tractable because cuts have a flat, regular structure. The `System` struct does not.

2. **No derive macro integration**: FlatBuffers types are generated from `.fbs` schemas via `flatc`. There is no derive macro that converts existing Rust structs to FlatBuffers. This means manual builder code to pack `System` into FlatBuffers and manual accessor code to unpack it -- hundreds of lines of boilerplate for 43 types.

3. **Builder API ergonomics**: FlatBuffers' builder pattern requires constructing objects inside-out (nested objects first, then parents). For the `System` struct with its deep nesting (`System` -> `Hydro` -> `HydroGenerationModel` -> `Fpha` -> coefficient arrays), the builder code would be complex and fragile.

4. **Different strength**: FlatBuffers excels at dense homogeneous arrays (cut coefficients as `[double]`) and simple flat structures. It is poorly suited to heterogeneous, deeply nested, enum-rich structs like `System`.

**Verdict**: FlatBuffers is **not suitable** for the System broadcast use case. It should remain dedicated to policy persistence where its strengths (zero-copy access to dense coefficient arrays) are genuinely valuable.

### 5.3 postcard Dependency Weight

postcard is a lightweight binary serde format. Its dependency profile:

- **Crate size**: ~15 KB of source (one of the smallest serde format crates)
- **Dependencies**: only `serde` (already required) + `cobs` (tiny, no-std)
- **Compile time impact**: negligible
- **`no_std` compatible**: yes, which is irrelevant here but indicates minimal runtime requirements
- **License**: MIT OR Apache-2.0 (compatible with Cobre)

Adding postcard introduces one small, well-maintained dependency while eliminating rkyv (a substantially larger and more complex dependency).

**Verdict**: postcard has **minimal ecosystem footprint** and leverages the serde dependency already present. The net effect of replacing rkyv with postcard is a reduction in total dependency weight.

---

## 6. Evaluation Dimension 4: Manual `#[repr(C)]` Native-Endian

The `#[repr(C)]` native-endian byte reinterpretation pattern used for the cut wire format (`cut-management-impl.md` SS4.2a) is evaluated for completeness.

### 6.1 Why It Works for Cuts

The `CutWireRecord` is a fixed-size struct with only primitive types (`u32`, `f64`) and a trailing `[f64; 0]` array. It has:

- No heap allocations (`Vec`, `String`)
- No tagged unions (`enum` with data)
- No optional fields (`Option<T>`)
- No variable-length nested structures
- A known, fixed layout determined at compile time

### 6.2 Why It Cannot Work for System

The `System` struct contains:

| Feature             | Present in System                                                      | Compatible with `#[repr(C)]` transmute                    |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `Vec<T>`            | Yes (7 entity collections, blocks, transitions, etc.)                  | No -- `Vec` is (ptr, len, cap), pointer is process-local  |
| `String`            | Yes (entity names)                                                     | No -- `String` is a `Vec<u8>` internally                  |
| `HashMap<K, V>`     | Yes (7 lookup indices, but excluded from serialization)                | No                                                        |
| `Option<T>`         | Yes (lifecycle stage IDs, optional hydro data)                         | Partial -- only for `Option<primitive>` with known niche  |
| `enum` with data    | Yes (`HydroGenerationModel`, `TailraceModel`, `StageRiskConfig`, etc.) | No -- discriminant + data layout is not `#[repr(C)]` safe |
| `chrono::NaiveDate` | Yes (in `Stage`)                                                       | No -- internal representation is not guaranteed stable    |

A manual `#[repr(C)]` approach would require flattening the entire `System` graph into a contiguous byte buffer with an offset table -- which is exactly what rkyv and serde-based formats do, but with the additional burden of writing and maintaining custom serialization code for 43 types.

**Verdict**: Manual `#[repr(C)]` is **not applicable** to the System broadcast use case. It is correctly used for the cut wire format where the data is a fixed-size struct of primitives.

---

## 7. Evaluation Dimension 5: Maintenance Status and Crate Maturity

### 7.1 rkyv

| Metric                   | Value                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| crates.io version        | 0.8.10 (as of early 2026)                                                 |
| Last significant release | 0.8.0 released mid-2025 (major rewrite from 0.7)                          |
| GitHub activity          | Moderate; single primary maintainer (David Koloski)                       |
| Open issues              | ~50--80                                                                   |
| Breaking changes history | 0.7 -> 0.8 was a major breaking change affecting all users                |
| Ecosystem adoption       | Used by some high-profile projects, but serde-based formats dominate      |
| Documentation quality    | Improved significantly in 0.8, but still less mature than serde ecosystem |

**Concerns**: The 0.7 -> 0.8 migration was disruptive. As a single-maintainer project, bus factor is 1. The API surface is large and complex (archived types, serializers, deserializers, validators, alignment allocators). For a use case that derives no material benefit from rkyv's unique features (zero-copy), depending on it introduces risk without commensurate reward.

### 7.2 postcard

| Metric                   | Value                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| crates.io version        | 1.1.x (stable 1.0 since 2024)                                             |
| Last release             | Active, regular maintenance releases                                      |
| GitHub activity          | Active; maintained by James Munns (OneVariable, formerly Ferrous Systems) |
| Open issues              | ~10--20                                                                   |
| Breaking changes history | 1.0 release was stable; no breaking changes since                         |
| Ecosystem adoption       | Widely used in embedded Rust; growing in general Rust                     |
| Documentation quality    | Good; simple API surface (serialize/deserialize with serde)               |

**Strengths**: postcard reached 1.0 stability, has an active maintainer with strong Rust community standing, and its API surface is minimal (two functions: `to_vec`/`from_bytes` using serde). The simplicity of its API means there is little surface area for breaking changes.

### 7.3 Comparison

| Criterion                       | rkyv                                           | postcard                          |
| ------------------------------- | ---------------------------------------------- | --------------------------------- |
| API stability                   | 0.8.x (pre-1.0, major breaking change history) | 1.1.x (post-1.0, stable)          |
| Maintainer count                | 1                                              | 1 (but simpler codebase)          |
| API complexity                  | High (archived types, alignment, validators)   | Low (serde serialize/deserialize) |
| Risk of future breaking changes | Moderate-high (complex API, pre-1.0)           | Low (simple API, post-1.0)        |

**Verdict**: postcard has a **stronger maintenance profile** for a dependency that Cobre will rely on for the lifetime of the project. rkyv's pre-1.0 status and breaking-change history introduce unnecessary supply-chain risk for a use case that does not exploit its unique capabilities.

---

## 8. Consolidated Comparison Matrix

| Dimension                                | rkyv                                       | postcard                            | FlatBuffers                             | `#[repr(C)]`             |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------- | --------------------------------------- | ------------------------ |
| **Zero-copy value** (once-per-exec)      | Immaterial (0--2 ms saved once)            | N/A                                 | Immaterial                              | N/A                      |
| **Derive burden** (additional to serde)  | +129 annotations on 43 types               | **0** (reuses serde)                | 43-type `.fbs` schema + manual builders | Custom code for 43 types |
| **Dependency overlap**                   | New dependency                             | Reuses serde                        | Already present                         | No dependency            |
| **Maintenance status**                   | 0.8.x, single maintainer, breaking history | 1.1.x stable, active                | Mature (Google)                         | N/A                      |
| **Suitability for nested Rust structs**  | Good                                       | Good                                | Poor                                    | Not applicable           |
| **Payload size (6 MB)**                  | Larger (alignment padding)                 | Smaller (varint encoding)           | Larger (vtable overhead)                | N/A                      |
| **External type handling** (`NaiveDate`) | Requires wrapper/`with` attr               | Native via chrono serde feature     | Manual schema entry                     | Manual                   |
| **HashMap exclusion**                    | `#[rkyv(skip)]`                            | `#[serde(skip)]` (already familiar) | N/A (not in schema)                     | N/A                      |

---

## 9. Recommendation

**REPLACE rkyv with postcard** for the System broadcast serialization.

**Rationale (3 sentences)**: The zero-copy deserialization that motivated rkyv adoption provides less than 2 milliseconds of benefit on a once-per-execution operation, while imposing 129 additional derive annotations across 43 types -- on top of the 86 serde derives already required for JSON loading. postcard achieves equivalent broadcast functionality with zero additional derive burden by reusing the serde traits that cobre-core types must implement regardless, is post-1.0 stable, and has a smaller dependency footprint than rkyv. The net effect is a simpler codebase, faster compile times, and reduced supply-chain risk with no measurable performance regression.

---

## 10. Required Spec Changes

The following changes to `input-loading-pipeline.md` are required to implement this recommendation. Changes are confined to SS6.1--6.4 as specified in the ticket scope.

### 10.1 SS6.1 Serialization Format

**Current**: "The serialization format for MPI broadcast is **rkyv** (version 0.8+)."
**Updated**: Replace with postcard. Remove the zero-copy deserialization justification. Replace the "Why not bincode" paragraph with "Why not rkyv" and "Why postcard" paragraphs.

### 10.2 SS6.2 Required Trait Bounds

**Current**: All types derive `rkyv::Archive`, `rkyv::Serialize`, `rkyv::Deserialize`.
**Updated**: All types derive `serde::Serialize` and `serde::Deserialize` (which they already must for JSON loading). No additional broadcast-specific trait bounds. Remove the rkyv derive example. Replace with serde derive example and postcard usage.

### 10.3 SS6.3 Alignment and Buffer Allocation

**Current**: "rkyv requires **16-byte alignment** for archived data by default."
**Updated**: postcard produces a standard `Vec<u8>` with no alignment requirements. Remove the aligned allocation requirement. The two-step broadcast protocol (size first, then contents) remains unchanged, but the receive buffer is a standard `Vec<u8>`.

### 10.4 SS6.4 Versioning Scope

**Current**: "rkyv does **not** provide built-in schema evolution."
**Updated**: postcard (via serde) does not provide automatic schema evolution either -- changing struct fields breaks deserialization. The same justification applies: broadcast data is in-memory only, all ranks run the same binary, no cross-version compatibility needed. The paragraph about rkyv not being suitable for long-term storage remains valid with s/rkyv/postcard/ -- postcard is also not used for persistence (FlatBuffers handles that).

### 10.5 SS8.1 load_case API and References

**Current**: Multiple references to "rkyv broadcast", "rkyv serialization protocol".
**Updated**: Replace with "postcard serialization" or generic "binary serialization for MPI broadcast".
