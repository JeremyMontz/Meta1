#!/usr/bin/env node
/**
 * Our-History month-graph set — per-type group  (Tier 1 · GH #335)
 * ----------------------------------------------------------------------------
 * Owns the month-graph file set that the Articles TC (#332) deliberately exempts.
 * Each HISTORY month must be a complete unit: a real page, a matching JS engine
 * file, and non-empty OG metadata. Membership itself is NOT asserted — which
 * months exist, and which of them are featured elsewhere, is Jeremy's editorial
 * call. Authored from the #335 written spec, spec-only.
 *
 * Membership is DERIVED from window.HISTORY hrefs — NOT a hardcoded path — so if
 * the month files relocate (e.g. writing/ → about/), the TC follows them (per the
 * spec's relocation note).
 *
 * CONTRACT
 *   A. Per HISTORY entry: `href` → a real file; a sibling JS file (`.html`→`.js`)
 *      exists; the page carries a non-empty og:title AND og:description.
 *   (There is no B. The original cross-block check — "`first-month` must also be
 *   referenced in PORTFOLIO" — was retired 2026-07-27. It was authored before the
 *   global editorial default (2026-07-06) and encoded a June snapshot of the
 *   featured list as if it were an invariant. PORTFOLIO is a curated list that
 *   changes over time; membership is content, not contract. It went red the first
 *   time Jeremy re-cut the list — the correct signal that it was never a tooth.
 *   Same reasoning retired the "HISTORY must carry first-month" anchor.)
 *
 * SCOPE: the HISTORY month-graph file set, derived from window.HISTORY.
 * OUT OF SCOPE: interactive graph runtime (Tier 4, #306); the articles corpus
 *   (#332); route validity of non-HISTORY blocks (#334); which months are
 *   published and which are featured in PORTFOLIO (editorial).
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. data.js under a window
 * shim, as tc2/tc-articles do. Run via tests/run.mjs.
  *
 * @covers: @HISTORY pages (month-graph set)
 * @ignores: interactive graph runtime — runtime / Tier 4 (#306)
 * @ignores: HISTORY / PORTFOLIO membership — editorial
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }
const ref = (o) => (o && typeof o === 'object') ? (o.href ?? o.url ?? o.page ?? o.route) : undefined;

const r = makeReport('tc-history');
const data = loadWindow('data.js');

const HISTORY = Array.isArray(data.HISTORY) ? data.HISTORY : [];
r.check(HISTORY.length > 0, 'window.HISTORY is empty or missing — data shape regressed');

// A. per-entry completeness
for (const h of HISTORY) {
  const href = ref(h);
  const label = href || (h && (h.id || h.title)) || '(unknown HISTORY entry)';
  if (typeof href !== 'string' || !href.trim()) {
    r.check(false, `HISTORY entry has no href: ${label}`);
    continue;
  }
  const htmlPath = href.replace(/^\/Meta1\//, '').replace(/^\//, '');
  r.check(existsSync(join(ROOT, htmlPath)), `HISTORY '${label}': page file missing: ${htmlPath}`);
  if (!existsSync(join(ROOT, htmlPath))) continue;

  const jsPath = htmlPath.replace(/\.html?$/i, '.js');
  r.check(existsSync(join(ROOT, jsPath)), `HISTORY '${label}': matching JS engine file missing: ${jsPath}`);

  const html = rd(htmlPath);
  r.check(/property="og:title"[^>]*content="[^"]+"/.test(html), `HISTORY '${label}': missing/empty og:title`);
  r.check(/property="og:description"[^>]*content="[^"]+"/.test(html), `HISTORY '${label}': missing/empty og:description`);
}

r.done(`history: ${HISTORY.length} month(s) checked (structural completeness only)`);
