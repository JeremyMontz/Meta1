# Bond — Contract Test Registry

The map of the coded contract-test corpus: one row per TC. Canonical home is the
repo (this file sits beside the tests it indexes); the vault mirrors it, and it
feeds `agents/bond/bond.html` (brag) per bond.md's teeth > brag > wiki priority.
Full registry tooling is tracked in #317.

| TC  | File                        | Issue | Tier | Asserts                                                                                                                   | Status  |
| --- | --------------------------- | ----- | ---- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| —   | `smoke.test.mjs`            | #294  | —    | Harness canary — runner discovers, executes, and reports a TC                                                             | passing |
| TC1 | `tc1-page-chrome.test.mjs`  | #298  | 1    | Every in-scope `.html` loads data.js + HomeShell/Wordmark/Primitives and has a chrome anchor (`#root` OR `topnav-mount`+`footer-mount`) | passing |

**Scope & exemptions (TC1).** In-scope = all `*.html` minus `_`-prefixed templates
and the stable exempt set: `design-system/index.html` (template); `checkin.html` +
`agents/house/house-entry.html` (data-entry); `canon.html` + `inventory.html`
(inactive backends). Membership is discovered dynamically — **no page count is
asserted** (adding pages is the point).

**Out of scope / deferred.** Subnav-breadcrumb presence → TC3 (#300). Skill-level
TCs (Tier 2/3) → #158. Functional / browser eval → #306.
