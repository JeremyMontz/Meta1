#!/usr/bin/env node
/**
 * TC — agent-page live layer  (Tier 1 · per-type, extends TC2 · GH #342)
 * ----------------------------------------------------------------------------
 * The per-agent-page LIVE layer that TC2/#299 explicitly excludes as "Sheet-driven,
 * NO-DATA is a valid state." An agent page is fully covered by:
 *   TC2/#299          — identity / roster / portrait (static, authored)
 *   tc-live-display   — the shared live-data fetch READ PATH (#336)
 *   THIS TC (#342)    — the agent-specific live MOUNTS (below)
 *
 * CONTRACT (spec-only authorship; agent-page implementations were NOT read).
 * For each agent page, the page TOGETHER WITH the local modules it loads
 * (<script src> closure, depth 1 — the live layer is rendered by shared modules
 * such as agent-card.js / PersonaCard, so the UNION is the unit of test, exactly
 * as tc-live-display/#336 established) must carry:
 *   1. a persona/spirit card mount     (#personaCard)
 *   2. a sessions list mount           (#sessions-mount) with MAX_SESSIONS = 5
 *   3. an activity-log element
 *   4. a NO-DATA / empty state         (any idiom — capability, not literal)
 *
 * DENOMINATOR — declared from canon, with the site's ONE documented human
 * exception. window.AGENTS is the roster; the agent page is agents/<id>/<id>.html.
 * `jeremy` is EXCLUDED: he is the human, whom the site canonically excludes from
 * the live agent-status layer (TC2 documents him as absent from DOMAIN_PROJECT —
 * "appended live, project 'self'"). Excluding him is the conservative RT choice —
 * it cannot produce a false red; at worst it under-covers his page by one, which
 * is disclosed rather than guessed green. `monzter` has no agent page (not an
 * AGENTS row) and is naturally absent. Missing pages are TC2's teeth, not ours —
 * we scan the live layer only where the page exists.
 *
 * OUT OF SCOPE (by design): live VALUES (Tier 4); page identity/roster/portrait
 *   (TC2); the shared fetch read-path (tc-live-display). Structural mount scan,
 *   green against current behavior (RT characterization).
 *
 * TEETH: a copied agent page that dropped its persona card, its sessions mount /
 *   MAX_SESSIONS cap, its activity-log element, or its NO-DATA state reds.
 *
 * Confidence/source per assertion recorded in the authoring [Bond] comment.
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tc2 / tc-live-display.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }
const idsOf = (arr) => (arr || []).map((o) => (typeof o === 'string' ? o : o.id)).filter(Boolean);

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

const r = makeReport('tc-agent-live');

const data = loadWindow('data.js');
const AGENTS = idsOf(data.AGENTS || []);
const pages = AGENTS.filter((id) => id !== 'jeremy');   // documented human exception

// Vacuity guard — a broken data.js parse must fail loudly, not pass empty.
r.check(pages.length >= 5,
  `expected >=5 agent pages in the denominator (AGENTS - jeremy), found ${pages.length} (data.js parse broken?)`);

// Live-layer capability patterns (capability, not literal spelling where noted).
const CAP = {
  personaCard:  /personaCard/,
  sessionsMount: /sessions-mount/,
  maxSessions:  /MAX_SESSIONS\s*=\s*5\b/,
  activityLog:  /activity-?log/i,
  noData:       /no-?data|nodata|offline|empty-?state|no-?sessions|could not|\bfailed\b/i,
};

for (const id of pages) {
  const rel = `agents/${id}/${id}.html`;
  if (!has(rel)) continue;                 // page existence is TC2's teeth, not ours
  const union = unionOf(rel);
  if (union == null) { r.check(false, `${id}: agent page unreadable`); continue; }
  for (const [cap, re] of Object.entries(CAP)) {
    r.check(re.test(union),
      `${id}: agent-page live layer missing ${cap} (checked page + loaded modules)`);
  }
}

r.done(`agent-live: ${pages.length} agent pages checked (page + module-closure, live-layer mounts)`);
