// INPUT: node:crypto；调用方传入每个 URL 的内容签名片段、上一轮 manifest、旧 sitemap lastmod。
// OUTPUT: contentHash / parseSitemapLastmods / resolveLastmods —— sitemap lastmod 的纯函数解析器。
// POS: T1 修复核心——lastmod 只在内容真实变更时改为 today，否则保留旧值，杜绝每次 build 全站刷日期污染 Google 对 lastmod 的信任。被 generate-seo-pages.mjs 消费，被 tests/unit/seo-lastmod.test.ts 守护。若更新此文件，务必更新本头注释与 scripts/FOLDER.md。

import crypto from "node:crypto";

// 内容签名：把片段用不可见分隔符拼接后取 SHA-1 前 12 位。
// 忽略 falsy 片段（undefined/null/空串），分隔符避免 ['ab'] 与 ['a','b'] 碰撞。
export const contentHash = (parts) => {
  const joined = parts.filter((p) => p !== undefined && p !== null && p !== "").join("");
  return crypto.createHash("sha1").update(joined).digest("hex").slice(0, 12);
};

// 从既有 sitemap.xml 文本提取 loc→lastmod 映射，用作首跑种子（避免一次性把全站刷成 today）。
// 容错：空/非字符串返回空 Map。
export const parseSitemapLastmods = (xml) => {
  const map = new Map();
  if (!xml || typeof xml !== "string") return map;
  const urlBlock = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = urlBlock.exec(xml)) !== null) {
    const block = m[1];
    const loc = /<loc>([\s\S]*?)<\/loc>/.exec(block)?.[1]?.trim();
    const lastmod = /<lastmod>([\s\S]*?)<\/lastmod>/.exec(block)?.[1]?.trim();
    if (loc && lastmod) map.set(loc, lastmod);
  }
  return map;
};

// 解析每个 URL 的 lastmod。规则（按优先级）：
//   1. manifest 有此 URL 且 hash 未变 → 保留旧 lastmod（不刷 today）
//   2. manifest 无此 URL 但旧 sitemap 有 → 沿用旧 sitemap 日期（首跑迁移，零 churn）
//   3. 其余（全新 URL 或 hash 已变）→ today
// 返回 { lastmodByUrl: Map, manifest } —— 纯函数、确定性；manifest 已剪枝（只含当前 URL）。
export const resolveLastmods = (signatures, prevManifest, priorLastmods, today) => {
  const manifest = {};
  const lastmodByUrl = new Map();
  const prev = prevManifest || {};
  const prior = priorLastmods || new Map();
  for (const [url, hash] of signatures) {
    const recorded = prev[url];
    let lastmod;
    if (recorded && recorded.hash === hash && recorded.lastmod) {
      lastmod = recorded.lastmod;
    } else if (!recorded && prior.has(url)) {
      lastmod = prior.get(url);
    } else {
      lastmod = today;
    }
    manifest[url] = { hash, lastmod };
    lastmodByUrl.set(url, lastmod);
  }
  return { lastmodByUrl, manifest };
};
