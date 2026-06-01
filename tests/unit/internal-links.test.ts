// INPUT: scripts/check-internal-links.mjs 的纯函数（normalizeLink / extractInternalLinks / buildLinkGraph / findOrphans / classifyPath / groupOrphans）。
// OUTPUT: 内链归一化 + orphan 判定逻辑的单元测试；验证 import 该 mjs 不触发任何全量扫描副作用。
// POS: 守护 SEO T6 内链/orphan 检测工具。若改 check-internal-links.mjs 的纯函数签名或归一规则，同步此测试。

import { describe, it, expect } from "vitest";
import {
  normalizeLink,
  extractInternalLinks,
  buildLinkGraph,
  findOrphans,
  classifyPath,
  groupOrphans,
} from "../../scripts/check-internal-links.mjs";

describe("normalizeLink", () => {
  it("带 host / 不带 host / trailing slash / hash 都归一到同一节点", () => {
    const expected = "/en/wiki/aries";
    expect(normalizeLink("/en/wiki/aries")).toBe(expected);
    expect(normalizeLink("/en/wiki/aries/")).toBe(expected);
    expect(normalizeLink("/en/wiki/aries#section")).toBe(expected);
    expect(normalizeLink("/en/wiki/aries?ref=hub")).toBe(expected);
    expect(normalizeLink("https://www.astrologywiki.com/en/wiki/aries")).toBe(expected);
    // 历史写法：裸域（无 www）也视为站内同节点。
    expect(normalizeLink("https://astrologywiki.com/en/wiki/aries/")).toBe(expected);
    expect(normalizeLink("https://astrologywiki.com/en/wiki/aries#top")).toBe(expected);
  });

  it("根路径 / 保留，不被 trailing-slash 规则吃掉", () => {
    expect(normalizeLink("/")).toBe("/");
    expect(normalizeLink("https://www.astrologywiki.com/")).toBe("/");
  });

  it("外链 / 纯锚点 / mailto / 相对路径 返回 null", () => {
    expect(normalizeLink("https://example.com/en/wiki/aries")).toBeNull();
    expect(normalizeLink("#section")).toBeNull();
    expect(normalizeLink("mailto:hi@x.com")).toBeNull();
    expect(normalizeLink("tel:123")).toBeNull();
    expect(normalizeLink("relative/path")).toBeNull();
    expect(normalizeLink("")).toBeNull();
    expect(normalizeLink(null)).toBeNull();
  });
});

describe("extractInternalLinks", () => {
  it("抽 markdown [text](path) 内链并归一", () => {
    const content = "See the [Aries guide](/en/wiki/aries) and [Sun](/en/wiki/sun/).";
    const links = extractInternalLinks(content);
    expect(links.has("/en/wiki/aries")).toBe(true);
    expect(links.has("/en/wiki/sun")).toBe(true);
    expect(links.size).toBe(2);
  });

  it("抽全 host markdown 链接并去 host", () => {
    const content = "Read [8th house](https://astrologywiki.com/en/wiki/8th-house-meaning).";
    const links = extractInternalLinks(content);
    expect(links.has("/en/wiki/8th-house-meaning")).toBe(true);
  });

  it("抽 html href 内链", () => {
    const content = '<a href="/zh/wiki/aries">白羊</a>';
    expect(extractInternalLinks(content).has("/zh/wiki/aries")).toBe(true);
  });

  it("忽略外链与纯锚点", () => {
    const content = "[ext](https://google.com) [anchor](#top)";
    expect(extractInternalLinks(content).size).toBe(0);
  });

  it("空内容返回空集", () => {
    expect(extractInternalLinks("").size).toBe(0);
    expect(extractInternalLinks(undefined).size).toBe(0);
  });
});

describe("buildLinkGraph + findOrphans", () => {
  const sitemap = ["/en/wiki/a", "/en/wiki/b", "/en/wiki/c", "/en/wiki"];
  const pages = [
    { from: "/en/wiki", links: ["/en/wiki/a", "/en/wiki/b"] }, // hub 链 a,b（不链 c）
    { from: "/en/wiki/a", links: ["/en/wiki/b", "/en/wiki/a"] }, // 自链被忽略
    { from: "/en/wiki/b", links: ["/external/x"] }, // 指向非 sitemap，跳过
  ];

  it("只统计指向 sitemap 内节点的入链，忽略自链与外部目标", () => {
    const graph = buildLinkGraph(sitemap, pages);
    expect(graph.inbound.get("/en/wiki/a").size).toBe(1); // hub
    expect(graph.inbound.get("/en/wiki/b").size).toBe(2); // hub + a
    expect(graph.inbound.get("/en/wiki/c").size).toBe(0); // 谁都没链
    expect(graph.inbound.get("/en/wiki").size).toBe(0); // hub 自身无入链
  });

  it("findOrphans 找出 0 入链节点并排序", () => {
    const graph = buildLinkGraph(sitemap, pages);
    expect(findOrphans(graph)).toEqual(["/en/wiki", "/en/wiki/c"]);
  });

  it("空图（无 pages）时所有 sitemap 节点都是 orphan", () => {
    const graph = buildLinkGraph(sitemap, []);
    expect(findOrphans(graph)).toHaveLength(4);
  });
});

describe("classifyPath + groupOrphans", () => {
  it("按 path 形态分类", () => {
    expect(classifyPath("/en/wiki/author/elena-vane")).toBe("author");
    expect(classifyPath("/en/wiki/classics/relating")).toBe("classics");
    expect(classifyPath("/en/wiki/aries")).toBe("article");
    expect(classifyPath("/en/wiki")).toBe("wiki-hub");
    expect(classifyPath("/en/about")).toBe("other");
  });

  it("分组聚合", () => {
    const groups = groupOrphans([
      "/en/wiki/aries",
      "/en/wiki/classics/relating",
      "/en/about",
    ]);
    expect(groups.article).toEqual(["/en/wiki/aries"]);
    expect(groups.classics).toEqual(["/en/wiki/classics/relating"]);
    expect(groups.other).toEqual(["/en/about"]);
  });
});
