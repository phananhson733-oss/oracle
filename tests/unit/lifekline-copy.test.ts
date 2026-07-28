// @vitest-environment node
// INPUT: components/timeline/lifekline/lifeKlineCopy.ts 的 getLifeKlineCopy / fmt。
// OUTPUT: lifekline 文案守卫单测——EN/ZH 键对称、禁干支/大运/吉凶、EN 禁宿命词与 k-line、
//         cycleCue approx 语义、CTA 非支付措辞、fmt 占位符替换。
// POS: lifekline 呈现层文案回归守卫；lifeKlineCopy.ts 变更须同步本测试。

import { describe, expect, it } from "vitest";
import {
  fmt,
  getLifeKlineCopy,
} from "../../components/timeline/lifekline/lifeKlineCopy";

const en = getLifeKlineCopy("en");
const zh = getLifeKlineCopy("zh");

// 递归收集全部 key path（对象按 key、数组按下标），用于结构对称比较。
function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectKeyPaths(item, `${prefix}[${index}]`),
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value)
      .sort()
      .flatMap((key) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return [
          path,
          ...collectKeyPaths((value as Record<string, unknown>)[key], path),
        ];
      });
  }
  return [];
}

// 递归收集全部叶子字符串。
function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe("lifeKlineCopy 结构对称", () => {
  it("EN 与 ZH 字典的键集合完全一致（递归）", () => {
    expect(collectKeyPaths(en)).toEqual(collectKeyPaths(zh));
  });

  it("paywall.items 两边都是 4 项", () => {
    expect(en.paywall.items).toHaveLength(4);
    expect(zh.paywall.items).toHaveLength(4);
  });
});

describe("lifeKlineCopy 内容红线（干支/大运/吉凶）", () => {
  const serializedEn = JSON.stringify(en);
  const serializedZh = JSON.stringify(zh);

  it("全字典不含天干字符", () => {
    expect(serializedEn).not.toMatch(/[甲乙丙丁戊己庚辛壬癸]/);
    expect(serializedZh).not.toMatch(/[甲乙丙丁戊己庚辛壬癸]/);
  });

  it("全字典不含大运字样", () => {
    expect(serializedEn).not.toMatch(/大运/);
    expect(serializedZh).not.toMatch(/大运/);
  });

  it("全字典不含吉/凶字样", () => {
    expect(serializedEn).not.toMatch(/[吉凶]/);
    expect(serializedZh).not.toMatch(/[吉凶]/);
  });
});

describe("lifeKlineCopy EN 安全语言（禁宿命词）", () => {
  const bannedFatalism = /\b(will|must|destined|guaranteed)\b/i;
  // 唯一豁免：modal.comingSoonBody 中明示不发生支付的合规句（计划钦定原文）。
  const allowedPhrase = /no payment will be taken/i;

  it("全部 EN 文案不含 will/must/destined/guaranteed（词边界）", () => {
    const offenders = collectStrings(en)
      .map((text) => text.replace(allowedPhrase, ""))
      .filter((text) => bannedFatalism.test(text));
    expect(offenders).toEqual([]);
  });

  it("词边界不误伤 willing/willingness 类词", () => {
    expect(bannedFatalism.test("a willingness to adjust")).toBe(false);
    expect(bannedFatalism.test("goodwill and mustard")).toBe(false);
    expect(bannedFatalism.test("this will happen")).toBe(true);
  });

  it("抽查：EN interpretation 全部使用倾向语言（may/tends/could/often）", () => {
    for (const text of Object.values(en.interpretation)) {
      expect(text).toMatch(/\b(may|might|tends?|could|often)\b/i);
    }
  });

  it("comingSoonBody 明示 coming soon 且承诺无支付", () => {
    expect(en.modal.comingSoonBody).toMatch(/coming soon/i);
    expect(en.modal.comingSoonBody).toMatch(/no payment will be taken/i);
  });
});

describe("lifeKlineCopy ZH 安全语言（禁宿命词）", () => {
  it("全部 ZH 文案不含 一定会/必然/注定", () => {
    const offenders = collectStrings(zh).filter((text) =>
      /一定会|必然|注定/.test(text),
    );
    expect(offenders).toEqual([]);
  });
});

describe("lifeKlineCopy 新增键存在且 EN/ZH 对称", () => {
  it("footer.emptyNote / moduleDetail.unlockShort / nodePanel.youAreHere 两边都是非空字符串", () => {
    for (const dict of [en, zh]) {
      expect(dict.footer.emptyNote.length).toBeGreaterThan(0);
      expect(dict.moduleDetail.unlockShort.length).toBeGreaterThan(0);
      expect(dict.nodePanel.youAreHere.length).toBeGreaterThan(0);
    }
  });
});

describe("lifeKlineCopy EN SEO 守卫", () => {
  it("全部 EN 文案不含 k-line / kline 字样", () => {
    const offenders = collectStrings(en).filter((text) =>
      /k-?line/i.test(text),
    );
    expect(offenders).toEqual([]);
  });
});

describe("lifeKlineCopy cycleCue approx 语义", () => {
  const markerKeys = [
    "saturnReturn",
    "jupiterReturn",
    "nodalReturn",
    "uranusOpposition",
    "midlife",
  ] as const;

  it("EN marker 类条目全部带 approx 语义", () => {
    for (const key of markerKeys) {
      expect(en.cycleCue[key]).toMatch(/approx/i);
    }
  });

  it("ZH marker 类条目全部带近似语义", () => {
    for (const key of markerKeys) {
      expect(zh.cycleCue[key]).toMatch(/近似|大约|约/);
    }
  });
});

describe("lifeKlineCopy fake-door CTA 非支付措辞", () => {
  it("EN 的 CTA / 按钮文案不含 payment/pay 措辞", () => {
    const ctas = [
      en.paywall.unlockCta,
      en.paywall.includedCta,
      en.modal.primaryCta,
      en.modal.close,
      en.modal.createYourOwn,
      en.moduleDetail.unlockFmt,
    ];
    for (const text of ctas) {
      expect(text).not.toMatch(/\bpay(ment)?\b/i);
    }
    expect(en.modal.primaryCta).toBe("Register interest");
    expect(en.paywall.unlockCta).toBe("Register interest");
    expect(en.paywall.includedCta).toBe("See what's planned");
  });

  it("ZH 的 CTA / 按钮文案不含支付/付款措辞", () => {
    const ctas = [
      zh.paywall.unlockCta,
      zh.paywall.includedCta,
      zh.modal.primaryCta,
      zh.modal.close,
      zh.modal.createYourOwn,
      zh.moduleDetail.unlockFmt,
    ];
    for (const text of ctas) {
      expect(text).not.toMatch(/支付|付款|付费/);
    }
  });
});

describe("lifeKlineCopy header 锚定", () => {
  it("EN 块标题为 Life Energy Chart · Ages 0–99（不含 K 线字样）", () => {
    expect(en.header.title).toBe("Life Energy Chart · Ages 0–99");
    expect(en.header.subhead).toBe("RELATIVE TO YOUR OWN BASELINE");
  });
});

describe("fmt 模板替换", () => {
  it("替换 {age} / {year} / {phase} 占位符", () => {
    expect(fmt("Pinned age {age}", { age: 38 })).toBe("Pinned age 38");
    expect(
      fmt("Age {age} · {year} · {phase}", {
        age: 0,
        year: 1988,
        phase: "Roots",
      }),
    ).toBe("Age 0 · 1988 · Roots");
  });

  it("对字典里的真实模板生效", () => {
    expect(fmt(en.toast.pinnedFmt, { age: 29 })).toBe("Pinned age 29");
    expect(fmt(zh.toast.selectedFmt, { age: 61 })).toBe("已选择 61 岁");
    expect(fmt(en.tooltip.ageFmt, { age: 42 })).toBe("(Age 42)");
  });

  it("未提供的占位符原样保留，不抛错", () => {
    expect(fmt("Ages {n} and {age}", { age: 9 })).toBe("Ages {n} and 9");
    expect(fmt("no placeholders", {})).toBe("no placeholders");
  });
});
