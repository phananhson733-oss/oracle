<!-- INPUT: 合盘阅读体验与性能优化的设计决策与方案拆解（含前端本地缓存）。 -->
<!-- OUTPUT: 合盘阅读与性能优化设计说明文档（含英文规则与缓存策略）。 -->
<!-- POS: 变更设计说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# Design: 合盘阅读体验与性能优化

## Goals
- 保证合盘各 tab 与详情弹窗完整渲染 prompt 输出字段，避免遗漏与英文缺口。
- 明确 overview 的 Growth Task 与 Compatibility Radar 结构与显示方式。
- 统一合盘排版层级，参考 Discovery Me 首屏的阅读节奏与卡片结构。
- 明显缩短 “点击生成 → overview 出现” 的等待时间。

## Non-goals
- 不引入“简版先出、完整版补全”的策略。
- 不改变关系类型建议在生成前计算的前置逻辑。
- 不引入跨用户复用的 AI 输出缓存。
- 不扩展至非合盘页面（例如 Today 详情）内容修复。

## Current Flow (Baseline)
1. 选人完成后调用 `/synastry/suggestions` 生成关系类型 Top5，用户选择关系类型。
2. 点击生成后调用 `/synastry?tab=overview`，后端计算本命盘、合盘相位/宫位覆盖并生成 AI 内容，同时返回 technical 与 suggestions。
3. 前端收到 overview 后进入报告视图，空闲时预取其他 tab，技术附录已随 overview 一起返回。
4. 详情弹窗（elements/aspects/planets/asteroids/rulers）按需调用 `/detail`。

## Proposed Changes

### 1) 内容完整性审计
- 建立“Prompt → UI 字段映射表”，覆盖以下 prompt：
  - `synastry-overview`
  - `synastry-natal-a` / `synastry-natal-b`
  - `synastry-compare-ab` / `synastry-compare-ba`
  - `synastry-composite`
  - detail prompts（`detail-*-synastry`、`detail-*-composite`）
- 验证每个字段是否有 UI 展示；若缺失则补齐或标记为不展示并从 prompt 移除。
- 英文模式对照同一字段，确保不存在“字段为空/未渲染”的情况。

### 2) Overview Schema 增强
- Growth Task：明确为 1 条，并包含任务与证据描述。
- Compatibility Radar：6 个维度 + 每项一句解释，维度固定为：
  - 情绪安全 / Emotional Safety
  - 沟通 / Communication
  - 吸引力 / Attraction
  - 价值观 / Values
  - 节奏 / Pacing
  - 长期潜力 / Long-term Potential
- 该结构既用于 prompt 要求，也用于前端展示结构化卡片。

### 2.5) English Output Rules (Synastry)
- 英文内容使用独立 prompt（system/user 模板分语言维护），不依赖翻译生成。
- 每段 1-2 句，避免长句与堆叠从句；单句长度控制在 20-24 个英文单词内。
- 列表类输出使用 3-5 条要点，每条 6-12 个英文单词，避免冒号堆叠。
- 禁用中文式成语/隐喻直译；优先使用直白、可执行的表达。
- 使用姓名而非 A/B，保持明确主语与动作。

### 3) UI 结构与排版（Discovery Me 对齐）
- 合盘报告整体结构与 Discovery Me 首屏一致：
  - 顶部标题 + 信息条（姓名、关系类型、日期）
  - 星盘区块置顶，随后是分区卡片内容
  - 使用“标题 + 解释 + 要点列表”的卡片结构
- 本命盘/对比盘/组合盘：
  - 采用纵向卡片结构代替密集网格
  - 重要总结段落提升字号与行距，副信息降级为标签/辅助文案
  - 技术附录模块与正文之间加入清晰分隔与过渡说明
- 英文排版：保持同版式，但提升段落切分与标点节奏，避免直译导致的长段落堆叠。

### 4) 首屏性能优化
- **技术附录延迟加载**：overview 响应不返回 technical；overview 渲染完成后后台预取技术附录，tab 内仍保留按需请求逻辑。
- **关系类型建议复用**：仅在 `/synastry/suggestions` 计算一次，overview 不再重复计算建议列表。
- **本命/合盘计算缓存**：
  - 前端本地缓存本命盘与合盘事实（相位、宫位覆盖、组合盘中点数据）。
  - Key 由出生信息与关系类型组成；允许跨 tab 复用。
  - 不跨用户复用 AI 输出，仅复用确定性天文计算结果。
- **Prompt 上下文瘦身**：将完整 chart/synastry JSON 转换为“结构化摘要”再传入 prompt。
- **max_tokens 校准**：以样本输出统计长度，按 prompt 设定 token 预算，避免截断但不盲目放大。

## Caching Plan (Draft)
- **Natal chart cache**：按 birth input（date/time/city/lat/lon/timezone/accuracy）生成 hash；前端本地持久缓存（localStorage），不设过期。
- **Synastry facts cache**：按两人 birth hash + relationType 生成 key；包含相位、宫位覆盖、组合盘位置等，前端本地持久缓存不设过期。
- **AI output cache**：延续现有策略，保持按 promptId+version+input hash 缓存。

## Risks & Mitigations
- 技术附录改为按需加载可能增加 tab 首次切换等待：通过轻量 loading 与预取策略平衡。
- Prompt 上下文瘦身可能导致内容质量下降：通过字段审计与灰度样本验证。
- 缓存策略需避免错误复用：严格使用出生信息 hash 与关系类型作为键。

## Open Questions
- 暂无。
