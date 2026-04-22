#!/usr/bin/env python3
"""D-21: Convergence bound evolution (LB monotone-up, UB Monte Carlo with CI band).

The lower bound is monotone non-decreasing — adding cuts can only raise the
restricted-master value. The upper bound is a Monte Carlo estimate of policy
cost from forward simulations, so it fluctuates under sampling noise, with a
confidence band that tightens as the per-iteration sample size grows.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from cobre_brand import COLORS, apply_cobre_style

apply_cobre_style(dark=False)

rng = np.random.default_rng(42)

K = np.arange(0, 26)
c_star = 100.0

# LB rises from 70 → ~99 along a concave ramp (adding cuts → tighter outer approx).
lb = c_star - 30.0 * np.exp(-K / 8.0)

# UB descends from ~140 → ~101 with MC noise; CI band tightens with iteration.
ub_mean = c_star + 40.0 * np.exp(-K / 8.0) + 1.0
ci_sigma = 8.0 * np.exp(-K / 12.0) + 1.0
ub = ub_mean + rng.normal(0.0, ci_sigma * 0.3)

fig, ax = plt.subplots(figsize=(10, 5))

ax.fill_between(
    K,
    ub_mean - 1.96 * ci_sigma,
    ub_mean + 1.96 * ci_sigma,
    color=COLORS.SIGNAL_RED,
    alpha=0.12,
    linewidth=0,
    label="UB 95% CI",
    zorder=2,
)
ax.plot(
    K,
    ub,
    "-",
    color=COLORS.SIGNAL_RED,
    linewidth=2.0,
    label="UB (Monte Carlo)",
    zorder=4,
)
ax.plot(
    K,
    ub,
    "o",
    color=COLORS.SIGNAL_RED,
    markersize=4,
    markerfacecolor="white",
    markeredgewidth=1.2,
    zorder=5,
)

ax.plot(
    K,
    lb,
    "-",
    color=COLORS.PATINA,
    linewidth=2.5,
    label="LB (monotone ↑)",
    zorder=4,
)

# Gap callout at k=10, where the gap is still visually obvious.
k_gap = 10
ax.annotate(
    "gap",
    xy=(k_gap, (lb[k_gap] + ub_mean[k_gap]) / 2),
    xytext=(k_gap + 3, (lb[k_gap] + ub_mean[k_gap]) / 2 + 8),
    fontsize=11,
    color=COLORS.COPPER,
    fontweight="semibold",
    arrowprops={"arrowstyle": "-", "color": COLORS.COPPER, "linewidth": 1.0},
)
ax.vlines(
    k_gap,
    lb[k_gap],
    ub_mean[k_gap],
    color=COLORS.COPPER,
    linewidth=1.2,
    linestyle=":",
    zorder=3,
)

# Converged annotation at the right edge.
k_conv = K[-1]
ax.annotate(
    "converged\n(gap ≤ tol)",
    xy=(k_conv, (lb[-1] + ub_mean[-1]) / 2),
    xytext=(k_conv - 6, 80),
    fontsize=10,
    color=COLORS.MID_TEXT,
    ha="center",
    arrowprops={
        "arrowstyle": "->",
        "color": COLORS.MID_TEXT,
        "linewidth": 0.8,
        "connectionstyle": "arc3,rad=-0.2",
    },
)

ax.set_xlabel("iteration $k$")
ax.set_ylabel("total expected cost")
ax.set_title(
    "Convergence: lower and upper bound evolution",
    fontsize=14,
    fontweight="semibold",
)
ax.set_xlim(0, 25)
ax.set_ylim(60, 150)
ax.legend(loc="upper right", fontsize=10)
ax.text(
    12.5,
    43,
    r"Stopping rule: gap $= (\mathrm{UB} - \mathrm{LB})\, /\, \max(1, |\mathrm{UB}|)"
    r" \leq \mathrm{tol}$, or stall / iteration limit",
    ha="center",
    fontsize=9,
    color=COLORS.MID_TEXT,
    transform=ax.transData,
)

fig.tight_layout()

out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg")
print(f"Saved {stem}.svg to {out}")
