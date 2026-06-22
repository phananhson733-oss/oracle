// INPUT: components/tools/toolsCatalog 的 TOOL_CATEGORIES / TOOLS / toolsByCategory。
// OUTPUT: /tools hub 工具目录的守恒测试（数量、唯一性、分类完整、destination 命中真实路由）。
// POS: Tools hub 的数据契约；新增/移除公开工具或改路由 allowlist 时必须同步本测试。

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
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

  it("titles, blurbs, and category copy avoid deterministic fate language (EN + ZH, AI safety red line)", () => {
    const bannedEn = /\b(will|destined|guaranteed|must|always|never|lucky|best place)\b/i;
    const bannedZh = /(一定|必然|注定|保证|肯定会|绝对|永远|从不|好运|命中注定)/;
    const check = (label: string, en: string, zh: string) => {
      expect(bannedEn.test(en), `${label} (en) uses fate language: "${en}"`).toBe(false);
      expect(bannedZh.test(zh), `${label} (zh) uses fate language: "${zh}"`).toBe(false);
    };
    for (const t of TOOLS) {
      check(`${t.slug} title`, t.title.en, t.title.zh);
      check(`${t.slug} blurb`, t.blurb.en, t.blurb.zh);
    }
    for (const c of TOOL_CATEGORIES) {
      check(`${c.id} title`, c.title.en, c.title.zh);
      check(`${c.id} intro`, c.intro.en, c.intro.zh);
    }
  });
});

// The stub generator (scripts/generate-seo-pages.mjs) hand-mirrors the tool list
// in its HUB_CATEGORIES block (a .mjs cannot import this .ts). This guard fails
// loudly if the two drift — e.g. a tool added to the catalog but not the stub,
// which would silently drop it from the crawlable internal-link mesh + sitemap.
describe("generator hub catalog stays in sync with toolsCatalog", () => {
  it("HUB_CATEGORIES slug set in generate-seo-pages.mjs equals TOOLS slug set", () => {
    const gen = readFileSync(
      new URL("../../scripts/generate-seo-pages.mjs", import.meta.url),
      "utf8",
    );
    const start = gen.indexOf("const HUB_CATEGORIES");
    expect(start, "HUB_CATEGORIES block not found in generator").toBeGreaterThan(-1);
    const block = gen.slice(start, gen.indexOf("];", start));
    const genSlugs = new Set<string>();
    for (const arr of block.matchAll(/slugs:\s*\[([^\]]*)\]/g)) {
      for (const s of arr[1].matchAll(/'([^']+)'/g)) genSlugs.add(s[1]);
    }
    const catalogSlugs = new Set(TOOLS.map((t) => t.slug));
    const onlyInGenerator = [...genSlugs].filter((s) => !catalogSlugs.has(s));
    const onlyInCatalog = [...catalogSlugs].filter((s) => !genSlugs.has(s));
    expect(onlyInGenerator, "slugs in generator HUB_CATEGORIES but not in toolsCatalog").toEqual([]);
    expect(onlyInCatalog, "slugs in toolsCatalog but not in generator HUB_CATEGORIES").toEqual([]);
  });
});
