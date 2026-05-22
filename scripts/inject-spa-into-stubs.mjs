// Post-build step that turns every SEO static stub HTML in dist/ into a
// progressively-enhanced page: crawlers still see the prerendered <main>
// content + JSON-LD, but real browsers also load the SPA bundle and React
// replaces the static content with the full app on mount.
//
// Why this exists:
//   vercel.json rewrites /(.*) → /index.html, but Vercel only applies a
//   rewrite when no file matches the requested path on disk. The stubs at
//   dist/<lang>/.../index.html DO exist, so they are served as-is and
//   trap users on a non-interactive page after a hard refresh. Without
//   this injector the only links out of the stub bring the user back to
//   itself (e.g. /en/wiki → static stub → CTA href="/en/wiki" → stub
//   again).
//
// What it does (per stub):
//   1. Locate <main>…</main>; wrap it in <div id="root">…</div> so React
//      mounts on top of the static content and replaces it.
//   2. Strip the stub template's inline <style> blocks from <head>. They
//      contain bare-selector rules (`main { max-width: 780px }`,
//      `a { color: ... }`, `body { ... }`) intended only for the static
//      fallback. After React renders the SPA, the SPA's own <main>/<a>
//      elements would still match those rules and visually narrow / re-
//      color the live app. Crawlers index text + schema, not visuals, so
//      removing fallback styling doesn't affect SEO.
//   3. Inject the Vite-emitted <script src="/assets/index-*.js">,
//      <link rel="modulepreload" href="/assets/react-vendor-*.js">, and
//      <link rel="stylesheet" href="/assets/index-*.css"> tags + the SPA
//      shell's inline <style> (carries --space-*/--star-* design tokens
//      Tailwind classes depend on) + the font-loading inline <script>,
//      all just before </head>.
//   4. Skip stubs that already contain the dedicated `<!-- spa-injected -->`
//      marker (idempotent — safe to run twice if a build pipeline re-runs
//      after partial failure).
//
// Anti-goals:
//   - Do not touch dist/index.html itself (that IS the SPA shell).
//   - Do not modify <head> JSON-LD, og: tags, hreflang, canonical, etc.
//   - Do not silently rewrite stubs that lack a <main> (fail loudly so a
//     future stub-template change surfaces here, not in production).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);
const distDir = join(rootDir, 'dist');
const spaShellPath = join(distDir, 'index.html');

// Patterns must be ordered by priority because de-duplication preserves
// first occurrence. ENTRY_SCRIPT_RE has to match exactly one tag — that
// tag is asserted-present below.
const ENTRY_SCRIPT_RE = /<script\b[^>]*\bsrc="\/assets\/index-[^"]+"[^>]*><\/script>/g;
const SPA_ASSET_PATTERNS = [
  ENTRY_SCRIPT_RE,
  /<script\b[^>]*\bsrc="\/assets\/[^"]+"[^>]*><\/script>/g,
  /<link\b[^>]*\brel="modulepreload"[^>]*>/g,
  /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="\/assets\/[^"]+"[^>]*>/g,
];

// SPA shell's <head> contains an inline <style> with the design-token
// CSS custom properties (--space-* / --star-*) that Tailwind classes like
// `bg-space-950` / `text-star-50` resolve against, plus the font-loading
// <script> that toggles body.fonts-loaded. Stubs ship without these, so
// SPA mounted on a stub would render unstyled. Inject them too.
const INLINE_STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style>/g;
const INLINE_FONT_SCRIPT_RE = /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?document\.fonts[\s\S]*?<\/script>/g;

const extractSpaAssets = (shellHtml) => {
  const headMatch = shellHtml.match(/<head>([\s\S]*?)<\/head>/);
  if (!headMatch) {
    throw new Error('SPA shell dist/index.html has no <head> — cannot extract bundle tags');
  }
  const head = headMatch[1];

  // Hard-assert entry script exists. If Vite ever changes its output
  // shape, fail loudly here instead of silently producing un-hydrated
  // stubs in production.
  const entryMatches = head.match(ENTRY_SCRIPT_RE);
  if (!entryMatches || entryMatches.length === 0) {
    throw new Error(
      'SPA shell <head> contains no <script src="/assets/index-...js"> — Vite output shape may have changed; injector needs update',
    );
  }

  const tags = [];
  for (const re of SPA_ASSET_PATTERNS) {
    const matched = head.match(re);
    if (matched) tags.push(...matched);
  }

  // Inline styles + font-loading inline script carry critical design
  // tokens. Order: styles first (defines CSS vars), then font script,
  // then asset tags (load late so they don't block parsing of the above).
  const styleBlocks = head.match(INLINE_STYLE_RE) || [];
  const fontScripts = head.match(INLINE_FONT_SCRIPT_RE) || [];

  // De-duplicate while preserving order.
  return {
    inlineStyles: Array.from(new Set(styleBlocks)),
    inlineScripts: Array.from(new Set(fontScripts)),
    assetTags: Array.from(new Set(tags)),
  };
};

const findStubs = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (entry === 'assets') continue; // skip bundled JS/CSS dir
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      findStubs(full, out);
    } else if (entry === 'index.html' && full !== spaShellPath) {
      out.push(full);
    }
  }
  return out;
};

// HTML comment marker we write ourselves on injection. Stubs containing
// it are guaranteed-injected by this script (not a false positive from
// some JSON-LD or article body that incidentally mentions "/assets/index-").
const INJECTED_MARKER = '<!-- spa-injected -->';

const injectInto = (html, payload) => {
  if (html.includes(INJECTED_MARKER)) {
    return { html, status: 'already-injected' };
  }
  if (!/<main\b[^>]*>/.test(html) || !/<\/main>/.test(html)) {
    return { html, status: 'no-main' };
  }
  if (!/<\/head>/.test(html)) {
    return { html, status: 'no-head-close' };
  }
  let next = html;
  // 1. Wrap <main>…</main> in <div id="root"> so React mounts here.
  //    class mirrors dist/index.html (relative z-10) for layout parity.
  next = next.replace(/(<main\b)/, '<div id="root" class="relative z-10">$1');
  next = next.replace(/(<\/main>)/, '$1</div>');
  // 2. Strip the stub template's inline <style> from <head>. Those rules
  //    use bare element selectors (e.g. `main { max-width: 780px }`,
  //    `a { color: ... }`, `body { ... }`) intended only for the static
  //    fallback view. After React mounts and the SPA renders its own
  //    <main>/<a>/etc., those rules would still match and visually
  //    narrow / re-color the live SPA. The SPA-shell's <style> we inject
  //    in step 3 carries the design-token CSS the SPA actually needs.
  //    Crawlers don't render visuals, so removing the static visual
  //    styling does not affect SEO indexing.
  next = next.replace(
    /<head>([\s\S]*?)<\/head>/,
    (_m, head) => `<head>${head.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '')}</head>`,
  );
  // 3. Inject SPA shell's inline <style>, font-loading <script>, and
  //    asset tags just before </head>. Marker comment makes idempotent.
  next = next.replace(/<\/head>/, `\n${INJECTED_MARKER}\n${payload}  </head>`);
  return { html: next, status: 'injected' };
};

const main = () => {
  const shellHtml = readFileSync(spaShellPath, 'utf8');
  const { inlineStyles, inlineScripts, assetTags } = extractSpaAssets(shellHtml);

  if (assetTags.length === 0) {
    throw new Error('extracted 0 SPA asset tags from dist/index.html');
  }
  if (inlineStyles.length === 0) {
    // The design-token <style> is non-optional — without it Tailwind
    // bg-space-*/text-star-* classes produce no color. Fail loudly.
    throw new Error(
      'SPA shell <head> has no inline <style> — design tokens (--space-*/--star-*) would be missing from injected stubs',
    );
  }

  // Ordering matters: styles first (define CSS vars), then font script
  // (toggles fonts-loaded class), then asset tags last.
  const payload =
    inlineStyles.map((s) => '    ' + s).join('\n') + '\n' +
    inlineScripts.map((s) => '    ' + s).join('\n') + '\n' +
    assetTags.map((t) => '    ' + t).join('\n') + '\n';

  console.log(
    `[inject-spa] extracted ${assetTags.length} asset tag(s), ` +
    `${inlineStyles.length} inline style block(s), ` +
    `${inlineScripts.length} inline script(s) from dist/index.html`,
  );

  const stubs = findStubs(distDir);
  console.log(`[inject-spa] found ${stubs.length} stub(s) under dist/`);

  const counts = { injected: 0, 'already-injected': 0, 'no-main': 0, 'no-head-close': 0 };
  for (const stub of stubs) {
    const before = readFileSync(stub, 'utf8');
    const { html, status } = injectInto(before, payload);
    counts[status] = (counts[status] || 0) + 1;
    if (status === 'injected') {
      writeFileSync(stub, html, 'utf8');
    } else if (status !== 'already-injected') {
      // Stubs without a <main> shouldn't exist — surface them so future
      // template changes don't silently disable progressive enhancement.
      console.warn(`[inject-spa] skip ${relative(rootDir, stub)} (${status})`);
    }
  }

  console.log('[inject-spa] summary:', counts);
  if (counts['no-main'] > 0 || counts['no-head-close'] > 0) {
    // Hard fail so CI / Vercel build catches a regression in the stub
    // template. Production deploys with traps would be worse than a build
    // failure.
    process.exit(1);
  }
};

main();
