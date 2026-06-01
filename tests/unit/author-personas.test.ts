// INPUT: data/authors 注册表与 schema helper。
// OUTPUT: 作者人设注册表 + Person schema 单元测试。
// POS: 守护作者人设单一事实来源与 SEO 实体正确性。若改注册表/ schema，同步此测试。

import { describe, it, expect } from "vitest";
import {
  AUTHORS,
  getAuthorById,
  getAllAuthors,
  getAuthorBio,
} from "../../data/authors/index";
import {
  buildPersonSchema,
  buildEditorialOrganizationSchema,
  authorUrl,
} from "../../data/authors/schema";

describe("author personas registry", () => {
  it("getAuthorById 命中返回 persona", () => {
    const a = getAuthorById("elena-vane");
    expect(a).toBeDefined();
    expect(a?.name).toBe("Elena Vane");
  });

  it("getAuthorById 未命中返回 undefined（不抛错）", () => {
    expect(getAuthorById("nonexistent-author")).toBeUndefined();
  });

  it("getAllAuthors 返回全部作者（首版顺序）", () => {
    expect(getAllAuthors().map((a) => a.id)).toEqual([
      "elena-vane",
      "julian-thorne",
      "marcus-orion",
      "aditi-sharma",
    ]);
  });

  it("getAuthorBio EN 必填，缺失语言回退 EN", () => {
    const elena = getAuthorById("elena-vane")!; // 仅 EN bio
    expect(getAuthorBio(elena, "en")).toContain("aura");
    expect(getAuthorBio(elena, "zh")).toBe(getAuthorBio(elena, "en"));
  });

  it("每个 persona 都有 EN bio 与 avatarColors", () => {
    for (const a of AUTHORS) {
      expect(a.bio.en, `${a.id} 缺 EN bio`).toBeTruthy();
      expect(a.avatarColors).toHaveLength(2);
    }
  });
});

describe("buildPersonSchema（披露式 editorial persona）", () => {
  const site = "https://www.astrologywiki.com";

  it("输出 Person，含 @id/url/name/description，但不声称真实专家资质", () => {
    const elena = getAuthorById("elena-vane")!;
    const s = buildPersonSchema(elena, "en", site);
    expect(s["@type"]).toBe("Person");
    expect(s["@id"]).toBe(`${site}/en/wiki/author/elena-vane`);
    expect(s.url).toBe(s["@id"]);
    expect(s.name).toBe("Elena Vane");
    expect(s.description).toBeTruthy();
  });

  it("D1：不输出 jobTitle / knowsAbout（移除拟真人专家声明，降 E-E-A-T/spam 风险）", () => {
    const elena = getAuthorById("elena-vane")!;
    const s = buildPersonSchema(elena, "en", site);
    expect(s.jobTitle).toBeUndefined();
    expect(s.knowsAbout).toBeUndefined();
  });

  it("disambiguatingDescription 显式披露其为编辑人设而非真实个人", () => {
    const elena = getAuthorById("elena-vane")!;
    const s = buildPersonSchema(elena, "en", site);
    expect(String(s.disambiguatingDescription).toLowerCase()).toContain(
      "editorial persona",
    );
  });

  it("@id 跨页/跨语言对同一作者保持一致（实体稳定性）", () => {
    const julian = getAuthorById("julian-thorne")!;
    const en = buildPersonSchema(julian, "en", site);
    const zh = buildPersonSchema(julian, "zh", site);
    expect(en["@id"]).toBe(zh["@id"]);
  });

  it("authorUrl 始终为 EN-only 前缀", () => {
    const marcus = getAuthorById("marcus-orion")!;
    expect(authorUrl(marcus, site)).toBe(`${site}/en/wiki/author/marcus-orion`);
  });
});

describe("buildEditorialOrganizationSchema（文章 author 责任主体）", () => {
  const site = "https://www.astrologywiki.com";

  it("D1.3：文章 author 用 Organization 编辑部，不放大 persona 拟真人感", () => {
    const org = buildEditorialOrganizationSchema(site);
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("AstrologyWiki Editorial Team");
    expect(org["@id"]).toBe(`${site}/#editorial-team`);
    expect(org.url).toBeTruthy();
  });

  it("@id 稳定（跨页一致建立单一编辑部实体）", () => {
    expect(buildEditorialOrganizationSchema(site)["@id"]).toBe(
      buildEditorialOrganizationSchema(site)["@id"],
    );
  });
});
