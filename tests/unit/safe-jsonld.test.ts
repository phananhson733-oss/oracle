// INPUT: scripts/lib/safe-jsonld.mjs 的 safeJsonLd。
// OUTPUT: JSON-LD HTML 安全序列化的回归测试（</script> 突破、<>& 转义、行分隔符、往返）。
// POS: 守护 SEO 静态页 JSON-LD 注入不被 </script> 突破（存储型 XSS）。若改 safeJsonLd，同步此测试。

import { describe, it, expect } from "vitest";
import { safeJsonLd } from "../../scripts/lib/safe-jsonld.mjs";

describe("safeJsonLd", () => {
  it("含 </script> 的字段不再突破 script 标签", () => {
    const hostile = { name: "x</script><script>alert(1)</script>" };
    const out = safeJsonLd(hostile);
    expect(out.includes("</script>")).toBe(false);
    expect(/[<>]/.test(out)).toBe(false);
  });

  it("转义 < > & 为 unicode 转义序列", () => {
    const out = safeJsonLd({ a: "<", b: ">", c: "&" });
    expect(out).toContain("\\u003c");
    expect(out).toContain("\\u003e");
    expect(out).toContain("\\u0026");
  });

  it("转义行分隔符 U+2028 / U+2029", () => {
    const ls = String.fromCharCode(0x2028);
    const ps = String.fromCharCode(0x2029);
    const out = safeJsonLd({ bio: `line${ls}break${ps}para` });
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(out.includes(ls)).toBe(false);
    expect(out.includes(ps)).toBe(false);
  });

  it("输出仍是合法 JSON 且往返还原原值", () => {
    const schema = {
      "@type": "Person",
      name: "Elena <Vane> & co",
      topics: ["a&b", "c<d"],
    };
    const out = safeJsonLd(schema);
    expect(JSON.parse(out)).toEqual(schema);
  });
});
