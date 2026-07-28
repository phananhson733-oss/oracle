// INPUT: 已生成的 public/sitemap.xml + data/articles 全量文章源（getArticles）+ includeInSitemap。
// OUTPUT: 回归测试——每个可索引（includeInSitemap）文章按语言的 /{lang}/wiki/{slug} 都在 sitemap。
// POS: sitemap 文章收录完整性守卫；防止“文章 SEO 页已上线却漏 sitemap/IndexNow”盲区复发
//      （2026-07-21 根因：收录曾靠手工白名单 ARTICLE_SLUGS，autopilot 新文章漏收录）。
//      若更新此文件，务必同步本头注释与 tests/unit/FOLDER.md。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getArticles } from "../../data/articles/index";
import { includeInSitemap } from "../../scripts/lib/seo-canonical.mjs";

const ROOT = process.cwd();
const SITE_URL = "https://www.astrologywiki.com";
const sitemap = readFileSync(join(ROOT, "public", "sitemap.xml"), "utf8");

describe("generated article sitemap coverage (no whitelist drift)", () => {
  it("lists every indexable article's /{lang}/wiki/{slug} in the sitemap", () => {
    const missing: string[] = [];
    for (const lang of ["en", "zh"] as const) {
      for (const article of getArticles(lang)) {
        // seo.sitemap===false（noindex 桥页 / canonical 收口页）本就不该进 sitemap。
        if (!includeInSitemap(article.seo)) continue;
        const loc = `<loc>${SITE_URL}/${lang}/wiki/${article.slug}</loc>`;
        if (!sitemap.includes(loc)) missing.push(`${lang}:${article.slug}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
