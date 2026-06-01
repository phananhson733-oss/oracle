// INPUT: 受信任的 Markdown 字符串（wiki/classics 正文，来自 backend/src/data）。
// OUTPUT: mdToHtml(md) 返回转义后的 HTML 字符串；escapeHtml(value) 工具。零依赖。
// POS: SEO 预渲染脚本 generate-seo-pages.mjs 把正文注入静态页 <main> 时调用，让爬虫读到完整正文。
// 维护：覆盖范围对齐前端 components/wiki/WikiClassicDetailPage.tsx 的 parseMarkdownBlocks；新增语法两端同步。

// 所有文本节点先转义再包标签，杜绝构建期 HTML 注入。
export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// 仅允许安全协议的 href，杜绝 javascript:/data: 等注入。
const SAFE_HREF = /^(https?:\/\/|\/|#|mailto:)/;

// 行内：先转义，再处理 [text](url) 链接（安全 href 白名单），再 **bold** / *italic*。
// 链接先于强调，避免链接文字里的 ** 被误拆。
const inline = (text) =>
  escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) =>
      SAFE_HREF.test(href) ? `<a href="${href}">${label}</a>` : label)
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>');

// 把 Markdown 行内标记剥成纯文本，供 meta description 使用（去掉 *强调*、`代码`、[链接](url) 残留）。
export const stripInlineMarkdown = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*?/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// 极简 Markdown→HTML：标题、段落、有序/无序列表、引用、围栏代码块、行内强调。
// 紧凑输出（块间无空白），适合注入静态 SEO stub 的 <main>。
export function mdToHtml(md) {
  if (md === null || md === undefined) return '';
  const normalized = String(md).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const lines = normalized.split('\n');

  const out = [];
  let para = [];
  let list = null; // { ordered: boolean, items: string[] }
  let quote = [];
  let pre = null; // string[] while inside a fenced code block
  let inCode = false;

  const flushPara = () => {
    if (!para.length) return;
    const text = inline(para.join(' ').replace(/\s+/g, ' ').trim());
    if (text) out.push(`<p>${text}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list && list.items.length) {
      const tag = list.ordered ? 'ol' : 'ul';
      const items = list.items.map((i) => `<li>${inline(i)}</li>`).join('');
      out.push(`<${tag}>${items}</${tag}>`);
    }
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const text = inline(quote.join(' ').replace(/\s+/g, ' ').trim());
    if (text) out.push(`<blockquote><p>${text}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Fenced code block.
    if (line.startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(pre.join('\n'))}</code></pre>`);
        pre = null;
        inCode = false;
      } else {
        flushAll();
        pre = [];
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      pre.push(rawLine);
      continue;
    }

    // Blank line ends any open block.
    if (!line) {
      flushAll();
      continue;
    }

    // Heading.
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      continue;
    }

    // Blockquote.
    if (line.startsWith('>')) {
      flushPara();
      flushList();
      quote.push(line.replace(/^>\s?/, ''));
      continue;
    }

    // Ordered list item.
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      flushPara();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1].trim());
      continue;
    }

    // Unordered list item ("-", "*", "+" followed by space).
    const unordered = line.match(/^[-*+]\s+(.*)$/);
    if (unordered) {
      flushPara();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(unordered[1].trim());
      continue;
    }

    // Paragraph text (consecutive lines merge into one paragraph).
    flushList();
    flushQuote();
    para.push(line);
  }

  flushAll();
  return out.join('');
}
