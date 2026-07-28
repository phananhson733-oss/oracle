// INPUT: newsletterWeekly(getOrCreateWeeklyIssue/isoWeekSlug) + supabase + gemini-web skill(bun) + 生产 Supabase env。
// OUTPUT: 为本 ISO 周的 newsletter_issues 生成 hero 头图（gemini-web）写入 public/newsletter/<slug>.png 并回填 hero_image_url。
// POS: 周报 hero 离线生产 CLI（best-effort，失败不阻断纯文本发送）。属 backend/scripts；更新请同步本头注释与 public/newsletter/FOLDER.md。
//
// 为什么是离线 CLI：gemini-web 需要浏览器/Google 会话，跑不进 Vercel serverless cron。
// 周报「内容/投递分离」——cron 每周自动生成+群发文本；hero 是富化层，由运营每周一发送前用本脚本生成。
//
// 用法：
//   预演(只读，不调 AI/不写库/不生图)：  cd backend && npx tsx scripts/generate-newsletter-hero.ts
//   生成并回填(创建本周 issue→生图→更新 hero_image_url)： cd backend && npx tsx scripts/generate-newsletter-hero.ts --apply
// 前置：backend/.env 的 SUPABASE_* 为目标环境；首次需在 gemini-web skill 完成 consent + 登录会话；本机需有 `bun`。
// 覆盖：GEMINI_WEB_SKILL=<main.ts 路径>、PUBLIC_SITE_URL=<站点根>。

import { execFileSync } from "node:child_process";
import { existsSync, statSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/db/supabase.js";
import {
  getOrCreateWeeklyIssue,
  isoWeekSlug,
  isoWeekRange,
} from "../src/services/newsletterWeekly.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const heroDir = join(repoRoot, "public", "newsletter");

const PUBLIC_SITE_URL = (
  process.env.PUBLIC_SITE_URL || "https://www.astrologywiki.com"
).replace(/\/$/, "");

// House style — oracle brand palette. Mirrors scripts/illustrate-article.mjs so
// the newsletter hero sits in the same visual family as the blog heroes.
const STYLE =
  "deep indigo-to-near-black palette (#0f0f1a deepening to #07060f), soft gold accents (#d4af37), teal-and-violet nebula wash, painterly editorial illustration, full-bleed wide 16:9 composition that fills the entire frame, ONE single continuous celestial landscape, no split screen, no diptych, no two panels, no diagram, no zodiac wheel, no framed card, no text or letters or numerals, no human faces";

function geminiSkillPath(): string {
  return (
    process.env.GEMINI_WEB_SKILL ||
    join(
      homedir(),
      ".claude",
      "skills",
      "baoyu-danger-gemini-web",
      "scripts",
      "main.ts",
    )
  );
}

function buildHeroPrompt(transitTitle: string, transitBody: string): string {
  const theme = transitBody.replace(/\s+/g, " ").trim().slice(0, 160);
  return `An atmospheric painterly editorial scene evoking this week's sky theme "${transitTitle}": ${theme} A serene cosmic landscape under a vast night sky, the celestial mood suggested through soft glowing forms woven into the scene, ${STYLE}`;
}

// Generate a raster image via the gemini-web skill (Google session). One retry.
function generateImage(skill: string, prompt: string, outPng: string): boolean {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      execFileSync("bun", [skill, "--prompt", prompt, "--image", outPng], {
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      // skill exits non-zero on "no image returned"; fall through to size check.
    }
    if (existsSync(outPng) && statSync(outPng).size > 5000) return true;
  }
  return false;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const now = new Date();
  const slug = isoWeekSlug(now);
  const outPng = join(heroDir, `${slug}.png`);
  const heroUrl = `${PUBLIC_SITE_URL}/newsletter/${slug}.png`;
  const skill = geminiSkillPath();

  console.log("─".repeat(72));
  console.log(
    `Newsletter hero  (week=${slug} [${isoWeekRange(now)}], mode=${apply ? "APPLY" : "DRY-RUN(只读)"})`,
  );
  console.log("─".repeat(72));

  if (!apply) {
    const { data } = await supabase
      .from("newsletter_issues")
      .select("content,hero_image_url")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) {
      console.log(
        "本周 issue 尚未生成。加 --apply 将先创建 issue（调 AI+写库）再生图。",
      );
    } else {
      const c = data.content ?? {};
      console.log(`已有 issue：${c.overview_title ?? "(无)"}`);
      console.log(
        `当前 hero_image_url：${data.hero_image_url ?? "(空，纯文本)"}`,
      );
      console.log("\n将使用的 hero prompt：");
      console.log(buildHeroPrompt(c.overview_title ?? "", c.overview ?? ""));
    }
    console.log(`\n目标文件：${outPng}`);
    console.log(`回填 URL：${heroUrl}`);
    console.log(`gemini-web skill：${skill}`);
    console.log("\n(预演结束，未生图/未写库。加 --apply 真正执行。)");
    return;
  }

  // APPLY: ensure the issue exists (creates + AI-generates this week's text once).
  const issue = await getOrCreateWeeklyIssue(now);
  if (!issue) {
    console.error("无法创建/读取本周 issue（AI 生成失败或缺字段）。终止。");
    process.exitCode = 1;
    return;
  }

  if (!existsSync(skill)) {
    console.error(`找不到 gemini-web skill：${skill}`);
    console.error("设 GEMINI_WEB_SKILL 指向 main.ts，或先安装该 skill。");
    console.error("（hero 是富化层；不生图也能纯文本发送，cron 不受影响。）");
    process.exitCode = 1;
    return;
  }

  mkdirSync(heroDir, { recursive: true });
  const prompt = buildHeroPrompt(
    issue.content.overview_title,
    issue.content.overview,
  );
  console.log(`issue：${issue.content.overview_title}`);
  console.log("生成中（gemini-web，需登录会话）…");

  const ok = generateImage(skill, prompt, outPng);
  if (!ok) {
    console.error(
      "\ngemini-web 未返回有效图像（会话失效 / 未登录 / consent 未通过）。",
    );
    console.error("hero 留空，本周仍会纯文本发送（best-effort，不阻断）。");
    process.exitCode = 1;
    return;
  }
  console.log(`hero 已生成：${outPng}`);

  const { error } = await supabase
    .from("newsletter_issues")
    .update({ hero_image_url: heroUrl })
    .eq("slug", slug);
  if (error) {
    console.error(`图已生成但回填 hero_image_url 失败：${error.message}`);
    console.error(
      `可手动设 newsletter_issues.hero_image_url='${heroUrl}'（slug=${slug}）。`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`已回填 hero_image_url = ${heroUrl}`);
  console.log("完成。下次 send-weekly-newsletter 将带 hero 发送。");
}

main().catch((err) => {
  console.error("脚本异常：", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
