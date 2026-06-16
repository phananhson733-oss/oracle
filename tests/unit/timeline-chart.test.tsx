// @vitest-environment jsdom
// INPUT: <TimelineChart> + mock TimelineCandle[]。
// OUTPUT: jsdom 渲染冒烟测试 — SVG 渲染、每日一个蜡烛组、点击回传日期、单蜡烛无 MA 线不崩、marker 圆点。
// POS: 月度 K 线主图渲染契约；TimelineChart 组件变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TimelineChart } from "../../components/timeline/TimelineChart";
import type { TimelineCandle } from "../../types";

const candle = (
  date: string,
  over: Partial<TimelineCandle> = {},
): TimelineCandle => ({
  date,
  start: 40,
  peak: 60,
  dip: 30,
  end: 50,
  intensity: 50,
  harmony: 20,
  tension: 15,
  dominantPhase: "applying",
  dataQuality: "ok",
  sampleCount: 5,
  topAspects: [],
  ...over,
});

describe("TimelineChart", () => {
  it("renders an SVG with one candle group per data point", () => {
    const candles = [
      candle("2026-06-01"),
      candle("2026-06-02"),
      candle("2026-06-03"),
    ];
    const { container } = render(<TimelineChart candles={candles} />);
    expect(container.querySelector('svg[role="img"]')).toBeTruthy();
    expect(container.querySelectorAll("g").length).toBe(3);
  });

  it("fires onSelectDate with the candle's date when a candle is clicked", () => {
    const onSelect = vi.fn();
    const candles = [candle("2026-06-07"), candle("2026-06-08")];
    const { container } = render(
      <TimelineChart candles={candles} onSelectDate={onSelect} />,
    );
    const groups = container.querySelectorAll("g");
    fireEvent.click(groups[0]);
    expect(onSelect).toHaveBeenCalledWith("2026-06-07");
  });

  it("omits the moving-average polyline for a single candle and does not crash", () => {
    const { container } = render(
      <TimelineChart candles={[candle("2026-06-01")]} />,
    );
    expect(container.querySelector("polyline")).toBeNull();
    expect(container.querySelectorAll("g").length).toBe(1);
  });

  it("renders a marker dot when a candle has an associated marker", () => {
    const candles = [candle("2026-06-15")];
    const { container } = render(
      <TimelineChart
        candles={candles}
        markers={[
          { date: "2026-06-15", type: "saturn-return", label: "Saturn Return" },
        ]}
      />,
    );
    expect(container.querySelector("circle")).toBeTruthy();
  });
});
