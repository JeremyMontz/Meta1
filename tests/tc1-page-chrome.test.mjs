#!/usr/bin/env node
/**
 * TC1 — Universal page-chrome contract  (Tier 1 · GH #298)
 * ----------------------------------------------------------------------------
 * Asserts every published, chrome-bearing .html wires in the shared site chrome
 * via one of two sanctioned patterns. A page that forgets the chrome (drops
 * data.js, a chrome component, or both mount points) turns this check red and
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
 *   - _SITE_BASE correctness              → component-internal
 *   - rendered-DOM / runtime mount        → Tier 4 (#306)
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs. Run directly or via tests/run.mjs.
  *
 * @covers: * (every in-scope page — universal chrome contract)
 * @ignores: subnav / breadcrumb presence — owned: #300
 * @ignores: script-src resolution — owned: Tier-0 check-links
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
}

r.done(`pages scanned: ${inScope} in-scope, ${EXEMPT.size} exempt (templates auto-skipped)`);
