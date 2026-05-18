// INPUT: Natal API 路由。
// OUTPUT: 导出 natal 路由（含 overview/core/dimension、紧凑摘要与 Server-Timing）。
// POS: Natal 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";
import { performance } from "perf_hooks";
// tz-lookup ships no TypeScript declarations and we cannot add a separate .d.ts
// file in this change. Declare the module shape inline; the lib is a single
// function `(lat: number, lon: number) => string` (IANA tz name).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- no upstream types
import tzLookup from "tz-lookup";
import type {
  BirthInput,
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
import {
  GeocodingServiceError,
  LocationResolutionError,
  resolveLocation,
} from "../services/geocoding.js";

export const natalRouter = Router();

// Derive an IANA timezone from a coordinate pair. Returns null when the lookup
// fails (e.g. invalid lat/lon, library throws on out-of-range polar values).
const deriveTimezoneFromCoords = (lat: number, lon: number): string | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  try {
    const tz = (tzLookup as (la: number, lo: number) => string)(lat, lon);
    return typeof tz === "string" && tz.length > 0 ? tz : null;
  } catch {
    return null;
  }
};

async function parseBirthInput(
  query: Record<string, unknown>,
): Promise<BirthInput> {
  const city = (query.city as string) || "";
  const latParam = query.lat;
  const lonParam = query.lon;
  const timezoneParam = query.timezone as string | undefined;
  const hasLat = latParam !== undefined && latParam !== "";
  const hasLon = lonParam !== undefined && lonParam !== "";
  const hasTimezone =
    typeof timezoneParam === "string" && timezoneParam.trim() !== "";
  const shouldResolve = !hasLat || !hasLon || !hasTimezone;
  const geo = shouldResolve ? await resolveLocation(city) : null;
  // Precedence: trust the client-supplied timezone ONLY when the client also
  // supplied exact lat+lon (i.e. asserted "I know my exact location and tz").
  // Otherwise (city-only or partial coords) derive tz from the resolved/supplied
  // coords so the browser's wall-clock zone never silently overrides the birth
  // city's actual zone — a silent override flips rising sign and houses.
  const resolvedLat = hasLat ? Number(latParam) : geo!.lat;
  const resolvedLon = hasLon ? Number(lonParam) : geo!.lon;
  const clientAssertedExactLocation = hasLat && hasLon && hasTimezone;
  let timezone: string;
  if (clientAssertedExactLocation) {
    timezone = timezoneParam as string;
  } else {
    const coordTz = deriveTimezoneFromCoords(resolvedLat, resolvedLon);
    if (coordTz) {
      timezone = coordTz;
    } else if (hasTimezone) {
      timezone = timezoneParam as string;
    } else {
      timezone = geo!.timezone;
    }
  }
  return {
    date: query.date as string,
    time: query.time as string | undefined,
    city: geo?.city || city || "Unknown",
    // 当 hasLat/hasLon/hasTimezone 为 false 时 shouldResolve=true，geo 必非空
    // （resolveLocation 在失败时抛 LocationResolutionError 由 catch 处理）。
    lat: resolvedLat,
    lon: resolvedLon,
    timezone,
    accuracy: (query.accuracy as BirthInput["accuracy"]) || "exact",
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

// GET /api/natal/chart - 仅返回 Real Data
natalRouter.get("/chart", async (req, res) => {
  try {
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const chart = await ephemerisService.calculateNatalChart(birth);
    res.json({ chart } as NatalChartResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/overview - Real Data + AI 内容
natalRouter.get("/overview", async (req, res) => {
  try {
    const requestStart = performance.now();
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
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
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/core-themes
natalRouter.get("/core-themes", async (req, res) => {
  try {
    const requestStart = performance.now();
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
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
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/dimension
natalRouter.get("/dimension", async (req, res) => {
  try {
    const requestStart = performance.now();
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const dimension = req.query.dimension as string;
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
    res.status(500).json({ error: (error as Error).message });
  }
});
