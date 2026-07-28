// INPUT: OgCardData（已本地化、非 PII 的 phase 标签 + 可选 turning point 标签 + lang）+ @resvg/resvg-js。
// OUTPUT: buildTimelineOgSvg（纯：深色霓虹 1200×630 OG 卡 SVG 字符串）+ renderTimelineOgPng（resvg 栅格化→PNG Buffer）。
// POS: A.5 最小分享卡的 OG unfurl 图像（社媒预览图）。**隐私**：只接受已派生的非 PII 标签（活跃度/marker 名），绝不接受出生数据；
//      文本经 escapeXml 防注入。B3 的 3 模板全管线是另一回事（plan-gated，验回路后再做）。

import { Resvg } from "@resvg/resvg-js";

// B3：3 个分享模板（hide-PII 默认 ON——结构上只收非 PII 标签，绝无出生时间/城市/坐标/精确生日/CBT）。
// 注：A.5 验回路前，分享流默认仍用 "aurora"（模板1）；模板 2/3 已建但不默认推（plan kill 标准）。
export type OgTemplate = "aurora" | "noir" | "solar";
export const OG_TEMPLATES: readonly OgTemplate[] = ["aurora", "noir", "solar"];
export const DEFAULT_OG_TEMPLATE: OgTemplate = "aurora";

export interface OgCardData {
  phaseLabel: string; // 已本地化的活跃度标签（如 "Active" / "活跃"），非 PII
  turningPoint?: string; // 已本地化的 marker 标签（如 "Saturn Return"），非 PII
  lang?: "en" | "zh";
  template?: OgTemplate;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 每模板：[bg 渐变两端色, accent, phase 文字色]。
const PALETTES: Record<OgTemplate, [string, string, string, string]> = {
  aurora: ["#0f172a", "#1e1b4b", "#a855f7", "#ffffff"], // 深蓝紫霓虹
  noir: ["#0a0a0a", "#1c1917", "#e5e7eb", "#fafafa"], // 极简黑白
  solar: ["#1a1206", "#3b2606", "#f59e0b", "#fff7ed"], // 暖金日冕
};

export function buildTimelineOgSvg(d: OgCardData): string {
  const tpl = d.template ?? DEFAULT_OG_TEMPLATE;
  const [c0, c1, accent, phaseColor] = PALETTES[tpl];
  const title = d.lang === "zh" ? "能量时间轴" : "Energy Timeline";
  const turning = d.turningPoint
    ? `<text x="80" y="400" font-size="36" fill="#cbd5e1" font-family="sans-serif">${escapeXml(d.turningPoint)}</text>`
    : "";
  return [
    `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">`,
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>`,
    `<rect width="1200" height="630" fill="url(#bg)"/>`,
    `<circle cx="1040" cy="120" r="220" fill="${accent}" fill-opacity="0.12"/>`,
    `<text x="80" y="150" font-size="40" fill="${accent}" font-family="sans-serif" font-weight="600">${escapeXml(title)}</text>`,
    `<text x="80" y="300" font-size="72" fill="${phaseColor}" font-family="sans-serif" font-weight="700">${escapeXml(d.phaseLabel)}</text>`,
    turning,
    `<text x="80" y="560" font-size="28" fill="#94a3b8" font-family="sans-serif">astrologywiki.com</text>`,
    `</svg>`,
  ].join("");
}

/** SVG → PNG Buffer（社媒 OG 图）。1200 宽固定，resvg 栅格化。 */
export function renderTimelineOgPng(svg: string): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  return resvg.render().asPng();
}
