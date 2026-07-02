## 1. Specification and Data Model
- [x] 1.1 Add a migration for Airwallex-backed Pro trial claims, preferably `pro_trial_claims` keyed by normalized-email SHA-256.
- [x] 1.2 Add or update the user creation RPC so registration creates a free account without writing a future `users.trial_ends_at` and without inserting a new trial claim.
- [x] 1.3 Keep legacy `users.trial_ends_at` readable for existing active auto-trials only.
- [x] 1.4 Update DB/type definitions for the new trial claim fields/table.

## 2. Backend Trial Activation
- [x] 2.1 Add trial eligibility logic based on normalized email hash, existing active subscriptions, and Airwallex-backed trial claim history.
- [x] 2.2 Add an explicit trial activation API path, preferably `POST /api/airwallex/start-pro-trial`.
- [x] 2.3 Create Airwallex Billing Checkout subscriptions with `subscription_data.trial_ends_at = now + 7 days`.
- [x] 2.4 Ensure trial checkout uses normal plan price IDs and does not stack with first-subscription discount.
- [x] 2.5 Persist the Airwallex-backed trial claim only after checkout/subscription ownership is verified.
- [x] 2.6 Make confirm-checkout idempotent for trialing subscriptions.

## 3. Subscription State and Entitlements
- [x] 3.1 Map Airwallex `IN_TRIAL` to local `trialing`.
- [x] 3.2 Persist local subscription rows as `trialing` during the Airwallex trial period and `active` after paid conversion.
- [x] 3.3 Update webhook and reconciler paths so trial, active, unpaid, and cancelled states converge to the same local model.
- [x] 3.4 Update `entitlementServiceV2` so new Pro trial access derives from subscription state, not new `users.trial_ends_at` grants.
- [x] 3.5 Return trial eligibility and trial end metadata needed by frontend CTAs.

## 4. Frontend Experience
- [x] 4.1 Update UpgradeModal to show "start 7-day Pro trial" for eligible users and normal subscribe/renew flows otherwise.
- [x] 4.2 Route the trial CTA through the Airwallex trial activation API and success confirmation flow.
- [x] 4.3 Update PaymentSuccessPage to handle trial checkout success and refresh entitlements.
- [x] 4.4 Update PricingPage, Paywall, Settings, UserMenu, and related surfaces so copy no longer says registration automatically grants a trial.
- [x] 4.5 Add explicit payment-info, auto-renewal, and cancellation disclosure near trial CTAs in both English and Chinese.
- [x] 4.6 Keep UI changes aligned with `COLOR_SYSTEM_GUIDE.md` and existing component patterns.

## 5. Tests and Verification
- [x] 5.1 Add registration tests proving new accounts do not receive automatic Pro trial entitlement.
- [x] 5.2 Add trial eligibility tests for new users, users with Airwallex trial claims, active subscribers, and legacy auto-trial users.
- [x] 5.3 Add Airwallex service/API tests proving `subscription_data.trial_ends_at` is sent for trial checkout and omitted for immediate paid checkout.
- [x] 5.4 Add reconciler tests for `IN_TRIAL`, `ACTIVE`, `UNPAID`, and `CANCELLED`.
- [x] 5.5 Add entitlement tests proving `trialing` subscription grants Pro access and cancelled/expired trial does not.
- [x] 5.6 Add frontend tests for eligible trial CTA, disclosure copy, and post-checkout entitlement refresh.
- [x] 5.7 Run relevant backend tests, frontend typecheck/build, and targeted E2E checks for registration -> trial activation -> success. Backend tests/build, frontend `tsc --noEmit`, frontend build, targeted frontend/backend tests, OpenSpec validation, `git diff --check`, and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4300 npx playwright test tests/e2e/manual-pro-trial.spec.ts` passed. The Playwright E2E mocks third-party checkout through the redirect boundary; live Airwallex E2E still requires a credentialed provider environment.

## 6. Documentation
- [x] 6.1 Update `docs/PRD.md` trial and payment sections.
- [x] 6.2 Update any user-facing pricing copy generated from `data/pricing.ts` or constants.
- [x] 6.3 Include a PR "UI 规范符合说明" if implementation changes UI. PR-ready statement:
  - 本次 UI 变更仅扩展既有 UpgradeModal/Pricing/PaymentSuccessPage 订阅路径，未引入新的布局体系；继续复用 `Modal`、`ActionButton`、现有 pricing card 与 auth success page 模式。
  - 对照 `COLOR_SYSTEM_GUIDE.md`：试用 badge 使用既有语义 `success`，披露框使用 `gold` 边框与 `space/paper` 背景；未使用纯黑 `#000` 或纯白 `#fff`；文案在 dark/light 下使用 `star-*` / `paper-*` 文本层级。
  - 交互控件保持既有按钮状态、loading spinner、订阅管理/cancel 入口；试用 CTA 附近明确展示付款信息、自动续费、可取消披露，中英文文案齐备。
  - 没有新增 emoji 装饰或新的单色主题；新增视觉元素为小 badge 与披露文本块，符合当前组件节奏。
