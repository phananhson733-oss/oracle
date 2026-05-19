<!-- INPUT: vitest API + sibling service modules under test. -->
<!-- OUTPUT: Unit-test suites covering services consent-gating + buffer semantics. -->
<!-- POS: services 单元测试目录；若更新此文件，务必更新本头注释与 services/FOLDER.md。 -->

# 文件夹：services/__tests__

架构概要
- 用 vitest 覆盖 services 层中风险最高的 PII / 同意相关逻辑。
- node 环境，每个 test 自行 stub `window` / `gtag` / `localStorage`，无需 jsdom。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录测试目录架构与文件清单。
- analyticsConsentBuffer.test.ts｜地位：缓冲模块单元测试｜功能：覆盖 bufferUserId / bufferUserProperties / drain / clear / FIFO 上限。
- analytics.consent-gate.test.ts｜地位：同意网关行为测试｜功能：mock `../consent` + `window.gtag`，验证 setUserId/setUserProperties 在未同意时不调用 gtag、在同意时直发、updateConsentState 触发 flush / clear。

近期更新
- 初次创建，配合 fix(p0): gate setUserId / setUserProperties / initAnalytics on consent。
