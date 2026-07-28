// @vitest-environment jsdom
// INPUT: <TimelineDetailSheet> + mock TimelineCandle/OhlcBar；mock fetchDailyDetail。
// OUTPUT: B 详情抽屉契约测试——tab 集随模式变化(date→3 tab、age→2 tab)、概览 OHLC 三格/lean、正在活跃 aspects/空态。
// POS: CN 式多 tab 详情抽屉(B)渲染契约；TimelineDetailSheet 变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";

vi.mock("../../services/apiClient", () => ({
  fetchDailyDetail: vi.fn().mockResolvedValue({ content: null }),
}));

import { TimelineDetailSheet } from "../../components/timeline/TimelineDetailSheet";
import type { TimelineCandle, UserProfile } from "../../types";
import type { OhlcBar } from "../../components/timeline/derived";

const profile = { birthDate: "1994-06-01" } as unknown as UserProfile;

const candle = (over: Partial<TimelineCandle> = {}): TimelineCandle => ({
  date: "2026-06-15",
  start: 40,
  peak: 70,
  dip: 30,
  end: 55,
  intensity: 55,
  harmony: 30,
  tension: 12,
  dominantPhase: "applying",
  dataQuality: "ok",
  sampleCount: 5,
  topAspects: [],
  ...over,
});

const bar: OhlcBar = { open: 40, close: 55, high: 70, low: 30, dir: "up" };

describe("TimelineDetailSheet — B CN 式多 tab 详情抽屉", () => {
  it("renders 3 tabs for a dated (month) candle and OHLC overview values", () => {
    const { getByText, container } = render(
      <TimelineDetailSheet
        candle={candle()}
        ohlc={bar}
        profile={profile}
        onClose={() => {}}
      />,
    );
    // tab 集：概览 / 正在活跃 / 解读
    expect(getByText(/overview/i)).toBeTruthy();
    expect(getByText(/what's active/i)).toBeTruthy();
    expect(getByText(/reading/i)).toBeTruthy();
    // OHLC 三格：Prev 40 / Now 55 / Range 30–70
    expect(getByText("40")).toBeTruthy();
    expect(getByText("55")).toBeTruthy();
    expect(getByText(/30–70/)).toBeTruthy();
    // lean 标签存在（harmony>tension → flow）
    expect(within(container).getByText(/leans/i)).toBeTruthy();
  });

  it("hides the Reading tab when allowReading=false (year mode: monthly candle has a date but no day reading)", () => {
    // 年度月级蜡烛 date=当月 1 号；不应拉某一天的解读冒充整月。
    const { queryByText, getByText } = render(
      <TimelineDetailSheet
        candle={candle()}
        ohlc={bar}
        profile={profile}
        allowReading={false}
        onClose={() => {}}
      />,
    );
    expect(getByText(/overview/i)).toBeTruthy();
    expect(getByText(/what's active/i)).toBeTruthy();
    expect(queryByText(/^reading$/i)).toBeNull();
  });

  it("hides the Reading tab for an age-only (life) candle", () => {
    const ageCandle = candle({ date: undefined, age: 32 });
    const { queryByText, getByText } = render(
      <TimelineDetailSheet
        candle={ageCandle}
        ohlc={bar}
        profile={profile}
        onClose={() => {}}
      />,
    );
    expect(getByText(/overview/i)).toBeTruthy();
    expect(getByText(/what's active/i)).toBeTruthy();
    expect(queryByText(/^reading$/i)).toBeNull(); // 年级蜡烛无逐日解读
  });

  it("shows a quiet-stretch note on the active tab when there are no aspects", () => {
    const { getByText } = render(
      <TimelineDetailSheet
        candle={candle({ topAspects: [] })}
        ohlc={bar}
        profile={profile}
        onClose={() => {}}
      />,
    );
    fireEvent.click(getByText(/what's active/i));
    expect(getByText(/no major aspects/i)).toBeTruthy();
  });

  it("lists real transits on the active tab", () => {
    const withAspect = candle({
      topAspects: [
        {
          episodeId: "e1",
          transitBody: "Saturn",
          natalBody: "Sun",
          type: "square",
          phase: "applying",
        },
      ],
    });
    const { getByText } = render(
      <TimelineDetailSheet
        candle={withAspect}
        ohlc={bar}
        profile={profile}
        onClose={() => {}}
      />,
    );
    fireEvent.click(getByText(/what's active/i));
    expect(getByText(/Saturn/)).toBeTruthy();
    expect(getByText(/Sun/)).toBeTruthy();
  });
});
