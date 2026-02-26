# Master Plan: Implementation Readiness Audit

## Executive Summary

This plan defines a systematic, evidence-based audit of the Cobre specification corpus to determine whether it is ready to begin coding the minimal viable SDDP solver, followed by resolution of all conditions identified by the audit. Phase A (Epics 1-4, completed) audited the spec corpus across eight dimensions and produced a CONDITIONAL GO verdict with 19 enumerated conditions. Phase B (Epics 5-8) resolves all 19 conditions plus evaluates the rkyv serialization decision, targeting a definitive READY determination.

This is a documentation-only plan. No Rust code is produced. Every finding must cite a specific spec file, section number, and the exact text that supports or contradicts the claim. Every condition resolution must modify the spec corpus directly.

## Goals & Non-Goals

### Goals

1. Verify that every public API surface in the 8 required crates is specified with concrete Rust type signatures, behavioral contracts, and error handling
2. Classify the 13 remaining Medium gaps and 5 Low gaps as resolve-before-coding or resolve-during-implementation
3. Verify cross-spec consistency: shared types, cross-reference links, mathematical notation, and the cross-reference index
4. Assess whether each of the 8 implementation phases can produce its stated testable intermediate given current specs
5. Verify that testing specs meet minimum adequacy thresholds for conformance testing
6. Trace every input and output data format end-to-end through the loading/writing pipeline
7. Verify that HPC specs (MPI collectives, threading model, memory architecture) are concrete enough for implementation
8. Produce a clear GO / CONDITIONAL GO / NO-GO recommendation with itemized conditions
9. **(Phase B)** Resolve all conditions from the CONDITIONAL GO verdict
10. **(Phase B)** Evaluate rkyv serialization fitness for initialization-phase broadcast
11. **(Phase B)** Produce a final READY verdict confirming the spec corpus is implementation-ready

### Non-Goals

- Writing Rust code or Cargo.toml files
- Auditing deferred crates (cobre-python, cobre-tui, cobre-mcp)
- Auditing deferred features (CVaR, Cyclic horizon, CLP backend, multi-cut, FPHA)
- Resolving Resolve-During-Phase gaps (those are resolved during implementation, not spec work)

## Architecture Overview

### Current State

The Cobre specification corpus contains 84 Markdown files across `src/specs/` (architecture, data-model, math, hpc, configuration, interfaces, overview) plus 12 crate overview files in `src/crates/`. Three prior plans have been executed:

- **spec-readiness** (5 epics): Established trait specs, testing specs, naming conventions, implementation ordering, and the gap inventory
- **gap-resolution** (4 epics, 25 tickets): Resolved all 5 Blocker and all 15 High-severity gaps
- **implementation-readiness-audit Phase A** (4 epics, 17 tickets): Comprehensive audit producing CONDITIONAL GO verdict with 19 conditions

The gap inventory now shows 0 Blockers, 0 High, 13 Medium (3 Resolve-Before-Coding, 12 Resolve-During-Phase), 5 Low, and 5 known performance risks.

### Target State

A fully implementation-ready spec corpus:

- All 19 CONDITIONAL GO conditions resolved (19/19)
- All 3 Resolve-Before-Coding gaps resolved (GAP-020, GAP-023, GAP-029)
- Entity struct definitions added for all cobre-core types
- Output writer API fully specified (9 elements)
- Cross-references verified after all edits
- rkyv serialization decision evaluated with evidence
- Final READY verdict produced

### Key Design Decisions

1. **Audit-then-resolve**: Phase A (Epics 1-4) audited without modifying specs; Phase B (Epics 5-8) modifies specs to resolve findings.
2. **Evidence-based methodology**: Every finding must cite file path, section number, and relevant text. No subjective assessments without evidence.
3. **Per-crate granularity**: The completeness audit is structured per-crate to align with the implementation phases.
4. **Batch scheduling**: Batch 1 conditions (no dependencies) execute in Epics 5-6 in parallel; Batch 2 conditions (informed by training pipeline patterns) execute in Epic 7.

## Technical Approach

### Tech Stack

- Documentation framework: mdBook with KaTeX preprocessor
- Spec format: Markdown with section numbering conventions (SS for architecture, section for HPC, plain numbered for overview)
- Validation: `mdbook build` for link checking, manual content review
- Domain: SDDP (Stochastic Dual Dynamic Programming) optimization ecosystem in Rust

### Audit Methodology (Phase A)

Each audit ticket follows a standardized methodology:

1. **Enumerate**: List all items to be verified (API surfaces, cross-references, test cases, data flows)
2. **Inspect**: Read each relevant spec file and extract the evidence
3. **Classify**: For each item, classify as COMPLETE, PARTIAL, or MISSING
4. **Report**: Write a structured finding with evidence citations
5. **Recommend**: For PARTIAL and MISSING items, recommend an action and severity

### Resolution Methodology (Phase B)

Each resolution ticket follows a modify-and-verify pattern:

1. **Read** the spec file(s) to be modified
2. **Apply** the specified changes (struct definitions, renames, additions)
3. **Cross-reference** against related spec files to verify consistency
4. **Build** the mdBook to verify no broken links
5. **Update** gap inventory and cross-reference index if applicable

### Agent Routing

| Dimension                                                                      | Agent                               |
| ------------------------------------------------------------------------------ | ----------------------------------- |
| Per-crate completeness (cobre-sddp, cobre-solver, cobre-stochastic, cobre-cli) | `sddp-specialist`                   |
| Per-crate completeness (cobre-io, cobre-core)                                  | `data-model-format-specialist`      |
| Per-crate completeness (cobre-comm, ferrompi)                                  | `hpc-parallel-computing-specialist` |
| Gap impact assessment                                                          | `sddp-specialist`                   |
| Cross-spec consistency and verification                                        | `implementation-guardian`           |
| Phase readiness and testing adequacy                                           | `sddp-specialist`                   |
| Data model traceability and output API design                                  | `data-model-format-specialist`      |
| HPC correctness and ferrompi fixes                                             | `hpc-parallel-computing-specialist` |
| Serialization evaluation                                                       | `data-model-format-specialist`      |
| Readiness verdict synthesis                                                    | `sddp-specialist`                   |

### Deliverable Format

Phase A tickets produce Markdown audit reports. Phase B tickets produce spec file modifications (direct edits to `src/specs/` files) plus gap inventory updates.

## Phases & Milestones

### Phase A: Audit (Epics 1-4, COMPLETED)

#### Epic 1: Per-Crate Spec Completeness Audit (8 tickets, COMPLETED)

Audit all 8 required crates for API surface coverage. One ticket per crate, producing a completeness matrix.

#### Epic 2: Gap Impact Assessment and Cross-Spec Consistency (3 tickets, COMPLETED)

Triage the 13 Medium + 5 Low gaps, verify cross-reference integrity, and verify shared type consistency.

#### Epic 3: Implementation Phase Readiness and Test Adequacy (3 tickets, COMPLETED)

Assess whether each phase can produce its testable intermediate, and verify testing spec adequacy.

#### Epic 4: Data Model Traceability, HPC Correctness, and Verdict (3 tickets, COMPLETED)

Trace data flows end-to-end, verify HPC spec correctness, and synthesize the final go/no-go recommendation. **Verdict: CONDITIONAL GO with 19 conditions totaling 9-16 working days.**

### Phase B: Condition Resolution (Epics 5-8)

#### Epic 5: Core Entity Struct Definitions and Validation Specs (4 tickets)

Resolve the high-effort Batch 1 conditions: add Rust struct definitions for all cobre-core entity types (C-01/C-02/C-03), enumerate the complete validation checklist (C-04/GAP-029), and define the `OpeningTree` type (C-09/GAP-023). **5-9 days effort.**

#### Epic 6: Mechanical Naming, Notation, and Index Fixes (5 tickets)

Resolve all Batch 1 mechanical fixes: stale API names (C-05/C-08), crate ownership (C-06), RAII guard (C-07), notation drift (C-10), threading reference (C-11), type mismatch (C-12), SLURM patterns (C-15), config standardization (C-16/C-17), cross-reference index (C-18), ferrompi::slurm module (C-19). **2-4 days effort.** Epics 5 and 6 execute in parallel.

#### Epic 7: Serialization Evaluation and Output Writer API (3 tickets)

Evaluate rkyv serialization fitness for System broadcast (special evaluation), define `SimulationScenarioResult` type (C-14), and design the full output writer API (C-13/GAP-020). **3-5 days effort.** This is the Batch 2 workstream.

#### Epic 8: Final Verification Pass (2 tickets)

Re-verify cross-reference integrity after all edits, confirm all 19 conditions resolved, and produce a final READY or STILL CONDITIONAL verdict. **2-3 days effort.**

## Risk Analysis

| Risk                                                               | Likelihood | Impact | Mitigation                                                                                              |
| ------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Entity struct definitions diverge from existing prose descriptions | Low        | Medium | Derive structs directly from input-system-entities.md JSON schema tables                                |
| Output writer API design is too complex for 2-3 day scope          | Medium     | High   | Use input-side `load_case` as template; start with simplest chain (metadata/JSON)                       |
| Cross-reference edits in Epics 5-6 introduce new broken links      | Medium     | Medium | Epic 8 ticket-030 re-verifies all cross-references                                                      |
| rkyv evaluation discovers no viable alternative                    | Low        | Low    | Keep rkyv if alternatives are worse; the evaluation still provides documented evidence for the decision |
| Condition resolution introduces new conditions                     | Low        | Medium | Epic 8 ticket-031 catches any new conditions in the final verdict                                       |

## Success Metrics

1. All 19 conditions from report-017 section 2 are individually resolved with evidence
2. All 3 Resolve-Before-Coding gaps (GAP-020, GAP-023, GAP-029) marked as resolved in the gap inventory
3. Cross-reference integrity verified after all edits (zero new broken links)
4. rkyv serialization fitness evaluated with concrete evidence and a clear recommendation
5. Final verdict is READY (or STILL CONDITIONAL with a bounded, enumerated list of remaining items)
6. `mdbook build` completes without errors after all changes
