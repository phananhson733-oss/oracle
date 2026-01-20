// INPUT: Synthetica selection flow, entitlements, and report generation (paper warm theme alignment).
// OUTPUT: Renders the Synthetica tool page with gated generation and quota display (contrast-safe steps).
// POS: Synthetica tool page; if updated, update this header and components/wiki/FOLDER.md.

import React, { useState } from 'react';
import { CONTEXTS, PLANETS, SIGNS, HOUSES, ASPECTS } from './synthetica/constants';
import {
  SyntheticaSelectionState,
  SyntheticaContextFilter,
  SyntheticaPlanet,
  SyntheticaAspect,
  SyntheticaSign,
  SyntheticaHouse,
  SyntheticaReportResponse
} from '../../types';
import { SelectionCard } from './synthetica/SelectionCard';
import { ReportView } from './synthetica/ReportView';
import { generateSyntheticaReport } from '../../services/apiClient';
import { useLanguage, useTheme } from '../UIComponents';
import { OracleLoading } from '../OracleLoading';
import { useEntitlement, useSyntheticaQuota } from '../../contexts/EntitlementContext';

const WikiSyntheticaPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { isSubscriber, checkAccess, openPaywall, refreshEntitlements } = useEntitlement();
  const { freeLeft: syntheticaFreeLeft, subscriptionLeft: syntheticaSubscriptionLeft } = useSyntheticaQuota();
  const contextCopy = t.synthetica.catalog.contexts as Record<SyntheticaContextFilter, { label: string; description: string }>;
  const planetCopy = t.synthetica.catalog.planets as Record<string, { name: string; archetype: string }>;
  const signCopy = t.synthetica.catalog.signs as Record<string, { name: string; archetype: string }>;
  const houseCopy = t.synthetica.catalog.houses as Record<string, { name: string; archetype: string }>;
  const aspectCopy = t.synthetica.catalog.aspects as Record<string, { name: string; description: string }>;
  
  // Steps: 
  // 0:Context, 1:Planet, 2:Sign, 3:House
  // 4:Aspect Dashboard (Add or Generate)
  // 5:Select Second Planet
  // 6:Select Aspect Type
  // 7:Result
  const [step, setStep] = useState<number>(0); 
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Temporary state for adding a new aspect
  const [tempSecondPlanet, setTempSecondPlanet] = useState<SyntheticaPlanet | null>(null);

  const [selection, setSelection] = useState<SyntheticaSelectionState>({
    context: SyntheticaContextFilter.LOVE,
    planet: null,
    sign: null,
    house: null,
    aspects: [],
  });

  const [result, setResult] = useState<SyntheticaReportResponse | null>(null);
  const syntheticaDailyLimit = 3 + (isSubscriber ? 7 : 0);
  const syntheticaDailyLeft = Math.max(0, syntheticaFreeLeft + syntheticaSubscriptionLeft);
  const syntheticaQuotaText = (t.synthetica.quota || '')
    .replace('{left}', String(syntheticaDailyLeft))
    .replace('{total}', String(syntheticaDailyLimit));
  const sentencePunctuation = language === 'en' ? '.' : '。';

  const getContextCardLabel = (id: SyntheticaContextFilter) => contextCopy[id]?.label || id;
  const getContextCardDescription = (id: SyntheticaContextFilter) => contextCopy[id]?.description || '';
  const getContextBlueprintLabel = (id: SyntheticaContextFilter) => {
    const map: Record<SyntheticaContextFilter, string> = {
      [SyntheticaContextFilter.LOVE]: t.synthetica.blueprint.contexts.love,
      [SyntheticaContextFilter.SELF]: t.synthetica.blueprint.contexts.self,
      [SyntheticaContextFilter.HEALING]: t.synthetica.blueprint.contexts.healing,
      [SyntheticaContextFilter.CAREER]: t.synthetica.blueprint.contexts.career,
      [SyntheticaContextFilter.TIMING]: t.synthetica.blueprint.contexts.timing,
      [SyntheticaContextFilter.SOCIAL]: t.synthetica.blueprint.contexts.social,
    };
    return map[id] || id;
  };

  const getPlanetLabel = (id?: string) => id ? (planetCopy[id]?.name || id) : '';
  const getPlanetArchetype = (id?: string) => (id && planetCopy[id]?.archetype) || '';
  const getSignLabel = (id?: string) => (id && signCopy[id]?.name) || id || '';
  const getHouseLabel = (id?: string) => (id && houseCopy[id]?.name) || id || '';
  const getHouseArchetype = (id?: string) => (id && houseCopy[id]?.archetype) || '';
  const getAspectLabel = (id?: string) => (id && aspectCopy[id]?.name) || id || '';
  const getAspectDescription = (id?: string) => (id && aspectCopy[id]?.description) || '';

  const localizePlanet = (planet: SyntheticaPlanet | null): SyntheticaPlanet | null => {
    if (!planet) return null;
    return {
      ...planet,
      name: getPlanetLabel(planet.id) || planet.name,
      archetype: getPlanetArchetype(planet.id) || planet.archetype,
    };
  };

  const localizeSign = (sign: SyntheticaSign | null): SyntheticaSign | null => {
    if (!sign) return null;
    return {
      ...sign,
      name: getSignLabel(sign.id) || sign.name,
      archetype: signCopy[sign.id]?.archetype || sign.archetype,
    };
  };

  const localizeHouse = (house: SyntheticaHouse | null): SyntheticaHouse | null => {
    if (!house) return null;
    return {
      ...house,
      name: getHouseLabel(house.id) || house.name,
      archetype: getHouseArchetype(house.id) || house.archetype,
    };
  };

  const localizeAspect = (aspect: SyntheticaAspect): SyntheticaAspect => ({
    ...aspect,
    name: getAspectLabel(aspect.id) || aspect.name,
    description: getAspectDescription(aspect.id) || aspect.description,
  });

  const localizeSelection = (raw: SyntheticaSelectionState): SyntheticaSelectionState => ({
    ...raw,
    planet: localizePlanet(raw.planet),
    sign: localizeSign(raw.sign),
    house: localizeHouse(raw.house),
    aspects: raw.aspects.map((a) => ({
      planet: localizePlanet(a.planet) || a.planet,
      aspect: localizeAspect(a.aspect),
    })),
  });

  const handleSelection = (key: keyof SyntheticaSelectionState, value: any) => {
    setSelection((prev: SyntheticaSelectionState) => ({ ...prev, [key]: value }));
    // Auto advance
    if (key === 'context') setStep(1);
    if (key === 'planet') setStep(2);
    if (key === 'sign') setStep(3);
    // House selection manually advances to step 4
  };

  const addAspect = (aspect: SyntheticaAspect) => {
    if (tempSecondPlanet) {
      setSelection((prev: SyntheticaSelectionState) => ({
        ...prev,
        aspects: [...prev.aspects, { planet: tempSecondPlanet, aspect }]
      }));
      setTempSecondPlanet(null);
      setStep(4); // Back to dashboard
    }
  };

  const removeAspect = (index: number) => {
    setSelection((prev: SyntheticaSelectionState) => ({
      ...prev,
      aspects: prev.aspects.filter((_: any, i: number) => i !== index)
    }));
  };

  const generateReport = async () => {
    if (loading) return;
    setError(null);
    const access = await checkAccess('synthetica');
    if (!access.canAccess) {
      if (access.needPurchase) {
        openPaywall('synthetica', undefined, access.price);
      }
      return;
    }
    setLoading(true);
    try {
      const data = await generateSyntheticaReport(localizeSelection(selection), language);
      setResult(data);
      setStep(7);
      await refreshEntitlements();
    } catch (err) {
      try {
        const access = await checkAccess('synthetica');
        if (!access.canAccess && access.needPurchase) {
          openPaywall('synthetica', undefined, access.price);
          return;
        }
      } catch {
        // Fall through to the default error copy.
      }
      setError(t.synthetica.report.error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0); 
    setSelection({ 
      context: SyntheticaContextFilter.LOVE, 
      planet: null, 
      sign: null, 
      house: null, 
      aspects: [] 
    }); 
    setTempSecondPlanet(null);
    setResult(null);
  };

  const goBack = () => {
    switch (step) {
      case 1: setStep(0); break;
      case 2: setStep(1); break;
      case 3: setStep(2); break;
      case 4: setStep(3); break;
      case 5: 
        setTempSecondPlanet(null);
        setStep(4); 
        break;
      case 6: setStep(5); break;
      default: break;
    }
  };


  const BackButton = () => (
    <button
      onClick={goBack}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        text-sm font-medium transition-all duration-200
        cursor-pointer group
        ${theme === 'dark'
          ? 'bg-space-800/60 border border-space-700 text-star-300 hover:bg-space-700/80 hover:border-gold-500/40 hover:text-gold-300'
          : 'bg-paper-100 border border-paper-300 text-paper-600 hover:bg-paper-50 hover:border-gold-400/50 hover:text-gold-700'
        }
      `}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      <span>{t.synthetica.actions.back}</span>
    </button>
  );

  const steps = [
    { key: 0, label: t.synthetica.steps.target },
    { key: 1, label: t.synthetica.steps.planet },
    { key: 2, label: t.synthetica.steps.sign },
    { key: 3, label: t.synthetica.steps.house },
    { key: 4, label: t.synthetica.steps.aspect },
  ];

  const renderBreadcrumbs = () => (
    <div className="relative mb-10 max-w-md mx-auto">
      {/* 进度条背景 */}
      <div className={`absolute top-4 left-[5%] right-[5%] h-[2px] ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-300'}`} />

      {/* 进度条填充 */}
      <div
        className={`absolute top-4 left-[5%] h-[2px] transition-all duration-500 ease-out ${theme === 'dark' ? 'bg-gradient-to-r from-gold-500 to-mystic-500' : 'bg-gradient-to-r from-gold-500 to-accent'}`}
        style={{ width: `${Math.min((step / 4) * 90, 90)}%` }}
      />

      {/* 步骤节点 */}
      <div className="relative flex items-center justify-between px-2">
        {steps.map((s, idx) => {
          const isCompleted = step > s.key;
          const isCurrent = step === s.key;

          return (
            <div key={s.key} className="flex flex-col items-center gap-2">
              {/* 节点圆圈 */}
              <div className={`
                relative w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-300 ease-out
                ${isCompleted
                  ? (theme === 'dark'
                    ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-space-950 shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                    : 'bg-gradient-to-br from-gold-500 to-gold-600 text-space-950 shadow-md')
                  : isCurrent
                    ? (theme === 'dark'
                      ? 'bg-space-800 border-2 border-gold-400 text-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'bg-paper-100/85 border-2 border-gold-500 text-gold-700 shadow-lg')
                    : (theme === 'dark'
                      ? 'bg-space-800 border border-space-600 text-star-500'
                      : 'bg-paper-100 border border-paper-300 text-paper-400')
                }
              `}>
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}

                {/* 当前步骤的脉冲动画 */}
                {isCurrent && (
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${theme === 'dark' ? 'bg-gold-400' : 'bg-gold-500'}`} />
                )}
              </div>

              {/* 步骤标签 */}
              <span className={`
                text-[10px] font-medium uppercase tracking-wider text-center whitespace-nowrap
                transition-colors duration-300
                ${isCompleted
                  ? (theme === 'dark' ? 'text-gold-400' : 'text-gold-600')
                  : isCurrent
                    ? (theme === 'dark' ? 'text-gold-300 font-bold' : 'text-gold-700 font-bold')
                    : (theme === 'dark' ? 'text-star-500' : 'text-paper-400')
                }
              `}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSentenceBuilder = () => {
    if (step === 0) return null;
    return (
      <div className={`
        max-w-3xl mx-auto mb-12 p-8 rounded-3xl border text-center
        transition-all duration-300 backdrop-blur-sm
        ${theme === 'dark'
          ? 'bg-gradient-to-br from-space-900/80 via-space-900/60 to-space-800/40 border-gold-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
          : 'bg-gradient-to-br from-paper-50 via-white to-paper-100 border-paper-300 shadow-lg'
        }
      `}>
        {/* 装饰性顶部光线 */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] ${theme === 'dark' ? 'bg-gradient-to-r from-transparent via-gold-400/50 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-500/30 to-transparent'}`} />

        <p className={`text-xl md:text-2xl font-serif leading-[36px] md:leading-[44px] ${theme === 'dark' ? 'text-star-100' : 'text-paper-800'}`}>
          <span className="opacity-60">{t.synthetica.blueprint.intro}</span>
          <span className={`
            inline-block px-2 py-0.5 mx-1 rounded-lg transition-all font-semibold
            ${theme === 'dark'
              ? 'text-purple-300 bg-purple-500/15 border border-purple-500/30'
              : 'text-purple-700 bg-purple-100 border border-purple-300'
            }
          `}>
            {getContextBlueprintLabel(selection.context)}
          </span>
          <span className="opacity-60">{t.synthetica.blueprint.when}</span>
          <span className={`
            inline-block px-2 py-0.5 mx-1 rounded-lg transition-all
            ${selection.planet
              ? (theme === 'dark'
                ? 'text-gold-300 bg-gold-500/15 border border-gold-500/30'
                : 'text-gold-700 bg-gold-100 border border-gold-300')
              : 'opacity-40 italic'
            }
          `}>
            {selection.planet ? getPlanetLabel(selection.planet.id) : "..."}
          </span>
          <span className="opacity-60">{t.synthetica.blueprint.clothed}</span>
          <span className={`
            inline-block px-2 py-0.5 mx-1 rounded-lg transition-all
            ${selection.sign
              ? (theme === 'dark'
                ? 'text-mystic-300 bg-mystic-500/15 border border-mystic-500/30'
                : 'text-mystic-700 bg-mystic-100 border border-mystic-300')
              : 'opacity-40 italic'
            }
          `}>
            {selection.sign ? getSignLabel(selection.sign.id) : "..."}
          </span>
          <span className="opacity-60">{t.synthetica.blueprint.clothing}</span>

          {selection.house && (
            <>
              <span className="opacity-60">{t.synthetica.blueprint.stage_intro}</span>
              <span className={`
                inline-block px-2 py-0.5 mx-1 rounded-lg
                ${theme === 'dark'
                  ? 'text-blue-300 bg-blue-500/15 border border-blue-500/30'
                  : 'text-blue-700 bg-blue-100 border border-blue-300'
                }
              `}>
                {getHouseLabel(selection.house.id)}
              </span>
              <span className="opacity-60">{t.synthetica.blueprint.stage_outro}</span>
            </>
          )}

          {selection.aspects.length > 0 ? (
            <span className={`block mt-3 text-base ${theme === 'dark' ? 'text-star-400' : 'text-paper-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1 -mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              {t.synthetica.blueprint.aspects_intro} <span className="inline-block font-semibold text-gold-400 text-xl md:text-2xl leading-none">{selection.aspects.length}</span> {t.synthetica.blueprint.aspects_count}
              <span className="opacity-60">{sentencePunctuation}</span>
            </span>
          ) : (
            <span className="opacity-60">{sentencePunctuation}</span>
          )}
        </p>

        {step === 4 && selection.planet && selection.sign && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={generateReport}
              disabled={loading}
              className={`
                relative overflow-hidden px-10 py-4 rounded-2xl
                font-bold text-lg tracking-wide
                transition-all duration-300 transform hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                cursor-pointer
                ${theme === 'dark'
                  ? 'bg-gradient-to-r from-gold-500 via-gold-400 to-mystic-500 text-space-950 shadow-[0_4px_20px_rgba(212,175,55,0.4)]'
                  : 'bg-gradient-to-r from-gold-500 to-gold-600 text-space-950 shadow-lg'
                }
              `}
            >
              {/* 光泽动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

              {loading ? (
                <span className="relative z-10 flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.synthetica.actions.generating}
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  {t.synthetica.actions.generate}
                </span>
              )}
            </button>
            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-star-400' : 'text-paper-500'}`}>
              {syntheticaQuotaText}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    // Show fullscreen loading when generating
    if (loading) {
      return (
        <OracleLoading
          variant="fullscreen"
          thinkingLabel={t.synthetica.loading.label}
          phrases={t.synthetica.loading.phrases}
        />
      );
    }

    if (step === 7 && result) {
      return <ReportView result={result.content} selection={selection} onReset={reset} />;
    }

    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        {/* 返回按钮 */}
        {step > 0 && (
          <div className="mb-6">
            <BackButton />
          </div>
        )}

        {renderBreadcrumbs()}

        <div className="mt-8">
          {renderSentenceBuilder()}

          <div className="animate-fade-in-up">
            {step === 0 && (
              <div className="space-y-6 pt-[50px]">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.context.title}
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {CONTEXTS.map(c => (
                    <SelectionCard
                      key={c.id}
                      label={getContextCardLabel(c.id)}
                      symbol={c.icon}
                      subLabel={getContextCardDescription(c.id)}
                      isSelected={selection.context === c.id}
                      onClick={() => handleSelection('context', c.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.planet.title}
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {PLANETS.map(p => {
                    // 使用TECH_DATA中的多彩颜色
                    const planetColors: Record<string, string> = {
                      'sun': 'text-[#FF6B6B]',
                      'moon': 'text-[#74B9FF]',
                      'mercury': 'text-[#FFEAA7]',
                      'venus': 'text-[#55EFC4]',
                      'mars': 'text-[#FF85C1]',
                      'jupiter': 'text-[#FF7675]',
                      'saturn': 'text-[#DFE6E9]',
                      'uranus': 'text-[#00CEC9]',
                      'neptune': 'text-[#74B9FF]',
                      'pluto': 'text-[#A29BFE]',
                    };
                    return (
                      <SelectionCard
                        key={p.id}
                        label={getPlanetLabel(p.id)}
                        symbol={p.symbol}
                        subLabel={getPlanetArchetype(p.id)}
                        isSelected={selection.planet?.id === p.id}
                        onClick={() => handleSelection('planet', p)}
                        colorClass={planetColors[p.id] || 'text-gold-400'}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.sign.title}
                  </h2>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {SIGNS.map(s => {
                    // 使用TECH_DATA中的元素颜色
                    const elementColors: Record<string, string> = {
                      'Fire': 'text-[#FF6B6B]',
                      'Earth': 'text-[#FFEAA7]',
                      'Air': 'text-[#00CEC9]',
                      'Water': 'text-[#74B9FF]',
                    };
                    return (
                      <SelectionCard
                        key={s.id}
                        label={getSignLabel(s.id)}
                        symbol={s.symbol}
                        isSelected={selection.sign?.id === s.id}
                        onClick={() => handleSelection('sign', s)}
                        colorClass={elementColors[s.element] || 'text-gold-400'}
                        compact
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.house.title}
                  </h2>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {HOUSES.map(h => (
                    <SelectionCard
                      key={h.id}
                      label={getHouseArchetype(h.id)}
                      symbol={h.number.toString()}
                      symbolPrefix={t.synthetica.house_symbol.prefix}
                      symbolSuffix={t.synthetica.house_symbol.suffix}
                      isSelected={selection.house?.id === h.id}
                      onClick={() => {
                        setSelection((prev: SyntheticaSelectionState) => ({ ...prev, house: h }));
                        setStep(4);
                      }}
                      colorClass="text-blue-400"
                      compact
                    />
                  ))}
                </div>
                <div className="text-center mt-6">
                  <button
                    onClick={() => setStep(4)}
                    className={`
                      px-6 py-2 text-sm font-medium cursor-pointer
                      transition-all duration-200
                      ${theme === 'dark'
                        ? 'text-star-400 hover:text-gold-400 underline underline-offset-4 decoration-star-600 hover:decoration-gold-500'
                        : 'text-paper-500 hover:text-gold-600 underline underline-offset-4'
                      }
                    `}
                  >
                    {t.synthetica.actions.skipHouse}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.aspect_dashboard.title}
                  </h2>
                </div>

                {/* Selected Aspects List */}
                <div className="grid gap-4 max-w-2xl mx-auto">
                   {selection.aspects.map((item: any, idx: number) => (
                      <div key={idx} className={`
                        flex items-center justify-between p-4 rounded-2xl border animate-fade-in
                        ${theme === 'dark'
                          ? 'bg-space-800/60 border-space-700 hover:border-gold-500/30'
                          : 'bg-paper-50 border-paper-300 hover:border-gold-400/50'
                        }
                      `}>
                         <div className="flex items-center space-x-4">
                            <span className={`text-2xl ${theme === 'dark' ? 'text-mystic-400' : 'text-mystic-600'}`}>
                              {item.planet.symbol}
                            </span>
                            <div>
                              <div className={`font-semibold ${theme === 'dark' ? 'text-star-100' : 'text-paper-900'}`}>
                                {getPlanetLabel(item.planet.id)}
                              </div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-star-400' : 'text-paper-400'}`}>
                                {getPlanetArchetype(item.planet.id)}
                              </div>
                            </div>
                            <span className={`mx-2 ${theme === 'dark' ? 'text-star-500' : 'text-paper-400'}`}>
                              {t.synthetica.prompts.aspect_dashboard.via}
                            </span>
                            <span className={`
                              px-3 py-1 rounded-lg text-sm font-medium
                              ${theme === 'dark'
                                ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
                                : 'bg-gold-100 text-gold-700 border border-gold-300'
                              }
                            `}>
                              {getAspectLabel(item.aspect.id)}
                            </span>
                         </div>
                         <button
                           onClick={() => removeAspect(idx)}
                           className={`
                             p-2 rounded-lg cursor-pointer transition-all duration-200
                             ${theme === 'dark'
                               ? 'text-star-500 hover:text-red-400 hover:bg-red-500/10'
                               : 'text-paper-400 hover:text-red-500 hover:bg-red-50'
                             }
                           `}
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                         </button>
                      </div>
                   ))}

                   {selection.aspects.length === 0 && (
                     <div className={`
                       text-center p-10 border-2 border-dashed rounded-2xl
                       ${theme === 'dark' ? 'border-space-700 text-star-500' : 'border-paper-300 text-paper-400'}
                     `}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                       </svg>
                       {t.synthetica.prompts.aspect_dashboard.empty}
                     </div>
                   )}

                   <button
                     onClick={() => setStep(5)}
                     className={`
                       w-full py-4 border-2 border-dashed rounded-2xl
                       font-medium cursor-pointer
                       transition-all duration-200 flex items-center justify-center gap-2
                       ${theme === 'dark'
                         ? 'border-space-600 text-star-300 hover:border-gold-500/50 hover:text-gold-300 hover:bg-gold-500/5'
                         : 'border-paper-300 text-paper-600 hover:border-gold-400/50 hover:text-gold-700 hover:bg-gold-50'
                       }
                     `}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                     </svg>
                     <span>{t.synthetica.actions.addAspect}</span>
                   </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.second_planet.title}
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {PLANETS.filter((p: any) => p.id !== selection.planet?.id && !selection.aspects.find((a: any) => a.planet.id === p.id)).map((p: any) => (
                    <SelectionCard
                      key={p.id}
                      label={getPlanetLabel(p.id)}
                      symbol={p.symbol}
                      subLabel={getPlanetArchetype(p.id)}
                      isSelected={tempSecondPlanet?.id === p.id}
                      onClick={() => {
                         setTempSecondPlanet(p);
                         setStep(6);
                      }}
                      colorClass="text-mystic-400"
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className={`text-lg md:text-xl font-serif mb-3 opacity-50 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                    {t.synthetica.prompts.aspect_type.title}
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {ASPECTS.map(a => (
                    <SelectionCard
                      key={a.id}
                      label={getAspectLabel(a.id)}
                      symbol={a.symbol}
                      subLabel={getAspectDescription(a.id)}
                      isSelected={false}
                      onClick={() => addAspect(a as unknown as SyntheticaAspect)}
                      colorClass={
                        a.angle === 90 || a.angle === 180 ? 'text-red-400' :
                        a.angle === 0 ? 'text-gold-400' : 'text-blue-400'
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-20">
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-center text-red-200 mb-8 max-w-2xl mx-auto">
          {error}
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default WikiSyntheticaPage;
