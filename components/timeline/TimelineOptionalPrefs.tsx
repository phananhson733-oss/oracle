// INPUT: onSave(prefs) / onSkip 回调、useLanguage、copy.ts、onboardingPrefs（类型 + 默认）。
// OUTPUT: B4' post-chart 可选偏好表单 —— nickname(可选) + gender(默认 prefer-not-to-say) + Save/Skip。
// POS: B4' onboarding 流（提前+裁剪：不堆前置墙，chart 之后才可选填）。隐私红线：值只留客户端 + 经 onSave 交给上层；
//      analytics 只发 prefsForAnalytics 的布尔（绝不发 gender/nickname 原值，blocker #9）。

import React, { useState } from "react";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";
import {
  type OnboardingPrefs,
  type Gender,
  defaultOnboardingPrefs,
} from "./onboardingPrefs";

export const TimelineOptionalPrefs: React.FC<{
  onSave: (prefs: OnboardingPrefs) => void;
  onSkip?: () => void;
}> = ({ onSave, onSkip }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  const [gender, setGender] = useState<Gender>("prefer_not_to_say");
  const [nickname, setNickname] = useState("");
  // 默认折叠：登录用户不该被表单"挡着要填"——只显示低调可选入口，点开才展开表单（用户反馈）。
  const [expanded, setExpanded] = useState(false);

  const genderOptions: Array<{ value: Gender; label: string }> = [
    { value: "female", label: c.genderFemale },
    { value: "male", label: c.genderMale },
    { value: "nonbinary", label: c.genderNonbinary },
    { value: "prefer_not_to_say", label: c.genderPreferNot },
  ];

  // 折叠态（默认）：一行低调可选入口，不打扰已登录用户。
  if (!expanded) {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
        >
          {c.prefsExpandCta}
        </button>
      </div>
    );
  }

  return (
    <section
      className="mt-5 rounded-xl border border-slate-200 p-4"
      aria-label={c.prefsTitle}
    >
      <p className="text-sm font-medium text-slate-700">{c.prefsTitle}</p>
      <p className="mt-1 text-xs text-slate-400">{c.prefsNote}</p>

      <label className="mt-3 block text-xs text-slate-500">
        {c.nicknameLabel}
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
        />
      </label>

      <fieldset className="mt-3">
        <legend className="text-xs text-slate-500">{c.genderLabel}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {genderOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={gender === o.value}
              onClick={() => setGender(o.value)}
              className={`rounded-full px-3 py-1 text-xs ${
                gender === o.value
                  ? "bg-psycho-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({ gender, nickname: nickname.trim() || undefined })
          }
          className="rounded-lg bg-psycho-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-psycho-500"
        >
          {c.prefsSave}
        </button>
        <button
          type="button"
          onClick={() => {
            onSave(defaultOnboardingPrefs());
            onSkip?.();
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          {c.prefsSkip}
        </button>
      </div>
    </section>
  );
};
