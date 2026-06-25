// INPUT: types（NatalFacts/UserProfile/Aspect/PlanetPosition）、BirthDataCalculator.CalculatorBirth、crossAspects。
// OUTPUT: 合盘工具的纯数据组装：双人 profile、交叉相位矩阵数据、house overlays。
// POS: SynastryCalculator 的无 UI 数据层；只处理结构化星盘数据，不生成 AI 解读。若更新此文件，务必同步 calculators/FOLDER.md 与测试。

import type {
  Aspect,
  NatalFacts,
  PlanetPosition,
  UserProfile,
} from "../../types";
import type { CalculatorBirth } from "./BirthDataCalculator";
import {
  absoluteLongitude,
  crossAspects,
  type CrossAspect,
} from "./crossAspects";

export const SYNASTRY_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
];

export const SYNASTRY_DISPLAY_BODIES = [
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
  "Ascendant",
];

export const OVERLAY_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Ascendant",
];

const HOUSE_PRIORITY = [1, 4, 7, 10, 5, 8, 2, 3, 6, 9, 11, 12];

export interface SynastryPersonData {
  label: string;
  birth: CalculatorBirth;
  profile: UserProfile;
  chart: NatalFacts;
}

export interface HouseOverlayDatum {
  from: "A" | "B";
  to: "A" | "B";
  fromLabel: string;
  toLabel: string;
  body: string;
  sign: string;
  degree: number;
  minute?: number;
  targetHouse: number;
}

export interface SynastryResultData {
  personA: SynastryPersonData;
  personB: SynastryPersonData;
  aspects: CrossAspect[];
  matrixAspects: Aspect[];
  overlays: HouseOverlayDatum[];
}

function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function buildToolProfile(
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

export function matrixAspectsFromCross(aspects: CrossAspect[]): Aspect[] {
  return aspects.map((aspect) => ({
    planet1: aspect.a,
    planet2: aspect.b,
    type: aspect.aspect as Aspect["type"],
    orb: aspect.orb,
    isApplying: false,
  }));
}

export function houseForLongitude(
  longitude: number,
  houseCusps?: number[],
): number | null {
  if (!houseCusps || houseCusps.length !== 12) return null;
  const lon = normalizeLongitude(longitude);
  for (let index = 0; index < 12; index++) {
    const start = normalizeLongitude(houseCusps[index]);
    const end = normalizeLongitude(houseCusps[(index + 1) % 12]);
    if (start <= end) {
      if (lon >= start && lon < end) return index + 1;
    } else if (lon >= start || lon < end) {
      return index + 1;
    }
  }
  return null;
}

function overlayOneWay(
  from: "A" | "B",
  to: "A" | "B",
  fromLabel: string,
  toLabel: string,
  sourcePositions: PlanetPosition[],
  targetHouseCusps?: number[],
): HouseOverlayDatum[] {
  const sourceByName = new Map(sourcePositions.map((pos) => [pos.name, pos]));
  const overlays: HouseOverlayDatum[] = [];
  for (const body of OVERLAY_BODIES) {
    const pos = sourceByName.get(body);
    if (!pos) continue;
    const longitude = absoluteLongitude(pos);
    const targetHouse =
      longitude == null ? null : houseForLongitude(longitude, targetHouseCusps);
    if (!targetHouse) continue;
    overlays.push({
      from,
      to,
      fromLabel,
      toLabel,
      body: pos.name,
      sign: pos.sign,
      degree: pos.degree,
      minute: pos.minute,
      targetHouse,
    });
  }
  return overlays;
}

export function buildHouseOverlays(
  labelA: string,
  labelB: string,
  chartA: NatalFacts,
  chartB: NatalFacts,
): HouseOverlayDatum[] {
  const overlays = [
    ...overlayOneWay(
      "A",
      "B",
      labelA,
      labelB,
      chartA.positions,
      chartB.houseCusps,
    ),
    ...overlayOneWay(
      "B",
      "A",
      labelB,
      labelA,
      chartB.positions,
      chartA.houseCusps,
    ),
  ];
  return overlays.sort((left, right) => {
    const pLeft = HOUSE_PRIORITY.indexOf(left.targetHouse);
    const pRight = HOUSE_PRIORITY.indexOf(right.targetHouse);
    return (
      (pLeft === -1 ? 99 : pLeft) - (pRight === -1 ? 99 : pRight) ||
      left.from.localeCompare(right.from) ||
      OVERLAY_BODIES.indexOf(left.body) - OVERLAY_BODIES.indexOf(right.body)
    );
  });
}

export function buildSynastryResultData(params: {
  labelA: string;
  labelB: string;
  birthA: CalculatorBirth;
  birthB: CalculatorBirth;
  chartA: NatalFacts;
  chartB: NatalFacts;
}): SynastryResultData {
  const aspects = crossAspects(
    params.chartA.positions ?? [],
    params.chartB.positions ?? [],
    SYNASTRY_BODIES,
  );
  return {
    personA: {
      label: params.labelA,
      birth: params.birthA,
      profile: buildToolProfile(
        "tool-synastry-a",
        params.labelA,
        params.birthA,
      ),
      chart: params.chartA,
    },
    personB: {
      label: params.labelB,
      birth: params.birthB,
      profile: buildToolProfile(
        "tool-synastry-b",
        params.labelB,
        params.birthB,
      ),
      chart: params.chartB,
    },
    aspects,
    matrixAspects: matrixAspectsFromCross(aspects),
    overlays: buildHouseOverlays(
      params.labelA,
      params.labelB,
      params.chartA,
      params.chartB,
    ),
  };
}
