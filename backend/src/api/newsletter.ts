// INPUT: express + rate-limit, node:crypto (token), Supabase, logger, isResendConfigured, emailService。
// OUTPUT: newsletter 路由 — POST /（蜜罐+限流+持久化）+ 双 opt-in（NEWSLETTER_CONFIRM_ENABLED）+ GET /confirm/:token、/unsubscribe/:token（幂等、渲染本地化 HTML、List-Unsubscribe 头）。
// POS: 落地页 v2 邮件订阅端点（#23 升级为可确认/可退订列表）。双 opt-in 默认关，待 Resend DKIM 验证后由 ops 开。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { logger } from "../utils/logger.js";
import { isResendConfigured } from "../config/auth.js";
import { emailService } from "../services/emailService.js";

export const newsletterRouter = Router();

// Double opt-in is OFF by default so this ships dark: until ops verifies the
// Resend sending domain (SPF/DKIM) and sets NEWSLETTER_CONFIRM_ENABLED=true,
// the POST keeps today's single-opt-in behavior (insert as confirmed, no mail).
// Sending confirmation mail from an unverified domain would land in spam and
// hurt sender reputation — hence the explicit gate.
const NEWSLETTER_CONFIRM_ENABLED =
  (process.env.NEWSLETTER_CONFIRM_ENABLED || "").toLowerCase() === "true";
const PUBLIC_BASE_URL = (
  process.env.PUBLIC_SITE_URL || "https://www.astrologywiki.com"
).replace(/\/$/, "");
const randomToken = (): string => randomBytes(32).toString("hex");

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
// NOTE: This Map lives in process memory. On Vercel serverless, each cold
// start drops the blocklist. In practice that means honeypot trips block a
// bot for "until next cold start" (seconds to minutes), not the documented
// HONEYPOT_BLOCK_MS. This is intentionally best-effort defense — the primary
// control is express-rate-limit (5/h/IP). For a horizontally-scaled durable
// blocklist, swap this Map for cacheService.set(`newsletter:blocked:${ip}`,
// 1, HONEYPOT_BLOCK_MS / 1000) which would use Redis.
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
      const confirmToken = NEWSLETTER_CONFIRM_ENABLED ? randomToken() : null;
      const nowIso = new Date().toISOString();
      const { error } = await withTimeout(
        supabase.from("newsletter_subscribers").insert({
          email: normalized,
          source: "landing_v2",
          status: NEWSLETTER_CONFIRM_ENABLED ? "pending" : "confirmed",
          confirm_token: confirmToken,
          confirmed_at: NEWSLETTER_CONFIRM_ENABLED ? null : nowIso,
        }),
        UPSTREAM_TIMEOUT_MS,
      );

      if (error) {
        // Postgres unique_violation (case-insensitive index on email).
        // Treat as a soft success — design spec calls for differentiated
        // copy on the client, not a 4xx.
        if (error.code === "23505") {
          // Existing email. With double opt-in on, a row stuck in 'pending'
          // may belong to someone whose first confirmation never arrived —
          // give them a fresh token + email so they aren't permanently stuck.
          // Confirmed/unsubscribed rows are left untouched (we never auto-
          // reactivate an unsubscribe).
          if (NEWSLETTER_CONFIRM_ENABLED) {
            const retryToken = randomToken();
            const { data: reset } = await withTimeout(
              supabase
                .from("newsletter_subscribers")
                .update({ confirm_token: retryToken, confirmed_at: null })
                .eq("email", normalized)
                .eq("status", "pending")
                .select("id"),
              UPSTREAM_TIMEOUT_MS,
            );
            if (reset && reset.length > 0 && isResendConfigured()) {
              try {
                await emailService.sendNewsletterConfirmation(
                  normalized,
                  `${PUBLIC_BASE_URL}/api/newsletter/confirm/${retryToken}`,
                  `${PUBLIC_BASE_URL}/api/newsletter/unsubscribe/${retryToken}`,
                );
              } catch {
                logger.error("Newsletter confirmation resend failed");
              }
            }
          }
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
        logger.error(`Newsletter subscription DB error code=${safeCode}`);
        return res.status(500).json({
          error: "Failed to save subscription. Please try again.",
          code: "db_error",
        });
      }

      // Double opt-in: send the confirmation mail best-effort. A send failure
      // must not fail the subscription (the row is already pending; the user
      // can re-trigger). Skipped entirely when Resend isn't configured.
      if (NEWSLETTER_CONFIRM_ENABLED && confirmToken && isResendConfigured()) {
        try {
          await emailService.sendNewsletterConfirmation(
            normalized,
            `${PUBLIC_BASE_URL}/api/newsletter/confirm/${confirmToken}`,
            `${PUBLIC_BASE_URL}/api/newsletter/unsubscribe/${confirmToken}`,
          );
        } catch {
          // Never log the email; the row stays pending and is re-triggerable.
          logger.error("Newsletter confirmation email send failed");
        }
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      // Upstream (Supabase / PostgREST) did not respond within budget.
      // Return 502 so the client knows the failure is upstream, not its bug,
      // and so we don't poison synthetic 5xx alerts for our own code.
      if (err instanceof UpstreamTimeoutError) {
        logger.error("Newsletter subscription upstream timeout", {
          timeoutMs: UPSTREAM_TIMEOUT_MS,
        });
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
      logger.error(`Newsletter subscription unexpected error: ${safeErr}`);
      return res.status(500).json({
        error: "Unexpected server error.",
        code: "internal_error",
      });
    }
  },
);

// Confirmation tokens are 32 random bytes → 64 hex chars. Validate the shape on
// the edge before any DB lookup.
const TOKEN_RE = /^[0-9a-f]{64}$/i;

// Static, trusted copy for the confirm/unsubscribe landing pages (no user input
// reaches the markup; lang is whitelisted to en/zh).
const RESULT_COPY = {
  confirmed: {
    en: [
      "You're subscribed",
      "Thanks for confirming — you'll start receiving AstrologyWiki updates.",
    ],
    zh: ["订阅已确认", "感谢确认——你将开始收到 AstrologyWiki 的更新。"],
  },
  unsubscribed: {
    en: [
      "You're unsubscribed",
      "You won't receive any more newsletter emails. You can resubscribe anytime.",
    ],
    zh: ["已退订", "你将不再收到订阅邮件，随时可以重新订阅。"],
  },
  invalid: {
    en: ["Link not valid", "This link is invalid or has expired."],
    zh: ["链接无效", "该链接无效或已过期。"],
  },
} as const;

type ResultKind = keyof typeof RESULT_COPY;

// Escape for an HTML attribute context. PUBLIC_BASE_URL is trusted infra config,
// but escaping it keeps the rendered page injection-proof even if the env var is
// ever set to something with a quote (defense in depth — mirrors emailService).
const escAttr = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderResultPage = (lang: "en" | "zh", kind: ResultKind): string => {
  const [heading, body] = RESULT_COPY[kind][lang];
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>AstrologyWiki</title></head>
<body style="margin:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e0e0f0;">
<div style="max-width:480px;margin:0 auto;padding:64px 24px;text-align:center;">
<h1 style="color:#d4af37;font-size:22px;margin:0 0 12px;">AstrologyWiki</h1>
<p style="font-size:18px;font-weight:600;margin:0 0 8px;">${heading}</p>
<p style="color:#a0a0b8;font-size:14px;margin:0 0 28px;">${body}</p>
<a href="${escAttr(PUBLIC_BASE_URL)}/${lang}/" style="display:inline-block;background:#d4af37;color:#0f0f1a;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Open AstrologyWiki</a>
</div></body></html>`;
};

const langOf = (req: Request): "en" | "zh" =>
  req.query.lang === "zh" ? "zh" : "en";

// State-mutating GET links (clicked from email) must never be cached or
// prefetched by mail clients / proxies — no-store keeps a link preview from
// silently confirming or unsubscribing someone.
const sendResultPage = (
  res: Response,
  lang: "en" | "zh",
  kind: ResultKind,
  status: number,
) =>
  res
    .status(status)
    .set("Cache-Control", "no-store, max-age=0")
    .set("Pragma", "no-cache")
    .type("html")
    .send(renderResultPage(lang, kind));

// Flip any row bearing this token to unsubscribed. Idempotent; returns whether
// a row matched. Shared by the human GET link and the RFC 8058 one-click POST.
const unsubscribeByToken = async (token: string): Promise<boolean> => {
  const { data, error } = await withTimeout(
    supabase
      .from("newsletter_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("confirm_token", token)
      .select("id"),
    UPSTREAM_TIMEOUT_MS,
  );
  if (error) throw error;
  return !!data && data.length > 0;
};

// GET /confirm/:token — flip a pending/confirmed row to confirmed (idempotent).
// No auth; the token is the bearer secret. No email ever enters logs.
newsletterRouter.get("/confirm/:token", async (req: Request, res: Response) => {
  const lang = langOf(req);
  const { token } = req.params;
  if (!TOKEN_RE.test(token) || !isSupabaseConfigured())
    return sendResultPage(res, lang, "invalid", 404);
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("newsletter_subscribers")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("confirm_token", token)
        .neq("status", "unsubscribed")
        .select("id"),
      UPSTREAM_TIMEOUT_MS,
    );
    if (error || !data || data.length === 0)
      return sendResultPage(res, lang, "invalid", 404);
    return sendResultPage(res, lang, "confirmed", 200);
  } catch {
    logger.error("Newsletter confirm failed");
    return sendResultPage(res, lang, "invalid", 404);
  }
});

// GET /unsubscribe/:token — human click from the email body → HTML page.
newsletterRouter.get(
  "/unsubscribe/:token",
  async (req: Request, res: Response) => {
    const lang = langOf(req);
    const { token } = req.params;
    if (!TOKEN_RE.test(token) || !isSupabaseConfigured())
      return sendResultPage(res, lang, "invalid", 404);
    try {
      const matched = await unsubscribeByToken(token);
      return sendResultPage(
        res,
        lang,
        matched ? "unsubscribed" : "invalid",
        matched ? 200 : 404,
      );
    } catch {
      logger.error("Newsletter unsubscribe failed");
      return sendResultPage(res, lang, "invalid", 404);
    }
  },
);

// POST /unsubscribe/:token — RFC 8058 one-click (the List-Unsubscribe-Post
// header). Mail clients POST here; respond with a bare 2xx, no HTML.
newsletterRouter.post(
  "/unsubscribe/:token",
  async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!TOKEN_RE.test(token) || !isSupabaseConfigured())
      return res
        .status(404)
        .json({ error: "Invalid token", code: "invalid_token" });
    try {
      const matched = await unsubscribeByToken(token);
      return res.status(matched ? 200 : 404).json({ success: matched });
    } catch {
      logger.error("Newsletter unsubscribe failed");
      return res
        .status(500)
        .json({ error: "Unsubscribe failed", code: "db_error" });
    }
  },
);
