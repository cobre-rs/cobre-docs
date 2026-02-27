# Epic 08 Learnings — Final Verification Pass

## Patterns Established

- **Report-only audit ticket before terminal verdict ticket**: the two-ticket pattern (ticket-030 reports, ticket-031 decides) cleanly separates mechanistic evidence gathering from judgment. The verdict ticket can consume a fixed, complete findings table rather than interleaving discovery and decision. Applied at: `plans/implementation-readiness-audit/epic-08-final-verification/report-030-crossref-integrity.md` and `report-031-final-verdict.md`.

- **Three-pass cross-reference audit structure**: organizing a cross-reference integrity review into Pass A (new sections reference existing files), Pass B (stale identifiers), and Pass C (index consistency) covers all failure modes without overlap. Pass B is mechanistic (grep with expected zero output); Passes A and C require targeted manual inspection. Applied at: `report-030-crossref-integrity.md` sections 2-4.

- **Four-category finding classification**: BROKEN LINK / STALE REFERENCE / MISSING CROSS-REFERENCE / INDEX INCONSISTENCY provides unambiguous triage: only BROKEN LINK and STALE REFERENCE require immediate fixes; MISSING CROSS-REFERENCE and INDEX INCONSISTENCY are navigability defects that do not block READY verdicts. Applied at: `report-030-crossref-integrity.md` section 5 summary table.

- **"Resolve-During-Phase" gap classification**: a gap that blocks a specific phase but not any earlier phase should be classified as Resolve-During-Phase rather than Blocker. This preserves the READY verdict while flagging the gap for the correct phase team. GAP-039 applied this pattern: `report-031-final-verdict.md` section 4.

- **Gap inventory three-source consistency check**: for each gap the section 3 detailed table, the section 7 resolution log, and the section 6 summary statistics must all agree. When summary and log agree but the detailed table row lacks the `**Resolved**` marker, the statistics are correct in intent but the table is incorrect in form. Both must be verified independently. Applied at: `report-031-final-verdict.md` section 6 and `src/specs/overview/spec-gap-inventory.md` GAP-036/037/038 correction.

## Architectural Decisions

- **READY verdict requires exactly two conditions, not zero gaps**: the verdict threshold from report-017 is (1) zero unresolved Resolve-Before-Coding gaps AND (2) zero NOT READY phases. A gap classified as Resolve-During-Phase does not trigger either condition. This threshold was validated as the correct criterion for a spec-completeness readiness audit -- it does not require all gaps to be resolved, only that no gap prevents starting the earliest blocked phase. Rejected alternative: requiring all High-severity gaps resolved before issuing READY -- would have been overly conservative given GAP-039's bounded resolution path and Phase 5 scope. Documented at: `report-031-final-verdict.md` section 1 and section 4.

- **Cross-reference index inconsistencies classified as non-blocking**: the index is a navigation aid, not a correctness guarantee. Missing index entries degrade discoverability but do not invalidate any spec content. An implementer reading the spec files directly has all information needed regardless of index completeness. Rejected alternative: treating index inconsistencies as blocking findings -- would have required a cross-reference maintenance pass before the READY verdict could be issued, adding scope to the terminal epic. Documented at: `report-031-final-verdict.md` section 5.

## Files and Structures Created

- `plans/implementation-readiness-audit/epic-08-final-verification/report-030-crossref-integrity.md` -- 6-section cross-reference integrity report covering mdBook build result, 3 verification passes, findings summary table, and conclusion; produced by `implementation-guardian`
- `plans/implementation-readiness-audit/epic-08-final-verification/report-031-final-verdict.md` -- 7-section final verdict report covering the READY determination, 19-condition resolution table, phase readiness summary, GAP-039 analysis, ticket-030 findings integration, gap inventory verification, and audit plan summary; produced by `sddp-specialist`
- `src/specs/overview/spec-gap-inventory.md` -- section 3 table corrected to add `**Resolved**` markers to GAP-036/037/038 rows, bringing the detailed table into alignment with the resolution log and section 6 summary statistics

## Conventions Adopted

- **Condition resolution table column set**: Condition ID, Description (abbreviated), Resolving Ticket(s), Resolving File/Section, Verification Status (CONFIRMED/UNCONFIRMED). Each row must cite a specific file path and section with enough detail that a reader can locate the resolution without re-reading the ticket. Applied at: `report-031-final-verdict.md` section 2.

- **Phase readiness table column set**: Phase, Crate(s), Original Verdict, Updated Verdict, Conditions Resolved, Remaining Gaps (Resolve-During-Phase). The "Remaining Gaps" column explicitly names any Resolve-During-Phase gaps so future phase teams know what to address at the start of their phase. Applied at: `report-031-final-verdict.md` section 3.

- **GAP analysis four-question pattern**: (1) what is the gap? (2) which phase does it block? (3) can earlier phases proceed without it? (4) is it a Blocker or Resolve-During-Phase? This pattern provides a consistent, decision-oriented structure for evaluating new gaps discovered late in the audit. Applied at: `report-031-final-verdict.md` section 4.

- **Informational-only observation in audit reports**: when a finding is out of scope for the current audit but relevant to future work, prefix it with "Observation (out-of-scope, informational only):" and include it in the relevant section without elevating it to a numbered finding. Applied in `report-030-crossref-integrity.md` section 3 (B4 rkyv observation about `ecosystem-guidelines.md`).

## Surprises and Deviations

- **Gap inventory table vs. summary discrepancy**: the section 3 detailed table in `spec-gap-inventory.md` did not have `**Resolved**` markers on GAP-036/037/038 even though the resolution log (section 7) and summary statistics (section 6) both listed them as resolved. The statistics claimed 15 High resolved; the table showed only 12. The discrepancy was discovered by the instruction in the ticket spec to count rows independently rather than trusting prior counts. The fix (adding `**Resolved**` markers to 3 rows) was applied during ticket-031. Expected: statistics and table would be consistent. Actual: maintenance lag between log/summary updates and table row updates. Relevant files: `src/specs/overview/spec-gap-inventory.md` sections 3, 6, 7.

- **Cross-reference index not updated after Epic 07**: ticket-026 (Epic 06) batch-updated the index, but no analogous update was planned or executed after Epic 07. This left 5 High-severity index inconsistencies (F4, F5, F6) that were discovered in ticket-030. The omission occurred because the Epic 07 plan focused on spec content (serialization eval, output API, simulation types) without including a cross-reference index maintenance ticket. Expected: Epic 07 learnings would flag this for the terminal epic. Actual: ticket-030's acceptance criteria explicitly included Pass C (index consistency) precisely because this was anticipated as a risk. The finding was non-blocking for READY but warrants a post-verdict maintenance pass.

- **Pre-existing index incompleteness for simulation-architecture.md**: section 3 of the cross-reference index listed only 10 outgoing references for `simulation-architecture.md` while the file's actual Cross-References section had 18 entries. The 8 missing entries all predate Epics 05-07. This was flagged as F8 (Low) in report-030. The lesson: the index was already incomplete before this plan began and the Epic 06 batch update did not perform a full reconciliation for all files -- only for the two new files added that epic. Future cross-reference index updates should always re-verify the count for files whose cross-reference sections grew in previous epics.

## Recommendations for Future Epics

- **Schedule a cross-reference maintenance pass before Phase 6 implementation begins**: the 5 High-severity index inconsistencies found in ticket-030 (F4, F5, F6) reduce navigability for the crates with the highest cross-spec reading density (cobre-sddp training and simulation). A single maintenance ticket targeting `cross-reference-index.md` sections 3-4 plus the two missing prose links (F1: `simulation-architecture.md` SS6.1 -> `output-infrastructure.md` SS6.2; F2: `binary-formats.md` MPI broadcast entry) would clear all High findings. Effort: ~1 day.

- **Resolve GAP-039 as the first task of Phase 5**: the scenario innovation noise broadcast format is unspecified (`src/specs/architecture/scenario-generation.md`). The resolution path is well-bounded -- raw `#[repr(C)]` f64 arrays with `MPI_Bcast`, matching the cut wire format pattern from `src/specs/math/cut-management.md` SS4.2a. Estimated effort: 0.5 day. Must be completed before any `cobre-stochastic` scenario broadcast code is written.

- **Include a cross-reference index maintenance ticket at the end of every spec-authoring epic**: Epic 06 did this correctly (ticket-026); Epic 07 did not. Any epic that adds new cross-reference entries to existing spec files should end with an explicit ticket to batch-update the cross-reference index. The maintenance cost is low (1-2 hours) and avoids index drift.

- **Verify gap inventory table rows when updating the resolution log**: when marking a gap resolved in section 7 and updating the section 6 statistics, always simultaneously add the `**Resolved**` prefix to the corresponding section 3 table row. The three-source consistency check (table vs. log vs. statistics) is an invariant that should be maintained at update time, not discovered at audit time.
