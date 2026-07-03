import React from 'react';
import { SyntheticaAnalysisResult, SyntheticaSelectionState } from '../../../types';
import { useLanguage } from '../../UIComponents';
import { LlmDoc, LlmSection, LlmProse, LlmField } from '../../llm/LlmDoc';

interface ReportViewProps {
  result: SyntheticaAnalysisResult;
  selection: SyntheticaSelectionState;
  onReset: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ result, selection, onReset }) => {
  const { t } = useLanguage();
  const planetCopy = t.synthetica.catalog.planets as Record<string, { name: string }>;
  const signCopy = t.synthetica.catalog.signs as Record<string, { name: string }>;
  const houseCopy = t.synthetica.catalog.houses as Record<string, { name: string }>;
  const aspectCopy = t.synthetica.catalog.aspects as Record<string, { name: string }>;
  const getPlanetLabel = (id?: string) => (id ? planetCopy[id]?.name || id : '');
  const getSignLabel = (id?: string) => (id ? signCopy[id]?.name || id : '');
  const getHouseLabel = (id?: string) => (id ? houseCopy[id]?.name || id : '');
  const getAspectLabel = (id?: string) => (id ? aspectCopy[id]?.name || id : '');

  // 选中链（行星·星座·宫位·相位）作为单色 mono 眉标，取代金色轮换标签。
  const eyebrowParts = [
    selection.planet ? getPlanetLabel(selection.planet.id) : '',
    selection.sign ? getSignLabel(selection.sign.id) : '',
    selection.house ? getHouseLabel(selection.house.id) : '',
    ...(selection.aspects?.map(
      (asp) => `${getAspectLabel(asp.aspect.id)} ${getPlanetLabel(asp.planet.id)}`,
    ) ?? []),
  ].filter((part) => part && part.trim());

  const analysisLabel = t.synthetica.report.analysis_title || '深度解读';
  const shadowLabel = t.synthetica.report.shadow || '阴暗面';
  const adviceLabel = t.synthetica.report.advice || '行动建议';

  return (
    <div className="animate-fade-in mx-auto w-full max-w-3xl px-4 pb-16">
      <LlmDoc>
        <header className="mb-8 pt-8">
          {eyebrowParts.length > 0 && (
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
              {eyebrowParts.join(' · ')}
            </p>
          )}
          <h1 className="mt-2 text-2xl font-medium tracking-[-0.015em] text-paper-900 md:text-3xl dark:text-star-50">
            {result.report_title}
          </h1>
        </header>

        {result.synthesis && (
          <LlmSection first eyebrow={t.synthetica.report.synthesis_title || '核心洞察'}>
            <LlmProse text={result.synthesis} />
          </LlmSection>
        )}

        {result.modules?.map((module: any, idx: number) => {
          const keywords: string[] = Array.isArray(module.keywords)
            ? module.keywords.slice(0, 3).filter(Boolean)
            : [];
          return (
            <LlmSection
              key={idx}
              first={!result.synthesis && idx === 0}
              eyebrow={keywords.length ? keywords.join(' · ') : undefined}
              title={module.headline}
            >
              <div className="space-y-5">
                <LlmField label={analysisLabel} text={module.analysis} />
                <LlmField label={shadowLabel} text={module.shadow_side} />
                <LlmField label={adviceLabel} text={module.actionable_advice} />
              </div>
            </LlmSection>
          );
        })}
      </LlmDoc>

      <div className="pt-10">
        <button
          onClick={onReset}
          className="w-full rounded-2xl border border-paper-900/15 py-3 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-600 transition-colors hover:border-accent/50 hover:text-accent dark:border-star-50/15 dark:text-star-300 dark:hover:text-accent"
        >
          {t.synthetica.actions.reset}
        </button>
      </div>
    </div>
  );
};
