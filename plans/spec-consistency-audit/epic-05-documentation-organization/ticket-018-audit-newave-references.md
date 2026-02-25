# ticket-018 Audit and Update NEWAVE/CEPEL References

## Context

### Background

The Cobre documentation references NEWAVE, CEPEL, DECOMP, and DESSEM across 16 files with 44 total occurrences (after ticket-017 removes the migration stubs, this drops to 15 files and 43 occurrences). These references fall into distinct categories: strategic positioning ("Cobre is an alternative to NEWAVE/DECOMP/DESSEM"), domain modeling concepts (CEPEL dead-volume filling, FPHA mapping, Portuguese terminology), domain terminology ("NEWAVE branching factor", "CEPEL PAR(p)-A variant"), file format specifics (HIDR.DAT, TERM.DAT, CONFHD.DAT), and parser documentation (cobre-io NEWAVE parser descriptions).

The NEWAVE file format parsing feature has been deferred. References to NEWAVE parser capabilities in `introduction.md` and `crates/overview.md` present an incomplete or misleading picture of the current codebase state. Additionally, the `contributing.md` example using "NEWAVE HIDR.DAT field mapping" references a parser feature that does not yet exist. These references need to be updated or removed per the epic's keep/update/remove policy.

The majority of references (domain concepts, strategic positioning, glossary, bibliography, deferred features) are legitimate and should be kept as-is.

### Relation to Epic

This is the final ticket in Epic 05. It performs a corpus-wide audit of NEWAVE/CEPEL/DECOMP/DESSEM references and applies targeted updates to 3 files where references are misleading or premature. The audit uses the exclusion table pattern established in Epic 03 (ticket-011's 25-entry exclusion table for the 200-to-192 replacement) to document the keep/update/remove decision for every occurrence.

### Current State

After ticket-017 removes `src/migration/` and its SUMMARY.md references, the NEWAVE/CEPEL/DECOMP/DESSEM reference distribution is:

| File                                             | Count | Category                                                                          |
| ------------------------------------------------ | ----- | --------------------------------------------------------------------------------- |
| `src/introduction.md`                            | 2     | 1 parser claim (UPDATE), 1 strategic positioning (KEEP)                           |
| `src/crates/overview.md`                         | 2     | 1 crate table parser mention (UPDATE), 1 design principle parser mention (UPDATE) |
| `src/contributing.md`                            | 2     | 1 bug report example (KEEP), 1 commit message example (UPDATE)                    |
| `src/reference/glossary.md`                      | 6     | All ecosystem definitions (KEEP)                                                  |
| `src/reference/bibliography.md`                  | 2     | CEPEL documentation entry (KEEP)                                                  |
| `src/specs/overview/notation-conventions.md`     | 1     | "Standard NEWAVE branching factor" (KEEP)                                         |
| `src/specs/data-model/internal-structures.md`    | 2     | CEPEL dead-volume filling (KEEP)                                                  |
| `src/specs/data-model/input-system-entities.md`  | 5     | CEPEL modeling concepts (KEEP)                                                    |
| `src/specs/data-model/input-constraints.md`      | 1     | CEPEL advanced downstream flow (KEEP)                                             |
| `src/specs/data-model/input-hydro-extensions.md` | 1     | "Legacy system migration" use case with DECOMP/DESSEM (KEEP)                      |
| `src/specs/data-model/penalty-system.md`         | 1     | CEPEL dead-volume filling (KEEP)                                                  |
| `src/specs/math/hydro-production-models.md`      | 3     | CEPEL/Portuguese terminology mapping (KEEP)                                       |
| `src/specs/architecture/scenario-generation.md`  | 6     | DECOMP complete tree mode (KEEP)                                                  |
| `src/specs/deferred.md`                          | 8     | CEPEL/NEWAVE/DECOMP references in deferred features (KEEP)                        |

**Total after ticket-017: 42 occurrences across 14 files. 38 KEEP, 4 UPDATE.**

The 4 UPDATE targets are:

1. `src/introduction.md` line 21: "Parsers for NEWAVE (CEPEL) file formats" -- claims parser exists
2. `src/crates/overview.md` line 23: crate table says "File parsers and serializers (NEWAVE, CSV, JSON, Arrow)" -- claims NEWAVE parser exists
3. `src/crates/overview.md` line 41: "Parsing NEWAVE files, reading TOML configs, or exporting Arrow tables happens in `cobre-io`" -- claims parser exists
4. `src/contributing.md` line 111: `docs(io): document NEWAVE HIDR.DAT field mapping` -- example references unimplemented feature

## Specification

### Requirements

1. **Produce a complete decision table**: For every NEWAVE/CEPEL/DECOMP/DESSEM occurrence across the corpus, record the file, line number, surrounding context, and the decision (KEEP / UPDATE / REMOVE) with rationale.
2. **Update `src/introduction.md` line 21**: Change the parser claim to defer the capability. Replace "Parsers for NEWAVE (CEPEL) file formats and standard data formats. Bring your existing data, export results in modern formats." with wording that describes the current state (standard format support) while noting planned NEWAVE support.
3. **Update `src/crates/overview.md` line 23**: Change the cobre-io description in the crate table from "File parsers and serializers (NEWAVE, CSV, JSON, Arrow)" to remove the NEWAVE claim and describe current capabilities.
4. **Update `src/crates/overview.md` line 41**: Change "Parsing NEWAVE files, reading TOML configs, or exporting Arrow tables happens in `cobre-io`" to describe current I/O capabilities without the NEWAVE parser claim.
5. **Update `src/contributing.md` line 111**: Replace the commit message example `docs(io): document NEWAVE HIDR.DAT field mapping` with a non-NEWAVE example that is equally illustrative of the `docs(<scope>)` pattern.
6. **Verify no collateral damage**: After edits, confirm that no internal links are broken and `mdbook build` exits 0.

### Inputs/Props

- Complete grep output for `NEWAVE|CEPEL|DECOMP|DESSEM` across `src/` (after ticket-017 changes)
- The epic's keep/update/remove policy table (from `00-epic-overview.md`)
- The 3 files to modify: `src/introduction.md`, `src/crates/overview.md`, `src/contributing.md`

### Outputs/Behavior

1. **Decision table**: Written to `plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md`. One row per occurrence. Columns: File, Line, Context, Keyword, Decision, Rationale.
2. **3 files updated** with minimal, targeted wording changes:
   - `src/introduction.md`: line 21 updated
   - `src/crates/overview.md`: lines 23 and 41 updated
   - `src/contributing.md`: line 111 updated
3. **mdBook build** exits 0 after changes.

### Error Handling

- If the grep after ticket-017 reveals additional files not listed in the Current State table above, add them to the decision table and apply the policy. Do not skip any file.
- If any of the target lines have changed since this ticket was written (e.g., due to ticket-016 findings being applied), locate the equivalent content by context and update accordingly.

## Acceptance Criteria

- [ ] Given a grep for `NEWAVE|CEPEL|DECOMP|DESSEM` across `src/` (post ticket-017), when all occurrences are enumerated, then every occurrence has a row in the decision table at `changes-018.md` with File, Line, Context, Keyword, Decision (KEEP/UPDATE/REMOVE), and Rationale
- [ ] Given `src/introduction.md` line 21 claiming "Parsers for NEWAVE (CEPEL) file formats", when the ticket is complete, then the line no longer claims the parser exists and instead describes planned/future NEWAVE support alongside current standard format support
- [ ] Given `src/crates/overview.md` line 23 listing "NEWAVE" in the cobre-io description, when the ticket is complete, then the crate table description reflects current capabilities without claiming NEWAVE parser support
- [ ] Given `src/crates/overview.md` line 41 mentioning "Parsing NEWAVE files", when the ticket is complete, then the design principle paragraph describes I/O separation without referencing the unimplemented NEWAVE parser
- [ ] Given `src/contributing.md` line 111 with the example `docs(io): document NEWAVE HIDR.DAT field mapping`, when the ticket is complete, then the example uses a non-NEWAVE `docs(<scope>)` commit message that illustrates the same pattern
- [ ] Given all KEEP decisions in the decision table, when the kept references are reviewed, then none of them claim that a NEWAVE parser currently exists in cobre-io
- [ ] Given the modified repository, when `mdbook build` is run, then the build exits with code 0
- [ ] The changes log exists at `plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md`

## Implementation Guide

### Suggested Approach

1. **Run the reference scan**: Execute `grep -rn 'NEWAVE\|CEPEL\|DECOMP\|DESSEM' src/ --include='*.md'` to get the current reference list. Verify it matches the expected 14 files / 42 occurrences (post ticket-017).

2. **Build the decision table**: For each occurrence, classify per the policy:
   - **KEEP** — Strategic positioning, domain modeling, terminology, glossary, bibliography, deferred features
   - **UPDATE** — Parser claims in `introduction.md` and `crates/overview.md`, commit example in `contributing.md`
   - **REMOVE** — None expected (the only removable content was the migration stubs, handled by ticket-017)

3. **Apply the 4 updates**:

   **3a. `src/introduction.md` line 21** — Current:

   ```
   **Interoperability.** Parsers for NEWAVE (CEPEL) file formats and standard data formats. Bring your existing data, export results in modern formats.
   ```

   Suggested replacement:

   ```
   **Interoperability.** Standard data formats (JSON, Parquet, Arrow) for input and output. Planned support for NEWAVE (CEPEL) legacy file formats to enable migration from existing tools.
   ```

   **3b. `src/crates/overview.md` line 23** — Current crate table row:

   ```
   | [`cobre-io`](./io.md) | <span class="status-experimental">experimental</span> | File parsers and serializers (NEWAVE, CSV, JSON, Arrow) |
   ```

   Suggested replacement:

   ```
   | [`cobre-io`](./io.md) | <span class="status-experimental">experimental</span> | File parsers and serializers (JSON, Parquet, CSV, Arrow) |
   ```

   **3c. `src/crates/overview.md` line 41** — Current:

   ```
   **IO is separated from computation.** Parsing NEWAVE files, reading TOML configs, or exporting Arrow tables happens in `cobre-io`. Solver crates never touch files directly — they receive typed data structures.
   ```

   Suggested replacement:

   ```
   **IO is separated from computation.** Reading JSON configs, loading Parquet time series, or exporting Arrow tables happens in `cobre-io`. Solver crates never touch files directly — they receive typed data structures.
   ```

   **3d. `src/contributing.md` line 111** — Current:

   ```
   docs(io): document NEWAVE HIDR.DAT field mapping
   ```

   Suggested replacement:

   ```
   docs(io): document Parquet time series column conventions
   ```

4. **Verify build**: Run `mdbook build` and confirm exit 0.

5. **Write the changes log**: Document the complete decision table and the 4 applied edits in `changes-018.md`.

### Key Files to Modify

| File                     | Lines | Change                                                  |
| ------------------------ | ----- | ------------------------------------------------------- |
| `src/introduction.md`    | 21    | Update parser claim to planned/future wording           |
| `src/crates/overview.md` | 23    | Remove NEWAVE from crate table description              |
| `src/crates/overview.md` | 41    | Replace NEWAVE parser example with current I/O examples |
| `src/contributing.md`    | 111   | Replace NEWAVE commit message example                   |

### Key Files to Create

| File                                                                             | Purpose                        |
| -------------------------------------------------------------------------------- | ------------------------------ |
| `plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md` | Decision table and changes log |

### Patterns to Follow

- **Exclusion table for corpus-wide changes**: Following the pattern from ticket-011 (25-entry exclusion table for 200-to-192). Every occurrence gets a row in the decision table, including those where the decision is KEEP. This provides full traceability.
- **Annotation-not-modification**: For the UPDATE items, prefer clarifying the current state (deferred, planned) over wholesale removal of NEWAVE mentions. The introduction should still mention NEWAVE interoperability as a planned goal.
- **mdBook build as regression gate**: Verify exit 0 after all edits.
- **Changes log**: Follow the `changes-NNN.md` pattern from previous tickets.

### Pitfalls to Avoid

- Do not remove NEWAVE/CEPEL references from domain modeling, terminology, or strategic positioning contexts. The policy is surgical: only update references that claim parser capabilities exist today.
- Do not modify `src/specs/deferred.md` references. The deferred features page explicitly discusses future NEWAVE-related capabilities; these references are correctly placed.
- Do not touch `src/reference/glossary.md` or `src/reference/bibliography.md`. The NEWAVE/CEPEL ecosystem definitions and CEPEL documentation bibliography entry are legitimate reference material.
- Do not modify the DECOMP/DESSEM references in `src/specs/architecture/scenario-generation.md`. These reference the complete tree execution mode which is a legitimate algorithmic concept, not a parser feature.
- Be careful with the `src/introduction.md` line 44 reference ("Cobre was born from the need for an open, modern alternative to the legacy FORTRAN-based tools...NEWAVE, DECOMP, DESSEM"). This is strategic positioning and should be KEPT unchanged.
- The `src/contributing.md` line 65 reference ("NEWAVE produces X for the same case") is a legitimate bug-reporting context example and should be KEPT. Only line 111 (the commit message example) should be updated.

## Testing Requirements

### Unit Tests

N/A (documentation change, no code).

### Integration Tests

- `mdbook build` exits with code 0 after all edits.
- Post-edit grep for `NEWAVE|CEPEL|DECOMP|DESSEM` across `src/` confirms:
  - `src/introduction.md` still mentions NEWAVE (line 44, strategic positioning) but line 21 no longer claims parser exists
  - `src/crates/overview.md` no longer mentions NEWAVE
  - `src/contributing.md` line 65 still mentions NEWAVE (bug report context) but line 111 no longer uses the HIDR.DAT example
  - All other files unchanged

### E2E Tests

N/A.

## Dependencies

- **Blocked By**: ticket-017 (migration stubs should be removed first so the audit reflects the final state)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
