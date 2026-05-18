<!-- INPUT: CBT 危机检测能力提案：在 CBT 分析端点调用 LLM 之前增加自残/自杀关键词短路逻辑。 -->
<!-- OUTPUT: OpenSpec 变更提案文档（CBT 危机检测）。 -->
<!-- POS: OpenSpec 变更提案；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 为 CBT 模块新增危机关键词检测与求助资源短路返回

## Why

CBT 日记是本应用最容易出现高风险表达的入口：用户在 `situation` / `automaticThoughts` / `hotThought` 等自由文本中可能写出明确的自伤或自杀意图（例如"我想结束这一切""活不下去了"）。当前 `backend/src/api/cbt.ts` 的 5 个分析端点（`/analysis`、`/aggregate-analysis`、`/somatic-analysis`、`/root-analysis`、`/mood-analysis`、`/competence-analysis`）会直接把这些文本拼进 prompt context 并发送给 LLM，仅依赖 prompt 中一条"Safety Guardrail"软性指令（`manager.ts:1403`）做兜底。这是一个 P2 安全缺口：

1. LLM 输出不可控，可能给出延迟、错误或不当响应，而高风险用户没有时间窗口等待。
2. 当前没有任何机制把危机信号上报到运营/分析侧，团队无法感知风险出现的频率与区域分布。
3. 缺少明确的"立即提供本地化求助热线"回路，违反主流心理健康产品的安全基线（Apple/Google 心理类应用上架要求）。

本提案为 CBT 模块引入"先检测后分析"的硬性短路：当关键词命中时，端点不再调用 LLM，而是直接返回区域化的求助热线信息与抚慰文案；同时记录脱敏遥测，便于团队复盘。

## What Changes

- **新增 capability**：`cbt-crisis-detection`（独立于 `support-cbt-journal`，承担安全护栏职责）。
- **修改 capability**：`support-cbt-journal` 的"CBT analysis result"需求，新增"crisis_detected 分支"行为约束。
- **新增检测模块**：`backend/src/services/crisis-detector.ts`（纯函数 + 中英双语关键词正则，无新依赖）。
- **新增数据**：`backend/src/data/helplines.ts`（区域 → 热线名称/电话/URL 映射，含国际兜底）。
- **修改 API**：`POST /api/cbt/analysis` 等 6 个 CBT 分析端点在解析 birth 之后、调用 `generateAIContent` 之前插入检测；命中时返回 HTTP 200 + `{ status: 'crisis_detected', helpline, message_zh, message_en }`。
- **区域解析**：优先 `req.headers['x-region']`，否则由 `lang` 推断（`zh` → CN，`en` → US），否则使用国际兜底（Befrienders Worldwide）。
- **遥测埋点**：发送 `{ event: 'cbt_crisis_detected', region, lang }`，**不传原文**。
- **前端处理**：`components/cbt/CBTWizard.tsx`、`components/cbt/CBTMainPage.tsx`、`components/cbt/AnalysisViews.tsx`、`components/cbt/utils/useCBTAggregateAnalysis.ts` 需识别 `status === 'crisis_detected'` 分支并渲染热线卡片（本提案仅列出，不实现）。
- **调试旁路**：`?override_crisis_check=true` 仅在 `NODE_ENV !== 'production'` 时生效，便于 QA。
- **非破坏性**：现有 `{ lang, content }` 响应在非危机分支保持不变。

不在本提案范围：
- 修改 LLM prompt 本身（继续保留软性 Safety Guardrail 作为第二层防线）。
- 多轮危机对话（仅做一次性短路返回）。
- 修改 `docs/PRD.md`（按 OpenSpec 工作流，PRD 更新放到归档阶段）。

## Impact

- Affected specs:
  - `support-cbt-journal`（MODIFIED：分析结果需求新增 crisis 短路分支）
  - `cbt-crisis-detection`（ADDED：全新安全能力）
- Affected code:
  - `backend/src/api/cbt.ts`（6 个分析端点接入检测）
  - `backend/src/services/crisis-detector.ts`（新增）
  - `backend/src/data/helplines.ts`（新增）
  - `backend/src/services/analytics.ts` 或等价埋点出口（新增 `cbt_crisis_detected` 事件）
  - `components/cbt/CBTWizard.tsx`、`components/cbt/CBTMainPage.tsx`、`components/cbt/AnalysisViews.tsx`、`components/cbt/utils/useCBTAggregateAnalysis.ts`（前端识别新分支）
  - `constants.ts`（新增危机文案 TRANSLATIONS 键值）
  - `docs/PRD.md`（归档时再更新 4.3 API 端点清单与新模块说明）
- Affected runtime behavior:
  - 命中关键词的请求耗时下降（不再走 LLM）。
  - 命中请求不写入 `cbt:records:${userId}` 缓存（避免历史回放重新触发风险情绪）。
- Breaking? **No**——所有非危机请求行为保持不变，仅新增一个 status 分支。
