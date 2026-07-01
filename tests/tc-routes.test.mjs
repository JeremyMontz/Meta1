#!/usr/bin/env node
/**
 * Route validity — data.js reference fields resolve  (Tier 1 · GH #334)
 * ----------------------------------------------------------------------------
 * Cross-cutting data-sanity contract. Every internal href/route carried in the
 * data.js reference blocks must resolve to a real file in the repo. A data block
 * left pointing at a 404 (renamed/removed page, typo'd path) turns this red and
 * blocks the merge. Authored from the #334 written spec, spec-only — data.js is
 * loaded and its data READ at run time, but the implementation is never inspected
 * to author the assertions.
 *
 * CONTRACT
 *   Every internal reference in these data.js blocks resolves to a real file
 *   (root-relative, normalized):
 *     - SITE_INDEX          (KEYS are the routes)
 *     - ABOUT_PAGES         (href/url/page field)
 *     - ORGANS              (href/url/page field)
 *     - HISTORY             (href/url/page field)
 *     - AGENT_ARTIFACTS     (any href/url/page field, shape-agnostic walk)
 *
 *   "Resolves" is host-style (GitHub Pages): the literal path, OR path + ".html",
 *   OR path + "/index.html" — so an extensionless/shorthand route is valid when
 *   its page file exists. A genuine 404 fails all three (the tooth).
 *
 * SCOPE: data.js reference fields only.
 * OUT OF SCOPE:
 *   - external URLs (http(s)://, //, mailto:, tel:, #) — skipped
 *   - in-HTML links + the /Meta1/ base                 → Tier-0 check-links CI
 *   - "the page wires itself" for organs               → TC3 (#300)
 *   - data.js window.* section presence                → data.js-integrity CI
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. data.js loaded under a
 * window shim, as tc2/tc-articles do. Run via tests/run.mjs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-routes');
const data = loadWindow('data.js');

// --- defensive route harvesting -------------------------------------------
const routes = []; // [source, rawRoute]
const push = (src, v) => { if (typeof v === 'string' && v.trim()) routes.push([src, v.trim()]); };
const refField = (o) => (o && typeof o === 'object' && !Array.isArray(o))
  ? (o.href ?? o.url ?? o.page ?? o.route) : undefined;

// SITE_INDEX — keys are routes
const SI = data.SITE_INDEX;
if (SI && typeof SI === 'object' && !Array.isArray(SI)) {
  for (const k of Object.keys(SI)) push('SITE_INDEX key', k);
}

// array-of-object blocks with a reference field
for (const name of ['ABOUT_PAGES', 'ORGANS', 'HISTORY']) {
  const arr = Array.isArray(data[name]) ? data[name] : [];
  for (const o of arr) push(name, refField(o));
}

// AGENT_ARTIFACTS — shape unknown; walk defensively, harvest ref fields only
function harvest(src, node, depth) {
  if (node == null || depth > 4 || typeof node !== 'object') return;
  const f = refField(node);
  if (typeof f === 'string') push(src, f);
  for (const v of Object.values(node)) harvest(src, v, depth + 1);
}
harvest('AGENT_ARTIFACTS', data.AGENT_ARTIFACTS, 0);

// --- resolution ------------------------------------------------------------
const isExternal = (u) => /^(https?:)?\/\//i.test(u) || /^(mailto:|tel:|#)/i.test(u);
function normalize(u) {
  let s = u.split('#')[0].split('?')[0].trim();
  s = s.replace(/^\/Meta1\//, '').replace(/^\//, '').replace(/^\.\//, '').replace(/\/+$/, '');
  return s;
}
function resolves(s) {
  const cands = s === '' ? ['index.html'] : [s, `${s}.html`, `${s}/index.html`];
  return cands.some((c) => existsSync(join(ROOT, c)));
}

let checked = 0, ext = 0;
for (const [src, u] of routes) {
  if (isExternal(u)) { ext++; continue; }
  checked++;
  r.check(resolves(normalize(u)), `${src}: route does not resolve to a file: ${u}`);
}

// vacuity guard — a silent extraction/shape regression must not pass as green
r.check(checked > 0, 'no internal data.js routes were checked — extraction or data shape regressed');

r.done(`routes: ${checked} internal checked, ${ext} external skipped, across SITE_INDEX/ABOUT_PAGES/ORGANS/HISTORY/AGENT_ARTIFACTS`);
