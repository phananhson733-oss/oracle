<!-- INPUT: monitoring.ts 读 SENTRY_DSN/NODE_ENV，复用 utils/sanitize-log（sanitizeForLog/SENSITIVE_FIELDS）与 utils/logger。 -->
<!-- OUTPUT: 错误监控接线 API（initMonitoring / captureError / scrubEvent / isMonitoringActive）。 -->
<!-- POS: 后端可观测性目录。Sentry 仅在 SENTRY_DSN 配置时动态加载；新增监控相关文件登记于此并补文件头注释。 -->

# backend/src/observability

后端错误监控接线（backlog #10b）。Sentry SDK **仅在配置 `SENTRY_DSN` 时动态加载**，避免冷启动负重；所有出站事件经 `sanitizeForLog` 脱敏（隐私红线 #3 双保险）。无 DSN 时生产不初始化、不 mock。

## 文件清单

- `monitoring.ts`｜地位：错误监控原语｜功能：`initMonitoring()`（无 DSN 即 no-op 且不 `import` SDK，零冷启动成本）/ `captureError(err, ctx)`（context 经 `sanitizeForLog` 脱敏后作为 extra 上报，自身永不抛出）/ `scrubEvent`（Sentry `beforeSend`：extra/contexts 过 `sanitizeForLog`，丢弃 `request.data`/`cookies`/`authorization`/`cookie` 头，不可变）/ `isMonitoringActive()`。

## 子目录

- `__tests__/`｜`monitoring.test.ts`（6 例：scrubEvent 脱敏/不可变/缺字段、无 DSN no-op 契约）。

## 近期变更

- 新增 `monitoring.ts`（backlog #10b）：完成 #10 的错误监控部分（#10a 的 `sanitizeForLog` 已先行落在 `utils/`）。设计要点：SENTRY_DSN 未设时**零冷启动成本**（连动态 `import` 都不触发）；`index.ts` 在 `dotenv.config` 后 `await initMonitoring()`，并在路由尾部挂错误捕获中间件 `captureError(err, { method, path })` + `next(err)`——仅传非 PII 的 method/path，其余事件数据由 `scrubEvent`/`sanitizeForLog` 兜底脱敏。`tracesSampleRate=0`（仅错误捕获，无 APM）。
