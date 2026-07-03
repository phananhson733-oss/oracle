// INPUT: React、分析数据与主题、LLM 排版原语（LlmSection/LlmProse/LlmList/LlmField）与 services/llmText（toPlainText/parseInlineNumberedList）。
// OUTPUT: 导出报告仪表盘组件（5 节改为单列文档流 LlmSection 序列，去图标砖与色条卡片；情绪折线图本体豁免，星象分组逻辑保留）。
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
import { CheckCircle2, Circle } from "lucide-react";
import { useLanguage, useTheme } from "../UIComponents";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmList,
  LlmField,
  LLM_BODY_CLASS,
} from "../llm/LlmDoc";
import { toPlainText, parseInlineNumberedList } from "../../services/llmText";

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
  const aspectText = toPlainText(toDisplayText(report.astro_context?.aspect));
  const aspectLines = aspectText
    ? buildAstroAspectLines(aspectText, language)
    : [];
  const interpretationText = toPlainText(
    toDisplayText(report.astro_context?.interpretation),
  );
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
    const parsed = parseInlineNumberedList(interpretationTextWithMarkers);
    if (parsed) return parsed;
    return { intro: interpretationTextWithMarkers, items: [] as string[] };
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
    <LlmDoc className="w-full animate-fade-in">
      {/* 文档标题 */}
      <header className="mb-2">
        <h1 className="text-2xl font-medium tracking-[-0.01em] text-paper-900 dark:text-star-50">
          {t.journal.report_main_title}
        </h1>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
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
      </header>

      {/* 情绪波动（数据可视化，折线图本体豁免） */}
      <LlmSection first>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xl font-medium text-paper-900 dark:text-star-50">
            {primaryMood.name}
          </span>
          <span className="font-mono text-sm font-semibold text-accent">
            ↓ {decrease}%
          </span>
          <span className="font-mono text-xs text-paper-500 dark:text-star-400">
            {primaryMood.initialIntensity}% → {primaryMood.finalIntensity}%
          </span>
        </div>
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
      </LlmSection>

      {/* 认知评估 */}
      <LlmSection eyebrow={t.journal.cognitive_assessment}>
        {distortions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {distortions.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-paper-900/15 bg-paper-50/70 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-paper-600 dark:border-star-50/15 dark:bg-space-900/60 dark:text-star-300"
              >
                {toPlainText(toDisplayText(d))}
              </span>
            ))}
          </div>
        )}
        <LlmProse text={toDisplayText(report.cognitive_analysis.summary)} />
      </LlmSection>

      {/* 平衡性见地 */}
      <LlmSection eyebrow={t.journal.balanced_insight}>
        <div className="space-y-4">
          {record.balancedEntries.map((entry) => (
            <div key={entry.id}>
              <LlmProse text={toDisplayText(entry.text)} />
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                  {t.journal.belief_weight}
                </span>
                <span className="font-mono text-sm font-semibold text-accent">
                  {entry.belief}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </LlmSection>

      {/* 占星解读（星象分组逻辑保留，渲染文档流化） */}
      <LlmSection eyebrow={t.journal.astro_reading}>
        <div className="space-y-4">
          {aspectLines.length > 0 ? (
            <LlmList
              items={aspectLines.map((line) =>
                line.label
                  ? [
                      { text: `${line.label}: `, emphasis: true },
                      { text: line.text },
                    ]
                  : line.text,
              )}
            />
          ) : (
            <p className="font-mono text-xs text-paper-400 dark:text-star-400">
              —
            </p>
          )}
          {(interpretationList.intro ||
            interpretationList.items.length > 0) && (
            <div className="space-y-4">
              {interpretationSections.length > 0 &&
                interpretationSections.map((section, i) => {
                  const label = section.label
                    ? normalizeInterpretationLabel(section.label)
                    : i === 0
                      ? interpretationLabel
                      : "";
                  return label ? (
                    <LlmField
                      key={`${label || "section"}-${i}`}
                      label={label}
                      text={section.text}
                    />
                  ) : (
                    <LlmProse key={`section-${i}`} text={section.text} />
                  );
                })}
              {interpretationList.items.length > 0 && (
                <LlmList items={interpretationList.items} />
              )}
            </div>
          )}
        </div>
      </LlmSection>

      {/* 执行建议（可勾选清单，保留交互与完成态） */}
      <LlmSection eyebrow={t.journal.action_guide}>
        <ul className="space-y-1">
          {actions.map((action, i) => {
            const isCompleted = record.completedActionIndices?.includes(i);
            return (
              <li
                key={i}
                onClick={() => toggleAction(i)}
                className={`flex items-start gap-3 py-2 cursor-pointer ${isCompleted ? "opacity-60" : ""}`}
              >
                <span
                  className={`mt-0.5 shrink-0 ${isCompleted ? "text-accent" : "text-paper-400 dark:text-star-400"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </span>
                <span
                  className={`${LLM_BODY_CLASS} flex-1 ${isCompleted ? "line-through" : ""}`}
                >
                  {toPlainText(toDisplayText(action))}
                </span>
              </li>
            );
          })}
        </ul>
      </LlmSection>
    </LlmDoc>
  );
};

export default ReportDashboard;
