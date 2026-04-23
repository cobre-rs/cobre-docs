#!/usr/bin/env python3
r"""D-24: LP column layout - variable regions of a stage subproblem.

Shows the column structure of the stage LP solved inside the forward /
backward pass. Variables are partitioned into three contiguous regions:

1. **State (coupling)**: storage ``v_h`` and AR lags ``a_{h,ℓ}``. The duals
   of the fixing constraints on these columns become the cut coefficients
   ``π`` — contiguity is why state duals can be extracted as a slice.
2. **Dispatch (per-block, stage-local)**: network flow, generation,
   spillage, deficit. No coupling to adjacent stages.
3. **Future cost**: a single ``θ`` column; Benders cuts bind on it as
   ``θ ≥ α + π' x``.

Below the column band, four constraint rows are listed with their
algebraic forms.

Uses ``block_layout`` for the role-based palette so the diagram's visual
identity matches d07-d09 and d23.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from block_layout import (
    ANNOT_SIZE,
    BODY_SIZE,
    INNER_PAD,
    TITLE_SIZE,
    TITLE_TOP_OFFSET,
    Placed,
    block,
    caption_position,
    text,
)
from cobre_brand import COLORS, apply_cobre_style

apply_cobre_style(dark=False)


fig, ax = plt.subplots(figsize=(12, 9.5))
ax.set_xlim(0, 12)
ax.set_ylim(0, 10)
ax.set_axis_off()


# =============================================================================
# TOP SECTION — Decision variables (columns)
# =============================================================================
ax.text(
    6.0,
    9.45,
    "Decision variables  ·  contiguous column indices",
    fontsize=13,
    fontweight="semibold",
    color=COLORS.BODY,
    ha="center",
)

# Three group blocks laid out horizontally, widths roughly proportional to
# the count of variable types in each group.
#
#     State  ──────┤├── Dispatch (per block k) ──────────────┤├── Future ──
#
VAR_Y, VAR_H = 6.7, 1.5
GAP = 0.25

# State (runtime role: contiguous coupling block). 2 variable types.
state = block(
    ax,
    (0.3, VAR_Y),
    (2.6, VAR_H),
    title="State (coupling)",
    role="runtime",
    lw=1.3,
)

# Dispatch (compute role: the large per-block computation).
DISPATCH_W = 7.4
dispatch = block(
    ax,
    (state.right + GAP, VAR_Y),
    (DISPATCH_W, VAR_H),
    title="Dispatch (per block k, stage-local)",
    role="compute",
    lw=1.3,
)

# Future cost (shared role: the single column that Benders cuts bind on).
future = block(
    ax,
    (dispatch.right + GAP, VAR_Y),
    (1.2, VAR_H),
    title="Future",
    role="shared",
    lw=1.3,
)


def var_label(
    container: Placed, dx: float, dy: float, symbol: str, desc: str
) -> None:
    """A single column-variable label inside a group block.

    Writes the math symbol on an upper line (BODY_SIZE) and a short
    description below (ANNOT_SIZE, italic grey).
    """
    text(
        ax,
        (container.left + dx, container.top - TITLE_TOP_OFFSET - 0.45 + dy),
        symbol,
        size=BODY_SIZE,
        color=COLORS.DARK_TEXT,
    )
    text(
        ax,
        (container.left + dx, container.top - TITLE_TOP_OFFSET - 0.85 + dy),
        desc,
        size=ANNOT_SIZE,
        italic=True,
        color=COLORS.MID_TEXT,
    )


# --- State variables ------------------------------------------------------
var_label(state, INNER_PAD, 0.0, r"$v_h$", "storage")
var_label(state, INNER_PAD + 1.2, 0.0, r"$a_{h,\ell}$", "AR lags")

# --- Dispatch variables (7 types across the 7.4-wide block) --------------
dispatch_vars = [
    (r"$f_{l,k}$", "flow"),
    (r"$q_{h,k}$", "hydro gen"),
    (r"$q^{f}_{h,k}$", "turbined"),
    (r"$s_{h,k}$", "spill"),
    (r"$g_{j,k}$", "thermal"),
    (r"$r_{n,k}$", "NCS"),
    (r"$\delta_{b,k,s}$", "deficit"),
]
cell_w = (DISPATCH_W - 2 * INNER_PAD) / len(dispatch_vars)
for i, (sym, dsc) in enumerate(dispatch_vars):
    var_label(dispatch, INNER_PAD + i * cell_w, 0.0, sym, dsc)

# --- Future cost variable -------------------------------------------------
var_label(future, INNER_PAD, 0.0, r"$\theta$", "future cost")


# Under-band annotations that point at the regions where duals and cuts live.
text(
    ax,
    (state.cx, VAR_Y - 0.3),
    "↑  duals → cut coefficients",
    size=ANNOT_SIZE,
    italic=True,
    color=COLORS.PATINA,
    ha="center",
)
text(
    ax,
    (future.cx, VAR_Y - 0.3),
    "↑  cut constraints",
    size=ANNOT_SIZE,
    italic=True,
    color=COLORS.FLOW_BLUE,
    ha="center",
)


# =============================================================================
# BOTTOM SECTION — Constraint rows
# =============================================================================
text(
    ax,
    (6.0, 5.5),
    "Constraint rows",
    size=TITLE_SIZE,
    weight="semibold",
    color=COLORS.BODY,
    ha="center",
)


def constraint_row(
    y: float,
    *,
    title: str,
    formula: str,
    desc: str,
    role: str,
) -> None:
    b = block(
        ax,
        (0.3, y),
        (11.4, 0.95),
        title=title,
        role=role,  # type: ignore[arg-type]
        lw=1.1,
    )
    # Formula right-aligned; description italic caption at bottom.
    text(
        ax,
        (b.right - INNER_PAD, b.top - TITLE_TOP_OFFSET),
        formula,
        size=BODY_SIZE,
        color=COLORS.DARK_TEXT,
        ha="right",
        va="top",
    )
    text(
        ax,
        caption_position(b),
        desc,
        size=ANNOT_SIZE,
        italic=True,
        color=COLORS.MID_TEXT,
    )


y = 4.4
rows: list[dict[str, str]] = [
    {
        "title": "Load balance",
        "formula": (
            r"$\sum_{\mathrm{gen}} + \mathrm{imports} - \mathrm{exports}"
            r" + \delta = \mathrm{demand}$"
        ),
        "desc": "per bus, per block",
        "role": "compute",
    },
    {
        "title": "Water balance",
        "formula": r"$v_h = \hat{v}_h + (a_h - q^{f}_h - s_h)\,\tau_k\,\cdot 3.6$",
        "desc": "per hydro, per block",
        "role": "compute",
    },
    {
        "title": "Fixing constraints",
        "formula": r"$v_h = \hat{v}_h,\quad a_{h,\ell} = \hat{a}_{h,\ell}$",
        "desc": "state coupling — duals here become cut coefficients π",
        "role": "runtime",
    },
    {
        "title": "Benders cuts",
        "formula": r"$\theta \geq \alpha + \pi^{\top} x$",
        "desc": r"outer approximation of $V_{t+1}$",
        "role": "shared",
    },
]
for row in rows:
    constraint_row(y, **row)
    y -= 1.05


# =============================================================================
# Bottom caption
# =============================================================================
text(
    ax,
    (6.0, 0.4),
    "Columns are indexed contiguously. The Indexer maps "
    "(entity, block, variable_type) → column index.",
    size=ANNOT_SIZE,
    italic=True,
    color=COLORS.BODY,
    ha="center",
)


# =============================================================================
# Title & save
# =============================================================================
fig.suptitle(
    "LP column layout — stage subproblem variable regions",
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
