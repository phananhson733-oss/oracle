<!-- INPUT: Frontend utility helpers (performance monitoring, short-link redirects, non-critical initialization scheduling, and shared utilities). -->
<!-- OUTPUT: src/utils directory index and update log, including PageSpeed scheduling utilities. -->
<!-- POS: src/utils directory index; update this header when files change. -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：src/utils

架构概要
- 收口前端运行时工具函数与性能监控。
- 提供 Core Web Vitals 上报、性能测量与短链跳转解析工具。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 utils 目录结构与更新记录。
- goRedirects.ts｜地位：短链跳转解析工具｜功能：校验 `/go/:code` 与 `to` 回退目标，仅允许跳转到 AstrologyWiki 自有域名。
- nonCriticalInitScheduler.ts｜地位：PageSpeed 非关键初始化调度器｜功能：将 analytics/web-vitals/AdSense TCF 等首屏非关键工作延后到 6s+idle 或首次交互后 600ms+idle，提供可测试的取消与一次性执行语义。
- performance.ts｜地位：性能监控工具｜功能：Web Vitals 采集与性能测量。

近期更新
- 新增 nonCriticalInitScheduler，将 `index.tsx` 的非关键初始化从直接 idle 调度改为首屏后/首次交互后再执行，降低 LCP/TBT 首屏竞争。
- 新增 goRedirects resolver，支持 `/go/:code?to=...` 同站短链跳转并防止开放跳转。
- Web Vitals 上报与分析追踪对齐，提供统一上报入口。
