<!-- INPUT: Google PageSpeed/Lighthouse 审计结果、Core Web Vitals 阈值与站点上线验收经验。 -->
<!-- OUTPUT: 通用 PageSpeed 审计功能/模块 PRD，覆盖通过项、未通过项、数据模型、检测流程、验收标准与风险。 -->
<!-- POS: PageSpeed 审计模块产品需求文档；若更新此文件，务必更新本头注释与 docs/FOLDER.md。 -->

# PageSpeed Audit Module PRD

版本：v1.0
日期：2026-07-07
适用对象：任意公开 URL 的性能、可访问性、最佳实践、SEO 与可自动化质量审计。
参考来源：

- Google PageSpeed Insights API：<https://developers.google.com/speed/docs/insights/v5/get-started>
- PageSpeed Insights 说明：<https://developers.google.com/speed/docs/insights/v5/about>
- Lighthouse 概览：<https://developer.chrome.com/docs/lighthouse/overview>
- Lighthouse Performance scoring：<https://developer.chrome.com/docs/lighthouse/performance/performance-scoring>
- Web Vitals：<https://web.dev/articles/vitals>
- Google Search Core Web Vitals：<https://developers.google.com/search/docs/appearance/core-web-vitals>

## 1. 背景

Google PageSpeed Insights 与 Lighthouse 可以对页面质量做结构化审计，覆盖 lab performance、Core Web Vitals、Accessibility、Best Practices、SEO 以及持续扩展的 Lighthouse categories。我们已经用该审计路径完成 `https://www.astrologywiki.com/` 的生产优化与验收：

- Desktop Lighthouse：Performance `90` / Accessibility `100` / Best Practices `100` / SEO `100`
- Mobile Lighthouse：Performance `98` / Accessibility `100` / Best Practices `100` / SEO `100`
- Core gate：LCP、TBT、CLS 均达标
- 仍存在非阻断型优化机会：unused CSS、unused JavaScript、render-blocking insight、network dependency tree、llms.txt recommendations

现在需要把这套审计经验产品化为通用功能/模块，用于检测其他网站，并且不能只展示失败项；必须完整保留和呈现通过项、未通过项、部分得分项、不适用项、人工项与原始证据。

## 2. 目标

1. 支持输入任意公开 URL，分别执行 desktop 与 mobile 审计。
2. 同时采集 PageSpeed Insights API 数据与 Lighthouse lab 数据；API 配额不足时可降级为 Lighthouse CLI/worker。
3. 完整保存原始 payload，并生成稳定的归一化 artifact。
4. 输出通过、未通过、部分通过、不适用、人工复核五类审计结果。
5. 产出可比较的 scorecard、问题清单、机会清单、证据链和修复建议。
6. 支持批量 URL、定时复测、历史趋势、部署前后对比。
7. 支持把审计结果作为 CI gate、上线验收 gate 或客户报告。

## 3. 非目标

1. 不替代真实用户监控 RUM；模块只聚合 PSI/CrUX 与 lab audit。
2. 不承诺每次 Lighthouse 分数完全一致；必须记录运行环境和波动范围。
3. 不把所有 Lighthouse 机会项都视为发布阻断；必须区分 gate failure 与 optimization opportunity。
4. 不抓取需要登录、验证码、付款墙或 IP allowlist 的页面，除非后续单独支持 authenticated audit。

## 4. 用户与场景

| 用户 | 需求 | 场景 |
| --- | --- | --- |
| 工程负责人 | 判断发布是否损害性能/SEO | PR 合并前跑 desktop/mobile gate |
| SEO/增长 | 批量审计重点 landing pages | 每天检测 sitemap 中高流量 URL |
| 客户交付 | 输出审计报告 | 把通过项、失败项、证据、建议发给客户 |
| SRE/平台 | 监控长期趋势 | 分数下降或 Core Web Vitals 变差时告警 |
| 产品经理 | 决定优化优先级 | 按用户影响、修复成本、收益排序 backlog |

## 5. 审计范围

### 5.1 PageSpeed/Lighthouse 原生范围

模块 MUST 支持 Lighthouse 返回的所有 categories，而不是硬编码固定四类。当前常见类别包括：

- `performance`
- `accessibility`
- `best-practices`
- `seo`
- `pwa`（某些版本/配置）
- `agentic-browsing`（新版本 Lighthouse 可能出现）

模块 MUST 保存每个 category 的：

- id
- title
- score
- auditRefs
- 每个 auditRef 的 weight、group、acronym

模块 MUST 保存 `lighthouseResult.audits` 中每一个 audit，不得只保存失败 audit。

### 5.2 Core Web Vitals 与 lab metrics

核心指标：

| 指标 | Good | Needs improvement | Poor | 用途 |
| --- | ---: | ---: | ---: | --- |
| LCP | `<=2.5s` | `>2.5s` 且 `<=4s` | `>4s` | 加载体验 |
| INP | `<=200ms` | `>200ms` 且 `<=500ms` | `>500ms` | 交互体验，Field/RUM 优先 |
| CLS | `<=0.1` | `>0.1` 且 `<=0.25` | `>0.25` | 视觉稳定性 |

Lab 指标：

- FCP
- LCP
- TBT
- CLS
- Speed Index
- TTI
- TTFB / server response time

说明：

- PSI/CrUX 字段数据必须按 mobile 与 desktop 分开判断，并以 75th percentile 为主要口径。
- Lighthouse lab 中没有 INP，应使用 TBT 作为交互风险代理指标，不得把 TBT 等同于 INP。

### 5.3 补充站点级检查

Google 审计之外，模块 SHOULD 增加以下可自动化检查，作为报告增强项：

| 检查 | 目的 | 通过标准 |
| --- | --- | --- |
| HTML asset fingerprint | 确认当前 URL 使用期望版本 | HTML 中 JS/CSS 指纹匹配部署版本 |
| Hashed asset cache | 静态资源缓存 | `/assets/*` 为 `public, max-age=31536000, immutable` |
| Missing asset fallback | 防 SPA fallback 误返回 HTML | 缺失 `/assets/*.js` 返回 404/410，不是 `index.html` |
| First viewport requests | 防首屏加载非关键资源 | 首 3 秒无广告脚本、超大图、非必要 API/chunk |
| Console errors | 防 Best Practices 扣分 | 首屏无 browser console error |
| Same-origin API | 防 CORS/重定向错误 | 首屏 API 请求走当前 host 或明确 allowlist |
| Third-party script policy | 防广告/analytics 过早加载 | 未同意前不加载广告；analytics 延后/受 consent 约束 |
| Header policy | 安全与缓存 | HTTPS、CSP/Report-Only、HSTS、content-type 正确 |
| Visual smoke | 布局验收 | desktop/mobile 无横向溢出，hero/主 CTA 可见 |

## 6. 输入

### 6.1 单 URL 审计请求

```json
{
  "url": "https://www.example.com/",
  "strategies": ["desktop", "mobile"],
  "source": "manual|ci|schedule|api",
  "labels": ["homepage", "release-2026-07-07"],
  "expectedDeployment": {
    "gitSha": "optional",
    "assetFingerprints": ["optional"]
  },
  "budgets": {
    "performance": 90,
    "accessibility": 95,
    "bestPractices": 100,
    "seo": 100,
    "lcpMs": 2500,
    "tbtMs": 200,
    "cls": 0.1
  }
}
```

### 6.2 批量审计请求

```json
{
  "urls": [
    "https://www.example.com/",
    "https://www.example.com/pricing"
  ],
  "strategies": ["desktop", "mobile"],
  "schedule": "manual|daily|weekly|on_deploy",
  "concurrency": 2,
  "retryPolicy": {
    "maxAttempts": 2,
    "backoffSeconds": 120
  }
}
```

## 7. 输出

模块 MUST 生成两类输出：

1. **Machine artifact**：JSON，供存档、diff、CI、API 消费。
2. **Human artifact**：HTML，供评审、客户阅读和直接浏览；Markdown/PDF 可由 HTML 或 JSON 派生。

Machine artifact 详见：

- `docs/PAGESPEED_AUDIT_ARTIFACT.md`
- `docs/PAGESPEED_AUDIT_ARTIFACT.schema.json`
- `docs/PAGESPEED_AUDIT_ARTIFACT.astrologywiki.html`

## 8. 归一化状态模型

每个 audit MUST 被归入以下状态之一：

| 状态 | 判定 |
| --- | --- |
| `pass` | `score === 1` |
| `fail` | `score === 0` |
| `partial` | `0 < score < 1` |
| `informative` | `score === null` 且不是人工项 |
| `manual` | Lighthouse 标记为 manual 或无法自动判断 |
| `not_applicable` | audit 不适用于当前页面 |
| `error` | 工具执行失败或数据缺失 |

注意：`fail` 不等于发布阻断。发布阻断由 gate rules 决定；例如 `unused-css-rules` 可作为 optimization backlog，而 Performance `<90` 才是 release gate failure。

## 9. Gate 规则

默认 release gate：

| Gate | Desktop | Mobile | 阻断 |
| --- | ---: | ---: | --- |
| Performance | `>=90` | `>=90` | 是 |
| Accessibility | `>=95` | `>=95` | 是 |
| Best Practices | `100` | `100` | 是 |
| SEO | `100` | `100` | 是 |
| LCP | `<=2500ms` | `<=2500ms` | 是 |
| TBT | `<=200ms` | `<=200ms` | 是 |
| CLS | `<=0.1` | `<=0.1` | 是 |
| Console errors | `0` | `0` | 是 |
| Missing assets fallback | 404/410 non-HTML | 404/410 non-HTML | 是 |

默认 warning gate：

- unused CSS/JS
- render-blocking insight
- network dependency tree
- total byte weight 接近预算
- third-party requests 增长
- image optimization opportunities
- heading order、target size、contrast 等 accessibility 单项非 100 但总分仍达标
- llms.txt recommendations

## 10. 工作流

1. **Normalize URL**
   - 补全协议。
   - 跟随 canonical redirect，但记录原始 URL、最终 URL、redirect chain。
2. **Fetch HTML and headers**
   - 采集 status、content-type、cache-control、server、CSP、HSTS。
   - 抽取 JS/CSS/image/font/preconnect/preload。
3. **Run PageSpeed Insights API**
   - mobile 和 desktop 各一次。
   - 保存完整 PSI JSON。
   - 若 429/5xx，记录 `psiStatus=unavailable`，继续 Lighthouse fallback。
4. **Run Lighthouse**
   - desktop/mobile 各一次。
   - 保存完整 LHR JSON。
   - 归一化 categories、metrics、all audits。
5. **Run browser smoke**
   - Playwright 或等价无头浏览器。
   - 首 3 秒收集 request、console error、layout overflow、screenshot。
6. **Evaluate gates**
   - 分 release-blocking、warning、info。
   - 对每个失败 gate 绑定证据和修复建议。
7. **Generate report**
   - 摘要、通过/失败、完整 audit table、证据、建议、历史对比。
8. **Persist**
   - artifact JSON
   - raw payload references
   - screenshots
   - trace/devtools log references

## 11. API 设计

### 11.1 创建审计任务

`POST /api/audits/pagespeed`

```json
{
  "url": "https://www.example.com/",
  "strategies": ["desktop", "mobile"],
  "source": "manual",
  "budgets": {
    "performance": 90,
    "lcpMs": 2500
  }
}
```

响应：

```json
{
  "auditId": "psa_20260707_abc123",
  "status": "queued"
}
```

### 11.2 查询任务

`GET /api/audits/pagespeed/:auditId`

返回 artifact 摘要、状态与报告链接。

### 11.3 获取 artifact

`GET /api/audits/pagespeed/:auditId/artifact`

返回完整 JSON artifact。

## 12. 数据模型

建议表：

| 表 | 说明 |
| --- | --- |
| `pagespeed_audit_jobs` | URL、策略、状态、触发来源、运行时间 |
| `pagespeed_audit_runs` | 每个 strategy 的运行结果与环境 |
| `pagespeed_audit_artifacts` | 归一化 JSON、raw payload URI、screenshots |
| `pagespeed_audit_findings` | gate failure/warning/info 的可查询清单 |
| `pagespeed_audit_trends` | 分数与指标历史聚合 |

必须存储：

- URL 与 final URL
- audit timestamp
- Lighthouse version
- PSI API status
- user agent / throttling / screen emulation
- raw payload URI/hash
- category scores
- all audit statuses
- gate evaluation
- screenshots/traces URI

## 13. UI 报告结构

1. **Executive Summary**
   - Overall status：Pass / Warn / Fail / Inconclusive
   - desktop/mobile 总分
   - release gate 是否通过
2. **Core Web Vitals**
   - LCP / INP or TBT / CLS
   - Field vs Lab 分开展示
3. **Category Scorecards**
   - Performance、Accessibility、Best Practices、SEO、其他动态 category
4. **Release Blockers**
   - 只列阻断项
5. **Warnings / Opportunities**
   - 可优化但不阻断
6. **Passed Audits**
   - 必须可展开查看，不能省略
7. **Not Applicable / Informative / Manual**
   - 说明为什么不计入 gate
8. **Evidence**
   - request waterfall、headers、console、screenshots、raw payload links
9. **Recommendations**
   - P0/P1/P2，带 owner、预计收益、风险
10. **Historical Comparison**
   - 与上一次、baseline、目标预算对比

## 14. 修复建议生成规则

每个 finding SHOULD 包含：

```json
{
  "severity": "blocker|warning|info",
  "ownerHint": "frontend|backend|infra|content|seo|legal",
  "evidence": ["audit id", "metric", "request url", "screenshot"],
  "recommendedActions": [
    "具体动作，不写泛泛建议"
  ],
  "expectedImpact": {
    "metric": "LCP",
    "direction": "decrease",
    "confidence": "high|medium|low"
  },
  "risk": "low|medium|high"
}
```

## 15. 错误与降级

| 情况 | 行为 |
| --- | --- |
| PSI API 429 | 记录 `psiStatus=rate_limited`，继续 Lighthouse fallback |
| URL 非 200 | 记录 final status，Lighthouse 可继续但 gate 标记 fail |
| robots/noindex | SEO gate fail 或 warning，按页面类型决定 |
| SSL 错误 | Best Practices/security fail |
| 页面需要登录 | 标记 `inconclusive`，提示使用 authenticated profile |
| Lighthouse 超时 | 重试一次；仍失败则 artifact 状态 `error` |
| 分数波动 | 支持 `n=3` median mode，用于关键页面验收 |

## 16. 安全与隐私

- 不记录用户 cookie、Authorization header、支付信息。
- 默认不带登录态。
- artifact 中的 request URL 若包含 token/query secret，必须脱敏。
- 只允许审计 allowlist 域名，避免被滥用为开放扫描器。
- 对外部客户站点要限制并发和频率。

## 17. 验收标准

### 17.1 功能验收

- 输入一个公开 URL 后，能生成 desktop 与 mobile artifact。
- artifact 中每个 strategy 的 audit count 与 raw LHR `Object.keys(audits).length` 一致。
- 报告同时展示 failed、partial、passed、informative/not_applicable/manual。
- PSI API 429 时任务不失败，仍产出 Lighthouse artifact，并标记 PSI unavailable。
- 能区分 release blocker 与 optimization warning。
- 能保存截图、headers、first viewport request list。

### 17.2 质量验收

- 对 `https://www.astrologywiki.com/` 的最新生产结果应判定为 `pass_with_warnings`：
  - release gates 全部通过。
  - warnings 包括 unused CSS/JS、render-blocking insight、network dependency tree、llms.txt。
- 对故意缺失 hashed asset 的 URL 检查必须返回 non-HTML 404/410。
- 对有 console error 的页面必须生成 blocker。
- 对 noindex 首页必须生成 SEO blocker。

## 18. AstrologyWiki 审计基准样例

最新生产验收：

| Strategy | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Desktop | 90 | 100 | 100 | 100 | 1.6s | 0ms | 0 | Pass |
| Mobile | 98 | 100 | 100 | 100 | 1.9s | 0ms | 0 | Pass |

通过证据：

- `https://www.astrologywiki.com/` 已 alias 到 deployment `dpl_FeBaXokgor8bY6BkPGAbWxskLWu8`。
- HTML 资产：`/assets/index-hsOUIO8Z.js`、`/assets/index-5qBeSpJ1.css`、`/assets/react-vendor-CONxsY8T.js`。
- 首屏无 `/logo.png`、AdSense、`apiClient`、`/api/astro/today`、`HeroTodayCard` chunk。
- `/api/region` 为 `https://www.astrologywiki.com/api/region` 同源 200 JSON。
- Best Practices 相关项：无 console error、无 third-party cookies、CSP XSS audit pass、HTTPS pass。

非阻断 warning：

- `unused-css-rules`
- `unused-javascript`
- `render-blocking-insight`
- `network-dependency-tree-insight`
- `llms-txt`

完整机器样例见：

- `docs/PAGESPEED_AUDIT_ARTIFACT.astrologywiki.json`
- `docs/PAGESPEED_AUDIT_ARTIFACT.astrologywiki.html`

## 19. 后续路线

1. V1：单 URL 审计 + JSON artifact + Markdown report。
2. V2：批量 URL、历史趋势、CI gate。
3. V3：站点爬取、sitemap 导入、竞品对比。
4. V4：authenticated audit、RUM/GA4/Search Console 联动。
5. V5：自动生成修复 PR 或任务单。
