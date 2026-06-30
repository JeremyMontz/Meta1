#!/usr/bin/env node
/**
 * About-section — per-type group contract  (Tier 1 · GH #344)
 * ----------------------------------------------------------------------------
 * Characterizes the about/ section: every about page is wired into
 * window.ABOUT_PAGES (bijection both directions), mounts the about-subnav with
 * its own active id, and carries the required identity slots. An about page
 * added or renamed without updating ABOUT_PAGES — or a page whose subnav mount
 * is missing/wrong — turns this red and blocks the merge. Closes a coverage-map
 * gap (about pages were TC1-only).
 *
 * CONTRACT
 *   A. Bijection (data-derived scope, no hardcoded page list):
 *        in-scope about files == ABOUT_PAGES, both directions.
 *        in-scope = about/*.html  MINUS  _-prefixed templates.
 *        Each ABOUT_PAGES entry carries `href` (the root-relative page path, e.g.
 *        'about/human.html') and an UPPERCASE `id` token (e.g. 'HUMAN') that the
 *        page passes as <AboutSubnav active="..." />. Path is taken from `href`
 *        (NOT derived from id) — id is a section token, not a filename. Adding a
 *        4th about page needs no test edit — the file set is discovered at run
 *        time.
 *   B. Per-ABOUT_PAGES: `id` non-empty, `href` non-empty, and href's file exists.
 *   C. Per-about-page slots (each existing href):
 *        - about-subnav active matches the page's id   -> active="<id>"
 *        - chrome active="ABOUT"
 *        - non-empty og:description  (the page's required non-empty identity)
 *
 *   NB hero <h1> is intentionally NOT asserted. The #344 issue body listed it,
 *   but the about heroes are heterogeneous by design: about/human.html has one
 *   <h1>, about/history.html has two, and about/ai.html has NONE (an "operating
 *   table" hero with overlay). Requiring <h1> would turn this red on good,
 *   shipped behavior, which an RT characterization TC must not do. Non-empty
 *   page identity is carried by og:description instead. Flagged for a #344
 *   contract amendment (discovered 2026-06-30 during the green-up of PR #350).
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

const ADIR = 'about';
const files = readdirSync(join(ROOT, ADIR)).filter((n) => n.endsWith('.html') && !n.startsWith('_'));
const hrefs = new Set(ABOUT_PAGES.map((p) => p.href));

// A. bijection (data-derived, both directions), keyed off href
for (const n of files) {
  r.check(hrefs.has(`${ADIR}/${n}`), `about file not listed in ABOUT_PAGES: ${ADIR}/${n}`);
}
for (const p of ABOUT_PAGES) {
  r.check(ne(p.href) && existsSync(join(ROOT, p.href)), `ABOUT_PAGES href missing file: ${p.href}`);
}

// B. per-ABOUT_PAGES: id + href non-empty
for (const p of ABOUT_PAGES) {
  r.check(ne(p.id), `ABOUT_PAGES entry has empty id: ${JSON.stringify(p)}`);
  r.check(ne(p.href), `ABOUT_PAGES entry has empty href: ${JSON.stringify(p)}`);
}

// C. per-about-page slots
for (const p of ABOUT_PAGES) {
  if (!(ne(p.href) && existsSync(join(ROOT, p.href)))) continue; // existence reported in A
  const html = rd(p.href);
  r.check(new RegExp(`active="${p.id}"`).test(html), `${p.href}: about-subnav active="${p.id}" not found`);
  r.check(/active="ABOUT"/.test(html), `${p.href}: chrome not active="ABOUT"`);
  r.check(/property="og:description"[^>]*content="[^"]+"/.test(html), `${p.href}: missing/empty og:description`);
}

r.done(`about: ${ABOUT_PAGES.length} pages · ${files.length} in-scope files`);
