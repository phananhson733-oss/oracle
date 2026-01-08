# Tasks: add-section-detail-modal

## 1. 后端 API 与 Prompt 开发
- [ ] 1.1 设计详情解读 API 端点结构 (`POST /api/detail`)
- [ ] 1.2 定义各模块解读类型（elements、aspects、planets、asteroids、rulers）
- [ ] 1.3 编写元素矩阵（elements）解读 prompt 模板
- [ ] 1.4 编写相位表（aspects）解读 prompt 模板
- [ ] 1.5 编写行星信息（planets）解读 prompt 模板
- [ ] 1.6 编写小行星信息（asteroids）解读 prompt 模板
- [ ] 1.7 编写宫主星（rulers）解读 prompt 模板
- [ ] 1.8 实现后端 `/api/detail` 路由，根据 context（natal/transit/synastry）和 type 调用对应 prompt
- [ ] 1.9 支持传入星盘数据作为 prompt 上下文

## 2. 前端 API 客户端
- [ ] 2.1 在 `services/apiClient.ts` 新增 `fetchSectionDetail` 函数
- [ ] 2.2 定义请求参数类型（detailType、context、chartData）
- [ ] 2.3 定义响应类型（SectionDetailContent）

## 3. UI 组件开发
- [ ] 3.1 在 `components/UIComponents.tsx` 新增 `DetailModal` 弹窗组件
- [ ] 3.2 实现弹窗的加载状态、错误状态、内容展示
- [ ] 3.3 支持 Markdown 渲染（如需要）
- [ ] 3.4 新增 `SectionHeader` 组件，包含标题 + "查看详情"按钮 slot

## 4. 探索自我（Me）页面集成
- [ ] 4.1 为 `TechnicalSection` 的元素矩阵添加"查看详情"按钮
- [ ] 4.2 为相位表添加"查看详情"按钮
- [ ] 4.3 为行星信息添加"查看详情"按钮
- [ ] 4.4 为小行星信息添加"查看详情"按钮
- [ ] 4.5 为宫主星信息添加"查看详情"按钮
- [ ] 4.6 实现点击按钮时调用 API 并展示弹窗

## 5. 今日运势（Today）页面集成
- [ ] 5.1 为专业附录中的相位矩阵添加"查看详情"按钮
- [ ] 5.2 为行运行星信息添加"查看详情"按钮
- [ ] 5.3 为行运小行星信息添加"查看详情"按钮
- [ ] 5.4 为宫主星信息添加"查看详情"按钮
- [ ] 5.5 实现点击按钮时调用 API 并展示弹窗（传入行运日期与本命数据）

## 6. 合盘（Us）页面集成 - 本命盘 Tab
- [ ] 6.1 为 natal_a Tab 的元素矩阵添加"查看详情"按钮
- [ ] 6.2 为 natal_a 的相位表、行星/小行星/宫主星添加按钮
- [ ] 6.3 为 natal_b Tab 的元素矩阵添加"查看详情"按钮
- [ ] 6.4 为 natal_b 的相位表、行星/小行星/宫主星添加按钮

## 7. 合盘（Us）页面集成 - 对比盘 Tab
- [ ] 7.1 为 syn_ab Tab 的相位表添加"查看详情"按钮
- [ ] 7.2 为 syn_ab 的行星/小行星/宫主星添加按钮
- [ ] 7.3 为 syn_ba Tab 的相位表添加"查看详情"按钮
- [ ] 7.4 为 syn_ba 的行星/小行星/宫主星添加按钮

## 8. 合盘（Us）页面集成 - 组合盘 Tab
- [ ] 8.1 为 composite Tab 的元素矩阵添加"查看详情"按钮
- [ ] 8.2 为 composite 的相位表添加"查看详情"按钮
- [ ] 8.3 为 composite 的行星/小行星/宫主星添加按钮

## 9. 本地化
- [ ] 9.1 在 `constants.ts` 的 TRANSLATIONS 中添加"查看详情"按钮文案（中/英）
- [ ] 9.2 添加弹窗标题、加载中、错误提示等文案

## 10. 测试与验收
- [ ] 10.1 手动测试探索自我页面的所有"查看详情"功能
- [ ] 10.2 手动测试今日运势页面的所有"查看详情"功能
- [ ] 10.3 手动测试合盘页面各 Tab 的"查看详情"功能
- [ ] 10.4 验证 AI 内容仅在点击时生成，不影响页面初始加载
- [ ] 10.5 验证弹窗在 dark/light 主题下的显示效果
