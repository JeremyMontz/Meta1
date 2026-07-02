#!/usr/bin/env node
/**
 * GitHub activity-feed read-path wiring  (Tier 1 · cross-cutting · GH #364)
 * ----------------------------------------------------------------------------
 * Sibling of tc-live-display (#336), SAME capability shape, DIFFERENT source.
 * #336 owns the Sheet/webhook live path (csvUrl/gviz + GAS /exec) and explicitly
 * scopes the GitHub *activity feed* OUT, tracked here. The GitHub feed is a second
 * live source — the GitHub API, surfaced via components/live-github.jsx +
 * LiveActivity.jsx — so a feed-fetch regression must not silently blank the
 * activity panel on a consuming page.
 *
 * DENOMINATOR — declared, not discovered (explicit for now). The consumers are the
 * pair confirmed in the #364 contract + Jeremy's 2026-07-02 resolution comment:
 *   /index.html      — a live GitHub activity LOG
 *   /portfolio.html  — a live GitHub activity CHART (portfolio.html #197 redesign
 *                      is closed/live; it does mount the feed today)
 * WHY an explicit const rather than a SITE_INDEX key: #336's mechanism keys off
 * `dataRole:"live"`, but that value marks the Sheet/webhook contract (index.html
 * already carries it, portfolio.html carries no dataRole at all) and reusing it
 * would false-red the 10+ Sheet-only pages that have no GitHub read path. SITE_INDEX
 * carries no GitHub-source attribute today, and Bond commits only the test file
 * (cannot edit data.js). DURABLE HOME (Meta1-Build follow-up): add a declared
 * GitHub-source marker to SITE_INDEX (e.g. a `liveSources` list or a github-aware
 * dataRole), then flip DENOMINATOR below from the literal pair to that declared set
 * — self-maintaining like tc-live-display / tc-webform. Until then the pair is the
 * declaration, and it is authoritative (Jeremy-confirmed), not discovered.
 *
 * CONTRACT — for each consumer, the page TOGETHER WITH the local modules it loads
 * (`<script src>` closure, depth 1 — mirrors #336) must carry all four:
 *   1. a GitHub SOURCE    — api.github.com / a /stats/ endpoint / the live-github
 *                           (LiveActivity) feed module by name
 *   2. a FETCH            — fetch(
 *   3. a STATUS indicator — loading/error state (any idiom)
 *   4. a graceful FALLBACK — empty/error state on failure (any idiom)
 *
 * MARKERS — CAPABILITY, not literal spelling (same philosophy as #336). Any status
 * idiom and any graceful-degrade idiom count; adopting one house marker standard and
 * tightening to literal is the shared #363 follow-up.
 *
 * OUT OF SCOPE: that the live feed VALUES are correct (runtime / Tier 4). This is a
 * wiring/structure scan only, GREEN against current behavior (RT characterization).
 *
 * TEETH: if a declared consumer's union loses the GitHub read path — a page that
 * stops mounting live-github / drops the module <script> so the closure loses
 * SOURCE or FETCH — it reds. What a union-scan cannot catch is a surgical single-
 * capability break inside a shared module a consumer carries redundantly (the #363
 * literal-marker gap, inherited from #336).
 *
 * CONFIDENCE / PROVENANCE: authored spec-only (never read src). The SOURCE assertion
 * is [Confidence: Medium · Inferred] — the spec names live-github.jsx / LiveActivity
 * and api.github.com as the source, but whether each page exposes them within the
 * depth-1 <script src> closure vs. a deeper import is impl-detail I did not read;
 * CI + the Verifier are the verdict. DENOMINATOR + capability shape are
 * [Confidence: High · Retrieved from #364 body + Jeremy 2026-07-02].
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Run via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

const r = makeReport('tc-github-activity');

// ── Denominator: declared consumers of the GitHub activity feed (see header) ──
const CONSUMERS = ['/index.html', '/portfolio.html'];

// Vacuity guard — the declaration must be non-empty (a bad edit to the pair fails
// loudly rather than passing an empty scan).
r.check(CONSUMERS.length >= 2,
  `expected >=2 declared GitHub-feed consumers, found ${CONSUMERS.length}`);

// ── Capability patterns (capability, not literal — see #363) ─────────────────
// SOURCE is GitHub-specific (this is what separates #364 from #336's Sheet source).
const CAP = {
  source:   /api\.github\.com|\/stats\/|githubusercontent|live-github|LiveActivity/i,
  fetch:    /fetch\s*\(/,
  status:   /dataStatus|data-status|state-msg|fetchStatus|\bloading\b|no-?data|nodata/i,
  fallback: /\.catch\s*\(|\bcatch\s*\(|no-?data|nodata|offline|could not|\bfailed\b/i,
};

for (const route of CONSUMERS) {
  const rel = route.replace(/^\//, '');           // "/index.html" -> "index.html"
  let html;
  try { html = rd(rel); }
  catch { r.check(false, `${route}: declared GitHub-feed consumer but the page file is missing`); continue; }

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
      `${route}: GitHub activity-feed read path missing ${cap.toUpperCase()} (checked page + its loaded modules)`);
  }
}

r.done(`github-activity: ${CONSUMERS.length} declared consumers checked (page + module-closure, GitHub read-path wiring)`);
