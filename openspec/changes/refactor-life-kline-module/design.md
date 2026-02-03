# Design: 人生K线模块重构

## Context

当前K线页面仅是行星周期的列表展示，缺乏真正的「K线图」可视化和深度内容。用户提供了一个完整的 React 原型设计，包含：
- 基于 SVG 的K线图绘制
- 占星周期（土星回归、木星回归等）算法
- 年度详情弹窗与四维评分
- 付费解锁的报告章节

需要将设计理念移植到微信小程序，使用原生语法重新实现。

## Goals / Non-Goals

### Goals
- 提供真正的K线图可视化，展示人生100年的运势走势
- 融合西方占星（行星周期）与中国传统（八字干支）
- 提供深度的年度解读内容
- 建立付费解锁机制，实现商业变现

### Non-Goals
- 不追求股票级别的K线技术指标（MA、MACD等）
- 不提供实时数据更新
- 暂不支持多人K线对比

## Decisions

### Decision 1: K线图使用 Canvas 2D 绘制

**原因**：
- 微信小程序的 SVG 支持有限
- Canvas 2D 性能更好，支持复杂交互
- 已有 astro-chart 组件的 Canvas 绘制经验可复用

**实现要点**：
- 使用 `wx:if` 控制 Canvas 显示（避免弹窗被遮挡）
- 绘制前检查节点就绪状态
- 支持点击K线柱体触发年度详情

### Decision 2: K线数据生成逻辑前后端分离

**方案**：
- 前端保留一套简化的本地算法（用于快速预览）
- 后端提供精确的星历计算版本（用于付费内容）

**原因**：
- 用户首次进入可快速看到预览图
- 付费内容需要更精确的星历计算支持

### Decision 3: 年度报告内容分层

| 内容类型 | 免费用户 | 付费用户 |
|----------|----------|----------|
| K线图 | 全部可见 | 全部可见 |
| 年度详情弹窗 | 基础信息 | 完整内容 |
| 人生运势总览 | 可见 | 可见 |
| 命运回溯 | 可见 | 可见 |
| 当下定位 | 可见 | 可见 |
| 未来30年详解 | 锁定 | 可见 |
| 人生里程碑 | 锁定 | 可见 |
| 给未来的你 | 锁定 | 可见 |

### Decision 4: K线数据算法设计

基于用户提供的 React 原型，核心算法：

```javascript
// 基础分 50，叠加周期影响
let score = 50;

// 土星周期 (29.5年) - 挑战期
const saturnPhase = (age % 29.5) / 29.5;
if (Math.abs(saturnPhase) < 0.05) score -= 12;  // 土星回归
if (Math.abs(saturnPhase - 0.5) < 0.05) score -= 8;  // 土星对分

// 木星周期 (12年) - 机遇期
const jupiterPhase = (age % 12) / 12;
if (Math.abs(jupiterPhase) < 0.08) score += 15;  // 木星回归

// 天王星对分 (42岁左右) - 中年觉醒
if (age >= 40 && age <= 44) score -= 8;

// 加入随机波动模拟人生起伏
const seed = (year * 7 + age * 13) % 100;
score += (seed / 100 - 0.5) * 25;
```

### Decision 5: 弹窗与 Canvas 层级处理

遵循 CLAUDE.md 中的原生组件层级规范：

```html
<!-- 弹窗显示时隐藏 Canvas -->
<canvas
  wx:if="{{!showYearDetail && !showPayment}}"
  type="2d"
  id="klineChart"
></canvas>
```

弹窗关闭后延迟重绘：
```javascript
closeYearDetail() {
  this.setData({ showYearDetail: false }, () => {
    setTimeout(() => this.drawKlineChart(), 50);
  });
}
```

## Data Model

### KLineData（前端数据结构）

```typescript
interface KLineData {
  year: number;          // 年份
  age: number;           // 年龄
  ganzhi: {              // 干支
    stem: string;        // 天干
    branch: string;      // 地支
    full: string;        // 完整干支
  };
  open: number;          // 开盘值 0-100
  close: number;         // 收盘值 0-100
  high: number;          // 最高值 0-100
  low: number;           // 最低值 0-100
  score: number;         // 综合评分
  trend: 'bull' | 'bear'; // 涨/跌
  isCurrentYear: boolean;
  isSaturnReturn: boolean;
  isJupiterReturn: boolean;
  isUranusOpposition: boolean;
}
```

### YearlyReport（年度报告）

```typescript
interface YearlyReport {
  theme: string;                    // 年度主题
  majorEvent: {                     // 重要事件
    name: string;
    impact: number;
    description: string;
  } | null;
  dimensions: {
    career: { score: number; analysis: string };
    wealth: { score: number; analysis: string };
    love: { score: number; analysis: string };
    health: { score: number; analysis: string };
  };
  monthly: Array<{
    month: number;
    score: number;      // 1-5 星
    keyword: string;
    note: string;
  }>;
  actionAdvice: {
    mustDo: string[];
    mustNot: string[];
  };
  astroSummary: string;
  baziSummary: string;
  personalMessage: string;
}
```

## API Design

### GET /api/kline/generate

生成K线数据。

**Request**:
```
?birthDate=1990-06-15&birthTime=10:00&birthCity=上海&lat=31.23&lon=121.47&timezone=8
```

**Response**:
```json
{
  "klineData": [
    {
      "year": 1990,
      "age": 1,
      "ganzhi": { "stem": "庚", "branch": "午", "full": "庚午" },
      "open": 50,
      "close": 52,
      "high": 58,
      "low": 45,
      "score": 52,
      "trend": "bull",
      "isSaturnReturn": false,
      "isJupiterReturn": false,
      "isUranusOpposition": false
    }
    // ... 100条数据
  ],
  "natalChart": {
    "sunSign": { "name": "双子座", "symbol": "♊", "element": "air" },
    "moonSign": { "name": "处女座", "symbol": "♍", "element": "earth" },
    "ascendant": { "name": "狮子座", "symbol": "♌", "element": "fire" }
  }
}
```

### GET /api/kline/year-report

生成年度深度报告（付费内容）。

**Request**:
```
?birthDate=1990-06-15&year=2026&userId=xxx
```

**Response**:
```json
{
  "requiresPayment": false,
  "report": {
    "theme": "木星回归·扩张与机遇",
    "majorEvent": {
      "name": "木星回归",
      "impact": 15,
      "description": "每12年一次的木星回归是您的幸运年..."
    },
    "dimensions": { ... },
    "monthly": [ ... ],
    "actionAdvice": { ... },
    "astroSummary": "...",
    "baziSummary": "...",
    "personalMessage": "..."
  }
}
```

## Risks / Trade-offs

### Risk 1: Canvas 性能
- **风险**: 100条K线数据绘制可能卡顿
- **缓解**: 实现视图范围切换，每次只绘制50条

### Risk 2: AI 生成内容一致性
- **风险**: 相同用户多次查看同一年份可能得到不同内容
- **缓解**: 缓存已生成的报告（Redis 30天）

### Risk 3: 付费转化
- **风险**: 用户可能不愿为「娱乐内容」付费
- **缓解**: 免费内容足够吸引，付费内容提供明显增值

## Migration Plan

1. 新建页面组件，不修改现有 kline 页面
2. 完成开发测试后，替换路由指向新页面
3. 保留旧页面代码一周作为回滚备份
4. 确认无问题后删除旧代码

## Open Questions

1. K线报告单次购买价格 ¥29.9 是否合适？是否需要做 A/B 测试？
2. 是否需要支持「分享K线图」功能生成图片？
3. 月度运势是否需要支持日历视图？
