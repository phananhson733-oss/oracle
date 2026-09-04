<!-- INPUT: services/adsense（配置/同意门控 + 运行时加载器 + 可选 head-loader）、hooks/useRegion、contexts/AuthContext；env VITE_ADSENSE_SLOT_*。 -->
<!-- OUTPUT: ads 目录架构摘要与文件索引（AdSense 广告展示组件与广告位配置）。 -->
<!-- POS: 广告组件目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/ads

架构概要
- AstrologyWiki AdSense 接入的展示层（PR1）。
- 商业定位：变现免费流量、保护付费漏斗。广告仅投 wiki 文章页；付费/登录用户、
  转化漏斗（embeddedTool）与心理敏感（psychAdjacent）文章、非同意用户零广告。
- 地域分流方案 A：EEA/UK/CH 交 Google 认证 CMP，非 EEA 用自研横幅营销同意。
- 手动广告位（非 Auto Ads），预留高度防 CLS，仅 SPA 水合后渲染；原始 head-loader 仅在审核期显式开启。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 ads 目录架构与文件清单。
- AdSlot.tsx｜地位：广告展示组件｜功能：单个手动 AdSense 单元；四重门控（配置就绪+slot+匿名用户+地域相关广告同意）全过才渲染 <ins class=adsbygoogle> 并通过运行时 loader/pushAd 填充，否则返回 null（不占位/不请求）；预留高度防 CLS，push 去重防 StrictMode 双推。
- adPlacements.ts｜地位：广告位中央配置｜功能：位置→slot ID/预留高度/格式 集中配置（env 驱动），集中管理密度。PR1 仅 WIKI_ARTICLE_END（文末）。
- adEligibility.ts｜地位：广告投放资格判定（PR3/B4）｜功能：isAdEligibleArticle(article) 结构化收口门控#1 —— 排除 embeddedTool(转化漏斗)/psychAdjacent(心理敏感)文章，防各 placement 漏抄红线。

近期更新
- 新建 ads/ 目录（AdSense 接入 PR1）：AdSlot 组件 + adPlacements 配置。消费方为 WikiArticleDetailPage（文末，仅非漏斗/非心理敏感文章）。flag 默认关，PR1 全站零广告。
- 挂载点回归修复（2026-09-04）：AdSlot 的唯一消费方 WikiArticleDetailPage 在合并 `cc5500ae`（2026-07-13）中被大重构分支覆盖，import 与 JSX 一并丢失 → Vite tree-shaking 摘掉整个 AdSlot，线上 bundle 零 `adsbygoogle`。已恢复挂载点并新增 `tests/unit/wiki-article-ad-slot.test.tsx` 钉住，同时给 vercel.json 的 CSP 补齐 Google 广告域名白名单。
