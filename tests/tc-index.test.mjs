#!/usr/bin/env node
/**
 * Homepage — index.html standalone contract  (Tier 1 · GH #340)
 * ----------------------------------------------------------------------------
 * Characterizes the homepage as an assembly of named sections. The homepage is
 * TWO files: index.html is the shell (loads data + mounts <HomeMain/>), and
 * components/HomeMain.jsx COMPOSES the sections. A refactor that silently drops
 * a whole section is the tooth this catches — and, per #361, "dropped" includes
 * a section left DEFINED but never MOUNTED. So the section checks are
 * mount-aware: they assert the JSX element is actually rendered (`<Component`),
 * not merely that a definition or a bare string exists somewhere in source.
 *
 * Authored from the #340 written spec (AMENDED 2026-06-30: the about section was
 * intentionally moved to about/ai.html, so it is NO LONGER a homepage section —
 * see Bug #361, which this rewrite resolves). Contract-scan over SOURCE only;
 * the page is never run.
 *
 * PASS 1 of the spec's two-pass plan: STRUCTURE now (each named section mounts),
 * content SNAPSHOT deferred to pass 2 "once frozen."
 *
 * CONTRACT — all must hold:
 *   index.html (shell):
 *     1. window.PAGE_HOME present                    (the homepage PAGE_* data block)
 *     2. renders <HomeMain/> AND loads its source    (shell actually mounts the page)
 *   components/HomeMain.jsx (composition — mount-aware, the #361 teeth):
 *     3. the agent graph is mounted                  (<AgentGraph)
 *     4. the live GitHub activity feed is mounted    (<LiveActivity)
 *     5. the portfolio teaser is mounted             (<PortfolioTeaser)
 *     6. the writing list is mounted                 (<WritingList)
 *
 * OUT OF SCOPE (owned elsewhere):
 *   - the about page                                 → about/*.html (#344)
 *   - live-data correctness (feed/graph runtime)     → Tier 4 (#306) / #336
 *   - visual treatment                               → not tested
 *   - portfolio page internals                       → #341
 *   - content snapshot (pass 2)                       → deferred "once frozen"
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs. Run via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const home = readFileSync(join(ROOT, 'components/HomeMain.jsx'), 'utf8');

const r = makeReport('tc-index');

// ── index.html shell ────────────────────────────────────────────────────────
// 1. homepage data block — spec names it exactly (window.PAGE_HOME).
r.check(/window\.PAGE_HOME\b/.test(html) || /\bPAGE_HOME\s*=/.test(html),
  'index.html: window.PAGE_HOME data block not present');

// 2. shell mounts the homepage component — renders <HomeMain/> AND loads its source.
//    Both halves matter: rendering without loading (or vice-versa) is a broken shell.
r.check(/<HomeMain\b/.test(html) && /components\/HomeMain\.jsx/.test(html),
  'index.html: shell must render <HomeMain/> and load components/HomeMain.jsx');

// ── components/HomeMain.jsx composition (mount-aware — the #361 teeth) ─────────
// A section counts as present only when it is MOUNTED (`<Component` in the render
// tree), not merely defined. #361: AboutBlock was fully defined yet never mounted,
// so the rendered homepage silently lost that section while a source-grep stayed
// green. A definition (`const X = () =>`) carries no leading `<`, so these
// patterns match mount usage only — catching define-but-don't-mount regressions.

// 3. the agent graph is mounted (the centerpiece).
r.check(/<AgentGraph\b/.test(home),
  'HomeMain.jsx: <AgentGraph/> not mounted (graph section dropped?)');

// 4. the live GitHub activity feed is mounted.
r.check(/<LiveActivity\b/.test(home),
  'HomeMain.jsx: <LiveActivity/> not mounted (activity feed dropped?)');

// 5. the portfolio teaser is mounted.
r.check(/<PortfolioTeaser\b/.test(home),
  'HomeMain.jsx: <PortfolioTeaser/> not mounted (portfolio teaser dropped?)');

// 6. the writing list is mounted.
r.check(/<WritingList\b/.test(home),
  'HomeMain.jsx: <WritingList/> not mounted (writing list dropped?)');

r.done('index: shell + 4 mounted homepage sections checked (pass-1, mount-aware)');
