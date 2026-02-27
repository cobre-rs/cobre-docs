# ticket-027 Evaluate rkyv Serialization Fitness for System Broadcast

## Context

### Background

GAP-003 adopted `rkyv` (version 0.8+) as the serialization format for the initialization-phase MPI broadcast of the `System` struct. The decision was documented in `input-loading-pipeline.md` SS6.1--6.4 and justified primarily by zero-copy deserialization, which avoids double-allocation overhead on worker ranks. However, this adoption was a design decision made during spec authoring without quantitative evaluation of the derive macro burden, binary size impact, or comparison against alternative serialization libraries already in the dependency tree (FlatBuffers for policy persistence) or the native-endian `#[repr(C)]` pattern already used for hot-path cut wire format.

Condition C-13 from the readiness verdict requires an evidence-based evaluation of whether rkyv remains the optimal choice, given that: (a) the broadcast is a once-per-execution operation where zero-copy deserialization provides minimal value, (b) all entity types from Epic 05 (ticket-018) must derive `rkyv::Archive + Serialize + Deserialize`, adding compile-time and API surface burden, and (c) alternatives like `postcard` or FlatBuffers (already a dependency) might achieve the same result with less complexity.

### Relation to Epic

This ticket is the first of three in Epic 07 (Serialization Evaluation and Output Writer API). It is independent of the other two tickets (028 and 029), which focus on the simulation result type and output writer API respectively. The rkyv evaluation informs whether `input-loading-pipeline.md` SS6.1 needs to be updated, but the output writer API (ticket-029) uses Parquet and FlatBuffers, not rkyv.

### Current State

- `input-loading-pipeline.md` SS6.1 specifies rkyv 0.8+ as the serialization format for MPI broadcast
- SS6.2 lists all types requiring `rkyv::Archive + Serialize + Deserialize` derives (22+ types)
- SS6.3 documents the 16-byte alignment requirement for rkyv archived data
- SS6.4 acknowledges that rkyv lacks schema evolution but deems this acceptable for in-memory broadcast
- Entity struct definitions from Epic 05 (ticket-018) are in `internal-structures.md` SS1.1--SS12
- The cut wire format in `cut-management-impl.md` SS4.2a uses `#[repr(C)]` native-endian byte reinterpretation
- Policy persistence uses FlatBuffers (`binary-formats.md` SS3)
- GAP-003 resolution path says "rkyv zero-copy serialization adopted" -- this ticket validates that adoption

## Specification

### Requirements

1. Produce an evidence-based evaluation report comparing rkyv against three alternatives for the System broadcast use case
2. The report must cover 5 evaluation dimensions: (a) zero-copy value for once-per-execution operations, (b) derive macro burden on all entity types, (c) ecosystem/dependency overlap with FlatBuffers, (d) maintenance status and crate maturity, (e) concrete recommendation with rationale
3. If the recommendation is to REPLACE rkyv, also update `input-loading-pipeline.md` SS6.1 to specify the replacement format and adjust SS6.2--6.4 accordingly
4. If the recommendation is to KEEP rkyv, no spec changes are needed (document the reasoning in the report)

### Inputs

- `src/specs/architecture/input-loading-pipeline.md` SS6.1--6.4 (current rkyv specification)
- `src/specs/data-model/internal-structures.md` SS1--SS12 (entity struct definitions requiring derives)
- `src/specs/data-model/binary-formats.md` SS3 (FlatBuffers for policy -- already a dependency)
- `src/specs/architecture/cut-management-impl.md` SS4.2a (native-endian `#[repr(C)]` wire format)

### Outputs

- Report file: `plans/implementation-readiness-audit/epic-07-serialization-eval-and-output-api/report-027-rkyv-evaluation.md`
- Optionally: updated `src/specs/architecture/input-loading-pipeline.md` (only if rkyv is NOT recommended)

### Error Handling

Not applicable (this is a research/evaluation ticket, not a code change).

### Out of Scope

- Evaluating serialization for hot-path operations (cut wire format, state transfer) -- those use `#[repr(C)]` and are not in question
- Evaluating serialization for policy persistence -- that uses FlatBuffers and is not in question
- Evaluating serialization for output writing -- that uses Parquet/JSON/CSV and is covered by ticket-029
- Implementing any serialization code -- this is a spec-level evaluation only

## Acceptance Criteria

- [ ] Given the report file exists at `plans/implementation-readiness-audit/epic-07-serialization-eval-and-output-api/report-027-rkyv-evaluation.md`, when opened, then it contains sections for all 4 alternatives evaluated: rkyv, postcard, manual native-endian (`#[repr(C)]`), and FlatBuffers
- [ ] Given the report's "Zero-Copy Value" section, when read, then it contains a quantitative argument about the broadcast frequency (once per execution), the estimated System struct size at production scale (160 hydros, 200 thermals, 120 stages), and the marginal benefit of zero-copy vs. standard deserialization for a payload of that size
- [ ] Given the report's "Derive Macro Burden" section, when read, then it enumerates every type from `internal-structures.md` SS6.2 that requires rkyv derives (minimum 22 types) and compares the derive annotation count against the equivalent for each alternative
- [ ] Given the report's "Ecosystem Overlap" section, when read, then it addresses whether reusing FlatBuffers (already required for policy persistence) eliminates the need for rkyv as a separate dependency
- [ ] Given the report's "Maintenance Status" section, when read, then it documents the last release date of rkyv, its GitHub activity level, and compares this against postcard's maintenance status
- [ ] Given the report's "Recommendation" section, when read, then it contains exactly one concrete recommendation (KEEP rkyv or REPLACE with [alternative]) with a summary rationale of 3 or fewer sentences
- [ ] Given the recommendation is REPLACE, when `input-loading-pipeline.md` is checked, then SS6.1 specifies the replacement format and SS6.2--6.4 are updated to reflect the new derive requirements, alignment constraints, and versioning scope
- [ ] Given the recommendation is KEEP, when `input-loading-pipeline.md` is checked, then SS6.1--6.4 remain unchanged

## Implementation Guide

### Suggested Approach

1. Read `input-loading-pipeline.md` SS6.1--6.4 to understand the current rkyv specification in full
2. Read `internal-structures.md` to inventory all types requiring serialization derives (SS6.2 lists them explicitly)
3. Read `binary-formats.md` SS3 to understand the FlatBuffers dependency already in the project
4. Read `cut-management-impl.md` SS4.2a to understand the `#[repr(C)]` native-endian pattern
5. Evaluate each of the 4 alternatives against the 5 dimensions listed in the Requirements
6. Write the report with structured sections for each dimension
7. Make the recommendation based on the evidence
8. If REPLACE: update `input-loading-pipeline.md` SS6.1--6.4

### Key Files to Read

- `src/specs/architecture/input-loading-pipeline.md` (SS6.1--6.4)
- `src/specs/data-model/internal-structures.md` (SS1--SS12 for entity types)
- `src/specs/data-model/binary-formats.md` (SS3 for FlatBuffers)
- `src/specs/architecture/cut-management-impl.md` (SS4.2a for native-endian wire format)

### Key Files to Create or Modify

- **Create**: `plans/implementation-readiness-audit/epic-07-serialization-eval-and-output-api/report-027-rkyv-evaluation.md`
- **Modify (conditional)**: `src/specs/architecture/input-loading-pipeline.md` (only if recommendation is REPLACE)

### Patterns to Follow

- Use the same structured report format as report-015-data-traceability.md: numbered sections with verdicts per evaluation dimension, followed by a consolidated recommendation
- Quantitative arguments over qualitative: estimate production-scale System struct size in bytes, enumerate exact type counts, cite specific crate.io release dates

### Pitfalls to Avoid

- Do not conflate the broadcast serialization use case with hot-path serialization -- the broadcast happens once at initialization, not in the training loop
- Do not recommend removing rkyv solely on maintenance concerns if the zero-copy benefit is material; conversely, do not keep rkyv solely because it was already specified if the evidence shows marginal benefit with significant cost
- Do not modify any files in `src/specs/` beyond `input-loading-pipeline.md` -- even if rkyv is replaced, the downstream effects (e.g., removing rkyv derive annotations from `internal-structures.md` entity types) are implementation-phase tasks, not spec edits for this ticket
- If recommending FlatBuffers as the replacement, address the "FlatBuffers requires a schema file for each type" concern -- the System struct is complex and deeply nested, which is not FlatBuffers' strength

## Testing Requirements

### Verification

- The report exists and contains all required sections
- Each evaluation dimension has a concrete, evidence-based argument (not speculation)
- The recommendation is clear, actionable, and consistent with the evidence presented
- If spec changes were made, `mdbook build` passes without new errors

## Dependencies

- **Blocked By**: ticket-018-define-entityid-and-entity-structs.md (entity struct definitions determine the derive macro burden -- COMPLETED)
- **Blocks**: None (recommendation is advisory; independent of tickets 028 and 029)

## Effort Estimate

**Points**: 2
**Confidence**: High (the scope is well-defined: read 4 spec files, evaluate 4 alternatives, write a report)
