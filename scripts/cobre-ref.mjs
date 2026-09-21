// Single source of the default cobre git ref (ticket-003, ADR-007).
//
// scripts/refresh-schemas.mjs and scripts/refresh-recordings.mjs each vendor
// committed content from an immutable git TAG in a `cobre` checkout; both
// import DEFAULT_COBRE_REF as their `--ref` default so the two scripts can
// never disagree on which tag they vendor from. Epic 12 ticket-028 (at-tag
// finalization) bumps this ONE literal to the next tag when cobre cuts it —
// it must always name an EXISTING tag, never a not-yet-cut one.

export const DEFAULT_COBRE_REF = "v0.15.0";
