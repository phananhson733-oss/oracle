// INPUT: aura bridge article object + includeInSitemap (scripts/lib/seo-canonical.mjs).
// OUTPUT: vitest specs locking the tool-led bridge page's SEO config (T7/T8):
//         noindex,follow + excluded from sitemap + hreflang suppressed, and the
//         prove-chain wiring (embeddedTool + psychAdjacent) that drives the
//         in-stub safety footer and SPA mini-calc.
// POS: Regression guard for the noindex conversion-experiment contract. If the
//      bridge's seo config or embeddedTool changes, this fails loudly.

import { describe, it, expect } from "vitest";
import { auraMoonVenusRisingBridgeEn } from "../../data/articles/aura-moon-venus-rising-bridge";
import { includeInSitemap } from "../../scripts/lib/seo-canonical.mjs";

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
