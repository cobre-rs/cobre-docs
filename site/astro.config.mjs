// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";
import astroD2 from "astro-d2";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// astro-mermaid and astro-d2 are registered before starlight.
export default defineConfig({
  // Architecture B: each version build sets its own base (e.g. "/v0.8/").
  base: process.env.DOCS_BASE ?? "/",
  // D4: manual math renderer — remark-math parses $…$ / $$…$$, rehype-katex
  // renders to static .katex HTML at build time (zero client JS). NOT
  // starlight-katex (forbidden by D4). Registered on Astro 6.4's durable
  // `markdown.processor` via `unified({...})` from @astrojs/markdown-remark;
  // the legacy top-level `markdown.remarkPlugins`/`rehypePlugins` keys are
  // deprecated in 6.4 and intentionally NOT used. `unified()` keeps GFM + smart
  // punctuation on by default — we only extend it with the two math plugins.
  // remark runs before rehype, so parse-then-render ordering is automatic.
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
  integrations: [
    mermaid({ autoTheme: true }),
    // astro-d2 renders ```d2 fenced blocks to inline SVG at build time. The `d2`
    // binary is NOT an npm package and must be on PATH at build time (CI: E7):
    //   curl -fsSL https://d2lang.com/install.sh | sh -s --
    // layout MUST be "elk" — never "tala" (unlicensed TALA watermarks output, E10).
    astroD2({
      inline: true,
      layout: "elk",
      theme: { default: "0", dark: "200" },
    }),
    starlight({
      title: "Cobre Methodology",
      // Brand mark (ticket-011b, resolves ticket-009's deferred logo). The header
      // slot is small (~24px), so we use the ICON — a self-contained 128×128 copper
      // mark on a Midnight tile, the brand's "small contexts / 16px" form — NOT the
      // wide 400×120 wordmark logos (those duplicate "Cobre" beside the title and
      // scale to illegibility at this height). `replacesTitle: false` keeps the
      // "Cobre Methodology" title text beside the icon. Theme-adaptive (Starlight
      // logo:{dark,light}): the Midnight-tiled icon on dark; a light-surface-tiled
      // variant on light (cobre-icon-light.svg — derived, copper anchored darker so
      // it reads on the light tile). The dark-tiled icon is also the favicon.
      logo: {
        dark: "./src/assets/cobre-icon.svg",
        light: "./src/assets/cobre-icon-light.svg",
        alt: "Cobre",
        replacesTitle: false,
      },
      favicon: "/favicon.svg",
      // Architecture B version picker mounts by overriding the `SocialIcons`
      // header slot (the slot the spike proved green). This is distinct from
      // Starlight's `LanguageSelect` slot, so the i18n language picker (root /
      // pt-br) is untouched — the two coexist in the header.
      components: { SocialIcons: "./src/components/VersionPicker.astro" },
      // palette.css defines the --dgm-* diagram palette (light + dark), consumed
      // by JS components (ValueFunctionPlot.astro, via getComputedStyle) and any
      // currentColor/var() inline SVG. The astro-d2 KEYSTONE in diagrams.css uses
      // HARDCODED d2-palette hex (NOT --dgm vars), so the two files are independent
      // and the order between them is arbitrary (corrected per E2 review,
      // 2026-06-24). neutrals.css + brand.css (ticket-011b) override Starlight's
      // own --sl-color-* tokens onto the BRAND palette: neutrals.css owns the warm
      // greyscale (--sl-color-{black,gray-1..7,white}); brand.css owns the COPPER
      // accent triple (--sl-color-accent*), the FLOW-BLUE prose-link rule, and the
      // semantic aside hue families (note=blue/tip=patina/caution=amber/danger=red).
      // Both are a SEPARATE concern from palette.css (--dgm-* diagram vars); they
      // touch disjoint property sets, so neutrals-before-brand is for readability,
      // not cascade. fonts.css (E2 / ticket-009) self-hosts the brand faces via
      // Fontsource (IBM Plex Sans body / JetBrains Mono code, OFL 1.1) and sets
      // ONLY --sl-font / --sl-font-mono — again a SEPARATE concern. Order is
      // independent of the palette-before-diagrams keystone rule above.
      customCss: [
        "./src/styles/katex.css",
        "./src/styles/palette.css",
        "./src/styles/diagrams.css",
        "./src/styles/neutrals.css",
        "./src/styles/brand.css",
        "./src/styles/fonts.css",
      ],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        "pt-br": { label: "Português do Brasil", lang: "pt-BR" },
      },
      pagefind: false,
    }),
  ],
});
