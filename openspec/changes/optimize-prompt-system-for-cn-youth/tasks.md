# 任务清单：optimize-prompt-system-for-cn-youth

## Phase 1: Prompt 架构统一化（prompt-architecture）

### Task 1.1: 统一 builder 自动注入机制 ✅
- [x] 修改 `core/builder.ts`，在 `buildPrompt()` 中根据 `meta.module` 自动注入对应的 cultural context
- [x] 定义 `CulturalInjector` 映射表：module → 需要注入的 cultural 资源列表
- [x] 确保注入内容紧凑（控制 token 增量 < 200 tokens/次）
- **验证**：调用 `buildPrompt('natal-overview', ctx)` 返回的 system 中包含行星比喻和场景引用
- **验证**：调用 `buildPrompt('daily-forecast', ctx)` 返回的 system 中包含节气语境

### Task 1.2: 清理模板层重复引用 ✅
- [x] 扫描所有 45 个引用了 cultural 层的模板文件
- [x] 移除模板中手动 import 的 `DEFAULT_PERSONA`、`TONE_GUIDE`（保留知识库引用如 METAPHORS）
- [x] 模板只保留：`meta` + 任务特定的 `system`（输出格式和规则）+ `user` 函数
- [x] 确保移除后不影响现有功能（system prompt 内容通过 builder 注入）
- **验证**：`grep -r "PERSONA\|TONE_GUIDE" templates/` 返回 0 代码结果（仅注释中提及）
- **验证**：所有 API 端点返回内容格式不变
- **依赖**：Task 1.1

### Task 1.3: 实现 UserPortrait 用户画像机制 ✅
- [x] 新增 `services/user-portrait.ts`，定义 `UserPortrait` 接口
- [x] 在 natal-overview 生成成功后，从 AI 输出中提取 coreTraits/keyPatterns/growthThemes
- [x] UserPortrait 缓存到 Redis（key: `portrait:${birthHash}`, TTL: 7天）
- [x] 在 `buildPrompt()` 中，如果 context 包含 `birthHash`，自动从缓存加载 UserPortrait
- [x] UserPortrait 以紧凑格式注入 user prompt（如 `画像：行动力强缺耐心｜情绪敏感｜火旺水弱`）
- **验证**：生成 natal-overview 后，Redis 中存在对应的 portrait key
- **验证**：调用 daily-forecast 时，user prompt 中包含用户画像信息
- **可与 Task 1.2 并行**

## Phase 2: Prompt 内容本土化（prompt-localization）

### Task 2.1: 新增中国传统文化融合模块 ✅
- [x] 新增 `cultural/wuxing.ts`：五行与行星/星座的对应映射
- [x] 新增 `cultural/seasonal.ts`：二十四节气语境生成（利用现有 `lunar-javascript`）
- [x] 新增 `cultural/zodiac-bridge.ts`：生肖与星座的趣味对比桥接
- [x] 在 CulturalInjector 中注册新模块的注入规则
- **验证**：`getSeasonalContext(new Date())` 返回当前节气描述
- **验证**：`getWuxingMapping('sun', 'aries')` 返回五行融合描述
- **依赖**：Task 1.1

### Task 2.2: 升级语言风格指南 ✅
- [x] 更新 `cultural/tone.ts`：增加网络表达允许清单和示例
- [x] 更新 `cultural/persona.ts`：角色表达更年轻化
- [x] 新增 `cultural/expressions.ts`：常用年轻化表达替换表（32 组映射）
- [x] 更新 `BASE_SYSTEM` 中的表达示例
- **验证**：`TONE_GUIDE` 中包含「拉满/实锤/XX星人」等表达示例
- **验证**：`EXPRESSIONS` 导出替换表，至少包含 30 组「正式→年轻化」映射
- **可与 Task 2.1 并行**

### Task 2.3: 优化各模块 Prompt 模板内容 ✅
- [x] **natal 模块**（11 个模板）：融入五行视角，语言风格升级
- [x] **daily 模块**（11 个模板）：融入节气语境，宜忌风格本土化
- [x] **synastry 模块**（14 个模板）：关系比喻更贴近中国社交语境
- [x] **cbt 模块**（6 个模板）：心理学概念表达更口语化
- [x] **ask 模块**（1 个模板）：融入传统文化元素作为补充视角
- [x] **wiki 模块**（1 个模板）：术语解释增加中国文化对照
- [x] **annual 模块**（8 个模板）：融入节气 + 五行 + 流年运势表达
- [x] **kline/pairing 模块**：风格对齐
- **验证**：抽查每个模块至少 1 个模板的 AI 输出，确认包含中国文化元素且风格年轻化
- **依赖**：Task 2.1, Task 2.2

## Phase 3: 并行生成与效率优化（parallel-generation）

### Task 3.1: 实现 generateParallel 并行生成服务 ✅
- [x] 新增 `services/parallel-generator.ts`
- [x] 实现 `generateParallel()` 函数：接收多个 promptId，并行调用 AI
- [x] 支持种子摘要注入（`_seedSummary` 字段）
- [x] 错误处理：单个 prompt 失败不影响其他，返回部分结果 + 错误信息
- [x] 超时控制：整体超时 = 单次超时（不叠加）
- **验证**：`generateParallel({ promptIds: ['natal-overview', 'natal-core-themes'], ... })` 返回 2 个结果
- **验证**：单个 prompt 失败时，另一个仍然成功返回

### Task 3.2: 适配 natal API 并行模式 ✅
- [x] 新增 `GET /api/natal/full` 端点，并行生成 overview + core-themes + dimension
- [x] 种子上下文 = 星盘紧凑摘要
- [x] 保留原有单端点（向后兼容）
- [x] 同时生成 UserPortrait 并缓存
- **验证**：`/api/natal/full` 返回时间 < 单端点 × 3 的时间
- **验证**：返回的 3 个内容块之间不矛盾
- **依赖**：Task 3.1, Task 1.3

### Task 3.3: 适配 daily API 并行模式 ✅
- [x] 新增 `GET /api/daily/full` 端点，并行生成 forecast + detail
- [x] 种子上下文 = 行运摘要 + UserPortrait
- [x] 保留原有单端点
- **验证**：`/api/daily/full` 返回包含 forecast 和 detail 两个内容块
- **依赖**：Task 3.1

### Task 3.4: 适配 synastry API 并行模式 ✅
- [x] 新增 `GET /api/synastry/full` 端点，并行生成 overview + highlights + core-dynamics
- [x] 种子上下文 = 合盘信号摘要
- [x] 保留原有分区懒加载端点
- **验证**：`/api/synastry/full` 返回包含 3 个分区内容
- **依赖**：Task 3.1

### Task 3.5: 前端适配并行端点 ✅
- [x] natal 页面改调 `/api/natal/full`（self.js：fetchNatalFull + prefetch 缓存）
- [x] daily 页面改调 `/api/daily/full`（daily.js：/full 优先 + 旧端点降级）
- [x] synastry 页面改调 `/api/synastry/full`（synastry.js：handleAnalyzeWithFull + 降级）
- [x] 加载状态适配：各页面实现预取缓存，内容块可逐步出现
- **验证**：各页面功能正常，加载体验提升
- **依赖**：Task 3.2, 3.3, 3.4

## 执行顺序总结

```
Phase 1 (基础)
  Task 1.1 ──→ Task 1.2
  Task 1.1 ──→ Task 1.3（可与 1.2 并行）

Phase 2 (内容，依赖 Phase 1)
  Task 2.1 ─┐
  Task 2.2 ─┤──→ Task 2.3
             │
Phase 3 (效率，依赖 Phase 1)
  Task 3.1 ──→ Task 3.2 ─┐
  Task 3.1 ──→ Task 3.3 ─┤──→ Task 3.5
  Task 3.1 ──→ Task 3.4 ─┘
```

Phase 2 和 Phase 3 可以并行推进。
