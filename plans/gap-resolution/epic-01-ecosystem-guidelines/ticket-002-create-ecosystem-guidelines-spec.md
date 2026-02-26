# ticket-002: Create Ecosystem Guidelines Specification Page

## Context

### Background

The CLAUDE.md file (ticket-001) captures guidelines for agent consumption. This ticket creates the human-readable counterpart: a formal specification page in the mdBook that developers can reference when working on the Cobre ecosystem. The content is the same as CLAUDE.md but formatted as a proper specification document with the structural conventions used by the existing spec corpus.

### Relation to Epic

Second ticket of Epic 1. Creates the human-facing artifact. Depends on ticket-001 (which establishes the content).

### Current State

- No ecosystem guidelines page exists in `src/specs/overview/`
- The overview section currently contains: `design-principles.md`, `notation-conventions.md`, `production-scale-reference.md`, `implementation-ordering.md`, `spec-gap-inventory.md`
- These overview pages use plain numbered sections (`## 1.`, `## 2.`, etc.) -- never `SS` or `§`

## Specification

### Requirements

1. Create a file at `/home/rogerio/git/cobre-docs/src/specs/overview/ecosystem-guidelines.md`
2. Format the guidelines as a proper specification page following the overview-section structural patterns:
   - Use plain numbered sections (`## 1.`, `## 2.`, etc.)
   - Never use `SS` or `§` prefixes (those are for architecture and HPC specs respectively)
3. Include the same durable guidelines as CLAUDE.md but organized for a human reader browsing the mdBook
4. Include a Cross-References section linking to the spec files that the guidelines reference

### Sections to Include

The document should have these numbered sections:

1. **Purpose** -- Why these guidelines exist and how they emerged
2. **Specification Structural Patterns** -- How trait specs, testing specs, and overview specs are organized
3. **Dispatch Architecture Patterns** -- The 4 dispatch patterns and decision criteria
4. **Invariant and Contract Patterns** -- How method contracts are specified
5. **Error Type Design** -- The SolverError pattern for future error enums
6. **Performance Principles** -- HPC performance requirements for all design decisions
7. **Documentation Conventions** -- Section numbering, cross-references, § convention
8. **Cross-References** -- Links to referenced specifications

### Inputs/Props

- Content from ticket-001's CLAUDE.md
- Structural patterns from existing overview specs (e.g., `design-principles.md`, `implementation-ordering.md`)

### Outputs/Behavior

A Markdown file at `src/specs/overview/ecosystem-guidelines.md` that renders correctly in the mdBook.

### Error Handling

Not applicable (file creation).

## Acceptance Criteria

- [ ] Given the file `src/specs/overview/ecosystem-guidelines.md` does not exist, when this ticket is completed, then the file exists
- [ ] Given the file is opened, when the section structure is inspected, then all sections use plain numbered headers (`## 1.`, `## 2.`, etc.) with no `SS` or `§` prefixes
- [ ] Given the file's content is compared with CLAUDE.md, when checked for completeness, then every guideline category from CLAUDE.md is represented in the spec page
- [ ] Given the file has a Cross-References section, when the links are checked, then every linked file exists and the descriptions are accurate
- [ ] Given the file references the `communicator-trait.md` convention blockquote, when the reference is checked, then it uses the correct relative path from `src/specs/overview/` to `src/specs/hpc/communicator-trait.md`
- [ ] Given the file is added to the mdBook, when `mdbook build` is run (after ticket-003 adds it to SUMMARY.md), then the page renders with no errors

## Implementation Guide

### Suggested Approach

1. Read the CLAUDE.md file created in ticket-001
2. Read `src/specs/overview/design-principles.md` to understand the structural pattern for overview pages (numbered sections, Cross-References at bottom)
3. Transform the CLAUDE.md content into the overview-spec format:
   - Add a Purpose section explaining the origin and intent
   - Organize guidelines into numbered sections
   - Add prose explanations where bullet points are insufficient for human readers
   - Add a Cross-References section
4. Ensure all file references use correct relative paths from `src/specs/overview/`

### Key Files to Modify

- **Create**: `/home/rogerio/git/cobre-docs/src/specs/overview/ecosystem-guidelines.md`

### Reference Files to Read

- `/home/rogerio/git/cobre-docs/CLAUDE.md` (created by ticket-001)
- `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` (structural pattern reference)
- `/home/rogerio/git/cobre-docs/src/specs/overview/implementation-ordering.md` (structural pattern reference)

### Patterns to Follow

- Overview-section numbering: `## 1.`, `## 2.`, etc.
- Cross-References as a table at the bottom: `| Target | Relevance |`
- Relative paths from `src/specs/overview/` (e.g., `../architecture/solver-interface-trait.md`, `../hpc/communicator-trait.md`)

### Pitfalls to Avoid

- Do NOT use `SS` section prefix (that is for architecture specs)
- Do NOT use `§` section prefix (that is for HPC specs)
- Do NOT omit the Cross-References section (all overview specs have one)
- Do NOT use absolute file paths in cross-references (use relative paths within the mdBook source tree)

## Testing Requirements

### Unit Tests

Not applicable (documentation).

### Integration Tests

- Verify `mdbook build` succeeds after this file and SUMMARY.md are updated (verified in ticket-003)

## Dependencies

- **Blocked By**: ticket-001 (CLAUDE.md provides the content)
- **Blocks**: ticket-003 (SUMMARY.md update and cross-references)

## Effort Estimate

**Points**: 3
**Confidence**: High
