"""Shared primitives for composed block diagrams.

Every matplotlib diagram that composes labeled rectangles — data flows,
hardware topology, memory layouts — uses the primitives here so they share
one visual identity: same corner radii, same role-based palette, same
arrow styles, same typography.

Public API:

- :class:`Placed` — value type returned by :func:`block`; exposes edge
  midpoints and center coordinates for chaining arrows.
- :func:`block` — rounded-rectangle container with an optional title;
  role determines fill + border colour from the palette.
- :func:`arrow` — directed arrow between two blocks (or arbitrary points)
  with an optional mid-edge label; ``kind`` selects stroke style.
- :func:`arrange` — lay out *n* equal-sized children in a grid inside a
  bounding box (rows by cols), respecting :data:`GAP`.
- :func:`text`, :func:`math`, :func:`caption` — typography helpers wired
  to :data:`BODY_SIZE` / :data:`ANNOT_SIZE` so per-script font choices
  stay off the critical path.

See :doc:`docs/design/diagram-authoring.md` §4 for the design rationale
and the palette table.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from cobre_brand import COLORS
from matplotlib.axes import Axes
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

# ---------------------------------------------------------------------------
# Design system constants (keep in sync with docs/design/diagram-authoring.md)
# ---------------------------------------------------------------------------

# Corner & spacing (figure units; the consumer chooses axes units and scales)
CORNER_RADIUS = 0.03
INNER_PAD = 0.15
GAP = 0.20

# Typography
TITLE_SIZE = 13
BODY_SIZE = 12
ANNOT_SIZE = 10

# Border widths
LW_BLOCK = 1.4
LW_NESTED = 1.0

# Content layout (axis units). Use these to position body text inside a block
# so every diagram has the same rhythm between title and body lines.
#
#   block.top    ← top edge
#   block.top - TITLE_TOP_OFFSET     ← title top (block() places it here, va="top")
#   block.top - BODY_TOP_OFFSET      ← first body line baseline
#   block.top - BODY_TOP_OFFSET - 1*BODY_LINE_HEIGHT   ← second body line
#   block.top - BODY_TOP_OFFSET - i*BODY_LINE_HEIGHT   ← (i+1)th body line
#   block.bottom + INNER_PAD         ← caption baseline
#
TITLE_TOP_OFFSET = 0.20
BODY_TOP_OFFSET = 0.70
BODY_LINE_HEIGHT = 0.45

type Role = Literal["storage", "runtime", "compute", "shared", "warning", "neutral"]

# Role → (face_color, border_color). Face colours are intentionally desaturated
# tints of the border colour, chosen to sit on a light axes background without
# overwhelming the content. Update `docs/design/diagram-authoring.md §4.2`
# when a new role is added here.
ROLES: dict[Role, tuple[str, str]] = {
    "storage": ("#F5EEE4", COLORS.COPPER),
    "runtime": ("#EDF5EE", COLORS.PATINA),
    "compute": ("#F5EEE4", COLORS.COPPER),
    "shared": ("#F0F4F8", COLORS.FLOW_BLUE),
    "warning": ("#FDE8E8", COLORS.SIGNAL_RED),
    "neutral": ("#FFFFFF", COLORS.MID_TEXT),
}

type ArrowKind = Literal["dataflow", "transform", "comm"]

ARROW_STYLES: dict[ArrowKind, dict[str, object]] = {
    "dataflow": {"color": COLORS.MID_TEXT, "linewidth": 1.4, "linestyle": "-"},
    "transform": {"color": COLORS.COPPER, "linewidth": 1.6, "linestyle": "-"},
    "comm": {"color": COLORS.FLOW_BLUE, "linewidth": 1.2, "linestyle": "--"},
}

# Axes point (x, y)
type Point = tuple[float, float]


# ---------------------------------------------------------------------------
# Placed — returned by block(); exposes connection points for arrow()
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Placed:
    """A block that has been drawn. Edge midpoints let arrows connect without
    the caller re-deriving coordinates.
    """

    x: float
    y: float
    w: float
    h: float

    @property
    def left(self) -> float:
        return self.x

    @property
    def right(self) -> float:
        return self.x + self.w

    @property
    def bottom(self) -> float:
        return self.y

    @property
    def top(self) -> float:
        return self.y + self.h

    @property
    def cx(self) -> float:
        return self.x + self.w / 2

    @property
    def cy(self) -> float:
        return self.y + self.h / 2

    @property
    def left_mid(self) -> Point:
        return (self.left, self.cy)

    @property
    def right_mid(self) -> Point:
        return (self.right, self.cy)

    @property
    def top_mid(self) -> Point:
        return (self.cx, self.top)

    @property
    def bottom_mid(self) -> Point:
        return (self.cx, self.bottom)


# ---------------------------------------------------------------------------
# block()
# ---------------------------------------------------------------------------


def block(
    ax: Axes,
    xy: Point,
    wh: tuple[float, float],
    *,
    title: str | None = None,
    title_mono: bool = False,
    role: Role = "neutral",
    lw: float = LW_BLOCK,
) -> Placed:
    """Draw a rounded rectangle with an optional title at the top.

    Args:
        ax: Axes to draw on.
        xy: Bottom-left corner in axes units.
        wh: Width and height in axes units.
        title: Optional single-line title placed inside the top of the block,
            left-aligned, at TITLE_SIZE. Use ``title_mono=True`` for filenames
            or other identifiers that should render in the monospace family.
        title_mono: Render the title in monospace (filenames, identifiers).
        role: Palette key; see :data:`ROLES`.
        lw: Border width.

    Returns:
        :class:`Placed` describing the block's position — pass to :func:`arrow`
        or use the edge midpoint properties directly to lay out labels.
    """
    face, edge = ROLES[role]
    ax.add_patch(
        FancyBboxPatch(
            xy,
            wh[0],
            wh[1],
            boxstyle=f"round,pad=0.02,rounding_size={CORNER_RADIUS}",
            facecolor=face,
            edgecolor=edge,
            linewidth=lw,
            zorder=2,
        )
    )
    placed = Placed(x=xy[0], y=xy[1], w=wh[0], h=wh[1])
    if title is not None:
        ax.text(
            placed.left + INNER_PAD,
            placed.top - TITLE_TOP_OFFSET,
            title,
            fontsize=TITLE_SIZE if not title_mono else BODY_SIZE,
            fontweight="semibold" if not title_mono else "normal",
            color=edge,
            family="monospace" if title_mono else None,
            ha="left",
            va="top",
            zorder=3,
        )
    return placed


# ---------------------------------------------------------------------------
# arrow()
# ---------------------------------------------------------------------------


def arrow(
    ax: Axes,
    src: Placed | Point,
    dst: Placed | Point,
    *,
    label: str | None = None,
    kind: ArrowKind = "dataflow",
    label_offset: tuple[float, float] = (0.0, 0.15),
) -> None:
    """Draw an arrow from *src* to *dst* with optional mid-edge label.

    When a :class:`Placed` is passed, the nearest edge midpoint (left / right /
    top / bottom, whichever faces the target) is used automatically.

    Args:
        ax: Axes.
        src: Source block or point.
        dst: Destination block or point.
        label: Optional label placed at the midpoint of the arrow.
        kind: Stroke style — ``"dataflow"`` (mid gray solid), ``"transform"``
            (copper solid), or ``"comm"`` (flow-blue dashed).
        label_offset: ``(dx, dy)`` applied to the label position, in axes units.
    """
    src_pt = _connect_point(src, dst) if isinstance(src, Placed) else src
    dst_pt = _connect_point(dst, src) if isinstance(dst, Placed) else dst
    style = ARROW_STYLES[kind]
    ax.add_patch(
        FancyArrowPatch(
            src_pt,
            dst_pt,
            arrowstyle="->",
            mutation_scale=18,
            zorder=3,
            **style,  # type: ignore[arg-type]
        )
    )
    if label is not None:
        mx = (src_pt[0] + dst_pt[0]) / 2 + label_offset[0]
        my = (src_pt[1] + dst_pt[1]) / 2 + label_offset[1]
        ax.text(
            mx,
            my,
            label,
            fontsize=ANNOT_SIZE,
            color=str(style["color"]),
            fontweight="semibold",
            ha="center",
            va="center",
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.5},
            zorder=4,
        )


def _connect_point(src: Placed, target: Placed | Point) -> Point:
    """Pick the edge midpoint of *src* that faces *target*."""
    tx, ty = (target.cx, target.cy) if isinstance(target, Placed) else target
    dx = tx - src.cx
    dy = ty - src.cy
    if abs(dx) >= abs(dy):
        return src.right_mid if dx > 0 else src.left_mid
    return src.top_mid if dy > 0 else src.bottom_mid


# ---------------------------------------------------------------------------
# arrange() — grid of equal-sized children inside a bounding box
# ---------------------------------------------------------------------------


def arrange(
    bounds: tuple[Point, tuple[float, float]],
    *,
    rows: int = 1,
    cols: int = 1,
    pad: float = INNER_PAD,
    gap: float = GAP,
    reserve_top: float = 0.0,
) -> list[tuple[Point, tuple[float, float]]]:
    """Return (xy, wh) for a `rows`-by-`cols` grid of equal cells inside *bounds*.

    Cells are returned in **row-major order starting from the top-left**, so
    callers can iterate ``for (xy, wh) in arrange(...)`` and get the visual
    reading order.

    Args:
        bounds: ``((x, y), (w, h))`` bounding box in axes units.
        rows, cols: Grid dimensions.
        pad: Inner padding between the bounding box and the first/last cells.
        gap: Gap between cells.
        reserve_top: Extra space reserved above the grid (for a container
            title that sits inside the bounding box).
    """
    (bx, by), (bw, bh) = bounds
    inner_x = bx + pad
    inner_y = by + pad
    inner_w = bw - 2 * pad
    inner_h = bh - 2 * pad - reserve_top

    cell_w = (inner_w - (cols - 1) * gap) / cols
    cell_h = (inner_h - (rows - 1) * gap) / rows

    out: list[tuple[Point, tuple[float, float]]] = []
    # Row 0 at the top → y decreases as r increases
    for r in range(rows):
        for c in range(cols):
            x = inner_x + c * (cell_w + gap)
            y = inner_y + (rows - 1 - r) * (cell_h + gap)
            out.append(((x, y), (cell_w, cell_h)))
    return out


# ---------------------------------------------------------------------------
# Typography helpers
# ---------------------------------------------------------------------------


def text(
    ax: Axes,
    xy: Point,
    s: str,
    *,
    size: int = BODY_SIZE,
    color: str = COLORS.DARK_TEXT,
    weight: str = "normal",
    italic: bool = False,
    ha: str = "left",
    va: str = "baseline",
    family: str | None = None,
    zorder: int = 3,
) -> None:
    """Typography-aware ``ax.text`` wrapper.

    Defaults match the design system (BODY_SIZE, DARK_TEXT, no italic).
    """
    ax.text(
        xy[0],
        xy[1],
        s,
        fontsize=size,
        color=color,
        fontweight=weight,
        fontstyle="italic" if italic else "normal",
        family=family,
        ha=ha,
        va=va,
        zorder=zorder,
    )


def math(
    ax: Axes,
    xy: Point,
    tex: str,
    *,
    size: int = BODY_SIZE,
    color: str = COLORS.DARK_TEXT,
    ha: str = "left",
    va: str = "baseline",
    zorder: int = 3,
) -> None:
    """Render a mathtext / LaTeX fragment (``$...$`` handled by matplotlib)."""
    ax.text(xy[0], xy[1], tex, fontsize=size, color=color, ha=ha, va=va, zorder=zorder)


def caption(
    ax: Axes,
    xy: Point,
    s: str,
    *,
    ha: str = "left",
    va: str = "baseline",
) -> None:
    """Italic annotation at ANNOT_SIZE in MID_TEXT."""
    text(ax, xy, s, size=ANNOT_SIZE, color=COLORS.MID_TEXT, italic=True, ha=ha, va=va)


# ---------------------------------------------------------------------------
# Body-positioning helpers
# ---------------------------------------------------------------------------


def body_position(
    b: Placed,
    line: int = 0,
    *,
    dx: float = 0.0,
) -> Point:
    """Return the (x, y) position for the ``line``-th body row inside block *b*.

    Every script that places multiple lines of labels inside a block should
    call this instead of computing offsets by hand — that's the only way
    the design system's rhythm (BODY_TOP_OFFSET, BODY_LINE_HEIGHT) stays
    consistent across diagrams.

    Line 0 is the first body row; subsequent rows step down by
    :data:`BODY_LINE_HEIGHT`. The x coordinate is ``b.left + INNER_PAD + dx``
    so text is left-aligned against the inner-padded left edge by default.
    """
    return (
        b.left + INNER_PAD + dx,
        b.top - BODY_TOP_OFFSET - line * BODY_LINE_HEIGHT,
    )


def body_center(b: Placed, line: int = 0) -> Point:
    """Like :func:`body_position` but horizontally centred on the block."""
    return (b.cx, b.top - BODY_TOP_OFFSET - line * BODY_LINE_HEIGHT)


def caption_position(b: Placed, *, dx: float = 0.0) -> Point:
    """Return (x, y) for a caption at the bottom of block *b*."""
    return (b.left + INNER_PAD + dx, b.bottom + INNER_PAD + 0.05)
