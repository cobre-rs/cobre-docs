#!/usr/bin/env python3
r"""D-08: Per-rank memory architecture - four regions + side notes.

A single MPI rank's address space partitions into four memory regions,
each with distinct lifetime, mutability, and sharing semantics:

    Shared read-only    - System, PAR params, spectral factors, stage templates
    Thread-local        - Per-Rayon-thread solver workspace + cut pool slice
    Rank-local growing  - Convergence history, rank-owned cut pool growth
    Temporary           - Short-lived noise buffers, MPI receive buffers

Cross-cutting properties (SharedRegion, thread isolation, cut pool scaling,
allocation discipline) are captured as side notes rather than arrows, since
they describe how regions behave rather than how data flows between them.

Role mapping:
- `shared`  : Shared read-only (flow-blue matches SharedRegion in d07, so
              the reader builds one "shared = flow-blue" association across
              the HPC topology family).
- `compute` : Thread-local mutable (copper, same as thread-pool cells in d07)
- `runtime` : Rank-local (patina, distinct from per-thread state)
- `neutral` : Temporary (lowest emphasis) + side notes (outline cards)
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from block_layout import (
    ANNOT_SIZE,
    INNER_PAD,
    TITLE_TOP_OFFSET,
    Placed,
    arrow,
    block,
    body_position,
    text,
)
from cobre_brand import COLORS, apply_cobre_style

apply_cobre_style(dark=False)


# -----------------------------------------------------------------------------
# Figure
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12, 9.5))
ax.set_xlim(0, 12)
ax.set_ylim(0, 10)
ax.set_axis_off()

# Section headers (outside any block → BODY color for legibility on coal bg).
text(
    ax,
    (3.3, 9.35),
    "Rank address space  ·  per rank",
    size=13,
    weight="semibold",
    color=COLORS.BODY,
    ha="center",
)
text(
    ax,
    (9.2, 9.35),
    "Cross-cutting notes",
    size=13,
    weight="semibold",
    color=COLORS.BODY,
    ha="center",
)


def size_badge(b: Placed, label: str) -> None:
    """Top-right monospace size annotation inside block *b*."""
    text(
        ax,
        (b.right - INNER_PAD, b.top - TITLE_TOP_OFFSET),
        label,
        size=ANNOT_SIZE,
        weight="semibold",
        color=COLORS.MID_TEXT,
        family="monospace",
        ha="right",
        va="top",
    )


# -----------------------------------------------------------------------------
# Left column — four memory regions (top = largest lifetime, bottom = shortest)
# -----------------------------------------------------------------------------
LEFT_X = 0.3
LEFT_W = 6.0
REGION_H = 1.65
REGION_GAP = 0.20
# Stack from y = 8.95 downward so the first region's top sits just under the
# section header.
y_top = 8.95


def region(
    y: float,
    *,
    title: str,
    role: str,
    lines: list[str],
    size_label: str,
) -> None:
    b = block(
        ax,
        (LEFT_X, y - REGION_H),
        (LEFT_W, REGION_H),
        title=title,
        role=role,  # type: ignore[arg-type]
        lw=1.2,
    )
    size_badge(b, size_label)
    for i, line in enumerate(lines):
        text(ax, body_position(b, i), line, size=ANNOT_SIZE + 1)


region(
    y_top,
    title="Shared read-only",
    role="shared",
    lines=[
        "System  ·  PAR parameters (PrecomputedPar)",
        "Spectral factors  ·  opening tree",
        "Stage templates (base LP)",
    ],
    size_label="~50–200 MB",
)
y_top -= REGION_H + REGION_GAP

region(
    y_top,
    title="Thread-local",
    role="compute",
    lines=[
        "Solver workspace (HiGHS instance)",
        "Scratch buffers  ·  patch arrays",
        "Cut pool slice (deterministic slots)",
    ],
    size_label="~10–50 MB/thread",
)
y_top -= REGION_H + REGION_GAP

region(
    y_top,
    title="Rank-local (growing)",
    role="runtime",
    lines=[
        "Convergence history  ·  iteration records",
        "Cut pool (grows with iterations)",
    ],
    size_label="~1–50 MB",
)
y_top -= REGION_H + REGION_GAP

region(
    y_top,
    title="Temporary",
    role="neutral",
    lines=[
        "Noise generator buffers",
        "allgatherv receive buffers",
    ],
    size_label="~1–5 MB",
)


# -----------------------------------------------------------------------------
# Right column — four cross-cutting notes (outline cards, neutral role)
# -----------------------------------------------------------------------------
RIGHT_X = 6.7
RIGHT_W = 5.0
NOTE_H = 1.65
NOTE_GAP = 0.20
y_top = 8.95


def note(y: float, *, title: str, body: list[str]) -> None:
    b = block(
        ax,
        (RIGHT_X, y - NOTE_H),
        (RIGHT_W, NOTE_H),
        title=title,
        role="neutral",
        lw=1.0,
    )
    for i, line in enumerate(body):
        text(ax, body_position(b, i), line, size=ANNOT_SIZE)


note(
    y_top,
    title="SharedRegion (intra-node)",
    body=[
        "When 2+ ranks share a node, read-only",
        "data is mapped once via SharedRegion (mmap).",
        "Managed by SharedMemoryProvider trait.",
    ],
)
y_top -= NOTE_H + NOTE_GAP

note(
    y_top,
    title="Thread isolation",
    body=[
        "Each Rayon thread owns its solver instance.",
        "No locks on hot path — workspace is &mut.",
        "NUMA-local allocation via thread affinity.",
    ],
)
y_top -= NOTE_H + NOTE_GAP

note(
    y_top,
    title="Cut pool scaling",
    body=[
        r"Pre-allocated: $K_{\max} \cdot (1 + n_{\mathrm{state}}) \cdot 8$ bytes.",
        r"165 hydros $\times$ 1000 cuts $\approx$ 1.3 GB.",
        "Slots are deterministic; lock-free writes.",
    ],
)
y_top -= NOTE_H + NOTE_GAP

note(
    y_top,
    title="Allocation discipline",
    body=[
        "Zero allocation on hot paths.",
        "All buffers pre-sized at init.",
        "Temporary region recycled per-iteration.",
    ],
)


# -----------------------------------------------------------------------------
# Cross-column dashed pointer: SharedRegion note → Shared read-only region
# (shows where the note applies without implying a data-flow arrow)
# -----------------------------------------------------------------------------
arrow(
    ax,
    (RIGHT_X, 8.95 - 0.85),  # SharedRegion note left edge (mid)
    (LEFT_X + LEFT_W, 8.95 - 0.85),  # Shared read-only region right edge
    kind="comm",  # dashed flow-blue
    label_offset=(0.0, 0.0),
)


# -----------------------------------------------------------------------------
# Bottom caption - Brazilian PMO sizing
# -----------------------------------------------------------------------------
text(
    ax,
    (6.0, 0.55),
    "Brazilian PMO case (165 hydros · 120 stages · 50 openings): "
    "~800 MB/rank without SharedRegion · "
    "~450 MB/rank with SharedRegion on 2-rank-per-node placement",
    size=ANNOT_SIZE,
    italic=True,
    color=COLORS.BODY,
    ha="center",
)


# -----------------------------------------------------------------------------
# Title & save
# -----------------------------------------------------------------------------
fig.suptitle(
    "Per-rank memory architecture",
    fontsize=15,
    fontweight="semibold",
    color=COLORS.BRIGHT,
    y=0.985,
)

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(
    out / f"{stem}.svg", format="svg", bbox_inches="tight", transparent=True
)
print(f"Saved {stem}.svg to {out}")
