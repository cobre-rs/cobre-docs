# ticket-001: Create CLAUDE.md with Ecosystem Development Guidelines

## Context

### Background

The Cobre SDDP ecosystem completed 5 epics of specification work (plans/spec-readiness), producing 74 spec files and detailed accumulated learnings across 4 learnings summaries. These learnings capture durable patterns, conventions, and decisions that apply to ALL future work on the cobre-docs repository -- structural patterns for trait specs and testing specs, dispatch architecture choices, invariant and contract patterns, cross-reference conventions, and the section-numbering scheme.

Currently, these guidelines exist only in `plans/spec-readiness/learnings/epic-05-summary.md` (and earlier summaries). They are not automatically loaded when an agent works on this repo. Creating a `CLAUDE.md` at the repo root ensures these guidelines are always in context.

### Relation to Epic

This is the first ticket of Epic 1 (Ecosystem Guidelines). It creates the agent-facing artifact. Ticket-002 creates the human-facing artifact with the same content.

### Current State

- No `CLAUDE.md` exists at `/home/rogerio/git/cobre-docs/CLAUDE.md`
- Guidelines exist in `plans/spec-readiness/learnings/epic-05-summary.md` (most comprehensive, accumulates all prior learnings)
- The repo is an mdBook project with specs in `src/specs/`

## Specification

### Requirements

1. Create a file at `/home/rogerio/git/cobre-docs/CLAUDE.md`
2. Extract all durable development guidelines from the learnings files (primarily `epic-05-summary.md`)
3. Organize guidelines into clear sections that an agent can quickly reference
4. Include only patterns that are DURABLE -- they apply to future work, not just the completed spec-readiness plan

### Content Categories to Include

The following categories from the learnings must be represented:

**Structural Patterns (Trait Specs)**

- Opening structure: Purpose paragraph -> convention blockquote -> SS1 Trait Definition
- Convention blockquote verbatim from `communicator-trait.md`; trait specs only
- SS prefix for architecture-to-architecture links; `§` reserved for `src/specs/hpc/` files only
- The one valid `§` reference in the convention blockquote
- Dispatch mechanism section requirements
- Infallibility claims must cite upstream guarantees
- Cross-References section minimum entries

**Structural Patterns (Testing Specs)**

- Shared fixture before test tables
- Test naming convention paragraph
- Architecture testing naming pattern
- Error path tests in dedicated section
- Cross-solver equivalence tolerances

**Structural Patterns (Overview/Planning Specs)**

- Numbered sections (not SS or §)
- `(cross-cutting)` primary crate designation
- Implementation ordering phase structure
- Gap inventory table format

**Dispatch Architecture**

- The 4 dispatch patterns and when to use each
- `Box<dyn Trait>` rejection policy
- Dispatch comparison table reference

**Invariants and Contracts**

- Pure queries: no Result
- FFI-wrapping methods: Result with split postcondition tables
- Err recovery contract (caller calls reset)
- Retry and normalization encapsulation
- SolverError pattern

**Performance Focus**

- This is an HPC ecosystem -- every data structure decision must consider cache locality, SIMD-friendly layout, minimal allocation, and contiguous memory access
- Dominated strategy FLOP cost awareness
- Result-returning hot-path method benchmarking

**Documentation Conventions**

- § Convention enforcement
- Cross-reference index batch update methodology

### Inputs/Props

- Primary source: `/home/rogerio/git/cobre-docs/plans/spec-readiness/learnings/epic-05-summary.md`
- Secondary sources: `epic-02-summary.md`, `epic-03-summary.md`, `epic-04-summary.md`

### Outputs/Behavior

A single file at `/home/rogerio/git/cobre-docs/CLAUDE.md` containing all durable guidelines organized for agent consumption.

### Error Handling

Not applicable (file creation).

## Acceptance Criteria

- [ ] Given the file `/home/rogerio/git/cobre-docs/CLAUDE.md` does not exist, when this ticket is completed, then the file exists at the repo root
- [ ] Given the file is read by an agent, when the agent looks for structural patterns for trait specs, then it finds the opening structure, convention blockquote rules, SS prefix convention, and cross-reference minimum requirements
- [ ] Given the file is read by an agent, when the agent looks for dispatch architecture guidance, then it finds the 4 dispatch patterns (single active global, single active per-stage, multiple active, compile-time monomorphization) with when-to-use guidance
- [ ] Given the file is read by an agent, when the agent looks for performance guidance, then it finds explicit statements about cache locality, SIMD alignment, contiguous memory, and minimal allocation
- [ ] Given the file contains guidelines, when compared against `epic-05-summary.md`, then all durable patterns from the learnings are represented (no omissions of patterns that apply to future work)
- [ ] Given the file is created, when `mdbook build` is run, then the build succeeds (CLAUDE.md is outside src/ so it should not affect the build)

## Implementation Guide

### Suggested Approach

1. Read `plans/spec-readiness/learnings/epic-05-summary.md` thoroughly -- this is the most comprehensive learnings file, accumulating all prior epics
2. For each section in the learnings, determine if the pattern is durable (applies to future work) or ephemeral (specific to the spec-readiness plan)
3. Extract durable patterns and reorganize them for quick agent reference
4. Write the CLAUDE.md file with clear section headers and concise bullet points
5. Verify that no durable pattern from the learnings was omitted

### Key Files to Modify

- **Create**: `/home/rogerio/git/cobre-docs/CLAUDE.md`

### Source Files to Read

- `/home/rogerio/git/cobre-docs/plans/spec-readiness/learnings/epic-05-summary.md`
- `/home/rogerio/git/cobre-docs/plans/spec-readiness/learnings/epic-04-summary.md`
- `/home/rogerio/git/cobre-docs/plans/spec-readiness/learnings/epic-03-summary.md`
- `/home/rogerio/git/cobre-docs/plans/spec-readiness/learnings/epic-02-summary.md`

### Patterns to Follow

- Use Markdown headers for sections
- Use bullet points for individual guidelines
- Include file path references where relevant (e.g., "canonical blockquote source: `src/specs/hpc/communicator-trait.md`")
- Keep each guideline concise -- 1-2 lines maximum

### Pitfalls to Avoid

- Do NOT include ephemeral information (specific ticket IDs from the spec-readiness plan, specific rejection history counts, etc.)
- Do NOT include the guardian rejection history -- that is plan-specific metadata
- Do NOT paraphrase patterns that have precise wording requirements (e.g., the convention blockquote must be verbatim)
- Do NOT make this file excessively long -- agents have limited context windows; keep it focused on actionable guidelines

## Testing Requirements

### Unit Tests

Not applicable (documentation).

### Integration Tests

- Verify `mdbook build` succeeds after file creation

## Dependencies

- **Blocked By**: None
- **Blocks**: ticket-002 (ecosystem guidelines spec page uses same content), ticket-003 (cross-references)

## Effort Estimate

**Points**: 2
**Confidence**: High
