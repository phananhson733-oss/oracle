<!-- INPUT: add-api-bot-and-cost-gates 实施任务。 -->
<!-- OUTPUT: 可勾选任务清单。 -->
<!-- POS: add-api-bot-and-cost-gates 任务清单；若更新此文件，务必同步 proposal/design/spec。 -->
## 1. Specification

- [x] 1.1 Add `protect-api-costs` capability spec.
- [x] 1.2 Validate OpenSpec change with `openspec validate add-api-bot-and-cost-gates --strict`.

## 2. Backend Protection

- [x] 2.1 Add API noindex middleware for `/api/*`.
- [x] 2.2 Add bot-aware limiter for AI/cost-sensitive API routes.
- [x] 2.3 Harden GM routes with dev/admin secret checks and safer status output.

## 3. Crawl Policy

- [x] 3.1 Update `public/robots.txt` to keep public SEO paths open and explicitly disallow private/cost paths.

## 4. Verification

- [x] 4.1 Add tests for API noindex, bot-aware rate limiting, and GM gate behavior.
- [x] 4.2 Run targeted backend tests.
- [x] 4.3 Update this task list to completed items.
