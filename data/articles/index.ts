// Article index - exports all articles for static import
import type {
  WikiArticle,
  WikiArticleSummary,
  ArticleHotword,
  Language,
} from "../../types";
import {
  trackMoodAstrologyEn,
  trackMoodAstrologyZh,
} from "./track-mood-astrology";
import {
  mercuryRetrogradeMoonAnxietyEn,
  mercuryRetrogradeMoonAnxietyZh,
} from "./mercury-retrograde-vs-moon-anxiety";
import {
  marsAngerTriggersEn,
  marsAngerTriggersZh,
} from "./mars-anger-triggers";
import {
  bestAstrologyAppsEn,
  bestAstrologyAppsZh,
} from "./best-astrology-mental-health-apps";
import {
  howToReadBirthChartEn,
  howToReadBirthChartZh,
} from "./how-to-read-birth-chart";

// v8 aura batch (2026-05-22) — EN-only, sourced from gengrowth-flow-mvp _staging/
import { auraColorsPillarEn } from "./aura-colors-pillar";
import { blueAuraMeaningEn } from "./blue-aura-meaning";
import { yellowAuraMeaningEn } from "./yellow-aura-meaning";
import { purpleAuraMeaningEn } from "./purple-aura-meaning";
import { whiteAuraMeaningEn } from "./white-aura-meaning";
import { redAuraMeaningEn } from "./red-aura-meaning";
import { orangeAuraMeaningEn } from "./orange-aura-meaning";
import { greenAuraMeaningEn } from "./green-aura-meaning";
import { chakraSystemOverviewEn } from "./chakra-system-overview";
import { fourElementFrameworkEn } from "./four-element-framework";

import { greenAuraMeaningZh } from "./green-aura-meaning";
import { orangeAuraMeaningZh } from "./orange-aura-meaning";
import { astrologyHousesEn } from "./astrology-houses";
import { astrologyHousesZh } from "./astrology-houses";
import { eighthHouseMeaningEn } from "./8th-house-meaning";
import { eighthHouseMeaningZh } from "./8th-house-meaning";
import { twelfthHouseAstrologyEn } from "./12th-house-astrology";
import { twelfthHouseAstrologyZh } from "./12th-house-astrology";
import { ninthHouseAstrologyEn } from "./9th-house-astrology";
import { ninthHouseAstrologyZh } from "./9th-house-astrology";
// All articles organized by language
const ARTICLES_EN: WikiArticle[] = [
  trackMoodAstrologyEn,
  mercuryRetrogradeMoonAnxietyEn,
  marsAngerTriggersEn,
  bestAstrologyAppsEn,
  howToReadBirthChartEn,
  auraColorsPillarEn,
  blueAuraMeaningEn,
  yellowAuraMeaningEn,
  purpleAuraMeaningEn,
  whiteAuraMeaningEn,
  redAuraMeaningEn,
  orangeAuraMeaningEn,
  greenAuraMeaningEn,
  chakraSystemOverviewEn,
  fourElementFrameworkEn,
  astrologyHousesEn,
  eighthHouseMeaningEn,
  twelfthHouseAstrologyEn,
  ninthHouseAstrologyEn,
];

const ARTICLES_ZH: WikiArticle[] = [
  trackMoodAstrologyZh,
  mercuryRetrogradeMoonAnxietyZh,
  marsAngerTriggersZh,
  bestAstrologyAppsZh,
  howToReadBirthChartZh,
  greenAuraMeaningZh,
  orangeAuraMeaningZh,
  astrologyHousesZh,
  eighthHouseMeaningZh,
  twelfthHouseAstrologyZh,
  ninthHouseAstrologyZh,
];

// Get all articles for a language
export const getArticles = (lang: Language): WikiArticle[] => {
  return lang === "zh" ? ARTICLES_ZH : ARTICLES_EN;
};

// Get article summaries for list display
export const getArticleSummaries = (lang: Language): WikiArticleSummary[] => {
  const articles = getArticles(lang);
  return articles.map(
    ({
      slug,
      title,
      description,
      authorId,
      date,
      image,
      image_alt,
      keywords,
    }) => ({
      slug,
      title,
      description,
      authorId,
      date,
      image,
      image_alt,
      keywords,
    }),
  );
};

// Get article summaries written by a specific author (for author profile page).
// EN-only authors return an empty list under zh — caller renders empty state.
export const getArticlesByAuthor = (
  authorId: string,
  lang: Language,
): WikiArticleSummary[] =>
  getArticleSummaries(lang).filter((a) => a.authorId === authorId);

// Get single article by slug
export const getArticleBySlug = (
  slug: string,
  lang: Language,
): WikiArticle | null => {
  const articles = getArticles(lang);
  return articles.find((a) => a.slug === slug) || null;
};

// Check if a slug is an article (used for routing)
export const isArticleSlug = (slug: string): boolean => {
  // Check both language versions
  return (
    ARTICLES_EN.some((a) => a.slug === slug) ||
    ARTICLES_ZH.some((a) => a.slug === slug)
  );
};

// Seeded random number generator for consistent shuffling
const seededRandom = (seed: number): (() => number) => {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
};

// Get today's date as seed (changes daily, consistent within a day)
const getDailySeed = (): number => {
  const today = new Date();
  return (
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  );
};

// Generate article hotwords from keywords with stable daily shuffle
export const getArticleHotwords = (
  lang: Language,
  count: number = 5,
): ArticleHotword[] => {
  const articles = getArticles(lang);
  const hotwords: ArticleHotword[] = [];

  for (const article of articles) {
    for (const keyword of article.keywords) {
      hotwords.push({
        label: keyword,
        article_slug: article.slug,
      });
    }
  }

  // Use seeded random for consistent daily shuffle (prevents hydration mismatch)
  const random = seededRandom(getDailySeed());
  const shuffled = [...hotwords].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
};

// Get all article slugs (for routing)
export const getAllArticleSlugs = (): string[] => {
  const slugs = new Set<string>();
  for (const article of ARTICLES_EN) {
    slugs.add(article.slug);
  }
  for (const article of ARTICLES_ZH) {
    slugs.add(article.slug);
  }
  return Array.from(slugs);
};
