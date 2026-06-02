// @vitest-environment jsdom
// INPUT: WikiChartCTA 组件 + @testing-library/react + MemoryRouter；mock auth/language/theme/analytics。
// OUTPUT: wiki 底部 CTA 漏斗目标的行为契约单测（backlog #6：从 /auth 改导内联免费盘）。
// POS: 守护 wiki→免费盘漏斗的收口点——匿名导工具、登录隐藏、归因埋点。若改 WikiChartCTA 同步此测试。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Control auth state per test (AuthContext is not exported — mock the hook).
const mockAuth = { isAuthenticated: false, isLoading: false };
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

// Control language; theme is static for these assertions.
let mockLanguage: "en" | "zh" = "en";
vi.mock("../../components/UIComponents", () => ({
  useLanguage: () => ({ t: { wiki: {} }, language: mockLanguage }),
  useTheme: () => ({ theme: "light" }),
}));

const trackEvent = vi.fn();
vi.mock("../../services/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

import WikiChartCTA from "../../components/wiki/WikiChartCTA";

const renderCTA = () =>
  render(
    <MemoryRouter>
      <WikiChartCTA />
    </MemoryRouter>,
  );

beforeEach(() => {
  mockAuth.isAuthenticated = false;
  mockAuth.isLoading = false;
  mockLanguage = "en";
  trackEvent.mockClear();
});

describe("WikiChartCTA — 漏斗目标 (backlog #6)", () => {
  it("匿名用户：CTA 链到内联免费盘工具而非 /auth", () => {
    renderCTA();
    const href = screen.getByRole("link").getAttribute("href");
    expect(href).toBe("/landing-v2/en/#birth-chart-tool");
    expect(href).not.toContain("/auth");
  });

  it("zh 语境：链到 zh landing 工具（语言随上下文）", () => {
    mockLanguage = "zh";
    renderCTA();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/landing-v2/zh/#birth-chart-tool",
    );
  });

  it("点击发 wiki_cta_clicked 且带 destination 归因", () => {
    renderCTA();
    screen.getByRole("link").click();
    expect(trackEvent).toHaveBeenCalledWith(
      "wiki_cta_clicked",
      expect.objectContaining({
        source: "article_bottom",
        destination: "birth_chart_tool",
      }),
    );
  });

  it("登录用户：不渲染 CTA（防继承登录墙）", () => {
    mockAuth.isAuthenticated = true;
    renderCTA();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("auth 加载中：不渲染 CTA（避免闪烁）", () => {
    mockAuth.isLoading = true;
    renderCTA();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
