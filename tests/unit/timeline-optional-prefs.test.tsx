// @vitest-environment jsdom
// INPUT: <TimelineOptionalPrefs>。
// OUTPUT: B4' 可选偏好表单单测 —— 渲染 nickname/gender/save/skip；save 回传选中值(nickname trim)；skip 回传 default + onSkip。
// POS: B4' onboarding 流回归；TimelineOptionalPrefs 变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TimelineOptionalPrefs } from "../../components/timeline/TimelineOptionalPrefs";

describe("TimelineOptionalPrefs — B4' optional post-chart prefs", () => {
  it("renders nickname, gender options, and save/skip", () => {
    const { getByText, getByLabelText } = render(
      <TimelineOptionalPrefs onSave={vi.fn()} />,
    );
    expect(getByText(/optional details/i)).toBeTruthy();
    expect(getByLabelText(/nickname/i)).toBeTruthy();
    expect(getByText(/non-binary/i)).toBeTruthy();
    expect(getByText(/^save$/i)).toBeTruthy();
    expect(getByText(/^skip$/i)).toBeTruthy();
  });

  it("save returns the selected gender + trimmed nickname", () => {
    const onSave = vi.fn();
    const { getByText, getByLabelText } = render(
      <TimelineOptionalPrefs onSave={onSave} />,
    );
    fireEvent.change(getByLabelText(/nickname/i), {
      target: { value: "  Sam  " },
    });
    fireEvent.click(getByText(/female/i));
    fireEvent.click(getByText(/^save$/i));
    expect(onSave).toHaveBeenCalledWith({ gender: "female", nickname: "Sam" });
  });

  it("skip returns prefer-not-to-say defaults + fires onSkip", () => {
    const onSave = vi.fn();
    const onSkip = vi.fn();
    const { getByText } = render(
      <TimelineOptionalPrefs onSave={onSave} onSkip={onSkip} />,
    );
    fireEvent.click(getByText(/^skip$/i));
    expect(onSave).toHaveBeenCalledWith({ gender: "prefer_not_to_say" });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("a whitespace-only nickname is dropped (saved as undefined)", () => {
    const onSave = vi.fn();
    const { getByText, getByLabelText } = render(
      <TimelineOptionalPrefs onSave={onSave} />,
    );
    fireEvent.change(getByLabelText(/nickname/i), { target: { value: "   " } });
    fireEvent.click(getByText(/^save$/i));
    expect(onSave).toHaveBeenCalledWith({
      gender: "prefer_not_to_say",
      nickname: undefined,
    });
  });
});
