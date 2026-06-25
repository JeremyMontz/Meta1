#!/usr/bin/env node
/**
 * TC2 — Agent completeness + roster coherence  (Tier 1 · GH #299)
 * ----------------------------------------------------------------------------
 * Asserts that every agent is fully WIRED everywhere it must appear, with all
 * required structural slots present. Catches the regressions that bite when an
 * agent is added or RELOCATED (#292): a roster left out of sync, a graph node
 * with no coordinates, a copied page whose config was never updated, a missing
 * portrait, or a blank identity field on a public page.
 *
 * DENOMINATOR: window.AGENTS in data.js is canon. Two structural exceptions,
 * baked into the site and mirrored here:
 *   - jeremy  : the human. In AGENTS / FACE_TABS / DOMAIN_TABS / LAYOUT /
 *               AgentGraph, but NOT in DOMAIN_PROJECT (appended live, project
 *               'self'). Portrait stem aliases to 'unknown' (artStem).
 *   - monzter : the decorative core cell — LAYOUT only. Not an agent (no row,
 *               tab, page, portrait-by-id). Portrait stem aliases to
 *               'claudemonzter'. Excluded from every check but the LAYOUT one.
 *
 * CONTRACT
 *   A. Roster coherence — the six hand-maintained rosters name the same agents:
 *        FACE_TABS (faces.html)            == AGENTS
 *        DOMAIN_TABS (dashboard.html)      == AGENTS        (mapped tab->id)
 *        AgentGraph POSITIONS  a-<id>      == AGENTS
 *        AgentGraph GRAPH_COLORS a-<id>    == AGENTS
 *        DOMAIN_PROJECT (spirit-data.js)   == AGENTS - {jeremy}
 *        LAYOUT (faces.html)               == AGENTS + {monzter}
 *   B. Project agreement / referential integrity:
 *        DOMAIN_PROJECT[id] === AGENTS[id].project, and that project is a real
 *        window.PROJECTS id.
 *   C. Per-agent files: agents/<id>/<id>.html + portrait trio
 *        (<stem>.png / idle-<stem>.png / open-<stem>.png), stem via artStem.
 *   D. Per-agent page wiring: the [AGENT CONFIG] block sets AGENT_ID === folder
 *        id, and AGENT_TAB is present (catches copy-the-template-forgot-to-edit).
 *   E. Required-non-empty identity (authored, repo-static — NOT Sheet-driven):
 *        AGENTS row name / role / blurb, and the page's og:description + hero h1.
 *
 * OUT OF SCOPE (by design):
 *   - AGENT_ARTIFACTS population        → optional ("no artifacts yet" is valid)
 *   - live status / persona / sessions  → Sheet-driven; NO-DATA is a valid state
 *   - content QUALITY (is the text good) / graph node POSITION correctness
 *                                       → the human Accept gate
 *   - vault §Persona, persona-matrix & checkin Sheets, skill routing tables
 *                                       → CI-blind; tracked in the onboard
 *                                          runbook (#327) and #292's checklist
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs and tests/tc1-page-chrome.test.mjs.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));

// ── extractors (zero-dep) ───────────────────────────────────────────────────
// (a) window.* assignments in a pure-data .js → run under a window shim.
function loadWindow(path) {
  const win = {};
  new Function('window', rd(path))(win); // throws → real failure, surfaced by CI
  return win;
}
// (b) the balanced [..] / {..} literal following an identifier, eval'd in
//     isolation. Skips brackets inside strings. Used for literals whose values
//     are plain data (no variable refs): FACE_TABS, LAYOUT, DOMAIN_TABS,
//     DOMAIN_PROJECT. (POSITIONS/GRAPH_COLORS reference CX/CY consts and can't
//     be eval'd — those use key-regex below.)
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
// (c) AgentGraph keys are extracted by regex — ids may contain digits, and
//     POSITIONS values reference CX/CY consts so the literal can't be eval'd.

const idsOf = (arr) => (arr || []).map((o) => (typeof o === 'string' ? o : o.id)).filter(Boolean);
const ne = (v) => typeof v === 'string' && v.trim().length > 0;
const artStem = (id) => (id === 'jeremy' ? 'unknown' : id === 'monzter' ? 'claudemonzter' : id);

const r = makeReport('tc2-agent-completeness');

// ── load the canon + the rosters ────────────────────────────────────────────
const data = loadWindow('data.js');
const agentObjs = data.AGENTS || [];
const AGENTS = idsOf(agentObjs);
const PROJECTS = idsOf(data.PROJECTS);
const byId = Object.fromEntries(agentObjs.map((a) => [a.id, a]));

const faces = rd('graph/faces.html');
const dash = rd('dashboard.html');
const spirit = rd('graph/spirit-data.js');
const graph = rd('components/AgentGraph.jsx');

const FACE_TABS = literalAfter(faces, /FACE_TABS\s*=/) || [];
const FACE_IDS = idsOf(FACE_TABS);
const tabToId = Object.fromEntries(FACE_TABS.map((o) => [o.tab, o.id]));
const LAYOUT = literalAfter(faces, /LAYOUT\s*=/) || [];
const DOMAIN_TABS = literalAfter(dash, /DOMAIN_TABS\s*=/) || [];
const DOMAIN_IDS = DOMAIN_TABS.map((o) => tabToId[o.tab] || ('?' + o.tab));
const DOMAIN_PROJECT = literalAfter(spirit, /DOMAIN_PROJECT\s*=/, '{', '}') || {};
const DP_IDS = Object.keys(DOMAIN_PROJECT);
// POSITIONS: agent nodes carry `kind: 'agent'` (projects/hub don't).
const POS_IDS = [...graph.matchAll(/['"]a-([a-z0-9]+)['"]\s*:\s*\{[^}]*kind:\s*'agent'/g)].map((m) => m[1]);
// GRAPH_COLORS: scope to its own block so POSITIONS' a-<id> keys aren't counted.
const colorBlock = (graph.match(/GRAPH_COLORS\s*=([\s\S]*?)\};/) || [, ''])[1];
const COLOR_IDS = [...colorBlock.matchAll(/['"]a-([a-z0-9]+)['"]\s*:/g)].map((m) => m[1]);

// ── A. roster coherence (set equality, with the documented exceptions) ───────
const eq = (label, a, b) => {
  const A = new Set(a), B = new Set(b);
  const onlyA = [...A].filter((x) => !B.has(x));
  const onlyB = [...B].filter((x) => !A.has(x));
  r.check(onlyA.length === 0 && onlyB.length === 0,
    `${label}: roster drift — only-in-first [${onlyA}] only-in-AGENTS [${onlyB}]`);
};
eq('FACE_TABS vs AGENTS', FACE_IDS, AGENTS);
eq('DOMAIN_TABS vs AGENTS', DOMAIN_IDS, AGENTS);
eq('AgentGraph POSITIONS vs AGENTS', POS_IDS, AGENTS);
eq('AgentGraph GRAPH_COLORS vs AGENTS', COLOR_IDS, AGENTS);
eq('DOMAIN_PROJECT vs AGENTS-{jeremy}', DP_IDS, AGENTS.filter((x) => x !== 'jeremy'));
eq('LAYOUT vs AGENTS+{monzter}', LAYOUT, [...AGENTS, 'monzter']);

// ── B. project agreement / referential integrity ─────────────────────────────
for (const id of DP_IDS) {
  r.check(DOMAIN_PROJECT[id] === (byId[id] && byId[id].project),
    `${id}: project disagreement — AGENTS='${byId[id] && byId[id].project}' vs DOMAIN_PROJECT='${DOMAIN_PROJECT[id]}'`);
}
for (const a of agentObjs) {
  r.check(PROJECTS.includes(a.project), `${a.id}: project '${a.project}' is not a real PROJECTS id`);
}

// ── C/D/E. per-agent: files, page wiring, required-non-empty identity ─────────
for (const a of agentObjs) {
  const id = a.id;
  const stem = artStem(id);

  // C — files
  const page = `agents/${id}/${id}.html`;
  r.check(has(page), `${id}: missing agent page ${page}`);
  for (const f of [`${stem}.png`, `idle-${stem}.png`, `open-${stem}.png`]) {
    r.check(has(`graph/assets/faces/${f}`), `${id}: missing portrait graph/assets/faces/${f}`);
  }

  // E (data.js) — required-non-empty authored identity
  r.check(ne(a.name), `${id}: AGENTS.name is empty`);
  r.check(ne(a.role), `${id}: AGENTS.role is empty`);
  r.check(ne(a.blurb), `${id}: AGENTS.blurb is empty`);

  // D + E (page) — only if the page exists
  if (has(page)) {
    const html = rd(page);
    const aid = (html.match(/AGENT_ID\s*=\s*["']([^"']+)["']/) || [])[1];
    const tab = (html.match(/AGENT_TAB\s*=\s*["']([^"']+)["']/) || [])[1];
    r.check(aid === id, `${id}: page AGENT_ID='${aid}' does not match folder id`);
    r.check(ne(tab), `${id}: page AGENT_TAB is missing`);
    const og = (html.match(/og:description"\s+content="([^"]*)"/) || [])[1] || '';
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    r.check(ne(og), `${id}: page og:description is empty`);
    r.check(ne(h1.replace(/<[^>]+>/g, '')), `${id}: page hero <h1> is empty`);
  }
}

r.done(`agents: ${AGENTS.length} (incl. human) · rosters: 6 coherent · ${PROJECTS.length} projects`);
