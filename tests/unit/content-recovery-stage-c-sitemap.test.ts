// INPUT: Stage C recovery Spoke slugs and the static SEO generator source.
// OUTPUT: Regression guard that every Spoke is emitted as a crawler-readable EN-only static page.
// POS: Ensures the released Spokes can provide real inbound links to their published Pillars.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stageCSpokeSlugs = [
  "suga-bts-birth-chart",
  "rm-bts-birth-chart",
  "jisoo-birth-chart",
  "severus-snape-zodiac-sign",
  "dumbledore-zodiac-sign",
];

describe("2026-07-27 content recovery Stage C sitemap coverage", () => {
  it("lists every released Spoke in the EN-only static sitemap set", () => {
    const source = readFileSync("scripts/generate-seo-pages.mjs", "utf8");
    for (const slug of stageCSpokeSlugs) {
      expect(source.includes(`'${slug}'`), `${slug} is absent from the EN-only sitemap generation list`).toBe(true);
    }
  });
});
