<!-- INPUT: 项目配置与指南文档（含 PRD、Google OAuth、GA4/GTM 追踪配置与 PageSpeed 审计模块文档/HTML Artifact）。 -->
<!-- OUTPUT: 文档目录索引（含 Pro 试用/付费信息与 PageSpeed 审计模块 Artifact/HTML 报告更新记录）。 -->
<!-- POS: 文档目录索引；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 文件夹：docs

项目相关的配置手册与设置指南。

## 文件清单

- ANALYTICS_SETUP.md｜地位：追踪配置指南｜功能：说明如何获取并配置 GA4 与 GTM 凭据（含环境变量与验证步骤）。
- GA4_CONVERSIONS.md｜地位：GA4 配置指南｜功能：说明如何配置转化目标、受众群体与探索报告模板。
- UTM_SPEC.md｜地位：UTM 参数规范｜功能：定义 UTM 命名规范、参数含义与使用示例。
- UTM_TRACKING_SHEET.md｜地位：UTM 追踪表格说明｜功能：提供追踪表格模板结构与使用说明。
- META_AUDIT_CHECKLIST.md｜地位：Meta 标签审计清单｜功能：审计清单与优化指南。
- CWV_OPTIMIZATION.md｜地位：CWV 优化指南｜功能：Core Web Vitals 优化策略与实施。
- PROGRAMMATIC_SEO.md｜地位：程序化 SEO 指南｜功能：程序化页面设计与生成规范。
- CSP_DOMAIN_ALLOWLIST.md｜地位：CSP 域名清单｜功能：按 directive 分组的外部子资源域名 allowlist，供 backlog #8 重新启用 CSP 消费（含 Report-Only 实测步骤）。
- PRIVACY_AUDIT.md｜地位：隐私合规审计（#9）｜功能：隐私政策声明 vs 真实数据流逐条对照，列出阻断项（template 自曝、DeepSeek 训练 DPA、synastry 真名进 LLM）与需法务/供应商确认项，供 legal sign-off。
- GOOGLE_OAUTH_SETUP.md｜地位：OAuth 配置指南｜功能：说明如何配置 Google OAuth 登录功能（含凭据获取与重定向配置）。
- BACKUP_RUNBOOK.md｜地位：备份/恢复 runbook｜功能：数据存储拓扑、备份机制、RPO/RTO 目标、恢复步骤与待核验 TODO（backlog #21）；平台事实标 UNVERIFIED 须 dashboard 核实。
- PRD.md｜地位：产品需求文档｜功能：记录产品模块、商业模式、API、数据库 Schema 与用户旅程。
- PAGESPEED_AUDIT_PRD.md｜地位：PageSpeed 审计模块 PRD｜功能：定义基于 Google PageSpeed/Lighthouse 的通用审计功能、完整审计范围、Gate 规则、数据模型与验收标准。
- PAGESPEED_AUDIT_ARTIFACT.md｜地位：PageSpeed 审计 Artifact 规格｜功能：定义机器 JSON 与人工报告结构，要求完整保留通过、失败、部分、不适用、人工与信息项。
- PAGESPEED_AUDIT_ARTIFACT.schema.json｜地位：PageSpeed 审计 Artifact JSON Schema｜功能：约束通用审计模块输出结构，供 CI、API 与落库校验。
- PAGESPEED_AUDIT_ARTIFACT.astrologywiki.json｜地位：PageSpeed 审计样例 Artifact｜功能：基于 AstrologyWiki 生产 desktop/mobile Lighthouse 结果生成的完整样例，覆盖两端各 160 个 audit。
- PAGESPEED_AUDIT_ARTIFACT.astrologywiki.html｜地位：PageSpeed 审计 HTML Artifact｜功能：可直接用浏览器打开的 AstrologyWiki 审计报告，包含总览、分数、Gate、发现、自定义检查和全量 audit 过滤表。
- FOLDER.md｜地位：目录索引文档｜功能：记录 docs 目录下的文件清单。

## 近期更新

- PRD v2.47 同步 Pro 试用新流程：注册后默认 Free，符合资格用户需手动点击试用并在 Airwallex 填写付款信息，到期自动续费。
- BACKUP_RUNBOOK 将 `pro_trial_claims` 纳入 Postgres 备份/恢复表清单，避免 Airwallex-backed Pro 试用领取历史恢复遗漏。
- 新增 PageSpeed 审计模块 PRD、Artifact 规格、JSON Schema、AstrologyWiki 生产 JSON 样例与可直接浏览的 HTML 报告，作为后续通用网站审计功能的产品与数据契约。
