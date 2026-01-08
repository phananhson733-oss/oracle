// INPUT: Wiki 首页数据与搜索状态（含每日星象日级缓存与支柱图标文本变体）。
// OUTPUT: 导出 Wiki 首页组件（含当日星象稳定展示与 Unicode 文本图标）。
// POS: Wiki 首页模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, Card, GlassInput, Modal, Section, useLanguage, useTheme } from '../UIComponents';
import { Compass, Heart, Search, Share2, Sparkles } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { fetchWikiHome, fetchWikiSearch } from '../../services/apiClient';
import type { WikiHomeContent, WikiSearchMatch } from '../../types';

const WIKI_HOME_CACHE = new Map<string, WikiHomeContent>();
const resolveUtcDate = () => new Date().toISOString().split('T')[0];
const buildHomeCacheKey = (lang: string, date: string) => `${lang}:${date}`;
const PILLAR_ICON_MAP: Record<string, string> = {
  planets: '☉',
  signs: '\u2648',
  houses: '⌂',
  aspects: '∠',
};
const forceTextSymbol = (value: string) => {
  if (!value) return value;
  const stripped = value.replace(/\uFE0F/g, '').replace(/\uFE0E/g, '');
  return `${stripped}\uFE0E`;
};
const resolvePillarIcon = (pillar: { id: string; icon: string }) =>
  forceTextSymbol(PILLAR_ICON_MAP[pillar.id] || pillar.icon);

const WikiHomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [home, setHome] = useState<WikiHomeContent | null>(() => {
    const cacheKey = buildHomeCacheKey(language, resolveUtcDate());
    return WIKI_HOME_CACHE.get(cacheKey) || null;
  });
  const [loading, setLoading] = useState(() => {
    const cacheKey = buildHomeCacheKey(language, resolveUtcDate());
    return !WIKI_HOME_CACHE.has(cacheKey);
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeModal, setActiveModal] = useState<'transit' | 'wisdom' | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiSearchMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const mutedText = theme === 'dark' ? 'text-star-400' : 'text-paper-500';
  const borderColor = theme === 'dark' ? 'border-space-600' : 'border-paper-300';

  useEffect(() => {
    let mounted = true;
    const today = resolveUtcDate();
    const cacheKey = buildHomeCacheKey(language, today);
    const cached = refreshKey === 0 ? WIKI_HOME_CACHE.get(cacheKey) : null;
    if (cached) {
      setHome(cached);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    setError(null);
    setHome(null);
    fetchWikiHome(language, today)
      .then((data) => {
        if (!mounted) return;
        WIKI_HOME_CACHE.set(cacheKey, data.content);
        setHome(data.content);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || t.app.error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [language, refreshKey, t.app.error]);

  useEffect(() => {
    let active = true;
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return () => {
        active = false;
      };
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchWikiSearch(trimmed, language);
        if (active) setSearchResults(data.matches || []);
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 320);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, language]);

  const hasDaily = home?.daily_transit && home?.daily_wisdom;
  const guidancePreview = useMemo(() => home?.daily_transit?.guidance?.slice(0, 2) || [], [home]);
  const fallbackGuidance = useMemo(() => ([
    { title: t.wiki.daily_transit_guide_action, text: t.wiki.daily_transit_guide_action_text },
    { title: t.wiki.daily_transit_guide_transform, text: t.wiki.daily_transit_guide_transform_text },
  ]), [t]);
  const guidanceItems = guidancePreview.length > 0 ? guidancePreview : fallbackGuidance;

  const radarLabels = t.wiki.radar_labels;
  const energyLevel = home?.daily_transit?.energy_level ?? 65;
  const radarData = useMemo(() => {
    const clampValue = (value: number) => Math.max(20, Math.min(100, value));
    const offsets = [12, -8, 6, -4, 10, -12];
    return radarLabels.map((label, index) => ({
      subject: label,
      value: clampValue(energyLevel + offsets[index % offsets.length]),
    }));
  }, [radarLabels, energyLevel]);

  return (
    <div className="space-y-14">
      <section className="text-center space-y-8 pt-10">
        <div className="max-w-4xl mx-auto space-y-4">
        <div className={`text-xs uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-gold-400' : 'text-gold-600'}`}>
          {t.wiki.hero_kicker}
        </div>
          <h1 className="text-4xl md:text-6xl font-serif font-semibold leading-tight">
            {t.wiki.hero_title}
            <span className="block text-lg md:text-xl font-sans font-medium mt-3 text-gold-500">{t.wiki.hero_subtitle}</span>
          </h1>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearchOpen(true);
          }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="relative">
            <GlassInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 160)}
              placeholder={t.wiki.search_placeholder}
              className="pl-12 pr-28 py-4 text-base !h-12"
            />
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`} size={20} />
            <ActionButton size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
              {t.wiki.search_action}
            </ActionButton>
          </div>

          {searchOpen && query.trim() && (
            <Card className="absolute left-0 right-0 mt-4 text-left z-40" noPadding>
              <div className="p-4 border-b border-dashed border-current/10 flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.3em] text-gold-500">{t.wiki.search_results}</div>
                {searchLoading && <div className={`text-xs ${mutedText}`}>{t.common.loading}</div>}
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {searchResults.length === 0 && !searchLoading ? (
                  <div className={`p-4 text-sm ${mutedText}`}>{t.wiki.search_empty}</div>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={`${result.linked_id}-${result.type}`}
                      onMouseDown={() => navigate(`/wiki/${result.linked_id}`)}
                      className={`w-full text-left px-4 py-3 border-b border-dashed border-current/10 hover:bg-accent/5 transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">{result.concept}</div>
                        <div className={`text-[10px] px-2 py-0.5 rounded-full border ${borderColor}`}>{result.type}</div>
                      </div>
                      <div className={`text-xs ${mutedText}`}>{result.reason}</div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          )}
        </form>

        {home?.trending_tags && home.trending_tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className={`uppercase tracking-[0.3em] ${mutedText}`}>{t.wiki.trending_label}</span>
            {home.trending_tags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => navigate(`/wiki/${tag.item_id}`)}
                className={`px-3 py-1 rounded-full border ${borderColor} hover:text-gold-500 transition-colors`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <Section title={t.wiki.daily_section}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 relative overflow-hidden h-full">
            <div className="absolute -top-16 -right-12 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[1.2fr,0.8fr] items-center">
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-gold-500 bg-gold-500/10 px-2 py-1 rounded-full">
                    {t.wiki.daily_transit_badge}
                  </span>
                  <span className={`text-xs ${mutedText} truncate max-w-[160px] inline-block`}>
                    {home?.daily_transit?.highlight}
                  </span>
                </div>

                {hasDaily ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-serif font-semibold">{home?.daily_transit?.title}</h3>
                    <p className={`text-sm leading-relaxed ${mutedText} line-clamp-3`}>{home?.daily_transit?.summary}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {guidanceItems.map((item) => (
                        <div key={item.title} className={`p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`}>
                          <div className="text-xs uppercase tracking-[0.2em] text-gold-500 mb-2">{item.title}</div>
                          <div className={`text-sm ${mutedText} line-clamp-2`}>{item.text}</div>
                        </div>
                      ))}
                    </div>
                    <div className={`text-xs ${mutedText}`}>{t.wiki.daily_transit_hint}</div>
                  </>
                ) : (
                  <div className={`text-sm ${mutedText} ${loading ? 'animate-pulse' : ''}`}>
                    {loading ? t.common.loading : t.app.error}
                  </div>
                )}

                <ActionButton onClick={() => setActiveModal('transit')} className="w-fit" size="sm">
                  {t.wiki.daily_transit_action}
                </ActionButton>
              </div>

              <div className="relative h-[220px] md:h-[260px]">
                <div className={`absolute inset-0 rounded-2xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`} />
                <div className="relative h-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="80%">
                      <PolarGrid stroke={theme === 'dark' ? '#2b3446' : '#e5dcd0'} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#b7c0d3' : '#6b6258', fontSize: 11 }} />
                      <Radar
                        dataKey="value"
                        stroke={theme === 'dark' ? '#d4af37' : '#b08226'}
                        fill={theme === 'dark' ? 'rgba(212,175,55,0.35)' : 'rgba(176,130,38,0.25)'}
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className={`absolute right-4 bottom-3 text-xs ${mutedText}`}>
                  {t.wiki.energy_level} {energyLevel}%
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-4 relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative space-y-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold-500">
                <Sparkles size={14} />
                {t.wiki.daily_wisdom}
              </div>
              {hasDaily ? (
                <>
                  <blockquote className="text-lg md:text-xl font-serif italic leading-relaxed line-clamp-4">
                    “{home?.daily_wisdom?.quote}”
                  </blockquote>
                  <div className={`text-xs ${mutedText}`}>— {home?.daily_wisdom?.author}</div>
                </>
              ) : (
                <div className={`text-sm ${mutedText} ${loading ? 'animate-pulse' : ''}`}>
                  {loading ? t.common.loading : t.app.error}
                </div>
              )}
            </div>
            <div className={`relative mt-6 flex items-center justify-between pt-4 border-t ${borderColor}`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${borderColor} ${theme === 'dark' ? 'text-star-300 hover:text-gold-400' : 'text-paper-500 hover:text-gold-600'}`}
                >
                  <Heart size={16} />
                </button>
                <button
                  type="button"
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${borderColor} ${theme === 'dark' ? 'text-star-300 hover:text-gold-400' : 'text-paper-500 hover:text-gold-600'}`}
                >
                  <Share2 size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('wisdom')}
                className={`text-xs uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-gold-400' : 'text-gold-600'} hover:opacity-80`}
              >
                {t.wiki.daily_wisdom_action}
              </button>
            </div>
          </Card>
        </div>
      </Section>

      <Section title={t.wiki.pillars_title} action={<div className={`text-xs uppercase tracking-[0.3em] ${mutedText}`}>{t.wiki.pillars_subtitle}</div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(home?.pillars || []).map((pillar, index) => (
            <Card
              key={pillar.id}
              onClick={() => navigate(`/wiki?tab=library&section=${pillar.id}`)}
              className="group text-center space-y-4 cursor-pointer"
            >
              <div
                className="text-4xl transition-transform duration-300 group-hover:scale-110"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {resolvePillarIcon(pillar)}
              </div>
              <div className="text-lg font-serif font-semibold">{pillar.label}</div>
              <div className={`text-xs leading-relaxed ${mutedText}`}>{pillar.desc}</div>
              <div className={`text-xs uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-gold-400' : 'text-gold-600'}`}>
                {t.wiki.pillars_action}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Modal isOpen={activeModal === 'transit'} onClose={() => setActiveModal(null)} title={t.wiki.daily_transit_modal}>
        {home?.daily_transit ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs">
              <span className={mutedText}>{home.daily_transit.date}</span>
              <span className={`px-2 py-0.5 rounded-full border ${borderColor}`}>{home.daily_transit.highlight}</span>
            </div>
            <h3 className="text-xl font-serif font-semibold">{home.daily_transit.title}</h3>
            <p className={`text-sm leading-relaxed ${mutedText}`}>{home.daily_transit.summary}</p>
            <div className="grid gap-4">
              {home.daily_transit.guidance.map((item) => (
                <div key={item.title} className={`p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-space-900/60' : 'bg-white/80'}`}>
                  <div className="text-xs uppercase tracking-[0.2em] text-gold-500 mb-2">{item.title}</div>
                  <div className={`text-sm ${mutedText}`}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`text-sm ${mutedText}`}>{t.common.loading}</div>
        )}
      </Modal>

      <Modal isOpen={activeModal === 'wisdom'} onClose={() => setActiveModal(null)} title={t.wiki.daily_wisdom_modal}>
        {home?.daily_wisdom ? (
          <div className="space-y-6">
            <blockquote className="text-lg font-serif italic leading-relaxed text-center">
              “{home.daily_wisdom.quote}”
            </blockquote>
            <div className={`text-xs text-center ${mutedText}`}>{home.daily_wisdom.author} · {home.daily_wisdom.source}</div>
            <div className={`text-sm leading-relaxed ${mutedText}`}>{home.daily_wisdom.interpretation}</div>
          </div>
        ) : (
          <div className={`text-sm ${mutedText}`}>{t.common.loading}</div>
        )}
      </Modal>

      {error && (
        <Card className="border-l-2 border-l-danger/60 flex items-center justify-between gap-4">
          <div className="text-sm text-danger">{error}</div>
          <ActionButton variant="outline" onClick={() => setRefreshKey((prev) => prev + 1)}>
            {t.common.retry}
          </ActionButton>
        </Card>
      )}
    </div>
  );
};

export default WikiHomePage;
