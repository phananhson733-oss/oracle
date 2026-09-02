// INPUT: 环境变量 VITE_ADSENSE_HEAD_LOADER_ENABLED（字面量 'true' 才开）+ VITE_ADSENSE_CLIENT_ID（ca-pub-XXXX）。
// OUTPUT: buildAdsenseHeadTag —— AdSense loader 的 <script> 字符串，门控不通过时返回空串。
// POS: AdSense <head> loader 注入的唯一真相源，供 vite.config.ts（SPA 壳）与 generate-seo-pages.mjs
//      （静态 stub）共用，避免两处门控逻辑漂移。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

// AdSense 首次开户审核抓的是**线上页面的原始 HTML `<head>`**（非 JS 渲染后的 DOM），
// 纯客户端懒加载不算数 —— 所以 loader 必须在构建期写进静态产物。
//
// 两级门控（见 docs/superpowers/specs/2026-07-01-adsense-integration-design.md §5.1）：
// 本函数只管 loader 是否出现（审核验证 + Google CMP 全站加载）；广告是否真正投放
// 另由 VITE_ADSENSE_ENABLED 经 AdSlot 门控。默认关闭，避免平时首字节白拉第三方脚本。
//
// 格式校验是唯一的注入防线：返回值直接拼进 442 个静态 stub 与 SPA 壳的原始 HTML，
// 且 client id 来自构建环境变量。任何不匹配的输入整体拒绝（返回空串），不做转义放行 ——
// 一个合法的 publisher id 本就只有 `ca-pub-` + 10~25 位数字，没有需要转义的字符。
const CLIENT_ID_PATTERN = /^ca-pub-\d{10,25}$/;

// 与前端 services/adsense.ts 的 loadAdsense 共用，重复注入时按 id 短路。
const SCRIPT_ID = 'astro-adsense';

export const buildAdsenseHeadTag = (env = process.env) => {
  if (env.VITE_ADSENSE_HEAD_LOADER_ENABLED !== 'true') return '';

  const client = (env.VITE_ADSENSE_CLIENT_ID || '').trim();
  if (!CLIENT_ID_PATTERN.test(client)) return '';

  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous" id="${SCRIPT_ID}"></script>`;
};
