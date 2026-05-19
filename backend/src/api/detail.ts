// INPUT: 技术规格详情解读 API 路由（含 AI 成本攻击面防御：schema + size cap + canonicalization）。
// OUTPUT: 导出 detail 路由（懒加载 AI 详情解读与 Server-Timing）+ 校验/规范化 helper。
// POS: Detail 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
//
// === AI Cost-Gate 威胁模型 ===
// /api/detail 是匿名 POST 端点，body 直接流入 generateAIContent。攻击者可：
//   1. 反复修改 chartData 中无意义字段（添加 noise、键序、空格、精度抖动）
//      绕过 cache key（hashInput(context) 走 JSON.stringify，对键序/精度敏感），
//      在不触发全局 100/min/IP rate-limit 的情况下消耗 AI 预算。
//   2. 发送超大 body 撑爆 prompt token / 上游 LLM 成本。
//   3. 使用 type/context 组合枚举所有 promptId，借合法 promptId 跑大量 unique 请求。
// 分层防御（与 index.ts 的 detailLimiter + body cap 配合）：
//   - 每端点限流（index.ts 中 detailLimiter，20/min/IP，比全局 100/min 严）
//   - express.json body 上限（index.ts 中 4kb，远高于合法 chartData 摘要的 ~1-2kb）
//   - Schema 校验：type/context 走白名单；chartData 必须是非空对象且序列化体积 ≤4kb
//   - chartData 规范化（canonicalizeChartData）：键排序 + 数值固定精度后再入 hash，
//     消除"键序抖动 / 1.0000001 vs 1.0000002"导致的 cache miss
//   - 4xx 错误统一只回 { error, code }，不回显原始 payload（隐私红线 #1）

import { Router } from "express";
import { performance } from "perf_hooks";
import { resolveLang } from "../utils/lang.js";
import { AIUnavailableError, generateAIContent } from "../services/ai.js";
import { resolveSynastryName } from "../prompts/manager.js";

export const detailRouter = Router();

type DetailType =
  | "elements"
  | "aspects"
  | "planets"
  | "asteroids"
  | "rulers"
  | "synthesis";
type DetailContext = "natal" | "transit" | "synastry" | "composite";

const DETAIL_TYPES: ReadonlyArray<DetailType> = [
  "elements",
  "aspects",
  "planets",
  "asteroids",
  "rulers",
  "synthesis",
];
const DETAIL_CONTEXTS: ReadonlyArray<DetailContext> = [
  "natal",
  "transit",
  "synastry",
  "composite",
];

// chartData JSON 序列化体积上限（4kb）。合法 detail 请求实测 chartData ≈1-2kb
// （positions[] + houses[] + aspects[] 紧凑结构）。4kb 给规范化前的客户端结构
// 充足缓冲，同时阻止攻击者用 noise 字段无限放大入参绕过 cache。
const CHART_DATA_MAX_BYTES = 4096;
// 数值规范化精度：占星坐标 1e-6 度 ≈ 0.0036 角秒，远超占星可感知精度
// （星历计算本身约 1 角秒 = 2.78e-4 度）。截到 6 位避免攻击者用 1.0000001 vs
// 1.0000002 制造 cache miss。
const NUMERIC_PRECISION = 1e6;
const TRANSIT_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// nameA / nameB 透传给 resolveSynastryName，最终被 alias 化（不入 prompt 原文）。
// 仍设上限避免攻击者塞超长字段撑大 hashInput 输入。
const NAME_MAX_LENGTH = 80;

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_FIELDS: "Missing required fields.",
  INVALID_TYPE: "Invalid type.",
  INVALID_CONTEXT: "Invalid context.",
  INVALID_CHART_DATA: "Invalid chart data.",
  CHART_DATA_TOO_LARGE: "Chart data exceeds size limit.",
  INVALID_TRANSIT_DATE: "Invalid transit date.",
  INVALID_NAME: "Invalid name.",
  PAYLOAD_TOO_LARGE: "Request body exceeds size limit.",
  INVALID_JSON: "Malformed JSON body.",
};

function resolvePromptId(type: DetailType, context: DetailContext): string {
  return `detail-${type}-${context}`;
}

function sendValidationError(
  res: import("express").Response,
  status: number,
  code: string,
): void {
  res
    .status(status)
    .json({ error: ERROR_MESSAGES[code] ?? "Invalid input.", code });
}

// Recursively canonicalize chartData so cosmetic mutations (key reordering,
// floating-point noise) don't bypass the AI cache.
// - Objects: sort keys (deterministic JSON.stringify order)
// - Arrays: preserve order (semantic — e.g. positions[i] is a specific planet)
// - Numbers: round to NUMERIC_PRECISION fixed digits, preserve NaN/Infinity sentinels
// - Strings/booleans/null/undefined: passthrough
// Returns a brand-new structure — never mutates input (immutability rule).
function canonicalizeChartData(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return value;
    return Math.round(value * NUMERIC_PRECISION) / NUMERIC_PRECISION;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeChartData(item));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      out[k] = canonicalizeChartData(obj[k]);
    }
    return out;
  }
  return value;
}

type ValidatedDetail = {
  type: DetailType;
  context: DetailContext;
  chartData: Record<string, unknown>;
  transitDate?: string;
  nameA?: string;
  nameB?: string;
};

type ValidationResult =
  | { ok: true; value: ValidatedDetail }
  | { ok: false; status: number; code: string };

function validateDetailPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, status: 400, code: "MISSING_FIELDS" };
  }
  const body = payload as Record<string, unknown>;
  const { type, context, chartData, transitDate, nameA, nameB } = body;

  if (
    typeof type !== "string" ||
    typeof context !== "string" ||
    !chartData ||
    typeof chartData !== "object" ||
    Array.isArray(chartData)
  ) {
    return { ok: false, status: 400, code: "MISSING_FIELDS" };
  }

  if (!DETAIL_TYPES.includes(type as DetailType)) {
    return { ok: false, status: 400, code: "INVALID_TYPE" };
  }
  if (!DETAIL_CONTEXTS.includes(context as DetailContext)) {
    return { ok: false, status: 400, code: "INVALID_CONTEXT" };
  }

  // Size cap on chartData specifically (independent of overall body cap, in
  // case future legitimate fields grow). Reject before doing any AI work.
  let chartDataBytes: number;
  try {
    chartDataBytes = Buffer.byteLength(JSON.stringify(chartData), "utf8");
  } catch {
    return { ok: false, status: 400, code: "INVALID_CHART_DATA" };
  }
  if (chartDataBytes > CHART_DATA_MAX_BYTES) {
    return { ok: false, status: 413, code: "CHART_DATA_TOO_LARGE" };
  }

  let transitDateValidated: string | undefined;
  if (transitDate !== undefined && transitDate !== null && transitDate !== "") {
    if (
      typeof transitDate !== "string" ||
      !TRANSIT_DATE_REGEX.test(transitDate)
    ) {
      return { ok: false, status: 400, code: "INVALID_TRANSIT_DATE" };
    }
    // Round-trip check (reject e.g. 2024-02-31).
    const d = new Date(`${transitDate}T00:00:00Z`);
    if (
      Number.isNaN(d.getTime()) ||
      d.toISOString().slice(0, 10) !== transitDate
    ) {
      return { ok: false, status: 400, code: "INVALID_TRANSIT_DATE" };
    }
    transitDateValidated = transitDate;
  }

  let nameAValidated: string | undefined;
  if (nameA !== undefined && nameA !== null && nameA !== "") {
    if (typeof nameA !== "string" || nameA.length > NAME_MAX_LENGTH) {
      return { ok: false, status: 400, code: "INVALID_NAME" };
    }
    nameAValidated = nameA;
  }
  let nameBValidated: string | undefined;
  if (nameB !== undefined && nameB !== null && nameB !== "") {
    if (typeof nameB !== "string" || nameB.length > NAME_MAX_LENGTH) {
      return { ok: false, status: 400, code: "INVALID_NAME" };
    }
    nameBValidated = nameB;
  }

  return {
    ok: true,
    value: {
      type: type as DetailType,
      context: context as DetailContext,
      chartData: chartData as Record<string, unknown>,
      transitDate: transitDateValidated,
      nameA: nameAValidated,
      nameB: nameBValidated,
    },
  };
}

// POST /api/detail - 按需生成技术规格详情解读
detailRouter.post("/", async (req, res) => {
  try {
    const requestStart = performance.now();
    const lang = resolveLang((req.body as { lang?: unknown })?.lang);
    const validated = validateDetailPayload(req.body);
    if (!validated.ok) {
      sendValidationError(res, validated.status, validated.code);
      return;
    }
    const { type, context, chartData, transitDate, nameA, nameB } =
      validated.value;

    const promptId = resolvePromptId(type, context);
    // Privacy red line: never let real names enter the LLM prompt context.
    // Force alias (Person A/B in EN, A/B in ZH) regardless of what the client sent.
    const aliasCtx = { lang, nameA, nameB };
    // Canonicalize chartData BEFORE it enters the prompt context so the
    // downstream cacheKey = hashInput(context) is stable against cosmetic
    // mutations. Real-data semantics are preserved (precision is below the
    // calculation noise floor; key order is alphabetical).
    const canonicalChartData = canonicalizeChartData(chartData);
    const promptContext: Record<string, unknown> = {
      type,
      context,
      chartData: canonicalChartData,
      transitDate,
      nameA: resolveSynastryName(aliasCtx, "nameA"),
      nameB: resolveSynastryName(aliasCtx, "nameB"),
    };

    const aiStart = performance.now();
    const result = await generateAIContent({
      promptId,
      context: promptContext,
      lang,
    });
    const aiMs = performance.now() - aiStart;
    const totalMs = performance.now() - requestStart;
    res.setHeader(
      "Server-Timing",
      `core;dur=0,ai;dur=${aiMs.toFixed(2)},total;dur=${totalMs.toFixed(2)}`,
    );

    res.json({
      type,
      context,
      lang: result.lang,
      content: result.content,
    });
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: "AI unavailable", reason: error.reason });
      return;
    }
    // Never echo error.message (may include user input via downstream libs).
    res.status(500).json({ error: "Unexpected server error.", code: "INTERNAL" });
  }
});

// Exported for tests.
export const __test__ = {
  validateDetailPayload,
  canonicalizeChartData,
  CHART_DATA_MAX_BYTES,
  ERROR_MESSAGES,
};
