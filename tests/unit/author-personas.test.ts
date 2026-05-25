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
import { buildPersonSchema, authorUrl } from "../../data/authors/schema";

describe("author personas registry", () => {
  it("getAuthorById 命中返回 persona", () => {
    const a = getAuthorById("elena-vane");
    expect(a).toBeDefined();
    expect(a?.name).toBe("Elena Vane");
  });

  it("getAuthorById 未命中返回 undefined（不抛错）", () => {
    expect(getAuthorById("nonexistent-author")).toBeUndefined();
  });

  it("getAllAuthors 返回首版全部作者", () => {
    expect(getAllAuthors().map((a) => a.id)).toEqual([
      "elena-vane",
      "julian-thorne",
      "marcus-orion",
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

describe("buildPersonSchema", () => {
  const site = "https://www.astrologywiki.com";

  it("输出 Person 类型并含 @id/url/jobTitle/knowsAbout/description", () => {
    const elena = getAuthorById("elena-vane")!;
    const s = buildPersonSchema(elena, "en", site);
    expect(s["@type"]).toBe("Person");
    expect(s["@id"]).toBe(`${site}/en/wiki/author/elena-vane`);
    expect(s.url).toBe(s["@id"]);
    expect(s.jobTitle).toBe("Aura & Energy Columnist");
    expect(s.knowsAbout).toEqual(elena.topics);
    expect(s.description).toBeTruthy();
  });

  it("@id 跨页/跨语言对同一作者保持一致（实体稳定性）", () => {
    const julian = getAuthorById("julian-thorne")!;
    const en = buildPersonSchema(julian, "en", site);
    const zh = buildPersonSchema(julian, "zh", site);
    expect(en["@id"]).toBe(zh["@id"]);
  });

  it("authorUrl 始终为 EN-only 前缀", () => {
    const marcus = getAuthorById("marcus-orion")!;
    expect(authorUrl(marcus, site)).toBe(
      `${site}/en/wiki/author/marcus-orion`,
    );
  });
});
