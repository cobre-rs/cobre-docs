# Reference content conventions

Status: decided (E11 ticket-160, 2026-10-05)

This document fixes the table schemas, type vocabulary, anchor scheme and fence meta of the reference pages. Its
consumers are the E11 reference tickets 161-180 (they write to it), the E13 tickets 201a, 202-215 and 221 (their
checkers parse it) and the E15 check GRD-05 (`check:gc-examples`). It is a design document, not site content; no gate
reads it.

## 1. Scope and consumers

The conventions cover the six pages under `src/content/docs/reference/`: `case-directory-format`, `output-format`,
`error-codes`, `generic-constraints`, `cli-reference` and `json-schemas`, and the pages E13 splits out of them.

| Consumer                                                  | Reads                                                                                    | Section    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| E11 tickets 161-180                                       | every new table, heading and fence follows the conventions                               | 2-7        |
| E13 ticket-201a                                           | table-row parity of the reference splits                                                 | 2, 3, 5    |
| E13 ticket-212                                            | error-codes re-key by rule slug                                                          | 6          |
| E13 ticket-214 (`check:error-coverage`, GRD-08)           | error-codes headings                                                                     | 6          |
| E13 tickets 202-202a, 215 (`check:input-schemas`, GRD-03) | input tables against the 17 bound vendored schemas (`config.json` is not bound, D-215-1) | 2, 4, 5, 8 |
| E15 GRD-05 (`check:gc-examples`)                          | generic-constraint fences                                                                | 7          |

The pages own their facts (field lists, messages). This document owns only the shape in which the pages state them.

## 2. Input table schema

An input file section holds one table per file, with the columns below. The header row and one example row:

| Name                     | Type   | Required | Default | Units | Description                                                            |
| ------------------------ | ------ | -------- | ------- | ----- | ---------------------------------------------------------------------- |
| `hydros[].tailrace.type` | string | Yes      | —       | —     | One of `"piecewise"`, `"polynomial"`. Selects the tailrace curve form. |

Column rules:

- **Header.** The header row is exactly `Name | Type | Required | Default | Units | Description`, with these six names in
  this order (D-202a-3). A table with any other header is not an input table and the checker does not read it.
- **Name.** A JSON `Name` cell holds the backticked full path from the file root, with `[]` after an array of objects
  (`hydros[].tailrace.type`) and `<name>` for a user-chosen map key (`profiles.<name>.correlation_groups[].name`; the array row itself is `profiles.<name>.correlation_groups`, with no trailing `[]`). An array of
  non-objects (scalars, or arrays of scalars) is one leaf row with no `[]` and Type `array`; the example is
  `hydros[].evaporation.coefficients_mm`. A Parquet `Name` cell holds the backticked column name.
- **Type.** One name from section 4, written bare (no backticks) and case-sensitive: `Int32` is not `int32`. A nullable
  JSON field writes `integer \| null`, with the pipe escaped so the cell stays one cell.
- **Required.** One of `Yes`, `No`, `Conditional`, read against the enclosing object (D-202a-4):
  - `Yes`: the schema lists the field in `required` of its enclosing object in every `oneOf` or `anyOf` branch of that
    object. A `{"type":"null"}` branch is the nullable marker, not a branch.
  - `No`: the schema does not require the field.
  - `Conditional`: the schema does not require the field, and the Description states the load-time condition. A field
    that only some `oneOf` or `anyOf` variants require is `Conditional`. `check:input-schemas` treats `Conditional` as
    not required.
- **Default.** A backticked JSON or Parquet literal, or the em dash `—` (U+2014).
- **Units.** A plain unit (`MW`, `USD/MWh`, `USD/(m³/s·h)`, `hm³`, `m³/s`, `h`) or `—` (U+2014). Currency is written
  `USD`, never a bare dollar sign, which remark-math can pair into inline math across a table row.
- **Description.** An enumerated field has Type `string` and a Description that opens `One of` followed by each value as
  a backticked JSON literal, as in the example row. The values sit in the first sentence, which ends at the first period
  followed by a space, or at the end of the cell. The set is exactly the schema's set; for a tagged-union tag property
  (`type`, `model`) it is the union of the branches' `const` values (D-202a-5).
- **Comparison.** Cells are compared after trimming, so column padding is free (the repository's prettier hook pads
  tables). `\|` inside a cell is not a column separator, and fenced code is skipped.

Two rules apply to the input-schema checker (E13 ticket-202a, D-202a-4 and D-202a-1):

- **Required is parent-relative.** `Required` is read relative to the enclosing object. A field that the schema requires
  inside an optional parent object is `Yes`, and the parent row carries the optionality. In the example above, `tailrace`
  is optional in `hydros[]`, so the `hydros[].tailrace` row says `No`, while `type` is required once a `tailrace` object
  exists, so its row says `Yes`. The contrast within the same object: `hydros[].tailrace.type` is `Yes` because every
  `tailrace` variant lists `type` in `required`, and `hydros[].tailrace.coefficients` is `Conditional` because only the
  `polynomial` variant lists it. E11 ticket-166 writes ten such rows.
- **No `$schema` row.** The root `$schema` key has no row on any file table. The case-format `## Conventions` block
  (ticket-167) describes it once.

**Door**: one-way.
**Revisit trigger**: none known.

## 3. Output table schema

An output file section holds one table per file with these columns. The header row and one example row:

| Name       | Type  | Nullable | Units | Description             |
| ---------- | ----- | -------- | ----- | ----------------------- |
| `stage_id` | Int32 | No       | —     | Stage index of the row. |

Column rules:

- **Name.** The backticked column name.
- **Type.** A name from section 4, written bare: an Arrow name (Parquet), or a JSON keyword or FlatBuffers spelling for
  the JSON and checkpoint files. The Type cell never carries `\| null`; the Nullable column states nullability.
- **Nullable.** One of `Yes`, `No`. The value is the `nullable` flag of the writer schema field.
- **Units.** As in section 2.
- **Description.** What the column holds. The example is the `stage_id` column of `simulation/hydros/`, a row-prefix
  column of every simulation table (`crates/cobre-io/src/output/schemas.rs:23-28` at cobre v0.17.0).

**Door**: one-way.
**Revisit trigger**: none known.

## 4. Type vocabulary

Parquet columns use the Arrow type names that the loader's wrong-type message and the writer schemas print.

| Name      | Parquet physical type | pyarrow        | polars       | Read or written by                                                                                                            |
| --------- | --------------------- | -------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `Int8`    | INT32                 | `pa.int8()`    | `pl.Int8`    | written (output schemas)                                                                                                      |
| `Int32`   | INT32                 | `pa.int32()`   | `pl.Int32`   | read (`extract_required_int32`, `extract_optional_int32`) and written                                                         |
| `Int64`   | INT64                 | `pa.int64()`   | `pl.Int64`   | written                                                                                                                       |
| `UInt32`  | INT32                 | `pa.uint32()`  | `pl.UInt32`  | read (`extract_required_uint32`) and written                                                                                  |
| `UInt64`  | INT64                 | `pa.uint64()`  | `pl.UInt64`  | written                                                                                                                       |
| `Float64` | DOUBLE                | `pa.float64()` | `pl.Float64` | read (`extract_required_float64`, `extract_optional_float64`) and written                                                     |
| `Utf8`    | BYTE_ARRAY (string)   | `pa.string()`  | `pl.String`  | read (`extract_required_string`, `crates/cobre-io/src/extensions/evaporation_models.rs:150`, the `source` column) and written |
| `Boolean` | BOOLEAN               | `pa.bool_()`   | `pl.Boolean` | written                                                                                                                       |
| `Date32`  | INT32 (date)          | `pa.date32()`  | `pl.Date`    | read (`extract_required_date32`) and written                                                                                  |

Parquet physical names are not used in tables. They cannot tell `Int32` from `UInt32` or `Date32` (all physical INT32)
and differ from the names a user sees in the load error.

JSON fields use JSON Schema type keywords, as the 18 vendored input schemas (`public/schemas/*.schema.json`) do. The
nullable form below applies to input tables only; output tables state nullability in the Nullable column.

| Name              | Meaning                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `integer`         | JSON integer                                                                                                                                                                              |
| `number`          | JSON number                                                                                                                                                                               |
| `string`          | JSON string; an enumeration is a `string` whose Description lists the values                                                                                                              |
| `boolean`         | `true` or `false`                                                                                                                                                                         |
| `object`          | JSON object                                                                                                                                                                               |
| `array`           | JSON array                                                                                                                                                                                |
| `integer \| null` | A nullable field of an input table: append `\| null` to the keyword. The vendored schemas encode it two ways: `"type": ["integer", "null"]`, and `anyOf` with a `{"type": "null"}` branch |

CSV columns (`training/dictionaries/*.csv`) use the JSON keywords (D-208-2), and `check:type-spelling` reads the three tables of this section.

Checkpoint wire fields (`policy/cuts/*.bin`, `basis/`, `states/`, `manifest.bin`) are FlatBuffers. They use the
spellings declared in `crates/cobre-io/schemas/policy.fbs`.

| Name      | Meaning                                                                         |
| --------- | ------------------------------------------------------------------------------- |
| `bool`    | Boolean scalar                                                                  |
| `byte`    | Underlying type of `enum EntityType : byte` (`policy.fbs:58`); not a field type |
| `uint8`   | Unsigned 8-bit scalar                                                           |
| `int32`   | Signed 32-bit scalar                                                            |
| `uint32`  | Unsigned 32-bit scalar                                                          |
| `uint64`  | Unsigned 64-bit scalar                                                          |
| `float64` | 64-bit floating-point scalar                                                    |
| `string`  | UTF-8 string                                                                    |

A vector is written `[T]` as in the schema (`[float64]`, `[uint8]`, `[uint32]`, `[string]`, `[EntitySlot]`,
`[AffinePiece]`, `[ManifestNode]`, `[ManifestEdge]`, `[HydroSeasonOrders]`). A table or enum field is named by its
schema name (`EntityType`, `SeasonManifest`).

The loader quotes the type it found and the type it needs. The message is, verbatim, from
`crates/cobre-io/src/parquet_helpers.rs:37` at cobre v0.17.0:

```text
column "{name}" has type {actual} but {expected} is required
```

`{actual}` is the Arrow `DataType` display name. In the shared helpers `{expected}` is one of `Int32`, `Float64`,
`UInt32`, `Date32`. The one `Utf8` reader, `extract_required_string` in `crates/cobre-io/src/extensions/evaporation_models.rs:150`, prints the
same message shape with `Utf8` as the expected type. A pandas default `int64` column therefore fails on an `Int32` column
with:

```text
column "hydro_id" has type Int64 but Int32 is required
```

A Type cell takes any name in the tables of this section except `byte`. A type the code adds later joins these tables in
the same change that documents it.

**Door**: one-way.
**Revisit trigger**: none known.

## 5. Anchors

A file section is a heading whose text is only the backticked case-relative (input) or output-relative path. The slug
derives from the identifier:

- ``### `system/hydros.json` `` gives `#systemhydrosjson`.
- ``### `training/metadata.json` `` gives `#trainingmetadatajson`.

There are no custom heading ids and no heading-id plugin (R95); every anchor is a heading slug. A file-path heading
occurs once across the reference pages (the checker reports a second occurrence as `DUPSECTION`). A heading that has
inbound links keeps its text. Renaming one requires every inbound link to change in the same batch (R7).

### Anchor inventory

Snapshot taken at 2026-10-05T18:12:11Z on the working tree, with this command from the repository root (40 distinct
targets with a current link, plus 3 planned-inbound rows with none):

```bash
/usr/bin/grep -rhoE --exclude-dir=pt-br '/reference/(case-directory-format|output-format|error-codes|generic-constraints|cli-reference|json-schemas)/?#[A-Za-z0-9_-]+' src/content/docs | sed -E 's#/?\##\##' | sort | uniq -c
```

The counts are links from `src/content/docs`, including links between the reference pages themselves, and include
uncommitted edits in the working tree. The table is a snapshot; E13 ticket-201's anchor map is recomputed at E13 time. E11 and E13 keep each target or re-point every link in
the same batch (R7). The gate of record is `check:links`.

| Target                                                                           | Inbound links | Note                                                                                                                                     |
| -------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `case-directory-format#configjson`                                               | 1             | keep, or re-point every link in the same batch                                                                                           |
| `case-directory-format#constraintsgeneric_constraintsjson`                       | 1             | keep, or re-point every link in the same batch                                                                                           |
| `case-directory-format#constraintsgeneric_parametersjson`                        | 1             | keep, or re-point every link in the same batch                                                                                           |
| `case-directory-format#post_study_stagesjson`                                    | 3             | keep, or re-point every link in the same batch                                                                                           |
| `case-directory-format#scenariosnoise_openingsparquet`                           | 1             | keep, or re-point every link in the same batch                                                                                           |
| `case-directory-format#seed-resolution`                                          | 4             | moves to `running/configuration#seed-resolution` (E12 tickets 185 and 185a, XD-129); re-point every link in the same batch               |
| `case-directory-format#stagesjson`                                               | 5             | planned inbound (ticket-138, ticket-155) in addition to the current links                                                                |
| `case-directory-format#systemfpha_hyperplanesparquet`                            | 1             | keep, or re-point every link in the same batch                                                                                           |
| `case-directory-format#systemhydrosjson`                                         | 2             | keep, or re-point every link in the same batch                                                                                           |
| `cli-reference#cobre-validate`                                                   | 1             | keep, or re-point every link in the same batch                                                                                           |
| `cli-reference#exit-codes`                                                       | 2             | keep, or re-point every link in the same batch                                                                                           |
| `cli-reference#output-format`                                                    | 2             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#businessruleviolation`                                              | 2             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#cycledetected`                                                      | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#deterministic-external-inflow-column-under-an-autoregressive-model` | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#duplicateid`                                                        | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#genericconstraintvalidationerror`                                   | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#invalidreference`                                                   | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#invalidvalue`                                                       | 2             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#modelquality`                                                       | 2             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#per-block-generic-constraint-references`                            | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#policy-load-errors`                                                 | 6             | owner of the policy-load messages (ADR-044); keep                                                                                        |
| `error-codes#schemaviolation`                                                    | 1             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#semanticambiguity`                                                  | 2             | keep, or re-point every link in the same batch                                                                                           |
| `error-codes#solver-profile-validation-sddperror`                                | 1             | E13 ticket-212 renames it to `#solver-profile-validation` and re-points every link; planned inbound (ticket-136), may already be counted |
| `error-codes#stochasticpreparationerror`                                         | 6             | keep (E07 links)                                                                                                                         |
| `generic-constraints#generic_parametersjson-the-five-parameter-kinds`            | 1             | keep, or re-point every link in the same batch                                                                                           |
| `generic-constraints#hydro_evaporation-block-references`                         | 1             | keep, or re-point every link in the same batch                                                                                           |
| `generic-constraints#interval-and-shape-derivation`                              | 1             | keep, or re-point every link in the same batch                                                                                           |
| `generic-constraints#the-activation-grid`                                        | 1             | keep, or re-point every link in the same batch                                                                                           |
| `generic-constraints#variable-catalog`                                           | 1             | keep, or re-point every link in the same batch                                                                                           |
| `generic-constraints#worked-example-a-security-curve`                            | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#anticipatedfixed_deliveriesparquet`                               | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#metadata-files`                                                   | 2             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#node-axis-and-policy-graph-outputs`                               | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#policymanifestbin`                                                | 4             | planned inbound (ticket-134) in addition to the current links                                                                            |
| `output-format#simulationcosts`                                                  | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#simulationhydro_bus_generation`                                   | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#simulationmetadatajson`                                           | 0             | planned inbound (ticket-134)                                                                                                             |
| `output-format#stochastic-artifacts`                                             | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#trainingconvergenceparquet`                                       | 1             | keep, or re-point every link in the same batch                                                                                           |
| `output-format#trainingmetadatajson`                                             | 0             | planned inbound (ticket-126, ticket-134)                                                                                                 |
| `output-format#trainingmodel_provenancejson`                                     | 0             | planned inbound (ticket-134)                                                                                                             |

**Door**: one-way.
**Revisit trigger**: none known.

## 6. Error-codes headings

A kind section is a `###` heading whose whole text is one backticked kind, as the user sees it in `[Kind]`, outside fenced
code: ``### `BusinessRuleViolation` `` gives `#businessruleviolation`. Its body runs to the next `##` or `###` heading, and its
slug is unique on the page (E13 ticket-214 reports a repeated kind heading as `DUPLICATE`, D-214-1).

A per-rule entry is a `####` heading whose text is a noun phrase naming the rule. It carries no version words and no code
identifier that names an implementation, and it is unique on the page. Its slug is the rule anchor.

Until E13 ticket-212 merges the two enum listings, a kind that appears in both (`ParseError`) keeps the slugger's `-1`
suffix on its second occurrence.

**Door**: one-way.
**Revisit trigger**: none known.

## 7. Generic-constraint example fences

A fence that GRD-05 checks carries two meta options. `title` is the case-relative path and the fence content is that
whole file. `gc-check` is `"accept"` (`cobre validate` must exit `0` once the fence is spliced into the fixture) or
`"reject"` (it must exit `1`). The fence headers, verbatim:

````text
```json title="constraints/generic_constraints.json" gc-check="accept"
```json title="constraints/generic_constraints.json" gc-check="reject"
````

Values use double quotes only. A `gc-check` value other than `"accept"` or `"reject"`, a misspelled option name, or a
`gc-check` with no `title` is an error. A fence without `gc-check` is illustrative and is not checked. Expressive Code 0.43.1 ignores a meta option that no
plugin reads, and `title="…"` renders a frame title.

Each checked fence is spliced alone over one fixed overlay case, replacing the overlay file at its `title` path.
Ticket-179 records the overlay in `plans/v0.17.0-docs-sync/design/e11-gc-validation.md`.

**Door**: one-way.
**Revisit trigger**: none known.

## 8. Table binding

No binding marker comments are used. `check:input-schemas` binds a table to a schema by its file-path heading (section 5)
and the full `Name` paths (section 2). The rows of a file are the input tables (section 2 header, exactly) under the
heading whose text is that file's backticked path, up to the next heading of the same or a higher level (D-202a-3); other
tables are not read. The binding covers the 17 case-format JSON files; `config.json` is not bound (D-215-1).

**Door**: two-way.
**Revisit trigger**: a split page that must group several files under one heading.

## 9. Applying the conventions

- E11 writes every new table, heading and fence to these conventions and corrects existing tables in their current
  column layout.
- Ticket-167 converts the case-directory-format Type cells and ticket-173 the output-format Type cells to section 4.
- E13's splits convert the remaining table layouts behind the row-parity check (ADR-035).
- Page placement is E13 ticket-201's gate (R96), not this document's.
