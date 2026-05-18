<!-- INPUT: support-cbt-journal 能力的修改增量（增加危机短路分支）。 -->
<!-- OUTPUT: 能力增量规范（MODIFIED Requirements）。 -->
<!-- POS: OpenSpec 变更增量规范；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements

### Requirement: CBT analysis result
系统 SHALL 通过后端生成 CBT 分析结果，并返回 snake_case 双语字段供前端展示。若用户提交的自由文本命中危机关键词，系统 MUST 在调用 LLM 之前短路返回求助资源响应而非分析结果。

#### Scenario: Results render after analysis
- **WHEN** 用户提交有效输入且未触发危机关键词
- **THEN** 前端从后端获取并展示 `content[language]`

#### Scenario: Crisis short-circuit before LLM
- **WHEN** 用户提交的 CBT 文本（`situation`、`automaticThoughts`、`hotThought` 或平衡思维条目）命中危机关键词
- **THEN** 后端 MUST 跳过 LLM 调用并返回 `{ status: 'crisis_detected', helpline, message_zh, message_en }`
- **AND** 前端 MUST 渲染求助热线卡片而非分析结果视图

#### Scenario: Crisis response not persisted
- **WHEN** 后端返回 `status: 'crisis_detected'`
- **THEN** 该次请求 MUST NOT 被写入 `cbt:records` 缓存
- **AND** 历史与日历视图 MUST NOT 展示该次记录
