// INPUT: og.ts（buildTimelineOgSvg / renderTimelineOgPng）。
// OUTPUT: A.5 OG 图像单测 —— SVG 结构 + 非 PII + XML 转义防注入 + resvg 真栅格化出合法 PNG。
// POS: A.5 OG unfurl 图像回归；隐私（只接受非 PII 标签）+ 注入防护。

import { describe, it, expect } from "vitest";
import {
  buildTimelineOgSvg,
  renderTimelineOgPng,
  OG_TEMPLATES,
  DEFAULT_OG_TEMPLATE,
} from "./og.js";

describe("timeline OG image — A.5 minimal share card", () => {
  it("builds a 1200x630 SVG with the phase + title + turning point, no PII", () => {
    const svg = buildTimelineOgSvg({
      phaseLabel: "Active",
      turningPoint: "Saturn Return",
      lang: "en",
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
    expect(svg).toContain("Energy Timeline");
    expect(svg).toContain("Active");
    expect(svg).toContain("Saturn Return");
    // no birth data leaks into the social image
    expect(svg).not.toMatch(/\d{4}-\d{2}-\d{2}|birth|lat\b|lon\b/i);
  });

  it("escapes XML in the labels to prevent SVG injection", () => {
    const svg = buildTimelineOgSvg({ phaseLabel: "<script>x</script>&'\"" });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("omits the turning-point line when absent", () => {
    const svg = buildTimelineOgSvg({ phaseLabel: "Quiet" });
    expect(svg).toContain("Quiet");
    expect((svg.match(/<text/g) || []).length).toBe(3); // title + phase + footer, no turning point
  });

  it("B3: ships 3 distinct templates, all valid + PII-free, default = aurora", () => {
    expect(OG_TEMPLATES).toHaveLength(3);
    expect(DEFAULT_OG_TEMPLATE).toBe("aurora");
    const svgs = OG_TEMPLATES.map((template) =>
      buildTimelineOgSvg({ phaseLabel: "Active", template }),
    );
    for (const svg of svgs) {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("Active");
      expect(svg).not.toMatch(/\d{4}-\d{2}-\d{2}|\bbirth|\bcity\b/i);
    }
    // the three templates are visually distinct (different background palettes)
    expect(new Set(svgs).size).toBe(3);
    // no-template call matches the default template
    expect(buildTimelineOgSvg({ phaseLabel: "Active" })).toBe(
      buildTimelineOgSvg({ phaseLabel: "Active", template: "aurora" }),
    );
  });

  it("rasterizes to a valid PNG buffer via resvg", () => {
    const png = renderTimelineOgPng(
      buildTimelineOgSvg({
        phaseLabel: "Active",
        turningPoint: "Saturn Return",
      }),
    );
    expect(Buffer.isBuffer(png)).toBe(true);
    // PNG magic bytes: 89 50 4E 47
    expect(Array.from(png.subarray(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(png.length).toBeGreaterThan(1000);
  });
});
