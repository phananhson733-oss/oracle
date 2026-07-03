// INPUT: React、图表、类型与主题、LLM 排版原语（LlmDoc/LlmSection/LlmProse/LlmList）与 services/llmText（toPlainText/parseInlineNumberedList）。
// OUTPUT: 导出分析视图组件（月度洞察/处方/星象改为单列文档流，去图标砖与卡片嵌套；DataRow 数据可视化本体保留）。
// POS: CBT 分析展示组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useEffect, useMemo, useState } from 'react';
import { CBTRecord, EmojiMood } from './types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import {
  X, Brain, Thermometer, Anchor, Maximize2,
  Layers, List, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { useLanguage, useTheme } from '../UIComponents';
import { UserProfile } from '../../types';
import { useCBTIndividualAnalysis } from './utils/useCBTAggregateAnalysis';
import { LlmDoc, LlmSection, LlmProse, LlmList, LLM_BODY_CLASS } from '../llm/LlmDoc';
import { toPlainText, parseInlineNumberedList } from '../../services/llmText';

interface ViewProps {
  records: CBTRecord[];
  onClose: () => void;
  initialYear?: number;
  initialMonth?: number;
  userProfile?: UserProfile;
}

// ----------------------------------------------------------------------
// 共享配置与组件
// ----------------------------------------------------------------------

const COLORS = {
  primary: '#C6A062',
  success: '#C6A062',
  warning: '#D4B47A',
  danger: '#B57A5A',
  neutral: '#9A9386',
};

const MOOD_COLORS: Record<EmojiMood, string> = {
  very_happy: '#FFD93D',
  happy: '#4ADE80',
  okay: '#60A5FA',
  annoyed: '#FB923C',
  terrible: '#F87171',
};

const LOW_MOOD_KEYWORDS = [
  '低落', '无助', '空虚', '累', '焦虑', '烦', '丧', '难过', '沮丧', '绝望', '抑郁', '悲伤',
  '痛苦', '疲惫', '无力', '害怕', '恐惧', '紧张', '不安', '委屈', '失望', '内疚', '羞耻',
  '孤独', '压抑', '愤怒', '生气', '烦躁',
  'sad', 'anxious', 'depressed', 'hopeless', 'tired', 'exhausted', 'angry', 'frustrated',
  'irritated', 'upset', 'lonely', 'ashamed', 'guilty', 'overwhelmed', 'stressed',
];

// i18n: bidirectional translation map for user-entered mood/emotion labels
// NOTE: each English value must be unique to avoid reverse-mapping collisions
const MOOD_ZH_TO_EN: Record<string, string> = {
  '焦虑': 'Anxiety', '愤怒': 'Anger', '无力感': 'Helplessness', '羞愧': 'Shame',
  '恐惧': 'Fear', '悲伤': 'Sadness', '沮丧': 'Dejected', '自我怀疑': 'Self-doubt',
  '嫉妒': 'Jealousy', '失落': 'Dejection', '尴尬': 'Embarrassment', '社恐': 'Social anxiety',
  '内疚': 'Guilt', '悔恨': 'Regret', '被抛弃感': 'Abandonment', '不安': 'Unease',
  '挫败': 'Frustration', '羞耻': 'Humiliation', '多疑': 'Suspicion', '失望': 'Disappointment',
  '烦躁': 'Irritability', '压力': 'Stress', '委屈': 'Grievance', '自卑': 'Inferiority',
  '愧疚': 'Remorse', '担忧': 'Worry', '不甘': 'Resentment', '低落': 'Low mood',
  '无助': 'Helpless', '空虚': 'Emptiness', '累': 'Tired', '烦': 'Annoyed',
  '丧': 'Depressed', '难过': 'Sad', '绝望': 'Despair', '抑郁': 'Depression',
  '痛苦': 'Pain', '疲惫': 'Exhaustion', '害怕': 'Afraid', '紧张': 'Nervous',
  '生气': 'Angry', '压抑': 'Suppressed', '孤独': 'Lonely',
};
const MOOD_EN_TO_ZH: Record<string, string> = Object.fromEntries(
  Object.entries(MOOD_ZH_TO_EN).map(([zh, en]) => [en.toLowerCase(), zh])
);

// i18n: bidirectional translation map for symptom labels (stored as translated text)
const SYMPTOM_ZH_TO_EN: Record<string, string> = {
  '头痛': 'Headache', '头晕': 'Dizziness', '胸闷': 'Chest tightness',
  '心悸': 'Palpitations', '胃部不适': 'Stomach discomfort', '恶心': 'Nausea',
  '肩膀僵硬': 'Shoulder stiffness', '身体发抖': 'Body trembling',
  '入睡困难': 'Difficulty sleeping', '极度疲惫': 'Extreme fatigue', '无': 'None',
};
const SYMPTOM_EN_TO_ZH: Record<string, string> = Object.fromEntries(
  Object.entries(SYMPTOM_ZH_TO_EN).map(([zh, en]) => [en.toLowerCase(), zh])
);

/** Translate a mood/symptom label to the target language */
const translateLabel = (name: string, lang: string, type: 'mood' | 'symptom' = 'mood'): string => {
  const zhToEn = type === 'mood' ? MOOD_ZH_TO_EN : SYMPTOM_ZH_TO_EN;
  const enToZh = type === 'mood' ? MOOD_EN_TO_ZH : SYMPTOM_EN_TO_ZH;
  if (lang === 'en') return zhToEn[name] || name;
  return enToZh[name.toLowerCase()] || name;
};

const isNoneSymptom = (s: string) => s === '无' || s.toLowerCase() === 'none';

const filterRecordsByMonth = (records: CBTRecord[], year: number, month: number) => {
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 1).getTime();
  return records.filter(r => r.timestamp >= start && r.timestamp < end);
};

// 获取按时间倒序排列的数据，支持月度过滤
const getRecordsSorted = (records: CBTRecord[], filterYear?: number, filterMonth?: number) => {
  let filtered = [...records];

  if (filterYear !== undefined && filterMonth !== undefined) {
    filtered = filterRecordsByMonth(records, filterYear, filterMonth);
  }

  return filtered.sort((a, b) => b.timestamp - a.timestamp);
};

// 统一卡片容器
const CardContainer = ({
  title, subtitle, icon: Icon, children, onClose,
  filterYear, filterMonth, onMonthChange
}: any) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerTone = isLight ? 'bg-paper-100' : 'bg-space-950';
  const glowTone = isLight
    ? 'from-gold-500/10 via-paper-100 to-paper-100'
    : 'from-gold-900/10 via-space-950 to-space-950';
  const subtitleTone = isLight ? 'text-star-200' : 'text-star-400';
  const iconTone = isLight
    ? 'bg-gradient-to-br from-gold-500/15 to-gold-600/10 text-gold-700 border-gold-500/30'
    : 'bg-gradient-to-br from-gold-500/20 to-gold-600/10 text-gold-400 border-gold-500/20';
  const monthNavTone = isLight
    ? 'bg-paper-100 border-paper-300 text-star-200 hover:bg-paper-200'
    : 'bg-space-800/50 border-gold-500/10 text-star-400 hover:bg-space-800';

  const MONTH_NAMES = useMemo(() => [
    t.journal.month_jan, t.journal.month_feb, t.journal.month_mar, t.journal.month_apr,
    t.journal.month_may, t.journal.month_jun, t.journal.month_jul, t.journal.month_aug,
    t.journal.month_sep, t.journal.month_oct, t.journal.month_nov, t.journal.month_dec
  ], [t]);

  const handlePrevMonth = () => {
    if (!onMonthChange) return;
    const newMonth = filterMonth === 0 ? 11 : filterMonth - 1;
    const newYear = filterMonth === 0 ? filterYear - 1 : filterYear;
    onMonthChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    if (!onMonthChange) return;
    const newMonth = filterMonth === 11 ? 0 : filterMonth + 1;
    const newYear = filterMonth === 11 ? filterYear + 1 : filterYear;
    onMonthChange(newYear, newMonth);
  };

  const displayTitle = filterYear !== undefined && filterMonth !== undefined
    ? language === 'zh'
      ? `${filterYear}年${filterMonth + 1}月`
      : `${MONTH_NAMES[filterMonth]} ${filterYear}`
    : null;

  return (
    <div className={`absolute inset-0 z-[100] p-4 md:p-8 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto custom-scrollbar ${containerTone}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      <div className={`absolute inset-0 bg-radial-gradient pointer-events-none ${glowTone}`}></div>

      <header className="relative mb-6 z-10">
        {/* Single row: Title left, Time nav center, Close right */}
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.15)] border ${iconTone}`}>
               <Icon size={24} />
            </div>
            <div>
              <h3 className={`text-2xl md:text-3xl ${language === 'en' ? 'font-sans' : 'font-serif'} font-medium text-star-50 tracking-tight leading-none`}>{title}</h3>
              <p className={`text-xs uppercase tracking-[0.2em] mt-1.5 font-bold opacity-80 ${subtitleTone}`}>{subtitle}</p>
            </div>
          </div>
          {/* Center: Time navigation (absolutely positioned for true center) */}
          {displayTitle && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
              <button onClick={handlePrevMonth} className={`p-2 rounded-full border transition-all ${monthNavTone}`}>
                <ChevronLeft size={16} />
              </button>
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-xl min-w-[140px] justify-center ${monthNavTone}`}>
                <Calendar size={16} />
                <span className="text-sm font-bold">{displayTitle}</span>
              </div>
              <button onClick={handleNextMonth} className={`p-2 rounded-full border transition-all ${monthNavTone}`}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {/* Right: Close button */}
          <button onClick={onClose} className={`p-2 rounded-full border transition-all ${monthNavTone}`}>
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto space-y-6 pb-10">
        {children}
      </div>
    </div>
  );
};

// 统一行组件：数据展示
const DataRow = ({ title, children, className = "", onExpand }: any) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isLight = theme === 'light';
  const panelTone = isLight ? 'bg-paper-100/85 border-gold-600/30' : 'bg-space-800/40 border-gold-500/10';
  const labelTone = isLight ? 'text-star-300' : 'text-star-400';
  const buttonTone = isLight
    ? 'bg-paper-100 hover:bg-paper-200 text-star-300 border border-paper-200'
    : 'bg-space-900/60 hover:bg-space-900/80 text-star-400 hover:text-gold-400 border border-gold-500/15';
  const headingFont = language === 'en' ? 'font-sans' : '';

  return (
    <div className={`border rounded-xl p-6 relative overflow-hidden ${panelTone} ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-5">
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-90 ${labelTone} ${headingFont}`}>
            {title}
          </h4>
          {onExpand && (
            <button
              onClick={onExpand}
              className={`p-1.5 rounded-lg transition-all active:scale-95 ${buttonTone}`}
              title="查看全部详情"
            >
              <Maximize2 size={12} />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

// LLM 分析文本清洗：优先 AI 文本（toPlainText 规整），空则回退统计兜底。
const resolveAnalysisText = (aiText?: string, fallback?: string) => {
  const cleaned = toPlainText(aiText);
  return cleaned || fallback || '';
};

// LLM 分析读出：洞察 / 处方 / 星象三节文档流（LlmSection + LlmProse/LlmList，无图标砖、无卡片嵌套）。
const AnalysisReadout = ({
  insightHighlight,
  insightText,
  adviceLabel,
  adviceText,
  astroText,
  isLoading,
}: {
  insightHighlight?: string;
  insightText: string;
  adviceLabel: string;
  adviceText: string;
  astroText: string;
  isLoading?: boolean;
}) => {
  const { t } = useLanguage();
  const advice = parseInlineNumberedList(adviceText);
  const pulse = isLoading ? 'animate-pulse' : '';
  return (
    <LlmDoc className="mt-2">
      <LlmSection first eyebrow={t.journal.one_line_insight}>
        {insightHighlight ? (
          <p className={`${LLM_BODY_CLASS} ${pulse}`}>
            <strong className="font-semibold text-paper-900 dark:text-star-50">
              {insightHighlight}
            </strong>{' '}
            {insightText}
          </p>
        ) : (
          <LlmProse text={insightText} className={pulse} />
        )}
      </LlmSection>
      <LlmSection eyebrow={adviceLabel}>
        {advice ? (
          <>
            {advice.intro && <LlmProse text={advice.intro} className={pulse} />}
            <LlmList
              ordered
              items={advice.items}
              className={advice.intro ? 'mt-3' : ''}
            />
          </>
        ) : (
          <LlmProse text={adviceText} className={pulse} />
        )}
      </LlmSection>
      <LlmSection eyebrow={t.journal.astro_awareness}>
        <LlmProse text={astroText} className={pulse} />
      </LlmSection>
    </LlmDoc>
  );
};

// 全量数据详情弹窗
const FullDataModal = ({ title, sections, onClose }: any) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isLight = theme === 'light';
  const overlayTone = isLight ? 'bg-paper-200/80' : 'bg-space-950/80';
  const containerTone = isLight ? 'bg-paper-100 border-gold-600/30' : 'bg-space-900 border-gold-500/20';
  const dividerTone = isLight ? 'border-gold-600/20' : 'border-gold-500/10';
  const labelTone = isLight ? 'text-gold-700' : 'text-gold-400';
  const mutedText = isLight ? 'text-star-200' : 'text-star-400';
  const headingFont = language === 'en' ? 'font-sans' : '';

  return (
    <div className={`fixed inset-0 z-[200] backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 ${overlayTone}`}>
      <div className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${containerTone}`}>
        <div className={`p-6 border-b flex justify-between items-center ${dividerTone} ${isLight ? 'bg-paper-100' : 'bg-space-900'}`}>
          <h3 className="text-xl font-sans text-star-50 flex items-center gap-3">
            <List size={20} className={labelTone} />
            {title} <span className={`text-sm font-sans font-normal ml-2 ${mutedText}`}>完整统计</span>
          </h3>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-paper-200 text-star-200' : 'hover:bg-space-900/60 text-star-400'}`}><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {sections.map((section: any, idx: number) => (
            <div key={idx}>
              <h4 className={`text-xs font-black uppercase tracking-widest mb-4 border-l pl-3 ${labelTone} ${headingFont} ${isLight ? 'border-gold-600' : 'border-gold-500'}`}>{section.title}</h4>
              <div className="space-y-3">
                {section.data.map(([name, count]: any, i: number) => {
                   const maxVal = section.data[0][1];
                   const percent = (count / maxVal) * 100;
                   return (
                    <div key={name} className="group">
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-xs w-6 ${i<3 ? 'text-star-50 font-bold' : mutedText}`}>#{i+1}</span>
                          <span className="text-star-200">{name}</span>
                        </div>
                        <span className={`${mutedText} font-mono text-xs`}>{count}次</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-paper-200' : 'bg-space-800'}`}>
                        <div className={`h-full rounded-full ${section.colorClass || 'bg-gold-500'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                   )
                })}
                {section.data.length === 0 && <div className={`${mutedText} italic text-sm`}>暂无数据</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 1. 身心信号 (Somatic Patterns)
// ----------------------------------------------------------------------
export const SomaticPatternView: React.FC<ViewProps> = ({ records, onClose, initialYear, initialMonth, userProfile }) => {
  const { t, language } = useLanguage();
  const [detailsType, setDetailsType] = useState<'mood' | 'symptom' | null>(null);
  const now = new Date();
  const initialFilterYear = initialYear ?? now.getFullYear();
  const initialFilterMonth = initialMonth ?? now.getMonth();
  const [filterYear, setFilterYear] = useState(initialFilterYear);
  const [filterMonth, setFilterMonth] = useState(initialFilterMonth);

  useEffect(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      setFilterYear(initialYear);
      setFilterMonth(initialMonth);
    }
  }, [initialYear, initialMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setFilterYear(year);
    setFilterMonth(month);
  };

  const hasMonthlyRecords = useMemo(
    () => filterRecordsByMonth(records, filterYear, filterMonth).length > 0,
    [records, filterYear, filterMonth]
  );

  const stats = useMemo(() => {
    // 使用月度过滤数据
    const data = getRecordsSorted(records, filterYear, filterMonth);
    
    const moodCounts: Record<string, number> = {};
    const symptomCounts: Record<string, number> = {};
    const comboCounts: Record<string, number> = {};

    data.forEach(r => {
      const lowMoods = r.moods.filter(m => {
        const name = m.name.toLowerCase();
        return LOW_MOOD_KEYWORDS.some(k => name.includes(k));
      });
      lowMoods.forEach(m => {
        const label = translateLabel(m.name, language, 'mood');
        moodCounts[label] = (moodCounts[label] || 0) + 1;
      });

      (r.bodySymptoms || []).filter(s => !isNoneSymptom(s)).forEach(s => {
        const label = translateLabel(s, language, 'symptom');
        symptomCounts[label] = (symptomCounts[label] || 0) + 1;
      });

      if (lowMoods.length > 0 && r.bodySymptoms && r.bodySymptoms.length > 0 && !isNoneSymptom(r.bodySymptoms[0])) {
        const moodLabel = translateLabel(lowMoods[0].name, language, 'mood');
        const symptomLabel = translateLabel(r.bodySymptoms[0], language, 'symptom');
        const comboKey = `${moodLabel} + ${symptomLabel}`;
        comboCounts[comboKey] = (comboCounts[comboKey] || 0) + 1;
      }
    });

    const allMoods = Object.entries(moodCounts).sort((a,b) => b[1]-a[1]);
    const allSymptoms = Object.entries(symptomCounts).sort((a,b) => b[1]-a[1]);
    const topCombo = Object.entries(comboCounts).sort((a,b) => b[1]-a[1])[0];

    const topMoods = allMoods.slice(0,3);
    const topSymptoms = allSymptoms.slice(0,3);

    // Logic
    let insight = t.journal.no_clear_pattern;
    let advice = t.journal.keep_awareness;

    if (topCombo) {
      const moodPart = topCombo[0].split('+')[0].trim();
      const bodyPart = topCombo[0].split('+')[1].trim();
      insight = `${t.journal.when_feel_mood}${moodPart}${t.journal.body_alarms_with}${bodyPart}${t.journal.body_alarms_suffix || ''}`;
    }

    const topSympName = topSymptoms[0]?.[0];
    if (topSympName) {
      if (['睡', '疲惫', '累', '醒', 'sleep', 'fatigue', 'tired'].some(k => topSympName.toLowerCase().includes(k))) advice = t.journal.sleep_advice;
      else if (['胸', '心', '抖', '汗', 'chest', 'heart', 'tremble', 'sweat'].some(k => topSympName.toLowerCase().includes(k))) advice = t.journal.high_arousal_advice;
      else if (['头', '肩', '背', '痛', 'head', 'shoulder', 'back', 'pain'].some(k => topSympName.toLowerCase().includes(k))) advice = t.journal.tension_advice;
      else if (['胃', '恶心', 'stomach', 'nausea'].some(k => topSympName.toLowerCase().includes(k))) advice = t.journal.stomach_advice;
    }

    return { allMoods, allSymptoms, topMoods, topSymptoms, insight, advice };
  }, [records, filterYear, filterMonth, t, language]);

  const { analysis, loading } = useCBTIndividualAnalysis(
    userProfile!,
    filterYear,
    filterMonth,
    'somatic',
    stats,
    language,
    { enabled: hasMonthlyRecords }
  );

  const displayInsight = resolveAnalysisText(analysis?.insight, stats.insight);
  const displayAdvice = resolveAnalysisText(analysis?.advice, stats.advice);
  const displayAstro = resolveAnalysisText(analysis?.astro_note, t.journal.somatic_astro_note);
  const noRecordText = t.journal.no_record_text;
  const showLoading = hasMonthlyRecords && loading;
  const insightHighlight = showLoading || !hasMonthlyRecords ? '' : t.journal.somatic_cooccur;
  const insightText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_analyzing_insight : displayInsight)
    : noRecordText;
  const adviceText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_generating_advice : displayAdvice)
    : noRecordText;
  const astroText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_consulting_astro : displayAstro)
    : noRecordText;

  return (
    <CardContainer
      title={t.journal.somatic_signals}
      subtitle={t.journal.somatic_subtitle}
      icon={Thermometer}
      onClose={onClose}
      filterYear={filterYear}
      filterMonth={filterMonth}
      onMonthChange={handleMonthChange}
    >
      <div className="grid grid-cols-2 gap-4">
        <DataRow title={t.journal.low_mood_top3} onExpand={() => setDetailsType('mood')}>
           <div className="space-y-3">
             {stats.topMoods.length > 0 ? stats.topMoods.map(([name, count], i) => (
               <div key={name} className="flex justify-between items-center text-sm">
                 <span className={`${i===0?'text-danger font-bold':'text-star-400'}`}>{i+1}. {name}</span>
                 <span className="text-star-400 font-bold">{count}{t.journal.times_suffix}</span>
               </div>
             )) : <div className="text-star-400 text-xs">{t.journal.no_low_records}</div>}
           </div>
        </DataRow>
        <DataRow title={t.journal.body_reaction_top3} onExpand={() => setDetailsType('symptom')}>
           <div className="space-y-3">
             {stats.topSymptoms.length > 0 ? stats.topSymptoms.map(([name, count], i) => (
               <div key={name} className="flex justify-between items-center text-sm">
                 <span className={`${i===0?'text-gold-400 font-bold':'text-star-400'}`}>{i+1}. {name}</span>
                 <span className="text-star-400 font-bold">{count}{t.journal.times_suffix}</span>
               </div>
             )) : <div className="text-star-400 text-xs">{t.journal.body_status_good}</div>}
           </div>
        </DataRow>
      </div>

      <AnalysisReadout
        insightHighlight={insightHighlight}
        insightText={insightText}
        adviceLabel={t.journal.body_regulation_rx}
        adviceText={adviceText}
        astroText={astroText}
        isLoading={showLoading}
      />

      {detailsType && (
        <FullDataModal
          title={detailsType === 'mood' ? t.journal.low_mood_top3 : t.journal.body_reaction_top3}
          onClose={() => setDetailsType(null)}
          sections={detailsType === 'mood' 
            ? [{ title: t.journal.all_low_mood_records, data: stats.allMoods, colorClass: "bg-danger" }]
            : [{ title: t.journal.all_body_reaction_records, data: stats.allSymptoms, colorClass: "bg-gold-500" }]
          }
        />
      )}
    </CardContainer>
  );
};

// ----------------------------------------------------------------------
// 2. 根源与资源 (Sources & Supports)
// ----------------------------------------------------------------------
export const SourceSupportView: React.FC<ViewProps> = ({ records, onClose, initialYear, initialMonth, userProfile }) => {
  const { t, language } = useLanguage();
  const [detailsType, setDetailsType] = useState<'source' | 'support' | null>(null);
  const now = new Date();
  const initialFilterYear = initialYear ?? now.getFullYear();
  const initialFilterMonth = initialMonth ?? now.getMonth();
  const [filterYear, setFilterYear] = useState(initialFilterYear);
  const [filterMonth, setFilterMonth] = useState(initialFilterMonth);

  useEffect(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      setFilterYear(initialYear);
      setFilterMonth(initialMonth);
    }
  }, [initialYear, initialMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setFilterYear(year);
    setFilterMonth(month);
  };

  const hasMonthlyRecords = useMemo(
    () => filterRecordsByMonth(records, filterYear, filterMonth).length > 0,
    [records, filterYear, filterMonth]
  );

  const stats = useMemo(() => {
    // 使用月度过滤数据
    const all = getRecordsSorted(records, filterYear, filterMonth);
    const badDays = all.filter(r => r.emojiMood === 'annoyed' || r.emojiMood === 'terrible');
    const sourceData = badDays.length > 0 ? badDays : all;

    const sourceMap: Record<string, number> = {};
    const supportMap: Record<string, number> = {};

    const painCategories = [
      {
        id: 'self_worth',
        label: t.journal.self_worth,
        keywords: [
          '失败', '差', '不行', '笨', '羞耻', '没用', '烂', '糟糕', '废物', '无能', '不够好', '不配', '自卑', '丢脸', '愧疚', '自责', '否定', '内疚',
          'self-worth', 'worthless', 'unworthy', 'shame', 'guilt', 'failure', 'incompetent', 'not good enough', 'inferior'
        ]
      },
      {
        id: 'relationship_boundary',
        label: t.journal.relationship_boundary,
        keywords: [
          '关系', '拒绝', '被拒', '冷落', '冷暴力', '疏远', '抛弃', '误解', '孤独', '被忽视', '被排斥', '不被理解', '背叛', '失望', '边界', '争吵', '沟通', '亲密',
          'rejected', 'ignored', 'abandoned', 'lonely', 'boundary', 'relationship', 'breakup', 'conflict', 'criticized'
        ]
      },
      {
        id: 'loss_of_control_anxiety',
        label: t.journal.loss_of_control_anxiety,
        keywords: [
          '失控', '不确定', '完蛋', '来不及', '后果', '意外', '怎么办', '担心', '害怕', '恐惧', '慌', '紧张', '不安', '崩溃', '压力', '危险', '焦虑', '担忧',
          'anxious', 'anxiety', 'worried', 'panic', 'fear', 'uncertain', 'out of control', 'overwhelmed', 'nervous'
        ]
      },
      {
        id: 'work_study',
        label: t.journal.work_study,
        keywords: [
          '工作', '学业', '学习', '考试', '成绩', '任务', '截止', 'deadline', '加班', '绩效', '考核', '项目', '报告', '领导', '同事', '客户', '会议', '进度', '方案',
          'work', 'study', 'exam', 'deadline', 'boss', 'coworker', 'project', 'performance', 'kpi'
        ]
      }
    ];

    const otherCategoryId = 'other_uncategorized';
    const painLabelMap = painCategories.reduce((acc, item) => {
      acc[item.id] = item.label;
      return acc;
    }, { [otherCategoryId]: t.journal.other_uncategorized } as Record<string, string>);

    const supportCategories = [
      {
        id: 'interpersonal_support',
        label: t.journal.interpersonal_support,
        keywords: ['朋友', '家人', '伴侣', '倾诉', '陪伴', '理解', '安慰', '关心', '支持', '鼓励', 'friend', 'family', 'partner', 'listen', 'support', 'encourage']
      },
      {
        id: 'action_regulation',
        label: t.journal.action_regulation,
        keywords: ['散步', '运动', '睡', '吃', '整理', '洗澡', '呼吸', '跑步', '瑜伽', '休息', '放松', '冥想', '音乐', '读书', '写字', 'walk', 'exercise', 'sleep', 'breath', 'meditate']
      },
      {
        id: 'belief_reframe',
        label: t.journal.belief_reframe,
        keywords: ['允许', '接纳', '没关系', '正常', '成长', '经验', '相信', '接受', '放下', '原谅', '理性', '换个角度', '积极', '乐观', 'reframe', 'accept', 'allow', 'growth']
      },
      {
        id: 'factual_evidence',
        label: t.journal.factual_evidence,
        keywords: ['数据', '邮件', '记录', '事实', '证据', '证明', '确认', '客观', '真相', '具体', 'evidence', 'fact', 'record', 'email', 'objective']
      }
    ];
    const supportLabelMap = supportCategories.reduce((acc, item) => {
      acc[item.id] = item.label;
      return acc;
    }, {} as Record<string, string>);

    const matchPainCategory = (text: string) => {
      let bestId = otherCategoryId;
      let bestScore = 0;
      for (const category of painCategories) {
        let score = 0;
        for (const kw of category.keywords) {
          if (text.includes(kw)) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestId = category.id;
        }
      }
      return bestScore > 0 ? bestId : otherCategoryId;
    };

    sourceData.forEach(r => {
      const sourceText = [
        r.situation,
        r.hotThought,
        r.automaticThoughts.join(' '),
        r.moods.map(m => m.name).join(' ')
      ].join(' ').toLowerCase();
      const sourceCategory = matchPainCategory(sourceText);
      sourceMap[sourceCategory] = (sourceMap[sourceCategory] || 0) + 1;

      const supportText = [...r.evidenceAgainst, ...r.balancedEntries.map(b => b.text), ...r.evidenceFor].join(' ').toLowerCase();
      supportCategories.forEach(cat => {
        if (cat.keywords.some(kw => supportText.includes(kw))) {
          supportMap[cat.id] = (supportMap[cat.id] || 0) + 1;
        }
      });
    });

    const sortedSources = Object.entries(sourceMap).sort((a,b) => b[1]-a[1]);
    const sortedSupports = Object.entries(supportMap).sort((a,b) => b[1]-a[1]);

    const allSources = sortedSources.map(([id, count]) => [painLabelMap[id] || t.journal.other_uncategorized, count]);
    const allSupports = sortedSupports.map(([id, count]) => [supportLabelMap[id] || id, count]);

    const topSources = allSources.slice(0,3);
    const topSupports = allSupports.slice(0,3);

    const mainSourceId = sortedSources[0]?.[0] || otherCategoryId;
    const mainSource = painLabelMap[mainSourceId] || t.journal.other_uncategorized;
    const mainSupport = topSupports[0]?.[0] || t.journal.exploring;

    let advice = "";
    if (mainSourceId === 'self_worth') advice = t.journal.self_worth_advice;
    else if (mainSourceId === 'relationship_boundary') advice = t.journal.relationship_advice;
    else if (mainSourceId === 'loss_of_control_anxiety') advice = t.journal.control_advice;
    else if (mainSourceId === 'work_study') advice = t.journal.work_advice;

    advice += `${t.journal.since_main_support_effective}${mainSupport}${t.journal.works_best_do_it}`;

    return { allSources, allSupports, topSources, topSupports, mainSource, mainSupport, advice };
  }, [records, filterYear, filterMonth, t]);

  const { analysis, loading } = useCBTIndividualAnalysis(
    userProfile!,
    filterYear,
    filterMonth,
    'root',
    stats,
    language,
    { enabled: hasMonthlyRecords }
  );

  const displayInsight = resolveAnalysisText(
    analysis?.insight,
    `${t.journal.main_stress_source}${stats.mainSource}${t.journal.main_support_is}${stats.mainSupport}${t.journal.use_combo_consciously}`
  );
  const displayAdvice = resolveAnalysisText(analysis?.advice, stats.advice);
  const displayAstro = resolveAnalysisText(
    analysis?.astro_note,
    `${t.journal.roots_astro_note_prefix}${stats.mainSource}${t.journal.roots_astro_note_suffix}`
  );
  const noRecordText = t.journal.no_record_text;
  const showLoading = hasMonthlyRecords && loading;
  const insightHighlight = showLoading || !hasMonthlyRecords ? '' : t.journal.pattern_recognition;
  const insightText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_analyzing_insight : displayInsight)
    : noRecordText;
  const adviceText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_generating_advice : displayAdvice)
    : noRecordText;
  const astroText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_consulting_astro : displayAstro)
    : noRecordText;

  return (
    <CardContainer
      title={t.journal.roots_resources}
      subtitle={t.journal.roots_subtitle}
      icon={Anchor}
      onClose={onClose}
      filterYear={filterYear}
      filterMonth={filterMonth}
      onMonthChange={handleMonthChange}
    >
      <div className="grid grid-cols-2 gap-4">
        <DataRow title={t.journal.bad_mood_source_top3} onExpand={() => setDetailsType('source')}>
          <div className="space-y-3">
            {stats.topSources.map(([name, count], i) => (
              <div key={name} className="relative">
                <div className="flex justify-between text-sm mb-1 z-10 relative">
                  <span className={i===0 ? 'text-danger font-bold' : 'text-star-400'}>{name}</span>
                  <span className="text-star-400 text-xs">{count}</span>
                </div>
                <div className="h-1 bg-space-800 rounded-full overflow-hidden">
                  <div className="h-full bg-danger" style={{width: `${(count/stats.topSources[0][1])*100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </DataRow>
        <DataRow title={t.journal.positive_support_top3} onExpand={() => setDetailsType('support')}>
          <div className="space-y-3">
             {stats.topSupports.map(([name, count], i) => (
              <div key={name} className="relative">
                <div className="flex justify-between text-sm mb-1 z-10 relative">
                  <span className={i===0 ? 'text-accent font-bold' : 'text-star-400'}>{name}</span>
                  <span className="text-star-400 text-xs">{count}</span>
                </div>
                <div className="h-1 bg-space-800 rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{width: `${(count/stats.topSupports[0][1])*100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </DataRow>
      </div>

      <AnalysisReadout
        insightHighlight={insightHighlight}
        insightText={insightText}
        adviceLabel={t.journal.precise_healing_action}
        adviceText={adviceText}
        astroText={astroText}
        isLoading={showLoading}
      />

      {detailsType && (
        <FullDataModal
          title={detailsType === 'source' ? t.journal.bad_mood_source_top3 : t.journal.positive_support_top3}
          onClose={() => setDetailsType(null)}
          sections={detailsType === 'source'
            ? [{ title: t.journal.all_bad_mood_sources, data: stats.allSources, colorClass: "bg-danger" }]
            : [{ title: t.journal.all_support_sources, data: stats.allSupports, colorClass: "bg-accent" }]
          }
        />
      )}
    </CardContainer>
  );
};

// ----------------------------------------------------------------------
// 3. 情绪配方 (Mood Composition)
// ----------------------------------------------------------------------
export const MoodCompositionView: React.FC<ViewProps> = ({ records, onClose, initialYear, initialMonth, userProfile }) => {
  const { t, language } = useLanguage();
  const [detailsType, setDetailsType] = useState<'mood' | null>(null);
  const now = new Date();
  const initialFilterYear = initialYear ?? now.getFullYear();
  const initialFilterMonth = initialMonth ?? now.getMonth();
  const [filterYear, setFilterYear] = useState(initialFilterYear);
  const [filterMonth, setFilterMonth] = useState(initialFilterMonth);

  useEffect(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      setFilterYear(initialYear);
      setFilterMonth(initialMonth);
    }
  }, [initialYear, initialMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setFilterYear(year);
    setFilterMonth(month);
  };

  const hasMonthlyRecords = useMemo(
    () => filterRecordsByMonth(records, filterYear, filterMonth).length > 0,
    [records, filterYear, filterMonth]
  );

  const stats = useMemo(() => {
    // 使用月度过滤数据
    const data = getRecordsSorted(records, filterYear, filterMonth);
    const dist = { very_happy: 0, happy: 0, okay: 0, annoyed: 0, terrible: 0 };
    const negativeComp: Record<string, number> = {};

    data.forEach(r => {
      if (r.emojiMood) dist[r.emojiMood]++;
      if (r.emojiMood === 'annoyed' || r.emojiMood === 'terrible') {
        r.moods.forEach(m => {
          const label = translateLabel(m.name, language, 'mood');
          negativeComp[label] = (negativeComp[label] || 0) + 1;
        });
      }
    });

    // 情绪名称映射
    const moodNameMap: Record<string, string> = {
      very_happy: t.journal.mood_very_happy,
      happy: t.journal.mood_happy,
      okay: t.journal.mood_okay,
      annoyed: t.journal.mood_annoyed,
      terrible: t.journal.mood_terrible
    };

    const pieData = Object.entries(dist).map(([key, val]) => ({
      name: moodNameMap[key] || key,
      rawKey: key,
      value: val,
      color: MOOD_COLORS[key as EmojiMood] || COLORS.neutral
    })).filter(d => d.value > 0);

    const allNeg = Object.entries(negativeComp).sort((a,b) => b[1]-a[1]);
    const topNeg = allNeg.slice(0,3);
    const topCompName = topNeg[0]?.[0] || '';

    let advice = t.journal.accept_all_emotions;
    if (['焦虑', '担心', '害怕', '紧张', 'anxiety', 'worry', 'fear', 'nervous'].some(k => topCompName.toLowerCase().includes(k))) advice = t.journal.anxiety_advice;
    else if (['愤怒', '生气', '委屈', '不满', 'anger', 'angry', 'resentment', 'upset'].some(k => topCompName.toLowerCase().includes(k))) advice = t.journal.anger_advice;
    else if (['空虚', '麻木', '无聊', '累', 'empty', 'numb', 'bored', 'tired'].some(k => topCompName.toLowerCase().includes(k))) advice = t.journal.emptiness_advice;

    return { pieData, allNeg, topNeg, topCompName, advice };
  }, [records, filterYear, filterMonth, t, language]);

  const { analysis, loading } = useCBTIndividualAnalysis(
    userProfile!,
    filterYear,
    filterMonth,
    'mood',
    stats,
    language,
    { enabled: hasMonthlyRecords }
  );

  const displayInsight = resolveAnalysisText(
    analysis?.insight,
    stats.topCompName ? `${t.journal.low_point_dominated_by}${stats.topCompName}${t.journal.recognize_first_step}` : t.journal.mood_very_stable
  );
  const displayAdvice = resolveAnalysisText(analysis?.advice, stats.advice);
  const displayAstro = resolveAnalysisText(analysis?.astro_note, t.journal.mood_astro_note);
  const noRecordText = t.journal.no_record_text;
  const showLoading = hasMonthlyRecords && loading;
  const insightHighlight = showLoading || !hasMonthlyRecords ? '' : t.journal.mood_component;
  const insightText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_analyzing_insight : displayInsight)
    : noRecordText;
  const adviceText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_generating_advice : displayAdvice)
    : noRecordText;
  const astroText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_consulting_astro : displayAstro)
    : noRecordText;

  return (
    <CardContainer
      title={t.journal.mood_composition}
      subtitle={t.journal.mood_subtitle}
      icon={Layers}
      onClose={onClose}
      filterYear={filterYear}
      filterMonth={filterMonth}
      onMonthChange={handleMonthChange}
    >
      <div className="grid grid-cols-2 gap-4">
        <DataRow className="flex flex-col items-center justify-center p-0">
          <div className="h-32 w-full relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.pieData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                  {stats.pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgb(var(--space-950) / 0.92)',
                    border: '1px solid rgb(var(--space-700) / 0.6)',
                    borderRadius: '8px',
                    fontSize: '10px',
                  }}
                  itemStyle={{ color: 'rgb(var(--star-50) / 1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-xs text-star-400 font-bold pointer-events-none">{t.journal.distribution}</div>
          </div>
        </DataRow>
        <DataRow title={t.journal.low_point_top3} onExpand={() => setDetailsType('mood')}>
          <div className="space-y-3">
            {stats.topNeg.length > 0 ? stats.topNeg.map(([name, count], i) => (
              <div key={name} className="relative">
                 <div className="flex justify-between text-sm mb-1">
                   <span className={i===0?'text-danger font-bold':'text-star-400'}>{name}</span>
                   <span className="text-star-400 text-xs">{count}</span>
                 </div>
                 <div className="h-1 bg-space-800 rounded-full overflow-hidden">
                   <div className="h-full bg-danger" style={{width: `${(count/stats.topNeg[0][1])*100}%`}}></div>
                 </div>
              </div>
            )) : <div className="text-star-400 text-xs italic">{t.journal.no_clear_low_data}</div>}
          </div>
        </DataRow>
      </div>

      <AnalysisReadout
        insightHighlight={insightHighlight}
        insightText={insightText}
        adviceLabel={t.journal.targeted_regulation}
        adviceText={adviceText}
        astroText={astroText}
        isLoading={showLoading}
      />

      {detailsType && (
        <FullDataModal
          title={t.journal.low_point_top3}
          onClose={() => setDetailsType(null)}
          sections={[
            { title: t.journal.all_negative_components, data: stats.allNeg, colorClass: "bg-danger" }
          ]}
        />
      )}
    </CardContainer>
  );
};

// ----------------------------------------------------------------------
// 4. CBT 能力 (Competence)
// ----------------------------------------------------------------------
export const CBTCompetenceView: React.FC<ViewProps> = ({ records, onClose, initialYear, initialMonth, userProfile }) => {
  const { t, language } = useLanguage();
  const now = new Date();
  const initialFilterYear = initialYear ?? now.getFullYear();
  const initialFilterMonth = initialMonth ?? now.getMonth();
  const [filterYear, setFilterYear] = useState(initialFilterYear);
  const [filterMonth, setFilterMonth] = useState(initialFilterMonth);

  useEffect(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      setFilterYear(initialYear);
      setFilterMonth(initialMonth);
    }
  }, [initialYear, initialMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setFilterYear(year);
    setFilterMonth(month);
  };

  const hasMonthlyRecords = useMemo(
    () => filterRecordsByMonth(records, filterYear, filterMonth).length > 0,
    [records, filterYear, filterMonth]
  );

  const stats = useMemo(() => {
    // 使用月度过滤数据
    const data = getRecordsSorted(records, filterYear, filterMonth);
    const count = data.length || 1;

    let hasCounter = 0;
    let totalCounter = 0;
    let totalBelief = 0;

    data.forEach(r => {
      if (r.evidenceAgainst.length > 0) hasCounter++;
      totalCounter += r.evidenceAgainst.length;
      totalBelief += r.balancedEntries[0]?.belief || 0;
    });

    const rate = Math.round((hasCounter / count) * 100);
    const avg = (totalCounter / count).toFixed(1);
    const belief = Math.round(totalBelief / count);
    const score = (rate * 0.5) + (Math.min(parseFloat(avg), 5) * 10);

    // Advice
    let advice = t.journal.muscles_strong;
    if (rate < 50) advice = t.journal.low_rate_advice;
    else if (parseFloat(avg) < 2) advice = t.journal.low_avg_advice;
    else if (belief < 60) advice = t.journal.low_belief_advice;

    // Insight
    let insight = score > 60 ? t.journal.rational_brain_fast : t.journal.stuck_at_recording;

    return { rate, avg, belief, advice, insight };
  }, [records, filterYear, filterMonth, t]);

  const { analysis, loading } = useCBTIndividualAnalysis(
    userProfile!,
    filterYear,
    filterMonth,
    'competence',
    stats,
    language,
    { enabled: hasMonthlyRecords }
  );

  const displayInsight = resolveAnalysisText(analysis?.insight, stats.insight);
  const displayAdvice = resolveAnalysisText(analysis?.advice, stats.advice);
  const displayAstro = resolveAnalysisText(analysis?.astro_note, t.journal.cbt_astro_note);
  const noRecordText = t.journal.no_record_text;
  const showLoading = hasMonthlyRecords && loading;
  const insightHighlight = showLoading || !hasMonthlyRecords ? '' : t.journal.competence_assessment;
  const insightText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_analyzing_insight : displayInsight)
    : noRecordText;
  const adviceText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_generating_advice : displayAdvice)
    : noRecordText;
  const astroText = hasMonthlyRecords
    ? (showLoading ? t.journal.cbt_consulting_astro : displayAstro)
    : noRecordText;

  return (
    <CardContainer
      title={t.journal.thinking_muscles}
      subtitle={t.journal.cbt_subtitle}
      icon={Brain}
      onClose={onClose}
      filterYear={filterYear}
      filterMonth={filterMonth}
      onMonthChange={handleMonthChange}
    >
      {/* 1. Data */}
      <DataRow className="grid grid-cols-3 gap-2 text-center p-4">
        <div>
          <div className="text-2xl font-sans text-star-50">{stats.rate}%</div>
          <div className="text-xs text-star-200 uppercase tracking-wider mt-1">{t.journal.coverage_rate}</div>
        </div>
        <div>
          <div className="text-2xl font-sans text-star-50">{stats.avg}</div>
          <div className="text-xs text-star-200 uppercase tracking-wider mt-1">{t.journal.avg_count}</div>
        </div>
        <div>
          <div className="text-2xl font-sans text-star-50">{stats.belief}%</div>
          <div className="text-xs text-star-200 uppercase tracking-wider mt-1">{t.journal.belief_score}</div>
        </div>
      </DataRow>

      {/* Analysis readout: insight / prescription / astro */}
      <AnalysisReadout
        insightHighlight={insightHighlight}
        insightText={insightText}
        adviceLabel={t.journal.advanced_practice}
        adviceText={adviceText}
        astroText={astroText}
        isLoading={showLoading}
      />
    </CardContainer>
  );
};
