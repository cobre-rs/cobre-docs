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
      // Architecture B version picker mounts by overriding the `SocialIcons`
      // header slot (the slot the spike proved green). This is distinct from
      // Starlight's `LanguageSelect` slot, so the i18n language picker (root /
      // pt-br) is untouched — the two coexist in the header.
      components: { SocialIcons: "./src/components/VersionPicker.astro" },
      // E2 appends more entries (brand CSS). diagrams.css holds the astro-d2
      // KEYSTONE — re-keys d2's .fill-*/.stroke-* palette classes to
      // :root[data-theme] so D2 figures follow Starlight's manual toggle.
      customCss: ["./src/styles/katex.css", "./src/styles/diagrams.css"],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        "pt-br": { label: "Português do Brasil", lang: "pt-BR" },
      },
      pagefind: false,
    }),
  ],
});
