#!/usr/bin/env node
/**
 * TC — immune system: window.IMMUNE feed + organ-page wiring (Tier 1 · standalone · GH #380)
 * ----------------------------------------------------------------------------
 * Two contracts, one surface family. (1) The window.IMMUNE v1 SCHEMA CONTRACT —
 * the shape the page reads. The live feed is produced by pipeline-metrics (#380)
 * and, since #437, published to the metrics-data branch (loaded by the page via
 * jsdelivr) — it is no longer committed to main, so this TC validates the schema
 * against a COMMITTED FIXTURE (tests/fixtures/immune-data.sample.js) rather than
 * the live artifact. The Tier-0 `data.js integrity` check does not police this
 * schema. (2) The immune organ page graph/immune.html (#318 amendment, per this
 * TC's own seam declaration): its page-specific WIRING — ORGANS membership,
 * window.IMMUNE consumption, and the committed raster asset set. Structure /
 * presence / wiring only; every metric VALUE is data the script recomputes each
 * run and is therefore out of contract.
 *
 * NOTE (2026-07-16, Jeremy's ruling): the former "no network fetch at page load"
 * assertion (old P4) is RETIRED. The immune feed is now loaded at runtime (the
 * page resolves the freshest metrics-data commit and loads it from jsdelivr), and
 * data-driven pages fetching their feed is normal on this site — the no-fetch
 * phrasing was exploratory language echoed into #318, not a ratified invariant.
 * The page-wiring half now covers existence, ORGANS membership, IMMUNE
 * consumption, and the raster set (P1–P4).
 *
 * CONTRACT — feed (spec-only authorship; asserted from the "Schema v1 —
 * window.IMMUNE" block in the #380 body; the producer script was NOT read;
 * validated against the committed fixture):
 *   I1  the fixture defines a single window.IMMUNE object.
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
 * CONTRACT — page (#318 amendment; spec-only authorship from the #318 contract
 * block; graph/immune.html was NOT read):
 *   P1  graph/immune.html exists (contract item 1's existence half; the chrome
 *       itself is owned by TC1 #298 and the subnav/active/data-load wiring by
 *       TC3 #300 — both scope dynamically, so the page auto-enters them).
 *   P2  data.js ORGANS carries an immune entry routing to graph/immune.html
 *       (contract item 2 — the subnav tab renders from data). Fields read
 *       defensively (href|url|page), mirroring TC3.
 *   P3  the page's own sources reference IMMUNE — it consumes window.IMMUNE
 *       (contract items 3/4, the wiring half). Sources scanned: immune.html plus
 *       any graph/immune-*.js|jsx sibling.
 *   P4  graph/assets/immune/ exists and holds >=2 raster images (contract item
 *       6: per-instrument crops, plural — not a single positioned overlay).
 *
 * OUT OF SCOPE (by design): every counter/metric VALUE and every array LENGTH beyond
 * bench-non-empty (recomputed each run — data, not contract); the acceptance
 * spot-checks in the #380 body (human/Meta1 validation of the SCRIPT, not standing
 * assertions); one-antibody-PER-bench-entry rendering and all rendered-DOM behavior
 * (runtime — Tier 4 #306); the "no calendar-time rate computation anywhere on the
 * page" rule (runtime behavior, not statically decidable without arbitrary
 * readings); generatedAt's presentation as a subtle "collected" date (editorial);
 * which crops / how the rasters are laid out (editorial); pipeline-metrics.mjs
 * script internals; how/whether the page fetches its feed at runtime (implementation).
 *
 * TEETH: a schema-shape regression — a top-level section dropped, an entry-shape key
 * removed, schemaVersion drift, or an enum field emitting an undeclared token — reds
 * here where the Tier-0 parse check (syntactic only) passes. Enum-membership and the
 * schemaVersion identity are spec-normative value DOMAINS, not editorial content
 * [Confidence: Medium · Inferred from the #380 normative schema block]. On the page
 * half: deleting the page, dropping its ORGANS entry, losing IMMUNE consumption, or
 * losing the committed asset set reds here where TC1/TC3 (chrome/subnav geometry)
 * stay green.
 *
 * Confidence/source per assertion recorded in the authoring [Bond] comments (#380, #318).
 * Zero-dep (node stdlib only), exit 1 on any failure. House loadWindow pattern
 * (mirrors tc-live-display / tc-routes). Run directly or via tests/run.mjs.
 *
 * @covers: tests/fixtures/immune-data.sample.js (window.IMMUNE v1 schema)
 * @covers: graph/immune.html
 * @ignores: metric values + array lengths — runtime / recomputed data
 * @ignores: acceptance spot-checks (history-coupled) — editorial
 * @ignores: page chrome / subnav / active-key / feed load wiring — owned: #298 / #300
 * @ignores: one-antibody-per-bench-entry rendering + all rendered DOM — runtime / Tier 4
 * @ignores: calendar-time rate absence at runtime — runtime / Tier 4
 * @ignores: runtime feed fetch (page loads the metrics-data feed at load) — implementation / Tier 4
 * @ignores: generatedAt "collected" presentation — editorial
 * @ignores: raster crop choice + instrument layout — editorial
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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

// Schema validated against the committed fixture — the live feed moved off-repo
// to the metrics-data branch (#437) and is no longer committed to main.
const win = loadWindow('tests/fixtures/immune-data.sample.js');
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

// ---------------------------------------------------------------------------
// P — organ-page wiring (#318 amendment)
// ---------------------------------------------------------------------------

const PAGE = 'graph/immune.html';

// P1 — the page exists (chrome/subnav geometry owned by TC1/TC3, which scope
// dynamically; this pins the page's existence so their coverage can't go vacuous).
r.check(existsSync(join(ROOT, PAGE)), `${PAGE} does not exist`);

// P2 — ORGANS membership: an entry routes to graph/immune.html (defensive field
// reads, mirroring tc3). data.js is canon, loaded under the window shim.
const site = loadWindow('data.js');
const organs = Array.isArray(site.ORGANS) ? site.ORGANS : [];
const organHref = (o) => String(o.href ?? o.url ?? o.page ?? '');
r.check(organs.some((o) => organHref(o).replace(/^\.?\//, '') === PAGE),
  'data.js ORGANS has no entry routing to graph/immune.html (subnav tab renders from data)');

// Page-local sources: immune.html + any graph/immune-*.js|jsx sibling. (The old
// same-repo immune-data.js is gone — the feed lives on the metrics-data branch —
// so there is no longer a sibling to exclude.)
let pageSources = '';
if (existsSync(join(ROOT, PAGE))) {
  pageSources += rd(PAGE);
  for (const f of readdirSync(join(ROOT, 'graph'))) {
    if (/^immune-.*\.(m?js|jsx)$/.test(f)) {
      pageSources += '\n' + rd(join('graph', f));
    }
  }
}

// P3 — the page consumes window.IMMUNE (wiring, not rendering — render behavior
// is runtime / Tier 4). [Confidence: Medium · Inferred — the spec mandates the
// tiles mount from window.IMMUNE; the consumption idiom is the implementation's.]
r.check(/\bIMMUNE\b/.test(pageSources),
  'the page sources never reference IMMUNE — instruments must mount from window.IMMUNE');

// P4 — committed raster set: per-instrument crops, plural (>=2 images).
const ASSETS = 'graph/assets/immune';
const rasters = existsSync(join(ROOT, ASSETS))
  ? readdirSync(join(ROOT, ASSETS)).filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f))
  : [];
r.check(rasters.length >= 2,
  `graph/assets/immune/ does not hold >=2 raster images (found ${rasters.length}) — spec: per-instrument crops, not one overlay`);

r.done('immune: window.IMMUNE v1 schema (I1–I10, via fixture) + organ-page wiring (P1–P4) checked');
