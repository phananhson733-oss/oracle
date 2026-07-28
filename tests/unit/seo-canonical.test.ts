// INPUT: scripts/lib/seo-canonical.mjs 的纯函数（resolveCanonicalUrl / includeInSitemap）。
// OUTPUT: 断言 canonical 解析与 sitemap 收录判定在各 seo override 形态下的正确性。
// POS: SEO canonical 收口逻辑的单测。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
import { describe, it, expect } from "vitest";
import {
  resolveCanonicalUrl,
  includeInSitemap,
} from "../../scripts/lib/seo-canonical.mjs";

const SITE = "https://www.astrologywiki.com";

describe("resolveCanonicalUrl", () => {
  it("无 seo override 时返回自指 URL", () => {
    expect(
      resolveCanonicalUrl({
        seo: undefined,
        lang: "en",
        selfUrl: `${SITE}/en/wiki/house-5`,
        siteUrl: SITE,
      }),
    ).toBe(`${SITE}/en/wiki/house-5`);
  });

  it("seo 无 canonicalPath 时返回自指 URL", () => {
    expect(
      resolveCanonicalUrl({
        seo: { sitemap: false },
        lang: "en",
        selfUrl: `${SITE}/en/wiki/elements`,
        siteUrl: SITE,
      }),
    ).toBe(`${SITE}/en/wiki/elements`);
  });

  it("lang-relative canonicalPath 前缀当前 lang（house-5 → 5th-house）", () => {
    expect(
      resolveCanonicalUrl({
        seo: { canonicalPath: "/wiki/5th-house" },
        lang: "en",
        selfUrl: `${SITE}/en/wiki/house-5`,
        siteUrl: SITE,
      }),
    ).toBe(`${SITE}/en/wiki/5th-house`);
    expect(
      resolveCanonicalUrl({
        seo: { canonicalPath: "/wiki/5th-house" },
        lang: "zh",
        selfUrl: `${SITE}/zh/wiki/house-5`,
        siteUrl: SITE,
      }),
    ).toBe(`${SITE}/zh/wiki/5th-house`);
  });

  it("缺前导斜杠的 canonicalPath 也能正确拼接", () => {
    expect(
      resolveCanonicalUrl({
        seo: { canonicalPath: "wiki/transits" },
        lang: "en",
        selfUrl: `${SITE}/en/wiki/transit-chart`,
        siteUrl: SITE,
      }),
    ).toBe(`${SITE}/en/wiki/transits`);
  });

  it("绝对 canonicalPath（http://...）原样返回，不加 lang 前缀", () => {
    expect(
      resolveCanonicalUrl({
        seo: {
          canonicalPath: "https://www.astrologywiki.com/en/wiki/transits",
        },
        lang: "zh",
        selfUrl: `${SITE}/zh/wiki/transit-chart`,
        siteUrl: SITE,
      }),
    ).toBe("https://www.astrologywiki.com/en/wiki/transits");
  });
});

describe("includeInSitemap", () => {
  it("无 seo → 收录", () => {
    expect(includeInSitemap(undefined)).toBe(true);
  });
  it("seo 无 sitemap 字段 → 收录", () => {
    expect(includeInSitemap({ canonicalPath: "/wiki/transits" })).toBe(true);
  });
  it("seo.sitemap === false → 排除（loser 页不进 sitemap）", () => {
    expect(
      includeInSitemap({ canonicalPath: "/wiki/transits", sitemap: false }),
    ).toBe(false);
  });
  it("seo.sitemap === true → 收录", () => {
    expect(includeInSitemap({ sitemap: true })).toBe(true);
  });
});
