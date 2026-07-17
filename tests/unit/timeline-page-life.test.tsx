// @vitest-environment jsdom
// INPUT: <TimelinePage>（真实组件树）+ helpers/lifekline 共享工厂 + mock services/apiClient（fetchTransitTimeline 按 granularity 回放 year/day 数据）+ mock analytics/AuthContext；localStorage 预置 onboarding 已读。
// OUTPUT: /timeline life/非 life 双分支契约——默认 life 模式（Long-range 激活 + birthYear→+99 年级请求）、lk-scope 呈现且旧链（Legend/AtAGlance/Share/Milestones）隐藏、included-free 叙事框定、initialMode="month" 覆盖初始视图（无 lk-scope + 首请求日级）、切 month 重取日级+旧链回归、life 下选蜡烛不弹详情抽屉、EPHEMERIS_UNAVAILABLE 错误态+重试。
// POS: pages/TimelinePage.tsx life 分支路由级回归基线；请求区间/模式切换/错误分支变更需同步本测试与 tests/unit/FOLDER.md。

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../services/analytics", () => ({
  trackEvent: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
  trackPageView: vi.fn(),
  trackError: vi.fn(),
}));
// UIComponents 顶层 import AuthContext（拉起 supabase/entitlement 链）；语言/主题走默认 context。
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({}),
}));
vi.mock("../../services/apiClient", () => ({
  fetchTransitTimeline: vi.fn(),
  fetchCbtMoodPoints: vi.fn(() => Promise.resolve({ points: [] })),
  fetchLifeNarrative: vi.fn(), // TimelineLifeNarrative 按需生成，渲染期不调用
  fetchDailyDetail: vi.fn(), // TimelineDetailSheet 仅打开后调用
}));

import TimelinePage from "../../pages/TimelinePage";
import { fetchTransitTimeline } from "../../services/apiClient";
import { getTimelineCopy } from "../../components/timeline/copy";
import type {
  TimelineCandle,
  TimelineResponse,
  UserProfile,
} from "../../types";
import {
  installPointerEventPolyfill,
  makeCandle,
  makeLifeCandles,
  makeLifeMarkers,
} from "./helpers/lifekline";

const fetchMock = vi.mocked(fetchTransitTimeline);
const EN = getTimelineCopy("en");

// hit rect 交互需要 pointerType/clientX（jsdom 缺 PointerEvent 时补齐）。
installPointerEventPolyfill();

// ---- 工厂 ----

const profile: UserProfile = {
  userId: "u-test",
  name: "Test User",
  birthDate: "1990-05-15",
  birthTime: "12:30",
  birthCity: "London",
  lat: 51.5074,
  lon: -0.1278,
  timezone: "Europe/London",
  accuracyLevel: "exact",
  focusTags: [],
};

const LIFE_CANDLES: TimelineCandle[] = makeLifeCandles();
const DAY_CANDLES: TimelineCandle[] = Array.from({ length: 30 }, (_, i) =>
  makeCandle(`2026-07-${String(i + 1).padStart(2, "0")}`),
);
const LIFE_MARKERS = makeLifeMarkers();

const makeResponse = (
  granularity: "day" | "month" | "year",
): TimelineResponse => ({
  granularity,
  tz: "UTC",
  contract: {
    semantics: "interval-summary",
    smoothingVersion: "test",
    sourceVersion: "test",
  },
  candles: granularity === "year" ? LIFE_CANDLES : DAY_CANDLES,
  markers: granularity === "year" ? LIFE_MARKERS : [],
  dataQuality: "ok",
  accuracy: "exact",
});

const renderPage = () => render(<TimelinePage profile={profile} />);

const waitForLifeSection = async (container: HTMLElement): Promise<void> => {
  await waitFor(() => {
    expect(container.querySelector(".lk-scope")).toBeTruthy();
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  // 首访 onboarding 弹层会盖住页面（含 dialog 语义），预置已读跳过。
  localStorage.setItem("astro_timeline_onboarded", "1");
  fetchMock.mockImplementation(
    (_profile, _from, _to, _lang, granularity = "day") =>
      Promise.resolve(makeResponse(granularity)),
  );
});

describe("TimelinePage — life mode (default)", () => {
  it("defaults to life mode: Long-range tab active + year request spanning birthYear..+99", async () => {
    const { container } = renderPage();
    const lifeBtn = screen.getByRole("button", { name: EN.lifeModeLabel });
    expect(lifeBtn.className).toContain("bg-psycho-600"); // 激活态类
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      profile,
      "1990-01-01",
      "2089-12-31",
      "en",
      "year",
      30000, // life 分支放宽的客户端超时（TimelinePage LIFE_TIMELINE_TIMEOUT_MS）
    );
    await waitForLifeSection(container);
  });

  it("renders the LifeKlineSection block and hides the legacy month-chain modules", async () => {
    const { container } = renderPage();
    await waitForLifeSection(container);
    // 旧链标志物全部不在：Legend 图例句 / At-a-Glance / ShareCard / Milestones 标题。
    expect(screen.queryByText(EN.legendIntensity)).toBeNull();
    expect(screen.queryByText(EN.atAGlanceTitle)).toBeNull();
    expect(screen.queryByText(EN.shareCardTitle)).toBeNull();
    expect(screen.queryByText(EN.milestonesTitle)).toBeNull();
  });

  it("frames the free LLM narrative with the included-free line", async () => {
    const { container } = renderPage();
    await waitForLifeSection(container);
    expect(screen.getByText("Included free with your account")).toBeTruthy();
  });

  it("switching to Month refetches with day granularity and restores the legacy chain", async () => {
    const { container } = renderPage();
    await waitForLifeSection(container);
    fireEvent.click(screen.getByRole("button", { name: EN.monthModeLabel }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, from, to, lang, granularity] = fetchMock.mock.calls[1];
    expect(granularity).toBe("day");
    expect(from).toMatch(/^\d{4}-\d{2}-01$/); // 当月首日
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(lang).toBe("en");
    await screen.findByText(EN.legendIntensity); // TimelineLegend 回归
    expect(container.querySelector(".lk-scope")).toBeNull();
  });

  it("selecting a candle in life mode never opens the TimelineDetailSheet", async () => {
    const { container } = renderPage();
    await waitForLifeSection(container);
    const rect = container.querySelector('.lk-hit[data-age="40"]');
    expect(rect).toBeTruthy();
    fireEvent.keyDown(rect as Element, { key: "Enter" }); // 键盘锁定选中
    // 选中生效走 lifekline 内部（pin toast），但没有任何 dialog（详情抽屉仅 month/year 分支挂载）。
    expect(screen.getByText("Pinned age 40")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("initialMode='month' skips the life block: no lk-scope and the first request is day-granularity", async () => {
    const { container } = render(
      <TimelinePage profile={profile} initialMode="month" />,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, from, to, lang, granularity] = fetchMock.mock.calls[0];
    expect(granularity).toBe("day");
    expect(from).toMatch(/^\d{4}-\d{2}-01$/); // 当月首日
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(lang).toBe("en");
    await screen.findByText(EN.legendIntensity); // 旧链直接渲染
    expect(container.querySelector(".lk-scope")).toBeNull();
  });

  it("shows the ephemeris-unavailable error state with a working retry", async () => {
    fetchMock.mockImplementation(() =>
      Promise.reject(
        Object.assign(new Error("ephemeris down"), {
          code: "EPHEMERIS_UNAVAILABLE",
        }),
      ),
    );
    renderPage();
    await screen.findByText(EN.unavailableTitle);
    expect(screen.getByText(EN.unavailableBody)).toBeTruthy();
    const retryBtn = screen.getByRole("button", { name: EN.retry });
    fireEvent.click(retryBtn);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
