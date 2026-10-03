// Single source of the default cobre git ref (ticket-003, ADR-007).
//
// scripts/refresh-schemas.mjs and scripts/refresh-recordings.mjs each vendor
// committed content from an immutable git TAG in a `cobre` checkout; both
// import DEFAULT_COBRE_REF as their `--ref` default so the two scripts can
// never disagree on which tag they vendor from. versions.json `latest.cobre`
// mirrors this constant and is test-guarded (JSON has no comments of its own).
// This literal and versions.json `latest.cobre` are bumped together at each
// sync and must always name an EXISTING tag, never a not-yet-cut one (the
// cobre-ref test enforces equality).

export const DEFAULT_COBRE_REF = "v0.17.0";
