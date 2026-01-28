import type { Language } from '../types/api.js';
import {
  SYNTHETICA_ASPECTS,
  SYNTHETICA_HOUSES,
  SYNTHETICA_PLANETS,
  SYNTHETICA_SIGNS,
} from '../data/synthetica-catalog.js';

export type SyntheticaConfigUnit = {
  planetId: string;
  signId: string;
  house?: number | null;
  degree?: number;
  minute?: number;
  isRetrograde?: boolean;
  aspects?: Array<{
    targetPlanetId: string;
    aspectType: string;
    orb?: number;
    isApplying?: boolean;
    targetSignId?: string;
    targetHouse?: number;
  }>;
};

export type NormalizedSyntheticaSelection = {
  planet: { id: string; name: string; tier: number };
  sign: { id: string; name: string };
  house: { id: string; name: string; archetype: string } | null;
  aspects: { planet: { id: string; name: string; tier: number }; aspect: { id: string; name: string; category: string } }[];
};

const normalizeHouseId = (house?: number | null): string | null => {
  if (!house && house !== 0) return null;
  const num = Number(house);
  if (!Number.isFinite(num) || num < 1 || num > 12) return null;
  return `h${num}`;
};

const getCatalogName = (entry: { name: Record<'zh' | 'en', string> }, lang: Language): string => {
  return entry.name[lang === 'en' ? 'en' : 'zh'];
};

const getCatalogArchetype = (
  entry: { archetype?: Record<'zh' | 'en', string> } | null,
  lang: Language
): string => {
  if (!entry?.archetype) return '';
  return entry.archetype[lang === 'en' ? 'en' : 'zh'];
};

export function normalizeSyntheticaConfig(
  config: SyntheticaConfigUnit,
  lang: Language
): NormalizedSyntheticaSelection {
  const planetEntry = SYNTHETICA_PLANETS[config.planetId];
  const signEntry = SYNTHETICA_SIGNS[config.signId];

  if (!planetEntry || !signEntry) {
    throw new Error('Invalid synthetica config');
  }

  const houseId = normalizeHouseId(config.house);
  const houseEntry = houseId ? SYNTHETICA_HOUSES[houseId] : null;

  const aspects = (config.aspects || [])
    .map((aspect) => {
      const targetPlanet = SYNTHETICA_PLANETS[aspect.targetPlanetId];
      const aspectEntry = SYNTHETICA_ASPECTS[aspect.aspectType];
      if (!targetPlanet || !aspectEntry) return null;

      return {
        planet: {
          id: targetPlanet.id,
          name: getCatalogName(targetPlanet, lang),
          tier: targetPlanet.tier,
        },
        aspect: {
          id: aspectEntry.id,
          name: getCatalogName(aspectEntry, lang),
          category: aspectEntry.category,
        },
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  return {
    planet: {
      id: planetEntry.id,
      name: getCatalogName(planetEntry, lang),
      tier: planetEntry.tier,
    },
    sign: {
      id: signEntry.id,
      name: getCatalogName(signEntry, lang),
    },
    house: houseEntry
      ? {
          id: houseEntry.id,
          name: getCatalogName(houseEntry, lang),
          archetype: getCatalogArchetype(houseEntry, lang),
        }
      : null,
    aspects,
  };
}
