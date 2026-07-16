// INPUT: Birth date and optional time/location for Saturn Return calculation.
// OUTPUT: Natal Saturn position and Saturn Return date ranges with template interpretations.
// POS: Saturn Return calculator service; update this header and FOLDER.md if modified.

import { birthToUtcDate, ephemerisService } from "./ephemeris.js";
import type { BirthInput } from "../types/api.js";
import {
  findLocalMinimumBrackets,
  findSignChangeBrackets,
  normalizeSignedDegrees,
  refineMinimum,
  refineRoot,
  type TimedValue,
} from "./saturn-return-math.js";

export interface SaturnReturnInput {
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (optional)
  timezone?: string;
  lat?: number;
  lon?: number;
  city?: string;
}

export interface NatalSaturnInfo {
  sign: string;
  degree: number;
  minute: number;
  longitude: number; // absolute ecliptic longitude
}

export interface SaturnReturnPeriod {
  startDate: string; // ISO date string (when Saturn enters orb)
  endDate: string; // ISO date string (when Saturn leaves orb)
  exactPasses?: SaturnReturnPass[];
  estimatedClosestDate?: string;
  returnNumber: number; // 1st, 2nd, 3rd
  interpretation: string;
}

export interface SaturnReturnPass {
  occurredAt: string;
  direction: "direct" | "retrograde";
}

export type SaturnReturnPrecision = "estimated" | "exact";

export interface SaturnReturnResult {
  natalSaturn: NatalSaturnInfo;
  returns: SaturnReturnPeriod[];
  precision: SaturnReturnPrecision;
  /** @deprecated Use precision instead. Kept temporarily for existing clients. */
  approximate: boolean;
}

const SATURN_ORBITAL_PERIOD_YEARS = 29.46;
const SEARCH_ORB_DEGREES = 2;
const RETURN_SEARCH_STEP_MS = 14 * 24 * 60 * 60 * 1000;
const ROOT_TOLERANCE_MS = 60 * 1000;
const ROOT_DEDUPLICATION_MS = 12 * 60 * 60 * 1000;
const STATION_TOUCH_TOLERANCE_DEGREES = 0.0001;

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

// P0 fix: safe date offset that avoids setMonth overflow on month boundaries
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getUTCMonth() + months;
  d.setUTCMonth(targetMonth);
  // If day overflowed (e.g. Jan 31 + 1 month = Mar 3), clamp to last day of target month
  const expectedMonth = ((targetMonth % 12) + 12) % 12;
  if (d.getUTCMonth() !== expectedMonth) {
    d.setUTCDate(0); // go to last day of previous month
  }
  return d;
}

function validateDate(dateStr: string): Date {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("Invalid date.");
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }

  // P2 fix: detect month/day rollover (e.g. Feb 31 -> Mar 3)
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Invalid date.");
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (date > today) {
    throw new Error("Birth date cannot be in the future.");
  }

  return date;
}

function validateTime(timeStr: string): void {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("Invalid time format. Expected HH:mm.");
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time. Hours must be 0-23, minutes 0-59.");
  }
}

function validateCoordinates(lat?: number, lon?: number): void {
  if (lat !== undefined) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new Error("Invalid latitude. Must be between -90 and 90.");
    }
  }
  if (lon !== undefined) {
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new Error("Invalid longitude. Must be between -180 and 180.");
    }
  }
}

function getReturnInterpretation(returnNumber: number, sign: string): string {
  const ordinal =
    returnNumber === 1 ? "first" : returnNumber === 2 ? "second" : "third";

  const signDescriptions: Record<string, string> = {
    Aries:
      "Your Saturn Return in Aries calls you to define your identity with courage and authenticity. This is a time of bold self-assertion, where you learn to lead your own life without waiting for permission. Challenges may arise around independence and impulsiveness, but the reward is discovering who you truly are when you stop trying to please others.",
    Taurus:
      "Your Saturn Return in Taurus asks you to build something lasting and real. This period tests your relationship with material security, self-worth, and what you truly value. You may face financial restructuring or career shifts that ultimately teach you the difference between comfort and genuine stability.",
    Gemini:
      "Your Saturn Return in Gemini challenges you to commit to your ideas and communicate with authority. Scattered thinking gives way to focused expression. You may feel called to write, teach, or formalize knowledge you have carried informally. This is about mastering your mind.",
    Cancer:
      'Your Saturn Return in Cancer brings deep reckoning with family, home, and emotional foundations. You are asked to define what "home" means on your own terms, possibly restructuring family dynamics or establishing boundaries that protect your inner world.',
    Leo: "Your Saturn Return in Leo demands authentic creative expression and the courage to be seen. This period tests whether you are living for approval or from genuine self-expression. Leadership, creativity, and matters of the heart all come under review.",
    Virgo:
      "Your Saturn Return in Virgo calls for mastery in daily life, health, and service. Perfectionism is tested: can you do excellent work without self-criticism destroying you? This period often brings career refinement, health awareness, and learning to be useful without being used.",
    Libra:
      "Your Saturn Return in Libra tests your relationships and your capacity for true partnership. Superficial connections fall away. You learn what balanced commitment looks like and may face choices about marriage, business partnerships, or long-standing friendships.",
    Scorpio:
      "Your Saturn Return in Scorpio forces transformation through depth and honesty. Power dynamics, shared resources, and emotional intimacy are all tested. What you have avoided facing comes to the surface. The reward is profound personal power born from radical honesty.",
    Sagittarius:
      "Your Saturn Return in Sagittarius challenges your beliefs, education, and sense of meaning. You may question philosophies you once held dear, return to formal education, or feel called to teach. This is about building a worldview that actually holds up under pressure.",
    Capricorn:
      "Your Saturn Return in Capricorn is Saturn in its own sign, making this an especially powerful period. Career ambitions, public reputation, and long-term goals are all tested. You are asked to take full responsibility for your life direction and build structures that will last decades.",
    Aquarius:
      "Your Saturn Return in Aquarius challenges your role in community and your vision for the future. You may question which groups you belong to, what causes deserve your energy, and how to balance individuality with collective responsibility. Innovation meets accountability.",
    Pisces:
      "Your Saturn Return in Pisces asks you to give form to the formless. Spiritual practices, creative visions, and compassionate service all need grounding. You may struggle with boundaries between self and others, learning that true compassion requires structure.",
  };

  const signText =
    signDescriptions[sign] ||
    `Your Saturn Return in ${sign} brings important life lessons and structural changes in the areas of life governed by this sign.`;

  if (returnNumber === 1) {
    return `Your ${ordinal} Saturn Return (ages 27-30) marks your true entry into adulthood. ${signText}`;
  }
  if (returnNumber === 2) {
    return `Your ${ordinal} Saturn Return (ages 56-60) is a time of mature wisdom and legacy building. The themes of ${sign} return with deeper understanding. You now have the experience to build something truly meaningful, reviewing what you have accomplished and setting the course for the next chapter.`;
  }
  return `Your ${ordinal} Saturn Return (ages 84-90) is a rare milestone of completion. The lessons of Saturn in ${sign} have been fully integrated. This is a time of reflection, wisdom-sharing, and peace with the life you have lived.`;
}

interface SaturnSample {
  longitude: number;
  speed: number;
}

const dateKey = (timestamp: number) =>
  new Date(timestamp).toISOString().slice(0, 10);

const getSaturnSample = async (date: Date): Promise<SaturnSample> => {
  const result = await ephemerisService.getLongitudes(["Saturn"], date);
  if (result.usedMockFallback) {
    throw new Error("Saturn ephemeris data is unavailable.");
  }
  const longitude = result.longitudes.Saturn;
  const speed = result.speeds.Saturn;
  if (!Number.isFinite(longitude) || !Number.isFinite(speed)) {
    throw new Error("Saturn ephemeris data is invalid.");
  }
  return { longitude, speed };
};

const sampleRange = async (
  start: number,
  end: number,
  stepMs: number,
  sample: (at: number) => Promise<number>,
): Promise<TimedValue[]> => {
  const samples: TimedValue[] = [];
  for (let at = start; at < end; at += stepMs) {
    samples.push({ at, value: await sample(at) });
  }
  samples.push({ at: end, value: await sample(end) });
  return samples;
};

const uniqueRoots = (roots: readonly number[]) =>
  roots
    .slice()
    .sort((a, b) => a - b)
    .filter((root, index, sorted) =>
      index === 0 || root - sorted[index - 1] > ROOT_DEDUPLICATION_MS,
    );

async function findReturnPeriod(
  natalLongitude: number,
  approximateDate: Date,
): Promise<{
  exactPasses: SaturnReturnPass[];
  estimatedClosestDate: string;
  startDate: string;
  endDate: string;
}> {
  const low = addMonths(approximateDate, -12);
  const high = addMonths(approximateDate, 12);

  const samples = new Map<number, SaturnSample>();
  const getSample = async (at: number) => {
    const cached = samples.get(at);
    if (cached) return cached;
    const value = await getSaturnSample(new Date(at));
    samples.set(at, value);
    return value;
  };
  const conjunctionValue = async (at: number) =>
    normalizeSignedDegrees((await getSample(at)).longitude - natalLongitude);
  const absoluteConjunctionValue = async (at: number) =>
    Math.abs(await conjunctionValue(at));
  const orbValue = async (at: number) =>
    (await absoluteConjunctionValue(at)) - SEARCH_ORB_DEGREES;

  const conjunctionSamples = await sampleRange(
    low.getTime(),
    high.getTime(),
    RETURN_SEARCH_STEP_MS,
    conjunctionValue,
  );
  const signChangeRoots = uniqueRoots(
    await Promise.all(
      findSignChangeBrackets(conjunctionSamples).map((bracket) =>
        refineRoot(
          bracket.start,
          bracket.end,
          conjunctionValue,
          ROOT_TOLERANCE_MS,
        ),
      ),
    ),
  );
  const stationCandidates = await Promise.all(
    findLocalMinimumBrackets(
      conjunctionSamples.map((sample) => ({
        at: sample.at,
        value: Math.abs(sample.value),
      })),
    ).map((bracket) =>
      refineMinimum(
        bracket.start,
        bracket.end,
        absoluteConjunctionValue,
        ROOT_TOLERANCE_MS,
      ),
    ),
  );
  const stationTouchRoots: number[] = [];
  for (const candidate of stationCandidates) {
    if (
      (await absoluteConjunctionValue(candidate)) <=
      STATION_TOUCH_TOLERANCE_DEGREES
    ) {
      stationTouchRoots.push(candidate);
    }
  }
  const passRoots = uniqueRoots([...signChangeRoots, ...stationTouchRoots]);

  if (passRoots.length === 0) {
    throw new Error("Could not resolve a Saturn Return conjunction.");
  }

  const orbSamples = await sampleRange(
    low.getTime(),
    high.getTime(),
    RETURN_SEARCH_STEP_MS,
    orbValue,
  );
  const orbRoots = uniqueRoots(
    await Promise.all(
      findSignChangeBrackets(orbSamples).map((bracket) =>
        refineRoot(bracket.start, bracket.end, orbValue, ROOT_TOLERANCE_MS),
      ),
    ),
  );

  if (orbRoots.length < 2) {
    throw new Error("Could not resolve Saturn Return window boundaries.");
  }

  const closestRoot = passRoots.reduce((closest, root) =>
    Math.abs(root - approximateDate.getTime()) <
    Math.abs(closest - approximateDate.getTime())
      ? root
      : closest,
  );
  const exactPasses = await Promise.all(
    passRoots.map(async (root) => {
      const direction: SaturnReturnPass["direction"] =
        (await getSample(root)).speed < 0 ? "retrograde" : "direct";

      return {
        occurredAt: new Date(root).toISOString(),
        direction,
      };
    }),
  );

  return {
    exactPasses,
    estimatedClosestDate: dateKey(closestRoot),
    startDate: dateKey(orbRoots[0]),
    endDate: dateKey(orbRoots[orbRoots.length - 1]),
  };
}

export async function calculateSaturnReturn(
  input: SaturnReturnInput,
): Promise<SaturnReturnResult> {
  const birthDate = validateDate(input.date);

  if (input.time) {
    validateTime(input.time);
  }

  validateCoordinates(input.lat, input.lon);

  const precision: SaturnReturnPrecision =
    input.time && input.timezone ? "exact" : "estimated";
  const timezone = input.timezone || "UTC";
  const approximate = precision === "estimated";

  const birthInput: BirthInput = {
    date: input.date,
    time: input.time || "12:00",
    city: input.city || "Unknown",
    timezone,
    accuracy: approximate ? "time_unknown" : "exact",
    lat: input.lat,
    lon: input.lon,
  };

  const natalMoment = birthToUtcDate(birthInput);
  const natalSample = await getSaturnSample(natalMoment);
  const natalLongitude = natalSample.longitude;
  const natalSign = SIGNS[Math.floor(natalLongitude / 30)];
  const natalDegree = Math.floor(natalLongitude % 30);
  const natalMinute = Math.floor((natalLongitude % 1) * 60);

  const natalSaturn: NatalSaturnInfo = {
    sign: natalSign,
    degree: natalDegree,
    minute: natalMinute,
    longitude: natalLongitude,
  };

  const birthYear = birthDate.getFullYear();
  const returns: SaturnReturnPeriod[] = [];

  for (let returnNum = 1; returnNum <= 3; returnNum++) {
    const approximateReturnYear =
      birthYear + Math.round(SATURN_ORBITAL_PERIOD_YEARS * returnNum);
    const approximateReturnDate = new Date(
      Date.UTC(approximateReturnYear, birthDate.getMonth(), 1),
    );

    if (approximateReturnYear > 2080) break;

    const returnPeriod = await findReturnPeriod(
      natalLongitude,
      approximateReturnDate,
    );

    returns.push({
      startDate: returnPeriod.startDate,
      endDate: returnPeriod.endDate,
      ...(precision === "exact"
        ? { exactPasses: returnPeriod.exactPasses }
        : { estimatedClosestDate: returnPeriod.estimatedClosestDate }),
      returnNumber: returnNum,
      interpretation: getReturnInterpretation(returnNum, natalSign),
    });
  }

  return {
    natalSaturn,
    returns,
    precision,
    approximate,
  };
}
