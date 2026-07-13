// INPUT: public/en/wiki/author/*/index.html 生成作者页的首字节可见正文。
// OUTPUT: 作者真实性披露回归测试，确保无需执行 JavaScript 即可看到 editorial persona + AI-assisted。
// POS: 静态作者页 E-E-A-T/GEO 诚信守卫；若更新此文件，务必更新 tests/unit/FOLDER.md。

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const AUTHOR_ROOT = join(process.cwd(), "public", "en", "wiki", "author");

describe("generated author disclosure", () => {
  it("makes the editorial-persona and AI-assisted disclosure visible in raw HTML", () => {
    const missing: string[] = [];
    const authorIds = readdirSync(AUTHOR_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    expect(authorIds.length).toBeGreaterThan(0);

    for (const authorId of authorIds) {
      const html = readFileSync(
        join(AUTHOR_ROOT, authorId, "index.html"),
        "utf8",
      );
      const visibleMain = html.match(/<main>[\s\S]*?<\/main>/i)?.[0] || "";
      if (
        !/Editorial persona/i.test(visibleMain) ||
        !/AI-assisted/i.test(visibleMain)
      ) {
        missing.push(authorId);
      }
    }

    expect(missing).toEqual([]);
  });
});
