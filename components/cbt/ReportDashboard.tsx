// INPUT: React、分析数据与主题（snake_case，单列纵向排版）。
// OUTPUT: 导出报告仪表盘组件（纵向模块布局、可读性优化与安全文本处理，含编号换行、占星条目拆分与盘别分行）。
// POS: CBT 报告组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useMemo } from 'react';
import { CBTRecord, AnalysisReport } from './types';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Brain, Star, Moon, Target, CheckCircle2, Circle } from 'lucide-react';
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
  const withMarkers = normalized.replace(
    /(本命盘[:：]?|行运盘[:：]?|当日行运盘[:：]?|今日行运盘[:：]?|Natal[:：]?|Transit[:：]?|Moon Phase[:：]?|月相[:：]?)/gi,
    '\n$1'
  );
  return withMarkers.replace(/\n+/g, '\n').trim();
};

const ReportDashboard: React.FC<ReportDashboardProps> = ({ record, report, onUpdate, onClose }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const panelTone = isLight
    ? 'bg-paper-100/90 border-paper-300 shadow-[0_18px_30px_rgba(122,104,78,0.18)]'
    : 'bg-space-800/40 border-gold-500/10 shadow-xl';
  const heroTone = isLight
    ? 'bg-gradient-to-br from-paper-100 via-paper-50 to-paper-100 border-paper-300'
    : 'bg-gradient-to-br from-space-900 via-space-900 to-space-800 border-gold-500/20';
  const mutedTextTone = isLight ? 'text-star-200' : 'text-star-400';
  const goldIconTone = isLight ? 'bg-gold-500/15 text-gold-700' : 'bg-gold-500/10 text-gold-400';
  const goldChipTone = isLight ? 'bg-gold-500/15 text-gold-700 border-gold-600/30' : 'bg-gold-500/10 text-gold-300 border-gold-500/20';
  const dividerTone = isLight ? 'border-paper-300' : 'border-gold-500/10';
  const accentStrongTone = isLight ? 'text-gold-700' : 'text-accent';
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
  const aspectItems = aspectText ? parseAspectItems(splitAstroContextLines(aspectText)) : [];
  const interpretationText = cleanText(report.astro_context?.interpretation);
  const interpretationList = useMemo(() => {
    const parsed = parseNumberedList(interpretationText);
    if (!parsed.intro && parsed.items.length === 0 && interpretationText) {
      return { intro: interpretationText, items: [] as string[] };
    }
    return { intro: parsed.intro, items: parsed.items };
  }, [interpretationText]);

  const toggleAction = (index: number) => {
    if (!onUpdate) return;
    const currentCompleted = record.completedActionIndices || [];
    const newCompleted = currentCompleted.includes(index)
      ? currentCompleted.filter(i => i !== index)
      : [...currentCompleted, index];
    onUpdate({ ...record, completedActionIndices: newCompleted });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in pb-16 text-star-200">

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif text-star-50 tracking-tight">{t.journal.report_main_title}</h1>
        <p className={`font-mono text-[11px] uppercase tracking-[0.25em] opacity-70 ${mutedTextTone}`}>
          {t.journal.observation_time}{new Date(record.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className={`border rounded-[2.5rem] p-5 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden ${heroTone}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="mb-8 md:mb-0 relative z-10">
          <h3 className="text-star-200 text-[11px] uppercase tracking-[0.4em] font-black mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div> {t.journal.core_mood_fluctuation}
          </h3>
          <div className="flex items-baseline gap-6">
            <span className="text-5xl font-serif text-star-50">{primaryMood.name}</span>
            <span className={`text-5xl font-bold ${accentStrongTone}`}>↓ {decrease}%</span>
          </div>
          <p className={`mt-4 text-sm font-medium ${mutedTextTone}`}>{t.journal.fluctuation_range}{primaryMood.initialIntensity}% → {primaryMood.finalIntensity}%</p>
        </div>
        <div className="w-full md:w-1/2 h-40 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={chartAxis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                tickMargin={8}
                padding={{ left: 6, right: 6 }}
                tick={{ fill: chartAxis }}
              />
              <Tooltip
                contentStyle={chartTooltip}
                itemStyle={{ color: chartAfter }}
              />
              <Line type="monotone" dataKey={t.journal.before_label} stroke={chartBefore} strokeWidth={4} dot={{ r: 6, fill: chartBefore, strokeWidth: 0 }} />
              <Line type="monotone" dataKey={t.journal.after_label} stroke={chartAfter} strokeWidth={4} dot={{ r: 6, fill: chartAfter, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* 1. 认知评估 */}
        <div className={`backdrop-blur-xl rounded-[2.5rem] p-6 ${panelTone}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${goldIconTone}`}><Brain size={24} /></div>
            <h3 className="text-xl font-serif text-star-50">{t.journal.cognitive_assessment}</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {distortions.map((d, i) => (
              <span key={i} className={`px-3 py-1 rounded-lg text-xs border font-black uppercase tracking-[0.2em] ${goldChipTone}`}>#{cleanText(d)}</span>
            ))}
          </div>
          <p className="text-star-200 leading-relaxed text-sm font-medium">{cleanText(report.cognitive_analysis.summary)}</p>
        </div>

        {/* 2. 平衡性见地 - 移至第二位，缩小框体高度至 0.8 倍 */}
        <div className={`backdrop-blur-xl rounded-[2.5rem] p-5 ${panelTone}`}>
          <div className="flex items-center gap-4 mb-5">
            <div className={`p-2.5 rounded-2xl ${isLight ? 'bg-gold-500/15 text-gold-700' : 'bg-accent/10 text-accent'}`}><Target size={22} /></div>
            <h3 className="text-lg font-serif text-star-50">{t.journal.balanced_insight}</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {record.balancedEntries.map(entry => (
              <div key={entry.id} className={`flex flex-col p-4 border rounded-2xl group transition-all ${isLight ? 'bg-paper-50 border-paper-300 hover:bg-paper-100' : 'bg-space-800/50 border-gold-500/10 hover:bg-space-800/70'}`}>
                <p className="text-star-200 text-sm leading-relaxed mb-3 flex-1">{cleanText(entry.text)}</p>
                <div className={`flex items-center justify-between pt-3 border-t ${dividerTone}`}>
                  <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${mutedTextTone}`}>{t.journal.belief_weight}</span>
                  <span className={`font-mono font-bold text-lg ${accentStrongTone}`}>{entry.belief}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 占星解读 - 改名，优化星座信息样式 */}
        <div className={`backdrop-blur-xl rounded-[2.5rem] p-6 ${panelTone}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${goldIconTone}`}><Star size={24} /></div>
            <h3 className="text-xl font-serif text-star-50">{t.journal.astro_reading}</h3>
          </div>
          <div className="mb-4 space-y-1">
            {aspectItems.length > 0 ? aspectItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-sm ${mutedTextTone}`}>•</span>
                <span className={`text-sm font-medium ${accentStrongTone}`}>{item}</span>
              </div>
            )) : (
              <div className={`text-sm ${mutedTextTone}`}>—</div>
            )}
          </div>
          {interpretationList.items.length > 0 ? (
            <div className={`space-y-2 border-l-2 pl-4 ${dividerTone}`}>
              {interpretationList.intro && (
                <p className={`leading-relaxed text-sm ${mutedTextTone}`}>{interpretationList.intro}</p>
              )}
              <ol className={`list-decimal pl-5 space-y-1 text-sm ${mutedTextTone}`}>
                {interpretationList.items.map((item, i) => (
                  <li key={i} className="leading-relaxed">{item}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className={`leading-relaxed text-sm border-l-2 pl-4 ${mutedTextTone} ${dividerTone}`}>
              {interpretationText || '—'}
            </p>
          )}
        </div>

        {/* 4. 执行建议 */}
        <div className={`backdrop-blur-xl rounded-[2.5rem] p-6 ${panelTone}`}>
          <div className={`flex items-center gap-4 mb-5 border-b pb-5 ${dividerTone}`}>
            <CheckCircle2 size={24} className={isLight ? 'text-gold-700' : 'text-gold-400'} />
            <h3 className="text-xl font-serif text-star-50">{t.journal.action_guide}</h3>
          </div>
          <div className="space-y-3">
            {actions.map((action, i) => {
              const isCompleted = record.completedActionIndices?.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleAction(i)}
                  className={`flex items-start gap-4 py-4 px-5 rounded-2xl transition-all cursor-pointer group border ${isLight ? 'border-paper-300 hover:bg-paper-100 hover:border-gold-600/30' : 'border-gold-500/10 hover:bg-space-800/50 hover:border-gold-500/20'} ${isCompleted ? (isLight ? 'bg-gold-500/15 border-gold-600/40' : 'bg-accent/10 border-accent/20') : ''}`}
                >
                  <div className={`flex-shrink-0 mt-0.5 transition-all duration-300 ${isCompleted ? accentStrongTone + ' scale-110' : `${mutedTextTone} group-hover:text-gold-600`}`}>
                    {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-base font-medium leading-relaxed transition-all ${isCompleted ? `${mutedTextTone} line-through` : 'text-star-200'}`}>
                      {cleanText(action)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onClose}
          className="group relative overflow-hidden px-24 py-5 rounded-[2rem] transition-all hover:scale-105 active:scale-95 shadow-2xl"
        >
          <div className={`absolute inset-0 group-hover:via-gold-800/50 transition-all duration-700 ${isLight ? 'bg-gradient-to-r from-paper-200 via-gold-500/30 to-paper-200' : 'bg-gradient-to-r from-space-800 via-gold-900/50 to-space-800'}`}></div>
          <div className="relative flex items-center gap-4">
            <span className="text-star-50 font-black text-xs uppercase tracking-[0.5em]">{t.journal.return_to_stars}</span>
            <Moon size={20} className={isLight ? 'text-gold-700 animate-pulse' : 'text-gold-300 animate-pulse'} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ReportDashboard;
