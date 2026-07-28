// INPUT: types.ts 的 TimelineCandle/TimelineCandleAspect/TimelineMarker（纯类型依赖，无运行时上游）。
// OUTPUT: lifekline 测试共享工厂——installPointerEventPolyfill（jsdom PointerEvent 补齐）、makeAspect、
//         makeCandle（age 或 date 首参）、makeLifeCandles（100 根 age 0-99，可按年指定 topAspects）、makeLifeMarkers。
// POS: tests/unit/helpers 的 lifekline 域工具，去重 lifekline-section / timeline-page-life / lifekline-derived
//      三文件各造一套的工厂；默认值变更会影响全部消费测试，务必同步本头注释与本目录 FOLDER.md。

import type {
  TimelineCandle,
  TimelineCandleAspect,
  TimelineMarker,
} from "../../../types";

/**
 * jsdom 缺 PointerEvent 构造器时以 MouseEvent 为底 polyfill（clientX/Y 由
 * MouseEvent 承担，pointerType/pointerId/isPrimary 手动挂）。node 环境或已有
 * 原生实现时为 no-op，幂等可重复调用。
 */
export function installPointerEventPolyfill(): void {
  if (typeof window === "undefined") return;
  if (typeof window.PointerEvent !== "undefined") return;
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "";
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  (
    window as unknown as { PointerEvent: typeof PointerEventPolyfill }
  ).PointerEvent = PointerEventPolyfill;
}

/** topAspects 项工厂：默认 Saturn trine <natalBody>，`over` 覆盖任意字段。 */
export const makeAspect = (
  natalBody: string,
  over: Partial<TimelineCandleAspect> = {},
): TimelineCandleAspect => ({
  episodeId: `ep-${natalBody}`,
  transitBody: "Saturn",
  natalBody,
  type: "trine",
  phase: "applying",
  ...over,
});

/**
 * 蜡烛工厂：首参为 age（number，含 undefined/NaN 供丢弃分支测试）或 date（string）。
 * intensity 默认随 age 变化（30 + age % 40），无有效 age 时取 40；`over` 覆盖任意字段。
 */
export const makeCandle = (
  ageOrDate?: number | string,
  over: Partial<TimelineCandle> = {},
): TimelineCandle => {
  const age = typeof ageOrDate === "number" ? ageOrDate : over.age;
  const date = typeof ageOrDate === "string" ? ageOrDate : over.date;
  const intensityAge =
    typeof age === "number" && Number.isFinite(age) ? age : 10;
  return {
    date,
    age,
    start: 40,
    peak: 60,
    dip: 30,
    end: 50,
    intensity: 30 + (intensityAge % 40),
    harmony: 20,
    tension: 15,
    dominantPhase: "applying",
    dataQuality: "ok",
    sampleCount: 5,
    topAspects: [],
    ...over,
  };
};

/** 100 根 age 0-99 的人生蜡烛；`topAspectsByAge` 按年龄注入指定 topAspects。 */
export const makeLifeCandles = (
  topAspectsByAge: Record<number, TimelineCandleAspect[]> = {},
): TimelineCandle[] =>
  Array.from({ length: 100 }, (_, age) =>
    makeCandle(
      age,
      topAspectsByAge[age] ? { topAspects: topAspectsByAge[age] } : {},
    ),
  );

/** 标准 life marker 组：SR@29 + Uranus opp@42。每次调用返回全新数组（防跨测试 mutate）。 */
export const makeLifeMarkers = (): TimelineMarker[] => [
  { age: 29, type: "saturn-return", label: "Saturn Return" },
  { age: 42, type: "outer-opposition", label: "Uranus Opposition" },
];
