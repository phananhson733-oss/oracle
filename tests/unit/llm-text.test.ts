// INPUT: services/llmText.ts。
// OUTPUT: LLM 文本规整层的契约测试（结构前缀剥离/段落合并/清单解析/内联强调/残留指令过滤）。
// POS: 全站 12+ 手搓解析器收编后的唯一规整层，此处钉死其行为契约。

import { describe, it, expect } from "vitest";
import {
  normalizeLlmText,
  stripStructuralPrefixes,
  splitInlineEmphasis,
  parseInlineNumberedList,
  toPlainText,
  groupLlmBlocks,
} from "../../services/llmText";

describe("stripStructuralPrefixes（prompt 结构词不泄漏）", () => {
  it("剥离行首 Key:/Mechanism:/Action: 前缀", () => {
    expect(
      stripStructuralPrefixes("Key: The Moon square creates tension"),
    ).toBe("The Moon square creates tension");
    expect(stripStructuralPrefixes("Mechanism: it works")).toBe("it works");
    expect(stripStructuralPrefixes("行动：每天记录情绪")).toBe("每天记录情绪");
  });

  it("不误伤正文中段的冒号", () => {
    expect(stripStructuralPrefixes("Note this: keep it")).toBe(
      "Note this: keep it",
    );
  });
});

describe("normalizeLlmText（结构块解析）", () => {
  it("### 标题 + '-' 清单（DETAIL_OUTPUT_INSTRUCTION 契约形状）", () => {
    const blocks = normalizeLlmText(
      "### Key Takeaways\n- Key: first point\n- Key: second point\n\n### Action Steps\n- Action: do a thing",
    );
    expect(blocks[0]).toEqual({
      type: "heading",
      level: 3,
      text: "Key Takeaways",
    });
    expect(blocks[1].type).toBe("list");
    if (blocks[1].type === "list") {
      expect(blocks[1].items.map((i) => i.map((s) => s.text).join(""))).toEqual(
        ["first point", "second point"],
      );
    }
    expect(blocks[2]).toEqual({
      type: "heading",
      level: 3,
      text: "Action Steps",
    });
  });

  it("空行切段；中文相邻行合并不插 ASCII 空格", () => {
    const blocks = normalizeLlmText("月亮落在双鱼，\n情绪像潮汐。\n\n第二段。");
    expect(blocks).toHaveLength(2);
    if (blocks[0].type === "paragraph") {
      expect(blocks[0].segments[0].text).toBe("月亮落在双鱼，情绪像潮汐。");
    }
  });

  it("英文相邻行以空格合并", () => {
    const blocks = normalizeLlmText("line one\nline two");
    if (blocks[0].type === "paragraph") {
      expect(blocks[0].segments[0].text).toBe("line one line two");
    }
  });

  it("编号清单行解析为 ordered list", () => {
    const blocks = normalizeLlmText("1. first\n2. second\n3. third");
    expect(blocks[0].type).toBe("list");
    if (blocks[0].type === "list") {
      expect(blocks[0].ordered).toBe(true);
      expect(blocks[0].items).toHaveLength(3);
    }
  });

  it("> 引言行解析为 quote", () => {
    const blocks = normalizeLlmText("> what story do you tell yourself?");
    expect(blocks[0].type).toBe("quote");
  });

  it("过滤 LLM 续写指令残留行", () => {
    const blocks = normalizeLlmText("正文内容。\n\n请继续\n\n更多正文。");
    expect(blocks).toHaveLength(2);
  });

  it("空输入返回空数组", () => {
    expect(normalizeLlmText("")).toEqual([]);
    expect(normalizeLlmText(null)).toEqual([]);
    expect(normalizeLlmText(undefined)).toEqual([]);
  });
});

describe("splitInlineEmphasis（**强调** 保留为语义段）", () => {
  it("**bold** 变 emphasis segment，其余记号剥除", () => {
    const segs = splitInlineEmphasis("plain **bold** and `code` after");
    expect(segs).toEqual([
      { text: "plain " },
      { text: "bold", emphasis: true },
      { text: " and code after" },
    ]);
  });

  it("无记号文本原样单段", () => {
    expect(splitInlineEmphasis("清水正文")).toEqual([{ text: "清水正文" }]);
  });
});

describe("parseInlineNumberedList（内联挤行编号清单）", () => {
  it("'1、…2、…' 拆为 items（吸收 cbt parseAdviceList 行为）", () => {
    const res = parseInlineNumberedList(
      "建议如下：1、每天记录情绪 2、睡前冥想十分钟 3、周末复盘",
    );
    expect(res).not.toBeNull();
    expect(res!.items).toHaveLength(3);
    expect(res!.items[1]).toBe("睡前冥想十分钟");
  });

  it("英文条目含空格不被打碎（sentinel 回归钉）", () => {
    const res = parseInlineNumberedList(
      "Try these: 1. keep a daily journal 2. breathe before speaking 3. review weekly",
    );
    expect(res).not.toBeNull();
    expect(res!.items).toEqual([
      "keep a daily journal",
      "breathe before speaking",
      "review weekly",
    ]);
  });

  it("单个数字标记不触发（防误伤年份/序数正文）", () => {
    expect(parseInlineNumberedList("在 2026 年 3. 月发生")).toBeNull();
    expect(parseInlineNumberedList("plain sentence")).toBeNull();
  });
});

describe("groupLlmBlocks（heading 分组）", () => {
  it("### 节各成一组，无标题前置块归 fallback 组", () => {
    const blocks = normalizeLlmText(
      "开场段落。\n\n### 核心观点\n- 第一点\n\n### 可执行建议\n- 去做",
    );
    const groups = groupLlmBlocks(blocks, "Interpretation");
    expect(groups.map((g: { heading: string }) => g.heading)).toEqual([
      "Interpretation",
      "核心观点",
      "可执行建议",
    ]);
    expect(groups[1].blocks[0].type).toBe("list");
  });
});

describe("toPlainText（title/summary 纯文本通道）", () => {
  it("剥掉偶发 markdown 记号", () => {
    expect(toPlainText("**Moon-Mercury Square**: Tension")).toBe(
      "Moon-Mercury Square: Tension",
    );
  });
});
