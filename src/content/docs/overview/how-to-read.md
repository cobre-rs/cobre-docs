---
title: How to Read This Site
description: Navigation guide — the site's sidebar groups, what each covers, and reading paths for different readers.
---

## Purpose

This chapter is a navigation guide. It describes the site's sidebar groups, explains what each group covers, and suggests reading paths for different readers. A reader deciding whether this site matches their needs should read this chapter first.

## 1. Site Structure

The site is organised into the groups shown in the sidebar. Each group is an on-ramp for new readers, a layer of the methodology, a worked illustration of it, a guide to using the software, or a set of lookup pages.

**Get Started** answers what Cobre computes ([What Cobre Solves](/overview/what-cobre-solves)), then walks through installing Cobre and running a first study from the CLI ([Installation](/getting-started/installation), [Quickstart](/getting-started/quickstart)) or from Python ([Python Quickstart](/getting-started/python-quickstart)). Readers deciding whether Cobre fits their problem should start here.

**Introduction** (this group) establishes the conceptual and notational foundation for the rest of the site: a one-page framing of the SDDP algorithm for readers new to stochastic dynamic programming ([The SDDP Framework in One Page](/overview/sddp-framework-overview)), the complete notation used throughout ([Notation Conventions](/overview/notation-conventions)), and this navigation guide. Its chapters can be read in order or consulted individually.

**System Modelling** defines the power system entities and the stage LP that Cobre solves at each iteration. This group is the mathematical foundation for everything that follows: hydro plants, thermal units, transmission lines, penalty structures, the stage LP and the state it carries between stages. Readers who want to understand how the physical system is represented in the optimisation should begin here.

**Stochastic Modelling** covers the inflow uncertainty model. Cobre uses periodic autoregressive models (PAR) to generate scenario trees; this group explains the model structure, the fitting procedure, and the scenario generation pipeline. Readers interested in how uncertainty is handled, without being concerned with the optimisation algorithm, can read this group independently of The SDDP Algorithm.

**The SDDP Algorithm** is the core of the methodology. It covers the forward and backward passes, cut generation and management, the LP layout and its scaling, warm-start strategies, risk measures, stopping rules, upper-bound evaluation, and determinism guarantees. Readers coming from the SDDP literature will find the connections to standard treatments here; readers new to SDDP should read Introduction and System Modelling first.

**Coupling & Boundary Conditions** covers how a study's horizon is closed: the horizon mode, the post-study boundary that values the state left at the end of the horizon (chained studies included), and how discounting interacts with the cut approximation. See [Horizon Modes](/math/horizon-modes) for the entry point.

**Running Cobre** covers the software in use: configuring and running studies, reusing a trained policy, running at scale, converting an existing case, and interpreting the results. Readers who run studies return to it after the [Quickstart](/getting-started/quickstart).

**Worked Examples** provides two pedagogical walkthroughs of the SDDP loop: a single-reservoir toy case and a four-reservoir toy case, both small enough to verify by hand. These chapters trace the forward pass, the backward pass, cut construction and the lower-bound update with concrete numbers. The cobre repository ships the runnable cases [`examples/1dtoy`](https://github.com/cobre-rs/cobre/tree/main/examples/1dtoy) and [`examples/4ree`](https://github.com/cobre-rs/cobre/tree/main/examples/4ree); each walkthrough states how its numbers relate to its case. Readers learning SDDP by doing should start with the worked examples after reading Introduction.

**Reference** holds the lookup pages: the input and output formats, the command-line and Python interfaces, the error codes, the glossary and the bibliography. Use this group as a lookup resource during reading, not as a starting point.

## 2. Tools and Interfaces

Cobre runs from the `cobre` command-line program and from the `cobre-python` package. [What Cobre Solves §4](/overview/what-cobre-solves#4-how-cobre-is-used) describes both interfaces and the files a run writes. The methodology chapters use "case directory" and "configuration" as concrete terms for the artefacts a user manages; these map directly to both interfaces.

Readers interested in the design commitments that underpin these interfaces — reproducibility, determinism, declaration order invariance and agent-readability — should read [section 5 of What Cobre Solves](/overview/what-cobre-solves#5-methodology-principles).

## 3. Reading Paths

Different readers enter this site from different directions. Find the row that matches you:

| Reader | Reading path |
| ------ | ------------ |
| Run studies | [Installation](/getting-started/installation), then the [Quickstart](/getting-started/quickstart), then the Running Cobre group, starting with [Running Studies](/running/running-studies) and [interpreting the results](/running/interpreting-results). |
| Coming from other software? | [What Cobre Solves §6](/overview/what-cobre-solves#6-coming-from-other-software), then [Converting an existing case](/running/case-conversion); for equivalent terms in other planning tools, see the [Glossary](/reference/glossary). |
| Work in Python | The [Python Quickstart](/getting-started/python-quickstart), then the [Python API](/reference/python-api) reference. |
| New to SDDP | Read [What Cobre Solves](/overview/what-cobre-solves) and all of Introduction, then read System Modelling to understand the LP, then read The SDDP Algorithm for the algorithm itself. The worked examples in Worked Examples reinforce the concepts. |
| Familiar with SDDP, new to Cobre | Skim What Cobre Solves and Introduction, read [Notation Conventions](/overview/notation-conventions) carefully, then read The SDDP Algorithm. Cross-reference System Modelling for the stage LP and its state when The SDDP Algorithm refers to stage variables. |
| Looking for a specific topic | Use the sidebar to navigate to the relevant group. The SDDP Algorithm covers the algorithm; System Modelling covers the LP and system model; Stochastic Modelling covers the inflow uncertainty model; Coupling & Boundary Conditions covers boundary conditions. [Notation Conventions](/overview/notation-conventions) resolves notation questions, and Running Cobre covers the software in use. |

## Cross-References

- [What Cobre Solves](/overview/what-cobre-solves) — the problem statement, algorithm name, methodology guarantees, user-facing capability summary, and an orientation for readers coming from other software
- [The SDDP Framework in One Page](/overview/sddp-framework-overview) — one-page algorithmic framing for readers new to stochastic dynamic programming
- [Notation Conventions](/overview/notation-conventions) — complete symbol table for index sets, parameters, decision variables, and dual variables
- [System Elements](/math/system-elements) — the elements of the system and their variables: System Modelling entry point
- [PAR Inflow Model](/math/par-inflow-model) — periodic autoregressive inflow model: Stochastic Modelling entry point
- [SDDP Algorithm](/math/sddp-algorithm) — forward pass, backward pass, cut generation, convergence: The SDDP Algorithm entry point
- [Horizon Modes](/math/horizon-modes) — boundary conditions and horizon-mode design: Coupling & Boundary Conditions entry point
