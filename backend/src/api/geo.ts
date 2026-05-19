// INPUT: Geo API 路由（多语言城市搜索；接受 POST body 与已弃用的 GET query）。
// OUTPUT: 导出 geo 路由 — POST /search 为规范入口（city query 不进 URL/access log/referer），
//         GET /search 为弃用别名（保留一个版本周期以兼容旧 bundle，命中时进程级 warn 一次）。
// POS: Geo 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, type Response } from "express";
import { GeocodingServiceError, searchCities } from "../services/geocoding.js";
import { resolveLang } from "../utils/lang.js";

export const geoRouter = Router();

// 进程级 flag：GET 别名首次命中时打印一次 deprecation warn，避免每个请求都刷日志。
// 测试用 __resetGeoDeprecationWarning 重置此 flag（仅测试导入）。
let getDeprecationWarned = false;

export const __resetGeoDeprecationWarning = () => {
  getDeprecationWarned = false;
};

// 共享的请求处理逻辑。query / limit / lang 已由调用方从 body 或 query 解析完毕，
// 这里只负责调用 service + 统一错误处理。res 由调用方传入以便直接 send。
// 隐私要求：error.message 永不下发到 body（详见下方 catch 注释）。
async function handleCitySearch(
  query: string,
  limit: number,
  language: "zh" | "en" | undefined,
  res: Response,
) {
  try {
    const safeQuery = query.trim();
    const safeLimit = Math.min(Number.isFinite(limit) ? limit : 5, 10);

    if (!safeQuery) {
      return res.json({ cities: [] });
    }

    const cities = await searchCities(safeQuery, safeLimit, { language });
    return res.json({ cities });
  } catch (error) {
    if (error instanceof GeocodingServiceError) {
      return res.status(503).json({
        error:
          "Geocoding service temporarily unavailable. Please try again in a moment.",
        code: "GEOCODING_SERVICE_UNAVAILABLE",
      });
    }
    // Do NOT echo error.message — upstream geocoder errors can embed the query
    // (which is the user's typed birth city) or upstream URLs. Forwarding that
    // to the HTTP body would leak PII into Vercel access logs and CDN traces.
    // Log the full reason server-side; respond with a generic message.
    const reason =
      error instanceof Error
        ? `${error.name}: ${error.message.slice(0, 120)}`
        : typeof error;
    console.error(`Geo /search unexpected error: ${reason}`);
    return res
      .status(500)
      .json({ error: "City search temporarily unavailable." });
  }
}

// POST /api/geo/search — 规范入口。city query 走 body，不进 URL → 不进 Vercel access log / referer。
// 隐私红线 #3：用户出生城市属高敏感字段，禁止以 query string 形式经过 CDN / 平台访问日志。
geoRouter.post("/search", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const query = typeof body.q === "string" ? body.q : "";
  const limit = Number(body.limit) || 5;
  const language = resolveLang(body.lang, "en");
  // resolveLang 总会返回 'zh' | 'en'；但 searchCities 的 language 入参语义是
  // "调用方未指定时让服务自适应"，所以这里只在 body 明确传了支持的语言时才下传。
  const langForService =
    typeof body.lang === "string" && (body.lang === "zh" || body.lang === "en")
      ? language
      : undefined;
  await handleCitySearch(query, limit, langForService, res);
});

// GET /api/geo/search — 弃用别名。保留一个发布周期以兼容浏览器中尚未刷新的旧前端 bundle，
// 防止用户在我们切到 POST 那一刻看到 404。下一次发布前移除。
geoRouter.get("/search", async (req, res) => {
  if (!getDeprecationWarned) {
    getDeprecationWarned = true;
    console.warn("[geo] GET /api/geo/search is deprecated; use POST");
  }
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const limit = Number(req.query.limit) || 5;
  const langParam =
    typeof req.query.lang === "string" ? req.query.lang : undefined;
  const language =
    langParam === "zh" || langParam === "en" ? langParam : undefined;
  await handleCitySearch(query, limit, language, res);
});
