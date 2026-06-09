#!/usr/bin/env node
// gen-infographic.mjs — general data-driven SVG infographic generator for the
// reusable article-illustration system. Renders the text-bearing diagram kinds
// that diffusion models can't (crisp labels): "sequence", "compare", "timeline".
// Bilingual: emits an EN and a ZH variant per inline image, named deterministically
// <slug>-i<index>-<lang>.svg so the wiring step (illustrate-article.mjs) can find
// them without write-back.
//
// Shared visual system (matches the Aura infographics): deep indigo panel
// (#16112c->#0b0a1b), soft gold accents (#d4af6a), serif titles, muted body text.
//
// Usage: node scripts/gen-infographic.mjs --plan scripts/plans/<plan>.json [--slug <slug>]
// Reads plan.articles.<slug>.inline[] (the same plan illustrate-article.mjs wires).

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

// ---- helpers ---------------------------------------------------------------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isCjk = (ch) => /[　-鿿＀-￯]/.test(ch);
const charW = (ch, fs) => ch === ' ' ? fs * 0.3 : isCjk(ch) ? fs * 1.02 : fs * 0.53;
const strW = (s, fs) => [...String(s)].reduce((a, c) => a + charW(c, fs), 0);

// Wrap text to fit maxW (px). Word-wrap when spaces exist, else char-wrap (CJK).
// On the final allowed line, remaining text is kept whole and ellipsis-truncated.
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

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = 'Helvetica, Arial, sans-serif';
const C = { light: '#f3effb', soft: '#efeaf8', muted: '#9a93b5', faint: '#6f6890', gold: '#d4af6a' };

function panel(uid, W, H, title, bodySvg, footnote) {
  const foot = footnote
    ? `\n  <text x="${W / 2}" y="${H - 22}" text-anchor="middle" font-family="${SANS}" font-size="11.5" fill="${C.faint}">${esc(footnote)}</text>`
    : '';
  const titleLines = wrap(title, 21, W - 96, 2);
  const titleSvg = titleLines.map((ln, i) =>
    `  <text x="44" y="${46 + i * 26}" font-family="${SERIF}" font-size="21" fill="${C.soft}">${esc(ln)}</text>`
  ).join('\n');
  const dy = (titleLines.length - 1) * 26;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="${uid}-panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16112c"/><stop offset="1" stop-color="#0b0a1b"/>
    </linearGradient>
    <radialGradient id="${uid}-node" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#f6e6bf"/><stop offset="1" stop-color="#cda354"/>
    </radialGradient>
    <filter id="${uid}-soft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="22" fill="url(#${uid}-panel)" stroke="${C.gold}" stroke-opacity="0.28"/>
${titleSvg}
  <line x1="44" y1="${64 + dy}" x2="${W - 44}" y2="${64 + dy}" stroke="${C.gold}" stroke-opacity="0.18"/>
${bodySvg}${foot}
</svg>
`;
}

// ---- kind: sequence (row of numbered gold nodes, name above, sub below) -----
function renderSequence(uid, items, title, footnote) {
  const n = items.length;
  const big = n >= 7;
  const colW = big ? 124 : 142;
  const W = Math.max(840, 96 + n * colW);
  const H = 250;
  const nameSize = big ? 13 : 14.5;
  const subSize = big ? 10.5 : 11.5;
  const MARGIN = 60, usable = W - 2 * MARGIN, CY = 150;
  const cx = (i) => MARGIN + ((i + 0.5) * usable) / n;
  const axis = `  <line x1="${cx(0).toFixed(1)}" y1="${CY}" x2="${cx(n - 1).toFixed(1)}" y2="${CY}" stroke="${C.gold}" stroke-opacity="0.30"/>`;
  const cellW = usable / n - 14;
  const cells = items.map((it, i) => {
    const x = cx(i).toFixed(1);
    const nameLines = wrap(it.name, nameSize, cellW, 2);
    const nameSvg = nameLines.map((ln, j) =>
      `    <text x="${x}" y="${CY - 40 - (nameLines.length - 1 - j) * (nameSize + 2)}" font-family="${SERIF}" font-size="${nameSize}" fill="${C.light}">${esc(ln)}</text>`
    ).join('\n');
    const subLines = wrap(it.sub, subSize, cellW, 2);
    const subSvg = subLines.map((ln, j) =>
      `    <text x="${x}" y="${CY + 34 + j * (subSize + 3)}" font-family="${SANS}" font-size="${subSize}" fill="${C.muted}">${esc(ln)}</text>`
    ).join('\n');
    return `${nameSvg}
    <circle cx="${x}" cy="${CY}" r="17" fill="url(#${uid}-node)" filter="url(#${uid}-soft)" opacity="0.55"/>
    <circle cx="${x}" cy="${CY}" r="14" fill="url(#${uid}-node)"/>
    <text x="${x}" y="${CY + 4.5}" font-family="${SANS}" font-size="12" font-weight="700" fill="#2a2012">${i + 1}</text>
${subSvg}`;
  }).join('\n');
  const body = `${axis}\n  <g text-anchor="middle">\n${cells}\n  </g>`;
  return { svg: panel(uid, W, H, title, body, footnote), W, H };
}

// ---- kind: compare (2-3 cards, name header + bullet lines) ------------------
function renderCompare(uid, columns, title, footnote) {
  const n = columns.length;
  const W = n >= 3 ? 980 : 840;
  const H = 312;
  const MARGIN = 44, GAP = 22, top = 84;
  const cardW = (W - 2 * MARGIN - (n - 1) * GAP) / n;
  const cardH = H - top - (footnote ? 40 : 24);
  const cards = columns.map((col, i) => {
    const x = MARGIN + i * (cardW + GAP);
    const nameLines = wrap(col.name, 16, cardW - 28, 2);
    const nameSvg = nameLines.map((ln, j) =>
      `    <text x="${x + 16}" y="${top + 30 + j * 20}" font-family="${SERIF}" font-size="16" font-weight="700" fill="${C.light}">${esc(ln)}</text>`
    ).join('\n');
    let ly = top + 30 + nameLines.length * 20 + 14;
    const lineSvg = (col.lines || []).map((line) => {
      const wrapped = wrap(line, 12.5, cardW - 34, 3);
      const block = wrapped.map((ln, j) =>
        `    <text x="${x + (j === 0 ? 26 : 26)}" y="${ly + j * 17}" font-family="${SANS}" font-size="12.5" fill="${C.muted}">${esc(ln)}</text>`
      ).join('\n');
      const dot = `    <circle cx="${x + 17}" cy="${ly - 4}" r="2.4" fill="${C.gold}"/>`;
      ly += wrapped.length * 17 + 9;
      return `${dot}\n${block}`;
    }).join('\n');
    return `    <rect x="${x}" y="${top}" width="${cardW.toFixed(1)}" height="${cardH}" rx="14" fill="#ffffff" fill-opacity="0.035" stroke="${C.gold}" stroke-opacity="0.20"/>
    <rect x="${x}" y="${top}" width="${cardW.toFixed(1)}" height="4" rx="2" fill="${C.gold}" fill-opacity="0.55"/>
${nameSvg}
${lineSvg}`;
  }).join('\n');
  return { svg: panel(uid, W, H, title, cards, footnote), W, H };
}

// ---- kind: timeline (horizontal axis, dated markers) -----------------------
function renderTimeline(uid, items, title, footnote) {
  const n = items.length;
  const colW = n >= 7 ? 150 : 165;
  const W = Math.max(840, 80 + n * colW);
  const H = 300;
  const MARGIN = 56, usable = W - 2 * MARGIN, AY = 150;
  const cx = (i) => MARGIN + ((i + 0.5) * usable) / n;
  const cellW = usable / n - 12;
  const axis = `  <line x1="${MARGIN}" y1="${AY}" x2="${W - MARGIN}" y2="${AY}" stroke="${C.gold}" stroke-opacity="0.35"/>`;
  const cells = items.map((it, i) => {
    const x = cx(i).toFixed(1);
    const label = `    <text x="${x}" y="${AY - 30}" font-family="${SERIF}" font-size="14" font-weight="700" fill="${C.gold}">${esc(it.label)}</text>`;
    const titleLines = wrap(it.title, 13, cellW, 2);
    const titleSvg = titleLines.map((ln, j) =>
      `    <text x="${x}" y="${AY + 32 + j * 16}" font-family="${SERIF}" font-size="13" fill="${C.light}">${esc(ln)}</text>`
    ).join('\n');
    const noteY = AY + 32 + titleLines.length * 16 + 6;
    const noteLines = wrap(it.note, 11, cellW, 3);
    const noteSvg = noteLines.map((ln, j) =>
      `    <text x="${x}" y="${noteY + j * 14}" font-family="${SANS}" font-size="11" fill="${C.muted}">${esc(ln)}</text>`
    ).join('\n');
    return `${label}
    <circle cx="${x}" cy="${AY}" r="9" fill="url(#${uid}-node)" filter="url(#${uid}-soft)" opacity="0.6"/>
    <circle cx="${x}" cy="${AY}" r="6" fill="url(#${uid}-node)"/>
${titleSvg}
${noteSvg}`;
  }).join('\n');
  const body = `${axis}\n  <g text-anchor="middle">\n${cells}\n  </g>`;
  return { svg: panel(uid, W, H, title, body, footnote), W, H };
}

// ---- per-lang projection of a bilingual inline spec ------------------------
function project(ins, lang) {
  const Cap = lang === 'zh' ? 'Zh' : 'En';
  const title = ins[`title${Cap}`];
  if (ins.kind === 'compare') {
    const columns = (ins.columns || []).map((c) => ({ name: c[`name${Cap}`], lines: c[`lines${Cap}`] || [] }));
    return { kind: 'compare', title, columns };
  }
  if (ins.kind === 'timeline') {
    const items = (ins.items || []).map((it) => ({ label: it[`label${Cap}`], title: it[`title${Cap}`], note: it[`note${Cap}`] }));
    return { kind: 'timeline', title, items };
  }
  // sequence
  const items = (ins.items || []).map((it) => ({ name: it[`name${Cap}`], sub: it[`sub${Cap}`] }));
  return { kind: 'sequence', title, items };
}

const footnoteFor = (lang) => lang === 'zh'
  ? '自我反思框架，描述倾向而非预测。'
  : 'A self-reflection framework — tendencies, not predictions.';

let count = 0;
const slugs = Object.keys(plan.articles).filter((s) => !onlySlug || s === onlySlug);
for (const slug of slugs) {
  const inline = plan.articles[slug].inline || [];
  inline.forEach((ins, i) => {
    for (const lang of ['en', 'zh']) {
      const uid = `${slug.replace(/[^a-z0-9]/gi, '')}${i}${lang}`;
      const p = project(ins, lang);
      const foot = footnoteFor(lang);
      let r;
      if (p.kind === 'compare') r = renderCompare(uid, p.columns, p.title, foot);
      else if (p.kind === 'timeline') r = renderTimeline(uid, p.items, p.title, foot);
      else r = renderSequence(uid, p.items, p.title, foot);
      const file = path.join(outDir, `${slug}-i${i}-${lang}.svg`);
      fs.writeFileSync(file, r.svg);
      count++;
      console.log(`✓ ${path.basename(file)} (${p.kind}, ${r.W}x${r.H})`);
    }
  });
}
console.log(`\n✅ generated ${count} infographic SVGs in ${plan.imagesDir}`);
