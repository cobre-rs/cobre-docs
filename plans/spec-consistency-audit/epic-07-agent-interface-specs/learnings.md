# Epic 07 Learnings: Agent Interface Specification Authoring

**Epic**: epic-07-agent-interface-specs
**Tickets**: ticket-022, ticket-023, ticket-024, ticket-025, ticket-026
**Date**: 2026-02-25

---

## Patterns Established

### Layered spec dependency with a foundation spec consumed by three parallel specs

ticket-022 (`structured-output.md`) was written first and served as the canonical source for the response envelope, error kind registry, and JSON-lines event types. tickets 023-025 cross-referenced it by section number rather than duplicating content. This prevented four divergent error schemas and four divergent event type definitions. The pattern: write the shared-protocol spec first; all consumer specs reference it by stable section anchor rather than restate its content.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md`

### Purpose + numbered sections (SS) + Cross-References as the canonical spec layout

All four interface specs (`structured-output.md`, `mcp-server.md`, `python-bindings.md`, `terminal-ui.md`) follow the same layout: a one-paragraph Purpose section, numbered sections each with a table or code block, and a Cross-References section listing every upstream spec with the relevant section number. This mirrors the layout of `convergence-monitoring.md` and `validation-architecture.md`, making the new specs feel native to the corpus. The numbered section anchor format (`SS1`, `SS2.1`) enables precise cross-referencing between specs without prose navigation.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/convergence-monitoring.md` (template), `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` (implemented)

### "Must NOT contain" boundaries prevent scope leakage between parallel specs

Each of tickets 023, 024, and 025 carried an explicit "Must NOT contain" list from architecture-021 §5. These boundaries were operationally effective: `mcp-server.md` contains no CLI protocol details; `python-bindings.md` contains no MCP tool schemas; `terminal-ui.md` contains no Python API signatures. Without explicit exclusion lists, parallel authoring tends to pull overlapping content from shared upstream sources. The exclusion list must name the competing spec, not just the category.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §5.2-§5.4

### Subsection insertion pattern preserves existing section numbering in modified specs

ticket-026 added content to 14 existing spec files without renumbering their existing sections. All insertions used subsection numbers (`SS1.1`, `SS4.1`, `SS8`) rather than replacing top-level section slots. For example, `convergence-monitoring.md` received `SS4.1 JSON-Lines Streaming Schema` and `SS4.2 Termination Event Schema` as subsections of the existing `SS4` without touching the existing content. This additive-only modification pattern ensures that any in-flight cross-references to existing section numbers remain valid.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/architecture/convergence-monitoring.md`, `/home/rogerio/git/cobre-docs/src/specs/architecture/cli-and-lifecycle.md`

### Crate page pattern: status badge + Overview + Key Concepts + Dependencies + Status paragraph

The three new crate documentation pages (`mcp.md`, `python.md`, `tui.md`) follow exactly the format of `src/crates/cli.md`: a `<span class="status-experimental">experimental</span>` badge, an Overview paragraph (2-4 sentences), a Key Concepts bulleted list where each bullet names a concept, gives a one-sentence description, and links to the relevant spec section, a dependency graph code block, and a Status paragraph stating the implementation phase. The Key Concepts section is the most important element — it serves as the entry point for both human readers and AI agents navigating the corpus.

Reference file: `/home/rogerio/git/cobre-docs/src/crates/mcp.md`, `/home/rogerio/git/cobre-docs/src/crates/python.md`, `/home/rogerio/git/cobre-docs/src/crates/tui.md`

### Phased approach for large multi-file tickets: SUMMARY.md and new pages first, then modifications, then verification

ticket-026 managed 17 file operations (14 modifications + 3 new pages) by following a four-phase order: (1) add entries to `SUMMARY.md` and create the 3 crate pages, (2) update cross-reference infrastructure (`cross-reference-index.md`, `crates/overview.md`, `design-principles.md` forward reference resolution), (3) add subsections to the 11 architecture/HPC/data-model/configuration specs, (4) verify with `mdbook build`. Executing phase 1 first ensures that mdBook can find all files before any cross-reference links are written that target them.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-07-agent-interface-specs/ticket-026-update-existing-specs-agent-readability.md` (Implementation Guide)

---

## Architectural Decisions

### Error kind registry is in `structured-output.md`, not duplicated in each consumer spec

The complete 20-kind error registry (14 validation + 6 runtime) is defined once in `structured-output.md` SS2.3. `mcp-server.md` references it by anchor; `python-bindings.md` maps from it to the Python exception hierarchy; `terminal-ui.md` does not list error kinds at all (the TUI is a display consumer, not an error producer). Rejected alternative: each spec defining its own error subset. Rationale: a change to any error kind (rename, new context field) must be made in exactly one place.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` SS2.3

### `cobre-tui` depends on `cobre-core` only, not on `cobre-sddp` or `cobre-cli`

In co-hosted mode, `cobre-cli` (which depends on `cobre-sddp`) mediates the broadcast channel connection. In standalone pipe mode, the TUI reads JSON-lines from stdin and deserializes using `cobre-core` event types. This avoids a dependency from the rendering layer to the algorithm layer. Rejected alternative: `cobre-tui` importing `cobre-sddp` directly for event type access. Rationale: the `cobre-tui` library would then carry the solver as a transitive dependency, making it impossible to use the TUI for replay/offline modes without solver linkage.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/terminal-ui.md` SS1.2

### MCP long-running operation model: progress notifications during the call (flagged for user confirmation)

`mcp-server.md` SS7 documents the `cobre/run` tool as using MCP progress notifications while the tool call is open, rather than a background task with polling. This was flagged in architecture-021 §6.1 Q-3 as an open assumption. The spec documents both options (in-call progress vs background task) and marks the recommended choice explicitly as pending user confirmation. Rejected alternative: silently committing to one model. Rationale: the MCP specification is evolving around long-running operations and a wrong choice here would require a breaking change to the tool interface.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/mcp-server.md` SS7

### Python bindings are single-process only with no MPI from Python

`python-bindings.md` SS5 states the execution mode prohibition with all three rationale layers: `MPI_Init_thread` timing conflicts, GIL vs `MPI_THREAD_MULTIPLE` deadlock risk, and dual-FFI-layer fragility. The recommended workflow for distributed execution is Python prepares case, then invokes `mpiexec cobre` as a subprocess, then reads Parquet results. This is a hard constraint inherited from Epic 06 findings-020 §2.2. It is stated as a prohibition, not a recommendation, to prevent future contributors from attempting Python/MPI integration.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/python-bindings.md` SS5

### Structured output as a CLI concern only, not replicated in the other interface specs

The JSON response envelope (`$schema`, `command`, `success`, `exit_code`, etc.) is the serialization format for the `cobre` CLI binary invoked with `--output-format json`. The MCP server returns content blocks with JSON inside; the Python bindings return Python objects; the TUI renders to the terminal. None of the three non-CLI interfaces emit the CLI response envelope. Each interface has its own return type convention that is natural to its protocol. The shared element is the error kind registry and the event types — not the envelope itself.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` SS5, `/home/rogerio/git/cobre-docs/src/specs/interfaces/mcp-server.md` SS2

---

## Files and Structures Created

| File                                                                               | Role                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/specs/interfaces/structured-output.md`                                        | Foundation spec: 9-field response envelope, 20-kind error registry, 4 JSON-lines envelope types, per-subcommand data shapes, format negotiation, versioning   |
| `src/specs/interfaces/mcp-server.md`                                               | MCP server spec: 10 tools with full JSON Schema, 6 resource types, 4 prompts, stdio/SSE transport, progress reporting, security model, long-running operation |
| `src/specs/interfaces/python-bindings.md`                                          | Python API spec: complete type-annotated signatures for 4 source crates, 5-point GIL contract, 6 zero-copy paths, exception hierarchy, async wrappers         |
| `src/specs/interfaces/terminal-ui.md`                                              | TUI spec: event consumption (co-hosted + standalone), 5 view ASCII mockups, convergence plot data model, 5 interactive features, keybindings, render reqs     |
| `src/specs/interfaces.md`                                                          | Container page linking the 4 interface specs with a summary table of crate/purpose                                                                            |
| `src/crates/mcp.md`                                                                | Crate documentation page for `cobre-mcp` with dependency graph and key concepts                                                                               |
| `src/crates/python.md`                                                             | Crate documentation page for `cobre-python` with GIL contract summary and key concepts                                                                        |
| `src/crates/tui.md`                                                                | Crate documentation page for `cobre-tui` with co-hosted/standalone mode summary                                                                               |
| `src/specs/overview/production-scale-reference.md` (extensively modified, not new) | Test system tier table expanded from 5 to 7 tiers; LP solve KPI corrected to 25 ms; all timing estimates recalculated; production parameters updated          |

---

## Conventions Adopted

### Response envelope field order: `$schema`, `command`, `success`, `exit_code`, `cobre_version`, `errors`, `warnings`, `data`, `summary`

All JSON examples in `structured-output.md` and all cross-referencing specs use this exact field order. It is not merely illustrative — the spec defines it as the canonical serialization order. Agents parsing with schema-aware tools can use the `$schema` field (always first) to select the right parser before reading any other field. This order mirrors the validation report in `validation-architecture.md` §5 but adds `command`, `exit_code`, `cobre_version`, `data`, and `summary`.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` SS1.1

### JSON-lines `type` field as the first key in every streaming envelope

Every JSON-lines envelope object (`started`, `progress`, `terminated`, `result`) has `type` as its first key. This enables consumers to dispatch by envelope type by reading only the first JSON key-value pair, without parsing the full object. The spec explicitly states this ordering as a requirement (SS3.1 Rule 4: "Type-discriminated: every JSON object contains a `type` field as the first key"). Implement with serde's `#[serde(rename_all = "snake_case")]` and manual field ordering in the Rust serialization path.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` SS3.1

### "(planned)" annotation converted to real links only when the target file exists and is in SUMMARY.md

The four `(planned)` annotations in `design-principles.md` Cross-References were converted to real markdown links only after tickets 022-025 created the corresponding files and ticket-026 added them to `SUMMARY.md`. This is the correct sequencing: SUMMARY.md registration precedes link activation. Never add markdown links to files that are not in SUMMARY.md — mdBook build will emit warnings for dead links even though it does not fail on them.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` Cross-References section

### Tool names use `cobre/` prefix with lowercase verb noun (e.g., `cobre/query-results`)

All 10 MCP tool names follow the pattern `cobre/<verb>-<noun>` in lowercase with hyphens. This differs from the outline ticket's naming (`run_study`, `validate_case`) which used underscores and implied class-method style. The `cobre/` prefix namespaces tools within the MCP server's tool registry, avoiding collisions with tools from other MCP servers in a multi-server agent environment. Any new tool added to `cobre-mcp` must use this prefix.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/mcp-server.md` SS2

### Python exception hierarchy rooted at `cobre.CobreError` with four subclasses

`python-bindings.md` SS6 defines: `cobre.CobreError` (base), `cobre.ValidationError` (maps to 14 validation kinds), `cobre.SolverError` (maps to `SolverFailure`), `cobre.IOError` (maps to `OutputCorrupted`, `OutputNotFound`). Every exception carries the four structured fields from the error schema (`kind`, `message`, `context`, `suggestion`). The hierarchy maps the flat error kind registry into a Python class tree that allows `except cobre.ValidationError` catch blocks without needing to inspect `kind`. Future runtime error kinds must be assigned to one of the four existing exception classes or a new subclass of `CobreError`.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/python-bindings.md` SS6

### `$schema` URN format: `urn:cobre:response:v1` with major-version-only component

Schema versioning uses a URN with three components: namespace (`cobre`), type (`response`), and major version (`v1`). The minor version is not included in the URN — additive changes within a major version do not change the URN. A consumer checks `$schema.startswith("urn:cobre:response:v1")` to determine compatibility. Breaking changes (field removal, type changes) require incrementing to `v2`. New error kinds and new subcommand shapes are non-breaking. This versioning strategy is described in full in `structured-output.md` SS6.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` SS6.1

---

## Surprises and Deviations

### production-scale-reference.md underwent a substantial rewrite during epic-07, not as part of any ticket

The production scale parameters changed significantly based on user review during the epic: stages corrected from 120 to 60; openings from 20 to 10; LP solve KPI updated from 2 ms (unrealistic for an 8,400-variable subproblem) to 25 ms; test system tiers expanded from 5 (Unit Test / Small / Medium / Large / Production) to 7 (adding XLarge and 2XLarge) with a new "Hydro Production" column distinguishing constant vs FPHA (125 planes). The timing model was recalculated throughout. This was out-of-scope for the five epic-07 tickets but was carried out concurrently. The resulting file is at `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`.

### ticket-026 introduced `src/specs/interfaces.md` as a container page not specified in the original scope

The original ticket-026 scope defined 14 existing file modifications and 3 new crate docs. An additional container page (`src/specs/interfaces.md`) was created to serve as the mdBook parent page for the new "Interfaces" section in SUMMARY.md. Without a container page, mdBook generates a section header without a clickable link. This is the same pattern used by the existing `src/specs/architecture.md`, `src/specs/hpc.md`, and `src/specs/data-model.md` container pages. The container page adds a summary table of the four interface layers.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces.md`

### The outline ticket named tool classes differently than the assessment; assessment names took precedence

ticket-023's outline used tool names such as `run_study`, `validate_case`, with underscore naming. The detailed ticket specification correctly identified this discrepancy and used the canonical names from findings-020 §1.1: `cobre/validate`, `cobre/run`, etc. The same discrepancy appeared in ticket-024: the outline used class names `cobre.Study`, `cobre.Results`, `cobre.Config`, `cobre.Validator`, while the assessment defines `CaseLoader`, `Policy`, `PARModel`, and top-level functions `train()`, `simulate()`. In both cases, assessment documents (findings-019, findings-020) are more authoritative than outline tickets, because the outline tickets were written before the detailed assessment was complete.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §1.1, §2.1

### Additive-only subsection insertion requires verifying that no existing subsection already occupies the target slot

When adding `SS8` to `cli-and-lifecycle.md`, it was necessary to verify that no existing section numbered 8 existed. Similarly for `SS4.1` and `SS4.2` in `convergence-monitoring.md`, the existing section 4 had no subsections. The additive pattern relies on the invariant that existing sections are numbered sequentially with no gaps used for subsections. If a future spec already has subsections (e.g., `SS4.1` already exists), the insertion must choose `SS4.3` or higher, not `SS4.1`. Always read the current structure of the target file before choosing the insertion anchor.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/architecture/cli-and-lifecycle.md`, `/home/rogerio/git/cobre-docs/src/specs/architecture/convergence-monitoring.md`

### The `cobre-tui` dependency spec originally listed `cobre-cli` as a dependency of `cobre-tui`

The epic-07 ticket-025 specification (and the epic overview) used language from an earlier design phase: "`cobre-tui` depends on `cobre-cli` for event/progress stream". The dependency is inverted: `cobre-cli` depends on `cobre-tui` (via `feature = "tui"`). The `cobre-tui` library depends only on `cobre-core` for event type deserialization. The final spec (`terminal-ui.md` SS1.2 dependency graph) correctly shows `cobre-cli -> cobre-tui -> cobre-core`. This inversion was established in Epic 06 architecture-021 §1.3-§1.4 and carried forward correctly by the detailed tickets.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/terminal-ui.md` SS1.2

---

## Recommendations for Future Epics

### When writing specs that share schema elements, define the canonical spec first and reference by section anchor

Any future epic that produces multiple specs sharing a common schema (error format, event types, response envelope) should follow the structured-output-first pattern established here. The foundation spec should be completed and reviewed before parallel specs begin. References from consumer specs to the foundation spec should use stable section anchors (`SS2.3`) rather than copying content. This makes future schema changes a single-file edit.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/interfaces/structured-output.md` (canonical pattern)

### Verify that outline ticket class/function/tool names match the detailed assessment before writing detailed tickets

Three of five tickets (022, 023, 024) involved name-mapping corrections between the outline ticket and the assessment documents. Add an explicit name-verification step to the detailed ticket refinement process: list the names from the outline, compare against the assessment, and document any corrections before writing spec content. This prevents inconsistent names appearing in the spec draft that then require post-hoc correction.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §1.1 vs ticket-023 outline section

### Separate the production-scale parameter update into its own ticket when it is substantive

The production-scale-reference.md rewrite (7 tiers, new LP KPI, recalculated timing) was done concurrently with epic-07 but outside any ticket's scope. This created a large uncommitted change that blurred the boundary between the interface spec work and the parameter update. When user-driven parameter corrections affect a foundational reference spec, create a dedicated ticket (e.g., "update production-scale-reference.md") rather than absorbing it into an adjacent epic.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`

### For large integration tickets like ticket-026, verify mdbook build after each phase, not only at the end

ticket-026 operated on 17 files across 4 phases. A build failure late in the process could be ambiguous about which modification introduced the problem. Verifying `mdbook build` after phase 1 (SUMMARY.md + new files) and after phase 2 (cross-reference infrastructure) reduces the search space for any failure to at most one phase's changes.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-07-agent-interface-specs/ticket-026-update-existing-specs-agent-readability.md` (Implementation Guide, Phase 4)
