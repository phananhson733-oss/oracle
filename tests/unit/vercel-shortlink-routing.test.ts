// INPUT: vercel.json rewrite/header configuration.
// OUTPUT: Ensures root short-code URLs and stale hashed assets reach the backend before SPA fallback, and PageSpeed-critical static assets keep deliberate cache headers.
// POS: Deployment routing/cache regression test for owned root short links, immutable asset misses, and brand image delivery.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const vercelConfig = JSON.parse(
  readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"),
);

describe("vercel short-link routing", () => {
  it("rewrites root short-code paths to the backend before the SPA fallback", () => {
    const rewrites = vercelConfig.rewrites as Array<{
      source: string;
      destination: string;
    }>;
    const rootShortCodeRewriteIndex = rewrites.findIndex(
      (rewrite) =>
        rewrite.source === "/:code([a-z0-9]*[0-9][a-z0-9-]*)" &&
        rewrite.destination === "backend/src/index.ts",
    );
    const spaFallbackIndex = rewrites.findIndex(
      (rewrite) =>
        rewrite.source === "/(.*)" && rewrite.destination === "/index.html",
    );

    expect(rootShortCodeRewriteIndex).toBeGreaterThanOrEqual(0);
    expect(spaFallbackIndex).toBeGreaterThan(rootShortCodeRewriteIndex);
  });

  it("rewrites missing hashed assets to the backend before the SPA fallback", () => {
    const rewrites = vercelConfig.rewrites as Array<{
      source: string;
      destination: string;
    }>;
    const assetMissRewriteIndex = rewrites.findIndex(
      (rewrite) =>
        rewrite.source === "/assets/(.*)" &&
        rewrite.destination === "backend/src/index.ts",
    );
    const spaFallbackIndex = rewrites.findIndex(
      (rewrite) =>
        rewrite.source === "/(.*)" && rewrite.destination === "/index.html",
    );

    expect(assetMissRewriteIndex).toBeGreaterThanOrEqual(0);
    expect(spaFallbackIndex).toBeGreaterThan(assetMissRewriteIndex);
  });

  it("sets deliberate cache headers for built assets and derived brand images", () => {
    const headers = vercelConfig.headers as Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }>;

    const assetHeaders = headers.find(
      (entry) => entry.source === "/assets/(.*)",
    );
    const brandHeaders = headers.find(
      (entry) => entry.source === "/brand/(.*)",
    );

    expect(
      assetHeaders?.headers.find((header) => header.key === "Cache-Control")
        ?.value,
    ).toBe("public, max-age=31536000, immutable");
    expect(
      brandHeaders?.headers.find((header) => header.key === "Cache-Control")
        ?.value,
    ).toBe("public, max-age=604800, stale-while-revalidate=2592000");
  });
});
