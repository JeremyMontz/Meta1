#!/usr/bin/env node
/**
 * [DRILL #408] parity contract — throwaway TC for the #303 red-join validation.
 * Asserts drill/parity.mjs label(n): even -> 'even', odd -> 'odd'. Do not merge.
 * @issue: 408  @tier: 0
 *
 * @covers: none (drill fixture — throwaway; owns no published surface)
 */
import { makeReport } from './_assert.mjs';
import { label } from '../drill/parity.mjs';
const r = makeReport('tc-drill');
r.check(label(2) === 'even', "label(2) should be 'even'");
r.check(label(4) === 'even', "label(4) should be 'even'");
r.check(label(3) === 'odd',  "label(3) should be 'odd'");
r.check(label(7) === 'odd',  "label(7) should be 'odd'");
r.done('tc-drill: parity contract, 4 assertions checked');
