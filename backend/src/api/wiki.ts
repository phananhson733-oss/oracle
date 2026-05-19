// INPUT: 心理占星百科 API 路由与查询处理（含每日星象/灵感日级缓存与经典书籍 Markdown 内容）。
// OUTPUT: 导出 wiki 路由（首页聚合、条目列表、经典书籍分类列表、详情与搜索）。/home is hardened
//         with in-process single-flight dedup (one AI compute per lang+date across concurrent
//         requests) plus Cache-Control + weak ETag (304 short-circuit on If-None-Match).
// POS: Wiki 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, Request, Response } from "express";
import { createHash } from "node:crypto";
import { resolveLang } from "../utils/lang.js";
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
  WikiClassicDetail,
  WikiClassicResponse,
  WikiClassicsResponse,
  WikiClassicSummary,
  WikiSearchMatch,
  WikiSearchResponse,
} from "../types/api.js";
import { getWikiStaticContent, WIKI_TYPE_LABELS } from "../data/wiki.js";
import { getWikiClassics as getWikiClassicsLegacy } from "../data/wiki-classics.js";
import {
  getWikiClassics as getWikiClassicsMarkdown,
  getWikiClassicDetail as getWikiClassicDetailMarkdown,
} from "../data/wiki-classics-markdown.js";
import { WIKI_CLASSICS_GENERATED } from "../data/wiki-classics-generated.js";
import { WIKI_CLASSICS_ENHANCED_ZH } from "../data/wiki-classics-enhanced.js";
import { cacheService } from "../cache/redis.js";
import { CACHE_TTL } from "../cache/strategy.js";
import { AIUnavailableError, generateAIContent } from "../services/ai.js";

export const wikiRouter = Router();

const WIKI_TYPES: WikiItemType[] = [
  "planets",
  "signs",
  "houses",
  "aspects",
  "concepts",
  "chart-types",
  "asteroids",
  "angles",
  "points",
];
const WIKI_TYPE_SET = new Set<WikiItemType>(WIKI_TYPES);
const WIKI_CLASSIC_LABELS: Record<Language, string> = {
  zh: "经典",
  en: "Classic",
};

const normalizeQuery = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^#/, "").toLowerCase();
};

const resolveType = (value: unknown): WikiItemType | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim() as WikiItemType;
  return WIKI_TYPE_SET.has(trimmed) ? trimmed : null;
};

const normalizeField = (value?: string): string => (value || "").toLowerCase();

const cleanMarkdownContent = (content: string): string => {
  // Remove ASCII box drawing characters used in some generated reports
  return content
    .replace(/[┌┐└┘├┤┬┴┼─│]/g, "") // Remove box drawing characters
    .replace(/^\s*\n/gm, "\n") // Remove lines that are now empty
    .replace(/\n{3,}/g, "\n\n"); // Collapse multiple newlines
};

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

const matchesClassicQuery = (
  item: WikiClassicDetail,
  query: string,
): boolean => {
  if (!query) return true;
  const haystacks = [
    item.title,
    item.author,
    item.summary,
    ...(item.keywords || []),
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

const buildClassicSummary = (item: any): WikiClassicSummary => ({
  id: item.id,
  title: item.title,
  author: item.author,
  summary: item.summary,
  cover_url: item.cover_url ?? null,
  keywords: item.keywords,
  category: item.category,
});

const resolveUtcDate = (): string => new Date().toISOString().split("T")[0];

const resolveToday = (value: unknown): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return resolveUtcDate();
};

const buildHomeCacheKey = (lang: Language, date: string) =>
  `wiki:home:${lang}:${date}`;

const resolveHomeCacheTtl = (date: string): number => {
  const today = resolveUtcDate();
  if (date !== today) return CACHE_TTL.AI_OUTPUT;
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const seconds = Math.floor((next.getTime() - now.getTime()) / 1000);
  return Math.max(60, seconds);
};

// In-process single-flight registry for /home: bounds parallel AI+Supabase compute to
// one per (lang, date) cache key across all concurrent requests in this Node process.
// Without this, a cold-cache moment lets every concurrent request hit the AI service
// for the same payload. NOTE: per-process only; horizontal scale would need a Redis
// distributed lock — not implemented now.
const inflightHome = new Map<string, Promise<WikiHomeResponse>>();

// Same watchdog ceiling as astro/today: if the compute hangs (AI provider stall,
// Supabase deadlock), force-evict so subsequent callers can retry. The hanging promise
// itself still settles in its own time — we just stop sharing it.
const INFLIGHT_TIMEOUT_MS = 15_000;

// CDN/browser cache policy: wiki/home updates less frequently than astro/today (AI
// generation is more expensive and the daily transit/wisdom is stable for the day),
// so we use a 5min fresh window with 10min stale-while-revalidate.
const HOME_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=600";

// Weak ETag — same construction as astro.ts. 16 hex chars (64 bits) is ample for
// short-lived day caches; weak validator because we only guarantee semantic equality.
const computeWeakEtag = (body: unknown): string => {
  const json = JSON.stringify(body);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  return `W/"${hash}"`;
};

const sendWithCaching = (
  req: Request,
  res: Response,
  body: unknown,
  cacheControl: string,
): void => {
  const etag = computeWeakEtag(body);
  res.setHeader("Cache-Control", cacheControl);
  if (cacheControl !== "no-store") {
    res.setHeader("ETag", etag);
    const ifNoneMatch = req.headers["if-none-match"];
    if (typeof ifNoneMatch === "string" && ifNoneMatch === etag) {
      res.status(304).end();
      return;
    }
  }
  res.json(body);
};

const buildSearchReason = (
  item: WikiItem,
  query: string,
  lang: Language,
): string => {
  const title = normalizeField(item.title);
  const subtitle = normalizeField(item.subtitle);
  const description = normalizeField(item.description);
  const prototype = normalizeField(item.prototype);
  const analogy = normalizeField(item.analogy);
  const keyword = item.keywords.find((k) => normalizeField(k).includes(query));

  if (title.includes(query)) {
    return lang === "en"
      ? `Matched title: ${item.title}`
      : `匹配标题：${item.title}`;
  }
  if (subtitle.includes(query)) {
    return lang === "en"
      ? `Matched subtitle: ${item.subtitle}`
      : `匹配副标题：${item.subtitle}`;
  }
  if (keyword) {
    return lang === "en"
      ? `Matched keyword: ${keyword}`
      : `匹配关键词：${keyword}`;
  }
  if (description.includes(query)) {
    return lang === "en" ? "Matched description" : "匹配描述";
  }
  if (prototype.includes(query)) {
    return lang === "en" ? "Matched archetype" : "匹配原型";
  }
  if (analogy.includes(query)) {
    return lang === "en" ? "Matched analogy" : "匹配类比";
  }
  return lang === "en" ? "Related entry" : "相关条目";
};

const buildClassicReason = (
  item: WikiClassicDetail,
  query: string,
  lang: Language,
): string => {
  const title = normalizeField(item.title);
  const author = normalizeField(item.author);
  const summary = normalizeField(item.summary);
  const keyword = item.keywords?.find((k) => normalizeField(k).includes(query));

  if (title.includes(query)) {
    return lang === "en"
      ? `Matched title: ${item.title}`
      : `匹配书名：${item.title}`;
  }
  if (author.includes(query)) {
    return lang === "en"
      ? `Matched author: ${item.author}`
      : `匹配作者：${item.author}`;
  }
  if (keyword) {
    return lang === "en"
      ? `Matched keyword: ${keyword}`
      : `匹配关键词：${keyword}`;
  }
  if (summary.includes(query)) {
    return lang === "en" ? "Matched summary" : "匹配摘要";
  }
  return lang === "en" ? "Related classic" : "相关经典";
};

// Static fallback used when AI is unavailable. Keeps /home returning 200 with
// renderable content (pillars + trending_tags are static anyway; daily_transit
// and daily_wisdom get generic copy) so the landing page WikiHubSection doesn't
// hard-error. `degraded: true` lets the client surface a soft notice without
// blocking render.
const buildStaticDailyTransit = (
  lang: Language,
  date: string,
): WikiDailyTransit =>
  lang === "en"
    ? {
        date,
        highlight: "Today's reading is on its way.",
        title: "Today's reading is on its way.",
        summary:
          "The cosmic weather feed is briefly unavailable. The planets are still moving — check back in a few minutes.",
        energy_level: 5,
        guidance: [],
      }
    : {
        date,
        highlight: "今日解读马上回来。",
        title: "今日解读马上回来。",
        summary: "宇宙天气数据暂时离线。行星仍在运行，请稍后再试。",
        energy_level: 5,
        guidance: [],
      };

const STATIC_DAILY_WISDOM_FALLBACK: Record<Language, WikiDailyWisdom> = {
  en: {
    quote:
      "We are not the same persons this year as last; nor are those we love.",
    author: "W. Somerset Maugham",
    source: "The Razor's Edge",
    interpretation:
      "A reminder that change is the baseline, not the exception — both for you and for the people you orbit.",
  },
  zh: {
    quote: "今年的我们与去年不同，所爱之人亦如是。",
    author: "毛姆",
    source: "《刀锋》",
    interpretation: "提醒我们：改变才是常态，无论是自己还是身边的人。",
  },
};

const buildStaticHomeFallback = (
  lang: Language,
  date: string,
): WikiHomeResponse => {
  const staticContent = getWikiStaticContent(lang);
  return {
    lang,
    content: {
      pillars: staticContent.pillars,
      daily_transit: buildStaticDailyTransit(lang, date),
      daily_wisdom: STATIC_DAILY_WISDOM_FALLBACK[lang],
      trending_tags: staticContent.trending_tags,
    },
    degraded: true,
  };
};

// GET /api/wiki/home - wiki 首页聚合内容
wikiRouter.get("/home", async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const date = resolveToday(req.query.date);
    const cacheKey = buildHomeCacheKey(lang, date);

    const cached = await cacheService.get<WikiHomeResponse>(cacheKey);
    if (cached) {
      sendWithCaching(req, res, cached, HOME_CACHE_CONTROL);
      return;
    }

    // Single-flight: if another request is already computing this same (lang, date),
    // await its result instead of issuing a parallel AI call. Prevents the cold-cache
    // thundering herd where every concurrent request hits the AI provider for the
    // identical payload.
    let pending = inflightHome.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        const staticContent = getWikiStaticContent(lang);
        const ai = await generateAIContent<{
          daily_transit: WikiDailyTransit;
          daily_wisdom: WikiDailyWisdom;
        }>({
          promptId: "wiki-home",
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
        return payload;
      })().finally(() => {
        inflightHome.delete(cacheKey);
      });
      inflightHome.set(cacheKey, pending);
      // Watchdog: evict the entry if compute hasn't settled within INFLIGHT_TIMEOUT_MS.
      // The hanging promise still settles on its own; we just stop sharing it so the
      // next caller can start fresh instead of inheriting a dead reference.
      const watchdog = setTimeout(() => {
        if (inflightHome.get(cacheKey) === pending) {
          inflightHome.delete(cacheKey);
        }
      }, INFLIGHT_TIMEOUT_MS);
      if (typeof watchdog.unref === "function") watchdog.unref();
      // .finally returns a new promise that mirrors `pending`'s rejection. We don't
      // await it (this branch is fire-and-forget cleanup), so chain a no-op .catch
      // to prevent a duplicate unhandled rejection when the real `await pending`
      // below catches the underlying error.
      pending.finally(() => clearTimeout(watchdog)).catch(() => {});
    }

    const payload = await pending;
    sendWithCaching(req, res, payload, HOME_CACHE_CONTROL);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      // Soft-fail to a static fallback instead of 503. The landing page wiki
      // hub treats /home as load-bearing — a hard 503 leaves a broken module
      // for every visitor while the AI is degraded. The fallback uses
      // generic copy + the same static pillars/trending_tags so the section
      // still renders. `degraded: true` lets the client surface a soft
      // notice. We intentionally do NOT cache this response (TTL=0
      // semantics via skipping cacheService.set) so as soon as the AI is
      // back, the next request gets a real payload.
      const lang = resolveLang(req.query.lang);
      const date = resolveToday(req.query.date);
      const fallback = buildStaticHomeFallback(lang, date);
      sendWithCaching(req, res, fallback, "no-store");
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/wiki/items - wiki 条目列表
wikiRouter.get("/items", (req, res) => {
  const lang = resolveLang(req.query.lang);
  const typeFilter = resolveType(req.query.type);
  const query = normalizeQuery(req.query.q);
  const { items } = getWikiStaticContent(lang);

  const filtered = items.filter(
    (item) =>
      (!typeFilter || item.type === typeFilter) && matchesQuery(item, query),
  );
  const summaries = filtered.map(buildSummary);

  res.json({ lang, items: summaries } as WikiItemsResponse);
});

// GET /api/wiki/items/:id - wiki 条目详情
wikiRouter.get("/items/:id", (req, res) => {
  const lang = resolveLang(req.query.lang);
  const { items } = getWikiStaticContent(lang);
  const item = items.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).json({ error: "Wiki item not found" });
    return;
  }

  res.json({ lang, item } as WikiItemResponse);
});

// GET /api/wiki/classics - wiki 经典书籍列表
wikiRouter.get("/classics", (req, res) => {
  const lang = resolveLang(req.query.lang);
  const items = getWikiClassicsMarkdown(lang);
  const summaries = items.map(buildClassicSummary);
  res.json({ lang, items: summaries } as WikiClassicsResponse);
});

// GET /api/wiki/classics/:id - wiki 经典书籍详情
wikiRouter.get("/classics/:id", (req, res) => {
  const lang = resolveLang(req.query.lang);
  // Try with original ID first, then with -analysis suffix
  let markdownItem = getWikiClassicDetailMarkdown(req.params.id, lang);
  if (!markdownItem) {
    markdownItem = getWikiClassicDetailMarkdown(
      `${req.params.id}-analysis`,
      lang,
    );
  }

  if (markdownItem?.content) {
    // Clean ASCII box drawing characters from content
    const cleanedItem = {
      ...markdownItem,
      content: cleanMarkdownContent(markdownItem.content),
      lang,
    };
    res.json({ lang, item: cleanedItem } as WikiClassicResponse);
    return;
  }

  const legacyItems = getWikiClassicsLegacy(lang);
  const legacyItem = legacyItems.find((entry) => entry.id === req.params.id);

  if (!legacyItem) {
    res.status(404).json({ error: "Wiki classic not found" });
    return;
  }

  // Try enhanced data first (for Chinese)
  if (lang === "zh" && WIKI_CLASSICS_ENHANCED_ZH[legacyItem.id]) {
    const enhanced = WIKI_CLASSICS_ENHANCED_ZH[legacyItem.id];
    try {
      const deepAnalysis = JSON.parse(enhanced.deep_analysis);
      const { title, author, sections } = deepAnalysis;

      const contentParts = [
        `📚 深度拆解报告｜《${enhanced.title}》`,
        `✍️ 作者：${enhanced.author}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `1️⃣ 全局定位与背景`,
        sections.context.position_and_influence,
        "",
        `作者背景：${sections.context.author_background}`,
        "",
        `核心贡献：${sections.context.core_contribution}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `2️⃣ 核心哲学与理论基石`,
        sections.philosophy.underlying_logic,
        "",
        `核心理念：${sections.philosophy.core_concepts}`,
        "",
        `通俗比喻：${sections.philosophy.metaphor}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `3️⃣ 结构化深度导读`,
        sections.structure.logic_flow,
        "",
        `模块解析：`,
        Object.entries(sections.structure.modules || {})
          .map(([key, value]) => `▸ ${key}: ${value}`)
          .join("\n"),
        "",
        `核心章节：`,
        Object.entries(sections.structure.key_chapters || {})
          .map(([key, value]) => `★ ${key}\n  ${value}`)
          .join("\n\n"),
        "",
        `知识体系：${sections.structure.knowledge_map}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `4️⃣ 方法论与实操工具`,
        sections.methodology.core_methodology,
        "",
        `实操步骤：`,
        Object.entries(sections.methodology.step_by_step || {})
          .map(([key, value]) => `▸ ${key}: ${value}`)
          .join("\n"),
        "",
        `实用工具：${sections.methodology.practical_tools}`,
        "",
        `常见问题：${sections.methodology.common_issues}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `5️⃣ 经典名句与深层解读`,
        sections.quotes.golden_quotes,
        "",
        `核心思想：${sections.quotes.core_thought}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `6️⃣ 批判性思考与局限`,
        `时代局限：${sections.criticism.limitations}`,
        "",
        `争议探讨：${sections.criticism.controversies}`,
        "",
        `阅读误区：${sections.criticism.reading_pitfalls}`,
        "",
        `对比分析：${sections.criticism.comparison}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `7️⃣ 读者行动指南`,
        `学习计划：`,
        Object.entries(sections.action.learning_plan || {})
          .map(([key, value]) => `▸ ${key}: ${value}`)
          .join("\n"),
        "",
        `立即行动：${sections.action.immediate_action}`,
        "",
        `学习资源：${sections.action.resources}`,
        "",
        `━━━━━━━━━━━━━━━━━━━━`,
        "",
        `📖 以上内容由 AI 深度分析生成，仅供参考学习。`,
      ];

      const itemWithContent = {
        ...legacyItem,
        content: contentParts.filter(Boolean).join("\n"),
        enhanced: true,
      };

      res.json({ lang, item: itemWithContent } as WikiClassicResponse);
      return;
    } catch (e) {
      console.error(`Failed to parse enhanced data for ${legacyItem.id}:`, e);
      // Fall through to old format
    }
  }

  // Fall back to old generated format
  const generatedData = WIKI_CLASSICS_GENERATED[lang];
  const generatedContent = generatedData?.[legacyItem.id];

  if (generatedContent && generatedContent.sections) {
    const { summary, sections } = generatedContent;
    const {
      context,
      philosophy,
      structure,
      methodology,
      quotes,
      criticism,
      action,
    } = sections;

    const contentParts = [
      `深度拆解报告｜《${legacyItem.title}》`,
      `作者：${legacyItem.author}`,
      "",
      `1. 全局定位与背景 (The Context)`,
      context.position,
      "",
      `2. 核心哲学/理论基石 (The Core Philosophy)`,
      philosophy.core_logic,
      "",
      philosophy.metaphor,
      "",
      `3. 结构化深度导读 (Structural Breakdown)`,
      structure.logic_flow,
      "",
      structure.modules
        ?.map((m) => `- ${m.name}\n  ${m.content}`)
        .join("\n\n") || "",
      "",
      structure.highlights
        ?.map((h) => `**${h.topic}**\n${h.insight}`)
        .join("\n\n") || "",
      "",
      `4. 方法论与实操工具 (Methodology & Tools)`,
      methodology.steps?.join("\n"),
      "",
      `5. 经典名句与深层解读 (Golden Quotes & Exegesis)`,
      quotes.items
        ?.map((q) => `**${q.quote}**\n解读 ${q.interpretation}`)
        .join("\n\n") || "",
      "",
      `6. 批判性思考与局限 (Critical Analysis)`,
      `时代局限：${criticism.limitations}`,
      "",
      `初学误区：${criticism.misconceptions}`,
      "",
      `不同声音：${criticism.debates}`,
      "",
      `7. 读者行动指南 (Action Plan)`,
      action.phases?.map((p) => `${p.phase}\n  ${p.task}`).join("\n\n") || "",
      "",
      `立即行动：${action.immediate_action}`,
    ];

    const itemWithContent = {
      ...legacyItem,
      content: contentParts.filter(Boolean).join("\n\n"),
      enhanced: false,
    };

    res.json({ lang, item: itemWithContent } as WikiClassicResponse);
    return;
  }

  // Otherwise return placeholder
  const itemWithPlaceholder = {
    ...legacyItem,
    content: `《${legacyItem.title}》的深度内容正在生成中，敬请期待。`,
    enhanced: false,
  };

  res.json({ lang, item: itemWithPlaceholder } as WikiClassicResponse);
});

// GET /api/wiki/search - wiki 搜索匹配
wikiRouter.get("/search", (req, res) => {
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

  if (matches.length < 12) {
    const classics = getWikiClassicsMarkdown(lang);
    classics.forEach((item: any) => {
      if (!matchesClassicQuery(item, query)) return;
      if (matches.length >= 12) return;
      matches.push({
        concept: item.title,
        type: WIKI_CLASSIC_LABELS[lang],
        reason: buildClassicReason(item, query, lang),
        linked_id: `classics/${item.id}`,
      });
    });
  }

  res.json({ lang, matches } as WikiSearchResponse);
});
