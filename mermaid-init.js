// mermaid-init.js — Cobre brand configuration.
// Lives at the repo root next to mermaid.min.js — mdBook resolves
// `additional-js` entries in book.toml relative to the book root.
//
// Design notes:
// - `theme: "base"` + full themeVariables override keeps the branded palette
//   in sync with theme/css/custom.css (copper / flow blue / patina).
// - Background is intentionally transparent so diagrams inherit the mdBook
//   page background; a non-transparent mermaid background draws a visible
//   panel edge that looks bolted-on. CSS in theme/css/custom.css centers
//   the rendered SVG within the narrow content column.
// - flowchart.defaultRenderer = "elk" produces noticeably more symmetric
//   branching layouts than dagre (the default). See docs/design/
//   diagram-authoring.md §5 for when to reach for per-diagram overrides.
// - flowchart.useMaxWidth = false keeps small diagrams at natural size so
//   nodes don't get scaled-up whitespace; CSS max-width: 100% on the SVG
//   still caps oversized diagrams at the column width.

mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",

  theme: "base",
  themeVariables: {
    // Background — transparent so diagrams inherit the page background.
    background: "transparent",
    mainBkg: "#1A2028",
    secondBkg: "#1A2028",

    // Text
    primaryTextColor: "#C8C6C2",
    secondaryTextColor: "#8B9298",
    tertiaryTextColor: "#8B9298",
    noteTextColor: "#C8C6C2",

    // Node colors (copper-based)
    primaryColor: "#2A1F14", // dark copper fill
    primaryBorderColor: "#B87333", // copper border
    secondaryColor: "#162028", // dark blue fill
    secondaryBorderColor: "#4A90B8", // flow blue border
    tertiaryColor: "#142218", // dark green fill
    tertiaryBorderColor: "#4A8B6F", // patina border

    // Lines and edges
    lineColor: "#8B9298",
    edgeLabelBackground: "#1A2028",

    // Fonts
    fontFamily: '"IBM Plex Sans", "DejaVu Sans", system-ui, sans-serif',
    fontSize: "14px",

    // Flowchart specifics
    nodeBorder: "#B87333",
    clusterBkg: "#1A2028",
    clusterBorder: "#2D3440",
    defaultLinkColor: "#8B9298",
    titleColor: "#E8E6E3",

    // Notes and labels
    noteBkgColor: "#1A2028",
    noteBorderColor: "#B87333",

    // Sequence diagram
    actorBkg: "#1A2028",
    actorBorder: "#B87333",
    actorTextColor: "#C8C6C2",
    actorLineColor: "#8B9298",
    signalColor: "#C8C6C2",
    signalTextColor: "#C8C6C2",
    labelBoxBkgColor: "#1A2028",
    labelBoxBorderColor: "#2D3440",
    labelTextColor: "#C8C6C2",
    loopTextColor: "#C8C6C2",
    activationBorderColor: "#B87333",
    activationBkgColor: "#2A1F14",

    // State diagram
    labelColor: "#C8C6C2",
    altBackground: "#1A2028",

    // Pie / other
    pie1: "#B87333",
    pie2: "#4A90B8",
    pie3: "#4A8B6F",
    pie4: "#F5A623",
    pie5: "#DC4C4C",
    pie6: "#8B5E3C",
    pie7: "#D4956A",
  },

  flowchart: {
    defaultRenderer: "elk", // Eclipse Layout Kernel — better branching symmetry
    curve: "basis",
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 60,
    htmlLabels: true,
    useMaxWidth: false, // natural size; CSS max-width caps overflow
  },

  sequence: {
    mirrorActors: false,
    bottomMarginAdj: 2,
    useMaxWidth: false,
  },

  stateDiagram: {
    useMaxWidth: false,
  },
});
