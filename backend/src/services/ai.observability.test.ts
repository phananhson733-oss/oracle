import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalDeepSeekApiKey = process.env.DEEPSEEK_API_KEY;

const cache = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("../cache/redis.js", () => ({
  cacheService: cache,
}));

vi.mock("../utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { generateAIContentWithMeta } = await import("./ai.js");
const { logger } = await import("../utils/logger.js");

describe("DeepSeek provider observability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue(undefined);
    process.env.DEEPSEEK_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalDeepSeekApiKey === undefined) {
      delete process.env.DEEPSEEK_API_KEY;
    } else {
      process.env.DEEPSEEK_API_KEY = originalDeepSeekApiKey;
    }
  });

  it("logs model, duration, and token usage without prompt content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"lang":"en","content":{"summary":"ok"}}',
                },
              },
            ],
            usage: {
              prompt_tokens: 120,
              completion_tokens: 45,
              total_tokens: 165,
              prompt_cache_hit_tokens: 80,
              prompt_cache_miss_tokens: 40,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await generateAIContentWithMeta({
      promptId: "synthetica-analysis",
      context: { privateInput: "must not be logged" },
      lang: "en",
      requestId: "request-123",
    });

    expect(logger.info).toHaveBeenCalledWith(
      "[AI] provider request completed",
      expect.objectContaining({
        event: "ai_provider_request_completed",
        requestId: "request-123",
        promptId: "synthetica-analysis",
        provider: "deepseek",
        model: "deepseek-chat",
        durationMs: expect.any(Number),
        usage: {
          promptTokens: 120,
          completionTokens: 45,
          totalTokens: 165,
          promptCacheHitTokens: 80,
          promptCacheMissTokens: 40,
        },
      }),
    );
    expect(JSON.stringify(vi.mocked(logger.info).mock.calls)).not.toContain(
      "must not be logged",
    );
  });
});
