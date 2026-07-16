#!/usr/bin/env node
/**
 * data.js integrity guard (CI)
 * ----------------------------------------------------------------------------
 * data.js and the graph/*-data.js files power every page on the site. A single
 * syntax slip (stray comma, unclosed bracket) takes down all of them at once,
 * silently, until someone opens a page. This check fails the build instead.
 *
 * Two assertions, both cheap:
 *   1. PARSE  - every data file evaluates without throwing (syntax errors).
 *   2. SHAPE  - the root data.js exposes its expected window.* sections
 *               (catches truncation / a section deleted by accident).
 *
 * It deliberately does NOT police content (e.g. empty [LABEL, ] value slots) -
 * those are authoring choices, not breakage.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const DATA_FILES = [
  'data.js',
  'graph/brain-data.js',
  'graph/heart-data.js',
  'graph/memory-data.js',
  'graph/spirit-data.js',
];

// Core sections that must exist in root data.js. STATS / SITE_INDEX sit near
// the end of the file, so requiring them also catches a truncated upload.
const REQUIRED_SECTIONS = [
  'SITE', 'ME', 'NOW', 'PORTFOLIO', 'ARTICLES',
  'PROJECTS', 'AGENTS', 'LEVELS', 'AGENT_ARTIFACTS', 'SITE_INDEX', 'STATS', 'TESTS', 'SKILLS',
];

const errors = [];
const sandbox = { window: {}, document: {}, console, navigator: {} };
const context = vm.createContext(sandbox);

for (const file of DATA_FILES) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    errors.push(`MISSING FILE: ${file}`);
    continue;
  }
  try {
    vm.runInContext(src, context, { filename: file });
    console.log(`  ok   parsed ${file}`);
  } catch (e) {
    errors.push(`PARSE ERROR in ${file}: ${e.message}`);
  }
}

for (const key of REQUIRED_SECTIONS) {
  if (!(key in sandbox.window)) {
    errors.push(`MISSING SECTION: window.${key} (expected in data.js)`);
  }
}

if (errors.length) {
  console.error('\ndata.js integrity check FAILED:');
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}
console.log('\ndata.js integrity OK - all files parse, all sections present.');
