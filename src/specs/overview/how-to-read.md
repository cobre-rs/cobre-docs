# How to Read This Book

## Purpose

This chapter is a navigation guide. It describes the seven-Part structure of the book, explains what each Part covers, and suggests reading paths for different audiences. A reader deciding whether this book matches their needs should read this chapter first.

## 1. Book Structure

The book is organised into seven Parts. Each Part corresponds to a distinct layer of the methodology.

**Part 1 — Introduction** (this Part) answers what Cobre computes, frames the SDDP algorithm for readers new to stochastic dynamic programming, establishes the notation used throughout the book, and explains how to navigate the remaining Parts. The four chapters in Part 1 can be read in order or consulted individually.

**Part 2 — System Modelling** defines the power system entities and the stage LP that Cobre solves at each iteration. This Part is the mathematical foundation for everything that follows: hydro plants, thermal units, transmission lines, penalty structures, and the LP column layout that implements them. Readers who want to understand how the physical system is represented in the optimisation should begin here.

**Part 3 — Stochastic Modelling** covers the inflow uncertainty model. Cobre uses periodic autoregressive models (PAR) to generate scenario trees, and this Part explains the model structure, the fitting procedure, and the scenario generation pipeline. Readers interested in how uncertainty is handled without being concerned with the optimisation algorithm can read Part 3 independently of Part 4.

**Part 4 — The SDDP Algorithm** is the heart of the book. It covers the forward and backward passes, cut generation and management, warm-start strategies, risk measures, stopping rules, upper-bound evaluation, determinism guarantees, and reproducibility. Readers coming from the SDDP literature will find the connections to standard treatments here; readers new to SDDP should read Part 1 and Part 2 first.

**Part 5 — Coupling and Boundary Conditions** covers the choices that arise at the horizon boundaries: how the first stage is initialised, how the terminal condition is handled, and how discount rates interact with the cut approximation. This Part also covers the horizon-mode design that governs which boundary conditions apply to a given study. See [Horizon Modes](../math/horizon-modes.md) for the entry point.

**Part 6 — Worked Examples** provides two pedagogical walkthroughs of the SDDP loop: a single-reservoir toy case and a four-reservoir toy case, both small enough to verify by hand. These chapters trace one complete iteration with concrete numbers, demonstrating the forward pass, backward pass, cut construction, and lower-bound update. The two cases are simplified illustrations rather than reproductions of the shipped reference cases at `examples/1dtoy/` and `examples/4ree/`. Readers learning SDDP by doing should start with the worked examples after reading Part 1.

**Part 7 — Reference** contains the glossary, bibliography, and notation index. Use Part 7 as a lookup resource during reading, not as a starting point.

## 2. Tools and Interfaces

Understanding the book's scope requires knowing the user-facing surfaces Cobre exposes. The methodology chapters do not describe implementation, but they assume the reader knows what Cobre looks like from the outside.

**CLI and Python**: Cobre is driven via the `cobre` CLI; the same case directories and configuration files used from Python are used from the CLI. Cobre is callable from Python via PyO3 bindings; cases can be configured, runs launched, and results loaded from Python without leaving the methodology layer. The methodology chapters use "case directory" and "configuration" as concrete terms for the artefacts a user manages; these map directly to the CLI and Python interfaces.

**Structured output**: Every Cobre operation produces machine-parseable structured output (JSON or Parquet) alongside human-readable progress streams. When the methodology describes "training results" or "simulation output", it refers to the files in these formats.

**Terminal UI**: Cobre includes a terminal user interface for monitoring training and simulation runs interactively. The TUI is an observability tool; it does not change the methodology or the outputs.

**MCP server**: Cobre exposes its capabilities via the Model Context Protocol for AI agent integration. The MCP server makes Cobre runs accessible to AI-assisted workflows without requiring changes to the study configuration or the output format.

Readers interested in the design commitments that underpin these interfaces — reproducibility, determinism, declaration order invariance, code as ground truth, and agent-readability — should read section 5 of [What Cobre Solves](./what-cobre-solves.md).

## 3. Reading Paths

Different readers enter this book from different directions. Three common paths:

**New to SDDP**: Read Part 1 in full (chapters 1.1 through 1.4), then read Part 2 to understand the LP, then read Part 4 for the algorithm. The worked examples in Part 6 reinforce the concepts.

**Familiar with SDDP, new to Cobre**: Skim Part 1, read [Notation Conventions](./notation-conventions.md) carefully (Part 1.3), then read Part 4. Cross-reference Part 2 for the LP layout when Part 4 refers to stage variables.

**Looking for a specific topic**: Use the sidebar to navigate to the relevant Part. Part 4 covers the algorithm; Part 2 covers the LP and system model; Part 3 covers stochastic modelling; Part 5 covers boundary conditions. The reference chapters in Part 7 resolve notation questions.

## Cross-References

- [What Cobre Solves](./what-cobre-solves.md) — the problem statement, algorithm name, methodology guarantees, and user-facing capability summary
- [The SDDP Framework in One Page](./sddp-framework-overview.md) — one-page algorithmic framing for readers new to stochastic dynamic programming
- [Notation Conventions](./notation-conventions.md) — complete symbol table for index sets, parameters, decision variables, and dual variables
- [LP Formulation](../math/lp-formulation.md) — stage LP column layout: Part 2 entry point
- [PAR Inflow Model](../math/par-inflow-model.md) — periodic autoregressive inflow model: Part 3 entry point
- [SDDP Algorithm](../math/sddp-algorithm.md) — forward pass, backward pass, cut generation, convergence: Part 4 entry point
- [Horizon Modes](../math/horizon-modes.md) — boundary conditions and horizon-mode design: Part 5 entry point
