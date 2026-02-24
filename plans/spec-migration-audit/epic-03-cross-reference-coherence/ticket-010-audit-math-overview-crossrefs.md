# ticket-010 Audit Semantic Accuracy of Cross-References in Math and Overview Specs

## Context

### Background

Epics 01 and 02 verified that all 50 spec files have zero content loss and that every markdown link resolves to an existing file on disk. However, **semantic accuracy** of those links was not verified: does the link target actually discuss what the referring text claims it discusses? The math and overview specs are the foundation that every other spec references, making them the highest-priority scope for semantic verification.

The math and overview sections contain **389 markdown links to `.md` files** across 18 files (3 overview + 14 math + 1 section index `math.md`). Additionally, these specs contain approximately **200 cross-file section-number references** in `§N.N` format (e.g., `[Cut Management §3](cut-management.md)`) that cite specific numbered sections in the target file. These section-number references are the primary risk: if a heading was renumbered during migration, the `§` reference becomes semantically wrong even though the link still resolves.

### Relation to Epic

This is the first ticket in Epic 03 (Cross-Reference and Coherence Audit). It establishes the semantic audit methodology and severity framework that tickets 011-013 follow. It covers the mathematically dense core of the spec corpus where cross-reference accuracy is most critical.

### Current State

The 18 files in scope are at:

**Overview specs** (3 files):

- `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md` (21 links)
- `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md` (12 links)
- `/home/rogerio/git/cobre-docs/src/specs/overview/production-scale-reference.md` (16 links)

**Math section index** (1 file):

- `/home/rogerio/git/cobre-docs/src/specs/math.md` (43 links)

**Math specs** (14 files):

- `/home/rogerio/git/cobre-docs/src/specs/math/sddp-algorithm.md` (39 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md` (33 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/system-elements.md` (30 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/equipment-formulations.md` (27 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/hydro-production-models.md` (26 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/cut-management.md` (24 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/risk-measures.md` (22 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/block-formulations.md` (21 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/upper-bound-evaluation.md` (17 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/discount-rate.md` (14 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/infinite-horizon.md` (10 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/stopping-rules.md` (8 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/par-inflow-model.md` (8 links)
- `/home/rogerio/git/cobre-docs/src/specs/math/inflow-nonnegativity.md` (7 links)

From Epic 01, there are zero broken structural links. From Epic 02, these files are correctly placed in their spec sections. The question now is whether the **content behind each link** matches the **claim made in the referring text**.

## Specification

### Requirements

For each of the 18 files, perform the following checks:

**Check A -- Section-Number Reference Accuracy**: Extract all cross-references that include a section number in the anchor text (pattern: `§N` or `§N.N` or `section N`). For each such reference:

1. Open the target file
2. Verify that the numbered section heading exists (e.g., `## 3. Single-Cut Aggregation` for a `§3` reference)
3. Verify that the section content actually discusses what the referring text claims

Focus files (highest § reference density in this scope):

- `sddp-algorithm.md` (~16 § refs)
- `lp-formulation.md` (~16 § refs)
- `equipment-formulations.md` (~22 § refs)
- `cut-management.md` (~19 § refs)
- `risk-measures.md` (~14 § refs)

**Check B -- Anchor Fragment Verification**: There are zero `#anchor` fragment links originating from files in this scope (confirmed by grep). Record this as a PASS baseline. If any are discovered during manual review, verify the anchor matches a heading in the target file.

**Check C -- Semantic Link Accuracy (Sampled)**: For each of the 18 files, sample the **3 most domain-critical links** (links that convey mathematical dependencies, e.g., "see [LP Formulation](lp-formulation.md) for the constraint structure") and verify:

1. The target file exists (already confirmed by Epic 01 -- this is a sanity re-check)
2. The target file's content matches what the anchor text implies
3. The specific passage or concept referenced is actually present in the target

Priority sampling targets:

- Links from `sddp-algorithm.md` to `cut-management.md` (cut generation claims)
- Links from `lp-formulation.md` to `penalty-system.md` (penalty category claims)
- Links from `risk-measures.md` to `sddp-algorithm.md` (risk-averse Bellman claims)
- Links from `hydro-production-models.md` to `lp-formulation.md` (FPHA constraint claims)
- Links from `block-formulations.md` to `system-elements.md` (equipment parameter claims)

**Check D -- Cross-Section Consistency**: Verify that mutual references between math specs are symmetric. Specifically:

1. If `sddp-algorithm.md` says "see [Cut Management §3]" for aggregation, verify `cut-management.md §3` reciprocally references `sddp-algorithm.md` for the algorithm context
2. If `lp-formulation.md` references `system-elements.md §5` for generation bounds, verify `system-elements.md §5` references `lp-formulation.md` for the LP context
3. Check at least 5 bidirectional reference pairs across the 14 math specs

### Inputs

- Target directory: `/home/rogerio/git/cobre-docs/src/specs/overview/`
- Target directory: `/home/rogerio/git/cobre-docs/src/specs/math/`
- Target file: `/home/rogerio/git/cobre-docs/src/specs/math.md`
- All 18 files listed above

### Outputs

A structured audit report at:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-010-audit-report.md`

The report must contain:

1. **Summary table**: `| File | Total Links | § Refs | § Mismatches | Sampled Links | Sampled Failures | Verdict |`
2. **Per-file section-number audit**: For each file with § references, list every § reference, the target section heading it maps to, and PASS/FAIL
3. **Semantic sample audit**: For the 54 sampled links (3 per file x 18 files), record: source file, anchor text, target file, expected content, actual content match (YES/NO)
4. **Bidirectional consistency audit**: For the 5+ tested reference pairs, record whether reciprocal links exist
5. **Findings list**: severity-classified (CRITICAL/HIGH/MEDIUM/LOW)

### Error Handling

- Section number in anchor text does not match any heading in the target file: **HIGH** (the reader is directed to the wrong section)
- Section number matches a heading but the heading content does not match the claim: **HIGH** (semantic mismatch)
- Sampled link target file does not contain the concept implied by the anchor text: **HIGH** (misleading cross-reference)
- Bidirectional reference pair is asymmetric (A references B but B does not reference A): **MEDIUM** (navigability gap, not a correctness issue)
- Minor wording difference between anchor text and target heading (e.g., "Cut Selection" vs "Selection Strategies"): **LOW**

## Acceptance Criteria

- [ ] Given all 18 files in scope, when all `§N` and `§N.N` references are extracted and verified, then every section number maps to an existing heading in the target file
- [ ] Given `sddp-algorithm.md`, when its ~16 section-number references are checked, then all reference the correct section content in their targets
- [ ] Given `lp-formulation.md`, when its ~16 section-number references are checked, then all reference the correct section content in their targets
- [ ] Given all 18 files, when 3 domain-critical links per file are semantically verified, then no HIGH findings are reported
- [ ] Given at least 5 bidirectional reference pairs, when symmetry is checked, then asymmetric pairs are documented as MEDIUM findings
- [ ] The audit report contains a per-file summary table with columns for total links, § refs, mismatches, sampled links, and verdict
- [ ] All findings are classified using the severity definitions from the plan README (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Zero CRITICAL findings (information loss was already ruled out by Epic 01)

## Implementation Guide

### Suggested Approach

**Step 1: Extract all section-number references from the 18 files.**

```bash
grep -rnoP '\[.*?§[\d]+(?:\.[\d]+)*.*?\]\([^)]+\)' \
  /home/rogerio/git/cobre-docs/src/specs/overview/ \
  /home/rogerio/git/cobre-docs/src/specs/math/ \
  /home/rogerio/git/cobre-docs/src/specs/math.md
```

Also capture bare `§N` references without markdown link wrappers:

```bash
grep -rnoP '§[\d]+(?:\.[\d]+)*' \
  /home/rogerio/git/cobre-docs/src/specs/overview/ \
  /home/rogerio/git/cobre-docs/src/specs/math/ \
  /home/rogerio/git/cobre-docs/src/specs/math.md
```

**Step 2: For each section-number reference, open the target file and verify the heading exists.**

For each reference like `[Cut Management §3](cut-management.md)`:

1. Read `cut-management.md`
2. Search for a heading matching `## 3. ` or `## 3 `
3. Verify the heading topic matches "Single-Cut Aggregation" or similar
4. Read the section content to confirm it discusses what the source text claims

**Step 3: Sample 3 domain-critical links per file (54 total).**

For each file, choose the 3 links that carry the most mathematical meaning. Prioritize links that appear in formulas, theorems, or constraint definitions. Read the target file and verify the claimed content exists.

**Step 4: Check 5+ bidirectional reference pairs.**

Suggested pairs:

1. `sddp-algorithm.md` <-> `cut-management.md` (cut generation)
2. `lp-formulation.md` <-> `penalty-system.md` (penalty categories)
3. `lp-formulation.md` <-> `system-elements.md` (equipment parameters)
4. `risk-measures.md` <-> `sddp-algorithm.md` (risk-averse formulation)
5. `hydro-production-models.md` <-> `lp-formulation.md` (FPHA constraints)

**Step 5: Compile findings and write the audit report.**

### Key Files to Modify

No source files are modified. The sole deliverable is the audit report at:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-010-audit-report.md`

### Patterns to Follow

- Follow the same check-by-check and per-file reporting structure used in tickets 001-009
- Use the severity definitions from the plan README and the learnings file
- Record every finding with a unique ID (e.g., `F-1`, `F-2`) for traceability in Epic 06

### Pitfalls to Avoid

- **Do not re-verify structural link resolution**: Epic 01 already confirmed all links resolve to existing files. This ticket focuses on **semantic accuracy** only.
- **Self-referential § numbers are not findings**: Some specs reference their own sections (e.g., `lp-formulation.md` says "see §9 above"). These are internal references and only need to be checked against the same file's headings.
- **Section numbering convention**: Spec files use `## N. Title` format (e.g., `## 3. Single-Cut Aggregation`). The mdBook anchor for these is `n-title-in-lowercase-with-hyphens`. Do not confuse the § number with an anchor fragment.
- **Do not confuse `§` references with heading anchors**: The § references are human-readable section pointers in prose text, not `#fragment` URL anchors. There are only 2 actual `#fragment` anchors in the entire algorithm reference section, and zero in the spec files.

## Testing Requirements

### Unit Tests

Not applicable -- this is a read-only audit ticket.

### Integration Tests

The audit report is the integration test deliverable. A reviewer must be able to:

1. Pick any § reference from the report
2. Open the cited source and target files
3. Verify the reported PASS/FAIL independently

### E2E Tests

No files are modified, so no `mdbook build` verification is needed.

## Dependencies

- **Blocked By**: ticket-001, ticket-002, ticket-003 (content integrity of overview and math specs must be confirmed)
- **Blocks**: ticket-011 (methodology established here is reused), ticket-018/019 (remediation of any HIGH findings)

## Effort Estimate

**Points**: 3
**Confidence**: High
