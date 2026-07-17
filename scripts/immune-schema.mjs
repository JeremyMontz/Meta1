// scripts/immune-schema.mjs
// -----------------------------------------------------------------------------
// window.IMMUNE v1 schema validator — the SINGLE SOURCE OF TRUTH for "valid v1"
// (#446). Extracted from the I1–I10 shape-check formerly inline in
// tests/tc-immune-system.test.mjs so ONE definition of the v1 shape can be shared
// by two consumers:
//   - the committed-fixture contract test (guards what the PAGE expects), and
//   - the immune-metrics workflow publish gate (guards what the PIPELINE emits,
//     before the feed reaches the metrics-data branch).
//
// SHAPE ONLY — keys present, value TYPES, and the spec enum domains
// (schemaVersion, lane, temperature, whiteCell). Metric VALUES and array LENGTHS
// are recomputed data, never contract, and are never asserted here.
//
// Zero deps (node stdlib only). Pure: validateImmuneV1(IM) -> string[] of failure
// messages (an empty array means the object satisfies I1–I10). No throwing, no
// process exit — callers decide how to report. Keep in lockstep with the
// window.IMMUNE v1 schema if it evolves.

export const isObj   = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isNum   = (v) => typeof v === 'number' && Number.isFinite(v);
export const hasKeys = (o, keys) => isObj(o) && keys.every((k) => k in o);

// Validate a window.IMMUNE v1 object. Returns an array of human-readable failure
// messages; an empty array means the object satisfies the I1–I10 shape contract.
export function validateImmuneV1(IM) {
  const fails = [];
  const check = (cond, msg) => { if (!cond) fails.push(msg); };

  // I1 — single window.IMMUNE object
  check(isObj(IM), 'window.IMMUNE is not defined as an object');
  if (!isObj(IM)) return fails;   // nothing further is decidable

  // I2 — schema identity
  check(IM.schemaVersion === 1, 'schemaVersion is not === 1 (schema-v1 discriminator)');

  // I3 — generatedAt ISO-8601 string (shape, not value)
  check(typeof IM.generatedAt === 'string' &&
    !Number.isNaN(Date.parse(IM.generatedAt)) &&
    /^\d{4}-\d{2}-\d{2}T/.test(IM.generatedAt),
    'generatedAt is not an ISO-8601 string');

  // I4 — bench: array of { id, issue, title, protects }, present + non-empty
  check(Array.isArray(IM.bench) && IM.bench.length > 0,
    'bench is not a non-empty array');
  if (Array.isArray(IM.bench)) {
    check(IM.bench.every((e) => hasKeys(e, ['id', 'issue', 'title', 'protects'])),
      'a bench entry is missing one of { id, issue, title, protects }');
  }

  // I5 — counters object + numeric fields + escalations sub-object
  check(hasKeys(IM.counters, ['benchSize', 'storiesShipped', 'redsCaught',
    'escalations', 'verifierEngagements']),
    'counters is missing a required key');
  if (isObj(IM.counters)) {
    check(isNum(IM.counters.benchSize) && isNum(IM.counters.storiesShipped) &&
      isNum(IM.counters.redsCaught) && isNum(IM.counters.verifierEngagements),
      'a counters scalar (benchSize/storiesShipped/redsCaught/verifierEngagements) is not numeric');
    check(hasKeys(IM.counters.escalations, ['specGap', 'thrashCap', 'bugFiled']) &&
      isNum(IM.counters.escalations.specGap) &&
      isNum(IM.counters.escalations.thrashCap) &&
      isNum(IM.counters.escalations.bugFiled),
      'counters.escalations is missing a numeric { specGap, thrashCap, bugFiled }');
  }

  // I6 — autonomy { agentEvents, humanEvents } numeric
  check(hasKeys(IM.autonomy, ['agentEvents', 'humanEvents']) &&
    isNum(IM.autonomy.agentEvents) && isNum(IM.autonomy.humanEvents),
    'autonomy is missing numeric { agentEvents, humanEvents }');

  // I7 — stories: array of { issue, lane, rounds, wallClockHours, overnight }
  check(Array.isArray(IM.stories), 'stories is not an array');
  if (Array.isArray(IM.stories)) {
    check(IM.stories.every((s) =>
      hasKeys(s, ['issue', 'lane', 'rounds', 'wallClockHours', 'overnight']) &&
      (s.lane === 'story' || s.lane === 'rt') &&
      typeof s.overnight === 'boolean'),
      'a stories entry violates its shape (keys / lane in {story,rt} / overnight boolean)');
  }

  // I8 — pulse: array (spec cap: last <=20) of { pr, check, conclusion }
  check(Array.isArray(IM.pulse) && IM.pulse.length <= 20,
    'pulse is not an array of at most 20 entries');
  if (Array.isArray(IM.pulse)) {
    check(IM.pulse.every((p) => hasKeys(p, ['pr', 'check', 'conclusion'])),
      'a pulse entry is missing one of { pr, check, conclusion }');
  }

  // I9 — current: temperature / whiteCell enums + blockedIssues array
  check(isObj(IM.current) &&
    ['normal', 'elevated', 'fever'].includes(IM.current.temperature) &&
    ['dormant', 'engaged'].includes(IM.current.whiteCell) &&
    Array.isArray(IM.current.blockedIssues),
    'current is missing temperature/whiteCell enum or blockedIssues array');

  // I10 — record: array of { type, issue, date, title }
  check(Array.isArray(IM.record), 'record is not an array');
  if (Array.isArray(IM.record)) {
    check(IM.record.every((e) => hasKeys(e, ['type', 'issue', 'date', 'title'])),
      'a record entry is missing one of { type, issue, date, title }');
  }

  return fails;
}
