# Spec Gap Inventory

This document tracks known specification gaps — areas where the spec corpus does not yet fully describe implemented behavior or where known divergences between spec and code exist.

Entries are organized by domain and record the gap description, affected spec file, corresponding code location, and resolution status.

> **Last audit**: 2026-04-09 (assessment report, 10 rounds, 73 findings)

## Summary

| Domain        | Resolved | Remaining | Notes                                   |
| ------------- | -------- | --------- | --------------------------------------- |
| Architecture  | —        | 0         | Synced via assessment report 2026-04-09 |
| Data Model    | —        | 0         | Synced via assessment report 2026-04-09 |
| HPC           | —        | 0         | Synced via assessment report 2026-04-09 |
| Interfaces    | —        | 0         | Synced via assessment report 2026-04-09 |
| Math          | —        | 0         | Synced via assessment report 2026-04-09 |
| Configuration | —        | 0         | Synced via assessment report 2026-04-09 |
| Overview      | —        | 0         | Synced via assessment report 2026-04-09 |

## Tracking Process

1. Gaps are identified via adversarial assessment (attacker/defender rounds against source code ground truth).
2. Findings are recorded in `assessment-report.md` at the repository root.
3. Fixes are applied to spec files and verified against the code.
4. This inventory is updated after each assessment cycle.

For the detailed findings list, severities, and round-by-round breakdown, see the assessment report.

## Known Permanent Gaps

These are intentional divergences where the spec documents planned or reserved behavior:

| Spec File             | Section        | Description                                           | Reason                               |
| --------------------- | -------------- | ----------------------------------------------------- | ------------------------------------ |
| solver-clp-impl.md    | Entire file    | CLP solver implementation spec; no code exists        | Design reservation for second solver |
| horizon-mode-trait.md | Cyclic variant | Cyclic horizon mode variant shown but not implemented | Intentional design reservation       |
| python-bindings.md    | SS2.5–SS2.10   | Class-based Python API (PARModel, OpeningTree, etc.)  | Planned future API                   |
