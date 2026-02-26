# ticket-017: Define load_case API and System Crate Boundary Type (GAP-012)

## Context

### Background

The Input Loading Pipeline SS8 "Transition to In-Memory Model" states that in-memory structures are "not specified here" and defers to Internal Structures. Internal Structures SS1 now defines the `System` struct (added in ticket-004), but neither spec provides the public function signature that crosses the cobre-io / cobre-core crate boundary. This is the primary contract for how input data enters the solver: rank 0 calls `load_case` and obtains a `System` value that is then broadcast to all ranks.

### Relation to Epic

This ticket resolves GAP-012 (High severity). It defines the crate boundary API between cobre-io and cobre-core, which is one of the eight crate boundaries in the minimal viable solver (per Implementation Ordering requirement 2: "real crates, real boundaries").

### Current State

- **Internal Structures SS1.1**: Defines the `System` struct with entity collections (`buses: Vec<Bus>`, `hydros: Vec<Hydro>`, etc.), cascade topology, network topology, resolved bounds, and lookup indices. System is `Send + Sync`.
- **Input Loading Pipeline SS1**: Rank-0 centric loading pattern — rank 0 loads, validates, then broadcasts.
- **Input Loading Pipeline SS2**: File loading sequence with 34 ordered steps.
- **Input Loading Pipeline SS6.1**: rkyv serialization for MPI broadcast of the `System` struct.
- **Input Loading Pipeline SS8**: "After loading and broadcasting, each rank constructs its in-memory data model from the loaded data." No function signature.
- **CLI and Lifecycle SS5.2**: Phase table shows Validation (rank 0 only) then Initialization (all ranks: broadcast, memory allocation, solver setup).

## Specification

### Requirements

1. Add a new subsection SS8.1 "load_case Public API" to `input-loading-pipeline.md` within the existing SS8 "Transition to In-Memory Model".
2. Define the function signature:
   ```rust
   /// Load, validate, and resolve a Cobre case from the input directory.
   ///
   /// This is the primary entry point from cobre-cli (rank 0) into cobre-io.
   /// Returns the fully resolved System struct ready for rkyv broadcast.
   ///
   /// # Errors
   /// Returns LoadError if any file cannot be read, parsed, or validated.
   pub fn load_case(path: &Path) -> Result<System, LoadError>
   ```
3. Specify that `path` is the case directory (containing `config.json`), not a single file.
4. Define `LoadError` as an enum with variants covering the loading failure modes:
   - `IoError` — filesystem read failure
   - `ParseError` — JSON/Parquet parsing failure (with file path)
   - `SchemaError` — schema validation failure (with file path and field)
   - `CrossReferenceError` — cross-reference validation failure (with source and target)
   - `ConstraintError` — semantic constraint violation (with description)
5. Specify the function's responsibility boundary: `load_case` performs the complete loading sequence (SS2.1-2.6), cross-reference validation (SS2.6), and returns a fully resolved `System`. It does NOT load policy files (SS2.7) — warm-start policy loading is a separate operation.
6. State that the return type is `System` (owned value, not `Arc<System>`). The caller (cobre-cli or cobre-python) owns the System and is responsible for broadcasting it to worker ranks. After broadcast, each rank owns its own copy.
7. Add a note that `load_case` does NOT accept a `Config` parameter — the config is loaded as step 1 within `load_case` itself (per SS2.1, `config.json` is the first file loaded).
8. Add a cross-reference from SS8.1 to Internal Structures SS1 (System struct) and CLI and Lifecycle SS5.2 (Validation phase).
9. In `internal-structures.md`, add a brief cross-reference note in SS1 mentioning that the System struct is produced by `cobre_io::load_case` (Input Loading Pipeline SS8.1).
10. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-012 as resolved.

### Inputs/Props

- Case directory path
- System struct definition from Internal Structures SS1

### Outputs/Behavior

A `Result<System, LoadError>` where `System` is the fully resolved in-memory data model.

### Error Handling

`LoadError` enum variants are specified in requirement 4. The function returns `Err` on the first validation failure (fail-fast, per SS2 loading sequence).

## Acceptance Criteria

- [ ] Given `input-loading-pipeline.md` SS8, when looking for SS8.1, then a subsection "load_case Public API" exists.
- [ ] Given SS8.1, when reading the function signature, then `pub fn load_case(path: &Path) -> Result<System, LoadError>` is shown.
- [ ] Given SS8.1, when reading the LoadError enum, then at least 5 variants (IoError, ParseError, SchemaError, CrossReferenceError, ConstraintError) are defined.
- [ ] Given SS8.1, when checking the path parameter, then it is described as the case directory containing `config.json`.
- [ ] Given SS8.1, when checking the responsibility boundary, then it states that policy loading is excluded.
- [ ] Given SS8.1, when checking the return type, then it states owned `System` (not `Arc<System>`).
- [ ] Given `internal-structures.md` SS1, when reading the cross-references, then a note mentions `cobre_io::load_case`.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-012 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/input-loading-pipeline.md` and locate SS8.
2. Insert subsection `### 8.1 load_case Public API`.
3. Write the function signature, LoadError enum, responsibility boundary, return type notes, and cross-references.
4. Open `src/specs/data-model/internal-structures.md` and add a cross-reference note in SS1.
5. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
6. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/input-loading-pipeline.md` — Add SS8.1 subsection (primary edit)
- `src/specs/data-model/internal-structures.md` — Add cross-reference note in SS1
- `src/specs/overview/spec-gap-inventory.md` — Add GAP-012 resolution row to Section 7 table

### Patterns to Follow

- **Function signature style**: Follow the pattern in Solver Interface Trait SS1 — Rust function signature in a code block with doc comments.
- **Error enum style**: Follow the pattern of `SolverError` in Solver Interface Trait SS3 — enum with doc comments per variant.
- **Resolution Log row**: Follow existing format.

### Pitfalls to Avoid

- Do NOT include policy loading in `load_case`. Policy loading follows a different pattern (parallel, all ranks) and is a separate API.
- Do NOT use `Arc<System>` as the return type. Ownership transfer is simpler and broadcasting creates a copy anyway.
- Do NOT add a `Config` parameter. The config is loaded as part of the loading sequence.
- Do NOT edit any files beyond the three listed above.

## Testing Requirements

### Unit Tests

Not applicable — specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-004 (System type must be defined first — completed)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
