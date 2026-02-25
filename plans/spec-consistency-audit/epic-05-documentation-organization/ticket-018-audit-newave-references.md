# ticket-018 Audit and Update NEWAVE/CEPEL References

> **[OUTLINE]** This ticket requires refinement before execution.
> It will be refined with learnings from earlier epics.

## Objective

Review all 31 files that reference NEWAVE/CEPEL/DECOMP/DESSEM and apply the keep/update/remove policy. Strategic positioning references and domain modeling concepts stay. File format specifics (HIDR.DAT, TERM.DAT, CONFHD.DAT) and parser documentation (cobre-io NEWAVE descriptions) are cleaned up or deferred.

## Anticipated Scope

- **Files likely to be modified**:
  - `src/introduction.md` line 21 — update "Parsers for NEWAVE (CEPEL) file formats" to defer the claim
  - `src/crates/overview.md` lines 23, 41 — remove or defer NEWAVE parser mention in cobre-io description
  - `src/contributing.md` line 111 — replace "NEWAVE HIDR.DAT field mapping" example with a non-NEWAVE example
- **Files to verify (keep references)**:
  - `src/introduction.md` lines 21, 44 (strategic positioning)
  - `src/reference/glossary.md` lines 93-104 (ecosystem definitions)
  - `src/reference/bibliography.md` line 51-52 (CEPEL technical docs)
  - `src/specs/data-model/input-system-entities.md` (CEPEL modeling concepts)
  - `src/specs/data-model/penalty-system.md` (CEPEL dead-volume filling)
  - `src/specs/data-model/internal-structures.md` (CEPEL dead-volume filling)
  - `src/specs/math/hydro-production-models.md` (CEPEL/Portuguese terminology)
  - `src/specs/overview/notation-conventions.md` ("NEWAVE branching factor")
  - `src/specs/deferred.md` (CEPEL PAR(p)-A variant)
  - `src/specs/overview/design-principles.md` (CEPEL advanced flow modeling)
  - `src/specs/data-model/input-hydro-extensions.md` ("Legacy system migration" use case)
  - `src/specs/data-model/input-constraints.md` (CEPEL advanced downstream flow)
- **Key decisions needed**: Exact wording for deferred claims in `introduction.md` and `crates/overview.md`; what replacement example to use in `contributing.md`
- **Open questions**:
  - What is the correct replacement wording for the NEWAVE parser claim in `introduction.md`? Should it say "planned" or simply omit the parser mention?
  - For `crates/overview.md`, should the cobre-io description mention "legacy system file formats" generically or remove the parser mention entirely?
  - Are there any additional files beyond the known 31 that reference NEWAVE/CEPEL?

## Dependencies

- **Blocked By**: ticket-017 (migration stubs should be removed first so the reference audit reflects the final state)
- **Blocks**: None

## Effort Estimate

**Points**: 3
**Confidence**: Low (will be re-estimated during refinement)
