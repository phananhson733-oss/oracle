// INPUT: React、分析数据与主题（snake_case，单列纵向排版）。
// OUTPUT: 导出报告仪表盘组件（纵向模块布局、可读性优化与安全文本处理，含占星条目语义分行与解读分区排版）。
// POS: CBT 报告组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useMemo } from 'react';
import { CBTRecord, AnalysisReport } from './types';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Brain, Star, Target, CheckCircle2, Circle } from 'lucide-react';
import { useLanguage, useTheme } from '../UIComponents';

interface ReportDashboardProps {
  record: CBTRecord;
  report: AnalysisReport;
  onUpdate?: (updated: CBTRecord) => void;
  onClose?: () => void;
}

const toDisplayText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(toDisplayText).filter(Boolean).join(' ');
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const direct =
      (typeof record.text === 'string' && record.text) ||
      (typeof record.content === 'string' && record.content) ||
      (typeof record.summary === 'string' && record.summary) ||
      '';
    if (direct) return direct;
    for (const entry of Object.values(record)) {
      const nested = toDisplayText(entry);
      if (nested) return nested;
    }
  }
  return '';
};

const cleanText = (value: unknown) => {
  const text = toDisplayText(value);
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/__/g, '');
};

const ASTRO_SECTION_PATTERN =
  '(本命盘|行运盘|当日行运盘|今日行运盘|月相|Natal|Transit|Transiting|Moon Phase)';
const INTERPRETATION_SECTION_PATTERN =
  '(星象觉察提醒|身体调节处方|星象觉察|身体调节|Astrological Awareness Reminder|Body Regulation Prescription|Body Regulation Rx|Astrological Awareness|Body Regulation)';

const parseNumberedList = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return { intro: '', items: [] as string[] };
  const markerCount = (normalized.match(/\d{1,2}[、.)）]\s*/g) || []).length;
  if (markerCount < 2) return { intro: normalized, items: [] as string[] };

  const marked = normalized.replace(/(\d{1,2})[、.)）]\s*/g, '\n$1. ');
  const lines = marked.split('\n').map(line => line.trim()).filter(Boolean);
  const items: string[] = [];
  const introParts: string[] = [];

  for (const line of lines) {
    if (/^\d{1,2}\.\s*/.test(line)) {
      const item = line.replace(/^\d{1,2}\.\s*/, '').trim();
      if (item) items.push(item);
    } else {
      introParts.push(line);
    }
  }

  if (items.length === 0) return { intro: normalized, items: [] as string[] };
  return { intro: introParts.join(' '), items };
};

const parseAspectItems = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [] as string[];
  const numbered = parseNumberedList(normalized);
  if (numbered.items.length > 0) {
    const items = numbered.intro ? [numbered.intro, ...numbered.items] : numbered.items;
    return items.map(item => item.trim()).filter(Boolean);
  }
  const withBullets = normalized.replace(/[•·]/g, '\n');
  const lines = withBullets.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const segments: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[;；]/).map(part => part.trim()).filter(Boolean);
    segments.push(...parts);
  }
  const items: string[] = [];
  for (const segment of segments) {
    const parts = segment.split(/[,，]/).map(part => part.trim()).filter(Boolean);
    items.push(...parts);
  }
  return items.length > 0 ? items : [normalized];
};

const splitAstroContextLines = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n');
  const boundaryRegex = new RegExp(`(^|[\\n;；。.!?、，,])\\s*(?=${ASTRO_SECTION_PATTERN}\\s*[:：]?)`, 'gi');
  const withMarkers = normalized.replace(boundaryRegex, '\n');
  return withMarkers.replace(/\n+/g, '\n').trim();
};

const splitInterpretationSections = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [] as Array<{ label?: string; text: string }>;
  const withMarkers = normalized.replace(
    new RegExp(`\\s*(${INTERPRETATION_SECTION_PATTERN})\\s*[:：]?\\s*`, 'gi'),
    '\n$1: '
  );
  const lines = withMarkers.replace(/\n+/g, '\n').split('\n').map(line => line.trim()).filter(Boolean);
  return lines.map((line) => {
    const match = line.match(new RegExp(`^(${INTERPRETATION_SECTION_PATTERN})\\s*:\\s*(.*)$`, 'i'));
    if (match) {
      return { label: match[1], text: match[2] || '' };
    }
    return { text: line };
  });
};

const stripTrailingPunct = (value: string) => value.replace(/\s*[。.!?;；]+$/g, '').trim();

const ReportDashboard: React.FC<ReportDashboardProps> = ({ record, report, onUpdate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const chartGrid = isLight ? '#E4D7C6' : '#ffffff08';
  const chartAxis = isLight ? '#6D5C4C' : '#9ca3af';
  const chartTooltip = isLight
    ? { backgroundColor: '#F6F1E7', border: '1px solid rgba(159,118,69,0.35)', borderRadius: '16px', fontSize: '12px', color: '#2A2620' }
    : { backgroundColor: '#0E1116', border: '1px solid rgba(198,160,98,0.25)', borderRadius: '16px', fontSize: '12px', color: '#F2EFE7' };
  const chartBefore = isLight ? '#8C4C36' : '#B57A5A';
  const chartAfter = isLight ? '#A56A1F' : '#C6A062';

  const chartData = useMemo(() => record.moods.map(m => ({
    name: m.name,
    [t.journal.before_label]: m.initialIntensity,
    [t.journal.after_label]: m.finalIntensity,
  })), [record.moods, t]);

  const primaryMood = record.moods.reduce((prev, current) => (prev.initialIntensity > current.initialIntensity) ? prev : current);
  const decrease = primaryMood.initialIntensity - (primaryMood.finalIntensity || 0);
  const distortions = Array.isArray(report.cognitive_analysis?.distortions)
    ? report.cognitive_analysis.distortions
    : [];
  const actions = Array.isArray(report.actions) ? report.actions : [];
  const aspectText = cleanText(report.astro_context?.aspect);
  const aspectItems = aspectText
    ? parseAspectItems(splitAstroContextLines(aspectText)).map(stripTrailingPunct).filter(Boolean)
    : [];
  const interpretationText = cleanText(report.astro_context?.interpretation);
  const interpretationTextWithMarkers = useMemo(
    () => interpretationText.replace(
      new RegExp(`\\s*(${INTERPRETATION_SECTION_PATTERN})\\s*[:：]?\\s*`, 'gi'),
      '\n$1: '
    ).replace(/\n+/g, '\n').trim(),
    [interpretationText]
  );
  const interpretationLabel = language === 'zh' ? '解读' : 'Interpretation';
  const interpretationList = useMemo(() => {
    const parsed = parseNumberedList(interpretationTextWithMarkers);
    if (!parsed.intro && parsed.items.length === 0 && interpretationTextWithMarkers) {
      return { intro: interpretationTextWithMarkers, items: [] as string[] };
    }
    return { intro: parsed.intro, items: parsed.items };
  }, [interpretationTextWithMarkers]);
  const interpretationSections = useMemo(
    () => splitInterpretationSections(interpretationList.intro),
    [interpretationList.intro]
  );
  const normalizeInterpretationLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('星象觉察') || lower.includes('astrological awareness')) return t.journal.astro_awareness;
    if (lower.includes('身体调节') || lower.includes('body regulation')) return t.journal.body_regulation_rx;
    return label;
  };

  const toggleAction = (index: number) => {
    if (!onUpdate) return;
    const currentCompleted = record.completedActionIndices || [];
    const newCompleted = currentCompleted.includes(index)
      ? currentCompleted.filter(i => i !== index)
      : [...currentCompleted, index];
    onUpdate({ ...record, completedActionIndices: newCompleted });
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">

      {/* 简化的标题 */}
      <div className="space-y-2">
        <h1 className={`text-3xl font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>{t.journal.report_main_title}</h1>
        <p className={`text-xs ${isLight ? 'text-paper-500' : 'text-star-400'}`}>
          {new Date(record.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* 情绪波动卡片 */}
      <div className={`rounded-xl border border-l-4 border-l-gold-500 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
        <div className="flex items-baseline gap-4 mb-4">
          <span className={`text-3xl font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>{primaryMood.name}</span>
          <span className={`text-2xl font-bold ${isLight ? 'text-gold-700' : 'text-gold-400'}`}>↓ {decrease}%</span>
        </div>
        <p className={`text-sm mb-4 ${isLight ? 'text-paper-600' : 'text-star-400'}`}>
          {primaryMood.initialIntensity}% → {primaryMood.finalIntensity}%
        </p>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis dataKey="name" stroke={chartAxis} fontSize={11} tickLine={false} axisLine={false} interval={0} tickMargin={8} tick={{ fill: chartAxis }} />
              <Tooltip contentStyle={chartTooltip} itemStyle={{ color: chartAfter }} />
              <Line type="monotone" dataKey={t.journal.before_label} stroke={chartBefore} strokeWidth={2} dot={{ r: 4, fill: chartBefore, strokeWidth: 0 }} />
              <Line type="monotone" dataKey={t.journal.after_label} stroke={chartAfter} strokeWidth={2} dot={{ r: 4, fill: chartAfter, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. 认知评估卡片 */}
      <div className={`rounded-xl border border-l-4 border-l-accent p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-accent/30 bg-white text-accent' : 'border-accent/30 bg-space-950 text-accent'}`}>
            <Brain size={18} />
          </div>
          <h3 className={`text-base font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>{t.journal.cognitive_assessment}</h3>
        </div>
        <div className="pl-12 space-y-4">
          <div className="flex flex-wrap gap-2">
            {distortions.map((d, i) => (
              <span key={i} className={`px-2 py-1 rounded text-xs ${isLight ? 'bg-accent/10 text-accent' : 'bg-accent/10 text-accent'}`}>
                {cleanText(d)}
              </span>
            ))}
          </div>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-paper-700' : 'text-star-200'}`}>{cleanText(report.cognitive_analysis.summary)}</p>
        </div>
      </div>

      {/* 2. 平衡性见地卡片 */}
      <div className={`rounded-xl border border-l-4 border-l-success p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-success/30 bg-white text-success' : 'border-success/30 bg-space-950 text-success'}`}>
            <Target size={18} />
          </div>
          <h3 className={`text-base font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>{t.journal.balanced_insight}</h3>
        </div>
        <div className="pl-12 space-y-4">
          {record.balancedEntries.map(entry => (
            <div key={entry.id} className={`pb-4 border-b last:border-0 last:pb-0 ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
              <p className={`text-sm leading-relaxed mb-2 ${isLight ? 'text-paper-700' : 'text-star-200'}`}>{cleanText(entry.text)}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isLight ? 'text-paper-500' : 'text-star-400'}`}>{t.journal.belief_weight}</span>
                <span className={`text-base font-mono font-bold ${isLight ? 'text-success' : 'text-success'}`}>{entry.belief}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 占星解读卡片 */}
      <div className={`rounded-xl border border-l-4 border-l-gold-500 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-gold-600/30 bg-white text-gold-600' : 'border-gold-500/30 bg-space-950 text-gold-500'}`}>
            <Star size={18} />
          </div>
          <h3 className={`text-base font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>{t.journal.astro_reading}</h3>
        </div>
        <div className="pl-12 space-y-3">
          {aspectItems.length > 0 ? aspectItems.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-gold-600/50' : 'bg-gold-500/50'}`} />
              <span className={`text-sm leading-relaxed ${isLight ? 'text-paper-700' : 'text-star-200'}`}>{item}</span>
            </div>
          )) : (
            <div className={`text-sm ${isLight ? 'text-paper-400' : 'text-star-400'}`}>—</div>
          )}
          {(interpretationList.intro || interpretationList.items.length > 0) && (
            <div className={`mt-4 pt-4 border-t space-y-2 ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
              {interpretationSections.length > 0 && interpretationSections.map((section, i) => {
                const label = section.label ? normalizeInterpretationLabel(section.label) : (i === 0 ? interpretationLabel : '');
                return (
                  <p key={`${label || 'section'}-${i}`} className={`text-sm leading-relaxed ${isLight ? 'text-paper-700' : 'text-star-200'}`}>
                    {label && <span className={`font-medium ${isLight ? 'text-gold-700' : 'text-gold-400'}`}>{label}: </span>}
                    {section.text}
                  </p>
                );
              })}
              {interpretationList.items.length > 0 && interpretationList.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-gold-600/50' : 'bg-gold-500/50'}`} />
                  <span className={`text-sm leading-relaxed ${isLight ? 'text-paper-700' : 'text-star-200'}`}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. 执行建议卡片 */}
      <div className={`rounded-xl border border-l-4 border-l-star-200 p-6 ${isLight ? 'bg-white border-paper-200' : 'bg-space-900/60 border-gold-500/10'}`}>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-star-200/30 bg-white text-star-200' : 'border-star-200/30 bg-space-950 text-star-200'}`}>
            <CheckCircle2 size={18} />
          </div>
          <h3 className={`text-base font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>{t.journal.action_guide}</h3>
        </div>
        <div className="pl-12 space-y-2">
          {actions.map((action, i) => {
            const isCompleted = record.completedActionIndices?.includes(i);
            return (
              <div
                key={i}
                onClick={() => toggleAction(i)}
                className={`flex items-start gap-3 py-2 cursor-pointer group transition-all ${isCompleted ? 'opacity-60' : ''}`}
              >
                <div className={`flex-shrink-0 mt-0.5 ${isCompleted ? (isLight ? 'text-success' : 'text-success') : (isLight ? 'text-paper-400' : 'text-star-400')}`}>
                  {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </div>
                <p className={`text-sm leading-relaxed flex-1 ${isCompleted ? 'line-through' : ''} ${isLight ? 'text-paper-700' : 'text-star-200'}`}>
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
