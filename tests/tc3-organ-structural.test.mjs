#!/usr/bin/env node
/**
 * TC3 — Organ-structural contract (per-type)  (Tier 1 · GH #300)
 * ----------------------------------------------------------------------------
 * Characterizes the graph "organ" page family: every organ declared in
 * window.ORGANS wires its own graph-subnav, sets that subnav's active key to its
 * ORGANS id, and loads its companion *-data.js when one exists. A copied organ
 * page that forgets the subnav mount, or ships a mismatched active key, turns
 * this red and blocks the merge.
 *
 * CONTRACT (per ORGANS entry, body excepted)
 *   A. Subnav mount — the page wires the GraphSubnav component (the "graph-subnav"
 *      is present). A page that drops it fails A.
 *   B. Active match — the page carries active="<id>" for that entry's ORGANS id
 *      (case-insensitive: a wrong-organ key is the tooth; mere casing is not a
 *      mismatch). A copied page left on the wrong organ's key fails B.
 *   C. Data wiring (conditional) — if graph/<stem>-data.js exists (stem = page
 *      basename), the page must load it as a full path segment (mirrors tc1's
 *      loadsFile, so "x-data.js" never matches a bare "data.js").
 *
 * SCOPE: window.ORGANS in data.js is canon (loaded under a window shim, as
 *   tc2 / tc-articles do). Entries are NOT counted — adding an organ is the
 *   point, so a hardcoded count would be stale at once. Field names read
 *   defensively (id|key|slug, href|url|page) so a benign rename can't false-red.
 *
 * EXCEPTION: graph/body.html is the "Body" subnav PARENT, not an organ — excluded
 *   by href (mirrors tc2's jeremy/monzter structural special-cases).
 *
 * BOUNDARY: file-EXISTENCE of ORGANS hrefs is owned by the route-validity TC
 *   (#334); this TC owns "the page wires itself." Absent files are skipped here,
 *   not asserted. A checked-count guard (>=1) keeps the skip from going vacuous.
 *
 * OUT OF SCOPE (owned elsewhere): live data read-path → #336; unique per-organ
 *   content → standalone organ TCs #337/#338/#339; that script srcs RESOLVE →
 *   check-links CI; rendered-DOM runtime → Tier 4 (#306).
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs and tests/tc1 / tc2 / tc-articles.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));
const ne = (v) => typeof v === 'string' && v.trim().length > 0;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// data.js is pure window.* assignment → run under a shim (as tc2/articles do).
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

// src="…/<fname>" as a full path segment (mirrors tc1) — so "<stem>-data.js"
// is matched exactly and a bare "data.js" never satisfies it.
const loadsFile = (html, fname) =>
  new RegExp(`src\\s*=\\s*["'](?:[^"']*/)?${esc(fname)}["']`, 'i').test(html);

const r = makeReport('tc3-organ-structural');

const data = loadWindow('data.js');
const ORGANS = data.ORGANS || [];
r.check(Array.isArray(ORGANS) && ORGANS.length > 0, 'window.ORGANS missing or empty in data.js');

// EXCEPTION — graph/body.html is the subnav parent, not an organ.
const isBody = (href) => /(^|\/)body\.html$/i.test(href || '');

let checked = 0;
for (const o of (Array.isArray(ORGANS) ? ORGANS : [])) {
  const key  = o.id ?? o.key ?? o.slug;    // contract: "matching the ORGANS id"
  const hrefRaw = o.href ?? o.url ?? o.page; // contract: "ORGANS hrefs"
  const label = ne(key) ? key : (ne(hrefRaw) ? hrefRaw : JSON.stringify(o));

  r.check(ne(key),     `ORGANS entry has no id/key/slug: ${JSON.stringify(o)}`);
  r.check(ne(hrefRaw), `ORGANS entry '${label}' has no href`);
  if (!ne(hrefRaw)) continue;
  if (isBody(hrefRaw)) continue;           // documented exception

  // Normalise href to a repo path (siblings use repo-relative, e.g.
  // "graph/heart.html"); tolerate a Pages base or a bare basename.
  let href = hrefRaw.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/(?:Meta1\/)?/, '');
  if (!has(href) && !href.includes('/')) href = `graph/${href}`;

  // BOUNDARY: existence is #334's. Skip-if-absent, don't assert.
  if (!has(href)) continue;
  checked++;
  const html = rd(href);

  // A. subnav mount — the page wires GraphSubnav.
  r.check(/GraphSubnav/.test(html),
    `${href}: GraphSubnav not wired (organ '${label}' is missing its graph-subnav mount)`);

  // B. active key matches the ORGANS id (case-insensitive; wrong organ = tooth).
  if (ne(key)) {
    r.check(new RegExp(`active\\s*=\\s*["']${esc(key)}["']`, 'i').test(html),
      `${href}: GraphSubnav active key does not match ORGANS id '${key}'`);
  }

  // C. loads its <stem>-data.js if it has one.
  const stem = basename(href).replace(/\.html$/i, '');
  const dataFile = `graph/${stem}-data.js`;
  if (has(dataFile)) {
    r.check(loadsFile(html, `${stem}-data.js`),
      `${href}: ${dataFile} exists but the page does not load it`);
  }
}

// Teeth guard: a path assumption that skipped every organ would be silent
// theater. The live site has organ pages, so at least one must be checked.
r.check(checked >= 1, 'no organ pages were checked — ORGANS href resolution is broken (test would be vacuous)');

r.done(`organs: ${ORGANS.length} in window.ORGANS · ${checked} pages checked · body.html excluded · existence owned by #334`);
