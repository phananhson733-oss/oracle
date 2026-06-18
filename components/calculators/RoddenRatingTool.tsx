// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、EmbedCodeBox、rodden（classifyRodden/BIRTH_TIME_SOURCES）。
// OUTPUT: Rodden 出生时间可信度计算器——选择出生时间来源 → Rodden 码 + 信心档 + 哪些盘要素可信（上升天顶/宫位/月亮到度）+ 建议。
// POS: 计算器矩阵（D）教育工具，路由 /:lang/rodden-rating。纯客户端分级（无后端、无出生数据存储、无 PII）；
//      作透明/教育用途——让用户知道自己的出生时间精度如何影响星盘可信度。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useEffect, useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { EmbedCodeBox } from "./embed";
import {
  classifyRodden,
  BIRTH_TIME_SOURCES,
  type BirthTimeSource,
  type Confidence,
} from "./rodden";

const CONFIDENCE_TEXT: Record<Confidence, { en: string; zh: string }> = {
  high: { en: "High confidence", zh: "高可信度" },
  moderate: { en: "Moderate confidence", zh: "中等可信度" },
  low: { en: "Low confidence", zh: "低可信度" },
  none: { en: "No birth time", zh: "无出生时间" },
};

type Status = "reliable" | "approximate" | "unavailable";

const STATUS_TEXT: Record<Status, { en: string; zh: string }> = {
  reliable: { en: "Reliable", zh: "可信" },
  approximate: { en: "Approximate", zh: "近似" },
  unavailable: { en: "Not available", zh: "无法确定" },
};

const statusClasses = (s: Status, isDark: boolean): string => {
  if (s === "reliable")
    return isDark ? "text-emerald-300" : "text-emerald-700";
  if (s === "approximate") return isDark ? "text-amber-300" : "text-amber-700";
  return isDark ? "text-slate-400" : "text-slate-500";
};

export const RoddenRatingTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();
  const [source, setSource] = useState<BirthTimeSource>("certificate");

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const rating = useMemo(() => classifyRodden(source), [source]);

  // 把布尔可信度标志映射为三态展示。
  const angleStatus: Status =
    rating.confidence === "none"
      ? "unavailable"
      : rating.anglesReliable
        ? "reliable"
        : "approximate";
  const houseStatus: Status =
    rating.confidence === "none"
      ? "unavailable"
      : rating.housesReliable
        ? "reliable"
        : "approximate";
  const moonStatus: Status =
    rating.confidence === "none"
      ? "unavailable"
      : rating.moonExact
        ? "reliable"
        : "approximate";

  const rows: { label: string; status: Status }[] = [
    {
      label: lang === "zh" ? "上升与天顶（Asc / MC）" : "Ascendant & Midheaven",
      status: angleStatus,
    },
    {
      label: lang === "zh" ? "宫位划分" : "House cusps",
      status: houseStatus,
    },
    {
      label: lang === "zh" ? "月亮精确到度" : "Moon to the exact degree",
      status: moonStatus,
    },
    {
      label:
        lang === "zh"
          ? "行星所在星座（不依赖时间）"
          : "Planet signs (time-independent)",
      status: "reliable",
    },
  ];

  const advice = useMemo(() => {
    if (rating.code === "X")
      return lang === "zh"
        ? "出生时间未知时，可用「正午盘」或太阳盘——行星星座仍可信，但上升、宫位与精确月相需谨慎。若想要完整宫位，可考虑找占星师做出生时间校正（rectification）。"
        : "With no birth time, a noon or solar chart still gives reliable planet signs, but the Ascendant, houses, and exact Moon should be treated with caution. For full house detail, an astrologer can attempt birth-time rectification.";
    if (rating.code === "DD")
      return lang === "zh"
        ? "来源互相矛盾（Dirty Data）。在确认前，把依赖时间的部分（上升、宫位）当作不确定；先核对原始记录。"
        : "Sources conflict (Dirty Data). Treat the time-dependent parts (Ascendant, houses) as uncertain until you can confirm against an original record.";
    if (!rating.anglesReliable)
      return lang === "zh"
        ? "时间是大致的，所以上升与宫位只能算近似——它们随时间快速移动（上升约每 4 分钟 1°）。行星星座与月亮星座通常仍可信。"
        : "Because the time is rounded, the Ascendant and houses are only approximate — they move fast (the Ascendant shifts about 1° every 4 minutes). Planet and Moon signs are usually still reliable.";
    return lang === "zh"
      ? "出生时间有可靠来源——整张星盘（含上升、宫位与精确月相）都可放心使用。"
      : "Your birth time has a solid source — the whole chart, including the Ascendant, houses, and exact Moon, can be used with confidence.";
  }, [rating, lang]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh"
            ? "出生时间可信度（Rodden 评级）"
            : "Birth Time Accuracy (Rodden Rating)"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "你出生时间的来源，决定了星盘里哪些部分可信。选择来源，查看它对应的 Rodden 评级与可信范围。"
            : "How you know your birth time decides which parts of a chart you can trust. Pick your source to see its Rodden rating and what it makes reliable."}
        </p>
      </div>

      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
      >
        <label
          htmlFor="rodden-source"
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "你怎么知道出生时间的？" : "How do you know your birth time?"}
        </label>
        <select
          id="rodden-source"
          value={source}
          onChange={(e) => setSource(e.target.value as BirthTimeSource)}
          className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        >
          {BIRTH_TIME_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label[lang]}
            </option>
          ))}
        </select>
      </div>

      <div className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}>
        <div className="flex items-center gap-4 mb-5">
          <span
            className={`inline-flex items-center justify-center rounded-xl border ${th.cardBorder} px-4 py-2 text-2xl font-bold text-gold-500`}
          >
            {rating.code}
          </span>
          <div>
            <div className={`font-semibold ${th.textPrimary}`}>
              {CONFIDENCE_TEXT[rating.confidence][lang]}
            </div>
            <div className={`text-sm ${th.textSecondary}`}>
              {lang === "zh" ? "Rodden 数据评级" : "Rodden data rating"} {rating.code}
            </div>
          </div>
        </div>

        <ul className="divide-y divide-gold-500/10">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-center justify-between py-2.5"
            >
              <span className={`text-sm ${th.textPrimary}`}>{r.label}</span>
              <span
                className={`text-sm font-semibold ${statusClasses(r.status, th.isDark)}`}
              >
                {STATUS_TEXT[r.status][lang]}
              </span>
            </li>
          ))}
        </ul>

        <p className={`mt-5 text-sm leading-relaxed ${th.textSecondary}`}>
          {advice}
        </p>
      </div>

      <div className="mt-8">
        <h2 className={`text-lg font-semibold mb-2 ${th.textPrimary}`}>
          {lang === "zh" ? "Rodden 评级是什么？" : "What is the Rodden Rating?"}
        </h2>
        <p className={`text-sm leading-relaxed ${th.textSecondary}`}>
          {lang === "zh"
            ? "Rodden 评级由占星数据学者 Lois Rodden 提出，用来标注出生时间的来源可信度：AA = 官方出生记录，A = 本人或家人提供，B = 传记，C = 无来源需谨慎，DD = 来源矛盾（脏数据），X = 时间未知。它衡量的是数据来源的可靠程度，而不是星盘内容的好坏。"
            : "The Rodden Rating, devised by data astrologer Lois Rodden, records how trustworthy a birth time's source is: AA = official birth record, A = from the person or family, B = biography, C = no source so caution, DD = conflicting sources (dirty data), X = time unknown. It rates the reliability of the data source — not whether a chart is good or bad."}
        </p>
      </div>
      <EmbedCodeBox slug="rodden-rating" />
    </div>
  );
};

export default RoddenRatingTool;
