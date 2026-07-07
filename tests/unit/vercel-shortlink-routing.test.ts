// INPUT: vercel.json rewrite configuration.
// OUTPUT: Ensures root short-code URLs reach the backend before SPA fallback.
// POS: Deployment routing regression test for owned root short links.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const vercelConfig = JSON.parse(
  readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"),
);

describe("vercel routing and cache headers", () => {
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

  it("rewrites missing hashed assets to the backend before SPA fallback", () => {
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

  it("keeps live hashed assets immutable and brand assets deliberately cacheable", () => {
    const headers = vercelConfig.headers as Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }>;
    const assetHeader = headers.find((entry) => entry.source === "/assets/(.*)");
    const brandHeader = headers.find((entry) => entry.source === "/brand/(.*)");

    expect(assetHeader?.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    });
    expect(brandHeader?.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=604800, stale-while-revalidate=2592000",
    });
  });
});
