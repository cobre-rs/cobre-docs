# ticket-005 Restore Generic Framing in ecosystem-guidelines.md and CLAUDE.md

## Context

### Background

The two most authoritative project-level description files both say "an HPC SDDP solver written in Rust." `ecosystem-guidelines.md` section 1 says this on line 23. `CLAUDE.md` (the project instructions file loaded by AI coding assistants) says this in its Project Overview section. These descriptions shape how every contributor and AI assistant understands the project. They must describe Cobre as a power system analysis and optimization ecosystem.

### Relation to Epic

This is the final ticket in Epic 01. It updates the two files with the highest visibility -- the ones that define the project identity for both human contributors and AI assistants.

### Current State

File `src/specs/overview/ecosystem-guidelines.md` line 23:
"the Cobre ecosystem -- an HPC SDDP solver written in Rust"

File `CLAUDE.md` (repository root) Project Overview section:
"This is an **mdBook project** (`book.toml`, `src = \"src\"`) containing the specification corpus for the Cobre ecosystem -- an HPC SDDP solver written in Rust."

## Specification

### Requirements

1. Update `src/specs/overview/ecosystem-guidelines.md` section 1, line 23 to describe Cobre as "a power system analysis and optimization ecosystem written in Rust"
2. Update `CLAUDE.md` Project Overview paragraph to use the same ecosystem description
3. Preserve all other content in both files unchanged
4. The new description must be accurate: Cobre IS an ecosystem of Rust crates for power system analysis and optimization, with SDDP as the first vertical
5. Update the `CLAUDE.md` Implementation Readiness State section only if it contains SDDP-narrowing language in its framing (the actual gap/blocker content stays)

### Inputs/Props

- Files: `/home/rogerio/git/cobre-docs/src/specs/overview/ecosystem-guidelines.md`, `/home/rogerio/git/cobre-docs/CLAUDE.md`

### Outputs/Behavior

- Both files describe Cobre as a power system analysis and optimization ecosystem
- All other content (section numbering, invariants checklist, structural patterns, etc.) unchanged
- `CLAUDE.md` remains valid as project instructions for AI assistants

### Error Handling

- Do NOT change anything in `CLAUDE.md` beyond the project description line(s) -- this file is loaded by Claude Code and contains critical durable conventions
- Do NOT change any of the Do NOT rules, structural patterns, or convention enforcement content

## Acceptance Criteria

- [ ] Given `src/specs/overview/ecosystem-guidelines.md`, when line 23 (or its equivalent after edit) is read, then it says "power system analysis and optimization ecosystem" (or equivalent), not "HPC SDDP solver"
- [ ] Given `CLAUDE.md`, when the Project Overview paragraph is read, then it says "power system analysis and optimization ecosystem" (or equivalent), not "HPC SDDP solver"
- [ ] Given `ecosystem-guidelines.md`, when sections 2-10 are diffed against the original, then zero lines have changed
- [ ] Given `CLAUDE.md`, when the file is diffed against the original, then only the project description line(s) have changed (no structural patterns, conventions, or rules modified)
- [ ] Given both files, when `mdbook build` is run, then the build succeeds with no new warnings

### Out of Scope

- Sections 2-10 of `ecosystem-guidelines.md` (structural patterns, dispatch architecture, etc.)
- `CLAUDE.md` content beyond the project description: all patterns, conventions, Do NOT rules, and invariants are preserved exactly

## Implementation Guide

### Suggested Approach

**For `ecosystem-guidelines.md`:**

1. Find line 23 (in section 1, Repository Layout): "the Cobre ecosystem -- an HPC SDDP solver written in Rust"
2. Replace with: "the Cobre ecosystem -- a power system analysis and optimization platform written in Rust, with SDDP-based hydrothermal dispatch as the first solver vertical"
3. Verify no other content changed

**For `CLAUDE.md`:**

1. Find the Project Overview paragraph containing "the Cobre ecosystem -- an HPC SDDP solver written in Rust"
2. Replace with the same ecosystem description used in `ecosystem-guidelines.md`
3. Verify no other content changed -- this is critical, as `CLAUDE.md` is the authoritative instruction file

### Key Files to Modify

- `src/specs/overview/ecosystem-guidelines.md` (line 23 only)
- `CLAUDE.md` (Project Overview paragraph only)

### Patterns to Follow

- Use identical or near-identical language in both files for consistency
- "power system analysis and optimization ecosystem/platform written in Rust"
- Mention SDDP as "first vertical" or "first solver" to preserve context

### Pitfalls to Avoid

- CRITICAL: Do NOT modify any structural pattern definitions, convention enforcement rules, Do NOT lists, or invariant checklists in either file
- Do NOT modify the Key Directories table in `ecosystem-guidelines.md`
- Do NOT modify anything in `CLAUDE.md` sections: Structural Patterns, Dispatch Architecture, Invariants and Contracts, Performance Guidance, etc.
- Do NOT modify the Invariants Checklist in `ecosystem-guidelines.md`

## Testing Requirements

### Unit Tests

- `grep "HPC SDDP solver" src/specs/overview/ecosystem-guidelines.md` returns 0 matches
- `grep "HPC SDDP solver" CLAUDE.md` returns 0 matches

### Integration Tests

- `mdbook build` succeeds

### E2E Tests (if applicable)

N/A

## Dependencies

- **Blocked By**: None
- **Blocks**: None (but should be completed before Epic 03 ticket-014 which references the ecosystem description)

## Effort Estimate

**Points**: 2
**Confidence**: High
