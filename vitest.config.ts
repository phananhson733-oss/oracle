// INPUT: Vitest 配置（前端单元测试 runner）。
// OUTPUT: 定义前端 unit 测试 include 路径与运行环境，供 `npm test` 调用。
// POS: 前端单测入口配置。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "services/**/*.test.ts"],
    testTimeout: 10000,
  },
});
