import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// NOTE: starlight-versions intentionally NOT wired — its auto-archive step
// can't parse KaTeX `$$` math (acorn error on `{\cmd}` / `{reserved-word}`).
// See README "Stage B" and docs/design/tools.md versioning note.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
