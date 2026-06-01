// INPUT: scripts/lib/md-to-html.mjs 的 mdToHtml（零依赖 Markdown→HTML 转换器）。
// OUTPUT: 验证标题/段落/列表/引用/行内强调/代码块的渲染与 XSS 转义。
// POS: SEO 预渲染正文注入的安全网。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
// @ts-expect-error — 纯 JS 工具，无类型声明
import { mdToHtml, escapeHtml } from "../../scripts/lib/md-to-html.mjs";

describe("escapeHtml", () => {
  it("转义 HTML 特殊字符", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
  it("空值返回空串", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("mdToHtml — 块级", () => {
  it("# / ## / ### 转标题", () => {
    expect(mdToHtml("# Title")).toBe("<h1>Title</h1>");
    expect(mdToHtml("## Sub")).toBe("<h2>Sub</h2>");
    expect(mdToHtml("### Deep")).toBe("<h3>Deep</h3>");
  });

  it("普通文本成段", () => {
    expect(mdToHtml("hello world")).toBe("<p>hello world</p>");
  });

  it("空行分隔多段", () => {
    expect(mdToHtml("para one\n\npara two")).toBe("<p>para one</p><p>para two</p>");
  });

  it("单段内换行合并为一段", () => {
    expect(mdToHtml("line a\nline b")).toBe("<p>line a line b</p>");
  });

  it("无序列表", () => {
    expect(mdToHtml("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(mdToHtml("* a\n* b")).toBe("<ul><li>a</li><li>b</li></ul>");
  });

  it("有序列表", () => {
    expect(mdToHtml("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
  });

  it("引用块", () => {
    expect(mdToHtml("> quoted")).toBe("<blockquote><p>quoted</p></blockquote>");
  });

  it("代码块原样保留并转义", () => {
    expect(mdToHtml("```\n<b>x</b>\n```")).toBe("<pre><code>&lt;b&gt;x&lt;/b&gt;</code></pre>");
  });
});

describe("mdToHtml — 行内强调", () => {
  it("**bold** 转 strong", () => {
    expect(mdToHtml("a **b** c")).toBe("<p>a <strong>b</strong> c</p>");
  });
  it("*italic* 转 em", () => {
    expect(mdToHtml("a *b* c")).toBe("<p>a <em>b</em> c</p>");
  });
  it("bold 优先于 italic（不误拆 **）", () => {
    expect(mdToHtml("**strong**")).toBe("<p><strong>strong</strong></p>");
  });
});

describe("mdToHtml — XSS 安全", () => {
  it("段落中的标签被转义", () => {
    expect(mdToHtml("<script>alert(1)</script>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });
  it("标题中的标签被转义", () => {
    expect(mdToHtml("# <img src=x onerror=y>")).toBe("<h1>&lt;img src=x onerror=y&gt;</h1>");
  });
  it("强调内部仍转义", () => {
    expect(mdToHtml("**<b>**")).toBe("<p><strong>&lt;b&gt;</strong></p>");
  });
});

describe("mdToHtml — 边界", () => {
  it("空/无效输入返回空串", () => {
    expect(mdToHtml("")).toBe("");
    expect(mdToHtml(null)).toBe("");
    expect(mdToHtml(undefined)).toBe("");
  });
  it("综合文档结构正确", () => {
    const md = "# Book\n\nIntro **bold** here.\n\n## Section\n\n- one\n- two\n\n> a note";
    expect(mdToHtml(md)).toBe(
      "<h1>Book</h1>" +
        "<p>Intro <strong>bold</strong> here.</p>" +
        "<h2>Section</h2>" +
        "<ul><li>one</li><li>two</li></ul>" +
        "<blockquote><p>a note</p></blockquote>",
    );
  });
});
