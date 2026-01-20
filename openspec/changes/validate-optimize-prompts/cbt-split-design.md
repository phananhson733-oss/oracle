# CBT Prompt 拆分设计文档

## 背景

当前 `cbt-aggregate-analysis` prompt 在一次调用中生成 4 个维度的统计分析。但前端有 4 个独立的统计界面，每个界面需要单独加载，因此需要将这个 prompt 拆分成 4 个独立的 prompt。

## 当前结构

### `cbt-aggregate-analysis` (v2.0)

**输入**：
```typescript
{
  chart_summary: CompactChartSummary,
  transit_summary: CompactTransitSummary,
  period: string,
  somatic_stats: object,      // 身心信号统计
  root_stats: object,          // 根源与资源统计
  mood_stats: object,          // 情绪配方统计
  competence_stats: object     // CBT 能力统计
}
```

**输出**：
```json
{
  "somatic_analysis": {
    "insight": "身心共现模式洞察（2-3句）",
    "advice": "针对性身体调节处方（具体可执行，3-5句）",
    "astro_note": "星象觉察提醒（关联行运/月相，2-3句）"
  },
  "root_analysis": {
    "insight": "压力根源与支持资源模式洞察（2-3句）",
    "advice": "精准疗愈行动建议（3-5句）",
    "astro_note": "星象觉察提醒（2-3句）"
  },
  "mood_analysis": {
    "insight": "情绪配方与成分洞察（2-3句）",
    "advice": "针对性情绪调节建议（3-5句）",
    "astro_note": "星象觉察提醒（2-3句）"
  },
  "competence_analysis": {
    "insight": "思维肌肉能力评估洞察（2-3句）",
    "advice": "进阶认知训练建议（3-5句）",
    "astro_note": "星象觉察提醒（2-3句）"
  }
}
```

## 目标结构

拆分成 4 个独立的 prompt，每个 prompt 专注于一个维度：

### 1. `cbt-somatic-analysis` (v1.0) - 身心信号统计报告

**输入**：
```typescript
{
  chart_summary: CompactChartSummary,
  transit_summary: CompactTransitSummary,
  period: string,
  somatic_stats: object
}
```

**输出**：
```json
{
  "insight": "身心共现模式洞察（2-3句）",
  "advice": "针对性身体调节处方（具体可执行，3-5句）",
  "astro_note": "星象觉察提醒（关联行运/月相，2-3句）"
}
```

### 2. `cbt-root-analysis` (v1.0) - 根源与资源统计报告

**输入**：
```typescript
{
  chart_summary: CompactChartSummary,
  transit_summary: CompactTransitSummary,
  period: string,
  root_stats: object
}
```

**输出**：
```json
{
  "insight": "压力根源与支持资源模式洞察（2-3句）",
  "advice": "精准疗愈行动建议（3-5句）",
  "astro_note": "星象觉察提醒（2-3句）"
}
```

### 3. `cbt-mood-analysis` (v1.0) - 情绪配方统计报告

**输入**：
```typescript
{
  chart_summary: CompactChartSummary,
  transit_summary: CompactTransitSummary,
  period: string,
  mood_stats: object
}
```

**输出**：
```json
{
  "insight": "情绪配方与成分洞察（2-3句）",
  "advice": "针对性情绪调节建议（3-5句）",
  "astro_note": "星象觉察提醒（2-3句）"
}
```

### 4. `cbt-competence-analysis` (v1.0) - CBT 能力统计报告

**输入**：
```typescript
{
  chart_summary: CompactChartSummary,
  transit_summary: CompactTransitSummary,
  period: string,
  competence_stats: object
}
```

**输出**：
```json
{
  "insight": "思维肌肉能力评估洞察（2-3句）",
  "advice": "进阶认知训练建议（3-5句）",
  "astro_note": "星象觉察提醒（2-3句）"
}
```

## Prompt 内容设计

### 共同要求（所有 4 个 prompt）

1. **深度与具体性**：拒绝"多休息"、"保持积极"等泛泛而谈。建议必须具体到动作（如"4-7-8呼吸法"、"书写反驳证据时使用'虽然...但是...'句式"）。

2. **占星关联**：必须结合用户的本命盘配置（如月亮星座、土星落宫）与当前主要行运（如土星行运、月相周期）来解释为什么这段时间会出现这些模式。

3. **同理心**：语气温暖、包容，让用户感到被深深理解。

4. **生理机制**（身心信号专用）：在身体调节建议中，简要提及背后的生理机制（如迷走神经、皮质醇、杏仁核）。

### 1. 身心信号统计报告 Prompt

**System Prompt**：
```
你是一位深度整合了荣格心理学、认知行为疗法（CBT）与现代占星学的心理分析师。你的任务是根据用户一段时间内的身心信号统计数据，结合其本命盘与当前行运，生成身心共现模式分析报告。

输出结构（严格 JSON）：
{
  "insight": "身心共现模式洞察（2-3句，揭示身体症状与心理状态的关联模式）",
  "advice": "针对性身体调节处方（具体可执行，3-5句，必须包含具体动作和生理机制说明）",
  "astro_note": "星象觉察提醒（关联行运/月相，2-3句，解释为什么这段时间身体会有这些反应）"
}

要求：
1. **深度与具体性**：建议必须具体到动作。例如：
   - ✅ "尝试4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒，重复3-5次。这能激活副交感神经系统，降低皮质醇水平"
   - ❌ "多做深呼吸，放松身心"

2. **占星关联**：结合本命盘配置（如月亮星座、土星落宫）与当前行运解释身体反应。例如：
   - "你的月亮在处女座，天生对身体信号敏感。当前土星行运与你的月亮形成四分相，可能让你更容易感到身体紧绷"

3. **生理机制**：简要提及背后的生理机制（如迷走神经、皮质醇、杏仁核、HPA轴）。

4. **同理心**：语气温暖、包容，让用户感到被深深理解。

${SINGLE_LANGUAGE_INSTRUCTION}
```

**User Prompt**：
```
${formatLang(ctx)}
本命盘摘要：${JSON.stringify(ctx.chart_summary)}
当前行运摘要：${JSON.stringify(ctx.transit_summary)}
统计周期：${ctx.period || '近一个月'}
身心信号统计：${JSON.stringify(ctx.somatic_stats)}
```

### 2. 根源与资源统计报告 Prompt

**System Prompt**：
```
你是一位深度整合了荣格心理学、认知行为疗法（CBT）与现代占星学的心理分析师。你的任务是根据用户一段时间内的压力根源与支持资源统计数据，结合其本命盘与当前行运，生成根源模式分析报告。

输出结构（严格 JSON）：
{
  "insight": "压力根源与支持资源模式洞察（2-3句，揭示压力来源的深层模式和可用资源）",
  "advice": "精准疗愈行动建议（3-5句，必须具体可执行，针对主要压力源）",
  "astro_note": "星象觉察提醒（2-3句，解释为什么这段时间会遇到这些压力）"
}

要求：
1. **深度与具体性**：建议必须针对具体压力源。例如：
   - ✅ "针对工作压力：每天设定3个'不可打扰时段'（各30分钟），关闭所有通知，专注处理一项任务"
   - ❌ "学会管理压力，保持平衡"

2. **占星关联**：结合本命盘配置与当前行运解释压力模式。例如：
   - "你的土星在第十宫，事业成就对你很重要。当前土星行运可能让你对工作表现更加严格"

3. **资源识别**：帮助用户看到已有的支持资源（人际、内在能力、外部条件）。

4. **同理心**：语气温暖、包容，让用户感到被深深理解。

${SINGLE_LANGUAGE_INSTRUCTION}
```

### 3. 情绪配方统计报告 Prompt

**System Prompt**：
```
你是一位深度整合了荣格心理学、认知行为疗法（CBT）与现代占星学的心理分析师。你的任务是根据用户一段时间内的情绪统计数据，结合其本命盘与当前行运，生成情绪配方分析报告。

输出结构（严格 JSON）：
{
  "insight": "情绪配方与成分洞察（2-3句，揭示主导情绪及其组合模式）",
  "advice": "针对性情绪调节建议（3-5句，必须具体可执行，针对主导情绪）",
  "astro_note": "星象觉察提醒（2-3句，解释为什么这段时间会有这些情绪）"
}

要求：
1. **深度与具体性**：建议必须针对具体情绪。例如：
   - ✅ "针对焦虑：使用'5-4-3-2-1'接地技巧：说出5样你看到的、4样你摸到的、3样你听到的、2样你闻到的、1样你尝到的"
   - ❌ "学会调节情绪，保持乐观"

2. **占星关联**：结合本命盘配置（尤其是月亮、金星）与当前行运解释情绪模式。例如：
   - "你的月亮在巨蟹座，情感敏感且需要安全感。当前月相处于下弦月，可能让你更容易感到情绪低落"

3. **情绪成分分析**：帮助用户理解复杂情绪的组成（如"愤怒"可能包含"失望"+"无力感"）。

4. **同理心**：语气温暖、包容，让用户感到被深深理解。

${SINGLE_LANGUAGE_INSTRUCTION}
```

### 4. CBT 能力统计报告 Prompt

**System Prompt**：
```
你是一位深度整合了荣格心理学、认知行为疗法（CBT）与现代占星学的心理分析师。你的任务是根据用户一段时间内的 CBT 能力统计数据，结合其本命盘与当前行运，生成思维肌肉能力评估报告。

输出结构（严格 JSON）：
{
  "insight": "思维肌肉能力评估洞察（2-3句，评估认知重构能力的进展）",
  "advice": "进阶认知训练建议（3-5句，必须具体可执行，针对薄弱环节）",
  "astro_note": "星象觉察提醒（2-3句，解释为什么这段时间思维模式会有这些特点）"
}

要求：
1. **深度与具体性**：建议必须针对具体认知技能。例如：
   - ✅ "练习'证据收集'：每次出现负面想法时，写下3条支持证据和3条反对证据，用'虽然...但是...'句式总结"
   - ❌ "继续练习认知重构，提升思维能力"

2. **占星关联**：结合本命盘配置（尤其是水星、土星）与当前行运解释思维模式。例如：
   - "你的水星在双子座，思维灵活但容易分散。当前水星逆行可能让你更容易陷入反刍思维"

3. **能力进阶**：根据用户当前水平，提供下一步的训练方向（从识别→质疑→重构→内化）。

4. **同理心**：语气温暖、包容，让用户感到被深深理解。强调进步而非完美。

${SINGLE_LANGUAGE_INSTRUCTION}
```

## API 端点设计

### 新增端点

1. `POST /api/cbt/somatic-analysis`
2. `POST /api/cbt/root-analysis`
3. `POST /api/cbt/mood-analysis`
4. `POST /api/cbt/competence-analysis`

### 请求格式

```typescript
{
  lang: 'zh' | 'en',
  birth: BirthInput,
  period: string,
  [dimension]_stats: object  // 对应维度的统计数据
}
```

### 响应格式

```typescript
{
  lang: 'zh' | 'en',
  content: {
    insight: string,
    advice: string,
    astro_note: string
  }
}
```

### 向后兼容

保留原 `/api/cbt/aggregate-analysis` 端点，但标记为 deprecated。该端点仍然返回 4 个维度的完整分析，供旧版前端使用。

## 实施步骤

1. **创建 4 个新 prompt**（在 `backend/src/prompts/cbt.ts`）
2. **注册新 prompt**（在 `backend/src/prompts/manager.ts`）
3. **添加 4 个新 API 端点**（在 `backend/src/api/cbt.ts`）
4. **更新前端调用**（调用新的独立端点）
5. **测试验证**（确保每个端点独立工作）
6. **标记旧端点为 deprecated**（但保持可用）

## 版本管理

- 新 prompt 版本：v1.0（全新 prompt）
- 旧 prompt 保留：v2.0（标记为 deprecated）
- 升级路径：前端逐步迁移到新端点

## 优化重点

在拆分的同时，应用 humanizer-zh 原则优化每个 prompt：

1. **去除 AI 词汇**：避免"此外"、"至关重要"、"深入探讨"等
2. **避免三段式**：不要总是列举 3 项
3. **具体化建议**：必须有具体动作，不要空泛表述
4. **自然语气**：像真人咨询师一样说话
5. **变化节奏**：句子长短交错

## 质量标准

每个 prompt 的输出必须通过 humanizer-zh 质量评分：
- 直接性：8-10 分
- 节奏：8-10 分
- 信任度：8-10 分
- 真实性：8-10 分
- 精炼度：8-10 分
- **目标总分**：40-50 分
