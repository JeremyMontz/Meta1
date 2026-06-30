#!/usr/bin/env node
/**
 * SCRATCH validation TC — Verifier red-path probe.  NOT FOR MERGE.
 * Contract (per the linked scratch issue): the contract-test runner
 * `tests/run.mjs` MUST exist in the repository.
 * PLANTED FAULT: the assertion below is INVERTED — it fails when run.mjs
 * exists (which it does). The Verifier should classify this test-wrong and
 * dispatch a Bond-fix to restore the correct assertion (assert it DOES exist).
 */
import { existsSync } from 'node:fs';
const exists = existsSync(new URL('./run.mjs', import.meta.url));
if (exists) {
  console.error('FAIL: tests/run.mjs exists, but this TC asserts it is absent (planted fault).');
  process.exit(1);
}
console.log('ok: run.mjs absent');
