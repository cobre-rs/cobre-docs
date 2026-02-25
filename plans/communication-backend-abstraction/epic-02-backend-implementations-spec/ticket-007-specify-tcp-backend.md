# ticket-007 Specify TCP Backend Implementation

## Context

### Background

The TCP backend enables multi-process SDDP execution without an MPI runtime. This is the key enabler for two use cases: (1) Python multi-process SDDP without the GIL/MPI incompatibility (python-bindings.md SS7), and (2) container-friendly deployments where MPI installation is impractical. The backend uses standard TCP sockets (Rust `std::net`) with a coordinator pattern where one process manages collective operations.

### Relation to Epic

This is the third backend implementation ticket. The TCP backend is the most complex alternative backend because it must implement the full collective semantics over a network, including connection establishment, message framing, and failure detection. It targets the same collective surface as the ferrompi backend but without MPI infrastructure.

### Current State

- No TCP-based communication spec exists in the Cobre corpus
- `src/specs/hpc/communication-patterns.md` SS3.2 analyzes bandwidth requirements on 100 Gbps Ethernet (~94 ms/iteration), establishing that TCP is viable for SDDP's communication pattern
- `src/specs/interfaces/python-bindings.md` SS7.3 documents the current workaround (subprocess + CLI) for distributed Python execution
- The SDDP collective surface is small: 3 operations in the hot loop (allgatherv x2, allreduce x1), 2 at initialization (broadcast, barrier)

## Specification

### Requirements

Create the file `src/specs/hpc/backend-tcp.md` specifying the TCP-based communication backend. The spec must cover:

1. **Architecture**: Coordinator-based topology where rank 0 runs a TCP server and all ranks connect to it
2. **Connection establishment**: How workers discover the coordinator (environment variables), connect, and register their rank
3. **Collective protocols**: How each collective operation is implemented over TCP:
   - `allgatherv`: Each rank sends to coordinator; coordinator assembles and broadcasts result
   - `allreduce`: Each rank sends to coordinator; coordinator reduces and broadcasts result
   - `broadcast`: Coordinator sends to all ranks
   - `barrier`: Coordinator waits for all ranks to check in, then releases all
4. **Message framing**: Length-prefixed binary messages over TCP streams
5. **Failure handling**: Timeout-based detection, clean shutdown protocol
6. **Performance characteristics**: Expected overhead vs. MPI for SDDP's communication volumes
7. **SharedMemoryProvider**: `HeapFallback` implementation (no shared memory in TCP mode -- each rank has its own memory)
8. **Feature gating**: Available when `features = ["tcp"]` is enabled
9. **Configuration**: Environment variables for coordinator address, port, rank, and size

### Inputs/Props

| Source Document             | Relevant Sections               | What to Extract                                  |
| --------------------------- | ------------------------------- | ------------------------------------------------ |
| `communication-patterns.md` | SS2 (payloads), SS3 (bandwidth) | Data sizes, bandwidth analysis for TCP viability |
| `communication-patterns.md` | SS1.1 (operations)              | Collective operation semantics to implement      |
| `communicator-trait.md`     | SS1-SS4 (traits)                | Trait signatures to implement                    |
| `backend-selection.md`      | SS2 (per-backend config)        | Environment variable names for TCP               |
| `python-bindings.md`        | SS7 (MPI prohibition)           | Motivation for the TCP backend                   |

### Outputs/Behavior

A new markdown file at `src/specs/hpc/backend-tcp.md` containing:

1. **Purpose**: One paragraph on the TCP backend's role in enabling MPI-free multi-process SDDP
2. **SS1 Architecture**: Coordinator pattern, connection topology diagram
3. **SS2 Connection Establishment**: Environment variable configuration, connection handshake, rank registration
4. **SS3 Collective Protocols**: For each trait method, the message exchange sequence between coordinator and workers
5. **SS4 Message Framing**: Binary message format (length prefix + operation tag + payload)
6. **SS5 Failure Handling**: Timeout configuration, graceful shutdown, rank crash detection
7. **SS6 Performance Analysis**: Overhead analysis compared to MPI for SDDP's communication volumes
8. **SS7 SharedMemoryProvider**: HeapFallback (no true shared memory across TCP-connected processes)
9. **SS8 Configuration**: Complete environment variable reference
10. **Cross-References** section

### Error Handling

- Connection failure to coordinator: `CommError::ConnectionFailed` with coordinator address in context
- Rank crash during collective: `CommError::RankFailed` with failed rank ID
- Timeout on collective: `CommError::Timeout` with configurable timeout duration
- Message corruption: `CommError::ProtocolError` (length mismatch, unexpected tag)

## Acceptance Criteria

- [ ] Given the file `src/specs/hpc/backend-tcp.md` does not exist, when the ticket is completed, then the file exists
- [ ] Given the spec exists, when reading SS1, then the coordinator pattern is described with a topology diagram showing rank 0 as the TCP server and ranks 1..R-1 as clients
- [ ] Given the spec exists, when reading SS2, then the connection handshake is specified: worker connects, sends rank ID, coordinator acknowledges and confirms total rank count
- [ ] Given the spec exists, when reading SS3, then each collective operation has a step-by-step message exchange sequence (e.g., allgatherv: each rank sends data to coordinator -> coordinator assembles in rank order -> coordinator sends complete buffer to all ranks)
- [ ] Given the spec exists, when reading SS3, then the allgatherv protocol guarantees data is assembled in rank order (rank 0, rank 1, ...) for determinism
- [ ] Given the spec exists, when reading SS4, then the message format is specified: 4-byte length prefix (u32 big-endian) + 1-byte operation tag + payload bytes
- [ ] Given the spec exists, when reading SS5, then a configurable timeout (default: 60 seconds) is specified for detecting rank failures during collectives
- [ ] Given the spec exists, when reading SS6, then the performance analysis shows that for SDDP's ~587 MB/iteration on a 100 Gbps link, TCP overhead adds < 200 ms/iteration (< 5% of a typical 5-second iteration), making TCP viable for production-scale SDDP
- [ ] Given the spec exists, when reading SS7, then `HeapFallback` is specified for SharedMemoryProvider
- [ ] Given the spec exists, when reading SS8, then `COBRE_TCP_COORDINATOR`, `COBRE_TCP_PORT`, `COBRE_TCP_RANK`, `COBRE_TCP_SIZE` environment variables are documented

## Implementation Guide

### Suggested Approach

1. Create `src/specs/hpc/backend-tcp.md`
2. Write Purpose: The TCP backend enables multi-process SDDP execution using standard TCP sockets, eliminating the dependency on an MPI runtime. It uses a coordinator pattern where rank 0 runs a TCP server and all ranks connect to it. This backend is designed for container deployments and Python multi-process orchestration where MPI is unavailable or impractical.
3. For SS1, describe the architecture:
   - Coordinator (rank 0): Listens on a TCP port, accepts connections from R-1 workers
   - Workers (ranks 1..R-1): Connect to the coordinator's address
   - All collective operations flow through the coordinator (star topology)
   - This is simpler than a mesh topology and sufficient for SDDP's collective-only pattern (no point-to-point messaging)
4. For SS2, specify connection establishment:
   - Coordinator starts TCP listener on `COBRE_TCP_PORT` (default: 29500)
   - Each worker reads `COBRE_TCP_COORDINATOR` (host), `COBRE_TCP_PORT`, `COBRE_TCP_RANK` (its own rank), `COBRE_TCP_SIZE` (total ranks)
   - Handshake: worker sends `{rank, size}`, coordinator verifies and acknowledges
   - Connection remains open for the lifetime of the training run (persistent connections)
5. For SS3, specify each collective:
   - **allgatherv**: (1) Each rank sends its data to coordinator with its rank ID and count. (2) Coordinator assembles received data in rank order into a contiguous buffer. (3) Coordinator sends the complete buffer to all ranks. Total data movement: R _ send_size (uplink) + R _ total_size (downlink).
   - **allreduce**: (1) Each rank sends its data to coordinator. (2) Coordinator applies the reduction operation element-wise. (3) Coordinator sends the result to all ranks.
   - **broadcast**: (1) Root rank sends data to coordinator (or coordinator already has it if root=0). (2) Coordinator sends to all other ranks.
   - **barrier**: (1) Each rank sends a "ready" message to coordinator. (2) Coordinator waits for all R ranks. (3) Coordinator sends "go" to all ranks.
6. For SS4, define message framing:
   - Header: `[u32 big-endian length][u8 operation tag]`
   - Operation tags: ALLGATHERV_SEND=1, ALLGATHERV_RECV=2, ALLREDUCE_SEND=3, ALLREDUCE_RECV=4, BROADCAST=5, BARRIER=6, HANDSHAKE=7, ACK=8
   - Payload: raw bytes (the CommData types are `Copy` + `'static`, so they can be safely transmitted as bytes)
7. For SS5, specify failure handling
8. For SS6, compute performance overhead for SDDP at production scale
9. For SS7, specify HeapFallback
10. For SS8, document environment variables in a table
11. Add Cross-References

### Key Files to Modify

| File                           | Action                          |
| ------------------------------ | ------------------------------- |
| `src/specs/hpc/backend-tcp.md` | **CREATE** -- New spec document |

### Patterns to Follow

- **Backend spec pattern**: Follow the structure established by ticket-005 (backend-ferrompi.md)
- **Protocol specification pattern**: Use step-by-step message sequence descriptions
- **Performance analysis pattern**: Follow communication-patterns.md SS3 for bandwidth computation format

### Pitfalls to Avoid

- Do NOT implement a full peer-to-peer mesh -- the coordinator pattern is sufficient for SDDP's symmetric collective operations and is much simpler
- Do NOT specify encryption or authentication -- those are deployment concerns, not protocol concerns (use SSH tunnels or VPN for secure environments)
- Do NOT add point-to-point messaging -- SDDP only uses collectives (communication-patterns.md SS1.2)
- Do NOT add SUMMARY.md entries -- ticket-012 handles that
- Do NOT over-specify the coordinator as a bottleneck concern -- at 587 MB/iteration on 100+ Gbps networks, the coordinator can handle the traffic

## Testing Requirements

### Unit Tests

Not applicable (documentation-only ticket).

### Integration Tests

- Verify `mdbook build` succeeds

### E2E Tests

Not applicable.

## Dependencies

- **Blocked By**: ticket-001 (Communicator trait), ticket-003 (backend selection with TCP config env vars)
- **Blocks**: ticket-014 (Python multi-process uses TCP backend)

## Effort Estimate

**Points**: 5
**Confidence**: High
