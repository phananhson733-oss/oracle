// INPUT: Wiki 条目列表与筛选状态（含 Unicode 文本图标与 i18n 分离）。
// OUTPUT: 导出 Wiki 百科页组件（含三列概念网格与符号文本化）。
// POS: Wiki 百科模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, GlassInput, Section, useLanguage, useTheme } from '../UIComponents';
import { ArrowUpRight, Search } from 'lucide-react';
import { fetchWikiItems } from '../../services/apiClient';
import type { WikiItemSummary, WikiItemType } from '../../types';

type TileSize = 'lg' | 'md' | 'sm';

const buildGradient = (token?: string) => token || 'from-gold-500/20 via-gold-500/5 to-transparent';
const UNICODE_SYMBOLS: Record<string, string> = {
  sun: '☉',
  moon: '☾',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
  'north-node': '☊',
  'south-node': '☋',
  chiron: '⚷',
  lilith: '⚸',
  juno: '⚵',
};

const forceTextSymbol = (value: string) => {
  const sanitized = value.replace(/\uFE0F/g, '');
  if (!sanitized) return sanitized;
  if (/^[A-Za-z0-9]+$/.test(sanitized)) return sanitized;
  return `${sanitized}\uFE0E`;
};

const matchesQuery = (item: WikiItemSummary, query: string) => {
  const haystack = [
    item.title,
    item.subtitle,
    item.description,
    ...item.keywords,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query);
};

const stripLatin = (value: string) => {
  if (!value) return value;
  return value
    .replace(/\([^)]*[A-Za-z][^)]*\)/g, '')
    .replace(/[A-Za-z]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([，。！？、；：])/g, '$1')
    .trim();
};

const pickLastSentence = (value: string) => {
  if (!value) return value;
  const parts = value.split(/[。！？.!?]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return value.trim();
  return parts[parts.length - 1];
};

const WikiIndexPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();
  const [items, setItems] = useState<WikiItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const mutedText = theme === 'dark' ? 'text-star-400' : 'text-paper-500';
  const borderColor = theme === 'dark' ? 'border-space-600' : 'border-paper-300';
  const hoverTone = theme === 'dark'
    ? 'hover:border-accent/40 hover:bg-space-900/70'
    : 'hover:border-accent/40 hover:bg-paper-100/80';
  const overlayTone = theme === 'dark' ? 'bg-space-950/70' : 'bg-paper-50/80';
  const symbolTone = theme === 'dark' ? 'text-star-100' : 'text-paper-700';

  const formatText = (value: string) => (language === 'zh' ? stripLatin(value) : value);
  const getPanelDescription = (value: string) => pickLastSentence(formatText(value));
  const getDisplaySymbol = (item: WikiItemSummary) => {
    const rawSymbol = ['planets', 'signs', 'points', 'asteroids'].includes(item.type)
      ? (UNICODE_SYMBOLS[item.id] || item.symbol)
      : item.symbol;
    return forceTextSymbol(rawSymbol);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchWikiItems(language)
      .then((data) => {
        if (!mounted) return;
        setItems(data.items || []);
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
  }, [language, t.app.error]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => matchesQuery(item, query));
  }, [items, searchTerm]);

  const groupByType = (type: WikiItemType) => filteredItems.filter((item) => item.type === type);
  const concepts = groupByType('concepts');
  const angles = groupByType('angles');
  const planets = groupByType('planets');
  const points = groupByType('points');
  const asteroids = groupByType('asteroids');
  const signs = groupByType('signs');
  const houses = groupByType('houses');
  const aspects = groupByType('aspects');
  const chartTypes = groupByType('chart-types');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('section');
    if (!target) return;
    const element = document.getElementById(target);
    if (!element) return;
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, [location.search, items]);

  const renderCardShell = (item: WikiItemSummary, content: React.ReactNode, className = '') => {
    const gradient = buildGradient(item.color_token);
    return (
      <Link key={item.id} to={`/wiki/${item.id}`} className="block group">
        <Card className={`relative overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 ${hoverTone} ${className}`} noPadding>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80`} />
          <div className={`absolute inset-0 ${overlayTone}`} />
          <div className="relative h-full">{content}</div>
        </Card>
      </Link>
    );
  };

  const renderFeatureCard = (item: WikiItemSummary) => {
    const detail = item.subtitle ? formatText(item.subtitle) : getPanelDescription(item.description);
    const displayTitle = formatText(item.title);
    const displaySymbol = getDisplaySymbol(item);
    return renderCardShell(
      item,
      <div className="p-5 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center text-2xl ${theme === 'dark' ? 'bg-space-900/70' : 'bg-white/80'}`}>
          {displaySymbol}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold-500">{t.wiki.type_labels[item.type]}</div>
          <div className="text-lg font-serif font-semibold">{displayTitle}</div>
          {detail && <div className={`text-xs ${mutedText} line-clamp-2`}>{detail}</div>}
        </div>
        <ArrowUpRight className={`opacity-0 group-hover:opacity-100 transition-opacity ${mutedText}`} size={16} />
      </div>,
      'min-h-[120px]'
    );
  };

  const renderTileCard = (item: WikiItemSummary, size: TileSize) => {
    const settings: Record<TileSize, { padding: string; symbol: string; title: string; subtitle: string; aspect: string }> = {
      lg: { padding: 'p-5', symbol: 'text-3xl', title: 'text-base', subtitle: 'text-xs', aspect: 'aspect-[5/4]' },
      md: { padding: 'p-4', symbol: 'text-2xl', title: 'text-sm', subtitle: 'text-[11px]', aspect: 'aspect-[4/3]' },
      sm: { padding: 'p-4', symbol: 'text-2xl', title: 'text-sm', subtitle: 'text-[11px]', aspect: 'aspect-[4/3]' },
    };
    const config = settings[size];
    const showSubtitle = size !== 'sm';
    const displaySymbol = getDisplaySymbol(item);
    const displayTitle = formatText(item.title);
    const displaySubtitle = item.subtitle ? formatText(item.subtitle) : '';
    return renderCardShell(
      item,
      <div className={`h-full flex flex-col justify-between ${config.padding}`}>
        <div className="flex items-start justify-between">
          <div className={`${config.symbol} drop-shadow-lg ${symbolTone}`}>{displaySymbol}</div>
          <ArrowUpRight className={`opacity-0 group-hover:opacity-100 transition-opacity ${mutedText}`} size={16} />
        </div>
        <div className="space-y-1">
          <div className={`font-serif font-semibold ${config.title}`}>{displayTitle}</div>
          {showSubtitle && displaySubtitle && (
            <div className={`${config.subtitle} ${mutedText} line-clamp-2`}>{displaySubtitle}</div>
          )}
        </div>
      </div>,
      config.aspect
    );
  };

  const renderListCard = (item: WikiItemSummary) => {
    const displaySymbol = getDisplaySymbol(item);
    const displayTitle = formatText(item.title);
    const displayDescription = getPanelDescription(item.description);
    return renderCardShell(
      item,
      <div className="p-4 flex items-start gap-3">
        <div className={`text-2xl ${symbolTone}`}>{displaySymbol}</div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-serif font-semibold">{displayTitle}</div>
            <ArrowUpRight className={`opacity-0 group-hover:opacity-100 transition-opacity ${mutedText}`} size={16} />
          </div>
          {displayDescription && <div className={`text-xs ${mutedText} line-clamp-2`}>{displayDescription}</div>}
        </div>
      </div>,
      'min-h-[104px]'
    );
  };

  const renderTopicCard = (item: WikiItemSummary) => {
    const displaySymbol = getDisplaySymbol(item);
    const displayTitle = formatText(item.title);
    const displayDescription = getPanelDescription(item.description);
    return renderCardShell(
      item,
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-2xl ${symbolTone}`}>{displaySymbol}</div>
          <ArrowUpRight className={`opacity-0 group-hover:opacity-100 transition-opacity ${mutedText}`} size={16} />
        </div>
        <div className="text-lg font-serif font-semibold">{displayTitle}</div>
        {displayDescription && <div className={`text-xs leading-relaxed ${mutedText} line-clamp-3`}>{displayDescription}</div>}
      </div>,
      'min-h-[160px]'
    );
  };

  return (
    <div className="space-y-16">
      <section className="text-center space-y-6 pt-6">
        <div className={`text-xs uppercase tracking-[0.35em] ${theme === 'dark' ? 'text-gold-400' : 'text-gold-600'}`}>
          {t.wiki.kicker}
        </div>
        <h2 className="text-4xl md:text-6xl font-serif font-semibold">{t.wiki.library_title}</h2>
        <p className={`text-sm md:text-base ${mutedText} max-w-2xl mx-auto`}>{t.wiki.library_subtitle}</p>
        <div className="max-w-xl mx-auto relative">
          <GlassInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t.wiki.search_placeholder}
            className="pl-12 py-4 text-base !h-12"
          />
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`} size={18} />
        </div>
      </section>

      {loading && (
        <Card className="text-sm animate-pulse">{t.common.loading}</Card>
      )}
      {error && (
        <Card className="border-l-2 border-l-danger/60 text-sm text-danger">{error}</Card>
      )}

      {!loading && !error && searchTerm.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => renderFeatureCard(item))}
          {filteredItems.length === 0 && (
            <Card className={`col-span-full text-center text-sm ${mutedText}`}>{t.wiki.library_empty}</Card>
          )}
        </div>
      )}

      {!loading && !error && !searchTerm.trim() && (
        <div className="space-y-16">
          <Section title={t.wiki.section_concepts}>
            <div id="concepts" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
              {[...concepts, ...angles].map((item) => renderFeatureCard(item))}
            </div>
          </Section>

          <Section title={t.wiki.section_planets}>
            <div id="planets" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 scroll-mt-24">
              {planets.map((item) => renderTileCard(item, 'lg'))}
            </div>
          </Section>

          <Section title={t.wiki.section_points}>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[...points, ...asteroids].map((item) => renderTileCard(item, 'sm'))}
            </div>
          </Section>

          <Section title={t.wiki.section_signs}>
            <div id="signs" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 scroll-mt-24">
              {signs.map((item) => renderTileCard(item, 'md'))}
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <Section title={t.wiki.section_houses} className="lg:col-span-2">
              <div id="houses" className="grid grid-cols-3 sm:grid-cols-4 gap-3 scroll-mt-24">
                {houses.map((item) => renderTileCard(item, 'sm'))}
              </div>
            </Section>

            <Section title={t.wiki.section_aspects}>
              <div id="aspects" className="space-y-3 scroll-mt-24">
                {aspects.map((item) => renderListCard(item))}
              </div>
            </Section>
          </div>

          <Section title={t.wiki.section_chart_types}>
            <div id="chart-types" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-24">
              {chartTypes.map((item) => renderTopicCard(item))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default WikiIndexPage;
