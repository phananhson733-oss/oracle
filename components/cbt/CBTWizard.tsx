// INPUT: React、流程状态、主题与后端分析服务（含失败提示与重试状态）。
// OUTPUT: 导出 CBT 记录向导组件（含对比度优化的填写输入与失败重试）。
// POS: CBT 流程组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useState, useMemo } from 'react';
import { CBTRecord, MoodEntry, BalancedEntry, AnalysisReport, EmojiMood, MoodImages } from './types';
import { UserProfile } from '../../types';
import { ArrowRight, ArrowLeft, Plus, X, Wand2, Sparkles, Zap, Info, Eye, CheckCircle2, Trash2, Lightbulb, Activity, Brain, Heart, Moon, Dumbbell } from 'lucide-react';
import { analyzeCBTRecord } from '../../services/cbt/deepseekService';
import ReportDashboard from './ReportDashboard';
import { OracleLoading } from '../OracleLoading';
import MoodIcon from './MoodIcon';
import { useLanguage, useTheme } from '../UIComponents';

interface CBTWizardProps {
  onClose: () => void;
  onComplete: (record: CBTRecord) => void;
  moodImages: MoodImages;
  initialDate?: Date | null; // 新增：支持传入指定日期
  profile: UserProfile;
}

// Note: EMOJI_OPTIONS, BODY_SYMPTOM_PRESETS, STEP_EXAMPLES, stepTitles, getStepHelp
// are now defined inside the component using useMemo for i18n support

const CBTWizard: React.FC<CBTWizardProps> = ({ onClose, onComplete, moodImages, initialDate, profile }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const journalFieldTone = theme === 'dark'
    ? 'bg-space-900/40 text-star-50 border-gold-500/30 focus:bg-space-900/60 placeholder-star-400/70'
    : 'bg-paper-50 text-paper-900 border-paper-300 focus:bg-paper-100 placeholder-paper-400';
  const journalInputTone = theme === 'dark'
    ? 'bg-space-900/50 text-star-50 border-gold-500/30 focus:bg-space-900/70 placeholder-star-400/70'
    : 'bg-paper-50 text-paper-900 border-paper-300 focus:bg-paper-100 placeholder-paper-400';
  const journalPanelTone = theme === 'dark'
    ? 'bg-white/5 border-white/10'
    : 'bg-paper-100/80 border-paper-200';
  const goldBadgeTone = isLight
    ? 'bg-gold-500/15 border-gold-600/40 text-gold-700'
    : 'bg-gold-500/20 border-gold-500/30 text-gold-300';
  const panelBorderTone = isLight ? 'border-gold-600/35' : 'border-gold-500/10';
  const panelSurfaceTone = isLight ? 'bg-paper-100/90' : 'bg-space-800/30';
  const panelSurfaceMutedTone = isLight ? 'bg-paper-50/90' : 'bg-space-800/20';
  const panelSurfaceSoftTone = isLight ? 'bg-paper-100/70' : 'bg-white/5';
  const goldTextTone = isLight ? 'text-gold-700' : 'text-gold-400';
  const goldTextStrongTone = isLight ? 'text-gold-800' : 'text-gold-300';
  const accentLabelTone = isLight ? 'text-gold-700' : 'text-accent';
  const mutedTextTone = isLight ? 'text-star-200' : 'text-star-400';
  const guideTitleTone = isLight ? 'text-gold-700' : 'text-gold-100';
  const symptomSelectedTone = isLight
    ? 'bg-gold-500/25 border-gold-600 text-star-50 shadow-[0_0_10px_rgba(159,118,69,0.25)]'
    : 'bg-gold-500/20 border-gold-500 text-star-50 shadow-[0_0_15px_rgba(212,175,55,0.2)]';
  const symptomBaseTone = isLight
    ? 'bg-paper-50 border-paper-300 text-star-200 hover:bg-paper-100'
    : 'bg-white/5 border-white/10 text-star-400 hover:bg-white/10';
  const symptomChipTone = isLight
    ? 'bg-gold-500/15 text-gold-800 border-gold-600/40'
    : 'bg-gold-500/20 text-gold-300 border-gold-500/30';
  const thoughtSelectedTone = isLight
    ? 'bg-gold-500/15 border-gold-600/40 ring-2 ring-gold-600/20'
    : 'bg-gold-900/30 border-gold-500/50 ring-2 ring-gold-500/20';
  const thoughtBaseTone = isLight
    ? 'bg-paper-50 border-paper-300 hover:border-gold-600/30'
    : 'bg-space-800/10 border-gold-500/10 hover:border-gold-500/30';
  const overlayTone = isLight ? 'bg-paper-200/80' : 'bg-black/85';
  const shellTone = isLight ? 'bg-paper-100 border-gold-600/30' : 'bg-space-900 border-gold-500/20';
  const shellPanelTone = isLight ? 'bg-paper-100' : 'bg-space-900';
  const rightPanelTone = isLight
    ? 'bg-gradient-to-br from-paper-100 to-paper-200 border-paper-300'
    : 'bg-gradient-to-br from-space-800 to-space-900 border-gold-500/10';
  const progressTrackTone = isLight ? 'bg-paper-200' : 'bg-white/10';
  const closeButtonTone = isLight
    ? 'bg-paper-100/80 border-paper-300 text-star-200 hover:bg-paper-200'
    : 'bg-white/5 border-gold-500/10 text-star-400 hover:bg-danger/20 hover:text-danger';
  const guideCardTone = isLight ? 'bg-paper-100/80 border-paper-300' : 'bg-white/[0.02] border-gold-500/10';

  // i18n: Translated mood options
  const emojiOptions = useMemo(() => [
    { type: 'very_happy' as EmojiMood, label: t.journal.mood_very_happy, color: 'text-accent', bg: 'bg-accent/10' },
    { type: 'happy' as EmojiMood, label: t.journal.mood_happy, color: 'text-accent', bg: 'bg-accent/10' },
    { type: 'okay' as EmojiMood, label: t.journal.mood_okay, color: 'text-star-200', bg: 'bg-star-200/10' },
    { type: 'annoyed' as EmojiMood, label: t.journal.mood_annoyed, color: 'text-star-400', bg: 'bg-star-400/10' },
    { type: 'terrible' as EmojiMood, label: t.journal.mood_terrible, color: 'text-danger', bg: 'bg-danger/10' },
  ], [t]);

  // i18n: Translated body symptom presets
  const bodySymptomPresets = useMemo(() => [
    { category: t.journal.body_head_neck, items: [t.journal.symptom_headache, t.journal.symptom_dizziness], icon: Brain },
    { category: t.journal.body_chest_lungs, items: [t.journal.symptom_chest_tightness, t.journal.symptom_palpitations], icon: Heart },
    { category: t.journal.body_digestive, items: [t.journal.symptom_stomach_discomfort, t.journal.symptom_nausea], icon: Activity },
    { category: t.journal.body_muscles, items: [t.journal.symptom_shoulder_stiffness, t.journal.symptom_body_trembling], icon: Dumbbell },
    { category: t.journal.body_whole_sleep, items: [t.journal.symptom_insomnia, t.journal.symptom_extreme_fatigue], icon: Moon },
    { category: t.journal.body_other, items: [t.journal.symptom_none], icon: Activity }
  ], [t]);

  // i18n: Translated step examples
  const stepExamples = useMemo(() => [
    t.journal.step1_example,
    t.journal.step2_example,
    t.journal.step3_example,
    t.journal.step4_example,
    t.journal.step5_example,
    t.journal.step6_example,
    t.journal.step7_example,
    t.journal.step8_example,
    t.journal.step9_example,
    t.journal.step10_example,
  ], [t]);

  // i18n: Translated step titles
  const stepTitles = useMemo(() => [
    t.journal.step1_title,
    t.journal.step2_title,
    t.journal.step3_title,
    t.journal.step4_title,
    t.journal.step5_title,
    t.journal.step6_title,
    t.journal.step7_title,
    t.journal.step8_title,
    t.journal.step9_title,
    t.journal.step10_title,
  ], [t]);

  // i18n: Translated step help
  const getStepHelp = (step: number) => {
    const helps = [
      t.journal.step1_guide,
      t.journal.step2_guide,
      t.journal.step3_guide,
      t.journal.step4_guide,
      t.journal.step5_guide,
      t.journal.step6_guide,
      t.journal.step7_guide,
      t.journal.step8_guide,
      t.journal.step9_guide,
      t.journal.step10_guide,
    ];
    return helps[step] || "";
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [finalRecord, setFinalRecord] = useState<CBTRecord | null>(null);
  const [pendingRecord, setPendingRecord] = useState<CBTRecord | null>(null);
  
  const [situation, setSituation] = useState("");
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [tempMoodName, setTempMoodName] = useState("");
  const [tempMoodIntensity, setTempMoodIntensity] = useState(50);
  const [bodySymptoms, setBodySymptoms] = useState<string[]>([]);
  const [autoThoughts, setAutoThoughts] = useState<string[]>([]);
  const [tempThought, setTempThought] = useState("");
  const [hotThought, setHotThought] = useState("");
  const [evidenceFor, setEvidenceFor] = useState<string[]>([]);
  const [tempEvidenceFor, setTempEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState<string[]>([]);
  const [tempEvidenceAgainst, setTempEvidenceAgainst] = useState("");
  const [balancedEntries, setBalancedEntries] = useState<BalancedEntry[]>([]);
  const [tempBalancedText, setTempBalancedText] = useState("");
  const [tempBalancedBelief, setTempBalancedBelief] = useState(50);

  const addMood = () => {
    if (!tempMoodName.trim()) return;
    setMoods([...moods, { id: Date.now().toString(), name: tempMoodName, initialIntensity: tempMoodIntensity, finalIntensity: tempMoodIntensity }]);
    setTempMoodName(""); setTempMoodIntensity(50);
  };
  const toggleSymptom = (symptom: string) => {
    if (symptom === t.journal.symptom_none) {
      setBodySymptoms([t.journal.symptom_none]);
      return;
    }
    const newSymptoms = bodySymptoms.filter(s => s !== t.journal.symptom_none);
    if (newSymptoms.includes(symptom)) {
      setBodySymptoms(newSymptoms.filter(s => s !== symptom));
    } else {
      setBodySymptoms([...newSymptoms, symptom]);
    }
  };
  const addThought = () => {
    if (!tempThought.trim()) return;
    setAutoThoughts([...autoThoughts, tempThought]);
    setTempThought("");
  };
  const addEvidenceFor = () => {
    if (!tempEvidenceFor.trim()) return;
    setEvidenceFor([...evidenceFor, tempEvidenceFor]);
    setTempEvidenceFor("");
  };
  const addEvidenceAgainst = () => {
    if (!tempEvidenceAgainst.trim()) return;
    setEvidenceAgainst([...evidenceAgainst, tempEvidenceAgainst]);
    setTempEvidenceAgainst("");
  };
  const addBalanced = () => {
    if (!tempBalancedText.trim()) return;
    setBalancedEntries([...balancedEntries, { id: Date.now().toString(), text: tempBalancedText, belief: tempBalancedBelief }]);
    setTempBalancedText(""); setTempBalancedBelief(50);
  };

  const buildAnalysisErrorMessage = (error: unknown) => {
    if (!import.meta.env.DEV) return t.journal.error;
    if (!error || typeof error !== 'object') return t.journal.error;
    const status = 'status' in error && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status?: number }).status
      : null;
    const reason = 'reason' in error && typeof (error as { reason?: unknown }).reason === 'string'
      ? (error as { reason?: string }).reason
      : null;
    const detail = [status, reason].filter(Boolean).join(', ');
    return detail ? `${t.journal.error} (${detail})` : t.journal.error;
  };

  const submitAnalysis = async (record: CBTRecord) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeCBTRecord(record, profile);
      const completedRecord = { ...record, analysis: result };
      setReport(result);
      setFinalRecord(completedRecord);
      setPendingRecord(null);
      onComplete(completedRecord);
    } catch (error) {
      console.error(error);
      setAnalysisError(buildAnalysisErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinish = async (selectedEmoji: EmojiMood) => {
    // 确定时间戳：如果传入了指定日期，则使用该日期；保持时分秒为当前时间，避免覆盖顺序问题
    let recordTimestamp = Date.now();
    if (initialDate) {
      const now = new Date();
      const target = new Date(initialDate);
      target.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      recordTimestamp = target.getTime();
    }

    const record: CBTRecord = {
      id: Date.now().toString(), 
      timestamp: recordTimestamp,
      situation, moods, bodySymptoms, automaticThoughts: autoThoughts, hotThought,
      evidenceFor, evidenceAgainst, balancedEntries, emojiMood: selectedEmoji,
      completedActionIndices: []
    };
    setPendingRecord(record);
    await submitAnalysis(record);
  };

  const isStepValid = () => {
    switch(currentStep) {
      case 0: return situation.length > 3;
      case 1: return moods.length > 0;
      case 2: return bodySymptoms.length > 0;
      case 3: return autoThoughts.length > 0;
      case 4: return !!hotThought;
      case 5: return evidenceFor.length > 0;
      case 6: return evidenceAgainst.length > 0;
      case 7: return balancedEntries.length > 0;
      case 8: return moods.length > 0;
      default: return false;
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 0: return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {initialDate && (
              <div className={`mb-6 p-3 rounded-xl inline-flex items-center gap-2 font-bold text-sm ${goldBadgeTone}`}>
                 <Wand2 size={16} />
                 {t.journal.recording_memory} {new Date(initialDate).toLocaleDateString('zh-CN', {month:'long', day:'numeric'})} {t.journal.recording_memory_suffix}
              </div>
           )}
          <textarea
            value={situation} onChange={(e) => setSituation(e.target.value)}
            placeholder={t.journal.situation_formula}
            className={`w-full h-80 rounded-[2.5rem] p-10 text-xl border outline-none resize-none transition-all leading-relaxed ${journalFieldTone}`}
            autoFocus
          />
        </div>
      );
      case 1:
      case 8: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 输入新情绪区域 - 仅在 Step 1 显示 */}
          {currentStep === 1 && (
            <div className={`p-6 rounded-[2rem] border shadow-xl space-y-5 ${journalPanelTone}`}>
              {/* 你的感受 */}
              <div className="space-y-2">
                <label className={`text-sm font-black uppercase tracking-widest ${mutedTextTone}`}>{t.journal.your_feeling}</label>
                <input
                  value={tempMoodName} onChange={(e) => setTempMoodName(e.target.value)}
                  placeholder={t.journal.mood_placeholder}
                  className={`w-full rounded-xl px-4 py-3 border outline-none transition-all text-lg ${journalInputTone}`}
                  autoFocus
                />
              </div>
              {/* 感受强度 */}
              <div className="space-y-3">
                <label className={`text-sm font-black uppercase tracking-widest ${mutedTextTone}`}>{t.journal.intensity_label}</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range" min="0" max="100" value={tempMoodIntensity}
                    onChange={(e) => setTempMoodIntensity(parseInt(e.target.value))}
                    className={`flex-1 h-3 rounded-full appearance-none cursor-pointer ${isLight ? 'bg-paper-300' : 'bg-space-700'}`}
                    style={{
                      background: `linear-gradient(to right, ${isLight ? '#9F7645' : '#C6A062'} 0%, ${isLight ? '#9F7645' : '#C6A062'} ${tempMoodIntensity}%, ${isLight ? '#E4D7C6' : '#1a1d23'} ${tempMoodIntensity}%, ${isLight ? '#E4D7C6' : '#1a1d23'} 100%)`
                    }}
                  />
                  <span className={`text-2xl font-mono font-bold w-20 text-center ${goldTextTone}`}>{tempMoodIntensity}%</span>
                </div>
              </div>
              {/* 添加按钮 */}
              <button onClick={addMood} className="w-full bg-gold-600 hover:bg-gold-500 px-6 py-4 rounded-xl text-space-900 transition-all active:scale-95 shadow-lg shadow-gold-900/40 font-bold flex items-center justify-center gap-2 text-lg">
                <Plus size={22} />
                {t.journal.add_btn}
              </button>
            </div>
          )}

          {/* 已添加的感受列表 */}
          {moods.length > 0 && (
            <div className="space-y-3">
              <div className={`text-xs font-black uppercase tracking-widest px-2 ${mutedTextTone}`}>
                {currentStep === 8 ? t.journal.reassess_mood : `${moods.length} ${language === 'zh' ? '个已添加' : 'added'}`}
              </div>
              <div className="space-y-2">
                {moods.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`p-4 border rounded-2xl group transition-all ${panelSurfaceMutedTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`${mutedTextTone} font-black text-sm`}>{idx + 1}.</span>
                        <span className="text-star-50 font-bold text-lg">{m.name}</span>
                      </div>
                      <button onClick={() => setMoods(moods.filter(x => x.id !== m.id))} className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-star-200 hover:text-danger' : 'text-star-400 hover:text-danger'}`}>
                        <Trash2 size={18}/>
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      {currentStep === 8 ? (
                        <>
                          <input
                            type="range" min="0" max="100" value={m.finalIntensity ?? m.initialIntensity}
                            onChange={(e) => setMoods(moods.map(x => x.id === m.id ? {...x, finalIntensity: parseInt(e.target.value)} : x))}
                            className={`flex-1 h-2.5 rounded-full appearance-none cursor-pointer ${isLight ? 'bg-paper-300' : 'bg-space-700'}`}
                            style={{
                              background: `linear-gradient(to right, ${isLight ? '#9F7645' : '#C6A062'} 0%, ${isLight ? '#9F7645' : '#C6A062'} ${m.finalIntensity ?? m.initialIntensity}%, ${isLight ? '#E4D7C6' : '#1a1d23'} ${m.finalIntensity ?? m.initialIntensity}%, ${isLight ? '#E4D7C6' : '#1a1d23'} 100%)`
                            }}
                          />
                          <span className={`font-mono font-bold w-16 text-right ${goldTextTone}`}>{m.finalIntensity ?? m.initialIntensity}%</span>
                        </>
                      ) : (
                        <>
                          <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-paper-300' : 'bg-space-700'}`}>
                            <div className="h-full bg-gold-500 transition-all duration-700 rounded-full" style={{width: `${m.initialIntensity}%`}}></div>
                          </div>
                          <span className={`font-mono font-bold w-16 text-right ${goldTextTone}`}>{m.initialIntensity}%</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
      case 2: return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-start justify-start min-h-[400px]">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mb-6">
              {bodySymptomPresets.map((group) => {
                const IconComponent = group.icon;
                return (
                <div key={group.category} className={`border rounded-[2rem] p-5 shadow-lg ${panelSurfaceTone} ${panelBorderTone}`}>
                  <h4 className={`text-[11px] font-black uppercase mb-3 tracking-[0.25em] border-b pb-1.5 flex items-center gap-2 ${goldTextTone} ${panelBorderTone}`}>
                    <IconComponent size={14}/> {group.category}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {group.items.map(item => (
                      <button
                        key={item}
                        onClick={() => toggleSymptom(item)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border text-left ${bodySymptoms.includes(item) ? symptomSelectedTone : symptomBaseTone}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                );
              })}
           </div>
           <div className={`w-full max-w-4xl p-4 rounded-2xl border flex flex-wrap gap-2 items-center ${panelSurfaceSoftTone} ${panelBorderTone}`}>
              <span className={`text-[11px] font-black uppercase tracking-widest mr-2 ${goldTextTone}`}>{t.journal.perception_status}</span>
              {bodySymptoms.length === 0 ? <span className={`${mutedTextTone} text-sm font-medium`}>{t.journal.click_to_mark}</span> : bodySymptoms.map(s => (
                <div key={s} className={`px-3 py-1 rounded-lg text-sm font-bold border flex items-center gap-2 ${symptomChipTone}`}>
                  {s} <X size={12} className="cursor-pointer" onClick={() => toggleSymptom(s)}/>
                </div>
              ))}
           </div>
        </div>
      );
      case 3:
      case 5:
      case 6: {
        const isAgainst = currentStep === 6;
        const inputValue = currentStep === 3 ? tempThought : currentStep === 5 ? tempEvidenceFor : tempEvidenceAgainst;
        const setInputValue = currentStep === 3 ? setTempThought : currentStep === 5 ? setTempEvidenceFor : setTempEvidenceAgainst;
        const addItem = currentStep === 3 ? addThought : currentStep === 5 ? addEvidenceFor : addEvidenceAgainst;
        const items = currentStep === 3 ? autoThoughts : currentStep === 5 ? evidenceFor : evidenceAgainst;
        const removeItem = (idx: number) => {
          if(currentStep === 3) setAutoThoughts(autoThoughts.filter((_, i) => i !== idx));
          if(currentStep === 5) setEvidenceFor(evidenceFor.filter((_, i) => i !== idx));
          if(currentStep === 6) setEvidenceAgainst(evidenceAgainst.filter((_, i) => i !== idx));
        };
        const inputLabel = currentStep === 3 ? t.journal.your_thought : currentStep === 5 ? t.journal.evidence_for_label : t.journal.evidence_against_label;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 热点思维提示 - 仅在 Step 5/6 显示 */}
            {currentStep > 3 && (
              <div className={`p-4 rounded-[1.5rem] flex items-start gap-4 border ${isAgainst ? 'bg-danger/10 border-danger/20' : (isLight ? 'bg-gold-500/10 border-gold-600/35' : 'bg-gold-950/20 border-gold-500/20')}`}>
                <div className={`p-2 rounded-xl mt-1 ${isAgainst ? 'bg-danger/20 text-danger' : (isLight ? 'bg-gold-500/20 text-gold-700' : 'bg-gold-500/20 text-gold-400')}`}><Zap size={16}/></div>
                <div>
                  <p className={`text-[11px] uppercase font-black tracking-widest mb-1 ${isAgainst ? 'text-danger' : goldTextTone}`}>{t.journal.analyzing_thought}</p>
                  <p className="text-star-50 font-medium text-lg leading-relaxed">"{hotThought}"</p>
                </div>
              </div>
            )}

            {/* 垂直输入区域 */}
            <div className={`p-6 rounded-[2rem] border shadow-xl space-y-5 transition-colors duration-500 ${isAgainst ? 'bg-danger/5 border-danger/20' : journalPanelTone}`}>
              {/* 标签 */}
              <div className="space-y-2">
                <label className={`text-sm font-black uppercase tracking-widest ${isAgainst ? 'text-danger' : mutedTextTone}`}>{inputLabel}</label>
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') addItem(); }}
                  placeholder={t.journal.input_placeholder}
                  className={`w-full rounded-xl px-4 py-3 border outline-none transition-all text-lg ${journalInputTone}`}
                  autoFocus
                />
              </div>
              {/* 添加按钮 */}
              <button
                onClick={addItem}
                className={`w-full ${isAgainst ? 'bg-danger hover:bg-danger/80' : 'bg-gold-600 hover:bg-gold-500'} px-6 py-4 rounded-xl text-space-900 transition-all active:scale-95 shadow-lg font-bold flex items-center justify-center gap-2 text-lg`}
              >
                <Plus size={22} />
                {t.journal.add_btn}
              </button>
            </div>

            {/* 已添加列表 */}
            {items.length > 0 && (
              <div className="space-y-3">
                <div className={`text-xs font-black uppercase tracking-widest px-2 ${mutedTextTone}`}>
                  {items.length} {language === 'zh' ? '条已添加' : 'added'}
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className={`group p-4 border rounded-2xl animate-in slide-in-from-left-4 ${isAgainst ? 'bg-danger/5 border-danger/20' : `${panelSurfaceMutedTone} ${panelBorderTone}`} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className={`${mutedTextTone} font-black text-sm mt-0.5`}>{i + 1}.</span>
                          <span className="text-star-200 text-lg leading-relaxed">{item}</span>
                        </div>
                        <button onClick={() => removeItem(i)} className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-star-200 hover:text-danger' : 'text-star-400 hover:text-danger'}`}>
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      case 4: return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className={`text-sm mb-4 flex items-center gap-2 px-4 ${mutedTextTone}`}><Info size={16}/> {t.journal.select_hot_thought}</p>
          {autoThoughts.map((thought, i) => (
            <button
              key={i} onClick={() => setHotThought(thought)}
              className={`w-full text-left p-6 rounded-[2rem] border transition-all flex items-center justify-between group relative overflow-hidden ${hotThought === thought ? thoughtSelectedTone : thoughtBaseTone}`}
            >
              <div className="flex items-center gap-4 z-10">
                <span className={`text-sm font-black ${hotThought === thought ? goldTextTone : mutedTextTone}`}>{i + 1}.</span>
                <span className={`text-xl leading-relaxed ${hotThought === thought ? 'text-star-50 font-bold' : mutedTextTone}`}>{thought}</span>
              </div>
              {hotThought === thought ? <Sparkles size={28} className="text-accent animate-pulse z-10" /> : <Eye size={24} className="text-star-400 group-hover:text-star-400 z-10" />}
              {hotThought === thought && <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent"></div>}
            </button>
          ))}
        </div>
      );
      case 7: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 垂直输入区域 */}
          <div className={`p-6 rounded-[2rem] border shadow-xl space-y-5 ${journalPanelTone}`}>
            {/* 平衡思维标签 */}
            <div className="space-y-2">
              <label className={`text-sm font-black uppercase tracking-widest ${accentLabelTone}`}>{t.journal.balanced_thought}</label>
              <textarea
                value={tempBalancedText} onChange={(e) => setTempBalancedText(e.target.value)}
                placeholder={t.journal.balanced_template}
                className={`w-full h-32 rounded-xl p-4 text-lg border outline-none resize-none transition-all ${journalInputTone}`}
                autoFocus
              />
            </div>
            {/* 相信程度 */}
            <div className="space-y-3">
              <label className={`text-sm font-black uppercase tracking-widest ${mutedTextTone}`}>{t.journal.belief_level}</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="0" max="100" value={tempBalancedBelief}
                  onChange={(e) => setTempBalancedBelief(parseInt(e.target.value))}
                  className={`flex-1 h-3 rounded-full appearance-none cursor-pointer ${isLight ? 'bg-paper-300' : 'bg-space-700'}`}
                  style={{
                    background: `linear-gradient(to right, ${isLight ? '#9F7645' : '#C6A062'} 0%, ${isLight ? '#9F7645' : '#C6A062'} ${tempBalancedBelief}%, ${isLight ? '#E4D7C6' : '#1a1d23'} ${tempBalancedBelief}%, ${isLight ? '#E4D7C6' : '#1a1d23'} 100%)`
                  }}
                />
                <span className={`text-2xl font-mono font-bold w-20 text-center ${goldTextTone}`}>{tempBalancedBelief}%</span>
              </div>
            </div>
            {/* 添加按钮 */}
            <button onClick={addBalanced} className="w-full bg-gold-600 hover:bg-gold-500 px-6 py-4 rounded-xl text-space-900 transition-all active:scale-95 shadow-lg shadow-gold-900/40 font-bold flex items-center justify-center gap-2 text-lg">
              <Plus size={22} />
              {t.journal.add_btn}
            </button>
          </div>

          {/* 已添加列表 */}
          {balancedEntries.length > 0 && (
            <div className="space-y-3">
              <div className={`text-xs font-black uppercase tracking-widest px-2 ${mutedTextTone}`}>
                {balancedEntries.length} {language === 'zh' ? '条已添加' : 'added'}
              </div>
              <div className="space-y-2">
                {balancedEntries.map((b, i) => (
                  <div key={b.id} className={`group p-4 border rounded-2xl animate-in slide-in-from-right-4 ${panelSurfaceMutedTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-100' : 'hover:bg-space-800/30'}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className={`${mutedTextTone} font-black text-sm mt-0.5`}>{i + 1}.</span>
                        <p className="text-star-200 text-lg leading-relaxed">{b.text}</p>
                      </div>
                      <button onClick={() => setBalancedEntries(balancedEntries.filter(x => x.id !== b.id))} className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-star-200 hover:text-danger' : 'text-star-400 hover:text-danger'}`}>
                        <Trash2 size={18}/>
                      </button>
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-paper-300' : 'bg-space-700'}`}>
                        <div className="h-full bg-gold-500 transition-all duration-700 rounded-full" style={{width: `${b.belief}%`}}></div>
                      </div>
                      <span className={`font-mono font-bold w-16 text-right ${goldTextTone}`}>{b.belief}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  if (finalRecord && report) {
    return (
      <div className="fixed inset-0 z-[200] bg-space-950 overflow-y-auto animate-in fade-in duration-500">
        <div className={`sticky top-0 z-30 backdrop-blur-xl p-6 border-b flex justify-between items-center ${isLight ? 'bg-paper-100/90' : 'bg-space-950/90'} ${panelBorderTone}`}>
            <button onClick={onClose} className={`flex items-center gap-3 font-bold transition-all px-4 py-2 rounded-xl ${isLight ? 'text-star-200 hover:bg-paper-200' : 'text-star-400 hover:text-star-50 hover:bg-white/5'}`}><ArrowLeft size={20} /> {t.journal.back_to_journal}</button>
            <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-sm"><CheckCircle2 size={20} /> {t.journal.analysis_saved}</div>
        </div>
        <ReportDashboard record={finalRecord} report={report} onUpdate={(updated) => onComplete(updated)} onClose={onClose} />
      </div>
    );
  }

  if (isAnalyzing) return (
    <div className="fixed inset-0 z-[200] bg-space-950 flex items-center justify-center overflow-hidden">
      <OracleLoading
        phrases={t.journal.cbt_loading_phrases || []}
        thinkingLabel={t.journal.cbt_loading_label || t.common.analyzing}
      />
    </div>
  );
  if (analysisError) {
    return (
      <div className="fixed inset-0 z-[200] bg-space-950/95 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-danger/40 bg-space-900/80 p-6 text-center">
          <div className="text-sm text-danger mb-4">{analysisError}</div>
          <div className="flex items-center justify-center gap-3">
            <button
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border ${isLight ? 'border-paper-300 text-star-200' : 'border-space-600 text-star-50'} hover:border-gold-500/60`}
              onClick={() => setAnalysisError(null)}
            >
              {t.journal.back_to_journal}
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${isLight ? 'border-gold-600/40 text-gold-700 hover:border-gold-500/70' : 'border-gold-500/30 text-gold-300 hover:border-gold-500/60'} ${pendingRecord ? '' : 'opacity-60 cursor-not-allowed'}`}
              onClick={() => pendingRecord && submitAnalysis(pendingRecord)}
              disabled={!pendingRecord}
            >
              {t.common.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 9) {
    return (
      <div className="fixed inset-0 z-[150] bg-space-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000">
        <div className="absolute inset-0 bg-radial-gradient from-gold-500/10 via-transparent to-transparent opacity-50"></div>
        <button onClick={onClose} className={`absolute top-10 right-10 p-5 rounded-[2rem] transition-all border shadow-2xl z-50 ${closeButtonTone}`}><X size={32}/></button>

        <div className="max-w-6xl w-full text-center space-y-16 relative z-10">
           <div className="space-y-6">
              <h2 className="text-6xl md:text-7xl font-serif text-star-50 tracking-tight">{t.journal.return_to_stars}</h2>
              <p className={`text-xl font-light tracking-wide max-w-2xl mx-auto ${mutedTextTone}`}>{t.journal.choose_soul_state}</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pt-6">
              {emojiOptions.map(opt => (
                <button
                  key={opt.type} onClick={() => handleFinish(opt.type)}
                  className={`group flex flex-col items-center gap-8 p-8 rounded-[3rem] border hover:scale-105 transition-all duration-700 shadow-2xl relative overflow-hidden ${panelSurfaceTone} ${panelBorderTone} ${isLight ? 'hover:bg-paper-200' : 'hover:bg-white/[0.08] hover:border-gold-500/50'}`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-gradient-to-br from-gold-500/10 to-transparent' : 'bg-gradient-to-br from-white/5 to-transparent'}`}></div>
                  <div className="w-32 h-32 flex items-center justify-center transform scale-110 group-hover:scale-125 transition-transform duration-1000">
                    <MoodIcon mood={opt.type} size={120} />
                  </div>
                  <div className="space-y-1">
                    <span className={`text-sm font-black uppercase tracking-[0.4em] ${opt.color}`}>{opt.label}</span>
                    <div className="w-0 h-0.5 bg-gold-500 mx-auto group-hover:w-full transition-all duration-500"></div>
                  </div>
                </button>
              ))}
           </div>

           <button
             onClick={() => setCurrentStep(8)}
             className={`text-xs font-black uppercase tracking-[0.5em] pt-12 transition-all hover:tracking-[0.6em] flex items-center gap-4 mx-auto ${mutedTextTone} ${isLight ? 'hover:text-star-50' : 'hover:text-star-50'}`}
           >
             <ArrowLeft size={16} /> {t.journal.reassess_mood}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[150] backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 ${overlayTone}`}>
      <div className={`w-full max-w-6xl h-full md:h-[85vh] rounded-[4rem] border shadow-[0_0_100px_rgba(0,0,0,0.5)] flex overflow-hidden relative ${shellTone}`}>
        <button onClick={onClose} className={`absolute top-8 right-8 z-50 p-4 rounded-3xl transition-all border shadow-xl ${closeButtonTone}`}><X size={24} /></button>
        <div className={`w-full md:w-[calc(60%+10px)] p-8 md:p-12 flex flex-col ${shellPanelTone}`}>
            <header className="mb-6">
                <h2 className="text-4xl font-serif text-star-50 tracking-tight mb-2">{stepTitles[currentStep]}</h2>
                <div className="flex gap-2 h-1 mt-4">
                    {stepTitles.map((_, i) => (
                      <div key={i} className={`h-full flex-1 rounded-full transition-all duration-700 ${i <= currentStep ? 'bg-gold-500 shadow-[0_0_100px_rgba(212,175,55,0.5)]' : progressTrackTone}`}></div>
                    ))}
                </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-4">{renderStep()}</div>
        </div>

        <div className={`hidden md:flex md:w-[calc(40%-10px)] border-l flex-col p-10 overflow-hidden relative ${rightPanelTone}`}>
            <div className="relative z-10 h-full flex flex-col">
                {/* 星空指引标题 */}
                <div className="flex items-center gap-4 mb-6">
                   <div className={`p-4 rounded-3xl shadow-inner ${isLight ? 'bg-gold-500/15 text-gold-700' : 'bg-gold-500/20 text-gold-400'}`}><Wand2 size={24} /></div>
                   <span className={`font-serif text-3xl tracking-wide ${guideTitleTone}`}>{t.journal.star_guidance}</span>
                </div>

                {/* 星空指引内容（合并灵感引导） */}
                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                   <div className={`border p-8 rounded-[2.5rem] backdrop-blur-xl shadow-inner relative group ${guideCardTone}`}>
                      <div className="absolute -top-4 -left-4 p-4 bg-accent/20 rounded-2xl text-accent shadow-xl border border-accent/30 group-hover:scale-110 transition-transform"><Sparkles size={20} /></div>
                      <div className={`text-[11px] uppercase tracking-[0.4em] font-black mb-6 mt-2 ml-4 ${mutedTextTone}`}>{t.journal.current_step_guide}</div>
                      <div className="text-star-200 text-base leading-relaxed font-normal whitespace-pre-wrap">
                        {getStepHelp(currentStep)}
                      </div>
                   </div>

                   {/* 执行指引 + 示例 */}
                   <div className={`border p-6 rounded-[2.5rem] backdrop-blur-xl shadow-inner ${guideCardTone}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-accent/10 rounded-xl text-accent shadow-inner"><Lightbulb size={20} /></div>
                        <span className={`text-[11px] uppercase tracking-[0.3em] font-black ${mutedTextTone}`}>{t.journal.inspiration_guide}</span>
                      </div>
                      <div className={`text-sm leading-relaxed whitespace-pre-wrap ${mutedTextTone}`}>{stepExamples[currentStep]}</div>
                   </div>
                </div>

                {/* 导航按钮 */}
                <div className="mt-6 pt-6">
                  <div className="flex gap-4">
                    <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all border shadow-xl ${currentStep === 0 ? 'opacity-0 invisible' : (isLight ? 'bg-paper-100 text-star-200 border-paper-300 hover:bg-paper-200' : 'bg-white/5 text-star-400 hover:text-star-50 hover:bg-white/10 border-gold-500/10')}`}><ArrowLeft size={16} /> {t.journal.prev_step}</button>
                    <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!isStepValid()} className={`flex-[2] flex items-center justify-center gap-4 py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] transition-all shadow-2xl relative overflow-hidden group ${isStepValid() ? 'bg-gold-500 text-space-900 hover:scale-[1.02] active:scale-95' : 'bg-space-800 text-star-400 cursor-not-allowed opacity-50'}`}><span className="relative z-10">{currentStep === 8 ? t.journal.enter_finale : t.journal.next_step}</span><ArrowRight size={20} strokeWidth={3} className="relative z-10 group-hover:translate-x-2 transition-transform" /></button>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CBTWizard;
