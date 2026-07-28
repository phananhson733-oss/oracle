<!-- INPUT: 合盘报告体验优化需求（加载动效、星盘展示与文案替换）。 -->
<!-- OUTPUT: 合盘报告增量规范（含 AI 提示条移除与 A/B 回退规则）。 -->
<!-- POS: generate-synastry-report 能力增量规范；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。
# Capability Delta: Generate Synastry Report

## ADDED Requirements
### Requirement: Unified synastry loading animation
系统 SHALL 在合盘报告生成与 tab 切换加载中使用与 Ask Oracle 一致的加载动画。

#### Scenario: Synastry loading uses Oracle animation
- **WHEN** 用户提交合盘分析或切换到未加载的 tab
- **THEN** 展示与 Ask Oracle 相同的加载动画并隐藏正文内容

### Requirement: Synastry charts per tab
系统 SHALL 在合盘报告中展示与 tab 对应的星盘图，并遵循“探索自我”的星盘视觉规范（全息总览不展示星盘）。

#### Scenario: Natal tabs show personal natal chart
- **WHEN** 用户打开本命盘 tab
- **THEN** 在 tab 顶部显示该用户本命盘星图

#### Scenario: Comparison tabs show bi-wheel chart
- **WHEN** 用户打开对比盘 tab
- **THEN** 在 tab 顶部显示双人叠加比较盘星图

#### Scenario: Composite tab shows composite chart
- **WHEN** 用户打开组合盘 tab
- **THEN** 在 tab 顶部显示中点盘星图

#### Scenario: Overview tab has no chart
- **WHEN** 用户打开全息总览 tab
- **THEN** 不显示星盘图，仅展示综述正文

### Requirement: Full aspect table display
系统 SHALL 在对比盘相位表中完整展示所有相位信息，不使用滚动容器。

#### Scenario: Aspect table renders fully
- **WHEN** 对比盘 tab 展示相位表
- **THEN** 所有相位条目可在页面内完整阅读

### Requirement: Name-based labeling
系统 SHALL 在合盘报告 UI 与 AI 文案中使用真实姓名替代 A/B 代称，姓名缺失时回退为 A/B（不改写历史内容）。

#### Scenario: Names replace A/B labels
- **WHEN** 用户已填写双方姓名
- **THEN** 所有标题、描述与正文中使用真实姓名

## MODIFIED Requirements
### Requirement: Report generation
系统 SHALL 隐藏合盘报告顶部的 AI 来源提示条，仅保留报告正文。

#### Scenario: AI source badge removed
- **WHEN** 合盘报告渲染完成
- **THEN** 页面不显示 AI 来源提示条

### Requirement: Tabbed perspectives
系统 SHALL 将“方法论/免责声明”移动到每个 tab 的底部，并移除综述卡片内部子标题。

#### Scenario: Methodology is at the bottom
- **WHEN** 用户浏览任意 tab
- **THEN** 方法论/免责声明位于 tab 底部、综述卡片仅保留正文

### Requirement: Localization & typography
系统 SHALL 使用与"探索自我"一致的字体与字号规范，中文场景避免不必要英文与斜体。

#### Scenario: Typography matches self-exploration
- **WHEN** 合盘报告在中文模式渲染
- **THEN** 正文字号清晰可读且不出现多余英文术语

### Requirement: No mock data in production
系统 SHALL 确保合盘报告的所有动态内容来自真实计算或 AI 生成，禁止使用 mock 数据（静态 UI 文案除外）。

#### Scenario: Report uses real data only
- **WHEN** 合盘报告生成完成
- **THEN** 星盘、AI 文案、技术数据均来自真实数据源

#### Scenario: Error state on API failure
- **WHEN** API 或 AI 调用失败
- **THEN** 显示明确的错误提示，而非回退到 mock 内容
