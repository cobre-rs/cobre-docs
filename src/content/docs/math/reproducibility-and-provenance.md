---
title: Reproducibility and Provenance
description: The five provenance categories Cobre records — input fingerprints, stochastic-fitting metadata, random-seed lineage, solver identifiers, and execution topology — enabling independent re-derivation of any run.
---

## Purpose

This chapter defines the reproducibility commitment that Cobre makes to every
study it executes. The commitment is simple: any Cobre run can be independently
re-derived by any party that holds the recorded inputs and provenance. This is
not a property of the algorithm alone — it depends on systematic bookkeeping.
The companion chapter [Determinism Guarantees](/math/determinism-guarantees)
proves that the algorithm is deterministic given identical inputs; this chapter
defines what "identical inputs" means in practice and what Cobre records to make
that definition actionable.

The two chapters are complementary and form a pair. Determinism is the
algorithmic property; provenance is the bookkeeping that enables a third party
to exercise it.

## 1. The Reproducibility Commitment

Cobre commits to recording, at the end of every run, a sufficient description
of that run's inputs and configuration so that any party who holds those records
can independently reproduce the same cuts, the same policy, and the same
simulation costs — without access to the original machine, the original operator,
or any other context beyond the recorded artefacts.

This commitment is not about binary file equality. Timestamps, schema-version
metadata, and platform-specific padding may legitimately vary across runs on
different machines or library versions. The commitment is about numerical
content: the values of the computed quantities.

Provenance is recorded in two user-facing output files, `metadata.json` and
`stochastic_provenance.json`. These are the artefacts a study author shares
when reporting results or handing a run to an auditor. This chapter is concerned
with the five categories of information they capture and why each category is
necessary.

For implementation, see the cobre developer-guide.

## 2. What Is Recorded

Five categories of provenance are recorded. Each is necessary; none is
sufficient alone.

- **Input fingerprints.** The content hashes of the case files and
  configuration that define the study. A fingerprint uniquely identifies
  the inputs without requiring the inputs themselves to be transmitted.
  If two runs share the same fingerprints, they were fed identical inputs;
  if any fingerprint differs, the inputs differ and a difference in outputs
  is expected. Input fingerprints are the foundation of the commitment:
  without them, it is impossible to verify that a re-derivation attempt is
  using the same inputs as the original run.

- **Stochastic-fitting metadata.** The diagnostics produced when the
  periodic autoregressive model is fitted to historical inflow data, the
  correlation source and the method used to factorise the correlation
  structure, and the parameters that governed opening-tree generation.
  This category captures everything needed to reproduce the stochastic
  model that drives the backward pass. The opening-tree generation
  parameters are closely related to the seed derivation described next;
  for the methodology of how opening-tree entries are generated from those
  parameters, see [Scenario Generation](/math/scenario-generation).

- **Random-seed lineage.** The root seed that the operator supplied, and
  the deterministic rule by which Cobre derives per-stage and
  per-noise-group seeds from it. Recording the root seed alone is
  sufficient to reconstruct every derived seed, because the derivation
  rule is fixed and deterministic — a given root seed always produces the
  same tree of derived seeds on any conforming platform. The derivation
  rule itself is documented in [Scenario Generation](/math/scenario-generation)
  as the reproducible sampling methodology.

- **Solver and library identifiers.** The version and build identifier of
  the LP solver, the MPI library, and any other linked numerical library
  whose outputs are incorporated into the computed results. Numerical
  libraries differ across versions: a different solver version may produce
  different optimal bases, different dual variables, and therefore
  different cuts — all within the space of valid LP solutions. Recording
  identifiers lets a re-derivation attempt use the same solver version, or
  lets an auditor understand why two independent runs with different
  solvers produced numerically close but not identical outputs.

- **Execution topology.** The MPI rank count and the threading
  configuration under which the run executed. This category is needed to
  evaluate the determinism claim of the companion chapter
  [Determinism Guarantees](/math/determinism-guarantees): that chapter
  guarantees that topology changes do not alter numerical results, but an
  auditor who wants to reproduce a run under the exact original topology
  must know what that topology was.

## 3. What This Enables

The five categories together support three use cases.

**Independent re-derivation of cuts and policy.** A researcher, auditor, or
collaborator who holds the recorded provenance can reproduce every cut
coefficient and every policy decision without any communication with the
original operator. This is the primary use case: Cobre's methodology is open
to external verification.

**Audit trail for regulatory or scientific reporting.** Studies submitted to
regulators or cited in scientific literature must be traceable. The provenance
record is the traceability artefact. An auditor presented with a provenance
record and the corresponding input files can verify that the reported results
follow from those inputs by re-running Cobre and comparing outputs. The
audit does not depend on trust in the operator.

**Diff-of-runs analysis.** When two runs produce different outputs, the
provenance records identify where the inputs diverged. Diffing the input
fingerprints immediately isolates whether the change was in the case data, the
configuration, the stochastic model, the seed, the solver version, or the
topology. This narrows the root cause of any output difference to one or
more specific categories, making sensitivity analysis and debugging tractable.

## 4. What Is Not Promised

Three quantities are explicitly outside the reproducibility commitment.

**Bit-for-bit binary equality of output files.** Timestamps embedded in output
files, schema-version fields added by a newer library, and platform-specific
floating-point representation in serialisation all mean that the raw bytes of
an output file may differ across platforms or library versions even when the
numerical content is identical. The commitment is to the numerical content, not
to the file bytes.

**Wall-clock duration and peak memory.** These are functions of hardware load,
OS scheduler behaviour, memory allocator implementation, and MPI library
internals. Cobre does not record them as provenance because they are not
reproducible in any meaningful sense, and they play no role in the correctness
of the computed result.

**System-load-dependent variation.** Background processes, thermal throttling,
NUMA topology, and other system-state effects influence timing but not
numerical outputs. They are not recorded and are not part of the commitment.

## 5. Pairing with Determinism

Determinism and provenance are complementary, not redundant. The companion
chapter [Determinism Guarantees](/math/determinism-guarantees) establishes the
algorithmic property: Cobre's forward pass, backward pass, and scenario tree
generation are bit-identical across re-runs, topology changes, and
IEEE 754-conformant hardware variants. That property is valuable, but it is
actionable only if the inputs that determine the output are themselves
recorded. A guarantee that "identical inputs produce identical outputs" is
empty if the inputs are unknown.

Provenance closes the gap. With the five categories recorded, a third party
can reconstruct the inputs, satisfy themselves that those inputs are identical
to the original run's inputs, and then rely on the determinism guarantee to
conclude that a re-run will produce the same outputs. The sharp boundary
between the two chapters is intentional: the determinism chapter proves the
property exists; this chapter proves it can be exercised.

## Cross-References

- [Determinism Guarantees](/math/determinism-guarantees) — The companion
  chapter that establishes bit-identical reproducibility as an algorithmic
  property; this chapter defines the bookkeeping that makes that property
  actionable
- [Scenario Generation](/math/scenario-generation) — Reproducible sampling
  methodology (section 2.2) and opening-tree generation (section 2.3); the
  deterministic seed-derivation rule whose root seed is recorded as part of
  the random-seed lineage
