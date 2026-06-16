// INPUT: 选中日期 + UserProfile；fetchDailyDetail（复用 /api/daily/detail）；useLanguage/useTheme。
// OUTPUT: 点击某根蜡烛后弹出的当日解读抽屉（底部弹层），复用既有 daily detail 流。
// POS: 月度 K 线「点天 → 当日解读」交互（#4）。复用 daily/detail，不新增 prompt。

import React, { useEffect, useState } from "react";
import type { UserProfile } from "../../types";
import { useLanguage, useTheme } from "../UIComponents";
import { fetchDailyDetail } from "../../services/apiClient";

interface DailyDetail {
  theme_elaborated?: string;
  how_it_shows_up?: { emotions?: string; relationships?: string; work?: string };
  one_practice?: { title?: string; action?: string };
  one_question?: string;
}

interface TimelineDetailDrawerProps {
  date: string | null;
  profile: UserProfile;
  onClose: () => void;
}

export const TimelineDetailDrawer: React.FC<TimelineDetailDrawerProps> = ({
  date,
  profile,
  onClose,
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DailyDetail | null>(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    fetchDailyDetail(profile, date, language)
      .then((res: { content?: DailyDetail }) => {
        if (!cancelled) setDetail(res?.content ?? null);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            language === "zh"
              ? "解读暂时无法加载，请稍后再试。"
              : "This reading couldn't load. Please try again.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, profile, language]);

  if (!date) return null;

  const panelTone = isLight ? "bg-paper-100 text-paper-900" : "bg-space-950 text-star-50";
  const mutedTone = isLight ? "text-paper-500" : "text-star-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl ${panelTone}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{date}</h3>
          <button
            onClick={onClose}
            className={`text-sm ${mutedTone} hover:opacity-70`}
            aria-label={language === "zh" ? "关闭" : "Close"}
          >
            ✕
          </button>
        </div>

        {loading && <p className={mutedTone}>{language === "zh" ? "加载中…" : "Loading…"}</p>}
        {error && <p className="text-mystic-500">{error}</p>}

        {detail && (
          <div className="space-y-4 text-sm leading-relaxed">
            {detail.theme_elaborated && <p>{detail.theme_elaborated}</p>}
            {detail.how_it_shows_up && (
              <div className="space-y-1">
                {detail.how_it_shows_up.emotions && (
                  <p>
                    <span className={mutedTone}>
                      {language === "zh" ? "情绪：" : "Emotions: "}
                    </span>
                    {detail.how_it_shows_up.emotions}
                  </p>
                )}
                {detail.how_it_shows_up.work && (
                  <p>
                    <span className={mutedTone}>
                      {language === "zh" ? "工作：" : "Work: "}
                    </span>
                    {detail.how_it_shows_up.work}
                  </p>
                )}
                {detail.how_it_shows_up.relationships && (
                  <p>
                    <span className={mutedTone}>
                      {language === "zh" ? "关系：" : "Relationships: "}
                    </span>
                    {detail.how_it_shows_up.relationships}
                  </p>
                )}
              </div>
            )}
            {detail.one_practice?.action && (
              <div className="rounded-lg border border-psycho-200 bg-psycho-50/40 p-3">
                {detail.one_practice.title && (
                  <p className="font-medium mb-1">{detail.one_practice.title}</p>
                )}
                <p>{detail.one_practice.action}</p>
              </div>
            )}
            {detail.one_question && (
              <p className="italic">{detail.one_question}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
