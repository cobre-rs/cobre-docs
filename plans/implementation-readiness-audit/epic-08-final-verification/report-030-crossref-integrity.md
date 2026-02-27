# Cross-Reference Integrity Report — Ticket 030

**Ticket**: ticket-030-verify-crossref-integrity.md
**Agent**: implementation-guardian
**Date**: 2026-02-26T21:55:19-03:00
**Scope**: Files modified in Epics 05-07 (20 files); cross-reference index; mdBook build

---

## 1. mdBook Build Result

**Status: PASS**

Command: `mdbook build` executed from `/home/rogerio/git/cobre-docs`

Exit code: `0`

Warnings (all pre-existing, none introduced by Epics 05-07):

- `specs/math/risk-measures.md`: 10 warnings for unclosed `<span>` and unexpected `</span>` tags (known cosmetic issue, documented in project memory)
- `mdbook-katex` version mismatch warning: built against v0.5.1, called from v0.5.2 (pre-existing, non-blocking)
- Search index size warning: 10,065,094 bytes (pre-existing)

No errors. No broken internal links detected by the mdBook HTML backend. The book was successfully written to `/home/rogerio/git/cobre-docs/book`.

---

## 2. Pass A Findings — New Section Cross-Reference Completeness

Pass A checks whether new sections added in Epics 05-07 are bidirectionally referenced by the files that should reference them.

### A1. Does `output-infrastructure.md` SS6 reference `simulation-architecture.md` SS3.4?

**PASS**

Evidence from `output-infrastructure.md` Cross-References section (line 808):

```
- [Simulation Architecture](../architecture/simulation-architecture.md) — `SimulationScenarioResult` type
  (SS3.4.3), bounded channel streaming (SS6.1), `fn simulate()` signature (SS3.4.6)
```

Additionally, SS6.2 body text (line 424) references SS3.4.3 directly, and SS6.1 body text (line 340) cites SS6.1 of simulation-architecture. The cross-reference is specific, correct, and bidirectional.

### A2. Does `simulation-architecture.md` SS3.4 reference `output-infrastructure.md` SS6?

**PARTIAL PASS — with one gap**

`simulation-architecture.md` references `output-infrastructure.md` in two places:

- Line 7 (file preamble): general reference, no section
- Line 753 (SS6.3 body): `See [Output Infrastructure SS1.1](../data-model/output-infrastructure.md)` — cites SS1.1
- Line 770 (Cross-References): `[Output Infrastructure](../data-model/output-infrastructure.md) — Manifests, MPI partitioning, crash recovery`

**Gap**: The Cross-References entry for `output-infrastructure.md` in `simulation-architecture.md` is a generic description ("Manifests, MPI partitioning, crash recovery") that does not acknowledge the new SS6 (`Output Writer API`). SS3.4 result types are consumed by `SimulationParquetWriter` (output-infrastructure.md SS6.2), but SS3.4 contains no forward reference to output-infrastructure.md SS6. The SS6.1 streaming section of simulation-architecture.md references `output-schemas.md` for the column definitions but does not link to output-infrastructure.md SS6.2 (`SimulationParquetWriter`) where the actual writer consuming those results is specified.

Severity: **Low** — The link to output-infrastructure.md exists; only the section precision and SS6 acknowledgment are missing.

### A3. Does `simulation-architecture.md` SS6.1 reference `output-infrastructure.md` SS6.3 (`SimulationParquetWriter`)?

**FAIL — MISSING CROSS-REFERENCE**

`simulation-architecture.md` SS6.1 ("Streaming Architecture", lines 724-736) describes the bounded channel architecture and the background I/O thread, but contains no link to `output-infrastructure.md` SS6.2 (`SimulationParquetWriter`) or SS6 generally. The entire SS6 section of simulation-architecture.md mentions only `output-schemas.md` (for column definitions) and `output-infrastructure.md` SS1.1 (for manifest writing). The API of the I/O thread consumer (`SimulationParquetWriter`) is defined in output-infrastructure.md SS6.2, but SS6.1 of simulation-architecture does not cite it.

Command confirming no `SimulationParquetWriter` reference in simulation-architecture.md:

```
grep -n "SimulationParquetWriter\|output-infrastructure.*SS6" src/specs/architecture/simulation-architecture.md
# returns no output
```

Severity: **High** — A reader of simulation-architecture.md SS6.1 cannot follow the chain from "background I/O thread" to the concrete writer implementation without knowing to look in output-infrastructure.md SS6.

### A4. Do `internal-structures.md` SS1-SS12 sections get referenced from `input-system-entities.md`?

**PASS**

`input-system-entities.md` Cross-References section (line 795):

```
- [Internal Structures](internal-structures.md) — runtime in-memory data model, pre-resolved penalties and bounds
```

Additionally, inline references within `input-system-entities.md` cite specific sections of `internal-structures.md`:

- Line 578: `See [Internal Structures §4](internal-structures.md)` (Thermal runtime model)
- Line 788: `See [Internal Structures §9](internal-structures.md)` (Non-controllable source)

Conversely, `internal-structures.md` reciprocates with explicit `input-system-entities.md` references in its Cross-References section and throughout the struct definitions (e.g., `/// Source: system/buses.json. See Input System Entities §1`).

The new SS1-SS12 sections in `internal-structures.md` are logically covered by the existing generic cross-reference entry.

### A5. Does `input-loading-pipeline.md` SS6.1 (postcard) get referenced from `binary-formats.md` or its Cross-References section?

**FAIL — MISSING CROSS-REFERENCE**

`binary-formats.md` Cross-References section (lines 395-407) does not mention `input-loading-pipeline.md` in any capacity. No `postcard` mentions appear in `binary-formats.md` at all:

```
grep -n "postcard\|input-loading-pipeline" src/specs/data-model/binary-formats.md
# returns no output
```

`binary-formats.md` is the canonical spec for serialization format decisions. The adoption of `postcard` for MPI broadcast (input-loading-pipeline.md SS6.1) is a significant serialization decision made after `binary-formats.md` was authored. `binary-formats.md` §2 (Format Summary by Category) lists formats for each data category but does not include the "MPI broadcast" category that postcard serves. The decision is documented only in `input-loading-pipeline.md` SS6.1.

Severity: **High** — `binary-formats.md` is the primary navigation destination for a developer researching serialization choices. The absence of a postcard reference means the MPI broadcast serialization format is invisible to a reader consulting `binary-formats.md` as the format authority.

---

## 3. Pass B Findings — Stale Identifier Audit

### B1. `split_shared_memory` — expect 0 results in live specs

**PASS**

```
grep -rn "split_shared_memory" src/specs/
# returns no output
```

Zero occurrences in all 76 spec files. The rename to `split_shared` is complete.

### B2. `ferrompi::slurm` — expect 0 results in live specs

**PASS**

```
grep -rn "ferrompi::slurm" src/specs/
# returns no output
```

Zero occurrences in all 76 spec files. The rename to `cobre_comm::slurm` is complete.

### B3. `patch_rhs_bounds` — expect 0 results in live specs (excluding `spec-gap-inventory.md`)

**PASS**

```
grep -rn "patch_rhs_bounds" src/specs/ | grep -v "spec-gap-inventory"
# returns no output
```

All live spec files use the new method names `patch_row_bounds` (SS2.3) and `patch_col_bounds` (SS2.3a). The 3 occurrences in `spec-gap-inventory.md` are historical changelog references to the original name and are explicitly acceptable per ticket scope.

`solver-interface-testing.md` correctly uses `patch_row_bounds` and `patch_col_bounds` throughout (verified at lines 170, 174, 175, 177, 185, 186 and the preamble at line 5).

### B4. `rkyv` in `input-loading-pipeline.md` — expect only in "Why postcard over rkyv" paragraph

**PASS**

```
grep -n "rkyv" src/specs/architecture/input-loading-pipeline.md
# line 196: **Why postcard over rkyv:** rkyv was previously specified...
```

Exactly one occurrence, at line 196, within the "Why postcard over rkyv" comparison paragraph. No other references remain. The rkyv serialization specification has been fully replaced by postcard in SS6.1-6.4.

**Observation (out-of-scope, informational only)**: `ecosystem-guidelines.md` (lines 290-292, 392, 422) still prescribes `rkyv` for "binary serialization of policy data" and lists GAP-003 as resolved with `rkyv`. These references are in `ecosystem-guidelines.md`, which was NOT modified in Epics 05-07 and is NOT in scope of this audit. However, `binary-formats.md` specifies FlatBuffers (not rkyv) for policy data — a pre-existing inconsistency between ecosystem-guidelines.md and binary-formats.md that predates Epics 05-07. This is flagged here as informational only; it is not introduced by the current editing epics.

---

## 4. Pass C Findings — Cross-Reference Index Consistency

The cross-reference index (`src/specs/cross-reference-index.md`) was batch-updated in Epic 06 (ticket-026). Epic 07 added content to `simulation-architecture.md` (SS3.4), `output-infrastructure.md` (SS6), and `input-loading-pipeline.md` (SS6 rkyv → postcard). The index was NOT re-updated after Epic 07.

### C1. Section 3 (Outgoing Refs) — `output-infrastructure.md`

**FAIL — INDEX INCONSISTENCY**

The Section 3 row for `output-infrastructure.md` (line 381) lists 13 outgoing references:

```
output-schemas, binary-formats, input-system-entities, penalty-system,
configuration-reference, input-directory-structure, production-scale-reference,
stopping-rules, cut-management, risk-measures, upper-bound-evaluation,
block-formulations, design-principles
```

The **actual** Cross-References section of `output-infrastructure.md` (lines 792-809) lists 16 entries, including three that are **absent from the index**:

- `simulation-architecture.md` — added in Epic 07 (SS6 references SS3.4.3, SS6.1, SS3.4.6)
- `input-loading-pipeline.md` — added in Epic 07 (`load_case`/`LoadError` pattern mirrored by SS8.1)
- `training-loop.md` — added in Epic 07 (training iteration lifecycle, SS2.1)

### C2. Section 3 (Outgoing Refs) — `simulation-architecture.md`

**PARTIAL — PRE-EXISTING INCOMPLETENESS**

The Section 3 row for `simulation-architecture.md` (line 389) lists 10 outgoing references. The actual Cross-References section lists 18 entries. Absent from the index:

- `solver-interface-trait.md` (referenced for monomorphization pattern, SS5)
- `communicator-trait.md` (referenced for generic communicator backend, §3)
- `internal-structures.md` (referenced for `System` struct §1, `EntityId` §1.8, `Stage`/`Block` §12)
- `binary-formats.md` (referenced for policy file format §3.2)
- `penalty-system.md` (referenced for three-category cost taxonomy §2)
- `deferred.md` appears in the index but only once — the file is actually referenced four times for SSC.1, SSC.6, SSC.9, SSC.13

Note: `output-infrastructure.md` IS correctly listed in section 3 for simulation-architecture.md (the Epic 07 linkage is already present). The incompleteness noted above is **pre-existing** (present before Epic 07) and not introduced by Epics 05-07 edits.

### C3. Section 3 (Outgoing Refs) — `input-loading-pipeline.md`

**PASS**

The Section 3 row for `input-loading-pipeline.md` (line 392) lists 12 outgoing references, which matches the 12 entries in the file's actual Cross-References section. All references are present:

```
input-directory-structure, internal-structures, cli-and-lifecycle,
validation-architecture, design-principles, configuration-reference,
input-system-entities, input-scenarios, input-constraints, par-inflow-model,
binary-formats, penalty-system
```

The postcard adoption in SS6.1 added no new outgoing cross-reference entries (the postcard format decision references `binary-formats.md`, which was already listed).

### C4. Section 4 (Incoming Refs) — `output-infrastructure.md`

**FAIL — INDEX INCONSISTENCY**

The Section 4 row for `output-infrastructure.md` (line 494) lists 5 incoming references:

```
output-schemas, cli-and-lifecycle, simulation-architecture, checkpointing, binary-formats
```

Verification of actual files containing `output-infrastructure` in their Cross-References section reveals a **6th file** not in the index:

- `structured-output.md` — contains `output-infrastructure.md` in its Cross-References section

This omission is pre-existing (not introduced by Epics 05-07 edits).

### C5. Section 4 (Incoming Refs) — `simulation-architecture.md`

**FAIL — INDEX INCONSISTENCY**

The Section 4 row for `simulation-architecture.md` (line 502) lists 4 incoming references:

```
block-formulations, hydro-production-models, deferred, implementation-ordering
```

Verification shows:

- `output-infrastructure.md` has `simulation-architecture.md` in its Cross-References section (added Epic 07) — **absent from index**
- `implementation-ordering.md` does NOT have `simulation-architecture.md` in its Cross-References section — it has only an inline table reference — **erroneously listed in index**

Net: Section 4 for simulation-architecture.md should add `output-infrastructure.md` and remove `implementation-ordering.md`.

### C6. Section 4 (Incoming Refs) — `input-loading-pipeline.md`

**FAIL — INDEX INCONSISTENCY**

The Section 4 row for `input-loading-pipeline.md` (line 505) lists 5 incoming references:

```
cli-and-lifecycle, validation-architecture, training-loop, scenario-generation, spec-gap-inventory
```

Verification of actual files containing `input-loading-pipeline` in their Cross-References section reveals:

- `internal-structures.md` has `input-loading-pipeline.md` in its Cross-References — **absent from index**
- `output-infrastructure.md` has `input-loading-pipeline.md` in its Cross-References (added Epic 07) — **absent from index**
- `spec-gap-inventory.md` does NOT have a formal Cross-References section entry for `input-loading-pipeline` — it has only inline table references — **erroneously listed in index**

Net: Section 4 for input-loading-pipeline.md should add `internal-structures.md` and `output-infrastructure.md`, and remove `spec-gap-inventory.md`.

### C7. Section 5 (Dependency Ordering) — Topological Validity

**PASS — with note**

Section 5 entries for the three key files (lines 615, 620, 623):

```
|    47 | output-infrastructure.md     | data-model    | 5 incoming |
|    52 | input-loading-pipeline.md    | architecture  | 5 incoming |
|    55 | simulation-architecture.md   | architecture  | 4 incoming |
```

The topological ordering places `output-infrastructure.md` (position 47) before `simulation-architecture.md` (position 55), which is appropriate since simulation-architecture.md references output-infrastructure.md. The new Epic 07 cross-references do not create any cycles in the dependency graph. The incoming counts are now stale (as noted in C4-C6 above), but the relative ordering remains topologically valid.

---

## 5. Summary Findings Table

| #   | Category                | Severity | Affected File(s)                                                   | Description                                                                                                                                                                                                                                        |
| --- | ----------------------- | -------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | MISSING CROSS-REFERENCE | High     | `simulation-architecture.md` SS6.1                                 | SS6.1 describes the bounded channel and background I/O thread but does not link to `output-infrastructure.md` SS6.2 (`SimulationParquetWriter`) where the consumer is specified                                                                    |
| F2  | MISSING CROSS-REFERENCE | High     | `binary-formats.md`                                                | No reference to `input-loading-pipeline.md` SS6.1 or to `postcard` as the MPI broadcast serialization format; `binary-formats.md` is the canonical format authority and is missing the postcard/MPI broadcast category entirely                    |
| F3  | MISSING CROSS-REFERENCE | Low      | `simulation-architecture.md` Cross-References                      | The Cross-References entry for `output-infrastructure.md` lacks section precision — does not acknowledge the new SS6 (Output Writer API) that SS3.4 types feed into                                                                                |
| F4  | INDEX INCONSISTENCY     | High     | `cross-reference-index.md` §3 row for `output-infrastructure.md`   | Three outgoing references missing from Section 3: `simulation-architecture.md`, `input-loading-pipeline.md`, `training-loop.md` (all added by Epic 07)                                                                                             |
| F5  | INDEX INCONSISTENCY     | High     | `cross-reference-index.md` §4 row for `simulation-architecture.md` | `output-infrastructure.md` is absent (should be added — Epic 07); `implementation-ordering.md` is listed erroneously (has only inline reference, not a Cross-References entry)                                                                     |
| F6  | INDEX INCONSISTENCY     | High     | `cross-reference-index.md` §4 row for `input-loading-pipeline.md`  | `internal-structures.md` and `output-infrastructure.md` are absent (should be added); `spec-gap-inventory.md` is listed erroneously (has only inline table references, not a Cross-References entry)                                               |
| F7  | INDEX INCONSISTENCY     | Low      | `cross-reference-index.md` §4 row for `output-infrastructure.md`   | `structured-output.md` is absent from incoming refs (pre-existing omission, not introduced by Epics 05-07)                                                                                                                                         |
| F8  | INDEX INCONSISTENCY     | Low      | `cross-reference-index.md` §3 row for `simulation-architecture.md` | 8 outgoing references missing from Section 3: `solver-interface-trait`, `communicator-trait`, `internal-structures`, `binary-formats`, `penalty-system` (plus partial deferred count) — pre-existing incompleteness, not introduced by Epics 05-07 |

---

## 6. Conclusion

### Findings by Category

| Category                | Count                  | Critical | High  | Low   |
| ----------------------- | ---------------------- | -------- | ----- | ----- |
| BROKEN LINK             | 0                      | 0        | 0     | 0     |
| STALE REFERENCE         | 0                      | 0        | 0     | 0     |
| MISSING CROSS-REFERENCE | 3 (F1, F2, F3)         | 0        | 2     | 1     |
| INDEX INCONSISTENCY     | 5 (F4, F5, F6, F7, F8) | 0        | 3     | 2     |
| **Total**               | **8**                  | **0**    | **5** | **3** |

### Assessment

**No broken links and no stale references.** The mdBook build is clean (exit code 0). All three renamed identifiers (`split_shared_memory`, `ferrompi::slurm`, `patch_rhs_bounds`) have been successfully removed from all live spec files. The `rkyv` reference in `input-loading-pipeline.md` is correctly confined to the comparison paragraph.

**The 8 findings are split into two tiers:**

**Epic 07-introduced issues (High severity, should fix before READY verdict):**

- F1: `simulation-architecture.md` SS6.1 does not link to `output-infrastructure.md` SS6.2 — a reader of the streaming architecture cannot follow the chain to the `SimulationParquetWriter` API.
- F2: `binary-formats.md` is missing the postcard/MPI broadcast format entry — the canonical serialization format reference is incomplete.
- F4: Section 3 of the index is missing three outgoing refs for `output-infrastructure.md` (all added by Epic 07).
- F5: Section 4 of the index incorrectly records incoming refs for `simulation-architecture.md` — missing `output-infrastructure.md`, erroneous `implementation-ordering.md`.
- F6: Section 4 of the index incorrectly records incoming refs for `input-loading-pipeline.md` — missing `internal-structures.md` and `output-infrastructure.md`, erroneous `spec-gap-inventory.md`.

**Pre-existing issues (Low severity, nice to have):**

- F3: Minor imprecision in simulation-architecture.md's cross-reference description for output-infrastructure.
- F7: `structured-output.md` absent from output-infrastructure.md incoming refs in the index (pre-dating Epics 05-07).
- F8: Multiple outgoing refs missing from simulation-architecture.md's Section 3 entry (pre-dating Epics 05-07).

These findings become inputs to ticket-031 for final verdict assessment. The High-severity findings (F1, F2, F4, F5, F6) represent incomplete post-Epic-07 maintenance and should be remediated before the implementation readiness verdict is issued as READY.
