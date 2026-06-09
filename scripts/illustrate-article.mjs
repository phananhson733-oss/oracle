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

// Wire hero image into the .ts: insert/replace top-level image + image_alt fields
// right after the `slug: "..."` line. Idempotent.
function setHero(slug, url, alt) {
  const file = path.join(articlesDir, `${slug}.ts`);
  let src = fs.readFileSync(file, 'utf8');
  // Strip any prior image/image_alt fields (idempotent), across every export object.
  src = src.replace(/\n  image: "[^"]*",(\n  image_alt: "[^"]*",)?/g, '');
  const fields = `  image: "${url}",\n  image_alt: ${JSON.stringify(alt)},\n`;
  // Insert after EVERY `slug: "<slug>",` line — bilingual files have an En and a Zh export.
  const re = new RegExp(`(\\n  slug: ${JSON.stringify(slug).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},\\n)`, 'g');
  if (!re.test(src)) throw new Error(`slug line not found in ${file}`);
  src = src.replace(re, `$1${fields}`);
  fs.writeFileSync(file, src);
  return (src.match(re) || []).length;
}

// Insert an inline image markdown line after a named heading in the content.
function insertInline(slug, heading, url, alt) {
  const file = path.join(articlesDir, `${slug}.ts`);
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes(`](${url})`)) return false; // already present
  const idx = src.indexOf(heading + '\n');
  if (idx < 0) throw new Error(`heading not found in ${file}: ${heading}`);
  const eol = idx + heading.length; // points at the '\n'
  const imgMd = `\n\n![${alt}](${url})`;
  src = src.slice(0, eol) + imgMd + src.slice(eol);
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
    const { prompt, reuse, alt } = spec.hero;
    let rasterSrc;
    if (reuse) {
      rasterSrc = path.resolve(repoRoot, reuse);
      if (!fs.existsSync(rasterSrc)) { failures.push(`${slug}: reuse not found ${reuse}`); continue; }
      log(`   hero: reuse ${reuse}`);
    } else if (prompt) {
      rasterSrc = path.join('/tmp', `illustrate-${slug}.png`);
      if (skipGen && fs.existsSync(rasterSrc)) {
        log('   hero: --skip-gen, using existing temp');
      } else {
        log('   hero: generating via gemini-web…');
        if (dryRun) { log('     [dry-run] skip gen'); }
        else if (!generate(prompt, rasterSrc)) { failures.push(`${slug}: hero generation failed`); continue; }
      }
    }
    if (!dryRun && rasterSrc) {
      const dest = optimize(rasterSrc, slug);
      const url = `${urlBase}/${slug}.jpg`;
      setHero(slug, url, alt);
      heroCount++;
      log(`   hero → ${url} (${Math.round(fs.statSync(dest).size / 1024)}KB), wired`);
    }
  }

  for (const ins of spec.inline || []) {
    if (dryRun) { log(`   inline: [dry-run] ${ins.url} after "${ins.afterHeading}"`); continue; }
    // copy src asset into imagesDir if it lives elsewhere
    if (ins.src) {
      const srcAbs = path.resolve(repoRoot, ins.src);
      const destAbs = path.join(imagesDir, path.basename(ins.url));
      if (path.resolve(srcAbs) !== path.resolve(destAbs)) fs.copyFileSync(srcAbs, destAbs);
    }
    const added = insertInline(slug, ins.afterHeading, ins.url, ins.alt);
    if (added) { inlineCount++; log(`   inline → ${ins.url} after "${ins.afterHeading}"`); }
    else log(`   inline: already present ${ins.url}`);
  }
}

log(`\n✅ done — heroes wired: ${heroCount}, inline added: ${inlineCount}`);
if (failures.length) {
  log(`⚠️  failures:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
