// INPUT: Express 请求头 x-vercel-ip-country（Vercel 边缘注入的访客 IP 国家码）。
// OUTPUT: 导出 regionRouter — GET /api/region 返回 { country }，供前端地域分流（Google CMP + 广告同意门控）。
// POS: Region 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from "express";

export const regionRouter = Router();

// GET /api/region — 返回访客 IP 国家码（ISO-3166 alpha-2，大写）。
// 隐私：仅返回粗粒度国家码（非精确定位/城市），不记录、不入库、不进日志；
// 不缓存（no-store），确保按访客地域实时判定。未知/非法头 → { country: null }。
regionRouter.get("/", (req, res) => {
  const raw = req.headers["x-vercel-ip-country"];
  const country =
    typeof raw === "string" && /^[A-Za-z]{2}$/.test(raw)
      ? raw.toUpperCase()
      : null;
  res.setHeader("Cache-Control", "no-store");
  res.json({ country });
});
