# Proposal: 增强 Wiki 深度解读(Deep Dive)、i18n 数据补全与前端缓存

## 背景

当前 Wiki 百科功能存在以下问题：
1. **静态数据大部分为占位符内容**，需要补全所有条目的完整内容
2. **缺乏系统性的深度解读**，用户需要针对不同类型的占星概念获得更专业的分步骤解析
3. **前端 Wiki API 调用缺少本地缓存机制**，导致每次访问都需要重新请求

本提案整合了内容生成与前端缓存两方面的改进。

### 现状分析

1. **已有 deep_dive 内容的条目（约 15 个）**：
   - Saturn（土星）- 3 步骤
   - Elements（四元素）- 4 步骤
   - Modes（三模式）- 3 步骤
   - 4 种星盘类型（Natal, Synastry, Composite, Transits）- 各 2 步骤
   - 4 轴（ASC, DSC, MC, IC）- 各 2 步骤
   - 虚点（North Node, South Node）- 各 2 步骤
   - 小行星（Chiron, Lilith, Juno）- 各 2 步骤

2. **缺失 deep_dive 的条目（约 50 个）**：
   - 行星（9 个）：Sun, Moon, Mercury, Venus, Mars, Jupiter, Uranus, Neptune, Pluto
   - 星座（12 个）：所有 12 星座
   - 宫位（12 个）：所有 12 宫位
   - 相位（5 个）：Conjunction, Opposition, Square, Trine, Sextile

3. **前端 API 客户端** (`services/apiClient.ts`)：
   - `fetchWikiItems`、`fetchWikiItem`、`fetchWikiSearch` 未使用 localStorage 缓存
   - 仅 `fetchWikiHome` 有缓存（因为包含 AI 生成的每日内容）

4. **用户提供的 Prompt 模板**（8 套）：
   - 星座、宫位、相位、四元素、三模式、虚点和小行星、四轴、星盘类型

## 目标

### 主要目标

1. **拆解综合 Prompt 为条目专属 Prompt**
   - 将用户提供的综合 prompt 拆解为每个具体概念的专属 prompt
   - 每个条目都有其独特的侧重点、关键词、阴影特质和整合方向
   - 详见 `design.md` 第 2 节完整拆解表

2. **为所有占星条目生成深度解读内容**
   - 调用大模型（DeepSeek）为每个条目生成中英文双语静态文本
   - 生成内容存储在 `backend/src/data/wiki-*.ts` 中
   - 每个 deep_dive 包含 4-8 个步骤

3. **扩展 WikiItem 字段**
   - 补充 `life_areas`：影响的生活领域（事业、爱情、健康等）
   - 补充 `growth_path`：成长路径建议
   - 补充 `practical_tips`：3-5 条实用小贴士
   - 补充 `common_misconceptions`：2-3 条常见误解澄清
   - 补充 `affirmation`：正向肯定语

4. **新增细分条目**
   - 将 Elements（四元素）拆分为 4 个独立条目
   - 将 Modes（三模式）拆分为 3 个独立条目

5. **前端永久缓存机制**
   - Wiki 条目数据在首次加载后永久缓存到 localStorage
   - 仅手动清理或版本更新时刷新
   - 添加缓存版本控制机制

## 方案概要

### 1. Prompt 模板拆解（详见 design.md）

| 类别 | 条目数 | 拆解后 Prompt 数 | 专属变体内容 |
|------|--------|-----------------|-------------|
| 行星 | 10 | 10 | 原型、守护星座、核心关键词、特殊侧重点 |
| 星座 | 12 | 12 | 元素、模式、守护星、对宫、身体对应 |
| 宫位 | 12 | 12 | 自然星座、守护星、对宫、生活领域 |
| 相位 | 5 | 5 | 角度、性质、行星组合示例 |
| 四元素 | 4 | 4 | 代表星座、荣格功能、能量表现 |
| 三模式 | 3 | 3 | 代表星座、季节位置、能量特点 |
| 四轴 | 4 | 4 | 对应宫位、对轴关系 |
| 虚点/小行星 | 5 | 5 | 类型、核心议题 |
| 星盘类型 | 4 | 4 | 用途、解读重点 |

### 2. 新增字段示例

```typescript
// 以白羊座为例
{
  id: 'aries',
  // ... 现有字段 ...
  life_areas: [
    { area: 'career', description: '适合需要开创精神和领导力的工作，如创业、销售、体育...' },
    { area: 'love', description: '在爱情中热烈主动，但需要学习持久经营和考虑伴侣感受...' }
  ],
  growth_path: '白羊座的成长之路是从"我要"到"我们要"，学习在保持热情的同时培养耐心...',
  practical_tips: [
    '冲动时数到 10 再行动',
    '设立短期目标获得成就感',
    '找到健康的愤怒出口如运动'
  ],
  common_misconceptions: [
    '白羊座只会冲动不会思考（实际上他们的直觉往往很准）',
    '白羊座不适合长期关系（学会成长后可以很忠诚）'
  ],
  affirmation: '我的勇气是礼物，我选择用它照亮而非灼伤。'
}
```

### 3. 数据文件拆分

```
backend/src/data/
├── wiki.ts              # 保留基础结构和统一导出
├── wiki-planets.ts      # 行星深度内容（10 条目）
├── wiki-signs.ts        # 星座深度内容（12 条目）
├── wiki-houses.ts       # 宫位深度内容（12 条目）
├── wiki-aspects.ts      # 相位深度内容（5 条目）
├── wiki-concepts.ts     # 核心概念（元素、模式等）
└── wiki-prompts.ts      # Prompt 模板定义
```

### 4. 前端缓存实现

```typescript
// 缓存 key 格式
const WIKI_CACHE_VERSION = 'v1';
const buildWikiItemsCacheKey = (lang: Language) =>
  `${LOCAL_CACHE_PREFIX}:wiki_items:${WIKI_CACHE_VERSION}:${lang}`;
const buildWikiItemCacheKey = (id: string, lang: Language) =>
  `${LOCAL_CACHE_PREFIX}:wiki_item:${WIKI_CACHE_VERSION}:${id}:${lang}`;

// 永久缓存（无 TTL）
// 更新版本号 WIKI_CACHE_VERSION 时自动失效旧缓存
```

### 5. 缓存策略

| 数据类型 | 缓存策略 | 说明 |
|---------|---------|------|
| Wiki Items 列表 | 永久缓存 | 按语言缓存完整列表 |
| Wiki Item 详情 | 永久缓存 | 按 id + 语言缓存单条详情 |
| Wiki Search | 不缓存 | 搜索结果可能变化 |
| Wiki Home | 日级缓存 | 保持现有策略（包含 AI 每日内容）|

### 6. 内容生成流程

```
1. 定义 Prompt 模板
   ↓
2. 编写生成脚本（backend/scripts/generate-wiki-content.ts）
   ↓
3. 调用 DeepSeek API 生成中英文内容
   ↓
4. 自动验证（结构完整性、占位符检测）
   ↓
5. 输出待审核文件
   ↓
6. 人工审核（用户负责）
   ↓
7. 合并到主数据文件
```

## 变更范围

### 后端变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| backend/src/data/wiki.ts | 修改 | 拆分为多文件，保留导出接口 |
| backend/src/data/wiki-planets.ts | 新增 | 行星深度内容 |
| backend/src/data/wiki-signs.ts | 新增 | 星座深度内容 |
| backend/src/data/wiki-houses.ts | 新增 | 宫位深度内容 |
| backend/src/data/wiki-aspects.ts | 新增 | 相位深度内容 |
| backend/src/data/wiki-concepts.ts | 新增 | 核心概念深度内容 |
| backend/src/data/wiki-prompts.ts | 新增 | Prompt 模板定义 |
| backend/scripts/generate-wiki-content.ts | 新增 | 内容生成脚本 |
| backend/src/types/api.ts | 修改 | 扩展 WikiItem 类型 |

### 前端变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| services/apiClient.ts | 修改 | 添加 Wiki 永久缓存逻辑 |
| components/WikiItemCard.tsx | 修改 | 支持显示新增字段 |
| 可选 | 新增 | 缓存清理工具函数 |

## 工作量估算

| 任务类别 | 条目数 | 内容生成 | 审核时间（用户） |
|---------|--------|---------|----------------|
| 行星 deep_dive | 10 | ~20 分钟 | ~1 小时 |
| 星座 deep_dive | 12 | ~24 分钟 | ~1.5 小时 |
| 宫位 deep_dive | 12 | ~24 分钟 | ~1.5 小时 |
| 相位 deep_dive | 5 | ~10 分钟 | ~30 分钟 |
| 元素细分 | 4 | ~8 分钟 | ~20 分钟 |
| 模式细分 | 3 | ~6 分钟 | ~15 分钟 |
| 现有内容优化 | 13 | ~26 分钟 | ~1 小时 |
| 前端缓存实现 | - | ~30 分钟 | - |
| **总计** | **59** | **~2.5 小时** | **~6 小时** |

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 大模型生成内容质量不稳定 | 详细的专属 Prompt + 自动验证 + 人工审核 |
| 中英文内容不一致 | 分别生成，结构强制一致，术语词典对照 |
| 文件体积过大 | 按类别拆分文件，生产环境启用 gzip |
| 占星术语翻译不准确 | 参考权威占星术语词典 |
| 缓存占用过多 localStorage | 估算：~200KB 压缩后，可接受 |
| 内容更新后用户看不到 | 版本号机制 + 可选的手动清理按钮 |

## 成功标准

### 内容完整性
1. 所有 88+ 个占星条目都有完整的 deep_dive 内容（4-8 步骤）
2. 所有条目的新增字段完整（life_areas, growth_path, practical_tips, common_misconceptions, affirmation）
3. 无任何条目包含占位符文本

### 双语一致性
4. 中英文内容结构一致
5. 占星术语翻译准确

### 新增内容
6. 新增的 7 个细分条目（4 元素 + 3 模式）正常显示

### 前端缓存
7. 首次加载后离线可访问 Wiki 详情
8. 重复访问时无网络请求（从缓存读取）
9. 版本更新时自动失效旧缓存

## 依赖关系

- 依赖 DeepSeek API 的可用性

## 审核流程

由用户负责审核生成内容：
1. 生成脚本输出待审核 JSON 文件
2. 用户审核内容准确性、专业性
3. 标记需要修改的条目
4. 重新生成或手动修复
5. 确认后合并到主数据文件

## 参考文档

- `design.md`：完整的 Prompt 拆解表、输出格式规范、生成脚本设计
- `tasks.md`：详细的任务清单
- `specs/wiki-deep-dive/spec.md`：需求规范与验收标准
