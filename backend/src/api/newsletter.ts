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

// Sticky IP blocklist for honeypot trips. The existing limiter caps total
// requests at 5/hour, but a bot that hits the honeypot still has 4 free
// retries to vary the email and slip through. Once an IP is recorded as
// having tripped the honeypot, every subsequent request from that IP for
// HONEYPOT_BLOCK_MS is silently dropped (still 200 success, just like the
// honeypot itself, so bots get no signal that the IP is burned).
// Per-process Map — horizontal scale would need Redis; acceptable trade
// because the limiter already caps damage and the blocklist is a defense-
// in-depth layer, not the primary control.
const HONEYPOT_BLOCK_MS = 60 * 60 * 1000; // 1 hour
const honeypotBlockedIps = new Map<string, number>(); // ip → expiry ms

const isIpBlocked = (ip: string): boolean => {
  const expiry = honeypotBlockedIps.get(ip);
  if (!expiry) return false;
  if (Date.now() >= expiry) {
    honeypotBlockedIps.delete(ip);
    return false;
  }
  return true;
};

const blockIp = (ip: string): void => {
  honeypotBlockedIps.set(ip, Date.now() + HONEYPOT_BLOCK_MS);
};

// Exported for tests so the suite can reset state between specs without
// reaching into module internals via vi.resetModules() each time.
export const __honeypotTest__ = {
  clear: () => honeypotBlockedIps.clear(),
  size: () => honeypotBlockedIps.size,
};

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
    // req.ip resolves correctly because index.ts sets `trust proxy: 1` for
    // Vercel's single proxy hop; falls back to an empty string only when no
    // proxy header is present (curl from localhost in dev).
    const clientIp = (req.ip || req.socket?.remoteAddress || "").toString();

    // If this IP previously tripped the honeypot, every follow-up request
    // within the blocklist TTL gets the same silent 200 (no signal to the
    // bot that the IP is burned). Limiter alone allows 5 retries per hour
    // post-trip; with the blocklist, the trip cost is 1 attempt.
    if (clientIp && isIpBlocked(clientIp)) {
      return res.status(200).json({ success: true });
    }

    // Honeypot: real users never see/fill this field. Bots that auto-fill
    // every input will populate it. Silently return success so they don't
    // learn the trap exists — but skip the DB write entirely AND blocklist
    // the IP for HONEYPOT_BLOCK_MS so the bot can't retry under a different
    // email/payload.
    if (typeof website === "string" && website.trim() !== "") {
      if (clientIp) blockIp(clientIp);
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

        // Sanitize: never log the raw Supabase error object — it embeds the
        // attempted email + Postgres message which may include the column
        // value (隐私红线 #3). Log only the stable error.code (e.g. "23505",
        // "23P01") so ops can still diagnose without writing PII to logs.
        const safeCode =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: unknown }).code ?? "unknown")
            : "unknown";
        console.error(`Newsletter subscription DB error code=${safeCode}`);
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

      // Sanitize: the Supabase JS client can throw rather than return { error },
      // and the thrown Error may serialize the attempted email into .message /
      // .stack (隐私红线 #3). Log only err.name + a truncated message,
      // never the raw object.
      const safeErr =
        err instanceof Error
          ? `${err.name}: ${err.message.slice(0, 80)}`
          : typeof err;
      console.error(`Newsletter subscription unexpected error: ${safeErr}`);
      return res.status(500).json({
        error: "Unexpected server error.",
        code: "internal_error",
      });
    }
  },
);
