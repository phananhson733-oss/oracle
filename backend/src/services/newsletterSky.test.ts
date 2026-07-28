// INPUT: newsletterSky.detectPeriodEvents（纯函数）+ 手造逐日快照。
// OUTPUT: vitest 套件，验证入座/逆行停滞/新满月/满月/紧密相位检测与 Moon 排除。
// POS: 周报/月报天象引擎单测；若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, vi, beforeEach } from "vitest";

// Controllable per-date ephemeris for the buildPeriodSky integration tests.
const mockGetPositions = vi.fn(
  (..._a: unknown[]): Promise<unknown> =>
    Promise.resolve({ positions: [], mockedPlanets: [] }),
);
vi.mock("./ephemeris.js", () => ({
  ephemerisService: {
    getPlanetPositions: (...a: unknown[]) => mockGetPositions(...a),
    calculateAspects: () => [],
  },
}));

import {
  detectPeriodEvents,
  buildPeriodSky,
  type DaySnapshot,
} from "./newsletterSky.js";

const pos = (
  name: string,
  sign: string,
  degree: number,
  isRetrograde = false,
) => ({
  name,
  sign,
  degree,
  minute: 0,
  isRetrograde,
});

describe("detectPeriodEvents", () => {
  it("detects ingress + sustained station + tight aspect, and excludes Moon ingress", () => {
    // 4 days: the station detector requires the retrograde flip to hold >=2 days
    // on each side, so Mercury is direct for 2 days then retrograde for 2 days.
    const days: DaySnapshot[] = [
      {
        date: "2026-06-01",
        positions: [
          pos("Sun", "Gemini", 29),
          pos("Mercury", "Taurus", 25, false),
          pos("Venus", "Cancer", 10),
          pos("Jupiter", "Cancer", 13),
          pos("Moon", "Scorpio", 0),
        ],
      },
      {
        date: "2026-06-02",
        positions: [
          pos("Sun", "Cancer", 0), // ingress (Gemini -> Cancer)
          pos("Mercury", "Taurus", 25, false),
          pos("Venus", "Cancer", 11),
          pos("Jupiter", "Cancer", 11.5), // Venus-Jupiter conjunction perfects (orb 0.5)
          pos("Moon", "Scorpio", 13),
        ],
      },
      {
        date: "2026-06-03",
        positions: [
          pos("Sun", "Cancer", 1),
          pos("Mercury", "Taurus", 25, true), // sustained station: direct,direct -> retro,retro
          pos("Venus", "Cancer", 12),
          pos("Jupiter", "Cancer", 11),
          pos("Moon", "Scorpio", 26),
        ],
      },
      {
        date: "2026-06-04",
        positions: [
          pos("Sun", "Cancer", 2),
          pos("Mercury", "Taurus", 24, true),
          pos("Venus", "Cancer", 13),
          pos("Jupiter", "Cancer", 10),
          pos("Moon", "Sagittarius", 9),
        ],
      },
    ];

    const { events, moon_moments } = detectPeriodEvents(days);
    const titles = events.map((e) => e.title);

    expect(titles).toContain("Sun enters Cancer");
    expect(titles).toContain("Mercury turns retrograde");
    expect(titles).toContain("Venus meets Jupiter");
    // Moon must never produce an ingress event.
    expect(titles.some((t) => t.startsWith("Moon enters"))).toBe(false);

    const ingress = events.find((e) => e.title === "Sun enters Cancer");
    expect(ingress?.date).toBe("2026-06-02");
    expect(ingress?.type).toBe("ingress");

    const station = events.find((e) => e.title === "Mercury turns retrograde");
    expect(station?.date).toBe("2026-06-03"); // the sustained flip day
    expect(station?.type).toBe("station");

    const aspect = events.find((e) => e.title === "Venus meets Jupiter");
    expect(aspect?.date).toBe("2026-06-02"); // perfection (tightest) day
    expect(aspect?.type).toBe("aspect");

    // No spurious lunation in this sequence.
    expect(moon_moments).toHaveLength(0);

    // Events are sorted ascending by date.
    const dates = events.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("ignores single-day retrograde-flag flicker (no spurious station)", () => {
    // Mercury direct,direct,RETRO(1-day blip),direct,direct — must NOT emit.
    const flick = (retro: boolean, date: string): DaySnapshot => ({
      date,
      positions: [pos("Mercury", "Taurus", 20, retro)],
    });
    const days = [
      flick(false, "2026-06-01"),
      flick(false, "2026-06-02"),
      flick(true, "2026-06-03"), // 1-day blip
      flick(false, "2026-06-04"),
      flick(false, "2026-06-05"),
    ];
    const { events } = detectPeriodEvents(days);
    expect(events.filter((e) => e.type === "station")).toHaveLength(0);
  });

  it("detects a New Moon when elongation wraps through 0", () => {
    const days: DaySnapshot[] = [
      {
        date: "2026-06-01",
        positions: [pos("Sun", "Aries", 0), pos("Moon", "Pisces", 20)], // elong 350
      },
      {
        date: "2026-06-02",
        positions: [pos("Sun", "Aries", 1), pos("Moon", "Aries", 6)], // elong ~5
      },
    ];
    const { moon_moments } = detectPeriodEvents(days);
    expect(moon_moments).toEqual([
      { date: "2026-06-02", phase: "New Moon", sign: "Aries" },
    ]);
  });

  it("detects a Full Moon when elongation crosses 180", () => {
    const days: DaySnapshot[] = [
      {
        date: "2026-06-10",
        positions: [pos("Sun", "Aries", 0), pos("Moon", "Virgo", 20)], // elong 170
      },
      {
        date: "2026-06-11",
        positions: [pos("Sun", "Aries", 1), pos("Moon", "Libra", 6)], // elong 185
      },
    ];
    const { moon_moments } = detectPeriodEvents(days);
    expect(moon_moments).toEqual([
      { date: "2026-06-11", phase: "Full Moon", sign: "Libra" },
    ]);
  });

  it("adds Chiron ingress and drops generational outer-outer aspects", () => {
    const days: DaySnapshot[] = [
      {
        date: "2026-06-18",
        positions: [
          pos("Neptune", "Aries", 0),
          pos("Pluto", "Gemini", 0), // Neptune sextile Pluto (outer-outer -> dropped)
          pos("Venus", "Virgo", 0), // Venus square Pluto (personal -> kept)
          pos("Chiron", "Aries", 29),
        ],
      },
      {
        date: "2026-06-19",
        positions: [
          pos("Neptune", "Aries", 1),
          pos("Pluto", "Gemini", 0),
          pos("Venus", "Virgo", 1),
          pos("Chiron", "Taurus", 0), // sign change
        ],
      },
    ];
    const { events } = detectPeriodEvents(days);
    const titles = events.map((e) => e.title);
    expect(titles).toContain("Chiron enters Taurus");
    expect(titles).toContain("Venus squares Pluto");
    // No generational outer-outer aspect should be emitted.
    expect(
      titles.some((t) => t.includes("Neptune") && t.includes("Pluto")),
    ).toBe(false);
  });
});

describe("buildPeriodSky", () => {
  beforeEach(() => {
    mockGetPositions.mockReset();
    // Per-date sky: Mercury stations retrograde on the window's LAST day (Jun 24),
    // Venus changes sign in the PADDING (Jun 21), and Chiron is a MOCK body that
    // changes sign inside the window (Jun 23).
    mockGetPositions.mockImplementation((date: unknown) => {
      const day = Number(
        (date as Date).toISOString().split("-")[2].slice(0, 2),
      );
      return Promise.resolve({
        positions: [
          {
            name: "Mercury",
            sign: "Cancer",
            degree: 10,
            minute: 0,
            isRetrograde: day >= 24,
          },
          {
            name: "Venus",
            sign: day <= 20 ? "Taurus" : "Gemini",
            degree: 5,
            minute: 0,
            isRetrograde: false,
          },
          {
            name: "Chiron",
            sign: day <= 22 ? "Aries" : "Taurus",
            degree: 0,
            minute: 0,
            isRetrograde: false,
          },
        ],
        mockedPlanets: ["Chiron"],
      });
    });
  });

  it("detects an edge station via padding, filters padding-only events, and strips mock bodies", async () => {
    const sky = await buildPeriodSky(
      new Date("2026-06-22T12:00:00Z"),
      new Date("2026-06-24T12:00:00Z"),
    );
    const titles = sky.events.map((e) => e.title);

    // Mercury stations on the LAST window day — only visible because we sample 2
    // padding days beyond the end to confirm the sustained flip.
    const station = sky.events.find((e) => e.type === "station");
    expect(station?.title).toBe("Mercury turns retrograde");
    expect(station?.date).toBe("2026-06-24");

    // Venus' ingress happened on Jun 21 (in the padding, before the window) -> dropped.
    expect(titles.some((t) => t.startsWith("Venus enters"))).toBe(false);

    // Chiron is a mock body -> stripped entirely, no fabricated ingress.
    expect(titles.some((t) => t.includes("Chiron"))).toBe(false);

    // Snapshot excludes the mock body too.
    expect(sky.positions.some((p) => p.planet === "Chiron")).toBe(false);
  });
});
