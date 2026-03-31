// INPUT: Birth date and optional time/location for Saturn Return calculation.
// OUTPUT: Natal Saturn position and Saturn Return date ranges with template interpretations.
// POS: Saturn Return calculator service; update this header and FOLDER.md if modified.

import { ephemerisService } from "./ephemeris.js";
import type { BirthInput } from "../types/api.js";

export interface SaturnReturnInput {
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (optional)
  timezone: string;
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
  exactDate: string; // ISO date string (exact conjunction)
  endDate: string; // ISO date string (when Saturn leaves orb)
  returnNumber: number; // 1st, 2nd, 3rd
  interpretation: string;
}

export interface SaturnReturnResult {
  natalSaturn: NatalSaturnInfo;
  returns: SaturnReturnPeriod[];
  approximate: boolean;
}

const SATURN_ORBITAL_PERIOD_YEARS = 29.46;
const SEARCH_ORB_DEGREES = 2;

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

function signToLongitude(sign: string, degree: number, minute: number): number {
  const signIndex = SIGNS.indexOf(sign as typeof SIGNS[number]);
  if (signIndex === -1) {
    throw new Error(`Unknown sign: ${sign}`);
  }
  return signIndex * 30 + degree + minute / 60;
}

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

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
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

async function findSaturnLongitude(
  date: Date,
  lat: number,
  lon: number,
): Promise<number> {
  const chart = await ephemerisService.calculateNatalChart({
    date: date.toISOString().split("T")[0],
    time: `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`,
    city: "Unknown",
    timezone: "UTC",
    accuracy: "exact",
    lat,
    lon,
  });

  const saturn = chart.positions.find((p) => p.name === "Saturn");
  if (!saturn) {
    throw new Error("Saturn position not found in chart calculation");
  }

  return signToLongitude(saturn.sign, saturn.degree, saturn.minute || 0);
}

async function findExactReturnDate(
  natalLongitude: number,
  approximateDate: Date,
  lat: number,
  lon: number,
): Promise<{ exactDate: Date; startDate: Date; endDate: Date }> {
  // P0 fix: use addMonths/addDays instead of setMonth/setDate
  const low = addMonths(approximateDate, -12);
  const high = addMonths(approximateDate, 12);

  // Scan monthly to find closest approach
  let bestDate = approximateDate;
  let bestDiff = 360;

  let scanDate = new Date(low);
  while (scanDate <= high) {
    const lon360 = await findSaturnLongitude(scanDate, lat, lon);
    let diff = Math.abs(lon360 - natalLongitude);
    if (diff > 180) diff = 360 - diff;

    if (diff < bestDiff) {
      bestDiff = diff;
      bestDate = new Date(scanDate);
    }
    scanDate = addDays(scanDate, 30);
  }

  // Refine to weekly precision
  const weekLow = addDays(bestDate, -45);
  const weekHigh = addDays(bestDate, 45);

  let weekScan = new Date(weekLow);
  while (weekScan <= weekHigh) {
    const lon360 = await findSaturnLongitude(weekScan, lat, lon);
    let diff = Math.abs(lon360 - natalLongitude);
    if (diff > 180) diff = 360 - diff;

    if (diff < bestDiff) {
      bestDiff = diff;
      bestDate = new Date(weekScan);
    }
    weekScan = addDays(weekScan, 7);
  }

  // Find start/end dates (orb window)
  const orbStart = addMonths(bestDate, -6);
  let startDate = bestDate;
  let endDate = bestDate;

  let orbScan = new Date(orbStart);
  let inOrb = false;
  while (orbScan <= high) {
    const lon360 = await findSaturnLongitude(orbScan, lat, lon);
    let diff = Math.abs(lon360 - natalLongitude);
    if (diff > 180) diff = 360 - diff;

    if (diff <= SEARCH_ORB_DEGREES && !inOrb) {
      startDate = new Date(orbScan);
      inOrb = true;
    }
    if (diff > SEARCH_ORB_DEGREES && inOrb) {
      endDate = new Date(orbScan);
      break;
    }
    orbScan = addDays(orbScan, 14);
  }

  if (inOrb && endDate.getTime() === bestDate.getTime()) {
    endDate = addMonths(startDate, 6);
  }

  return { exactDate: bestDate, startDate, endDate };
}

export async function calculateSaturnReturn(
  input: SaturnReturnInput,
): Promise<SaturnReturnResult> {
  const birthDate = validateDate(input.date);

  if (input.time) {
    validateTime(input.time);
  }

  validateCoordinates(input.lat, input.lon);

  const approximate = !input.time;
  const lat = input.lat ?? 0;
  const lon = input.lon ?? 0;

  const birthInput: BirthInput = {
    date: input.date,
    time: input.time || "12:00",
    city: input.city || "Unknown",
    timezone: input.timezone,
    accuracy: approximate ? "time_unknown" : "exact",
    lat: input.lat,
    lon: input.lon,
  };

  const chart = await ephemerisService.calculateNatalChart(birthInput);
  const saturn = chart.positions.find((p) => p.name === "Saturn");
  if (!saturn) {
    throw new Error("Could not calculate natal Saturn position");
  }

  const natalLongitude = signToLongitude(saturn.sign, saturn.degree, saturn.minute || 0);

  const natalSaturn: NatalSaturnInfo = {
    sign: saturn.sign,
    degree: saturn.degree,
    minute: saturn.minute || 0,
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

    const { exactDate, startDate, endDate } = await findExactReturnDate(
      natalLongitude,
      approximateReturnDate,
      lat,
      lon,
    );

    returns.push({
      startDate: startDate.toISOString().split("T")[0],
      exactDate: exactDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      returnNumber: returnNum,
      interpretation: getReturnInterpretation(returnNum, saturn.sign),
    });
  }

  return {
    natalSaturn,
    returns,
    approximate,
  };
}
