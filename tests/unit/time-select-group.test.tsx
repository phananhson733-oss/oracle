// @vitest-environment jsdom
// INPUT: <TimeSelectGroup> 共享表单原语。
// OUTPUT: jsdom specs —— 锁住"填了一半的时间必须被标记为 partial 而不是静默变成空串"这条契约，
//         以及 12 小时 ↔ 24 小时的往返换算（含 12AM=00 / 12PM=12 两个边界）。
// POS: 出生时间采集的行为契约。原生 <input type="time"> 在 en-US locale 下不选 AM/PM 会返回空串，
//      用户以为填了、程序记成"时间未知"，后端据此按正午出盘——本组件替换它。若组件变更，同步本测试。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimeSelectGroup } from "../../components/forms/TimeSelectGroup";

// 三个 select 的顺序：小时 / 分钟 / 上下午
const selects = () => screen.getAllByRole("combobox");
const pick = (index: number, value: string) =>
  fireEvent.change(selects()[index], { target: { value } });

const setup = (value = "") => {
  const onChange = vi.fn();
  render(
    <TimeSelectGroup value={value} onChange={onChange} idPrefix="t" />,
  );
  return onChange;
};

// onChange 的最后一次调用参数
const last = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls[fn.mock.calls.length - 1];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TimeSelectGroup — 完整选择", () => {
  it("三段都选齐后组合成 24 小时制 HH:mm", () => {
    const onChange = setup();
    pick(0, "7");
    pick(1, "15");
    pick(2, "PM");
    expect(last(onChange)).toEqual(["19:15", false]);
  });

  it("上午照常换算", () => {
    const onChange = setup();
    pick(0, "7");
    pick(1, "5");
    pick(2, "AM");
    expect(last(onChange)).toEqual(["07:05", false]);
  });

  it("12 AM 是午夜 00 点，不是 12 点", () => {
    const onChange = setup();
    pick(0, "12");
    pick(1, "30");
    pick(2, "AM");
    expect(last(onChange)).toEqual(["00:30", false]);
  });

  it("12 PM 是正午 12 点", () => {
    const onChange = setup();
    pick(0, "12");
    pick(1, "0");
    pick(2, "PM");
    expect(last(onChange)).toEqual(["12:00", false]);
  });
});

describe("TimeSelectGroup — 部分选择必须可见（这是原 bug 的病灶）", () => {
  it("只选了小时和分钟、漏掉 AM/PM 时，标记为 partial", () => {
    const onChange = setup();
    pick(0, "7");
    pick(1, "15");
    // 故意不选 AM/PM —— 这正是原生 <input type="time"> 静默吞掉时间的场景
    const [value, isPartial] = last(onChange);
    expect(value).toBe("");
    expect(
      isPartial,
      "填了一半却报告 isPartial=false，调用方无从知道用户其实填了时间",
    ).toBe(true);
  });

  it("只选了小时也算 partial", () => {
    const onChange = setup();
    pick(0, "7");
    expect(last(onChange)).toEqual(["", true]);
  });

  it("只选了 AM/PM 也算 partial", () => {
    const onChange = setup();
    pick(2, "PM");
    expect(last(onChange)).toEqual(["", true]);
  });

  it("三段都没选 = 真正的「时间未知」，不是 partial", () => {
    const onChange = setup();
    pick(0, "7");
    pick(0, ""); // 选回占位符
    expect(last(onChange)).toEqual(["", false]);
  });

  it("从 partial 补齐到完整后，partial 标记必须落回 false", () => {
    const onChange = setup();
    pick(0, "9");
    pick(1, "45");
    expect(last(onChange)).toEqual(["", true]);
    pick(2, "AM");
    expect(last(onChange)).toEqual(["09:45", false]);
  });
});

describe("TimeSelectGroup — 受控回显", () => {
  it("用 24 小时制的初值预填三个 select", () => {
    setup("19:15");
    const [h, m, ap] = selects() as HTMLSelectElement[];
    expect(h.value).toBe("7");
    expect(m.value).toBe("15");
    expect(ap.value).toBe("PM");
  });

  it("00:30 回显为 12:30 AM", () => {
    setup("00:30");
    const [h, m, ap] = selects() as HTMLSelectElement[];
    expect(h.value).toBe("12");
    expect(m.value).toBe("30");
    expect(ap.value).toBe("AM");
  });

  it("空初值时三个 select 都停在占位符", () => {
    setup("");
    for (const s of selects() as HTMLSelectElement[]) {
      expect(s.value).toBe("");
    }
  });
});

describe("TimeSelectGroup — 无障碍", () => {
  it("三个 select 都有 aria-label，外层是带标签的 group", () => {
    setup();
    expect(screen.getByRole("group", { name: /birth time/i })).toBeTruthy();
    expect(screen.getByLabelText(/hour/i)).toBeTruthy();
    expect(screen.getByLabelText(/minute/i)).toBeTruthy();
  });
});
