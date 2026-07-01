#!/usr/bin/env node
/**
 * Live-display wiring — cross-cutting read-path  (Tier 1 · GH #336)
 * ----------------------------------------------------------------------------
 * One contract, many consumers: every page that declares a live region must wire
 * the shared fetch→render path. The teeth: a fetch/parse/render regression that
 * silently blanks every live surface at once. Authored from the #336 written
 * spec, spec-only (page SOURCE scanned; implementation never inspected).
 *
 * DENOMINATOR — the spec names a "declared list" (faces, heart, spirit, agent
 * pages, dashboard, house-budget/entry/timeline). Enumerating those exact paths
 * is not derivable spec-only (and "agent pages" is dynamic), so membership is
 * DISCOVERED: a page is a live surface if its source declares a live region —
 * it references a live data source (Sheet csvUrl()/gviz/GAS webhook) OR loads the
 * shared component OR carries a #dataStatus element.
 *   KNOWN BOUNDARY: a page that drops ALL of those markers at once escapes the
 *   denominator (can't be caught by discovery). The canonical declared-list form
 *   is a stronger future variant — it needs the explicit path list from a human.
 *   Flagged for a #336 contract amendment.
 *
 * CONTRACT (per discovered live page):
 *   Either it DELEGATES the whole path to the shared component (loads
 *   components/agent-card.js) — which carries source+status+fallback — OR it
 *   ROLLS ITS OWN, in which case all four must be present inline:
 *     1. a live data source (csvUrl()/gviz URL OR a GAS /exec webhook URL)
 *     2. a fetch/parse
 *     3. a #dataStatus element
 *     4. a NO-DATA / .catch empty-state fallback
 *
 * OUT OF SCOPE: that the live VALUES are correct (Tier 4 / runtime).
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tc1's file walk.
 * Run via tests/run.mjs.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === '.git' || e === 'node_modules') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html') && !e.startsWith('_')) out.push(p);
  }
  return out;
}

const hasDataSource = (h) =>
  /csvUrl\s*\(/i.test(h) || /gviz/i.test(h) ||
  /docs\.google\.com\/spreadsheets/i.test(h) ||
  /script\.google\.com\/macros/i.test(h) || /\/exec\b/.test(h);
const loadsShared = (h) => /agent-card\.js/i.test(h);
const hasStatus   = (h) => /id\s*=\s*["']dataStatus["']/i.test(h) || /data-status/i.test(h);
const hasFetch    = (h) => /fetch\s*\(/i.test(h);
const hasFallback = (h) => /\.catch\s*\(/i.test(h) || /no[-_ ]?data/i.test(h);

const r = makeReport('tc-live-display');

let live = 0, delegated = 0, rollOwn = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  const html = readFileSync(file, 'utf8');

  const declaresLive = hasDataSource(html) || loadsShared(html) || hasStatus(html);
  if (!declaresLive) continue;
  live++;

  if (loadsShared(html)) { delegated++; continue; } // shared component carries the path

  // roll-your-own: all four must be present inline
  rollOwn++;
  r.check(hasDataSource(html), `${rel}: live region, no shared component, and no inline data source (csvUrl/gviz/GAS)`);
  r.check(hasFetch(html),      `${rel}: live region, rolls its own, but no fetch/parse`);
  r.check(hasStatus(html),     `${rel}: live region, rolls its own, but no #dataStatus element`);
  r.check(hasFallback(html),   `${rel}: live region, rolls its own, but no NO-DATA/.catch fallback`);
}

// vacuity guard — if discovery finds no live surfaces, the marker set regressed
r.check(live > 0, 'no live surfaces discovered — the live-region marker set regressed, or the shared path was renamed');

r.done(`live-display: ${live} live surfaces (${delegated} delegate to shared component, ${rollOwn} roll their own)`);
