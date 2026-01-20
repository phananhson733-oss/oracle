import React from 'react';
import { SyntheticaAnalysisResult, SyntheticaSelectionState } from '../../../types';
import { useLanguage, useTheme } from '../../UIComponents';
import { TrendingUp, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';

interface ReportViewProps {
  result: SyntheticaAnalysisResult;
  selection: SyntheticaSelectionState;
  onReset: () => void;
}

// 解析文本为独立的观点/段落列表
const parsePoints = (text: string): string[] => {
  if (!text) return [];

  // 移除markdown标记
  let cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  // 尝试按句号、问号、感叹号分割
  const sentences = cleaned.split(/([。？！.?!])/g);
  const points: string[] = [];

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const punctuation = sentences[i + 1] || '';
    if (sentence && sentence.trim()) {
      points.push(sentence.trim() + punctuation);
    }
  }

  // 如果分割结果太少，尝试按换行符分割
  if (points.length <= 1 && cleaned.includes('\n')) {
    const lines = cleaned.split('\n').filter(line => line.trim());
    if (lines.length > 1) return lines;
  }

  return points.length > 0 ? points : [cleaned];
};

export const ReportView: React.FC<ReportViewProps> = ({ result, selection, onReset }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const planetCopy = t.synthetica.catalog.planets as Record<string, { name: string }>;
  const signCopy = t.synthetica.catalog.signs as Record<string, { name: string }>;
  const houseCopy = t.synthetica.catalog.houses as Record<string, { name: string }>;
  const getPlanetLabel = (id?: string) => id ? (planetCopy[id]?.name || id) : '';
  const getSignLabel = (id?: string) => id ? (signCopy[id]?.name || id) : '';
  const getHouseLabel = (id?: string) => id ? (houseCopy[id]?.name || id) : '';

  const isLight = theme === 'light';

  return (
    <div className="animate-fade-in w-full max-w-3xl mx-auto space-y-6 pb-16 px-4">

      {/* 标题区域 */}
      <div className="space-y-3 pt-8">
        <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-gold-600' : 'text-gold-400'}`}>
          <span>{selection.planet ? getPlanetLabel(selection.planet.id) : ''}</span>
          <span>·</span>
          <span>{selection.sign ? getSignLabel(selection.sign.id) : ''}</span>
          {selection.house && (
            <>
              <span>·</span>
              <span>{getHouseLabel(selection.house.id)}</span>
            </>
          )}
        </div>
        <h2 className={`text-2xl font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>
          {result.report_title}
        </h2>
      </div>

      {/* 综合分析卡片 */}
      <div className={`rounded-2xl border border-l border-l-gold-500/40 p-6 ${isLight ? 'bg-paper-100/85 border-paper-300' : 'bg-space-900/60 border-gold-500/10'}`}>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isLight ? 'border-gold-600/30 bg-paper-100/85 text-gold-600' : 'border-gold-500/30 bg-space-950 text-gold-500'}`}>
            <TrendingUp size={18} />
          </div>
          <h3 className={`text-base font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>
            {t.synthetica.report.synthesis_title || '核心洞察'}
          </h3>
        </div>
        <div className="pl-12 space-y-2">
          {parsePoints(result.synthesis).map((point, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-gold-600/50' : 'bg-gold-500/50'}`} />
              <p className={`text-sm leading-relaxed ${isLight ? 'text-paper-700' : 'text-star-200'}`}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 模块列表 */}
      {result.modules?.map((module: any, idx: number) => {
        const cardStyles = [
          { accent: 'border-l-accent/40', iconTone: isLight ? 'border-accent/30 bg-paper-100/85 text-accent' : 'border-accent/30 bg-space-950 text-accent' },
          { accent: 'border-l-success/40', iconTone: isLight ? 'border-success/30 bg-paper-100/85 text-success' : 'border-success/30 bg-space-950 text-success' },
          { accent: 'border-l-gold-400/40', iconTone: isLight ? 'border-gold-600/30 bg-paper-100/85 text-gold-600' : 'border-gold-400/30 bg-space-950 text-gold-400' },
          { accent: 'border-l-star-200/40', iconTone: isLight ? 'border-star-200/30 bg-paper-100/85 text-star-200' : 'border-star-200/30 bg-space-950 text-star-200' },
        ];
        const style = cardStyles[idx % cardStyles.length];

        return (
          <div
            key={idx}
            className={`rounded-2xl border border-l ${style.accent} p-6 ${isLight ? 'bg-paper-100/85 border-paper-300' : 'bg-space-900/60 border-gold-500/10'}`}
          >
            {/* 模块头部 */}
            <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${isLight ? 'border-paper-200' : 'border-gold-500/10'}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${style.iconTone}`}>
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-serif ${isLight ? 'text-paper-900' : 'text-star-50'}`}>
                  {module.headline}
                </h3>
                {module.keywords && module.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {module.keywords.slice(0, 3).map((k: string, i: number) => (
                      <span key={i} className={`px-2 py-0.5 text-xs rounded ${isLight ? 'bg-gold-100 text-gold-700' : 'bg-gold-500/10 text-gold-400'}`}>
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 模块内容 */}
            <div className="pl-12 space-y-5">
              {module.analysis && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className={isLight ? 'text-gold-600' : 'text-gold-400'} />
                    <span className={`text-xs font-bold ${isLight ? 'text-paper-500' : 'text-star-400'}`}>
                      {t.synthetica.report.analysis_title || '深度解读'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {parsePoints(module.analysis).map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-gold-600/50' : 'bg-gold-500/50'}`} />
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-paper-700' : 'text-star-200'}`}>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {module.shadow_side && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={isLight ? 'text-red-600' : 'text-red-400'} />
                    <span className={`text-xs font-bold ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                      {t.synthetica.report.shadow || '阴暗面'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {parsePoints(module.shadow_side).map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-red-500/50' : 'bg-red-500/50'}`} />
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-red-900' : 'text-red-200'}`}>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {module.actionable_advice && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className={isLight ? 'text-emerald-600' : 'text-emerald-400'} />
                    <span className={`text-xs font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      {t.synthetica.report.advice || '行动建议'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {parsePoints(module.actionable_advice).map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${isLight ? 'bg-emerald-500/50' : 'bg-emerald-500/50'}`} />
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 重置按钮 */}
      <div className="pt-6">
        <button
          onClick={onReset}
          className={`w-full py-3 rounded-xl border transition-all ${isLight ? 'bg-paper-100/85 border-paper-300 hover:border-gold-500/50 text-paper-700' : 'bg-space-900 border-gold-500/20 hover:border-gold-500/40 text-star-200'}`}
        >
          {t.synthetica.actions.reset}
        </button>
      </div>
    </div>
  );
};
