#!/usr/bin/env node
/**
 * TC1 — Universal page-chrome contract  (Tier 1 · GH #298)
 * ----------------------------------------------------------------------------
 * Asserts every published, chrome-bearing .html wires in the shared site chrome
 * via one of two sanctioned patterns, AND (per #418) that every in-scope page
 * carries a SITE_INDEX entry with a non-empty note plus a static, JS-independent
 * description signal (AI-scannability). A page that forgets the chrome, is
 * absent from SITE_INDEX, or ships with no static description turns this red and
 * blocks the merge.
 *
 * CONTRACT (per in-scope page) — all must hold:
 *   1. loads data.js                      <script src="…/data.js">
 *   2. loads components/HomeShell.jsx      (the chrome component itself)
 *   3. loads components/Wordmark.jsx       (chrome dependency)
 *   4. loads components/Primitives.jsx     (chrome dependency)
 *   5. has a chrome anchor — at least one of:
 *        app-shell    : <div id="root">
 *        content-page : <div id="topnav-mount"> AND <div id="footer-mount">
 *   6. SITE_INDEX completeness (#418) — window.SITE_INDEX has an entry for this
 *        page (join key "/" + rel; homepage also accepted under "/") AND its
 *        `note` is a NON-EMPTY string. Denominator = this same in-scope set —
 *        Jeremy's ruling (2026-07-08, closed): NO exempt list; a missing entry
 *        is always an error. Omission is never the exemption idiom — genuine
 *        exemptions live in the data (e.g. status:retired, rendered with a
 *        "retired · archived" stamp) or as an explicit future @ignores amendment
 *        when a truly note-less page is introduced. Presence + non-emptiness
 *        only — the note TEXT stays editorial (#403).
 *   7. Static description present & non-empty (#418 addendum, Jeremy 2026-07-08)
 *        — AI-scannability: the page carries static copy readable without JS.
 *        At least ONE non-empty static description signal must exist:
 *          - <meta name="description">      content, OR
 *          - <meta property="og:description"> content, OR
 *          - a non-empty element carrying a "lead" class token.
 *        PRESENCE CHECK, NOT verbatim-match: the SITE_INDEX note and the page
 *        description are authored independently and intentionally differ in
 *        wording (#403) — drift is allowed; ABSENCE is the error. The exact
 *        signal set is [Confidence: Medium · Inferred] from the written addendum.
 *
 *   8. Favicon present (#434) — the <head> carries a <link> whose rel token
 *        list includes "icon" (rel="icon"; "shortcut icon" also qualifies, since
 *        rel is a space-separated token list — [Confidence: Medium · Inferred]
 *        from the written spec's rel="icon"). PRESENCE ONLY: href value, icon
 *        format, and resolution are not asserted. Root cause per #434 was
 *        exemplar-drift (pages authored from recent-article exemplars, not
 *        _template.html); this assertion makes the CONTRACT, not the exemplar,
 *        the canon.
 *
 * SCOPE: every *.html under the repo, MINUS
 *   - templates/partials whose basename starts with "_"  (as check-links does)
 *   - the EXEMPT set below (stable; rarely changes)
 *   In-scope membership is discovered DYNAMICALLY. The test never asserts a page
 *   count — adding pages is the whole point, so a count would be stale at once.
 *
 * OUT OF SCOPE (owned elsewhere):
 *   - subnav / breadcrumb presence        → TC3 (#300)
 *   - that script srcs RESOLVE            → check-links CI
 *   - SITE_INDEX key → file exists (inverse join) → tc-routes (#334)
 *   - _SITE_BASE correctness              → component-internal
 *   - rendered-DOM / runtime mount        → Tier 4 (#306)
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. data.js loaded under a
 * window shim (as tc-routes/tc2 do) to READ SITE_INDEX at run time — the
 * implementation is never inspected to author the assertions. Mirrors
 * .github/scripts/check-links.mjs. Run directly or via tests/run.mjs.
  *
 * @covers: * (every in-scope page — universal chrome + SITE_INDEX entry/non-empty note + static description presence + favicon link presence)
 * @ignores: subnav / breadcrumb presence — owned: #300
 * @ignores: script-src resolution — owned: Tier-0 check-links
 * @ignores: SITE_INDEX key → file exists (inverse join) — owned: #334
 * @ignores: SITE_INDEX note TEXT / page description WORDING — editorial (#403)
 * @ignores: favicon href TARGET / icon format / resolution — presence only; asset choice is the human's (#403)
 * @ignores: rendered-DOM / runtime mount — runtime / Tier 4 (#306)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();

// Stable exemptions (repo-relative). Three buckets:
//   template  : design-system/index.html  (the _-prefixed templates auto-skip)
//   data-entry: checkin.html, agents/house/house-entry.html
//   inactive  : canon.html, inventory.html  (deactivated backends)
const EXEMPT = new Set([
  'design-system/index.html',
  'checkin.html',
  'agents/house/house-entry.html',
  'canon.html',
  'inventory.html',
]);

// src="…/<fname>" as a full path segment — so "data.js" does NOT match
// "spirit-data.js". Any relative depth is fine (data.js, ../data.js, …).
const loadsFile = (html, fname) =>
  new RegExp(`src\\s*=\\s*["'](?:[^"']*/)?${fname.replace(/\./g, '\\.')}["']`, 'i').test(html);
const hasDiv = (html, id) =>
  new RegExp(`id\\s*=\\s*["']${id}["']`, 'i').test(html);

// data.js under a window shim (same pattern as tc-routes / tc2). READ only.
function loadWindow(path) {
  const win = {};
  new Function('window', readFileSync(join(ROOT, path), 'utf8'))(win);
  return win;
}

// SITE_INDEX join (#418): "/" + rel; the homepage may be keyed "/" and a
// directory index under its dir. Robust to both without asserting a convention.
function siEntry(SI, rel) {
  const cands = ['/' + rel];
  if (rel === 'index.html') cands.push('/');
  if (rel.endsWith('/index.html')) cands.push('/' + rel.slice(0, -'index.html'.length));
  for (const c of cands) if (SI && Object.prototype.hasOwnProperty.call(SI, c)) return SI[c];
  return undefined;
}

// Static description signals (#418 addendum) — presence, not wording.
// Attribute order is not assumed: scan each <meta> tag independently.
function metaContent(html, key, attr) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (!new RegExp(`${attr}\\s*=\\s*["']${key}["']`, 'i').test(tag)) continue;
    const c = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (c && c[1].trim()) return true;
  }
  return false;
}
// A non-empty element carrying a "lead" class token (term-of-art lead paragraph).
function hasLead(html) {
  const re = /<(\w+)\b[^>]*class\s*=\s*["'][^"']*\blead\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[2].replace(/<[^>]*>/g, '').trim()) return true;
  }
  return false;
}
const hasStaticDescription = (html) =>
  metaContent(html, 'description', 'name') ||
  metaContent(html, 'og:description', 'property') ||
  hasLead(html);

// Favicon (#434): a <link> whose rel token list includes "icon" ("shortcut
// icon" qualifies; apple-touch-icon alone does not). Scanned within <head>
// per the spec ("every published page head includes rel=icon"); href/format
// not asserted — presence only.
function hasFavicon(html) {
  const head = html.split(/<\/head\s*>/i)[0] ?? html;
  for (const tag of head.match(/<link\b[^>]*>/gi) || []) {
    const m = tag.match(/rel\s*=\s*["']([^"']*)["']/i);
    if (m && m[1].toLowerCase().trim().split(/\s+/).includes('icon')) return true;
  }
  return false;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === '.git') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html') && !e.startsWith('_')) out.push(p);
  }
  return out;
}
const exists = (p) => { try { statSync(p); return true; } catch { return false; } };

const r = makeReport('tc1-page-chrome');
const SITE_INDEX = loadWindow('data.js').SITE_INDEX;

// Data-shape vacuity guard: a silent SITE_INDEX regression must not pass green.
r.check(SITE_INDEX && typeof SITE_INDEX === 'object' && Object.keys(SITE_INDEX).length > 0,
  'window.SITE_INDEX missing or empty in data.js (extraction or data shape regressed)');

// Stale-exempt guard: a renamed/removed exempt file must not silently shrink
// coverage — fail loud so EXEMPT gets updated.
for (const e of EXEMPT) {
  r.check(exists(join(ROOT, e)), `exempt path no longer exists: ${e} (update EXEMPT)`);
}

let inScope = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  if (EXEMPT.has(rel)) continue;
  inScope++;
  const html = readFileSync(file, 'utf8');
  r.check(loadsFile(html, 'data.js'),            `${rel}: missing data.js`);
  r.check(loadsFile(html, 'HomeShell.jsx'),      `${rel}: missing components/HomeShell.jsx`);
  r.check(loadsFile(html, 'Wordmark.jsx'),       `${rel}: missing components/Wordmark.jsx`);
  r.check(loadsFile(html, 'Primitives.jsx'),     `${rel}: missing components/Primitives.jsx`);
  const appShell   = hasDiv(html, 'root');
  const contentPage = hasDiv(html, 'topnav-mount') && hasDiv(html, 'footer-mount');
  r.check(appShell || contentPage,
    `${rel}: no chrome anchor (need #root or topnav-mount+footer-mount)`);

  // #418 — SITE_INDEX entry present with a non-empty note (text stays editorial).
  const entry = siEntry(SITE_INDEX, rel);
  r.check(entry !== undefined, `${rel}: no SITE_INDEX entry (key "/" + rel)`);
  r.check(entry !== undefined && typeof entry.note === 'string' && entry.note.trim().length > 0,
    `${rel}: SITE_INDEX entry has empty/missing note`);

  // #418 addendum — a static, JS-independent description signal (presence only).
  r.check(hasStaticDescription(html),
    `${rel}: no static description (need non-empty meta description / og:description / .lead)`);

  // #434 — favicon link present in <head> (presence only; href/format editorial).
  r.check(hasFavicon(html),
    `${rel}: missing favicon <link rel="icon"> in <head>`);
}

r.done(`pages scanned: ${inScope} in-scope, ${EXEMPT.size} exempt (templates auto-skipped); SITE_INDEX keys: ${SITE_INDEX ? Object.keys(SITE_INDEX).length : 0}`);
