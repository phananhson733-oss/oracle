<!-- INPUT: AI 安全 prompt 护栏能力的规范增量。 -->
<!-- OUTPUT: prompt-safety-guardrails 能力的 ADDED Requirements 与 Scenario。 -->
<!-- POS: 变更增量规范；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements

### Requirement: SAFETY_INSTRUCTION 全局前置注入

系统 SHALL 在 `backend/src/prompts/common.ts` 定义双语 `SAFETY_INSTRUCTION_ZH` 与 `SAFETY_INSTRUCTION_EN` 常量，并提供 `resolveSafetyInstruction(ctx)` 工具函数，根据 `ctx.lang` 返回对应语言版本。所有 51 个在 `manager.ts` 注册的 prompt 模板的 system 字段 MUST 在最前面包含该安全指令。

`SAFETY_INSTRUCTION` 内容 MUST 至少声明三条：禁止医疗诊断与预后保证；禁止绝对化或宿命化表述；遇到严重困扰时温和建议寻求专业帮助。

#### Scenario: Natal 家族 system 包含 SAFETY_INSTRUCTION

- **GIVEN** 已加载 prompt 注册表
- **WHEN** 调用 `buildPrompt('natal-overview', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 system 字符串以 `SAFETY_INSTRUCTION_ZH` 内容开头
- **AND** 包含子串 "禁止诊断"

#### Scenario: 英文上下文返回英文护栏

- **GIVEN** 已加载 prompt 注册表
- **WHEN** 调用 `buildPrompt('natal-overview', { lang: 'en', ...stubCtx })`
- **THEN** 返回的 system 字符串包含 "Safety guardrails (mandatory)"
- **AND** 不包含中文护栏文本

#### Scenario: Wiki 家族也注入 SAFETY_INSTRUCTION

- **WHEN** 调用 `buildPrompt('wiki-home', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 system 字符串包含 SAFETY_INSTRUCTION 子串

### Requirement: NO_FATE_CERTAINTY_REMINDER 对涉及未来/关系的家族

系统 SHALL 在 `common.ts` 定义双语 `NO_FATE_CERTAINTY_REMINDER_ZH` 与 `NO_FATE_CERTAINTY_REMINDER_EN` 常量。以下家族的 prompt MUST 在 system 中除 `SAFETY_INSTRUCTION` 外，额外包含 `NO_FATE_CERTAINTY_REMINDER`：`daily-*`、`ask-*`、`synastry-*`、`cycle-naming`、`detail-*` 中 context 为 `transit`/`synastry`/`composite` 的全部模板。

Wiki / Natal 家族（不含 cycle）MUST NOT 额外注入该提醒，避免冗余。

#### Scenario: Daily forecast 包含宿命论提醒

- **WHEN** 调用 `buildPrompt('daily-forecast', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 system 包含子串 "禁止使用绝对化"
- **AND** 同时包含 SAFETY_INSTRUCTION 子串

#### Scenario: Synastry overview 包含宿命论提醒

- **WHEN** 调用 `buildPrompt('synastry-overview', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 system 同时包含 SAFETY_INSTRUCTION 与 NO_FATE_CERTAINTY_REMINDER

#### Scenario: Natal overview 不重复注入

- **WHEN** 调用 `buildPrompt('natal-overview', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 system 包含 SAFETY_INSTRUCTION
- **AND** 不包含 NO_FATE_CERTAINTY_REMINDER 子串

#### Scenario: Detail-aspects-transit 包含宿命论提醒

- **WHEN** 调用 `buildPrompt('detail-aspects-transit', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 system 同时包含 SAFETY_INSTRUCTION 与 NO_FATE_CERTAINTY_REMINDER

### Requirement: CBT_DISCLAIMER_FOOTER 强制追加

系统 SHALL 在 `common.ts` 定义双语 `CBT_DISCLAIMER_FOOTER_ZH` 与 `CBT_DISCLAIMER_FOOTER_EN`。所有 6 个 `cbt-*` 系列模板的 `user` 输出规范 MUST 在末尾追加该 footer，使 LLM 在结构化输出之外显式声明"非临床诊断"。

footer 内容 MUST 包含两条信息：明确声明非临床诊断；建议在持续心理困扰时咨询持证心理咨询师或精神科医生。

#### Scenario: CBT analysis user 包含 disclaimer

- **WHEN** 调用 `buildPrompt('cbt-analysis', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 user 字符串包含子串 "这不是临床诊断"

#### Scenario: 六个 CBT 模板全部包含 footer

- **WHEN** 依次调用 `buildPrompt(id, ...)`，其中 id ∈ `{cbt-analysis, cbt-aggregate-analysis, cbt-somatic-analysis, cbt-root-analysis, cbt-mood-analysis, cbt-competence-analysis}`
- **THEN** 每个返回的 user 都包含 CBT_DISCLAIMER_FOOTER 子串

#### Scenario: 英文 CBT 返回英文 footer

- **WHEN** 调用 `buildPrompt('cbt-analysis', { lang: 'en', ...stubCtx })`
- **THEN** 返回的 user 包含 "This is not a clinical diagnosis"

#### Scenario: 非 CBT 模板不追加 disclaimer

- **WHEN** 调用 `buildPrompt('natal-overview', { lang: 'zh', ...stubCtx })`
- **THEN** 返回的 user 不包含 CBT_DISCLAIMER_FOOTER 子串

### Requirement: 版本号小幅递增触发缓存失效

每个被本提案修改的 prompt 模板 MUST 进行 minor 版本递增（如 `5.1` → `5.2`，`1.0` → `1.1`，`2.0` → `2.1`，`10.0` → `10.1`，`4.0` → `4.1`，`1.2` → `1.3`，`2.2` → `2.3`）。升级 MUST 应用于全部 51 个模板，无例外。

由于 LLM 输出缓存键包含 `${promptId}:${version}`，版本号递增 MUST 导致旧缓存自然失效，下一轮请求重新生成带护栏的内容。

#### Scenario: natal-overview 版本递增

- **GIVEN** 上线前 `getPromptVersion('natal-overview')` 返回 `5.1`
- **WHEN** 本变更上线后查询
- **THEN** 返回 `5.2`

#### Scenario: 所有 51 个模板都升级

- **WHEN** 遍历 `manager.ts` 的注册表
- **THEN** 每个模板的 `meta.version` 都与提案前不同（小幅递增）
- **AND** 没有任何模板版本号被遗漏

#### Scenario: 旧缓存键失效

- **GIVEN** 旧版本 `natal-overview:5.1` 的 LLM 输出仍存在缓存
- **WHEN** 用户请求生成 natal-overview
- **THEN** 缓存键 `natal-overview:5.2` 未命中
- **AND** 系统调用 LLM 并以新版本号回填缓存

### Requirement: 安全护栏注入测试覆盖

系统 SHALL 在 `backend/src/prompts/__tests__/safety-guardrails.test.ts` 维护一套测试，使所有 8 个家族（natal / daily / ask / synastry / cbt / wiki / cycle / detail）至少各有 1 条断言验证安全护栏的存在。CBT 家族 MUST 覆盖全部 6 个模板。

#### Scenario: 测试套件断言每个家族至少一条

- **WHEN** 运行 `npm run test --filter safety-guardrails`
- **THEN** 测试通过
- **AND** 输出报告显示 natal、daily、ask、synastry、cbt、wiki、cycle、detail 八个家族均有命中断言

#### Scenario: CBT 家族全量覆盖

- **WHEN** 运行 CBT 安全护栏断言
- **THEN** 6 个 cbt-* 模板全部断言通过 SAFETY_INSTRUCTION + CBT_DISCLAIMER_FOOTER 两项

#### Scenario: 语言切换断言

- **WHEN** 测试用例分别以 `lang: 'zh'` 与 `lang: 'en'` 调用 `buildPrompt('natal-overview', ...)`
- **THEN** 两次返回的 system 分别包含对应语言的 SAFETY_INSTRUCTION 子串

### Requirement: 安全护栏与危机短路双层防御共存

`prompt-safety-guardrails` MUST 与 `cbt-crisis-detection`（在 `add-cbt-crisis-detection` 变更中引入）共存且不冲突。关键词命中时 API 层短路返回热线，跳过 LLM 调用与本能力的 prompt 护栏；未命中时调用 LLM，此时本能力的 prompt 护栏生效。

#### Scenario: 关键词命中时 prompt 护栏不参与

- **GIVEN** 用户提交的 CBT 文本包含自伤关键词
- **WHEN** `add-cbt-crisis-detection` 的检测器命中
- **THEN** API 直接返回热线响应，不调用 `buildPrompt`，不消耗 prompt 护栏

#### Scenario: 关键词未命中时 prompt 护栏生效

- **GIVEN** 用户提交的 CBT 文本不含危机关键词
- **WHEN** API 调用 `buildPrompt('cbt-analysis', ctx)` 并发送给 LLM
- **THEN** LLM 收到包含 SAFETY_INSTRUCTION 的 system 与包含 CBT_DISCLAIMER_FOOTER 的 user
- **AND** LLM 输出中保留 disclaimer 与克制语气
