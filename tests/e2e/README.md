# E2E Tests (Playwright)

End-to-end tests for the AstrologyWiki web app, powered by [Playwright](https://playwright.dev/).

## Prerequisites

```bash
# Install dependencies (from repo root)
npm install

# Install Chromium browser binary (one-time)
npx playwright install chromium
```

## Run locally

From the repo root:

```bash
# Headless run (auto-starts `npm run dev` if no server detected)
npm run test:e2e

# Interactive UI mode — best for authoring/debugging specs
npm run test:e2e:ui

# Run a single spec
npx playwright test tests/e2e/landing.spec.ts

# Run the manual Pro trial checkout path
npx playwright test tests/e2e/manual-pro-trial.spec.ts

# Show the last HTML report
npx playwright show-report
```

The Playwright config (`playwright.config.ts` at repo root) is wired with
`webServer.reuseExistingServer = true`, so if you already have `npm run dev`
running on port 3000, Playwright will reuse it.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PLAYWRIGHT_BASE_URL` | `http://localhost:3000` | Target origin for all `page.goto()` calls. Override to point tests at a preview deployment, e.g. `PLAYWRIGHT_BASE_URL=https://preview.example.com npm run test:e2e`. |
| `CI` | unset | When set, Playwright runs with 2 retries, 1 worker, the HTML reporter, and `forbidOnly`. |

## How to add a spec

1. Create a new `*.spec.ts` file in this directory.
2. Use Playwright's accessibility-first locator APIs — `page.getByRole`,
   `page.getByText`, `page.getByLabel` — rather than raw CSS selectors.
3. Default to the product's primary language (`en`) for any language-aware copy.
4. If the spec depends on work in another lane that isn't merged yet, wrap it
   with `test.fixme()` and leave a `TODO(Lane N): ...` comment so it's easy to
   un-skip later.
5. Run `npx playwright test --list` to confirm Playwright discovers the new
   spec, then `npx playwright test <file>` to execute it.

`birth-chart-calculator.spec.ts` additionally guards the Wiki CTA destination:
the standalone calculator must initialize, accept a selected city, submit the
privacy-safe natal payload, and render a chart result without runtime errors.

`wiki-growth-funnel.spec.ts` covers the acquisition side of the same journey:
consent-time page-view recovery, Wiki→tool event categories, module C click
attribution, wide-desktop brand/navigation separation and overflow, desktop/mobile
CTA geometry, and hydrated homepage SEO/FAQ parity.

## Convention reminders

- Specs should be hermetic — clean up any data they create.
- Don't import frontend source modules; treat the app as a black box.
- Prefer `expect.poll` / web-first assertions over arbitrary `waitForTimeout`.
- Keep specs small and focused. Split files by feature area.
- Payment specs should mock third-party checkout up to the redirect boundary;
  live provider E2E requires a dedicated credentialed environment.

## Reports and artifacts

`playwright-report/`, `test-results/`, and `playwright/.cache/` are
git-ignored (see `tests/e2e/.gitignore`). The HTML report opens with
`npx playwright show-report`.
