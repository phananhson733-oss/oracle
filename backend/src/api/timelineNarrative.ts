// INPUT: Express；共享 birth 校验（./birthInput.js）；真人生 K 线引擎（lifeArc.js）+ 本命摘要（ephemeris.js）；
//        context 派生（narrativeContext.js）；AI 服务（ai.js）；付费 gate（timelinePaywall.js）；可选鉴权（auth.js）。
// OUTPUT: 导出 timelineNarrativeRouter（POST /api/transit/narrative）—— 登录后基于真实人生 K 线生成六章人生能量叙事。
//         所有 4xx 只下发 code，绝不回显原始 city / Error.message（隐私红线 #1/#3）；context 只含星座/年龄/相位天体名，无 PII。
// POS: 人生能量叙事端点（LLM，区别于纯计算的 /timeline）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";
import type { Request, Response } from "express";
import {
  validateBirthPayload,
  birthFromValidated,
  sendValidationError,
  handleBirthInputError,
  send500,
} from "./birthInput.js";
import { optionalAuthMiddleware } from "./auth.js";
import {
  buildLifeTimeline,
  MAX_LIFE_CANDLES,
} from "../services/transit/lifeArc.js";
import { EphemerisUnavailableError } from "../services/transit/timeline.js";
import {
  buildCompactChartSummary,
  ephemerisService,
} from "../services/ephemeris.js";
import { buildLifeNarrativeContext } from "../services/transit/narrativeContext.js";
import { isTimelineFeatureUnlocked } from "../services/transit/timelinePaywall.js";
import {
  AIUnavailableError,
  generateAIContentWithMeta,
} from "../services/ai.js";
import { resolveLang } from "../utils/lang.js";
import type {
  LifeNarrativeContent,
  TimelineNarrativeResponse,
} from "../types/timeline.js";

export const timelineNarrativeRouter = Router();

// 未来视野：覆盖过去 + 当下 + 约三十年未来（含临近的周期节点），上限挡在引擎的 100 岁。
const FUTURE_HORIZON_YEARS = 30;

async function handleNarrative(req: Request, res: Response): Promise<void> {
  try {
    // 登录后才可生成（深度个人化 + 昂贵 LLM；匿名 demo 走前端 upsell，不打这个端点）。
    if (!req.userId) {
      res.status(401).json({ error: "Login required", code: "LOGIN_REQUIRED" });
      return;
    }

    // 付费 gate：flag OFF（默认）→ 恒解锁、全免费；flag ON 时需 entitlement 接线（见 timelinePaywall.ts，
    // 翻 flag 必须同时接 entitlementServiceV2，否则此处 hasEntitlement=false 会锁全员——这是有意的脚手架态）。
    if (!isTimelineFeatureUnlocked("full_year_narrative", false)) {
      res
        .status(402)
        .json({ error: "Premium feature", code: "NARRATIVE_LOCKED" });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const birthPayload = (
      typeof body.birth === "object" && body.birth !== null ? body.birth : body
    ) as Record<string, unknown>;

    const validated = validateBirthPayload(birthPayload);
    if (!validated.ok) {
      sendValidationError(res, validated.code);
      return;
    }

    const lang = resolveLang(body.lang);
    const tz = typeof body.tz === "string" && body.tz ? body.tz : "UTC";

    let birth;
    try {
      birth = await birthFromValidated(validated.value);
    } catch (error) {
      if (handleBirthInputError(error, res)) return;
      send500(res);
      return;
    }

    const birthYear = Number(birth.date.slice(0, 4));
    const currentYear = new Date().getUTCFullYear();
    const currentAge = Math.max(
      0,
      Math.min(MAX_LIFE_CANDLES - 1, currentYear - birthYear),
    );
    const toAge = Math.min(
      MAX_LIFE_CANDLES - 1,
      currentAge + FUTURE_HORIZON_YEARS,
    );

    // 真本命摘要 + 真人生 K 线（natal 命中缓存，与 buildLifeTimeline 内部计算不重复付费）。
    const natal = await ephemerisService.calculateNatalChart(birth);
    const chartSummary = buildCompactChartSummary(natal);
    const life = await buildLifeTimeline(birth, 0, toAge, tz);

    // 压缩成纯净 context（只含星座名/年龄/相位天体名——无城市/经纬度/出生日期原文）。
    // currentYear 仅用于算 currentAge，不进 context：currentYear + currentAge 可推回出生年（隐私红线 #2）。
    const context = buildLifeNarrativeContext({
      chartSummary,
      candles: life.candles,
      markers: life.markers,
      currentAge,
    });

    const { content, meta } =
      await generateAIContentWithMeta<LifeNarrativeContent>({
        promptId: "timeline-life-narrative",
        context: { ...context },
        lang,
      });

    res.json({
      lang: content.lang,
      content: content.content,
      meta,
      currentAge,
    } as TimelineNarrativeResponse);
  } catch (error) {
    if (error instanceof EphemerisUnavailableError) {
      res.status(503).json({
        error: "Energy timeline is temporarily unavailable. Please try again.",
        code: "EPHEMERIS_UNAVAILABLE",
      });
      return;
    }
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    send500(res);
  }
}

timelineNarrativeRouter.post("/", optionalAuthMiddleware, handleNarrative);
