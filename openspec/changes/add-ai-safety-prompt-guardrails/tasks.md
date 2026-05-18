<!-- INPUT: AI 安全 prompt 护栏的分阶段实施清单。 -->
<!-- OUTPUT: OpenSpec 变更任务清单（AI 安全 prompt 护栏）。 -->
<!-- POS: OpenSpec 变更任务清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Tasks: add-ai-safety-prompt-guardrails

## Phase 1: 安全常量定义

- [x] 1.1 在 `backend/src/prompts/common.ts` 顶部新增四组常量：
  - `SAFETY_INSTRUCTION_ZH`、`SAFETY_INSTRUCTION_EN`
  - `CBT_DISCLAIMER_FOOTER_ZH`、`CBT_DISCLAIMER_FOOTER_EN`
  - `NO_FATE_CERTAINTY_REMINDER_ZH`、`NO_FATE_CERTAINTY_REMINDER_EN`
  - 工具函数 `resolveSafetyInstruction(ctx)` / `resolveCbtDisclaimer(ctx)` / `resolveNoFateReminder(ctx)`（根据 `ctx.lang` 选择 zh/en）
- [x] 1.2 导出全部常量并附 JSDoc，说明使用位置与版本号策略。
- [x] 1.3 单元测试 `common.test.ts`：断言三个 resolver 在 `lang='zh'` 与 `lang='en'` 下返回正确字符串；缺省时回退到 `zh`。（合并到 `safety.test.ts`：通过 prompt 的 system/user 输出间接断言 resolver 行为，包含 lang=zh/en 与默认 zh 回退覆盖。）
- **依赖**：无；其他 Phase 均依赖本 Phase 完成。

## Phase 2: Natal 家族版本与拼装（4 个模板）

- [x] 2.1 `natal-overview`：版本 `5.1` → `5.2`；system 前置 `SAFETY_INSTRUCTION`。
- [x] 2.2 `natal-core-themes`：版本 `5.1` → `5.2`；system 前置 `SAFETY_INSTRUCTION`。
- [x] 2.3 `natal-dimension`：版本 `5.1` → `5.2`；system 前置 `SAFETY_INSTRUCTION`。
- [x] 2.4 `cycle-naming`：版本 `3.0` → `3.1`；system 前置 `SAFETY_INSTRUCTION` + `NO_FATE_CERTAINTY_REMINDER`（属周期/未来）。
- [x] 2.5 测试：抽查 `natal-overview` 与 `cycle-naming` 各 1 条断言。

## Phase 3: Daily 家族版本与拼装（2 个模板）

- [x] 3.1 `daily-forecast`：版本 `5.1` → `5.2`；system 前置 `SAFETY_INSTRUCTION` + `NO_FATE_CERTAINTY_REMINDER`。
- [x] 3.2 `daily-detail`：版本 `5.1` → `5.2`；system 前置 `SAFETY_INSTRUCTION` + `NO_FATE_CERTAINTY_REMINDER`。
- [x] 3.3 测试：`daily-forecast` 一条断言覆盖两类指令。

## Phase 4: Ask 家族版本与拼装（1 个模板）

- [x] 4.1 `ask-answer`：版本 `5.2` → `5.3`；system 前置 `SAFETY_INSTRUCTION` + `NO_FATE_CERTAINTY_REMINDER`；保留现有"温和建议寻求专业帮助"软指令。
- [x] 4.2 测试：断言 system 同时包含 `SAFETY_INSTRUCTION` 与 `NO_FATE_CERTAINTY_REMINDER`。

## Phase 5: Synastry 家族版本与拼装（15 个模板）

按下列 ID 全量小版本递增并前置 `SAFETY_INSTRUCTION` + `NO_FATE_CERTAINTY_REMINDER`：

- [x] 5.1 `synastry-overview`：`10.0` → `10.1`
- [x] 5.2 `synastry-highlights`：`1.0` → `1.1`
- [x] 5.3 `synastry-core-dynamics`：`1.1` → `1.2`
- [x] 5.4 `synastry-practice-tools`：`1.0` → `1.1`
- [x] 5.5 `synastry-relationship-timing`：`1.0` → `1.1`
- [x] 5.6 `synastry-vibe-tags`：`1.0` → `1.1`
- [x] 5.7 `synastry-growth-task`：`2.0` → `2.1`
- [x] 5.8 `synastry-conflict-loop`：`1.0` → `1.1`
- [x] 5.9 `synastry-weather-forecast`：`1.0` → `1.1`
- [x] 5.10 `synastry-action-plan`：`1.0` → `1.1`
- [x] 5.11 `synastry-natal-a`：`4.0` → `4.1`
- [x] 5.12 `synastry-natal-b`：`4.0` → `4.1`
- [x] 5.13 `synastry-compare-ab`：`4.0` → `4.1`
- [x] 5.14 `synastry-compare-ba`：`4.0` → `4.1`
- [x] 5.15 `synastry-composite`：`4.0` → `4.1`
- [x] 5.16 `synastry-dynamic`：`4.0` → `4.1`
- [x] 5.17 测试：抽样 `synastry-overview` 与 `synastry-conflict-loop`，断言 system 同时包含两类指令。

## Phase 6: CBT 家族版本、拼装与 footer（6 个模板）

每个 CBT 模板的 system 前置 `SAFETY_INSTRUCTION`，user 输出规范末尾追加 `CBT_DISCLAIMER_FOOTER`：

- [x] 6.1 `cbt-analysis`：`5.2` → `5.3`
- [x] 6.2 `cbt-aggregate-analysis`：`2.0` → `2.1`
- [x] 6.3 `cbt-somatic-analysis`：`1.0` → `1.1`
- [x] 6.4 `cbt-root-analysis`：`1.0` → `1.1`
- [x] 6.5 `cbt-mood-analysis`：`1.0` → `1.1`
- [x] 6.6 `cbt-competence-analysis`：`1.0` → `1.1`
- [x] 6.7 测试：每个 CBT prompt 的 `buildPrompt(...).user` 包含 `CBT_DISCLAIMER_FOOTER` 子串；system 包含 `SAFETY_INSTRUCTION`。
- **关联**：与 `add-cbt-crisis-detection` 并存——危机关键词命中走该提案的硬短路；未命中走本提案的 prompt 软护栏。

## Phase 7: Wiki 家族版本与拼装（3 个模板）

- [x] 7.1 `wiki-home`：`1.0` → `1.1`；system 前置 `SAFETY_INSTRUCTION`（教育内容，无需 `NO_FATE_CERTAINTY_REMINDER`）。
- [x] 7.2 `wiki-classics-master`：`1.0` → `1.1`；system 前置 `SAFETY_INSTRUCTION`。
- [x] 7.3 `synthetica-analysis`：`2.0` → `2.1`；system 前置 `SAFETY_INSTRUCTION`。
- [x] 7.4 测试：`wiki-home` 一条断言。

## Phase 8: Detail 家族版本与拼装（20 个模板）

`detail-*` 涵盖 elements / aspects / planets / asteroids / rulers / synthesis × natal / transit / synastry / composite 全组合。全部 `1.2` → `1.3`、`2.2` → `2.3`，system 前置 `SAFETY_INSTRUCTION`；上下文为 `transit`/`synastry`/`composite` 的进一步追加 `NO_FATE_CERTAINTY_REMINDER`（涉及关系/未来）。

- [x] 8.1 `detail-elements-natal` 1.2 → 1.3
- [x] 8.2 `detail-elements-composite` 1.2 → 1.3（+reminder）
- [x] 8.3 `detail-aspects-natal` 1.2 → 1.3
- [x] 8.4 `detail-aspects-transit` 1.2 → 1.3（+reminder）
- [x] 8.5 `detail-aspects-synastry` 1.2 → 1.3（+reminder）
- [x] 8.6 `detail-aspects-composite` 1.2 → 1.3（+reminder）
- [x] 8.7 `detail-planets-natal` 1.2 → 1.3
- [x] 8.8 `detail-planets-transit` 1.2 → 1.3（+reminder）
- [x] 8.9 `detail-planets-synastry` 2.2 → 2.3（+reminder）
- [x] 8.10 `detail-planets-composite` 1.2 → 1.3（+reminder）
- [x] 8.11 `detail-asteroids-natal` 1.2 → 1.3
- [x] 8.12 `detail-asteroids-transit` 1.2 → 1.3（+reminder）
- [x] 8.13 `detail-asteroids-synastry` 2.2 → 2.3（+reminder）
- [x] 8.14 `detail-asteroids-composite` 1.2 → 1.3（+reminder）
- [x] 8.15 `detail-rulers-natal` 1.2 → 1.3
- [x] 8.16 `detail-rulers-transit` 1.2 → 1.3（+reminder）
- [x] 8.17 `detail-rulers-synastry` 2.2 → 2.3（+reminder）
- [x] 8.18 `detail-rulers-composite` 1.2 → 1.3（+reminder）
- [x] 8.19 `detail-synthesis-synastry` 1.2 → 1.3（+reminder）
- [x] 8.20 测试：随机抽样 `detail-aspects-transit`、`detail-planets-synastry`、`detail-elements-natal` 三条断言。

## Phase 9: 集成测试与质量门禁

- [x] 9.1 新增 `backend/src/prompts/safety.test.ts`（位置改为 `backend/src/prompts/safety.test.ts`，与 vitest 配置 `src/**/*.test.ts` 匹配），按 Phase 2-8 的覆盖矩阵聚合断言。
- [x] 9.2 `npm run test --filter prompts` 通过；快照测试无意外变更。
- [ ] 9.3 抽样运行真实 LLM 调用（natal-overview / daily-forecast / cbt-analysis / ask-answer），人工检查输出是否：
  - 不出现"will definitely / 注定 / 必然"等绝对化措辞；
  - CBT 输出末尾包含"非临床诊断"声明；
  - ask-answer 仍保留温和的求助资源建议。
- [ ] 9.4 缓存观察：上线后 24h 内观测 `${promptId}:${version}` 缓存命中率（预期短暂下降至 ~0%，随后回升）。

## Phase 10: 归档阶段同步（实施完成后单独 PR）

- [ ] 10.1 更新 `docs/PRD.md` §4.5 prompt 模板清单中 51 个模板的新版本号。
- [x] 10.2 更新 `backend/src/prompts/FOLDER.md`，在"近期更新"中记录护栏机制。
- [ ] 10.3 `openspec archive add-ai-safety-prompt-guardrails --yes` 归档变更。

## 执行顺序

```
Phase 1（常量）
   └──→ Phase 2-8（可并行）
          └──→ Phase 9（集成测试）
                 └──→ Phase 10（归档）
```

Phase 2-8 可由 6 个独立 sub-agent 并行推进，互不冲突（同一文件不同代码块）。
