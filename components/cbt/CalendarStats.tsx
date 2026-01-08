// INPUT: React、统计数据与主题（含单屏月视图布局、月份联动与统计入口卡片精简展示）。
// OUTPUT: 导出日历统计组件（单屏 31 天、紧凑布局并以 icon+短标题呈现统计入口）。
// POS: CBT 统计视图组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CBTRecord } from './types';
import { ChevronLeft, ChevronRight, Sparkles, Thermometer, Anchor, Layers, Brain } from 'lucide-react';
import MoodIcon from './MoodIcon';
import { useLanguage, useTheme } from '../UIComponents';

interface CalendarStatsProps {
  records: CBTRecord[];
  onAddEntry: (date?: Date) => void;
  onSelectRecord: (record: CBTRecord) => void;
  onOpenAnalysis: (view: 'card1' | 'card2' | 'card3' | 'card4') => void;
  onMonthChange?: (year: number, month: number) => void;
}

const CalendarStats: React.FC<CalendarStatsProps> = ({ records, onAddEntry, onSelectRecord, onOpenAnalysis, onMonthChange }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navButtonTone = isLight
    ? 'bg-paper-100 text-star-200 hover:bg-paper-200'
    : 'bg-space-800/50 text-star-400 hover:bg-space-800 hover:text-star-50';
  const titleTone = isLight ? 'text-gold-700' : 'text-gold-400/70';
  const calendarShellTone = isLight ? 'bg-paper-100/80 border-paper-300' : 'bg-space-800/20 border-gold-500/10';
  const weekdayTone = isLight ? 'text-star-200' : 'text-star-400';
  const statCardTone = isLight
    ? 'bg-white/90 border-paper-300 text-paper-900 shadow-sm'
    : 'bg-space-900/60 border-gold-500/10 text-star-50 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.6)]';
  const statCardHoverTone = isLight
    ? 'hover:border-gold-500/50 hover:bg-paper-50 hover:shadow-glow'
    : 'hover:border-gold-500/40 hover:bg-space-800/70 hover:shadow-glow';
  const statCardTitleTone = isLight ? 'text-paper-900' : 'text-star-50';
  const statCardIconTone = isLight ? 'bg-paper-100 border-paper-200' : 'bg-space-950/60 border-gold-500/20';
  const pickerShellTone = isLight ? 'bg-paper-100 border-paper-300' : 'bg-space-900 border-gold-500/20';
  const pickerInnerTone = isLight ? 'bg-paper-50 border-paper-300' : 'bg-space-950/40 border-gold-500/10';
  const pickerActiveTone = isLight ? 'text-gold-700' : 'text-gold-400';
  const pickerMutedTone = isLight ? 'text-star-200' : 'text-star-400';
  const titleFont = language === 'en' ? 'font-sans' : 'font-serif';
  const statsTitles = useMemo(() => {
    if (language === 'zh') {
      return {
        card1: '身心',
        card2: '根源',
        card3: '情绪',
        card4: '思维'
      };
    }
    return {
      card1: '',
      card2: '',
      card3: '',
      card4: ''
    };
  }, [language]);
  const statCards = useMemo(() => ([
    { view: 'card1' as const, title: statsTitles.card1, label: t.journal.card_body_signals, icon: Thermometer, accent: 'text-danger' },
    { view: 'card2' as const, title: statsTitles.card2, label: t.journal.card_roots, icon: Anchor, accent: 'text-gold-600' },
    { view: 'card3' as const, title: statsTitles.card3, label: t.journal.card_emotion_recipe, icon: Layers, accent: 'text-accent' },
    { view: 'card4' as const, title: statsTitles.card4, label: t.journal.card_thinking_exam, icon: Brain, accent: 'text-success' }
  ]), [statsTitles, t]);
  const [viewDate, setViewDate] = useState(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const MONTH_NAMES = useMemo(() => [
    t.journal.month_jan, t.journal.month_feb, t.journal.month_mar, t.journal.month_apr,
    t.journal.month_may, t.journal.month_jun, t.journal.month_jul, t.journal.month_aug,
    t.journal.month_sep, t.journal.month_oct, t.journal.month_nov, t.journal.month_dec
  ], [t]);

  const WEEKDAY_SHORT = useMemo(() => [
    t.journal.weekday_short_sun, t.journal.weekday_short_mon, t.journal.weekday_short_tue,
    t.journal.weekday_short_wed, t.journal.weekday_short_thu, t.journal.weekday_short_fri, t.journal.weekday_short_sat
  ], [t]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getRecordsForDay = (day: number) => {
    return records.filter(r => {
      const d = new Date(r.timestamp);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
  };

  const handlePickerConfirm = (year: number, month: number) => {
    const newDate = new Date(year, month, 1);
    setViewDate(newDate);
    setIsPickerOpen(false);
    onMonthChange?.(year, month);
  };

  const handleDayClick = (day: number) => {
    const dayRecords = getRecordsForDay(day);
    if (dayRecords.length > 0) {
      onSelectRecord(dayRecords[0]);
    } else {
      const d = new Date(currentYear, currentMonth, day);
      // 不允许记录未来日期的日记
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDay = new Date(d);
      targetDay.setHours(0, 0, 0, 0);
      if (targetDay > today) {
        return; // 未来日期，不允许创建
      }
      onAddEntry(d);
    }
  };

  const displayTitle = language === 'zh'
    ? `${currentYear}年${currentMonth + 1}月`
    : `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  return (
    <div className="h-full flex flex-col relative animate-in fade-in duration-700">

      <div className="relative mb-6 flex flex-col items-center max-w-[720px] mx-auto w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeMonth(-1)}
            className={`p-2 rounded-full transition-all active:scale-90 ${navButtonTone}`}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => setIsPickerOpen(true)}
            className="relative group flex flex-col items-center"
          >
            <div className="absolute -inset-4 bg-gold-500/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className={`text-[1.45rem] md:text-[1.65rem] ${titleFont} font-light tracking-tight transition-all group-hover:text-gold-300 ${titleTone}`}>
              {displayTitle}
            </span>
          </button>

          <button
            onClick={() => changeMonth(1)}
            className={`p-2 rounded-full transition-all active:scale-90 ${navButtonTone}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={`flex-1 border rounded-[3.5rem] p-4 relative overflow-hidden backdrop-blur-sm shadow-inner max-w-[720px] mx-auto w-full mt-[2px] mb-[2px] ${calendarShellTone}`}>
        <div className="grid grid-cols-7 gap-2 md:gap-3 relative z-10">
          {WEEKDAY_SHORT.map(day => (
            <div key={day} className={`text-center text-[11px] font-black uppercase tracking-[0.3em] pb-2 ${weekdayTone}`}>
              {day}
            </div>
          ))}

          {blanks.map(blank => <div key={`blank-${blank}`} className="aspect-square" />)}

          {days.map(day => {
            const dayRecords = getRecordsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
            const hasEntry = dayRecords.length > 0;
            const mood = hasEntry ? dayRecords[0].emojiMood || 'okay' : null;

            // 判断是否为未来日期
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDay = new Date(currentYear, currentMonth, day);
            targetDay.setHours(0, 0, 0, 0);
            const isFutureDate = targetDay > today;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={isFutureDate && !hasEntry}
                className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border
                  ${isFutureDate && !hasEntry ? 'opacity-30 cursor-not-allowed' : ''}
                  ${hasEntry ? `border-transparent shadow-xl hover:scale-110` : (isLight ? 'border-paper-300 hover:bg-paper-100' : 'border-gold-500/5 hover:bg-gold-500/5')}
                `}
              >
                {mood ? (
                   <MoodIcon mood={mood} size={31.2} />
                ) : (
                  <span className={`text-[12px] font-black z-20 transition-all ${isToday ? 'text-star-50 underline decoration-gold-500 underline-offset-4' : (isLight ? 'text-star-200' : 'text-star-400')}`}>
                    {day}
                  </span>
                )}

                {!hasEntry && isToday && (
                   <div className="absolute -top-1 -right-1 z-30">
                      <div className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(212,175,55,1)] animate-pulse"></div>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 重构后的底部 4 个核心统计卡片入口 */}
      <div className="mt-4 flex flex-col gap-4 max-w-[720px] mx-auto w-full md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.view}
                onClick={() => onOpenAnalysis(card.view)}
                aria-label={card.label}
                className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${statCardTone} ${statCardHoverTone}`}
                title={card.title}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-gradient-to-br from-gold-500/10 via-transparent to-transparent' : 'bg-gradient-to-br from-gold-500/10 via-transparent to-transparent'}`}></div>
                <div className="relative flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${statCardIconTone} ${card.accent}`}>
                    <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0">
                    {card.title ? (
                      <div className={`text-sm leading-tight font-semibold ${titleFont} ${statCardTitleTone}`}>{card.title}</div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center md:justify-end md:shrink-0">
          <button
            onClick={() => onAddEntry()}
            className="relative group overflow-hidden px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gold-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            <div className="relative flex items-center gap-3">
              <span className="text-space-950 font-black text-[11px] uppercase tracking-[0.4em]">{t.journal.start_deep_record}</span>
              <Sparkles size={18} className="text-space-900 animate-pulse" />
            </div>
          </button>
        </div>
      </div>

      {isPickerOpen && (
        <MonthPickerModal
          initialYear={currentYear}
          initialMonth={currentMonth}
          onClose={() => setIsPickerOpen(false)}
          onConfirm={handlePickerConfirm}
          isLight={isLight}
          pickerShellTone={pickerShellTone}
          pickerInnerTone={pickerInnerTone}
          pickerActiveTone={pickerActiveTone}
          pickerMutedTone={pickerMutedTone}
        />
      )}
    </div>
  );
};

const MonthPickerModal: React.FC<{
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
  onConfirm: (year: number, month: number) => void;
  isLight: boolean;
  pickerShellTone: string;
  pickerInnerTone: string;
  pickerActiveTone: string;
  pickerMutedTone: string;
}> = ({ initialYear, initialMonth, onClose, onConfirm, isLight, pickerShellTone, pickerInnerTone, pickerActiveTone, pickerMutedTone }) => {
  const { t } = useLanguage();
  const years = Array.from({ length: 21 }, (_, i) => 2015 + i);
  const [selYear, setSelYear] = useState(initialYear);
  const [selMonth, setSelMonth] = useState(initialMonth);

  const MONTH_NAMES = useMemo(() => [
    t.journal.month_jan, t.journal.month_feb, t.journal.month_mar, t.journal.month_apr,
    t.journal.month_may, t.journal.month_jun, t.journal.month_jul, t.journal.month_aug,
    t.journal.month_sep, t.journal.month_oct, t.journal.month_nov, t.journal.month_dec
  ], [t]);

  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);

  const ITEM_HEIGHT = 56;
  const CONTAINER_HEIGHT = 384;
  const PADDING_TOP = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

  const handleScroll = useCallback((ref: React.RefObject<HTMLDivElement | null>, type: 'year' | 'month') => {
    if (!ref.current) return;
    const scrollPos = ref.current.scrollTop;
    const index = Math.round(scrollPos / ITEM_HEIGHT);

    if (type === 'year') {
      const year = years[index];
      if (year && year !== selYear) setSelYear(year);
    } else {
      const month = index;
      if (month >= 0 && month < 12 && month !== selMonth) setSelMonth(month);
    }
  }, [selYear, selMonth, years]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (yearScrollRef.current) {
        const yearIndex = years.indexOf(initialYear);
        yearScrollRef.current.scrollTop = yearIndex * ITEM_HEIGHT;
      }
      if (monthScrollRef.current) {
        monthScrollRef.current.scrollTop = initialMonth * ITEM_HEIGHT;
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [initialYear, initialMonth, years]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className={`absolute inset-0 backdrop-blur-xl ${isLight ? 'bg-paper-200/80' : 'bg-black/85'}`} onClick={onClose}></div>
      <div className={`relative w-full max-w-[240px] border rounded-[2.5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 ${pickerShellTone}`}>
        <div className="p-6 pb-2">
          <h3 className="text-lg font-black text-star-200 mb-6 text-center tracking-tighter uppercase opacity-60">{t.journal.select_time}</h3>
          <div style={{ height: `${CONTAINER_HEIGHT}px` }} className={`flex justify-center items-center relative overflow-hidden rounded-[1.5rem] border ${pickerInnerTone}`}>
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${isLight ? 'from-paper-100 via-paper-100/60' : 'from-space-900 via-space-900/60'} to-transparent`}></div>
              <div className={`absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t ${isLight ? 'from-paper-100 via-paper-100/60' : 'from-space-900 via-space-900/60'} to-transparent`}></div>
            </div>
            <div style={{ top: `${PADDING_TOP}px` }} className={`absolute inset-x-2 h-14 border-y pointer-events-none z-10 ${isLight ? 'border-gold-600/40 bg-gold-500/10' : 'border-gold-500/30 bg-gold-500/5'}`}></div>
            <div ref={yearScrollRef} onScroll={() => handleScroll(yearScrollRef, 'year')} className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth custom-scrollbar-hide z-0">
              <div style={{ paddingTop: `${PADDING_TOP}px`, paddingBottom: `${PADDING_TOP}px` }}>
                {years.map(y => (
                  <div key={y} className={`w-full h-14 flex items-center justify-center snap-center transition-all duration-200 ${selYear === y ? `${pickerActiveTone} font-bold text-xl scale-110` : `${pickerMutedTone} text-sm`}`}>{y}</div>
                ))}
              </div>
            </div>
            <div ref={monthScrollRef} onScroll={() => handleScroll(monthScrollRef, 'month')} className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth custom-scrollbar-hide z-0">
              <div style={{ paddingTop: `${PADDING_TOP}px`, paddingBottom: `${PADDING_TOP}px` }}>
                {MONTH_NAMES.map((m, idx) => (
                  <div key={m} className={`w-full h-14 flex items-center justify-center snap-center transition-all duration-200 ${selMonth === idx ? `${pickerActiveTone} font-bold text-xl scale-110` : `${pickerMutedTone} text-sm`}`}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={`flex border-t p-4 gap-3 ${isLight ? 'border-paper-300 bg-paper-100/70' : 'border-gold-500/10 bg-space-900/50'}`}>
          <button onClick={onClose} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${isLight ? 'text-star-200 hover:bg-paper-200' : 'text-star-400 hover:bg-space-800'}`}>{t.journal.btn_cancel}</button>
          <button onClick={() => onConfirm(selYear, selMonth)} className={`flex-1 py-3 border text-xs font-black rounded-xl transition-all active:scale-95 ${isLight ? 'bg-gold-500/20 text-gold-700 border-gold-600/40 hover:bg-gold-500/30' : 'bg-gold-600/20 text-gold-400 border-gold-500/30 hover:bg-gold-600/30'}`}>{t.journal.btn_confirm}</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarStats;
