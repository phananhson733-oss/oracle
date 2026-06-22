// INPUT: components/tools/toolsCatalog 的 TOOL_CATEGORIES / TOOLS / toolsByCategory。
// OUTPUT: /tools hub 工具目录的守恒测试（数量、唯一性、分类完整、destination 命中真实路由）。
// POS: Tools hub 的数据契约；新增/移除公开工具或改路由 allowlist 时必须同步本测试。

import { describe, it, expect } from "vitest";
import {
  TOOL_CATEGORIES,
  TOOLS,
  toolsByCategory,
} from "../../components/tools/toolsCatalog";

// Source of truth mirror of App.tsx `isCalculatorPath` allowlist (14 public
// calculators) plus the Energy Timeline public route. If a tool's slug is not
// in this set, the hub would link to a 404 — this guard fails loudly on drift.
const ROUTED_TOOL_SLUGS = new Set([
  "moon-sign-calculator",
  "rising-sign-calculator",
  "big-three-calculator",
  "birth-chart-calculator",
  "current-planets",
  "moon-phase-calculator",
  "ephemeris-calculator",
  "electional-astrology",
  "rodden-rating",
  "celebrity-twins",
  "astrocartography",
  "synastry-calculator",
  "composite-calculator",
  "solar-return-calculator",
  "saturn-return-calculator",
  "energy-timeline",
]);

describe("tools catalog shape", () => {
  it("lists exactly the 16 public tools", () => {
    expect(TOOLS.length).toBe(16);
  });

  it("defines exactly 5 categories", () => {
    expect(TOOL_CATEGORIES.length).toBe(5);
  });

  it("every tool slug is unique", () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every tool slug maps to a real routed page (no broken hub links)", () => {
    for (const t of TOOLS) {
      expect(ROUTED_TOOL_SLUGS.has(t.slug), `unknown route slug: ${t.slug}`).toBe(true);
    }
  });

  it("covers every routed tool slug (no orphan tool missing from the hub)", () => {
    const catalogSlugs = new Set(TOOLS.map((t) => t.slug));
    for (const slug of ROUTED_TOOL_SLUGS) {
      expect(catalogSlugs.has(slug), `tool not in hub catalog: ${slug}`).toBe(true);
    }
  });
});

describe("tools catalog categories", () => {
  it("every tool belongs to a declared category", () => {
    const categoryIds = new Set(TOOL_CATEGORIES.map((c) => c.id));
    for (const t of TOOLS) {
      expect(categoryIds.has(t.category), `${t.slug} -> ${t.category}`).toBe(true);
    }
  });

  it("every category has at least one tool", () => {
    for (const c of TOOL_CATEGORIES) {
      expect(toolsByCategory(c.id).length, c.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("toolsByCategory partitions all tools with no loss", () => {
    const grouped = TOOL_CATEGORIES.flatMap((c) => toolsByCategory(c.id));
    expect(grouped.length).toBe(TOOLS.length);
  });
});

describe("tools catalog content", () => {
  it("every tool has non-empty en/zh title and blurb", () => {
    for (const t of TOOLS) {
      expect(t.title.en.trim().length, `${t.slug} title.en`).toBeGreaterThan(0);
      expect(t.title.zh.trim().length, `${t.slug} title.zh`).toBeGreaterThan(0);
      expect(t.blurb.en.trim().length, `${t.slug} blurb.en`).toBeGreaterThan(0);
      expect(t.blurb.zh.trim().length, `${t.slug} blurb.zh`).toBeGreaterThan(0);
    }
  });

  it("every category has non-empty en/zh title and intro", () => {
    for (const c of TOOL_CATEGORIES) {
      expect(c.title.en.trim().length, `${c.id} title.en`).toBeGreaterThan(0);
      expect(c.title.zh.trim().length, `${c.id} title.zh`).toBeGreaterThan(0);
      expect(c.intro.en.trim().length, `${c.id} intro.en`).toBeGreaterThan(0);
      expect(c.intro.zh.trim().length, `${c.id} intro.zh`).toBeGreaterThan(0);
    }
  });

  it("blurbs avoid deterministic fate language (AI safety red line)", () => {
    const banned = /\b(will|destined|guaranteed|must|always|never|lucky|best place)\b/i;
    for (const t of TOOLS) {
      expect(banned.test(t.blurb.en), `${t.slug} blurb uses fate language: "${t.blurb.en}"`).toBe(false);
    }
  });
});
