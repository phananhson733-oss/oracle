<!-- INPUT: scripts/../backend/scripts/generate-newsletter-hero.ts 写入的周报 hero PNG（经 gemini-web 离线生成）。 -->
<!-- OUTPUT: 静态托管的周报头图，构建时随 public/ 拷入 dist/，线上路径 https://www.astrologywiki.com/newsletter/<slug>.png。 -->
<!-- POS: 周报 hero 图床；若更新此目录，务必更新本头注释与上级 public/FOLDER.md。 -->

# 文件夹：public/newsletter

周报（newsletter）hero 头图的静态托管目录。

## 为什么独立托管

`hero_image_url` 在 `newsletter_issues`（migration 010）中**可空**：周报采用「内容/投递分离」，
文本由 Vercel Cron 每周自动生成+群发；hero 图则是 **best-effort 富化**，
由运营离线用 gemini-web skill 生成（serverless cron 内跑不了浏览器会话），落盘到本目录后回填 URL。

- 命名约定：`<ISO 周 slug>.png`，如 `2026-W26.png`（与 `newsletter_issues.slug` 一致）。
- 生成器：`backend/scripts/generate-newsletter-hero.ts`（`npx tsx`，best-effort，失败不阻断纯文本发送）。
- 邮件渲染：`emailService.sendWeeklyNewsletter` 仅在 `hero_image_url` 为绝对 https URL 时嵌入 `<img>`，否则纯文本。

## 文件清单

- `.gitkeep`｜占位｜保证空目录入库（生成的 `*.png` 由运营按周追加）。
- `FOLDER.md`｜本说明。
