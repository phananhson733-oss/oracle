# Capability: Generate Synastry Report (增量)

## MODIFIED Requirements

### Requirement: Localized terminology
系统 SHALL 在中文模式下使用通俗易懂的术语，英文模式保留专业术语。

#### Scenario: Chinese mode uses plain language
- **WHEN** 用户语言设置为中文
- **THEN** 显示通俗化术语（如"情感敏感区"而非"敏感面板"）

#### Scenario: English mode uses professional terms
- **WHEN** 用户语言设置为英文
- **THEN** 显示专业术语（如 "Sensitivity Panel"）

### Requirement: Aspect legend translation
系统 SHALL 在中文模式下翻译相位图例。

#### Scenario: Aspect legend shows Chinese
- **WHEN** 用户语言设置为中文且查看星盘
- **THEN** 相位图例显示中文（合相/对冲/刑相/三合/六合）

### Requirement: Personalized name usage
系统 SHALL 在报告内容中使用用户真实姓名而非 A/B 代称。

#### Scenario: AI content uses real names
- **WHEN** AI 生成合盘报告
- **THEN** 内容中使用传入的用户姓名而非 "A" 或 "B"

#### Scenario: Fallback when name missing
- **WHEN** 用户姓名缺失
- **THEN** 回退使用 "A" 或 "B" 代称

### Requirement: Consistent layout style
系统 SHALL 保持合盘报告与"探索自我"模块的排版风格一致。

#### Scenario: Layout matches self-exploration
- **WHEN** 用户查看合盘报告
- **THEN** 字号、间距、颜色与"探索自我"模块一致

### Requirement: Expanded sensitivity display
系统 SHALL 在对比盘中将敏感面板各维度展开为独立卡片，包含详细解读。

#### Scenario: Sensitivity panel is expanded
- **WHEN** 用户查看对比盘
- **THEN** 各敏感维度（月亮/金星/火星/水星/深层）以独立卡片展示，包含模式、恐惧、需求字段

### Requirement: Enhanced composite depth
系统 SHALL 提供更深度的组合盘解读内容。

#### Scenario: Composite content is detailed
- **WHEN** 用户查看组合盘
- **THEN** 关系人格包含 outer/inner/growth 详细解读，长期课题包含 nodes 和 chiron 字段
