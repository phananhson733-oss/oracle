// INPUT: Wiki 条目详情与关联条目数据（含 1280 容器约束与符号文本变体）。
// OUTPUT: 导出 Wiki 详情页组件（含阅读宽度限制与 Unicode 图标显示）。
// POS: Wiki 详情模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Accordion, ActionButton, Card, Container, Modal, Section, useLanguage, useTheme } from '../UIComponents';
import { ArrowLeft, Brain, Copy, Download, GitMerge, Ghost, Network, ScrollText, Sparkles, Wand2 } from 'lucide-react';
import { fetchWikiItem, fetchWikiItems } from '../../services/apiClient';
import type { WikiItem, WikiItemSummary } from '../../types';

const renderContent = (content: string, highlightClass: string) => {
  if (!content) return null;
  return content.split('\n\n').map((paragraph, idx) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return (
        <h4 key={idx} className={`text-base font-semibold mt-6 mb-2 ${highlightClass}`}>
          {trimmed.replace(/\*\*/g, '')}
        </h4>
      );
    }
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={idx} className="text-sm leading-relaxed mb-4">
        {parts.map((part, i) => (
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className={`font-semibold ${highlightClass}`}>{part.replace(/\*\*/g, '')}</strong>
            : <span key={i}>{part}</span>
        ))}
      </p>
    );
  });
};

const forceTextSymbol = (value: string) => {
  if (!value) return value;
  const stripped = value.replace(/\uFE0F/g, '').replace(/\uFE0E/g, '');
  return `${stripped}\uFE0E`;
};

const WikiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [item, setItem] = useState<WikiItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<WikiItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const mutedText = theme === 'dark' ? 'text-star-400' : 'text-paper-500';
  const borderColor = theme === 'dark' ? 'border-space-600' : 'border-paper-300';
  const highlightClass = theme === 'dark' ? 'text-gold-400' : 'text-gold-600';

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

  const energyNodes = useMemo(() => {
    if (!item) return [];
    return [
      { key: 'psychology', label: t.wiki.detail_map_psychology, icon: Brain, content: item.psychology },
      { key: 'shadow', label: t.wiki.detail_map_shadow, icon: Ghost, content: item.shadow },
      { key: 'myth', label: t.wiki.detail_map_myth, icon: ScrollText, content: item.astronomy_myth },
      { key: 'integration', label: t.wiki.detail_map_integration, icon: GitMerge, content: item.integration || t.wiki.detail_placeholder },
    ];
  }, [item, t.wiki]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors.
    }
  };

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
          <Card className="border-l-2 border-l-danger/60 text-sm text-danger">{error || t.app.error}</Card>
          <Link to="/wiki?tab=library" className={`inline-flex items-center gap-2 text-sm ${mutedText}`}>
            <ArrowLeft size={16} /> {t.wiki.detail_back}
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/wiki?tab=library" className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-gold-500 transition-colors`}>
            <ArrowLeft size={16} /> {t.wiki.detail_back}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton variant="outline" size="sm" onClick={() => setMapOpen(true)}>
              <Network size={16} /> {t.wiki.detail_map}
            </ActionButton>
            <ActionButton variant="outline" size="sm" onClick={handleCopy}>
              <Copy size={16} /> {copied ? t.wiki.detail_copied : t.wiki.detail_copy}
            </ActionButton>
            <ActionButton
              variant="outline"
              size="sm"
              onClick={() => alert(t.wiki.detail_export_hint)}
            >
              <Download size={16} /> {t.wiki.detail_export}
            </ActionButton>
          </div>
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
            <Card className="space-y-3">
              <div className={`text-xs uppercase tracking-[0.3em] ${highlightClass}`}>{t.wiki.detail_archetype}</div>
              <div className="text-xl font-serif font-semibold">{item.prototype}</div>
            </Card>
            <Card className="space-y-3">
              <div className={`text-xs uppercase tracking-[0.3em] ${highlightClass}`}>{t.wiki.detail_analogy}</div>
              <div className={`text-base italic ${mutedText}`}>“{item.analogy}”</div>
            </Card>
          </div>
        </Section>

        <Section title={t.wiki.detail_core}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.3em] text-amber-500">
                <ScrollText size={16} /> {t.wiki.detail_myth}
              </div>
              <div className={`text-sm ${mutedText}`}>{renderContent(item.astronomy_myth || t.wiki.detail_placeholder, highlightClass)}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.3em] text-blue-400">
                <Brain size={16} /> {t.wiki.detail_psychology}
              </div>
              <div className={`text-sm ${mutedText}`}>{renderContent(item.psychology || t.wiki.detail_placeholder, highlightClass)}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.3em] text-purple-400">
                <Ghost size={16} /> {t.wiki.detail_shadow}
              </div>
              <div className={`text-sm ${mutedText}`}>{renderContent(item.shadow || t.wiki.detail_placeholder, highlightClass)}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.3em] text-emerald-400">
                <GitMerge size={16} /> {t.wiki.detail_integration}
              </div>
              <div className={`text-sm ${mutedText}`}>{renderContent(item.integration || t.wiki.detail_placeholder, highlightClass)}</div>
            </Card>
          </div>
        </Section>

      {item.deep_dive && item.deep_dive.length > 0 && (
        <Section title={t.wiki.detail_deep_dive}>
          {item.deep_dive.map((step) => (
            <Accordion key={`${item.id}-${step.step}`} title={`${t.wiki.detail_step} ${step.step}`} subtitle={step.title}>
              <div className={`text-sm ${mutedText}`}>{renderContent(step.description, highlightClass)}</div>
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

        <Modal isOpen={mapOpen} onClose={() => setMapOpen(false)} title={t.wiki.detail_map_title}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {energyNodes.map((node) => {
              const Icon = node.icon;
              return (
                <Card key={node.key} className="space-y-3">
                  <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.3em] ${highlightClass}`}>
                    <Icon size={16} />
                    {node.label}
                  </div>
                  <div className={`text-sm ${mutedText}`}>{renderContent(node.content, highlightClass)}</div>
                </Card>
              );
            })}
          </div>
        </Modal>
      </div>
    </Container>
  );
};

export default WikiDetailPage;
