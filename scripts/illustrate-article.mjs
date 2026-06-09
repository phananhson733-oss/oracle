#!/usr/bin/env node
// illustrate-article.mjs — plan-driven article illustration pipeline (reusable).
//
// Reads a plan JSON describing, per article slug, a context-derived hero image
// and/or inline images, then: (1) generates images via the gemini-web skill
// (Google session auth) with retry, or reuses/copies a pre-made asset (PNG/SVG),
// (2) optimizes raster images via `sips` (resize + JPEG), (3) wires them into the
// article .ts — hero into the `image`/`image_alt` fields, inline images as
// `![alt](url)` markdown inserted after a named heading in the content.
//
// This is the general capability; the Aura cluster is the first plan. To add a
// new batch, author a new plan JSON — no code change.
//
// Usage:
//   node scripts/illustrate-article.mjs --plan scripts/plans/<plan>.json [--slug <slug>] [--dry-run] [--skip-gen]
//
// Plan schema (see scripts/plans/aura-illustration-plan.json):
//   { imagesDir, urlBase, articlesDir, geminiSkill, optimize:{maxWidth,quality},
//     articles: { "<slug>": {
//       hero?:   { prompt?, reuse?, alt },          // prompt → generate; reuse → optimize that PNG
//       inline?: [ { afterHeading, src?, url, alt } ] // src copied into imagesDir if outside it
//     } } }

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (name) => args.includes(name);

const planPath = getArg('--plan');
if (!planPath) {
  console.error('❌ --plan <plan.json> required');
  process.exit(2);
}
const onlySlug = getArg('--slug');
const dryRun = hasFlag('--dry-run');
const skipGen = hasFlag('--skip-gen');

const repoRoot = process.cwd();
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const imagesDir = path.resolve(repoRoot, plan.imagesDir);
const articlesDir = path.resolve(repoRoot, plan.articlesDir || 'data/articles');
const urlBase = plan.urlBase.replace(/\/$/, '');
const maxWidth = plan.optimize?.maxWidth || 1280;
const quality = plan.optimize?.quality || 82;
const geminiSkill = plan.geminiSkill;

fs.mkdirSync(imagesDir, { recursive: true });

const log = (...m) => console.log(...m);
const sh = (file, argv) => execFileSync(file, argv, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

// Generate a raster image via the gemini-web skill (Google session). Retries.
function generate(prompt, outPng, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      sh('bun', [geminiSkill, '--prompt', prompt, '--image', outPng]);
    } catch {
      // skill exits non-zero on "no image returned"; fall through to size check
    }
    if (fs.existsSync(outPng) && fs.statSync(outPng).size > 20000) return true;
    log(`   ⚠️  gen attempt ${attempt}/${retries} produced no image; retrying`);
  }
  return false;
}

// Resize + convert to JPEG via macOS sips. Returns the dest path.
function optimize(srcPath, slug) {
  const dest = path.join(imagesDir, `${slug}.jpg`);
  sh('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality),
    '-Z', String(maxWidth), srcPath, '--out', dest]);
  return dest;
}

// Wire hero image into the .ts: insert top-level image + image_alt fields right
// after each `slug: "..."` line. Idempotent. Bilingual: the alt is localized per
// export object — a `...Zh` export gets altZh, every other export gets altEn.
function setHero(slug, url, altEn, altZh) {
  const file = path.join(articlesDir, `${slug}.ts`);
  let src = fs.readFileSync(file, 'utf8');
  // Strip any prior image/image_alt fields (idempotent), across every export object.
  src = src.replace(/\n  image: "[^"]*",(\n  image_alt: [^\n]*,)?/g, '');
  const slugLine = `\n  slug: ${JSON.stringify(slug)},\n`;
  let out = '', pos = 0, idx, count = 0;
  while ((idx = src.indexOf(slugLine, pos)) >= 0) {
    const end = idx + slugLine.length;
    // language of the enclosing export = nearest preceding `export const <name>:`
    const decls = [...src.slice(0, idx).matchAll(/export const (\w+)\s*:/g)];
    const name = decls.length ? decls[decls.length - 1][1] : '';
    const alt = name.endsWith('Zh') ? (altZh ?? altEn) : altEn;
    out += src.slice(pos, end) + `  image: "${url}",\n  image_alt: ${JSON.stringify(alt)},\n`;
    pos = end;
    count++;
  }
  out += src.slice(pos);
  if (count === 0) throw new Error(`slug line not found in ${file}`);
  fs.writeFileSync(file, out);
  return count;
}

// Insert an inline image markdown line after a named heading in the content.
function insertInline(slug, heading, url, alt) {
  const file = path.join(articlesDir, `${slug}.ts`);
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes(`](${url})`)) return false; // already present
  const idx = src.indexOf(heading + '\n');
  if (idx < 0) throw new Error(`heading not found in ${file}: ${heading}`);
  const afterHeading = idx + heading.length;
  // Insert at the END of this section (just before the next "## " heading) so the
  // image follows the section's prose/table rather than splitting a heading from
  // its content. Falls back to right-after-heading if no following heading.
  const nextH = src.indexOf('\n## ', afterHeading + 1);
  const insertAt = nextH >= 0 ? nextH : afterHeading;
  const imgMd = `\n\n![${alt}](${url})`;
  src = src.slice(0, insertAt) + imgMd + src.slice(insertAt);
  fs.writeFileSync(file, src);
  return true;
}

const slugs = Object.keys(plan.articles).filter((s) => !onlySlug || s === onlySlug);
let heroCount = 0;
let inlineCount = 0;
const failures = [];

for (const slug of slugs) {
  const spec = plan.articles[slug];
  log(`\n▶ ${slug}`);

  if (spec.hero) {
    const { prompt, reuse, alt, altEn, altZh } = spec.hero;
    let rasterSrc, ok = true;
    if (reuse) {
      rasterSrc = path.resolve(repoRoot, reuse);
      if (!fs.existsSync(rasterSrc)) { failures.push(`${slug}: reuse not found ${reuse}`); ok = false; }
      else log(`   hero: reuse ${reuse}`);
    } else if (prompt) {
      rasterSrc = path.join('/tmp', `illustrate-${slug}.png`);
      if (skipGen && fs.existsSync(rasterSrc)) {
        log('   hero: --skip-gen, using existing temp');
      } else if (dryRun) {
        log('   hero: [dry-run] skip gen');
      } else {
        log('   hero: generating via gemini-web…');
        if (!generate(prompt, rasterSrc)) { failures.push(`${slug}: hero generation failed`); ok = false; }
      }
    }
    // A hero failure must NOT skip the article's inline wiring.
    if (ok && !dryRun && rasterSrc) {
      const dest = optimize(rasterSrc, slug);
      const url = `${urlBase}/${slug}.jpg`;
      setHero(slug, url, altEn || alt, altZh || alt);
      heroCount++;
      log(`   hero → ${url} (${Math.round(fs.statSync(dest).size / 1024)}KB), wired`);
    }
  }

  (spec.inline || []).forEach((ins, i) => {
    // Bilingual SVG infographic: deterministic name <slug>-i<i>-<lang>.svg,
    // pre-generated by gen-infographic.mjs. EN goes after afterHeadingEn, ZH after afterHeadingZh.
    if (ins.afterHeadingEn || ins.afterHeadingZh) {
      for (const v of [
        { lang: 'en', heading: ins.afterHeadingEn, alt: ins.altEn },
        { lang: 'zh', heading: ins.afterHeadingZh, alt: ins.altZh },
      ]) {
        if (!v.heading) continue;
        const url = `${urlBase}/${slug}-i${i}-${v.lang}.svg`;
        if (dryRun) { log(`   inline[${i}/${v.lang}]: [dry-run] ${url} after "${v.heading}"`); continue; }
        if (!fs.existsSync(path.join(imagesDir, `${slug}-i${i}-${v.lang}.svg`))) {
          failures.push(`${slug}: missing svg ${slug}-i${i}-${v.lang}.svg (run gen-infographic.mjs)`); continue;
        }
        const added = insertInline(slug, v.heading, url, v.alt);
        if (added) { inlineCount++; log(`   inline → ${url} after "${v.heading}"`); }
        else log(`   inline: already present ${url}`);
      }
      return;
    }
    // Legacy single-language inline (e.g. the Aura plan).
    if (dryRun) { log(`   inline: [dry-run] ${ins.url} after "${ins.afterHeading}"`); return; }
    if (ins.src) {
      const srcAbs = path.resolve(repoRoot, ins.src);
      const destAbs = path.join(imagesDir, path.basename(ins.url));
      if (path.resolve(srcAbs) !== path.resolve(destAbs)) fs.copyFileSync(srcAbs, destAbs);
    }
    const added = insertInline(slug, ins.afterHeading, ins.url, ins.alt);
    if (added) { inlineCount++; log(`   inline → ${ins.url} after "${ins.afterHeading}"`); }
    else log(`   inline: already present ${ins.url}`);
  });
}

log(`\n✅ done — heroes wired: ${heroCount}, inline added: ${inlineCount}`);
if (failures.length) {
  log(`⚠️  failures:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
