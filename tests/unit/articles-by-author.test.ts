// INPUT: data/articles 的 getArticleSummaries / getArticlesByAuthor；data/authors 注册表。
// OUTPUT: 文章摘要形状回归 + 按作者查询测试。
// POS: 守护 author→authorId 迁移不破坏既有消费方，并验证作者页文章列表查询。

import { describe, it, expect } from "vitest";
import {
  getArticleSummaries,
  getArticlesByAuthor,
} from "../../data/articles/index";
import { getAuthorById } from "../../data/authors/index";

describe("getArticleSummaries 形状回归（author→authorId 迁移）", () => {
  it("每个 summary 含所有既有字段 + authorId，且无残留 author 字段", () => {
    const summaries = getArticleSummaries("en");
    expect(summaries.length).toBeGreaterThan(0);
    for (const s of summaries) {
      expect(s).toHaveProperty("slug");
      expect(s).toHaveProperty("title");
      expect(s).toHaveProperty("description");
      expect(s).toHaveProperty("date");
      expect(s).toHaveProperty("keywords");
      expect(s).toHaveProperty("authorId");
      expect(s).not.toHaveProperty("author");
      expect(typeof s.authorId).toBe("string");
    }
  });

  it("所有文章 authorId 都能在注册表解析（构建期完整性）", () => {
    for (const lang of ["en", "zh"] as const) {
      for (const s of getArticleSummaries(lang)) {
        expect(
          getAuthorById(s.authorId),
          `${s.slug} (${lang}) 的 authorId=${s.authorId} 无法解析`,
        ).toBeDefined();
      }
    }
  });
});

describe("getArticlesByAuthor", () => {
  it("EN 作者返回其文章（Elena 有多篇 aura 文章）", () => {
    const list = getArticlesByAuthor("elena-vane", "en");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.authorId === "elena-vane")).toBe(true);
  });

  it("Elena 在 zh 下有文章（aura/chakra cluster 已补 ZH 版）", () => {
    const list = getArticlesByAuthor("elena-vane", "zh");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.authorId === "elena-vane")).toBe(true);
  });

  it("不存在的 authorId 返回空数组", () => {
    expect(getArticlesByAuthor("nonexistent", "en")).toEqual([]);
  });

  it("Julian 在 zh 下有文章（4 篇有 ZH 版）", () => {
    expect(getArticlesByAuthor("julian-thorne", "zh").length).toBeGreaterThan(
      0,
    );
  });
});
