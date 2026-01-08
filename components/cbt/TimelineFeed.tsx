// INPUT: React、记录列表与主题。
// OUTPUT: 导出时间线列表组件（含浅色模式对比度优化与情绪标签配色同步）。
// POS: CBT 列表组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useMemo } from 'react';
import { CBTRecord, EmojiMood } from './types';
import { Sparkles, AlertCircle, MoreHorizontal } from 'lucide-react';
import MoodIcon from './MoodIcon';
import { useLanguage, useTheme } from '../UIComponents';

interface TimelineFeedProps {
  records: CBTRecord[];
  onSelect: (record: CBTRecord) => void;
  moodImages?: Record<EmojiMood, string>;
}

const TimelineFeed: React.FC<TimelineFeedProps> = ({ records, onSelect }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const bannerTone = isLight ? 'bg-gold-500/15 border-gold-600/30' : 'bg-gold-500/10 border-gold-500/20';
  const bannerIconTone = isLight ? 'text-gold-700' : 'text-gold-400';
  const cardTone = isLight
    ? 'bg-paper-100/80 border-paper-300 hover:bg-paper-100'
    : 'bg-space-800/30 border-gold-500/10 hover:bg-space-800/50';
  const metaTone = isLight ? 'text-star-200' : 'text-star-400';

  const MOOD_META: Record<EmojiMood, { label: string; color: string }> = useMemo(() => ({
    very_happy: { label: t.journal.mood_very_happy, color: '#FFD93D' },
    happy: { label: t.journal.mood_happy, color: '#4ADE80' },
    okay: { label: t.journal.mood_okay, color: '#60A5FA' },
    annoyed: { label: t.journal.mood_annoyed, color: '#FB923C' },
    terrible: { label: t.journal.mood_terrible, color: '#F87171' }
  }), [t]);

  const WEEKDAYS = useMemo(() => [
    t.journal.weekday_sun, t.journal.weekday_mon, t.journal.weekday_tue,
    t.journal.weekday_wed, t.journal.weekday_thu, t.journal.weekday_fri, t.journal.weekday_sat
  ], [t]);
  // 1. 数据去重：每天只保留一条（最新）记录
  const uniqueDailyRecords = useMemo(() => {
    const seenDates = new Set<string>();
    const unique: CBTRecord[] = [];

    // records 默认是按时间倒序排列的 (mockData.ts 中已 sort)
    // 所以我们遇到的第一个某日期的记录就是当天的最新记录
    for (const record of records) {
      const dateKey = new Date(record.timestamp).toDateString(); // e.g., "Mon Dec 25 2024"
      if (!seenDates.has(dateKey)) {
        seenDates.add(dateKey);
        unique.push(record);
      }
    }
    return unique;
  }, [records]);

  const getDaysMissedCount = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    let missed = 0;
    for (let d = 1; d < currentDay; d++) {
      const dayHasRecord = records.some(record => {
        const date = new Date(record.timestamp);
        return date.getFullYear() === currentYear &&
               date.getMonth() === currentMonth &&
               date.getDate() === d;
      });
      if (!dayHasRecord) missed++;
    }
    return missed;
  };

  const isAllActionsCompleted = (record: CBTRecord) => {
    if (!record.analysis?.actions) return false;
    const completedCount = record.completedActionIndices?.length || 0;
    return completedCount >= record.analysis.actions.length && record.analysis.actions.length > 0;
  };

  const daysMissed = getDaysMissedCount();

  return (
    <div className="h-full flex flex-col">
      {daysMissed > 0 && (
        <div className={`mb-6 mx-2 p-4 border rounded-2xl flex items-center gap-3 animate-pulse ${bannerTone}`}>
          <AlertCircle className={bannerIconTone} size={20} />
          <div className="text-xs">
            <span className="text-star-50 font-bold">{t.journal.missing_days.replace('{count}', String(daysMissed))}</span>
            <span className="text-star-200 ml-1 font-medium">{t.journal.missing_days_prompt}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-10">
        {uniqueDailyRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-star-400 opacity-50 space-y-2 py-20">
             <Sparkles size={24} />
             <p className="text-xs uppercase tracking-widest">{t.journal.no_records}</p>
          </div>
        ) : (
          uniqueDailyRecords.map(record => {
            const date = new Date(record.timestamp);
            const mood = MOOD_META[record.emojiMood || 'okay'];
            const dayOfWeek = WEEKDAYS[date.getDay()];
            const dateStr = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const completed = isAllActionsCompleted(record);

            return (
              <div
                key={record.id}
                onClick={() => onSelect(record)}
                className={`group relative border rounded-[1.8rem] p-4 cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-xl ${cardTone}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-[52px] h-[52px] shrink-0 transform group-hover:scale-110 transition-transform">
                    <MoodIcon mood={record.emojiMood || 'okay'} size={52} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${metaTone}`}>
                        {dayOfWeek}, {dateStr}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-xl font-black tracking-tight" style={{ color: mood.color }}>
                        {mood.label}
                      </h3>
                      <span className={`text-[11px] font-mono uppercase tracking-widest font-bold ${metaTone}`}>
                        {timeStr}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(record); }}
                    className={`p-3 rounded-full transition-all ${completed ? 'text-accent bg-accent/10' : `${metaTone} hover:text-accent hover:bg-accent/10`}`}
                  >
                    <MoreHorizontal size={24} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TimelineFeed;
