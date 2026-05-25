// INPUT: Vitest 配置（前端单元测试 runner）。
// OUTPUT: 定义前端 unit 测试 include 路径与运行环境，供 `npm test` 调用。默认 node 环境；组件测试（.tsx）用 per-file `// @vitest-environment jsdom` docblock 切换。
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
  },
});
