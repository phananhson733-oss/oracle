<!-- INPUT: 各被测模块（如 services/analytics.ts）的纯函数与可隔离逻辑。 -->
<!-- OUTPUT: Vitest 单元测试集，验证敏感数据脱敏、纯函数边界、回归契约。 -->
<!-- POS: 前端 unit 测试目录。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# tests/unit

前端 unit 测试集合。通过根目录 `vitest.config.ts` 编排，运行 `npm test`。

## 文件清单

| 文件 | 职责 |
|---|---|
| `analytics-redaction.test.ts` | 验证 `trackApiError` / `redactErrorMessageForAnalytics` 对 PII-risk endpoint 的 `error_message` 做硬性 `[redacted]` 处理，防止 birthCity / 姓名等敏感字段流向 GA4（隐私红线 #1）。 |
