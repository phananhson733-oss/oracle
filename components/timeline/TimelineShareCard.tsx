// INPUT: candles + markers + nowKey + onCreateYours?、useLanguage、derived（currentCandle/upcomingMarkers/energyBand）、copy.ts、buildTimelineShareUrl。
// OUTPUT: A.5 最小分享卡 —— Current Phase（活跃度）+ Next Turning Point + 分享按钮（复制 PII-free UTM 回链）+ "create yours" CTA。
// POS: A.5 病毒回路卡。卡面展示用户派生信息（活跃度档/marker 标签，非 PII）；分享链指公开 demo、结构上零出生数据。
//      深色霓虹视觉为最小态，像素打磨待 QA。

import React, { useState } from "react";
import type { TimelineCandle, TimelineMarker } from "../../types";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";
import { currentCandle, upcomingMarkers, energyBand } from "./derived";
import { buildTimelineShareUrl } from "./share";

export const TimelineShareCard: React.FC<{
  candles: TimelineCandle[];
  markers?: TimelineMarker[];
  nowKey?: string | null;
  onCreateYours?: () => void;
}> = ({ candles, markers = [], nowKey = null, onCreateYours }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  const [copied, setCopied] = useState(false);
  const now = currentCandle(candles, nowKey);
  if (!now) return null;

  const next = upcomingMarkers(candles, markers, nowKey, 1)[0];
  const bandLabel: Record<string, string> = {
    veryQuiet: c.bandVeryQuiet,
    quiet: c.bandQuiet,
    moderate: c.bandModerate,
    busy: c.bandBusy,
    veryBusy: c.bandVeryBusy,
  };
  const shareUrl = buildTimelineShareUrl({
    lang: language === "zh" ? "zh" : "en",
  });

  const onShare = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
    } catch {
      // clipboard 不可用：静默（链接仍可手动复制）
    }
  };

  return (
    <section
      className="mt-5 rounded-xl bg-slate-900 p-4 text-white"
      aria-label={c.shareCardTitle}
    >
      <p className="text-xs font-medium text-psycho-300">{c.shareCardTitle}</p>
      <div className="mt-2 space-y-1">
        <p className="text-sm">
          <span className="text-slate-400">{c.currentPhaseTitle}: </span>
          {bandLabel[energyBand(now.intensity)]}
        </p>
        {next && (
          <p className="text-sm">
            <span className="text-slate-400">{c.keyYearsTitle}: </span>
            {next.label}
          </p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onShare}
          className="rounded-lg bg-psycho-600 px-3 py-1.5 text-sm font-medium hover:bg-psycho-500"
        >
          {copied ? c.shareCopied : c.shareCta}
        </button>
        <button
          onClick={() => onCreateYours?.()}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          {c.createYoursCta}
        </button>
      </div>
    </section>
  );
};
