// INPUT: Express；共享 birth 校验（./birthInput.js）；transit timeline 编排（../services/transit/timeline.js）；timeline 类型。
// OUTPUT: 导出 transitRouter（GET/POST /api/transit/timeline）。无 LLM、不计 AI 配额；纯计算 + 单日缓存。
//         所有 4xx 只下发 code，绝不回显原始 city / Error.message（隐私红线 #1/#3）。
// POS: transit timeline 端点（#2）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";
import type { Request, Response } from "express";
import {
  validateBirthPayload,
  birthFromValidated,
  sendValidationError,
  handleBirthInputError,
  send500,
} from "./birthInput.js";
import { buildMonthlyTimeline, EphemerisUnavailableError } from "../services/transit/timeline.js";
import type { TimelineGranularity, TimelineResponse } from "../types/timeline.js";

export const transitRouter = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// 单请求最多 92 天（~3 个月）。月度 K 线视图一次只取一个月；上限挡住放大计算量的滥用
// （每天 ~6 次瘦经度计算，是 natal 的数十倍；配合更严限流，见 index.ts）。设计 F-E6 / B2。
const MAX_RANGE_DAYS = 92;
const MS_PER_DAY = 86_400_000;

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isValidTimezone(tz: string): boolean {
  try {
    // Intl 对无效时区抛 RangeError。
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

interface RangeOk {
  ok: true;
  granularity: TimelineGranularity;
  from: string;
  to: string;
  tz: string;
}
interface RangeErr {
  ok: false;
  status: number;
  code: string;
  error: string;
}

function validateRange(body: Record<string, unknown>): RangeOk | RangeErr {
  const range = (body.range ?? {}) as Record<string, unknown>;

  const granularityRaw =
    typeof range.granularity === "string" ? range.granularity : "day";
  if (granularityRaw !== "day") {
    // 'year'（人生 K 线）走独立后台预计算路径（#17/#18），P0 月度端点不支持。
    return {
      ok: false,
      status: 400,
      code: "GRANULARITY_UNSUPPORTED",
      error: "Only day-granularity timelines are available.",
    };
  }

  const from = range.from;
  const to = range.to;
  if (!isValidDate(from) || !isValidDate(to)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_RANGE",
      error: "range.from and range.to must be YYYY-MM-DD.",
    };
  }

  const spanDays =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    MS_PER_DAY;
  if (spanDays < 0) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_RANGE",
      error: "range.to must not precede range.from.",
    };
  }
  if (spanDays + 1 > MAX_RANGE_DAYS) {
    return {
      ok: false,
      status: 400,
      code: "RANGE_TOO_LARGE",
      error: `Range exceeds the ${MAX_RANGE_DAYS}-day maximum.`,
    };
  }

  const tzRaw = typeof body.tz === "string" && body.tz ? body.tz : "UTC";
  if (tzRaw.length > 100 || !isValidTimezone(tzRaw)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_TIMEZONE",
      error: "Invalid timezone.",
    };
  }

  return { ok: true, granularity: "day", from, to: to as string, tz: tzRaw };
}

async function handleTimeline(req: Request, res: Response): Promise<void> {
  try {
    const body = (
      req.method === "POST" ? (req.body ?? {}) : (req.query ?? {})
    ) as Record<string, unknown>;

    // birth 支持嵌套（body.birth）或扁平（兼容 GET query）。
    const birthPayload = (
      typeof body.birth === "object" && body.birth !== null ? body.birth : body
    ) as Record<string, unknown>;

    const validated = validateBirthPayload(birthPayload);
    if (!validated.ok) {
      sendValidationError(res, validated.code);
      return;
    }

    const range = validateRange(body);
    if (!range.ok) {
      res.status(range.status).json({ error: range.error, code: range.code });
      return;
    }

    let birth;
    try {
      birth = await birthFromValidated(validated.value);
    } catch (error) {
      if (handleBirthInputError(error, res)) return;
      send500(res);
      return;
    }

    const result = await buildMonthlyTimeline(
      birth,
      range.from,
      range.to,
      range.tz,
    );

    const payload: TimelineResponse = {
      granularity: range.granularity,
      tz: range.tz,
      contract: result.contract,
      candles: result.candles,
      markers: result.markers,
      dataQuality: result.dataQuality,
      accuracy: result.accuracy,
    };
    res.json(payload);
  } catch (error) {
    if (error instanceof EphemerisUnavailableError) {
      res.status(503).json({
        error: "Energy timeline is temporarily unavailable. Please try again.",
        code: "EPHEMERIS_UNAVAILABLE",
      });
      return;
    }
    send500(res);
  }
}

transitRouter.post("/timeline", handleTimeline);
transitRouter.get("/timeline", handleTimeline);
