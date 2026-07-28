// INPUT: React、useLanguage（UIComponents）、共享原语 ToolPageShell / ToolResultCard / GlyphBadge / ToolFunnelCTA、
//        rodden（classifyRodden / BIRTH_TIME_SOURCES）、design-tokens（SEMANTIC_COLORS）。
// OUTPUT: Rodden 出生时间可信度计算器——选择出生时间来源 → 签名档徽章 + 信心阶梯（AA>A>B>C>DD>X）+ 哪些盘要素可信
//         （上升/天顶/宫位/月亮，每行带 GlyphBadge + success/warning/danger 语义色）+ 静态时间敏感度数字 + Rodden 码表 + 导流 CTA。
// POS: 计算器矩阵（D）教育工具，路由 /:lang/rodden-rating。纯客户端分级（classifyRodden 无后端、无出生数据存储、无 PII）；
//      作透明/教育用途——让用户知道自己的出生时间精度如何影响星盘可信度。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard, PlacementList } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import { SEMANTIC_COLORS } from "../design-tokens";
import {
  classifyRodden,
  BIRTH_TIME_SOURCES,
  type BirthTimeSource,
  type Confidence,
  type RoddenCode,
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

// 三态 → SEMANTIC_COLORS（success/warning/danger），不用裸 emerald/amber/slate。
const STATUS_SEMANTIC: Record<Status, (typeof SEMANTIC_COLORS)[keyof typeof SEMANTIC_COLORS]> = {
  reliable: SEMANTIC_COLORS.success,
  approximate: SEMANTIC_COLORS.warning,
  unavailable: SEMANTIC_COLORS.danger,
};

// 信心阶梯：从最可信到时间未知。current 高亮，其余淡化。
const CODE_LADDER: RoddenCode[] = ["AA", "A", "B", "C", "DD", "X"];

// 每个 Rodden 码的来源含义 + 它让星盘哪部分可信（用于完整码表）。
const CODE_TABLE: Record<RoddenCode, { source: { en: string; zh: string }; chart: { en: string; zh: string } }> = {
  AA: {
    source: { en: "Official birth record (certificate, hospital)", zh: "官方出生记录（证明、医院）" },
    chart: { en: "Full chart — angles, houses, exact Moon", zh: "整张盘——上升、宫位、精确月相" },
  },
  A: {
    source: { en: "From the person or family", zh: "本人或家人提供" },
    chart: { en: "Usually full chart; verify if only remembered", zh: "通常完整；仅凭记忆则需核实" },
  },
  B: {
    source: { en: "Biography or memoir (no original record)", zh: "传记或回忆录（无原始记录）" },
    chart: { en: "Signs and Moon solid; angles approximate", zh: "星座与月亮可信；上升近似" },
  },
  C: {
    source: { en: "Caution — no documented source", zh: "需谨慎——无书面来源" },
    chart: { en: "Treat angles and houses as a rough guide", zh: "上升与宫位仅作粗略参考" },
  },
  DD: {
    source: { en: "Dirty data — sources disagree", zh: "脏数据——来源互相矛盾" },
    chart: { en: "Time-dependent parts unreliable until confirmed", zh: "依赖时间的部分确认前不可靠" },
  },
  X: {
    source: { en: "Time of birth unknown", zh: "出生时间未知" },
    chart: { en: "Planet signs only; no angles or houses", zh: "仅行星星座；无上升与宫位" },
  },
};

export const RoddenRatingTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const [source, setSource] = useState<BirthTimeSource>("certificate");

  const rating = useMemo(() => classifyRodden(source), [source]);

  // 把布尔可信度标志映射为三态展示。
  const toStatus = (ok: boolean): Status =>
    rating.confidence === "none"
      ? "unavailable"
      : ok
        ? "reliable"
        : "approximate";

  const rows: { planet: string; label: string; status: Status }[] = [
    {
      planet: "Ascendant",
      label: lang === "zh" ? "上升（Ascendant）" : "Ascendant",
      status: toStatus(rating.anglesReliable),
    },
    {
      planet: "Midheaven",
      label: lang === "zh" ? "宫位与天顶（MC）" : "Houses & Midheaven",
      status: toStatus(rating.housesReliable),
    },
    {
      planet: "Moon",
      label: lang === "zh" ? "月亮精确到度" : "Moon to the exact degree",
      status: toStatus(rating.moonExact),
    },
  ];

  const advice = useMemo(() => {
    if (rating.code === "X")
      return lang === "zh"
        ? "出生时间未知时，可用「正午盘」或太阳盘——行星星座仍可信，但上升、宫位与精确月相需谨慎。若想要完整宫位，可考虑找占星师做出生时间校正（rectification）。"
        : "With no birth time, a noon or solar chart still gives reliable planet signs, but the Ascendant, houses, and exact Moon should be treated with caution. For full house detail, an astrologer can attempt birth-time rectification.";
    if (rating.code === "DD")
      return lang === "zh"
        ? "来源互相矛盾（Dirty Data）。在确认前，把依赖时间的部分（上升、宫位）当作不确定；先核对原始记录，或请占星师做校正（rectification）。"
        : "Sources conflict (Dirty Data). Treat the time-dependent parts (Ascendant, houses) as uncertain until you can confirm against an original record — or have an astrologer attempt rectification.";
    if (!rating.anglesReliable)
      return lang === "zh"
        ? "时间是大致的，所以上升与宫位只能算近似——它们随时间快速移动（上升约每 4 分钟 1°）。行星星座与月亮星座通常仍可信。"
        : "Because the time is rounded, the Ascendant and houses are only approximate — they move fast (the Ascendant shifts about 1° every 4 minutes). Planet and Moon signs are usually still reliable.";
    return lang === "zh"
      ? "出生时间有可靠来源——整张星盘（含上升、宫位与精确月相）都可放心使用。"
      : "Your birth time has a solid source — the whole chart, including the Ascendant, houses, and exact Moon, can be used with confidence.";
  }, [rating, lang]);

  return (
    <ToolPageShell
      title={
        lang === "zh"
          ? "出生时间可信度（Rodden 评级）"
          : "Birth Time Accuracy (Rodden Rating)"
      }
      subtitle={
        lang === "zh"
          ? "你出生时间的来源，决定了星盘里哪些部分可信。选择来源，查看它对应的 Rodden 评级与可信范围。"
          : "How you know your birth time decides which parts of a chart you can trust. Pick your source to see its Rodden rating and what it makes reliable."
      }
      slug="rodden-rating"
    >
      <div className="mb-8 rounded-2xl border border-paper-300 bg-white p-6 transition-all duration-300 ease-in-out hover:shadow-xl sm:p-8 dark:border-gold-500/20 dark:bg-space-900/60 motion-reduce:transition-none">
        <label
          htmlFor="rodden-source"
          className="mb-1.5 block text-sm font-medium text-paper-900 dark:text-star-50"
        >
          {lang === "zh"
            ? "你怎么知道出生时间的？"
            : "How do you know your birth time?"}
        </label>
        <select
          id="rodden-source"
          value={source}
          onChange={(e) => setSource(e.target.value as BirthTimeSource)}
          className="min-h-[44px] w-full rounded-lg border border-paper-300 bg-white px-4 py-3 text-paper-900 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 dark:border-gold-500/20 dark:bg-space-900/70 dark:text-star-50"
        >
          {BIRTH_TIME_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label[lang]}
            </option>
          ))}
        </select>
      </div>

      <ToolResultCard>
        <div className="flex items-center gap-4">
          <GlyphBadge
            glyph={rating.code}
            tone={
              rating.confidence === "high"
                ? "gold"
                : rating.confidence === "none"
                  ? "muted"
                  : "mystic"
            }
            size="hero"
          />
          <div>
            <div className="font-semibold text-paper-900 dark:text-star-50">
              {CONFIDENCE_TEXT[rating.confidence][lang]}
            </div>
            <div className="text-sm text-paper-600 dark:text-star-200">
              {lang === "zh" ? "Rodden 数据评级" : "Rodden data rating"}{" "}
              <span className="font-mono">{rating.code}</span>
            </div>
          </div>
        </div>

        {/* 信心阶梯：AA 最可信 → X 时间未知，高亮当前档。 */}
        <div
          className="mt-6 flex flex-wrap items-center gap-2"
          role="img"
          aria-label={
            lang === "zh"
              ? `当前 Rodden 评级 ${rating.code}`
              : `Current Rodden rating ${rating.code}`
          }
        >
          {CODE_LADDER.map((code, i) => {
            const active = code === rating.code;
            return (
              <React.Fragment key={code}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs text-paper-400 dark:text-star-400"
                  >
                    &gt;
                  </span>
                )}
                <span
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                    active
                      ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                      : "text-paper-400 dark:text-star-400"
                  }`}
                >
                  {code}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        <PlacementList className="mt-6">
          {rows.map((r) => {
            const c = STATUS_SEMANTIC[r.status];
            return (
              <div key={r.planet} className="flex items-center gap-3 py-3">
                <GlyphBadge planet={r.planet} tone="muted" size="md" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-paper-900 dark:text-star-50">
                  {r.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.bgLight} ${c.text}`}
                >
                  {STATUS_TEXT[r.status][lang]}
                </span>
              </div>
            );
          })}
          {/* 行星星座不依赖时间——永远可信。 */}
          <div className="flex items-center gap-3 py-3">
            <GlyphBadge planet="Sun" tone="muted" size="md" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-paper-900 dark:text-star-50">
              {lang === "zh"
                ? "行星所在星座（不依赖时间）"
                : "Planet signs (time-independent)"}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SEMANTIC_COLORS.success.bgLight} ${SEMANTIC_COLORS.success.text}`}
            >
              {STATUS_TEXT.reliable[lang]}
            </span>
          </div>
        </PlacementList>

        <p className="mt-6 text-sm leading-relaxed text-paper-600 dark:text-star-200">
          {advice}
        </p>

        <ToolFunnelCTA
          className="mt-6"
          tool="rodden-rating"
          label={
            lang === "zh" ? "生成你的完整本命盘" : "Build your full birth chart"
          }
          href="/birth-chart-calculator"
          note={
            lang === "zh"
              ? "知道时间从哪来之后，下一步就是排出完整星盘。"
              : "Now that you know where your time comes from, the next step is the full chart."
          }
          secondaryLinks={[
            {
              label: lang === "zh" ? "本命盘是什么" : "What a natal chart is",
              href: "/wiki/natal-chart",
            },
            {
              label: lang === "zh" ? "如何读懂星盘" : "How to read your chart",
              href: "/wiki/how-to-read-birth-chart",
            },
          ]}
        />
      </ToolResultCard>

      {/* 静态时间敏感度数字（纯文本，无计算、无 AI）。 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-paper-900 dark:text-star-50">
          {lang === "zh"
            ? "几分钟能差多少？"
            : "How much does a few minutes move?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-600 dark:text-star-200">
          {lang === "zh"
            ? "上升点随地球自转移动，大约每 4 分钟走 1°；月亮慢得多，约每小时 0.5°。所以 30 分钟的误差会让上升偏移约 7.5°——往往跨过一整个星座——但月亮只动约 0.25°。这就是为什么精确的出生时间对上升和宫位最关键，对行星与月亮星座几乎无影响。"
            : "The Ascendant moves with Earth's rotation — about 1° every 4 minutes. The Moon is far slower, roughly 0.5° per hour. So a 30-minute error shifts your Ascendant about 7.5° — often a whole sign — but your Moon only about 0.25°. That is why an exact birth time matters most for the Ascendant and houses, and barely at all for planet and Moon signs."}
        </p>
      </div>

      {/* 完整 Rodden 码表，高亮当前档；X/DD 附校正提示。 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-paper-900 dark:text-star-50">
          {lang === "zh"
            ? "Rodden 评级码对照表"
            : "The Rodden Rating codes"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-600 dark:text-star-200">
          {lang === "zh"
            ? "由占星数据学者 Lois Rodden 提出，用来标注出生时间「来源」的可信度——衡量的是数据来源，而不是星盘内容的好坏。"
            : "Devised by data astrologer Lois Rodden, these codes record how trustworthy a birth time's source is — they rate the data, not whether a chart is good or bad."}
        </p>
        <div className="mt-4 divide-y divide-paper-200/70 dark:divide-gold-500/10">
          {CODE_LADDER.map((code) => {
            const active = code === rating.code;
            return (
              <div
                key={code}
                className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                  active ? "bg-accent/[0.06]" : ""
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex min-w-[2.5rem] justify-center rounded-lg px-2 py-1 font-mono text-xs font-semibold ${
                    active
                      ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                      : "bg-paper-200/60 text-paper-600 dark:bg-space-800/60 dark:text-star-200"
                  }`}
                >
                  {code}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-paper-900 dark:text-star-50">
                    {CODE_TABLE[code].source[lang]}
                  </div>
                  <div className="mt-0.5 text-sm text-paper-600 dark:text-star-200">
                    {CODE_TABLE[code].chart[lang]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-paper-600 dark:text-star-200">
          {lang === "zh"
            ? "对于 X（时间未知）或 DD（来源矛盾）：行星星座仍然成立，可先用太阳盘或正午盘；想要可靠的上升与宫位，可请占星师做出生时间校正（rectification）——用已知的人生事件反推出生时刻。"
            : "For X (time unknown) or DD (conflicting sources): planet signs still hold, so a solar or noon chart is a fine start. For a dependable Ascendant and houses, an astrologer can attempt rectification — narrowing the birth time from known life events."}
        </p>
      </div>
    </ToolPageShell>
  );
};

export default RoddenRatingTool;
