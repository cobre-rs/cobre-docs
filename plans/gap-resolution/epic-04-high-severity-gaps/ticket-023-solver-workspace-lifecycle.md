# ticket-023: Specify Solver Workspace Lifecycle (GAP-036)

## Context

### Background

The Solver Workspaces spec (`solver-workspaces.md`) defines thread-local solver instances with per-stage basis caches, NUMA-aware initialization, and a workspace manager, but the spec was not in the original critical reading list for the gap inventory. GAP-036 flags the need to verify that the workspace lifecycle is fully specified and consistent with the threading model. Upon detailed review, the spec already covers creation (SS1.3), reuse across iterations (SS1.4-1.5), thread safety invariants (SS1.8), and the workspace manager (SS1.7). What is missing is an explicit lifecycle summary that ties these scattered sections together and documents the destruction/cleanup phase.

### Relation to Epic

This ticket resolves GAP-036 (High severity). It adds a consolidated lifecycle subsection to `solver-workspaces.md` that documents the complete creation-reuse-destruction lifecycle in one place, and verifies consistency with the threading model (rayon/OpenMP) described in Hybrid Parallelism SS1.

### Current State

- **Solver Workspaces SS1.3**: NUMA-aware initialization sequence -- each thread creates its own workspace within a parallel region, pins to its NUMA node, and stores the workspace at `workspace[thread_id]`.
- **Solver Workspaces SS1.4**: Stage solve workflow -- 7-step sequence (load template, add cuts, patch scenario, set basis, solve, extract, update stats). Steps 1-2 are skipped for within-stage solves.
- **Solver Workspaces SS1.5**: Warm-start eligibility -- per-stage basis cache reused across iterations.
- **Solver Workspaces SS1.7**: Workspace manager -- creates one workspace per thread at initialization, provides indexed access by thread ID, structurally immutable after initialization.
- **Solver Workspaces SS1.8**: Thread safety invariants table (shared vs thread-local data).
- **Hybrid Parallelism SS1**: OpenMP threading model with rayon as the Rust implementation. Thread count matches NUMA topology. Thread pool is created once at program start.
- **Training Loop SS4.3**: Thread-trajectory affinity -- each thread owns complete trajectories, preserving cache locality.

The lifecycle is well-specified across these sections, but there is no single "lifecycle summary" subsection. The destruction phase (freeing solver instances and buffers) is undocumented -- the spec describes creation and reuse but not cleanup.

## Specification

### Requirements

1. Add a new subsection SS1.3a "Workspace Lifecycle Summary" to `solver-workspaces.md` immediately after SS1.3.
2. Document the four lifecycle phases in a single table:
   - **Creation** (once, at training start): Within a parallel region, each thread creates its workspace on its NUMA node (SS1.3). The workspace manager allocates the workspace array. After creation, the workspace array is structurally immutable.
   - **Per-iteration reuse** (many times, across all iterations): Each thread reuses its workspace for every LP solve. The per-stage basis cache (SS1.5) carries warm-start state across iterations. Solution buffers and RHS patch buffers are overwritten each solve -- no per-iteration allocation.
   - **Per-stage transition** (many times, within each iteration): When transitioning between stages, the workspace executes the full 7-step solve sequence (SS1.4). Within a stage, steps 1-2 are skipped. This is the hot path.
   - **Destruction** (once, at training end): Solver instances are freed via their C API destructor (`Highs_destroy()` for HiGHS, `Clp_deleteModel()` for CLP). All buffers (solution, RHS patch, basis cache) are deallocated. The workspace manager drops the workspace array. Destruction runs sequentially on the main thread after the last parallel region completes.
3. Add a note on the threading model interaction: the workspace design assumes a **fixed-size thread pool** (rayon or equivalent) that is created at program start and persists until program exit. Workspaces are indexed by `thread_id` from this fixed pool. If rayon's work-stealing moves a task to a different thread, the task must still access the workspace indexed by the thread's `rayon::current_thread_index()`, not by any task-local state. This is the key correctness invariant -- each thread always uses its own workspace, regardless of which task it is executing.
4. Add a note that workspace memory is NOT freed between the training phase and the simulation phase. The same workspaces are reused for simulation forward passes. This avoids re-initialization overhead and preserves basis caches (which remain useful for simulation solves at the same stages).
5. Add a cross-reference to Hybrid Parallelism SS1 (threading model), Training Loop SS4.3 (thread-trajectory affinity), and CLI and Lifecycle SS5.2 (phase boundaries for Initialization and Finalize).
6. Update `spec-gap-inventory.md` Section 7 Resolution Log to mark GAP-036 as resolved.

### Inputs/Props

- Solver Workspaces SS1.3 (creation), SS1.4 (solve workflow), SS1.5 (warm-start), SS1.7 (workspace manager)
- Hybrid Parallelism SS1 (threading model)
- CLI and Lifecycle SS5.2 (phase boundaries)

### Outputs/Behavior

A consolidated lifecycle subsection that an implementer can read to understand the full workspace lifetime without cross-referencing 5 different subsections.

### Error Handling

Not applicable -- specification document.

## Acceptance Criteria

- [ ] Given `solver-workspaces.md`, when looking after SS1.3, then a subsection SS1.3a "Workspace Lifecycle Summary" exists.
- [ ] Given SS1.3a, when reading the lifecycle table, then exactly four phases are documented: Creation, Per-iteration reuse, Per-stage transition, Destruction.
- [ ] Given SS1.3a, when reading the Destruction phase, then it names the solver C API destructors (`Highs_destroy()`, `Clp_deleteModel()`) and states destruction runs sequentially on the main thread.
- [ ] Given SS1.3a, when reading the threading model note, then it states the fixed-size thread pool invariant and references `rayon::current_thread_index()`.
- [ ] Given SS1.3a, when reading the simulation reuse note, then it states workspaces are NOT freed between training and simulation phases.
- [ ] Given `spec-gap-inventory.md` Section 7, when reading the Resolution Log, then GAP-036 has a resolution row.
- [ ] Given `mdbook build`, when building after edits, then no broken links or build errors are produced.

## Implementation Guide

### Suggested Approach

1. Open `src/specs/architecture/solver-workspaces.md` and locate SS1.3 (NUMA-Aware Initialization).
2. Insert subsection `### 1.3a Workspace Lifecycle Summary` after SS1.3.
3. Write a 4-row lifecycle table (Phase, Frequency, Description, Relevant Sections).
4. Add the threading model interaction note referencing `rayon::current_thread_index()`.
5. Add the simulation reuse note.
6. Add cross-references to Hybrid Parallelism SS1, Training Loop SS4.3, CLI and Lifecycle SS5.2.
7. Update `src/specs/overview/spec-gap-inventory.md` Section 7 Resolution Log.
8. Run `mdbook build`.

### Key Files to Modify

- `src/specs/architecture/solver-workspaces.md` -- Add SS1.3a lifecycle summary subsection (primary edit)
- `src/specs/overview/spec-gap-inventory.md` -- Add GAP-036 resolution row to Section 7 table

### Patterns to Follow

- **Subsection numbering**: "1.3a" pattern, consistent with "2.1a", "2.1b", "2.2a", "2.3a", "4.2a", "5.2a" established across the spec corpus.
- **Lifecycle table format**: Use a table with columns: Phase, Frequency, Description, Relevant Sections. Similar to the thread safety invariants table in SS1.8.
- **Resolution Log row**: Follow existing format in `spec-gap-inventory.md` Section 7.

### Pitfalls to Avoid

- Do NOT restructure the existing solver workspaces spec. The lifecycle summary is an additive subsection that consolidates and cross-references existing content, not a reorganization.
- Do NOT specify the rayon API in detail. The note references `rayon::current_thread_index()` as the key invariant but does not prescribe rayon-specific configuration.
- Do NOT add a "workspace pool" alternative. The spec already documents the rejected pool pattern in SS1.7's note. This ticket is about documenting the existing design's lifecycle, not reconsidering it.
- Do NOT edit any files beyond the two listed above.

## Testing Requirements

### Unit Tests

Not applicable -- specification document.

### Integration Tests

Not applicable.

### E2E Tests (if applicable)

- Run `mdbook build` to verify no broken links.

## Dependencies

- **Blocked By**: ticket-008 (LP layout determines workspace LP structure -- completed)
- **Blocks**: None

## Effort Estimate

**Points**: 1
**Confidence**: High
