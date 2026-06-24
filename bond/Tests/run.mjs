#!/usr/bin/env node
/**
 * Contract test runner (CI) — bond/Tests/run.mjs
 * ----------------------------------------------------------------------------
 * Discovers every *.test.mjs under bond/Tests/, runs each in an ISOLATED child
 * process (so one TC's throw or process.exit cannot abort the batch), captures
 * exit code + output, prints an aggregate report, and exits non-zero if any TC
 * failed OR if the bench is empty (an empty bench is a misconfiguration, not a
 * pass). Each TC is a standalone zero-dep node script that exits 1 on failure,
 * 0 on pass — same convention as .github/scripts/check-links.mjs. Files whose
 * basename starts with "_" are helpers, not TCs, and are skipped.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const TEST_DIR = join(ROOT, 'bond', 'Tests');
const isTest = (n) => n.endsWith('.test.mjs') && !basename(n).startsWith('_');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (isTest(e)) out.push(p);
  }
  return out;
}

console.log('── Contract tests ─────────────────');

let tests = [];
try { tests = walk(TEST_DIR); }
catch (err) { console.error(`cannot read ${relative(ROOT, TEST_DIR)} — ${err.message}`); process.exit(1); }

if (tests.length === 0) {
  console.error('no *.test.mjs found in bond/Tests — empty bench is a misconfiguration.');
  process.exit(1);
}

let failed = 0;
for (const file of tests.sort()) {
  const t0 = Date.now();
  const res = spawnSync('node', [file], { cwd: ROOT, encoding: 'utf8' });
  const ms = Date.now() - t0;
  const ok = res.status === 0 && !res.error;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${basename(file)}  (${ms}ms)`);
  if (!ok) {
    const out = `${res.stdout || ''}${res.stderr || ''}`.trimEnd();
    if (res.error) console.log(`        spawn error: ${res.error.message}`);
    for (const line of out.split('\n')) if (line) console.log(`        ${line}`);
  }
}

console.log('─'.repeat(48));
console.log(`Contract tests: ${tests.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
