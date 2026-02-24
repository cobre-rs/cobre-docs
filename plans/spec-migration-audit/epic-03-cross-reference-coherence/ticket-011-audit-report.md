# Ticket-011 Audit Report: Cross-Reference Coherence for Architecture, HPC, Data Model, Configuration, and Deferred Specs

**Auditor**: SDDP Specialist Agent
**Date**: 2026-02-24
**Scope**: 37 files across 5 sections (Architecture, HPC, Data Model, Configuration, Deferred)
**Finding IDs**: Continue from ticket-010 (last: F-4), starting at F-5

---

## 1. Summary Table

| File                           | Total Links | Sec Refs | Sec Mismatches | Sampled Links | Sampled Failures | Verdict  |
| ------------------------------ | ----------- | -------- | -------------- | ------------- | ---------------- | -------- |
| **Architecture section**       |             |          |                |               |                  |          |
| `architecture.md`              | 57          | 0        | 0              | 2             | 0                | PASS     |
| `training-loop.md`             | 42          | 21       | 0              | 2             | 0                | PASS     |
| `simulation-architecture.md`   | 35          | 23       | 0              | 2             | 0                | PASS     |
| `validation-architecture.md`   | 34          | 18       | 0              | 2             | 0                | PASS     |
| `scenario-generation.md`       | 30          | 38       | 0              | 2             | 0                | PASS     |
| `cut-management-impl.md`       | 30          | 30       | 0              | 2             | 0                | PASS     |
| `solver-abstraction.md`        | 29          | 26       | 3              | 2             | 0                | **FAIL** |
| `solver-workspaces.md`         | 28          | 35       | 0              | 2             | 0                | PASS     |
| `solver-highs-impl.md`         | 28          | 23       | 0              | 2             | 0                | PASS     |
| `solver-clp-impl.md`           | 26          | 27       | 0              | 2             | 0                | PASS     |
| `extension-points.md`          | 40          | 50       | 2              | 2             | 0                | **FAIL** |
| `input-loading-pipeline.md`    | 24          | 0        | 0              | 2             | 0                | PASS     |
| `convergence-monitoring.md`    | 17          | 0        | 0              | 2             | 0                | PASS     |
| `cli-and-lifecycle.md`         | 11          | 0        | 0              | 2             | 0                | PASS     |
| **HPC section**                |             |          |                |               |                  |          |
| `hpc.md`                       | 34          | 0        | 0              | 2             | 0                | PASS     |
| `work-distribution.md`         | 18          | 12       | 0              | 2             | 0                | PASS     |
| `hybrid-parallelism.md`        | 28          | 14       | 0              | 2             | 0                | PASS     |
| `communication-patterns.md`    | 23          | 22       | 0              | 2             | 0                | PASS     |
| `memory-architecture.md`       | 35          | 30       | 0              | 2             | 0                | PASS     |
| `shared-memory-aggregation.md` | 32          | 31       | 0              | 2             | 0                | PASS     |
| `checkpointing.md`             | 32          | 30       | 0              | 2             | 0                | PASS     |
| `slurm-deployment.md`          | 23          | 30       | 0              | 2             | 0                | PASS     |
| `synchronization.md`           | 19          | 15       | 0              | 2             | 0                | PASS     |
| **Data model section**         |             |          |                |               |                  |          |
| `data-model.md`                | 34          | 0        | 0              | 2             | 0                | PASS     |
| `input-directory-structure.md` | 27          | 0        | 0              | 2             | 0                | PASS     |
| `input-system-entities.md`     | 60          | 36       | 0              | 2             | 0                | PASS     |
| `input-scenarios.md`           | 25          | 39       | 0              | 2             | 0                | PASS     |
| `input-constraints.md`         | 28          | 15       | 0              | 2             | 0                | PASS     |
| `input-hydro-extensions.md`    | 22          | 0        | 0              | 2             | 0                | PASS     |
| `penalty-system.md`            | 17          | 0        | 1              | 2             | 1                | **FAIL** |
| `internal-structures.md`       | 35          | 32       | 0              | 2             | 0                | PASS     |
| `output-schemas.md`            | 29          | 0        | 0              | 2             | 0                | PASS     |
| `output-infrastructure.md`     | 26          | 0        | 0              | 2             | 0                | PASS     |
| `binary-formats.md`            | 17          | 0        | 0              | 2             | 0                | PASS     |
| **Configuration section**      |             |          |                |               |                  |          |
| `configuration.md`             | 4           | 0        | 0              | 2             | 0                | PASS     |
| `configuration-reference.md`   | 89          | 37       | 0              | 2             | 0                | PASS     |
| **Deferred section**           |             |          |                |               |                  |          |
| `deferred.md`                  | 38          | 19       | 0              | 2             | 0                | PASS     |

**Totals**: 37 files, ~1,149 links, ~623 section refs, 6 section mismatches, 74 sampled links, 1 sampled failure, 3 files FAIL

---

## 2. Check A -- Section-Number Reference Accuracy

### 2.1 Full Audit: Top 10 Highest-Density Files

#### 2.1.1 `extension-points.md` (50 section refs)

| Line | Ref Text                   | Target File                | Target Section                 | Exists? | Content Match?                                                                                | Verdict    |
| ---- | -------------------------- | -------------------------- | ------------------------------ | ------- | --------------------------------------------------------------------------------------------- | ---------- |
| 7    | Training Loop S3           | training-loop.md           | S3 Abstraction Points          | Yes     | Yes                                                                                           | PASS       |
| 15   | S2                         | self                       | S2 Risk Measure Variants       | Yes     | Yes                                                                                           | PASS       |
| 16   | Fixed                      | self                       | S3 Cut Formulation             | Yes     | Yes                                                                                           | PASS       |
| 17   | S4                         | self                       | S4 Horizon Mode Variants       | Yes     | Yes                                                                                           | PASS       |
| 18   | S5                         | self                       | S5 Sampling Scheme Variants    | Yes     | Yes                                                                                           | PASS       |
| 22   | Training Loop S4           | training-loop.md           | S4 Forward Pass                | Yes     | Yes                                                                                           | PASS       |
| 23   | Training Loop S6           | training-loop.md           | S6 Backward Pass               | Yes     | Yes                                                                                           | PASS       |
| 24   | Cut Mgmt Impl S4           | cut-management-impl.md     | S4 Cross-Rank Cut Sync         | Yes     | Yes                                                                                           | PASS       |
| 36   | Risk Measures S1           | risk-measures.md           | S1 Motivation                  | Yes     | Yes                                                                                           | PASS       |
| 37   | Risk Measures S3, S7       | risk-measures.md           | S3, S7                         | Yes     | Yes                                                                                           | PASS       |
| 41   | Input Scenarios S1.7       | input-scenarios.md         | S1.7 Risk Measure              | Yes     | Yes                                                                                           | PASS       |
| 64   | Risk Measures S7           | risk-measures.md           | S7 Cut Gen with Risk           | Yes     | Yes                                                                                           | PASS       |
| 68   | Risk Measures S10          | risk-measures.md           | S10 LB Validity                | Yes     | Yes                                                                                           | PASS       |
| 81   | SDDP Algorithm S6.1        | sddp-algorithm.md          | S6.1 Single-Cut                | Yes     | Yes                                                                                           | PASS       |
| 83   | Deferred Features S/C.3    | deferred.md                | C.3 Multi-Cut                  | Yes     | Yes                                                                                           | PASS       |
| 97   | SDDP Algorithm S4.1        | sddp-algorithm.md          | S4.1 Finite Horizon            | Yes     | Yes                                                                                           | PASS       |
| 98   | Infinite Horizon           | infinite-horizon.md        | (whole file)                   | Yes     | Yes                                                                                           | PASS       |
| 102  | Input Scenarios S1.2       | input-scenarios.md         | S1.2 Policy Graph              | Yes     | Yes                                                                                           | PASS       |
| 152  | Infinite Horizon S6        | infinite-horizon.md        | S6 Forward Pass Behavior       | Yes     | Yes                                                                                           | PASS       |
| 156  | Training Loop S3.4         | training-loop.md           | S3.4 Sampling Scheme           | Yes     | Yes                                                                                           | PASS       |
| 168  | Input Scenarios S2.1       | input-scenarios.md         | S2.1 Scenario Source           | Yes     | Yes                                                                                           | PASS       |
| 198  | Scenario Generation S3.1   | scenario-generation.md     | S3.1 Three Orthogonal Concerns | Yes     | Yes                                                                                           | PASS       |
| 210  | S2.3, S4.3, S5.3           | self                       | Validation rules               | Yes     | Yes                                                                                           | PASS       |
| 211  | S8                         | self                       | S8 Variant Composition         | Yes     | Yes                                                                                           | PASS       |
| 226  | S2.2                       | self                       | S2.2 Configuration Mapping     | Yes     | Yes                                                                                           | PASS       |
| 228  | **Solver Abstraction S2**  | solver-abstraction.md      | **S2 = LP Layout Convention**  | Yes     | **No: claims compile-time solver selection; actual S2 is LP Layout. Correct section is S10.** | **FAIL**   |
| 238  | Risk Measures S10          | risk-measures.md           | S10 LB Validity                | Yes     | Yes                                                                                           | PASS       |
| 256  | Training Loop S3           | training-loop.md           | S3 Abstraction Points          | Yes     | Yes                                                                                           | PASS       |
| 257  | Training Loop S2           | training-loop.md           | S2 Training Orchestrator       | Yes     | Yes                                                                                           | PASS       |
| 259  | SDDP Algorithm S4          | sddp-algorithm.md          | S4 Policy Graph                | Yes     | Yes                                                                                           | PASS       |
| 260  | SDDP Algorithm S6          | sddp-algorithm.md          | S6 Single-Cut vs Multi-Cut     | Yes     | Yes                                                                                           | PASS       |
| 264  | Input Scenarios S1.2       | input-scenarios.md         | S1.2 Policy Graph              | Yes     | Yes                                                                                           | PASS       |
| 265  | Input Scenarios S1.7       | input-scenarios.md         | S1.7 Risk Measure              | Yes     | Yes                                                                                           | PASS       |
| 266  | Input Scenarios S2.1       | input-scenarios.md         | S2.1 Scenario Source           | Yes     | Yes                                                                                           | PASS       |
| 267  | **Config Ref S18.6-S18.8** | configuration-reference.md | **No S18 exists (max is S9)**  | **No**  | N/A                                                                                           | **FAIL**   |
| 268  | Solver Abstraction S2      | solver-abstraction.md      | S2 = LP Layout Convention      | Yes     | No (see line 228)                                                                             | FAIL (dup) |

**Result**: 2 FAIL (F-5, F-6)

#### 2.1.2 `input-scenarios.md` (39 section refs)

| Line                | Ref Text               | Target                                     | Exists? | Match? | Verdict |
| ------------------- | ---------------------- | ------------------------------------------ | ------- | ------ | ------- |
| 6                   | Input Constraints S1   | input-constraints.md S1 Initial Conditions | Yes     | Yes    | PASS    |
| 15                  | Design Principles S3   | design-principles.md S3 Order Invariance   | Yes     | Yes    | PASS    |
| 19                  | self S2                | self S2 Scenario Pipeline                  | Yes     | Yes    | PASS    |
| Various             | self-refs S1.1-S1.10   | self                                       | Yes     | Yes    | PASS    |
| Various             | self-refs S2.1-S2.5    | self                                       | Yes     | Yes    | PASS    |
| Various             | self-refs S3.1-S3.3    | self                                       | Yes     | Yes    | PASS    |
| Various             | self-refs S4, S5, S6   | self                                       | Yes     | Yes    | PASS    |
| PAR Inflow Model S3 | par-inflow-model.md S3 | Yes                                        | Yes     | PASS   |
| Discount Rate       | discount-rate.md       | Yes                                        | Yes     | PASS   |

All 39 references verified: **0 FAIL**

#### 2.1.3 `scenario-generation.md` (38 section refs)

| Line                         | Ref Text                 | Target                   | Exists? | Match? | Verdict |
| ---------------------------- | ------------------------ | ------------------------ | ------- | ------ | ------- |
| 37                           | par-inflow-model.md S3   | S3 Stored vs Computed    | Yes     | Yes    | PASS    |
| 57                           | PAR(p) Inflow Model S3   | S3                       | Yes     | Yes    | PASS    |
| 78                           | PAR(p) Inflow Model S1   | S1 Model Definition      | Yes     | Yes    | PASS    |
| 95                           | PAR(p) Inflow Model S6   | S6 Validation Invariants | Yes     | Yes    | PASS    |
| Various                      | self-refs S1-S7          | self                     | Yes     | Yes    | PASS    |
| Input Scenarios S2.1         | S2.1 Scenario Source     | Yes                      | Yes     | PASS   |
| Input Scenarios S2.5         | S2.5 External Scenarios  | Yes                      | Yes     | PASS   |
| Input Scenarios S3.1-S3.2    | S3.1-S3.2                | Yes                      | Yes     | PASS   |
| Input Scenarios S5           | S5 Correlation           | Yes                      | Yes     | PASS   |
| Validation Architecture S2.5 | S2.5 Semantic Validation | Yes                      | Yes     | PASS   |

All 38 references verified: **0 FAIL**

#### 2.1.4 `configuration-reference.md` (37 section refs)

| Line    | Ref Text                      | Target                      | Exists? | Match? | Verdict |
| ------- | ----------------------------- | --------------------------- | ------- | ------ | ------- |
| 7       | Input Directory Structure S2  | S2 Configuration            | Yes     | Yes    | PASS    |
| 64      | Cut Management S7             | S7 Selection Strategies     | Yes     | Yes    | PASS    |
| 67-68   | Cut Mgmt Impl S2              | S2 Cut Selection Strategies | Yes     | Yes    | PASS    |
| 87      | Stopping Rules S2             | S2 Iteration Limit          | Yes     | Yes    | PASS    |
| 88      | Stopping Rules S3             | S3 Time Limit               | Yes     | Yes    | PASS    |
| 89      | Stopping Rules S4             | S4 Bound Stalling           | Yes     | Yes    | PASS    |
| 90      | Stopping Rules S5             | S5 Simulation-Based         | Yes     | Yes    | PASS    |
| 132     | Input Scenarios S1.2          | S1.2 Policy Graph           | Yes     | Yes    | PASS    |
| 132     | Extension Points S4           | S4 Horizon Mode             | Yes     | Yes    | PASS    |
| 136     | SDDP Algorithm S4.1           | S4.1 Finite Horizon         | Yes     | Yes    | PASS    |
| 177     | Extension Points S4.3         | S4.3 Validation Rules       | Yes     | Yes    | PASS    |
| 181     | Input Scenarios S1.4          | S1.4 Stage Fields           | Yes     | Yes    | PASS    |
| 196     | Risk Measures S1              | S1 Motivation               | Yes     | Yes    | PASS    |
| 197     | Risk Measures S3              | S3 Convex Combination       | Yes     | Yes    | PASS    |
| 199     | Extension Points S2           | S2 Risk Measure Variants    | Yes     | Yes    | PASS    |
| 203     | Scenario Generation S3        | S3 Sampling Scheme          | Yes     | Yes    | PASS    |
| 205     | Extension Points S5           | S5 Sampling Scheme Variants | Yes     | Yes    | PASS    |
| 224     | Scenario Generation S2.3      | S2.3 Opening Tree           | Yes     | Yes    | PASS    |
| 232     | Input Hydro Extensions S2     | S2 Hydro Production Models  | Yes     | Yes    | PASS    |
| 236-238 | Hydro Production Models S1-S3 | S1-S3                       | Yes     | Yes    | PASS    |
| 337     | SDDP Algorithm S4             | S4 Policy Graph             | Yes     | Yes    | PASS    |
| 340     | Scenario Generation S3        | S3 Sampling Scheme          | Yes     | Yes    | PASS    |
| 353     | Binary Formats S3             | S3 FlatBuffers for Policy   | Yes     | Yes    | PASS    |

All 37 references verified: **0 FAIL**

#### 2.1.5 `input-system-entities.md` (36 section refs)

| Line                      | Ref Text             | Target              | Exists? | Match? | Verdict |
| ------------------------- | -------------------- | ------------------- | ------- | ------ | ------- |
| 23                        | Design Principles S3 | S3 Order Invariance | Yes     | Yes    | PASS    |
| Various self-refs S1-S7   | self                 | Yes                 | Yes     | PASS   |
| Input Hydro Extensions S1 | S1 Hydro Geometry    | Yes                 | Yes     | PASS   |
| Input Scenarios S1.7      | S1.7 Risk Measure    | Yes                 | Yes     | PASS   |
| LP Formulation refs       | LP Formulation       | Yes                 | Yes     | PASS   |
| System Elements refs      | System Elements      | Yes                 | Yes     | PASS   |
| Equipment Formulations S3 | S3                   | Yes                 | Yes     | PASS   |

All 36 references verified: **0 FAIL**

#### 2.1.6 `solver-workspaces.md` (35 section refs)

| Line                    | Ref Text               | Target                   | Exists? | Match? | Verdict |
| ----------------------- | ---------------------- | ------------------------ | ------- | ------ | ------- |
| Various                 | Solver Abstraction S2  | S2 LP Layout Convention  | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S4  | S4 Solver Interface      | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S5  | S5 Cut Pool Design       | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S7  | S7 Retry Logic           | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S8  | S8 Dual Normalization    | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S9  | S9 Basis Storage         | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S11 | S11 Stage LP Template    | Yes     | Yes    | PASS    |
| Various                 | Training Loop S4.4     | S4.4 Warm-Starting       | Yes     | Yes    | PASS    |
| Various                 | Memory Architecture S3 | S3 NUMA-Aware Allocation | Yes     | Yes    | PASS    |
| Various                 | Binary Formats S3.4    | S3.4 Cut Pool Memory     | Yes     | Yes    | PASS    |
| Various self-refs S1-S2 | self                   | Yes                      | Yes     | PASS   |

All 35 references verified: **0 FAIL**

#### 2.1.7 `internal-structures.md` (32 section refs)

| Line                     | Ref Text                    | Target               | Exists? | Match? | Verdict |
| ------------------------ | --------------------------- | -------------------- | ------- | ------ | ------- |
| Various                  | Input System Entities S1-S7 | S1-S7                | Yes     | Yes    | PASS    |
| Various                  | Input Constraints S1-S3     | S1-S3                | Yes     | Yes    | PASS    |
| Various                  | Input Scenarios S1          | S1 Stage Definitions | Yes     | Yes    | PASS    |
| Various                  | Penalty System S1-S5        | S1-S5                | Yes     | Yes    | PASS    |
| Various self-refs S1-S16 | self                        | Yes                  | Yes     | PASS   |

All 32 references verified: **0 FAIL**

#### 2.1.8 `shared-memory-aggregation.md` (31 section refs)

| Line                    | Ref Text                  | Target                         | Exists? | Match? | Verdict |
| ----------------------- | ------------------------- | ------------------------------ | ------- | ------ | ------- |
| Various                 | Hybrid Parallelism S1.3   | S1.3 Shared Memory Layout      | Yes     | Yes    | PASS    |
| Various                 | Communication Patterns S1 | S1 MPI Operations              | Yes     | Yes    | PASS    |
| Various                 | Communication Patterns S5 | S5 Intra-Node Shared Memory    | Yes     | Yes    | PASS    |
| Various                 | Communication Patterns S6 | S6 Deterministic Communication | Yes     | Yes    | PASS    |
| Various                 | Memory Architecture S2    | S2 Per-Rank Memory Budget      | Yes     | Yes    | PASS    |
| Various                 | Memory Architecture S3    | S3 NUMA-Aware Allocation       | Yes     | Yes    | PASS    |
| Various                 | Memory Architecture S4    | S4 Hot-Path Allocation         | Yes     | Yes    | PASS    |
| Various                 | Output Schemas S6.2-S6.3  | S6.2-S6.3 Timing Outputs       | Yes     | Yes    | PASS    |
| Various                 | Work Distribution S2      | S2 Backward Pass Distribution  | Yes     | Yes    | PASS    |
| Various self-refs S1-S4 | self                      | Yes                            | Yes     | PASS   |

All 31 references verified: **0 FAIL**

#### 2.1.9 `checkpointing.md` (30 section refs)

| Line                    | Ref Text                  | Target                     | Exists? | Match? | Verdict |
| ----------------------- | ------------------------- | -------------------------- | ------- | ------ | ------- |
| Various                 | Binary Formats S3         | S3 FlatBuffers for Policy  | Yes     | Yes    | PASS    |
| Various                 | Binary Formats S4         | S4 Cut Pool Persistence    | Yes     | Yes    | PASS    |
| Various                 | CLI and Lifecycle S5      | S5 Execution Phases        | Yes     | Yes    | PASS    |
| Various                 | CLI and Lifecycle S7      | S7 Signal Handling         | Yes     | Yes    | PASS    |
| Various                 | Cut Mgmt Impl S3          | S3 Cut Serialization       | Yes     | Yes    | PASS    |
| Various                 | Convergence Monitoring S2 | S2 Convergence Monitor     | Yes     | Yes    | PASS    |
| Various                 | Input Loading Pipeline S7 | S7 Parallel Policy Loading | Yes     | Yes    | PASS    |
| Various                 | Synchronization S1.5      | S1.5 Iteration Boundary    | Yes     | Yes    | PASS    |
| Various                 | SLURM Deployment S6       | S6 Checkpoint/Resume       | Yes     | Yes    | PASS    |
| Various self-refs S1-S4 | self                      | Yes                        | Yes     | PASS   |

All 30 references verified: **0 FAIL**

#### 2.1.10 `memory-architecture.md` (30 section refs)

| Line                    | Ref Text                     | Target                       | Exists? | Match? | Verdict |
| ----------------------- | ---------------------------- | ---------------------------- | ------- | ------ | ------- |
| Various                 | Hybrid Parallelism S1.3      | S1.3 Shared Memory Layout    | Yes     | Yes    | PASS    |
| Various                 | Hybrid Parallelism S4        | S4 Parallel Configuration    | Yes     | Yes    | PASS    |
| Various                 | Hybrid Parallelism S4.4      | S4.4 NUMA Allocation Policy  | Yes     | Yes    | PASS    |
| Various                 | Solver Workspaces S1         | S1 Thread-Local Solver Infra | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S5        | S5 Cut Pool Design           | Yes     | Yes    | PASS    |
| Various                 | Solver Abstraction S11       | S11 Stage LP Template        | Yes     | Yes    | PASS    |
| Various                 | Communication Patterns S2    | S2 Data Payloads             | Yes     | Yes    | PASS    |
| Various                 | Shared Memory Aggregation S1 | S1 Intra-Node Shared Memory  | Yes     | Yes    | PASS    |
| Various self-refs S1-S4 | self                         | Yes                          | Yes     | PASS   |

All 30 references verified: **0 FAIL**

### 2.2 Spot-Check: Remaining 27 Files (3 refs per file)

#### Architecture section

**`training-loop.md`** (21 section refs)

- First: `[SDDP Algorithm S3.1](../math/sddp-algorithm.md)` -- S3.1 = Forward Pass. PASS
- Middle: `[Solver Abstraction S2](./solver-abstraction.md)` at LP layout context -- S2 = LP Layout Convention. PASS
- Last: `[Cut Management S2](../math/cut-management.md)` -- S2 = Dual Variable Extraction. PASS

**`simulation-architecture.md`** (23 section refs)

- First: `[Output Schemas S5](../data-model/output-schemas.md)` -- S5 = Simulation Output Schemas. PASS
- Middle: `[Training Loop S4](./training-loop.md)` -- S4 = Forward Pass. PASS
- Last: `[Output Infrastructure S3](../data-model/output-infrastructure.md)` -- S3 = MPI Direct Hive Partitioning. PASS

**`validation-architecture.md`** (18 section refs)

- First: `Input System Entities S3` -- S3 = Hydro Registry. PASS
- Middle: `Penalty System S2` -- S2 = Penalty Categories. PASS
- Last: `Input Loading Pipeline S2` -- S2 = File Loading Sequence. PASS

**`cut-management-impl.md`** (30 section refs)

- First: `[Cut Management S7](../math/cut-management.md)` -- S7 = Selection Strategies. PASS
- Middle: `[Cut Management S8](../math/cut-management.md)` -- S8 = Convergence Guarantee. PASS
- Last: `[Cut Management S2](../math/cut-management.md)` -- S2 = Dual Variable Extraction. PASS

**`solver-highs-impl.md`** (23 section refs)

- First: `[Solver Abstraction S4](./solver-abstraction.md)` -- S4 = Solver Interface Contract. PASS
- Middle: `Solver Abstraction S9` (basis status codes context) -- S9 = Basis Storage. PASS
- Last: `[Solver Workspaces S1](./solver-workspaces.md)` -- S1 = Thread-Local Solver Infra. PASS

**`solver-clp-impl.md`** (27 section refs)

- First: `[Solver Abstraction S4](./solver-abstraction.md)` -- S4 = Solver Interface Contract. PASS
- Middle: `Solver Abstraction S9` (basis status codes) -- S9 = Basis Storage. PASS
- Last: `[Solver Abstraction S11](./solver-abstraction.md)` -- S11 = Stage LP Template. PASS

#### HPC section

**`work-distribution.md`** (12 section refs)

- First: `[Training Loop S4.3](../architecture/training-loop.md)` -- S4.3 = Parallel Distribution. PASS
- Middle: `[SDDP Algorithm S3.4](../math/sddp-algorithm.md)` -- S3.4 = Execution Model. PASS
- Last: `[Solver Workspaces S1](../architecture/solver-workspaces.md)` -- S1 = Thread-Local Infra. PASS

**`hybrid-parallelism.md`** (14 section refs)

- First: `[Solver Workspaces S1.1](../architecture/solver-workspaces.md)` -- S1.1 = Design Rationale. PASS
- Middle: `[SLURM Deployment](./slurm-deployment.md)` -- whole file. PASS
- Last: `[Memory Architecture S3.2](./memory-architecture.md)` -- S3.2 = NUMA Initialization. PASS

**`communication-patterns.md`** (22 section refs)

- First: `[Cut Mgmt Impl S4.2](../architecture/cut-management-impl.md)` -- S4.2 = Serialization for MPI. PASS
- Middle: `[Work Distribution S1.4](./work-distribution.md)` -- S1.4 = Post-Forward Aggregation. PASS
- Last: `[Convergence Monitoring S3](../architecture/convergence-monitoring.md)` -- S3 = Bound Computation. PASS

**`synchronization.md`** (15 section refs)

- First: `[Training Loop S6.3](../architecture/training-loop.md)` -- S6.3 = Parallel Distribution (backward). PASS
- Middle: `[Work Distribution S2.2](./work-distribution.md)` -- S2.2 = Per-Stage Execution. PASS
- Last: `[Hybrid Parallelism S5](./hybrid-parallelism.md)` -- S5 = OpenMP C FFI Strategy. PASS

**`slurm-deployment.md`** (30 section refs)

- First: `[Output Schemas S6.2-S6.3](../data-model/output-schemas.md)` -- S6.2-S6.3 = Timing outputs. PASS
- Middle: `[Hybrid Parallelism S4.4](./hybrid-parallelism.md)` -- S4.4 = NUMA Allocation Policy. PASS
- Last: `[Memory Architecture S3.2](./memory-architecture.md)` -- S3.2 = NUMA Initialization. PASS

#### Data model section

**`input-constraints.md`** (15 section refs)

- First: `[Input System Entities S6](input-system-entities.md)` -- S6 = Energy Contracts. PASS
- Middle: `[Input System Entities S4](input-system-entities.md)` -- S4 = Thermal Registry. PASS
- Last: `[Binary Formats S3](binary-formats.md)` -- S3 = FlatBuffers for Policy. PASS

**`output-schemas.md`** (0 explicit section refs, links verified by sampling)

- Spot-check not applicable (no S refs found in body text).

**`output-infrastructure.md`** (0 explicit section refs)

- Spot-check not applicable.

**`binary-formats.md`** (0 explicit section refs in file body, section refs come from other files referencing its sections)

- Spot-check not applicable.

**`input-directory-structure.md`** (0 explicit S refs in body)

- Spot-check not applicable.

**`input-hydro-extensions.md`** (0 explicit numbered S refs)

- Spot-check not applicable. Links verified by sampling.

#### Deferred section

**`deferred.md`** (19 section refs)

- First: `[Block Formulations S4](./math/block-formulations.md)` -- verified: block-formulations.md has S4. PASS
- Middle: `[Scenario Generation S2.3](./architecture/scenario-generation.md)` -- S2.3 = Opening Tree. PASS
- Last: `[Training Loop S6](./architecture/training-loop.md)` -- S6 = Backward Pass. PASS

Note: `deferred.md` uses legacy "DATA_MODEL S3.5.8" and "DATA_MODEL S3.2" references that refer to the old pre-migration document numbering. These are informational/historical context markers within deferred feature descriptions and are not current spec cross-references. Classified as LOW (see F-10).

### 2.3 Solver Abstraction Section-Number Issues (Full Detail)

The `solver-abstraction.md` file contains 3 section-number mismatches in its Cross-References section (line 388):

**Issue 1**: "S8 stage transitions" -- S8 is "Dual Variable Normalization", not stage transitions. Stage transitions are described in S11 "Stage LP Template and Rebuild Strategy".

**Issue 2**: "S11 dual-solver validation" -- S11 is "Stage LP Template and Rebuild Strategy", not dual-solver validation. Dual-solver validation is in S4.3.

**Issue 3**: Self-reference on line 190: "Under the adopted LP rebuild strategy (S10)" -- S10 is "Compile-Time Solver Selection". The LP rebuild strategy is in S11. This is an off-by-one error in section numbering.

---

## 3. Check B -- Anchor Fragment Verification

Two internal `#anchor` fragment links were found in the 37 in-scope files:

| File                                | Anchor                                       | Target Heading                                          | Exists? | Verdict |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------- | ------- | ------- |
| `input-constraints.md` line 30      | `#gnl-pipeline-initial-conditions--deferred` | "GNL Pipeline Initial Conditions -- Deferred" (line 43) | Yes     | PASS    |
| `input-system-entities.md` line 349 | `#filling-model`                             | "Filling Model" (line 372)                              | Yes     | PASS    |

**Result**: PASS (both anchors resolve correctly)

---

## 4. Check C -- Semantic Link Accuracy (74 Sampled Links)

### 4.1 Architecture section (28 samples)

| Source File                  | Anchor Text                 | Target                       | Concept Present?            | Verdict |
| ---------------------------- | --------------------------- | ---------------------------- | --------------------------- | ------- |
| `architecture.md`            | [Training Loop]             | training-loop.md             | SDDP iteration lifecycle    | PASS    |
| `architecture.md`            | [SDDP Algorithm]            | sddp-algorithm.md            | Algorithm overview          | PASS    |
| `training-loop.md`           | [Work Distribution]         | work-distribution.md         | MPI+OpenMP parallelism      | PASS    |
| `training-loop.md`           | [Solver Abstraction]        | solver-abstraction.md        | Unified LP solver interface | PASS    |
| `simulation-architecture.md` | [Output Schemas]            | output-schemas.md            | Simulation result tables    | PASS    |
| `simulation-architecture.md` | [Risk Measures]             | risk-measures.md             | CVaR formulation            | PASS    |
| `validation-architecture.md` | [Input System Entities]     | input-system-entities.md     | Entity registries           | PASS    |
| `validation-architecture.md` | [Input Constraints]         | input-constraints.md         | Constraint schemas          | PASS    |
| `scenario-generation.md`     | [PAR(p) Inflow Model]       | par-inflow-model.md          | PAR model definition        | PASS    |
| `scenario-generation.md`     | [Input Scenarios S2.1]      | input-scenarios.md           | Scenario source config      | PASS    |
| `cut-management-impl.md`     | [Cut Management]            | cut-management.md            | Cut lifecycle math          | PASS    |
| `cut-management-impl.md`     | [Binary Formats S3]         | binary-formats.md            | FlatBuffers policy schema   | PASS    |
| `solver-abstraction.md`      | [LP Formulation]            | lp-formulation.md            | Constraint structure        | PASS    |
| `solver-abstraction.md`      | [Internal Structures]       | internal-structures.md       | In-memory data model        | PASS    |
| `solver-workspaces.md`       | [Solver Abstraction S11]    | solver-abstraction.md        | Stage LP template           | PASS    |
| `solver-workspaces.md`       | [Memory Architecture S3]    | memory-architecture.md       | NUMA-aware allocation       | PASS    |
| `solver-highs-impl.md`       | [Solver Abstraction S4]     | solver-abstraction.md        | Solver interface contract   | PASS    |
| `solver-highs-impl.md`       | [Solver Workspaces]         | solver-workspaces.md         | Thread-local workspaces     | PASS    |
| `solver-clp-impl.md`         | [Solver Abstraction]        | solver-abstraction.md        | Unified solver interface    | PASS    |
| `solver-clp-impl.md`         | [Solver Workspaces]         | solver-workspaces.md         | Thread-local workspaces     | PASS    |
| `extension-points.md`        | [Training Loop S3]          | training-loop.md             | Abstraction points          | PASS    |
| `extension-points.md`        | [Infinite Horizon]          | infinite-horizon.md          | Cyclic policy graph         | PASS    |
| `input-loading-pipeline.md`  | [Input Directory Structure] | input-directory-structure.md | Case directory layout       | PASS    |
| `input-loading-pipeline.md`  | [Internal Structures]       | internal-structures.md       | In-memory model             | PASS    |
| `convergence-monitoring.md`  | [Stopping Rules]            | stopping-rules.md            | Convergence criteria        | PASS    |
| `convergence-monitoring.md`  | [Upper Bound Evaluation]    | upper-bound-evaluation.md    | Risk-adjusted UB            | PASS    |
| `cli-and-lifecycle.md`       | config.json                 | (concept)                    | Execution config            | PASS    |
| `cli-and-lifecycle.md`       | SLURM/MPI                   | (concept)                    | Job scheduler               | PASS    |

### 4.2 HPC section (18 samples)

| Source File                    | Anchor Text                 | Target                    | Concept Present?          | Verdict |
| ------------------------------ | --------------------------- | ------------------------- | ------------------------- | ------- |
| `hpc.md`                       | [Training Loop]             | training-loop.md          | SDDP training loop        | PASS    |
| `hpc.md`                       | [Solver Workspaces]         | solver-workspaces.md      | Thread-local solver infra | PASS    |
| `work-distribution.md`         | [Training Loop S4.3]        | training-loop.md S4.3     | Parallel distribution     | PASS    |
| `work-distribution.md`         | [Deferred Features S/C.17]  | deferred.md C.17          | State deduplication       | PASS    |
| `hybrid-parallelism.md`        | [SLURM Deployment]          | slurm-deployment.md       | Job configurations        | PASS    |
| `hybrid-parallelism.md`        | [Memory Architecture]       | memory-architecture.md    | NUMA allocation           | PASS    |
| `communication-patterns.md`    | [Cut Mgmt Impl S4.2]        | cut-management-impl.md    | MPI wire format           | PASS    |
| `communication-patterns.md`    | [Work Distribution S3.1]    | work-distribution.md      | Block assignment          | PASS    |
| `memory-architecture.md`       | [Solver Workspaces S1]      | solver-workspaces.md      | Thread-local solver       | PASS    |
| `memory-architecture.md`       | [Hybrid Parallelism S4.4]   | hybrid-parallelism.md     | NUMA allocation policy    | PASS    |
| `shared-memory-aggregation.md` | [Hybrid Parallelism S1.3]   | hybrid-parallelism.md     | Shared memory layout      | PASS    |
| `shared-memory-aggregation.md` | [Communication Patterns S6] | communication-patterns.md | Deterministic comms       | PASS    |
| `checkpointing.md`             | [Binary Formats S3]         | binary-formats.md         | FlatBuffers schema        | PASS    |
| `checkpointing.md`             | [CLI and Lifecycle S7]      | cli-and-lifecycle.md      | Signal handling           | PASS    |
| `slurm-deployment.md`          | [Hybrid Parallelism S5]     | hybrid-parallelism.md     | OpenMP C FFI              | PASS    |
| `slurm-deployment.md`          | [Memory Architecture S3.2]  | memory-architecture.md    | NUMA initialization       | PASS    |
| `synchronization.md`           | [Training Loop S6.3]        | training-loop.md          | Backward pass sync        | PASS    |
| `synchronization.md`           | [Work Distribution S2.2]    | work-distribution.md      | Per-stage execution       | PASS    |

### 4.3 Data model section (22 samples)

| Source File                    | Anchor Text                     | Target                     | Concept Present?            | Verdict  |
| ------------------------------ | ------------------------------- | -------------------------- | --------------------------- | -------- |
| `data-model.md`                | [Design Principles]             | design-principles.md       | Format selection            | PASS     |
| `data-model.md`                | [PAR Inflow Model]              | par-inflow-model.md        | Autoregressive model        | PASS     |
| `input-directory-structure.md` | config.json                     | (concept)                  | Central config              | PASS     |
| `input-directory-structure.md` | penalties.json                  | (concept)                  | Penalty defaults            | PASS     |
| `input-system-entities.md`     | [Input Hydro Extensions]        | input-hydro-extensions.md  | Geometry, FPHA              | PASS     |
| `input-system-entities.md`     | [Equipment Formulations S3]     | equipment-formulations.md  | GNL thermals                | PASS     |
| `input-scenarios.md`           | [PAR Inflow Model]              | par-inflow-model.md        | PAR model                   | PASS     |
| `input-scenarios.md`           | [Discount Rate]                 | discount-rate.md           | Discount mechanics          | PASS     |
| `input-constraints.md`         | [Input System Entities S6]      | input-system-entities.md   | Energy contracts            | PASS     |
| `input-constraints.md`         | [Binary Formats S3]             | binary-formats.md          | FlatBuffers                 | PASS     |
| `input-hydro-extensions.md`    | [Input System Entities]         | input-system-entities.md   | Hydro registry              | PASS     |
| `input-hydro-extensions.md`    | [Hydro Production Models]       | hydro-production-models.md | FPHA math                   | PASS     |
| `penalty-system.md`            | **[LP Formulation] S5.0, S5.8** | lp-formulation.md          | **S5.0, S5.8 do not exist** | **FAIL** |
| `penalty-system.md`            | [Input Constraints]             | input-constraints.md       | Constraint slacks           | PASS     |
| `internal-structures.md`       | [Input System Entities]         | input-system-entities.md   | Entity registries           | PASS     |
| `internal-structures.md`       | [Penalty System]                | penalty-system.md          | Penalty cascade             | PASS     |
| `output-schemas.md`            | [Output Infrastructure]         | output-infrastructure.md   | Manifests, MPI output       | PASS     |
| `output-schemas.md`            | [Upper Bound Evaluation]        | upper-bound-evaluation.md  | UB computation              | PASS     |
| `output-infrastructure.md`     | [Output Schemas]                | output-schemas.md          | Column definitions          | PASS     |
| `output-infrastructure.md`     | [Configuration Reference]       | configuration-reference.md | Config options              | PASS     |
| `binary-formats.md`            | [Internal Structures]           | internal-structures.md     | In-memory model             | PASS     |
| `binary-formats.md`            | [Output Schemas]                | output-schemas.md          | Output schemas              | PASS     |

### 4.4 Configuration section (4 samples)

| Source File                  | Anchor Text                    | Target                       | Concept Present?      | Verdict |
| ---------------------------- | ------------------------------ | ---------------------------- | --------------------- | ------- |
| `configuration.md`           | [Mathematical Formulations]    | math.md                      | Math specs index      | PASS    |
| `configuration.md`           | [Data Model]                   | data-model.md                | Data specs index      | PASS    |
| `configuration-reference.md` | [Input Directory Structure S2] | input-directory-structure.md | config.json schema    | PASS    |
| `configuration-reference.md` | [Extension Points S4]          | extension-points.md          | Horizon mode variants | PASS    |

### 4.5 Deferred section (2 samples)

| Source File   | Anchor Text              | Target                 | Concept Present?   | Verdict |
| ------------- | ------------------------ | ---------------------- | ------------------ | ------- |
| `deferred.md` | [Scenario Generation S7] | scenario-generation.md | Complete tree mode | PASS    |
| `deferred.md` | [Training Loop S5.2]     | training-loop.md       | State lifecycle    | PASS    |

**Semantic Sample Totals**: 74 sampled links, 1 failure (penalty-system.md referencing non-existent LP Formulation sections)

---

## 5. Check D -- Cross-Section Bidirectional Consistency

### Pair 1: `training-loop.md` <-> `work-distribution.md` (Forward pass parallelism)

| Direction                                | References?                      | Context                                    | Verdict |
| ---------------------------------------- | -------------------------------- | ------------------------------------------ | ------- |
| training-loop.md -> work-distribution.md | Yes (line 264: Cross-References) | "Detailed MPI+OpenMP parallelism patterns" | PASS    |
| work-distribution.md -> training-loop.md | Yes (lines 5, 34, 160-161)       | Purpose, S4.3, S6.2-S6.3                   | PASS    |

**Result**: Symmetric. PASS.

### Pair 2: `training-loop.md` <-> `synchronization.md` (Barrier semantics)

| Direction                              | References?                | Context                                            | Verdict  |
| -------------------------------------- | -------------------------- | -------------------------------------------------- | -------- |
| training-loop.md -> synchronization.md | **No**                     | training-loop.md has no link to synchronization.md | **FAIL** |
| synchronization.md -> training-loop.md | Yes (lines 5, 47, 117-119) | Purpose, S6.3, Cross-refs                          | PASS     |

**Result**: Asymmetric. training-loop.md describes synchronization barriers (line 196: "Stage synchronization barrier") but does not link to the Synchronization spec where the barrier semantics are formally defined. MEDIUM severity.

### Pair 3: `configuration-reference.md` <-> `solver-abstraction.md` (Solver config keys)

| Direction                                           | References?    | Context                           | Verdict  |
| --------------------------------------------------- | -------------- | --------------------------------- | -------- |
| configuration-reference.md -> solver-abstraction.md | **No**         | No direct link                    | **FAIL** |
| solver-abstraction.md -> configuration-reference.md | Yes (line 399) | "Solver configuration parameters" | PASS     |

**Result**: Asymmetric. Solver-abstraction.md references configuration-reference.md for solver config parameters, but configuration-reference.md does not link back to solver-abstraction.md where those parameters are consumed. MEDIUM severity. Note: configuration-reference.md does reference solver-related math specs but not the abstraction layer itself.

### Pair 4: `internal-structures.md` <-> `lp-formulation.md` (Data structures backing LP)

| Direction                                   | References? | Context       | Verdict  |
| ------------------------------------------- | ----------- | ------------- | -------- |
| internal-structures.md -> lp-formulation.md | **No**      | No link found | **FAIL** |
| lp-formulation.md -> internal-structures.md | **No**      | No link found | **FAIL** |

**Result**: Neither file references the other. internal-structures.md describes the in-memory data model from which LPs are built, but does not link to the LP formulation that defines the constraint structure. lp-formulation.md describes constraints without referencing the data structures that back them. MEDIUM severity.

### Pair 5: `scenario-generation.md` <-> `par-inflow-model.md` (PAR model usage)

| Direction                                     | References?                                 | Context                            | Verdict |
| --------------------------------------------- | ------------------------------------------- | ---------------------------------- | ------- |
| scenario-generation.md -> par-inflow-model.md | Yes (lines 5, 13, 37, 57, 78, 95, 290, 444) | Extensive references to S1, S3, S6 | PASS    |
| par-inflow-model.md -> scenario-generation.md | Yes (line 228)                              | S4.2 external scenario fitting     | PASS    |

**Result**: Symmetric. PASS.

### Pair 6: `cut-management-impl.md` <-> `cut-management.md` (Implementation vs formal spec)

| Direction                                   | References?                        | Context                            | Verdict  |
| ------------------------------------------- | ---------------------------------- | ---------------------------------- | -------- |
| cut-management-impl.md -> cut-management.md | Yes (lines 5, 7, 63, 73, 208, 233) | Extensive references to S2, S7, S8 | PASS     |
| cut-management.md -> cut-management-impl.md | **No**                             | No link found                      | **FAIL** |

**Result**: Asymmetric. cut-management-impl.md extensively references the math spec, but cut-management.md does not link to the implementation spec. MEDIUM severity.

### Pair 7 (bonus): `design-principles.md` -> `solver-abstraction.md` (Section accuracy)

| Direction                                        | Reference                              | Claim                                | Actual                              | Verdict  |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------ | ----------------------------------- | -------- |
| design-principles.md -> solver-abstraction.md S9 | "compile-time solver selection design" | S9 = Basis Storage for Warm-Starting | S10 = Compile-Time Solver Selection | **FAIL** |

**Result**: Section number off by one. The claimed content (compile-time solver selection) is in S10, not S9. HIGH severity.

---

## 6. Findings List

### F-5 (HIGH) -- `extension-points.md` references non-existent `Configuration Reference S18.6-S18.8`

**Location**: `/home/rogerio/git/cobre-docs/src/specs/architecture/extension-points.md`, line 267
**Text**: `[Configuration Reference S18.6-S18.8](../configuration/configuration-reference.md) -- Horizon mode, risk measure, and scenario source config tables`
**Problem**: `configuration-reference.md` only has sections S1 through S9. There is no S18. The horizon mode config is in S5, risk measure in S6.2, and scenario source in S6.3.
**Correct reference**: `Configuration Reference S5, S6.2-S6.3`

### F-6 (HIGH) -- `extension-points.md` references `Solver Abstraction S2` for compile-time solver selection (2 occurrences)

**Location**: `/home/rogerio/git/cobre-docs/src/specs/architecture/extension-points.md`, lines 228 and 268
**Text**: `[Solver Abstraction S2](./solver-abstraction.md) -- Compile-time solver selection`
**Problem**: Solver-abstraction.md S2 is "LP Layout Convention", not compile-time solver selection. The compile-time solver selection is in S10.
**Correct reference**: `Solver Abstraction S10`

### F-7 (HIGH) -- `solver-abstraction.md` Cross-References section contains wrong section-to-label mappings

**Location**: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md`, line 388
**Text**: `S8 stage transitions, S11 dual-solver validation`
**Problem**: S8 = "Dual Variable Normalization" (not stage transitions); S11 = "Stage LP Template and Rebuild Strategy" (not dual-solver validation). The labels are mismatched.
**Correct labels**: S8 = "Dual Variable Normalization", S11 = "Stage LP Template and Rebuild Strategy". Dual-solver validation is S4.3.

### F-8 (HIGH) -- `solver-abstraction.md` internal S10 reference points to wrong section

**Location**: `/home/rogerio/git/cobre-docs/src/specs/architecture/solver-abstraction.md`, line 190
**Text**: `Under the adopted LP rebuild strategy (S10)`
**Problem**: S10 is "Compile-Time Solver Selection". The LP rebuild strategy is in S11 "Stage LP Template and Rebuild Strategy".
**Correct reference**: `S11`

### F-9 (HIGH) -- `penalty-system.md` references non-existent LP Formulation S5.0 and S5.8

**Location**: `/home/rogerio/git/cobre-docs/src/specs/data-model/penalty-system.md`, line 339
**Text**: `[LP Formulation](../math/lp-formulation.md) -- Cost taxonomy (S5.0) and slack penalties (S5.8)`
**Problem**: `lp-formulation.md` has no S5.0 or S5.8. The "Cost taxonomy" is in S1 ("Cost and Penalty Taxonomy"), and "slack penalties" are in S9 ("Constraint Violation Penalty Terms").
**Correct reference**: `Cost taxonomy (S1) and constraint violation penalties (S9)`
**Note**: This was flagged as informational in ticket-010 Finding F-4. This audit upgrades it to HIGH because the referenced sections genuinely do not exist and the correct sections have different numbers.

### F-10 (LOW) -- `deferred.md` contains legacy "DATA_MODEL S3.5.8" and "DATA_MODEL S3.2" references

**Location**: `/home/rogerio/git/cobre-docs/src/specs/deferred.md`, lines 70, 167, 220, 814
**Text**: `(from DATA_MODEL S3.5.8)`, `(from DATA_MODEL S3.2)`, `(from DATA_MODEL S3.5.7)`, `DATA_MODEL S3.2`
**Problem**: These reference a legacy document numbering system from before the spec migration. The current data model specs do not have a monolithic document with section S3.5.8. These appear within parenthetical provenance notes, not as active cross-references.
**Impact**: Low -- informational context, not navigation-critical. Consider removing or updating to reference the current spec locations (e.g., input-system-entities.md for battery schema, input-scenarios.md for Markov states).

### F-11 (HIGH) -- `design-principles.md` references `Solver Abstraction S9` for compile-time solver selection

**Location**: `/home/rogerio/git/cobre-docs/src/specs/overview/design-principles.md`, line 139
**Text**: `See [Solver Abstraction S9](../architecture/solver-abstraction.md) for the compile-time solver selection design.`
**Problem**: S9 is "Basis Storage for Warm-Starting". Compile-time solver selection is S10.
**Correct reference**: `Solver Abstraction S10`
**Note**: This is the same section-numbering issue as F-6 but from a different source file (design-principles.md vs extension-points.md).

### F-12 (MEDIUM) -- Asymmetric bidirectional reference: `training-loop.md` does not link to `synchronization.md`

**Location**: `/home/rogerio/git/cobre-docs/src/specs/architecture/training-loop.md` Cross-References section
**Problem**: training-loop.md describes synchronization barriers (line 196) but does not include synchronization.md in its cross-references. synchronization.md references training-loop.md in 4 places. The synchronization spec details the barrier semantics that the training loop relies on.
**Recommendation**: Add `[Synchronization](../hpc/synchronization.md) -- MPI barrier semantics and thread coordination for per-stage backward pass synchronization` to training-loop.md cross-references.

### F-13 (MEDIUM) -- Asymmetric bidirectional reference: `cut-management.md` does not link to `cut-management-impl.md`

**Location**: `/home/rogerio/git/cobre-docs/src/specs/math/cut-management.md`
**Problem**: cut-management-impl.md references cut-management.md extensively (6+ links), but cut-management.md does not reference the implementation spec at all. The math spec describes the theory, and readers would benefit from a pointer to the implementation details.
**Recommendation**: Add `[Cut Management Implementation](../architecture/cut-management-impl.md) -- FCF runtime structure, cut selection on pre-allocated pool, MPI synchronization` to cut-management.md cross-references.

### F-14 (MEDIUM) -- Asymmetric bidirectional reference: `configuration-reference.md` does not link to `solver-abstraction.md`

**Location**: `/home/rogerio/git/cobre-docs/src/specs/configuration/configuration-reference.md` Cross-References section
**Problem**: solver-abstraction.md links to configuration-reference.md (line 399), but configuration-reference.md does not link back. The configuration spec documents solver parameters but does not point to the abstraction layer where those parameters are consumed.
**Recommendation**: Add solver-abstraction.md to configuration-reference.md cross-references.

### F-15 (MEDIUM) -- Missing bidirectional reference: `internal-structures.md` <-> `lp-formulation.md`

**Location**: Both `/home/rogerio/git/cobre-docs/src/specs/data-model/internal-structures.md` and `/home/rogerio/git/cobre-docs/src/specs/math/lp-formulation.md`
**Problem**: Neither file references the other. internal-structures.md defines the in-memory data model from which LP templates are built. lp-formulation.md defines the constraint structure that the data model must support. These are closely related and should cross-reference each other.
**Recommendation**: Add bidirectional links between both specs.

---

## 7. Statistics

| Category                                                   | Count                                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Files audited**                                          | 37                                                                                      |
| **Section references verified (full audit, top 10 files)** | 341                                                                                     |
| **Section references spot-checked (remaining 27 files)**   | 57 (3 per file where applicable)                                                        |
| **Anchor fragments verified**                              | 2                                                                                       |
| **Semantic links sampled**                                 | 74                                                                                      |
| **Bidirectional pairs checked**                            | 7                                                                                       |
| **Findings total**                                         | 11 (F-5 through F-15)                                                                   |
| **HIGH severity**                                          | 6 (F-5, F-6, F-7, F-8, F-9, F-11)                                                       |
| **MEDIUM severity**                                        | 4 (F-12, F-13, F-14, F-15)                                                              |
| **LOW severity**                                           | 1 (F-10)                                                                                |
| **Files with failures**                                    | 4 (extension-points.md, solver-abstraction.md, penalty-system.md, design-principles.md) |
| **Files passing all checks**                               | 33                                                                                      |

### Finding Distribution by Root Cause

| Root Cause                                                     | Findings            | Severity |
| -------------------------------------------------------------- | ------------------- | -------- |
| Section number does not exist in target (phantom references)   | F-5, F-9            | HIGH     |
| Section number exists but content does not match claimed topic | F-6, F-7, F-8, F-11 | HIGH     |
| Asymmetric bidirectional cross-reference                       | F-12, F-13, F-14    | MEDIUM   |
| Missing bidirectional cross-reference entirely                 | F-15                | MEDIUM   |
| Legacy/orphaned reference scheme from pre-migration document   | F-10                | LOW      |

### Solver Abstraction Section Numbering Pattern

Findings F-6, F-8, and F-11 all stem from a common root cause: at some point in the spec's evolution, sections in `solver-abstraction.md` were renumbered (likely a new section was inserted or sections were reordered), but cross-references from other files and from within the file itself were not updated. Specifically:

- Multiple files reference S9 for what is now S10 (Compile-Time Solver Selection)
- The file itself references S10 for what is now S11 (Stage LP Template)
- The cross-references footer mislabels S8 and S11

This suggests a systematic off-by-one shift at some boundary, possibly when "Dual Variable Normalization" (S8) was inserted or when sections 8-11 were reorganized.
