// INPUT: React、分析数据与主题（snake_case，单列纵向排版与纸感映射）。
// OUTPUT: 导出报告仪表盘组件（纵向模块布局、行运分组补齐与暗色卡片边框增强、卡片左侧色条收窄）。
// POS: CBT 报告组件（含星象解读分组修正）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useMemo } from "react";
import { CBTRecord, AnalysisReport } from "./types";
import { Language } from "../../types";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Brain, Star, Target, CheckCircle2, Circle } from "lucide-react";
import { useLanguage, useTheme } from "../UIComponents";

interface ReportDashboardProps {
  record: CBTRecord;
  report: AnalysisReport;
  onUpdate?: (updated: CBTRecord) => void;
  onClose?: () => void;
}

const toDisplayText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    return value.map(toDisplayText).filter(Boolean).join(" ");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct =
      (typeof record.text === "string" && record.text) ||
      (typeof record.content === "string" && record.content) ||
      (typeof record.summary === "string" && record.summary) ||
      "";
    if (direct) return direct;
    for (const entry of Object.values(record)) {
      const nested = toDisplayText(entry);
      if (nested) return nested;
    }
  }
  return "";
};

const cleanText = (value: unknown) => {
  const text = toDisplayText(value);
  if (!text) return "";
  return text.replace(/\*\*/g, "").replace(/__/g, "");
};

const stripTrailingPunct = (value: string) =>
  value.replace(/\s*[。.!?;；]+$/g, "").trim();
const normalizeComparisonText = (value: string) =>
  stripTrailingPunct(value)
    .replace(/[：:]/g, "")
    .replace(/[，,、]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

const ASTRO_SECTION_PATTERN =
  "(本命盘|当日行运盘|今日行运盘|行运盘|行运|月相|Natal|Transit|Transiting|Moon Phase)";
const INTERPRETATION_SECTION_PATTERN =
  "(星象觉察提醒|身体调节处方|星象觉察|身体调节|Astrological Awareness Reminder|Body Regulation Prescription|Body Regulation Rx|Astrological Awareness|Body Regulation)";

const parseNumberedList = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return { intro: "", items: [] as string[] };
  const markerCount = (normalized.match(/\d{1,2}[、.)）]\s*/g) || []).length;
  if (markerCount < 2) return { intro: normalized, items: [] as string[] };

  const marked = normalized.replace(/(\d{1,2})[、.)）]\s*/g, "\n$1. ");
  const lines = marked
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const items: string[] = [];
  const introParts: string[] = [];

  for (const line of lines) {
    if (/^\d{1,2}\.\s*/.test(line)) {
      const item = line.replace(/^\d{1,2}\.\s*/, "").trim();
      if (item) items.push(item);
    } else {
      introParts.push(line);
    }
  }

  if (items.length === 0) return { intro: normalized, items: [] as string[] };
  return { intro: introParts.join(" "), items };
};

const parseAspectItems = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [] as string[];

  // 按本命盘/行运盘/月相等关键词分组，保持每组完整
  const ASTRO_CATEGORY_PATTERN = new RegExp(ASTRO_SECTION_PATTERN, "gi");

  // 在关键词前插入换行符作为分隔
  const withMarkers = normalized.replace(ASTRO_CATEGORY_PATTERN, "\n$1");
  const lines = withMarkers
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // 如果没有找到分类关键词，尝试按分号/句号分割
  if (lines.length <= 1 && normalized.length > 0) {
    const segments = normalized
      .split(/[;；。\n]+/)
      .map((seg) => seg.trim())
      .filter(Boolean);
    return segments.length > 0 ? segments : [normalized];
  }

  return lines;
};

const splitAstroContextLines = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n");
  const boundaryRegex = new RegExp(
    `(^|[\\n;；。.!?、，,])\\s*(?=${ASTRO_SECTION_PATTERN}\\s*[:：]?)`,
    "gi",
  );
  const withMarkers = normalized.replace(boundaryRegex, "\n");
  return withMarkers.replace(/\n+/g, "\n").trim();
};

type AstroAspectLine = { label?: string; text: string };

const normalizeAstroGroupKey = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes("本命") || lower.includes("natal")) return "natal";
  if (lower.includes("行运") || lower.includes("transit")) return "transit";
  return "other";
};

const getAstroGroupLabels = (language: Language) => ({
  natal: language === "zh" ? "本命盘" : "Natal Chart",
  transit: language === "zh" ? "行运" : "Transit",
  other: language === "zh" ? "其他" : "Other",
});

const normalizeOtherAstroLabel = (label: string, language: Language) => {
  const trimmed = label.trim();
  if (!trimmed) return "";
  if (language === "zh" && /moon phase/i.test(trimmed)) return "月相";
  if (language === "en" && trimmed.includes("月相")) return "Moon Phase";
  return trimmed;
};

const buildAstroAspectLines = (
  text: string,
  language: Language,
): AstroAspectLine[] => {
  const normalized = splitAstroContextLines(text).replace(/\r\n/g, "\n").trim();
  if (!normalized) return [] as AstroAspectLine[];

  const regex = new RegExp(`(${ASTRO_SECTION_PATTERN})\\s*[:：]?\\s*`, "gi");
  const matches = Array.from(normalized.matchAll(regex));

  if (matches.length === 0) {
    return parseAspectItems(normalized)
      .map((item) => ({ text: stripTrailingPunct(item) }))
      .filter((line) => line.text);
  }

  const segments: Array<{ label: string; text: string }> = [];
  const firstIndex = matches[0].index ?? 0;
  const intro = normalized.slice(0, firstIndex).trim();
  if (intro) {
    segments.push({ label: "", text: stripTrailingPunct(intro) });
  }

  matches.forEach((match, index) => {
    const label = match[1];
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? normalized.length)
        : normalized.length;
    const content = stripTrailingPunct(normalized.slice(start, end).trim());
    if (content) {
      segments.push({ label, text: content });
    }
  });

  if (segments.length === 0) return [];

  const grouped: Record<"natal" | "transit" | "other", string[]> = {
    natal: [],
    transit: [],
    other: [],
  };

  segments.forEach((segment) => {
    const key = normalizeAstroGroupKey(segment.label);
    if (key === "other") {
      const otherLabel = normalizeOtherAstroLabel(segment.label, language);
      const prefix = otherLabel
        ? `${otherLabel}${language === "zh" ? "：" : ": "}`
        : "";
      grouped.other.push(`${prefix}${segment.text}`.trim());
    } else {
      grouped[key].push(segment.text);
    }
  });

  const labelMap = getAstroGroupLabels(language);
  const joiner = language === "zh" ? "；" : "; ";
  const lines: AstroAspectLine[] = [];

  (["natal", "transit", "other"] as const).forEach((key) => {
    const text = grouped[key].filter(Boolean).join(joiner);
    if (text) {
      lines.push({ label: labelMap[key], text });
    }
  });

  if (lines.length > 0) return lines;

  return parseAspectItems(normalized)
    .map((item) => ({ text: stripTrailingPunct(item) }))
    .filter((line) => line.text);
};

const splitInterpretationSections = (text: string) => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [] as Array<{ label?: string; text: string }>;
  const withMarkers = normalized.replace(
    new RegExp(`\\s*(${INTERPRETATION_SECTION_PATTERN})\\s*[:：]?\\s*`, "gi"),
    "\n$1: ",
  );
  const lines = withMarkers
    .replace(/\n+/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const results: Array<{ label?: string; text: string }> = [];

  for (const line of lines) {
    const match = line.match(
      new RegExp(`^(${INTERPRETATION_SECTION_PATTERN})\\s*:\\s*(.*)$`, "i"),
    );
    if (match) {
      const label = match[1];
      const text = (match[2] || "").trim();
      const labelKey = normalizeComparisonText(label);
      const textKey = normalizeComparisonText(text);
      // 跳过文本为空或文本与标签相同的情况
      if (textKey && textKey !== labelKey) {
        results.push({ label, text });
      }
    } else {
      // 普通文本行，跳过与标签关键词相同的内容
      const isLabelKeyword = new RegExp(
        `^\\s*(${INTERPRETATION_SECTION_PATTERN})\\s*[:：]*\\s*$`,
        "i",
      ).test(line);
      if (!isLabelKeyword) {
        results.push({ text: line });
      }
    }
  }

  return results;
};

const ReportDashboard: React.FC<ReportDashboardProps> = ({
  record,
  report,
  onUpdate,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const chartGrid = `rgb(var(--space-700) / ${isLight ? "0.35" : "0.25"})`;
  const chartAxis = isLight
    ? "rgb(var(--star-400) / 0.9)"
    : "rgb(var(--star-200) / 0.9)";
  const chartTooltip = {
    backgroundColor: "rgb(var(--space-950) / 0.95)",
    border: "1px solid rgb(var(--space-700) / 0.5)",
    borderRadius: "16px",
    fontSize: "12px",
    color: "rgb(var(--star-50) / 1)",
  };
  const chartBeforeClass = isLight ? "text-accent-600" : "text-accent-500";
  const chartAfterClass = isLight ? "text-gold-600" : "text-gold-400";

  const chartData = useMemo(
    () =>
      record.moods.map((m) => ({
        name: m.name,
        [t.journal.before_label]: m.initialIntensity,
        [t.journal.after_label]: m.finalIntensity,
      })),
    [record.moods, t],
  );

  const primaryMood = record.moods.reduce((prev, current) =>
    prev.initialIntensity > current.initialIntensity ? prev : current,
  );
  const decrease =
    primaryMood.initialIntensity - (primaryMood.finalIntensity || 0);
  const distortions = Array.isArray(report.cognitive_analysis?.distortions)
    ? report.cognitive_analysis.distortions
    : [];
  const actions = Array.isArray(report.actions) ? report.actions : [];
  const aspectText = cleanText(report.astro_context?.aspect);
  const aspectLines = aspectText
    ? buildAstroAspectLines(aspectText, language)
    : [];
  const interpretationText = cleanText(report.astro_context?.interpretation);
  const interpretationTextWithMarkers = useMemo(
    () =>
      interpretationText
        .replace(
          new RegExp(
            `\\s*(${INTERPRETATION_SECTION_PATTERN})\\s*[:：]?\\s*`,
            "gi",
          ),
          "\n$1: ",
        )
        .replace(/\n+/g, "\n")
        .trim(),
    [interpretationText],
  );
  const interpretationLabel = language === "zh" ? "解读" : "Interpretation";
  const interpretationList = useMemo(() => {
    const parsed = parseNumberedList(interpretationTextWithMarkers);
    if (
      !parsed.intro &&
      parsed.items.length === 0 &&
      interpretationTextWithMarkers
    ) {
      return { intro: interpretationTextWithMarkers, items: [] as string[] };
    }
    return { intro: parsed.intro, items: parsed.items };
  }, [interpretationTextWithMarkers]);
  const interpretationSections = useMemo(
    () => splitInterpretationSections(interpretationList.intro),
    [interpretationList.intro],
  );
  const normalizeInterpretationLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("星象觉察") || lower.includes("astrological awareness"))
      return t.journal.astro_awareness;
    if (lower.includes("身体调节") || lower.includes("body regulation"))
      return t.journal.body_regulation_rx;
    return label;
  };

  const toggleAction = (index: number) => {
    if (!onUpdate) return;
    const currentCompleted = record.completedActionIndices || [];
    const newCompleted = currentCompleted.includes(index)
      ? currentCompleted.filter((i) => i !== index)
      : [...currentCompleted, index];
    onUpdate({ ...record, completedActionIndices: newCompleted });
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* 简化的标题 */}
      <div className="space-y-2">
        <h1
          className={`text-3xl font-serif ${isLight ? "text-paper-900" : "text-star-50"}`}
        >
          {t.journal.report_main_title}
        </h1>
        <p
          className={`text-xs ${isLight ? "text-paper-500" : "text-star-400"}`}
        >
          {new Date(record.timestamp).toLocaleDateString(
            language === "zh" ? "zh-CN" : "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}
        </p>
      </div>

      {/* 情绪波动卡片 */}
      <div
        className={`rounded-xl border border-l border-l-gold-500/40 p-6 ${isLight ? "bg-paper-100/85 border-paper-300" : "bg-space-900/60 border-gold-500/20"}`}
      >
        <div className="flex items-baseline gap-4 mb-4">
          <span
            className={`text-3xl font-serif ${isLight ? "text-paper-900" : "text-star-50"}`}
          >
            {primaryMood.name}
          </span>
          <span
            className={`text-2xl font-bold ${isLight ? "text-gold-700" : "text-gold-400"}`}
          >
            ↓ {decrease}%
          </span>
        </div>
        <p
          className={`text-sm mb-4 ${isLight ? "text-paper-600" : "text-star-400"}`}
        >
          {primaryMood.initialIntensity}% → {primaryMood.finalIntensity}%
        </p>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartGrid}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={chartAxis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                tickMargin={8}
                tick={{ fill: chartAxis }}
              />
              <Tooltip
                contentStyle={chartTooltip}
                itemStyle={{ color: "rgb(var(--star-50) / 1)" }}
              />
              <Line
                type="monotone"
                dataKey={t.journal.before_label}
                stroke="currentColor"
                className={chartBeforeClass}
                strokeWidth={2}
                dot={{ r: 4, fill: "currentColor", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey={t.journal.after_label}
                stroke="currentColor"
                className={chartAfterClass}
                strokeWidth={2}
                dot={{ r: 4, fill: "currentColor", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. 认知评估卡片 */}
      <div
        className={`rounded-xl border border-l border-l-accent/40 p-6 ${isLight ? "bg-paper-100/85 border-paper-300" : "bg-space-900/60 border-gold-500/20"}`}
      >
        <div
          className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? "border-paper-200" : "border-gold-500/15"}`}
        >
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? "border-accent/30 bg-paper-100/85 text-accent" : "border-accent/30 bg-space-950 text-accent"}`}
          >
            <Brain size={18} />
          </div>
          <h3
            className={`text-base font-serif ${isLight ? "text-paper-900" : "text-star-50"}`}
          >
            {t.journal.cognitive_assessment}
          </h3>
        </div>
        <div className="pl-12 space-y-4">
          <div className="flex flex-wrap gap-2">
            {distortions.map((d, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded text-xs ${isLight ? "bg-accent/10 text-accent" : "bg-accent/10 text-accent"}`}
              >
                {cleanText(d)}
              </span>
            ))}
          </div>
          <p
            className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
          >
            {cleanText(report.cognitive_analysis.summary)}
          </p>
        </div>
      </div>

      {/* 2. 平衡性见地卡片 */}
      <div
        className={`rounded-xl border border-l border-l-success/40 p-6 ${isLight ? "bg-paper-100/85 border-paper-300" : "bg-space-900/60 border-gold-500/20"}`}
      >
        <div
          className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? "border-paper-200" : "border-gold-500/15"}`}
        >
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? "border-success/30 bg-paper-100/85 text-success" : "border-success/30 bg-space-950 text-success"}`}
          >
            <Target size={18} />
          </div>
          <h3
            className={`text-base font-serif ${isLight ? "text-paper-900" : "text-star-50"}`}
          >
            {t.journal.balanced_insight}
          </h3>
        </div>
        <div className="pl-12 space-y-4">
          {record.balancedEntries.map((entry) => (
            <div
              key={entry.id}
              className={`pb-4 border-b last:border-0 last:pb-0 ${isLight ? "border-paper-200" : "border-gold-500/15"}`}
            >
              <p
                className={`text-sm leading-relaxed mb-2 ${isLight ? "text-paper-700" : "text-star-200"}`}
              >
                {cleanText(entry.text)}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${isLight ? "text-paper-500" : "text-star-400"}`}
                >
                  {t.journal.belief_weight}
                </span>
                <span
                  className={`text-base font-mono font-bold ${isLight ? "text-success" : "text-success"}`}
                >
                  {entry.belief}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 占星解读卡片 */}
      <div
        className={`rounded-xl border border-l border-l-gold-500/40 p-6 ${isLight ? "bg-paper-100/85 border-paper-300" : "bg-space-900/60 border-gold-500/20"}`}
      >
        <div
          className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? "border-paper-200" : "border-gold-500/15"}`}
        >
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? "border-gold-600/30 bg-paper-100/85 text-gold-600" : "border-gold-500/30 bg-space-950 text-gold-500"}`}
          >
            <Star size={18} />
          </div>
          <h3
            className={`text-base font-serif ${isLight ? "text-paper-900" : "text-star-50"}`}
          >
            {t.journal.astro_reading}
          </h3>
        </div>
        <div className="pl-12 space-y-3">
          {aspectLines.length > 0 ? (
            aspectLines.map((line, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? "bg-gold-600/50" : "bg-gold-500/50"}`}
                />
                <span
                  className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                >
                  {line.label && (
                    <span
                      className={`font-medium ${isLight ? "text-gold-700" : "text-gold-400"}`}
                    >
                      {line.label}:{" "}
                    </span>
                  )}
                  {line.text}
                </span>
              </div>
            ))
          ) : (
            <div
              className={`text-sm ${isLight ? "text-paper-400" : "text-star-400"}`}
            >
              —
            </div>
          )}
          {(interpretationList.intro ||
            interpretationList.items.length > 0) && (
            <div
              className={`mt-4 pt-4 border-t space-y-2 ${isLight ? "border-paper-200" : "border-gold-500/15"}`}
            >
              {interpretationSections.length > 0 &&
                interpretationSections.map((section, i) => {
                  const label = section.label
                    ? normalizeInterpretationLabel(section.label)
                    : i === 0
                      ? interpretationLabel
                      : "";
                  return (
                    <p
                      key={`${label || "section"}-${i}`}
                      className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                    >
                      {label && (
                        <span
                          className={`font-medium ${isLight ? "text-gold-700" : "text-gold-400"}`}
                        >
                          {label}:{" "}
                        </span>
                      )}
                      {section.text}
                    </p>
                  );
                })}
              {interpretationList.items.length > 0 &&
                interpretationList.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div
                      className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? "bg-gold-600/50" : "bg-gold-500/50"}`}
                    />
                    <span
                      className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                    >
                      {item}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. 执行建议卡片 */}
      <div
        className={`rounded-xl border border-l border-l-star-200/40 p-6 ${isLight ? "bg-paper-100/85 border-paper-300" : "bg-space-900/60 border-gold-500/20"}`}
      >
        <div
          className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? "border-paper-200" : "border-gold-500/15"}`}
        >
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? "border-star-200/30 bg-paper-100/85 text-star-200" : "border-star-200/30 bg-space-950 text-star-200"}`}
          >
            <CheckCircle2 size={18} />
          </div>
          <h3
            className={`text-base font-serif ${isLight ? "text-paper-900" : "text-star-50"}`}
          >
            {t.journal.action_guide}
          </h3>
        </div>
        <div className="pl-12 space-y-2">
          {actions.map((action, i) => {
            const isCompleted = record.completedActionIndices?.includes(i);
            return (
              <div
                key={i}
                onClick={() => toggleAction(i)}
                className={`flex items-start gap-3 py-2 cursor-pointer group transition-all ${isCompleted ? "opacity-60" : ""}`}
              >
                <div
                  className={`flex-shrink-0 mt-0.5 ${isCompleted ? (isLight ? "text-success" : "text-success") : isLight ? "text-paper-400" : "text-star-400"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </div>
                <p
                  className={`text-sm leading-relaxed flex-1 ${isCompleted ? "line-through" : ""} ${isLight ? "text-paper-700" : "text-star-200"}`}
                >
                  {cleanText(action)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportDashboard;
