// INPUT: NatalFacts/PlanetPosition/UserProfile/Aspect、TodayPosition、CalculatorBirth、crossAspects。
// OUTPUT: Current Planets 工具内的个人行运数据组装：出生 profile、行运行星、行运×本命相位矩阵、短期/长期分组。
// POS: CurrentPlanetsTool 的无 AI 数据层；出生数据只用于 natal POST，行运相位在客户端计算。若更新此文件，务必同步测试。

import type {
  Aspect,
  NatalFacts,
  PlanetPosition,
  UserProfile,
} from "../../types";
import type { TodayPosition } from "../../services/apiClient";
import type { CalculatorBirth } from "./BirthDataCalculator";
import { crossAspects, type CrossAspect } from "./crossAspects";

export const TRANSIT_BODIES = [
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

export const NATAL_TRANSIT_TARGETS = [
  ...TRANSIT_BODIES,
  "North Node",
  "Ascendant",
  "Midheaven",
];

const LONG_TERM_TRANSIT_BODIES = new Set([
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
]);

export interface TransitResultData {
  label: string;
  birth: CalculatorBirth;
  profile: UserProfile;
  date: string;
  natalChart: NatalFacts;
  transitPositions: PlanetPosition[];
  aspects: CrossAspect[];
  shortTermAspects: CrossAspect[];
  longTermAspects: CrossAspect[];
  matrixAspects: Aspect[];
}

function buildToolProfile(label: string, birth: CalculatorBirth): UserProfile {
  return {
    userId: "tool-current-transits",
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

export function todayPositionsToPlanetPositions(
  positions: readonly TodayPosition[],
): PlanetPosition[] {
  return positions.map((pos) => {
    const degree = Math.floor(pos.degree);
    let minute = Math.round((pos.degree - degree) * 60);
    let normalizedDegree = degree;
    if (minute >= 60) {
      normalizedDegree += 1;
      minute = 0;
    }
    return {
      name: pos.name,
      sign: pos.sign,
      degree: normalizedDegree,
      minute,
      isRetrograde: pos.retrograde,
    };
  });
}

export function transitMatrixAspects(aspects: CrossAspect[]): Aspect[] {
  return aspects.map((aspect) => ({
    planet1: aspect.a,
    planet2: aspect.b,
    type: aspect.aspect as Aspect["type"],
    orb: aspect.orb,
    isApplying: false,
  }));
}

export function buildTransitResultData(params: {
  label: string;
  birth: CalculatorBirth;
  date: string;
  natalChart: NatalFacts;
  skyPositions: readonly TodayPosition[];
}): TransitResultData {
  const transitPositions = todayPositionsToPlanetPositions(params.skyPositions);
  const aspects = crossAspects(
    transitPositions,
    params.natalChart.positions ?? [],
    NATAL_TRANSIT_TARGETS,
  );
  const shortTermAspects = aspects.filter(
    (aspect) => !LONG_TERM_TRANSIT_BODIES.has(aspect.a),
  );
  const longTermAspects = aspects.filter((aspect) =>
    LONG_TERM_TRANSIT_BODIES.has(aspect.a),
  );
  return {
    label: params.label,
    birth: params.birth,
    profile: buildToolProfile(params.label, params.birth),
    date: params.date,
    natalChart: params.natalChart,
    transitPositions,
    aspects,
    shortTermAspects,
    longTermAspects,
    matrixAspects: transitMatrixAspects(aspects),
  };
}
