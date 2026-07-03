// INPUT: LLM 输出的原始字符串（markdown-ish：###/**/-/编号清单/结构前缀，可能含残留指令行）。
// OUTPUT: normalizeLlmText → LlmBlock[]（heading|paragraph|list|quote 结构块，内联 **强调** 保留为 segments）；
//         及 stripStructuralPrefixes / splitInlineEmphasis 等可单测的纯函数。
// POS: 全站 LLM 文本 → DOM 的唯一规整层，收编原先散落 12+ 处的手搓解析器（cleanMarkdownText/parseAdviceList/
//      parsePoints 等）。渲染由 components/llm/LlmDoc.tsx 承担。若更新此文件，务必更新本头注释与 services/FOLDER.md。

export interface LlmInlineSegment {
  text: string;
  emphasis?: boolean;
}

export type LlmBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; segments: LlmInlineSegment[] }
  | { type: "list"; ordered: boolean; items: LlmInlineSegment[][] }
  | { type: "quote"; segments: LlmInlineSegment[] };

// prompt 结构词（DETAIL_OUTPUT_INSTRUCTION 等约定的行首前缀）不应泄漏给用户。
// 只剥行首一次，保留冒号后的正文。
const STRUCTURAL_PREFIX_RE =
  /^\s*(?:Key|Mechanism|Action|Point|Insight|观点|要点|机制|建议|行动|洞察)\s*[:：]\s*/i;

// LLM 批量生成偶发的续写指令残留行，直接丢弃。
const ARTIFACT_LINE_RE =
  /^\s*(?:请继续|继续生成|生成后续|\[?to be continued\]?|\(?continued\)?)\s*[。.!！]?\s*$/i;

const BULLET_RE = /^\s*(?:[-*+•·]|[►▸▪])\s+/;
const ORDERED_RE = /^\s*(\d{1,2})\s*[.、)）]\s+/;
const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const QUOTE_RE = /^\s*>\s+/;

export const stripStructuralPrefixes = (line: string): string =>
  line.replace(STRUCTURAL_PREFIX_RE, "");

// 内联强调：**bold** / __bold__ 保留为 emphasis segment；其余 markdown 记号
// （斜体 * _ 、行内 ` 、残留 #）安静剥除。不引入 HTML 解析，输出纯数据。
export const splitInlineEmphasis = (raw: string): LlmInlineSegment[] => {
  const cleaned = raw.replace(/`([^`]*)`/g, "$1");
  const segments: LlmInlineSegment[] = [];
  const re = /(\*\*|__)([^*_]+?)\1/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    if (m.index > last) {
      segments.push({ text: plainify(cleaned.slice(last, m.index)) });
    }
    segments.push({ text: plainify(m[2]), emphasis: true });
    last = m.index + m[0].length;
  }
  if (last < cleaned.length) {
    segments.push({ text: plainify(cleaned.slice(last)) });
  }
  return segments.filter((s) => s.text.length > 0);
};

const plainify = (s: string): string =>
  s
    .replace(/(\*\*|__)/g, "")
    .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|$|[，。,.;；!！?？])/g, "$1$2")
    .replace(/^#+\s*/, "");

// 连续行合并为段：CJK 相邻行直接拼接（不插空格），其余以单空格连接。
// 修复旧 parseMarkdownSections 给中文段落插入多余 ASCII 空格的问题。
const joinLines = (lines: string[]): string =>
  lines.reduce((acc, line) => {
    if (!acc) return line;
    const tail = acc.charCodeAt(acc.length - 1);
    const head = line.charCodeAt(0);
    const cjk = (c: number) => c >= 0x2e80;
    return cjk(tail) && cjk(head) ? acc + line : `${acc} ${line}`;
  }, "");

export const normalizeLlmText = (
  raw: string | null | undefined,
): LlmBlock[] => {
  if (!raw) return [];
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const blocks: LlmBlock[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      const text = joinLines(para).trim();
      if (text)
        blocks.push({ type: "paragraph", segments: splitInlineEmphasis(text) });
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.items.length) {
      blocks.push({
        type: "list",
        ordered: list.ordered,
        items: list.items.map((i) =>
          splitInlineEmphasis(stripStructuralPrefixes(i)),
        ),
      });
    }
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (ARTIFACT_LINE_RE.test(line)) continue;

    const heading = HEADING_RE.exec(line);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
        text: splitInlineEmphasis(heading[2])
          .map((s) => s.text)
          .join(""),
      });
      continue;
    }
    if (QUOTE_RE.test(line)) {
      flushPara();
      flushList();
      blocks.push({
        type: "quote",
        segments: splitInlineEmphasis(line.replace(QUOTE_RE, "")),
      });
      continue;
    }
    if (BULLET_RE.test(line)) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.replace(BULLET_RE, ""));
      continue;
    }
    const ordered = ORDERED_RE.exec(line);
    if (ordered) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(ORDERED_RE, ""));
      continue;
    }
    flushList();
    para.push(stripStructuralPrefixes(line));
  }
  flushPara();
  flushList();
  return blocks;
};

// 内联编号清单（"1、…… 2、……" 挤在一行/一段里）→ 拆为 intro + items。
// 吸收 cbt parseAdviceList 的行为；标记 ≥2 才视为清单，避免误伤含年份/序数的正文。
export const parseInlineNumberedList = (
  raw: string,
): { intro: string; items: string[] } | null => {
  if (!raw) return null;
  const markRe = /(^|[\s。；;！!？?：:])(\d{1,2})\s*[、.)）]\s*/g;
  const marks = [...raw.matchAll(markRe)];
  if (marks.length < 2) return null;
  const first = marks[0];
  // 数字本体的起点：分隔标点归 intro，编号起 items。
  const numStart = (first.index ?? 0) + first[0].indexOf(first[2]);
  const intro = raw.slice(0, numStart).trim();
  const SENTINEL = "\u0000";
  const items = raw
    .slice(numStart)
    .replace(markRe, (_m, sep: string) => `${sep}${SENTINEL}`)
    .split(SENTINEL)
    .map((s) => s.trim().replace(/^[\s。；;！!？?：:]+|[。；;\s]+$/g, ""))
    .filter(Boolean);
  return items.length >= 2 ? { intro, items } : null;
};

// 按 heading 块分组：{heading, blocks[]}，heading 前的散块归入 fallback 组。
// 供「每个 ### 节 → 一个 LlmSection」的消费方使用（DetailModal 等）。
export interface LlmBlockGroup {
  heading: string;
  blocks: LlmBlock[];
}

export const groupLlmBlocks = (
  blocks: LlmBlock[],
  fallbackHeading: string,
): LlmBlockGroup[] => {
  const groups: LlmBlockGroup[] = [];
  let heading = "";
  let bucket: LlmBlock[] = [];
  const flush = () => {
    if (bucket.length) {
      groups.push({ heading: heading || fallbackHeading, blocks: bucket });
    }
    bucket = [];
  };
  for (const block of blocks) {
    if (block.type === "heading") {
      flush();
      heading = block.text;
      continue;
    }
    bucket.push(block);
  }
  flush();
  return groups;
};

// 纯文本便捷通道：只要干净文字（用于 title/summary 一类 prompt 已保证纯文本的字段，
// 兜底剥掉偶发记号）。替代旧 cleanMarkdownText 的消费场景。
export const toPlainText = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return normalizeLlmText(raw)
    .map((b) => {
      if (b.type === "heading") return b.text;
      if (b.type === "list") {
        return b.items.map((i) => i.map((s) => s.text).join("")).join(" · ");
      }
      return b.segments.map((s) => s.text).join("");
    })
    .join("\n")
    .trim();
};
