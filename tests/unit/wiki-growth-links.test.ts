// @vitest-environment node
// INPUT: Haaland/Mbappé 中英文 WikiArticle 内容源。
// OUTPUT: 守护工具型 CTA 文案直达对应语言 birth-chart-calculator，教程型链接不被机械替换。
// POS: 需求清单 P0 上线前置的内容内链回归；修改指定文章 CTA 链接时同步本测试。

import { describe, expect, it } from "vitest";
import {
  erlingHaalandBirthChartEn,
  erlingHaalandBirthChartZh,
} from "../../data/articles/erling-haaland-birth-chart";
import {
  mbappeBirthChartEn,
  mbappeBirthChartZh,
} from "../../data/articles/mbappe-birth-chart";

const toolCtaTarget = (
  content: string,
  labelPattern: RegExp,
): string | null => {
  const markdownLink = new RegExp(`\\[${labelPattern.source}\\]\\(([^)]+)\\)`, "i");
  return content.match(markdownLink)?.[1] ?? null;
};

describe("精选名人文章的 Wiki→工具内链", () => {
  it.each([
    [erlingHaalandBirthChartEn.content, /Open the free birth chart calculator/, "/en/birth-chart-calculator"],
    [erlingHaalandBirthChartZh.content, /生成你的免费星盘/, "/zh/birth-chart-calculator"],
    [mbappeBirthChartEn.content, /Generate your free birth chart/, "/en/birth-chart-calculator"],
    [mbappeBirthChartZh.content, /生成你的免费出生星盘/, "/zh/birth-chart-calculator"],
  ] as const)("工具型 CTA 指向对应语言计算器", (content, label, expected) => {
    expect(toolCtaTarget(content, label)).toBe(expected);
  });

  it("Haaland 的教程型教育链接仍保留，未做全文件机械替换", () => {
    expect(erlingHaalandBirthChartEn.content).toContain(
      "/en/wiki/world-cup-2026-astrology-prediction",
    );
  });
});
