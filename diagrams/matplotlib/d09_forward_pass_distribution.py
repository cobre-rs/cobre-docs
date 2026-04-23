#!/usr/bin/env python3
r"""D-09: Forward pass - work distribution across ranks and threads.

Example: M = 12 trajectories, R = 3 ranks, 2 threads per rank. Trajectories
are assigned to ranks as static contiguous blocks (scenarios 0-3 on Rank 0,
4-7 on Rank 1, 8-11 on Rank 2). Within a rank, Rayon distributes trajectories
across its thread pool with `dynamic(1)` scheduling, so threads that finish
early can steal work from busy neighbours. Each thread owns complete
trajectories - it walks stages 1 → T in sequence, warm-starting the LP basis
between stages.

The forward pass has **no inter-rank communication**. Ranks synchronize only
at the very end, when they contribute their trajectory costs to a single
allreduce for the upper-bound estimator (count, cost_sum, cost_sum²).

Layout mirrors d07: Rank 0 full detail, Rank 1 & Rank 2 side-by-side compact,
three converging arrows into a full-width allreduce bar. Role mapping is
also consistent with d07 (copper for compute, flow-blue for the
communication-style `allreduce` block).
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from block_layout import (
    ANNOT_SIZE,
    INNER_PAD,
    Placed,
    arrow,
    block,
    body_position,
    caption,
    caption_position,
    text,
)
from cobre_brand import COLORS, apply_cobre_style

apply_cobre_style(dark=False)


# -----------------------------------------------------------------------------
# Figure
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12, 11))
ax.set_xlim(0, 12)
ax.set_ylim(0, 12)
ax.set_axis_off()


# Parameter band under the suptitle
text(
    ax,
    (6.0, 11.35),
    "M = 12 trajectories  ·  R = 3 ranks  ·  2 threads per rank  ·  "
    "scenarios assigned as static contiguous blocks",
    size=ANNOT_SIZE + 1,
    italic=True,
    color=COLORS.BODY,
    ha="center",
)


def draw_thread_detailed(
    xy: tuple[float, float],
    wh: tuple[float, float],
    *,
    thread_id: int,
    trajectories: str,
) -> None:
    """Thread block with trajectory row AND stage caption (for Rank 0)."""
    t = block(ax, xy, wh, title=f"Thread {thread_id}", role="neutral", lw=0.9)
    text(
        ax,
        body_position(t, 0),
        trajectories,
        size=ANNOT_SIZE + 1,
        color=COLORS.DARK_TEXT,
    )
    caption(ax, caption_position(t), "t = 1 → 2 → … → T   ·   warm basis")


def draw_thread_compact(
    xy: tuple[float, float],
    wh: tuple[float, float],
    *,
    thread_id: int,
    trajectories: str,
) -> None:
    """Thread block with just title + trajectory list (for Rank 1, 2).

    The stage-and-warm-basis property is already communicated by Rank 0's
    detailed threads + the figure's bottom caption; repeating it inside
    narrow compact thread blocks causes horizontal overflow.
    """
    t = block(ax, xy, wh, title=f"Thread {thread_id}", role="neutral", lw=0.9)
    text(
        ax,
        body_position(t, 0),
        trajectories,
        size=ANNOT_SIZE + 1,
        color=COLORS.DARK_TEXT,
    )


# -----------------------------------------------------------------------------
# Rank 0 — detailed (full width)
#
# Thread widths are chosen so the inter-thread GAP is wide enough to host
# the work-stealing indicator without it bleeding into either thread's
# content.
# -----------------------------------------------------------------------------
RANK0_X, RANK0_Y = 0.3, 7.3
RANK0_W, RANK0_H = 11.4, 3.6
THREAD_GAP = 1.6  # enough room for `↔` + "dynamic(1) work-stealing"

rank0 = block(
    ax,
    (RANK0_X, RANK0_Y),
    (RANK0_W, RANK0_H),
    title="MPI Rank 0  ·  scenarios 0–3",
    role="compute",
    lw=1.4,
)

inner_w = RANK0_W - 2 * INNER_PAD
thread_w = (inner_w - THREAD_GAP) / 2
thread_y = RANK0_Y + 0.4
thread_h = 2.1

draw_thread_detailed(
    (RANK0_X + INNER_PAD, thread_y),
    (thread_w, thread_h),
    thread_id=0,
    trajectories="trajectories 0, 1",
)
draw_thread_detailed(
    (RANK0_X + INNER_PAD + thread_w + THREAD_GAP, thread_y),
    (thread_w, thread_h),
    thread_id=1,
    trajectories="trajectories 2, 3",
)

# Work-stealing indicator — centered in the inter-thread gap, vertically
# aligned with the midpoint of the thread blocks.
wsx = RANK0_X + INNER_PAD + thread_w + THREAD_GAP / 2
wsy = thread_y + thread_h / 2
text(
    ax,
    (wsx, wsy + 0.3),
    r"$\leftrightarrow$",
    size=28,
    color=COLORS.COPPER,
    weight="semibold",
    ha="center",
    va="center",
)
text(
    ax,
    (wsx, wsy - 0.15),
    "dynamic(1)\nwork-stealing",
    size=ANNOT_SIZE,
    color=COLORS.COPPER,
    weight="semibold",
    ha="center",
    va="center",
)


# -----------------------------------------------------------------------------
# Rank 1 & Rank 2 — compact, side-by-side
# -----------------------------------------------------------------------------
RANK12_Y, RANK12_H = 4.4, 2.6
RANK12_W = 5.55
COMPACT_THREAD_GAP = 0.25


def compact_rank(x: float, *, rank_id: int, scenarios: str, traj_pairs: tuple[str, str]) -> Placed:
    r = block(
        ax,
        (x, RANK12_Y),
        (RANK12_W, RANK12_H),
        title=f"MPI Rank {rank_id}  ·  scenarios {scenarios}",
        role="compute",
        lw=1.2,
    )
    inner = RANK12_W - 2 * INNER_PAD
    tw = (inner - COMPACT_THREAD_GAP) / 2
    th_y = RANK12_Y + 0.35
    th_h = 1.45
    draw_thread_compact(
        (x + INNER_PAD, th_y),
        (tw, th_h),
        thread_id=0,
        trajectories=traj_pairs[0],
    )
    draw_thread_compact(
        (x + INNER_PAD + tw + COMPACT_THREAD_GAP, th_y),
        (tw, th_h),
        thread_id=1,
        trajectories=traj_pairs[1],
    )
    return r


rank1 = compact_rank(0.3, rank_id=1, scenarios="4–7", traj_pairs=("traj 4, 5", "traj 6, 7"))
rank2 = compact_rank(6.15, rank_id=2, scenarios="8–11", traj_pairs=("traj 8, 9", "traj 10, 11"))


# -----------------------------------------------------------------------------
# allreduce bar — full width, shared role (flow-blue = comm semantics).
# The flow-blue bar is the only comm touchpoint in the diagram; the
# absence of arrows between ranks communicates "no inter-rank comm during
# the forward pass" visually, without needing a redundant caption that
# would collide with the converging arrows.
# -----------------------------------------------------------------------------
ar = block(
    ax,
    (0.3, 1.8),
    (11.4, 1.65),
    title="allreduce  ·  UB statistics across ranks",
    role="shared",
    lw=1.2,
)
text(
    ax,
    body_position(ar, 0),
    "count  ·  cost_sum  ·  cost_sum²   →   "
    r"$\widehat{\mathrm{UB}} \pm 1.96\,\widehat{\sigma}/\sqrt{M}$",
    size=ANNOT_SIZE + 1,
    color=COLORS.DARK_TEXT,
)


# Three converging arrows: each rank contributes its trajectory costs.
# Rank 0 arrow enters the allreduce at its horizontal center; Rank 1 and
# Rank 2 enter offset to either side so the three arrows fan in visibly.
for rank_b, entry_x in [(rank0, 6.0), (rank1, 3.0), (rank2, 9.0)]:
    arrow(
        ax,
        (rank_b.cx, rank_b.bottom),
        (entry_x, ar.top),
        kind="comm",
        label_offset=(0.0, 0.0),
    )


# -----------------------------------------------------------------------------
# Bottom caption
# -----------------------------------------------------------------------------
text(
    ax,
    (6.0, 0.9),
    "thread-trajectory affinity — each thread walks complete trajectories "
    "(stages 1 → T); the LP basis warm-starts across stages",
    size=ANNOT_SIZE,
    italic=True,
    color=COLORS.BODY,
    ha="center",
)


# -----------------------------------------------------------------------------
# Title & save
# -----------------------------------------------------------------------------
fig.suptitle(
    "Forward pass — work distribution",
    fontsize=15,
    fontweight="semibold",
    color=COLORS.BRIGHT,
    y=0.985,
)

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight", transparent=True)
print(f"Saved {stem}.svg to {out}")
