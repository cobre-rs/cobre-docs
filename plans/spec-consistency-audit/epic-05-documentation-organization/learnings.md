# Epic 05 Learnings: Documentation Organization & NEWAVE Deferral

**Epic**: epic-05-documentation-organization
**Completed**: 2026-02-25
**Scope**: Spec organization coherence review (50 specs, 6 sections); NEWAVE migration section deletion (6 files); NEWAVE/CEPEL/DECOMP/DESSEM reference audit (42 occurrences across 31 files)

---

## 1. Patterns Established

- **Audit-only ticket before any deletion ticket**: ticket-016 produced a findings report with SOUND/DIVERGENT verdicts and explicit MEDIUM/LOW recommendations before any file was removed; this provided a clean, verifiable baseline and avoided premature deletions. Use this pattern for any structural review that precedes destructive changes.
- **Decision table with rationale column**: ticket-018's changes log documents all 42 occurrences in a single table with File, Line, Keyword, Context, Decision, and Rationale columns; this format makes the audit fully reproducible and lets a reviewer challenge any individual decision without re-reading every source file. See `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md`.
- **Three-way classification for reference cleanup**: KEEP / UPDATE / REMOVE rather than binary keep/delete; the UPDATE bucket captured 4 occurrences where the wording was false but the domain reference was strategically important; none of the 42 required outright removal. This avoids over-deletion in audits involving external-tool references.
- **False capability claim as a distinct defect category**: a reference that claims a feature exists when it does not (e.g., "Parsers for NEWAVE file formats") is categorically different from a strategic positioning statement ("born from the need for an alternative to NEWAVE") or a domain modeling reference ("CEPEL dead-volume filling model"). The false-capability defects required UPDATE; the others were KEEP. Encode this distinction in any future reference audit policy.

---

## 2. Architectural Decisions

- **Stub files deleted immediately rather than populated**: the 6 files in `src/migration/` were empty placeholder stubs ("This page is under construction"); the decision was to delete them rather than populate them, deferring NEWAVE import to a future epic. The alternative — keeping the stubs as navigation placeholders — was rejected because empty stubs mislead readers about available documentation. Resulting state: no `src/migration/` directory exists; see `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/changes-017.md`.
- **Domain terminology preserved, parser claims removed**: the audit distinguished between NEWAVE as a _domain reference_ (kept) and NEWAVE as an _implemented capability claim_ (updated). This decision preserves the project's positioning as an alternative to the NEWAVE/DECOMP/DESSEM suite while removing misleading statements about cobre-io's current capabilities. The boundary is: does the sentence imply cobre software currently parses NEWAVE files? If yes, UPDATE; otherwise, KEEP.
- **Spec organization verdict: no structural reorganization warranted**: the 6-section taxonomy (overview, math, data-model, architecture, hpc, configuration) was confirmed SOUND at the current scale (50 specs). The three MEDIUM recommendations (SUMMARY.md order alignment, inter-section navigation, cross-reference index numbering) were identified but not applied in this epic, consistent with the audit-not-modify policy. They transfer as actionable items for a future maintenance epic.

---

## 3. Files and Structures Created

- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/findings-016.md` — 330-line spec organization audit report; contains section-by-section verdicts, container page accuracy table, SUMMARY.md structure analysis, cross-reference index consistency findings, deferred.md assessment, and 7 prioritized recommendations (0 HIGH, 3 MEDIUM, 4 LOW).
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/changes-017.md` — NEWAVE migration deletion log; records 6 deleted files, the exact SUMMARY.md line range removed (114-124), before/after content, and build verification result.
- `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/changes-018.md` — 42-entry NEWAVE reference decision table with 4 applied text changes; includes before/after text for each UPDATE and verification that mdbook build exits 0.

Files deleted by this epic:

- `src/migration/overview.md`, `src/migration/file-formats.md`, `src/migration/hidr-dat.md`, `src/migration/term-dat.md`, `src/migration/confhd-dat.md`, `src/migration/comparing-results.md` — all were stubs with no substantive content.

---

## 4. Conventions Adopted

- **Keep percentage reporting for reference audits**: reporting "38 KEEP, 4 UPDATE, 0 REMOVE of 42 occurrences" gives the next reader an immediate sense of corpus health without reading the full table. Include this summary line in every reference audit changes log.
- **Cite planned support rather than omitting the reference entirely**: when a feature is planned but not implemented, replace false-present-tense claims with "Planned support for X" rather than removing all mention. This preserves roadmap visibility. Applied in `src/introduction.md` line 21 and `src/crates/overview.md` lines 23 and 41; see changes-018.md items 1-3.
- **Grep verification with zero-match assertion after deletion**: after removing the 6 migration files, a grep for `(migration/` across `src/` confirmed zero broken links. This zero-match assertion pattern (introduced in Epic 01 for symbol scans) applies equally to file-deletion cleanup. See changes-017.md Verification section.
- **Deferred.md feature count in plan descriptions**: the ticket stated "16-feature flat structure"; the actual count is 18 numbered + 3 unnumbered = 21 total. Track actual feature counts in plan tickets to avoid misleading future auditors. The discrepancy had no impact on the work but was documented as L-4 in findings-016.md.

---

## 5. Surprises and Deviations

- **Spec organization was cleaner than anticipated**: the epic overview assumed the audit might uncover misplaced specs or broken links. The actual finding was all 50 specs correctly placed, zero broken links, and zero missing files. The audit identified only ordering divergences between SUMMARY.md and container pages — a cosmetic inconsistency, not a structural defect. No remediation tickets were needed from ticket-016.
- **Cross-reference index uses a different section order than SUMMARY.md**: the index (produced in a prior epic) numbers specs with data-model (4-13) before math (14-27), while SUMMARY.md presents math before data-model. This was flagged as M-3 in findings-016.md. It was not caught by any prior epic because the index was verified for content correctness, not ordering consistency with SUMMARY.md. Future index audits should explicitly compare section ordering.
- **Zero REMOVE decisions in 42-occurrence reference audit**: the epic overview anticipated some references would require outright removal. In practice, all domain terminology, glossary entries, and strategic positioning references were clearly KEEP; only false capability claims (4 of 42) required UPDATE. The NEWAVE/CEPEL/DECOMP/DESSEM vocabulary is deeply embedded in domain modeling, not just parser infrastructure.
- **deferred.md actual feature count (21) exceeds ticket description (16)**: features C.17 and C.18 were added after the original C.1-C.16 numbering; 3 unnumbered variants also exist. Plan descriptions for documentation-scope tickets should reference line counts or file stat outputs rather than feature counts that may become stale.

---

## 6. Recommendations for Future Epics

- **MEDIUM recommendations from findings-016.md are actionable without further investigation**: M-1 (harmonize SUMMARY.md order with container page reading order), M-2 (add navigation sections to 4 container pages), and M-3 (align cross-reference index numbering with SUMMARY.md order) are each scoped to specific files with no ambiguity. They can be dispatched as a single low-risk maintenance ticket. Source: `/home/rogerio/git/cobre-docs/plans/spec-consistency-audit/epic-05-documentation-organization/findings-016.md` §6.2.
- **LOW recommendations from findings-016.md are deferred until deferred.md grows beyond ~25 entries**: L-1 (archive implemented C.5), L-2 (number unnumbered variants), L-3 (add TOC to deferred.md) are cosmetic. Apply them as a batch if the feature list grows. Source: findings-016.md §6.3.
- **Epic 06 can proceed without any Epic 05 output as a prerequisite**: findings-016.md confirmed the spec organization is sound; no spec was moved or renamed. All 50 spec files referenced in the cross-reference index remain at the same paths. The crate overview page (`src/crates/overview.md`) now correctly describes cobre-io capabilities, which is directly relevant to any agent-interface or Python-bindings epic that references that page.
- **`src/introduction.md` line 44 is the canonical strategic-positioning statement**: it describes Cobre as "an open, modern alternative to NEWAVE, DECOMP, DESSEM" and must never be removed. It was explicitly preserved in ticket-018 and should be treated as a protected statement in any future documentation overhaul.
- **`src/crates/overview.md` now uses JSON/Parquet/CSV/Arrow as the canonical IO format list**: any spec or ticket that describes cobre-io capabilities should match this list; see lines 23 and 41 after changes-018.md updates. Inconsistencies between crates/overview.md and individual spec files that describe IO format support should be caught in future reference audits.
