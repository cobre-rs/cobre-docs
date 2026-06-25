// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";
import astroD2 from "astro-d2";
import { starlightKatex } from "starlight-katex";

// astro-mermaid and astro-d2 are registered before starlight.
export default defineConfig({
  // Architecture B: each version build sets its own base (e.g. "/v0.8/").
  base: process.env.DOCS_BASE ?? "/",
  integrations: [
    mermaid({ autoTheme: true }),
    astroD2({
      inline: true,
      layout: "elk",
      theme: { default: "0", dark: "200" },
    }),
    starlight({
      title: "Keystone Spike",
      components: {
        // version dropdown lives in the header (replaces the social-icons slot)
        SocialIcons: "./src/components/VersionPicker.astro",
      },
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        "pt-br": { label: "Português do Brasil", lang: "pt-BR" },
      },
      customCss: ["./src/styles/custom.css"],
      plugins: [starlightKatex()],
      pagefind: false,
    }),
  ],
});
