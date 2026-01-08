// INPUT: React 与技术数据（含元素矩阵视觉调整与行运交点支持）。
// OUTPUT: 导出技术表格组件（含本地化标签、Unicode 符号与跨盘相位矩阵）。
// POS: 主应用技术规格 UI。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import { ExtendedNatalData, PlanetPosition, Language, Aspect } from '../types';
import { ASTRO_DICTIONARY, TECH_DATA, ASPECT_COLORS } from '../constants';
import { useTheme } from './UIComponents';

const { ELEMENTS } = TECH_DATA;

// --- Unicode Symbol Components ---

// 行星 Unicode 符号组件
const PlanetGlyph: React.FC<{ name: string; size?: number; className?: string; showColor?: boolean }> = ({
  name,
  size = 16,
  className = '',
  showColor = true
}) => {
  const meta = TECH_DATA.PLANETS[name as keyof typeof TECH_DATA.PLANETS];
  const glyph = meta?.glyph || name.slice(0, 2).toUpperCase();
  const color = showColor ? (meta?.color || '#888') : 'currentColor';

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: size,
        color,
        fontFamily: "'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif",
      }}
      aria-label={name}
    >
      {glyph}
    </span>
  );
};

// 星座 Unicode 符号组件
const ZodiacGlyph: React.FC<{ sign: string; size?: number; className?: string; showColor?: boolean }> = ({
  sign,
  size = 16,
  className = '',
  showColor = true
}) => {
  const meta = TECH_DATA.SIGNS[sign as keyof typeof TECH_DATA.SIGNS];
  const glyph = meta?.glyph || sign.slice(0, 1);
  const color = showColor ? (meta?.color || '#888') : 'currentColor';

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: size,
        color,
        fontFamily: "'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif",
      }}
      aria-label={sign}
    >
      {glyph}
    </span>
  );
};

// --- Helper Functions ---

const translateTerm = (term: string, language?: Language) => {
  if (language !== 'zh') return term;
  return ASTRO_DICTIONARY[term]?.zh || term;
};

const formatHouse = (house?: number, language?: Language) => {
  if (!house) return '--';
  return language === 'zh' ? `${house}宫` : `${house}H`;
};

// 格式化度数为 d°m' 格式
const formatDegreeMinute = (orb: number): string => {
  const absOrb = Math.abs(orb);
  const deg = Math.floor(absOrb);
  const min = Math.round((absOrb - deg) * 60);
  return `${deg}°${min.toString().padStart(2, '0')}'`;
};

// --- Aspect Configuration ---

// 相位符号映射（使用占星专业 Unicode 符号）
const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  square: '□',
  trine: '△',
  sextile: '⚹',
};

// 相位配置（颜色来自 ASPECT_COLORS）
const ASPECT_CONFIG: Record<string, { symbol: string; color: string; zh: string }> = {
  conjunction: { symbol: '☌', color: ASPECT_COLORS.conjunction, zh: '合' },
  opposition: { symbol: '☍', color: ASPECT_COLORS.opposition, zh: '冲' },
  square: { symbol: '□', color: ASPECT_COLORS.square, zh: '刑' },
  trine: { symbol: '△', color: ASPECT_COLORS.trine, zh: '拱' },
  sextile: { symbol: '⚹', color: ASPECT_COLORS.sextile, zh: '六合' },
};

// --- 1. Elemental Balance Matrix ---

export const ElementalTable: React.FC<{ data: ExtendedNatalData['elements']; language?: Language }> = ({ data, language }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const borderClass = isDark ? 'border-space-600' : 'border-paper-300';
  const dividerClass = isDark ? 'divide-space-600 border-space-600' : 'divide-paper-300 border-paper-300';
  const headerClass = "text-[12px] font-bold uppercase tracking-widest opacity-50 py-4 text-center";

  const modalities = ['Cardinal', 'Fixed', 'Mutable'];
  const modalityLabels: Record<string, string> = language === 'zh'
    ? { Cardinal: '开创', Fixed: '固定', Mutable: '变动' }
    : { Cardinal: 'Cardinal', Fixed: 'Fixed', Mutable: 'Mutable' };
  const elements = ['Fire', 'Earth', 'Air', 'Water'];
  const elementLabels: Record<string, string> = language === 'zh'
    ? { Fire: '火', Earth: '土', Air: '风', Water: '水' }
    : { Fire: 'Fire', Earth: 'Earth', Air: 'Air', Water: 'Water' };

  return (
    <div className={`border ${borderClass} rounded-lg overflow-hidden`}>
      <div className={`grid grid-cols-4 divide-x ${dividerClass} border-b ${borderClass}`}>
        <div className={`bg-black/10 ${headerClass}`}></div>
        {modalities.map(m => <div key={m} className={headerClass}>{modalityLabels[m]}</div>)}
      </div>

      <div className={`divide-y ${dividerClass}`}>
        {elements.map(elKey => (
          <div key={elKey} className={`grid grid-cols-4 divide-x ${dividerClass} min-h-[60px]`}>
            {/* Element Header */}
            <div className={`flex flex-col items-center justify-center p-2 gap-1 bg-black/5 border-r ${borderClass}`}>
                <span className="text-[12px] font-bold uppercase tracking-widest opacity-90" style={{ color: ELEMENTS[elKey as keyof typeof ELEMENTS].color }}>
                    {elementLabels[elKey]}
                </span>
            </div>

            {/* Cells */}
            {modalities.map(modKey => {
                const planets = data[elKey]?.[modKey] || [];

                return (
                    <div key={modKey} className="relative flex flex-wrap items-center justify-center gap-2 p-2 h-full min-h-[60px]">
                        {planets.map(p => (
                            <div
                              key={p}
                              className="w-7 h-7 flex items-center justify-center"
                              title={translateTerm(p, language)}
                            >
                                <PlanetGlyph name={p} size={21} />
                            </div>
                        ))}
                        {planets.length === 0 && <span className="opacity-10 text-xs">-</span>}
                    </div>
                );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 2. Aspect Matrix ---

type AspectMatrixVariant = 'square' | 'triangle';

// 主要行星列表
const MAJOR_PLANETS = [
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
  'North Node',
  'Ascendant',
];

export const AspectMatrix: React.FC<{
  aspects: ExtendedNatalData['aspects'];
  language?: Language;
  variant?: AspectMatrixVariant;
}> = ({ aspects, language, variant = 'triangle' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const majors = MAJOR_PLANETS;

  // 构建相位映射
  const aspectMap = new Map<string, ExtendedNatalData['aspects'][number]>();
  aspects
    .filter(a => majors.includes(a.planet1) && majors.includes(a.planet2))
    .forEach((a) => {
      const key = [a.planet1, a.planet2].sort().join('|');
      aspectMap.set(key, a);
    });

  const cellSize = 'h-12 w-12 md:h-14 md:w-14';
  const headerBg = isDark ? 'bg-space-800' : 'bg-gray-100';
  const borderClass = isDark ? 'border-space-600' : 'border-gray-200';
  const emptyBg = isDark ? 'bg-space-900/40' : 'bg-white';

  // 三角形矩阵（下三角，参考图格式）
  if (variant === 'triangle') {
    return (
      <div className="overflow-x-auto">
        <table className="table-fixed border-collapse">
          <tbody>
            {majors.map((rowPlanet, rowIndex) => (
              <tr key={rowPlanet}>
                {/* 左侧行星标题 */}
                <th className={`${cellSize} ${headerBg} border ${borderClass} align-middle`}>
                  <div className="flex items-center justify-center">
                    <PlanetGlyph name={rowPlanet} size={18} />
                  </div>
                </th>
                {/* 单元格 */}
                {majors.map((colPlanet, colIndex) => {
                  // 对角线 - 显示行星符号
                  if (colIndex === rowIndex) {
                    return (
                      <td key={`${rowPlanet}-${colPlanet}`} className={`${cellSize} ${headerBg} border ${borderClass}`}>
                        <div className="flex items-center justify-center h-full">
                          <PlanetGlyph name={rowPlanet} size={18} />
                        </div>
                      </td>
                    );
                  }
                  // 上三角 - 空白/隐藏
                  if (colIndex > rowIndex) {
                    return (
                      <td
                        key={`${rowPlanet}-${colPlanet}`}
                        className={`${cellSize} border ${borderClass} ${isDark ? 'bg-transparent border-transparent' : 'bg-transparent border-transparent'}`}
                      />
                    );
                  }
                  // 下三角 - 相位数据
                  const key = [rowPlanet, colPlanet].sort().join('|');
                  const aspect = aspectMap.get(key);

                  if (!aspect) {
                    return (
                      <td key={`${rowPlanet}-${colPlanet}`} className={`${cellSize} border ${borderClass} ${emptyBg}`} />
                    );
                  }

                  const config = ASPECT_CONFIG[aspect.type];
                  const applyingSeparating = aspect.isApplying ? 'A' : 'S';

                  return (
                    <td key={`${rowPlanet}-${colPlanet}`} className={`${cellSize} border ${borderClass} ${emptyBg}`}>
                      <div className="flex flex-col items-center justify-center h-full gap-0.5">
                        {/* 相位符号 */}
                        <span
                          style={{ color: config?.color, fontSize: 16 }}
                          className="font-medium"
                        >
                          {config?.symbol}
                        </span>
                        {/* 角度 + A/S */}
                        <span
                          style={{ color: config?.color }}
                          className="text-[9px] font-mono"
                        >
                          {formatDegreeMinute(aspect.orb)} {applyingSeparating}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 方形矩阵
  return (
    <div className="overflow-x-auto">
      <table className="table-fixed border-collapse">
        <thead>
          <tr>
            <th className={`${cellSize} ${headerBg} border ${borderClass}`} />
            {majors.map((planet) => (
              <th key={planet} className={`${cellSize} ${headerBg} border ${borderClass}`}>
                <div className="flex items-center justify-center">
                  <PlanetGlyph name={planet} size={18} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {majors.map((rowPlanet, rowIndex) => (
            <tr key={rowPlanet}>
              <th className={`${cellSize} ${headerBg} border ${borderClass}`}>
                <div className="flex items-center justify-center">
                  <PlanetGlyph name={rowPlanet} size={18} />
                </div>
              </th>
              {majors.map((colPlanet, colIndex) => {
                if (colIndex <= rowIndex) {
                  return (
                    <td
                      key={`${rowPlanet}-${colPlanet}`}
                      className={`${cellSize} border ${borderClass} ${colIndex === rowIndex ? headerBg : (isDark ? 'bg-space-700/30' : 'bg-gray-50')}`}
                    />
                  );
                }
                const key = [rowPlanet, colPlanet].sort().join('|');
                const aspect = aspectMap.get(key);

                if (!aspect) {
                  return (
                    <td key={`${rowPlanet}-${colPlanet}`} className={`${cellSize} border ${borderClass} ${emptyBg}`} />
                  );
                }

                const config = ASPECT_CONFIG[aspect.type];
                const applyingSeparating = aspect.isApplying ? 'A' : 'S';

                return (
                  <td key={`${rowPlanet}-${colPlanet}`} className={`${cellSize} border ${borderClass} ${emptyBg}`}>
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span style={{ color: config?.color, fontSize: 16 }}>{config?.symbol}</span>
                      <span style={{ color: config?.color }} className="text-[9px] font-mono">
                        {formatDegreeMinute(aspect.orb)} {applyingSeparating}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- 3. Planet / Asteroid Table ---

type PlanetTableLabels = {
  body: string;
  sign: string;
  house: string;
  retro?: string;
};

const Degree: React.FC<{ d: number, m?: number }> = ({ d, m }) => (
  <span className="font-mono text-xs opacity-80">
    {Math.floor(d)}°{m ? String(Math.floor(m)).padStart(2, '0') + "'" : "00'"}
  </span>
);

const TableRow: React.FC<{ p: PlanetPosition; language?: Language }> = ({ p, language }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const signMeta = TECH_DATA.SIGNS[p.sign as keyof typeof TECH_DATA.SIGNS];
  const signColor = signMeta?.color || '#F3E3AC';
  const borderClass = isDark ? 'border-space-600' : 'border-paper-300';

  return (
    <div
      className={`grid grid-cols-[1.6fr_1.6fr_0.6fr_0.5fr] items-center px-4 py-3 border-t ${borderClass} ${isDark ? 'hover:bg-space-800/50' : 'hover:bg-paper-100'} transition-colors`}
    >
      <div className="flex items-center gap-3">
        <PlanetGlyph name={p.name} size={20} />
        <span className="text-sm font-medium">{translateTerm(p.name, language)}</span>
      </div>

      <div className="flex items-center gap-2">
        <ZodiacGlyph sign={p.sign} size={16} />
        <span className="text-sm opacity-80" style={{ color: signColor }}>
          {translateTerm(p.sign, language)}
        </span>
        <Degree d={p.degree} m={p.minute} />
      </div>

      <div className="text-sm font-mono opacity-70">{formatHouse(p.house, language)}</div>

      <div className="text-right">
        {p.isRetrograde ? (
          <span className="text-[10px] bg-danger/20 text-danger px-1.5 rounded font-bold">R</span>
        ) : (
          <span className="text-xs opacity-20">—</span>
        )}
      </div>
    </div>
  );
};

export const PlanetTable: React.FC<{ planets: PlanetPosition[]; language?: Language; labels?: PlanetTableLabels }> = ({ planets, language, labels }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const borderClass = isDark ? 'border-space-600' : 'border-paper-300';
  const headerText = isDark ? 'text-star-200' : 'text-paper-400';
  const headerBg = isDark ? 'bg-black/20' : 'bg-black/5';
  const headerLabels: PlanetTableLabels = {
    body: labels?.body || (language === 'zh' ? '星体' : 'Body'),
    sign: labels?.sign || (language === 'zh' ? '星座' : 'Sign'),
    house: labels?.house || (language === 'zh' ? '宫位' : 'House'),
    retro: labels?.retro || (language === 'zh' ? '逆行' : 'Retro'),
  };

  return (
    <div className={`border ${borderClass} rounded-lg overflow-hidden`}>
      <div className={`grid grid-cols-[1.6fr_1.6fr_0.6fr_0.5fr] ${headerBg} px-4 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50 ${headerText}`}>
        <div>{headerLabels.body}</div>
        <div>{headerLabels.sign}</div>
        <div>{headerLabels.house}</div>
        <div className="text-right">{headerLabels.retro}</div>
      </div>
      {planets.map((p, i) => <TableRow key={`${p.name}-${i}`} p={p} language={language} />)}
    </div>
  );
};

// --- 4. House Ruler Chain ---

type HouseRulerLabels = {
  house: string;
  sign: string;
  ruler: string;
  flies_to: string;
};

export const HouseRulerTable: React.FC<{ rulers: ExtendedNatalData['houseRulers']; language?: Language; labels?: HouseRulerLabels }> = ({
  rulers,
  language,
  labels,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const borderClass = isDark ? 'border-space-600' : 'border-paper-300';
  const headerText = isDark ? 'text-star-200' : 'text-paper-400';
  const headerBg = isDark ? 'bg-black/20' : 'bg-black/5';
  const headerLabels: HouseRulerLabels = {
    house: labels?.house || (language === 'zh' ? '宫位' : 'House'),
    sign: labels?.sign || (language === 'zh' ? '星座' : 'Sign'),
    ruler: labels?.ruler || (language === 'zh' ? '宫主星' : 'Ruler'),
    flies_to: labels?.flies_to || (language === 'zh' ? '飞入宫位' : 'Falls In'),
  };

  return (
    <div className={`border ${borderClass} rounded-lg overflow-hidden`}>
      <div className={`grid grid-cols-[0.7fr_1.4fr_1.4fr_0.9fr] ${headerBg} px-4 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50 ${headerText}`}>
        <div>{headerLabels.house}</div>
        <div>{headerLabels.sign}</div>
        <div>{headerLabels.ruler}</div>
        <div className="text-right">{headerLabels.flies_to}</div>
      </div>
      {rulers.map((r, i) => {
        const signMeta = TECH_DATA.SIGNS[r.sign as keyof typeof TECH_DATA.SIGNS];
        const signColor = signMeta?.color || '#F3E3AC';
        const fliesToSign = r.fliesToSign;
        const fliesToSignMeta = fliesToSign ? TECH_DATA.SIGNS[fliesToSign as keyof typeof TECH_DATA.SIGNS] : undefined;
        const fliesToSignColor = fliesToSignMeta?.color || '#F3E3AC';
        const fliesToLabel = formatHouse(r.fliesTo, language);
        const fliesToSignLabel = fliesToSign ? translateTerm(fliesToSign, language) : '--';
        return (
          <div
            key={`${r.house}-${i}`}
            className={`grid grid-cols-[0.7fr_1.4fr_1.4fr_0.9fr] px-4 py-3 border-t ${borderClass} items-center ${isDark ? 'hover:bg-space-800/50' : 'hover:bg-paper-100'}`}
          >
            <div className="text-gold-500 font-serif text-lg">{r.house}</div>

            <div className="flex items-center gap-2">
              <ZodiacGlyph sign={r.sign} size={16} />
              <span className="text-sm opacity-80" style={{ color: signColor }}>
                {translateTerm(r.sign, language)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <PlanetGlyph name={r.ruler} size={18} />
              <span className="text-sm opacity-80">{translateTerm(r.ruler, language)}</span>
            </div>

            <div className="text-right flex items-center justify-end gap-2">
              <span className="text-xs opacity-50">→</span>
              <span className="flex items-center gap-1 text-[10px] font-bold bg-gold-500/10 text-gold-500 px-2 py-1 rounded border border-gold-500/20">
                {fliesToSign && <ZodiacGlyph sign={fliesToSign} size={12} />}
                <span style={{ color: fliesToSignColor }}>{fliesToSignLabel}</span>
                <span className="opacity-70">{fliesToLabel}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- 5. Cross Aspect Matrix (行运与本命的交叉相位矩阵) ---

// 行运行星（外盘）行显示
const TRANSIT_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'Ascendant'];
// 本命行星（内盘）列显示
const NATAL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'Ascendant'];

export const CrossAspectMatrix: React.FC<{
  aspects: Aspect[];
  language?: Language;
  transitLabel?: string;
  natalLabel?: string;
}> = ({ aspects, language, transitLabel, natalLabel }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 构建相位查找映射 - 支持 T-Planet/N-Planet 格式
  const aspectMap = new Map<string, Aspect>();

  aspects.forEach((a) => {
    // 解析行运行星名称 (去掉 T- 前缀)
    const transit = a.planet1.startsWith('T-') ? a.planet1.slice(2) : a.planet1;
    // 解析本命行星名称 (去掉 N- 前缀)
    const natal = a.planet2.startsWith('N-') ? a.planet2.slice(2) : a.planet2;

    if (TRANSIT_PLANETS.includes(transit) && NATAL_PLANETS.includes(natal)) {
      const key = `${transit}|${natal}`;
      aspectMap.set(key, a);
    }
  });

  const cellSize = 'h-12 w-12 md:h-14 md:w-14';
  const headerBg = isDark ? 'bg-space-800' : 'bg-gray-100';
  const borderClass = isDark ? 'border-space-600' : 'border-gray-200';
  const emptyBg = isDark ? 'bg-space-900/40' : 'bg-white';
  const labelClass = isDark ? 'text-star-400 text-[10px]' : 'text-paper-400 text-[10px]';

  return (
    <div className="overflow-x-auto">
      <table className="table-fixed border-collapse text-center">
        <thead>
          <tr>
            {/* 左上角：行运/本命标签 */}
            <th className={`${cellSize} ${headerBg} border ${borderClass}`}>
              <div className="flex flex-col items-center justify-center text-[8px] leading-tight">
                <span className={labelClass}>{transitLabel || (language === 'zh' ? '行运' : 'TR')}</span>
                <span className="text-[6px] opacity-40">↓</span>
                <span className={labelClass}>{natalLabel || (language === 'zh' ? '本命' : 'NT')}</span>
                <span className="text-[6px] opacity-40">→</span>
              </div>
            </th>
            {/* 本命行星列标题 */}
            {NATAL_PLANETS.map((planet) => (
              <th key={planet} className={`${cellSize} ${headerBg} border ${borderClass}`}>
                <div className="flex items-center justify-center">
                  <PlanetGlyph name={planet} size={16} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TRANSIT_PLANETS.map((transitPlanet) => (
            <tr key={transitPlanet}>
              {/* 行运行星行标题 */}
              <th className={`${cellSize} ${headerBg} border ${borderClass}`}>
                <div className="flex items-center justify-center">
                  <PlanetGlyph name={transitPlanet} size={16} />
                </div>
              </th>
              {/* 相位单元格 */}
              {NATAL_PLANETS.map((natalPlanet) => {
                const key = `${transitPlanet}|${natalPlanet}`;
                const aspect = aspectMap.get(key);

                if (!aspect) {
                  return (
                    <td
                      key={`${transitPlanet}-${natalPlanet}`}
                      className={`${cellSize} border ${borderClass} ${emptyBg}`}
                    />
                  );
                }

                const config = ASPECT_CONFIG[aspect.type];
                const applyingSeparating = aspect.isApplying ? 'A' : 'S';

                return (
                  <td
                    key={`${transitPlanet}-${natalPlanet}`}
                    className={`${cellSize} border ${borderClass} ${emptyBg}`}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span style={{ color: config?.color, fontSize: 14 }}>
                        {config?.symbol}
                      </span>
                      <span style={{ color: config?.color }} className="text-[8px] font-mono">
                        {formatDegreeMinute(aspect.orb)} {applyingSeparating}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 合盘对比盘相位矩阵 - 正方形矩阵显示 A 和 B 之间的相位
const SYNASTRY_PLANETS = [
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
  'North Node',
  'Ascendant',
];

export const SynastryAspectMatrix: React.FC<{
  aspects: Aspect[];
  language?: Language;
  personALabel?: string;
  personBLabel?: string;
}> = ({ aspects, language, personALabel, personBLabel }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 构建相位查找映射
  const aspectMap = new Map<string, Aspect>();

  aspects.forEach((a) => {
    // 合盘相位格式: planet1 (A的行星) -> planet2 (B的行星)
    const planetA = a.planet1;
    const planetB = a.planet2;

    if (SYNASTRY_PLANETS.includes(planetA) && SYNASTRY_PLANETS.includes(planetB)) {
      const key = `${planetA}|${planetB}`;
      aspectMap.set(key, a);
    }
  });

  const cellSize = 'h-10 w-10 md:h-12 md:w-12';
  const headerBg = isDark ? 'bg-space-800' : 'bg-gray-100';
  const borderClass = isDark ? 'border-space-600' : 'border-gray-200';
  const emptyBg = isDark ? 'bg-space-900/40' : 'bg-white';
  const labelClass = isDark ? 'text-star-400 text-[9px]' : 'text-paper-400 text-[9px]';

  return (
    <div className="overflow-x-auto">
      <table className="table-fixed border-collapse text-center">
        <thead>
          <tr>
            {/* 左上角：A/B 标签 */}
            <th className={`${cellSize} ${headerBg} border ${borderClass}`}>
              <div className="flex flex-col items-center justify-center text-[8px] leading-tight">
                <span className={labelClass}>{personALabel || 'A'}</span>
                <span className="text-[6px] opacity-40">↓</span>
                <span className={labelClass}>{personBLabel || 'B'}</span>
                <span className="text-[6px] opacity-40">→</span>
              </div>
            </th>
            {/* B 的行星列标题 */}
            {SYNASTRY_PLANETS.map((planet) => (
              <th key={planet} className={`${cellSize} ${headerBg} border ${borderClass}`}>
                <div className="flex items-center justify-center">
                  <PlanetGlyph name={planet} size={14} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SYNASTRY_PLANETS.map((planetA) => (
            <tr key={planetA}>
              {/* A 的行星行标题 */}
              <th className={`${cellSize} ${headerBg} border ${borderClass}`}>
                <div className="flex items-center justify-center">
                  <PlanetGlyph name={planetA} size={14} />
                </div>
              </th>
              {/* 相位单元格 */}
              {SYNASTRY_PLANETS.map((planetB) => {
                const key = `${planetA}|${planetB}`;
                const aspect = aspectMap.get(key);

                if (!aspect) {
                  return (
                    <td
                      key={`${planetA}-${planetB}`}
                      className={`${cellSize} border ${borderClass} ${emptyBg}`}
                    />
                  );
                }

                const config = ASPECT_CONFIG[aspect.type];
                const applyingSeparating = aspect.isApplying ? 'A' : 'S';

                return (
                  <td
                    key={`${planetA}-${planetB}`}
                    className={`${cellSize} border ${borderClass} ${emptyBg}`}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span style={{ color: config?.color, fontSize: 12 }}>
                        {config?.symbol}
                      </span>
                      <span style={{ color: config?.color }} className="text-[7px] font-mono">
                        {formatDegreeMinute(aspect.orb)} {applyingSeparating}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
