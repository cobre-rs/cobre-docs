# Specification Documentation Deep Consistency Audit

## Overview

This plan performs a deep consistency audit of the Cobre specification corpus (50 documents, ~14,588 lines of markdown). It verifies internal mathematical consistency across specs, validates external bibliography references, hardens the production scale reference with traceable sizing data, builds a defensible wall-clock time model for the production target (50 iterations, 192 forward passes, AMD EPYC, under 2 hours), reviews documentation organization with NEWAVE cleanup, and assesses the impact of a future PyO3 Python API on the spec corpus.

## Tech Stack

- Markdown documentation in mdBook
- Python LP sizing calculator (`~/git/powers/scripts/lp_sizing.py`)
- SDDP domain expertise for mathematical auditing

## Epics

| Epic    | Name                                         | Tickets      | Status    |
| ------- | -------------------------------------------- | ------------ | --------- |
| Epic 01 | Internal Formula & Value Consistency         | 5 (detailed) | completed |
| Epic 02 | External Reference Verification              | 4 (detailed) | pending   |
| Epic 03 | Production Scale Reference Hardening         | 3 (outline)  | pending   |
| Epic 04 | Wall-Clock Time Model & Performance Targets  | 3 (outline)  | pending   |
| Epic 05 | Documentation Organization & NEWAVE Deferral | 3 (outline)  | pending   |
| Epic 06 | PyO3 Python API Impact Assessment            | 3 (outline)  | pending   |

## Progress Tracking

| Ticket     | Title                                                                      | Epic    | Status    | Detail Level |
| ---------- | -------------------------------------------------------------------------- | ------- | --------- | ------------ |
| ticket-001 | Audit notation-conventions symbol usage in math specs (part 1)             | epic-01 | completed | Detailed     |
| ticket-002 | Audit notation-conventions symbol usage in math specs (part 2)             | epic-01 | completed | Detailed     |
| ticket-003 | Audit parameter value consistency across overview and math specs           | epic-01 | completed | Detailed     |
| ticket-004 | Audit behavioral description consistency across architecture and HPC specs | epic-01 | completed | Detailed     |
| ticket-005 | Apply fixes for Epic 01 findings                                           | epic-01 | completed | Detailed     |
| ticket-006 | Verify bibliography entry metadata (academic papers)                       | epic-02 | pending   | Detailed     |
| ticket-007 | Verify bibliography entry metadata (software and web references)           | epic-02 | pending   | Detailed     |
| ticket-008 | Audit citation usage context across specs                                  | epic-02 | pending   | Detailed     |
| ticket-009 | Apply fixes for Epic 02 findings                                           | epic-02 | pending   | Detailed     |
| ticket-010 | Cross-check sizing calculator output against spec values                   | epic-03 | pending   | Outline      |
| ticket-011 | Update forward pass count from 200 to 192                                  | epic-03 | pending   | Outline      |
| ticket-012 | Add traceability annotations to production-scale-reference                 | epic-03 | pending   | Outline      |
| ticket-013 | Build forward and backward pass timing model                               | epic-04 | pending   | Outline      |
| ticket-014 | Model synchronization and communication overhead                           | epic-04 | pending   | Outline      |
| ticket-015 | Update performance target language in specs                                | epic-04 | pending   | Outline      |
| ticket-016 | Review spec organization coherence                                         | epic-05 | pending   | Outline      |
| ticket-017 | Remove NEWAVE migration section                                            | epic-05 | pending   | Outline      |
| ticket-018 | Audit and update NEWAVE/CEPEL references                                   | epic-05 | pending   | Outline      |
| ticket-019 | Define Python API surface from existing specs                              | epic-06 | pending   | Outline      |
| ticket-020 | Assess impact on existing spec designs                                     | epic-06 | pending   | Outline      |
| ticket-021 | Draft cobre-python specification outline                                   | epic-06 | pending   | Outline      |
