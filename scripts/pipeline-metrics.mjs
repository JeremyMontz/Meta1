#!/usr/bin/env node
/* ============================================================================
 * pipeline-metrics.mjs — the immune-system data feed (#380)
 * ----------------------------------------------------------------------------
 * Recomputes the pipeline "immune-system" metrics from the LIVE GitHub API and
 * writes graph/immune-data.js — a single committed `window.IMMUNE` object the
 * immune-system organ page (#318) consumes at load time. This is the DATA half
 * of the pair; the page loads only the committed file, never the API.
 *
 * DESIGN.
 *   - Read-only over the GitHub API, authenticated by the bot PAT.
 *   - FULL recompute every run — no incremental state, no stored cursor. The
 *     output file is a pure artifact: delete it and re-run and you get it back.
 *   - API-only; never a maintained clone.
 *   - Everything is cumulative or per-story. NOTHING is per-calendar-time (no
 *     rates, no recency windows). `generatedAt` is data, not a freshness metric.
 *
 * SCHEMA — window.IMMUNE (v1). See #380 for the normative contract; the metric
 * derivations below each key are the authority for how each number is computed.
 *
 * RUN.  node scripts/pipeline-metrics.mjs [--out graph/immune-data.js]
 *   Auth  : GITHUB_TOKEN | GH_TOKEN env, else the bot PAT from
 *           .claude/config/github_credentials.json (key "pat").
 *   Config: owner/repo/project_id from .claude/config/github.json, overridable
 *           by GH_OWNER / GH_REPO / GH_PROJECT_ID env.
 *
 * Zero runtime deps (Node 20 stdlib: global fetch, node:fs). ~one page of the
 * project board + the bot's PRs + their check-runs + pipeline-item comments.
 * ==========================================================================*/

import { readFileSync, writeFileSync, existsSync, globSync } from 'node:fs';

/* -- config + auth -------------------------------------------------------- */

const BOT = 'meta1-monzter';
const HUMAN = 'JeremyMontz';
const FACTORY_TYPES = new Set(['story', 'bug']);
// The four checks the main ruleset requires (job `name:` in .github/workflows/ci.yml).
const REQUIRED_CHECKS = new Set([
  'Internal links', 'data.js integrity', 'Spellcheck', 'Contract tests',
]);
// Local wall-clock zone for the overnight test (the 1 AM factory build window).
const TZ = process.env.PIPELINE_TZ || 'America/New_York';
// Distinctive phrases the Verifier stamps into a filed-bug body (#353 class).
const BUGFILE_SIG = [/Per the Verifier contract/i, /filed \+ escalated/i];

function findConfig() {
  const envPat = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  let owner = process.env.GH_OWNER, repo = process.env.GH_REPO, projectId = process.env.GH_PROJECT_ID, pat = envPat;
  if (!(owner && repo && projectId && pat)) {
    const patterns = [
      '.claude/config/github.json',
      '/sessions/*/mnt/*/.claude/config/github.json',
      '/sessions/*/mnt/.claude/config/github.json',
    ];
    let dir = null;
    for (const p of patterns) { const hits = globSync(p); if (hits.length) { dir = hits[0].replace(/github\.json$/, ''); break; } }
    if (dir) {
      const cfg = JSON.parse(readFileSync(dir + 'github.json', 'utf8'));
      owner ||= cfg.owner; repo ||= cfg.repo; projectId ||= cfg.project_id;
      if (!pat && existsSync(dir + 'github_credentials.json')) {
        pat = JSON.parse(readFileSync(dir + 'github_credentials.json', 'utf8')).pat;
      }
    }
  }
  if (!(owner && repo && projectId && pat)) {
    throw new Error('missing config/auth: need owner, repo, project_id and a PAT (env or .claude/config).');
  }
  return { owner, repo, projectId, pat };
}

const CFG = findConfig();
const H = { Authorization: `Bearer ${CFG.pat}`, 'User-Agent': 'pipeline-metrics', Accept: 'application/vnd.github+json' };

/* -- HTTP helpers --------------------------------------------------------- */

async function rest(path) {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`REST ${r.status} ${url}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
// Paginate a REST list endpoint via the Link header.
async function restAll(path) {
  let url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  url += (url.includes('?') ? '&' : '?') + 'per_page=100';
  const out = [];
  while (url) {
    const r = await fetch(url, { headers: H });
    if (!r.ok) throw new Error(`REST ${r.status} ${url}: ${(await r.text()).slice(0, 200)}`);
    out.push(...await r.json());
    const link = r.headers.get('link') || '';
    const m = link.match(/<([^>]+)>;\s*rel="next"/);
    url = m ? m[1] : null;
  }
  return out;
}
async function gql(query, variables) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors && !j.data) throw new Error(`GraphQL: ${JSON.stringify(j.errors).slice(0, 300)}`);
  return j.data;
}
// Bounded-concurrency map so a big fan-out does not open hundreds of sockets.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

/* -- project board (GraphQL) ---------------------------------------------- */

const ITEMS_QUERY = `
query($projectId: ID!, $cursor: String) {
  node(id: $projectId) { ... on ProjectV2 {
    items(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        content { ... on Issue {
          number title state url createdAt updatedAt closedAt
          issueType { name }
        } }
        fieldValues(first: 20) { nodes {
          ... on ProjectV2ItemFieldSingleSelectValue { field { ... on ProjectV2SingleSelectField { name } } name }
          ... on ProjectV2ItemFieldTextValue { field { ... on ProjectV2Field { name } } text }
        } }
      }
    }
  } }
}`;

async function fetchItems() {
  const items = [];
  let cursor = null;
  do {
    const data = await gql(ITEMS_QUERY, { projectId: CFG.projectId, cursor });
    const page = (data.node || {}).items || {};
    for (const node of page.nodes || []) {
      const c = node.content;
      if (!c || c.number == null) continue;
      const f = {};
      for (const fv of (node.fieldValues || {}).nodes || []) {
        if (!fv) continue;
        const name = (fv.field || {}).name;
        if (name) f[name] = fv.name ?? fv.text ?? '';
      }
      items.push({
        number: c.number, title: c.title || '', state: c.state || 'OPEN',
        url: c.url, createdAt: c.createdAt, updatedAt: c.updatedAt, closedAt: c.closedAt,
        type: ((c.issueType || {}).name || '').toLowerCase(),
        status: f.Status || '', priority: f.Priority || '',
        build: f.Build || '', tests: f.Tests || '', adjudication: (f.Adjudication || '').toLowerCase(),
      });
    }
    cursor = page.pageInfo && page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return items;
}

/* -- the standing bench (derived from data.js window.TESTS) --------------- */
// window.TESTS is itself derived from tests/*.test.mjs headers (#317), so reading
// it keeps the bench in lockstep with the files CI actually runs — one source.

async function fetchBench() {
  const dataJs = await getFile('data.js');
  const w = {};
  const vm = await import('node:vm');
  vm.runInNewContext(dataJs, { window: w });
  const tests = w.TESTS || [];
  return tests.map(t => ({
    id: t.id,
    issue: t.issue ?? null,
    title: t.title || t.highlight || t.id,
    protects: t.highlight || t.title || '',
  }));
}

async function getFile(path) {
  const j = await rest(`/repos/${CFG.owner}/${CFG.repo}/contents/${path}?ref=main`);
  return Buffer.from(j.content, j.encoding || 'base64').toString('utf8');
}

/* -- bot PRs + their check-runs ------------------------------------------- */

function laneOf(ref) {
  if (ref.startsWith('bond/')) return 'rt';
  if (ref.startsWith('story/') || ref.startsWith('meta1/')) return 'story';
  return 'story';
}
const issueFromRef = (ref) => { const m = ref.match(/(?:story|bond|meta1)\/(\d+)/); return m ? Number(m[1]) : null; };

async function fetchBotPRs() {
  const all = await restAll(`/repos/${CFG.owner}/${CFG.repo}/pulls?state=all`);
  return all
    .filter(p => (p.user || {}).login === BOT)
    .map(p => ({
      number: p.number, ref: p.head.ref, sha: p.head.sha, lane: laneOf(p.head.ref),
      merged: !!p.merged_at, mergedAt: p.merged_at, createdAt: p.created_at,
      state: p.state, issue: issueFromRef(p.head.ref),
    }));
}

// One check-runs read per commit sha -> {name, conclusion, completedAt}[] for the
// four required checks only.
async function checkRuns(sha) {
  try {
    const j = await rest(`/repos/${CFG.owner}/${CFG.repo}/commits/${sha}/check-runs`);
    return (j.check_runs || [])
      .filter(cr => REQUIRED_CHECKS.has(cr.name))
      .map(cr => ({ name: cr.name, conclusion: cr.conclusion, completedAt: cr.completed_at }));
  } catch { return []; }
}

const FAIL = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure']);

/* -- issue comments (verifier engagement, rounds, autonomy, Bond spec-gaps) */

async function comments(n) {
  try { return await restAll(`/repos/${CFG.owner}/${CFG.repo}/issues/${n}/comments`); }
  catch { return []; }
}
const signed = (body, tag) => new RegExp(`\\[${tag}\\]`, 'i').test(body || '');

/* -- main ----------------------------------------------------------------- */

function overnightSpan(startISO, endISO) {
  if (!startISO || !endISO) return false;
  // True if any local hour in [start, end] falls in the 00:00-06:00 window.
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false });
  const start = new Date(startISO).getTime(), end = new Date(endISO).getTime();
  if (!(end >= start)) return false;
  for (let t = start; t <= end + 3600e3; t += 3600e3) {
    const h = Number(fmt.format(new Date(Math.min(t, end))));
    if (h >= 0 && h < 6) return true;
    if (t > end) break;
  }
  return false;
}

async function main() {
  const outPath = (() => { const i = process.argv.indexOf('--out'); return i > -1 ? process.argv[i + 1] : 'graph/immune-data.js'; })();

  const [items, bench, botPRs, allBotIssues] = await Promise.all([
    fetchItems(),
    fetchBench(),
    fetchBotPRs(),
    restAll(`/repos/${CFG.owner}/${CFG.repo}/issues?state=all&creator=${BOT}`),
  ]);

  const pipeline = items.filter(i => FACTORY_TYPES.has(i.type));
  const pipelineByNum = new Map(pipeline.map(i => [i.number, i]));

  /* check-runs across every bot-PR commit (history, so a fixed red still counts) */
  const prCommits = await mapLimit(botPRs, 6, async (pr) => {
    const cs = await restAll(`/repos/${CFG.owner}/${CFG.repo}/pulls/${pr.number}/commits`);
    return cs.map(c => ({ sha: c.sha, date: (c.commit.committer || c.commit.author || {}).date }));
  });
  const shaMeta = new Map(); // sha -> {pr, date}
  botPRs.forEach((pr, idx) => {
    for (const c of prCommits[idx]) if (!shaMeta.has(c.sha)) shaMeta.set(c.sha, { pr: pr.number, date: c.date });
    shaMeta.set(pr.sha, shaMeta.get(pr.sha) || { pr: pr.number, date: pr.createdAt });
  });
  const shas = [...shaMeta.keys()];
  const runsList = await mapLimit(shas, 8, (sha) => checkRuns(sha));
  const runsBySha = new Map(shas.map((s, k) => [s, runsList[k]]));

  // redsCaught: distinct bot PRs with >=1 required-check failure on any commit.
  const redPRs = new Set();
  // pulse: required-check runs across all commits, event-ordered by commit date.
  const pulseAll = [];
  for (const [sha, meta] of shaMeta) {
    for (const cr of runsBySha.get(sha) || []) {
      if (FAIL.has(cr.conclusion)) redPRs.add(meta.pr);
      pulseAll.push({ pr: meta.pr, check: cr.name, conclusion: cr.conclusion || 'pending', _t: meta.date || '' });
    }
  }
  pulseAll.sort((a, b) => String(a._t).localeCompare(String(b._t)));
  const pulse = pulseAll.slice(-20).map(({ pr, check, conclusion }) => ({ pr, check, conclusion }));

  // open red bot PR? (any OPEN bot PR whose head-sha required checks include a failure)
  const openRedPR = botPRs.some(pr => pr.state === 'open'
    && (runsBySha.get(pr.sha) || []).some(cr => FAIL.has(cr.conclusion)));

  /* per-PR first-CI-green time -> per-story wall clock */
  function firstGreen(pr, idx) {
    // earliest commit (by date) where ALL four required checks concluded success
    const commits = [...prCommits[idx], { sha: pr.sha, date: pr.createdAt }]
      .filter(c => runsBySha.has(c.sha))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    for (const c of commits) {
      const rs = runsBySha.get(c.sha) || [];
      const names = new Set(rs.map(r => r.name));
      const allReq = [...REQUIRED_CHECKS].every(n => names.has(n));
      const allOk = rs.length && rs.every(r => r.conclusion === 'success');
      if (allReq && allOk) {
        const done = rs.map(r => r.completedAt).filter(Boolean).sort().pop();
        return done || c.date;
      }
    }
    return null;
  }

  /* comments on pipeline items */
  const commentTargets = [...new Set(pipeline.map(i => i.number))];
  const commentList = await mapLimit(commentTargets, 8, (n) => comments(n));
  const commentsByNum = new Map(commentTargets.map((n, k) => [n, commentList[k]]));

  /* stories[] : pipeline items that have a bot PR (built), one row each */
  const prByIssue = new Map();
  botPRs.forEach((pr, idx) => {
    if (pr.issue == null) return;
    if (!prByIssue.has(pr.issue)) prByIssue.set(pr.issue, []);
    prByIssue.get(pr.issue).push({ pr, idx });
  });
  const stories = [];
  for (const [issue, prs] of [...prByIssue].sort((a, b) => a[0] - b[0])) {
    if (!pipelineByNum.has(issue)) continue; // only real factory items
    // Primary = the ORIGINATING build (earliest-created story-lane PR), not the
    // latest. A same-day follow-up PR (e.g. story/318-layout) must not shadow the
    // first build — that masked #318's 04:11 ET overnight build behind an evening PR.
    const byCreated = (a, b) => a.pr.createdAt.localeCompare(b.pr.createdAt);
    const primary = prs.filter(x => x.pr.lane === 'story').sort(byCreated)[0]
                 || [...prs].sort(byCreated)[0];
    const cs = commentsByNum.get(issue) || [];
    const rounds = cs.filter(c => signed(c.body, 'Assessor')).length;
    const green = firstGreen(primary.pr, primary.idx);
    const startISO = primary.pr.createdAt;
    const wallClockHours = green ? +(Math.max(0, new Date(green) - new Date(startISO)) / 3.6e6).toFixed(2) : null;
    stories.push({
      issue, lane: primary.pr.lane, rounds,
      wallClockHours,
      overnight: green ? overnightSpan(startISO, green) : false,
    });
  }

  /* escalations + record */
  const record = [];
  // (a) filed bugs: bot-created issues carrying the Verifier bug-file signature.
  const filedBugs = allBotIssues.filter(it => !it.pull_request
    && BUGFILE_SIG.some(re => re.test(it.body || '')));
  for (const b of filedBugs) record.push({ type: 'bug-filed', issue: b.number, date: (b.created_at || '').slice(0, 10), title: b.title });
  // (b) terminal adjudication on stories: spec-gap / thrash-cap.
  let specGap = 0, thrashCap = 0;
  for (const it of pipeline) {
    if (it.adjudication === 'spec-gap') { specGap++; record.push({ type: 'spec-gap', issue: it.number, date: (it.updatedAt || '').slice(0, 10), title: it.title }); }
    if (it.adjudication === 'thrash-cap') { thrashCap++; record.push({ type: 'thrash-cap', issue: it.number, date: (it.updatedAt || '').slice(0, 10), title: it.title }); }
  }
  // (c) Bond author-time spec-gaps (Adjudication empty by design) -> signed [Bond] spec-gap comment.
  for (const [n, cs] of commentsByNum) {
    if (cs.some(c => signed(c.body, 'Bond') && /spec[\s-]?gap/i.test(c.body || ''))) {
      const it = pipelineByNum.get(n);
      specGap++;
      record.push({ type: 'spec-gap', issue: n, date: (it ? it.updatedAt : '').slice(0, 10), title: it ? it.title : '' });
    }
  }
  const bugFiled = filedBugs.length;
  record.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  /* verifier engagements: distinct pipeline items with a signed [Assessor] comment */
  let verifierEngagements = 0;
  for (const [, cs] of commentsByNum) if (cs.some(c => signed(c.body, 'Assessor'))) verifierEngagements++;

  /* autonomy */
  const botCommitCount = prCommits.flat().length;
  let botComments = 0, humanComments = 0;
  for (const [, cs] of commentsByNum) for (const c of cs) {
    const login = (c.user || {}).login;
    if (login === BOT) botComments++;
    else if (login === HUMAN) humanComments++;
  }
  const mergedBotPRs = botPRs.filter(p => p.merged);
  const humanCloses = pipeline.filter(i => i.state !== 'OPEN').length; // bot never closes (Refs, not Closes)
  const autonomy = {
    agentEvents: botPRs.length + botCommitCount + botComments,
    humanEvents: mergedBotPRs.length + humanComments + humanCloses,
  };

  /* current vitals */
  const blockedIssues = pipeline.filter(i => (i.status || '').toLowerCase() === 'blocked').map(i => i.number).sort((a, b) => a - b);
  const reconciling = pipeline.some(i => i.adjudication === 'reconciling');
  const temperature = blockedIssues.length ? 'fever' : (reconciling || openRedPR ? 'elevated' : 'normal');
  const whiteCell = (reconciling || openRedPR) ? 'engaged' : (blockedIssues.length ? 'standby' : 'dormant');

  /* counters */
  const counters = {
    benchSize: bench.length,
    storiesShipped: mergedBotPRs.length,
    redsCaught: redPRs.size,
    escalations: { specGap, thrashCap, bugFiled },
    verifierEngagements,
  };

  /* incubation: board items each controller has stamped a field on.
   * built / reviewed span story+bug (FACTORY_TYPES); tested also spans tasks
   * because Bond stamps Tests on TC-authoring task items. */
  const hasVal = (v) => !!(v && String(v).trim());
  const TESTED_TYPES = new Set(['story', 'bug', 'task']);
  const incubation = {
    built: pipeline.filter(i => hasVal(i.build)).length,
    tested: items.filter(i => TESTED_TYPES.has(i.type) && hasVal(i.tests)).length,
    reviewed: pipeline.filter(i => hasVal(i.adjudication)).length,
  };

  const IMMUNE = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    bench,
    counters,
    incubation,
    autonomy,
    stories,
    pulse,
    current: { temperature, whiteCell, blockedIssues },
    record,
  };

  const header =
`/* ============================================================================
 * immune-data.js * CLAUDEMONZTER - pipeline immune-system feed
 * ----------------------------------------------------------------------------
 * GENERATED by scripts/pipeline-metrics.mjs from the live GitHub API - do NOT
 * hand-edit. Full recompute each run; the file is a pure artifact. Consumed by
 * the immune-system organ page (#318). Schema v1 (#380). All values cumulative
 * or per-story; nothing per-calendar-time. generatedAt is data, not freshness.
 *
 * Attribution footnote: autonomy events are by-account - agentEvents are actions
 * by ${BOT} (PR opens, commits, comments on pipeline items); humanEvents are
 * ${HUMAN}'s merges (every merged bot PR - the bot cannot merge), comments, and
 * closes (the bot never closes; it refs). ==========================================================================*/
window.IMMUNE = ${JSON.stringify(IMMUNE, null, 2)};
`;
  writeFileSync(outPath, header);
  console.error(`wrote ${outPath}: bench=${bench.length} stories=${stories.length} shipped=${counters.storiesShipped} reds=${counters.redsCaught} record=${record.length} incu=${incubation.built}/${incubation.tested}/${incubation.reviewed} temp=${temperature}`);
}

main().catch(e => { console.error(e.stack || String(e)); process.exit(1); });
