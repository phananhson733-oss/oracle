// INPUT: Stage B recovery Birth Chart slugs and the static SEO generator source.
// OUTPUT: Regression guard that each released Birth Chart page is emitted as an EN-only static sitemap entry.
// POS: Keeps person-led Birth Chart content crawler-readable instead of falling through the SPA root fallback.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stageBBirthChartSlugs = [
  "rihanna-birth-chart",
  "selena-gomez-birth-chart",
];

describe("2026-07-27 content recovery Stage B sitemap coverage", () => {
  it("lists every released Birth Chart page in the EN-only static sitemap set", () => {
    const source = readFileSync("scripts/generate-seo-pages.mjs", "utf8");
    for (const slug of stageBBirthChartSlugs) {
      expect(source, `${slug} is absent from the EN-only sitemap generation list`).toContain(`'${slug}'`);
    }
  });
});
