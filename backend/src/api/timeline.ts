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
import {
  buildMonthlyTimeline,
  buildYearOfMonthsTimeline,
  EphemerisUnavailableError,
} from "../services/transit/timeline.js";
import {
  buildLifeTimeline,
  MAX_LIFE_CANDLES,
} from "../services/transit/lifeArc.js";
import type {
  TimelineGranularity,
  TimelineResponse,
} from "../types/timeline.js";

export const transitRouter = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// 单请求最多 92 天（~3 个月）。月度 K 线视图一次只取一个月；上限挡住放大计算量的滥用
// （每天 ~6 次瘦经度计算，是 natal 的数十倍；配合更严限流，见 index.ts）。设计 F-E6 / B2。
const MAX_RANGE_DAYS = 92;
// B2 月内·12 月粒度：一次最多覆盖 12 个日历月（builder 逐日取数但共享日缓存）。
const MAX_MONTH_CANDLES = 12;
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
  if (
    granularityRaw !== "day" &&
    granularityRaw !== "month" &&
    granularityRaw !== "year"
  ) {
    return {
      ok: false,
      status: 400,
      code: "GRANULARITY_UNSUPPORTED",
      error: "range.granularity must be 'day', 'month', or 'year'.",
    };
  }
  const granularity = granularityRaw as TimelineGranularity;

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

  if (granularity === "day") {
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
  } else if (granularity === "month") {
    // month（月内·12 月粒度）：from/to 界定日历窗口，每根蜡烛 = 一个日历月。
    const spanMonths =
      (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
      (Number(to.slice(5, 7)) - Number(from.slice(5, 7)));
    if (spanMonths < 0) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_RANGE",
        error: "range.to must not precede range.from.",
      };
    }
    if (spanMonths + 1 > MAX_MONTH_CANDLES) {
      return {
        ok: false,
        status: 400,
        code: "RANGE_TOO_LARGE",
        error: `Range exceeds the ${MAX_MONTH_CANDLES}-month maximum.`,
      };
    }
  } else {
    // year（人生 K 线）：from/to 的年份部分界定日历窗口，每根蜡烛 = 一岁。
    const spanYears = Number(to.slice(0, 4)) - Number(from.slice(0, 4));
    if (spanYears < 0) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_RANGE",
        error: "range.to must not precede range.from.",
      };
    }
    if (spanYears + 1 > MAX_LIFE_CANDLES) {
      return {
        ok: false,
        status: 400,
        code: "RANGE_TOO_LARGE",
        error: `Range exceeds the ${MAX_LIFE_CANDLES}-year maximum.`,
      };
    }
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

  return { ok: true, granularity, from, to: to as string, tz: tzRaw };
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

    let result;
    if (range.granularity === "year") {
      // from/to 年份 → 相对出生年的年龄区间（人生 K 线一根蜡烛 = 一岁）。
      const birthYear = Number(birth.date.slice(0, 4));
      const fromAge = Math.max(0, Number(range.from.slice(0, 4)) - birthYear);
      const toAge = Math.min(
        MAX_LIFE_CANDLES - 1,
        Math.max(fromAge, Number(range.to.slice(0, 4)) - birthYear),
      );
      result = await buildLifeTimeline(birth, fromAge, toAge, range.tz);
    } else if (range.granularity === "month") {
      // B2 月内·12 月粒度：一根蜡烛 = 一个日历月（复用日缓存）。
      result = await buildYearOfMonthsTimeline(
        birth,
        range.from,
        range.to,
        range.tz,
      );
    } else {
      result = await buildMonthlyTimeline(
        birth,
        range.from,
        range.to,
        range.tz,
      );
    }

    const payload: TimelineResponse = {
      granularity: range.granularity,
      tz: range.tz,
      contract: result.contract,
      candles: result.candles,
      markers: result.markers,
      dataQuality: result.dataQuality,
      accuracy: result.accuracy,
      // B1：gate OFF 时恒 undefined（向后兼容）；life 结果暂无 domains（in 守卫）。
      // B1：gate OFF 时恒 undefined → 不进响应（向后兼容）。
      domainScores: result.domainScores,
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
