# Bond — Contract Test Registry

The map of the coded contract-test corpus: one row per TC. Canonical home is the
repo (this file sits beside the tests it indexes); the vault mirrors it, and it
feeds `agents/bond/bond.html` (brag) per bond.md's teeth > brag > wiki priority.
Full registry tooling is tracked in #317.

| TC  | File                        | Issue | Tier | Asserts                                                                                                                   | Status  |
| --- | --------------------------- | ----- | ---- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| —   | `smoke.test.mjs`            | #294  | —    | Harness canary — runner discovers, executes, and reports a TC                                                             | passing |
| TC1 | `tc1-page-chrome.test.mjs`  | #298  | 1    | Every in-scope `.html` loads data.js + HomeShell/Wordmark/Primitives and has a chrome anchor (`#root` OR `topnav-mount`+`footer-mount`) | passing |
| TC2 | `tc2-agent-completeness.test.mjs` | #299 | 1 | Every `window.AGENTS` agent is coherent across 6 rosters + project-agreement, and has page + portrait trio + graph node + wired page config + non-empty identity fields | passing |

**Scope & exemptions (TC1).** In-scope = all `*.html` minus `_`-prefixed templates
and the stable exempt set: `design-system/index.html` (template); `checkin.html` +
`agents/house/house-entry.html` (data-entry); `canon.html` + `inventory.html`
(inactive backends). Membership is discovered dynamically — **no page count is
asserted** (adding pages is the point).

**Scope & special-cases (TC2).** Denominator = `window.AGENTS` (canon). The six
coherence rosters are `FACE_TABS` + `LAYOUT` (faces.html), `DOMAIN_TABS`
(dashboard.html), `POSITIONS` + `GRAPH_COLORS` (AgentGraph.jsx), and
`DOMAIN_PROJECT` (spirit-data.js); project-agreement cross-checks
`DOMAIN_PROJECT[id]` against `AGENTS[id].project`. Two structural exceptions:
`jeremy` (human) is in every roster **except** `DOMAIN_PROJECT` (appended live)
and aliases to the `unknown` portrait; `monzter` is the **LAYOUT-only**
decorative core (portrait `claudemonzter`). Required-non-empty covers **authored
identity only** (`name`/`role`/`blurb`, page `og:description` + hero `h1`).
Out of scope: `AGENT_ARTIFACTS` population, live status/persona/sessions
(NO-DATA is a valid state), content quality, and graph-node position
correctness. CI-blind surfaces (vault §Persona, persona-matrix & checkin Sheets,
skill routing tables) live in the onboard-an-agent runbook (#327) and #292's
relocation checklist.

**Out of scope / deferred.** Subnav-breadcrumb presence → TC3 (#300). Skill-level
TCs (Tier 2/3) → #158. Functional / browser eval → #306.
