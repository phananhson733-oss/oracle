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
} from "../../components/timeline/derived";
import { TimelineAtAGlance } from "../../components/timeline/TimelineAtAGlance";
import { TimelineReport } from "../../components/timeline/TimelineReport";
import { TimelineDomains } from "../../components/timeline/TimelineDomains";
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
