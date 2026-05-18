<!-- INPUT: CBT 危机检测的技术决策、模块边界、数据形态与风险分析。 -->
<!-- OUTPUT: 设计文档（Context / Goals / Decisions / Risks / Open Questions）。 -->
<!-- POS: OpenSpec 变更设计文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 设计文档：add-cbt-crisis-detection

## Context

CBT 模块的 6 个分析端点（`/analysis`、`/aggregate-analysis`、`/somatic-analysis`、`/root-analysis`、`/mood-analysis`、`/competence-analysis`）现状会将用户原文（`situation`、`automaticThoughts[]`、`hotThought`、`balancedEntries[].text`、各类统计 notes）直接拼入 prompt 并调用 LLM。仅依赖 `manager.ts:1403` 的软性 Safety Guardrail，不足以保障极端情境。

约束：
- 不引入新依赖（项目已尽量保持小依赖面）。
- 不修改 prompt 本身行为（保留 LLM 软性兜底作为第二层）。
- 中英双语必须同时覆盖（产品默认英文、辅助中文）。
- 检测不能阻塞或抛出未处理异常——一旦失败，应"默认放行进入 LLM 流程"，但记录 warn。
- 不能把任何用户原文写入 analytics（CLAUDE.md 隐私规则）。

相关方：CBT 用户（弱势时刻）、运营/客服团队（需要感知风险事件）、心理健康审阅者（关键词集合的权威方）。

## Goals / Non-Goals

**Goals**
- 在 LLM 调用前实现确定性的、低延迟（< 5ms）的关键词检测。
- 命中后向用户返回区域化的、可立即拨打的求助资源。
- 提供脱敏遥测，让团队感知风险频次与区域分布。
- 双语对称（zh/en 关键词与文案）。
- 检测器与热线数据可独立单测、独立演进。

**Non-Goals**
- 自然语言意图识别（不调小模型分类，关键词足够覆盖 P0 场景）。
- 自动报警/通报家属/外部转介（产品形态尚未授权）。
- 多轮危机对话（一次性短路返回即可）。
- 替换 LLM 的"Safety Guardrail" prompt 指令。

## Decisions

### Decision 1：检测时机——LLM 调用前的硬性短路
- **What**：在每个 CBT 分析端点中，`parseBirthInput` 之后、`ephemerisService` / `generateAIContent` 之前调用 `detectCrisis()`。命中即返回 HTTP 200 + `crisis_detected` 状态，**完全跳过 LLM**。
- **Why**：LLM 输出不可控且耗时长（典型 3-10s）。高风险用户没有等待预算。短路保证 < 100ms 内返回求助资源。
- **Alternatives considered**：
  - *LLM 输出后过滤*：风险已经被生成、token 已经消耗，且 LLM 可能给出不当回应。否决。
  - *外部 NLP 服务*：引入网络依赖与成本，与"无新依赖"约束冲突。否决。

### Decision 2：检测算法——双语词边界正则 + 中文子串
- **数据结构**：
  ```ts
  // backend/src/data/crisis-keywords.ts
  export const EN_PATTERNS: RegExp[] = [
    /\bsuicide\b/i,
    /\bkill myself\b/i,
    /\bend it all\b/i,
    /\bhurt myself\b/i,
    /\bself[\s-]?harm\b/i,
    /\bwant to die\b/i,
  ];
  export const ZH_KEYWORDS: string[] = [
    '没有意义', '想死', '自杀', '结束生命', '自残', '活不下去',
  ];
  ```
- **匹配函数**：
  ```ts
  export function detectCrisis(texts: (string | undefined)[]): { hit: boolean; matched?: string } {
    for (const raw of texts) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const lower = raw.toLowerCase();
      for (const re of EN_PATTERNS) {
        if (re.test(lower)) return { hit: true, matched: re.source };
      }
      for (const kw of ZH_KEYWORDS) {
        if (raw.includes(kw)) return { hit: true, matched: kw };
      }
    }
    return { hit: false };
  }
  ```
- **Why**：
  - 英文必须用 `\b` 避免误伤（"endeavor" 不应触发 "end"）。
  - 中文无空格，子串匹配即可；中文同形词误伤率低（"自杀" 几乎只用于此语义）。
  - 大小写不敏感（`toLowerCase` 一次）。
  - 关键词列表初始版需要心理健康专业人士审阅——在文件头注释中明确标注此处为 v0。

### Decision 3：响应形状——HTTP 200 而非错误
```ts
interface CBTCrisisResponse {
  status: 'crisis_detected';
  helpline: {
    region: 'US' | 'UK' | 'CN' | 'HK' | 'TW' | 'INTL' | string;
    name: string;        // 区域语言的本地化名称
    name_en: string;
    name_zh: string;
    phone: string;       // 可直接 tel: 拨号
    url: string;
  };
  message_zh: string;    // 抚慰文案
  message_en: string;
}
```
- **Why HTTP 200**：这不是错误。错误码会让前端 fetch 走 catch 分支，可能丢失渲染。这是一个预期产品分支。
- **同时返回 zh/en 两份文案**：前端根据当前 UI 语言渲染，避免与 `lang` 参数解耦时出错。
- **`status` 字段而非 `success: false`**：现有 `CBTAnalysisResponse` 没有 `status` 字段——加一个新字段比改既有契约更安全。

### Decision 4：区域解析——header 优先 → lang 推断 → 国际兜底
```ts
export function resolveRegion(req: Request, lang: 'zh' | 'en'): RegionCode {
  const header = String(req.headers['x-region'] ?? '').toUpperCase();
  if (header && HELPLINES[header]) return header as RegionCode;
  if (lang === 'zh') return 'CN';
  if (lang === 'en') return 'US';
  return 'INTL';
}
```
- **Why**：`x-region` 是显式信号（前端可由 IP 地理位置或用户设置注入），优先级最高；`lang` 是合理的兜底；最差使用 Befrienders Worldwide URL。
- **Why not Accept-Language**：浏览器 header 与用户实际所在地相关性弱。

### Decision 5：热线数据形态
```ts
// backend/src/data/helplines.ts
export type RegionCode = 'US' | 'UK' | 'CN' | 'HK' | 'TW' | 'INTL';
export interface Helpline {
  region: RegionCode;
  name_en: string;
  name_zh: string;
  phone: string;
  url: string;
}
export const HELPLINES: Record<RegionCode, Helpline> = {
  US: { region: 'US', name_en: '988 Suicide & Crisis Lifeline', name_zh: '988 自杀与危机求助热线',
        phone: '988', url: 'https://988lifeline.org' },
  UK: { region: 'UK', name_en: 'Samaritans', name_zh: '撒玛利亚会',
        phone: '116 123', url: 'https://www.samaritans.org' },
  CN: { region: 'CN', name_en: 'Beijing Crisis Hotline', name_zh: '北京心理危机研究与干预中心',
        phone: '010-82951332', url: 'https://www.crisis.org.cn' },
  HK: { region: 'HK', name_en: 'Samaritans Hong Kong', name_zh: '香港撒玛利亚防止自杀会',
        phone: '2389 2222', url: 'https://www.sbhk.org.hk' },
  TW: { region: 'TW', name_en: 'Lifeline Taiwan', name_zh: '生命线协谈',
        phone: '1995', url: 'https://www.life1995.org.tw' },
  INTL: { region: 'INTL', name_en: 'Befrienders Worldwide', name_zh: 'Befrienders 全球热线',
          phone: '', url: 'https://www.befrienders.org' },
};
```
- 国际兜底无电话（不同国家差异大），仅 URL。
- 热线信息归档前由产品/法务复核（见 Open Questions）。

### Decision 6：遥测脱敏
```ts
analytics.track({
  event: 'cbt_crisis_detected',
  region,
  lang,
  endpoint: '/api/cbt/analysis',
});
```
- 严禁包含：`situation`、`automaticThoughts`、`matched` 关键词、`userId`（与情绪日记关联即可定位用户，敏感）。
- 仅包含：region / lang / endpoint。
- 命中频次 > 0 时由运营人工分析趋势，不做自动 PII 关联。

### Decision 7：调试旁路
```ts
const isDev = process.env.NODE_ENV !== 'production';
const override = isDev && req.query.override_crisis_check === 'true';
if (!override) {
  const detection = detectCrisis(extractFreeText(req.body));
  if (detection.hit) { ... return; }
}
```
- 仅 dev 生效。Prod 下即使带参数也不绕过。
- 用于 QA 测试包含关键词的正常文本（如内容审核相关 prompt 改进研究）。

### Decision 8：前端 UX 状态
- 进入 CBT 分析等待页面后，若响应 `status === 'crisis_detected'`：
  - 替换 ResultView 为 `CrisisCard`。
  - 卡片元素：标题（"如果你正经历困难"）+ 抚慰段落 + 热线名称 + 大号电话按钮（`tel:` 链接）+ 备用 URL。
  - 提供"我安全，继续记录"次级按钮（不重新发送分析请求，回到 Wizard 起点）。
  - 不展示用户原文，不展示任何占星/CBT 分析。
- 不写入 `cbt:records` 缓存，避免历史回放再次触发。

### Decision 9：检测覆盖字段（按端点）
| 端点 | 待检测字段 |
|------|-----------|
| `/analysis` | `situation`, `automaticThoughts[]`, `hotThought`, `balancedEntries[].text` |
| `/aggregate-analysis` | 各 stats 内的 `notes` / `text` 自由文本字段（如有） |
| `/somatic-analysis` | 同上 |
| `/root-analysis` | 同上 |
| `/mood-analysis` | 同上 |
| `/competence-analysis` | 同上 |

抽取逻辑统一在 `extractFreeText(body, endpoint)` helper 中，单测覆盖每个端点的 body 形状。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| **关键词不全 / 漏报**：v0 列表覆盖率有限。 | (1) 文件头标注"需心理健康专家审阅"；(2) 保留 LLM 软性 Safety Guardrail 作为第二层；(3) 遥测频次驱动后续扩词。 |
| **误报**：例如"I want to kill myself laughing"。 | 用 `\b kill myself \b` 词边界；后续若误报率高，可加上下文否定词过滤（如前缀 "laughing"、"with"）。当前 v0 倾向"宁可误报不漏报"。 |
| **首字符变形绕过**：例如"杀.自"。 | 不处理。本提案目标是覆盖直白表达，不做对抗性场景。 |
| **检测器抛错导致 500**：影响全部 CBT 请求。 | 检测函数包 `try/catch`，异常时 `return { hit: false }` + `logger.warn`。 |
| **热线电话变更**：电话号码生命周期长，但偶尔变。 | 热线数据集中在单文件，便于审阅/更新；归档前需法务/产品确认。 |
| **遥测意外携带原文**：开发者后续误改。 | 在 `analytics.track` 调用上方写明显注释；提交 lint 规则检查 `cbt_crisis_detected` payload 形状（可选）。 |
| **dev 旁路误开生产**：`NODE_ENV` 配置错误。 | 双重校验：`process.env.NODE_ENV !== 'production'` && `query.override_crisis_check === 'true'`；任何一个不满足都走检测。 |

## Migration Plan

1. **数据 + 检测器单测先行**（Phase 1）：可独立 review + 心理专家审阅词表。
2. **后端集成 + mock 集成测试**（Phase 2 + Phase 3）：API 契约稳定。
3. **前端切类型 + UI 分支**（Phase 4）：前端可同步开发。
4. **灰度开关（可选）**：在 `backend/src/api/cbt.ts` 加 `CRISIS_DETECTION_ENABLED` env flag，默认 `true`；生产事故时可快速回滚。
5. **归档前更新 PRD + FOLDER.md**。

回滚：若线上发现严重误报，设 `CRISIS_DETECTION_ENABLED=false` 后即时回退到旧行为；不需要部署变更。

## Open Questions

1. 中国大陆地区使用"北京心理危机研究与干预中心 010-82951332"还是"全国希望热线 400-161-9995"？需产品决定（建议两条都展示）。
2. 是否需要在 CrisisCard 展示"立即联系紧急联系人"功能（需要前置在 onboarding 收集）？本提案默认 **不做**。
3. 关键词扩词流程：是否纳入 PR review checklist，每次新增需心理专家在 PR 中签字？建议采纳但本提案不强制写入。
4. 遥测出口：当前项目是否已有统一 `analytics` 模块？如未有，本提案先用 `logger.warn` 占位。
5. 是否需要支持 `x-region` 由前端依据浏览器 `navigator.language` + 地理 API 自动注入？本提案仅声明契约，不强制前端实现。
