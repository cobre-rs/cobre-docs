# ticket-012 Assess Implementation Phase 1-4 Readiness

## Context

### Background

The implementation-readiness-audit plan has completed two epics: Epic 01 produced per-crate API surface completeness audits for all 8 required crates (reports 001-008), and Epic 02 triaged the 18 remaining Medium/Low gaps, verified cross-reference link integrity, and checked shared type consistency across specs. The accumulated learnings identify 91 total crate audit findings (16 High, 38 Medium, 33 Low), 3 Resolve-Before-Coding gaps, 12 Resolve-During-Phase gaps, and 3 Resolve-After-MVP gaps. This ticket uses those findings to assess whether Phases 1-4 of the implementation ordering can each produce their stated "testable intermediate."

### Relation to Epic

This is the first of three tickets in Epic 03 (Phase Readiness and Testing). It covers the foundation and infrastructure phases (Phase 1: cobre-core, Phase 2: cobre-io, Phase 3: ferrompi + cobre-solver, Phase 4: cobre-comm). Its companion ticket-013 covers Phases 5-8. Together, they feed the go/no-go readiness verdict in ticket-017 (Epic 04).

### Current State

The following Epic 01 and Epic 02 reports provide the input evidence:

- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-001-cobre-core.md` -- 47% COMPLETE (36/76 items), all entity types PARTIAL (no Rust struct definitions), `EntityId` MISSING
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-002-cobre-io.md` -- output writer API completely absent (GAP-020), 20 MISSING items, schema layer fully specified
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-004-cobre-solver.md` -- 79% COMPLETE (38/48 items), only 1 High-severity finding (naming: `patch_rhs_bounds`)
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-008-ferrompi.md` -- 96% COMPLETE (70/73 items), 0 MISSING items, 2 High-severity stale API names
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-01-per-crate-completeness/report-006-cobre-comm.md` -- 77% COMPLETE (43/56 items), strong trait contracts, 1 High-severity structural gap
- `/home/rogerio/git/cobre-docs/plans/implementation-readiness-audit/epic-02-gap-impact-and-consistency/report-009-gap-triage.md` -- gap triage with per-phase classification (section 3.2)

The implementation ordering document is at `/home/rogerio/git/cobre-docs/src/specs/overview/implementation-ordering.md` (section 5, Phases 1-4).

## Specification

### Requirements

For each of Phases 1-4, assess the following five dimensions and assign a per-phase verdict:

1. **Spec reading list completeness**: Does the phase's reading list in `implementation-ordering.md` section 5 cover all specs needed to produce the testable intermediate? Identify any missing specs.
2. **Testable intermediate achievability**: Can the stated "what becomes testable" be implemented given the current spec completeness? Cross-reference the crate audit reports (COMPLETE/PARTIAL/MISSING items) to determine which testable capabilities are blocked, achievable with local design decisions, or fully specified.
3. **Gap impact on phase**: Using report-009 section 3.2 (gaps by phase), list all gaps that affect this phase with their classification (Resolve-Before-Coding, Resolve-During-Phase, Resolve-After-MVP). Assess whether Resolve-Before-Coding gaps block the phase's testable intermediate.
4. **Implicit knowledge gaps**: Identify knowledge an implementer would need that is not in any spec -- domain assumptions, ordering constraints, integration patterns, or environmental requirements that are implicit in the spec prose but not documented.
5. **Cross-phase dependency risks**: Assess whether the phase's dependencies on earlier phases create integration risk. For Phase 3 specifically, assess the parallel development risk of ferrompi + cobre-solver.

Per-phase verdicts use a three-level scale:

- **READY**: All testable intermediates achievable with at most Resolve-During-Phase gaps
- **CONDITIONALLY READY**: Testable intermediates achievable after resolving specific, enumerated pre-coding conditions
- **NOT READY**: Fundamental spec gaps block the testable intermediate

### Inputs/Props

The report consumes only pre-existing files:

- Epic 01 reports: `report-001-cobre-core.md`, `report-002-cobre-io.md`, `report-004-cobre-solver.md`, `report-006-cobre-comm.md`, `report-008-ferrompi.md`
- Epic 02 reports: `report-009-gap-triage.md`, `report-010-crossref-integrity.md`
- Implementation ordering: `src/specs/overview/implementation-ordering.md` section 5 (Phases 1-4)
- Accumulated learnings: `plans/implementation-readiness-audit/learnings/epic-02-summary.md`

### Outputs/Behavior

A single Markdown report file: `plans/implementation-readiness-audit/epic-03-phase-readiness-and-testing/report-012-phase-1-4-readiness.md`

The report structure:

1. **Executive summary** -- one-paragraph overview with 4 per-phase verdicts
2. **Phase 1 assessment** (cobre-core) -- 5 dimensions, verdict, conditions if any
3. **Phase 2 assessment** (cobre-io) -- 5 dimensions, verdict, conditions if any
4. **Phase 3 assessment** (ferrompi + cobre-solver) -- 5 dimensions, verdict, conditions if any, parallel development risk assessment
5. **Phase 4 assessment** (cobre-comm) -- 5 dimensions, verdict, conditions if any
6. **Cross-phase summary table** -- phase, verdict, blocking conditions count, Resolve-During-Phase count, implicit gaps count
7. **Pre-coding conditions inventory** -- consolidated list of all conditions that must be met before a phase can begin, with estimated effort

### Error Handling

If a crate audit report referenced above does not exist, note it as a data gap in the report and assess the phase using only the available evidence. Do not fail the entire assessment.

## Acceptance Criteria

- [ ] Given the report file `report-012-phase-1-4-readiness.md` exists, when opened, then it contains exactly 7 sections (executive summary + 4 phase assessments + cross-phase summary table + pre-coding conditions inventory)
- [ ] Given each phase assessment section, when reviewed, then it addresses all 5 dimensions (reading list completeness, testable intermediate achievability, gap impact, implicit knowledge gaps, cross-phase dependency risks) with evidence citations from the Epic 01/02 reports
- [ ] Given the Phase 1 (cobre-core) assessment, when the testable intermediate is evaluated, then it accounts for the 47% COMPLETE status and identifies which testable capabilities (entity creation, registry population, topology validation, penalty resolution, canonical ID ordering, internal structure construction) are blocked vs achievable with local design decisions
- [ ] Given the Phase 3 assessment, when the parallel development risk of ferrompi + cobre-solver is assessed, then it identifies at least the `StageTemplate`/`StageIndexer` crate ownership ambiguity (report-004 finding F-006) and the `patch_rhs_bounds` naming inconsistency
- [ ] Given the cross-phase summary table, when reviewed, then the verdict column uses exactly one of READY, CONDITIONALLY READY, or NOT READY per phase, and all blocking conditions are enumerated with effort estimates

## Implementation Guide

### Suggested Approach

1. Read `implementation-ordering.md` section 5 and extract Phase 1-4 attributes (crates, testable intermediate, blocked by, spec reading list)
2. For each phase, load the corresponding crate audit report(s) and extract the completeness percentages, MISSING items list, and High-severity findings
3. Cross-reference report-009 section 3.2 (gaps by phase) to pull all gaps assigned to each phase
4. For each phase, walk through the "what becomes testable" list item by item and classify each as: (a) fully specified (COMPLETE in audit), (b) achievable with local design decisions (PARTIAL in audit, Resolve-During-Phase gap), or (c) blocked (MISSING in audit and/or Resolve-Before-Coding gap)
5. Identify implicit knowledge gaps by looking for assumptions in the spec prose that are not documented (e.g., ordering constraints, environment requirements, library version requirements)
6. Assign the verdict based on the blocking items count
7. Compile the cross-phase summary table and pre-coding conditions inventory

### Key Files to Modify

- `plans/implementation-readiness-audit/epic-03-phase-readiness-and-testing/report-012-phase-1-4-readiness.md` (new file, the sole deliverable)

### Patterns to Follow

- Follow the report format established in Epic 01 and Epic 02: title with report number, date, scope, clear section numbering, evidence citations with file paths and section references
- Use the three-level verdict scale (READY / CONDITIONALLY READY / NOT READY) consistently
- Use the Epic 02 learnings recommendation: "Use cobre-solver (79% COMPLETE) as the readiness target bar for Phase 1-4 crates; assess whether each crate can reach 70%+ before its implementation phase begins"

### Pitfalls to Avoid

- Do not re-audit the crate API surfaces -- this ticket consumes the existing reports, not the spec files directly
- Do not assess Phases 5-8 -- that is ticket-013's scope
- Do not conflate Resolve-During-Phase gaps with blocking conditions -- only Resolve-Before-Coding gaps produce conditions in the pre-coding inventory
- The cobre-io output writer gap (GAP-020) does NOT block Phase 2: Phase 2 is input loading and validation only. GAP-020 blocks Phase 7 (simulation + output). Verify this against report-009 section 3.2

## Testing Requirements

### Unit Tests

Not applicable -- this is a documentation audit ticket producing a Markdown report.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-004, ticket-006, ticket-008 (per-crate audit reports for Phase 1-4 crates), ticket-009 (gap triage results)
- **Blocks**: ticket-017 (readiness verdict)

## Effort Estimate

**Points**: 3
**Confidence**: High
