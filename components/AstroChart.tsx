// INPUT: React、星盘数据与星体配色配置（含 1280px 画布对齐、宫头标注沿星座环排布并拉开度分间距、北交点跨盘相位补全）。
// OUTPUT: 导出星盘可视化组件（含分层相位渲染、配置驱动显示与主题支持，双人盘补齐北交点相位线）。
// POS: 主应用星盘绘制组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { UserProfile, PartnerProfile, PlanetPosition, Aspect, ChartConfig, DualWheelConfig, AspectSettings } from '../types';
import { useTheme } from './UIComponents';
import { PlanetTooltip, HouseRuler } from './PlanetTooltip';
import {
  TECH_DATA,
  PLANET_SVG_PATHS,
  MAJOR_PLANETS,
  ASPECT_COLORS,
  VISUAL_LAYER_STYLES,
  NATAL_CONFIG,
  COMPOSITE_CONFIG,
  SYNASTRY_CONFIG,
  TRANSIT_CONFIG,
} from '../constants';
import * as Astro from '../services/astroService';

interface AstroChartProps {
  type: 'natal' | 'transit' | 'synastry' | 'composite';
  profile: UserProfile;
  partnerProfile?: PartnerProfile | UserProfile;
  title?: string;
  className?: string;
  scale?: number;
  compactSpacing?: boolean;
  config?: ChartConfig | DualWheelConfig;
  legendLabels?: { square: string; trine: string; sextile: string; conjunction: string; opposition: string };
  loadingLabel?: string;
  errorLabel?: string;
  /** When provided, only show planets whose names are in this list */
  visiblePlanets?: string[];
}

const PLANET_META: Record<string, { glyph: string; color: string }> = Object.fromEntries(
  Object.entries(TECH_DATA.PLANETS).map(([name, meta]) => [name, { glyph: meta.glyph, color: meta.color }])
);

// --- GEOMETRY HELPERS ---
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const OUTER_PREFIX_RE = /^(T-|B-)/;
const stripOuterPrefix = (name: string) => name.replace(OUTER_PREFIX_RE, '');

const getAbsoluteAngle = (sign: string, degree: number, minute: number = 0) => {
  const signIndex = SIGN_NAMES.indexOf(sign);
  return (signIndex * 30) + degree + (minute || 0) / 60;
};

const getCoords = (angleDeg: number, radius: number, cx = 200, cy = 200) => {
  const rad = angleDeg * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
};

// --- PLANET COLLISION AVOIDANCE ---
// 计算两个角度之间的最小差值（考虑360度循环）
const angleDiff = (a: number, b: number): number => {
  let diff = ((b - a + 180) % 360) - 180;
  return diff < -180 ? diff + 360 : diff;
};

// 规范化角度到 0-360 范围
const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

// 行星防重叠算法：角度偏移方案
// 检测度数接近的行星簇，将它们均匀分布开
interface PlanetWithAngles {
  absAngle: number;
  visualAngle: number;
  [key: string]: unknown;
}

const spreadPlanets = <T extends PlanetWithAngles>(
  planets: T[],
  minSpacing: number = 8 // 最小间距（度）- 降低以避免过度偏移
): T[] => {
  if (planets.length <= 1) return planets;

  // 最大偏移限制：不超过 minSpacing 的 1.5 倍
  const maxOffset = minSpacing * 1.5;

  // 复制并按角度排序
  const sorted = [...planets].map(p => ({ ...p }));
  sorted.sort((a, b) => a.absAngle - b.absAngle);

  // 检测并展开簇
  let iterations = 0;
  const maxIterations = 30; // 防止无限循环
  let hasOverlap = true;

  while (hasOverlap && iterations < maxIterations) {
    hasOverlap = false;
    iterations++;

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const next = sorted[(i + 1) % sorted.length];

      // 计算当前视觉角度差
      let diff = angleDiff(current.visualAngle, next.visualAngle);
      if (i === sorted.length - 1) {
        // 最后一个和第一个之间需要考虑 360 度循环
        diff = 360 + diff;
        if (diff > 360) diff -= 360;
      }

      if (Math.abs(diff) < minSpacing && Math.abs(diff) > 0) {
        hasOverlap = true;
        // 将两个行星向相反方向推开，但限制推开量
        const pushAmount = Math.min((minSpacing - Math.abs(diff)) / 2 + 0.3, 2);

        // 检查是否超过最大偏移限制
        const currentOffset = Math.abs(angleDiff(current.absAngle, current.visualAngle));
        const nextOffset = Math.abs(angleDiff(next.absAngle, next.visualAngle));

        if (currentOffset + pushAmount <= maxOffset) {
          current.visualAngle = normalizeAngle(current.visualAngle - pushAmount);
        }
        if (nextOffset + pushAmount <= maxOffset) {
          next.visualAngle = normalizeAngle(next.visualAngle + pushAmount);
        }
      }
    }

    // 重新排序以处理可能的顺序变化
    sorted.sort((a, b) => a.visualAngle - b.visualAngle);
  }

  // 创建原始顺序的映射
  const result: T[] = [];
  for (const original of planets) {
    const spread = sorted.find(s => s.absAngle === original.absAngle);
    if (spread) {
      result.push({ ...original, visualAngle: spread.visualAngle } as T);
    } else {
      result.push({ ...original });
    }
  }

  return result;
};

// Filter planets based on configuration
// 本命盘显示：10大行星 + ASC + MC + 北交点 = 13个天体（相位计算可包含 IC/Desc）
// 支持外环行星（带 T-/B- 前缀）的过滤
const filterPlanets = (
  planets: PlanetPosition[],
  config: ChartConfig,
  options: { includeAllAngles?: boolean } = {}
): PlanetPosition[] => {
  const { celestialBodies } = config;
  const { includeAllAngles = false } = options;
  return planets.filter(p => {
    // 提取基础名称（去掉外环前缀）
    const baseName = stripOuterPrefix(p.name);
    // 10 major planets
    if (MAJOR_PLANETS.includes(baseName)) return celestialBodies.planets;
    // Only show ASC and MC by default (keep IC/Desc for aspect calculations when requested)
    if (['Ascendant', 'Rising', 'Midheaven', 'MC'].includes(baseName)) return celestialBodies.angles;
    if (['Descendant', 'IC'].includes(baseName)) return celestialBodies.angles && includeAllAngles;
    // Only show North Node (not South Node)
    if (baseName === 'North Node') return celestialBodies.nodes;
    // Hidden by default
    if (baseName === 'Chiron') return celestialBodies.chiron;
    if (baseName === 'Lilith') return celestialBodies.lilith;
    if (['Juno', 'Vesta', 'Ceres', 'Pallas'].includes(baseName)) return celestialBodies.asteroids;
    return false; // Hide anything not explicitly listed
  });
};

// Filter aspects based on configuration
const filterAspects = (aspects: Aspect[], aspectConfig: Partial<AspectSettings>): Aspect[] => {
  return aspects.filter(a => {
    const setting = aspectConfig[a.type as keyof AspectSettings];
    if (!setting || !setting.enabled) return false;
    return Math.abs(a.orb) <= setting.orb;
  });
};

const ASPECT_ANGLES: Record<Aspect['type'], number> = {
  conjunction: 0,
  opposition: 180,
  square: 90,
  trine: 120,
  sextile: 60,
};

const ASPECT_ORDER: Aspect['type'][] = ['conjunction', 'opposition', 'square', 'trine', 'sextile'];

const calculateAspectsFromAngles = (
  positions: Array<PlanetPosition & { absAngle?: number }>,
  aspectConfig: Partial<AspectSettings>
): Aspect[] => {
  const aspects: Aspect[] = [];

  const getAngle = (pos: PlanetPosition & { absAngle?: number }) =>
    normalizeAngle(pos.absAngle ?? getAbsoluteAngle(pos.sign, pos.degree, pos.minute));

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];
      const p1Angle = getAngle(p1);
      const p2Angle = getAngle(p2);
      const diff = Math.abs(p1Angle - p2Angle);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const type of ASPECT_ORDER) {
        const setting = aspectConfig[type as keyof AspectSettings];
        if (!setting?.enabled) continue;
        const aspectAngle = ASPECT_ANGLES[type];
        if (Math.abs(angle - aspectAngle) <= setting.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type,
            orb: Math.round(Math.abs(angle - aspectAngle) * 100) / 100,
            isApplying: false,
          });
          break;
        }
      }
    }
  }

  return aspects;
};

const calculateCrossAspectsFromAngles = (
  innerPositions: Array<PlanetPosition & { absAngle?: number }>,
  outerPositions: Array<PlanetPosition & { absAngle?: number }>,
  aspectConfig: Partial<AspectSettings>
): Aspect[] => {
  const aspects: Aspect[] = [];
  if (innerPositions.length === 0 || outerPositions.length === 0) return aspects;

  const getAngle = (pos: PlanetPosition & { absAngle?: number }) =>
    normalizeAngle(pos.absAngle ?? getAbsoluteAngle(pos.sign, pos.degree, pos.minute));

  for (let i = 0; i < innerPositions.length; i++) {
    for (let j = 0; j < outerPositions.length; j++) {
      const p1 = innerPositions[i];
      const p2 = outerPositions[j];
      const p1Angle = getAngle(p1);
      const p2Angle = getAngle(p2);
      const diff = Math.abs(p1Angle - p2Angle);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const type of ASPECT_ORDER) {
        const setting = aspectConfig[type as keyof AspectSettings];
        if (!setting?.enabled) continue;
        const aspectAngle = ASPECT_ANGLES[type];
        if (Math.abs(angle - aspectAngle) <= setting.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type,
            orb: Math.round(Math.abs(angle - aspectAngle) * 100) / 100,
            isApplying: false,
          });
          break;
        }
      }
    }
  }

  return aspects;
};

// Determine aspect layer based on orb
type AspectLayer = 'foreground' | 'midground' | 'background';
const getAspectLayer = (aspect: Aspect, config: ChartConfig): AspectLayer => {
  const { visualLayers } = config;
  const orb = Math.abs(aspect.orb);

  // 所有相位类型都根据 orb 值分层，不再区分 tense/soft
  if (orb <= visualLayers.highlightThreshold) {
    return 'foreground';  // orb ≤ 2° = 前景（最亮）
  } else if (orb <= visualLayers.midgroundThreshold) {
    return 'midground';   // 2° < orb ≤ 4° = 中景
  }
  return 'background';    // orb > 4° = 背景
};

// Check if aspect involves luminaries (Sun, Moon, ASC)
const isLuminaryAspect = (aspect: Aspect): boolean => {
  const luminaries = ['Sun', 'Moon', 'Ascendant', 'Rising'];
  const p1 = stripOuterPrefix(aspect.planet1);
  const p2 = stripOuterPrefix(aspect.planet2);
  return luminaries.includes(p1) || luminaries.includes(p2);
};

// Check if aspect is between outer planets only
const isOuterPlanetOnlyAspect = (aspect: Aspect): boolean => {
  const outerPlanets = ['Uranus', 'Neptune', 'Pluto'];
  const p1 = stripOuterPrefix(aspect.planet1);
  const p2 = stripOuterPrefix(aspect.planet2);
  return outerPlanets.includes(p1) && outerPlanets.includes(p2);
};

const isNorthNodeAspect = (aspect: Aspect): boolean => {
  const p1 = stripOuterPrefix(aspect.planet1);
  const p2 = stripOuterPrefix(aspect.planet2);
  return p1 === 'North Node' || p2 === 'North Node';
};

const mergeAspectsByKey = (primary: Aspect[], secondary: Aspect[]): Aspect[] => {
  const map = new Map<string, Aspect>();
  const makeKey = (aspect: Aspect) => {
    const [left, right] = [aspect.planet1, aspect.planet2].sort();
    return `${left}|${right}|${aspect.type}`;
  };
  primary.forEach((aspect) => map.set(makeKey(aspect), aspect));
  secondary.forEach((aspect) => {
    const key = makeKey(aspect);
    if (!map.has(key)) map.set(key, aspect);
  });
  return Array.from(map.values());
};


export const AstroChart: React.FC<AstroChartProps> = ({
  type,
  profile,
  partnerProfile,
  title,
  className = "",
  scale = 1,
  compactSpacing = false,
  config,
  legendLabels,
  loadingLabel,
  errorLabel,
  visiblePlanets,
}) => {
  const { theme } = useTheme();

  // Get appropriate config based on chart type
  const chartConfig = useMemo(() => {
    if (config) return config;
    switch (type) {
      case 'natal': return NATAL_CONFIG;
      case 'composite': return COMPOSITE_CONFIG;
      case 'synastry': return SYNASTRY_CONFIG;
      case 'transit': return TRANSIT_CONFIG;
      default: return NATAL_CONFIG;
    }
  }, [type, config]);

  // Extract single chart config (for single wheel) or inner config (for dual wheel)
  const singleConfig: ChartConfig = useMemo(() => {
    if ('inner' in chartConfig) {
      return chartConfig.inner;
    }
    return chartConfig as ChartConfig;
  }, [chartConfig]);

  const [chartData, setChartData] = useState<{
    inner: Array<PlanetPosition & { absAngle: number; visualAngle: number }>;
    innerDisplay: Array<PlanetPosition & { absAngle: number; visualAngle: number }>;
    outer: Array<PlanetPosition & { absAngle: number; visualAngle: number }>;
    aspects: Aspect[];
  } | null>(null);
  const [ascendantOffset, setAscendantOffset] = useState(0);
  const [ascendantLongitude, setAscendantLongitude] = useState(0);
  // Placidus 宫位制的12个宫头黄道经度
  const [houseCusps, setHouseCusps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Hover tooltip state
  const [hoveredPlanet, setHoveredPlanet] = useState<(PlanetPosition & { absAngle: number }) | null>(null);
  const [hoveredIsOuter, setHoveredIsOuter] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Mouse event handlers for planet hover
  const handlePlanetMouseEnter = useCallback((
    planet: PlanetPosition & { absAngle: number },
    isOuter: boolean,
    event: React.MouseEvent
  ) => {
    setHoveredPlanet(planet);
    setHoveredIsOuter(isOuter);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handlePlanetMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handlePlanetMouseLeave = useCallback(() => {
    setHoveredPlanet(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const factsA = await Astro.calculateNatalChart(profile);
        const ascPlanet = factsA.positions.find(p => p.name === 'Ascendant') || factsA.positions.find(p => p.name === 'Rising');
        const ascAngle = ascPlanet ? getAbsoluteAngle(ascPlanet.sign, ascPlanet.degree, ascPlanet.minute) : 0;
        const rotation = normalizeAngle(180 + ascAngle);

        const processPlanets = (positions: PlanetPosition[]) => {
          return positions.map(p => {
            const absAngle = getAbsoluteAngle(p.sign, p.degree, p.minute);
            return { ...p, absAngle, visualAngle: absAngle };
          });
        };

        let planetsA = processPlanets(factsA.positions);
        let planetsB: ReturnType<typeof processPlanets> = [];
        let crossAspects: Aspect[] = [];
        const isBiWheelChart = type === 'synastry' || type === 'transit';

        if (type === 'transit') {
          // 获取今日行运数据（包括位置和跨盘相位）
          const today = new Date().toISOString().split('T')[0];
          let transitData: { positions: PlanetPosition[]; aspects: Aspect[] } = { positions: [], aspects: [] };
          try {
            transitData = await Astro.getTransitData(today, profile as UserProfile);
          } catch {
            console.warn('行运数据获取失败');
          }

          // 如果 API 返回空数据或失败，使用模拟位置
          if (transitData.positions && transitData.positions.length > 0) {
            planetsB = processPlanets(transitData.positions).map(p => ({
              ...p,
              name: `T-${p.name}`,
            }));
            // 添加跨盘相位（T-行星 与 N-行星 的相位）
            // 将 N-前缀转换为无前缀（与前端内环行星名称匹配）
            const stripNatalPrefix = (name: string) => name.replace(/^N-/, '');
            crossAspects = transitData.aspects.map(a => ({
              ...a,
              planet1: stripNatalPrefix(a.planet1),
              planet2: stripNatalPrefix(a.planet2),
            }));
          } else {
            console.warn('行运数据为空，使用模拟位置');
            // 模拟当日行运位置（基于本命盘偏移）
            planetsB = planetsA.map((p, i) => ({
              ...p,
              name: `T-${p.name}`,
              absAngle: (p.absAngle + 120 + i * 8) % 360,
              visualAngle: (p.absAngle + 120 + i * 8) % 360
            }));
          }

          // Filter outer planets based on dual wheel config
          if ('outer' in chartConfig && chartConfig.outer.celestialBodies) {
            const outerConfig = { ...singleConfig, celestialBodies: chartConfig.outer.celestialBodies };
            planetsB = filterPlanets(planetsB, outerConfig) as typeof planetsB;
          }
        } else if (type === 'synastry' && partnerProfile) {
          const factsB = await Astro.calculateNatalChart(partnerProfile);
          planetsB = processPlanets(factsB.positions).map(p => ({
            ...p,
            name: `B-${p.name}`,
          }));
          if ('outer' in chartConfig && chartConfig.outer.celestialBodies) {
            const outerConfig = { ...singleConfig, celestialBodies: chartConfig.outer.celestialBodies };
            planetsB = filterPlanets(planetsB, outerConfig) as typeof planetsB;
          }
        } else if (type === 'composite' && partnerProfile) {
          const factsB = await Astro.calculateNatalChart(partnerProfile);
          const rawB = processPlanets(factsB.positions);
          planetsA.forEach((pA) => {
            const pB = rawB.find(x => x.name === pA.name);
            if (pB) {
              let mid = (pA.absAngle + pB.absAngle) / 2;
              if (Math.abs(pA.absAngle - pB.absAngle) > 180) mid += 180;
              pA.absAngle = mid % 360;
              pA.visualAngle = mid % 360;
            }
          });
        }

        const innerAspectPlanets = filterPlanets(planetsA, singleConfig, { includeAllAngles: true }) as typeof planetsA;
        let innerDisplayPlanets = filterPlanets(planetsA, singleConfig) as typeof planetsA;

        // Apply visiblePlanets filter if provided
        // visiblePlanets can contain:
        // - "Saturn" for natal planets (inner ring)
        // - "T-Saturn" for transit planets (outer ring)
        if (visiblePlanets && visiblePlanets.length > 0) {
          const visibleSet = new Set(visiblePlanets.map(n => n.toLowerCase()));

          // For inner planets (natal): check if the base name is in visiblePlanets (without T- prefix)
          innerDisplayPlanets = innerDisplayPlanets.filter(p => {
            const baseName = stripOuterPrefix(p.name).toLowerCase();
            // Match if visibleSet contains the base name directly (e.g., "saturn")
            // This means the text mentioned a natal planet or a planet without explicit transit/natal prefix
            return visibleSet.has(baseName) || visibleSet.has(p.name.toLowerCase());
          });

          // For outer planets (transit/synastry): check if T-{baseName} is in visiblePlanets
          if (planetsB.length > 0) {
            planetsB = planetsB.filter(p => {
              const baseName = stripOuterPrefix(p.name).toLowerCase();
              const withPrefix = p.name.toLowerCase(); // e.g., "t-saturn"
              // Match if visibleSet contains:
              // - The full prefixed name (e.g., "t-saturn") - explicit transit mention
              // - OR the base name (e.g., "saturn") if no explicit transit version exists
              //   (backward compatibility for texts that don't distinguish transit/natal)
              const hasExplicitTransit = visibleSet.has(withPrefix);
              const hasBaseName = visibleSet.has(baseName);
              // Only show if explicitly mentioned as transit, OR if base name exists but no explicit categorization
              return hasExplicitTransit || (hasBaseName && !visibleSet.has(`t-${baseName}`));
            });
          }
        }

        const crossAspectConfig = 'crossAspects' in chartConfig ? chartConfig.crossAspects : singleConfig.aspects;
        const computedCrossAspects = isBiWheelChart
          ? calculateCrossAspectsFromAngles(innerAspectPlanets, planetsB, crossAspectConfig)
          : [];
        const mergedCrossAspects = isBiWheelChart && crossAspects.length > 0
          ? mergeAspectsByKey(crossAspects, computedCrossAspects.filter(isNorthNodeAspect))
          : computedCrossAspects;
        let filteredAspects = isBiWheelChart
          ? filterAspects(mergedCrossAspects, crossAspectConfig)
          : filterAspects(calculateAspectsFromAngles(innerAspectPlanets, singleConfig.aspects), singleConfig.aspects);

        // Filter aspects to only include those between visible planets
        // Support both prefixed (T-Saturn) and non-prefixed (Saturn) planet names
        if (visiblePlanets && visiblePlanets.length > 0) {
          const visibleSet = new Set(visiblePlanets.map(n => n.toLowerCase()));

          const isPlanetVisible = (planetName: string): boolean => {
            const fullName = planetName.toLowerCase();
            const baseName = stripOuterPrefix(planetName).toLowerCase();
            const isTransit = fullName.startsWith('t-') || fullName.startsWith('b-');

            if (isTransit) {
              // For transit planets: check if T-{baseName} or just {baseName} is visible
              return visibleSet.has(fullName) || (visibleSet.has(baseName) && !visibleSet.has(`t-${baseName}`));
            } else {
              // For natal planets: check if {baseName} is visible
              return visibleSet.has(baseName);
            }
          };

          filteredAspects = filteredAspects.filter(a => isPlanetVisible(a.planet1) && isPlanetVisible(a.planet2));
        }

        if (mounted) {
          // 应用行星防重叠算法
          const spreadInner = spreadPlanets(innerDisplayPlanets, isBiWheelChart ? 10 : 12);
          const spreadOuter = planetsB.length > 0 ? spreadPlanets(planetsB, 10) : planetsB;

          setChartData({ inner: innerAspectPlanets, innerDisplay: spreadInner, outer: spreadOuter, aspects: filteredAspects });
          setAscendantOffset(rotation);
          setAscendantLongitude(ascAngle);
          // 保存 Placidus 宫头数据
          setHouseCusps(factsA.houseCusps || []);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setChartData(null);
          setLoading(false);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [type, profile, partnerProfile, singleConfig, chartConfig]);

  // -- Visual Theme Config --
  const isDark = theme === 'dark';

  // Celestial color palette
  const colors = useMemo(() => ({
    // Background & Structure
    bgGradientStart: isDark ? '#0a0e1a' : '#f8f9fc',
    bgGradientMid: isDark ? '#070a12' : '#f0f2f7',
    bgGradientEnd: isDark ? '#030407' : '#e8eaf0',

    // Lines & Borders
    strokePrimary: isDark ? 'rgba(99, 130, 190, 0.4)' : 'rgba(100, 116, 150, 0.3)',
    strokeSecondary: isDark ? 'rgba(99, 130, 190, 0.2)' : 'rgba(100, 116, 150, 0.15)',
    strokeAccent: isDark ? 'rgba(212, 175, 55, 0.6)' : 'rgba(180, 140, 40, 0.5)',

    // House elements
    houseLineColor: isDark ? 'rgba(140, 160, 200, 0.15)' : 'rgba(80, 90, 120, 0.12)',
    houseBandColor: isDark ? 'rgba(100, 130, 180, 0.04)' : 'rgba(80, 100, 140, 0.03)',
    houseNumColor: isDark ? '#d4af37' : '#b8860b',

    // Planet backgrounds
    planetBg: isDark ? '#0a0e1a' : '#ffffff',
    planetBgOuter: isDark ? '#0d1220' : '#f5f6f8',

    // Angle labels
    angleColor: isDark ? '#c9d1e0' : '#4a5568',
    angleShadow: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',

    // Cosmic accents
    starDust: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
  }), [isDark]);

  const isBiWheel = type === 'synastry' || type === 'transit';

  const toRenderAngle = useCallback((angle: number) => normalizeAngle(360 - angle), []);
  const toChartAngle = useCallback(
    (angle: number) => normalizeAngle(toRenderAngle(angle) + ascendantOffset),
    [ascendantOffset, toRenderAngle]
  );

  // Group aspects by layer for proper rendering order (must be before conditional returns)
  const aspectsByLayer = useMemo(() => {
    const layers: Record<AspectLayer, Array<Aspect & { layer: AspectLayer }>> = {
      background: [],
      midground: [],
      foreground: [],
    };

    if (!chartData) return layers;

    chartData.aspects.forEach(aspect => {
      const layer = getAspectLayer(aspect, singleConfig);
      // Boost luminary aspects, demote outer-planet-only aspects
      let finalLayer = layer;
      if (isLuminaryAspect(aspect) && layer === 'midground') {
        finalLayer = 'foreground';
      } else if (isOuterPlanetOnlyAspect(aspect) && layer !== 'background') {
        finalLayer = Math.abs(aspect.orb) <= 2 ? 'midground' : 'background';
      }
      layers[finalLayer].push({ ...aspect, layer: finalLayer });
    });

    return layers;
  }, [chartData, singleConfig]);


  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
          <span className="text-xs uppercase tracking-[0.2em] opacity-50 font-medium">
            {loadingLabel || 'Calculating positions...'}
          </span>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <span className="text-xs uppercase tracking-[0.2em] text-red-400/80 font-medium">
          {errorLabel || 'Chart unavailable'}
        </span>
      </div>
    );
  }

  // --- GEOMETRY CONSTANTS ---
  // 参考图布局比例：星座环最外层，行星靠近星座，位置信息中层，宫位数字环，相位线最内层
  const R_OUTER_RIM = 198;                // 最外圆边框
  const ZODIAC_BAND_WIDTH = 21;           // 星座环宽度（原30的70%）
  const R_ZODIAC_INNER = R_OUTER_RIM - ZODIAC_BAND_WIDTH; // 星座环内径 = 177

  // 单人盘布局（本命盘/组合盘）- 行星信息填满星座环和宫位环之间的空间
  const R_PLANET_RING_SINGLE = 168;       // 单人盘行星环（紧贴星座环内侧）
  const R_POSITION_INFO_SINGLE = 130;     // 单人盘位置信息中心
  const R_HOUSE_RING_SINGLE = 75;         // 单人盘宫位分隔线外径
  const R_HOUSE_RING_INNER_SINGLE = R_HOUSE_RING_SINGLE - ZODIAC_BAND_WIDTH; // 内圈宽度与外圈一致
  const R_HOUSE_NUMBERS_SINGLE = 62;      // 单人盘宫位数字环
  const R_ASPECT_LINE_SINGLE = R_HOUSE_RING_INNER_SINGLE; // 相位线半径

  // 双人盘布局（行运盘/对比盘）- 参考专业星盘软件布局
  // 外环（行运/对比）：紧贴星座环，显示完整行星信息
  const R_PLANET_RING_OUTER = 168;        // 双人盘外环行星起始位置（紧贴星座环）
  const R_OUTER_RING_SPACING = 12;        // 外环各元素间距
  // 分隔线
  const R_SEPARATOR = 125;                // 内外环分隔线
  // 内环（本命盘）：显示完整行星信息
  const R_PLANET_RING_INNER = 118;        // 双人盘内环行星起始位置
  const R_INNER_RING_SPACING = 10;        // 内环各元素间距
  const R_POSITION_INFO_INNER = 100;      // 双人盘内环位置信息中心
  // 宫位和相位
  const R_HOUSE_RING_DUAL = 72;           // 双人盘宫位分隔线外径
  const R_HOUSE_RING_INNER_DUAL = R_HOUSE_RING_DUAL - 18;
  const R_HOUSE_NUMBERS_DUAL = 58;        // 双人盘宫位数字环
  const R_ASPECT_LINE_DUAL = R_HOUSE_RING_INNER_DUAL; // 双人盘相位线半径

  const R_INNER_HUB = 25;                 // 中心点

  // 根据盘类型选择参数
  const R_PLANET_RING = isBiWheel ? R_PLANET_RING_INNER : R_PLANET_RING_SINGLE;
  const R_OUTER_PLANETS = R_PLANET_RING_OUTER;
  const R_HOUSE_NUMBERS = isBiWheel ? R_HOUSE_NUMBERS_DUAL : R_HOUSE_NUMBERS_SINGLE;
  const R_HOUSE_RING = isBiWheel ? R_HOUSE_RING_DUAL : R_HOUSE_RING_SINGLE;
  const R_ASPECT_LINE_MAX = isBiWheel ? R_ASPECT_LINE_DUAL : R_ASPECT_LINE_SINGLE;
  const R_POSITION_INFO = isBiWheel ? R_POSITION_INFO_INNER : R_POSITION_INFO_SINGLE;

  const houseNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const legend = legendLabels || {
    conjunction: 'Conjunction',
    opposition: 'Opposition',
    square: 'Square',
    trine: 'Trine',
    sextile: 'Sextile'
  };
  const chartMargin = compactSpacing
    ? `${(scale - 1) * 100}%`
    : `${Math.max(0, (scale - 1) * 200)}px`;

  // Render aspect line with layer-specific styling
  // 相位线绘制在内层区域（R_ASPECT_LINE_MAX）
  const renderAspectLine = (aspect: Aspect & { layer: AspectLayer }, index: number) => {
    if (aspect.type === 'conjunction') return null;
    // 在内环和外环中查找行星（支持双人盘跨盘相位）
    const allPlanets = [...chartData.inner, ...(chartData.outer || [])];
    const p1 = allPlanets.find(p => p.name === aspect.planet1);
    const p2 = allPlanets.find(p => p.name === aspect.planet2);
    if (!p1 || !p2) return null;

    // 使用内层半径绘制相位线（相位线在最内层）
    const aspectRadius = R_ASPECT_LINE_MAX;
    const c1 = getCoords(toRenderAngle(p1.absAngle), aspectRadius);
    const c2 = getCoords(toRenderAngle(p2.absAngle), aspectRadius);
    const color = ASPECT_COLORS[aspect.type] || '#fff';
    const style = VISUAL_LAYER_STYLES[aspect.layer];

    return (
      <line
        key={`aspect-${aspect.layer}-${index}`}
        x1={c1.x} y1={c1.y}
        x2={c2.x} y2={c2.y}
        stroke={color}
        strokeWidth={style.strokeWidth}
        opacity={style.opacity}
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className={`relative flex flex-col items-center w-full ${className}`}>
      {title && (
        <div className="text-xs font-semibold uppercase tracking-[0.25em] mb-5 opacity-60">
          {title}
        </div>
      )}

      <div className="w-full max-w-[1280px] flex flex-col items-end">
        {/* Legend */}
        <div className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-[9px] uppercase tracking-[0.15em] opacity-50 font-medium mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS.sextile }} /> {legend.sextile}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS.square }} /> {legend.square}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS.trine }} /> {legend.trine}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASPECT_COLORS.opposition }} /> {legend.opposition}
          </div>
        </div>

        {/* SVG Chart Container */}
        <div
          className="w-full transition-transform duration-300"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: chartMargin
          }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full max-w-[1280px] aspect-square"
            style={{ filter: isDark ? 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' : 'drop-shadow(0 4px 20px rgba(0,0,0,0.08))' }}
          >
            <defs>
              {/* Cosmic Background Gradient */}
              <radialGradient id="chartBgGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={colors.bgGradientStart} />
                <stop offset="70%" stopColor={colors.bgGradientMid} />
                <stop offset="100%" stopColor={colors.bgGradientEnd} />
              </radialGradient>

              {/* Subtle noise texture for cosmic feel */}
              <filter id="cosmicNoise">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
                <feColorMatrix type="saturate" values="0" />
                <feBlend in="SourceGraphic" in2="noise" mode="soft-light" />
              </filter>

              {/* Stronger glow for foreground aspects */}
              <filter id="aspectGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Planet circle shadow */}
              <filter id="planetShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Layer 0: Background Circle */}
            <circle
              cx="200" cy="200" r={R_OUTER_RIM}
              fill="url(#chartBgGradient)"
              stroke={colors.strokePrimary}
              strokeWidth="1.5"
            />

            {/* Subtle cosmic dust ring */}
            <circle
              cx="200" cy="200" r={R_ZODIAC_INNER + 8}
              fill="none"
              stroke={colors.starDust}
              strokeWidth="16"
              opacity="0.5"
            />

            {/* Layer 1: Zodiac Ring */}
            <circle cx="200" cy="200" r={R_ZODIAC_INNER} fill="none" stroke={colors.strokePrimary} strokeWidth="1" />

            {/* Layer 1.5: House Cusp Labels - 格式: 度数 [星座icon] 分 */}
            {Array.from({ length: 12 }).map((_, i) => {
              const fallbackCusp = normalizeAngle(ascendantLongitude + i * 30);
              const cuspLongitude = houseCusps[i] ?? fallbackCusp;
              const normalizedLongitude = normalizeAngle(cuspLongitude);
              let signIndex = Math.floor(normalizedLongitude / 30);
              const degreeFloat = normalizedLongitude % 30;
              let degreeInSign = Math.floor(degreeFloat);
              let minute = Math.round((degreeFloat - degreeInSign) * 60);
              if (minute === 60) {
                minute = 0;
                degreeInSign += 1;
                if (degreeInSign >= 30) {
                  degreeInSign = 0;
                  signIndex = (signIndex + 1) % SIGN_NAMES.length;
                }
              }

              const signName = SIGN_NAMES[signIndex];
              const signMeta = TECH_DATA.SIGNS[signName as keyof typeof TECH_DATA.SIGNS];
              const angle = toChartAngle(cuspLongitude);

              // 星座icon位置 - 对齐宫位线
              const iconRadius = R_ZODIAC_INNER + (ZODIAC_BAND_WIDTH / 2);
              const iconPos = getCoords(angle, iconRadius);

              const normalizedAngle = normalizeAngle(angle);
              const isLeftSide = normalizedAngle > 135 && normalizedAngle < 225;
              const isRightSide = normalizedAngle > 315 || normalizedAngle < 45;
              const isSideArea = isLeftSide || isRightSide;

              // 度数和分钟沿切线方向环绕 icon，确保在外环内
              const labelOffset = 15;
              const tangentAngle = angle + 90;
              const firstPos = getCoords(tangentAngle, labelOffset, iconPos.x, iconPos.y);
              const secondPos = getCoords(tangentAngle + 180, labelOffset, iconPos.x, iconPos.y);

              const [degreePos, minutePos] = isSideArea
                ? (firstPos.y <= secondPos.y ? [firstPos, secondPos] : [secondPos, firstPos])
                : (firstPos.x <= secondPos.x ? [firstPos, secondPos] : [secondPos, firstPos]);

              return (
                <g key={`cusp-label-${i}`}>
                  {/* 度数 */}
                  <text
                    x={degreePos.x}
                    y={degreePos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={isDark ? '#e2e8f0' : '#334155'}
                    fontFamily="system-ui, sans-serif"
                    style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.8)' : '0 0 2px rgba(255,255,255,0.9)' }}
                  >
                    {degreeInSign}
                  </text>
                  {/* 星座 icon - 对齐宫位线 */}
                  <text
                    x={iconPos.x}
                    y={iconPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill={signMeta?.color || colors.angleColor}
                    fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                    style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.8)' : '0 0 2px rgba(255,255,255,0.9)' }}
                  >
                    {signMeta?.glyph || ''}
                  </text>
                  {/* 分钟 */}
                  <text
                    x={minutePos.x}
                    y={minutePos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="7"
                    fontWeight="400"
                    fill={isDark ? '#94a3b8' : '#64748b'}
                    fontFamily="system-ui, sans-serif"
                    style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.8)' : '0 0 2px rgba(255,255,255,0.9)' }}
                  >
                    {String(minute).padStart(2, '0')}
                  </text>
                </g>
              );
            })}

            {/* Layer 2: Houses (Fixed Frame) */}
            {/* 宫位外分隔圆 */}
            <circle
              cx="200" cy="200"
              r={R_HOUSE_RING}
              fill="none"
              stroke={colors.strokeSecondary}
              strokeWidth="0.8"
            />
            {/* 宫位内分隔圆 - 连接相位线区域，宽度与外层框体相同 */}
            <circle
              cx="200" cy="200"
              r={R_ASPECT_LINE_MAX}
              fill="none"
              stroke={colors.strokeSecondary}
              strokeWidth="0.8"
            />

            {/* House Lines - 从中心延伸到星座环边界，使用 Placidus 宫头数据 */}
            {Array.from({ length: 12 }).map((_, i) => {
              // 使用 Placidus 宫头经度，如果没有数据则退回等宫制
              const cuspLongitude = houseCusps[i] ?? normalizeAngle(ascendantLongitude + i * 30);
              const angle = toChartAngle(cuspLongitude);
              const p1 = getCoords(angle, R_INNER_HUB);
              const p2 = getCoords(angle, R_ZODIAC_INNER);
              const isAxis = i === 0 || i === 3 || i === 6 || i === 9; // ASC/IC/DSC/MC 主轴
              return (
                <line
                  key={i}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={isAxis ? 'rgba(180,180,180,0.7)' : 'rgba(128,128,128,0.25)'}
                  strokeWidth={isAxis ? "1" : "0.5"}
                  opacity={isAxis ? "0.9" : "0.5"}
                />
              );
            })}

            {/* Inner Hub */}
            <circle cx="200" cy="200" r={R_INNER_HUB} fill="none" stroke={colors.strokeSecondary} strokeWidth="0.8" />

            {/* 双人盘分隔线（内外环之间） */}
            {isBiWheel && (
              <circle
                cx="200" cy="200"
                r={R_SEPARATOR}
                fill="none"
                stroke={colors.strokeSecondary}
                strokeWidth="0.8"
                opacity="0.6"
              />
            )}

            {/* House Numbers - 位于宫位中央，使用 Placidus 宫头数据 */}
            {houseNumbers.map((num) => {
              // 宫位数字位于两个宫头之间的中点
              const cuspStart = houseCusps[num - 1] ?? normalizeAngle(ascendantLongitude + (num - 1) * 30);
              const cuspEnd = houseCusps[num % 12] ?? normalizeAngle(ascendantLongitude + (num % 12) * 30);
              // 计算中点角度（处理跨 0° 的情况）
              let midAngle = (cuspStart + cuspEnd) / 2;
              if (Math.abs(cuspEnd - cuspStart) > 180) {
                midAngle = normalizeAngle(midAngle + 180);
              }
              const angle = toChartAngle(midAngle);
              const pos = getCoords(angle, R_HOUSE_NUMBERS);
              return (
                <text
                  key={num}
                  x={pos.x} y={pos.y} dy="3"
                  textAnchor="middle"
                  fill={colors.houseNumColor}
                  fontSize={isBiWheel ? "8" : "10"}
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
                  style={{
                    textShadow: isDark ? '0 0 4px rgba(0,0,0,0.9)' : '0 0 3px rgba(255,255,255,0.9)',
                    letterSpacing: '0.02em'
                  }}
                >
                  {num}
                </text>
              );
            })}

            {/* Layer 3: Aspect Lines (Rotated with planets) - 最内层 */}
            <g transform={`rotate(${ascendantOffset}, 200, 200)`}>
              {/* Background aspects first */}
              {aspectsByLayer.background.map((aspect, i) => renderAspectLine(aspect, i))}

              {/* Midground aspects */}
              {aspectsByLayer.midground.map((aspect, i) => renderAspectLine(aspect, i))}

              {/* Foreground aspects last (on top) with glow */}
              <g filter="url(#aspectGlow)">
                {aspectsByLayer.foreground.map((aspect, i) => renderAspectLine(aspect, i))}
              </g>
            </g>

            {/* Layer 3.5: Position Info Text Ring (Single chart only) */}
            {/* 位置信息径向排列：行星符号 + 度数° + 星座符号 + 分' + 逆行标记 */}
            {/* 使用 visualAngle 防止重叠，absAngle 用于连接线 */}
            {!isBiWheel && (
              <g transform={`rotate(${ascendantOffset}, 200, 200)`}>
                {chartData.innerDisplay.map((p, i) => {
                  const meta = PLANET_META[p.name] || { glyph: p.name[0], color: '#888' };
                  const signMeta = TECH_DATA.SIGNS[p.sign as keyof typeof TECH_DATA.SIGNS];
                  const svgPath = PLANET_SVG_PATHS[p.name];

                  const deg = Math.floor(p.degree);
                  const min = p.minute ?? Math.round((p.degree - deg) * 60);
                  const retrograde = p.isRetrograde ? 'R' : '';

                  // 使用 visualAngle 防止重叠
                  const displayAngleRaw = p.visualAngle;
                  const actualAngleRaw = p.absAngle;
                  const hasOffset = Math.abs(angleDiff(displayAngleRaw, actualAngleRaw)) > 0.5;
                  const displayAngle = toRenderAngle(displayAngleRaw);
                  const actualAngle = toRenderAngle(actualAngleRaw);

                  // 径向排列各元素位置（从外到内，填满显示区域）
                  const r1 = R_PLANET_RING_SINGLE;      // 行星符号
                  const r2 = r1 - 18;                   // 度数
                  const r3 = r2 - 18;                   // 星座符号
                  const r4 = r3 - 14;                   // 角分
                  const r5 = r4 - 12;                   // 逆行标记

                  const pos1 = getCoords(displayAngle, r1);
                  const pos2 = getCoords(displayAngle, r2);
                  const pos3 = getCoords(displayAngle, r3);
                  const pos4 = getCoords(displayAngle, r4);
                  const pos5 = getCoords(displayAngle, r5);

                  // 连接线：从行星符号指向黄道实际位置
                  const zodiacPos = getCoords(actualAngle, R_ZODIAC_INNER - 2);

                  return (
                    <g
                      key={`pos-info-${i}`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => handlePlanetMouseEnter(p, false, e)}
                      onMouseMove={handlePlanetMouseMove}
                      onMouseLeave={handlePlanetMouseLeave}
                    >
                      {/* 连接线：从行星符号指向黄道实际位置（仅当有偏移时显示） */}
                      {hasOffset && (
                        <line
                          x1={pos1.x}
                          y1={pos1.y}
                          x2={zodiacPos.x}
                          y2={zodiacPos.y}
                          stroke={meta.color}
                          strokeWidth="0.5"
                          opacity="0.3"
                          strokeDasharray="2,2"
                        />
                      )}
                      {/* 行星符号 - 使用 Unicode 字符（传统占星符号样式） */}
                      <g transform={`rotate(${-ascendantOffset}, ${pos1.x}, ${pos1.y})`}>
                        <text
                          x={pos1.x} y={pos1.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="14"
                          fill={meta.color}
                          fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                          style={{ textShadow: isDark ? '0 0 4px rgba(0,0,0,0.9)' : '0 0 3px rgba(255,255,255,0.9)' }}
                        >
                          {meta.glyph}
                        </text>
                      </g>
                      {/* 度数 - 保持水平 */}
                      <text
                        x={pos2.x} y={pos2.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill={isDark ? '#e2e8f0' : '#1e293b'}
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(${-ascendantOffset}, ${pos2.x}, ${pos2.y})`}
                        style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                      >
                        {deg}°
                      </text>
                      {/* 星座符号 - 使用 Unicode 字符（传统占星符号样式） */}
                      <g transform={`rotate(${-ascendantOffset}, ${pos3.x}, ${pos3.y})`}>
                        <text
                          x={pos3.x} y={pos3.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="12"
                          fill={signMeta?.color || '#888'}
                          fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                          style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                        >
                          {signMeta?.glyph || ''}
                        </text>
                      </g>
                      {/* 角分 - 保持水平 */}
                      <text
                        x={pos4.x} y={pos4.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(${-ascendantOffset}, ${pos4.x}, ${pos4.y})`}
                        style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                      >
                        {min}'
                      </text>
                      {/* 逆行标记 - 保持水平 */}
                      {retrograde && (
                        <text
                          x={pos5.x} y={pos5.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8"
                          fill="#ef4444"
                          fontWeight="600"
                          fontFamily="system-ui, sans-serif"
                          transform={`rotate(${-ascendantOffset}, ${pos5.x}, ${pos5.y})`}
                          style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                        >
                          {retrograde}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Layer 4.5: Position Info for Dual Wheel */}
            {/* 双人盘位置信息：外环和内环各自独立显示 */}
            {/* 使用 visualAngle 防止重叠，absAngle 用于连接线 */}
            {isBiWheel && (
              <g transform={`rotate(${ascendantOffset}, 200, 200)`}>
                {/* 外环行星位置信息（行运/对比盘的外环） */}
                {chartData.outer.map((p, i) => {
                  const baseName = stripOuterPrefix(p.name);
                  const meta = PLANET_META[baseName] || { glyph: baseName[0], color: '#10B981' };
                  const signMeta = TECH_DATA.SIGNS[p.sign as keyof typeof TECH_DATA.SIGNS];

                  const deg = Math.floor(p.degree);
                  const min = p.minute ?? Math.round((p.degree - deg) * 60);
                  const retrograde = p.isRetrograde ? 'R' : '';

                  // 使用 visualAngle 防止重叠
                  const displayAngleRaw = p.visualAngle;
                  const actualAngleRaw = p.absAngle;
                  const hasOffset = Math.abs(angleDiff(displayAngleRaw, actualAngleRaw)) > 0.5;
                  const displayAngle = toRenderAngle(displayAngleRaw);
                  const actualAngle = toRenderAngle(actualAngleRaw);

                  // 外环位置信息径向排列（从外到内）- 统一字号后缩放90%
                  const spacing = 11;                       // 统一间距
                  const r1 = R_PLANET_RING_OUTER;           // 行星符号
                  const r2 = r1 - spacing;                  // 度数
                  const r3 = r2 - spacing;                  // 星座符号
                  const r4 = r3 - 9;                        // 角分
                  const r5 = r4 - 7;                        // 逆行标记

                  const pos1 = getCoords(displayAngle, r1);
                  const pos2 = getCoords(displayAngle, r2);
                  const pos3 = getCoords(displayAngle, r3);
                  const pos4 = getCoords(displayAngle, r4);
                  const pos5 = getCoords(displayAngle, r5);

                  // 连接线：从行星符号指向黄道实际位置
                  const zodiacPos = getCoords(actualAngle, R_ZODIAC_INNER - 2);

                  return (
                    <g
                      key={`outer-pos-info-${i}`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => handlePlanetMouseEnter(p, true, e)}
                      onMouseMove={handlePlanetMouseMove}
                      onMouseLeave={handlePlanetMouseLeave}
                    >
                      {/* 连接线：从行星符号指向黄道实际位置（仅当有偏移时显示） */}
                      {hasOffset && (
                        <line
                          x1={pos1.x}
                          y1={pos1.y}
                          x2={zodiacPos.x}
                          y2={zodiacPos.y}
                          stroke={meta.color}
                          strokeWidth="0.5"
                          opacity="0.4"
                          strokeDasharray="2,2"
                        />
                      )}
                      {/* 行星符号 - 使用 Unicode 字符（统一字号 × 90%） */}
                      <g transform={`rotate(${-ascendantOffset}, ${pos1.x}, ${pos1.y})`}>
                        <text
                          x={pos1.x} y={pos1.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="11"
                          fill={meta.color}
                          fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                          style={{ textShadow: isDark ? '0 0 4px rgba(0,0,0,0.9)' : '0 0 3px rgba(255,255,255,0.9)' }}
                        >
                          {meta.glyph}
                        </text>
                      </g>
                      {/* 度数 */}
                      <text
                        x={pos2.x} y={pos2.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="8"
                        fontWeight="600"
                        fill={isDark ? '#e2e8f0' : '#1e293b'}
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(${-ascendantOffset}, ${pos2.x}, ${pos2.y})`}
                        style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                      >
                        {deg}°
                      </text>
                      {/* 星座符号 */}
                      <g transform={`rotate(${-ascendantOffset}, ${pos3.x}, ${pos3.y})`}>
                        <text
                          x={pos3.x} y={pos3.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="9"
                          fill={signMeta?.color || '#888'}
                          fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                          style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                        >
                          {signMeta?.glyph || ''}
                        </text>
                      </g>
                      {/* 角分 */}
                      <text
                        x={pos4.x} y={pos4.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="6"
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(${-ascendantOffset}, ${pos4.x}, ${pos4.y})`}
                        style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                      >
                        {min}'
                      </text>
                      {/* 逆行标记 */}
                      {retrograde && (
                        <text
                          x={pos5.x} y={pos5.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="5"
                          fill="#ef4444"
                          fontWeight="600"
                          fontFamily="system-ui, sans-serif"
                          transform={`rotate(${-ascendantOffset}, ${pos5.x}, ${pos5.y})`}
                          style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                        >
                          {retrograde}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* 内环行星位置信息（本命盘） */}
                {chartData.innerDisplay.map((p, i) => {
                  const meta = PLANET_META[p.name] || { glyph: p.name[0], color: '#888' };
                  const signMeta = TECH_DATA.SIGNS[p.sign as keyof typeof TECH_DATA.SIGNS];
                  const svgPath = PLANET_SVG_PATHS[p.name];

                  const deg = Math.floor(p.degree);
                  const min = p.minute ?? Math.round((p.degree - deg) * 60);
                  const retrograde = p.isRetrograde ? 'R' : '';

                  // 使用 visualAngle 防止重叠
                  const displayAngleRaw = p.visualAngle;
                  const actualAngleRaw = p.absAngle;
                  const hasOffset = Math.abs(angleDiff(displayAngleRaw, actualAngleRaw)) > 0.5;
                  const displayAngle = toRenderAngle(displayAngleRaw);
                  const actualAngle = toRenderAngle(actualAngleRaw);

                  // 内环位置信息径向排列（从外到内）- 与外环统一字号后缩放90%
                  const innerSpacing = 11;             // 与外环统一间距
                  const r1 = R_PLANET_RING_INNER;      // 行星符号
                  const r2 = r1 - innerSpacing;        // 度数
                  const r3 = r2 - innerSpacing;        // 星座符号
                  const r4 = r3 - 9;                   // 角分
                  const r5 = r4 - 7;                   // 逆行标记

                  const pos1 = getCoords(displayAngle, r1);
                  const pos2 = getCoords(displayAngle, r2);
                  const pos3 = getCoords(displayAngle, r3);
                  const pos4 = getCoords(displayAngle, r4);
                  const pos5 = getCoords(displayAngle, r5);

                  // 连接线：从行星符号指向宫位分隔环
                  const houseRingPos = getCoords(actualAngle, R_HOUSE_RING_DUAL + 2);

                  return (
                    <g
                      key={`inner-pos-info-${i}`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => handlePlanetMouseEnter(p, false, e)}
                      onMouseMove={handlePlanetMouseMove}
                      onMouseLeave={handlePlanetMouseLeave}
                    >
                      {/* 连接线：从行星符号指向宫位分隔环（仅当有偏移时显示） */}
                      {hasOffset && (
                        <line
                          x1={pos1.x}
                          y1={pos1.y}
                          x2={houseRingPos.x}
                          y2={houseRingPos.y}
                          stroke={meta.color}
                          strokeWidth="0.3"
                          opacity="0.25"
                          strokeDasharray="1.5,1.5"
                        />
                      )}
                      {/* 行星符号 - 使用 Unicode 字符（与外环统一字号 × 90%） */}
                      <g transform={`rotate(${-ascendantOffset}, ${pos1.x}, ${pos1.y})`}>
                        <text
                          x={pos1.x} y={pos1.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="11"
                          fill={meta.color}
                          fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                          style={{ textShadow: isDark ? '0 0 4px rgba(0,0,0,0.9)' : '0 0 3px rgba(255,255,255,0.9)' }}
                        >
                          {meta.glyph}
                        </text>
                      </g>
                      {/* 度数 - 保持水平 */}
                      <text
                        x={pos2.x} y={pos2.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="8"
                        fontWeight="600"
                        fill={isDark ? '#e2e8f0' : '#1e293b'}
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(${-ascendantOffset}, ${pos2.x}, ${pos2.y})`}
                        style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                      >
                        {deg}°
                      </text>
                      {/* 星座符号 - 使用 Unicode 字符（与外环统一字号 × 90%） */}
                      <g transform={`rotate(${-ascendantOffset}, ${pos3.x}, ${pos3.y})`}>
                        <text
                          x={pos3.x} y={pos3.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="9"
                          fill={signMeta?.color || '#888'}
                          fontFamily="'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif"
                          style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                        >
                          {signMeta?.glyph || ''}
                        </text>
                      </g>
                      {/* 角分 - 保持水平 */}
                      <text
                        x={pos4.x} y={pos4.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="6"
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(${-ascendantOffset}, ${pos4.x}, ${pos4.y})`}
                        style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                      >
                        {min}'
                      </text>
                      {/* 逆行标记 - 保持水平 */}
                      {retrograde && (
                        <text
                          x={pos5.x} y={pos5.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="5"
                          fill="#ef4444"
                          fontWeight="600"
                          fontFamily="system-ui, sans-serif"
                          transform={`rotate(${-ascendantOffset}, ${pos5.x}, ${pos5.y})`}
                          style={{ textShadow: isDark ? '0 0 3px rgba(0,0,0,0.9)' : '0 0 2px rgba(255,255,255,0.9)' }}
                        >
                          {retrograde}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Center Hub Decoration */}
            <circle cx="200" cy="200" r="4" fill={colors.strokeAccent} opacity="0.6" />
            <circle cx="200" cy="200" r="2" fill={colors.houseNumColor} />
          </svg>
        </div>
      </div>

      {/* Planet Hover Tooltip */}
      {hoveredPlanet && chartData && (
        <PlanetTooltip
          planet={hoveredPlanet}
          aspects={chartData.aspects}
          chartType={type}
          isOuterRing={hoveredIsOuter}
          position={tooltipPosition}
        />
      )}
    </div>
  );
};
