#!/usr/bin/env node
/**
 * Colophon data — window.COLOPHON structure & presence  (Tier 1 · GH #410)
 * ----------------------------------------------------------------------------
 * Structural contract over the site-metadata data section a footer / about page
 * can later read. data.js is loaded under a window shim and its COLOPHON block
 * READ at run time; the implementation is never inspected to author the
 * assertions (authored spec-only from the #410 contract). Presence & shape only
 * — every value is editorial (never asserted) per the global default (#403).
 *
 * CONTRACT (#410 schema v1)
 *   window.COLOPHON exists and is a plain object with:
 *     - schemaVersion : a number
 *     - stack         : a non-empty array of non-empty strings
 *     - repo          : a non-empty string
 *     - updated       : a non-empty string
 *
 * SCOPE: the window.COLOPHON data section only.
 * OUT OF SCOPE:
 *   - the VALUES of any field (stack entries, repo slug, timestamp) — editorial
 *   - data.js window.* section presence in general -> data.js-integrity CI
 *   - anything that renders COLOPHON (no consumer exists yet — data half only)
 *
 * Zero-dep (node stdlib only), exit 1 on any failure. Run via tests/run.mjs.
 *
 * @covers: data.js (window.COLOPHON structure & presence)
 * @ignores: COLOPHON field values (stack entries, repo, updated) — editorial
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-colophon');
const data = loadWindow('data.js');
const c = data.COLOPHON;

const isPlainObject = (o) => o != null && typeof o === 'object' && !Array.isArray(o);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

// presence + shape
r.check(isPlainObject(c), 'window.COLOPHON is missing or not a plain object');

if (isPlainObject(c)) {
  r.check(typeof c.schemaVersion === 'number', 'COLOPHON.schemaVersion must be a number');

  r.check(Array.isArray(c.stack), 'COLOPHON.stack must be an array');
  if (Array.isArray(c.stack)) {
    r.check(c.stack.length > 0, 'COLOPHON.stack must be non-empty');
    r.check(c.stack.every(isNonEmptyString), 'COLOPHON.stack entries must all be non-empty strings');
  }

  r.check(isNonEmptyString(c.repo), 'COLOPHON.repo must be a non-empty string');
  r.check(isNonEmptyString(c.updated), 'COLOPHON.updated must be a non-empty string');
}

r.done('colophon: window.COLOPHON present; schemaVersion/stack/repo/updated shape asserted (values editorial, unasserted)');
