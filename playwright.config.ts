// INPUT: Playwright E2E 测试运行时配置（基础 URL、浏览器项目、Web 服务器端口联动编排）。
// OUTPUT: 导出 Playwright 测试配置，驱动 tests/e2e 目录下的 spec 执行，并让 PLAYWRIGHT_BASE_URL 端口与 Vite dev server 保持一致。
// POS: E2E 测试编排入口。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { defineConfig, devices } from '@playwright/test';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL;

// Derive port for webServer from baseURL (defaults to Vite dev port 3000).
const portFromBaseURL = (() => {
  try {
    const parsed = new URL(baseURL);
    if (parsed.port) return Number(parsed.port);
    return parsed.protocol === 'https:' ? 443 : 80;
  } catch {
    return 3000;
  }
})();

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 0.0.0.0 --port ${portFromBaseURL}`,
    port: portFromBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
