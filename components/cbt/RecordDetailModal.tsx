// INPUT: React、记录数据与主题（含 1280px 解读布局扩展）。
// OUTPUT: 导出记录详情弹窗（含浅色模式对比度优化）。
// POS: CBT 详情组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React from 'react';
import { CBTRecord } from './types';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import ReportDashboard from './ReportDashboard';
import { useLanguage, useTheme } from '../UIComponents';

interface RecordDetailModalProps {
  record: CBTRecord;
  onClose: () => void;
  onUpdate: (updated: CBTRecord) => void;
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose, onUpdate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const cardTone = isLight ? 'bg-paper-50 border-paper-300' : 'bg-space-800/50 border-gold-500/10';
  const goldCardTone = isLight ? 'bg-gold-500/10 border-gold-600/30' : 'bg-gold-500/5 border-gold-500/10';
  const labelTone = isLight ? 'text-star-200' : 'text-star-400';
  const goldLabelTone = isLight ? 'text-gold-700' : 'text-gold-400';
  const chipTone = isLight ? 'bg-gold-500/15 border-gold-600/30 text-gold-800' : 'bg-gold-500/10 border-gold-500/20 text-gold-300';
  if (!record.analysis) return null;

  return (
    <div className={`fixed inset-0 z-[150] flex flex-col overflow-hidden animate-fade-in ${isLight ? 'bg-paper-100' : 'bg-space-950'}`}>
      {/* Header with back button - left aligned */}
      <div className={`sticky top-0 z-20 px-6 py-4 flex items-center gap-4 ${isLight ? 'bg-paper-100/95 backdrop-blur' : 'bg-space-950/95 backdrop-blur'}`}>
        <button onClick={onClose} className={`flex items-center gap-3 transition-all font-bold group ${labelTone}`}>
          <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-paper-200 border border-paper-300 group-hover:bg-paper-300' : 'bg-white/5 group-hover:bg-gold-500/20 group-hover:text-gold-400'}`}>
            <ArrowLeft size={20} />
          </div>
          <span className="text-sm uppercase tracking-widest">{t.journal.back_btn}</span>
        </button>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isLight ? 'border-gold-500/30 bg-gold-500/10 text-gold-700' : 'border-gold-500/30 bg-gold-500/10 text-gold-400'}`}>
          <ClipboardList size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t.journal.review_title}</span>
        </div>
      </div>

      {/* Title display */}
      <div className="text-center px-6 py-4">
        <div className={`text-[10px] uppercase tracking-widest mb-1 ${isLight ? 'text-gold-600' : 'text-gold-500'}`}>
          {new Date(record.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 pb-12 space-y-16">
          <section className="animate-in slide-in-from-bottom-4 duration-700">
            <ReportDashboard record={record} report={record.analysis} onUpdate={onUpdate} onClose={onClose} />
          </section>

          <section className="max-w-7xl mx-auto space-y-10">
            <div className={`flex items-center gap-4 border-b pb-6 ${isLight ? 'border-paper-300' : 'border-gold-500/10'}`}>
              <div className={`p-3 rounded-2xl ${isLight ? 'bg-gold-500/15 text-gold-700' : 'bg-gold-500/10 text-gold-400'}`}><ClipboardList size={28} /></div>
              <h2 className="text-3xl font-serif text-star-50">{t.journal.original_record}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`rounded-3xl p-8 border ${cardTone}`}>
                <h4 className={`text-[11px] uppercase tracking-[0.2em] font-black mb-4 ${labelTone}`}>{t.journal.section_situation}</h4>
                <p className="text-star-200 leading-relaxed text-lg">{record.situation}</p>
              </div>

              <div className={`rounded-3xl p-8 border ${goldCardTone}`}>
                <h4 className={`text-[11px] uppercase tracking-[0.2em] font-black mb-4 ${goldLabelTone}`}>{t.journal.section_body}</h4>
                <div className="flex flex-wrap gap-2">
                  {record.bodySymptoms && record.bodySymptoms.length > 0 ? record.bodySymptoms.map((s, i) => (
                    <span key={i} className={`px-3 py-1 rounded-xl text-sm font-bold border ${chipTone}`}>
                      {s}
                    </span>
                  )) : <span className="text-star-400 italic text-sm">{t.journal.no_record_text}</span>}
                </div>
              </div>

              <div className={`rounded-3xl p-8 border md:col-span-2 ${goldCardTone}`}>
                <h4 className={`text-[11px] uppercase tracking-[0.2em] font-black mb-4 ${goldLabelTone}`}>{t.journal.section_hot_thought}</h4>
                <p className={`${isLight ? 'text-gold-800' : 'text-gold-100'} italic leading-relaxed text-lg font-serif`}>"{record.hotThought}"</p>
              </div>

              <div className={`rounded-3xl p-8 border space-y-6 ${cardTone}`}>
                <div>
                  <h4 className={`text-[11px] uppercase tracking-[0.2em] font-black mb-2 ${labelTone}`}>{t.journal.section_evidence_for}</h4>
                  <ul className="list-disc list-inside space-y-1 text-star-200 text-sm">
                    {record.evidenceFor.map((ev, i) => <li key={i}>{ev}</li>)}
                  </ul>
                </div>
                <div className={`pt-6 border-t ${isLight ? 'border-paper-300' : 'border-gold-500/10'}`}>
                  <h4 className={`text-[11px] uppercase tracking-[0.2em] font-black mb-2 ${labelTone}`}>{t.journal.section_evidence_against}</h4>
                  <ul className="list-disc list-inside space-y-1 text-star-200 text-sm">
                    {record.evidenceAgainst.map((ev, i) => <li key={i}>{ev}</li>)}
                  </ul>
                </div>
              </div>

              <div className={`rounded-3xl p-8 border ${isLight ? 'bg-gold-500/10 border-gold-600/30' : 'bg-accent/10 border-accent/20'}`}>
                <h4 className={`text-[11px] uppercase tracking-[0.2em] font-black mb-4 ${isLight ? 'text-gold-700' : 'text-accent'}`}>{t.journal.section_balanced}</h4>
                <div className="space-y-6">
                  {record.balancedEntries.map(entry => (
                    <div key={entry.id} className={`border-b last:border-0 pb-4 last:pb-0 ${isLight ? 'border-paper-300' : 'border-white/5'}`}>
                      <p className="text-star-50 text-lg leading-relaxed">{entry.text}</p>
                      <div className="mt-4 flex items-center justify-between"><span className={`text-[11px] font-black uppercase tracking-widest ${labelTone}`}>{t.journal.belief_weight}</span><span className={`text-lg font-mono font-black ${isLight ? 'text-gold-700' : 'text-accent'}`}>{entry.belief}%</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
    </div>
  );
};

export default RecordDetailModal;
