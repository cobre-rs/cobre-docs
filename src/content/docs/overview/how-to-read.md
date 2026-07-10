---
title: How to Read This Book
description: Navigation guide — the book's chapter groups, what each group covers, and reading paths for different audiences.
---

## Purpose

This chapter is a navigation guide. It describes the book's chapter groups, explains what each group covers, and suggests reading paths for different audiences. A reader deciding whether this book matches their needs should read this chapter first.

## 1. Book Structure

The book is organised into eight groups, shown in the sidebar. Each group corresponds to a distinct layer of the methodology or a distinct on-ramp for new users.

**Get Started** answers what Cobre computes ([What Cobre Solves](/overview/what-cobre-solves)), then walks through installing Cobre and running a first study from the CLI ([Installation](/getting-started/installation), [Quickstart](/getting-started/quickstart)) or from Python ([Python Quickstart](/getting-started/python-quickstart)). Readers deciding whether Cobre fits their problem should start here.

**Introduction** (this group) establishes the conceptual and notational foundation for the rest of the book: a one-page framing of the SDDP algorithm for readers new to stochastic dynamic programming ([The SDDP Framework in One Page](/overview/sddp-framework-overview)), the complete notation used throughout ([Notation Conventions](/overview/notation-conventions)), and this navigation guide. Its three chapters can be read in order or consulted individually.

**System Modelling** defines the power system entities and the stage LP that Cobre solves at each iteration. This group is the mathematical foundation for everything that follows: hydro plants, thermal units, transmission lines, penalty structures, and the LP column layout that implements them. Readers who want to understand how the physical system is represented in the optimisation should begin here.

**Stochastic Modelling** covers the inflow uncertainty model. Cobre uses periodic autoregressive models (PAR) to generate scenario trees; this group explains the model structure, the fitting procedure, and the scenario generation pipeline. Readers interested in how uncertainty is handled, without being concerned with the optimisation algorithm, can read this group independently of The SDDP Algorithm.

**The SDDP Algorithm** is the heart of the book. It covers the forward and backward passes, cut generation and management, warm-start strategies, risk measures, stopping rules, upper-bound evaluation, determinism guarantees, and reproducibility. Readers coming from the SDDP literature will find the connections to standard treatments here; readers new to SDDP should read Introduction and System Modelling first.

**Coupling & Boundary Conditions** covers the choices that arise at the horizon boundaries: how the first stage is initialised, how the terminal condition is handled, and how discount rates interact with the cut approximation. This group also covers the horizon-mode design that governs which boundary conditions apply to a given study. See [Horizon Modes](/math/horizon-modes) for the entry point.

**Worked Examples** provides two pedagogical walkthroughs of the SDDP loop: a single-reservoir toy case and a four-reservoir toy case, both small enough to verify by hand. These chapters trace one complete iteration with concrete numbers, demonstrating the forward pass, backward pass, cut construction, and lower-bound update. The two cases are simplified illustrations rather than reproductions of the shipped reference cases at `examples/1dtoy/` and `examples/4ree/`. Readers learning SDDP by doing should start with the worked examples after reading Introduction.

**Reference** contains the glossary and bibliography. Use this group as a lookup resource during reading, not as a starting point.

## 2. Tools and Interfaces

Understanding the book's scope requires knowing the user-facing surfaces Cobre exposes. The methodology chapters do not describe implementation, but they assume the reader knows what Cobre looks like from the outside.

**CLI and Python**: Cobre is driven via the `cobre` CLI; the same case directories and configuration files used from Python are used from the CLI. Cobre is callable from Python via PyO3 bindings; cases can be configured, runs launched, and results loaded from Python without leaving the methodology layer. The methodology chapters use "case directory" and "configuration" as concrete terms for the artefacts a user manages; these map directly to the CLI and Python interfaces.

**Structured output**: Every Cobre operation produces machine-parseable structured output (JSON or Parquet) alongside human-readable progress streams. When the methodology describes "training results" or "simulation output", it refers to the files in these formats.

**Terminal UI**: Cobre includes a terminal user interface for monitoring training and simulation runs interactively. The TUI is an observability tool; it does not change the methodology or the outputs.

**MCP server**: Cobre exposes its capabilities via the Model Context Protocol for AI agent integration. The MCP server makes Cobre runs accessible to AI-assisted workflows without requiring changes to the study configuration or the output format.

Readers interested in the design commitments that underpin these interfaces — reproducibility, determinism, declaration order invariance, code as ground truth, and agent-readability — should read section 5 of [What Cobre Solves](/overview/what-cobre-solves).

## 3. Reading Paths

Different readers enter this book from different directions. Three common paths:

**New to SDDP**: Read [What Cobre Solves](/overview/what-cobre-solves) and the rest of Introduction in full, then read System Modelling to understand the LP, then read The SDDP Algorithm for the algorithm itself. The worked examples in Worked Examples reinforce the concepts.

**Familiar with SDDP, new to Cobre**: Skim What Cobre Solves and Introduction, read [Notation Conventions](/overview/notation-conventions) carefully, then read The SDDP Algorithm. Cross-reference System Modelling for the LP layout when The SDDP Algorithm refers to stage variables.

**Looking for a specific topic**: Use the sidebar to navigate to the relevant group. The SDDP Algorithm covers the algorithm; System Modelling covers the LP and system model; Stochastic Modelling covers the inflow uncertainty model; Coupling & Boundary Conditions covers boundary conditions. The Reference group resolves notation questions.

## Cross-References

- [What Cobre Solves](/overview/what-cobre-solves) — the problem statement, algorithm name, methodology guarantees, and user-facing capability summary
- [The SDDP Framework in One Page](/overview/sddp-framework-overview) — one-page algorithmic framing for readers new to stochastic dynamic programming
- [Notation Conventions](/overview/notation-conventions) — complete symbol table for index sets, parameters, decision variables, and dual variables
- [LP Formulation](/math/lp-formulation) — stage LP column layout: System Modelling entry point
- [PAR Inflow Model](/math/par-inflow-model) — periodic autoregressive inflow model: Stochastic Modelling entry point
- [SDDP Algorithm](/math/sddp-algorithm) — forward pass, backward pass, cut generation, convergence: The SDDP Algorithm entry point
- [Horizon Modes](/math/horizon-modes) — boundary conditions and horizon-mode design: Coupling & Boundary Conditions entry point
