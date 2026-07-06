#!/usr/bin/env node
/**
 * Portfolio — portfolio.html standalone contract  (Tier 1 · GH #341)
 * ----------------------------------------------------------------------------
 * Characterizes portfolio.html as an assembly of named sections. A refactor that
 * silently drops the competency graph or a named section is the tooth this
 * catches. Contract-scan over the page SOURCE only — authored from the #341
 * written spec, never from the impl.
 *
 * PASS 1 of the spec's two-pass plan: STRUCTURE now (each named section present
 * in source), content SNAPSHOT deferred to pass 2. Each check is a presence
 * assertion matched robustly (disjunctive / case-insensitive) so it is green
 * against current good behavior yet red when a named section is removed.
 *
 * CONTRACT (portfolio.html source must carry each) — all must hold:
 *   1. window.PAGE_PORTFOLIO present         (the portfolio PAGE_* data block)
 *   2. hero present
 *   3. spec card present         (renders in components/PortfolioMain.jsx from data.js SPEC)
 *   4. the "What It Proves" competency graph mounts
 *   5. the live GitHub feed mounts
 *   6. the Selected Work matrix present
 *   7. the reach CTA present
 *
 * OUT OF SCOPE (owned elsewhere):
 *   - content quality                                  → not tested
 *   - the graph's evidence COMPUTE from `demonstrates`  → runtime, Tier 4 (#306)
 *   - live-feed data correctness                        → #336
 *   - content snapshot (pass 2)                          → deferred
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors
 * .github/scripts/check-links.mjs and tests/tc1/tc-index. Run via tests/run.mjs.
  *
 * @covers: portfolio.html
 * @ignores: content snapshot — pass-2 (#375)
 * @ignores: evidence-graph compute — runtime / Tier 4 (#306)
 * @ignores: live feed values — owned: #364
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const html = readFileSync(join(ROOT, 'portfolio.html'), 'utf8');
// The spec card is not named in portfolio.html — it renders in the page's main
// component (PortfolioMain.jsx), fed by data.js SPEC. Check #3 scans there.
const portfolioMain = readFileSync(join(ROOT, 'components', 'PortfolioMain.jsx'), 'utf8');

const r = makeReport('tc-portfolio');

// 1. portfolio data block — spec names it exactly (window.PAGE_PORTFOLIO).
r.check(/window\.PAGE_PORTFOLIO\b/.test(html) || /\bPAGE_PORTFOLIO\s*=/.test(html),
  'portfolio.html: window.PAGE_PORTFOLIO data block not present');

// 2. hero.
r.check(/hero/i.test(html),
  'portfolio.html: hero section not present');

// 3. spec card. Renders in components/PortfolioMain.jsx from data.js SPEC — not
//    named in portfolio.html. Anchor on the actual render (SPEC.rows loop /
//    SPEC.badge), tied to the "// SPEC" spec-card block, so dropping the render
//    turns this red (a code comment alone would not satisfy it).
r.check(
  /SPEC\.rows\b/.test(portfolioMain) &&
  (/SPEC\.badge\b/.test(portfolioMain) || /\/\/\s*SPEC\b/.test(portfolioMain)),
  'portfolio.html: spec card not present (PortfolioMain.jsx SPEC render missing)');

// 4. "What It Proves" competency graph mounts.
r.check(/what it proves/i.test(html) || /competency[-_ ]?graph/i.test(html) || /competency/i.test(html),
  'portfolio.html: "What It Proves" competency graph not mounted');

// 5. live GitHub feed mounts.
r.check(/live-?github/i.test(html) || /activity[-_ ]?feed/i.test(html) || /github[-_ ]?feed/i.test(html),
  'portfolio.html: live GitHub feed not mounted');

// 6. Selected Work matrix.
r.check(/selected[-_ ]?work/i.test(html),
  'portfolio.html: Selected Work matrix not present');

// 7. reach CTA.
r.check(/reach/i.test(html),
  'portfolio.html: reach CTA not present');

r.done('portfolio: 7 named sections checked (pass-1 structural presence)');
