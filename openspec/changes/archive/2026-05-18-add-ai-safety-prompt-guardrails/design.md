<!-- INPUT: AI 安全 prompt 护栏的技术设计与决策。 -->
<!-- OUTPUT: OpenSpec 变更设计文档（AI 安全 prompt 护栏）。 -->
<!-- POS: OpenSpec 变更设计文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Design: add-ai-safety-prompt-guardrails

## Context

`backend/src/prompts/manager.ts` 注册了 51 个 prompt 模板，覆盖本命盘、日运、合盘、CBT、Ask、Wiki、Cycle、Detail 八大家族。当前缺乏统一的安全护栏：医疗免责、宿命论约束、危机引导都是单点存在或完全缺失。

并行 PR `add-cbt-crisis-detection` 已在 API 层加入关键词短路（命中即返回热线，不调 LLM）。本提案与之**正交且互补**——本提案在 LLM 调用通道内注入软护栏，覆盖关键词未命中但语气仍需克制的所有调用。

## Goals / Non-Goals

**Goals**：
- 用 ≤150 token 的安全前缀覆盖所有 51 个 prompt 模板。
- 在 CBT 输出末尾追加显式"非临床诊断"声明。
- 在涉及未来/关系/周期/详情的 prompt 中追加"避免绝对化"提醒。
- 所有变更通过版本号小幅递增触发缓存自然失效。
- 完整测试覆盖（每个家族至少 1 条断言）。

**Non-Goals**：
- 不修改输出 JSON 结构。
- 不改变温度参数或模型选择。
- 不修改 `backend/src/data/wiki-prompts.ts`、`wiki-classic-prompts*.ts`（与 `validate-optimize-prompts` 排除范围一致）。
- 不实现关键词短路（由 `add-cbt-crisis-detection` 负责）。
- 不调整前端展示。

## Decisions

### Decision 1：常量精确措辞

**SAFETY_INSTRUCTION_ZH**（约 80 字）：
```
安全护栏（必须遵守）：
1. 你不是医疗专业人士，禁止诊断、开方或保证治疗效果。
2. 禁止使用"注定""必然""一定会""无法改变"等绝对化或宿命化表述；用"可能""倾向于""或许会""有这种潜在趋势"等克制语气替代。
3. 涉及严重困扰（持续低落、自伤想法、惊恐发作）时，温和建议用户寻求持证心理咨询师或精神科医生协助。
```

**SAFETY_INSTRUCTION_EN**（约 90 词）：
```
Safety guardrails (mandatory):
1. You are NOT a medical professional. Do not diagnose, prescribe, or guarantee any clinical outcome.
2. Avoid absolute or fate-bound language ("will", "must", "destined to", "always"). Use tentative phrasing instead: "may", "could", "tends toward", "suggests a tendency".
3. When the user mentions persistent distress, self-harm, or panic, gently suggest consulting a licensed therapist or psychiatrist.
```

**CBT_DISCLAIMER_FOOTER_ZH**：
```
注意：这不是临床诊断。如果你正在经历持续的心理困扰，请考虑咨询持证心理咨询师或精神科医生。
```

**CBT_DISCLAIMER_FOOTER_EN**：
```
Note: This is not a clinical diagnosis. If you're experiencing ongoing psychological distress, please consider consulting a licensed therapist or psychiatrist.
```

**NO_FATE_CERTAINTY_REMINDER_ZH**：
```
重要：禁止使用绝对化/宿命化措辞（注定、必然、一定）；改用"可能""倾向于""或许""或许暗示"等表达。
```

**NO_FATE_CERTAINTY_REMINDER_EN**：
```
Important: Avoid absolute/fated language (destined, definitely, must). Use tentative phrasing (may, could, tends toward, suggests a tendency).
```

**关键设计**：
- 双语并行存在，按 `ctx.lang` 解析；缺省回退到 `zh`。
- 与现有 `SINGLE_LANGUAGE_INSTRUCTION` 同位置（`common.ts`），便于 import。
- 在 system 中放置顺序：`SAFETY_INSTRUCTION` → 原 system → 可选 `NO_FATE_CERTAINTY_REMINDER`；CBT footer 放在 user 输出规范末尾。

### Decision 2：注入应用矩阵

每个家族需要的指令组合：

| 家族 | 数量 | system 前置 SAFETY | system 追加 NO_FATE | user 追加 CBT_FOOTER |
|------|------|--------------------|---------------------|----------------------|
| natal-* | 3 | ✅ | — | — |
| cycle-naming | 1 | ✅ | ✅ | — |
| daily-* | 2 | ✅ | ✅ | — |
| ask-* | 1 | ✅ | ✅ | — |
| synastry-* | 15 | ✅ | ✅ | — |
| cbt-* | 6 | ✅ | — | ✅ |
| wiki-* | 3 | ✅ | — | — |
| detail-* natal | 5 | ✅ | — | — |
| detail-* transit/synastry/composite | 15 | ✅ | ✅ | — |

**理由**：
- Natal 是身份认知，关注"潜力描述"，仅需 SAFETY。
- Daily/Cycle/Synastry/Detail-transit 涉及未来与关系，必须避免宿命化。
- CBT 输出包含"认知扭曲""自动思维"等临床字段，必须显式 footer。
- Wiki 是教育内容，SAFETY 足够。

### Decision 3：完整 Prompt 版本号迁移矩阵

| Family | Prompt ID | Current | Target | Apply |
|--------|-----------|---------|--------|-------|
| natal | natal-overview | 5.1 | 5.2 | S |
| natal | natal-core-themes | 5.1 | 5.2 | S |
| natal | natal-dimension | 5.1 | 5.2 | S |
| natal (cycle) | cycle-naming | 3.0 | 3.1 | S + F |
| daily | daily-forecast | 5.1 | 5.2 | S + F |
| daily | daily-detail | 5.1 | 5.2 | S + F |
| ask | ask-answer | 5.2 | 5.3 | S + F |
| synastry | synastry-overview | 10.0 | 10.1 | S + F |
| synastry | synastry-highlights | 1.0 | 1.1 | S + F |
| synastry | synastry-core-dynamics | 1.1 | 1.2 | S + F |
| synastry | synastry-practice-tools | 1.0 | 1.1 | S + F |
| synastry | synastry-relationship-timing | 1.0 | 1.1 | S + F |
| synastry | synastry-vibe-tags | 1.0 | 1.1 | S + F |
| synastry | synastry-growth-task | 2.0 | 2.1 | S + F |
| synastry | synastry-conflict-loop | 1.0 | 1.1 | S + F |
| synastry | synastry-weather-forecast | 1.0 | 1.1 | S + F |
| synastry | synastry-action-plan | 1.0 | 1.1 | S + F |
| synastry | synastry-natal-a | 4.0 | 4.1 | S + F |
| synastry | synastry-natal-b | 4.0 | 4.1 | S + F |
| synastry | synastry-compare-ab | 4.0 | 4.1 | S + F |
| synastry | synastry-compare-ba | 4.0 | 4.1 | S + F |
| synastry | synastry-composite | 4.0 | 4.1 | S + F |
| synastry | synastry-dynamic | 4.0 | 4.1 | S + F |
| cbt | cbt-analysis | 5.2 | 5.3 | S + C |
| cbt | cbt-aggregate-analysis | 2.0 | 2.1 | S + C |
| cbt | cbt-somatic-analysis | 1.0 | 1.1 | S + C |
| cbt | cbt-root-analysis | 1.0 | 1.1 | S + C |
| cbt | cbt-mood-analysis | 1.0 | 1.1 | S + C |
| cbt | cbt-competence-analysis | 1.0 | 1.1 | S + C |
| wiki | wiki-home | 1.0 | 1.1 | S |
| wiki | wiki-classics-master | 1.0 | 1.1 | S |
| wiki | synthetica-analysis | 2.0 | 2.1 | S |
| detail | detail-elements-natal | 1.2 | 1.3 | S |
| detail | detail-elements-composite | 1.2 | 1.3 | S + F |
| detail | detail-aspects-natal | 1.2 | 1.3 | S |
| detail | detail-aspects-transit | 1.2 | 1.3 | S + F |
| detail | detail-aspects-synastry | 1.2 | 1.3 | S + F |
| detail | detail-aspects-composite | 1.2 | 1.3 | S + F |
| detail | detail-planets-natal | 1.2 | 1.3 | S |
| detail | detail-planets-transit | 1.2 | 1.3 | S + F |
| detail | detail-planets-synastry | 2.2 | 2.3 | S + F |
| detail | detail-planets-composite | 1.2 | 1.3 | S + F |
| detail | detail-asteroids-natal | 1.2 | 1.3 | S |
| detail | detail-asteroids-transit | 1.2 | 1.3 | S + F |
| detail | detail-asteroids-synastry | 2.2 | 2.3 | S + F |
| detail | detail-asteroids-composite | 1.2 | 1.3 | S + F |
| detail | detail-rulers-natal | 1.2 | 1.3 | S |
| detail | detail-rulers-transit | 1.2 | 1.3 | S + F |
| detail | detail-rulers-synastry | 2.2 | 2.3 | S + F |
| detail | detail-rulers-composite | 1.2 | 1.3 | S + F |
| detail | detail-synthesis-synastry | 1.2 | 1.3 | S + F |

**图例**：`S` = SAFETY_INSTRUCTION；`F` = NO_FATE_CERTAINTY_REMINDER；`C` = CBT_DISCLAIMER_FOOTER。
**合计**：51 个模板全量小版本递增。

### Decision 4：实现风格——前置而非散落

**方案 A（采纳）**：在 `manager.ts` 内部统一 helper：
```typescript
// 概念示意
function withSafety(system: PromptSystem, opts: { addNoFate?: boolean }): PromptSystem {
  return (ctx) => {
    const base = typeof system === 'function' ? system(ctx) : system;
    const safety = resolveSafetyInstruction(ctx);
    const fate = opts.addNoFate ? `\n${resolveNoFateReminder(ctx)}` : '';
    return `${safety}\n\n${base}${fate}`;
  };
}
```
CBT 模板的 `user` 末尾追加 `resolveCbtDisclaimer(ctx)`。

**方案 B（拒绝）**：在每个 prompt 内硬编码安全字符串。
- 拒绝原因：51 处复制粘贴，容易漂移，未来修改成本高。

### Decision 5：测试策略

`backend/src/prompts/__tests__/safety-guardrails.test.ts`：
```typescript
// 概念示意
describe('safety guardrails', () => {
  const SAFETY_SUBSTR = '禁止诊断'; // 中文版子串
  const FATE_SUBSTR = '禁止使用绝对化';
  const CBT_FOOTER_SUBSTR = '这不是临床诊断';

  for (const id of NATAL_IDS) {
    it(`${id} has SAFETY in system`, () => {
      const out = buildPrompt(id, { lang: 'zh', ...stubCtx });
      expect(out.system).toContain(SAFETY_SUBSTR);
    });
  }

  for (const id of CBT_IDS) {
    it(`${id} has SAFETY in system and CBT footer in user`, () => {
      const out = buildPrompt(id, { lang: 'zh', ...stubCtx });
      expect(out.system).toContain(SAFETY_SUBSTR);
      expect(out.user).toContain(CBT_FOOTER_SUBSTR);
    });
  }

  for (const id of ASK_SYNASTRY_DAILY_CYCLE_IDS) {
    it(`${id} has NO_FATE reminder`, () => {
      const out = buildPrompt(id, { lang: 'zh', ...stubCtx });
      expect(out.system).toContain(FATE_SUBSTR);
    });
  }

  it('respects lang=en', () => {
    const out = buildPrompt('natal-overview', { lang: 'en', ...stubCtx });
    expect(out.system).toContain('Safety guardrails (mandatory)');
  });
});
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解 |
|------|------|------|
| Token 成本上升（每次 +60-150 token） | LLM 调用成本约 +3-5% | 监控月度成本变化；常量措辞已优化为最简 |
| 缓存全局失效 | 上线 24h 内缓存命中率短期为 0 | 提前通知运营；缓存自然回填 |
| 输出风格更克制可能影响"温情度"评分 | 文案略显谨慎 | 措辞保留温和语气；Phase 9 抽样人工 review |
| 与 `add-cbt-crisis-detection` 关系 | 双层防御可能重复 | 关键词命中：硬短路，跳过 LLM；未命中：本提案的 prompt 软护栏生效——互补无冲突 |
| 51 处修改的回归风险 | 单个模板拼装错误可能影响输出 | 集中 helper（Decision 4）+ 全家族测试覆盖（Decision 5） |

## Migration Plan

1. Phase 1（常量）独立 PR 提交并合并。
2. Phase 2-8 可以一个 PR 全量提交，或按家族拆分 PR（推荐拆分以便 code review）。
3. 每个 PR 必须包含对应家族的测试。
4. Phase 9 在所有家族 PR 合并后单独运行集成测试。
5. Phase 10 在生产上线 7 天后无问题再归档（更新 PRD §4.5 + FOLDER.md）。

**回滚策略**：每个家族都是版本号 +0.1，回滚即将版本号回退并移除安全常量调用——无 schema 变更，回滚成本极低。

## Open Questions

1. CBT footer 是否需要根据用户地区（如美区 vs 中区）替换为本地化求助资源？目前 disclaimer 是通用文案；区域化由 `add-cbt-crisis-detection` 的 `helplines.ts` 在硬短路分支负责，故本提案保持通用 disclaimer。
2. 是否需要在 `synthetica-analysis` 等工具类 prompt 中也注入 NO_FATE？当前判断为否（工具是占星术语图谱解读，无未来预测语境），但实施时可根据输出抽样再决定。
3. NO_FATE 提醒是否对 `cycle-naming` 太严格？该 prompt 只输出"周期命名词"（极短），建议放在 system 但允许命名词本身保留富有诗意的表达——实施时观察输出再微调。
