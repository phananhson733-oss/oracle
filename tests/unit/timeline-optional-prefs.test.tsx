// @vitest-environment jsdom
// INPUT: <TimelineOptionalPrefs>。
// OUTPUT: B4' 可选偏好表单单测 —— 默认折叠为低调入口；点开后渲染 nickname/gender/save/skip；save 回传选中值(nickname trim)；skip 回传 default + onSkip。
// POS: B4' onboarding 流回归；TimelineOptionalPrefs 变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TimelineOptionalPrefs } from "../../components/timeline/TimelineOptionalPrefs";

// 默认折叠：先点低调入口展开表单（用户反馈——登录用户不该被表单挡着要填）。
const expand = (utils: ReturnType<typeof render>) =>
  fireEvent.click(utils.getByText(/make it yours/i));

describe("TimelineOptionalPrefs — B4' optional post-chart prefs", () => {
  it("defaults to a collapsed low-key entry (does not block logged-in users with a form)", () => {
    const { getByText, queryByLabelText } = render(
      <TimelineOptionalPrefs onSave={vi.fn()} />,
    );
    expect(getByText(/make it yours/i)).toBeTruthy(); // 折叠入口可见
    expect(queryByLabelText(/nickname/i)).toBeNull(); // 表单未展开
  });

  it("expands to nickname, gender options, and save/skip after clicking the entry", () => {
    const utils = render(<TimelineOptionalPrefs onSave={vi.fn()} />);
    expand(utils);
    expect(utils.getByText(/optional details/i)).toBeTruthy();
    expect(utils.getByLabelText(/nickname/i)).toBeTruthy();
    expect(utils.getByText(/non-binary/i)).toBeTruthy();
    expect(utils.getByText(/^save$/i)).toBeTruthy();
    expect(utils.getByText(/^skip$/i)).toBeTruthy();
  });

  it("save returns the selected gender + trimmed nickname", () => {
    const onSave = vi.fn();
    const utils = render(<TimelineOptionalPrefs onSave={onSave} />);
    expand(utils);
    fireEvent.change(utils.getByLabelText(/nickname/i), {
      target: { value: "  Sam  " },
    });
    fireEvent.click(utils.getByText(/female/i));
    fireEvent.click(utils.getByText(/^save$/i));
    expect(onSave).toHaveBeenCalledWith({ gender: "female", nickname: "Sam" });
  });

  it("skip returns prefer-not-to-say defaults + fires onSkip", () => {
    const onSave = vi.fn();
    const onSkip = vi.fn();
    const utils = render(
      <TimelineOptionalPrefs onSave={onSave} onSkip={onSkip} />,
    );
    expand(utils);
    fireEvent.click(utils.getByText(/^skip$/i));
    expect(onSave).toHaveBeenCalledWith({ gender: "prefer_not_to_say" });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("a whitespace-only nickname is dropped (saved as undefined)", () => {
    const onSave = vi.fn();
    const utils = render(<TimelineOptionalPrefs onSave={onSave} />);
    expand(utils);
    fireEvent.change(utils.getByLabelText(/nickname/i), {
      target: { value: "   " },
    });
    fireEvent.click(utils.getByText(/^save$/i));
    expect(onSave).toHaveBeenCalledWith({
      gender: "prefer_not_to_say",
      nickname: undefined,
    });
  });
});
