# Per-Epic Learnings: Epic 03 — Production Scale Reference Hardening

**Plan**: spec-consistency-audit
**Epic**: epic-03-production-scale-hardening
**Completed**: 2026-02-25

---

## What Worked Well

- **Calculator-first cross-check methodology (ticket-010)**: Running the LP sizing calculator with `echo '{}' | python3 scripts/lp_sizing.py /dev/stdin` and comparing every output field row-by-row produced a CLEAN verdict across 54 values with zero new discrepancies. The systematic tabular format (spec value | calculator value | match verdict) made the audit reproducible and the evidence record self-contained. This methodology should be the template for any future calculator-grounded spec audit.

- **"Explained variance" category prevents false positives**: Classifying AR(12) vs AR(6) differences as E1-E4 (explained variance, not errors) rather than discrepancies prevented unnecessary churn. The spec uses worst-case AR(12) for capacity planning; the calculator uses average AR(6) for typical sizing — both are correct within their stated scope. Recording this distinction once (in findings-010.md) avoided re-litigating it during ticket-011 and ticket-012.

- **Surgical "200" sweep with exclusion table (ticket-011)**: The changes log (`changes-011.md`) maintained a full exclusion table of every non-forward-pass "200" value in the corpus (25 entries across 11 files) alongside a rationale for each. This made the sweep auditable and confident: the grep verification `grep -rn '\b200\b' src/specs/` at the end confirmed zero remaining forward-pass-context "200" values without false positives. Reuse this pattern for any corpus-wide numeric replacement.

- **Value 192 has superior arithmetic properties**: 192 / 64 = 3 (exact), 192 / 16 = 12 (exact), 192 / 128 = 1.5 (exact). The old value 200 / 16 produced "12-13" ambiguity in `cut-management-impl.md` §4.2 and "approximately 1.5" in `work-distribution.md` §2.3. After the change, both became exact. The spec language improved as a side effect of correctness.

- **Traceability annotation design (ticket-012)**: The "Default Parameters" table listing all 22 `SystemConfig` fields in §3.4, the "Output Mapping" table linking calculator fields to spec sections, and the "Source" column in §3.1/§3.2 tables collectively allow any reader to reproduce every value without access to the spec authors. The `n_forward_passes` discrepancy note (calculator default 200, spec uses 192) prevents future confusion. This pattern — annotate rather than change the tool — is correct when the tool default and the spec value differ for valid reasons.

---

## What Was Harder Than Expected

- **Distinguishing forward passes from other "200" occurrences required careful semantic context**: The corpus contains 25 uses of the numeral "200" that are not forward pass counts — network bandwidth (200 Gb/s), backward pass openings, SDDP iteration counts, thermal plant counts, output sizes in MB/GB, simulation scenarios, SLURM parameters, and data example values. A naive `grep` replacement would have corrupted all of them. The manual exclusion table in `changes-011.md` took more effort than the replacements themselves, but this effort was unavoidable.

- **Cut capacity formula update required domain understanding**: The cut capacity formula `5,000 + 50 × 200 = 15,000` in `cut-management-impl.md` §1.3 updates to `5,000 + 50 × 192 = 14,600`, but the total capacity remains 15,000 as a headroom buffer. The spec text had to be rewritten to make this rationale explicit rather than just updating the arithmetic. Similarly, `solver-abstraction.md` §5.2 shows `50 × 192 = 9,600` (changed) while the total capacity 15,000 is unchanged — the two values serve different purposes within the same table.

- **Communication volume cascade**: Changing M=200 to M=192 in `communication-patterns.md` produced a cascade of 7 derived values (trial point payload, cut payload, per-iteration totals, InfiniBand timing, Ethernet timing) that all required arithmetic re-derivation and verification. The 2.7% reduction (603 MB → 587 MB) was within the 5% threshold used to gauge whether the change was significant enough to require cross-spec updates, which simplified the decision.

---

## Process Patterns to Reuse

- **CLEAN/findings-first ticket before any fix ticket**: ticket-010 was a pure verification ticket that produced a CLEAN verdict before ticket-011 made any changes. This sequencing is valuable: it confirms the baseline state is correct and gives the fix ticket a clean starting point. For Epic 04 (wall-clock time model), do a verification-first ticket before any timing value updates.

- **Exclusion table for corpus-wide numeric replacements**: When replacing a numeral that appears in many contexts, maintain a two-column table: (location, reason unchanged). This serves as both an audit trail and a checklist. See `changes-011.md` for the 25-entry exclusion table.

- **Annotation-not-modification for tool/spec parameter discrepancies**: When a reference tool (calculator, code) uses a different default than the spec, annotate the spec to explain the discrepancy rather than modifying the tool. The `n_forward_passes` note in §3.4 is the canonical example. See `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` §3.4 "Calculator Location and Verification Command".

- **Derived-value cascade tracking**: When a single parameter change propagates through multiple derived values across multiple files, list every affected file and every affected value in the changes log before making edits. This prevents missing any dependent value. See `changes-011.md` which lists all 20 changes across 8 files.

- **"Source" column pattern for tabular specs**: Adding a "Source" column to formula tables (Calculator / Calculator (AR 12) / Configuration / Derived) makes the provenance of every row explicit and reduces future audit effort. See §3.1 and §3.2 of `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md`.

---

## Deferred Items

- **LP sizing calculator default `n_forward_passes` is still 200**: The calculator's `SystemConfig` dataclass defaults to 200 while the spec uses 192. This discrepancy is documented in §3.4 with a note, but the calculator itself was declared out of scope for this epic. If the calculator default is ever corrected to 192, the annotation in §3.4 must be updated. Ticket candidate for any epic that owns calculator code.

- **Penalty cost symbols (13 unregistered) still not in `notation-conventions.md`**: Deferred from Epic 01. The authoritative source remains `lp-formulation.md` section 1.3. See `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md` and `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md`.

- **`$\gamma$ overloading** still unresolved\*\*: Deferred from Epic 01. Affects `lp-formulation.md`, `system-elements.md`, `equipment-formulations.md`.

- **PAR innovation noise `$\eta_t$` vs `$\varepsilon_t$`** still unresolved: Deferred from Epic 01. Affects `par-inflow-model.md` and `inflow-nonnegativity.md`.

- **7 missing DOIs in bibliography** still pending: Deferred from Epic 02. All DOIs confirmed in findings-006. Target: Epic 05 or standalone bibliography ticket.

- **4 orphan bibliography entries** lacking forward citations still pending: Deferred from Epic 02.

- **SIDP/vertex-based upper-bound citation** still unresolved: Deferred from Epic 02. See `upper-bound-evaluation.md` and findings-008.

- **Epic 02 re-read note**: The findings-010 ticket noted that `inflow-nonnegativity.md` and `cut-management.md` should be re-read against corrected bibliography metadata before substantive changes. No substantive changes were made to those files in Epic 03, so this deferral remains active.
