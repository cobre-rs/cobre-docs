# Accumulated Learnings: Through Epic 06

**Plan**: spec-consistency-audit
**Through Epic**: epic-06-pyo3-python-api-impact (Agent & External Interface Impact Assessment)
**Updated**: 2026-02-25

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without changes (Epic 01)
- 12 academic bibliography entries verified; 42% error rate — dominant mode is wrong-metadata-but-valid-identifier (Epic 02)
- 54 values in `production-scale-reference.md` cross-checked against LP sizing calculator; 50 exact match, 4 explained variance, 0 new discrepancies (Epic 03)
- Forward pass count updated from 200 to 192 in 20 locations across 8 files; 25 non-forward-pass "200" occurrences correctly preserved (Epic 03)
- First-principles timing model confirms 50-iteration production run uses 33.9% of 2-hour budget at the 2 ms warm-start KPI; 66.1% headroom (Epic 04)
- 42 NEWAVE/CEPEL/DECOMP/DESSEM occurrences audited across 31 files; 4 false capability claims corrected to "Planned support" (Epic 05)
- 50-spec corpus organization reviewed; all 6 sections sound, zero broken links, zero orphan files; 6 empty migration stubs deleted (Epic 05)
- Epic 06: 23 spec sections identified as requiring change for structured CLI output; 16 sections identified for MCP/Python/TUI integration; 4 design decisions resolved; GIL/MPI constraint established as single-process-only for Python; design-principles.md updated with Goal 7 "Agent-Readability" and new §6
- mdBook build: exit 0 after all fixes in all six epics

---

## Key Findings

- **LP sizing calculator (`scripts/lp_sizing.py`) is ground truth** for all LP variable counts, constraint counts, state dimension, and memory estimates; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §3.4
- **Wrong-metadata-but-valid-identifier is the dominant bibliography failure mode** — DOI resolves but title/authors belong to a different paper; affects 3 of 4 CRITICAL entries; see `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`
- **Forward pass 192 has superior arithmetic properties over 200**: 192/64=3, 192/16=12, 192/128=1.5 — all exact
- **Backward pass dominates at 97.5% of iteration compute**: backward warm-start hit rate is the single highest-sensitivity performance parameter; drop from 100% to 80% triples compute time; see `production-scale-reference.md` §4.6
- **False capability claim is a distinct defect category** from strategic positioning; only false present-tense claims required correction; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md`
- **GIL/MPI incompatibility is three-layered**: `MPI_Init_thread` timing conflicts with Python interpreter startup, GIL vs MPI_THREAD_MULTIPLE deadlock risk during collectives, dual-FFI-layer fragility (mpi4py + ferrompi) — all three vectors independently prohibit Python/MPI coexistence; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §2.2
- **convergence-monitoring.md §2.4 per-iteration record is already the correct event payload** — its 8 fields (iteration, lower_bound, upper_bound, upper_bound_std, ci_95, gap, wall_time, iteration_time) are exactly what JSON-lines streaming, TUI convergence plot, and MCP progress notifications all need; no new schema required
- **The validation report in validation-architecture.md §5 is already near-complete for agent use** — only three additions needed (`$schema`, `cobre_version`, `exit_code`); the hardest gap was the convergence training log (entirely human-readable with no machine-parseable alternative)
- **Spec organization is structurally sound at 50 specs / 6 sections**: SUMMARY.md sidebar order diverges from container page reading order in 4 of 6 sections but both orderings are defensible
- **SIDP upper-bound citation ambiguity remains unresolved**: Costa & Leclere (2023) title corrected; whether the cited paper is the actual basis for vertex-based upper bounds in `cobre-sddp` remains open

---

## Active Deferrals for Later Epics

- **MCP long-running operation model is unresolved**: should `cobre/run` use progress notifications during the MCP call or a background task with polling? flagged as open assumption Q-3 in `architecture-021.md` §6.1; Epic 07 ticket-023 must confirm with user before writing §7
- **async Python support deferred**: `asyncio` wrappers for `train()` / `simulate()` are optional; recommended approach is `run_in_executor`; flagged as open assumption Q-4 in `architecture-021.md` §6.1; ticket-024 must mark as optional
- **Forward references to 4 planned interface specs**: `design-principles.md` Cross-References now includes `structured-output.md`, `mcp-server.md`, `python-bindings.md`, `terminal-ui.md` all marked "(planned)"; do not convert to real links until Epic 07 creates the files
- **ticket-026 is large (12 spec files + 3 new crate docs)**: consider splitting into two passes — existing spec modifications first, new crate documentation pages second
- **LP sizing calculator `n_forward_passes` default is 200** while spec uses 192; discrepancy annotated in §3.4; calculator code is out of audit scope
- **13 penalty cost symbols unregistered** in `notation-conventions.md`; authoritative source is `lp-formulation.md` §1.3
- **`$\gamma` overloading** (FPHA coefficients vs pumping power rate); relevant for Python binding parameter naming in ticket-024
- **7 missing DOIs** in bibliography (Pereira 1991, Philpott 2008, de Matos 2015, Shapiro 2011, Philpott 2012, Dowson 2021, Huangfu 2018)
- **Solver benchmarking validation**: timing model produces pre-implementation estimates; warm-start LP solve time and backward pass opening warm-start hit rate are the only two high-sensitivity parameters to measure first
- **3 MEDIUM organization improvements from findings-016.md**: M-1 (harmonize SUMMARY.md order), M-2 (add navigation sections to 4 container pages), M-3 (align cross-reference index numbering); batch as a single maintenance ticket

---

## Spec Reliability Tiers (for downstream ticket writing)

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `discount-rate.md`, `infinite-horizon.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs; `bibliography.md` after Epic 02 fixes
- **Calculator-verified**: `production-scale-reference.md` §3.1-§3.4; run `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin` for exact values
- **Model-verified performance numbers**: `production-scale-reference.md` §4.2 Production row and §4.6-§4.7 from timing model at `epic-04-wall-clock-time-model/timing-model-analysis.md`
- **Agent interface architecture settled**: `design-principles.md` §6 + `epic-06-pyo3-python-api-impact/architecture-021.md` are the authoritative references for all Epic 07 spec authors; design decisions in findings-019 §2 are resolved and should not be re-litigated
- **Event payload canonical source**: `convergence-monitoring.md` §2.4 per-iteration record = `ConvergenceUpdate` event = TUI convergence plot data = MCP progress notification payload = JSON-lines `progress` event; single definition shared across all consumers
- **GIL contract canonical source**: `findings-020.md` §2.2 and `architecture-021.md` §2.2; the five-point invariant must be reproduced verbatim in `python-bindings.md` (ticket-024)
- **`src/crates/overview.md` now correct**: cobre-io capability description uses JSON/Parquet/CSV/Arrow after Epic 05 fixes; Epic 07 ticket-026 will add 3 new crate rows

---

## Process Patterns Established

- **Severity tier (REQUIRED / RECOMMENDED / OPTIONAL)** for capability-addition assessments; mirrors KEEP / UPDATE / REMOVE from reference-audit epics; both provide clean three-way triage (Epics 05, 06)
- **Assessment-first, synthesis-second** epic structure: parallel read-only assessment tickets feed a single synthesis ticket that produces the architecture and any spec modifications; prevents premature design decisions (Epic 06)
- **Per-interface-layer sections before cross-cutting consolidation**: organize assessment by layer (MCP / Python / TUI) before merging into unified Impact Inventory Table; prevents cross-contamination and enables de-duplication (Epic 06)
- **Design decision documentation with options table**: each decision gets Pros/Cons table + recommended choice + numbered rationale; makes reasoning inspectable without re-reading all source specs (Epic 06)
- **"Must contain / Must NOT contain / Depends on / Assumption" scope blocks** in architecture documents; enables Epic 07 authors to verify completeness and prevents scope overlap between parallel tickets (Epic 06)
- **Event-type-in-shared-crate pattern**: place shared message types in `cobre-core` so producer and all consumers share a single definition without circular dependencies (Epic 06)
- **Full-corpus symbol scan as closing step** of any cross-cutting rename; one grep confirms isolation (Epic 01)
- **Crossref API** (`api.crossref.org/works/{doi}`) is the definitive DOI verification tool; HTTP 200 reachability alone is insufficient (Epic 02)
- **CLEAN/findings-first ticket before any fix ticket**: verification-only ticket confirms baseline before changes (Epics 03, 05)
- **"Source" column pattern for tabular specs**: adds provenance to formula tables, reduces future audit effort (Epics 03-04)
- **Standalone audit artifact in plans/ directory**: for long quantitative derivations, place model in epic directory and reference from spec sections (Epic 04)
- **Annotation-not-modification for tool/spec discrepancies**: when reference tool uses a different default than the spec, annotate rather than modify the tool (Epics 03-04)
- **"Planned support" replacement wording**: replace false present-tense capability claims (Epic 05); extended to "(planned)" link annotation for specs not yet written (Epics 05, 06)
- **Zero-match grep assertion after file deletion**: after removing files, grep for link patterns targeting deleted paths (Epics 01, 05)
- **Forward references with "(planned)" annotation**: never add SUMMARY.md entries for non-existent files; use annotation-only approach in cross-reference sections (Epics 05, 06)
- **Three-way classification for external-reference cleanup**: KEEP / UPDATE / REMOVE avoids over-deletion; UPDATE bucket contains false capability claims (Epic 05)
- **Decision table with rationale column**: all N occurrences with File, Line, Keyword, Context, Decision, Rationale columns; audit is reproducible and challengeable at the individual-item level (Epics 05, 06)
