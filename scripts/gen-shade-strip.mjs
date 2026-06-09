#!/usr/bin/env node
// gen-shade-strip.mjs — data-driven generator for "shade spectrum" infographic
// SVGs (one labeled swatch per shade + its meaning). Part of the reusable
// illustration toolkit: the executor side renders structural infographics that
// diffusion models can't (crisp text labels). General — feed any shade data.
//
// Usage: node scripts/gen-shade-strip.mjs --data scripts/plans/aura-shade-data.json --out public/images/aura
// Emits <out>/<key>-shades.svg for every color key in data.colors.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const dataPath = getArg('--data');
const outDir = getArg('--out') || 'public/images/aura';
const suffix = getArg('--suffix') || 'shades'; // emits <key>-<suffix>.svg
if (!dataPath) { console.error('❌ --data <data.json> required'); process.exit(2); }

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const W = 840, H = 286, MARGIN = 70, CY = 128;

function buildSvg(key, color, footnote) {
  const shades = color.shades;
  const n = shades.length;
  const usable = W - 2 * MARGIN;
  const cx = (i) => MARGIN + ((i + 0.5) * usable) / n;
  const ariaShades = shades.map((s) => s.name).join(', ');

  const defs = shades.map((s, i) =>
    `    <radialGradient id="${key}-${i}" cx="0.5" cy="0.45" r="0.62"><stop offset="0" stop-color="${esc(s.from)}"/><stop offset="1" stop-color="${esc(s.to)}"/></radialGradient>`
  ).join('\n');

  const cols = shades.map((s, i) => {
    const x = cx(i).toFixed(1);
    const lines = (s.lines || []).slice(0, 2).map((ln, j) =>
      `    <text x="${x}" y="${210 + j * 16}" font-family="Helvetica, Arial, sans-serif" font-size="12.5" fill="#9a93b5">${esc(ln)}</text>`
    ).join('\n');
    return `    <circle cx="${x}" cy="${CY}" r="30" fill="url(#${key}-${i})" filter="url(#${key}-soft)"/>
    <circle cx="${x}" cy="${CY}" r="23" fill="url(#${key}-${i})"/>
    <text x="${x}" y="186" font-size="17" fill="#f3effb">${esc(s.name)}</text>
${lines}`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(color.title)}: ${esc(ariaShades)}">
  <defs>
    <linearGradient id="${key}-panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16112c"/>
      <stop offset="1" stop-color="#0b0a1b"/>
    </linearGradient>
${defs}
    <filter id="${key}-soft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="22" fill="url(#${key}-panel)" stroke="#d4af6a" stroke-opacity="0.28"/>
  <text x="44" y="50" font-family="Georgia, 'Times New Roman', serif" font-size="23" fill="#efeaf8">${esc(color.title)}</text>
  <line x1="44" y1="68" x2="${W - 44}" y2="68" stroke="#d4af6a" stroke-opacity="0.18"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
${cols}
  </g>
  <text x="${W / 2}" y="262" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11.5" fill="#6f6890">${esc(footnote)}</text>
</svg>
`;
}

let count = 0;
for (const [key, color] of Object.entries(data.colors)) {
  const svg = buildSvg(key, color, data.footnote || '');
  const file = path.join(outDir, `${key}-${suffix}.svg`);
  fs.writeFileSync(file, svg);
  count++;
  console.log(`✓ ${file} (${color.shades.length} shades)`);
}
console.log(`\n✅ generated ${count} shade-strip SVGs`);
