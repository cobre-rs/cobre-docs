"""
Cobre brand constants for diagram generation.

Usage:
    from cobre_brand import COLORS, GEN_COLORS, FONTS
    # or
    from cobre_brand import apply_cobre_style
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from manim import ManimColor


# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------


class COLORS:
    """Brand palette — use these everywhere, never raw hex."""

    # Primary
    COPPER = "#B87333"
    COPPER_LIGHT = "#D4956A"
    COPPER_DARK = "#8B5E3C"
    PATINA = "#4A8B6F"

    # Accent
    SPARK_AMBER = "#F5A623"
    SIGNAL_RED = "#DC4C4C"
    FLOW_BLUE = "#4A90B8"

    # Neutrals (dark theme)
    MIDNIGHT = "#0F1419"
    SURFACE = "#1A2028"
    BORDER = "#2D3440"
    MUTED = "#8B9298"
    BODY = "#C8C6C2"
    BRIGHT = "#E8E6E3"

    # Neutrals (light theme)
    WHITE = "#FFFFFF"
    LIGHT_BG = "#FAFAFA"
    LIGHT_BORDER = "#E0E0E0"
    DARK_TEXT = "#1A1A1A"
    MID_TEXT = "#555555"


class GEN_COLORS:
    """Fixed generation-source color mapping — color carries meaning."""

    HYDRO = COLORS.FLOW_BLUE
    THERMAL_CHEAP = COLORS.SPARK_AMBER
    THERMAL_EXPENSIVE = COLORS.SIGNAL_RED
    NCS = COLORS.PATINA
    DEFICIT = COLORS.BRIGHT  # render at 15% opacity
    RESERVOIR_WATER = COLORS.FLOW_BLUE  # gradient 15-45% opacity
    SPILLAGE = COLORS.COPPER_DARK


class FONTS:
    """Typography constants."""

    HEADING = "IBM Plex Sans"
    BODY = "IBM Plex Sans"
    MONO = "JetBrains Mono"
    FALLBACK = "DejaVu Sans"


# ---------------------------------------------------------------------------
# Matplotlib helpers
# ---------------------------------------------------------------------------

_HERE = Path(__file__).parent


def apply_cobre_style(*, dark: bool = False) -> None:
    """Apply the Cobre matplotlib style.

    Args:
        dark: If True, use dark theme (for coal-themed mdBook).
              If False, use light theme (for standalone SVG/PNG).
    """
    import matplotlib.pyplot as plt

    style_file = "cobre-dark.mplstyle" if dark else "cobre.mplstyle"
    style_path = _HERE / style_file

    if style_path.exists():
        plt.style.use(str(style_path))
        return

    # Fallback: apply programmatically so the helper still works if the
    # style files are missing (e.g. running a single script out-of-tree).
    if dark:
        plt.rcParams["figure.facecolor"] = COLORS.MIDNIGHT
        plt.rcParams["axes.facecolor"] = COLORS.MIDNIGHT
        plt.rcParams["text.color"] = COLORS.BODY
        plt.rcParams["axes.labelcolor"] = COLORS.BODY
        plt.rcParams["xtick.color"] = COLORS.MUTED
        plt.rcParams["ytick.color"] = COLORS.MUTED
    plt.rcParams["font.sans-serif"] = [FONTS.BODY, FONTS.FALLBACK]
    plt.rcParams["font.family"] = "sans-serif"


def brand_colormap(n: int = 7) -> list[str]:
    """Return n colors from the brand cycle."""
    cycle = [
        COLORS.COPPER,
        COLORS.FLOW_BLUE,
        COLORS.PATINA,
        COLORS.SPARK_AMBER,
        COLORS.SIGNAL_RED,
        COLORS.COPPER_DARK,
        COLORS.COPPER_LIGHT,
    ]
    return (cycle * ((n // len(cycle)) + 1))[:n]


# ---------------------------------------------------------------------------
# Manim helpers (optional — import lazily so matplotlib-only users don't pay)
# ---------------------------------------------------------------------------


def manim_colors() -> dict[str, ManimColor]:
    """Return the Cobre palette as Manim Color objects.

    Raises:
        ImportError: if the optional `manim` extra is not installed.
    """
    from manim import ManimColor

    def _c(hex_: str) -> Any:
        return ManimColor(hex_)

    return {
        "copper": _c(COLORS.COPPER),
        "copper_light": _c(COLORS.COPPER_LIGHT),
        "copper_dark": _c(COLORS.COPPER_DARK),
        "patina": _c(COLORS.PATINA),
        "spark_amber": _c(COLORS.SPARK_AMBER),
        "signal_red": _c(COLORS.SIGNAL_RED),
        "flow_blue": _c(COLORS.FLOW_BLUE),
        "midnight": _c(COLORS.MIDNIGHT),
        "surface": _c(COLORS.SURFACE),
        "body": _c(COLORS.BODY),
        "bright": _c(COLORS.BRIGHT),
    }
