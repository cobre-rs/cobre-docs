# ticket-026 Update Existing Specs with Agent-Readability Patterns

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Apply the agent-readability vision from Epic 06 and the new specs from tickets 022-025 to existing documentation. This includes: adding the "Agent-Readability" design principle to `design-principles.md`, updating the crate overview with 3 new crates and revised dependency graph, updating the cross-reference index, expanding `cli-and-lifecycle.md` with subcommand references, and defining agent context patterns (CLAUDE.md, Claude Code skills, structured documentation conventions).

## Anticipated Scope

- **Files to modify**:
  - `src/specs/overview/design-principles.md` — Add "Agent-Readability" as design goal #7 (or renumber appropriately), defining what it means for every interface to be machine-parseable, discoverable, and composable
  - `src/crates/overview.md` — Add `cobre-mcp`, `cobre-python`, `cobre-tui` to crate table and dependency graph
  - `src/specs/cross-reference-index.md` — Add entries for new spec documents
  - `src/specs/architecture/cli-and-lifecycle.md` — Add cross-references to structured-output.md, brief note about subcommand expansion
  - `src/SUMMARY.md` — Add new spec pages to mdBook table of contents

- **Files to create**:
  - `src/crates/mcp.md` — Crate documentation page for cobre-mcp
  - `src/crates/python.md` — Crate documentation page for cobre-python
  - `src/crates/tui.md` — Crate documentation page for cobre-tui

- **Agent context deliverables**:
  - Define CLAUDE.md conventions for the cobre repositories (what agents need to know about the project)
  - Define Claude Code skill patterns for common Cobre operations
  - Establish structured documentation conventions that serve both human readers and agent consumers

- **Key decisions**: Which existing specs need additional cross-references to new specs
- **Spec depth**: Concrete additions to existing files, not just placeholders

## Dependencies

- **Blocked By**: ticket-022, ticket-023, ticket-024, ticket-025 (needs all new specs written first)
- **Blocks**: None (final ticket in plan)

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
