"""
Cobre base scene for Manim animations.

Usage:
    from cobre_manim import CobreScene, C

    class MyDiagram(CobreScene):
        def construct(self):
            title = Text("My Title", font=C.FONT, color=C.BRIGHT)
            ...

Render:
    manim render my_diagram.py MyDiagram -qh --format=webm
    manim render my_diagram.py MyDiagram -ql --format=gif   # for mdBook
    manim render my_diagram.py MyDiagram -s --format=svg    # static frame

Manim is an optional dependency. Install it with:
    uv sync --group manim
"""

from __future__ import annotations

from typing import Any

from manim import Axes, MathTex, Scene, Text, config

# ---------------------------------------------------------------------------
# Brand constants (Manim hex format)
# ---------------------------------------------------------------------------


class C:
    """Cobre colors as Manim hex strings."""

    # Primary
    COPPER = "#B87333"
    COPPER_LIGHT = "#D4956A"
    COPPER_DARK = "#8B5E3C"
    PATINA = "#4A8B6F"

    # Accent
    SPARK_AMBER = "#F5A623"
    SIGNAL_RED = "#DC4C4C"
    FLOW_BLUE = "#4A90B8"

    # Neutrals
    MIDNIGHT = "#0F1419"
    SURFACE = "#1A2028"
    BORDER = "#2D3440"
    MUTED = "#8B9298"
    BODY = "#C8C6C2"
    BRIGHT = "#E8E6E3"

    # Generation source mapping
    HYDRO = FLOW_BLUE
    THERMAL = SPARK_AMBER
    THERMAL_EXP = SIGNAL_RED
    NCS = PATINA
    DEFICIT = BRIGHT
    SPILLAGE = COPPER_DARK

    # Typography
    FONT = "IBM Plex Sans"
    MONO = "JetBrains Mono"


# ---------------------------------------------------------------------------
# Base scene
# ---------------------------------------------------------------------------


class CobreScene(Scene):
    """Base scene with Cobre brand defaults.

    Subclass this for all Cobre methodology animations. Background is
    midnight, text is body color, math is bright.
    """

    def setup(self) -> None:
        self.camera.background_color = C.MIDNIGHT

    def cobre_axes(self, **kwargs: Any) -> Axes:
        """Create axes with brand styling."""
        defaults: dict[str, Any] = {
            "x_length": 8,
            "y_length": 5,
            "axis_config": {
                "color": C.MUTED,
                "stroke_width": 1.5,
                "include_ticks": True,
                "tick_size": 0.05,
            },
            "tips": True,
        }
        defaults.update(kwargs)
        return Axes(**defaults)

    def cobre_title(self, text: str, **kwargs: Any) -> Text:
        """Create a branded title."""
        defaults: dict[str, Any] = {
            "font": C.FONT,
            "color": C.BRIGHT,
            "font_size": 32,
            "weight": "SEMIBOLD",
        }
        defaults.update(kwargs)
        return Text(text, **defaults)

    def cobre_label(self, text: str, **kwargs: Any) -> Text:
        """Create a branded label."""
        defaults: dict[str, Any] = {
            "font": C.FONT,
            "color": C.BODY,
            "font_size": 22,
        }
        defaults.update(kwargs)
        return Text(text, **defaults)

    def cobre_math(self, tex: str, **kwargs: Any) -> MathTex:
        """Create branded math text."""
        defaults: dict[str, Any] = {"color": C.BRIGHT, "font_size": 28}
        defaults.update(kwargs)
        return MathTex(tex, **defaults)


# ---------------------------------------------------------------------------
# Manim global config (apply when importing this module)
# ---------------------------------------------------------------------------

config.pixel_width = 1920
config.pixel_height = 1080
config.frame_rate = 30
config.background_color = C.MIDNIGHT
