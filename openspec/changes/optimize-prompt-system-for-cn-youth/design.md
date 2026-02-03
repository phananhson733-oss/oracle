# 设计文档：Prompt 系统优化

## 架构决策

### 决策 1：统一人格 + 知识库注入机制

**问题**：当前 56 个模板对 cultural 层的引用方式不统一，有的用 `DEFAULT_PERSONA`，有的内嵌文本。

**方案**：在 `builder.ts` 的 `buildPrompt()` 中实现自动注入。

```
buildPrompt(promptId, ctx) {
  1. BASE_SYSTEM（星智人格 + 行为准则）     ← 已有
  2. CULTURAL_CONTEXT（动态，按模块选择）    ← 新增
  3. TASK_SYSTEM（模板定义的任务指令）       ← 已有
  4. USER_PROMPT（紧凑化的用户输入）         ← 已有
}
```

**CULTURAL_CONTEXT 自动注入规则**：

| 模块 | 自动注入内容 |
|------|-------------|
| natal | 行星比喻 + 五行对应 + 匹配场景 |
| daily | 节气语境 + 当日宜忌风格 + 匹配场景 |
| synastry | 关系比喻 + 相位比喻 + 匹配场景 |
| cbt | 心理学本土化 + 疗愈语气 + 匹配场景 |
| ask | 根据问题类别动态匹配场景 + 比喻 |
| wiki | 术语本土化释义 |
| annual | 节气 + 五行 + 年度场景 |

**关键设计**：模板不再需要手动 import cultural 层资源，builder 根据 `meta.module` 自动注入对应的文化上下文。模板只需定义任务指令和输出格式。

### 决策 2：中国传统文化融合策略

**原则**：以西方占星为主体，中国传统文化为「调味料」，不喧宾夺主。

**融合方式**：

#### 2.1 五行与星座/行星的对应

在 cultural 层新增 `wuxing.ts`（五行映射）：

| 行星 | 五行 | 融合方式 |
|------|------|---------|
| 太阳 | 火 | "你的太阳在白羊座，火上加火，行动力拉满" |
| 月亮 | 水 | "月亮主水，你的情绪像潮汐一样有涨有落" |
| 水星 | 木（思维生长） | "水星在双子配上木的生发力，脑子转得特别快" |
| 金星 | 金 | "金星本就属金，你对美的感知很敏锐" |
| 火星 | 火 | "火星的火遇上狮子座，行动力和表现欲都拉满" |
| 木星 | 土（厚德载物） | "木星的扩展力加上土的承载力，贵人运不错" |
| 土星 | 土 | "土星属土，讲究踏实积累，急不得" |

**使用场景**：在核心分析后作为补充视角，如：
> "从西方占星看，你的太阳白羊有冲劲。有趣的是，从五行角度，这是火上加火的配置——行动力拉满，但也要注意别把自己烧着。"

#### 2.2 二十四节气与行运

在 daily 模块中，根据当前节气添加语境：

```typescript
// cultural/seasonal.ts
export function getSeasonalContext(date: Date): string {
  const jieqi = getJieqi(date); // 从 lunar-javascript 获取
  if (!jieqi) return '';
  return `当前节气：${jieqi.name}。${jieqi.implication}`;
}

// 示例输出
// "当前节气：大寒。天地收藏之际，适合内省复盘，不急于行动。"
// "当前节气：立春。万物萌发之时，适合开启新计划。"
```

#### 2.3 使用方式：点缀而非主导

- 每段分析最多包含 1 处中国传统文化引用
- 以「有趣的是/从另一个角度看/中国人常说」等过渡语引入
- 绝不替代西方占星的核心分析逻辑

### 决策 3：语言风格年轻化升级

**当前 TONE_GUIDE 升级方向**：

```
# 升级前
"温暖不油腻 | 接地气不低俗 | 有深度不学究 | 直接不冒犯"

# 升级后（增加具体示例和网络表达指南）
核心语气：像你最懂星座的闺蜜/兄弟在跟你聊天

表达升级：
- ✅ "你这个配置，搞钱能力拉满" ← ✗ "你具有较强的事业驱动力"
- ✅ "社恐星人实锤了" ← ✗ "你在社交方面可能较为内向"
- ✅ "月亮巨蟹 = 内心住了个老母亲" ← ✗ "月亮巨蟹座倾向于关怀他人"
- ✅ "土星回归就是你的社会毒打期" ← ✗ "土星回归代表一个重要的成长阶段"

允许的网络表达（适度使用）：
拉满/实锤/yyds/破防/DNA动了/XX星人/搞钱/摆烂/内卷/社恐社牛/i人e人

禁用表达（过时或不恰当）：
小仙女/小哥哥/老铁/666/集美/家人们
```

### 决策 4：跨模块上下文串联

**问题**：natal 分析说「你容易焦虑」，但 daily 可能完全不提这个特点，造成割裂感。

**方案**：引入「用户画像摘要」（User Portrait）机制。

```typescript
// 新增 services/user-portrait.ts
interface UserPortrait {
  coreTraits: string[];      // 如 ["行动力强但缺耐心", "情绪敏感容易内耗"]
  keyPatterns: string[];     // 如 ["工作中容易过度投入", "感情中需要安全感"]
  growthThemes: string[];    // 如 ["学会放慢节奏", "信任他人"]
  wuxingBalance: string;     // 如 "火旺水弱，需要静心"
}

// 生成流程
// 1. natal-overview 生成时，同时生成 UserPortrait 并缓存（Redis, TTL=7天）
// 2. daily/ask/cbt 等模块调用时，从缓存读取 UserPortrait
// 3. 注入到 user prompt 中作为上下文

// user prompt 示例
`用户画像：行动力强但缺耐心｜情绪敏感容易内耗｜火旺水弱
今日星象：${transitSummary}
请基于用户特点，给出个性化的今日运势。`
```

**缓存策略**：
- UserPortrait 跟随 natal-overview 生成/更新
- TTL = 7 天（与 natal 缓存一致）
- daily/ask/cbt 调用时先检查 UserPortrait 缓存

### 决策 5：并行生成 + 一致性保障

**方案**：引入「种子上下文」（Seed Context）模式。

```typescript
// services/parallel-generator.ts

interface ParallelGenerateOptions {
  promptIds: string[];           // 要并行生成的 prompt 列表
  sharedContext: Record<string, unknown>;  // 共享上下文
  seedSummary?: string;          // 种子摘要（保证一致性）
}

async function generateParallel<T>(options: ParallelGenerateOptions): Promise<Map<string, T>> {
  const { promptIds, sharedContext, seedSummary } = options;

  // 如果有种子摘要，注入到每个 prompt 的 context 中
  const enrichedContext = seedSummary
    ? { ...sharedContext, _seedSummary: seedSummary }
    : sharedContext;

  // 并行调用所有 prompt
  const results = await Promise.all(
    promptIds.map(id => generateAIContent({
      promptId: id,
      context: enrichedContext,
    }))
  );

  return new Map(promptIds.map((id, i) => [id, results[i]]));
}
```

**种子摘要生成策略**：

| 页面 | 种子来源 | 并行内容 |
|------|---------|---------|
| natal | 星盘紧凑摘要 + 五行分析 | overview + core-themes + dimension |
| daily | 当日行运摘要 + 用户画像 | forecast + detail（可选） |
| synastry | 合盘信号摘要 | overview + highlights + core-dynamics |
| cbt | 情绪记录原文 + 用户画像 | analysis + 各统计分析（按需） |
| annual | 流年行运总览 | 11 个模块（已实现） |

**一致性保障**：种子摘要包含关键结论（如「火象能量强，注意控制节奏」），所有并行 prompt 都能看到这个结论，确保不会出现矛盾描述。

### 决策 6：API 层适配

**新增并行端点模式**：

```typescript
// 方式 A：新增批量端点（推荐）
// GET /api/natal/full → 并行返回 overview + core-themes + dimension
natalRouter.get('/full', async (req, res) => {
  const chart = await ephemerisService.calculateNatalChart(birth);
  const chartSummary = buildCompactChartSummary(chart);

  const results = await generateParallel({
    promptIds: ['natal-overview', 'natal-core-themes', 'natal-dimension'],
    sharedContext: { chart_summary: chartSummary },
    seedSummary: chartSummary,
  });

  res.json({
    chart,
    overview: results.get('natal-overview'),
    coreThemes: results.get('natal-core-themes'),
    dimension: results.get('natal-dimension'),
  });
});

// 方式 B：保留单端点，前端并行调用（备选）
// 前端同时发起 3 个请求，后端无需改动
```

**选择方式 A 的理由**：
- 减少网络请求数（3 → 1）
- 后端可注入种子上下文保证一致性
- 前端改动最小（改调一个接口即可）

## 实施顺序

```
Phase 1: 架构统一化（prompt-architecture）
  → 统一 builder 注入机制
  → 清理模板中的重复 cultural 引用
  → 新增 UserPortrait 机制

Phase 2: 内容本土化（prompt-localization）
  → 新增五行映射 + 节气语境
  → 升级语言风格指南
  → 优化所有模板内容

Phase 3: 并行生成（parallel-generation）
  → 实现 generateParallel 服务
  → 适配各 API 路由
  → 前端适配新端点
```

Phase 1 是基础，Phase 2 和 Phase 3 可以部分并行。
