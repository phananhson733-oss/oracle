// INPUT: aura bridge article object + includeInSitemap (scripts/lib/seo-canonical.mjs).
// OUTPUT: vitest specs locking the tool-led bridge page's SEO config (T7/T8):
//         noindex,follow + excluded from sitemap + hreflang suppressed, and the
//         prove-chain wiring (embeddedTool + psychAdjacent) that drives the
//         in-stub safety footer and SPA mini-calc.
// POS: Regression guard for the noindex conversion-experiment contract. If the
//      bridge's seo config or embeddedTool changes, this fails loudly.

import { describe, it, expect } from "vitest";
import { auraMoonVenusRisingBridgeEn } from "../../data/articles/aura-moon-venus-rising-bridge";
import { kylianMbappBirthChartEn } from "../../data/articles/kylian-mbapp-birth-chart";
import { includeInSitemap, resolveCanonicalUrl } from "../../scripts/lib/seo-canonical.mjs";

describe("aura bridge SEO config (T7/T8 — noindex conversion experiment)", () => {
  it("is noindex,follow, excluded from the sitemap, and suppresses hreflang", () => {
    const seo = auraMoonVenusRisingBridgeEn.seo;
    expect(seo?.robots).toBe("noindex,follow");
    expect(seo?.sitemap).toBe(false);
    expect(includeInSitemap(seo)).toBe(false);
    expect(seo?.alternates).toBe(false);
  });

  it("carries the tool-led prove-chain wiring (embeddedTool + psychAdjacent)", () => {
    expect(auraMoonVenusRisingBridgeEn.embeddedTool?.tool).toBe(
      "north-node-sign",
    );
    expect(auraMoonVenusRisingBridgeEn.psychAdjacent).toBe(true);
  });
});

// Regression guard for the Mbappé canonical收口 (2026-07-09): the duplicate
// kylian-mbapp-birth-chart (truncated slug from an old slugify é-drop bug)
// consolidates into the established mbappe-birth-chart via rel=canonical +
// sitemap exclusion. If this config regresses, the two pages cannibalize again.
describe("kylian-mbapp canonical收口 → mbappe-birth-chart", () => {
  it("points canonical at the winner, drops the loser from the sitemap", () => {
    const seo = kylianMbappBirthChartEn.seo;
    expect(seo?.canonicalPath).toBe("/wiki/mbappe-birth-chart");
    expect(seo?.sitemap).toBe(false);
    expect(includeInSitemap(seo)).toBe(false);
    expect(
      resolveCanonicalUrl({
        seo,
        lang: "en",
        selfUrl:
          "https://www.astrologywiki.com/en/wiki/kylian-mbapp-birth-chart",
        siteUrl: "https://www.astrologywiki.com",
      }),
    ).toBe("https://www.astrologywiki.com/en/wiki/mbappe-birth-chart");
  });
});
