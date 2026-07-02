#!/usr/bin/env node
/**
 * TC — faces + dashboard live agent-grid structure  (Tier 1 · standalone · GH #339)
 * ----------------------------------------------------------------------------
 * The live agent-grid surface, bundled: graph/faces.html and dashboard.html both
 * render the roster grid from the shared live pipeline. This TC owns the grid /
 * roster STRUCTURE unique to these two pages — the scaffolding that, if a refactor
 * dropped it, would blank or malform the grid even while the rosters still match.
 *
 * SEPARATION OF CONCERNS (why this exists alongside the others):
 *   - TC2 / #299 (agent-completeness) owns roster SET-EQUALITY across all six
 *     rosters (FACE_TABS / DOMAIN_TABS / LAYOUT == AGENTS, with exceptions) and
 *     per-agent files. It does NOT assert grid SHAPE or the render scaffold.
 *   - tc-live-display / #336 owns the shared live-data READ PATH (source, fetch,
 *     status, fallback) for every dataRole:"live" page. It does NOT assert the
 *     grid/roster structure unique to faces + dashboard.
 *   - THIS TC (#339) owns exactly that gap: the multi-tab roster driver, the 3x3
 *     shape, the graph-subnav active state, the dossier fly-in, and the
 *     dashboard agent-status grid cardinality. Closes the dashboard coverage-map
 *     gap noted in #339.
 *
 * CONTRACT (spec-only authorship; page implementations were NOT read):
 *   FACES (graph/faces.html)
 *     F1  FACE_TABS is present and MULTI-TAB (>=2 entries) — the multi-tab
 *         roster driver named in the #339 contract.
 *     F2  LAYOUT is a 3x3 roster grid — exactly 9 cells (8 surrounding agents +
 *         the monzter core), per the contract's "3x3 roster".
 *     F3  the graph-subnav mount (#graph-subnav) is present.
 *     F4  the graph-subnav is wired active="FACES" (the ORGANS isParent tab),
 *         per the contract literal. Capability regex — spelling-tolerant.
 *     F5  the dossier fly-in is present (the fly-in detail panel).
 *   DASHBOARD (dashboard.html)
 *     D1  DOMAIN_TABS is present and MULTI-ENTRY (>=2) — the agent-status grid
 *         driver.
 *     D2  one cell per AGENTS row — DOMAIN_TABS cardinality tracks window.AGENTS
 *         (the contract's "one cell per AGENTS row").
 *     D3  an agent-status grid container is present.
 *
 * OUT OF SCOPE (by design): content quality; live values; roster set-membership
 *   (TC2 owns it); the shared fetch read-path (tc-live-display owns it). This is a
 *   structural wiring scan, green against current behavior (RT characterization).
 *
 * TEETH: a roster/grid wiring regression on EITHER page reds — FACE_TABS emptied
 *   or collapsed to one tab, the 3x3 shape broken, the graph-subnav active state
 *   dropped/misrouted, the dossier fly-in removed, the DOMAIN_TABS driver dropped
 *   or decoupled from the roster, or the dashboard grid container removed.
 *
 * Confidence/source per assertion is recorded in the authoring [Bond] comment.
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tc2 / tc-live-display.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

// window.* assignments in a pure-data .js -> run under a window shim (house pattern).
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

// The balanced [..] literal following an identifier, eval'd in isolation; skips
// brackets inside strings. Same extractor tc2 uses for FACE_TABS / LAYOUT / DOMAIN_TABS.
function literalAfter(text, identRe, open = '[', close = ']') {
  const m = text.match(identRe);
  if (!m) return undefined;
  const start = text.indexOf(open, m.index);
  if (start < 0) return undefined;
  let depth = 0, inStr = null, esc = false;
  for (let j = start; j < text.length; j++) {
    const c = text[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return new Function('return ' + text.slice(start, j + 1))(); }
  }
  return undefined;
}
const idsOf = (arr) => (arr || []).map((o) => (typeof o === 'string' ? o : o.id)).filter(Boolean);

const r = makeReport('tc-faces-dashboard');

// -- canon + the two surfaces -------------------------------------------------
const data = loadWindow('data.js');
const AGENTS = idsOf(data.AGENTS || []);
const faces = rd('graph/faces.html');
const dash = rd('dashboard.html');

// -- FACES: grid/roster structure ---------------------------------------------
const FACE_TABS = literalAfter(faces, /FACE_TABS\s*=/) || [];
r.check(Array.isArray(FACE_TABS) && FACE_TABS.length >= 2,
  `faces: FACE_TABS missing or not multi-tab (found ${Array.isArray(FACE_TABS) ? FACE_TABS.length : 'non-array'}) — roster driver broken`);

const LAYOUT = literalAfter(faces, /LAYOUT\s*=/) || [];
r.check(Array.isArray(LAYOUT) && LAYOUT.length === 9,
  `faces: LAYOUT is not a 3x3 (9-cell) roster grid (found ${Array.isArray(LAYOUT) ? LAYOUT.length : 'non-array'})`);

r.check(/#graph-subnav/.test(faces),
  `faces: graph-subnav mount (#graph-subnav) missing`);

r.check(/active\s*[:=]\s*["']FACES["']/.test(faces),
  `faces: graph-subnav not wired active="FACES"`);

r.check(/dossier/i.test(faces),
  `faces: dossier fly-in absent`);

// -- DASHBOARD: agent-status grid structure -----------------------------------
const DOMAIN_TABS = literalAfter(dash, /DOMAIN_TABS\s*=/) || [];
r.check(Array.isArray(DOMAIN_TABS) && DOMAIN_TABS.length >= 2,
  `dashboard: DOMAIN_TABS missing or not multi-entry (found ${Array.isArray(DOMAIN_TABS) ? DOMAIN_TABS.length : 'non-array'}) — agent-status grid driver broken`);

r.check(AGENTS.length > 0 && DOMAIN_TABS.length === AGENTS.length,
  `dashboard: agent-status grid not one-cell-per-agent (DOMAIN_TABS ${DOMAIN_TABS.length} vs AGENTS ${AGENTS.length})`);

r.check(/grid/i.test(dash),
  `dashboard: agent-status grid container absent`);

r.done(`faces+dashboard: FACE_TABS ${FACE_TABS.length}-tab · LAYOUT ${LAYOUT.length}-cell · DOMAIN_TABS ${DOMAIN_TABS.length} vs AGENTS ${AGENTS.length}`);
