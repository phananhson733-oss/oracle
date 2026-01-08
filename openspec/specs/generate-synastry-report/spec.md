<!-- INPUT: 合盘报告能力需求与场景。 -->
<!-- OUTPUT: OpenSpec 合盘报告规范。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Generate Synastry Report

## Purpose
该能力收集伴侣资料并生成多视角关系分析报告，涵盖总览、本命脚本、双向对比与组合盘，以支持关系理解与沟通。
## Requirements
### Requirement: Partner input
系统 SHALL 收集伴侣姓名、关系类型、出生日期/时间与出生城市后再生成报告。

#### Scenario: Partner birth date is required
- **WHEN** 伴侣出生日期缺失
- **THEN** 生成按钮不可用

### Requirement: Report generation
系统 SHALL 通过后端基于 Swiss Ephemeris 计算合盘事实并生成报告内容，默认仅生成总览内容，并返回单语言字段供前端展示。

#### Scenario: Synastry report loads
- **WHEN** 用户提交有效伴侣资料并选择关系类型
- **THEN** 前端从后端获取合盘总览内容（单语言）并渲染

### Requirement: Tabbed perspectives
系统 SHALL 提供总览、双方本命、双向对比与组合盘的标签切换，并在空闲时按标签顺序预取未加载内容，用户切换时按需补全。

#### Scenario: User switches perspectives
- **WHEN** 用户切换到未加载的标签
- **THEN** 前端发起对应标签的请求并在返回后展示

#### Scenario: Prefetch runs after overview
- **WHEN** 总览内容加载完成且界面空闲
- **THEN** 系统按标签顺序预取其余标签内容并缓存结果

### Requirement: New analysis reset
系统 SHALL 支持返回输入表单以开始新的分析。

#### Scenario: New analysis resets view
- **WHEN** 用户点击新分析入口
- **THEN** 返回输入表单并清空报告

### Requirement: Non-diagnostic disclaimer
系统 SHALL 展示免责声明，说明内容用于参考而非诊断或命运判定。

#### Scenario: Disclaimer is visible in report
- **WHEN** 报告展示
- **THEN** 可见免责声明内容

### Requirement: Compatibility radar
系统 SHALL 在 overview 中输出兼容维度雷达，包含 6 个固定维度与每项一句解释。

#### Scenario: Compatibility radar renders with six dimensions
- **WHEN** 用户查看合盘综述
- **THEN** 展示情绪安全、沟通、吸引力、价值观、节奏、长期潜力六项评分与说明

### Requirement: Overview sections on-demand generation
系统 SHALL 将综述中的核心互动动力学、练习工具箱与关系时间线拆分为按需加载分区，overview 响应不包含这些分区内容。

#### Scenario: Overview sections load on demand
- **WHEN** 用户在 overview 展开核心互动/练习工具箱/关系时间线
- **THEN** 系统调用分区端点生成对应内容并展示加载状态

### Requirement: Growth focus sweet/friction on demand
系统 SHALL 将综述中的甜蜜点与摩擦点移动到成长焦点分区，仅在用户展开成长焦点后生成与返回。

#### Scenario: Growth focus loads sweet/friction on demand
- **WHEN** 用户在 overview 展开成长焦点
- **THEN** 系统调用 growth_task 分区端点并返回 sweet_spots 与 friction_points

#### Scenario: Overview excludes sweet/friction details
- **WHEN** 系统生成 overview 响应
- **THEN** overview 不包含甜蜜点/摩擦点内容或仅返回空数组以避免预加载

### Requirement: Highlights on-demand generation
系统 SHALL 将 Highlights 从 overview 主体中拆分为按需加载分区，overview 响应不包含 Highlights。

#### Scenario: Highlights load on demand
- **WHEN** 用户在 overview 展开 Highlights
- **THEN** 系统调用分区端点生成对应 Highlights 内容并展示加载状态

### Requirement: Relationship timing includes 7-day theme
系统 SHALL 在关系时间线分区中包含 7/30/90 天主题与时间窗提示。

#### Scenario: Timing includes 7-day theme
- **WHEN** 用户查看关系时间线分区
- **THEN** 展示 7 天主题以及 30/90 天主题与窗口提示

### Requirement: On-demand technical appendix
系统 SHALL 将技术附录内容按 tab/详情按需加载，overview 响应不包含技术附录载荷，并允许在 overview 展示后后台预取。

#### Scenario: Overview payload excludes technical appendix
- **WHEN** 用户首次生成 overview
- **THEN** 返回的 overview 不包含技术附录数据，技术附录仅在对应 tab 或详情请求时获取

#### Scenario: Technical appendix prefetches after overview
- **WHEN** overview 已渲染完成且用户停留在报告页
- **THEN** 系统可在后台预取技术附录，不阻塞正文展示

### Requirement: Client-side synastry cache
系统 SHALL 在前端本地缓存本命盘与合盘技术附录数据，并在相同输入下复用以减少重复请求。

#### Scenario: Client cache reuses deterministic data
- **WHEN** 用户再次查看相同关系类型与出生信息的合盘内容
- **THEN** 前端优先使用本地缓存的技术附录与本命盘数据加载对应 tab

### Requirement: Bilingual completeness for synastry content
系统 SHALL 保证合盘各 tab 与详情的英文内容完整返回，并与中文字段保持一致的结构。

#### Scenario: English synastry output is complete
- **WHEN** 用户切换到英文模式并查看合盘内容
- **THEN** 所有 prompt 字段均可见且不缺段、不为空

### Requirement: English output rules for synastry
系统 SHALL 为合盘英文内容遵循明确的输出规则（短句、分段、列表长度等），以适配卡片式阅读。

#### Scenario: English synastry output follows style rules
- **WHEN** 合盘内容以英文生成
- **THEN** 内容满足既定英文输出规则并适配卡片化排版

### Requirement: AI failure handling
系统 SHALL 在 AI 不可用时返回明确错误并展示失败状态，不得使用 mock 内容替代。

#### Scenario: AI unavailable is surfaced
- **WHEN** 合盘 AI 生成失败
- **THEN** 前端展示失败提示且不渲染 mock 报告

