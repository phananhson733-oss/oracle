// INPUT: components/timeline/narrativeFormat.ts（叙事排版纯函数）。
// OUTPUT: 段落拆分（空行优先/旧缓存整块按句回退/短文本不拆/残句不丢）与 **重点** 解析（闭合/未闭合/多段）单测。
// POS: 人生叙事排版层的回归基线；narrativeFormat 行为变更必须同步本测试。

import { describe, expect, it } from "vitest";
import {
  parseEmphasisSegments,
  splitNarrativeParagraphs,
} from "../../components/timeline/narrativeFormat";

describe("splitNarrativeParagraphs", () => {
  it("splits on blank lines and collapses inner single newlines", () => {
    const text =
      "第一段第一句。\n跨行同段。\n\n第二段内容。\n\n\nThird paragraph.";
    expect(splitNarrativeParagraphs(text)).toEqual([
      "第一段第一句。 跨行同段。",
      "第二段内容。",
      "Third paragraph.",
    ]);
  });

  it("returns [] for empty/whitespace input", () => {
    expect(splitNarrativeParagraphs("")).toEqual([]);
    expect(splitNarrativeParagraphs("  \n ")).toEqual([]);
  });

  it("keeps a short single block intact (no forced chunking)", () => {
    const text = "很短的一段。只有两句。";
    expect(splitNarrativeParagraphs(text)).toEqual([text]);
  });

  it("falls back to sentence chunking for a long single block (v1.0 cached content)", () => {
    const sentence =
      "这是一个足够长的句子，用来模拟旧缓存里没有任何空行的整块叙事文本。";
    const block = sentence.repeat(7);
    const paras = splitNarrativeParagraphs(block);
    expect(paras.length).toBe(3); // 7 句按 3 句/段 → 3+3+1
    expect(paras.join("")).toBe(block); // 不丢字
  });

  it("chunks mixed zh/en punctuation and keeps a trailing fragment without a terminator", () => {
    const block =
      "First sentence one is deliberately made long enough to matter. Second sentence here keeps going with more words! Third sentence now asks a question about the energy arc? 第四句在这里继续描述能量质地的变化与展开。第五句继续说明这一阶段可能的感受与节奏。第六句收尾并把整体基调稳定下来。还有一个没有句号的残句尾巴";
    const paras = splitNarrativeParagraphs(block);
    expect(paras.length).toBeGreaterThanOrEqual(2);
    expect(paras[paras.length - 1]).toContain("残句尾巴");
    expect(paras.join("").replace(/\s+/g, "")).toBe(block.replace(/\s+/g, ""));
  });
});

describe("parseEmphasisSegments", () => {
  it("parses **...** into strong segments in order", () => {
    expect(parseEmphasisSegments("前缀 **重点短语** 后缀")).toEqual([
      { text: "前缀 ", strong: false },
      { text: "重点短语", strong: true },
      { text: " 后缀", strong: false },
    ]);
  });

  it("handles multiple emphases and plain-only text", () => {
    const segs = parseEmphasisSegments("**A** mid **B**");
    expect(segs).toEqual([
      { text: "A", strong: true },
      { text: " mid ", strong: false },
      { text: "B", strong: true },
    ]);
    expect(parseEmphasisSegments("plain only")).toEqual([
      { text: "plain only", strong: false },
    ]);
  });

  it("leaves unclosed ** as literal text (no crash, no injection surface)", () => {
    expect(parseEmphasisSegments("坏标记 **没闭合")).toEqual([
      { text: "坏标记 **没闭合", strong: false },
    ]);
  });
});
