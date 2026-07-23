// INPUT: scripts/lib/md-to-html.mjs 的类型可解析 mdToHtml（零依赖 Markdown→HTML 转换器）。
// OUTPUT: 验证标题/段落/列表/引用/行内强调/代码块的渲染与 XSS 转义。
// POS: SEO 预渲染正文注入的安全网。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import {
  mdToHtml,
  escapeHtml,
  stripInlineMarkdown,
} from "../../scripts/lib/md-to-html.mjs";

describe("escapeHtml", () => {
  it("转义 HTML 特殊字符", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });
  it("空值返回空串", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("mdToHtml — 块级", () => {
  it("把集群内链的管理块渲染为独立的相关文章卡片，不计入正文列表", () => {
    expect(
      mdToHtml(
        "## Related Reading\n\n<!-- gg-cluster-links:start -->\n\n- [Free Birth Chart Calculator](/en/birth-chart-calculator)\n- [Saturn Return Guide](/en/wiki/saturn-return-guide)\n\n<!-- gg-cluster-links:end -->\n\n- A human-authored body list item",
      ),
    ).toBe(
      '<h2>Related Reading</h2><section class="related-reading-cards" aria-label="Related Reading"><a class="related-reading-card" href="/en/birth-chart-calculator">Free Birth Chart Calculator</a><a class="related-reading-card" href="/en/wiki/saturn-return-guide">Saturn Return Guide</a></section><ul><li>A human-authored body list item</li></ul>',
    );
  });

  it("# / ## / ### 转标题", () => {
    expect(mdToHtml("# Title")).toBe("<h1>Title</h1>");
    expect(mdToHtml("## Sub")).toBe("<h2>Sub</h2>");
    expect(mdToHtml("### Deep")).toBe("<h3>Deep</h3>");
  });

  it("普通文本成段", () => {
    expect(mdToHtml("hello world")).toBe("<p>hello world</p>");
  });

  it("空行分隔多段", () => {
    expect(mdToHtml("para one\n\npara two")).toBe(
      "<p>para one</p><p>para two</p>",
    );
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
    expect(mdToHtml("```\n<b>x</b>\n```")).toBe(
      "<pre><code>&lt;b&gt;x&lt;/b&gt;</code></pre>",
    );
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

describe("mdToHtml — 链接", () => {
  it("[text](/url) 转锚点", () => {
    expect(mdToHtml("see [houses](/en/wiki/astrology-houses) here")).toBe(
      '<p>see <a href="/en/wiki/astrology-houses">houses</a> here</p>',
    );
  });
  it("外链 https 允许", () => {
    expect(mdToHtml("[x](https://a.com/p)")).toBe(
      '<p><a href="https://a.com/p">x</a></p>',
    );
  });
  it("不安全 href (javascript:) 降级为纯文本", () => {
    expect(mdToHtml("[x](javascript:evil)")).toBe("<p>x</p>");
  });
  it("URL 含平衡括号不被截断 (Wikipedia)", () => {
    expect(
      mdToHtml(
        "[House (astrology)](https://en.wikipedia.org/wiki/House_(astrology))",
      ),
    ).toBe(
      '<p><a href="https://en.wikipedia.org/wiki/House_(astrology)">House (astrology)</a></p>',
    );
  });
  it("protocol-relative // 链接降级为纯文本 (拒绝外链绕过)", () => {
    expect(mdToHtml("[x](//evil.test/path)")).toBe("<p>x</p>");
  });
});

describe("mdToHtml — 解析健壮性", () => {
  it("裸星号不被误当斜体", () => {
    expect(mdToHtml("2 * 3 = 6 and 4 * 5 = 20")).toBe(
      "<p>2 * 3 = 6 and 4 * 5 = 20</p>",
    );
  });
  it("未闭合代码块仍保留正文 (不静默丢失)", () => {
    expect(mdToHtml("```\nkept line")).toBe(
      "<pre><code>kept line</code></pre>",
    );
  });
  it("多行引用合并", () => {
    expect(mdToHtml("> line a\n> line b")).toBe(
      "<blockquote><p>line a line b</p></blockquote>",
    );
  });
});

describe("stripInlineMarkdown", () => {
  it("去除 * 强调标记保留文字", () => {
    expect(
      stripInlineMarkdown("Arroyo's *Four Elements*, first published"),
    ).toBe("Arroyo's Four Elements, first published");
  });
  it("链接转为纯文本", () => {
    expect(stripInlineMarkdown("see [houses](/x) now")).toBe("see houses now");
  });
  it("去除反引号", () => {
    expect(stripInlineMarkdown("use `code` here")).toBe("use code here");
  });
  it("空值返回空串", () => {
    expect(stripInlineMarkdown(null)).toBe("");
    expect(stripInlineMarkdown(undefined)).toBe("");
    expect(stripInlineMarkdown("")).toBe("");
  });
});

describe("mdToHtml — XSS 安全", () => {
  it("段落中的标签被转义", () => {
    expect(mdToHtml("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });
  it("标题中的标签被转义", () => {
    expect(mdToHtml("# <img src=x onerror=y>")).toBe(
      "<h1>&lt;img src=x onerror=y&gt;</h1>",
    );
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
    const md =
      "# Book\n\nIntro **bold** here.\n\n## Section\n\n- one\n- two\n\n> a note";
    expect(mdToHtml(md)).toBe(
      "<h1>Book</h1>" +
        "<p>Intro <strong>bold</strong> here.</p>" +
        "<h2>Section</h2>" +
        "<ul><li>one</li><li>two</li></ul>" +
        "<blockquote><p>a note</p></blockquote>",
    );
  });
});

describe("mdToHtml — GFM 表格", () => {
  it("渲染表头 + 数据行，跳过分隔行", () => {
    const md = "| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |";
    expect(mdToHtml(md)).toBe(
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
        "<tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table>",
    );
  });

  it("单元格处理行内链接与强调", () => {
    const md =
      "| Date | Link |\n| --- | --- |\n| **Feb 17** | [doc](/en/wiki/x) |";
    expect(mdToHtml(md)).toBe(
      "<table><thead><tr><th>Date</th><th>Link</th></tr></thead>" +
        '<tbody><tr><td><strong>Feb 17</strong></td><td><a href="/en/wiki/x">doc</a></td></tr></tbody></table>',
    );
  });

  it("缺分隔行 → 退化为段落，不丢内容", () => {
    const md = "| just | pipes |\n| more | text |";
    expect(mdToHtml(md)).toBe("<p>| just | pipes | | more | text |</p>");
  });

  it("表格与其它块共存", () => {
    const md = "## T\n\n| A |\n| --- |\n| x |\n\ndone";
    expect(mdToHtml(md)).toBe(
      "<h2>T</h2><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table><p>done</p>",
    );
  });
});
