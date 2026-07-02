#!/usr/bin/env node
/**
 * Live-display read-path wiring  (Tier 1 · cross-cutting · GH #336)
 * ----------------------------------------------------------------------------
 * One contract, many consumers. Every page that displays LIVE data (Sheet/webhook)
 * must wire the full read path so a refactor can't silently blank a live surface.
 *
 * DENOMINATOR — declared, not discovered. The set is `data.js` SITE_INDEX entries
 * carrying `dataRole: "live"`. (An earlier version DISCOVERED live pages by grepping
 * for markers; that over-included data-entry forms and archived pages — see the #336
 * adjudication. Live-ness is a product fact the source can't infer — several live
 * pages do their fetch in a loaded module, not the page HTML — so it is DECLARED in
 * data.js: `live` (this contract), `entry` (data-entry only), `archived` (inactive),
 * absent = static.) The GitHub *activity feed* is a different live source (the GitHub
 * API, not a Sheet/webhook) and is OUT of scope here — tracked separately as #364.
 *
 * CONTRACT — for each `dataRole:"live"` page, the page TOGETHER WITH the local
 * modules it loads (`<script src>` closure, depth 1) must carry all four:
 *   1. a live SOURCE      — csvUrl()/gviz URL or a GAS webhook (/exec)
 *   2. a FETCH            — fetch(
 *   3. a STATUS indicator — loading/error state (any idiom)
 *   4. a graceful FALLBACK — empty/error state on failure (any idiom)
 * Wiring is spread across page + data module (agent-card.js / *-data.js) + app
 * component, so the UNION of the page and its loaded modules is the unit of test.
 *
 * MARKERS — CAPABILITY, not literal spelling. Any status idiom (#dataStatus,
 * .loading-tag, .state-msg, a loading/nodata state) and any graceful-degrade idiom
 * (.catch, try/catch, a no-data/offline state) count. Adopting a single house marker
 * standard, then tightening this to literal, is #363.
 *
 * OUT OF SCOPE: that the live VALUES are correct (runtime / Tier 4). This is a
 * wiring/structure scan only, green against current behavior (RT characterization).
 *
 * TEETH (honest scope): if a live-declared page has no read path in its union —
 * a page marked `live` but never wired, or a refactor that drops the data-module
 * <script> so the closure loses SOURCE/FETCH — it reds (both verified). What a
 * union-scan CANNOT catch is a surgical single-capability break inside one shared
 * module when a consumer carries that capability redundantly; closing that gap
 * needs the literal house-marker standard (#363). This is a structural wiring
 * scan, not proof the fetch that matters still runs.
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Run via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
// House pattern (mirrors tc-routes): eval data.js with a window shim, read the block.
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-live-display');
const data = loadWindow('data.js');

// ── Denominator: SITE_INDEX entries with dataRole:"live" ─────────────────────
const SI = data.SITE_INDEX;
const live = (SI && typeof SI === 'object' && !Array.isArray(SI))
  ? Object.keys(SI).filter((k) => SI[k] && SI[k].dataRole === 'live')
  : [];

// Vacuity guard — a broken parse / dropped attribute must fail loudly, not pass empty.
r.check(live.length >= 10,
  `expected >=10 dataRole:"live" pages in SITE_INDEX, found ${live.length} (data.js parse or dataRole attribute broken?)`);

// ── Capability patterns (capability, not literal — see #363) ─────────────────
const CAP = {
  source:   /csvUrl|gviz|\/exec|docs\.google|spreadsheets/,
  fetch:    /fetch\s*\(/,
  status:   /dataStatus|data-status|state-msg|fetchStatus|\bloading\b|no-?data|nodata/i,
  fallback: /\.catch\s*\(|\bcatch\s*\(|no-?data|nodata|offline|could not|\bfailed\b/i,
};

for (const route of live) {
  const rel = route.replace(/^\//, '');           // "/index.html" -> "index.html"
  let html;
  try { html = rd(rel); }
  catch { r.check(false, `${route}: declared dataRole:"live" but the page file is missing`); continue; }

  // Depth-1 closure: the page + every local (<script src>) module it loads.
  const dir = dirname(rel);
  const scripts = [...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/g)].map((m) => m[1]);
  let union = html;
  for (const sc of scripts) {
    if (/^https?:/i.test(sc)) continue;            // CDN libs are not our read path
    const modPath = normalize(join(dir, sc));
    try { union += '\n' + rd(modPath); } catch { /* a missing local module surfaces as a missing capability below */ }
  }

  for (const [cap, re] of Object.entries(CAP)) {
    r.check(re.test(union),
      `${route}: live-display read path missing ${cap.toUpperCase()} (checked page + its loaded modules)`);
  }
}

r.done(`live-display: ${live.length} declared live pages checked (page + module-closure, capability wiring)`);
