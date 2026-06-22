// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchAstrocartography）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel）、acgMap（投影/seam/城市/颜色）、PersonBirthFields（共享单人出生表单）、
//        共享原语 ToolPageShell / ToolResultCard / GlyphBadge / ToolFunnelCTA。
// OUTPUT: Astrocartography 计算器——出生数据（需时间）→ /api/astrocartography → 等距世界地图叠加各行星 MC/IC/AC/DC 角线
//         + 纯客户端几何排出「最贴近主要城市的角线」榜单 + 导流 CTA。
// POS: 计算器矩阵（D）占星地图，路由 /:lang/astrocartography。出生数据 POST（PII 不进 URL），无 LLM；
//      中性叙事——线只标"出生时该行星位于地平/中天之处"，是探索的邀请而非预测。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useMemo, useRef, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import {
  fetchAstrocartography,
  type AstrocartographyResponse,
  type AcgPlanetLines,
  type AcgGeoPoint,
} from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import { planetLabel } from "./astroDisplay";
import {
  projectLon,
  projectLat,
  splitSeam,
  MAP_W,
  MAP_H,
  WORLD_CITIES,
  PLANET_ORDER,
  PLANET_COLORS,
  PLANET_ABBR,
} from "./acgMap";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";

type State = "idle" | "loading" | "result" | "error";

// 角线类型（用于榜单标签 + 图例）。
type Angle = "MC" | "IC" | "AC" | "DC";

interface NearestLine {
  city: string;
  planet: string;
  angle: Angle;
  orb: number; // 近似经度差（度）
}

const pts = (points: AcgGeoPoint[]): string =>
  points.map((p) => `${projectLon(p.lon)},${projectLat(p.lat)}`).join(" ");

// 把任意经度差归一到 [0,180]，因为地图是环绕的（-179° 与 +179° 只差 2°）。
const lonGap = (a: number, b: number): number =>
  Math.abs(((a - b + 540) % 360) - 180);

// MC/IC 是子午线（恒定经度），AC/DC 是随纬度弯曲的曲线。对一座城市，取它纬度处
// 离它最近的那段曲线经度，量经度差作为「orb」（近似，单位：度）。
const curveOrbAtLat = (
  curve: AcgGeoPoint[],
  cityLat: number,
  cityLon: number,
): number => {
  let best = Number.POSITIVE_INFINITY;
  for (const pt of curve) {
    // 只在城市纬度附近 ~10° 的曲线点上量经度差，避免拿到地图另一端的点。
    if (Math.abs(pt.lat - cityLat) > 12) continue;
    const gap = lonGap(pt.lon, cityLon);
    if (gap < best) best = gap;
  }
  return best;
};

// 对单颗行星的四条角线，返回该城市命中的最贴近的一条。
const nearestForPlanet = (
  p: AcgPlanetLines,
  cityLat: number,
  cityLon: number,
): { angle: Angle; orb: number } => {
  const candidates: Array<{ angle: Angle; orb: number }> = [
    { angle: "MC", orb: lonGap(p.mcLon, cityLon) },
    { angle: "IC", orb: lonGap(p.icLon, cityLon) },
    { angle: "AC", orb: curveOrbAtLat(p.ascending, cityLat, cityLon) },
    { angle: "DC", orb: curveOrbAtLat(p.descending, cityLat, cityLon) },
  ];
  return candidates.reduce((a, b) => (b.orb < a.orb ? b : a));
};

export const AstrocartographyTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const person = useRef<PersonState>(emptyPerson());
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AstrocartographyResponse | null>(null);
  const [visible, setVisible] = useState<Set<string>>(new Set(["Sun"]));
  const resultRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo<string[]>(() => MONTH_FALLBACK_EN.slice(), []);
  const onChange = useCallback((p: PersonState) => {
    person.current = p;
  }, []);

  const toggle = (name: string) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // 纯客户端几何：对每座主要城市找到最贴近的行星角线，按 orb 升序取前 8。
  const nearestLines = useMemo<NearestLine[]>(() => {
    if (!result) return [];
    const rows: NearestLine[] = [];
    for (const city of WORLD_CITIES) {
      let bestPlanet = "";
      let bestAngle: Angle = "MC";
      let bestOrb = Number.POSITIVE_INFINITY;
      for (const p of result.planets) {
        const { angle, orb } = nearestForPlanet(p, city.lat, city.lon);
        if (orb < bestOrb) {
          bestOrb = orb;
          bestAngle = angle;
          bestPlanet = p.name;
        }
      }
      if (Number.isFinite(bestOrb) && bestPlanet) {
        rows.push({
          city: city.name,
          planet: bestPlanet,
          angle: bestAngle,
          orb: bestOrb,
        });
      }
    }
    return rows.sort((a, b) => a.orb - b.orb).slice(0, 8);
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birth = personToBirth(person.current);
    if (!birth) {
      setErrorMessage(
        lang === "zh"
          ? "请填写出生日期并从下拉中选择城市。"
          : "Please enter your birth date and pick a city.",
      );
      setState("error");
      return;
    }
    // ACG 角线随出生时刻每小时转 ~15°，必须有出生时间。
    if (!birth.birthTime) {
      setErrorMessage(
        lang === "zh"
          ? "占星地图需要出生时间——角线随出生时刻每小时移动约 15°。"
          : "Astrocartography needs a birth time — the lines move about 15° per hour of birth time.",
      );
      setState("error");
      return;
    }
    setState("loading");
    setErrorMessage("");
    try {
      const data = await fetchAstrocartography({
        date: birth.birthDate,
        time: birth.birthTime,
        city: birth.birthCity,
        lat: birth.lat,
        lon: birth.lon,
        timezone: birth.timezone,
        accuracy: birth.accuracyLevel,
      });
      setResult(data);
      setState("result");
      trackEvent("astrocartography_calculated", {
        planet_count: data.planets.length,
      });
      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      setErrorMessage(
        lang === "zh"
          ? "出了点问题，请检查出生信息后重试。"
          : "Something went wrong. Check the birth details and try again.",
      );
      setState("error");
    }
  };

  const fieldsTheme: FieldsTheme = {
    textPrimary: th.textPrimary,
    textSecondary: th.textSecondary,
    inputBg: th.inputBg,
    inputText: th.inputText,
    inputBorder: th.inputBorder,
    cardBg: th.cardBg,
    cardBorder: th.cardBorder,
  };

  const oceanFill = th.isDark ? "#0b1220" : "#eef4fb";
  const gridStroke = th.isDark ? "#1e293b" : "#cbd5e1";
  const axisStroke = th.isDark ? "#334155" : "#94a3b8";
  const cityFill = th.isDark ? "#64748b" : "#94a3b8";
  const cityText = th.isDark ? "#94a3b8" : "#64748b";

  const renderPlanetLines = (p: AcgPlanetLines) => {
    const color = PLANET_COLORS[p.name] ?? "#888";
    const abbr = PLANET_ABBR[p.name] ?? p.name.slice(0, 2);
    const mcX = projectLon(p.mcLon);
    const icX = projectLon(p.icLon);
    const ascSegs = splitSeam(p.ascending);
    const descSegs = splitSeam(p.descending);
    const ascTop = p.ascending[p.ascending.length - 1]; // 最北点（升曲线顶）
    const descBottom = p.descending[0]; // 最南点（落曲线底）
    return (
      <g key={p.name}>
        {/* MC 子午线（实线） */}
        <line
          x1={mcX}
          y1={0}
          x2={mcX}
          y2={MAP_H}
          stroke={color}
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
        <text x={mcX + 2} y={11} fontSize={9} fill={color}>
          {abbr} MC
        </text>
        {/* IC 子午线（点线） */}
        <line
          x1={icX}
          y1={0}
          x2={icX}
          y2={MAP_H}
          stroke={color}
          strokeWidth={1.1}
          strokeDasharray="1 3"
          vectorEffect="non-scaling-stroke"
        />
        <text x={icX + 2} y={MAP_H - 4} fontSize={9} fill={color}>
          {abbr} IC
        </text>
        {/* AC 升起曲线（实线） */}
        {ascSegs.map((seg, i) => (
          <polyline
            key={`asc-${i}`}
            points={pts(seg)}
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {ascTop && (
          <text
            x={projectLon(ascTop.lon) + 2}
            y={Math.max(11, projectLat(ascTop.lat) + 9)}
            fontSize={9}
            fill={color}
          >
            {abbr} AC
          </text>
        )}
        {/* DC 落下曲线（虚线） */}
        {descSegs.map((seg, i) => (
          <polyline
            key={`desc-${i}`}
            points={pts(seg)}
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            strokeDasharray="5 3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {descBottom && (
          <text
            x={projectLon(descBottom.lon) + 2}
            y={Math.min(MAP_H - 2, projectLat(descBottom.lat) - 3)}
            fontSize={9}
            fill={color}
          >
            {abbr} DC
          </text>
        )}
      </g>
    );
  };

  return (
    <ToolPageShell
      title={
        lang === "zh" ? "占星地图（Astrocartography）" : "Astrocartography Map"
      }
      subtitle={
        lang === "zh"
          ? "看你出生那一刻，每颗行星在地平线与中天的位置投影到世界地图上的角线——一份探索地点的邀请，而非预测。"
          : "See where each planet sat on the horizon and meridian at your birth, mapped across the world — an invitation to explore places, not a prediction."
      }
      slug="astrocartography"
      maxWidth="3xl"
    >
      <form
        onSubmit={handleSubmit}
        className={`${th.cardBg} mb-8 rounded-2xl border ${th.cardBorder} p-6 transition-all duration-300 ease-in-out sm:p-8`}
        noValidate
      >
        <div className="mb-2">
          <PersonBirthFields
            idPrefix="acg"
            label={lang === "zh" ? "你的出生信息" : "Your birth details"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChange}
            timeRequired
          />
        </div>
        <p className={`mb-5 text-xs ${th.textSecondary}`}>
          {lang === "zh"
            ? "需要出生时间：角线随出生时刻每小时移动约 15°。"
            : "A birth time is required — the lines shift about 15° per hour of birth time."}
        </p>

        <button
          type="submit"
          disabled={state === "loading"}
          className="min-h-[44px] w-full rounded-2xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 motion-reduce:transition-none"
        >
          {state === "loading"
            ? lang === "zh"
              ? "绘制中…"
              : "Mapping…"
            : lang === "zh"
              ? "绘制我的占星地图"
              : "Map my astrocartography"}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary} role="alert">
            {errorMessage}
          </p>
        </div>
      )}

      {state === "result" && result && (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="space-y-8 outline-none"
          aria-live="polite"
        >
          {/* 行星开关（字形徽章 + 名称；激活态为低透明度填充胶囊） */}
          <div className="flex flex-wrap gap-2">
            {PLANET_ORDER.filter((n) =>
              result.planets.some((p) => p.name === n),
            ).map((name) => {
              const on = visible.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(name)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                    on
                      ? "border-accent/30 bg-accent/[0.08] text-paper-900 dark:text-star-50"
                      : "border-paper-300 text-paper-600 hover:border-accent/30 hover:text-paper-900 dark:border-gold-500/20 dark:text-star-200 dark:hover:text-star-50"
                  }`}
                >
                  <GlyphBadge planet={name} size="sm" />
                  {planetLabel(name, lang)}
                </button>
              );
            })}
          </div>

          {/* 世界地图 */}
          <div
            className={`${th.cardBg} rounded-2xl border ${th.cardBorder} overflow-hidden p-6 transition-all duration-300 ease-in-out`}
          >
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="h-auto w-full"
              role="img"
              aria-label={
                lang === "zh"
                  ? "世界地图上的占星角线"
                  : "Astrocartography lines on a world map"
              }
            >
              <rect x={0} y={0} width={MAP_W} height={MAP_H} fill={oceanFill} />
              {/* 经线（每 30°） */}
              {[-150, -120, -90, -60, -30, 30, 60, 90, 120, 150].map((lo) => (
                <line
                  key={`v${lo}`}
                  x1={projectLon(lo)}
                  y1={0}
                  x2={projectLon(lo)}
                  y2={MAP_H}
                  stroke={gridStroke}
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* 纬线（每 30°） */}
              {[-60, -30, 30, 60].map((la) => (
                <line
                  key={`h${la}`}
                  x1={0}
                  y1={projectLat(la)}
                  x2={MAP_W}
                  y2={projectLat(la)}
                  stroke={gridStroke}
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* 赤道 + 本初子午线 */}
              <line
                x1={0}
                y1={projectLat(0)}
                x2={MAP_W}
                y2={projectLat(0)}
                stroke={axisStroke}
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={projectLon(0)}
                y1={0}
                x2={projectLon(0)}
                y2={MAP_H}
                stroke={axisStroke}
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
              {/* 城市锚点 */}
              {WORLD_CITIES.map((c) => (
                <g key={c.name}>
                  <circle
                    cx={projectLon(c.lon)}
                    cy={projectLat(c.lat)}
                    r={1.6}
                    fill={cityFill}
                  />
                  <text
                    x={projectLon(c.lon) + 3}
                    y={projectLat(c.lat) + 2.5}
                    fontSize={7}
                    fill={cityText}
                  >
                    {c.name}
                  </text>
                </g>
              ))}
              {/* 行星角线 */}
              {result.planets
                .filter((p) => visible.has(p.name))
                .map(renderPlanetLines)}
            </svg>

            {/* 图例 */}
            <div className={`mt-3 text-xs ${th.textSecondary}`}>
              <span className="mr-3">
                {lang === "zh"
                  ? "实竖线 = MC（中天）"
                  : "Solid vertical = MC (culminating)"}
              </span>
              <span className="mr-3">
                {lang === "zh"
                  ? "点竖线 = IC（下中天）"
                  : "Dotted vertical = IC"}
              </span>
              <span className="mr-3">
                {lang === "zh"
                  ? "实曲线 = AC（上升）"
                  : "Solid curve = AC (rising)"}
              </span>
              <span>
                {lang === "zh"
                  ? "虚曲线 = DC（下降）"
                  : "Dashed curve = DC (setting)"}
              </span>
            </div>
          </div>

          {/* 最贴近主要城市的角线榜单（纯客户端几何） */}
          {nearestLines.length > 0 && (
            <ToolResultCard
              headline={
                lang === "zh"
                  ? "最贴近主要城市的角线"
                  : "Your strongest lines near major cities"
              }
              sub={
                lang === "zh"
                  ? "每座城市离它最近的行星角线，按经度近似偏差（度）排序——线越贴近，那个主题在当地越突出。这是探索的线索，不是预测。"
                  : "For each major city, the planet angle line running nearest to it, ranked by approximate offset in degrees of longitude — the closer the line, the more that theme stands out there. A clue to explore, not a forecast."
              }
            >
              <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
                {nearestLines.map((row) => (
                  <div
                    key={`${row.city}-${row.planet}-${row.angle}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <GlyphBadge planet={row.planet} size="md" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-paper-900 dark:text-star-50">
                      {row.city}
                    </span>
                    <span className="flex items-center gap-2 text-right">
                      <span className="text-sm text-paper-700 dark:text-star-100">
                        {planetLabel(row.planet, lang)} {row.angle}
                      </span>
                      <span className="font-mono text-xs text-paper-500 dark:text-star-400">
                        ~{row.orb.toFixed(1)}&deg;
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </ToolResultCard>
          )}

          <ToolFunnelCTA
            tool="astrocartography"
            label={
              lang === "zh"
                ? "看看这些角线背后的完整本命盘——免费生成你的星盘"
                : "See the full natal reading behind these lines — build your free birth chart"
            }
            href="/birth-chart-calculator"
            secondaryLinks={[
              {
                label: lang === "zh" ? "上升" : "The Ascendant",
                href: "/wiki/ascendant",
              },
              {
                label: lang === "zh" ? "天顶" : "The Midheaven",
                href: "/wiki/midheaven",
              },
            ]}
          />
        </div>
      )}

      <div className="mt-10 space-y-4">
        <div>
          <h2 className={`mb-2 text-lg font-semibold ${th.textPrimary}`}>
            {lang === "zh" ? "占星地图是什么？" : "What is astrocartography?"}
          </h2>
          <p className={`text-sm leading-relaxed ${th.textSecondary}`}>
            {lang === "zh"
              ? "占星地图（也叫迁移占星）把你出生那一刻的天空投影到世界地图上。对每颗行星，它画出四条角线：在地图上的某条经线上，该行星当时正位于中天（MC）或下中天（IC）；在某条弯曲的线上，它正从地平线升起（AC）或落下（DC）。这是一种以地点为线索探索自我的方式。"
              : "Astrocartography, also called relocation astrology, projects the sky at the moment of your birth onto a world map. For each planet it draws four angle lines: the meridians where that planet was culminating (MC) or at the lower meridian (IC), and the curves where it was rising (AC) or setting (DC). It is a way to explore yourself through place."}
          </p>
        </div>
        <div>
          <h2 className={`mb-2 text-lg font-semibold ${th.textPrimary}`}>
            {lang === "zh" ? "怎么读这张地图" : "How to read the map"}
          </h2>
          <p className={`text-sm leading-relaxed ${th.textSecondary}`}>
            {lang === "zh"
              ? "每颗行星一种颜色，用上方的开关显示或隐藏。城市标记帮你定位线经过之处。线本身只描述天文几何——出生时行星相对地平线与子午线的位置——它是一个反思与探索的起点，不预测某地会发生什么，也不保证任何结果。落在你出生地附近的线，反映的就是你本命盘里本就突出的主题。"
              : "Each planet has a colour you can show or hide with the toggles above. The city markers help you place where a line runs. The lines describe astronomy only — where a planet sat relative to the horizon and meridian at birth. They are a starting point for reflection and exploration, not a forecast of what will happen in any place and not a guarantee of any outcome. A line near your birthplace simply reflects a theme already prominent in your own chart."}
          </p>
        </div>
      </div>
    </ToolPageShell>
  );
};

export default AstrocartographyTool;
