// @vitest-environment jsdom
// INPUT: WikiArticleDetailPage + MemoryRouter；mock data/articles 注入受控文章、
//        spy SEO 捕获其 props，控制 article.seo 的 alternates/canonicalPath。
// OUTPUT: hreflang 抑制契约：SPA 渲染时 SEO 收到的 alternateLanguages 必须与静态
//         生成器（generate-seo-pages.mjs seo.alternates===false）同步 —— 普通文章
//         发 zh/en/x-default；alternates:false 或 canonicalPath 收口页发空数组。
// POS: 守护"SPA 运行时不得撤销 static SEO 信号"红线（noindex EN-only 实验页如
//      aura bridge 不能在 mount 后被 SEO.tsx 重注入指向不存在 zh 页的 hreflang）。
//      若改 WikiArticleDetailPage 的 alternateLanguages 逻辑，同步此测试。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiArticle } from "../../types";

// 受控文章：每个用例改写 seo 字段。
let mockArticle: WikiArticle;
vi.mock("../../data/articles", () => ({
  getArticleBySlug: () => mockArticle,
  getArticleSummaries: () => [],
  isArticleSlug: () => true,
}));

// spy SEO：捕获 props 以断言 alternateLanguages（hreflang 注入源）。
const seoProps: Array<Record<string, unknown>> = [];
vi.mock("../../components/SEO", () => ({
  SEO: (props: Record<string, unknown>) => {
    seoProps.push(props);
    return null;
  },
}));

// 嵌入工具 / 底部 CTA / 安全 footer 桩成空，隔离本测试只关心 SEO props。
vi.mock("../../components/ChartMiniCalc", () => ({
  __esModule: true,
  default: () => null,
  ChartMiniCalc: () => null,
}));
vi.mock("../../components/wiki/WikiChartCTA", () => ({
  __esModule: true,
  deriveCelebrityName: () => null,
  default: () => null,
}));
vi.mock("../../components/SafetyFooter", () => ({
  __esModule: true,
  default: () => null,
  SafetyFooter: () => null,
}));
vi.mock("../../services/analytics", () => ({
  trackEvent: vi.fn(),
  trackChartFunnel: vi.fn(),
}));

import { WikiArticleDetailPage } from "../../components/wiki/WikiArticleDetailPage";

const baseArticle: WikiArticle = {
  slug: "north-node-in-scorpio",
  title: "North Node in Scorpio",
  description: "Your soul's growth edge.",
  content: "# North Node in Scorpio\n\nSome body copy.",
  authorId: "unknown-persona",
  date: "2026-05-20",
  keywords: ["north node"],
  schema: "Article",
  lang: "en",
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/en/wiki/north-node-in-scorpio"]}>
      <WikiArticleDetailPage articleSlug="north-node-in-scorpio" />
    </MemoryRouter>,
  );

const lastSeo = () => seoProps[seoProps.length - 1];

beforeEach(() => {
  seoProps.length = 0;
});

describe("WikiArticleDetailPage — hreflang 抑制 (SPA 与静态生成器同步)", () => {
  // 页面首渲染是 loading 骨架（isLoading 默认 true，~100ms 后解除），SEO 仅在
  // 解除后渲染，故每个用例 await SEO 被调用再断言。
  it("普通文章：SEO 收到 zh/en/x-default 三条 hreflang alternates", async () => {
    mockArticle = { ...baseArticle };
    renderPage();
    await waitFor(() => expect(seoProps.length).toBeGreaterThan(0));

    const alts = (lastSeo()?.alternateLanguages ?? []) as Array<{
      hrefLang: string;
    }>;
    expect(alts.map((a) => a.hrefLang).sort()).toEqual([
      "en",
      "x-default",
      "zh",
    ]);
  });

  it("seo.alternates === false：SEO 收到空 alternateLanguages（不发 hreflang）", async () => {
    mockArticle = {
      ...baseArticle,
      seo: { robots: "noindex,follow", sitemap: false, alternates: false },
    };
    renderPage();
    await waitFor(() => expect(seoProps.length).toBeGreaterThan(0));

    expect(lastSeo()?.alternateLanguages).toEqual([]);
  });

  it("seo.canonicalPath 收口页：SEO 收到空 alternateLanguages（既有行为不回归）", async () => {
    mockArticle = {
      ...baseArticle,
      seo: { canonicalPath: "/wiki/some-winner-page" },
    };
    renderPage();
    await waitFor(() => expect(seoProps.length).toBeGreaterThan(0));

    expect(lastSeo()?.alternateLanguages).toEqual([]);
  });
});
