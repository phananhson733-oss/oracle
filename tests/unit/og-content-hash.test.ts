// INPUT: scripts/generate-og-images.mjs 的 contentHash 导出。
// OUTPUT: OG 图幂等 hash 的契约测试（palette 感知失效 + 不可被 params 遮蔽 + 缓存键格式）。
// POS: palette 并入 hash 是本次换肤的缓存失效机制（否则旧暗色 OG 图永久驻留）；此测试钉死该机制。

import { describe, it, expect } from "vitest";
import { contentHash } from "../../scripts/generate-og-images.mjs";

const params = {
  title: "Saturn Return",
  byline: "A",
  category: "Astrology",
  isCjk: false,
  fontSize: 64,
};

describe("OG contentHash (palette-aware idempotency)", () => {
  it("is deterministic for identical params", () => {
    expect(contentHash(params)).toBe(contentHash({ ...params }));
  });

  it("changes when params change", () => {
    expect(contentHash(params)).not.toBe(
      contentHash({ ...params, title: "X" }),
    );
  });

  it("cannot be shadowed by a params.palette key", () => {
    expect(contentHash({ ...params, palette: "evil" })).toBe(
      contentHash(params),
    );
  });

  it("emits a 16-char hex cache key (cache filename contract)", () => {
    expect(contentHash(params)).toMatch(/^[0-9a-f]{16}$/);
  });
});
