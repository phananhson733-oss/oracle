// Article index - exports all articles for static import
import type { WikiArticle, WikiArticleSummary, ArticleHotword, Language } from '../../types';
import { trackMoodAstrologyEn, trackMoodAstrologyZh } from './track-mood-astrology';
import { mercuryRetrogradeMoonAnxietyEn, mercuryRetrogradeMoonAnxietyZh } from './mercury-retrograde-vs-moon-anxiety';
import { marsAngerTriggersEn, marsAngerTriggersZh } from './mars-anger-triggers';
import { bestAstrologyAppsEn, bestAstrologyAppsZh } from './best-astrology-mental-health-apps';

// All articles organized by language
const ARTICLES_EN: WikiArticle[] = [
  trackMoodAstrologyEn,
  mercuryRetrogradeMoonAnxietyEn,
  marsAngerTriggersEn,
  bestAstrologyAppsEn,
];

const ARTICLES_ZH: WikiArticle[] = [
  trackMoodAstrologyZh,
  mercuryRetrogradeMoonAnxietyZh,
  marsAngerTriggersZh,
  bestAstrologyAppsZh,
];

// Get all articles for a language
export const getArticles = (lang: Language): WikiArticle[] => {
  return lang === 'zh' ? ARTICLES_ZH : ARTICLES_EN;
};

// Get article summaries for list display
export const getArticleSummaries = (lang: Language): WikiArticleSummary[] => {
  const articles = getArticles(lang);
  return articles.map(({ slug, title, description, author, date, image, image_alt, keywords }) => ({
    slug,
    title,
    description,
    author,
    date,
    image,
    image_alt,
    keywords,
  }));
};

// Get single article by slug
export const getArticleBySlug = (slug: string, lang: Language): WikiArticle | null => {
  const articles = getArticles(lang);
  return articles.find(a => a.slug === slug) || null;
};

// Check if a slug is an article (used for routing)
export const isArticleSlug = (slug: string): boolean => {
  // Check both language versions
  return ARTICLES_EN.some(a => a.slug === slug) || ARTICLES_ZH.some(a => a.slug === slug);
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
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

// Generate article hotwords from keywords with stable daily shuffle
export const getArticleHotwords = (lang: Language, count: number = 5): ArticleHotword[] => {
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
