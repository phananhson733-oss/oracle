<!-- INPUT: 后端数据服务增量规范（合盘 prompt 覆盖、成长焦点懒加载与缓存策略）。 -->
<!-- OUTPUT: backend-data-services 规范增量（含成长焦点分区与缓存约束）。 -->
<!-- POS: 能力增量规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。
# backend-data-services Specification (Delta)

## MODIFIED Requirements

### Requirement: Prompt catalog per surface
系统 SHALL 维护覆盖所有页面/场景的 Prompt 目录，并通过 promptId 与版本号进行选择，且包含完整的合盘 prompt 集合。

#### Scenario: Prompt coverage for synastry surfaces
- **WHEN** 请求合盘相关 AI 场景
- **THEN** 后端可选用 synastry-overview、synastry-highlights、synastry-core-dynamics、synastry-practice-tools、synastry-relationship-timing、synastry-natal-a、synastry-natal-b、synastry-compare-ab、synastry-compare-ba、synastry-composite 以及 detail-*-synastry / detail-*-composite 的对应 Prompt

## ADDED Requirements

### Requirement: Language-specific prompt variants
系统 SHALL 为合盘相关内容维护独立的中英文 Prompt 模板，不使用翻译生成英文内容。

#### Scenario: Synastry prompt selects language variant
- **WHEN** 请求合盘内容且 lang=zh 或 lang=en
- **THEN** 后端使用对应语言的 prompt 模板生成内容

### Requirement: Synastry overview section endpoint
系统 SHALL 提供合盘综述分区端点，用于按需生成核心互动动力学、练习工具箱、关系时间线与 Highlights 内容。

#### Scenario: Overview section request
- **WHEN** 前端请求 `/synastry/overview-section` 并指定 section
- **THEN** 后端调用对应 prompt 并返回该分区的单语言内容

### Requirement: Growth task section includes sweet/friction points
系统 SHALL 在 growth_task 分区响应中返回甜蜜点与摩擦点内容，并避免在 overview 生成时提前输出这些细节。

#### Scenario: Growth task returns sweet/friction
- **WHEN** 前端请求 `/synastry/overview-section` 且 section=growth_task
- **THEN** 后端返回 growth_task、sweet_spots 与 friction_points 字段

#### Scenario: Overview omits sweet/friction
- **WHEN** 后端生成 overview 内容
- **THEN** sweet_spots 与 friction_points 不作为主体内容生成或仅返回空数组

### Requirement: Compact overview context
系统 SHALL 为 overview 生成紧凑的上下文摘要，仅包含必要的本命快照、维度相位信号、Top2 落宫（4/7/8）与 sweet/friction 信号。

#### Scenario: Overview context shrinks payload
- **WHEN** 后端生成 overview 内容
- **THEN** 上下文包含维度相位 Top3、Top2 落宫 4/7/8 与必要的本命快照字段

### Requirement: Natal chart cache
系统 SHALL 在后端缓存本命盘计算结果 7 天，以减少重复计算。

#### Scenario: Cached natal chart reuse
- **WHEN** 相同出生信息在 7 天内重复请求
- **THEN** 后端返回缓存的本命盘结果而不重复计算
