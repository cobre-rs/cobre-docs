#!/usr/bin/env python3
r"""D-23: PAR model - stored (on-disk) vs computed (runtime) quantities.

Two parquet files on disk hold **scale-invariant** PAR quantities:
  - `inflow_seasonal_stats.parquet`  -> $\mu_m$, $s_m$
  - `inflow_ar_coefficients.parquet` -> $\psi^*_{m,\ell}$, $\sigma_m / s_m$, $p_m$

At runtime, these are combined into **original-unit** LP inputs:
  - $\psi_{m,\ell} = \psi^*_{m,\ell} \cdot s_m / s_{m-\ell}$
  - $\sigma_m     = s_m \cdot (\sigma_m / s_m)$

Storing the scale-invariant form lets the user swap $\mu_m, s_m$ for climate
scenarios without refitting the AR model.

Layout uses the shared `block_layout` primitives so role colours, corner
radii, typography, and arrow styles match every other composed-block diagram
in the reference (notably d07-d09 HPC topology). See
`docs/design/diagram-authoring.md` §4.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from block_layout import (
    arrow,
    block,
    body_center,
    body_position,
    caption,
    caption_position,
    math,
    text,
)
from cobre_brand import COLORS, apply_cobre_style

apply_cobre_style(dark=False)

fig, ax = plt.subplots(figsize=(12, 7.5))
ax.set_xlim(0, 12)
ax.set_ylim(0, 8)
ax.set_axis_off()

# Column headers (outside any block — use BODY so they remain legible on the
# transparent figure that renders over the coal-theme mdBook page).
text(
    ax,
    (2.25, 7.55),
    "Storage format - files on disk",
    size=13,
    weight="semibold",
    color=COLORS.BODY,
    ha="center",
)
text(
    ax,
    (9.75, 7.55),
    "Runtime format - in-memory for LP",
    size=13,
    weight="semibold",
    color=COLORS.BODY,
    ha="center",
)

# --- Left column: two parquet files on disk ------------------------------
stats = block(
    ax,
    (0.25, 4.9),
    (4.0, 2.0),
    title="inflow_seasonal_stats",
    title_mono=True,
    role="storage",
)
math(ax, body_position(stats, 0), r"$\mu_m$  (seasonal mean)")
math(ax, body_position(stats, 1), r"$s_m$  (seasonal std, sample)")
caption(ax, caption_position(stats), "swappable for climate-scenario studies")

arcoef = block(
    ax,
    (0.25, 1.5),
    (4.0, 2.0),
    title="inflow_ar_coefficients",
    title_mono=True,
    role="storage",
)
math(
    ax,
    body_position(arcoef, 0),
    r"$\psi^{*}_{m,\ell}$  (standardized AR coeff)",
)
math(
    ax,
    body_position(arcoef, 1),
    r"$\sigma_m / s_m$  (residual std ratio, $\in (0,1]$)",
)
math(ax, body_position(arcoef, 2), r"$p_m$  (order, rows per season)")

# Outside-block caption — explicit BODY color for legibility on the
# transparent figure.
text(
    ax,
    (2.25, 1.0),
    "Scale-invariant - depend only on the normalized process",
    size=10,
    italic=True,
    color=COLORS.BODY,
    ha="center",
)

# --- Right column: two runtime outputs + LP consumer ---------------------
# Split into two runtime blocks so each title fits cleanly and the math
# for each derived quantity is self-contained.
runtime_psi = block(
    ax,
    (7.75, 5.4),
    (4.0, 1.15),
    title="Original-unit AR coefficients",
    role="runtime",
)
math(
    ax,
    body_center(runtime_psi, 0),
    r"$\psi_{m,\ell} = \psi^{*}_{m,\ell} \cdot \dfrac{s_m}{s_{m-\ell}}$",
    size=14,
    ha="center",
)


lp = block(ax, (7.75, 3.5), (4.0, 1.4), role="neutral", lw=1.0)
caption(ax, (lp.cx, lp.top - 0.35), "consumed by LP stage subproblem", ha="center")
math(
    ax,
    (lp.cx, lp.top - 0.85),
    (
        r"$a_h = \mu_m - \sum_\ell \psi_{m,\ell}\,\mu_{m-\ell}"
        r" + \sum_\ell \psi_{m,\ell}\,a_{h,\ell} + \sigma_m\,\eta_t$"
    ),
    size=10,
    ha="center",
)


runtime_sigma = block(
    ax,
    (7.75, 1.75),
    (4.0, 1.15),
    title="Original-unit residual std",
    role="runtime",
)
math(
    ax,
    body_center(runtime_sigma, 0),
    r"$\sigma_m = s_m \cdot (\sigma_m / s_m)$",
    size=14,
    ha="center",
)

# --- Transformation arrows: left column -> runtime -----------------------
# Both runtime quantities depend on s_m from the seasonal stats file, and on
# their specific coefficient from the AR coefficients file. Showing one
# dominant arrow per destination (with the scaling factor as label) keeps
# the data flow legible.
arrow(
    ax,
    stats,
    runtime_psi,
    label=r"$\times\, s_m / s_{m-\ell}$",
    kind="transform",
)
arrow(ax, arcoef, runtime_sigma, label=r"$\times\, s_m$", kind="transform")

# Runtime -> LP (implicit dataflow)
arrow(ax, runtime_psi, lp, kind="dataflow")
arrow(ax, runtime_sigma, lp, kind="dataflow")

fig.suptitle(
    "PAR inflow model - stored vs computed quantities",
    fontsize=15,
    fontweight="semibold",
    color=COLORS.BRIGHT,
    y=0.98,
)

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight", transparent=True)
print(f"Saved {stem}.svg to {out}")
