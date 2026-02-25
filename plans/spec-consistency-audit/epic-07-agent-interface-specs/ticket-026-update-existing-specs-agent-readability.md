# ticket-026 Update Existing Specs with Agent-Readability Patterns

## Context

### Background

Epic 06 identified 23 existing spec sections requiring changes for structured CLI output (findings-019 SS1), 16 sections requiring changes for MCP/Python/TUI integration (findings-020 SS4), and defined 14 new sections to add to existing specs (findings-019 SS3). The architecture document (architecture-021.md SS5.5) specifies exactly which files to modify and which new crate documentation pages to create. Tickets 022-025 create the four new interface specs; this ticket integrates them into the existing documentation corpus by modifying existing specs and creating supporting documentation.

### Relation to Epic

This is the final ticket in Epic 07 and in the entire plan. It depends on all four interface spec tickets (022-025) because it adds cross-references to the new specs and integrates them into SUMMARY.md and the cross-reference index. No other ticket depends on this one.

### Current State

After tickets 022-025 complete, the following new files will exist:

- `src/specs/interfaces/structured-output.md`
- `src/specs/interfaces/mcp-server.md`
- `src/specs/interfaces/python-bindings.md`
- `src/specs/interfaces/terminal-ui.md`

These files are NOT yet referenced in `src/SUMMARY.md`, `src/specs/cross-reference-index.md`, or any existing spec. The `(planned)` annotations in `design-principles.md` SS6 Cross-References need to be converted to real links.

Current state of files to modify:

- `src/specs/overview/design-principles.md` -- Already has Goal 7 "Agent-Readability" and SS6 with 4 rules, plus Cross-References with `(planned)` annotations for the 4 interface specs. The `(planned)` annotations must be converted to real links.
- `src/crates/overview.md` -- Has 6 crates + ferrompi. Needs 3 new rows: cobre-mcp, cobre-python, cobre-tui. Dependency graph needs expansion.
- `src/crates/cli.md` -- Describes single-entrypoint binary with no subcommands. Needs subcommand architecture and output format negotiation.
- `src/specs/cross-reference-index.md` -- Has 50 specs mapped to 7 crates. Needs new rows for 4 interface specs and 3 new crate entries. Needs reading lists for the 3 new crates.
- `src/SUMMARY.md` -- Has no "Interfaces" section. Needs a new section with the 4 interface specs. Needs 3 new crate entries.
- `src/specs/architecture/cli-and-lifecycle.md` -- SS1 says "single-entrypoint design"; needs expansion per findings-019 SS1 rows 1-8 and SS3 sections 1-6.
- `src/specs/architecture/convergence-monitoring.md` -- SS4 is text-only training log format; needs JSON-lines streaming schema per findings-019 SS3 sections 7-8.
- `src/specs/architecture/validation-architecture.md` -- SS5 needs structured output integration per findings-019 SS3 sections 9-10.
- `src/specs/data-model/output-infrastructure.md` -- Needs CLI report access subsection per findings-019 SS3 section 11.
- `src/specs/data-model/output-schemas.md` -- Needs structured output vs Parquet clarification per findings-019 SS3 section 12.
- `src/specs/configuration/configuration-reference.md` -- Needs CLI presentation settings note per findings-019 SS3 section 13.
- `src/specs/architecture/training-loop.md` -- Needs event emission points per findings-020 SS4 row 8.
- `src/specs/hpc/hybrid-parallelism.md` -- Needs single-process mode subsection per findings-020 SS4 rows 4-5.
- `src/specs/hpc/memory-architecture.md` -- Needs single-process mode notes per findings-020 SS4 rows 6-7.

New files to create:

- `src/crates/mcp.md` -- MCP server crate overview
- `src/crates/python.md` -- Python bindings crate overview
- `src/crates/tui.md` -- Terminal UI crate overview

## Specification

### Requirements

This ticket performs two categories of work: (A) modifying existing files to add agent-readability cross-references and integration sections, and (B) creating 3 new crate documentation pages.

#### Category A: Existing File Modifications

Modify the following files with changes derived from architecture-021.md SS5.5, findings-019 SS1 and SS3, and findings-020 SS4:

| #   | File                                                 | Changes                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/SUMMARY.md`                                     | Add "Interfaces" section under Specifications with 4 entries: Structured Output, MCP Server, Python Bindings, Terminal UI. Add 3 new crate entries under Crate Documentation: cobre-mcp, cobre-python, cobre-tui                                                                      |
| 2   | `src/specs/overview/design-principles.md`            | Convert 4 `(planned)` annotations in Cross-References to real links to the new interface specs                                                                                                                                                                                        |
| 3   | `src/crates/overview.md`                             | Add 3 new crate rows (cobre-mcp, cobre-python, cobre-tui) to crate table with status `experimental`. Update dependency graph to the expanded 9-crate architecture from architecture-021.md SS1.2                                                                                      |
| 4   | `src/crates/cli.md`                                  | Add Key Concepts for: subcommand dispatch, output format negotiation, structured error responses, progress streaming protocol. Reference structured-output.md and cli-and-lifecycle.md                                                                                                |
| 5   | `src/specs/cross-reference-index.md`                 | Add rows for 4 new interface specs in SS1 mapping table with primary crate assignments. Add per-crate reading lists for cobre-mcp, cobre-python, cobre-tui in SS2. Update outgoing/incoming cross-reference tables in SS3-SS4                                                         |
| 6   | `src/specs/architecture/cli-and-lifecycle.md`        | Add SS1.1 Agent Composability Principle. Add SS2.1 Subcommand Invocation Patterns. Add SS3.1 Global CLI Flags. Add SS3.2 Subcommand Arguments. Add SS5.4 Subcommand Phase Mapping. Add SS8 Structured Output Protocol (cross-reference to structured-output.md, not a full duplicate) |
| 7   | `src/specs/architecture/convergence-monitoring.md`   | Add SS4.1 JSON-Lines Streaming Schema (reference structured-output.md JSON-lines protocol). Add SS4.2 Termination Event Schema                                                                                                                                                        |
| 8   | `src/specs/architecture/validation-architecture.md`  | Add SS5.1 Structured Output Integration. Add SS5.2 Response Envelope Reference (cross-reference to structured-output.md)                                                                                                                                                              |
| 9   | `src/specs/data-model/output-infrastructure.md`      | Add SS1.3 CLI Report Access                                                                                                                                                                                                                                                           |
| 10  | `src/specs/data-model/output-schemas.md`             | Add SS7 Structured Output vs Parquet Schemas. Add JSON serialization guidance for MCP in SS1                                                                                                                                                                                          |
| 11  | `src/specs/configuration/configuration-reference.md` | Add SS1.1 CLI Presentation Settings note                                                                                                                                                                                                                                              |
| 12  | `src/specs/architecture/training-loop.md`            | Define event emission points at each of the 7 iteration lifecycle steps in SS2.1. Document single-rank variants in SS4.3 and SS6.3                                                                                                                                                    |
| 13  | `src/specs/hpc/hybrid-parallelism.md`                | Add single-process mode subsection in SS1. Document alternative initialization for library mode in SS6                                                                                                                                                                                |
| 14  | `src/specs/hpc/memory-architecture.md`               | Add single-process mode notes in SS1.1 and SS2.2                                                                                                                                                                                                                                      |

#### Category B: New Crate Documentation Pages

Create 3 new files following the existing crate page style (see `src/crates/cli.md` for format):

| #   | File                   | Content                                                                                                                                                                                            |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/crates/mcp.md`    | Overview, Key Concepts (MCP tools, resources, prompts, transport, security), dependency graph, status. Reference `mcp-server.md` spec. Per findings-020 SS5.1                                      |
| 2   | `src/crates/python.md` | Overview, Key Concepts (PyO3 module, GIL contract, zero-copy paths, single-process), dependency graph, status. Reference `python-bindings.md` spec. Per findings-020 SS5.2                         |
| 3   | `src/crates/tui.md`    | Overview, Key Concepts (ratatui rendering, event consumption, co-hosted/standalone modes, interactive features), dependency graph, status. Reference `terminal-ui.md` spec. Per findings-020 SS5.3 |

### Inputs/Props

| Source Document           | Relevant Sections             | What to Extract                                           |
| ------------------------- | ----------------------------- | --------------------------------------------------------- |
| `findings-019.md`         | SS1 (23-row impact inventory) | Spec sections to modify, required changes                 |
| `findings-019.md`         | SS3 (14 new sections)         | New section titles, descriptions, cross-references        |
| `findings-020.md`         | SS4 (16-row impact inventory) | Additional spec sections to modify                        |
| `findings-020.md`         | SS5.1-SS5.3 (crate docs)      | New crate page content                                    |
| `architecture-021.md`     | SS1.2 (expanded graph)        | Updated dependency graph for overview.md                  |
| `architecture-021.md`     | SS4 (agent context)           | CLAUDE.md conventions, skill definitions                  |
| `architecture-021.md`     | SS5.5 (scope definition)      | Must-modify table, must-create table, must-NOT boundaries |
| `design-principles.md`    | SS6, Cross-References         | `(planned)` annotations to convert                        |
| All 4 new interface specs | (entire documents)            | Cross-reference targets for existing spec updates         |

### Outputs/Behavior

- 14 existing files modified with additive changes (no deletions of existing content)
- 3 new crate documentation pages created
- `mdbook build` succeeds with all new content included in the sidebar

### Error Handling

- If any of the 4 interface specs (tickets 022-025) do not exist at expected paths, this ticket cannot proceed -- it depends on all of them
- If `mdbook build` fails after modifications, the failure must be diagnosed and fixed before the ticket is complete
- New sections added to existing specs must not break internal section numbering -- use subsection numbers (e.g., SS1.1, SS4.1) to insert without renumbering existing sections

## Acceptance Criteria

- [ ] Given `src/SUMMARY.md` exists, when reading it after modifications, then it contains an "Interfaces" section with 4 entries linking to `src/specs/interfaces/structured-output.md`, `src/specs/interfaces/mcp-server.md`, `src/specs/interfaces/python-bindings.md`, `src/specs/interfaces/terminal-ui.md`
- [ ] Given `src/SUMMARY.md` exists, when reading the Crate Documentation section, then it includes entries for cobre-mcp, cobre-python, and cobre-tui
- [ ] Given `src/specs/overview/design-principles.md` exists, when reading the Cross-References section, then all 4 `(planned)` annotations are replaced with real links to the interface specs
- [ ] Given `src/crates/overview.md` exists, when reading it after modifications, then it contains 9 crates (6 original + 3 new) in the table and the dependency graph matches architecture-021.md SS1.2
- [ ] Given `src/crates/mcp.md`, `src/crates/python.md`, and `src/crates/tui.md` do not exist, when the ticket is completed, then all 3 files exist with Overview, Key Concepts, and Status sections following the `cli.md` format
- [ ] Given `src/specs/cross-reference-index.md` exists, when reading it after modifications, then it contains rows for the 4 new interface specs with primary crate assignments and reading lists for 3 new crates
- [ ] Given `src/specs/architecture/cli-and-lifecycle.md` exists, when reading it after modifications, then it contains SS1.1, SS2.1, SS3.1, SS3.2, SS5.4, and SS8 as new subsections/sections
- [ ] Given `src/specs/architecture/convergence-monitoring.md` exists, when reading it after modifications, then it contains SS4.1 JSON-Lines Streaming Schema and SS4.2 Termination Event Schema
- [ ] Given `src/specs/architecture/training-loop.md` exists, when reading it after modifications, then SS2.1 documents event emission points at each of the 7 lifecycle steps
- [ ] Given `src/specs/hpc/hybrid-parallelism.md` exists, when reading it after modifications, then it contains a single-process mode subsection and alternative initialization documentation
- [ ] Given `mdbook build` is run from the repo root, then the build exits 0 with no new errors
- [ ] Given all modifications are complete, when searching for `(planned)` in `design-principles.md` Cross-References, then no `(planned)` annotations remain for the 4 interface specs

## Implementation Guide

### Suggested Approach

This ticket modifies 14 files and creates 3 new files. The recommended order is:

**Phase 1: SUMMARY.md and new crate pages** (enables mdBook to find all files)

1. Add "Interfaces" section to `src/SUMMARY.md` under Specifications
2. Add 3 new crate entries to `src/SUMMARY.md` under Crate Documentation
3. Create `src/crates/mcp.md`, `src/crates/python.md`, `src/crates/tui.md`

**Phase 2: Cross-reference infrastructure** 4. Update `src/specs/cross-reference-index.md` with new rows and reading lists 5. Update `src/crates/overview.md` with 3 new crate rows and expanded dependency graph 6. Convert `(planned)` annotations in `src/specs/overview/design-principles.md` Cross-References to real links

**Phase 3: Existing spec modifications** (add new subsections) 7. Modify `src/specs/architecture/cli-and-lifecycle.md` (largest change: 6 new subsections) 8. Modify `src/specs/architecture/convergence-monitoring.md` (2 new subsections) 9. Modify `src/specs/architecture/validation-architecture.md` (2 new subsections) 10. Modify `src/specs/architecture/training-loop.md` (event emission points + single-rank variants) 11. Modify `src/specs/hpc/hybrid-parallelism.md` (single-process mode) 12. Modify `src/specs/hpc/memory-architecture.md` (single-process notes) 13. Modify `src/specs/data-model/output-infrastructure.md` (CLI report access) 14. Modify `src/specs/data-model/output-schemas.md` (structured output vs Parquet) 15. Modify `src/specs/configuration/configuration-reference.md` (CLI presentation note) 16. Modify `src/crates/cli.md` (subcommand architecture key concepts)

**Phase 4: Verification** 17. Run `mdbook build` and verify exit 0 18. Grep for remaining `(planned)` annotations in modified files

### Key Files to Modify

| File                                                 | Action                                                   |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `src/SUMMARY.md`                                     | **MODIFY** -- Add Interfaces section and 3 crate entries |
| `src/specs/overview/design-principles.md`            | **MODIFY** -- Convert `(planned)` to real links          |
| `src/crates/overview.md`                             | **MODIFY** -- Add 3 crate rows, update dependency graph  |
| `src/crates/cli.md`                                  | **MODIFY** -- Add subcommand key concepts                |
| `src/specs/cross-reference-index.md`                 | **MODIFY** -- Add 4 spec rows, 3 crate reading lists     |
| `src/specs/architecture/cli-and-lifecycle.md`        | **MODIFY** -- Add 6 new subsections                      |
| `src/specs/architecture/convergence-monitoring.md`   | **MODIFY** -- Add 2 new subsections                      |
| `src/specs/architecture/validation-architecture.md`  | **MODIFY** -- Add 2 new subsections                      |
| `src/specs/data-model/output-infrastructure.md`      | **MODIFY** -- Add 1 new subsection                       |
| `src/specs/data-model/output-schemas.md`             | **MODIFY** -- Add 1 new section + guidance               |
| `src/specs/configuration/configuration-reference.md` | **MODIFY** -- Add 1 new subsection                       |
| `src/specs/architecture/training-loop.md`            | **MODIFY** -- Add event emission and single-rank docs    |
| `src/specs/hpc/hybrid-parallelism.md`                | **MODIFY** -- Add single-process mode                    |
| `src/specs/hpc/memory-architecture.md`               | **MODIFY** -- Add single-process notes                   |
| `src/crates/mcp.md`                                  | **CREATE** -- MCP server crate page                      |
| `src/crates/python.md`                               | **CREATE** -- Python bindings crate page                 |
| `src/crates/tui.md`                                  | **CREATE** -- Terminal UI crate page                     |

### Patterns to Follow

- **Crate page pattern**: Follow `src/crates/cli.md` format: `<span class="status-experimental">experimental</span>`, Overview paragraph, Key Concepts list with links, Status paragraph
- **Subsection insertion pattern**: Use subsection numbers (SS1.1, SS4.1, etc.) to avoid renumbering existing sections
- **Cross-reference pattern**: Use relative markdown links (e.g., `[Structured Output](../interfaces/structured-output.md)`)
- **New SUMMARY.md section pattern**: Follow the existing indentation style (2-space indent for nested items)
- **Additive modification pattern**: All changes to existing files are additions or link updates. Do NOT remove, reorder, or rewrite existing content

### Pitfalls to Avoid

- Do NOT add new sections that duplicate content already in the interface specs -- use cross-references instead (e.g., cli-and-lifecycle.md SS8 should reference structured-output.md, not copy the envelope schema)
- Do NOT renumber existing sections -- use subsection numbers (SS1.1, SS4.1) for insertion
- Do NOT remove the existing text training log format from convergence-monitoring.md SS4 -- it remains the default; the JSON-lines schema is an alternative activated by `--output-format json-lines`
- Do NOT forget to add the `src/specs/interfaces/` container page if mdBook requires one for the new section
- The learnings note that ticket-026 is large (12 spec files + 3 new crate docs) and suggested considering a split. The ticket is kept as one unit because the modifications are individually small (most are 1-3 paragraph additions) and interdependent (SUMMARY.md must list all files, cross-references must resolve bidirectionally)
- Do NOT create CLAUDE.md or `.claude/skills/` files -- these are described in architecture-021.md SS4 as agent context patterns for the _Cobre source repository_, not for the documentation repository

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` exits 0 with all new content
- Verify no broken internal links by checking mdBook build output for warnings
- Grep for remaining `(planned)` annotations in design-principles.md Cross-References -- should be zero for the 4 interface specs

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-022, ticket-023, ticket-024, ticket-025 (all 4 interface specs must exist before cross-references can be created)
- **Blocks**: None (final ticket in plan)

## Effort Estimate

**Points**: 5
**Confidence**: Medium (large number of files to modify; individual changes are small but coordination across 17 files is non-trivial)
