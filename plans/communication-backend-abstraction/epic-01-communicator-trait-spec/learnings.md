# Epic 01 Learnings: Communicator Trait and Backend Selection Specification

**Epic**: epic-01-communicator-trait-spec
**Plan**: communication-backend-abstraction
**Extraction date**: 2026-02-25

---

## Patterns Established

- **Single-file trait accumulation**: The four tickets that make up this epic all write into two
  output files (`communicator-trait.md` and `backend-selection.md`) rather than creating four
  separate files. ticket-001 seeded `communicator-trait.md` with SS1-SS3, then ticket-002 appended
  SS4 to the same file. Ticket-003 created `backend-selection.md` independently. Ticket-004 created
  `src/crates/comm.md`. Later epics that add sub-sections to existing spec files should follow the
  same numbered-section accumulation pattern and never rewrite sections already authored by prior
  tickets.

- **Companion-trait separation**: `SharedMemoryProvider` was kept strictly separate from
  `Communicator` rather than merging them. The justification -- message-passing collectives vs.
  persistent memory regions with different lifetime semantics -- is documented in
  `src/specs/hpc/communicator-trait.md` SS4 opening paragraph and must be restated whenever a
  future ticket proposes adding shared-memory methods to the `Communicator` trait.

- **Static dispatch as a non-negotiable design axiom**: Every spec section that touches dispatch
  reaffirms the preference for `C: Communicator` generics over `dyn Communicator`. The rationale
  is repeated across `communicator-trait.md` SS3, `backend-selection.md` SS4, and `comm.md` SS3.
  Future backend spec tickets (Epic 02) must not propose dynamic dispatch on any hot-path call site.

- **HeapFallback as a universal shared-memory substitute**: Rather than making `SharedMemoryProvider`
  optional, every backend type (including local and tcp) implements it via `HeapFallback`. This
  means the training loop can always use the combined bound `C: Communicator + SharedMemoryProvider`
  without runtime feature checks. The HeapFallback semantics table in
  `src/specs/hpc/communicator-trait.md` SS4.4 defines the authoritative contract.

- **Two-level backend selection**: The compile-time / runtime layering (feature flags as primary,
  `COBRE_COMM_BACKEND` env var as secondary) was established in `backend-selection.md` and is the
  canonical pattern for all future Cobre backend selection decisions. The `local` backend is
  unconditional and must never be placed behind a feature flag.

- **Architectural precedent citation**: Every section that makes a design choice consistent with
  solver abstraction explicitly references `solver-abstraction.md §10`. This cross-reference pattern
  must be maintained in all Epic 02-05 tickets that follow the same pattern.

---

## Architectural Decisions

- **`as_mut_slice` on `SharedRegion<T>` rather than a separate `write()` method**: The ticket-002
  spec originally suggested a `fn write(...)` method signature for leader writes, but the
  implementation authored `as_mut_slice(&mut self) -> &mut [T]`. This follows the Rust convention
  of returning a mutable slice instead of accepting write arguments, enabling bulk writes and
  zero-copy population without allocations. File:
  `src/specs/hpc/communicator-trait.md` SS4.2. Rejected alternative: a `fn write(&mut self, data: &[T])`
  method that would require a copy for every write.

- **`split_local()` returns `Box<dyn Communicator>`**: The intra-node communicator split uses
  dynamic dispatch because `split_local()` is initialization-only, not on the hot path. The spec
  acknowledges this explicitly as the one acceptable use of `dyn Communicator`. File:
  `src/specs/hpc/communicator-trait.md` SS4.1. Rejected alternative: generic return type, which
  would require an associated type on `SharedMemoryProvider`, complicating the trait further.

- **`CommError::AllocationFailed` variant added post-ticket-001**: The initial `CommError` enum
  (ticket-001, SS1.4) covered only collective operation failures. Ticket-002 extended the enum with
  `AllocationFailed { requested_bytes, message }` for shared memory allocation rejections. This
  extension happened in-file at SS4.6 of `communicator-trait.md` rather than modifying SS1.4. Future
  tickets that need new error variants should follow this pattern: extend via a numbered sub-section
  rather than going back to edit the original variant list.

- **`CommBackend` enum dispatch for multi-feature builds**: When multiple features are compiled in,
  the factory returns a `CommBackend` enum (not a `Box<dyn Communicator>`). The enum's dispatch
  overhead is quantified in a table (`backend-selection.md` SS4.3) showing it is under 0.0001% for
  every collective. Rejected alternative: returning `Box<dyn Communicator>` from the multi-feature
  factory, which would introduce a vtable lookup on every collective call.

- **`ReduceOp::Max` included speculatively**: The `Max` variant was added to `ReduceOp` beyond
  the two variants (`Sum`, `Min`) required by the current SDDP algorithm, documented as "reserved
  for future use (e.g., maximum per-rank solve time for load balance diagnostics)." File:
  `src/specs/hpc/communicator-trait.md` SS1.3. This follows the pattern of being explicit about
  future-facing API surface while documenting which variants are currently exercised.

- **MPI launch detection uses six environment variables**: The auto-detection algorithm in
  `backend-selection.md` SS2.2 probes for `PMI_RANK`, `PMI_SIZE`, `OMPI_COMM_WORLD_RANK`,
  `OMPI_COMM_WORLD_SIZE`, `MPI_LOCALRANKID`, and `SLURM_PROCID`. This covers MPICH, Intel MPI,
  OpenMPI, and SLURM `srun`. The expanded list (vs. the two variables named in ticket-003's
  implementation guide) was derived from the existing detection logic referenced in
  `cli-and-lifecycle.md §6.3`.

---

## Files and Structures Created

- **`src/specs/hpc/communicator-trait.md`** -- The central trait specification.
  Sections: Purpose | SS1 Trait Definition (1.1 Core Trait, 1.2 CommData, 1.3 ReduceOp, 1.4
  CommError) | SS2 Method Contracts (2.1 allgatherv, 2.2 allreduce, 2.3 broadcast, 2.4 barrier,
  2.5 rank/size) | SS3 Generic Parameterization | SS4 SharedMemoryProvider Trait (4.1 Trait
  Definition, 4.2 SharedRegion Type, 4.3 Leader/Follower Pattern, 4.4 Fallback Strategy, 4.5
  Optional Implementation, 4.6 Error Variant Extension) | Cross-References.

- **`src/specs/hpc/backend-selection.md`** -- The backend selection and factory specification.
  Sections: Purpose | SS1 Compile-Time Feature Flags (1.1 Architectural Precedent, 1.2 Feature
  Flag Matrix, 1.3 Build Profiles, 1.4 Monomorphization) | SS2 Runtime Backend Selection (2.1
  Env Var, 2.2 Auto-Detection Algorithm, 2.3 Single-Feature Behavior) | SS3 Backend Configuration
  (3.1 Per-Backend Env Vars, 3.2 Naming Convention) | SS4 Factory Pattern (4.1 Single-Feature,
  4.2 Multi-Feature Enum Dispatch, 4.3 Dispatch Cost Analysis) | SS5 Library-Mode API (5.1
  Programmatic Selection, 5.2 BackendKind Enum, 5.3 Python Integration, 5.4 MCP Integration) |
  SS6 Error Handling (6.1 Compile-Time, 6.2 Backend Not Compiled, 6.3 Init Failure, 6.4 Missing
  Config, 6.5 Error Precedence) | SS7 Relationship to Init Sequence | Cross-References.

- **`src/crates/comm.md`** -- The crate-level spec for `cobre-comm`.
  Sections: Overview | Key Concepts | SS1 Crate Architecture | SS2 Dependency Graph | SS3 Public
  API (3.1 Traits, 3.2 Types, 3.3 Functions, 3.4 Feature-Gated Backend Types) | SS4 Feature
  Matrix (4.1 Feature Flags, 4.2 Build Profiles) | SS5 Migration Path (5.1 Dependency Changes,
  5.2 Signature Changes, 5.3 Initialization Changes, 5.4 Downstream Feature Selection) | Status |
  Cross-References.

---

## Conventions Adopted

- **Spec document opening**: Every new spec file opens with a `# Title`, then `## Purpose` (one
  paragraph), then numbered sections. The Purpose paragraph states the role of the spec and
  immediately cites the primary architectural precedent. See `communicator-trait.md` and
  `backend-selection.md` Purpose sections.

- **Crate spec opening**: Every `src/crates/*.md` file opens with `# crate-name`,
  then a `<span class="status-experimental">experimental</span>` badge on its own line, then
  `## Overview` (two-paragraph prose), then `## Key Concepts` (bulleted, each with a `See [...]`
  cross-reference), then numbered sections. The `comm.md` file follows `sddp.md` and `core.md`
  exactly.

- **Cross-reference style**: Internal links use `[Section Name §N](./relative-path.md)` for spec
  files within the same directory, and `[Section Name §N](../subdir/file.md)` for cross-directory
  links. Both files use the section symbol (§) rather than "Section". The Cross-References section
  at the bottom of every spec and crate file lists all referenced documents with section granularity.

- **Method contract table format**: For each method in SS2, the spec uses two Markdown tables --
  one for Preconditions, one for Postconditions -- with columns `| Condition | Description |`.
  Each table is followed by prose paragraphs for Determinism, Error semantics, and Thread safety.
  See `communicator-trait.md` SS2.1 through SS2.5.

- **Feature matrix table format**: Feature flag tables use columns
  `| Feature | Backend | External Dependencies | Link-Time Requirements | Binary Size Impact |`
  with `_(always)_` for the unconditional `local` backend and `_(none)_` for test/CI builds with
  no features. This format is duplicated consistently between `backend-selection.md` SS1.2 and
  `comm.md` SS4.1.

- **Build profile table format**: Build profile tables use columns
  `| Build Profile | Cargo Features | Target/Downstream Crate | Rationale |`. Feature cells use
  backtick-wrapped values. Empty feature cells use `_(none)_`.

- **Dependency graph format**: The ASCII dependency graph in `comm.md` SS2 uses `├──` and `└──`
  box-drawing characters with indentation, matching the `src/crates/overview.md` convention. Each
  node shows its feature mode in brackets.

- **Env var tables**: Per-backend environment variable tables use columns
  `| Variable | Required | Default | Description |`. Required-by-MPI-launcher variables use
  `_(set by launcher)_` in the Required column. Variables with no default use `_(none)_`.

- **Before/after migration tables**: The migration path in `comm.md` SS5 uses a two-column
  `| Before | After |` table for dependency changes and signature changes. This is the established
  pattern for any spec that documents a migration from one API to another.

- **File not in SUMMARY.md**: All three output files were created without adding SUMMARY.md
  entries. The tickets explicitly defer that to ticket-012 (Epic 03). Unreferenced files are
  allowed by mdBook but are not navigable from the sidebar.

---

## Surprises and Deviations

- **`as_mut_slice` instead of `write()`**: ticket-002's implementation guide suggested
  `fn write(&mut self, data: &[T])` for the `SharedRegion` write method. The authored spec uses
  `fn as_mut_slice(&mut self) -> &mut [T]` instead, which is more idiomatic Rust (zero-copy
  population, consistent with `std::io::Write` conventions). The deviation was not documented in
  the ticket retrospective, but the choice is visible in `communicator-trait.md` SS4.2 and is
  clearly intentional given the accompanying commentary about distributed population across all
  ranks writing to their own offsets.

- **SS7 added to `backend-selection.md`**: ticket-003's acceptance criteria specify SS1-SS6.
  The authored spec adds a SS7 "Relationship to Initialization Sequence" section mapping each
  backend to the existing initialization sequence specs. This additional section improves
  Epic 03 readiness (it pre-documents which init sequence sections each backend follows), and was
  not flagged as a deviation in the ticket.

- **`BackendKind` enum and `TcpConfig`/`ShmConfig` types**: ticket-003 specifies a programmatic
  API in SS5 but does not name the intermediate enum or config types. The authored spec introduces
  `BackendKind`, `TcpConfig`, and `ShmConfig` as named public API items in `backend-selection.md`
  SS5.2 and propagates them into the `comm.md` SS3.2 public API table. These additions are
  additive and consistent with the intent of SS5 but go beyond what the ticket acceptance criteria
  required.

- **`BackendError` type introduced separately from `CommError`**: The tickets define `CommError`
  for collective operation failures and mention "structured errors per the error kind registry" for
  backend selection errors. The authored spec introduces a distinct `BackendError` enum (covering
  `BackendNotAvailable`, `InvalidBackend`, `InitializationFailed`, `MissingConfiguration`) rather
  than folding backend selection errors into `CommError`. This separation is appropriate -- factory
  failures are fundamentally different from collective operation failures -- and both enums are
  listed in `comm.md` SS3.2.

- **MPI launch detection expanded from 2 to 6 env vars**: ticket-003's implementation guide names
  only `PMI_RANK` and `OMPI_COMM_WORLD_RANK` for MPI launch detection. The authored spec includes
  six variables (`PMI_RANK`, `PMI_SIZE`, `OMPI_COMM_WORLD_RANK`, `OMPI_COMM_WORLD_SIZE`,
  `MPI_LOCALRANKID`, `SLURM_PROCID`), which matches what `cli-and-lifecycle.md §6.3` implies for
  scheduler detection. The expanded list makes the spec more complete and avoids false negatives on
  Intel MPI and SLURM deployments.

- **`comm.md` Status section added**: The `src/crates/comm.md` file includes an explicit `## Status`
  section at the bottom (before Cross-References) that states the crate is in the design phase and
  notes that no Rust code exists yet. This section does not appear in older crate specs (`sddp.md`,
  `core.md`). It is a useful addition for a speculative new crate and was adopted without being
  required by ticket-004.

---

## Recommendations for Future Epics

- **Epic 02 (Backend Implementation Specs)**: Each backend spec (tickets 005-008) should follow
  `backend-selection.md` SS4's factory pattern exactly. The ferrompi backend spec (ticket-005)
  should document the MPI window type mapping to `SharedRegion<T>` using the `SharedRegion` trait
  interface defined in `communicator-trait.md` SS4.2. The `drop` behavior table in SS4.2 is the
  canonical reference. Do not re-specify the `CommError` variants -- reference SS1.4 and SS4.6.

- **Epic 02 (local backend spec, ticket-006)**: The local backend must document how every
  `allgatherv`, `allreduce`, `broadcast`, and `barrier` compiles to zero instructions after
  inlining. The monomorphization guarantee is stated in `backend-selection.md` SS1.4 -- the local
  backend spec should cite this section and verify the claim by referencing the expected assembly
  output.

- **Epic 02 (HeapFallback for tcp and shm)**: The HeapFallback semantics table in
  `communicator-trait.md` SS4.4 is the authoritative contract for how local and tcp backends
  implement `SharedMemoryProvider`. Tickets 007 and 008 must not define their own HeapFallback
  variants -- they should declare that their `SharedMemoryProvider` implementation uses the
  HeapFallback strategy defined in SS4.4 and reference that section.

- **Epic 03 (spec refactoring, tickets 009-013)**: The refactoring tickets will modify
  `hybrid-parallelism.md`, `communication-patterns.md`, and other specs to replace ferrompi
  direct API references with references to `communicator-trait.md`. Use the established
  cross-reference format: `[Communicator Trait §N.M](./communicator-trait.md)`. The initialization
  sequence in `hybrid-parallelism.md §6` will map to the backend-specific init sequences already
  pre-documented in `backend-selection.md` SS7.

- **Epic 03 (SUMMARY.md update, ticket-012)**: The three new files from this epic are not yet in
  SUMMARY.md. ticket-012 must add all three: `src/specs/hpc/communicator-trait.md`,
  `src/specs/hpc/backend-selection.md`, and `src/crates/comm.md`. The last of these belongs in
  the crates section of SUMMARY.md, not the HPC specs section.

- **Epic 04 (Python multi-process spec)**: Python binding tickets (014-016) can reference
  `backend-selection.md` SS5.3 (Python bindings integration) and SS5.4 (MCP server integration)
  directly -- the library-mode API and `BackendKind` enum are already fully specified. These
  sections were written with Epic 04 in mind and should not be re-specified.

- **Epic 05 (conformance testing spec)**: The backend conformance test spec (ticket-017) should
  verify all postconditions listed in `communicator-trait.md` SS2, particularly the rank-ordered
  receive invariant in SS2.1 (critical for SDDP determinism), the `ReduceOp::Sum`
  floating-point tolerance in SS2.2, and the `HeapFallback` no-op `fence()` semantics in SS4.4.
  The determinism invariant established in `communicator-trait.md` SS2.1 is the single most
  important correctness property to test.
