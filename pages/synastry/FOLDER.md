<!-- INPUT: pages/SynastryPage.tsx（薄编排层）传入的状态/回调 props；shared UI（UIComponents）、astro-glyphs、TechSpecsComponents（懒加载表）、apiClient、analytics、entitlement/auth contexts、city-search 工具。 -->
<!-- OUTPUT: 合盘（Synastry）页面的展示子组件与纯 helper —— 由 SynastryPage godfile 拆分而来，行为零变化。 -->
<!-- POS: 仅服务 pages/SynastryPage.tsx 的内部分解目录。若增删本目录文件，务必更新本 FOLDER.md 与 SynastryPage 的 import；若 SynastryPage 职责变化，同步其文件头与本说明。 -->

# pages/synastry/

`pages/SynastryPage.tsx`（原 5244 行 godfile）的展示层拆分目录。SynastryPage 收敛为 <800 行的薄编排组件（持有状态 / effect / 数据获取 / 配额），本目录承载所有 UI 子树与纯 helper。**所有文件行为与原 godfile 等价（纯机械重构）。**

## 文件清单

| 文件 | 职责 |
|---|---|
| `ProfileSelectView.tsx` | 选择视图（view === "select"）：档案列表 + 关系类型选择 + 配额提示 + 生成按钮 + Add/Edit 档案弹窗（双 city combobox）。 |
| `SynastryReportView.tsx` | 报告视图（view === "report"）：tab 导航 + 各 tab 渲染编排 + 技术附录 wrapper + 合盘详情解读弹窗（内含 detail-modal 状态、handlers 与 requestDetailAccess）。 |
| `OverviewTab.tsx` | 概览 tab：vibe tags + 兼容雷达 + growth_task / core_dynamics / conflict_loop / practice_tools / weather_forecast 手风琴 + 结论 + highlights。 |
| `GrowthTaskBody.tsx` | OverviewTab 成长课题手风琴展开内容（成长任务 + 甜蜜点 + 摩擦点）。 |
| `WeatherForecastBody.tsx` | OverviewTab 关系天气预报手风琴展开内容（周脉搏 7 日卡 + 季度展望 + 关键日期）。 |
| `CompositeTab.tsx` | 合成体 tab：v4「The Entity」布局与 legacy v3 回退布局 + 技术附录。 |
| `NatalScriptCard.tsx` | 单人星盘脚本卡片（legacy v3 + v4「Relationship Blueprint」两套布局）。natal_a / natal_b tab 主体。 |
| `PerspectiveCard.tsx` | 单向视角（A→B / B→A）合盘解读卡片（legacy v3 + v4「Chemistry Lab」），内嵌 IntensityBadge / DynamicCard / LandscapeZoneCard。syn_ab / syn_ba tab 主体。 |
| `EntityPlanetCard.tsx` | 合成体各行星卡片（CompositeTab 叶子组件）。 |
| `TechnicalAppendix.tsx` | ExtendedAppendix（单盘技术附录）+ ComparisonAppendix（合盘对比附录）。5 个懒加载 TechSpecs 表在此 import，保持各自分 chunk。 |
| `useSynastryProfileForm.ts` | 封装 Add/Edit 档案弹窗的全部表单状态、双 city combobox 句柄、月名本地化与 open/edit/save 处理函数（hook，被 SynastryPage 调用一次）。 |
| `format.ts` | 纯 helper：formatTemperamentElements / formatTemperamentModalities（temperament 权重对象 → 本地化串）。 |
| `report-helpers.ts` | 纯 helper：clampScore / getRadarTone / getCoreDynamicsTone / fillTemplate + SECTION_TITLE_CLASS 常量。 |
| `types.ts` | SynastryTabId / SynastryTabContentMap 类型契约。 |

## 测试

- `tests/unit/synastry-format.test.ts` — 守护 `format.ts` 的 temperament 格式化等价性。
- `tests/unit/synastry-report-helpers.test.ts` — 守护 `report-helpers.ts` 纯函数（夹取 / 配色映射 / 模板替换）。

## 近期变更

- 初始拆分：从 `pages/SynastryPage.tsx`（5244 行）抽出本目录全部文件，主文件收敛至 <800 行。5 个懒加载 TechSpecs 表保持独立 chunk。行为零变化（backlog #19）。
- 2026-07-03 LLM 排版统一：6 个解读组件（OverviewTab/GrowthTaskBody/WeatherForecastBody/NatalScriptCard/PerspectiveCard/CompositeTab + EntityPlanetCard）全部迁移到 components/llm 文档式排版；去除卡中卡/彩虹眉标/圆点假列表；雷达/冲突循环图/微信气泡等数据可视化保留并换纸墨 token。
