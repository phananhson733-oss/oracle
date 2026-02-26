// INPUT: Related Wiki items component for internal linking and SEO.
// OUTPUT: Displays related planets, signs, aspects, and concepts with links.
// POS: Wiki component; update components/wiki/FOLDER.md when this file changes.

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, useTheme, Card, ActionButton } from '../UIComponents';
import { getRelatedItems, type RelatedItem, type RelationType } from '../../data/wiki-associations';
import { trackEvent } from '../../services/analytics';
import type { WikiItemType } from '../../types';

interface RelatedArticlesProps {
  itemId: string;
  itemType: WikiItemType;
  title?: string;
  maxItems?: number;
  showRelationType?: boolean;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  itemId,
  itemType,
  title,
  maxItems = 6,
  showRelationType = true,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const relatedItems = useMemo(() => {
    return getRelatedItems(itemId, itemType).slice(0, maxItems);
  }, [itemId, itemType, maxItems]);

  if (relatedItems.length === 0) {
    return null;
  }

  const getRelationLabel = (relation: RelationType): string => {
    const labels: Record<RelationType, string> = {
      ruling: t.wiki?.relation_ruling || 'Ruler',
      exalted: t.wiki?.relation_exalted || 'Exaltation',
      detriment: t.wiki?.relation_detriment || 'Detriment',
      fall: t.wiki?.relation_fall || 'Fall',
      opposite: t.wiki?.relation_opposite || 'Opposition',
      square: t.wiki?.relation_square || 'Square',
      trine: t.wiki?.relation_trine || 'Trine',
      sextile: t.wiki?.relation_sextile || 'Sextile',
      conjunction: t.wiki?.relation_conjunction || 'Conjunction',
      'same-element': t.wiki?.relation_same_element || 'Same Element',
      'same-modality': t.wiki?.relation_same_modality || 'Same Modality',
      'ruling-planet': t.wiki?.relation_ruling_planet || 'Ruling Planet',
      'natural-correspondence': t.wiki?.relation_correspondence || 'Correspondence',
    };
    return labels[relation] || relation;
  };

  const getItemDisplayName = (id: string, type: WikiItemType): string => {
    // Try to get translated name from existing translations
    const translationKey = `wiki.${type}_${id}`;
    const translated = (t as Record<string, string>)[translationKey];
    if (translated) return translated;

    // Fallback: capitalize first letter
    return id.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const UNICODE_SYMBOLS: Record<string, string> = {
    sun: '☉', moon: '☾', mercury: '☿', venus: '♀', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
    aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌',
    virgo: '♍', libra: '♎', scorpio: '♏', sagittarius: '♐',
    capricorn: '♑', aquarius: '♒', pisces: '♓',
    'north-node': '☊', 'south-node': '☋', chiron: '⚷', lilith: '⚸', juno: '⚵',
  };

  const TYPE_FALLBACK_ICONS: Partial<Record<WikiItemType, string>> = {
    planets: '☉', signs: '♈', houses: '⌂', aspects: '∠',
    asteroids: '✶', points: '●', angles: '◐', 'chart-types': '◈',
  };

  const forceTextSymbol = (value: string) => {
    const sanitized = value.replace(/\uFE0F/g, '');
    if (!sanitized) return sanitized;
    if (/^[A-Za-z0-9]+$/.test(sanitized)) return sanitized;
    return `${sanitized}\uFE0E`;
  };

  const getItemIcon = (id: string, type: WikiItemType): string => {
    return forceTextSymbol(UNICODE_SYMBOLS[id] || TYPE_FALLBACK_ICONS[type] || '✦');
  };

  const borderColor = isDark ? 'border-gold-500/20' : 'border-paper-200';
  const mutedText = isDark ? 'text-star-400' : 'text-paper-500';
  const hoverBg = isDark ? 'hover:bg-star-900/20' : 'hover:bg-paper-50';

  return (
    <section className="related-articles">
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
        {title || t.wiki?.related_content || 'Related Content'}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {relatedItems.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={`/wiki/${item.id}`}
            onClick={() => trackEvent('wiki_related_article_clicked', { article_id: item.id, article_title: getItemDisplayName(item.id, item.type), article_type: item.type, relation: item.relation })}
            className={`
              flex items-center gap-3 p-3 rounded-lg border ${borderColor} ${hoverBg}
              transition-all duration-200 hover:border-gold-500/40
            `}
          >
            <span className={`text-xl ${mutedText}`} style={{ fontFamily: 'serif' }}>
              {getItemIcon(item.id, item.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
                {getItemDisplayName(item.id, item.type)}
              </div>
              {showRelationType && (
                <div className={`text-xs ${mutedText}`}>
                  {getRelationLabel(item.relation)}
                </div>
              )}
            </div>
            <ActionButton size="sm" variant="ghost" className="shrink-0">
              →
            </ActionButton>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
