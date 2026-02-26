# Master Plan: Implementation Readiness Audit

## Executive Summary

This plan defines a systematic, evidence-based audit of the Cobre specification corpus to determine whether it is ready to begin coding the minimal viable SDDP solver. The audit examines eight dimensions -- per-crate API completeness, medium gap impact, cross-spec consistency, implementation phase readiness, test specification adequacy, data model traceability, HPC correctness, and a final go/no-go verdict -- and produces a structured report with findings, recommendations, and a clear readiness determination.

This is a documentation-only audit. No Rust code is produced. Every finding must cite a specific spec file, section number, and the exact text that supports or contradicts the claim.

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

### Non-Goals

- Writing Rust code or Cargo.toml files
- Resolving gaps (that is a separate plan if the verdict requires it)
- Auditing deferred crates (cobre-python, cobre-tui, cobre-mcp)
- Auditing deferred features (CVaR, Cyclic horizon, CLP backend, multi-cut, FPHA)
- Modifying the spec corpus (corrections discovered during the audit are logged as findings, not applied in-place)

## Architecture Overview

### Current State

The Cobre specification corpus contains 84 Markdown files across `src/specs/` (architecture, data-model, math, hpc, configuration, interfaces, overview) plus 12 crate overview files in `src/crates/`. Two prior plans have been executed:

- **spec-readiness** (5 epics): Established trait specs, testing specs, naming conventions, implementation ordering, and the gap inventory
- **gap-resolution** (4 epics, 25 tickets): Resolved all 5 Blocker and all 15 High-severity gaps

The gap inventory now shows 0 Blockers, 0 High, 13 Medium, 5 Low, and 5 known performance risks.

### Target State

A completed audit report that provides:

- Per-crate API surface coverage matrix (types, functions, errors, trait impls, boundary interactions)
- Medium/Low gap triage table with resolve-before vs resolve-during recommendations
- Cross-reference consistency verification results (broken links, type inconsistencies, notation mismatches)
- Per-phase readiness assessment with identified gaps in spec reading lists
- Testing spec adequacy scores per testing file
- End-to-end data flow tracing results (input formats through to output formats)
- HPC correctness verification results (MPI operations, threading, memory)
- Final GO / CONDITIONAL GO / NO-GO verdict with itemized conditions

### Key Design Decisions

1. **Audit-only scope**: Findings are reported, not fixed. This maintains separation between assessment and remediation.
2. **Evidence-based methodology**: Every finding must cite file path, section number, and relevant text. No subjective assessments without evidence.
3. **Per-crate granularity**: The completeness audit is structured per-crate to align with the implementation phases.
4. **Actionable recommendations**: Each finding includes a severity (Blocker/High/Medium/Low), affected phase, and recommended action.

## Technical Approach

### Tech Stack

- Documentation framework: mdBook with KaTeX preprocessor
- Spec format: Markdown with section numbering conventions (SS for architecture, section for HPC, plain numbered for overview)
- Validation: `mdbook build` for link checking, manual content review
- Domain: SDDP (Stochastic Dual Dynamic Programming) optimization ecosystem in Rust

### Audit Methodology

Each audit ticket follows a standardized methodology:

1. **Enumerate**: List all items to be verified (API surfaces, cross-references, test cases, data flows)
2. **Inspect**: Read each relevant spec file and extract the evidence
3. **Classify**: For each item, classify as COMPLETE, PARTIAL, or MISSING
4. **Report**: Write a structured finding with evidence citations
5. **Recommend**: For PARTIAL and MISSING items, recommend an action and severity

### Agent Routing

| Audit Dimension                                                     | Agent                               |
| ------------------------------------------------------------------- | ----------------------------------- |
| Per-crate completeness (cobre-sddp, cobre-solver, cobre-stochastic) | `sddp-specialist`                   |
| Per-crate completeness (cobre-io, cobre-core)                       | `data-model-format-specialist`      |
| Per-crate completeness (cobre-comm, ferrompi)                       | `hpc-parallel-computing-specialist` |
| Per-crate completeness (cobre-cli)                                  | `sddp-specialist`                   |
| Medium gap impact assessment                                        | `sddp-specialist`                   |
| Cross-spec consistency                                              | `implementation-guardian`           |
| Implementation phase readiness                                      | `sddp-specialist`                   |
| Test specification adequacy                                         | `monorepo-test-planner`             |
| Data model traceability                                             | `data-model-format-specialist`      |
| HPC correctness audit                                               | `hpc-parallel-computing-specialist` |
| Readiness verdict synthesis                                         | `orchestrator`                      |

### Deliverable Format

Each audit ticket produces a Markdown report written to the plan directory (`plans/implementation-readiness-audit/`). Reports follow a standardized structure:

```markdown
# [Audit Title]

## Scope

[What was audited]

## Methodology

[How the audit was conducted]

## Findings

### Finding F-NNN: [Title]

- **Severity**: Blocker / High / Medium / Low / Info
- **Affected Crate**: [crate name]
- **Affected Phase**: [phase number]
- **Evidence**: [file path, section, quoted text]
- **Impact**: [what happens if not addressed]
- **Recommendation**: [specific action]

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | N     |
| High     | N     |
| Medium   | N     |
| Low      | N     |
| Info     | N     |

## Verdict

[PASS / CONDITIONAL PASS / FAIL]
```

## Phases & Milestones

### Epic 1: Per-Crate Spec Completeness Audit (8 tickets)

Audit all 8 required crates for API surface coverage. One ticket per crate, producing a completeness matrix.

### Epic 2: Gap Impact Assessment and Cross-Spec Consistency (3 tickets)

Triage the 13 Medium + 5 Low gaps, verify cross-reference integrity, and verify shared type consistency.

### Epic 3: Implementation Phase Readiness and Test Adequacy (3 tickets)

Assess whether each phase can produce its testable intermediate, and verify testing spec adequacy.

### Epic 4: Data Model Traceability, HPC Correctness, and Verdict (3 tickets)

Trace data flows end-to-end, verify HPC spec correctness, and synthesize the final go/no-go recommendation.

## Risk Analysis

| Risk                                                                       | Likelihood | Impact | Mitigation                                                                                       |
| -------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------ |
| Audit discovers new Blocker-severity gaps                                  | Medium     | High   | The verdict ticket will clearly enumerate all newly-discovered blockers with resolution guidance |
| Cross-reference index is significantly out of date after gap-resolution    | Medium     | Medium | The consistency ticket will produce a delta of needed updates                                    |
| ferrompi API spec diverges from real crate in areas not covered by epic-04 | Low        | High   | The HPC audit ticket will verify all ferrompi API references against the real crate              |
| Testing specs are insufficient for conformance verification                | Medium     | Medium | The test adequacy ticket will identify specific missing test cases                               |

## Success Metrics

1. Every required crate has a completeness matrix with per-category coverage percentages
2. Every Medium and Low gap has a triage classification (resolve-before or resolve-during)
3. Every cross-reference link in the spec corpus is verified as resolving or flagged as broken
4. Every implementation phase has a readiness assessment with identified gaps
5. A clear GO / CONDITIONAL GO / NO-GO verdict is produced with itemized conditions
6. All findings are evidence-based with specific file/section citations
