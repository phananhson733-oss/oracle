<!-- INPUT: 星盘配置优化的架构设计，区分盘类型、数据来源与视觉分层策略。 -->
<!-- OUTPUT: 变更设计说明。 -->
<!-- POS: 设计决策记录；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## Context
- 当前星盘配置（orb、天体显示、相位类型）为全局共用，无法按盘类型独立调整。
- 所有盘共用相同的相位线样式，导致信息层次不清、盘面混乱。
- 用户需要对不同场景（自我探索 vs 双人合盘 vs 日运）有不同的信息密度期望。

## Goals / Non-Goals
- Goals:
  - 实现按盘类型隔离的配置系统：本命盘、组合盘、对比盘、行运盘各自独立配置。
  - 明确每种盘的数据来源：个人数据、中点数据、双人数据。
  - 实现相位线视觉分层（前景/中景/背景），降低"毛线团"效应。
  - 默认配置符合心理占星阅读习惯：简洁、聚焦核心结构。
- Non-Goals:
  - 不引入用户自定义配置 UI（本阶段采用预设配置）。
  - 不更改星盘几何布局（圆环半径、宫位渲染）。
  - 不重构后端星历计算逻辑。

## Decisions

### 1. 盘类型分类与数据来源

| 盘类型 | 分类 | 数据来源 | 内盘 | 外盘 |
|--------|------|----------|------|------|
| 本命盘（Natal） | 单人盘 | 个人出生数据 | - | - |
| 组合盘（Composite） | 单人盘 | 两人中点数据 | - | - |
| 对比盘（Synastry） | 多人盘 | 两人本命数据 | Person A 本命 | Person B 本命 |
| 行运盘（Transit） | 多人盘 | 个人 + 当前天象 | 个人本命 | 当前行运 |

### 2. 配置结构设计

```typescript
interface ChartConfig {
  chartType: 'natal' | 'composite' | 'synastry' | 'transit';

  // 天体显示
  celestialBodies: {
    planets: boolean;      // 10大行星（默认 true）
    angles: boolean;       // AC/DC/MC/IC（默认 true）
    nodes: boolean;        // 月交点（默认 false）
    chiron: boolean;       // 凯龙（默认 false）
    lilith: boolean;       // 莉莉丝（默认 false）
    asteroids: boolean;    // 小行星（默认 false）
  };

  // 相位配置
  aspects: {
    conjunction: { enabled: boolean; orb: number };  // 0°
    opposition: { enabled: boolean; orb: number };   // 180°
    square: { enabled: boolean; orb: number };       // 90°
    trine: { enabled: boolean; orb: number };        // 120°
    sextile: { enabled: boolean; orb: number };      // 60°
    quincunx: { enabled: boolean; orb: number };     // 150°（默认关闭）
    semisquare: { enabled: boolean; orb: number };   // 45°（默认关闭）
    sesquiquadrate: { enabled: boolean; orb: number }; // 135°（默认关闭）
  };

  // 视觉分层
  visualLayers: {
    highlightThreshold: number;   // 高亮 orb 阈值（默认 2°）
    midgroundThreshold: number;   // 中景 orb 阈值（默认 4°）
    backgroundThreshold: number;  // 背景 orb 阈值（默认 6°）
  };
}
```

### 3. 默认配置（按盘类型）

#### 本命盘（Natal）- 阅读模式
```typescript
const NATAL_CONFIG: ChartConfig = {
  chartType: 'natal',
  celestialBodies: {
    planets: true,    // ☉☽☿♀♂♃♄♅♆♇
    angles: true,     // AC/DC/MC/IC
    nodes: false,
    chiron: false,
    lilith: false,
    asteroids: false,
  },
  aspects: {
    conjunction: { enabled: true, orb: 8 },
    opposition: { enabled: true, orb: 7 },
    square: { enabled: true, orb: 6 },
    trine: { enabled: true, orb: 6 },
    sextile: { enabled: true, orb: 4 },
    quincunx: { enabled: false, orb: 3 },
    semisquare: { enabled: false, orb: 2 },
    sesquiquadrate: { enabled: false, orb: 2 },
  },
  visualLayers: {
    highlightThreshold: 2,
    midgroundThreshold: 4,
    backgroundThreshold: 6,
  },
};
```

#### 组合盘（Composite）
```typescript
const COMPOSITE_CONFIG: ChartConfig = {
  chartType: 'composite',
  celestialBodies: {
    planets: true,
    angles: true,     // 中点 AC/MC
    nodes: false,
    chiron: false,
    lilith: false,
    asteroids: false,
  },
  aspects: {
    conjunction: { enabled: true, orb: 6 },
    opposition: { enabled: true, orb: 6 },
    square: { enabled: true, orb: 5 },
    trine: { enabled: true, orb: 5 },
    sextile: { enabled: true, orb: 4 },
    quincunx: { enabled: false, orb: 2 },
    semisquare: { enabled: false, orb: 2 },
    sesquiquadrate: { enabled: false, orb: 2 },
  },
  visualLayers: {
    highlightThreshold: 2,
    midgroundThreshold: 4,
    backgroundThreshold: 5,
  },
};
```

#### 对比盘（Synastry）
```typescript
interface SynastryConfig {
  chartType: 'synastry';
  inner: ChartConfig;  // Person A（内盘）
  outer: ChartConfig;  // Person B（外盘）
  crossAspects: {
    // 跨盘相位配置（A 行星 → B 行星）
    conjunction: { enabled: boolean; orb: number };
    opposition: { enabled: boolean; orb: number };
    square: { enabled: boolean; orb: number };
    trine: { enabled: boolean; orb: number };
    sextile: { enabled: boolean; orb: number };
  };
}

const SYNASTRY_CONFIG: SynastryConfig = {
  chartType: 'synastry',
  inner: { /* Person A 本命配置 */ },
  outer: { /* Person B 本命配置 */ },
  crossAspects: {
    conjunction: { enabled: true, orb: 6 },
    opposition: { enabled: true, orb: 6 },
    square: { enabled: true, orb: 5 },
    trine: { enabled: true, orb: 5 },
    sextile: { enabled: true, orb: 4 },
  },
};
```

#### 行运盘（Transit）
```typescript
interface TransitConfig {
  chartType: 'transit';
  inner: ChartConfig;  // 本命盘
  outer: {
    // 行运外盘配置
    celestialBodies: { /* 天体配置 */ };
    // 行运盘不绘制内部相位，仅绘制与本命的相位
  };
  transitAspects: {
    // 行运 → 本命相位配置
    conjunction: { enabled: boolean; orb: number };
    opposition: { enabled: boolean; orb: number };
    square: { enabled: boolean; orb: number };
    trine: { enabled: boolean; orb: number };
    sextile: { enabled: boolean; orb: number };
  };
}

const TRANSIT_CONFIG: TransitConfig = {
  chartType: 'transit',
  inner: { /* 本命盘配置 */ },
  outer: {
    celestialBodies: {
      planets: true,
      angles: false,  // 行运盘不显示四轴
      nodes: false,
      chiron: false,
      lilith: false,
      asteroids: false,
    },
  },
  transitAspects: {
    conjunction: { enabled: true, orb: 8 },
    opposition: { enabled: true, orb: 7 },
    square: { enabled: true, orb: 6 },
    trine: { enabled: true, orb: 6 },
    sextile: { enabled: true, orb: 4 },
  },
};
```

### 4. 相位线视觉分层策略

| 层级 | 条件 | 样式 |
|------|------|------|
| 前景（Foreground） | ☌☍□ 且 orb ≤ 2° | strokeWidth: 1.2, opacity: 0.9 |
| 中景（Midground） | 任意主相位 且 2° < orb ≤ 4° | strokeWidth: 0.8, opacity: 0.6 |
| 背景（Background） | △✶ 且 4° < orb ≤ 6° | strokeWidth: 0.5, opacity: 0.3 |

相位线颜色（保持现有）：
- 合相（conjunction）: #E7C46A（金黄）
- 冲相（opposition）: #E0635A（红色）
- 刑相（square）: #E0635A（红色）
- 拱相（trine）: #6FB6A8（青绿）
- 六合（sextile）: #7FA6E5（蓝色）

### 5. 图层渲染优先级

1. Layer 0（底图）: 宫位/星座背景（opacity: 0.1）
2. Layer 1（背景相位）: △✶ 且 orb > 4°
3. Layer 2（中景相位）: 所有相位 且 2° < orb ≤ 4°
4. Layer 3（前景相位）: ☌☍□ 且 orb ≤ 2°
5. Layer 4（行星点位）: 行星符号与圆点
6. Layer 5（四轴）: AC/DC/MC/IC（始终清晰）
7. Layer 6（标签）: 仅显示必要文本，其他 hover 显示

### 6. 默认展示策略（心理占星）

- 默认突出：☉（太阳）、☽（月亮）、ASC（上升点）及其紧张相位（冲/刑/合）
- 默认弱化：外行星（♅♆♇）之间的相位，除非 orb ≤ 2°
- 默认隐藏：次要相位（梅花、半刑等）与小天体

## Risks / Trade-offs
- 多套配置增加代码复杂度，需要清晰的配置管理机制。
- 默认配置可能不满足专业用户需求，但本阶段不引入用户自定义 UI。
- 相位分层渲染可能在复杂盘面（如群星）时仍显拥挤。

## Migration Plan
1. 定义配置类型与默认值（constants.ts, types.ts）。
2. 修改 AstroChart.tsx 接入配置系统，实现分层渲染。
3. 后端 orb 配置与前端同步，确保相位计算一致。
4. 各页面（探索自我/合盘/日运）传入对应配置。

## Open Questions
- 是否需要在未来引入用户自定义配置入口？（本阶段不做）
- 组合盘四轴是否总是显示？（本阶段默认显示）
