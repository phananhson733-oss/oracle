// INPUT: components/timeline/lifekline/lifeKlineDerived.ts 全部导出（人生 K 线 v7 纯函数派生层）+ helpers/lifekline 共享工厂（makeCandle/makeAspect）。
// OUTPUT: TDD 单测——OHLC 构建/MA10/R-S（含 clamp 倒挂护栏）/全部阈值 key 函数边界 ±1 与分支优先级（含 moduleTierKey）/cycleCue/模块状态/气泡挑选/tooltip 夹紧/坐标映射。
// POS: lifekline v7 呈现升级的算法回归基线；阈值 1:1 对照 v7 artifact（行 200-433），阈值变更必须同步本测试。

import { describe, expect, it } from "vitest";
import {
  buildLifePoints,
  CHART,
  clampTooltip,
  computeMa10,
  cycleCueKey,
  headlineKey,
  interpretationKey,
  eventHintKey,
  adviceHintKey,
  watchHintKey,
  bestUseKey,
  watchOutKey,
  trendKey,
  MAX_AGE,
  moduleState,
  moduleTierKey,
  modulesInFocus,
  phaseKey,
  pickBubbles,
  statusKey,
  statusLabelKey,
  supportResistance,
  xForAge,
  yForValue,
  type LifePoint,
} from "../../components/timeline/lifekline/lifeKlineDerived";
import type { TimelineCandleAspect, TimelineMarker } from "../../types";
import {
  makeAspect as aspect,
  makeCandle as candle,
} from "./helpers/lifekline";

const point = (over: Partial<LifePoint> = {}): LifePoint => ({
  age: 50,
  year: 2038,
  open: 50,
  close: 50,
  high: 55,
  low: 45,
  delta: 0,
  ma10: 50,
  up: true,
  harmony: 0,
  tension: 0,
  topAspects: [],
  ...over,
});

const marker = (
  type: TimelineMarker["type"],
  age: number | undefined,
): TimelineMarker => ({ type, age, label: type });

// pickBubbles 用：为给定年龄集合生成最小 LifePoint 序列。
const pointsAtAges = (ages: number[]): LifePoint[] =>
  ages.map((age) => point({ age, year: 1988 + age }));

describe("constants", () => {
  it("exports the v7 chart geometry constants verbatim", () => {
    expect(MAX_AGE).toBe(99);
    expect(CHART).toEqual({
      w: 1480,
      h: 620,
      left: 74,
      right: 1432,
      top: 70,
      bottom: 540,
    });
  });
});

describe("buildLifePoints", () => {
  it("returns [] for empty input", () => {
    expect(buildLifePoints([], 1988)).toEqual([]);
  });

  it("makes the first candle a doji (open===close, delta 0, up=true)", () => {
    const [p] = buildLifePoints([candle(0, { intensity: 42.4 })], 1988);
    expect(p.open).toBe(42);
    expect(p.close).toBe(42);
    expect(p.delta).toBe(0);
    expect(p.up).toBe(true);
  });

  it("keeps continuity: open[i] === close[i-1] after rounding", () => {
    const pts = buildLifePoints(
      [
        candle(0, { intensity: 50.4 }),
        candle(1, { intensity: 62.7 }),
        candle(2, { intensity: 40.2 }),
      ],
      1988,
    );
    expect(pts[1].open).toBe(pts[0].close);
    expect(pts[2].open).toBe(pts[1].close);
    expect(pts[0].close).toBe(50);
    expect(pts[1].close).toBe(63);
    expect(pts[2].close).toBe(40);
  });

  it("rounds open/close/high/low and derives delta/up from rounded values", () => {
    const pts = buildLifePoints(
      [
        candle(0, { intensity: 50.4, peak: 55.2, dip: 48.9 }),
        candle(1, { intensity: 62.7, peak: 70.6, dip: 44.4 }),
      ],
      1988,
    );
    // 第二根：open=round(50.4)=50, close=round(62.7)=63, high=round(70.6)=71, low=round(44.4)=44。
    expect(pts[1]).toMatchObject({
      open: 50,
      close: 63,
      high: 71,
      low: 44,
      delta: 13,
      up: true,
    });
    // 下跌根 up=false。
    const down = buildLifePoints(
      [candle(0, { intensity: 60 }), candle(1, { intensity: 41 })],
      1988,
    );
    expect(down[1].up).toBe(false);
    expect(down[1].delta).toBe(-19);
  });

  it("maps year = birthYear + age", () => {
    const pts = buildLifePoints([candle(3), candle(7)], 1990);
    expect(pts[0].year).toBe(1993);
    expect(pts[1].year).toBe(1997);
  });

  it("drops candles with non-finite age and keeps continuity across the gap", () => {
    const pts = buildLifePoints(
      [
        candle(0, { intensity: 30 }),
        candle(undefined, { intensity: 99 }),
        candle(Number.NaN, { intensity: 88 }),
        candle(2, { intensity: 70 }),
      ],
      1988,
    );
    expect(pts.map((p) => p.age)).toEqual([0, 2]);
    // 连续性来自被保留的上一根（无效根被丢弃后不参与游走）。
    expect(pts[1].open).toBe(30);
    expect(pts[1].close).toBe(70);
  });

  it("sorts results by age ascending and walks OHLC in age order", () => {
    const pts = buildLifePoints(
      [
        candle(5, { intensity: 80 }),
        candle(3, { intensity: 20 }),
        candle(4, { intensity: 50 }),
      ],
      1988,
    );
    expect(pts.map((p) => p.age)).toEqual([3, 4, 5]);
    expect(pts[0].close).toBe(20);
    expect(pts[1].open).toBe(20);
    expect(pts[2].open).toBe(50);
  });

  it("coerces non-finite harmony/tension to 0 and passes topAspects through", () => {
    const aspects = [aspect("Venus")];
    const pts = buildLifePoints(
      [
        candle(0, {
          harmony: Number.NaN,
          tension: Number.POSITIVE_INFINITY,
          topAspects: aspects,
        }),
        candle(1, { harmony: 12, tension: 7 }),
      ],
      1988,
    );
    expect(pts[0].harmony).toBe(0);
    expect(pts[0].tension).toBe(0);
    expect(pts[0].topAspects).toEqual(aspects);
    expect(pts[1].harmony).toBe(12);
    expect(pts[1].tension).toBe(7);
  });

  it("computes ma10 as trailing mean of rounded closes", () => {
    const pts = buildLifePoints(
      [
        candle(0, { intensity: 50.4 }),
        candle(1, { intensity: 62.7 }),
        candle(2, { intensity: 40.2 }),
      ],
      1988,
    );
    // closes = [50, 63, 40] → ma10 = [50, round(56.5)=57, round(51)=51]。
    expect(pts.map((p) => p.ma10)).toEqual([50, 57, 51]);
  });
});

describe("computeMa10", () => {
  it("returns the value itself for a single element", () => {
    expect(computeMa10([10])).toEqual([10]);
  });

  it("uses the available window for the first 9 entries", () => {
    expect(computeMa10([10, 20])).toEqual([10, 15]);
    expect(computeMa10([1, 2])).toEqual([1, 2]); // round(1.5)=2
  });

  it("keeps a flat series flat", () => {
    expect(computeMa10(Array(15).fill(7))).toEqual(Array(15).fill(7));
  });

  it("uses a trailing window of exactly 10 once available", () => {
    const closes = Array.from({ length: 12 }, (_, i) => (i + 1) * 2); // 2..24
    const out = computeMa10(closes);
    // i=10 → mean(closes[1..10]) = mean(4..22) = 13；i=11 → mean(6..24) = 15。
    expect(out[10]).toBe(13);
    expect(out[11]).toBe(15);
    // i=9 → mean(closes[0..9]) = mean(2..20) = 11。
    expect(out[9]).toBe(11);
  });
});

describe("supportResistance", () => {
  it("returns rounded max/min of closes", () => {
    const pts = [
      point({ close: 20 }),
      point({ close: 80 }),
      point({ close: 55 }),
    ];
    expect(supportResistance(pts)).toEqual({ r: 80, s: 20 });
  });

  it("clamps r to 96 and s to 4", () => {
    const pts = [point({ close: 99 }), point({ close: 1 })];
    expect(supportResistance(pts)).toEqual({ r: 96, s: 4 });
  });

  it("returns null when fewer than 2 valid points", () => {
    expect(supportResistance([])).toBeNull();
    expect(supportResistance([point({ close: 50 })])).toBeNull();
  });

  it("returns null when r === s (degenerate flat series)", () => {
    const pts = [point({ close: 50 }), point({ close: 50 })];
    expect(supportResistance(pts)).toBeNull();
  });

  it("returns null when clamping inverts the lines (all closes at the top)", () => {
    // 全高位：r=min(96,98)=96 < s=max(4,97)=97 → 倒挂护栏拦下，不画线。
    const pts = [point({ close: 97 }), point({ close: 98 })];
    expect(supportResistance(pts)).toBeNull();
  });

  it("returns null when clamping inverts the lines (all closes at the bottom)", () => {
    // 全低位：r=min(96,2)=2 < s=max(4,1)=4 → 倒挂护栏拦下，不画线。
    const pts = [point({ close: 1 }), point({ close: 2 })];
    expect(supportResistance(pts)).toBeNull();
  });
});

describe("phaseKey", () => {
  it("maps ages to the 8 phases at exact artifact boundaries", () => {
    expect(phaseKey(0)).toBe("roots");
    expect(phaseKey(11)).toBe("roots");
    expect(phaseKey(12)).toBe("identity");
    expect(phaseKey(19)).toBe("identity");
    expect(phaseKey(20)).toBe("launch");
    expect(phaseKey(29)).toBe("launch");
    expect(phaseKey(30)).toBe("reset");
    expect(phaseKey(42)).toBe("reset");
    expect(phaseKey(43)).toBe("rebuild");
    expect(phaseKey(57)).toBe("rebuild");
    expect(phaseKey(58)).toBe("transition");
    expect(phaseKey(69)).toBe("transition");
    expect(phaseKey(70)).toBe("expansion");
    expect(phaseKey(87)).toBe("expansion");
    expect(phaseKey(88)).toBe("legacy");
    expect(phaseKey(99)).toBe("legacy");
  });
});

describe("headlineKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(headlineKey(point({ age: 50, close: 86 }))).toBe("highSupport");
    expect(headlineKey(point({ age: 50, close: 85, delta: 0 }))).toBe("mixed");
    expect(headlineKey(point({ age: 50, close: 22 }))).toBe("pressure");
    expect(headlineKey(point({ age: 50, close: 23, delta: 0 }))).toBe("mixed");
    expect(headlineKey(point({ age: 50, close: 50, delta: 16 }))).toBe(
      "breakout",
    );
    expect(headlineKey(point({ age: 50, close: 50, delta: 15 }))).toBe("mixed");
    expect(headlineKey(point({ age: 50, close: 50, delta: -16 }))).toBe(
      "reset",
    );
    expect(headlineKey(point({ age: 50, close: 50, delta: -15 }))).toBe(
      "mixed",
    );
    expect(headlineKey(point({ age: 17, close: 50, delta: 0 }))).toBe("roots");
    expect(headlineKey(point({ age: 18, close: 50, delta: 0 }))).toBe("mixed");
    expect(headlineKey(point({ age: 79, close: 50, delta: 0 }))).toBe(
      "lateExpansion",
    );
    expect(headlineKey(point({ age: 78, close: 50, delta: 0 }))).toBe("mixed");
  });

  it("is purely data-driven and respects branch priority order", () => {
    // current 短路已删（F4-5）：任意 age 都按数据分支判定，"你在这里"由面板 meta 行标注。
    expect(headlineKey(point({ age: 38, close: 90 }))).toBe("highSupport");
    // close 检查先于 delta 与 age。
    expect(headlineKey(point({ age: 17, close: 86, delta: 20 }))).toBe(
      "highSupport",
    );
    expect(headlineKey(point({ age: 17, close: 22, delta: -20 }))).toBe(
      "pressure",
    );
    // delta 检查先于 age。
    expect(headlineKey(point({ age: 17, close: 50, delta: 16 }))).toBe(
      "breakout",
    );
    expect(headlineKey(point({ age: 79, close: 50, delta: -16 }))).toBe(
      "reset",
    );
  });
});

describe("statusKey", () => {
  it("maps close at 72/34 boundaries", () => {
    expect(statusKey(point({ close: 72 }))).toBe("high");
    expect(statusKey(point({ close: 71 }))).toBe("mixed");
    expect(statusKey(point({ close: 34 }))).toBe("low");
    expect(statusKey(point({ close: 35 }))).toBe("mixed");
  });
});

describe("statusLabelKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(statusLabelKey(point({ close: 82, delta: 0 }))).toBe(
      "strongSupport",
    );
    expect(statusLabelKey(point({ close: 81, delta: 0 }))).toBe("greenlight");
    expect(statusLabelKey(point({ close: 72, delta: 0 }))).toBe("greenlight");
    expect(statusLabelKey(point({ close: 71, delta: 0 }))).toBe("balanced");
    expect(statusLabelKey(point({ close: 22, delta: 0 }))).toBe(
      "strongPressure",
    );
    expect(statusLabelKey(point({ close: 23, delta: 0 }))).toBe("caution");
    expect(statusLabelKey(point({ close: 34, delta: 0 }))).toBe("caution");
    expect(statusLabelKey(point({ close: 35, delta: 10 }))).toBe("recovery");
    expect(statusLabelKey(point({ close: 35, delta: 9 }))).toBe("balanced");
    expect(statusLabelKey(point({ close: 35, delta: -10 }))).toBe("adjustment");
    expect(statusLabelKey(point({ close: 35, delta: -9 }))).toBe("balanced");
  });

  it("close branches outrank delta branches", () => {
    expect(statusLabelKey(point({ close: 82, delta: -10 }))).toBe(
      "strongSupport",
    );
    expect(statusLabelKey(point({ close: 72, delta: -10 }))).toBe("greenlight");
    expect(statusLabelKey(point({ close: 22, delta: 10 }))).toBe(
      "strongPressure",
    );
    expect(statusLabelKey(point({ close: 34, delta: 10 }))).toBe("caution");
  });
});

describe("interpretationKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(interpretationKey(point({ close: 82, delta: 0 }))).toBe(
      "highRising",
    );
    expect(interpretationKey(point({ close: 82, delta: -1 }))).toBe(
      "highEasing",
    );
    expect(interpretationKey(point({ close: 81, delta: 0 }))).toBe("favorable");
    expect(interpretationKey(point({ close: 64, delta: 0 }))).toBe("favorable");
    expect(interpretationKey(point({ close: 63, delta: 0 }))).toBe("mixed");
    expect(interpretationKey(point({ close: 22, delta: 0 }))).toBe(
      "strongPressure",
    );
    expect(interpretationKey(point({ close: 23, delta: 0 }))).toBe("caution");
    expect(interpretationKey(point({ close: 34, delta: 0 }))).toBe("caution");
    expect(interpretationKey(point({ close: 35, delta: 12 }))).toBe("rebound");
    expect(interpretationKey(point({ close: 35, delta: 11 }))).toBe("mixed");
    expect(interpretationKey(point({ close: 35, delta: -12 }))).toBe(
      "pullback",
    );
    expect(interpretationKey(point({ close: 35, delta: -11 }))).toBe("mixed");
  });

  it("respects branch priority order", () => {
    expect(interpretationKey(point({ close: 82, delta: 12 }))).toBe(
      "highRising",
    );
    expect(interpretationKey(point({ close: 83, delta: -12 }))).toBe(
      "highEasing",
    );
    expect(interpretationKey(point({ close: 64, delta: 12 }))).toBe(
      "favorable",
    );
    expect(interpretationKey(point({ close: 22, delta: 12 }))).toBe(
      "strongPressure",
    );
  });
});

describe("eventHintKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(eventHintKey(point({ close: 82, delta: 0 }))).toBe("response");
    expect(eventHintKey(point({ close: 81, delta: 0 }))).toBe("pattern");
    expect(eventHintKey(point({ close: 30, delta: 0 }))).toBe("boundary");
    expect(eventHintKey(point({ close: 31, delta: 0 }))).toBe("pattern");
    expect(eventHintKey(point({ close: 50, delta: 12 }))).toBe("rebound");
    expect(eventHintKey(point({ close: 50, delta: 11 }))).toBe("pattern");
    expect(eventHintKey(point({ close: 50, delta: -12 }))).toBe("reprice");
    expect(eventHintKey(point({ close: 50, delta: -11 }))).toBe("pattern");
  });

  it("close branches outrank delta branches", () => {
    expect(eventHintKey(point({ close: 82, delta: -12 }))).toBe("response");
    expect(eventHintKey(point({ close: 30, delta: 12 }))).toBe("boundary");
  });
});

describe("adviceHintKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(adviceHintKey(point({ close: 82, delta: 0 }))).toBe("push");
    expect(adviceHintKey(point({ close: 81, delta: 0 }))).toBe("choose");
    expect(adviceHintKey(point({ close: 30, delta: 0 }))).toBe("protect");
    expect(adviceHintKey(point({ close: 31, delta: 0 }))).toBe("choose");
    expect(adviceHintKey(point({ close: 50, delta: 12 }))).toBe("structure");
    expect(adviceHintKey(point({ close: 50, delta: 11 }))).toBe("choose");
    expect(adviceHintKey(point({ close: 50, delta: -12 }))).toBe("subtract");
    expect(adviceHintKey(point({ close: 50, delta: -11 }))).toBe("choose");
  });

  it("close branches outrank delta branches", () => {
    expect(adviceHintKey(point({ close: 82, delta: -12 }))).toBe("push");
    expect(adviceHintKey(point({ close: 30, delta: 12 }))).toBe("protect");
  });
});

describe("watchHintKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(watchHintKey(point({ close: 82, delta: 0 }))).toBe("overreach");
    expect(watchHintKey(point({ close: 81, delta: 0 }))).toBe("drift");
    expect(watchHintKey(point({ close: 30, delta: 0 }))).toBe("fearDriven");
    expect(watchHintKey(point({ close: 31, delta: 0 }))).toBe("drift");
    expect(watchHintKey(point({ close: 50, delta: -1 }))).toBe("misreadReset");
    expect(watchHintKey(point({ close: 50, delta: 0 }))).toBe("drift");
  });

  it("close branches outrank the negative-delta branch", () => {
    expect(watchHintKey(point({ close: 82, delta: -5 }))).toBe("overreach");
    expect(watchHintKey(point({ close: 30, delta: -5 }))).toBe("fearDriven");
  });
});

describe("bestUseKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(bestUseKey(point({ close: 86, delta: 0 }))).toBe("act");
    expect(bestUseKey(point({ close: 85, delta: 0 }))).toBe("observe");
    expect(bestUseKey(point({ close: 22, delta: 0 }))).toBe("simplify");
    expect(bestUseKey(point({ close: 23, delta: 0 }))).toBe("observe");
    expect(bestUseKey(point({ close: 50, delta: 13 }))).toBe("convert");
    expect(bestUseKey(point({ close: 50, delta: 12 }))).toBe("observe");
    expect(bestUseKey(point({ close: 50, delta: -13 }))).toBe("exit");
    expect(bestUseKey(point({ close: 50, delta: -12 }))).toBe("observe");
  });

  it("close branches outrank delta branches", () => {
    expect(bestUseKey(point({ close: 86, delta: -13 }))).toBe("act");
    expect(bestUseKey(point({ close: 22, delta: 13 }))).toBe("simplify");
  });
});

describe("watchOutKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(watchOutKey(point({ close: 22, delta: 0 }))).toBe("fearCost");
    expect(watchOutKey(point({ close: 23, delta: 0 }))).toBe("vagueness");
    expect(watchOutKey(point({ close: 86, delta: 0 }))).toBe("overconfident");
    expect(watchOutKey(point({ close: 85, delta: -1 }))).toBe(
      "resetNotFailure",
    );
    expect(watchOutKey(point({ close: 50, delta: 0 }))).toBe("vagueness");
  });

  it("low-close outranks high-close outranks negative delta", () => {
    expect(watchOutKey(point({ close: 22, delta: -5 }))).toBe("fearCost");
    expect(watchOutKey(point({ close: 86, delta: -5 }))).toBe("overconfident");
  });
});

describe("trendKey", () => {
  it("hits each branch at its exact boundary", () => {
    expect(trendKey(point({ close: 76, delta: 0 }))).toBe("support");
    expect(trendKey(point({ close: 75, delta: 0 }))).toBe("mixed");
    expect(trendKey(point({ close: 32, delta: 0 }))).toBe("pressure");
    expect(trendKey(point({ close: 33, delta: 0 }))).toBe("mixed");
    expect(trendKey(point({ close: 50, delta: 11 }))).toBe("rising");
    expect(trendKey(point({ close: 50, delta: 10 }))).toBe("mixed");
    expect(trendKey(point({ close: 50, delta: -11 }))).toBe("reset");
    expect(trendKey(point({ close: 50, delta: -10 }))).toBe("mixed");
  });

  it("close branches outrank delta branches", () => {
    expect(trendKey(point({ close: 76, delta: -11 }))).toBe("support");
    expect(trendKey(point({ close: 32, delta: 11 }))).toBe("pressure");
  });
});

describe("cycleCueKey", () => {
  it("prefers a real marker within ±1 year over the age table", () => {
    expect(cycleCueKey(30, [marker("outer-square", 30)])).toBe("midlife");
    expect(cycleCueKey(30, [marker("jupiter-return", 30)])).toBe(
      "jupiterReturn",
    );
    expect(cycleCueKey(30, [marker("saturn-return", 29.8)])).toBe(
      "saturnReturn",
    );
  });

  it("hits exactly at |Δage| = 1 and misses beyond", () => {
    expect(cycleCueKey(51, [marker("jupiter-return", 50)])).toBe(
      "jupiterReturn",
    );
    expect(cycleCueKey(52, [marker("jupiter-return", 50)])).toBe("window");
  });

  it("resolves multiple hits by fixed type priority", () => {
    expect(
      cycleCueKey(30, [
        marker("jupiter-return", 30),
        marker("saturn-return", 30),
      ]),
    ).toBe("saturnReturn");
    expect(
      cycleCueKey(41, [
        marker("outer-square", 41),
        marker("outer-opposition", 41),
      ]),
    ).toBe("uranusOpposition");
    expect(
      cycleCueKey(19, [
        marker("outer-opposition", 19),
        marker("nodal-return", 19),
      ]),
    ).toBe("nodalReturn");
  });

  it("skips markers without a finite age", () => {
    expect(cycleCueKey(50, [marker("saturn-return", undefined)])).toBe(
      "window",
    );
  });

  it("falls back to the artifact age table when no marker hits", () => {
    expect(cycleCueKey(29, [])).toBe("saturnReturn");
    expect(cycleCueKey(31, [])).toBe("saturnReturn");
    expect(cycleCueKey(28, [])).toBe("window");
    expect(cycleCueKey(40, [])).toBe("midlife");
    expect(cycleCueKey(43, [])).toBe("midlife");
    expect(cycleCueKey(44, [])).toBe("window");
    for (const a of [12, 24, 36, 48, 60, 72, 84, 96]) {
      expect(cycleCueKey(a, [])).toBe("jupiterReturn");
    }
    for (const a of [18, 19, 37, 38, 56, 57]) {
      expect(cycleCueKey(a, [])).toBe("nodalReturn");
    }
    expect(cycleCueKey(25, [])).toBe("window");
  });
});

describe("moduleState", () => {
  it("maps activation at 66/33 boundaries", () => {
    expect(moduleState(point({ close: 66 })).activation).toBe("intense");
    expect(moduleState(point({ close: 65 })).activation).toBe("active");
    expect(moduleState(point({ close: 33 })).activation).toBe("active");
    expect(moduleState(point({ close: 32 })).activation).toBe("quiet");
  });

  it("maps lean at the ±3 harmony-tension boundary", () => {
    expect(moduleState(point({ harmony: 10, tension: 6 })).lean).toBe("flow");
    expect(moduleState(point({ harmony: 9, tension: 6 })).lean).toBe("mixed");
    expect(moduleState(point({ harmony: 6, tension: 10 })).lean).toBe(
      "friction",
    );
    expect(moduleState(point({ harmony: 6, tension: 9 })).lean).toBe("mixed");
    expect(moduleState(point({ harmony: 0, tension: 0 })).lean).toBe("mixed");
  });
});

describe("moduleTierKey", () => {
  it("maps close at the 70/35 boundaries", () => {
    expect(moduleTierKey(70)).toBe("high");
    expect(moduleTierKey(69)).toBe("mid");
    expect(moduleTierKey(35)).toBe("low");
    expect(moduleTierKey(36)).toBe("mid");
  });
});

describe("modulesInFocus", () => {
  it("maps each natal body to its affinity modules", () => {
    expect(modulesInFocus([aspect("Venus")])).toEqual(["love", "money"]);
    expect(modulesInFocus([aspect("Moon")])).toEqual(["love", "self", "home"]);
    expect(modulesInFocus([aspect("Sun")])).toEqual(["self", "work"]);
    expect(modulesInFocus([aspect("North Node")])).toEqual(["self"]);
    expect(modulesInFocus([aspect("Saturn")])).toEqual(["work", "money"]);
    expect(modulesInFocus([aspect("Mars")])).toEqual(["work", "energy"]);
    expect(modulesInFocus([aspect("Jupiter")])).toEqual(["money"]);
  });

  it("dedupes and returns modules in the fixed order", () => {
    expect(modulesInFocus([aspect("Mars"), aspect("Venus")])).toEqual([
      "love",
      "work",
      "money",
      "energy",
    ]);
    expect(modulesInFocus([aspect("Venus"), aspect("Moon")])).toEqual([
      "love",
      "self",
      "money",
      "home",
    ]);
  });

  it("returns [] for empty input or unmatched bodies", () => {
    expect(modulesInFocus([])).toEqual([]);
    expect(modulesInFocus([aspect("Pluto")])).toEqual([]);
  });

  it("only matches natalBody, never transitBody", () => {
    const a: TimelineCandleAspect = {
      ...aspect("Pluto"),
      transitBody: "Venus",
    };
    expect(modulesInFocus([a])).toEqual([]);
  });
});

describe("pickBubbles", () => {
  const allAges = Array.from({ length: 100 }, (_, i) => i);

  it("picks currentAge + all saturn returns + first uranus opposition with v7 colors", () => {
    const bubbles = pickBubbles(
      [
        marker("saturn-return", 29),
        marker("saturn-return", 59),
        marker("saturn-return", 88),
        marker("outer-opposition", 42),
      ],
      pointsAtAges(allAges),
      34,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([29, 34, 42, 59, 88]);
    expect(bubbles.map((b) => b.color)).toEqual([
      "var(--lk-red)",
      "var(--lk-ink-dark)",
      "var(--lk-blue)",
      "var(--lk-red)",
      "var(--lk-red)",
    ]);
    expect(bubbles.map((b) => b.label)).toEqual([
      "2017",
      "2022",
      "2030",
      "2047",
      "2076",
    ]);
  });

  it("alternates sides starting above=true in age order (adjacent bubbles always opposite)", () => {
    const bubbles = pickBubbles(
      [
        marker("saturn-return", 29),
        marker("saturn-return", 59),
        marker("saturn-return", 88),
        marker("outer-opposition", 42),
      ],
      pointsAtAges(allAges),
      34,
      1988,
    );
    expect(bubbles.map((b) => b.above)).toEqual([
      true,
      false,
      true,
      false,
      true,
    ]);
    // |Δage|<8 的相邻对（29 与 34）必须异侧。
    expect(bubbles[0].above).not.toBe(bubbles[1].above);
  });

  it("drops the lowest-priority candidate (uranus opp) when over 5", () => {
    const bubbles = pickBubbles(
      [
        marker("saturn-return", 29),
        marker("saturn-return", 59),
        marker("saturn-return", 88),
        marker("saturn-return", 95),
        marker("outer-opposition", 42),
      ],
      pointsAtAges(allAges),
      34,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([29, 34, 59, 88, 95]);
    expect(bubbles.some((b) => b.color === "var(--lk-blue)")).toBe(false);
  });

  it("drops the highest-age saturn return before earlier ones when over 5", () => {
    const bubbles = pickBubbles(
      [
        marker("saturn-return", 29),
        marker("saturn-return", 59),
        marker("saturn-return", 88),
        marker("saturn-return", 95),
        marker("saturn-return", 97),
      ],
      pointsAtAges(allAges),
      10,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([10, 29, 59, 88, 95]);
  });

  it("merges a marker at currentAge into the single dark bubble", () => {
    const bubbles = pickBubbles(
      [marker("saturn-return", 34)],
      pointsAtAges(allAges),
      34,
      1988,
    );
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]).toEqual({
      age: 34,
      label: "2022",
      color: "var(--lk-ink-dark)",
      above: true,
    });
  });

  it("keeps SR over opp when two markers share an age", () => {
    const bubbles = pickBubbles(
      [marker("outer-opposition", 42), marker("saturn-return", 42)],
      pointsAtAges(allAges),
      10,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([10, 42]);
    expect(bubbles[1].color).toBe("var(--lk-red)");
  });

  it("rounds marker ages and discards out-of-range or ageless markers", () => {
    const bubbles = pickBubbles(
      [
        marker("saturn-return", 29.4),
        marker("saturn-return", -3),
        marker("saturn-return", 104),
        marker("saturn-return", 99.6),
        marker("saturn-return", undefined),
      ],
      pointsAtAges(allAges),
      10,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([10, 29]);
  });

  it("takes the first valid uranus opposition only", () => {
    const bubbles = pickBubbles(
      [
        marker("outer-opposition", 120),
        marker("outer-opposition", 42),
        marker("outer-opposition", 70),
      ],
      pointsAtAges(allAges),
      10,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([10, 42]);
    expect(bubbles[1].color).toBe("var(--lk-blue)");
  });

  it("drops candidates whose age has no rendered point", () => {
    const bubbles = pickBubbles(
      [marker("saturn-return", 50)],
      pointsAtAges([10, 11, 12]),
      10,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([10]);
  });

  it("drops the currentAge bubble when currentAge is outside 0-99", () => {
    const bubbles = pickBubbles(
      [marker("saturn-return", 29)],
      pointsAtAges(allAges),
      105,
      1988,
    );
    expect(bubbles.map((b) => b.age)).toEqual([29]);
  });

  it("returns [] when nothing is pickable", () => {
    expect(pickBubbles([], [], 34, 1988)).toEqual([]);
  });
});

describe("clampTooltip", () => {
  it("offsets right of the cursor and above by 80 in the normal case", () => {
    expect(clampTooltip(100, 300, 430, 430, 1920, 1080)).toEqual({
      left: 118,
      top: 220,
    });
  });

  it("flips to the left of the cursor at the right edge", () => {
    expect(clampTooltip(1600, 300, 430, 430, 1920, 1080)).toEqual({
      left: 1152,
      top: 220,
    });
  });

  it("clamps to the left margin after a flip goes negative", () => {
    const { left } = clampTooltip(300, 300, 430, 430, 600, 1080);
    expect(left).toBe(14);
  });

  it("clamps to the bottom edge", () => {
    const { top } = clampTooltip(100, 1000, 430, 430, 1920, 1080);
    expect(top).toBe(1080 - 430 - 14);
  });

  it("never goes above the top margin", () => {
    expect(clampTooltip(100, 20, 430, 430, 1920, 1080).top).toBe(14);
    // 视口比 tooltip 还矮时也钉在 14。
    expect(clampTooltip(100, 200, 430, 430, 1920, 300).top).toBe(14);
  });
});

describe("xForAge / yForValue", () => {
  it("maps ages linearly onto the chart x range", () => {
    expect(xForAge(0)).toBe(CHART.left);
    expect(xForAge(MAX_AGE)).toBe(CHART.right);
    expect(xForAge(49.5)).toBeCloseTo(74 + 0.5 * (1432 - 74), 10);
  });

  it("maps values 0-100 inverted onto the chart y range", () => {
    expect(yForValue(0)).toBe(CHART.bottom);
    expect(yForValue(100)).toBe(CHART.top);
    expect(yForValue(50)).toBe(540 - 0.5 * (540 - 70));
  });
});
