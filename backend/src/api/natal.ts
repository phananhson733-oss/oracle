// INPUT: Natal API 路由（POST /chart + GET /chart 兼容、含输入校验与错误响应去 PII）。
// OUTPUT: 导出 natal 路由（含 overview/core/dimension、紧凑摘要与 Server-Timing）。
//         所有 4xx 错误响应只下发 code，绝不回显原始 city / Error.message（隐私红线 #1/#3）。
// POS: Natal 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";
import { performance } from "perf_hooks";
import type {
  NatalChartResponse,
  NatalOverviewResponse,
  NatalCoreThemesResponse,
  NatalDimensionResponse,
} from "../types/api.js";
import { resolveLang } from "../utils/lang.js";
import {
  buildCompactChartSummary,
  ephemerisService,
} from "../services/ephemeris.js";
import { AIUnavailableError, generateAIContent } from "../services/ai.js";
// Shared birth-input validation / geocoding / PII-safe error helpers
// (extracted from this file so /api/transit/timeline reuses the same machinery).
import {
  validateBirthPayload,
  withValidatedBirth,
  handleBirthInputError,
  send500,
  ERROR_MESSAGES,
} from "./birthInput.js";

export const natalRouter = Router();

// === Routes ===
//
// POST /api/natal/chart — preferred entrypoint. Birth payload in JSON body so
// it never appears in URLs / logs / referrer. Validated via the shared helper.
//
// GET /api/natal/chart — kept for backward compatibility (older client builds
// + cached CDN paths). Same validator; same redacted error shape.
async function handleChart(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  try {
    const birth = await withValidatedBirth(req, res);
    if (!birth) return;
    const chart = await ephemerisService.calculateNatalChart(birth);
    res.json({ chart } as NatalChartResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    send500(res);
  }
}

natalRouter.post("/chart", handleChart);
natalRouter.get("/chart", handleChart);

async function handleOverview(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  try {
    const requestStart = performance.now();
    const lang = resolveLang(
      req.query.lang ?? (req.body as { lang?: unknown })?.lang,
    );
    const birth = await withValidatedBirth(req, res);
    if (!birth) return;
    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "natal-overview",
      context: { chart_summary: chartSummary },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );
    res.json({
      chart,
      lang: result.lang,
      content: result.content,
    } as NatalOverviewResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    send500(res);
  }
}

natalRouter.post("/overview", handleOverview);
natalRouter.get("/overview", handleOverview);

async function handleCoreThemes(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  try {
    const requestStart = performance.now();
    const lang = resolveLang(
      req.query.lang ?? (req.body as { lang?: unknown })?.lang,
    );
    const birth = await withValidatedBirth(req, res);
    if (!birth) return;
    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "natal-core-themes",
      context: { chart_summary: chartSummary },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );
    res.json({
      chart,
      lang: result.lang,
      content: result.content,
    } as NatalCoreThemesResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    send500(res);
  }
}

natalRouter.post("/core-themes", handleCoreThemes);
natalRouter.get("/core-themes", handleCoreThemes);

async function handleDimension(
  req: import("express").Request,
  res: import("express").Response,
): Promise<void> {
  try {
    const requestStart = performance.now();
    const lang = resolveLang(
      req.query.lang ?? (req.body as { lang?: unknown })?.lang,
    );
    const birth = await withValidatedBirth(req, res);
    if (!birth) return;
    const dimensionRaw =
      (req.body as { dimension?: unknown })?.dimension ?? req.query.dimension;
    const dimension =
      typeof dimensionRaw === "string" ? dimensionRaw.slice(0, 80) : "";
    const coreStart = performance.now();
    const chart = await ephemerisService.calculateNatalChart(birth);
    const coreMs = performance.now() - coreStart;
    const chartSummary = buildCompactChartSummary(chart);
    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId: "natal-dimension",
      context: { chart_summary: chartSummary, dimension },
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=${coreMs.toFixed(2)},ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );
    res.json({
      chart,
      lang: result.lang,
      content: result.content,
    } as NatalDimensionResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    send500(res);
  }
}

natalRouter.post("/dimension", handleDimension);
natalRouter.get("/dimension", handleDimension);

// Exported for tests.
export const __test__ = { validateBirthPayload, ERROR_MESSAGES };
