# cobre-python

<span class="status-experimental">experimental</span>

## Overview

cobre-python is a PyO3-based cdylib crate that exposes the Cobre solver as a
Python module (`import cobre`). It provides programmatic access to case loading,
validation, training, simulation, and result inspection from Python scripts,
Jupyter notebooks, and orchestration frameworks.

The crate operates in **single-process mode only** -- it MUST NOT initialize
MPI or depend on `ferrompi`. This is a hard constraint arising from the
fundamental GIL/MPI incompatibility: MPI_THREAD_MULTIPLE requires all threads
to be able to make MPI calls, but the GIL serializes Python threads, creating
deadlock risk. Python users needing distributed execution launch `mpiexec cobre`
as a subprocess.

The GIL is released during all Rust computation via `py.allow_threads()`,
allowing OpenMP threads within `cobre-sddp` to run at full parallelism. No
Python callbacks are permitted in the SDDP hot loop -- all customization is
via configuration.

## Key Concepts

- **PyO3 module structure** -- The `cobre` Python module exposes classes and
  functions mapped from four source crates: `cobre-core` (entity objects),
  `cobre-io` (case loading, validation), `cobre-stochastic` (PAR model,
  scenario sampling), and `cobre-sddp` (training, simulation, policy access).
  See [Python Bindings](../specs/interfaces/python-bindings.md).

- **GIL management contract** -- Five-point contract: (1) GIL acquired to
  receive call and validate arguments, (2) GIL released before Rust computation,
  (3) no Rust thread within OpenMP region acquires GIL, (4) GIL reacquired for
  result conversion, (5) no Python callbacks in hot loop.
  See [Python Bindings](../specs/interfaces/python-bindings.md).

- **Zero-copy data paths** -- NumPy arrays for PAR parameters and scenario
  noise via the PyO3 numpy crate. Apache Arrow FFI for simulation result
  tables, enabling zero-copy consumption via Polars or Pandas.
  See [Python Bindings](../specs/interfaces/python-bindings.md).

- **Single-process execution** -- OpenMP threads for intra-process parallelism
  only. No MPI. The `cobre-sddp` library operates in single-rank mode with
  all scenarios on one process.
  See [Python Bindings](../specs/interfaces/python-bindings.md).

- **Error handling** -- Rust error kinds map to a Python exception hierarchy
  rooted at `cobre.CobreError`. Structured error context (`kind`, `message`,
  `context`, `suggestion`) is preserved in exception attributes.
  See [Python Bindings](../specs/interfaces/python-bindings.md).

## Dependencies

```
cobre-python
  +-- cobre-sddp
  |     +-- cobre-core
  |     +-- cobre-stochastic
  |     +-- cobre-solver
  +-- cobre-io
  |     +-- cobre-core
  +-- cobre-core
```

Build dependencies include PyO3, `numpy` (PyO3 crate), and `arrow` (for
Arrow FFI). cobre-python does NOT depend on `ferrompi` or `cobre-cli`.

## Status

cobre-python is in the **design phase**. The Python bindings spec linked above
is the authoritative reference for implementation. No Rust code has been
published yet; the crate placeholder exists in the Cargo workspace to
reserve the module boundary.
