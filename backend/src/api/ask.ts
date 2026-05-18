// INPUT: Ask API 路由（含权益校验与单语言输出）。
// OUTPUT: 导出 ask 路由（含类别上下文、权益校验与消费）。
// POS: Ask 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";
import type {
  AskRequest,
  AskResponse,
  AskChartType,
  TransitData,
} from "../types/api.js";
import { resolveLang } from "../utils/lang.js";
import { ephemerisService } from "../services/ephemeris.js";
import {
  AIUnavailableError,
  generateAIContentWithMeta,
} from "../services/ai.js";
import { optionalAuthMiddleware } from "./auth.js";
import entitlementServiceV2 from "../services/entitlementServiceV2.js";
import { PRICING } from "../config/auth.js";

export const askRouter = Router();

// Determine chart type based on category
// time_cycles questions need transit chart (includes natal + current transits)
const getChartType = (category?: string): AskChartType => {
  if (category === "time_cycles") return "transit";
  return "natal";
};

// POST /api/ask - 问答
askRouter.post("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      birth,
      question,
      context,
      category,
      lang: langInput,
      tz,
    } = req.body as AskRequest & { tz?: string };
    const lang = resolveLang(langInput);
    const chartType = getChartType(category);
    const deviceFingerprint = req.headers["x-device-fingerprint"] as
      | string
      | undefined;
    const timezone =
      (tz as string) || (req.headers["x-user-timezone"] as string) || undefined;

    // 1) checkAccess 作为 UX 预检 — 快速判断是否显然无额度
    const access = await entitlementServiceV2.checkAccess(
      req.userId || null,
      "ask",
      undefined,
      deviceFingerprint,
      timezone,
    );
    if (!access.canAccess) {
      return res.status(403).json({
        error: "Feature not available",
        needPurchase: access.needPurchase,
        price: access.price,
      });
    }

    // 2) reserveFeature 是真正的并发安全闸门：原子扣减额度，
    //    返回 reservationId 用于 commit/refund。并发请求中只有一个会拿到 reservationId。
    const reservation = await entitlementServiceV2.reserveFeature(
      req.userId || null,
      "ask",
      deviceFingerprint,
      timezone,
    );
    if (!reservation.reserved) {
      return res.status(402).json({
        error: "Out of credits",
        needPurchase: true,
        price: PRICING.ASK_SINGLE,
      });
    }

    try {
      // 3) Calculate natal chart (always needed)
      const chart = await ephemerisService.calculateNatalChart(birth);

      // 4) Calculate transits if needed for time_cycles questions
      let transits: TransitData | undefined;
      if (chartType === "transit") {
        transits = await ephemerisService.calculateTransits(birth, new Date());
      }

      // 5) 调用 LLM（昂贵操作 — 已被预占保护）
      const { content, meta } = await generateAIContentWithMeta({
        promptId: "ask-answer",
        context: { chart, transits, question, context, category },
        lang,
      });

      // 6) 成功：提交预占（扣减保持）
      await entitlementServiceV2.commitReservation(reservation.reservationId);

      res.json({
        lang: content.lang,
        content: content.content,
        meta,
        chart,
        transits,
        chartType,
      } as AskResponse);
    } catch (innerError) {
      // 7) LLM / 星历失败：归还预占的额度
      await entitlementServiceV2.refundReservation(reservation.reservationId);
      throw innerError;
    }
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(502).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});
