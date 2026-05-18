<!-- INPUT: CBT 危机检测变更的实施任务清单。 -->
<!-- OUTPUT: 任务列表（按阶段拆分）。 -->
<!-- POS: OpenSpec 变更任务清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 任务清单：add-cbt-crisis-detection

## Phase 1: 数据与检测器（无前端依赖，可独立测试）

### Task 1.1: 新增危机关键词数据
- [ ] 1.1.1 新增 `backend/src/data/crisis-keywords.ts`，导出中英两组关键词数组（初始集合：`suicide`, `kill myself`, `end it all`, `hurt myself`, `self harm`, `self-harm`, `没有意义`, `想死`, `自杀`, `结束生命`, `自残`, `活不下去`）。
- [ ] 1.1.2 关键词使用 `\b` 词边界（英文）+ 中文直接 `includes` 匹配；导出已编译的 `RegExp[]`，避免运行时重复编译。
- [ ] 1.1.3 在文件头注释中明确标注"初始集合需要心理健康专业人士审阅"，并预留扩展点。
- **验证**：`isCrisis('我活不下去了')` 返回 true；`isCrisis('I want to end it all')` 返回 true；`isCrisis('I finished the project')` 返回 false（"end" 与 "finished" 不匹配 `end it all` 短语）。

### Task 1.2: 新增热线数据
- [ ] 1.2.1 新增 `backend/src/data/helplines.ts`，导出 `HELPLINES: Record<RegionCode, Helpline>`。
- [ ] 1.2.2 至少覆盖：`US`（988 Suicide & Crisis Lifeline）、`UK`（Samaritans 116 123）、`CN`（北京心理危机研究与干预中心 010-82951332 / 全国希望热线 400-161-9995）、`HK`（撒玛利亚 28960000）、`TW`（生命线 1995）、`INTL`（Befrienders Worldwide URL）。
- [ ] 1.2.3 每条记录提供 `{ name_en, name_zh, phone, url, region }`。
- **验证**：`HELPLINES.CN.phone` 形如 `'400-161-9995'`；`HELPLINES.INTL.url` 指向 `https://www.befrienders.org`。

### Task 1.3: 新增检测器服务
- [ ] 1.3.1 新增 `backend/src/services/crisis-detector.ts`。
- [ ] 1.3.2 实现 `detectCrisis(texts: string[]): { hit: boolean; matched?: string }`，遍历传入字符串数组，命中即返回（不抛错）。
- [ ] 1.3.3 实现 `resolveRegion(req: Request, lang: 'zh'|'en'): RegionCode`：优先 `req.headers['x-region']`，否则 `lang === 'zh' ? 'CN' : 'US'`，无法识别时 `'INTL'`。
- [ ] 1.3.4 实现 `buildCrisisResponse(region: RegionCode): CrisisResponse`，返回 `{ status: 'crisis_detected', helpline, message_zh, message_en }`，文案从 `constants.ts` 或新建 `prompts/crisis-messages.ts` 读取（与 i18n 一致）。
- [ ] 1.3.5 检测器 **绝不抛错**：任何内部异常都返回 `{ hit: false }`，并通过 logger 打 `warn`。
- **验证**：单元测试覆盖中文命中、英文命中、未命中、空数组、`null/undefined` 项；区域解析覆盖 header 优先、lang 推断、兜底。

## Phase 2: API 集成（依赖 Phase 1）

### Task 2.1: 在 `/api/cbt/analysis` 接入检测
- [ ] 2.1.1 在 `backend/src/api/cbt.ts` 的 `/analysis` 处理器中，**`parseBirthInput` 之后、`generateAIContent` 之前**插入检测。
- [ ] 2.1.2 抽取 `situation`、`automaticThoughts`（数组）、`hotThought`、`balancedEntries[].text` 作为待检测文本。
- [ ] 2.1.3 命中时：
  - 跳过 `ephemerisService` 计算（节省时间）；
  - 调 `buildCrisisResponse(region)` 返回 HTTP 200；
  - 设置响应头 `Server-Timing: crisis;dur=<ms>`；
  - **不写入 `cbt:records` 缓存**。
- [ ] 2.1.4 处理 `NODE_ENV !== 'production'` 下的 `?override_crisis_check=true` 旁路。
- **验证**：POST `{ situation: '我活不下去了' }` 返回 `status: 'crisis_detected'`，且 Server-Timing 不含 `ai;dur`。

### Task 2.2: 其余 5 个端点接入同一检测
- [ ] 2.2.1 `/aggregate-analysis`：检测 `somatic_stats/root_stats/mood_stats/competence_stats` 中所有 `notes`、`text` 字段（如有自由文本）；统计场景文本量小，命中较少，但仍需护栏。
- [ ] 2.2.2 `/somatic-analysis`、`/root-analysis`、`/mood-analysis`、`/competence-analysis`：同上规则。
- [ ] 2.2.3 抽取共用 helper `extractFreeText(body): string[]`，避免每端点重复。
- **验证**：5 个端点各自单测各覆盖一个中文/英文命中样本。

## Phase 3: 遥测（依赖 Phase 1）

### Task 3.1: 埋点
- [ ] 3.1.1 在 `crisis-detector.ts` 或 `api/cbt.ts` 命中分支调用 `analytics.track({ event: 'cbt_crisis_detected', region, lang, endpoint })`。
- [ ] 3.1.2 **严禁**把 `situation`/`automaticThoughts`/`matched` 关键词写入埋点 payload。
- [ ] 3.1.3 若项目尚无 analytics 出口，先打 `logger.warn` 占位，并在任务备注里标记后续接入。
- **验证**：单测断言埋点 payload 仅含 `event/region/lang/endpoint`；grep 实现确认无原文字段。

## Phase 4: 前端识别（依赖 Phase 2）

### Task 4.1: 类型与文案
- [ ] 4.1.1 在 `types.ts` 增加 `CBTAnalysisResponse | CBTCrisisResponse` 联合类型；新增 `CBTCrisisResponse` 类型。
- [ ] 4.1.2 在 `constants.ts` 的 `TRANSLATIONS.en/zh` 增加 `cbt.crisis.title`、`cbt.crisis.message`、`cbt.crisis.cta_call`、`cbt.crisis.cta_more`。

### Task 4.2: 组件分支
- [ ] 4.2.1 `components/cbt/CBTWizard.tsx`：调用分析 API 后若 `status === 'crisis_detected'`，切换到 CrisisCard 状态而非 ResultView。
- [ ] 4.2.2 `components/cbt/CBTMainPage.tsx`：在聚合分析入口同样识别该状态。
- [ ] 4.2.3 `components/cbt/AnalysisViews.tsx`：新增 `CrisisCard` 子组件渲染热线名称/电话（`tel:` 链接）/URL（`target="_blank" rel="noopener noreferrer"`）。
- [ ] 4.2.4 `components/cbt/utils/useCBTAggregateAnalysis.ts`：hook 返回值新增 `crisis?: CBTCrisisResponse`。
- **验证**：本地 mock 一个 crisis 响应，确认每个 CBT 入口都能渲染热线卡片，且不再展示原 LLM 结果。

## Phase 5: 测试

### Task 5.1: 单元测试
- [ ] 5.1.1 `crisis-detector.test.ts`：覆盖关键词命中、未命中、空输入、异常输入（非字符串）、双语。
- [ ] 5.1.2 `helplines.test.ts`：每个 region 都能解析、`INTL` 兜底可用。

### Task 5.2: 集成测试
- [ ] 5.2.1 `cbt.test.ts`（或 supertest 风格集成测试）：6 个端点各一条 crisis 用例 + 一条正常用例。
- [ ] 5.2.2 验证 crisis 用例**未触达** `generateAIContent`（使用 mock spy）。
- [ ] 5.2.3 验证 `?override_crisis_check=true` 仅在 dev 环境下有效。

### Task 5.3: E2E（Playwright，可选）
- [ ] 5.3.1 在 CBT Wizard 流程中输入含关键词文本，断言 CrisisCard 渲染并显示对应区域热线。

## Phase 6: 文档与归档

### Task 6.1: PRD 同步（归档阶段执行）
- [ ] 6.1.1 更新 `docs/PRD.md` 第 4.3 节，标注 6 个 CBT 端点新增 `crisis_detected` 响应分支。
- [ ] 6.1.2 在第 2 节功能模块的 CBT 部分增加"危机检测护栏"说明。
- [ ] 6.1.3 递增 PRD Version 并更新 Last Updated。

### Task 6.2: FOLDER.md 同步
- [ ] 6.2.1 更新 `backend/src/services/FOLDER.md`（新增 crisis-detector）。
- [ ] 6.2.2 更新 `backend/src/data/FOLDER.md`（新增 helplines、crisis-keywords）。
- [ ] 6.2.3 更新 `components/cbt/FOLDER.md`（新增 CrisisCard 描述）。
- [ ] 6.2.4 更新 `openspec/changes/FOLDER.md`（标注本变更）。
- [ ] 6.2.5 更新 `openspec/specs/support-cbt-journal/FOLDER.md`（标注 crisis 分支约束）。
- [ ] 6.2.6 在 `openspec/specs/cbt-crisis-detection/FOLDER.md` 创建能力索引文档（归档时）。

### Task 6.3: 校验
- [ ] 6.3.1 `npx openspec validate add-cbt-crisis-detection --strict` 通过。
- [ ] 6.3.2 全部任务勾选完成后再申请审批。

## 执行顺序

```
Phase 1（数据 + 检测器） ──┐
                            ├─→ Phase 2（API） ──→ Phase 4（前端） ──→ Phase 5（测试） ──→ Phase 6（文档归档）
                            └─→ Phase 3（遥测）
```

Phase 1 是基础，Phase 2 与 Phase 3 可并行，Phase 4 依赖 Phase 2 的契约稳定。
