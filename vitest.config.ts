// INPUT: Vitest 配置（前端单元测试 runner）。
// OUTPUT: 定义前端 unit 测试 include 路径与运行环境，供 `npm test` 调用。默认 node 环境；组件测试（.tsx）用 per-file `// @vitest-environment jsdom` docblock 切换。
// OUTPUT(cov): coverage(v8) 阈值/exclude，供 `npm run test:coverage` 出 text+lcov（backlog #17）。
// POS: 前端单测入口配置。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Default to node; individual tests stub their own window when needed
    // (analytics redaction + consent-gate tests install a globalThis.window stub).
    environment: "node",
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "services/**/*.test.ts",
      "services/__tests__/**/*.test.{ts,tsx}",
      "{hooks,src}/**/*.test.{ts,tsx}",
    ],
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Ratchet floors set just below the 2026-06-03 baseline (guards regressions
      // without flaky red); raise over time toward CLAUDE.md targets (core algos/
      // billing/auth 100%, normal 80%). See backlog #17.
      thresholds: {
        statements: 38,
        branches: 25,
        functions: 32,
        lines: 38,
      },
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js,mjs}",
        "tests/**",
        "dist/**",
        "scripts/**",
        "**/*.d.ts",
      ],
    },
  },
});
