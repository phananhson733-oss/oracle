// INPUT: scripts/seo-lastmod.mjs 的纯函数（contentHash / parseSitemapLastmods / resolveLastmods）。
// OUTPUT: sitemap lastmod 解析逻辑的单元测试。
// POS: 守护 T1 修复——lastmod 只在内容真实变更时更新，否则保留旧值；杜绝每次 build 全站刷 today。若改 seo-lastmod.mjs，同步此测试。

import { describe, it, expect } from "vitest";
import {
  contentHash,
  parseSitemapLastmods,
  resolveLastmods,
} from "../../scripts/seo-lastmod.mjs";

describe("contentHash", () => {
  it("对相同输入确定性、对不同输入不同", () => {
    expect(contentHash(["a", "b"])).toBe(contentHash(["a", "b"]));
    expect(contentHash(["a", "b"])).not.toBe(contentHash(["a", "c"]));
  });

  it("忽略 falsy 片段（undefined/null/空串不影响）", () => {
    expect(contentHash(["a", undefined, "b"])).toBe(contentHash(["a", "b"]));
    expect(contentHash(["a", null, "", "b"])).toBe(contentHash(["a", "b"]));
  });

  it("分隔符防拼接歧义：['ab'] ≠ ['a','b']", () => {
    expect(contentHash(["ab"])).not.toBe(contentHash(["a", "b"]));
  });
});

describe("parseSitemapLastmods", () => {
  it("从 sitemap XML 提取 loc→lastmod 映射", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://x.com/a</loc>
    <lastmod>2026-05-01</lastmod>
  </url>
  <url>
    <loc>https://x.com/b</loc>
    <lastmod>2026-05-02</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
    const map = parseSitemapLastmods(xml);
    expect(map.get("https://x.com/a")).toBe("2026-05-01");
    expect(map.get("https://x.com/b")).toBe("2026-05-02");
    expect(map.size).toBe(2);
  });

  it("空串或无效输入返回空 Map（不抛错）", () => {
    expect(parseSitemapLastmods("").size).toBe(0);
    expect(parseSitemapLastmods(null).size).toBe(0);
  });
});

describe("resolveLastmods", () => {
  const today = "2026-06-01";

  it("hash 未变 → 保留 manifest 旧 lastmod（核心：不刷 today）", () => {
    const signatures = new Map([["u1", "hashA"]]);
    const manifest = { u1: { hash: "hashA", lastmod: "2026-05-10" } };
    const { lastmodByUrl, manifest: next } = resolveLastmods(
      signatures,
      manifest,
      new Map(),
      today,
    );
    expect(lastmodByUrl.get("u1")).toBe("2026-05-10");
    expect(next.u1.lastmod).toBe("2026-05-10");
  });

  it("hash 变了 → lastmod 设为 today", () => {
    const signatures = new Map([["u1", "hashB"]]);
    const manifest = { u1: { hash: "hashA", lastmod: "2026-05-10" } };
    const { lastmodByUrl } = resolveLastmods(signatures, manifest, new Map(), today);
    expect(lastmodByUrl.get("u1")).toBe(today);
  });

  it("首跑（manifest 无此 URL）但旧 sitemap 有 → 沿用旧 sitemap 日期，不 churn", () => {
    const signatures = new Map([["u1", "hashA"]]);
    const prior = new Map([["u1", "2026-04-15"]]);
    const { lastmodByUrl, manifest: next } = resolveLastmods(
      signatures,
      {},
      prior,
      today,
    );
    expect(lastmodByUrl.get("u1")).toBe("2026-04-15");
    expect(next.u1).toEqual({ hash: "hashA", lastmod: "2026-04-15" });
  });

  it("全新 URL（manifest + 旧 sitemap 都没有）→ today", () => {
    const signatures = new Map([["u-new", "hashX"]]);
    const { lastmodByUrl } = resolveLastmods(signatures, {}, new Map(), today);
    expect(lastmodByUrl.get("u-new")).toBe(today);
  });

  it("manifest 中已不存在的 URL 被剪枝（next manifest 只含当前 URL）", () => {
    const signatures = new Map([["u1", "hashA"]]);
    const manifest = {
      u1: { hash: "hashA", lastmod: "2026-05-10" },
      "u-gone": { hash: "old", lastmod: "2026-01-01" },
    };
    const { manifest: next } = resolveLastmods(signatures, manifest, new Map(), today);
    expect(Object.keys(next)).toEqual(["u1"]);
  });

  it("确定性：相同输入两次调用得到同样 manifest", () => {
    const sig = new Map([["u1", "h1"], ["u2", "h2"]]);
    const m = { u1: { hash: "h1", lastmod: "2026-05-01" } };
    const prior = new Map([["u2", "2026-05-02"]]);
    const a = resolveLastmods(sig, m, prior, today);
    const b = resolveLastmods(sig, m, prior, today);
    expect(a.manifest).toEqual(b.manifest);
  });
});
