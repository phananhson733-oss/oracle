// INPUT: Cycle API 路由。
// OUTPUT: 导出 cycle 路由（list/naming 与单语言输出）。
// POS: Cycle 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";
import type {
  BirthInput,
  CycleListResponse,
  CycleNamingResponse,
} from "../types/api.js";
import { resolveLang } from "../utils/lang.js";
import { ephemerisService } from "../services/ephemeris.js";
import { AIUnavailableError, generateAIContent } from "../services/ai.js";
import {
  GeocodingServiceError,
  LocationResolutionError,
  resolveLocation,
} from "../services/geocoding.js";

export const cycleRouter = Router();

async function parseBirthInput(
  query: Record<string, unknown>,
): Promise<BirthInput> {
  const city = query.city as string;
  const geo = await resolveLocation(city);
  const latParam = query.lat;
  const lonParam = query.lon;
  return {
    date: query.date as string,
    time: query.time as string | undefined,
    city: geo.city,
    lat: latParam === undefined || latParam === "" ? geo.lat : Number(latParam),
    lon: lonParam === undefined || lonParam === "" ? geo.lon : Number(lonParam),
    timezone: (query.timezone as string) || geo.timezone,
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

// GET /api/cycle/list - 周期列表
cycleRouter.get("/list", async (req, res) => {
  try {
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const months = Number(req.query.months) || 12;
    const cycles = await ephemerisService.calculateCycles(birth, months);
    res.json({ cycles } as CycleListResponse);
  } catch (error) {
    if (handleBirthInputError(error, res)) return;
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/cycle/naming - 周期命名
cycleRouter.get("/naming", async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const { planet, cycleType, start, peak, end } = req.query as Record<
      string,
      string
    >;
    const result = await generateAIContent({
      promptId: "cycle-naming",
      context: { planet, cycleType, start, peak, end },
      lang,
    });
    res.json({
      lang: result.lang,
      content: result.content,
    } as CycleNamingResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});
