// INPUT: security middleware exports plus a small Express app.
// OUTPUT: Tests for API noindex, crawler-like UA classification, bot-aware cost limiter, and robots policy.
// POS: Security middleware regression tests; update middleware/FOLDER.md when coverage changes.

import fs from "fs";
import path from "path";
import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import {
  apiNoIndexMiddleware,
  costEndpointBotLimiter,
  isCrawlerLikeUserAgent,
} from "../security.js";

describe("security middleware", () => {
  it("marks API responses as non-indexable without affecting public pages", async () => {
    const app = express();
    app.use("/api", apiNoIndexMiddleware);
    app.get("/api/config", (_req, res) => res.json({ ok: true }));
    app.get("/wiki", (_req, res) => res.type("html").send("<h1>Wiki</h1>"));

    const api = await request(app).get("/api/config");
    expect(api.status).toBe(200);
    expect(api.headers["x-robots-tag"]).toBe(
      "noindex, nofollow, noarchive",
    );

    const publicPage = await request(app).get("/wiki");
    expect(publicPage.status).toBe(200);
    expect(publicPage.headers["x-robots-tag"]).toBeUndefined();
  });

  it("classifies common AI agents, crawlers, and missing user-agents as crawler-like", () => {
    expect(isCrawlerLikeUserAgent("GPTBot/1.0")).toBe(true);
    expect(isCrawlerLikeUserAgent("ClaudeBot/1.0")).toBe(true);
    expect(isCrawlerLikeUserAgent("python-requests/2.31")).toBe(true);
    expect(isCrawlerLikeUserAgent("")).toBe(true);
    expect(
      isCrawlerLikeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      ),
    ).toBe(false);
  });

  it("rate-limits crawler-like traffic on cost-sensitive endpoints", async () => {
    const app = express();
    app.set("trust proxy", 1);
    app.use("/api/detail", costEndpointBotLimiter);
    app.get("/api/detail", (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .get("/api/detail")
        .set("User-Agent", "GPTBot/1.0")
        .set("X-Forwarded-For", "203.0.113.10");
      expect(res.status).toBe(200);
    }

    const limited = await request(app)
      .get("/api/detail")
      .set("User-Agent", "GPTBot/1.0")
      .set("X-Forwarded-For", "203.0.113.10");
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe("cost_endpoint_bot_rate_limited");

    const browser = await request(app)
      .get("/api/detail")
      .set(
        "User-Agent",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      )
      .set("X-Forwarded-For", "203.0.113.10");
    expect(browser.status).toBe(200);
  });
});

describe("robots policy", () => {
  it("keeps public SEO surfaces open while disallowing API and private surfaces", () => {
    const repoRoot = process.cwd().endsWith(`${path.sep}backend`)
      ? path.resolve(process.cwd(), "..")
      : process.cwd();
    const robots = fs.readFileSync(
      path.resolve(repoRoot, "public", "robots.txt"),
      "utf8",
    );

    expect(robots).toContain("Allow: /wiki");
    expect(robots).toContain("Allow: /privacy");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Disallow: /reports");
    expect(robots).toContain("Disallow: /payment");
    expect(robots).toContain("Disallow: /go/");
  });
});
