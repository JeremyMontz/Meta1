#!/usr/bin/env node
/**
 * Articles — per-type group contract  (Tier 1 · GH #332)
 * ----------------------------------------------------------------------------
 * Characterizes the writing/ essay corpus: every published article is wired into
 * window.ARTICLES with the expected metadata, and every article page carries the
 * structural slots. A new essay dropped in writing/ but never listed (or listed
 * with a missing file, or missing its dek/date/competency tag) turns this red and
 * blocks the merge.
 *
 * CONTRACT
 *   A. Bijection (data-derived scope):
 *        in-scope writing files == ARTICLES hrefs, both directions.
 *        in-scope = writing/*.html  MINUS  _-prefixed templates
 *                                   MINUS  every file referenced by window.HISTORY
 *        The HISTORY exemption is computed at run time (NOT a hardcoded name list)
 *        so a 4th month, or relocating the month set, needs no test edit.
 *   B. Per-ARTICLES metadata (from data.js): id/title/subtitle/date/tag/read/href
 *        non-empty; date matches MM.DD.YY; demonstrates non-empty and every id
 *        resolves to a real COMPETENCIES id; href points at an existing file and
 *        is not a HISTORY month file.
 *   C. Per-article page slots: class="article-title", class="article-subtitle",
 *        a non-empty og:description, and chrome active="WRITING".
 *
 * OUT OF SCOPE: content quality; interactive-graph runtime; the month-graph set
 *   (owned by the History TC, #335).
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs and tests/tc1/tc2. Run via tests/run.mjs.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const ne = (v) => typeof v === 'string' && v.trim().length > 0;

// data.js is pure window.* assignment → run under a shim (as tc2 does).
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-articles');

const data = loadWindow('data.js');
const ARTICLES = data.ARTICLES || [];
const COMP = new Set((data.COMPETENCIES || []).map((c) => c.id));
const HISTORY_HREFS = new Set((data.HISTORY || []).map((h) => h.href));

const WDIR = 'writing';
const files = readdirSync(join(ROOT, WDIR)).filter((n) => n.endsWith('.html') && !n.startsWith('_'));
const inScopeFiles = files.filter((n) => !HISTORY_HREFS.has(`${WDIR}/${n}`));
const articleHrefs = new Set(ARTICLES.map((a) => a.href));

// A. bijection
for (const n of inScopeFiles) {
  r.check(articleHrefs.has(`${WDIR}/${n}`), `writing file not listed in ARTICLES: ${WDIR}/${n}`);
}
for (const a of ARTICLES) {
  r.check(ne(a.href) && existsSync(join(ROOT, a.href)), `ARTICLES href missing file: ${a.href}`);
  r.check(!HISTORY_HREFS.has(a.href), `ARTICLES href is a HISTORY month file (wrong owner): ${a.href}`);
}

// B. per-ARTICLES metadata
const dateRe = /^\d{2}\.\d{2}\.\d{2}$/;
for (const a of ARTICLES) {
  const id = a.href || '(no href)';
  for (const f of ['id', 'title', 'subtitle', 'date', 'tag', 'read', 'href']) {
    r.check(ne(a[f]), `${id}: ARTICLES.${f} is empty`);
  }
  r.check(dateRe.test(a.date || ''), `${id}: date not MM.DD.YY (${a.date})`);
  r.check(Array.isArray(a.demonstrates) && a.demonstrates.length > 0, `${id}: demonstrates empty`);
  for (const d of a.demonstrates || []) r.check(COMP.has(d), `${id}: demonstrates '${d}' not a COMPETENCIES id`);
}

// C. per-article page slots
for (const a of ARTICLES) {
  if (!(ne(a.href) && existsSync(join(ROOT, a.href)))) continue; // existence already reported in A
  const html = rd(a.href);
  r.check(/class="article-title"/.test(html), `${a.href}: missing class="article-title"`);
  r.check(/class="article-subtitle"/.test(html), `${a.href}: missing class="article-subtitle"`);
  r.check(/property="og:description"[^>]*content="[^"]+"/.test(html), `${a.href}: missing/empty og:description`);
  r.check(/active="WRITING"/.test(html), `${a.href}: chrome not active="WRITING"`);
}

r.done(`articles: ${ARTICLES.length} listed · ${inScopeFiles.length} in-scope files · ${HISTORY_HREFS.size} exempt (HISTORY) · ${COMP.size} competencies`);
