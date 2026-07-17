#!/usr/bin/env node
// scripts/validate-immune-feed.mjs
// -----------------------------------------------------------------------------
// Publish gate for the immune feed (#446). Loads a `window.IMMUNE = {...}` feed
// file — the artifact scripts/pipeline-metrics.mjs writes — runs the shared v1
// validator (scripts/immune-schema.mjs), and exits non-zero on ANY drift so the
// immune-metrics workflow FAILS before its "Publish feed to metrics-data" step.
// A malformed feed therefore never reaches the metrics-data branch (and never
// silently degrades graph/immune.html to "data missing").
//
// The generator pushes straight to metrics-data, skipping the PR CI gate, so
// this step is the only check standing between a drifted feed and the live page.
//
// RUN.  node scripts/validate-immune-feed.mjs <path-to-immune-data.js>
// Zero deps (node stdlib only). exit 0 = valid, 1 = drift/load error, 2 = usage.
import { readFileSync } from 'node:fs';
import { validateImmuneV1 } from './immune-schema.mjs';

const path = process.argv[2];
if (!path) {
  console.error('usage: node scripts/validate-immune-feed.mjs <path-to-immune-data.js>');
  process.exit(2);
}

// House loadWindow pattern (mirrors the contract TCs): eval the feed with a
// window shim and read the block. Feed modules touch only `window`.
let IM;
try {
  const src = readFileSync(path, 'utf8');
  const win = {};
  new Function('window', src)(win);
  IM = win.IMMUNE;
} catch (err) {
  console.error(`immune feed validation: cannot load ${path} — ${err.message}`);
  process.exit(1);
}

const fails = validateImmuneV1(IM);
if (fails.length) {
  console.error(`immune feed validation: ${fails.length} v1 schema failure(s) in ${path}`);
  for (const f of fails) console.error(`  x ${f}`);
  console.error('feed NOT published — fix the generator (scripts/pipeline-metrics.mjs) or reconcile the v1 schema.');
  process.exit(1);
}
console.log(`immune feed validation: ${path} satisfies the window.IMMUNE v1 schema (I1–I10) — ok to publish.`);
