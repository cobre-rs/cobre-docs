# Epic 06 Learnings: Agent & External Interface Impact Assessment

**Epic**: epic-06-pyo3-python-api-impact (Agent & External Interface Impact Assessment)
**Tickets**: ticket-019, ticket-020, ticket-021
**Date**: 2026-02-25

---

## Patterns Established

### Assessment-first, then synthesis

ticket-019 and ticket-020 ran as parallel assessment tickets with read-only access to existing specs. Their findings reports fed a single synthesis ticket (ticket-021) that produced the architecture document and the spec modification. This pattern cleanly separated diagnosis from prescription and prevented premature design decisions. The synthesis ticket was the only one that touched a source file (`design-principles.md`). Reuse this pattern for any epic that involves multiple inter-related interface layers where decisions in one layer constrain choices in others.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/00-epic-overview.md`

### Impact inventory table with severity classification

Both findings reports used a consistent tabular format: Spec File, Section, Current State, Required Change, Severity (REQUIRED / RECOMMENDED / OPTIONAL), Notes. This made it straightforward to triage what Epic 07 must address versus what is optional polish. The three-tier severity scheme from Epic 05 (KEEP / UPDATE / REMOVE) generalizes cleanly to REQUIRED / RECOMMENDED / OPTIONAL for capability-addition assessments. findings-019 produced 23 rows across 7 spec files; findings-020 produced 16 rows across 8 spec files — all uniquely addressable by section number.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §1, `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §4

### Per-interface-layer organization before cross-cutting consolidation

findings-020 organized its content in three independent sections (§1 MCP, §2 Python, §3 TUI) before producing the consolidated Impact Inventory Table in §4. Each layer section fully addressed its own assessment requirements. The consolidation step then de-duplicated entries where multiple layers affected the same spec section (e.g., `cli-and-lifecycle.md` §1 was impacted by both MCP and Python). This structure prevents cross-layer contamination while ensuring the consolidated table remains the canonical reference.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §1-§4

### Design decision documentation with options table and rationale

findings-019 §2 resolved four design decisions (default output mode, progress streaming transport, subcommand coexistence pattern, error schema standard). Each decision included an options table with Pros and Cons columns, a recommended choice, and numbered rationale points. This format made it possible to evaluate the reasoning without re-reading all the supporting specs. The same format should be used in any assessment ticket that must resolve architectural choices rather than just catalog findings.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §2.1-§2.4

### Event-stream-as-shared-interface pattern

architecture-021 §3 defines a single broadcast channel in `cobre-sddp` that all four output consumers (text logger, JSON-lines writer, TUI renderer, MCP progress notifications) subscribe to. Event types are defined in `cobre-core` to avoid circular dependencies: the producer crate imports from `cobre-core` to emit; consumer crates import from `cobre-core` to receive. The Parquet convergence writer is always-active; other consumers are activated by CLI flags. This pattern prevents four divergent output paths and ensures all consumers receive identical data.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §3

### Scope-definition section in architecture documents for downstream ticket authors

architecture-021 §5 contains a scope definition for each of the five Epic 07 tickets (022-026), specifying what each spec "Must contain", "Must NOT contain", what it depends on, and any open assumptions flagged for user review. This section replaced the need for separate planning overhead in Epic 07: ticket authors can read their scope definition and know exactly what to write. Include a comparable scope-definition section in any architecture document that feeds downstream implementation tickets.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §5

### Detailed principle section following the Declaration Order Invariance template

The new design-principles.md section 6 "Agent-Readability" follows the exact structure established by section 3 "Declaration Order Invariance": a blockquote principle statement, a complementary-principles subsection, four numbered design rules each with rationale and a concrete JSON example, implementation requirements, and validation requirements. Mirroring the existing section depth makes the new content feel native to the spec rather than appended. When adding design principles to this file, use section 3 as the template.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` §6

---

## Architectural Decisions

### Decision 1: Human-first output mode (opt-in JSON), not structured-first

Options considered: (A) structured-first with `--human` flag, (B) human-first with `--output-format json`, (C) auto-detect via TTY. Chose B.

Rationale: Backward compatibility is a hard constraint from the epic overview. Every existing SLURM job script and operator workflow assumes text output. Unix convention (`kubectl`, `gh`, `docker`) defaults to human-readable. Agent frameworks can trivially add `--output-format json` to every invocation. Changing the default would break existing HPC batch workflows.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §2.1

### Decision 2: Structured stdout with envelope for progress streaming, not separate file descriptor

Options considered: (A) JSON-lines to stdout mixing progress with result, (B) separate fd 3, (C) separate on-disk file, (D) structured stdout with a `type` field envelope. Chose D.

Rationale: MPI launchers (`mpiexec`, `srun`) do not reliably propagate extra file descriptors. On-disk alternatives require polling. The `type` field envelope (`{"type": "progress", ...}` vs `{"type": "result", ...}`) makes the single stdout stream self-describing and filterable with `jq 'select(.type == "progress")'`.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §2.2

### Decision 3: Hybrid subcommand detection preserving implicit `run` for backward compatibility

Options considered: (A) implicit `run` default with no mandatory subcommand, (B) mandatory subcommand for all invocations, (C) hybrid — check if first argument is a known subcommand name; if not, treat as CASE_DIR implicit `run`. Chose C.

Rationale: Option B would break every existing `mpiexec cobre CASE_DIR` script. Subcommand names (`run`, `validate`, `report`, `compare`, `serve`, `version`, `help`) contain no `/` or `.` so they cannot collide with filesystem paths. This is the same pattern used by `git` and `cargo`.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §2.3

### Decision 4: Generalize the existing validation report as the universal response envelope

Options considered: (A) RFC 7807 Problem Details, (B) generalize validation report, (C) custom CLI error schema, (D) adapted RFC 7807. Chose B enriched with C's `suggestion` field.

Rationale: The validation-architecture.md §5 validation report already demonstrates the exact pattern needed. RFC 7807 is designed for HTTP APIs and carries HTTP-specific baggage (`status` HTTP code, `type` URI, `instance` resource identifier). The generalized envelope uses the existing `errors[]`, `warnings[]` arrays and adds `$schema`, `command`, `success`, `exit_code`, `cobre_version`, `data`, `summary`.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §2.4

### Decision 5: Python bindings are single-process only — no MPI from Python

The GIL/MPI analysis (findings-020 §2.2) concluded that Python bindings must not initialize MPI. Three sub-questions were resolved: (a) no, Python cannot coexist with MPI in the same process due to `MPI_Init_thread` timing conflicts, GIL vs MPI_THREAD_MULTIPLE deadlock risk, and dual-FFI-layer fragility with mpi4py; (b) thread-local solver workspaces are safe because the GIL is released via `py.allow_threads()` before the Rust computation begins, and no OpenMP thread ever acquires the GIL; (c) recommended execution mode is single-process with OpenMP threads only.

The `cobre-python` crate has no dependency on `ferrompi`. Users needing distributed execution prepare the case in Python then launch `mpiexec cobre` as a subprocess.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §2.2

### Decision 6: Event types defined in `cobre-core`, not in producer or consumer crates

Defining event types in `cobre-sddp` (the producer) would require consumer crates to depend on the algorithm crate — a coupling violation. Defining them in consumer crates would require circular dependencies. Placing them in `cobre-core` gives all parties a common dependency with no new edges in the DAG. This is the canonical pattern for shared message types in Rust workspace crates.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §3.4

### Decision 7: `cobre-tui` depends on `cobre-core` only (not on `cobre-sddp` or `cobre-cli`)

The TUI is a rendering consumer of events, not a producer. Making it depend on `cobre-sddp` would create unnecessary coupling between the rendering layer and the algorithm. The TUI crate depends only on `cobre-core` for event type definitions, leaving it free to be tested independently and deployed in standalone pipe mode (reading JSON-lines from stdin) without any solver dependency.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §1.3-§1.4

---

## Files and Structures Created

| File                                                                              | Role                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md`     | Structured CLI impact assessment: 23 affected spec sections, 4 resolved design decisions, backward compatibility analysis, new section inventory for Epic 07                                                                                      |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md`     | MCP/Python/TUI impact assessment: 10 MCP tools, 6 resources, 4 prompts mapped; full GIL/MPI analysis; 7 TUI events defined; 16 affected spec sections; 3 new crate docs inventoried                                                               |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` | Interface architecture: expanded 9-crate dependency graph, responsibility boundaries per crate, shared event stream with broadcast channel pattern, agent context strategy (CLAUDE.md + skill files), Epic 07 scope definitions for all 5 tickets |
| `src/specs/overview/design-principles.md`                                         | Modified: added Goal 7 "Agent-Readability" to §2 list; added §6 "Agent-Readability (Detailed)" with 4 design rules, examples, validation requirements, and cross-references to planned interface specs                                            |

---

## Conventions Adopted

### "Must contain / Must NOT contain / Depends on / Assumption" scope blocks

Each Epic 07 ticket scope definition in architecture-021 §5 uses a consistent four-part block. "Must contain" enumerates required spec sections with enough detail that the author can verify completeness. "Must NOT contain" prevents scope overlap between parallel tickets. "Depends on" makes inter-ticket ordering explicit. "Assumption" flags open items requiring user confirmation. Apply this block structure to every architecture document that feeds downstream implementation tickets.

### Forward references with "(planned)" annotation for non-existent spec files

When `design-principles.md` §6 references specs that do not yet exist (`structured-output.md`, `mcp-server.md`, `python-bindings.md`, `terminal-ui.md`), the links use the form `See Structured Output spec (planned)` rather than broken markdown links. This pattern was established in Epic 05 and is extended here. SUMMARY.md was not modified — no entries for non-existent files.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` §6.1, Cross-References section

### Subcommand naming as `cobre <verb>` where `<verb>` is a filesystem-safe token

Subcommand names (`run`, `validate`, `report`, `compare`, `serve`, `version`, `help`) contain no characters that can appear in filesystem paths (`/`, `.`, `-`). This invariant is what makes the hybrid detection pattern (Decision 3) unambiguous. Any new subcommand added in Epic 07 or later must satisfy this invariant.

### Error record with four fields: `kind`, `message`, `context`, `suggestion`

Every structured error in the Cobre response envelope uses exactly these four fields. `kind` is a stable string identifier following PascalCase (e.g., `SchemaViolation`, `SolverFailure`). `message` is human-readable. `context` is a structured object with location details. `suggestion` is nullable, written for an agent audience (specific, actionable, non-prescriptive). This convention is derived from findings-019 §2.4 and formalized in design-principles.md §6.2 Rule 2.

### GIL contract as a five-point invariant for PyO3 crates

Any Rust crate using PyO3 in this project must follow the five-point GIL contract established in findings-020 §2.2 and repeated in architecture-021 §2.2: (1) GIL acquired to receive call, (2) GIL released via `py.allow_threads()` before computation, (3) no OpenMP thread acquires GIL, (4) GIL reacquired to convert results, (5) no Python callbacks in the hot loop. This invariant should be documented as a code comment at the top of every `#[pyfunction]` that invokes the training or simulation path.

---

## Surprises and Deviations

### The GIL/MPI deadlock is more fundamental than anticipated

The ticket-020 specification noted "Do not underestimate the GIL/MPI analysis" — but the actual analysis revealed that the conflict is deeper than a simple threading issue. Three separate incompatibility vectors were identified: `MPI_Init_thread` timing (Python interpreter initializes before MPI, causing runtime conflicts with OpenMPI/MPICH signal handlers), GIL vs MPI_THREAD_MULTIPLE deadlock risk during MPI collectives, and dual-FFI-layer fragility when mpi4py and ferrompi coexist in the same process. The conclusion — single-process only, no mpi4py integration — is the correct architectural choice, but the analysis required addressing all three vectors explicitly.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §2.2

### 20 openings (not 192 scenarios) is the dominant MCP compute concern

The ticket specified that `cobre/run` maps to an MCP tool that runs training/simulation without MPI. For small Python use cases (scripting, Jupyter), this is straightforward. However, findings-020 §1.1 notes that the opening tree has 20 openings (not 192 total scenarios) — the first-stage branching factor drives the computational cost of a single-process forward pass. A single-process training run must evaluate all 20 openings per iteration; this is the dimensionality that determines whether Python-driven training is practical for production cases. This detail was not explicitly called out in the ticket specification but emerged from reading `cobre-stochastic` crate docs during the assessment.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §2.1 (cobre-stochastic section)

### The convergence-monitoring.md §2.4 per-iteration record is already the right event payload

The ticket for ticket-020 asked to identify what data the TUI convergence plot needs. The answer is that the exact fields already defined in convergence-monitoring.md §2.4 (iteration, lower_bound, upper_bound, upper_bound_std, ci_95, gap, wall_time, iteration_time) are precisely what is needed — no new fields, no new record types. The convergence monitor was already designed with the right granularity. This means the event stream does not need to invent a new schema; it formalizes an existing internal record as a public event type.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §3.2

### The validation report in validation-architecture.md §5 is already a near-complete agent-readable format

findings-019 §1 row 12 classifies the validation report as RECOMMENDED severity (not REQUIRED) because it is already structured JSON with `errors`, `warnings`, and `summary`. Only three additions were needed: `$schema` reference, `cobre_version` field, and `exit_code` field. The report required generalization into a universal response envelope, but the core structure was sound. The most impactful gap turned out to be the convergence training log (human-readable text with no machine-parseable alternative), not the validation output.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` §1 row 12

### MCP long-running operation model remains an open item

findings-020 identified Q-3 as an unresolved question: should the MCP `cobre/run` tool use progress notifications during the call (keeping the connection alive for potentially hours) or a background task pattern with polling? architecture-021 §6.1 documents this as an open assumption rather than resolving it. This is intentional — the MCP specification is still evolving around long-running operations, and committing to one model before implementing risks choosing the wrong side of an in-flux standard. Epic 07 ticket-023 must document both options and flag for user confirmation.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §6.1

### The `cobre-tui` dependency graph avoids `cobre-cli` as a dependency

The epic overview specified "`cobre-tui` depends on `cobre-cli` (consumes the same event/progress stream)". During the architecture design (ticket-021), this was revised: `cobre-tui` depends only on `cobre-core` for event types, while `cobre-cli` depends on `cobre-tui` (inverts the direction). The original specification would have created a problematic dependency where the TUI rendering library would need to know about CLI argument parsing. The corrected direction makes `cobre-tui` a standalone library that the CLI binary consumes, consistent with the DAG verification in architecture-021 §1.4.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §1.4

---

## Recommendations for Epic 07

### ticket-022 (`structured-output.md`) should treat findings-019 §2 design decisions as settled

The four design decisions in findings-019 §2 (human-first default, structured stdout with envelope, hybrid subcommand detection, generalized validation report) are fully reasoned and should not be re-litigated in Epic 07. The spec author for ticket-022 should cite these decisions and proceed to the full JSON Schema definitions. The main work is translating the outline schemas in findings-019 §2.2 into complete JSON Schema documents with field-level type annotations.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §5.1

### ticket-023 (`mcp-server.md`) must resolve the long-running operation open item before writing §7

architecture-021 §6.1 flags Q-3 (long-running operation model) as an open item with assumed resolution (progress notifications during call). The ticket-023 author must confirm this assumption with the user before finalizing the spec. Do not write the spec with a silent assumption — present both options (in-call progress vs background task) in a design note and get explicit confirmation. The rest of the MCP spec (10 tools, 6 resources, 4 prompts, transport, security model) is fully specified in findings-020 §1 and can be written without this confirmation.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §6.1, §5.2

### ticket-024 (`python-bindings.md`) must reproduce the full five-point GIL contract

The GIL contract (findings-020 §2.2b, architecture-021 §2.2) is the most architecturally significant constraint on `cobre-python`. The spec must state all five points explicitly, including the prohibition on Python callbacks in the hot loop (findings-020 §2.2b risk area paragraph). This prohibition prevents future contributors from adding a seemingly-innocent Python callback to the training loop that would destroy parallel performance. Document it as a prohibition, not just a recommendation.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §2.2, architecture-021 §2.2

### ticket-026 scope is large (12 spec files + 3 new crate docs) — consider splitting

architecture-021 §5.5 lists 12 existing spec files to modify and 3 new crate documentation pages to create. This is the largest single ticket in Epic 07 by file count. The ticket should be organized into two passes: (1) modifications to existing specs that add new sections (the 12 files), and (2) creation of new crate documentation pages (3 files). If the ticket proves too large for a single implementation session, the crate documentation pages (crates/mcp.md, crates/python.md, crates/tui.md) are lower-risk and can be parallelized since they follow the established format from `src/crates/overview.md`.

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §5.5

### The `design-principles.md` §6 cross-references are forward references — do not resolve them prematurely

The Cross-References section of `design-principles.md` now includes four entries marked "(planned)": Structured Output spec, MCP Server spec, Python Bindings spec, Terminal UI spec. These forward references should not be converted to actual links until the corresponding spec files exist in `src/specs/interfaces/`. Converting them prematurely would require adding non-existent files to SUMMARY.md, which breaks mdBook build. The "(planned)" annotation is the correct state until Epic 07 ticket-022 through ticket-025 create the files.

Reference file: `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` Cross-References section

### Use the event type table in architecture-021 §3.2 as the authoritative payload specification for tickets 022, 023, 024, 025

All four interface-layer specs (structured output, MCP, Python, TUI) share the same underlying event types. The canonical payload definitions are in architecture-021 §3.2. Tickets 022-025 should import these definitions by reference rather than re-specifying them independently, to prevent divergence. The `ConvergenceUpdate` struct (architecture-021 §3.3) is the single most important event — it is referenced by JSON-lines output (ticket-022), MCP progress notifications (ticket-023), Python streaming callbacks if added (ticket-024), and TUI convergence plot (ticket-025).

Reference file: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §3.2-§3.3
