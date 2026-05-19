// INPUT: Cycle API 路由（含 AI 成本攻击面防御：planet/cycleType allowlist + 日期范围校验）。
// OUTPUT: 导出 cycle 路由（list/naming 与单语言输出）+ 校验 helper。
// POS: Cycle 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
//
// === AI Cost-Gate 威胁模型（仅 /naming）===
// /api/cycle/naming 是匿名 GET 端点，query 参数（planet/cycleType/start/peak/end）
// 直接流入 generateAIContent。攻击者可：
//   1. 任意改 planet / cycleType / 日期，绕过 cache（hashInput 对入参敏感），
//      在不触发全局 100/min/IP rate-limit 的情况下消耗 AI 预算。
//   2. 用未来 100 年的日期组合枚举无意义 unique key。
// 分层防御（与 index.ts 的 cycleNamingLimiter 配合）：
//   - 每端点限流（index.ts 中 cycleNamingLimiter，30/min/IP）
//   - planet 白名单：仅外行星 + Chiron（calculateCycles 实际只产出外行星）
//   - cycleType 白名单：Return / Opposition / Square（calculateCycles 实际类型）
//   - 日期范围：start ≤ peak ≤ end，且都在 [今天-50年, 今天+10年] 合理窗口
//   - 4xx 错误统一只回 { error, code }

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

// === /naming 输入校验 ===
//
// Allowlist 来自 backend/src/services/ephemeris.ts::calculateCycles 的实际产出：
// outerPlanets = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
// types: "Return" | "Opposition" | "Square"
// 加 Chiron 是为未来扩展（Chiron Return 是常见占星周期），不增加攻击面。

const ALLOWED_PLANETS: ReadonlyArray<string> = [
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Chiron",
];
const ALLOWED_CYCLE_TYPES: ReadonlyArray<string> = [
  "Return",
  "Opposition",
  "Square",
  "Trine",
  "Sextile",
  "Conjunction",
];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// 合理日期窗口：往前 50 年（覆盖任何活人的 outer-planet 周期史），
// 往后 10 年（覆盖前瞻规划）。攻击者无法用 9999-12-31 制造无意义 unique key。
const DATE_LOOKBACK_MS = 50 * 365 * 24 * 60 * 60 * 1000;
const DATE_LOOKAHEAD_MS = 10 * 365 * 24 * 60 * 60 * 1000;

const NAMING_ERROR_MESSAGES: Record<string, string> = {
  MISSING_FIELDS: "Missing required fields.",
  INVALID_PLANET: "Invalid planet.",
  INVALID_CYCLE_TYPE: "Invalid cycle type.",
  INVALID_DATE: "Invalid date format.",
  DATE_OUT_OF_RANGE: "Date out of acceptable range.",
  DATE_ORDER: "Dates must satisfy start <= peak <= end.",
};

type ValidatedNaming = {
  planet: string;
  cycleType: string;
  start: string;
  peak: string;
  end: string;
};

type NamingValidation =
  | { ok: true; value: ValidatedNaming }
  | { ok: false; code: string };

type ParseResult =
  | { ok: true; t: number }
  | { ok: false; reason: "format" | "range" };

function parseDateInRange(value: string, now: number): ParseResult {
  if (!DATE_REGEX.test(value)) return { ok: false, reason: "format" };
  const d = new Date(`${value}T00:00:00Z`);
  const t = d.getTime();
  if (Number.isNaN(t)) return { ok: false, reason: "format" };
  // Reject silently-rolling-over invalid calendar dates (e.g. 2024-02-31 → Mar 2).
  // Treated as a format error — the input shape parses but doesn't denote a real date.
  if (d.toISOString().slice(0, 10) !== value) {
    return { ok: false, reason: "format" };
  }
  if (t < now - DATE_LOOKBACK_MS || t > now + DATE_LOOKAHEAD_MS) {
    return { ok: false, reason: "range" };
  }
  return { ok: true, t };
}

function validateNamingQuery(query: Record<string, unknown>): NamingValidation {
  const planet = typeof query.planet === "string" ? query.planet : "";
  const cycleType = typeof query.cycleType === "string" ? query.cycleType : "";
  const start = typeof query.start === "string" ? query.start : "";
  const peak = typeof query.peak === "string" ? query.peak : "";
  const end = typeof query.end === "string" ? query.end : "";

  if (!planet || !cycleType || !start || !peak || !end) {
    return { ok: false, code: "MISSING_FIELDS" };
  }
  if (!ALLOWED_PLANETS.includes(planet)) {
    return { ok: false, code: "INVALID_PLANET" };
  }
  if (!ALLOWED_CYCLE_TYPES.includes(cycleType)) {
    return { ok: false, code: "INVALID_CYCLE_TYPE" };
  }

  const now = Date.now();
  const parsed = [
    parseDateInRange(start, now),
    parseDateInRange(peak, now),
    parseDateInRange(end, now),
  ];
  // Format errors win precedence (a malformed date is a more fundamental
  // problem than range; surfacing the deeper issue first is clearer to clients).
  if (parsed.some((p) => !p.ok && p.reason === "format")) {
    return { ok: false, code: "INVALID_DATE" };
  }
  if (parsed.some((p) => !p.ok && p.reason === "range")) {
    return { ok: false, code: "DATE_OUT_OF_RANGE" };
  }
  // All parses succeeded — narrow to ok branch for ordering check.
  const [startT, peakT, endT] = parsed.map((p) => (p.ok ? p.t : Number.NaN));
  if (!(startT <= peakT && peakT <= endT)) {
    return { ok: false, code: "DATE_ORDER" };
  }
  return { ok: true, value: { planet, cycleType, start, peak, end } };
}

function sendNamingValidationError(
  res: import("express").Response,
  code: string,
): void {
  res
    .status(400)
    .json({ error: NAMING_ERROR_MESSAGES[code] ?? "Invalid input.", code });
}

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
    const validated = validateNamingQuery(req.query as Record<string, unknown>);
    if (!validated.ok) {
      sendNamingValidationError(res, validated.code);
      return;
    }
    const { planet, cycleType, start, peak, end } = validated.value;
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
    res
      .status(500)
      .json({ error: "Unexpected server error.", code: "INTERNAL" });
  }
});

// Exported for tests.
export const __test__ = {
  validateNamingQuery,
  ALLOWED_PLANETS,
  ALLOWED_CYCLE_TYPES,
  NAMING_ERROR_MESSAGES,
};
