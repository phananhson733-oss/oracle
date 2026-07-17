// INPUT: ./lifeArc.js（buildLifeTimeline / detectReturnMarkers / MAX_LIFE_CANDLES）、./weights.js（TIMELINE_ALGO_VERSION），mock ../ephemeris.js 与 ../../cache/redis.js（合成慢速星历 + 空缓存，绝不触 swisseph / Redis）。
// OUTPUT: 人生 K 线后端契约 pin 测试 —— 蜡烛数量与年龄轴、无 domainScores、周期标记近似回归、contract 语义、topAspects 形状、结果级缓存（命中免重算 / partial 不落缓存 / 键含 algo version + birth 哈希无明文）。
// POS: 前端 life 模式呈现层（人生 K 线 v7）全部数据假设的钉子；后端行为变更破坏任一契约时本套件必须先红。

import { describe, it, expect, vi } from "vitest";
import type { BirthInput } from "../../types/api.js";
import type { TimelineMarkerType } from "../../types/timeline.js";
import { cacheService } from "../../cache/redis.js";
import { ephemerisService } from "../ephemeris.js";
import { TIMELINE_ALGO_VERSION } from "./weights.js";

// 合成慢速星历：各 transit 体按平均日行速率线性游走（与真实轨道周期同阶），
// 保证跨百年采样能周期性成相、产出非零强度与 topAspects，且完全确定性。
vi.mock("../ephemeris.js", () => {
  const DAY_MS = 86_400_000;
  const EPOCH_MS = Date.UTC(1990, 0, 1);
  const RATES: Record<string, number> = {
    Jupiter: 360 / (11.862 * 365.25),
    Saturn: 360 / (29.46 * 365.25),
    Uranus: 360 / (84.011 * 365.25),
    Neptune: 360 / (164.8 * 365.25),
    Pluto: 360 / (248.0 * 365.25),
    "North Node": -360 / (18.6 * 365.25),
  };
  const BASE: Record<string, number> = {
    Jupiter: 15,
    Saturn: 100,
    Uranus: 200,
    Neptune: 280,
    Pluto: 320,
    "North Node": 40,
  };
  const lonAt = (body: string, date: Date): number => {
    const days = (date.getTime() - EPOCH_MS) / DAY_MS;
    const raw = (BASE[body] ?? 0) + (RATES[body] ?? 0) * days;
    return ((raw % 360) + 360) % 360;
  };
  const natalPositions = [
    { name: "Sun", sign: "Gemini", degree: 24, minute: 0, isRetrograde: false },
    {
      name: "Moon",
      sign: "Libra",
      degree: 10,
      minute: 30,
      isRetrograde: false,
    },
    {
      name: "Mercury",
      sign: "Cancer",
      degree: 5,
      minute: 0,
      isRetrograde: false,
    },
    {
      name: "Venus",
      sign: "Taurus",
      degree: 18,
      minute: 0,
      isRetrograde: false,
    },
    { name: "Mars", sign: "Aries", degree: 2, minute: 0, isRetrograde: false },
    {
      name: "Jupiter",
      sign: "Cancer",
      degree: 12,
      minute: 0,
      isRetrograde: false,
    },
    {
      name: "Saturn",
      sign: "Capricorn",
      degree: 20,
      minute: 0,
      isRetrograde: true,
    },
    {
      name: "Uranus",
      sign: "Capricorn",
      degree: 8,
      minute: 0,
      isRetrograde: true,
    },
    {
      name: "Neptune",
      sign: "Capricorn",
      degree: 13,
      minute: 0,
      isRetrograde: true,
    },
    {
      name: "Pluto",
      sign: "Scorpio",
      degree: 15,
      minute: 0,
      isRetrograde: true,
    },
    {
      name: "North Node",
      sign: "Aquarius",
      degree: 10,
      minute: 0,
      isRetrograde: false,
    },
  ];
  return {
    ephemerisService: {
      calculateNatalChart: vi.fn(async () => ({
        positions: natalPositions,
        aspects: [],
        dominance: {
          elements: { fire: 1, earth: 4, air: 3, water: 3 },
          modalities: { cardinal: 5, fixed: 3, mutable: 3 },
        },
      })),
      getLongitudes: vi.fn(async (bodies: string[], date: Date) => ({
        longitudes: Object.fromEntries(bodies.map((b) => [b, lonAt(b, date)])),
        speeds: {},
        usedMockFallback: false,
        mockedPlanets: [],
      })),
    },
  };
});

// 空缓存：get 恒 miss、set 空操作 —— 每次都走真实装配路径。
vi.mock("../../cache/redis.js", () => ({
  cacheService: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined),
  },
}));

const { buildLifeTimeline, detectReturnMarkers, MAX_LIFE_CANDLES } =
  await import("./lifeArc.js");

const birth: BirthInput = {
  date: "1990-06-15",
  time: "08:00",
  city: "Test City",
  lat: 40.7,
  lon: -74.0,
  timezone: "America/New_York",
  accuracy: "exact",
};

const result = await buildLifeTimeline(birth, 0, 99, "America/New_York");

const MARKER_TYPES: readonly TimelineMarkerType[] = [
  "saturn-return",
  "jupiter-return",
  "nodal-return",
  "outer-square",
  "outer-opposition",
];

describe("life arc contract: candle count and age axis", () => {
  it("returns exactly 100 candles for ages 0-99", () => {
    expect(result.candles.length).toBe(100);
  });

  it("ages run 0..99 strictly ascending with no gaps", () => {
    result.candles.forEach((c, i) => {
      expect(c.age).toBe(i);
    });
  });

  it("every candle field is a finite number within 0-100", () => {
    for (const c of result.candles) {
      for (const v of [
        c.start,
        c.peak,
        c.dip,
        c.end,
        c.intensity,
        c.harmony,
        c.tension,
      ]) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("life arc contract: no domainScores", () => {
  it("domainScores stays undefined (frontend qualitative module cards rely on this)", () => {
    expect(result.domainScores).toBeUndefined();
  });
});

describe("life arc contract: return markers over a 0-99 lifespan", () => {
  const markers = detectReturnMarkers(99);

  it("emits exactly three Saturn returns near ages 29 / 59 / 88 (tolerance 1)", () => {
    const ages = markers
      .filter((m) => m.type === "saturn-return")
      .map((m) => m.age ?? Number.NaN)
      .sort((a, b) => a - b);
    expect(ages.length).toBe(3);
    const expected = [29, 59, 88];
    ages.forEach((age, i) => {
      expect(Math.abs(age - expected[i])).toBeLessThanOrEqual(1);
    });
  });

  it("emits the Uranus opposition near age 42 (tolerance 1)", () => {
    const uranus = markers.filter((m) => m.type === "outer-opposition");
    expect(uranus.length).toBeGreaterThanOrEqual(1);
    expect(Math.abs((uranus[0].age ?? Number.NaN) - 42)).toBeLessThanOrEqual(1);
  });

  it("emits several Jupiter returns and nodal returns", () => {
    expect(markers.some((m) => m.type === "jupiter-return")).toBe(true);
    expect(markers.some((m) => m.type === "nodal-return")).toBe(true);
  });

  it("every marker has an age within 0-99, a non-empty label, and a known type", () => {
    expect(markers.length).toBeGreaterThan(0);
    for (const m of markers) {
      expect(m.age).toBeGreaterThanOrEqual(0);
      expect(m.age).toBeLessThanOrEqual(99);
      expect(typeof m.label).toBe("string");
      expect(m.label.length).toBeGreaterThan(0);
      expect(MARKER_TYPES).toContain(m.type);
    }
  });
});

describe("life arc contract: MAX_LIFE_CANDLES", () => {
  it("exports exactly 100", () => {
    expect(MAX_LIFE_CANDLES).toBe(100);
  });
});

describe("life arc contract: candle contract semantics", () => {
  it("declares interval-summary semantics (not financial OHLC)", () => {
    expect(result.contract.semantics).toBe("interval-summary");
  });
});

describe("life arc contract: topAspects shape", () => {
  it("every candle carries a topAspects array whose items expose transitBody/natalBody/type", () => {
    for (const c of result.candles) {
      expect(Array.isArray(c.topAspects)).toBe(true);
      for (const a of c.topAspects) {
        expect(typeof a.transitBody).toBe("string");
        expect(a.transitBody.length).toBeGreaterThan(0);
        expect(typeof a.natalBody).toBe("string");
        expect(a.natalBody.length).toBeGreaterThan(0);
        expect(typeof a.type).toBe("string");
        expect(a.type.length).toBeGreaterThan(0);
      }
    }
  });

  it("at least one candle exposes a non-empty topAspects list (affinity mapping stays exercised)", () => {
    expect(result.candles.some((c) => c.topAspects.length > 0)).toBe(true);
  });
});

describe("life arc contract: canonical body names in topAspects", () => {
  // 前端 MODULE_AFFINITY（components/timeline/lifekline/lifeKlineDerived.ts）按精确字符串
  // 匹配 natalBody；命名漂移（"NorthNode"/"north node"/缩写）会让 In-focus 徽章静默失效。
  const CANONICAL_BODIES: ReadonlySet<string> = new Set([
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
    "North Node",
  ]);

  it("every topAspects natalBody/transitBody belongs to the canonical body-name set", () => {
    for (const c of result.candles) {
      for (const a of c.topAspects) {
        expect(
          CANONICAL_BODIES.has(a.natalBody),
          `unexpected natalBody "${a.natalBody}" at age ${c.age}`,
        ).toBe(true);
        expect(
          CANONICAL_BODIES.has(a.transitBody),
          `unexpected transitBody "${a.transitBody}" at age ${c.age}`,
        ).toBe(true);
      }
    }
  });
});

describe("life arc contract: result-level markers", () => {
  it("buildLifeTimeline(0,99) returns non-empty markers, all inside fromAge..toAge", () => {
    expect(result.markers.length).toBeGreaterThan(0);
    for (const m of result.markers) {
      expect(m.age).toBeGreaterThanOrEqual(0);
      expect(m.age).toBeLessThanOrEqual(99);
    }
  });

  it("result.markers carries the Saturn-return triple (≈29/59/88, tolerance 1)", () => {
    const srAges = result.markers
      .filter((m) => m.type === "saturn-return")
      .map((m) => m.age ?? Number.NaN)
      .sort((a, b) => a - b);
    expect(srAges.length).toBe(3);
    const expected = [29, 59, 88];
    srAges.forEach((age, i) => {
      expect(Math.abs(age - expected[i])).toBeLessThanOrEqual(1);
    });
  });
});

describe("life arc contract: result-level cache (birth-hash)", () => {
  const RESULT_KEY_PREFIX = "transit:lifearc:result:";
  const mockedGet = cacheService.get as unknown as ReturnType<typeof vi.fn>;
  const mockedSet = cacheService.set as unknown as ReturnType<typeof vi.fn>;
  const mockedLongitudes =
    ephemerisService.getLongitudes as unknown as ReturnType<typeof vi.fn>;
  const mockedNatal =
    ephemerisService.calculateNatalChart as unknown as ReturnType<typeof vi.fn>;

  const resultSetCalls = () =>
    mockedSet.mock.calls.filter(([key]) =>
      String(key).startsWith(RESULT_KEY_PREFIX),
    );

  it("writes the assembled result to cache once with the 30-day TTL", () => {
    // 模块顶层的 buildLifeTimeline(0,99) 冷路径应恰好写入一次结果级缓存。
    const calls = resultSetCalls();
    expect(calls.length).toBe(1);
    const [, value, ttl] = calls[0];
    expect(ttl).toBe(30 * 24 * 60 * 60);
    expect(value.candles.length).toBe(100);
    expect(value.contract.semantics).toBe("interval-summary");
  });

  it("cache key embeds algo version + SHA-256 digest and never leaks birth data plaintext", () => {
    const [key] = resultSetCalls()[0];
    const escapedVersion = TIMELINE_ALGO_VERSION.replace(/\./g, "\\.");
    expect(key).toMatch(
      new RegExp(
        `^transit:lifearc:result:[0-9a-f]{64}:0-99:${escapedVersion}$`,
      ),
    );
    expect(key).not.toContain(birth.date);
    expect(key).not.toContain(birth.time as string);
    expect(key).not.toContain(birth.city);
  });

  it("serves an identical request from cache without recomputing the ephemeris", async () => {
    const [key, value] = resultSetCalls()[0];
    const longitudeCallsBefore = mockedLongitudes.mock.calls.length;
    const natalCallsBefore = mockedNatal.mock.calls.length;
    mockedGet.mockImplementation(async (k: string) =>
      k === key ? value : null,
    );
    try {
      const second = await buildLifeTimeline(birth, 0, 99, "America/New_York");
      expect(second).toEqual(value);
      expect(mockedLongitudes.mock.calls.length).toBe(longitudeCallsBefore);
      expect(mockedNatal.mock.calls.length).toBe(natalCallsBefore);
    } finally {
      mockedGet.mockImplementation(async () => null);
    }
  });

  it("cache key ignores the free-text city field (same coords → same key, cache hit)", async () => {
    // city 不参与坐标已解析后的星历计算：变体 city 文本不得铸出新键（无限灌缓存向量）。
    const [key, value] = resultSetCalls()[0];
    const longitudeCallsBefore = mockedLongitudes.mock.calls.length;
    mockedGet.mockImplementation(async (k: string) =>
      k === key ? value : null,
    );
    try {
      const otherCity = await buildLifeTimeline(
        { ...birth, city: "Completely Different City Text" },
        0,
        99,
        "America/New_York",
      );
      expect(otherCity).toEqual(value);
      expect(mockedLongitudes.mock.calls.length).toBe(longitudeCallsBefore);
    } finally {
      mockedGet.mockImplementation(async () => null);
    }
  });

  it("treats a malformed cached entry as a miss and recomputes the full contract", async () => {
    // 命中侧校验：根数不符/蜡烛缺字段的污染条目不得直接下发（会让前端在 topAspects.map 崩溃）。
    const malformedBirth: BirthInput = { ...birth, date: "1992-09-09" };
    mockedGet.mockImplementation(async (k: string) =>
      String(k).startsWith(RESULT_KEY_PREFIX) ? { candles: [{}] } : null,
    );
    try {
      const recomputed = await buildLifeTimeline(
        malformedBirth,
        0,
        99,
        "America/New_York",
      );
      expect(recomputed.candles.length).toBe(100);
      expect(recomputed.candles.every((c) => Number.isFinite(c.age))).toBe(
        true,
      );
    } finally {
      mockedGet.mockImplementation(async () => null);
    }
  });

  it("single-flight merges concurrent cold requests for the same birth into one computation", async () => {
    const coldBirth: BirthInput = { ...birth, date: "1993-11-21" };
    const natalCallsBefore = mockedNatal.mock.calls.length;
    const [first, second] = await Promise.all([
      buildLifeTimeline(coldBirth, 0, 99, "America/New_York"),
      buildLifeTimeline(coldBirth, 0, 99, "America/New_York"),
    ]);
    expect(first).toEqual(second);
    expect(mockedNatal.mock.calls.length).toBe(natalCallsBefore + 1);
  });

  it("skips the result cache write when any sampled year is partial (mock fallback)", async () => {
    const partialBirth: BirthInput = { ...birth, date: "1991-03-02" };
    const originalImpl = mockedLongitudes.getMockImplementation() as (
      bodies: string[],
      date: Date,
    ) => Promise<{
      longitudes: Record<string, number>;
      speeds: Record<string, number>;
      usedMockFallback: boolean;
      mockedPlanets: string[];
    }>;
    const setCallsBefore = mockedSet.mock.calls.length;
    // 非核心体（North Node）走 mock fallback：不触发 EPHEMERIS_UNAVAILABLE，但年份数据为 partial。
    mockedLongitudes.mockImplementation(
      async (bodies: string[], date: Date) => {
        const real = await originalImpl(bodies, date);
        return {
          ...real,
          usedMockFallback: true,
          mockedPlanets: ["North Node"],
        };
      },
    );
    try {
      const partial = await buildLifeTimeline(
        partialBirth,
        0,
        10,
        "America/New_York",
      );
      expect(partial.dataQuality).toBe("partial");
      const newResultWrites = mockedSet.mock.calls
        .slice(setCallsBefore)
        .filter(([key]) => String(key).startsWith(RESULT_KEY_PREFIX));
      expect(newResultWrites.length).toBe(0);
    } finally {
      mockedLongitudes.mockImplementation(originalImpl);
    }
  });
});
