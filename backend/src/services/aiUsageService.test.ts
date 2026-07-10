// INPUT: aiUsageService module + mocked Supabase client/logger.
// OUTPUT: vitest coverage for DeepSeek usage extraction and fire-and-forget persistence.
// POS: AI token usage logging regression tests; update services/FOLDER.md when changing coverage.

import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, any>;

const inserts: Array<{ table: string; row: Row }> = [];
let insertError: unknown = null;
let insertThrows = false;
let configured = true;

vi.mock("../db/supabase.js", () => ({
  supabase: {
    from: (table: string) => ({
      insert: (row: Row) => {
        if (insertThrows) throw new Error("sync boom");
        inserts.push({ table, row });
        return Promise.resolve({ data: row, error: insertError });
      },
    }),
  },
  isSupabaseConfigured: () => configured,
}));

vi.mock("../utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { extractDeepSeekUsage, recordAiUsage, createAiCallTracker } =
  await import("./aiUsageService.js");

beforeEach(() => {
  inserts.length = 0;
  insertError = null;
  insertThrows = false;
  configured = true;
});

describe("extractDeepSeekUsage", () => {
  it("parses a DeepSeek usage payload", () => {
    const usage = extractDeepSeekUsage({
      usage: {
        prompt_tokens: 120,
        completion_tokens: 800,
        total_tokens: 920,
        prompt_cache_hit_tokens: 64,
        prompt_cache_miss_tokens: 56,
        completion_tokens_details: { reasoning_tokens: 300 },
      },
    });
    expect(usage).toEqual({
      promptTokens: 120,
      completionTokens: 800,
      totalTokens: 920,
      cacheHitTokens: 64,
      cacheMissTokens: 56,
      reasoningTokens: 300,
    });
  });

  it("returns null when usage is absent or malformed", () => {
    expect(extractDeepSeekUsage(null)).toBeNull();
    expect(extractDeepSeekUsage({})).toBeNull();
    expect(extractDeepSeekUsage({ usage: "nope" })).toBeNull();
    expect(extractDeepSeekUsage({ usage: { prompt_tokens: "x" } })).toBeNull();
  });

  it("fills missing optional counters with null", () => {
    const usage = extractDeepSeekUsage({
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });
    expect(usage).toEqual({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      cacheHitTokens: null,
      cacheMissTokens: null,
      reasoningTokens: null,
    });
  });
});

describe("recordAiUsage", () => {
  it("inserts a snake_case row into ai_usage_log", async () => {
    await recordAiUsage({
      promptId: "daily-forecast",
      phase: "generate",
      model: "deepseek-chat",
      status: "success",
      durationMs: 1234,
      lang: "en",
      requestId: "req_1",
      usage: {
        promptTokens: 120,
        completionTokens: 800,
        totalTokens: 920,
        cacheHitTokens: 64,
        cacheMissTokens: 56,
        reasoningTokens: null,
      },
    });

    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe("ai_usage_log");
    expect(inserts[0].row).toEqual({
      prompt_id: "daily-forecast",
      phase: "generate",
      model: "deepseek-chat",
      status: "success",
      duration_ms: 1234,
      lang: "en",
      request_id: "req_1",
      prompt_tokens: 120,
      completion_tokens: 800,
      total_tokens: 920,
      cache_hit_tokens: 64,
      cache_miss_tokens: 56,
      reasoning_tokens: null,
      error_code: null,
    });
  });

  it("records error calls without usage", async () => {
    await recordAiUsage({
      promptId: "ask-answer",
      phase: "generate",
      model: "deepseek-reasoner",
      status: "error",
      durationMs: 30000,
      errorCode: "timeout",
    });

    expect(inserts).toHaveLength(1);
    expect(inserts[0].row).toMatchObject({
      prompt_id: "ask-answer",
      status: "error",
      error_code: "timeout",
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
    });
  });

  it("skips silently when Supabase is not configured", async () => {
    configured = false;
    await recordAiUsage({
      promptId: "daily-forecast",
      phase: "generate",
      model: "deepseek-chat",
      status: "success",
      durationMs: 100,
    });
    expect(inserts).toHaveLength(0);
  });

  it("tracker records success once and ignores later failure", async () => {
    const track = createAiCallTracker({
      promptId: "natal-overview",
      phase: "reformat",
      model: "deepseek-chat",
      lang: "en",
    });
    track.success({
      usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
    });
    track.failure("exception");
    await new Promise((resolve) => setImmediate(resolve));

    expect(inserts).toHaveLength(1);
    expect(inserts[0].row).toMatchObject({
      prompt_id: "natal-overview",
      phase: "reformat",
      status: "success",
      total_tokens: 3,
    });
    expect(typeof inserts[0].row.duration_ms).toBe("number");
  });

  it("tracker records failure with error code when no success happened", async () => {
    const track = createAiCallTracker({
      promptId: "ask-answer",
      phase: "generate",
      model: "deepseek-reasoner",
    });
    track.failure("http_429");
    track.failure("exception");
    await new Promise((resolve) => setImmediate(resolve));

    expect(inserts).toHaveLength(1);
    expect(inserts[0].row).toMatchObject({
      status: "error",
      error_code: "http_429",
      total_tokens: null,
    });
  });

  it("never throws when the insert fails", async () => {
    insertError = { message: "db down" };
    await expect(
      recordAiUsage({
        promptId: "daily-forecast",
        phase: "generate",
        model: "deepseek-chat",
        status: "success",
        durationMs: 100,
      }),
    ).resolves.toBeUndefined();

    insertThrows = true;
    await expect(
      recordAiUsage({
        promptId: "daily-forecast",
        phase: "generate",
        model: "deepseek-chat",
        status: "success",
        durationMs: 100,
      }),
    ).resolves.toBeUndefined();
  });
});
