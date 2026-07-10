// INPUT: Supabase client + DeepSeek chat/completions response payloads.
// OUTPUT: extractDeepSeekUsage parser and fire-and-forget recordAiUsage persistence into ai_usage_log.
// POS: AI token usage accounting; consumed by services/ai.ts call sites. If updated, update services/FOLDER.md.
// NOTE: must never throw or block the AI request path; failures are logged and swallowed.

import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { logger } from "../utils/logger.js";

export interface DeepSeekUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHitTokens: number | null;
  cacheMissTokens: number | null;
  reasoningTokens: number | null;
}

export type AiCallPhase = "generate" | "reformat" | "repair";

export interface AiUsageRecord {
  promptId: string;
  phase: AiCallPhase;
  model: string;
  status: "success" | "error";
  durationMs: number;
  lang?: string;
  requestId?: string;
  usage?: DeepSeekUsage | null;
  errorCode?: string;
}

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Parse the `usage` block of a DeepSeek chat/completions response.
 * Returns null when the required counters are absent or malformed.
 */
export function extractDeepSeekUsage(data: unknown): DeepSeekUsage | null {
  if (!data || typeof data !== "object") return null;
  const usage = (data as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") return null;

  const u = usage as Record<string, unknown>;
  const promptTokens = asCount(u.prompt_tokens);
  const completionTokens = asCount(u.completion_tokens);
  const totalTokens = asCount(u.total_tokens);
  if (
    promptTokens === null ||
    completionTokens === null ||
    totalTokens === null
  ) {
    return null;
  }

  const details = u.completion_tokens_details;
  const reasoningTokens =
    details && typeof details === "object"
      ? asCount((details as Record<string, unknown>).reasoning_tokens)
      : null;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    cacheHitTokens: asCount(u.prompt_cache_hit_tokens),
    cacheMissTokens: asCount(u.prompt_cache_miss_tokens),
    reasoningTokens,
  };
}

export interface AiCallTrackerBase {
  promptId: string;
  phase: AiCallPhase;
  model: string;
  lang?: string;
  requestId?: string;
}

/**
 * Per-call tracker: created before the provider request, then exactly one of
 * success()/failure() persists a row (later calls are no-ops). Keeps call
 * sites to three lines and prevents double counting when a parse error
 * follows a successful API response.
 */
export function createAiCallTracker(base: AiCallTrackerBase): {
  success: (responseData: unknown) => void;
  failure: (errorCode: string) => void;
} {
  const startedAt = Date.now();
  let done = false;

  return {
    success(responseData: unknown): void {
      if (done) return;
      done = true;
      void recordAiUsage({
        ...base,
        status: "success",
        durationMs: Date.now() - startedAt,
        usage: extractDeepSeekUsage(responseData),
      });
    },
    failure(errorCode: string): void {
      if (done) return;
      done = true;
      void recordAiUsage({
        ...base,
        status: "error",
        durationMs: Date.now() - startedAt,
        errorCode,
      });
    },
  };
}

/**
 * Persist one LLM call's usage into ai_usage_log.
 * Fire-and-forget: resolves without throwing on any failure so the AI
 * request path is never affected. Callers may `void recordAiUsage(...)`.
 */
export async function recordAiUsage(record: AiUsageRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const usage = record.usage ?? null;
  const row = {
    prompt_id: record.promptId,
    phase: record.phase,
    model: record.model,
    status: record.status,
    duration_ms: record.durationMs,
    lang: record.lang ?? null,
    request_id: record.requestId ?? null,
    prompt_tokens: usage?.promptTokens ?? null,
    completion_tokens: usage?.completionTokens ?? null,
    total_tokens: usage?.totalTokens ?? null,
    cache_hit_tokens: usage?.cacheHitTokens ?? null,
    cache_miss_tokens: usage?.cacheMissTokens ?? null,
    reasoning_tokens: usage?.reasoningTokens ?? null,
    error_code: record.errorCode ?? null,
  };

  try {
    const { error } = await supabase.from("ai_usage_log").insert(row);
    if (error) {
      logger.warn("[AIUsage] failed to persist usage record", {
        promptId: record.promptId,
        phase: record.phase,
        error: error.message ?? error,
      });
    }
  } catch (err) {
    logger.warn("[AIUsage] unexpected error persisting usage record", {
      promptId: record.promptId,
      phase: record.phase,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
