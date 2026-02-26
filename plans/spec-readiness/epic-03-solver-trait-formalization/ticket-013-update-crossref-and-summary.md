# ticket-013 Update Cross-Reference Index and SUMMARY for All Trait Specs

## Context

### Background

Epics 01, 02, and the first two tickets of epic 03 created 12 new specification files (6 trait specs + 6 conformance test specs). None of these files have been added to the mdBook SUMMARY or the cross-reference index. This ticket performs a batch update of both files to register all 12 new specs. Batch updating avoids the churn of 12 incremental updates and ensures consistency across all entries.

The 12 new files are:

- `src/specs/architecture/risk-measure-trait.md` (epic 01)
- `src/specs/architecture/risk-measure-testing.md` (epic 01)
- `src/specs/architecture/horizon-mode-trait.md` (epic 01)
- `src/specs/architecture/horizon-mode-testing.md` (epic 01)
- `src/specs/architecture/sampling-scheme-trait.md` (epic 01)
- `src/specs/architecture/sampling-scheme-testing.md` (epic 01)
- `src/specs/architecture/cut-selection-trait.md` (epic 02)
- `src/specs/architecture/cut-selection-testing.md` (epic 02)
- `src/specs/architecture/stopping-rule-trait.md` (epic 02)
- `src/specs/architecture/stopping-rule-testing.md` (epic 02)
- `src/specs/architecture/solver-interface-trait.md` (epic 03, ticket-011)
- `src/specs/architecture/solver-interface-testing.md` (epic 03, ticket-012)

### Relation to Epic

Third ticket in Epic 03. Depends on tickets 011 and 012 (all trait and test spec files must exist before they can be registered in the index). Blocks ticket-014 (crate spec updates need consistent cross-reference index).

### Current State

- `src/SUMMARY.md` has an Architecture section (lines 91-104) that lists 14 architecture specs but none of the 12 new trait/testing specs
- `src/specs/cross-reference-index.md` has 5 sections:
  - SS1. Spec-to-Crate Mapping Table (60 rows, numbered 1-60)
  - SS2. Per-Crate Reading Lists (11 crates with ordered spec lists)
  - SS3. Outgoing Cross-Reference Table (per-spec outgoing links)
  - SS4. Incoming Cross-Reference Table (per-spec incoming links)
  - SS5. Dependency Ordering (global topological order)
- The cross-reference index currently has 60 specs mapped. The 12 new specs will bring it to 72.
- The per-crate reading lists assign specs to crates: `cobre-sddp` owns RiskMeasure, HorizonMode, CutSelectionStrategy, and StoppingRule; `cobre-solver` owns SolverInterface; `cobre-stochastic` owns SamplingScheme. These assignments must be reflected in both the SS1 table and the SS2 per-crate reading lists.

## Specification

### Requirements

Modify two existing files:

**File 1: `src/SUMMARY.md`**

Add 12 new entries under the Architecture section. The trait and testing specs should be grouped as sub-items under a new "Trait Specifications" sub-group within the Architecture section, placed after the existing architecture specs (after `Extension Points`). The ordering within the group should pair each trait spec with its testing spec:

- Risk Measure Trait
- Risk Measure Testing
- Horizon Mode Trait
- Horizon Mode Testing
- Sampling Scheme Trait
- Sampling Scheme Testing
- Cut Selection Strategy Trait
- Cut Selection Strategy Testing
- Stopping Rule Trait
- Stopping Rule Testing
- Solver Interface Trait
- Solver Interface Testing

The entries use the standard mdBook SUMMARY format: `  - [Title](./specs/architecture/filename.md)`. The indentation level matches the existing architecture spec entries.

**File 2: `src/specs/cross-reference-index.md`**

Update all 5 sections:

1. **SS1 table**: Add 12 new rows (numbered 61-72) with the correct section (`architecture`), primary crate, and secondary crate(s) for each file:
   - `risk-measure-trait.md`: primary `cobre-sddp`
   - `risk-measure-testing.md`: primary `cobre-sddp`
   - `horizon-mode-trait.md`: primary `cobre-sddp`
   - `horizon-mode-testing.md`: primary `cobre-sddp`
   - `sampling-scheme-trait.md`: primary `cobre-stochastic`, secondary `cobre-sddp`
   - `sampling-scheme-testing.md`: primary `cobre-stochastic`, secondary `cobre-sddp`
   - `cut-selection-trait.md`: primary `cobre-sddp`
   - `cut-selection-testing.md`: primary `cobre-sddp`
   - `stopping-rule-trait.md`: primary `cobre-sddp`
   - `stopping-rule-testing.md`: primary `cobre-sddp`
   - `solver-interface-trait.md`: primary `cobre-solver`
   - `solver-interface-testing.md`: primary `cobre-solver`

2. **SS2 per-crate reading lists**: Insert the new specs into the correct position in each crate's reading list:
   - `cobre-sddp`: Add trait specs after `Extension Points` and before the existing HPC secondary specs. The reading order within trait specs should be: `risk-measure-trait.md`, `risk-measure-testing.md`, `horizon-mode-trait.md`, `horizon-mode-testing.md`, `cut-selection-trait.md`, `cut-selection-testing.md`, `stopping-rule-trait.md`, `stopping-rule-testing.md`. Testing specs are secondary.
   - `cobre-solver`: Add `solver-interface-trait.md` and `solver-interface-testing.md` after `Solver Abstraction` and before `Solver Workspaces`. Testing spec is secondary.
   - `cobre-stochastic`: Add `sampling-scheme-trait.md` and `sampling-scheme-testing.md`. Testing spec is secondary.

3. **SS3 outgoing cross-references**: Add one row per new spec file, listing all specs it references in its Cross-References section. This requires reading each of the 12 new files to extract their cross-reference lists.

4. **SS4 incoming cross-references**: For each existing spec that is referenced by any of the 12 new files, add the new file to its incoming references list. Also add rows for the 12 new files themselves showing which existing specs reference them.

5. **SS5 dependency ordering**: Insert the 12 new specs into the global topological order. Trait specs depend on their source specs (e.g., `risk-measure-trait.md` depends on `risk-measures.md` and `extension-points.md`). Testing specs depend on their corresponding trait spec.

### Content Guidelines

- Follow the exact formatting conventions already in place in each section of the cross-reference index
- Each SS3/SS4 row must list all cross-references, not just a subset
- SS2 reading list ordering must respect dependency order (trait spec before testing spec; source math/architecture spec before trait spec)
- Update the description text at the top of the cross-reference index to reflect the new total (72 specs instead of 60)
- Do NOT reorganize or reformat existing entries. Only add new entries.

## Acceptance Criteria

- [ ] Given `src/SUMMARY.md`, when reading the Architecture section, then all 12 new spec files appear as entries with correct paths
- [ ] Given `src/specs/cross-reference-index.md` SS1, when counting rows, then there are 72 rows (60 existing + 12 new)
- [ ] Given SS1, when reading the new rows, then each has the correct primary crate assignment (cobre-sddp for 8, cobre-solver for 2, cobre-stochastic for 2)
- [ ] Given SS2, when reading the `cobre-sddp` reading list, then 8 new specs appear in the correct dependency order
- [ ] Given SS2, when reading the `cobre-solver` reading list, then `solver-interface-trait.md` and `solver-interface-testing.md` appear after `solver-abstraction.md`
- [ ] Given SS2, when reading the `cobre-stochastic` reading list, then `sampling-scheme-trait.md` and `sampling-scheme-testing.md` appear
- [ ] Given SS3, when reading the outgoing cross-references for any new spec, then the list matches the spec's actual Cross-References section
- [ ] Given SS4, when reading the incoming cross-references for `extension-points.md`, then it includes all 5 trait specs that reference it
- [ ] Given SS5, when reading the dependency order, then trait specs appear after their source specs and before their testing specs
- [ ] Given the mdBook build, when building the book, then all 12 new pages render without broken links

## Implementation Guide

### Suggested Approach

1. Read `src/SUMMARY.md` and identify the insertion point in the Architecture section (after line 104, the `Extension Points` entry)
2. Add 12 new SUMMARY entries with correct paths and indentation
3. Read `src/specs/cross-reference-index.md` to understand the current structure
4. Add 12 rows to the SS1 table, continuing the numbering from 61
5. For SS2, read each crate's reading list and insert the new specs at the appropriate positions
6. For SS3, read each of the 12 new spec files and extract their Cross-References sections to build the outgoing reference rows
7. For SS4, cross-reference the SS3 data to identify which existing specs gain new incoming references
8. For SS5, determine the topological position of each new spec based on its dependencies
9. Update the document header to say "72 specification files" instead of "60"

### Key Files to Modify

- **Modify**: `src/SUMMARY.md` (add 12 entries)
- **Modify**: `src/specs/cross-reference-index.md` (add entries to all 5 sections)

### Patterns to Follow

- SUMMARY entry format: `  - [Display Title](./specs/architecture/filename.md)` with exactly 2 spaces indentation to match existing Architecture entries
- SS1 row format: `| # | [filename](./architecture/filename.md) | architecture | Primary Crate | Secondary Crate(s) |`
- SS2 entry format: `N. [Display Title](./architecture/filename.md)` or `N. [Display Title](./architecture/filename.md) (secondary)`
- SS3/SS4 row format: follow the existing table format in those sections

### Pitfalls to Avoid

- Do NOT change the numbering of existing rows in SS1. New rows are 61-72.
- Do NOT reorganize existing reading lists in SS2. Only insert new entries.
- Do NOT forget to update the total spec count in the document header.
- Do NOT place testing specs before their corresponding trait specs in reading lists.
- Do NOT miss any crate reading list. The SamplingScheme trait belongs to `cobre-stochastic`, not `cobre-sddp`.
- Do NOT add entries for files that do not yet exist. Verify all 12 files exist before updating the index.

## Testing Requirements

Not applicable -- specification document.

## Dependencies

- **Blocked By**: ticket-001 through ticket-012 (all 12 spec files must exist)
- **Blocks**: ticket-014 (crate spec updates)

## Effort Estimate

**Points**: 3
**Confidence**: High
