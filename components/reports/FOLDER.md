<!-- INPUT: 报告列表与详情页组件（消费 /api/reports 数据与共享 UI 原语）。 -->
<!-- OUTPUT: ReportsPage / ReportViewPage 及导出入口 index.ts。 -->
<!-- POS: components/reports —— 深度报告的浏览与阅读面；若目录文件增删或职责调整，务必更新本文件。 -->

# components/reports

深度报告（Reports）的列表与阅读页。

## 文件清单

- index.ts｜地位：导出入口｜功能：re-export 报告页组件。
- ReportsPage.tsx｜地位：报告列表页｜功能：已购/可购报告的浏览与入口。
- ReportViewPage.tsx｜地位：报告阅读页｜功能：报告正文渲染（prose + font-reading 阅读衬线）、下载入口。

## 近期变更

- 建立本 FOLDER.md（补齐自文档化欠账）。
- ReportViewPage 报告正文 prose 容器加 font-reading（编辑部阅读衬线）。
