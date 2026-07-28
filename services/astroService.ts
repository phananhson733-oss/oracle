// INPUT: 后端 API 调用与星盘衍生数据构建（含宫主星飞入星座补齐与四轴相位扩展同步）。
// OUTPUT: 导出星盘与周期计算函数（含宫主星飞入星座与扩展相位矩阵）。
// POS: 占星计算服务层。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { NatalFacts, NatalHighlights, UserProfile, PartnerProfile, SynastryProfile, ExtendedNatalData, Aspect, PlanetPosition } from '../types';
import { fetchDailyForecast, fetchNatalChart, fetchCycleList, fetchSynastry } from './apiClient';
import { TECH_DATA } from '../constants';

type BirthProfile = UserProfile | SynastryProfile;

const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const MAJOR_BODIES = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Ascendant',
  'Descendant',
  'Midheaven',
  'IC',
] as const;

const ASPECT_BODIES = [...MAJOR_BODIES, 'North Node'] as const;

const ELEMENT_BODIES = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

const MINOR_BODIES = [
  'Chiron',
  'Ceres',
  'Pallas',
  'Juno',
  'Vesta',
  'North Node',
  'South Node',
  'Lilith',
  'Fortune',
  'Vertex',
  'East Point',
] as const;

const MODERN_RULERS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Pluto',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Uranus',
  Pisces: 'Neptune',
};

const ASPECT_TYPES: Record<Aspect['type'], { angle: number; orb: number }> = {
  conjunction: { angle: 0, orb: 8 },
  opposition: { angle: 180, orb: 8 },
  square: { angle: 90, orb: 7 },
  trine: { angle: 120, orb: 7 },
  sextile: { angle: 60, orb: 5 },
};

const toLongitude = (pos: PlanetPosition) => {
  const signIndex = SIGN_ORDER.indexOf(pos.sign);
  if (signIndex < 0) return 0;
  return signIndex * 30 + pos.degree + (pos.minute || 0) / 60;
};

const calculateAspectsBetween = (positions: PlanetPosition[]): Aspect[] => {
  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];
      const p1Deg = toLongitude(p1);
      const p2Deg = toLongitude(p2);
      const diff = Math.abs(p1Deg - p2Deg);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const [type, config] of Object.entries(ASPECT_TYPES) as Array<[Aspect['type'], { angle: number; orb: number }]>) {
        if (Math.abs(angle - config.angle) <= config.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type,
            orb: Math.round(Math.abs(angle - config.angle) * 100) / 100,
            isApplying: false,
          });
          break;
        }
      }
    }
  }
  return aspects;
};

export const calculateNatalChart = async (profile: BirthProfile): Promise<NatalFacts> => {
  return fetchNatalChart(profile);
};

export const calculateExtendedNatalData = async (profile: BirthProfile): Promise<ExtendedNatalData> => {
  const chart = await fetchNatalChart(profile);
  const elements: Record<string, Record<string, string[]>> = {};
  const positionsByName = new Map(chart.positions.map((pos) => [pos.name, pos]));
  const planets = MAJOR_BODIES
    .map((name) => positionsByName.get(name))
    .filter(Boolean) as PlanetPosition[];
  const asteroids = MINOR_BODIES
    .map((name) => positionsByName.get(name))
    .filter(Boolean) as PlanetPosition[];
  const ascendant = chart.positions.find(pos => pos.name === 'Ascendant' || pos.name === 'Rising');
  const ascSign = ascendant?.sign;
  const startIndex = ascSign ? SIGN_ORDER.indexOf(ascSign) : -1;
  const houseSigns = startIndex >= 0
    ? Array.from({ length: 12 }, (_, i) => SIGN_ORDER[(startIndex + i) % SIGN_ORDER.length])
    : [...SIGN_ORDER];
  const houseRulers = houseSigns.map((sign, index) => {
    const ruler = MODERN_RULERS[sign] || 'Unknown';
    const rulerPos = chart.positions.find(pos => pos.name === ruler);
    return {
      house: index + 1,
      sign,
      ruler,
      fliesTo: rulerPos?.house ?? 0,
      fliesToSign: rulerPos?.sign,
    };
  });

  ELEMENT_BODIES.forEach((planetName) => {
    const planet = positionsByName.get(planetName);
    if (!planet) return;
    const signMeta = TECH_DATA.SIGNS[planet.sign as keyof typeof TECH_DATA.SIGNS];
    if (!signMeta) return;
    const element = signMeta.element;
    const modality = signMeta.modality;
    elements[element] = elements[element] || {};
    elements[element][modality] = elements[element][modality] || [];
    elements[element][modality].push(planet.name);
  });

  const aspectPositions = ASPECT_BODIES
    .map((name) => positionsByName.get(name))
    .filter(Boolean) as PlanetPosition[];
  const aspects = calculateAspectsBetween(aspectPositions);

  return {
    elements,
    planets,
    asteroids,
    houseRulers,
    aspects,
  };
};

export const buildNatalHighlights = (facts: NatalFacts, profile: UserProfile): NatalHighlights => {
  const topAspects = facts.aspects.filter(a => a.orb < 3).map(a => `${a.planet1} ${a.type} ${a.planet2}`);
  return {
    dominance: `${facts.dominance?.elements ? Object.entries(facts.dominance.elements).sort((a, b) => b[1] - a[1])[0][0] : 'Unknown'} dominant`,
    topPlanets: [facts.positions[0]?.sign + ' Sun', facts.positions[1]?.sign + ' Moon'].filter(Boolean),
    topAspects: topAspects.slice(0, 5),
    sensitivity: facts.aspects.find(a => a.planet1 === 'Moon' || a.planet2 === 'Moon')
      ? `Moon aspect: ${facts.aspects.find(a => a.planet1 === 'Moon' || a.planet2 === 'Moon')?.type}`
      : 'Moon patterns present',
    relatingStyle: 'Venus in ' + facts.positions.find(p => p.name === 'Venus')?.sign,
    workStyle: 'Mercury in ' + facts.positions.find(p => p.name === 'Mercury')?.sign,
    confidenceBase: profile.accuracyLevel,
  };
};

export const getDimensionSignals = (dimKey: string, facts: NatalFacts) => {
  const findPlanet = (name: string) => facts.positions.find(p => p.name === name);
  const findAspects = (planet: string) => facts.aspects.filter(a => a.planet1 === planet || a.planet2 === planet);

  switch (dimKey) {
    case 'Emotions':
      return { moon_sign: findPlanet('Moon')?.sign, moon_aspects: findAspects('Moon').map(a => `${a.planet1} ${a.type} ${a.planet2}`) };
    case 'Sabotage':
      return { saturn_aspects: findAspects('Saturn').map(a => `${a.planet1} ${a.type} ${a.planet2}`), pluto_aspects: findAspects('Pluto').map(a => `${a.planet1} ${a.type} ${a.planet2}`) };
    case 'Attachment':
      return { venus_sign: findPlanet('Venus')?.sign, venus_aspects: findAspects('Venus').map(a => `${a.planet1} ${a.type} ${a.planet2}`) };
    case 'Coping':
      return { mars_sign: findPlanet('Mars')?.sign, saturn_aspects: findAspects('Saturn').map(a => `${a.planet1} ${a.type} ${a.planet2}`) };
    case 'Talents':
      return { jupiter_sign: findPlanet('Jupiter')?.sign };
    case 'Lessons':
      return { saturn_sign: findPlanet('Saturn')?.sign };
    default:
      return { sun_sign: findPlanet('Sun')?.sign, dominant_element: facts.dominance?.elements ? Object.entries(facts.dominance.elements).sort((a, b) => b[1] - a[1])[0][0] : 'Unknown' };
  }
};

export const calculateDailyTransits = async (date: string, profile: UserProfile) => {
  const result = await fetchDailyForecast(profile, date);
  return result.transits;
};

// 获取指定日期的行运行星位置（用于行运盘外环）
export const getTransitPositions = async (date: string, profile: UserProfile): Promise<PlanetPosition[]> => {
  const result = await fetchDailyForecast(profile, date);
  // 后端返回格式: { transits: { positions, aspects, ... }, ... }
  return result.transits?.positions || [];
};

// 获取指定日期的行运数据（包括位置和跨盘相位）
export const getTransitData = async (date: string, profile: UserProfile): Promise<{
  positions: PlanetPosition[];
  aspects: Aspect[];
}> => {
  const result = await fetchDailyForecast(profile, date);
  // 后端返回格式: { transits: { positions, aspects, moonPhase }, ... }
  // aspects 格式: { planet1: 'T-Sun', planet2: 'N-Moon', type, orb, isApplying }
  return {
    positions: result.transits?.positions || [],
    aspects: result.transits?.aspects || [],
  };
};

export const calculateCycles = async (range: number, profile: UserProfile) => {
  const result = await fetchCycleList(profile, range);
  return result.cycles || [];
};

export const calculateSynastry = async (profileA: BirthProfile, profileB: UserProfile | PartnerProfile | SynastryProfile) => {
  const result = await fetchSynastry(profileA, profileB);
  return result;
};

export const getSynastryDimensionSignals = (dim: string, facts: { interAspects?: string[]; relationshipType?: string }) => {
  return { dimension: dim, relevant_aspects: facts.interAspects?.slice(0, 2) || [], relationshipType: facts.relationshipType };
};
