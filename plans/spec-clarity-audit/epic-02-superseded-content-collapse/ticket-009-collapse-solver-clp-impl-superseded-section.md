# ticket-009 Collapse Superseded C++ Wrapper Section in solver-clp-impl.md

## Context

### Background

`src/specs/architecture/solver-clp-impl.md` section SS5 ("C++ Wrapper Strategy (Superseded by StageLpCache)") contains a full superseded section: purpose paragraph, detailed C++ API wrapping strategy, a comparison table (Strategy 2+3 vs Cloning with 8 rows), and a sizing estimate for cloning memory overhead. The section header itself says "Superseded by StageLpCache" and line 207 says the cloning optimization is "superseded". Despite being clearly labeled, the section is approximately 65 lines of detailed analysis that an implementer does not need to read.

### Relation to Epic

This ticket targets the second-largest block of superseded content in the corpus (after solver-workspaces SS1.10). CLP-specific implementation details are consulted by the implementer working on the CLP backend -- having a 65-line superseded section creates unnecessary cognitive load.

### Current State

`src/specs/architecture/solver-clp-impl.md`:

- Line 31: Introductory paragraph mentioning C++ API "anticipated for a cloning optimization (SS5) that is now superseded by StageLpCache"
- Line 205: `## 5. C++ Wrapper Strategy (Superseded by StageLpCache)`
- Lines 207-270: Full section containing:
  - Purpose paragraph explaining the supersession (lines 207-210)
  - Comparison table with 8 aspects: API level, Mechanism, Hot-path cost, Between iterations, Memory overhead, Status, C API dependency, Use case (lines 241-248)
  - `Clp_addRows` CSR format discussion (line 269)
  - Memory sizing for cloning (~7 MB per instance, ~14.3 GB per rank) (line 261)
  - `setPersistenceFlag` micro-optimization note (lines 207, 248)

## Specification

### Requirements

1. Replace the entire SS5 section body (lines 207-270) with a concise footnote of 3-4 sentences maximum:
   - State that CLP's C++ API offers `makeBaseModel`/`setToBaseModel` cloning, which was previously considered as an optimization
   - State that StageLpCache (SS11.4 in solver-abstraction.md) supersedes this: pre-assembled CSC eliminates the per-stage rebuild that cloning was designed to accelerate
   - Note that the C++ wrapper remains available only for the `setPersistenceFlag` micro-optimization (SS5.2), which is deferred until profiling data is available
2. Keep the section heading but update it to: `## 5. C++ Wrapper Strategy (Deferred)`
   - Rationale: "Superseded" implies it was once planned and rejected. "Deferred" is more accurate -- the optimization exists but is not needed under StageLpCache and is deferred until profiling shows it is beneficial
3. Update line 31 accordingly: replace "now superseded by StageLpCache" with "deferred pending profiling (StageLpCache eliminates the rebuild that cloning was designed to accelerate)"

### Inputs/Props

- File to edit: `src/specs/architecture/solver-clp-impl.md`
- Lines 31, 205-270

### Outputs/Behavior

- SS5 is a concise 5-6 line section (heading + footnote)
- The comparison table, memory sizing, and detailed C++ API analysis are removed
- The `setPersistenceFlag` deferred note is preserved in the footnote

### Error Handling

- If line numbers have shifted, locate by searching for "C++ Wrapper Strategy" and "Superseded by StageLpCache"

## Acceptance Criteria

- [ ] Given `src/specs/architecture/solver-clp-impl.md`, when reading SS5, then it contains at most 8 lines total
- [ ] Given `src/specs/architecture/solver-clp-impl.md`, when searching for "makeBaseModel" or "setToBaseModel", then matches appear only in the brief footnote (not in a multi-line analysis)
- [ ] Given `src/specs/architecture/solver-clp-impl.md`, when searching for the comparison table headers "API level" or "Hot-path cost" or "Memory overhead", then zero matches are found
- [ ] Given the repo root, when running `mdbook build`, then the build succeeds

## Implementation Guide

### Suggested Approach

1. Read lines 205-270 to understand the full SS5 section
2. Replace the section heading: `## 5. C++ Wrapper Strategy (Deferred)`
3. Replace the section body with:
   ```
   CLP's C++ API offers `makeBaseModel()`/`setToBaseModel()` cloning and a `setPersistenceFlag` micro-optimization. Under StageLpCache ([Solver Abstraction SS11.4](./solver-abstraction.md)), the per-stage LP rebuild that cloning was designed to accelerate no longer exists -- each stage transition is a single `Clp_loadProblem` call loading the pre-assembled StageLpCache CSC. The C++ wrapper is deferred until profiling identifies a concrete benefit from `setPersistenceFlag` (which keeps solver factorization data across `loadProblem` calls, potentially saving re-factorization cost).
   ```
4. Update line 31: replace "now superseded by StageLpCache" with "deferred pending profiling (StageLpCache eliminates the rebuild that cloning was designed to accelerate)"
5. Run `mdbook build` to verify

### Key Files to Modify

- `src/specs/architecture/solver-clp-impl.md` (lines 31, 205-270)

### Patterns to Follow

- Architecture specs use `SS` prefix for section references
- Cross-references use `[Solver Abstraction SS11.4](./solver-abstraction.md)`

### Pitfalls to Avoid

- Do not remove the section entirely -- other files may reference SS5. Keep the heading with updated label
- Do not remove the `setPersistenceFlag` mention -- it is a legitimate deferred optimization
- Do not change section numbers (SS1-SS4 and SS6+ must remain stable)

## Testing Requirements

### Unit Tests

Not applicable (documentation change).

### Integration Tests

- Run `grep -c "Hot-path cost\|Memory overhead\|API level" src/specs/architecture/solver-clp-impl.md` and verify count is 0
- Run `mdbook build` and verify success

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-003 (Appendix A cross-references in this file should be cleaned first)
- **Blocks**: None

## Effort Estimate

**Points**: 2
**Confidence**: High
