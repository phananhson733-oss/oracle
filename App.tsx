// INPUT: React、Router、组件与后端数据服务依赖（含卡片左侧阴影移除与星盘间距收紧）。
// OUTPUT: 导出主应用组件（含卡片左侧阴影清理与探索自我/今日运势/Ask 报告星盘间距优化）。
// POS: 主应用路由与页面编排中心。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Container, Card, Section, ActionButton, GlassInput, Chip, ScoreBar, Accordion, TimelineCard, CopyButton, ThemeContext, Theme, useTheme, Modal, DetailModal, SectionHeader, LanguageContext, LanguageProvider, useLanguage, translateAstroTerm } from './components/UIComponents';
import { ArrowLeft, X } from 'lucide-react';
import CBTMainPage from './components/cbt/CBTMainPage';
import WikiHubPage from './components/wiki/WikiHubPage';
import WikiDetailPage from './components/wiki/WikiDetailPage';
import { ElementalTable, AspectMatrix, PlanetTable, HouseRulerTable, CrossAspectMatrix, SynastryAspectMatrix } from './components/TechSpecsComponents';
import * as T from './types';
import { FOCUS_TAGS, PRESET_QUESTIONS, DIMENSIONS, RELATIONSHIP_TYPES, ASTRO_DICTIONARY, TRANSLATIONS, SYNASTRY_PROFILE_STORAGE_KEY, NATAL_CONFIG, SYNASTRY_CONFIG, COMPOSITE_CONFIG } from './constants';
import { AstroChart } from './components/AstroChart';
import { OracleLoading } from './components/OracleLoading';
import * as Astro from './services/astroService';
import { generateContent } from './services/geminiService';
import { fetchAskAnswer, fetchSynastry, fetchSynastryOverviewSection, fetchSynastrySuggestions, fetchSynastryTechnical, searchCities, fetchSectionDetail } from './services/apiClient';
import { AuthProvider } from './contexts/AuthContext';
import { LoginModal, UpgradeModal, UserMenu, PaymentSuccessPage } from './components/auth';
import { ReportsPage, ReportViewPage } from './components/reports';

const getDateInTimeZone = (timeZone?: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

// --- CONTEXTS ---

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('astro_theme') as Theme) || 'dark');
  useEffect(() => { 
    document.body.className = `${theme} ${theme === 'dark' ? 'bg-space-950 text-star-50' : 'bg-paper-100 text-paper-900'}`; 
    localStorage.setItem('astro_theme', theme); 
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

const useUserProfile = () => {
    const [user, setUser] = useState<T.UserProfile | null>(() => {
        const saved = localStorage.getItem('astro_user');
        return saved ? JSON.parse(saved) : null;
    });
    const saveUser = (u: T.UserProfile | null) => { 
      setUser(u); 
      if (u) localStorage.setItem('astro_user', JSON.stringify(u)); 
      else localStorage.removeItem('astro_user'); 
    };
    return { user, saveUser };
};

// --- SUB-COMPONENTS ---

const FrameworkDisclaimer: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const borderColor = theme === 'dark' ? 'border-space-600' : 'border-paper-300';
  const mutedText = theme === 'dark' ? 'text-star-400' : 'text-paper-400';

  return (
    <div className={`mb-8 p-4 rounded-lg border border-dashed ${borderColor} text-xs ${mutedText}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold uppercase tracking-widest">{t.common.methodology}</span>
        <span className="opacity-70">{t.common.method_desc}</span>
      </div>
      <p className="opacity-90 leading-relaxed">{t.common.disclaimer}</p>
    </div>
  );
};

// MiniLoader - 用于合盘tab内容加载状态
const MiniLoader: React.FC<{ label: string; error?: string | null }> = ({ label, error }) => {
  const { theme } = useTheme();
  if (error) {
    return (
      <div className={`text-center py-12 ${theme === 'dark' ? 'text-star-400' : 'text-paper-600'}`}>
        <div className="text-sm opacity-80">{error}</div>
      </div>
    );
  }
  return (
    <div className="text-center py-12">
      <div className="flex justify-center gap-1.5 mb-4">
        <div className="w-2 h-2 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
        <div className="w-2 h-2 rounded-full bg-star-200 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
      </div>
      <div className="text-sm font-medium text-gold-500 animate-pulse">{label}</div>
    </div>
  );
};

const DETAIL_LABEL_CLASS = "text-[10px] uppercase tracking-widest opacity-60";

// Weather/Mood Emoji Icon Component - render emojis directly for 7-day forecast
const WeatherMoodIcon: React.FC<{ emoji: string; className?: string }> = ({ emoji, className = "w-7 h-7 text-xl" }) => (
  <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
    {emoji}
  </span>
);

const QuickGlance: React.FC<{ data: T.NatalOverviewContent }> = ({ data }) => {
  const { t, tl } = useLanguage();
  const { theme } = useTheme();

  const big3Cards = [
    { key: 'sun', label: t.me.sun || '☉ Sun', subtitle: t.me.sun_sub || 'Core Identity', data: data?.sun, accent: 'border-l-red-500' },
    { key: 'moon', label: t.me.moon || '☽ Moon', subtitle: t.me.moon_sub || 'Inner World', data: data?.moon, accent: 'border-l-blue-500' },
    { key: 'rising', label: t.me.rising || '↑ Rising', subtitle: t.me.rising_sub || 'Outer Mask', data: data?.rising, accent: 'border-l-gold-500' },
  ];

  const moduleCards = [
    { title: t.me.melody, content: (<div className="space-y-2">{(data?.core_melody?.keywords || []).slice(0, 2).map((k, i) => (<div key={i} className="text-sm leading-relaxed"><span className="font-bold text-green-500 uppercase text-[10px] tracking-wider block mb-0.5">{k}</span><span className="opacity-80">{data?.core_melody?.explanations?.[i]}</span></div>))}</div>), accent: 'border-l-green-500' },
    { title: t.me.talent, content: (<><h4 className="font-serif font-medium mb-1">{data?.top_talent?.title}</h4><p className="text-sm opacity-80 leading-relaxed line-clamp-2">{data?.top_talent?.example}</p></>), accent: 'border-l-orange-500' },
    { title: t.me.pitfall, content: (<><h4 className="font-serif font-medium mb-1">{data?.top_pitfall?.title}</h4><p className="text-sm opacity-80 leading-relaxed">{(data?.top_pitfall?.triggers || []).slice(0, 2).join(' · ')}</p></>), accent: 'border-l-red-500' },
    { title: t.me.trigger, content: (<div className="text-sm leading-relaxed space-y-1"><div className="opacity-80">{data?.trigger_card?.inner_need}</div><div className="text-xs text-purple-500 font-medium">{data?.trigger_card?.buffer_action}</div></div>), accent: 'border-l-purple-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Big3 - Three prominent cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {big3Cards.map((card) => (
          <Card key={card.key} className={`border-l-2 ${card.accent} p-5`}>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-lg font-serif font-medium">{card.label}</span>
              <span className="text-[10px] uppercase tracking-widest opacity-40">{card.subtitle}</span>
            </div>
            <h3 className="text-xl font-serif font-medium text-gold-500 mb-2">{tl(card.data?.title || '')}</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(card.data?.keywords || []).map(k => (
                <span key={k} className="text-[10px] uppercase border border-current/20 px-2 py-0.5 rounded tracking-wide opacity-60">{k}</span>
              ))}
            </div>
            <p className="text-sm opacity-70 leading-relaxed">{card.data?.description}</p>
          </Card>
        ))}
      </div>

      {/* Four modules - 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleCards.map((c, i) => (
          <Card key={i} className={`border-l-2 ${c.accent} p-4`}>
            <div className="text-[10px] uppercase font-bold opacity-40 mb-2 tracking-widest">{c.title}</div>
            {c.content}
          </Card>
        ))}
      </div>
    </div>
  );
};

const DimensionContent: React.FC<{ dim: string, label: string, profile: T.UserProfile }> = ({ dim, label, profile }) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [data, setData] = useState<T.DimensionReportContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
        try {
          const res = await generateContent<T.DimensionReportContent>('DIMENSION_REPORT', { profile, dimension: dim }, language);
          if(mounted) { 
            setData(res); 
            setLoading(false); 
          }
        } catch (err) {
          if (mounted) setLoading(false);
        }
    };
    load();
    return () => { mounted = false; };
  }, [dim, label, language, profile]);

  if (loading) return <div className="p-4 opacity-50 animate-pulse text-xs uppercase tracking-widest">{t.common.loading} {label}...</div>;
  if (!data) return <div className="p-4 text-danger">{t.app.error}</div>;

  return (
      <div className="space-y-5">
          {/* Intro quote at top */}
          <div className="text-center pb-2">
             <div className="italic text-gold-500 text-sm leading-relaxed">"{data?.prompt_question}"</div>
          </div>

          {/* Main pattern narrative */}
          <div>
             <div className="text-sm text-blue-500 uppercase font-semibold mb-2 tracking-widest">{t.me.pattern}</div>
             <p className="text-sm leading-relaxed">{data?.pattern}</p>
          </div>

          {/* Root cause */}
          <div>
             <div className="text-sm text-purple-400 uppercase font-semibold mb-2 tracking-widest">{t.me.root}</div>
             <p className="text-sm leading-relaxed opacity-80">{data?.root}</p>
          </div>

          {/* Trigger & Support in simplified layout */}
          <div className="space-y-4">
             <div>
                <div className="text-sm text-orange-500 uppercase font-semibold mb-2 tracking-widest">{t.me.when_triggered}</div>
                <p className="text-sm leading-relaxed opacity-90">{data?.when_triggered}</p>
             </div>
             <div>
                <div className="text-sm text-green-500 uppercase font-semibold mb-2 tracking-widest">{t.me.what_helps}</div>
                <div className="flex flex-wrap gap-2">{(data?.what_helps || []).map((h,i) => <span key={i} className="text-sm px-3 py-1.5 rounded border border-green-500/30 bg-green-500/5">{h}</span>)}</div>
             </div>
          </div>

          {/* Practice path */}
          <div className="pl-4 border-l-2 border-purple-500/50">
             <div className="text-sm font-semibold uppercase mb-3 tracking-widest text-purple-500">{t.me.practice_path}</div>
             <ol className="list-decimal pl-4 text-sm space-y-2 opacity-90">{(data?.practice?.steps || []).map((s,i) => <li key={i} className="leading-relaxed">{s}</li>)}</ol>
          </div>
      </div>
  );
};

const CoreThemesContent: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
  const { language, t } = useLanguage();
  const [themes, setThemes] = useState<T.CoreThemesContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setError(null);
          setThemes(null);
        }
        const res = await generateContent<T.CoreThemesContent>('CORE_THEMES', { profile }, language);
        if (mounted) setThemes(res);
      } catch {
        if (mounted) setError(t.app.error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [profile, language]);

  if (loading) return <div className="text-center opacity-50 py-10">{t.common.loading}</div>;
  if (error || !themes) return <div className="text-center text-danger py-10">{error || t.app.error}</div>;

  const coreThemeCards = [
    {
      key: 'drive',
      label: t.me.drive_card,
      tone: {
        accent: 'text-gold-500',
        border: 'border-gold-500/30',
        accentBorder: 'border-l-gold-500/60',
        dot: 'bg-gold-500',
      },
      data: themes.drive,
    },
    {
      key: 'fear',
      label: t.me.fear_card,
      tone: {
        accent: 'text-danger',
        border: 'border-danger/30',
        accentBorder: 'border-l-danger/60',
        dot: 'bg-danger',
      },
      data: themes.fear,
    },
    {
      key: 'growth',
      label: t.me.growth_card,
      tone: {
        accent: 'text-success',
        border: 'border-success/30',
        accentBorder: 'border-l-success/60',
        dot: 'bg-success',
      },
      data: themes.growth,
    },
  ];

  return (
    <div className="space-y-6">
      {coreThemeCards.map((card) => (
        <Card key={card.key} className={`${card.tone.accentBorder}`}>
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-9 h-9 rounded-full border ${card.tone.border} flex items-center justify-center shrink-0`}>
              <span className={`w-2 h-2 rounded-full ${card.tone.dot} shrink-0`} />
            </div>
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${card.tone.accent}`}>
                {card.label}
              </div>
              <h3 className="text-lg font-serif">{card.data.title}</h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed opacity-80">{card.data.summary || ''}</p>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            {(card.data.key_points || []).map((point, index) => (
              <li key={index} className="flex gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${card.tone.dot} shrink-0`} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
};

const NatalTechCard: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { language, t, tl } = useLanguage();
    const { theme } = useTheme();
    const [data, setData] = useState<T.TechnicalAnalysisContent | null>(null);
    const [loading, setLoading] = useState(true);

    const [extendedData, setExtendedData] = useState<T.ExtendedNatalData | null>(null);

    // Detail modal state
    const [detailModal, setDetailModal] = useState<{
      isOpen: boolean;
      type: T.DetailType;
      title: string;
      loading: boolean;
      error: string | null;
      content: T.SectionDetailContent | null;
    }>({ isOpen: false, type: 'elements', title: '', loading: false, error: null, content: null });

    const handleDetailClick = async (type: T.DetailType, title: string, chartData: Record<string, unknown>) => {
      setDetailModal({ isOpen: true, type, title, loading: true, error: null, content: null });
      try {
        const res = await fetchSectionDetail({
          type,
          context: 'natal',
          chartData,
          lang: language,
        });
        setDetailModal(prev => ({ ...prev, loading: false, content: res.content }));
      } catch (err) {
        setDetailModal(prev => ({ ...prev, loading: false, error: t.detail.error_detail }));
      }
    };

    const handleRetry = () => {
      if (!extendedData) return;
      const chartDataMap: Record<T.DetailType, Record<string, unknown>> = {
        elements: { elements: extendedData.elements },
        aspects: { aspects: extendedData.aspects },
        planets: { planets: extendedData.planets },
        asteroids: { asteroids: extendedData.asteroids },
        rulers: { rulers: extendedData.houseRulers },
      };
      handleDetailClick(detailModal.type, detailModal.title, chartDataMap[detailModal.type]);
    };

    useEffect(() => {
        let mounted = true;
        const loadExtended = async () => {
          try {
            const data = await Astro.calculateExtendedNatalData(profile);
            if (mounted) setExtendedData(data);
          } catch {
            if (mounted) setExtendedData(null);
          }
        };
        loadExtended();
        return () => { mounted = false; };
    }, [profile]);

    useEffect(() => {
      let mounted = true;
      const load = async () => {
        try {
          const res = await generateContent<T.TechnicalAnalysisContent>('NATAL_TECHNICAL', { profile }, language);
          if (mounted) {
            setData(res);
            setLoading(false);
          }
        } catch (err) {
          if (mounted) setLoading(false);
        }
      };
      load();
      return () => { mounted = false; };
    }, [language, profile]);

    if (loading) return <div className="p-4 opacity-50 animate-pulse">{t.common.loading}</div>;
    if (!data || !extendedData) return <div className="p-4 text-danger">{t.app.error}</div>;

    return (
        <div className="space-y-10">
             {/* Section 1: Elemental Matrix */}
             <div>
                 <SectionHeader
                   title={t.me.tech_elements}
                   onDetailClick={() => handleDetailClick('elements', t.detail.modal_title_elements, { elements: extendedData.elements })}
                 />
                 <ElementalTable data={extendedData.elements} language={language} />
             </div>

             {/* Section 2: Aspects */}
             <div>
                 <SectionHeader
                   title={t.me.tech_aspects}
                   onDetailClick={() => handleDetailClick('aspects', t.detail.modal_title_aspects, { aspects: extendedData.aspects })}
                 />
                 <AspectMatrix aspects={extendedData.aspects} language={language} />
             </div>

             {/* Section 3: Planets */}
             <div>
                 <SectionHeader
                   title={t.me.tech_planets}
                   onDetailClick={() => handleDetailClick('planets', t.detail.modal_title_planets, { planets: extendedData.planets })}
                 />
                 <PlanetTable
                   planets={extendedData.planets}
                   language={language}
                   labels={{
                     body: t.me.table_body,
                     sign: t.me.table_sign,
                     house: t.me.table_house,
                     retro: t.me.table_retro,
                   }}
                 />
             </div>

             {/* Section 4: Asteroids */}
             <div>
                 <SectionHeader
                   title={t.me.tech_asteroids}
                   onDetailClick={() => handleDetailClick('asteroids', t.detail.modal_title_asteroids, { asteroids: extendedData.asteroids })}
                 />
                 <PlanetTable
                   planets={extendedData.asteroids}
                   language={language}
                   labels={{
                     body: t.me.table_body,
                     sign: t.me.table_sign,
                     house: t.me.table_house,
                     retro: t.me.table_retro,
                   }}
                 />
             </div>

             {/* Section 5: House Rulers */}
             <div>
                 <SectionHeader
                   title={t.me.tech_rulers}
                   onDetailClick={() => handleDetailClick('rulers', t.detail.modal_title_rulers, { rulers: extendedData.houseRulers })}
                 />
                 <HouseRulerTable
                   rulers={extendedData.houseRulers}
                   language={language}
                   labels={{
                     house: t.me.table_house,
                     sign: t.me.table_sign,
                     ruler: t.me.table_ruler,
                     flies_to: t.me.table_flies_to,
                   }}
                 />
             </div>

             {/* Detail Modal */}
             <DetailModal
               open={detailModal.isOpen}
               onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
               title={detailModal.title}
               loading={detailModal.loading}
               error={detailModal.error}
               content={detailModal.content}
               keyPointsLabel={t.detail.key_points}
               onRetry={handleRetry}
             />
        </div>
    );
};

// --- PAGES ---

const LandingPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleStart = async () => {
        navigate('/onboarding');
    };

    return (
        <Container className="flex items-center justify-center !pt-0 text-center relative overflow-hidden">
            <div className="max-w-md relative z-10 animate-fade-in">
                <div className="text-6xl md:text-8xl mb-8 mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 font-serif">☾</div>
                <h1 className="text-5xl md:text-6xl font-serif font-medium mb-6 leading-tight tracking-tight">{t.app.name}</h1>
                <p className="text-lg opacity-70 mb-10 leading-relaxed font-light px-4">{t.app.tagline}</p>
                
                <ActionButton onClick={handleStart} size="lg" className="mx-auto max-w-xs shadow-glow">
                    {t.app.landing_btn}
                </ActionButton>
                
                <p className="mt-8 text-xs opacity-40 font-mono tracking-widest uppercase">
                    Psychology × Astrology
                </p>
            </div>
        </Container>
    );
};

const OnboardingPage: React.FC<{ onComplete: (p: T.UserProfile) => void }> = ({ onComplete }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<T.UserProfile>>({ accuracyLevel: 'exact', focusTags: [], timezone: '' });
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<Array<{ city: string; country: string; lat: number; lon: number; timezone: string; admin1?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (cityQuery.length < 2) { setCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await searchCities(cityQuery, 5);
        setCitySuggestions(res.cities || []);
      } catch { setCitySuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);
  
  const headingClass = theme === 'dark' ? "text-star-50" : "text-paper-900";
  const labelClass = "text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block";

  return (
    <Container className="flex items-center justify-center !pt-0">
      <div className="w-full max-w-md">
        <div className="mb-8 flex gap-2 justify-center">
            {[1,2,3].map(i => <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-gold-500' : 'bg-space-600'}`} />)}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-serif font-medium mb-8 text-center ${headingClass}`}>{t.onboarding.step_birth}</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>{t.onboarding.label_date}</label>
                <GlassInput type="date" onChange={e => setData({...data, birthDate: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>{t.onboarding.label_time}</label>
                <GlassInput type="time" onChange={e => setData({...data, birthTime: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 pt-2 opacity-80 hover:opacity-100 transition-opacity">
                <input type="checkbox" className="accent-gold-500 w-4 h-4 rounded cursor-pointer" onChange={e => setData({...data, accuracyLevel: e.target.checked ? 'time_unknown' : 'exact'})}/>
                <label className="text-sm cursor-pointer">{t.onboarding.label_unknown}</label>
              </div>
            </div>
            <ActionButton className="mt-10 w-full max-w-xs mx-auto" onClick={() => setStep(2)} disabled={!data.birthDate}>{t.onboarding.btn_next}</ActionButton>
          </div>
        )}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-serif font-medium mb-8 text-center ${headingClass}`}>{t.onboarding.step_loc}</h2>
            <div className="mb-8 relative">
                <label className={labelClass}>{t.onboarding.label_city}</label>
                <GlassInput
                  placeholder={t.onboarding.placeholder_city}
                  value={cityQuery}
                  onChange={e => {
                    const nextValue = e.target.value;
                    setCityQuery(nextValue);
                    setShowSuggestions(true);
                    setData(prev => ({
                      ...prev,
                      birthCity: nextValue,
                      lat: undefined,
                      lon: undefined,
                      timezone: '',
                    }));
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && citySuggestions.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-space-600' : 'bg-white border-gray-200'} shadow-lg max-h-48 overflow-auto`}>
                    {citySuggestions.map((city, i) => (
                      <div
                        key={i}
                        className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-gray-100'}`}
                        onMouseDown={() => {
                          const label = city.country ? `${city.city}, ${city.country}` : city.city;
                          setCityQuery(label);
                          setData({ ...data, birthCity: label, lat: city.lat, lon: city.lon, timezone: city.timezone });
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="font-medium">{city.city}</div>
                        <div className="text-xs opacity-60">{city.country}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <ActionButton className="w-full max-w-xs mx-auto" onClick={() => setStep(3)} disabled={!cityQuery.trim()}>{t.onboarding.btn_next}</ActionButton>
          </div>
        )}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-serif font-medium mb-2 text-center ${headingClass}`}>
                {language === 'zh' ? '该如何称呼你?' : 'What should we call you?'}
            </h2>
            <p className="text-center opacity-60 mb-8 text-sm">
                {language === 'zh' ? '我们将为你生成专属的星盘报告。' : 'We will generate a personalized chart report for you.'}
            </p>
            <div className="mb-8">
                <label className={labelClass}>{language === 'zh' ? '你的名字' : 'Your Name'}</label>
                <GlassInput 
                    placeholder={language === 'zh' ? '例如：Alex' : 'e.g. Alex'} 
                    onChange={e => setData({...data, name: e.target.value})} 
                />
            </div>
            <ActionButton className="w-full max-w-xs mx-auto" onClick={() => onComplete(data as T.UserProfile)} disabled={!data.name}>{t.onboarding.btn_analyze}</ActionButton>
          </div>
        )}
      </div>
    </Container>
  );
};

const MePage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [overview, setOverview] = useState<T.NatalOverviewContent | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
              if (mounted) setLoading(true);
              const resA = await generateContent<T.NatalOverviewContent>('NATAL_OVERVIEW', { profile }, language);
              if (mounted) setOverview(resA);
            } catch (err) {
              console.error('MePage load error:', err);
            } finally {
              if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [profile, language]);

    if (loading && !overview) return <Container className="flex justify-center items-center h-screen"><div className="text-gold-500 font-serif animate-pulse text-xl">{t.app.loading}</div></Container>;
    
    return (
        <Container>
            <div className="flex justify-between items-end mb-12 border-b border-space-600 pb-6">
              <div>
                  <h1 className="text-4xl font-serif font-medium mb-2">{t.me.hero_title}</h1>
                  <p className="opacity-60 text-sm font-mono">{profile.birthDate} • {profile.birthCity}</p>
                  {profile.lat !== undefined && profile.lon !== undefined && (
                    <p className="opacity-40 text-xs font-mono mt-1">
                      {profile.lon.toFixed(4)}°{profile.lon >= 0 ? 'E' : 'W'}, {profile.lat.toFixed(4)}°{profile.lat >= 0 ? 'N' : 'S'} • {profile.timezone || 'UTC'}
                    </p>
                  )}
              </div>
              <div className="hidden md:block text-xs font-bold uppercase tracking-widest text-gold-500 border border-gold-500 px-3 py-1 rounded-full">
                  {profile.name || (language === 'zh' ? '用户' : 'User')}
              </div>
            </div>

            <Section title={t.me.chart_title} className="mb-6">
              <div className="mt-4 mb-1 flex justify-center">
                <div className="relative w-full">
                  <AstroChart
                    type="natal"
                    profile={profile}
                    scale={0.576}
                    compactSpacing
                    legendLabels={{
                      conjunction: t.me.aspect_conjunction,
                      opposition: t.me.aspect_opposition,
                      square: t.me.aspect_square,
                      trine: t.me.aspect_trine,
                      sextile: t.me.aspect_sextile,
                    }}
                    loadingLabel={t.common.loading}
                    errorLabel={t.app.error}
                  />
                </div>
              </div>
            </Section>

            <div>
              {overview && (
                <Section title={t.me.glance_title}>
                  <QuickGlance data={overview} />
                </Section>
              )}
              
              <Section title={t.me.deep_dive}>
                <div className="grid gap-4">
                  {DIMENSIONS.map(d => (
                      <Accordion key={d.key} title={language === 'zh' ? d.label_zh : d.label_en} subtitle={language === 'zh' ? d.source_zh : d.source_en}>
                      <DimensionContent dim={d.key} label={language === 'zh' ? d.label_zh : d.label_en} profile={profile} />
                      </Accordion>
                  ))}
                </div>
              </Section>
              
              <Section>
                <Accordion title={t.me.core_themes}>
                  <CoreThemesContent profile={profile} />
                </Accordion>
              </Section>
              
              <Section title={t.me.tech_specs}>
                <NatalTechCard profile={profile} />
              </Section>

              <FrameworkDisclaimer />
            </div>
        </Container>
    );
};

const DetailedScoreRow: React.FC<{ label: string, data: T.DailyEnergy, tone: { bg: string, border: string, text: string } }> = ({ label, data, tone }) => {
    const [isOpen, setIsOpen] = useState(true);
    const { t, language } = useLanguage();

    if (!data) return null;

    return (
        <div
            onClick={() => setIsOpen(!isOpen)}
            className="mb-4 last:mb-0 cursor-pointer group"
        >
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase tracking-widest text-current">{label}</span>
                    <span className={`text-sm transition-transform duration-200 ${isOpen ? `rotate-180 ${tone.text}` : 'opacity-40'}`}>▼</span>
                </div>
                <span className="text-sm font-mono opacity-60">{data.score}%</span>
            </div>

            <div className="h-1.5 w-full bg-space-600/30 rounded-full overflow-hidden mb-2">
                <div className={`h-full ${tone.bg} transition-all duration-1000 ease-out`} style={{ width: `${data.score}%` }} />
            </div>

            <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'}
            `}>
                <Card className={`${tone.border}`} noPadding>
                    <div className="p-4 text-base">
                        <div className="mb-2"><span className="font-bold opacity-60 uppercase mr-2 text-sm">{language === 'zh' ? '心理' : 'Psych'}</span> {data.feeling}</div>
                        <div className="mb-2"><span className="font-bold opacity-60 uppercase mr-2 text-sm">{t.today.scene}</span> {data.scenario}</div>
                        <div className={`font-medium ${tone.text}`}><span className="font-bold opacity-60 uppercase mr-2 text-sm text-current">{t.today.action}</span> {data.action}</div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const TodayPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language, tl } = useLanguage();
    const { theme } = useTheme();
    
    // Calculate current period based on user timezone
    const currentPeriod = useMemo(() => {
        const now = new Date();
        let hour = now.getHours();
        if (profile.timezone) {
            try {
                const parts = new Intl.DateTimeFormat('en-US', {
                    timeZone: profile.timezone,
                    hour: 'numeric',
                    hour12: false
                }).formatToParts(now);
                const hourPart = parts.find(p => p.type === 'hour');
                if (hourPart) hour = parseInt(hourPart.value, 10);
            } catch (e) {}
        }
        if (hour >= 5 && hour < 11) return 'morning';
        if (hour >= 11 && hour < 17) return 'midday';
        return 'evening';
    }, [profile.timezone]);

    const [publicData, setPublicData] = useState<T.DailyPublicContent | null>(null);
    const [detailData, setDetailData] = useState<T.DailyDetailContent | null>(null);
    const [viewDetail, setViewDetail] = useState(false);
    const [transitData, setTransitData] = useState<{ positions: T.PlanetPosition[]; aspects: T.Aspect[] } | null>(null);
    const [extendedNatal, setExtendedNatal] = useState<T.ExtendedNatalData | null>(null);
    const detailRetryTimer = React.useRef<number | null>(null);
    const detailFetching = React.useRef(false);

    // Detail modal state for transit data
    const [transitDetailModal, setTransitDetailModal] = useState<{
      isOpen: boolean;
      type: T.DetailType;
      title: string;
      loading: boolean;
      error: string | null;
      content: T.SectionDetailContent | null;
    }>({ isOpen: false, type: 'aspects', title: '', loading: false, error: null, content: null });

    const handleTransitDetailClick = async (type: T.DetailType, title: string, chartData: Record<string, unknown>) => {
      const date = getDateInTimeZone(profile.timezone);
      setTransitDetailModal({ isOpen: true, type, title, loading: true, error: null, content: null });
      try {
        const res = await fetchSectionDetail({
          type,
          context: 'transit',
          chartData,
          lang: language,
          transitDate: date,
        });
        setTransitDetailModal(prev => ({ ...prev, loading: false, content: res.content }));
      } catch (err) {
        setTransitDetailModal(prev => ({ ...prev, loading: false, error: t.detail.error_detail }));
      }
    };

    const handleTransitRetry = () => {
      if (!transitData || !extendedNatal) return;
      const MAJOR_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Descendant', 'Midheaven', 'IC'];
      const planets = transitData.positions.filter(p => MAJOR_PLANETS.includes(p.name));
      const asteroids = transitData.positions.filter(p => !MAJOR_PLANETS.includes(p.name));
      const chartDataMap: Record<T.DetailType, Record<string, unknown>> = {
        elements: {},
        aspects: { aspects: transitData.aspects },
        planets: { planets },
        asteroids: { asteroids },
        rulers: { rulers: extendedNatal.houseRulers },
      };
      handleTransitDetailClick(transitDetailModal.type, transitDetailModal.title, chartDataMap[transitDetailModal.type]);
    };

    // 加载行运数据
    useEffect(() => {
        let mounted = true;
        const loadTransit = async () => {
          try {
            const date = getDateInTimeZone(profile.timezone);
            const data = await Astro.calculateDailyTransits(date, profile);
            if (mounted && data) setTransitData(data);
          } catch {
            if (mounted) setTransitData(null);
          }
        };
        loadTransit();
        return () => { mounted = false; };
    }, [profile]);

    // 加载本命扩展数据（宫主星等）
    useEffect(() => {
        let mounted = true;
        const loadExtended = async () => {
          try {
            const data = await Astro.calculateExtendedNatalData(profile);
            if (mounted) setExtendedNatal(data);
          } catch {
            if (mounted) setExtendedNatal(null);
          }
        };
        loadExtended();
        return () => { mounted = false; };
    }, [profile]);

    useEffect(() => {
      let mounted = true;
      const load = async () => {
        try {
          const date = getDateInTimeZone(profile.timezone);
          const pData = await generateContent<T.DailyPublicContent>('DAILY_PUBLIC', { profile, date }, language);
          if (mounted) setPublicData(pData);
        } catch (err) {}
      };
      load();
      return () => { mounted = false; };
    }, [language, profile]);

    useEffect(() => {
      if (!viewDetail || detailData) return () => {};
      let cancelled = false;

      const fetchDetail = async () => {
        if (detailFetching.current || cancelled) return;
        detailFetching.current = true;
        try {
          const date = getDateInTimeZone(profile.timezone);
          const dData = await generateContent<T.DailyDetailContent>('DAILY_DETAIL', { profile, date }, language);
          if (!cancelled && dData) {
            setDetailData(dData);
            return;
          }
        } catch (err) {
        } finally {
          detailFetching.current = false;
        }
        if (!cancelled) {
          detailRetryTimer.current = window.setTimeout(fetchDetail, 4000);
        }
      };

      fetchDetail();

      return () => {
        cancelled = true;
        if (detailRetryTimer.current) {
          clearTimeout(detailRetryTimer.current);
          detailRetryTimer.current = null;
        }
      };
    }, [viewDetail, detailData, profile, language]);

    const loadDetail = () => {
      setViewDetail(true);
    };

    // 兼容新旧数据结构
    const energyData = publicData?.four_dimensions || publicData?.energy_profile;
    const focusData = publicData?.daily_focus;
    const strategyData = publicData?.strategy;

    if (!publicData) return <Container className="flex justify-center items-center h-screen"><div className="text-gold-500 font-serif animate-pulse">{t.app.loading}</div></Container>;

    // 获取 4D 维度配置
    const getDimensionConfig = () => {
      if (publicData?.four_dimensions) {
        return [
          { key: 'energy', label: t.today.energy, data: publicData.four_dimensions.energy, tone: { bg: 'bg-green-500', border: 'border-l-green-500', text: 'text-green-500' } },
          { key: 'tension', label: t.today.tension, data: publicData.four_dimensions.tension, tone: { bg: 'bg-red-500', border: 'border-l-red-500', text: 'text-red-500' } },
          { key: 'frictions', label: t.today.frictions, data: publicData.four_dimensions.frictions, tone: { bg: 'bg-orange-500', border: 'border-l-orange-500', text: 'text-orange-500' } },
          { key: 'pleasures', label: t.today.pleasures, data: publicData.four_dimensions.pleasures, tone: { bg: 'bg-gold-500', border: 'border-l-gold-500', text: 'text-gold-500' } },
        ];
      }
      // 兼容旧版
      return [
        { key: 'drive', label: t.today.drive, data: publicData?.energy_profile?.drive, tone: { bg: 'bg-green-500', border: 'border-l-green-500', text: 'text-green-500' } },
        { key: 'pressure', label: t.today.pressure, data: publicData?.energy_profile?.pressure, tone: { bg: 'bg-red-500', border: 'border-l-red-500', text: 'text-red-500' } },
        { key: 'heat', label: t.today.heat, data: publicData?.energy_profile?.heat, tone: { bg: 'bg-orange-500', border: 'border-l-orange-500', text: 'text-orange-500' } },
        { key: 'nourishment', label: t.today.nourishment, data: publicData?.energy_profile?.nourishment, tone: { bg: 'bg-gold-500', border: 'border-l-gold-500', text: 'text-gold-500' } },
      ];
    };

    const dimensionConfig = getDimensionConfig();

    return (
        <>
        <Container>
            <h1 className="text-4xl font-serif font-medium mb-2">{t.today.label}</h1>
            <p className="opacity-60 mb-10 font-mono text-sm">{publicData?.date}</p>

            {/* Today's Theme Card - v3.0 新入口区 */}
            <Card className="mb-12 border-l-2 border-l-gold-500 shadow-lg" noPadding>
              <div className="p-8 text-center border-b border-space-600/30">
                <div className="inline-block px-4 py-2 mb-4 rounded-lg border border-gold-500/30 bg-gold-500/5">
                  <h2 className="text-2xl font-serif font-medium text-gold-500">{publicData?.theme_title}</h2>
                </div>
                {publicData?.theme_explanation && (
                  <p className="text-base opacity-80 leading-relaxed max-w-6xl mx-auto">{publicData.theme_explanation}</p>
                )}
                {publicData?.anchor_quote && !publicData?.theme_explanation && (
                  <p className="text-lg font-serif italic opacity-80 mt-2 text-center">"{publicData.anchor_quote}"</p>
                )}
              </div>

              <div className="p-8">
                  {/* 4 Dimensions - Psychological Weather */}
                  <div className="mb-10">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        {dimensionConfig.map((dim) => (
                          dim.data && <DetailedScoreRow key={dim.key} label={dim.label} data={dim.data} tone={dim.tone} />
                        ))}
                    </div>
                  </div>

                  {/* Time Windows */}
                  <div className="mb-10">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['morning', 'midday', 'evening'].map((period) => {
                          const isSelected = period === currentPeriod;
                          const toneClass = isSelected
                            ? 'border-l-gold-500'
                            : theme === 'dark'
                              ? 'border-l-space-400/60'
                              : 'border-l-gold-500/30';
                          return (
                            <Card key={period} className={`${toneClass}`} noPadding>
                              <div className="p-4 text-center flex flex-col justify-center">
                                <span className={`block text-sm font-bold uppercase mb-2 ${isSelected ? 'text-gold-500' : 'opacity-60'}`}>
                                  {t.today[period as keyof typeof t.today]}
                                  {isSelected && <span className="ml-1">●</span>}
                                </span>
                                <p className="text-base leading-snug">{publicData?.time_windows?.[period as keyof typeof publicData.time_windows]}</p>
                              </div>
                            </Card>
                          );
                        })}
                     </div>
                  </div>

                  {/* Daily Focus (v3.0 三件套) or Strategy (兼容旧版) */}
                  {/* Daily Focus */}
                  <div className="grid md:grid-cols-2 gap-6">
                      <Card className="border-l-2 border-l-emerald-500" noPadding>
                          <div className="p-5">
                              <div className="text-sm font-bold text-emerald-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                                  <span>◎</span> {language === 'zh' ? '宜' : (focusData ? t.today.move_forward : t.today.best_use)}
                              </div>
                              <p className="text-base leading-relaxed">{focusData?.move_forward || strategyData?.best_use}</p>
                          </div>
                      </Card>
                      <Card className="border-l-2 border-l-red-500" noPadding>
                          <div className="p-5">
                              <div className="text-sm font-bold text-red-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                                  <span>✕</span> {language === 'zh' ? '忌' : (focusData ? t.today.communication_trap : t.today.avoid)}
                              </div>
                              <p className="text-base leading-relaxed">{focusData?.communication_trap || strategyData?.avoid}</p>
                          </div>
                      </Card>
                  </div>

              </div>
            </Card>

            {!viewDetail ? (
              <div className="text-center animate-fade-in">
                  <p className="text-sm opacity-60 mb-6 max-w-3xl mx-auto">
                      {language === 'zh' ? '想要了解这一切背后的深层心理机制和具体练习？' : 'Want to understand the deep psychology and specific practices behind this?'}
                  </p>
                  <ActionButton onClick={loadDetail} variant="secondary" className="mx-auto min-w-[240px] shadow-lg border-gold-500/30">
                      {t.today.detail_btn}
                  </ActionButton>
              </div>
            ) : (
              <div className="animate-fade-in space-y-8 pb-12">
                {detailData ? (
                  <>
                    <div className="max-w-6xl mx-auto text-center">
                        <h3 className="text-2xl font-serif mb-6">{t.today.theme_expanded}</h3>
                        <p className="text-lg leading-loose opacity-90 text-justify md:text-center">{detailData?.theme_elaborated}</p>
                    </div>

                    {/* Transit Chart - 行运星盘 */}
                    <Section title={t.today.transit_chart} className="!mb-0">
                      <div className="mt-4 flex justify-center">
                        <div className="relative w-full">
                          <AstroChart
                            type="transit"
                            profile={profile}
                            scale={0.576}
                            compactSpacing
                            legendLabels={{
                              conjunction: t.me.aspect_conjunction,
                              opposition: t.me.aspect_opposition,
                              square: t.me.aspect_square,
                              trine: t.me.aspect_trine,
                              sextile: t.me.aspect_sextile,
                            }}
                            loadingLabel={t.common.loading}
                            errorLabel={t.app.error}
                          />
                        </div>
                      </div>
                    </Section>

                    {/* Shifted container for personalization and subsequent modules */}
                    <div className="space-y-8">
                    {/* Personalization Section (v3.0) */}
                    {detailData?.personalization && (
                      <Card className="border-l-2 border-l-gold-500">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-4">{t.today.personalization}</h4>
                        <div className="space-y-4">
                          <div>
                            <span className="block text-sm font-bold uppercase text-purple-500 mb-1">{t.today.natal_trigger}</span>
                            <p className="text-base leading-relaxed">{detailData.personalization.natal_trigger}</p>
                          </div>
                          <div>
                            <span className="block text-sm font-bold uppercase text-blue-500 mb-1">{t.today.pattern_activated}</span>
                            <p className="text-base leading-relaxed">{detailData.personalization.pattern_activated}</p>
                          </div>
                          {detailData.personalization.why_today && (
                            <div className="p-3 rounded border border-l-2 border-l-gold-500/60">
                              <p className="text-base italic text-gold-500">{detailData.personalization.why_today}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    <div className="grid md:grid-cols-3 gap-6">
                        {['emotions', 'relationships', 'work'].map((k) => {
                            const colors = { emotions: 'border-l-blue-400', relationships: 'border-l-pink-400', work: 'border-l-orange-400' };
                            const textColors = { emotions: 'text-blue-400', relationships: 'text-pink-400', work: 'text-orange-400' };
                            return (
                            <Card key={k} className={`hover:border-gold-500/30 transition-colors border-l-2 ${colors[k as keyof typeof colors]}`}>
                                <span className={`block text-sm font-bold uppercase mb-3 tracking-widest ${textColors[k as keyof typeof textColors]}`}>{t.today[k as keyof typeof t.today]}</span>
                                <p className="text-base opacity-90 leading-relaxed">{detailData?.how_it_shows_up?.[k as keyof typeof detailData.how_it_shows_up]}</p>
                            </Card>
                        )})}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-l-2 border-l-red-500" noPadding>
                          <div className="p-8">
                            <h4 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-1">{t.today.pitfall}: {detailData?.one_challenge?.pattern_name}</h4>
                            <p className="text-base opacity-90 leading-relaxed">{detailData?.one_challenge?.description}</p>
                          </div>
                        </Card>
                        <Card className="border-l-2 border-l-emerald-500" noPadding>
                          <div className="p-8">
                            <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">{t.today.practice}: {detailData?.one_practice?.title}</h4>
                            <p
                              className="text-base opacity-90 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: (detailData?.one_practice?.action || '')
                                  .trim()
                                  .replace(/(\d+\.)/g, '<br/>$1')
                                  .replace(/^\s*<br\/>/, '')
                              }}
                            />
                          </div>
                        </Card>
                    </div>

                    <Card className="border-l-2 border-l-gold-500/60 text-center" noPadding>
                        <div className="p-10">
                          <div className="font-serif text-lg italic opacity-80 text-gold-500">"{detailData?.one_question}"</div>
                        </div>
                    </Card>

                    <Accordion title={t.today.tech}>
                        <div className="space-y-8">
                            {/* Transit Cross Aspect Matrix (行运-本命交叉相位) */}
                            {transitData?.aspects && transitData.aspects.length > 0 && (
                              <div>
                                <SectionHeader
                                  title={t.today.aspects_matrix}
                                  onDetailClick={() => handleTransitDetailClick('aspects', t.detail.modal_title_aspects, { aspects: transitData.aspects })}
                                />
                                <CrossAspectMatrix
                                  aspects={transitData.aspects}
                                  language={language}
                                  transitLabel={language === 'zh' ? '行运' : 'Transit'}
                                  natalLabel={language === 'zh' ? '本命' : 'Natal'}
                                />
                              </div>
                            )}

                            {/* Transit Planet Positions - Split into Planets and Asteroids */}
                            {transitData?.positions && transitData.positions.length > 0 && (() => {
                              const MAJOR_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Descendant', 'Midheaven', 'IC'];
                              const planets = transitData.positions.filter(p => MAJOR_PLANETS.includes(p.name));
                              const asteroids = transitData.positions.filter(p => !MAJOR_PLANETS.includes(p.name));
                              const tableLabels = { body: t.me.table_body, sign: t.me.table_sign, house: t.me.table_house, retro: t.me.table_retro };
                              return (
                                <div className="space-y-6">
                                  {planets.length > 0 && (
                                    <div>
                                      <SectionHeader
                                        title={language === 'zh' ? '行运行星' : 'Transit Planets'}
                                        onDetailClick={() => handleTransitDetailClick('planets', t.detail.modal_title_planets, { planets })}
                                      />
                                      <PlanetTable planets={planets} language={language} labels={tableLabels} />
                                    </div>
                                  )}
                                  {asteroids.length > 0 && (
                                    <div>
                                      <SectionHeader
                                        title={language === 'zh' ? '行运小行星' : 'Transit Asteroids'}
                                        onDetailClick={() => handleTransitDetailClick('asteroids', t.detail.modal_title_asteroids, { asteroids })}
                                      />
                                      <PlanetTable planets={asteroids} language={language} labels={tableLabels} />
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* House Rulers */}
                            {extendedNatal?.houseRulers && extendedNatal.houseRulers.length > 0 && (
                              <div>
                                <SectionHeader
                                  title={language === 'zh' ? '宫主星' : 'House Rulers'}
                                  onDetailClick={() => handleTransitDetailClick('rulers', t.detail.modal_title_rulers, { rulers: extendedNatal.houseRulers })}
                                />
                                <HouseRulerTable
                                  rulers={extendedNatal.houseRulers}
                                  language={language}
                                  labels={{
                                    house: t.me.table_house,
                                    sign: t.me.table_sign,
                                    ruler: t.me.table_ruler,
                                    flies_to: t.me.table_flies_to,
                                  }}
                                />
                              </div>
                            )}

                        </div>
                    </Accordion>
                  </div>
                  </>
                ) : (
                  <div className="text-center opacity-50 py-12 animate-pulse">{t.common.analyzing}</div>
                )}
              </div>
            )}
        </Container>

        {/* Transit Detail Modal - 放在 Container 外部确保全屏覆盖 */}
        <DetailModal
          open={transitDetailModal.isOpen}
          onClose={() => setTransitDetailModal(prev => ({ ...prev, isOpen: false }))}
          title={transitDetailModal.title}
          loading={transitDetailModal.loading}
          error={transitDetailModal.error}
          content={transitDetailModal.content}
          keyPointsLabel={t.detail.key_points}
          onRetry={handleTransitRetry}
        />
        </>
    );
};

const CyclesPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language } = useLanguage();
    const [cycles, setCycles] = useState<any[]>([]);
    const [namedCycles, setNamedCycles] = useState<Record<string, T.CycleCardContent>>({});
    
    useEffect(() => { 
      let mounted = true;
      const loadCycles = async () => {
        try {
          const base = await Astro.calculateCycles(3, profile);
          if (mounted) setCycles(base);
        } catch {}
      };
      loadCycles();
      return () => { mounted = false; };
    }, [profile]);

    const loadName = async (id: string, cycleInfo: any) => { 
      if (namedCycles[id]) return; 
      try {
        const res = await generateContent<T.CycleCardContent>('CYCLE_CARD_NAMING', { cycle: cycleInfo }, language); 
        if (res) setNamedCycles(prev => ({...prev, [id]: res})); 
      } catch (err) {}
    };

    return (
        <Container>
            <h1 className="text-4xl font-serif font-medium mb-2">{t.cycles.title}</h1>
            <p className="opacity-60 mb-10">{t.cycles.subtitle}</p>
            <div className="space-y-3">
              {cycles.map(c => { 
                const named = namedCycles[c.id]; 
                return (
                  <TimelineCard 
                    key={c.id} 
                    title={named?.title || `${c.planet} ${c.type}`} 
                    tags={named?.tags || [c.planet]} 
                    intensity={named?.intensity || 'med'} 
                    dates={{start: c.start, peak: c.peak, end: c.end}} 
                    onClick={() => loadName(c.id, c)} 
                  />
                ); 
              })}
            </div>
        </Container>
    );
};

const formatTemperamentElements = (value: unknown, language: T.Language): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const labelMap: Record<string, { zh: string; en: string }> = {
    fire: { zh: '火', en: 'Fire' },
    earth: { zh: '土', en: 'Earth' },
    air: { zh: '风', en: 'Air' },
    water: { zh: '水', en: 'Water' },
  };
  const entries = Object.entries(value as Record<string, number>);
  if (entries.length === 0) return '';
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([key]) => {
      const normalized = key.toLowerCase();
      return labelMap[normalized]?.[language] || key;
    })
    .join(' · ');
};

const formatTemperamentModalities = (value: unknown, language: T.Language): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const labelMap: Record<string, { zh: string; en: string }> = {
    cardinal: { zh: '本位', en: 'Cardinal' },
    fixed: { zh: '固定', en: 'Fixed' },
    mutable: { zh: '变动', en: 'Mutable' },
  };
  const entries = Object.entries(value as Record<string, number>);
  if (entries.length === 0) return '';
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([key]) => {
      const normalized = key.toLowerCase();
      return labelMap[normalized]?.[language] || key;
    })
    .join(' · ');
};

const NatalScriptCard: React.FC<{ title: string, script: T.NatalScript, colorClass: string }> = ({ title, script, colorClass }) => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  // Badge styling for elements/modalities
  const badgeClass = theme === 'dark'
    ? 'inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-full border border-space-600/50 bg-space-800/60 text-star-200 backdrop-blur-sm'
    : 'inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-full border border-paper-300/60 bg-paper-50/80 text-paper-700';

  // Check if using new v4 structure or legacy
  const isV4 = Boolean(script.vibe_check);

  // Fallback for legacy data
  if (!isV4 && script.temperament) {
    const elementLabel = formatTemperamentElements(script.temperament.elements, language);
    const modalityLabel = formatTemperamentModalities(script.temperament.modalities, language);
    const elementTitle = language === 'zh' ? '元素分析（整体画像）' : 'Element Profile (Overall Portrait)';
    const coreTitle = language === 'zh' ? '核心三角（太阳/月亮/上升的解读）' : 'Core Triangle (Sun / Moon / Rising)';
    const relationshipConfigTitle = language === 'zh' ? '关系配置' : t.us.script_relationship_wiring;
    const relationshipScriptTitle = language === 'zh' ? '关系脚本' : t.us.script_relationship_script;

    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h3 className="font-serif text-2xl font-medium">{title}</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[260px]">
            {elementLabel && <span className={`${badgeClass} opacity-80 w-full text-center`}>{elementLabel}</span>}
            {modalityLabel && <span className={`${badgeClass} opacity-80 w-full text-center`}>{modalityLabel}</span>}
          </div>
        </div>

        <Section title={elementTitle} className="mb-8">
          <div className="space-y-4">
            <Card className={`border-l-2 ${colorClass}`}>
              <div className={`${DETAIL_LABEL_CLASS} mb-2`}>{t.us.script_portrait}</div>
              <p className="text-sm leading-relaxed opacity-90">{script.temperament.portrait}</p>
            </Card>
            <Card className="border-l-2 border-l-success/60">
              <div className={`${DETAIL_LABEL_CLASS} text-success mb-2`}>{t.us.script_safety_source}</div>
              <p className="text-sm opacity-90">{script.temperament.safety_source}</p>
            </Card>
          </div>
        </Section>

        <Section title={coreTitle} className="mb-8">
          <div className="space-y-4">
            <Card className="border-l-2 border-l-gold-500/60">
              <div className="text-xs font-bold uppercase text-gold-500 mb-2">{t.us.script_sun_self}</div>
              <p className="text-sm leading-snug opacity-85">{script.core_triangle?.sun}</p>
            </Card>
            <Card className="border-l-2 border-l-star-200/70">
              <div className="text-xs font-bold uppercase text-star-200 mb-2">{t.us.script_moon_needs}</div>
              <p className="text-sm leading-snug opacity-85">{script.core_triangle?.moon}</p>
            </Card>
            <Card className="border-l-2 border-l-star-400/70">
              <div className="text-xs font-bold uppercase text-star-400 mb-2">{t.us.script_rising_mask}</div>
              <p className="text-sm leading-snug opacity-85">{script.core_triangle?.rising}</p>
            </Card>
            <Card className="border-l-2 border-l-gold-500/70">
              <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.script_core_summary}</div>
              <p className="text-sm leading-relaxed opacity-90">"{script.core_triangle?.summary}"</p>
            </Card>
          </div>
        </Section>

        <Section title={relationshipConfigTitle} className="mb-8">
          <div className="space-y-4">
            <Card className="border-l-2 border-l-star-200/70">
              <div className="text-xs font-bold uppercase text-star-200 mb-3">{t.us.script_planets_love_action}</div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold opacity-60 block text-xs uppercase">{t.us.script_venus_love}</span>
                  {script.configurations?.venus}
                </div>
                <div>
                  <span className="font-bold opacity-60 block text-xs uppercase">{t.us.script_mars_drive}</span>
                  {script.configurations?.mars}
                </div>
                <div>
                  <span className="font-bold opacity-60 block text-xs uppercase">{t.us.script_mercury_comm}</span>
                  {script.configurations?.mercury}
                </div>
              </div>
            </Card>
            <Card className="border-l-2 border-l-accent/70">
              <div className="text-xs font-bold uppercase text-accent mb-3">{t.us.script_houses_arenas}</div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold opacity-60 block text-xs uppercase">{t.us.script_h5_romance}</span>
                  {script.configurations?.houses?.h5}
                </div>
                <div>
                  <span className="font-bold opacity-60 block text-xs uppercase">{t.us.script_h7_partner}</span>
                  {script.configurations?.houses?.h7}
                </div>
                <div>
                  <span className="font-bold opacity-60 block text-xs uppercase">{t.us.script_h8_intimacy}</span>
                  {script.configurations?.houses?.h8}
                </div>
              </div>
            </Card>
            <Card className="border-l-2 border-l-danger/60">
              <div className={`${DETAIL_LABEL_CLASS} text-danger mb-2`}>{t.us.script_karmic_challenges}</div>
              <p className="text-sm opacity-90">{script.configurations?.challenges}</p>
            </Card>
          </div>
        </Section>

        <Section title={relationshipScriptTitle} className="mb-0">
          <Card className="border-l-2 border-l-gold-500/70">
            <div className="space-y-4 text-sm">
              <div>
                <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.script_habitual_style}</span>
                <p className="opacity-90">{script.key_script?.love_style}</p>
              </div>
              <div>
                <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.script_the_loop}</span>
                <p className="opacity-90">{script.key_script?.pattern}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-danger mb-1">{t.us.script_conflict_role}</span>
                <p className="opacity-80">{script.key_script?.conflict_role}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-success mb-1">{t.us.script_repair_key}</span>
                <p className="opacity-80">{script.key_script?.repair_method}</p>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    );
  }

  // ============ NEW V4 RELATIONSHIP BLUEPRINT LAYOUT ============
  const { vibe_check, inner_architecture, love_toolkit, deep_script, user_profile } = script;

  return (
    <div className="space-y-10">
      {/* Header with Profile Card */}
      <div className="relative">
        {/* Archetype Hero Card */}
        <Card className={`relative overflow-hidden ${colorClass}`}>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Left: Name + Archetype */}
              <div className="flex-1">
                <h3 className="font-serif text-3xl font-semibold tracking-tight mb-2">{title}</h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-gold-500/15 border border-gold-500/30' : 'bg-gold-500/10 border border-gold-500/20'}`}>
                  <span className="text-gold-500 text-lg">✦</span>
                  <span className="font-bold text-gold-500 tracking-wide">{user_profile?.archetype || t.us.user_profile_archetype}</span>
                </div>
                {user_profile?.tagline && (
                  <p className={`mt-4 text-lg font-serif italic ${theme === 'dark' ? 'text-star-200/90' : 'text-paper-700'}`}>"{user_profile.tagline}"</p>
                )}
              </div>
              {/* Right: Quick Badges */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 md:min-w-[260px]">
                {vibe_check?.elements_badge && <span className={`${badgeClass} w-full text-center`}>{vibe_check.elements_badge}</span>}
                {vibe_check?.modalities_badge && <span className={`${badgeClass} w-full text-center`}>{vibe_check.modalities_badge}</span>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Section 1: The Vibe Check */}
      <Section title={t.us.vibe_check_title} className="mb-8">
        <Card className="border-l-2 border-l-gold-500/60">
          <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-3`}>{t.us.vibe_energy_profile}</div>
          <p className="text-sm leading-relaxed opacity-90">{vibe_check?.energy_profile}</p>
        </Card>
      </Section>

      {/* Section 2: The Inner Architecture */}
      <Section title={t.us.inner_architecture_title} className="mb-8">
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l-2 border-l-gold-500/70">
              <div className="text-xs font-bold uppercase text-gold-500 mb-2">{t.us.inner_sun}</div>
              <p className="text-sm leading-relaxed opacity-85">{inner_architecture?.sun}</p>
            </Card>
            <Card className="border-l-2 border-l-star-200/70">
              <div className="text-xs font-bold uppercase text-star-200 mb-2">{t.us.inner_moon}</div>
              <p className="text-sm leading-relaxed opacity-85">{inner_architecture?.moon}</p>
            </Card>
            <Card className="border-l-2 border-l-accent/70">
              <div className="text-xs font-bold uppercase text-accent mb-2">{t.us.inner_rising}</div>
              <p className="text-sm leading-relaxed opacity-85">{inner_architecture?.rising}</p>
            </Card>
          </div>
          {inner_architecture?.attachment_style && (
            <Card className="border-l-2 border-l-star-400/60">
              <div className="text-xs font-bold uppercase text-star-400 mb-2">{t.us.inner_attachment}</div>
              <p className="text-sm leading-relaxed opacity-90">{inner_architecture.attachment_style}</p>
            </Card>
          )}
          <Card className="border-l-2 border-l-gold-500/50">
            <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.inner_summary}</div>
            <p className="text-sm leading-relaxed opacity-90 font-serif italic">"{inner_architecture?.summary}"</p>
          </Card>
        </div>
      </Section>

      {/* Section 3: The Love Toolkit */}
      <Section title={t.us.love_toolkit_title} className="mb-8">
        <div className="space-y-4">
          <Card className="border-l-2 border-l-pink-500">
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-pink-500 block mb-1">{t.us.love_venus}</span>
                <p className="opacity-90 leading-relaxed">{love_toolkit?.venus}</p>
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-orange-500 block mb-1">{t.us.love_mars}</span>
                <p className="opacity-90 leading-relaxed">{love_toolkit?.mars}</p>
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-blue-400 block mb-1">{t.us.love_mercury}</span>
                <p className="opacity-90 leading-relaxed">{love_toolkit?.mercury}</p>
              </div>
            </div>
          </Card>
          {love_toolkit?.love_language_primary && (
            <Card className="border-l-2 border-l-pink-500">
              <div className="text-xs font-bold uppercase text-pink-500 mb-2">{t.us.love_language}</div>
              <p className="text-sm leading-relaxed opacity-90">{love_toolkit.love_language_primary}</p>
            </Card>
          )}
        </div>
      </Section>

      {/* Section 4: The Deep Script */}
      <Section title={t.us.deep_script_title} className="mb-8">
        <div className="space-y-4">
          <Card className="border-l-2 border-l-purple-500">
            <div className="text-xs font-bold uppercase text-purple-500 mb-2">{t.us.deep_seventh_house}</div>
            <p className="text-sm leading-relaxed opacity-85">{deep_script?.seventh_house}</p>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l-2 border-l-purple-500">
              <div className="text-xs font-bold uppercase text-purple-500 mb-2">{t.us.deep_saturn}</div>
              <p className="text-sm leading-relaxed opacity-85">{deep_script?.saturn}</p>
            </Card>
            <Card className="border-l-2 border-l-red-500">
              <div className="text-xs font-bold uppercase text-red-500 mb-2">{t.us.deep_chiron}</div>
              <p className="text-sm leading-relaxed opacity-85">{deep_script?.chiron}</p>
            </Card>
          </div>
          {deep_script?.shadow_pattern && (
            <Card className="border-l-2 border-l-red-500">
              <div className="text-xs font-bold uppercase text-red-500 mb-2">{t.us.deep_shadow}</div>
              <p className="text-sm leading-relaxed opacity-90">{deep_script.shadow_pattern}</p>
            </Card>
          )}
        </div>
      </Section>

      {/* Section 5: Profile Summary */}
      <Section title={t.us.user_profile_title} className="mb-0">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-l-2 border-l-green-500">
            <h4 className="text-xs font-bold uppercase text-green-500 mb-4 tracking-widest">{t.us.user_profile_strengths}</h4>
            <ul className="space-y-2">
              {(user_profile?.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="opacity-90">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-l-2 border-l-purple-500">
            <h4 className="text-xs font-bold uppercase text-purple-500 mb-4 tracking-widest">{t.us.user_profile_growth}</h4>
            <ul className="space-y-2">
              {(user_profile?.growth_edges || []).map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-500 mt-0.5">→</span>
                  <span className="opacity-90">{g}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        {user_profile?.ideal_complement && (
          <Card className="mt-4 border-l-2 border-l-blue-500">
            <div className="text-xs font-bold uppercase text-blue-500 mb-2">{t.us.user_profile_ideal}</div>
            <p className="text-sm leading-relaxed opacity-90 font-serif">{user_profile.ideal_complement}</p>
          </Card>
        )}
      </Section>
    </div>
  );
};

const PerspectiveCard: React.FC<{
    data: T.PerspectiveData,
    perspective: 'a_view' | 'b_view',
    selfName: string,
    otherName: string
}> = ({ data, perspective, selfName, otherName }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    // Check if using new v4 structure or legacy
    const isV4 = Boolean(data.vibe_alchemy);

    // Intensity badge component with Flow/Friction/Fusion styling
    const IntensityBadge: React.FC<{ intensity: T.IntensityLevel }> = ({ intensity }) => {
        const config = {
            flow: { color: 'text-success', bg: 'bg-success/15', border: 'border-success/40', label: t.us.intensity_flow, icon: '◎' },
            friction: { color: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/40', label: t.us.intensity_friction, icon: '⚡' },
            fusion: { color: 'text-gold-500', bg: 'bg-gold-500/15', border: 'border-gold-500/40', label: t.us.intensity_fusion, icon: '✦' },
        }[intensity] || { color: 'text-star-200', bg: 'bg-star-200/15', border: 'border-star-200/40', label: intensity, icon: '○' };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.color}`}>
                <span>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    // Dynamic card with intensity meter
    const DynamicCard: React.FC<{
        item: T.DynamicItem;
        title: string;
        subtitle: string;
        icon: string;
        borderColor: string;
    }> = ({ item, title, subtitle, icon, borderColor }) => (
        <Card className={`border-l-2 ${borderColor} relative overflow-hidden`}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <div className="font-semibold">{title}</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60">{subtitle}</div>
                    </div>
                </div>
                <IntensityBadge intensity={item.intensity} />
            </div>
            <div className="space-y-4">
                <div>
                    <div className="font-medium text-sm mb-1">{item.headline}</div>
                    <p className="text-sm leading-relaxed opacity-85">{item.description}</p>
                </div>
                {item.talk_script && (
                    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-space-900/60' : 'bg-paper-100'} border border-dashed ${theme === 'dark' ? 'border-space-600' : 'border-paper-300'}`}>
                        <div className="text-[10px] uppercase tracking-widest text-gold-500 mb-2 font-bold">{t.us.dynamics_talk_to}</div>
                        <p className="text-sm font-serif italic opacity-90">"{item.talk_script}"</p>
                    </div>
                )}
            </div>
        </Card>
    );

    // Landscape zone card
    const LandscapeZoneCard: React.FC<{
        zone: T.LandscapeZone;
        title: string;
        houseLabel: string;
        borderClass: string;
        iconClass: string;
        icon: string;
    }> = ({ zone, title, houseLabel, borderClass, iconClass, icon }) => (
        <Card className={`${borderClass} relative overflow-hidden`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${iconClass}`}>{icon}</div>
                <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60">{houseLabel}</div>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <div className="text-[10px] uppercase tracking-widest opacity-50">{zone.houses}</div>
                <div>
                    <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.landscape_feeling}</span>
                    <p className="opacity-90">{zone.feeling}</p>
                </div>
                <div>
                    <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.landscape_meaning}</span>
                    <p className="opacity-85">{zone.meaning}</p>
                </div>
            </div>
        </Card>
    );

    // ============ LEGACY V3 LAYOUT ============
    if (!isV4 && data.sensitivity_panel) {
        const bubbleBase = "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm";
        const bubbleNeutral = theme === 'dark' ? 'bg-[#F6F0E6] text-space-900' : 'bg-[#FAF6EF] text-paper-900';
        const bubbleGreen = theme === 'dark' ? 'bg-[#7BD870] text-space-950' : 'bg-[#95EC69] text-space-950';
        const bubbleBorder = theme === 'dark' ? 'border-space-600' : 'border-paper-300';

        const SensCard = ({ icon, label, p }: { icon: string, label: string, p: T.SensitivityPoint }) => (
            <Card className="border-l-2 border-l-gold-500/40">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{icon}</span>
                    <div className="text-sm font-bold uppercase tracking-wider text-gold-500">{label}</div>
                </div>
                <div className="space-y-3">
                    <div>
                        <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.perspective_reaction}</span>
                        <p className="text-sm leading-relaxed">{p.mode}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                        <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.perspective_deep_fear}</span>
                        <p className="text-sm leading-relaxed">{p.fear}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-success/10' : 'bg-success/5'}`}>
                        <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>{t.us.perspective_hidden_need}</span>
                        <p className="text-sm leading-relaxed">{p.need}</p>
                    </div>
                </div>
            </Card>
        );

        return (
            <div className="space-y-8">
                <Section title={t.us.keywords} className="mb-8">
                    <Card className="border-l-2 border-l-gold-500/50">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(data.keywords || []).map((k,i) => <Chip key={i} label={k} />)}
                        </div>
                        <p className="text-sm leading-relaxed opacity-90">{data.summary}</p>
                    </Card>
                </Section>

                <Section title={t.us.perspective_sensitivity} className="mb-8">
                    <div className="space-y-4">
                        <SensCard icon="🌙" label={t.us.perspective_moon} p={data.sensitivity_panel.moon} />
                        <SensCard icon="♀" label={t.us.perspective_venus} p={data.sensitivity_panel.venus} />
                        <SensCard icon="♂" label={t.us.perspective_mars} p={data.sensitivity_panel.mars} />
                        <SensCard icon="☿" label={t.us.perspective_mercury} p={data.sensitivity_panel.mercury} />
                        <SensCard icon="🔮" label={t.us.perspective_deep} p={data.sensitivity_panel.deep} />
                    </div>
                </Section>

                <Section title={t.us.interaction_points} className="mb-8">
                    <div className="space-y-4">
                        {(data.main_items || []).map((item, i) => (
                            <Card key={i} className="border-l-2 border-l-gold-500/50">
                                <div className="mb-4">
                                    <div className={`${DETAIL_LABEL_CLASS} flex flex-wrap gap-2 mb-2`}>
                                        <span className="border border-current px-2 py-0.5 rounded-full">{item.evidence}</span>
                                        <span>{item.stage}</span>
                                    </div>
                                    <h5 className="text-lg font-semibold">{item.subjective}</h5>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className={`p-3 rounded-lg border border-danger/30 border-l-2 border-l-danger/60 ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.perspective_reaction}</span>
                                        <p className="opacity-90">{item.reaction}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg border border-accent/30 border-l-2 border-l-accent/60 ${theme === 'dark' ? 'bg-accent/10' : 'bg-accent/5'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-accent block mb-1`}>{t.us.perspective_hidden_need}</span>
                                        <p className="opacity-90">{item.need}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg border border-gold-500/30 border-l-2 border-l-gold-500/60 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-gold-500 block mb-1`}>{t.us.perspective_advice}</span>
                                        <p className="opacity-90">{item.advice}</p>
                                        <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs opacity-70">
                                            <span>{item.script}</span>
                                            <CopyButton text={item.script} label={t.us.copy_script} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>

                <Section title={t.us.house_overlays} className="mb-8">
                    <div className="space-y-4">
                        {(data.overlays || []).map((o, i) => (
                            <Card key={i} className="border-l-2 border-l-accent/40">
                                <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{o.title}</div>
                                <p className="text-sm mb-3 opacity-90">{o.feeling}</p>
                                <div className="text-sm opacity-70">
                                    <span className={`${DETAIL_LABEL_CLASS} mr-2`}>{t.us.perspective_note}</span>{o.advice}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>

                {data.closing && (
                    <Section title={t.us.conclusion}>
                        <div className="space-y-8">
                            <div>
                                <h4 className={`${DETAIL_LABEL_CLASS} text-success mb-4`}>{t.us.nourish_points}</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {data.closing.nourishing.map((n, i) => (
                                        <Card key={i} className="border-l-2 border-l-success/60">
                                            <div className="text-sm font-semibold mb-1">{n.mechanism}</div>
                                            <div className="text-sm opacity-80 mb-2">{n.experience}</div>
                                            <div className="text-sm opacity-70">
                                                <span className={`${DETAIL_LABEL_CLASS} mr-2`}>{t.us.perspective_try}</span>{n.usage}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className={`${DETAIL_LABEL_CLASS} text-danger mb-4`}>{t.us.trigger_points}</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {data.closing.triggers.map((tr, i) => (
                                        <Card key={i} className="border-l-2 border-l-danger/60">
                                            <div className="text-sm font-semibold mb-1">{tr.trigger}</div>
                                            <div className="text-sm opacity-80 mb-2">"{tr.scene}" → {tr.reaction}</div>
                                            <div className="text-sm opacity-70">
                                                <span className={`${DETAIL_LABEL_CLASS} mr-2`}>{t.us.perspective_fix}</span>{tr.mitigation}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className={`rounded-2xl border ${bubbleBorder} p-6 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-white'}`}>
                                <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-4 text-center`}>{t.us.cycle_diagram}</div>
                                <div className="space-y-3">
                                    <div className="flex justify-start">
                                        <div className={`${bubbleBase} ${bubbleNeutral}`}>
                                            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{otherName} · {t.us.perspective_trigger}</div>
                                            {data.closing.cycle.trigger}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className={`${bubbleBase} ${bubbleGreen}`}>
                                            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{selfName} · {t.us.perspective_reaction}</div>
                                            {data.closing.cycle.reaction_self}
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className={`${bubbleBase} ${bubbleNeutral}`}>
                                            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{otherName} · {t.us.perspective_reaction}</div>
                                            {data.closing.cycle.reaction_partner}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className={`${bubbleBase} ${bubbleGreen}`}>
                                            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{selfName} · {t.us.perspective_escalation}</div>
                                            {data.closing.cycle.escalation}
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-6 pt-4 border-t border-dashed ${theme === 'dark' ? 'border-space-600' : 'border-paper-300'}`}>
                                    <div className="text-center mb-4">
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success uppercase tracking-widest">
                                            {t.us.perspective_repair_window}: {data.closing.cycle.repair_window}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {data.closing.cycle.scripts.map((s, i) => (
                                            <div key={i} className={`flex flex-wrap items-center justify-between gap-3 border-l-2 border-l-success/60 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-space-900/50' : 'bg-paper-100'}`}>
                                                <p className="text-sm opacity-90">"{s}"</p>
                                                <CopyButton text={s} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        );
    }

    // ============ NEW V4 CHEMISTRY LAB LAYOUT ============
    const { vibe_alchemy, landscape, dynamics, deep_dive, relationship_avatar } = data;

    return (
        <div className="space-y-10">
            {/* Hero: Relationship Avatar Card */}
        <Card className="relative overflow-hidden border-l-2 border-l-blue-500">
            <div className="relative z-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                        <div className="text-sm font-semibold uppercase tracking-widest opacity-70 mb-2">
                            {selfName} × {otherName}
                        </div>
                        <div className="p-4 rounded-xl border border-l-2 border-l-blue-500/60">
                            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{t.us.avatar_title}</div>
                            <div className="font-serif text-2xl text-blue-500">{relationship_avatar?.title || t.us.avatar_title}</div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{t.us.avatar_subtitle}</div>
                        {relationship_avatar?.summary && (
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-star-200/90' : 'text-paper-700'}`}>
                                {relationship_avatar.summary}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>

            {/* Section 1: The Vibe & Alchemy */}
            <Section title={t.us.vibe_alchemy_title} className="mb-8">
                <div className="space-y-4">
                    {/* Elemental Mix Hero */}
                    <Card className="border-l-2 border-l-green-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                                🔥
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">{t.us.vibe_elemental_mix}</div>
                                <div className="font-serif text-2xl font-medium">{vibe_alchemy?.elemental_mix}</div>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed opacity-90">{vibe_alchemy?.elemental_desc}</p>
                    </Card>
                    {/* Core Theme */}
                    <Card className="border-l-2 border-l-blue-500">
                        <div className={`${DETAIL_LABEL_CLASS} text-blue-500 mb-2`}>{t.us.vibe_core_theme}</div>
                        <p className="text-sm leading-relaxed opacity-90">{vibe_alchemy?.core_theme}</p>
                    </Card>
                </div>
            </Section>

            {/* Section 2: The Landscape (House Overlays) */}
            {landscape && (landscape.comfort_zone || landscape.romance_zone || landscape.growth_zone) && (
                <Section title={t.us.landscape_title} className="mb-8">
                    <div className="grid md:grid-cols-3 gap-4">
                        {landscape.comfort_zone && (
                            <LandscapeZoneCard
                                zone={landscape.comfort_zone}
                                title={t.us.landscape_comfort}
                                houseLabel={t.us.landscape_comfort_houses}
                                borderClass="border-l-2 border-l-gold-500"
                                iconClass={theme === 'dark' ? 'bg-gold-500/20 text-gold-500' : 'bg-gold-500/15 text-gold-500'}
                                icon="🏠"
                            />
                        )}
                        {landscape.romance_zone && (
                            <LandscapeZoneCard
                                zone={landscape.romance_zone}
                                title={t.us.landscape_romance}
                                houseLabel={t.us.landscape_romance_houses}
                                borderClass="border-l-2 border-l-pink-500"
                                iconClass={theme === 'dark' ? 'bg-pink-500/20 text-pink-500' : 'bg-pink-500/15 text-pink-500'}
                                icon="💕"
                            />
                        )}
                        {landscape.growth_zone && (
                            <LandscapeZoneCard
                                zone={landscape.growth_zone}
                                title={t.us.landscape_growth}
                                houseLabel={t.us.landscape_growth_houses}
                                borderClass="border-l-2 border-l-purple-500"
                                iconClass={theme === 'dark' ? 'bg-purple-500/20 text-purple-500' : 'bg-purple-500/15 text-purple-500'}
                                icon="🌱"
                            />
                        )}
                    </div>
                </Section>
            )}

            {/* Section 3: The Dynamics */}
            <Section title={t.us.dynamics_title} className="mb-8">
                <div className="space-y-4">
                    {dynamics?.spark && (
                        <DynamicCard
                            item={dynamics.spark}
                            title={t.us.dynamics_spark}
                            subtitle={t.us.dynamics_spark_desc}
                            icon="🔥"
                            borderColor="border-l-danger/60"
                        />
                    )}
                    {dynamics?.safety_net && (
                        <DynamicCard
                            item={dynamics.safety_net}
                            title={t.us.dynamics_safety}
                            subtitle={t.us.dynamics_safety_desc}
                            icon="🌙"
                            borderColor="border-l-star-200/60"
                        />
                    )}
                    {dynamics?.mind_meld && (
                        <DynamicCard
                            item={dynamics.mind_meld}
                            title={t.us.dynamics_mind}
                            subtitle={t.us.dynamics_mind_desc}
                            icon="🧠"
                            borderColor="border-l-accent/60"
                        />
                    )}
                    {dynamics?.glue && (
                        <DynamicCard
                            item={dynamics.glue}
                            title={t.us.dynamics_glue}
                            subtitle={t.us.dynamics_glue_desc}
                            icon="🔗"
                            borderColor="border-l-star-400/60"
                        />
                    )}
                </div>
            </Section>

            {/* Section 4: The Deep Dive */}
            {deep_dive && (deep_dive.pluto || deep_dive.chiron) && (
                <Section title={t.us.chem_deep_dive_title} className="mb-8">
                    <div className="space-y-4">
                        {deep_dive.pluto && (
                            <Card className="border-l-2 border-l-space-400/60">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">♇</span>
                                        <div>
                                            <div className="font-semibold">{deep_dive.pluto.headline || t.us.chem_pluto}</div>
                                            <div className="text-[10px] uppercase tracking-widest opacity-60">Pluto</div>
                                        </div>
                                    </div>
                                    <IntensityBadge intensity={deep_dive.pluto.intensity} />
                                </div>
                                <p className="text-sm leading-relaxed opacity-90 mb-4">{deep_dive.pluto.description}</p>
                                {deep_dive.pluto.warning && (
                                    <div className="p-3 rounded-lg border border-l-2 border-l-danger/60 border-danger/30">
                                        <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.chem_pluto_warning}</span>
                                        <p className="text-sm opacity-90">{deep_dive.pluto.warning}</p>
                                    </div>
                                )}
                            </Card>
                        )}
                        {deep_dive.chiron && (
                            <Card className="border-l-2 border-l-accent/60">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">⚷</span>
                                    <div>
                                        <div className="font-semibold">{deep_dive.chiron.headline || t.us.chem_chiron}</div>
                                        <div className="text-[10px] uppercase tracking-widest opacity-60">Chiron</div>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed opacity-90 mb-4">{deep_dive.chiron.description}</p>
                                <div className="p-3 rounded-lg border border-l-2 border-l-success/60 border-success/30">
                                    <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>{t.us.chem_chiron_path}</span>
                                    <p className="text-sm opacity-90">{deep_dive.chiron.healing_path}</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </Section>
            )}
        </div>
    );
};

type SynastryTabId = T.SynastryTab;
type SynastryTabContentMap = {
  overview: T.SynastryOverviewContent;
  natal_a: T.NatalScript;
  natal_b: T.NatalScript;
  syn_ab: T.PerspectiveData;
  syn_ba: T.PerspectiveData;
  composite: T.CompositeContent;
};

const UsPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language, tl } = useLanguage();
    const { theme } = useTheme();
    const [view, setView] = useState<'select' | 'report'>('select');
    const [segments, setSegments] = useState<Partial<SynastryTabContentMap>>({});
    const [reportMeta, setReportMeta] = useState<T.AIContentMeta | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [technical, setTechnical] = useState<T.SynastryTechnicalData | null>(null);
    const [technicalLoading, setTechnicalLoading] = useState(false);
    const [technicalError, setTechnicalError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SynastryTabId>('overview');
    const [relationshipType, setRelationshipType] = useState<string>(RELATIONSHIP_TYPES[0]?.key || 'romantic');
    const [typeLocked, setTypeLocked] = useState(false);
    const [showAllTypes, setShowAllTypes] = useState(false);
    const [suggestions, setSuggestions] = useState<T.SynastrySuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [segmentErrors, setSegmentErrors] = useState<Partial<Record<SynastryTabId, string>>>({});
    const [segmentLoading, setSegmentLoading] = useState<Partial<Record<SynastryTabId, boolean>>>({});
    const [overviewSections, setOverviewSections] = useState<Partial<Record<T.SynastryOverviewSection, T.SynastryOverviewSectionContent>>>({});
    const [overviewSectionErrors, setOverviewSectionErrors] = useState<Partial<Record<T.SynastryOverviewSection, string>>>({});
    const [overviewSectionLoading, setOverviewSectionLoading] = useState<Partial<Record<T.SynastryOverviewSection, boolean>>>({});
    const [overviewAccordionOpen, setOverviewAccordionOpen] = useState<Partial<Record<T.SynastryOverviewSection, boolean>>>({});
    const segmentsRef = useRef(segments);
    const segmentLoadingRef = useRef(segmentLoading);
    const overviewSectionsRef = useRef(overviewSections);
    const overviewSectionLoadingRef = useRef(overviewSectionLoading);
    const technicalLoadingRef = useRef(technicalLoading);

    useEffect(() => {
      segmentsRef.current = segments;
    }, [segments]);

    useEffect(() => {
      segmentLoadingRef.current = segmentLoading;
    }, [segmentLoading]);
    useEffect(() => {
      overviewSectionsRef.current = overviewSections;
    }, [overviewSections]);
    useEffect(() => {
      overviewSectionLoadingRef.current = overviewSectionLoading;
    }, [overviewSectionLoading]);

    useEffect(() => {
      technicalLoadingRef.current = technicalLoading;
    }, [technicalLoading]);

    const [storedProfiles, setStoredProfiles] = useState<T.SynastryProfile[]>(() => {
      const saved = localStorage.getItem(SYNASTRY_PROFILE_STORAGE_KEY);
      if (!saved) return [];
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });

    useEffect(() => {
      localStorage.setItem(SYNASTRY_PROFILE_STORAGE_KEY, JSON.stringify(storedProfiles));
    }, [storedProfiles]);

    const meProfile = useMemo<T.SynastryProfile>(() => ({
      id: 'me',
      name: profile.name || (language === 'zh' ? '我' : 'Me'),
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthCity: profile.birthCity,
      lat: profile.lat,
      lon: profile.lon,
      timezone: profile.timezone,
      accuracyLevel: profile.accuracyLevel,
      currentLocation: profile.birthCity,
    }), [profile, language]);

    const profiles = useMemo(() => [meProfile, ...storedProfiles], [meProfile, storedProfiles]);
    const [selectedA, setSelectedA] = useState<T.SynastryProfile | null>(null);
    const [selectedB, setSelectedB] = useState<T.SynastryProfile | null>(null);
    const [big3Map, setBig3Map] = useState<Record<string, { sun?: string; moon?: string; rising?: string }>>({});

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<T.SynastryProfile | null>(null);
    const [formData, setFormData] = useState<Partial<T.SynastryProfile>>({
      name: '',
      birthDate: '',
      birthTime: '',
      birthCity: '',
      timezone: profile.timezone,
      accuracyLevel: 'exact',
      currentLocation: '',
    });
    const [cityQuery, setCityQuery] = useState('');
    const [citySuggestions, setCitySuggestions] = useState<Array<{ city: string; country: string; lat: number; lon: number; timezone: string; admin1?: string }>>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    // 合盘详情解读弹窗状态
    const [synastryDetailModal, setSynastryDetailModal] = useState<{
      open: boolean;
      loading: boolean;
      error: string | null;
      content: T.SectionDetailContent | null;
      type: T.DetailType | null;
      context: T.DetailContext | null;
    }>({
      open: false,
      loading: false,
      error: null,
      content: null,
      type: null,
      context: null,
    });

    useEffect(() => {
      setSelectedA((prev) => (prev?.id === 'me' ? meProfile : prev));
      setSelectedB((prev) => (prev?.id === 'me' ? meProfile : prev));
    }, [meProfile]);

    useEffect(() => {
      let mounted = true;
      const missing = profiles.filter((p) => !big3Map[p.id]);
      if (missing.length === 0) return;
      missing.forEach(async (p) => {
        try {
          const chart = await Astro.calculateNatalChart(p);
          if (!mounted) return;
          const sun = chart.positions.find((pos) => pos.name === 'Sun');
          const moon = chart.positions.find((pos) => pos.name === 'Moon');
          const rising = chart.positions.find((pos) => pos.name === 'Ascendant' || pos.name === 'Rising');
          setBig3Map((prev) => ({
            ...prev,
            [p.id]: { sun: sun?.sign, moon: moon?.sign, rising: rising?.sign },
          }));
        } catch {
          if (!mounted) return;
          setBig3Map((prev) => ({ ...prev, [p.id]: {} }));
        }
      });
      return () => { mounted = false; };
    }, [profiles, big3Map]);

    useEffect(() => {
      setTypeLocked(false);
    }, [selectedA?.id, selectedB?.id]);

    useEffect(() => {
      if (!selectedA || !selectedB) {
        setSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }
      let mounted = true;
      setSuggestionsLoading(true);
      fetchSynastrySuggestions(selectedA, selectedB, language)
        .then((res) => {
          if (!mounted) return;
          const list = res.suggestions || [];
          setSuggestions(list);
          if (!typeLocked && list[0]) {
            setRelationshipType(list[0].key);
          }
        })
        .catch(() => {
          if (!mounted) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (mounted) setSuggestionsLoading(false);
        });
      return () => { mounted = false; };
    }, [selectedA?.id, selectedB?.id, language]);

    useEffect(() => {
      if (!modalOpen) return;
      if (cityQuery.length < 2) { setCitySuggestions([]); return; }
      const timer = setTimeout(async () => {
        try {
          const res = await searchCities(cityQuery, 5);
          setCitySuggestions(res.cities || []);
        } catch {
          setCitySuggestions([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [cityQuery, modalOpen]);

    const createProfileId = () => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
      return `syn_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
    };

    const openAddModal = () => {
      setEditingProfile(null);
      setFormData({
        name: '',
        birthDate: '',
        birthTime: '',
        birthCity: '',
        lat: undefined,
        lon: undefined,
        timezone: profile.timezone,
        accuracyLevel: 'exact',
        currentLocation: '',
      });
      setCityQuery('');
      setShowCitySuggestions(false);
      setModalOpen(true);
    };

    const openEditModal = (p: T.SynastryProfile) => {
      setEditingProfile(p);
      setFormData({ ...p });
      setCityQuery(p.birthCity || '');
      setShowCitySuggestions(false);
      setModalOpen(true);
    };

    const handleSaveProfile = () => {
      const name = (formData.name || '').trim();
      const birthDate = formData.birthDate || '';
      const birthCity = (formData.birthCity || '').trim();
      if (!name || !birthDate || !birthCity) return;
      const resolved: T.SynastryProfile = {
        id: editingProfile?.id || createProfileId(),
        name,
        birthDate,
        birthTime: formData.birthTime || undefined,
        birthCity,
        lat: formData.lat,
        lon: formData.lon,
        timezone: formData.timezone || profile.timezone,
        accuracyLevel: formData.birthTime ? 'exact' : 'time_unknown',
        currentLocation: (formData.currentLocation || '').trim() || undefined,
      };
      setStoredProfiles((prev) => {
        if (editingProfile) {
          return prev.map((item) => (item.id === editingProfile.id ? resolved : item));
        }
        return [...prev, resolved];
      });
      setSelectedA((prev) => (prev?.id === resolved.id ? resolved : prev));
      setSelectedB((prev) => (prev?.id === resolved.id ? resolved : prev));
      setModalOpen(false);
    };

    const handleDeleteProfile = (id: string) => {
      setStoredProfiles((prev) => prev.filter((p) => p.id !== id));
      if (selectedA?.id === id) setSelectedA(null);
      if (selectedB?.id === id) setSelectedB(null);
    };

    const handleSelectProfile = (p: T.SynastryProfile) => {
      if (selectedA?.id === p.id) {
        setSelectedA(null);
        return;
      }
      if (selectedB?.id === p.id) {
        setSelectedB(null);
        return;
      }
      if (!selectedA) {
        setSelectedA(p);
        return;
      }
      if (!selectedB) {
        setSelectedB(p);
        return;
      }
      setSelectedB(p);
    };

    const fetchSynastryTechnicalData = async () => {
      if (!selectedA || !selectedB) return;
      if (technical || technicalLoadingRef.current) return;
      setTechnicalLoading(true);
      setTechnicalError(null);
      try {
        const data = await fetchSynastryTechnical(selectedA, selectedB, language, relationshipType);
        setTechnical(data);
      } catch {
        setTechnicalError(t.common.tech_failed);
      } finally {
        setTechnicalLoading(false);
      }
    };

    const fetchSynastryOverviewSectionData = async (section: T.SynastryOverviewSection) => {
      if (!selectedA || !selectedB) return;
      if (overviewSectionsRef.current[section] || overviewSectionLoadingRef.current[section]) return;
      setOverviewSectionLoading((prev) => ({ ...prev, [section]: true }));
      setOverviewSectionErrors((prev) => ({ ...prev, [section]: undefined }));
      try {
        const result = await fetchSynastryOverviewSection(
          selectedA,
          selectedB,
          section,
          language,
          relationshipType,
          selectedA?.name,
          selectedB?.name
        );
        if (!result?.content || result.meta?.source !== 'ai') {
          throw new Error('AI unavailable');
        }
        setOverviewSections((prev) => ({ ...prev, [section]: result.content as T.SynastryOverviewSectionContent }));
      } catch {
        setOverviewSectionErrors((prev) => ({ ...prev, [section]: t.us.report_ai_failed }));
      } finally {
        setOverviewSectionLoading((prev) => ({ ...prev, [section]: false }));
      }
    };

    const fetchSynastryTab = async (tab: SynastryTabId) => {
      if (!selectedA || !selectedB) return;
      if (segmentsRef.current[tab] || segmentLoadingRef.current[tab]) return;
      setSegmentLoading((prev) => ({ ...prev, [tab]: true }));
      setSegmentErrors((prev) => ({ ...prev, [tab]: undefined }));
      try {
        const result = await fetchSynastry(selectedA, selectedB, language, relationshipType, tab, selectedA?.name, selectedB?.name);
        if (!result?.content || result.meta?.source !== 'ai') {
          throw new Error('AI unavailable');
        }
        setSegments((prev) => ({ ...prev, [tab]: result.content as SynastryTabContentMap[SynastryTabId] }));
        if (tab === 'overview') {
          setReportMeta(result.meta || null);
        }
      } catch {
        const message = t.us.report_ai_failed;
        setSegmentErrors((prev) => ({ ...prev, [tab]: message }));
        if (tab === 'overview') {
          setReportError(message);
        }
      } finally {
        setSegmentLoading((prev) => ({ ...prev, [tab]: false }));
      }
    };

    useEffect(() => {
      if (view !== 'report') return;
      if (activeTab !== 'overview') return;
      if (!segments.overview) return;
      fetchSynastryOverviewSectionData('vibe_tags');
    }, [view, activeTab, segments.overview, selectedA?.id, selectedB?.id, relationshipType, language]);

    const handleGenerate = async () => {
      if (!selectedA || !selectedB) return;
      setView('report');
      setSegments({});
      setReportMeta(null);
      setReportError(null);
      setSegmentErrors({});
      setSegmentLoading({});
      setOverviewSections({});
      setOverviewSectionErrors({});
      setOverviewSectionLoading({});
      setOverviewAccordionOpen({});
      setTechnical(null);
      setTechnicalLoading(false);
      setTechnicalError(null);
      setActiveTab('overview');
      await fetchSynastryTab('overview');
    };

    useEffect(() => {
      if (view !== 'report' || !segments.overview) return;
      let cancelled = false;
      const queue: SynastryTabId[] = ['natal_a', 'natal_b', 'syn_ab', 'syn_ba', 'composite'];
      const waitForIdle = () => new Promise<void>((resolve) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
            .requestIdleCallback?.(() => resolve(), { timeout: 2000 });
        } else {
          setTimeout(resolve, 300);
        }
      });

      const runPrefetch = async () => {
        await waitForIdle();
        if (!cancelled) {
          await fetchSynastryTechnicalData();
        }
        for (const tab of queue) {
          if (cancelled) return;
          await waitForIdle();
          await fetchSynastryTab(tab);
        }
      };

      runPrefetch();
      return () => { cancelled = true; };
    }, [view, segments.overview, selectedA?.id, selectedB?.id, relationshipType, language]);

    const renderBig3 = (id: string) => {
      const big3 = big3Map[id];
      if (!big3 || (!big3.sun && !big3.moon && !big3.rising)) return '—';
      const parts = [
        big3.sun ? `${t.me.sun}: ${tl(big3.sun)}` : null,
        big3.moon ? `${t.me.moon}: ${tl(big3.moon)}` : null,
        big3.rising ? `${t.me.rising}: ${tl(big3.rising)}` : null,
      ].filter(Boolean);
      return parts.join(' · ');
    };

    const sectionTitle = "text-sm font-bold uppercase text-gold-500 mb-4 tracking-widest border-b border-gold-500/20 pb-2";
    const detailLabelClass = DETAIL_LABEL_CLASS;
    const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
    const getRadarTone = (dim: string) => {
      const key = dim.toLowerCase();
      if (key.includes('safety') || key.includes('安全')) {
        return { bar: 'bg-blue-500', text: 'text-blue-500', border: 'border-l-blue-500', soft: '' };
      }
      if (key.includes('communication') || key.includes('沟通')) {
        return { bar: 'bg-accent', text: 'text-accent', border: 'border-l-accent', soft: '' };
      }
      if (key.includes('intimacy') || key.includes('亲密')) {
        return { bar: 'bg-pink-500', text: 'text-pink-500', border: 'border-l-pink-500', soft: '' };
      }
      if (key.includes('values') || key.includes('价值')) {
        return { bar: 'bg-gold-500', text: 'text-gold-500', border: 'border-l-gold-500', soft: '' };
      }
      if (key.includes('rhythm') || key.includes('节奏')) {
        return { bar: 'bg-purple-500', text: 'text-purple-500', border: 'border-l-purple-500', soft: '' };
      }
      return { bar: 'bg-star-200', text: 'text-star-200', border: 'border-l-star-200', soft: '' };
    };
    const getCoreDynamicsTone = (key: string) => {
      const normalized = key.toLowerCase();
      if (normalized.includes('emotional')) {
        return { border: 'border-l-blue-500', text: 'text-blue-500', bg: '' };
      }
      if (normalized.includes('communication')) {
        return { border: 'border-l-accent', text: 'text-accent', bg: '' };
      }
      if (normalized.includes('intimacy')) {
        return { border: 'border-l-pink-500', text: 'text-pink-500', bg: '' };
      }
      if (normalized.includes('values')) {
        return { border: 'border-l-gold-500', text: 'text-gold-500', bg: '' };
      }
      if (normalized.includes('rhythm')) {
        return { border: 'border-l-purple-500', text: 'text-purple-500', bg: '' };
      }
      return { border: 'border-l-star-200', text: 'text-star-200', bg: '' };
    };
    const formatNeedsLabel = (name: string) => {
      if (language === 'zh') return `${name}${t.us.needs_label}`;
      if (name === t.us.slot_me) return `${t.us.needs_prefix} I need`;
      const prefix = t.us.needs_prefix ? `${t.us.needs_prefix} ` : '';
      return `${prefix}${name} ${t.us.needs_label}`;
    };
    const stripNeedsPrefix = (text: string, name: string) => {
      if (!text) return text;
      const trimmed = text.trim();
      const needsLabel = t.us.needs_label;
      const candidates = [
        formatNeedsLabel(name),
        `${name} ${needsLabel}`,
        `${name}${needsLabel}`,
        language === 'en' ? 'I need' : '',
      ].filter(Boolean);
      const matched = candidates.find((prefix) => trimmed.startsWith(prefix));
      if (!matched) return trimmed;
      return trimmed
        .slice(matched.length)
        .trimStart()
        .replace(/^[：:，,]\s*/, '');
    };
    const renderOverviewSectionError = (section: T.SynastryOverviewSection, message: string) => (
      <div className="text-center py-10">
        <div className="text-sm text-danger mb-4">{message}</div>
        <ActionButton size="sm" variant="secondary" onClick={() => fetchSynastryOverviewSectionData(section)}>
          {t.common.retry}
        </ActionButton>
      </div>
    );
    const personALabel = selectedA?.id === 'me' ? t.us.slot_me : selectedA?.name || t.us.tab_me;
    const personBLabel = selectedB?.name || t.us.tab_partner;
    const compositeKeyTitle = language === 'zh' ? '关键动力' : 'Key Dynamics';

    // Convert SynastryProfile to UserProfile for AstroChart compatibility
    const toUserProfile = (sp: T.SynastryProfile | null): T.UserProfile | undefined => {
      if (!sp) return undefined;
      return {
        userId: sp.id,
        name: sp.name,
        birthDate: sp.birthDate,
        birthTime: sp.birthTime,
        birthCity: sp.birthCity,
        lat: sp.lat,
        lon: sp.lon,
        timezone: sp.timezone,
        accuracyLevel: sp.accuracyLevel,
        focusTags: [],
      };
    };
    const profileA = toUserProfile(selectedA);
    const profileB = toUserProfile(selectedB);

    // 合盘详情解读处理函数
    const handleSynastryDetailClick = async (
      type: T.DetailType,
      context: T.DetailContext,
      chartData: Record<string, unknown>
    ) => {
      setSynastryDetailModal({
        open: true,
        loading: true,
        error: null,
        content: null,
        type,
        context,
      });

      try {
        const result = await fetchSectionDetail({
          type,
          context,
          chartData,
          lang: language,
          nameA: selectedA?.name,
          nameB: selectedB?.name,
        });
        setSynastryDetailModal((prev) => ({
          ...prev,
          loading: false,
          content: result.content,
        }));
      } catch (err) {
        setSynastryDetailModal((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load detail',
        }));
      }
    };

    const closeSynastryDetailModal = () => {
      setSynastryDetailModal((prev) => ({ ...prev, open: false }));
    };

    const retrySynastryDetail = () => {
      if (synastryDetailModal.type && synastryDetailModal.context && technical) {
        const chartData = getChartDataForContext(synastryDetailModal.type, synastryDetailModal.context);
        if (chartData) {
          handleSynastryDetailClick(synastryDetailModal.type, synastryDetailModal.context, chartData);
        }
      }
    };

    const getChartDataForContext = (type: T.DetailType, context: T.DetailContext): Record<string, unknown> | null => {
      if (!technical) return null;
      switch (context) {
        case 'natal':
          // natal_a or natal_b based on active tab
          if (activeTab === 'natal_a') {
            return type === 'elements' ? { elements: technical.natal_a.elements }
              : type === 'aspects' ? { aspects: technical.natal_a.aspects }
              : type === 'planets' ? { planets: technical.natal_a.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_a.asteroids }
              : { houseRulers: technical.natal_a.houseRulers };
          } else {
            return type === 'elements' ? { elements: technical.natal_b.elements }
              : type === 'aspects' ? { aspects: technical.natal_b.aspects }
              : type === 'planets' ? { planets: technical.natal_b.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_b.asteroids }
              : { houseRulers: technical.natal_b.houseRulers };
          }
        case 'synastry':
          if (activeTab === 'syn_ab') {
            return type === 'aspects' ? { aspects: technical.syn_ab.aspects, houseOverlays: technical.syn_ab.houseOverlays }
              : type === 'planets' ? { planets: technical.natal_a.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_a.asteroids }
              : { houseRulers: technical.natal_a.houseRulers };
          } else {
            return type === 'aspects' ? { aspects: technical.syn_ba.aspects, houseOverlays: technical.syn_ba.houseOverlays }
              : type === 'planets' ? { planets: technical.natal_b.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_b.asteroids }
              : { houseRulers: technical.natal_b.houseRulers };
          }
        case 'composite':
          return type === 'elements' ? { elements: technical.composite.elements }
            : type === 'aspects' ? { aspects: technical.composite.aspects }
            : type === 'planets' ? { planets: technical.composite.planets }
            : type === 'asteroids' ? { asteroids: technical.composite.asteroids }
            : { houseRulers: technical.composite.houseRulers };
        default:
          return null;
      }
    };

    const renderExtendedAppendix = (data: T.ExtendedNatalData, context: T.DetailContext) => (
      <div className="space-y-10">
        <div>
          <SectionHeader
            title={t.me.tech_elements}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('elements', context, { elements: data.elements })}
            className={sectionTitle}
          />
          <ElementalTable data={data.elements} language={language} />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_aspects}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('aspects', context, { aspects: data.aspects })}
            className={sectionTitle}
          />
          <AspectMatrix aspects={data.aspects} language={language} />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_planets}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('planets', context, { planets: data.planets })}
            className={sectionTitle}
          />
          <PlanetTable
            planets={data.planets}
            language={language}
            labels={{
              body: t.me.table_body,
              sign: t.me.table_sign,
              house: t.me.table_house,
              retro: t.me.table_retro,
            }}
          />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_asteroids}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('asteroids', context, { asteroids: data.asteroids })}
            className={sectionTitle}
          />
          <PlanetTable
            planets={data.asteroids}
            language={language}
            labels={{
              body: t.me.table_body,
              sign: t.me.table_sign,
              house: t.me.table_house,
              retro: t.me.table_retro,
            }}
          />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_rulers}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('rulers', context, { houseRulers: data.houseRulers })}
            className={sectionTitle}
          />
          <HouseRulerTable
            rulers={data.houseRulers}
            language={language}
            labels={{
              house: t.me.table_house,
              sign: t.me.table_sign,
              ruler: t.me.table_ruler,
              flies_to: t.me.table_flies_to,
            }}
          />
        </div>
      </div>
    );

    const renderComparisonAppendix = (comparison: T.SynastryComparisonTechnicalData, isAB: boolean) => (
      <div className="space-y-10">
        <div>
          <SectionHeader
            title={t.me.tech_aspects}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('aspects', 'synastry', {
              aspects: comparison.aspects,
              houseOverlays: comparison.houseOverlays,
            })}
            className={sectionTitle}
          />
          <SynastryAspectMatrix
            aspects={comparison.aspects}
            language={language}
            personALabel={isAB ? personALabel : personBLabel}
            personBLabel={isAB ? personBLabel : personALabel}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gold-500">{personALabel}</div>
            <div>
              <SectionHeader
                title={t.me.tech_planets}
                detailLabel={t.detail.view_detail}
                onDetailClick={() => handleSynastryDetailClick('planets', 'synastry', {
                  planets: isAB ? technical?.natal_a.planets : technical?.natal_b.planets,
                })}
                className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2"
              />
              <PlanetTable
                planets={isAB ? (technical?.natal_a.planets || []) : (technical?.natal_b.planets || [])}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div>
              <SectionHeader
                title={t.me.tech_asteroids}
                detailLabel={t.detail.view_detail}
                onDetailClick={() => handleSynastryDetailClick('asteroids', 'synastry', {
                  asteroids: isAB ? technical?.natal_a.asteroids : technical?.natal_b.asteroids,
                })}
                className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2"
              />
              <PlanetTable
                planets={isAB ? (technical?.natal_a.asteroids || []) : (technical?.natal_b.asteroids || [])}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div>
              <SectionHeader
                title={t.me.tech_rulers}
                detailLabel={t.detail.view_detail}
                onDetailClick={() => handleSynastryDetailClick('rulers', 'synastry', {
                  houseRulers: isAB ? technical?.natal_a.houseRulers : technical?.natal_b.houseRulers,
                })}
                className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2"
              />
              <HouseRulerTable
                rulers={isAB ? (technical?.natal_a.houseRulers || []) : (technical?.natal_b.houseRulers || [])}
                language={language}
                labels={{
                  house: t.me.table_house,
                  sign: t.me.table_sign,
                  ruler: t.me.table_ruler,
                  flies_to: t.me.table_flies_to,
                }}
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gold-500">{personBLabel}</div>
            <div>
              <SectionHeader
                title={t.me.tech_planets}
                detailLabel={t.detail.view_detail}
                onDetailClick={() => handleSynastryDetailClick('planets', 'synastry', {
                  planets: isAB ? technical?.natal_b.planets : technical?.natal_a.planets,
                })}
                className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2"
              />
              <PlanetTable
                planets={isAB ? (technical?.natal_b.planets || []) : (technical?.natal_a.planets || [])}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div>
              <SectionHeader
                title={t.me.tech_asteroids}
                detailLabel={t.detail.view_detail}
                onDetailClick={() => handleSynastryDetailClick('asteroids', 'synastry', {
                  asteroids: isAB ? technical?.natal_b.asteroids : technical?.natal_a.asteroids,
                })}
                className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2"
              />
              <PlanetTable
                planets={isAB ? (technical?.natal_b.asteroids || []) : (technical?.natal_a.asteroids || [])}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div>
              <SectionHeader
                title={t.me.tech_rulers}
                detailLabel={t.detail.view_detail}
                onDetailClick={() => handleSynastryDetailClick('rulers', 'synastry', {
                  houseRulers: isAB ? technical?.natal_b.houseRulers : technical?.natal_a.houseRulers,
                })}
                className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2"
              />
              <HouseRulerTable
                rulers={isAB ? (technical?.natal_b.houseRulers || []) : (technical?.natal_a.houseRulers || [])}
                language={language}
                labels={{
                  house: t.me.table_house,
                  sign: t.me.table_sign,
                  ruler: t.me.table_ruler,
                  flies_to: t.me.table_flies_to,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );

    const renderTechnicalSection = (content: React.ReactNode) => {
      if (technical) {
        return (
          <Section title={t.common.tech_specs} className="mt-8">
            {content}
          </Section>
        );
      }
      if (technicalLoading || technicalError) {
        return (
          <Section title={t.common.tech_specs} className="mt-8">
            <MiniLoader label={t.common.tech_loading} error={technicalError} />
          </Section>
        );
      }
      return null;
    };

    if (view === 'select') {
      const topOptions = suggestions.length > 0
        ? suggestions
            .map((s) => RELATIONSHIP_TYPES.find((rt) => rt.key === s.key))
            .filter(Boolean) as typeof RELATIONSHIP_TYPES
        : RELATIONSHIP_TYPES;
      const options = showAllTypes ? RELATIONSHIP_TYPES : (topOptions.length ? topOptions : RELATIONSHIP_TYPES);
      const showTypeToggle = suggestions.length > 0 && topOptions.length < RELATIONSHIP_TYPES.length;
      const selectedProfiles = [selectedA, selectedB].filter(Boolean) as T.SynastryProfile[];
      const selectedCount = selectedProfiles.length;
      const selectedNames = selectedProfiles
        .map((p) => p.name || (p.id === 'me' ? t.us.slot_me : ''))
        .filter(Boolean)
        .join(' & ');
      const selectionSummary = selectedCount
        ? (language === 'zh' ? `选择了${selectedCount}人：${selectedNames}` : `Selected ${selectedCount}: ${selectedNames}`)
        : (language === 'zh' ? '请在下方选择两位档案' : 'Select two profiles below');

      return (
        <Container className="flex flex-col min-h-screen !py-0 pt-[60px] overflow-hidden">
          <div className="flex items-center justify-between shrink-0 pt-8 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">{t.us.selection_title}</h1>
              <p className="text-sm opacity-60">{t.us.selection_subtitle}</p>
            </div>
            <ActionButton size="sm" onClick={openAddModal}>{t.us.btn_add_profile}</ActionButton>
          </div>

          <Card
            noPadding
            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 mb-4 border ${theme === 'dark' ? 'border-space-600/70' : 'border-paper-300'}`}
          >
            <div className="text-sm font-medium">
              {selectionSummary}
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-60">
              {selectedA && <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-500">A</span>}
              {selectedB && <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-500">B</span>}
            </div>
          </Card>

          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="text-xs font-bold uppercase tracking-widest opacity-60">{t.us.list_title}</div>
              {suggestionsLoading && <div className="text-xs opacity-50">{t.us.relationship_loading}</div>}
            </div>
            <div className="max-h-[415px] overflow-y-auto space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {profiles.length === 0 && (
                <div className="text-sm opacity-60">{t.us.empty_profiles}</div>
              )}
              {profiles.map((p) => {
                const selectedInA = selectedA?.id === p.id;
                const selectedInB = selectedB?.id === p.id;
                const selectedSlot = selectedInA ? 'A' : selectedInB ? 'B' : null;
                const selected = selectedInA || selectedInB;
                return (
                  <Card
                    key={p.id}
                    noPadding
                    className={`flex items-center gap-4 px-4 py-3 ${selected ? 'border-gold-500/70 bg-gold-500/5' : ''}`}
                    onClick={() => handleSelectProfile(p)}
                  >
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-bold uppercase transition-colors ${selected ? 'bg-gold-500 border-gold-500 text-space-950' : 'border-space-600 text-space-600 hover:border-gold-500/60'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProfile(p);
                      }}
                    >
                      {selected ? '✓' : ''}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate">{p.name}</div>
                        {p.id === 'me' && (
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-gold-500/40 text-gold-500">
                            {t.us.tag_me}
                          </span>
                        )}
                        {selectedSlot && (
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gold-500 text-space-950">
                            {language === 'zh' ? `${selectedSlot}位` : `Person ${selectedSlot}`}
                          </span>
                        )}
                        {selected && (
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-gold-500/60 text-gold-500">
                            {t.us.btn_selected}
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-60 mt-1">{renderBig3(p.id)}</div>
                    </div>
                    {p.id !== 'me' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-space-500/70 text-star-200 hover:text-star-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                        >
                          {t.us.btn_edit}
                        </button>
                        <button
                          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-danger/50 text-danger/80 hover:text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(p.id);
                          }}
                        >
                          {t.us.btn_delete}
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="pt-[20px] pb-6 border-t border-space-600 shrink-0">
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{t.us.relationship_label}</div>
                <div className="flex items-center gap-3">
                  <select
                    className={`w-full h-10 px-4 pr-8 rounded-lg outline-none transition-all font-sans text-sm appearance-none bg-no-repeat ${theme === 'dark' ? 'bg-space-900 border border-space-600 text-star-50' : 'bg-white border-paper-300 text-paper-900'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    value={relationshipType}
                    onChange={(e) => {
                      setRelationshipType(e.target.value);
                      setTypeLocked(true);
                    }}
                  >
                    {options.map((rt) => (
                      <option key={rt.key} value={rt.key}>
                        {language === 'zh' ? rt.label_zh : rt.label_en}
                      </option>
                    ))}
                  </select>
                  {showTypeToggle && (
                    <button
                      className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 whitespace-nowrap"
                      onClick={() => setShowAllTypes((prev) => !prev)}
                    >
                      {showAllTypes ? t.us.relationship_less : t.us.relationship_more}
                    </button>
                  )}
                </div>
                {suggestions.length > 0 && (
                  <div className="text-[10px] uppercase tracking-widest opacity-50 mt-2">{t.us.relationship_hint}</div>
                )}
              </div>
              <ActionButton
                onClick={handleGenerate}
                disabled={!selectedA || !selectedB}
                className="w-full h-10"
              >
                {t.us.btn_calculate}
              </ActionButton>
            </div>
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingProfile ? t.us.modal_edit_title : t.us.modal_add_title}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">{t.us.label_name}</label>
                <GlassInput
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">{t.onboarding.label_date}</label>
                  <GlassInput
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">{t.onboarding.label_time}</label>
                  <GlassInput
                    type="time"
                    value={formData.birthTime || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">{t.onboarding.label_city}</label>
                <GlassInput
                  value={cityQuery}
                  placeholder={t.onboarding.placeholder_city}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCityQuery(nextValue);
                    setShowCitySuggestions(true);
                    setFormData((prev) => ({
                      ...prev,
                      birthCity: nextValue,
                      lat: undefined,
                      lon: undefined,
                      timezone: prev.timezone || profile.timezone,
                    }));
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-space-600' : 'bg-white border-gray-200'} shadow-lg max-h-48 overflow-auto`}>
                    {citySuggestions.map((city, i) => (
                      <div
                        key={i}
                        className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-gray-100'}`}
                        onMouseDown={() => {
                          const label = city.country ? `${city.city}, ${city.country}` : city.city;
                          setCityQuery(label);
                          setFormData((prev) => ({ ...prev, birthCity: label, lat: city.lat, lon: city.lon, timezone: city.timezone }));
                          setShowCitySuggestions(false);
                        }}
                      >
                        <div className="font-medium">{city.city}</div>
                        <div className="text-xs opacity-60">{city.country}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">{t.us.label_current_location}</label>
                <GlassInput
                  value={formData.currentLocation || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currentLocation: e.target.value }))}
                />
              </div>
              <ActionButton
                className="w-full"
                onClick={handleSaveProfile}
                disabled={!formData.name || !formData.birthDate || !formData.birthCity}
              >
                {editingProfile ? t.us.btn_edit : t.us.btn_add_profile}
              </ActionButton>
            </div>
          </Modal>
        </Container>
      );
    }

    if (!segments.overview) {
      const overviewError = reportError || segmentErrors.overview;
      if (overviewError) {
        return (
          <Container className="flex justify-center items-center h-screen">
            <Card className="text-center max-w-md w-full">
              <div className="text-sm text-danger mb-6">{overviewError}</div>
              <ActionButton onClick={() => { setView('select'); setReportError(null); }}>{t.us.new_analysis}</ActionButton>
            </Card>
          </Container>
        );
      }
      return (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-space-950 overflow-hidden z-50">
          <OracleLoading
            phrases={t.us.synastry_loading_phrases}
            thinkingLabel={t.common.analyzing}
          />
        </div>
      );
    }

    const overview = segments.overview;
    const scriptA = segments.natal_a;
    const scriptB = segments.natal_b;
    const perspectiveAB = segments.syn_ab;
    const perspectiveBA = segments.syn_ba;
    const composite = segments.composite;
    const coreDynamics = (overviewSections.core_dynamics as T.SynastryCoreDynamicsContent | undefined)?.core_dynamics;
    const practiceTools = (overviewSections.practice_tools as T.SynastryPracticeToolsContent | undefined)?.practice_tools;
    const highlights = (overviewSections.highlights as T.SynastryHighlightsContent | undefined)?.highlights;
    // NEW: lazy-loaded sections
    const vibeTags = overviewSections.vibe_tags as T.SynastryVibeTagsContent | undefined;
    const growthTaskLazy = overviewSections.growth_task as T.SynastryGrowthTaskContent | undefined;
    const conflictLoop = overviewSections.conflict_loop as T.SynastryConflictLoopContent | undefined;
    const weatherForecast = overviewSections.weather_forecast as T.SynastryWeatherForecastContent | undefined;
    const sweetSpots = growthTaskLazy?.sweet_spots ?? [];
    const frictionPoints = growthTaskLazy?.friction_points ?? [];

    const coreDynamicsLoading = overviewSectionLoading.core_dynamics;
    const coreDynamicsError = overviewSectionErrors.core_dynamics;
    const practiceToolsLoading = overviewSectionLoading.practice_tools;
    const practiceToolsError = overviewSectionErrors.practice_tools;
    const highlightsLoading = overviewSectionLoading.highlights;
    const highlightsError = overviewSectionErrors.highlights;
    // NEW: loading/error states
    const vibeTagsLoading = overviewSectionLoading.vibe_tags;
    const vibeTagsError = overviewSectionErrors.vibe_tags;
    const growthTaskLoading = overviewSectionLoading.growth_task;
    const growthTaskError = overviewSectionErrors.growth_task;
    const conflictLoopLoading = overviewSectionLoading.conflict_loop;
    const conflictLoopError = overviewSectionErrors.conflict_loop;
    const weatherForecastLoading = overviewSectionLoading.weather_forecast;
    const weatherForecastError = overviewSectionErrors.weather_forecast;

    const tabs = [
        { id: 'overview', label: t.us.tab_summary },
        { id: 'natal_a', label: personALabel },
        { id: 'natal_b', label: personBLabel },
        { id: 'syn_ab', label: `${personALabel} → ${personBLabel}` },
        { id: 'syn_ba', label: `${personBLabel} → ${personALabel}` },
        { id: 'composite', label: t.us.tab_composite },
    ];

    // Helper to replace {self} and {other} placeholders in template strings
    const fillTemplate = (template: string, self: string, other: string) =>
        template.replace(/\{self\}/g, self).replace(/\{other\}/g, other);

    const getTabInfo = (tabId: string): { desc: string } => {
        switch (tabId) {
            case 'overview':
                return { desc: t.us.tab_overview_desc };
            case 'natal_a':
                return { desc: t.us.tab_natal_desc };
            case 'natal_b':
                return { desc: t.us.tab_natal_desc };
            case 'syn_ab':
                return { desc: fillTemplate(t.us.tab_perspective_desc_template, personALabel, personBLabel) };
            case 'syn_ba':
                return { desc: fillTemplate(t.us.tab_perspective_desc_template, personBLabel, personALabel) };
            case 'composite':
                return { desc: t.us.tab_composite_desc };
            default:
                return { desc: '' };
        }
    };

    const currentInfo = getTabInfo(activeTab);

    return (
        <Container>
            <div className="flex justify-between items-center mb-8 border-b border-space-600 pb-4">
                <h1 className="text-3xl font-serif font-medium">{t.us.report_title}</h1>
                <button onClick={() => setView('select')} className="text-xs text-gold-500 uppercase tracking-widest hover:underline">{t.us.new_analysis}</button>
            </div>
            
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        const nextTab = tab.id as SynastryTabId;
                        setActiveTab(nextTab);
                        if (!segmentsRef.current[nextTab]) {
                          fetchSynastryTab(nextTab);
                        }
                        if (nextTab !== 'overview') {
                          fetchSynastryTechnicalData();
                        }
                      }}
                      className={`px-4 py-2 min-w-[5rem] text-center whitespace-nowrap rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeTab === tab.id ? 'bg-gold-500 text-space-950 border-gold-500' : 'bg-transparent text-star-400 border-space-600 hover:border-star-200'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <div className={`mb-8 p-5 rounded-xl border border-gold-500/20 bg-gold-500/5 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                <p className="text-sm opacity-90 font-serif leading-relaxed">{currentInfo.desc}</p>
            </div>
            
            <div className="animate-fade-in">
                {activeTab === 'overview' && (
                    <Section>
                        <div className="mb-8">
                           <div className={`${detailLabelClass} text-green-500 mb-2`}>{t.us.vibe_tags_title}</div>
                           {vibeTagsLoading && !vibeTags && (
                             <MiniLoader label={t.common.analyzing} />
                           )}
                           {!vibeTagsLoading && vibeTagsError && !vibeTags && (
                             renderOverviewSectionError('vibe_tags', vibeTagsError)
                           )}
                           {vibeTags && (
                             <div className="space-y-3">
                               <div className="flex flex-wrap gap-2">
                                 {vibeTags.vibe_tags.map((tag, i) => (
                                   <span key={i} className={`px-4 py-2 rounded-full text-sm font-bold ${theme === 'dark' ? 'bg-gold-500/20 text-gold-400' : 'bg-gold-500/15 text-gold-600'}`}>{tag}</span>
                                 ))}
                               </div>
                               <p className="font-serif text-base italic opacity-90">"{vibeTags.vibe_summary}"</p>
                             </div>
                           )}
                        </div>

                        <Section title={t.us.radar} className="mb-8">
                           <div className="grid md:grid-cols-3 gap-4">
                              {overview.overview.compatibility_scores.map((score, i) => {
                                 const rawScore = Number(score.score);
                                 const value = clampScore(Number.isFinite(rawScore) ? rawScore : 0);
                                 const tone = getRadarTone(score.dim);
                                 return (
                                   <Card key={`${score.dim}-${i}`} className={`border-l-2 ${tone.border} ${tone.soft}`}>
                                      <div className="flex items-baseline justify-between mb-2">
                                         <span className="text-xs uppercase tracking-widest opacity-60">{score.dim}</span>
                                         <span className={`text-sm font-mono ${tone.text}`}>{value}</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-space-600/30 rounded-full overflow-hidden">
                                         <div className={`h-full ${tone.bar} transition-all duration-700`} style={{ width: `${value}%` }} />
                                      </div>
                                      <div className="text-xs opacity-70 mt-2">{score.desc}</div>
                                   </Card>
                                 );
                              })}
                           </div>
                        </Section>

                        {/* Growth Task (now lazy-loaded) */}
                        <div className="mb-8">
                           <Accordion
                             title={t.us.growth_task_title}
                             subtitle={t.us.growth_task_subtitle}
                             open={!!overviewAccordionOpen.growth_task}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, growth_task: open }));
                               if (open) fetchSynastryOverviewSectionData('growth_task');
                             }}
                           >
                             {growthTaskLoading && !growthTaskLazy && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!growthTaskLoading && growthTaskError && !growthTaskLazy && (
                               renderOverviewSectionError('growth_task', growthTaskError)
                             )}
                             {(growthTaskLazy || sweetSpots.length > 0 || frictionPoints.length > 0) && (
                               <div className="space-y-6">
                                 {growthTaskLazy && (
                                   <div className={`p-4 rounded-lg border-l-2 border-purple-500 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100'}`}>
                                     <div className="font-serif text-lg mb-3">"{growthTaskLazy.growth_task.task}"</div>
                                     <div className={`${detailLabelClass} text-orange-500`}>{t.us.evidence}</div>
                                     <div className="text-xs opacity-80 mb-4">{growthTaskLazy.growth_task.evidence}</div>
                                     <div className={`${detailLabelClass} text-green-500`}>{t.us.growth_action_steps}</div>
                                     <ul className="space-y-2 text-sm">
                                       {growthTaskLazy.growth_task.action_steps.map((step, i) => (
                                         <li key={i} className="flex gap-2 items-start">
                                           <span className="text-green-500 shrink-0">{i + 1}.</span>
                                           <span className="opacity-90">{step}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                                 {sweetSpots.length > 0 && (
                                   <Card className="border-l-2 border-l-success">
                                     <h3 className="text-xs font-bold uppercase text-success mb-4 tracking-widest">{t.us.sweet}</h3>
                                     {sweetSpots.map((s, i) => (
                                       <div key={i} className="pb-4 mb-4 border-b border-space-600 last:border-b-0 last:mb-0 last:pb-0">
                                         <div className="font-bold text-sm mb-2">{s.title}</div>
                                         <div className="space-y-2 text-xs">
                                           <div>
                                             <div className={`${detailLabelClass} text-orange-500`}>{t.us.evidence}</div>
                                             <div className="opacity-80">{s.evidence}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-blue-500`}>{t.us.experience}</div>
                                             <div className="opacity-80">{s.experience}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-green-500`}>{t.us.usage}</div>
                                             <div className="opacity-80">{s.usage}</div>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </Card>
                                 )}
                                 {frictionPoints.length > 0 && (
                                   <Card className="border-l-2 border-l-danger">
                                     <h3 className="text-xs font-bold uppercase text-danger mb-4 tracking-widest">{t.us.friction}</h3>
                                     {frictionPoints.map((f, i) => (
                                       <div key={i} className="pb-4 mb-4 border-b border-space-600 last:border-b-0 last:mb-0 last:pb-0">
                                         <div className="font-bold text-sm mb-2">{f.title}</div>
                                         <div className="space-y-2 text-xs">
                                           <div>
                                             <div className={`${detailLabelClass} text-orange-500`}>{t.us.evidence}</div>
                                             <div className="opacity-80">{f.evidence}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-red-500`}>{t.us.trigger}</div>
                                             <div className="opacity-80">{f.trigger}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-red-500`}>{t.us.cost}</div>
                                             <div className="opacity-80">{f.cost}</div>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </Card>
                                 )}
                               </div>
                             )}
                           </Accordion>
                        </div>


                        <div className="mb-8">
                           <Accordion
                             title={t.us.core_dynamics_title}
                             subtitle={t.us.core_dynamics_subtitle}
                             open={!!overviewAccordionOpen.core_dynamics}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, core_dynamics: open }));
                               if (open) fetchSynastryOverviewSectionData('core_dynamics');
                             }}
                           >
                             {coreDynamicsLoading && !coreDynamics && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!coreDynamicsLoading && coreDynamicsError && !coreDynamics && (
                               renderOverviewSectionError('core_dynamics', coreDynamicsError)
                             )}
                             {coreDynamics && (
                               <div className="space-y-4">
                                 {coreDynamics.map((item, i) => {
                                   const aNeeds = stripNeedsPrefix(item.a_needs, personALabel);
                                   const bNeeds = stripNeedsPrefix(item.b_needs, personBLabel);
                                   const tone = getCoreDynamicsTone(item.key);
                                   return (
                                     <Card key={`${item.key}-${i}`} className={`border-l-2 ${tone.border} ${tone.bg}`}>
                                       <h4 className={`font-semibold text-sm mb-3 ${tone.text}`}>{item.title}</h4>
                                       <div className="space-y-4 text-sm leading-relaxed">
                                         <div>
                                           <div className={`${detailLabelClass} text-orange-500`}>{t.us.needs_difference}</div>
                                           <div className="space-y-2">
                                             <div>
                                               <span className="font-semibold">{formatNeedsLabel(personALabel)}</span>{aNeeds ? ` ${aNeeds}` : ''}
                                             </div>
                                             <div>
                                               <span className="font-semibold">{formatNeedsLabel(personBLabel)}</span>{bNeeds ? ` ${bNeeds}` : ''}
                                             </div>
                                           </div>
                                         </div>
                                         <div>
                                           <div className={`${detailLabelClass} text-red-500`}>{t.us.typical_loop}</div>
                                           <div className="opacity-90">{item.loop.trigger} → {item.loop.defense} → {item.loop.escalation}</div>
                                         </div>
                                         <div>
                                           <div className={`${detailLabelClass} text-green-500`}>{t.us.repair_script}</div>
                                           <div className="font-serif">"{item.repair.script}"</div>
                                           <div className="text-xs opacity-80 mt-2">{t.us.repair_action}: {item.repair.action}</div>
                                         </div>
                                       </div>
                                     </Card>
                                   );
                                 })}
                               </div>
                             )}
                           </Accordion>
                        </div>

                        {/* NEW: Conflict Loop (lazy-loaded) */}
                        <div className="mb-8">
                           <Accordion
                             title={t.us.conflict_loop_title}
                             subtitle={t.us.conflict_loop_subtitle}
                             open={!!overviewAccordionOpen.conflict_loop}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, conflict_loop: open }));
                               if (open) fetchSynastryOverviewSectionData('conflict_loop');
                             }}
                           >
                             {conflictLoopLoading && !conflictLoop && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!conflictLoopLoading && conflictLoopError && !conflictLoop && (
                               renderOverviewSectionError('conflict_loop', conflictLoopError)
                             )}
                             {conflictLoop && (
                               <div className="space-y-6">
                                 {/* Conflict Loop Diagram */}
                                 <Card className="border-l-2 border-l-danger">
                                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                       <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-2">{t.us.conflict_trigger}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.trigger}</div>
                                     </div>
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                       <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-2">{personALabel} {t.us.conflict_reaction}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.reaction_a}</div>
                                     </div>
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                       <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-2">{personBLabel} {t.us.conflict_defense}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.defense_b}</div>
                                     </div>
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                                       <div className="text-[10px] uppercase tracking-widest text-red-500 mb-2">{t.us.conflict_result}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.result}</div>
                                     </div>
                                   </div>
                                 </Card>

                                 {/* Repair Scripts */}
                                 <div>
                                   <div className={`${detailLabelClass} text-green-500`}>{t.us.repair_scripts_title}</div>
                                   <p className="text-xs opacity-60 mb-4">{t.us.repair_scripts_subtitle}</p>
                                   <div className="grid md:grid-cols-2 gap-4">
                                     {conflictLoop.repair_scripts.map((script, i) => (
                                        <Card key={i} className="border-l-2 border-l-green-500">
                                         <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">
                                           {script.for_person === 'a' ? personALabel : personBLabel} → {script.for_person === 'a' ? personBLabel : personALabel}
                                         </div>
                                         <div className="text-xs opacity-70 mb-2">{t.us.repair_situation}: {script.situation}</div>
                                         <div className="font-serif text-sm italic">"{script.script}"</div>
                                         <button
                                           onClick={() => navigator.clipboard.writeText(script.script)}
                                           className="mt-2 text-xs text-accent hover:underline"
                                         >
                                           {t.us.repair_copy}
                                         </button>
                                       </Card>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             )}
                           </Accordion>
                        </div>

                        <div className="mb-8">
                           <Accordion
                             title={t.us.practice_tools}
                             subtitle={t.us.practice_tools_subtitle}
                             open={!!overviewAccordionOpen.practice_tools}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, practice_tools: open }));
                               if (open) fetchSynastryOverviewSectionData('practice_tools');
                             }}
                           >
                             {practiceToolsLoading && !practiceTools && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!practiceToolsLoading && practiceToolsError && !practiceTools && (
                               renderOverviewSectionError('practice_tools', practiceToolsError)
                             )}
                             {practiceTools && (
                               <div className="space-y-4">
                                 <Card className="border-l-2 border-l-blue-500">
                                   <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">
                                     {personALabel}{t.us.practice_focus}
                                   </div>
                                   <ul className="space-y-3">
                                     {practiceTools.person_a.map((pt, i) => (
                                       <li key={i} className="text-sm leading-relaxed">
                                         <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{pt.title}</div>
                                         <div className="opacity-90">{pt.content}</div>
                                       </li>
                                     ))}
                                   </ul>
                                 </Card>
                                 <Card className="border-l-2 border-l-success">
                                   <div className="text-[10px] font-bold uppercase tracking-widest text-success mb-3">
                                     {personBLabel}{t.us.practice_focus}
                                   </div>
                                   <ul className="space-y-3">
                                     {practiceTools.person_b.map((pt, i) => (
                                       <li key={i} className="text-sm leading-relaxed">
                                         <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{pt.title}</div>
                                         <div className="opacity-90">{pt.content}</div>
                                       </li>
                                     ))}
                                   </ul>
                                 </Card>
                                 {practiceTools.joint?.length > 0 && (
                                   <Card className="border-l-2 border-l-gold-500">
                                     <div className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-3">{t.us.joint_practice}</div>
                                     <ul className="space-y-3">
                                       {practiceTools.joint.map((pt, i) => (
                                         <li key={i} className="text-sm leading-relaxed">
                                           <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{pt.title}</div>
                                           <div className="opacity-90">{pt.content}</div>
                                         </li>
                                       ))}
                                     </ul>
                                   </Card>
                                 )}
                               </div>
                             )}
                           </Accordion>
                        </div>

                        {/* NEW: Weather Forecast (lazy-loaded) */}
                        <div className="mb-8">
                           <Accordion
                             title={t.us.weather_forecast_title}
                             subtitle={t.us.weather_forecast_subtitle}
                             open={!!overviewAccordionOpen.weather_forecast}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, weather_forecast: open }));
                               if (open) fetchSynastryOverviewSectionData('weather_forecast');
                             }}
                           >
                             {weatherForecastLoading && !weatherForecast && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!weatherForecastLoading && weatherForecastError && !weatherForecast && (
                               renderOverviewSectionError('weather_forecast', weatherForecastError)
                             )}
                             {weatherForecast && (
                               <div className="space-y-6">
                                 {/* Weekly Pulse */}
                                 <Card className="border-l-2 border-l-blue-500">
                                   <h4 className={`${detailLabelClass} text-blue-500 mb-1`}>{t.us.weekly_pulse_title}</h4>
                                   <p className="text-xs opacity-60 mb-4">{t.us.weekly_pulse_subtitle}</p>

                                   {/* Headline */}
                                   <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}>
                                     <div className="font-serif text-lg">{weatherForecast.weekly_pulse.headline}</div>
                                   </div>

                                   {/* Wave Trend */}
                                   <div className="flex items-end justify-between h-12 mb-4 px-2">
                                     {weatherForecast.weekly_pulse.wave_trend.map((trend, i) => {
                                       const height = trend === 'up' ? 'h-10' : trend === 'down' ? 'h-4' : 'h-6';
                                       const color = trend === 'up' ? 'bg-success' : trend === 'down' ? 'bg-danger/60' : 'bg-blue-500/40';
                                       return <div key={i} className={`w-6 rounded-full ${height} ${color}`} />;
                                     })}
                                   </div>

                                   {/* 7 Day Cards */}
                                   <div className="grid grid-cols-7 gap-1 md:gap-2">
                                     {weatherForecast.weekly_pulse.days.map((day, i) => {
                                       const today = new Date().toISOString().split('T')[0];
                                       const isToday = day.date === today;
                                       const energyBars = Array(5).fill(0).map((_, j) => j < day.energy);
                                       return (
                                         <div key={i} className={`p-2 rounded-lg text-center ${
                                           isToday
                                             ? `ring-2 ring-blue-500 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10'}`
                                             : theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'
                                         }`}>
                                           {isToday && <div className="text-[10px] font-bold text-blue-500 mb-1">{t.us.today_label}</div>}
                                           <div className="text-xs font-medium opacity-70">{day.day_label}</div>
                                           <div className="my-1 flex justify-center"><WeatherMoodIcon emoji={day.emoji} /></div>
                                           <div className="flex justify-center gap-0.5 mb-1">
                                             {energyBars.map((filled, j) => (
                                               <div key={j} className={`w-1 h-2 rounded-full ${
                                                 filled
                                                   ? day.energy >= 4 ? 'bg-success' : day.energy <= 2 ? 'bg-danger' : 'bg-gold-500'
                                                   : 'bg-current opacity-20'
                                               }`} />
                                             ))}
                                           </div>
                                           <div className="text-[10px] opacity-80 line-clamp-2">{day.vibe}</div>
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </Card>

                                 {/* Season Ahead */}
                                 <Card className="border-l-2 border-l-gold-500">
                                   <h4 className={`${detailLabelClass} text-gold-500 mb-1`}>{t.us.season_ahead_title}</h4>
                                   <p className="text-xs opacity-60 mb-4">{t.us.season_ahead_subtitle}</p>

                                   <div className="space-y-3 mb-6">
                                     {weatherForecast.periods.map((period, i) => {
                                       const periodStyle = period.type === 'high_intensity'
                                         ? { color: 'danger', label: t.us.period_high, emoji: '⚡' }
                                         : period.type === 'sweet_spot'
                                         ? { color: 'success', label: t.us.period_sweet, emoji: '🌿' }
                                         : { color: 'blue-500', label: t.us.period_deep, emoji: '🌊' };
                                       return (
                                         <div key={i} className={`p-3 rounded-lg border-l-2 ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`} style={{ borderLeftColor: `var(--color-${periodStyle.color})` }}>
                                           <div className="flex items-center gap-2 mb-2">
                                             <span className="text-base" aria-hidden="true">{periodStyle.emoji}</span>
                                             <span className="text-xs font-bold uppercase">{periodStyle.label}</span>
                                             <span className="text-xs opacity-60">{period.start_date} → {period.end_date}</span>
                                           </div>
                                           <p className="text-sm mb-2">{period.description}</p>
                                           <p className="text-xs opacity-80 italic">{period.advice}</p>
                                         </div>
                                       );
                                     })}
                                   </div>

                                   {/* Critical Dates */}
                                   <div className={detailLabelClass}>{t.us.critical_dates_title}</div>
                                   <div className="space-y-3 mt-3">
                                     {weatherForecast.critical_dates.map((date, i) => (
                                       <div key={i} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                         <div className="flex items-center gap-2 mb-2">
                                           <span className="font-mono text-sm text-star-200">{date.date}</span>
                                           <span className="text-sm">{date.event}</span>
                                         </div>
                                         <div className="grid grid-cols-2 gap-4 text-xs">
                                           <div>
                                             <span className="text-success font-bold">{t.us.dates_dos}:</span>
                                             <ul className="mt-1 space-y-1">
                                               {date.dos.map((d, j) => <li key={j} className="opacity-90">• {d}</li>)}
                                             </ul>
                                           </div>
                                           <div>
                                             <span className="text-danger font-bold">{t.us.dates_donts}:</span>
                                             <ul className="mt-1 space-y-1">
                                               {date.donts.map((d, j) => <li key={j} className="opacity-90">• {d}</li>)}
                                             </ul>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 </Card>
                               </div>
                             )}
                           </Accordion>
                        </div>

                        <Card className="border-l-2 border-l-gold-500/60">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-3">{t.us.conclusion}</div>
                            <p className="text-sm font-serif leading-relaxed opacity-90 mb-4">"{overview.conclusion.summary}"</p>
                            <div className="border-l-2 border-space-600 pl-3 text-xs text-star-300">
                                {overview.conclusion.disclaimer}
                            </div>
                        </Card>

                        <Section className="mt-8">
                           <Accordion
                             title={t.us.highlights}
                             subtitle={t.us.highlights_subtitle}
                             open={!!overviewAccordionOpen.highlights}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, highlights: open }));
                               if (open) fetchSynastryOverviewSectionData('highlights');
                             }}
                           >
                             {highlightsLoading && !highlights && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!highlightsLoading && highlightsError && !highlights && (
                               renderOverviewSectionError('highlights', highlightsError)
                             )}
                             {highlights && (
                               <>
                                 <div className="space-y-4">
                                  <Card className="border-l-2 border-l-success">
                                     <div className="text-xs font-bold uppercase tracking-widest text-success mb-4">{t.us.top_harmony}</div>
                                      <div className="space-y-3 text-sm">
                                         {highlights.harmony.map((item, i) => (
                                            <div key={`${item.aspect}-${i}`} className="pb-3 border-b border-space-600 last:border-b-0 last:pb-0">
                                               <div className="font-semibold text-xs mb-2">{item.aspect}</div>
                                               <div>
                                                  <div className={detailLabelClass}>{t.us.experience}</div>
                                                  <div className="opacity-85">{item.experience}</div>
                                               </div>
                                               <div className="mt-2">
                                                  <div className={detailLabelClass}>{t.us.action}</div>
                                                  <div className="opacity-85">{item.advice}</div>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </Card>
                                   <Card className="border-l-2 border-l-danger">
                                      <div className="text-xs font-bold uppercase tracking-widest text-danger mb-4">{t.us.top_challenges}</div>
                                      <div className="space-y-3 text-sm">
                                         {highlights.challenges.map((item, i) => (
                                            <div key={`${item.aspect}-${i}`} className="pb-3 border-b border-space-600 last:border-b-0 last:pb-0">
                                               <div className="font-semibold text-xs mb-2">{item.aspect}</div>
                                               <div>
                                                  <div className={detailLabelClass}>{t.us.conflict_label}</div>
                                                  <div className="opacity-85">{item.conflict}</div>
                                               </div>
                                               <div className="mt-2">
                                                  <div className={detailLabelClass}>{t.us.action}</div>
                                                  <div className="opacity-85">{item.mitigation}</div>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </Card>
                                  <Card className="border-l-2 border-l-accent">
                                      <div className="text-xs font-bold uppercase tracking-widest text-accent mb-4">{t.us.highlights_overlays}</div>
                                      <div className="space-y-3 text-sm">
                                         {highlights.overlays.map((item, i) => (
                                            <div key={`${item.overlay}-${i}`} className="pb-3 border-b border-space-600 last:border-b-0 last:pb-0">
                                               <div className="font-semibold text-xs mb-2">{item.overlay}</div>
                                               <div className="opacity-85">{item.meaning}</div>
                                            </div>
                                         ))}
                                      </div>
                                   </Card>
                                 </div>
                                 <div className="mt-6 p-4 rounded-lg border border-space-600/60 bg-space-900/60 text-xs text-star-300">
                                    <span className="font-semibold mr-2">{t.us.accuracy_note}</span>
                                    {highlights.accuracy_note}
                                 </div>
                               </>
                             )}
                           </Accordion>
                        </Section>
                    </Section>
                )}

                {activeTab === 'natal_a' && (
                     <Section title={`${personALabel}${t.us.possessive_script}`}>
                         {profileA && (
                           <div className="mb-8 flex justify-center">
                             <div className="relative w-full">
                              <AstroChart type="natal" profile={profileA} config={NATAL_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                             </div>
                           </div>
                         )}
                         {scriptA ? (
                           <NatalScriptCard title={`${personALabel}`} script={scriptA} colorClass="border-l-accent/70" />
                         ) : (
                           <MiniLoader label={t.common.analyzing} error={segmentLoading.natal_a ? null : (segmentErrors.natal_a || t.us.report_ai_failed)} />
                         )}
                         {renderTechnicalSection(technical ? renderExtendedAppendix(technical.natal_a, 'natal') : null)}
                     </Section>
                )}

                {activeTab === 'natal_b' && (
                     <Section title={`${personBLabel}${t.us.possessive_script}`}>
                         {profileB && (
                           <div className="mb-8 flex justify-center">
                             <div className="relative w-full">
                              <AstroChart type="natal" profile={profileB} config={NATAL_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                             </div>
                           </div>
                         )}
                         {scriptB ? (
                           <NatalScriptCard title={`${personBLabel}`} script={scriptB} colorClass="border-l-accent/70" />
                         ) : (
                           <MiniLoader label={t.common.analyzing} error={segmentLoading.natal_b ? null : (segmentErrors.natal_b || t.us.report_ai_failed)} />
                         )}
                         {renderTechnicalSection(technical ? renderExtendedAppendix(technical.natal_b, 'natal') : null)}
                     </Section>
                )}

                {activeTab === 'syn_ab' && (
                    <Section title={`${personALabel} → ${personBLabel}`}>
                        {profileA && profileB && (
                          <div className="mb-8 flex justify-center">
                            <div className="relative w-full">
                              <AstroChart type="synastry" profile={profileA} partnerProfile={profileB} config={SYNASTRY_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                            </div>
                          </div>
                        )}
                        {perspectiveAB ? (
                          <PerspectiveCard
                              data={perspectiveAB}
                              perspective="a_view"
                              selfName={personALabel}
                              otherName={personBLabel}
                          />
                        ) : (
                          <MiniLoader label={t.common.analyzing} error={segmentLoading.syn_ab ? null : (segmentErrors.syn_ab || t.us.report_ai_failed)} />
                        )}
                        {renderTechnicalSection(technical ? renderComparisonAppendix(technical.syn_ab, true) : null)}
                    </Section>
                )}

                {activeTab === 'syn_ba' && (
                    <Section title={`${personBLabel} → ${personALabel}`}>
                        {profileA && profileB && (
                          <div className="mb-8 flex justify-center">
                            <div className="relative w-full">
                              <AstroChart type="synastry" profile={profileB} partnerProfile={profileA} config={SYNASTRY_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                            </div>
                          </div>
                        )}
                        {perspectiveBA ? (
                          <PerspectiveCard
                              data={perspectiveBA}
                              perspective="b_view"
                              selfName={personBLabel}
                              otherName={personALabel}
                          />
                        ) : (
                          <MiniLoader label={t.common.analyzing} error={segmentLoading.syn_ba ? null : (segmentErrors.syn_ba || t.us.report_ai_failed)} />
                        )}
                        {renderTechnicalSection(technical ? renderComparisonAppendix(technical.syn_ba, false) : null)}
                    </Section>
                )}

                {activeTab === 'composite' && (
                    <Section title={t.us.tab_composite}>
                        {profileA && profileB && (
                          <div className="mb-8 flex justify-center">
                            <div className="relative w-full">
                              <AstroChart type="composite" profile={profileA} partnerProfile={profileB} config={COMPOSITE_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                            </div>
                          </div>
                        )}
                        {composite ? (
                          (() => {
                            // Detect v4 "The Entity" structure
                            const isV4 = Boolean(composite.vibe_check);

                            if (isV4) {
                              // V4 "The Entity" rendering
                              const vibe = composite.vibe_check!;
                              const heart = composite.heart_of_us!;
                              const daily = composite.daily_rhythm!;
                              const soul = composite.soul_contract!;
                              const me = composite.me_within_us!;

                              return (
                                <>
                                  {/* Section 1: The Vibe Check */}
                                  <Section title={t.us.entity_vibe_title} className="mb-8">
                                    <Card className="border-l-2 border-l-green-500">
                                      <div className="mb-4">
                                        <div className={`${DETAIL_LABEL_CLASS} text-green-500 mb-2`}>{t.us.entity_archetype}</div>
                                        <div className="text-xl font-serif font-medium">{vibe.archetype}</div>
                                      </div>
                                      <div className="mb-4">
                                        <div className={`${DETAIL_LABEL_CLASS} mb-2`}>{t.us.entity_element_climate}</div>
                                        <p className="text-sm opacity-90">{vibe.element_climate}</p>
                                      </div>
                                      <div className={`pt-4 border-t border-dashed ${theme === 'dark' ? 'border-space-600' : 'border-paper-300'}`}>
                                        <div className={`${DETAIL_LABEL_CLASS} mb-2`}>{t.us.entity_one_liner}</div>
                                        <p className="font-serif text-base italic opacity-90">"{vibe.one_liner}"</p>
                                      </div>
                                    </Card>
                                  </Section>

                                  {/* Section 2: The Heart of "Us" */}
                                  <Section title={t.us.entity_heart_title} className="mb-8">
                                    <div className="space-y-4">
                                      <div className="grid md:grid-cols-3 gap-4">
                                        <Card className="flex gap-4 items-start border-l-2 border-l-red-500 h-full">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-red-500/15 text-red-500' : 'bg-red-500/10 text-red-500'}`}>☉</div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`${DETAIL_LABEL_CLASS} text-red-500`}>{t.us.entity_heart_sun}</span>
                                              <Chip label={heart.sun.sign_house} />
                                            </div>
                                            <p className="text-sm opacity-90">{heart.sun.meaning}</p>
                                          </div>
                                        </Card>
                                        <Card className="flex gap-4 items-start border-l-2 border-l-blue-500 h-full">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-blue-500/15 text-blue-500' : 'bg-blue-500/10 text-blue-500'}`}>☽</div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`${DETAIL_LABEL_CLASS} text-blue-500`}>{t.us.entity_heart_moon}</span>
                                              <Chip label={heart.moon.sign_house} />
                                            </div>
                                            <p className="text-sm opacity-90">{heart.moon.meaning}</p>
                                          </div>
                                        </Card>
                                        <Card className="flex gap-4 items-start border-l-2 border-l-gold-500 h-full">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-gold-500/15 text-gold-500' : 'bg-gold-500/10 text-gold-500'}`}>↑</div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`${DETAIL_LABEL_CLASS} text-gold-500`}>{t.us.entity_heart_rising}</span>
                                              <Chip label={heart.rising.sign_house} />
                                            </div>
                                            <p className="text-sm opacity-90">{heart.rising.meaning}</p>
                                          </div>
                                        </Card>
                                      </div>
                                      <Card className="border-l-2 border-l-blue-500">
                                        <div className={`${DETAIL_LABEL_CLASS} text-blue-500 mb-2`}>{t.us.entity_heart_summary}</div>
                                        <p className="text-sm leading-relaxed opacity-90">{heart.summary}</p>
                                      </Card>
                                    </div>
                                  </Section>

                                  {/* Section 3: The Daily Rhythm */}
                                  <Section title={t.us.entity_daily_title} className="mb-8">
                                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                                      <Card className="flex gap-4 items-start border-l-2 border-l-blue-400 h-full">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-blue-400/15 text-blue-400' : 'bg-blue-400/10 text-blue-400'}`}>☿</div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`${DETAIL_LABEL_CLASS} text-blue-400`}>{t.us.entity_daily_mercury}</span>
                                            <Chip label={daily.mercury.sign_house} />
                                          </div>
                                          <p className="text-sm opacity-90">{daily.mercury.style}</p>
                                        </div>
                                      </Card>
                                      <Card className="flex gap-4 items-start border-l-2 border-l-pink-500 h-full">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-pink-500/15 text-pink-500' : 'bg-pink-500/10 text-pink-500'}`}>♀</div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`${DETAIL_LABEL_CLASS} text-pink-500`}>{t.us.entity_daily_venus}</span>
                                            <Chip label={daily.venus.sign_house} />
                                          </div>
                                          <p className="text-sm opacity-90">{daily.venus.style}</p>
                                        </div>
                                      </Card>
                                      <Card className="flex gap-4 items-start border-l-2 border-l-orange-500 h-full">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${theme === 'dark' ? 'bg-orange-500/15 text-orange-500' : 'bg-orange-500/10 text-orange-500'}`}>♂</div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`${DETAIL_LABEL_CLASS} text-orange-500`}>{t.us.entity_daily_mars}</span>
                                            <Chip label={daily.mars.sign_house} />
                                          </div>
                                          <p className="text-sm opacity-90">{daily.mars.style}</p>
                                        </div>
                                      </Card>
                                    </div>
                                    <Card className="border-l-2 border-l-green-500">
                                      <h4 className={`${DETAIL_LABEL_CLASS} text-green-500 mb-3`}>{t.us.entity_daily_tips}</h4>
                                      <div className="space-y-2">
                                        {daily.maintenance_tips.map((tip, i) => (
                                          <div key={i} className="flex gap-2 items-start">
                                            <span className="text-green-500 shrink-0">✓</span>
                                            <span className="text-sm opacity-90">{tip}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </Card>
                                  </Section>

                                  {/* Section 4: The Soul Contract */}
                                  <Section title={t.us.entity_soul_title} className="mb-8">
                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                      <Card className="border-l-2 border-l-purple-500">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`${DETAIL_LABEL_CLASS} text-purple-500`}>{t.us.entity_soul_saturn}</span>
                                          <Chip label={soul.saturn.sign_house} />
                                        </div>
                                        <p className="text-sm opacity-90">{soul.saturn.lesson}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-purple-500">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`${DETAIL_LABEL_CLASS} text-purple-500`}>{t.us.entity_soul_pluto}</span>
                                          <Chip label={soul.pluto.sign_house} />
                                        </div>
                                        <p className="text-sm opacity-90">{soul.pluto.lesson}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-red-500">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`${DETAIL_LABEL_CLASS} text-red-500`}>{t.us.entity_soul_chiron}</span>
                                          <Chip label={soul.chiron.sign_house} />
                                        </div>
                                        <p className="text-sm opacity-90">{soul.chiron.lesson}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-gold-500">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`${DETAIL_LABEL_CLASS} text-gold-500`}>{t.us.entity_soul_north_node}</span>
                                          <Chip label={soul.north_node.sign_house} />
                                        </div>
                                        <p className="text-sm opacity-90">{soul.north_node.lesson}</p>
                                      </Card>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <Card className="border-l-2 border-l-red-500">
                                        <span className={`${DETAIL_LABEL_CLASS} text-red-500 block mb-2`}>{t.us.entity_soul_stuck}</span>
                                        <p className="text-sm font-medium">{soul.stuck_point}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-green-500">
                                        <span className={`${DETAIL_LABEL_CLASS} text-green-500 block mb-2`}>{t.us.entity_soul_breakthrough}</span>
                                        <p className="text-sm font-medium">{soul.breakthrough}</p>
                                      </Card>
                                    </div>
                                    {soul.summary && (
                                      <Card className="mt-4 border-l-2 border-l-gold-500">
                                        <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.entity_soul_summary}</div>
                                        <p className="text-sm leading-relaxed opacity-90">{soul.summary}</p>
                                      </Card>
                                    )}
                                  </Section>

                                  {/* Section 5: The "Me" within "Us" */}
                                  <Section title={t.us.entity_me_title}>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <Card className="border-l-2 border-l-blue-500">
                                        <div className="flex items-center gap-2 mb-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-500/15 text-blue-500'}`}>A</div>
                                          <span className={`${DETAIL_LABEL_CLASS} text-blue-500`}>{personALabel}</span>
                                        </div>
                                        <div className="font-serif text-base mb-2">{me.impact_on_a.headline}</div>
                                        <p className="text-sm opacity-90">{me.impact_on_a.description}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-purple-500">
                                        <div className="flex items-center gap-2 mb-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-purple-500/20 text-purple-500' : 'bg-purple-500/15 text-purple-500'}`}>B</div>
                                          <span className={`${DETAIL_LABEL_CLASS} text-purple-500`}>{personBLabel}</span>
                                        </div>
                                        <div className="font-serif text-base mb-2">{me.impact_on_b.headline}</div>
                                        <p className="text-sm opacity-90">{me.impact_on_b.description}</p>
                                      </Card>
                                    </div>
                                  </Section>
                                </>
                              );
                            } else {
                              // Legacy v3.0 fallback
                                  return (
                                <>
                                  <Section title={compositeKeyTitle} className="mb-8">
                                    <Card className="border-l-2 border-l-gold-500">
                                      <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.comp_temperament}</div>
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <Chip label={composite.temperament?.dominant || ''} />
                                        <span className={DETAIL_LABEL_CLASS}>{composite.temperament?.mode || ''}</span>
                                      </div>
                                      <p className="text-sm leading-relaxed opacity-90">{composite.temperament?.analogy || ''}</p>
                                    </Card>
                                  </Section>

                                  <Section title={t.us.comp_personality} className="mb-8">
                                    <div className="space-y-4">
                                      <Card className="border-l-2 border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_sun}</div>
                                        <p className="text-sm">{composite.core?.sun || ''}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_moon}</div>
                                        <p className="text-sm">{composite.core?.moon || ''}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_rising}</div>
                                        <p className="text-sm">{composite.core?.rising || ''}</p>
                                      </Card>
                                      {composite.core?.summary && (
                                        <Card className="border-l-2 border-l-gold-500">
                                          <div className="text-xs font-bold uppercase text-gold-500 mb-3 tracking-widest">{t.us.comp_summary_title}</div>
                                          <div className="space-y-3 text-sm">
                                            <div>
                                              <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_summary_outer}</div>
                                              <p className="opacity-90">{composite.core.summary.outer}</p>
                                            </div>
                                            <div>
                                              <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_summary_inner}</div>
                                              <p className="opacity-90">{composite.core.summary.inner}</p>
                                            </div>
                                            <div>
                                              <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_summary_growth}</div>
                                              <p className="opacity-90">{composite.core.summary.growth}</p>
                                            </div>
                                          </div>
                                        </Card>
                                      )}
                                    </div>
                                  </Section>

                                  <Section title={t.us.comp_daily} className="mb-8">
                                    <div className="space-y-4 mb-6">
                                      <Card className="flex gap-4 items-start border-l-2 border-l-accent/40">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'}`}>☿</div>
                                        <div>
                                          <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_communication}</div>
                                          <p className="text-sm">{composite.daily?.mercury || ''}</p>
                                        </div>
                                      </Card>
                                      <Card className="flex gap-4 items-start border-l-2 border-l-accent/40">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'}`}>♀</div>
                                        <div>
                                          <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_joy}</div>
                                          <p className="text-sm">{composite.daily?.venus || ''}</p>
                                        </div>
                                      </Card>
                                      <Card className="flex gap-4 items-start border-l-2 border-l-danger/60">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-danger/15 text-danger' : 'bg-danger/10 text-danger'}`}>♂</div>
                                        <div>
                                          <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_action}</div>
                                          <p className="text-sm">{composite.daily?.mars || ''}</p>
                                        </div>
                                      </Card>
                                    </div>
                                    {composite.daily?.maintenance_list && composite.daily.maintenance_list.length > 0 && (
                                      <Card className="border-l-2 border-l-success/60">
                                        <h4 className={`${DETAIL_LABEL_CLASS} text-success mb-3`}>{t.us.comp_maintenance}</h4>
                                        <div className="space-y-2">
                                          {composite.daily.maintenance_list.map((item, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                              <span className="text-success">✓</span>
                                              <span className="text-sm opacity-90">{item}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </Card>
                                    )}
                                  </Section>

                                  <Section title={t.us.comp_karmic} className="mb-8">
                                    <div className="space-y-4">
                                      <Card className="border-l-2 border-l-star-200/60">
                                        <div className={`${DETAIL_LABEL_CLASS} text-star-200 mb-2`}>{t.us.comp_saturn}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.saturn || ''}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-danger/60">
                                        <div className={`${DETAIL_LABEL_CLASS} text-danger mb-2`}>{t.us.comp_pluto}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.pluto || ''}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-accent/60">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_nodes}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.nodes || ''}</p>
                                      </Card>
                                      <Card className="border-l-2 border-l-gold-500/60">
                                        <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.comp_chiron}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.chiron || ''}</p>
                                      </Card>
                                    </div>
                                    {composite.karmic?.conclusion && (
                                      <div className="space-y-4 mt-6">
                                        <Card className="border-l-2 border-l-danger/60">
                                          <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.comp_stuck}</span>
                                          <p className="text-sm font-medium">{composite.karmic.conclusion.stuck_point}</p>
                                        </Card>
                                        <Card className="border-l-2 border-l-success/60">
                                          <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>{t.us.comp_growth}</span>
                                          <p className="text-sm font-medium">{composite.karmic.conclusion.growth_point}</p>
                                        </Card>
                                      </div>
                                    )}
                                  </Section>

                                  {composite.synthesis && (
                                    <Section title={t.us.comp_synthesis}>
                                      <Card className="border-l-2 border-l-star-200/40">
                                        <div className="space-y-4">
                                          <div>
                                            <span className={`${DETAIL_LABEL_CLASS} block mb-2`}>{t.us.comp_house}</span>
                                            <p className="text-sm leading-relaxed">{composite.synthesis.house_focus}</p>
                                          </div>
                                          <div className={`pt-4 border-t border-dashed ${theme === 'dark' ? 'border-space-600' : 'border-paper-300'}`}>
                                            <div className="space-y-3 text-sm">
                                              <div>
                                                <span className={`${DETAIL_LABEL_CLASS} text-star-200 block mb-1`}>{personALabel} {t.us.comp_impact_on}</span>
                                                <p className="opacity-90">{composite.synthesis.impact_on_a}</p>
                                              </div>
                                              <div>
                                                <span className={`${DETAIL_LABEL_CLASS} text-star-200 block mb-1`}>{personBLabel} {t.us.comp_impact_on}</span>
                                                <p className="opacity-90">{composite.synthesis.impact_on_b}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    </Section>
                                  )}
                                </>
                              );
                            }
                          })()
                        ) : (
                          <MiniLoader label={t.common.analyzing} error={segmentLoading.composite ? null : (segmentErrors.composite || t.us.report_ai_failed)} />
                        )}
                        {renderTechnicalSection(technical ? renderExtendedAppendix(technical.composite, 'composite') : null)}
                    </Section>
                )}

            </div>

            <FrameworkDisclaimer />

            {/* 合盘详情解读弹窗 */}
            <DetailModal
              open={synastryDetailModal.open}
              onClose={closeSynastryDetailModal}
              loading={synastryDetailModal.loading}
              error={synastryDetailModal.error}
              content={synastryDetailModal.content}
              title={
                synastryDetailModal.type === 'elements' ? t.detail.modal_title_elements
                  : synastryDetailModal.type === 'aspects' ? t.detail.modal_title_aspects
                  : synastryDetailModal.type === 'planets' ? t.detail.modal_title_planets
                  : synastryDetailModal.type === 'asteroids' ? t.detail.modal_title_asteroids
                  : t.detail.modal_title_rulers
              }
              keyPointsLabel={t.detail.key_points}
              onRetry={retrySynastryDetail}
            />
        </Container>
    );
};

type AskCategoryKey = keyof typeof PRESET_QUESTIONS['en'];

type AskReportSection = {
    title: string;
    body: string;
};

const cleanAskReportBody = (raw: string): string => {
    if (!raw) return raw;
    return raw
        .split('\n')
        .map((line) => {
            let text = line.replace(/^\s*[*-]\s+/, '');
            text = text.replace(/\*\*(.*?)\*\*/g, '$1');
            text = text.replace(/\*(.*?)\*/g, '$1');
            text = text.replace(/`([^`]+)`/g, '$1');
            return text;
        })
        .join('\n')
        .trim();
};

// Planet name mappings for extraction from Astrological Signature section
const PLANET_NAME_ALIASES: Record<string, string> = {
    // English names
    'sun': 'Sun', 'moon': 'Moon', 'mercury': 'Mercury', 'venus': 'Venus',
    'mars': 'Mars', 'jupiter': 'Jupiter', 'saturn': 'Saturn',
    'uranus': 'Uranus', 'neptune': 'Neptune', 'pluto': 'Pluto',
    'ascendant': 'Ascendant', 'asc': 'Ascendant', 'rising': 'Ascendant',
    'midheaven': 'Midheaven', 'mc': 'Midheaven',
    'north node': 'North Node', 'nn': 'North Node',
    'south node': 'South Node', 'sn': 'South Node',
    'chiron': 'Chiron', 'lilith': 'Lilith', 'black moon lilith': 'Lilith',
    'descendant': 'Descendant', 'dc': 'Descendant', 'desc': 'Descendant',
    'ic': 'IC', 'imum coeli': 'IC',
    // Chinese names
    '太阳': 'Sun', '月亮': 'Moon', '水星': 'Mercury', '金星': 'Venus',
    '火星': 'Mars', '木星': 'Jupiter', '土星': 'Saturn',
    '天王星': 'Uranus', '海王星': 'Neptune', '冥王星': 'Pluto',
    '上升': 'Ascendant', '上升点': 'Ascendant',
    '天顶': 'Midheaven', '中天': 'Midheaven',
    '北交点': 'North Node', '南交点': 'South Node',
    '凯龙': 'Chiron', '凯龙星': 'Chiron',
    '莉莉丝': 'Lilith', '黑月莉莉丝': 'Lilith',
    '下降': 'Descendant', '下降点': 'Descendant',
    '天底': 'IC',
};

// Extract planet names mentioned in the Astrological Signature section
// Returns planet names with T- prefix for transit planets (行运) and without prefix for natal planets (本命)
const extractPlanetsFromSignature = (sections: AskReportSection[]): string[] => {
    // Find the signature section (check multiple possible titles)
    const signatureSection = sections.find((s) => {
        const title = s.title.toLowerCase();
        return title.includes('signature') || title.includes('星盘密码') || title.includes('星盘特征') || title.includes('星象');
    });

    if (!signatureSection) return [];

    const planets = new Set<string>();
    const body = signatureSection.body;

    // Sort planet aliases by length (longest first) to avoid partial matches
    const sortedAliases = Object.keys(PLANET_NAME_ALIASES).sort((a, b) => b.length - a.length);

    // Create a regex pattern for all planet names
    // Escape special regex characters in planet names
    const escapedAliases = sortedAliases.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const planetNamesPattern = escapedAliases.join('|');

    // Pattern 1: Transit planet patterns (行运X, transit X) → add T- prefix
    const transitPattern = new RegExp(`(?:行运|transit)\\s*(${planetNamesPattern})`, 'gi');

    // Pattern 2: Natal planet patterns (本命X, natal X) → no prefix
    const natalPattern = new RegExp(`(?:本命|natal)\\s*(${planetNamesPattern})`, 'gi');

    // Pattern 3: Direct planet name mentions without prefix (assume natal for compatibility)
    const directPattern = new RegExp(`(${planetNamesPattern})`, 'gi');

    let match;

    // Track which planets were explicitly marked as transit or natal
    const explicitTransit = new Set<string>();
    const explicitNatal = new Set<string>();

    // Extract transit planets (with T- prefix)
    while ((match = transitPattern.exec(body)) !== null) {
        const key = match[1].toLowerCase();
        const normalized = PLANET_NAME_ALIASES[key];
        if (normalized) {
            planets.add(`T-${normalized}`);
            explicitTransit.add(normalized);
        }
    }

    // Extract natal planets (no prefix)
    while ((match = natalPattern.exec(body)) !== null) {
        const key = match[1].toLowerCase();
        const normalized = PLANET_NAME_ALIASES[key];
        if (normalized) {
            planets.add(normalized);
            explicitNatal.add(normalized);
        }
    }

    // Extract all direct mentions of planet names
    // For planets not explicitly marked, add as natal (no prefix)
    while ((match = directPattern.exec(body)) !== null) {
        const key = match[1].toLowerCase();
        const normalized = PLANET_NAME_ALIASES[key];
        if (normalized) {
            // Only add if not already explicitly categorized
            if (!explicitTransit.has(normalized) && !explicitNatal.has(normalized)) {
                planets.add(normalized);
            }
        }
    }

    return Array.from(planets);
};

const normalizeAskReportText = (raw: string): string => {
    if (!raw) return raw;
    let normalized = raw.replace(/\r\n/g, '\n');
    normalized = normalized.replace(/([^\n])\s*(##\s+)/g, '$1\n$2');
    return normalized;
};

const parseAskReportSections = (raw: string): AskReportSection[] => {
    if (!raw) return [];
    const lines = normalizeAskReportText(raw).split('\n');
    const sections: AskReportSection[] = [];
    let currentTitle: string | null = null;
    let currentBody: string[] = [];

    const pushSection = () => {
        if (!currentTitle && currentBody.length === 0) return;
        const body = cleanAskReportBody(currentBody.join('\n'));
        sections.push({ title: currentTitle || '', body });
    };

    // Regex patterns for section headers
    const h2Pattern = /^##\s+/;
    const numberedPattern = /^(\d+)[.、．]\s*/;
    const sectionMatchers: Array<{ key: string; patterns: RegExp[] }> = [
        { key: 'essence', patterns: [/^the essence$/i, /^核心洞察$/, /^本质洞察$/] },
        { key: 'signature', patterns: [/^the astrological signature$/i, /^星盘密码$/, /^星盘特征$/] },
        { key: 'deep_dive', patterns: [/^deep dive analysis$/i, /^deep dive$/i, /^深度解码$/, /^深度分析$/] },
        { key: 'soulwork', patterns: [/^soulwork$/i, /^灵魂功课$/, /^灵魂练习$/] },
        { key: 'takeaway', patterns: [/^the cosmic takeaway/i, /^cosmic takeaway/i, /^conclusion$/i, /^宇宙寄语$/, /^结语$/] },
    ];

    lines.forEach((line) => {
        const trimmed = line.trim();
        const cleaned = trimmed.replace(/[:：]$/, '').trim();

        // Check for ## headers
        if (h2Pattern.test(trimmed)) {
            pushSection();
            currentTitle = trimmed.replace(h2Pattern, '').trim();
            currentBody = [];
            return;
        }

        // Check for numbered sections (1. 2. 3. or 1、2、3、)
        const numberedMatch = trimmed.match(numberedPattern);
        if (numberedMatch && trimmed.length > 3) {
            pushSection();
            currentTitle = trimmed.replace(numberedPattern, '').trim();
            currentBody = [];
            return;
        }

        const sectionMatch = sectionMatchers.find((matcher) =>
            matcher.patterns.some((pattern) => pattern.test(cleaned))
        );
        if (sectionMatch) {
            pushSection();
            currentTitle = cleaned;
            currentBody = [];
            return;
        }

        // Add to current body
        if (currentTitle !== null || sections.length === 0) {
            currentBody.push(line);
        }
    });

    pushSection();
    if (sections.length > 0) return sections;
    return [{ title: '', body: cleanAskReportBody(raw) }];
};

const localizeAskSectionTitle = (
    title: string,
    lang: T.Language,
    t: typeof TRANSLATIONS['en']
): string => {
    if (!title) return title;
    const normalized = title.trim().toLowerCase();
    const matchers: Array<{ key: keyof typeof t.ask.report_sections; patterns: RegExp[] }> = [
        { key: 'essence', patterns: [/the essence/i, /核心洞察/, /本质洞察/ ] },
        { key: 'signature', patterns: [/astrological signature/i, /星盘密码/, /星盘特征/ ] },
        { key: 'deep_dive', patterns: [/deep dive/i, /deep analysis/i, /深度解码/, /深度分析/ ] },
        { key: 'soulwork', patterns: [/soulwork/i, /灵魂功课/, /灵魂练习/ ] },
        { key: 'takeaway', patterns: [/cosmic takeaway/i, /conclusion/i, /结语/, /宇宙寄语/ ] },
    ];
    for (const matcher of matchers) {
        if (matcher.patterns.some((pattern) => pattern.test(normalized) || pattern.test(title))) {
            return t.ask.report_sections?.[matcher.key] || title;
        }
    }
    return title;
};

const localizeAskReportBody = (
    body: string,
    lang: T.Language,
    t: typeof TRANSLATIONS['en']
): string => {
    if (!body) return body;
    const labels = t.ask.report_labels;
    const isZh = lang === 'zh';
    const separator = isZh ? '：' : ': ';
    const labelMatchers: Array<{ key: keyof typeof labels; patterns: RegExp[] }> = [
        { key: 'headline', patterns: [/^headline\s*[:：]/i, /^标题\s*[:：]/] },
        { key: 'insight', patterns: [/^the insight\s*[:：]/i, /^核心洞察\s*[:：]/] },
        { key: 'mirror', patterns: [/^the mirror\s*[:：]/i, /^看见\s*[:：]/] },
        { key: 'root', patterns: [/^the root\s*[:：]/i, /^根源\s*[:：]/] },
        { key: 'shadow', patterns: [/^the shadow\s*[:：]/i, /^阴影\s*[:：]/] },
        { key: 'light', patterns: [/^the light\s*[:：]/i, /^转化\s*[:：]/] },
        { key: 'journal', patterns: [/^journal prompt\s*[:：]/i, /^觉察日记\s*[:：]/, /^觉醒日记\s*[:：]/] },
        { key: 'micro', patterns: [/^micro-?habit\s*[:：]/i, /^微行动\s*[:：]/] },
        { key: 'summary', patterns: [/^summary\s*[:：]/i, /^结语\s*[:：]/] },
        { key: 'affirmation', patterns: [/^affirmation\s*[:：]/i, /^能量咒语\s*[:：]/] },
    ];
    const labelOnlyMatchers: Array<{ key: keyof typeof labels; patterns: RegExp[] }> = [
        { key: 'headline', patterns: [/^headline$/i, /^标题$/] },
        { key: 'insight', patterns: [/^the insight$/i, /^核心洞察$/] },
        { key: 'mirror', patterns: [/^the mirror$/i, /^看见$/] },
        { key: 'root', patterns: [/^the root$/i, /^根源$/] },
        { key: 'shadow', patterns: [/^the shadow$/i, /^阴影$/] },
        { key: 'light', patterns: [/^the light$/i, /^转化$/] },
        { key: 'journal', patterns: [/^journal prompt$/i, /^觉察日记$/i, /^觉醒日记$/i] },
        { key: 'micro', patterns: [/^micro-?habit$/i, /^微行动$/] },
        { key: 'summary', patterns: [/^summary$/i, /^结语$/] },
        { key: 'affirmation', patterns: [/^affirmation$/i, /^能量咒语$/] },
    ];
    const lines = body.split('\n');
    const output: string[] = [];
    const isLabelOnlyLine = (text: string) =>
        labelOnlyMatchers.some((matcher) => matcher.patterns.some((pattern) => pattern.test(text)));
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const trimmed = line.trim();
        if (!trimmed) continue;
        let matched = false;
        for (const matcher of labelMatchers) {
            const match = matcher.patterns.find((pattern) => pattern.test(trimmed));
            if (match) {
                const rest = trimmed.replace(match, '').trim();
                const label = labels?.[matcher.key] || trimmed.replace(match, '').trim();
                output.push(rest ? `${label}${separator}${rest}` : `${label}${separator}`.trim());
                matched = true;
                break;
            }
        }
        if (matched) continue;
        for (const matcher of labelOnlyMatchers) {
            const match = matcher.patterns.find((pattern) => pattern.test(trimmed));
            if (match) {
                const label = labels?.[matcher.key] || trimmed;
                let nextIndex = index + 1;
                while (nextIndex < lines.length && !lines[nextIndex].trim()) {
                    nextIndex += 1;
                }
                if (nextIndex < lines.length && !isLabelOnlyLine(lines[nextIndex].trim())) {
                    const content = lines[nextIndex].trim();
                    output.push(`${label}${separator}${content}`);
                    index = nextIndex;
                } else {
                    output.push(`${label}${separator}`.trim());
                }
                matched = true;
                break;
            }
        }
        if (matched) continue;
        output.push(isZh ? translateAstroTerm(line, 'zh') : line);
    }
    return output.join('\n').trim();
};

const parseAskReportLabelLine = (
    line: string,
    labels?: Record<string, string>
): { key: string; label: string; separator: string; content: string } | null => {
    if (!labels) return null;
    const separators = ['：', ':'];
    for (const [key, label] of Object.entries(labels)) {
        for (const separator of separators) {
            const prefix = `${label}${separator}`;
            if (line.startsWith(prefix)) {
                return {
                    key,
                    label,
                    separator,
                    content: line.slice(prefix.length).trim(),
                };
            }
        }
    }
    return null;
};

const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractAskReportTitleAndCleanSections = (
    sections: AskReportSection[],
    t: typeof TRANSLATIONS['en']
): { sections: AskReportSection[]; reportTitle: string } => {
    const reportLabels = t.ask.report_labels || {};
    const essenceTitle = t.ask.report_sections?.essence || 'Essence';
    const insightLabel = reportLabels.insight;
    let reportTitle = '';
    const cleanedSections = sections.map((section) => {
        const isEssence = section.title === essenceTitle;
        const lines = section.body.split('\n').filter((line) => line.trim());
        const nextLines: string[] = [];
        lines.forEach((line) => {
            const trimmed = line.trim();
            const match = parseAskReportLabelLine(trimmed, reportLabels);
            if (match?.key === 'headline') {
                if (!reportTitle && match.content) reportTitle = match.content;
                return;
            }
            if (isEssence && match?.key === 'insight') {
                if (match.content) nextLines.push(match.content);
                return;
            }
            if (isEssence && insightLabel) {
                const insightRegex = new RegExp(`^(.*?)\\s*${escapeRegExp(insightLabel)}\\s*[：:]\\s*(.+)$`);
                const insightMatch = trimmed.match(insightRegex);
                if (insightMatch) {
                    const possibleTitle = insightMatch[1].trim();
                    const insightBody = insightMatch[2].trim();
                    if (!reportTitle && possibleTitle && possibleTitle.length <= 32) {
                        reportTitle = possibleTitle;
                    }
                    if (insightBody) nextLines.push(insightBody);
                    return;
                }
            }
            nextLines.push(trimmed);
        });
        return { ...section, body: nextLines.join('\n').trim() };
    });
    return { sections: cleanedSections, reportTitle };
};

const splitAskReportByLabels = (
    body: string,
    lang: T.Language,
    t: typeof TRANSLATIONS['en']
): AskReportSection[] => {
    if (!body) return [];
    const labels = t.ask.report_labels;
    if (!labels) return [];
    const localizedBody = localizeAskReportBody(body, lang, t);
    const lines = localizedBody.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const isZh = lang === 'zh';
    const separator = isZh ? '：' : ':';
    const makePrefix = (key: keyof typeof labels) => `${labels[key]}${separator}`;
    const hasPrefix = (line: string, key: keyof typeof labels) =>
        line.startsWith(makePrefix(key));

    const isDeepDiveLabel = (line: string) =>
        hasPrefix(line, 'mirror') || hasPrefix(line, 'root') || hasPrefix(line, 'shadow') || hasPrefix(line, 'light');
    const isSoulworkLabel = (line: string) => hasPrefix(line, 'journal') || hasPrefix(line, 'micro');
    const isTakeawayLabel = (line: string) => hasPrefix(line, 'summary') || hasPrefix(line, 'affirmation');
    const isEssenceLabel = (line: string) => hasPrefix(line, 'headline') || hasPrefix(line, 'insight');

    const findIndex = (predicate: (line: string) => boolean) => lines.findIndex(predicate);
    const deepDiveIndex = findIndex(isDeepDiveLabel);
    const soulworkIndex = findIndex(isSoulworkLabel);
    const takeawayIndex = findIndex(isTakeawayLabel);

    const beforeDeepDiveEnd = deepDiveIndex === -1 ? lines.length : deepDiveIndex;
    const preDeepDive = lines.slice(0, beforeDeepDiveEnd);
    const essenceLines = preDeepDive.filter(isEssenceLabel);
    const signatureLines = preDeepDive.filter((line) => !isEssenceLabel(line));
    const deepDiveEnd = soulworkIndex !== -1 ? soulworkIndex : (takeawayIndex !== -1 ? takeawayIndex : lines.length);
    const deepDiveLines = deepDiveIndex !== -1 ? lines.slice(deepDiveIndex, deepDiveEnd) : [];
    const soulworkEnd = takeawayIndex !== -1 ? takeawayIndex : lines.length;
    const soulworkLines = soulworkIndex !== -1 ? lines.slice(soulworkIndex, soulworkEnd) : [];
    const takeawayLines = takeawayIndex !== -1 ? lines.slice(takeawayIndex) : [];

    const sections: AskReportSection[] = [];
    if (essenceLines.length > 0) {
        sections.push({ title: t.ask.report_sections?.essence || 'Essence', body: essenceLines.join('\n') });
    }
    if (signatureLines.length > 0) {
        sections.push({ title: t.ask.report_sections?.signature || 'Signature', body: signatureLines.join('\n') });
    }
    if (deepDiveLines.length > 0) {
        sections.push({ title: t.ask.report_sections?.deep_dive || 'Deep Dive', body: deepDiveLines.join('\n') });
    }
    if (soulworkLines.length > 0) {
        sections.push({ title: t.ask.report_sections?.soulwork || 'Soulwork', body: soulworkLines.join('\n') });
    }
    if (takeawayLines.length > 0) {
        sections.push({ title: t.ask.report_sections?.takeaway || 'Takeaway', body: takeawayLines.join('\n') });
    }
    return sections;
};

const AskOraclePage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState<T.AskAnswerContent | null>(null);
    const [answerMeta, setAnswerMeta] = useState<T.AIContentMeta | null>(null);
    const [answerLang, setAnswerLang] = useState<T.Language | null>(null);
    const [answerChart, setAnswerChart] = useState<T.NatalFacts | null>(null);
    const [answerTransits, setAnswerTransits] = useState<T.TransitData | null>(null);
    const [answerChartType, setAnswerChartType] = useState<T.AskChartType>('natal');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
    
    // Initialize active category
    const [activeCategory, setActiveCategory] = useState<AskCategoryKey>('self_discovery');

    const reportLang = answerLang || language;
    const reportT = TRANSLATIONS[reportLang] || t;

    const loadingPhrases = t.ask.loading_phrases || [];
    const questionSet = PRESET_QUESTIONS[language] || PRESET_QUESTIONS.zh;
    const questions = questionSet[activeCategory] || [];
    const selectedQuestionText = selectedQuestionId
        ? questions.find((item) => item.id === selectedQuestionId)?.text || null
        : null;
    const { sections: answerSections, reportTitle } = useMemo(() => {
        if (!answer) return { sections: [], reportTitle: '' };
        const reportLang = answerLang || language;
        const reportT = TRANSLATIONS[reportLang] || t;
        const sections = parseAskReportSections(answer);
        const resolvedSections = (() => {
            if (sections.length <= 1) {
                const fallbackSections = splitAskReportByLabels(sections[0]?.body || answer, reportLang, reportT);
                if (fallbackSections.length > 1) return fallbackSections;
            }
            return sections;
        })();
        const localized = resolvedSections.map((section) => ({
            title: localizeAskSectionTitle(section.title, reportLang, reportT),
            body: localizeAskReportBody(section.body, reportLang, reportT),
        }));
        return extractAskReportTitleAndCleanSections(localized, reportT);
    }, [answer, answerLang, language, t]);

    // Extract visible planets from the Astrological Signature section
    const visiblePlanets = useMemo(() => {
        if (answerSections.length === 0) return [];
        return extractPlanetsFromSignature(answerSections);
    }, [answerSections]);

    useEffect(() => {
        setSelectedQuestionId(null);
    }, [activeCategory]);

    useEffect(() => {
        if (!selectedQuestionId) return;
        const translated = questions.find((item) => item.id === selectedQuestionId)?.text;
        if (translated && translated !== question) {
            setQuestion(translated);
        }
    }, [language, questions, question, selectedQuestionId]);

    useEffect(() => {
        if (!loading) return;
        setLoadingPhraseIndex(0);
        if (loadingPhrases.length <= 1) return;
        const interval = window.setInterval(() => {
            setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
        }, 3200);
        return () => window.clearInterval(interval);
    }, [loading, loadingPhrases.length]);

    const handleAsk = async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed || loading) return;
        setLoading(true);
        setError(null);
        setQuestion(trimmed);
        setAnswer(null);
        setAnswerMeta(null);
        setAnswerLang(null);
        setAnswerChart(null);
        setAnswerTransits(null);
        setAnswerChartType('natal');
        try {
            const result = await fetchAskAnswer(profile, trimmed, undefined, language, activeCategory);
            const content = result.content || null;
            if (!content) {
                setError(t.app.error);
                return;
            }
            setAnswer(content);
            setAnswerMeta(result.meta || null);
            setAnswerLang(result.lang);
            setAnswerChart(result.chart || null);
            setAnswerTransits(result.transits || null);
            setAnswerChartType(result.chartType || 'natal');
        } catch (e) {
            const err = e as Error;
            if (err?.name === 'AbortError') {
                setError(t.ask.timeout);
                return;
            }
            console.error(e);
            setError(t.app.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!answer || !question || loading) return;
        if (selectedQuestionId && selectedQuestionText && question !== selectedQuestionText) return;
        if (answerLang === language) return;
        let cancelled = false;
        const refreshAnswer = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchAskAnswer(profile, question, undefined, language, activeCategory);
                if (cancelled) return;
                setAnswer(result.content || null);
                setAnswerMeta(result.meta || null);
                setAnswerLang(result.lang);
                setAnswerChart(result.chart || null);
                setAnswerTransits(result.transits || null);
                setAnswerChartType(result.chartType || 'natal');
            } catch (e) {
                if (cancelled) return;
                const err = e as Error;
                if (err?.name === 'AbortError') {
                    setError(t.ask.timeout);
                    return;
                }
                console.error(e);
                setError(t.app.error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        refreshAnswer();
        return () => {
            cancelled = true;
        };
    }, [activeCategory, answer, answerLang, language, loading, profile, question, selectedQuestionId, selectedQuestionText, t.ask.timeout, t.app.error]);

    const showLoadingView = loading && !answer;
    const containerClassName = answer
        ? "flex flex-col min-h-screen pt-6 pb-12 -mt-[30px]"
        : "flex flex-col h-screen overflow-hidden pt-6 pb-1.5 -mt-[30px]";

    return (
        <Container className={containerClassName}>
            {showLoadingView ? (
                <OracleLoading
                    phrases={loadingPhrases}
                    thinkingLabel={t.ask.thinking}
                    className="flex-1"
                />
            ) : (
                <>
                    {/* Header: ORACLE */}
                    {!answer && (
                        <div className="text-center pb-5 animate-fade-in relative mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-500/30 text-gold-500 mb-3 bg-gold-500/5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-serif tracking-[0.2em] text-gold-500 mb-2 uppercase">{t.ask.title}</h1>
                            <p className="text-sm font-serif italic text-star-400 opacity-80">"{t.ask.subtitle}"</p>
                            <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600/70">
                                <div className="w-2 h-2 rounded-full bg-accent animate-breathe"></div>
                                {t.ask.online}
                            </div>
                        </div>
                    )}

            {!answer ? (
                <div className="animate-fade-in flex-1 max-w-7xl mx-auto w-full px-4 flex flex-col min-h-0 mt-[44px]">

                    {/* Category Tabs - Compact Centered Row */}
                    <div className="flex flex-wrap justify-center gap-2 mb-2 border-b border-space-600/30 pb-2 shrink-0">
                        {(Object.keys(t.ask.modules) as AskCategoryKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`
                                    flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all border rounded-md
                                    ${activeCategory === key
                                        ? 'border-gold-500 text-gold-500 bg-gold-500/5 shadow-glow'
                                        : 'border-space-600 text-star-400 hover:border-gold-500/50 hover:text-star-200 bg-space-900/50'
                                    }
                                `}
                            >
                                {/* SVG icon based on category */}
                                <span className="w-4 h-4 flex items-center justify-center">
                                    {key === 'self_discovery' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {key === 'shadow_work' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path d="M12 3a9 9 0 1 0 9 9c0-1.5-.4-2.8-1-4a7 7 0 0 1-8 5c-3.9 0-7-3.1-7-7a7 7 0 0 1 5-6.7" />
                                        </svg>
                                    )}
                                    {key === 'relationships' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {key === 'vocation' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <rect x="3" y="7" width="18" height="13" rx="2" />
                                            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <path d="M12 12v4" />
                                        </svg>
                                    )}
                                    {key === 'family_roots' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
                                            <rect x="9" y="14" width="6" height="6" />
                                        </svg>
                                    )}
                                    {key === 'time_cycles' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M12 6v6l4 2" strokeLinecap="round" />
                                            <path d="M16 3l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M8 21l-2-2 2-2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                                {t.ask.modules[key]}
                            </button>
                        ))}
                    </div>

                    {/* Question Matrix - 2 Column Grid with internal scroll */}
                    <div className="grid grid-cols-1 gap-y-2 pt-4 pb-4 w-full md:w-1/2 mx-auto flex-1 min-h-0 overflow-hidden content-start auto-rows-min">
                        {questions.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center text-center text-sm opacity-70 py-10">
                                <div className="font-semibold mb-2">{t.ask.empty_title}</div>
                                <div className="text-xs opacity-70">{t.ask.empty_desc}</div>
                            </div>
                        ) : (
                            questions.map((q) => (
                                <button
                                    key={q.id}
                                    onClick={() => { setQuestion(q.text); setSelectedQuestionId(q.id); setError(null); }}
                                    disabled={loading}
                                    className={`
                                        group text-left h-[38px] px-4 border transition-all duration-300 rounded
                                        flex items-center
                                        ${selectedQuestionId === q.id
                                            ? 'border-gold-500/80 bg-gold-500/5 shadow-glow'
                                            : theme === 'dark'
                                                ? 'bg-space-900 border-space-600 hover:border-gold-500/50 hover:bg-space-800'
                                                : 'bg-white border-paper-300 hover:bg-paper-100 hover:border-gold-600/30'
                                        }
                                    `}
                                >
                                    <span className={`font-mono text-sm transition-all flex items-center gap-3 w-full ${selectedQuestionId === q.id ? 'text-gold-500 opacity-100' : 'opacity-60 group-hover:text-gold-500 group-hover:opacity-100'}`}>
                                        <span className="opacity-30 shrink-0">&gt;</span>
                                        <span className="truncate">{q.text}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Input Footer - Inline with Rituals Counter */}
                    <div className="shrink-0 pt-3 pb-1.5">
                        <div className="max-w-6xl mx-auto relative group">
                            {loading ? (
                              <div className="absolute -top-6 left-0 right-0 text-center opacity-50 animate-pulse font-mono text-xs uppercase tracking-widest text-gold-500">
                                {t.ask.thinking}
                              </div>
                            ) : error ? (
                              <div className="absolute -top-6 left-0 right-0 text-center font-mono text-xs uppercase tracking-widest text-danger">
                                {error}
                              </div>
                            ) : null}
                            {/* Input Container */}
                            <div className="flex items-stretch gap-3">
                                <div className={`
                                    relative flex items-center flex-1 p-1 rounded-none border transition-all duration-500
                                    ${theme === 'dark'
                                        ? 'bg-space-950/90 border-space-600 focus-within:border-gold-500/50 shadow-2xl backdrop-blur-md'
                                        : 'bg-white/90 border-paper-300 shadow-xl'
                                    }
                                `}>
                                    <input
                                        type="text"
                                        placeholder={t.ask.placeholder}
                                        value={question}
                                        onChange={(e) => {
                                            const nextValue = e.target.value;
                                            setQuestion(nextValue);
                                            setError(null);
                                            if (selectedQuestionId && nextValue.trim() !== (selectedQuestionText || '')) {
                                                setSelectedQuestionId(null);
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
                                        disabled={loading}
                                        className="w-full bg-transparent border-none outline-none px-5 py-3 text-sm font-mono placeholder-opacity-30 tracking-wide"
                                    />
                                </div>
                                <button
                                    onClick={() => handleAsk(question)}
                                    disabled={loading || !question.trim()}
                                    className={`shrink-0 flex flex-col items-center justify-center px-4 border transition-all duration-300 rounded-none
                                        ${loading || !question.trim()
                                            ? 'opacity-40 cursor-not-allowed'
                                            : 'hover:border-gold-500/60 hover:text-gold-400'
                                        }
                                        ${theme === 'dark'
                                            ? 'bg-space-900 border-space-600 text-gold-500'
                                            : 'bg-white border-paper-300 text-gold-600'
                                        }
                                    `}
                                >
                                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">{t.ask.rituals}</span>
                                    <span className="mt-1 flex items-center gap-2 text-gold-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 -rotate-45">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                        </svg>
                                        <span className="text-[9px] uppercase tracking-[0.3em]">{t.ask.send}</span>
                                    </span>
                                </button>
                            </div>
                            {/* Glow Effect behind input */}
                            <div className="absolute -inset-1 bg-gold-500/5 blur-xl -z-10 rounded-lg pointer-events-none"></div>
                        </div>
                    </div>

                </div>
            ) : (() => {
                const isLight = theme === 'light';
                const shellTone = isLight ? 'bg-paper-100 border-paper-300' : 'bg-space-900 border-gold-500/20';
                const headerTone = isLight ? 'bg-paper-100/95 border-paper-300' : 'bg-space-900/95 border-gold-500/10';
                const labelTone = isLight ? 'text-paper-600' : 'text-star-400';
                const categoryLabelRaw = t.ask.modules[activeCategory] || '';
                const categoryLabelPrimary = categoryLabelRaw.split(/[\/／]/)[0]?.trim() || '';
                const categoryLabel = categoryLabelPrimary || categoryLabelRaw.trim();
                const questionText = question.trim();
                const questionSummary = questionText.length > 72 ? `${questionText.slice(0, 72)}...` : questionText;
                const headerSeparator = language === 'zh' ? '：' : ': ';
                const headerSummary = questionSummary
                    ? `${categoryLabel}${headerSeparator}${questionSummary}`
                    : categoryLabel;
                const reportTitleText = reportTitle || questionText;

                return (
                <div className={`fixed inset-0 z-[150] flex flex-col overflow-hidden animate-fade-in ${isLight ? 'bg-paper-100' : 'bg-space-950'}`}>
                    {/* Header with back button - left aligned */}
                    <div className={`sticky top-0 z-20 px-6 py-4 flex items-center gap-4 ${isLight ? 'bg-paper-100/95 backdrop-blur' : 'bg-space-950/95 backdrop-blur'}`}>
                        <button
                            onClick={() => { setAnswer(null); setAnswerMeta(null); setAnswerLang(null); setAnswerChart(null); setError(null); }}
                            className={`flex items-center gap-3 transition-all font-bold group ${labelTone}`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-paper-200 border border-paper-300 group-hover:bg-paper-300' : 'bg-white/5 group-hover:bg-gold-500/20 group-hover:text-gold-400'}`}>
                                <ArrowLeft size={20} />
                            </div>
                            <span className="text-sm uppercase tracking-widest">{t.ask.back}</span>
                        </button>
                        <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border max-w-[70vw] ${isLight ? 'border-gold-500/30 bg-gold-500/10 text-gold-700' : 'border-gold-500/30 bg-gold-500/10 text-gold-400'}`}
                            title={headerSummary}
                        >
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${isLight ? 'border-gold-500/40 bg-white text-gold-600' : 'border-gold-500/30 bg-space-950 text-gold-500'}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold tracking-wide truncate">{headerSummary}</span>
                        </div>
                    </div>

                    {/* Question display */}
                    <div className="text-center px-6 py-4">
                        <div className={`text-2xl md:text-3xl font-serif font-medium max-w-4xl mx-auto ${isLight ? 'text-paper-900' : 'text-star-100'}`}>
                            {reportTitleText}
                        </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 relative">
                                {/* Background silhouette */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <svg className="absolute inset-0 w-full h-full opacity-[0.015]" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
                                        <circle cx="400" cy="400" r="350" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                                        <circle cx="400" cy="400" r="280" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
                                        <circle cx="400" cy="400" r="200" fill="none" stroke="#D4AF37" strokeWidth="0.2" />
                                        {[...Array(12)].map((_, i) => (
                                            <line key={i} x1="400" y1="50" x2="400" y2="120" stroke="#D4AF37" strokeWidth="0.3" transform={`rotate(${i * 30} 400 400)`} />
                                        ))}
                                        <circle cx="100" cy="150" r="2" fill="#D4AF37" />
                                        <circle cx="700" cy="200" r="1.5" fill="#D4AF37" />
                                        <circle cx="650" cy="600" r="2" fill="#D4AF37" />
                                        <circle cx="150" cy="650" r="1.5" fill="#D4AF37" />
                                    </svg>
                                </div>

                    {answerMeta?.source === 'mock' && (
                        <div className="mb-8 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-widest text-center border-warning/40 bg-warning/10 text-warning">
                            {t.ask.answer_source_mock}
                        </div>
                    )}

                    {/* Natal/Transit Chart Display - 星盘 */}
                    {/* 使用 API 返回的 chartType 确定星盘类型，visiblePlanets 过滤显示的行星 */}
                    {answerChart && !loading && visiblePlanets.length > 0 && (
                      <div className="mb-8">
                        <div className="flex justify-center">
                          <div className="relative w-full">
                            <AstroChart
                              type={answerChartType}
                              profile={profile}
                              scale={0.576}
                              compactSpacing
                              visiblePlanets={visiblePlanets}
                              legendLabels={{
                                conjunction: t.me.aspect_conjunction,
                                opposition: t.me.aspect_opposition,
                                square: t.me.aspect_square,
                                trine: t.me.aspect_trine,
                                sextile: t.me.aspect_sextile,
                              }}
                              loadingLabel={t.common.loading}
                              errorLabel={t.app.error}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {loading ? (
                         <div className="text-center opacity-50 animate-pulse font-mono text-xs uppercase tracking-widest text-gold-500 py-20">{t.ask.thinking}</div>
                    ) : (
                        <div className="relative">
                            {/* Main answer container with modular sections */}
                            <div className="space-y-6">
                                {/* Modular answer sections with diverse card styles */}
                                {answerSections.length > 0 ? (
                                    <div className="space-y-5">
                                        {answerSections.map((section, idx) => {
                                            // Determine card style based on section index for visual variety
                                            const cardStyles = [
                                                {
                                                    accent: 'border-l-gold-500',
                                                    title: theme === 'dark' ? 'text-gold-200' : 'text-gold-700',
                                                    badge: theme === 'dark' ? 'border-gold-500/30 bg-gold-500/10 text-gold-400' : 'border-gold-600/40 bg-gold-500/15 text-gold-700',
                                                    highlight: theme === 'dark' ? 'text-gold-300' : 'text-gold-700',
                                                    dot: theme === 'dark' ? 'bg-gold-500/50' : 'bg-gold-600/60',
                                                    divider: theme === 'dark' ? 'border-gold-500/20' : 'border-gold-600/25',
                                                    iconTone: theme === 'dark' ? 'border-gold-500/30 bg-space-950 text-gold-500' : 'border-gold-600/40 bg-white text-gold-600',
                                                    icon: 'star'
                                                },
                                                {
                                                    accent: 'border-l-accent',
                                                    title: 'text-accent',
                                                    badge: theme === 'dark' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-accent/30 bg-accent/10 text-accent',
                                                    highlight: 'text-accent',
                                                    dot: theme === 'dark' ? 'bg-accent/50' : 'bg-accent/60',
                                                    divider: theme === 'dark' ? 'border-accent/20' : 'border-accent/30',
                                                    iconTone: theme === 'dark' ? 'border-accent/30 bg-space-950 text-accent' : 'border-accent/30 bg-white text-accent',
                                                    icon: 'eye'
                                                },
                                                {
                                                    accent: 'border-l-star-200',
                                                    title: theme === 'dark' ? 'text-star-200' : 'text-gold-700',
                                                    badge: theme === 'dark' ? 'border-star-200/30 bg-star-200/10 text-star-200' : 'border-gold-600/30 bg-gold-500/10 text-gold-700',
                                                    highlight: theme === 'dark' ? 'text-star-200' : 'text-gold-700',
                                                    dot: theme === 'dark' ? 'bg-star-200/50' : 'bg-gold-600/50',
                                                    divider: theme === 'dark' ? 'border-star-200/20' : 'border-gold-600/20',
                                                    iconTone: theme === 'dark' ? 'border-star-200/30 bg-space-950 text-star-200' : 'border-gold-600/30 bg-white text-gold-600',
                                                    icon: 'compass'
                                                },
                                                {
                                                    accent: 'border-l-success',
                                                    title: 'text-success',
                                                    badge: theme === 'dark' ? 'border-success/30 bg-success/10 text-success' : 'border-success/30 bg-success/10 text-success',
                                                    highlight: 'text-success',
                                                    dot: theme === 'dark' ? 'bg-success/50' : 'bg-success/60',
                                                    divider: theme === 'dark' ? 'border-success/20' : 'border-success/30',
                                                    iconTone: theme === 'dark' ? 'border-success/30 bg-space-950 text-success' : 'border-success/30 bg-white text-success',
                                                    icon: 'moon'
                                                },
                                                {
                                                    accent: 'border-l-gold-400',
                                                    title: theme === 'dark' ? 'text-gold-200' : 'text-gold-700',
                                                    badge: theme === 'dark' ? 'border-gold-400/30 bg-gold-400/10 text-gold-300' : 'border-gold-600/30 bg-gold-500/10 text-gold-700',
                                                    highlight: theme === 'dark' ? 'text-gold-300' : 'text-gold-700',
                                                    dot: theme === 'dark' ? 'bg-gold-400/50' : 'bg-gold-600/50',
                                                    divider: theme === 'dark' ? 'border-gold-400/20' : 'border-gold-600/20',
                                                    iconTone: theme === 'dark' ? 'border-gold-400/30 bg-space-950 text-gold-400' : 'border-gold-600/30 bg-white text-gold-600',
                                                    icon: 'star'
                                                },
                                            ];
                                            const reportSections = reportT.ask.report_sections || {};
                                            const sectionTitle = section.title || reportT.ask.deep_insight;
                                            const sectionStyleOrder: Record<string, number> = {};
                                            if (reportSections.essence) sectionStyleOrder[reportSections.essence] = 0;
                                            if (reportSections.signature) sectionStyleOrder[reportSections.signature] = 1;
                                            if (reportSections.deep_dive) sectionStyleOrder[reportSections.deep_dive] = 2;
                                            if (reportSections.soulwork) sectionStyleOrder[reportSections.soulwork] = 3;
                                            if (reportSections.takeaway) sectionStyleOrder[reportSections.takeaway] = 4;
                                            const style = cardStyles[sectionStyleOrder[sectionTitle] ?? (idx % cardStyles.length)];
                                            const reportLabels = reportT.ask.report_labels || {};
                                            const highlightLabelKeys = new Set(['mirror', 'root', 'shadow', 'light', 'journal']);
                                            const isZhReport = reportLang === 'zh';
                                            const layerLabel = isZhReport
                                                ? `${reportT.ask.layer_prefix}${idx + 1}${reportT.ask.layer_suffix || ''}`
                                                : `${reportT.ask.layer_prefix} ${idx + 1}`;

                                            // Parse body content for potential key points
                                            const bodyLines = section.body.split('\n').filter(line => line.trim());
                                            const hasMultiplePoints = bodyLines.length > 2;
                                            const textTone = theme === 'dark' ? 'text-star-200' : 'text-paper-700';
                                            const renderReportLine = (line: string) => {
                                                const match = parseAskReportLabelLine(line, reportLabels);
                                                if (!match) return <span>{line}</span>;
                                                
                                                let labelClass = style.title;
                                                if (highlightLabelKeys.has(match.key)) {
                                                    if (match.key === 'mirror' || match.key === 'insight') labelClass = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
                                                    else if (match.key === 'root') labelClass = theme === 'dark' ? 'text-purple-400' : 'text-purple-600';
                                                    else if (match.key === 'shadow') labelClass = theme === 'dark' ? 'text-red-400' : 'text-red-600';
                                                    else if (match.key === 'light') labelClass = theme === 'dark' ? 'text-green-400' : 'text-green-600';
                                                    else labelClass = style.highlight;
                                                }

                                                return (
                                                    <span className="flex flex-wrap gap-1">
                                                        <span className={`${labelClass} font-semibold`}>{match.label}{match.separator}</span>
                                                        <span>{match.content}</span>
                                                    </span>
                                                );
                                            };

                                            // Icon components
                                            const IconStar = () => (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            );
                                            const IconEye = () => (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            );
                                            const IconCompass = () => (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                                    <circle cx="12" cy="12" r="9" />
                                                    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            );
                                            const IconMoon = () => (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            );

                                            const renderIcon = () => {
                                                switch(style.icon) {
                                                    case 'eye': return <IconEye />;
                                                    case 'compass': return <IconCompass />;
                                                    case 'moon': return <IconMoon />;
                                                    default: return <IconStar />;
                                                }
                                            };

                                            return (
                                                <div
                                                    key={`${section.title}-${idx}`}
                                                    className="animate-fade-in"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    <Card className={`
                                                        relative overflow-hidden transition-all duration-300
                                                        border border-l-2 ${style.accent}
                                                        hover:shadow-lg
                                                        ${theme === 'dark' ? 'hover:shadow-gold-500/5' : 'hover:shadow-paper-400/20'}
                                                    `}>
                                                        {/* Header with icon and title */}
                                                        <div className={`flex items-center gap-4 mb-4 pb-3 border-b ${style.divider}`}>
                                                            <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${style.iconTone}`}>
                                                                {renderIcon()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] rounded-full border ${style.badge}`}>
                                                                        {layerLabel}
                                                                    </span>
                                                                    <h4 className={`text-base md:text-lg font-serif font-semibold ${style.title}`}>
                                                                        {sectionTitle}
                                                                    </h4>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Section content - modular display */}
                                                        <div className="pl-14">
                                                            {hasMultiplePoints ? (
                                                                <div className="space-y-3">
                                                                    {bodyLines.map((line, lineIdx) => (
                                                                        <div key={lineIdx} className="flex gap-3 items-start">
                                                                            <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${style.dot}`} />
                                                                            <p className={`text-sm leading-relaxed ${textTone}`}>
                                                                                {renderReportLine(line)}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className={`text-sm leading-relaxed ${textTone}`}>
                                                                    {renderReportLine(section.body)}
                                                                </p>
                                                            )}
                                                        </div>

                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* Fallback for non-sectioned answers */
                                    <Card className={`
                                        relative overflow-hidden
                                        border-l-2 border-l-gold-500
                                        ${theme === 'dark' ? 'border-space-700' : 'border-paper-300'}
                                    `}>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${
                                                theme === 'dark'
                                                    ? 'border-gold-500/30 bg-space-950 text-gold-500'
                                                    : 'border-gold-600/30 bg-white text-gold-600'
                                            }`}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                                                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className={`pl-14 text-sm leading-relaxed whitespace-pre-line ${
                                            theme === 'dark' ? 'text-star-200' : 'text-paper-700'
                                        }`}>
                                            {answer}
                                        </div>
                                    </Card>
                                )}

                                {/* Conclusion card - enhanced visual */}
                                {answerSections.length > 0 && (
                                    <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gold-500/10' : 'border-gold-600/10'}`}>
                                        <Card className={`text-center py-8 ${
                                            theme === 'dark'
                                                ? 'bg-gradient-to-b from-space-900 to-space-950 border-gold-500/20'
                                                : 'bg-gradient-to-b from-white to-paper-100 border-gold-600/20'
                                        }`}>
                                            <div className="flex items-center justify-center gap-3 mb-4">
                                                <div className={`w-12 h-px ${theme === 'dark' ? 'bg-gold-500/30' : 'bg-gold-600/30'}`} />
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={`w-6 h-6 ${theme === 'dark' ? 'text-gold-500/50' : 'text-gold-600/50'}`}>
                                                    <circle cx="12" cy="12" r="9" />
                                                    <circle cx="12" cy="12" r="3" />
                                                    <path d="M12 3v3m0 12v3m9-9h-3M6 12H3" />
                                                </svg>
                                                <div className={`w-12 h-px ${theme === 'dark' ? 'bg-gold-500/30' : 'bg-gold-600/30'}`} />
                                            </div>
                                            <div className={`text-[10px] uppercase tracking-[0.3em] mb-3 ${theme === 'dark' ? 'text-gold-500/50' : 'text-gold-600/50'}`}>
                                                {t.ask.oracle_complete}
                                            </div>
                                            <p className={`text-sm font-serif italic max-w-3xl mx-auto ${theme === 'dark' ? 'text-star-300' : 'text-paper-600'}`}>
                                                {t.ask.oracle_blessing}
                                            </p>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                        </div>
                    </div>
                </div>
                );
            })()}
            </>
            )}
        </Container>
    );
};

const SettingsPage: React.FC<{ profile: T.UserProfile; onReset: () => void }> = ({ profile, onReset }) => {
    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    return (
        <Container>
            <h1 className="text-3xl font-serif font-medium mb-8">{t.settings.title}</h1>

            <Section title={t.settings.profile}>
                <Card className="mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{language === 'zh' ? '姓名' : 'Name'}</div>
                            <div>{profile.name || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{language === 'zh' ? '出生日期' : 'Birth Date'}</div>
                            <div>{profile.birthDate || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{language === 'zh' ? '出生时间' : 'Birth Time'}</div>
                            <div>{profile.birthTime || (profile.accuracyLevel === 'time_unknown' ? (language === 'zh' ? '未知' : 'Unknown') : '-')}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{language === 'zh' ? '出生地点' : 'Birth Place'}</div>
                            <div>{profile.birthCity || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{language === 'zh' ? '时区' : 'Timezone'}</div>
                            <div>{profile.timezone || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{language === 'zh' ? '准确度' : 'Accuracy'}</div>
                            <div>{profile.accuracyLevel === 'exact' ? (language === 'zh' ? '精确' : 'Exact') : (language === 'zh' ? '时间未知' : 'Time Unknown')}</div>
                        </div>
                    </div>
                </Card>
            </Section>

            <Section title="Preferences">
                <Card className="mb-4 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-sm mb-1">{t.settings.language}</div>
                        <div className="text-xs opacity-60">{language === 'en' ? 'English' : '中文'}</div>
                    </div>
                    <ActionButton onClick={toggleLanguage} size="sm" variant="outline">
                        {language === 'en' ? 'Switch to 中文' : 'Switch to English'}
                    </ActionButton>
                </Card>
                 <Card className="mb-4 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-sm mb-1">{t.settings.theme}</div>
                        <div className="text-xs opacity-60">{theme === 'dark' ? t.settings.theme_dark : t.settings.theme_light}</div>
                    </div>
                    <ActionButton onClick={toggleTheme} size="sm" variant="outline">
                        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
                    </ActionButton>
                </Card>
                <Card className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <div className="font-bold text-sm mb-1">{t.settings.zodiac_system}</div>
                            <div className="text-xs opacity-60">{t.settings.zodiac_tropical}</div>
                        </div>
                        <span className="text-xs font-mono opacity-40 uppercase">{t.settings.fixed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold text-sm mb-1">{t.settings.house_system}</div>
                            <div className="text-xs opacity-60">Placidus</div>
                        </div>
                        <span className="text-xs font-mono opacity-40 uppercase">{t.settings.fixed}</span>
                    </div>
                </Card>
            </Section>

            <Section title="Data">
                <Card className="border-l-2 border-l-danger/60">
                    <div className="mb-4">
                        <div className="font-bold text-sm text-danger mb-1">{t.settings.reset}</div>
                        <div className="text-xs opacity-60">{t.settings.reset_desc}</div>
                    </div>
                    <ActionButton onClick={onReset} size="sm" className="bg-danger border-danger text-white hover:bg-danger/80 w-full">
                        {t.settings.reset_btn}
                    </ActionButton>
                </Card>
            </Section>
        </Container>
    );
};

const AppContent: React.FC = () => {
    const { user, saveUser } = useUserProfile();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, toggleLanguage, language } = useLanguage();
    const { toggleTheme, theme } = useTheme();
    const isWikiPath = location.pathname === '/wiki' || location.pathname.startsWith('/wiki/');

    // Redirect to landing if no user data, except for landing and onboarding
    useEffect(() => {
        if (!user && !['/', '/onboarding'].includes(location.pathname) && !isWikiPath) {
            navigate('/');
        }
    }, [user, location.pathname, navigate, isWikiPath]);

    const showNav = (user || isWikiPath) && !['/', '/onboarding'].includes(location.pathname);

    return (
        <>
            {showNav && (
                <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-space-950/90 border-space-600' : 'bg-white/90 border-paper-300'}`}>
                    <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-serif font-medium text-xl cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
                            <span className="text-gold-500">☾</span> {t.app.name}
                        </div>

                        {/* Navigation Links - Permanently Top Right */}
                        <div className="flex items-center gap-6 ml-auto overflow-x-auto no-scrollbar">
                            {[
                                { path: '/dashboard', label: t.nav.dashboard },
                                { path: '/forecast', label: t.nav.forecast },
                                { path: '/us', label: t.nav.us },
                                { path: '/oracle', label: t.nav.oracle },
                                { path: '/journal', label: t.nav.journal },
                                { path: '/wiki', label: t.nav.wiki },
                            ].map(link => {
                                const isActive = link.path === '/wiki'
                                  ? location.pathname.startsWith('/wiki')
                                  : location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`text-xs font-bold uppercase tracking-widest hover:text-gold-500 transition-colors whitespace-nowrap ${isActive ? 'text-gold-500' : 'opacity-60'}`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                            
                            {/* Settings / Theme Toggles */}
                            <div className="h-8 w-px bg-current opacity-20 shrink-0 hidden md:block"></div>
                            <Link to="/settings" className="hidden md:flex w-10 h-10 items-center justify-center text-3xl leading-none font-bold uppercase opacity-50 hover:opacity-100 shrink-0">⚙</Link>
                            <button onClick={toggleTheme} className="hidden md:flex w-8 h-8 items-center justify-center text-2xl leading-none font-bold uppercase opacity-50 hover:opacity-100 shrink-0">{theme === 'dark' ? '☀' : '☾'}</button>

                            {/* User Menu */}
                            <div className="h-8 w-px bg-current opacity-20 shrink-0 hidden md:block"></div>
                            <UserMenu />
                        </div>
                    </div>
                </nav>
            )}

            {/* Mobile Utility Toggle (Since main nav is now text links at top, we keep util buttons accessible) */}
            {showNav && (
                <div className="md:hidden fixed top-20 right-4 z-40 flex flex-col gap-3">
                     <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg ${theme === 'dark' ? 'bg-space-900/80 border-space-600' : 'bg-white/80 border-paper-300'}`}>
                        {theme === 'dark' ? '☀' : '☾'}
                     </button>
                </div>
            )}

            <div className={showNav ? (location.pathname === '/journal' ? "pt-16 pb-12" : "pt-24 pb-12") : ""}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/onboarding" element={<OnboardingPage onComplete={(u) => { saveUser(u); navigate('/dashboard'); }} />} />
                    <Route path="/dashboard" element={user ? <MePage profile={user} /> : <Navigate to="/" />} />
                    <Route path="/forecast" element={user ? <TodayPage profile={user} /> : <Navigate to="/" />} />
                    <Route path="/cycles" element={user ? <CyclesPage profile={user} /> : <Navigate to="/" />} />
                    <Route path="/us" element={user ? <UsPage profile={user} /> : <Navigate to="/" />} />
                    <Route path="/oracle" element={user ? <AskOraclePage profile={user} /> : <Navigate to="/" />} />
                    <Route path="/journal" element={user ? <CBTMainPage profile={user} /> : <Navigate to="/" />} />
                    <Route path="/wiki" element={<WikiHubPage />} />
                    <Route path="/wiki/:id" element={<WikiDetailPage />} />
                    <Route path="/settings" element={user ? <SettingsPage profile={user} onReset={() => saveUser(null)} /> : <Navigate to="/" />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/reports/:reportId" element={<ReportViewPage />} />
                    <Route path="/payment/success" element={<PaymentSuccessPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>

            {/* Auth Modals */}
            <LoginModal />
            <UpgradeModal />
        </>
    );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;
