// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay、sunSign（signElement/signModality）、
//        services/apiClient（fetchPositions）、共享原语 ToolPageShell / ToolResultCard / PlacementList / PlacementRow /
//        ElementBalanceBar / ToolFunnelCTA。
// OUTPUT: 当前天象盘工具——展示某 UTC 日 10 大行星的星座/度数/逆行（默认今天，可选日期），
//         附客户端算出的元素/模态平衡条 + 逆行计数 chip + 导流到出生星盘的品牌 CTA。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/current-planets。纯事实天象（无 LLM、无出生数据、无位置）；
//      元素/模态分布由本地 signElement/signModality 现算（零额外请求、无 AI）。
//      静态 SEO 正文在 scripts/generate-seo-pages.mjs。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { signLabel, planetLabel, formatDegMin } from "./astroDisplay";
import { signElement, signModality } from "./sunSign";
import type { ZodiacSign, Element, Modality } from "./sunSign";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard, PlacementList, PlacementRow } from "./ToolResultCard";
import { ElementBalanceBar } from "./ElementBalanceBar";
import type { ElementCounts, ModalityCounts } from "./ElementBalanceBar";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import {
  fetchPositions,
  type PositionsResponse,
  type TodayPosition,
} from "../../services/apiClient";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

interface SkyShape {
  elements: ElementCounts;
  modalities: ModalityCounts;
  retrogrades: number;
}

// 客户端从 10 个落座现算元素/模态分布 + 逆行计数（零额外请求、无 AI）。
// sign 是后端给的英文星座名；非 12 星座则跳过（防御性，正常不会发生）。
const VALID_SIGNS = new Set<string>([
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
]);

const computeSkyShape = (positions: readonly TodayPosition[]): SkyShape => {
  const elements: ElementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: ModalityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
  let retrogrades = 0;
  for (const p of positions) {
    if (p.retrograde) retrogrades += 1;
    if (!VALID_SIGNS.has(p.sign)) continue;
    const sign = p.sign as ZodiacSign;
    const el: Element = signElement(sign);
    const mod: Modality = signModality(sign);
    elements[el] += 1;
    modalities[mod] += 1;
  }
  return { elements, modalities, retrogrades };
};

export const CurrentPlanetsTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [date, setDate] = useState<string>(todayIso());
  const [data, setData] = useState<PositionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchPositions(d || undefined);
        setData(res);
      } catch {
        setError(
          lang === "zh"
            ? "暂时无法获取天象数据，请稍后再试。"
            : "Sky data is unavailable right now. Please try again shortly.",
        );
      } finally {
        setLoading(false);
      }
    },
    [lang],
  );

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const isToday = date === todayIso();

  const shape = useMemo<SkyShape | null>(
    () => (data ? computeSkyShape(data.positions) : null),
    [data],
  );

  const headline = isToday
    ? lang === "zh"
      ? "今日天空"
      : "Today's Sky"
    : lang === "zh"
      ? `${data?.date ?? date} 的天空`
      : `Sky on ${data?.date ?? date}`;

  return (
    <ToolPageShell
      title={lang === "zh" ? "当前天象盘" : "Current Planets"}
      subtitle={
        lang === "zh"
          ? "此刻天空中每颗行星所在的星座与度数——基于 Swiss Ephemeris 真实天文数据。"
          : "Where every planet sits in the sky right now — by sign and degree, on real Swiss Ephemeris astronomy."
      }
      slug="current-planets"
    >
      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-2xl p-6 sm:p-8 mb-8 transition-all duration-300 ease-in-out`}
      >
        <label
          htmlFor="current-planets-date"
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "查看某一天的天空" : "Show the sky for a date"}
        </label>
        <input
          id="current-planets-date"
          type="date"
          value={date}
          max="2100-12-31"
          min="1800-01-01"
          onChange={(e) => setDate(e.target.value || todayIso())}
          className={`w-full sm:w-auto px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        />
        <p className={`mt-2 text-xs ${th.textSecondary}`}>
          {lang === "zh"
            ? "位置按当日 00:00 UTC 计算。星座度数以黄道为准，与所在城市无关。"
            : "Positions are computed for 00:00 UTC of the chosen day. Sign degrees are geocentric and independent of your city."}
        </p>
      </div>

      {loading && (
        <div className={`text-center ${th.textSecondary} py-8`}>
          {lang === "zh" ? "计算中…" : "Calculating…"}
        </div>
      )}

      {error && !loading && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <ToolResultCard
          headline={headline}
          sub={
            lang === "zh"
              ? "Rx 标记表示该行星在逆行。点任意一行可查看该星座词条。"
              : "An Rx tag means the planet is retrograde. Tap any row to read the sign's wiki entry."
          }
        >
          {shape && (
            <div className="mb-6">
              <ElementBalanceBar
                elements={shape.elements}
                modalities={shape.modalities}
                lang={lang}
              />
              <div className="mt-4 flex items-center gap-2 border-t border-paper-300/50 pt-4 dark:border-gold-500/10">
                <span className="rounded-md bg-mystic-500/15 px-2 py-0.5 font-mono text-xs font-semibold uppercase text-mystic-400">
                  {shape.retrogrades} Rx
                </span>
                <span className={`text-xs ${th.textSecondary}`}>
                  {shape.retrogrades === 0
                    ? lang === "zh"
                      ? "今天没有行星逆行——天空在直行。"
                      : "No planets retrograde — the sky is direct."
                    : lang === "zh"
                      ? `${shape.retrogrades} 颗行星正在逆行。`
                      : `${shape.retrogrades} planet${shape.retrogrades > 1 ? "s" : ""} currently retrograde.`}
                </span>
              </div>
            </div>
          )}

          <PlacementList>
            {data.positions.map((p: TodayPosition) => (
              <PlacementRow
                key={p.name}
                planet={p.name}
                sign={p.sign}
                label={planetLabel(p.name, lang)}
                value={signLabel(p.sign, lang)}
                detail={formatDegMin(p.degree)}
                retrograde={p.retrograde}
                retrogradeLabel={lang === "zh" ? "逆" : "Rx"}
                href={
                  VALID_SIGNS.has(p.sign)
                    ? `/wiki/${p.sign.toLowerCase()}`
                    : undefined
                }
              />
            ))}
          </PlacementList>
        </ToolResultCard>
      )}

      {data && !loading && !error && (
        <ToolFunnelCTA
          tool="current-planets"
          label={
            lang === "zh"
              ? "看看今日天空如何照进你的星盘——免费生成出生星盘"
              : "See how today's sky hits YOUR chart — build your free birth chart"
          }
          href="/birth-chart-calculator"
          note={
            lang === "zh"
              ? "这是一份中性的天文快照，描述行星此刻的位置，而非对未来的预测。想知道这些位置如何映射到你的本命盘，从你的出生星盘开始。"
              : "This is a neutral astronomical snapshot of where the planets are — not a prediction about the future. To see how these positions map onto your own chart, start with your birth chart."
          }
          secondaryLinks={[
            {
              label: lang === "zh" ? "了解行运的含义" : "What transits mean",
              href: "/wiki/transits",
            },
          ]}
          className="mt-8"
        />
      )}
    </ToolPageShell>
  );
};

export default CurrentPlanetsTool;
