// INPUT: NatalFacts/PlanetPosition/UserProfile/Aspect/ExtendedNatalData、CalculatorBirth、composite midpoint helpers。
// OUTPUT: Composite 工具的纯数据组装：双方 profile、组合盘中点落座、组合宫头/宫位、相位矩阵、元素矩阵与宫主星表。
// POS: CompositeCalculator 的无 UI 数据层；只处理结构化星盘数据，不生成 AI 解读。若更新此文件，务必同步 calculators/FOLDER.md 与测试。

import type {
  Aspect,
  ExtendedNatalData,
  NatalFacts,
  PlanetPosition,
  UserProfile,
} from "../../types";
import type { CalculatorBirth } from "./BirthDataCalculator";
import { absoluteLongitude, selfAspects } from "./crossAspects";
import { midpointLongitude } from "./compositeChart";
import { houseForLongitude } from "./synastryData";

const SIGN_ORDER = [
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
];

const MODERN_RULERS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

const ELEMENT_BY_SIGN: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};

const MODALITY_BY_SIGN: Record<string, "Cardinal" | "Fixed" | "Mutable"> = {
  Aries: "Cardinal",
  Cancer: "Cardinal",
  Libra: "Cardinal",
  Capricorn: "Cardinal",
  Taurus: "Fixed",
  Leo: "Fixed",
  Scorpio: "Fixed",
  Aquarius: "Fixed",
  Gemini: "Mutable",
  Virgo: "Mutable",
  Sagittarius: "Mutable",
  Pisces: "Mutable",
};

export const COMPOSITE_PLANET_BODIES = [
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
];

export const COMPOSITE_POINT_BODIES = [
  "Ascendant",
  "Midheaven",
  "Descendant",
  "IC",
  "North Node",
  "Chiron",
];

const COMPOSITE_ASPECT_BODIES = [
  ...COMPOSITE_PLANET_BODIES,
  "Ascendant",
  "Midheaven",
  "North Node",
];

export interface CompositePersonData {
  label: string;
  birth: CalculatorBirth;
  profile: UserProfile;
  chart: NatalFacts;
}

export interface CompositeHouseData {
  number: number;
  cusp: PlanetPosition & { longitude: number };
  occupants: PlanetPosition[];
}

export interface CompositeResultData {
  personA: CompositePersonData;
  personB: CompositePersonData;
  positions: PlanetPosition[];
  planets: PlanetPosition[];
  points: PlanetPosition[];
  aspects: Aspect[];
  houses: CompositeHouseData[];
  technical: ExtendedNatalData;
  houseCusps: number[];
}

function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signAtLongitude(longitude: number): {
  sign: string;
  degree: number;
  minute: number;
} {
  const lon = normalizeLongitude(longitude);
  const signIndex = Math.min(11, Math.floor(lon / 30));
  const rawDegree = lon - signIndex * 30;
  let degree = Math.floor(rawDegree);
  let minute = Math.round((rawDegree - degree) * 60);
  if (minute >= 60) {
    degree += 1;
    minute = 0;
  }
  if (degree >= 30) {
    return {
      sign: SIGN_ORDER[(signIndex + 1) % 12],
      degree: 0,
      minute: 0,
    };
  }
  return { sign: SIGN_ORDER[signIndex], degree, minute };
}

function positionAtLongitude(
  name: string,
  longitude: number,
  houseCusps: number[],
): PlanetPosition {
  const at = signAtLongitude(longitude);
  return {
    name,
    sign: at.sign,
    degree: at.degree,
    minute: at.minute,
    house: houseForLongitude(longitude, houseCusps) ?? undefined,
    isRetrograde: false,
  };
}

function buildToolProfile(
  id: string,
  label: string,
  birth: CalculatorBirth,
): UserProfile {
  return {
    userId: id,
    name: label,
    birthDate: birth.birthDate,
    birthTime: birth.birthTime,
    birthCity: birth.birthCity,
    lat: birth.lat,
    lon: birth.lon,
    timezone: birth.timezone,
    accuracyLevel: birth.accuracyLevel,
    focusTags: [],
  };
}

function byName(positions: PlanetPosition[]): Map<string, PlanetPosition> {
  return new Map(positions.map((pos) => [pos.name, pos]));
}

function midpointPosition(
  name: string,
  mapA: Map<string, PlanetPosition>,
  mapB: Map<string, PlanetPosition>,
  houseCusps: number[],
): PlanetPosition | null {
  const posA = mapA.get(name);
  const posB = mapB.get(name);
  if (!posA || !posB) return null;
  const lonA = absoluteLongitude(posA);
  const lonB = absoluteLongitude(posB);
  if (lonA == null || lonB == null) return null;
  return positionAtLongitude(name, midpointLongitude(lonA, lonB), houseCusps);
}

function midpointFromCusps(
  name: string,
  cuspIndex: number,
  cuspsA: number[],
  cuspsB: number[],
  houseCusps: number[],
): PlanetPosition | null {
  if (cuspsA.length !== 12 || cuspsB.length !== 12) return null;
  return positionAtLongitude(
    name,
    midpointLongitude(cuspsA[cuspIndex], cuspsB[cuspIndex]),
    houseCusps,
  );
}

export function buildCompositeHouseCusps(
  chartA: NatalFacts,
  chartB: NatalFacts,
): number[] {
  const cuspsA = Array.isArray(chartA.houseCusps) ? chartA.houseCusps : [];
  const cuspsB = Array.isArray(chartB.houseCusps) ? chartB.houseCusps : [];
  if (cuspsA.length !== 12 || cuspsB.length !== 12) return [];
  return cuspsA.map((cusp, index) =>
    midpointLongitude(cusp, cuspsB[index] ?? cusp),
  );
}

export function buildCompositePositions(
  chartA: NatalFacts,
  chartB: NatalFacts,
  houseCusps = buildCompositeHouseCusps(chartA, chartB),
): PlanetPosition[] {
  const mapA = byName(chartA.positions ?? []);
  const mapB = byName(chartB.positions ?? []);
  const cuspsA = Array.isArray(chartA.houseCusps) ? chartA.houseCusps : [];
  const cuspsB = Array.isArray(chartB.houseCusps) ? chartB.houseCusps : [];
  const positions: PlanetPosition[] = [];

  for (const name of COMPOSITE_PLANET_BODIES) {
    const pos = midpointPosition(name, mapA, mapB, houseCusps);
    if (pos) positions.push(pos);
  }

  const pointCandidates: Array<[string, number | null]> = [
    ["Ascendant", 0],
    ["Midheaven", 9],
    ["Descendant", 6],
    ["IC", 3],
    ["North Node", null],
    ["Chiron", null],
  ];
  for (const [name, cuspIndex] of pointCandidates) {
    const pos =
      midpointPosition(name, mapA, mapB, houseCusps) ??
      (cuspIndex == null
        ? null
        : midpointFromCusps(name, cuspIndex, cuspsA, cuspsB, houseCusps));
    if (pos) positions.push(pos);
  }

  return positions;
}

function buildCompositeAspects(positions: PlanetPosition[]): Aspect[] {
  return selfAspects(positions, COMPOSITE_ASPECT_BODIES).map((aspect) => ({
    planet1: aspect.a,
    planet2: aspect.b,
    type: aspect.aspect as Aspect["type"],
    orb: aspect.orb,
    isApplying: false,
  }));
}

function buildElements(
  positions: PlanetPosition[],
): ExtendedNatalData["elements"] {
  const elements: ExtendedNatalData["elements"] = {};
  const positionMap = byName(positions);
  for (const name of COMPOSITE_PLANET_BODIES) {
    const pos = positionMap.get(name);
    if (!pos) continue;
    const element = ELEMENT_BY_SIGN[pos.sign];
    const modality = MODALITY_BY_SIGN[pos.sign];
    if (!element || !modality) continue;
    elements[element] = elements[element] || {};
    elements[element][modality] = elements[element][modality] || [];
    elements[element][modality].push(pos.name);
  }
  return elements;
}

function buildHouseRulers(
  positions: PlanetPosition[],
  houseCusps: number[],
): ExtendedNatalData["houseRulers"] {
  const houses =
    houseCusps.length === 12
      ? houseCusps.map((longitude) => signAtLongitude(longitude).sign)
      : [...SIGN_ORDER];
  return houses.map((sign, index) => {
    const ruler = MODERN_RULERS[sign] || "Unknown";
    const rulerPos = positions.find((pos) => pos.name === ruler);
    return {
      house: index + 1,
      sign,
      ruler,
      fliesTo: rulerPos?.house ?? 0,
      fliesToSign: rulerPos?.sign,
    };
  });
}

function buildHouses(
  positions: PlanetPosition[],
  houseCusps: number[],
): CompositeHouseData[] {
  if (houseCusps.length !== 12) return [];
  return houseCusps.map((longitude, index) => {
    const number = index + 1;
    return {
      number,
      cusp: {
        ...positionAtLongitude(`House ${number}`, longitude, houseCusps),
        longitude: normalizeLongitude(longitude),
      },
      occupants: positions.filter((pos) => pos.house === number),
    };
  });
}

function dominanceFromElements(
  elements: ExtendedNatalData["elements"],
): NatalFacts["dominance"] {
  const out: NatalFacts["dominance"] = {
    elements: { fire: 0, earth: 0, air: 0, water: 0 },
    modalities: { cardinal: 0, fixed: 0, mutable: 0 },
  };
  const elementMap: Record<string, keyof typeof out.elements> = {
    Fire: "fire",
    Earth: "earth",
    Air: "air",
    Water: "water",
  };
  const modalityMap: Record<string, keyof typeof out.modalities> = {
    Cardinal: "cardinal",
    Fixed: "fixed",
    Mutable: "mutable",
  };
  Object.entries(elements).forEach(([element, modalities]) => {
    Object.entries(modalities).forEach(([modality, bodies]) => {
      const e = elementMap[element];
      const m = modalityMap[modality];
      if (e) out.elements[e] += bodies.length;
      if (m) out.modalities[m] += bodies.length;
    });
  });
  return out;
}

export function buildCompositeResultData(params: {
  labelA: string;
  labelB: string;
  birthA: CalculatorBirth;
  birthB: CalculatorBirth;
  chartA: NatalFacts;
  chartB: NatalFacts;
}): CompositeResultData {
  const houseCusps = buildCompositeHouseCusps(params.chartA, params.chartB);
  const positions = buildCompositePositions(
    params.chartA,
    params.chartB,
    houseCusps,
  );
  if (positions.length === 0) {
    throw new Error("empty composite");
  }
  const positionMap = byName(positions);
  const planets = COMPOSITE_PLANET_BODIES.map((name) =>
    positionMap.get(name),
  ).filter((pos): pos is PlanetPosition => !!pos);
  const points = COMPOSITE_POINT_BODIES.map((name) =>
    positionMap.get(name),
  ).filter((pos): pos is PlanetPosition => !!pos);
  const aspects = buildCompositeAspects(positions);
  const elements = buildElements(positions);
  const technical: ExtendedNatalData = {
    elements,
    planets,
    asteroids: points,
    houseRulers: buildHouseRulers(positions, houseCusps),
    aspects,
  };
  return {
    personA: {
      label: params.labelA,
      birth: params.birthA,
      profile: buildToolProfile(
        "tool-composite-a",
        params.labelA,
        params.birthA,
      ),
      chart: params.chartA,
    },
    personB: {
      label: params.labelB,
      birth: params.birthB,
      profile: buildToolProfile(
        "tool-composite-b",
        params.labelB,
        params.birthB,
      ),
      chart: params.chartB,
    },
    positions,
    planets,
    points,
    aspects,
    houses: buildHouses(positions, houseCusps),
    houseCusps,
    technical: {
      ...technical,
      aspects,
    },
  };
}

export function buildCompositeNatalFacts(
  result: CompositeResultData,
): NatalFacts {
  return {
    positions: result.positions,
    aspects: result.aspects,
    dominance: dominanceFromElements(result.technical.elements),
    houseCusps: result.houseCusps,
  };
}
