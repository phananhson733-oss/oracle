<!-- INPUT: 各 API endpoint / service 调用这些无状态工具函数（语言解析、响应封装、日志脱敏、Synthetica 归一）。 -->
<!-- OUTPUT: 导出纯工具函数与常量，无副作用、无 I/O，可独立单测。 -->
<!-- POS: backend 通用工具层。新增工具文件务必补文件头注释并登记到本 FOLDER.md。 -->

# backend/src/utils

后端无状态工具函数集合：语言解析、API 响应封装、日志 PII 脱敏、Synthetica 配置归一。纯函数、无副作用，覆盖单测。

## 文件清单

- `lang.ts`｜地位：语言解析器｜功能：`resolveLang(value, fallback='en')` 把 query/body 的 lang 收敛为 `'en'|'zh'`，所有 endpoint 共用，避免内联三元。
- `currency.ts`｜地位：货币解析器｜功能：`resolveCurrencyFromRequest(req)` 按真实请求信号（`x-vercel-ip-country` 头优先，其次 `Accept-Language` 区域子标签，可选 `?currency=` 覆盖）派生 `SupportedCurrency`，USD 兜底；`countryToCurrency(cc)` 国家→货币映射（欧元区→EUR / GB→GBP / CN→CNY / 其余→USD）。Airwallex 计费端点共用。
- `apiResponse.ts`｜地位：API 响应封装｜功能：统一成功/错误响应信封（success/data/error/meta）。
- `sanitize-log.ts`｜地位：日志 PII 脱敏护栏｜功能：`SENSITIVE_FIELDS` 键集 + `sanitizeForLog(payload, fields)` 深克隆替换敏感字段为 `[redacted]`、不可变；机械执行隐私红线 #3「服务端日志不写原文」。供错误日志/监控 beforeSend 复用。
- `syntheticaConfig.ts`｜地位：Synthetica 配置归一｜功能：`normalizeSyntheticaConfig` 把 planet/sign/house/aspect 的 id 映射为 label + tier。

## 子目录

- `__tests__/`｜各工具的 vitest 单测（`sanitize-log.test.ts` / `syntheticaConfig.test.ts` 等）。

## 近期变更

- 新增 `currency.ts`（backlog #13）：后端多货币 EUR/GBP 支持。`resolveCurrencyFromRequest` 从真实请求信号（IP 国家头 > Accept-Language 区域 > USD 兜底）派生货币，取代仅按 lang 的旧逻辑。配套 `airwallexService` 新增 `currencyKeyOf` / `resolvePriceIdWithFallback`（EUR/GBP price ID 未配置时回退 USD price ID + warn，绝不编造金额）。TDD：`__tests__/currency.test.ts`（24 例）+ `services/__tests__/airwallexCurrency.test.ts`（13 例）。
- 新增 `sanitize-log.ts`（backlog #10a）：补齐 CLAUDE.md 隐私红线 #3 引用但此前不存在的 `sanitizeForLog`/`SENSITIVE_FIELDS` 原语，TDD 10 用例覆盖嵌套/数组/birth.*整树/lat-lon/不可变/非PII放行。Sentry 监控 SDK 接线（#10b）延期。
- 首次为 utils/ 建立 FOLDER.md（此前缺失）。
