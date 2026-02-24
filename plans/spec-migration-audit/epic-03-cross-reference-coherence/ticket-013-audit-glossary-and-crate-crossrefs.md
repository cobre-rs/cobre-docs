# ticket-013 Audit Glossary Coverage and Crate Documentation Cross-Reference Accuracy

## Context

### Background

This ticket audits two distinct components that together form the navigational perimeter of the spec corpus: the **glossary** and the **crate documentation pages**.

The glossary at `src/reference/glossary.md` defines technical terminology across 9 categories (Power System, Hydro Generation, Thermal Generation, Stochastic Modeling, SDDP Algorithm, Risk Measures, NEWAVE/CEPEL Ecosystem, Solver, Data Formats, HPC). It currently contains **78 terms** organized in tables with English, Portuguese, and Definition columns. The risk is terminology gaps: a term used in the math or architecture specs that a reader would need the glossary to understand, but which is absent.

The 7 crate documentation pages (`src/crates/`) were audited in ticket-006 for spec reference completeness. That audit found **14 HIGH findings** (missing spec links) and **11 MEDIUM findings** (additional gaps). This ticket performs a different check: are the **existing** cross-references in crate doc pages semantically accurate? When a crate doc says "See [Training Loop](../specs/architecture/training-loop.md) for the iteration lifecycle", does `training-loop.md` actually describe the iteration lifecycle as claimed?

The Epic 02 learnings specifically recommended that this ticket audit whether `sddp.md`, `core.md`, and `io.md` accurately describe concepts from specs they reference -- paraphrasing without citation creates semantic drift risk. The `cobre-sddp` crate doc is the highest priority with 8 un-linked specs and 7 MEDIUM gaps from ticket-006.

### Relation to Epic

This is the fourth and final ticket in Epic 03. It completes the coherence audit by covering the glossary layer and the crate documentation layer. Together with tickets 010-012, it ensures every navigational layer of the mdBook is semantically coherent with the formal spec corpus.

### Current State

**Glossary**: `/home/rogerio/git/cobre-docs/src/reference/glossary.md`

- 9 category tables with 78 terms total
- Categories: Power System (6), Hydro Generation (16), Thermal Generation (4), Stochastic Modeling (5), SDDP Algorithm (14), Risk Measures (3), NEWAVE/CEPEL Ecosystem (8), Solver (6), Data Formats (5), HPC (5)
- No cross-reference links within the glossary (it is a standalone reference)
- Portuguese equivalents provided for domain terms

**Crate documentation pages**: `/home/rogerio/git/cobre-docs/src/crates/`

- `overview.md` (7 links) -- dependency graph and crate summaries
- `core.md` (4 links) -- cobre-core overview and key concepts
- `io.md` (6 links) -- cobre-io overview and key concepts
- `stochastic.md` (2 links) -- cobre-stochastic overview
- `solver.md` (4 links) -- cobre-solver overview
- `sddp.md` (4 links) -- cobre-sddp overview and key concepts
- `cli.md` (2 links) -- cobre-cli overview
- `ferrompi.md` (6 links) -- ferrompi overview

Total: **35 links** across 8 crate doc pages. Zero anchor-bearing links (`#fragment`).

**Epic 02 findings context** (from ticket-006 and ticket-009 reports):

- `cobre-sddp` has 8 HIGH missing spec links (all math specs)
- `cobre-core` has 2 HIGH missing spec links (`design-principles.md`, `system-elements.md`)
- `cobre-io` has 2 HIGH missing spec links (`input-loading-pipeline.md`, `validation-architecture.md`)
- `cobre-cli` has 1 HIGH missing spec link (`configuration-reference.md`)
- `ferrompi` has 1 HIGH missing spec link
- These missing links are remediation items for Epic 06. This ticket audits the **existing** links for semantic accuracy.

## Specification

### Requirements

**Part 1: Glossary Coverage Audit**

**Check A -- Term Coverage in Math Specs**: Read each of the 14 math spec files. For each technical term that:

1. Is not a common English word
2. Would not be obvious to a power systems engineer reading the spec for the first time
3. Appears in a formula or definition context

...verify that the term appears in the glossary. Focus on:

- Terms in `notation-conventions.md` symbol tables (these define the shared vocabulary)
- Terms introduced in `sddp-algorithm.md` (e.g., "policy graph", "opening", "trial point")
- Terms in `risk-measures.md` (e.g., "coherent risk measure", "subadditivity")
- Terms in `par-inflow-model.md` (e.g., "Yule-Walker", "innovation", "stationarity")

**Check B -- Term Coverage in Architecture and HPC Specs**: Spot-check 10 architecture/HPC specs for terms absent from the glossary. Focus on:

- HPC terms in `hybrid-parallelism.md` (e.g., "thread affinity", "NUMA node")
- Architecture terms in `solver-workspaces.md` (e.g., "warm-start", "basis")
- Data format terms in `binary-formats.md` (e.g., "zero-copy", "memory-mapped")

**Check C -- Glossary Accuracy**: For each of the 78 existing glossary terms, verify:

1. The definition is correct (not contradicted by the formal specs)
2. The Portuguese equivalent is accurate (spot-check 10 terms)
3. No glossary term has a definition that conflicts with how the term is used in the specs

**Part 2: Crate Documentation Semantic Accuracy**

**Check D -- Crate Doc Link Semantic Verification**: For each of the 35 links across the 8 crate doc pages:

1. Read the anchor text and the surrounding sentence
2. Open the linked spec file
3. Verify the spec file actually discusses what the crate doc claims it discusses

This is a 100% check (all 35 links), not a sample. The link count is small enough for exhaustive verification.

**Check E -- Crate Doc Prose Accuracy**: For each of the 3 priority crate docs (`sddp.md`, `core.md`, `io.md`), read the Overview prose and verify 3 specific behavioral claims against the referenced specs. The Epic 02 learnings flagged that these crate docs paraphrase spec content, creating semantic drift risk.

Specific claims to verify:

- `sddp.md` Overview: any claim about the SDDP iteration lifecycle (forward pass, backward pass, convergence) -- verify against `training-loop.md` and `sddp-algorithm.md`
- `core.md` Overview: any claim about entity types or canonical ordering -- verify against `input-system-entities.md` and `internal-structures.md`
- `io.md` Overview: any claim about the loading pipeline or validation -- verify against `input-loading-pipeline.md` and `validation-architecture.md`

**Check F -- Dependency Graph Consistency**: The `overview.md` dependency graph (ASCII diagram) was checked against Cargo.toml in ticket-006. The learnings noted that all crate Cargo.toml files are placeholder stubs with no `[dependencies]` sections. Record this as a known limitation: the dependency graph represents intended design only and cannot be verified against actual manifests. Do not re-audit this; reference ticket-006's finding.

### Inputs

- Glossary: `/home/rogerio/git/cobre-docs/src/reference/glossary.md`
- Crate docs: `/home/rogerio/git/cobre-docs/src/crates/*.md` (8 files)
- Math specs: `/home/rogerio/git/cobre-docs/src/specs/math/*.md` (14 files)
- Architecture specs: `/home/rogerio/git/cobre-docs/src/specs/architecture/*.md` (13 files)
- HPC specs: `/home/rogerio/git/cobre-docs/src/specs/hpc/*.md` (8 files)
- Data model specs: `/home/rogerio/git/cobre-docs/src/specs/data-model/*.md` (10 files)
- Notation conventions: `/home/rogerio/git/cobre-docs/src/specs/overview/notation-conventions.md`
- Epic 02 audit reports:
  - `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-006-audit-report.md` (if it exists)
  - `/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-02-spec-crate-mapping/ticket-009-audit-report.md`

### Outputs

A structured audit report at:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-013-audit-report.md`

The report must contain:

**Part 1 (Glossary):**

1. **Term coverage summary**: `| Category | Current Terms | Missing Terms Found | Coverage % |`
2. **Missing term list**: For each missing term: term, source spec file, context of use, suggested definition
3. **Glossary accuracy spot-check**: 10 terms verified against spec usage, results table
4. **Portuguese equivalents spot-check**: 10 terms verified, results table

**Part 2 (Crate Docs):** 5. **Link semantic audit**: `| Crate Doc | Link Anchor Text | Target File | Claim Matches Target | Verdict |` (35 rows) 6. **Prose accuracy audit**: For `sddp.md`, `core.md`, `io.md` -- 3 claims each, verified against specs 7. **Reference to ticket-006 findings**: Summary of the 14 HIGH + 11 MEDIUM findings from Epic 02 that will be addressed in Epic 06

**Combined:** 8. **Findings list**: severity-classified (CRITICAL/HIGH/MEDIUM/LOW)

### Error Handling

- Glossary term definition contradicts formal spec usage: **HIGH** (reader gets wrong understanding)
- Key technical term missing from glossary (used in math specs without being self-explanatory): **MEDIUM** (navigability gap)
- Portuguese equivalent is incorrect: **LOW** (cosmetic for English-primary readers)
- Crate doc link anchor text does not match target content: **HIGH** (reader directed to wrong content)
- Crate doc prose claim contradicts referenced spec: **HIGH** (implementation risk)
- Crate doc prose claim is a simplification that omits detail but does not contradict: **not a finding**
- Term used only in architecture/HPC specs missing from glossary: **LOW** (these specs target an audience with HPC background)

## Acceptance Criteria

- [ ] Given all 14 math spec files, when scanned for technical terms, then all domain-specific terms used in formula or definition context appear in the glossary or are documented as MEDIUM findings
- [ ] Given the glossary's 78 existing terms, when 10 are spot-checked against spec usage, then zero definitions contradict the specs
- [ ] Given all 35 links in the 8 crate doc pages, when each is semantically verified against the target file, then zero links point to content that does not match the anchor text claim
- [ ] Given `sddp.md` crate doc, when 3 behavioral claims are verified against `training-loop.md` and `sddp-algorithm.md`, then zero contradictions are found
- [ ] Given `core.md` crate doc, when 3 claims are verified against referenced specs, then zero contradictions are found
- [ ] Given `io.md` crate doc, when 3 claims are verified against referenced specs, then zero contradictions are found
- [ ] The report includes a missing-term list with suggested definitions for any MEDIUM findings
- [ ] The report references the 14 HIGH findings from ticket-006 as context for Epic 06 remediation
- [ ] All findings are severity-classified; zero CRITICAL findings expected

## Implementation Guide

### Suggested Approach

**Step 1: Build the term inventory from math specs.**

Read each of the 14 math spec files. Extract terms that appear in:

- Bold text (`**term**`) -- often used to introduce new terminology
- Table headers (parameter names, symbol definitions)
- Section headings that name a concept (e.g., "Policy Graph Structure")

```bash
# Extract bold terms from math specs
for f in /home/rogerio/git/cobre-docs/src/specs/math/*.md; do
  echo "=== $(basename $f) ==="
  grep -oP '\*\*[^*]+\*\*' "$f" | sort -u | head -20
done
```

**Step 2: Cross-reference terms against glossary.**

For each extracted term, check if it appears in `/home/rogerio/git/cobre-docs/src/reference/glossary.md`. Record misses.

```bash
# Check if a term exists in the glossary
grep -i "policy graph" /home/rogerio/git/cobre-docs/src/reference/glossary.md
grep -i "trial point" /home/rogerio/git/cobre-docs/src/reference/glossary.md
grep -i "opening" /home/rogerio/git/cobre-docs/src/reference/glossary.md
```

**Step 3: Spot-check glossary definitions.**

Select 10 terms spanning multiple categories. For each:

1. Read the glossary definition
2. Find the term in a formal spec
3. Verify the definition matches usage

**Step 4: Audit all 35 crate doc links.**

```bash
# Extract all links from crate doc pages
for f in /home/rogerio/git/cobre-docs/src/crates/*.md; do
  echo "=== $(basename $f) ==="
  grep -noP '\[.*?\]\([^)]+\)' "$f"
done
```

For each link, read the surrounding sentence, then open the target file and verify the claim.

**Step 5: Verify 3 prose claims each for sddp.md, core.md, io.md.**

Read the Overview sections of these crate docs. Identify specific behavioral claims. Open the referenced specs and verify.

**Step 6: Compile findings and write the audit report.**

### Key Files to Modify

No source files are modified. The sole deliverable is:
`/home/rogerio/git/cobre-docs/plans/spec-migration-audit/epic-03-cross-reference-coherence/ticket-013-audit-report.md`

### Patterns to Follow

- Follow severity classification from the plan README
- Assign unique finding IDs continuing from ticket-012's numbering
- For missing glossary terms, provide a suggested definition in the report (this feeds directly into Epic 06 remediation)
- Reference ticket-006 findings by their original finding IDs when discussing crate doc gaps

### Pitfalls to Avoid

- **Glossary scope is domain terms, not programming terms**: The existing glossary already includes some programming terms (FlatBuffers, Parquet, CSR, CSC) in a "Data Formats" category. Follow this precedent: include data format and solver terms that appear in specs, but do not audit for general programming terms (e.g., "struct", "trait", "async").
- **Do not re-audit crate doc spec coverage completeness**: Ticket-006 already identified the 14 HIGH missing links. This ticket audits the **existing** links for semantic accuracy, not coverage completeness. Reference ticket-006 findings but do not duplicate the audit.
- **The glossary has no cross-reference links**: It is a flat reference table. Do not flag the absence of links as a finding.
- **Terms obvious to a power systems engineer are not missing**: "MW" (megawatt), "bus", "load" -- these are domain-standard terms. The glossary includes them for Portuguese equivalents, but their absence would be LOW at most.
- **Cargo.toml stubs**: Do not attempt to verify the dependency graph against Cargo.toml. This was attempted in ticket-006 and found that all crate Cargo.toml files are placeholder stubs. The dependency graph in `overview.md` represents intended design only.

## Testing Requirements

### Unit Tests

Not applicable -- read-only audit ticket.

### Integration Tests

The audit report is the deliverable. A reviewer must be able to:

1. Pick any missing-term finding and verify the term is indeed absent from the glossary
2. Pick any crate doc link finding and verify the semantic mismatch
3. Pick any prose accuracy finding and verify the claimed contradiction

### E2E Tests

No files are modified, so no `mdbook build` verification needed.

## Dependencies

- **Blocked By**: ticket-006 (crate doc spec coverage audit establishes the baseline), ticket-003 (math spec content integrity)
- **Blocks**: ticket-018/019 (remediation of findings), ticket-020 (glossary additions)

## Effort Estimate

**Points**: 3
**Confidence**: High
