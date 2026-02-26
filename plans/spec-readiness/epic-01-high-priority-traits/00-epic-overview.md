# Epic 01: High-Priority Trait Formalization

## Goals

Formalize the three HIGH-priority algorithm abstraction points as trait specs with conformance test specs, following the communicator-trait.md + backend-testing.md gold standard pattern:

1. **RiskMeasure** -- Expectation and CVaR variants, cut aggregation + risk evaluation methods
2. **HorizonMode** -- Finite and Cyclic variants, successor computation + terminal detection + discount factor
3. **SamplingScheme** -- InSample, External, Historical variants, forward sampling method

## Scope

- 3 new trait spec files in `src/specs/architecture/`
- 3 new conformance test spec files in `src/specs/architecture/`
- Each trait spec: Purpose, convention blockquote, trait definition with method signatures and behavioral contracts, supporting types, dispatch mechanism, cross-references
- Each test spec: Purpose, conformance test requirements tables, variant interchangeability tests, edge case coverage
- These traits use **enum dispatch** (not generic/static dispatch like Communicator) because: (a) risk measure varies per stage, (b) horizon mode is a single global selection, (c) sampling scheme is a single global selection. Enum dispatch was the recommended approach in extension-points.md SS7.

## Tickets

| Ticket     | Title                                       | Estimated Effort |
| ---------- | ------------------------------------------- | ---------------- |
| ticket-001 | Define RiskMeasure trait spec               | 3 points         |
| ticket-002 | Define RiskMeasure conformance test spec    | 3 points         |
| ticket-003 | Define HorizonMode trait spec               | 3 points         |
| ticket-004 | Define HorizonMode conformance test spec    | 2 points         |
| ticket-005 | Define SamplingScheme trait spec            | 3 points         |
| ticket-006 | Define SamplingScheme conformance test spec | 2 points         |

## Dependencies

- None (this is the first epic)

## Completion Criteria

- All 6 files created and internally consistent
- Each trait spec includes the convention blockquote from communicator-trait.md
- Each trait spec has method contracts with preconditions/postconditions tables
- Each test spec has requirements tables (not executable code)
- Cross-references between the new specs and existing math/architecture specs are correct
