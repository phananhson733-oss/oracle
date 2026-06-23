// @vitest-environment jsdom
// INPUT: derived.ts（energyBand/atAGlance）+ <TimelineAtAGlance>。
// OUTPUT: Phase A · PR A-derived 单测——A4 5 档边界 + clamp、A11 派生四格选择、卡片中性配色(无红/绿)。
// POS: 月度 K 线派生层(A4/A11)回归；derived 选择逻辑/分档边界/At-a-Glance 配色变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, within, fireEvent } from "@testing-library/react";
import {
  energyBand,
  atAGlance,
  currentCandle,
  upcomingMarkers,
  buildOhlcSeries,
} from "../../components/timeline/derived";
import { TimelineAtAGlance } from "../../components/timeline/TimelineAtAGlance";
import { TimelineReport } from "../../components/timeline/TimelineReport";
import { TimelineDomains } from "../../components/timeline/TimelineDomains";
import { TimelineMilestones } from "../../components/timeline/TimelineMilestones";
import { TimelineShareCard } from "../../components/timeline/TimelineShareCard";
import type { TimelineCandle, TimelineMarker, DomainScore } from "../../types";

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

describe("derived.energyBand — A4 5-tier Activity level", () => {
  it("maps intensity to neutral bands at the right boundaries", () => {
    expect(energyBand(0)).toBe("veryQuiet");
    expect(energyBand(19)).toBe("veryQuiet");
    expect(energyBand(20)).toBe("quiet");
    expect(energyBand(40)).toBe("moderate");
    expect(energyBand(60)).toBe("busy");
    expect(energyBand(80)).toBe("veryBusy");
    expect(energyBand(100)).toBe("veryBusy");
  });
  it("clamps out-of-range input", () => {
    expect(energyBand(-10)).toBe("veryQuiet");
    expect(energyBand(999)).toBe("veryBusy");
  });
});

describe("derived.atAGlance — A11 derived picks", () => {
  it("selects peak/quiet by intensity and flow/friction by harmony/tension", () => {
    const candles = [
      candle("2026-06-01", { intensity: 30, harmony: 10, tension: 50 }),
      candle("2026-06-02", { intensity: 90, harmony: 5, tension: 10 }), // peak
      candle("2026-06-03", { intensity: 10, harmony: 80, tension: 5 }), // quiet + flow
    ];
    const g = atAGlance(candles);
    expect(g.peak?.date).toBe("2026-06-02");
    expect(g.quiet?.date).toBe("2026-06-03");
    expect(g.flowLeans?.date).toBe("2026-06-03");
    expect(g.frictionLeans?.date).toBe("2026-06-01");
  });
  it("returns nulls for an empty set", () => {
    expect(atAGlance([]).peak).toBeNull();
  });
});

describe("derived.buildOhlcSeries — 连续 OHLC 游走 (参考 oracle_CN)", () => {
  it("links open[i] to the previous close (intensity) for a continuous walk", () => {
    const cs = [
      candle("2026-06-01", { intensity: 50, start: 42 }),
      candle("2026-06-02", { intensity: 58 }),
      candle("2026-06-03", { intensity: 44 }),
    ];
    const bars = buildOhlcSeries(cs);
    // 首根=doji：open=close=intensity（无前序周期，零变化；忽略 start）。
    expect(bars[0].open).toBe(50);
    expect(bars[0].close).toBe(50);
    expect(bars[0].dir).toBe("flat");
    // 其后 open=上一根 close（连续）。
    expect(bars[1].open).toBe(50);
    expect(bars[1].close).toBe(58);
    expect(bars[2].open).toBe(58);
    expect(bars[2].close).toBe(44);
  });

  it("first/single candle is a doji (no runaway body) and tolerates non-finite input", () => {
    // 单根：open=close → flat、body 为 0（不退回 start..intensity 的高 body）。
    const single = buildOhlcSeries([
      candle("2026-06-01", { intensity: 90, start: 5 }),
    ]);
    expect(single).toHaveLength(1);
    expect(single[0].open).toBe(90);
    expect(single[0].dir).toBe("flat");
    // 空集 → 空数组（不崩）。
    expect(buildOhlcSeries([])).toEqual([]);
    // 非有限值（partial data）被兜底为有限坐标，dir 不为基于 NaN 的误判。
    const bad = buildOhlcSeries([
      candle("2026-06-01", { intensity: Number.NaN, peak: Number.NaN }),
      candle("2026-06-02", { intensity: 60 }),
    ]);
    bad.forEach((b) => {
      expect(Number.isFinite(b.open)).toBe(true);
      expect(Number.isFinite(b.close)).toBe(true);
      expect(Number.isFinite(b.high)).toBe(true);
      expect(Number.isFinite(b.low)).toBe(true);
    });
  });

  it("colors direction by period-over-period change (up/down/flat with eps)", () => {
    const cs = [
      candle("2026-06-01", { intensity: 50, start: 50 }), // open50→close50 = flat
      candle("2026-06-02", { intensity: 70 }), // 50→70 = up
      candle("2026-06-03", { intensity: 55 }), // 70→55 = down
      candle("2026-06-04", { intensity: 56 }), // 55→56 = within eps → flat
    ];
    const bars = buildOhlcSeries(cs);
    expect(bars[0].dir).toBe("flat");
    expect(bars[1].dir).toBe("up");
    expect(bars[2].dir).toBe("down");
    expect(bars[3].dir).toBe("flat");
  });

  it("high/low envelope open/close with peak/dip (wick = period range)", () => {
    const cs = [
      candle("2026-06-01", { intensity: 50, start: 50, peak: 80, dip: 20 }),
      candle("2026-06-02", { intensity: 60, peak: 95, dip: 5 }),
    ];
    const bars = buildOhlcSeries(cs);
    // bar1: open=50, close=60, peak=95, dip=5 → high=95, low=5。
    expect(bars[1].high).toBe(95);
    expect(bars[1].low).toBe(5);
    // high≥max(open,close)、low≤min(open,close) 恒成立。
    bars.forEach((b) => {
      expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close));
      expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close));
    });
  });
});

describe("TimelineAtAGlance — A11 component (neutral colors, no red/green)", () => {
  it("renders the 4 neutral derived cards", () => {
    const candles = [
      candle("2026-06-01", { intensity: 30 }),
      candle("2026-06-02", { intensity: 90 }),
    ];
    const { getByText, container } = render(
      <TimelineAtAGlance candles={candles} />,
    );
    expect(getByText(/peak activity/i)).toBeTruthy();
    expect(getByText(/quietest stretch/i)).toBeTruthy();
    expect(getByText(/where flow leans/i)).toBeTruthy();
    expect(getByText(/where friction leans/i)).toBeTruthy();
    // 配色中性：accent 用 psycho/mystic，绝不继承蜡烛的 green/red（设计 §9.4）。
    const html = container.innerHTML;
    expect(html).toMatch(/bg-(psycho|mystic)-500/);
    expect(html).not.toMatch(/bg-(green|red|emerald|rose)-/);
  });
  it("renders nothing for an empty candle set", () => {
    const { container } = render(<TimelineAtAGlance candles={[]} />);
    expect(container.querySelector("section")).toBeNull();
  });
});

describe("derived — B5' report helpers (currentCandle / upcomingMarkers)", () => {
  const cs = [candle("2026-06-01"), candle("2026-06-02"), candle("2026-06-03")];
  it("currentCandle takes the nowKey match, else the latest, else null", () => {
    expect(currentCandle(cs, "2026-06-02")?.date).toBe("2026-06-02");
    expect(currentCandle(cs, "2099-01-01")?.date).toBe("2026-06-03"); // fallback = latest
    expect(currentCandle([], "2026-06-02")).toBeNull();
  });
  it("upcomingMarkers keeps only future markers after nowKey, sorted, capped", () => {
    const markers: TimelineMarker[] = cs.map((c) => ({
      date: c.date,
      type: "saturn-return",
      label: `m-${c.date}`,
    }));
    const up = upcomingMarkers(cs, markers, "2026-06-01", 4);
    expect(up.map((m) => m.date)).toEqual(["2026-06-02", "2026-06-03"]);
    // cap honoured
    expect(upcomingMarkers(cs, markers, "2026-06-01", 1)).toHaveLength(1);
  });
});

describe("TimelineReport — B5' report skeleton", () => {
  it("renders the Current-Phase card, upcoming turning points, and a safety frame", () => {
    const cs = [
      candle("2026-06-01", { intensity: 30 }),
      candle("2026-06-02", { intensity: 90 }),
    ];
    const markers: TimelineMarker[] = [
      { date: "2026-06-02", type: "saturn-return", label: "Saturn Return" },
    ];
    const { getByText } = render(
      <TimelineReport candles={cs} markers={markers} nowKey="2026-06-01" />,
    );
    expect(getByText(/where you are now/i)).toBeTruthy();
    expect(getByText(/upcoming turning points/i)).toBeTruthy();
    expect(getByText(/saturn return/i)).toBeTruthy();
    // 安全 frame：每个报告必带「非预测/非医疗金融建议」
    expect(getByText(/not predictions/i)).toBeTruthy();
  });
  it("shows the no-upcoming note when there are no future markers", () => {
    const cs = [candle("2026-06-01")];
    const { getByText } = render(<TimelineReport candles={cs} markers={[]} />);
    expect(getByText(/no major cycle markers/i)).toBeTruthy();
  });
});

describe("TimelineDomains — B1 deep card (qualitative, neutral, gated)", () => {
  const score: DomainScore = {
    domains: [
      { domain: "career", activation: "intense", lean: "friction" },
      { domain: "relationships", activation: "active", lean: "flow" },
      { domain: "money", activation: "quiet", lean: "neutral" },
      { domain: "creativity", activation: "quiet", lean: "neutral" },
      { domain: "wellness", activation: "quiet", lean: "neutral" },
      { domain: "growth", activation: "active", lean: "mixed" },
    ],
    confidence: "full",
    version: "domains-v0-spike",
  };

  it("renders the 6 domains with qualitative activation chips + neutral colors (no red/green)", () => {
    const { getByText, container } = render(
      <TimelineDomains domainScores={score} />,
    );
    expect(getByText(/career/i)).toBeTruthy();
    expect(getByText(/inner growth/i)).toBeTruthy();
    expect(getByText(/intense/i)).toBeTruthy();
    // qualitative — never a numeric score like "Career 82/100" (the caption may say "not a score")
    expect(container.textContent).not.toMatch(
      /\d\s*\/\s*100|\bscore\s*:?\s*\d/i,
    );
    // neutral chip colors only — never the candle red/green (§9.4)
    expect(container.innerHTML).not.toMatch(/bg-(green|red|emerald|rose)-/);
  });

  it("renders nothing when domainScores is absent (gate OFF) or empty", () => {
    const a = render(<TimelineDomains domainScores={undefined} />);
    expect(within(a.container).queryByText(/life areas in focus/i)).toBeNull();
    a.unmount();
    const b = render(
      <TimelineDomains
        domainScores={{ domains: [], confidence: "full", version: "x" }}
      />,
    );
    expect(within(b.container).queryByText(/life areas in focus/i)).toBeNull();
  });

  it("surfaces a degraded-confidence note when birth time is unknown", () => {
    const { getByText } = render(
      <TimelineDomains domainScores={{ ...score, confidence: "reduced" }} />,
    );
    expect(getByText(/approximate/i)).toBeTruthy();
  });
});

describe("TimelineMilestones — C 竖向里程碑时间轴", () => {
  const markers: TimelineMarker[] = [
    { age: 29, type: "saturn-return", label: "Saturn Return" },
    { age: 41, type: "outer-opposition", label: "Uranus Opposition" },
  ];

  it("renders the milestone title, each marker label + a neutral description, and the anti-fate note", () => {
    const { getByText, container } = render(
      <TimelineMilestones markers={markers} nowKey="age-29" />,
    );
    expect(getByText(/life milestones/i)).toBeTruthy();
    expect(getByText(/saturn return/i)).toBeTruthy();
    expect(getByText(/uranus opposition/i)).toBeTruthy();
    // 中性周期描述（土星回归）+ 反宿命 note
    expect(getByText(/restructuring and taking ownership/i)).toBeTruthy();
    expect(getByText(/how they land is yours to shape/i)).toBeTruthy();
    // 无红/绿（§9.4）
    expect(container.innerHTML).not.toMatch(/bg-(green|red|emerald|rose)-/);
  });

  it("renders nothing when there are no markers", () => {
    const { container } = render(<TimelineMilestones markers={[]} />);
    expect(container.querySelector("section")).toBeNull();
  });
});

describe("TimelineShareCard — A.5 minimal share card", () => {
  const cs = [
    candle("2026-06-01", { intensity: 30 }),
    candle("2026-06-02", { intensity: 90 }),
  ];
  const markers: TimelineMarker[] = [
    { date: "2026-06-02", type: "saturn-return", label: "Saturn Return" },
  ];

  it("renders the current phase, next turning point, share + create-yours CTAs", () => {
    const { getByText } = render(
      <TimelineShareCard candles={cs} markers={markers} nowKey="2026-06-01" />,
    );
    expect(getByText(/share your energy/i)).toBeTruthy();
    expect(getByText(/saturn return/i)).toBeTruthy(); // next turning point
    expect(getByText(/copy share link/i)).toBeTruthy();
    expect(getByText(/create your own/i)).toBeTruthy();
  });

  it("copies the privacy-safe share link and shows confirmation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { getByText } = render(
      <TimelineShareCard candles={cs} markers={markers} nowKey="2026-06-01" />,
    );
    fireEvent.click(getByText(/copy share link/i));
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
    // the copied link is the PII-free public demo URL
    expect(writeText.mock.calls[0][0]).toContain("/energy-timeline");
    expect(writeText.mock.calls[0][0]).not.toMatch(/birth|lat|lon/i);
    expect(await within(document.body).findByText(/link copied/i)).toBeTruthy();
  });

  it("fires onCreateYours and renders nothing for an empty set", () => {
    const onCreateYours = vi.fn();
    const { getByText } = render(
      <TimelineShareCard
        candles={cs}
        nowKey="2026-06-01"
        onCreateYours={onCreateYours}
      />,
    );
    fireEvent.click(getByText(/create your own/i));
    expect(onCreateYours).toHaveBeenCalledTimes(1);

    const empty = render(<TimelineShareCard candles={[]} />);
    expect(empty.container.querySelector("section")).toBeNull();
  });
});
