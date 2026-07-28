<!-- INPUT: AI 输出单语言、温度策略与校验机制变更。 -->
<!-- OUTPUT: OpenSpec 数据服务增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## RENAMED Requirements
- FROM: `### Requirement: Bilingual content payloads`
- TO: `### Requirement: Language-specific content payloads`

## MODIFIED Requirements
### Requirement: AI content generation service
系统 SHALL 使用 DeepSeek 生成单语言内容，默认使用 chat 模型，Oracle 问答使用 reasoning 模型，并遵循全局温度配置。

#### Scenario: Ask uses reasoning model
- **WHEN** 用户提交 Oracle 问答请求并携带 `lang`
- **THEN** 后端使用 reasoning 模型生成对应语言的内容并返回单语言 payload

### Requirement: Prompt catalog per surface
系统 SHALL 维护覆盖所有页面/场景的 Prompt 目录，并通过 promptId 与版本号进行选择，包含合盘分标签的 Prompt。

#### Scenario: Prompt coverage for all surfaces
- **WHEN** 请求任一 AI 场景
- **THEN** 后端可选用 natal-overview、natal-core-themes、natal-dimension、natal-technical、daily-forecast、daily-detail、cycle-naming、synastry-overview、synastry-natal-a、synastry-natal-b、synastry-compare、synastry-composite、synastry-dynamic、ask-answer、cbt-analysis 的对应 Prompt

### Requirement: Language-specific content payloads
系统 SHALL 根据请求 `lang` 返回单语言内容，不返回双语字段且不依赖实时翻译。

#### Scenario: Single-language response
- **WHEN** 后端返回文本数据
- **THEN** 响应仅包含 `lang` 与 `content`（单语言）字段

### Requirement: Cache policy for data layers
系统 SHALL 将 AI 生成结果纳入缓存策略，基于 (promptId + 版本 + 输入 hash + lang) 复用结果以控制成本。

#### Scenario: AI cache hit avoids regeneration
- **WHEN** 同一 prompt、输入与 lang 重复请求且缓存未过期
- **THEN** 后端返回缓存结果而非重新调用 AI

## ADDED Requirements
### Requirement: AI timeout policy
系统 SHALL 默认不对 AI 生成设置硬超时，仅在显式传入 timeout 时才中止请求。

#### Scenario: No timeout by default
- **WHEN** 未提供 timeout 参数发起 AI 请求
- **THEN** 后端不主动中止请求，等待 AI 返回或客户端取消

### Requirement: Module completeness with length budgets
系统 SHALL 保持返回模块完整性，允许对非核心模块缩短内容长度，但不得移除模块。

#### Scenario: Non-core module trimming
- **WHEN** 输出体量过大需要压缩
- **THEN** 系统缩减非核心模块文字长度，核心模块保持完整且模块键不缺失

### Requirement: AI response validation
系统 SHALL 采用宽松校验与 JSON 修复策略；若无法修复，则返回明确错误且不回落 mock。

#### Scenario: Invalid JSON is repaired
- **WHEN** AI 返回的 JSON 格式存在轻微错误
- **THEN** 后端尝试修复并返回可解析的单语言内容，否则返回错误响应
