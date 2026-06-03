<!-- INPUT: 前端各处复用的纯工具逻辑（时区/CJK/缓存键、城市搜索、SDK 加载、星历查表）。 -->
<!-- OUTPUT: 无副作用的工具函数与类型，供 App.tsx / 组件 / 工具页直接 import。 -->
<!-- POS: 前端共享工具目录。若更新此文件，务必更新本头注释与新增/删除文件的行。 -->

# utils

前端共享工具函数集合。均为可单测的纯逻辑或受控副作用封装，按职责拆成小文件。

## 文件清单

| 文件 | 职责 |
|---|---|
| `astro-helpers.ts` | 时区格式化、CJK 检测、出生数据缓存键等纯工具（从 App.tsx 抽出，改动需同步 App.tsx import）。 |
| `city-search.ts` | 城市搜索（本地优先 + 后端 Open-Meteo 回退），支持中英文/拼音/拼音首字母。 |
| `load-sdk.ts` | 动态 `<script>`/SDK 加载器，带 Promise 缓存（`loadScript`）避免重复注入。 |
| `nodeSign.ts` | tool-led 北交点迷你计算器的纯查表逻辑：`resolveNorthNodeSign(birthDateISO, table)` 按 YYYY-MM-DD 字符串比较定位星座（DOB 不出浏览器），并导出 `NodeSignTable`/`NodeSignIngress` 形状（由 `scripts/gen-node-sign-table.mjs` 生成的 `data/nodeSignTable.ts` 满足）。 |
| `safetyFooter.ts` | psych-adjacent 强制安全 footer 的**单一文案来源**：结构化 `SAFETY_FOOTER_COPY`/`SAFETY_CRISIS_LINES` + `buildSafetyFooterHtml(lang)`（静态 stub 用）+ `resolveSafetyLang`/`crisisLineName`（SPA `<SafetyFooter>` 用）。纯、import-free，故 `generate-seo-pages.mjs` 可经 loadTsModule 加载；stub 与 SPA 同源不漂移（CLAUDE.md AI 安全边界 #1/#4）。 |

## 近期变更

- 新增 `nodeSign.ts`：客户端北交点星座查表纯函数 + 表结构类型（Lane B，配合构建期 swisseph 生成的 `data/nodeSignTable.ts`）。
- 新增 `safetyFooter.ts`：psych-adjacent 安全 footer 单一文案来源（stub 与 SPA 共享，loadTsModule 可加载），取代原 `scripts/lib/safety-footer.mjs`。
