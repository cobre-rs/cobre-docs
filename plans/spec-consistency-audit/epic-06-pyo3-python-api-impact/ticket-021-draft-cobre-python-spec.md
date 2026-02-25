# ticket-021 Define Agent-Readability Design Principles and Interface Architecture

## Context

### Background

Tickets 019 and 020 produce detailed impact assessments identifying which existing specs need modification and what architectural constraints apply to each of the four interface layers (Structured CLI, MCP, Python, TUI). This ticket synthesizes those findings into two concrete deliverables: (1) a new "Agent-Readability" design principle for inclusion in `design-principles.md`, and (2) an interface architecture document that maps three new crates into the existing dependency graph, defines responsibility boundaries, and establishes the agent context strategy.

The existing design principles in `src/specs/overview/design-principles.md` cover: format selection criteria (section 1), key design goals (section 2: separation of concerns, scalability, reproducibility, warm-start, distributed I/O, declaration order invariance), declaration order invariance details (section 3), LP subproblem formulation reference (section 4), and implementation language / FFI strategy (section 5). Agent-readability would become the 7th design goal in section 2, with its own detailed section.

### Relation to Epic

This is the synthesis ticket of Epic 06. It depends on both ticket-019 (structured CLI impact) and ticket-020 (MCP/Python/TUI impact). Its output -- the architecture document and the draft design principle -- becomes the primary input for all 5 tickets in Epic 07 (spec authoring). Without this ticket, Epic 07 authors would lack a coherent architectural blueprint and would make conflicting decisions across the 5 new/updated specs.

### Current State

- **`src/specs/overview/design-principles.md`** has 5 numbered sections. Section 2 lists 6 design goals. The agent-readability principle does not yet exist. The spec is 205 lines long. The Cross-References section at the end lists 5 linked specs.

- **`src/crates/overview.md`** documents 6 crates + ferrompi in a dependency graph. The graph shows `cobre-cli` at the top depending on `cobre-sddp`, `cobre-io`, and `cobre-core`. There are no placeholder entries for `cobre-mcp`, `cobre-python`, or `cobre-tui`.

- **`src/specs/cross-reference-index.md`** has 50 spec entries in section 1 (Spec-to-Crate Mapping Table), per-crate reading lists for 7 crates in section 2, and outgoing/incoming cross-reference tables in sections 3-4. Adding 3 new crates and new spec pages would require updates across all 4 sections.

- **Findings from ticket-019** (structured CLI impact) will provide: impact inventory of spec changes for structured output, design decision recommendations (output mode default, progress streaming transport, subcommand pattern, error schema), new section inventory, and backward compatibility analysis.

- **Findings from ticket-020** (MCP/Python/TUI impact) will provide: per-interface-layer assessment, consolidated impact inventory, new crate documentation inventory, and architectural constraint summary (especially GIL/MPI analysis).

## Specification

### Requirements

Produce two deliverables:

**Deliverable 1: Agent-Readability Design Principle Draft**

Write a new section to be added to `design-principles.md` that:

1. Defines what "agent-readable" means for Cobre: structured I/O with stable JSON schemas, discoverable capabilities via introspection endpoints, composable operations for multi-step agent workflows, and deterministic behavior for reproducible agent interactions.
2. Positions agent-readability alongside existing principles. It does NOT replace any existing principle -- it complements them. Specifically:
   - Reproducibility (existing goal 3) enables agent verification of results
   - Scalability (existing goal 2) applies to agent workloads too
   - Declaration order invariance (existing goal 6) ensures agent-constructed inputs produce consistent results
3. Establishes concrete design rules:
   - Every CLI operation has a JSON schema for its output
   - Every error is structured (machine-parseable, with error kind, context, and suggested action)
   - Every long-running operation supports progress streaming (JSON-lines)
   - Every result is queryable without re-running the computation (results API)
4. **Actually modify `design-principles.md`** to add the new principle as section 2 goal 7 ("Agent-Readability") and add a new section 6 with the detailed treatment (parallel to how section 3 expands on goal 6 "Declaration Order Invariance").

**Deliverable 2: Interface Architecture Document**

Write an architecture document in the epic directory that:

1. Defines the expanded dependency graph with 3 new crates:
   - `cobre-mcp` -- MCP server, depends on: `cobre-sddp`, `cobre-io`, `cobre-core`
   - `cobre-python` -- PyO3 bindings, depends on: `cobre-sddp`, `cobre-stochastic`, `cobre-solver`, `cobre-io`, `cobre-core`
   - `cobre-tui` -- Terminal UI, depends on: `cobre-cli` (consumes the same event/progress stream)
2. Defines responsibility boundaries for each new crate (what it owns vs what it delegates).
3. Defines the shared event/progress stream architecture: a common event channel that CLI, MCP, and TUI all consume, carrying iteration progress, convergence metrics, and phase transitions.
4. Defines the agent context strategy:
   - CLAUDE.md conventions for the repository
   - Claude Code skill definitions for common operations
   - Structured documentation patterns (machine-readable cross-reference index)
   - Agent-friendly error messages with actionable suggestions
5. Provides a scope definition for each Epic 07 spec document, so Epic 07 ticket authors know exactly what to write.

### Inputs/Props

- Findings from ticket-019: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md`
- Findings from ticket-020: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md`
- Current design principles: `src/specs/overview/design-principles.md`
- Current crate overview: `src/crates/overview.md`
- Current cross-reference index: `src/specs/cross-reference-index.md`
- Epic overview: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/00-epic-overview.md`

### Outputs/Behavior

1. **Modified file**: `src/specs/overview/design-principles.md` -- with agent-readability added as goal 7 in section 2, and a new section 6 providing the detailed treatment.
2. **New file**: `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` -- the interface architecture document.

### Error Handling

- If findings-019.md or findings-020.md contain OPEN items (unresolved design decisions), document them as assumptions in the architecture document and flag them for user review.
- If the GIL/MPI analysis from ticket-020 concludes that Python must be single-process only, the architecture document must reflect this as a hard constraint on `cobre-python` (no MPI dependency, no ferrompi in its dependency tree).

## Acceptance Criteria

- [ ] Given `design-principles.md` section 2 currently has 6 goals, when the modification is complete, then goal 7 "Agent-Readability" exists with a 1-2 sentence description consistent with the style of goals 1-6.
- [ ] Given `design-principles.md` currently has sections 1-5 plus Cross-References, when the modification is complete, then a new section 6 "Agent-Readability (Detailed)" exists that parallels the depth of section 3 "Declaration Order Invariance."
- [ ] Given the 4 concrete design rules from Requirements, when the new section 6 is reviewed, then each rule is stated, with rationale and at least one concrete example showing how it applies to a Cobre operation.
- [ ] Given the existing design principles (reproducibility, scalability, declaration order invariance), when the agent-readability section is reviewed, then it explicitly explains how agent-readability complements each existing principle rather than replacing it.
- [ ] Given the 3 new crates (`cobre-mcp`, `cobre-python`, `cobre-tui`), when the architecture document is reviewed, then each has a dependency list, responsibility boundary definition, and execution mode specification (MPI vs single-process).
- [ ] Given the epic overview's shared event stream concept, when the architecture document is reviewed, then the event stream architecture is defined with: event types, payload shapes, consumer registration pattern, and relationship to existing convergence monitoring output (section 2.4 of convergence-monitoring.md).
- [ ] Given Epic 07 has 5 tickets (022-026), when the architecture document's scope definitions section is reviewed, then each Epic 07 ticket has a clear scope statement specifying what the spec document should contain.
- [ ] Given the modified `design-principles.md`, when `mdbook build` is run from `src/`, then it exits 0 with no new errors.
- [ ] Given the architecture document references findings from tickets 019 and 020, when any OPEN items from those findings appear, then they are documented as explicit assumptions with a note that they require user confirmation.

## Implementation Guide

### Suggested Approach

1. Read both findings reports (findings-019.md and findings-020.md) to absorb all impact assessments and design decisions.
2. Draft the agent-readability design principle text. Study the style and depth of existing section 3 (Declaration Order Invariance) as the template for the new section 6.
3. Modify `design-principles.md`:
   - Add "7. **Agent-Readability**: ..." to the section 2 list
   - Add section 6 with subsections for the design rules, examples, and cross-cutting concerns
   - Update the Cross-References section to link to the new interface specs (as forward references to Epic 07 outputs)
4. Draft the interface architecture document:
   - Start with the dependency graph (ASCII art consistent with the style in `crates/overview.md`)
   - Define each new crate's responsibilities
   - Define the shared event stream
   - Define the agent context strategy
   - Write Epic 07 scope definitions
5. Verify `mdbook build` exits 0.

### Key Files to Read

| File                                                                          | Focus Areas                                                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-019.md` | Design decisions, impact inventory, new section inventory                                                              |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/findings-020.md` | Per-layer assessments, GIL analysis, architectural constraints, new crate inventory                                    |
| `src/specs/overview/design-principles.md`                                     | Section 2 (goals list), section 3 (detailed principle template), section 5 (implementation language), Cross-References |
| `src/crates/overview.md`                                                      | Dependency graph style, design principles section                                                                      |
| `src/specs/cross-reference-index.md`                                          | Structure for understanding how new specs would be indexed                                                             |
| `src/specs/architecture/convergence-monitoring.md`                            | Section 2.4 (per-iteration output record) -- basis for event stream payload                                            |
| `src/specs/architecture/training-loop.md`                                     | Section 2.1 (iteration lifecycle) -- basis for event types                                                             |

### Key Files to Modify

| File                                      | Change                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/specs/overview/design-principles.md` | Add goal 7 to section 2 list; add new section 6 "Agent-Readability"; update Cross-References |

### Key Files to Create

| File                                                                              | Content                         |
| --------------------------------------------------------------------------------- | ------------------------------- |
| `plans/spec-consistency-audit/epic-06-pyo3-python-api-impact/architecture-021.md` | Interface architecture document |

### Patterns to Follow

- **Detailed principle section** pattern: section 3 (Declaration Order Invariance) in `design-principles.md` is the gold standard. It has: a critical callout, a principle statement, implementation requirements, validation requirements, and rationale. Replicate this structure for the agent-readability section.
- **ASCII dependency graph** style from `crates/overview.md`: use the same tree-style format for the expanded dependency graph.
- **"Planned support" wording** pattern from Epic 05: when referencing Epic 07 specs that do not yet exist, use forward references like "See [Structured Output](../interfaces/structured-output.md) (planned)" rather than broken links.
- **mdBook build as regression gate**: run `mdbook build` after modifying `design-principles.md` to confirm no broken links or KaTeX failures.

### Pitfalls to Avoid

- Do not write the Epic 07 specs themselves. This ticket defines the _architecture_ and _scope_ for those specs; the actual spec content is written in tickets 022-026.
- Do not break the existing design-principles.md structure. The new content is additive: a new list item in section 2 and a new section 6. Sections 1-5 and the Cross-References section remain unchanged except for the Cross-References update.
- Do not add entries to SUMMARY.md for specs that do not yet exist. Forward references in the design-principles.md Cross-References section should use relative paths with "(planned)" annotation, not SUMMARY.md entries.
- Do not modify `crates/overview.md` in this ticket. The new crate entries will be added in Epic 07 when the actual crate specs are written. The architecture document in plans/ defines the target state.
- Do not create circular dependencies in the proposed crate graph. In particular, `cobre-tui` should depend on the event stream (which may come from `cobre-cli` or a shared `cobre-events` module), not directly on `cobre-sddp`.

## Testing Requirements

### Unit Tests

Not applicable -- this is primarily a documentation and architecture design ticket.

### Integration Tests

Not applicable.

### E2E Tests

Not applicable.

### Validation

- Run `mdbook build` from `src/` to confirm exit 0 after modifying `design-principles.md`.
- Verify the agent-readability section includes all 4 design rules from the Requirements.
- Verify the architecture document includes dependency graphs, responsibility boundaries, event stream design, agent context strategy, and Epic 07 scope definitions.
- Verify no SUMMARY.md changes were made (no new entries for non-existent files).

## Dependencies

- **Blocked By**: ticket-019, ticket-020 (needs both assessment reports)
- **Blocks**: Epic 07 (all tickets: 022, 023, 024, 025, 026)

## Effort Estimate

**Points**: 3
**Confidence**: Medium (depends on the completeness of findings from tickets 019 and 020; if either has many OPEN items, this ticket's scope may need adjustment)
