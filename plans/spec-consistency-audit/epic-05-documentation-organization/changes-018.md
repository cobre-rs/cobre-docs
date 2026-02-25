# Changes Log — Ticket 018: Audit and Update NEWAVE/CEPEL References

**Date**: 2026-02-25
**Scope**: Corpus-wide audit of all NEWAVE/CEPEL/DECOMP/DESSEM references in `src/`

## Decision Table

Every occurrence of NEWAVE, CEPEL, DECOMP, or DESSEM in the `src/` tree is listed below with a disposition.

| #   | File                                         | Line | Keyword              | Context (abbreviated)                                                         | Decision   | Rationale                                                                      |
| --- | -------------------------------------------- | ---- | -------------------- | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| 1   | `specs/overview/notation-conventions.md`     | 45   | NEWAVE               | "Standard NEWAVE branching factor"                                            | KEEP       | Domain terminology -- describes where the typical value of 20 comes from       |
| 2   | `crates/overview.md`                         | 23   | NEWAVE               | "File parsers and serializers (NEWAVE, CSV, JSON, Arrow)"                     | **UPDATE** | Falsely claims NEWAVE parser exists; replaced with (JSON, Parquet, CSV, Arrow) |
| 3   | `crates/overview.md`                         | 41   | NEWAVE               | "Parsing NEWAVE files, reading TOML configs..."                               | **UPDATE** | Falsely claims NEWAVE parsing capability; replaced with JSON/Parquet wording   |
| 4   | `specs/data-model/internal-structures.md`    | 69   | CEPEL                | "Based on CEPEL's dead-volume filling model"                                  | KEEP       | Domain modeling reference -- describes design origin                           |
| 5   | `specs/data-model/internal-structures.md`    | 135  | CEPEL                | "Based on CEPEL's dead-volume filling model"                                  | KEEP       | Domain modeling reference -- describes design origin                           |
| 6   | `reference/bibliography.md`                  | 61   | CEPEL                | "CEPEL Technical Documentation"                                               | KEEP       | Bibliography entry -- canonical reference                                      |
| 7   | `reference/bibliography.md`                  | 62   | NEWAVE/DECOMP/DESSEM | "Official documentation for the NEWAVE/DECOMP/DESSEM suite"                   | KEEP       | Bibliography description -- factual reference                                  |
| 8   | `specs/data-model/input-constraints.md`      | 259  | CEPEL                | "CEPEL advanced downstream flow formulations"                                 | KEEP       | Future extension note -- describes potential modeling enhancement              |
| 9   | `reference/glossary.md`                      | 3    | NEWAVE/CEPEL         | "Portuguese equivalents where they appear in NEWAVE/CEPEL documentation"      | KEEP       | Glossary scope description -- factual context                                  |
| 10  | `reference/glossary.md`                      | 93   | NEWAVE/CEPEL         | Section header "NEWAVE / CEPEL Ecosystem"                                     | KEEP       | Glossary section -- domain terminology definitions                             |
| 11  | `reference/glossary.md`                      | 97   | NEWAVE               | "Long-term hydrothermal dispatch model (monthly, 5-10 years)"                 | KEEP       | Glossary definition -- factual                                                 |
| 12  | `reference/glossary.md`                      | 98   | DECOMP               | "Medium-term model (weekly resolution)"                                       | KEEP       | Glossary definition -- factual                                                 |
| 13  | `reference/glossary.md`                      | 99   | DESSEM               | "Short-term model (hourly/half-hourly, day-ahead)"                            | KEEP       | Glossary definition -- factual                                                 |
| 14  | `reference/glossary.md`                      | 103  | CEPEL/NEWAVE         | "Centro de Pesquisas de Energia Eletrica -- R&D center that develops NEWAVE"  | KEEP       | Glossary definition -- factual                                                 |
| 15  | `introduction.md`                            | 21   | NEWAVE/CEPEL         | "Parsers for NEWAVE (CEPEL) file formats"                                     | **UPDATE** | Falsely claims parser exists; replaced with planned-support wording            |
| 16  | `introduction.md`                            | 44   | NEWAVE/DECOMP/DESSEM | "born from the need for an open, modern alternative...NEWAVE, DECOMP, DESSEM" | KEEP       | Strategic positioning -- explains project motivation                           |
| 17  | `contributing.md`                            | 65   | NEWAVE               | "NEWAVE produces X for the same case"                                         | KEEP       | Bug-reporting example -- legitimate comparison reference                       |
| 18  | `contributing.md`                            | 111  | NEWAVE               | "docs(io): document NEWAVE HIDR.DAT field mapping"                            | **UPDATE** | Commit example implies NEWAVE parser exists; replaced with Parquet example     |
| 19  | `specs/data-model/input-hydro-extensions.md` | 219  | DECOMP/DESSEM        | "Import FPHA coefficients from DECOMP/DESSEM input files"                     | KEEP       | Legacy migration use-case in feature table -- does not claim parser exists     |
| 20  | `specs/data-model/penalty-system.md`         | 273  | CEPEL                | "based on CEPEL's dead-volume filling approach"                               | KEEP       | Domain modeling reference -- describes design origin                           |
| 21  | `specs/data-model/input-system-entities.md`  | 374  | CEPEL                | "based on CEPEL's dead-volume filling model"                                  | KEEP       | Domain modeling reference -- describes design origin                           |
| 22  | `specs/data-model/input-system-entities.md`  | 392  | CEPEL                | "CEPEL models bottom discharge outlets"                                       | KEEP       | Deferred feature note -- describes modeling gap                                |
| 23  | `specs/data-model/input-system-entities.md`  | 479  | CEPEL                | "Future Extension -- CEPEL Advanced Flow Modeling"                            | KEEP       | Future extension block -- documents potential enhancements                     |
| 24  | `specs/data-model/input-system-entities.md`  | 483  | CEPEL                | "CEPEL supports propagation curves"                                           | KEEP       | Future extension detail -- domain modeling reference                           |
| 25  | `specs/data-model/input-system-entities.md`  | 485  | CEPEL                | "full details and CEPEL references"                                           | KEEP       | Cross-reference to deferred features                                           |
| 26  | `specs/architecture/scenario-generation.md`  | 379  | CEPEL/DECOMP         | "approach used by CEPEL's DECOMP model"                                       | KEEP       | Algorithm description -- factual domain reference                              |
| 27  | `specs/architecture/scenario-generation.md`  | 393  | DECOMP               | "DECOMP special case"                                                         | KEEP       | Algorithm description -- factual domain reference                              |
| 28  | `specs/architecture/scenario-generation.md`  | 396  | DECOMP               | "DECOMP Special Case (N_t = 1...)"                                            | KEEP       | Code comment in diagram -- factual                                             |
| 29  | `specs/architecture/scenario-generation.md`  | 430  | DECOMP               | "degenerates exactly into the complete tree for the DECOMP special case"      | KEEP       | Algorithm description -- factual                                               |
| 30  | `specs/architecture/scenario-generation.md`  | 437  | DECOMP               | "DECOMP-like configurations with deterministic trunks"                        | KEEP       | Feature list item -- factual domain reference                                  |
| 31  | `specs/architecture/scenario-generation.md`  | 455  | DECOMP               | "Complete tree solver integration (DECOMP-like)"                              | KEEP       | Cross-reference to deferred features                                           |
| 32  | `specs/math/hydro-production-models.md`      | 38   | CEPEL/DECOMP/DESSEM  | "maps Cobre symbols to equivalent CEPEL/Portuguese terminology"               | KEEP       | Notation mapping table header -- domain reference                              |
| 33  | `specs/math/hydro-production-models.md`      | 40   | CEPEL                | "Cobre / CEPEL/Portuguese" table header                                       | KEEP       | Column header for symbol mapping table                                         |
| 34  | `specs/math/hydro-production-models.md`      | 53   | CEPEL                | "CEPEL models include q_lat"                                                  | KEEP       | Technical note on lateral flow modeling -- domain reference                    |
| 35  | `specs/deferred.md`                          | 35   | CEPEL/NEWAVE/DECOMP  | "Reference: CEPEL NEWAVE/DECOMP GNL modeling documentation"                   | KEEP       | Deferred feature reference -- factual                                          |
| 36  | `specs/deferred.md`                          | 388  | CEPEL                | "CEPEL PAR(p)-A Variant"                                                      | KEEP       | Deferred feature section header                                                |
| 37  | `specs/deferred.md`                          | 392  | CEPEL                | "CEPEL's PAR(p)-A model (referenced in Rel-1941_2021)"                        | KEEP       | Deferred feature description -- factual                                        |
| 38  | `specs/deferred.md`                          | 411  | CEPEL                | "Reference: CEPEL Rel-1941_2021"                                              | KEEP       | Deferred feature reference -- factual                                          |
| 39  | `specs/deferred.md`                          | 560  | CEPEL/DECOMP         | "as in CEPEL's DECOMP model"                                                  | KEEP       | Deferred feature description -- factual                                        |
| 40  | `specs/deferred.md`                          | 572  | DECOMP               | "DECOMP Special Case"                                                         | KEEP       | Deferred feature detail -- factual                                             |
| 41  | `specs/deferred.md`                          | 594  | CEPEL/DECOMP         | "CEPEL DECOMP: Modelo DECOMP"                                                 | KEEP       | Deferred feature reference URL                                                 |
| 42  | `specs/deferred.md`                          | 821  | CEPEL                | "Standard PAR(p) that CEPEL PAR(p)-A (C.8) extends"                           | KEEP       | Cross-reference -- factual                                                     |

## Summary

| Decision | Count | Description                                                                                               |
| -------- | ----- | --------------------------------------------------------------------------------------------------------- |
| KEEP     | 38    | Domain modeling, glossary, bibliography, strategic positioning, deferred features, algorithm descriptions |
| UPDATE   | 4     | False claims of existing NEWAVE parser capability                                                         |
| REMOVE   | 0     | No occurrences required removal                                                                           |

## Applied Changes

### 1. `src/introduction.md` line 21

**Before**: `**Interoperability.** Parsers for NEWAVE (CEPEL) file formats and standard data formats. Bring your existing data, export results in modern formats.`

**After**: `**Interoperability.** Standard data formats (JSON, Parquet, Arrow) for input and output. Planned support for NEWAVE (CEPEL) legacy file formats to enable migration from existing tools.`

**Rationale**: The original wording claims parsers exist. The replacement describes current capabilities (standard formats) and positions NEWAVE support as planned.

### 2. `src/crates/overview.md` line 23

**Before**: `| [\`cobre-io\`](./io.md) | ... | File parsers and serializers (NEWAVE, CSV, JSON, Arrow) |`

**After**: `| [\`cobre-io\`](./io.md) | ... | File parsers and serializers (JSON, Parquet, CSV, Arrow) |`

**Rationale**: Crate table listed NEWAVE as a supported format. Replaced with Parquet, which is an actually supported format.

### 3. `src/crates/overview.md` line 41

**Before**: `**IO is separated from computation.** Parsing NEWAVE files, reading TOML configs, or exporting Arrow tables happens in \`cobre-io\`.`

**After**: `**IO is separated from computation.** Reading JSON configs, loading Parquet time series, or exporting Arrow tables happens in \`cobre-io\`.`

**Rationale**: Design principle example cited NEWAVE parsing as an existing IO operation. Replaced with JSON/Parquet operations that actually exist.

### 4. `src/contributing.md` line 111

**Before**: `docs(io): document NEWAVE HIDR.DAT field mapping`

**After**: `docs(io): document Parquet time series column conventions`

**Rationale**: Commit message example implied NEWAVE parser documentation exists. Replaced with a realistic example for current IO capabilities.

## Verification

- `mdbook build` exits 0 (warnings in `risk-measures.md` are pre-existing and unrelated)
- All 38 KEEP decisions verified: none claim a NEWAVE parser exists today
- All 4 UPDATE decisions applied and verified in modified files
- No changes to `deferred.md`, `glossary.md`, `bibliography.md`, `scenario-generation.md`, or data-model specs
- Strategic positioning in `introduction.md` line 44 preserved unchanged
- Bug-reporting example in `contributing.md` line 65 preserved unchanged
