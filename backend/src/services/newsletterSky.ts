// INPUT: ephemerisService.getPlanetPositions（按日采样世俗天象）+ PlanetPosition 类型。
// OUTPUT: detectPeriodEvents(纯函数：从逐日快照检测入座/逆行停滞/新满月/紧密相位事件) + buildPeriodSky(采样区间并产出 dated 事件流)。
// POS: 周报/月报「真实 dated 天象」计算层 —— 让 newsletter 内容像 Astrodienst 一样按日期列事件，而非让 AI 编日期。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { PlanetPosition } from "../types/api.js";
import { ephemerisService } from "./ephemeris.js";

const ZODIAC = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

// Moon is excluded from ingress/aspect detection: it changes sign every ~2.5
// days and aspects everything daily, which would drown out the meaningful slow
// movements. Lunations (new/full moon) are tracked separately.
const INGRESS_BODIES = [
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Chiron", // rare sign change (~every few years), but a headline event when it happens
];
// Stations only for bodies whose retrograde turns are clean + notable. Chiron is
// excluded: it moves so slowly that its retrograde flag flickers day-to-day near
// a station (numerical noise), and its stations are not newsworthy. Detection is
// debounced below so even the slow outer planets emit one clean station.
const STATION_BODIES = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];
const ASPECT_BODIES = [
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

// Aspects between two of these slow outer planets stay within orb for weeks or
// months — they are generational background, not a dated "event" for a given
// week/month. We skip any aspect where BOTH bodies are in this set (e.g.
// Neptune-Pluto, Uranus-Neptune), while keeping personal-planet contacts to them
// (e.g. Venus trine Saturn, Sun square Neptune), which DO have a clear peak date.
const OUTER_SLOW = new Set(["Uranus", "Neptune", "Pluto"]);

const ASPECTS: Array<{ name: string; verb: string; angle: number }> = [
  { name: "conjunction", verb: "meets", angle: 0 },
  { name: "sextile", verb: "sextiles", angle: 60 },
  { name: "square", verb: "squares", angle: 90 },
  { name: "trine", verb: "trines", angle: 120 },
  { name: "opposition", verb: "opposes", angle: 180 },
];

// How close (degrees) an aspect must perfect within the period to be reported.
const ASPECT_EXACT_ORB = 1.0;
// Wider window we track while searching for the perfection day.
const ASPECT_TRACK_ORB = 2.0;
const MAX_ASPECT_EVENTS = 8;

export interface DaySnapshot {
  date: string; // YYYY-MM-DD
  positions: PlanetPosition[];
}

export interface SkyEvent {
  date: string;
  type: "ingress" | "station" | "aspect";
  title: string;
  detail: string;
}

export interface MoonMoment {
  date: string;
  phase: string; // "New Moon" | "Full Moon"
  sign: string;
}

export interface PeriodSky {
  positions: Array<{ planet: string; sign: string; retrograde: boolean }>;
  events: SkyEvent[];
  moon_moments: MoonMoment[];
}

function absDegree(p: PlanetPosition): number {
  const signIdx = ZODIAC.indexOf(p.sign as (typeof ZODIAC)[number]);
  return (signIdx < 0 ? 0 : signIdx * 30) + p.degree + (p.minute ?? 0) / 60;
}

function byName(
  positions: PlanetPosition[],
  name: string,
): PlanetPosition | undefined {
  return positions.find((p) => p.name === name);
}

function elongation(positions: PlanetPosition[]): number | null {
  const moon = byName(positions, "Moon");
  const sun = byName(positions, "Sun");
  if (!moon || !sun) return null;
  return (absDegree(moon) - absDegree(sun) + 360) % 360;
}

// Pure detector: from an ordered list of daily snapshots, derive the dated
// ingress / station / lunation / tight-aspect events for the period.
export function detectPeriodEvents(days: DaySnapshot[]): {
  events: SkyEvent[];
  moon_moments: MoonMoment[];
} {
  const events: SkyEvent[] = [];
  const moon_moments: MoonMoment[] = [];

  // Ingress + station + lunation: compare each day to the previous.
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const cur = days[i];

    for (const body of INGRESS_BODIES) {
      const a = byName(prev.positions, body);
      const b = byName(cur.positions, body);
      if (a && b && a.sign !== b.sign) {
        events.push({
          date: cur.date,
          type: "ingress",
          title: `${body} enters ${b.sign}`,
          detail: "",
        });
      }
    }

    const ePrev = elongation(prev.positions);
    const eCur = elongation(cur.positions);
    const moonCur = byName(cur.positions, "Moon");
    if (ePrev !== null && eCur !== null && moonCur) {
      // New moon: elongation wraps through 0 (prev high, cur low).
      if (ePrev > 270 && eCur < 90) {
        moon_moments.push({
          date: cur.date,
          phase: "New Moon",
          sign: moonCur.sign,
        });
      } else if (ePrev < 180 && eCur >= 180) {
        // Full moon: elongation crosses 180 upward.
        moon_moments.push({
          date: cur.date,
          phase: "Full Moon",
          sign: moonCur.sign,
        });
      }
    }
  }

  // Stations: a per-body SUSTAINED retrograde flip. A genuine station holds the
  // new direction for >=2 days on each side; single-day flag flicker (numerical
  // noise on slow-moving bodies near a station) is ignored.
  for (const body of STATION_BODIES) {
    const states = days.map((d) => byName(d.positions, body)?.isRetrograde);
    for (let i = 1; i < states.length; i++) {
      const before = states[i - 1];
      const after = states[i];
      if (before === undefined || after === undefined || before === after)
        continue;
      const oldStable = i >= 2 && states[i - 2] === before;
      const newStable = i + 1 < states.length && states[i + 1] === after;
      if (!oldStable || !newStable) continue;
      events.push({
        date: days[i].date,
        type: "station",
        title: `${body} turns ${after ? "retrograde" : "direct"}`,
        detail: "",
      });
    }
  }

  // Aspects: scan every day, keep the tightest (perfection) day per pair+type.
  const tracker = new Map<
    string,
    { date: string; orb: number; title: string }
  >();
  for (const day of days) {
    for (let i = 0; i < ASPECT_BODIES.length; i++) {
      for (let j = i + 1; j < ASPECT_BODIES.length; j++) {
        const a = byName(day.positions, ASPECT_BODIES[i]);
        const b = byName(day.positions, ASPECT_BODIES[j]);
        if (!a || !b) continue;
        // Drop generational outer-outer aspects (no clear peak date in a period).
        if (
          OUTER_SLOW.has(ASPECT_BODIES[i]) &&
          OUTER_SLOW.has(ASPECT_BODIES[j])
        )
          continue;
        const raw = Math.abs(absDegree(a) - absDegree(b));
        const sep = raw > 180 ? 360 - raw : raw;
        for (const asp of ASPECTS) {
          const orb = Math.abs(sep - asp.angle);
          if (orb > ASPECT_TRACK_ORB) continue;
          const key = `${a.name}-${b.name}-${asp.name}`;
          const cur = tracker.get(key);
          if (!cur || orb < cur.orb) {
            tracker.set(key, {
              date: day.date,
              orb,
              title: `${a.name} ${asp.verb} ${b.name}`,
            });
          }
        }
      }
    }
  }

  const aspectEvents = [...tracker.values()]
    .filter((t) => t.orb < ASPECT_EXACT_ORB)
    .sort((x, y) => x.orb - y.orb)
    .slice(0, MAX_ASPECT_EVENTS)
    .map<SkyEvent>((t) => ({
      date: t.date,
      type: "aspect",
      title: t.title,
      detail: "",
    }));

  const all = [...events, ...aspectEvents].sort((x, y) =>
    x.date < y.date ? -1 : x.date > y.date ? 1 : 0,
  );
  return { events: all, moon_moments };
}

const SNAPSHOT_BODIES = new Set([
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
]);

// Days of padding sampled on each side of the period so an event on the very
// first/last day still has neighbours to confirm (a station needs days on both
// sides; an aspect needs to be seen separating). Events are filtered back to the
// real window before returning.
const SAMPLE_PAD_DAYS = 2;

const isoDay = (d: Date): string => d.toISOString().split("T")[0];

// Sample the sky once per day across [start, end] (+/- padding, noon UTC) and
// derive the dated event timeline + the opening-day snapshot. No birth data.
// Bodies that fall back to a mock position (e.g. an asteroid whose ephemeris file
// is absent) are stripped before detection — we never surface fabricated events
// (真实数据为默认；production 禁 mock).
export async function buildPeriodSky(
  start: Date,
  end: Date,
): Promise<PeriodSky> {
  const startIso = isoDay(start);
  const endIso = isoDay(end);

  const cursor = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() - SAMPLE_PAD_DAYS,
      12,
      0,
      0,
    ),
  );
  const last = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate() + SAMPLE_PAD_DAYS,
    12,
    0,
    0,
  );

  const rawDays: DaySnapshot[] = [];
  const mocked = new Set<string>();
  let guard = 0;
  while (cursor.getTime() <= last && guard < 46) {
    const { positions, mockedPlanets } =
      await ephemerisService.getPlanetPositions(new Date(cursor), 0, 0);
    for (const m of mockedPlanets ?? []) mocked.add(m);
    rawDays.push({ date: isoDay(cursor), positions });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }

  // Strip mock-fallback bodies so they never produce events/aspects.
  const days = rawDays.map((d) => ({
    date: d.date,
    positions: d.positions.filter((p) => !mocked.has(p.name)),
  }));

  const detected = detectPeriodEvents(days);
  const inWindow = (date: string): boolean =>
    date >= startIso && date <= endIso;
  const events = detected.events.filter((e) => inWindow(e.date));
  const moon_moments = detected.moon_moments.filter((m) => inWindow(m.date));

  // Snapshot from the period's opening day (first sampled day within the window).
  const openDay = days.find((d) => d.date >= startIso) ?? days[0];
  const snapshot = (openDay?.positions ?? [])
    .filter((p) => SNAPSHOT_BODIES.has(p.name))
    .map((p) => ({
      planet: p.name,
      sign: p.sign,
      retrograde: p.isRetrograde,
    }));

  return { positions: snapshot, events, moon_moments };
}
