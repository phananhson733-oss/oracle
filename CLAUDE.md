<!-- INPUT: Claude 工具的 OpenSpec 助手指引与 UI 规范入口。 -->
<!-- OUTPUT: Claude 助手入口说明（含 UI 规范入口）。 -->
<!-- POS: Claude 助手入口文档（含 UI 规范入口）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

## PRD 同步规范（最高优先级 — 强制执行）

**`docs/PRD.md` 是本项目的唯一权威规范文档（Single Source of Truth）。**

所有代码变更必须与 PRD 保持同步，违反此规则视为变更未完成。

### 强制规则

1. **变更前判定**：每次执行任何代码变更（bug 修复、功能新增、优化、重构、配置调整）前，必须先判定该变更是否涉及 PRD 中记录的内容（API 路由、前端路由、数据库 Schema、功能模块、定价、配额、技术栈、项目结构等）
2. **同步更新**：如果涉及，则必须在同一次变更中同步更新 `docs/PRD.md`，不可遗漏
3. **版本递增**：每次更新 PRD 时，递增 Version 号（如 1.1 → 1.2）并更新 Last Updated 日期
4. **不可延后**：禁止"先改代码后补文档"，PRD 更新必须与代码变更同步完成

### 判定清单（变更时逐项检查）

| 变更类型 | 需要更新 PRD 的情况 |
|----------|---------------------|
| **新增/删除 API 端点** | 更新对应模块的 API 列表 + 4.3 API 端点清单 |
| **新增/删除前端路由** | 更新对应模块的路由描述 |
| **数据库 Schema 变更** | 更新 4.4 数据库 Schema |
| **新增/删除功能模块** | 更新第 2 节功能模块 |
| **定价/配额变更** | 更新第 3 节商业模式 |
| **技术栈/依赖变更** | 更新 4.1 技术栈 |
| **项目结构变更** | 更新 4.2 项目结构 |
| **Prompt 模板增删** | 更新 4.5 Prompt 模板清单 |
| **支付方式变更** | 更新 3.5 支付方式 |
| **部署配置变更** | 更新 4.7 部署架构 |
| **纯内部重构/样式微调** | 通常不需要，除非影响上述内容 |

### 规范优先级

```
PRD (docs/PRD.md)          ← 最高：产品功能、API、Schema、商业模式的权威来源
  ↓
CLAUDE.md                  ← 开发规范：编码规范、技术约束、工作流规则
  ↓
COLOR_SYSTEM_GUIDE.md      ← UI 规范：颜色、设计令牌
  ↓
模块级 FOLDER.md           ← 模块说明：各子目录的职责与约定
```

---

## 产品定位

**AstroMind 是一款面向欧美用户的现代占星应用。**

所有设计、开发、内容决策都必须以此为最高目标：

1. **目标用户**：欧美地区 18-35 岁年轻人
2. **语言规范**：主要语言为英文，支持中文作为辅助语言
3. **文化背景**：基于西方占星学体系，符合欧美用户的文化认知
4. **内容风格**：现代、年轻化、心理学导向，避免过度玄学化表述
5. **交互体验**：符合欧美用户习惯，参考主流国际化 App 的交互模式
6. **支付方式**：优先支持 PayPal、信用卡等欧美主流支付方式

<!-- OPENSPEC:START -->
# OpenSpec 指令

这些说明用于本项目的 AI 助手。

当请求满足以下情况时，必须打开 `@/openspec/AGENTS.md`：
- 提到规划或提案（例如 proposal、spec、change、plan）
- 引入新能力、破坏性变更、架构调整或重要性能/安全工作
- 请求含糊，需要权威规范再继续

使用 `@/openspec/AGENTS.md` 以了解：
- 如何创建并应用变更提案
- 规范格式与约定
- 项目结构与指南

保持此管理块，以便 `openspec update` 可刷新指令。

<!-- OPENSPEC:END -->

## 国际化 (i18n) 规范

### 产品语言策略

根据产品定位（欧美 18-35 岁用户），语言优先级为：

1. **主语言**：英文（默认）
2. **辅助语言**：中文（语言切换选项）

### 前端 Web i18n 实现

**核心文件**：
- `components/UIComponents.tsx` - LanguageContext 提供器（默认语言：`en`）
- `constants.ts` - TRANSLATIONS 全局翻译词典

**使用规范**：
```typescript
// ✅ 正确：使用 useLanguage hook
import { useLanguage } from './components/UIComponents';
const { t, language } = useLanguage();

// 在 JSX 中使用翻译
<button>{t.subscription?.upgrade || 'Upgrade Now'}</button>

// ❌ 错误：硬编码中英文
<button>{language === 'zh' ? '升级' : 'Upgrade'}</button>
<button>升级</button>
```

**添加新翻译键**：
1. 在 `constants.ts` 的 `TRANSLATIONS.en` 和 `TRANSLATIONS.zh` 中添加对应键值对
2. 使用点符号访问嵌套对象（如 `t.paywall?.unlock_action`）
3. 始终提供英文后备值（`|| 'English Fallback'`）

**翻译键命名规范**：
- 使用小写下划线命名：`unlock_action`, `subscribe_title`
- 按功能模块分组：`paywall.*`, `subscription.*`, `gm.*`
- 避免重复前缀：`paywall.unlock_action` 而非 `paywall.paywall_unlock_action`

### 后端 API i18n（已完成 ✅）

**语言参数支持**：
所有 API 端点都支持 `lang` 参数（通过 `resolveLang()` 统一处理）：
```typescript
// API 请求示例
GET /api/natal/overview?lang=en
POST /api/ask { lang: 'zh', question: '...' }
```

**错误消息规范**：
- ✅ 所有 API 错误响应都使用英文（符合产品定位）
- 示例：`{ error: 'Authentication required' }`, `{ error: 'PayPal service unavailable' }`
- 不需要翻译错误消息，因为目标用户是欧美用户

**Prompts 系统（双语支持）**：
- `SINGLE_LANGUAGE_INSTRUCTION` - 中文版 AI 指令
- `SINGLE_LANGUAGE_INSTRUCTION_EN` - 英文版 AI 指令
- `resolveSynastryLang()` - 合盘模块语言解析
- `formatSynastryContextBlock()` - 根据语言动态生成上下文

**支持语言参数的 API**：
- ✅ Natal API (`natal.ts`)
- ✅ Daily API (`daily.ts`)
- ✅ Ask API (`ask.ts`)
- ✅ Synastry API (`synastry.ts`)
- ✅ Wiki API (`wiki.ts`)
- ✅ CBT API (`cbt.ts`)
- ✅ Cycle API (`cycle.ts`)

## UI 规范入口

- 唯一 UI 规范来源：[COLOR_SYSTEM_GUIDE.md](./COLOR_SYSTEM_GUIDE.md)。
- UI 变更必须对照该规范，并在 PR 中填写「UI 规范符合说明」（模板：`PULL_REQUEST_TEMPLATE.md`）。

## Prompt 架构规范

后端 Prompt 系统采用集中注册式架构，所有模板在 `manager.ts` 中统一注册和管理。

**核心文件**：
- `backend/src/prompts/common.ts` — 类型定义（`PromptTemplate` 接口）+ 工具函数
- `backend/src/prompts/manager.ts` — 注册表 + 全部模板（~2600 行，51 个模板）

**使用方式**：
```typescript
import { buildPrompt, getPrompt } from '../prompts';

// 构建 Prompt
const result = buildPrompt('natal-overview', { chart_summary: data });
// 使用 result.system 和 result.user 调用 AI
```

**新增 Prompt 规范**：
1. 在 `manager.ts` 中按模块分区添加新模板
2. 实现 `PromptTemplate` 接口（含 meta、system、user）
3. 在注册表数组中注册
4. 同步更新 `docs/PRD.md` 的 4.5 Prompt 模板清单

