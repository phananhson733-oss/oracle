// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay（signLabel/formatDegMin）、
//        services/apiClient（fetchMoonPhase）、共享原语 ToolPageShell / ToolResultCard / PlacementList / PlacementRow / GlyphBadge / ToolFunnelCTA。
// OUTPUT: 月相工具——某 UTC 日的月相名/受照比例/盈亏 + 月亮与太阳所在星座（默认今天，可选日期）；
//         含客户端 SVG 月面 hero（按受照比例+盈亏渲染明暗）、8 相周期带、静态中性相位释义、导流 CTA。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/moon-phase-calculator。纯事实天象（无 LLM、无出生数据）；
//      静态 SEO 正文在 scripts/generate-seo-pages.mjs。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { signLabel, formatDegMin } from "./astroDisplay";
import {
  fetchMoonPhase,
  type MoonPhaseResponse,
} from "../../services/apiClient";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard, PlacementList, PlacementRow } from "./ToolResultCard";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

// 8 相的规范顺序（与后端 phase 名一致）。索引用于高亮周期带 + 取释义。
const PHASE_ORDER = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
] as const;

const PHASE_ZH: Record<string, string> = {
  "New Moon": "新月",
  "Waxing Crescent": "娥眉月",
  "First Quarter": "上弦月",
  "Waxing Gibbous": "盈凸月",
  "Full Moon": "满月",
  "Waning Gibbous": "亏凸月",
  "Last Quarter": "下弦月",
  "Waning Crescent": "残月",
};

// 每相的中性一句话释义（静态客户端数据，无 AI、无命运断言）。
const PHASE_MEANING: Record<string, { en: string; zh: string }> = {
  "New Moon": {
    en: "A quiet reset — a moment many people use to set intentions before the cycle builds.",
    zh: "安静的重启——许多人会在周期展开前借此设定意图。",
  },
  "Waxing Crescent": {
    en: "Light is returning. A phase often linked with first steps and gathering momentum.",
    zh: "月光渐回。这一相常与起步和积蓄动能联系在一起。",
  },
  "First Quarter": {
    en: "Half-lit and rising — a turning point often felt as a push to act or decide.",
    zh: "半明且渐盈——常被感受为推动行动或抉择的转折点。",
  },
  "Waxing Gibbous": {
    en: "Nearly full — a stretch many associate with refining and fine-tuning what's underway.",
    zh: "接近满月——许多人将此与打磨、调整进行中的事联系起来。",
  },
  "Full Moon": {
    en: "Peak illumination — a vivid, high-contrast phase often tied to culmination and release.",
    zh: "受照高峰——鲜明、强对比的一相，常与圆满与释放相连。",
  },
  "Waning Gibbous": {
    en: "Light begins to fade — a phase often linked with sharing, gratitude, and reflection.",
    zh: "月光开始消退——这一相常与分享、感恩与回顾相连。",
  },
  "Last Quarter": {
    en: "Half-lit and dimming — a phase many use to let go and clear space.",
    zh: "半明且渐亏——许多人借此放下、清出空间。",
  },
  "Waning Crescent": {
    en: "Light nearly gone — a slower, restful phase before the next new moon.",
    zh: "月光将尽——下一次新月前更缓、更宜休整的一相。",
  },
};

// 平均朔望月长度（天）；仅用于把已返回的 angle 折算成「周期第 N 天」的友好标签。
const SYNODIC_DAYS = 29.53;

const phaseLabel = (phase: string, lang: Language): string =>
  lang === "zh" ? (PHASE_ZH[phase] ?? phase) : phase;

const phaseIndex = (phase: string): number => {
  const i = (PHASE_ORDER as readonly string[]).indexOf(phase);
  return i >= 0 ? i : -1;
};

// 由真实返回的 elongation angle（0..360）折算周期天数。angle 单调跨整周期，
// 比 illumination（盈亏对称、不可逆推天数）更可靠；不可用时返回 null（不臆造）。
const cycleDay = (angle: number): number | null => {
  if (!Number.isFinite(angle)) return null;
  const norm = ((angle % 360) + 360) % 360;
  const day = Math.round((norm / 360) * SYNODIC_DAYS);
  return Math.max(0, Math.min(Math.round(SYNODIC_DAYS), day));
};

/**
 * Client-rendered moon disc, shaded by illumination + waxing flag. Pure SVG, no
 * asset, no fetch. The lit limb sits on the correct side (waxing → right-lit).
 * Decorative (aria-hidden); the phase name + illumination text carry meaning.
 */
const MoonDisc: React.FC<{ illumination: number; waxing: boolean }> = ({
  illumination,
  waxing,
}) => {
  const r = 46;
  const cx = 50;
  const cy = 50;
  const k = Math.max(0, Math.min(1, illumination));
  // Terminator is an ellipse whose horizontal radius shrinks from full disc
  // (new/full) to zero (quarter). Sign of the offset flips at half illumination.
  const termRx = r * Math.abs(1 - 2 * k);
  const gibbous = k > 0.5;
  // Lit side: waxing lights the right limb, waning the left.
  const litRight = waxing;
  // Build the lit-region path: right (or left) semicircle plus/minus the
  // terminator ellipse half, depending on crescent vs gibbous.
  const sweepOuter = litRight ? 1 : 0;
  const sweepInner = gibbous === litRight ? 1 : 0;
  const litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweepOuter} ${cx} ${
    cy + r
  } A ${termRx} ${r} 0 0 ${sweepInner} ${cx} ${cy - r} Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-24 w-24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="moonLit" cx="42%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#fdf6e3" />
          <stop offset="100%" stopColor="#e8d8a8" />
        </radialGradient>
      </defs>
      {/* Shadowed disc */}
      <circle cx={cx} cy={cy} r={r} className="fill-space-800" />
      {/* Lit region (omit when fully dark to avoid a hairline at new moon) */}
      {k > 0.005 &&
        (k >= 0.995 ? (
          <circle cx={cx} cy={cy} r={r} fill="url(#moonLit)" />
        ) : (
          <path d={litPath} fill="url(#moonLit)" />
        ))}
      {/* Rim */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        className="stroke-gold-500/40"
        strokeWidth={1.5}
      />
    </svg>
  );
};

/** 8-phase cycle strip with the current phase highlighted. */
const PhaseStrip: React.FC<{ currentIndex: number; lang: Language }> = ({
  currentIndex,
  lang,
}) => (
  <ol className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
    {PHASE_ORDER.map((phase, i) => {
      const active = i === currentIndex;
      return (
        <li
          key={phase}
          aria-current={active ? "step" : undefined}
          className={`rounded-xl border px-2 py-2 text-center text-[11px] leading-tight transition-all duration-300 ease-in-out motion-reduce:transition-none ${
            active
              ? "border-accent/60 bg-accent/10 font-semibold text-paper-900 dark:text-star-50"
              : "border-paper-300 text-paper-600 dark:border-gold-500/20 dark:text-star-200"
          }`}
        >
          {phaseLabel(phase, lang)}
        </li>
      );
    })}
  </ol>
);

export const MoonPhaseTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [date, setDate] = useState<string>(todayIso());
  const [data, setData] = useState<MoonPhaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchMoonPhase(d || undefined);
        setData(res);
      } catch {
        setError(
          lang === "zh"
            ? "暂时无法获取月相数据，请稍后再试。"
            : "Moon data is unavailable right now. Please try again shortly.",
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

  const pct = data ? Math.round(data.illumination * 100) : 0;
  const idx = data ? phaseIndex(data.phase) : -1;
  const day = data ? cycleDay(data.angle) : null;
  const meaning = useMemo(
    () => (data ? PHASE_MEANING[data.phase] : undefined),
    [data],
  );

  const illumLine = data
    ? lang === "zh"
      ? `${pct}% 受照 · ${data.waxing ? "渐盈" : "渐亏"}`
      : `${pct}% illuminated · ${data.waxing ? "waxing" : "waning"}`
    : "";

  return (
    <ToolPageShell
      title={lang === "zh" ? "月相计算器" : "Moon Phase Calculator"}
      subtitle={
        lang === "zh"
          ? "查询任意一天的月相、受照比例与月亮所在星座——基于真实天文数据。"
          : "Find the Moon's phase, illumination, and sign for any day — on real astronomy."
      }
      slug="moon-phase-calculator"
    >
      <div
        className={`${th.cardBg} border ${th.cardBorder} mb-8 rounded-2xl p-6 transition-all duration-300 ease-in-out sm:p-8`}
      >
        <label
          htmlFor="moon-phase-date"
          className={`mb-1.5 block text-sm font-medium ${th.textPrimary}`}
        >
          {lang === "zh" ? "选择日期" : "Pick a date"}
        </label>
        <input
          id="moon-phase-date"
          type="date"
          value={date}
          max="2100-12-31"
          min="1800-01-01"
          onChange={(e) => setDate(e.target.value || todayIso())}
          className={`w-full rounded-lg border px-4 py-3 sm:w-auto ${th.inputBorder} ${th.inputBg} ${th.inputText} min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-500/50`}
        />
        <p className={`mt-2 text-xs ${th.textSecondary}`}>
          {lang === "zh"
            ? "月相按当日 00:00 UTC 计算。"
            : "Phase is computed for 00:00 UTC of the chosen day."}
        </p>
      </div>

      {loading && (
        <div className={`py-8 text-center ${th.textSecondary}`}>
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
          hero={
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center rounded-2xl border border-gold-500/20 bg-space-900/60 p-4">
                <MoonDisc
                  illumination={data.illumination}
                  waxing={data.waxing}
                />
              </div>
              <span className="font-mono text-xs text-paper-500 dark:text-star-400">
                {illumLine}
                {day !== null && (
                  <>
                    {" · "}
                    {lang === "zh"
                      ? `周期第 ${day} 天`
                      : `day ${day} of the lunar cycle`}
                  </>
                )}
              </span>
            </div>
          }
          headline={phaseLabel(data.phase, lang)}
          footer={
            <ToolFunnelCTA
              tool="moon-phase-calculator"
              label={
                lang === "zh"
                  ? "查看你的本命月亮——生成免费出生星盘"
                  : "See your natal Moon — build your free birth chart"
              }
              href="/birth-chart-calculator"
              secondaryLinks={[
                {
                  label: lang === "zh" ? "关于月亮" : "About the Moon",
                  href: "/wiki/moon",
                },
              ]}
              note={
                lang === "zh"
                  ? "这是某一天天空里的月亮。想知道它如何呼应你出生那一刻的月亮，从你的出生星盘开始。"
                  : "This is the Moon in the sky on a given day. To see how it meets the Moon you were born under, start with your birth chart."
              }
            />
          }
        >
          <PlacementList>
            <PlacementRow
              planet="Moon"
              tone="auto"
              label={lang === "zh" ? "月亮" : "Moon"}
              value={signLabel(data.moon.sign, lang)}
              detail={formatDegMin(data.moon.degree)}
            />
            <PlacementRow
              planet="Sun"
              tone="gold"
              label={lang === "zh" ? "太阳" : "Sun"}
              value={signLabel(data.sun.sign, lang)}
              detail={formatDegMin(data.sun.degree)}
            />
          </PlacementList>

          <PhaseStrip currentIndex={idx} lang={lang} />

          {meaning && (
            <p
              className={`mt-6 text-sm leading-relaxed ${th.textSecondary}`}
            >
              {lang === "zh" ? meaning.zh : meaning.en}
            </p>
          )}
        </ToolResultCard>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "月相是太阳与月亮夹角的天文现象——是事实位置，而非命运。这里的释义是各相普遍的文化联想，不是对你的预测。"
          : "A moon phase is the astronomical angle between the Sun and Moon — a fact, not a forecast. The notes here are common cultural associations for each phase, not a prediction about you."}
      </p>
    </ToolPageShell>
  );
};

export default MoonPhaseTool;
