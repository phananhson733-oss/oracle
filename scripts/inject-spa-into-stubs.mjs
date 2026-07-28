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
//      mounts on top of the static content and replaces it. Also tag the
//      <main> with data-seo-stub and drop a pre-hydration loading overlay
//      inside #root; both are scoped to data-seo-stub* and both disappear
//      the moment React mounts (createRoot replaces #root's children).
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

// Scoped fallback styling for the brief pre-hydration view. Every rule is
// namespaced under [data-seo-stub] - the attribute injectInto adds to the
// stub's <main>. React replaces #root's children on mount, so that <main>
// (these rules' only targets) disappears and the live SPA is never matched.
// This restores a presentable warm-paper editorial layout (light default,
// matching the SPA's paper/ink theme) for the moment before
// /assets/index-*.js hydrates, replacing the unstyled raw text that was left
// visible after step 2 strips the stub template's own <style>.
const STUB_FALLBACK_STYLE = `<style data-seo-stub-style>
    [data-seo-stub]{max-width:680px;margin:0 auto;padding:88px 24px 64px;font-family:Georgia,"Times New Roman","Songti SC",serif;color:#3A342B;line-height:1.65;-webkit-font-smoothing:antialiased;background:#F4EFE4}
    [data-seo-stub] h1{margin:0 0 14px;font-size:2rem;line-height:1.15;font-weight:500;letter-spacing:-.015em;color:#16130F}
    [data-seo-stub] p{margin:0 0 12px;font-size:1.05rem;color:#3A342B}
    [data-seo-stub] .meta{margin-top:22px;font-size:.85rem;color:#6B6053}
    [data-seo-stub] .cta{display:inline-block;margin-top:22px;padding:12px 24px;border-radius:2px;background:#16130F;color:#F4EFE4;font-family:ui-monospace,"SFMono-Regular",Menlo,monospace;font-size:.85rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;text-decoration:none}
    [data-seo-stub] .hero img{max-width:100%;height:auto;margin:8px 0 4px;border-radius:2px}
    [data-seo-stub] article.content{margin-top:20px}
    [data-seo-stub] article.content h2{margin:1.8rem 0 .6rem;font-size:1.4rem;font-weight:500;color:#16130F}
    [data-seo-stub] article.content h3{margin:1.5rem 0 .5rem;font-size:1.15rem;font-weight:500;color:#3A342B}
    [data-seo-stub] article.content blockquote{margin:1rem 0;padding-left:1rem;border-left:2px solid rgba(22,19,15,.30);color:#6B6053}
    [data-seo-stub] article.content li{line-height:1.65;color:#3A342B}
    [data-seo-stub] .safety-footer{margin-top:2.2rem;padding:1rem 1.1rem;border:1px solid rgba(22,19,15,.16);border-radius:2px;background:#FBF8F1;font-size:.88rem;color:#6B6053}
    [data-seo-stub-loader]{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#F4EFE4;font-family:Georgia,"Times New Roman",serif}
    [data-seo-stub-loader] .seo-stub-spinner{width:34px;height:34px;border-radius:9999px;border:2.5px solid rgba(22,19,15,.15);border-top-color:#9A7B3F;animation:seo-stub-spin .8s linear infinite}
    [data-seo-stub-loader] .seo-stub-loading-text{margin:0;font-size:.88rem;letter-spacing:.06em;color:#6B6053}
    body{background:#F4EFE4}
    body.dark{background:#16130F}
    body.dark [data-seo-stub]{background:#16130F;color:#CFC6B5}
    body.dark [data-seo-stub] h1,body.dark [data-seo-stub] article.content h2{color:#EDE6D8}
    body.dark [data-seo-stub] p,body.dark [data-seo-stub] article.content li{color:#CFC6B5}
    body.dark [data-seo-stub] .meta,body.dark [data-seo-stub] .safety-footer,body.dark [data-seo-stub] article.content blockquote{color:#9C9182}
    body.dark [data-seo-stub] .safety-footer{border-color:rgba(237,230,216,.16);background:#211C15}
    body.dark [data-seo-stub] .cta{background:#EDE6D8;color:#16130F}
    body.dark [data-seo-stub-loader]{background:#16130F}
    body.dark [data-seo-stub-loader] .seo-stub-spinner{border-color:rgba(237,230,216,.15);border-top-color:#C6A15E}
    body.dark [data-seo-stub-loader] .seo-stub-loading-text{color:#9C9182}
    @keyframes seo-stub-spin{to{transform:rotate(360deg)}}
  </style>`;

// Pre-hydration loading overlay. Sits inside #root, above the now-styled but
// content-mismatched stub <main>, so a real visitor sees a neutral warm-paper
// loading state instead of the SEO copy flashing before /assets/index-*.js
// mounts. createRoot().render() replaces #root's children on mount (see
// index.html), so this overlay and the stub <main> are removed together with
// zero residue, and it can never match the live SPA. Crawlers still read the
// <main> text straight from the raw DOM regardless of this visual overlay.
// Pre-paint theme restore for stubs — mirror of the index.html <body> script
// (and services/themeStorage.ts semantics): light is the brand default; only an
// explicit astro_theme_v2 === 'dark' flips the pre-hydration view to night.
// Without this, dark-opted users hard-refreshing any stub route saw a paper
// flash (loader + fallback + theme-color) until React mounted. The body.dark
// class also drives the dark overrides inside STUB_FALLBACK_STYLE above and the
// SPA's CSS variables once the Tailwind stylesheet loads.
const STUB_PREPAINT_SCRIPT =
  '<script>(function(){try{if(localStorage.getItem("astro_theme_v2")==="dark"){var c=document.body.classList;c.add("dark","bg-space-950","text-star-50");var m=document.querySelector(\'meta[name="theme-color"]\');if(m)m.setAttribute("content","#16130F");}}catch(e){}})();</script>';

const STUB_LOADER_HTML =
  '<div data-seo-stub-loader aria-hidden="true"><div class="seo-stub-spinner"></div><p class="seo-stub-loading-text">Loading...</p></div>';

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
  // 1. Wrap <main>…</main> in <div id="root"> so React mounts here (class
  //    mirrors dist/index.html `relative z-10` for layout parity), tag the
  //    <main> with data-seo-stub, and drop the loading overlay inside #root
  //    right after </main>. createRoot().render() replaces #root's children
  //    on mount, removing the stub <main> and the overlay in one step.
  next = next.replace(/<main\b([^>]*)>/, '<div id="root" class="relative z-10"><main$1 data-seo-stub>');
  next = next.replace(/(<\/main>)/, `$1${STUB_LOADER_HTML}</div>`);
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
  // 3. Inject the scoped [data-seo-stub] fallback <style> (presentable
  //    pre-hydration view), then the SPA shell's inline <style>, font-
  //    loading <script>, and asset tags just before </head>. Marker
  //    comment makes idempotent.
  next = next.replace(/<\/head>/, `\n${INJECTED_MARKER}\n${STUB_FALLBACK_STYLE}\n${payload}  </head>`);
  // 4. Pre-paint theme restore as the first child of <body>: flips explicit
  //    dark users to the night view before first paint (see STUB_PREPAINT_SCRIPT
  //    comment). Anchored to the </head>-adjacent <body> tag — a bare /<body/
  //    match would hit the literal "<body>" inside the font script's comment
  //    (injected into <head> by step 3) and splice the script mid-comment.
  next = next.replace(
    /(<\/head>\s*)<body([^>]*)>/,
    (_m, pre, attrs) => `${pre}<body${attrs}>${STUB_PREPAINT_SCRIPT}`,
  );
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

// Run the build step only when invoked directly
// (`node scripts/inject-spa-into-stubs.mjs`). When imported by a test
// harness, expose injectInto et al. without executing main()'s dist/ I/O.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { injectInto, extractSpaAssets, STUB_FALLBACK_STYLE, STUB_LOADER_HTML, STUB_PREPAINT_SCRIPT };
