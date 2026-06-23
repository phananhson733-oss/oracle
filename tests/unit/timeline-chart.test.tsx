// @vitest-environment jsdom
// INPUT: <TimelineChart> + mock TimelineCandle[]。
// OUTPUT: jsdom 渲染冒烟测试 — SVG 渲染、每日一个蜡烛组、点击回传日期、单蜡烛无 MA 线不崩、marker 圆点。
// POS: 月度 K 线主图渲染契约；TimelineChart 组件变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
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

  it("B6: hides the trend (MA) polyline when showTrend is false", () => {
    const candles = [candle("2026-06-01"), candle("2026-06-02")];
    const on = render(<TimelineChart candles={candles} showTrend />);
    expect(on.container.querySelector("polyline")).toBeTruthy(); // default shows trend
    const off = render(<TimelineChart candles={candles} showTrend={false} />);
    expect(off.container.querySelector("polyline")).toBeNull();
  });

  it("B6: zoomFactor widens candles beyond the default cap (and clamps at 3x)", () => {
    // 24 根（月视图量级，避开 sparse 加宽）测 zoom：默认 cap 12、zoom 放大、3x clamp。
    const candles = Array.from({ length: 24 }, (_, i) =>
      candle(`2026-06-${String(i + 1).padStart(2, "0")}`),
    );
    const bodyW = (zoom?: number) => {
      const { container } = render(
        <TimelineChart candles={candles} zoomFactor={zoom} />,
      );
      return Math.max(
        ...Array.from(
          container.querySelectorAll("g > rect:nth-of-type(2)"),
        ).map((r) => Number(r.getAttribute("width"))),
      );
    };
    expect(bodyW(1)).toBeLessThanOrEqual(12); // default cap
    expect(bodyW(2)).toBeGreaterThan(12); // 2x widens past it
    expect(bodyW(99)).toEqual(bodyW(3)); // clamped at 3x
  });

  it("widens candles on sparse views (year/long-range) so they don't look thin on wide screens", () => {
    // 12 月（year 视图）在宽屏上若按月视图 cap 12 会瘦长空旷；sparse 加宽让蜡烛更醒目。
    const few = Array.from({ length: 12 }, (_, i) =>
      candle(`2026-${String(i + 1).padStart(2, "0")}-01`),
    );
    const { container } = render(<TimelineChart candles={few} />);
    const bodyW = Math.max(
      ...Array.from(container.querySelectorAll("g > rect:nth-of-type(2)")).map(
        (r) => Number(r.getAttribute("width")),
      ),
    );
    expect(bodyW).toBeGreaterThan(12); // sparse 视图加宽超过密集月视图的 cap 12
  });

  it("clamps the wick so an extreme peak/dip never spans the whole chart", () => {
    // 月/年聚合的单根蜡烛可能 peak~100 dip~0；wick 不应贯穿全图（用户反馈"中间那根过长"）。
    const extreme = [
      candle("2026-06-01"), // 普通蜡烛作参照
      { ...candle("2026-06-02"), start: 48, end: 52, peak: 100, dip: 0 },
    ];
    const { container } = render(<TimelineChart candles={extreme} />);
    const wicks = Array.from(container.querySelectorAll("g > line")).map((l) =>
      Math.abs(Number(l.getAttribute("y2")) - Number(l.getAttribute("y1"))),
    );
    const maxWick = Math.max(...wicks);
    // 全图绘图高度（H_DESKTOP=440）；clamp 后 wick 远小于满量程（body 4px + 2×16%H ≈ 145）。
    expect(maxWick).toBeLessThan(200);
  });

  it("clamps body height by granularity — long-range tightest, month relaxed (user baseline)", () => {
    const bodyMax = (utils: ReturnType<typeof render>) =>
      Math.max(
        ...Array.from(utils.container.querySelectorAll("rect"))
          .filter((r) =>
            ["#10B981", "#EF4444"].includes(
              (r.getAttribute("fill") || "").toUpperCase(),
            ),
          )
          .map((r) => Number(r.getAttribute("height"))),
      );

    // 长程（age 年级聚合）：start..end 跨度大→body 收得最紧（maxBodyExtent≈0.18×440=79）。
    const longRange = Array.from({ length: 30 }, (_, i) => ({
      ...candle("2026-06-01"),
      date: undefined,
      age: i + 1,
      start: 5,
      end: 95,
      peak: 100,
      dip: 0,
    }));
    expect(
      bodyMax(render(<TimelineChart candles={longRange} />)),
    ).toBeLessThanOrEqual(92);

    // 月度（>14 根日级蜡烛）：放松，长 body 不被过度 clamp（maxBodyExtent=0.5×440=220）——保持月度合理观感。
    const month = Array.from({ length: 28 }, (_, i) => ({
      ...candle(`2026-06-${String(i + 1).padStart(2, "0")}`),
      start: 5,
      end: 95,
    }));
    expect(bodyMax(render(<TimelineChart candles={month} />))).toBeGreaterThan(
      92,
    );
  });

  it("keeps a full month compact: candle bodies are capped (not ballooned to fill wide screens)", () => {
    // 回归用户反馈"大小太大了"：宽容器下槽位/蜡烛体须封顶，而非铺满拉宽。
    const candles = Array.from({ length: 31 }, (_, i) =>
      candle(`2026-07-${String(i + 1).padStart(2, "0")}`),
    );
    const { container } = render(<TimelineChart candles={candles} />);
    // body rect = 每组第 2 个 rect（首个是命中区）。宽度须 ≤ 12（MAX bodyW），不再是旧的 ~20。
    const bodyRects = container.querySelectorAll("g > rect:nth-of-type(2)");
    expect(bodyRects.length).toBe(31);
    bodyRects.forEach((r) => {
      expect(Number(r.getAttribute("width"))).toBeLessThanOrEqual(12);
    });
    // 整月仍全部渲染、不裁切（31 个蜡烛组都在）。
    expect(container.querySelectorAll("g").length).toBe(31);
  });

  it("supports year-granularity (age) candles: matches an age marker + fires onSelect with the age key", () => {
    const onSelect = vi.fn();
    // 人生 K 线候选：无 date，用 age 标识；marker 也按 age 匹配。
    const ageCandle = candle("", { age: 29 }) as TimelineCandle;
    delete (ageCandle as { date?: string }).date;
    const { container } = render(
      <TimelineChart
        candles={[ageCandle]}
        markers={[{ age: 29, type: "saturn-return", label: "Saturn Return" }]}
        onSelectDate={onSelect}
      />,
    );
    expect(container.querySelector("circle")).toBeTruthy(); // marker matched by age key
    fireEvent.click(container.querySelector("g")!);
    expect(onSelect).toHaveBeenCalledWith("age-29");
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

  it("renders the CBT mood overlay (teal dots) for moodPoints aligned by date", () => {
    const candles = [candle("2026-06-01"), candle("2026-06-02")];
    const { container } = render(
      <TimelineChart
        candles={candles}
        moodPoints={[{ date: "2026-06-02", intensity: 70 }]}
      />,
    );
    // 情绪点用 teal (#0D9488) 圆点；按 date 对齐到对应候选。
    const teal = Array.from(container.querySelectorAll("circle")).filter(
      (c) => (c.getAttribute("fill") || "").toUpperCase() === "#0D9488",
    );
    expect(teal.length).toBe(1);
  });
});

describe("TimelineChart — Phase A geometry/a11y (A3/A8/A10/A12)", () => {
  it("candles are solid-filled by direction (实心红绿，竞品式) — no hollow white body", () => {
    const candles = [
      candle("2026-06-01"), // up (start 40 → end 50)
      candle("2026-06-02", { start: 60, end: 40 }), // down
    ];
    const { container } = render(<TimelineChart candles={candles} />);
    const fills = Array.from(container.querySelectorAll("rect")).map((r) =>
      (r.getAttribute("fill") || "").toUpperCase(),
    );
    expect(fills).not.toContain("#FFFFFF"); // 空心白底已移除（按用户要求实心化）
    expect(fills).toContain("#10B981"); // 涨 = 实心 emerald
    expect(fills).toContain("#EF4444"); // 跌 = 实心红
  });

  it("shows a hover read-out card (activity + range) when hovering a candle", () => {
    const candles = [candle("2026-06-01"), candle("2026-06-02")];
    const { container } = render(<TimelineChart candles={candles} />);
    const firstGroup = container.querySelector("g");
    fireEvent.mouseEnter(firstGroup!);
    // 浮动解读卡：含活跃度 + 区间（中性数值文案，非吉凶命运断言）
    expect(container.textContent).toMatch(/Activity/);
    expect(container.textContent).toMatch(/Range/);
    fireEvent.mouseLeave(firstGroup!);
  });

  it("fits all candles within the container width (no horizontal scroll at zoom 1)", () => {
    // 长程 90 根：fit 一页——chartWidth 不超过容器宽（svg width <= DEFAULT_WIDTH 720）。
    const many = Array.from({ length: 90 }, (_, i) => ({
      ...candle("2026-06-01"),
      date: undefined,
      age: i + 1,
    }));
    const { container } = render(<TimelineChart candles={many} />);
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBeLessThanOrEqual(720);
  });

  it("A10: 'You are here' indicator carries an aria-label only when nowKey is in view", () => {
    const candles = [candle("2026-06-01"), candle("2026-06-02")];
    // scope queries to each render's container (both mount into document.body)
    const inView = render(
      <TimelineChart candles={candles} nowKey="2026-06-02" />,
    );
    expect(
      within(inView.container).queryByLabelText(/you are here/i),
    ).toBeTruthy();
    inView.unmount();

    const outOfView = render(
      <TimelineChart candles={candles} nowKey="2099-01-01" />,
    );
    expect(
      within(outOfView.container).queryByLabelText(/you are here/i),
    ).toBeNull();
  });

  it("A8: future markers are capped at 5 once nowKey is in view", () => {
    const candles = Array.from({ length: 12 }, (_, i) =>
      candle(`2026-06-${String(i + 1).padStart(2, "0")}`),
    );
    const markers = candles.map((c) => ({
      date: c.date,
      type: "saturn-return" as const,
      label: `m-${c.date}`,
    }));
    const { container } = render(
      <TimelineChart candles={candles} markers={markers} nowKey="2026-06-01" />,
    );
    // marker dots are the only <title> nodes; 11 future markers → capped at 5
    expect(container.querySelectorAll("title").length).toBe(5);
  });

  it("A3: desktop default plot height (jsdom lacks ResizeObserver → 720px → tall band)", () => {
    const { container } = render(
      <TimelineChart candles={[candle("2026-06-01")]} />,
    );
    const h = Number(container.querySelector("svg")?.getAttribute("height"));
    expect(h).toBeGreaterThan(400); // H_DESKTOP(440) + pads → ~484
  });
});
