#!/usr/bin/env python3
r"""D-23: PAR model — stored (on-disk) vs computed (runtime) quantities.

Two parquet files on disk hold **scale-invariant** PAR quantities:
  - `inflow_seasonal_stats.parquet`  → $\mu_m$, $s_m$
  - `inflow_ar_coefficients.parquet` → $\psi^*_{m,\ell}$, $\sigma_m / s_m$, $p_m$

At runtime, these are combined into **original-unit** LP inputs:
  - $\psi_{m,\ell} = \psi^*_{m,\ell} \cdot s_m / s_{m-\ell}$
  - $\sigma_m     = s_m \cdot (\sigma_m / s_m)$

Storing the scale-invariant form lets the user swap $\mu_m, s_m$ for climate
scenarios without refitting the AR model.

This is a data-flow layout; matplotlib patches + `$...$` math rendering keep
the notation publication-quality, which mermaid would not.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from cobre_brand import COLORS, apply_cobre_style
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

apply_cobre_style(dark=False)


def box(
    ax: plt.Axes,  # type: ignore[name-defined]
    xy: tuple[float, float],
    wh: tuple[float, float],
    face: str,
    edge: str,
    *,
    lw: float = 1.4,
) -> None:
    ax.add_patch(
        FancyBboxPatch(
            xy,
            wh[0],
            wh[1],
            boxstyle="round,pad=0.02,rounding_size=0.03",
            facecolor=face,
            edgecolor=edge,
            linewidth=lw,
            zorder=2,
        )
    )


fig, ax = plt.subplots(figsize=(12, 6.5))
ax.set_xlim(0, 12)
ax.set_ylim(0, 7)
ax.set_axis_off()

# Column headers -----------------------------------------------------------
ax.text(
    2.25,
    6.55,
    "Storage format — files on disk",
    fontsize=13,
    fontweight="semibold",
    color=COLORS.DARK_TEXT,
    ha="center",
)
ax.text(
    9.75,
    6.55,
    "Runtime format — in-memory for LP",
    fontsize=13,
    fontweight="semibold",
    color=COLORS.DARK_TEXT,
    ha="center",
)

# Left column: two parquet files ------------------------------------------
# Seasonal stats
box(ax, (0.25, 4.5), (4.0, 1.6), "#F5EEE4", COLORS.COPPER)
ax.text(
    0.45,
    5.9,
    "inflow_seasonal_stats.parquet",
    fontsize=10,
    color=COLORS.COPPER_DARK,
    family="monospace",
)
ax.text(0.45, 5.45, r"$\mu_m$  (seasonal mean)", fontsize=12, color=COLORS.DARK_TEXT)
ax.text(0.45, 5.00, r"$s_m$  (seasonal std, sample)", fontsize=12, color=COLORS.DARK_TEXT)
ax.text(
    0.45,
    4.65,
    "swappable for climate-scenario studies",
    fontsize=9,
    color=COLORS.MID_TEXT,
    style="italic",
)

# AR coefficients
box(ax, (0.25, 2.3), (4.0, 1.9), "#EDF5EE", COLORS.PATINA)
ax.text(
    0.45,
    3.95,
    "inflow_ar_coefficients.parquet",
    fontsize=10,
    color="#2E6650",
    family="monospace",
)
ax.text(
    0.45, 3.45, r"$\psi^{*}_{m,\ell}$  (standardized AR coeff)", fontsize=12, color=COLORS.DARK_TEXT
)
ax.text(
    0.45,
    3.00,
    r"$\sigma_m / s_m$  (residual std ratio, $\in (0,1]$)",
    fontsize=12,
    color=COLORS.DARK_TEXT,
)
ax.text(0.45, 2.55, r"$p_m$  (order, rows per season)", fontsize=12, color=COLORS.DARK_TEXT)

ax.text(
    2.25,
    1.85,
    "Scale-invariant — depend only on the normalized process",
    ha="center",
    fontsize=10,
    color=COLORS.MID_TEXT,
    style="italic",
)

# Right column: runtime quantities ----------------------------------------
box(ax, (7.75, 3.4), (4.0, 2.7), "#F5EEE4", COLORS.COPPER)
ax.text(
    7.95,
    5.85,
    "Original-unit AR coefficients",
    fontsize=11,
    color=COLORS.COPPER_DARK,
    fontweight="semibold",
)
ax.text(
    7.95,
    5.30,
    r"$\psi_{m,\ell} = \psi^{*}_{m,\ell} \cdot \dfrac{s_m}{s_{m-\ell}}$",
    fontsize=14,
    color=COLORS.DARK_TEXT,
)
ax.text(
    7.95,
    4.55,
    "Original-unit residual std",
    fontsize=11,
    color=COLORS.COPPER_DARK,
    fontweight="semibold",
)
ax.text(
    7.95,
    4.00,
    r"$\sigma_m = s_m \cdot (\sigma_m / s_m)$",
    fontsize=14,
    color=COLORS.DARK_TEXT,
)

# LP consumer
box(ax, (7.75, 1.9), (4.0, 1.1), COLORS.WHITE, COLORS.MID_TEXT, lw=1.0)
ax.text(
    9.75,
    2.65,
    "consumed by LP stage subproblem",
    ha="center",
    fontsize=10,
    color=COLORS.MID_TEXT,
)
ax.text(
    9.75,
    2.20,
    (
        r"$a_h = \mu_m - \sum_\ell \psi_{m,\ell}\,\mu_{m-\ell}"
        r" + \sum_\ell \psi_{m,\ell}\,a_{h,\ell} + \sigma_m\,\eta_t$"
    ),
    ha="center",
    fontsize=10,
    color=COLORS.DARK_TEXT,
)

# Transformation arrows ----------------------------------------------------
for y_src, label in [(5.30, r"$\times\, s_m / s_{m-\ell}$"), (3.20, r"$\times\, s_m$")]:
    ax.add_patch(
        FancyArrowPatch(
            (4.35, y_src),
            (7.65, y_src if y_src > 4.5 else 4.20),
            arrowstyle="->",
            mutation_scale=18,
            color=COLORS.COPPER,
            linewidth=1.6,
        )
    )
    mid_y = y_src if y_src > 4.5 else (y_src + 4.20) / 2
    ax.text(
        6.0,
        mid_y + 0.2,
        label,
        ha="center",
        fontsize=11,
        color=COLORS.COPPER,
        fontweight="semibold",
    )

fig.suptitle(
    "PAR inflow model — stored vs computed quantities",
    fontsize=15,
    fontweight="semibold",
    y=0.98,
)

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight")
print(f"Saved {stem}.svg to {out}")
