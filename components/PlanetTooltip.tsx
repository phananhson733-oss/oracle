// INPUT: React、行星数据、相位列表与主题配置（含宫主星飞入星座与双人盘外盘前缀解析）。
// OUTPUT: 导出行星悬停提示组件（支持本命盘/对比盘、中英双语、明暗主题）。
// POS: 星盘行星悬停提示组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PlanetPosition, Aspect, ChartType } from '../types';
import { TECH_DATA, ASPECT_COLORS } from '../constants';
import { useTheme, useLanguage } from './UIComponents';

// 相位符号映射
const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  square: '□',
  trine: '△',
  sextile: '⚹',
};

// 宫主星映射（传统占星）
const SIGN_RULERS: Record<string, string> = {
  'Aries': 'Mars',
  'Taurus': 'Venus',
  'Gemini': 'Mercury',
  'Cancer': 'Moon',
  'Leo': 'Sun',
  'Virgo': 'Mercury',
  'Libra': 'Venus',
  'Scorpio': 'Pluto',
  'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn',
  'Aquarius': 'Uranus',
  'Pisces': 'Neptune',
};

const OUTER_PREFIX_RE = /^(T-|B-)/;
const stripOuterPrefix = (name: string) => name.replace(OUTER_PREFIX_RE, '');
const isOuterPlanetName = (name: string) => OUTER_PREFIX_RE.test(name);

export interface HouseRuler {
  house: number;
  sign: string;
  ruler: string;
  fliesTo: number;
  fliesToSign?: string;
}

export interface PlanetTooltipProps {
  planet: PlanetPosition & { absAngle?: number };
  aspects: Aspect[];
  houseRulers?: HouseRuler[];
  chartType: ChartType;
  isOuterRing?: boolean;
  position: { x: number; y: number };
  onClose?: () => void;
}

export const PlanetTooltip: React.FC<PlanetTooltipProps> = ({
  planet,
  aspects,
  houseRulers = [],
  chartType,
  isOuterRing = false,
  position,
}) => {
  const { theme } = useTheme();
  const { language, t, tl } = useLanguage();
  const isDark = theme === 'dark';

  // 获取行星元数据
  const baseName = stripOuterPrefix(planet.name);
  const planetMeta = TECH_DATA.PLANETS[baseName as keyof typeof TECH_DATA.PLANETS] || {
    glyph: baseName[0],
    color: '#888',
    keywords: { zh: '', en: '' }
  };
  const signMeta = TECH_DATA.SIGNS[planet.sign as keyof typeof TECH_DATA.SIGNS];

  // 计算面板宽度（中文 280px / 英文 340px）
  const panelWidth = language === 'zh' ? 280 : 340;

  // 查找该行星守护的宫位
  const ruledHouses = useMemo(() => {
    return houseRulers
      .filter(hr => hr.ruler === baseName)
      .map(hr => hr.house);
  }, [houseRulers, baseName]);

  // 筛选与该行星相关的相位
  // 双人盘中优先显示跨盘相位（内环与外环之间的相位）
  const relevantAspects = useMemo(() => {
    const isBiWheel = chartType === 'transit' || chartType === 'synastry';

    // 筛选与当前行星相关的所有相位
    const allRelevant = aspects.filter(a =>
      a.planet1 === planet.name || a.planet2 === planet.name
    );

    if (isBiWheel) {
      // 双人盘模式：区分跨盘相位和同盘相位
      const crossAspects: Aspect[] = [];  // 跨盘相位
      const sameAspects: Aspect[] = [];   // 同盘相位

      allRelevant.forEach(a => {
        const otherPlanet = a.planet1 === planet.name ? a.planet2 : a.planet1;
        const planetIsOuter = isOuterPlanetName(planet.name);
        const otherIsOuter = isOuterPlanetName(otherPlanet);

        // 跨盘相位：一个在内环，一个在外环
        if (planetIsOuter !== otherIsOuter) {
          crossAspects.push(a);
        } else {
          sameAspects.push(a);
        }
      });

      // 按 orb 排序，优先显示跨盘相位
      crossAspects.sort((a, b) => Math.abs(a.orb) - Math.abs(b.orb));
      sameAspects.sort((a, b) => Math.abs(a.orb) - Math.abs(b.orb));

      // 跨盘相位优先，最多显示 5 个
      return [...crossAspects, ...sameAspects].slice(0, 5);
    }

    // 单人盘模式：按 orb 排序
    return allRelevant
      .sort((a, b) => Math.abs(a.orb) - Math.abs(b.orb))
      .slice(0, 5);
  }, [aspects, planet.name, chartType]);

  // 计算 tooltip 位置（跟随鼠标，边界检测）
  const tooltipStyle = useMemo(() => {
    const offset = 15;
    let left = position.x + offset;
    let top = position.y + offset;

    // 边界检测
    if (typeof window !== 'undefined') {
      const rightEdge = window.innerWidth - panelWidth - 20;
      const bottomEdge = window.innerHeight - 300; // 估计高度

      if (left > rightEdge) {
        left = position.x - panelWidth - offset;
      }
      if (top > bottomEdge) {
        top = position.y - 200;
      }
      if (top < 10) top = 10;
      if (left < 10) left = 10;
    }

    return { left, top };
  }, [position, panelWidth]);

  // 格式化度数
  const formatDegree = (degree: number, minute?: number) => {
    const deg = Math.floor(degree);
    const min = minute ?? Math.round((degree - deg) * 60);
    return `${deg}°${min}'`;
  };

  // 获取相位颜色
  const getAspectColor = (type: string) => {
    return ASPECT_COLORS[type as keyof typeof ASPECT_COLORS] || '#888';
  };

  // 获取另一个行星名称（处理外环前缀）
  const getOtherPlanet = (aspect: Aspect) => {
    const other = aspect.planet1 === planet.name ? aspect.planet2 : aspect.planet1;
    const otherBase = stripOuterPrefix(other);
    const otherMeta = TECH_DATA.PLANETS[otherBase as keyof typeof TECH_DATA.PLANETS];
    const isOtherOuter = isOuterPlanetName(other);

    return {
      name: other,
      baseName: otherBase,
      displayName: isOtherOuter ? `${t.chart.hover_outer}${tl(otherBase)}` : tl(otherBase),
      glyph: otherMeta?.glyph || otherBase[0],
      color: otherMeta?.color || '#888',
      isOuter: isOtherOuter,
    };
  };

  // 行星显示名称（处理外环前缀）
  const displayName = isOuterRing ? `${t.chart.hover_outer}${tl(baseName)}` : tl(baseName);

  // 样式
  const styles = {
    panel: {
      position: 'fixed' as const,
      left: tooltipStyle.left,
      top: tooltipStyle.top,
      width: panelWidth,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
      borderRadius: 12,
      padding: '16px',
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.5)'
        : '0 8px 32px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      animation: 'fadeIn 200ms ease-out',
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },
    glyph: {
      fontSize: 28,
      color: planetMeta.color,
      lineHeight: 1,
      fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      fontVariantEmoji: 'text' as const,
    },
    nameRow: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: 600,
      color: planetMeta.color,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      fontSize: 11,
      padding: '2px 6px',
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      color: isDark ? '#94a3b8' : '#64748b',
    },
    keywords: {
      fontSize: 13,
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 4,
      lineHeight: 1.4,
    },
    section: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
    },
    label: {
      fontSize: 12,
      color: isDark ? '#64748b' : '#94a3b8',
      marginBottom: 4,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
      color: isDark ? '#e2e8f0' : '#1e293b',
    },
    signColor: {
      color: signMeta?.color || '#888',
      fontWeight: 500,
    },
    symbolText: {
      fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      fontVariantEmoji: 'text' as const,
    },
    aspectRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 13,
      color: isDark ? '#cbd5e1' : '#475569',
      whiteSpace: 'nowrap' as const,
      marginTop: 6,
    },
  };

  const content = (
    <div style={styles.panel}>
      {/* 行星标识区 */}
      <div style={styles.header}>
        {/* 使用 Unicode 字符显示行星符号（与星盘统一） */}
        <span style={styles.glyph}>{planetMeta.glyph}</span>
        <div style={styles.nameRow}>
          <div style={styles.name}>
            {displayName}
            <span style={styles.badge}>
              {planet.isRetrograde ? t.chart.hover_retrograde : t.chart.hover_direct}
            </span>
          </div>
          {planetMeta.keywords && (
            <div style={styles.keywords}>
              {language === 'zh' ? planetMeta.keywords.zh : planetMeta.keywords.en}
            </div>
          )}
        </div>
      </div>

      {/* 星座位置区 */}
      <div style={styles.section}>
        <div style={styles.label}>{t.chart.hover_sign}</div>
        <div style={styles.row}>
          <span>{t.chart.hover_in}</span>
          <span style={styles.signColor}>{tl(planet.sign)}</span>
          <span style={{ color: signMeta?.color, ...styles.symbolText }}>{signMeta?.glyph}</span>
          <span>{formatDegree(planet.degree, planet.minute)}</span>
        </div>
      </div>

      {/* 宫位信息区 */}
      {planet.house && (
        <div style={styles.section}>
          <div style={styles.label}>{t.chart.hover_house}</div>
          <div style={styles.row}>
            <span>{t.chart.hover_in_house}</span>
            <span style={{ fontWeight: 600 }}>{planet.house}</span>
            <span>{language === 'zh' ? '宫' : ''}</span>
            {ruledHouses.length > 0 && (
              <>
                <span style={{ margin: '0 8px', color: isDark ? '#475569' : '#94a3b8' }}>|</span>
                <span>{t.chart.hover_rules}</span>
                <span style={{ fontWeight: 600 }}>{ruledHouses.join(', ')}</span>
                <span>{language === 'zh' ? '宫' : ''}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 相位列表区 */}
      {relevantAspects.length > 0 && (
        <div style={styles.section}>
          <div style={styles.label}>{t.chart.hover_aspects}</div>
          {relevantAspects.map((aspect, idx) => {
            const other = getOtherPlanet(aspect);
            const aspectColor = getAspectColor(aspect.type);
            const angleValue = Math.round(
              aspect.type === 'conjunction' ? 0 :
              aspect.type === 'sextile' ? 60 :
              aspect.type === 'square' ? 90 :
              aspect.type === 'trine' ? 120 :
              aspect.type === 'opposition' ? 180 : 0
            );

            return (
              <div key={idx} style={styles.aspectRow}>
                <span>{t.chart.hover_with}</span>
                <span style={{ color: other.color, fontWeight: 500 }}>{other.displayName}</span>
                <span style={{ color: other.color, ...styles.symbolText }}>{other.glyph}</span>
                <span>{t.chart.hover_at}</span>
                <span style={{ color: aspectColor, fontWeight: 600 }}>{angleValue}°</span>
                <span style={{ color: aspectColor, ...styles.symbolText }}>{ASPECT_SYMBOLS[aspect.type]}</span>
                <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  [{aspect.isApplying ? t.chart.hover_applying : t.chart.hover_separating}]
                </span>
                <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  {Math.abs(aspect.orb).toFixed(0)}°{Math.round((Math.abs(aspect.orb) % 1) * 60)}'
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
};

export default PlanetTooltip;
