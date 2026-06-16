#!/usr/bin/env node
// gen-infographic.mjs — general data-driven SVG infographic generator for the
// reusable article-illustration system. Renders the text-bearing diagram kinds
// that diffusion models can't (crisp labels): "sequence", "compare", "timeline".
//
// Layout is MOBILE-FIRST and VERTICAL: items stack down a left-hand celestial
// "spine" so each item spans the full width and the text stays large relative to
// the canvas — on a ~340px phone (image shown full-width) the primary labels land
// ~10-11px instead of the ~3-4px a wide horizontal row would shrink to.
//
// Visual language: "celestial editorial" — deep indigo night panel with a seeded
// starfield + nebula glow, gold-foil medallion nodes, hand-drawn sparkle motifs,
// refined serif typography and a double gold frame. Everything is pure SVG shapes
// (no reliance on system astrology glyphs, which can tofu in end-user browsers).
//
// Bilingual: emits an EN and a ZH variant per inline image, named deterministically
// <slug>-i<index>-<lang>.svg so the wiring step (illustrate-article.mjs) finds them.
//
// Usage: node scripts/gen-infographic.mjs --plan scripts/plans/<plan>.json [--slug <slug>]

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const planPath = getArg('--plan');
const onlySlug = getArg('--slug');
if (!planPath) { console.error('❌ --plan <plan.json> required'); process.exit(2); }

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const outDir = path.resolve(process.cwd(), plan.imagesDir);
fs.mkdirSync(outDir, { recursive: true });

const W = 760; // fixed canvas width; vertical layouts keep text large at phone scale

// ---- text helpers ----------------------------------------------------------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isCjk = (ch) => /[　-鿿＀-￯]/.test(ch);
const charW = (ch, fs) => ch === ' ' ? fs * 0.3 : isCjk(ch) ? fs * 1.02 : fs * 0.53;
const strW = (s, fs) => [...String(s)].reduce((a, c) => a + charW(c, fs), 0);

function wrap(text, fontSize, maxW, maxLines = 2) {
  const s = String(text ?? '').trim();
  if (!s) return [];
  const units = /\s/.test(s) ? s.split(/(\s+)/) : [...s];
  const lines = [];
  let cur = '';
  for (let k = 0; k < units.length; k++) {
    const trial = cur + units[k];
    if (strW(trial, fontSize) > maxW && cur.trim()) {
      lines.push(cur.trim());
      if (lines.length === maxLines - 1) { cur = units.slice(k).join(''); break; }
      cur = units[k].trim() ? units[k] : '';
    } else {
      cur = trial;
    }
  }
  let rest = cur.trim();
  if (rest) {
    if (strW(rest, fontSize) > maxW) {
      let t = [...rest];
      while (t.length && strW(t.join('') + '…', fontSize) > maxW) t.pop();
      rest = t.join('') + '…';
    }
    lines.push(rest);
  }
  return lines.slice(0, maxLines);
}

// ---- deterministic RNG (stable starfield across regenerations) --------------
function makeRng(seed) {
  let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = 'Helvetica, Arial, sans-serif';
const C = { light: '#f3effb', soft: '#efeaf8', muted: '#a59cc0', faint: '#7b738f', gold: '#d4af6a', goldHi: '#f6e6bf' };

function sparkle(cx, cy, r, fill = C.gold, opacity = 1, thin = 0.16) {
  const t = r * thin;
  return `<path d="M ${cx} ${(cy - r).toFixed(1)} L ${(cx + t).toFixed(1)} ${(cy - t).toFixed(1)} L ${(cx + r).toFixed(1)} ${cy} L ${(cx + t).toFixed(1)} ${(cy + t).toFixed(1)} L ${cx} ${(cy + r).toFixed(1)} L ${(cx - t).toFixed(1)} ${(cy + t).toFixed(1)} L ${(cx - r).toFixed(1)} ${cy} L ${(cx - t).toFixed(1)} ${(cy - t).toFixed(1)} Z" fill="${fill}" opacity="${opacity}"/>`;
}

function starfield(uid, w, h) {
  const rnd = makeRng(uid + 'stars');
  const n = Math.min(80, Math.round((w * h) / 9000));
  const pts = [];
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (rnd() * (w - 24) + 12), y = (rnd() * (h - 24) + 12);
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.4 + rnd() * 1.3).toFixed(2)}" fill="#cfc8ea" opacity="${(0.12 + rnd() * 0.42).toFixed(2)}"/>`;
    if (rnd() > 0.87) pts.push([x, y]);
  }
  for (let i = 0; i < 5; i++) out += sparkle(16 + rnd() * (w - 32), 14 + rnd() * (h - 28), 2.4 + rnd() * 1.6, C.goldHi, 0.5 + rnd() * 0.3);
  if (pts.length > 2) {
    const d = pts.slice(0, 5).map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    out += `<path d="${d}" fill="none" stroke="${C.gold}" stroke-width="0.6" opacity="0.12"/>`;
  }
  return out;
}

function medallion(uid, x, y, r, inner) {
  return `<circle cx="${x}" cy="${y}" r="${(r + 5).toFixed(1)}" fill="url(#${uid}-glow)" opacity="0.5"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${uid}-foil)" stroke="${C.goldHi}" stroke-opacity="0.5" stroke-width="0.8"/>
    <circle cx="${x}" cy="${(y - r * 0.28).toFixed(1)}" r="${(r * 0.6).toFixed(1)}" fill="#ffffff" opacity="0.10"/>
    ${inner}`;
}

const defs = (uid) => `  <defs>
    <linearGradient id="${uid}-panel" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#1a1433"/><stop offset="0.55" stop-color="#120e26"/><stop offset="1" stop-color="#09081a"/>
    </linearGradient>
    <radialGradient id="${uid}-foil" cx="0.42" cy="0.34" r="0.75">
      <stop offset="0" stop-color="#fbf0d2"/><stop offset="0.5" stop-color="#e8c882"/><stop offset="1" stop-color="#b8923f"/>
    </radialGradient>
    <radialGradient id="${uid}-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.goldHi}"/><stop offset="1" stop-color="${C.goldHi}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${uid}-neb1" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#6f4bb0" stop-opacity="0.28"/><stop offset="1" stop-color="#6f4bb0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${uid}-neb2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.gold}" stop-opacity="0.16"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}-rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.gold}" stop-opacity="0"/><stop offset="0.5" stop-color="${C.gold}" stop-opacity="0.6"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

// Title height (so each renderer can size its canvas before drawing).
const headerLines = (title) => wrap(title, 22, W - 110, 2);
const headerTop = (title) => 64 + headerLines(title).length * 27;

function headerSvg(uid, title) {
  const lines = headerLines(title);
  const svg = lines.map((ln, i) =>
    `  <text x="${W / 2}" y="${46 + i * 27}" text-anchor="middle" font-family="${SERIF}" font-size="22" letter-spacing="0.4" fill="${C.soft}">${esc(ln)}</text>`
  ).join('\n');
  const ry = 46 + lines.length * 27 - 6, cx = W / 2;
  return `${svg}
  <line x1="${cx - 150}" y1="${ry}" x2="${cx - 12}" y2="${ry}" stroke="url(#${uid}-rule)" stroke-width="1"/>
  <line x1="${cx + 12}" y1="${ry}" x2="${cx + 150}" y2="${ry}" stroke="url(#${uid}-rule)" stroke-width="1"/>
  ${sparkle(cx, ry, 5, C.gold, 0.85)}`;
}

function frame(uid, h) {
  const c = 16;
  const corners = [[c, c], [W - c, c], [c, h - c], [W - c, h - c]].map(([x, y]) => sparkle(x, y, 3.2, C.gold, 0.4)).join('');
  return `  <rect x="1.5" y="1.5" width="${W - 3}" height="${h - 3}" rx="22" fill="url(#${uid}-panel)"/>
  <ellipse cx="${(W * 0.26).toFixed(0)}" cy="${(h * 0.24).toFixed(0)}" rx="${(W * 0.5).toFixed(0)}" ry="${(h * 0.34).toFixed(0)}" fill="url(#${uid}-neb1)"/>
  <ellipse cx="${(W * 0.82).toFixed(0)}" cy="${(h * 0.8).toFixed(0)}" rx="${(W * 0.44).toFixed(0)}" ry="${(h * 0.32).toFixed(0)}" fill="url(#${uid}-neb2)"/>
  ${starfield(uid, W, h)}
  <rect x="1.5" y="1.5" width="${W - 3}" height="${h - 3}" rx="22" fill="none" stroke="${C.gold}" stroke-opacity="0.34" stroke-width="1.2"/>
  <rect x="7" y="7" width="${W - 14}" height="${h - 14}" rx="17" fill="none" stroke="${C.gold}" stroke-opacity="0.12" stroke-width="0.8"/>
  ${corners}`;
}

function footnoteSvg(h, footnote) {
  if (!footnote) return '';
  const cx = W / 2, y = h - 22, half = strW(footnote, 11.5) / 2;
  return `\n  ${sparkle(cx - half - 12, y - 4, 2.6, C.gold, 0.5)}
  <text x="${cx}" y="${y}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="11.5" fill="${C.faint}">${esc(footnote)}</text>
  ${sparkle(cx + half + 12, y - 4, 2.6, C.gold, 0.5)}`;
}

const svgDoc = (uid, h, title, body, footnote) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(title)}">
${defs(uid)}
${frame(uid, h)}
${headerSvg(uid, title)}
${body}${footnoteSvg(h, footnote)}
</svg>
`;

// ---- kind: sequence (vertical list down a left spine) ----------------------
function renderSequence(uid, items, title, footnote) {
  const railX = 76, textX = 116, maxTextW = W - textX - 34;
  let y = headerTop(title) + 8;
  const rows = items.map((it) => {
    const subLines = wrap(it.sub, 15.5, maxTextW, 2);
    const h = 26 + subLines.length * 18 + 16;
    const r = { cy: y + 22, name: it.name, subLines, top: y, h };
    y += h;
    return r;
  });
  const H = y + 34;
  let body = `  <line x1="${railX}" y1="${rows[0].cy}" x2="${railX}" y2="${rows[rows.length - 1].cy}" stroke="${C.gold}" stroke-opacity="0.28" stroke-width="1.5"/>`;
  rows.forEach((r, i) => {
    const num = `<text x="${railX}" y="${(r.cy + 4.5).toFixed(1)}" text-anchor="middle" font-family="${SERIF}" font-size="13" font-weight="700" fill="#3a2c12">${i + 1}</text>`;
    body += `\n  ${medallion(uid, railX, r.cy, 15, num)}`;
    body += `\n  <text x="${textX}" y="${(r.top + 18).toFixed(1)}" font-family="${SERIF}" font-size="22" letter-spacing="0.3" fill="${C.light}">${esc(r.name)}</text>`;
    r.subLines.forEach((ln, j) => {
      body += `\n  <text x="${textX}" y="${(r.top + 40 + j * 18).toFixed(1)}" font-family="${SANS}" font-size="15.5" fill="${C.muted}">${esc(ln)}</text>`;
    });
  });
  return { svg: svgDoc(uid, H, title, body, footnote), W, H };
}

// ---- kind: timeline (vertical timeline down a left spine) -------------------
function renderTimeline(uid, items, title, footnote) {
  const railX = 92, textX = 132, maxTextW = W - textX - 34;
  let y = headerTop(title) + 10;
  const rows = items.map((it) => {
    const titleLines = wrap(it.title, 20.5, maxTextW, 2);
    const noteLines = wrap(it.note, 14.5, maxTextW, 3);
    const top = y, nodeY = y + 12;
    const h = 22 + titleLines.length * 21 + noteLines.length * 17 + 22;
    y += h;
    return { top, nodeY, label: it.label, titleLines, noteLines };
  });
  const H = y + 30;
  let body = `  <line x1="${railX}" y1="${rows[0].nodeY}" x2="${railX}" y2="${rows[rows.length - 1].nodeY}" stroke="${C.gold}" stroke-opacity="0.3" stroke-width="1.6"/>`;
  rows.forEach((r) => {
    body += `\n  ${medallion(uid, railX, r.nodeY, 8, sparkle(railX, r.nodeY, 4, '#3a2c12', 0.85))}`;
    body += `\n  <text x="${textX}" y="${(r.top + 17).toFixed(1)}" font-family="${SERIF}" font-size="19" font-weight="700" letter-spacing="0.4" fill="${C.goldHi}">${esc(r.label)}</text>`;
    let ty = r.top + 17 + 23;
    r.titleLines.forEach((ln, j) => { body += `\n  <text x="${textX}" y="${(ty + j * 21).toFixed(1)}" font-family="${SERIF}" font-size="20.5" fill="${C.light}">${esc(ln)}</text>`; });
    ty += r.titleLines.length * 21 + 2;
    r.noteLines.forEach((ln, j) => { body += `\n  <text x="${textX}" y="${(ty + j * 17).toFixed(1)}" font-family="${SANS}" font-size="14.5" fill="${C.muted}">${esc(ln)}</text>`; });
  });
  return { svg: svgDoc(uid, H, title, body, footnote), W, H };
}

// ---- kind: compare (stacked full-width cards; gold accent bar on the LEFT) --
// Layout unchanged from the original (name centered on top, lines below); the
// only change is the gold accent bar moved from a top horizontal strip to a
// left vertical stripe.
function renderCompare(uid, columns, title, footnote) {
  const M = 46, cardW = W - 2 * M;
  let y = headerTop(title) + 8;
  const cards = columns.map((col) => {
    const nameLines = wrap(col.name, 21, cardW - 44, 2);
    const lineBlocks = (col.lines || []).map((l) => wrap(l, 16, cardW - 64, 3));
    const h = 20 + nameLines.length * 24 + lineBlocks.reduce((a, b) => a + b.length * 19 + 10, 0) + 12;
    const r = { top: y, h, nameLines, lineBlocks };
    y += h + 26;
    return r;
  });
  const H = y - 26 + 34;
  let body = '';
  cards.forEach((c, i) => {
    body += `\n  <rect x="${M}" y="${c.top}" width="${cardW}" height="${c.h.toFixed(1)}" rx="14" fill="#1d1740" fill-opacity="0.5" stroke="${C.gold}" stroke-opacity="0.22" stroke-width="0.9"/>`;
    // gold accent bar on the LEFT edge (was a horizontal strip across the top)
    body += `\n  <rect x="${M}" y="${c.top}" width="3.5" height="${c.h.toFixed(1)}" rx="1.8" fill="${C.gold}" fill-opacity="0.6"/>`;
    body += `\n  ${sparkle(M + 1.75, c.top + 13, 3.4, C.goldHi, 0.7)}`;
    c.nameLines.forEach((ln, j) => {
      body += `\n  <text x="${W / 2}" y="${(c.top + 29 + j * 24).toFixed(1)}" text-anchor="middle" font-family="${SERIF}" font-size="21" font-weight="700" letter-spacing="0.3" fill="${C.light}">${esc(ln)}</text>`;
    });
    let ly = c.top + 29 + c.nameLines.length * 24 + 14;
    c.lineBlocks.forEach((wl) => {
      body += `\n  ${sparkle(M + 24, ly - 5, 3.2, C.gold, 0.8)}`;
      wl.forEach((ln, j) => { body += `\n  <text x="${M + 38}" y="${(ly + j * 19).toFixed(1)}" font-family="${SANS}" font-size="16" fill="${C.muted}">${esc(ln)}</text>`; });
      ly += wl.length * 19 + 10;
    });
    if (i < cards.length - 1) body += `\n  ${sparkle(W / 2, c.top + c.h + 13, 4.5, C.gold, 0.65)}`;
  });
  return { svg: svgDoc(uid, H, title, body, footnote), W, H };
}

// ---- per-lang projection of a bilingual inline spec ------------------------
function project(ins, lang) {
  const Cap = lang === 'zh' ? 'Zh' : 'En';
  const title = ins[`title${Cap}`];
  if (ins.kind === 'compare') return { kind: 'compare', title, columns: (ins.columns || []).map((c) => ({ name: c[`name${Cap}`], lines: c[`lines${Cap}`] || [] })) };
  if (ins.kind === 'timeline') return { kind: 'timeline', title, items: (ins.items || []).map((it) => ({ label: it[`label${Cap}`], title: it[`title${Cap}`], note: it[`note${Cap}`] })) };
  return { kind: 'sequence', title, items: (ins.items || []).map((it) => ({ name: it[`name${Cap}`], sub: it[`sub${Cap}`] })) };
}

const footnoteFor = (lang) => lang === 'zh' ? '自我反思框架，描述倾向而非预测' : 'A self-reflection framework — tendencies, not predictions';

let count = 0;
const slugs = Object.keys(plan.articles).filter((s) => !onlySlug || s === onlySlug);
for (const slug of slugs) {
  (plan.articles[slug].inline || []).forEach((ins, i) => {
    for (const lang of ['en', 'zh']) {
      const uid = `${slug.replace(/[^a-z0-9]/gi, '')}${i}${lang}`;
      const p = project(ins, lang);
      const foot = footnoteFor(lang);
      const r = p.kind === 'compare' ? renderCompare(uid, p.columns, p.title, foot)
        : p.kind === 'timeline' ? renderTimeline(uid, p.items, p.title, foot)
          : renderSequence(uid, p.items, p.title, foot);
      const file = path.join(outDir, `${slug}-i${i}-${lang}.svg`);
      fs.writeFileSync(file, r.svg);
      count++;
      console.log(`✓ ${path.basename(file)} (${p.kind}, ${r.W}x${r.H})`);
    }
  });
}
console.log(`\n✅ generated ${count} infographic SVGs in ${plan.imagesDir}`);
