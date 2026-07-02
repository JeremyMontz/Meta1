#!/usr/bin/env node
/**
 * TC — heart organ + journal page pair  (Tier 1 · standalone · GH #338)
 * ----------------------------------------------------------------------------
 * The heart organ (graph/heart.html) and its paired content page
 * (agents/phil/journal.html). Owns the heart-SPECIFIC render scaffold — chiefly
 * the word-cloud — that a generalized organ rule (#300) or the shared fetch
 * read-path (tc-live-display/#336) would miss.
 *
 * PAIR RESOLUTION. The contract names "graph/heart.html" and "journal.html". The
 * journal path was resolved from the declared route registry (data.js SITE_INDEX,
 * canon) to /agents/phil/journal.html (dataRole:"live") — retrieval from canon,
 * NOT reading the page implementation.
 *
 * CONTRACT (spec-only authorship; page implementations were NOT read):
 *   HEART (graph/heart.html)
 *     H1  the graph-subnav mount (#graph-subnav) is present.
 *     H2  the graph-subnav is wired active="HEART". Capability regex.
 *     H3  the page loads its data file — a *-data.js module (the house data-module
 *         convention, cf. spirit-data.js / graph/*-data.js).
 *   JOURNAL (agents/phil/journal.html)
 *     J1  the word-cloud structure is rendered (the heart-specific scaffold that
 *         filters previous entries). Capability regex.
 *
 * OUT OF SCOPE (by design): content quality; live values (Tier 4); the live fetch
 *   read-path (tc-live-display/#336 owns it, delegated by the contract). Structural
 *   wiring scan, green against current behavior (RT characterization).
 *
 * TEETH: a heart-specific (word-cloud) render regression — the journal's word-cloud
 *   removed, the heart data module unlinked, or the graph-subnav active state
 *   dropped/misrouted — reds here where a generalized organ rule would pass.
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

const r = makeReport('tc-heart');
const heart = rd('graph/heart.html');
const journal = rd('agents/phil/journal.html');

// HEART
r.check(/#graph-subnav/.test(heart),
  `heart: graph-subnav mount (#graph-subnav) missing`);
r.check(/active\s*[:=]\s*["']HEART["']/.test(heart),
  `heart: graph-subnav not wired active="HEART"`);
r.check(/<script[^>]*\bsrc=["'][^"']*-data\.js["']/.test(heart),
  `heart: does not load its data module (*-data.js)`);

// JOURNAL
r.check(/word-?cloud|wordcloud|tag-?cloud/i.test(journal),
  `journal: word-cloud structure absent`);

r.done(`heart+journal: graph-subnav(HEART) + heart data-module + journal word-cloud checked`);
