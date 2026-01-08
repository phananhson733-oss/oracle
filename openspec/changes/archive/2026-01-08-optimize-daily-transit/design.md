# Design: optimize-daily-transit

## Architecture Overview

本变更涉及前后端协同优化，采用增量迭代策略，确保向后兼容。

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  TodayPage                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Entry View (New Structure)                          │    │
│  │  ┌─────────────────────────────────────────────────┐│    │
│  │  │ Today's Theme: title + explanation              ││    │
│  │  ├─────────────────────────────────────────────────┤│    │
│  │  │ 4 Dimensions: Energy/Tension/Frictions/Pleasures││    │
│  │  ├─────────────────────────────────────────────────┤│    │
│  │  │ Daily Focus:                                    ││    │
│  │  │  • Move forward (action)                        ││    │
│  │  │  • Communication trap (avoid)                   ││    │
│  │  │  • Best window (morning/midday/evening)         ││    │
│  │  └─────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Detail View (Expanded)                              │    │
│  │  ┌─────────────────────────────────────────────────┐│    │
│  │  │ Transit Chart (AstroChart type="transit")       ││    │
│  │  ├─────────────────────────────────────────────────┤│    │
│  │  │ Narrative: Theme → Scenes → Challenge → Practice││    │
│  │  ├─────────────────────────────────────────────────┤│    │
│  │  │ TransitTechSpecs:                               ││    │
│  │  │  • Square Aspect Matrix                         ││    │
│  │  │  • Planet Table                                 ││    │
│  │  │  • Asteroid Table                               ││    │
│  │  │  • House Ruler Table                            ││    │
│  │  └─────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  Prompts (manager.ts)                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ daily-forecast v3.0                                  │    │
│  │  • theme_title + theme_explanation                   │    │
│  │  • four_dimensions (renamed)                         │    │
│  │  • daily_focus (new structure)                       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ daily-detail v3.0                                    │    │
│  │  • personalization.natal_trigger                     │    │
│  │  • personalization.pattern_activated                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Services                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ astroService.calculateTransitChart()                 │    │
│  │  → returns: transit positions, aspects, overlays     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. 正方形相位表 vs 三角形相位表

**决策**：采用正方形相位表

**理由**：
- 用户需求明确要求正方形布局
- 正方形布局可显示所有行星对（包括对角线）
- 与三角形相比，信息密度更高
- 对称性更好，视觉上更平衡

**实现方式**：
```tsx
// 修改 AspectMatrix 或新建 SquareAspectMatrix
// 区别：不再只显示下三角，而是显示完整矩阵
// 对角线：显示行星图标
// 非对角线：显示相位符号和度数
```

### 2. 行运星盘数据结构

**决策**：复用现有 AstroChart 组件，扩展 transit 类型处理

**数据流**：
```
UserProfile + Date
    ↓
calculateNatalChart(profile)  →  inner ring
calculateTransitChart(date)   →  outer ring
    ↓
AstroChart(type="transit")
    ↓
Bi-wheel visualization
```

**接口设计**：
```typescript
interface TransitChartData {
  natal: {
    positions: PlanetPosition[];
    aspects: Aspect[];
  };
  transit: {
    positions: PlanetPosition[];
    aspects: Aspect[];  // 行运行星之间
  };
  crossAspects: Aspect[];  // 行运行星与本命行星之间
}
```

### 3. Daily Focus 三件套结构

**决策**：将原有 best_use/avoid 重构为更行动导向的三件套

**映射关系**：
```
原结构:
  strategy.best_use → daily_focus.move_forward
  strategy.avoid    → daily_focus.communication_trap
  (new)             → daily_focus.best_window

新结构好处:
  1. move_forward = 行动闭环（单一焦点）
  2. communication_trap = 关系闭环（欧美用户买单）
  3. best_window = 可信度加成（时间维度）
```

### 4. 向后兼容策略

**决策**：新字段可选，旧字段保留

**实现**：
```typescript
// types.ts
interface DailyPublicContent {
  // 保留旧字段（可选）
  anchor_quote?: string;
  strategy?: { best_use: string; avoid: string };

  // 新增字段（可选）
  theme_explanation?: string;
  daily_focus?: {
    move_forward: string;
    communication_trap: string;
    best_window: 'morning' | 'midday' | 'evening';
  };
}

// 前端渲染逻辑
const theme = data.theme_explanation || data.anchor_quote;
const focus = data.daily_focus || {
  move_forward: data.strategy?.best_use,
  communication_trap: data.strategy?.avoid,
  best_window: 'morning'
};
```

### 5. 个性化触发点

**决策**：在详情页增加"为什么这和我有关"区块

**Prompt 扩展**：
```
personalization: {
  natal_trigger: "哪个本命位置被激活",
  pattern_activated: "激活了什么心理模式",
  why_today: "为什么今天特别相关"
}
```

**UI 展示**：
```tsx
<Card className="border-l-4 border-gold-500">
  <div className="text-xs uppercase text-gold-500 mb-2">
    为什么这和你有关
  </div>
  <p>{data.personalization?.natal_trigger}</p>
  <p>{data.personalization?.pattern_activated}</p>
</Card>
```

## Component Hierarchy

```
TodayPage
├── Header (date, greeting)
├── EntryCard
│   ├── TodayTheme (title + explanation)
│   ├── FourDimensions
│   │   └── DetailedScoreRow × 4
│   ├── TimeWindows (morning/midday/evening)
│   └── DailyFocus (3 items)
├── [Detail Button]
└── DetailSection (conditional)
    ├── AstroChart (type="transit", scale=0.72)
    ├── ThemeElaborated
    ├── HowItShowsUp (3 cards)
    ├── PersonalizationCard (new)
    ├── ChallengeCard
    ├── PracticeCard
    ├── QuestionCard
    └── TransitTechSpecs
        ├── SquareAspectMatrix (new)
        ├── PlanetTable
        ├── AsteroidTable (reuse PlanetTable)
        └── HouseRulerTable
```

## API Changes

### Existing Endpoints (No Change)
- `POST /api/content` - 已支持 DAILY_PUBLIC 和 DAILY_DETAIL

### Prompt Version Upgrade
- `daily-forecast`: v2.0 → v3.0
- `daily-detail`: v2.0 → v3.0

### Cache Invalidation
- 版本升级自动使缓存失效（cache key 包含版本号）

## Migration Path

1. **Phase 1**: 后端 Prompt 更新（新字段可选）
2. **Phase 2**: 前端类型更新（兼容新旧字段）
3. **Phase 3**: 前端 UI 更新（优先使用新字段）
4. **Phase 4**: 清理旧字段（下一个版本）
