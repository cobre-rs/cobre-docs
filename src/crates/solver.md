# cobre-solver

<span class="status-experimental">experimental</span>

## Overview

cobre-solver provides the backend-agnostic LP solver interface used by the SDDP
training and simulation loops. It defines a solver trait contract, a standardized
LP layout convention (column and row regions), and the workspace lifecycle that
manages thread-local solver instances. Every LP operation in Cobre -- building
stage templates, patching scenario data, solving, and extracting duals -- flows
through this layer.

Two solver backends are provided as first-class implementations: HiGHS (via its
C API) and CLP (via C API with thin C++ wrappers). The active backend is selected
at compile time to eliminate virtual dispatch overhead on the hot path. Both
implementations satisfy the same trait contract and are validated against
identical test suites, ensuring that the SDDP algorithm is genuinely
solver-agnostic.

The workspace pattern gives each OpenMP thread an exclusive solver instance with
pre-allocated solution buffers, a per-stage basis cache for warm-starting, and
NUMA-aware memory placement. Workspaces are created once at initialization and
reused across all iterations, eliminating hot-path allocations. The cut pool
integration path allows the backward pass to inject new Benders cuts into the
LP via batch row addition, keeping the solver in sync with the evolving future
cost function approximation.

## Key Concepts

- **StageTemplate and StageIndexer ownership** -- `cobre-solver` owns the type
  definitions for `StageTemplate` (the pre-assembled structural LP in CSC form)
  and `StageIndexer` (the read-only index map for LP primal/dual positions).
  These types encode LP-specific structure (variable counts, constraint counts,
  coefficient offsets) that is not meaningful to other crates. Construction of
  `StageTemplate` is performed by `cobre-sddp`; `cobre-solver` receives it as
  an opaque data holder and bulk-loads its CSC arrays into the underlying LP
  solver. See [Solver Abstraction SS11.1](../specs/architecture/solver-abstraction.md)
  and [Training Loop SS5.5](../specs/architecture/training-loop.md).

- **LP layout convention** -- A fixed column/row ordering that places state
  variables (reservoir volumes, AR lags) in a contiguous prefix and groups
  cut-relevant constraints at the top of the row vector. This enables
  slice-based state transfer, fast dual extraction, and efficient cut injection.
  See [Solver Abstraction](../specs/architecture/solver-abstraction.md).

- **Solver trait interface** -- The unified contract that both HiGHS and CLP
  implement: load model, patch RHS, solve, extract primals/duals/reduced costs,
  add cut rows, and manage basis. Compile-time selection via generics avoids
  dynamic dispatch.
  See [HiGHS Implementation](../specs/architecture/solver-highs-impl.md) and
  [CLP Implementation](../specs/architecture/solver-clp-impl.md).
  See also [Solver Interface Trait](../specs/architecture/solver-interface-trait.md) for the formal trait definition, method contracts, and error types.

- **Solver workspaces** -- Thread-local infrastructure containing the solver
  instance, pre-allocated buffers, per-stage basis cache, and NUMA node
  assignment. Each workspace is padded to cache-line boundaries to prevent
  false sharing.
  See [Solver Workspaces](../specs/architecture/solver-workspaces.md).

- **Basis warm-starting** -- Each workspace maintains one basis per stage. The
  basis from solving stage $t$ in iteration $i$ seeds stage $t$ in iteration
  $i+1$, reducing simplex iterations. Bases are serialized to FlatBuffers for
  checkpoint/resume.

- **Cut pool integration** -- New Benders cuts generated during the backward
  pass are injected into the LP bottom row region via batch `addRows`. Cuts are
  stored in physical units; scaling is applied at solve time.

## Status

cobre-solver is in the **design phase**. The solver abstraction, workspace, and
backend specs linked above are stable and serve as the authoritative reference
for implementation. No Rust code has been published yet; the crate placeholder
exists in the Cargo workspace to reserve the module boundary.
