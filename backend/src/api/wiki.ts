// INPUT: 心理占星百科 API 路由与查询处理（含每日星象/灵感日级缓存）。
// OUTPUT: 导出 wiki 路由（首页聚合、条目列表、详情与搜索）。
// POS: Wiki 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from 'express';
import type {
  Language,
  WikiDailyTransit,
  WikiDailyWisdom,
  WikiHomeResponse,
  WikiItem,
  WikiItemResponse,
  WikiItemsResponse,
  WikiItemSummary,
  WikiItemType,
  WikiSearchMatch,
  WikiSearchResponse,
} from '../types/api.js';
import { getWikiStaticContent, WIKI_TYPE_LABELS } from '../data/wiki.js';
import { cacheService } from '../cache/redis.js';
import { CACHE_TTL } from '../cache/strategy.js';
import { AIUnavailableError, generateAIContent } from '../services/ai.js';

export const wikiRouter = Router();

const WIKI_TYPES: WikiItemType[] = [
  'planets',
  'signs',
  'houses',
  'aspects',
  'concepts',
  'chart-types',
  'asteroids',
  'angles',
  'points',
];
const WIKI_TYPE_SET = new Set<WikiItemType>(WIKI_TYPES);

const resolveLang = (value: unknown): Language => value === 'en' ? 'en' : 'zh';

const normalizeQuery = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^#/, '').toLowerCase();
};

const resolveType = (value: unknown): WikiItemType | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim() as WikiItemType;
  return WIKI_TYPE_SET.has(trimmed) ? trimmed : null;
};

const normalizeField = (value?: string): string => (value || '').toLowerCase();

const matchesQuery = (item: WikiItem, query: string): boolean => {
  if (!query) return true;
  const haystacks = [
    item.title,
    item.subtitle,
    item.description,
    item.prototype,
    item.analogy,
    ...item.keywords,
  ];
  return haystacks.some((field) => normalizeField(field).includes(query));
};

const buildSummary = (item: WikiItem): WikiItemSummary => ({
  id: item.id,
  type: item.type,
  title: item.title,
  subtitle: item.subtitle,
  symbol: item.symbol,
  keywords: item.keywords,
  description: item.description,
  color_token: item.color_token,
});

const resolveUtcDate = (): string => new Date().toISOString().split('T')[0];

const resolveToday = (value: unknown): string => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return resolveUtcDate();
};

const buildHomeCacheKey = (lang: Language, date: string) => `wiki:home:${lang}:${date}`;

const resolveHomeCacheTtl = (date: string): number => {
  const today = resolveUtcDate();
  if (date !== today) return CACHE_TTL.AI_OUTPUT;
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  ));
  const seconds = Math.floor((next.getTime() - now.getTime()) / 1000);
  return Math.max(60, seconds);
};

const buildSearchReason = (item: WikiItem, query: string, lang: Language): string => {
  const title = normalizeField(item.title);
  const subtitle = normalizeField(item.subtitle);
  const description = normalizeField(item.description);
  const prototype = normalizeField(item.prototype);
  const analogy = normalizeField(item.analogy);
  const keyword = item.keywords.find((k) => normalizeField(k).includes(query));

  if (title.includes(query)) {
    return lang === 'en' ? `Matched title: ${item.title}` : `匹配标题：${item.title}`;
  }
  if (subtitle.includes(query)) {
    return lang === 'en' ? `Matched subtitle: ${item.subtitle}` : `匹配副标题：${item.subtitle}`;
  }
  if (keyword) {
    return lang === 'en' ? `Matched keyword: ${keyword}` : `匹配关键词：${keyword}`;
  }
  if (description.includes(query)) {
    return lang === 'en' ? 'Matched description' : '匹配描述';
  }
  if (prototype.includes(query)) {
    return lang === 'en' ? 'Matched archetype' : '匹配原型';
  }
  if (analogy.includes(query)) {
    return lang === 'en' ? 'Matched analogy' : '匹配类比';
  }
  return lang === 'en' ? 'Related entry' : '相关条目';
};

// GET /api/wiki/home - wiki 首页聚合内容
wikiRouter.get('/home', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const date = resolveToday(req.query.date);
    const staticContent = getWikiStaticContent(lang);
    const cacheKey = buildHomeCacheKey(lang, date);

    const cached = await cacheService.get<WikiHomeResponse>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const ai = await generateAIContent<{ daily_transit: WikiDailyTransit; daily_wisdom: WikiDailyWisdom }>({
      promptId: 'wiki-home',
      context: { date },
      lang,
    });

    const payload: WikiHomeResponse = {
      lang: ai.lang,
      content: {
        pillars: staticContent.pillars,
        daily_transit: ai.content.daily_transit,
        daily_wisdom: ai.content.daily_wisdom,
        trending_tags: staticContent.trending_tags,
      },
    };

    await cacheService.set(cacheKey, payload, resolveHomeCacheTtl(date));
    res.json(payload);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/wiki/items - wiki 条目列表
wikiRouter.get('/items', (req, res) => {
  const lang = resolveLang(req.query.lang);
  const typeFilter = resolveType(req.query.type);
  const query = normalizeQuery(req.query.q);
  const { items } = getWikiStaticContent(lang);

  const filtered = items.filter((item) => (!typeFilter || item.type === typeFilter) && matchesQuery(item, query));
  const summaries = filtered.map(buildSummary);

  res.json({ lang, items: summaries } as WikiItemsResponse);
});

// GET /api/wiki/items/:id - wiki 条目详情
wikiRouter.get('/items/:id', (req, res) => {
  const lang = resolveLang(req.query.lang);
  const { items } = getWikiStaticContent(lang);
  const item = items.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).json({ error: 'Wiki item not found' });
    return;
  }

  res.json({ lang, item } as WikiItemResponse);
});

// GET /api/wiki/search - wiki 搜索匹配
wikiRouter.get('/search', (req, res) => {
  const lang = resolveLang(req.query.lang);
  const query = normalizeQuery(req.query.q);
  if (!query) {
    res.json({ lang, matches: [] } as WikiSearchResponse);
    return;
  }

  const { items } = getWikiStaticContent(lang);
  const matches: WikiSearchMatch[] = [];

  items.forEach((item) => {
    if (!matchesQuery(item, query)) return;
    if (matches.length >= 12) return;
    matches.push({
      concept: item.title,
      type: WIKI_TYPE_LABELS[lang][item.type] || item.type,
      reason: buildSearchReason(item, query, lang),
      linked_id: item.id,
    });
  });

  res.json({ lang, matches } as WikiSearchResponse);
});
