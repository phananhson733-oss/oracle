// INPUT: 已生成的根页面与 public/{en,zh,landing-v2}/**/index.html 静态 SEO 页面。
// OUTPUT: hreflang 完整性回归测试，确保每个 alternate href 都对应实际生成的 HTML 文件。
// POS: 静态 SEO 产物守卫；若更新此文件，务必更新本头注释与 tests/unit/FOLDER.md。

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SITE_HOSTS = new Set(["astrologywiki.com", "www.astrologywiki.com"]);
const ALTERNATE_PATTERN =
  /<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["']/gi;

const collectIndexFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectIndexFiles(entryPath);
    return entry.isFile() && entry.name === "index.html" ? [entryPath] : [];
  });
};

const generatedFileForUrl = (href: string): string | null => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!SITE_HOSTS.has(url.hostname)) return null;
  const pathname = url.pathname.replace(/^\/+|\/+$/g, "");
  return pathname ? join(ROOT, "public", pathname, "index.html") : join(ROOT, "index.html");
};

const generatedHtmlFiles = () => [
  join(ROOT, "index.html"),
  ...collectIndexFiles(join(ROOT, "public", "en")),
  ...collectIndexFiles(join(ROOT, "public", "zh")),
  ...collectIndexFiles(join(ROOT, "public", "landing-v2")),
];

const normalizeUrl = (href: string): string => {
  const url = new URL(href);
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
};

describe("generated hreflang integrity", () => {
  it("never advertises a locale page that was not generated", () => {
    const missingTargets: string[] = [];

    for (const file of generatedHtmlFiles()) {
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(ALTERNATE_PATTERN)) {
        const targetFile = generatedFileForUrl(match[2]);
        if (targetFile && !existsSync(targetFile)) {
          missingTargets.push(
            `${relative(ROOT, file)} -> ${match[1]}:${match[2]}`,
          );
        }
      }
    }

    expect(missingTargets).toEqual([]);
  });

  it("only points at indexable, self-canonical locale pages", () => {
    const invalidTargets: string[] = [];

    for (const file of generatedHtmlFiles()) {
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(ALTERNATE_PATTERN)) {
        const targetFile = generatedFileForUrl(match[2]);
        if (!targetFile || !existsSync(targetFile)) continue;

        const targetHtml = readFileSync(targetFile, "utf8");
        const canonical = targetHtml.match(
          /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
        )?.[1];
        const robots = targetHtml.match(
          /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i,
        )?.[1];

        if (
          !canonical ||
          normalizeUrl(canonical) !== normalizeUrl(match[2]) ||
          /noindex/i.test(robots || "")
        ) {
          invalidTargets.push(
            `${relative(ROOT, file)} -> ${match[1]}:${match[2]}`,
          );
        }
      }
    }

    expect(invalidTargets).toEqual([]);
  });
});
