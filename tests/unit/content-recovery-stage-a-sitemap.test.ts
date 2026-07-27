// INPUT: Stage A recovery Pillar slugs and the static SEO generator source.
// OUTPUT: Regression guard that each released Pillar is emitted as an EN-only static sitemap entry.
// POS: Prevents a registered Stage A article from falling through the SPA root fallback in production.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stageAPillarSlugs = [
  "bts-members-zodiac-signs",
  "blackpink-zodiac-signs",
  "harry-potter-characters-zodiac-signs",
];

describe("2026-07-27 content recovery Stage A sitemap coverage", () => {
  it("lists every released Pillar in the EN-only static sitemap set", () => {
    const source = readFileSync("scripts/generate-seo-pages.mjs", "utf8");
    for (const slug of stageAPillarSlugs) {
      expect(source, `${slug} is absent from the EN-only sitemap generation list`).toContain(`'${slug}'`);
    }
  });
});
