// INPUT: UserProfile（活跃出生档案）；fetchLifeNarrative（apiClient，authFetch 带登录 token）；useLanguage；copy.ts。
// OUTPUT: 人生能量叙事卡（life 模式）——按需生成六章（overview/past/present/future/milestone/letter）折叠呈现；
//         生成前显式告知出生数据将发往 LLM（AI 安全边界 #5）；反宿命 disclaimer；demo（匿名）走 upsell 不打端点。
// POS: 受保护 /timeline 的 life 模式叙事单元。零吉凶/确定性；正文由后端 prompt（withSafety noFate）保证中性。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useState } from "react";
import type { UserProfile, LifeNarrativeContent } from "../../types";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";
import {
  parseEmphasisSegments,
  splitNarrativeParagraphs,
} from "./narrativeFormat";
import { fetchLifeNarrative } from "../../services/apiClient";

type Status = "idle" | "loading" | "done" | "error";

const CHAPTER_ORDER: ReadonlyArray<keyof LifeNarrativeContent> = [
  "overview",
  "past",
  "present",
  "future",
  "milestone",
  "letter",
];

const cardClass =
  "rounded-2xl border border-paper-300/50 bg-paper-50 p-4 shadow-sm dark:border-gold-500/15 dark:bg-space-900/60 sm:p-5";

export const TimelineLifeNarrative: React.FC<{
  profile: UserProfile;
  demo?: boolean;
  onUpsell?: () => void;
}> = ({ profile, demo = false, onUpsell }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);

  const [status, setStatus] = useState<Status>("idle");
  const [content, setContent] = useState<LifeNarrativeContent | null>(null);
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () => new Set(["overview"]),
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const chapterLabel = (key: keyof LifeNarrativeContent): string => {
    switch (key) {
      case "overview":
        return c.chOverview;
      case "past":
        return c.chPast;
      case "present":
        return c.chPresent;
      case "future":
        return c.chFuture;
      case "milestone":
        return c.chMilestone;
      case "letter":
        return c.chLetter;
    }
  };

  const generate = useCallback(() => {
    setStatus("loading");
    setErrorCode(null);
    fetchLifeNarrative(profile, language)
      .then((r) => {
        setContent(r.content);
        setOpenKeys(new Set(["overview"]));
        setStatus("done");
      })
      .catch((e: { code?: string }) => {
        setErrorCode(e?.code ?? null);
        setStatus("error");
      });
  }, [profile, language]);

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 匿名 demo：不打 LLM 端点，展示注册引导。
  if (demo) {
    return (
      <section className={`mt-5 ${cardClass}`} aria-label={c.narrativeTitle}>
        <h3 className="text-base font-semibold">{c.narrativeTitle}</h3>
        <p className="mt-1 text-sm text-paper-600 dark:text-star-200">
          {c.narrativeUpsellBody}
        </p>
        {onUpsell && (
          <button
            onClick={onUpsell}
            className="mt-3 px-4 py-2 rounded-lg bg-psycho-600 text-white text-sm"
          >
            {c.narrativeUpsellCta}
          </button>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          {c.narrativeDisclaimer}
        </p>
      </section>
    );
  }

  return (
    <section className={`mt-5 ${cardClass}`} aria-label={c.narrativeTitle}>
      <h3 className="text-base font-semibold">{c.narrativeTitle}</h3>
      <p className="mt-1 text-sm text-paper-600 dark:text-star-200">
        {c.narrativeIntro}
      </p>

      {status !== "done" && (
        <>
          {/* AI 安全边界 #5：生成前显式告知出生数据将发往 LLM。 */}
          <p className="mt-3 rounded-lg border border-dashed border-gold-600/30 p-3 text-xs leading-relaxed text-paper-500 dark:border-gold-500/15 dark:text-star-400">
            {c.narrativeLlmNotice}
          </p>
          <button
            onClick={generate}
            disabled={status === "loading"}
            className="mt-3 px-4 py-2 rounded-lg bg-psycho-600 text-white text-sm disabled:opacity-60"
          >
            {status === "loading" ? c.narrativeLoading : c.narrativeGenerate}
          </button>
          {status === "error" &&
            (errorCode === "NARRATIVE_LOCKED" ? (
              // paywall flag 翻 ON 时优雅降级为 upsell，而非笼统重试。
              <div className="mt-2">
                <p className="text-sm text-paper-600 dark:text-star-200">
                  {c.narrativeUpsellBody}
                </p>
                {onUpsell && (
                  <button
                    onClick={onUpsell}
                    className="mt-2 px-4 py-2 rounded-lg bg-psycho-600 text-white text-sm"
                  >
                    {c.narrativeUpsellCta}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-amber-600">
                {errorCode === "LOGIN_REQUIRED"
                  ? c.narrativeLoginRequired
                  : c.narrativeError}
              </p>
            ))}
        </>
      )}

      {status === "done" && content && (
        <>
          <div className="mt-4 space-y-2">
            {CHAPTER_ORDER.map((key) => {
              const open = openKeys.has(key);
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 dark:border-gold-500/20"
                >
                  <button
                    onClick={() => toggle(key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-star-100">
                      {chapterLabel(key)}
                    </span>
                    <span className="text-slate-400 text-xs" aria-hidden="true">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && (
                    <div className="space-y-3 px-4 pb-4">
                      {splitNarrativeParagraphs(content[key]).map((para, i) => (
                        <p
                          // 章节内段落顺序稳定（纯文本派生），index key 安全。
                          // biome-ignore lint/suspicious/noArrayIndexKey: static derived list
                          key={i}
                          className="text-sm leading-relaxed text-slate-600 dark:text-star-300"
                        >
                          {parseEmphasisSegments(para).map((seg, j) =>
                            seg.strong ? (
                              <strong
                                // biome-ignore lint/suspicious/noArrayIndexKey: static derived list
                                key={j}
                                className="font-semibold text-slate-800 dark:text-star-100"
                              >
                                {seg.text}
                              </strong>
                            ) : (
                              <React.Fragment key={j}>
                                {seg.text}
                              </React.Fragment>
                            ),
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        {c.narrativeDisclaimer}
      </p>
    </section>
  );
};
