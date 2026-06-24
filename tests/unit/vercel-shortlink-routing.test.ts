// INPUT: vercel.json rewrite configuration.
// OUTPUT: Ensures root short-code URLs reach the backend before SPA fallback.
// POS: Deployment routing regression test for owned root short links.
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
});
