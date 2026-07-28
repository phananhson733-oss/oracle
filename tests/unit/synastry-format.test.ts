// INPUT: pages/synastry/format.ts 的纯函数 formatTemperamentElements / formatTemperamentModalities。
// OUTPUT: 验证元素/模式权重对象的本地化格式化（排序、zh/en 映射、回退、非对象输入）行为，守护从 SynastryPage 抽取后的等价性。
// POS: 守护 synastry temperament 格式化 helper。若改 format.ts 的签名或映射规则，同步此测试。

import { describe, it, expect } from "vitest";
import {
  formatTemperamentElements,
  formatTemperamentModalities,
} from "../../pages/synastry/format";

describe("formatTemperamentElements", () => {
  it("falsy 输入返回空串", () => {
    expect(formatTemperamentElements(undefined, "en")).toBe("");
    expect(formatTemperamentElements(null, "zh")).toBe("");
    expect(formatTemperamentElements(0, "en")).toBe("");
    expect(formatTemperamentElements("", "en")).toBe("");
  });

  it("字符串输入原样返回", () => {
    expect(formatTemperamentElements("Fire dominant", "en")).toBe(
      "Fire dominant",
    );
  });

  it("非对象非字符串输入用 String() 包装", () => {
    expect(formatTemperamentElements(42, "en")).toBe("42");
    expect(formatTemperamentElements(true, "zh")).toBe("true");
  });

  it("空对象返回空串", () => {
    expect(formatTemperamentElements({}, "en")).toBe("");
  });

  it("按权重降序映射为英文标签", () => {
    expect(
      formatTemperamentElements({ fire: 1, earth: 3, air: 2, water: 0 }, "en"),
    ).toBe("Earth · Air · Fire · Water");
  });

  it("按权重降序映射为中文标签", () => {
    expect(
      formatTemperamentElements({ fire: 5, water: 4, earth: 1 }, "zh"),
    ).toBe("火 · 水 · 土");
  });

  it("大小写不敏感的键归一化", () => {
    expect(formatTemperamentElements({ FIRE: 2, Earth: 1 }, "en")).toBe(
      "Fire · Earth",
    );
  });

  it("未知键回退到原始键名", () => {
    expect(formatTemperamentElements({ plasma: 3, fire: 1 }, "en")).toBe(
      "plasma · Fire",
    );
  });

  it("缺失权重按 0 处理参与排序", () => {
    expect(
      formatTemperamentElements(
        { fire: undefined as unknown as number, earth: 1 },
        "en",
      ),
    ).toBe("Earth · Fire");
  });
});

describe("formatTemperamentModalities", () => {
  it("falsy 输入返回空串", () => {
    expect(formatTemperamentModalities(undefined, "en")).toBe("");
    expect(formatTemperamentModalities(null, "zh")).toBe("");
  });

  it("字符串输入原样返回", () => {
    expect(formatTemperamentModalities("Cardinal heavy", "en")).toBe(
      "Cardinal heavy",
    );
  });

  it("非对象非字符串输入用 String() 包装", () => {
    expect(formatTemperamentModalities(7, "en")).toBe("7");
  });

  it("空对象返回空串", () => {
    expect(formatTemperamentModalities({}, "zh")).toBe("");
  });

  it("按权重降序映射为英文标签", () => {
    expect(
      formatTemperamentModalities(
        { cardinal: 1, fixed: 3, mutable: 2 },
        "en",
      ),
    ).toBe("Fixed · Mutable · Cardinal");
  });

  it("按权重降序映射为中文标签", () => {
    expect(
      formatTemperamentModalities({ cardinal: 4, mutable: 2, fixed: 1 }, "zh"),
    ).toBe("本位 · 变动 · 固定");
  });

  it("大小写不敏感 + 未知键回退", () => {
    expect(
      formatTemperamentModalities({ FIXED: 2, wobbly: 5 }, "en"),
    ).toBe("wobbly · Fixed");
  });
});
