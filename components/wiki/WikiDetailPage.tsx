// INPUT: Wiki 条目详情与关联条目数据（含 SEO 元信息、hreflang 校验与符号文本变体）。
// OUTPUT: 导出 Wiki 详情页组件（含阅读宽度限制、SEO 输出与多语言链接校验）。
// POS: Wiki 详情模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Accordion, Card, Container, Section, useLanguage, useTheme } from '../UIComponents';
import { SEO } from '../SEO';
import { ArrowLeft, Brain, GitMerge, Ghost, ScrollText, Sparkles, Wand2 } from 'lucide-react';
import { fetchWikiItem, fetchWikiItems } from '../../services/apiClient';
import type { WikiItem, WikiItemSummary } from '../../types';

const renderContent = (content: string, highlightClass: string, mutedClass: string = 'text-star-400') => {
  if (!content) return null;

  let textToRender = content;
  const hasExplicitListMarkers = /(\n\s*[-*]|\n\s*\d+\.)/.test(content);

  if (!hasExplicitListMarkers) {
    const logicKeywords = [
      '首先', '其次', '再次', '最后', '第一', '第二', '第三',
      '其一', '其二', '其三', '例如', '比如', '值得注意的是',
      'First', 'Second', 'Third', 'Finally', 'Next', 'Moreover', 'Furthermore'
    ];
    const logicPattern = new RegExp(`([。；;！!？?]|^)\\s*(${logicKeywords.join('|')})(?=[，,：:])`, 'g');
    textToRender = content.replace(logicPattern, '$1\n$2');
  }

  const cleanText = (text: string) => text.replace(/\*\*/g, '').trim();

  const isList = textToRender.includes('\n- ') || textToRender.includes('\n* ') || /^\d+\.\s/.test(textToRender);

  if (isList) {
    const lines = textToRender.split('\n').filter(line => line.trim());
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const hasBold = parts.some(p => p.startsWith('**') && p.endsWith('**'));
          const cleanedLine = cleanText(line.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, ''));

          return (
            <div key={idx} className="flex gap-3 items-start text-sm leading-relaxed">
              <span className={`mt-2 w-1 h-1 rounded-full shrink-0 ${highlightClass.replace('text-', 'bg-')}`} />
              <div className={`flex-1 ${mutedClass}`}>
                {hasBold ? (
                  parts.map((part, i) => (
                    part.startsWith('**') && part.endsWith('**')
                      ? <span key={i} className={`font-medium ${highlightClass}`}>{part.replace(/\*\*/g, '')}</span>
                      : <span key={i}>{part}</span>
                  ))
                ) : (
                  <span>{cleanedLine}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 结构化段落渲染 - 用字色突出而非空行分隔
  const paragraphs = textToRender.split('\n\n').filter(p => p.trim());
  return (
    <div className="space-y-0">
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        // 标题行 - 用金色突出
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <div key={idx} className={`${idx > 0 ? 'mt-4' : ''} mb-1.5`}>
              <span className={`text-sm font-semibold ${highlightClass}`}>
                {trimmed.replace(/\*\*/g, '')}
              </span>
            </div>
          );
        }

        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className={`text-sm leading-relaxed ${mutedClass} ${idx > 0 ? 'mt-2' : ''}`}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={i} className={`font-medium ${highlightClass}`}>{part.replace(/\*\*/g, '')}</span>;
              }
              return part.split('\n').map((subPart, subIdx) => (
                <React.Fragment key={`${i}-${subIdx}`}>
                  {subIdx > 0 && ' '}
                  <span>{subPart}</span>
                </React.Fragment>
              ));
            })}
          </p>
        );
      })}
    </div>
  );
};

const forceTextSymbol = (value: string) => {
  if (!value) return value;
  const stripped = value.replace(/\uFE0F/g, '').replace(/\uFE0E/g, '');
  return `${stripped}\uFE0E`;
};

type AlternateLink = { hrefLang: string; href: string };
type LanguageAvailability = { zh: boolean; en: boolean };

const buildAlternateLanguages = (siteUrl: string, pathSuffix: string, availability: LanguageAvailability): AlternateLink[] => {
  const zhUrl = `${siteUrl}/zh${pathSuffix}`;
  const enUrl = `${siteUrl}/en${pathSuffix}`;
  const links: AlternateLink[] = [];
  if (availability.zh) links.push({ hrefLang: 'zh', href: zhUrl });
  if (availability.en) links.push({ hrefLang: 'en', href: enUrl });
  const defaultLang = availability.en ? 'en' : availability.zh ? 'zh' : null;
  if (defaultLang) {
    links.push({ hrefLang: 'x-default', href: defaultLang === 'en' ? enUrl : zhUrl });
  }
  return links;
};

const WikiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [item, setItem] = useState<WikiItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<WikiItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutedText = theme === 'dark' ? 'text-star-400' : 'text-paper-500';
  const borderColor = theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300';
  const highlightClass = theme === 'dark' ? 'text-gold-400' : 'text-gold-600';
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.astrologywiki.com';
  const lang = language === 'en' ? 'en' : 'zh';
  const detailPath = id ? `/wiki/${id}` : '/wiki';
  const canonicalUrl = `${siteUrl}/${lang}${detailPath}`;
  const [alternateAvailability, setAlternateAvailability] = useState<LanguageAvailability>(() => ({
    zh: lang === 'zh',
    en: lang === 'en',
  }));
  const alternateLanguages = useMemo(
    () => buildAlternateLanguages(siteUrl, detailPath, alternateAvailability),
    [alternateAvailability, detailPath, siteUrl]
  );

  useEffect(() => {
    let active = true;
    if (!id) {
      setAlternateAvailability({ zh: true, en: true });
      return () => {
        active = false;
      };
    }
    const otherLang: 'zh' | 'en' = lang === 'en' ? 'zh' : 'en';
    setAlternateAvailability({ zh: lang === 'zh', en: lang === 'en' });
    fetchWikiItem(id, otherLang)
      .then(() => {
        if (!active) return;
        setAlternateAvailability((prev) => ({ ...prev, [otherLang]: true }));
      })
      .catch(() => {
        if (!active) return;
        setAlternateAvailability((prev) => ({ ...prev, [otherLang]: false }));
      });
    return () => {
      active = false;
    };
  }, [id, lang]);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const detail = await fetchWikiItem(id, language);
        if (!mounted) return;
        setItem(detail.item);

        const relatedIds = detail.item.related_ids || [];
        if (relatedIds.length > 0) {
          const list = await fetchWikiItems(language);
          if (!mounted) return;
          setRelatedItems((list.items || []).filter((entry) => relatedIds.includes(entry.id)));
        } else {
          setRelatedItems([]);
        }
        window.scrollTo(0, 0);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || t.app.error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, language, t.app.error]);

  const typeLabel = useMemo(() => {
    if (!item) return '';
    return t.wiki.type_labels[item.type] || item.type;
  }, [item, t.wiki.type_labels]);

  if (loading) {
    return (
      <Container>
        <div className="space-y-6">
          <Card className="text-sm animate-pulse">{t.common.loading}</Card>
        </div>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container>
        <div className="space-y-6">
          <Card className="border-l border-l-danger/40 text-sm text-danger">{error || t.app.error}</Card>
          <Link to="/wiki?tab=library" className={`inline-flex items-center gap-2 text-sm ${mutedText}`}>
            <ArrowLeft size={16} /> {t.wiki.detail_back}
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <SEO
        title={item.title}
        description={item.description || t.wiki.subtitle}
        keywords={item.keywords}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        type="article"
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: item.title,
            description: item.description,
            inDefinedTermSet: {
              '@type': 'DefinedTermSet',
              name: 'AstrologyWiki',
              url: `${siteUrl}/${lang}/wiki`,
            },
            url: canonicalUrl,
            inLanguage: lang,
            alternateName: item.subtitle || undefined,
            keywords: item.keywords,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: t.wiki.tab_home, item: `${siteUrl}/${lang}/` },
              { '@type': 'ListItem', position: 2, name: t.wiki.tab_library, item: `${siteUrl}/${lang}/wiki` },
              { '@type': 'ListItem', position: 3, name: item.title, item: canonicalUrl },
            ],
          },
        ]}
      />
      <div className="space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/wiki?tab=library" className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-gold-500 transition-colors`}>
            <ArrowLeft size={16} /> {t.wiki.detail_back}
          </Link>
        </div>

        <Card className="relative overflow-hidden" noPadding>
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color_token || 'from-gold-500/15 to-transparent'} opacity-20`} />
          <div className="relative p-8 md:p-12 grid gap-8 md:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-6">
              <div className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${borderColor}`}>
                <Wand2 size={14} className={highlightClass} />
                {typeLabel}
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-serif font-semibold">{item.title}</h1>
                {item.subtitle && <div className={`text-lg md:text-xl italic ${mutedText}`}>{item.subtitle}</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                {item.keywords.map((keyword) => (
                  <span key={keyword} className={`text-xs px-3 py-1 rounded-full border ${borderColor}`}>
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-[120px] md:text-[160px] opacity-90">{forceTextSymbol(item.symbol)}</div>
            </div>
          </div>
        </Card>

        <Section title={t.wiki.detail_tldr}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-paper-100/85 border-paper-300'}`}>
              <div className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${highlightClass}`}>{t.wiki.detail_archetype}</div>
              <div className="text-xl font-serif font-semibold text-star-50">{item.prototype}</div>
            </div>
            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-paper-100/85 border-paper-300'}`}>
              <div className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${highlightClass}`}>{t.wiki.detail_analogy}</div>
              <div className={`text-base italic ${mutedText}`}>"{item.analogy}"</div>
            </div>
          </div>
        </Section>

        <Section title={t.wiki.detail_core}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-paper-100/85 border-paper-300'}`}>
              <div className={`flex items-center gap-3 mb-4`}>
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-600'}`}>
                  <ScrollText size={16} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{t.wiki.detail_myth}</span>
              </div>
              {renderContent(item.astronomy_myth || t.wiki.detail_placeholder, highlightClass, mutedText)}
            </div>
            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-paper-100/85 border-paper-300'}`}>
              <div className={`flex items-center gap-3 mb-4`}>
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
                  <Brain size={16} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{t.wiki.detail_psychology}</span>
              </div>
              {renderContent(item.psychology || t.wiki.detail_placeholder, highlightClass, mutedText)}
            </div>
            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-paper-100/85 border-paper-300'}`}>
              <div className={`flex items-center gap-3 mb-4`}>
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`}>
                  <Ghost size={16} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{t.wiki.detail_shadow}</span>
              </div>
              {renderContent(item.shadow || t.wiki.detail_placeholder, highlightClass, mutedText)}
            </div>
            <div className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === 'dark' ? 'bg-space-800/40 border-gold-500/10' : 'bg-paper-100/85 border-paper-300'}`}>
              <div className={`flex items-center gap-3 mb-4`}>
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  <GitMerge size={16} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{t.wiki.detail_integration}</span>
              </div>
              {renderContent(item.integration || t.wiki.detail_placeholder, highlightClass, mutedText)}
            </div>
          </div>
        </Section>

      {item.deep_dive && item.deep_dive.length > 0 && (
        <Section title={t.wiki.detail_deep_dive}>
          {item.deep_dive.map((step) => (
            <Accordion key={`${item.id}-${step.step}`} title={step.title}>
              {renderContent(step.description, highlightClass, mutedText)}
            </Accordion>
          ))}
        </Section>
      )}

      {relatedItems.length > 0 && (
        <Section title={t.wiki.detail_related}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedItems.map((entry) => (
              <Link key={entry.id} to={`/wiki/${entry.id}`} className="block group">
                <Card className="flex items-center gap-4">
                  <div className="text-3xl">{forceTextSymbol(entry.symbol)}</div>
                  <div className="flex-1">
                    <div className="font-serif font-semibold">{entry.title}</div>
                    <div className={`text-xs ${mutedText}`}>{entry.description}</div>
                  </div>
                  <Sparkles size={16} className={`${mutedText} group-hover:text-gold-400`} />
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      </div>
    </Container>
  );
};

export default WikiDetailPage;
