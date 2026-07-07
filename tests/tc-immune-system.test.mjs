#!/usr/bin/env node
/**
 * TC — immune-system data feed: window.IMMUNE schema  (Tier 1 · standalone · GH #380)
 * ----------------------------------------------------------------------------
 * The committed data artifact graph/immune-data.js, produced by the pipeline-metrics
 * script (#380) and consumed by the future immune-system organ page (#318). This TC
 * owns the SCHEMA CONTRACT of window.IMMUNE — the v1 shape the page reads — which the
 * Tier-0 `data.js integrity` check (parse + root-data.js sections only) does not police
 * for this file. Structure / presence / wiring only; every metric VALUE is data the
 * script recomputes each run and is therefore out of contract.
 *
 * CONTRACT (spec-only authorship; graph/immune-data.js and scripts/pipeline-metrics.mjs
 * were NOT read — asserted from the "Schema v1 — window.IMMUNE" block in the #380 body):
 *   I1  the file defines a single window.IMMUNE object.
 *   I2  schemaVersion === 1 (the schema-identity discriminator the page branches on;
 *       a protocol version, not editorial content).
 *   I3  generatedAt is an ISO-8601 string (shape, not a value).
 *   I4  bench is an array; every entry carries { id, issue, title, protects }. Present
 *       and non-empty (the standing corpus always exists — RT characterization).
 *   I5  counters is an object exposing benchSize, storiesShipped, redsCaught,
 *       verifierEngagements (numbers) and escalations { specGap, thrashCap, bugFiled }
 *       (numbers). Keys present + numeric type — never the counts themselves.
 *   I6  autonomy is an object with numeric agentEvents + humanEvents.
 *   I7  stories is an array; every entry carries { issue, lane, rounds, wallClockHours,
 *       overnight }, with lane in {"story","rt"} (spec enum) and overnight a boolean.
 *   I8  pulse is an array (spec: last <=20 required-check runs); every entry carries
 *       { pr, check, conclusion }.
 *   I9  current is an object with temperature in {"normal","elevated","fever"},
 *       whiteCell in {"dormant","engaged"} (spec enums), and blockedIssues an array.
 *   I10 record is an array; every entry carries { type, issue, date, title }.
 *
 * OUT OF SCOPE (by design): every counter/metric VALUE and every array LENGTH beyond
 *   bench-non-empty (recomputed each run — data, not contract); the acceptance
 *   spot-checks in the #380 body (e.g. "#353 appears as bug-filed", "tc-articles in
 *   bench with issue 332") are human/Meta1 validation of the SCRIPT, not standing test
 *   assertions — hardcoding them would red the bench on the next recompute; the future
 *   immune organ page graph/immune.html (owned by #318, will amend this TC); the
 *   pipeline-metrics.mjs script internals.
 *
 * TEETH: a schema-shape regression — a top-level section dropped, an entry-shape key
 *   removed, schemaVersion drift, or an enum field emitting an undeclared token — reds
 *   here where the Tier-0 parse check (syntactic only) passes. Enum-membership and the
 *   schemaVersion identity are spec-normative value DOMAINS, not editorial content
 *   [Confidence: Medium · Inferred from the #380 normative schema block].
 *
 * Confidence/source per assertion recorded in the authoring [Bond] comment.
 * Zero-dep (node stdlib only), exit 1 on any failure. House loadWindow pattern
 * (mirrors tc-live-display / tc-routes). Run directly or via tests/run.mjs.
 *
 * @covers: graph/immune-data.js (window.IMMUNE schema v1)
 * @ignores: metric values + array lengths — runtime / recomputed data
 * @ignores: graph/immune.html (organ page) — owned: #318
 * @ignores: acceptance spot-checks (history-coupled) — editorial
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeReport } from './_assert.mjs';

const ROOT = process.cwd();
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

// House pattern (mirrors tc-live-display / tc-routes): eval the data file with a
// window shim and read the block. Data modules touch only `window`.
function loadWindow(path) { const win = {}; new Function('window', rd(path))(win); return win; }

const r = makeReport('tc-immune-system');
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const hasKeys = (o, keys) => isObj(o) && keys.every((k) => k in o);

const win = loadWindow('graph/immune-data.js');
const IM = win.IMMUNE;

// I1 — single window.IMMUNE object
r.check(isObj(IM), 'window.IMMUNE is not defined as an object');

if (isObj(IM)) {
  // I2 — schema identity
  r.check(IM.schemaVersion === 1, 'schemaVersion is not === 1 (schema-v1 discriminator)');

  // I3 — generatedAt ISO-8601 string (shape, not value)
  r.check(typeof IM.generatedAt === 'string' &&
          !Number.isNaN(Date.parse(IM.generatedAt)) &&
          /^\d{4}-\d{2}-\d{2}T/.test(IM.generatedAt),
    'generatedAt is not an ISO-8601 string');

  // I4 — bench: array of { id, issue, title, protects }, present + non-empty
  r.check(Array.isArray(IM.bench) && IM.bench.length > 0,
    'bench is not a non-empty array');
  if (Array.isArray(IM.bench)) {
    r.check(IM.bench.every((e) => hasKeys(e, ['id', 'issue', 'title', 'protects'])),
      'a bench entry is missing one of { id, issue, title, protects }');
  }

  // I5 — counters object + numeric fields + escalations sub-object
  r.check(hasKeys(IM.counters, ['benchSize', 'storiesShipped', 'redsCaught',
                                'escalations', 'verifierEngagements']),
    'counters is missing a required key');
  if (isObj(IM.counters)) {
    r.check(isNum(IM.counters.benchSize) && isNum(IM.counters.storiesShipped) &&
            isNum(IM.counters.redsCaught) && isNum(IM.counters.verifierEngagements),
      'a counters scalar (benchSize/storiesShipped/redsCaught/verifierEngagements) is not numeric');
    r.check(hasKeys(IM.counters.escalations, ['specGap', 'thrashCap', 'bugFiled']) &&
            isNum(IM.counters.escalations.specGap) &&
            isNum(IM.counters.escalations.thrashCap) &&
            isNum(IM.counters.escalations.bugFiled),
      'counters.escalations is missing a numeric { specGap, thrashCap, bugFiled }');
  }

  // I6 — autonomy { agentEvents, humanEvents } numeric
  r.check(hasKeys(IM.autonomy, ['agentEvents', 'humanEvents']) &&
          isNum(IM.autonomy.agentEvents) && isNum(IM.autonomy.humanEvents),
    'autonomy is missing numeric { agentEvents, humanEvents }');

  // I7 — stories: array of { issue, lane, rounds, wallClockHours, overnight }
  r.check(Array.isArray(IM.stories), 'stories is not an array');
  if (Array.isArray(IM.stories)) {
    r.check(IM.stories.every((s) =>
        hasKeys(s, ['issue', 'lane', 'rounds', 'wallClockHours', 'overnight']) &&
        (s.lane === 'story' || s.lane === 'rt') &&
        typeof s.overnight === 'boolean'),
      'a stories entry violates its shape (keys / lane in {story,rt} / overnight boolean)');
  }

  // I8 — pulse: array (spec cap: last <=20) of { pr, check, conclusion }
  r.check(Array.isArray(IM.pulse) && IM.pulse.length <= 20,
    'pulse is not an array of at most 20 entries');
  if (Array.isArray(IM.pulse)) {
    r.check(IM.pulse.every((p) => hasKeys(p, ['pr', 'check', 'conclusion'])),
      'a pulse entry is missing one of { pr, check, conclusion }');
  }

  // I9 — current: temperature / whiteCell enums + blockedIssues array
  r.check(isObj(IM.current) &&
          ['normal', 'elevated', 'fever'].includes(IM.current.temperature) &&
          ['dormant', 'engaged'].includes(IM.current.whiteCell) &&
          Array.isArray(IM.current.blockedIssues),
    'current is missing temperature/whiteCell enum or blockedIssues array');

  // I10 — record: array of { type, issue, date, title }
  r.check(Array.isArray(IM.record), 'record is not an array');
  if (Array.isArray(IM.record)) {
    r.check(IM.record.every((e) => hasKeys(e, ['type', 'issue', 'date', 'title'])),
      'a record entry is missing one of { type, issue, date, title }');
  }
}

r.done('immune-data: window.IMMUNE v1 schema — top-level sections + entry shapes + spec enums checked');
