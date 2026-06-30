#!/usr/bin/env node
/**
 * SCRATCH validation TC — Verifier red-path probe.  NOT FOR MERGE.
 * Contract (per the linked scratch issue): the contract-test runner
 * `tests/run.mjs` MUST exist in the repository.
 * Assertion corrected to match the spec: this TC passes when run.mjs
 * exists (which it does) and fails only if it is absent.
 */
import { existsSync } from 'node:fs';
const exists = existsSync(new URL('./run.mjs', import.meta.url));
if (!exists) {
  console.error('FAIL: tests/run.mjs does not exist, but the spec requires it to be present.');
  process.exit(1);
}
console.log('ok: tests/run.mjs exists');
