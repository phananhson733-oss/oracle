// INPUT: Related Wiki items component for internal linking and SEO.
// OUTPUT: Displays related planets, signs, aspects, and concepts with links.
// POS: Wiki component; update components/wiki/FOLDER.md when this file changes.

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, useTheme, Card, ActionButton } from '../UIComponents';
import { getRelatedItems, type RelatedItem, type RelationType } from '../../data/wiki-associations';
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
      ruling: t.wiki?.relation_ruling || '守护',
      exalted: t.wiki?.relation_exalted || '旺势',
      detriment: t.wiki?.relation_detriment || '失势',
      fall: t.wiki?.relation_fall || '落陷',
      opposite: t.wiki?.relation_opposite || '对冲',
      square: t.wiki?.relation_square || '刑克',
      trine: t.wiki?.relation_trine || '拱',
      sextile: t.wiki?.relation_sextile || '六分',
      conjunction: t.wiki?.relation_conjunction || '合相',
      'same-element': t.wiki?.relation_same_element || '同元素',
      'same-modality': t.wiki?.relation_same_modality || '同模式',
      'ruling-planet': t.wiki?.relation_ruling_planet || '守护星',
      'natural-correspondence': t.wiki?.relation_correspondence || '关联',
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

  const getTypeIcon = (type: WikiItemType): string => {
    const icons: Partial<Record<WikiItemType, string>> = {
      planets: '☉',
      signs: '♈',
      houses: '⌂',
      aspects: '∠',
      asteroids: '✶',
      points: '●',
      angles: '◐',
      'chart-types': '◈',
    };
    return icons[type] || '✦';
  };

  const borderColor = isDark ? 'border-gold-500/20' : 'border-paper-200';
  const mutedText = isDark ? 'text-star-400' : 'text-paper-500';
  const hoverBg = isDark ? 'hover:bg-star-900/20' : 'hover:bg-paper-50';

  return (
    <section className="related-articles">
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
        {title || t.wiki?.related_content || '相关内容'}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {relatedItems.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={`/wiki/${item.id}`}
            className={`
              flex items-center gap-3 p-3 rounded-lg border ${borderColor} ${hoverBg}
              transition-all duration-200 hover:border-gold-500/40
            `}
          >
            <span className={`text-xl ${mutedText}`}>
              {getTypeIcon(item.type)}
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
