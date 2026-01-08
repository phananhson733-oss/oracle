// INPUT: React、CBT 组件、类型、用户资料与主题（含整体上移布局与月份同步）。
// OUTPUT: 导出 CBT 主页面组件（对齐顶部留白与日历区域并同步统计月份）。
// POS: CBT 主页面（集成到主应用 /journal 路由）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useState, useEffect } from 'react';
import { CBTRecord, MoodImages } from './types';
import { UserProfile } from '../../types';
import TimelineFeed from './TimelineFeed';
import CalendarStats from './CalendarStats';
import CBTWizard from './CBTWizard';
import RecordDetailModal from './RecordDetailModal';
import EmptyState from './EmptyState';
import {
  SomaticPatternView,
  SourceSupportView,
  MoodCompositionView,
  CBTCompetenceView
} from './AnalysisViews';
import { fetchCBTRecords, saveCBTRecord } from '../../services/apiClient';
import { useLanguage, useTheme } from '../UIComponents';

const MOOD_IMAGES: MoodImages = {
  very_happy: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=400&fit=crop',
  happy: 'https://images.unsplash.com/photo-1464802686167-b939a67e06a1?w=400&h=400&fit=crop',
  okay: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bc02?w=400&h=400&fit=crop',
  annoyed: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&h=400&fit=crop',
  terrible: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop',
};

const STORAGE_KEY = 'astro_cbt_history_v1';

interface CBTMainPageProps {
  profile: UserProfile;
}

const CBTMainPage: React.FC<CBTMainPageProps> = ({ profile }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const shellTone = isLight ? 'bg-paper-100/90 border-paper-300' : 'bg-space-900/40 border-gold-500/10';
  const sidebarTone = isLight ? 'bg-paper-100/80 border-paper-300' : 'bg-space-900/20 border-gold-500/10';
  const accentText = isLight ? 'text-gold-700' : 'text-gold-500';
  const [history, setHistory] = useState<CBTRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CBTRecord | null>(null);
  const [activeAnalysisView, setActiveAnalysisView] = useState<'card1' | 'card2' | 'card3' | 'card4' | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [analysisMonth, setAnalysisMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Generate user ID from profile
  const userId = `${profile?.name || 'user'}_${profile?.birthDate || 'unknown'}`;

  // Initialize: try backend first, fallback to localStorage
  useEffect(() => {
    const loadRecords = async () => {
      setIsLoading(true);
      try {
        const response = await fetchCBTRecords(userId);
        const records = response?.records || [];
        if (records.length > 0) {
          setHistory(records);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        } else {
          // No backend data, try localStorage
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            setHistory(parsed);
          }
          // If no local data either, history stays empty (show EmptyState)
        }
      } catch {
        // Backend failed, fallback to localStorage
        console.warn('Failed to fetch from backend, using localStorage');
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setHistory(parsed);
          } catch (e) {
            console.error('Failed to parse local history', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadRecords();
  }, [userId]);

  // Sync to localStorage whenever history changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  const handleRecordComplete = async (newRecord: CBTRecord) => {
    // Update local state immediately
    setHistory(prev => {
      const updated = [newRecord, ...prev];
      return updated.sort((a, b) => b.timestamp - a.timestamp);
    });
    // Write to localStorage immediately
    const updatedHistory = [newRecord, ...history].sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    // Async sync to backend
    try {
      await saveCBTRecord(userId, newRecord);
    } catch (e) {
      console.warn('Failed to sync record to backend, data saved locally', e);
    }
  };

  const handleUpdateRecord = (updatedRecord: CBTRecord) => {
    setHistory(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    if (selectedRecord?.id === updatedRecord.id) {
      setSelectedRecord(updatedRecord);
    }
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setTargetDate(null);
  };

  const handleSelectRecord = (record: CBTRecord) => {
    setSelectedRecord(record);
  };

  const handleMonthChange = React.useCallback((year: number, month: number) => {
    setAnalysisMonth({ year, month });
  }, []);

  const startNewEntry = (date?: Date) => {
    const targetDateValue = date || new Date();
    // 验证不能记录未来日期的日记
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(targetDateValue);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate > today) {
      return; // 未来日期，不允许创建
    }
    setTargetDate(targetDateValue);
    setIsWizardOpen(true);
  };

  const displayName = profile?.name || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-space-950 text-star-50 flex items-center justify-center">
        <div className={`${accentText} font-serif animate-pulse text-xl`}>{t.journal.loading}</div>
      </div>
    );
  }

  // Empty state for new users
  if (history.length === 0) {
    return (
      <div className="min-h-screen w-full bg-space-950 text-star-50 flex items-start justify-center px-4 md:px-10 pt-[10px] pb-6 font-sans">
        <div className={`w-full max-w-7xl h-[90vh] backdrop-blur-3xl rounded-[3.5rem] border shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative ${shellTone}`}>
          <EmptyState onCreateFirst={() => startNewEntry()} />
        </div>

        {isWizardOpen && (
          <CBTWizard
            onClose={handleCloseWizard}
            onComplete={handleRecordComplete}
            moodImages={MOOD_IMAGES}
            initialDate={targetDate}
            profile={profile}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-space-950 text-star-50 flex items-start justify-center px-4 md:px-10 pt-[10px] pb-6 font-sans">
      <div className={`w-full max-w-7xl h-[90vh] backdrop-blur-3xl rounded-[3.5rem] border shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative ${shellTone}`}>

        <aside className={`w-full md:w-[400px] border-r flex flex-col relative z-0 ${sidebarTone}`}>
          <div className={`p-8 border-b ${isLight ? 'border-paper-300' : 'border-gold-500/10'} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-gold-600 to-gold-400 shadow-xl flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-[1.2rem] bg-space-900 flex items-center justify-center font-serif font-black text-xl text-star-50">{initials}</div>
              </div>
              <div>
                <h2 className="text-lg font-black text-star-50 tracking-tight">{displayName}</h2>
                {profile?.zodiac && (
                  <div className={`text-[11px] uppercase tracking-[0.2em] font-bold mt-0.5 ${accentText}`}>
                    {profile.zodiac}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            <TimelineFeed records={history} onSelect={handleSelectRecord} moodImages={MOOD_IMAGES} />
          </div>
        </aside>

        <section className="flex-1 flex flex-col relative bg-space-900/10 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-gold-600/3 pointer-events-none"></div>
          <div className="flex-1 p-10 overflow-y-auto relative z-10 custom-scrollbar">
            <CalendarStats
              records={history}
              onAddEntry={startNewEntry}
              onSelectRecord={handleSelectRecord}
              onOpenAnalysis={setActiveAnalysisView}
              onMonthChange={handleMonthChange}
            />
          </div>
        </section>

        {activeAnalysisView === 'card1' && (
          <SomaticPatternView
            records={history}
            onClose={() => setActiveAnalysisView(null)}
            initialYear={analysisMonth.year}
            initialMonth={analysisMonth.month}
            userProfile={profile}
          />
        )}
        {activeAnalysisView === 'card2' && (
          <SourceSupportView
            records={history}
            onClose={() => setActiveAnalysisView(null)}
            initialYear={analysisMonth.year}
            initialMonth={analysisMonth.month}
            userProfile={profile}
          />
        )}
        {activeAnalysisView === 'card3' && (
          <MoodCompositionView
            records={history}
            onClose={() => setActiveAnalysisView(null)}
            initialYear={analysisMonth.year}
            initialMonth={analysisMonth.month}
            userProfile={profile}
          />
        )}
        {activeAnalysisView === 'card4' && (
          <CBTCompetenceView
            records={history}
            onClose={() => setActiveAnalysisView(null)}
            initialYear={analysisMonth.year}
            initialMonth={analysisMonth.month}
            userProfile={profile}
          />
        )}
      </div>

      {isWizardOpen && (
        <CBTWizard
          onClose={handleCloseWizard}
          onComplete={handleRecordComplete}
          moodImages={MOOD_IMAGES}
          initialDate={targetDate}
          profile={profile}
        />
      )}

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdate={handleUpdateRecord}
        />
      )}
    </div>
  );
};

export default CBTMainPage;
