// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchSolarReturn）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel/signLabel/formatDegMin）、sunSign（signElement/signModality）、PersonBirthFields（共享单人出生表单）、
//        共享原语 ToolPageShell / ToolResultCard / PlacementList / PlacementRow / ElementBalanceBar / ToolFunnelCTA。
// OUTPUT: 返照盘（Solar Return）计算器——出生数据 + 目标年 → /api/solar-return → 返照时刻 HERO 统计 + 10 大行星落座 +
//         客户端元素/三模态平衡 + 下一次返照倒计时 + 导流 CTA（接进真实出生星盘）。
// POS: 计算器矩阵（D）Solar Return，路由 /:lang/solar-return-calculator。出生数据 POST（PII 不进 URL）；无 LLM；中性叙事。
//      元素平衡与倒计时纯客户端从返回字段推导（零额外后端）。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchSolarReturn, type SolarReturnResponse } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { planetLabel, signLabel, formatDegMin } from "./astroDisplay";
import {
  signElement,
  signModality,
  type ZodiacSign,
  type Element,
  type Modality,
} from "./sunSign";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard, PlacementList, PlacementRow } from "./ToolResultCard";
import type { ElementCounts, ModalityCounts } from "./ElementBalanceBar";
import { ElementBalanceBar } from "./ElementBalanceBar";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";

type State = "idle" | "loading" | "result" | "error";

// 目标年下拉：今年 ±5。组件运行在客户端，new Date() 可用。
const buildYears = (): number[] => {
  const now = new Date().getFullYear();
  const out: number[] = [];
  for (let y = now - 5; y <= now + 5; y++) out.push(y);
  return out;
};

// 发光体优先排序（与 GlyphBadge 的 LUMINARY 同序，太阳→月亮在前）。
const LUMINARY_ORDER = new Map<string, number>([
  ["Sun", 0],
  ["Moon", 1],
]);
const sortLuminariesFirst = (
  positions: SolarReturnResponse["positions"],
): SolarReturnResponse["positions"] =>
  // 不 mutate 入参：先复制再排序（CLAUDE.md immutability 范围）。
  [...positions].sort((a, b) => {
    const ra = LUMINARY_ORDER.has(a.name) ? (LUMINARY_ORDER.get(a.name) as number) : 99;
    const rb = LUMINARY_ORDER.has(b.name) ? (LUMINARY_ORDER.get(b.name) as number) : 99;
    return ra - rb;
  });

// 客户端从返回的落座推导元素/三模态分布（零额外后端、无 AI）。sign 为英文体名，安全转 ZodiacSign。
const computeBalance = (
  positions: SolarReturnResponse["positions"],
): { elements: ElementCounts; modalities: ModalityCounts } => {
  const elements: ElementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: ModalityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const p of positions) {
    const sign = p.sign as ZodiacSign;
    const el = signElement(sign) as Element | undefined;
    const mod = signModality(sign) as Modality | undefined;
    if (el) elements[el] += 1;
    if (mod) modalities[mod] += 1;
  }
  return { elements, modalities };
};

// 距离下一次返照的整天数（纯日期数学，无 IO）。returnInstantUtc 已是该年的返照时刻：
// 若仍在未来 → 用它；若已过去 → 近似加一回归年（365.2422 天）。负值钳到 0。
const MS_PER_DAY = 86_400_000;
const TROPICAL_YEAR_MS = 365.2422 * MS_PER_DAY;
const daysUntilNextReturn = (returnInstantUtc: string): number | null => {
  const ts = Date.parse(returnInstantUtc);
  if (!Number.isFinite(ts)) return null;
  const now = Date.now();
  const next = ts > now ? ts : ts + TROPICAL_YEAR_MS;
  return Math.max(0, Math.ceil((next - now) / MS_PER_DAY));
};

export const SolarReturnCalculator: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const person = useRef<PersonState>(emptyPerson());
  const years = useMemo(buildYears, []);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<SolarReturnResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo<string[]>(() => MONTH_FALLBACK_EN.slice(), []);
  const onChange = useCallback((p: PersonState) => {
    person.current = p;
  }, []);

  const sortedPositions = useMemo(
    () => (result ? sortLuminariesFirst(result.positions) : []),
    [result],
  );
  const balance = useMemo(
    () => (result ? computeBalance(result.positions) : null),
    [result],
  );
  const countdownDays = useMemo(
    () => (result ? daysUntilNextReturn(result.returnInstantUtc) : null),
    [result],
  );

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
    setState("loading");
    setErrorMessage("");
    try {
      const data = await fetchSolarReturn({
        date: birth.birthDate,
        time: birth.birthTime,
        city: birth.birthCity,
        lat: birth.lat,
        lon: birth.lon,
        timezone: birth.timezone,
        accuracy: birth.accuracyLevel,
        year,
      });
      setResult(data);
      setState("result");
      trackEvent("solar_return_calculated", {
        has_time: !!person.current.time,
        year,
        placement_count: data.positions.length,
      });
      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <ToolPageShell
      slug="solar-return-calculator"
      title={lang === "zh" ? "返照盘计算器" : "Solar Return Calculator"}
      subtitle={
        lang === "zh"
          ? "找到太阳每年回到你出生位置的精确时刻，看那一刻的天空——你的「生日盘」。"
          : "Find the exact moment the Sun returns to its birth position each year — your birthday chart."
      }
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-paper-300 bg-white p-6 transition-all duration-300 ease-in-out sm:p-8 dark:border-gold-500/20 dark:bg-space-900/60 mb-8"
        noValidate
      >
        <div className="mb-5">
          <PersonBirthFields
            idPrefix="sr"
            label={lang === "zh" ? "你的出生信息" : "Your birth details"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChange}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="sr-year"
            className="block text-sm font-medium mb-1.5 text-paper-900 dark:text-star-50"
          >
            {lang === "zh" ? "返照年份" : "Solar return year"}
          </label>
          <select
            id="sr-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={`w-full sm:w-auto px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-relaxed text-paper-600 dark:text-star-200">
            {lang === "zh"
              ? "返照盘是该年里太阳回到本命位置那一刻的星盘，传统上代表那一岁的主题。"
              : "Your solar return chart is cast for the moment the Sun returns to its natal position that year — traditionally the themes of that age."}
          </p>
        </div>

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full rounded-xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 min-h-[44px] motion-reduce:transition-none"
        >
          {state === "loading"
            ? lang === "zh"
              ? "计算中…"
              : "Calculating…"
            : lang === "zh"
              ? "生成返照盘"
              : "Calculate solar return"}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className="text-paper-900 dark:text-star-50">{errorMessage}</p>
        </div>
      )}

      {state === "result" && result && (
        <ToolResultCard
          innerRef={resultRef}
          tabIndex={-1}
          headline={
            lang === "zh"
              ? `${result.year} 年返照盘`
              : `${result.year} Solar Return`
          }
          sub={
            lang === "zh"
              ? "太阳回到本命位置那一刻的天空。"
              : "The sky at the moment the Sun returns to its natal position."
          }
          footer={
            <ToolFunnelCTA
              tool="solar-return-calculator"
              href="/birth-chart-calculator"
              label={
                lang === "zh"
                  ? "返照盘对照本命盘读得最准——免费生成你的出生星盘"
                  : "A solar return reads best against your natal chart — build your free birth chart"
              }
              note={
                lang === "zh"
                  ? "返照盘描述的是这一岁的天空主题。把它叠在你的完整出生星盘上，落座才有归属。"
                  : "A solar return describes the year's sky. Layer it over your full birth chart to see where each placement lands."
              }
              secondaryLinks={[
                {
                  label:
                    lang === "zh"
                      ? "太阳回归揭示什么"
                      : "What a solar return reveals",
                  href: "/wiki/solar-return",
                },
              ]}
            />
          }
        >
          {/* HERO 统计块：返照精确时刻（UTC），等宽 + 金色强调。 */}
          <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 text-center sm:p-6 dark:bg-accent/[0.08]">
            <div className="text-xs uppercase tracking-widest text-paper-500 dark:text-star-400">
              {lang === "zh" ? "返照时刻" : "Return moment"}
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold tracking-tight text-accent sm:text-3xl">
              {result.returnDate}
            </div>
            <div className="mt-1 font-mono text-sm text-paper-700 dark:text-star-100">
              {result.returnTimeUtc} UTC
            </div>
            {countdownDays !== null && (
              <div className="mt-4 border-t border-accent/15 pt-4 text-sm text-paper-600 dark:text-star-200">
                {lang === "zh" ? (
                  <>
                    距离下一次返照还有{" "}
                    <span className="font-mono font-semibold text-paper-900 dark:text-star-50">
                      {countdownDays}
                    </span>{" "}
                    天
                  </>
                ) : (
                  <>
                    <span className="font-mono font-semibold text-paper-900 dark:text-star-50">
                      {countdownDays}
                    </span>{" "}
                    {countdownDays === 1 ? "day" : "days"} until your next solar
                    return
                  </>
                )}
              </div>
            )}
          </div>

          <PlacementList className="mt-6">
            {sortedPositions.map((p) => (
              <PlacementRow
                key={p.name}
                planet={p.name}
                sign={p.sign}
                label={planetLabel(p.name, lang)}
                value={signLabel(p.sign, lang)}
                detail={formatDegMin(p.degree)}
                retrograde={p.retrograde}
                retrogradeLabel={lang === "zh" ? "逆" : "Rx"}
              />
            ))}
          </PlacementList>

          {balance && (
            <ElementBalanceBar
              elements={balance.elements}
              modalities={balance.modalities}
              lang={lang}
              className="mt-6"
            />
          )}

          <p className="mt-6 text-sm leading-relaxed text-paper-600 dark:text-star-200">
            {lang === "zh"
              ? "返照盘描述太阳回归那一刻的天空，常被用作一岁的反思框架，而非对未来的预测。出生时间越准，返照时刻越精确。出生数据用于计算，不做保存。"
              : "A solar return describes the sky at the Sun's yearly return — often used as a reflective theme for the year ahead, not a prediction. A precise birth time sharpens the return moment. Birth data is used to compute and not stored."}
          </p>
        </ToolResultCard>
      )}
    </ToolPageShell>
  );
};

export default SolarReturnCalculator;
