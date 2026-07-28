// INPUT: BirthDataCalculator 的 CalculatorConfig/Birth/Result/Placement/Funnel + birthToPrefill、services/apiClient（fetchNatalChart）、
//        astroDisplay（planetLabel/signLabel）、types（NatalFacts/PlanetPosition）。
// OUTPUT: sign 类计算器的配置（Moon Sign / Rising / Big Three / Birth Chart）——compute 把 /api/natal/chart 已返回的
//         度数/宫位/逆行/元素三模态全部转成富结果 + 导流 prefill + wiki 内链（零额外计算，无 AI）。
// POS: 计算器矩阵（D）的 sign 类配置层。全部复用 /api/natal/chart（匿名 skipCache，隐私 #2），不新增后端。
//      结果中性非命运断言；深度解读导向 onboarding 真实产品 + wiki。若更新此文件，务必更新 calculators/FOLDER.md。

import type {
  Aspect,
  ExtendedNatalData,
  NatalFacts,
  PlanetPosition,
  Language,
  UserProfile,
} from "../../types";
import { fetchNatalChart } from "../../services/apiClient";
import { planetLabel, signLabel } from "./astroDisplay";
import { absoluteLongitude } from "./crossAspects";
import {
  birthToPrefill,
  type CalculatorConfig,
  type CalculatorBirth,
  type CalculatorResult,
  type CalculatorPlacement,
  type CalculatorFunnel,
  type BirthChartAspectDatum,
  type BirthChartDetails,
  type BirthChartHouseDatum,
  type BirthChartMoonPhaseDatum,
  type BirthChartSignatureDatum,
  type BirthChartWheelPoint,
} from "./BirthDataCalculator";

// fetchNatalChart 接收 UserProfile|SynastryProfile（私有联合类型）；计算器只填它读取的字段。
async function natal(birth: CalculatorBirth): Promise<NatalFacts> {
  return fetchNatalChart(
    birth as unknown as Parameters<typeof fetchNatalChart>[0],
    { skipCache: true },
  );
}

function findPos(
  positions: PlanetPosition[],
  name: string,
): PlanetPosition | undefined {
  return positions.find((p) => p.name === name);
}

const ANGLE_ZH: Record<string, string> = {
  Ascendant: "上升",
  Midheaven: "天顶",
  Descendant: "下降",
  IC: "天底",
};

const bodyLabel = (name: string, lang: Language): string =>
  lang === "zh" ? (ANGLE_ZH[name] ?? planetLabel(name, "zh")) : name;

const signHref = (sign: string): string => `/wiki/${sign.toLowerCase()}`;

function toPlacement(pos: PlanetPosition, lang: Language): CalculatorPlacement {
  return {
    planet: pos.name,
    sign: pos.sign,
    label: bodyLabel(pos.name, lang),
    value: signLabel(pos.sign, lang),
    degree: pos.degree,
    minute: pos.minute,
    house: pos.house,
    retrograde: pos.isRetrograde,
    href: signHref(pos.sign),
  };
}

function dominanceOf(chart: NatalFacts) {
  return {
    elements: chart.dominance.elements,
    modalities: chart.dominance.modalities,
  };
}

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

const PLANET_ORDER = [
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

const MAJOR_BODIES = [
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
  "Ascendant",
  "Descendant",
  "Midheaven",
  "IC",
] as const;

const ASPECT_BODIES = [...MAJOR_BODIES, "North Node"] as const;

const ELEMENT_BODIES = [
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
] as const;

const MINOR_BODIES = [
  "Chiron",
  "Ceres",
  "Pallas",
  "Juno",
  "Vesta",
  "North Node",
  "South Node",
  "Lilith",
  "Fortune",
  "Vertex",
  "East Point",
] as const;

const POINT_ORDER = [
  "Ascendant",
  "Midheaven",
  "Descendant",
  "IC",
  "North Node",
  "South Node",
  "Chiron",
];

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

const TECH_ASPECT_TYPES: Record<
  Aspect["type"],
  { angle: number; orb: number }
> = {
  conjunction: { angle: 0, orb: 8 },
  opposition: { angle: 180, orb: 8 },
  square: { angle: 90, orb: 7 },
  trine: { angle: 120, orb: 7 },
  sextile: { angle: 60, orb: 5 },
};

const ASPECT_LABELS: Record<string, { en: string; zh: string }> = {
  conjunction: { en: "Conjunction", zh: "合相" },
  opposition: { en: "Opposition", zh: "对冲" },
  square: { en: "Square", zh: "四分相" },
  trine: { en: "Trine", zh: "三分相" },
  sextile: { en: "Sextile", zh: "六合相" },
};

const MOON_PHASE_LABELS = [
  { en: "New Moon", zh: "新月" },
  { en: "Waxing Crescent", zh: "蛾眉月" },
  { en: "First Quarter", zh: "上弦月" },
  { en: "Waxing Gibbous", zh: "盈凸月" },
  { en: "Full Moon", zh: "满月" },
  { en: "Waning Gibbous", zh: "亏凸月" },
  { en: "Last Quarter", zh: "下弦月" },
  { en: "Waning Crescent", zh: "残月" },
];

const ROMAN_HOUSES = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

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
      minute,
    };
  }
  return { sign: SIGN_ORDER[signIndex], degree, minute };
}

function toWheelPoint(
  pos: PlanetPosition,
  lang: Language,
): BirthChartWheelPoint | null {
  const longitude = absoluteLongitude(pos);
  if (longitude == null) return null;
  return {
    ...toPlacement(pos, lang),
    name: pos.name,
    longitude,
  };
}

function pointFromLongitude(
  name: string,
  longitude: number,
  lang: Language,
  house?: number,
): BirthChartWheelPoint {
  const at = signAtLongitude(longitude);
  return {
    name,
    planet: undefined,
    sign: at.sign,
    label: name,
    value: signLabel(at.sign, lang),
    degree: at.degree,
    minute: at.minute,
    house,
    retrograde: false,
    href: signHref(at.sign),
    longitude: normalizeLongitude(longitude),
  };
}

function buildMoonPhase(
  sun?: BirthChartWheelPoint,
  moon?: BirthChartWheelPoint,
  lang?: Language,
): BirthChartMoonPhaseDatum | undefined {
  if (!sun || !moon || !lang) return undefined;
  const angle = normalizeLongitude(moon.longitude - sun.longitude);
  const phaseIndex = Math.floor(((angle + 22.5) % 360) / 45);
  const phase = MOON_PHASE_LABELS[phaseIndex] ?? MOON_PHASE_LABELS[0];
  const illumination = ((1 - Math.cos((angle * Math.PI) / 180)) / 2) * 100;
  const age = (angle / 360) * 29.530588;
  return {
    name: phase.en,
    label: lang === "zh" ? phase.zh : phase.en,
    angle: Number(angle.toFixed(2)),
    age: Number(age.toFixed(2)),
    illumination: Number(illumination.toFixed(1)),
  };
}

function buildAspects(
  chart: NatalFacts,
  lang: Language,
): BirthChartAspectDatum[] {
  return chart.aspects
    .map((aspect) => ({
      planet1: aspect.planet1,
      planet2: aspect.planet2,
      planet1Label: bodyLabel(aspect.planet1, lang),
      planet2Label: bodyLabel(aspect.planet2, lang),
      type: aspect.type,
      typeLabel:
        ASPECT_LABELS[aspect.type]?.[lang] ??
        (lang === "zh" ? aspect.type : aspect.type),
      orb: aspect.orb,
      isApplying: aspect.isApplying,
    }))
    .sort((a, b) => a.orb - b.orb);
}

function buildHouses(
  chart: NatalFacts,
  wheelPoints: BirthChartWheelPoint[],
  lang: Language,
): BirthChartHouseDatum[] {
  const cusps = Array.isArray(chart.houseCusps)
    ? chart.houseCusps.filter((n) => Number.isFinite(n))
    : [];
  if (cusps.length !== 12) return [];
  return cusps.map((longitude, index) => {
    const number = index + 1;
    const title =
      lang === "zh"
        ? `第 ${ROMAN_HOUSES[index]} 宫`
        : `House ${ROMAN_HOUSES[index]}`;
    return {
      number,
      title,
      cusp: pointFromLongitude(title, longitude, lang, number),
      occupants: wheelPoints.filter((p) => p.house === number),
    };
  });
}

function topEntry(
  counts: Map<string, number>,
): { key: string; value: number } | null {
  let best: { key: string; value: number } | null = null;
  counts.forEach((value, key) => {
    if (!best || value > best.value) best = { key, value };
  });
  return best;
}

function buildSignature(
  wheelPoints: BirthChartWheelPoint[],
  houses: BirthChartHouseDatum[],
  aspects: BirthChartAspectDatum[],
  chart: NatalFacts,
  lang: Language,
): BirthChartSignatureDatum[] {
  const out: BirthChartSignatureDatum[] = [];
  const elementEntries = Object.entries(chart.dominance.elements).sort(
    (a, b) => b[1] - a[1],
  );
  const modalityEntries = Object.entries(chart.dominance.modalities).sort(
    (a, b) => b[1] - a[1],
  );
  const elementLabel: Record<string, { en: string; zh: string }> = {
    fire: { en: "Fire", zh: "火" },
    earth: { en: "Earth", zh: "土" },
    air: { en: "Air", zh: "风" },
    water: { en: "Water", zh: "水" },
  };
  const modalityLabel: Record<string, { en: string; zh: string }> = {
    cardinal: { en: "Cardinal", zh: "基本" },
    fixed: { en: "Fixed", zh: "固定" },
    mutable: { en: "Mutable", zh: "变动" },
  };
  if (elementEntries[0]) {
    out.push({
      label: lang === "zh" ? "最高元素计数" : "Highest element count",
      value: `${elementLabel[elementEntries[0][0]]?.[lang] ?? elementEntries[0][0]} · ${elementEntries[0][1]}`,
    });
  }
  if (modalityEntries[0]) {
    out.push({
      label: lang === "zh" ? "最高三模态计数" : "Highest modality count",
      value: `${modalityLabel[modalityEntries[0][0]]?.[lang] ?? modalityEntries[0][0]} · ${modalityEntries[0][1]}`,
    });
  }
  const signCounts = new Map<string, number>();
  PLANET_ORDER.map((name) => wheelPoints.find((p) => p.name === name))
    .filter((p): p is BirthChartWheelPoint => !!p)
    .forEach((p) => signCounts.set(p.sign, (signCounts.get(p.sign) ?? 0) + 1));
  const topSign = topEntry(signCounts);
  if (topSign) {
    out.push({
      label: lang === "zh" ? "星体最多星座" : "Most occupied sign",
      value: `${signLabel(topSign.key, lang)} · ${topSign.value}`,
    });
  }
  const topHouse = houses
    .map((house) => ({
      title: house.title,
      value: house.occupants.length,
    }))
    .sort((a, b) => b.value - a.value)[0];
  if (topHouse && topHouse.value > 0) {
    out.push({
      label: lang === "zh" ? "星体最多宫位" : "Most occupied house",
      value: `${topHouse.title} · ${topHouse.value}`,
    });
  }
  const aspectCounts = new Map<string, number>();
  aspects.forEach((aspect) => {
    aspectCounts.set(
      aspect.planet1Label,
      (aspectCounts.get(aspect.planet1Label) ?? 0) + 1,
    );
    aspectCounts.set(
      aspect.planet2Label,
      (aspectCounts.get(aspect.planet2Label) ?? 0) + 1,
    );
  });
  const aspectHub = topEntry(aspectCounts);
  if (aspectHub) {
    out.push({
      label: lang === "zh" ? "相位连接最多星体" : "Most aspected body",
      value: `${aspectHub.key} · ${aspectHub.value}`,
    });
  }
  if (aspects[0]) {
    out.push({
      label: lang === "zh" ? "最紧相位" : "Tightest aspect",
      value: `${aspects[0].planet1Label} ${aspects[0].typeLabel} ${aspects[0].planet2Label} · ${aspects[0].orb.toFixed(2)}°`,
    });
  }
  return out;
}

function calculateTechnicalAspects(positions: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const lonA = absoluteLongitude(positions[i]);
      const lonB = absoluteLongitude(positions[j]);
      if (lonA == null || lonB == null) continue;
      const diff = Math.abs(lonA - lonB);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const [type, config] of Object.entries(TECH_ASPECT_TYPES) as Array<
        [Aspect["type"], { angle: number; orb: number }]
      >) {
        const orb = Math.abs(angle - config.angle);
        if (orb <= config.orb) {
          aspects.push({
            planet1: positions[i].name,
            planet2: positions[j].name,
            type,
            orb: Math.round(orb * 100) / 100,
            isApplying: false,
          });
          break;
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

function buildHouseRulers(
  positions: PlanetPosition[],
): ExtendedNatalData["houseRulers"] {
  const ascendant = positions.find(
    (p) => p.name === "Ascendant" || p.name === "Rising",
  );
  const ascSign = ascendant?.sign;
  const startIndex = ascSign ? SIGN_ORDER.indexOf(ascSign) : -1;
  const houseSigns =
    startIndex >= 0
      ? Array.from(
          { length: 12 },
          (_, i) => SIGN_ORDER[(startIndex + i) % SIGN_ORDER.length],
        )
      : [...SIGN_ORDER];

  return houseSigns.map((sign, index) => {
    const ruler = MODERN_RULERS[sign] || "Unknown";
    const rulerPos = positions.find((p) => p.name === ruler);
    return {
      house: index + 1,
      sign,
      ruler,
      fliesTo: rulerPos?.house ?? 0,
      fliesToSign: rulerPos?.sign,
    };
  });
}

function buildTechnicalData(chart: NatalFacts): ExtendedNatalData {
  const positionsByName = new Map(
    chart.positions.map((pos) => [pos.name, pos]),
  );
  const planets = MAJOR_BODIES.map((name) => positionsByName.get(name)).filter(
    (pos): pos is PlanetPosition => !!pos,
  );
  const asteroids = MINOR_BODIES.map((name) =>
    positionsByName.get(name),
  ).filter((pos): pos is PlanetPosition => !!pos);
  const elements: ExtendedNatalData["elements"] = {};

  ELEMENT_BODIES.forEach((planetName) => {
    const planet = positionsByName.get(planetName);
    if (!planet) return;
    const element = ELEMENT_BY_SIGN[planet.sign];
    const modality = MODALITY_BY_SIGN[planet.sign];
    if (!element || !modality) return;
    elements[element] = elements[element] || {};
    elements[element][modality] = elements[element][modality] || [];
    elements[element][modality].push(planet.name);
  });

  const aspectPositions = ASPECT_BODIES.map((name) =>
    positionsByName.get(name),
  ).filter((pos): pos is PlanetPosition => !!pos);

  return {
    elements,
    planets,
    asteroids,
    houseRulers: buildHouseRulers(chart.positions),
    aspects: calculateTechnicalAspects(aspectPositions),
  };
}

function buildChartProfile(birth: CalculatorBirth): UserProfile {
  return {
    userId: "tool-birth-chart",
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

function buildBirthChartDetails(
  birth: CalculatorBirth,
  chart: NatalFacts,
  lang: Language,
): BirthChartDetails {
  const byName = new Map(chart.positions.map((p) => [p.name, p]));
  const wheelPoints = [...PLANET_ORDER, ...POINT_ORDER]
    .map((name) => byName.get(name))
    .filter((p): p is PlanetPosition => !!p)
    .map((p) => toWheelPoint(p, lang))
    .filter((p): p is BirthChartWheelPoint => !!p);
  const byWheelName = new Map(wheelPoints.map((p) => [p.name, p]));
  const planets = PLANET_ORDER.map((name) => byWheelName.get(name)).filter(
    (p): p is BirthChartWheelPoint => !!p,
  );
  const points = POINT_ORDER.map((name) => byWheelName.get(name)).filter(
    (p): p is BirthChartWheelPoint => !!p,
  );
  const core = ["Sun", "Moon", "Ascendant"]
    .map((name) => byWheelName.get(name))
    .filter((p): p is BirthChartWheelPoint => !!p)
    .map((p) =>
      p.name === "Ascendant"
        ? { ...p, label: lang === "zh" ? "上升" : "Rising" }
        : p,
    );
  const aspects = buildAspects(chart, lang);
  const houses = buildHouses(chart, wheelPoints, lang);
  return {
    birth: {
      date: birth.birthDate,
      time: birth.birthTime,
      city: birth.birthCity,
      timezone: birth.timezone,
      lat: birth.lat,
      lon: birth.lon,
      houseSystem: chart.houseCusps?.length === 12 ? "Placidus" : "No houses",
      zodiac: "Tropical",
    },
    profile: buildChartProfile(birth),
    technical: buildTechnicalData(chart),
    core,
    planets,
    points,
    wheelPoints,
    aspects,
    houses,
    moonPhase: buildMoonPhase(
      byWheelName.get("Sun"),
      byWheelName.get("Moon"),
      lang,
    ),
    signature: buildSignature(wheelPoints, houses, aspects, chart, lang),
    houseCusps: chart.houseCusps ?? [],
  };
}

// 出生数据 → onboarding 真实产品的导流 CTA（复用 prefill envelope）。
function onboardingFunnel(
  birth: CalculatorBirth,
  lang: Language,
  sign: string,
  label: { en: string; zh: string },
  secondaryLinks: CalculatorFunnel["secondaryLinks"],
  note?: { en: string; zh: string },
): CalculatorFunnel {
  return {
    label: lang === "zh" ? label.zh : label.en,
    prefill: birthToPrefill(birth),
    secondaryLinks,
    note: note ? (lang === "zh" ? note.zh : note.en) : undefined,
    sign,
  };
}

// ── Moon Sign（无需出生时间） ─────────────────────────────────────────────────
export const moonSignConfig: CalculatorConfig = {
  idPrefix: "moon-sign",
  slug: "moon-sign-calculator",
  needsTime: false,
  event: "moon_sign_calculated",
  copy: {
    en: {
      title: "Moon Sign Calculator",
      subtitle: "Find your Moon sign — the seat of your emotional instincts.",
      submit: "Find my Moon sign",
    },
    zh: {
      title: "月亮星座计算器",
      subtitle: "查询你的月亮星座——情绪本能与内在世界的所在。",
      submit: "查询我的月亮星座",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    const chart = await natal(birth);
    const moon = findPos(chart.positions, "Moon");
    if (!moon) {
      throw new Error(
        lang === "zh"
          ? "无法计算月亮星座"
          : "Could not determine your Moon sign",
      );
    }
    return {
      headline:
        lang === "zh"
          ? `你的月亮在${signLabel(moon.sign, lang)}`
          : `Your Moon is in ${moon.sign}`,
      heroGlyph: { planet: "Moon", sign: moon.sign },
      placements: [toPlacement(moon, lang)],
      dominance: dominanceOf(chart),
      body:
        lang === "zh"
          ? "月亮星座描述你的情绪本能、安全感来源与照顾自己和他人的方式——这是倾向的写照，不是命运。下方是你整张星盘的元素平衡。"
          : "Your Moon sign describes your emotional instincts, what makes you feel safe, and how you nurture yourself and others — tendencies, not destiny. Below is the element balance of your whole chart.",
      funnel: onboardingFunnel(
        birth,
        lang,
        moon.sign,
        {
          en: "Get your full birth chart reading",
          zh: "查看完整出生星盘解读",
        },
        [
          {
            label: lang === "zh" ? "了解月亮" : "Learn about the Moon",
            href: "/wiki/moon",
          },
        ],
        {
          en: "Your Moon is one piece of the picture. See every placement, house, and aspect in your full chart.",
          zh: "月亮只是其中一块。在完整星盘里看到每个落座、宫位与相位。",
        },
      ),
    };
  },
};

// ── Rising / Ascendant（需出生时间 + 城市） ──────────────────────────────────
export const risingSignConfig: CalculatorConfig = {
  idPrefix: "rising-sign",
  slug: "rising-sign-calculator",
  needsTime: true,
  event: "rising_sign_calculated",
  copy: {
    en: {
      title: "Rising Sign (Ascendant) Calculator",
      subtitle: "Find your rising sign — the mask you meet the world with.",
      submit: "Find my rising sign",
    },
    zh: {
      title: "上升星座计算器",
      subtitle: "查询你的上升星座——你面对世界时的姿态。",
      submit: "查询我的上升星座",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    if (!birth.birthTime) {
      throw new Error(
        lang === "zh"
          ? "上升星座需要精确出生时间"
          : "Rising sign needs an exact birth time",
      );
    }
    const chart = await natal(birth);
    const asc = findPos(chart.positions, "Ascendant");
    if (!asc) {
      throw new Error(
        lang === "zh"
          ? "无法计算上升星座"
          : "Could not determine your rising sign",
      );
    }
    const sun = findPos(chart.positions, "Sun");
    const moon = findPos(chart.positions, "Moon");
    const placements = [asc, sun, moon]
      .filter((p): p is PlanetPosition => !!p)
      .map((p) => toPlacement(p, lang));
    return {
      headline:
        lang === "zh"
          ? `你的上升星座是${signLabel(asc.sign, lang)}`
          : `Your rising sign is ${asc.sign}`,
      heroGlyph: { planet: "Ascendant", sign: asc.sign },
      placements,
      body:
        lang === "zh"
          ? "上升星座是你出生那一刻东方地平线升起的星座，常描述第一印象与你接近世界的方式。它对出生时间高度敏感，所以准确时间很重要。"
          : "Your rising sign is the zodiac sign on the eastern horizon at your birth moment — often describing first impressions and how you approach the world. It is sensitive to birth time, so accuracy matters.",
      funnel: onboardingFunnel(
        birth,
        lang,
        asc.sign,
        { en: "See your full birth chart", zh: "查看完整出生星盘" },
        [
          {
            label: lang === "zh" ? "上升是什么" : "What the Ascendant means",
            href: "/wiki/ascendant",
          },
          {
            label:
              lang === "zh"
                ? `了解${signLabel(asc.sign, lang)}`
                : `Read about ${asc.sign}`,
            href: signHref(asc.sign),
          },
        ],
      ),
    };
  },
};

// ── Big Three（Sun / Moon / Rising） ─────────────────────────────────────────
export const bigThreeConfig: CalculatorConfig = {
  idPrefix: "big-three",
  slug: "big-three-calculator",
  needsTime: true,
  event: "big_three_calculated",
  copy: {
    en: {
      title: "Big Three Calculator (Sun, Moon & Rising)",
      subtitle: "Your core trio — identity, emotion, and outer style.",
      submit: "Find my Big Three",
    },
    zh: {
      title: "日月升计算器（太阳·月亮·上升）",
      subtitle: "你的核心三角——身份、情绪与外在风格。",
      submit: "查询我的日月升",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    const chart = await natal(birth);
    const sun = findPos(chart.positions, "Sun");
    const moon = findPos(chart.positions, "Moon");
    const asc = findPos(chart.positions, "Ascendant");
    if (!sun || !moon) {
      throw new Error(
        lang === "zh" ? "无法计算" : "Could not compute your chart",
      );
    }
    const placements = [sun, moon, asc]
      .filter((p): p is PlanetPosition => !!p)
      .map((p) => toPlacement(p, lang));
    return {
      headline: lang === "zh" ? "你的日月升" : "Your Big Three",
      placements,
      dominance: dominanceOf(chart),
      body: asc
        ? lang === "zh"
          ? "太阳=核心身份与意志，月亮=情绪与本能，上升=他人初见的你。这是倾向的描述，不是预测。"
          : "Sun = core identity and will, Moon = emotion and instinct, Rising = how others first meet you. These describe tendencies, not predictions."
        : lang === "zh"
          ? "已找到太阳与月亮。上升依赖精确出生时间——填入出生时间即可解锁你的上升星座。"
          : "Found your Sun and Moon. Rising needs an exact birth time — add yours to unlock your Ascendant.",
      funnel: onboardingFunnel(
        birth,
        lang,
        sun.sign,
        {
          en: "See your full chart and personalized reading",
          zh: "查看完整星盘与个性化解读",
        },
        [
          { label: lang === "zh" ? "太阳" : "Sun", href: "/wiki/sun" },
          { label: lang === "zh" ? "月亮" : "Moon", href: "/wiki/moon" },
          {
            label: lang === "zh" ? "上升" : "Ascendant",
            href: "/wiki/ascendant",
          },
        ],
      ),
    };
  },
};

// ── Birth Chart（全位置概览） ─────────────────────────────────────────────────
const CHART_ORDER = [...PLANET_ORDER, "Ascendant", "Midheaven"];

export const birthChartConfig: CalculatorConfig = {
  idPrefix: "birth-chart",
  slug: "birth-chart-calculator",
  needsTime: false,
  event: "birth_chart_calculated",
  copy: {
    en: {
      title: "Free Birth Chart Calculator",
      subtitle: "Your natal placements at a glance — Swiss Ephemeris accuracy.",
      submit: "Calculate my birth chart",
    },
    zh: {
      title: "免费出生星盘计算器",
      subtitle: "一览你的本命行星落座——Swiss Ephemeris 精度。",
      submit: "生成我的出生星盘",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    const chart = await natal(birth);
    const byName = new Map(chart.positions.map((p) => [p.name, p]));
    const placements = CHART_ORDER.filter((n) => byName.has(n)).map((n) =>
      toPlacement(byName.get(n) as PlanetPosition, lang),
    );
    if (placements.length === 0) {
      throw new Error(
        lang === "zh" ? "无法计算星盘" : "Could not compute your chart",
      );
    }
    const sun = byName.get("Sun");
    const birthChart = buildBirthChartDetails(birth, chart, lang);
    return {
      headline: lang === "zh" ? "你的出生星盘" : "Your Birth Chart",
      placements,
      dominance: dominanceOf(chart),
      birthChart,
      funnel: onboardingFunnel(
        birth,
        lang,
        sun?.sign ?? "",
        {
          en: "Save this chart data",
          zh: "保存这份星盘数据",
        },
        [
          {
            label: lang === "zh" ? "出生星盘资料页" : "Birth chart reference",
            href: "/wiki/how-to-read-birth-chart",
          },
        ],
        {
          en: "The calculator result above is data only: placements, aspects, houses, and counts.",
          zh: "上方结果只展示数据：落座、相位、宫位与计数。",
        },
      ),
    };
  },
};
