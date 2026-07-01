#!/usr/bin/env node
/**
 * Our-History month-graph set — per-type group  (Tier 1 · GH #335)
 * ----------------------------------------------------------------------------
 * Owns the month-graph file set (m1–m3) that the Articles TC (#332) deliberately
 * exempts. Each HISTORY month must be a complete unit: a real page, a matching JS
 * engine file, and non-empty OG metadata. Plus one cross-block invariant:
 * `first-month` is enumerated in PORTFOLIO too (a drift there is the named tooth).
 * Authored from the #335 written spec, spec-only.
 *
 * Membership is DERIVED from window.HISTORY hrefs — NOT a hardcoded path — so if
 * the month files relocate (e.g. writing/ → about/), the TC follows them (per the
 * spec's relocation note).
 *
 * CONTRACT
 *   A. Per HISTORY entry: `href` → a real file; a sibling JS file (`.html`→`.js`)
 *      exists; the page carries a non-empty og:title AND og:description.
 *   B. Cross-block: the `first-month` entry is also referenced in `PORTFOLIO`
 *      (PORTFOLIO/HISTORY drift on first-month is the tooth). second/third-month
 *      being HISTORY+SITE_INDEX only is intentional and is NOT asserted (a future
 *      promotion of a month into PORTFOLIO must not red).
 *
 * SCOPE: the HISTORY month-graph file set.
 * OUT OF SCOPE: interactive graph runtime (Tier 4, #306); the articles corpus
 *   (#332); route validity of non-HISTORY blocks (#334).
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. data.js under a window
 * shim, as tc2/tc-articles do. Run via tests/run.mjs.
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

// B. cross-block: first-month is in HISTORY and also referenced by PORTFOLIO
const firstMonth = HISTORY.map(ref).filter((v) => typeof v === 'string' && /first-month/i.test(v));
r.check(firstMonth.length > 0, 'HISTORY carries no first-month entry (expected the m1 anchor)');

const PORTFOLIO = Array.isArray(data.PORTFOLIO) ? data.PORTFOLIO : [];
const portfolioText = PORTFOLIO.map((p) => ref(p) || '').join(' | ');
if (firstMonth.length > 0) {
  r.check(/first-month/i.test(portfolioText),
    'PORTFOLIO/HISTORY drift: first-month is in HISTORY but not referenced in PORTFOLIO');
}

r.done(`history: ${HISTORY.length} month(s) checked · first-month in PORTFOLIO=${/first-month/i.test(portfolioText)}`);
