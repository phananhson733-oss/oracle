// INPUT: components/timeline/share.ts（buildTimelineShareUrl）。
// OUTPUT: A.5 分享回链单测 —— UTM 在场、lang 前缀、指向公开 demo；**隐私契约**：结构上零出生数据/PII。
// POS: A.5 病毒回路回链回归；隐私红线（分享链绝不暴露分享者出生数据，GDPR Art9）。

import { describe, it, expect } from "vitest";
import { buildTimelineShareUrl } from "../../components/timeline/share";

describe("buildTimelineShareUrl — A.5 share backlink (privacy-safe)", () => {
  it("points to the public energy-timeline demo with UTM params", () => {
    const url = buildTimelineShareUrl();
    expect(url).toContain("/en/energy-timeline");
    expect(url).toContain("utm_source=share");
    expect(url).toContain("utm_medium=energy_card");
    expect(url).toContain("utm_campaign=energy_timeline");
  });

  it("honours lang + custom UTM + base, trimming trailing slashes", () => {
    const url = buildTimelineShareUrl({
      baseUrl: "https://staging.example.com/",
      lang: "zh",
      source: "ig",
      campaign: "launch",
    });
    expect(
      url.startsWith("https://staging.example.com/zh/energy-timeline?"),
    ).toBe(true);
    expect(url).toContain("utm_source=ig");
    expect(url).toContain("utm_campaign=launch");
  });

  it("PRIVACY (GDPR Art9): the share URL carries no birth data / PII whatsoever", () => {
    // 即便（错误地）把出生数据塞进 opts，函数也只读 UTM/lang/base，结构上不可能泄漏。
    const evil = {
      birthDate: "1990-07-04",
      birthCity: "New York",
      lat: 40.7128,
      lon: -74.006,
    } as unknown as Parameters<typeof buildTimelineShareUrl>[0];
    const url = buildTimelineShareUrl(evil);
    // 出生值不出现；也无 birth/lat/lon/city/date/time 命名的 query 参数（"timeline" 本身含 "time"，故只查 [?&]name= 形式）。
    expect(url).not.toMatch(/1990|07-04|new\s*york|40\.71|74\.006/i);
    expect(url).not.toMatch(/[?&](birth\w*|lat|lon|lng|city|date|time)=/i);
  });
});
