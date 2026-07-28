// INPUT: src/utils/goRedirects resolver.
// OUTPUT: Ensures /go short links only resolve to safe AstrologyWiki destinations.
// POS: Unit tests for link-attribution short-link redirects.
import { describe, expect, it } from "vitest";
import { resolveGoRedirect } from "../../src/utils/goRedirects";

describe("resolveGoRedirect", () => {
  it("resolves an inline to= destination on astrologywiki.com", () => {
    expect(
      resolveGoRedirect({
        code: "aura-01",
        inlineDestination:
          "https://www.astrologywiki.com/en/wiki/aura-colors-guide?utm_medium=backlink",
        registry: {},
      }),
    ).toBe(
      "https://www.astrologywiki.com/en/wiki/aura-colors-guide?utm_medium=backlink",
    );
  });

  it("resolves registry destination when no inline destination is present", () => {
    expect(
      resolveGoRedirect({
        code: "moon-01",
        inlineDestination: null,
        registry: {
          "moon-01": "/en/wiki/moon-sign?utm_source=test",
        },
      }),
    ).toBe("https://www.astrologywiki.com/en/wiki/moon-sign?utm_source=test");
  });

  it("lets registry override inline destination for clean published codes", () => {
    expect(
      resolveGoRedirect({
        code: "aura-01",
        inlineDestination: "https://www.astrologywiki.com/en/wiki/old",
        registry: {
          "aura-01": "https://www.astrologywiki.com/en/wiki/new",
        },
      }),
    ).toBe("https://www.astrologywiki.com/en/wiki/new");
  });

  it("rejects non astrologywiki destinations", () => {
    expect(
      resolveGoRedirect({
        code: "bad",
        inlineDestination: "https://example.com/phishing",
        registry: {},
      }),
    ).toBeNull();
  });

  it("rejects malformed codes", () => {
    expect(
      resolveGoRedirect({
        code: "../admin",
        inlineDestination: "https://www.astrologywiki.com/en/wiki/aura",
        registry: {},
      }),
    ).toBeNull();
  });
});
