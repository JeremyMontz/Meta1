# Bond — Contract Test Registry

The map of the coded contract-test corpus: one row per TC. Canonical home is the
repo (this file sits beside the tests it indexes); the vault mirrors it, and it
feeds `agents/bond/bond.html` (brag) per bond.md's teeth > brag > wiki priority.
Full registry tooling is tracked in #317.

**Status = existence, not pass/fail.** GitHub CI owns pass/fail; this column
tracks a TC's lifecycle in the bench: `pending` (claimed, authoring) →
`authored` (test written, PR open) → `live` (merged into `main`). The
`pending`/`authored` states are the bond-author skill's `Tests` issue-field and
appear only on in-flight branches; on `main` a row is `live` (or `retired`). The
`authored → live` flip is a human post-merge step in a 1:1.


| TC  | File                        | Issue | Tier | Asserts                                                                                                                   | Status  |
| --- | --------------------------- | ----- | ---- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| —   | `smoke.test.mjs`            | #294  | —    | Harness canary — runner discovers, executes, and reports a TC                                                             | live |
| TC1 | `tc1-page-chrome.test.mjs`  | #298  | 1    | Every in-scope `.html` loads data.js + HomeShell/Wordmark/Primitives and has a chrome anchor (`#root` OR `topnav-mount`+`footer-mount`) | live |
| TC2 | `tc2-agent-completeness.test.mjs` | #299 | 1 | Every `window.AGENTS` agent is coherent across 6 rosters + project-agreement, and has page + portrait trio + graph node + wired page config + non-empty identity fields | live |
| TC3 | `tc3-organ-structural.test.mjs` | #300 | 1 | Every `window.ORGANS` entry (body.html excepted) wires its GraphSubnav, sets `active="<id>"` matching its ORGANS id (case-insensitive), and loads `graph/<stem>-data.js` when one exists; existence ceded to #334, checked-count guard prevents vacuity | authored |
| articles | `tc-articles.test.mjs` | #332 | 1 | `writing/*.html` ⇄ ARTICLES bijection (data-derived HISTORY exemption) + per-article metadata (date MM.DD.YY, demonstrates→COMPETENCIES) + page slots (article-title/subtitle, og:description, active="WRITING") | live |
| about | `tc-about.test.mjs` | #344 | 1 | `about/*.html` ⇄ ABOUT_PAGES bijection (href-keyed; `id` is an uppercase token = subnav `active`) + per-entry id/href non-empty + page slots (about-subnav active="<id>", chrome active="ABOUT", og:description) | authored |
| index | `tc-index.test.mjs` | #340 | 1 | Homepage shell (`index.html`: `window.PAGE_HOME` + mounts `<HomeMain/>` + loads its source) + **mount-aware** section composition in `HomeMain.jsx` — `<AgentGraph`/`<LiveActivity`/`<PortfolioTeaser`/`<WritingList` actually mounted (catches #361 define-but-don't-mount). About check dropped — section moved to about/ai.html (#361). Pass-1 structural; snapshot deferred to pass 2 | authored |

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

**Scope & special-cases (TC3, #300).** Denominator = `window.ORGANS` (canon),
loaded under a window shim (as tc2/articles do). Each entry maps to its own
organ page by `href`; for each (body excepted) the page must (A) wire the
`GraphSubnav` component, (B) carry `active="<id>"` matching its ORGANS id —
**case-insensitive**, because a *wrong-organ* key is the tooth while mere casing
is not a mismatch — and (C) load `graph/<stem>-data.js` **only if that file
exists** (self-gating, so an organ without a data file is valid). Field names are
read defensively (`id|key|slug`, `href|url|page`) so a benign rename can't
false-red. **Exception:** `graph/body.html` is the "Body" subnav *parent*, not an
organ — excluded by href (mirrors tc2's structural special-cases). **Boundary:**
file-*existence* of ORGANS hrefs is owned by route-validity (#334); TC3 owns "the
page wires itself," skips absent files, and a checked-count guard (`>=1`) keeps
the skip from going vacuous. No organ count is asserted (adding an organ is the
point). Out of scope: live-data read-path (#336), unique per-organ content
(standalone organ TCs #337/#338/#339), src resolution (check-links CI),
rendered-DOM runtime (Tier 4, #306).

**Scope & exemptions (about, #344).** Denominator = `window.ABOUT_PAGES` (canon); in-scope files = `about/*.html` minus `_`-prefixed templates. Bijection is **href-keyed** (each entry carries `href` = the page path and an **uppercase `id` token** the page passes as `<AboutSubnav active="…"/>`); the path is NOT derived from `id`. No hardcoded page list, so a 4th about page needs no test edit. Per-page slots: about-subnav `active="<id>"`, chrome `active="ABOUT"`, non-empty `og:description`. **Hero `<h1>` is intentionally NOT asserted** — the #344 body listed it, but about heroes are heterogeneous (human=1 h1, history=2, **ai=0**: an "operating table" hero); requiring it would red on good behavior. og:description carries the non-empty-identity check. Flagged for a #344 contract amendment (found 2026-06-30 greening PR #350). Out of scope: content quality and the history month-graph *list* inside `about/history.html` (owned by #335) — history is checked only as a section page.

**Out of scope / deferred.** Skill-level TCs (Tier 2/3) → #158. Functional /
browser eval → #306. (Subnav-breadcrumb presence is now authored as TC3 (#300),
above.)

