# Findings Report: Spec Organization Coherence (Ticket-016)

**Auditor**: sddp-specialist agent
**Date**: 2026-02-25
**Scope**: 50-spec corpus organization, container pages, SUMMARY.md, cross-reference index, deferred.md
**Verdict**: No structural defects. Several ordering inconsistencies and minor improvement opportunities identified.

---

## 1. Section-by-Section Review

### 1.1 Overview (3 specs)

**Verdict**: SOUND

**Rationale**: The three specs (Design Principles, Notation Conventions, Production Scale Reference) are correctly positioned as foundational prerequisites. Every other section references at least one of these. The reading order (principles, then notation, then scale) is logical -- principles are conceptual, notation is symbolic, and scale is quantitative. No spec in this section belongs elsewhere, and no spec from another section belongs here.

### 1.2 Mathematical Formulations (14 specs)

**Verdict**: SOUND

**Rationale**: All 14 specs are pure mathematical formulations: Bellman recursion, LP structure, system element definitions, cut algebra, risk measures, stopping criteria, etc. The section correctly excludes implementation-level concerns (those are in Architecture) and data format concerns (those are in Data Model). The boundary between math and architecture is clean -- for example, `cut-management.md` defines the cut generation/selection mathematics while `cut-management-impl.md` in Architecture defines the runtime data structures and MPI synchronization.

One observation: `PAR Inflow Model` is a stochastic modeling spec that could conceptually live alongside `Scenario Generation` in Architecture. However, its content is purely mathematical (model definition, fitting equations, validation statistics), so its placement in Math is appropriate.

### 1.3 Data Model (10 specs)

**Verdict**: SOUND

**Rationale**: The 10 specs follow a clear lifecycle progression: input directory structure, then entity registries, then hydro extensions, then scenarios, then constraints, then penalty system, then internal structures, then output schemas, then output infrastructure, then binary formats. This input-internal-output flow is coherent and well-motivated. No spec is misplaced.

### 1.4 Architecture (13 specs)

**Verdict**: SOUND

**Rationale**: All 13 specs describe behavioral contracts at the software architecture level: the training loop, simulation engine, solver abstraction and its two implementations, solver workspaces, scenario generation pipeline, input loading pipeline, extension points, CLI lifecycle, validation pipeline, convergence monitoring, and cut management implementation. The section correctly bridges between the mathematical formulations (what to compute) and the HPC section (how to distribute computation). No spec is misplaced.

### 1.5 High-Performance Computing (8 specs)

**Verdict**: SOUND

**Rationale**: All 8 specs address parallelization and deployment concerns: work distribution, hybrid MPI+OpenMP parallelism, MPI communication patterns, NUMA-aware memory architecture, shared memory aggregation, synchronization barriers, checkpointing/fault-tolerance, and SLURM deployment. The boundary with Architecture is clean -- Architecture defines what happens at each algorithmic step, HPC defines how that step is distributed across hardware. No spec is misplaced.

### 1.6 Configuration (1 spec)

**Verdict**: SOUND

**Rationale**: The single Configuration Reference spec maps every tunable parameter to its LP-level consequence. It is correctly isolated from the Math and Architecture sections because it serves as a cross-cutting lookup reference rather than defining formulations or behavioral contracts. The container page accurately describes its cross-section dependencies.

### 1.7 Deferred Features (1 standalone spec)

**Verdict**: SOUND

**Rationale**: `deferred.md` collects planned-but-unimplemented features in a single document. It is correctly placed outside any section subdirectory since it references specs across all sections. Its standalone positioning under "Specifications" without its own container page is intentional and appropriate -- it would be over-engineering to create a `deferred/` subdirectory for a single document.

---

## 2. Container Page Accuracy Checklist

| Container Page     | Reading Order Accurate | Spec Index Complete | Description Accurate | Navigation Links Correct                |
| ------------------ | ---------------------- | ------------------- | -------------------- | --------------------------------------- |
| `overview.md`      | PASS                   | PASS                | PASS                 | PASS                                    |
| `math.md`          | PASS (see note 2A)     | PASS                | PASS                 | N/A (no navigation section)             |
| `data-model.md`    | PASS (see note 2B)     | PASS                | PASS                 | N/A (no navigation section)             |
| `architecture.md`  | PASS (see note 2C)     | PASS                | PASS                 | N/A (no navigation section)             |
| `hpc.md`           | PASS (see note 2D)     | PASS                | PASS                 | N/A (no navigation section)             |
| `configuration.md` | PASS                   | PASS                | PASS                 | PASS (Cross-Section References section) |

**Detailed Notes**:

**Note 2A (math.md reading order)**: The container page defines a pedagogically motivated reading order (SDDP Algorithm -> System Elements -> LP Formulation -> ...). This is an intentional pedagogical ordering that differs from the SUMMARY.md sidebar order (SDDP Algorithm -> LP Formulation -> System Elements -> ...). Both are valid orderings; the container page's order is more didactically appropriate. No defect.

**Note 2B (data-model.md reading order)**: Minor ordering difference with SUMMARY.md. Container page places Input Hydro Extensions (#3) before Input Scenarios (#4), while SUMMARY.md places Input Scenarios (#3) before Input Hydro Extensions (#5). The container page order is more logical because hydro extensions depend on entity registries (read just before), while scenarios have broader dependencies. No defect in container page.

**Note 2C (architecture.md reading order)**: The container page reading order differs significantly from SUMMARY.md sidebar order. For example, the container page places CLI and Lifecycle at position 10 (after core subsystem specs), while SUMMARY.md places it at position 3. The container page order builds concepts "from the outermost orchestration layer inward to the solver core" which is pedagogically sound. SUMMARY.md appears to use a different grouping principle (lifecycle first, then subsystems). Both are defensible.

**Note 2D (hpc.md reading order)**: Two differences with SUMMARY.md: (1) Synchronization is position 6 in container page but position 8 in SUMMARY.md; (2) Checkpointing is position 7 in container page but position 6 in SUMMARY.md. The container page order (synchronization before checkpointing) is slightly more logical since checkpointing relies on synchronization concepts.

**Spec Index Completeness**: For all 6 container pages, every spec listed in the Spec Index table exists on the filesystem, and every file in the corresponding subdirectory is listed in the Spec Index table. Zero missing entries, zero extra entries.

**Description Accuracy**: All container page introductions accurately describe their contents. Specific claims verified:

- `math.md` claims "14 specs" -- confirmed (14 files in `math/`)
- `data-model.md` claims "10 specs" -- confirmed (10 files in `data-model/`)
- `architecture.md` claims "13 specs" -- confirmed (13 files in `architecture/`)
- `hpc.md` claims "8 specs" -- confirmed (8 files in `hpc/`)
- `overview.md` claims "7 subsections" in navigation -- confirmed (overview, math, data-model, architecture, hpc, configuration, deferred)

**Navigation Links**: Only `overview.md` has a dedicated Navigation section with links to all 7 subsections. The `configuration.md` has a "Cross-Section References" paragraph with links to 3 other sections. The remaining 4 container pages (math, data-model, architecture, hpc) have no inter-section navigation links, relying on SUMMARY.md sidebar navigation instead.

---

## 3. SUMMARY.md Structure Verification

### 3.1 File Existence Check

Every file path referenced in SUMMARY.md under the "Specifications" heading exists on the filesystem. Conversely, every `.md` file under `src/specs/` (including subdirectories) is listed in SUMMARY.md.

**Result**: PASS -- zero broken links, zero missing files, zero orphan files.

### 3.2 Structural Observations

The SUMMARY.md Specifications section lists entries in this order:

1. Overview (3 specs)
2. Cross-Reference Index (standalone)
3. Mathematical Formulations (14 specs)
4. Data Model (10 specs)
5. Architecture (13 specs)
6. High-Performance Computing (8 specs)
7. Configuration (1 spec)
8. Deferred Features (standalone)

The Cross-Reference Index is placed between Overview and Mathematical Formulations (position 2), which is an unusual but defensible placement -- it serves as a navigation aid that readers might consult after reading the overview before diving into any specific section.

### 3.3 SUMMARY.md vs Container Page Ordering Differences

As noted in Section 2, the SUMMARY.md sidebar ordering of specs within a section sometimes differs from the container page's recommended reading order. These differences exist in 4 of 6 sections:

| Section      | Specs with Different Position | SUMMARY.md Position | Container Page Position |
| ------------ | ----------------------------- | ------------------- | ----------------------- |
| Math         | `system-elements`             | 3rd                 | 2nd                     |
| Math         | `lp-formulation`              | 2nd                 | 3rd                     |
| Math         | `equipment-formulations`      | 12th                | 5th                     |
| Math         | `block-formulations`          | 4th                 | 6th                     |
| Math         | `par-inflow-model`            | 11th                | 8th                     |
| Data Model   | `input-hydro-extensions`      | 5th                 | 3rd                     |
| Data Model   | `input-scenarios`             | 3rd                 | 4th                     |
| Data Model   | `input-constraints`           | 4th                 | 5th                     |
| Architecture | 10 of 13 specs differ         | (various)           | (various)               |
| HPC          | `synchronization`             | 8th                 | 6th                     |
| HPC          | `checkpointing`               | 6th                 | 7th                     |

This is not necessarily a defect -- SUMMARY.md controls the sidebar navigation order in mdBook and may be optimized for browsing, while container pages define a pedagogically optimal reading sequence. However, having two different orderings can confuse readers who navigate via the sidebar and encounter a different sequence than the container page recommends.

---

## 4. Cross-Reference Index Consistency

### 4.1 Spec-to-Crate Table (Section 1)

- Lists exactly 50 specs, numbered 1 through 50. PASS.
- All 50 file paths correspond to existing files. PASS.
- Section labels match the actual directory structure (overview, math, data-model, architecture, hpc, configuration, deferred). PASS.
- Numbering follows the order: overview (1-3), data-model (4-13), math (14-27), architecture (28-40), hpc (41-48), configuration (49), deferred (50). This order differs from SUMMARY.md's section order (overview, math, data-model, architecture, hpc, configuration, deferred). The cross-reference index places data-model before math, while SUMMARY.md places math before data-model. This is a minor inconsistency but does not affect correctness.

### 4.2 Per-Crate Reading Lists (Section 2)

- Lists 7 crates: cobre-sddp, cobre-core, cobre-io, cobre-stochastic, cobre-solver, cobre-cli, ferrompi. PASS.
- Each crate's reading list references valid spec file paths. PASS.
- Primary/secondary designations are consistent with the Section 1 table. PASS.

### 4.3 Outgoing Cross-Reference Table (Section 3)

- Covers all 50 specs grouped by section. PASS.
- All referenced target spec files exist. PASS.

### 4.4 Incoming Cross-Reference Table (Section 4)

- Covers all 50 specs grouped by section. PASS.
- All referenced source spec files exist. PASS.

### 4.5 Dependency Ordering (Section 5)

- Lists exactly 50 entries, ordered by incoming reference count (descending). PASS.
- All file paths are valid. PASS.
- The errata note correctly references "Epic 03 audit" and "Epic 06 remediation" from the prior plan (spec-migration-audit), not this plan. PASS per ticket instructions.

### 4.6 Section Order Inconsistency

The cross-reference index (Section 1) numbers specs in order: overview(1-3), data-model(4-13), math(14-27), ..., while SUMMARY.md and all container pages present sections in order: overview, math, data-model, .... This means the cross-reference index spec numbers do not follow the SUMMARY.md presentation order. For example, spec #4 is `input-directory-structure.md` (data-model), but in SUMMARY.md, the 4th spec entry after overview is `sddp-algorithm.md` (math).

This is a structural inconsistency between the cross-reference index and SUMMARY.md. It does not cause broken links but may confuse readers who expect the numbering to follow the sidebar order.

---

## 5. Deferred.md Organization Assessment

### 5.1 Feature Count

The ticket states "16-feature flat structure." The actual count is:

- **18 numbered features** (C.1 through C.18): GNL Thermal Plants, Battery Energy Storage, Multi-Cut Formulation, Markovian Policy Graphs, Non-Controllable Sources (marked IMPLEMENTED), FPHA Enhancements (3 sub-features), Temporal Scope Decoupling, CEPEL PAR(p)-A, Policy Compatibility Validation, Fine-Grained Temporal Resolution, User-Supplied Noise Openings, Complete Tree Solver Integration, Alternative Forward Pass, Monte Carlo Backward Sampling, Risk-Adjusted Forward Sampling, Revisiting Forward Pass, Forward Pass State Deduplication, Pipelined Backward Pass
- **3 unnumbered additional variants**: Objective States, Belief States (POMDP), Duality Handlers (Lagrangian Relaxation)
- **Total**: 21 entries (18 numbered + 3 unnumbered)

### 5.2 Status Distribution

| Status              | Count | Features                                                                                                   |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| DEFERRED            | 15    | C.1, C.3, C.4, C.7, C.8, C.10, C.11, C.13, C.14, C.15, C.16, C.17, C.18, + Objective States, Belief States |
| DEFERRED (partial)  | 2     | C.6 (core FPHA implemented), C.9 (requires dedicated spec)                                                 |
| DEFERRED (concept)  | 1     | C.12 (solver integration pending)                                                                          |
| IMPLEMENTED         | 1     | C.5 (Non-Controllable Sources)                                                                             |
| DEFERRED (research) | 1     | C.10                                                                                                       |
| Unnumbered          | 1     | Duality Handlers                                                                                           |

### 5.3 Adequacy Verdict: ADEQUATE with minor improvements suggested

**Strengths**:

- Each feature follows a consistent template: Status, Description, Planned Formulation (where applicable), Why Deferred, Prerequisites, Estimated Effort, References
- Cross-references to existing specs are provided where relevant
- Mathematical formulations are included for features that warrant them (batteries, multi-cut, Markov, FPHA enhancements, temporal decoupling)
- The "Additional Deferred Algorithm Variants" section at the end captures lower-priority items without full templates

**Weaknesses**:

- The flat structure mixes very different feature categories: new physical elements (C.1, C.2, C.5), algorithm variants (C.3, C.4, C.13-C.16, C.17-C.18), data model extensions (C.8, C.11), cross-cutting concerns (C.9), and advanced modeling (C.6, C.7, C.10, C.12)
- C.5 (Non-Controllable Sources) is marked IMPLEMENTED but retained in the deferred list "for reference" -- this clutters the document
- Features C.17 and C.18 were added after the original C.1-C.16 numbering and are separated from thematically related features (C.17 relates to forward pass like C.13/C.16; C.18 relates to HPC parallelization)
- The 3 unnumbered variants at the end break the C.N numbering scheme

### 5.4 Grouping Recommendation

If the deferred list continues to grow, grouping by category would improve navigability:

1. **Physical System Extensions**: C.1 (GNL), C.2 (Batteries), C.5 (NCS -- already implemented), C.6 (FPHA Enhancements)
2. **Algorithm Variants**: C.3 (Multi-Cut), C.4 (Markov), C.13 (Alt Forward), C.14 (MC Backward), C.15 (Risk-Adjusted), C.16 (Revisiting), C.17 (Dedup), C.18 (Pipelined Backward), Objective States, Belief States, Duality Handlers
3. **Temporal Modeling**: C.7 (Temporal Decoupling), C.10 (Typical Days)
4. **Stochastic Modeling**: C.8 (PAR(p)-A), C.11 (User Noise)
5. **Infrastructure**: C.9 (Policy Validation), C.12 (Complete Tree)

However, at the current scale (21 entries), the flat structure is still navigable. Grouping is recommended only if the list grows beyond ~25 entries.

---

## 6. Prioritized Improvement Recommendations

### 6.1 HIGH Priority

None identified. The spec organization is structurally sound with no broken links, missing files, or misplaced specs.

### 6.2 MEDIUM Priority

#### M-1: Harmonize SUMMARY.md Order with Container Page Reading Order

**Description**: SUMMARY.md sidebar ordering diverges from container page recommended reading order in 4 of 6 sections (Math, Data Model, Architecture, HPC). This creates two conflicting navigation paths. Consider aligning SUMMARY.md to match the container page reading orders, since those orders are pedagogically motivated and documented with rationale.

**Affected files**:

- `/home/rogerio/git/cobre-docs/src/SUMMARY.md` (reorder entries within Math, Data Model, Architecture, and HPC sections)

**Priority**: MEDIUM -- causes confusion but not incorrectness.

#### M-2: Add Navigation Sections to Non-Overview Container Pages

**Description**: Only `overview.md` has a Navigation section listing all 7 subsections. The other 4 container pages (math, data-model, architecture, hpc) lack inter-section navigation. Adding a brief Navigation paragraph to each would help readers move between sections without relying on the sidebar.

**Affected files**:

- `/home/rogerio/git/cobre-docs/src/specs/math.md`
- `/home/rogerio/git/cobre-docs/src/specs/data-model.md`
- `/home/rogerio/git/cobre-docs/src/specs/architecture.md`
- `/home/rogerio/git/cobre-docs/src/specs/hpc.md`

**Priority**: MEDIUM -- improves navigation ergonomics.

#### M-3: Align Cross-Reference Index Section Order with SUMMARY.md

**Description**: The cross-reference index (Section 1 table) numbers specs with data-model (4-13) before math (14-27), while SUMMARY.md and all container pages present math before data-model. Renumbering the cross-reference index to follow SUMMARY.md order would eliminate this inconsistency.

**Affected files**:

- `/home/rogerio/git/cobre-docs/src/specs/cross-reference-index.md` (Section 1 table renumbering, Section 5 reordering)

**Priority**: MEDIUM -- causes reader confusion when cross-referencing between index and sidebar.

### 6.3 LOW Priority

#### L-1: Remove or Archive Implemented Feature C.5 from Deferred.md

**Description**: C.5 (Non-Controllable Sources) is marked IMPLEMENTED with a note that formulation details are retained "for reference." Since the feature is now fully specified in Equipment Formulations, Input System Entities, and Penalty System, the retained formulation details in deferred.md are redundant. Consider reducing C.5 to a one-line "IMPLEMENTED -- see [Equipment Formulations](...)" note.

**Affected files**:

- `/home/rogerio/git/cobre-docs/src/specs/deferred.md` (C.5 section)

**Priority**: LOW -- minor clutter, no functional impact.

#### L-2: Number the Three Unnumbered Additional Variants

**Description**: The "Additional Deferred Algorithm Variants" section contains 3 features (Objective States, Belief States, Duality Handlers) as H3 subsections without C.N numbers. For consistency with the rest of the document, these should be numbered C.19, C.20, C.21 (or equivalent) with the standard template fields.

**Affected files**:

- `/home/rogerio/git/cobre-docs/src/specs/deferred.md` (Additional Variants section)

**Priority**: LOW -- cosmetic inconsistency, no functional impact.

#### L-3: Add Table of Contents to Deferred.md

**Description**: At 830 lines with 21 features, `deferred.md` would benefit from a table of contents at the top (after the Purpose section) linking to each C.N entry. This would allow readers to quickly locate specific deferred features.

**Affected files**:

- `/home/rogerio/git/cobre-docs/src/specs/deferred.md` (add TOC after Purpose section)

**Priority**: LOW -- convenience improvement for a long document.

#### L-4: Fix Ticket-016 Feature Count Reference

**Description**: The ticket description states "16-feature flat structure" for deferred.md. The actual count is 18 numbered features (C.1-C.18) plus 3 unnumbered variants (21 total). This is not a spec defect but a plan description inaccuracy. Noted for awareness.

**Affected files**: None (plan description, not a spec file).

**Priority**: LOW -- informational only.

---

## 7. Summary

| Check                                                        | Result                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| Section grouping: all 50 specs appropriately placed          | PASS (7/7 sections SOUND)                                |
| Container page spec index completeness                       | PASS (6/6 container pages, zero missing/extra entries)   |
| Container page description accuracy                          | PASS (all claims verified)                               |
| Container page reading order internal consistency            | PASS (pedagogically motivated, documented rationale)     |
| SUMMARY.md file tree match                                   | PASS (zero broken links, zero orphans)                   |
| Cross-reference index: 50 specs listed                       | PASS                                                     |
| Cross-reference index: all file paths valid                  | PASS                                                     |
| Cross-reference index: consistent with container pages       | PASS (with M-3 noted)                                    |
| Deferred.md: 21 features documented with consistent template | PASS                                                     |
| Deferred.md: flat structure adequate at current scale        | PASS                                                     |
| SUMMARY.md order vs container page reading order alignment   | DIVERGENT (4/6 sections, see M-1)                        |
| Inter-section navigation on container pages                  | PARTIAL (only overview.md and configuration.md, see M-2) |
| Cross-reference index numbering vs SUMMARY.md order          | DIVERGENT (see M-3)                                      |

**No spec files were modified during this audit.**
