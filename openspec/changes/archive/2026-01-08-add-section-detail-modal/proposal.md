# Change: add-section-detail-modal

## Why
用户希望能够在技术规格表格（元素矩阵、相位表、行星信息、小行星信息、宫主星信息）旁边看到详细的占星解读。当前这些表格仅展示数据，缺乏专业解读说明。通过新增"查看详情"按钮，用户可以按需获取 AI 生成的专业占星解读，而不是在页面加载时自动生成，避免不必要的 AI 调用开销。

## What Changes
- 在以下模块的标题栏添加"查看详情"按钮：
  1. **探索自我（Me）页面**：元素矩阵、相位表、行星信息、小行星信息、宫主星信息
  2. **合盘（Us）页面**：
     - 两个本命盘（natal_a / natal_b）：元素矩阵、相位表、行星信息、小行星信息、宫主星信息
     - 两个对比盘（syn_ab / syn_ba）：相位表、行星信息、小行星信息、宫主星
     - 组合盘（composite）：元素矩阵、相位表、行星信息、小行星信息、宫主星信息
  3. **今日运势（Today）页面**：专业附录中的相位矩阵、行星信息、小行星信息、宫主星

- 新增模态弹窗组件，用于展示 AI 生成的占星解读内容
- 新增后端 API 端点，按需生成各模块的详细解读
- AI 内容采用**懒加载策略**：仅当用户点击"查看详情"时才请求生成

## Impact
- Affected specs: `generate-natal-insights`、`provide-daily-forecast`、`generate-synastry-report`
- Affected code:
  - `App.tsx` - 添加按钮与弹窗逻辑
  - `components/TechSpecsComponents.tsx` - 为表格组件添加标题栏按钮 slot
  - `components/UIComponents.tsx` - 新增 DetailModal 组件
  - `services/apiClient.ts` - 新增详情解读 API 调用
  - `backend/` - 新增 `/api/detail/:type` 端点

## Out of Scope
- 不修改现有表格组件的数据展示逻辑
- 不改变现有 AI 内容的生成时机（保持页面加载时的现有行为）
