// INPUT: Express 请求对象、User-Agent 与成本敏感端点路径。
// OUTPUT: API noindex header 中间件、AI/crawler UA 分类与 bot-aware 成本端点限流器。
// POS: 安全中间件；若更新此文件，务必更新 middleware/FOLDER.md 与相关测试。

import type { Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const API_ROBOTS_TAG = "noindex, nofollow, noarchive";

const BOT_UA_PATTERNS: ReadonlyArray<RegExp> = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /headless/i,
  /python-requests/i,
  /curl/i,
  /wget/i,
  /httpclient/i,
  /okhttp/i,
  /go-http-client/i,
  /axios/i,
  /postmanruntime/i,
  /insomnia/i,
  /claudebot/i,
  /claude-web/i,
  /anthropic/i,
  /chatgpt/i,
  /gptbot/i,
  /openai/i,
  /perplexity/i,
  /bytespider/i,
  /ccbot/i,
  /google-extended/i,
  /googleother/i,
  /bingbot/i,
  /duckduckbot/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /slackbot/i,
  /discordbot/i,
  /twitterbot/i,
  /linkedinbot/i,
];

export function isCrawlerLikeUserAgent(userAgent: unknown): boolean {
  if (typeof userAgent !== "string" || userAgent.trim() === "") {
    return true;
  }
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export const apiNoIndexMiddleware: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Robots-Tag", API_ROBOTS_TAG);
  next();
};

export const costEndpointBotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => !isCrawlerLikeUserAgent(req.headers["user-agent"]),
  message: {
    error: "Too many automated requests to a cost-sensitive endpoint.",
    code: "cost_endpoint_bot_rate_limited",
  },
});

export const COST_SENSITIVE_API_MOUNTS: ReadonlyArray<string> = [
  "/api/ask",
  "/api/detail",
  "/api/daily",
  "/api/cbt",
  "/api/synastry",
  "/api/synthetica",
  "/api/reports/generate",
  "/api/natal",
  "/api/cycle/naming",
  "/api/transit/narrative",
  "/api/wiki/home",
];

export const __test__ = {
  API_ROBOTS_TAG,
  BOT_UA_PATTERNS,
};
