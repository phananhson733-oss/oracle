# Proposal: optimize-cbt-ask-ui

## Summary
在现有 CBT 日记与 Oracle 问答优化基础上，追加密度、布局、文案与加载体验改造，确保页面无滚动、信息层级清晰、文案更直白易懂，并统一为“神谕/ORACLE”视觉与交互规范。

## Problem Statement
当前体验仍存在以下关键问题：

1. **Oracle 问答**：
   - 顶部/底部缺乏预留空间，内容贴边感强
   - 类别/问题/输入栏占比过大，内容密度不合理
   - 标题仍为 THE VOID，状态点颜色不匹配“在线”语义
   - 选中问题缺乏明确高亮
   - 发送后仍停留在原界面，缺少沉浸式 loading 过渡
   - 发送按钮与 Rituals 计数仍未合并为单一操作

2. **CBT 日记**：
   - 日历无法在单屏完整呈现 31 天
   - 顶部线框与底部现况缺少明确间距
   - 写日记流程标题仍偏书面化、不够直白
   - 报告顶部情绪提示文字不可见
   - 报告模块并排显示，信息层级不清晰
   - 视觉语气需更贴近“探索自我”风格

## Proposed Solution

### Oracle 问答模块（新增）

| 需求 | 描述 |
|------|------|
| REQ-7 | 顶部预留 24px，底部预留 4–6px；减少栏目间距并压缩卡片/输入栏高度（约 80%） |
| REQ-8 | 标题改为 ORACLE/神谕，Oracle Online 前改为绿色呼吸点提示在线 |
| REQ-9 | 选中问题卡片高亮，保持可视反馈 |
| REQ-10 | 发送后切换为全屏 loading，使用双层旋转星盘 SVG 与动态短语轮播 |
| REQ-11 | Rituals 与发送按钮合并为单一按钮区块，保持可点击性与禁用态一致 |

### CBT 日记模块（新增）

| 需求 | 描述 |
|------|------|
| REQ-12 | 日历缩小格子与间距，单屏可完整展示 31 天且无需滚动 |
| REQ-13 | 顶部线框与底部现况保持 2px 间距，避免贴边 |
| REQ-14 | 写日记流程标题改为更直白的语言（避免专业术语） |
| REQ-15 | 报告顶部情绪提示确保可见，并将各模块改为单列纵向布局 |
| REQ-16 | 报告与流程视觉风格对齐“探索自我”页面的层级与语气 |

## Scope

### In Scope
- `App.tsx` - AskOraclePage 结构、间距、加载态与按钮区块
- `constants.ts` - Ask/CBT 文案与 i18n 短语
- `index.html` - 新增呼吸与旋转动画 keyframes（Tailwind 扩展）
- `components/cbt/CalendarStats.tsx` - 日历布局与间距调整
- `components/cbt/CBTWizard.tsx` - 写日记标题文案更新
- `components/cbt/ReportDashboard.tsx` - 报告布局改为单列与情绪标签修复
- `components/cbt/LoadingNebula.tsx`（或新增加载组件） - Oracle loading 动画复用/替换

### Out of Scope
- 后端 API 或模型调用逻辑调整
- 数据结构与存储策略变更
- 其他页面的 UI 改版

## Dependencies
- 现有 Ask/CBT API 保持不变
- Tailwind CDN 的 `tailwind.config` 可扩展动画 keyframes
- 现有翻译体系需补齐新文案

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 无滚动布局在小屏拥挤 | Medium | Medium | 使用压缩高度与内部滚动的折中方案 |
| 复杂动画影响性能 | Low | Medium | 使用 SVG + CSS 动画、降低透明层级 |
| 文案调整影响翻译一致性 | Medium | Low | 同步更新中英文文案并对齐术语库 |

## Success Criteria
1. Oracle 顶部/底部留白明确，内容压缩后不出现滚动条
2. Oracle 标题改为 ORACLE/神谕，在线状态为绿色呼吸点
3. 选中问题卡片高亮可见，发送后进入全屏 loading
4. Rituals 与发送按钮合并为单一操作按钮
5. CBT 日历单屏完整展示 31 天，顶部/底部间距一致
6. CBT 写日记标题直白易懂，报告模块单列展示且情绪提示可见
