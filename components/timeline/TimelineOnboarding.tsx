// INPUT: useLanguage/useTheme；getTimelineCopy；localStorage（首访标记）。
// OUTPUT: 首次进入月度 K 线的安全 onboarding（3 屏：loud vs quiet 非好坏 / 两种能量 / 节奏非命运）。
// POS: AI 安全红线落地（Empowerment over Fatalism）。首访强制一次，之后 localStorage 跳过（#5）。

import React, { useState } from "react";
import { useLanguage, useTheme } from "../UIComponents";
import { getTimelineCopy } from "./copy";

const STORAGE_KEY = "astro_timeline_onboarded";

export function hasSeenTimelineOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface TimelineOnboardingProps {
  onDone: () => void;
}

export const TimelineOnboarding: React.FC<TimelineOnboardingProps> = ({ onDone }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = getTimelineCopy(language);
  const [step, setStep] = useState(0);

  const screens = [
    { title: c.onbTitle1, body: c.onbBody1 },
    { title: c.onbTitle2, body: c.onbBody2 },
    { title: c.onbTitle3, body: c.onbBody3 },
  ];
  const isLast = step === screens.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore quota / privacy-mode */
    }
    onDone();
  };

  const panelTone = isLight ? "bg-paper-100 text-paper-900" : "bg-space-950 text-star-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className={`relative w-full max-w-sm rounded-2xl p-6 shadow-xl ${panelTone}`}>
        <div className="flex gap-1.5 mb-4" aria-hidden="true">
          {screens.map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i <= step ? "#A855F7" : "#E2E8F0" }}
            />
          ))}
        </div>
        <h2 className="text-xl font-semibold mb-2">{screens[step].title}</h2>
        <p className="text-sm leading-relaxed text-slate-500">{screens[step].body}</p>
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="mt-6 w-full rounded-lg bg-psycho-600 py-2.5 text-sm font-medium text-white hover:bg-psycho-700"
        >
          {isLast ? c.onbGotIt : c.onbNext}
        </button>
      </div>
    </div>
  );
};
