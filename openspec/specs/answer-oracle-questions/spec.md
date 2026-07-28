<!-- INPUT: Oracle 问答能力需求与场景。 -->
<!-- OUTPUT: OpenSpec Oracle 问答规范。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Answer Oracle Questions

## Purpose
该能力通过预设分类与自由输入承接提问，基于星盘事实生成结构化建议与行动提示，并支持快速回到提问界面。
## Requirements
### Requirement: Question selection
系统 SHALL 提供 6 个问答类别与附录 A 的预设问题库，并支持自由输入问题。

分类 ID 与口语化展示名（可本地化调整）如下：
- `self_discovery`｜EN: Me & My Vibe｜ZH: 我是谁 / 个人特质｜定义: 独特性、自信与个人气场
- `shadow_work`｜EN: Mental Health｜ZH: 情绪与心理｜定义: 情绪内耗、焦虑与潜意识恐惧
- `relationships`｜EN: Love & Relationships｜ZH: 恋爱与情感｜定义: 关系模式与亲密需求
- `vocation`｜EN: Money & Career｜ZH: 搞钱与搞事业｜定义: 财富路径、天赋变现与职业方向
- `family_roots`｜EN: Family & Trauma｜ZH: 原生家庭与创伤｜定义: 原生家庭影响与创伤修复
- `time_cycles`｜EN: Future & Destiny｜ZH: 未来与命运｜定义: 时机、转折点与年度主题

#### Scenario: User selects a preset category
- **WHEN** 用户选择某个类别
- **THEN** 系统展示该类别对应的 10 个问题（见附录 A）

#### Scenario: User switches language
- **WHEN** 用户切换语言
- **THEN** 系统展示该类别的本地化问题文案（非即时翻译）

### Requirement: Oracle response generation
系统 SHALL 通过后端使用 reasoning 模型生成结构化回答，并返回当前语言的单语言字段供前端展示。

#### Scenario: Reasoning answer is returned
- **WHEN** 问题被提交
- **THEN** 前端从后端获取摘要、行动建议与关键洞察（单语言）并展示

### Requirement: Return to ask
系统 SHALL 允许用户返回问题选择界面。

#### Scenario: User starts a new question
- **WHEN** 用户点击返回
- **THEN** 恢复问题选择视图

### Requirement: Modular prompt assembly
系统 SHALL 按顺序组装 Prompt：`Base System` + `Category Module` + `User Data` + `Output Format`。

#### Scenario: Category-specific prompt assembly
- **GIVEN** 类别为 `shadow_work`
- **WHEN** 生成回答
- **THEN** Prompt 依序拼接 Base System、Mental Health Module、用户数据与 Output Format

### Requirement: Category modules
系统 SHALL 提供 6 个类别模块，定义分析重点与关键星象：
- `self_discovery`：聚焦个人特质与自信议题，关联太阳/月亮/上升的身份整合。
- `shadow_work`：聚焦情绪内耗与潜意识恐惧，关联冥王/土星/凯龙与 8/12 宫。
- `relationships`：聚焦恋爱与关系模式，关联金星/月亮/第七宫与依恋需求。
- `vocation`：聚焦财富路径与职业方向，关联 MC/北交/第十宫与成就阻碍。
- `family_roots`：聚焦原生家庭与创伤修复，关联月亮/土星/IC 与再抚育议题。
- `time_cycles`：聚焦时机与转折点，关联行运与周期（木星/土星/天王/冥王等）。

#### Scenario: Unknown category fallback
- **GIVEN** 类别未知或缺失
- **WHEN** 生成回答
- **THEN** 默认使用 `self_discovery` 模块

### Requirement: Output formatting contract
系统 SHALL 按以下结构输出内容，并严格使用指定标题与字段名：
1) The Essence（Headline / The Insight）
2) The Astrological Signature（Planet/Point in Sign/House 或 Aspect）
3) Deep Dive Analysis（The Mirror / The Root / The Shadow / The Light）
4) Soulwork（Journal Prompt / Micro-Habit）
5) The Cosmic Takeaway（Summary / Affirmation）
输出除段落标题外使用纯文本标签，不使用 Markdown 强调/列表/反引号。

#### Scenario: Markdown format compliance
- **WHEN** 生成回答
- **THEN** 输出以 `## 1. The Essence` 开始，且包含 5 个完整段落与对应字段（不含 Markdown 强调/列表/反引号）

### Requirement: Language-specific storage & regeneration
系统 SHALL 按语言存储 Ask 回答，切换语言时重新生成并缓存目标语言结果，不做即时翻译。

#### Scenario: Language switch triggers regeneration
- **GIVEN** 已存在中文回答但缺少英文回答
- **WHEN** 用户切换到英文
- **THEN** 系统生成英文回答并缓存

