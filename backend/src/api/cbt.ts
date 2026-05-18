// INPUT: CBT API 路由（含 LLM 调用前的危机关键词短路检测）。
// OUTPUT: 导出 cbt 路由（含 AI 分析、紧凑摘要、Server-Timing 与 crisis_detected 分支）。
// POS: CBT 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, type Request, type Response } from "express";
import { performance } from "perf_hooks";
import type {
  BirthInput,
  CBTAnalysisResponse,
  Language,
} from "../types/api.js";
import {
  buildCompactChartSummary,
  buildCompactTransitSummary,
  ephemerisService,
} from "../services/ephemeris.js";
import { AIUnavailableError, generateAIContent } from "../services/ai.js";
import { cacheService } from "../cache/redis.js";
import {
  GeocodingServiceError,
  LocationResolutionError,
  resolveLocation,
} from "../services/geocoding.js";
import {
  buildCrisisResponse,
  detectCrisis,
  extractFreeText,
  resolveRegion,
  trackCrisisDetected,
} from "../services/crisis-detector.js";
import { authMiddleware, requireAuth } from "./auth.js";

export const cbtRouter = Router();

/**
 * LLM 调用前的危机短路。命中时直接返回 HTTP 200 + crisis_detected 响应，并发送脱敏遥测。
 *
 * Default-secure override gate (threefold AND):
 *   1) `NODE_ENV !== 'production'`                              — never bypass in production
 *   2) `process.env.ENABLE_CBT_CRISIS_OVERRIDE === 'true'`      — opt-in via env (off by default)
 *   3) `x-crisis-override-token` header equals `QA_CRISIS_OVERRIDE_TOKEN` — shared secret
 *
 * Token is read from a request header (not query/body) so it never leaks into access logs.
 * Detector failures fail CLOSED: `failSafe: true` is treated identically to a real hit.
 *
 * @returns true 表示已短路返回（调用方应 return）；false 表示放行进入主流程。
 */
function shortCircuitOnCrisis(
  req: Request,
  res: Response,
  lang: Language,
  endpoint: string,
  startedAt: number,
): boolean {
  const isDev = process.env.NODE_ENV !== "production";
  const overrideEnabled = process.env.ENABLE_CBT_CRISIS_OVERRIDE === "true";
  const expectedToken = process.env.QA_CRISIS_OVERRIDE_TOKEN;
  const providedTokenRaw = req.headers["x-crisis-override-token"];
  const providedToken = Array.isArray(providedTokenRaw)
    ? providedTokenRaw[0]
    : providedTokenRaw;
  const tokenMatches =
    typeof expectedToken === "string" &&
    expectedToken.length > 0 &&
    providedToken === expectedToken;
  if (isDev && overrideEnabled && tokenMatches) return false;

  const detection = detectCrisis(extractFreeText(req.body));
  if (!detection.hit && !detection.failSafe) return false;

  const region = resolveRegion(req, lang);
  trackCrisisDetected({ region, lang, endpoint });
  const elapsed = performance.now() - startedAt;
  res.setHeader("Server-Timing", `crisis;dur=${elapsed.toFixed(2)}`);
  res.status(200).json(buildCrisisResponse(region, lang));
  return true;
}

// CBT 记录保留 3 个月（秒）
const CBT_RETENTION_TTL = 90 * 24 * 60 * 60;

interface CBTRecord {
  id: string;
  timestamp: number;
  situation: string;
  moods: Array<{
    id: string;
    name: string;
    initialIntensity: number;
    finalIntensity?: number;
  }>;
  automaticThoughts: string[];
  hotThought: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  balancedEntries: Array<{ id: string; text: string; belief: number }>;
  analysis?: unknown;
}

async function parseBirthInput(
  body: Record<string, unknown>,
): Promise<BirthInput> {
  const birth = body.birth as Record<string, unknown>;
  const city = (birth.city as string) || "";
  const latParam = birth.lat;
  const lonParam = birth.lon;
  const timezoneParam = birth.timezone as string | undefined;
  const hasLat = latParam !== undefined && latParam !== "";
  const hasLon = lonParam !== undefined && lonParam !== "";
  const hasTimezone =
    typeof timezoneParam === "string" && timezoneParam.trim() !== "";
  const shouldResolve = !hasLat || !hasLon || !hasTimezone;
  const geo = shouldResolve ? await resolveLocation(city) : null;
  return {
    date: birth.date as string,
    time: birth.time as string | undefined,
    city: geo?.city || city || "Unknown",
    // shouldResolve=true 时 geo 必非空（resolveLocation 失败会抛错由 catch 处理）。
    lat: hasLat ? Number(latParam) : geo!.lat,
    lon: hasLon ? Number(lonParam) : geo!.lon,
    timezone: hasTimezone ? (timezoneParam as string) : geo!.timezone,
    accuracy: (birth.accuracy as BirthInput["accuracy"]) || "exact",
  };
}

function handleBirthInputError(
  error: unknown,
  res: import("express").Response,
): boolean {
  if (error instanceof LocationResolutionError) {
    res.status(400).json({
      error: error.message,
      code: "LOCATION_UNRESOLVED",
      city: error.cityName,
    });
    return true;
  }
  if (error instanceof GeocodingServiceError) {
    res.status(503).json({
      error:
        "Geocoding service temporarily unavailable. Please try again in a moment.",
      code: "GEOCODING_SERVICE_UNAVAILABLE",
    });
    return true;
  }
  return false;
}

// POST /api/cbt/analysis - CBT 分析
cbtRouter.post("/analysis", async (req, res) => {
  try {
    const requestStart = performance.now();
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === "en" ? "en" : "zh";

    // Crisis short-circuit: must run BEFORE birth parsing / LLM call.
    // Hits do not persist to cbt:records and do not invoke generateAIContent.
    if (
      shortCircuitOnCrisis(req, res, lang, "/api/cbt/analysis", requestStart)
    ) {
      return;
    }

    const birth = await parseBirthInput(req.body);
    const {
      situation,
      moods,
      automaticThoughts,
      hotThought,
      evidenceFor,
      evidenceAgainst,
      balancedEntries,
    } = req.body;

    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const transitSummary = buildCompactTransitSummary(transits);

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "cbt-analysis",
      context: {
        chart_summary: chartSummary,
        transit_summary: transitSummary,
        situation,
        moods,
        automaticThoughts,
        hotThought,
        evidenceFor,
        evidenceAgainst,
        balancedEntries,
      },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({
      lang: result.lang,
      content: result.content,
    } as CBTAnalysisResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/aggregate-analysis - CBT 聚合分析 (月度/阶段性)
cbtRouter.post("/aggregate-analysis", async (req, res) => {
  try {
    const requestStart = performance.now();
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === "en" ? "en" : "zh";

    if (
      shortCircuitOnCrisis(
        req,
        res,
        lang,
        "/api/cbt/aggregate-analysis",
        requestStart,
      )
    ) {
      return;
    }

    const birth = await parseBirthInput(req.body);
    const { period, somatic_stats, root_stats, mood_stats, competence_stats } =
      req.body;

    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const transitSummary = buildCompactTransitSummary(transits);

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "cbt-aggregate-analysis",
      context: {
        chart_summary: chartSummary,
        transit_summary: transitSummary,
        period,
        somatic_stats,
        root_stats,
        mood_stats,
        competence_stats,
      },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({ lang: result.lang, content: result.content });
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/somatic-analysis - 身心信号统计报告
cbtRouter.post("/somatic-analysis", async (req, res) => {
  try {
    const requestStart = performance.now();
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === "en" ? "en" : "zh";

    if (
      shortCircuitOnCrisis(
        req,
        res,
        lang,
        "/api/cbt/somatic-analysis",
        requestStart,
      )
    ) {
      return;
    }

    const birth = await parseBirthInput(req.body);
    const { period, somatic_stats } = req.body;

    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const transitSummary = buildCompactTransitSummary(transits);

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "cbt-somatic-analysis",
      context: {
        chart_summary: chartSummary,
        transit_summary: transitSummary,
        period,
        somatic_stats,
      },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({ lang: result.lang, content: result.content });
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/root-analysis - 根源与资源统计报告
cbtRouter.post("/root-analysis", async (req, res) => {
  try {
    const requestStart = performance.now();
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === "en" ? "en" : "zh";

    if (
      shortCircuitOnCrisis(
        req,
        res,
        lang,
        "/api/cbt/root-analysis",
        requestStart,
      )
    ) {
      return;
    }

    const birth = await parseBirthInput(req.body);
    const { period, root_stats } = req.body;

    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const transitSummary = buildCompactTransitSummary(transits);

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "cbt-root-analysis",
      context: {
        chart_summary: chartSummary,
        transit_summary: transitSummary,
        period,
        root_stats,
      },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({ lang: result.lang, content: result.content });
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/mood-analysis - 情绪配方统计报告
cbtRouter.post("/mood-analysis", async (req, res) => {
  try {
    const requestStart = performance.now();
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === "en" ? "en" : "zh";

    if (
      shortCircuitOnCrisis(
        req,
        res,
        lang,
        "/api/cbt/mood-analysis",
        requestStart,
      )
    ) {
      return;
    }

    const birth = await parseBirthInput(req.body);
    const { period, mood_stats } = req.body;

    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const transitSummary = buildCompactTransitSummary(transits);

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "cbt-mood-analysis",
      context: {
        chart_summary: chartSummary,
        transit_summary: transitSummary,
        period,
        mood_stats,
      },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({ lang: result.lang, content: result.content });
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/competence-analysis - CBT能力统计报告
cbtRouter.post("/competence-analysis", async (req, res) => {
  try {
    const requestStart = performance.now();
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === "en" ? "en" : "zh";

    if (
      shortCircuitOnCrisis(
        req,
        res,
        lang,
        "/api/cbt/competence-analysis",
        requestStart,
      )
    ) {
      return;
    }

    const birth = await parseBirthInput(req.body);
    const { period, competence_stats } = req.body;

    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const transitSummary = buildCompactTransitSummary(transits);

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "cbt-competence-analysis",
      context: {
        chart_summary: chartSummary,
        transit_summary: transitSummary,
        period,
        competence_stats,
      },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({ lang: result.lang, content: result.content });
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/records - 创建 CBT 记录
cbtRouter.post("/records", authMiddleware, requireAuth, async (req, res) => {
  try {
    // userId comes from authenticated session, never from request body — prevents IDOR per CLAUDE.md §隐私红线 #1.
    const userId = req.userId!;
    const { record } = req.body as { record: CBTRecord };
    const key = `cbt:records:${userId}`;

    // 获取现有记录
    const existing = (await cacheService.get<CBTRecord[]>(key)) || [];

    // 添加新记录
    existing.push(record);

    // 过滤过期记录（3 个月前）
    const cutoff = Date.now() - CBT_RETENTION_TTL * 1000;
    const filtered = existing.filter((r) => r.timestamp > cutoff);

    // 保存（带 TTL）
    await cacheService.set(key, filtered, CBT_RETENTION_TTL);

    res.json({ success: true, count: filtered.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/cbt/records - 获取 CBT 记录列表
cbtRouter.get("/records", authMiddleware, requireAuth, async (req, res) => {
  try {
    // userId comes from authenticated session, never from request query — prevents IDOR per CLAUDE.md §隐私红线 #1.
    const userId = req.userId!;
    const key = `cbt:records:${userId}`;

    const records = (await cacheService.get<CBTRecord[]>(key)) || [];

    // 过滤过期记录
    const cutoff = Date.now() - CBT_RETENTION_TTL * 1000;
    const filtered = records.filter((r) => r.timestamp > cutoff);

    res.json({ records: filtered });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
