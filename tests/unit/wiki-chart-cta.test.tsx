// @vitest-environment jsdom
// INPUT: WikiChartCTA 多变体组件 + @testing-library/react + MemoryRouter；mock auth/language/theme/analytics。
// OUTPUT: Nav/Sticky/Lead/Bottom CTA 的语言感知目标、个性化文案、滚动阈值与统一 tool_click 契约测试。
// POS: 守护 wiki→免费盘 P0 漏斗收口点；若改 CTA 模块/阈值/归因同步此测试。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

import WikiChartCTA, {
  deriveCelebrityName,
} from "../../components/wiki/WikiChartCTA";

const renderCTA = (props: Record<string, unknown> = {}) =>
  render(
    <MemoryRouter>
      <WikiChartCTA {...props} />
    </MemoryRouter>,
  );

beforeEach(() => {
  mockAuth.isAuthenticated = false;
  mockAuth.isLoading = false;
  mockLanguage = "en";
  trackEvent.mockClear();
});

describe("WikiChartCTA — 统一 Wiki→工具漏斗", () => {
  it("从名人文章标题/slug 可靠提取姓名，并排除教程/榜单页", () => {
    expect(
      deriveCelebrityName(
        "erling-haaland-birth-chart",
        "Reading the Erling Haaland Birth Chart: A Late-Cancer Sun",
      ),
    ).toBe("Erling Haaland");
    expect(
      deriveCelebrityName(
        "mbappe-birth-chart",
        "Mbappé's Birth Chart: Sagittarius Reads",
      ),
    ).toBe("Mbappé");
    expect(
      deriveCelebrityName(
        "how-to-read-birth-chart",
        "How to Read a Birth Chart",
      ),
    ).toBeNull();
    expect(
      deriveCelebrityName(
        "best-soccer-players-zodiac-sign",
        "Best Soccer Players by Zodiac Sign",
      ),
    ).toBeNull();
  });

  it("文章底部 CTA 直达英文工具页", () => {
    renderCTA();
    const href = screen.getByRole("link").getAttribute("href");
    expect(href).toBe("/en/birth-chart-calculator");
  });

  it("zh 语境：直达中文工具页", () => {
    mockLanguage = "zh";
    renderCTA();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/zh/birth-chart-calculator",
    );
  });

  it("点击发 tool_click 且包含统一归因字段", () => {
    renderCTA();
    act(() => screen.getByRole("link").click());
    expect(trackEvent).toHaveBeenCalledWith(
      "tool_click",
      expect.objectContaining({
        cta_module: "article_bottom",
        page_path: "/",
        page_location: expect.any(String),
        tool_target: "/en/birth-chart-calculator",
      }),
    );
  });

  it("登录用户仍可使用公开 Birth Chart 工具入口", () => {
    mockAuth.isAuthenticated = true;
    renderCTA();
    expect(screen.getByRole("link")).toBeTruthy();
  });

  it("lead celebrity 变体显示姓名、主工具和教程副入口", () => {
    renderCTA({ variant: "lead", celebrityName: "Erling Haaland" });
    expect(
      screen.getByText(/You're reading Erling Haaland's birth chart/i),
    ).toBeTruthy();
    expect(screen.getByText(/What does YOUR chart reveal/i)).toBeTruthy();
    expect(screen.getByText(/Free · No sign-up · Instant results/i)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Get Your Free Birth Chart/i })
        .getAttribute("href"),
    ).toBe("/en/birth-chart-calculator");
    expect(
      screen.getByRole("link", { name: /How to Read It/i }).getAttribute("href"),
    ).toBe(
      "/en/wiki/how-to-read-birth-chart",
    );
  });

  it("lead generic 变体使用通用 natal chart 文案", () => {
    renderCTA({ variant: "lead" });
    expect(
      screen.getByText(/Discover your complete natal chart — free/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/Planet positions · House placements · Readings/i),
    ).toBeTruthy();
  });

  it("sticky 变体按 400px 显示、100px 隐藏", () => {
    renderCTA({ variant: "sticky" });
    const region = screen.getByTestId("wiki-sticky-tool-cta");
    const spacer = screen.getByTestId("wiki-sticky-tool-spacer");

    expect(region.getAttribute("data-visible")).toBe("false");
    expect(spacer.className).toContain("h-0");
    Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(region.getAttribute("data-visible")).toBe("true");
    expect(spacer.className).toContain("h-12");

    Object.defineProperty(window, "scrollY", { value: 80, configurable: true });
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(region.getAttribute("data-visible")).toBe("false");
    expect(spacer.className).toContain("h-0");
  });

  it("nav 变体提供紧凑的全站入口", () => {
    renderCTA({ variant: "nav" });
    expect(
      screen
        .getByRole("link", { name: /Get Free Birth Chart/i })
        .getAttribute("href"),
    ).toBe("/en/birth-chart-calculator");
  });

  it.each([
    ["nav", "Get Free Birth Chart", "module_a"],
    ["lead", "Calculate My Birth Chart", "module_c"],
  ] as const)("%s 主按钮使用需求约定的模块编号", (variant, label, module) => {
    renderCTA({ variant });
    act(() => screen.getByRole("link", { name: new RegExp(label, "i") }).click());
    expect(trackEvent).toHaveBeenCalledWith(
      "tool_click",
      expect.objectContaining({ cta_module: module }),
    );
  });

  it("sticky 主按钮使用 module_b 编号", () => {
    renderCTA({ variant: "sticky" });
    Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
    act(() => window.dispatchEvent(new Event("scroll")));
    act(() =>
      screen.getByRole("link", { name: /Get Mine Free/i }).click(),
    );
    expect(trackEvent).toHaveBeenCalledWith(
      "tool_click",
      expect.objectContaining({ cta_module: "module_b" }),
    );
  });
});
