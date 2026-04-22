# Excalidraw Design System for Cobre

## Canvas defaults

When starting a new Cobre diagram in Excalidraw:

1. **Background**: Set canvas background to `#FFFFFF` (export will have white bg
   for light contexts) or `#0F1419` (midnight, for dark-on-dark match).
   Most mdBook diagrams should be white — they display inside the content area
   which has its own dark background.

2. **Grid**: Enable grid, set to 20px. All elements snap to grid for
   consistent spacing.

3. **Font**: Set default font to "IBM Plex Sans" (Excalidraw calls it
   by name if installed on your system). For hand-drawn style, the
   built-in "Virgil" font is acceptable for sketch-phase diagrams,
   but final exports should use IBM Plex Sans.

4. **Stroke style**: Use "sharp" (not "architect" or "artist") for
   final documentation diagrams. The hand-drawn look is good for
   whiteboard-style thinking but not for methodology reference quality.


## Color palette setup

Add these as custom colors in Excalidraw's color picker (saved per-canvas):

### Fills (use at ~15-20% opacity for backgrounds, 100% for small accents)
| Name              | Hex       | Excalidraw usage                    |
|-------------------|-----------|-------------------------------------|
| Copper            | `#B87333` | Primary accent, highlights          |
| Flow Blue         | `#4A90B8` | Hydro elements, water, links        |
| Patina            | `#4A8B6F` | NCS elements, success states        |
| Spark Amber       | `#F5A623` | Thermal elements, warnings          |
| Signal Red        | `#DC4C4C` | Deficit, errors                     |
| Copper Dark       | `#8B5E3C` | Spillage, depth                     |
| Surface           | `#1A2028` | Card backgrounds (dark variant)     |

### Strokes
| Name              | Hex       | Usage                               |
|-------------------|-----------|-------------------------------------|
| Dark text         | `#1A1A1A` | Primary strokes on white bg         |
| Mid gray          | `#555555` | Secondary strokes, connectors       |
| Muted             | `#8B9298` | Tertiary, grid lines                |
| Copper            | `#B87333` | Accent strokes                      |


## Power system symbol library

Build these as reusable groups in your Excalidraw library. Each symbol
should be ~60x60px at default zoom.

### Bus bar
- Rounded rectangle, 200×12px, fill `#1A1A1A`, corner radius 4
- Label below: bus name in IBM Plex Sans, 14px, `#1A1A1A`

### Hydro generator
- Circle, 36px diameter, fill `#EBF5FB` (Flow Blue at 15%), stroke `#4A90B8` 1.5px
- Letter "H" centered, IBM Plex Sans 14px bold, color `#4A90B8`
- Attach: reservoir rectangle above (60×40px, fill Flow Blue gradient)
- Attach: inflow arrow entering reservoir from left
- Attach: connection line from circle to bus bar below

### Thermal generator
- Circle, 36px diameter, fill `#FDF2E6` (Amber at 10%), stroke `#F5A623` 1.5px
- Letter "T" centered, IBM Plex Sans 14px bold, color `#993C1D`
- Small flame path above the circle (3 short strokes in amber)

### NCS (wind/solar)
- Circle, 36px diameter, fill `#E8F5EE` (Patina at 10%), stroke `#4A8B6F` 1.5px
- Letter "W" or "S" centered, IBM Plex Sans 14px bold, color `#4A8B6F`
- Three blade strokes for wind, or sun rays for solar

### Demand arrow
- Arrow pointing DOWN from bus bar, stroke `#1A1A1A` 1.5px
- Label: "d₁" in italic serif, color `#1A1A1A`

### Deficit slack
- Arrow pointing UP to bus bar, stroke `#DC4C4C` 1px, DASHED
- Label: "δ₁" in italic serif, color `#DC4C4C`

### Transmission line
- Straight line between two bus bars, stroke `#555555` 2px
- Label at midpoint: "f₁₂" in italic serif, capacity below in mono


## Export settings

For mdBook integration:

- **Format**: SVG (vector, scales cleanly)
- **Background**: Include background (white for light diagrams)
- **Scale**: 1x (SVG is vector, no need to upscale)
- **Padding**: 20px
- **Dark mode**: If making dark-background diagrams, export with
  background `#0F1419`

Place exported SVGs in `src/images/` in the cobre-docs repo.
Reference from markdown: `![alt text](../../images/filename.svg)`


## Naming convention

```
{d-number}-{short-description}.excalidraw
```

Examples:
- `d04-system-element-overview.excalidraw`
- `d07-hybrid-parallelism.excalidraw`

Keep the `.excalidraw` source files in a `diagrams/excalidraw/` directory
in the repo. The exported SVGs go in `src/images/`.
