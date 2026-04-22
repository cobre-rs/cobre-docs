#!/usr/bin/env python3
"""D-02: Value function approximation via Benders cuts."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from cobre_brand import COLORS, apply_cobre_style
from numpy.typing import NDArray

apply_cobre_style(dark=False)

v = np.linspace(0, 100, 500)
Q = 0.005 * (v - 50) ** 2 + 5  # convex parabola, minimum at v=50

trials = [25, 75]


def tangent(v0: float, v_range: NDArray[np.float64]) -> NDArray[np.float64]:
    """Linear support of Q at v0 (derivative evaluated analytically)."""
    dQ = 0.01 * (v0 - 50)
    Q0 = 0.005 * (v0 - 50) ** 2 + 5
    return Q0 + dQ * (v_range - v0)


fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), sharey=True)

for ax, title, n_cuts in [
    (ax1, "Iteration k — 2 cuts", 2),
    (ax2, "Iteration k+1 — 3 cuts", 3),
]:
    ax.plot(v, Q, color=COLORS.DARK_TEXT, linewidth=2.5, label="$Q(v)$", zorder=5)

    active_trials = trials[:n_cuts]
    if n_cuts == 3:
        active_trials = [*trials, 48]

    for i, t in enumerate(active_trials):
        tang = tangent(t, v)
        alpha = 0.4 if (n_cuts == 3 and i < 2) else 0.8
        ax.plot(
            v,
            tang,
            color=COLORS.SIGNAL_RED,
            linewidth=1,
            linestyle="--",
            alpha=alpha,
            zorder=3,
        )
        Q_t = 0.005 * (t - 50) ** 2 + 5
        color = COLORS.COPPER if i == n_cuts - 1 and n_cuts == 3 else COLORS.PATINA
        ax.plot(t, Q_t, "o", color=color, markersize=7, zorder=6)

    outer = np.full_like(v, -np.inf)
    for t in active_trials:
        outer = np.maximum(outer, tangent(t, v))

    approx_color = COLORS.FLOW_BLUE if n_cuts == 2 else COLORS.PATINA
    ax.plot(v, outer, color=approx_color, linewidth=2, label="outer approx", zorder=4)

    mask = outer < Q
    ax.fill_between(v, outer, Q, where=mask, alpha=0.08, color=approx_color, zorder=2)

    ax.set_title(title, fontsize=13, fontweight="semibold")
    ax.set_xlabel("storage $v$")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 20)
    ax.legend(loc="upper right", fontsize=9)

ax1.set_ylabel("cost-to-go $Q(v)$")

fig.suptitle(
    "Value function approximation via Benders cuts",
    fontsize=15,
    fontweight="semibold",
    y=1.02,
)
fig.tight_layout()

# Output name is derived from the script's stem with `_` → `-` so Python-importable
# filenames map to web-idiomatic asset names without a second source of truth.
out = Path(__file__).resolve().parents[2] / "src" / "images"
stem = Path(__file__).stem.replace("_", "-")
fig.savefig(out / f"{stem}.svg", format="svg")
print(f"Saved {stem}.svg to {out}")
