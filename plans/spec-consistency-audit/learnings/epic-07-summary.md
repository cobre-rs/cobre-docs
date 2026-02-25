# Accumulated Learnings: Through Epic 07

**Plan**: spec-consistency-audit
**Through Epic**: epic-07-agent-interface-specs (Agent Interface Specification Authoring)
**Updated**: 2026-02-25

---

## Corpus Health Baseline

- 210 symbol usages verified across 14 math specs; 85% consistent without changes (Epic 01)
- 12 academic bibliography entries verified; 42% error rate — dominant mode is wrong-metadata-but-valid-identifier (Epic 02)
- 54 values in `production-scale-reference.md` cross-checked against LP sizing calculator; 50 exact match, 4 explained variance, 0 new discrepancies (Epic 03)
- Forward pass count updated from 200 to 192 in 20 locations across 8 files (Epic 03)
- First-principles timing model at 25 ms warm-start KPI: 16.5 s/iteration, 825 s for 50 iterations (Epic 07 recheck; earlier 2 ms estimate was unrealistic for an 8,400-variable subproblem)
- 42 NEWAVE/CEPEL/DECOMP/DESSEM occurrences audited; 4 false capability claims corrected (Epic 05)
- 50-spec corpus organized; zero broken links, zero orphan files (Epic 05)
- Epic 06: 4 design decisions resolved; GIL/MPI constraint established; design-principles.md §6 added
- Epic 07: 4 new interface specs written; 14 existing specs updated; 3 new crate docs created; SUMMARY.md gains "Interfaces" section; total corpus grows to 58 specs
- mdBook build: exit 0 through all seven epics

---

## Key Findings

- **LP sizing calculator (`scripts/lp_sizing.py`) is ground truth** for all LP variable counts, constraint counts, state dimension, and memory estimates; see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §3
- **Wrong-metadata-but-valid-identifier is the dominant bibliography failure mode** — DOI resolves but title/authors belong to a different paper; see `/home/rogerio/git/cobre-docs/src/reference/bibliography.md`
- **Backward pass dominates at 89% of iteration compute** at 25 ms warm-start; backward warm-start hit rate is the single highest-sensitivity performance parameter
- **GIL/MPI incompatibility is three-layered and prohibits Python/MPI coexistence** in the same process: `MPI_Init_thread` timing, GIL vs `MPI_THREAD_MULTIPLE` deadlock risk, dual-FFI fragility; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` §2.2
- **`convergence-monitoring.md` §2.4 per-iteration record is the single canonical event payload** — its 8 fields serve JSON-lines streaming, TUI convergence plot, MCP progress notifications, and Parquet writer without modification
- **Error kind registry belongs in `structured-output.md` SS2.3** — all four interface specs consume it by reference; no duplication
- **Production scale correction**: stages = 60 (not 120), openings = 10 (not 20), LP warm-start KPI = 25 ms (not 2 ms); test system table now has 7 tiers (Unit Test, Small, Medium, Large, XLarge, 2XLarge, Production); see `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §4.2
- **Additive-only subsection insertion (SS1.1, SS4.1) preserves all existing cross-references** to existing section numbers across 14 modified files
- **Outline ticket names diverge from assessment names** — assessment documents are more authoritative than outline tickets; verify tool/class/function names against findings before writing detailed specs

---

## Active Deferrals

- **MCP long-running operation model (Q-3)**: `cobre/run` progress notifications vs background task with polling; flagged for user confirmation in `mcp-server.md` SS7; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` §6.1
- **async Python support (`train_async`, `simulate_async`)**: marked OPTIONAL in `python-bindings.md` SS7; recommended mechanism is `run_in_executor`
- **LP sizing calculator `n_forward_passes` default is 200** while spec uses 192; discrepancy annotated in spec; calculator code is out of audit scope
- **13 penalty cost symbols unregistered** in `notation-conventions.md`; authoritative source is `lp-formulation.md` §1.3
- **7 missing DOIs** in bibliography (Pereira 1991, Philpott 2008, de Matos 2015, Shapiro 2011, Philpott 2012, Dowson 2021, Huangfu 2018)
- **3 MEDIUM organization improvements from findings-016.md**: M-1 (harmonize SUMMARY.md order), M-2 (add navigation to 4 container pages), M-3 (align cross-reference index numbering)
- **Solver benchmarking validation**: all timing estimates are pre-implementation; 25 ms warm-start and backward pass warm-start hit rate are the two parameters to benchmark first

---

## Spec Reliability Tiers

- **High confidence, use as-is**: `cut-management.md`, `sddp-algorithm.md`, `stopping-rules.md`, `upper-bound-evaluation.md`, all HPC specs; all 4 new interface specs (structured-output, mcp-server, python-bindings, terminal-ui)
- **Calculator-verified**: `production-scale-reference.md` §3.1-§3.3; run the sizing script for exact values
- **Engineering-target performance numbers**: `production-scale-reference.md` §4.2 all rows; §4.6 is model-derived at 25 ms warm-start
- **Event payload canonical source**: `convergence-monitoring.md` §2.4 = `ConvergenceUpdate` event = TUI convergence plot data = MCP progress notification payload = JSON-lines `progress` envelope; single definition
- **GIL contract canonical source**: `findings-020.md` §2.2 and `architecture-021.md` §2.2; five-point invariant in `python-bindings.md` SS3

---

## Process Patterns Established

- **Foundation-spec-first pattern**: write the shared-schema spec (`structured-output.md`) before parallel consumer specs; consumer specs reference foundation by stable section anchor (Epics 06, 07)
- **"Must NOT contain" boundary list per parallel ticket**: explicitly name competing specs in each ticket's exclusion list; prevents scope leakage during parallel authoring (Epic 07)
- **Subsection insertion with SSN.N numbering**: all new additions to existing specs use subsection numbers to avoid renumbering; always read target file structure before choosing anchor (Epic 07)
- **Assessment-first, synthesis-second** epic structure: parallel read-only assessment tickets feed a single synthesis ticket; prevents premature design decisions (Epic 06)
- **Per-interface-layer sections before cross-cutting consolidation**: organize by layer (MCP / Python / TUI) before merging into unified Impact Inventory Table (Epic 06)
- **Design decision documentation with options table**: each decision gets Pros/Cons table + recommended choice + numbered rationale (Epics 06, 07)
- **"Must contain / Must NOT contain / Depends on / Assumption" scope blocks** in architecture documents enable downstream ticket authors to verify completeness without reading all source specs (Epics 06, 07)
- **Phased execution for large multi-file tickets**: SUMMARY.md and new pages first, cross-reference infrastructure second, spec modifications third, build verification last (Epic 07)
- **`(planned)` annotation converted to real link only after file creation and SUMMARY.md registration** — never write broken markdown links in anticipation of future files (Epics 05, 06, 07)
- **Event-type-in-shared-crate pattern**: shared message types in `cobre-core`; no new dependency edges in DAG (Epics 06, 07)
- **Crate page format**: status badge + Overview paragraph + Key Concepts bullets + dependency graph + Status paragraph; follow `src/crates/cli.md` as template (Epic 07)
- **Severity tier (REQUIRED / RECOMMENDED / OPTIONAL)** for capability-addition assessments; three-way triage prevents over-scoping (Epics 05, 06)
- **Full-corpus symbol scan as closing step** of any cross-cutting rename (Epic 01)
- **CLEAN/findings-first ticket before any fix ticket**: verification-only ticket confirms baseline before changes (Epics 03, 05)
- **Annotation-not-modification for tool/spec discrepancies**: annotate rather than modify when reference tool uses different default than spec (Epics 03-04)
- **Standalone audit artifact in plans/ directory**: for long quantitative derivations, store model in epic directory and reference from spec (Epic 04)
- **Zero-match grep assertion after file deletion**: after removing files, grep for link patterns targeting deleted paths (Epics 01, 05)
- **Verify mdBook build after each phase of large integration tickets**, not only at the end (recommended by Epic 07 experience)
- **Verify outline ticket names against assessment documents before writing detailed spec content** (Epic 07)
