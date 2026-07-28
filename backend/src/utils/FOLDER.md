<!-- INPUT: 各 API endpoint / service 调用这些无状态工具函数（语言解析、响应封装、日志脱敏、Synthetica 归一）。 -->
<!-- OUTPUT: 导出纯工具函数与常量，无副作用、无 I/O，可独立单测。 -->
<!-- POS: backend 通用工具层。新增工具文件务必补文件头注释并登记到本 FOLDER.md。 -->

# backend/src/utils

后端无状态工具函数集合：语言解析、API 响应封装、日志 PII 脱敏、Synthetica 配置归一。纯函数、无副作用，覆盖单测。

## 文件清单

- `lang.ts`｜地位：语言解析器｜功能：`resolveLang(value, fallback='en')` 把 query/body 的 lang 收敛为 `'en'|'zh'`，所有 endpoint 共用，避免内联三元；`detectDominantLang(content)` 按内容 CJK/拉丁占比判主导语言（zh/en/null），供 AI 输出语言校验防止错语言被缓存。
- `currency.ts`｜地位：货币解析器｜功能：`resolveCurrencyFromRequest(req)` 按真实请求信号（`x-vercel-ip-country` 头优先，其次 `Accept-Language` 区域子标签，可选 `?currency=` 覆盖）派生 `SupportedCurrency`，USD 兜底；`countryToCurrency(cc)` 国家→货币映射（欧元区→EUR / GB→GBP / CN→CNY / 其余→USD）。Airwallex 计费端点共用。
- `apiResponse.ts`｜地位：API 响应封装｜功能：统一成功/错误响应信封（success/data/error/meta）。
- `sanitize-log.ts`｜地位：日志 PII 脱敏护栏｜功能：`SENSITIVE_FIELDS` 键集 + `sanitizeForLog(payload, fields)` 深克隆替换敏感字段为 `[redacted]`、不可变；机械执行隐私红线 #3「服务端日志不写原文」。供错误日志/监控 beforeSend 复用。
- `logger.ts`｜地位：结构化 logger｜功能：`createLogger({level})` 工厂 + 进程级默认 `logger`（级别读 `LOG_LEVEL` env，默认 info）。`error/warn/info/debug(msg, ctx?)` 输出一行 JSON `{level,msg,ts,...ctx}` 到对应 console sink；context 内部经 `sanitizeForLog` 兜底脱敏（隐私红线 #3 双保险），Error 展开为 `{name,message,stack}`。无新依赖，零冷启动崩溃。api/services/config/db/cache 与 index.ts 的运行时 console.* 已全量迁移至此；仅 `data/` 离线生成脚本保留 console（由 `__tests__/no-console-guard.test.ts` 显式豁免）。
- `syntheticaConfig.ts`｜地位：Synthetica 配置归一｜功能：`normalizeSyntheticaConfig` 把 planet/sign/house/aspect 的 id 映射为 label + tier。
- `dsarAudit.ts`｜地位：DSAR 合规审计（#26）｜功能：`logDsarEvent(event, userId)` / `dsarUserRef(userId)` 给数据导出/删除请求留一条结构化审计线，user 引用经 `hashInput` 哈希（不写明文鉴权 id，红线#3）。供 `api/auth.ts` 的 export-data / account delete 调用。

## 子目录

- `__tests__/`｜各工具的 vitest 单测（`sanitize-log.test.ts` / `syntheticaConfig.test.ts` / `logger.test.ts` / `no-console-guard.test.ts` / `dsar-audit.test.ts` / `lang.test.ts` 等）。

## 近期变更

- `lang.ts` 新增 `detectDominantLang`（AW-3）：合盘等 AI 输出偶发返回错语言（请求 zh 却回英文、且未自报 lang），原 `normalizeLocalizedContent` 用 fallback 标成 zh 并缓存进 zh key，污染整个 TTL。新 helper 按内容 CJK/拉丁占比判实际语言；`services/ai.ts` 在写缓存前比对，detected≠requested 时跳过缓存 + `logger.warn` 结构化告警（不重写 lang、不加重试，最小且安全）。TDD：`__tests__/lang.test.ts`（5 例：中/英/信号不足/仅取值不取键）。
- 新增 `dsarAudit.ts`（backlog #26）：DSAR 合规审计线。`api/auth.ts` 的 `/export-data` 与 `DELETE /account` 成功后调 `logDsarEvent`，记 `{event, userRef}`（userRef = `hashInput(userId).slice(0,16)`，不写明文鉴权 id，红线#3；logger 自带时间戳）。TDD：`__tests__/dsar-audit.test.ts`（4 例：确定性/非明文/差异化/payload 无原始 id）。客户端侧 `services/authClient.ts` 新增 `clearAllUserData`（删号清 synastry/CBT 等 PII localStorage，保留 consent/lang/theme；`tests/unit/clear-user-data.test.ts` 守卫）。
- console.* 收尾迁移（backlog #25 part 2）：运行时 `config/`(paypal/airwallex/stripe)、`db/supabase`、`cache/redis`、`index.ts` 共 10 处裸 console 迁到 `logger.*`（warn/info + 结构化 context，丢弃 emoji 前缀）。新增 `__tests__/no-console-guard.test.ts` 守卫：递归扫 backend/src，运行时代码禁裸 `console.X(`，显式豁免 4 个 `data/` 离线 CLI 生成脚本 + `logger.ts`。项目无 eslint，以零依赖 vitest 守卫替代「lint 禁 console」规则。
- 新增 `logger.ts`（backlog #25 part 1）：轻量结构化 logger（无新依赖，底层 console），级别 error/warn/info/debug + `LOG_LEVEL` env 开关，每条输出一行 JSON，context 经 `sanitizeForLog` 兜底脱敏（隐私红线 #3 双保险）、Error 展开为可读形状。`backend/src/api/**` + `backend/src/services/**` 的 153 处裸 console.* 全量迁移到 `logger.*`，高危 payload（error 对象 / req 上下文）在调用点亦走脱敏。TDD：`__tests__/logger.test.ts`（17 例：级别过滤 / 结构化 / PII 兜底 / message-only / sink 路由）。其余目录（`data/` codegen、`config/`、`index.ts` 等约 51 处）留作 part 2。
- 新增 `currency.ts`（backlog #13）：后端多货币 EUR/GBP 支持。`resolveCurrencyFromRequest` 从真实请求信号（IP 国家头 > Accept-Language 区域 > USD 兜底）派生货币，取代仅按 lang 的旧逻辑。配套 `airwallexService` 新增 `currencyKeyOf` / `resolvePriceIdWithFallback`（EUR/GBP price ID 未配置时回退 USD price ID + warn，绝不编造金额）。TDD：`__tests__/currency.test.ts`（24 例）+ `services/__tests__/airwallexCurrency.test.ts`（13 例）。
- 新增 `sanitize-log.ts`（backlog #10a）：补齐 CLAUDE.md 隐私红线 #3 引用但此前不存在的 `sanitizeForLog`/`SENSITIVE_FIELDS` 原语，TDD 10 用例覆盖嵌套/数组/birth.*整树/lat-lon/不可变/非PII放行。Sentry 监控 SDK 接线（#10b）延期。
- 首次为 utils/ 建立 FOLDER.md（此前缺失）。
