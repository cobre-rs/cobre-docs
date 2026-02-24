# Ticket-004 Audit Report: Data Model Spec Files

**Audit Date**: 2026-02-24
**Auditor**: sddp-specialist (automated 6-check methodology)
**Scope**: 10 data model spec files migrated from `powers-rs` to `cobre-docs`

## Source and Target Directories

- **Source**: `/home/rogerio/git/powers/docs/specs/02-data-model/`
- **Target**: `/home/rogerio/git/cobre-docs/src/specs/data-model/`

---

## 1. `input-directory-structure.md`

| Check                  | Result | Details                                                                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 1. Frontmatter Removal | PASS   | Target starts with `# Input Directory Structure` (no `---`)                                                        |
| 2. Brand Terms         | PASS   | All `POWE.RS` replaced with `Cobre`; all `powers-rs.io` replaced with `cobre.dev`; 5 Cobre-branded terms confirmed |
| 3. Heading Inventory   | PASS   | 12 headings in both source and target; headings match exactly                                                      |
| 4. Content Inventory   | PASS   | 37 pipe-lines (table rows) match; 6 code block markers match; 2 JSON blocks match                                  |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved                                                                                           |
| 6. Cross-References    | PASS   | `../configuration/configuration-reference.md` resolves correctly (was `../05-config/`); all links verified         |

**Findings**:

| Severity | Finding                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOW      | Emoji `⚠️` removed from "Validation" callout (source line 265, target line 240). Text content preserved.                                                                                                                        |
| LOW      | SVG diagram reference `![Directory Structure](../../diagrams/exports/svg/data/directory-structure.svg)` replaced with `<!-- TODO: diagram -- directory-structure -->` placeholder (target line 9). Expected migration behavior. |
| LOW      | Line count difference (324 -> 299) accounted for by frontmatter removal (25 lines of YAML).                                                                                                                                     |

**Verdict: PASS**

---

## 2. `input-system-entities.md`

| Check                  | Result | Details                                                                                                                                  |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Frontmatter Removal | PASS   | Target starts with `# Input System Entities` (no `---`)                                                                                  |
| 2. Brand Terms         | PASS   | 7 Cobre-branded terms confirmed in target; zero `POWE.RS`/`powers-rs.io` remnants                                                        |
| 3. Heading Inventory   | PASS   | 41 headings in both source and target; headings match exactly                                                                            |
| 4. Content Inventory   | PASS   | **195 pipe-lines in both source and target** (AC requirement met); 28 separator lines; 24 code block markers match; 11 JSON blocks match |
| 5. Tables/Code Blocks  | PASS   | All entity definition tables preserved                                                                                                   |
| 6. Cross-References    | PASS   | All links resolve correctly                                                                                                              |

**Check 4a -- Table Row Completeness (AC Item)**:

- **Total pipe-lines**: 195 in source, 195 in target -- **MATCH**
- **Separator lines**: 28 in both
- **Spot-check hydro fields**: `downstream_id` (line 265, 308), `min_storage_hm3` (line 271, 317), `max_storage_hm3` (line 272, 318), `productivity_mw_per_m3s` (lines 185, 197, 209, 221, 280, 326) -- all present
- **Spot-check thermal fields**: `min_generation_mw` (lines 188, 200, 212, 224, 237, 248, 283, 329), `max_generation_mw` (lines 189, 201, 213, 225, 238, 249, 284, 330) -- all present
- Note: The AC mentions `startup_cost` and `operating_cost` -- these are not field names in the entity tables (thermals use `cost_per_mwh` and production model variants). The cost fields are defined in `penalty-system.md`. The actual thermal fields (`min_generation_mw`, `max_generation_mw`) are all present.

**Check 4c -- JSON Examples (AC Item)**:

- 11 JSON code blocks in both source and target -- **MATCH**

**Findings**:

| Severity | Finding                                                                                     |
| -------- | ------------------------------------------------------------------------------------------- |
| LOW      | Line count difference (839 -> 807) accounted for by frontmatter removal (32 lines of YAML). |

**Verdict: PASS**

---

## 3. `input-hydro-extensions.md`

| Check                  | Result | Details                                                                                                                                                          |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Frontmatter Removal | PASS   | Target starts with `# Input Hydro Extensions` (no `---`)                                                                                                         |
| 2. Brand Terms         | PASS   | All `POWE.RS` replaced with `Cobre`; all `powers-rs.io` replaced with `cobre.dev`; 4 Cobre-branded terms confirmed                                               |
| 3. Heading Inventory   | PASS   | 16 headings in both source and target; headings match exactly                                                                                                    |
| 4. Content Inventory   | PASS   | 88 pipe-lines match; 4 code block markers match; 2 JSON blocks match                                                                                             |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved                                                                                                                                         |
| 6. Cross-References    | PASS   | `../math/` paths (was `../01-math/`), `../overview/` (was `../00-overview/`), `../deferred.md` (was `../06-deferred/deferred-features.md`) all resolve correctly |

**Findings**:

| Severity | Finding                                                                                     |
| -------- | ------------------------------------------------------------------------------------------- |
| LOW      | Line count difference (297 -> 274) accounted for by frontmatter removal (23 lines of YAML). |

**Verdict: PASS**

---

## 4. `input-scenarios.md`

| Check                  | Result | Details                                                                                                                                                                                  |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Frontmatter Removal | PASS   | Target starts with `# Input Scenarios and Time Series` (no `---`)                                                                                                                        |
| 2. Brand Terms         | PASS   | All `powers-rs.io` replaced with `cobre.dev` in JSON `$schema` URLs; 7 Cobre-branded terms confirmed                                                                                     |
| 3. Heading Inventory   | PASS   | 41 headings in both source and target; headings match exactly                                                                                                                            |
| 4. Content Inventory   | PASS   | 135 pipe-lines match; 30 code block markers match; 15 JSON blocks match                                                                                                                  |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved; all JSON examples preserved                                                                                                                                    |
| 6. Cross-References    | PASS   | `../architecture/scenario-generation.md` (was `../03-architecture/`), `../math/` (was `../01-math/`), `../deferred.md` (was `../06-deferred/deferred-features.md`) all resolve correctly |

**Findings**:

| Severity | Finding                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| LOW      | Emoji `⚠️` removed from "Order Invariance" callout (source line 37, target line 15). Text content preserved. |
| LOW      | Line count difference (794 -> 772) accounted for by frontmatter removal (22 lines of YAML).                  |

**Verdict: PASS**

---

## 5. `input-constraints.md`

| Check                  | Result | Details                                                                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 1. Frontmatter Removal | PASS   | Target starts with `# Input Constraints, Initial Conditions, and Policy` (no `---`)                                |
| 2. Brand Terms         | PASS   | All `POWE.RS` replaced with `Cobre`; all `powers-rs.io` replaced with `cobre.dev`; 6 Cobre-branded terms confirmed |
| 3. Heading Inventory   | PASS   | 29 headings in both source and target; headings match exactly                                                      |
| 4. Content Inventory   | PASS   | 116 pipe-lines match; 12 code block markers match; 4 JSON blocks match                                             |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved                                                                                           |
| 6. Cross-References    | PASS   | `../math/` (was `../01-math/`), `../overview/` (was `../00-overview/`) all resolve correctly                       |

**Check 4c -- JSON Examples (AC Item)**:

- 4 JSON code blocks in both source and target -- **MATCH**

**Findings**:

| Severity | Finding                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOW      | Emoji `⚠️` removed from "Order Invariance" callout (source line 190, target equivalent). Text content preserved.                                                                                                                                                                |
| LOW      | Emojis removed from Reproducibility Guarantees table: `✅` (Bit-for-bit identical), `⚠️` (Equivalent optimum, Different run), `❌` (Not supported) removed from the "Guarantee" column. Descriptive text ("Bit-for-bit identical", "Equivalent optimum", etc.) fully preserved. |
| LOW      | Line count difference (441 -> 420) accounted for by frontmatter removal (21 lines of YAML).                                                                                                                                                                                     |

**Verdict: PASS**

---

## 6. `penalty-system.md`

| Check                  | Result | Details                                                                                                                                                  |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Frontmatter Removal | PASS   | Target starts with `# Penalty System` (no `---`)                                                                                                         |
| 2. Brand Terms         | PASS   | `powers-rs.io` replaced with `cobre.dev`; 1 Cobre-branded term confirmed                                                                                 |
| 3. Heading Inventory   | PASS   | 30 headings in both source and target; headings match exactly                                                                                            |
| 4. Content Inventory   | PASS   | 91 pipe-lines match; 8 code block markers match; 1 JSON block matches; 73 data rows match                                                                |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved                                                                                                                                 |
| 6. Cross-References    | PASS   | `../math/lp-formulation.md` (was `../01-math/`), `../configuration/` (was `../05-config/`), `../overview/` (was `../00-overview/`) all resolve correctly |

**Findings**:

| Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MEDIUM   | Unicode characters systematically converted to ASCII equivalents throughout the file. Affected characters: `hm³` -> `hm3`, `m³/s` -> `m3/s`, `Σ_` -> `Sigma_`, `×` -> `x`, `≥` -> `>=`, `≤` -> `<=`, `∞` -> `Inf`, `−∞` -> `-Inf`. This is a consistent, deliberate conversion affecting ~50 occurrences. All affected lines are in unit annotations (table cells), pseudo-code expressions (the objective function breakdown in Section 9), and constraint formulations. The semantic content is fully preserved -- no information loss. |
| LOW      | Line count difference (366 -> 341) accounted for by frontmatter removal (25 lines of YAML).                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Note on MEDIUM severity**: The Unicode-to-ASCII conversion is classified as MEDIUM because it changes the rendered appearance of unit annotations (e.g., `$/hm³` vs `$/hm3`). However, these are display-only differences in a specification document -- the field names, values, relationships, and formulations are identical. This does not affect implementability.

**Verdict: PASS**

---

## 7. `internal-structures.md`

| Check                  | Result | Details                                                                                                                                                                                   |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Frontmatter Removal | PASS   | Target starts with `# Internal Structures` (no `---`)                                                                                                                                     |
| 2. Brand Terms         | PASS   | No brand terms required in this file (0 Cobre references, consistent with source having 0 POWE.RS references); cross-ref paths correctly updated                                          |
| 3. Heading Inventory   | PASS   | 47 headings in both source and target; headings match exactly                                                                                                                             |
| 4. Content Inventory   | PASS   | 93 pipe-lines match; 0 code block markers match (neither file has code blocks)                                                                                                            |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved                                                                                                                                                                  |
| 6. Cross-References    | PASS   | `../architecture/` (was `../03-architecture/`), `../overview/` (was `../00-overview/`), `../math/` (was `../01-math/`), `input-system-entities.md` (same directory) all resolve correctly |

**Findings**:

| Severity | Finding                                                                                     |
| -------- | ------------------------------------------------------------------------------------------- |
| LOW      | Line count difference (459 -> 438) accounted for by frontmatter removal (21 lines of YAML). |

**Verdict: PASS**

---

## 8. `output-schemas.md`

| Check                  | Result | Details                                                                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 1. Frontmatter Removal | PASS   | Target starts with `# Output Schemas` (no `---`)                                                                   |
| 2. Brand Terms         | PASS   | `POWE.RS` replaced with `Cobre`; 1 Cobre-branded term confirmed                                                    |
| 3. Heading Inventory   | PASS   | 31 headings in both source and target; headings match exactly (after emoji removal: `🚧 DEFERRED` -> `DEFERRED`)   |
| 4. Content Inventory   | PASS   | 218 pipe-lines match; 8 code block markers match; 1 JSON block matches                                             |
| 5. Tables/Code Blocks  | PASS   | All Parquet column definition tables preserved                                                                     |
| 6. Cross-References    | PASS   | `../math/` (was `../01-math/`), `../deferred.md` (was `../06-deferred/deferred-features.md`) all resolve correctly |

**Check 4d -- Output Column Definitions (AC Item)**:

- **Section 5: Simulation Output Schemas** present with subsections:
  - 5.1 Costs, 5.2 Hydros, 5.3 Thermals, 5.4 Exchanges, 5.5 Buses, 5.6 Pumping Stations (Optional), 5.7 Contracts (Optional), 5.8 Non-Controllable Sources (Optional), 5.9 Batteries (DEFERRED), 5.10 Inflow Lags (Optional), 5.11 Generic Violations
- **Section 6: Training Output Schemas** present with subsections:
  - 6.1 Convergence Log, 6.2 Iteration Timing, 6.3 MPI Rank Timing
- **218 pipe-lines** (table rows including headers, separators, and data rows) in both source and target -- all column definition tables preserved

**Findings**:

| Severity | Finding                                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| LOW      | Emoji `🚧` removed from Batteries DEFERRED section heading and directory tree comment. Descriptive text "DEFERRED" preserved in both locations. |
| LOW      | Line count difference (549 -> 529) accounted for by frontmatter removal (20 lines of YAML).                                                     |

**Verdict: PASS**

---

## 9. `output-infrastructure.md`

| Check                  | Result | Details                                                                                                                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Frontmatter Removal | PASS   | Target starts with `# Output Infrastructure` (no `---`)                                                                                                            |
| 2. Brand Terms         | PASS   | All `POWE.RS` replaced with `Cobre`; all `powers-rs.io` replaced with `cobre.dev`; `powers_version` replaced with `cobre_version`; 6 Cobre-branded terms confirmed |
| 3. Heading Inventory   | PASS   | 17 headings in both source and target; headings match exactly                                                                                                      |
| 4. Content Inventory   | PASS   | 51 pipe-lines match; 8 code block markers match; 3 JSON blocks match                                                                                               |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved; JSON manifest examples preserved                                                                                                         |
| 6. Cross-References    | PASS   | `../configuration/configuration-reference.md` (was `../05-config/`), `../math/` (was `../01-math/`), `../overview/` (was `../00-overview/`) all resolve correctly  |

**Findings**:

| Severity | Finding                                                                                     |
| -------- | ------------------------------------------------------------------------------------------- |
| LOW      | Line count difference (354 -> 330) accounted for by frontmatter removal (24 lines of YAML). |

**Note**: The ticket asked to verify `output-infrastructure.md` -> `../architecture/cli-and-lifecycle.md`. This cross-reference does not exist in either the source or target version of `output-infrastructure.md`. The `cli-and-lifecycle.md` file does exist at the expected path, but this file simply does not reference it.

**Verdict: PASS**

---

## 10. `binary-formats.md`

| Check                  | Result | Details                                                                                                                                                                                                    |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Frontmatter Removal | PASS   | Target starts with `# Serialization and Persistence Formats` (no `---`)                                                                                                                                    |
| 2. Brand Terms         | PASS   | `POWE.RS` replaced with `Cobre`; `powers.policy` namespace replaced with `cobre.policy`; `powers_version` field replaced with `cobre_version`; 3 Cobre-branded terms confirmed                             |
| 3. Heading Inventory   | PASS   | 28 headings in both source and target; headings match exactly                                                                                                                                              |
| 4. Content Inventory   | PASS   | 114 pipe-lines match; 6 code block markers match                                                                                                                                                           |
| 5. Tables/Code Blocks  | PASS   | All table rows preserved; FlatBuffers IDL schemas preserved                                                                                                                                                |
| 6. Cross-References    | PASS   | `internal-structures.md` (same directory), `output-schemas.md` (same directory), `../architecture/solver-abstraction.md` (was `../03-architecture/`), `../math/` (was `../01-math/`) all resolve correctly |

**Check 4b -- FlatBuffers Schema Completeness (AC Item)**:

The AC specifies checking for `CutEntry`, `CutPool`, `VisitedState`, and `CheckpointManifest`. The actual table names in both source and target are different from the AC. The following provides a complete reconciliation:

| AC Name              | Actual Name      | Present in Target | Fields Match Source                                                   |
| -------------------- | ---------------- | ----------------- | --------------------------------------------------------------------- |
| `CutEntry`           | `BendersCut`     | Yes (line 146)    | Yes -- 10 fields identical                                            |
| `CutPool`            | `StageCuts`      | Yes (line 164)    | Yes -- 7 fields identical                                             |
| `VisitedState`       | `VisitedState`   | Yes (line 175)    | Yes -- 7 fields identical                                             |
| `CheckpointManifest` | `PolicyMetadata` | Yes (line 227)    | Yes -- 16 fields identical (with `powers_version` -> `cobre_version`) |
| (not in AC)          | `StageStates`    | Yes (line 185)    | Yes -- 3 fields identical                                             |
| (not in AC)          | `Vertex`         | Yes (line 192)    | Yes -- 7 fields identical                                             |
| (not in AC)          | `StageVertices`  | Yes (line 202)    | Yes -- 4 fields identical                                             |
| (not in AC)          | `StageBasis`     | Yes (line 214)    | Yes -- 7 fields identical                                             |

**All 8 FlatBuffers table definitions are present in the target with all fields matching the source.** The only difference is the brand term `powers_version` -> `cobre_version` in `PolicyMetadata`. The namespace is correctly `cobre.policy` (was `powers.policy`).

**Findings**:

| Severity | Finding                                                                                     |
| -------- | ------------------------------------------------------------------------------------------- |
| LOW      | Line count difference (520 -> 495) accounted for by frontmatter removal (25 lines of YAML). |

**Verdict: PASS**

---

## Summary Table

| #   | File                           | Check 1 (Frontmatter) | Check 2 (Brand) | Check 3 (Headings) | Check 4 (Content) | Check 5 (Tables/Code) | Check 6 (Cross-Refs) | Verdict  |
| --- | ------------------------------ | --------------------- | --------------- | ------------------ | ----------------- | --------------------- | -------------------- | -------- |
| 1   | `input-directory-structure.md` | PASS                  | PASS            | PASS (12=12)       | PASS (37=37)      | PASS                  | PASS                 | **PASS** |
| 2   | `input-system-entities.md`     | PASS                  | PASS            | PASS (41=41)       | PASS (195=195)    | PASS                  | PASS                 | **PASS** |
| 3   | `input-hydro-extensions.md`    | PASS                  | PASS            | PASS (16=16)       | PASS (88=88)      | PASS                  | PASS                 | **PASS** |
| 4   | `input-scenarios.md`           | PASS                  | PASS            | PASS (41=41)       | PASS (135=135)    | PASS                  | PASS                 | **PASS** |
| 5   | `input-constraints.md`         | PASS                  | PASS            | PASS (29=29)       | PASS (116=116)    | PASS                  | PASS                 | **PASS** |
| 6   | `penalty-system.md`            | PASS                  | PASS            | PASS (30=30)       | PASS (91=91)      | PASS                  | PASS                 | **PASS** |
| 7   | `internal-structures.md`       | PASS                  | PASS            | PASS (47=47)       | PASS (93=93)      | PASS                  | PASS                 | **PASS** |
| 8   | `output-schemas.md`            | PASS                  | PASS            | PASS (31=31)       | PASS (218=218)    | PASS                  | PASS                 | **PASS** |
| 9   | `output-infrastructure.md`     | PASS                  | PASS            | PASS (17=17)       | PASS (51=51)      | PASS                  | PASS                 | **PASS** |
| 10  | `binary-formats.md`            | PASS                  | PASS            | PASS (28=28)       | PASS (114=114)    | PASS                  | PASS                 | **PASS** |

**Overall Result: 10/10 PASS**

---

## Acceptance Criteria Verification

| AC                                              | Status | Evidence                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input-system-entities.md` has 195 table rows   | MET    | 195 pipe-lines in both source and target. Spot-check confirmed: hydro fields (`downstream_id`, `min_storage_hm3`, `max_storage_hm3`, `productivity_mw_per_m3s`), thermal fields (`min_generation_mw`, `max_generation_mw`).                                                               |
| `binary-formats.md` FlatBuffers schemas present | MET    | All 8 FlatBuffers table definitions present with all fields matching. AC names map to actual names: `CutEntry`=`BendersCut`, `CutPool`=`StageCuts`, `VisitedState`=`VisitedState`, `CheckpointManifest`=`PolicyMetadata`. Brand term `powers_version`->`cobre_version` correctly applied. |
| `output-schemas.md` column definitions present  | MET    | Simulation output columns (Section 5, subsections 5.1-5.11) and training output columns (Section 6, subsections 6.1-6.3) all present. 218 pipe-lines match.                                                                                                                               |
| All 10 target files: no `---` first line        | MET    | All 10 files begin with `# [Title]` headings.                                                                                                                                                                                                                                             |
| Heading inventories match                       | MET    | All 10 files have identical heading counts and content (after expected emoji removal).                                                                                                                                                                                                    |
| Zero broken cross-reference links               | MET    | 282 relative `.md` links extracted and validated across all 10 target files. Zero broken links.                                                                                                                                                                                           |
| 10-row summary table produced                   | MET    | See Summary Table above.                                                                                                                                                                                                                                                                  |

---

## Consolidated Findings

### No CRITICAL or HIGH findings.

### MEDIUM Findings (1)

1. **`penalty-system.md`**: Systematic Unicode-to-ASCII conversion affecting unit annotations and pseudo-code (~50 occurrences). `hm³`->`hm3`, `m³/s`->`m3/s`, `Σ_`->`Sigma_`, `×`->`x`, `≥`->`>=`, `≤`->`<=`, `∞`->`Inf`. No semantic information lost. This is a display-only difference that does not affect implementability.

### LOW Findings (9)

1. **`input-directory-structure.md`**: Emoji `⚠️` removed from callout.
2. **`input-directory-structure.md`**: SVG diagram reference replaced with `<!-- TODO: diagram -->` placeholder.
3. **`input-scenarios.md`**: Emoji `⚠️` removed from "Order Invariance" callout.
4. **`input-constraints.md`**: Emoji `⚠️` removed from "Order Invariance" callout.
5. **`input-constraints.md`**: Emojis (`✅`, `⚠️`, `❌`) removed from Reproducibility Guarantees table. Descriptive text preserved.
6. **`output-schemas.md`**: Emoji `🚧` removed from Batteries DEFERRED heading and directory tree.
7. **All 10 files**: Line count reductions (20-32 lines each) fully accounted for by YAML frontmatter removal.
8. **`output-infrastructure.md`**: Ticket-specified cross-reference to `../architecture/cli-and-lifecycle.md` does not exist in either source or target (the file exists but is not referenced from this document).
9. **`binary-formats.md`**: AC-specified FlatBuffers names (`CutEntry`, `CutPool`, `CheckpointManifest`) do not match actual schema names (`BendersCut`, `StageCuts`, `PolicyMetadata`). All actual schemas are present and complete.
