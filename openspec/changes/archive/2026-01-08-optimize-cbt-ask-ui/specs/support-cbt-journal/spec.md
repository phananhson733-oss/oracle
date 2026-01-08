<!-- INPUT: CBT 日记功能增量规范（日历满屏与报告单列优化）。 -->
<!-- OUTPUT: MODIFIED 需求与场景定义（含文案直白化与布局调整）。 -->
<!-- POS: 变更增量规范；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# Capability: Support CBT Journal (Incremental)

## Purpose
优化 CBT 日记功能，移除 mock 数据，实现后端同步，统一设计系统，并提升日历与报告阅读体验。

## MODIFIED Requirements

### Requirement: Empty state guidance
系统 SHALL 在用户无历史记录时显示空状态引导界面。

#### Scenario: New user sees empty state
- **WHEN** 用户已登录但无 CBT 历史记录
- **THEN** 显示空状态引导界面
- **AND** 引导界面包含"创建第一条记录"按钮
- **AND** 不显示任何 mock 数据

#### Scenario: User creates first record from empty state
- **WHEN** 用户点击"创建第一条记录"按钮
- **THEN** 进入 CBT 记录创建流程

### Requirement: Backend data synchronization
系统 SHALL 实现后端 API 同步，同时保留 localStorage 缓存。

#### Scenario: Initialize and load data
- **WHEN** 用户访问 /journal 页面
- **THEN** 首先尝试从后端 API 获取记录
- **AND** 成功后将数据写入 localStorage 缓存
- **AND** 失败时回退读取 localStorage

#### Scenario: Save new record with sync
- **WHEN** 用户完成 CBT 记录填写并提交
- **THEN** 记录立即写入 localStorage
- **AND** 异步同步至后端 API
- **AND** 同步失败时显示提示但保留本地数据

#### Scenario: Data persists after refresh
- **WHEN** 用户已创建 CBT 记录并刷新页面
- **THEN** 显示之前创建的所有记录

### Requirement: Design system consistency
系统 SHALL 采用主应用 gold/star/space 设计 Token，替换 indigo/fuchsia 配色。

#### Scenario: Dark theme display
- **WHEN** 用户使用暗色主题
- **THEN** 背景颜色为 space-950
- **AND** 文字颜色为 star-50
- **AND** 强调色为 gold-500
- **AND** 成功/危险色与主应用一致

#### Scenario: Light theme display
- **WHEN** 用户使用亮色主题
- **THEN** 背景颜色为 #F7F8FA
- **AND** 文字颜色为 #0B0F17
- **AND** 强调色为 gold-600

### Requirement: Full-month calendar without scroll
系统 SHALL 在 CBT 主界面单屏完整呈现当月 31 天，并避免滚动。

#### Scenario: Calendar fits in view
- **WHEN** 用户进入 CBT 主界面
- **THEN** 日历以 7x6 网格展示完整月份
- **AND** 通过缩小日期格与间距确保单屏可见
- **AND** 页面不出现垂直滚动

#### Scenario: Calendar spacing
- **WHEN** 日历区域渲染
- **THEN** 顶部线框与底部现况区域预留约 2px 间距

### Requirement: Plain-language journaling titles
系统 SHALL 使用直白易懂的标题与引导语，避免过度书面化或专业化。

#### Scenario: Simple step titles
- **WHEN** 用户开始写日记流程
- **THEN** 每个步骤标题使用直白表达
- **AND** 中文与英文文案保持同等易读性

### Requirement: Report layout clarity
系统 SHALL 将报告模块改为单列纵向布局，并确保关键标签可见。

#### Scenario: Single-column report sections
- **WHEN** 用户查看 CBT 报告
- **THEN** 认知/宇宙声音/行动等模块按单列逐行展示
- **AND** 不出现并排模块

#### Scenario: Visible mood label
- **WHEN** 报告顶部显示情绪信息
- **THEN** 首条情绪提示文字可完整显示且不被裁切

### Requirement: Discover-me visual alignment
系统 SHALL 将 CBT 报告与流程的视觉层级对齐“探索自我”页面风格。

#### Scenario: Typography and spacing alignment
- **WHEN** 用户查看 CBT 报告与写日记流程
- **THEN** 字号、间距与强调色与“探索自我”保持一致的视觉语气

## REMOVED Requirements

### Requirement: Mock data generation
系统 SHALL 移除 mock 数据生成功能。

#### Scenario: Mock data files removed
- **WHEN** 变更应用后
- **THEN** `components/cbt/utils/mockData.ts` 文件被删除
- **AND** `CBTMainPage.tsx` 中的 `generateMockHistory()` 调用被移除
