# Epic 04: Python Multi-Process Execution Specification

## Goals

1. Update python-bindings.md to document multi-process SDDP execution via TCP or shm backends
2. Define the Python-side API for launching and coordinating multi-worker SDDP training
3. Update the MPI prohibition rationale to clarify that the prohibition is on MPI specifically, not on distributed execution
4. Document the interaction between Python's multiprocessing and the Rust communication backends

## Scope

This epic primarily modifies `src/specs/interfaces/python-bindings.md` with new sections for multi-process execution. It may also add a brief note to `src/specs/interfaces/mcp-server.md` about potential multi-process MCP execution.

## Tickets

| Ticket     | Title                                                        | Status  | Detail Level |
| ---------- | ------------------------------------------------------------ | ------- | ------------ |
| ticket-014 | Add multi-process execution sections to python-bindings.md   | pending | Outline      |
| ticket-015 | Specify Python worker coordination API                       | pending | Outline      |
| ticket-016 | Update MCP server spec for optional multi-process capability | pending | Outline      |

## Dependencies

- **Blocked By**: Epic 02 (TCP and shm backend specs needed), Epic 03 (refactored specs provide the trait context)
- **Blocks**: Epic 05 (testing spec covers Python multi-process scenarios)

## Success Criteria

- Python bindings spec documents at least one in-process multi-worker execution path
- The GIL/MPI prohibition rationale is preserved but clarified: MPI is prohibited, not distributed execution
- A concrete Python code example shows multi-process SDDP training without subprocess
- The MCP server spec acknowledges multi-process capability as a future option
