// INPUT: Express 服务器配置（含环境变量加载与统一响应中间件）。
// OUTPUT: 启动 HTTP 服务（含百科与支付等 API 路由）。
// POS: 后端入口文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import path from "path";
import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import { natalRouter } from "./api/natal.js";
import { dailyRouter } from "./api/daily.js";
import { askRouter } from "./api/ask.js";
import { synastryRouter } from "./api/synastry.js";
import { cycleRouter } from "./api/cycle.js";
import { cbtRouter } from "./api/cbt.js";
import { geoRouter } from "./api/geo.js";
import { detailRouter } from "./api/detail.js";
import { wikiRouter } from "./api/wiki.js";
import { syntheticaRouter } from "./api/synthetica.js";
import { astroRouter } from "./api/astro.js";
import { solarReturnRouter } from "./api/solar-return.js";
import { astrocartographyRouter } from "./api/astrocartography.js";
import { saturnReturnRouter } from "./api/saturn-return.js";
import { transitRouter } from "./api/timeline.js";
import { userRouter } from "./api/user.js";
import authRouter from "./api/auth.js";
import paymentRouter from "./api/payment.js";
import paymentV2Router from "./api/paymentV2.js";
import paypalRouter from "./api/paypal.js";
import airwallexRouter from "./api/airwallex.js";
import entitlementsRouter from "./api/entitlements.js";
import entitlementsV2Router from "./api/entitlementsV2.js";
import reportsRouter from "./api/reports.js";
import gmRouter from "./api/gm.js";
import cronRouter from "./api/cron.js";
import { newsletterRouter } from "./api/newsletter.js";
import { savedReadingsRouter } from "./api/savedReadings.js";
import { apiResponseMiddleware } from "./utils/apiResponse.js";

import { initMonitoring, captureError } from "./observability/monitoring.js";

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", ".env.local"),
];

envPaths.forEach((envPath) => {
  dotenv.config({ path: envPath });
});

// Initialize error monitoring (no-op unless SENTRY_DSN is set; must run after dotenv.config).
await initMonitoring();

// Payment provider switch (default: airwallex) — must be after dotenv.config
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "airwallex";
const isProviderEnabled = (provider: string) =>
  PAYMENT_PROVIDER === "all" || PAYMENT_PROVIDER === provider;

const app = express();
// Trust the first proxy hop (Vercel) so req.ip resolves to the real client IP instead of the proxy. Required for express-rate-limit per-IP buckets to work correctly.
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// Security headers (CSP off for SPA with external resources)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS whitelist
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://www.astrologywiki.com",
  "https://astrologywiki.com",
];
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push(/^http:\/\/localhost(:\d+)?$/);
}

// Vercel preview deployments are same-origin (frontend + backend share the
// `oracle-<hash>.vercel.app` hostname per vercel.json `rewrites`), so they
// don't need to appear in this allowlist. If you see a CORS rejection log
// for a `*-xdawayer.vercel.app` origin, the *frontend* is calling an
// absolute API URL (VITE_API_BASE_URL misconfig — see services/apiClient.ts
// warning at module load); the fix is to unset that env var, not to widen
// this allowlist (widening would let any Vercel-hosted site call this API).
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, health checks)
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin,
      );
      if (allowed) return callback(null, true);
      // Log rejected origins to aid diagnosis of misconfigured deploys (#39).
      // Origin is the browser-sent value, not user-controlled content, so it's
      // safe to log; but cap length defensively in case a malicious client
      // sends a giant header.
      const safeOrigin =
        typeof origin === "string" ? origin.slice(0, 200) : String(origin);
      logger.warn("CORS rejected origin", { origin: safeOrigin });
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Rate limiting — auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/auth", authLimiter);

// Rate limiting — natal endpoints. Tighter than the global /api bucket because
// each natal request is a publicly reachable anonymous-friendly entrypoint
// that triggers external geocoding + Swiss Ephemeris work (and AI calls on
// /overview /core-themes /dimension). 30/min/IP keeps a single client from
// running up upstream cost while leaving room for ~6 attempts during a normal
// landing-page form session (typical: 1-2 retries on bad city).
const natalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many natal chart requests, please try again later.",
    code: "natal_rate_limited",
  },
});
app.use("/api/natal", natalLimiter);

// Body size cap for natal POSTs. Birth payloads are <500B in practice; this
// rejects malicious oversized bodies before the global parser allocates.
// Must come before the global `express.json()` below so the per-mount
// instance wins on `/api/natal/*` paths.
app.use("/api/natal", express.json({ limit: "4kb" }));

// Solar Return is birth-data (POST body, PII off the URL) + ephemeris-heavy
// (~1 natal compute + ~13 Sun samples + 1 chart per request), so it gets its
// own tighter limiter + a 4kb body cap, mirroring /api/natal.
const solarReturnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many solar return requests, please try again later.",
    code: "solar_return_rate_limited",
  },
});
app.use("/api/solar-return", solarReturnLimiter);
app.use("/api/solar-return", express.json({ limit: "4kb" }));

const astrocartographyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many astrocartography requests, please try again later.",
    code: "astrocartography_rate_limited",
  },
});
app.use("/api/astrocartography", astrocartographyLimiter);
app.use("/api/astrocartography", express.json({ limit: "4kb" }));

// Rate limiting — /api/detail. Anonymous POST endpoint that feeds arbitrary
// chartData into generateAIContent; mutating cosmetic fields can bypass the
// AI cache. 20/min/IP is tighter than the global 100/min bucket because each
// request costs an LLM token bill and detail UI flows show 3-6 cards in a
// session (well under 20). See backend/src/api/detail.ts for the full threat
// model and the schema + canonicalization layered defenses.
const detailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many detail requests, please try again later.",
    code: "detail_rate_limited",
  },
});
app.use("/api/detail", detailLimiter);

// Body size cap for /api/detail. Legitimate chartData is ~1-2kb; 4kb leaves
// headroom for client-side structural variance. Must come before the global
// `express.json()` below so the per-mount instance wins on `/api/detail/*`.
app.use("/api/detail", express.json({ limit: "4kb" }));

// Rate limiting — /api/cycle/naming. Anonymous GET endpoint that feeds
// planet/cycleType/dates directly into generateAIContent. 30/min/IP keeps
// distributed abuse from burning AI budget while leaving plenty of room for
// a normal session (typical: 3-10 naming requests after viewing /cycle/list).
const cycleNamingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many cycle naming requests, please try again later.",
    code: "cycle_naming_rate_limited",
  },
});
app.use("/api/cycle/naming", cycleNamingLimiter);

// Rate limiting — /api/transit/timeline. Anonymous-friendly compute endpoint
// where a single request fans out to ~6 Swiss Ephemeris longitude passes PER DAY
// (up to 92 days), i.e. 30-100x the work of one natal request. 10/min/IP is
// tighter than natal (30/min) and the global bucket (100/min) to cap that
// amplification; a normal session loads 1-2 months (well under 10). Design B2/F-E6.
const transitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many timeline requests, please try again later.",
    code: "transit_rate_limited",
  },
});
app.use("/api/transit", transitLimiter);

// Body size cap for /api/transit POSTs. Birth + range payloads are <1kb; 4kb
// leaves headroom. Must come before the global `express.json()` so the per-mount
// instance wins on `/api/transit/*` paths.
app.use("/api/transit", express.json({ limit: "4kb" }));

// Rate limiting — general API (broader)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// Raw body parsers for payment webhooks (must be before express.json())
if (isProviderEnabled("stripe")) {
  app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
  app.use("/api/payment/v2/webhook", express.raw({ type: "application/json" }));
}
if (isProviderEnabled("paypal")) {
  app.use("/api/paypal/webhook", express.raw({ type: "application/json" }));
}
if (isProviderEnabled("airwallex")) {
  app.use("/api/airwallex/webhook", express.raw({ type: "application/json" }));
}

// Response compression (gzip / brotli) — must be before route handlers so it
// can intercept res.write/end. Threshold avoids spending CPU on tiny payloads,
// and the custom filter skips SSE / audio / video streams where compression
// would either break streaming semantics or waste cycles on already-compressed
// bytes. compression is a no-op on 304 responses (no body), so it stays
// compatible with the ETag / If-None-Match short-circuits in API routes.
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      const ct = res.getHeader("Content-Type");
      if (
        typeof ct === "string" &&
        (ct.includes("text/event-stream") ||
          ct.includes("audio/") ||
          ct.includes("video/"))
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

app.use(express.json());

// Body-parse error normalizer. Both per-endpoint `express.json({ limit: ... })`
// instances (/api/natal, /api/detail) and the global parser above throw raw
// `PayloadTooLargeError` (413) / `SyntaxError` (400) with HTML-ish messages
// when the body is oversized or malformed. Convert to the code-only JSON
// shape so the AI cost-gate threat model (see detail.ts) stays consistent:
// attacker probes get back a stable `{ error, code }` envelope, never raw
// stack traces or payload echoes.
app.use(
  (
    err: Error & { type?: string; status?: number },
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (!err) return next();
    if (err.type === "entity.too.large") {
      res.status(413).json({
        error: "Request body exceeds size limit.",
        code: "PAYLOAD_TOO_LARGE",
      });
      return;
    }
    if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
      res.status(400).json({
        error: "Malformed JSON body.",
        code: "INVALID_JSON",
      });
      return;
    }
    next(err);
  },
);

app.use(apiResponseMiddleware);

// API Routes
app.use("/api/natal", natalRouter);
app.use("/api/daily", dailyRouter);
app.use("/api/ask", askRouter);
app.use("/api/synastry", synastryRouter);
app.use("/api/cycle", cycleRouter);
app.use("/api/cbt", cbtRouter);
app.use("/api/geo", geoRouter);
app.use("/api/detail", detailRouter);
app.use("/api/wiki", wikiRouter);
app.use("/api/synthetica", syntheticaRouter);
app.use("/api/astro", astroRouter);
app.use("/api/solar-return", solarReturnRouter);
app.use("/api/astrocartography", astrocartographyRouter);
app.use("/api/saturn-return", saturnReturnRouter);
app.use("/api/transit", transitRouter);
app.use("/api/user", userRouter);

// Auth Routes
app.use("/api/auth", authRouter);

// Payment Routes (conditional based on PAYMENT_PROVIDER)
if (isProviderEnabled("stripe")) {
  app.use("/api/payment", paymentRouter);
}
if (isProviderEnabled("paypal")) {
  app.use("/api/paypal", paypalRouter);
}
if (isProviderEnabled("airwallex")) {
  app.use("/api/airwallex", airwallexRouter);
}

// V2 payment routes (credits system — always enabled, independent of payment provider)
app.use("/api/payment", paymentV2Router);

// Config endpoint - returns active payment provider
app.get("/api/config", (_, res) =>
  res.json({ paymentProvider: PAYMENT_PROVIDER }),
);

logger.info("Payment provider configured", { provider: PAYMENT_PROVIDER });

app.use("/api/entitlements", entitlementsRouter);
app.use("/api/entitlements", entitlementsV2Router); // V2 路由挂载在 /v2 子路径
app.use("/api/reports", reportsRouter);
app.use("/api/gm", gmRouter); // GM 测试命令
app.use("/api/newsletter", newsletterRouter);
app.use("/api/saved-readings", savedReadingsRouter);
app.use("/api/cron", cronRouter); // Vercel Cron：定时对账 Airwallex 订阅

// Unhandled-error capture: report to monitoring (no-op unless active), then
// delegate to the default handler. Context is method+path only (non-PII); any
// richer event data is scrubbed in scrubEvent/captureError before egress.
app.use(
  (
    err: Error,
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    captureError(err, { method: req.method, path: req.path });
    next(err);
  },
);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  logger.info("Backend running", { port: PORT });
});
