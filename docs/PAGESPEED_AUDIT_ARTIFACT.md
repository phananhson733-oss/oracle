<!-- INPUT: PageSpeed Audit Module PRD、Lighthouse/PSI 原始结果与 AstrologyWiki 生产验收数据。 -->
<!-- OUTPUT: 通用 PageSpeed 审计 Artifact 规格，定义机器 JSON、人工报告、状态映射、完整性要求与样例使用方式。 -->
<!-- POS: PageSpeed 审计 Artifact 规格；若更新此文件，务必更新本头注释与 docs/FOLDER.md。 -->

# PageSpeed Audit Artifact

版本：v1.0
日期：2026-07-07
配套 PRD：[`PAGESPEED_AUDIT_PRD.md`](./PAGESPEED_AUDIT_PRD.md)
机器 Schema：[`PAGESPEED_AUDIT_ARTIFACT.schema.json`](./PAGESPEED_AUDIT_ARTIFACT.schema.json)
AstrologyWiki 样例：[`PAGESPEED_AUDIT_ARTIFACT.astrologywiki.json`](./PAGESPEED_AUDIT_ARTIFACT.astrologywiki.json)

## 1. Artifact 定位

PageSpeed Audit Artifact 是通用审计模块的标准输出。它不是只给人看的报告摘要，而是一个可落库、可 diff、可作为 CI gate、可回放证据链的完整审计对象。

Artifact 必须同时回答五个问题：

1. 审计了哪个 URL、何时审计、用什么工具和环境审计。
2. Google/Lighthouse 返回了哪些 category、metric、audit。
3. 每一个 audit 是通过、失败、部分通过、不适用、人工项，还是纯信息项。
4. 哪些结果构成 release blocker，哪些只是 warning/backlog。
5. 当前审计与部署、资源、请求、缓存、控制台错误等站点级证据是否一致。

## 2. 设计原则

1. **不丢 audit**：`lighthouseResult.audits` 中的每个 audit 都必须归一化进入 `runs.<strategy>.audits`。
2. **不只报失败**：报告必须同时展示通过项、失败项、部分项、不适用项、人工项和信息项。
3. **原始结果可追溯**：生产实现必须保存 PSI JSON、LHR JSON、浏览器 smoke log、截图与响应头；Artifact 中记录 source path/object key/hash。
4. **策略独立**：desktop 与 mobile 必须分开跑、分开存、分开判断，最后再汇总 overall status。
5. **Gate 与机会分离**：Lighthouse `score=0` 不必然阻断发布；阻断由 `gates` 明确决定。
6. **可扩展 category**：不得硬编码只有 Performance/Accessibility/Best Practices/SEO；新出现的 Lighthouse category 必须保留。
7. **可复测比较**：Artifact 必须稳定 enough，允许同一 URL 在不同时间、不同 commit、不同部署之间做趋势和 diff。

## 3. 顶层结构

```json
{
  "artifactVersion": "1.0",
  "generatedAt": "2026-07-07T10:25:00.000Z",
  "target": {},
  "sources": {},
  "budgets": {},
  "summary": {},
  "runs": {
    "desktop": {},
    "mobile": {}
  },
  "customChecks": {},
  "gates": {},
  "findings": {},
  "nextActions": []
}
```

## 4. 字段说明

### 4.1 `target`

记录被审计对象。

必填字段：

- `requestedUrl`：用户输入 URL。
- `finalUrl`：最终审计 URL，需记录 redirect 后结果。
- `site`：站点域名或项目名。
- `labels`：业务标签，例如 `homepage`、`release`、`competitor`。

建议字段：

- `locale`
- `routeType`
- `owner`
- `expectedDeployment.gitSha`
- `expectedDeployment.assets`

### 4.2 `sources`

记录数据来源。

必填字段：

- `pageSpeedInsights`：PSI API 状态。成功时记录请求参数与响应对象位置；失败时记录错误码、fallback。
- `lighthouse`：desktop/mobile LHR 原始文件或对象存储位置、Lighthouse 版本、fetchTime。
- `browserSmoke`：Playwright/Chrome DevTools smoke 的日志、截图、trace 位置。

要求：

- PSI API 429、5xx、网络失败不能让整个审计无结果；必须降级为 Lighthouse fallback，并把 `psiStatus` 标为 `unavailable`。
- 原始 LHR 不应被 Artifact 摘要替代。Artifact 是归一化索引，原始文件是证据源。

### 4.3 `budgets`

默认 release budgets：

| Gate | 默认阈值 |
| --- | ---: |
| Performance score | `>= 0.9` |
| Accessibility score | `>= 0.95` |
| Best Practices score | `>= 1` |
| SEO score | `>= 1` |
| LCP | `<= 2500ms` |
| TBT | `<= 200ms` |
| CLS | `<= 0.1` |
| Console errors | `0` |
| Missing asset fallback | 404/410 non-HTML |

预算可按项目覆盖，但 Artifact 必须记录实际使用的预算。

### 4.4 `summary`

给人和系统快速判断用。

必填字段：

- `overallStatus`：`pass|fail|warning|error`。
- `releaseBlockerCount`
- `warningCount`
- `strategies`
- `categoryScores`
- `coreMetrics`
- `auditCoverage`

`auditCoverage` 必须包含每个 strategy 的 audit 总数和各状态计数。

### 4.5 `runs.<strategy>.categories`

每个 category 保留：

- `id`
- `title`
- `score`
- `auditRefCount`
- `auditRefs`：每个 ref 的 `id`、`weight`、`group`、`acronym`

这样可以重建 Lighthouse 原生分类，也能支持未来新增 category。

### 4.6 `runs.<strategy>.metrics`

统一保存可比较指标：

- FCP
- LCP
- Speed Index
- TBT
- CLS
- TTI
- TTFB/server response

字段建议：

```json
{
  "id": "largest-contentful-paint",
  "title": "Largest Contentful Paint",
  "value": 1620.123,
  "unit": "millisecond",
  "displayValue": "1.6 s",
  "rating": "good"
}
```

### 4.7 `runs.<strategy>.audits`

这是完整性最重要的部分。每一个 Lighthouse audit 都必须出现一次。

字段：

- `id`
- `title`
- `description`
- `score`
- `scoreDisplayMode`
- `displayValue`
- `numericValue`
- `numericUnit`
- `status`
- `categoryRefs`
- `detailsSummary`

状态映射：

| 状态 | 判定 |
| --- | --- |
| `pass` | `score === 1` |
| `fail` | `score === 0` |
| `partial` | `0 < score < 1` |
| `not_applicable` | `scoreDisplayMode === "notApplicable"` |
| `manual` | `scoreDisplayMode === "manual"` |
| `informative` | `score === null` 且不是 manual/notApplicable |
| `error` | 工具执行失败或 audit 数据缺失 |

`detailsSummary` 不需要复制完整 table/tree，但必须保留 detail 类型、item 数量、headings、关键 entity/URL 摘要。完整详情从 raw LHR 回查。

### 4.8 `customChecks`

用于补足 Google 原生审计没有覆盖或不够具体的上线验收项。

推荐子项：

- `deployment`
- `headers`
- `assetCache`
- `missingAssetFallback`
- `firstViewportRequests`
- `console`
- `sameOriginApi`
- `visualSmoke`
- `thirdPartyPolicy`

每个检查使用统一形态：

```json
{
  "status": "pass",
  "severity": "release|warning|info",
  "evidence": [],
  "recommendation": "optional"
}
```

### 4.9 `gates`

Gate 是发布判断，不等同于全部 audit。

字段：

- `release`：阻断发布的规则。
- `warnings`：不阻断但应进入优化 backlog 的规则。
- `overallStatus`

每个 gate：

```json
{
  "id": "mobile.performance",
  "status": "pass",
  "actual": 0.98,
  "expected": ">=0.9",
  "severity": "release",
  "source": "lighthouse"
}
```

### 4.10 `findings`

面向报告和 backlog。

- `blockers`：必须修复。
- `warnings`：建议优化。
- `passedHighlights`：通过亮点，不能省略。
- `manualReview`：需要人工确认。
- `informational`：非行动项。

每个 finding 必须包含：

- `id`
- `title`
- `status`
- `severity`
- `strategies`
- `evidence`
- `recommendation`

## 5. Human Report 结构

面向人读的 Markdown/HTML/PDF 报告建议如下：

1. Executive Summary
2. Gate Result
3. Desktop vs Mobile Scorecard
4. Core Web Vitals
5. Passed Audits
6. Failed/Warning Audits
7. Not Applicable / Manual / Informative Audits
8. Resource & Network Evidence
9. Deployment & Header Evidence
10. Recommendations
11. Raw Evidence Appendix

注意：第 5、7 节是“不要有缺漏”的关键。客户报告可以折叠展示，但数据层必须完整。

## 6. AstrologyWiki 样例摘要

本仓库提供的样例基于 `https://www.astrologywiki.com/` 2026-07-07 生产验收 LHR：

| Strategy | Performance | Accessibility | Best Practices | SEO | Audit count |
| --- | ---: | ---: | ---: | ---: | ---: |
| desktop | `0.90` | `1.00` | `1.00` | `1.00` | `160` |
| mobile | `0.98` | `1.00` | `1.00` | `1.00` | `160` |

Release blockers：`0`。
Warnings：

- desktop/mobile：`unused-css-rules`
- desktop：`unused-javascript`
- mobile：`unused-javascript` 为 partial opportunity
- desktop/mobile：`llms-txt`
- desktop/mobile：`network-dependency-tree-insight`
- desktop/mobile：`render-blocking-insight`

通过项示例：

- Accessibility `100`
- Best Practices `100`
- SEO `100`
- LCP/TBT/CLS release gate 通过
- 无首屏 console error
- 静态资源 immutable cache 生效
- 缺失 hashed asset 不返回 HTML fallback

## 7. 完整性校验

每次生成 Artifact 后必须校验：

1. `runs.desktop.audits.length === Object.keys(desktopLhr.audits).length`
2. `runs.mobile.audits.length === Object.keys(mobileLhr.audits).length`
3. 每个 category 的 `auditRefs` 都能在同 strategy 的 `audits` 中找到对应 id。
4. 每个 audit 都有 `status`。
5. `summary.auditCoverage` 的状态计数等于 audit 总数。
6. `gates.release` 中每条阻断规则都有实际值、阈值和来源。
7. raw source path/object key 可访问，或至少存在 checksum。
8. PSI API 失败时必须有 fallback 记录。

## 8. Diff 规则

两个 Artifact 做对比时，优先比较：

1. Release gate 是否从 pass 变 fail。
2. Performance/Accessibility/Best Practices/SEO 分数变化。
3. LCP/TBT/CLS/Speed Index 变化。
4. 新增 fail/partial audit。
5. 原本 pass 的 audit 变成 fail/partial。
6. JS/CSS/image/font 请求数与字节数变化。
7. 第三方 origin 变化。
8. Console error 变化。

建议阈值：

- Performance 分数下降 `>=0.05`：warning。
- LCP 增加 `>=300ms`：warning。
- TBT 增加 `>=100ms`：warning。
- CLS 增加 `>=0.05`：warning。
- Best Practices 或 SEO 从 `1.0` 下降：release blocker。

## 9. CI 使用示例

```bash
pagespeed-audit run \
  --url https://www.example.com/ \
  --strategy desktop,mobile \
  --budget performance=0.9 \
  --budget accessibility=0.95 \
  --budget best-practices=1 \
  --budget seo=1 \
  --out artifacts/pagespeed/homepage.json

pagespeed-audit gate artifacts/pagespeed/homepage.json
```

CI 输出原则：

- release blocker 用非 0 exit code。
- warning 用注释或 artifact 上传，不阻断。
- raw evidence 上传到构建产物，便于复核。

## 10. 后续实现建议

1. 增加 `scripts/pagespeed-audit/` CLI，负责 URL 规范化、PSI/Lighthouse 执行和 artifact 生成。
2. 增加后端任务表，支持批量 URL、排队、重试和历史趋势。
3. 增加报告页面，按 status/category/strategy/filter 展示完整 audit。
4. 增加 CI gate 命令，供 production deploy 前后验收。
5. 增加 artifact diff 命令，用于回归定位。
