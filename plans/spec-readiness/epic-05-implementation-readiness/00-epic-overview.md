# Epic 05: Implementation Readiness Assessment

## Goals

Prepare the spec corpus for actual Rust implementation by:

1. Analyzing crate dependencies and producing an implementation ordering
2. Defining the minimal viable SDDP solver based on stakeholder requirements (see below)
3. Flagging spec gaps or ambiguities that would block implementation
4. Creating an implementation ordering document developers can follow

## Minimal Viable SDDP Solver Definition (from stakeholder review)

The following requirements define what constitutes a minimal working SDDP solver. These MUST be reflected in the implementation ordering and gap inventory:

1. **Full architecture, one variant per trait**: The code must implement the full flexibility architecture (traits, dispatch, crate boundaries) but only needs ONE variant per abstraction point initially. For example: Expectation (not CVaR) for RiskMeasure, Level-1 (not LML1/Dominated) for CutSelection, Finite (not Cyclic) for HorizonMode, InSample (not External/Historical) for SamplingScheme.

2. **Real crates, real boundaries**: All crate boundaries must be respected. Data models in cobre-core, I/O via cobre-io, communication via cobre-comm, solver via cobre-solver, SDDP logic in cobre-sddp. NO stub implementations that bypass the definitive architecture — fewer cases is fine, shortcuts in architecture are not.

3. **MPI-first production binary**: The primary use case is a Rust binary compiled and invoked with `mpiexec -n N`. Python bindings (cobre-python), TUI (cobre-tui), MCP server (cobre-mcp), and generic communication backends (TCP, shared memory) are NOT needed initially. The communication layer should use MPI directly.

4. **Minimal system elements**: Only Buses, Lines, Thermals, and Hydros need to be working in the LP formulation. Other system element types can have stub insertion/extraction functions (NO-OP or error on non-empty arguments) but the code paths must exist.

5. **Constant hydro productivity**: Only the constant productivity model is needed initially. The architecture for other models should be in place.

6. **Single scenario input path**: Scenario generation should be functional but only needs one input method. The flexible cases (PAR model fitting, history-based, external override) can be deferred, but the architecture must support future extension.

7. **Training + simulation + reproducibility**: Both training and simulation modes must work. At least one cut selection strategy must be active during training. Parallel processing must be functional. Result reproducibility across runs with the same seed is required.

8. **Full output chain**: Outputs must follow the spec schemas and be produced via the correct crate (cobre-io), not ad-hoc.

## Scope

- 1 new document: `src/specs/overview/implementation-ordering.md`
- 1 new document: `src/specs/overview/spec-gap-inventory.md`
- Analysis of all 11 crates and their inter-dependencies
- Identification of the critical path for the minimal viable SDDP solver defined above

## Tickets

| Ticket     | Title                                                          | Estimated Effort |
| ---------- | -------------------------------------------------------------- | ---------------- |
| ticket-019 | Create implementation ordering document                        | 4 points         |
| ticket-020 | Create spec gap inventory                                      | 3 points         |
| ticket-021 | Update SUMMARY.md and cross-reference-index for readiness docs | 2 points         |

## Dependencies

- Depends on Epic 04 (consistency pass must complete before assessing readiness -- no point assessing a corpus with broken references)
- ticket-021 must come after tickets 019 and 020

## Completion Criteria

- Implementation ordering document provides a concrete crate build sequence
- Spec gap inventory identifies all open questions, ambiguities, and missing information that would block implementation
- Both documents are linked from SUMMARY.md and cross-reference-index.md
