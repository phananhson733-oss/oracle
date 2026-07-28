// INPUT: 可选 gender / nickname（B4' onboarding 追加的可选档案字段）。
// OUTPUT: OnboardingPrefs 类型 + defaultOnboardingPrefs（prefer-not-to-say 默认）+ prefsForAnalytics（脱敏：值绝不外泄，只发布尔）+ hasAnyPref。
// POS: B4' onboarding 隐私契约核心（隐私红线 #1 / 计划 blocker #9）。gender/nickname 是 PII：**禁入 analytics、禁入日志**；
//      入缓存键须经 hashInput（后端）。本契约先于可视化流落地，把红线锁死再接 UI。

export type Gender = "female" | "male" | "nonbinary" | "prefer_not_to_say";

export interface OnboardingPrefs {
  gender: Gender; // 默认 prefer_not_to_say
  nickname?: string; // 可选，PII
}

export function defaultOnboardingPrefs(): OnboardingPrefs {
  return { gender: "prefer_not_to_say" };
}

export function hasAnyPref(prefs: OnboardingPrefs): boolean {
  return (
    prefs.gender !== "prefer_not_to_say" ||
    Boolean(prefs.nickname && prefs.nickname.trim())
  );
}

/**
 * 脱敏后的 analytics payload：gender / nickname 都是 PII → **只发"是否填了"的布尔，绝不发值**。
 * （对齐 analytics.ts 红线：允许 *_set 计数类，禁传 nickname/gender 原值。）
 */
export function prefsForAnalytics(prefs: OnboardingPrefs): {
  gender_set: boolean;
  nickname_set: boolean;
} {
  return {
    gender_set: prefs.gender !== "prefer_not_to_say",
    nickname_set: Boolean(prefs.nickname && prefs.nickname.trim()),
  };
}
