#!/usr/bin/env node
/**
 * TC — data-entry webform WRITE-path wiring  (Tier 1 · cross-cutting · GH #345)
 * ----------------------------------------------------------------------------
 * The complement to tc-live-display/#336: #336 covers the READ/display path, this
 * covers the data-entry SUBMIT path. Every data-entry page must wire submit->GAS
 * so a refactor can't silently break data entry (the write is invisible until
 * someone checks the Sheet).
 *
 * DENOMINATOR — declared from canon, exactly as #336 declares its READ set. The set
 * is SITE_INDEX entries carrying dataRole:"entry" (the value #336 reserves for
 * data-entry-only pages). This auto-includes "any future form" (the contract's
 * growth clause) — a new form gets dataRole:"entry" and is covered with no test
 * edit. NOTE: the #345 contract's inline example list also names spirit.html, but
 * canon declares spirit.html dataRole:"live" (a display page, cf. tc-spirit/#337),
 * NOT an entry page — so it is correctly OUT of this write-path denominator. That
 * contract-vs-canon mismatch is flagged for human review in the authoring comment;
 * this test characterizes what canon declares (RT), not the example list.
 *
 * CONTRACT — for each dataRole:"entry" page, the page TOGETHER WITH the local
 * modules it loads (<script src> closure, depth 1) must carry all four:
 *   1. a GAS webhook URL          — script.google.com/macros or /exec
 *   2. a form / input set         — <form> or <input>
 *   3. a text/plain POST          — the CORS-safe content type (the GAS-CORS
 *                                   pattern: POST text/plain, never application/json,
 *                                   to avoid the CORS preflight). This is the
 *                                   contract's named write signature.
 *   4. a success/error state      — any idiom (capability, not literal spelling)
 *
 * OUT OF SCOPE (by design): that a submission actually lands in the Sheet (Tier 4 /
 *   runtime). Structural wiring scan, green against current behavior (RT).
 *
 * TEETH: a form that silently loses its POST wiring, its GAS URL, its form/inputs,
 *   or its text/plain content type reds — data entry breaks invisibly otherwise.
 *
 * Confidence/source per assertion recorded in the authoring [Bond] comment.
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tc-live-display.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

// Depth-1 union: page HTML + every LOCAL (<script src>) module it loads (CDN skipped).
function unionOf(rel) {
  let html;
  try { html = rd(rel); } catch { return null; }
  const dir = dirname(rel);
  const scripts = [...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/g)].map((m) => m[1]);
  let union = html;
  for (const sc of scripts) {
    if (/^https?:/i.test(sc)) continue;
    try { union += '\n' + rd(normalize(join(dir, sc))); } catch { /* missing module surfaces as a missing capability */ }
  }
  return union;
}

const r = makeReport('tc-webform');
const data = loadWindow('data.js');

// Denominator: SITE_INDEX entries with dataRole:"entry" (the write-path set).
const SI = data.SITE_INDEX;
const entry = (SI && typeof SI === 'object' && !Array.isArray(SI))
  ? Object.keys(SI).filter((k) => SI[k] && SI[k].dataRole === 'entry')
  : [];

// Vacuity guard — a broken parse / dropped attribute must fail loudly, not pass empty.
r.check(entry.length >= 2,
  `expected >=2 dataRole:"entry" pages in SITE_INDEX, found ${entry.length} (data.js parse or dataRole attribute broken?)`);

const CAP = {
  gas:      /script\.google\.com\/macros|\/exec\b/,
  form:     /<form\b|<input\b/i,
  textPlain: /text\/plain/,
  state:    /success|thank|\berror\b|\bfailed\b|\.catch\s*\(|try\s*\{/i,
};

for (const route of entry) {
  const rel = route.replace(/^\//, '');
  const union = unionOf(rel);
  if (union == null) { r.check(false, `${route}: declared dataRole:"entry" but the page file is missing`); continue; }
  for (const [cap, re] of Object.entries(CAP)) {
    r.check(re.test(union),
      `${route}: write-path missing ${cap.toUpperCase()} (checked page + its loaded modules)`);
  }
}

r.done(`webform write-path: ${entry.length} declared entry pages checked (GAS + form + text/plain POST + state)`);
