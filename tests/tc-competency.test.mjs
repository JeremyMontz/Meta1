#!/usr/bin/env node
/**
 * Competency evidence integrity — data.js  (Tier 1 · GH #333)
 * ----------------------------------------------------------------------------
 * Cross-cutting data-sanity contract. The portfolio "What It Proves" evidence
 * graph is computed from `demonstrates` tags; a typo'd tag silently drops a Work
 * or Article from the graph — an invisible failure, exactly what a regression
 * test is for. Authored from the #333 written spec, spec-only (data.js data is
 * read at run time; the implementation is never inspected to author asserts).
 *
 * CONTRACT
 *   A. Every `demonstrates:[id]` in `window.PORTFOLIO` and `window.ARTICLES`
 *      resolves to a real `window.COMPETENCIES` id. No orphan ids. (the tooth)
 *   B. (Optional, per spec) every COMPETENCIES id is referenced at least once.
 *      Surfaced as INFORMATIONAL output only — NOT asserted: a legitimately
 *      not-yet-referenced competency must not red on good behavior. Flip to an
 *      assertion later if the corpus is meant to be fully covered.
 *
 * SCOPE: data.js only.
 * OUT OF SCOPE: content quality; whether the chosen tag is the *right* one;
 *   whether an item HAS a demonstrates array (owned by per-type TCs, e.g.
 *   tc-articles for ARTICLES). This TC only checks that ids present DO resolve.
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. data.js loaded under a
 * window shim, as tc2/tc-articles do. Run via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-competency');
const data = loadWindow('data.js');

const COMP = new Set((Array.isArray(data.COMPETENCIES) ? data.COMPETENCIES : []).map((c) => c && c.id));
const referenced = new Set();

// A. forward resolution — every demonstrates id must be a real COMPETENCIES id
let checkedIds = 0;
function scan(blockName) {
  const arr = Array.isArray(data[blockName]) ? data[blockName] : [];
  for (const item of arr) {
    const id = (item && (item.id || item.href || item.title)) || '(unknown item)';
    const dem = item && item.demonstrates;
    if (!Array.isArray(dem)) continue; // presence is a per-type TC's concern
    for (const d of dem) {
      checkedIds++;
      referenced.add(d);
      r.check(COMP.has(d), `${blockName} '${id}': demonstrates '${d}' is not a COMPETENCIES id (orphan tag)`);
    }
  }
}
scan('PORTFOLIO');
scan('ARTICLES');

// vacuity guards — a shape regression must not pass green
r.check(COMP.size > 0, 'window.COMPETENCIES is empty or missing — data shape regressed');
r.check(checkedIds > 0, 'no demonstrates ids were checked in PORTFOLIO/ARTICLES — data shape regressed');

// B. optional reverse — informational only, never fails
const unreferenced = [...COMP].filter((id) => id && !referenced.has(id));

r.done(`competency: ${COMP.size} competencies · ${checkedIds} demonstrates refs checked · ${unreferenced.length} unreferenced (info only${unreferenced.length ? ': ' + unreferenced.join(', ') : ''})`);
