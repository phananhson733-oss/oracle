import { describe, expect, it } from "vitest";
import { getWikiGradientStyle } from "../../components/wiki/wikiGradientStyle";

describe("getWikiGradientStyle", () => {
  it("converts Wiki gradient tokens to inline CSS", () => {
    expect(
      getWikiGradientStyle("from-blue-500 via-green-500 to-red-500"),
    ).toEqual({
      backgroundImage: "linear-gradient(135deg, #3b82f6, #22c55e, #ef4444)",
    });
  });

  it("ignores non-gradient utility tokens", () => {
    expect(
      getWikiGradientStyle("from-slate-200 to-blue-200 text-slate-900"),
    ).toEqual({
      backgroundImage: "linear-gradient(135deg, #e2e8f0, #bfdbfe)",
    });
  });

  it("supports alpha tokens used by the fallback gradient", () => {
    expect(getWikiGradientStyle()).toEqual({
      backgroundImage:
        "linear-gradient(135deg, rgba(181, 138, 82, 0.2), rgba(181, 138, 82, 0.05), transparent)",
    });
  });

  it("falls back when a token cannot produce a valid two-stop gradient", () => {
    expect(getWikiGradientStyle("from-unknown-500")).toEqual(
      getWikiGradientStyle(),
    );
  });
});
