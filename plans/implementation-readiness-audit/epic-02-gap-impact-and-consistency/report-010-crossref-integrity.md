# Cross-Reference Link Integrity Report

**Ticket**: ticket-010-verify-crossref-link-integrity.md
**Agent**: implementation-guardian
**Date**: 2026-02-26T19:30:00Z
**Scope**: All 84 spec files under `src/specs/`; 4,689 internal Markdown links verified

---

## 1. mdbook Build Results

`mdbook build` completed successfully with no dead-link errors. All warnings are HTML
tag balance issues unrelated to link integrity:

| Warning Type                                    | File                          | Count |
| ----------------------------------------------- | ----------------------------- | ----- |
| Unexpected HTML end tag `</span>`               | `specs/math/risk-measures.md` | 10    |
| Unclosed HTML tag `<span>` (Strikethrough exit) | `specs/math/risk-measures.md` | 10    |

**Assessment**: Both warning types are the pre-existing cosmetic defect documented in
project memory (`MEMORY.md` under "Known warnings"). No new build warnings were
introduced by the gap-resolution plan.

---

## 2. Broken Link Inventory

A total of 4,689 internal Markdown links were checked across 84 spec files. Three links
reference a file that does not exist on disk. One additional link is a template
placeholder documented to be intentional.

| #   | Source File                                               | Link Text                  | Target Path                                                                                    | Issue                                                                                          |
| --- | --------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| B-1 | `src/specs/overview/production-scale-reference.md` (L160) | `timing model analysis`    | `../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` | File not found; the `plans/spec-consistency-audit/` directory does not exist in the repository |
| B-2 | `src/specs/overview/production-scale-reference.md` (L223) | `timing model analysis §8` | `../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` | Same file not found                                                                            |
| B-3 | `src/specs/overview/production-scale-reference.md` (L238) | `timing model analysis`    | `../../../plans/spec-consistency-audit/epic-04-wall-clock-time-model/timing-model-analysis.md` | Same file not found                                                                            |
| —   | `src/specs/overview/ecosystem-guidelines.md` (L328)       | `File`                     | `./link.md`                                                                                    | Template placeholder in the authoring checklist; not a real link                               |

**Note on B-1 through B-3**: All three occurrences reference the same audit artifact
from a plan (`spec-consistency-audit`) that was never committed to the repository. The
links appear in footnote-style callouts in `production-scale-reference.md` SS4.2 and
SS4.6 that describe the derivation of the wall-clock timing model. The timing-model
analysis was used as an external reference during authoring but was not retained in the
repository. The broken links do not impede reading the spec; the derivation steps are
fully inline.

**Required action for B-1/B-2/B-3**: Either commit the `timing-model-analysis.md`
artifact to `plans/spec-consistency-audit/epic-04-wall-clock-time-model/` or replace
the three hyperlinks with plain prose (remove the Markdown link syntax, keeping the text
"timing model analysis").

---

## 3. Stale Section References

All 4,689 internal links point to files that exist. However, three cross-file section
number references in `src/specs/overview/spec-gap-inventory.md` name sections that do
not exist in the referenced files.

### Stale Reference SR-1

**Source**: `src/specs/overview/spec-gap-inventory.md` GAP-004 and GAP-008 resolution
log (multiple lines)
**Reference**: `[Solver Abstraction](../architecture/solver-abstraction.md) SS2.2`
**Issue**: `solver-abstraction.md` has subsection `### 2.2 Row Layout (Constraints)`,
so SS2.2 does exist. However, the resolution log for GAP-008 (L138) also writes
`[LP Formulation](../math/lp-formulation.md) SS2.2` — but `lp-formulation.md` has only
`## 2. Objective Function` (a top-level section) and no subsection `2.2`.

**Confirmed stale**: `lp-formulation.md SS2.2` — Section 2 has no numbered subsections.
The closest section is `## 2. Objective Function`. The reference occurs at GAP-008
resolution entry L138: "Cross-references to [Solver Abstraction](../architecture/
solver-abstraction.md) SS2.2, [Training Loop](../architecture/training-loop.md) SS4.2a
and SS7.2."

### Stale Reference SR-2

**Source**: `src/specs/overview/spec-gap-inventory.md` GAP-004 resolution log (L134)
**Reference**: `[Solver Abstraction](../architecture/solver-abstraction.md) SS4.4` and
`[Solver Interface Trait](../architecture/solver-interface-trait.md) SS4.4`
**Issue**: `solver-abstraction.md` has no subsection `4.4`. Section 4 ("Solver Interface
Contract") has subsections `4.1`, `4.2`, `4.3` but no `4.4`. The `StageTemplate` type
that GAP-004 refers to is defined at `solver-interface-trait.md SS4.4` (which does
exist: `### 4.4 StageTemplate`). The resolution log correctly references
`solver-interface-trait.md SS4.4` in the full description (L29) but also references
`solver-abstraction.md SS4.4` which is stale.

**Confirmed stale**: `solver-abstraction.md SS4.4` — Section 4.4 does not exist in that
file. The correct location is `solver-interface-trait.md SS4.4`.

### Stale Reference SR-3

**Source**: `src/specs/overview/spec-gap-inventory.md` GAP-012 resolution log (L142)
**Reference**: `[Internal Structures](../data-model/internal-structures.md) SS8.1`
**Issue**: `internal-structures.md` has `## 8. Energy Contract` (a top-level section)
but no subsection `8.1`. The resolution log states "Cross-reference in [Internal
Structures] SS1.7 updated to point to SS8.1" — the intended referent is
`input-loading-pipeline.md SS8.1` (which does exist: `### 8.1 \`load_case\` Public
API`), not a subsection within `internal-structures.md`.

**Confirmed stale**: The phrase "Cross-reference in [Internal Structures] SS1.7 updated
to point to SS8.1" implies a cross-reference from `internal-structures.md SS1.7` to
`input-loading-pipeline.md SS8.1`. This relationship is correctly documented, but the
phrasing creates a false impression that `internal-structures.md` has a section `8.1`.

### Gap-Resolution New Sections: Verified Present

The following new sections introduced by the gap-resolution plan were verified to exist
in their target files:

| Section Label | File                                     | Heading Found                                           |
| ------------- | ---------------------------------------- | ------------------------------------------------------- |
| SS2.1b        | `architecture/training-loop.md`          | `### 2.1b TrainingEvent Type Definitions`               |
| SS4.2a        | `architecture/training-loop.md`          | `### 4.2a Forward Pass Patch Sequence`                  |
| SS4.3b        | `architecture/training-loop.md`          | `### 4.3b Lower Bound Extraction`                       |
| SS5.4a        | `architecture/training-loop.md`          | `### 5.4a State Vector Wire Format`                     |
| SS2.3a        | `architecture/convergence-monitoring.md` | `### 2.3a Simulation-Based Stopping Rule Integration`   |
| SS3.1a        | `architecture/convergence-monitoring.md` | `### 3.1a Upper Bound Variance Aggregation`             |
| SS4.2a        | `architecture/cut-management-impl.md`    | `### 4.2a Wire Format Specification`                    |
| SS5.2a        | `architecture/cli-and-lifecycle.md`      | `### 5.2a Phase-Training Loop Alignment`                |
| SS1.3a        | `architecture/solver-workspaces.md`      | `### 1.3a Workspace Lifecycle Summary`                  |
| SS2.2a        | `architecture/scenario-generation.md`    | `### 2.2a Seed Derivation Function`                     |
| SS8.1         | `architecture/input-loading-pipeline.md` | `### 8.1 \`load_case\` Public API`                      |
| SS2.1a        | `interfaces/python-bindings.md`          | (heading inline in SS2.1 prose, not a separate heading) |
| SS2.1b        | `interfaces/python-bindings.md`          | (heading inline in SS2.1 prose, not a separate heading) |
| SS6.1a        | `interfaces/python-bindings.md`          | `### 6.1a Worker Error Handling`                        |
| SS1.1a        | `interfaces/mcp-server.md`               | `### 1.1a Future: Multi-Process Capability`             |
| SS1.5b        | `data-model/internal-structures.md`      | `### 1.5b Network Topology`                             |

**Special case for `python-bindings.md` SS2.1a / SS2.1b**: These section labels appear
as `#### SS2.1a Worker Lifecycle` and `#### SS2.1b Multi-Process Result Collection`
within the body of `### 2.1 Top-Level Functions`, not as independent headings. They are
sub-headings under the `cobre.train()` function description. The labels are valid and
the sections resolve correctly.

**Special case for `backend-testing.md`**: The gap-resolution plan references
`backend-testing.md` via SS labels (`SS2.1a`, `SS6.1a`) that appear in
`python-bindings.md` but originate in `backend-testing.md`. Those sections exist in
`backend-testing.md` as `### 2.1 Reference Test Case` and `### 6.1 Progress Token
Lifecycle` — the `a` suffix is used only in `python-bindings.md` to refer to new
content added specifically for multi-process scenarios, not to sections in
`backend-testing.md` itself.

---

## 4. Cross-Reference Index Delta

### 4.1 Section 1 (Spec-to-Crate Mapping): Count Discrepancy

The index header states **"74 specification files"**. The actual filesystem contains
**84 `.md` files** under `src/specs/` (83 excluding `cross-reference-index.md` itself).

**Files on disk but absent from the index** (9 files):

| File                                         | Type                      | Notes                                                     |
| -------------------------------------------- | ------------------------- | --------------------------------------------------------- |
| `src/specs/overview.md`                      | Section index page        | mdBook section overview, not a spec per se                |
| `src/specs/architecture.md`                  | Section index page        | Claims "13 specs" but there are now 26 architecture specs |
| `src/specs/configuration.md`                 | Section index page        | mdBook section overview                                   |
| `src/specs/data-model.md`                    | Section index page        | mdBook section overview                                   |
| `src/specs/hpc.md`                           | Section index page        | Claims "8 specs" (HPC section now has 15 files)           |
| `src/specs/interfaces.md`                    | Section index page        | mdBook section overview                                   |
| `src/specs/math.md`                          | Section index page        | mdBook section overview                                   |
| `src/specs/overview/ecosystem-guidelines.md` | Authoring guidelines spec | Full spec (441 lines, 24 KB), not an index page           |
| `src/specs/hpc/backend-testing.md`           | Testing spec              | Full spec (480 lines, 61 KB); referenced by 8 other specs |

**Assessment**: The six `*.md` section overview files (`overview.md`, `architecture.md`,
`configuration.md`, `data-model.md`, `hpc.md`, `interfaces.md`, `math.md`) are mdBook
section landing pages, not independent specification documents. They do not require
entries in the cross-reference index. The two remaining files are genuine specs:

1. **`ecosystem-guidelines.md`** — A 441-line authoring conventions document that
   defines the section prefix convention, convention blockquote text, dispatch
   architecture patterns, and spec checklist. It has a full `## Cross-References`
   section and is referenced by the CLAUDE.md project instructions. It should be added
   to the index.

2. **`hpc/backend-testing.md`** — A 480-line testing spec defining conformance tests,
   interchangeability tests, performance regression tests, and determinism verification.
   It is referenced in the `## Cross-References` section of 8 other spec files
   (`risk-measure-testing.md`, `horizon-mode-testing.md`, `sampling-scheme-testing.md`,
   `cut-selection-testing.md`, `stopping-rule-testing.md`, `solver-interface-trait.md`,
   `solver-interface-testing.md`, `cutting-management-impl.md`). It should be added to
   the index.

Also, the count claim in `architecture.md` header ("these 13 specs") is outdated: the
architecture section now contains 26 specs (13 original + 6 trait specs + 6 testing
specs + 1 additional). Similarly, `hpc.md` claims "8 specs" but the `hpc/` directory
contains 15 files.

### 4.2 Section 2 (Per-Crate Reading Lists): Missing Entries

Since `ecosystem-guidelines.md` and `backend-testing.md` are absent from section 1,
they are also absent from all 11 per-crate reading lists in section 2.

- **`backend-testing.md`** should appear as a `(secondary)` entry in `cobre-comm`
  (primary), `cobre-solver`, `cobre-sddp`, `cobre-stochastic` reading lists — because
  it is referenced by all testing specs tied to those crates.

- **`ecosystem-guidelines.md`** is cross-cutting (no single owning crate) and should
  appear as a `(secondary)` entry in all 11 per-crate reading lists.

### 4.3 Section 3 (Outgoing Cross-References): Missing `backend-testing.md` Row

Section 3 records outgoing cross-references for every indexed spec. Since
`backend-testing.md` is not indexed, it has no row in section 3. Its actual outgoing
cross-references (extracted from its `## Cross-References` section) point to:

- `hpc/communicator-trait.md`
- `hpc/backend-selection.md`
- `hpc/backend-ferrompi.md`
- `hpc/backend-shm.md`
- `hpc/backend-tcp.md`
- `hpc/backend-local.md`
- `interfaces/python-bindings.md`

These links are all valid.

The index does correctly list `backend-testing.md` as an outgoing reference from
`solver-interface-trait.md`, `solver-interface-testing.md`, `risk-measure-testing.md`,
`horizon-mode-testing.md`, `sampling-scheme-testing.md`, `cut-selection-testing.md`,
and `stopping-rule-testing.md`. The asymmetry is that section 4 (incoming refs for
`backend-testing.md`) cannot exist because there is no section 1 entry.

### 4.4 Section 4 (Incoming Cross-References): Asymmetry

Section 4 lists incoming references for each spec. The following asymmetry was found:

- **`backend-testing.md`** has no section 4 row despite being referenced by 8 specs
  (confirmed by extracting `## Cross-References` from those specs). This is a direct
  consequence of the section 1 omission.

No other asymmetries between sections 3 and 4 were found for the indexed specs.

### 4.5 Section 5 (Dependency Ordering): Unaffected

The dependency ordering section covers the 74 indexed specs. No gaps were found among
those. The two missing specs (`backend-testing.md` and `ecosystem-guidelines.md`) would
need to be positioned in the ordering after their dependencies are determined, but this
is a consequence of the section 1 omission rather than an independent error.

### Required Index Updates Summary

| Update                                                                                         | Priority                               |
| ---------------------------------------------------------------------------------------------- | -------------------------------------- |
| Add `hpc/backend-testing.md` as index entry #75 with primary crate `cobre-comm`                | High — 8 specs reference it            |
| Add `overview/ecosystem-guidelines.md` as index entry #76 with primary crate `(cross-cutting)` | Medium — authoring governance document |
| Update section 2 reading lists for all 11 crates to include these two new entries              | Follows from above                     |
| Add section 3 row for `backend-testing.md` with its 7 outgoing refs                            | Follows from above                     |
| Add section 4 incoming row for `backend-testing.md` (8 incoming refs)                          | Follows from above                     |
| Add section 4 incoming row for `ecosystem-guidelines.md`                                       | Follows from above                     |
| Update `architecture.md` header count from "13 specs" to "26 specs"                            | Low — cosmetic                         |
| Update `hpc.md` header count from "8 specs" to "15 files"                                      | Low — cosmetic                         |
| Update index header from "74 specification files" to "76 specification files"                  | Follows from additions                 |

---

## 5. Convention Violations

This section reports violations of the section prefix convention defined in CLAUDE.md:

- `SS` prefix: architecture-to-architecture cross-links
- `§` prefix: reserved for links to `src/specs/hpc/` files only
- Plain numbered sections: overview and planning specs
- The single permitted `§` in architecture files is inside the convention blockquote

### 5.1 Architecture Files — § Used as Self-Referential Section Anchor

The convention states that architecture files must not use `§` except inside the
verbatim convention blockquote. Post-epic-04 baseline was supposed to be "only blockquote
occurrences in the 7 trait specs."

**Actual state**: 83 non-blockquote `§` occurrences across 12 architecture files.

| File                         | § Count | Example Violations                                                                        |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `scenario-generation.md`     | 15      | `(see §2.2)`, `(see §3.2)`, `(§4.3)`, `(§2.3)` — all self-referential                     |
| `solver-abstraction.md`      | 14      | `(§3)`, `(§7)`, `(§8)`, `per §2.2`, `per §2.3` — all self-referential                     |
| `solver-workspaces.md`       | 9       | `(see §1.2)`, `(see §1.6)`, `(§1.4 step 2)` — all self-referential                        |
| `training-loop.md`           | 8       | `(§4)`, `(§6)` — self-referential section references                                      |
| `extension-points.md`        | 7       | `(§2)`, `(§3)`, `(§4)`, `(§5)`, `(§8)` — all self-referential                             |
| `input-loading-pipeline.md`  | 7       | `(§7)`, `(§2)`, `(§5)`, `(see §8)` — all self-referential                                 |
| `simulation-architecture.md` | 7       | `(see §5)`, `(see §6)`, `(§4.3)` — self-referential                                       |
| `cut-management-impl.md`     | 4       | `(§2)`, `(§4.1 step 3)`, `(§4.2)`, `(§4)` — self-referential                              |
| `solver-clp-impl.md`         | 5       | `Maps To (Solver Abstraction §6)`, `Maps To (Solver Abstraction §9)` — cross-architecture |
| `cli-and-lifecycle.md`       | 3       | `(see §5.3)`, `(§5.2)`, `(§3.1)` — self-referential                                       |
| `convergence-monitoring.md`  | 2       | `(§4)`, `§2.4` — self-referential                                                         |
| `solver-highs-impl.md`       | 2       | `Maps To (Solver Abstraction §9)` — cross-architecture                                    |

**Special cases**:

- `solver-clp-impl.md` and `solver-highs-impl.md`: The `§` occurrences appear in table
  cells like "Maps To (Solver Abstraction §6)" and "Maps To (Solver Abstraction §9)".
  These are cross-architecture references using `§` which is a double violation (wrong
  prefix AND non-HPC target).
- `scenario-generation.md` L37 contains `par-inflow-model.md §3` which is a correct
  `§` reference to an HPC-adjacent math spec (not an architecture file). This one is
  borderline: `par-inflow-model.md` is in `src/specs/math/`, not `src/specs/hpc/`.
  The convention specifies `§` for `src/specs/hpc/` files only, so this is technically
  a violation if strictly interpreted.
- `cli-and-lifecycle.md` L211 references `[Hybrid Parallelism §1](../hpc/hybrid-parallelism.md)`
  — this is a correct HPC cross-link and is permitted.

**Root cause**: All 12 non-compliant architecture files pre-date the `§`-avoidance
convention established in Epic 04. They were authored with `§` as a shorthand for
section references throughout. The epic-04 remediation corrected trait specs (the 6
files with blockquotes) but did not audit non-trait architecture files.

**Required action**: Replace all self-referential `§N` with `SSN` in the 12 non-compliant
architecture files. For cross-architecture references like "Solver Abstraction §6", use
the link form `[Solver Abstraction SS6](./solver-abstraction.md)` instead.

### 5.2 Architecture Files — Convention Blockquote Check

All 6 trait spec files contain the convention blockquote. All 6 testing spec files
correctly omit it. No non-trait, non-testing architecture file contains the blockquote.

| Trait Spec                  | Blockquote Present |
| --------------------------- | ------------------ |
| `cut-selection-trait.md`    | Yes                |
| `horizon-mode-trait.md`     | Yes                |
| `risk-measure-trait.md`     | Yes                |
| `sampling-scheme-trait.md`  | Yes                |
| `solver-interface-trait.md` | Yes                |
| `stopping-rule-trait.md`    | Yes                |

**Note**: `cut-management-impl.md` lacks the convention blockquote. It is not a trait
spec so the blockquote is correctly absent.

### 5.3 Overview Files — § Used for Architecture Cross-Links

The convention states overview files use plain numbered sections (`## 1.`, `## 2.`) and
no `§` prefix for their own sections or for architecture cross-links.

**Violations found** (17 instances across 4 files):

| File                            | Count | Example                                                                                                                                                                                    |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design-principles.md`          | 9     | `[Validation Architecture §4](../architecture/validation-architecture.md)`, `[Convergence Monitoring §2.4](../architecture/convergence-monitoring.md)`, `(§2.1)` inline                    |
| `production-scale-reference.md` | 5     | `[Solver Abstraction §5](../architecture/solver-abstraction.md)`, `[Training Loop §6](../architecture/training-loop.md)`, `[Solver Workspaces §1.2](../architecture/solver-workspaces.md)` |
| `notation-conventions.md`       | 2     | `[Solver Abstraction §3](../architecture/solver-abstraction.md)`                                                                                                                           |
| `ecosystem-guidelines.md`       | 1     | `[Validation Architecture §4–5](../architecture/validation-architecture.md)` in cross-references                                                                                           |

**Note**: HPC cross-links with `§` in `production-scale-reference.md` (e.g.,
`[Memory Architecture §2](../hpc/memory-architecture.md)`,
`[Work Distribution §2](../hpc/work-distribution.md)`) are correct and permitted.

**Required action**: For each architecture cross-link using `§` in overview files,
replace `§N` with `SSN` in the link text (e.g., `[Training Loop §6]` becomes
`[Training Loop SS6]`).

### 5.4 Overview Files — Plain Numbered Sections

All 7 overview spec files correctly use `## 1.`, `## 2.` numbering for their own
sections. No `SS` or `§` prefix appears in overview headings.

---

## 6. Summary Statistics

| Category                                                     | Count                                               |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Total spec files verified                                    | 84                                                  |
| Total internal Markdown links verified                       | 4,689                                               |
| Broken links (file not found)                                | 3                                                   |
| Intentional template links (non-actionable)                  | 1                                                   |
| Stale section references (section does not exist)            | 2 confirmed; 1 misleading phrasing                  |
| New gap-resolution sections verified present                 | 16                                                  |
| Index spec count claim vs actual                             | 74 claimed; 76 needed (2 substantive specs missing) |
| Substantive spec files missing from index                    | 2 (`backend-testing.md`, `ecosystem-guidelines.md`) |
| Non-spec section overview pages (correctly excluded)         | 7                                                   |
| mdbook build errors                                          | 0                                                   |
| mdbook link warnings                                         | 0                                                   |
| § convention violations in architecture files                | 83 instances across 12 files                        |
| § convention violations in overview files (cross-arch links) | 17 instances across 4 files                         |
| Trait spec convention blockquote presence                    | 6/6 correct                                         |
| Testing spec convention blockquote absence                   | 6/6 correct                                         |

### Priority Matrix

| Issue                                                               | Severity           | Action Required                                          |
| ------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- |
| Broken links to `timing-model-analysis.md` (B-1, B-2, B-3)          | Medium             | Remove or commit the target file                         |
| `backend-testing.md` absent from cross-reference index              | High               | Add as index entry #75                                   |
| `ecosystem-guidelines.md` absent from cross-reference index         | Medium             | Add as index entry #76                                   |
| Stale `lp-formulation.md SS2.2` reference in spec-gap-inventory     | Low                | Correct to `SS5a` (the AR lag section) or clarify intent |
| Stale `solver-abstraction.md SS4.4` reference in spec-gap-inventory | Low                | Correct to `solver-interface-trait.md SS4.4`             |
| 83 `§` violations in 12 architecture files                          | Low (pre-existing) | Batch replace in separate ticket                         |
| 17 `§` violations in 4 overview files                               | Low (pre-existing) | Batch replace in separate ticket                         |
| Architecture section overview page count strings outdated           | Trivial            | Update `architecture.md` and `hpc.md`                    |
