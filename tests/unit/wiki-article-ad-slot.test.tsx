// @vitest-environment jsdom
// INPUT: WikiArticleDetailPage + MemoryRouter；mock data/articles 注入受控文章、
//        spy AdSlot 捕获 props，桩掉 SEO/ChartMiniCalc/WikiChartCTA 降噪。
// OUTPUT: 文末广告位挂载点的行为契约：普通文章挂 AdSlot 且 props 来自 WIKI_ARTICLE_END；
//         embeddedTool（转化漏斗）与 psychAdjacent（心理安全）文章不挂。
// POS: 钉住 AdSlot 挂载点，防大重构合并再次静默丢弃（2026-07-13 cc5500ae 的回归）。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiArticle } from "../../types";
import { WIKI_ARTICLE_END } from "../../components/ads/adPlacements";

// 受控文章：测试逐例改写 embeddedTool / psychAdjacent 字段。
let mockArticle: WikiArticle;
vi.mock("../../data/articles", () => ({
  getArticleBySlug: () => mockArticle,
  getArticleSummaries: () => [],
  isArticleSlug: () => true,
}));

// spy AdSlot：捕获 props 以断言广告位配置来自 adPlacements 而非硬编码。
const adSlotProps: Array<Record<string, unknown>> = [];
vi.mock("../../components/ads/AdSlot", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    adSlotProps.push(props);
    return <div data-testid="wiki-article-end-ad" />;
  },
  AdSlot: (props: Record<string, unknown>) => {
    adSlotProps.push(props);
    return <div data-testid="wiki-article-end-ad" />;
  },
}));

vi.mock("../../components/ChartMiniCalc", () => ({
  __esModule: true,
  default: () => <div data-testid="chart-mini-calc" />,
  ChartMiniCalc: () => <div data-testid="chart-mini-calc" />,
}));

vi.mock("../../components/wiki/WikiChartCTA", () => ({
  __esModule: true,
  deriveCelebrityName: () => null,
  default: (props: { variant?: string }) => (
    <div data-testid={`wiki-chart-cta-${props.variant ?? "bottom"}`} />
  ),
}));

// SEO 通过 useEffect 直写 document.head；测试中桩成空避免噪音。
vi.mock("../../components/SEO", () => ({
  SEO: () => null,
}));

vi.mock("../../services/analytics", () => ({ trackEvent: vi.fn() }));

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

beforeEach(() => {
  adSlotProps.length = 0;
});

describe("WikiArticleDetailPage — 文末 AdSense 广告位挂载点", () => {
  it("普通文章 → 挂载 AdSlot，slot/format/minHeight 全部取自 WIKI_ARTICLE_END", async () => {
    mockArticle = { ...baseArticle };
    renderPage();

    expect(await screen.findByTestId("wiki-article-end-ad")).toBeTruthy();
    expect(adSlotProps).toHaveLength(1);
    expect(adSlotProps[0].slot).toBe(WIKI_ARTICLE_END.slot);
    expect(adSlotProps[0].format).toBe(WIKI_ARTICLE_END.format);
    expect(adSlotProps[0].minHeight).toBe(WIKI_ARTICLE_END.minHeight);
  });

  it("embeddedTool 文章（tool-led 转化漏斗）→ 不挂广告位", async () => {
    mockArticle = {
      ...baseArticle,
      embeddedTool: { tool: "north-node-sign", module: "north-node" },
    } as WikiArticle;
    renderPage();

    await screen.findByTestId("chart-mini-calc");
    expect(screen.queryByTestId("wiki-article-end-ad")).toBeNull();
    expect(adSlotProps).toHaveLength(0);
  });

  it("psychAdjacent 文章（心理敏感）→ 不挂广告位", async () => {
    mockArticle = { ...baseArticle, psychAdjacent: true } as WikiArticle;
    renderPage();

    await screen.findByTestId("wiki-chart-cta-sticky");
    expect(screen.queryByTestId("wiki-article-end-ad")).toBeNull();
    expect(adSlotProps).toHaveLength(0);
  });
});
