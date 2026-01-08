<!-- INPUT: Wiki 组件目录结构与职责说明（含图标文本变体规范）。 -->
<!-- OUTPUT: Wiki 组件目录文档（含 Unicode 图标统一与文案规范记录）。 -->
<!-- POS: Wiki 组件目录说明；若更新此文件，务必更新本头注释。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

# components/wiki/

心理占星百科（Wiki）前端页面集合。

## 文件清单

| 文件 | 职责 |
|------|------|
| `WikiHubPage.tsx` | Wiki 入口页签容器，负责首页/百科切换 |
| `WikiHomePage.tsx` | Wiki 首页，包含搜索、每日星象/灵感与支柱入口 |
| `WikiIndexPage.tsx` | Wiki 百科页，包含主题分区卡片与条目索引 |
| `WikiDetailPage.tsx` | Wiki 详情页，包含核心解读、能量地图与关联条目 |

## 依赖

- `services/apiClient.ts`：Wiki API 调用
- `components/UIComponents.tsx`：主题/语言上下文与通用 UI 原语

## 近期更新

- 新增 Wiki 首页/百科/详情页并接入后端内容服务。
- Wiki 首页加入每日星象雷达图与指引卡片，并调整左右卡片占比。
- Wiki 百科页改为主题分区卡片布局，优化网格比例与搜索展示。
- Wiki 首页/百科/详情页统一使用 1280 内容宽度容器，贴齐探索自我布局。
- Wiki 入口页签改为独立按钮，移除顶部信息卡片。
- Wiki 全站图标统一为 Unicode 符号，并保持中文态无英文混排。
- Wiki 首页每日星象内容按天缓存，避免重复刷新。
- 四大支柱图标强制 Unicode 文本呈现，避免 emoji 显示。
- Wiki 条目与关联条目图标统一加文本变体，阻止 emoji 渲染。
