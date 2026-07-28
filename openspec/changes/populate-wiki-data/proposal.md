# Proposal: Wiki 百科静态数据完善与前端永久缓存

## 背景

当前 Wiki 百科功能的静态数据大部分为占位符内容，需要补全所有条目的完整内容。同时，前端 Wiki API 调用缺少本地缓存机制，导致每次访问都需要重新请求。

### 现状分析

1. **后端静态数据** (`backend/src/data/wiki.ts`)：
   - 已有完整内容：Saturn、Elements、Modes、四种星盘类型、四轴、北交南交、Chiron、Lilith、Juno
   - 占位符内容：大部分行星（Sun, Moon, Mercury 等）、所有星座、大部分宫位（2-12宫）、所有相位
   - 使用 `buildZhPlaceholder(title)` 和 `buildEnPlaceholder(title)` 生成占位符

2. **前端 API 客户端** (`services/apiClient.ts`)：
   - `fetchWikiItems`、`fetchWikiItem`、`fetchWikiSearch` 未使用 localStorage 缓存
   - 仅 `fetchWikiHome` 有缓存（因为包含 AI 生成的每日内容）

## 目标

1. **补全所有 Wiki 条目的完整内容**
   - 为每个条目填写：`astronomy_myth`、`psychology`、`shadow`、`integration`
   - 为复杂条目添加 `deep_dive` 步骤式深入解读
   - 支持中英双语

2. **前端永久缓存机制**
   - Wiki 条目数据在首次加载后永久缓存到 localStorage
   - 仅手动清理或版本更新时刷新
   - 添加缓存版本控制机制

## 方案

### 1. 后端数据补全

补全以下类别的条目内容：

| 类别 | 待补全数量 | 内容要求 |
|------|-----------|---------|
| 行星 (planets) | 7 (Sun, Moon, Mercury, Venus, Mars, Jupiter, Uranus, Neptune, Pluto) | astronomy_myth, psychology, shadow, integration, deep_dive |
| 星座 (signs) | 11 (除 Scorpio 外) | astronomy_myth, psychology, shadow, integration, deep_dive |
| 宫位 (houses) | 11 (第2-12宫) | astronomy_myth, psychology, shadow, integration |
| 相位 (aspects) | 4 (opposition, trine, square, sextile) | astronomy_myth, psychology, shadow, integration |

### 2. 前端缓存实现

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

### 3. 缓存策略

- **Wiki Items 列表**：按语言缓存完整列表
- **Wiki Item 详情**：按 id + 语言缓存单条详情
- **Wiki Search**：不缓存（搜索结果可能变化）
- **Wiki Home**：保持现有日级缓存（包含 AI 每日内容）

## 变更范围

### 后端变更

- `backend/src/data/wiki.ts`：补全所有条目的详细内容

### 前端变更

- `services/apiClient.ts`：添加 Wiki 永久缓存逻辑
- 可选：添加缓存清理工具函数

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 缓存占用过多 localStorage | 估算：~200KB 压缩后，可接受 |
| 内容更新后用户看不到 | 版本号机制 + 可选的手动清理按钮 |
| 双语内容不一致 | 统一编写流程，确保同步更新 |

## 成功标准

1. 所有 Wiki 条目显示完整内容（无占位符）
2. 首次加载后离线可访问 Wiki 详情
3. 重复访问时无网络请求（从缓存读取）
