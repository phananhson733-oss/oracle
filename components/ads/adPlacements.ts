// INPUT: 环境变量 VITE_ADSENSE_SLOT_*（AdSense 后台创建广告单元后经 env 注入）。
// OUTPUT: 导出 AdPlacement 类型与集中式广告位配置（位置 → slot ID / 预留高度 / 格式）。
// POS: 广告位中央配置；若更新此文件，务必更新 components/ads/FOLDER.md。集中管理密度，防止失控。

export interface AdPlacement {
  key: string; // 稳定标识（分析/调试用）
  slot: string; // AdSense 广告单元 ID；未配置时为空串 → AdSlot 不渲染
  minHeight: number; // 预留高度（px），防 CLS
  format: string; // AdSense data-ad-format
}

const env = import.meta.env;

// wiki 文章末尾（正文与相关文章之间）——PR1 唯一广告位：最安全、离转化 CTA 最远。
// 更多位置（导言后 / 正文中段）留待 PR3 按 RPM/CLS 数据调优时增补。
export const WIKI_ARTICLE_END: AdPlacement = {
  key: "wiki_article_end",
  slot: env.VITE_ADSENSE_SLOT_WIKI_END || "",
  minHeight: 280,
  format: "auto",
};
