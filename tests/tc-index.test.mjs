#!/usr/bin/env node
/**
 * Homepage — index.html standalone contract  (Tier 1 · GH #340)
 * ----------------------------------------------------------------------------
 * Characterizes the homepage as an assembly of named sections. index.html is the
 * front door; a refactor that silently drops a whole section (the graph, the
 * activity feed, a teaser) is the tooth this catches. Contract-scan over the page
 * SOURCE only — authored from the #340 written spec, never from the impl.
 *
 * This is PASS 1 of the spec's two-pass plan: STRUCTURE now (each named section is
 * present in source), content SNAPSHOT deferred to pass 2 "once frozen." So each
 * check is a presence assertion, matched robustly (disjunctive / case-insensitive)
 * so it is green against current good behavior yet red when a section is removed.
 *
 * CONTRACT (index.html source must carry each) — all must hold:
 *   1. window.PAGE_HOME present            (the homepage PAGE_* data block)
 *   2. the AgentGraph mounts               (AgentGraph reference / graph mount)
 *   3. the live GitHub activity feed mounts
 *   4. the portfolio teaser section present
 *   5. the writing list section present
 *   6. the about section present
 *
 * OUT OF SCOPE (owned elsewhere):
 *   - live-data correctness (feed/graph runtime)   → Tier 4 (#306) / #336
 *   - visual treatment                             → not tested
 *   - portfolio page internals                     → #341
 *   - content snapshot (pass 2)                     → deferred "once frozen"
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs and tests/tc1/tc-articles. Run via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

const r = makeReport('tc-index');

// 1. homepage data block — spec names it exactly (window.PAGE_HOME).
r.check(/window\.PAGE_HOME\b/.test(html) || /\bPAGE_HOME\s*=/.test(html),
  'index.html: window.PAGE_HOME data block not present');

// 2. AgentGraph mounts — the graph section by its component / mount marker.
r.check(/AgentGraph/.test(html) || /agent-?graph/i.test(html) || /graph[-_]?mount/i.test(html),
  'index.html: AgentGraph not mounted (graph section dropped?)');

// 3. live GitHub activity feed mounts.
r.check(/live-?github/i.test(html) || /activity[-_ ]?feed/i.test(html) || /github[-_ ]?feed/i.test(html),
  'index.html: live GitHub activity feed not mounted');

// 4. portfolio teaser section present.
r.check(/portfolio/i.test(html),
  'index.html: portfolio teaser section not present');

// 5. writing list section present.
r.check(/writing/i.test(html),
  'index.html: writing list section not present');

// 6. about section present.
r.check(/\babout\b/i.test(html),
  'index.html: about section not present');

r.done('index: 6 homepage sections checked (pass-1 structural presence)');
