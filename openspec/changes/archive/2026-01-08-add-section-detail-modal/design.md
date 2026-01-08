# Design: add-section-detail-modal

## Context
当前应用中的技术规格表格（元素矩阵、相位表、行星/小行星/宫主星信息）仅展示星盘数据，缺乏专业占星解读。用户希望能够按需查看每个模块的详细解读，但又不希望在页面加载时自动生成大量 AI 内容，以避免性能问题和不必要的 API 调用。

## Goals / Non-Goals
**Goals:**
- 用户可在技术规格表格旁点击"查看详情"按钮
- 点击后弹窗展示该模块的 AI 生成占星解读
- AI 内容采用懒加载策略，仅在用户点击时生成
- 支持探索自我、今日运势、合盘三个页面的所有相关模块
- 后端统一管理 prompt 模板，确保解读质量一致

**Non-Goals:**
- 不修改现有表格组件的数据展示逻辑
- 不实现内容缓存（首期可考虑简单缓存，后续迭代）
- 不支持内容编辑或保存

## Decisions

### 1. API 设计
**Decision:** 新增单一 API 端点 `POST /api/detail`，通过参数区分不同模块和上下文。

**Rationale:**
- 统一入口便于管理和扩展
- 避免为每个模块创建单独的端点
- 便于后续添加新的解读类型

**API 参数:**
```typescript
interface DetailRequest {
  type: 'elements' | 'aspects' | 'planets' | 'asteroids' | 'rulers';
  context: 'natal' | 'transit' | 'synastry' | 'composite';
  lang: 'zh' | 'en';
  birth: BirthInput;           // 本命盘出生信息
  transitDate?: string;        // 行运日期（context=transit 时必需）
  partnerBirth?: BirthInput;   // 伴侣出生信息（context=synastry/composite 时必需）
  chartData: {                 // 相关星盘数据
    elements?: ElementsData;
    aspects?: AspectData[];
    planets?: PlanetPosition[];
    asteroids?: PlanetPosition[];
    rulers?: HouseRulerData[];
  };
}
```

**响应结构:**
```typescript
interface DetailResponse {
  type: string;
  context: string;
  lang: 'zh' | 'en';
  content: {
    title: string;           // 模块标题
    summary: string;         // 简要总结
    interpretation: string;  // 详细解读（Markdown 格式）
    highlights?: string[];   // 关键要点（可选）
  };
  meta?: AIContentMeta;
}
```

### 2. Prompt 模板设计
**Decision:** 为每种 type + context 组合设计专用 prompt 模板，存放于 `backend/prompts/detail/` 目录。

**模板结构:**
```
backend/prompts/detail/
├── elements-natal.md      # 本命盘元素矩阵解读
├── elements-composite.md  # 组合盘元素矩阵解读
├── aspects-natal.md       # 本命盘相位解读
├── aspects-transit.md     # 行运相位解读
├── aspects-synastry.md    # 合盘相位解读
├── planets-natal.md       # 本命行星解读
├── planets-transit.md     # 行运行星解读
├── asteroids-natal.md     # 小行星解读
├── rulers-natal.md        # 宫主星解读
└── ...
```

**Prompt 设计原则:**
- 输入包含具体的星盘数据（JSON 格式）
- 输出要求为结构化 JSON，包含 title、summary、interpretation
- interpretation 使用 Markdown 格式，便于前端渲染
- 语言由 lang 参数控制

### 3. 前端组件设计
**Decision:** 新增 `DetailModal` 弹窗组件和 `SectionHeader` 标题组件。

**DetailModal 组件:**
```tsx
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  error?: string;
  content?: DetailContent;
}
```

**SectionHeader 组件:**
```tsx
interface SectionHeaderProps {
  title: string;
  onDetailClick?: () => void;
  showDetailButton?: boolean;
}
```

### 4. 状态管理
**Decision:** 使用组件级 useState 管理弹窗状态和 API 调用，不引入全局状态。

**Rationale:**
- 每个页面的详情请求相互独立
- 避免不必要的状态同步复杂度
- 组件卸载时自动清理状态

**状态结构:**
```tsx
const [detailModal, setDetailModal] = useState<{
  isOpen: boolean;
  type: DetailType;
  loading: boolean;
  error?: string;
  content?: DetailContent;
}>({ isOpen: false, type: 'elements', loading: false });
```

### 5. 用户交互流程
```
用户点击"查看详情"按钮
    ↓
打开弹窗，显示加载状态
    ↓
调用 /api/detail 获取 AI 解读
    ↓
成功：显示解读内容
失败：显示错误提示，允许重试
    ↓
用户关闭弹窗
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| AI 生成延迟导致用户等待 | 显示骨架屏加载状态；考虑后续增加内容缓存 |
| API 调用失败 | 显示友好错误提示，提供重试按钮 |
| prompt 模板维护成本 | 采用模板继承/组合模式，减少重复 |
| 内容质量不一致 | 统一 prompt 模板，后端集中管理 |

## Migration Plan
1. 后端先实现 API 端点和 prompt 模板
2. 前端实现 DetailModal 组件
3. 逐步为各页面添加"查看详情"按钮
4. 全量测试后发布

## Open Questions
1. 是否需要实现内容缓存？（建议首期不做，观察使用频率后决定）
2. 解读内容是否需要支持导出/分享？（建议首期不做）
