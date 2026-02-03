# Capability Delta: support-cbt-journal (localize-emotion-journal)

## MODIFIED Requirements

### Requirement: Journal entry input (MODIFIED)
系统 SHALL 提供 3 步引导式记录流程（记录→觉察→转念），使用口语化中文文案，去除 CBT 专业术语。

#### Scenario: User completes 3-step flow
- **GIVEN** 用户点击「开始深度觉察」
- **WHEN** 用户完成「记录」「觉察」「转念」三步并提交
- **THEN** 系统保存记录并调用 AI 分析
- **AND** 分析结果以自然语言段落展示（非 JSON 结构化展示）

#### Scenario: User selects multiple emotions
- **GIVEN** 用户进入情绪选择步骤
- **WHEN** 用户选择多个情绪（如「委屈」+「愤怒」）
- **THEN** 所有选中情绪被保存到 `moods` 数组中
- **AND** AI 分析综合考虑所有选中的情绪

### Requirement: Emotion model (MODIFIED)
系统 SHALL 提供至少 12 种情绪选项，按 4 个色调分组（暖/冷/重/轻），支持多选。

#### Scenario: Emotions are grouped by tone
- **GIVEN** 用户在情绪选择界面
- **WHEN** 界面加载完成
- **THEN** 情绪按色调分组显示
- **AND** 每组使用对应的功能色标识（暖=success, 冷=info, 重=danger, 轻=warning）

### Requirement: CBT analysis result (MODIFIED)
系统 SHALL 返回 Markdown 格式的自然语言分析文本，结构为「共情→洞察→行动」三段式，不使用 CBT 专业术语。

#### Scenario: Analysis uses plain language
- **WHEN** AI 生成分析结果
- **THEN** 输出不包含以下术语：认知扭曲、灾难化思维、自动思维、核心信念、Hot Thought、认知重构
- **AND** 输出包含至少一个具体可执行的建议

#### Scenario: Analysis integrates astro context
- **GIVEN** 用户有有效的出生信息
- **WHEN** AI 生成分析结果
- **THEN** 星象关联使用生活化比喻（而非占星术语堆砌）

### Requirement: Localized copy (ADDED)
系统所有界面文案 SHALL 使用中国年轻人习惯的口语化表达，禁止英文术语和专业心理学用语。

#### Scenario: No English terms in UI
- **WHEN** 用户浏览情绪日记的任何界面
- **THEN** 不出现英文术语（如 CBT、Hot Thought、Intensity、TIP 等）
- **AND** 所有引导文案使用第二人称口语（「你」而非「用户」）

### Requirement: Body signal input (ADDED)
系统 SHALL 在记录流程中提供可选的身体感受输入，帮助用户关注身心连接。

#### Scenario: User adds body signal
- **GIVEN** 用户在记录步骤
- **WHEN** 用户填写身体感受（如「胸口闷」「肩膀紧」）
- **THEN** 该信息被保存并传递给 AI 分析
- **AND** AI 分析中包含对身体感受的回应

#### Scenario: User skips body signal
- **GIVEN** 用户在记录步骤
- **WHEN** 用户未填写身体感受
- **THEN** 系统正常完成记录，bodySignal 为空
- **AND** AI 分析不强制提及身体感受

## REMOVED Requirements

### Requirement: Guided steps (REMOVED)
原始需求要求「写日记/日历/统计/历史」四栏切换的一级界面 Tab，该设计过度复杂。移除后简化为单页 Dashboard + 引导流程的双视图切换（已在现有实现中采用）。
