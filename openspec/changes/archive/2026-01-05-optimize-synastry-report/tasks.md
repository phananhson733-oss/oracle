<!-- INPUT: 合盘报告优化的实施步骤与验证清单（含 AI 提示条移除与 A/B 回退）。 -->
<!-- OUTPUT: OpenSpec 变更任务列表。 -->
<!-- POS: 变更实施清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。
# 合盘报告优化 - Tasks

## 1. 现状核对与范围确认
- [x] 盘点合盘报告中的 A/B 文案、方法论位置、顶部 AI 来源提示条与相位表滚动容器。
- [x] 确认现有星盘渲染与双人盘样式的可复用组件与数据来源。

## 2. 加载动效统一
- [x] 抽取 Ask Oracle 加载动画为共享 `OracleLoading` 组件（支持文案配置）。
- [x] 在 `constants.ts` 添加合盘专属 `synastry_loading_phrases`（中英文各 12 条）。
- [ ] 合盘分析加载态使用 `OracleLoading` 组件。
- [ ] Tab 切换加载态使用轻量级 loading 指示器。
- [ ] 验证：加载中 UI 与 Ask Oracle 视觉一致。

## 3. 报告布局与文案
- [x] 移除 AI 来源提示条（`App.tsx:2228-2232`，`reportMeta?.source === 'ai'` 条件渲染）。
- [x] 将"方法论/免责声明"移动到每个 tab 的底部。
- [x] 移除 tab 综述卡片 "标题 — 副标题" 行（如 "全息总览 — 关系的深度体检"），仅保留正文。
- [ ] 统一字体与字号到"探索自我"规范，去除斜体与过小字号。
- [ ] 使用 `frontend-design` skill 优化 UI 样式。

## 4. 姓名替换与 i18n
- [x] 修复 `SynastryAspectList` 组件（`App.tsx:1815`）的硬编码 `leftLabel="A"` / `rightLabel="B"`。
- [x] UI 文案中所有 A/B 替换为 `personALabel` / `personBLabel`。
- [ ] 更新 AI prompt，使合盘输出使用具体姓名，避免 A/B 代称。
- [ ] 加入前端兜底替换与缺名回退（A/B），已缓存的 AI 响应不做替换。
- [ ] 验证：中文场景不出现不必要英文。

## 5. 星盘显示增强
复用现有 `AstroChart` 组件与 `optimize-chart-settings` 中的配置：
- [x] `natal_a` tab：`<AstroChart type="natal" profile={selectedA} config={NATAL_CONFIG} />`
- [x] `natal_b` tab：`<AstroChart type="natal" profile={selectedB} config={NATAL_CONFIG} />`
- [x] `syn_ab` tab：`<AstroChart type="synastry" profile={selectedA} partnerProfile={selectedB} config={SYNASTRY_CONFIG} />`
- [x] `syn_ba` tab：`<AstroChart type="synastry" profile={selectedB} partnerProfile={selectedA} config={SYNASTRY_CONFIG} />`
- [x] `composite` tab：`<AstroChart type="composite" profile={selectedA} partnerProfile={selectedB} config={COMPOSITE_CONFIG} />`
- [x] `overview` tab：不显示星盘。
- [ ] 验证：星盘样式、相位线、配色与"探索自我"一致。

## 6. 相位表展示
- [x] 对比盘相位表改为一次性全量展示，取消滚动容器。
- [ ] 验证：相位表可完整阅读，移动端不丢失内容。

## 7. 数据来源检查
- [x] 确保合盘星盘使用真实计算数据，禁用 mock 回退。
- [x] 确保 AI 文案来自真实 AI 生成，API 失败时显示错误而非 mock。
- [x] 确保技术附录数据来自真实计算。

## 8. 验证与回归
- [ ] 冒烟：合盘生成、tab 切换、加载动画与星盘显示。
- [ ] 冒烟：中文/英文切换与姓名替换一致。
- [ ] 验证：无 mock 数据泄露到正式报告中。
