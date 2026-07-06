#!/usr/bin/env node
/**
 * Smoke test — proves the runner discovers, executes, and reports a TC.
 * Always passes; a permanent canary that the harness itself is alive.
 * Not a real contract test (TC1 = #298).
 * @issue: 294  @tier: 0
  *
 * @covers: none (harness canary — proves the runner; owns no surface)
 */
import { makeReport } from './_assert.mjs';
const r = makeReport('smoke');
r.check(1 + 1 === 2, 'arithmetic is broken (the universe has bigger problems)');
r.done('smoke: harness alive, 1 assertion checked');
