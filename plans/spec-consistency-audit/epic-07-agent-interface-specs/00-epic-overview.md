# Epic 07: Agent Interface Specification Authoring

## Goals

Write implementation-ready specification documents for the four agent interface layers identified in Epic 06, update existing specs with agent-readability patterns, and integrate three new crates into the documentation corpus.

## Motivation

Epic 06 assessed the impact and designed the architecture. This epic produces the actual spec documents at the same depth and quality as existing specs (e.g., `cli-and-lifecycle.md`, `solver-abstraction.md`). Each spec should be ready for a developer to implement from, with concrete APIs, data flows, error handling, and cross-references.

## Scope

### Interface Layer Specs (Priority Order)

1. **Structured Output** — JSON output mode, CLI subcommand expansion, progress streaming, error schemas
2. **MCP Server** — Tool/resource/prompt definitions, transport, security, capability negotiation
3. **Python Bindings** — PyO3 module structure, API surface, DataFrame interop, GIL strategy
4. **Terminal UI** — ratatui TUI architecture, monitoring views, interactive features

### Existing Spec Updates

- Add "Agent-Readability" principle to `design-principles.md`
- Add new crates to `crates/overview.md` and dependency graph
- Update `cross-reference-index.md` with new specs
- Define agent context patterns (CLAUDE.md, skills)

## Tickets

| Ticket     | Title                                                 | Detail Level |
| ---------- | ----------------------------------------------------- | ------------ |
| ticket-022 | Write structured-output.md spec                       | Outline      |
| ticket-023 | Write mcp-server.md spec                              | Outline      |
| ticket-024 | Write python-bindings.md spec                         | Outline      |
| ticket-025 | Write terminal-ui.md spec                             | Outline      |
| ticket-026 | Update existing specs with agent-readability patterns | Outline      |

## Dependencies

- **Depends on**: Epic 06 (assessment reports and architecture document)
- Internal ordering: ticket-022 first (structured output is the foundation), then tickets 023-025 can run in parallel, ticket-026 last (integrates everything)

## Success Criteria

- 4 new spec documents in the mdBook corpus at the same depth as existing architecture specs
- `design-principles.md` includes agent-readability principle
- `crates/overview.md` includes 3 new crates with dependency graph
- `cross-reference-index.md` updated with new specs
- `mdbook build` succeeds with all new content
- Each spec has concrete APIs, error handling, cross-references, and implementation guidance
