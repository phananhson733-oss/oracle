// INPUT: TOOLS catalog + ToolSeoLandingSections ZH_TOOL_GUIDES.
// OUTPUT: Contract tests that every public tool has a slug-specific Chinese landing guide.
// POS: Guards /tools landing SEO work. New public tools must add their own visible in-tool guide, not fall back to category copy.

import { describe, expect, it } from "vitest";
import { TOOLS } from "../../components/tools/toolsCatalog";
import { ZH_TOOL_GUIDES } from "../../components/calculators/ToolSeoLandingSections";

describe("tool SEO landing guides", () => {
  it("has a slug-specific Chinese guide for every public tool", () => {
    for (const tool of TOOLS) {
      const guide = ZH_TOOL_GUIDES[tool.slug];
      expect(guide, tool.slug).toBeTruthy();
      expect(guide.title.trim(), `${tool.slug} title`).toBe(tool.title.zh);
      expect(
        guide.summary.trim().length,
        `${tool.slug} summary`,
      ).toBeGreaterThan(24);
      expect(
        guide.useCases.length,
        `${tool.slug} useCases`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        guide.sections.length,
        `${tool.slug} sections`,
      ).toBeGreaterThanOrEqual(4);
      expect(guide.faqs.length, `${tool.slug} faqs`).toBeGreaterThanOrEqual(3);
    }
  });
});
