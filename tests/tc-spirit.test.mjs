#!/usr/bin/env node
/**
 * TC — spirit organ page structure + wiring  (Tier 1 · standalone · GH #337)
 * ----------------------------------------------------------------------------
 * The singular live organ page graph/spirit.html. Owns the spirit-SPECIFIC render
 * scaffold — the wiring a generalized organ-structural rule (#300) would miss.
 * Pass 1 here is structure + wiring; a content snapshot follows once the page is
 * frozen (deferred, per the #337 two-pass note).
 *
 * SEPARATION OF CONCERNS:
 *   - #300 (organ-structural) owns the GENERALIZED organ-page rule.
 *   - tc-live-display/#336 owns the shared live-data fetch READ PATH.
 *   - THIS TC (#337) owns the spirit-specific wiring: its data module, its
 *     graph-subnav active state, and its journal/lectio render structure.
 *
 * CONTRACT (spec-only authorship; the page implementation was NOT read):
 *   S1  graph/spirit.html LOADS its data module spirit-data.js (<script src>).
 *   S2  the graph-subnav mount (#graph-subnav-mount) is present.
 *   S3  the graph-subnav is wired active="SPIRIT". Capability regex, spelling-tolerant.
 *   S4  the journal/lectio structure is rendered (the spirit-specific content
 *       scaffold). Capability regex — journal or lectio.
 *
 * OUT OF SCOPE (by design): content quality; live values (Tier 4); the live fetch
 *   read-path (tc-live-display/#336 owns it). Structural wiring scan, green against
 *   current behavior (RT characterization).
 *
 * TEETH: a spirit-specific render regression — the data module unlinked, the
 *   graph-subnav active state dropped/misrouted, or the journal/lectio scaffold
 *   removed — reds here where a generalized organ rule would pass.
 *
 * Confidence/source per assertion recorded in the authoring [Bond] comment.
 * Zero-dep (node stdlib only), exit 1 on any failure. Mirrors tc2 / tc-live-display.
 * Run directly or via tests/run.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

const r = makeReport('tc-spirit');
const spirit = rd('graph/spirit.html');

// S1 — loads its data module
r.check(/<script[^>]*\bsrc=["'][^"']*spirit-data\.js["']/.test(spirit),
  `spirit: does not load its data module spirit-data.js`);

// S2 — graph-subnav mount
r.check(/graph-subnav-mount/.test(spirit) && /<GraphSubnav\b/.test(spirit),
  `spirit: graph-subnav mount (#graph-subnav-mount / <GraphSubnav>) missing`);

// S3 — graph-subnav wired active="SPIRIT"
r.check(/active\s*[:=]\s*["']SPIRIT["']/.test(spirit),
  `spirit: graph-subnav not wired active="SPIRIT"`);

// S4 — journal/lectio render structure
r.check(/journal|lectio/i.test(spirit),
  `spirit: journal/lectio render structure absent`);

r.done(`spirit: data-module + graph-subnav(SPIRIT) + journal/lectio scaffold checked`);
