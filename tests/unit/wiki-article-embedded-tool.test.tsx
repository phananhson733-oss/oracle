// @vitest-environment jsdom
// INPUT: WikiArticleDetailPage + MemoryRouter；mock data/articles 注入受控文章、
//        spy ChartMiniCalc / WikiChartCTA 变体 / SEO，控制 embeddedTool 开关。
// OUTPUT: tool-led 嵌入槽的行为契约：embeddedTool 在场 → 渲染 ChartMiniCalc（带正确
//         module/placement/fullChartHref 上游漏斗目标）并只抑制 bottom CTA；
//         Sticky/Lead 始终存在，缺省文章额外保留 bottom CTA。
// POS: 守护 T4 wiki→工具漏斗的挂载点。若改 WikiArticleDetailPage 的嵌入逻辑同步此测试。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiArticle } from "../../types";

// 受控文章：测试逐例改写 embeddedTool 字段。
let mockArticle: WikiArticle;
vi.mock("../../data/articles", () => ({
  getArticleBySlug: () => mockArticle,
  getArticleSummaries: () => [],
  isArticleSlug: () => true,
}));

// spy ChartMiniCalc：捕获 props 以断言漏斗 wiring（module/placement/fullChartHref）。
const chartMiniCalcProps: Array<Record<string, unknown>> = [];
vi.mock("../../components/ChartMiniCalc", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    chartMiniCalcProps.push(props);
    return <div data-testid="chart-mini-calc" />;
  },
  ChartMiniCalc: (props: Record<string, unknown>) => {
    chartMiniCalcProps.push(props);
    return <div data-testid="chart-mini-calc" />;
  },
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
  chartMiniCalcProps.length = 0;
});

describe("WikiArticleDetailPage — tool-led 嵌入槽 (T4)", () => {
  it("embeddedTool 在场：渲染 ChartMiniCalc 并抑制底部 WikiChartCTA", async () => {
    mockArticle = {
      ...baseArticle,
      embeddedTool: { tool: "north-node-sign", module: "north-node" },
    };
    renderPage();

    expect(await screen.findByTestId("chart-mini-calc")).toBeTruthy();
    expect(screen.queryByTestId("wiki-chart-cta-bottom")).toBeNull();
    expect(screen.getByTestId("wiki-chart-cta-sticky")).toBeTruthy();
    expect(screen.getByTestId("wiki-chart-cta-lead")).toBeTruthy();
  });

  it("传给 ChartMiniCalc 的漏斗 props 指向上游全盘（#6 锚点）", async () => {
    mockArticle = {
      ...baseArticle,
      embeddedTool: { tool: "north-node-sign", module: "north-node" },
    };
    renderPage();
    await screen.findByTestId("chart-mini-calc");

    expect(chartMiniCalcProps[0]).toMatchObject({
      module: "north-node",
      placement: "wiki",
      fullChartHref: "/landing-v2/en/#birth-chart-tool",
    });
  });

  it("无 embeddedTool：不渲染工具，保留底部 WikiChartCTA", async () => {
    mockArticle = { ...baseArticle };
    renderPage();

    expect(await screen.findByTestId("wiki-chart-cta-bottom")).toBeTruthy();
    expect(screen.queryByTestId("chart-mini-calc")).toBeNull();
  });

  it("psychAdjacent：页面渲染强制安全 footer（SPA 侧，红线 #4）", async () => {
    mockArticle = {
      ...baseArticle,
      embeddedTool: { tool: "north-node-sign", module: "north-node" },
      psychAdjacent: true,
    };
    renderPage();
    await screen.findByTestId("chart-mini-calc");

    const note = screen.getByRole("note");
    expect(note.textContent).toContain("not a clinical diagnosis");
  });
});
