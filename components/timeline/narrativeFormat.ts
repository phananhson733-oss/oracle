// INPUT: LLM 人生叙事章节纯文本（timeline-life-narrative prompt 输出，v1.1 起自带 \n\n 分段与 **重点** 标记）。
// OUTPUT: splitNarrativeParagraphs（段落拆分 + 旧缓存整块文本的按句回退分段）+ parseEmphasisSegments（受控 **…** 加粗解析，零 HTML 注入面）。
// POS: TimelineLifeNarrative 的排版预处理纯函数层（可独立单测）；渲染仍由 React 文本节点承担转义。若更新此文件，务必更新本头注释与所属 FOLDER.md。

export interface EmphasisSegment {
  text: string;
  strong: boolean;
}

// 旧缓存/不合规输出的回退分段粒度：每 3 句合成一段（中英句读均识别）。
const FALLBACK_SENTENCES_PER_PARAGRAPH = 3;
// 短文本不值得强拆：低于该长度的单块原样返回。
const FALLBACK_MIN_CHARS = 160;

// 句子切分：吃到下一个终止符（。！？.!?）及其后跟的引号/括号收尾。
const SENTENCE_RE = /[^。！？.!?]+[。！？.!?]+[”"』」）)]*/g;

/**
 * 把一章叙事文本拆成段落数组。
 * 优先按空行（\n{2,}）切；只有一整块时按句子每 3 句回退分段——
 * 兼容 v1.0 旧缓存（prompt 未要求分段）与偶发不带空行的 LLM 输出。
 */
export function splitNarrativeParagraphs(text: string): string[] {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return [];
  const byBlankLine = trimmed
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;

  const block = byBlankLine[0] ?? trimmed;
  if (block.length < FALLBACK_MIN_CHARS) return [block];
  const sentences = block.match(SENTENCE_RE);
  if (!sentences || sentences.length <= FALLBACK_SENTENCES_PER_PARAGRAPH) {
    return [block];
  }
  const paragraphs: string[] = [];
  for (
    let i = 0;
    i < sentences.length;
    i += FALLBACK_SENTENCES_PER_PARAGRAPH
  ) {
    paragraphs.push(
      sentences
        .slice(i, i + FALLBACK_SENTENCES_PER_PARAGRAPH)
        .join("")
        .trim(),
    );
  }
  // 正则可能吃不到无终止符的结尾残句：补回去，避免静默丢字。
  const consumed = sentences.join("").length;
  const rest = block.slice(consumed).trim();
  if (rest) paragraphs.push(rest);
  return paragraphs.filter(Boolean);
}

/**
 * 解析段落内受控的 **重点** 标记为分段列表（strong=true 的段渲染为 <strong>）。
 * 未闭合的 ** 原样保留为普通文本；渲染端始终走 React 文本节点，无注入面。
 */
export function parseEmphasisSegments(paragraph: string): EmphasisSegment[] {
  const segments: EmphasisSegment[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  for (
    let m = re.exec(paragraph);
    m !== null;
    m = re.exec(paragraph)
  ) {
    if (m.index > last) {
      segments.push({ text: paragraph.slice(last, m.index), strong: false });
    }
    segments.push({ text: m[1], strong: true });
    last = m.index + m[0].length;
  }
  if (last < paragraph.length) {
    segments.push({ text: paragraph.slice(last), strong: false });
  }
  return segments.length ? segments : [{ text: paragraph, strong: false }];
}
