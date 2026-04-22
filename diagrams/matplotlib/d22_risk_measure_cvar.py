#!/usr/bin/env python3
r"""D-22: Risk measure landscape — expectation, VaR, CVaR, and the tail.

Given a right-skewed cost distribution, mark:
- $\mathbb{E}[C]$ (risk-neutral reference),
- $\mathrm{VaR}_\alpha$ = the $(1-\alpha)$ quantile of $C$,
- $\mathrm{CVaR}_\alpha = \mathbb{E}[C \mid C \geq \mathrm{VaR}_\alpha]$
  (tail mean).

The $(1-\alpha)$ tail is shaded; the convex-combination risk measure
$\rho^{\lambda,\alpha}[C] = (1-\lambda)\mathbb{E}[C] + \lambda\,\mathrm{CVaR}_\alpha[C]$
is shown as a subtitle annotation. Everything is derived numerically from the
analytic PDF, so markers are correct by construction.
"""

from __future__ import annotations

from math import lgamma
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from cobre_brand import COLORS, apply_cobre_style
from numpy.typing import NDArray

apply_cobre_style(dark=False)


def gamma_pdf(x: NDArray[np.float64], shape: float, scale: float) -> NDArray[np.float64]:
    """Analytic gamma PDF via its log form (numerically stable near 0)."""
    with np.errstate(divide="ignore", invalid="ignore"):
        log_f = (shape - 1) * np.log(x) - x / scale - shape * np.log(scale) - lgamma(shape)
    f: NDArray[np.float64] = np.exp(log_f)
    f[~np.isfinite(f)] = 0.0
    return f


# ---- distribution & risk moments ----
shape, scale = 3.0, 15.0  # mean = 45, std ≈ 26, right-skewed
alpha = 0.10

x = np.linspace(0.0, 180.0, 4000)
f = gamma_pdf(x, shape, scale)

# Cumulative + numerical quantile inversion.
cdf = np.concatenate(([0.0], np.cumsum((f[:-1] + f[1:]) / 2 * np.diff(x))))
cdf /= cdf[-1]
expected = float(np.trapezoid(x * f, x))
var_alpha = float(np.interp(1.0 - alpha, cdf, x))

tail_mask = x >= var_alpha
tail_mass = float(np.trapezoid(f[tail_mask], x[tail_mask]))
cvar_alpha = float(np.trapezoid(x[tail_mask] * f[tail_mask], x[tail_mask]) / tail_mass)


# ---- figure ----
fig, ax = plt.subplots(figsize=(10, 5.2))

ax.fill_between(
    x[tail_mask],
    0,
    f[tail_mask],
    color=COLORS.SIGNAL_RED,
    alpha=0.18,
    linewidth=0,
    label=rf"$(1-\alpha)={1 - alpha:.2f}$ tail",
    zorder=2,
)
ax.plot(x, f, color=COLORS.DARK_TEXT, linewidth=2.2, label="cost density $f(C)$", zorder=4)

for value, color, label, offset in [
    (expected, COLORS.FLOW_BLUE, r"$\mathbb{E}[C]$", (0, 10)),
    (var_alpha, COLORS.COPPER, r"$\mathrm{VaR}_\alpha$", (0, 10)),
    (cvar_alpha, COLORS.SIGNAL_RED, r"$\mathrm{CVaR}_\alpha$", (0, 22)),
]:
    ax.axvline(value, color=color, linewidth=1.6, linestyle="--", alpha=0.9, zorder=5)
    y_top = float(np.interp(value, x, f))
    ax.annotate(
        label,
        xy=(value, y_top),
        xytext=(value + offset[0], y_top + offset[1] * f.max() / 30),
        fontsize=12,
        color=color,
        fontweight="semibold",
        ha="left",
    )

ax.annotate(
    r"$\mathrm{CVaR}_\alpha = \mathbb{E}[C \mid C \geq \mathrm{VaR}_\alpha]$",
    xy=(cvar_alpha, float(np.interp(cvar_alpha, x, f)) * 0.5),
    xytext=(cvar_alpha + 15, f.max() * 0.55),
    fontsize=11,
    color=COLORS.SIGNAL_RED,
    arrowprops={
        "arrowstyle": "->",
        "color": COLORS.SIGNAL_RED,
        "linewidth": 0.9,
        "connectionstyle": "arc3,rad=0.15",
    },
)

ax.set_xlabel("total cost $C$")
ax.set_ylabel("probability density")
ax.set_title(
    f"Risk measures under a right-skewed cost distribution  "
    rf"($\alpha={alpha:.2f}$)",
    fontsize=13,
    fontweight="semibold",
)
ax.set_xlim(0, 170)
ax.set_ylim(0, f.max() * 1.25)
ax.legend(loc="upper right", fontsize=10)

ax.text(
    85,
    -0.0045,
    r"$\rho^{\lambda,\alpha}[C] = (1-\lambda)\,\mathbb{E}[C] + \lambda\,\mathrm{CVaR}_\alpha[C]$,  "
    r"$\lambda \in [0,1]$ controls risk aversion",
    ha="center",
    fontsize=10,
    color=COLORS.MID_TEXT,
    transform=ax.transData,
)

fig.tight_layout()

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg")
print(f"Saved {stem}.svg to {out}")
