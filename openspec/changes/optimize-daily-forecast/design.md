# Design: 今日运势优化技术设计

## Context

当前日运页面（`miniprogram/pages/daily/`）已有基础功能，包括：
- 今日综合运势卡片（总分、幸运元素）
- 四维度评分网格（事业/财运/爱情/健康）
- 宜忌建议
- 时间窗口
- 本周星象提醒
- 行运星盘可视化
- 相位矩阵
- 行运行星/小行星/宫主星表格

本次优化需要：
1. 重构内容排版顺序
2. 引入 7 个结构化 AI 提示词模块
3. 增强四维度评分的计算逻辑
4. 优化 UI 设计

## Goals / Non-Goals

### Goals
- 提供渐进式信息呈现（快速浏览 → 深度解读 → 趋势预览）
- 四维度评分基于占星学逻辑计算，而非随机生成
- AI 解读内容专业、具体、可执行
- UI 符合品牌设计规范，视觉层次清晰
- 支持按需加载，优化首屏性能

### Non-Goals
- 不改变现有行运星盘组件（`astro-chart`）的核心逻辑
- 不引入新的外部依赖
- 不改变现有 API 认证机制
- 不支持离线模式（AI 内容需在线生成）

## Decisions

### Decision 1: 内容模块排序

**决策**：采用三层渐进式结构

```
快速浏览层（首屏可见）
├── 今日运势概览卡片
├── 四维度简要评分
├── 今日宜忌建议
└── 关键时间窗口

深度解读层（滚动可见）
├── 四维度详细解读（可展开）
├── 今日星象深度分析
├── 行运星盘可视化
└── 相位矩阵分析

趋势预览层（底部）
└── 本周运势趋势
```

**原因**：
- 用户首次进入页面可快速获取关键信息
- 深度内容按需展开，减少信息过载
- 本周趋势放在底部，作为延伸阅读

### Decision 2: 四维度评分算法

**决策**：基于宫位-行星-相位三层计算

```javascript
// 伪代码
function calculateDimensionScore(dimension, birthChart, transits) {
  let score = 50; // 基础分

  // 1. 宫位行运加分（±15分）
  const houseScore = evaluateHouseTransits(dimension, transits);

  // 2. 相关行星状态加分（±20分）
  const planetScore = evaluatePlanetStatus(dimension, transits);

  // 3. 与本命相位加分（±15分）
  const aspectScore = evaluateNatalAspects(dimension, birthChart, transits);

  return clamp(score + houseScore + planetScore + aspectScore, 0, 100);
}
```

**维度-宫位-行星映射**：

| 维度 | 相关宫位 | 相关行星 |
|------|----------|----------|
| 事业 | 10宫、6宫 | 土星、太阳、木星 |
| 财运 | 2宫、8宫 | 木星、金星、冥王星 |
| 爱情 | 5宫、7宫 | 金星、火星、月亮 |
| 健康 | 6宫、12宫 | 月亮、火星、土星 |

**原因**：
- 基于传统占星学宫位含义
- 评分有据可依，非随机生成
- 可解释性强，便于 AI 生成解读

### Decision 3: AI 提示词架构

**决策**：后端统一管理提示词模板，支持参数替换，输出仅中文

```
backend/prompts/
├── daily-overview.md       # 今日概览
├── dimension-score.md      # 四维度评分
├── dimension-detail.md     # 四维度详解
├── daily-advice.md         # 宜忌建议
├── time-windows.md         # 时间窗口
├── deep-analysis.md        # 深度分析
├── weekly-trend.md         # 本周趋势
└── aspect-matrix.md        # 相位矩阵
```

**提示词模板结构**：
```markdown
# System Prompt
你是一位专业的占星师...

# User Prompt Template
用户本命盘信息：
- 太阳：{sun_sign} {sun_degree}°
- 月亮：{moon_sign} {moon_degree}°
...

# Output Schema
{
  "score": number,
  "luckyColor": string,
  ...
}
```

**原因**：
- 集中管理便于维护和迭代
- 参数化模板支持多用户
- 输出 Schema 确保结构化响应

### Decision 4: API 响应结构

**决策**：扩展现有 `/api/daily` 接口，新增字段（保持兼容）

```typescript
interface DailyForecastResponse {
  // 现有字段（保持兼容）
  content: {
    overall_score: number;
    lucky_color: string;
    lucky_number: string;
    lucky_direction: string;
    tags: string[];
    strategy: {
      best_use: string;
      avoid: string;
    };
    time_windows: {
      morning: string;
      morning_mood: string;
      midday: string;
      midday_mood: string;
      evening: string;
      evening_mood: string;
    };
    dimensions: {
      career: number;
      wealth: number;
      love: number;
      health: number;
    };
    weekly_events: Array<{date: string; description: string}>;
  };

  // 新增字段
  overview: {
    summary: string;           // 今日总结（2-3句）
    score_breakdown: string;   // 评分依据说明
  };

  dimensions_detail: {
    career: DimensionDetail;
    wealth: DimensionDetail;
    love: DimensionDetail;
    health: DimensionDetail;
  };

  advice: {
    do: {
      title: string;
      details: string[];
    };
    dont: {
      title: string;
      details: string[];
    };
  };

  time_windows_enhanced: Array<{
    period: string;
    time: string;
    energyLevel: string;
    tag: string;
    description: string;
    bestFor: string[];
    avoidFor: string[];
  }>;

  deep_analysis: {
    overview: string;
    keyTransits: Array<TransitAnalysis>;
    activatedPoints: string[];
    insights: string[];
  };

  weekly_trend: {
    weekRange: string;
    dailyScores: Array<{date: string; day: string; score: number}>;
    keyDates: Array<{date: string; day: string; label: string; reason: string}>;
    weeklyTrend: string;
    bestDays: string[];
    restDays: string[];
  };

  aspect_matrix_analysis: {
    overallPattern: {
      dominantType: string;
      description: string;
      specialPatterns: string[];
    };
    topAspects: Array<AspectAnalysis>;
    energyThemes: string[];
    summary: string;
  };
}

interface DimensionDetail {
  analysis: string;
  suggestions: string[];
  keyAspects: Array<{
    aspect: string;
    description: string;
  }>;
}
```

**原因**：
- 向后兼容，现有字段保持不变
- 新增字段可选，前端按需使用
- 结构化数据便于前端渲染

### Decision 5: 按需加载策略

**决策**：首屏加载基础数据，详情按需请求

```
首屏加载（/api/daily）：
├── overview（今日概览）
├── dimensions（四维度评分）
├── advice（宜忌）
├── time_windows_enhanced（时间窗口）
└── weekly_trend（本周趋势）

按需加载：
├── /api/daily/dimension-detail?type=career       # 四维度详解
├── /api/daily/deep-analysis                      # 深度分析
└── /api/daily/aspect-analysis                    # 相位矩阵解读
```

**原因**：
- 减少首屏加载时间
- 深度内容用户可能不看，按需加载节省资源
- 支持渐进式体验

## Risks / Trade-offs

### Risk 1: AI 生成内容质量不稳定
- **风险**：AI 可能生成模糊或不准确的内容
- **缓解**：
  - 提示词中明确要求"具体、可执行"
  - 输出 Schema 约束格式
  - 后端校验响应结构
  - 前端兜底显示默认文案

### Risk 2: 首屏加载时间增加
- **风险**：新增字段可能增加 API 响应时间
- **缓解**：
  - 按需加载策略
  - 前端本地缓存（以日期为键）
  - 骨架屏优化感知体验

### Risk 3: 四维度评分算法复杂度
- **风险**：算法实现可能有 bug 或边界情况
- **缓解**：
  - 单元测试覆盖各种星象组合
  - 评分范围限制在 0-100
  - 日志记录评分计算过程

## Migration Plan

1. **阶段 1**：后端 API 扩展（新增字段，保持兼容）
2. **阶段 2**：前端 UI 重构（使用新字段，兼容旧字段）
3. **阶段 3**：测试验证
4. **阶段 4**：上线发布
5. **阶段 5**：监控反馈，迭代优化

**回滚策略**：
- 前端可通过 feature flag 切换新旧 UI
- 后端新字段为可选，不影响现有功能

## Resolved Questions

1. **AI 模型选择**：统一使用 DeepSeek chat 模式，不区分模块
2. **缓存策略**：本周趋势数据每日更新
3. **多语言支持**：仅支持中文，不需要英文输出
4. **评分可视化**：不显示评分依据，仅显示最终分数

---

## UI 设计方案

### 设计方向

**美学定位**: 东方禅意 × 现代极简 — 融合温暖大地色系与简洁数据可视化

**核心特点**:
- 浅色温暖背景（paper 色系）
- 大地棕/金色作为强调色
- 充足留白，层次分明
- 避免过度装饰，专注内容

### 色彩规范

| 用途 | Token | 说明 |
|------|------|------|
| 主色 | `--warm-brown` | 大地棕 |
| 强调色 | `--accent` | 金色 |
| 背景 | `--paper-100` | 温暖纸感 |
| 卡片背景 | `--paper-50` | 轻纸感层次 |
| 主文字 | `--star-50` | 主文本色 |
| 次文字 | `--paper-600` | 次级文本 |
| 弱文字 | `--paper-400` | 弱化文本 |
| 宜/积极 | `--success` | 橄榄绿 |
| 挑战 | `--danger` | 棕红色 |

### 模块设计要点

| 模块 | 设计特点 |
|------|----------|
| 概览卡片 | 大地棕渐变背景，大字号分数，横排幸运元素，今日总结 |
| 四维度 | 横向条形进度条，可点击展开详情，图标+标签+分数 |
| 宜忌 | 双栏对比，绿色/棕色语义区分，列表形式 |
| 时间窗口 | 垂直时间轴，能量标签色块，适合/避免提示 |
| 本周趋势 | 柱状图可视化，关键日期标注，本周总结 |

### 能量标签配色

```javascript
const ENERGY_COLORS = {
  '积极': { label: '积极', dotColor: 'var(--accent)', tagBg: 'var(--paper-200)', tagColor: 'var(--warm-brown)' },
  '平稳': { label: '平稳', dotColor: 'var(--success)', tagBg: 'var(--paper-200)', tagColor: 'var(--success)' },
  '放松': { label: '放松', dotColor: 'var(--paper-400)', tagBg: 'var(--paper-200)', tagColor: 'var(--paper-400)' },
  '挑战': { label: '挑战', dotColor: 'var(--danger)', tagBg: 'var(--paper-200)', tagColor: 'var(--danger)' }
};
```
