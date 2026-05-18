// INPUT: Newsletter subscription API route.
// OUTPUT: 导出 newsletter 路由（含蜜罐反爬、IP 限流、Supabase 持久化、8s upstream timeout）。
// POS: 落地页 v2 邮件订阅端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";

export const newsletterRouter = Router();

// Hard upstream timeout for the Supabase insert. Without this, a hung PostgREST
// response would keep the Express handler open until Vercel's 300s function
// limit, exhausting concurrent invocations. 8s is generous for a single-row
// insert and matches what we use elsewhere for transactional upstreams.
const UPSTREAM_TIMEOUT_MS = 8000;

class UpstreamTimeoutError extends Error {
  constructor() {
    super("Upstream timeout");
    this.name = "UpstreamTimeoutError";
  }
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new UpstreamTimeoutError()), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Per-IP rate limit: 5 requests / hour. Stricter than the global /api limiter
// because this endpoint is unauthenticated and a prime target for scraping
// or list-poisoning bots that bypass the honeypot.
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many subscription attempts, please try again later.",
    code: "rate_limited",
  },
});

// Conservative email regex: requires local@domain.tld with at least one dot
// in the domain. Intentionally not RFC 5322 strict — we just reject obvious
// garbage on the API edge; deliverability is a separate concern (handled
// later when confirmation emails are wired up).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254; // RFC 5321 SMTP path limit

interface NewsletterRequestBody {
  email?: unknown;
  website?: unknown; // honeypot — must be empty/absent for real submissions
}

interface NewsletterSuccessResponse {
  success: true;
  already_subscribed?: boolean;
}

interface NewsletterErrorResponse {
  error: string;
  code: string;
}

newsletterRouter.post(
  "/",
  newsletterLimiter,
  async (
    req: Request<unknown, unknown, NewsletterRequestBody>,
    res: Response<NewsletterSuccessResponse | NewsletterErrorResponse>,
  ) => {
    const { email, website } = req.body ?? {};

    // Honeypot: real users never see/fill this field. Bots that auto-fill
    // every input will populate it. Silently return success so they don't
    // learn the trap exists — but skip the DB write entirely.
    if (typeof website === "string" && website.trim() !== "") {
      return res.status(200).json({ success: true });
    }

    // Basic validation
    if (typeof email !== "string") {
      return res.status(400).json({
        error: "Email is required.",
        code: "email_required",
      });
    }

    const normalized = email.trim().toLowerCase();

    if (normalized === "") {
      return res.status(400).json({
        error: "Email is required.",
        code: "email_required",
      });
    }

    if (normalized.length > EMAIL_MAX_LENGTH) {
      return res.status(400).json({
        error: "Email is too long.",
        code: "email_too_long",
      });
    }

    if (!EMAIL_REGEX.test(normalized)) {
      return res.status(400).json({
        error: "Please provide a valid email address.",
        code: "email_invalid",
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        error: "Subscription service is temporarily unavailable.",
        code: "service_unavailable",
      });
    }

    try {
      const { error } = await withTimeout(
        supabase.from("newsletter_subscribers").insert({
          email: normalized,
          source: "landing_v2",
        }),
        UPSTREAM_TIMEOUT_MS,
      );

      if (error) {
        // Postgres unique_violation (case-insensitive index on email).
        // Treat as a soft success — design spec calls for differentiated
        // copy on the client, not a 4xx.
        if (error.code === "23505") {
          return res.status(200).json({
            success: true,
            already_subscribed: true,
          });
        }

        console.error("Newsletter subscription DB error:", error);
        return res.status(500).json({
          error: "Failed to save subscription. Please try again.",
          code: "db_error",
        });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      // Upstream (Supabase / PostgREST) did not respond within budget.
      // Return 502 so the client knows the failure is upstream, not its bug,
      // and so we don't poison synthetic 5xx alerts for our own code.
      if (err instanceof UpstreamTimeoutError) {
        console.error(
          "Newsletter subscription upstream timeout after",
          UPSTREAM_TIMEOUT_MS,
          "ms",
        );
        return res.status(502).json({
          error: "Email service temporarily unavailable",
          code: "EMAIL_SERVICE_TIMEOUT",
        });
      }

      console.error("Newsletter subscription unexpected error:", err);
      return res.status(500).json({
        error: "Unexpected server error.",
        code: "internal_error",
      });
    }
  },
);
