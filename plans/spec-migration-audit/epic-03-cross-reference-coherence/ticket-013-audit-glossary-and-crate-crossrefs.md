# ticket-013 Audit Glossary Coverage and Crate Documentation Cross-Reference Accuracy

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Verify two things: (1) that the glossary at `src/reference/glossary.md` defines every key technical term that appears in the math and architecture specs without being self-explanatory to a power systems engineer, and (2) that the cross-references within the 7 crate documentation pages (`src/crates/`) are semantically accurate — i.e., when a crate doc says "See [Training Loop](../specs/architecture/training-loop.md)", the training-loop spec actually describes the behavior claimed.

The glossary already exists with sections for Power System, Hydro Generation, Thermal Generation, Stochastic Modeling, SDDP Algorithm, and Risk Measures terms. This audit checks for gaps — terms used in specs that are not in the glossary.

## Anticipated Scope

- **Files likely to be modified**: Potentially `src/reference/glossary.md` if missing terms are found; read-only for all other files
- **Key decisions needed**:
  - After epics 01-02 complete, what specific technical terms appear in the math specs that are absent from the glossary?
  - Are there Brazilian/Portuguese power system terms used in specs (e.g., in `output-schemas.md`) that should be in the glossary for completeness?
- **Open questions**:
  - What is the threshold for a term being "key technical" vs domain-obvious? (e.g., "MW" probably doesn't need a glossary entry, but "CMO" might)
  - Are there terms specific to CEPEL/NEWAVE methodology that appear in the data model specs and need glossary coverage?
  - Does the glossary need to cover programming/implementation terms (e.g., "FlatBuffers", "Parquet") or just domain terms?

## Dependencies

- **Blocked By**: ticket-006 (crate doc audit), ticket-003 (math spec content verification)
- **Blocks**: ticket-017 (remediation includes glossary additions)

## Effort Estimate

**Points**: 2
**Confidence**: Low (will be re-estimated during refinement)
