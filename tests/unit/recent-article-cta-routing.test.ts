import { describe, expect, it } from "vitest";
import { northNodeInAquarius2026En } from "../../data/articles/north-node-in-aquarius-2026";

describe("最近发布文章的 CTA 意图路由", () => {
  it("North Node in Aquarius 2026 同时提供 forecast 与 birth-chart CTA，并保留 Related Reading 内链", () => {
    const [, afterTakeAction = ""] = northNodeInAquarius2026En.content.split("## Take Action");
    const [takeAction = ""] = afterTakeAction.split("## Sources");
    const [beforeTakeAction = ""] = northNodeInAquarius2026En.content.split("## Take Action");

    expect(takeAction).toContain(
      "[Explore Astrology Forecasts](https://astrologywiki.com/forecast)",
    );
    expect(takeAction).toContain(
      "[birth chart calculator](/en/birth-chart-calculator)",
    );
    expect(beforeTakeAction).toContain("/en/wiki/north-node-vs-south-node");
  });
});
