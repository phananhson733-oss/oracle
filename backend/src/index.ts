// INPUT: Express 服务器配置（含环境变量加载与统一响应中间件）。
// OUTPUT: 启动 HTTP 服务（含百科与支付等 API 路由）。
// POS: 后端入口文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
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
import { saturnReturnRouter } from "./api/saturn-return.js";
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
import { newsletterRouter } from "./api/newsletter.js";
import { apiResponseMiddleware } from "./utils/apiResponse.js";

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", ".env.local"),
];

envPaths.forEach((envPath) => {
  dotenv.config({ path: envPath });
});

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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, health checks)
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin,
      );
      if (allowed) return callback(null, true);
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

app.use(express.json());
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
app.use("/api/saturn-return", saturnReturnRouter);
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

console.log(`💳 Payment provider: ${PAYMENT_PROVIDER}`);

app.use("/api/entitlements", entitlementsRouter);
app.use("/api/entitlements", entitlementsV2Router); // V2 路由挂载在 /v2 子路径
app.use("/api/reports", reportsRouter);
app.use("/api/gm", gmRouter); // GM 测试命令
app.use("/api/newsletter", newsletterRouter);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
