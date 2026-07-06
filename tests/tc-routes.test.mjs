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
 *   (normalized against each block's documented base):
 *     - SITE_INDEX          (KEYS are the routes)      — root-relative
 *     - ABOUT_PAGES         (href/url/page field)      — root-relative
 *     - ORGANS              (href/url/page field)       — root-relative
 *     - HISTORY             (href/url/page field)       — root-relative
 *     - AGENT_ARTIFACTS     (href/url/page field)       — relative to the agent
 *                             page directory `agents/<agentId>/` (the block's
 *                             own documented base: hrefs are written as a
 *                             relative URL from agents/{id}/{id}.html, e.g.
 *                             '../../dashboard.html' or bare 'house-timeline.html')
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
  *
 * @covers: data.js (route / href fields resolve to real files)
 * @ignores: external URLs — skipped by contract
 * @ignores: in-HTML links — owned: Tier-0 check-links
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-routes');
const data = loadWindow('data.js');

// --- defensive route harvesting -------------------------------------------
// [source, rawRoute, base] — base is a repo-relative dir the route resolves
// against ('' = repo root; 'agents/<id>/' for the per-agent AGENT_ARTIFACTS block).
const routes = [];
const push = (src, v, base = '') => {
  if (typeof v === 'string' && v.trim()) routes.push([src, v.trim(), base]);
};
const refField = (o) => (o && typeof o === 'object' && !Array.isArray(o))
  ? (o.href ?? o.url ?? o.page ?? o.route) : undefined;

// SITE_INDEX — keys are routes (root-relative)
const SI = data.SITE_INDEX;
if (SI && typeof SI === 'object' && !Array.isArray(SI)) {
  for (const k of Object.keys(SI)) push('SITE_INDEX key', k);
}

// array-of-object blocks with a reference field (root-relative)
for (const name of ['ABOUT_PAGES', 'ORGANS', 'HISTORY']) {
  const arr = Array.isArray(data[name]) ? data[name] : [];
  for (const o of arr) push(name, refField(o));
}

// AGENT_ARTIFACTS — keyed by agent id; each agent's hrefs are relative to that
// agent's page directory `agents/<agentId>/`, NOT the repo root. Iterate by KEY
// so the per-agent base is preserved (a root-relative walk loses it and would
// false-fail every '../../…' and bare route). Ref fields harvested defensively.
const AA = data.AGENT_ARTIFACTS;
if (AA && typeof AA === 'object' && !Array.isArray(AA)) {
  for (const agentId of Object.keys(AA)) {
    const base = `agents/${agentId}/`;
    const harvest = (node, depth) => {
      if (node == null || depth > 4 || typeof node !== 'object') return;
      const f = refField(node);
      if (typeof f === 'string') push('AGENT_ARTIFACTS', f, base);
      for (const v of Object.values(node)) harvest(v, depth + 1);
    };
    harvest(AA[agentId], 0);
  }
}

// --- resolution ------------------------------------------------------------
const isExternal = (u) => /^(https?:)?\/\//i.test(u) || /^(mailto:|tel:|#)/i.test(u);
// Strip fragment/query, the /Meta1/ Pages base, a leading slash, and any './'.
// Keep '../' segments — they are meaningful once joined to a non-root base.
function clean(u) {
  let s = u.split('#')[0].split('?')[0].trim();
  s = s.replace(/^\/Meta1\//, '').replace(/^\//, '').replace(/^\.\//, '').replace(/\/+$/, '');
  return s;
}
// Resolve `s` (repo-relative, possibly with ../) against `base` (repo-relative
// dir), then test host-style candidates under ROOT.
function resolves(s, base) {
  const rel = normalize(join(base, s)).replace(/\\/g, '/');
  const cands = rel === '' || rel === '.'
    ? ['index.html']
    : [rel, `${rel}.html`, `${rel}/index.html`];
  return cands.some((c) => existsSync(join(ROOT, c)));
}

let checked = 0, ext = 0;
for (const [src, u, base] of routes) {
  if (isExternal(u)) { ext++; continue; }
  checked++;
  r.check(resolves(clean(u), base), `${src}: route does not resolve to a file: ${u}`);
}

// vacuity guard — a silent extraction/shape regression must not pass as green
r.check(checked > 0, 'no internal data.js routes were checked — extraction or data shape regressed');

r.done(`routes: ${checked} internal checked, ${ext} external skipped, across SITE_INDEX/ABOUT_PAGES/ORGANS/HISTORY/AGENT_ARTIFACTS`);
