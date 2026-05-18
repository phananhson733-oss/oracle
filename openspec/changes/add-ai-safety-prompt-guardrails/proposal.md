<!-- INPUT: 在 51 个 prompt 模板中系统性注入 AI 安全护栏的变更提案。 -->
<!-- OUTPUT: OpenSpec 变更提案（AI 安全 prompt 护栏）。 -->
<!-- POS: OpenSpec 变更提案；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 在所有 AI Prompt 中注入系统性安全护栏

## Why

代码审查（P2）指出 `backend/src/prompts/manager.ts` 注册的 **51 个 prompt 模板** 缺乏系统性安全约束：

1. **无医疗免责**：`cbt-*` 系列（6 个模板）输出 `cognitive_analysis` / `distortions` 等带临床味的字段，但从未声明"非临床诊断"。
2. **无宿命论约束**：`ask-answer`、`synastry-*`（15 个）、`daily-*`（2 个）、`cycle-naming` 等仍可能生成 "you will definitely..." / "your relationship is destined to..." 等绝对化、宿命化表述。
3. **危机提示太弱**：仅 `ask-answer` 包含一条"温和建议寻求专业帮助"的软性指令，且未强制执行。
4. **缺乏全局前缀**：没有在 `common.ts` 中定义可复用的 `SAFETY_INSTRUCTION`，无法保证所有 prompt 一致遵守。

CLAUDE.md 第 "内容审核" 节明确要求保持心理学导向、避免封建迷信，但当前 prompt 层没有强制机制。

这与并行进行中的 `add-cbt-crisis-detection`（API 层关键词短路）互补但不重复：前者是 LLM 调用前的硬短路，本提案是 LLM 调用中的 prompt 层软护栏；两层共同构成深度防御。

## What Changes

- **新增 capability**：`prompt-safety-guardrails`（独立的 AI 安全护栏能力，与 `prompt-architecture` 等正交）。
- **新增常量**（`backend/src/prompts/common.ts`）：
  - `SAFETY_INSTRUCTION_ZH` / `SAFETY_INSTRUCTION_EN`：禁止医疗诊断、禁止预后保证、禁止宿命化表述。
  - `SAFETY_INSTRUCTION`：根据 `lang` 上下文选择中/英版本的辅助函数或字符串拼接常量。
  - `CBT_DISCLAIMER_FOOTER_ZH` / `CBT_DISCLAIMER_FOOTER_EN`：CBT 模块结尾追加的"非临床诊断"声明。
  - `NO_FATE_CERTAINTY_REMINDER_ZH` / `NO_FATE_CERTAINTY_REMINDER_EN`：Ask/Synastry/Daily/Cycle 模块的"避免绝对化未来"提醒。
- **修改 prompt 注入策略**：所有 51 个模板的 `system` 字段在拼装时由 builder（或现有 `buildPrompt`）前置 `SAFETY_INSTRUCTION`；CBT 系列的 `user` 输出规范追加 `CBT_DISCLAIMER_FOOTER`；Ask/Synastry/Daily/Cycle 系列额外注入 `NO_FATE_CERTAINTY_REMINDER`。
- **版本号统一小幅递增**（minor bump，影响所有 51 个模板）：
  - `natal-*`、`daily-*`：`5.1` → `5.2`（3 个 natal + 2 个 daily）
  - `cycle-naming`：`3.0` → `3.1`
  - `synastry-overview`：`10.0` → `10.1`
  - 其他 `synastry-*` v1.x：`1.0/1.1` → `1.1/1.2`、`synastry-growth-task` `2.0` → `2.1`、`synastry-natal-*`/`compare-*`/`composite`/`dynamic` `4.0` → `4.1`
  - `ask-answer`：`5.2` → `5.3`
  - `cbt-*`：`5.2/2.0/1.0` → `5.3/2.1/1.1`（含 footer）
  - `wiki-home`/`wiki-classics-master`：`1.0` → `1.1`；`synthetica-analysis`：`2.0` → `2.1`
  - `detail-*` 全部：`1.2/2.2` → `1.3/2.3`
- **测试**：新增 `backend/src/prompts/__tests__/safety-guardrails.test.ts`，覆盖以下断言：
  - 每个家族任选 1-2 个 prompt，`buildPrompt(...)` 返回的 system 中包含 `SAFETY_INSTRUCTION` 子串。
  - 每个 `cbt-*` prompt 的 user 输出规范包含 `CBT_DISCLAIMER_FOOTER` 子串。
  - 每个 `ask-*`/`synastry-*`/`daily-*`/`cycle-*` prompt 包含 `NO_FATE_CERTAINTY_REMINDER` 子串。
- **缓存说明**：版本号递增会使所有以 `${promptId}:${version}` 为 key 的 LLM 输出缓存自然失效。这是预期行为——上线后下一轮请求会重新生成带护栏的内容。运营侧需提前告知缓存命中率短期下降。

**不在范围**：
- 不修改 `backend/src/data/wiki-prompts.ts`、`wiki-classic-prompts*.ts`（与 `validate-optimize-prompts` 一致，深度解读静态资源除外）。
- 不修改前端展示（护栏由 prompt 层保证，前端不感知）。
- 不与 `add-cbt-crisis-detection` 的关键词短路逻辑冲突——本提案是 prompt 内软护栏，关键词命中时仍会走该提案的硬短路分支。
- 不在本次更新 `docs/PRD.md`——按 OpenSpec 工作流，在归档阶段同步 §4.5 prompt 模板清单的新版本号。

## Impact

- **Affected specs**:
  - `prompt-safety-guardrails`（ADDED：全新安全能力）
- **Affected code**:
  - `backend/src/prompts/common.ts`（新增 4 组安全常量）
  - `backend/src/prompts/manager.ts`（51 个模板版本号 + system/user 拼装）
  - `backend/src/prompts/__tests__/safety-guardrails.test.ts`（新增测试）
  - `docs/PRD.md`（归档阶段更新 §4.5）
  - `backend/src/prompts/FOLDER.md`（归档阶段记录护栏机制）
- **Affected runtime behavior**:
  - 所有 LLM 调用的 system token 数 +60~120（中英拼接后约 90-150 token）。
  - 所有 prompt 输出缓存因版本号变更失效一次，按生命周期自然回填。
- **Breaking?** **No**——输出 JSON 结构不变，仅内容上多一条免责语（CBT）或语气更克制（其他模块）。
