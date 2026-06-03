<!-- INPUT: components/legal/PrivacyPolicy.tsx 的声明 + 后端/前端真实数据流（代码证据）。 -->
<!-- OUTPUT: 「隐私政策声明 vs 实际实现」差异审计，供法务以具体红线签字（backlog #9）。 -->
<!-- POS: trust 域合规文档。落地隐私页修改前由法务消费；本文件不修改 PrivacyPolicy.tsx（每处实质改动 gated 在法务 sign-off + 供应商合同事实）。 -->

# Privacy Policy — Claims vs. Actual Data Flows (Audit)

> **Backlog**: #9 `trust-privacy-policy-legal-review` · **Audit date**: 2026-06-03 · **Status**: code-grounded draft for legal review
>
> 目的：把隐私政策（`components/legal/PrivacyPolicy.tsx`，渲染 en + zh）的每条声明与代码里的真实数据流逐条对照，让法务拿着具体红线签字、而非从零审。**本审计不改隐私页**——隐私页的每处实质改动都需要法务 sign-off + 供应商合同事实（见下「需外部确认项」）。

## 执行摘要

- **25/33** 声明与代码一致。
- **2** 处声明与实现矛盾（删除时限、支付方 legacy）。
- **3** 处无法用代码验证、需外部事实（DeepSeek 训练留存、TLS 证书、定期安全评估）。
- **1** 处**自曝 template 文案**（lines 58–62），任何法务一眼会标记。
- **1** 处**红线#4 既存暴露**：synastry 真实姓名当前会进 LLM（DeepSeek）且其输出长期缓存于服务端——隐私页未披露，且与 CLAUDE.md 红线#4 矛盾。

## 阻断项（法务签字前必须解决）

| # | 问题 | 代码证据 | 建议 |
|---|---|---|---|
| 1 | **自曝 template**：政策正文写 "This privacy policy is provided as a compliance template. We recommend consulting with a qualified legal professional before relying on it for production use." | `PrivacyPolicy.tsx:58–62` | 删除该段。但**删除时机应与法务定稿同步**——在政策未经法务审定前，该免责声明反而是「诚实」的；先审定、再连同此段一起改。 |
| 2 | **AI 不留存训练**声明无法代码验证 | `services/ai.ts:16–18`（`DEEPSEEK_API_KEY`/BASE_URL）；出生数据/问题/CBT/synastry 全进 prompt | 取得 DeepSeek 签署的 DPA（明确：不留存训练、不用于改进其模型、响应后删除）。在此之前该声明无依据。 |
| 3 | **synastry 真名进 LLM**（红线#4 既存违规，独立于 #24） | `api/synastry.ts:177–188`（`buildSynastryPersonInfo` 含 name）；prompt 含 `nameA/nameB`；synastry 输出经 `CACHE_TTL.SYNASTRY=0` 永久缓存于服务端 | 二选一：**(A) 代码修**——prompt 入站前把姓名替换为 "Person A/B"（更隐私、更简单，推荐）；**(B) 政策披露**——明确「synastry 姓名会发送给 AI 供应商；可用别名」。注：仓库已有 `prompts/synastry-alias.test.ts` 与 `resolveSynastryName`，需核实别名机制是否真的生效、还是仍透传真名。 |

## 须更新（上线前）

| # | 政策声明（行） | 实际 | 建议 |
|---|---|---|---|
| 4 | 删除「within 30 days」(264–265) | `userService.deleteUser` 即时同步级联删除 | 改为「立即删除，法律/税务要求保留者除外」。 |
| 5 | AI 供应商写「third-party AI providers」(225) | 实为 DeepSeek（`services/ai.ts`） | 显式点名 DeepSeek + 链接其隐私政策 + 「供应商如变更将通知」。 |
| 6 | 支付方并列 Airwallex/PayPal/Stripe (213–217) | 仅 Airwallex 激活；Stripe/PayPal 为 legacy | 改为「当前支付方为 Airwallex；Stripe/PayPal 已退役」。 |

## 一致项（无需改，仅记录）

- 数据采集（邮箱/出生数据/用户内容）、自动采集（GA4 consent-gated）、不出售数据——与代码一致。
- 保留期：CBT 90 天（`api/cbt.ts:81 CBT_RETENTION_TTL`）、access token 15min / refresh 7d、缓存 TTL（natal/synastry 永久、transit 1d、AI 7d）——一致（建议政策**显式**写 CBT 90 天，当前是隐含）。
- 用户权利：**DSAR 已实现**——`GET /api/auth/export-data`（导出）+ `DELETE /api/auth/account`（删除，限流 + 邮箱用户需密码）+ `PUT /api/auth/profile`（更正）。隐私红线原语 `hashInput`(SHA-256 缓存键)、`sanitizeForLog`、analytics 脱敏均在位。
  - 注：「Right to Object / Restrict」政策承诺但无对应 endpoint（GDPR，可走人工流程 + 后续 backlog）。

## 需外部确认项（代码无法验证）

| 声明 | 需要的证据 | 状态 |
|---|---|---|
| AI 不留存训练 (225–230) | DeepSeek DPA | **未取得 — 阻断** |
| 传输加密 TLS/SSL (437) | 生产域 TLS 证书 / HTTPS-only 配置 | 基建侧核实 |
| 定期安全评估 (439) | pentest 报告或评估频率声明 | 提供证据或从政策删除 |

## 备注

- `docs/BEIAN_GUIDE.md` 在 origin/main **不存在**（别处未提交），本次无法对照；若涉及 BEIAN（备案）合规需后续单独核对。
- 本审计基于 2026-06-03 的 `origin/main` 代码。隐私页定稿后，应再跑一次对照确保无新漂移。
