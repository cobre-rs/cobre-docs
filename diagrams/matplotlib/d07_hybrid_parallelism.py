#!/usr/bin/env python3
r"""D-07: Hybrid parallelism - MPI ranks x Rayon threads.

Depicts the memory-and-compute hierarchy on a two-node cluster running Cobre:

    Compute Node
      MPI Rank (one per NUMA domain)
        Rayon thread pool  (workers with thread-local solver workspace)
      SharedRegion (intra-node mmap) - read-only data mapped once per node

NUMA is captured through the spatial arrangement (one rank on each side of
the node, captioned "NUMA 0" / "NUMA 1") rather than as an explicit nested
container - three levels of nesting is already the ergonomic limit of the
block_layout primitives at the narrow mdBook column size.

Roles:
- `compute` : outer node + MPI Rank shells (copper)
- `shared`  : SharedRegion (flow-blue)
- `neutral` : thread-pool worker cells
- `comm`    : inter-node MPI arrows

See `docs/design/diagram-authoring.md` §4 for the design system.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from block_layout import (
    ANNOT_SIZE,
    INNER_PAD,
    arrange,
    arrow,
    block,
    body_position,
    caption,
    caption_position,
    text,
)
from cobre_brand import COLORS, apply_cobre_style

apply_cobre_style(dark=False)


def _sub(i: int) -> str:
    """Unicode subscript digits 0-9."""
    return "".join("₀₁₂₃₄₅₆₇₈₉"[int(c)] for c in str(i))


def draw_detailed_rank(
    xy: tuple[float, float], wh: tuple[float, float], rank_id: int, numa_id: int
) -> None:
    """Full rank block with thread-pool row and thread-local caption."""
    r = block(ax, xy, wh, title=f"MPI Rank {rank_id}  ·  NUMA {numa_id}", role="compute", lw=1.0)
    # Thread pool label on first body row.
    text(
        ax,
        body_position(r, 0),
        "Rayon thread pool (4 workers)",
        size=ANNOT_SIZE,
        color=COLORS.MID_TEXT,
        italic=True,
    )
    # Worker cells — four equally-sized cells on the second body row.
    cells = arrange(
        ((r.left + INNER_PAD, r.top - 1.55), (r.w - 2 * INNER_PAD, 0.70)),
        rows=1,
        cols=4,
        pad=0.0,
        gap=0.10,
    )
    for i, (cxy, cwh) in enumerate(cells):
        w = block(ax, cxy, cwh, role="neutral", lw=0.8)
        text(ax, (w.cx, w.cy - 0.08), f"W{_sub(i)}", size=ANNOT_SIZE, ha="center", va="center")
    # Thread-local caption.
    caption(ax, (r.left + INNER_PAD, r.bottom + INNER_PAD + 0.45), "thread-local workspace")
    caption(ax, caption_position(r), "solver · scratch buffers · cut pool slice")


fig, ax = plt.subplots(figsize=(10, 10.5))
ax.set_xlim(0, 12)
ax.set_ylim(0, 12)
ax.set_axis_off()


# -----------------------------------------------------------------------------
# Compute Node 0 - detailed (top region)
# -----------------------------------------------------------------------------
node0 = block(ax, (0.3, 5.3), (11.4, 6.3), title="Compute Node 0", role="compute", lw=1.6)

# Two MPI Ranks side-by-side (one per NUMA domain).
draw_detailed_rank((0.7, 7.2), (5.2, 3.8), rank_id=0, numa_id=0)
draw_detailed_rank((6.1, 7.2), (5.2, 3.8), rank_id=1, numa_id=1)

# SharedRegion strip beneath the ranks - spans both NUMA domains on this node.
shared0 = block(
    ax, (0.7, 5.55), (10.6, 1.5), title="SharedRegion  ·  intra-node mmap", role="shared", lw=1.0
)
text(
    ax,
    body_position(shared0, 0),
    "System · PAR parameters · spectral factors · opening tree",
    size=ANNOT_SIZE + 1,
    color=COLORS.DARK_TEXT,
)
caption(
    ax,
    caption_position(shared0),
    "read-only data mapped once per node; "
    "main thread on each rank performs MPI (Funneled threading)",
)


# -----------------------------------------------------------------------------
# Compute Node 1 - compact (bottom region), same structure
# -----------------------------------------------------------------------------
node1 = block(
    ax, (0.3, 1.5), (11.4, 3.4), title="Compute Node 1  ·  same layout", role="compute", lw=1.4
)

# Compact ranks: title only, no cell breakdown.
r2 = block(ax, (0.7, 2.9), (5.2, 1.7), title="MPI Rank 2  ·  NUMA 0", role="compute", lw=1.0)
text(
    ax,
    body_position(r2, 0),
    "Rayon pool · thread-local workspace",
    size=ANNOT_SIZE,
    color=COLORS.MID_TEXT,
    italic=True,
)

r3 = block(ax, (6.1, 2.9), (5.2, 1.7), title="MPI Rank 3  ·  NUMA 1", role="compute", lw=1.0)
text(
    ax,
    body_position(r3, 0),
    "Rayon pool · thread-local workspace",
    size=ANNOT_SIZE,
    color=COLORS.MID_TEXT,
    italic=True,
)

# Slim SharedRegion indicator.
shared1 = block(ax, (0.7, 1.75), (10.6, 0.95), role="shared", lw=1.0)
text(
    ax,
    (shared1.cx, shared1.cy - 0.05),
    "SharedRegion (intra-node) · read-only data mapped once per node",
    size=ANNOT_SIZE,
    color=COLORS.FLOW_BLUE,
    italic=True,
    ha="center",
)


# -----------------------------------------------------------------------------
# Inter-node MPI communication (arrows between the two compute nodes)
# -----------------------------------------------------------------------------
arrow(
    ax,
    (node0.cx - 2.0, node0.bottom),
    (node1.cx - 2.0, node1.top),
    label="MPI",
    kind="comm",
    label_offset=(0.0, 0.0),
)
arrow(ax, (node0.cx + 2.0, node0.bottom), (node1.cx + 2.0, node1.top), kind="comm")


# -----------------------------------------------------------------------------
# Title and bottom caption
# -----------------------------------------------------------------------------
fig.suptitle(
    "Hybrid parallelism - MPI ranks × Rayon threads (Funneled threading)",
    fontsize=15,
    fontweight="semibold",
    color=COLORS.BRIGHT,
    y=0.985,
)
# Outside-block caption — explicit BODY so it stays legible on the transparent
# figure over the coal-theme mdBook page.
text(
    ax,
    (6.0, 0.55),
    "one MPI rank pinned per NUMA domain · inter-node communication via MPI from main thread only",
    size=ANNOT_SIZE,
    italic=True,
    color=COLORS.BODY,
    ha="center",
)


out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight", transparent=True)
print(f"Saved {stem}.svg to {out}")
