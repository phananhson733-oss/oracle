// INPUT: 用户提交的 CBT 自由文本（situation/automaticThoughts/hotThought/balanced 等）。
// OUTPUT: 导出 detectCrisis / resolveRegion / extractFreeText / buildCrisisResponse 工具函数。
// POS: CBT 危机检测服务；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { Request } from "express";
import { EN_PATTERNS, ZH_KEYWORDS } from "../data/crisis-keywords.js";
import {
  getHelplineForRegion,
  type Helpline,
  type RegionCode,
  HELPLINES,
} from "../data/helplines.js";
import { logger } from "../utils/logger.js";

export interface CrisisDetectionResult {
  hit: boolean;
  /** 关键词类别标签（如 "self_harm_en"、"self_harm_zh"），绝不包含命中的原文短语。 */
  reason?: "self_harm_en" | "self_harm_zh" | "detector-error";
  /**
   * 设为 true 表示检测器本身失败（异常 / 内部错误），调用方应按命中处理（fail-closed）。
   * 真正命中关键词时仍只设置 `hit: true`，不会同时设置 `failSafe`。
   */
  failSafe?: boolean;
}

export interface CrisisResponse {
  status: "crisis_detected";
  helpline: Helpline;
  message_zh: string;
  message_en: string;
}

/**
 * 命中文案（双语固定模板）。前端按当前 UI 语言选择渲染。
 * 不引用 i18n 字典是为了在 server 端保持自包含 + 零依赖。
 */
const CRISIS_MESSAGE_ZH =
  "我们注意到你提到了一些让人担心的内容。如果你正在经历危机，请立刻联系下方专业求助热线，你并不孤单。";
const CRISIS_MESSAGE_EN =
  "We noticed something that concerns us. If you are in crisis right now, please reach out to the helpline below — you are not alone.";

/**
 * 在传入文本数组中检测危机关键词。
 *
 * - 异常时 fail-CLOSED：返回 `{ hit: true, failSafe: true }`，调用方应短路到安全响应。
 * - 不返回命中原文，只返回类别标签（隐私红线）。
 * - 接受 `string[]` 或 `(string | undefined | null)[]`，无效项跳过。
 */
export function detectCrisis(
  texts: ReadonlyArray<string | null | undefined>,
): CrisisDetectionResult {
  try {
    for (const raw of texts) {
      if (typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      for (const re of EN_PATTERNS) {
        if (re.test(lower)) {
          return { hit: true, reason: "self_harm_en" };
        }
      }
      for (const kw of ZH_KEYWORDS) {
        if (trimmed.includes(kw)) {
          return { hit: true, reason: "self_harm_zh" };
        }
      }
    }
    return { hit: false };
  } catch (error) {
    // Fail-closed：检测器异常时按命中处理，避免静默放行可能含危机内容的请求到 LLM。
    // 仅记录脱敏的错误信息（message），不记录任何用户输入文本。
    const message = (error as Error)?.message ?? "unknown error";
    logger.error("[crisis-detector] detection failed (fail-closed)", {
      error: message,
    });
    return { hit: true, failSafe: true, reason: "detector-error" };
  }
}

/**
 * 解析请求所属区域：
 *   x-region header → lang 推断 → INTL 兜底。
 */
export function resolveRegion(req: Request, lang: "zh" | "en"): RegionCode {
  try {
    const headerRaw = req.headers?.["x-region"];
    const header = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;
    if (typeof header === "string") {
      const upper = header.trim().toUpperCase() as RegionCode;
      if (HELPLINES[upper]) return upper;
    }
  } catch {
    // 头解析失败仍走 lang 推断。
  }
  if (lang === "zh") return "CN";
  if (lang === "en") return "US";
  return "INTL";
}

/**
 * 构造短路返回 payload。
 * lang 仅用于 helpline 解析的兜底，不影响双语 message 字段。
 */
export function buildCrisisResponse(
  region: RegionCode,
  lang: "zh" | "en",
): CrisisResponse {
  return {
    status: "crisis_detected",
    helpline: getHelplineForRegion(region, lang),
    message_zh: CRISIS_MESSAGE_ZH,
    message_en: CRISIS_MESSAGE_EN,
  };
}

/**
 * 从请求 body 中抽取所有需要检测的自由文本字段。
 *
 * 覆盖 6 个 CBT 端点的字段差异：
 * - /analysis: situation / automaticThoughts[] / hotThought / balancedEntries[].text
 * - /aggregate-analysis 与 4 个独立 stats 端点: stats 中的 notes / text / label 等自由文本。
 *
 * 解析失败时返回空数组（不抛错），由检测器返回未命中。
 */
export function extractFreeText(body: unknown): string[] {
  const out: string[] = [];
  if (!body || typeof body !== "object") return out;
  const b = body as Record<string, unknown>;

  // /analysis 字段
  if (typeof b.situation === "string") out.push(b.situation);
  if (typeof b.hotThought === "string") out.push(b.hotThought);
  if (Array.isArray(b.automaticThoughts)) {
    for (const t of b.automaticThoughts) {
      if (typeof t === "string") out.push(t);
    }
  }
  if (Array.isArray(b.evidenceFor)) {
    for (const t of b.evidenceFor) {
      if (typeof t === "string") out.push(t);
    }
  }
  if (Array.isArray(b.evidenceAgainst)) {
    for (const t of b.evidenceAgainst) {
      if (typeof t === "string") out.push(t);
    }
  }
  if (Array.isArray(b.balancedEntries)) {
    for (const entry of b.balancedEntries) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as { text?: unknown }).text === "string"
      ) {
        out.push((entry as { text: string }).text);
      }
    }
  }

  // mood entries（自由文本字段 name）
  if (Array.isArray(b.moods)) {
    for (const m of b.moods) {
      if (
        m &&
        typeof m === "object" &&
        typeof (m as { name?: unknown }).name === "string"
      ) {
        out.push((m as { name: string }).name);
      }
    }
  }

  // stats 端点：递归扫描 notes / text / label / description 字段（深度受限 3）。
  const statsKeys = [
    "somatic_stats",
    "root_stats",
    "mood_stats",
    "competence_stats",
  ];
  for (const key of statsKeys) {
    if (b[key] !== undefined) {
      collectStringsFromStats(b[key], out, 0);
    }
  }

  return out;
}

const STATS_FREE_TEXT_KEYS = new Set([
  "notes",
  "note",
  "text",
  "label",
  "description",
  "name",
  "thought",
  "situation",
]);

function collectStringsFromStats(
  node: unknown,
  acc: string[],
  depth: number,
): void {
  if (depth > 3 || node === null || node === undefined) return;
  if (typeof node === "string") {
    acc.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectStringsFromStats(item, acc, depth + 1);
    return;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string") {
        if (STATS_FREE_TEXT_KEYS.has(k)) acc.push(v);
        continue;
      }
      if (typeof v === "object") {
        collectStringsFromStats(v, acc, depth + 1);
      }
    }
  }
}

/**
 * 脱敏遥测埋点：仅记录类别 + 区域 + 语言 + 端点，绝不携带用户原文或命中关键词。
 *
 * 当前项目无统一 analytics 出口，先用 console.warn 占位（结构化 JSON 便于日志聚合）。
 */
export function trackCrisisDetected(payload: {
  region: RegionCode;
  lang: "zh" | "en";
  endpoint: string;
}): void {
  try {
    const event = {
      event: "cbt_crisis_detected",
      region: payload.region,
      lang: payload.lang,
      endpoint: payload.endpoint,
    };
    logger.warn(`[crisis-detector] ${JSON.stringify(event)}`);
  } catch {
    // 埋点失败不能影响主响应。
  }
}
