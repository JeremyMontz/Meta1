#!/usr/bin/env node
/**
 * window.NOW — current-focus data contract  (Tier 1 · GH #401)
 * ----------------------------------------------------------------------------
 * Locks the "now" list in data.js to the contract in #401: the section is
 * replaced with exactly four entries, verbatim and in order. A dropped, edited,
 * reordered, or stray entry turns this red and blocks the merge.
 *
 * CONTRACT (from the #401 issue body — spec-only, implementation never read)
 *   A. window.NOW exists in data.js and is an array of non-empty strings.
 *   B. It contains EXACTLY these four entries, in this order:
 *        1. 'Building an autonomous human-gated DEV/QA pipeline'
 *        2. 'Publishing the Homepage trailer'
 *        3. "Fine-tuning Daily Lectio skill and Phil's responses"
 *        4. 'Designing the Host roadmap'
 *      "Replace what's there" ⇒ no extra entries and none of the old ones.
 *
 * OUT OF SCOPE: how pages render window.NOW; any other data.js section.
 *
 * NOTE: the array-of-strings shape is inferred from the spec's snippet format
 * (quoted strings, comma-separated) [Confidence: Medium · Inferred]; the entry
 * text itself is verbatim from the issue body [Confidence: High · Retrieved].
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tests/tc-articles
 * house style. Run via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

// data.js is pure window.* assignment → run under a shim (as tc2 does).
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-now');

const EXPECTED = [
  'Building an autonomous human-gated DEV/QA pipeline',
  'Publishing the Homepage trailer',
  "Fine-tuning Daily Lectio skill and Phil's responses",
  'Designing the Host roadmap',
];

const data = loadWindow('data.js');
const NOW = data.NOW;

// A. shape
r.check(Array.isArray(NOW), 'window.NOW is missing or not an array');
if (Array.isArray(NOW)) {
  for (let i = 0; i < NOW.length; i++) {
    r.check(typeof NOW[i] === 'string' && NOW[i].trim().length > 0,
      `NOW[${i}] is not a non-empty string`);
  }

  // B. exact content, in order ("replace what's there" — #401)
  r.check(NOW.length === EXPECTED.length,
    `NOW has ${NOW.length} entries; contract requires exactly ${EXPECTED.length}`);
  for (let i = 0; i < EXPECTED.length; i++) {
    r.check(NOW[i] === EXPECTED[i],
      `NOW[${i}] mismatch — expected ${JSON.stringify(EXPECTED[i])}, got ${JSON.stringify(NOW[i])}`);
  }
}

r.done(`tc-now: window.NOW checked against the #401 contract (4 verbatim entries, ordered)`);
