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

Layout uses the shared `block_layout` primitives so role colours, corner
radii, typography, and arrow styles match every other composed-block diagram
in the reference (notably d07-d09 HPC topology). See
`docs/design/diagram-authoring.md` §4.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from block_layout import INNER_PAD, arrow, block, caption, math, text
from cobre_brand import apply_cobre_style

apply_cobre_style(dark=False)

fig, ax = plt.subplots(figsize=(12, 6.5))
ax.set_xlim(0, 12)
ax.set_ylim(0, 7)
ax.set_axis_off()

# Column headers
text(ax, (2.25, 6.55), "Storage format — files on disk", size=13, weight="semibold", ha="center")
text(ax, (9.75, 6.55), "Runtime format — in-memory for LP", size=13, weight="semibold", ha="center")

# --- Left column: two parquet files on disk ------------------------------
stats = block(
    ax,
    (0.25, 4.5),
    (4.0, 1.6),
    title="inflow_seasonal_stats.parquet",
    title_mono=True,
    role="storage",
)
math(ax, (stats.left + INNER_PAD, stats.top - 0.55), r"$\mu_m$  (seasonal mean)")
math(ax, (stats.left + INNER_PAD, stats.top - 1.00), r"$s_m$  (seasonal std, sample)")
caption(ax, (stats.left + INNER_PAD, stats.bottom + 0.25), "swappable for climate-scenario studies")

arcoef = block(
    ax,
    (0.25, 2.3),
    (4.0, 1.9),
    title="inflow_ar_coefficients.parquet",
    title_mono=True,
    role="storage",
)
math(
    ax,
    (arcoef.left + INNER_PAD, arcoef.top - 0.55),
    r"$\psi^{*}_{m,\ell}$  (standardized AR coeff)",
)
math(
    ax,
    (arcoef.left + INNER_PAD, arcoef.top - 1.00),
    r"$\sigma_m / s_m$  (residual std ratio, $\in (0,1]$)",
)
math(ax, (arcoef.left + INNER_PAD, arcoef.top - 1.45), r"$p_m$  (order, rows per season)")

caption(ax, (2.25, 1.85), "Scale-invariant — depend only on the normalized process", ha="center")

# --- Right column: runtime outputs + LP consumer -------------------------
runtime = block(
    ax,
    (7.75, 3.4),
    (4.0, 2.7),
    title="Original-unit AR coefficients + residual std",
    role="runtime",
)
math(
    ax,
    (runtime.cx, runtime.top - 0.95),
    r"$\psi_{m,\ell} = \psi^{*}_{m,\ell} \cdot \dfrac{s_m}{s_{m-\ell}}$",
    size=14,
    ha="center",
)
math(
    ax,
    (runtime.cx, runtime.top - 2.05),
    r"$\sigma_m = s_m \cdot (\sigma_m / s_m)$",
    size=14,
    ha="center",
)

lp = block(ax, (7.75, 1.9), (4.0, 1.1), role="neutral", lw=1.0)
caption(ax, (lp.cx, lp.top - 0.35), "consumed by LP stage subproblem", ha="center")
math(
    ax,
    (lp.cx, lp.top - 0.75),
    (
        r"$a_h = \mu_m - \sum_\ell \psi_{m,\ell}\,\mu_{m-\ell}"
        r" + \sum_\ell \psi_{m,\ell}\,a_{h,\ell} + \sigma_m\,\eta_t$"
    ),
    size=10,
    ha="center",
)

# --- Transformation arrows: left column → runtime ------------------------
arrow(ax, stats, runtime, label=r"$\times\, s_m / s_{m-\ell}$", kind="transform")
arrow(ax, arcoef, runtime, label=r"$\times\, s_m$", kind="transform")

# Runtime → LP (implicit dataflow)
arrow(ax, runtime, lp, kind="dataflow")

fig.suptitle(
    "PAR inflow model — stored vs computed quantities", fontsize=15, fontweight="semibold", y=0.98
)

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg", bbox_inches="tight")
print(f"Saved {stem}.svg to {out}")
