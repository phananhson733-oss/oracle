# 功能页面 UI 对齐

## ADDED Requirements

### Requirement: 功能域页面使用对应色系
系统 SHALL 在占星、心理、洞察等页面使用 `FEATURE_COLORS` 对应的功能域色系构建主操作与视觉强调（基于 ui-color-system-compliance）。

#### Scenario: CBT 页面色系
- Given 用户访问 CBT 页面
- When 渲染主操作与强调卡片
- Then 使用 `FEATURE_COLORS.psychology` 的主色样式

#### Scenario: 报告与洞察页面色系
- Given 用户访问报告或洞察页面
- When 渲染主要按钮与关键入口
- Then 使用 `FEATURE_COLORS.insights` 的主色样式

### Requirement: 图表与数据可视化颜色规范化
系统 SHALL 使用 `DATA_VIZ_COLORS` 或 `SEMANTIC_COLORS` 渲染图表与标签，tooltip 与网格背景使用主题化 token（基于 ui-color-system-compliance）。

#### Scenario: 星盘与情绪图表
- Given 用户查看星盘或情绪统计
- When 图表渲染
- Then 颜色取自 `DATA_VIZ_COLORS`
- And tooltip 背景采用主题色 token

### Requirement: 深浅主题页面一致性
系统 SHALL 在深色与浅色主题下保持页面结构、间距与交互状态一致，仅改变色彩映射。

#### Scenario: Wiki 页面主题切换
- Given 用户在 Wiki 页面切换主题
- When 主题变化
- Then 布局、间距与卡片层级保持一致
- And 颜色按主题映射更新
