#!/usr/bin/env python3
r"""D-03: SDDP scenario tree - forward sampling vs backward evaluation.

Two side-by-side tree visualisations illustrate why SDDP converges:

- **Forward pass (left)**: M = 2 trajectories sampled through a tree of
  branching factor N = 3. Only the sampled paths visit nodes; the
  "trial points" (visited states) are filled circles, non-visited nodes
  remain hollow.
- **Backward pass (right)**: pick a single trial point ``x̂`` and evaluate
  **all N = 3 openings** exhaustively. Each opening ``ξ_i`` → solve LP →
  dual ``π_i`` → aggregate into one Benders cut via
  ``π̄ = E[π(ξ)]``, ``ᾱ = E[α(ξ)]``.

The asymmetry between sparse forward exploration and exhaustive backward
exploitation is the structural reason SDDP converges on problems where
full tree evaluation is combinatorially infeasible.

Graph-style diagrams like this don't fit the ``block_layout`` primitives
(nodes + edges, not composed rectangles); pure matplotlib with scatter
markers and ``FancyArrowPatch`` is the right tool. The palette + fonts
still come from ``cobre_brand`` so the diagram sits inside the design
system's visual identity.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from cobre_brand import COLORS, apply_cobre_style
from matplotlib.patches import FancyArrowPatch

apply_cobre_style(dark=False)

# -----------------------------------------------------------------------------
# Figure
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(13, 8.5))
ax.set_xlim(0, 13)
ax.set_ylim(0, 10)
ax.set_axis_off()

# Panel x-ranges
FWD_X0, FWD_X1 = 0.3, 6.2  # forward pass
BWD_X0, BWD_X1 = 6.8, 12.7  # backward pass

# Vertical divider line between panels
ax.plot(
    [6.5, 6.5],
    [0.5, 9.3],
    color=COLORS.LIGHT_BORDER,
    linewidth=0.8,
    zorder=1,
)

# Section titles
ax.text(
    (FWD_X0 + FWD_X1) / 2,
    9.5,
    "Forward pass — sparse sampling",
    fontsize=13,
    fontweight="semibold",
    color=COLORS.BODY,
    ha="center",
)
ax.text(
    (BWD_X0 + BWD_X1) / 2,
    9.5,
    "Backward pass — exhaustive evaluation",
    fontsize=13,
    fontweight="semibold",
    color=COLORS.BODY,
    ha="center",
)


# =============================================================================
# FORWARD PANEL
# =============================================================================
# 4 stages, N=3 branching. Full tree has 3^3 = 27 leaves which is too dense
# for a narrow mdBook column; truncate at t=3 (9 nodes) and show t=4 as
# stubs extending from the 9 t=3 nodes to communicate "continues to stage T".

STAGE_X = [FWD_X0 + 0.4, FWD_X0 + 2.1, FWD_X0 + 3.9, FWD_X0 + 5.5]
STAGE_LABELS = ["t = 1", "t = 2", "t = 3", "t = 4"]

# Node y-coordinates at each stage
T1_Y = [5.0]
T2_Y = [2.5, 5.0, 7.5]
# At t=3 each t=2 parent branches to 3 children; cluster them around parent
T3_Y = [
    1.6,
    2.5,
    3.4,
    4.1,
    5.0,
    5.9,
    6.6,
    7.5,
    8.4,
]

# Edges: (parent_y, child_y) pairs
EDGES_12 = [(T1_Y[0], y) for y in T2_Y]
EDGES_23: list[tuple[float, float]] = []
for p_i, parent_y in enumerate(T2_Y):
    for c_i in range(3):
        EDGES_23.append((parent_y, T3_Y[p_i * 3 + c_i]))

# Stubs from t=3 to t=4 (small horizontal segment + "…")
STUB_LEN = 0.6

# Draw stage labels
for sx, sl in zip(STAGE_X, STAGE_LABELS, strict=True):
    ax.text(
        sx,
        0.85,
        sl,
        fontsize=10,
        color=COLORS.BODY,
        ha="center",
        family="monospace",
    )

# Sampled paths highlighted: 2 trajectories through the tree
# Path A: (t=1, y=5) → (t=2, y=2.5) → (t=3, y=2.5) → (t=4, stub)
# Path B: (t=1, y=5) → (t=2, y=7.5) → (t=3, y=8.4) → (t=4, stub)
PATH_A = [(STAGE_X[0], T1_Y[0]), (STAGE_X[1], T2_Y[0]), (STAGE_X[2], T3_Y[1])]
PATH_B = [(STAGE_X[0], T1_Y[0]), (STAGE_X[1], T2_Y[2]), (STAGE_X[2], T3_Y[8])]

# Draw all tree edges (light gray, thin)
for py, cy in EDGES_12:
    ax.plot(
        [STAGE_X[0], STAGE_X[1]],
        [py, cy],
        color=COLORS.LIGHT_BORDER,
        linewidth=0.9,
        zorder=2,
    )
for py, cy in EDGES_23:
    ax.plot(
        [STAGE_X[1], STAGE_X[2]],
        [py, cy],
        color=COLORS.LIGHT_BORDER,
        linewidth=0.9,
        zorder=2,
    )

# t=4 stubs (from each t=3 node)
for y in T3_Y:
    ax.plot(
        [STAGE_X[2], STAGE_X[2] + STUB_LEN],
        [y, y],
        color=COLORS.LIGHT_BORDER,
        linewidth=0.9,
        zorder=2,
    )
    ax.text(
        STAGE_X[2] + STUB_LEN + 0.05,
        y,
        "…",
        fontsize=9,
        color=COLORS.MUTED,
        va="center",
    )

# Highlight sampled paths in copper
for path, color in [(PATH_A, COLORS.COPPER), (PATH_B, COLORS.COPPER_DARK)]:
    xs = [p[0] for p in path]
    ys = [p[1] for p in path]
    ax.plot(xs, ys, color=color, linewidth=2.3, zorder=4)
    # Stub continuation from the terminal t=3 node to t=4
    ax.plot(
        [path[-1][0], path[-1][0] + STUB_LEN],
        [path[-1][1], path[-1][1]],
        color=color,
        linewidth=2.3,
        zorder=4,
    )

# Draw non-visited nodes as small hollow circles
all_nodes = (
    [(STAGE_X[0], y) for y in T1_Y]
    + [(STAGE_X[1], y) for y in T2_Y]
    + [(STAGE_X[2], y) for y in T3_Y]
)
visited = set(PATH_A + PATH_B)
for x, y in all_nodes:
    if (x, y) in visited:
        continue
    ax.scatter(
        x,
        y,
        s=50,
        facecolors=COLORS.WHITE,
        edgecolors=COLORS.MUTED,
        linewidths=1.0,
        zorder=5,
    )

# Draw trial points (visited nodes) as filled copper circles
for path, color in [(PATH_A, COLORS.COPPER), (PATH_B, COLORS.COPPER_DARK)]:
    for x, y in path:
        ax.scatter(x, y, s=80, color=color, zorder=6)

# Root label (x₀)
ax.text(
    STAGE_X[0] - 0.25,
    T1_Y[0],
    r"$x_0$",
    fontsize=12,
    color=COLORS.DARK_TEXT,
    ha="right",
    va="center",
)

# Panel caption
ax.text(
    (FWD_X0 + FWD_X1) / 2,
    0.3,
    "M = 2 sampled paths  ·  one random opening per stage  ·  "
    "trial points (visited) = filled circles",
    fontsize=9,
    color=COLORS.BODY,
    ha="center",
    fontstyle="italic",
)


# =============================================================================
# BACKWARD PANEL
# =============================================================================
# Single trial point x̂ at the top; N=3 openings ξ_1, ξ_2, ξ_3 fan out below;
# each opening → solve LP → dual π_i; aggregate → one Benders cut.

BWD_CX = (BWD_X0 + BWD_X1) / 2
TRIAL_Y = 8.1
OPENING_Y = 6.0
CUT_BLOCK_TOP = 3.3
CUT_BLOCK_BOT = 1.4

# Trial point x̂ (large filled copper circle)
ax.scatter(BWD_CX, TRIAL_Y, s=140, color=COLORS.COPPER, zorder=5)
ax.text(
    BWD_CX + 0.4,
    TRIAL_Y,
    r"trial point  $\hat{x}$",
    fontsize=11,
    color=COLORS.DARK_TEXT,
    va="center",
)

# Three openings
OPENING_X = [BWD_CX - 2.1, BWD_CX, BWD_CX + 2.1]
for i, ox in enumerate(OPENING_X, start=1):
    # Edge from x̂ to opening
    ax.plot(
        [BWD_CX, ox],
        [TRIAL_Y, OPENING_Y],
        color=COLORS.COPPER,
        linewidth=1.6,
        zorder=3,
    )
    # Opening node
    ax.scatter(ox, OPENING_Y, s=110, color=COLORS.FLOW_BLUE, zorder=5)
    ax.text(
        ox,
        OPENING_Y + 0.45,
        rf"$\xi_{i}$",
        fontsize=12,
        color=COLORS.DARK_TEXT,
        ha="center",
    )
    # Per-opening label
    ax.text(
        ox,
        OPENING_Y - 0.55,
        "solve LP",
        fontsize=9,
        color=COLORS.MID_TEXT,
        ha="center",
    )
    ax.text(
        ox,
        OPENING_Y - 0.95,
        rf"dual $\pi_{i}$",
        fontsize=10,
        color=COLORS.DARK_TEXT,
        ha="center",
    )

# "aggregate → single Benders cut" block
agg_box = ax.add_patch(
    plt.Rectangle(  # type: ignore[attr-defined]
        (BWD_X0 + 0.6, CUT_BLOCK_BOT),
        (BWD_X1 - BWD_X0) - 1.2,
        CUT_BLOCK_TOP - CUT_BLOCK_BOT,
        facecolor="#F0F4F8",
        edgecolor=COLORS.FLOW_BLUE,
        linewidth=1.2,
        zorder=2,
    )
)

# Arrows from each π_i down into the aggregate box
for ox in OPENING_X:
    ax.add_patch(
        FancyArrowPatch(
            (ox, OPENING_Y - 1.2),
            (BWD_CX, CUT_BLOCK_TOP),
            arrowstyle="->",
            mutation_scale=14,
            color=COLORS.FLOW_BLUE,
            linewidth=1.2,
            linestyle="--",
            zorder=3,
        )
    )

# Text inside the aggregate box
ax.text(
    BWD_CX,
    CUT_BLOCK_TOP - 0.45,
    "aggregate → 1 Benders cut",
    fontsize=12,
    fontweight="semibold",
    color=COLORS.FLOW_BLUE,
    ha="center",
)
ax.text(
    BWD_CX,
    CUT_BLOCK_TOP - 1.05,
    r"$\bar{\pi} = \mathbb{E}[\pi(\xi)]$",
    fontsize=12,
    color=COLORS.DARK_TEXT,
    ha="center",
)
ax.text(
    BWD_CX,
    CUT_BLOCK_TOP - 1.5,
    r"$\bar{\alpha} = \mathbb{E}[\alpha(\xi)]$",
    fontsize=12,
    color=COLORS.DARK_TEXT,
    ha="center",
)

# Panel caption
ax.text(
    BWD_CX,
    0.3,
    "N = 3 openings, ALL evaluated  ·  one cut per trial point per stage",
    fontsize=9,
    color=COLORS.BODY,
    ha="center",
    fontstyle="italic",
)


# =============================================================================
# Title & bottom caption
# =============================================================================
fig.suptitle(
    "Scenario tree — forward sampling vs backward evaluation",
    fontsize=15,
    fontweight="semibold",
    color=COLORS.BRIGHT,
    y=0.98,
)

# (panel-level captions already provide the summary; no fig-wide caption)

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight", transparent=True)
print(f"Saved {stem}.svg to {out}")
