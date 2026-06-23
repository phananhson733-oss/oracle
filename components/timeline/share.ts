// INPUT: 站点 base url + 可选 UTM / lang。
// OUTPUT: buildTimelineShareUrl —— 指向公开 /:lang/energy-timeline demo 的 UTM 回链。
// POS: A.5 最小分享卡的回链核心（病毒回路）。**隐私默认（GDPR Art9）**：分享链指向公开 demo 页，
//      结构上不接受、不携带任何出生数据 / CBT / PII —— 分享者的盘永不外泄，"create yours" CTA 邀新访客自建。

const SHARE_PATH = "/energy-timeline";
const DEFAULT_BASE = "https://www.astrologywiki.com";

export interface ShareUrlOpts {
  baseUrl?: string; // 默认生产站
  lang?: "en" | "zh";
  source?: string; // utm_source，默认 "share"
  medium?: string; // utm_medium，默认 "energy_card"
  campaign?: string; // utm_campaign，默认 "energy_timeline"
}

export function buildTimelineShareUrl(opts: ShareUrlOpts = {}): string {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
  const lang = opts.lang === "zh" ? "zh" : "en";
  const params = new URLSearchParams({
    utm_source: opts.source ?? "share",
    utm_medium: opts.medium ?? "energy_card",
    utm_campaign: opts.campaign ?? "energy_timeline",
  });
  return `${base}/${lang}${SHARE_PATH}?${params.toString()}`;
}
