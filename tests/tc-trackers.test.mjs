#!/usr/bin/env node
/**
 * TC — house tracker pages structure + wiring  (Tier 1 · standalone · GH #343)
 * ----------------------------------------------------------------------------
 * The three house tracker pages are TC1-EXEMPT (no shared chrome), so the
 * universal-chrome contract (TC1/#298) never touches them — they need their own
 * structural coverage. This TC provides it: the form + Gantt render, the GAS
 * webhook wiring, and the specific budget columns / Gantt controls the contract
 * names verbatim.
 *
 * CONTRACT (spec-only authorship; page implementations were NOT read — all markers
 * are taken verbatim from the #343 contract):
 *   BUDGET (agents/house/house-budget.html)
 *     B1  budget column #wh-spent present
 *     B2  budget column #bm-total present
 *     B3  a GAS webhook URL present (the read wiring)
 *   ENTRY (agents/house/house-entry.html)
 *     E1  a form renders (<form>)
 *     E2  a GAS webhook URL present (the write wiring)
 *   TIMELINE (agents/house/house-timeline.html)
 *     T1  a Gantt renders
 *     T2  Gantt control #toggleMilestones present
 *     T3  Gantt control #toggleDeps present
 *     T4  Gantt control #ganttScroll present
 *     T5  a GAS webhook URL present (the read wiring)
 *
 * Element-id markers are matched as bare tokens (spelling-tolerant): they match
 * whether referenced as id="wh-spent" or getElementById('wh-spent'). These pages
 * are self-contained (no shared chrome), so the page HTML — including its inline
 * scripts — is the unit of test; no module closure needed.
 *
 * OUT OF SCOPE (by design): computed values; runtime behavior. Structural wiring
 *   scan, green against current behavior (RT characterization).
 *
 * TEETH: a tracker that lost its GAS wiring or one of its named controls/columns
 *   in a refactor reds.
 *
 * Confidence/source per assertion recorded in the authoring [Bond] comment.
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tc2 / tc-live-display.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));

// GAS webhook: a Google Apps Script /exec endpoint (same source idiom as tc-live-display).
const GAS = /script\.google\.com\/macros|\/exec\b/;

const r = makeReport('tc-trackers');

function page(rel) {
  if (!has(rel)) { r.check(false, `${rel}: tracker page missing`); return null; }
  return rd(rel);
}

// BUDGET
const budget = page('agents/house/house-budget.html');
if (budget != null) {
  r.check(/wh-spent/.test(budget), `house-budget: budget column #wh-spent missing`);
  r.check(/bm-total/.test(budget), `house-budget: budget column #bm-total missing`);
  r.check(GAS.test(budget), `house-budget: GAS webhook URL missing`);
}

// ENTRY
const entry = page('agents/house/house-entry.html');
if (entry != null) {
  r.check(/<form\b/i.test(entry), `house-entry: form does not render`);
  r.check(GAS.test(entry), `house-entry: GAS webhook URL missing`);
}

// TIMELINE
const timeline = page('agents/house/house-timeline.html');
if (timeline != null) {
  r.check(/gantt/i.test(timeline), `house-timeline: Gantt does not render`);
  r.check(/toggleMilestones/.test(timeline), `house-timeline: control #toggleMilestones missing`);
  r.check(/toggleDeps/.test(timeline), `house-timeline: control #toggleDeps missing`);
  r.check(/ganttScroll/.test(timeline), `house-timeline: control #ganttScroll missing`);
  r.check(GAS.test(timeline), `house-timeline: GAS webhook URL missing`);
}

r.done(`house trackers: budget columns + entry form + Gantt controls + GAS wiring checked (3 pages)`);
