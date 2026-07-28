<!-- INPUT: Claude Code 助手在 oracle 项目内的协作规范入口（PRD 同步、工作流、Skill 路由、自文档化、i18n、Prompt 架构、隐私与 AI 安全）。 -->
<!-- OUTPUT: 给 Claude Code 的完整工作守则；不重复 AGENTS.md / COLOR_SYSTEM_GUIDE / openspec/AGENTS.md / FOLDER.md 已覆盖的内容。 -->
<!-- POS: Claude Code 专属入口；多模型协作触发器在 AGENTS.md。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

## 适用范围

**本文件是 Claude Code 专属的协作合约。** 多模型共用的项目入口规则（OpenSpec 触发器、语言输出约定、UI 规范入口）在 [`AGENTS.md`](./AGENTS.md)；本文件不复述。Claude Code 在 oracle 项目内工作时，先读 `AGENTS.md` 再读本文件。

---

## 文档权威性与冲突解决

```
1. 代码现实（src/、backend/、tests/）           — 永远最高
2. docs/PRD.md                                  — 产品规格权威
3. AGENTS.md                                    — 项目级 AI 入口（OpenSpec 触发、语言规则、UI 入口）
4. CLAUDE.md（本文件）                          — Claude Code 协作合约
5. openspec/AGENTS.md                           — OpenSpec 工作流详细规范
6. openspec/project.md                          — 项目上下文（部分已过期，遇冲突以代码为准）
7. COLOR_SYSTEM_GUIDE.md / 各 FOLDER.md         — 域内细则
```

**冲突解决规则**：

- 代码与文档不一致 → **代码为准**，同批次更新文档
- `openspec/project.md` 与代码不一致（已知：声称 HashRouter / Tailwind CDN / 无测试，实际是 BrowserRouter + 本地 Tailwind + vitest+Playwright）→ **代码为准**，遇到时顺手修
- CLAUDE.md 与 AGENTS.md 在同一规则上重复 → **AGENTS.md 为唯一来源**，CLAUDE.md 应改成 "见 AGENTS.md §X"
- PRD 与代码不一致 → 按 §PRD 同步规范的判定清单决定是改代码还是改 PRD

**禁止**：在本文件复制粘贴 AGENTS.md 的 OpenSpec 管理块、COLOR_SYSTEM_GUIDE 的颜色规则、openspec/AGENTS.md 的提案格式。允许"指针重复"（短的入口链接），不允许"全文重复"。

---

## PRD 同步规范（最高优先级 — 强制执行）

**`docs/PRD.md` 是产品功能、API、Schema、商业模式的唯一权威文档（Single Source of Truth）。**

### 强制规则

1. **变更前判定**：每次代码变更前，对照下面的判定清单判断是否触 PRD
2. **同步更新**：触 PRD 的变更，必须在同一次变更中更新 `docs/PRD.md`
3. **版本递增**：每次更新 PRD 时递增 Version + 更新 Last Updated 日期
4. **不可延后**：禁止"先改代码后补文档"

### 判定清单（触 PRD 才需更新；其余只更新 FOLDER.md / 文件头注释）

| 变更类型 | 需要更新 PRD |
|----------|------|
| 新增/删除 API 端点 | ✅ 更新对应模块 + 4.3 API 端点清单 |
| 新增/删除前端路由 | ✅ 更新对应模块路由描述 |
| 数据库 Schema 变更 | ✅ 更新 4.4 |
| 新增/删除功能模块 | ✅ 更新第 2 节 |
| 定价/配额变更 | ✅ 更新第 3 节 |
| 技术栈/依赖变更 | ✅ 更新 4.1（小版本升级 / lockfile 例外） |
| 项目结构变更 | ✅ 更新 4.2 |
| Prompt 模板增删 | ✅ 更新 4.5 |
| 支付方式变更 | ✅ 更新 3.5 |
| 部署配置变更 | ✅ 更新 4.7 |
| 新增/删除内容页面（精选文章、Wiki 条目） | ✅ 同步 `public/sitemap.xml` |
| **不触 PRD 的变更** | bug 修复、纯重构、测试补充、CSS/copy/i18n 微调、依赖锁文件、配置注释 |

---

## 产品定位

**AstrologyWiki（仓库代号 oracle）— 面向欧美 18-35 岁用户的现代占星应用。**

- 主语言：英文；辅助语言：中文
- 西方占星学体系，心理学导向，避免过度玄学化
- 支付：PayPal / 信用卡（欧美主流） + Airwallex
- 交互参考国际化主流 App

---

## 核心原则

- **生产质量**：所有产出都是上线级实现，不是 demo / MVP / workaround
- **Root Cause Fix**：从根本解决；临时方案需明确标注 `// TODO(temporary): <原因+期限>` 并开 issue
- **真实数据为默认**：production 路径默认禁 mock；fallback / 开发模式可显式开启（如 `services/ai.ts` 的 `allowMock`），但绝不能默认开启
- **Minimal Impact**：变更只触必要之处，不顺手重构
- **No Speculation**：结论必须来自读代码/查日志/查数据库；不要写"应该是…"或"大概…"
- **Immutability 范围**：禁止 mutate 跨边界对象（React state、Redux store、共享缓存、入参对象）；允许 mutate 局部封闭数据结构（如 `prompts/manager.ts` 的 `Map` 注册表、本函数内创建的数组排序）

---

## 工作流编排

### 1. Plan Mode（用于非平凡任务）
- 3 步以上 / 涉及架构 / 跨模块改动 / 有破坏性风险 → 先进 Plan Mode
- 简单显式的小修（CSS 微调、单文件 typo、补头注释、单 endpoint bug fix）→ 直接做
- 偏差出现 → STOP 并重新计划，不要硬推

### 2. Subagent 策略（按需，非强制默认）
**优先 offload 的场景**：
- 跨多文件搜索（grep > 2 次 / 跨 3+ 目录）
- 多文件并行 read 来回答一个综合问题
- 独立可隔离的分析（事实调研、长输出解析、codex consult 长回复）
- 多轨道并行评审

**主线直接做的场景**：
- 单文件 read + edit
- 已经知道目标路径的查找
- 任务之间互相依赖必须串行

**规则**：单条 message 内多 `Agent` 并行；同一文件不要并发写。Explore agent 只读、不写。

### 3. TDD 分级执行

**强制 RED → GREEN → REFACTOR**（写测试前不能写实现）：
- 核心算法：星历计算、Synastry 评分、ROI/Cycle 算法
- 鉴权 / 计费 / 配额 / Webhook
- Prompt 注册表新增 / 缓存键构造

**推荐 TDD**：常规 API endpoint、新组件、bug fix（有可复现路径）

**可省略 TDD**：CSS / copy / i18n key 增删 / FOLDER.md / 头注释 / lockfile / 依赖小版本

**测试栈**：
- 后端：`vitest`（`backend/src/**/*.test.ts`），`cd backend && npm run test`
- 前端 E2E：`@playwright/test`（`tests/e2e/*.spec.ts`），`npm run test:e2e`
- 覆盖率：核心算法 / 计费 / 鉴权 100%；普通代码 80%+（**长期目标**）。已配置 `@vitest/coverage-v8`（root + backend），`npm run test:coverage` 出 text+lcov 报告；两 config 设有 thresholds 作为 ratchet floor（当前略低于 2026-06-03 baseline，逐步上调）。

### 4. 完成前验证（按改动面挑选）

| 改动面 | 必跑命令 |
|---|---|
| 后端代码 | `cd backend && npm run test && npm run build` |
| 前端代码 | `npm run build`（含 SEO 预生成） |
| 前端 UI / 路由 | 上面 + 浏览器实际操作（Chrome MCP），覆盖 golden path + 1-2 个边界 |
| 关键用户路径变更 | 加跑 `npm run test:e2e` |
| 配置 / lockfile | `npm run build` 验证可构建 |

不可在 build/test 未跑过的情况下宣告完成。

### 5. Demand Elegance（非平凡变更才用）
- 涉及架构或核心算法时：暂停问 "is there a more elegant way?"
- 修复感觉 hacky 时："Knowing everything I know now, implement the elegant solution"
- 简单显式修复跳过此步，不要为了优雅过度工程

### 6. Bug 修复策略
- **有可复现证据**（日志 / 堆栈 / 失败测试 / 用户提供的 URL）→ 直接修，不要回头问用户
- **缺关键输入且无法从代码/日志推断**（出生数据 / 账号状态 / 复现步骤 / 支付状态）→ 问 1-2 个具体阻塞问题，不要泛问
- CI 失败 → 自主修

### 7. 自我改进循环（仅 Claude Code 环境）
用户做出纠正后：把可复用的判断写入 `~/.claude/projects/-Users-wzb-Code-oracle/memory/`（`feedback` 类型），下次 session 开始时检查 `MEMORY.md` 应用。此机制不适用于其他 AI 系统。

---

## Skill 路由

**核心原则**：用户请求匹配可用 skill 时，第一动作通过 `Skill` 工具调用。**例外**：当需要先确认仓库事实（diff / 日志 / 已存在的代码）才能正确调度 skill 时，先读再调；不要"为了 routing 而 routing"。

**路由表**（适用于 Claude Code + gstack skills 环境；其他运行时请忽略）：

| 用户意图 | Skill |
|---|---|
| 产品点子 / brainstorming / "值得做吗" | `office-hours` |
| 战略 / scope / "想更大" | `plan-ceo-review` |
| 架构 / "这个设计合理吗" | `plan-eng-review` |
| 设计系统 / 品牌 | `design-consultation` |
| Plan 的设计评审 | `plan-design-review` |
| Plan 的 DX 评审 | `plan-devex-review` |
| 全部评审一遍 | `autoplan` |
| Bug / 错误 / 500 / "为什么坏了" | `investigate` |
| QA 整站 / 找 bug | `qa`（只报告用 `qa-only`） |
| 代码评审 / "看看我的 diff" | `review` |
| 视觉打磨 / 设计审计 | `design-review` |
| DX 审计 / onboarding 体验 | `devex-review` |
| Ship / 部署 / 创建 PR | `ship` |
| 合并 + 部署 + 验证 | `land-and-deploy` |
| 上线后文档同步 | `document-release` |
| 周会复盘 | `retro` |
| 第二意见 / Codex 评审 | `codex` |
| 安全审计 / OWASP | `cso` |
| 安全模式 / 锁定 | `careful` / `guard` |
| 限制编辑目录 | `freeze` / `unfreeze` |
| 保存进度 | `context-save` |
| 恢复进度 | `context-restore` |
| 浏览器化 QA | `open-gstack-browser` |
| 性能 / benchmark | `benchmark` |
| OpenSpec proposal | `openspec:proposal` / `openspec:apply` / `openspec:archive` |
| TDD（强制场景） | `superpowers:test-driven-development` |

浏览器自动化用 `mcp__claude-in-chrome__*` 工具族；`/yc-browse` 不可用。

---

## 自文档化规则

oracle 已建立完整自文档化体系（62 个 `FOLDER.md`，文件级头注释覆盖大部分代码）。变更必须维护这套体系。

### 三层同步

| 层 | 文件 | 触发条件 |
|---|---|---|
| 项目级 | `CLAUDE.md` / `AGENTS.md` / `docs/PRD.md` | 功能、架构、API、Schema、规范变化 |
| 目录级 | 各 `FOLDER.md` | 该目录文件增删 / 职责调整 |
| 文件级 | 文件头 3-4 行注释 | 文件 input/output/职责变化 |

### 文件级头注释格式

**TypeScript / TSX / JS / mjs / config**：3 行强制 + 1 行可选维护提示

```typescript
// INPUT: 该文件依赖外部的什么（依赖库、上游模块、数据源）。
// OUTPUT: 对外提供什么（导出函数、组件、类型、副作用）。
// POS: 在系统中的局部地位。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// (可选第 4 行：额外维护提示，仅在 POS 行装不下时使用)
```

**Markdown / HTML**：`<!-- INPUT/OUTPUT/POS -->` 三行同构

**JSON（如 `package.json`）**：`_comment_input` / `_comment_output` / `_comment_pos` 字段

**英文短格式**允许用于纯工具文件（如 `hooks/useLangPath.ts`），但 INPUT/OUTPUT/POS 三件套不可省略。

参考样例：`App.tsx`（4 行带维护提示）、`backend/src/api/natal.ts`（3 行）、`backend/src/prompts/manager.ts`（4 行）、`hooks/useLangPath.ts`（英文短格式）。

### FOLDER.md 格式

每个有意义的目录必须有 `FOLDER.md`，结构：
1. 头部 `<!-- INPUT/OUTPUT/POS -->`
2. 一句话目录定位
3. 文件清单（文件名 + 一行职责）
4. 子目录索引
5. 近期变更日志（推荐）

**FOLDER.md 不索引的内容**（禁止把这些列进文件清单）：
- 生成物：`dist/`、`build/`、`coverage/`、`gen.log`、`*.tsbuildinfo`
- 依赖：`node_modules/`、`pnpm-lock.yaml`（lockfile 列入可，但内容不索引）
- 系统：`.DS_Store`、`.git/`、`.vercel/`
- Secrets：`.env*`（**绝不索引**，即使是 `.env.example` 也只列文件名不列内容）
- 临时：`/tmp/`、worktree、缓存
- Skill 配置：`.claude/skills/`（外部生态，不属于产品代码）

**当前已知违规**：根 `FOLDER.md` lines 15-16 / 46 列了 `.DS_Store` / `.env.local` / `dist`；下次触到该文件时顺手清理。

### 红线

- 新建文件 → 立刻补头注释 + 更新所属 `FOLDER.md`
- 新建目录 → 立刻创建 `FOLDER.md`
- 重命名 / 移动 → 同步两端 `FOLDER.md` + 文件头 POS
- 删除文件 → 从所属 `FOLDER.md` 移除

---

## 国际化 (i18n) 规范

### 产品语言策略
- 主语言：英文（前端默认）；辅助语言：中文
- 用户切换时持久化到 localStorage 键 `astro_lang`

### 前端实现
- `components/UIComponents.tsx` — `LanguageContext` 默认 `'en'`
- `constants.ts` — `TRANSLATIONS` 词典
- `hooks/useLangPath.ts` — 从 URL `/en/*` 或 query 解析

**使用规范**：
```typescript
import { useLanguage } from './components/UIComponents';
const { t, language } = useLanguage();
<button>{t.subscription?.upgrade || 'Upgrade Now'}</button>  // 必须有英文 fallback
// ❌ 不要硬编码： <button>{language === 'zh' ? '升级' : 'Upgrade'}</button>
```

**翻译键命名**：小写下划线、按模块分组（`paywall.*`、`subscription.*`），避免重复前缀。

### 后端实现现状

| 端点文件 | Lang 来源 | 默认值 | helper |
|---|---|---|---|
| `daily.ts` / `detail.ts` / `natal.ts` / `cycle.ts` / `wiki.ts` / `synastry.ts` / `ask.ts` | query/body `lang` | `'en'` | 共享 `backend/src/utils/lang.ts` 的 `resolveLang` |
| `cbt.ts` | body `lang` | `'en'` | 共享 `resolveLang`（调用前含危机短路） |
| `airwallex.ts` | query/body `lang` | `'en'` | 直接读取（值仅用于货币映射，不进 prompt） |
| `reports.ts` | body `lang`（已从 `language` 重命名） | `'en'` | 直接默认 |
| `geo.ts` | query `lang` | 无显式默认 | 直接判断 |
| `services/ai.ts` | 上游传入 | `DEFAULT_LANG = 'zh'`（行 23，仅作 ai service 最终兜底） | — |

**当前一致性**：前后端默认值统一为 `'en'`；reports 的 body 字段统一为 `lang`；所有端点（含 `cbt.ts`，默认 `'en'`）已使用 `resolveLang(value)`，无内联三元残留；新增 endpoint 必须沿用。

**错误消息**：API 错误响应统一英文（`{ error: 'Authentication required' }`）。

**Prompts 双语支持**（`backend/src/prompts/common.ts`）：
- `SINGLE_LANGUAGE_INSTRUCTION` / `SINGLE_LANGUAGE_INSTRUCTION_EN` — 系统指令
- `resolveSynastryLang` / `resolveSynastryName` / `resolveRelationshipType` / `formatLang` / `formatSynastryContextBlock` — 合盘语言/上下文格式化

---

## UI 规范入口

UI 规范的唯一来源是 [`COLOR_SYSTEM_GUIDE.md`](./COLOR_SYSTEM_GUIDE.md)（颜色、排版、间距、组件模式、图标、动效）。UI 变更必须对照该规范，并在 PR 中按 [`PULL_REQUEST_TEMPLATE.md`](./PULL_REQUEST_TEMPLATE.md) 填写「UI 规范符合说明」。本文件不复述颜色 / 排版 / token。

---

## Prompt 架构规范

后端 Prompt 系统采用集中注册式架构，共 **53 个模板** 注册在 `manager.ts`。

**核心文件**：
- `backend/src/prompts/common.ts` — 类型（`PromptMeta` / `PromptSystem` / `PromptTemplate`）+ 工具函数（`formatLang`、`resolveSynastryLang`、`resolveSynastryName`、`resolveRelationshipType`、`formatSynastryContextBlock`）+ 常量（`SINGLE_LANGUAGE_INSTRUCTION` / `_EN`、`DETAIL_INTERPRETATION_FORMAT_ZH/EN`、`DETAIL_OUTPUT_INSTRUCTION`）
- `backend/src/prompts/manager.ts` — `registerPrompt` / `getPrompt` / `getPromptVersion` / `buildCacheKey`，并 re-export common.ts 的所有公共 API
- 无 `index.ts`：消费者必须从 `manager` 导入（实际路径用 `.js` 后缀，因为编译输出）

**真实使用方式**（`backend/src/services/ai.ts` 实际代码）：
```typescript
import { getPrompt, buildCacheKey } from '../prompts/manager.js';

const prompt = getPrompt(options.promptId);
if (!prompt) {
  throw new AIUnavailableError('prompt_missing', `Prompt not found: ${options.promptId}`);
}
const context = { ...options.context, lang };
const systemMessage = typeof prompt.system === 'function'
  ? prompt.system(context)
  : prompt.system;
const userMessage = prompt.user(context);
const cacheKey = buildCacheKey(options.promptId, hashInput(context));
```

**`PromptTemplate` 形状**：
```typescript
interface PromptTemplate {
  meta: PromptMeta;                                       // { id, version, scenario }
  system: string | ((ctx: Record<string, unknown>) => string);
  user: (ctx: Record<string, unknown>) => string;
}
```

**新增 Prompt 规范**：
1. 在 `manager.ts` 按模块分区添加新模板（含 `meta.id`、`meta.version`、`meta.scenario`）
2. 实现 `system`（字符串或上下文函数）+ `user`（上下文函数）
3. 调用 `registerPrompt(template)` 注册
4. **递增 `meta.version`** — 它进 `buildCacheKey`，不递增会导致旧缓存污染新输出
5. 同步更新 `docs/PRD.md` 的 4.5 Prompt 模板清单

---

## 隐私红线（强制）

oracle 处理高敏感字段：**出生日期 / 时间 / 城市 / 经纬度 / CBT 日记文本 / 用户提问内容 / 关系对象姓名 / 鉴权标识**。所有触碰这些字段的代码必须遵守：

1. **Analytics 不传敏感字段**：`services/analytics.ts` 的 `trackEvent()` 调用方负责脱敏。允许传 `question_length`、`category`、`module_name`；**禁止**传 `question`、`situation`、`automaticThoughts`、`nameA/B`、`birthCity`、`birthCoordinates`、`hotThought`。新增 `trackEvent` 调用前自检 payload。
2. **缓存键禁止明文**：所有 PII 输入必须经 `backend/src/cache/strategy.ts` 的 `hashInput`（SHA-256）摘要后再入键；`backend/src/services/ephemeris.ts::buildNatalCacheKey` 已用 SHA-256。新增缓存键逻辑一律走 `hashInput`，禁止重复实现弱 hash。
3. **服务端日志不写原文**：API endpoint 的 `console.log` / `logger.error` 输出前必须剔除 `question`、`situation`、`moods`、`nameA/B`、`hotThought`、`balancedEntries`、`birth.*`。错误堆栈需要上下文时，传 `sanitizeForLog(payload, SENSITIVE_FIELDS)` 后的副本。
4. **Synastry 姓名不入 prompt**：`buildSynastryPersonInfo` 输出的 `nameA/nameB` 应替换为 `Person A / Person B` 或 alias。真实姓名只允许停留在客户端。
5. **CBT 数据有保留期**：现有 `CBT_RETENTION_TTL = 90d`，新增 CBT 功能必须沿用该 TTL，并支持用户主动删除接口。

---

## AI 安全边界（强制，CBT/Ask/Synastry/Daily 任何 AI 输出都适用）

oracle 是 AI + 心理学占星产品，AI 直接面向用户输出解释。以下规则不可绕过：

1. **不做医疗诊断**：所有 prompt 的 system instruction 必须包含 "You are not a medical professional. Do not diagnose, prescribe, or guarantee outcomes."。CBT 输出尾部必须追加："注意：这不是临床诊断。如有心理困扰，请咨询持证心理咨询师。" / 英文版同义。
2. **不做命运确定性断言**：禁止生成 `will`、`must`、`destined to`、`guaranteed`、"一定会"、"必然" 等绝对语言。改用 `may`、`could`、`tends toward`、`suggests a tendency`、"倾向"、"潜在"。Ask 与 Synastry prompt 必须内嵌该约束。
3. **危机响应**：CBT analysis 入口在调用 LLM 前必须检测 `situation + automaticThoughts + hotThought` 是否命中危机模式（`suicide|self.harm|kill.myself|end.it.all|hurt myself|结束生命|自杀|自残` 等关键词）。命中时 API 返回 `{ code: 'CRISIS_DETECTED', helpline: { region, phone, url } }`，**不调用 LLM**。
4. **CBT/Ask/Synastry 页面必须显示安全 disclaimer**：当前 `FrameworkDisclaimer` 仅在 natal/synastry 显示 — 必须扩展到 cbt、ask 路由顶部。
5. **Ask 用户告知**：Ask 页应有可见提示，告知问题与出生数据会发送给云端 LLM。

新增任何 AI 触发面（新 endpoint / 新 prompt / 新页面）前，对照 1-5 自检。

---

## 任务管理

- 多步任务用 `TaskCreate` 写清单；每完成一项立即 `TaskUpdate` 为 `completed`，不批量
- 动手前与用户对齐方案（Plan Mode）；landing 前更新 PRD（触清单时） + 相关 FOLDER.md + 文件头注释
- 被纠正后写入 memory（见 §工作流编排 §7）
