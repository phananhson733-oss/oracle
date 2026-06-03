// INPUT: 递归读取 backend/src 下所有运行时 .ts 文件（排除测试 / logger 自身 / data 离线生成脚本）。
// OUTPUT: 一条守卫断言——运行时代码不得出现裸 console.* 调用，强制走结构化 logger。
// POS: backlog #25「加 lint 禁新 console.*」的零依赖实现（项目无 eslint）。新增运行时模块默认受守卫；
//      新增离线 CLI 生成脚本需登记进 EXEMPT_GENERATORS 并附理由。

import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, relative } from "path";
import { describe, it, expect } from "vitest";

// backend/src/utils/__tests__/ -> backend/src/
const SRC_DIR = fileURLToPath(new URL("../../", import.meta.url));

/**
 * 离线内容生成 CLI 脚本：console 输出是它们的预期 UX（手动 `node` 运行的进度报告），
 * 不属于请求/响应运行时路径，豁免守卫。新增此类脚本时在此登记并说明。
 */
const EXEMPT_GENERATORS = new Set([
  "data/generate-enhanced-reports.ts",
  "data/comprehensive-generate.ts",
  "data/fast-generate.ts",
  "data/populate-enhanced-data.ts",
]);

/** logger 自身的 console sink 是结构化日志的最终出口，豁免。 */
const EXEMPT_FILES = new Set(["utils/logger.ts"]);

/** 实际函数调用形式的 console，注释里出现的 `console.warn` 文案不匹配。 */
const CONSOLE_CALL = /console\.\w+\s*\(/;

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

/** 去掉块注释与行注释，避免注释里的 `console.x(...)` 触发误报。 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("no-console guard (backlog #25)", () => {
  it("runtime backend code uses the structured logger, not console.*", () => {
    const offenders: string[] = [];

    for (const file of listTsFiles(SRC_DIR)) {
      const rel = relative(SRC_DIR, file).split("\\").join("/");
      if (rel.includes("__tests__") || rel.endsWith(".test.ts")) continue;
      if (EXEMPT_FILES.has(rel) || EXEMPT_GENERATORS.has(rel)) continue;

      const code = stripComments(readFileSync(file, "utf-8"));
      code.split("\n").forEach((line, idx) => {
        if (CONSOLE_CALL.test(line)) {
          offenders.push(`${rel}:${idx + 1}  ${line.trim()}`);
        }
      });
    }

    expect(
      offenders,
      `Runtime console.* found — route through utils/logger instead:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
