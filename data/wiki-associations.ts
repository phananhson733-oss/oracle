// INPUT: Wiki item association matrix for internal linking and related content.
// OUTPUT: Exports related item mappings for planets, signs, aspects, houses.
// POS: Data layer for Wiki internal linking; update when adding new Wiki items.

import { WikiItemType } from '../types';

// Related item types based on astrological principles
export type RelationType = 'ruling' | 'exalted' | 'detriment' | 'fall' |
  'opposite' | 'square' | 'trine' | 'sextile' | 'conjunction' |
  'same-element' | 'same-modality' | 'ruling-planet' | 'natural-correspondence';

export interface RelatedItem {
  id: string;
  type: WikiItemType;
  relation: RelationType;
}

// Planet to Sign relationships (ruling, exalted, detriment, fall)
export const PLANET_SIGN_RELATIONS: Record<string, RelatedItem[]> = {
  sun: [
    { id: 'leo', type: 'signs', relation: 'ruling' },
    { id: 'cancer', type: 'signs', relation: 'exalted' },
    { id: 'aquarius', type: 'signs', relation: 'detriment' },
    { id: 'capricorn', type: 'signs', relation: 'fall' },
  ],
  moon: [
    { id: 'cancer', type: 'signs', relation: 'ruling' },
    { id: 'taurus', type: 'signs', relation: 'exalted' },
    { id: 'capricorn', type: 'signs', relation: 'detriment' },
    { id: 'scorpio', type: 'signs', relation: 'fall' },
  ],
  mercury: [
    { id: 'gemini', type: 'signs', relation: 'ruling' },
    { id: 'virgo', type: 'signs', relation: 'ruling' },
    { id: 'aquarius', type: 'signs', relation: 'exalted' },
    { id: 'pisces', type: 'signs', relation: 'fall' },
    { id: 'sagittarius', type: 'signs', relation: 'detriment' },
  ],
  venus: [
    { id: 'taurus', type: 'signs', relation: 'ruling' },
    { id: 'libra', type: 'signs', relation: 'ruling' },
    { id: 'pisces', type: 'signs', relation: 'exalted' },
    { id: 'aries', type: 'signs', relation: 'detriment' },
    { id: 'virgo', type: 'signs', relation: 'fall' },
  ],
  mars: [
    { id: 'aries', type: 'signs', relation: 'ruling' },
    { id: 'scorpio', type: 'signs', relation: 'ruling' },
    { id: 'capricorn', type: 'signs', relation: 'exalted' },
    { id: 'libra', type: 'signs', relation: 'detriment' },
    { id: 'cancer', type: 'signs', relation: 'fall' },
  ],
  jupiter: [
    { id: 'sagittarius', type: 'signs', relation: 'ruling' },
    { id: 'pisces', type: 'signs', relation: 'ruling' },
    { id: 'cancer', type: 'signs', relation: 'exalted' },
    { id: 'gemini', type: 'signs', relation: 'detriment' },
    { id: 'virgo', type: 'signs', relation: 'fall' },
  ],
  saturn: [
    { id: 'capricorn', type: 'signs', relation: 'ruling' },
    { id: 'aquarius', type: 'signs', relation: 'ruling' },
    { id: 'libra', type: 'signs', relation: 'exalted' },
    { id: 'cancer', type: 'signs', relation: 'detriment' },
    { id: 'aries', type: 'signs', relation: 'fall' },
  ],
  uranus: [
    { id: 'aquarius', type: 'signs', relation: 'ruling' },
    { id: 'scorpio', type: 'signs', relation: 'exalted' },
    { id: 'taurus', type: 'signs', relation: 'detriment' },
    { id: 'leo', type: 'signs', relation: 'fall' },
  ],
  neptune: [
    { id: 'pisces', type: 'signs', relation: 'ruling' },
    { id: 'cancer', type: 'signs', relation: 'exalted' },
    { id: 'virgo', type: 'signs', relation: 'detriment' },
    { id: 'sagittarius', type: 'signs', relation: 'fall' },
  ],
  pluto: [
    { id: 'scorpio', type: 'signs', relation: 'ruling' },
    { id: 'aries', type: 'signs', relation: 'exalted' },
    { id: 'taurus', type: 'signs', relation: 'detriment' },
    { id: 'libra', type: 'signs', relation: 'fall' },
  ],
};

// Sign element groupings
export const SIGN_ELEMENTS: Record<string, string[]> = {
  fire: ['aries', 'leo', 'sagittarius'],
  earth: ['taurus', 'virgo', 'capricorn'],
  air: ['gemini', 'libra', 'aquarius'],
  water: ['cancer', 'scorpio', 'pisces'],
};

// Sign modality groupings
export const SIGN_MODALITIES: Record<string, string[]> = {
  cardinal: ['aries', 'cancer', 'libra', 'capricorn'],
  fixed: ['taurus', 'leo', 'scorpio', 'aquarius'],
  mutable: ['gemini', 'virgo', 'sagittarius', 'pisces'],
};

// Natural correspondences (items that naturally relate)
export const NATURAL_CORRESPONDENCES: Record<string, RelatedItem[]> = {
  // House themes based on planets
  'house-1': [
    { id: 'sun', type: 'planets', relation: 'natural-correspondence' },
    { id: 'mars', type: 'planets', relation: 'natural-correspondence' },
    { id: 'rising-sign', type: 'concepts', relation: 'natural-correspondence' },
  ],
  'house-2': [
    { id: 'venus', type: 'planets', relation: 'natural-correspondence' },
    { id: 'taurus', type: 'signs', relation: 'natural-correspondence' },
    { id: 'money', type: 'concepts', relation: 'natural-correspondence' },
  ],
  'house-7': [
    { id: 'venus', type: 'planets', relation: 'natural-correspondence' },
    { id: 'libra', type: 'signs', relation: 'natural-correspondence' },
    { id: 'descendant', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'partnership', type: 'concepts', relation: 'natural-correspondence' },
  ],
  'house-10': [
    { id: 'saturn', type: 'planets', relation: 'natural-correspondence' },
    { id: 'capricorn', type: 'signs', relation: 'natural-correspondence' },
    { id: 'mc', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'career', type: 'concepts', relation: 'natural-correspondence' },
  ],
};

// Common aspect pairs for cross-linking
export const ASPECT_RELATED_ITEMS: Record<string, RelatedItem[]> = {
  'sun-moon': [
    { id: 'synastry', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'composite', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'new-moon', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'full-moon', type: 'concepts', relation: 'natural-correspondence' },
  ],
  'venus-mars': [
    { id: 'romance', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'attraction', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'sexuality', type: 'concepts', relation: 'natural-correspondence' },
  ],
  'saturn-pluto': [
    { id: 'transits', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'generation', type: 'concepts', relation: 'natural-correspondence' },
    { id: 'collective-cycles', type: 'concepts', relation: 'natural-correspondence' },
  ],
};

// Get related items for a Wiki item
export const getRelatedItems = (
  itemId: string,
  itemType: WikiItemType
): RelatedItem[] => {
  const relations: RelatedItem[] = [];

  // Planet -> Sign relationships
  if (itemType === 'planets') {
    const signRelations = PLANET_SIGN_RELATIONS[itemId];
    if (signRelations) {
      relations.push(...signRelations);
    }
  }

  // Sign -> Element and Modality relationships
  if (itemType === 'signs') {
    // Add same element signs
    for (const [element, signs] of Object.entries(SIGN_ELEMENTS)) {
      if (signs.includes(itemId)) {
        signs.filter(s => s !== itemId).forEach(sign => {
          relations.push({ id: sign, type: 'signs', relation: 'same-element' });
        });
      }
    }
    // Add same modality signs
    for (const [modality, signs] of Object.entries(SIGN_MODALITIES)) {
      if (signs.includes(itemId)) {
        signs.filter(s => s !== itemId).forEach(sign => {
          relations.push({ id: sign, type: 'signs', relation: 'same-modality' });
        });
      }
    }
    // Add ruling planet
    for (const [planet, signs] of Object.entries(PLANET_SIGN_RELATIONS)) {
      signs.filter(r => r.id === itemId && r.relation === 'ruling').forEach(r => {
        relations.push({ id: planet, type: 'planets', relation: 'ruling-planet' });
      });
    }
  }

  // Houses -> Natural correspondences
  if (itemType === 'houses') {
    const houseRelations = NATURAL_CORRESPONDENCES[itemId];
    if (houseRelations) {
      relations.push(...houseRelations);
    }
  }

  // Aspects -> Related concepts
  const aspectKey = itemId.includes('-') ? itemId : null;
  if (aspectKey && ASPECT_RELATED_ITEMS[aspectKey]) {
    relations.push(...ASPECT_RELATED_ITEMS[aspectKey]);
  }

  return relations;
};

// Get cross-reference links for Wiki detail page
export const getWikiCrossReferences = (itemId: string, itemType: WikiItemType) => {
  const related = getRelatedItems(itemId, itemType);
  return related.map(r => ({
    id: r.id,
    type: r.type,
    relation: r.relation,
    url: `/wiki/${r.id}`,
  }));
};
