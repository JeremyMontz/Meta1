#!/usr/bin/env node
/**
 * About-section — per-type group contract  (Tier 1 · GH #344)
 * ----------------------------------------------------------------------------
 * Characterizes the about/ section: every about page is wired into
 * window.ABOUT_PAGES (bijection both directions), mounts the about-subnav with
 * its own active id, and carries the required structural slots. An about page
 * added or renamed without updating ABOUT_PAGES — or a page missing its subnav
 * mount — turns this red and blocks the merge. Closes a coverage-map gap (about
 * pages were TC1-only).
 *
 * Authored by autonomous Bond from the #344 written contract, SPEC-ONLY: the
 * about/*.html and data.js implementations were NOT read. Scope, slot markers,
 * and the active="ABOUT" chrome convention are taken verbatim from the issue
 * body and the established house convention (cf. tc-articles active="WRITING").
 *
 * CONTRACT
 *   A. Bijection (data-derived scope, no hardcoded page list):
 *        in-scope about files == ABOUT_PAGES, both directions.
 *        in-scope = about/*.html  MINUS  _-prefixed templates.
 *        Each ABOUT_PAGES entry has a non-empty `id`; its page is about/<id>.html
 *        (id == filename stem — the parenthetical "(human, ai, history)" in the
 *        contract). Adding a 4th about page, or relocating one, needs no test
 *        edit — the file set is discovered at run time.
 *   B. Per-ABOUT_PAGES: `id` non-empty, and about/<id>.html exists.
 *   C. Per-about-page slots (each existing about/<id>.html):
 *        - about-subnav active matches the page's id   -> active="<id>"
 *        - chrome active="ABOUT"
 *        - non-empty og:description
 *        - non-empty hero <h1>
 *
 * OUT OF SCOPE (by design): content quality; the history month-graph *list*
 *   inside about/history.html (owned by the History TC, #335). This TC treats
 *   about/history.html only as a section page (existence + slots), never its
 *   month list.
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs and tests/tc1/tc2/tc-articles. Run directly
 * or via tests/run.mjs.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const ne = (v) => typeof v === 'string' && v.trim().length > 0;

// data.js is pure window.* assignment -> run under a shim (as tc2 / tc-articles).
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-about');

const data = loadWindow('data.js');
const ABOUT_PAGES = data.ABOUT_PAGES || [];
const ABOUT_IDS = ABOUT_PAGES.map((p) => (typeof p === 'string' ? p : p.id)).filter(Boolean);

const ADIR = 'about';
const files = readdirSync(join(ROOT, ADIR)).filter((n) => n.endsWith('.html') && !n.startsWith('_'));
const idSet = new Set(ABOUT_IDS);

// A. bijection (data-derived, both directions)
for (const n of files) {
  const stem = n.replace(/\.html$/, '');
  r.check(idSet.has(stem), `about file not listed in ABOUT_PAGES: ${ADIR}/${n}`);
}
for (const id of ABOUT_IDS) {
  r.check(existsSync(join(ROOT, ADIR, `${id}.html`)), `ABOUT_PAGES id has no page: ${ADIR}/${id}.html`);
}

// B. per-ABOUT_PAGES: id non-empty (and existence handled in A)
for (const p of ABOUT_PAGES) {
  const id = typeof p === 'string' ? p : p.id;
  r.check(ne(id), `ABOUT_PAGES entry has empty id: ${JSON.stringify(p)}`);
}

// C. per-about-page slots
for (const id of ABOUT_IDS) {
  const page = `${ADIR}/${id}.html`;
  if (!existsSync(join(ROOT, page))) continue; // existence already reported in A
  const html = rd(page);
  r.check(new RegExp(`active="${id}"`).test(html), `${page}: about-subnav active="${id}" not found`);
  r.check(/active="ABOUT"/.test(html), `${page}: chrome not active="ABOUT"`);
  r.check(/property="og:description"[^>]*content="[^"]+"/.test(html), `${page}: missing/empty og:description`);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
  r.check(ne(h1.replace(/<[^>]+>/g, '')), `${page}: hero <h1> is empty`);
}

r.done(`about: ${ABOUT_IDS.length} pages listed · ${files.length} in-scope files`);
